import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  SAFETY_SETTINGS,
  PERSONAS,
  buildPersonaInstruction,
  buildSystemInstruction,
  resolveAgeBand,
  resolveCohort,
  wrapStudentInput,
  extractText
} from './safety.js';
import { initAdmin, requireAuth, logConversation, flagForReview } from './auth.js';
import { sendError } from './lib/errors.js';
import {
  executeWithRetry,
  withTimeout,
  handleAiError,
  createRateLimiter,
  getFriendlyFeedbackFallback
} from './lib/ai-resilience.js';
import { getFirestore } from 'firebase-admin/firestore';
import {
  normalizePblUnit,
  PblUnitSchema,
  validateRequestedCompetencies
} from '../shared/pblUnitSchema.js';

import sessionRouter from './routes/session.js';
import adminUsersRouter from './routes/admin-users.js';
import coachStudentsRouter from './routes/coach-students.js';
import referenceRouter from './routes/reference.js';
import operationsRouter from './routes/operations.js';
import pilotOperationsRouter from './routes/pilot-operations.js';
import parentsRouter from './routes/parents.js';
import ltiRouter from './routes/lti.js';
import oneRosterRouter from './routes/oneroster.js';
import createLearnerRouter from './routes/create-learner.js';
import canvaRouter from './routes/canva.js';
import { createUniverseRouter } from './routes/universe.js';
import { createCoachUniverseRouter } from './routes/coach-universe.js';
import { createUniverseRegistry } from './lib/universe/missions.js';
import { sendUniverseError } from './lib/universe/http.js';

import schoolWorkspaceRouter from './routes/school-workspace.js';
import personalizationRouter from './routes/personalization.js';
import questRouter from './routes/quest.js';
import { createSparkTutorRouter } from './routes/spark-tutor.js';
import masteryRouter from './routes/mastery.js';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const MODEL_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/;
const REQUEST_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const THINKING_OFF = { thinkingBudget: 0 };

/**
 * Resolves Gemini API key and model selection at app initialization time
 * (after dotenv.config() has loaded environment variables).
 * Never substitutes a dummy key.
 */
export function resolveGeminiConfig(options = {}) {
  const rawKey = options.geminiApiKey !== undefined ? options.geminiApiKey : process.env.GEMINI_API_KEY;
  const apiKey = typeof rawKey === 'string' ? rawKey.trim() : '';
  const hasValidKey = Boolean(apiKey && apiKey !== 'NOT_CONFIGURED' && apiKey !== 'dev-dummy-key');

  const rawModel = options.geminiModel !== undefined
    ? options.geminiModel
    : (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL);
  const modelName = typeof rawModel === 'string' ? rawModel.trim() : '';
  const modelValid = Boolean(modelName && MODEL_ID_PATTERN.test(modelName));

  return {
    apiKey: hasValidKey ? apiKey : '',
    modelName: modelName || DEFAULT_GEMINI_MODEL,
    modelValid,
    configured: Boolean(hasValidKey && modelValid)
  };
}

function assignRequestId(req, res) {
  if (req.requestId) return req.requestId;
  const incoming = req.headers?.['x-request-id'];
  const requestId = typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming.trim())
    ? incoming.trim()
    : randomUUID();
  req.requestId = requestId;
  res.set('X-Request-Id', requestId);
  return requestId;
}

export function createApp(options = {}) {
  const app = express();
  const universeRegistry = createUniverseRegistry(options.universeRegistry);

  const geminiConfig = resolveGeminiConfig(options);
  const customAdapter = options.modelAdapter || null;
  const synthesizeTimeoutMs = Number(options.aiTimeoutMs) > 0 ? Number(options.aiTimeoutMs) : 45000;
  const auditTimeoutMs = Number(options.auditTimeoutMs) > 0 ? Number(options.auditTimeoutMs) : 2500;
  const retryBackoffMs = Number(options.retryBackoffMs) >= 0 ? Number(options.retryBackoffMs) : 1000;

  let sdkModel = null;
  if (!customAdapter && geminiConfig.configured) {
    const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);
    sdkModel = genAI.getGenerativeModel({ model: geminiConfig.modelName, safetySettings: SAFETY_SETTINGS });
  }

  app.locals.geminiConfig = {
    model: geminiConfig.modelName,
    configured: Boolean(customAdapter || geminiConfig.configured),
    modelValid: geminiConfig.modelValid
  };

  function getActiveModel() {
    if (!geminiConfig.modelValid) {
      const err = new Error('The configured AI model is invalid or unsupported.');
      err.status = 502;
      err.code = 'MODEL_UNAVAILABLE';
      throw err;
    }
    if (customAdapter) {
      if (typeof customAdapter === 'function') {
        return { generateContent: customAdapter };
      }
      if (typeof customAdapter.generateContent === 'function') {
        return customAdapter;
      }
    }
    if (sdkModel) {
      return sdkModel;
    }
    const err = new Error('The AI service is not configured on this server.');
    err.status = 503;
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  initAdmin();

  // Robust CORS configuration supporting production domains, preview channels, and local development
  const configuredOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (configuredOrigins.length === 0) {
    configuredOrigins.push('https://welearn.org', 'http://localhost:5173', 'http://127.0.0.1:5173');
  }

  app.use(cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. server-side, curl, mobile apps without origin header)
      if (!origin) return callback(null, true);

      // Strip any trailing dots (e.g. FQDN https://domain.web.app.)
      const normalizedOrigin = origin.replace(/\.+$/, '');

      // Explicitly configured frontend origins
      if (configuredOrigins.includes(origin) || configuredOrigins.includes(normalizedOrigin)) return callback(null, true);

      // Firebase hosting production and preview domains
      if (/^https:\/\/dnd-master-73449(--[a-z0-9-]+)?\.(web\.app|firebaseapp\.com)$/.test(normalizedOrigin)) {
        return callback(null, true);
      }

      // In non-production, allow any localhost/127.0.0.1 port
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Universe-Contract-Version', 'X-Request-Id'],
    exposedHeaders: ['X-Universe-Contract-Version', 'X-Request-Id', 'Retry-After']
  }));
  app.use(express.json({
    limit: '8mb',
    verify: (req, _res, buf) => {
      req.rawBodyBytes = buf.byteLength;
    }
  }));

  // Memory-safe rate limiter with automatic pruning
  const rateLimiter = createRateLimiter({ maxEntries: 1000 });
  function checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
    return rateLimiter.check(key, maxRequests, windowMs);
  }

  // Root & health check
  app.get('/', (req, res) => {
    res.json({
      name: 'WeLearn API Server',
      status: 'online',
      healthCheck: '/health'
    });
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      model: geminiConfig.modelName,
      aiConfigured: app.locals.geminiConfig.configured,
      timestamp: new Date().toISOString()
    });
  });

  // ============= NEW PHASE 0 CONTRACT ENDPOINTS =============
  app.use('/api', sessionRouter);
  app.use('/api/admin/users', adminUsersRouter);
  app.use('/api/coach/students', coachStudentsRouter);
  app.use('/api/admin', referenceRouter);
  app.use('/api/admin', operationsRouter);
  app.use('/api/pilot', pilotOperationsRouter);
  app.use('/api', parentsRouter);
  app.use('/api/lti', ltiRouter);
  app.use('/api/oneroster/v1p1', oneRosterRouter);
  app.use('/api/coach/learners', requireAuth, createLearnerRouter);
  app.use('/api/canva', canvaRouter);
  app.use('/api/universe', createUniverseRouter({ getRegistry: () => universeRegistry }));
  app.use('/api/coach/universe', createCoachUniverseRouter({ getRegistry: () => universeRegistry }));

  app.use('/api', schoolWorkspaceRouter);
  app.use('/api', personalizationRouter);
  app.use('/api', questRouter);
  app.use('/api/spark-tutor', createSparkTutorRouter({
    adapter: options.sparkTutorAdapter,
    engine: options.sparkTutorEngine,
    rateLimiter: options.sparkTutorRateLimiter,
    rateLimitMaxRequests: options.sparkTutorRateLimitMaxRequests,
    rateLimitWindowMs: options.sparkTutorRateLimitWindowMs
  }));
  app.use('/api/mastery', masteryRouter);

  // ============= EXISTING AI ENDPOINTS =============
  async function callGemini(prompt, maxOutputTokens = 256, opts = {}) {
    const { cohort, ageBand, uid, endpoint = 'unknown', systemExtra = '' } = opts;
    const band = resolveCohort(cohort || ageBand);
    const activeModel = getActiveModel();

    const result = await executeWithRetry(
      () => activeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: buildSystemInstruction(band, systemExtra) }] },
        generationConfig: { maxOutputTokens, temperature: 0.7, topP: 0.9, thinkingConfig: THINKING_OFF }
      }),
      1,
      retryBackoffMs
    );

    const { text, blocked, reason } = extractText(result);
    await logConversation({ uid, prompt, reply: text, blocked, blockReason: reason, endpoint, ageBand: band });
    if (blocked) {
      await flagForReview({ uid, reason, prompt, endpoint });
    }
    return text;
  }

  async function callGeminiWithImage(prompt, image, maxOutputTokens = 700, opts = {}) {
    const { cohort, ageBand, uid, endpoint = 'unknown', systemExtra = '' } = opts;
    const band = resolveCohort(cohort || ageBand);
    const activeModel = getActiveModel();
    const parts = [{ text: prompt }];
    if (image?.base64 && image?.mimeType) {
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
    }

    const result = await executeWithRetry(
      () => activeModel.generateContent({
        contents: [{ role: 'user', parts }],
        systemInstruction: { parts: [{ text: buildSystemInstruction(band, systemExtra) }] },
        generationConfig: { maxOutputTokens, temperature: 0.6, topP: 0.9, thinkingConfig: THINKING_OFF }
      }),
      1,
      retryBackoffMs
    );

    const { text, blocked, reason } = extractText(result);
    await logConversation({ uid, prompt, reply: text, blocked, blockReason: reason, endpoint, ageBand: band });
    if (blocked) {
      await flagForReview({ uid, reason, prompt, endpoint });
    }
    return text;
  }

  // Course drafting rate limiters (20/hr, 200/day per user)
  const courseDraftHourlyLimiter = createRateLimiter({ maxEntries: 1000 });
  const courseDraftDailyLimiter = createRateLimiter({ maxEntries: 1000 });

  function requireCoachOrAdmin(req, res, next) {
    if (!req.user || req.user.unverified) {
      return res.status(403).json({ error: 'Access denied: verified coach or admin account required.', code: 'FORBIDDEN' });
    }
    const role = req.user?.role;
    if (role !== 'teacher' && role !== 'coach' && role !== 'admin' && role !== 'supervisor') {
      return res.status(403).json({ error: 'Access denied: coaches and administrators only.', code: 'FORBIDDEN' });
    }
    next();
  }

  function forbidParents(req, res, next) {
    if (req.user?.role === 'parent') {
      return res.status(403).json({ error: 'Parents cannot access student learning tools.', code: 'FORBIDDEN' });
    }
    next();
  }

  function translateTraitsToLearningNeeds(traits) {
    if (!traits) return [];
    const list = Array.isArray(traits) ? traits : String(traits).split(/[,;]/);
    const needs = new Set();
    for (const raw of list) {
      const item = String(raw ?? '').trim().toLowerCase();
      if (!item) continue;
      if (item.includes('adhd') || item.includes('attention') || item.includes('hyperactiv')) {
        needs.add('Short chunked tasks with visible checkpoints');
        needs.add('High-agency hands-on MakerSpace activities');
      } else if (item.includes('dyslex') || item.includes('reading') || item.includes('written')) {
        needs.add('Visual and multi-modal instructions');
        needs.add('Alternative submission modes (video or physical prototype instead of essays)');
      } else if (item.includes('gifted') || item.includes('high inquiry') || item.includes('advanced')) {
        needs.add('Open-ended extension challenges and deeper technical headroom');
      } else if (item.includes('autis') || item.includes('asd') || item.includes('sensory')) {
        needs.add('Explicit, predictable task sequences and structured rubrics');
      } else if (item.includes('executive') || item.includes('initiation') || item.includes('organization')) {
        needs.add('Step-by-step initiation prompts with visual starter cues');
      } else {
        const cleaned = item.replace(/\b(adhd|asd|autism|dyslexia|2e|syndrome|disorder|diagnosis)\b/gi, '').trim();
        if (cleaned) needs.add(cleaned);
      }
    }
    return Array.from(needs);
  }

  app.post('/api/design-review', requireAuth, forbidParents, async (req, res) => {
    const requestId = assignRequestId(req, res);
    const startedAt = Date.now();
    try {
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);
      const { measurements, image } = req.body;

      if (!measurements || typeof measurements !== 'string' || !measurements.trim()) {
        return res.status(400).json({ error: 'Build measurements are required', requestId });
      }
      if (!checkRateLimit(`${userId}-design-review`, 5, 60000)) {
        return res.status(429).json({ error: 'Give the reviewer a moment - try again in a minute.', requestId });
      }
      if (image && (!image.base64 || !image.mimeType || !/^image\/(jpeg|png|webp)$/.test(image.mimeType))) {
        return res.status(400).json({ error: 'Unsupported image format', requestId });
      }
      if (image?.base64 && image.base64.length > 6_000_000) {
        return res.status(413).json({ error: 'That photo is too large. Try a smaller one.', requestId });
      }

      const prompt = [
        'You are reviewing a student engineering team\'s model solar car.',
        '',
        'THEIR MEASUREMENTS:',
        wrapStudentInput(measurements),
        '',
        image ? 'Photo attached.' : 'No photo provided.',
        '',
        'Write a design review with these four headings exactly:',
        '**What is working**',
        '**The main limit on this car**',
        '**Three things to try next**',
        '**A question for your team**'
      ].join('\n');

      const review = await withTimeout(
        callGeminiWithImage(prompt, image, 900, { ageBand, uid: userId, endpoint: 'design-review' }),
        15000
      );
      res.json({ review, sawPhoto: Boolean(image), ageBand, requestId, timestamp: new Date().toISOString() });
    } catch (error) {
      handleAiError(res, error, 'design-review', 'The design reviewer is unavailable right now.', {
        requestId,
        model: geminiConfig.modelName,
        startedAt
      });
    }
  });

  app.post('/api/hint', requireAuth, forbidParents, async (req, res) => {
    const requestId = assignRequestId(req, res);
    const startedAt = Date.now();
    try {
      const { challengeId, challengeTitle, scenario, difficultyLevel } = req.body;
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);

      if (!challengeId || !challengeTitle) return res.status(400).json({ error: 'Missing required fields', requestId });
      if (!checkRateLimit(`${userId}-hints`, 5, 60000)) return res.status(429).json({ error: 'Too many hint requests.', requestId });

      const prompt = `Challenge: ${challengeTitle}\nScenario: ${scenario}\nDifficulty: ${difficultyLevel}\nProvide a SHORT hint.`;
      const hint = await withTimeout(
        callGemini(prompt, 150, { ageBand, uid: userId, endpoint: 'hint' }),
        10000
      );
      res.json({ hint, requestId, timestamp: new Date().toISOString() });
    } catch (error) {
      handleAiError(res, error, 'hint', 'Failed to generate hint', {
        requestId,
        model: geminiConfig.modelName,
        startedAt
      });
    }
  });

  app.post('/api/feedback', requireAuth, forbidParents, async (req, res) => {
    const requestId = assignRequestId(req, res);
    const startedAt = Date.now();
    try {
      const { challengeId, challengeTitle, score, timeSpent, attempts } = req.body;
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);

      if (!challengeId || score === undefined) return res.status(400).json({ error: 'Missing required fields', requestId });
      if (!checkRateLimit(`${userId}-feedback`, 20, 60000)) return res.status(429).json({ error: 'Too many requests.', requestId });

      const prompt = `Challenge: ${challengeTitle}, Score: ${score}%, Time: ${timeSpent}m, Attempts: ${attempts}. Provide feedback.`;
      try {
        const feedback = await withTimeout(
          callGemini(prompt, 250, { ageBand, uid: userId, endpoint: 'feedback' }),
          10000
        );
        res.json({ feedback, requestId, timestamp: new Date().toISOString() });
      } catch {
        // Fast, friendly fallback feedback so a learner's screen never hangs
        const fallback = getFriendlyFeedbackFallback(challengeTitle, score);
        return res.json({ ...fallback, requestId });
      }
    } catch (error) {
      handleAiError(res, error, 'feedback', 'Failed to generate feedback', {
        requestId,
        model: geminiConfig.modelName,
        startedAt
      });
    }
  });

  app.post('/api/explain', requireAuth, forbidParents, async (req, res) => {
    const requestId = assignRequestId(req, res);
    const startedAt = Date.now();
    try {
      const { concept, context } = req.body;
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);

      if (!concept) return res.status(400).json({ error: 'Missing required fields', requestId });
      if (!checkRateLimit(`${userId}-explain`, 15, 60000)) return res.status(429).json({ error: 'Too many requests.', requestId });

      const prompt = `Concept: ${concept}\nContext: ${context}\nExplain simply.`;
      const explanation = await withTimeout(
        callGemini(prompt, 300, { ageBand, uid: userId, endpoint: 'explain' }),
        10000
      );
      res.json({ explanation, requestId, timestamp: new Date().toISOString() });
    } catch (error) {
      handleAiError(res, error, 'explain', 'Failed to generate explanation', {
        requestId,
        model: geminiConfig.modelName,
        startedAt
      });
    }
  });

  app.post('/api/recommendation', requireAuth, forbidParents, async (req, res) => {
    const requestId = assignRequestId(req, res);
    const startedAt = Date.now();
    try {
      const { learningPath } = req.body;
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);

      if (!learningPath) return res.status(400).json({ error: 'Missing required fields', requestId });
      if (!checkRateLimit(`${userId}-recommend`, 10, 60000)) return res.status(429).json({ error: 'Too many requests.', requestId });

      const prompt = `Learning Path: ${learningPath}. Recommend next challenge.`;
      const recommendation = await withTimeout(
        callGemini(prompt, 200, { ageBand, uid: userId, endpoint: 'recommendation' }),
        10000
      );
      res.json({ recommendation, requestId, timestamp: new Date().toISOString() });
    } catch (error) {
      handleAiError(res, error, 'recommendation', 'Failed to generate recommendation', {
        requestId,
        model: geminiConfig.modelName,
        startedAt
      });
    }
  });

  app.post('/api/challenge-brief', requireAuth, forbidParents, async (req, res) => {
    const requestId = assignRequestId(req, res);
    const startedAt = Date.now();
    try {
      const { learningPath, topic } = req.body;
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);

      if (!learningPath || !topic) return res.status(400).json({ error: 'Missing required fields', requestId });
      if (!checkRateLimit(`${userId}-brief`, 10, 60000)) return res.status(429).json({ error: 'Too many requests.', requestId });

      const prompt = `Learning Path: ${learningPath}, Topic: ${topic}. Brief challenge.`;
      const brief = await withTimeout(
        callGemini(prompt, 200, { ageBand, uid: userId, endpoint: 'challenge-brief' }),
        10000
      );
      res.json({ brief, requestId, timestamp: new Date().toISOString() });
    } catch (error) {
      handleAiError(res, error, 'challenge-brief', 'Failed to generate challenge brief', {
        requestId,
        model: geminiConfig.modelName,
        startedAt
      });
    }
  });

  app.post('/api/tutor', requireAuth, forbidParents, async (req, res) => {
    const requestId = assignRequestId(req, res);
    const startedAt = Date.now();
    try {
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);
      const { message, activityContext = '' } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message is required', requestId });
      }
      if (!checkRateLimit(`${userId}-tutor`, 20, 60000)) {
        return res.status(429).json({ error: "You're asking very fast! Give me a moment to catch up.", requestId });
      }

      const reply = await withTimeout(
        callGemini(wrapStudentInput(message), 400, {
          ageBand,
          uid: userId,
          endpoint: 'tutor',
          systemExtra: String(activityContext).slice(0, 800)
        }),
        12000
      );
      res.json({ reply, ageBand, requestId, timestamp: new Date().toISOString() });
    } catch (error) {
      handleAiError(res, error, 'tutor', 'The tutor is unavailable right now.', {
        requestId,
        model: geminiConfig.modelName,
        startedAt
      });
    }
  });

  app.post('/api/roleplay', requireAuth, forbidParents, async (req, res) => {
    const requestId = assignRequestId(req, res);
    const startedAt = Date.now();
    try {
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);
      const { personaId, message } = req.body;

      if (!personaId || !PERSONAS[personaId]) {
        const validPersonas = Object.keys(PERSONAS);
        return res.status(400).json({
          error: `Unknown character '${personaId || ''}'. Valid characters are: ${validPersonas.join(', ')}`,
          code: 'UNKNOWN_PERSONA',
          validPersonas,
          requestId
        });
      }

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          error: 'Message is required and must not be empty.',
          code: 'EMPTY_MESSAGE',
          requestId
        });
      }

      if (!checkRateLimit(`${userId}-roleplay`, 20, 60000)) {
        return res.status(429).json({ error: 'Give them a moment to reply!', requestId });
      }

      const activeModel = getActiveModel();
      const instruction = buildPersonaInstruction(personaId, ageBand);
      const result = await withTimeout(
        executeWithRetry(
          () => activeModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: wrapStudentInput(message) }] }],
            systemInstruction: { parts: [{ text: instruction }] },
            generationConfig: { maxOutputTokens: 300, temperature: 0.8, topP: 0.9 }
          }),
          1,
          retryBackoffMs
        ),
        12000
      );

      const { text, blocked, reason } = extractText(result);
      await logConversation({ uid: userId, prompt: message, reply: text, blocked, blockReason: reason, endpoint: `roleplay:${personaId}`, ageBand });

      const trustMatch = text.match(/TRUST:\s*(\d+)/i);
      const trust = trustMatch ? Math.min(30, Math.max(0, parseInt(trustMatch[1], 10) || 0)) : 0;
      const reply = text.replace(/\|?\s*TRUST:\s*\d+/i, '').replace(/^RESPONSE:\s*/i, '').trim();

      res.json({ reply, trust, blocked, requestId, timestamp: new Date().toISOString() });
    } catch (error) {
      handleAiError(res, error, 'roleplay', 'That character is unavailable right now.', {
        requestId,
        model: geminiConfig.modelName,
        startedAt
      });
    }
  });

  app.post('/api/pbl/synthesize', requireAuth, requireCoachOrAdmin, async (req, res) => {
    const requestId = assignRequestId(req, res);
    const startedAt = Date.now();
    const endpoint = 'pbl/synthesize';

    const sendValidation = (message) => {
      console.warn('[AI Validation]', {
        endpoint,
        model: geminiConfig.modelName,
        status: 400,
        code: 'VALIDATION',
        requestId,
        durationMs: Math.max(0, Date.now() - startedAt)
      });
      return res.status(400).json({
        error: message,
        code: 'VALIDATION',
        requestId
      });
    };

    try {
      const userId = req.user.uid;

      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return sendValidation('Request body must be a JSON object.');
      }

      const {
        learner,
        groundingContext = '',
        activeSources = [],
        customFocus = '',
        programme = 'WLS',
        unitType = 'pbl_unit',
        duration = '8 stages',
        language = 'en-GB',
        step = 'full',
        competencies = []
      } = req.body;

      // 1. Strict payload type, enum, and length validation BEFORE prompt construction or rate-limit consumption
      if (customFocus !== undefined && customFocus !== null && typeof customFocus !== 'string') {
        return sendValidation('Custom focus instructions must be a string.');
      }
      if (typeof customFocus === 'string' && customFocus.length > 500) {
        return sendValidation('Custom focus instructions must be 500 characters or fewer.');
      }

      if (!['WLS', 'WHS', 'primary'].includes(programme)) {
        return sendValidation('Programme must be one of WLS, WHS, or primary.');
      }
      if (!['pbl_unit', 'steam_activity', 'milestones', 'quiz'].includes(unitType)) {
        return sendValidation('Unit type must be one of pbl_unit, steam_activity, milestones, or quiz.');
      }
      if (!['en-GB', 'th'].includes(language)) {
        return sendValidation('Language must be en-GB or th.');
      }
      if (!['outline', 'details', 'full'].includes(step)) {
        return sendValidation('Step must be outline, details, or full.');
      }

      const isValidDuration =
        (typeof duration === 'string' && duration.trim().length > 0 && duration.length <= 60) ||
        (Number.isInteger(duration) && duration >= 1 && duration <= 16);
      if (!isValidDuration) {
        return sendValidation('Duration must be a short description (up to 60 characters) or an integer between 1 and 16.');
      }

      if (groundingContext !== undefined && groundingContext !== null && typeof groundingContext !== 'string') {
        return sendValidation('Grounding context must be a string.');
      }
      if (typeof groundingContext === 'string' && groundingContext.length > 50000) {
        return sendValidation('Grounding context exceeds the maximum allowed length.');
      }

      if (
        !Array.isArray(activeSources) ||
        activeSources.length > 25 ||
        activeSources.some((s) => typeof s !== 'string' || s.length > 200)
      ) {
        return sendValidation('Active sources must be an array of up to 25 source titles.');
      }

      if (learner !== undefined && learner !== null && (typeof learner !== 'object' || Array.isArray(learner))) {
        return sendValidation('Learner profile must be an object.');
      }

      let resolvedCompetencies = [];
      try {
        resolvedCompetencies = validateRequestedCompetencies(competencies, { max: 20 });
      } catch (compErr) {
        return sendValidation(compErr.message || 'Invalid competency selection.');
      }

      // 2. Verify AI model & key configuration before consuming user draft quota
      const activeModel = getActiveModel();

      // 3. Rate limit: 20 per hour, 200 per day per user
      if (!courseDraftHourlyLimiter.check(`${userId}-draft-hour`, 20, 3600000)) {
        return res.status(429).json({
          error: 'You have reached the hourly limit for drafts (20 per hour). Try again later.',
          code: 'RATE_LIMITED',
          requestId
        });
      }
      if (!courseDraftDailyLimiter.check(`${userId}-draft-day`, 200, 86400000)) {
        return res.status(429).json({
          error: 'You have reached the daily limit for drafts (200 per day). Try again tomorrow.',
          code: 'RATE_LIMITED',
          requestId
        });
      }

      const safeCustomFocus = customFocus ? wrapStudentInput(customFocus.slice(0, 500)) : '';

      // Budget grounding context (up to 12,000 chars total across sources)
      const budgetedGrounding = String(groundingContext || '').slice(0, 12000);
      const sourcesUsed = activeSources.map((s) => s.trim()).filter(Boolean);

      // Privacy: STRICTLY translate neurodivergence/profile traits to neutral pedagogical design needs
      // NEVER send learner names, emails, or diagnostic labels to Gemini
      const learningNeedsList = translateTraitsToLearningNeeds(
        learner?.diagnosisTraits || learner?.appliedAccommodations || learner?.learningNeeds
      );
      const passions = String(learner?.consumingPassions || '').replace(/[^\w\s,.-]/gi, '').slice(0, 200);

      const programmeLabels = {
        WLS: 'WeLearn Lower Secondary (Ages 11–14, Year 7–9)',
        WHS: 'WeLearn Higher Secondary (Ages 15–18, Year 10–12)',
        primary: 'Primary (Ages 6–11)'
      };
      const targetCohort = programmeLabels[programme] || programmeLabels.WLS;

      const languageInstruction = language === 'th'
        ? 'LANGUAGE REQUIREMENT: Generate all titles, descriptions, reflections, driving questions, and activity steps in natural Thai (ภาษาไทย). Keep technical engineering tools (e.g. Python, micro:bit, 3D Printer) in standard Latin terms where helpful.'
        : 'LANGUAGE REQUIREMENT: British English. Use British spelling throughout (e.g., analyse, organise, colour, centre, programme). Use the terms "programme", "coach", "learning centre". Never use "teacher" or "school" in generated copy.';

      const durationInstruction = `TARGET DURATION & STRUCTURE: ${duration}.
Generate milestones that strictly respect this duration:
- If a 4-session STEAM activity is requested, generate exactly 4 distinct session milestones (do NOT force 8 stages).
- If a 6-week unit is requested, generate 6 milestones.
- If a standard PBL cycle is requested, generate up to 8 stages from Curiosity to Showcase.`;

      const competencySection = resolvedCompetencies.length > 0
        ? [
            'TARGET COMPETENCIES & STANDARDS (APPROVED CATALOG):',
            ...resolvedCompetencies.map((c) => `- [${c.framework}:${c.id}] ${c.title}: ${c.statement}`),
            'Map these approved competencies across the generated milestones by including "competencies": [{ "framework": "...", "id": "..." }] on each milestone using ONLY the approved IDs listed above.'
          ].join('\n')
        : '';

      const promptParts = [
        'You are the WeLearn SPARK Curriculum Architect.',
        `Target Programme & Cohort: ${targetCohort}`,
        `Curriculum Unit Type: ${unitType}`,
        durationInstruction,
        languageInstruction,
        '',
        'LEARNING DESIGN NEEDS (NEUTRAL PEDAGOGICAL SCAFFOLDING - NO PII / NO LABELS):',
        learningNeedsList.length > 0 ? learningNeedsList.map((n) => `- ${n}`).join('\n') : '- Inquiry-led hands-on prototyping with clear checkpoints',
        passions ? `Consuming Passions / Student Interests: ${passions}` : '',
        safeCustomFocus ? `Coach Focus / Theme: ${safeCustomFocus}` : '',
        competencySection ? `\n${competencySection}` : '',
        '',
        'GROUNDING REFERENCE CONTEXT (BASE CURRICULUM & HARDWARE SPECS):',
        budgetedGrounding || 'WeLearn MakerSpace (Bambu Lab 3D printers, BBC micro:bit V2, electronics bench, laser cutter).',
        '',
        step === 'outline'
          ? 'TASK: Generate ONLY a structured outline JSON object: { "unitTitle": "...", "theme": "...", "drivingQuestion": "...", "realProblem": { "summary": "...", "peopleImpact": "...", "environmentalImpact": "..." }, "milestones": [{ "stageNumber": 1, "stageName": "...", "title": "...", "week": 1, "learningGoal": "...", "competencies": [{ "framework": "welearn", "id": "..." }] }] }. Return ONLY valid JSON.'
          : 'TASK: Generate the complete learning unit JSON containing: { "unitTitle": "...", "theme": "...", "drivingQuestion": "...", "realProblem": { "summary": "...", "peopleImpact": "...", "environmentalImpact": "..." }, "makerSpaceSpecs": [{ "toolType": "...", "specs": "...", "safetyGuidelines": "..." }], "coachCues": { "leadCoach": "Coach Donovan", "initiationCue": "...", "frustrationDeescalationCue": "...", "midCheckCue": "...", "showcaseCue": "..." }, "milestones": [{ "stageNumber": 1, "stageName": "...", "title": "...", "week": 1, "durationMin": 90, "learningGoal": "...", "activities": ["..."], "makerSpaceTools": ["..."], "evidencePrompt": "...", "allowedSubmissions": ["video", "github", "prototype"], "coachCue": "...", "competencies": [{ "framework": "welearn", "id": "..." }] }] }. Return ONLY valid JSON.'
      ].filter(Boolean).join('\n');

      const result = await withTimeout(
        executeWithRetry(
          () => activeModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: promptParts }] }],
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.4,
              responseMimeType: 'application/json'
            }
          }),
          1,
          retryBackoffMs
        ),
        synthesizeTimeoutMs
      );

      const { text, blocked, reason } = extractText(result);
      if (blocked && reason !== 'EMPTY') {
        console.warn('[AI Safety Blocked]', {
          endpoint,
          model: geminiConfig.modelName,
          status: 400,
          code: 'SAFETY_BLOCKED',
          requestId,
          durationMs: Math.max(0, Date.now() - startedAt)
        });
        return res.status(400).json({
          error: 'Synthesizer prompt or response was blocked by safety filters',
          code: 'SAFETY_BLOCKED',
          reason,
          requestId
        });
      }

      const rawText = blocked ? '' : String(text || '');
      const cleanJson = rawText.replace(/```(?:json)?/g, '').trim();
      let rawParsed;
      try {
        rawParsed = JSON.parse(cleanJson);
      } catch {
        console.error('[AI Error]', {
          endpoint,
          model: geminiConfig.modelName,
          status: 502,
          code: 'MODEL_UNAVAILABLE',
          requestId,
          durationMs: Math.max(0, Date.now() - startedAt)
        });
        return res.status(502).json({
          error: 'AI generated invalid JSON. Please try again.',
          code: 'MODEL_UNAVAILABLE',
          requestId
        });
      }

      // Reject empty or non-object model JSON before normalization
      const hasValidTopLevel =
        rawParsed &&
        typeof rawParsed === 'object' &&
        !Array.isArray(rawParsed) &&
        Object.keys(rawParsed).length > 0 &&
        typeof rawParsed.unitTitle === 'string' &&
        rawParsed.unitTitle.trim().length > 0 &&
        typeof rawParsed.drivingQuestion === 'string' &&
        rawParsed.drivingQuestion.trim().length > 0 &&
        (unitType === 'quiz' ||
          (Array.isArray(rawParsed.milestones) &&
            rawParsed.milestones.length > 0 &&
            rawParsed.milestones.every(
              (m) => m && typeof m === 'object' && !Array.isArray(m) && typeof m.title === 'string' && m.title.trim().length > 0
            )));

      if (!hasValidTopLevel) {
        console.error('[AI Error]', {
          endpoint,
          model: geminiConfig.modelName,
          status: 502,
          code: 'MODEL_UNAVAILABLE',
          requestId,
          durationMs: Math.max(0, Date.now() - startedAt)
        });
        return res.status(502).json({
          error: 'AI generated an incomplete or invalid unit structure. Please try again.',
          code: 'MODEL_UNAVAILABLE',
          requestId
        });
      }

      // Shared contract validation, competency mapping validation & ID injection
      const validatedUnit = normalizePblUnit(rawParsed, {
        programme,
        unitType,
        duration,
        language,
        learner,
        learningNeeds: learningNeedsList.join('; '),
        learningNeedsList,
        consumingPassions: passions,
        sourcesUsed,
        competencies: resolvedCompetencies
      });

      // Bounded audit log to ai_usage collection in Firestore (Admin-readable only)
      try {
        const db = getFirestore();
        await withTimeout(
          db.collection('ai_usage').add({
            uid: userId,
            requestId,
            endpoint,
            model: geminiConfig.modelName,
            programme,
            unitType,
            duration,
            language,
            step,
            competencyCount: validatedUnit.competencies?.length || 0,
            promptChars: promptParts.length,
            tokensUsed: result?.usageMetadata?.totalTokenCount || null,
            timestamp: Date.now(),
            iso: new Date().toISOString()
          }),
          auditTimeoutMs
        );
      } catch {
        console.warn('[ai_usage]', {
          endpoint,
          model: geminiConfig.modelName,
          status: 'audit_skipped',
          requestId,
          durationMs: Math.max(0, Date.now() - startedAt)
        });
      }

      console.info('[AI Request]', {
        endpoint,
        model: geminiConfig.modelName,
        status: 200,
        requestId,
        durationMs: Math.max(0, Date.now() - startedAt)
      });

      res.json({
        unit: validatedUnit,
        sourcesUsed,
        competencies: validatedUnit.competencies,
        programme,
        unitType,
        step,
        requestId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleAiError(res, error, endpoint, 'Failed to synthesize unit via server AI', {
        requestId,
        model: geminiConfig.modelName,
        startedAt
      });
    }
  });

  // Archive course endpoint (Coaches & Admins only)
  app.post('/api/pbl/programs/:programId/archive', requireAuth, requireCoachOrAdmin, async (req, res) => {
    try {
      const { programId } = req.params;
      if (!programId) return res.status(400).json({ error: 'Program ID required' });
      const db = getFirestore();
      const progRef = db.collection('pbl_programs').doc(programId);
      const snap = await progRef.get();
      if (!snap.exists) return res.status(404).json({ error: 'Program not found' });
      await progRef.update({
        status: 'archived',
        archivedAt: Date.now(),
        archivedBy: req.user.uid
      });
      res.json({ success: true, programId, status: 'archived' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Catch-all 404 handler for unknown /api routes matching contract error shape
  app.use('/api', (req, res) => {
    if (req.originalUrl?.startsWith('/api/universe') || req.originalUrl?.startsWith('/api/coach/universe')) {
      return sendUniverseError(req, res, 404, 'NOT_FOUND', `No route ${req.method} ${req.originalUrl}`);
    }
    return sendError(res, 404, 'NOT_FOUND', `No route ${req.method} ${req.originalUrl}`);
  });

  // Standard error handler
  app.use((err, req, res, next) => {
    if (req.originalUrl?.startsWith('/api/universe') || req.originalUrl?.startsWith('/api/coach/universe')) {
      if (err?.type === 'entity.too.large' || err?.status === 413) {
        return sendUniverseError(req, res, 413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds the 64 KiB limit.');
      }
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Malformed JSON request body.');
      }
      console.error('Universe server error:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable.');
    }
    console.error('Server error:', err);
    return sendError(res, 500, 'INTERNAL', 'Internal server error');
  });

  return app;
}
