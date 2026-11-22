import { describe, it, expect } from 'vitest';
import { learnerCohortId, COHORT_SCOPES } from '../src/features/coach/learners/learnerCohort.js';
import { programFitsCohort, cohortForClass, CLASS_COHORT_LABELS } from '../src/features/coach/ClassProgramsPanel.jsx';

describe('learnerCohortId (coach class filter WLS/WHS)', () => {
  it('uses cohortId first', () => {
    expect(learnerCohortId({ cohortId: 'cohort-wls', groupName: 'WHS Higher Secondary' })).toBe('cohort-wls');
    expect(learnerCohortId({ cohortId: 'WHS' })).toBe('cohort-whs');
  });
  it('falls back to the legacy cohort field and group name', () => {
    expect(learnerCohortId({ cohort: 'higher-secondary' })).toBe('cohort-whs');
    expect(learnerCohortId({ groupName: 'WLS Lower Secondary' })).toBe('cohort-wls');
    expect(learnerCohortId({ groupName: 'WHS Higher Secondary' })).toBe('cohort-whs');
  });
  it('falls back to grade, never to yearLevel', () => {
    expect(learnerCohortId({ gradeLevel: 7 })).toBe('cohort-wls');
    expect(learnerCohortId({ grade: 'Grade 10' })).toBe('cohort-whs');
    expect(learnerCohortId({ yearLevel: 'Year 9' })).toBeNull();
  });
  it('returns null when nothing says', () => {
    expect(learnerCohortId({ groupName: 'Climate Champions' })).toBeNull();
    expect(learnerCohortId(null)).toBeNull();
  });
  it('places WeLearn Primary (WPR) learners by cohortId, full name or grade 1–5', () => {
    expect(learnerCohortId({ cohortId: 'cohort-wpr' })).toBe('cohort-wpr');
    expect(learnerCohortId({ groupName: 'WeLearn Primary' })).toBe('cohort-wpr');
    expect(learnerCohortId({ gradeLevel: 3 })).toBe('cohort-wpr');
    expect(learnerCohortId({ gradeLevel: 5 })).toBe('cohort-wpr');
  });
  it('does not read the school name "WPR International School" as the WPR cohort', () => {
    expect(learnerCohortId({ groupName: 'WPR International School', gradeLevel: 10 })).toBe('cohort-whs');
    expect(learnerCohortId({ groupName: 'WPR International School' })).toBeNull();
  });
  it('lists the three cohort choices the select offers', () => {
    expect(COHORT_SCOPES).toEqual(['cohort:cohort-wpr', 'cohort:cohort-wls', 'cohort:cohort-whs']);
  });
});

describe('programFitsCohort (class program picker)', () => {
  it('puts a program spanning both cohorts in both, so each class lists it under its own cohort', () => {
    expect(programFitsCohort({ ageBand: '11-16' }, 'WLS')).toBe(true);
    expect(programFitsCohort({ ageBand: '11-16' }, 'WHS')).toBe(true);
  });
  it('keeps single-cohort programs to their cohort', () => {
    expect(programFitsCohort({ ageBand: '15-18' }, 'WLS')).toBe(false);
    expect(programFitsCohort({ ageBand: '15-18' }, 'WHS')).toBe(true);
    expect(programFitsCohort({ ageBand: '11-14' }, 'WHS')).toBe(false);
    expect(programFitsCohort({ targetAgeRange: 'Ages 12–14' }, 'WLS')).toBe(true);
  });
  it('treats a program without an age band as fitting any cohort', () => {
    expect(programFitsCohort({}, 'WLS')).toBe(true);
    expect(programFitsCohort({}, 'WHS')).toBe(true);
    expect(programFitsCohort({}, 'WPR')).toBe(true);
  });
  it('fits primary programs (about ages 6–10) to WPR only', () => {
    expect(programFitsCohort({ ageBand: '6-10' }, 'WPR')).toBe(true);
    expect(programFitsCohort({ ageBand: '6-10' }, 'WLS')).toBe(false);
    expect(programFitsCohort({ ageBand: '11-16' }, 'WPR')).toBe(false);
    expect(programFitsCohort({ ageBand: '9-17' }, 'WPR')).toBe(true);
  });
});

describe('cohortForClass with WeLearn Primary', () => {
  it('reads WPR and the retired primary cohorts as WPR', () => {
    expect(cohortForClass({ cohortId: 'cohort-wpr', name: 'Makers' })).toBe('WPR');
    expect(cohortForClass({ cohortId: 'cohort-higher-primary' })).toBe('WPR');
    expect(cohortForClass({ name: 'Primary A' })).toBe('WPR');
    expect(cohortForClass({ name: 'Grade 3 Explorers' })).toBe('WPR');
  });
  it('does not treat the school prefix in class-wpr-11a as primary', () => {
    expect(cohortForClass({ id: 'class-wpr-11a', name: 'class-wpr-11a' })).toBe('WHS');
  });
  it('has a badge label for every cohort', () => {
    expect(CLASS_COHORT_LABELS.WPR).toBe('Primary · WPR (Grades 1–5)');
  });
});
