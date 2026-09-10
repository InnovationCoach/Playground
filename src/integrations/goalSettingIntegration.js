/**
 * Goal Setting Integration
 * Coordinates first-time user detection and goal-setting flow via Firestore and localStorage
 */

import { createGoalSettingModal } from '../components/Goals/GoalSettingModal.js';
import { createGoalsDashboard } from '../components/Goals/GoalsDashboard.js';
import { db, doc, getDoc, updateDoc, setDoc } from '../firebase.js';

export async function initializeGoalSettingForUser(userId) {
  console.log('[GoalSetting] Initializing goal setting for user:', userId);

  let goalData = null;
  let isFirstTime = false;

  // 1. First check user-scoped localStorage
  try {
    const userScopedGoals = localStorage.getItem(`userGoals_${userId}`);
    const generalGoals = localStorage.getItem('userGoals');
    const stored = userScopedGoals || generalGoals;
    goalData = stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn('[GoalSetting] Could not read goals from localStorage:', e.message);
  }

  // 2. Query Firestore user doc for persistence across sessions & devices
  if (userId && db) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // Sync goals from Firestore if available
        if (userData.goals && Array.isArray(userData.goals.goals)) {
          goalData = userData.goals;
          try {
            localStorage.setItem(`userGoals_${userId}`, JSON.stringify(goalData));
            localStorage.setItem('userGoals', JSON.stringify(goalData));
          } catch (e) {
            console.warn('[GoalSetting] Syncing to localStorage failed:', e.message);
          }
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
        isFirstTime = localStorage.getItem(`firstTimeUser_${userId}`) !== 'false' &&
                      localStorage.getItem('firstTimeUser') !== 'false';
      } catch (e) {
        isFirstTime = !goalData;
      }
    }
  } else if (!goalData) {
    try {
      isFirstTime = localStorage.getItem('firstTimeUser') !== 'false';
    } catch (e) {
      isFirstTime = true;
    }
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
        console.log('[GoalSetting] Saved isFirstTimeUser: false and goals to Firestore');
      } catch (err) {
        console.error('[GoalSetting] Error updating Firestore for goal setting:', err.message);
      }
    }

    // Save to localStorage safely
    try {
      if (userId) localStorage.setItem(`firstTimeUser_${userId}`, 'false');
      localStorage.setItem('firstTimeUser', 'false');
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
