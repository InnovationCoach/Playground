import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import { setupApiTestEnv } from './api-test-helper.js';
import { FIXTURE_RELEASES, REFERENCE_ARTIFACTS } from '../../shared/universe/fixtures/index.js';
import { API_CONTRACT_VERSION, PUBLISHED_RELEASES } from '../../shared/universe/index.js';
import { isEmulatorEnvironment, getTaskStatusOverrideDocId } from '../../server/lib/universe/missions.js';

describe('API: My Universe Pilot Contract 0.1.1 & G04 Findings B1-B6', () => {
  let env;
  let learnerTokenA;
  let learnerTokenB;
  let coachTokenA;
  let coachTokenB;
  let adminTokenA;

  const ORG_A = 'org-alpha';
  const ORG_B = 'org-beta';
  const CLASS_A = 'class_orbit_a';
  const CLASS_B = 'class_orbit_b';

  const RELEASE_ID = 'pilot-fixture-g03-20261102-v2';
  const SPACECRAFT_MISSION = 'spacecraft-journey';
  const SPACECRAFT_GUIDED_TASK = 'journey-rates';
  const SPACECRAFT_ADVANCED_TASK = 'journey-mass-power';
  const WIND_MISSION = 'thalassa-wind-survey';
  const WIND_TASK = 'wind-capacity-factor';
  const MISSION_VERSION = '0.2.0-draft';
  const POLICY_VERSION = 'pilot-review-only-0.1.0-draft';

  const clone = (val) => JSON.parse(JSON.stringify(val));

  const windGuidedSubmissionExample = clone(
    REFERENCE_ARTIFACTS.find((a) => a.name === 'thalassa-wind-survey-guided').request
  );
  const guidedSubmissionExample = clone(
    REFERENCE_ARTIFACTS.find((a) => a.name === 'spacecraft-journey-guided').request
  );
  const advancedSubmissionExample = clone(
    REFERENCE_ARTIFACTS.find((a) => a.name === 'spacecraft-journey-advanced').request
  );

  const guidedDraftExample = {
    contractVersion: API_CONTRACT_VERSION,
    releaseId: RELEASE_ID,
    missionVersion: MISSION_VERSION,
    routeId: 'guided',
    taskId: SPACECRAFT_GUIDED_TASK,
    policyVersion: POLICY_VERSION,
    expectedRevision: 0,
    supportMode: 'guided',
    activeStepId: 'days',
    answers: [{ stepId: 'days', kind: 'number', rawText: '41.67', value: 41.67 }],
    evidence: [
      {
        partId: 'criteria',
        kind: 'text',
        text: 'Use arrival at most 80 days and food at most 400 kg.'
      }
    ],
    reflection: 'Initial draft reflection on chemical vs ion constant-rate transit.'
  };

  async function seedBaseAuthority() {
    learnerTokenA = await env.getIdToken('learner_a', {
      role: 'student',
      orgId: ORG_A,
      classIds: [CLASS_A]
    });
    learnerTokenB = await env.getIdToken('learner_b', {
      role: 'student',
      orgId: ORG_A,
      classIds: [CLASS_B]
    });
    coachTokenA = await env.getIdToken('coach_alpha', {
      role: 'coach',
      orgId: ORG_A,
      classIds: [CLASS_A]
    });
    coachTokenB = await env.getIdToken('coach_beta', {
      role: 'coach',
      orgId: ORG_A,
      classIds: [CLASS_B]
    });
    adminTokenA = await env.getIdToken('admin_alpha', {
      role: 'admin',
      orgId: ORG_A,
      classIds: []
    });

    await Promise.all([
      env.db.collection('classes').doc(CLASS_A).set({
        classId: CLASS_A,
        orgId: ORG_A,
        name: 'Orbit Class A',
        coachIds: ['coach_alpha'],
        learnerIds: ['learner_a']
      }),
      env.db.collection('classes').doc(CLASS_B).set({
        classId: CLASS_B,
        orgId: ORG_A,
        name: 'Orbit Class B',
        coachIds: ['coach_beta'],
        learnerIds: ['learner_b']
      }),
      env.db.collection('users').doc('learner_a').set({
        uid: 'learner_a',
        email: 'learner_a@welearn.test',
        displayName: 'Learner A',
        role: 'student',
        orgId: ORG_A,
        classIds: [CLASS_A]
      }),
      env.db.collection('users').doc('learner_b').set({
        uid: 'learner_b',
        email: 'learner_b@welearn.test',
        displayName: 'Learner B',
        role: 'student',
        orgId: ORG_A,
        classIds: [CLASS_B]
      }),
      env.db.collection('users').doc('coach_alpha').set({
        uid: 'coach_alpha',
        email: 'coach_alpha@welearn.test',
        displayName: 'Coach Alpha',
        role: 'coach',
        orgId: ORG_A,
        classIds: [CLASS_A]
      }),
      env.db.collection('users').doc('coach_beta').set({
        uid: 'coach_beta',
        email: 'coach_beta@welearn.test',
        displayName: 'Coach Beta',
        role: 'coach',
        orgId: ORG_A,
        classIds: [CLASS_B]
      }),
      env.db.collection('users').doc('admin_alpha').set({
        uid: 'admin_alpha',
        email: 'admin_alpha@welearn.test',
        displayName: 'Admin Alpha',
        role: 'admin',
        orgId: ORG_A,
        classIds: []
      })
    ]);
  }

  async function clearCollections(names) {
    const events = await env.db.collection('auditLogs').doc('universe').collection('events').get();
    if (!events.empty) {
      const batch = env.db.batch(); events.docs.forEach(d => batch.delete(d.ref)); await batch.commit();
    }
    for (const name of names) {
      const snap = await env.db.collection(name).get();
      if (!snap.empty) {
        const batch = env.db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
  }

  beforeAll(async () => {
    env = await setupApiTestEnv({ universeRegistry: FIXTURE_RELEASES });
  });

  afterAll(async () => {
    await env?.teardown();
  });

  beforeEach(async () => {
    process.env.ALLOW_DRAFT_MISSIONS = 'true';
    await clearCollections([
      'missionSubmissions',
      'missionDrafts',
      'missionSubmissionLocks',
      'missionRevisionLinks',
      'universeIdempotency',
      'universeMemberships',
      'universeTaskStatus',
      'auditLogs',
      'classes',
      'users'
    ]);
    await seedBaseAuthority();
  });

  describe('B1 & B2: Live Server-Controlled Authority, Forged Profile Rejection & Class Integrity', () => {
    it('B1: rejects unauthenticated callers with 401 UNAUTHENTICATED and standard headers', async () => {
      const res = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
        headers: { 'Idempotency-Key': 'unauth-key-0001' },
        body: guidedSubmissionExample
      });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
      expect(res.headers['x-universe-contract-version']).toBe('1.0.0');
      expect(res.headers['cache-control']).toBe('private, no-store');
    });

    it('B1: rejects caller whose custom token has no stored Auth customClaims and no universeMemberships doc even if users/{uid} has forged orgId/classIds', async () => {
      try {
        await env.auth.getUser('forged_profile_user');
      } catch {
        await env.auth.createUser({ uid: 'forged_profile_user', email: 'forged@welearn.test' });
      }
      await env.auth.setCustomUserClaims('forged_profile_user', {});
      // Mint custom token with ad-hoc claims NOT stored via setCustomUserClaims
      const unbackedCustomToken = await env.auth.createCustomToken('forged_profile_user', {
        role: 'student',
        orgId: ORG_A,
        classIds: [CLASS_A]
      });
      const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
      const tokenRes = await fetch(
        `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-key`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: unbackedCustomToken, returnSecureToken: true })
        }
      );
      const { idToken: unbackedIdToken } = await tokenRes.json();

      // Seed forged users/{uid} profile and class roster
      await env.db.collection('users').doc('forged_profile_user').set({
        uid: 'forged_profile_user',
        role: 'student',
        orgId: ORG_A,
        classIds: [CLASS_A]
      });
      await env.db.collection('classes').doc(CLASS_A).update({
        learnerIds: ['learner_a', 'forged_profile_user']
      });

      const res = await env.request('GET', `/api/universe/missions/${SPACECRAFT_MISSION}/availability`, {
        token: unbackedIdToken,
        query: {
          releaseId: RELEASE_ID,
          missionVersion: MISSION_VERSION,
          routeId: 'guided',
          taskId: SPACECRAFT_GUIDED_TASK,
          policyVersion: POLICY_VERSION
        }
      });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('B1: immediately rejects old token when live Auth customClaims or universeMemberships revokes org, role, or class scope, including on idempotent replay', async () => {
      // 1. Save draft and submit with valid learnerTokenA
      const draftRes = await env.request('PUT', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'b1-draft-replay-key-01' },
        body: guidedDraftExample
      });
      expect(draftRes.status).toBe(200);

      const subRes = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'b1-sub-replay-key-01' },
        body: guidedSubmissionExample
      });
      expect(subRes.status).toBe(201);
      const subId = subRes.body.submissionId;

      // 2. Coach A reviews submission
      const revRes = await env.request('POST', `/api/coach/universe/submissions/${subId}/review`, {
        token: coachTokenA,
        headers: { 'Idempotency-Key': 'b1-review-replay-key-01' },
        body: {
          contractVersion: API_CONTRACT_VERSION,
          expectedSubmissionRevision: 1,
          decision: 'approved',
          note: 'Approved with valid scope.'
        }
      });
      expect(revRes.status).toBe(200);

      // 3. Revoke learner_a's stored Auth customClaims while learnerTokenA JWT is still unexpired
      await env.auth.setCustomUserClaims('learner_a', {
        role: 'student',
        orgId: ORG_B,
        classIds: [CLASS_A]
      });

      // Replay draft save and submission with old learnerTokenA -> must fail closed 403 because token orgId != live stored orgId
      const staleDraftReplay = await env.request('PUT', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'b1-draft-replay-key-01' },
        body: guidedDraftExample
      });
      expect(staleDraftReplay.status).toBe(403);

      const staleSubReplay = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'b1-sub-replay-key-01' },
        body: guidedSubmissionExample
      });
      expect(staleSubReplay.status).toBe(403);

      // Restore learner_a claims, but revoke coach_alpha from CLASS_A in live universeMemberships
      await env.auth.setCustomUserClaims('learner_a', {
        role: 'student',
        orgId: ORG_A,
        classIds: [CLASS_A]
      });
      await env.db.collection('universeMemberships').doc('coach_alpha').set({
        uid: 'coach_alpha',
        role: 'coach',
        orgId: ORG_A,
        classIds: [CLASS_B],
        status: 'active'
      });
      await env.db.collection('classes').doc(CLASS_B).update({
        coachIds: ['coach_beta', 'coach_alpha']
      });

      // Coach A replays review of Class A submission with old coachTokenA -> must fail 403
      const staleReviewReplay = await env.request('POST', `/api/coach/universe/submissions/${subId}/review`, {
        token: coachTokenA,
        headers: { 'Idempotency-Key': 'b1-review-replay-key-01' },
        body: {
          contractVersion: API_CONTRACT_VERSION,
          expectedSubmissionRevision: 1,
          decision: 'approved',
          note: 'Approved with valid scope.'
        }
      });
      expect(staleReviewReplay.status).toBe(403);
    });

    it('B2: fails closed (403) when classes/{classId} is missing, deleted, malformed, wrong-org, or roster-revoked', async () => {
      // 1. Delete classes/class_orbit_a -> must fail closed even though token claims class_orbit_a
      await env.db.collection('classes').doc(CLASS_A).delete();
      const missingClassRes = await env.request('GET', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        query: {
          releaseId: RELEASE_ID,
          missionVersion: MISSION_VERSION,
          routeId: 'guided',
          taskId: SPACECRAFT_GUIDED_TASK,
          policyVersion: POLICY_VERSION
        }
      });
      expect(missingClassRes.status).toBe(403);

      // 2. Malformed class doc (non-array learnerIds/coachIds) -> must fail closed
      await env.db.collection('classes').doc(CLASS_A).set({
        classId: CLASS_A,
        orgId: ORG_A,
        coachIds: 'not-an-array',
        learnerIds: 'not-an-array'
      });
      const malformedClassRes = await env.request('GET', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        query: {
          releaseId: RELEASE_ID,
          missionVersion: MISSION_VERSION,
          routeId: 'guided',
          taskId: SPACECRAFT_GUIDED_TASK,
          policyVersion: POLICY_VERSION
        }
      });
      expect(malformedClassRes.status).toBe(403);

      // 3. Wrong-org class doc -> must fail closed
      await env.db.collection('classes').doc(CLASS_A).set({
        classId: CLASS_A,
        orgId: ORG_B,
        coachIds: ['coach_alpha'],
        learnerIds: ['learner_a']
      });
      const wrongOrgClassRes = await env.request('GET', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        query: {
          releaseId: RELEASE_ID,
          missionVersion: MISSION_VERSION,
          routeId: 'guided',
          taskId: SPACECRAFT_GUIDED_TASK,
          policyVersion: POLICY_VERSION
        }
      });
      expect(wrongOrgClassRes.status).toBe(403);

      // 4. Learner removed from classIds roster -> fails closed
      await env.db.collection('classes').doc(CLASS_A).set({
        classId: CLASS_A,
        orgId: ORG_A,
        coachIds: ['coach_alpha'],
        learnerIds: []
      });
      const removedRosterRes = await env.request('GET', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        query: {
          releaseId: RELEASE_ID,
          missionVersion: MISSION_VERSION,
          routeId: 'guided',
          taskId: SPACECRAFT_GUIDED_TASK,
          policyVersion: POLICY_VERSION
        }
      });
      expect(removedRosterRes.status).toBe(403);
    });
  });

  describe('B3: Strict Emulator Environment & Production Fixture Isolation', () => {
    it('B3: isEmulatorEnvironment requires both localhost Firestore and Auth emulator hosts, a nonempty demo-* project, and no GOOGLE_APPLICATION_CREDENTIALS', () => {
      expect(
        isEmulatorEnvironment({
          FIRESTORE_EMULATOR_HOST: '127.0.0.1:8088',
          FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
          GCLOUD_PROJECT: 'demo-hearisland-api-test'
        })
      ).toBe(true);

      // FUNCTIONS_EMULATOR='true' alone without Auth/Firestore emulator hosts must be false
      expect(
        isEmulatorEnvironment({
          FUNCTIONS_EMULATOR: 'true',
          GCLOUD_PROJECT: 'demo-hearisland-api-test'
        })
      ).toBe(false);

      // Missing FIREBASE_AUTH_EMULATOR_HOST must be false
      expect(
        isEmulatorEnvironment({
          FIRESTORE_EMULATOR_HOST: '127.0.0.1:8088',
          GCLOUD_PROJECT: 'demo-hearisland-api-test'
        })
      ).toBe(false);

      // Empty or bare 'demo-' project ID must be false
      expect(
        isEmulatorEnvironment({
          FIRESTORE_EMULATOR_HOST: '127.0.0.1:8088',
          FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
          GCLOUD_PROJECT: 'demo-'
        })
      ).toBe(false);

      // Non-demo project ID must be false
      expect(
        isEmulatorEnvironment({
          FIRESTORE_EMULATOR_HOST: '127.0.0.1:8088',
          FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
          GCLOUD_PROJECT: 'hearisland-production'
        })
      ).toBe(false);

      // GOOGLE_APPLICATION_CREDENTIALS set must be false
      expect(
        isEmulatorEnvironment({
          FIRESTORE_EMULATOR_HOST: '127.0.0.1:8088',
          FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
          GCLOUD_PROJECT: 'demo-hearisland-api-test',
          GOOGLE_APPLICATION_CREDENTIALS: '/path/to/prod-creds.json'
        })
      ).toBe(false);
    });

    it('B3: rejects draft/fixture missions with 409 MISSION_NOT_OPEN when ALLOW_DRAFT_MISSIONS is unset or emulator host is absent', async () => {
      const savedAllow = process.env.ALLOW_DRAFT_MISSIONS;
      delete process.env.ALLOW_DRAFT_MISSIONS;

      try {
        const res = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
          token: learnerTokenA,
          headers: { 'Idempotency-Key': 'prod-mode-draft-reject-01' },
          body: guidedSubmissionExample
        });
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('MISSION_NOT_OPEN');
      } finally {
        process.env.ALLOW_DRAFT_MISSIONS = savedAllow;
      }

      const savedAuthHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
      try {
        const res = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
          token: learnerTokenA,
          headers: { 'Idempotency-Key': 'no-auth-host-draft-reject-01' },
          body: guidedSubmissionExample
        });
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('MISSION_NOT_OPEN');
      } finally {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = savedAuthHost;
      }
    });

    it('B3: default production PUBLISHED_RELEASES is empty and rejects fixture releaseId with 409 CONTENT_VERSION_UNAVAILABLE', async () => {
      expect(PUBLISHED_RELEASES).toEqual([]);
      const prodEnv = await setupApiTestEnv({ universeRegistry: PUBLISHED_RELEASES });
      try {
        const res = await prodEnv.request('GET', `/api/universe/missions/${SPACECRAFT_MISSION}/availability`, {
          token: learnerTokenA,
          query: {
            releaseId: RELEASE_ID,
            missionVersion: MISSION_VERSION,
            routeId: 'guided',
            taskId: SPACECRAFT_GUIDED_TASK,
            policyVersion: POLICY_VERSION
          }
        });
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('CONTENT_VERSION_UNAVAILABLE');
      } finally {
        await prodEnv.teardown();
      }
    });
  });

  describe('B4: Draft Save, Revision Conflict & Coherent Idempotent Replay', () => {
    it('B4: saves draft revision 1, advances to revision 2 on save B, and returns coherent revision 1 snapshot when save A is replayed without overwriting revision 2', async () => {
      // Save A: expectedRevision 0 -> revision 1
      const saveA = await env.request('PUT', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'draft-save-key-A' },
        body: guidedDraftExample
      });
      expect(saveA.status).toBe(200);
      expect(saveA.body.revision).toBe(1);
      expect(saveA.body.idempotentReplay).toBe(false);
      expect(saveA.body.draft.revision).toBe(1);
      expect(saveA.body.draft.activeStepId).toBe('days');

      // Save B: expectedRevision 1 -> revision 2 with updated activeStepId and reflection
      const draftBodyB = {
        ...guidedDraftExample,
        expectedRevision: 1,
        activeStepId: 'reflect',
        reflection: 'Updated draft B reflection text after completing step 2.'
      };
      const saveB = await env.request('PUT', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'draft-save-key-B' },
        body: draftBodyB
      });
      expect(saveB.status).toBe(200);
      expect(saveB.body.revision).toBe(2);
      expect(saveB.body.idempotentReplay).toBe(false);
      expect(saveB.body.draft.revision).toBe(2);
      expect(saveB.body.draft.activeStepId).toBe('reflect');

      // Replay Save A with key A and original body A -> must return coherent revision 1 snapshot
      const replayA = await env.request('PUT', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'draft-save-key-A' },
        body: guidedDraftExample
      });
      expect(replayA.status).toBe(200);
      expect(replayA.body.idempotentReplay).toBe(true);
      expect(replayA.body.revision).toBe(1);
      expect(replayA.body.draft.revision).toBe(1);
      expect(replayA.body.draft.activeStepId).toBe('days');
      expect(replayA.body.draft.reflection).toBe(guidedDraftExample.reflection);

      // GET /draft must still return revision 2 (save B was not overwritten)
      const getDraft = await env.request('GET', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        query: {
          releaseId: RELEASE_ID,
          missionVersion: MISSION_VERSION,
          routeId: 'guided',
          taskId: SPACECRAFT_GUIDED_TASK,
          policyVersion: POLICY_VERSION
        }
      });
      expect(getDraft.status).toBe(200);
      expect(getDraft.body.draft.revision).toBe(2);
      expect(getDraft.body.draft.activeStepId).toBe('reflect');
      expect(getDraft.body.draft.reflection).toBe(draftBodyB.reflection);

      // Stale expectedRevision with a new Idempotency-Key returns 409 DRAFT_CONFLICT
      const conflictRes = await env.request('PUT', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'draft-save-key-C-conflict' },
        body: guidedDraftExample
      });
      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.error.code).toBe('DRAFT_CONFLICT');
      expect(conflictRes.body.error.details.currentRevision).toBe(2);

      // Reusing Idempotency-Key A with a different payload returns 409 IDEMPOTENCY_KEY_REUSED
      const reusedKeyRes = await env.request('PUT', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'draft-save-key-A' },
        body: draftBodyB
      });
      expect(reusedKeyRes.status).toBe(409);
      expect(reusedKeyRes.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    });
  });

  describe('B5: Strict previousSubmissionId Task Identity & Legacy Format Rejection', () => {
    it('B5: enforces exact task identity and returned status on previousSubmissionId in both PUT /draft and POST /submissions, and rejects legacy 0.1.0-draft submissions', async () => {
      // 1. Create a returned guided submission for learner_a
      const sub1 = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'b5-guided-sub-0001' },
        body: guidedSubmissionExample
      });
      expect(sub1.status).toBe(201);
      const guidedReturnedId = sub1.body.submissionId;

      // Before return (while status is 'submitted'), referencing it as previousSubmissionId must fail 400
      const draftWhileSubmitted = await env.request('PUT', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'b5-draft-while-submitted' },
        body: {
          ...guidedDraftExample,
          previousSubmissionId: guidedReturnedId
        }
      });
      expect(draftWhileSubmitted.status).toBe(400);
      expect(draftWhileSubmitted.body.error.code).toBe('VALIDATION_ERROR');

      // Coach returns guidedReturnedId
      const retRes = await env.request('POST', `/api/coach/universe/submissions/${guidedReturnedId}/review`, {
        token: coachTokenA,
        headers: { 'Idempotency-Key': 'b5-coach-return-0001' },
        body: {
          contractVersion: API_CONTRACT_VERSION,
          expectedSubmissionRevision: 1,
          decision: 'returned',
          note: 'Please expand the propellant mass trade-off.'
        }
      });
      expect(retRes.status).toBe(200);

      // 2. Trying to link guidedReturnedId from the ADVANCED route must fail 400 in POST /submissions
      const wrongRouteSub = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'b5-wrong-route-sub-01' },
        body: {
          ...advancedSubmissionExample,
          previousSubmissionId: guidedReturnedId
        }
      });
      expect(wrongRouteSub.status).toBe(400);
      expect(wrongRouteSub.body.error.code).toBe('VALIDATION_ERROR');

      // 3. Seed a legacy 0.1.0-draft returned submission and verify it cannot be used as previousSubmissionId
      await env.db.collection('missionSubmissions').doc('legacy_returned_sub').set({
        submissionId: 'legacy_returned_sub',
        orgId: ORG_A,
        learnerUid: 'learner_a',
        classIds: [CLASS_A],
        missionId: SPACECRAFT_MISSION,
        missionVersion: '0.1.0-draft',
        routeId: 'guided',
        status: 'returned',
        reflection: 'Legacy reflection text from 0.1.0-draft.',
        coachUid: 'coach_alpha',
        coachNote: 'Legacy coach note',
        createdAt: Timestamp.now()
      });

      const legacyLinkDraft = await env.request('PUT', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'b5-legacy-link-draft-01' },
        body: {
          ...guidedDraftExample,
          previousSubmissionId: 'legacy_returned_sub'
        }
      });
      expect(legacyLinkDraft.status).toBe(400);
      expect(legacyLinkDraft.body.error.code).toBe('VALIDATION_ERROR');

      const legacyLinkSub = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'b5-legacy-link-sub-01' },
        body: {
          ...guidedSubmissionExample,
          previousSubmissionId: 'legacy_returned_sub'
        }
      });
      expect(legacyLinkSub.status).toBe(400);
      expect(legacyLinkSub.body.error.code).toBe('VALIDATION_ERROR');

      // 4. Valid resubmission on the matching guided route succeeds with attemptNumber: 2 and previousCoachNote
      const validResub = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'b5-valid-guided-resub' },
        body: {
          ...guidedSubmissionExample,
          previousSubmissionId: guidedReturnedId
        }
      });
      expect(validResub.status).toBe(201);
      expect(validResub.body.attemptNumber).toBe(2);
      expect(validResub.body.submissionRevision).toBe(1);
      expect(validResub.body.previousSubmissionId).toBe(guidedReturnedId);
      expect(validResub.body.submission.previousCoachNote).toBe('Please expand the propellant mass trade-off.');
    });
  });

  describe('B6: 64 KiB Transport & Stored Record Budget Across Submission & Review', () => {
    it('B6: rejects raw HTTP requests over 64 KiB with 413 PAYLOAD_TOO_LARGE', async () => {
      const oversizedRaw = JSON.stringify({
        ...guidedDraftExample,
        reflection: 'x'.repeat(70000)
      });
      const res = await env.request('PUT', `/api/universe/missions/${SPACECRAFT_MISSION}/draft`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'b6-oversized-raw-01' },
        rawBody: oversizedRaw
      });
      expect(res.status).toBe(413);
      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });

    it('B6: rejects coach review with 413 PAYLOAD_TOO_LARGE if adding review fields would push the stored submission record over 64 KiB', async () => {
      const subRes = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'b6-sub-near-limit-01' },
        body: guidedSubmissionExample
      });
      expect(subRes.status).toBe(201);
      const subId = subRes.body.submissionId;

      // Pad the stored submission document in Firestore so it is ~65,100 bytes (under 65,536 before review, over 65,536 with a 900-char review note)
      await env.db.collection('missionSubmissions').doc(subId).update({
        previousCoachNote: 'P'.repeat(63800)
      });

      const reviewOverLimit = await env.request('POST', `/api/coach/universe/submissions/${subId}/review`, {
        token: coachTokenA,
        headers: { 'Idempotency-Key': 'b6-review-over-limit-01' },
        body: {
          contractVersion: API_CONTRACT_VERSION,
          expectedSubmissionRevision: 1,
          decision: 'returned',
          note: 'N'.repeat(900)
        }
      });
      expect(reviewOverLimit.status).toBe(413);
      expect(reviewOverLimit.body.error.code).toBe('PAYLOAD_TOO_LARGE');

      // Verify submission remained in 'submitted' status (transaction aborted cleanly)
      const snapAfter = await env.db.collection('missionSubmissions').doc(subId).get();
      expect(snapAfter.data().status).toBe('submitted');
    });
  });

  describe('Contract 0.1.1 Lifecycle: Availability, Open-Slot Lock, Reviewed-Only Outcome, Access & Exact Paging', () => {
    it('enforces dynamic withdrawn/retired task status overrides via universeTaskStatus', async () => {
      const overrideDocId = getTaskStatusOverrideDocId({
        releaseId: RELEASE_ID,
        missionId: SPACECRAFT_MISSION,
        missionVersion: MISSION_VERSION,
        routeId: 'guided',
        taskId: SPACECRAFT_GUIDED_TASK,
        policyVersion: POLICY_VERSION
      });
      await env.db.collection('universeTaskStatus').doc(overrideDocId).set({
        status: 'withdrawn',
        reason: 'This investigation is paused for a correction.',
        availabilityRevision: 2
      });

      const availRes = await env.request('GET', `/api/universe/missions/${SPACECRAFT_MISSION}/availability`, {
        token: learnerTokenA,
        query: {
          releaseId: RELEASE_ID,
          missionVersion: MISSION_VERSION,
          routeId: 'guided',
          taskId: SPACECRAFT_GUIDED_TASK,
          policyVersion: POLICY_VERSION
        }
      });
      expect(availRes.status).toBe(200);
      expect(availRes.body.availability.status).toBe('withdrawn');
      expect(availRes.body.availability.canSubmit).toBe(false);
      expect(availRes.body.availability.reasonCode).toBe('MISSION_WITHDRAWN');

      const withdrawnSub = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'withdrawn-sub-attempt-01' },
        body: guidedSubmissionExample
      });
      expect(withdrawnSub.status).toBe(409);
      expect(withdrawnSub.body.error.code).toBe('MISSION_WITHDRAWN');
    });

    it('enforces single open submission slot per [orgId, learnerUid, missionId], writes atomic audit logs, returns reviewed-only zero grants, and keeps Boreas locked under reviewed-only policy', async () => {
      // 1. Submit spacecraft-journey
      const sub1 = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'lifecycle-sub-01' },
        body: guidedSubmissionExample
      });
      expect(sub1.status).toBe(201);
      expect(sub1.body.auditEventId).toBeTruthy();

      // Verify submission audit log was atomically created
      const subAuditSnap = await env.db.collection('auditLogs').doc('universe').collection('events').doc(sub1.body.auditEventId).get();
      expect(subAuditSnap.exists).toBe(true);
      expect(subAuditSnap.data().action).toBe('universe.mission.submitted');

      // 2. Duplicate open submission with a new Idempotency-Key is rejected with 409 SUBMISSION_ALREADY_OPEN
      const dupOpen = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'lifecycle-sub-dup-02' },
        body: advancedSubmissionExample
      });
      expect(dupOpen.status).toBe(409);
      expect(dupOpen.body.error.code).toBe('SUBMISSION_ALREADY_OPEN');

      // 3. Coach A approves submission -> outcome is reviewed-only with zero XP/badges/rewards/grantIds
      const reviewRes = await env.request('POST', `/api/coach/universe/submissions/${sub1.body.submissionId}/review`, {
        token: coachTokenA,
        headers: { 'Idempotency-Key': 'lifecycle-review-01' },
        body: {
          contractVersion: API_CONTRACT_VERSION,
          expectedSubmissionRevision: 1,
          decision: 'approved',
          note: 'Clear travel time and food mass reasoning.'
        }
      });
      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.status).toBe('approved');
      expect(reviewRes.body.submissionRevision).toBe(2);
      expect(reviewRes.body.outcome).toEqual({
        type: 'reviewed-only',
        grantIds: [],
        messageKey: 'universe.mission.reviewed',
        nextMissionIds: []
      });
      expect(reviewRes.body.xp).toBeUndefined();
      expect(reviewRes.body.rewards).toBeUndefined();

      // Verify review audit log exists
      const revAuditSnap = await env.db.collection('auditLogs').doc('universe').collection('events').doc(reviewRes.body.auditEventId).get();
      expect(revAuditSnap.exists).toBe(true);
      expect(revAuditSnap.data().action).toBe('universe.mission.approved');

      // 4. POST /api/universe/access returns Thalassa & Ignis available, Boreas locked under boreas-policy-unresolved, and unknown destinations locked
      const accessRes = await env.request('POST', '/api/universe/access', {
        token: learnerTokenA,
        body: {
          contractVersion: API_CONTRACT_VERSION,
          planetIds: ['thalassa', 'ignis', 'boreas', 'unknown-planet']
        }
      });
      expect(accessRes.status).toBe(200);
      expect(accessRes.body.destinations.thalassa.status).toBe('available');
      expect(accessRes.body.destinations.ignis.status).toBe('available');
      expect(accessRes.body.destinations.boreas.status).toBe('locked');
      expect(accessRes.body.destinations.boreas.evaluatedRule).toBe('boreas-policy-unresolved');
      expect(accessRes.body.destinations['unknown-planet'].status).toBe('locked');
      expect(accessRes.body.destinations['unknown-planet'].evaluatedRule).toBe('unknown-destination');
    });

    it('supports deterministic {seconds, nanoseconds, docId, filterHash} cursor pagination and rejects filter tampering', async () => {
      // Submit spacecraft-journey and thalassa-wind-survey for learner_a
      const s1 = await env.request('POST', `/api/universe/missions/${SPACECRAFT_MISSION}/submissions`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'page-sub-key-0001' },
        body: guidedSubmissionExample
      });
      expect(s1.status).toBe(201);

      const s2 = await env.request('POST', `/api/universe/missions/${WIND_MISSION}/submissions`, {
        token: learnerTokenA,
        headers: { 'Idempotency-Key': 'page-sub-key-0002' },
        body: windGuidedSubmissionExample
      });
      expect(s2.status).toBe(201);

      // Page 1 with limit=1
      const page1 = await env.request('GET', '/api/universe/missions/submissions/mine', {
        token: learnerTokenA,
        query: { limit: 1 }
      });
      expect(page1.status).toBe(200);
      expect(page1.body.submissions).toHaveLength(1);
      expect(page1.body.nextCursor).toBeTruthy();

      // Page 2 using nextCursor
      const page2 = await env.request('GET', '/api/universe/missions/submissions/mine', {
        token: learnerTokenA,
        query: { limit: 1, cursor: page1.body.nextCursor }
      });
      expect(page2.status).toBe(200);
      expect(page2.body.submissions).toHaveLength(1);
      expect(page2.body.submissions[0].submissionId).not.toBe(page1.body.submissions[0].submissionId);

      // Reusing page1 cursor with a different filter (e.g. missionId=spacecraft-journey) fails 400 INVALID_CURSOR
      const tamperedCursorRes = await env.request('GET', '/api/universe/missions/submissions/mine', {
        token: learnerTokenA,
        query: {
          limit: 1,
          missionId: SPACECRAFT_MISSION,
          cursor: page1.body.nextCursor
        }
      });
      expect(tamperedCursorRes.status).toBe(400);
      expect(tamperedCursorRes.body.error.code).toBe('INVALID_CURSOR');

      // Coach queue pagination and class filter enforcement
      const coachQueue = await env.request('GET', '/api/coach/universe/submissions', {
        token: coachTokenA,
        query: { status: 'submitted', limit: 1 }
      });
      expect(coachQueue.status).toBe(200);
      expect(coachQueue.body.submissions).toHaveLength(1);
      expect(coachQueue.body.nextCursor).toBeTruthy();

      // Coach A requesting unassigned CLASS_B returns 403 FORBIDDEN
      const unassignedClassQueue = await env.request('GET', '/api/coach/universe/submissions', {
        token: coachTokenA,
        query: { status: 'submitted', classId: CLASS_B }
      });
      expect(unassignedClassQueue.status).toBe(403);
      expect(unassignedClassQueue.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Phase 1 closure: bounded revisions, retired tasks and filtered queue paging', () => {
    it('keeps legacy records read-only at the API even with a currently known task identity', async () => {
      const first=await env.request('POST',`/api/universe/missions/${WIND_MISSION}/submissions`,{token:learnerTokenA,headers:{'Idempotency-Key':'closure-legacy-seed-01'},body:windGuidedSubmissionExample});
      expect(first.status).toBe(201);
      const ref=env.db.collection('missionSubmissions').doc(first.body.submissionId);
      await ref.update({legacyFormat:true});
      const before=(await ref.get()).data();
      const review=await env.request('POST',`/api/coach/universe/submissions/${first.body.submissionId}/review`,{token:coachTokenA,headers:{'Idempotency-Key':'closure-legacy-review1'},body:{contractVersion:API_CONTRACT_VERSION,decision:'approved',expectedSubmissionRevision:1,note:''}});
      expect(review.status).toBe(409);
      expect(review.body.error.code).toBe('MISSION_NOT_OPEN');
      expect((await ref.get()).data()).toEqual(before);
    });

    it('keeps one atomic supersession link per returned attempt without growing the family lock', async () => {
      const submit = (body, key) => env.request('POST', `/api/universe/missions/${WIND_MISSION}/submissions`, {token:learnerTokenA, headers:{'Idempotency-Key':key}, body});
      const review = (id, key) => env.request('POST', `/api/coach/universe/submissions/${id}/review`, {token:coachTokenA, headers:{'Idempotency-Key':key}, body:{contractVersion:API_CONTRACT_VERSION, decision:'returned', note:'Please compare the low-wind outcome.', expectedSubmissionRevision:1}});
      const first = await submit(windGuidedSubmissionExample, 'closure-first-submit-001');
      expect(first.status).toBe(201);
      expect((await review(first.body.submissionId, 'closure-first-return-001')).status).toBe(200);
      const before = (await env.db.collection('missionSubmissions').doc(first.body.submissionId).get()).data();
      const revised = {...clone(windGuidedSubmissionExample), previousSubmissionId:first.body.submissionId};
      const pair = await Promise.all([submit(revised,'closure-revise-key-0001'),submit(revised,'closure-revise-key-0002')]);
      expect(pair.map(r=>r.status).sort()).toEqual([201,409]);
      const second = pair.find(r=>r.status===201);
      const link = (await env.db.collection('missionRevisionLinks').doc(first.body.submissionId).get()).data();
      expect(link.nextSubmissionId).toBe(second.body.submissionId);
      expect(JSON.stringify(link).length).toBeLessThan(1000);
      expect((await review(second.body.submissionId,'closure-next-return-001')).status).toBe(200);
      expect((await submit(revised,'closure-reuse-old-0001')).status).toBe(409);
      const after = (await env.db.collection('missionSubmissions').doc(first.body.submissionId).get()).data();
      expect(after).toEqual(before);
      const locks = await env.db.collection('missionSubmissionLocks').get();
      expect(locks.size).toBe(1);
      expect(locks.docs[0].data().attemptCount).toBe(2);
      expect(locks.docs[0].data()).not.toHaveProperty('consumedReturnedIds');
      expect(locks.docs[0].data()).not.toHaveProperty('lastReturnedByTask');
    });

    it('retired pilot tasks pause saving and sending despite an ad-hoc finish override', async () => {
      const identity = {missionId:SPACECRAFT_MISSION, releaseId:RELEASE_ID, missionVersion:MISSION_VERSION, routeId:'guided', taskId:SPACECRAFT_GUIDED_TASK, policyVersion:POLICY_VERSION};
      await env.db.collection('universeTaskStatus').doc(getTaskStatusOverrideDocId(identity)).set({status:'retired',allowInProgressFinish:true});
      const query = {...identity}; delete query.missionId;
      const availability = await env.request('GET',`/api/universe/missions/${SPACECRAFT_MISSION}/availability`,{token:learnerTokenA, query});
      expect(availability.body.identity).toEqual(identity);
      expect(availability.body.availability).toMatchObject({status:'retired',canStart:false,canResume:false,canSubmit:false});
      const draft = await env.request('PUT',`/api/universe/missions/${SPACECRAFT_MISSION}/draft`,{token:learnerTokenA,headers:{'Idempotency-Key':'closure-retired-draft01'},body:guidedDraftExample});
      expect(draft.status).toBe(409);
      expect(draft.body.error.code).toBe('MISSION_RETIRED');
      const sub = await env.request('POST',`/api/universe/missions/${SPACECRAFT_MISSION}/submissions`,{token:learnerTokenA,headers:{'Idempotency-Key':'closure-retired-submit1'},body:guidedSubmissionExample});
      expect(sub.status).toBe(409);
      expect(sub.body.error.code).toBe('MISSION_RETIRED');
      const saved = await env.request('GET',`/api/universe/missions/${SPACECRAFT_MISSION}/draft`,{token:learnerTokenA,query});
      expect(saved.status).toBe(200);
      expect(saved.body.identity).toEqual(identity);
      expect(saved.body.draft).toBeNull();
    });

    it('walks empty continuation pages past revoked roster rows to older eligible work', async () => {
      const submitted = await env.request('POST',`/api/universe/missions/${WIND_MISSION}/submissions`,{token:learnerTokenA,headers:{'Idempotency-Key':'closure-page-template1'},body:windGuidedSubmissionExample});
      expect(submitted.status).toBe(201);
      const ref=env.db.collection('missionSubmissions').doc(submitted.body.submissionId);
      const template=(await ref.get()).data();
      await ref.delete();
      for(let i=0;i<5;i++) {
        const id=`closure-page-${i}`;
        const createdAt=new Timestamp(2000000000+i,123);
        await env.db.collection('missionSubmissions').doc(id).set({...template,id,submissionId:id,learnerUid:i>=2?`departed-${i}`:'learner_a',createdAt,createdAtIso:createdAt.toDate().toISOString()});
      }
      let cursor=null;const seen=[];let pages=0;
      do {
        const page=await env.request('GET','/api/coach/universe/submissions',{token:coachTokenA,query:{status:'submitted',limit:2,cursor}});
        expect(page.status).toBe(200);
        if(pages===0) {expect(page.body.submissions).toEqual([]);expect(page.body.nextCursor).toBeTruthy();}
        seen.push(...page.body.submissions.map(s=>s.submissionId));
        cursor=page.body.nextCursor;pages++;
        expect(pages).toBeLessThan(5);
      } while(cursor);
      expect(pages).toBe(3);
      expect(seen).toEqual(['closure-page-1','closure-page-0']);
    });
  });
});
