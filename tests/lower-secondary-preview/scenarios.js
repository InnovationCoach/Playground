/**
 * Synthetic accounts. The contract here is the shape proposed to the backend
 * owner, handed straight to the selector: it stands in for a server response
 * that does not exist yet and proves nothing about production data.
 */
const person = (displayName) => ({ displayName });
const verified = (extra) => ({ verified: true, ...extra });
export const SCENARIOS = {
  age14: { label: 'Age 14', profile: person('Mira Okafor'), contract: verified({ age: 14 }) },
  age11: { label: 'Age 11', profile: person('Tao Lindqvist'), contract: verified({ age: 11 }) },
  age11primary: { label: 'Age 11, primary account', primary: true, profile: { ...person('Noor Haddad'), ageBand: 'primary' }, contract: verified({ age: 11 }) },
  age12new: { label: 'Age 12, new learner (no records)', profile: person('Sam Reyes'), classIds: [], contract: verified({ age: 12 }) },
  age15: { label: 'Age 15', profile: person('Jo Kim'), contract: verified({ age: 15 }) },
  older: { label: 'Age 17', profile: person('Ari Bello'), contract: verified({ age: 17 }) },
  under11: { label: 'Age 10', profile: person('Lu Chen'), contract: verified({ age: 10 }) },
  missing: { label: 'Age missing', profile: person('Kai Moss'), contract: verified({}) },
  invalid: { label: 'Age invalid', profile: person('Rae Silva'), contract: verified({ age: 'twelve' }) },
  ambiguous: { label: 'Range 13–15 (crosses rollout)', profile: person('Ivy Tran'), contract: verified({ ageRange: { min: 13, max: 15 } }) },
  unverified: { label: 'Unverified age 13', profile: person('Dee Park'), contract: { age: 13 } },
  overrideOn: { label: 'Age 15, staff override on', profile: person('Mo Adeyemi'), contract: verified({ age: 15, override: 'lowerSecondary' }) },
  overrideOff: { label: 'Age 13, staff override off', profile: person('Bea Novak'), contract: verified({ age: 13, override: 'existing' }) },
  overrideUnder: { label: 'Age 10, staff override on', profile: person('Eli Ross'), contract: verified({ age: 10, override: 'lowerSecondary' }) }
};
export const scenarioId = () => {
  const id = new URLSearchParams(location.search).get('learner');
  return Object.hasOwn(SCENARIOS, id || '') ? id : 'age14';
};
