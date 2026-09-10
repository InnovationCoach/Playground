/**
 * Daily Active Platform Screen Time Tracker
 * Tracks active engagement time per user per day in Firestore
 */

import { db, doc, updateDoc, setDoc, increment, serverTimestamp } from '../firebase.js';

let trackerInterval = null;
let currentUserId = null;
let isTabActive = true;
let activeSecondsThisSession = 0;

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Start tracking daily time for a user
 */
export function startTimeTracking(userId) {
  if (!userId || userId === 'anonymous') return;
  if (currentUserId === userId && trackerInterval) return;

  stopTimeTracking();
  currentUserId = userId;
  activeSecondsThisSession = 0;
  isTabActive = !document.hidden;

  // Log session start
  logSessionHeartbeat(true);

  // Tab visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);

  // Heartbeat every 30 seconds to flush active seconds
  trackerInterval = setInterval(() => {
    if (isTabActive) {
      activeSecondsThisSession += 30;
      logSessionHeartbeat(false);
    }
  }, 30000);
}

function handleVisibilityChange() {
  isTabActive = !document.hidden;
  if (isTabActive) {
    logSessionHeartbeat(false);
  }
}

function handleFocus() {
  isTabActive = true;
}

function handleBlur() {
  isTabActive = false;
}

async function logSessionHeartbeat(isNewSession = false) {
  if (!currentUserId) return;
  const today = getTodayKey();

  try {
    const statsRef = doc(db, 'users', currentUserId, 'dailyStats', today);
    const minutesToAdd = Math.round((activeSecondsThisSession / 60) * 10) / 10;
    activeSecondsThisSession = 0; // reset accumulated buffer

    const updateData = {
      lastActiveAt: Date.now(),
      updatedAt: serverTimestamp()
    };

    if (minutesToAdd > 0) {
      updateData.timeSpentMinutes = increment(minutesToAdd);
    }
    if (isNewSession) {
      updateData.sessionsCount = increment(1);
    }

    await updateDoc(statsRef, updateData).catch(async () => {
      // Create record if doesn't exist
      await setDoc(statsRef, {
        date: today,
        timeSpentMinutes: minutesToAdd > 0 ? minutesToAdd : 0,
        sessionsCount: isNewSession ? 1 : 0,
        lastActiveAt: Date.now(),
        createdAt: Date.now()
      }, { merge: true });
    });
  } catch (err) {
    console.warn('[TimeTracker] Failed to record time heartbeat:', err.message);
  }
}

/**
 * Stop tracking time
 */
export function stopTimeTracking() {
  if (trackerInterval) {
    clearInterval(trackerInterval);
    trackerInterval = null;
  }

  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('focus', handleFocus);
  window.removeEventListener('blur', handleBlur);

  if (currentUserId && activeSecondsThisSession > 0) {
    logSessionHeartbeat(false);
  }
  currentUserId = null;
}

export default {
  startTimeTracking,
  stopTimeTracking
};
