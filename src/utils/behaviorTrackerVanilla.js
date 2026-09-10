/**
 * Behavior Tracking System for HearIsland (Vanilla JS)
 * Monitors user interactions and detects when they're struggling
 * Auto-triggers help system when needed
 */

export class BehaviorTracker {
  constructor(userId, enableTracking = false) {
    this.userId = userId;
    this.enabled = enableTracking;
    this.taskStartTime = null;
    this.taskId = null;
    this.clickCount = 0;
    this.lastClickTime = null;
    this.hesitations = [];
    this.listeners = [];
    this.taskData = {
      clicks: [],
      timeOnTask: 0,
      hesitations: [],
      struggles: []
    };

    // Configurable thresholds
    this.thresholds = {
      timeBeforeSuggestingHelp: 300000,    // 5 minutes
      clicksBeforeSuggestingHelp: 8,       // 8 clicks
      hesitationDelay: 3000,               // 3 second gaps
      abandonmentTime: 600000              // 10 minutes
    };
  }

  startTask(taskId, taskTitle) {
    if (!this.enabled) return;

    this.taskId = taskId;
    this.taskStartTime = Date.now();
    this.clickCount = 0;
    this.lastClickTime = this.taskStartTime;
    this.hesitations = [];
    this.taskData = {
      taskId,
      taskTitle,
      startTime: this.taskStartTime,
      clicks: [],
      timeOnTask: 0,
      hesitations: [],
      struggles: []
    };

    console.log(`[BehaviorTracker] Started tracking: ${taskTitle}`);
  }

  trackClick(elementId, elementType, label = '') {
    if (!this.enabled || !this.taskStartTime) return;

    const now = Date.now();
    this.clickCount++;

    // Check for hesitation (gap between clicks)
    if (this.lastClickTime) {
      const timeSinceLastClick = now - this.lastClickTime;
      if (timeSinceLastClick > this.thresholds.hesitationDelay) {
        this.hesitations.push({
          gap: timeSinceLastClick,
          timestamp: now
        });
      }
    }

    this.lastClickTime = now;
    this.taskData.clicks.push({
      elementId,
      elementType,
      label,
      timestamp: now
    });

    // Check for struggle patterns
    this.detectStruggles();
  }

  detectStruggles() {
    if (!this.taskStartTime) return;

    const now = Date.now();
    const elapsed = now - this.taskStartTime;

    // Pattern 1: Passive stuck (5+ minutes with <3 clicks)
    if (elapsed >= this.thresholds.timeBeforeSuggestingHelp && this.clickCount < 3) {
      this.notifyListeners({
        type: 'passive_stuck',
        data: {
          timeElapsed: elapsed,
          clickCount: this.clickCount,
          message: `User has been on task for ${Math.round(elapsed / 60000)} minutes with minimal interactions.`
        }
      });
      return;
    }

    // Pattern 2: Active struggling (8+ clicks + hesitations)
    if (this.clickCount >= this.thresholds.clicksBeforeSuggestingHelp && this.hesitations.length > 0) {
      const recentHesitations = this.hesitations.filter(
        h => now - h.timestamp < this.thresholds.timeBeforeSuggestingHelp
      ).length;

      if (recentHesitations > 0) {
        this.notifyListeners({
          type: 'active_struggling',
          data: {
            clickCount: this.clickCount,
            hesitationCount: recentHesitations,
            message: `User is clicking frequently with hesitation gaps (${recentHesitations} pauses detected).`
          }
        });
        return;
      }
    }

    // Pattern 3: Hesitant (multiple 3+ second gaps)
    if (this.hesitations.length >= 2) {
      const longGaps = this.hesitations.filter(
        h => h.gap >= this.thresholds.hesitationDelay * 2
      ).length;

      if (longGaps > 0) {
        this.notifyListeners({
          type: 'hesitant',
          data: {
            hesitationCount: longGaps,
            message: `User is showing signs of hesitation (${longGaps} long pauses).`
          }
        });
      }
    }
  }

  endTask(status = 'completed') {
    if (!this.taskStartTime) return null;

    const endTime = Date.now();
    const timeOnTask = endTime - this.taskStartTime;

    const data = {
      taskId: this.taskId,
      startTime: this.taskStartTime,
      endTime,
      timeOnTask,
      clickCount: this.clickCount,
      hesitations: this.hesitations,
      status,
      taskData: this.taskData
    };

    console.log('[BehaviorTracker] Task ended:', data);

    // Reset for next task
    this.taskStartTime = null;
    this.taskId = null;
    this.clickCount = 0;
    this.lastClickTime = null;
    this.hesitations = [];

    return data;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners(event) {
    if (this.enabled) {
      console.log('[BehaviorTracker] Struggle detected:', event);
      this.listeners.forEach(listener => listener(event));
    }
  }

  setThreshold(key, value) {
    if (this.thresholds.hasOwnProperty(key)) {
      this.thresholds[key] = value;
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

export default BehaviorTracker;
