/**
 * Behavior Tracking System for SEN Support
 *
 * Tracks:
 * - Click patterns
 * - Time spent on each task/component
 * - Scroll behavior
 * - Interaction delays (hesitation)
 * - Abandonment signals
 *
 * Used to trigger SEN chatbot assistance proactively
 */

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

class BehaviorTracker {
  constructor(userId) {
    this.userId = userId;
    this.sessionStart = Date.now();
    this.taskStartTime = null;
    this.currentTask = null;
    this.clicks = [];
    this.timeOnElements = {};
    this.scrollBehavior = [];
    this.hesitationDetected = false;
    this.abandonmentRisk = false;

    // SEN thresholds
    this.thresholds = {
      timeBeforeSuggestingHelp: 300000, // 5 minutes on same task
      clicksBeforeSuggestingHelp: 8, // Many clicks without progress
      hesitationDelay: 3000, // 3 seconds of inactivity = hesitation
      abandonmentTime: 600000 // 10 minutes of inactivity
    };

    this.listeners = [];
  }

  /**
   * Start tracking a new task
   */
  startTask(taskId, taskTitle) {
    this.currentTask = { id: taskId, title: taskTitle };
    this.taskStartTime = Date.now();
    this.clicks = [];
    this.timeOnElements = {};

    console.log(`[TRACKER] Started task: ${taskTitle}`);
  }

  /**
   * Track element clicks
   */
  trackClick(elementId, elementType, elementLabel) {
    if (!this.currentTask) return;

    const click = {
      elementId,
      elementType, // button, input, text, etc.
      elementLabel,
      timestamp: Date.now(),
      taskId: this.currentTask.id
    };

    this.clicks.push(click);

    // Check if too many clicks without progress (sign of struggle)
    if (this.clicks.length > this.thresholds.clicksBeforeSuggestingHelp) {
      this.abandonmentRisk = true;
      this.notifyListeners('struggle_detected', {
        reason: 'too_many_clicks',
        clickCount: this.clicks.length,
        taskId: this.currentTask.id
      });
    }

    console.log(`[TRACKER] Click on ${elementLabel} (${this.clicks.length} clicks on this task)`);
  }

  /**
   * Track time spent on specific elements
   */
  trackElementTime(elementId, elementLabel, duration) {
    if (!this.timeOnElements[elementId]) {
      this.timeOnElements[elementId] = { label: elementLabel, total: 0 };
    }

    this.timeOnElements[elementId].total += duration;
  }

  /**
   * Check if user is struggling (hesitation + time)
   */
  checkForStruggles() {
    if (!this.currentTask) return null;

    const timeOnTask = Date.now() - this.taskStartTime;
    const hasHesitation = this.detectHesitation();

    // Trigger help if stuck for 5+ minutes
    if (timeOnTask > this.thresholds.timeBeforeSuggestingHelp && this.clicks.length < 3) {
      return {
        type: 'passive_stuck',
        reason: 'spent_too_long_without_progress',
        timeSpent: timeOnTask,
        clicks: this.clicks.length,
        taskId: this.currentTask.id,
        taskTitle: this.currentTask.title,
        confidence: 'high'
      };
    }

    // Trigger help if many clicks + hesitation
    if (this.clicks.length > this.thresholds.clicksBeforeSuggestingHelp && hasHesitation) {
      return {
        type: 'active_struggling',
        reason: 'many_clicks_with_hesitation',
        timeSpent: timeOnTask,
        clicks: this.clicks.length,
        taskId: this.currentTask.id,
        taskTitle: this.currentTask.title,
        confidence: 'high'
      };
    }

    return null;
  }

  /**
   * Detect hesitation (long pauses between interactions)
   */
  detectHesitation() {
    if (this.clicks.length < 2) return false;

    const delays = [];
    for (let i = 1; i < this.clicks.length; i++) {
      const delay = this.clicks[i].timestamp - this.clicks[i - 1].timestamp;
      delays.push(delay);
    }

    // If last few clicks have 3+ second gaps, user is hesitating
    const recentDelays = delays.slice(-3);
    const avgDelay = recentDelays.reduce((a, b) => a + b, 0) / recentDelays.length;

    if (avgDelay > this.thresholds.hesitationDelay) {
      this.hesitationDetected = true;
      return true;
    }

    return false;
  }

  /**
   * End current task and record analytics
   */
  endTask(taskStatus = 'completed') {
    if (!this.currentTask) return null;

    const duration = Date.now() - this.taskStartTime;
    const data = {
      taskId: this.currentTask.id,
      taskTitle: this.currentTask.title,
      duration, // milliseconds
      clicks: this.clicks.length,
      hesitation: this.hesitationDetected,
      status: taskStatus, // completed, abandoned, helped
      clickSequence: this.clicks.map(c => c.elementLabel),
      timeOnElements: this.timeOnElements,
      timestamp: new Date().toISOString()
    };

    console.log(`[TRACKER] Ended task: ${this.currentTask.title} (${duration}ms, ${this.clicks.length} clicks)`);

    // Reset
    this.currentTask = null;
    this.taskStartTime = null;
    this.clicks = [];
    this.hesitationDetected = false;

    return data;
  }

  /**
   * Save behavior session to Firestore
   */
  async saveSession(challenges = []) {
    try {
      const userRef = doc(db, 'users', this.userId);
      const sessionData = {
        'behaviorAnalytics.lastSessionTime': Date.now(),
        'behaviorAnalytics.sessionsCount': (await this.getSessionCount()) + 1,
        'behaviorAnalytics.recentChallenges': challenges.slice(-5), // Last 5
        'behaviorAnalytics.updatedAt': serverTimestamp()
      };

      await updateDoc(userRef, sessionData);
      console.log('[TRACKER] Session saved to Firestore');
    } catch (error) {
      console.error('[TRACKER] Error saving session:', error);
    }
  }

  /**
   * Get total session count
   */
  async getSessionCount() {
    // This would be fetched from Firestore in a real app
    return 0;
  }

  /**
   * Register listener for behavior events
   */
  onBehaviorChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(eventType, data) {
    this.listeners.forEach(cb => {
      try {
        cb(eventType, data);
      } catch (error) {
        console.error('[TRACKER] Listener error:', error);
      }
    });
  }

  /**
   * Get current behavior summary
   */
  getSummary() {
    return {
      currentTask: this.currentTask,
      timeOnCurrentTask: this.currentTask ? Date.now() - this.taskStartTime : null,
      totalClicks: this.clicks.length,
      hasHesitation: this.hesitationDetected,
      abandonmentRisk: this.abandonmentRisk,
      sessionDuration: Date.now() - this.sessionStart
    };
  }

  /**
   * Reset tracker
   */
  reset() {
    this.sessionStart = Date.now();
    this.taskStartTime = null;
    this.currentTask = null;
    this.clicks = [];
    this.timeOnElements = {};
    this.scrollBehavior = [];
    this.hesitationDetected = false;
    this.abandonmentRisk = false;
  }
}

export default BehaviorTracker;
