import { describe, it, expect } from 'vitest';
import {
  getUnlockedTools,
  runLocalMeshDiagnostics,
  autoFixLocalShapes
} from '../src/features/tinker/lessonToolsConfig.js';
import tinkerProxyRouter from '../server/routes/tinkerProxy.js';

function invokeRouter(router, { method, url, headers = {}, body = {} }) {
  return new Promise((resolve) => {
    const req = {
      method,
      url,
      headers,
      body,
      params: {},
      query: {},
      get(name) {
        return this.headers[name.toLowerCase()];
      }
    };
    const res = {
      statusCode: 200,
      headers: {},
      set(k, v) { this.headers[k] = v; return this; },
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, body: payload }); return this; },
      send(payload) { resolve({ status: this.statusCode, body: payload }); return this; }
    };
    router.handle(req, res, () => resolve({ status: 404, body: null }));
  });
}

describe('Milestone 2: Training Wheels Tool Gating & Mesh Diagnostics', () => {
  it('gates unlocked tools by active lesson metadata', () => {
    const starter = getUnlockedTools('starter_keychain').map((t) => t.id);
    expect(starter).toEqual(['extrude', 'bevel']);

    const shell = getUnlockedTools('shell_enclosure').map((t) => t.id);
    expect(shell).toEqual(['extrude', 'bevel', 'inset']);

    const full = getUnlockedTools('full_cad').map((t) => t.id);
    expect(full).toEqual(['extrude', 'bevel', 'loop_cut', 'inset']);
  });

  it('detects non-manifold bed intersections, thin walls, and poly budget violations', () => {
    const badShapes = [
      { id: 'b1', name: 'Sunk Box', type: 'box', x: 0, y: 2, z: 0, w: 20, h: 10, d: 20 },
      { id: 'b2', name: 'Thin Fin', type: 'box', x: 10, y: 5, z: 0, w: 1, h: 10, d: 10 },
      { id: 's1', name: 'HiPoly', type: 'sphere', x: 0, y: 15, z: 0, w: 20, h: 20, d: 20 }
    ];
    const report = runLocalMeshDiagnostics(badShapes, 500);
    expect(report.passed).toBe(false);
    expect(report.score).toBeLessThan(100);
    expect(report.issues.map((i) => i.code)).toEqual([
      'NON_MANIFOLD',
      'UNAPPLIED_SCALE',
      'POLY_BUDGET_EXCEEDED'
    ]);
    expect(report.issues[0].coordinates).toEqual([[0, 2, 0]]);
  });

  it('auto-fixes sinking objects and thin dimensions to restore passing mesh score', () => {
    const badShapes = [
      { id: 'b1', name: 'Sunk Box', type: 'box', x: 0, y: 2, z: 0, w: 20, h: 10, d: 20 },
      { id: 'b2', name: 'Thin Fin', type: 'box', x: 10, y: 5, z: 0, w: 1, h: 10, d: 10 }
    ];
    const fixed = autoFixLocalShapes(badShapes);
    const report = runLocalMeshDiagnostics(fixed, 10000);
    expect(report.passed).toBe(true);
    expect(report.score).toBe(100);
    expect(report.issues).toEqual([]);
  });

  it('enforces auth on /diagnostics and /auto-fix proxy routes', async () => {
    const diagRes = await invokeRouter(tinkerProxyRouter, {
      method: 'GET',
      url: '/sessions/tk_123/diagnostics'
    });
    expect(diagRes.status).toBe(401);

    const fixRes = await invokeRouter(tinkerProxyRouter, {
      method: 'POST',
      url: '/sessions/tk_123/auto-fix'
    });
    expect(fixRes.status).toBe(401);
  });
});
