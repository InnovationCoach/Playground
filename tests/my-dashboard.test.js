import { describe, it, expect } from 'vitest';
import {
  WIDGETS, DEFAULT_PREFS, MAX_INTERESTS, MAX_TAGLINE, hydratePrefs, toggleHidden, moveWidget, toggleInterest,
  loadSignals, goalSummary, streakDays, recordVisit, dayKey, academicProgress, projectProgress,
  xpSummary, badgeStatus, nextStep, reflectionPrompt, matchActivities, STORAGE_KEYS, TRACKED_ACTIVITIES, skillOfTheWeek
} from '../src/features/dashboard/dashboardModel.js';
import { newPlan, hydratePlan, toggleToday } from '../src/features/goals/goalPlan.js';
import { SKILLS } from '../src/features/futureSkills/content.js';
import { newProject, toggleTask, addEvidence, updateProject } from '../src/features/pbl/engine/pblProject.js';
import { PHASES, TERM, INTERESTS } from '../src/features/pbl/content/pblModel.js';

const UID = 'learner-1';
const NOW = new Date(2026, 9, 22, 10, 0, 0); // local 22 Oct 2026

/** A Map-backed stand-in for localStorage. */
function fakeStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    _map: map
  };
}

/** A Goals-page plan: big goals with steps, and optionally a focus habit. */
const planWith = ({ goals = [], focus = null, days = {} } = {}) => hydratePlan({ ...newPlan(), goals, focus, days });
const bigGoal = (id, steps, extra = {}) => ({
  id, explore: `goal ${id}`, showHow: null, supports: [], done: false, createdAt: 1,
  steps: steps.map((done, i) => ({ id: `${id}s${i}`, text: `step ${i + 1} of ${id}`, done })), ...extra
});

const hmwProject = (extra = {}) => updateProject(newProject(TERM.id), {
  problem: { hmw: 'How might we keep our school garden watered in a dry week?', who: '', why: '', criteria: '', constraints: '', impactMeasure: '' },
  ...extra
});

describe('widget preferences', () => {
  it('starts with every widget shown, in the default order', () => {
    const p = hydratePrefs(null);
    expect(p.order).toEqual(WIDGETS.map((w) => w.id));
    expect(p.hidden).toEqual([]);
    expect(p).toMatchObject({ accent: DEFAULT_PREFS.accent, cover: DEFAULT_PREFS.cover, calm: false, tagline: '' });
  });

  it('drops unknown widgets and appends newly added ones, so an old save never hides a widget', () => {
    const p = hydratePrefs({ order: ['badges', 'ghost', 'progress'], hidden: ['nope', 'goals'] });
    expect(p.order.slice(0, 2)).toEqual(['badges', 'progress']);
    expect(p.order).toHaveLength(WIDGETS.length);
    expect(p.order).not.toContain('ghost');
    expect(p.hidden).toEqual(['goals']);
  });

  it('rejects unknown accents, covers and interests, and caps the tagline and interests', () => {
    const p = hydratePrefs({
      accent: 'hotpink', cover: 'nope', tagline: 'x'.repeat(200),
      interests: [...INTERESTS, 'Dragons']
    });
    expect(p.accent).toBe(DEFAULT_PREFS.accent);
    expect(p.cover).toBe(DEFAULT_PREFS.cover);
    expect(p.tagline).toHaveLength(MAX_TAGLINE);
    expect(p.interests).toHaveLength(MAX_INTERESTS);
    expect(p.interests).not.toContain('Dragons');
  });

  it('moves widgets up and down, and treats the edges as a no-op', () => {
    const p = hydratePrefs(null);
    const first = p.order[0];
    const second = p.order[1];
    const moved = moveWidget(p, first, 1);
    expect(moved.order[0]).toBe(second);
    expect(moved.order[1]).toBe(first);
    expect(moveWidget(p, first, -1)).toBe(p);
    expect(moveWidget(p, p.order[p.order.length - 1], 1)).toBe(p);
  });

  it('toggles visibility and interests without mutating the input', () => {
    const p = hydratePrefs(null);
    const hidden = toggleHidden(p, 'goals');
    expect(hidden.hidden).toEqual(['goals']);
    expect(p.hidden).toEqual([]);
    expect(toggleHidden(hidden, 'goals').hidden).toEqual([]);

    const withInterest = toggleInterest(p, 'Space');
    expect(withInterest.interests).toEqual(['Space']);
    expect(toggleInterest(withInterest, 'Space').interests).toEqual([]);
  });
});

describe('goal progress (Goals page plan)', () => {
  it('returns null when nothing is set, so the widget can invite the learner to set a goal', () => {
    expect(goalSummary(null, NOW)).toBeNull();
    expect(goalSummary(newPlan(), NOW)).toBeNull();
  });

  it('counts each step, counts a finished goal in full, and points at the next step', () => {
    const g = goalSummary(planWith({ goals: [bigGoal('a', [true, false, false]), bigGoal('b', [false], { done: true }), bigGoal('c', [])] }), NOW);
    // a: 1 of 3 steps; b: done (1 unit); c: no steps (1 unit, not done) -> 2 of 5
    expect(g.total).toBe(5);
    expect(g.done).toBe(2);
    expect(g.percent).toBe(40);
    expect(g.achieved).toBe(1);
    expect(g.stepsDone).toBe(1); // b is marked done, but its step was never ticked
    expect(g.next).toEqual({ text: 'step 2 of a', goal: 'goal a' });
  });

  it('suggests a first step for a goal that has none', () => {
    const g = goalSummary(planWith({ goals: [bigGoal('c', [])] }), NOW);
    expect(g.next.text).toMatch(/first small step/);
  });

  it('reports the daily habit week and today\'s checklist', () => {
    let plan = planWith({ goals: [bigGoal('a', [false])], focus: { skill: 'starting', habit: 'Start with a timer', daysPerWeek: 4 } });
    plan = toggleToday(plan, { id: 'habit', kind: 'habit' }, dayKey(NOW));
    const g = goalSummary(plan, NOW);
    expect(g.habit).toMatchObject({ count: 1, target: 4 });
    expect(g.focusHabit).toBe('Start with a timer');
    expect(g.today).toEqual({ done: 1, total: 2 });
  });
});

describe('academic progress', () => {
  it('counts only the tracked activities the learner has started', () => {
    const a = academicProgress({ started: ['plants'] });
    expect(a.total).toBe(TRACKED_ACTIVITIES.length);
    expect(a.done).toBe(1);
    expect(a.percent).toBe(Math.round(100 / TRACKED_ACTIVITIES.length));
    expect(a.items.find((i) => i.id === 'plants').started).toBe(true);
  });

  it('never tracks SO2 - its saved state is per device, not per learner', () => {
    expect(TRACKED_ACTIVITIES.map((t) => t.id)).not.toContain('so2');
  });
});

describe('PBL progress', () => {
  it('averages the parts that exist: activities, tasks and readiness, plus goals and habit only once set', () => {
    const project = hmwProject();
    const withoutGoals = projectProgress(project, null, ['plants']);
    expect(withoutGoals.goals).toBeNull();
    expect(withoutGoals.habit).toBeNull();
    expect(withoutGoals.activities).toMatchObject({ done: 1, total: TRACKED_ACTIVITIES.length });
    const three = withoutGoals.activities.percent + withoutGoals.tasks.percent + withoutGoals.readiness.percent;
    expect(withoutGoals.overall).toBe(Math.round(three / 3));

    const goals = { done: 1, total: 1, percent: 100, habit: { count: 2, target: 4 } };
    const withGoals = projectProgress(project, goals, ['plants']);
    expect(withGoals.habit).toMatchObject({ done: 2, total: 4, percent: 50 });
    expect(withGoals.overall).toBe(Math.round((100 + 50 + three) / 5));
  });

  it('never counts more habit days than the weekly target', () => {
    const p = projectProgress(hmwProject(), { done: 0, total: 1, percent: 0, habit: { count: 7, target: 3 } }, []);
    expect(p.habit).toMatchObject({ done: 3, total: 3, percent: 100 });
  });

  it('counts every Design Thinking task across the phases, not just the current one', () => {
    let project = hmwProject();
    const firstPhase = PHASES[0];
    project = toggleTask(project, firstPhase.id, 0);
    project = toggleTask(project, PHASES[1].id, 0);
    const total = PHASES.reduce((n, p) => n + p.tasks.length, 0);
    const p = projectProgress(project, null);
    expect(p.tasks).toMatchObject({ done: 2, total });
  });

  it('counts evidence entries', () => {
    const { project } = addEvidence(hmwProject(), { title: 'Soil test', kind: 'data', phase: PHASES[0].id, body: 'pH 6.5' }, NOW.getTime());
    expect(projectProgress(project, null).evidence).toBe(1);
  });
});

describe('XP, level and badges', () => {
  it('grants XP for real work and turns each 100 XP into a level', () => {
    const project = hmwProject();
    const goals = { stepsDone: 2, achieved: 1, habit: { count: 3 } };
    const x = xpSummary({ started: ['solar', 'plants'], goals, project: toggleTask(project, PHASES[0].id, 0), readyDone: 1 });
    // 2 activities (80) + 2 steps (30) + 1 goal (30) + 3 habit days (15) + 1 task (5) + 1 check (10) = 170
    expect(x.xp).toBe(170);
    expect(x.level).toBe(2);
    expect(x.intoLevel).toBe(70);
  });

  it('earns badges only from what the learner has done', () => {
    const none = badgeStatus({ started: [], goals: null, project: newProject(TERM.id), streak: 0 });
    expect(none.every((b) => !b.earned)).toBe(true);

    const some = badgeStatus({ started: ['plants'], goals: null, project: hmwProject(), streak: 3 });
    const earned = Object.fromEntries(some.map((b) => [b.id, b.earned]));
    expect(earned['lab-explorer']).toBe(true);
    expect(earned['first-steps']).toBe(true);
    expect(earned['on-a-roll']).toBe(true);
    expect(earned['problem-finder']).toBe(true);
    expect(earned['full-explorer']).toBe(false);
    expect(earned['goal-setter']).toBe(false);
  });

  it('earns the goal badges from the Goals page plan', () => {
    const goals = { stepsDone: 1, achieved: 1, habit: { count: 5 } };
    const earned = Object.fromEntries(badgeStatus({ started: [], goals, project: newProject(TERM.id), streak: 0 }).map((b) => [b.id, b.earned]));
    expect(earned['goal-setter']).toBe(true);
    expect(earned['first-step']).toBe(true);
    expect(earned['goal-getter']).toBe(true);
    expect(earned['habit-hero']).toBe(true);
  });
});

describe('visits and streaks (this device)', () => {
  it('counts consecutive days ending today', () => {
    const visits = ['2026-10-20', '2026-10-21', '2026-10-22'];
    expect(streakDays(visits, '2026-10-22')).toBe(3);
  });

  it('keeps a streak alive until today starts, then counts from yesterday', () => {
    expect(streakDays(['2026-10-20', '2026-10-21'], '2026-10-22')).toBe(2);
  });

  it('breaks on a gap, and is zero with no visits', () => {
    expect(streakDays(['2026-10-18', '2026-10-19', '2026-10-22'], '2026-10-22')).toBe(1);
    expect(streakDays([], '2026-10-22')).toBe(0);
  });

  it('records each day once, in order', () => {
    expect(recordVisit(['2026-10-21'], '2026-10-22')).toEqual(['2026-10-21', '2026-10-22']);
    expect(recordVisit(['2026-10-22'], '2026-10-22')).toEqual(['2026-10-22']);
  });

  it('uses the local calendar day', () => {
    expect(dayKey(NOW)).toBe('2026-10-22');
  });
});

describe('loadSignals', () => {
  it('reads each saved record for this learner and ignores other learners', () => {
    const storage = fakeStorage({
      [STORAGE_KEYS.goals(UID)]: JSON.stringify(planWith({ goals: [bigGoal('a', [false])] })),
      [`hearisland.plantLab.v1:${UID}`]: JSON.stringify({ experiments: { a: {} } }),
      [`hearisland.plantLab.v1:someone-else`]: JSON.stringify({ experiments: { a: {} } }),
      [STORAGE_KEYS.visits(UID)]: JSON.stringify(['2026-10-21']),
      [STORAGE_KEYS.mood(UID)]: JSON.stringify({ day: '2026-10-22', mood: 'steady' })
    });
    const s = loadSignals(UID, storage, NOW);
    expect(s.started).toEqual(['plants']);
    expect(s.goals.total).toBe(1);
    expect(s.visits).toEqual(['2026-10-21']);
    expect(s.mood).toBe('steady');
    expect(s.project.termId).toBe(TERM.id);
  });

  it('forgets yesterday\'s mood, and survives unreadable storage', () => {
    const storage = fakeStorage({ [STORAGE_KEYS.mood(UID)]: JSON.stringify({ day: '2026-10-21', mood: 'stuck' }) });
    expect(loadSignals(UID, storage, NOW).mood).toBeNull();

    const broken = { getItem: () => { throw new Error('denied'); } };
    const s = loadSignals(UID, broken, NOW);
    expect(s.started).toEqual([]);
    expect(s.goals).toBeNull();
    expect(s.visits).toEqual([]);
  });
});

describe('next step', () => {
  const base = { started: [], goals: null, project: newProject(TERM.id) };

  it('asks for the project problem first when there is none', () => {
    expect(nextStep(base).id).toBe('problem');
  });

  it('finishes an unfinished goal ahead of everything else', () => {
    const goals = goalSummary(planWith({ goals: [bigGoal('a', [false])] }), NOW);
    const step = nextStep({ ...base, goals, project: hmwProject() });
    expect(step.id).toBe('goal');
    expect(step.target).toEqual({ type: 'goals' });
  });

  it('moves through untried activities, then evidence, then reflection', () => {
    const goals = goalSummary(planWith({ goals: [bigGoal('a', [true], { done: true })] }), NOW);
    expect(nextStep({ started: [], goals, project: hmwProject() }).id).toBe('try');
    const allStarted = TRACKED_ACTIVITIES.map((a) => a.id);
    expect(nextStep({ started: allStarted, goals, project: hmwProject() }).id).toBe('evidence');
    const threeEvidence = [1, 2, 3].reduce((p, n) => addEvidence(p, { title: `E${n}`, kind: 'note', phase: PHASES[0].id, body: 'x' }, NOW.getTime() + n).project, hmwProject());
    expect(nextStep({ started: allStarted, goals, project: threeEvidence }).id).toBe('reflect');
  });
});

describe('reflection prompt and interests', () => {
  it('gives the same prompt for the same day', () => {
    expect(reflectionPrompt('2026-10-22')).toBe(reflectionPrompt('2026-10-22'));
  });

  it('matches activities to chosen interests and says why', () => {
    const matches = matchActivities(['Space']);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((m) => m.because.includes('Space'))).toBe(true);
    expect(matchActivities([])).toEqual([]);
  });
});

describe('future skill of the week', () => {
  it('is one of the seven skills, the same all week, and changes week to week', () => {
    const monday = new Date(2026, 9, 19, 9);
    const friday = new Date(2026, 9, 23, 9);
    const nextWeek = new Date(2026, 9, 26, 9);
    expect(SKILLS).toContain(skillOfTheWeek(monday));
    expect(skillOfTheWeek(friday)).toBe(skillOfTheWeek(new Date(2026, 9, 23, 18)));
    const weeks = new Set(Array.from({ length: 7 }, (_, i) => skillOfTheWeek(new Date(2026, 0, 5 + 7 * i)).id));
    expect(weeks.size).toBe(7);
    expect(skillOfTheWeek(nextWeek)).toBeTruthy();
  });
});
