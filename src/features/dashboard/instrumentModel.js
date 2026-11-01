/**
 * Geometry for the dashboard instruments. Pure and record-driven: every angle
 * and arc is proportional to a recorded count, and anything that cannot be
 * verified returns null so the UI shows "unavailable" instead of zero.
 * Instruments show completion, never speed, ability or pressure.
 */
export const GAUGE = { start: -120, sweep: 240 };
export const DIAL_FINISHES = [
  { id: 'theme', label: 'Follow light/dark theme' },
  { id: 'midnight', label: 'SPARK Night' },
  { id: 'ivory', label: 'Daylight' },
  { id: 'mint', label: 'Lime' }
];
export const hydrateDialFinish = (value) => DIAL_FINISHES.some((f) => f.id === value) ? value : 'theme';

const count = (n) => Number.isInteger(n) && n >= 0 ? n : null;

/** Recorded done/total as a gauge reading, or null when it cannot be read honestly. */
export function gaugeReading(done, total) {
  const d = count(done), t = count(total);
  if (d == null || t == null || t === 0 || d > t) return null;
  const fraction = d / t;
  return { done: d, total: t, fraction, angle: GAUGE.start + GAUGE.sweep * fraction };
}

/**
 * Phase boundaries as dial milestones, in course order. Only drawn when the
 * course's phase session counts add up to the recorded total; otherwise the
 * positions would be invented, so none are returned.
 */
export function phaseMilestones(phases = [], summary) {
  if (!summary?.byPhase || !count(summary.total)) return [];
  let at = 0;
  const marks = [];
  for (const [index, phase] of phases.entries()) {
    const id = phase.id || phase.phaseId;
    const progress = summary.byPhase[id];
    if (!progress || count(progress.total) == null) return [];
    if (progress.total === 0) continue; // a stage with no sessions has no place on the dial
    at += progress.total;
    marks.push({ id, index, title: phase.title, at, angle: GAUGE.start + GAUGE.sweep * at / summary.total });
  }
  return at === summary.total ? marks : [];
}

/** Every stage the course reports, in order, whether or not it can be placed on the dial. */
export function phaseStages(phases = [], summary) {
  return phases.flatMap((phase, index) => {
    const id = phase.id || phase.phaseId;
    const progress = summary?.byPhase?.[id];
    return progress ? [{ id, index, title: phase.title, done: progress.done, total: progress.total, complete: !!progress.complete }] : [];
  });
}

/** Wording for learner-marked completion: not coach-verified, not assessed. */
export const COMPLETION_UNIT = 'sessions marked complete';

/** Checked personal steps. A goal marked achieved does not tick steps it never checked. */
export function goalSteps(goals = []) {
  const steps = goals.flatMap((goal) => goal.steps || []);
  return { done: steps.filter((step) => step.done).length, total: steps.length };
}

export function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}
export function arcPath(cx, cy, r, from, to) {
  if (to - from <= 0) return '';
  const [x0, y0] = polar(cx, cy, r, from), [x1, y1] = polar(cx, cy, r, to);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}
