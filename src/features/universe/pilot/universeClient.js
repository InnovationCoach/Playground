import { API_CONTRACT_VERSION } from '../../../../shared/universe/index.js';

/**
 * Mission service adapter for pilot contract 0.1.1 (API 1.0.0).
 *
 * Every call resolves (never throws) to one discriminated result, so the UI can
 * tell a real empty list from a failure:
 *   { state: 'loaded', status, data }
 *   { state: 'error', status, code, message, retryable, details, field, requestId }
 *   { state: 'unauthenticated' }   no signed-in user, or HTTP 401
 *   { state: 'not-connected' }     network failure or no API reachable
 * Mutations send `contractVersion` in the body and an `Idempotency-Key` header;
 * every request sends `X-Universe-Contract-Version`. Nothing here caches learner
 * records, writes browser storage or decides access.
 */
export const CONTRACT_HEADER = 'X-Universe-Contract-Version';

export function newIdempotencyKey() {
  const c = globalThis.crypto;
  if (c?.randomUUID) return `ui-${c.randomUUID()}`;
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  return `ui-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

const IDENTITY_QUERY = ['releaseId', 'missionVersion', 'routeId', 'taskId', 'policyVersion'];

function query(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '';
}

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isRev = (v) => Number.isSafeInteger(v) && v >= 0;
const isAvailability = (a) => isObj(a) && isStr(a.status) && ['canStart', 'canResume', 'canSubmit'].every((k) => typeof a[k] === 'boolean');
const isDraft = (d) => isObj(d) && isRev(d.revision) && isStr(d.updatedAt ?? 'x');
const isList = (d) => Array.isArray(d.submissions) && d.submissions.every((s) => isObj(s) && isStr(s.submissionId) && isStr(s.status)) && (d.nextCursor == null || isStr(d.nextCursor));

/** What each endpoint's successful body must contain. A body that doesn't match is an error, never an empty result. */
export const ENVELOPES = {
  availability: (d) => isAvailability(d.availability ?? d),
  getDraft: (d) => 'draft' in d && (d.draft === null || isDraft(d.draft)),
  saveDraft: (d) => isDraft(d.draft ?? d),
  submit: (d) => isStr(d.submissionId) && isStr(d.status) && isRev(d.submissionRevision),
  mySubmissions: isList,
  coachQueue: isList,
  review: (d) => isStr(d.submissionId) && ['approved', 'returned'].includes(d.status) && isRev(d.submissionRevision),
  access: (d) => isObj(d.destinations) && Object.values(d.destinations).every((e) => isObj(e) && isStr(e.status))
};

export function createUniverseClient({ fetchImpl = globalThis.fetch?.bind(globalThis), getToken, baseUrl = '' } = {}) {
  async function request(op, method, path, { body, idempotencyKey } = {}) {
    let token = null;
    try { token = getToken ? await getToken() : null; } catch { token = null; }
    if (!token) return { state: 'unauthenticated' };
    const headers = { Authorization: `Bearer ${token}`, [CONTRACT_HEADER]: API_CONTRACT_VERSION };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    let res;
    try {
      res = await fetchImpl(`${baseUrl}${path}`, {
        method, headers, cache: 'no-store',
        body: body === undefined ? undefined : JSON.stringify({ contractVersion: API_CONTRACT_VERSION, ...body })
      });
    } catch {
      return { state: 'not-connected' };
    }
    const data = await res.json().catch(() => null);
    if (res.status === 401) return { state: 'unauthenticated' };
    if (!res.ok) {
      const e = data?.error;
      if (!e) return { state: 'not-connected', status: res.status };
      return {
        state: 'error', status: res.status, code: e.code || 'UNKNOWN', message: e.message || 'The mission service could not complete this.',
        retryable: !!e.retryable, details: e.details ?? null, field: e.field ?? null, requestId: e.requestId ?? null
      };
    }
    if (!isObj(data)) return { state: 'not-connected', status: res.status };
    if (data.contractVersion !== API_CONTRACT_VERSION)
      return { state: 'error', status: res.status, code: 'CONTRACT_VERSION_UNSUPPORTED', message: 'The mission service answered in a version this screen doesn’t understand.', retryable: false, details: { received: data.contractVersion ?? null }, field: null, requestId: null };
    if (!ENVELOPES[op](data))
      return { state: 'error', status: res.status, code: 'MALFORMED_RESPONSE', message: 'The mission service sent an incomplete answer, so nothing is shown from it.', retryable: true, details: null, field: null, requestId: null };
    return { state: 'loaded', status: res.status, data };
  }

  const missionPath = (missionId) => `/api/universe/missions/${encodeURIComponent(missionId)}`;
  const identityQuery = (identity) => query(Object.fromEntries(IDENTITY_QUERY.map((k) => [k, identity[k]])));

  return {
    availability: (identity) => request('availability', 'GET', `${missionPath(identity.missionId)}/availability${identityQuery(identity)}`),
    getDraft: (identity) => request('getDraft', 'GET', `${missionPath(identity.missionId)}/draft${identityQuery(identity)}`),
    saveDraft: (missionId, body, idempotencyKey) => request('saveDraft', 'PUT', `${missionPath(missionId)}/draft`, { body, idempotencyKey }),
    submit: (missionId, body, idempotencyKey) => request('submit', 'POST', `${missionPath(missionId)}/submissions`, { body, idempotencyKey }),
    mySubmissions: ({ missionId, missionVersion, routeId, limit = 20, cursor } = {}) =>
      request('mySubmissions', 'GET', `/api/universe/missions/submissions/mine${query({ missionId, missionVersion, routeId, limit, cursor })}`),
    coachQueue: ({ status = 'submitted', limit = 20, cursor } = {}) =>
      request('coachQueue', 'GET', `/api/coach/universe/submissions${query({ status, limit, cursor })}`),
    review: (submissionId, body, idempotencyKey) =>
      request('review', 'POST', `/api/coach/universe/submissions/${encodeURIComponent(submissionId)}/review`, { body, idempotencyKey }),
    access: (planetIds) => request('access', 'POST', '/api/universe/access', { body: { planetIds } })
  };
}

/** The production client: signed-in Firebase user's ID token, same-origin or VITE_API_URL. */
export function createDefaultUniverseClient({ auth, baseUrl }) {
  return createUniverseClient({ baseUrl, getToken: async () => (auth?.currentUser ? auth.currentUser.getIdToken() : null) });
}

/** Learner-facing wording for each result state. Never invents a server outcome. */
export function describeFailure(result) {
  if (!result) return 'Checking…';
  if (result.state === 'unauthenticated') return 'Sign in as a learner to save or send mission work.';
  if (result.state === 'not-connected') return 'The mission service can’t be reached right now. Your work on this screen is kept until you close it.';
  if (result.state === 'error') return result.message;
  return '';
}
