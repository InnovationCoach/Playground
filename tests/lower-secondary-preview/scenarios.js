/**
 * Synthetic accounts. `layoutSelection` copies the GET /api/me contract documented
 * in server/lib/layoutSelection.js (contractVersion 1, read while still under
 * backend review). These fixtures prove the adapter's parsing, not the server's
 * decisions or any production data: re-check them when the contract is cleared.
 */
const person = (displayName) => ({ displayName });
const selection = (layout, reason, extra = {}) => ({ contractVersion: 1, layout, reason, verified: true, source: 'none', staffOverride: null, overrideBlocked: false, ...extra });
const byAge = (age, layout, reason, extra = {}) => selection(layout, reason, { age, evidenceVerified: true, source: 'verified_dob', trustedAge: age, trustedAgeStatus: 'valid', ...extra });
export const SCENARIOS = {
  age14: { label: 'Age 14', profile: person('Mira Okafor'), layoutSelection: byAge(14, 'lower-secondary', 'eligible') },
  age11: { label: 'Age 11', profile: person('Tao Lindqvist'), layoutSelection: byAge(11, 'lower-secondary', 'eligible') },
  age11primary: { label: 'Age 11, primary account', primary: true, profile: { ...person('Noor Haddad'), ageBand: 'primary' }, layoutSelection: byAge(11, 'lower-secondary', 'eligible', { isPrimary: true }) },
  age12new: { label: 'Age 12, new learner (no records)', profile: person('Sam Reyes'), classIds: [], layoutSelection: byAge(12, 'lower-secondary', 'eligible') },
  age15: { label: 'Age 15', profile: person('Jo Kim'), layoutSelection: byAge(15, 'existing', 'older') },
  older: { label: 'Age 17', profile: person('Ari Bello'), layoutSelection: byAge(17, 'existing', 'older') },
  under11: { label: 'Age 10', profile: person('Lu Chen'), layoutSelection: byAge(10, 'existing', 'outside-rollout') },
  missing: { label: 'Age missing', profile: person('Kai Moss'), layoutSelection: selection('existing', 'missing') },
  invalid: { label: 'Age invalid', profile: person('Rae Silva'), layoutSelection: selection('existing', 'invalid', { age: null, trustedAgeStatus: 'invalid' }) },
  ambiguous: { label: 'Unverified signal (range 13–15)', profile: person('Ivy Tran'), layoutSelection: selection('existing', 'ambiguous', { ageRange: { min: 13, max: 15 } }) },
  unverified: { label: 'Malformed: not verified', profile: person('Dee Park'), layoutSelection: { contractVersion: 1, layout: 'lower-secondary', reason: 'eligible', age: 13 } },
  unsupported: { label: 'Malformed: unknown version', profile: person('Uma Fox'), layoutSelection: { ...byAge(13, 'lower-secondary', 'eligible'), contractVersion: 2 } },
  disagree: { label: 'Malformed: says yes, age 16', profile: person('Vic Stone'), layoutSelection: byAge(16, 'lower-secondary', 'eligible') },
  absent: { label: 'No layoutSelection in response', profile: person('Wes Hale') },
  overrideOn: { label: 'Age 15, staff override on', profile: person('Mo Adeyemi'), layoutSelection: byAge(15, 'lower-secondary', 'staff-override', { source: 'staff_override', override: 'lowerSecondary', staffOverride: 'lower-secondary' }) },
  overrideOff: { label: 'Age 13, staff override off', profile: person('Bea Novak'), layoutSelection: byAge(13, 'existing', 'staff-override', { source: 'staff_override', override: 'existing', staffOverride: 'existing' }) },
  overrideUnder: { label: 'Age 10, override blocked', profile: person('Eli Ross'), layoutSelection: byAge(10, 'existing', 'outside-rollout', { override: 'lowerSecondary', staffOverride: 'lower-secondary', overrideBlocked: true }) }
};
export const scenarioId = () => {
  const id = new URLSearchParams(location.search).get('learner');
  return Object.hasOwn(SCENARIOS, id || '') ? id : 'age14';
};
