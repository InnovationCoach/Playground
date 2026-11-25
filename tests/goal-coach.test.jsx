// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../src/features/goals/goalAiService.js', () => ({
  suggestGoalMilestones: vi.fn(async () => ({
    measurableOutcome: '',
    steps: [
      { text: 'List the algebra topics on the test', frequency: 'once' },
      { text: 'Do 10 practice questions', frequency: 'daily' },
      { text: 'Take a timed practice test', frequency: 'weekly' }
    ],
    aiGenerated: false
  }))
}));

import {
  analyseGoalText, parseTimeframe, detectSubject, inferGoalType, smartCheck, outcomeSuggestions,
  coachIdeas, buildCoachGoal, academicLanes, roadmapWeeks, timeframeDate, daysBetween
} from '../src/features/goals/goalCoach.js';
import { hydratePlan, coachGoalDocs } from '../src/features/goals/goalPlan.js';
import { GoalCoach } from '../src/features/goals/GoalCoach.jsx';

const TODAY = '2026-11-24';

describe('goal coach: reading the learner’s goal', () => {
  it('detects academic goals, subject and time frame from plain words', () => {
    const a = analyseGoalText('Get 85% on my next algebra test in 3 weeks', { today: TODAY });
    expect(a.category).toBe('academic');
    expect(a.subject).toBe('Mathematics');
    expect(a.timeframe).toEqual({ days: 21, date: '2026-12-15' });
    expect(a.hasNumber).toBe(true);
  });

  it('prefers the learner’s own subject names and recognises other categories', () => {
    expect(detectSubject('revise for AP Physics C', [{ subject: 'AP Physics C' }])).toBe('AP Physics C');
    expect(analyseGoalText('Build and test a prototype with my team for the showcase').category).toBe('pbl');
    expect(analyseGoalText('Learn to code a game in Python').category).toBe('skills');
    expect(analyseGoalText('Stop procrastinating and plan my week with a routine').category).toBe('personal');
    const linked = analyseGoalText('finish the solar car challenge build', { pblProjects: [{ id: 'p1', title: 'Solar Car Challenge' }] });
    expect(linked.category).toBe('pbl');
    expect(linked.project).toEqual({ id: 'p1', title: 'Solar Car Challenge' });
  });

  it('parses time frames and ignores dates in the past', () => {
    expect(parseTimeframe('in two weeks', TODAY).days).toBe(14);
    expect(parseTimeframe('next month', TODAY).days).toBe(30);
    expect(parseTimeframe('by 2026-12-01', TODAY)).toEqual({ days: 7, date: '2026-12-01' });
    expect(parseTimeframe('by 2025-01-01', TODAY)).toBeNull();
    expect(parseTimeframe('soon', TODAY)).toBeNull();
    expect(timeframeDate('2w', TODAY)).toBe('2026-12-08');
    expect(daysBetween(TODAY, '2026-12-08')).toBe(14);
  });

  it('infers a goal type that exists in each category', () => {
    expect(inferGoalType('academic', 'pass my chemistry exam')).toBe('assignment-exam');
    expect(inferGoalType('academic', 'raise my grade to a B')).toBe('performance-target');
    expect(inferGoalType('pbl', 'interview 5 users for research')).toBe('research-target');
    expect(inferGoalType('skills', 'speak confidently in a pitch')).toBe('communication-skill');
    expect(inferGoalType('personal', 'sleep before 10pm')).toBe('wellbeing-growth');
  });
});

describe('goal coach: SMART check, suggestions and saving', () => {
  it('scores each SMART letter only when it is really there', () => {
    const empty = smartCheck({}, TODAY);
    expect(empty.score).toBe(0);
    const full = smartCheck({
      explore: 'Get 85% on my next algebra test',
      category: 'academic',
      subject: 'Mathematics',
      measurableOutcome: 'Score 85% on a practice test',
      targetDate: '2026-12-15',
      steps: [{ text: 'a' }, { text: 'b' }]
    }, TODAY);
    expect(full.score).toBe(5);
    const noSubject = smartCheck({ explore: 'Get better at my studies', category: 'academic', targetDate: '2026-11-20' }, TODAY);
    expect(noSubject.items.find((i) => i.id === 'relevant').met).toBe(false);
    expect(noSubject.items.find((i) => i.id === 'timebound').met).toBe(false);
  });

  it('reuses the learner’s own target number in outcome suggestions', () => {
    const [first] = outcomeSuggestions({ category: 'academic', subject: 'Mathematics', explore: 'get 85% on algebra', goalType: 'assignment-exam' });
    expect(first).toContain('85%');
    expect(outcomeSuggestions({ category: 'pbl', projectTitle: 'Solar Car' })[0]).toContain('Solar Car');
  });

  it('offers subject ideas only for the chosen subject', () => {
    const ideas = coachIdeas({ presetCategory: 'academic', presetSubject: 'Biology' });
    expect(ideas).toHaveLength(4);
    expect(ideas.every((i) => i.includes('Biology'))).toBe(true);
    expect(coachIdeas({ subjects: [{ subject: 'Chemistry' }] })[0]).toContain('Chemistry');
  });

  it('builds a plan goal that survives hydration and shows the learner’s own words to coaches', () => {
    const goal = buildCoachGoal({
      explore: 'Get 85% on my next algebra test',
      category: 'academic',
      subject: 'Mathematics',
      targetDate: '2026-12-15',
      measurableOutcome: 'Score 85% on a practice test',
      steps: [{ text: 'Do 10 questions', frequency: 'daily', aiSuggested: true }, { text: '  ' }]
    }, { supports: ['timer', 'checklist', 'quiet', 'example'] });
    expect(goal.steps).toHaveLength(1);
    expect(goal.supports).toHaveLength(3);
    expect(goal.goalType).toBe('assignment-exam');
    const plan = hydratePlan({ version: 3, goals: [goal] });
    expect(plan.goals[0]).toMatchObject({ source: 'coach', subject: 'Mathematics', targetDate: '2026-12-15' });
    expect(coachGoalDocs(plan)[0].summary).toBe('Get 85% on my next algebra test · Score 85% on a practice test');
  });
});

describe('academic planner data', () => {
  const plan = hydratePlan({
    version: 3,
    goals: [
      { id: 'a', explore: 'Algebra test', category: 'academic', subject: 'Mathematics', targetDate: '2026-11-27', steps: [{ id: 's1', text: 'x', done: true }, { id: 's2', text: 'y' }] },
      { id: 'b', explore: 'Late essay', category: 'academic', subject: 'English', targetDate: '2026-11-20', steps: [] },
      { id: 'c', explore: 'Prototype', category: 'pbl', targetDate: '2027-03-01', steps: [] }
    ]
  });

  it('builds subject lanes from the record and goals without inventing progress', () => {
    const lanes = academicLanes(plan, { subjects: [{ subject: 'Biology', provider: 'Edmentum', progressPct: 40 }] }, TODAY);
    const maths = lanes.find((l) => l.subject === 'Mathematics');
    expect(maths).toMatchObject({ activeCount: 1, stepsDone: 1, stepsTotal: 2, stepPct: 50, recordPct: null });
    expect(maths.next.daysLeft).toBe(3);
    expect(lanes.find((l) => l.subject === 'Biology')).toMatchObject({ recordPct: 40, activeCount: 0 });
    expect(lanes.some((l) => l.subject === 'Prototype')).toBe(false);
  });

  it('places target dates in week columns with overdue and later buckets', () => {
    const cols = roadmapWeeks(plan.goals, TODAY);
    expect(cols[0].items.map((i) => i.goal.id)).toEqual(['b']);
    expect(cols[1].items.map((i) => i.goal.id)).toEqual(['a']);
    expect(cols.at(-1).id).toBe('later');
  });
});

describe('GoalCoach conversation', () => {
  let host;
  let root;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  const click = (re) => {
    const b = [...host.querySelectorAll('button')].find((x) => re.test(x.textContent));
    if (!b) throw new Error(`no button ${re}`);
    return act(async () => { b.click(); });
  };

  it('walks from a typed goal to a saved SMART goal', async () => {
    const onSave = vi.fn();
    await act(async () => {
      root.render(<GoalCoach firstName="Mia" supports={['timer']} onSave={onSave} onCancel={() => {}} />);
    });
    expect(host.textContent).toContain('Hi Mia!');

    const input = host.querySelector('#gc-input');
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Get 85% on my next algebra test');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => { host.querySelector('form.gc-input-row').requestSubmit(); });
    expect(host.textContent).toContain('academic goal in Mathematics');

    await click(/Yes, that’s right/);
    expect(host.textContent).toContain('By when');
    await click(/In 2 weeks/);
    expect(host.textContent).toContain('How will you know');
    await click(/Score 85%/);
    expect(host.querySelectorAll('.gc-step')).toHaveLength(3);
    expect(host.textContent).toContain('Built-in planner');
    expect(host.querySelector('.gc-smart-ring').getAttribute('aria-label')).toBe('SMART score 5 of 5');

    await click(/^Save my goal$/);
    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0];
    expect(saved).toMatchObject({ source: 'coach', category: 'academic', subject: 'Mathematics', supports: ['timer'] });
    expect(saved.steps).toHaveLength(3);
    expect(saved.measurableOutcome).toContain('85%');
    await act(async () => { root.unmount(); });
    host.remove();
  });
});
