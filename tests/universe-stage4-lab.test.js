import { describe, expect, it } from 'vitest';
import express from 'express';
import { EventEmitter } from 'node:events';
import { LAB_TYPES } from '../src/features/universe/lab/labRegistry.js';
import { mentorHintForDesign, simulateSpaceshipDesign } from '../src/features/universe/lab/spaceshipSim.js';
import { createUniversePlaygroundRouter } from '../server/routes/universePlayground.js';

function makeMemoryDb() {
  const store = new Map();
  return {
    collection(col) {
      return {
        doc(orgId) {
          return {
            collection(sub) {
              const prefix = `${col}/${orgId}/${sub}/`;
              return {
                async get() {
                  const docs = [];
                  for (const [k, v] of store.entries()) {
                    if (k.startsWith(prefix)) docs.push({ id: k.slice(prefix.length), data: () => v });
                  }
                  return { forEach: (cb) => docs.forEach(cb) };
                },
                doc(docId) {
                  const key = `${prefix}${docId}`;
                  return {
                    async get() {
                      return store.has(key)
                        ? { exists: true, data: () => store.get(key) }
                        : { exists: false, data: () => undefined };
                    },
                    async set(val) {
                      store.set(key, JSON.parse(JSON.stringify(val)));
                    }
                  };
                }
              };
            }
          };
        }
      };
    }
  };
}

function invokeRouter(app, method, url, body = null) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.originalUrl = url;
    req.headers = { 'content-type': 'application/json' };
    req.body = body || {};
    req.ip = '127.0.0.1';

    const res = new EventEmitter();
    res.statusCode = 200;
    res._headers = {};
    res.setHeader = (k, v) => { res._headers[k.toLowerCase()] = v; };
    res.getHeader = (k) => res._headers[k.toLowerCase()];
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (payload) => { resolve({ status: res.statusCode, json: payload }); return res; };
    res.send = (payload) => { resolve({ status: res.statusCode, json: typeof payload === 'string' ? JSON.parse(payload) : payload }); return res; };

    app.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: 404, json: {} });
    });
  });
}

describe('Stage 4: AI Research Lab & Spaceship Builder', () => {
  it('registers extensible lab types and runs deterministic physics simulation separately from AI hints', () => {
    expect(LAB_TYPES.some((l) => l.id === 'engineering' && l.flagshipProjectId === 'spaceship-builder')).toBe(true);

    // Underpowered & low-thrust design fails physics
    const bad = simulateSpaceshipDesign({
      name: 'Heavy Ion Test',
      passengers: 6,
      parts: { hull: 'titanium-hull', propulsion: 'ion-thruster', power: 'solar-array', shield: 'thermal-shield' }
    });
    expect(bad.passed).toBe(false);
    expect(bad.metrics.powerBalanceKw).toBeLessThan(0);
    expect(bad.metrics.thrustToWeightRatio).toBeLessThan(1.05);
    expect(mentorHintForDesign(bad)).toContain('power deficit');

    // Balanced design passes physics
    const good = simulateSpaceshipDesign({
      name: 'Thalassa Explorer I',
      passengers: 2,
      parts: { hull: 'lightweight-alloy', propulsion: 'chemical-booster', power: 'rtg-core', shield: 'radiation-canopy' }
    });
    expect(good.passed).toBe(true);
    expect(good.metrics.thrustToWeightRatio).toBeGreaterThanOrEqual(1.05);
    expect(good.metrics.powerBalanceKw).toBeGreaterThanOrEqual(0);
    expect(mentorHintForDesign(good)).toContain('passed simulation');
  });

  it('saves Spaceship Builder projects with server-verified simulation runs', async () => {
    const db = makeMemoryDb();
    const app = express();
    app.use((req, _res, next) => {
      req.universeCaller = { uid: 'learner-12', orgId: 'org-spark', role: 'student' };
      next();
    });
    app.use('/api/universe/playground', createUniversePlaygroundRouter({ getDb: () => db }));

    const saveRes = await invokeRouter(app, 'POST', '/api/universe/playground/projects', {
      name: 'Nyxara Probe II',
      purpose: 'Cryo-plume sampling',
      passengers: 2,
      parts: { hull: 'lightweight-alloy', propulsion: 'chemical-booster', power: 'rtg-core', shield: 'radiation-canopy' },
      reflection: 'Chose chemical booster for high thrust-to-weight and RTG core for reliable power.'
    });
    expect(saveRes.status).toBe(200);
    expect(saveRes.json.project.simulationRun.passed).toBe(true);

    const listRes = await invokeRouter(app, 'GET', '/api/universe/playground/projects');
    expect(listRes.status).toBe(200);
    expect(listRes.json.projects).toHaveLength(1);
    expect(listRes.json.projects[0].name).toBe('Nyxara Probe II');
  });
});
