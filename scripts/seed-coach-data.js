#!/usr/bin/env node

/**
 * Seed demo student data for the Coach Dashboard.
 *
 * Runs through the Admin SDK, which bypasses Firestore security rules. This is
 * deliberate: the rules correctly forbid a client from writing into other users'
 * documents, so seeding cannot be done from the browser.
 *
 * Usage:
 *   node scripts/seed-coach-data.js --dry-run
 *   node scripts/seed-coach-data.js
 *   node scripts/seed-coach-data.js --clean     # remove previously seeded docs
 *
 * Credentials (either one):
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
 *   scripts/firebase-admin-key.json
 */

// firebase-admin v14 ESM: auth() and firestore() are not on the default export.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');
const CLEAN = process.argv.includes('--clean');

const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) {
  console.error('\nRefusing to run seed-coach-data outside local emulator. FIRESTORE_EMULATOR_HOST must be set.\n');
  process.exit(1);
}

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'demo-hearisland-local';

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}
const db = getFirestore();

const DAY = 86400000;

// dailyStats documents are keyed by date, and the dashboard's engagement
// calculations read the most recent ones - so generate them relative to today
// rather than hardcoding, otherwise the seed goes stale.
const dayKey = (daysAgo) =>
  new Date(Date.now() - daysAgo * DAY).toISOString().slice(0, 10);

const STUDENTS = [
  {
    uid: 'student_test_1',
    displayName: 'Alex Test Student',
    email: 'alex.test@school.edu',
    cohortId: 'cohort-wls',
    cohortIds: ['cohort-wls'],
    gradeLevel: 7,
    groupName: 'WeLearn Lower Secondary',
    joinedDaysAgo: 7,
    dailyStats: [
      { daysAgo: 0, timeSpentMinutes: 55, sessionsCount: 3 },
      { daysAgo: 1, timeSpentMinutes: 60, sessionsCount: 3 },
      { daysAgo: 2, timeSpentMinutes: 35, sessionsCount: 2 }
    ],
    goals: [
      {
        id: 'goal_test_1',
        title: 'Solar Car Efficiency Target',
        targetMetric: 'Reach 15.0 W/kg',
        status: 'on_track',
        progress: 0.85,
        targetDate: dayKey(-20)
      }
    ],
    activityProgress: {
      'urban-heat': { completed: true, score: 88, timeSpentMinutes: 45 },
      bunker: { completed: true, score: 92, timeSpentMinutes: 60 },
      'solar-car': { completed: true, score: 445, timeSpentMinutes: 75 }
    },
    solarCar: {
      currentVersion: 4,
      score: { total: 445, efficiency: 200, aerodynamics: 120, innovation: 75, speed: 50 },
      weight: { total: 2900 },
      components: { chassis: 'carbon_tube', motor: 'bldc', solarPanel: 'solar_30w', battery: 'li_poly_3s' },
      specs: { dragCoefficient: 0.04, aerodynamicRating: 'excellent' }
    }
  },
  {
    uid: 'student_test_2',
    displayName: 'Jordan Student',
    email: 'jordan.test@school.edu',
    cohortId: 'cohort-wls',
    cohortIds: ['cohort-wls'],
    gradeLevel: 8,
    groupName: 'WeLearn Lower Secondary',
    joinedDaysAgo: 5,
    dailyStats: [
      { daysAgo: 0, timeSpentMinutes: 45, sessionsCount: 2 },
      { daysAgo: 2, timeSpentMinutes: 50, sessionsCount: 2 }
    ],
    goals: [
      {
        id: 'goal_test_2',
        title: 'Complete Bunker Survival Challenge',
        targetMetric: 'Survival score above 80',
        status: 'on_track',
        progress: 0.6,
        targetDate: dayKey(-14)
      }
    ],
    activityProgress: {
      bunker: { completed: true, score: 78, timeSpentMinutes: 50 },
      'solar-car': { completed: false, score: 380, timeSpentMinutes: 40 }
    },
    solarCar: {
      currentVersion: 3,
      score: { total: 380, efficiency: 170, aerodynamics: 110, innovation: 60, speed: 40 },
      weight: { total: 3100 },
      components: { chassis: 'aluminum_frame', motor: 'brushed_dc', solarPanel: 'solar_30w' }
    }
  },
  {
    uid: 'student_test_3',
    displayName: 'Taylor Student',
    email: 'taylor.test@school.edu',
    cohortId: 'cohort-whs',
    cohortIds: ['cohort-whs'],
    gradeLevel: 10,
    groupName: 'WeLearn Higher Secondary',
    joinedDaysAgo: 3,
    dailyStats: [
      { daysAgo: 0, timeSpentMinutes: 46, sessionsCount: 3 },
      { daysAgo: 1, timeSpentMinutes: 30, sessionsCount: 1 }
    ],
    goals: [
      {
        id: 'goal_test_3',
        title: 'Bangkok Coastal Defence Plan',
        targetMetric: 'Evacuate 90% of residents',
        status: 'at_risk',
        progress: 0.35,
        targetDate: dayKey(-7)
      }
    ],
    activityProgress: {
      bangkok: { completed: false, score: 55, timeSpentMinutes: 30 },
      'solar-car': { completed: true, score: 410, timeSpentMinutes: 46 }
    },
    solarCar: {
      currentVersion: 5,
      score: { total: 410, efficiency: 190, aerodynamics: 115, innovation: 65, speed: 40 },
      weight: { total: 3000 },
      components: { chassis: 'carbon_tube', motor: 'bldc', solarPanel: 'solar_30w' }
    }
  }
];

async function clean() {
  for (const s of STUDENTS) {
    for (const sub of ['goals', 'dailyStats', 'activityProgress']) {
      const snap = await db.collection('users').doc(s.uid).collection(sub).get();
      for (const d of snap.docs) {
        console.log(`  delete users/${s.uid}/${sub}/${d.id}`);
        if (!DRY_RUN) await d.ref.delete();
      }
    }
    console.log(`  delete users/${s.uid}`);
    console.log(`  delete solarCar_prototypes/${s.uid}`);
    if (!DRY_RUN) {
      await db.collection('users').doc(s.uid).delete();
      await db.collection('solarCar_prototypes').doc(s.uid).delete();
    }
  }
}

async function seed() {
  for (const s of STUDENTS) {
    const userRef = db.collection('users').doc(s.uid);

    console.log(`  users/${s.uid}  (${s.displayName})`);
    if (!DRY_RUN) {
      await userRef.set({
        uid: s.uid,
        displayName: s.displayName,
        email: s.email,
        groupName: s.groupName,
        cohortId: s.cohortId,
        cohortIds: s.cohortIds,
        gradeLevel: s.gradeLevel,
        role: 'student',
        isSeedData: true,
        createdAt: Date.now() - s.joinedDaysAgo * DAY
      }, { merge: true });
    }

    for (const stat of s.dailyStats) {
      const key = dayKey(stat.daysAgo);
      console.log(`    dailyStats/${key}  ${stat.timeSpentMinutes}min`);
      if (!DRY_RUN) {
        await userRef.collection('dailyStats').doc(key).set({
          date: key,
          timeSpentMinutes: stat.timeSpentMinutes,
          sessionsCount: stat.sessionsCount,
          lastActiveAt: Date.now() - stat.daysAgo * DAY
        }, { merge: true });
      }
    }

    for (const goal of s.goals) {
      const { id, ...goalData } = goal;
      console.log(`    goals/${id}  "${goal.title}" (${goal.status})`);
      if (!DRY_RUN) {
        await userRef.collection('goals').doc(id).set({ goalId: id, ...goalData }, { merge: true });
      }
    }

    for (const [activityId, progress] of Object.entries(s.activityProgress)) {
      console.log(`    activityProgress/${activityId}  score ${progress.score}`);
      if (!DRY_RUN) {
        await userRef.collection('activityProgress').doc(activityId).set(progress, { merge: true });
      }
    }

    console.log(`  solarCar_prototypes/${s.uid}  v${s.solarCar.currentVersion}, ${s.solarCar.score.total}pts`);
    if (!DRY_RUN) {
      await db.collection('solarCar_prototypes').doc(s.uid).set({
        userId: s.uid,
        teamId: `team_${s.uid}`,
        teamName: `${s.displayName.split(' ')[0]}'s Solar Car`,
        isSeedData: true,
        ...s.solarCar
      }, { merge: true });
    }
  }
}

const mode = CLEAN ? 'CLEAN' : 'SEED';
console.log(`\n${mode}${DRY_RUN ? ' (dry run - nothing will be written)' : ''}\n`);

try {
  await (CLEAN ? clean() : seed());
  console.log(`\n${DRY_RUN ? 'Dry run complete.' : `${mode} complete.`}`);
  console.log(`${STUDENTS.length} students, ${STUDENTS.reduce((n, s) => n + s.goals.length, 0)} goals\n`);
  process.exit(0);
} catch (err) {
  console.error('\nFailed:', err.message, '\n');
  process.exit(1);
}
