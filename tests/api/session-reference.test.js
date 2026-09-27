import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';

describe('API: Session and Reference Data', () => {
  let env;

  beforeAll(async () => {
    env = await setupApiTestEnv();

    // Seed test org, school, cohort, programme, and admin user
    await env.db.collection('organizations').doc('org-welearn').set({
      name: 'WeLearn', status: 'active', defaultLocale: 'en'
    });
    await env.db.collection('schools').doc('sch-bkk').set({
      orgId: 'org-welearn', name: 'Bangkok Campus', status: 'active'
    });
    await env.db.collection('cohorts').doc('cohort-w2e').set({
      orgId: 'org-welearn', code: 'W2E', name: { en: 'W2E' }, status: 'active'
    });
    await env.db.collection('programmes').doc('prog-thai-diploma').set({
      orgId: 'org-welearn', code: 'THAI-DIP', name: { en: 'Thai Diploma' }, status: 'active'
    });
    await env.db.collection('classes').doc('class-y9').set({
      orgId: 'org-welearn', schoolId: 'sch-bkk', name: 'Year 9', status: 'active'
    });

    await env.db.collection('users').doc('admin1').set({
      uid: 'admin1', email: 'admin@welearn.test', role: 'admin', orgId: 'org-welearn',
      schoolIds: ['sch-bkk'], classIds: [], status: 'active', displayName: 'Admin User', locale: 'en'
    });
  });

  afterAll(async () => {
    await env.teardown();
  });

  describe('GET /api/me', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await env.request('GET', '/api/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns current user session details with valid token', async () => {
      const token = await env.getIdToken('admin1', { role: 'admin', orgId: 'org-welearn' });
      const res = await env.request('GET', '/api/me', { token });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        uid: 'admin1',
        role: 'admin',
        orgId: 'org-welearn',
        email: 'admin@welearn.test',
        displayName: 'Admin User'
      });
    });
  });

  describe('GET /api/admin/organization, schools, classes, cohorts, programmes', () => {
    it('returns 403 for student role', async () => {
      const token = await env.getIdToken('student1', { role: 'student', orgId: 'org-welearn' });
      const res = await env.request('GET', '/api/admin/schools', { token });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns reference data lists for admin', async () => {
      const token = await env.getIdToken('admin1', { role: 'admin', orgId: 'org-welearn' });

      const orgRes = await env.request('GET', '/api/admin/organization', { token });
      expect(orgRes.status).toBe(200);
      expect(orgRes.body.name).toBe('WeLearn');

      const schRes = await env.request('GET', '/api/admin/schools', { token });
      expect(schRes.status).toBe(200);
      expect(schRes.body.items.length).toBeGreaterThanOrEqual(1);
      expect(schRes.body.items.some(s => s.name === 'Bangkok Campus')).toBe(true);

      const clsRes = await env.request('GET', '/api/admin/classes', { token, query: { schoolId: 'sch-bkk' } });
      expect(clsRes.status).toBe(200);
      expect(clsRes.body.items.length).toBeGreaterThanOrEqual(1);

      const cohRes = await env.request('GET', '/api/admin/cohorts', { token });
      expect(cohRes.status).toBe(200);
      expect(cohRes.body.items.length).toBeGreaterThanOrEqual(1);

      const progRes = await env.request('GET', '/api/admin/programmes', { token });
      expect(progRes.status).toBe(200);
      expect(progRes.body.items.length).toBeGreaterThanOrEqual(1);
    });
  });
});
