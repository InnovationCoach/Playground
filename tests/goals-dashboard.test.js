// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/firebase.js', () => ({ db: null, doc: vi.fn(), setDoc: vi.fn(), getDoc: vi.fn() }));
import { initializeGoalSettingForUser } from '../src/integrations/goalSettingIntegration.js';
import { createGoalsDashboard } from '../src/components/Goals/GoalsDashboard.js';

const uid = 'learner-1';
const goals = () => ({ learningPath: 'climate', topic: 'Data Analysis & Visualization', durationDays: 14, createdAt: new Date().toISOString(), goals: ['Build a prototype', 'Get feedback', 'Refine'], completedGoals: [0, 1] });
const $ = (sel) => document.querySelector(sel);

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<div id="goals-dashboard-container"></div>';
  window.openGoalSettingWizard = vi.fn();
});
afterEach(() => { delete window.openGoalSettingWizard; document.getElementById('gl-toast')?.remove(); });

describe('Goals strip on the student home', () => {
  it('renders a collapsed strip with progress, the next goal and the deadline', () => {
    localStorage.setItem(`userGoals_${uid}`, JSON.stringify(goals()));
    createGoalsDashboard('goals-dashboard-container', uid);
    expect($('.gl-strip')).toBeTruthy();
    expect($('.gl-ring').getAttribute('aria-label')).toBe('2 of 3 goals done');
    expect($('.gl-meta').textContent).toContain('Next: Refine');
    expect($('.gl-meta').textContent).toContain('14 days left');
    expect($('#gl-panel').hidden).toBe(true);
    expect($('#gl-toggle').getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the checklist, and ticking the last goal earns a badge and offers a new cycle', () => {
    localStorage.setItem(`userGoals_${uid}`, JSON.stringify(goals()));
    createGoalsDashboard('goals-dashboard-container', uid);
    $('#gl-toggle').click();
    expect($('#gl-panel').hidden).toBe(false);
    expect(document.querySelectorAll('.gl-check')).toHaveLength(3);
    const last = $('.gl-check[data-index="2"]');
    last.checked = true;
    last.dispatchEvent(new Event('change'));
    expect($('.gl-strip').classList.contains('gl-complete')).toBe(true);
    expect($('.gl-kicker').textContent).toContain('All goals complete');
    expect($('#gl-new-cycle')).toBeTruthy();
    const badges = JSON.parse(localStorage.getItem(`goalBadges_${uid}`));
    expect(badges).toHaveLength(1);
    expect(badges[0].title).toBe('Data Analysis & Visualization');
    expect(document.querySelectorAll('.gl-badge')).toHaveLength(1);
    expect($('#gl-toast').textContent).toContain('Badge earned');
    // Starting a new cycle clears the goals, keeps the badge and opens the wizard.
    $('#gl-new-cycle').click();
    expect(localStorage.getItem(`userGoals_${uid}`)).toBeNull();
    expect($('.gl-empty')).toBeTruthy();
    expect(document.querySelectorAll('.gl-badge')).toHaveLength(1);
    expect(window.openGoalSettingWizard).toHaveBeenCalled();
  });

  it('does not award a second badge for the same goal cycle', () => {
    const data = goals();
    localStorage.setItem(`userGoals_${uid}`, JSON.stringify(data));
    createGoalsDashboard('goals-dashboard-container', uid);
    $('#gl-toggle').click();
    const tick = (i, on) => { const b = $(`.gl-check[data-index="${i}"]`); b.checked = on; b.dispatchEvent(new Event('change')); };
    tick(2, true);
    tick(2, false);
    tick(2, true);
    expect(JSON.parse(localStorage.getItem(`goalBadges_${uid}`))).toHaveLength(1);
  });

  it('shows the invitation when no goals are set and re-renders when the wizard finishes', () => {
    createGoalsDashboard('goals-dashboard-container', uid);
    expect($('.gl-empty')).toBeTruthy();
    $('#gl-set').click();
    expect(window.openGoalSettingWizard).toHaveBeenCalled();
    window.dispatchEvent(new CustomEvent('goalsSet', { detail: goals() }));
    expect($('.gl-strip').textContent).toContain('Data Analysis & Visualization');
    expect($('#gl-panel').hidden).toBe(false);
  });
});

describe('Private goal integration on portfolio screens', () => {
  it('does not append stored private goals outside the dashboard host', async () => {
    document.body.innerHTML = '<main aria-label="Shareable portfolio"></main>';
    localStorage.setItem(`userGoals_${uid}`, JSON.stringify(goals()));
    await initializeGoalSettingForUser(uid);
    expect(document.getElementById('goals-dashboard-container')).toBeNull();
    expect(document.body.textContent).not.toContain('Build a prototype');
    expect(document.getElementById('goal-setting-modal')).toBeNull();
  });
  it('does not open a private goal setup modal on a portfolio with no goals', async () => {
    document.body.innerHTML = '<main aria-label="Shareable portfolio"></main>';
    await initializeGoalSettingForUser(uid);
    expect(document.getElementById('goal-setting-modal')).toBeNull();
  });
});
