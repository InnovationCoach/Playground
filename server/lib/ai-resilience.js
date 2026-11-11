/**
 * AI Resilience & Error Handling Utilities for WeLearn SPARK API.
 * 
 * Provides:
 * - Upstream error classification (429 Quota/Rate Limits, 503 Overload/Unavailable, 504 Timeout)
 * - Automatic single-bounded retry with backoff for transient 429/503 errors
 * - Execution timeout guards so learners are never hung on slow responses
 * - Friendly client-facing fallbacks
 * - Memory-leak-free rate limiter with proactive TTL pruning
 */

export class TimeoutError extends Error {
  constructor(message = 'Request timed out waiting for AI response') {
    super(message);
    this.name = 'TimeoutError';
    this.status = 504;
    this.code = 'GATEWAY_TIMEOUT';
  }
}

/**
 * Classifies an error from Google Generative AI or network.
 * Returns 429, 502, 503, 504, 400, or 500.
 */
export function getGeminiErrorStatus(err) {
  if (!err) return 500;
  if (err.code === 'AI_NOT_CONFIGURED') return 503;
  if (err.code === 'MODEL_UNAVAILABLE') return 502;
  if (err.status === 429 || err.statusCode === 429) return 429;
  if (err.status === 503 || err.statusCode === 503) return 503;
  if (err.status === 504 || err.statusCode === 504 || err.name === 'TimeoutError') return 504;
  if (err.status === 404 || err.statusCode === 404) return 502;
  if (err.status === 401 || err.statusCode === 401 || err.status === 403 || err.statusCode === 403) return 503;
  if (err.status === 400 || err.statusCode === 400) return 400;

  const msg = String(err.message || '').toLowerCase();
  if (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  ) {
    return 429;
  }
  if (
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('not supported') ||
    msg.includes('unsupported model') ||
    msg.includes('invalid model')
  ) {
    return 502;
  }
  if (
    msg.includes('api_key_invalid') ||
    msg.includes('api key not valid') ||
    msg.includes('unauthenticated') ||
    msg.includes('permission_denied')
  ) {
    return 503;
  }
  if (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('overload') ||
    msg.includes('high demand') ||
    msg.includes('service unavailable')
  ) {
    return 503;
  }
  if (msg.includes('504') || msg.includes('timeout') || msg.includes('timed out')) {
    return 504;
  }

  return err.status || 500;
}

/**
 * Maps an AI error and HTTP status to a safe public error category code.
 */
export function getGeminiErrorCode(err, status = getGeminiErrorStatus(err)) {
  if (err?.code === 'AI_NOT_CONFIGURED') return 'AI_NOT_CONFIGURED';
  if (err?.code === 'MODEL_UNAVAILABLE' || status === 502) return 'MODEL_UNAVAILABLE';
  if (status === 429) return 'RATE_LIMIT_EXCEEDED';
  if (status === 504) return 'GATEWAY_TIMEOUT';
  if (status === 503) {
    const msg = String(err?.message || '').toLowerCase();
    if (
      err?.status === 401 ||
      err?.status === 403 ||
      msg.includes('api_key_invalid') ||
      msg.includes('api key not valid')
    ) {
      return 'AI_NOT_CONFIGURED';
    }
    return 'SERVICE_UNAVAILABLE';
  }
  return 'AI_SERVICE_ERROR';
}

/**
 * Executes an async operation with bounded retry and backoff on 429/503 errors.
 */
export async function executeWithRetry(operation, maxRetries = 1, baseBackoffMs = 1000) {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err) {
      attempt++;
      const status = getGeminiErrorStatus(err);
      const code = getGeminiErrorCode(err, status);
      if ((status === 429 || (status === 503 && code === 'SERVICE_UNAVAILABLE')) && attempt <= maxRetries) {
        const delay = baseBackoffMs * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Wraps an async promise with a strict timeout.
 * If fallback is provided, returns fallback on timeout; otherwise throws TimeoutError.
 */
export async function withTimeout(promise, timeoutMs = 12000, fallback = undefined) {
  let timer;
  const timeoutPromise = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      if (fallback !== undefined) {
        resolve(typeof fallback === 'function' ? fallback() : fallback);
      } else {
        reject(new TimeoutError(`AI operation exceeded timeout of ${timeoutMs}ms`));
      }
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Standardized AI error handler for Express routes.
 * Logs ONLY safe metadata (endpoint, model, status, code, requestId, durationMs).
 * Never logs tokens, prompts, learner details, or raw provider URLs/messages.
 */
export function handleAiError(res, error, endpoint, fallbackMessage, meta = {}) {
  const status = getGeminiErrorStatus(error);
  const code = getGeminiErrorCode(error, status);
  const requestId = meta.requestId || res.getHeader?.('X-Request-Id') || undefined;
  const durationMs = typeof meta.startedAt === 'number' ? Math.max(0, Date.now() - meta.startedAt) : undefined;
  const model = meta.model || 'unknown';

  if (requestId && typeof res.set === 'function') {
    res.set('X-Request-Id', requestId);
  }

  console.error('[AI Error]', {
    endpoint,
    model,
    status,
    code,
    ...(requestId ? { requestId } : {}),
    ...(durationMs !== undefined ? { durationMs } : {})
  });

  const payload = (extra) => ({
    ...extra,
    ...(requestId ? { requestId } : {})
  });

  if (code === 'AI_NOT_CONFIGURED') {
    return res.status(503).json(payload({
      error: 'The AI service is not configured on this server.',
      code: 'AI_NOT_CONFIGURED'
    }));
  }

  if (code === 'MODEL_UNAVAILABLE') {
    return res.status(502).json(payload({
      error: 'The configured AI model is unavailable or unsupported.',
      code: 'MODEL_UNAVAILABLE'
    }));
  }

  if (status === 429) {
    res.set('Retry-After', '5');
    return res.status(429).json(payload({
      error: 'The AI tutor is receiving too many requests right now. Please try again in a few seconds.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 5
    }));
  }

  if (status === 503) {
    res.set('Retry-After', '3');
    return res.status(503).json(payload({
      error: 'The AI service is experiencing a sudden spike in demand. Please try again in a moment.',
      code: 'SERVICE_UNAVAILABLE',
      retryAfter: 3
    }));
  }

  if (status === 504) {
    return res.status(504).json(payload({
      error: 'The AI response took longer than expected. Please try again.',
      code: 'GATEWAY_TIMEOUT'
    }));
  }

  return res.status(500).json(payload({
    error: fallbackMessage || 'The AI service is unavailable right now.',
    code: 'AI_SERVICE_ERROR'
  }));
}

/**
 * Memory-safe rate limiter with TTL cleanup.
 * Prevents memory leak in server process across requests.
 */
export function createRateLimiter({ maxEntries = 500 } = {}) {
  const store = new Map();

  function prune(now = Date.now()) {
    for (const [key, record] of store.entries()) {
      if (record.resetAt <= now) {
        store.delete(key);
      }
    }
  }

  return {
    check(key, maxRequests = 10, windowMs = 60000) {
      const now = Date.now();
      if (store.size >= maxEntries) {
        prune(now);
      }

      let record = store.get(key);
      if (!record || record.resetAt <= now) {
        record = { count: 1, resetAt: now + windowMs };
        store.set(key, record);
        return true;
      }

      record.count += 1;
      return record.count <= maxRequests;
    },
    prune,
    clear() {
      store.clear();
    },
    size() {
      return store.size;
    }
  };
}

/**
 * Friendly fallbacks for endpoints to ensure the learner UI never breaks on timeouts.
 */
export function getFriendlyFeedbackFallback(challengeTitle, score) {
  const scoreNum = Number(score) || 0;
  return {
    feedback: `Great effort on "${challengeTitle || 'this activity'}"! You completed the challenge with a score of ${scoreNum}%. Review your steps and try the next challenge to keep advancing your skills.`,
    isFallback: true,
    timestamp: new Date().toISOString()
  };
}
