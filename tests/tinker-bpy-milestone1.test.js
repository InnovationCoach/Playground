import { describe, it, expect, vi, afterEach } from 'vitest';
import tinkerProxyRouter from '../server/routes/tinkerProxy.js';
import { TinkerSyncClient } from '../src/features/tinker/tinkerSyncClient.js';

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

describe('Milestone 1: Tinker bpy Proxy & Sync Client', () => {
  const origUrl = process.env.TINKER_BPY_URL;
  afterEach(() => {
    if (origUrl === undefined) delete process.env.TINKER_BPY_URL;
    else process.env.TINKER_BPY_URL = origUrl;
    vi.restoreAllMocks();
  });

  it('reports local-threejs mode when TINKER_BPY_URL is not configured', async () => {
    delete process.env.TINKER_BPY_URL;
    const res = await invokeRouter(tinkerProxyRouter, { method: 'GET', url: '/health' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, configured: false, mode: 'local-threejs' });
  });

  it('requires auth on session creation and rejects unauthenticated callers', async () => {
    process.env.TINKER_BPY_URL = 'http://127.0.0.1:8090';
    const res = await invokeRouter(tinkerProxyRouter, {
      method: 'POST',
      url: '/sessions',
      body: { shapes: [] }
    });
    expect(res.status).toBe(401);
  });

  it('TinkerSyncClient falls back cleanly to local-threejs when worker is unconfigured', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, configured: false, mode: 'local-threejs' })
    });
    const statuses = [];
    const client = new TinkerSyncClient({ onStatus: (s) => statuses.push(s) });
    const result = await client.connect([]);
    expect(result).toEqual({ mode: 'local-threejs', connected: false });
    expect(statuses).toEqual([{ mode: 'local-threejs', connected: false }]);
    const cmdRes = await client.sendCommand('op', { op: 'bevel_edges' });
    expect(cmdRes.mode).toBe('local-threejs');
  });
});
