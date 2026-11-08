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

import { cohortForGrade, validateGradeAndCohort } from '../server/lib/schoolScope.js';
import { programPrompt } from '../server/lib/ai/programGeneration.js';

describe('secondary programme grade and cohort derivation', () => {
  it('derives cohort-wls for Grade 5, 6, 7, 8', () => {
    expect(cohortForGrade(5)).toBe('cohort-wls');
    expect(cohortForGrade(6)).toBe('cohort-wls');
    expect(cohortForGrade(7)).toBe('cohort-wls');
    expect(cohortForGrade(8)).toBe('cohort-wls');
  });

  it('derives cohort-whs for Grade 8, 9, 10, 11, 12', () => {
    expect(cohortForGrade(9)).toBe('cohort-whs');
    expect(cohortForGrade(10)).toBe('cohort-whs');
    expect(cohortForGrade(11)).toBe('cohort-whs');
    expect(cohortForGrade(12)).toBe('cohort-whs');
  });

  it('returns null for grades outside 5-12', () => {
    expect(cohortForGrade(4)).toBeNull();
    expect(cohortForGrade(13)).toBeNull();
    expect(cohortForGrade('abc')).toBeNull();
  });

  it('validates matching grade and cohort', () => {
    expect(validateGradeAndCohort({ gradeLevel: 5, cohortId: 'cohort-wls' })).toEqual({
      gradeLevel: 5,
      cohortId: 'cohort-wls'
    });
    expect(validateGradeAndCohort({ gradeLevel: 7, cohortId: 'cohort-wls' })).toEqual({
      gradeLevel: 7,
      cohortId: 'cohort-wls'
    });
    expect(validateGradeAndCohort({ gradeLevel: 8, cohortId: 'cohort-wls' })).toEqual({
      gradeLevel: 8,
      cohortId: 'cohort-wls'
    });
    expect(validateGradeAndCohort({ gradeLevel: 8, cohortId: 'cohort-whs' })).toEqual({
      gradeLevel: 8,
      cohortId: 'cohort-whs'
    });
    expect(validateGradeAndCohort({ gradeLevel: 10, cohortId: 'cohort-whs' })).toEqual({
      gradeLevel: 10,
      cohortId: 'cohort-whs'
    });
  });

  it('automatically derives cohort when cohortId is omitted', () => {
    expect(validateGradeAndCohort({ gradeLevel: 5 })).toEqual({
      gradeLevel: 5,
      cohortId: 'cohort-wls'
    });
    expect(validateGradeAndCohort({ gradeLevel: 7 })).toEqual({
      gradeLevel: 7,
      cohortId: 'cohort-wls'
    });
    expect(validateGradeAndCohort({ gradeLevel: 11 })).toEqual({
      gradeLevel: 11,
      cohortId: 'cohort-whs'
    });
  });

  it('rejects gradeLevel outside 5-12', () => {
    expect(() => validateGradeAndCohort({ gradeLevel: 4 })).toThrow(/Grade level must be between 5 and 12/);
    expect(() => validateGradeAndCohort({ gradeLevel: 13 })).toThrow(/Grade level must be between 5 and 12/);
  });

  it('rejects mismatching cohortId for given grade', () => {
    expect(() => validateGradeAndCohort({ gradeLevel: 7, cohortId: 'cohort-whs' })).toThrow(
      /Cohort cohort-whs does not match grade level 7/
    );
    expect(() => validateGradeAndCohort({ gradeLevel: 10, cohortId: 'cohort-wls' })).toThrow(
      /Cohort cohort-wls does not match grade level 10/
    );
  });
});

describe('AI Course Maker prompt validation and privacy', () => {
  it('accepts programme WLS and WHS with grade range', () => {
    const resWls = programPrompt({ prompt: 'Renewable energy fundamentals', programme: 'WLS', gradeRange: [6, 8] });
    expect(resWls.user).toContain('Programme: WLS');
    expect(resWls.user).toContain('Target Grade Range: 6–8');

    const resWhs = programPrompt({ prompt: 'Advanced engineering design', programme: 'WHS', gradeRange: '9-12' });
    expect(resWhs.user).toContain('Programme: WHS');
  });

  it('rejects invalid programme code', () => {
    expect(() => programPrompt({ prompt: 'Valid prompt', programme: 'INVALID' })).toThrow(/Programme must be WLS or WHS/);
  });

  it('rejects clinical diagnoses in prompt', () => {
    expect(() => programPrompt({ prompt: 'Curriculum unit for student with ADHD and dyslexia' })).toThrow(
      /Do not send clinical diagnoses to the AI model/
    );
    expect(() => programPrompt({ prompt: 'Unit tailored for autism spectrum learner' })).toThrow(
      /Do not send clinical diagnoses to the AI model/
    );
  });
});
