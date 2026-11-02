/**
 * SYNTHETIC, PREVIEW/TEST ONLY. An in-memory stand-in for the J02 mission service so the
 * pilot UI can be exercised without Firebase, a server or any real learner. It follows
 * contract 0.1.1 as Opus reads it (result shapes match pilot/universeClient.js), uses the
 * shared validators and the G03 fixture registry, and holds three fictional learners and
 * one fictional coach. It is not the backend and proves nothing about it.
 */
import { FIXTURE_RELEASES, REFERENCE_ARTIFACTS } from '../../shared/universe/fixtures/index.js';
import { resolveTask, validateDraft, validateSubmission, validateReview, canonicalStringify } from '../../shared/universe/index.js';

export const SYNTHETIC_PEOPLE = {
  amira: { uid: 'synthetic-learner-amira', displayName: 'Amira (synthetic)', orgId: 'org-north', classIds: ['class-7a'], role: 'student' },
  ben: { uid: 'synthetic-learner-ben', displayName: 'Ben (synthetic)', orgId: 'org-north', classIds: ['class-7a'], role: 'student' },
  chen: { uid: 'synthetic-learner-chen', displayName: 'Chen (synthetic)', orgId: 'org-south', classIds: ['class-7a'], role: 'student' },
  rivera: { uid: 'synthetic-coach-rivera', displayName: 'Ms Rivera (synthetic)', orgId: 'org-north', classIds: ['class-7a'], role: 'coach' }
};
const V = '1.0.0';
const IDS = ['releaseId', 'missionVersion', 'routeId', 'taskId', 'policyVersion'];
const copy = (v) => JSON.parse(JSON.stringify(v));
const loaded = (data, status = 200) => ({ state: 'loaded', status, data: { contractVersion: V, ...data } });
const err = (status, code, message, extra = {}) => ({ state: 'error', status, code, message, retryable: status >= 500 || status === 429, details: null, field: null, requestId: `synthetic-${code}`, ...extra });
const artifact = (name) => REFERENCE_ARTIFACTS.find((a) => a.name === name);

export function createSyntheticService({ latency = 0, registry = FIXTURE_RELEASES, seed = true } = {}) {
  let mode = 'normal', clock = Date.parse('2026-11-02T03:00:00Z'), seq = 0;
  const drafts = new Map(), subs = [], idem = new Map();
  const now = () => new Date((clock += 61_000)).toISOString();
  const wait = () => new Promise((r) => setTimeout(r, latency));

  function availabilityFor() {
    if (mode === 'withdrawn') return { status: 'withdrawn', canStart: false, canResume: false, canSubmit: false, reasonCode: 'MISSION_WITHDRAWN', reason: 'This investigation is paused for a correction. Your saved work is kept.', availabilityRevision: 2, checkedAt: now() };
    return { status: 'open', canStart: true, canResume: true, canSubmit: true, reasonCode: null, reason: null, availabilityRevision: 1, checkedAt: now() };
  }
  function gate() {
    if (mode === 'offline') return { state: 'not-connected' };
    if (mode === 'unavailable') return err(503, 'SERVICE_UNAVAILABLE', 'The mission service is busy. Please try again shortly.');
    return null;
  }
  const echo = (identity) => Object.fromEntries(['releaseId', 'missionId', 'missionVersion', 'routeId', 'taskId', 'policyVersion'].map((k) => [k, identity[k]]));
  const draftKey = (p, missionId, b) => canonicalStringify([p.orgId, p.uid, missionId, ...IDS.map((k) => b[k])]);
  function once(p, op, key, body, run) {
    if (!key) return err(400, 'IDEMPOTENCY_KEY_REQUIRED', 'An idempotency key is required.');
    const k = canonicalStringify([p.orgId, p.uid, op, key]), h = canonicalStringify(body);
    const prev = idem.get(k);
    if (prev) return prev.hash === h ? { ...prev.result, status: 200, data: { ...prev.result.data, idempotentReplay: true } } : err(409, 'IDEMPOTENCY_KEY_REUSED', 'This request key was already used for different work.');
    const result = run();
    if (result.state === 'loaded') idem.set(k, { hash: h, result });
    return result;
  }
  function page(list, { limit = 20, cursor } = {}) {
    const start = cursor ? Number(atob(cursor)) : 0, end = start + Math.min(50, limit);
    return { submissions: list.slice(start, end).map(copy), nextCursor: end < list.length ? btoa(String(end)) : null };
  }
  const newest = (a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : a.submissionId < b.submissionId ? 1 : -1);

  function createSubmission(p, missionId, body, at) {
    const task = resolveTask(registry, { ...body, missionId });
    const family = subs.filter((s) => s.learnerUid === p.uid && s.orgId === p.orgId && s.missionId === missionId);
    const prev = body.previousSubmissionId ? family.find((s) => s.submissionId === body.previousSubmissionId) : null;
    const rec = {
      submissionId: `synthetic-sub-${++seq}`, submissionRevision: 1, attemptNumber: family.length + 1, previousSubmissionId: body.previousSubmissionId || null,
      ...Object.fromEntries(IDS.map((k) => [k, body[k]])), missionId, missionTitle: task.value.mission.title, missionContentHash: task.value.mission.contentSha256,
      supportMode: body.supportMode, learnerUid: p.uid, learnerDisplayName: p.displayName, orgId: p.orgId, classIds: [...p.classIds],
      status: 'submitted', reflection: body.reflection, evidence: copy(body.evidence), previousCoachNote: prev?.coachNote ?? null,
      coachUid: null, coachNote: null, createdAt: at || now(), reviewedAt: null, availability: availabilityFor(), outcome: null, legacyFormat: false
    };
    subs.push(rec);
    return rec;
  }

  function clientFor(p) {
    const call = async (fn) => { await wait(); return gate() || fn(); };
    return {
      availability: (identity) => call(() => {
        const t = resolveTask(registry, identity);
        return t.ok ? loaded({ identity: echo(identity), availability: availabilityFor() }) : err(404, t.error.code, t.error.message);
      }),
      getDraft: (identity) => call(() => {
        const t = resolveTask(registry, identity);
        if (!t.ok) return err(404, t.error.code, t.error.message);
        const d = drafts.get(draftKey(p, identity.missionId, identity));
        return loaded({ identity: echo(identity), draft: d ? copy(d) : null });
      }),
      saveDraft: (missionId, body, key) => call(() => once(p, `PUT draft ${missionId}`, key, body, () => {
        const v = validateDraft({ contractVersion: V, ...body }, { registry, missionId });
        if (!v.ok) return err(400, v.error.code, v.error.message, { field: v.error.field });
        if (mode === 'withdrawn') return err(409, 'MISSION_WITHDRAWN', availabilityFor().reason);
        const k = draftKey(p, missionId, body), cur = drafts.get(k);
        if ((cur?.revision ?? 0) !== body.expectedRevision) return err(409, 'DRAFT_CONFLICT', 'Your account has a different saved version.', { details: { currentDraft: cur ? copy(cur) : null } });
        const { expectedRevision, contractVersion, ...rest } = v.value;
        const next = { ...rest, draftId: cur?.draftId || `synthetic-draft-${++seq}`, revision: (cur?.revision ?? 0) + 1, updatedAt: now() };
        drafts.set(k, next);
        return loaded({ draft: { draftId: next.draftId, revision: next.revision, updatedAt: next.updatedAt } });
      })),
      submit: (missionId, body, key) => call(() => once(p, `POST submit ${missionId}`, key, body, () => {
        if (p.role !== 'student') return err(403, 'FORBIDDEN', 'Only learners send mission work.');
        const v = validateSubmission({ contractVersion: V, ...body }, { registry, missionId });
        if (!v.ok) return err(400, v.error.code, v.error.message, { field: v.error.field });
        if (mode === 'withdrawn') return err(409, 'MISSION_WITHDRAWN', availabilityFor().reason);
        const own = subs.filter((s) => s.learnerUid === p.uid && s.orgId === p.orgId && s.missionId === missionId);
        const openOne = own.find((s) => s.status === 'submitted');
        if (openOne) return err(409, 'SUBMISSION_ALREADY_OPEN', 'You already have an attempt waiting for review.', { details: { openSubmissionId: openOne.submissionId } });
        if (body.previousSubmissionId) {
          const prev = own.find((s) => s.submissionId === body.previousSubmissionId);
          if (!prev || prev.status !== 'returned' || own.some((s) => s.previousSubmissionId === prev.submissionId))
            return err(400, 'VALIDATION_ERROR', 'Only your latest returned attempt can be revised.', { field: 'previousSubmissionId' });
        }
        const rec = createSubmission(p, missionId, body);
        drafts.delete(draftKey(p, missionId, body)); // synthetic assumption: a sent task's draft is cleared
        return loaded({ ...copy(rec), idempotentReplay: false }, 201);
      })),
      mySubmissions: ({ missionId, limit, cursor } = {}) => call(() => loaded(page(subs.filter((s) => s.learnerUid === p.uid && s.orgId === p.orgId && (!missionId || s.missionId === missionId)).sort(newest), { limit, cursor }))),
      coachQueue: ({ status = 'submitted', limit, cursor } = {}) => call(() => {
        if (p.role !== 'coach') return err(403, 'FORBIDDEN', 'Only coaches can see the review queue.');
        const mine = subs.filter((s) => s.orgId === p.orgId && s.classIds.some((c) => p.classIds.includes(c)) && s.status === status).sort(newest);
        return loaded(page(mine, { limit, cursor }));
      }),
      review: (id, body, key) => call(() => once(p, `POST review ${id}`, key, body, () => {
        if (p.role !== 'coach') return err(403, 'FORBIDDEN', 'Only coaches can review.');
        const v = validateReview({ contractVersion: V, ...body });
        if (!v.ok) return err(400, v.error.code, v.error.message, { field: v.error.field });
        const s = subs.find((x) => x.submissionId === id && x.orgId === p.orgId && x.classIds.some((c) => p.classIds.includes(c)));
        if (!s) return err(404, 'NOT_FOUND', 'This submission isn’t available to you.');
        if (s.learnerUid === p.uid) return err(403, 'FORBIDDEN', 'You can’t review your own work.');
        if (s.status !== 'submitted' || s.submissionRevision !== body.expectedSubmissionRevision)
          return err(409, 'REVIEW_CONFLICT', 'This attempt was already reviewed.', { details: { submissionRevision: s.submissionRevision, status: s.status } });
        Object.assign(s, { status: v.value.decision, submissionRevision: s.submissionRevision + 1, coachUid: p.uid, coachNote: v.value.note || null, reviewedAt: now(),
          outcome: v.value.decision === 'approved' ? { type: 'reviewed-only', grantIds: [], messageKey: 'universe.mission.reviewed', nextMissionIds: [] } : null });
        return loaded({ submissionId: s.submissionId, submissionRevision: s.submissionRevision, status: s.status, reviewedAt: s.reviewedAt, auditEventId: `synthetic-audit-${++seq}`, outcome: s.outcome });
      })),
      access: (planetIds) => call(() => loaded({
        releaseId: registry[0]?.releaseId, policyVersion: registry[0]?.policy.version, evaluatedAt: now(),
        destinations: Object.fromEntries(planetIds.map((id) => [id, ['thalassa', 'ignis'].includes(id)
          ? { status: 'available', evaluatedRule: 'public', isVerified: true, requirementKey: null, requirementText: null }
          : { status: 'locked', evaluatedRule: id === 'boreas' ? 'boreas-policy-unresolved' : 'unknown-destination', isVerified: false, requirementKey: 'universe.boreas.policyPending', requirementText: 'This expedition is not open yet.' }]))
      }))
    };
  }

  function seedData() {
    const wind = artifact('thalassa-wind-survey-guided-text-alternative').request;
    const a = createSubmission(SYNTHETIC_PEOPLE.amira, 'thalassa-wind-survey', wind, '2026-11-01T08:00:00Z');
    Object.assign(a, { status: 'returned', submissionRevision: 2, coachUid: SYNTHETIC_PEOPLE.rivera.uid, reviewedAt: '2026-11-01T09:30:00Z',
      coachNote: 'Good weighted table. In the plan comparison, say which capacity factor you used for each number, and add one measurement you would want before trusting night-time supply.' });
    createSubmission(SYNTHETIC_PEOPLE.ben, 'spacecraft-journey', artifact('spacecraft-journey-guided-diagram-alternative').request, '2026-11-01T10:00:00Z');
    createSubmission(SYNTHETIC_PEOPLE.chen, 'spacecraft-journey', artifact('spacecraft-journey-advanced').request, '2026-11-01T10:05:00Z');
  }
  function reset() { drafts.clear(); subs.length = 0; idem.clear(); mode = 'normal'; if (seed) seedData(); }
  reset();

  /**
   * A fetch stand-in that routes contract paths to clientFor(person), so the real
   * pilot/universeClient.js adapter (headers, envelopes, version checks) runs in previews and tests.
   */
  function fetchFor(p, { log } = {}) {
    const c = clientFor(p);
    return async (url, init = {}) => {
      const u = new URL(url, 'http://synthetic.local');
      const method = init.method || 'GET', h = init.headers || {}, body = init.body ? JSON.parse(init.body) : undefined;
      log?.push({ method, path: u.pathname, query: Object.fromEntries(u.searchParams), headers: h, body });
      const q = Object.fromEntries(u.searchParams), parts = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
      const strip = (b) => { if (!b) return b; const { contractVersion, ...rest } = b; return rest; };
      if (h['X-Universe-Contract-Version'] !== V || (body && body.contractVersion !== V))
        return respond(err(400, 'CONTRACT_VERSION_UNSUPPORTED', 'Unsupported contract version.'));
      let r;
      if (parts[1] === 'universe' && parts[2] === 'access') r = await c.access(body.planetIds);
      else if (parts[1] === 'universe' && parts[3] === 'submissions' && parts[4] === 'mine') r = await c.mySubmissions({ missionId: q.missionId, limit: Number(q.limit || 20), cursor: q.cursor });
      else if (parts[1] === 'universe' && parts[4] === 'availability') r = await c.availability({ ...q, missionId: parts[3] });
      else if (parts[1] === 'universe' && parts[4] === 'draft' && method === 'GET') r = await c.getDraft({ ...q, missionId: parts[3] });
      else if (parts[1] === 'universe' && parts[4] === 'draft' && method === 'PUT') r = await c.saveDraft(parts[3], strip(body), h['Idempotency-Key']);
      else if (parts[1] === 'universe' && parts[4] === 'submissions') r = await c.submit(parts[3], strip(body), h['Idempotency-Key']);
      else if (parts[1] === 'coach' && parts.length === 4) r = await c.coachQueue({ status: q.status, limit: Number(q.limit || 20), cursor: q.cursor });
      else if (parts[1] === 'coach' && parts[5] === 'review') r = await c.review(parts[4], strip(body), h['Idempotency-Key']);
      else r = err(404, 'NOT_FOUND', 'Unknown synthetic route.');
      return respond(r);
    };
  }
  function respond(r) {
    if (r.state === 'not-connected') throw new TypeError('Failed to fetch (synthetic offline)');
    const payload = r.state === 'loaded' ? r.data : { contractVersion: V, error: { code: r.code, message: r.message, retryable: r.retryable, requestId: r.requestId, field: r.field, details: r.details } };
    return new Response(JSON.stringify(payload), { status: r.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });
  }

  return { clientFor, fetchFor, reset, setMode: (m) => { mode = m; }, get mode() { return mode; }, submissions: subs, drafts };
}
