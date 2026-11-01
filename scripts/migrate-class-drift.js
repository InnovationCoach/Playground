#!/usr/bin/env node

/**
 * Migration Script: Class Drift & Role Normalisation
 * Maps free-text class strings (including "Climate Champions 7AClimate Champions 7A")
 * to strict class IDs, updates classes.learnerIds, and normalises role:'student' -> 'learner'.
 *
 * Reports unmapped strings without guessing.
 *
 * Usage:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 GOOGLE_CLOUD_PROJECT=demo-hearisland-local node scripts/migrate-class-drift.js [--dry-run]
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const isDryRun = process.argv.includes('--dry-run');
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'demo-hearisland-local';

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

const db = getFirestore();

// Known deterministic mappings for known historical free-text strings
const KNOWN_DRIFT_MAP = {
  'climate champions': 'class_climate_champions_7a',
  'climate champions 7a': 'class_climate_champions_7a',
  'climate champions 7aclimate champions 7a': 'class_climate_champions_7a',
  'year 9 climate science': 'class_yr9_climate',
  'year 12 engineering': 'class_yr12_eng',
  'eco-designers 8b': 'class_eco_designers_8b',
  'green tech 9c': 'class_green_tech_9c'
};

export async function runClassDriftMigration(database = db, dryRun = isDryRun) {
  console.log(`\n======================================================`);
  console.log(` 📦 CLASS DRIFT & ROLE MIGRATION (DryRun: ${dryRun})`);
  console.log(`======================================================\n`);

  // 1. Fetch all existing classes
  const classesSnap = await database.collection('classes').get();
  const classMap = new Map(); // normalized name -> id
  const classDocs = new Map(); // id -> doc data

  classesSnap.forEach((docSnap) => {
    const data = docSnap.data();
    classDocs.set(docSnap.id, data);
    classMap.set(docSnap.id.toLowerCase(), docSnap.id);
    if (data.name) {
      classMap.set(data.name.toLowerCase().trim(), docSnap.id);
    }
  });

  // Ensure default climate champions class exists in map
  if (!classDocs.has('class_climate_champions_7a')) {
    classMap.set('class_climate_champions_7a', 'class_climate_champions_7a');
  }

  // 2. Scan all users
  const usersSnap = await database.collection('users').get();
  console.log(`Scanned ${usersSnap.size} user documents...\n`);

  let rolesMigrated = 0;
  let classesMapped = 0;
  const unmapped = [];
  const classLearnerAdditions = new Map(); // classId -> Set of uids

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    const uid = userDoc.id;
    let needsUpdate = false;
    const updates = {};

    // A. Role migration: 'student' -> 'learner'
    if (user.role === 'student') {
      updates.role = 'learner';
      needsUpdate = true;
      rolesMigrated++;
    }

    // B. Class drift resolution
    const currentClassIds = Array.isArray(user.classIds) ? [...user.classIds] : [];
    const groupString = (user.groupName || user.className || '').trim();

    if (groupString) {
      const normalizedGroup = groupString.toLowerCase();
      let matchedClassId = classMap.get(normalizedGroup) || KNOWN_DRIFT_MAP[normalizedGroup];

      // Handle doubled string e.g. "Climate Champions 7AClimate Champions 7A"
      if (!matchedClassId && normalizedGroup.length > 10) {
        const halfLen = Math.floor(normalizedGroup.length / 2);
        const firstHalf = normalizedGroup.slice(0, halfLen).trim();
        const secondHalf = normalizedGroup.slice(halfLen).trim();
        if (firstHalf === secondHalf) {
          matchedClassId = classMap.get(firstHalf) || KNOWN_DRIFT_MAP[firstHalf];
        }
      }

      if (matchedClassId) {
        if (!currentClassIds.includes(matchedClassId)) {
          currentClassIds.push(matchedClassId);
          updates.classIds = currentClassIds;
          needsUpdate = true;
          classesMapped++;
        }

        // Track learner membership for class document update
        if (user.role === 'learner' || user.role === 'student') {
          if (!classLearnerAdditions.has(matchedClassId)) {
            classLearnerAdditions.set(matchedClassId, new Set());
          }
          classLearnerAdditions.get(matchedClassId).add(uid);
        }
      } else {
        // DO NOT GUESS: record as unmapped for report
        unmapped.push({
          uid,
          email: user.email || 'no-email',
          groupString,
          role: user.role
        });
      }
    }

    if (needsUpdate && !dryRun) {
      await userDoc.ref.update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp()
      });
    }
  }

  // 3. Update classes.learnerIds
  for (const [classId, uids] of classLearnerAdditions.entries()) {
    const classRef = database.collection('classes').doc(classId);
    const classSnap = await classRef.get();
    if (!classSnap.exists) {
      if (!dryRun) {
        await classRef.set({
          name: classId.replace(/^class_/, '').replace(/_/g, ' ').toUpperCase(),
          coachIds: [],
          learnerIds: Array.from(uids),
          joinCodeActive: true,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    } else {
      if (!dryRun) {
        await classRef.update({
          learnerIds: FieldValue.arrayUnion(...Array.from(uids)),
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }
  }

  // 4. Print Summary Report
  console.log('------------------------------------------------------');
  console.log(`✓ Roles migrated ('student' -> 'learner'): ${rolesMigrated}`);
  console.log(`✓ Users mapped to strict class IDs:       ${classesMapped}`);
  console.log(`✓ Classes updated with learnerIds:        ${classLearnerAdditions.size}`);
  console.log('------------------------------------------------------');

  if (unmapped.length > 0) {
    console.warn(`\n⚠️  UNMAPPED FREE-TEXT STRINGS (${unmapped.length} records):`);
    console.table(unmapped);
    console.warn('Action required: Please provide class mapping for these entries.\n');
  } else {
    console.log('✓ All free-text class strings successfully mapped. Zero unmapped records.\n');
  }

  return { rolesMigrated, classesMapped, unmapped };
}

if (process.argv[1]?.endsWith('migrate-class-drift.js')) {
  runClassDriftMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
