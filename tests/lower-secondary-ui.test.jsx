// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/app/i18n/LocaleProvider.jsx', () => ({ useLocale: () => ({ locale: 'en', t: (key) => key }) }));
vi.mock('../src/services/api/apiClient.js', () => ({ schoolRequest: vi.fn() }));
vi.mock('../src/firebase.js', () => ({
  auth: { currentUser: { uid: 'learner-1' } }, db: {}, storage: {},
  doc: vi.fn((...parts) => ({ path: parts.slice(1).join('/') })), collection: vi.fn(), query: vi.fn(), where: vi.fn(),
  setDoc: vi.fn(async () => {}), deleteDoc: vi.fn(async () => {}), getDoc: vi.fn(async () => ({ exists: false, data: () => ({}) })), getDocs: vi.fn(async () => ({ forEach() {} }))
}));
vi.mock('../src/features/dashboard/dashboardCourses.js', () => ({ loadDashboardCourses: vi.fn() }));
vi.mock('../src/services/pblService.js', () => ({ addToMyCourse: vi.fn(async () => ({ success: true })), getProgram: vi.fn() }));
vi.mock('../src/features/primary/JuniorExplorers.jsx', () => ({ JuniorExplorers: () => <div data-testid="junior">Junior Explorers content</div> }));
vi.mock('../src/features/school/SchoolLearningPanel.jsx', () => ({ SchoolLearningPanel: () => <div data-testid="school-panel" /> }));
vi.mock('../src/features/universe/explore/MyUniverseExplorer.jsx', () => ({ MyUniverseExplorer: (props) => <div data-testid="explorer" data-preview={String(props.preview)} data-arrival={props.initialArrival?.planetId || ''} /> }));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { loadDashboardCourses } from '../src/features/dashboard/dashboardCourses.js';
import { setDoc } from '../src/firebase.js';
import { addToMyCourse } from '../src/services/pblService.js';
import { LowerSecondaryShell } from '../src/features/lowerSecondary/LowerSecondaryShell.jsx';
import { badgeProgress, emptyQuest, levelFor, nextBadge } from '../src/features/quest/questModel.js';

let host, root;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };

const COURSE = { program: { id: 'course-a', title: 'River study', phases: [{ id: 'p1', title: 'Explore', sessions: [{ sessionNumber: 1 }] }] },
  summary: { done: 2, total: 6, pct: 33, next: { title: 'Plan your samples', phaseId: 'p1', evidenceToCollect: 'A labelled map' }, byPhase: { p1: { complete: false } } } };
const questView = () => {
  const quest = { ...emptyQuest(), xp: 262, badges: [{ id: 'first-evidence', earnedAt: '2026-10-01T00:00:00Z' }] };
  return { level: levelFor(262), badges: badgeProgress(quest), nextBadge: nextBadge(quest), todaysQuest: { phaseTitle: 'Define', task: 'Name who is affected', done: 1, total: 4 }, revision: 1 };
};

function api({ questMode = true, quest = questView, items = [] } = {}) {
  schoolRequest.mockImplementation(async (method, path, options) => {
    if (path === '/api/learning-context') return { schools: [{ id: 's', features: { questMode } }] };
    if (path === '/api/quest/me') { if (quest instanceof Error) throw quest; return quest(); }
    if (path === '/api/learner-space') return { dashboard: {}, portfolio: { introduction: '' }, items };
    if (path === '/api/learner-space/items') return { dashboard: {}, portfolio: {}, items: [{ ...options.body, id: 'new' }, ...items] };
    throw new Error(`Unexpected ${method} ${path}`);
  });
}
const flush = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const render = async (props = {}) => {
  await act(async () => { root.render(<LowerSecondaryShell uid="learner-1" profile={{ displayName: 'Mira Okafor' }} classIds={['c1']} section="dashboard" {...props} />); });
  await flush(); await flush();
};
const text = () => host.textContent;

beforeEach(() => {
  localStorage.clear(); vi.clearAllMocks();
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  loadDashboardCourses.mockResolvedValue({ courses: [COURSE], warnings: [] });
  api();
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

describe('shell', () => {
  it('marks the current section and offers More with existing features', async () => {
    await render({ section: 'learning' });
    expect(host.querySelector('a[aria-current="page"]').getAttribute('href')).toBe('#/dashboard/learning');
    const more = host.querySelector('.ls-more button');
    expect(more.getAttribute('aria-expanded')).toBe('false');
    await act(async () => more.click());
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(text()).toContain('nav.community');
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(more.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(more);
  });
  it('gives phones one top menu with the same sections and features, which Escape closes', async () => {
    await render({ section: 'universe' });
    const button = host.querySelector('.ls-phone-menu button');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.textContent).toContain('My Universe');
    await act(async () => button.click());
    const menu = host.querySelector('#ls-menu');
    expect(button.getAttribute('aria-controls')).toBe('ls-menu');
    expect([...menu.querySelectorAll('nav > a')].map((a) => a.getAttribute('href'))).toEqual(['#/dashboard', '#/dashboard/learning', '#/dashboard/universe', '#/dashboard/portfolio']);
    expect(menu.querySelector('a[aria-current=page]').getAttribute('href')).toBe('#/dashboard/universe');
    expect(menu.textContent).toContain('nav.community');
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(host.querySelector('#ls-menu')).toBeNull();
    expect(document.activeElement).toBe(button);
  });
  it('saves Calm mode per account through the existing dashboard preferences', async () => {
    await render();
    const toggle = host.querySelector('[role=switch]');
    expect(host.querySelector('.ls-shell').className).not.toContain('ls-calm');
    await act(async () => toggle.click());
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(host.querySelector('.ls-shell').className).toContain('ls-calm');
    expect(localStorage.getItem('hearisland.dashboard.prefs.v1:learner-1') || JSON.stringify({ ...localStorage })).toContain('"calm":true');
    // Account switching: the next learner starts from their own preference, not this one's.
    await render({ uid: 'learner-2' });
    expect(host.querySelector('.ls-shell').className).not.toContain('ls-calm');
    await render({ uid: 'learner-1' });
    expect(host.querySelector('.ls-shell').className).toContain('ls-calm');
  });
});

describe('dashboard', () => {
  it('shows server XP and earned badges only, with no concept values or AI', async () => {
    await render();
    expect(text()).toContain('Level 3 Investigator');
    expect(text()).toContain('262 / 380 XP');
    expect(text()).toContain('First Evidence');
    expect(text()).not.toMatch(/Mars|Level 7|340 \/ 500|Curious Learner|Ask Spark|AI coach/);
    expect(host.querySelector('.ls-help a').getAttribute('href')).toBe('#/messages');
  });
  it('connects the next action to the real course id, with the same count as My Learning', async () => {
    await render();
    expect(host.querySelector('.ls-hero a').getAttribute('href')).toBe('#/pbl/programs/course-a/plan');
    expect(text()).toContain('2 of 6 sessions marked complete');
    await render({ section: 'learning' });
    expect(text()).toContain('2 of 6 sessions marked complete');
    expect(loadDashboardCourses).toHaveBeenCalledTimes(1);
  });
  it('shows the active quest on the dashboard even with no course', async () => {
    loadDashboardCourses.mockResolvedValue({ courses: [], warnings: [] });
    await render();
    expect(host.querySelector('.ls-hero').textContent).toContain('Name who is affected');
    expect(host.querySelector('.ls-hero').textContent).toContain('1 of 4 steps done');
    expect(host.querySelector('.ls-hero a').getAttribute('href')).toBe('#/pbl/project');
  });
  it('keeps the term quest visible below a course hero', async () => {
    await render();
    expect(host.querySelector('.ls-hero').textContent).toContain('River study');
    expect(host.querySelector('.ls-also a').getAttribute('href')).toBe('#/pbl/project');
    expect(host.querySelector('.ls-also').textContent).toContain('Name who is affected');
  });
  it('does not request or show XP when the school has it off', async () => {
    api({ questMode: false });
    await render();
    expect(text()).toContain('aren’t switched on');
    expect(text()).not.toMatch(/\bXP\b|Level \d/);
    expect(schoolRequest.mock.calls.some(([, path]) => path === '/api/quest/me')).toBe(false);
  });
  it('shows a failed progress read as unknown with a retry, never as zero', async () => {
    api({ quest: new Error('down') });
    await render();
    expect(text()).toContain('couldn’t be loaded');
    expect(text()).not.toMatch(/Level 1|0 \/ 100/);
    api();
    await act(async () => host.querySelector('.ls-progress .ls-retry').click());
    await flush();
    expect(text()).toContain('Level 3 Investigator');
  });
  it('keeps the join-a-class panel for a learner with no class', async () => {
    await render({ classIds: [] });
    expect(host.querySelector('.ls-dash-main').textContent).toMatch(/class/i);
  });
});

describe('learning', () => {
  it('shows loading, empty and error course states with retry', async () => {
    loadDashboardCourses.mockReturnValue(new Promise(() => {}));
    await render({ section: 'learning' });
    expect(text()).toContain('Loading your courses');
    await act(async () => root.unmount()); root = createRoot(host);
    loadDashboardCourses.mockResolvedValue({ courses: [], warnings: [] });
    await render({ section: 'learning' });
    expect(text()).toContain('No current project');
    await act(async () => root.unmount()); root = createRoot(host);
    loadDashboardCourses.mockRejectedValue(new Error('x'));
    await render({ section: 'learning' });
    expect(text()).toContain('could not be loaded');
    loadDashboardCourses.mockResolvedValue({ courses: [COURSE], warnings: [] });
    await act(async () => host.querySelector('.ls-courses .ls-retry').click());
    await flush();
    expect(text()).toContain('River study');
  });
  it('keeps recheck and unavailable warnings and shows no bar for them', async () => {
    loadDashboardCourses.mockResolvedValue({ warnings: [], courses: [{ ...COURSE, summary: null, needsRecheck: true }, { program: { ...COURSE.program, id: 'b', title: 'Garden' }, summary: null, progressUnavailable: true }] });
    await render({ section: 'learning' });
    expect(text()).toContain('Re-check sessions');
    expect(text()).toContain('Progress could not be loaded');
    expect(host.querySelector('.ls-courses [role=progressbar]')).toBeNull();
  });
  it('labels the server’s quest as term-project work, apart from courses', async () => {
    await render({ section: 'learning' });
    expect(host.querySelector('.ls-quest').textContent).toContain('Name who is affected');
    expect(host.querySelector('.ls-courses').textContent).not.toContain('Name who is affected');
  });
  it('renders the 8-stage structure and interactive checklist, and persists ticked stage tasks', async () => {
    await render({ section: 'learning' });
    const stageTiles = host.querySelectorAll('.ls-eight-stages .ls-stage-tile-btn');
    expect(stageTiles).toHaveLength(8);
    expect(stageTiles[0].getAttribute('aria-current')).toBe('step');
    const firstCheck = host.querySelector('.ls-eight-stages .ls-stage-checks button[role=checkbox]');
    expect(firstCheck.getAttribute('aria-checked')).toBe('false');
    await act(async () => firstCheck.click());
    expect(firstCheck.getAttribute('aria-checked')).toBe('true');
    // Switch to Stage 8 (Reflect & Iterate) and tick its first item
    await act(async () => stageTiles[7].click());
    expect(stageTiles[7].getAttribute('aria-current')).toBe('step');
    expect(host.querySelector('.ls-eight-stages .ls-stage-detail').textContent).toContain('Reflect & Iterate');
    const stage8Check = host.querySelector('.ls-eight-stages .ls-stage-checks button[role=checkbox]');
    await act(async () => stage8Check.click());
    expect(stage8Check.getAttribute('aria-checked')).toBe('true');
  });
});

describe('learning: approved 8-stage UI', () => {
  const session = (sessionNumber, extra = {}) => ({ sessionNumber, title: `Session ${sessionNumber} title`, activities: ['Real task A', 'Real task B'], ...extra });
  const phases = [{ id: 'p1', title: 'Explore', sessions: [session(1), session(2)] }, { id: 'p2', title: 'Define', sessions: [{ sessionNumber: 3 }] }];
  const real = { program: { id: 'course-real', title: 'Real course', phases, sessions: phases.flatMap((p) => p.sessions) }, summary: { done: 0, total: 3, pct: 0, next: session(1), byPhase: {} } };
  it('never fills a session gap with template tasks', async () => {
    loadDashboardCourses.mockResolvedValue({ courses: [real], warnings: [] });
    await render({ section: 'learning' });
    await act(async () => [...host.querySelectorAll('.ls-course-stage-tab')][1].click());
    const panel = host.querySelector('.ls-course-phase-panel');
    expect(panel.textContent).toContain('Session 3');
    expect(panel.querySelector('.ls-mission-checks')).toBeNull();
    expect(panel.textContent).not.toMatch(/mission 1\b.*Explore mission|Complete at least two hands-on/);
  });
  it('keeps the card count on the same record when a mission is ticked, and re-reads on leaving', async () => {
    loadDashboardCourses.mockResolvedValue({ courses: [real], warnings: [] });
    await render({ section: 'learning' });
    expect(host.querySelector('.ls-course').textContent).toContain('0 of 3 sessions marked complete');
    await act(async () => host.querySelector('.ls-mission-done-btn').click());
    await flush();
    expect(host.querySelector('.ls-course').textContent).toContain('1 of 3 sessions marked complete');
    expect(loadDashboardCourses).toHaveBeenCalledTimes(1);
    await render({ section: 'dashboard' });
    expect(loadDashboardCourses).toHaveBeenCalledTimes(2);
  });
  it('says Stage 8 ticks stay on this device', async () => {
    await render({ section: 'learning' });
    const tiles = host.querySelectorAll('.ls-eight-stages .ls-stage-tile-btn');
    expect(host.querySelector('.ls-stage-detail').textContent).not.toContain('this device only');
    await act(async () => tiles[7].click());
    expect(host.querySelector('.ls-stage-detail').textContent).toContain('this device only');
  });
  it('adds a catalog course through the existing enrolment, and shows a failure instead of claiming success', async () => {
    await render({ section: 'learning' });
    const add = host.querySelector('.ls-catalog-card button');
    await act(async () => add.click());
    await flush();
    expect(addToMyCourse).toHaveBeenCalledTimes(1);
    expect(addToMyCourse.mock.calls[0][1]).toBe('learner-1');
    expect(localStorage.getItem('learningPath_learner-1')).toBeNull();
    addToMyCourse.mockRejectedValueOnce(new Error('denied'));
    const reads = loadDashboardCourses.mock.calls.length;
    await flush();
    await act(async () => host.querySelector('.ls-catalog-card button').click());
    await flush();
    expect(host.querySelector('.ls-catalog-drawer [role=alert]').textContent).toContain('couldn’t be added');
    expect(loadDashboardCourses.mock.calls.length).toBe(reads);
  });
});

describe('learning: catalog on a stuck connection', () => {
  it('stops waiting and says so when the save never completes', async () => {
    await render({ section: 'learning' });
    vi.useFakeTimers();
    try {
      addToMyCourse.mockReturnValueOnce(new Promise(() => {}));
      await act(async () => host.querySelector('.ls-catalog-card button').click());
      expect(host.querySelector('.ls-catalog-card button').textContent).toContain('Adding course');
      await act(async () => { await vi.advanceTimersByTimeAsync(12000); });
      expect(host.querySelector('.ls-catalog-drawer [role=alert]').textContent).toContain('Check your connection');
      expect(host.querySelector('.ls-catalog-card button').disabled).toBe(false);
    } finally { vi.useRealTimers(); }
  });
});

describe('universe', () => {
  it('opens real destinations and labels the preview', async () => {
    const onOpenActivity = vi.fn();
    await render({ section: 'universe', onOpenActivity });
    expect(host.querySelector('.ls-world').textContent).toContain('Preview');
    const [science, design, technology] = host.querySelectorAll('.ls-world button');
    await act(async () => design.click());
    expect(onOpenActivity).toHaveBeenCalledWith('hexgrid');
    await act(async () => technology.click());
    expect(onOpenActivity).toHaveBeenCalledWith('coding');
    await act(async () => science.click());
    await flush();
    const explorer = host.querySelector('[data-testid=explorer]');
    expect(explorer.dataset.preview).toBe('true');
    expect(explorer.dataset.arrival).toBe('thalassa');
  });
  it('searches the real catalogue without claiming AI', async () => {
    await render({ section: 'universe' });
    expect(host.querySelector('.ls-adventure').textContent).not.toMatch(/\bAI\b/);
    const button = host.querySelector('.ls-adventure button');
    expect(button.disabled).toBe(true);
    expect(host.querySelector('.ls-continue').textContent).toContain('Plan your samples');
  });
});

describe('portfolio', () => {
  const items = [{ id: 'a', kind: 'writing', title: 'My note', body: 'Body text', audiences: [] }, { id: 'b', kind: 'code', title: 'Script', body: 'print()', audiences: ['coaches'] }];
  it('shows real items with their audience, and links to the existing editor', async () => {
    api({ items });
    await render({ section: 'portfolio' });
    const cards = host.querySelectorAll('.ls-work');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('Private');
    expect(cards[1].textContent).toContain('Coaches');
    expect([...host.querySelectorAll('a')].find((a) => a.textContent.includes('Add my work')).getAttribute('href')).toBe('#/portfolio');
    await act(async () => cards[0].querySelector('button').click());
    expect(host.querySelector('dialog').textContent).toContain('Body text');
  });
  it('saves a reflection as a private item through the existing endpoint', async () => {
    api({ items: [] });
    await render({ section: 'portfolio' });
    expect(text()).toContain('Nothing here yet');
    await act(async () => host.querySelector('.ls-reflect button').click());
    const box = host.querySelector('dialog textarea');
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    await act(async () => { setter.call(box, 'I fixed my sensor.'); box.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => { host.querySelector('dialog form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await flush();
    const call = schoolRequest.mock.calls.find(([method, path]) => method === 'POST' && path === '/api/learner-space/items');
    expect(call[2].body).toMatchObject({ kind: 'writing', body: 'I fixed my sensor.', audiences: [] });
    expect(host.querySelector('dialog')).toBeNull();
    expect(host.querySelectorAll('.ls-work')).toHaveLength(1);
  });
  it('offers a retry when the portfolio cannot load', async () => {
    schoolRequest.mockImplementation(async () => { throw new Error('Unavailable'); });
    await render({ section: 'portfolio' });
    expect(host.querySelector('.ls-retry')).not.toBeNull();
    expect(text()).not.toContain('Nothing here yet');
  });
});

describe('primary account in the shell', () => {
  it('keeps the primary gates: no courses, goals, quest, explorer or coach chat', async () => {
    await render({ isPrimary: true, profile: { displayName: 'Noor', ageBand: 'primary' } });
    expect(loadDashboardCourses).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
    expect(schoolRequest.mock.calls.some(([, path]) => path.startsWith('/api/quest') || path === '/api/learning-context')).toBe(false);
    expect(host.querySelector('.ls-help')).toBeNull();
    await act(async () => host.querySelector('.ls-more button').click());
    const links = [...host.querySelectorAll('.ls-more a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['#/primary-resources', '#/settings']);
    await render({ isPrimary: true, section: 'learning' });
    expect(host.querySelector('[data-testid=junior]')).not.toBeNull();
    expect(host.querySelector('.ls-eight-stages, .ls-catalog-drawer')).toBeNull();
    await render({ isPrimary: true, section: 'universe' });
    expect(host.querySelector('.ls-world')).toBeNull();
    expect(text()).toContain('Your explorations are in My Learning');
  });
});
