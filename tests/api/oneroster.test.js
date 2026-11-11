import { describe, it, expect, beforeAll } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';

describe('API: OneRoster Auth & Security (Item 1)', () => {
  let env;
  let adminToken;
  let coachToken;
  let studentToken;

  beforeAll(async () => {
    env = await setupApiTestEnv();

    adminToken = await env.getIdToken('admin_user', {
      role: 'admin',
      orgId: 'org-welearn'
    });

    coachToken = await env.getIdToken('coach_user', {
      role: 'coach',
      orgId: 'org-welearn',
      classIds: ['cls-sec-eng-01']
    });

    studentToken = await env.getIdToken('student_user', {
      role: 'student',
      orgId: 'org-welearn',
      classIds: ['cls-sec-eng-01']
    });
  });

  const routes = [
    '/api/oneroster/v1p1/users',
    '/api/oneroster/v1p1/classes',
    '/api/oneroster/v1p1/enrollments',
    '/api/oneroster/v1p1/courses'
  ];

  routes.forEach((route) => {
    describe(route, () => {
      it('returns 401 when no token is provided', async () => {
        const res = await env.request('GET', route);
        expect(res.status).toBe(401);
      });

      it('returns 403 when called by a student', async () => {
        const res = await env.request('GET', route, { token: studentToken });
        expect(res.status).toBe(403);
      });

      it('returns 403 when called by a coach', async () => {
        const res = await env.request('GET', route, { token: coachToken });
        expect(res.status).toBe(403);
      });

      it('returns 200 when called by an admin', async () => {
        const res = await env.request('GET', route, { token: adminToken });
        expect(res.status).toBe(200);
      });
    });
  });

  describe('Tenant Partitioning & Identity Isolation (R2-03)', () => {
    let alphaAdminToken;
    let betaAdminToken;
    let noOrgAdminToken;

    beforeAll(async () => {
      // Seed student in org-alpha
      await env.db.collection('users').doc('stud_alpha_01').set({
        uid: 'stud_alpha_01',
        orgId: 'org-alpha',
        displayName: 'Alice Alpha',
        email: 'alice@alpha.test',
        role: 'student',
        status: 'active'
      });

      // Seed student in org-beta
      await env.db.collection('users').doc('stud_beta_01').set({
        uid: 'stud_beta_01',
        orgId: 'org-beta',
        displayName: 'Bob Beta',
        email: 'bob@beta.test',
        role: 'student',
        status: 'active'
      });

      alphaAdminToken = await env.getIdToken('admin_alpha', {
        role: 'admin',
        orgId: 'org-alpha'
      });

      betaAdminToken = await env.getIdToken('admin_beta', {
        role: 'admin',
        orgId: 'org-beta'
      });

      noOrgAdminToken = await env.getIdToken('admin_no_org', {
        role: 'admin'
      });
    });

    it('returns only org-alpha users for org-alpha admin, strictly excluding org-beta', async () => {
      const res = await env.request('GET', '/api/oneroster/v1p1/users', { token: alphaAdminToken });
      expect(res.status).toBe(200);
      const userList = res.body.users;
      expect(Array.isArray(userList)).toBe(true);

      const sourcedIds = userList.map(u => u.sourcedId);
      const emails = userList.map(u => u.email);

      // Positive assertion against known synthetic fixture
      expect(sourcedIds).toContain('stud_alpha_01');
      expect(emails).toContain('alice@alpha.test');

      // Negative isolation assertion
      expect(sourcedIds).not.toContain('stud_beta_01');
      expect(emails).not.toContain('bob@beta.test');
    });

    it('returns only org-beta users for org-beta admin, strictly excluding org-alpha', async () => {
      const res = await env.request('GET', '/api/oneroster/v1p1/users', { token: betaAdminToken });
      expect(res.status).toBe(200);
      const userList = res.body.users;

      const sourcedIds = userList.map(u => u.sourcedId);
      const emails = userList.map(u => u.email);

      expect(sourcedIds).toContain('stud_beta_01');
      expect(emails).toContain('bob@beta.test');

      expect(sourcedIds).not.toContain('stud_alpha_01');
      expect(emails).not.toContain('alice@alpha.test');
    });

    it('denies access with 403 when admin token lacks an explicit orgId', async () => {
      const res = await env.request('GET', '/api/oneroster/v1p1/users', { token: noOrgAdminToken });
      expect(res.status).toBe(403);
    });
  });
});

