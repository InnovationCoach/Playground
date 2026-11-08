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
});
