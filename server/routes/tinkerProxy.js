import { Router } from 'express';
import { requireClaims } from '../middleware/auth.js';

const router = Router();

export function resolveTinkerWorkerUrl() {
  return (process.env.TINKER_BPY_URL || '').trim().replace(/\/+$/, '');
}

async function forwardJson(res, targetUrl, init = {}) {
  const upstream = await fetch(targetUrl, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {})
    },
    signal: AbortSignal.timeout(20000)
  });
  const text = await upstream.text();
  res.status(upstream.status);
  try {
    return res.json(JSON.parse(text));
  } catch {
    return res.send(text);
  }
}

function ensureConfigured(res) {
  const baseUrl = resolveTinkerWorkerUrl();
  if (!baseUrl) {
    res.status(503).json({
      ok: false,
      code: 'TINKER_WORKER_UNCONFIGURED',
      error: 'Blender bpy worker (TINKER_BPY_URL) is not configured on this server.'
    });
    return null;
  }
  return baseUrl;
}

/**
 * GET /api/tinker/health
 * Checks whether the headless Blender bpy worker is configured and reachable.
 */
router.get('/health', async (_req, res) => {
  const baseUrl = resolveTinkerWorkerUrl();
  if (!baseUrl) {
    return res.json({ ok: true, configured: false, mode: 'local-threejs' });
  }
  try {
    const upstream = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
    const data = await upstream.json();
    return res.json({ ok: upstream.ok, configured: true, mode: 'bpy-worker', worker: data });
  } catch (err) {
    return res.status(502).json({ ok: false, configured: true, error: err.message });
  }
});

/**
 * POST /api/tinker/sessions
 * Creates an isolated Blender bpy session for the signed-in learner.
 */
router.post('/sessions', requireClaims, async (req, res) => {
  const baseUrl = ensureConfigured(res);
  if (!baseUrl) return;
  try {
    const userId = req.auth?.uid || req.user?.uid || 'anonymous';
    await forwardJson(res, `${baseUrl}/sessions`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        shapes: Array.isArray(req.body?.shapes) ? req.body.shapes : []
      })
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/tinker/sessions/:sessionId/op
 * Executes a deterministic bmesh/bpy operation in the learner's isolated session.
 */
router.post('/sessions/:sessionId/op', requireClaims, async (req, res) => {
  const baseUrl = ensureConfigured(res);
  if (!baseUrl) return;
  try {
    const sessionId = encodeURIComponent(req.params.sessionId);
    await forwardJson(res, `${baseUrl}/sessions/${sessionId}/op`, {
      method: 'POST',
      body: JSON.stringify(req.body || {})
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/tinker/sessions/:sessionId/glb/:hash
 * Streams the binary .glb snapshot from the Blender worker with immutable caching.
 */
router.get('/sessions/:sessionId/glb/:hash', requireClaims, async (req, res) => {
  const baseUrl = ensureConfigured(res);
  if (!baseUrl) return;
  try {
    const sessionId = encodeURIComponent(req.params.sessionId);
    const glbHash = encodeURIComponent(req.params.hash);
    const upstream = await fetch(`${baseUrl}/sessions/${sessionId}/glb/${glbHash}`, {
      signal: AbortSignal.timeout(15000)
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ ok: false, error: 'GLB snapshot not found' });
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.set('Content-Type', 'model/gltf-binary');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(buf);
  } catch (err) {
    return res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/tinker/sessions/:sessionId/diagnostics
 */
router.get('/sessions/:sessionId/diagnostics', requireClaims, async (req, res) => {
  const baseUrl = ensureConfigured(res);
  if (!baseUrl) return;
  try {
    const sessionId = encodeURIComponent(req.params.sessionId);
    const maxTriangles = Number(req.query?.maxTriangles) || 10000;
    await forwardJson(res, `${baseUrl}/sessions/${sessionId}/diagnostics?maxTriangles=${maxTriangles}`, {
      method: 'GET'
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/tinker/sessions/:sessionId/auto-fix
 */
router.post('/sessions/:sessionId/auto-fix', requireClaims, async (req, res) => {
  const baseUrl = ensureConfigured(res);
  if (!baseUrl) return;
  try {
    const sessionId = encodeURIComponent(req.params.sessionId);
    const maxTriangles = Number(req.body?.maxTriangles) || 10000;
    await forwardJson(res, `${baseUrl}/sessions/${sessionId}/auto-fix?maxTriangles=${maxTriangles}`, {
      method: 'POST'
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/tinker/sessions/:sessionId/geonodes/:objectName
 */
router.get('/sessions/:sessionId/geonodes/:objectName', requireClaims, async (req, res) => {
  const baseUrl = ensureConfigured(res);
  if (!baseUrl) return;
  try {
    const sessionId = encodeURIComponent(req.params.sessionId);
    const objectName = encodeURIComponent(req.params.objectName);
    await forwardJson(res, `${baseUrl}/sessions/${sessionId}/geonodes/${objectName}`, { method: 'GET' });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/tinker/sessions/:sessionId/geonodes/:objectName/params
 */
router.post('/sessions/:sessionId/geonodes/:objectName/params', requireClaims, async (req, res) => {
  const baseUrl = ensureConfigured(res);
  if (!baseUrl) return;
  try {
    const sessionId = encodeURIComponent(req.params.sessionId);
    const objectName = encodeURIComponent(req.params.objectName);
    await forwardJson(res, `${baseUrl}/sessions/${sessionId}/geonodes/${objectName}/params`, {
      method: 'POST',
      body: JSON.stringify({ values: req.body?.values || {} })
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

const FORBIDDEN_PY_PATTERN = /\b(import\s+(os|sys|subprocess|socket|urllib|requests|http|shutil|pathlib|importlib)|__import__|eval\s*\(|exec\s*\(|open\s*\()/;

export function buildFallbackBpyScript(prompt = '') {
  const lower = String(prompt).toLowerCase();
  const countMatch = lower.match(/\b(\d{1,2})\b/);
  const count = countMatch ? Math.max(3, Math.min(24, Number(countMatch[1]))) : 8;

  if (lower.includes('pillar') || lower.includes('ring') || lower.includes('circle')) {
    return {
      code: [
        `# AI Co-Pilot: Create a ring of ${count} pillars`,
        'import bpy, bmesh, math',
        `count = ${count}`,
        'radius = 0.04  # 40 mm',
        'for i in range(count):',
        '    angle = (i / count) * math.tau',
        '    bm = bmesh.new()',
        '    bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.005, radius2=0.005, depth=0.03)',
        '    mesh = bpy.data.meshes.new(f"Pillar_{i}")',
        '    bm.to_mesh(mesh); bm.free()',
        '    obj = bpy.data.objects.new(f"Pillar_{i}", mesh)',
        '    obj.location = (math.cos(angle) * radius, 0.015, math.sin(angle) * radius)',
        '    bpy.context.scene.collection.objects.link(obj)'
      ].join('\n'),
      localAction: { kind: 'pillar_ring', count }
    };
  }

  if (lower.includes('bevel')) {
    return {
      code: [
        '# AI Co-Pilot: Bevel edges with 3 segments',
        'import bpy, bmesh',
        'obj = bpy.context.active_object',
        'bm = bmesh.new(); bm.from_mesh(obj.data)',
        'bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.002, segments=3, affect="EDGES", clamp_overlap=True)',
        'bm.to_mesh(obj.data); bm.free()'
      ].join('\n'),
      localAction: { kind: 'bevel', segments: 3 }
    };
  }

  return {
    code: [
      `# AI Co-Pilot: Procedural block for "${prompt.slice(0, 60)}"`,
      'import bpy, bmesh',
      'bm = bmesh.new()',
      'bmesh.ops.create_cube(bm, size=0.03)',
      'mesh = bpy.data.meshes.new("AI_Block")',
      'bm.to_mesh(mesh); bm.free()',
      'obj = bpy.data.objects.new("AI_Block", mesh)',
      'bpy.context.scene.collection.objects.link(obj)'
    ].join('\n'),
    localAction: { kind: 'add_box' }
  };
}

/**
 * POST /api/tinker/ai-script
 * Translates natural language into AST-checked bpy/bmesh Python code.
 */
router.post('/ai-script', requireClaims, async (req, res) => {
  const prompt = String(req.body?.prompt || '').trim();
  if (!prompt) {
    return res.status(400).json({ ok: false, error: 'Prompt is required.' });
  }

  const fallback = buildFallbackBpyScript(prompt);
  const apiKey = (process.env.GEMINI_API_KEY || process.env.SCHOOL_GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'NOT_CONFIGURED') {
    return res.json({ ok: true, engine: 'deterministic-fallback', ...fallback });
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
    const sys = [
      'Output ONLY clean Python code using bpy, bmesh, and math (no markdown fences).',
      'Never import os, sys, subprocess, socket, urllib, requests, or use open/eval/exec.',
      `Student request: ${prompt}`
    ].join('\n');
    const result = await model.generateContent(sys);
    const raw = (result.response?.text() || '').replace(/^```(?:python)?\n?|```$/g, '').trim();
    if (!raw || FORBIDDEN_PY_PATTERN.test(raw)) {
      return res.json({ ok: true, engine: 'deterministic-fallback', ...fallback });
    }
    return res.json({ ok: true, engine: 'gemini', code: raw, localAction: fallback.localAction });
  } catch {
    return res.json({ ok: true, engine: 'deterministic-fallback', ...fallback });
  }
});

/**
 * POST /api/tinker/sessions/:sessionId/execute-script
 */
router.post('/sessions/:sessionId/execute-script', requireClaims, async (req, res) => {
  const baseUrl = ensureConfigured(res);
  if (!baseUrl) return;
  try {
    const sessionId = encodeURIComponent(req.params.sessionId);
    await forwardJson(res, `${baseUrl}/sessions/${sessionId}/execute-script`, {
      method: 'POST',
      body: JSON.stringify({ code: String(req.body?.code || '') })
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/tinker/sessions/:sessionId/render
 */
router.post('/sessions/:sessionId/render', requireClaims, async (req, res) => {
  const baseUrl = ensureConfigured(res);
  if (!baseUrl) return;
  try {
    const sessionId = encodeURIComponent(req.params.sessionId);
    await forwardJson(res, `${baseUrl}/sessions/${sessionId}/render`, {
      method: 'POST',
      body: JSON.stringify({ engine: req.body?.engine === 'CYCLES' ? 'CYCLES' : 'EEVEE' })
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/tinker/sessions/:sessionId/render/:jobId
 */
router.get('/sessions/:sessionId/render/:jobId', requireClaims, async (req, res) => {
  const baseUrl = ensureConfigured(res);
  if (!baseUrl) return;
  try {
    const sessionId = encodeURIComponent(req.params.sessionId);
    const jobId = encodeURIComponent(req.params.jobId);
    await forwardJson(res, `${baseUrl}/sessions/${sessionId}/render/${jobId}`, { method: 'GET' });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/tinker/sessions/:sessionId/export?format=glb|usdz|stl
 */
router.get('/sessions/:sessionId/export', requireClaims, async (req, res) => {
  const baseUrl = ensureConfigured(res);
  if (!baseUrl) return;
  try {
    const sessionId = encodeURIComponent(req.params.sessionId);
    const fmt = ['glb', 'usdz', 'stl'].includes(req.query?.format) ? req.query.format : 'glb';
    const upstream = await fetch(`${baseUrl}/sessions/${sessionId}/export?format=${fmt}`, {
      signal: AbortSignal.timeout(20000)
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status);
    res.set('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    return res.send(buf);
  } catch (err) {
    return res.status(502).json({ ok: false, error: err.message });
  }
});

/**
 * DELETE /api/tinker/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', requireClaims, async (req, res) => {
  const baseUrl = ensureConfigured(res);
  if (!baseUrl) return;
  try {
    const sessionId = encodeURIComponent(req.params.sessionId);
    await forwardJson(res, `${baseUrl}/sessions/${sessionId}`, { method: 'DELETE' });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

export default router;
