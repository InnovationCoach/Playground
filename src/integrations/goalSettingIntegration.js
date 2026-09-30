/**
 * Goal Setting Integration
 * Coordinates first-time user detection and goal-setting flow via Firestore and localStorage
 */

import { createGoalSettingModal } from '../components/Goals/GoalSettingModal.js';
import { createGoalsDashboard } from '../components/Goals/GoalsDashboard.js';
import { db, doc, getDoc, updateDoc, setDoc } from '../firebase.js';

/**
 * The wizard stores its own state as a `goals` object on the user document, but
 * the coach dashboard reads one document per goal from users/{uid}/goals. Without
 * this the two never meet and every coach sees "0 students with goals".
 */
async function writeGoalsSubcollection(userId, goalData) {
  const list = Array.isArray(goalData?.goals) ? goalData.goals : [];
  if (!list.length) return;

  const createdAt = Date.parse(goalData.createdAt) || Date.now();
  const targetDate = new Date(createdAt + (goalData.durationDays || 30) * 86400000)
    .toISOString().slice(0, 10);
  const done = new Set((goalData.completedGoals || []).map(String));

  await Promise.all(list.map((entry, i) => {
    const title = typeof entry === 'string' ? entry : (entry?.title || entry?.text || `Goal ${i + 1}`);
    const goalId = `goal_${createdAt}_${i}`;
    const achieved = done.has(String(i)) || done.has(title);
    return setDoc(doc(db, 'users', userId, 'goals', goalId), {
      goalId,
      title,
      learningPath: goalData.learningPath || null,
      topic: goalData.topic || null,
      status: achieved ? 'achieved' : 'on_track',
      progress: achieved ? 1 : 0,
      targetDate,
      createdAt,
      source: 'goal-setting-wizard'
    }, { merge: true });
  }));

  console.log(`[GoalSetting] Mirrored ${list.length} goal(s) to users/${userId}/goals`);
}

export async function initializeGoalSettingForUser(userId) {
  console.log('[GoalSetting] Initializing goal setting for user:', userId);

  let goalData = null;
  let isFirstTime = false;

  // 1. First check user-scoped localStorage
  try {
    // Scoped to the user only: the old unscoped 'userGoals' fallback showed the
    // previous learner's goals on a shared device. See utils/deviceData.js.
    const stored = userId ? localStorage.getItem(`userGoals_${userId}`) : null;
    goalData = stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn('[GoalSetting] Could not read goals from localStorage:', e.message);
  }

  // 2. Query Firestore user doc for persistence across sessions & devices
  if (userId && db) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists) {
        const userData = userSnap.data();

        // Sync goals from Firestore if available
        if (userData.goals && Array.isArray(userData.goals.goals)) {
          goalData = userData.goals;
          try {
            localStorage.setItem(`userGoals_${userId}`, JSON.stringify(goalData));
          } catch (e) {
            console.warn('[GoalSetting] Syncing to localStorage failed:', e.message);
          }
          // Backfill for accounts that set goals before the subcollection existed.
          // setDoc is merge-based, so re-running this is harmless.
          writeGoalsSubcollection(userId, goalData)
            .catch(e => console.warn('[GoalSetting] Goal backfill failed:', e.message));
        }

        // Determine first-time status from Firestore
        if (userData.isFirstTimeUser !== undefined) {
          isFirstTime = userData.isFirstTimeUser;
        } else if (!goalData) {
          isFirstTime = true;
        }
      } else {
        // Doc doesn't exist yet - default to first-time user
        isFirstTime = true;
      }
    } catch (err) {
      console.warn('[GoalSetting] Error checking Firestore user doc:', err.message);
      // Fallback to localStorage
      try {
        isFirstTime = localStorage.getItem(`firstTimeUser_${userId}`) !== 'false';
      } catch (e) {
        isFirstTime = !goalData;
      }
    }
  } else if (!goalData) {
    isFirstTime = true;
  }

  // 3. If goals are set and user is not marked as first time, load dashboard
  if (goalData && !isFirstTime) {
    console.log('[GoalSetting] User goals loaded from storage/Firestore');
    loadGoalsDashboard(userId);
    return;
  }

  // 4. Trigger goal setting modal for first-time user
  if (isFirstTime || !goalData) {
    console.log('[GoalSetting] First-time user or missing goals detected - showing modal');
    showGoalSettingFlow(userId);
  } else {
    console.log('[GoalSetting] Returning user - loading goals dashboard');
    loadGoalsDashboard(userId);
  }
}

function showGoalSettingFlow(userId) {
  // Remove existing modal if any
  const existing = document.getElementById('goal-setting-modal');
  if (existing) existing.remove();

  // Create and display goal-setting modal
  const modal = createGoalSettingModal(userId);

  // Listen for goalsSet event
  const goalsSetHandler = async (e) => {
    window.removeEventListener('goalsSet', goalsSetHandler);
    const goalData = e.detail;
    console.log('[GoalSetting] Goals set event received:', goalData);

    // Save flag and goals to Firestore
    if (userId && db) {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          isFirstTimeUser: false,
          goals: goalData,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        await writeGoalsSubcollection(userId, goalData);
        console.log('[GoalSetting] Saved isFirstTimeUser: false and goals to Firestore');
      } catch (err) {
        console.error('[GoalSetting] Error updating Firestore for goal setting:', err.message);
      }
    }

    // Save to localStorage safely
    try {
      if (userId) localStorage.setItem(`firstTimeUser_${userId}`, 'false');
    } catch (e) {
      console.warn('[GoalSetting] LocalStorage write failed:', e.message);
    }

    setTimeout(() => {
      loadGoalsDashboard(userId);
    }, 400);
  };

  window.addEventListener('goalsSet', goalsSetHandler);
}

function loadGoalsDashboard(userId) {
  let container = document.getElementById('goals-dashboard-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'goals-dashboard-container';
    container.style.cssText = 'margin: 2rem 0;';
    const dashboardCard = document.getElementById('dashboard-card');
    if (dashboardCard) {
      dashboardCard.insertBefore(container, dashboardCard.firstChild);
    } else {
      document.body.appendChild(container);
    }
  }

  createGoalsDashboard('goals-dashboard-container', userId);
}
