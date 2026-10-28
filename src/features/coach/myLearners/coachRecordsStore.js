/**
 * The coach's own records about one learner: check-ins, notes, agreed
 * milestones, goals the coach sets for the learner, feedback on evidence,
 * competency judgements, coach-added evidence and parent reports.
 *
 * WHERE THEY LIVE (read before changing): in Firestore, under the rules the
 * backend owner writes (docs/COACH-MY-LEARNERS-CONTRACT-FOR-GEMINI.md):
 *   learners/{learnerUid}/{checkIns|milestones|coachGoals|feedback|assessments|coachEvidence|parentNotes|reports}/{id}
 *   coachPrivate/{coachUid}/learners/{learnerUid}/notes/{id}   (the author only)
 * Nothing is kept on the device. Records read in this tab are held in memory
 * so the home table and the profile agree; a reload reads them again. Older
 * builds saved records in localStorage: `migrateDeviceRecords` moves them and
 * clears each learner's copy only after every write for that learner succeeded.
 *
 * Every mutator is pure (record in, record out) and validates its input.
 * `planWrites` turns one change into the Firestore writes it needs, in order;
 * a write that fails is reported to the screen and the records are read again.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { safeLink } from '../../pbl/engine/pblProject.js';
import { competencyById } from '../../pbl/content/competencies.js';
import { LEVELS, EVIDENCE_KIND_IDS } from './myLearnersModel.js';
import {
  db, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, deleteField, timestampFromMillis
} from '../../../firebase.js';

export const LIMITS = { text: 1200, title: 140, notes: 300, checkIns: 200, milestones: 120, goals: 40, evidence: 150, reports: 60 };
/** Private notes and unapproved report drafts are deleted this long after their last change (Q4, Mani 2026-10-26). */
export const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Markers `planWrites` uses for values only Firestore can supply; `runWrites` resolves them. */
export const SERVER_TIME = '__serverTime__';
export const REMOVE = '__removeField__';
export const RECORDS_EVENT = 'welearn-coach-records';

const LEGACY_PREFIX = 'welearn.coachRecords.v1';
const legacyKey = (coachUid, learnerUid) => `${LEGACY_PREFIX}:${coachUid}:${learnerUid}`;
const str = (v, max = LIMITS.text) => (typeof v === 'string' ? v.slice(0, max) : '');
const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
let seq = 0;
const newId = (p, now) => `${p}-${now.toString(36)}-${(seq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const hasDb = () => Boolean(db && typeof db.collection === 'function');

export function emptyRecords() {
  return { version: 1, checkIns: [], notes: [], milestones: [], goals: [], feedback: {}, assessments: [], evidence: [], reports: [] };
}

/** Whatever came back from storage, return well-formed records. */
export function hydrateRecords(stored) {
  const base = emptyRecords();
  if (!stored || typeof stored !== 'object') return base;
  const arr = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object' && x.id) : []);
  return {
    ...base,
    checkIns: arr(stored.checkIns),
    notes: arr(stored.notes).filter((n) => n.visibility === 'private' || n.visibility === 'parent'),
    milestones: arr(stored.milestones),
    goals: arr(stored.goals).filter((g) => typeof g.text === 'string' && g.text.trim()),
    feedback: stored.feedback && typeof stored.feedback === 'object' && !Array.isArray(stored.feedback) ? stored.feedback : {},
    assessments: arr(stored.assessments),
    evidence: arr(stored.evidence),
    reports: arr(stored.reports)
  };
}

// ---------------------------------------------------------------------------
// Firestore layout
// ---------------------------------------------------------------------------

const SHARED = {
  checkIns: 'checkIns', milestones: 'milestones', goals: 'coachGoals', feedback: 'feedback',
  assessments: 'assessments', evidence: 'coachEvidence', reports: 'reports', parentNotes: 'parentNotes'
};
const sharedPath = (learnerUid, part, id) => ['learners', learnerUid, SHARED[part], id];
const privateNotePath = (coachUid, learnerUid, id) => ['coachPrivate', coachUid, 'learners', learnerUid, 'notes', id];
const notePath = (coachUid, learnerUid, n) => (n.visibility === 'private' ? privateNotePath(coachUid, learnerUid, n.id) : sharedPath(learnerUid, 'parentNotes', n.id));
/** Evidence keys become document ids; a slash would start a new path segment. */
export const feedbackDocId = (key) => String(key).replace(/\//g, '_');

/** What the home table needs; the profile reads everything. */
const HOME_PARTS = ['checkIns', 'milestones', 'feedback', 'assessments', 'evidence'];
const ALL_PARTS = [...HOME_PARTS, 'goals', 'reports', 'parentNotes', 'privateNotes'];

const millis = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : v);
const byNewest = (k = 'at') => (a, b) => (b[k] || 0) - (a[k] || 0);
const byOldest = (a, b) => (a.at || 0) - (b.at || 0);

/** Firestore documents back into the shapes the mutators write (timestamps as milliseconds). */
export function recordsFromDocs(parts) {
  const conv = (list = []) => list.map((d) => ({ ...d, approvedAt: millis(d.approvedAt) ?? null, expireAt: millis(d.expireAt) ?? undefined }))
    .map(({ expireAt, ...d }) => (expireAt === undefined ? d : { ...d, expireAt }));
  const feedback = {};
  for (const fb of parts.feedback || []) {
    if (fb.evidenceKey) feedback[fb.evidenceKey] = { text: fb.text || '', at: fb.at || null, authorUid: fb.authorUid || null };
  }
  const notes = [
    ...conv(parts.privateNotes).map((n) => ({ ...n, visibility: 'private' })),
    ...conv(parts.parentNotes).map((n) => ({ ...n, visibility: 'parent' }))
  ].sort(byNewest());
  const strip = (list) => conv(list).map(({ approvedAt, ...d }) => d);
  return hydrateRecords({
    checkIns: strip(parts.checkIns).sort(byNewest()),
    milestones: strip(parts.milestones).sort(byOldest),
    goals: strip(parts.goals).sort(byOldest),
    feedback,
    assessments: strip(parts.assessments).sort(byNewest()),
    evidence: strip(parts.evidence).sort(byNewest()),
    reports: conv(parts.reports).sort(byNewest('updatedAt')),
    notes
  });
}

async function readCollection(ref) {
  const snap = await getDocs(ref);
  const list = [];
  snap.forEach((d) => list.push({ ...(d.data() || {}), id: d.id }));
  return list;
}

/** Reads the given parts. `failed` is true when any part could not be read, so the screen can say so. */
async function fetchRecords(coachUid, learnerUid, parts) {
  if (!hasDb()) return { records: emptyRecords(), failed: true };
  const read = (part) => (part === 'privateNotes'
    ? readCollection(collection(db, 'coachPrivate', coachUid, 'learners', learnerUid, 'notes'))
    : readCollection(collection(db, 'learners', learnerUid, SHARED[part])));
  const results = await Promise.allSettled(parts.map(read));
  const got = {};
  let failed = false;
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') got[parts[i]] = r.value;
    else { failed = true; console.warn(`[coachRecords] could not read ${parts[i]} for ${learnerUid}:`, r.reason?.code || r.reason); }
  });
  return { records: recordsFromDocs(got), got, failed };
}

// ---------------------------------------------------------------------------
// This tab's copy (memory only, never written to the device)
// ---------------------------------------------------------------------------

const memo = new Map(); // `${coachUid}:${learnerUid}` -> { records, full }
const memoKey = (coachUid, learnerUid) => `${coachUid}:${learnerUid}`;

function remember(coachUid, learnerUid, records, full) {
  const k = memoKey(coachUid, learnerUid);
  memo.set(k, { records, full: full || Boolean(memo.get(k)?.full) });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(RECORDS_EVENT, { detail: { coachUid, learnerUid } }));
}

export function cachedRecords(coachUid, learnerUid) {
  return memo.get(memoKey(coachUid, learnerUid))?.records || emptyRecords();
}

/** All learners' records for one coach, as far as this tab has read them. */
export function loadAllRecords(coachUid, learnerUids) {
  return Object.fromEntries(learnerUids.map((uid) => [uid, cachedRecords(coachUid, uid)]));
}

/**
 * Reads what the home table needs for every learner not already read in full,
 * a few learners at a time. Resolves to the number of learners whose records
 * could not all be read.
 */
export async function fetchAllRecords(coachUid, learnerUids, { concurrency = 6, force = false } = {}) {
  if (!coachUid) return 0;
  if (!hasDb()) return learnerUids.length;
  if (force) learnerUids.forEach((uid) => memo.delete(memoKey(coachUid, uid)));
  const todo = learnerUids.filter((uid) => !memo.get(memoKey(coachUid, uid))?.full);
  let failedCount = 0;
  for (let i = 0; i < todo.length; i += concurrency) {
    await Promise.all(todo.slice(i, i + concurrency).map(async (uid) => {
      const { records, failed } = await fetchRecords(coachUid, uid, HOME_PARTS);
      if (failed) failedCount += 1;
      if (memo.get(memoKey(coachUid, uid))?.full) return; // the profile read it meanwhile
      const base = cachedRecords(coachUid, uid);
      remember(coachUid, uid, { ...base, ...Object.fromEntries(['checkIns', 'milestones', 'feedback', 'assessments', 'evidence'].map((k) => [k, records[k]])) }, false);
    }));
  }
  return failedCount;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * The Firestore writes that turn `prev` into `next`, in the order they must
 * run. Pure, so it is tested without Firestore. Each write is
 * { op: 'set' | 'update' | 'delete', path: [...], data }.
 *
 * Rules this follows (contract M4b, M11, M12, Q4):
 *  - every document carries the author's uid;
 *  - private notes and report drafts carry `expireAt`, 30 days after their last change;
 *  - approving a report is its own write: remove `expireAt` while it is a draft,
 *    then set status and a server-time `approvedAt`;
 *  - an approved report is never rewritten (`saveReport` makes a new draft).
 */
export function planWrites(coachUid, learnerUid, prev, next, now = Date.now()) {
  const writes = [];
  const stamp = (data) => ({ ...data, authorUid: coachUid, updatedAt: now });
  const expireAt = now + RETENTION_DAYS * DAY_MS;
  const set = (path, data) => writes.push({ op: 'set', path, data });
  const upd = (path, data) => writes.push({ op: 'update', path, data });
  const added = (part) => { const had = new Set(prev[part].map((x) => x.id)); return next[part].filter((x) => !had.has(x.id)); };

  for (const c of added('checkIns')) set(sharedPath(learnerUid, 'checkIns', c.id), stamp(c));

  for (const part of ['milestones', 'goals']) {
    const old = new Map(prev[part].map((x) => [x.id, x]));
    for (const x of next[part]) {
      const o = old.get(x.id);
      if (!o) set(sharedPath(learnerUid, part, x.id), stamp(x));
      else if (o.doneOn !== x.doneOn) upd(sharedPath(learnerUid, part, x.id), { doneOn: x.doneOn ?? null, updatedAt: now });
    }
  }

  const kept = new Set(next.notes.map((n) => n.id));
  for (const n of prev.notes.filter((x) => !kept.has(x.id))) writes.push({ op: 'delete', path: notePath(coachUid, learnerUid, n) });
  for (const n of added('notes')) {
    const data = { id: n.id, text: n.text, at: n.at };
    set(notePath(coachUid, learnerUid, n), stamp(n.visibility === 'private' ? { ...data, expireAt } : data));
  }

  for (const [key, fb] of Object.entries(next.feedback)) {
    if (prev.feedback[key]?.text === fb.text) continue;
    set(sharedPath(learnerUid, 'feedback', feedbackDocId(key)), stamp({ evidenceKey: key, text: fb.text, at: fb.at || now }));
  }

  for (const a of added('assessments')) set(sharedPath(learnerUid, 'assessments', a.id), stamp(a));
  for (const e of added('evidence')) set(sharedPath(learnerUid, 'evidence', e.id), stamp(e));

  const oldReports = new Map(prev.reports.map((r) => [r.id, r]));
  for (const r of next.reports) {
    const o = oldReports.get(r.id);
    const path = sharedPath(learnerUid, 'reports', r.id);
    const { approvedAt, expireAt: _ignored, ...body } = r;
    const draftChanged = !o || (o.status !== 'approved' && o.updatedAt !== r.updatedAt);
    if (draftChanged) set(path, stamp({ ...body, status: 'draft', approvedAt: null, expireAt }));
    if (r.status === 'approved' && o?.status !== 'approved') {
      upd(path, { expireAt: REMOVE, updatedAt: now });
      upd(path, { status: 'approved', approvedAt: SERVER_TIME, updatedAt: now });
    }
  }
  return writes;
}

/** Plain data Firestore accepts: no `undefined`, markers resolved, `expireAt` as a timestamp. */
function resolve(data) {
  const out = {};
  for (const [k, v] of Object.entries(data || {})) {
    if (v === undefined) continue;
    if (v === SERVER_TIME) out[k] = serverTimestamp();
    else if (v === REMOVE) out[k] = deleteField();
    else if (k === 'expireAt' && typeof v === 'number') out[k] = timestampFromMillis(v);
    else if (v && typeof v === 'object') out[k] = JSON.parse(JSON.stringify(v));
    else out[k] = v;
  }
  return out;
}

/** Runs the writes one after another and stops at the first that fails (it throws). */
export async function runWrites(writes) {
  if (!writes.length) return;
  if (!hasDb()) throw new Error('no-database');
  for (const w of writes) {
    const ref = doc(db, ...w.path);
    if (w.op === 'set') await setDoc(ref, resolve(w.data));
    else if (w.op === 'update') await updateDoc(ref, resolve(w.data));
    else await deleteDoc(ref);
  }
}

// ---------------------------------------------------------------------------
// Records saved on this device by older builds
// ---------------------------------------------------------------------------

const legacyKeysFor = (coachUid) => {
  const keys = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(`${LEGACY_PREFIX}:${coachUid}:`)) keys.push(k);
    }
  } catch { /* storage blocked: nothing to move */ }
  return keys;
};
const readLegacy = (key) => {
  try { return hydrateRecords(JSON.parse(window.localStorage.getItem(key) || 'null')); } catch { return emptyRecords(); }
};
export const countRecords = (r) => r.checkIns.length + r.notes.length + r.milestones.length + r.goals.length
  + Object.keys(r.feedback).length + r.assessments.length + r.evidence.length + r.reports.length;

/** True when an older build left records for this coach on this device. */
export function hasDeviceRecords(coachUid) {
  if (!coachUid || typeof window === 'undefined') return false;
  return legacyKeysFor(coachUid).some((k) => countRecords(readLegacy(k)) > 0);
}

/**
 * Moves this coach's device records to Firestore, one learner at a time. A
 * learner's device copy is removed only after all of that learner's writes
 * succeeded; otherwise it stays and is counted in `failedLearners`.
 */
export async function migrateDeviceRecords(coachUid) {
  const result = { moved: 0, learners: 0, failedLearners: 0 };
  if (!coachUid || typeof window === 'undefined') return result;
  if (!hasDb()) return { ...result, failedLearners: legacyKeysFor(coachUid).length };
  for (const key of legacyKeysFor(coachUid)) {
    const learnerUid = key.slice(`${LEGACY_PREFIX}:${coachUid}:`.length);
    const records = readLegacy(key);
    const n = countRecords(records);
    try {
      if (learnerUid && n) await runWrites(planWrites(coachUid, learnerUid, emptyRecords(), records));
      window.localStorage.removeItem(key);
      memo.delete(memoKey(coachUid, learnerUid));
      if (n) { result.moved += n; result.learners += 1; }
    } catch (err) {
      console.warn(`[coachRecords] could not move device records for ${learnerUid}:`, err?.code || err);
      result.failedLearners += 1;
    }
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(RECORDS_EVENT, { detail: { coachUid } }));
  return result;
}

// ---------------------------------------------------------------------------
// The hook the screens use
// ---------------------------------------------------------------------------

/**
 * Records for one learner. `update(change)` applies a pure change at once and
 * resolves to { ok, id? } when Firestore has it, or { error } (a validation
 * code, or 'save' when Firestore refused it; the records are then read again,
 * so the screen shows what is really saved). Changes are written in order.
 */
export function useCoachRecords(coachUid, learnerUid) {
  const [records, setRecords] = useState(() => cachedRecords(coachUid, learnerUid));
  const [loadState, setLoadState] = useState('loading');
  const [saveError, setSaveError] = useState(false);
  const current = useRef(records);
  const queue = useRef(Promise.resolve());
  const reading = useRef(0);

  const show = useCallback((next, full) => {
    current.current = next;
    setRecords(next);
    remember(coachUid, learnerUid, next, full);
  }, [coachUid, learnerUid]);

  const refresh = useCallback(async () => {
    const ticket = ++reading.current;
    const { records: fresh, failed } = await fetchRecords(coachUid, learnerUid, ALL_PARTS);
    if (ticket !== reading.current) return;
    show(fresh, !failed);
    setLoadState(failed ? 'failed' : 'ready');
  }, [coachUid, learnerUid, show]);

  useEffect(() => {
    if (!coachUid || !learnerUid) return undefined;
    const start = cachedRecords(coachUid, learnerUid);
    current.current = start;
    setRecords(start);
    setLoadState('loading');
    refresh();
    return () => { reading.current += 1; };
  }, [coachUid, learnerUid, refresh]);

  const update = useCallback((change) => {
    const prev = current.current;
    const result = change(prev);
    if (result?.error) return Promise.resolve({ error: result.error });
    const next = result?.records || result;
    const writes = planWrites(coachUid, learnerUid, prev, next);
    show(next);
    const job = queue.current.then(() => runWrites(writes));
    queue.current = job.catch(() => {});
    return job.then(
      () => { setSaveError(false); return { ok: true, ...(result?.id ? { id: result.id } : {}) }; },
      async (err) => {
        console.warn('[coachRecords] save failed:', err?.code || err);
        setSaveError(true);
        await refresh();
        return { error: 'save' };
      }
    );
  }, [coachUid, learnerUid, show, refresh]);

  return { records, update, saveError, loadState };
}

// ---------------------------------------------------------------------------
// Mutators: (records, input, now) -> { records } | { error }
// Errors are codes the screen translates.
// ---------------------------------------------------------------------------

/**
 * A check-in. Its next agreed action can also become an agreed milestone due
 * on the follow-up date, so the coach never types it twice.
 */
export function addCheckIn(records, input, now = Date.now()) {
  const strength = str(input.strength).trim();
  const challenge = str(input.challenge).trim();
  const nextAction = str(input.nextAction).trim();
  if (!strength && !challenge && !nextAction) return { error: 'checkInEmpty' };
  if (!nextAction) return { error: 'nextActionRequired' };
  if (!isDay(input.followUpOn)) return { error: 'followUpRequired' };
  const id = newId('ci', now);
  const checkIn = { id, at: now, strength, challenge, nextAction, followUpOn: input.followUpOn, shareWithParent: input.shareWithParent === true };
  let milestones = records.milestones;
  if (input.asMilestone) {
    milestones = [...milestones, { id: newId('ms', now), title: nextAction.slice(0, LIMITS.title), dueOn: input.followUpOn, doneOn: null, fromCheckIn: id, at: now }];
  }
  return { records: { ...records, checkIns: [checkIn, ...records.checkIns].slice(0, LIMITS.checkIns), milestones }, id };
}

export function addNote(records, { text, visibility }, now = Date.now()) {
  const t = str(text).trim();
  if (!t) return { error: 'noteEmpty' };
  if (visibility !== 'private' && visibility !== 'parent') return { error: 'noteVisibility' };
  const note = { id: newId('nt', now), at: now, text: t, visibility };
  return { records: { ...records, notes: [note, ...records.notes].slice(0, LIMITS.notes) }, id: note.id };
}

export function removeNote(records, id) {
  return { records: { ...records, notes: records.notes.filter((n) => n.id !== id) } };
}

export function addMilestone(records, { title, dueOn }, now = Date.now()) {
  const t = str(title, LIMITS.title).trim();
  if (!t) return { error: 'milestoneTitle' };
  if (!isDay(dueOn)) return { error: 'milestoneDate' };
  const m = { id: newId('ms', now), title: t, dueOn, doneOn: null, at: now };
  return { records: { ...records, milestones: [...records.milestones, m].slice(-LIMITS.milestones) }, id: m.id };
}

export function setMilestoneDone(records, id, doneOn) {
  return { records: { ...records, milestones: records.milestones.map((m) => (m.id === id ? { ...m, doneOn: isDay(doneOn) ? doneOn : null } : m)) } };
}

/**
 * A learning goal the coach sets for the learner. Decided 2026-10-26: learners
 * will see these (and coaches see the learner's own goals) once the backend
 * stores them; on this device they are the coach's only.
 */
export function addGoal(records, { text, dueOn }, now = Date.now()) {
  const t = str(text, LIMITS.title).trim();
  if (!t) return { error: 'goalText' };
  if (dueOn && !isDay(dueOn)) return { error: 'milestoneDate' };
  const g = { id: newId('gl', now), text: t, dueOn: dueOn || null, doneOn: null, at: now };
  return { records: { ...records, goals: [...records.goals, g].slice(-LIMITS.goals) }, id: g.id };
}

export function setGoalDone(records, id, doneOn) {
  return { records: { ...records, goals: records.goals.map((g) => (g.id === id ? { ...g, doneOn: isDay(doneOn) ? doneOn : null } : g)) } };
}

export function setFeedback(records, evidenceKey, text, now = Date.now()) {
  const t = str(text).trim();
  if (!t) return { error: 'feedbackEmpty' };
  return { records: { ...records, feedback: { ...records.feedback, [evidenceKey]: { text: t, at: now } } } };
}

/** A coach judgement on one competency, from one or more pieces of evidence. */
export function addAssessment(records, { competencyId, level, evidenceKeys = [], note = '' }, now = Date.now()) {
  if (!competencyById(competencyId)) return { error: 'competencyRequired' };
  if (!LEVELS.includes(level)) return { error: 'levelRequired' };
  const keys = [...new Set(evidenceKeys.filter((k) => typeof k === 'string'))];
  if (level !== 'insufficient' && !keys.length) return { error: 'evidenceRequired' };
  const a = { id: newId('as', now), at: now, competencyId, level, evidenceKeys: keys, note: str(note).trim() };
  return { records: { ...records, assessments: [a, ...records.assessments] }, id: a.id };
}

/** Evidence the coach adds: an observation, a photo or video link, a document link. */
export function addCoachEvidence(records, input, now = Date.now()) {
  const title = str(input.title, LIMITS.title).trim();
  if (!title) return { error: 'evidenceTitle' };
  const link = input.link ? safeLink(input.link) : '';
  if (input.link && !link) return { error: 'evidenceLink' };
  const kind = EVIDENCE_KIND_IDS.includes(input.kind) ? input.kind : 'note';
  if (kind !== 'note' && !link) return { error: 'evidenceLinkRequired' };
  const e = { id: newId('ev', now), at: now, kind, title, body: str(input.body).trim(), link, phase: input.phase || null, project: input.project || 'term' };
  return { records: { ...records, evidence: [e, ...records.evidence].slice(0, LIMITS.evidence) }, id: e.id };
}

/**
 * Save a report draft (new or existing). Editing an approved report makes a
 * new draft that points back to it, so what a parent saw is never rewritten (M12).
 */
export function saveReport(records, report, now = Date.now()) {
  const found = report.id ? records.reports.find((r) => r.id === report.id) : null;
  const prev = found?.status === 'approved' ? null : found;
  const id = prev ? prev.id : newId('rp', now);
  const basedOn = found?.status === 'approved' ? found.id : (prev?.basedOn || null);
  const next = { ...report, id, basedOn, status: 'draft', approvedAt: null, createdAt: prev?.createdAt || now, updatedAt: now };
  const reports = prev ? records.reports.map((r) => (r.id === id ? next : r)) : [next, ...records.reports].slice(0, LIMITS.reports);
  return { records: { ...records, reports }, id };
}

export function approveReport(records, id, now = Date.now()) {
  const r = records.reports.find((x) => x.id === id);
  if (!r) return { error: 'reportMissing' };
  return { records: { ...records, reports: records.reports.map((x) => (x.id === id ? { ...x, status: 'approved', approvedAt: now } : x)) }, id };
}
