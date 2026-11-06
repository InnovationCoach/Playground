import { describe, it, expect } from 'vitest';
import { isTestAccount, isRosterLearner } from '../src/features/coach/learners/rosterFilter.js';

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
