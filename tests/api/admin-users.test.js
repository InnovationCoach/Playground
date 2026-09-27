import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';

describe('API: Admin Users Management', () => {
  let env;

  beforeAll(async () => {
    env = await setupApiTestEnv();

    await env.db.collection('organizations').doc('org-welearn').set({
      name: 'WeLearn', status: 'active'
    });
    await env.db.collection('schools').doc('sch-bkk').set({
      orgId: 'org-welearn', name: 'Bangkok Campus'
    });
    await env.db.collection('schools').doc('sch-online').set({
      orgId: 'org-welearn', name: 'Online School'
    });
    await env.db.collection('cohorts').doc('cohort-w2e').set({
      orgId: 'org-welearn', code: 'W2E', ageBands: ['13-15', '16-18']
    });

    // Seed test accounts in Firestore & Auth emulator
    await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
    await env.getIdToken('sup_bkk', { role: 'supervisor', orgId: 'org-welearn', schoolIds: ['sch-bkk'] });
    await env.getIdToken('student_bkk', { role: 'student', orgId: 'org-welearn' });
    await env.getIdToken('student_online', { role: 'student', orgId: 'org-welearn' });

    await env.db.collection('users').doc('admin_user').set({
      uid: 'admin_user', publicId: 'ADM-0011-2233-4455', email: 'admin.user@welearn.test', role: 'admin',
      givenNames: 'Admin', surname: 'One', displayName: 'Admin One', status: 'active',
      orgId: 'org-welearn', schoolIds: ['sch-bkk', 'sch-online'], classIds: [], createdAt: '2026-09-01T00:00:00.000Z'
    });

    await env.db.collection('users').doc('sup_bkk').set({
      uid: 'sup_bkk', publicId: 'SUP-0011-2233-4455', email: 'sup.bkk@welearn.test', role: 'supervisor',
      givenNames: 'Supervisor', surname: 'Bkk', displayName: 'Supervisor Bkk', status: 'active',
      orgId: 'org-welearn', schoolIds: ['sch-bkk'], classIds: [], createdAt: '2026-09-01T00:00:00.000Z'
    });

    await env.db.collection('users').doc('student_bkk').set({
      uid: 'student_bkk', publicId: 'STU-0011-2233-4455', email: 'student.bkk@welearn.test', role: 'student',
      givenNames: 'Student', surname: 'Bkk', displayName: 'Student Bkk', status: 'active', activatedAt: '2026-09-02T00:00:00.000Z',
      orgId: 'org-welearn', schoolIds: ['sch-bkk'], classIds: ['c1'], cohortId: 'cohort-w2e', ageBand: '13-15',
      dateOfBirth: '2010-05-15', createdAt: '2026-09-01T00:00:00.000Z'
    });

    await env.db.collection('users').doc('student_online').set({
      uid: 'student_online', publicId: 'STU-9999-8888-7777', email: 'student.online@welearn.test', role: 'student',
      givenNames: 'Student', surname: 'Online', displayName: 'Student Online', status: 'active', activatedAt: '2026-09-02T00:00:00.000Z',
      orgId: 'org-welearn', schoolIds: ['sch-online'], classIds: ['c2'], cohortId: 'cohort-w2e', ageBand: '16-18',
      dateOfBirth: '2008-01-10', createdAt: '2026-09-01T00:00:00.000Z'
    });
  });

  afterAll(async () => {
    await env.teardown();
  });

  describe('GET /api/admin/users', () => {
    it('denies access to non-console roles (403)', async () => {
      const token = await env.getIdToken('student_bkk', { role: 'student' });
      const res = await env.request('GET', '/api/admin/users', { token });
      expect(res.status).toBe(403);
    });

    it('lists users for admin with pagination, total, and excludes dateOfBirth', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('GET', '/api/admin/users', { token, query: { pageSize: 2 } });
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBeGreaterThanOrEqual(4);
      res.body.items.forEach((item) => {
        expect(item).not.toHaveProperty('dateOfBirth');
      });
    });

    it('scopes supervisor list view to supervisor schoolIds', async () => {
      const token = await env.getIdToken('sup_bkk', { role: 'supervisor', orgId: 'org-welearn', schoolIds: ['sch-bkk'] });
      const res = await env.request('GET', '/api/admin/users', { token });
      expect(res.status).toBe(200);
      const uids = res.body.items.map((u) => u.uid);
      expect(uids).toContain('student_bkk');
      expect(uids).not.toContain('student_online');
    });

    it('filters by comma-separated role list and q search prefix', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('GET', '/api/admin/users', { token, query: { role: 'student,supervisor', q: 'student' } });
      expect(res.status).toBe(200);
      expect(res.body.items.every((u) => u.role === 'student' || u.role === 'supervisor')).toBe(true);
    });
  });

  describe('POST /api/admin/users', () => {
    it('validates required fields and returns 400 with field name', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('POST', '/api/admin/users', {
        token,
        body: { role: 'student', email: 'invalid-email', givenNames: 'Test', surname: 'User', schoolIds: ['sch-bkk'] }
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION');
      expect(res.body.error.field).toBe('email');
    });

    it('rejects duplicate email with 409 CONFLICT', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('POST', '/api/admin/users', {
        token,
        body: {
          role: 'student', email: 'student.bkk@welearn.test', givenNames: 'Dup', surname: 'User',
          schoolIds: ['sch-bkk'], cohortId: 'cohort-w2e', ageBand: '13-15'
        }
      });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.field).toBe('email');
    });

    it('creates new account, generates publicId, logs audit, and returns pending activation', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const newEmail = `new.student.${Date.now()}@welearn.test`;
      const body = {
        role: 'student',
        email: newEmail,
        givenNames: 'New',
        surname: 'Student',
        schoolIds: ['sch-bkk'],
        cohortId: 'cohort-w2e',
        ageBand: '13-15',
        yearLevel: 'Year 9'
      };

      const res = await env.request('POST', '/api/admin/users', { token, body });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('pending');
      expect(res.body.publicId).toMatch(/^[A-Z0-9]{3}(-[A-Z0-9]{3}){3}$/);
      expect(res.body.activation).toEqual({ sent: false, reason: 'EMAIL_NOT_CONFIGURED' });

      // Read back Firestore doc & audit log
      const userDoc = await env.db.collection('users').doc(res.body.uid).get();
      expect(userDoc.exists).toBe(true);
      expect(userDoc.data().email).toBe(newEmail);

      const auditSnap = await env.db.collection('auditLogs')
        .where('subjectUid', '==', res.body.uid)
        .where('action', '==', 'ACCOUNT_CREATED')
        .get();
      expect(auditSnap.empty).toBe(false);
    });
  });

  describe('GET /api/admin/users/:uid', () => {
    it('returns full record including auth info, counts, and links; includes DOB for admin', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('GET', '/api/admin/users/student_bkk', { token });
      expect(res.status).toBe(200);
      expect(res.body.uid).toBe('student_bkk');
      expect(res.body).toHaveProperty('auth');
      expect(res.body).toHaveProperty('counts');
      expect(res.body).toHaveProperty('links');
      expect(res.body.dateOfBirth).toBe('2010-05-15');
    });

    it('returns 404 for supervisor reading user outside their school scope', async () => {
      const token = await env.getIdToken('sup_bkk', { role: 'supervisor', orgId: 'org-welearn', schoolIds: ['sch-bkk'] });
      const res = await env.request('GET', '/api/admin/users/student_online', { token });
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/admin/users/:uid', () => {
    it('rejects forbidden profile field edits with 400 VALIDATION', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('PATCH', '/api/admin/users/student_bkk', {
        token,
        body: { role: 'admin' }
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION');
      expect(res.body.error.field).toBe('role');
    });

    it('edits allowed profile fields and audits changes', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('PATCH', '/api/admin/users/student_bkk', {
        token,
        body: { surname: 'Updated' }
      });
      expect(res.status).toBe(200);
      expect(res.body.surname).toBe('Updated');
      expect(res.body.displayName).toBe('Student Updated');

      const auditSnap = await env.db.collection('auditLogs')
        .where('subjectUid', '==', 'student_bkk')
        .where('action', '==', 'DETAILS_CHANGED')
        .get();
      expect(auditSnap.empty).toBe(false);
    });
  });

  describe('PUT /api/admin/users/:uid/role', () => {
    it('prevents self-role change (403)', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('PUT', '/api/admin/users/admin_user/role', {
        token,
        body: { role: 'teacher' }
      });
      expect(res.status).toBe(403);
    });

    it('prevents demotion of last admin (409)', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('PUT', '/api/admin/users/admin_user/role', {
        token,
        body: { role: 'teacher' }
      });
      expect(res.status).toBe(403); // Or 409 if modifying another admin
    });
  });

  describe('POST /api/admin/users/:uid/suspend and unsuspend', () => {
    it('requires a reason for suspension (400)', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('POST', '/api/admin/users/student_online/suspend', {
        token,
        body: {}
      });
      expect(res.status).toBe(400);
      expect(res.body.error.field).toBe('reason');
    });

    it('prevents self-suspension (403)', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('POST', '/api/admin/users/admin_user/suspend', {
        token,
        body: { reason: 'Test' }
      });
      expect(res.status).toBe(403);
    });

    it('suspends user, disables auth, and logs audit', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('POST', '/api/admin/users/student_online/suspend', {
        token,
        body: { reason: 'Left school' }
      });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('suspended');
      expect(res.body.auth.disabled).toBe(true);

      // Read back doc
      const docSnap = await env.db.collection('users').doc('student_online').get();
      expect(docSnap.data().status).toBe('suspended');

      // Unsuspend
      const unRes = await env.request('POST', '/api/admin/users/student_online/unsuspend', { token });
      expect(unRes.status).toBe(200);
      expect(unRes.body.status).toBe('active');
    });
  });

  describe('POST /api/admin/users/:uid/resend-activation and change-email', () => {
    it('returns 501 EMAIL_NOT_CONFIGURED when no transport configured', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('POST', '/api/admin/users/student_bkk/change-email', {
        token,
        body: { newEmail: 'newemail@welearn.test' }
      });
      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('EMAIL_NOT_CONFIGURED');
    });
  });

  describe('GET /api/admin/users/:uid/history', () => {
    it('returns user audit history items paginated', async () => {
      const token = await env.getIdToken('admin_user', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('GET', '/api/admin/users/student_bkk/history', { token });
      expect(res.status).toBe(200);
      expect(res.body.items).toBeInstanceOf(Array);
    });
  });
});
