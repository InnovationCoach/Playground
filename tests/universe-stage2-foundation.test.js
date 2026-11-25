import { describe, expect, it } from 'vitest';
import express from 'express';
import { EventEmitter } from 'node:events';
import { selectBalancedPlanet } from '../server/lib/universe/planetAllocation.js';
import { buildLearnerContext } from '../server/lib/universe/learnerContext.js';
import { generateUniverseMission, validateGeneratedMission } from '../server/lib/universe/architect.js';
import { createUniversePlaygroundRouter } from '../server/routes/universePlayground.js';
import { initialPlaygroundState } from '../src/features/universe/playground/playgroundModel.js';

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
                    if (k.startsWith(prefix)) {
                      const id = k.slice(prefix.length);
                      docs.push({ id, data: () => v });
                    }
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

describe('Stage 2: Planet Allocation Service', () => {
  it('balances learners across unoccupied planets and galaxies, respects disabled planets and capacity', () => {
    const r1 = selectBalancedPlanet({
      uid: 's1',
      existingAssignments: { thalassa: ['s0'] },
      config: { maxPlanets: 15, maxStewardsPerPlanet: 1, disabledPlanetIds: ['aurelia'] }
    });
    expect(r1.ok).toBe(true);
    expect(r1.planetId).not.toBe('thalassa');
    expect(r1.planetId).not.toBe('aurelia');
    // Prefers a galaxy with 0 stewards over lyra-spiral (which already has thalassa)
    expect(r1.galaxyId).not.toBe('lyra-spiral');

    // Capacity reached when all enabled planets are full
    const full = selectBalancedPlanet({
      uid: 's99',
      planetIds: ['thalassa', 'ignis'],
      existingAssignments: { thalassa: ['a'], ignis: ['b'] },
      config: { maxPlanets: 2, maxStewardsPerPlanet: 1, disabledPlanetIds: [] }
    });
    expect(full.ok).toBe(false);
    expect(full.reason).toBe('capacity-reached');
  });
});

describe('Stage 2: Learner Intelligence & AI Universe Architect', () => {
  it('builds minimal PII-free learner context and validates generated missions', async () => {
    const pg = initialPlaygroundState('glaciera');
    const ctx = buildLearnerContext({
      uid: 'learner-42',
      orgId: 'org-spark',
      playgroundState: pg,
      masterySummary: { verifiedCompetencies: ['scientific_reasoning'], practiceAreas: ['measurement'] }
    });

    expect(ctx.planetId).toBe('glaciera');
    expect(ctx.planetCondition).toBe('water_scarcity_and_geyser_capture');
    expect(ctx.practiceAreas).toContain('measurement');
    expect(JSON.stringify(ctx)).not.toMatch(/email|phone|password/i);

    // Reject unsafe or prompt-injected missions
    const unsafe = validateGeneratedMission({
      missionType: 'environmental_engineering',
      planetCondition: 'water_scarcity',
      title: 'Test',
      challenge: 'Mix bleach + ammonia near an open flame and visit https://evil.example.com',
      learningObjectives: ['measurement'],
      difficulty: 'beginner',
      requiredMaterials: ['beaker'],
      completionRequirements: ['submit_design'],
      potentialRewards: ['credits_50']
    });
    expect(unsafe.ok).toBe(false);

    // Curated fallback matches planetCondition and avoids repetition
    const first = await generateUniverseMission({ context: ctx });
    expect(first.ok).toBe(true);
    expect(first.mission.status).toBe('approved');
    expect(first.mission.title).toBe('Glacial Geyser Water Recovery');

    const second = await generateUniverseMission({
      context: { ...ctx, previousMissionTitles: [first.mission.title] }
    });
    expect(second.ok).toBe(true);
    expect(second.mission.title).not.toBe(first.mission.title);
  });

  it('exposes /allocate, /context, and /missions/generate endpoints', async () => {
    const db = makeMemoryDb();
    const app = express();
    app.use((req, _res, next) => {
      req.universeCaller = { uid: 'learner-7', orgId: 'org-spark', role: 'student' };
      next();
    });
    app.use('/api/universe/playground', createUniversePlaygroundRouter({ getDb: () => db }));

    const alloc = await invokeRouter(app, 'POST', '/api/universe/playground/allocate', {});
    expect(alloc.status).toBe(200);
    expect(alloc.json.allocation.ok).toBe(true);

    const ctxRes = await invokeRouter(app, 'GET', '/api/universe/playground/context');
    expect(ctxRes.status).toBe(200);
    expect(ctxRes.json.context.planetId).toBe(alloc.json.allocation.planetId);

    const genRes = await invokeRouter(app, 'POST', '/api/universe/playground/missions/generate', {});
    expect(genRes.status).toBe(200);
    expect(genRes.json.mission.status).toBe('approved');
    expect(genRes.json.mission.planetId).toBe(alloc.json.allocation.planetId);
  });
});
