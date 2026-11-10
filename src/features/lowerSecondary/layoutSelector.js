/**
 * Which student layout a signed-in account gets. Pure, unit-tested in
 * tests/lower-secondary-selector.test.js.
 *
 * The selector only trusts a verified server contract, supplied by
 * layoutContract.js, which stays off until the backend contract is cleared.
 *
 * Never select from ageBand (a missing band reads back as '13-15'), date of
 * birth, year level or email, and never from a query parameter or localStorage.
 */
export const LAYOUTS = Object.freeze({ EXISTING: 'existing', LOWER_SECONDARY: 'lowerSecondary' });
export const REASONS = Object.freeze({
  ELIGIBLE: 'eligible', OLDER: 'older', OUTSIDE_ROLLOUT: 'outside-rollout', MISSING: 'missing', INVALID: 'invalid',
  AMBIGUOUS: 'ambiguous', NOT_STUDENT: 'not-student', OVERRIDE_EXISTING: 'override-existing', OVERRIDE_LOWER_SECONDARY: 'override-lower-secondary'
});
export const ROLLOUT_MIN_AGE = 11;
export const ROLLOUT_MAX_AGE = 14;
export const SECTIONS = Object.freeze(['dashboard', 'learning', 'universe', 'portfolio']);

const isAge = (value) => Number.isInteger(value) && value >= 0 && value <= 120;

/** Read the contract's age evidence as { state, min, max }. */
function ageEvidence(contract) {
  if (contract?.age === undefined && contract?.ageRange === undefined) return { state: 'missing' };
  if (contract.age !== undefined) return isAge(contract.age) ? { state: 'known', min: contract.age, max: contract.age } : { state: 'invalid' };
  const { min, max } = contract.ageRange || {};
  return isAge(min) && isAge(max) && min <= max ? { state: 'known', min, max } : { state: 'invalid' };
}

const pick = (layout, reason) => ({ layout, reason });
const existing = (reason) => pick(LAYOUTS.EXISTING, reason);

/**
 * Precedence, first match wins:
 *   1. not a student, or no verified contract → existing
 *   2. invalid age data → existing (an override cannot paper over bad data)
 *   3. a staff override to existing → existing
 *   4. possibly under 11 → existing, even with an override: this rollout never
 *      silently opts in a younger child
 *   5. a staff override to lower secondary → lower secondary (resolves missing,
 *      ambiguous and older)
 *   6. missing → existing; range crossing the rollout → existing; 11–14 → lower
 *      secondary; 15+ → existing
 */
export function selectLayout({ role, contract } = {}) {
  if (role !== 'student') return existing(REASONS.NOT_STUDENT);
  if (!contract || contract.verified !== true) return existing(REASONS.MISSING);
  const age = ageEvidence(contract);
  if (age.state === 'invalid') return existing(REASONS.INVALID);
  const override = contract.override;
  if (override !== undefined && override !== null && !Object.values(LAYOUTS).includes(override)) return existing(REASONS.INVALID);
  if (override === LAYOUTS.EXISTING) return existing(REASONS.OVERRIDE_EXISTING);
  if (age.state === 'known' && age.min < ROLLOUT_MIN_AGE) return existing(age.max < ROLLOUT_MIN_AGE ? REASONS.OUTSIDE_ROLLOUT : REASONS.AMBIGUOUS);
  if (override === LAYOUTS.LOWER_SECONDARY) return pick(LAYOUTS.LOWER_SECONDARY, REASONS.OVERRIDE_LOWER_SECONDARY);
  if (age.state === 'missing') return existing(REASONS.MISSING);
  if (age.min > ROLLOUT_MAX_AGE) return existing(REASONS.OLDER);
  if (age.max > ROLLOUT_MAX_AGE) return existing(REASONS.AMBIGUOUS);
  return pick(LAYOUTS.LOWER_SECONDARY, REASONS.ELIGIBLE);
}

/**
 * The shell section to render, or null to leave App.jsx's existing branches in
 * charge. The shell only ever replaces My Dashboard; every other route keeps its
 * own guard. A primary account has no sign-in redirect, so its empty address
 * counts as the dashboard.
 */
export function shellSection({ layout, route, isPrimary }) {
  if (layout !== LAYOUTS.LOWER_SECONDARY) return null;
  if (route?.screen === 'dashboard') return SECTIONS.includes(route.section) ? route.section : 'dashboard';
  return !route && isPrimary ? 'dashboard' : null;
}
