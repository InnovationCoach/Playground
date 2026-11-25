import { describe, expect, it } from 'vitest';
import { academicRow, goalStatus, summarizeAcademic, summarizeGoals, upcomingWeeks } from '../src/features/school/coach/coachBoardModel.js';

const today = '2026-11-23';
const learners = [
  { id: 'a', displayName: 'Ava', classIds: ['c1'] },
  { id: 'b', displayName: 'Ben', classIds: ['c1'] },
  { id: 'c', displayName: 'Cleo', classIds: ['c1'] }
];

describe('coach goals board', () => {
  it('classifies goals by due date and state', () => {
    expect(goalStatus({ state: 'active', dueDate: '2026-11-20' }, today)).toBe('overdue');
    expect(goalStatus({ state: 'active', dueDate: '2026-11-28' }, today)).toBe('due-soon');
    expect(goalStatus({ state: 'active', dueDate: '2026-12-31' }, today)).toBe('active');
    expect(goalStatus({ state: 'achieved', dueDate: '2026-11-01' }, today)).toBe('achieved');
  });

  it('puts overdue learners first and counts learners without a goal', () => {
    const goals = [
      { id: 1, learnerUid: 'b', state: 'active', dueDate: '2026-11-01', acknowledged: false },
      { id: 2, learnerUid: 'a', state: 'achieved', dueDate: '2026-11-01' },
      { id: 3, learnerUid: 'b', state: 'active', dueDate: '2026-12-20', source: 'competency-pathway' },
      { id: 4, learnerUid: 'c', state: 'archived', dueDate: '2026-12-20' }
    ];
    const { rows, totals } = summarizeGoals(learners, goals, today);
    expect(rows.map(r => [r.learner.id, r.status])).toEqual([['b', 'overdue'], ['c', 'none'], ['a', 'achieved']]);
    expect(totals).toEqual({ open: 1, overdue: 1, dueSoon: 0, achieved: 1, withoutGoal: 2 });
    expect(rows[0].unacknowledged).toBe(1);
  });
});

describe('coach academic board', () => {
  it('keeps the newest observation per course and flags stale records', () => {
    const items = [
      { id: 'old', provider: 'edmentum', curriculum: 'G7', course: 'Math', completed: 2, total: 10, dataAsOf: '2026-09-01' },
      { id: 'new', provider: 'edmentum', curriculum: 'G7', course: 'Math', completed: 5, total: 10, dataAsOf: '2026-10-01' }
    ];
    const row = academicRow(learners[0], { items }, today);
    expect(row.courses.map(c => c.id)).toEqual(['new']);
    expect(row.state).toBe('stale');
    expect(academicRow(learners[1], { items: [] }, today).state).toBe('none');
    expect(academicRow(learners[2], undefined, today).state).toBe('loading');
    expect(summarizeAcademic([row, academicRow(learners[1], { items: [] }, today)])).toMatchObject({ stale: 1, none: 1, current: 0 });
  });
});

describe('upcoming calendar weeks', () => {
  it('starts on the current Monday and places multi-day events in every week they touch', () => {
    const events = [
      { id: 'trip', startDate: '2026-11-27', endDate: '2026-12-01' },
      { id: 'past', startDate: '2026-11-10', endDate: '2026-11-12' }
    ];
    const weeks = upcomingWeeks(events, today, 14);
    expect(weeks[0]).toMatchObject({ start: '2026-11-23', isCurrent: true });
    expect(weeks[0].events.map(e => e.id)).toEqual(['trip']);
    expect(weeks[1].events.map(e => e.id)).toEqual(['trip']);
    expect(weeks.flatMap(w => w.events).some(e => e.id === 'past')).toBe(false);
  });
});
