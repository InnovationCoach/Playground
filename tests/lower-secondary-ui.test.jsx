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
vi.mock('../src/features/primary/JuniorExplorers.jsx', () => ({ JuniorExplorers: () => <div data-testid="junior">Junior Explorers content</div> }));
vi.mock('../src/features/school/SchoolLearningPanel.jsx', () => ({ SchoolLearningPanel: () => <div data-testid="school-panel" /> }));
vi.mock('../src/features/universe/explore/MyUniverseExplorer.jsx', () => ({ MyUniverseExplorer: (props) => <div data-testid="explorer" data-preview={String(props.preview)} data-arrival={props.initialArrival?.planetId || ''} /> }));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { loadDashboardCourses } from '../src/features/dashboard/dashboardCourses.js';
import { setDoc } from '../src/firebase.js';
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
    await render({ isPrimary: true, section: 'universe' });
    expect(host.querySelector('.ls-world')).toBeNull();
    expect(text()).toContain('Your explorations are in My Learning');
  });
});
