import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import tinkerProxyRouter, { buildFallbackBpyScript } from '../server/routes/tinkerProxy.js';
import { generateLocalCopilotResult } from '../src/features/tinker/AiCopilotDrawer.jsx';

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

describe('Milestone 4: AI Co-Pilot AST Sandbox, Cloud Render & AR Export', () => {
  it('generates clean bpy/bmesh code and local shapes for NL prompts', () => {
    const serverFallback = buildFallbackBpyScript('Create a ring of 12 pillars');
    expect(serverFallback.code).toContain('import bpy, bmesh, math');
    expect(serverFallback.code).toContain('count = 12');

    const clientRes = generateLocalCopilotResult('Create a ring of 10 pillars');
    expect(clientRes.code).toContain('count = 10');
    expect(clientRes.shapes.length).toBe(10);
  });

  it('Python AST sandbox allows safe bpy/bmesh scripts and blocks os/subprocess/eval/open', () => {
    const pyCheck = `
import importlib.util
spec = importlib.util.spec_from_file_location('ai_copilot', 'services/tinker-bpy/app/ai_copilot.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
ok1, err1 = mod.validate_bpy_ast("import bpy, bmesh, math\\nbm = bmesh.new()\\n")
ok2, err2 = mod.validate_bpy_ast("import os\\nos.system('rm -rf /')")
ok3, err3 = mod.validate_bpy_ast("open('/etc/passwd').read()")
ok4, err4 = mod.validate_bpy_ast("x = ().__class__.__subclasses__()")
assert ok1 and err1 is None, err1
assert not ok2 and 'blocked' in err2
assert not ok3 and 'blocked' in err3
assert not ok4 and 'blocked' in err4
print('AST_OK')
`;
    const out = execFileSync('python3', ['-c', pyCheck], { encoding: 'utf8' });
    expect(out.trim()).toBe('AST_OK');
  });

  it('enforces auth on /ai-script, /execute-script, /render, and /export proxy routes', async () => {
    for (const req of [
      { method: 'POST', url: '/ai-script', body: { prompt: 'ring of 8 pillars' } },
      { method: 'POST', url: '/sessions/tk_1/execute-script', body: { code: 'import bpy' } },
      { method: 'POST', url: '/sessions/tk_1/render', body: { engine: 'CYCLES' } },
      { method: 'GET', url: '/sessions/tk_1/export?format=usdz' }
    ]) {
      const res = await invokeRouter(tinkerProxyRouter, req);
      expect(res.status).toBe(401);
    }
  });
});
