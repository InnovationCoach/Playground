import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';

describe('API: Parent Portal & Invites', () => {
  let env;

  beforeAll(async () => {
    env = await setupApiTestEnv();

    await env.db.collection('organizations').doc('org-welearn').set({
      name: 'WeLearn', status: 'active'
    });
    await env.db.collection('schools').doc('sch-bkk').set({
      orgId: 'org-welearn', name: 'Bangkok Campus'
    });
    await env.db.collection('cohorts').doc('cohort-w2e').set({
      orgId: 'org-welearn', code: 'W2E'
    });

    await env.db.collection('users').doc('admin_user').set({
      uid: 'admin_user', publicId: 'ADM-1111-2222-3333', email: 'admin@welearn.test', role: 'admin',
      orgId: 'org-welearn', schoolIds: ['sch-bkk'], classIds: [], status: 'active', displayName: 'Admin User'
    });

    await env.db.collection('users').doc('parent1').set({
      uid: 'parent1', publicId: 'PAR-1111-2222-3333', email: 'parent1@welearn.test', role: 'parent',
      givenNames: 'Parent', surname: 'One', displayName: 'Parent One', status: 'active',
      orgId: 'org-welearn', schoolIds: ['sch-bkk'], classIds: []
    });

    await env.db.collection('users').doc('kid1').set({
      uid: 'kid1', publicId: 'KID-1111-2222-3333', email: 'kid1@welearn.test', role: 'student',
      givenNames: 'Kid', surname: 'One', displayName: 'Kid One', status: 'active',
      orgId: 'org-welearn', schoolIds: ['sch-bkk'], classIds: ['c1'], cohortId: 'cohort-w2e', yearLevel: 'Year 9'
    });

    // Clear rate limits for test accounts
    const rateLimitsSnap = await env.db.collection('rateLimits').get();
    for (const doc of rateLimitsSnap.docs) {
      await doc.ref.delete();
    }
  });

  afterAll(async () => {
    await env.teardown();
  });

  describe('POST /api/students/:uid/parent-invite', () => {
    it('generates parent invite code shown once', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('POST', '/api/students/kid1/parent-invite', { token });
      expect(res.status).toBe(201);
      expect(res.body.code).toMatch(/^[BCDFGHJKMNPQRSTVWXYZ23456789]{4}-[BCDFGHJKMNPQRSTVWXYZ23456789]{4}$/);
      expect(res.body).toHaveProperty('expiresAt');
    });

    it('denies parent invite creation for student role (403)', async () => {
      const token = await env.getIdToken('kid1', { role: 'student' });
      const res = await env.request('POST', '/api/students/kid1/parent-invite', { token });
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/parent/redeem', () => {
    let inviteCode = null;

    beforeAll(async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const inviteRes = await env.request('POST', '/api/students/kid1/parent-invite', { token });
      inviteCode = inviteRes.body.code;
    });

    it('redeems invite, links child, and returns child summary', async () => {
      const token = await env.getIdToken('parent1', { role: 'parent', orgId: 'org-welearn' });
      const res = await env.request('POST', '/api/parent/redeem', {
        token,
        body: { code: inviteCode.toLowerCase() } // Case-insensitive normalization
      });

      expect(res.status).toBe(200);
      expect(res.body.child.uid).toBe('kid1');
      expect(res.body.child.displayName).toBe('Kid One');
      expect(res.body.child.schoolName).toBe('Bangkok Campus');
      expect(res.body.child.cohortCode).toBe('W2E');

      // Assert Firestore parentLinks document exists
      const linkSnap = await env.db.collection('parentLinks')
        .where('parentUid', '==', 'parent1')
        .where('studentUid', '==', 'kid1')
        .where('status', '==', 'active')
        .get();

      expect(linkSnap.empty).toBe(false);
    });

    it('returns identical 404 NOT_FOUND for reused or wrong codes', async () => {
      const token = await env.getIdToken('parent1', { role: 'parent', orgId: 'org-welearn' });

      const reusedRes = await env.request('POST', '/api/parent/redeem', { token, body: { code: inviteCode } });
      const wrongRes = await env.request('POST', '/api/parent/redeem', { token, body: { code: 'BBBB-2222' } });

      expect(reusedRes.status).toBe(404);
      expect(wrongRes.status).toBe(404);
      expect(reusedRes.body.error.message).toBe(wrongRes.body.error.message);
    });

    it('rate-limits redeem attempts to 5 per 15 minutes (429)', async () => {
      const token = await env.getIdToken('parent2', { role: 'parent', orgId: 'org-welearn' });
      for (let i = 0; i < 5; i++) {
        await env.request('POST', '/api/parent/redeem', { token, body: { code: 'INVALID-CODE' } });
      }
      const res = await env.request('POST', '/api/parent/redeem', { token, body: { code: 'INVALID-CODE' } });
      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('RATE_LIMITED');
    });
  });

  describe('GET /api/parent/children', () => {
    it('returns list of active linked children with minimal profile', async () => {
      const token = await env.getIdToken('parent1', { role: 'parent', orgId: 'org-welearn' });
      const res = await env.request('GET', '/api/parent/children', { token });

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].uid).toBe('kid1');
      expect(res.body.items[0]).not.toHaveProperty('email');
      expect(res.body.items[0]).not.toHaveProperty('phone');
    });
  });

  describe('DELETE /api/admin/parent-links/:linkId', () => {
    it('revokes link and audits PARENT_UNLINKED on student and parent', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });

      const linksSnap = await env.db.collection('parentLinks')
        .where('parentUid', '==', 'parent1')
        .where('studentUid', '==', 'kid1')
        .where('status', '==', 'active')
        .get();

      const linkId = linksSnap.docs[0].id;
      const res = await env.request('DELETE', `/api/admin/parent-links/${linkId}`, { token });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('revoked');

      // Check children list is now empty for parent1
      const parentToken = await env.getIdToken('parent1', { role: 'parent', orgId: 'org-welearn' });
      const childrenRes = await env.request('GET', '/api/parent/children', { token: parentToken });
      expect(childrenRes.body.items).toHaveLength(0);
    });
  });
});
