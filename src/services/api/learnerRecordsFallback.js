/**
 * Local-development stand-in for /api/pilot/learner-records, used only when
 * the API has no such route yet (see apiClient's mockAllowed). In-memory, so a
 * reload clears it. The real endpoints are specified in
 * docs/LEARNER-RECORDS-CONTRACT-FOR-GEMINI.md.
 */
const BASE = '/api/pilot/learner-records';
const SAMPLE_LEARNERS = [
  { id: 'student-alex', displayName: 'Alex Chen' },
  { id: 'student-jordan', displayName: 'Jordan Taylor' },
  { id: 'student-mia', displayName: 'Mia Chen' },
  { id: 'student-tom', displayName: 'Tom Becker' }
];
const COACH = { uid: 'dev-coach', name: 'Coach (local test)' };
const ADMIN = { uid: 'dev-admin', name: 'Admin (local test)' };

let store = [];
let seq = 0;

const strip = ({ fileData, ...meta }) => meta;
const err = (status, code, message) => { const e = new Error(message); e.status = status; e.code = code; throw e; };

export function resetLearnerRecordsFallback() { store = []; seq = 0; }

/** Returns a response body, or undefined when the path is not a learner-records path. */
export function handleLearnerRecordsFallback(method, path, body, callerRole) {
  const clean = String(path || '').split('?')[0];
  if (!clean.startsWith(BASE)) return undefined;
  const rest = clean.slice(BASE.length).split('/').filter(Boolean).map(decodeURIComponent);
  const isAdmin = callerRole === 'admin' || callerRole === 'supervisor';

  if (method === 'GET' && rest[0] === 'learners') return { items: SAMPLE_LEARNERS };
  if (method === 'GET' && !rest.length) return { items: store.map(strip) };

  if (method === 'POST' && !rest.length) {
    const learner = SAMPLE_LEARNERS.find((l) => l.id === body?.learnerUid);
    if (!learner) err(400, 'VALIDATION', 'Choose a learner from your classes.');
    const item = {
      id: `rec-local-${++seq}`, learnerUid: learner.id, learnerName: learner.displayName,
      coachUid: COACH.uid, coachName: COACH.name,
      type: body.type, title: body.title, term: body.term || '', note: body.note || '',
      fileName: body.fileName, contentType: body.contentType, size: body.size, fileData: body.fileData,
      status: 'submitted', response: '', sharedWithParents: false, sharedAt: null,
      createdAt: new Date().toISOString()
    };
    store.unshift(item);
    return { id: item.id };
  }

  const rec = store.find((r) => r.id === rest[0]);
  if (!rec) err(404, 'NOT_FOUND', 'That file no longer exists.');

  if (method === 'GET' && rest[1] === 'download') return { url: rec.fileData, fileName: rec.fileName };
  if (method === 'DELETE') {
    if (rec.status !== 'submitted') err(409, 'CONFLICT', 'Only files awaiting review can be withdrawn.');
    store = store.filter((r) => r !== rec);
    return { ok: true };
  }
  if (method === 'PATCH') {
    if (!isAdmin) err(403, 'FORBIDDEN', 'Administrator access required.');
    if (body?.status) {
      rec.status = body.status;
      rec.response = body.response || '';
      rec.updatedAt = new Date().toISOString();
      rec.updatedBy = ADMIN;
    }
    if (typeof body?.sharedWithParents === 'boolean') {
      rec.sharedWithParents = body.sharedWithParents;
      rec.sharedAt = body.sharedWithParents ? new Date().toISOString() : null;
    }
    return strip(rec);
  }
  return undefined;
}
