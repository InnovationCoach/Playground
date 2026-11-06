import { describe, it, expect } from 'vitest';
import { cohortForAge, SCHOOL_COHORTS } from '../src/utils/schoolCohorts.js';

describe('programme cohort boundaries', () => {
  it.each([[6, 'LPRI'], [8, 'LPRI'], [9, 'HPRI'], [10, 'HPRI'], [11, 'WLS'], [14, 'WLS'], [15, 'WHS'], [18, 'WHS']])('assigns age %s to %s', (age, code) => {
    expect(cohortForAge(age)?.code).toBe(code);
    expect(SCHOOL_COHORTS.filter(c => age >= c.minAge && age < c.maxAgeExclusive)).toHaveLength(1);
  });
  it.each([5, 19, NaN, undefined, '9'])('does not assign unsupported age %s', age => {
    expect(cohortForAge(age)).toBeNull();
  });
  it('lists cohorts in primary, then WLS, then WHS order', () => {
    expect(SCHOOL_COHORTS.map(c => c.code)).toEqual(['LPRI', 'HPRI', 'WLS', 'WHS']);
  });
});
