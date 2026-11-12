import { describe, it, expect, vi, beforeEach } from 'vitest';

let decoded; let profile;
vi.mock('../server/auth.js', () => ({ initAdmin: () => true }));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ verifyIdToken: async () => decoded }) }));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: profile !== undefined, data: () => profile }) }) }) }),
  FieldValue: { serverTimestamp: () => 'ts' }
}));
import { requireClaims } from '../server/middleware/auth.js';

async function run(path) {
  const req = { headers: { authorization: 'Bearer t' }, path, query: {} };
  let status = null; let code = null; let nextCalled = false;
  const res = { status(s) { status = s; return this; }, json(b) { code = b?.error?.code; return this; } };
  await requireClaims(req, res, () => { nextCalled = true; });
  return { status, code, nextCalled, caller: req.caller };
}
const microsoft = (extra = {}) => ({ uid: 'u1', email: 'anna@welearn.org', firebase: { sign_in_provider: 'microsoft.com' }, ...extra });

beforeEach(() => { profile = undefined; });

describe('Microsoft session gate in requireClaims', () => {
  it('gives a first-time Microsoft user (no profile) no data access, only the access-request endpoints', async () => {
    decoded = microsoft();
    for (const path of ['/admin/users', '/sessions', '/me/progress', '/schools/x/classes']) {
      const r = await run(path);
      expect(r).toMatchObject({ status: 403, code: 'ACCESS_PENDING', nextCalled: false });
    }
    for (const path of ['/auth/access-request', '/auth/access-request/me', '/me']) {
      expect((await run(path)).nextCalled).toBe(true);
    }
  });

  it('treats an approved profile without a verified Microsoft identity as not yet usable', async () => {
    decoded = microsoft();
    profile = { status: 'active', role: 'student' };
    expect(await run('/admin/users')).toMatchObject({ status: 403, code: 'ACCESS_PENDING' });
  });

  it('lets an approved profile with a finalized identity through', async () => {
    decoded = microsoft();
    profile = { status: 'active', role: 'student', microsoftIdentity: { oid: 'o' } };
    const r = await run('/sessions');
    expect(r.nextCalled).toBe(true);
    expect(r.caller.role).toBe('student');
  });

  it('does not stop password sessions, including the link-finalizing endpoint', async () => {
    decoded = { uid: 'u2', email: 'anaisapala23@gmail.com', firebase: { sign_in_provider: 'password' } };
    profile = { status: 'active', role: 'student' };
    expect((await run('/auth/link-microsoft')).nextCalled).toBe(true);
    expect((await run('/sessions')).nextCalled).toBe(true);
  });

  it('keeps refusing suspended accounts', async () => {
    decoded = microsoft();
    profile = { status: 'suspended', microsoftIdentity: { oid: 'o' } };
    expect((await run('/sessions')).status).toBe(401);
  });
});
