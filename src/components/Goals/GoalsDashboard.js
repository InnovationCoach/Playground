import { db, doc, setDoc, getDoc } from '../../firebase.js';

/**
 * Learner goals on the student home: a compact strip instead of a full-height
 * card. Collapsed it shows progress, the next goal and the deadline; "Open"
 * expands the checklist and the daily reminder. Completing every goal awards a
 * badge, keeps it on the account, and offers a fresh goal cycle.
 *
 * Storage (unchanged shape): users/{uid}.goals {learningPath, topic, goals[],
 * durationDays, createdAt, completedGoals[]}, mirrored one document per goal to
 * users/{uid}/goals for the coach dashboard, plus localStorage per learner.
 * Badges live in users/{uid}.goalBadges (owner-writable) and localStorage.
 */

const ICONS = {
  target: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  award: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const read = (key) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } };
const write = (key, value) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch { /* private browsing */ } };

export async function mirrorGoalsToSubcollection(userId, goalData) {
  const list = Array.isArray(goalData?.goals) ? goalData.goals : [];
  if (!userId || !db || !list.length) return;
  const createdAt = Date.parse(goalData.createdAt) || Date.now();
  const targetDate = new Date(createdAt + (goalData.durationDays || 30) * 86400000).toISOString().slice(0, 10);
  const done = new Set((goalData.completedGoals || []).map(String));
  await Promise.all(list.map((entry, i) => {
    const title = typeof entry === 'string' ? entry : (entry?.title || entry?.text || `Goal ${i + 1}`);
    const goalId = `goal_${createdAt}_${i}`;
    const achieved = done.has(String(i)) || done.has(title);
    return setDoc(doc(db, 'users', userId, 'goals', goalId), {
      goalId, title, learningPath: goalData.learningPath || null, topic: goalData.topic || null,
      status: achieved ? 'achieved' : 'on_track', progress: achieved ? 1 : 0, targetDate, createdAt, source: 'goal-setting-wizard'
    }, { merge: true });
  }));
}

async function persistGoals(userId, goalData) {
  write(`userGoals_${userId}`, goalData);
  if (!userId || !db) return;
  try {
    await setDoc(doc(db, 'users', userId), { goals: goalData, updatedAt: new Date().toISOString() }, { merge: true });
    await mirrorGoalsToSubcollection(userId, goalData);
  } catch (err) {
    console.warn('[Goals] Could not sync goals:', err?.message);
  }
}

async function persistBadges(userId, badges) {
  write(`goalBadges_${userId}`, badges);
  if (!userId || !db) return;
  try {
    await setDoc(doc(db, 'users', userId), { goalBadges: badges, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('[Goals] Could not save badge:', err?.message);
  }
}

const goalTitle = (g, i) => typeof g === 'string' ? g : (g?.title || g?.text || `Goal ${i + 1}`);

export function createGoalsDashboard(containerId = 'goals-dashboard', userId = null) {
  const container = document.getElementById(containerId);
  if (!container) { console.warn(`[GoalsDashboard] Container not found: ${containerId}`); return; }
  addDashboardStyles();

  let goalData = userId ? read(`userGoals_${userId}`) : null;
  let badges = (userId && read(`goalBadges_${userId}`)) || [];
  let expanded = userId ? read(`goalsExpanded_${userId}`) === true : false;

  // Badges earned on another device arrive from the account document.
  if (userId && db) {
    getDoc(doc(db, 'users', userId)).then((snap) => {
      const remote = snap?.exists?.() ? snap.data()?.goalBadges : (snap?.exists ? snap.data()?.goalBadges : null);
      if (Array.isArray(remote) && remote.length > badges.length) { badges = remote; write(`goalBadges_${userId}`, badges); render(); }
    }).catch(() => {});
  }

  // Re-render when the wizard finishes (first set or an edit from the strip).
  const onGoalsSet = (e) => { goalData = e.detail; expanded = true; write(`goalsExpanded_${userId}`, true); persistGoals(userId, goalData); render(); };
  window.removeEventListener('goalsSet', container._goalsSetHandler || (() => {}));
  container._goalsSetHandler = onGoalsSet;
  window.addEventListener('goalsSet', onGoalsSet);

  function render() {
    if (!goalData || !Array.isArray(goalData.goals) || !goalData.goals.length) { renderEmpty(); return; }
    const total = goalData.goals.length;
    const doneIdx = new Set((goalData.completedGoals || []).map(Number));
    const done = [...doneIdx].filter((i) => i < total).length;
    const pct = Math.round((done / total) * 100);
    const createdAt = Date.parse(goalData.createdAt) || Date.now();
    const deadline = new Date(createdAt + (goalData.durationDays || 14) * 86400000);
    const daysLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 86400000));
    const nextIdx = goalData.goals.findIndex((_, i) => !doneIdx.has(i));
    const complete = done === total;
    const cycleId = `cycle_${createdAt}`;
    const earned = badges.find((b) => b.cycleId === cycleId);
    const snoozed = userId && (Date.parse(read(`reminderSnoozedUntil_${userId}`) || '') > Date.now());
    const dueLabel = deadline.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

    container.innerHTML = `
      <section class="gl-strip ${complete ? 'gl-complete' : ''}" aria-labelledby="gl-title">
        <div class="gl-row">
          <div class="gl-ring" role="img" aria-label="${done} of ${total} goals done" style="--p:${pct}"><span>${done}/${total}</span></div>
          <div class="gl-main">
            <div class="gl-kicker">${complete ? ICONS.award : ICONS.target} ${complete ? 'All goals complete' : 'Project goals'}</div>
            <h3 id="gl-title">${esc(goalData.topic || 'STEM project')}</h3>
            <p class="gl-meta">
              ${complete
                ? `Badge earned${earned ? ` on ${new Date(earned.earnedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : ''}. Ready for a new set of goals?`
                : `Next: <strong>${esc(goalTitle(goalData.goals[nextIdx], nextIdx))}</strong> · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left · due ${dueLabel}`}
            </p>
          </div>
          <div class="gl-actions">
            ${complete
              ? `<button type="button" class="gl-btn gl-btn-primary" id="gl-new-cycle">${ICONS.target} Start new goals</button>`
              : `<button type="button" class="gl-btn gl-btn-ghost" id="gl-edit" aria-label="Edit goals">${ICONS.pen} Edit</button>`}
            <button type="button" class="gl-btn gl-btn-secondary" id="gl-toggle" aria-expanded="${expanded}" aria-controls="gl-panel">${expanded ? 'Close' : 'Open'} <span class="gl-chev ${expanded ? 'is-open' : ''}">${ICONS.chevron}</span></button>
          </div>
        </div>
        ${badges.length ? `<ul class="gl-badges" aria-label="Badges earned">${badges.map((b) => `<li class="gl-badge" title="${esc(b.title)} · ${new Date(b.earnedAt).toLocaleDateString()}">${ICONS.award}<span>${esc(b.title)}</span></li>`).join('')}</ul>` : ''}
        <div class="gl-panel" id="gl-panel" ${expanded ? '' : 'hidden'}>
          <ul class="gl-list" aria-label="Goal checklist">
            ${goalData.goals.map((g, i) => `
              <li class="gl-item ${doneIdx.has(i) ? 'is-done' : ''}">
                <label><input type="checkbox" class="gl-check" data-index="${i}" ${doneIdx.has(i) ? 'checked' : ''}><span>${esc(goalTitle(g, i))}</span></label>
                ${doneIdx.has(i) ? `<span class="gl-done">${ICONS.check} Done</span>` : ''}
              </li>`).join('')}
          </ul>
          ${complete ? '' : `
          <div class="gl-reminder" role="note">
            ${ICONS.bell}
            <div>
              <strong>Daily focus</strong>
              <span>${daysLeft} day${daysLeft === 1 ? '' : 's'} until ${dueLabel}. One small step today keeps the project moving.</span>
            </div>
            <div class="gl-reminder-actions">
              <button type="button" class="gl-btn gl-btn-ghost gl-btn-sm" id="gl-daily" ${userId && read(`dailyDone_${userId}`) === new Date().toDateString() ? 'disabled' : ''}>${userId && read(`dailyDone_${userId}`) === new Date().toDateString() ? 'Today marked done' : "Mark today's learning done"}</button>
              <button type="button" class="gl-btn gl-btn-ghost gl-btn-sm" id="gl-snooze" ${snoozed ? 'disabled' : ''}>${snoozed ? 'Snoozed until tomorrow' : 'Snooze 24h'}</button>
            </div>
          </div>`}
          <div class="gl-foot">
            <span class="gl-progress-text">${pct}% complete</span>
            <button type="button" class="gl-btn gl-btn-ghost gl-btn-sm gl-danger" id="gl-reset">Reset goals</button>
          </div>
        </div>
      </section>`;
    bind({ total, cycleId, complete });
  }

  function renderEmpty() {
    container.innerHTML = `
      <section class="gl-strip gl-empty" aria-label="Project goals">
        <div class="gl-row">
          <div class="gl-ring" style="--p:0" aria-hidden="true"><span>${ICONS.target}</span></div>
          <div class="gl-main">
            <div class="gl-kicker">Project goals</div>
            <h3>Start with something you are curious about</h3>
            <p class="gl-meta">Describe what you want to try, choose a check-in date, and take one small step.</p>
          </div>
          <div class="gl-actions"><button type="button" class="gl-btn gl-btn-primary" id="gl-set">${ICONS.target} Set goals</button></div>
        </div>
        ${badges.length ? `<ul class="gl-badges" aria-label="Badges earned">${badges.map((b) => `<li class="gl-badge">${ICONS.award}<span>${esc(b.title)}</span></li>`).join('')}</ul>` : ''}
      </section>`;
    container.querySelector('#gl-set')?.addEventListener('click', () => window.openGoalSettingWizard?.());
  }

  function bind({ total, cycleId, complete }) {
    container.querySelector('#gl-toggle')?.addEventListener('click', () => { expanded = !expanded; write(`goalsExpanded_${userId}`, expanded); render(); container.querySelector('#gl-toggle')?.focus(); });
    container.querySelector('#gl-edit')?.addEventListener('click', () => window.openGoalSettingWizard?.());
    container.querySelectorAll('.gl-check').forEach((box) => box.addEventListener('change', () => {
      const i = Number(box.dataset.index);
      const set = new Set((goalData.completedGoals || []).map(Number));
      if (box.checked) set.add(i); else set.delete(i);
      goalData.completedGoals = [...set].sort((a, b) => a - b);
      const nowComplete = goalData.completedGoals.filter((x) => x < total).length === total;
      if (nowComplete && !badges.some((b) => b.cycleId === cycleId)) {
        badges = [...badges, { id: `badge_${Date.now()}`, cycleId, title: goalData.topic || 'Project goals', goals: total, earnedAt: new Date().toISOString() }];
        persistBadges(userId, badges);
        announce(`Badge earned: ${goalData.topic || 'Project goals'}. All ${total} goals done.`);
      }
      render();
      persistGoals(userId, goalData);
    }));
    container.querySelector('#gl-daily')?.addEventListener('click', () => { write(`dailyDone_${userId}`, new Date().toDateString()); render(); });
    container.querySelector('#gl-snooze')?.addEventListener('click', () => { write(`reminderSnoozedUntil_${userId}`, new Date(Date.now() + 86400000).toISOString()); render(); });
    container.querySelector('#gl-new-cycle')?.addEventListener('click', () => startNewCycle(false));
    container.querySelector('#gl-reset')?.addEventListener('click', () => {
      if (complete || confirm('Reset these goals? Your earned badges stay on your account.')) startNewCycle(true);
    });
  }

  async function startNewCycle(openWizardAfter) {
    goalData = null;
    write(`userGoals_${userId}`, null);
    write(`goalsExpanded_${userId}`, null);
    if (userId && db) {
      try { await setDoc(doc(db, 'users', userId), { goals: null, isFirstTimeUser: false, updatedAt: new Date().toISOString() }, { merge: true }); }
      catch (err) { console.warn('[Goals] Could not reset goals:', err?.message); }
    }
    render();
    if (openWizardAfter !== true) window.openGoalSettingWizard?.();
  }

  function announce(text) {
    document.getElementById('gl-toast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'gl-toast';
    toast.className = 'gl-toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `<span class="gl-toast-icon">${ICONS.award}</span><div><strong>Badge earned</strong><span>${esc(text)}</span></div><button type="button" class="gl-btn gl-btn-ghost gl-btn-sm" aria-label="Dismiss">${ICONS.x}</button>`;
    toast.querySelector('button').addEventListener('click', () => toast.remove());
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 8000);
  }

  render();
}

function addDashboardStyles() {
  if (document.getElementById('goals-dashboard-styles')) return;
  const style = document.createElement('style');
  style.id = 'goals-dashboard-styles';
  style.textContent = `
    .gl-strip { --gl-ink:#17324d; --gl-muted:#4a5d70; --gl-navy:#003c69; --gl-purple:#8250a0; --gl-purple-100:#f0e8f7; --gl-purple-200:#e2d3ef; --gl-lime:#96d700; --gl-lime-100:#f1fad6; --gl-surface:#fff; --gl-surface-2:#f7f8fb; --gl-line:#dadce6;
      font-family: Inter, system-ui, sans-serif; color: var(--gl-ink); background: var(--gl-surface); border: 1px solid var(--gl-line); border-left: 5px solid var(--gl-purple); border-radius: 14px; padding: 14px 18px; box-shadow: 0 1px 2px rgba(0,60,105,.06); }
    [data-theme="dark"] .gl-strip { --gl-ink:#f8fafc; --gl-muted:#aebfcf; --gl-navy:#9bd2ff; --gl-purple:#c48ae6; --gl-purple-100:#2d1a47; --gl-purple-200:#4b2a6e; --gl-lime-100:#1f3a0a; --gl-surface:#04294a; --gl-surface-2:#011f38; --gl-line:#184a73; }
    .gl-strip * { box-sizing: border-box; }
    .gl-strip svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex: 0 0 auto; }
    .gl-complete { border-left-color: var(--gl-lime); }
    .gl-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .gl-ring { --p:0; width: 56px; height: 56px; border-radius: 50%; flex: 0 0 auto; display: grid; place-items: center; position: relative; background: conic-gradient(var(--gl-lime) calc(var(--p) * 1%), var(--gl-purple-100) 0); }
    .gl-ring::before { content: ""; position: absolute; inset: 6px; border-radius: 50%; background: var(--gl-surface); }
    .gl-ring span { position: relative; font: 700 13px/1 'Plus Jakarta Sans', Inter, sans-serif; color: var(--gl-navy); display: grid; place-items: center; }
    .gl-ring span svg { color: var(--gl-purple); width: 22px; height: 22px; }
    .gl-main { flex: 1 1 280px; min-width: 0; }
    .gl-kicker { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--gl-purple); }
    .gl-strip h3 { margin: 2px 0; font: 700 18px/1.25 'Plus Jakarta Sans', Inter, sans-serif; color: var(--gl-navy); }
    .gl-meta { margin: 0; font-size: 14px; color: var(--gl-muted); }
    .gl-meta strong { color: var(--gl-ink); font-weight: 600; }
    .gl-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .gl-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 8px 14px; border-radius: 10px; border: 1.5px solid transparent; font: 600 14px/1.2 Inter, system-ui, sans-serif; cursor: pointer; color: var(--gl-ink); background: transparent; }
    .gl-btn-sm { min-height: 34px; padding: 5px 10px; font-size: 13px; }
    .gl-btn-primary { background: var(--gl-purple); color: #fff; }
    .gl-btn-primary:hover { filter: brightness(.92); }
    .gl-btn-secondary { background: var(--gl-surface); border-color: var(--gl-navy); color: var(--gl-navy); }
    .gl-btn-secondary:hover, .gl-btn-ghost:hover { background: var(--gl-purple-100); }
    .gl-btn-ghost { color: var(--gl-navy); }
    .gl-btn:disabled { opacity: .55; cursor: default; }
    .gl-danger { color: #8f2a2b; }
    [data-theme="dark"] .gl-danger { color: #f5a3a3; }
    .gl-strip :focus-visible { outline: 3px solid var(--gl-navy); outline-offset: 2px; border-radius: 8px; }
    .gl-chev svg { transition: transform .2s ease; }
    .gl-chev.is-open svg { transform: rotate(180deg); }
    .gl-badges { list-style: none; margin: 12px 0 0; padding: 0; display: flex; gap: 8px; flex-wrap: wrap; }
    .gl-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px 4px 6px; border-radius: 999px; background: var(--gl-lime-100); color: var(--gl-navy); font-size: 13px; font-weight: 600; border: 1px solid var(--gl-lime); }
    .gl-badge svg { color: var(--gl-navy); width: 16px; height: 16px; }
    .gl-panel { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--gl-line); }
    .gl-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
    .gl-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; border-radius: 10px; }
    .gl-item:hover { background: var(--gl-surface-2); }
    .gl-item label { display: flex; align-items: center; gap: 12px; cursor: pointer; flex: 1; min-height: 32px; }
    .gl-item input { width: 22px; height: 22px; margin: 0; accent-color: var(--gl-purple); cursor: pointer; }
    .gl-item.is-done label span { color: var(--gl-muted); text-decoration: line-through; }
    .gl-done { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; color: var(--gl-navy); background: var(--gl-lime-100); padding: 3px 10px; border-radius: 999px; }
    .gl-done svg { width: 14px; height: 14px; }
    .gl-reminder { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; margin-top: 12px; padding: 12px 14px; border-radius: 10px; background: #e9f4ff; color: var(--gl-ink); }
    [data-theme="dark"] .gl-reminder { background: #0a3a62; }
    .gl-reminder > svg { color: var(--gl-navy); margin-top: 2px; }
    .gl-reminder > div:first-of-type { flex: 1 1 240px; font-size: 14px; display: grid; gap: 2px; }
    .gl-reminder-actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .gl-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 12px; }
    .gl-progress-text { font-size: 13px; color: var(--gl-muted); }
    .gl-toast { position: fixed; right: 20px; bottom: 20px; z-index: 2001; display: flex; gap: 12px; align-items: center; max-width: 360px; padding: 12px 14px; border-radius: 14px; background: #003c69; color: #fff; box-shadow: 0 24px 60px -24px rgba(1,28,54,.6); font-family: Inter, system-ui, sans-serif; border-left: 5px solid #96d700; }
    .gl-toast svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .gl-toast-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: #96d700; color: #003c69; flex: 0 0 auto; }
    .gl-toast > div { display: grid; gap: 2px; font-size: 14px; flex: 1; }
    .gl-toast .gl-btn { color: #fff; }
    @media (max-width: 640px) { .gl-actions { width: 100%; } .gl-actions .gl-btn { flex: 1; justify-content: center; } }
    @media (prefers-reduced-motion: reduce) { .gl-chev svg { transition: none; } }
  `;
  document.head.appendChild(style);
}

export default { createGoalsDashboard };
