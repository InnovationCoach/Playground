/**
 * Coach Learners page: one row per learner from real saved records only
 * (src/features/coach/learners/learnersModel.js).
 */
import { describe, it, expect } from 'vitest';
import {
  learnerRow, classSummary, filterRows, minutesByDay, lastDays, programSummaries, lastActiveText, displayName, QUIET_DAYS
} from '../src/features/coach/learners/learnersModel.js';
import { newPlan, dayKey } from '../src/features/goals/goalPlan.js';
import { PROGRAM_ID } from '../src/features/pbl/programs/tools/entrepreneurship.js';

const TODAY = new Date(2026, 9, 23, 12);
const day = (n) => dayKey(new Date(2026, 9, 23 - n, 12));
const at = (n) => new Date(2026, 9, 23 - n, 10).getTime();
const user = (over = {}) => ({ uid: 'u1', givenNames: 'Mia', surname: 'Chen', email: 'mia@school.edu', classIds: ['c1'], status: 'active', ...over });
const plan = (over = {}) => ({
  ...newPlan(), updatedAt: at(0),
  goals: [{ id: 'g1', explore: 'robots', showHow: null, supports: [], done: false, createdAt: 1,
    steps: [{ id: 's1', text: 'Sketch', done: true }, { id: 's2', text: 'Build', done: false }] }],
  days: { [day(0)]: ['step:g1:s1'] },
  ...over
});

describe('a learner with no records', () => {
  it('shows nothing invented, and flags them as new', () => {
    const r = learnerRow({ user: user() }, TODAY);
    expect(r.name).toBe('Mia Chen');
    expect(r.today).toEqual({ done: 0, total: 0 });
    expect(r.goals).toEqual([]);
    expect(r.programs).toEqual([]);
    expect(r.confidence).toBeNull();
    expect(r.hasMinutes).toBe(false);
    expect(r.minutesWeek).toBe(0);
    expect(r.lastActive).toBeNull();
    expect(r.flags.map((f) => f.id)).toEqual(['new']);
    expect(lastActiveText(r)).toBe('No activity yet');
  });
});

describe('a learner with goals, minutes and a program', () => {
  const progress = [{ id: `pbl-program-${PROGRAM_ID}`, data: {
    programId: PROGRAM_ID, startedAt: at(3), updatedAt: at(1),
    sessions: { 1: { done: true, confidence: 2, reflection: 'Lockers are the worst' }, 2: { done: true, confidence: 1 } }
  } }];
  const stats = [{ id: day(0), timeSpentMinutes: 30 }, { id: day(2), timeSpentMinutes: 15 }, { id: day(20), timeSpentMinutes: 99 }, { id: 'junk', timeSpentMinutes: 5 }];
  const r = learnerRow({ user: user({ goalPlan: plan() }), stats, progress }, TODAY);

  it('reads today, goals and minutes', () => {
    expect(r.today.total).toBeGreaterThan(0);
    expect(r.today.done).toBe(1);
    expect(r.goals[0]).toMatchObject({ text: 'robots', stepsDone: 1, stepsTotal: 2 });
    expect(r.minutesWeek).toBe(45);
    expect(r.minutesByDay).toHaveLength(14);
    expect(r.minutesByDay.at(-1)).toBe(30);
    expect(lastActiveText(r)).toBe('Today');
  });

  it('summarises the program and its confidence ratings, with reflections', () => {
    expect(r.programs).toHaveLength(1);
    expect(r.programs[0]).toMatchObject({ done: 2, ratings: [2, 1] });
    expect(r.programs[0].reflections[0]).toMatchObject({ session: 1, text: 'Lockers are the worst' });
    expect(r.confidence).toBe(1.5);
    expect(r.flags.map((f) => f.id)).toContain('confidence');
    expect(r.needsCheckIn).toBe(true);
  });
});

describe('flags', () => {
  it('marks a learner quiet after a week, and shows account states', () => {
    const quiet = learnerRow({ user: user({ goalPlan: plan({ updatedAt: at(QUIET_DAYS + 2), days: {} }) }) }, TODAY);
    expect(quiet.flags.map((f) => f.id)).toEqual(['quiet']);
    expect(quiet.quietDays).toBe(QUIET_DAYS + 2);
    const suspended = learnerRow({ user: user({ status: 'suspended' }) }, TODAY);
    expect(suspended.flags[0].id).toBe('suspended');
    const pending = learnerRow({ user: user({ status: 'pending', ageBand: 'primary' }) }, TODAY);
    expect(pending.primary).toBe(true);
    expect(pending.flags.map((f) => f.id)).toContain('consent');
  });

  it('flags a plan with no goal and no habit', () => {
    const r = learnerRow({ user: user({ goalPlan: { ...newPlan(), updatedAt: at(0) } }) }, TODAY);
    expect(r.flags.map((f) => f.id)).toEqual(['no-goal']);
  });
});

describe('class figures and the list', () => {
  const rows = [
    learnerRow({ user: user({ uid: 'a', givenNames: 'Ava', surname: '', classIds: ['c1'], goalPlan: plan() }), stats: [{ id: day(0), timeSpentMinutes: 20 }] }, TODAY),
    learnerRow({ user: user({ uid: 'b', givenNames: 'Ben', surname: '', classIds: ['c2'] }) }, TODAY)
  ];
  it('adds up only what is there', () => {
    const s = classSummary(rows, TODAY);
    expect(s).toMatchObject({ learners: 2, active7: 1, needsCheckIn: 1, hasMinutes: true });
    expect(s.minutesPerDay).toHaveLength(14);
    expect(s.minutesPerDay.at(-1).minutes).toBe(20);
    expect(classSummary([], TODAY).hasMinutes).toBe(false);
  });
  it('filters by class, search and check-in, and puts check-ins first', () => {
    expect(filterRows(rows, { classId: 'c2' }).map((r) => r.uid)).toEqual(['b']);
    expect(filterRows(rows, { query: 'av' }).map((r) => r.uid)).toEqual(['a']);
    expect(filterRows(rows, { onlyCheckIn: true }).map((r) => r.uid)).toEqual(['b']);
    expect(filterRows(rows).map((r) => r.uid)).toEqual(['b', 'a']);
    expect(filterRows(rows, { sort: 'name' }).map((r) => r.uid)).toEqual(['a', 'b']);
  });
});

describe('helpers', () => {
  it('keeps only real day keys and positive minutes', () => {
    expect(minutesByDay([{ id: '2026-10-01', timeSpentMinutes: 12.4 }, { id: 'x', timeSpentMinutes: 9 }, { id: '2026-10-02', timeSpentMinutes: 0 }])).toEqual({ '2026-10-01': 12 });
  });
  it('lists days oldest first', () => {
    const d = lastDays(3, TODAY);
    expect(d).toEqual([day(2), day(1), day(0)]);
  });
  it('ignores progress docs that are not PBL programs or unknown programs', () => {
    expect(programSummaries([{ id: 'solar-car', data: {} }, { id: 'pbl-program-nope', data: { programId: 'nope' } }])).toEqual([]);
  });
  it('falls back sensibly for names', () => {
    expect(displayName({ email: 'tom@school.edu' })).toBe('tom');
    expect(displayName({ displayName: 'Inès D' })).toBe('Inès D');
  });
});
