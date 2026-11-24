// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  newPlan, hydratePlan, touch, todayItems, toggleToday, coachGoalDocs,
  goalDeadlineStatus, computeGoalDashboardMetrics, LIMITS, dayKey
} from '../src/features/goals/goalPlan.js';
import {
  resolveStudentGradeLevel, normalizeAcademicSubjects, buildGoalRecommendations,
  fetchAdventumAcademicContext, MANUAL_SUBJECT_OPTIONS
} from '../src/features/goals/adventumGoalIntegration.js';
import {
  buildGoalNotificationsForPlan, saveGoalNotifRead, isReminderSnoozed
} from '../src/features/goals/goalNotifications.js';
import { suggestGoalMilestones, buildLocalGoalSuggestions } from '../src/features/goals/goalAiService.js';
import { GoalsPage } from '../src/features/goals/GoalsPage.jsx';
import { listNotifications, markNotificationRead, __resetForTests } from '../src/features/studentProfile/studentProfileService.js';

describe('Goal Plan v3 categories, deadlines, and metrics', () => {
  it('preserves version 3 and supports up to LIMITS.maxGoals (12) categorized goals', () => {
    const emptyV3 = hydratePlan({ version: 3, goals: [] });
    expect(emptyV3.version).toBe(3);

    const manyGoals = Array.from({ length: 8 }, (_, i) => ({
      id: `g${i}`,
      category: i % 2 === 0 ? 'academic' : 'pbl',
      goalType: i % 2 === 0 ? 'subject-goal' : 'project-milestone',
      subject: i % 2 === 0 ? 'Mathematics' : undefined,
      projectTitle: i % 2 === 1 ? 'Solar Car Challenge' : undefined,
      explore: `Goal ${i + 1}`,
      steps: [{ id: `s${i}`, text: `Step ${i + 1}`, done: false, frequency: 'daily' }]
    }));
    const hydrated = hydratePlan({ version: 3, goals: manyGoals });
    expect(hydrated.version).toBe(3);
    expect(hydrated.goals).toHaveLength(8);
    expect(hydrated.goals.length).toBeLessThanOrEqual(LIMITS.maxGoals);
  });

  it('computes deadline status accurately for overdue, today, approaching, and completed goals', () => {
    const today = '2026-11-18';
    expect(goalDeadlineStatus({ targetDate: '2026-11-16', done: false }, today)).toMatchObject({
      hasDeadline: true, isOverdue: true, isApproaching: false, daysLeft: -2
    });
    expect(goalDeadlineStatus({ targetDate: '2026-11-18', done: false }, today)).toMatchObject({
      hasDeadline: true, isOverdue: false, isDueToday: true, isApproaching: true, daysLeft: 0
    });
    expect(goalDeadlineStatus({ targetDate: '2026-11-20', done: false }, today)).toMatchObject({
      hasDeadline: true, isOverdue: false, isApproaching: true, daysLeft: 2
    });
    expect(goalDeadlineStatus({ targetDate: '2026-11-10', done: true }, today)).toMatchObject({
      hasDeadline: true, isOverdue: false, isApproaching: false
    });
  });

  it('computes dashboard metrics and includes all active categorized items in todayItems', () => {
    const plan = hydratePlan({
      version: 3,
      focus: { skill: 'starting', habit: 'Start with a 5-min timer', daysPerWeek: 5 },
      recharge: ['music'],
      goals: [
        {
          id: 'g1', category: 'academic', subject: 'Mathematics', explore: 'Master algebra',
          targetDate: '2026-11-17', done: false,
          steps: [{ id: 's1', text: 'Do 5 algebra problems', done: true }, { id: 's2', text: 'Review quiz', done: false }]
        },
        {
          id: 'g2', category: 'pbl', projectTitle: 'Clean Water Sensor', explore: 'Test sensor',
          targetDate: '2026-11-20', done: false,
          steps: [{ id: 's3', text: 'Calibrate probe', done: false }]
        },
        {
          id: 'g3', category: 'skills', explore: 'Python', done: true,
          steps: [{ id: 's4', text: 'Write script', done: true }]
        },
        {
          id: 'g4', category: 'personal', explore: 'Organise notes', done: false,
          steps: [{ id: 's5', text: 'File Monday notes', done: false }]
        },
        {
          id: 'g5', category: 'academic', subject: 'Biology', explore: 'Cell respiration', done: false,
          steps: [{ id: 's6', text: 'Draw cycle', done: false }]
        }
      ]
    });

    const metrics = computeGoalDashboardMetrics(plan, '2026-11-18');
    expect(metrics.totalGoals).toBe(5);
    expect(metrics.activeCount).toBe(4);
    expect(metrics.completedCount).toBe(1);
    expect(metrics.academicCount).toBe(2);
    expect(metrics.pblCount).toBe(1);
    expect(metrics.overdueGoals.map((g) => g.id)).toEqual(['g1']);
    expect(metrics.approachingGoals.map((g) => g.id)).toEqual(['g2']);

    const today = todayItems(plan, '2026-11-18');
    // habit + 4 open goals + recharge = 6 items (not truncated at 5 for v3)
    expect(today).toHaveLength(6);
    expect(today.some((i) => i.id === 'recharge')).toBe(true);

    const docs = coachGoalDocs(plan, 100);
    expect(docs[0]).toMatchObject({ category: 'academic', subject: 'Mathematics', targetDate: '2026-11-17' });
    expect(docs[1]).toMatchObject({ category: 'pbl', projectTitle: 'Clean Water Sensor' });
  });
});

describe('Adventum / Edmentum integration', () => {
  it('derives grade level from profile fields without inventing data', () => {
    expect(resolveStudentGradeLevel({ yearLevel: '9' })).toBe('Year 9');
    expect(resolveStudentGradeLevel({ gradeLevel: '10' })).toBe('Grade 10');
    expect(resolveStudentGradeLevel({ cohort: 'whs-2026' })).toContain('Higher Secondary');
    expect(resolveStudentGradeLevel({})).toBeNull();
  });

  it('normalizes connected subjects and builds deduplicated recommendations', async () => {
    const subjects = normalizeAcademicSubjects({
      academicSnapshots: [
        { id: 'snap1', course: 'Algebra II', provider: 'edmentum', completed: 6, total: 10, sourceMethod: 'edmentum_api' }
      ],
      profileGrades: [
        { subject: 'Algebra II', grade: 'B+', term: 'Term 2' },
        { subject: 'Biology', grade: 'A-', term: 'Term 2' }
      ]
    });
    expect(subjects).toHaveLength(2);
    expect(subjects[0]).toMatchObject({ subject: 'Algebra II', provider: 'Adventum / Edmentum', progressPct: 60, grade: 'B+' });

    const recs = buildGoalRecommendations({
      gradeLevel: 'Year 10',
      subjects,
      coachGoals: [{ id: 'cg1', target: 'Complete quadratic lab', dueDate: '2026-11-25', domain: 'academic' }],
      pblProjects: [{ id: 'p1', title: 'Solar Car', milestones: ['Build chassis'] }],
      existingGoals: []
    });
    expect(recs.some((r) => r.category === 'academic' && r.subject === 'Algebra II')).toBe(true);
    expect(recs.some((r) => r.category === 'pbl' && r.projectId === 'p1')).toBe(true);
  });

  it('fetches academic context and falls back cleanly to manual subjects when not connected', async () => {
    const mockReq = vi.fn(async (_method, path) => {
      if (path === '/api/learning-context') {
        return { providerStatus: { edmentum: 'not_connected', cambrilearn: 'not_connected' }, schools: [], classes: [] };
      }
      return {};
    });
    const ctx = await fetchAdventumAcademicContext('u1', { yearLevel: '8' }, {
      schoolRequest: mockReq,
      getStudentProfile: async () => null,
      getDoc: async () => ({ exists: false })
    });
    expect(ctx.loaded).toBe(true);
    expect(ctx.isAdventumConnected).toBe(false);
    expect(ctx.gradeLevel).toBe('Year 8');
    expect(ctx.subjectOptions).toEqual(MANUAL_SUBJECT_OPTIONS);
  });
});

describe('Gemini AI goal suggestion service', () => {
  it('returns parsed AI suggestions when backend responds and falls back locally on failure', async () => {
    const okFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        measurableOutcome: 'Score 90% on Algebra unit test.',
        steps: [{ text: 'Practise 5 equations daily', frequency: 'daily' }],
        aiGenerated: true
      })
    }));
    const res = await suggestGoalMilestones({ category: 'academic', explore: 'Master Algebra' }, { fetch: okFetch, token: 'tok' });
    expect(res.aiGenerated).toBe(true);
    expect(res.steps[0].text).toBe('Practise 5 equations daily');

    const failFetch = vi.fn(async () => { throw new Error('offline'); });
    const fallback = await suggestGoalMilestones({ category: 'pbl', explore: 'Build sensor' }, { fetch: failFetch });
    expect(fallback.aiGenerated).toBe(false);
    expect(fallback.steps.length).toBeGreaterThan(0);
    expect(buildLocalGoalSuggestions({ category: 'skills', explore: 'CAD' }).steps.length).toBeGreaterThan(0);
  });
});

describe('Daily Goal Notifications & NotificationBell bridge', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetForTests();
  });

  it('generates distinct Academic & PBL notifications, handles overdue/approaching, excludes completed, and prevents duplicates', async () => {
    const today = dayKey();
    const yesterday = dayKey(new Date(Date.now() - 86400000));
    const inTwoDays = dayKey(new Date(Date.now() + 2 * 86400000));

    const plan = hydratePlan({
      version: 3,
      focus: { skill: 'planning', habit: 'Pick top 3 tasks', daysPerWeek: 5 },
      goals: [
        {
          id: 'acad1', category: 'academic', subject: 'Physics', explore: 'Finish kinematics',
          targetDate: yesterday, done: false,
          steps: [{ id: 's1', text: 'Solve 3 velocity problems', done: false }]
        },
        {
          id: 'pbl1', category: 'pbl', projectTitle: 'Mars Rover', explore: 'Wheel prototype',
          targetDate: inTwoDays, done: false,
          steps: [{ id: 's2', text: 'Print wheel hub', done: false }]
        },
        {
          id: 'done1', category: 'academic', explore: 'Completed goal', done: true,
          steps: [{ id: 's3', text: 'Done step', done: true }]
        }
      ]
    });

    const notifs = buildGoalNotificationsForPlan(plan, { uid: 'stu1', today, snoozed: false });
    expect(notifs.some((n) => n.type === 'goal_academic_overdue')).toBe(true);
    expect(notifs.some((n) => n.type === 'goal_academic_daily')).toBe(true);
    expect(notifs.some((n) => n.type === 'goal_pbl_deadline')).toBe(true);
    expect(notifs.some((n) => n.type === 'goal_pbl_daily')).toBe(true);
    expect(notifs.some((n) => n.title.includes('Completed goal'))).toBe(false);

    // Deterministic IDs prevent duplicates
    const ids = notifs.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Respect preferences
    const noPbl = buildGoalNotificationsForPlan(
      { ...plan, notificationPrefs: { dailyReminder: true, academicAlerts: true, pblAlerts: false, deadlineAlerts: true } },
      { uid: 'stu1', today, snoozed: false }
    );
    expect(noPbl.some((n) => n.category === 'pbl')).toBe(false);
    expect(noPbl.some((n) => n.category === 'academic')).toBe(true);

    // Respect snooze
    expect(buildGoalNotificationsForPlan(plan, { uid: 'stu1', today, snoozed: true })).toEqual([]);
    localStorage.setItem('reminderSnoozedUntil_stu1', JSON.stringify(new Date(Date.now() + 3600000).toISOString()));
    expect(isReminderSnoozed('stu1')).toBe(true);

    // Bridge with studentProfileService.listNotifications + markNotificationRead
    localStorage.removeItem('reminderSnoozedUntil_stu1');
    localStorage.setItem('goalPlan_stu1', JSON.stringify(plan));
    const list1 = await listNotifications('stu1');
    expect(list1.unreadCount).toBe(notifs.length);
    await markNotificationRead('stu1', list1.items[0].id);
    const list2 = await listNotifications('stu1');
    expect(list2.unreadCount).toBe(notifs.length - 1);
  });
});

describe('GoalsPage & GoalFlow end-to-end UI journey (custom subject & lifecycle)', () => {
  let host;
  let root;

  beforeEach(() => {
    localStorage.clear();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  it('creates an Academic goal with custom subject, preserves it on edit, toggles a milestone, and deletes it', async () => {
    await act(async () => {
      root.render(<GoalsPage uid="learner-ui-1" displayName="Alex Chen" profile={{ yearLevel: '10' }} />);
    });

    // An empty plan opens the AI goal coach; this journey uses the detailed form.
    expect(host.querySelector('.gc-shell')).toBeTruthy();
    const useForm = [...host.querySelectorAll('button')].find((b) => b.textContent.includes('Use the detailed form'));
    await act(async () => { useForm.click(); });

    const subjectSelect = host.querySelector('#gl-flow-subject');
    expect(subjectSelect).toBeTruthy();
    await act(async () => {
      subjectSelect.value = '__custom__';
      subjectSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const customInput = host.querySelector('input[aria-label="Custom subject"]');
    expect(customInput).toBeTruthy();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(customInput, 'AP Physics C');
      customInput.dispatchEvent(new Event('input', { bubbles: true }));
      customInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const exploreInput = host.querySelector('#gl-flow-explore');
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(exploreInput, 'Master calculus derivatives');
      exploreInput.dispatchEvent(new Event('input', { bubbles: true }));
      exploreInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const submitBtn = () => [...host.querySelectorAll('button')].find((b) => /Next|Skip|Save my goal/i.test(b.textContent));
    await act(async () => { submitBtn().click(); }); // -> Show how
    await act(async () => { submitBtn().click(); }); // -> Help
    await act(async () => { submitBtn().click(); }); // -> First step

    const radio = host.querySelector('input[type="radio"]');
    await act(async () => { radio.click(); });
    await act(async () => { submitBtn().click(); }); // -> Save my goal

    expect(host.textContent).toContain('I will explore Master calculus derivatives.');
    expect(host.textContent).toContain('AP Physics C');

    // Click Edit and verify custom subject AP Physics C is preserved in the select
    const editBtn = [...host.querySelectorAll('button')].find((b) => b.textContent.includes('Edit') && b.getAttribute('aria-label')?.includes('Edit goal'));
    await act(async () => { editBtn.click(); });
    const editSelect = host.querySelector('#gl-flow-subject');
    expect(editSelect.value).toBe('AP Physics C');

    // Cancel edit
    const cancelBtn = [...host.querySelectorAll('button')].find((b) => b.textContent.includes('Not now'));
    await act(async () => { cancelBtn.click(); });

    // Toggle milestone step
    const stepBtn = host.querySelector('.gl-step-check');
    await act(async () => { stepBtn.click(); });
    expect(host.textContent).toContain('1 of 1');

    // Remove goal
    const removeBtn = [...host.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Remove goal');
    await act(async () => { removeBtn.click(); });
    const confirmRemove = [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Remove');
    await act(async () => { confirmRemove.click(); });

    expect(host.textContent).not.toContain('I will explore Master calculus derivatives.');
    await act(async () => { root.unmount(); });
    host.remove();
  });
});
