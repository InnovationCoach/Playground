import { describe, it, expect } from 'vitest';
import { DEFAULT_GEONODE_SCHEMA, evaluateLocalGeoNodes } from '../src/features/tinker/GeoNodesPanel.jsx';
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

describe('Milestone 3: Geometry Nodes Bridge & Node Tree Visualizer', () => {
  it('exposes typed Group Input sockets and an annotated DAG node graph', () => {
    expect(DEFAULT_GEONODE_SCHEMA.sockets.map((s) => s.socketType)).toEqual([
      'INT', 'FLOAT', 'FLOAT', 'BOOLEAN', 'ENUM'
    ]);
    expect(DEFAULT_GEONODE_SCHEMA.nodeGraph.nodes[0].role).toBe('input');
    expect(DEFAULT_GEONODE_SCHEMA.nodeGraph.nodes.at(-1).role).toBe('output');
    expect(DEFAULT_GEONODE_SCHEMA.nodeGraph.links.length).toBeGreaterThanOrEqual(4);
  });

  it('evaluates parametric ring geometry from socket values', () => {
    const shapes = evaluateLocalGeoNodes({
      Socket_2: 6,
      Socket_3: 40,
      Socket_4: 20,
      Socket_5: true,
      Socket_6: 'box'
    });
    // 6 ring elements + 1 center hub
    expect(shapes.length).toBe(7);
    expect(shapes[0].type).toBe('box');
    expect(shapes.at(-1).id).toBe('geo_hub');

    const noHub = evaluateLocalGeoNodes({ Socket_2: 5, Socket_5: false });
    expect(noHub.length).toBe(5);
  });

  it('enforces auth on /geonodes proxy routes', async () => {
    const getRes = await invokeRouter(tinkerProxyRouter, {
      method: 'GET',
      url: '/sessions/tk_123/geonodes/Parametric_Ring'
    });
    expect(getRes.status).toBe(401);

    const postRes = await invokeRouter(tinkerProxyRouter, {
      method: 'POST',
      url: '/sessions/tk_123/geonodes/Parametric_Ring/params',
      body: { values: { Socket_2: 12 } }
    });
    expect(postRes.status).toBe(401);
  });
});
