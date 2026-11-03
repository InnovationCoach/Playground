import { describe, expect, it, vi } from 'vitest';
import { createUniverseClient, CONTRACT_HEADER, scopedTokenProvider, scopeKey } from '../src/features/universe/pilot/universeClient.js';

const identity = { releaseId: 'r1', missionId: 'thalassa-wind-survey', missionVersion: '0.2.0-draft', routeId: 'guided', taskId: 'wind-capacity-factor', policyVersion: 'p1' };
const json = (status, body) => new Response(body === undefined ? 'not json' : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const make = (respond, token = 'tok') => {
  const fetchImpl = vi.fn(async (...args) => respond(...args));
  return { fetchImpl, client: createUniverseClient({ fetchImpl, getToken: async () => token, baseUrl: 'https://api.test' }) };
};

describe('mission service adapter (contract 0.1.1, API 1.0.0)', () => {
  it('sends exact paths, the contract header, body contractVersion and the idempotency key', async () => {
    const { fetchImpl, client } = make(() => json(200, { contractVersion: '1.0.0', draft: { draftId: 'd', revision: 1, updatedAt: '2026-11-02T00:00:00Z' } }));
    await client.availability(identity);
    let [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.test/api/universe/missions/thalassa-wind-survey/availability?releaseId=r1&missionVersion=0.2.0-draft&routeId=guided&taskId=wind-capacity-factor&policyVersion=p1');
    expect(init.method).toBe('GET');
    expect(init.headers[CONTRACT_HEADER]).toBe('1.0.0');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.body).toBeUndefined();

    const res = await client.saveDraft('thalassa-wind-survey', { expectedRevision: 0 }, 'ui-key-0000000000000001');
    [url, init] = fetchImpl.mock.calls[1];
    expect(url).toBe('https://api.test/api/universe/missions/thalassa-wind-survey/draft');
    expect(init.method).toBe('PUT');
    expect(init.headers['Idempotency-Key']).toBe('ui-key-0000000000000001');
    expect(JSON.parse(init.body)).toEqual({ contractVersion: '1.0.0', expectedRevision: 0 });
    expect(res).toMatchObject({ state: 'loaded', data: { draft: { revision: 1 } } });
  });

  it('never calls the service without a signed-in token', async () => {
    const { fetchImpl, client } = make(() => json(200, {}), null);
    expect(await client.mySubmissions({ missionId: 'm' })).toEqual({ state: 'unauthenticated' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('separates not-connected, unauthenticated and typed service errors', async () => {
    expect(await make(() => { throw new TypeError('Failed to fetch'); }).client.coachQueue()).toEqual({ state: 'not-connected' });
    expect(await make(() => json(401, { contractVersion: '1.0.0', error: { code: 'UNAUTHENTICATED', message: 'x' } })).client.coachQueue()).toEqual({ state: 'unauthenticated' });
    expect((await make(() => json(502)).client.coachQueue()).state).toBe('not-connected'); // a proxy page, not a service answer
    const open = await make(() => json(409, { contractVersion: '1.0.0', error: { code: 'SUBMISSION_ALREADY_OPEN', message: 'Already open.', retryable: false, details: { openSubmissionId: 's9' } } })).client.submit('m', {}, 'ui-key-0000000000000002');
    expect(open).toMatchObject({ state: 'error', status: 409, code: 'SUBMISSION_ALREADY_OPEN', details: { openSubmissionId: 's9' } });
  });

  it('rejects a successful body without the API contract version instead of treating it as data (200 {} and an old contract)', async () => {
    const empty = await make(() => json(200, {})).client.mySubmissions({ missionId: 'm' });
    expect(empty).toMatchObject({ state: 'error', code: 'CONTRACT_VERSION_UNSUPPORTED' });
    const old = await make(() => json(200, { contractVersion: '0.9.0', submissions: [] })).client.coachQueue();
    expect(old).toMatchObject({ state: 'error', code: 'CONTRACT_VERSION_UNSUPPORTED', details: { received: '0.9.0' } });
    const legacy = await make(() => json(200, { submissions: [] })).client.mySubmissions({});
    expect(legacy.state).toBe('error');
  });

  it('never turns a malformed successful list into an empty list', async () => {
    for (const body of [{}, { submissions: null }, { submissions: [{ id: 'x' }] }, { submissions: [], nextCursor: 7 }]) {
      const res = await make(() => json(200, { contractVersion: '1.0.0', ...body })).client.mySubmissions({ missionId: 'm' });
      expect(res).toMatchObject({ state: 'error', code: 'MALFORMED_RESPONSE' });
    }
    const ok = await make(() => json(200, { contractVersion: '1.0.0', submissions: [], nextCursor: null })).client.coachQueue();
    expect(ok).toMatchObject({ state: 'loaded', data: { submissions: [] } });
  });

  it('checks each endpoint envelope (availability, draft, submit, review, access)', async () => {
    const c = (body) => make(() => json(200, { contractVersion: '1.0.0', ...body })).client;
    const avail = { status: 'open', canStart: true, canResume: true, canSubmit: false };
    expect((await c({ identity, availability: { status: 'open' } }).availability(identity)).code).toBe('MALFORMED_RESPONSE');
    expect((await c({ identity, availability: avail }).availability(identity)).state).toBe('loaded');
    expect((await c({ identity }).getDraft(identity)).code).toBe('MALFORMED_RESPONSE');
    expect((await c({ identity, draft: null }).getDraft(identity)).state).toBe('loaded');
    expect((await c({ submissionId: 's1', status: 'submitted' }).submit('m', {}, 'k')).code).toBe('MALFORMED_RESPONSE');
    expect((await c({ submissionId: 's1', status: 'submitted', submissionRevision: 1 }).submit('m', {}, 'k')).state).toBe('loaded');
    expect((await c({ submissionId: 's1', status: 'pending', submissionRevision: 2 }).review('s1', {}, 'k')).code).toBe('MALFORMED_RESPONSE');
    expect((await c({ destinations: { boreas: {} } }).access(['boreas'])).code).toBe('MALFORMED_RESPONSE');
  });

  it('rejects availability that is not one of the contract statuses or not bound to the requested task', async () => {
    const c = (body) => make(() => json(200, { contractVersion: '1.0.0', ...body })).client;
    const flags = { canStart: true, canResume: true, canSubmit: true };
    expect((await c({ identity, availability: { status: 'paused', ...flags } }).availability(identity)).code).toBe('MALFORMED_RESPONSE');
    expect((await c({ availability: { status: 'open', ...flags } }).availability(identity)).code).toBe('MALFORMED_RESPONSE'); // no identity echo
    expect((await c({ identity: { ...identity, routeId: 'advanced' }, availability: { status: 'open', ...flags } }).availability(identity)).code).toBe('IDENTITY_MISMATCH');
  });

  it('rejects a wrong-task or incomplete draft instead of restoring blank or mislabelled work', async () => {
    const c = (body) => make(() => json(200, { contractVersion: '1.0.0', ...body })).client;
    const full = { draftId: 'd1', revision: 3, updatedAt: '2026-11-02T04:00:00Z', supportMode: 'guided', activeStepId: 'hours', answers: [], evidence: [], reflection: '' };
    expect((await c({ identity, draft: full }).getDraft(identity)).state).toBe('loaded');
    expect((await c({ identity: { ...identity, taskId: 'journey-rates' }, draft: full }).getDraft(identity)).code).toBe('IDENTITY_MISMATCH');
    expect((await c({ identity, draft: { ...full, routeId: 'advanced' } }).getDraft(identity)).code).toBe('IDENTITY_MISMATCH');
    for (const missing of ['updatedAt', 'draftId', 'answers', 'evidence', 'supportMode', 'activeStepId']) {
      const { [missing]: _, ...partial } = full;
      expect((await c({ identity, draft: partial }).getDraft(identity)).code).toBe('MALFORMED_RESPONSE');
    }
    expect((await c({ draft: { draftId: 'd1', revision: 1 } }).saveDraft('m', {}, 'k')).code).toBe('MALFORMED_RESPONSE'); // no updatedAt
    expect((await c({ draft: { draftId: 'd1', revision: 1, updatedAt: '2026-11-02T04:00:00Z' } }).saveDraft('m', {}, 'k')).state).toBe('loaded');
  });
});

describe('scoped token retrieval (F7)', () => {
  const user = (uid, orgId) => ({ uid, getIdTokenResult: vi.fn(async () => ({ token: `tok-${uid}-${orgId}`, claims: orgId === undefined ? {} : { orgId } })) });

  it('fails closed without a full scope, for another account, another organization claim or an account switch mid-request', async () => {
    const get = scopedTokenProvider({ currentUser: user('u1', 'org-a') });
    expect(await get(null)).toBeNull();
    expect(await get({ uid: 'u1' })).toBeNull();
    expect(await get({ uid: 'u2', orgId: 'org-a' })).toBeNull();
    expect(await get({ uid: 'u1', orgId: 'org-b' })).toBeNull();
    expect(await get({ uid: 'u1', orgId: 'org-a' })).toBe('tok-u1-org-a');
    expect(await scopedTokenProvider({ currentUser: user('u1', undefined) })({ uid: 'u1', orgId: 'org-a' })).toBeNull(); // no verified claim
    const auth = { currentUser: null };
    const switching = { uid: 'u1', getIdTokenResult: async () => { auth.currentUser = user('u2', 'org-a'); return { token: 't', claims: { orgId: 'org-a' } }; } };
    auth.currentUser = switching;
    expect(await scopedTokenProvider(auth)({ uid: 'u1', orgId: 'org-a' })).toBeNull();
  });

  it('never sends work when the scope no longer matches the signed-in account, and the unscoped base sends nothing', async () => {
    const fetchImpl = vi.fn();
    const base = createUniverseClient({ fetchImpl, getToken: scopedTokenProvider({ currentUser: user('u2', 'org-a') }) });
    expect(await base.withScope({ uid: 'u1', orgId: 'org-a' }).saveDraft('m', { expectedRevision: 0 }, 'ui-key-0000000000000003')).toEqual({ state: 'unauthenticated' });
    expect(await base.availability(identity)).toEqual({ state: 'unauthenticated' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(scopeKey({ uid: 'u1', orgId: 'org-a' })).toBe('u1|org-a');
    expect(scopeKey({ uid: 'u1', orgId: null })).toBeNull();
  });
});
