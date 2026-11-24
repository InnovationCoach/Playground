/**
 * Goal Notification Bridge — Connects the redesigned Goal Management system
 * to Spark's EXISTING notification infrastructure (`studentProfileService.js`,
 * `NotificationBell.jsx`, and `DailyGoalsNotice.jsx`) without replacing or
 * rebuilding the notification engine.
 *
 * Features:
 *   - Shows daily Academic goals
 *   - Shows daily PBL actions
 *   - Reminds students about approaching deadlines (due within 3 days)
 *   - Handles overdue tasks
 *   - Excludes completed goals and completed steps
 *   - Prevents duplicate notifications via deterministic IDs & read tracking
 *   - Respects existing notification preferences (`plan.notificationPrefs` & `reminderSnoozedUntil_${uid}`)
 *   - Keeps Academic and PBL notifications clearly distinguishable while using the same notification store
 */
import { hydratePlan, dayKey, goalDeadlineStatus, DEFAULT_NOTIFICATION_PREFS } from './goalPlan.js';

export const GOAL_NOTIF_READ_KEY = (uid) => `goalNotifRead_${uid || 'signed-out'}`;

function readReadMap(uid) {
  if (!uid || typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(GOAL_NOTIF_READ_KEY(uid));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveGoalNotifRead(uid, notifId, timestamp = Date.now()) {
  if (!uid || !notifId || typeof localStorage === 'undefined') return;
  try {
    const current = readReadMap(uid);
    current[notifId] = timestamp;
    // Prune to most recent 100 entries so localStorage stays tiny
    const entries = Object.entries(current).slice(-100);
    localStorage.setItem(GOAL_NOTIF_READ_KEY(uid), JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Private browsing or quota
  }
}

export function isReminderSnoozed(uid, nowMs = Date.now()) {
  if (!uid || typeof localStorage === 'undefined') return false;
  try {
    const raw = localStorage.getItem(`reminderSnoozedUntil_${uid}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const until = Date.parse(parsed || raw);
    return Number.isFinite(until) && until > nowMs;
  } catch {
    return false;
  }
}

/**
 * Pure function that builds deduplicated goal notifications from a learner's `goalPlan`.
 *
 * @param {object} plan       Hydrated or raw goalPlan
 * @param {object} [options]  { uid, today, nowMs, readMap, snoozed }
 * @returns {Array<{id, type, category, title, body, link, createdAt, readAt}>}
 */
export function buildGoalNotificationsForPlan(plan, options = {}) {
  if (!plan || typeof plan !== 'object') return [];
  const hydrated = plan.version ? plan : hydratePlan(plan);
  const uid = options.uid || 'learner';
  const today = options.today || dayKey();
  const nowMs = options.nowMs || Date.now();
  const readMap = options.readMap || readReadMap(uid);
  const snoozed = options.snoozed !== undefined ? options.snoozed : isReminderSnoozed(uid, nowMs);

  const prefs = {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...(hydrated.notificationPrefs || {})
  };

  // Respect existing notification preferences and 24h snooze
  if (!prefs.dailyReminder || snoozed) return [];

  const tickedToday = new Set(hydrated.days?.[today] || []);
  const seenIds = new Set();
  const out = [];

  const pushUnique = (item) => {
    if (!item?.id || seenIds.has(item.id)) return;
    seenIds.add(item.id);
    out.push({
      ...item,
      readAt: readMap[item.id] || item.readAt || null
    });
  };

  const openGoals = (hydrated.goals || []).filter((g) => !g.done);

  for (const goal of openGoals) {
    const isPbl = goal.category === 'pbl';
    const isAcademic = goal.category === 'academic' || (!goal.category && !isPbl);

    if (isAcademic && !prefs.academicAlerts) continue;
    if (isPbl && !prefs.pblAlerts) continue;

    const categoryBadge = isPbl ? 'PBL Goal' : goal.category === 'skills' ? 'Skills Goal' : goal.category === 'personal' ? 'Personal Goal' : 'Academic Goal';
    const contextLabel = goal.subject || goal.projectTitle || '';
    const deadline = goalDeadlineStatus(goal, today);

    // 1. Overdue task notification
    if (prefs.deadlineAlerts && deadline.isOverdue) {
      const id = `goal_notif_${uid}_${today}_overdue_${goal.id}`;
      pushUnique({
        id,
        type: isPbl ? 'goal_pbl_overdue' : 'goal_academic_overdue',
        category: isPbl ? 'pbl' : 'academic',
        title: `${categoryBadge} Overdue: ${goal.explore}`,
        body: `${deadline.label}${contextLabel ? ` · ${contextLabel}` : ''}. Review your steps or update your target date.`,
        link: '#/goals',
        createdAt: nowMs
      });
    } else if (prefs.deadlineAlerts && deadline.isApproaching) {
      // 2. Approaching deadline notification (due today, tomorrow, or within 3 days)
      const id = `goal_notif_${uid}_${today}_deadline_${goal.id}`;
      pushUnique({
        id,
        type: isPbl ? 'goal_pbl_deadline' : 'goal_academic_deadline',
        category: isPbl ? 'pbl' : 'academic',
        title: `Upcoming ${categoryBadge} Deadline: ${goal.explore}`,
        body: `${deadline.label}${contextLabel ? ` · ${contextLabel}` : ''}`,
        link: '#/goals',
        createdAt: nowMs - 1000
      });
    }

    // 3. Daily uncompleted action step for this goal
    const steps = Array.isArray(goal.steps) ? goal.steps : [];
    const nextUnfinished = steps.find((s) => !s.done && !tickedToday.has(`step:${goal.id}:${s.id}`));
    if (nextUnfinished) {
      const id = `goal_notif_${uid}_${today}_daily_${goal.id}_${nextUnfinished.id}`;
      const prefix = isPbl ? 'Daily PBL Action' : isAcademic ? 'Daily Academic Goal' : `Daily ${categoryBadge}`;
      pushUnique({
        id,
        type: isPbl ? 'goal_pbl_daily' : 'goal_academic_daily',
        category: isPbl ? 'pbl' : 'academic',
        title: `${prefix}: ${nextUnfinished.text}`,
        body: `For ${goal.explore}${contextLabel ? ` (${contextLabel})` : ''}${deadline.hasDeadline ? ` · ${deadline.label}` : ''}`,
        link: '#/goals',
        createdAt: nowMs - 2000
      });
    }
  }

  // 4. Daily focus habit if not yet ticked today
  if (hydrated.focus?.habit && !tickedToday.has('habit')) {
    const id = `goal_notif_${uid}_${today}_habit`;
    pushUnique({
      id,
      type: 'goal_habit_daily',
      category: 'personal',
      title: `Daily Habit: ${hydrated.focus.habit}`,
      body: `Practising ${hydrated.focus.daysPerWeek || 5} days a week`,
      link: '#/goals',
      createdAt: nowMs - 3000
    });
  }

  return out;
}

/**
 * Load the learner's stored goalPlan from localStorage and build their active goal notifications.
 */
export function getStoredGoalNotifications(uid, options = {}) {
  if (!uid || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`goalPlan_${uid}`);
    if (!raw) return [];
    const plan = hydratePlan(JSON.parse(raw));
    return buildGoalNotificationsForPlan(plan, { uid, ...options });
  } catch {
    return [];
  }
}
