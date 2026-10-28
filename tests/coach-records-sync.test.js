/**
 * My Learners coach records in Firestore: the writes each change makes, that
 * those writes pass the coach-records rules, and that moving records saved on a
 * device by older builds never loses them.
 * src/features/coach/myLearners/coachRecordsStore.js
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import fs from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, deleteField, Timestamp } from 'firebase/firestore';

// The store talks to Firestore through src/firebase.js; here that is a fake whose writes can be made to fail.
const fake = vi.hoisted(() => ({ writes: [], failFor: null }));
vi.mock('../src/firebase.js', () => {
  const write = (op) => async (ref, data) => {
    if (fake.failFor && ref.path.includes(fake.failFor)) throw Object.assign(new Error('denied'), { code: 'permission-denied' });
    fake.writes.push({ op, path: ref.path, data });
  };
  return {
    db: { collection: () => ({}) },
    doc: (_db, ...path) => ({ path: path.join('/') }),
    collection: (_db, ...path) => ({ path: path.join('/') }),
    getDocs: async () => ({ forEach() {} }),
    setDoc: write('set'),
    updateDoc: write('update'),
    deleteDoc: write('delete'),
    serverTimestamp: () => 'SERVER_TIME',
    deleteField: () => 'DELETE_FIELD',
    timestampFromMillis: (ms) => ({ ms })
  };
});

const {
  emptyRecords, planWrites, recordsFromDocs, feedbackDocId, migrateDeviceRecords, hasDeviceRecords, RETENTION_DAYS, SERVER_TIME, REMOVE,
  addCheckIn, addNote, removeNote, addMilestone, setMilestoneDone, setFeedback, addAssessment, addCoachEvidence, saveReport, approveReport
} = await import('../src/features/coach/myLearners/coachRecordsStore.js');
const { defaultMilestones, newStage } = await import('../src/features/courses/maker/CourseOutlineStep.jsx');

const NOW = new Date('2026-10-28T09:00:00Z').getTime();
const DAY = 24 * 60 * 60 * 1000;
const apply = (records, change) => change(records).records;
const paths = (writes) => writes.map((w) => `${w.op} ${w.path.join('/')}`);

describe('planWrites: one change, the writes it needs', () => {
  it('stamps every new record with its author and time', () => {
    const next = apply(emptyRecords(), (r) => addCheckIn(r, { strength: 'Clear plan', nextAction: 'Test the sensor', followUpOn: '2026-11-04', asMilestone: true }, NOW));
    const writes = planWrites('coach_a', 'student_a', emptyRecords(), next, NOW);
    expect(paths(writes)).toEqual([
      `set learners/student_a/checkIns/${next.checkIns[0].id}`,
      `set learners/student_a/milestones/${next.milestones[0].id}`
    ]);
    for (const w of writes) expect(w.data).toMatchObject({ authorUid: 'coach_a', updatedAt: NOW });
  });

  it('marks a milestone done with an update of doneOn only, so a co-coach may do it', () => {
    const one = apply(emptyRecords(), (r) => addMilestone(r, { title: 'Prototype', dueOn: '2026-11-01' }, NOW));
    const done = apply(one, (r) => setMilestoneDone(r, one.milestones[0].id, '2026-10-28'));
    expect(planWrites('coach_a2', 'student_a', one, done, NOW)).toEqual([
      { op: 'update', path: ['learners', 'student_a', 'milestones', one.milestones[0].id], data: { doneOn: '2026-10-28', updatedAt: NOW } }
    ]);
  });

  it('keeps private notes under the author and gives them a 30-day expiry; parent notes have none', () => {
    let r = apply(emptyRecords(), (x) => addNote(x, { text: 'Struggled today', visibility: 'private' }, NOW));
    r = apply(r, (x) => addNote(x, { text: 'Practise at home', visibility: 'parent' }, NOW));
    const writes = planWrites('coach_a', 'student_a', emptyRecords(), r, NOW);
    const priv = writes.find((w) => w.path[0] === 'coachPrivate');
    const parent = writes.find((w) => w.path.includes('parentNotes'));
    expect(priv.path.slice(0, 4)).toEqual(['coachPrivate', 'coach_a', 'learners', 'student_a']);
    expect(priv.data.expireAt).toBe(NOW + RETENTION_DAYS * DAY);
    expect(priv.data).not.toHaveProperty('visibility');
    expect(parent.data).not.toHaveProperty('expireAt');
    const removed = apply(r, (x) => removeNote(x, priv.data.id));
    expect(paths(planWrites('coach_a', 'student_a', r, removed, NOW))).toEqual([`delete coachPrivate/coach_a/learners/student_a/notes/${priv.data.id}`]);
  });

  it('writes feedback only when its text changes, under a document id without slashes', () => {
    const key = 'phase:u1_prog/x:empathize';
    const one = apply(emptyRecords(), (r) => setFeedback(r, key, 'Good interviews', NOW));
    expect(paths(planWrites('coach_a', 'student_a', emptyRecords(), one, NOW))).toEqual(['set learners/student_a/feedback/phase:u1_prog_x:empathize']);
    expect(planWrites('coach_a', 'student_a', one, one, NOW)).toEqual([]);
    expect(feedbackDocId('a/b/c')).toBe('a_b_c');
  });

  it('writes judgements and coach evidence once, when they are added', () => {
    let r = apply(emptyRecords(), (x) => addCoachEvidence(x, { kind: 'note', title: 'Observed pitch' }, NOW));
    r = apply(r, (x) => addAssessment(x, { competencyId: 'ctps-01', level: 'insufficient' }, NOW));
    expect(paths(planWrites('coach_a', 'student_a', emptyRecords(), r, NOW)).map((p) => p.split('/')[2])).toEqual(['assessments', 'coachEvidence']);
  });
});

describe('parent reports (M11, M12, Q4)', () => {
  const report = { period: { from: '2026-10-01', to: '2026-10-28' }, text: { narrative: 'Steady progress' }, selectedEvidence: [] };

  it('saves a draft with a 30-day expiry and no approval', () => {
    const draft = apply(emptyRecords(), (r) => saveReport(r, report, NOW));
    const [w] = planWrites('coach_a', 'student_a', emptyRecords(), draft, NOW);
    expect(w).toMatchObject({ op: 'set', data: { status: 'draft', approvedAt: null, expireAt: NOW + RETENTION_DAYS * DAY, authorUid: 'coach_a' } });
  });

  it('approves in two writes: drop the expiry, then status with a server-time approvedAt', () => {
    const draft = apply(emptyRecords(), (r) => saveReport(r, report, NOW));
    const id = draft.reports[0].id;
    const approved = apply(draft, (r) => approveReport(r, id, NOW + 1));
    expect(planWrites('coach_a', 'student_a', draft, approved, NOW)).toEqual([
      { op: 'update', path: ['learners', 'student_a', 'reports', id], data: { expireAt: REMOVE, updatedAt: NOW } },
      { op: 'update', path: ['learners', 'student_a', 'reports', id], data: { status: 'approved', approvedAt: SERVER_TIME, updatedAt: NOW } }
    ]);
  });

  it('turns an edit of an approved report into a new draft that points back to it', () => {
    const draft = apply(emptyRecords(), (r) => saveReport(r, report, NOW));
    const id = draft.reports[0].id;
    const approved = apply(draft, (r) => approveReport(r, id, NOW + 1));
    const res = saveReport(approved, { ...report, id, text: { narrative: 'Changed' } }, NOW + 2);
    expect(res.id).not.toBe(id);
    expect(res.records.reports.find((r) => r.id === id)).toMatchObject({ status: 'approved', text: { narrative: 'Steady progress' } });
    expect(res.records.reports.find((r) => r.id === res.id)).toMatchObject({ status: 'draft', basedOn: id });
    expect(paths(planWrites('coach_a', 'student_a', approved, res.records, NOW))).toEqual([`set learners/student_a/reports/${res.id}`]);
  });

  it('migrates an approved report as a draft that is then approved, never created approved', () => {
    const draft = apply(emptyRecords(), (r) => saveReport(r, report, NOW));
    const approved = apply(draft, (r) => approveReport(r, draft.reports[0].id, NOW));
    const writes = planWrites('coach_a', 'student_a', emptyRecords(), approved, NOW);
    expect(writes.map((w) => [w.op, w.data.status])).toEqual([['set', 'draft'], ['update', undefined], ['update', 'approved']]);
  });
});

describe('recordsFromDocs: Firestore back to the screen shapes', () => {
  it('turns timestamps into milliseconds and keeps private and parent notes apart', () => {
    const ts = (ms) => ({ toMillis: () => ms });
    const r = recordsFromDocs({
      privateNotes: [{ id: 'n1', text: 'mine', at: 2, expireAt: ts(99) }],
      parentNotes: [{ id: 'n2', text: 'for parents', at: 3 }],
      reports: [{ id: 'r1', status: 'approved', approvedAt: ts(50), updatedAt: 5 }],
      feedback: [{ id: 'f1', evidenceKey: 'proj:ev-1', text: 'Nice', at: 4, authorUid: 'coach_a' }],
      checkIns: [{ id: 'c1', at: 1 }, { id: 'c2', at: 9 }]
    });
    expect(r.notes.map((n) => [n.id, n.visibility])).toEqual([['n2', 'parent'], ['n1', 'private']]);
    expect(r.notes[1].expireAt).toBe(99);
    expect(r.reports[0].approvedAt).toBe(50);
    expect(r.feedback['proj:ev-1']).toEqual({ text: 'Nice', at: 4, authorUid: 'coach_a' });
    expect(r.checkIns.map((c) => c.id)).toEqual(['c2', 'c1']);
  });
});

describe('moving device records to Firestore', () => {
  const PREFIX = 'welearn.coachRecords.v1:coach_a:';
  let store;
  beforeEach(() => {
    fake.writes = [];
    fake.failFor = null;
    store = {};
    globalThis.window = {
      localStorage: {
        get length() { return Object.keys(store).length; },
        key: (i) => Object.keys(store)[i] ?? null,
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; }
      },
      dispatchEvent() {}
    };
    globalThis.CustomEvent = globalThis.CustomEvent || class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
    const one = apply(emptyRecords(), (r) => addMilestone(r, { title: 'Prototype', dueOn: '2026-11-01' }, NOW));
    const two = apply(one, (r) => addNote(r, { text: 'Private', visibility: 'private' }, NOW));
    store[`${PREFIX}learner_ok`] = JSON.stringify(two);
    store[`${PREFIX}learner_bad`] = JSON.stringify(one);
    store['welearn.coachRecords.v1:coach_other:learner_ok'] = JSON.stringify(one);
  });
  afterAll(() => { delete globalThis.window; });

  it('removes a learner\'s device copy only when every write for that learner succeeded', async () => {
    fake.failFor = 'learners/learner_bad';
    expect(hasDeviceRecords('coach_a')).toBe(true);
    const res = await migrateDeviceRecords('coach_a');
    expect(res).toEqual({ moved: 2, learners: 1, failedLearners: 1 });
    expect(store).not.toHaveProperty(`${PREFIX}learner_ok`);
    expect(store).toHaveProperty(`${PREFIX}learner_bad`);
    expect(store).toHaveProperty('welearn.coachRecords.v1:coach_other:learner_ok');
    expect(fake.writes.map((w) => w.path)).toEqual(expect.arrayContaining([expect.stringMatching(/^coachPrivate\/coach_a\/learners\/learner_ok\/notes\//)]));
    const expiry = fake.writes.find((w) => w.path.startsWith('coachPrivate')).data.expireAt.ms;
    expect(expiry - Date.now()).toBeGreaterThan((RETENTION_DAYS - 1) * DAY);
  });

  it('can be run again: what failed before moves once Firestore accepts it', async () => {
    fake.failFor = 'learners/learner_bad';
    await migrateDeviceRecords('coach_a');
    fake.failFor = null;
    const res = await migrateDeviceRecords('coach_a');
    expect(res).toEqual({ moved: 1, learners: 1, failedLearners: 0 });
    expect(hasDeviceRecords('coach_a')).toBe(false);
  });
});

describe('Course Maker stages start unapproved', () => {
  it('the default outline and a blank added stage need the coach\'s review', () => {
    expect(defaultMilestones().every((m) => m.approvedByCoach === false && m.isAiGenerated === false)).toBe(true);
    expect(newStage(3, NOW)).toMatchObject({ approvedByCoach: false, stageNumber: 4, id: `ms-${NOW}-3` });
  });
});

// ---------------------------------------------------------------------------
// The planned writes against the real rules (Firestore emulator on 8088).
// ---------------------------------------------------------------------------

describe('planned writes pass the coach-records rules', () => {
  let testEnv;
  const CLASS_A = 'class_a';
  const ctx = (uid) => testEnv.authenticatedContext(uid, { role: 'teacher', classIds: [CLASS_A] });

  /** The store's runWrites, on the modular SDK the rules harness uses. */
  const run = async (db, writes) => {
    for (const w of writes) {
      const data = {};
      for (const [k, v] of Object.entries(w.data || {})) {
        if (v === undefined) continue;
        data[k] = v === SERVER_TIME ? serverTimestamp() : v === REMOVE ? deleteField() : (k === 'expireAt' && typeof v === 'number') ? Timestamp.fromMillis(v) : v;
      }
      const ref = doc(db, ...w.path);
      if (w.op === 'set') await setDoc(ref, data);
      else if (w.op === 'update') await updateDoc(ref, data);
      else await deleteDoc(ref);
    }
  };

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-hearisland-coach-sync',
      firestore: { rules: fs.readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8088 }
    });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (c) => {
      const db = c.firestore();
      await setDoc(doc(db, 'classes', CLASS_A), { name: 'Class A', coachIds: ['coach_a', 'coach_a2'], orgId: 'org1' });
      await setDoc(doc(db, 'users', 'student_a'), { uid: 'student_a', role: 'student', classIds: [CLASS_A] });
    });
  });

  it('a coach can save every kind of record, and a co-coach can mark a milestone done', async () => {
    const db = ctx('coach_a').firestore();
    let r = emptyRecords();
    const steps = [
      (x) => addCheckIn(x, { strength: 'Clear plan', nextAction: 'Test the sensor', followUpOn: '2026-11-04', asMilestone: true }, NOW),
      (x) => addNote(x, { text: 'Private', visibility: 'private' }, NOW),
      (x) => addNote(x, { text: 'For parents', visibility: 'parent' }, NOW),
      (x) => setFeedback(x, 'proj:ev-1', 'Good test plan', NOW),
      (x) => addAssessment(x, { competencyId: 'ctps-01', level: 'independent', evidenceKeys: ['proj:ev-1'] }, NOW),
      (x) => addCoachEvidence(x, { kind: 'link', title: 'Video', link: 'https://example.org/v' }, NOW)
    ];
    for (const step of steps) {
      const next = apply(r, step);
      await assertSucceeds(run(db, planWrites('coach_a', 'student_a', r, next, NOW)));
      r = next;
    }
    const done = apply(r, (x) => setMilestoneDone(x, r.milestones[0].id, '2026-10-28'));
    await assertSucceeds(run(ctx('coach_a2').firestore(), planWrites('coach_a2', 'student_a', r, done, NOW)));
  });

  it('a report is saved, approved with server time, and an edit afterwards becomes a new draft', async () => {
    const db = ctx('coach_a').firestore();
    const report = { period: { from: '2026-10-01', to: '2026-10-28' }, text: { narrative: 'Steady progress' }, selectedEvidence: [], sources: { checkIns: 1 } };
    const draft = apply(emptyRecords(), (x) => saveReport(x, report, NOW));
    const id = draft.reports[0].id;
    await assertSucceeds(run(db, planWrites('coach_a', 'student_a', emptyRecords(), draft, NOW)));
    const approved = apply(draft, (x) => approveReport(x, id, NOW));
    await assertSucceeds(run(db, planWrites('coach_a', 'student_a', draft, approved, NOW)));

    const saved = (await getDoc(doc(db, 'learners', 'student_a', 'reports', id))).data();
    expect(saved.status).toBe('approved');
    expect(saved.approvedAt).toBeInstanceOf(Timestamp);
    expect(saved).not.toHaveProperty('expireAt');

    const edited = saveReport(approved, { ...report, id, text: { narrative: 'Changed' } }, NOW + 5);
    await assertSucceeds(run(db, planWrites('coach_a', 'student_a', approved, edited.records, NOW + 5)));
    expect((await getDoc(doc(db, 'learners', 'student_a', 'reports', id))).data().text.narrative).toBe('Steady progress');
    // Rewriting the approved report in place is what the old client did; the rules refuse it.
    await assertFails(setDoc(doc(db, 'learners', 'student_a', 'reports', id), { ...saved, status: 'draft', text: { narrative: 'Changed' } }));
  });

  it('known gap for the backend owner: a co-coach cannot update feedback another coach wrote', async () => {
    const one = apply(emptyRecords(), (x) => setFeedback(x, 'proj:ev-1', 'First', NOW));
    await assertSucceeds(run(ctx('coach_a').firestore(), planWrites('coach_a', 'student_a', emptyRecords(), one, NOW)));
    const two = apply(one, (x) => setFeedback(x, 'proj:ev-1', 'Second', NOW));
    await assertFails(run(ctx('coach_a2').firestore(), planWrites('coach_a2', 'student_a', one, two, NOW)));
  });
});
