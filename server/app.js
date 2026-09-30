import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  SAFETY_SETTINGS,
  PERSONAS,
  buildPersonaInstruction,
  buildSystemInstruction,
  resolveAgeBand,
  wrapStudentInput,
  extractText
} from './safety.js';
import { initAdmin, requireAuth, logConversation, flagForReview } from './auth.js';
import { sendError } from './lib/errors.js';

import sessionRouter from './routes/session.js';
import adminUsersRouter from './routes/admin-users.js';
import referenceRouter from './routes/reference.js';
import parentsRouter from './routes/parents.js';

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const THINKING_OFF = { thinkingBudget: 0 };

export function createApp() {
  const app = express();

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || 'dev-dummy-key');
  const model = genAI.getGenerativeModel({ model: MODEL_NAME, safetySettings: SAFETY_SETTINGS });

  initAdmin();

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));
  app.use(express.json({ limit: '8mb' }));

  // Rate limiting map for AI endpoints
  const rateLimits = new Map();
  function checkRateLimit(userId, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const userKey = `${userId}-${Math.floor(now / windowMs)}`;
    if (!rateLimits.has(userKey)) {
      rateLimits.set(userKey, 0);
    }
    const count = rateLimits.get(userKey) + 1;
    rateLimits.set(userKey, count);
    return count <= maxRequests;
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
      model: MODEL_NAME,
      timestamp: new Date().toISOString()
    });
  });

  // ============= NEW PHASE 0 CONTRACT ENDPOINTS =============
  app.use('/api', sessionRouter);
  app.use('/api/admin/users', adminUsersRouter);
  app.use('/api/admin', referenceRouter);
  app.use('/api', parentsRouter);

  // ============= EXISTING AI ENDPOINTS =============
  async function callGemini(prompt, maxOutputTokens = 256, opts = {}) {
    const { ageBand, uid, endpoint = 'unknown', systemExtra = '' } = opts;
    const band = resolveAgeBand(ageBand);

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: buildSystemInstruction(band, systemExtra) }] },
        generationConfig: { maxOutputTokens, temperature: 0.7, topP: 0.9, thinkingConfig: THINKING_OFF }
      });

      const { text, blocked, reason } = extractText(result);
      await logConversation({ uid, prompt, reply: text, blocked, blockReason: reason, endpoint, ageBand: band });
      if (blocked) {
        console.warn(`[SAFETY] ${endpoint} blocked for ${uid}: ${reason}`);
        await flagForReview({ uid, reason, prompt, endpoint });
      }
      return text;
    } catch (error) {
      console.error('Gemini API Error:', error.message);
      throw error;
    }
  }

  async function callGeminiWithImage(prompt, image, maxOutputTokens = 700, opts = {}) {
    const { ageBand, uid, endpoint = 'unknown', systemExtra = '' } = opts;
    const band = resolveAgeBand(ageBand);
    const parts = [{ text: prompt }];
    if (image?.base64 && image?.mimeType) {
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
    }

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        systemInstruction: { parts: [{ text: buildSystemInstruction(band, systemExtra) }] },
        generationConfig: { maxOutputTokens, temperature: 0.6, topP: 0.9, thinkingConfig: THINKING_OFF }
      });

      const { text, blocked, reason } = extractText(result);
      await logConversation({ uid, prompt, reply: text, blocked, blockReason: reason, endpoint, ageBand: band });
      if (blocked) {
        console.warn(`[SAFETY] ${endpoint} blocked for ${uid}: ${reason}`);
        await flagForReview({ uid, reason, prompt, endpoint });
      }
      return text;
    } catch (error) {
      console.error('Gemini vision API Error:', error.message);
      throw error;
    }
  }

  app.post('/api/design-review', requireAuth, async (req, res) => {
    try {
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);
      const { measurements, image } = req.body;

      if (!measurements || typeof measurements !== 'string' || !measurements.trim()) {
        return res.status(400).json({ error: 'Build measurements are required' });
      }
      if (!checkRateLimit(`${userId}-design-review`, 5, 60000)) {
        return res.status(429).json({ error: 'Give the reviewer a moment - try again in a minute.' });
      }
      if (image && (!image.base64 || !image.mimeType || !/^image\/(jpeg|png|webp)$/.test(image.mimeType))) {
        return res.status(400).json({ error: 'Unsupported image format' });
      }
      if (image?.base64 && image.base64.length > 6_000_000) {
        return res.status(413).json({ error: 'That photo is too large. Try a smaller one.' });
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

      const review = await callGeminiWithImage(prompt, image, 900, { ageBand, uid: userId, endpoint: 'design-review' });
      res.json({ review, sawPhoto: Boolean(image), ageBand, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'The design reviewer is unavailable right now.' });
    }
  });

  app.post('/api/hint', requireAuth, async (req, res) => {
    try {
      const { challengeId, challengeTitle, scenario, difficultyLevel } = req.body;
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);

      if (!challengeId || !challengeTitle) return res.status(400).json({ error: 'Missing required fields' });
      if (!checkRateLimit(`${userId}-hints`, 5, 60000)) return res.status(429).json({ error: 'Too many hint requests.' });

      const prompt = `Challenge: ${challengeTitle}\nScenario: ${scenario}\nDifficulty: ${difficultyLevel}\nProvide a SHORT hint.`;
      const hint = await callGemini(prompt, 150, { ageBand, uid: userId, endpoint: 'hint' });
      res.json({ hint, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate hint' });
    }
  });

  app.post('/api/feedback', requireAuth, async (req, res) => {
    try {
      const { challengeId, challengeTitle, score, timeSpent, attempts } = req.body;
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);

      if (!challengeId || score === undefined) return res.status(400).json({ error: 'Missing required fields' });
      if (!checkRateLimit(`${userId}-feedback`, 20, 60000)) return res.status(429).json({ error: 'Too many requests.' });

      const prompt = `Challenge: ${challengeTitle}, Score: ${score}%, Time: ${timeSpent}m, Attempts: ${attempts}. Provide feedback.`;
      const feedback = await callGemini(prompt, 250, { ageBand, uid: userId, endpoint: 'feedback' });
      res.json({ feedback, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate feedback' });
    }
  });

  app.post('/api/explain', requireAuth, async (req, res) => {
    try {
      const { concept, context } = req.body;
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);

      if (!concept) return res.status(400).json({ error: 'Missing required fields' });
      if (!checkRateLimit(`${userId}-explain`, 15, 60000)) return res.status(429).json({ error: 'Too many requests.' });

      const prompt = `Concept: ${concept}\nContext: ${context}\nExplain simply.`;
      const explanation = await callGemini(prompt, 300, { ageBand, uid: userId, endpoint: 'explain' });
      res.json({ explanation, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate explanation' });
    }
  });

  app.post('/api/recommendation', requireAuth, async (req, res) => {
    try {
      const { learningPath } = req.body;
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);

      if (!learningPath) return res.status(400).json({ error: 'Missing required fields' });
      if (!checkRateLimit(`${userId}-recommend`, 10, 60000)) return res.status(429).json({ error: 'Too many requests.' });

      const prompt = `Learning Path: ${learningPath}. Recommend next challenge.`;
      const recommendation = await callGemini(prompt, 200, { ageBand, uid: userId, endpoint: 'recommendation' });
      res.json({ recommendation, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate recommendation' });
    }
  });

  app.post('/api/challenge-brief', requireAuth, async (req, res) => {
    try {
      const { learningPath, topic } = req.body;
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);

      if (!learningPath || !topic) return res.status(400).json({ error: 'Missing required fields' });
      if (!checkRateLimit(`${userId}-brief`, 10, 60000)) return res.status(429).json({ error: 'Too many requests.' });

      const prompt = `Learning Path: ${learningPath}, Topic: ${topic}. Brief challenge.`;
      const brief = await callGemini(prompt, 200, { ageBand, uid: userId, endpoint: 'challenge-brief' });
      res.json({ brief, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate challenge brief' });
    }
  });

  app.post('/api/tutor', requireAuth, async (req, res) => {
    try {
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);
      const { message, activityContext = '' } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }
      if (!checkRateLimit(`${userId}-tutor`, 20, 60000)) {
        return res.status(429).json({ error: "You're asking very fast! Give me a moment to catch up." });
      }

      const reply = await callGemini(wrapStudentInput(message), 400, {
        ageBand,
        uid: userId,
        endpoint: 'tutor',
        systemExtra: String(activityContext).slice(0, 800)
      });
      res.json({ reply, ageBand, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'The tutor is unavailable right now.' });
    }
  });

  app.post('/api/roleplay', requireAuth, async (req, res) => {
    try {
      const userId = req.user.uid;
      const ageBand = resolveAgeBand(req.body.ageBand);
      const { personaId, message } = req.body;

      const persona = PERSONAS[personaId];
      if (!persona || !message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Unknown character or empty message' });
      }
      if (!checkRateLimit(`${userId}-roleplay`, 20, 60000)) {
        return res.status(429).json({ error: 'Give them a moment to reply!' });
      }

      const instruction = buildPersonaInstruction(personaId, ageBand);
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: wrapStudentInput(message) }] }],
        systemInstruction: { parts: [{ text: instruction }] },
        generationConfig: { maxOutputTokens: 300, temperature: 0.8, topP: 0.9 }
      });

      const { text, blocked, reason } = extractText(result);
      await logConversation({ uid: userId, prompt: message, reply: text, blocked, blockReason: reason, endpoint: `roleplay:${personaId}`, ageBand });

      const trustMatch = text.match(/TRUST:\s*(\d+)/i);
      const trust = trustMatch ? Math.min(30, Math.max(0, parseInt(trustMatch[1], 10) || 0)) : 0;
      const reply = text.replace(/\|?\s*TRUST:\s*\d+/i, '').replace(/^RESPONSE:\s*/i, '').trim();

      res.json({ reply, trust, blocked, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: 'That character is unavailable right now.' });
    }
  });

  // Catch-all 404 handler for unknown /api routes matching contract error shape
  app.use('/api', (req, res) => {
    return sendError(res, 404, 'NOT_FOUND', `No route ${req.method} ${req.originalUrl}`);
  });

  // Standard 500 error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    return sendError(res, 500, 'INTERNAL', 'Internal server error');
  });

  return app;
}
