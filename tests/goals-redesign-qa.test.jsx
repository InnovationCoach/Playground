// @vitest-environment jsdom
/**
 * Comprehensive QA & Integration Test Suite for the Redesigned Spark Goal Setting Feature:
 *   - Task 2: Academic, PBL, Skills, and Personal Development categories & subtypes
 *   - Task 3: Adventum (Edmentum) & School Academic Profile retrieval, recommendations, and manual fallback
 *   - Task 4: Intelligent Goal Creation & Gemini AI milestone/step suggestions
 *   - Task 5: Daily Goal Notifications (Academic, PBL, Approaching Deadlines, Overdue, Completed Exclusion, Duplicate Prevention, Preferences)
 *   - Task 6 & 7: Redesigned Goal Dashboard UI, Editing & Deleting Goals, Milestone Completion, Progress Sync, and Coach Mirroring
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/firebase.js', () => ({
  db: null,
  auth: { currentUser: { uid: 'learner-qa-1', getIdToken: vi.fn(async () => 'mock-token') } },
  doc: vi.fn(),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => ({}) })),
  setDoc: vi.fn(async () => {}),
  deleteDoc: vi.fn(async () => {}),
  usingEmulators: true
}));

vi.mock('../src/services/api/apiClient.js', () => ({
  schoolRequest: vi.fn()
}));

import { schoolRequest } from '../src/services/api/apiClient.js';
import {
  GOAL_CATEGORIES,
  newPlan,
  hydratePlan,
  coachGoalDocs,
  goalDeadlineStatus,
  computeGoalDashboardMetrics,
  todayItems,
  toggleToday
} from '../src/features/goals/goalPlan.js';
import {
  resolveStudentGradeLevel,
  normalizeAcademicSubjects,
  buildGoalRecommendations,
  fetchAdventumAcademicContext
} from '../src/features/goals/adventumGoalIntegration.js';
import {
  buildLocalGoalSuggestions,
  suggestGoalMilestones
} from '../src/features/goals/goalAiService.js';
import {
  buildGoalNotificationsForPlan,
  getStoredGoalNotifications
} from '../src/features/goals/goalNotifications.js';
import {
  listNotifications,
  markNotificationRead,
  markAllRead,
  __resetForTests
} from '../src/features/studentProfile/studentProfileService.js';
import { GoalsPage } from '../src/features/goals/GoalsPage.jsx';
import { DailyGoalsNotice } from '../src/features/goals/DailyGoalsNotice.jsx';
import { NotificationBell } from '../src/features/studentProfile/NotificationBell.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host = null;
let root = null;

function mount(element) {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  act(() => {
    root.render(element);
  });
  return host;
}

const findButton = (scope, textOrRegex) =>
  [...scope.querySelectorAll('button')].find((b) =>
    textOrRegex instanceof RegExp ? textOrRegex.test(b.textContent) : b.textContent.includes(textOrRegex)
  );

const clickButton = (textOrRegex, scope = host) => {
  const btn = findButton(scope, textOrRegex);
  if (!btn) throw new Error(`Button not found: ${textOrRegex}`);
  act(() => {
    btn.click();
  });
};

const setInputValue = (el, val) => {
  act(() => {
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, val);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
};

beforeEach(() => {
  localStorage.clear();
  __resetForTests();
  schoolRequest.mockReset();
  schoolRequest.mockImplementation(async (method, path) => {
    if (path === '/api/learning-context') {
      return {
        role: 'student',
        schools: [{ id: 'sch-1', name: 'WeLearn Bangkok' }],
        classes: [{ id: 'cls-1', name: 'STEM 9A', schoolId: 'sch-1' }],
        providerStatus: { edmentum: 'connected', cambrilearn: 'access_pending' }
      };
    }
    if (path.includes('/academic-progress')) {
      return {
        items: [
          {
            id: 'snap-math',
            provider: 'edmentum',
            course: 'Algebra II',
            curriculum: 'US High School',
            completed: 4,
            total: 10,
            dataAsOf: '2026-11-15',
            sourceMethod: 'coach_recorded'
          },
          {
            id: 'snap-bio',
            provider: 'edmentum',
            course: 'Biology',
            curriculum: 'NGSS',
            completed: 7,
            total: 10,
            dataAsOf: '2026-11-15',
            sourceMethod: 'coach_recorded'
          }
        ]
      };
    }
    if (path.includes('/learner-goals')) {
      return {
        items: [
          {
            id: 'cg-1',
            domain: 'pbl',
            target: 'Test two solar car gear ratios and record speed table',
            dueDate: '2026-11-25',
            state: 'active',
            acknowledged: false
          }
        ]
      };
    }
    return { items: [] };
  });
});

afterEach(() => {
  if (root) {
    act(() => root.unmount());
    root = null;
  }
  if (host) {
    host.remove();
    host = null;
  }
  vi.clearAllMocks();
});

/* =========================================================================
   TASK 2: GOAL CATEGORIES, DEADLINES & METRICS
   ========================================================================= */
describe('Task 2 — Redesigned Goal Categories & Schema', () => {
  it('defines Academic, PBL, Skills, and Personal Development categories with subtypes', () => {
    expect(GOAL_CATEGORIES.map((c) => c.id)).toEqual(['academic', 'pbl', 'skills', 'personal']);
    const academic = GOAL_CATEGORIES.find((c) => c.id === 'academic');
    const pbl = GOAL_CATEGORIES.find((c) => c.id === 'pbl');
    expect(academic.subtypes.map((s) => s.id)).toContain('graduation-target');
    expect(academic.subtypes.map((s) => s.id)).toContain('subject-goal');
    expect(academic.subtypes.map((s) => s.id)).toContain('assignment-exam');
    expect(pbl.subtypes.map((s) => s.id)).toContain('project-milestone');
    expect(pbl.subtypes.map((s) => s.id)).toContain('research-target');
    expect(pbl.subtypes.map((s) => s.id)).toContain('teamwork-objective');
    expect(pbl.subtypes.map((s) => s.id)).toContain('deliverable-deadline');
  });

  it('hydrates and preserves extended Academic & PBL fields and mirrors them to coachGoalDocs', () => {
    const raw = {
      version: 3,
      academicProfile: {
        gradeLevel: 'Year 10 / Grade 9',
        graduationDate: 'June 2029',
        performanceTarget: 'Maintain A- or above in STEM'
      },
      goals: [
        {
          id: 'g_acad',
          category: 'academic',
          goalType: 'subject-goal',
          subject: 'Algebra II',
          gradeLevel: 'Year 10 / Grade 9',
          graduationTarget: 'STEM Honours 2029',
          explore: 'Complete Unit 5 Quadratic Functions',
          targetDate: '2026-11-25',
          measurableOutcome: 'Score 90%+ on Unit 5 mastery test',
          steps: [
            { id: 's1', text: 'Complete quadratic formula practice', done: true, frequency: 'daily' },
            { id: 's2', text: 'Finish unit review quiz', done: false, frequency: 'weekly' }
          ],
          done: false,
          createdAt: 100
        },
        {
          id: 'g_pbl',
          category: 'pbl',
          goalType: 'deliverable-deadline',
          projectId: 'sustainable-futures',
          projectTitle: 'Sustainable Futures',
          explore: 'Build solar microgrid prototype',
          targetDate: '2026-11-10',
          measurableOutcome: 'Working prototype tested under load',
          steps: [{ id: 's3', text: 'Wire solar panel to sensor', done: false, frequency: 'daily' }],
          done: false,
          createdAt: 200
        }
      ]
    };

    const plan = hydratePlan(raw);
    expect(plan.academicProfile.gradeLevel).toBe('Year 10 / Grade 9');
    expect(plan.goals).toHaveLength(2);
    expect(plan.goals[0]).toMatchObject({
      category: 'academic',
      subject: 'Algebra II',
      targetDate: '2026-11-25',
      measurableOutcome: 'Score 90%+ on Unit 5 mastery test'
    });
    expect(plan.goals[1]).toMatchObject({
      category: 'pbl',
      projectId: 'sustainable-futures',
      projectTitle: 'Sustainable Futures'
    });

    const coachDocs = coachGoalDocs(plan, 500);
    expect(coachDocs[0]).toMatchObject({
      goalId: 'plan_g_acad',
      category: 'academic',
      subject: 'Algebra II',
      targetDate: '2026-11-25',
      measurableOutcome: 'Score 90%+ on Unit 5 mastery test',
      progress: 0.5
    });

    const metrics = computeGoalDashboardMetrics(plan, '2026-11-18');
    expect(metrics.academicCount).toBe(1);
    expect(metrics.pblCount).toBe(1);
    expect(metrics.overdueGoals).toHaveLength(1);
    expect(metrics.overdueGoals[0].id).toBe('g_pbl');
    expect(goalDeadlineStatus(plan.goals[1], '2026-11-18').isOverdue).toBe(true);
    expect(goalDeadlineStatus(plan.goals[0], '2026-11-23').isApproaching).toBe(true);
  });
});

/* =========================================================================
   TASK 3: ADVENTUM INTEGRATION & RECOMMENDATIONS
   ========================================================================= */
describe('Task 3 — Adventum Integration & Academic Recommendations', () => {
  it('retrieves student grade, connected Adventum subjects, unit progress, and coach goals', async () => {
    const ctx = await fetchAdventumAcademicContext('learner-qa-1', {
      yearLevel: '10',
      cohortId: 'cohort-whs'
    });

    expect(ctx.loaded).toBe(true);
    expect(ctx.gradeLevel).toBe('Year 10');
    expect(ctx.edmentumStatus.state).toBe('connected');
    expect(ctx.subjects.map((s) => s.subject)).toEqual(['Algebra II', 'Biology']);
    expect(ctx.subjects[0].progressPct).toBe(40);
    expect(ctx.subjects[1].progressPct).toBe(70);

    const recs = buildGoalRecommendations({
      gradeLevel: ctx.gradeLevel,
      subjects: ctx.subjects,
      coachGoals: ctx.coachGoals,
      pblProjects: ctx.pblProjects,
      existingGoals: []
    });

    expect(recs.length).toBeGreaterThanOrEqual(3);
    expect(recs.some((r) => r.category === 'academic' && r.subject === 'Algebra II')).toBe(true);
    expect(recs.some((r) => r.category === 'pbl' && r.explore.includes('solar car gear ratios'))).toBe(true);
  });

  it('never invents fake data when Adventum is not connected and provides manual subject options', async () => {
    schoolRequest.mockResolvedValueOnce({
      role: 'student',
      schools: [],
      classes: [],
      providerStatus: { edmentum: 'not_connected' }
    });
    const ctx = await fetchAdventumAcademicContext('learner-offline', {});
    expect(ctx.edmentumStatus.state).toBe('not_connected');
    expect(ctx.subjects).toEqual([]);
    expect(ctx.subjectOptions).toContain('Mathematics');
    expect(ctx.subjectOptions).toContain('Biology');
    expect(resolveStudentGradeLevel({ cohort: 'lower-secondary' })).toContain('Lower Secondary');
  });
});

/* =========================================================================
   TASK 4: INTELLIGENT GOAL CREATION & GEMINI AI SUGGESTIONS
   ========================================================================= */
describe('Task 4 — Intelligent Goal Creation & Gemini AI Suggestions', () => {
  it('parses Gemini AI suggestions from /api/goals/suggest and falls back gracefully when offline', async () => {
    const fakeFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        measurableOutcome: 'Complete all 5 Algebra II quadratics checkpoints with 90%+ accuracy.',
        steps: [
          { text: 'Solve 5 quadratic factoring problems', frequency: 'daily' },
          { text: 'Complete weekly unit quiz in Adventum', frequency: 'weekly' }
        ],
        aiGenerated: true
      })
    });

    const aiRes = await suggestGoalMilestones(
      { category: 'academic', explore: 'Master quadratic equations', subject: 'Algebra II' },
      { fetch: fakeFetch, token: 'test-token' }
    );
    expect(aiRes.aiGenerated).toBe(true);
    expect(aiRes.measurableOutcome).toContain('90%+ accuracy');
    expect(aiRes.steps).toHaveLength(2);
    expect(aiRes.steps[0].frequency).toBe('daily');

    // Offline fallback test
    const failFetch = vi.fn().mockRejectedValueOnce(new Error('network down'));
    const fallbackRes = await suggestGoalMilestones(
      { category: 'pbl', explore: 'Build wind turbine blades', projectTitle: 'Sustainable Futures' },
      { fetch: failFetch }
    );
    expect(fallbackRes.aiGenerated).toBe(false);
    expect(fallbackRes.steps.length).toBeGreaterThanOrEqual(3);
    expect(fallbackRes.measurableOutcome).toContain('Sustainable Futures');
  });
});

/* =========================================================================
   TASK 5: DAILY GOAL NOTIFICATIONS & EXISTING ENGINE REGRESSION
   ========================================================================= */
describe('Task 5 — Daily Goal Notifications & Deduplication', () => {
  const samplePlan = hydratePlan({
    version: 3,
    focus: { skill: 'starting', habit: 'Set a 5-minute timer', daysPerWeek: 5 },
    goals: [
      {
        id: 'acad1',
        category: 'academic',
        subject: 'Biology',
        explore: 'Finish cell division module',
        targetDate: '2026-11-19', // Approaching (tomorrow relative to 2026-11-18)
        done: false,
        steps: [
          { id: 's_done', text: 'Read intro chapter', done: true },
          { id: 's_todo', text: 'Draw mitosis stages diagram', done: false }
        ]
      },
      {
        id: 'pbl1',
        category: 'pbl',
        projectTitle: 'Project Arachne',
        explore: 'Test quadruped servo leg',
        targetDate: '2026-11-10', // Overdue relative to 2026-11-18
        done: false,
        steps: [{ id: 's_pbl', text: 'Calibrate servo angles in code', done: false }]
      },
      {
        id: 'done_goal',
        category: 'academic',
        explore: 'Completed history essay',
        targetDate: '2026-11-01',
        done: true,
        steps: [{ id: 's_h', text: 'Submit essay', done: true }]
      }
    ]
  });

  it('generates distinguishable Academic & PBL daily notifications, deadline alerts, and overdue warnings while excluding completed tasks', () => {
    const notifs = buildGoalNotificationsForPlan(samplePlan, {
      uid: 'learner-qa-1',
      today: '2026-11-18',
      nowMs: 1700000000000
    });

    // Should NOT include completed goal or completed step ('Read intro chapter')
    expect(notifs.some((n) => n.title.includes('Completed history essay'))).toBe(false);
    expect(notifs.some((n) => n.title.includes('Read intro chapter'))).toBe(false);

    // Should include Academic approaching deadline + Academic daily step
    expect(notifs.some((n) => n.type === 'goal_academic_deadline' && n.category === 'academic')).toBe(true);
    expect(notifs.some((n) => n.type === 'goal_academic_daily' && n.title.includes('Draw mitosis stages diagram'))).toBe(true);

    // Should include PBL overdue alert + PBL daily action
    expect(notifs.some((n) => n.type === 'goal_pbl_overdue' && n.category === 'pbl')).toBe(true);
    expect(notifs.some((n) => n.type === 'goal_pbl_daily' && n.title.includes('Calibrate servo angles in code'))).toBe(true);

    // Should include Daily Habit
    expect(notifs.some((n) => n.type === 'goal_habit_daily')).toBe(true);
  });

  it('prevents duplicate notifications and integrates with existing listNotifications / markNotificationRead / NotificationBell', async () => {
    localStorage.setItem('goalPlan_learner-qa-1', JSON.stringify(samplePlan));

    const firstCall = await listNotifications('learner-qa-1');
    const secondCall = await listNotifications('learner-qa-1');
    expect(firstCall.items.length).toBeGreaterThan(0);
    expect(firstCall.items.map((i) => i.id)).toEqual(secondCall.items.map((i) => i.id));
    expect(new Set(firstCall.items.map((i) => i.id)).size).toBe(firstCall.items.length);

    // Mark one notification read and verify unreadCount drops
    const firstId = firstCall.items[0].id;
    await markNotificationRead('learner-qa-1', firstId);
    const afterOne = await listNotifications('learner-qa-1');
    expect(afterOne.unreadCount).toBe(firstCall.unreadCount - 1);

    // Mark all read
    await markAllRead('learner-qa-1');
    const afterAll = await listNotifications('learner-qa-1');
    expect(afterAll.unreadCount).toBe(0);

    // Render NotificationBell and verify it works with the existing component
    mount(<NotificationBell uid="learner-qa-1" />);
    expect(host.querySelector('.sp-bell-btn')).toBeTruthy();
  });

  it('respects notification preferences when reminders or specific categories are toggled off', () => {
    const noPblPlan = hydratePlan({
      ...samplePlan,
      notificationPrefs: { dailyReminder: true, academicAlerts: true, pblAlerts: false, deadlineAlerts: true }
    });
    const listNoPbl = buildGoalNotificationsForPlan(noPblPlan, { uid: 'learner-qa-1', today: '2026-11-18' });
    expect(listNoPbl.some((n) => n.category === 'pbl')).toBe(false);
    expect(listNoPbl.some((n) => n.category === 'academic')).toBe(true);

    const mutedPlan = hydratePlan({
      ...samplePlan,
      notificationPrefs: { dailyReminder: false, academicAlerts: true, pblAlerts: true, deadlineAlerts: true }
    });
    expect(buildGoalNotificationsForPlan(mutedPlan, { uid: 'learner-qa-1', today: '2026-11-18' })).toEqual([]);
  });
});

/* =========================================================================
   TASK 6, 7 & 8: FULL USER JOURNEY ON REDESIGNED GOAL DASHBOARD
   ========================================================================= */
describe('Task 6, 7 & 8 — Complete User Journey on Redesigned GoalsPage', () => {
  it('creates Academic and PBL goals, edits goals, completes milestones, filters views, and persists to localStorage', async () => {
    await act(async () => {
      mount(<GoalsPage uid="learner-qa-1" displayName="Alex Rivera" profile={{ yearLevel: '10' }} />);
    });
    // Wait for async Adventum & StudentProfile promises to resolve
    await act(async () => {
      await new Promise((r) => setTimeout(r, 180));
    });

    // Verify Overview strip and Adventum Academic Banner render
    expect(host.textContent).toContain('Alex’s goals');
    expect(host.textContent).toContain('Academic Profile & Adventum Sync');
    expect(host.textContent).toContain('Algebra II');

    // 1. Use a Recommended Academic Goal from Adventum tray
    clickButton(/Use this goal/);
    expect(host.querySelector('#gl-flow-explore').value).toContain('Algebra II');

    // Advance through GoalFlow -> Show -> Help -> First Step -> Save
    clickButton(/^(Next|Skip)/);
    clickButton('A slide deck');
    clickButton(/^(Next|Skip)/);
    clickButton(/^(Next|Skip)/);
    // In step 4, multiSteps from recommendation are already populated; save the goal
    act(() => {
      host.querySelector('form.gl-flow').requestSubmit();
    });

    // Verify Academic Goal Card is rendered with subject badge and outcome
    expect(host.textContent).toContain('Algebra II');
    expect(host.textContent).toContain('steps done');

    // 2. Switch to PBL Goals tab and create a PBL Goal
    clickButton(/PBL Goals/);
    clickButton(/Set a PBL goal/);
    expect(host.querySelector('.gc-shell')).toBeTruthy();
    clickButton(/Use the detailed form/);
    setInputValue(host.querySelector('#gl-flow-explore'), 'Design solar telemetry dashboard');
    setInputValue(host.querySelector('#gl-flow-outcome'), 'Live telemetry chart tested with 3 solar car runs');
    clickButton(/^(Next|Skip)/);
    clickButton('Code or an app');
    clickButton(/^(Next|Skip)/);
    clickButton(/^(Next|Skip)/);

    // Click AI suggest steps button
    await act(async () => {
      findButton(host, /Suggest steps with Gemini AI/).click();
    });
    expect(host.querySelectorAll('.gl-multi-step-row').length).toBeGreaterThan(0);

    // Save the PBL Goal
    act(() => {
      host.querySelector('form.gl-flow').requestSubmit();
    });

    expect(host.textContent).toContain('Design solar telemetry dashboard');
    expect(host.textContent).toContain('Live telemetry chart tested with 3 solar car runs');

    // 3. Test Milestone Step Completion & Progress Tracking
    const firstStepBtn = host.querySelector('.gl-step-check');
    expect(firstStepBtn.getAttribute('aria-pressed')).toBe('false');
    act(() => {
      firstStepBtn.click();
    });
    expect(host.querySelector('.gl-step-check').getAttribute('aria-pressed')).toBe('true');

    // 4. Test Editing an Existing Goal
    clickButton(/Edit/);
    const exploreInput = host.querySelector('#gl-flow-explore');
    expect(exploreInput.value).toBe('Design solar telemetry dashboard');
    setInputValue(exploreInput, 'Design solar telemetry v2 dashboard');
    clickButton(/^(Next|Skip)/);
    clickButton(/^(Next|Skip)/);
    clickButton(/^(Next|Skip)/);
    act(() => {
      host.querySelector('form.gl-flow').requestSubmit();
    });
    expect(host.textContent).toContain('Design solar telemetry v2 dashboard');

    // 5. Verify persistence in localStorage
    const savedPlan = hydratePlan(JSON.parse(localStorage.getItem('goalPlan_learner-qa-1')));
    expect(savedPlan.goals).toHaveLength(2);
    expect(savedPlan.goals.map((g) => g.category)).toEqual(['academic', 'pbl']);
    expect(savedPlan.goals[1].explore).toBe('Design solar telemetry v2 dashboard');

    // 6. Test Deleting a Goal
    clickButton(/Remove/);
    clickButton('Remove', host.querySelector('.gl-confirm-strip'));
    const afterDelete = hydratePlan(JSON.parse(localStorage.getItem('goalPlan_learner-qa-1')));
    expect(afterDelete.goals).toHaveLength(1);
  });
});
