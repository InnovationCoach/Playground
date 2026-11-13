import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { generateKeyPairSync, createSign } from 'node:crypto';
import {
  getSsoConfig, isSsoApprover, verifyMicrosoftIdToken, submitOrGetAccessRequest, reviewAccessRequest,
  registerExpectedMicrosoftLink, completeMicrosoftLink, microsoftSessionAllowed, assertAccessAllowed, SsoError
} from '../server/lib/microsoft-sso-auth.js';
import * as emailModule from '../server/lib/email.js';

const TENANT = '11111111-2222-3333-4444-555555555555';
const CLIENT = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const MANI_UID = 'zLdxQXTfHbfN221BNalxEn32BzZ2';
const config = { tenantId: TENANT, clientId: CLIENT, approverUids: [MANI_UID] };

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
const fetchKeys = async () => [jwk];
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const NOW = 1_800_000_000_000;

function sign(claims = {}, { key = privateKey, header = {} } = {}) {
  const h = b64({ alg: 'RS256', kid: 'k1', typ: 'JWT', ...header });
  const p = b64({
    iss: `https://login.microsoftonline.com/${TENANT}/v2.0`, tid: TENANT, aud: CLIENT, oid: 'oid-anna',
    preferred_username: 'anna@welearn.org', name: 'Anna', exp: NOW / 1000 + 3600, nbf: NOW / 1000 - 10, ...claims
  });
  const sig = createSign('RSA-SHA256').update(`${h}.${p}`).sign(key).toString('base64url');
  return `${h}.${p}.${sig}`;
}
const verify = (token, cfg = config) => verifyMicrosoftIdToken(token, { config: cfg, fetchKeys, nowMs: NOW });

/** Minimal in-memory Firestore: doc get/set/update/delete and where(...).limit().get() with dotted paths. */
function createDb() {
  const store = new Map();
  const col = (n) => { if (!store.has(n)) store.set(n, new Map()); return store.get(n); };
  const dig = (o, path) => path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const snap = (id, data) => ({ id, exists: data !== undefined, data: () => (data === undefined ? undefined : structuredClone(data)) });
  return {
    _col: col,
    collection: (n) => ({
      doc: (id) => {
        const docId = id || `auto_${Math.random().toString(36).slice(2, 9)}`;
        return {
          id: docId,
          get: async () => snap(docId, col(n).get(docId)),
          set: async (d, o = {}) => { col(n).set(docId, o.merge ? { ...(col(n).get(docId) || {}), ...d } : { ...d }); },
          update: async (d) => { if (!col(n).has(docId)) throw new Error('missing'); col(n).set(docId, { ...col(n).get(docId), ...d }); },
          delete: async () => { col(n).delete(docId); }
        };
      },
      where: (field, _op, value) => ({
        limit: () => ({
          get: async () => {
            const docs = [...col(n)].filter(([, d]) => dig(d, field) === value).map(([id, d]) => snap(id, d));
            return { empty: docs.length === 0, docs };
          }
        })
      })
    })
  };
}

const sessionToken = (extra = {}) => ({ uid: 'fb-anna', email: 'anna@welearn.org', firebase: { sign_in_provider: 'microsoft.com' }, ...extra });
const approver = { uid: MANI_UID, role: 'admin', email: 'mgolzary84@gmail.com' };

beforeEach(() => { vi.spyOn(emailModule, 'sendEmail').mockResolvedValue({ sent: true }); });

describe('Microsoft ID token verification', () => {
  it('accepts a correctly signed token from the approved tenant and returns the directory identity', async () => {
    expect(await verify(sign())).toEqual({ oid: 'oid-anna', tid: TENANT, email: 'anna@welearn.org', name: 'Anna' });
  });

  it.each([
    ['a foreign tenant', { tid: 'other-tenant', iss: 'https://login.microsoftonline.com/other-tenant/v2.0' }, 'UNAPPROVED_TENANT'],
    ['the right tid but a forged issuer', { iss: 'https://login.microsoftonline.com/other/v2.0' }, 'UNAPPROVED_TENANT'],
    ['another application audience', { aud: 'someone-elses-app' }, 'INVALID_AUDIENCE'],
    ['an expired token', { exp: NOW / 1000 - 3600 }, 'TOKEN_EXPIRED'],
    ['a non-@welearn.org address', { preferred_username: 'x@gmail.com' }, 'INVALID_DOMAIN'],
    ['a lookalike domain', { preferred_username: 'x@welearn.org.evil.com' }, 'INVALID_DOMAIN'],
    ['no directory identity', { oid: undefined }, 'INVALID_TOKEN']
  ])('rejects %s', async (_label, claims, code) => {
    await expect(verify(sign(claims))).rejects.toMatchObject({ code });
  });

  it('rejects a token signed with a different key', async () => {
    await expect(verify(sign({}, { key: other.privateKey }))).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
  });

  it('rejects unknown key ids, alg none, and malformed input', async () => {
    await expect(verify(sign({}, { header: { kid: 'unknown' } }))).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    await expect(verify(sign({}, { header: { alg: 'none' } }))).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    await expect(verify('not-a-token')).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    await expect(verify(undefined)).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
  });

  it('fails closed when the tenant or client id is not configured', async () => {
    await expect(verify(sign(), { ...config, tenantId: '' })).rejects.toMatchObject({ code: 'SSO_NOT_CONFIGURED' });
    await expect(verify(sign(), { ...config, clientId: '' })).rejects.toMatchObject({ code: 'SSO_NOT_CONFIGURED' });
  });
});

describe('Approval authority', () => {
  it('defaults to Mani’s admin UID and can be overridden by environment', () => {
    expect(getSsoConfig({}).approverUids).toEqual([MANI_UID]);
    expect(getSsoConfig({ SSO_APPROVER_UIDS: 'a, b' }).approverUids).toEqual(['a', 'b']);
  });

  it('accepts only an admin whose UID is designated, whatever their email says', () => {
    expect(isSsoApprover(approver, config)).toBe(true);
    expect(isSsoApprover({ uid: 'someone-else', role: 'admin', email: 'mani@welearn.org' }, config)).toBe(false);
    expect(isSsoApprover({ uid: MANI_UID, role: 'teacher' }, config)).toBe(false);
    expect(isSsoApprover(null, config)).toBe(false);
  });
});

describe('Access requests', () => {
  it('requires a verified Microsoft identity that matches a Microsoft session', async () => {
    const db = createDb();
    await expect(submitOrGetAccessRequest(db, sessionToken(), {}, undefined)).rejects.toMatchObject({ code: 'MICROSOFT_TOKEN_REQUIRED' });
    const verified = await verify(sign());
    await expect(submitOrGetAccessRequest(db, sessionToken({ firebase: { sign_in_provider: 'password' } }), {}, verified)).rejects.toMatchObject({ code: 'INVALID_PROVIDER' });
    await expect(submitOrGetAccessRequest(db, sessionToken({ email: 'someone.else@welearn.org' }), {}, verified)).rejects.toMatchObject({ code: 'IDENTITY_MISMATCH' });
    expect(db._col('accessRequests').size).toBe(0);
  });

  it('stores a pending request with the verified oid, notifies, and is idempotent', async () => {
    const db = createDb();
    const verified = await verify(sign());
    const first = await submitOrGetAccessRequest(db, sessionToken(), { requestedRole: 'admin', reason: 'hi' }, verified);
    expect(first.isNew).toBe(true);
    expect(first.request).toMatchObject({ status: 'pending', entraOid: 'oid-anna', requestedRole: 'student', notificationSent: true });
    const again = await submitOrGetAccessRequest(db, sessionToken(), {}, verified);
    expect(again).toMatchObject({ isNew: false, duplicate: true });
    expect(db._col('accessRequests').size).toBe(1);
  });

  it('still records the request when email notification fails', async () => {
    emailModule.sendEmail.mockRejectedValue(new Error('smtp down'));
    const db = createDb();
    const res = await submitOrGetAccessRequest(db, sessionToken(), {}, await verify(sign()));
    expect(res.isNew).toBe(true);
    expect((await db.collection('accessRequests').doc('req_fb-anna').get()).data().notificationError).toBe('smtp down');
  });

  it('refuses to open a second profile for a Microsoft account an admin registered for an existing one', async () => {
    const db = createDb();
    await db.collection('msLinkExpectations').doc('existing-anna').set({ uid: 'existing-anna', upn: 'anna@welearn.org' });
    await expect(submitOrGetAccessRequest(db, sessionToken(), {}, await verify(sign()))).rejects.toMatchObject({ code: 'LINK_EXPECTED_FOR_EXISTING_ACCOUNT', status: 409 });
    expect(db._col('accessRequests').size).toBe(0);
  });
});

describe('Reviewing requests', () => {
  async function pendingRequest(db) {
    await submitOrGetAccessRequest(db, sessionToken(), { requestedRole: 'student' }, await verify(sign()));
  }

  it('only a designated approver may review', async () => {
    const db = createDb(); await pendingRequest(db);
    const stranger = { uid: 'x', role: 'admin', email: 'mani@welearn.org' };
    await expect(reviewAccessRequest(db, null, stranger, 'req_fb-anna', { decision: 'approve' }, config)).rejects.toMatchObject({ code: 'UNAUTHORIZED_APPROVER' });
    expect((await db.collection('accessRequests').doc('req_fb-anna').get()).data().status).toBe('pending');
  });

  it('approval activates the profile, binds the verified Microsoft identity, sets claims and audits', async () => {
    const db = createDb(); await pendingRequest(db);
    const adminAuth = { setCustomUserClaims: vi.fn() };
    const res = await reviewAccessRequest(db, adminAuth, approver, 'req_fb-anna', { decision: 'approve', assignedRole: 'student' }, config);
    expect(res).toMatchObject({ status: 'approved', assignedRole: 'student' });
    const user = (await db.collection('users').doc('fb-anna').get()).data();
    expect(user).toMatchObject({ status: 'active', role: 'student', microsoftIdentity: { oid: 'oid-anna', tid: TENANT, upn: 'anna@welearn.org' } });
    expect(microsoftSessionAllowed(user)).toBe(true);
    expect(adminAuth.setCustomUserClaims).toHaveBeenCalledWith('fb-anna', expect.objectContaining({ role: 'student' }));
    expect([...db._col('auditLogs').values()].some((l) => l.action === 'ACCESS_REQUEST_APPROVED')).toBe(true);
  });

  it('never grants admin through approval, and a request is decided once', async () => {
    const db = createDb(); await pendingRequest(db);
    await expect(reviewAccessRequest(db, null, approver, 'req_fb-anna', { decision: 'approve', assignedRole: 'admin' }, config)).rejects.toMatchObject({ code: 'INVALID_ROLE' });
    await reviewAccessRequest(db, { setCustomUserClaims: vi.fn() }, approver, 'req_fb-anna', { decision: 'approve' }, config);
    await expect(reviewAccessRequest(db, null, approver, 'req_fb-anna', { decision: 'reject' }, config)).rejects.toMatchObject({ code: 'ALREADY_REVIEWED' });
  });

  it('rejection records the reason and leaves the account without access', async () => {
    const db = createDb(); await pendingRequest(db);
    await reviewAccessRequest(db, null, approver, 'req_fb-anna', { decision: 'reject', rejectionReason: 'Not enrolled' }, config);
    const user = (await db.collection('users').doc('fb-anna').get()).data();
    expect(user.status).toBe('rejected');
    expect(microsoftSessionAllowed(user)).toBe(false);
    expect(() => assertAccessAllowed(null, user)).toThrow(SsoError);
  });
});

describe('Administrator-managed linking of an existing account', () => {
  const caller = approver;
  async function seed(db) {
    await db.collection('users').doc('anna-uid').set({ uid: 'anna-uid', email: 'anaisapala23@gmail.com', role: 'student', status: 'active' });
  }
  const annaSession = { uid: 'anna-uid', email: 'anaisapala23@gmail.com', firebase: { sign_in_provider: 'password' } };
  const authWith = (providerData) => ({ getUser: async () => ({ providerData }) });
  const msProvider = { providerId: 'microsoft.com', email: 'anna@welearn.org', uid: 'x' };

  it('registers only official addresses and refuses an address already claimed elsewhere', async () => {
    const db = createDb(); await seed(db);
    await db.collection('users').doc('other-uid').set({ uid: 'other-uid', role: 'student' });
    await expect(registerExpectedMicrosoftLink(db, caller, 'anna-uid', 'anna@gmail.com')).rejects.toMatchObject({ code: 'VALIDATION' });
    await expect(registerExpectedMicrosoftLink(db, caller, 'missing', 'a@welearn.org')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await registerExpectedMicrosoftLink(db, caller, 'anna-uid', 'Anna@WeLearn.org');
    expect((await db.collection('msLinkExpectations').doc('anna-uid').get()).data().upn).toBe('anna@welearn.org');
    await expect(registerExpectedMicrosoftLink(db, caller, 'other-uid', 'anna@welearn.org')).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('links in place: keeps the UID and profile, records the verified identity, consumes the registration', async () => {
    const db = createDb(); await seed(db);
    await registerExpectedMicrosoftLink(db, caller, 'anna-uid', 'anna@welearn.org');
    const res = await completeMicrosoftLink(db, authWith([msProvider]), annaSession, await verify(sign()));
    expect(res.uid).toBe('anna-uid');
    const user = (await db.collection('users').doc('anna-uid').get()).data();
    expect(user).toMatchObject({ role: 'student', status: 'active', email: 'anaisapala23@gmail.com', microsoftIdentity: { oid: 'oid-anna', upn: 'anna@welearn.org' } });
    expect((await db.collection('msLinkExpectations').doc('anna-uid').get()).exists).toBe(false);
    expect(db._col('users').size).toBe(1);
  });

  it('refuses without an administrator registration', async () => {
    const db = createDb(); await seed(db);
    await expect(completeMicrosoftLink(db, authWith([msProvider]), annaSession, await verify(sign()))).rejects.toMatchObject({ code: 'LINK_NOT_REGISTERED' });
    expect((await db.collection('users').doc('anna-uid').get()).data().microsoftIdentity).toBeUndefined();
  });

  it('refuses a verified identity that is not the registered one', async () => {
    const db = createDb(); await seed(db);
    await registerExpectedMicrosoftLink(db, caller, 'anna-uid', 'anna@welearn.org');
    const stranger = await verify(sign({ preferred_username: 'someone@welearn.org', oid: 'oid-someone' }));
    await expect(completeMicrosoftLink(db, authWith([msProvider]), annaSession, stranger)).rejects.toMatchObject({ code: 'IDENTITY_MISMATCH' });
  });

  it('refuses when no Microsoft provider is attached or it disagrees with the verified identity', async () => {
    const db = createDb(); await seed(db);
    await registerExpectedMicrosoftLink(db, caller, 'anna-uid', 'anna@welearn.org');
    const verified = await verify(sign());
    await expect(completeMicrosoftLink(db, authWith([]), annaSession, verified)).rejects.toMatchObject({ code: 'PROVIDER_NOT_LINKED' });
    await expect(completeMicrosoftLink(db, authWith([{ ...msProvider, email: 'bob@welearn.org' }]), annaSession, verified)).rejects.toMatchObject({ code: 'IDENTITY_MISMATCH' });
  });

  it('refuses a Microsoft identity already linked to a different profile', async () => {
    const db = createDb(); await seed(db);
    await db.collection('users').doc('someone-else').set({ uid: 'someone-else', microsoftIdentity: { oid: 'oid-anna' } });
    await registerExpectedMicrosoftLink(db, caller, 'anna-uid', 'anna@welearn.org');
    await expect(completeMicrosoftLink(db, authWith([msProvider]), annaSession, await verify(sign()))).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});

describe('Session gate helpers', () => {
  it('allows a Microsoft session only for an active profile with a finalized identity', () => {
    expect(microsoftSessionAllowed({ status: 'active', microsoftIdentity: { oid: 'o' } })).toBe(true);
    expect(microsoftSessionAllowed({ status: 'active' })).toBe(false);
    expect(microsoftSessionAllowed({ status: 'pending', microsoftIdentity: { oid: 'o' } })).toBe(false);
    expect(microsoftSessionAllowed({})).toBe(false);
  });

  it('assertAccessAllowed rejects pending, rejected and unknown accounts', () => {
    expect(assertAccessAllowed(null, { status: 'active' })).toBe(true);
    for (const status of ['pending', 'rejected', undefined]) expect(() => assertAccessAllowed(null, { status })).toThrow(SsoError);
  });
});
