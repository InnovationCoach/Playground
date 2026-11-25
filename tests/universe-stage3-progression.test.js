import { describe, expect, it } from 'vitest';
import express from 'express';
import { EventEmitter } from 'node:events';
import {
  completeMissionWithEvidence,
  computeDevelopmentStage,
  unlockFacilityServer
} from '../server/lib/universe/livingProgression.js';
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

describe('Stage 3: Living Progression & Server-Authoritative Unlocks', () => {
  it('enforces evidence on mission completion, prevents duplicate rewards, and gates facility unlocks', () => {
    const base = initialPlaygroundState('thalassa');
    const mission = {
      id: 'm-1',
      title: 'Water Filtration Lab',
      planetId: 'thalassa',
      learningObjectives: ['scientific_reasoning', 'measurement']
    };

    // Rejects missing evidence
    const noEvidence = completeMissionWithEvidence({ playgroundState: base, mission, evidence: { explanation: 'short', reflection: 'short' } });
    expect(noEvidence.ok).toBe(false);
    expect(noEvidence.code).toBe('EVIDENCE_REQUIRED');

    // Accepts valid evidence and grants credits + competencies
    const done = completeMissionWithEvidence({
      playgroundState: base,
      mission,
      evidence: {
        explanation: 'Multi-layer sand and activated carbon removed suspended particulates from geyser water.',
        reflection: 'Next time I will measure flow rate before and after filtration.'
      }
    });
    expect(done.ok).toBe(true);
    expect(done.state.credits).toBe(160);
    expect(done.state.verifiedCompetencies).toContain('scientific_reasoning');

    // Duplicate completion is rejected
    const dup = completeMissionWithEvidence({ playgroundState: done.state, mission, evidence: { explanation: 'valid explanation text', reflection: 'valid reflection text' } });
    expect(dup.ok).toBe(false);
    expect(dup.code).toBe('DUPLICATE_COMPLETION');

    // Cannot unlock space-exploration-station (needs 2 missions) yet
    const blocked = unlockFacilityServer({ playgroundState: done.state, facilityId: 'space-exploration-station' });
    expect(blocked.ok).toBe(false);
    expect(blocked.code).toBe('REQUIREMENT_NOT_MET');

    // Unlock construction-workshop (stage 1) then research-laboratory (stage 2)
    const u1 = unlockFacilityServer({ playgroundState: done.state, facilityId: 'construction-workshop' });
    expect(u1.ok).toBe(true);
    expect(u1.developmentStage.id).toBe('construction_unlocked');

    const u2 = unlockFacilityServer({ playgroundState: u1.state, facilityId: 'research-laboratory' });
    expect(u2.ok).toBe(true);
    expect(u2.developmentStage.id).toBe('research_unlocked');
    expect(computeDevelopmentStage(u2.state.unlockedFacilities).id).toBe('research_unlocked');
  });

  it('prevents frontend PUT /state from forging server-authoritative unlocks and supports full API flow', async () => {
    const db = makeMemoryDb();
    const app = express();
    app.use((req, _res, next) => {
      req.universeCaller = { uid: 'learner-9', orgId: 'org-spark', role: 'student' };
      next();
    });
    app.use('/api/universe/playground', createUniversePlaygroundRouter({ getDb: () => db }));

    // Generate a mission first
    const gen = await invokeRouter(app, 'POST', '/api/universe/playground/missions/generate', {});
    expect(gen.status).toBe(200);
    const missionId = gen.json.mission.id;

    // Attempt to forge unlockedFacilities via PUT /state -> server strips/preserves empty unlocks
    const forged = { ...initialPlaygroundState('thalassa'), unlockedFacilities: ['innovation-center'] };
    const putRes = await invokeRouter(app, 'PUT', '/api/universe/playground/state', { state: forged });
    expect(putRes.status).toBe(200);
    expect(putRes.json.state.unlockedFacilities).toEqual([]);

    // Complete mission with evidence
    const comp = await invokeRouter(app, 'POST', `/api/universe/playground/missions/${missionId}/complete`, {
      evidence: {
        explanation: 'Measured salinity and flow rate across two filter columns.',
        reflection: 'Learned how pore size affects filtration speed and clarity.'
      }
    });
    expect(comp.status).toBe(200);
    expect(comp.json.creditsAwarded).toBe(60);

    // Unlock construction-workshop via authoritative endpoint
    const unlock = await invokeRouter(app, 'POST', '/api/universe/playground/facilities/unlock', {
      facilityId: 'construction-workshop'
    });
    expect(unlock.status).toBe(200);
    expect(unlock.json.developmentStage.id).toBe('construction_unlocked');

    const prog = await invokeRouter(app, 'GET', '/api/universe/playground/progression');
    expect(prog.status).toBe(200);
    expect(prog.json.unlockedFacilities).toContain('construction-workshop');
  });
});
