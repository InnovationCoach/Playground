/**
 * The strength-based goal plan behind #/goals and the daily goals notice.
 */
import { describe, it, expect } from 'vitest';
import {
  newPlan, hydratePlan, migrateLegacy, touch, hasPlan, goalSentence, todayItems, checkedToday,
  toggleToday, habitWeek, coachGoalDocs, dayKey, LIMITS, FOCUS_SKILLS
} from '../src/features/goals/goalPlan.js';
import { parseRoute, hrefFor } from '../src/app/routes.js';

const goal = (over = {}) => ({
  id: 'g1', explore: 'how black holes bend light', showHow: 'slides', supports: ['small-steps', 'timer'],
  steps: [{ id: 's1', text: 'Watch one video', done: false }, { id: 's2', text: 'Write 3 questions', done: false }],
  done: false, createdAt: 1, ...over
});
const withGoal = (over) => hydratePlan({ ...newPlan(), goals: [goal(over)] });

describe('goal plan storage', () => {
  it('survives junk', () => {
    for (const bad of [null, 'x', 42, [], { goals: 'no' }]) expect(hydratePlan(bad)).toEqual(newPlan());
  });

  it('drops unknown ids, empty goals and extras over the limits', () => {
    const p = hydratePlan({
      strengths: ['creative', 'made-up'], supports: ['timer', 'diagnosis'], phrases: ['break', 'x'], recharge: ['music', '?'],
      goals: [goal({ id: 'a' }), { explore: '   ' }, goal({ id: 'b' }), goal({ id: 'c' }), goal({ id: 'd' })],
      focus: { skill: 'not-a-skill', habit: 'x' }
    });
    expect(p.strengths).toEqual(['creative']);
    expect(p.supports).toEqual(['timer']);
    expect(p.phrases).toEqual(['break']);
    expect(p.recharge).toEqual(['music']);
    expect(p.goals.map((g) => g.id)).toEqual(['a', 'b', 'c']);
    expect(p.goals.length).toBe(LIMITS.goals);
    expect(p.focus).toBeNull();
  });

  it('keeps only the most recent days of check-ins', () => {
    const days = {};
    for (let i = 1; i <= 30; i += 1) days[`2026-09-${String(i).padStart(2, '0')}`] = ['habit'];
    days['not-a-day'] = ['habit'];
    const p = hydratePlan({ days });
    expect(Object.keys(p.days)).toHaveLength(LIMITS.days);
    expect(p.days['2026-09-30']).toEqual(['habit']);
    expect(p.days['not-a-day']).toBeUndefined();
  });

  it('carries goals over from the old wizard', () => {
    const p = migrateLegacy({ learningPath: 'climate', goals: ['Build a climate model', 'Learn Python basics'], completedGoals: [1] });
    expect(p.goals.map((g) => g.explore)).toEqual(['Build a climate model', 'Learn Python basics']);
    expect(p.goals.map((g) => g.done)).toEqual([false, true]);
    expect(hasPlan(p)).toBe(true);
    expect(hasPlan(newPlan())).toBe(false);
  });

  it('never stores a diagnosis field', () => {
    const p = hydratePlan({ diagnosis: 'ADHD', iep: 'yes', goals: [goal()] });
    expect(p).not.toHaveProperty('diagnosis');
    expect(p).not.toHaveProperty('iep');
  });
});

describe('dual-goal sentence', () => {
  it('pairs what to explore with how to show it and what helps', () => {
    expect(goalSentence(goal())).toBe(
      'I will explore how black holes bend light and show what I learn as a slide deck, with breaking work into small steps and a timer or time blocks helping me.'
    );
    expect(goalSentence(goal({ showHow: null, supports: [] }))).toBe('I will explore how black holes bend light.');
  });
});

describe('today', () => {
  const day = '2026-10-21';
  const plan = hydratePlan({
    goals: [goal()], recharge: ['music'],
    focus: { skill: 'starting', habit: 'Set a 5-minute timer and just begin', daysPerWeek: 4 }
  });

  it('lists the habit, the next step of each open goal and a recharge break', () => {
    const items = todayItems(plan);
    expect(items.map((i) => i.id)).toEqual(['habit', 'step:g1:s1', 'recharge']);
    expect(items[2].text).toBe('Recharge break: music');
  });

  it('ticking a step marks it done, keeps it on today\'s list and moves on tomorrow; unticking undoes it', () => {
    const step = todayItems(plan, day)[1];
    const on = toggleToday(plan, step, day, 5);
    expect(checkedToday(on, day).has(step.id)).toBe(true);
    expect(on.goals[0].steps[0].done).toBe(true);
    expect(on.updatedAt).toBe(5);
    expect(todayItems(on, day)[1].id).toBe('step:g1:s1');
    expect(todayItems(on, '2026-10-22')[1].id).toBe('step:g1:s2');
    const off = toggleToday(on, step, day, 6);
    expect(checkedToday(off, day).has(step.id)).toBe(false);
    expect(off.goals[0].steps[0].done).toBe(false);
  });

  it('skips finished goals and goals with every step done', () => {
    expect(todayItems(withGoal({ done: true })).length).toBe(0);
    const allDone = withGoal({ steps: [{ id: 's1', text: 'a', done: true }] });
    expect(todayItems(allDone).length).toBe(0);
  });

  it('counts the focus habit over the last 7 days', () => {
    const today = new Date(2026, 9, 21);
    let p = plan;
    for (const d of [new Date(2026, 9, 21), new Date(2026, 9, 19), new Date(2026, 9, 10)]) {
      p = toggleToday(p, { id: 'habit', kind: 'habit' }, dayKey(d));
    }
    const wk = habitWeek(p, today);
    expect(wk.days).toHaveLength(7);
    expect(wk.days.at(-1)).toEqual({ day: '2026-10-21', done: true });
    expect(wk.count).toBe(2);
    expect(wk.target).toBe(4);
  });
});

describe('coach mirror', () => {
  it('writes one coach goal per big goal plus the focus skill, in the fields the coach dashboard reads', () => {
    const p = touch(withGoal({ steps: [{ id: 's1', text: 'a', done: true }, { id: 's2', text: 'b', done: false }] }),
      { focus: { skill: FOCUS_SKILLS[0].id, habit: 'h', daysPerWeek: 5 } });
    const docs = coachGoalDocs(p, 9);
    expect(docs.map((d) => d.goalId)).toEqual(['plan_g1', 'plan_focus']);
    expect(docs[0]).toMatchObject({ title: 'how black holes bend light', status: 'on_track', completed: false, progress: 0.5 });
    expect(docs[1].title).toBe('Focus skill: Getting started on tasks');
    const finished = coachGoalDocs(withGoal({ done: true }))[0];
    expect(finished).toMatchObject({ status: 'achieved', completed: true, progress: 1 });
  });
});

describe('route', () => {
  it('#/goals is the goals page', () => {
    expect(parseRoute(hrefFor.goals())).toEqual({ screen: 'goals' });
  });
  it('#/search is the Home search; #/home is left to the live dashboard', () => {
    expect(hrefFor.homeSearch()).toBe('#/search');
    expect(parseRoute('#/search')).toEqual({ screen: 'homeSearch' });
    expect(parseRoute('#/home')).toBeNull();
  });
});
