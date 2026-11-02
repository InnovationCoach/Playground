/**
 * Real frontend HTTP adapter -> real API -> dedicated local emulators.
 * Synthetic actors only. Run explicitly; never imported by an app entry.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createUniverseClient } from '../../src/features/universe/pilot/universeClient.js';
import { PILOT_BUNDLE, REFERENCE_ARTIFACTS } from '../../shared/universe/fixtures/index.js';

for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
  assert.match(process.env[name] || '', /^(127\.0\.0\.1|localhost):\d{2,5}$/, `${name} must explicitly name a local emulator`);
}
assert.match(process.env.GCLOUD_PROJECT || '', /^demo-[a-z0-9-]+$/, 'An explicit dedicated demo project is required');
assert.equal(Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS), false, 'Production service-account credentials are prohibited');
process.env.GOOGLE_CLOUD_PROJECT = process.env.GCLOUD_PROJECT;
process.env.ALLOW_DRAFT_MISSIONS = 'true';
process.env.NODE_ENV = 'test';

const run = randomUUID().slice(0, 8);
const orgId = `g04-school-${run}`;
const foreignOrgId = `g04-other-${run}`;
const classId = `g04-class-${run}`;
const learnerUid = `g04-learner-${run}`;
const coachUid = `g04-coach-${run}`;
const foreignUid = `g04-foreign-${run}`;
const identityKeys = ['releaseId', 'missionId', 'missionVersion', 'routeId', 'taskId', 'policyVersion'];
const key = action => `g04-${action}-${randomUUID()}`;
const copy = value => JSON.parse(JSON.stringify(value));
let env, learner, coach, foreign;

function loaded(result, context) {
  assert.equal(result.state, 'loaded', `${context}: ${JSON.stringify(result)}`);
  return result.data;
}
const learnerClaims = { role: 'student', orgId, classIds: [classId] };
const coachClaims = { role: 'coach', orgId, classIds: [classId] };

before(async () => {
  // Import SDK-bearing code only after the explicit safety checks above.
  const { setupApiTestEnv } = await import('../api/api-test-helper.js');
  env = await setupApiTestEnv();
  await env.db.collection('classes').doc(classId).set({
    orgId, status: 'active', coachIds: [coachUid], learnerIds: [learnerUid]
  });
  for (const [uid, claims, displayName] of [
    [learnerUid, learnerClaims, 'Pilot Learner'],
    [coachUid, coachClaims, 'Pilot Coach'],
    [foreignUid, { role: 'admin', orgId: foreignOrgId, classIds: [] }, 'Other School Reviewer']
  ]) {
    await env.db.collection('users').doc(uid).set({ uid, ...claims, displayName, status: 'active' });
    await env.db.collection('universeMemberships').doc(uid).set({ ...claims, displayName, status: 'active' });
  }
  const learnerToken = await env.getIdToken(learnerUid, learnerClaims);
  const coachToken = await env.getIdToken(coachUid, coachClaims);
  const foreignToken = await env.getIdToken(foreignUid, { role: 'admin', orgId: foreignOrgId, classIds: [] });
  learner = createUniverseClient({ baseUrl: env.baseUrl, getToken: async () => learnerToken });
  coach = createUniverseClient({ baseUrl: env.baseUrl, getToken: async () => coachToken });
  foreign = createUniverseClient({ baseUrl: env.baseUrl, getToken: async () => foreignToken });
});

after(async () => {
  if (env) {
    await env.teardown();
    await env.db.terminate();
    const { getApps, deleteApp } = await import('firebase-admin/app');
    await Promise.all(getApps().map(app => deleteApp(app)));
  }
});

test('all three pilot routes complete the real save/review/revise HTTP flow', async t => {
  const attempts = new Map();
  for (const example of REFERENCE_ARTIFACTS.slice(0, 3)) {
    await t.test(example.name, async () => {
      const missionId = example.endpoint.split('/').at(-2);
      const mission = PILOT_BUNDLE.missions.find(m => m.id === missionId);
      const route = mission.routes.find(r => r.id === example.request.routeId);
      const identity = { missionId, ...Object.fromEntries(identityKeys.filter(k => k !== 'missionId').map(k => [k, example.request[k]])) };
      const baseAttempt = attempts.get(missionId) || 0;
      const availability = loaded(await learner.availability(identity), 'availability');
      assert.deepEqual(availability.identity, identity);
      assert.equal(availability.availability.canSubmit, true, 'isolated fixture is explicitly permitted');
      const initial = loaded(await learner.getDraft(identity), 'initial draft');
      assert.equal(initial.draft, null);

      const draft = {
        ...Object.fromEntries(identityKeys.filter(k => k !== 'missionId').map(k => [k, identity[k]])),
        expectedRevision: 0, supportMode: example.request.supportMode,
        activeStepId: route.steps[0].id, answers: [], evidence: copy(example.request.evidence),
        reflection: example.request.reflection, previousSubmissionId: null
      };
      const saveKey = key('save');
      const saved = loaded(await learner.saveDraft(missionId, draft, saveKey), 'save');
      assert.equal(saved.draft.revision, 1);
      const savedAgain = loaded(await learner.saveDraft(missionId, draft, saveKey), 'save replay');
      assert.equal(savedAgain.idempotentReplay, true);
      assert.deepEqual(savedAgain.draft, saved.draft);

      let expectedDraft = saved.draft;
      if (example === REFERENCE_ARTIFACTS[0]) {
        const newer = { ...draft, expectedRevision: 1, reflection: draft.reflection + ' This is my newer saved explanation.' };
        expectedDraft = loaded(await learner.saveDraft(missionId, newer, key('save-newer')), 'newer save').draft;
        const oldReplay = loaded(await learner.saveDraft(missionId, draft, saveKey), 'old save replay after newer save');
        assert.equal(oldReplay.draft.revision, 1);
        assert.equal(oldReplay.draft.reflection, draft.reflection);
        assert.equal(oldReplay.revision ?? oldReplay.draft.revision, 1);
        assert.deepEqual(loaded(await learner.getDraft(identity), 'current draft after old replay').draft, expectedDraft);
      }

      const submitKey = key('submit');
      const pair = await Promise.all([
        learner.submit(missionId, copy(example.request), submitKey),
        learner.submit(missionId, copy(example.request), submitKey)
      ]);
      pair.forEach(result => loaded(result, 'concurrent create/replay'));
      assert.deepEqual(pair.map(r => r.status).sort(), [200, 201]);
      const first = pair.find(r => r.status === 201).data;
      assert.equal(pair[0].data.submissionId, pair[1].data.submissionId);
      assert.equal(first.attemptNumber, baseAttempt + 1);
      assert.equal(first.submissionRevision, 1);
      assert.equal(first.missionContentHash, mission.contentSha256);

      // Submission snapshots do not delete unrelated/newer saved work.
      assert.deepEqual(loaded(await learner.getDraft(identity), 'draft after submit').draft, expectedDraft);
      const history = loaded(await learner.mySubmissions({ missionId }), 'history');
      assert.equal(history.submissions.filter(s => s.submissionId === first.submissionId).length, 1);
      const queue = loaded(await coach.coachQueue(), 'coach queue');
      const queued = queue.submissions.find(s => s.submissionId === first.submissionId);
      assert.ok(queued);
      assert.deepEqual(queued.evidence, example.request.evidence);
      assert.deepEqual(Object.fromEntries(identityKeys.map(k => [k, queued[k]])), identity);
      const beforeReview = (await env.db.collection('missionSubmissions').doc(first.submissionId).get()).data();

      const forbidden = await foreign.review(first.submissionId, { decision: 'approved', expectedSubmissionRevision: 1 }, key('foreign-review'));
      assert.equal(forbidden.state, 'error');
      assert.equal(forbidden.status, 403, 'another organization cannot review');
      const self = await learner.review(first.submissionId, { decision: 'approved', expectedSubmissionRevision: 1 }, key('self-review'));
      assert.equal(self.state, 'error');
      assert.equal(self.status, 403);

      const note = 'Compare every constraint and explain which observation could change your choice.';
      const returned = loaded(await coach.review(first.submissionId, { decision: 'returned', note, expectedSubmissionRevision: 1 }, key('return')), 'return');
      assert.equal(returned.status, 'returned');
      assert.equal(returned.submissionRevision, 2);
      assert.ok(returned.auditEventId);
      const original = (await env.db.collection('missionSubmissions').doc(first.submissionId).get()).data();
      assert.deepEqual(original.evidence, beforeReview.evidence, 'review preserves the stored evidence exactly');

      if (missionId === 'spacecraft-journey' && route.id === 'guided') {
        const crossRoute = copy(REFERENCE_ARTIFACTS[2].request);
        crossRoute.previousSubmissionId = first.submissionId;
        const rejected = await learner.submit(missionId, crossRoute, key('wrong-route-link'));
        assert.equal(rejected.state, 'error');
        assert.equal(rejected.status, 400, 'a different task cannot masquerade as a revision');
      }

      const revisedBody = { ...copy(example.request), previousSubmissionId: first.submissionId,
        reflection: 'After the feedback, I compared every constraint. ' + example.request.reflection };
      const second = loaded(await learner.submit(missionId, revisedBody, key('resubmit')), 'resubmit');
      assert.notEqual(second.submissionId, first.submissionId);
      assert.equal(second.previousSubmissionId, first.submissionId);
      assert.equal(second.attemptNumber, baseAttempt + 2);
      const approved = loaded(await coach.review(second.submissionId, { decision: 'approved', note: '', expectedSubmissionRevision: 1 }, key('approve')), 'approval');
      assert.equal(approved.status, 'approved');
      assert.equal(approved.submissionRevision, 2);
      assert.equal(approved.outcome.type, 'reviewed-only');
      assert.deepEqual(approved.outcome.grantIds, []);
      const audit = (await env.db.collection('auditLogs').doc('universe').collection('events').doc(approved.auditEventId).get()).data();
      assert.equal(audit.source, 'server');
      assert.equal(audit.orgId, orgId);

      const finalHistory = loaded(await learner.mySubmissions({ missionId }), 'final history').submissions;
      assert.equal(finalHistory.find(s => s.submissionId === first.submissionId).status, 'returned');
      assert.equal(finalHistory.find(s => s.submissionId === second.submissionId).status, 'approved');
      assert.deepEqual((await env.db.collection('missionSubmissions').doc(first.submissionId).get()).data().evidence, beforeReview.evidence);
      const access = loaded(await learner.access(['thalassa', 'ignis', 'boreas']), 'access after review');
      assert.equal(access.destinations.boreas.status, 'locked');
      assert.equal(access.destinations.boreas.evaluatedRule, 'boreas-policy-unresolved');
      attempts.set(missionId, baseAttempt + 2);
    });
  }
});
