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
 * Returns 429, 503, 504, 400, or 500.
 */
export function getGeminiErrorStatus(err) {
  if (!err) return 500;
  if (err.status === 429 || err.statusCode === 429) return 429;
  if (err.status === 503 || err.statusCode === 503) return 503;
  if (err.status === 504 || err.statusCode === 504 || err.name === 'TimeoutError') return 504;
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
      if ((status === 429 || status === 503) && attempt <= maxRetries) {
        const delay = baseBackoffMs * attempt;
        console.warn(`[AI Retry] Upstream returned status ${status}. Retrying (attempt ${attempt}/${maxRetries}) after ${delay}ms...`);
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
 * Logs full diagnostic error with endpoint name and sends correctly mapped status code.
 */
export function handleAiError(res, error, endpoint, fallbackMessage) {
  const status = getGeminiErrorStatus(error);
  console.error(`[AI Error: ${endpoint}] Status: ${status} | Message: ${error?.message || error}`);
  if (error?.stack) {
    console.error(`[AI Error: ${endpoint} Stack]:`, error.stack);
  }

  if (status === 429) {
    res.set('Retry-After', '5');
    return res.status(429).json({
      error: 'The AI tutor is receiving too many requests right now. Please try again in a few seconds.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 5
    });
  }

  if (status === 503) {
    res.set('Retry-After', '3');
    return res.status(503).json({
      error: 'The AI service is experiencing a sudden spike in demand. Please try again in a moment.',
      code: 'SERVICE_UNAVAILABLE',
      retryAfter: 3
    });
  }

  if (status === 504) {
    return res.status(504).json({
      error: 'The AI response took longer than expected. Please try again.',
      code: 'GATEWAY_TIMEOUT'
    });
  }

  return res.status(500).json({
    error: fallbackMessage || 'The AI service is unavailable right now.',
    code: 'AI_SERVICE_ERROR'
  });
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
