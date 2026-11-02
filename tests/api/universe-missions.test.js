import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';

describe('API: Universe Missions & Coach-Approved Unlocks (Go 4)', () => {
  let env;
  let learnerTokenA;
  let learnerTokenB;
  let coachTokenA;
  let coachTokenB;

  const CLASS_A = 'class_orbit_a';
  const CLASS_B = 'class_orbit_b';

  beforeAll(async () => {
    env = await setupApiTestEnv();

    // Create tokens in Auth emulator
    learnerTokenA = await env.getIdToken('learner_a', { role: 'student', classIds: [CLASS_A] });
    learnerTokenB = await env.getIdToken('learner_b', { role: 'student', classIds: [CLASS_B] });
    coachTokenA = await env.getIdToken('coach_alpha', { role: 'coach', classIds: [CLASS_A] });
    coachTokenB = await env.getIdToken('coach_beta', { role: 'coach', classIds: [CLASS_B] });

    // Seed user profiles in Firestore
    await env.db.collection('users').doc('learner_a').set({
      uid: 'learner_a',
      email: 'learner_a@welearn.test',
      displayName: 'Learner A',
      role: 'student',
      classIds: [CLASS_A]
    });

    await env.db.collection('users').doc('learner_b').set({
      uid: 'learner_b',
      email: 'learner_b@welearn.test',
      displayName: 'Learner B',
      role: 'student',
      classIds: [CLASS_B]
    });

    await env.db.collection('users').doc('coach_alpha').set({
      uid: 'coach_alpha',
      email: 'coach_alpha@welearn.test',
      displayName: 'Coach Alpha',
      role: 'coach',
      classIds: [CLASS_A]
    });

    await env.db.collection('users').doc('coach_beta').set({
      uid: 'coach_beta',
      email: 'coach_beta@welearn.test',
      displayName: 'Coach Beta',
      role: 'coach',
      classIds: [CLASS_B]
    });
  });

  afterAll(async () => {
    await env.teardown();
  });

  beforeEach(async () => {
    // Clear mission submissions
    const snap = await env.db.collection('missionSubmissions').get();
    const batch = env.db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  });

  describe('Authentication & Validation', () => {
    it('requires authentication for mission submission', async () => {
      const res = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        body: { routeId: 'guided', missionVersion: '0.1.0-draft', reflection: 'Valid 20+ character text here.' }
      });
      expect(res.status).toBe(401);
    });

    it('rejects a draft mission with 409 in production mode', async () => {
      const oldEnv = process.env.ALLOW_DRAFT_MISSIONS;
      delete process.env.ALLOW_DRAFT_MISSIONS;

      const res = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'Valid reflection with more than twenty characters.'
        }
      });

      process.env.ALLOW_DRAFT_MISSIONS = oldEnv;
      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('draft and cannot be submitted');
    });

    it('rejects submissions from non-student/learner roles with 403', async () => {
      process.env.ALLOW_DRAFT_MISSIONS = 'true';
      const res = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: coachTokenA,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'Coaches cannot submit reflections as learners.'
        }
      });
      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Only learners and students may submit');
    });

    it('ignores ALLOW_DRAFT_MISSIONS when not running in an emulator environment', async () => {
      const savedHost = process.env.FIRESTORE_EMULATOR_HOST;
      const savedFunctions = process.env.FUNCTIONS_EMULATOR;
      process.env.ALLOW_DRAFT_MISSIONS = 'true';
      delete process.env.FIRESTORE_EMULATOR_HOST;
      process.env.FUNCTIONS_EMULATOR = 'false';

      try {
        const res = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
          token: learnerTokenA,
          body: {
            routeId: 'guided',
            missionVersion: '0.1.0-draft',
            reflection: 'Valid reflection with more than twenty characters.'
          }
        });
        expect(res.status).toBe(409);
        expect(res.body.error.message).toContain('draft and cannot be submitted');
      } finally {
        process.env.FIRESTORE_EMULATOR_HOST = savedHost;
        process.env.FUNCTIONS_EMULATOR = savedFunctions;
      }
    });

    it('rejects an invalid route or version', async () => {
      process.env.ALLOW_DRAFT_MISSIONS = 'true';
      const res = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'warp-drive-route',
          missionVersion: '0.1.0-draft',
          reflection: 'Valid reflection with more than twenty characters.'
        }
      });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid route');
    });

    it('enforces reflection minimum length (< 20 characters)', async () => {
      process.env.ALLOW_DRAFT_MISSIONS = 'true';
      const res = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'Too short'
        }
      });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('between 20 and 2,000');
    });

    it('enforces reflection maximum length (> 2,000 characters)', async () => {
      process.env.ALLOW_DRAFT_MISSIONS = 'true';
      const res = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'A'.repeat(2001)
        }
      });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('between 20 and 2,000');
    });
  });

  describe('Submission Lifecycle & Access Unlock', () => {
    beforeEach(() => {
      process.env.ALLOW_DRAFT_MISSIONS = 'true';
    });

    it('submits successfully, rejects duplicate open submissions, and shows in learner history', async () => {
      // 1. First submission
      const res1 = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'I recommend the chemical rocket because 42 days is manageable with 227 kg of food.'
        }
      });
      expect(res1.status).toBe(201);
      expect(res1.body.submissionId).toBeDefined();
      expect(res1.body.status).toBe('submitted');

      // 2. Reject duplicate open submission
      const res2 = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'advanced',
          missionVersion: '0.1.0-draft',
          reflection: 'Trying to submit a second time while first is open.'
        }
      });
      expect(res2.status).toBe(409);
      expect(res2.body.error.message).toContain('already have an open submission');

      // 3. Learner reads own submissions
      const mineRes = await env.request('GET', '/api/universe/missions/submissions/mine', {
        token: learnerTokenA
      });
      expect(mineRes.status).toBe(200);
      expect(mineRes.body.submissions).toHaveLength(1);
      expect(mineRes.body.submissions[0].status).toBe('submitted');
      expect(mineRes.body.submissions[0].learnerUid).toBe('learner_a');
      expect(mineRes.body.submissions[0].classIds).toContain(CLASS_A);
    });

    it('planet Boreas is locked initially, and remains locked while submitted', async () => {
      // Submit reflection
      await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'I recommend the chemical rocket because 42 days is manageable.'
        }
      });

      // Check access
      const accessRes = await env.request('POST', '/api/universe/access', {
        token: learnerTokenA,
        body: { planetIds: ['thalassa', 'ignis', 'boreas'] }
      });

      expect(accessRes.status).toBe(200);
      expect(accessRes.body.destinations.thalassa.status).toBe('available');
      expect(accessRes.body.destinations.ignis.status).toBe('available');
      expect(accessRes.body.destinations.boreas.status).toBe('locked');
      expect(accessRes.body.destinations.boreas.isVerified).toBe(false);
      expect(accessRes.body.destinations.boreas.evaluatedRule).toBe('mission:spacecraft-journey');
    });

    it('prevents coach from reviewing another class learner', async () => {
      const subRes = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'I recommend the chemical rocket because 42 days is manageable.'
        }
      });
      const subId = subRes.body.submissionId;

      // Coach B tries to review Learner A (Class A)
      const reviewRes = await env.request('POST', `/api/coach/universe/submissions/${subId}/review`, {
        token: coachTokenB,
        body: { decision: 'approved', note: 'Looks good' }
      });

      expect(reviewRes.status).toBe(403);
      expect(reviewRes.body.error.message).toContain('do not share a class');
    });

    it('coach approves submission, unlocking Boreas on /api/universe/access', async () => {
      const subRes = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'I recommend the chemical rocket because 42 days is manageable.'
        }
      });
      const subId = subRes.body.submissionId;

      // Coach A approves
      const reviewRes = await env.request('POST', `/api/coach/universe/submissions/${subId}/review`, {
        token: coachTokenA,
        body: { decision: 'approved', note: 'Great rate comparison and trade-off analysis!' }
      });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.status).toBe('approved');

      // Cannot re-review already reviewed submission
      const duplicateReview = await env.request('POST', `/api/coach/universe/submissions/${subId}/review`, {
        token: coachTokenA,
        body: { decision: 'returned', note: 'Second attempt' }
      });
      expect(duplicateReview.status).toBe(409);

      // Access endpoint now returns Boreas as available
      const accessRes = await env.request('POST', '/api/universe/access', {
        token: learnerTokenA,
        body: { planetIds: ['thalassa', 'ignis', 'boreas'] }
      });

      expect(accessRes.status).toBe(200);
      expect(accessRes.body.destinations.boreas.status).toBe('available');
      expect(accessRes.body.destinations.boreas.isVerified).toBe(true);

      // Learner B is still locked
      const accessB = await env.request('POST', '/api/universe/access', {
        token: learnerTokenB,
        body: { planetIds: ['boreas'] }
      });
      expect(accessB.body.destinations.boreas.status).toBe('locked');
    });

    it('coach returns submission, keeping Boreas locked and allowing resubmission', async () => {
      const subRes = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'I recommend the chemical rocket because 42 days is manageable.'
        }
      });
      const subId = subRes.body.submissionId;

      // Coach returns submission
      const reviewRes = await env.request('POST', `/api/coach/universe/submissions/${subId}/review`, {
        token: coachTokenA,
        body: { decision: 'returned', note: 'Please explain what speed costs the crew.' }
      });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.status).toBe('returned');

      // Access remains locked
      const accessRes = await env.request('POST', '/api/universe/access', {
        token: learnerTokenA,
        body: { planetIds: ['boreas'] }
      });
      expect(accessRes.body.destinations.boreas.status).toBe('locked');

      // Resubmission is permitted because no open submission exists
      const resubRes = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'Revised: The chemical rocket arrives in 42 days, but burns substantially more propellant mass.'
        }
      });
      expect(resubRes.status).toBe(201);
    });

    it('confirms no XP, reward, or currency fields exist on submission or review responses', async () => {
      const subRes = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'I recommend the chemical rocket because 42 days is manageable.'
        }
      });

      expect(subRes.body.xp).toBeUndefined();
      expect(subRes.body.rewards).toBeUndefined();
      expect(subRes.body.tokens).toBeUndefined();
      expect(subRes.body.badges).toBeUndefined();

      const subId = subRes.body.submissionId;
      const reviewRes = await env.request('POST', `/api/coach/universe/submissions/${subId}/review`, {
        token: coachTokenA,
        body: { decision: 'approved', note: 'Well reasoned.' }
      });

      expect(reviewRes.body.xp).toBeUndefined();
      expect(reviewRes.body.rewards).toBeUndefined();
      expect(reviewRes.body.tokens).toBeUndefined();
      expect(reviewRes.body.badges).toBeUndefined();
    });

    it('fails closed: unknown planetIds return locked with reason unknown-destination', async () => {
      const accessRes = await env.request('POST', '/api/universe/access', {
        token: learnerTokenA,
        body: { planetIds: ['thalassa', 'vulcan-unlisted', 'planet-x'] }
      });

      expect(accessRes.status).toBe(200);
      expect(accessRes.body.destinations.thalassa.status).toBe('available');
      expect(accessRes.body.destinations['vulcan-unlisted']).toEqual({
        status: 'locked',
        evaluatedRule: 'unknown-destination',
        isVerified: false
      });
      expect(accessRes.body.destinations['planet-x']).toEqual({
        status: 'locked',
        evaluatedRule: 'unknown-destination',
        isVerified: false
      });
    });

    it('coach list query isolates by class and never returns submissions from other classes', async () => {
      // Learner A (Class A) submits
      const resA = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenA,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'Learner A reflection for class orbit A.'
        }
      });
      expect(resA.status).toBe(201);

      // Learner B (Class B) submits
      const resB = await env.request('POST', '/api/universe/missions/spacecraft-journey/submissions', {
        token: learnerTokenB,
        body: {
          routeId: 'guided',
          missionVersion: '0.1.0-draft',
          reflection: 'Learner B reflection for class orbit B.'
        }
      });
      expect(resB.status).toBe(201);

      // Coach A (Class A) lists submissions
      const listA = await env.request('GET', '/api/coach/universe/submissions?status=submitted', {
        token: coachTokenA
      });
      expect(listA.status).toBe(200);
      expect(listA.body.submissions).toHaveLength(1);
      expect(listA.body.submissions[0].learnerUid).toBe('learner_a');
      expect(listA.body.submissions[0].classIds).toContain(CLASS_A);

      // Coach B (Class B) lists submissions
      const listB = await env.request('GET', '/api/coach/universe/submissions?status=submitted', {
        token: coachTokenB
      });
      expect(listB.status).toBe(200);
      expect(listB.body.submissions).toHaveLength(1);
      expect(listB.body.submissions[0].learnerUid).toBe('learner_b');
      expect(listB.body.submissions[0].classIds).toContain(CLASS_B);
    });
  });
});
