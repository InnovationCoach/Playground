import { describe, expect, it } from 'vitest';
import express from 'express';
import { EventEmitter } from 'node:events';
import { createUniversePlaygroundRouter } from '../server/routes/universePlayground.js';
import { createUniverseManagementRouter } from '../server/routes/universeManagement.js';

function makeMemoryDb() {
  const store = new Map();
  return {
    store,
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

describe('Stage 5: Galaxy Collaboration & Admin/Coach Management', () => {
  it('returns org-wide galaxy stats and enforces idempotent co-op planetary aid', async () => {
    const db = makeMemoryDb();
    const app = express();
    app.use((req, _res, next) => {
      req.universeCaller = { uid: 'learner-1', orgId: 'org-spark', role: 'student' };
      next();
    });
    app.use('/api/universe/playground', createUniversePlaygroundRouter({ getDb: () => db }));

    // Allocate a planet so galaxy stats reflect 1 steward
    const alloc = await invokeRouter(app, 'POST', '/api/universe/playground/allocate', {});
    expect(alloc.status).toBe(200);

    const gal = await invokeRouter(app, 'GET', '/api/universe/playground/galaxies');
    expect(gal.status).toBe(200);
    expect(gal.json.galaxies).toHaveLength(3);
    const totalStewards = gal.json.galaxies.reduce((sum, g) => sum + g.stewardCount, 0);
    expect(totalStewards).toBe(1);

    // Trigger weekly event across 5 planets so at least 2 classmate planets are hit
    const week = await invokeRouter(app, 'POST', '/api/universe/playground/weekly-event', {
      planetIds: ['thalassa', 'ignis', 'boreas', 'nyxara', 'aurelia']
    });
    const ownId = alloc.json.allocation.planetId;
    const targetId = week.json.state.weeklyBulletin.find((e) => e.planetId !== ownId).planetId;

    const aid1 = await invokeRouter(app, 'POST', '/api/universe/playground/aid', { targetPlanetId: targetId });
    expect(aid1.status).toBe(200);
    expect(aid1.json.creditDelta).toBe(10);

    // Duplicate aid in same week is rejected
    const aid2 = await invokeRouter(app, 'POST', '/api/universe/playground/aid', { targetPlanetId: targetId });
    expect(aid2.status).toBe(409);
  });

  it('enforces role-based access for coach mission review and admin capacity configuration', async () => {
    const db = makeMemoryDb();
    // Seed a pending_review mission
    db.store.set('orgs/org-spark/universeMissions/m-pending', {
      id: 'm-pending',
      title: 'Planetary Shield Calibration',
      status: 'pending_review'
    });

    let currentRole = 'student';
    const app = express();
    app.use((req, _res, next) => {
      req.universeCaller = { uid: 'staff-1', orgId: 'org-spark', role: currentRole };
      next();
    });
    app.use('/api/coach/universe/management', createUniverseManagementRouter({ getDb: () => db }));

    // Student cannot access management overview
    const denied = await invokeRouter(app, 'GET', '/api/coach/universe/management/overview');
    expect(denied.status).toBe(403);

    // Coach can view overview and approve pending mission, but cannot change admin config
    currentRole = 'coach';
    const overview = await invokeRouter(app, 'GET', '/api/coach/universe/management/overview');
    expect(overview.status).toBe(200);
    expect(overview.json.pendingMissions).toHaveLength(1);

    const review = await invokeRouter(app, 'POST', '/api/coach/universe/management/missions/m-pending/review', {
      decision: 'approved',
      note: 'Great STEM alignment.'
    });
    expect(review.status).toBe(200);
    expect(review.json.mission.status).toBe('approved');

    const coachConfig = await invokeRouter(app, 'PUT', '/api/coach/universe/management/config', { maxPlanets: 50 });
    expect(coachConfig.status).toBe(403);

    // Admin can update planet capacity up to 100
    currentRole = 'admin';
    const adminConfig = await invokeRouter(app, 'PUT', '/api/coach/universe/management/config', {
      maxPlanets: 100,
      maxStewardsPerPlanet: 2,
      disabledPlanetIds: ['boreas']
    });
    expect(adminConfig.status).toBe(200);
    expect(adminConfig.json.config.maxPlanets).toBe(100);
  });
});
