#!/usr/bin/env node
/**
 * 10-10-3 Pilot Cohort Synthetic Dataset for EMULATOR Rehearsal.
 *
 * Seeds:
 * - 3 Coaches: coach.sarah@welearn.org, coach.marcus@welearn.org, coach.elena@welearn.org
 * - 1 Pilot Class: class_pilot_2026_spark (SPARK Pilot Cohort 2026)
 * - 10 Students: student.01@welearn.org .. student.10@welearn.org
 * - 10 Parents: parent.01@welearn.org .. parent.10@welearn.org (linked via parentLinks)
 * - Active PBL Program & Enrolments: ecocool-smart-garden-2026
 * - Coach Records: milestones, coachGoals, feedback, check-ins, private notes
 *
 * STRICT SAFETY: Refuses to run without FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST.
 * Usage:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *     node tests/fixtures/seed-pilot-cohort.emulator.mjs
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = 'demo-hearisland-local';
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('\nRefusing to run: FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST must both be set.');
  console.error('This script must only ever run against the local emulators.\n');
  process.exit(1);
}

initializeApp({ projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

const PASSWORD = 'review123';
const CLASS_ID = 'class_pilot_2026_spark';
const PROGRAM_ID = 'ecocool-smart-garden-2026';
const ORG_ID = 'org-welearn';
const SCHOOL_ID = 'sch-welearn';
const DAY = 86400000;
const ago = (d) => Date.now() - d * DAY;

async function upsertAuth(email, displayName, customClaims) {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    await auth.updateUser(userRecord.uid, { displayName, emailVerified: true });
  } catch {
    userRecord = await auth.createUser({
      email,
      password: PASSWORD,
      displayName,
      emailVerified: true
    });
  }
  if (customClaims) {
    await auth.setCustomUserClaims(userRecord.uid, customClaims);
  }
  return userRecord;
}

console.log(`\n🌱 Seeding 10-10-3 Pilot Cohort into emulator (${PROJECT_ID})...\n`);

// 1. Organization & School
await db.collection('organizations').doc(ORG_ID).set({
  name: 'WeLearn Global',
  status: 'active',
  defaultLocale: 'en',
  updatedAt: FieldValue.serverTimestamp()
}, { merge: true });

await db.collection('schools').doc(SCHOOL_ID).set({
  name: 'WeLearn Pilot Academy',
  orgId: ORG_ID,
  timezone: 'Asia/Bangkok',
  locale: 'en',
  status: 'active'
}, { merge: true });

// 2. 3 Pilot Coaches
const COACHES = [
  { email: 'coach.sarah@welearn.org', name: 'Sarah Jenkins', roleTitle: 'Lead Coach', givenNames: 'Sarah', surname: 'Jenkins' },
  { email: 'coach.marcus@welearn.org', name: 'Marcus Vance', roleTitle: 'STEM Coach', givenNames: 'Marcus', surname: 'Vance' },
  { email: 'coach.elena@welearn.org', name: 'Elena Rostova', roleTitle: 'Humanities & Design Coach', givenNames: 'Elena', surname: 'Rostova' }
];

const coachUids = [];
for (const c of COACHES) {
  const user = await upsertAuth(c.email, c.name, {
    role: 'teacher',
    orgId: ORG_ID,
    schoolIds: [SCHOOL_ID],
    classIds: [CLASS_ID]
  });
  coachUids.push(user.uid);
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: c.email,
    displayName: c.name,
    givenNames: c.givenNames,
    surname: c.surname,
    role: 'teacher',
    status: 'active',
    orgId: ORG_ID,
    schoolIds: [SCHOOL_ID],
    classIds: [CLASS_ID],
    groupName: 'SPARK Pilot Cohort 2026',
    roleTitle: c.roleTitle,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
}
console.log(`✓ Seeded 3 Coaches: ${COACHES.map(c => c.email).join(', ')}`);

// 3. Pilot Class & Join Code
await db.collection('classes').doc(CLASS_ID).set({
  id: CLASS_ID,
  name: 'SPARK Pilot Cohort 2026',
  orgId: ORG_ID,
  schoolId: SCHOOL_ID,
  yearLevel: 'Year 9/10',
  status: 'active',
  coachIds: coachUids,
  programId: PROGRAM_ID,
  joinCode: 'SPARK26',
  updatedAt: FieldValue.serverTimestamp()
}, { merge: true });

await db.collection('classCodes').doc('SPARK26').set({
  code: 'SPARK26',
  classId: CLASS_ID,
  className: 'SPARK Pilot Cohort 2026',
  coachId: coachUids[0],
  schoolId: SCHOOL_ID,
  orgId: ORG_ID,
  status: 'active',
  createdAt: ago(15),
  updatedAt: ago(15)
}, { merge: true });

// 4. 10 Pilot Students & 10 Parents
const STUDENTS = [
  { id: '01', first: 'Alex', last: 'Chen', focus: 'Hydroponic nutrient auto-doser' },
  { id: '02', first: 'Bianca', last: 'Rossi', focus: 'Solar-powered greenhouse ventilation' },
  { id: '03', first: 'Callum', last: 'Davies', focus: 'Greywater filtration sensor' },
  { id: '04', first: 'Danai', last: 'Jaroen', focus: 'Smart soil moisture telemetry' },
  { id: '05', first: 'Ethan', last: 'Morales', focus: 'Pollinator companion planting map' },
  { id: '06', first: 'Fatima', last: 'Al-Mansoor', focus: 'Microclimate temperature forecasting' },
  { id: '07', first: 'Gabriel', last: 'Silva', focus: 'Automated seed germination chamber' },
  { id: '08', first: 'Hana', last: 'Takahashi', focus: 'Vertical aeroponics tower prototype' },
  { id: '09', first: 'Isaac', last: 'Kim', focus: 'Root-zone microbial sensor' },
  { id: '10', first: 'Jasmine', last: 'Patel', focus: 'Organic pest deterrent ultrasonic repellent' }
];

const studentUids = [];
for (let i = 0; i < STUDENTS.length; i++) {
  const s = STUDENTS[i];
  const sEmail = `student.${s.id}@welearn.org`;
  const pEmail = `parent.${s.id}@welearn.org`;
  const studentName = `${s.first} ${s.last}`;
  const parentName = `Parent of ${s.first}`;

  // Student Auth & Profile
  const sUser = await upsertAuth(sEmail, studentName, {
    role: 'student',
    orgId: ORG_ID,
    schoolIds: [SCHOOL_ID],
    classIds: [CLASS_ID]
  });
  studentUids.push(sUser.uid);

  await db.collection('users').doc(sUser.uid).set({
    uid: sUser.uid,
    email: sEmail,
    displayName: studentName,
    givenNames: s.first,
    surname: s.last,
    role: 'student',
    status: 'active',
    orgId: ORG_ID,
    schoolIds: [SCHOOL_ID],
    classIds: [CLASS_ID],
    groupName: 'SPARK Pilot Cohort 2026',
    ageBand: 'middle-secondary',
    yearLevel: 'Year 9',
    goalPlan: {
      version: 2,
      goals: [
        {
          id: `goal-${s.id}-1`,
          explore: s.focus,
          done: i % 3 === 0,
          createdAt: ago(14),
          steps: [
            { id: 'step-1', text: 'Calibrate moisture sensor baseline', done: true },
            { id: 'step-2', text: 'Build enclosure prototype', done: i > 2 }
          ]
        }
      ],
      updatedAt: ago(2)
    },
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  // Parent Auth & Profile
  const pUser = await upsertAuth(pEmail, parentName, {
    role: 'parent',
    orgId: ORG_ID
  });

  await db.collection('users').doc(pUser.uid).set({
    uid: pUser.uid,
    email: pEmail,
    displayName: parentName,
    role: 'parent',
    status: 'active',
    orgId: ORG_ID,
    childrenUids: [sUser.uid],
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  // Parent Link (Active)
  const linkId = `link_${pUser.uid}_${sUser.uid}`;
  await db.collection('parentLinks').doc(linkId).set({
    id: linkId,
    parentId: pUser.uid,
    studentId: sUser.uid,
    status: 'active',
    grantedBy: coachUids[0],
    createdAt: ago(10),
    updatedAt: ago(10)
  }, { merge: true });

  // Enrolment & Phase Progress
  const enrolmentId = `${sUser.uid}_${PROGRAM_ID}`;
  const currentPhase = i < 3 ? 'share' : i < 6 ? 'prototype' : 'ideate';
  await db.collection('enrolments').doc(enrolmentId).set({
    id: enrolmentId,
    learnerId: sUser.uid,
    programId: PROGRAM_ID,
    classId: CLASS_ID,
    source: 'cohort-assignment',
    currentPhaseId: currentPhase,
    status: 'active',
    startedAt: ago(20),
    updatedAt: ago(1)
  }, { merge: true });

  const phaseProgressRef = db.collection('enrolments').doc(enrolmentId).collection('phaseProgress');
  
  // Phase 'explore' (Reviewed)
  await phaseProgressRef.doc('explore').set({
    status: 'reviewed',
    updatedAt: ago(12),
    evidence: [{
      type: 'text',
      url: null,
      note: `Field research on ${s.focus}. Analyzed 3 community garden case studies.`,
      at: ago(15)
    }],
    coachFeedback: {
      text: `Excellent problem definition, ${s.first}. Clear focus on sustainability metrics.`,
      coachId: coachUids[0],
      at: ago(12)
    }
  });

  // Phase 'ideate' (Submitted or Reviewed)
  await phaseProgressRef.doc('ideate').set({
    status: i % 2 === 0 ? 'reviewed' : 'submitted',
    updatedAt: ago(3),
    evidence: [{
      type: 'link',
      url: `https://example.org/garden-design-${s.id}.pdf`,
      note: 'CAD schematic and circuit diagram for prototype v1.',
      at: ago(3)
    }],
    coachFeedback: i % 2 === 0 ? {
      text: 'Circuit schematic looks solid. Ready to proceed to prototype testing.',
      coachId: coachUids[1],
      at: ago(2)
    } : null
  });

  // 5. Coach Records Store (Firestore backend matching firestore.rules)
  const learnerDoc = db.collection('learners').doc(sUser.uid);

  // Agreed Milestones (co-coaches can edit)
  await learnerDoc.collection('milestones').doc(`ms-${s.id}`).set({
    id: `ms-${s.id}`,
    title: `Complete prototype bench test for ${s.focus}`,
    dueOn: '2026-11-15',
    doneOn: i % 3 === 0 ? '2026-10-25' : null,
    authorUid: coachUids[0],
    at: ago(7),
    updatedAt: ago(2)
  });

  // Coach Goals (visible to student)
  await learnerDoc.collection('coachGoals').doc(`cg-${s.id}`).set({
    id: `cg-${s.id}`,
    text: 'Document 5 error cases during water flow calibration',
    dueOn: '2026-11-05',
    doneOn: null,
    authorUid: coachUids[1],
    at: ago(5),
    updatedAt: ago(5)
  });

  // Check-ins (author coach only)
  await learnerDoc.collection('checkIns').doc(`ci-${s.id}`).set({
    id: `ci-${s.id}`,
    strength: `Curious and self-directed`,
    challenge: `Needs practice on calibration timing`,
    nextAction: `Complete prototype bench test for ${s.focus}`,
    followUpOn: '2026-11-02',
    shareWithParent: true,
    authorUid: coachUids[0],
    at: ago(4),
    updatedAt: ago(4)
  });

  // Private Note (strictly private to author coach)
  await db.collection('coachPrivate').doc(coachUids[0]).collection('learners').doc(sUser.uid).collection('notes').doc(`pnt-${s.id}`).set({
    id: `pnt-${s.id}`,
    text: `Coach private reflection: ${s.first} needs extra scaffolding on soldering safety next Thursday.`,
    authorUid: coachUids[0],
    at: ago(4),
    updatedAt: ago(4)
  });
}

console.log(`✓ Seeded 10 Students (student.01@welearn.org .. student.10@welearn.org)`);
console.log(`✓ Seeded 10 Linked Parents (parent.01@welearn.org .. parent.10@welearn.org)`);
console.log(`✓ Seeded Enrolments, Phase Evidence, Milestones, Coach Goals, and Private Notes.\n`);
console.log(`🎉 10-10-3 Pilot Cohort successfully provisioned in emulator.`);
process.exit(0);
