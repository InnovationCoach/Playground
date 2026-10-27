/**
 * The coach's own records about one learner: check-ins, notes, agreed
 * milestones, goals the coach sets for the learner, feedback on evidence,
 * competency judgements, coach-added evidence and parent reports.
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

import { db, collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from '../../../firebase.js';

export const STORE_MODE = 'firestore';
const PREFIX = 'welearn.coachRecords.v1';
export const LIMITS = { text: 1200, title: 140, notes: 300, checkIns: 200, milestones: 120, goals: 40, evidence: 150, reports: 60 };

const keyFor = (coachUid, learnerUid) => `${PREFIX}:${coachUid}:${learnerUid}`;
const str = (v, max = LIMITS.text) => (typeof v === 'string' ? v.slice(0, max) : '');
const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
let seq = 0;
const newId = (p, now) => `${p}-${now.toString(36)}-${(seq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

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

/** Asynchronously load coaching records from Firestore collections matching firestore.rules. */
export async function loadRecordsFromFirestore(coachUid, learnerUid) {
  if (!db || typeof db.collection !== 'function' || !learnerUid) {
    return loadRecords(coachUid, learnerUid);
  }
  try {
    const fetchSubcol = async (colName) => {
      try {
        const snap = await getDocs(collection(db, 'learners', learnerUid, colName));
        const list = [];
        if (snap && snap.forEach) {
          snap.forEach((d) => {
            const data = d.data();
            if (data) list.push({ ...data, id: data.id || d.id });
          });
        }
        return list;
      } catch (err) {
        return [];
      }
    };

    const fetchPrivateNotes = async () => {
      if (!coachUid) return [];
      try {
        const snap = await getDocs(collection(db, 'coachPrivate', coachUid, 'learners', learnerUid, 'notes'));
        const list = [];
        if (snap && snap.forEach) {
          snap.forEach((d) => {
            const data = d.data();
            if (data) list.push({ ...data, id: data.id || d.id, visibility: 'private' });
          });
        }
        return list;
      } catch (err) {
        return [];
      }
    };

    const [checkIns, milestones, goals, feedbackRaw, assessments, evidence, reports, parentNotes, privateNotes] = await Promise.all([
      fetchSubcol('checkIns'),
      fetchSubcol('milestones'),
      fetchSubcol('coachGoals'),
      fetchSubcol('feedback'),
      fetchSubcol('assessments'),
      fetchSubcol('coachEvidence'),
      fetchSubcol('reports'),
      fetchSubcol('parentNotes'),
      fetchPrivateNotes()
    ]);

    const feedback = {};
    for (const fb of feedbackRaw) {
      if (fb.evidenceKey) {
        feedback[fb.evidenceKey] = { text: fb.text || '', at: fb.at || Date.now() };
      }
    }

    const notes = [
      ...privateNotes,
      ...parentNotes.map((pn) => ({ ...pn, visibility: 'parent' }))
    ];

    const records = hydrateRecords({
      version: 1,
      checkIns,
      notes,
      milestones,
      goals,
      feedback,
      assessments,
      evidence,
      reports
    });

    // Cache locally for fast synchronous initial render
    saveRecords(coachUid, learnerUid, records);
    return records;
  } catch (err) {
    console.warn('[coachRecords] Firestore read failed, using cached records:', err);
    return loadRecords(coachUid, learnerUid);
  }
}

/** Save a single record mutation to Firestore matching firestore.rules */
export async function saveRecordToFirestore(coachUid, learnerUid, type, data, action = 'set') {
  if (!db || typeof db.collection !== 'function' || !learnerUid || !coachUid) return;
  try {
    if (type === 'checkIn') {
      await setDoc(doc(db, 'learners', learnerUid, 'checkIns', data.id), { ...data, authorUid: coachUid, updatedAt: Date.now() });
    } else if (type === 'milestone') {
      if (action === 'update') {
        await updateDoc(doc(db, 'learners', learnerUid, 'milestones', data.id), { doneOn: data.doneOn, updatedAt: Date.now() });
      } else {
        await setDoc(doc(db, 'learners', learnerUid, 'milestones', data.id), { ...data, authorUid: coachUid, updatedAt: Date.now() });
      }
    } else if (type === 'goal') {
      if (action === 'update') {
        await updateDoc(doc(db, 'learners', learnerUid, 'coachGoals', data.id), { doneOn: data.doneOn, updatedAt: Date.now() });
      } else {
        await setDoc(doc(db, 'learners', learnerUid, 'coachGoals', data.id), { ...data, authorUid: coachUid, updatedAt: Date.now() });
      }
    } else if (type === 'note') {
      if (action === 'delete') {
        if (data.visibility === 'private') {
          await deleteDoc(doc(db, 'coachPrivate', coachUid, 'learners', learnerUid, 'notes', data.id));
        } else {
          await deleteDoc(doc(db, 'learners', learnerUid, 'parentNotes', data.id));
        }
      } else if (data.visibility === 'private') {
        await setDoc(doc(db, 'coachPrivate', coachUid, 'learners', learnerUid, 'notes', data.id), {
          id: data.id, text: data.text, authorUid: coachUid, at: data.at, updatedAt: Date.now()
        });
      } else {
        await setDoc(doc(db, 'learners', learnerUid, 'parentNotes', data.id), {
          id: data.id, text: data.text, authorUid: coachUid, at: data.at, updatedAt: Date.now()
        });
      }
    } else if (type === 'feedback') {
      await setDoc(doc(db, 'learners', learnerUid, 'feedback', data.evidenceKey), {
        evidenceKey: data.evidenceKey, text: data.text, authorUid: coachUid, at: data.at || Date.now(), updatedAt: Date.now()
      });
    } else if (type === 'assessment') {
      await setDoc(doc(db, 'learners', learnerUid, 'assessments', data.id), { ...data, authorUid: coachUid, updatedAt: Date.now() });
    } else if (type === 'coachEvidence') {
      await setDoc(doc(db, 'learners', learnerUid, 'coachEvidence', data.id), { ...data, authorUid: coachUid, updatedAt: Date.now() });
    } else if (type === 'report') {
      await setDoc(doc(db, 'learners', learnerUid, 'reports', data.id), { ...data, authorUid: coachUid, updatedAt: Date.now() });
    }
  } catch (err) {
    console.warn(`[coachRecords] Firestore write failed for ${type}:`, err);
  }
}

/** Diff two record snapshots and sync changes to Firestore in the background */
export function diffAndSyncToFirestore(coachUid, learnerUid, prev, next) {
  if (!coachUid || !learnerUid) return;
  // Check-ins
  const prevCiIds = new Set(prev.checkIns.map((c) => c.id));
  next.checkIns.filter((c) => !prevCiIds.has(c.id)).forEach((c) => saveRecordToFirestore(coachUid, learnerUid, 'checkIn', c));

  // Milestones
  const prevMsMap = new Map(prev.milestones.map((m) => [m.id, m]));
  for (const m of next.milestones) {
    const old = prevMsMap.get(m.id);
    if (!old) {
      saveRecordToFirestore(coachUid, learnerUid, 'milestone', m, 'set');
    } else if (old.doneOn !== m.doneOn) {
      saveRecordToFirestore(coachUid, learnerUid, 'milestone', m, 'update');
    }
  }

  // Coach Goals
  const prevGoalsMap = new Map(prev.goals.map((g) => [g.id, g]));
  for (const g of next.goals) {
    const old = prevGoalsMap.get(g.id);
    if (!old) {
      saveRecordToFirestore(coachUid, learnerUid, 'goal', g, 'set');
    } else if (old.doneOn !== g.doneOn) {
      saveRecordToFirestore(coachUid, learnerUid, 'goal', g, 'update');
    }
  }

  // Notes
  const nextNoteIds = new Set(next.notes.map((n) => n.id));
  prev.notes.filter((n) => !nextNoteIds.has(n.id)).forEach((n) => saveRecordToFirestore(coachUid, learnerUid, 'note', n, 'delete'));
  const prevNoteIds = new Set(prev.notes.map((n) => n.id));
  next.notes.filter((n) => !prevNoteIds.has(n.id)).forEach((n) => saveRecordToFirestore(coachUid, learnerUid, 'note', n, 'set'));

  // Feedback
  for (const [key, fb] of Object.entries(next.feedback)) {
    if (!prev.feedback[key] || prev.feedback[key].text !== fb.text) {
      saveRecordToFirestore(coachUid, learnerUid, 'feedback', { evidenceKey: key, text: fb.text, at: fb.at });
    }
  }

  // Assessments
  const prevAsmIds = new Set(prev.assessments.map((a) => a.id));
  next.assessments.filter((a) => !prevAsmIds.has(a.id)).forEach((a) => saveRecordToFirestore(coachUid, learnerUid, 'assessment', a));

  // Coach Evidence
  const prevEvIds = new Set(prev.evidence.map((e) => e.id));
  next.evidence.filter((e) => !prevEvIds.has(e.id)).forEach((e) => saveRecordToFirestore(coachUid, learnerUid, 'coachEvidence', e));

  // Reports
  const prevReps = new Map(prev.reports.map((r) => [r.id, r]));
  for (const r of next.reports) {
    const old = prevReps.get(r.id);
    if (!old || old.status !== r.status || old.updatedAt !== r.updatedAt) {
      saveRecordToFirestore(coachUid, learnerUid, 'report', r);
    }
  }
}

/** Check if there are local coaching records on this device for the coach */
export function hasDeviceRecords(coachUid) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(`${PREFIX}:${coachUid}:`)) {
        const raw = window.localStorage.getItem(key);
        if (raw && raw !== '{}') {
          const parsed = JSON.parse(raw);
          const hasData = (parsed.checkIns?.length || parsed.notes?.length || parsed.milestones?.length ||
                           parsed.goals?.length || Object.keys(parsed.feedback || {}).length ||
                           parsed.assessments?.length || parsed.evidence?.length || parsed.reports?.length);
          if (hasData) return true;
        }
      }
    }
  } catch {}
  return false;
}

/** Migrate device localStorage records to Firestore (one-time coach action) */
export async function migrateDeviceRecords(coachUid) {
  if (typeof window === 'undefined' || !window.localStorage || !db || !coachUid) return { count: 0, learnersCount: 0 };
  let count = 0;
  let learnersCount = 0;
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(`${PREFIX}:${coachUid}:`)) keys.push(k);
    }

    for (const key of keys) {
      const parts = key.split(':');
      const learnerUid = parts[2];
      if (!learnerUid) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const records = hydrateRecords(JSON.parse(raw));

      let learnerHasItems = false;
      for (const ci of records.checkIns) {
        await saveRecordToFirestore(coachUid, learnerUid, 'checkIn', ci);
        count++;
        learnerHasItems = true;
      }
      for (const m of records.milestones) {
        await saveRecordToFirestore(coachUid, learnerUid, 'milestone', m);
        count++;
        learnerHasItems = true;
      }
      for (const g of records.goals) {
        await saveRecordToFirestore(coachUid, learnerUid, 'goal', g);
        count++;
        learnerHasItems = true;
      }
      for (const n of records.notes) {
        await saveRecordToFirestore(coachUid, learnerUid, 'note', n);
        count++;
        learnerHasItems = true;
      }
      for (const [k, fb] of Object.entries(records.feedback)) {
        await saveRecordToFirestore(coachUid, learnerUid, 'feedback', { evidenceKey: k, text: fb.text, at: fb.at });
        count++;
        learnerHasItems = true;
      }
      for (const a of records.assessments) {
        await saveRecordToFirestore(coachUid, learnerUid, 'assessment', a);
        count++;
        learnerHasItems = true;
      }
      for (const ev of records.evidence) {
        await saveRecordToFirestore(coachUid, learnerUid, 'coachEvidence', ev);
        count++;
        learnerHasItems = true;
      }
      for (const rp of records.reports) {
        await saveRecordToFirestore(coachUid, learnerUid, 'report', rp);
        count++;
        learnerHasItems = true;
      }

      if (learnerHasItems) {
        learnersCount++;
        window.localStorage.removeItem(key);
      }
    }
    window.dispatchEvent(new CustomEvent('welearn-coach-records', { detail: { coachUid } }));
  } catch (err) {
    console.error('[coachRecords] Migration error:', err);
  }
  return { count, learnersCount };
}

/** Records for one learner, kept in step with saves from other tabs, screens, and Firestore. */
export function useCoachRecords(coachUid, learnerUid) {
  const [records, setRecords] = useState(() => (coachUid && learnerUid ? loadRecords(coachUid, learnerUid) : emptyRecords()));
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (!coachUid || !learnerUid) return undefined;
    let active = true;

    // Load from Firestore asynchronously to get latest cloud state
    loadRecordsFromFirestore(coachUid, learnerUid).then((fsRecords) => {
      if (active && fsRecords) {
        setRecords(fsRecords);
      }
    });

    const reload = (e) => {
      if (e.type === 'storage' && e.key !== keyFor(coachUid, learnerUid)) return;
      if (e.type !== 'storage' && (e.detail?.learnerUid && e.detail.learnerUid !== learnerUid)) return;
      loadRecordsFromFirestore(coachUid, learnerUid).then((fsRecords) => {
        if (active && fsRecords) setRecords(fsRecords);
      });
    };
    window.addEventListener('storage', reload);
    window.addEventListener('welearn-coach-records', reload);
    return () => {
      active = false;
      window.removeEventListener('storage', reload);
      window.removeEventListener('welearn-coach-records', reload);
    };
  }, [coachUid, learnerUid]);

  /** Apply a pure change. Returns { ok } or { error } (validation or storage). */
  const update = useCallback((change) => {
    const current = records;
    const result = change(current);
    if (result?.error) return { error: result.error };
    const next = result?.records || result;

    if (!saveRecords(coachUid, learnerUid, next)) {
      setSaveError(true);
      return { error: 'storage' };
    }
    setSaveError(false);
    setRecords(next);

    // Sync mutations to Firestore in the background
    diffAndSyncToFirestore(coachUid, learnerUid, current, next);

    return { ok: true, ...(result?.id ? { id: result.id } : {}) };
  }, [coachUid, learnerUid, records]);

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
