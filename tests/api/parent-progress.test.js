import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';
import { TERM } from '../../src/features/pbl/content/pblModel.js';

describe('API: GET /api/parent/children/:uid/progress', () => {
  let env;
  const orgId = 'org-progress';
  const path = uid => `/api/parent/children/${uid}/progress`;

  beforeAll(async () => {
    env = await setupApiTestEnv();
    await env.db.collection('users').doc('pp-parent').set({ uid: 'pp-parent', role: 'parent', orgId, displayName: 'Parent P', status: 'active' });
    await env.db.collection('users').doc('pp-kid').set({
      uid: 'pp-kid', role: 'student', orgId, displayName: 'Kid P', givenNames: 'Kid', surname: 'P', yearLevel: 'Year 8', status: 'active',
      goalPlan: null, email: 'kid@example.test'
    });
    await env.db.collection('users').doc('pp-quiet').set({ uid: 'pp-quiet', role: 'student', orgId, displayName: 'Quiet Kid', status: 'active' });
    await env.db.collection('parentLinks').doc('pp-link').set({ linkId: 'pp-link', parentUid: 'pp-parent', studentUid: 'pp-kid', status: 'active', orgId });
    await env.db.collection('parentLinks').doc('pp-revoked').set({ linkId: 'pp-revoked', parentUid: 'pp-parent', studentUid: 'pp-quiet', status: 'revoked', orgId });
    await env.db.collection('users').doc('pp-kid').collection('activityProgress').doc(`pbl-${TERM.id}`).set({});
  });
  afterAll(async () => { await env?.teardown(); });

  it('returns the progress body for a linked child, without private fields', async () => {
    const token = await env.getIdToken('pp-parent', { role: 'parent', orgId });
    const res = await env.request('GET', path('pp-kid'), { token });
    expect(res.status).toBe(200);
    expect(res.body.child).toMatchObject({ linkId: 'pp-link', uid: 'pp-kid', displayName: 'Kid P' });
    expect(res.body.child).not.toHaveProperty('email');
    expect(res.body).toHaveProperty('generatedAt');
    expect(JSON.stringify(res.body)).not.toContain('kid@example.test');
  });

  it('uses the same link check for unlinked and revoked children (404, no existence leak)', async () => {
    const token = await env.getIdToken('pp-parent', { role: 'parent', orgId });
    const revoked = await env.request('GET', path('pp-quiet'), { token });
    const unknown = await env.request('GET', path('no-such-kid'), { token });
    expect(revoked.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(revoked.body.error.code).toBe('NOT_FOUND');
    expect(revoked.body).toEqual(unknown.body);
  });

  it('refuses non-parent roles with 403', async () => {
    const token = await env.getIdToken('pp-kid', { role: 'student', orgId });
    const res = await env.request('GET', path('pp-kid'), { token });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('requires a signed-in caller', async () => {
    const res = await env.request('GET', path('pp-kid'));
    expect(res.status).toBe(401);
  });
});
