/**
 * Teen Quest rules: levels, XP values, badges and the weekday streak.
 *
 * Pure functions over plain objects, shared by the API (which is the only
 * writer of quest state) and the student UI (which only displays it).
 * Unit-tested in tests/quest-model.test.js.
 *
 * Game rules (docs/implementation/TEEN-QUEST-IMPLEMENTATION-PLAN.md):
 * XP rewards learning actions, coach-verified actions are worth more than
 * self-reported ones, streaks count school weekdays only, and nothing here
 * ranks one learner against another.
 */

export const SCHEMA_VERSION = 1;

/** Cumulative XP needed to reach each level. Beyond the table: +600 per level. */
export const LEVELS = [
  { level: 1, xp: 0, title: 'Curious Starter' },
  { level: 2, xp: 100, title: 'Explorer' },
  { level: 3, xp: 220, title: 'Investigator' },
  { level: 4, xp: 380, title: 'Tinkerer' },
  { level: 5, xp: 580, title: 'Maker' },
  { level: 6, xp: 820, title: 'Problem Solver' },
  { level: 7, xp: 1100, title: 'Systems Thinker' },
  { level: 8, xp: 1500, title: 'Systems Builder' },
  { level: 9, xp: 1950, title: 'Innovator' },
  { level: 10, xp: 2500, title: 'Changemaker' }
];
const EXTRA_LEVEL_XP = 600;

/**
 * XP per event type. `verified: false` marks learner-reported events: they
 * are capped per day because the learner controls their source data.
 */
export const XP_RULES = {
  task_step: { xp: 10, verified: false, counter: 'taskSteps' },
  reflection: { xp: 15, verified: false, counter: 'reflections' },
  goal_acknowledged: { xp: 10, verified: false, counter: 'goalsAcknowledged' },
  evidence_submitted: { xp: 40, verified: true, counter: 'evidence' },
  evidence_reviewed: { xp: 25, verified: true, counter: 'reviewed' },
  goal_achieved: { xp: 80, verified: true, counter: 'goalsAchieved' }
};
/** Event types a learner may report through POST /api/quest/events. */
export const SELF_EVENT_TYPES = ['task_step', 'reflection'];
export const DAILY_SELF_XP_CAP = 50;
export const REFLECTION_MIN_LENGTH = 40;
export const REFLECTION_MAX_LENGTH = 2000;

export const STREAK_FREEZE_EVERY = 5;
export const MAX_STREAK_FREEZES = 2;

/**
 * Badges are earned from counters the server keeps, so each one maps to a
 * real learning behaviour a coach can recognise.
 */
export const BADGES = [
  { id: 'first-evidence', name: 'First Evidence', icon: 'file', competency: 'Communicating evidence', description: 'Submitted your first piece of lesson evidence.', counter: 'evidence', target: 1 },
  { id: 'evidence-builder', name: 'Evidence Builder', icon: 'layers', competency: 'Communicating evidence', description: 'Submitted five pieces of lesson evidence.', counter: 'evidence', target: 5 },
  { id: 'feedback-loop', name: 'Feedback Loop', icon: 'refresh', competency: 'Iterating on feedback', description: 'Received three coach reviews on your work.', counter: 'reviewed', target: 3 },
  { id: 'curious-mind', name: 'Curious Mind', icon: 'search', competency: 'Self-directed learning', description: 'Wrote three reflections about what you learned.', counter: 'reflections', target: 3 },
  { id: 'deep-thinker', name: 'Deep Thinker', icon: 'pen', competency: 'Self-directed learning', description: 'Wrote ten reflections.', counter: 'reflections', target: 10 },
  { id: 'momentum', name: 'Momentum', icon: 'check', competency: 'Planning and persistence', description: 'Completed ten project task steps.', counter: 'taskSteps', target: 10 },
  { id: 'goal-getter', name: 'Goal Getter', icon: 'target', competency: 'Goal setting', description: 'A coach confirmed you achieved a learning goal.', counter: 'goalsAchieved', target: 1 },
  { id: 'goal-crusher', name: 'Goal Crusher', icon: 'trophy', competency: 'Goal setting', description: 'Achieved three coach-confirmed learning goals.', counter: 'goalsAchieved', target: 3 },
  { id: 'spark-5', name: '5-Day Spark', icon: 'flame', competency: 'Persistence', description: 'Learned on five school days in a row.', counter: 'bestStreak', target: 5 },
  { id: 'steady-flame', name: 'Steady Flame', icon: 'flame', competency: 'Persistence', description: 'Learned on twenty school days in a row.', counter: 'bestStreak', target: 20 }
];

export const badgeById = (id) => BADGES.find((b) => b.id === id) || null;

export function emptyQuest() {
  return {
    schemaVersion: SCHEMA_VERSION,
    xp: 0,
    level: 1,
    counters: { taskSteps: 0, reflections: 0, goalsAcknowledged: 0, evidence: 0, reviewed: 0, goalsAchieved: 0, bestStreak: 0 },
    streak: { count: 0, lastActiveDate: null, freezes: 0 },
    daily: { date: null, selfXp: 0 },
    badges: [],
    celebrations: [],
    showOnPortfolio: false,
    calmView: false,
    revision: 0
  };
}

/** Whatever came back from storage, return a well-formed quest record. */
export function hydrateQuest(stored) {
  const base = emptyQuest();
  if (!stored || typeof stored !== 'object') return base;
  const num = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  const counters = Object.fromEntries(Object.keys(base.counters).map((k) => [k, num(stored.counters?.[k])]));
  const xp = num(stored.xp);
  return {
    ...base,
    xp,
    level: levelFor(xp).level,
    counters,
    streak: {
      count: num(stored.streak?.count),
      lastActiveDate: isDate(stored.streak?.lastActiveDate) ? stored.streak.lastActiveDate : null,
      freezes: Math.min(MAX_STREAK_FREEZES, num(stored.streak?.freezes))
    },
    daily: { date: isDate(stored.daily?.date) ? stored.daily.date : null, selfXp: num(stored.daily?.selfXp) },
    badges: Array.isArray(stored.badges) ? stored.badges.filter((b) => b && badgeById(b.id)).slice(0, 100) : [],
    celebrations: Array.isArray(stored.celebrations) ? stored.celebrations.slice(-10) : [],
    showOnPortfolio: stored.showOnPortfolio === true,
    calmView: stored.calmView === true,
    revision: num(stored.revision)
  };
}

// ---------------------------------------------------------------- levels

export function levelThreshold(level) {
  if (level <= LEVELS.length) return LEVELS[Math.max(0, level - 1)].xp;
  return LEVELS[LEVELS.length - 1].xp + (level - LEVELS.length) * EXTRA_LEVEL_XP;
}

export function levelTitle(level) {
  if (level <= LEVELS.length) return LEVELS[level - 1].title;
  return `${LEVELS[LEVELS.length - 1].title} ${level - LEVELS.length + 1}`;
}

/** Level, title and progress toward the next level for an XP total. */
export function levelFor(xp) {
  const total = Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  let level = 1;
  while (levelThreshold(level + 1) <= total) level += 1;
  const floor = levelThreshold(level);
  const next = levelThreshold(level + 1);
  return {
    level,
    title: levelTitle(level),
    xp: total,
    floor,
    next,
    toNext: next - total,
    progress: (total - floor) / (next - floor)
  };
}

// ---------------------------------------------------------------- dates

export function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** The calendar date (YYYY-MM-DD) of an instant in the school's timezone. */
export function localDate(instant = new Date(), timeZone = 'Asia/Bangkok') {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
  }
}

export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday to Friday and not a school holiday. */
export function isSchoolDay(date, holidays = new Set()) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6 && !holidays.has(date);
}

/** School days strictly between two dates (both exclusive). */
export function schoolDaysBetween(from, to, holidays = new Set()) {
  let count = 0;
  for (let d = addDays(from, 1); d < to && count < 400; d = addDays(d, 1)) if (isSchoolDay(d, holidays)) count += 1;
  return count;
}

// ---------------------------------------------------------------- streak

/**
 * Record learning activity on `today`. Weekend and holiday activity earns XP
 * but never changes the streak. Each missed school day uses one freeze; a
 * gap larger than the freezes held restarts the streak at 1.
 */
export function recordActivity(streak, today, holidays = new Set()) {
  const s = { count: streak?.count || 0, lastActiveDate: streak?.lastActiveDate || null, freezes: streak?.freezes || 0 };
  if (!isSchoolDay(today, holidays) || s.lastActiveDate === today) return { ...s, changed: false };
  if (s.lastActiveDate && s.lastActiveDate > today) return { ...s, changed: false };
  let count;
  let freezes = s.freezes;
  if (!s.lastActiveDate) count = 1;
  else {
    const missed = schoolDaysBetween(s.lastActiveDate, today, holidays);
    if (missed === 0) count = s.count + 1;
    else if (missed <= freezes) {
      freezes -= missed;
      count = s.count + 1;
    } else count = 1;
  }
  if (count > 0 && count % STREAK_FREEZE_EVERY === 0) freezes = Math.min(MAX_STREAK_FREEZES, freezes + 1);
  return { count, lastActiveDate: today, freezes, changed: true };
}

/**
 * The streak as the learner should see it today. A streak is still alive
 * while the missed school days since the last activity are covered by
 * freezes; otherwise it shows 0 until the next activity restarts it.
 */
export function currentStreak(streak, today, holidays = new Set()) {
  if (!streak?.lastActiveDate || !streak.count) return { count: 0, freezes: streak?.freezes || 0, activeToday: false, atRisk: false };
  if (streak.lastActiveDate >= today) return { count: streak.count, freezes: streak.freezes || 0, activeToday: true, atRisk: false };
  const missed = schoolDaysBetween(streak.lastActiveDate, today, holidays);
  if (missed > (streak.freezes || 0)) return { count: 0, freezes: streak.freezes || 0, activeToday: false, atRisk: false };
  return { count: streak.count, freezes: streak.freezes || 0, activeToday: false, atRisk: isSchoolDay(today, holidays) };
}

/** The five school days (Mon–Fri) of the week containing `today`, for the streak strip. */
export function schoolWeek(today) {
  const day = new Date(`${today}T00:00:00Z`).getUTCDay();
  const monday = addDays(today, day === 0 ? -6 : 1 - day);
  return [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
}

// ---------------------------------------------------------------- awarding

/** Badges newly earned by the given counters, not already held. */
export function newlyEarnedBadges(counters, held = []) {
  const have = new Set(held.map((b) => b.id));
  return BADGES.filter((b) => !have.has(b.id) && (counters[b.counter] || 0) >= b.target);
}

/** Progress toward every badge, for the badge cabinet. */
export function badgeProgress(quest) {
  const held = new Map((quest.badges || []).map((b) => [b.id, b]));
  return BADGES.map((b) => {
    const value = Math.min(b.target, quest.counters?.[b.counter] || 0);
    return { ...b, earned: held.has(b.id), earnedAt: held.get(b.id)?.earnedAt || null, value, progress: value / b.target };
  });
}

/** The unearned badge the learner is closest to, or null. */
export function nextBadge(quest) {
  const open = badgeProgress(quest).filter((b) => !b.earned);
  if (!open.length) return null;
  return open.sort((a, b) => b.progress - a.progress || a.target - b.target)[0];
}

/**
 * Apply one XP event to a quest record. Returns the new record plus what
 * happened, or { skipped } when a daily cap means nothing changes. Pure: the
 * caller decides whether the event is new (idempotency lives in the ledger).
 */
export function applyEvent(stored, event, { today, holidays = new Set(), now = new Date().toISOString() }) {
  const rule = XP_RULES[event.type];
  if (!rule) throw new Error(`Unknown quest event type: ${event.type}`);
  const quest = hydrateQuest(stored);
  const daily = quest.daily.date === today ? { ...quest.daily } : { date: today, selfXp: 0 };
  let xp = rule.xp;
  if (!rule.verified) {
    xp = Math.max(0, Math.min(rule.xp, DAILY_SELF_XP_CAP - daily.selfXp));
    daily.selfXp += xp;
  }
  const before = levelFor(quest.xp);
  const after = levelFor(quest.xp + xp);
  const counters = { ...quest.counters, [rule.counter]: quest.counters[rule.counter] + 1 };
  const streakResult = recordActivity(quest.streak, today, holidays);
  const streak = { count: streakResult.count, lastActiveDate: streakResult.lastActiveDate, freezes: streakResult.freezes };
  counters.bestStreak = Math.max(counters.bestStreak, streak.count);
  const earned = newlyEarnedBadges(counters, quest.badges);
  const badges = [...quest.badges, ...earned.map((b) => ({ id: b.id, earnedAt: now }))];
  const celebrations = [...quest.celebrations];
  if (after.level > before.level) celebrations.push({ kind: 'level', level: after.level, title: after.title, at: now });
  for (const b of earned) celebrations.push({ kind: 'badge', badgeId: b.id, name: b.name, at: now });
  return {
    quest: { ...quest, xp: quest.xp + xp, level: after.level, counters, streak, daily, badges, celebrations: celebrations.slice(-10) },
    awarded: xp,
    capped: xp < rule.xp,
    levelUp: after.level > before.level ? after : null,
    earned
  };
}

/**
 * Pick "today's quest" from the learner's PBL term project: the first
 * unfinished task of the current phase, else of the first phase with work
 * left. `phases` is PHASES from src/features/pbl/content/pblModel.js.
 */
export function todaysQuest(project, phases) {
  if (!Array.isArray(phases) || !phases.length) return null;
  const done = project?.tasksDone || {};
  const order = [...phases];
  const current = order.findIndex((p) => p.id === project?.currentPhase);
  if (current > 0) order.unshift(...order.splice(current, 1));
  for (const phase of order) {
    const finished = new Set(done[phase.id] || []);
    const index = phase.tasks.findIndex((_, i) => !finished.has(i));
    if (index >= 0) {
      return {
        phaseId: phase.id,
        phaseTitle: phase.title,
        index,
        task: phase.tasks[index],
        done: finished.size,
        total: phase.tasks.length,
        xp: XP_RULES.task_step.xp
      };
    }
  }
  return null;
}
