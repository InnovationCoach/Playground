/**
 * SEN Chatbot & Behavior Tracking Integration
 * Adds to existing vanilla JS app
 */

import { BehaviorTracker } from '../utils/behaviorTrackerVanilla.js';
import { SmartSENChatbot } from '../components/SEN/SmartSENChatbotVanilla.js';

export class SENIntegration {
  constructor(options = {}) {
    this.userId = options.userId || 'anonymous';
    this.senEnabled = options.senEnabled || false;
    this.geminiEndpoint = options.geminiEndpoint || 'http://localhost:3001/api';

    this.tracker = null;
    this.chatbot = null;
    this.currentActivityId = null;
    this.currentActivityTitle = null;

    if (this.senEnabled) {
      this.initializeTracker();
      this.initializeChatbot();
    }
  }

  initializeTracker() {
    this.tracker = new BehaviorTracker(this.userId, true);

    // Subscribe to struggle events
    this.tracker.subscribe((event) => {
      if (this.chatbot) {
        this.chatbot.autoOpen(event.data);
      }
    });

    console.log('[SENIntegration] Behavior tracker initialized');
  }

  initializeChatbot() {
    this.chatbot = new SmartSENChatbot({
      userId: this.userId,
      senEnabled: this.senEnabled,
      geminiEndpoint: this.geminiEndpoint,
      containerId: 'sen-chatbot-container'
    });

    console.log('[SENIntegration] SEN chatbot initialized');
  }

  startActivity(activityId, activityTitle) {
    this.currentActivityId = activityId;
    this.currentActivityTitle = activityTitle;

    if (this.tracker) {
      this.tracker.startTask(activityId, activityTitle);
    }

    if (this.chatbot) {
      this.chatbot.setCurrentTask(activityId, activityTitle);
    }

    console.log(`[SENIntegration] Started tracking: ${activityTitle}`);
  }

  endActivity(status = 'completed') {
    if (this.tracker) {
      const data = this.tracker.endTask(status);
      console.log('[SENIntegration] Activity ended:', data);
      return data;
    }
  }

  trackClick(elementId, label = '') {
    if (this.tracker) {
      this.tracker.trackClick(elementId, 'button', label);
    }
  }

  // Call when user starts a quiz or challenge
  startChallenge(challengeId, challengeTitle) {
    this.startActivity(challengeId, challengeTitle);
  }

  // Call when user completes a quiz
  completeChallenge() {
    this.endActivity('completed');
  }

  // Manual help trigger (if user clicks "Get Help" button)
  manualHelpTrigger() {
    if (this.chatbot) {
      this.chatbot.open();
    }
  }

  // Enable/disable tracking dynamically
  setSenEnabled(enabled) {
    this.senEnabled = enabled;

    if (enabled && !this.tracker) {
      this.initializeTracker();
      this.initializeChatbot();
    } else if (!enabled && this.tracker) {
      this.tracker.disable();
    }
  }
}

/**
 * Global integration instance (accessible from window)
 */
window.senIntegration = null;

export function initializeSENGlobally(options = {}) {
  try {
    window.senIntegration = new SENIntegration(options);
    return window.senIntegration;
  } catch (error) {
    console.error('[SENIntegration] Failed to initialize:', error.message);
    return null;
  }
}

export default SENIntegration;
