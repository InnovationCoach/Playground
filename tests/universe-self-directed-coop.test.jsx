// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import express from 'express';
import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-three/fiber', () => ({ Canvas: ({ children }) => <div data-testid="r3f-canvas">{children}</div>, useFrame: () => {}, useThree: () => ({}) }));
vi.mock('@react-three/drei', () => ({ Html: ({ children }) => <div>{children}</div>, OrbitControls: () => null }));

import catalogV2 from '../public/cosmos/v2/catalog.json';
import { buildCosmos, validateCatalog } from '../src/features/universe/explore/cosmosCatalog.js';
import { PUBLISHED_RELEASES } from '../shared/universe/index.js';
import { PUBLISHED_BUNDLE } from '../shared/universe/publishedRelease.js';
import { REFERENCE_ARTIFACTS } from '../shared/universe/fixtures/index.js';
import { PILOT_RELEASES } from '../src/features/universe/pilot/pilotRegistry.js';
import { evaluateUniverseSubmissionWithAi, isSubstantiveSubmission } from '../server/lib/universe/aiEvaluator.js';
import { formatSubmissionItem } from '../server/lib/universe/cursor.js';
import { createUniversePlaygroundRouter } from '../server/routes/universePlayground.js';
import { createUniverseClient } from '../src/features/universe/pilot/universeClient.js';
import { findPilotMission } from '../src/features/universe/pilot/missionSession.js';
import { PilotMissionSheet } from '../src/features/universe/pilot/PilotMissionSheet.jsx';
import { CoachUniverseSubmissions } from '../src/features/coach/universe/CoachUniverseSubmissions.jsx';
import { MyUniverseExplorer } from '../src/features/universe/explore/MyUniverseExplorer.jsx';
import { SparkUniverse } from '../src/features/dashboard/SparkUniverse.jsx';
import { initialPlaygroundState } from '../src/features/universe/playground/playgroundModel.js';

function makeMemoryDb() {
  const store = new Map();
  return {
    store,
    collection(col) {
      return {
        doc(docId) {
          const topKey = `${col}/${docId}`;
          return {
            async get() {
              return store.has(topKey)
                ? { exists: true, data: () => store.get(topKey) }
                : { exists: false, data: () => undefined };
            },
            async set(val) {
              store.set(topKey, JSON.parse(JSON.stringify(val)));
            },
            collection(sub) {
              const prefix = `${col}/${docId}/${sub}/`;
              return {
                async get() {
                  const docs = [];
                  for (const [k, v] of store.entries()) {
                    if (k.startsWith(prefix)) docs.push({ id: k.slice(prefix.length), data: () => v });
                  }
                  return { forEach: (cb) => docs.forEach(cb) };
                },
                doc(subDocId) {
                  const key = `${prefix}${subDocId}`;
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

let host;
let root;
const settle = async (n = 8) => {
  for (let i = 0; i < n; i += 1) {
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  }
};

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  document.body.innerHTML = '';
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

describe('Published Self-Directed Universe Bundle & v2 Catalog', () => {
  it('publishes self-directed AI missions and restores Thalassa & Ignis 3D surface workstations in v2/catalog.json', () => {
    expect(PUBLISHED_BUNDLE.status).toBe('published');
    expect(PUBLISHED_BUNDLE.policy.type).toBe('ai-self-directed');
    expect(PUBLISHED_BUNDLE.policy.productionSubmissionsAllowed).toBe(true);
    expect(PILOT_RELEASES[0].releaseId).toBe(PUBLISHED_BUNDLE.releaseId);
    expect(PUBLISHED_BUNDLE.missions.every((m) => m.status === 'published' && m.version === '1.0.0')).toBe(true);

    const validation = validateCatalog(catalogV2);
    expect(validation).toEqual([]);
    const cosmos = buildCosmos(catalogV2);
    const thalassa = cosmos.planetById('thalassa');
    const ignis = cosmos.planetById('ignis');
    expect(thalassa.environmentId).toBe('thalassa-station');
    expect(ignis.environmentId).toBe('ignis-fissure-field');

    const thalassaEnv = cosmos.environmentById('thalassa-station');
    const allWorkstations = thalassaEnv.locations.flatMap((l) => l.workstations || []);
    expect(allWorkstations.some((w) => w.kind === 'simulation' && w.id === 'thalassa-station')).toBe(true);
    expect(allWorkstations.some((w) => w.kind === 'mission' && w.id === 'thalassa-wind-survey')).toBe(true);
  });

  it('SparkUniverse hides draft warning banner and enables MissionBuilder for published self-directed routes', async () => {
    await act(async () => {
      root.render(
        <SparkUniverse
          prefs={{ calm: false, interests: ['Space'], tagline: '' }}
          plan={{ goals: [] }}
          uid="learner-1"
          orgId="org-spark"
          onPersonalise={() => {}}
        />
      );
    });
    await settle();
    expect(host.textContent).not.toContain('Teachers are still checking these missions');
    expect(host.textContent).toContain('Start');
  });
});

describe('Self-Directed Spark AI Evaluator & Coach Dashboard AI Reports', () => {
  const windEntry = findPilotMission(PUBLISHED_RELEASES, 'thalassa-wind-survey');
  const guidedRoute = windEntry.mission.routes[0];
  const refArtifact = REFERENCE_ARTIFACTS.find((a) => a.name === 'thalassa-wind-survey-guided').request;

  it('returns placeholder or keyboard-mashed submissions for immediate revision and approves substantive scientific work with zero PII', async () => {
    expect(isSubstantiveSubmission(
      [{ partId: 'data-quality', kind: 'text', text: 'I notice __ because __.' }],
      'We decided to build wind turbines and check night supply.'
    ).ok).toBe(false);

    const promptsSeen = [];
    const approvedEval = await evaluateUniverseSubmissionWithAi({
      resolvedTask: { mission: windEntry.mission, route: guidedRoute },
      validatedSubmission: {
        evidence: refArtifact.evidence,
        reflection: refArtifact.reflection
      },
      alreadyCompletedMission: false,
      generateText: async (prompt) => {
        promptsSeen.push(prompt);
        return JSON.stringify({
          learnerFeedback: 'Clear weighted capacity factor calculation and thoughtful storage plan.',
          strengths: ['Accurate 56.5 h weighted output', 'Identified calm-hour battery gap'],
          nextStep: 'Test wind + storage placement in Thalassa Hex-Grid.',
          coachSummary: 'Learner accurately computed capacity factor (~0.34) and justified hybrid storage.',
          competencies: ['data_analysis', 'scientific_reasoning']
        });
      }
    });

    expect(approvedEval.decision).toBe('approved');
    expect(approvedEval.creditsAwarded).toBe(60);
    expect(approvedEval.aiReport.evaluatedBy).toBe('spark-ai');
    expect(approvedEval.aiReport.source).toBe('gemini');
    expect(approvedEval.aiReport.strengths).toHaveLength(2);
    expect(promptsSeen[0]).not.toMatch(/email|learnerUid|displayName/i);
  });

  it('displays Spark AI approval feedback to the learner and delivers the AI report to CoachUniverseSubmissions', async () => {
    const aiReport = {
      evaluatedBy: 'spark-ai',
      source: 'spark-ai',
      evaluatedAt: '2026-11-28T04:00:00.000Z',
      decision: 'approved',
      learnerFeedback: 'Strong evidence table and clear night-storage contingency.',
      strengths: ['Computed weighted wind hours accurately', 'Addressed calm-period storage'],
      nextStep: 'Try the Ignis spacecraft journey next.',
      coachSummary: 'Completed Thalassa wind survey with verified weighted table and storage reasoning.',
      competencies: ['data_analysis', 'systems_thinking'],
      creditsAwarded: 60
    };

    const storedDoc = formatSubmissionItem('sub-ai-1', {
      orgId: 'org-spark',
      learnerUid: 'learner-1',
      learnerDisplayName: 'Ava M.',
      classIds: ['class-7a'],
      releaseId: PUBLISHED_BUNDLE.releaseId,
      missionId: 'thalassa-wind-survey',
      missionTitle: windEntry.mission.title,
      missionVersion: '1.0.0',
      routeId: 'guided',
      taskId: guidedRoute.taskId,
      policyVersion: PUBLISHED_BUNDLE.policy.version,
      attemptNumber: 1,
      status: 'approved',
      submissionRevision: 1,
      supportMode: 'guided',
      evidence: refArtifact.evidence,
      reflection: refArtifact.reflection,
      coachNote: aiReport.learnerFeedback,
      aiReport,
      outcome: { type: 'ai-self-directed', creditsAwarded: 60 },
      createdAt: '2026-11-28T03:59:50.000Z',
      reviewedAt: '2026-11-28T04:00:00.000Z'
    }, { status: 'open', canStart: true, canResume: true, canSubmit: true });

    // 1. Coach Dashboard sees AI Mission Reports tab by default and renders Coach Summary + Credits + Strengths
    const mockCoachClient = createUniverseClient({
      getToken: async () => 'coach-tok',
      fetchImpl: async (url) => {
        const u = new URL(url, 'http://localhost');
        expect(u.searchParams.get('status')).toBe('approved');
        return new Response(JSON.stringify({
          contractVersion: '1.0.0',
          submissions: [storedDoc],
          nextCursor: null
        }), { status: 200 });
      }
    });

    await act(async () => {
      root.render(
        <CoachUniverseSubmissions
          coachUser={{ uid: 'coach-1', displayName: 'Coach Rivera' }}
          orgId="org-spark"
          client={mockCoachClient}
          registry={PUBLISHED_RELEASES}
        />
      );
    });
    await settle();

    expect(host.textContent).toContain('My Universe · AI Mission Reports');
    expect(host.textContent).toContain('Spark AI Report');
    expect(host.textContent).toContain('+60 Universe Credits awarded');
    expect(host.textContent).toContain('Completed Thalassa wind survey with verified weighted table');
    expect(host.textContent).toContain('Computed weighted wind hours accurately');

    // 2. Learner History view shows Approved by Spark AI + credits + Coach Dashboard delivery confirmation
    const mockLearnerClient = createUniverseClient({
      getToken: async () => 'learner-tok',
      fetchImpl: async (url) => {
        const u = new URL(url, 'http://localhost');
        if (u.pathname.endsWith('/availability')) {
          return new Response(JSON.stringify({
            contractVersion: '1.0.0',
            availability: { status: 'open', canStart: true, canResume: true, canSubmit: true }
          }), { status: 200 });
        }
        if (u.pathname.endsWith('/draft')) {
          return new Response(JSON.stringify({ contractVersion: '1.0.0', draft: null }), { status: 200 });
        }
        return new Response(JSON.stringify({
          contractVersion: '1.0.0',
          submissions: [storedDoc],
          nextCursor: null
        }), { status: 200 });
      }
    });

    await act(async () => {
      root.render(
        <PilotMissionSheet
          entry={windEntry}
          registry={PUBLISHED_RELEASES}
          client={mockLearnerClient.withScope({ uid: 'learner-1', orgId: 'org-spark' })}
          preview={false}
          initial={{ id: 'thalassa-wind-survey', route: 'guided', view: 'history' }}
          onClose={() => {}}
        />
      );
    });
    await settle();
    expect(document.body.textContent).toContain('Approved by Spark AI');
    expect(document.body.textContent).toContain('+60 Universe Credits');
    expect(document.body.textContent).toContain('sent to your Coach Dashboard');
  });
});

describe('Classroom Co-Op Privacy Mode (Backend & 3D Visit)', () => {
  it('enforces class-roster boundaries, First-Name + Last-Initial privacy, peer aid habitability boosts, and 3D visit banner', async () => {
    const db = makeMemoryDb();
    db.store.set('users/peer-ava', { displayName: 'Ava Martinez', email: 'ava.martinez@school.org' });
    db.store.set('users/outsider-zoe', { displayName: 'Zoe Outsider', email: 'zoe@school.org' });

    // Seed Ava's planet (Ignis) with built feature + active hazard, and Outsider Zoe's planet
    const avaPg = initialPlaygroundState('ignis');
    avaPg.planets.ignis.features = ['geodesic-biodome'];
    avaPg.planets.ignis.habitability = 48;
    avaPg.planets.ignis.activeHazard = { id: 'solar-flare', title: 'Solar Flare', desc: 'Storm', targetStat: 'habitability', penalty: 10, mitigationFeature: 'magnetic-shield', week: 1 };
    db.store.set('orgs/org-spark/universePlayground/peer-ava', {
      ...avaPg,
      unlockedFacilities: ['research-laboratory']
    });
    db.store.set('orgs/org-spark/universePlayground/outsider-zoe', initialPlaygroundState('nyxara'));

    const classDocsById = new Map([
      ['class-7a', { orgId: 'org-spark', learnerIds: ['learner-leo', 'peer-ava'], coachIds: ['coach-1'] }]
    ]);

    const app = express();
    app.use((req, _res, next) => {
      req.universeCaller = {
        uid: 'learner-leo',
        orgId: 'org-spark',
        role: 'student',
        displayName: 'Leo Kim',
        classIds: ['class-7a'],
        classDocsById
      };
      next();
    });
    app.use('/api/universe/playground', createUniversePlaygroundRouter({ getDb: () => db }));

    // Initialize Leo
    await invokeRouter(app, 'GET', '/api/universe/playground');

    // 1. GET /classmates lists ONLY verified classmate Ava formatted as "Ava M." (never surname or email or outsider)
    const listRes = await invokeRouter(app, 'GET', '/api/universe/playground/classmates');
    expect(listRes.status).toBe(200);
    expect(listRes.json.privacyMode).toBe('first-name-initial');
    expect(listRes.json.peers).toHaveLength(1);
    expect(listRes.json.peers[0].stewardName).toBe('Ava M.');
    expect(JSON.stringify(listRes.json)).not.toMatch(/Martinez|ava\.martinez@|outsider-zoe/i);

    // 2. GET /visit/:peerId allows classmate Ava and blocks cross-class Zoe with 403
    const visitAllowed = await invokeRouter(app, 'GET', '/api/universe/playground/visit/peer-ava');
    expect(visitAllowed.status).toBe(200);
    expect(visitAllowed.json.visit.stewardName).toBe('Ava M.');
    expect(visitAllowed.json.visit.planetId).toBe('ignis');
    expect(visitAllowed.json.visit.record.features).toContain('geodesic-biodome');

    const visitDenied = await invokeRouter(app, 'GET', '/api/universe/playground/visit/outsider-zoe');
    expect(visitDenied.status).toBe(403);

    // 3. POST /aid with targetPeerId boosts Ava's Ignis habitability (+10%) and awards +10 Cr to Leo
    const aidRes = await invokeRouter(app, 'POST', '/api/universe/playground/aid', {
      targetPlanetId: 'ignis',
      targetPeerId: 'peer-ava'
    });
    expect(aidRes.status).toBe(200);
    expect(aidRes.json.creditDelta).toBe(10);
    const updatedAva = db.store.get('orgs/org-spark/universePlayground/peer-ava');
    expect(updatedAva.planets.ignis.habitability).toBe(58);
    expect(updatedAva.planets.ignis.activeHazard).toBeNull();
    expect(updatedAva.unlockedFacilities).toContain('research-laboratory');
    expect(updatedAva.captainsLog[0].note).toContain('Leo K.');
    expect(updatedAva.captainsLog[0].note).not.toContain('Kim');

    // 4. UI: MyUniverseExplorer opens Co-Op & Events tab, visits Ava M.'s Ignis, and renders read-only visit banner
    localStorage.setItem('spark_universe_intro_seen_v1_learner-leo', '1');
    await act(async () => {
      root.render(
        <MyUniverseExplorer
          preview={false}
          enablePlayground={true}
          forceTextView={true}
          loadCatalog={async () => buildCosmos(catalogV2)}
          viewer={{ uid: 'learner-leo', orgId: 'org-spark' }}
          uid="learner-leo"
          coopClient={{
            loadClassmates: async () => listRes.json.peers,
            visitPeer: async () => visitAllowed.json.visit,
            sendAid: async () => ({ ok: true, state: aidRes.json.state })
          }}
          onClose={() => {}}
        />
      );
    });
    await settle();

    const pgToggle = document.body.querySelector('.upg-toggle-btn');
    await act(async () => pgToggle.click());
    await settle();

    const coopTab = [...document.body.querySelectorAll('[role="tab"]')].find((b) => b.textContent.includes('Co-Op'));
    await act(async () => coopTab.click());
    await settle();

    expect(document.body.textContent).toContain('Classroom Co-Op · Privacy Mode');
    expect(document.body.textContent).toContain('Ava M. · Ignis');

    const visitBtn = [...document.body.querySelectorAll('button')].find((b) => b.textContent.includes('Visit Ignis in 3D'));
    await act(async () => visitBtn.click());
    await settle();

    const banner = document.body.querySelector('.mx-coop-visit-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('Visiting Ava M.’s Ignis');
    expect(banner.textContent).toContain('Read-only');
  });
});
