import { describe, it, expect } from 'vitest';
import { isTestAccount, isRosterLearner, isLearnerInScope } from '../src/features/coach/learners/rosterFilter.js';

const learner = (over = {}) => ({ role: 'student', status: 'active', email: 'mia@school.edu', ...over });

describe('coach roster filter', () => {
  it('keeps real learners whose address merely contains "test"', () => {
    for (const email of ['latest.kim@school.edu', 'kim@contest.org', 'attest.ed@school.edu', 'latest@school.edu']) {
      expect(isTestAccount({ email })).toBe(false);
    }
  });

  it('still recognises test accounts', () => {
    for (const email of ['test@school.edu', 'test.student@school.edu', 'admin.test@school.edu', 'a@test.org', 'a@hearisland-test.org', 'TEST.A@school.edu']) {
      expect(isTestAccount({ email })).toBe(true);
    }
    expect(isTestAccount({ email: 'mia@school.edu', isTest: true })).toBe(true);
  });

  it('lists active, pending and self-enrolled (no status) learners', () => {
    expect(isRosterLearner(learner())).toBe(true);
    expect(isRosterLearner(learner({ status: 'pending' }))).toBe(true);
    expect(isRosterLearner(learner({ status: undefined }))).toBe(true);
  });

  it('leaves out suspended, archived, staff and test accounts', () => {
    expect(isRosterLearner(learner({ status: 'suspended' }))).toBe(false);
    expect(isRosterLearner(learner({ status: 'archived' }))).toBe(false);
    expect(isRosterLearner(learner({ role: 'teacher' }))).toBe(false);
    expect(isRosterLearner(learner({ role: 'parent' }))).toBe(false);
    expect(isRosterLearner(learner({ email: 'test.student@school.edu' }))).toBe(false);
  });
});

describe('coach class picker scope', () => {
  const classes = [{ id: 'c-wls', cohortId: 'cohort-wls' }, { id: 'c-whs', cohortId: 'cohort-whs' }, { id: 'c-none', cohortId: null }];

  it('matches every learner on all, and class members on a class', () => {
    expect(isLearnerInScope({ classIds: [] }, 'all', classes)).toBe(true);
    expect(isLearnerInScope({ classIds: ['c-wls'] }, 'c-wls', classes)).toBe(true);
    expect(isLearnerInScope({ classIds: ['c-whs'] }, 'c-wls', classes)).toBe(false);
  });

  it('matches a cohort on the learner\'s own cohortId first', () => {
    expect(isLearnerInScope({ cohortId: 'cohort-wls', classIds: ['c-whs'] }, 'cohort:cohort-wls', classes)).toBe(true);
    expect(isLearnerInScope({ cohortId: 'cohort-wls', classIds: ['c-whs'] }, 'cohort:cohort-whs', classes)).toBe(false);
  });

  it('places a learner with no cohortId by the cohort of their class', () => {
    expect(isLearnerInScope({ classIds: ['c-wls'] }, 'cohort:cohort-wls', classes)).toBe(true);
    expect(isLearnerInScope({ classIds: ['c-wls'] }, 'cohort:cohort-whs', classes)).toBe(false);
    expect(isLearnerInScope({ classIds: ['c-none'] }, 'cohort:cohort-wls', classes)).toBe(false);
  });
});
