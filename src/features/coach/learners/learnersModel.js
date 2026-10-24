/**
 * The coach's Learners page: turns what learners actually saved into one row
 * per learner and a few class figures. Pure; tested in tests/coach-learners.test.js.
 *
 * Only real records are used: the goal plan on users/{uid}, the PBL program
 * progress in users/{uid}/activityProgress/pbl-program-*, and the minutes in
 * users/{uid}/dailyStats/{YYYY-MM-DD}. Missing data stays missing ("no data
 * yet"); nothing is filled in with defaults or examples.
 */
import { hydratePlan, todayItems, checkedToday, dayKey } from '../../goals/goalPlan.js';
import { programById } from '../../pbl/programs/catalog.js';
import { hydrateProgress, programProgress } from '../../pbl/programs/progress.js';

export const QUIET_DAYS = 7;
export const CHART_DAYS = 14;
const DAY_MS = 86400000;

const isDay = (k) => /^\d{4}-\d{2}-\d{2}$/.test(k);
const dayStart = (key) => new Date(`${key}T00:00:00`).getTime();

/** The last `n` local day keys, oldest first. */
export function lastDays(n, today = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (n - 1 - i));
    return dayKey(d);
  });
}

export function displayName(user) {
  const full = [user.givenNames, user.surname].filter(Boolean).join(' ').trim();
  return user.displayName || full || (user.email ? user.email.split('@')[0] : 'Learner');
}

/** Minutes per day from dailyStats docs ({ id: 'YYYY-MM-DD', timeSpentMinutes }). */
export function minutesByDay(stats) {
  const out = {};
  for (const s of stats || []) {
    if (!isDay(s.id)) continue;
    const m = Number(s.timeSpentMinutes);
    if (Number.isFinite(m) && m > 0) out[s.id] = (out[s.id] || 0) + Math.round(m);
  }
  return out;
}

/** Every PBL program this learner has touched, with done/total and their confidence ratings. */
export function programSummaries(progressDocs) {
  const out = [];
  for (const d of progressDocs || []) {
    if (!String(d.id).startsWith('pbl-program-')) continue;
    const program = programById(d.data?.programId || String(d.id).slice('pbl-program-'.length));
    if (!program) continue;
    const progress = hydrateProgress(d.data, program);
    if (!progress.startedAt && !Object.keys(progress.sessions).length) continue;
    const sum = programProgress(progress, program);
    const ratings = Object.values(progress.sessions).map((e) => e.confidence).filter(Boolean);
    const reflections = program.sessions
      .filter((s) => progress.sessions[s.sessionNumber]?.reflection)
      .map((s) => ({ session: s.sessionNumber, title: s.title, text: progress.sessions[s.sessionNumber].reflection }));
    out.push({
      id: program.id, title: program.identity?.short || program.title, done: sum.done, total: sum.total, pct: sum.pct,
      next: sum.next ? { number: sum.next.sessionNumber, title: sum.next.title } : null,
      ratings, reflections, updatedAt: progress.updatedAt
    });
  }
  return out;
}

const avg = (xs) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

/**
 * One learner row. `user` is the users/{uid} document data plus `uid`;
 * `stats` the dailyStats docs; `progress` the activityProgress docs.
 */
export function learnerRow({ user, stats = [], progress = [] }, today = new Date()) {
  const plan = user.goalPlan ? hydratePlan(user.goalPlan) : null;
  const day = dayKey(today);
  const items = plan ? todayItems(plan, day) : [];
  const ticked = plan ? checkedToday(plan, day) : new Set();
  const goals = plan ? plan.goals.map((g) => ({
    id: g.id, text: g.explore, done: g.done, stepsDone: g.steps.filter((s) => s.done).length, stepsTotal: g.steps.length
  })) : [];
  const minutes = minutesByDay(stats);
  const days = lastDays(CHART_DAYS, today);
  const week = days.slice(-7);
  const programs = programSummaries(progress);
  const ratings = programs.flatMap((p) => p.ratings);

  // Last activity: the latest of a day with minutes, a goal-plan save and a program save.
  const times = [
    ...Object.keys(minutes).map((k) => dayStart(k)),
    plan?.updatedAt || 0,
    ...programs.map((p) => p.updatedAt || 0)
  ].filter((t) => t > 0);
  const lastActive = times.length ? Math.max(...times) : null;
  const quietDays = lastActive ? Math.floor((dayStart(day) - dayStart(dayKey(new Date(lastActive)))) / DAY_MS) : null;

  const flags = [];
  if (user.status === 'suspended') flags.push({ id: 'suspended', label: 'Account suspended' });
  if (user.status === 'pending' || user.consent?.status === 'required') flags.push({ id: 'consent', label: 'Waiting for parent consent' });
  if (lastActive == null) flags.push({ id: 'new', label: 'No activity yet' });
  else if (quietDays >= QUIET_DAYS) flags.push({ id: 'quiet', label: `Quiet for ${quietDays} days` });
  const lowConfidence = ratings.length >= 2 && avg(ratings.slice(-3)) <= 2;
  if (lowConfidence) flags.push({ id: 'confidence', label: 'Low confidence lately' });
  if (plan && !plan.goals.length && !plan.focus) flags.push({ id: 'no-goal', label: 'No goal set' });

  return {
    uid: user.uid,
    name: displayName(user),
    email: user.email || '',
    classIds: Array.isArray(user.classIds) ? user.classIds : [],
    yearLevel: user.yearLevel || '',
    primary: user.ageBand === 'primary',
    status: user.status || 'active',
    today: { done: items.filter((i) => ticked.has(i.id)).length, total: items.length },
    goals,
    focusSkill: plan?.focus ? plan.focus.habit : null,
    programs,
    confidence: avg(ratings),
    minutesByDay: days.map((d) => minutes[d] || 0),
    minutesWeek: week.reduce((s, d) => s + (minutes[d] || 0), 0),
    hasMinutes: Object.keys(minutes).length > 0,
    lastActive,
    quietDays,
    flags,
    needsCheckIn: flags.some((f) => ['quiet', 'confidence', 'no-goal', 'new'].includes(f.id))
  };
}

/** Class figures for the tiles and the chart, from the rows already built. */
export function classSummary(rows, today = new Date()) {
  const days = lastDays(CHART_DAYS, today);
  const active7 = rows.filter((r) => r.quietDays != null && r.quietDays < 7).length;
  const minutesPerDay = days.map((d, i) => ({ day: d, minutes: rows.reduce((s, r) => s + r.minutesByDay[i], 0) }));
  const withToday = rows.filter((r) => r.today.total > 0);
  return {
    learners: rows.length,
    active7,
    needsCheckIn: rows.filter((r) => r.needsCheckIn).length,
    stepsToday: { done: withToday.reduce((s, r) => s + r.today.done, 0), total: withToday.reduce((s, r) => s + r.today.total, 0) },
    missionsDone: rows.reduce((s, r) => s + r.programs.reduce((n, p) => n + p.done, 0), 0),
    minutesPerDay,
    hasMinutes: minutesPerDay.some((d) => d.minutes > 0)
  };
}

export const SORTS = {
  attention: (a, b) => Number(b.needsCheckIn) - Number(a.needsCheckIn) || (b.quietDays ?? 1e9) - (a.quietDays ?? 1e9) || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
  recent: (a, b) => (b.lastActive || 0) - (a.lastActive || 0),
  minutes: (a, b) => b.minutesWeek - a.minutesWeek
};

export function filterRows(rows, { classId = 'all', query = '', onlyCheckIn = false, sort = 'attention' } = {}) {
  const q = query.trim().toLowerCase();
  return rows
    .filter((r) => classId === 'all' || r.classIds.includes(classId))
    .filter((r) => !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
    .filter((r) => !onlyCheckIn || r.needsCheckIn)
    .sort(SORTS[sort] || SORTS.attention);
}

/** "today", "yesterday", "3 days ago", or a date for anything older than a week. */
export function lastActiveText(row) {
  if (row.lastActive == null) return 'No activity yet';
  if (row.quietDays <= 0) return 'Today';
  if (row.quietDays === 1) return 'Yesterday';
  if (row.quietDays < 7) return `${row.quietDays} days ago`;
  return new Date(row.lastActive).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
