/**
 * The coach's own records about one learner: check-ins, notes, agreed
 * milestones, feedback on evidence, competency judgements, coach-added
 * evidence and parent reports.
 *
 * WHERE THEY LIVE (read before changing): on this device only, in
 * localStorage, keyed by coach uid and learner uid. No Firestore collection
 * holds coach-only records yet, and the rules are the backend owner's to write
 * (docs/COACH-MY-LEARNERS-CONTRACT-FOR-GEMINI.md). The screens say so. When the
 * backend lands, `loadRecords` and `saveRecords` are the only functions that
 * change; everything else works on the plain object.
 *
 * Every mutator is pure (record in, record out) and validates its input, so
 * the same functions can sit in front of Firestore later.
 */
import { useCallback, useEffect, useState } from 'react';
import { safeLink } from '../../pbl/engine/pblProject.js';
import { competencyById } from '../../pbl/content/competencies.js';
import { LEVELS, EVIDENCE_KIND_IDS } from './myLearnersModel.js';

export const STORE_MODE = 'device';
const PREFIX = 'welearn.coachRecords.v1';
export const LIMITS = { text: 1200, title: 140, notes: 300, checkIns: 200, milestones: 120, evidence: 150, reports: 60 };

const keyFor = (coachUid, learnerUid) => `${PREFIX}:${coachUid}:${learnerUid}`;
const str = (v, max = LIMITS.text) => (typeof v === 'string' ? v.slice(0, max) : '');
const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
let seq = 0;
const newId = (p, now) => `${p}-${now.toString(36)}-${(seq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export function emptyRecords() {
  return { version: 1, checkIns: [], notes: [], milestones: [], feedback: {}, assessments: [], evidence: [], reports: [] };
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
    feedback: stored.feedback && typeof stored.feedback === 'object' && !Array.isArray(stored.feedback) ? stored.feedback : {},
    assessments: arr(stored.assessments),
    evidence: arr(stored.evidence),
    reports: arr(stored.reports)
  };
}

export function loadRecords(coachUid, learnerUid) {
  try {
    const raw = window.localStorage.getItem(keyFor(coachUid, learnerUid));
    return hydrateRecords(raw ? JSON.parse(raw) : null);
  } catch {
    return emptyRecords();
  }
}

/** Returns true when saved. A full or blocked storage returns false, and the screen says so. */
export function saveRecords(coachUid, learnerUid, records) {
  try {
    window.localStorage.setItem(keyFor(coachUid, learnerUid), JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('welearn-coach-records', { detail: { coachUid, learnerUid } }));
    return true;
  } catch {
    return false;
  }
}

/** Records for one learner, kept in step with saves from other tabs and screens. */
export function useCoachRecords(coachUid, learnerUid) {
  const [records, setRecords] = useState(() => (coachUid && learnerUid ? loadRecords(coachUid, learnerUid) : emptyRecords()));
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (!coachUid || !learnerUid) return undefined;
    setRecords(loadRecords(coachUid, learnerUid));
    const reload = (e) => {
      if (e.type === 'storage' && e.key !== keyFor(coachUid, learnerUid)) return;
      if (e.type !== 'storage' && (e.detail?.learnerUid !== learnerUid || e.detail?.coachUid !== coachUid)) return;
      setRecords(loadRecords(coachUid, learnerUid));
    };
    window.addEventListener('storage', reload);
    window.addEventListener('welearn-coach-records', reload);
    return () => {
      window.removeEventListener('storage', reload);
      window.removeEventListener('welearn-coach-records', reload);
    };
  }, [coachUid, learnerUid]);

  /** Apply a pure change. Returns { ok } or { error } (validation or storage). */
  const update = useCallback((change) => {
    const current = loadRecords(coachUid, learnerUid);
    const result = change(current);
    if (result?.error) return { error: result.error };
    const next = result?.records || result;
    if (!saveRecords(coachUid, learnerUid, next)) { setSaveError(true); return { error: 'storage' }; }
    setSaveError(false);
    setRecords(next);
    return { ok: true, ...(result?.id ? { id: result.id } : {}) };
  }, [coachUid, learnerUid]);

  return { records, update, saveError };
}

/** All learners' records for one coach, read once for the home table. */
export function loadAllRecords(coachUid, learnerUids) {
  return Object.fromEntries(learnerUids.map((uid) => [uid, loadRecords(coachUid, uid)]));
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

/** Save a report draft (new or existing). Editing an approved report turns it back into a draft. */
export function saveReport(records, report, now = Date.now()) {
  const id = report.id || newId('rp', now);
  const prev = records.reports.find((r) => r.id === id);
  const next = { ...report, id, status: 'draft', approvedAt: null, createdAt: prev?.createdAt || now, updatedAt: now };
  const reports = prev ? records.reports.map((r) => (r.id === id ? next : r)) : [next, ...records.reports].slice(0, LIMITS.reports);
  return { records: { ...records, reports }, id };
}

export function approveReport(records, id, now = Date.now()) {
  const r = records.reports.find((x) => x.id === id);
  if (!r) return { error: 'reportMissing' };
  return { records: { ...records, reports: records.reports.map((x) => (x.id === id ? { ...x, status: 'approved', approvedAt: now } : x)) }, id };
}
