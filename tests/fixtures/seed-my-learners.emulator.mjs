#!/usr/bin/env node
/**
 * Synthetic data for reviewing My Learners (coach) against the EMULATORS.
 *
 * Adds one demo coach (coach.lee@school.edu / review123) with one class of 48
 * synthetic learners in varied states: term projects at different stages,
 * evidence with and without dates in the feedback window, PBL program
 * reflections, records older than 30 days, and no records at all. It does not
 * touch the shared review accounts (Rivera, Okafor, Mia, Tom).
 *
 * Run with the emulators up:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *     node tests/fixtures/seed-my-learners.emulator.mjs
 *
 * Refuses to run without both emulator hosts. Never point it at a live project.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'demo-hearisland-local';
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('Refusing to run: FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST must both be set (emulators only).');
  process.exit(1);
}
initializeApp({ projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

const CLASS_ID = 'class_demo_yr10_design';
const TERM_ID = 'term-2026-t3';
const PROGRAM_ID = 'entrepreneurship-product-creation-2026';
const DAY = 86400000;
const ago = (d) => Date.now() - d * DAY;
const PHASES = ['explore', 'empathise', 'define', 'ideate', 'prototype', 'test', 'share'];

const FIRST = ['Aria', 'Ben', 'Chloe', 'Dev', 'Ella', 'Felix', 'Grace', 'Hugo', 'Isla', 'Jack', 'Kai', 'Lena', 'Milo', 'Nina', 'Omar', 'Priya',
  'Quinn', 'Rosa', 'Sami', 'Tara', 'Umar', 'Vera', 'Wen', 'Xavi', 'Yara', 'Zane', 'Amir', 'Bea', 'Cruz', 'Dina', 'Eli', 'Fern', 'Gus', 'Hana',
  'Ivo', 'Juno', 'Kira', 'Leo', 'Maya', 'Noah', 'Opal', 'Pia', 'Rafa', 'Suri', 'Theo', 'Uma', 'Vik', 'Wren'];
const LAST = ['Sato', 'Okoye', 'Lindqvist', 'Patel', 'Moreau', 'Nguyen', 'Haddad', 'Kowalski', 'Silva', 'Brennan', 'Tanaka', 'Fischer'];
const QUESTIONS = [
  'How might we keep the school garden watered over the holidays?',
  'How might we help younger students find the right bus home?',
  'How might we cut food waste in the canteen by half?',
  'How might we warn cyclists about the dangerous corner by the gate?',
  'How might we reuse the classroom’s plastic bottles as planters?',
  ''
];

const coachEmail = 'coach.lee@school.edu';
let coach;
try { coach = await auth.getUserByEmail(coachEmail); } catch { coach = await auth.createUser({ email: coachEmail, password: 'review123', displayName: 'Jo Lee', emailVerified: true }); }
await auth.setCustomUserClaims(coach.uid, { role: 'teacher', orgId: 'org-welearn', schoolIds: ['sch-bkk'], classIds: [CLASS_ID] });
await db.collection('users').doc(coach.uid).set({
  uid: coach.uid, email: coachEmail, givenNames: 'Jo', surname: 'Lee', displayName: 'Jo Lee', role: 'teacher', status: 'active',
  orgId: 'org-welearn', schoolIds: ['sch-bkk'], classIds: [CLASS_ID], groupName: 'Year 10 Design (demo)'
});
await db.collection('classes').doc(CLASS_ID).set({
  name: 'Year 10 Design (demo)', orgId: 'org-welearn', schoolId: 'sch-bkk', yearLevel: 'Year 10', status: 'active', coachIds: [coach.uid], joinCode: null
});
await db.collection('assignments').doc('demo-assign-research').set({ title: 'Research summary (one page)', classId: CLASS_ID, dueAt: ago(-5), coachId: coach.uid, createdAt: ago(10) });
await db.collection('assignments').doc('demo-assign-pitch').set({ title: 'Pitch draft', classId: CLASS_ID, dueAt: ago(-19), coachId: coach.uid, createdAt: ago(10) });

for (let i = 0; i < FIRST.length; i++) {
  const uid = `demo-learner-${String(i + 1).padStart(2, '0')}`;
  const givenNames = FIRST[i];
  const surname = LAST[i % LAST.length];
  await db.collection('users').doc(uid).set({
    uid, email: `${givenNames.toLowerCase()}.${surname.toLowerCase()}@demo.welearn.test`, givenNames, surname, displayName: `${givenNames} ${surname}`,
    role: 'student', status: i === 47 ? 'suspended' : 'active', orgId: 'org-welearn', schoolIds: ['sch-bkk'], classIds: [CLASS_ID],
    groupName: 'Year 10 Design (demo)', ageBand: 'lower-secondary', yearLevel: 'Year 10',
    ...(i % 3 === 0 ? { goalPlan: { version: 2, goals: [{ id: 'g1', explore: 'Get better at soldering', done: false, createdAt: ago(20), steps: [{ id: 's1', text: 'Practise on a kit', done: true }, { id: 's2', text: 'Solder the sensor board', done: false }] }], strengths: [], supports: [], phrases: [], recharge: [], days: {}, focus: null, updatedAt: ago(6) } } : {})
  });

  const kind = i % 6; // 0 recent evidence, 1 old evidence, 2 stale, 3 none, 4 program only, 5 no title
  const prog = db.collection('users').doc(uid).collection('activityProgress');
  if (kind !== 3 && kind !== 4) {
    const phase = PHASES[(i % 5) + 1];
    const recent = kind === 0 ? ago(1 + (i % 9)) : kind === 1 ? ago(40) : ago(60);
    await prog.doc(`pbl-${TERM_ID}`).set({
      version: 1, termId: TERM_ID, currentPhase: phase, interests: ['Environment'], sparks: '',
      problem: { hmw: kind === 5 ? '' : QUESTIONS[i % 5], who: '', why: '', criteria: '', constraints: '', impactMeasure: '' },
      impact: 'environment', codeLanguage: 'micropython', finalFormat: null,
      tasksDone: { [phase]: i % 2 ? [0] : [0, 1] },
      evidence: [
        { id: `ev-${uid}-a`, phase, kind: 'media', title: 'Photo of the first prototype', body: 'Cardboard model with the sensor taped on.', link: 'https://example.org/photo', competencies: ['ctps-01', 'ct-05'], createdAt: recent },
        { id: `ev-${uid}-b`, phase: 'define', kind: 'reflection', title: 'What I learned from interviews', body: 'Three people said the problem only happens in the rainy season.', link: '', competencies: ['ec-01'], createdAt: ago(45) }
      ],
      updatedAt: kind === 2 ? ago(60) : recent,
      activityId: `pbl-${TERM_ID}`
    });
  }
  if (kind === 4 || i % 4 === 0) {
    await prog.doc(`pbl-program-${PROGRAM_ID}`).set({
      version: 1, programId: PROGRAM_ID, startedAt: ago(30), tools: {},
      sessions: { 1: { done: true, reflection: 'I found three frictions in the lunch queue.', confidence: 4, steps: [0] }, 2: { done: i % 8 === 0, reflection: i % 8 === 0 ? 'Our first idea failed the test, so we changed it.' : '', confidence: i % 8 === 0 ? 2 : null } },
      updatedAt: ago(3 + (i % 5))
    });
  }
  // Program enrolments with phase submissions (enrolments/{uid}_{program}/phaseProgress/{phase}).
  if (i % 5 === 0 || i === 7) {
    const enrolmentId = `${uid}_${PROGRAM_ID}`;
    await db.collection('enrolments').doc(enrolmentId).set({
      learnerId: uid, programId: PROGRAM_ID, classId: CLASS_ID, source: 'coach-assigned', currentPhaseId: 'empathise', status: 'active', startedAt: ago(20), updatedAt: ago(2)
    });
    const phases = db.collection('enrolments').doc(enrolmentId).collection('phaseProgress');
    await phases.doc('explore').set({
      status: 'reviewed', updatedAt: ago(12),
      evidence: [{ type: 'text', url: null, note: 'Friction log: 14 entries from the canteen queue.', at: ago(14) }],
      coachFeedback: { text: 'Thorough log. Group the entries by cause next.', coachId: coach.uid, at: ago(12) }
    });
    await phases.doc('empathise').set(i === 7
      ? { status: 'in_progress', evidence: [], updatedAt: ago(4) }
      : { status: 'submitted', updatedAt: ago(1 + (i % 4)),
          evidence: [{ type: 'link', url: 'https://example.org/interviews', note: 'Notes from 3 customer interviews.', at: ago(1 + (i % 4)) }] });
  }

  // A cohort-assigned course (like the pilot's), for learners with no other records:
  // the profile must show it as the current project, not "No project started".
  if (kind === 3) {
    const courseId = 'ecocool-smart-garden-2026';
    const enrolmentId = `${uid}_${courseId}`;
    await db.collection('enrolments').doc(enrolmentId).set({
      learnerId: uid, programId: courseId, classId: CLASS_ID, source: 'cohort-assignment', currentPhaseId: 'ideate', status: 'active', startedAt: ago(21), updatedAt: ago(3)
    });
    const phases = db.collection('enrolments').doc(enrolmentId).collection('phaseProgress');
    await phases.doc('explore').set({ status: 'reviewed', updatedAt: ago(10), evidence: [{ type: 'text', url: null, note: 'Heat readings from three garden beds.', at: ago(12) }],
      coachFeedback: { text: 'Clear readings. Note the time of day next time.', coachId: coach.uid, at: ago(10) } });
    await phases.doc('ideate').set({ status: 'submitted', updatedAt: ago(3), evidence: [{ type: 'link', url: 'https://example.org/shade-sketches', note: 'Three shading ideas, sketched.', at: ago(3) }] });
  }

  if (kind !== 3) {
    await db.collection('users').doc(uid).collection('dailyStats').doc(new Date(ago(i % 12)).toISOString().slice(0, 10)).set({ timeSpentMinutes: 20 + i, sessionsCount: 1 });
  }
}
console.log(`Seeded coach ${coachEmail} (review123), class ${CLASS_ID} and ${FIRST.length} synthetic learners.`);
process.exit(0);
