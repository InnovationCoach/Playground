import { describe, expect, it } from 'vitest';
import express from 'express';
import { EventEmitter } from 'node:events';
import { createUniversePlaygroundRouter } from '../server/routes/universePlayground.js';
import { initialPlaygroundState } from '../src/features/universe/playground/playgroundModel.js';

function makeMemoryDb() {
  const store = new Map();
  return {
    store,
    collection(col) {
      return {
        doc(orgId) {
          return {
            collection(sub) {
              return {
                doc(uid) {
                  const key = `${col}/${orgId}/${sub}/${uid}`;
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
    res.json = (payload) => {
      resolve({ status: res.statusCode, json: payload });
      return res;
    };
    res.send = (payload) => {
      resolve({ status: res.statusCode, json: typeof payload === 'string' ? JSON.parse(payload) : payload });
      return res;
    };

    app.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: 404, json: {} });
    });
  });
}

describe('Universe Playground Server API (Phase 5)', () => {
  it('fails closed with 401 when caller is missing', async () => {
    const db = makeMemoryDb();
    const app = express();
    app.use('/api/universe/playground', createUniversePlaygroundRouter({ getDb: () => db }));

    const res = await invokeRouter(app, 'GET', '/api/universe/playground');
    expect(res.status).toBe(401);
  });

  it('initializes, saves, and runs weekly events scoped to orgId and uid', async () => {
    const db = makeMemoryDb();
    const app = express();
    app.use((req, _res, next) => {
      req.universeCaller = { uid: 'learner-1', orgId: 'org-spark', role: 'student' };
      next();
    });
    app.use('/api/universe/playground', createUniversePlaygroundRouter({ getDb: () => db }));

    const initRes = await invokeRouter(app, 'GET', '/api/universe/playground');
    expect(initRes.status).toBe(200);
    expect(initRes.json.source).toBe('initialized');
    expect(initRes.json.state.credits).toBe(100);

    // Reject invalid payload
    const badRes = await invokeRouter(app, 'PUT', '/api/universe/playground/state', {
      state: { ...initialPlaygroundState('thalassa'), credits: -50 }
    });
    expect(badRes.status).toBe(400);

    // Save valid updated state with earned goal
    const updated = {
      ...initRes.json.state,
      credits: 160,
      claimedPlanetId: 'nyxara',
      completedGoals: [{ goalId: 'goal-stem-lab', at: new Date().toISOString(), credits: 60 }]
    };
    const putRes = await invokeRouter(app, 'PUT', '/api/universe/playground/state', { state: updated });
    expect(putRes.status).toBe(200);
    expect(putRes.json.state.credits).toBe(160);

    // Subsequent GET loads from firestore
    const getRes = await invokeRouter(app, 'GET', '/api/universe/playground');
    expect(getRes.status).toBe(200);
    expect(getRes.json.source).toBe('firestore');
    expect(getRes.json.state.claimedPlanetId).toBe('nyxara');

    // Trigger weekly 3-planet event on server
    const weekRes = await invokeRouter(app, 'POST', '/api/universe/playground/weekly-event', {
      planetIds: ['thalassa', 'ignis', 'boreas', 'nyxara', 'aurelia']
    });
    expect(weekRes.status).toBe(200);
    expect(weekRes.json.state.week).toBe(2);
    expect(weekRes.json.state.weeklyBulletin).toHaveLength(3);
  });

  it('B1: sanitizes and persists savedShips blueprints, dropping invalid entries', async () => {
    const db = makeMemoryDb();
    const app = express();
    app.use((req, _res, next) => {
      req.universeCaller = { uid: 'learner-ships', orgId: 'org-spark', role: 'student' };
      next();
    });
    app.use('/api/universe/playground', createUniversePlaygroundRouter({ getDb: () => db }));

    const validShip = {
      id: 'ship-v1-test',
      version: 1,
      name: 'Ares Explorer',
      purpose: 'Deep planetary survey and sample return',
      passengers: 4,
      parts: {
        hull: 'titanium-hull',
        propulsion: 'plasma-drive',
        power: 'fusion-microcell',
        shield: 'radiation-canopy'
      },
      simulation: {
        passed: true,
        metrics: { totalMassKg: 4200, thrustToWeightRatio: 1.25 },
        diagnostics: []
      },
      reflection: 'Refined thruster balance to optimize delta-v.',
      savedAt: new Date().toISOString()
    };

    const invalidShip = {
      id: 'ship-invalid-bad-parts',
      version: 1,
      name: 'Bad Craft',
      parts: { hull: 'unknown-hull' }
    };

    const baseState = initialPlaygroundState('thalassa');
    const putRes = await invokeRouter(app, 'PUT', '/api/universe/playground/state', {
      state: {
        ...baseState,
        savedShips: [validShip, invalidShip]
      }
    });

    expect(putRes.status).toBe(200);
    expect(putRes.json.state.savedShips).toHaveLength(1);
    expect(putRes.json.state.savedShips[0].name).toBe('Ares Explorer');

    // GET loads preserved savedShips
    const getRes = await invokeRouter(app, 'GET', '/api/universe/playground');
    expect(getRes.status).toBe(200);
    expect(getRes.json.state.savedShips).toHaveLength(1);
    expect(getRes.json.state.savedShips[0].id).toBe('ship-v1-test');
  });

  it('B2: rejects duplicate completedGoals with 400 and caps forged credits', async () => {
    const db = makeMemoryDb();
    const app = express();
    app.use((req, _res, next) => {
      req.universeCaller = { uid: 'learner-credits', orgId: 'org-spark', role: 'student' };
      next();
    });
    app.use('/api/universe/playground', createUniversePlaygroundRouter({ getDb: () => db }));

    const baseState = initialPlaygroundState('thalassa');

    // Reject duplicate completedGoals
    const dupRes = await invokeRouter(app, 'PUT', '/api/universe/playground/state', {
      state: {
        ...baseState,
        completedGoals: [
          { goalId: 'goal-stem-lab', at: new Date().toISOString() },
          { goalId: 'goal-stem-lab', at: new Date().toISOString() }
        ]
      }
    });
    expect(dupRes.status).toBe(400);

    // Caps forged credits: client sends 500,000 without newly earned goals
    const forgeRes = await invokeRouter(app, 'PUT', '/api/universe/playground/state', {
      state: {
        ...baseState,
        credits: 500000
      }
    });
    expect(forgeRes.status).toBe(200);
    // Base starter credits is 100; without new achievements credits are capped at 100
    expect(forgeRes.json.state.credits).toBe(100);
  });
});
