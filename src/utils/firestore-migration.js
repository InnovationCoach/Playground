/**
 * Firestore Migration Utilities
 *
 * Use these functions to migrate existing user data to the new schema
 * with learning paths and preferences.
 */

import {
  doc,
  updateDoc,
  getDoc,
  query,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * Migrate a single user to the new schema
 * Safe to run multiple times - only adds missing fields
 */
export async function migrateUserToNewSchema(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.warn(`User ${uid} does not exist`);
      return { success: false, message: 'User not found' };
    }

    const userData = userDoc.data();

    // Build update object with only missing fields
    const updates = {};

    // Add learningPath if missing
    if (!userData.learningPath) {
      updates.learningPath = null; // Will be set when user logs in
    }

    // Add profile if missing
    if (!userData.profile) {
      updates.profile = {
        bio: userData.bio || '',
        interests: userData.interests || [],
        joinedAt: userData.createdAt || serverTimestamp(),
        pathSelectedAt: null
      };
    }

    // Add preferences if missing
    if (!userData.preferences) {
      updates.preferences = {
        theme: 'dark',
        fontSize: 'medium',
        dyslexiaMode: false,
        highContrast: false,
        reduceAnimations: false,
        language: 'en',
        difficultyLevel: 'beginner',
        learningPace: 'self-paced'
      };
    }

    // Add stats if missing
    if (!userData.stats) {
      updates.stats = {
        totalPoints: 0,
        completedChallenges: 0,
        currentStreak: 0,
        lastActive: userData.updatedAt || serverTimestamp()
      };
    }

    // Update user document
    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
      console.log(`✓ Migrated user ${uid}`);
      return { success: true, message: 'User migrated successfully', updates };
    } else {
      console.log(`User ${uid} already has new schema`);
      return { success: true, message: 'User already migrated', updates: {} };
    }
  } catch (error) {
    console.error(`Error migrating user ${uid}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * Batch migrate all users in the database
 * This is a heavy operation - use sparingly!
 */
export async function batchMigrateAllUsers() {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const batch = writeBatch(db);
    let migratedCount = 0;
    let skippedCount = 0;

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const updates = {};

      // Check what needs to be added
      if (!userData.learningPath) {
        updates.learningPath = null;
      }

      if (!userData.profile) {
        updates.profile = {
          bio: userData.bio || '',
          interests: userData.interests || [],
          joinedAt: userData.createdAt || serverTimestamp(),
          pathSelectedAt: null
        };
      }

      if (!userData.preferences) {
        updates.preferences = {
          theme: 'dark',
          fontSize: 'medium',
          dyslexiaMode: false,
          highContrast: false,
          reduceAnimations: false,
          language: 'en',
          difficultyLevel: 'beginner',
          learningPace: 'self-paced'
        };
      }

      if (!userData.stats) {
        updates.stats = {
          totalPoints: 0,
          completedChallenges: 0,
          currentStreak: 0,
          lastActive: userData.updatedAt || serverTimestamp()
        };
      }

      if (Object.keys(updates).length > 0) {
        batch.update(userDoc.ref, updates);
        migratedCount++;
      } else {
        skippedCount++;
      }
    });

    await batch.commit();
    console.log(`✓ Migration complete: ${migratedCount} users updated, ${skippedCount} already migrated`);
    return {
      success: true,
      message: `Migrated ${migratedCount} users, ${skippedCount} already have new schema`,
      migratedCount,
      skippedCount
    };
  } catch (error) {
    console.error('Error in batch migration:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Ensure a user has all required fields (call on login if needed)
 */
export async function ensureUserHasNewSchema(uid) {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return false;
  }

  const userData = userDoc.data();
  const updates = {};

  // Only add missing fields
  if (!userData.learningPath !== undefined) {
    updates.learningPath = userData.learningPath || null;
  }

  if (!userData.preferences) {
    updates.preferences = {
      theme: 'dark',
      fontSize: 'medium',
      dyslexiaMode: false,
      highContrast: false,
      reduceAnimations: false,
      language: 'en',
      difficultyLevel: 'beginner',
      learningPace: 'self-paced'
    };
  }

  if (!userData.stats) {
    updates.stats = {
      totalPoints: 0,
      completedChallenges: 0,
      currentStreak: 0,
      lastActive: serverTimestamp()
    };
  }

  if (!userData.profile) {
    updates.profile = {
      bio: '',
      interests: [],
      joinedAt: userData.createdAt || serverTimestamp(),
      pathSelectedAt: null
    };
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(userRef, updates);
    return true;
  }

  return false;
}

/**
 * Get migration status - how many users have been migrated
 */
export async function getMigrationStatus() {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let totalUsers = 0;
    let migratedUsers = 0;

    usersSnapshot.forEach((userDoc) => {
      totalUsers++;
      const userData = userDoc.data();

      // Check if user has all new fields
      if (
        userData.learningPath !== undefined &&
        userData.preferences &&
        userData.stats &&
        userData.profile
      ) {
        migratedUsers++;
      }
    });

    return {
      totalUsers,
      migratedUsers,
      pendingUsers: totalUsers - migratedUsers,
      migrationPercentage: totalUsers > 0 ? Math.round((migratedUsers / totalUsers) * 100) : 0
    };
  } catch (error) {
    console.error('Error getting migration status:', error);
    return { error: error.message };
  }
}

/**
 * Initialize new user with complete schema
 * Call this when creating a new user account
 */
export function getNewUserDefaults(email, displayName = '') {
  return {
    uid: '', // Will be set by auth
    email,
    displayName: displayName || email.split('@')[0],
    learningPath: null, // User will select during onboarding
    profile: {
      bio: '',
      interests: [],
      joinedAt: serverTimestamp(),
      pathSelectedAt: null
    },
    preferences: {
      theme: 'dark',
      fontSize: 'medium',
      dyslexiaMode: false,
      highContrast: false,
      reduceAnimations: false,
      language: 'en',
      difficultyLevel: 'beginner',
      learningPace: 'self-paced'
    },
    stats: {
      totalPoints: 0,
      completedChallenges: 0,
      currentStreak: 0,
      lastActive: null
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

/**
 * Export user data for backup/analysis
 */
export async function exportUserData(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    // Get user data
    const userData = userDoc.data();

    // Get subcollections if they exist
    const notesSnapshot = await getDocs(collection(db, 'users', uid, 'notes'));
    const progressSnapshot = await getDocs(collection(db, 'users', uid, 'progress'));

    return {
      user: userData,
      notes: notesSnapshot.docs.map(doc => doc.data()),
      progress: progressSnapshot.docs.map(doc => doc.data()),
      exportedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error exporting user data:', error);
    return null;
  }
}

/**
 * Run this in the browser console to check migration status:
 *
 * import { getMigrationStatus } from './utils/firestore-migration.js';
 * const status = await getMigrationStatus();
 * console.table(status);
 */

/**
 * Run this in the browser console to migrate all users:
 *
 * import { batchMigrateAllUsers } from './utils/firestore-migration.js';
 * const result = await batchMigrateAllUsers();
 * console.log(result);
 */
