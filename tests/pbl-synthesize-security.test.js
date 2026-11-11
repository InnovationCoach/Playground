import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const adminMocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  aiUsageAdd: vi.fn()
}));

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => [{}]),
  cert: vi.fn(),
  applicationDefault: vi.fn()
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: adminMocks.verifyIdToken
  }))
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
  getFirestore: vi.fn(() => ({
    collection: (name) => ({
      add: name === 'ai_usage' ? adminMocks.aiUsageAdd : vi.fn().mockResolvedValue({ id: 'doc-1' }),
      doc: () => ({
        get: vi.fn().mockResolvedValue({ exists: false }),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        collection: () => ({ add: vi.fn().mockResolvedValue({ id: 'sub-1' }) })
      })
    })
  }))
}));

import http from 'node:http';
import { Duplex } from 'node:stream';
import { createApp, resolveGeminiConfig, DEFAULT_GEMINI_MODEL } from '../server/app.js';
import { convertUnitToProgram } from '../src/features/coach/studio/pblTransferService.js';

const VALID_MODEL_UNIT = {
  unitTitle: 'Autonomous Habitat Telemetry Rover',
  theme: 'Environmental Robotics',
  drivingQuestion: 'How might we engineer a low-power rover to monitor microclimates?',
  realProblem: {
    summary: 'Local habitats lack continuous soil and temperature telemetry.',
    peopleImpact: 'Helps conservation teams respond faster.',
    environmentalImpact: 'Protects fragile biodiversity zones.'
  },
  makerSpaceSpecs: [
    {
      toolType: 'BBC micro:bit V2',
      specs: 'Telemetry transceiver and sensor controller',
      safetyGuidelines: 'Check 3.3V polarity before powering sensor rails.'
    }
  ],
  milestones: [
    {
      stageNumber: 1,
      stageName: 'Curiosity & Exploration',
      title: 'Sensor Calibration Lab',
      week: 1,
      durationMin: 90,
      learningGoal: 'Calibrate moisture and temperature sensors.',
      activities: ['Wire sensor breakout', 'Log baseline readings'],
      makerSpaceTools: ['BBC micro:bit V2'],
      evidencePrompt: 'Upload calibration table and short demo video.',
      allowedSubmissions: ['video', 'github', 'prototype'],
      coachCue: 'Start with a 15-minute sensor check.',
      competencies: [
        { framework: 'welearn', id: 'ctps-03' },
        { framework: 'ngs', id: 'MS-ETS1-1' },
        { framework: 'welearn', id: 'invented-999' }
      ]
    }
  ]
};

function makeGeminiResponse(objOrText, tokens = 320) {
  const text = typeof objOrText === 'string' ? objOrText : JSON.stringify(objOrText);
  return {
    response: {
      text: () => text,
      candidates: [
        {
          finishReason: 'STOP',
          content: { parts: [{ text }] }
        }
      ]
    },
    usageMetadata: { totalTokenCount: tokens }
  };
}

async function startTestServer(appOptions = {}) {
  const app = createApp({ retryBackoffMs: 5, ...appOptions });

  async function postSynthesize(body, { token = 'valid-token', headers = {} } = {}) {
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body ?? {});
    const lowerHeaders = {
      'content-type': 'application/json',
      'content-length': String(Buffer.byteLength(rawBody, 'utf8'))
    };
    for (const [k, v] of Object.entries(headers)) {
      if (v !== undefined && v !== null) lowerHeaders[k.toLowerCase()] = String(v);
    }
    if (token) {
      lowerHeaders.authorization = `Bearer ${token}`;
    }

    return new Promise((resolve, reject) => {
      const socket = new Duplex({
        read() {},
        write(_chunk, _enc, cb) {
          cb();
        }
      });
      socket.remoteAddress = '127.0.0.1';

      const req = new http.IncomingMessage(socket);
      req.method = 'POST';
      req.url = '/api/pbl/synthesize';
      req.headers = lowerHeaders;

      const res = new http.ServerResponse(req);
      res.assignSocket(socket);

      const responseChunks = [];
      const origWrite = res.write.bind(res);
      const origEnd = res.end.bind(res);

      res.write = (chunk, encoding, cb) => {
        if (chunk) {
          responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding));
        }
        return origWrite(chunk, encoding, cb);
      };

      res.end = (chunk, encoding, cb) => {
        if (chunk) {
          responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding));
        }
        origEnd(chunk, encoding, cb);
        const rawText = Buffer.concat(responseChunks).toString('utf8');
        const headerIdx = rawText.indexOf('\r\n\r\n');
        const bodyText = headerIdx >= 0 ? rawText.slice(headerIdx + 4) : rawText;
        let parsed = null;
        try {
          parsed = JSON.parse(bodyText);
        } catch {
          parsed = null;
        }
        const resHeaders = res.getHeaders();
        resolve({
          status: res.statusCode,
          body: parsed,
          headers: {
            get: (name) => {
              const val = resHeaders[String(name).toLowerCase()];
              return val !== undefined ? String(val) : null;
            }
          }
        });
      };

      app(req, res, (err) => {
        if (err) reject(err);
      });

      req.push(Buffer.from(rawBody, 'utf8'));
      req.push(null);
    });
  }

  async function close() {}

  return { app, postSynthesize, close };
}

describe('PBL Synthesize Actual Route & Backend Contract Suite', () => {
  let activeServer = null;

  beforeEach(() => {
    adminMocks.verifyIdToken.mockReset();
    adminMocks.aiUsageAdd.mockReset();
    adminMocks.verifyIdToken.mockImplementation(async (token) => {
      if (token === 'coach-token') return { uid: 'coach-1', email: 'coach@welearn.test', role: 'coach' };
      if (token === 'teacher-token') return { uid: 'teacher-1', email: 'teacher@welearn.test', role: 'teacher' };
      if (token === 'admin-token') return { uid: 'admin-1', email: 'admin@welearn.test', role: 'admin' };
      if (token === 'supervisor-token') return { uid: 'sup-1', email: 'sup@welearn.test', role: 'supervisor' };
      if (token === 'student-token') return { uid: 'student-1', email: 'student@welearn.test', role: 'student' };
      if (token === 'parent-token') return { uid: 'parent-1', email: 'parent@welearn.test', role: 'parent' };
      return { uid: 'coach-default', email: 'coach@welearn.test', role: 'coach' };
    });
    adminMocks.aiUsageAdd.mockResolvedValue({ id: 'audit-1' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(async () => {
    if (activeServer) {
      await activeServer.close();
      activeServer = null;
    }
    vi.restoreAllMocks();
  });

  it('resolves GEMINI_MODEL and GEMINI_API_KEY inside createApp after environment loading without dummy keys', () => {
    const prevKey = process.env.GEMINI_API_KEY;
    const prevModel = process.env.GEMINI_MODEL;
    try {
      delete process.env.GEMINI_API_KEY;
      process.env.GEMINI_MODEL = 'gemini-2.5-pro';
      const resolved = resolveGeminiConfig();
      expect(resolved.modelName).toBe('gemini-2.5-pro');
      expect(resolved.apiKey).toBe('');
      expect(resolved.configured).toBe(false);

      const dummyAttempt = resolveGeminiConfig({ geminiApiKey: 'dev-dummy-key' });
      expect(dummyAttempt.configured).toBe(false);
      expect(dummyAttempt.apiKey).toBe('');

      const app = createApp({ geminiApiKey: 'real-test-key', geminiModel: 'gemini-2.5-flash' });
      expect(app.locals.geminiConfig).toEqual({
        model: 'gemini-2.5-flash',
        configured: true,
        modelValid: true
      });
    } finally {
      if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevKey;
      if (prevModel === undefined) delete process.env.GEMINI_MODEL;
      else process.env.GEMINI_MODEL = prevModel;
    }
  });

  it('enforces real authentication and role checks on POST /api/pbl/synthesize', async () => {
    const adapter = vi.fn().mockResolvedValue(makeGeminiResponse(VALID_MODEL_UNIT));
    activeServer = await startTestServer({ modelAdapter: adapter });

    // Unauthenticated (no token) -> 401
    const unauth = await activeServer.postSynthesize({}, { token: null });
    expect(unauth.status).toBe(401);

    // Student & Parent -> 403 FORBIDDEN
    const studentRes = await activeServer.postSynthesize({}, { token: 'student-token' });
    expect(studentRes.status).toBe(403);
    expect(studentRes.body.code).toBe('FORBIDDEN');

    const parentRes = await activeServer.postSynthesize({}, { token: 'parent-token' });
    expect(parentRes.status).toBe(403);
    expect(parentRes.body.code).toBe('FORBIDDEN');
    expect(adapter).not.toHaveBeenCalled();

    // Coach, Teacher, Admin, Supervisor -> 200
    for (const token of ['coach-token', 'teacher-token', 'admin-token', 'supervisor-token']) {
      const okRes = await activeServer.postSynthesize({ duration: '4 sessions', unitType: 'steam_activity' }, { token });
      expect(okRes.status).toBe(200);
      expect(okRes.body.unit.unitTitle).toBe(VALID_MODEL_UNIT.unitTitle);
    }
  });

  it('returns valid normalized output, strips PII/diagnosis labels from prompt, and persists validated competency mappings', async () => {
    let capturedPrompt = '';
    const adapter = vi.fn(async (req) => {
      capturedPrompt = req.contents?.[0]?.parts?.[0]?.text || '';
      return makeGeminiResponse(VALID_MODEL_UNIT);
    });
    activeServer = await startTestServer({ modelAdapter: adapter });

    const res = await activeServer.postSynthesize(
      {
        learner: {
          id: 'student-liam',
          name: 'Liam SecretName',
          diagnosisTraits: 'Liam SecretName diagnosed with ADHD and Dyslexia (liam@school.edu)',
          consumingPassions: 'Autonomous Robotics'
        },
        programme: 'WLS',
        unitType: 'pbl_unit',
        duration: '4 sessions',
        language: 'en-GB',
        customFocus: 'Focus on habitat moisture sensors',
        competencies: [
          { framework: 'welearn', id: 'ctps-03' },
          { framework: 'ngs', id: 'MS-ETS1-1' }
        ]
      },
      { token: 'coach-token', headers: { 'X-Request-Id': 'req-synth-valid-01' } }
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('x-request-id')).toBe('req-synth-valid-01');
    expect(res.body.requestId).toBe('req-synth-valid-01');

    // Privacy check on prompt sent to AI provider
    expect(capturedPrompt.toLowerCase()).not.toContain('secretname');
    expect(capturedPrompt.toLowerCase()).not.toContain('adhd');
    expect(capturedPrompt.toLowerCase()).not.toContain('dyslexia');
    expect(capturedPrompt.toLowerCase()).not.toContain('liam@school.edu');
    expect(capturedPrompt).toContain('Short chunked tasks with visible checkpoints');
    expect(capturedPrompt).toContain('[welearn:ctps-03] Data Interpretation');
    expect(capturedPrompt).toContain('[ngs:MS-ETS1-1] Define the criteria and constraints of a design problem');

    // Validated competencies persisted on unit & milestones (invented-999 stripped!)
    expect(res.body.unit.competencies.map((c) => c.id)).toEqual(['ctps-03', 'MS-ETS1-1']);
    expect(res.body.unit.milestones[0].competencies.map((c) => c.id)).toEqual(['ctps-03', 'MS-ETS1-1']);

    // Program conversion uses validated competency IDs instead of hardcoded defaults
    const converted = convertUnitToProgram(res.body.unit, 'coach-1');
    expect(converted.phases[0].competencies).toEqual(['ctps-03', 'MS-ETS1-1']);
    expect(converted.phases[0].sessions[0].evidenceToCollect.targetCompetencies).toEqual(['ctps-03', 'MS-ETS1-1']);
  });

  it('rejects malformed JSON and empty/non-object JSON before normalization with 502 MODEL_UNAVAILABLE', async () => {
    const payloads = ['not-json{{{', 'null', '[]', '{}', JSON.stringify({ unitTitle: 'Only title' })];
    for (const rawOutput of payloads) {
      const adapter = vi.fn().mockResolvedValue(makeGeminiResponse(rawOutput));
      activeServer = await startTestServer({ modelAdapter: adapter });
      const res = await activeServer.postSynthesize({}, { token: 'coach-token' });
      expect(res.status).toBe(502);
      expect(res.body.code).toBe('MODEL_UNAVAILABLE');
      expect(res.body.requestId).toBeTruthy();
      await activeServer.close();
      activeServer = null;
    }
  });

  it('returns 503 AI_NOT_CONFIGURED when GEMINI_API_KEY is missing without attempting dummy-key calls', async () => {
    activeServer = await startTestServer({ geminiApiKey: '', modelAdapter: null });
    const res = await activeServer.postSynthesize({}, { token: 'coach-token' });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('AI_NOT_CONFIGURED');
    expect(res.body.requestId).toBeTruthy();
  });

  it('returns 502 MODEL_UNAVAILABLE for unsupported or invalid model configurations and upstream 404 model errors', async () => {
    // 1. Invalid model string in config
    activeServer = await startTestServer({ geminiApiKey: 'test-key', geminiModel: 'bad model name!' });
    const badConfigRes = await activeServer.postSynthesize({}, { token: 'coach-token' });
    expect(badConfigRes.status).toBe(502);
    expect(badConfigRes.body.code).toBe('MODEL_UNAVAILABLE');
    await activeServer.close();

    // 2. Upstream 404 model not found / unsupported for generateContent
    const unsupportedAdapter = vi.fn().mockRejectedValue(
      Object.assign(new Error('models/gemini-3.6-flash is not found for API version v1beta, or is not supported'), { status: 404 })
    );
    activeServer = await startTestServer({ modelAdapter: unsupportedAdapter, geminiModel: 'gemini-3.6-flash' });
    const upstreamRes = await activeServer.postSynthesize({}, { token: 'coach-token' });
    expect(upstreamRes.status).toBe(502);
    expect(upstreamRes.body.code).toBe('MODEL_UNAVAILABLE');
  });

  it('returns 504 GATEWAY_TIMEOUT when the provider exceeds the deadline and logs only safe metadata', async () => {
    const slowAdapter = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve(makeGeminiResponse(VALID_MODEL_UNIT)), 200))
    );
    activeServer = await startTestServer({ modelAdapter: slowAdapter, aiTimeoutMs: 25 });

    const res = await activeServer.postSynthesize(
      {
        learner: { name: 'ConfidentialLearnerName' },
        customFocus: 'SecretPromptText'
      },
      { token: 'coach-token', headers: { 'X-Request-Id': 'req-timeout-99' } }
    );

    expect(res.status).toBe(504);
    expect(res.body.code).toBe('GATEWAY_TIMEOUT');
    expect(res.body.requestId).toBe('req-timeout-99');

    const loggedErrors = JSON.stringify(console.error.mock.calls);
    expect(loggedErrors).toContain('req-timeout-99');
    expect(loggedErrors).not.toContain('ConfidentialLearnerName');
    expect(loggedErrors).not.toContain('SecretPromptText');
    expect(loggedErrors).not.toContain('coach-token');
  });

  it('enforces both upstream 429 rate limits and the 20/hour per-coach draft limit on the actual route', async () => {
    // 1. Upstream provider 429
    const rateLimitedAdapter = vi.fn().mockRejectedValue(
      Object.assign(new Error('429 Too Many Requests: Resource has been exhausted'), { status: 429 })
    );
    activeServer = await startTestServer({ modelAdapter: rateLimitedAdapter });
    const upstream429 = await activeServer.postSynthesize({}, { token: 'coach-token' });
    expect(upstream429.status).toBe(429);
    expect(upstream429.body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(upstream429.headers.get('retry-after')).toBe('5');
    await activeServer.close();

    // 2. Per-coach hourly limit (20 allowed, 21st returns 429 RATE_LIMITED)
    const fastAdapter = vi.fn().mockResolvedValue(makeGeminiResponse(VALID_MODEL_UNIT));
    activeServer = await startTestServer({ modelAdapter: fastAdapter });
    for (let i = 1; i <= 20; i++) {
      const ok = await activeServer.postSynthesize({}, { token: 'coach-token' });
      expect(ok.status).toBe(200);
    }
    const twentyFirst = await activeServer.postSynthesize({}, { token: 'coach-token' });
    expect(twentyFirst.status).toBe(429);
    expect(twentyFirst.body.code).toBe('RATE_LIMITED');
  });

  it('validates payload types, enums, lengths, and unknown competency IDs with 400 VALIDATION before calling the model', async () => {
    const adapter = vi.fn().mockResolvedValue(makeGeminiResponse(VALID_MODEL_UNIT));
    activeServer = await startTestServer({ modelAdapter: adapter });

    // Non-string customFocus (previously reached .slice and caused 500 TypeError)
    const nonStringFocus = await activeServer.postSynthesize({ customFocus: { nested: 'bad' } }, { token: 'coach-token' });
    expect(nonStringFocus.status).toBe(400);
    expect(nonStringFocus.body.code).toBe('VALIDATION');

    // Over-length customFocus (> 500 chars)
    const longFocus = await activeServer.postSynthesize({ customFocus: 'x'.repeat(501) }, { token: 'coach-token' });
    expect(longFocus.status).toBe(400);
    expect(longFocus.body.code).toBe('VALIDATION');

    // Invalid duration
    const badDuration = await activeServer.postSynthesize({ duration: '' }, { token: 'coach-token' });
    expect(badDuration.status).toBe(400);
    expect(badDuration.body.code).toBe('VALIDATION');

    // Invalid grounding sources
    const badSources = await activeServer.postSynthesize({ activeSources: [123] }, { token: 'coach-token' });
    expect(badSources.status).toBe(400);
    expect(badSources.body.code).toBe('VALIDATION');

    // Unknown competency ID
    const unknownComp = await activeServer.postSynthesize(
      { competencies: [{ framework: 'welearn', id: 'not-in-catalog-99' }] },
      { token: 'coach-token' }
    );
    expect(unknownComp.status).toBe(400);
    expect(unknownComp.body.code).toBe('VALIDATION');
    expect(unknownComp.body.error).toContain('not-in-catalog-99');

    // Unknown NGS ID
    const unknownNgs = await activeServer.postSynthesize(
      { competencies: [{ framework: 'ngs', id: 'FAKE-NGS-999' }] },
      { token: 'coach-token' }
    );
    expect(unknownNgs.status).toBe(400);
    expect(unknownNgs.body.code).toBe('VALIDATION');

    expect(adapter).not.toHaveBeenCalled();
  });

  it('bounds audit-write latency so a stalled Firestore ai_usage write does not block the response', async () => {
    adminMocks.aiUsageAdd.mockImplementation(() => new Promise(() => {})); // Never resolves
    const adapter = vi.fn().mockResolvedValue(makeGeminiResponse(VALID_MODEL_UNIT));
    activeServer = await startTestServer({ modelAdapter: adapter, auditTimeoutMs: 30 });

    const started = Date.now();
    const res = await activeServer.postSynthesize({}, { token: 'coach-token' });
    const elapsed = Date.now() - started;

    expect(res.status).toBe(200);
    expect(res.body.unit.unitTitle).toBe(VALID_MODEL_UNIT.unitTitle);
    expect(elapsed).toBeLessThan(1000);
  });
});

