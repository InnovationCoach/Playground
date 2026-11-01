/**
 * Self-check logic for mission steps. Practice feedback only: results are never
 * marks, never saved and never used for access or rewards.
 */

/** Reads what a learner typed: "19,070", "19 070 kg", "41.7" → number; anything else → null. */
export function parseNumber(raw) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/[a-zA-Z²³/%\s]+$/u, '').replace(/[,\s ](?=\d{3}\b)/g, '').replace(/\s+/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

/**
 * 'correct' within the step's tolerance; 'close' within 10% (often rounding or a
 * unit slip); 'incorrect' otherwise; 'invalid' when it is not a number.
 */
export function checkNumber(step, raw) {
  const value = parseNumber(raw);
  if (value === null) return 'invalid';
  const rel = Math.abs(value - step.answer) / Math.max(Math.abs(step.answer), 1e-9);
  if (rel <= step.tolerance) return 'correct';
  if (rel <= 0.1) return 'close';
  return 'incorrect';
}

export const checkChoice = (step, id) => (id === step.answer ? 'correct' : 'incorrect');

export const FEEDBACK = {
  correct: 'That matches. Nice working.',
  close: 'Close. Check your rounding and units.',
  incorrect: 'Not yet. Try a hint, or check each step of your working.',
  invalid: 'Type a number, for example 41.7 (units are optional).'
};

/** Answer shown in the worked solution, rounded the way the prompt asks. */
export function displayAnswer(step) {
  const v = step.answer;
  const rounded = Math.abs(v) >= 1000 ? Math.round(v / 10) * 10 : Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${rounded.toLocaleString('en-US')} ${step.unit}`;
}
