import { describe, it, expect } from 'vitest';
import { cohortForAge, SCHOOL_COHORTS } from '../src/utils/schoolCohorts.js';

describe('school cohort boundaries', () => {
  it.each([[6, 'LPRI'], [8, 'LPRI'], [9, 'HPRI'], [10, 'HPRI'], [11, 'LSEC'], [14, 'LSEC'], [15, 'HSEC'], [18, 'HSEC']])('assigns age %s to %s', (age, code) => {
    expect(cohortForAge(age)?.code).toBe(code);
    expect(SCHOOL_COHORTS.filter(c => age >= c.minAge && age < c.maxAgeExclusive)).toHaveLength(1);
  });
  it.each([5, 19, NaN, undefined, '9'])('does not assign unsupported age %s', age => {
    expect(cohortForAge(age)).toBeNull();
  });
});
