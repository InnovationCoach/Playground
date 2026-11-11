#!/usr/bin/env node

/**
 * Seed the Firebase emulators with a Phase 0 reviewable dataset.
 *
 * Seeds organization, schools, cohorts, programmes, classes, and review accounts
 * for all roles (admin, supervisor, coach/teacher, student, parent) as specified
 * in Phase 0 backend deliverables.
 *
 * Emulator-only. Refuses to run against live project.
 * Usage: npm run seed:emulator (with emulators running)
 */

import { SCHOOL_COHORTS } from '../src/utils/schoolCohorts.js';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { generateJoinCode, JOIN_CODE_ALPHABET } from '../src/utils/joinCode.js';
import { seedFrameworkAndPrograms } from './seed-pbl-programs.js';

const PROJECT_ID = 'demo-hearisland-local';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('\n  Refusing to run: emulator hosts are not set.');
  console.error('  This script must only ever touch the emulators, never a live project.');
  console.error('\n  Start them first:  npm run emulators\n');
  process.exit(1);
}

initializeApp({ projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

const PASSWORD = 'review123';
const ORG_ID = 'org-welearn';

function makePublicId(prefixStr = '') {
  let str = (prefixStr + 'XYZ987654321').replace(/[^BCDFGHJKMNPQRSTVWXYZ23456789]/gi, '').toUpperCase();
  while (str.length < 12) str += 'X';
  return `${str.slice(0, 3)}-${str.slice(3, 6)}-${str.slice(6, 9)}-${str.slice(9, 12)}`;
}

async function upsertUser(email, displayName, disabled = false) {
  try {
    const existing = await auth.getUserByEmail(email);
    if (disabled !== existing.disabled) {
      await auth.updateUser(existing.uid, { disabled });
    }
    return existing;
  } catch {
    return auth.createUser({ email, password: PASSWORD, displayName, emailVerified: true, disabled });
  }
}

console.log(`\n  Seeding emulators (project ${PROJECT_ID})\n`);

// 1. Organization
await db.collection('organizations').doc(ORG_ID).set({
  name: 'WeLearn',
  status: 'active',
  defaultLocale: 'en',
  createdAt: FieldValue.serverTimestamp()
});

// 2. Schools
const SCHOOLS = [
  { id: 'sch-bkk', name: 'Bangkok Campus (test)', timezone: 'Asia/Bangkok', locale: 'th', status: 'active' },
  { id: 'sch-online', name: 'Online School (test)', timezone: 'Asia/Bangkok', locale: 'en', status: 'active' }
];
for (const s of SCHOOLS) {
  await db.collection('schools').doc(s.id).set({
    orgId: ORG_ID,
    name: s.name,
    timezone: s.timezone,
    locale: s.locale,
    status: s.status,
    // Teen Quest is switched on for the emulator so it can be reviewed; production schools opt in.
    features: { questMode: true },
    createdAt: FieldValue.serverTimestamp()
  });
}

// 3. Cohorts
const COHORTS = SCHOOL_COHORTS.map(c => ({ ...c, id: c.cohortId }));
for (const c of COHORTS) {
  await db.collection('cohorts').doc(c.id).set({
    orgId: ORG_ID,
    code: c.code,
    name: c.name,
    ageBands: c.ageBands,
    minAge: c.minAge,
    maxAgeExclusive: c.maxAgeExclusive,
    status: c.status,
    createdAt: FieldValue.serverTimestamp()
  });
}

// 4. Programmes
const PROGRAMMES = [
  { id: 'prog-thai-diploma', code: 'THAI-DIP', name: { en: 'Thai Diploma', zh: '泰国文凭', th: 'ประกาศนียบัตรไทย' }, defaultLocale: 'th', status: 'active' }
];
for (const p of PROGRAMMES) {
  await db.collection('programmes').doc(p.id).set({
    orgId: ORG_ID,
    code: p.code,
    name: p.name,
    defaultLocale: p.defaultLocale,
    status: p.status,
    createdAt: FieldValue.serverTimestamp()
  });
}

// 5. Classes
const CLASSES = [
  { id: 'class_lower_primary', name: 'Lower Primary A', orgId: ORG_ID, schoolId: 'sch-bkk', cohortId: 'cohort-lower-primary', yearLevel: 'Year 3', status: 'active' },
  { id: 'class_higher_primary', name: 'Higher Primary A', orgId: ORG_ID, schoolId: 'sch-bkk', cohortId: 'cohort-higher-primary', yearLevel: 'Year 5', status: 'active' },
  { id: 'class_yr9_climate', name: 'Lower Secondary A', orgId: ORG_ID, schoolId: 'sch-bkk', cohortId: 'cohort-lower-secondary', yearLevel: 'Year 9', status: 'active' },
  { id: 'class_yr12_eng', name: 'Higher Secondary A', orgId: ORG_ID, schoolId: 'sch-bkk', cohortId: 'cohort-higher-secondary', yearLevel: 'Year 12', status: 'active' }
];

const issuedCodes = {};
for (const c of CLASSES) {
  const code = generateJoinCode();
  issuedCodes[c.id] = code;

  await db.collection('classes').doc(c.id).set({
    name: c.name,
    orgId: c.orgId,
    schoolId: c.schoolId,
    cohortId: c.cohortId,
    yearLevel: c.yearLevel,
    status: c.status,
    coachIds: [],
    learnerIds: [],
    joinCode: code,
    createdAt: FieldValue.serverTimestamp()
  });

  await db.collection('classCodes').doc(code).set({
    classId: c.id,
    className: c.name,
    createdAt: FieldValue.serverTimestamp()
  });
}

// 6. Existing Coaches
const COACHES = [
  { email: 'coach.rivera@school.edu', givenNames: 'Sam', surname: 'Rivera', classIds: ['class_yr9_climate'] },
  { email: 'coach.okafor@school.edu', givenNames: 'Ada', surname: 'Okafor', classIds: ['class_yr12_eng'] }
];

for (const coach of COACHES) {
  const displayName = `${coach.givenNames} ${coach.surname}`;
  const user = await upsertUser(coach.email, displayName);
  const publicId = makePublicId(`COACH${coach.surname.toUpperCase()}`);

  await auth.setCustomUserClaims(user.uid, { role: 'teacher', orgId: ORG_ID, schoolIds: ['sch-bkk'], classIds: coach.classIds });

  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    publicId,
    email: coach.email,
    givenNames: coach.givenNames,
    surname: coach.surname,
    displayName,
    role: 'teacher',
    status: 'active',
    orgId: ORG_ID,
    schoolIds: ['sch-bkk'],
    classIds: coach.classIds,
    groupName: CLASSES.find((c) => c.id === coach.classIds[0])?.name || '',
    createdAt: FieldValue.serverTimestamp()
  });

  await db.collection('publicIds').doc(publicId).set({ uid: user.uid, createdAt: FieldValue.serverTimestamp() });

  await Promise.all(coach.classIds.map((cid) =>
    db.collection('classes').doc(cid).set(
      { coachIds: FieldValue.arrayUnion(user.uid) },
      { merge: true }
    )
  ));
}

// 7. Admin, Supervisor, Parent Review Accounts
const REVIEW_STAFF = [
  {
    email: 'admin.test@school.edu', givenNames: 'Admin', surname: 'Test', role: 'admin',
    claims: { role: 'admin', orgId: ORG_ID, schoolIds: ['sch-bkk', 'sch-online'] }, schoolIds: ['sch-bkk', 'sch-online']
  },
  {
    email: 'supervisor.test@school.edu', givenNames: 'Supervisor', surname: 'Test', role: 'supervisor',
    claims: { role: 'supervisor', orgId: ORG_ID, schoolIds: ['sch-bkk'] }, schoolIds: ['sch-bkk']
  },
  {
    email: 'parent.test@school.edu', givenNames: 'Parent', surname: 'Test', role: 'parent',
    claims: { role: 'parent', orgId: ORG_ID }, schoolIds: ['sch-bkk']
  }
];

let parentUserUid = null;

for (const staff of REVIEW_STAFF) {
  const displayName = `${staff.givenNames} ${staff.surname}`;
  const user = await upsertUser(staff.email, displayName);
  const publicId = makePublicId(staff.role.toUpperCase());

  await auth.setCustomUserClaims(user.uid, staff.claims);

  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    publicId,
    email: staff.email,
    givenNames: staff.givenNames,
    surname: staff.surname,
    displayName,
    role: staff.role,
    status: 'active',
    orgId: ORG_ID,
    schoolIds: staff.schoolIds,
    classIds: [],
    createdAt: FieldValue.serverTimestamp()
  });

  await db.collection('publicIds').doc(publicId).set({ uid: user.uid, createdAt: FieldValue.serverTimestamp() });

  if (staff.role === 'parent') {
    parentUserUid = user.uid;
  }
}

// 8. Students (Existing + Primary + Suspended)
const STUDENTS = [
  { email: 'mia@school.edu', givenNames: 'Mia', surname: 'Chen', classId: 'class_yr9_climate', cohortId: 'cohort-lower-secondary', cohort: 'lower-secondary', ageBand: '13-15', yearLevel: 'Year 9', minutes: 125, sessions: 6, status: 'active' },
  { email: 'leo@school.edu', givenNames: 'Leo', surname: 'Martins', classId: 'class_yr9_climate', cohortId: 'cohort-lower-secondary', cohort: 'lower-secondary', ageBand: '13-15', yearLevel: 'Year 9', minutes: 95, sessions: 4, status: 'active' },
  { email: 'noor@school.edu', givenNames: 'Noor', surname: 'Haddad', classId: 'class_yr9_climate', cohortId: 'cohort-lower-secondary', cohort: 'lower-secondary', ageBand: '13-15', yearLevel: 'Year 9', minutes: 160, sessions: 8, status: 'active' },
  { email: 'tom@school.edu', givenNames: 'Tom', surname: 'Becker', classId: 'class_yr12_eng', cohortId: 'cohort-higher-secondary', cohort: 'higher-secondary', ageBand: '16-18', yearLevel: 'Year 12', minutes: 210, sessions: 9, status: 'active' },
  { email: 'ines@school.edu', givenNames: 'Inès', surname: 'Dupont', classId: 'class_yr12_eng', cohortId: 'cohort-higher-secondary', cohort: 'higher-secondary', ageBand: '16-18', yearLevel: 'Year 12', minutes: 175, sessions: 7, status: 'active' },
  // Phase 0 additions:
  { email: 'primary.student@school.edu', givenNames: 'Penny', surname: 'Primary', classId: 'class_lower_primary', cohortId: 'cohort-lower-primary', cohort: 'primary', ageBand: 'primary', yearLevel: 'Year 3', minutes: 0, sessions: 0, status: 'pending', consent: { status: 'required' } },
  { email: 'suspended.student@school.edu', givenNames: 'Sam', surname: 'Suspended', classId: 'class_yr9_climate', cohortId: 'cohort-lower-secondary', cohort: 'lower-secondary', ageBand: '13-15', yearLevel: 'Year 9', minutes: 10, sessions: 1, status: 'suspended', disabled: true }
];

let miaStudentUid = null;

for (const s of STUDENTS) {
  const displayName = `${s.givenNames} ${s.surname}`;
  const user = await upsertUser(s.email, displayName, !!s.disabled);
  const className = CLASSES.find((c) => c.id === s.classId)?.name || '';
  const publicId = makePublicId(`STUD${s.surname.toUpperCase()}`);

  if (s.email === 'mia@school.edu') {
    miaStudentUid = user.uid;
  }

  await auth.setCustomUserClaims(user.uid, { role: 'student', orgId: ORG_ID, schoolIds: ['sch-bkk'], classIds: [s.classId] });

  const userDoc = {
    uid: user.uid,
    publicId,
    email: s.email,
    givenNames: s.givenNames,
    surname: s.surname,
    displayName,
    role: 'student',
    status: s.status,
    orgId: ORG_ID,
    schoolIds: ['sch-bkk'],
    classIds: [s.classId],
    groupName: className,
    cohortId: s.cohortId,
    cohort: s.cohort,
    ageBand: s.ageBand,
    yearLevel: s.yearLevel,
    createdAt: FieldValue.serverTimestamp()
  };

  if (s.consent) userDoc.consent = s.consent;
  if (s.status === 'suspended') {
    userDoc.suspendedAt = FieldValue.serverTimestamp();
  }

  await db.collection('users').doc(user.uid).set(userDoc);
  await db.collection('publicIds').doc(publicId).set({ uid: user.uid, createdAt: FieldValue.serverTimestamp() });

  if (s.status === 'active' && s.classId) {
    await db.collection('classes').doc(s.classId).set(
      { learnerIds: FieldValue.arrayUnion(user.uid) },
      { merge: true }
    );
  }

  if (s.minutes > 0) {
    await db.collection('users').doc(user.uid).collection('dailyStats')
      .doc(new Date().toISOString().slice(0, 10))
      .set({ timeSpentMinutes: s.minutes, sessionsCount: s.sessions });
  }
}

// 8b. Teen Quest sample progress for Mia (emulator review data only).
if (miaStudentUid) {
  const { localDate, addDays, isSchoolDay, levelFor } = await import('../src/features/quest/questModel.js');
  const { TERM } = await import('../src/features/pbl/content/pblModel.js');
  const today = localDate(new Date(), 'Asia/Bangkok');
  let last = addDays(today, -1);
  while (!isSchoolDay(last)) last = addDays(last, -1);
  const xp = 1240;
  await db.collection('learnerQuest').doc(miaStudentUid).set({
    schemaVersion: 1, xp, level: levelFor(xp).level,
    counters: { taskSteps: 9, reflections: 4, goalsAcknowledged: 2, evidence: 3, reviewed: 2, goalsAchieved: 1, bestStreak: 6 },
    streak: { count: 4, lastActiveDate: last, freezes: 1 },
    daily: { date: null, selfXp: 0 },
    badges: [
      { id: 'first-evidence', earnedAt: new Date(Date.now() - 12 * 86400000).toISOString() },
      { id: 'curious-mind', earnedAt: new Date(Date.now() - 8 * 86400000).toISOString() },
      { id: 'goal-getter', earnedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
      { id: 'spark-5', earnedAt: new Date(Date.now() - 3 * 86400000).toISOString() }
    ],
    celebrations: [], showOnPortfolio: false, calmView: false, revision: 1, updatedAt: new Date().toISOString()
  });
  await db.collection('users').doc(miaStudentUid).collection('activityProgress').doc(`pbl-${TERM.id}`).set({
    version: 1, termId: TERM.id, currentPhase: 'explore', interests: [], sparks: '', problem: {}, impact: null,
    codeLanguage: 'microbit-python', finalFormat: null, tasksDone: { explore: [0] }, evidence: [], updatedAt: Date.now(), activityId: `pbl-${TERM.id}`
  });
  const wins = [['evidence_reviewed', 25, true, 1], ['evidence_submitted', 40, true, 2], ['reflection', 15, false, 3], ['task_step', 10, false, 4]];
  for (const [type, xpAward, verified, daysAgo] of wins) {
    await db.collection('learnerQuest').doc(miaStudentUid).collection('xpEvents').doc(`${type}__seed-${daysAgo}`).set({
      type, xp: xpAward, verified, sourceId: `seed-${daysAgo}`, classId: 'class_yr9_climate', schoolId: 'sch-bkk',
      localDate: addDays(today, -daysAgo), createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString()
    });
  }
  // Leo sits just below level 2, so one reflection shows the real level-up celebration.
  const leo = await auth.getUserByEmail('leo@school.edu').catch(() => null);
  if (leo) await db.collection('learnerQuest').doc(leo.uid).set({ schemaVersion: 1, xp: 95, level: 1, counters: { reflections: 2 }, streak: { count: 0, lastActiveDate: null, freezes: 0 }, revision: 1 });
  await db.collection('classes').doc('class_yr9_climate').collection('questSquad').doc('current').set({ count: 84, goal: 120, updatedAt: new Date().toISOString() });
}

// 9. Parent Link (parent.test@school.edu linked to mia@school.edu)
if (parentUserUid && miaStudentUid) {
  const linkId = 'link-parent-test-mia';
  await db.collection('parentLinks').doc(linkId).set({
    linkId,
    orgId: ORG_ID,
    parentUid: parentUserUid,
    studentUid: miaStudentUid,
    status: 'active',
    createdVia: 'seed',
    createdAt: FieldValue.serverTimestamp()
  });
}

// 10. Audit Logs
const auditEntries = [
  { action: 'ACCOUNT_CREATED', summary: 'Platform initialized with seed data', actorUid: 'seed-admin', subjectUid: 'admin.test@school.edu' },
  { action: 'SCHOOL_CREATED', summary: 'Created Bangkok Campus school', actorUid: 'seed-admin', subjectUid: 'sch-bkk' },
  { action: 'PARENT_LINKED', summary: 'Linked parent.test@school.edu to Mia Chen', actorUid: 'seed-admin', subjectUid: miaStudentUid || 'mia' }
];

for (const entry of auditEntries) {
  await db.collection('auditLogs').add({
    source: 'server',
    orgId: ORG_ID,
    schoolId: 'sch-bkk',
    subjectUid: entry.subjectUid,
    action: entry.action,
    actorUid: entry.actorUid,
    actorName: 'Seed Script',
    summary: entry.summary,
    details: {},
    createdAt: FieldValue.serverTimestamp()
  });
}

// 11. Seed Framework and PBL Programs
await seedFrameworkAndPrograms(db);

// Output summary table
console.log('\n======================================================================');
console.log(' SEEDED REVIEW ACCOUNTS (Password: review123)');
console.log('======================================================================');
console.log(' Email'.padEnd(35) + ' | Role'.padEnd(14) + ' | Status');
console.log('----------------------------------------------------------------------');
for (const staff of REVIEW_STAFF) {
  console.log(` ${staff.email.padEnd(34)} | ${staff.role.padEnd(12)} | active`);
}
for (const coach of COACHES) {
  console.log(` ${coach.email.padEnd(34)} | teacher      | active`);
}
for (const student of STUDENTS) {
  console.log(` ${student.email.padEnd(34)} | student      | ${student.status}`);
}
console.log('======================================================================\n');
console.log(' Join Codes:');
for (const c of CLASSES) {
  console.log(`   ${c.id.padEnd(22)}: ${issuedCodes[c.id]} (${c.name})`);
}
console.log('\n  Seeding complete.\n');

process.exit(0);
