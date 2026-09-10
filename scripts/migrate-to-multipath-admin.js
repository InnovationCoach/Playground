#!/usr/bin/env node

/**
 * Firestore Migration Script (Using Admin SDK)
 *
 * Migrates user data from old single-path schema to new multi-path schema
 *
 * Usage:
 *   node scripts/migrate-to-multipath-admin.js [--dry-run]
 *
 * Options:
 *   --dry-run    Preview changes without applying them
 */

import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'firebase-admin-key.json');

try {
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error('File not found at ' + serviceAccountPath);
  }
  const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(serviceAccountJson);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Error: firebase-admin-key.json not found at ' + serviceAccountPath);
  console.log('\n📝 To get your Firebase Admin Key:');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.log('2. Select your project: dnd-master-73449');
  console.log('3. Go to Settings → Service Accounts');
  console.log('4. Click "Generate New Private Key"');
  console.log('5. Save it as: scripts/firebase-admin-key.json');
  console.log('\n⚠️  Keep this file PRIVATE! Add to .gitignore');
  process.exit(1);
}

const db = admin.firestore();

console.log('🚀 HearIsland Firestore Migration');
console.log('==================================\n');

if (isDryRun) {
  console.log('⚠️  DRY RUN MODE - No changes will be made\n');
}

async function migrateUsers() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    console.log(`Found ${snapshot.size} users to process\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Skip if already migrated
      if (userData.learningPaths) {
        console.log(`✅ ${userId} - Already migrated`);
        skippedCount++;
        continue;
      }

      console.log(`📝 Processing ${userId}...`);

      try {
        // Build new schema
        const updates = {};

        // 1. Migrate learning path
        const pathId = userData.learningPath || 'climate';
        updates.learningPaths = {
          [pathId]: {
            started: userData.createdAt || new Date(),
            progress: userData.stats?.completedChallenges || 0,
            completedChallenges: [],
            currentChallenge: null
          }
        };

        // 2. Ensure preferences object exists and add SEN settings
        const preferences = userData.preferences || {};
        preferences.senSupport = {
          enabled: preferences.dyslexiaMode || false,
          autoHelpEnabled: preferences.dyslexiaMode || false,
          helpTriggerTime: 300000, // 5 minutes
          trackBehavior: preferences.dyslexiaMode || false,
          simplifiedUI: preferences.dyslexiaMode || false
        };
        updates.preferences = preferences;

        // 3. Add behavior analytics
        updates.behaviorAnalytics = {
          lastSessionTime: userData.updatedAt || null,
          sessionsCount: 1,
          trackingEnabled: preferences.dyslexiaMode || false,
          recentSessions: [],
          strugglesDetected: []
        };

        // 4. Enhance stats with path-specific data
        const stats = userData.stats || {};
        updates.stats = {
          ...stats,
          pathStats: {
            [pathId]: {
              points: stats.totalPoints || 0,
              completed: stats.completedChallenges || 0,
              started: userData.createdAt || new Date()
            }
          }
        };

        if (isDryRun) {
          console.log(`  → Would add learningPaths: { "${pathId}": {...} }`);
          console.log(`  → Would add senSupport settings`);
          console.log(`  → Would add behaviorAnalytics`);
          console.log(`  → Would add pathStats\n`);
        } else {
          // Apply updates
          await usersRef.doc(userId).update(updates);
          console.log(`  ✓ Migrated successfully\n`);
        }

        migratedCount++;
      } catch (error) {
        console.error(`  ✗ Error: ${error.message}\n`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Migration Summary');
    console.log('====================');
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`⏭️  Already migrated: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Total users: ${snapshot.size}`);

    if (isDryRun) {
      console.log('\n⚠️  This was a DRY RUN. To apply changes, run:');
      console.log('   node scripts/migrate-to-multipath-admin.js');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

    await admin.app().delete();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
