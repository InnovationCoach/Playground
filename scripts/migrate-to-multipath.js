/**
 * Firestore Migration Script
 *
 * Migrates user data from old single-path schema to new multi-path schema
 *
 * Usage:
 *   node scripts/migrate-to-multipath.js [--dry-run]
 *
 * Options:
 *   --dry-run    Preview changes without applying them
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  appId: process.env.FIREBASE_APP_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run');

console.log('🚀 HearIsland Firestore Migration');
console.log('==================================\n');

if (isDryRun) {
  console.log('⚠️  DRY RUN MODE - No changes will be made\n');
}

async function migrateUsers() {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    console.log(`Found ${snapshot.size} users to process\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    const batch = writeBatch(db);
    let batchSize = 0;

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
        updates.stats = {
          ...userData.stats,
          pathStats: {
            [pathId]: {
              points: userData.stats?.totalPoints || 0,
              completed: userData.stats?.completedChallenges || 0,
              started: userData.createdAt || new Date()
            }
          }
        };

        if (isDryRun) {
          console.log(`  → Would add learningPaths: { "${pathId}": {...} }`);
          console.log(`  → Would add senSupport settings`);
          console.log(`  → Would add behaviorAnalytics`);
        } else {
          // Apply updates
          batch.update(doc(db, 'users', userId), updates);
          batchSize++;

          // Commit batch every 100 users
          if (batchSize >= 100) {
            await batch.commit();
            console.log(`  ✓ Batch committed (100 users)`);
            batchSize = 0;
          }
        }

        migratedCount++;
        console.log(`  ✓ Ready to migrate\n`);
      } catch (error) {
        console.error(`  ✗ Error processing ${userId}:`, error.message);
      }
    }

    // Commit remaining batch
    if (batchSize > 0 && !isDryRun) {
      await batch.commit();
      console.log(`✓ Final batch committed (${batchSize} users)\n`);
    }

    // Summary
    console.log('\n📊 Migration Summary');
    console.log('====================');
    console.log(`✅ Ready to migrate: ${migratedCount}`);
    console.log(`⏭️  Already migrated: ${skippedCount}`);
    console.log(`📈 Total users: ${snapshot.size}`);

    if (isDryRun) {
      console.log('\n⚠️  This was a DRY RUN. To apply changes, run:');
      console.log('   node scripts/migrate-to-multipath.js');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUsers().then(() => {
  process.exit(0);
});
