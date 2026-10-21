import { useEffect, useState } from 'react';
import { Bell, X, CircleCheck, Circle, ArrowRight } from 'lucide-react';
import { hasPlan, todayItems, checkedToday, toggleToday, dayKey } from './goalPlan.js';
import { useGoalPlan } from './useGoalPlan.js';
import { hrefFor } from '../../app/routes.js';
import '../admin/admin.css';
import './goals.css';

/**
 * Daily goals notification. Replaces the goal-setting wizard that used to open
 * itself on every sign-in: once a day it shows today's checklist (tickable in
 * place) or, with no plan yet, an invitation to set goals. "Hide for today"
 * is remembered per learner and day on this device.
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

  if (!uid || hidden || !loaded || !ready) return null;

  const items = todayItems(plan);
  const checked = checkedToday(plan);
  const done = items.filter((i) => checked.has(i.id)).length;
  const setUp = hasPlan(plan);

  return (
    <div className="gh-app gl-notice-host">
    <aside className="gl-notice" role="status" aria-labelledby="gl-notice-title">
      <div className="gl-notice-head">
        <span className="gl-notice-icon"><Bell size={16} aria-hidden="true" /></span>
        <strong id="gl-notice-title">
          {!setUp ? 'Set your goals for this term' : items.length ? `Today's goals · ${done} of ${items.length} done` : 'Your goals'}
        </strong>
        <button type="button" className="gl-icon-btn" onClick={hideForToday} aria-label="Hide until tomorrow">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {!setUp ? (
        <p className="gl-notice-body">Start from what you love: pick your strengths, one big goal and one small daily habit. It takes about three minutes.</p>
      ) : items.length ? (
        <ul className="gl-notice-list">
          {items.slice(0, 3).map((it) => {
            const on = checked.has(it.id);
            return (
              <li key={it.id}>
                <button type="button" className="gl-check gl-check-sm" aria-pressed={on} onClick={() => update((p) => toggleToday(p, it))}>
                  {on ? <CircleCheck size={17} aria-hidden="true" /> : <Circle size={17} aria-hidden="true" />}
                  <span className="gl-check-text">{it.text}</span>
                </button>
              </li>
            );
          })}
          {items.length > 3 && <li className="gl-notice-more">and {items.length - 3} more</li>}
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
