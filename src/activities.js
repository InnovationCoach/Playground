/**
 * Activity Tracking Module
 * Integrates with SEN system to track activity engagement
 */

const ACTIVITIES = {
  home: { id: 'home', title: '🏠 Home Portal', type: 'nav' },
  phase1: { id: 'phase1', title: '🌴 Activity 1: Urban Heat', type: 'challenge' },
  bunker: { id: 'bunker', title: '🛡️ Activity 2: Bunker Survival', type: 'challenge' },
  coding: { id: 'coding', title: '🐍 Activity 3: Micro:bit Coding', type: 'challenge' },
  bangkok: { id: 'bangkok', title: '🌊 Activity 4: Bangkok Coastal', type: 'challenge' },
  'solar-car': { id: 'solar-car', title: '☀️ Activity 5: Solar Car', type: 'challenge' },
  solar: { id: 'solar', title: '☀️ Activity 5: Solar Car', type: 'challenge' }
};

let currentActivity = null;

/**
 * Start tracking an activity
 */
export function startActivity(activityId) {
  const activity = ACTIVITIES[activityId];
  if (!activity) {
    console.warn(`[Activities] Unknown activity: ${activityId}`);
    return;
  }

  currentActivity = activity;

  // Notify SEN system
  if (window.senIntegration && activity.type === 'challenge') {
    window.senIntegration.startActivity(activity.id, activity.title);
    console.log(`[Activities] Started tracking: ${activity.title}`);
  }
}

/**
 * End tracking current activity
 */
export function endActivity(status = 'completed') {
  if (!currentActivity) return;

  if (window.senIntegration && currentActivity.type === 'challenge') {
    const data = window.senIntegration.endActivity(status);
    console.log(`[Activities] Ended activity:`, data);
  }

  currentActivity = null;
}

/**
 * Track a button click in current activity
 */
export function trackActivityClick(elementId, label = '') {
  if (!currentActivity || currentActivity.type !== 'challenge') return;

  if (window.senIntegration) {
    window.senIntegration.trackClick(elementId, label);
  }
}

/**
 * Get current activity
 */
export function getCurrentActivity() {
  return currentActivity;
}

/**
 * Global handler for phase switching (call from HTML onclick)
 */
export function switchPhaseWithTracking(phase) {
  // End previous activity
  if (currentActivity) {
    endActivity('switched');
  }

  // Start new activity
  startActivity(phase);

  // Call the existing switchPhase function
  switchPhase(phase);
}

export default {
  startActivity,
  endActivity,
  trackActivityClick,
  getCurrentActivity,
  switchPhaseWithTracking
};
