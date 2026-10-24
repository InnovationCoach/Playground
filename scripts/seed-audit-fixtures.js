#!/usr/bin/env node
/**
 * scripts/seed-audit-fixtures.js
 *
 * Seeds synthetic test fixtures into the local Firestore emulator to test:
 * 1. Time tracking outliers (> 8 hours/day).
 * 2. Stale open sessions (> 5 min without heartbeat).
 * 3. Class drift cases (doubled strings, unmapped strings, student roles).
 *
 * Usage:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 GOOGLE_CLOUD_PROJECT=demo-hearisland-local node scripts/seed-audit-fixtures.js
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'demo-hearisland-local';

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

const db = getFirestore();

async function seed() {
  console.log(`\n🌱 Seeding synthetic QA audit fixtures into Firestore emulator...`);

  // 1. Synthetic user with outlier daily stats (> 8 hours / 480 minutes)
  const outlierUserRef = db.collection('users').doc('synthetic_outlier_learner');
  await outlierUserRef.set({
    uid: 'synthetic_outlier_learner',
    displayName: 'Sam Outlier',
    email: 'sam.outlier@welearn.org',
    role: 'student', // will test role migration
    groupName: 'Climate Champions 7AClimate Champions 7A', // doubled string
    classIds: [],
    createdAt: Date.now() - 86400000 * 5
  }, { merge: true });

  // Add 1353.5 minutes (22h 33.5m) daily stat
  await outlierUserRef.collection('dailyStats').doc('2026-10-23').set({
    date: '2026-10-23',
    timeSpentMinutes: 1353.5, // 22h 33.5m runaway session
    sessionsCount: 3,
    lastActiveAt: Date.now() - 86400000
  });

  // 2. Synthetic user with unmapped free-text class
  const unmappedUserRef = db.collection('users').doc('synthetic_unmapped_learner');
  await unmappedUserRef.set({
    uid: 'synthetic_unmapped_learner',
    displayName: 'Jordan Mystery',
    email: 'jordan.mystery@welearn.org',
    role: 'student',
    groupName: 'Autonomous Submarine Club (Unlisted)', // unmapped string
    classIds: [],
    createdAt: Date.now() - 86400000 * 2
  }, { merge: true });

  // Add 334.5 minutes (5h 34.5m) daily stat
  await unmappedUserRef.collection('dailyStats').doc('2026-10-24').set({
    date: '2026-10-24',
    timeSpentMinutes: 334.5,
    sessionsCount: 2,
    lastActiveAt: Date.now() - 3600000
  });

  // 3. Stale open session with no heartbeat for > 5 min
  const staleSessionRef = db.collection('sessions').doc('synthetic_stale_session_101');
  await staleSessionRef.set({
    uid: 'synthetic_outlier_learner',
    startedAt: Date.now() - 7200000, // 2 hours ago
    lastHeartbeatAt: Date.now() - 3600000 // 1 hour ago (stale > 5 min)
    // endedAt missing
  }, { merge: true });

  console.log(`✓ Seeded synthetic outlier learner (22h 33.5m on 2026-10-23)`);
  console.log(`✓ Seeded synthetic unmapped class string ("Autonomous Submarine Club (Unlisted)")`);
  console.log(`✓ Seeded synthetic stale session without endedAt`);
  console.log(`\nFixtures ready.\n`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
