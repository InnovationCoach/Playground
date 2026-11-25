import { useEffect, useState } from 'react';
import { Bell, X, CircleCheck, Circle, ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import { hasPlan, todayItems, checkedToday, toggleToday, dayKey, computeGoalDashboardMetrics, DEFAULT_NOTIFICATION_PREFS } from './goalPlan.js';
import { isReminderSnoozed } from './goalNotifications.js';
import { useGoalPlan } from './useGoalPlan.js';
import { hrefFor } from '../../app/routes.js';
import '../admin/admin.css';
import './goals.css';

/**
 * Daily goals notification. Replaces the goal-setting wizard that used to open
 * itself on every sign-in: once a day it shows today's checklist (tickable in
 * place) or, with no plan yet, an invitation to set goals. "Hide for today"
 * is remembered per learner and day on this device.
 *
 * Connected to the redesigned goal-management system:
 *   - Distinguishes Academic vs PBL vs Habit actions
 *   - Highlights approaching deadlines and overdue tasks
 *   - Excludes completed goals and completed tasks
 *   - Respects notification preferences (`plan.notificationPrefs` & snooze)
 */
export const noticeStorageKey = (uid) => `goalNudge_${uid || 'signed-out'}`;

export function DailyGoalsNotice({ uid }) {
  const { plan, update, loaded } = useGoalPlan(uid);
  const today = dayKey();
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(noticeStorageKey(uid)) === today; } catch { return false; }
  });
  const [ready, setReady] = useState(false);

  // A short delay so it arrives after the page, like a notification, not with it.
  useEffect(() => { const t = setTimeout(() => setReady(true), 900); return () => clearTimeout(t); }, []);

  function hideForToday() {
    try { localStorage.setItem(noticeStorageKey(uid), today); } catch { /* private mode: hide for this visit */ }
    setHidden(true);
  }

  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...(plan?.notificationPrefs || {}) };
  if (!uid || hidden || !loaded || !ready || !prefs.dailyReminder || isReminderSnoozed(uid)) return null;

  const allItems = todayItems(plan, today).filter((it) => {
    if (it.category === 'academic' && !prefs.academicAlerts) return false;
    if (it.category === 'pbl' && !prefs.pblAlerts) return false;
    return true;
  });
  const checked = checkedToday(plan, today);
  // Exclude already completed tasks from the active reminder list unless just ticked
  const uncompletedItems = allItems.filter((i) => !checked.has(i.id));
  const done = allItems.filter((i) => checked.has(i.id)).length;
  const setUp = hasPlan(plan);
  const metrics = computeGoalDashboardMetrics(plan, today);
  const overdueCount = prefs.deadlineAlerts ? metrics.overdueGoals.length : 0;
  const approachingCount = prefs.deadlineAlerts ? metrics.approachingGoals.length : 0;

  // If the student already completed all of today's tasks and has no overdue/approaching alerts, don't nag
  if (setUp && allItems.length > 0 && uncompletedItems.length === 0 && overdueCount === 0) return null;

  return (
    <div className="gh-app gl-notice-host">
      <aside className="gl-notice" role="status" aria-labelledby="gl-notice-title">
        <div className="gl-notice-head">
          <span className="gl-notice-icon"><Bell size={16} aria-hidden="true" /></span>
          <strong id="gl-notice-title">
            {!setUp
              ? 'Set your goals for this term'
              : allItems.length
              ? `Today's goals · ${done} of ${allItems.length} done`
              : 'Your goals'}
          </strong>
          <button type="button" className="gl-icon-btn" onClick={hideForToday} aria-label="Hide until tomorrow">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {setUp && (overdueCount > 0 || approachingCount > 0) && (
          <div className="gl-notice-alerts">
            {overdueCount > 0 && (
              <div className="gl-notice-alert gl-notice-alert-overdue">
                <AlertTriangle size={14} aria-hidden="true" />
                <span>{overdueCount} goal{overdueCount === 1 ? '' : 's'} overdue: {metrics.overdueGoals[0].explore}</span>
              </div>
            )}
            {overdueCount === 0 && approachingCount > 0 && (
              <div className="gl-notice-alert gl-notice-alert-soon">
                <Clock size={14} aria-hidden="true" />
                <span>Upcoming deadline: {metrics.approachingGoals[0].explore}</span>
              </div>
            )}
          </div>
        )}

        {!setUp ? (
          <p className="gl-notice-body">Start from what you love: pick your Academic &amp; PBL goals, your strengths, and one small daily habit.</p>
        ) : allItems.length ? (
          <ul className="gl-notice-list">
            {allItems.slice(0, 4).map((it) => {
              const on = checked.has(it.id);
              const badgeLabel = it.category === 'pbl'
                ? 'PBL'
                : it.category === 'academic'
                ? 'Academic'
                : it.kind === 'habit'
                ? 'Habit'
                : it.kind === 'recharge'
                ? 'Break'
                : 'Goal';
              return (
                <li key={it.id}>
                  <button type="button" className="gl-check gl-check-sm" aria-pressed={on} onClick={() => update((p) => toggleToday(p, it))}>
                    {on ? <CircleCheck size={17} aria-hidden="true" /> : <Circle size={17} aria-hidden="true" />}
                    <span className={`gl-notice-cat gl-notice-cat-${it.category || it.kind || 'goal'}`}>
                      {badgeLabel}
                    </span>
                    <span className="gl-check-text">{it.text}</span>
                  </button>
                </li>
              );
            })}
            {allItems.length > 4 && <li className="gl-notice-more">and {allItems.length - 4} more</li>}
          </ul>
        ) : (
          <p className="gl-notice-body">Add a small step or a daily habit to get a checklist here each day.</p>
        )}

        <div className="gl-notice-actions">
          <a className="gh-btn gh-btn-sm gh-btn-accent" href={hrefFor.goals()} onClick={hideForToday}>
            {setUp ? 'Open my goals' : 'Set my goals'}<ArrowRight size={14} aria-hidden="true" />
          </a>
          <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={hideForToday}>
            {setUp ? 'Hide for today' : 'Not now'}
          </button>
        </div>
      </aside>
    </div>
  );
}
