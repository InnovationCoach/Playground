#!/usr/bin/env node

/**
 * Seeds the WeLearn Design Thinking framework (frameworks/welearn-dt)
 * and the 6 official PBL Library programs (pbl_programs) into Firestore.
 *
 * Safe for Firebase emulator.
 * Usage:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 GOOGLE_CLOUD_PROJECT=demo-hearisland-local node scripts/seed-pbl-programs.js
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { WELEARN_DT_FRAMEWORK, LIBRARY_PROGRAMS } from '../src/features/pbl/programs/libraryProgramsData.js';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'demo-hearisland-local';

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

const db = getFirestore();

export async function seedFrameworkAndPrograms(database = db) {
  console.log(`\n🌱 Seeding WeLearn DT Framework & PBL Programs (Project: ${PROJECT_ID})...`);

  // 1. Seed frameworks/welearn-dt
  const frameworkRef = database.collection('frameworks').doc('welearn-dt');
  await frameworkRef.set({
    ...WELEARN_DT_FRAMEWORK,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('  ✓ Seeded frameworks/welearn-dt (8 phases: explore, empathise, define, ideate, prototype, test, showcase, reflect)');

  // 2. Seed 6 library programs into pbl_programs
  let count = 0;
  for (const prog of LIBRARY_PROGRAMS) {
    const progRef = database.collection('pbl_programs').doc(prog.id);
    await progRef.set({
      ...prog,
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt: prog.publishedAt || Date.now()
    }, { merge: true });
    count++;
    console.log(`  ✓ Seeded pbl_programs/${prog.id} ("${prog.title}")`);
  }

  console.log(`\n🎉 Successfully seeded framework and ${count} library programs!\n`);
}

// Execute if run directly from command line
if (process.argv[1]?.endsWith('seed-pbl-programs.js')) {
  seedFrameworkAndPrograms()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed seeding PBL programs:', err);
      process.exit(1);
    });
}
