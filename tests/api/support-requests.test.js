import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';

describe('School workspace: Support requests and learner preferences API', () => {
  let env;
  const tokens = {};
  const school = 'sr-school';
  const cls = 'sr-class';
  const otherClass = 'sr-other-class';
  const base = `/api/schools/${school}`;
  let supportReqId = null;

  const request = (method, path, role = 'student', body) =>
    env.request(method, path, { token: tokens[role], body });

  beforeAll(async () => {
    env = await setupApiTestEnv();
    await env.db.collection('schools').doc(school).set({
      name: 'Support Request School',
      orgId: 'org-welearn',
      timezone: 'Asia/Bangkok'
    });
    await env.db.collection('classes').doc(cls).set({
      schoolId: school,
      name: 'Class Alpha'
    });
    await env.db.collection('classes').doc(otherClass).set({
      schoolId: school,
      name: 'Class Beta'
    });

    const users = [
      ['admin', 'admin', []],
      ['coach', 'teacher', [cls]],
      ['otherCoach', 'teacher', [otherClass]],
      ['student', 'student', [cls]],
      ['strangerStudent', 'student', [otherClass]],
      ['parent', 'parent', []]
    ];

    for (const [name, role, classIds] of users) {
      const uid = `sr-${name}`;
      const schoolIds = role === 'parent' ? [] : [school];
      await env.db.collection('users').doc(uid).set({
        uid,
        role,
        classIds,
        schoolIds,
        orgId: 'org-welearn',
        displayName: name,
        status: 'active'
      });
      tokens[name] = await env.getIdToken(uid, {
        role,
        classIds,
        schoolIds,
        orgId: 'org-welearn'
      });
    }

    await env.db.collection('parentLinks').doc('sr-parent-link').set({
      parentUid: 'sr-parent',
      studentUid: 'sr-student',
      status: 'active'
    });
  });

  afterAll(async () => {
    await env?.teardown();
  });

  describe('Support Requests Workflow', () => {
    it('allows a learner to submit a support request with valid class and category', async () => {
      const res = await request('POST', `${base}/support-requests`, 'student', {
        classId: cls,
        category: 'first_step',
        note: 'I need help choosing a space.'
      });

      expect(res.status).toBe(201);
      expect(res.body.learnerUid).toBe('sr-student');
      expect(res.body.category).toBe('first_step');
      expect(res.body.status).toBe('submitted');
      expect(res.body.revision).toBe(1);
      expect(res.body.id).toBeDefined();

      supportReqId = res.body.id;
    });

    it('rejects support request submission from coaches or parents', async () => {
      const coachRes = await request('POST', `${base}/support-requests`, 'coach', {
        classId: cls,
        category: 'explain_different'
      });
      expect(coachRes.status).toBe(403);

      const parentRes = await request('POST', `${base}/support-requests`, 'parent', {
        classId: cls,
        category: 'need_break'
      });
      expect(parentRes.status).toBe(403);
    });

    it('rejects invalid support category or excessive note length', async () => {
      const invalidCat = await request('POST', `${base}/support-requests`, 'student', {
        classId: cls,
        category: 'invalid_category'
      });
      expect(invalidCat.status).toBe(400);

      const longNote = await request('POST', `${base}/support-requests`, 'student', {
        classId: cls,
        category: 'need_break',
        note: 'a'.repeat(501)
      });
      expect(longNote.status).toBe(400);
    });

    it('allows assigned coach to view support requests in their class', async () => {
      const res = await request('GET', `${base}/support-requests`, 'coach');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe(supportReqId);
    });

    it('does NOT disclose support requests to unassigned coaches or parents', async () => {
      const otherCoachRes = await request('GET', `${base}/support-requests`, 'otherCoach');
      expect(otherCoachRes.status).toBe(200);
      expect(otherCoachRes.body.items).toHaveLength(0);

      const parentRes = await request('GET', `${base}/support-requests`, 'parent');
      expect(parentRes.status).toBe(200);
      expect(parentRes.body.items).toHaveLength(0);
    });

    it('allows assigned coach to acknowledge support request with revision check', async () => {
      const res = await request('PATCH', `${base}/support-requests/${supportReqId}`, 'coach', {
        status: 'acknowledged',
        revision: 1
      });

      expect(res.status).toBe(200);
      expect(res.body.saved).toBe(true);
      expect(res.body.record.status).toBe('acknowledged');
      expect(res.body.record.revision).toBe(2);
      expect(res.body.record.acknowledgedAt).toBeDefined();
      expect(res.body.record.assignedCoachUid).toBe('sr-coach');
    });

    it('prevents stale revision updates (concurrency check)', async () => {
      const res = await request('PATCH', `${base}/support-requests/${supportReqId}`, 'coach', {
        status: 'checked_in',
        revision: 1
      });
      expect(res.status).toBe(409);
    });

    it('allows assigned coach to mark request resolved', async () => {
      const res = await request('PATCH', `${base}/support-requests/${supportReqId}`, 'coach', {
        status: 'resolved',
        revision: 2
      });

      expect(res.status).toBe(200);
      expect(res.body.record.status).toBe('resolved');
      expect(res.body.record.resolvedAt).toBeDefined();
    });
  });

  describe('Learner Preferences Workflow', () => {
    it('returns default preferences for a learner who has not saved preferences yet', async () => {
      const res = await request('GET', `${base}/learner-preferences`, 'student');
      expect(res.status).toBe(200);
      expect(res.body.displayMode).toBe('explore');
      expect(res.body.preferredEvidenceFormats).toEqual([]);
      expect(res.body.quietWorkspace).toBe(false);
    });

    it('allows learner to save updated display mode and preferences', async () => {
      const res = await request('PUT', `${base}/learner-preferences`, 'student', {
        displayMode: 'focus',
        preferredEvidenceFormats: ['Write', 'Audio'],
        quietWorkspace: true,
        interests: ['Game design', 'Energy systems']
      });

      expect(res.status).toBe(200);
      expect(res.body.displayMode).toBe('focus');
      expect(res.body.preferredEvidenceFormats).toEqual(['Write', 'Audio']);
      expect(res.body.quietWorkspace).toBe(true);
      expect(res.body.interests).toEqual(['Game design', 'Energy systems']);
    });

    it('allows assigned coach to read learner preferences for a student in their class', async () => {
      const res = await request('GET', `${base}/learner-preferences?learnerUid=sr-student&classId=${cls}`, 'coach');
      expect(res.status).toBe(200);
      expect(res.body.displayMode).toBe('focus');
      expect(res.body.interests).toEqual(['Game design', 'Energy systems']);
    });

    it('blocks parents from reading private learner preferences', async () => {
      const res = await request('GET', `${base}/learner-preferences?learnerUid=sr-student`, 'parent');
      expect(res.status).toBe(403);
    });
  });
});
