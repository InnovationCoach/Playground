/**
 * Numbers behind the My Progress charts. Pure and record-driven: every ring is
 * proportional to a recorded count, and anything that cannot be verified
 * returns null so the UI says "not available" instead of showing zero.
 * Charts show what is done, never speed, ability or pressure.
 */
export const DIAL_FINISHES = [
  { id: 'theme', label: 'Follow light/dark theme' },
  { id: 'midnight', label: 'SPARK Night' },
  { id: 'ivory', label: 'Daylight' },
  { id: 'mint', label: 'Lime' }
];
export const hydrateDialFinish = (value) => DIAL_FINISHES.some((f) => f.id === value) ? value : 'theme';

const count = (n) => Number.isInteger(n) && n >= 0 ? n : null;

/** Recorded done/total as a reading, or null when it cannot be read honestly. */
export function completionReading(done, total) {
  const d = count(done), t = count(total);
  if (d == null || t == null || t === 0 || d > t) return null;
  return { done: d, total: t, fraction: d / t };
}

/** Every stage the course reports, in order. */
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
