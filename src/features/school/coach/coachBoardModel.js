// Pure summaries for the coach's Goals, Academic and Calendar boards.
// Every count comes from a stored record; missing data stays "no record", never zero progress.

export const DAY_MS = 86400000;

export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromIso, toIso) {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS);
}

// A goal's status as a coach reads it today.
export function goalStatus(goal, today) {
  if (goal.state === 'achieved') return 'achieved';
  if (goal.state === 'archived') return 'archived';
  if (goal.dueDate && goal.dueDate < today) return 'overdue';
  if (goal.dueDate && daysBetween(today, goal.dueDate) <= 7) return 'due-soon';
  return 'active';
}

const STATUS_RANK = { overdue: 0, 'due-soon': 1, active: 2, none: 3, achieved: 4 };

// One row per learner: open goals, the next due date and the most urgent status.
export function summarizeGoals(learners, goals, today) {
  const visible = goals.filter(g => g.source !== 'competency-pathway' && g.state !== 'archived');
  const rows = learners.map(learner => {
    const own = visible.filter(g => g.learnerUid === learner.id).map(g => ({ ...g, status: goalStatus(g, today) }));
    const open = own.filter(g => g.status !== 'achieved');
    const next = open.filter(g => g.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] || null;
    const status = open.length ? open.reduce((worst, g) => STATUS_RANK[g.status] < STATUS_RANK[worst] ? g.status : worst, 'active') : own.length ? 'achieved' : 'none';
    return {
      learner,
      goals: own,
      open: open.length,
      achieved: own.length - open.length,
      unacknowledged: open.filter(g => !g.acknowledged).length,
      next,
      status
    };
  });
  rows.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || (a.next?.dueDate || '9999').localeCompare(b.next?.dueDate || '9999') || a.learner.displayName.localeCompare(b.learner.displayName));
  const all = rows.flatMap(r => r.goals);
  return {
    rows,
    totals: {
      open: all.filter(g => g.status !== 'achieved').length,
      overdue: all.filter(g => g.status === 'overdue').length,
      dueSoon: all.filter(g => g.status === 'due-soon').length,
      achieved: all.filter(g => g.status === 'achieved').length,
      withoutGoal: rows.filter(r => !r.open).length
    }
  };
}

// The newest observation per provider/curriculum/course, newest first.
export function latestObservations(records = []) {
  const latest = new Map();
  [...records].sort((a, b) => (b.dataAsOf || '').localeCompare(a.dataAsOf || '')).forEach(r => {
    const key = JSON.stringify([r.provider, r.curriculum, r.course]);
    if (!latest.has(key)) latest.set(key, r);
  });
  return [...latest.values()];
}

export const STALE_AFTER_DAYS = 30;

export function academicRow(learner, result, today) {
  if (!result || result.loading) return { learner, state: 'loading', courses: [] };
  if (result.error) return { learner, state: 'error', courses: [], error: result.error };
  const courses = latestObservations(result.items);
  if (!courses.length) return { learner, state: 'none', courses };
  const lastObserved = courses.reduce((max, r) => r.dataAsOf > max ? r.dataAsOf : max, '');
  const age = daysBetween(lastObserved, today);
  return { learner, state: age > STALE_AFTER_DAYS ? 'stale' : 'current', courses, lastObserved, age };
}

export function summarizeAcademic(rows) {
  return {
    current: rows.filter(r => r.state === 'current').length,
    stale: rows.filter(r => r.state === 'stale').length,
    none: rows.filter(r => r.state === 'none').length,
    loading: rows.filter(r => r.state === 'loading').length,
    error: rows.filter(r => r.state === 'error').length
  };
}

// Monday-start weeks covering [from, from + days), each with the events touching it.
export function upcomingWeeks(events, from, days = 56) {
  const to = addDays(from, days - 1);
  const offset = (new Date(`${from}T00:00:00Z`).getUTCDay() + 6) % 7;
  const weeks = [];
  for (let start = addDays(from, -offset); start <= to; start = addDays(start, 7)) {
    const end = addDays(start, 6);
    const list = events.filter(e => e.startDate <= end && e.endDate >= start && e.endDate >= from);
    weeks.push({ start, end, events: list, isCurrent: start <= from && end >= from });
  }
  return weeks;
}
