/**
 * Daily Active Platform Screen Time Tracker
 * Tracks active engagement time per user per day in Firestore,
 * and maintains sessions/{sessionId} with 60s heartbeats and 5min timeout.
 */

import { db, doc, updateDoc, setDoc, increment, serverTimestamp } from '../firebase.js';

let trackerInterval = null;
let currentUserId = null;
let currentSessionId = null;
let lastHeartbeatTime = 0;
let isTabActive = true;
let activeSecondsThisSession = 0;

const HEARTBEAT_INTERVAL_MS = 60000; // 60 seconds
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateSessionId(userId) {
  const rand = Math.random().toString(36).substring(2, 9);
  return `${userId}_${Date.now()}_${rand}`;
}

/**
 * Start tracking daily time and session for a user
 */
export function startTimeTracking(userId) {
  if (!userId || userId === 'anonymous') return;
  if (currentUserId === userId && trackerInterval) return;

  stopTimeTracking();
  currentUserId = userId;
  currentSessionId = generateSessionId(userId);
  lastHeartbeatTime = Date.now();
  activeSecondsThisSession = 0;
  isTabActive = !document.hidden;

  // Initialize session doc
  initSessionDoc(currentSessionId, userId);

  // Tab visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('beforeunload', handlePageHide);

  // Heartbeat every 60 seconds to flush active seconds
  trackerInterval = setInterval(() => {
    if (isTabActive) {
      activeSecondsThisSession += 60;
      logSessionHeartbeat(false);
    }
  }, HEARTBEAT_INTERVAL_MS);
}

async function initSessionDoc(sessionId, userId) {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const now = Date.now();
    await setDoc(sessionRef, {
      uid: userId,
      startedAt: now,
      lastHeartbeatAt: now,
      createdAt: serverTimestamp()
    }, { merge: true });

    // Initialize dailyStats session count
    const today = getTodayKey();
    const statsRef = doc(db, 'users', userId, 'dailyStats', today);
    await updateDoc(statsRef, {
      sessionsCount: increment(1),
      lastActiveAt: now,
      updatedAt: serverTimestamp()
    }).catch(async () => {
      await setDoc(statsRef, {
        date: today,
        timeSpentMinutes: 0,
        sessionsCount: 1,
        lastActiveAt: now,
        createdAt: now
      }, { merge: true });
    });
  } catch (err) {
    console.warn('[TimeTracker] Failed to init session doc:', err.message);
  }
}

function handleVisibilityChange() {
  const now = Date.now();
  if (document.hidden) {
    isTabActive = false;
  } else {
    // If returning after longer than SESSION_TIMEOUT_MS, close old session and start fresh
    if (now - lastHeartbeatTime > SESSION_TIMEOUT_MS) {
      closeSession(currentSessionId, lastHeartbeatTime);
      currentSessionId = generateSessionId(currentUserId);
      initSessionDoc(currentSessionId, currentUserId);
    }
    isTabActive = true;
    lastHeartbeatTime = now;
  }
}

function handleFocus() {
  isTabActive = true;
}

function handleBlur() {
  isTabActive = false;
}

function handlePageHide() {
  if (currentSessionId) {
    closeSession(currentSessionId, Date.now());
  }
}

async function closeSession(sessionId, endedAtTime) {
  if (!sessionId) return;
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      endedAt: endedAtTime,
      lastHeartbeatAt: endedAtTime,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    // Non-fatal if session update fails on close
  }
}

async function logSessionHeartbeat(isNewSession = false) {
  if (!currentUserId || !currentSessionId) return;
  const today = getTodayKey();
  const now = Date.now();
  lastHeartbeatTime = now;

  try {
    // 1. Update session document
    const sessionRef = doc(db, 'sessions', currentSessionId);
    await updateDoc(sessionRef, {
      lastHeartbeatAt: now,
      updatedAt: serverTimestamp()
    }).catch(() => null);

    // 2. Update daily stats
    const statsRef = doc(db, 'users', currentUserId, 'dailyStats', today);
    const minutesToAdd = Math.round((activeSecondsThisSession / 60) * 10) / 10;
    activeSecondsThisSession = 0; // reset accumulated buffer

    const updateData = {
      lastActiveAt: now,
      updatedAt: serverTimestamp()
    };

    if (minutesToAdd > 0) {
      updateData.timeSpentMinutes = increment(minutesToAdd);
    }
    if (isNewSession) {
      updateData.sessionsCount = increment(1);
    }

    await updateDoc(statsRef, updateData).catch(async () => {
      await setDoc(statsRef, {
        date: today,
        timeSpentMinutes: minutesToAdd > 0 ? minutesToAdd : 0,
        sessionsCount: isNewSession ? 1 : 0,
        lastActiveAt: now,
        createdAt: now
      }, { merge: true });
    });
  } catch (err) {
    console.warn('[TimeTracker] Failed to record time heartbeat:', err.message);
  }
}

/**
 * Stop tracking time and close active session
 */
export function stopTimeTracking() {
  if (trackerInterval) {
    clearInterval(trackerInterval);
    trackerInterval = null;
  }

  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('focus', handleFocus);
  window.removeEventListener('blur', handleBlur);
  window.removeEventListener('pagehide', handlePageHide);
  window.removeEventListener('beforeunload', handlePageHide);

  if (currentSessionId) {
    closeSession(currentSessionId, Date.now());
    currentSessionId = null;
  }

  if (currentUserId && activeSecondsThisSession > 0) {
    logSessionHeartbeat(false);
  }
  currentUserId = null;
}

export default {
  startTimeTracking,
  stopTimeTracking
};
