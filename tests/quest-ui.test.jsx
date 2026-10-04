// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/app/i18n/LocaleProvider.jsx',()=>({useLocale:()=>({locale:'en'})}));
vi.mock('../src/services/api/apiClient.js', () => ({ schoolRequest: vi.fn() }));
vi.mock('../src/firebase.js', () => ({
  auth: { currentUser: { uid: 'learner-1' } },
  db: {},
  storage: {},
  doc: vi.fn((...parts) => ({ path: parts.slice(1).join('/') })),
  setDoc: vi.fn(async () => {}),
  getDoc: vi.fn(async () => ({ exists: false }))
}));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { setDoc } from '../src/firebase.js';
import { QuestArea } from '../src/features/quest/QuestHome.jsx';
import { levelFor, badgeProgress, nextBadge, emptyQuest } from '../src/features/quest/questModel.js';

let host, root;
const classes = [{ id: 'class-1', name: 'Climate Champions 7A' }];
const questSchool = { id: 'school-1', name: 'Test School', features: { questMode: true } };
const plainSchool = { id: 'school-1', name: 'Test School', features: { questMode: false } };

function view(overrides = {}) {
  const quest = { ...emptyQuest(), xp: 1240, counters: { ...emptyQuest().counters, reflections: 2 }, badges: [{ id: 'first-evidence', earnedAt: '2026-10-01T00:00:00Z' }] };
  return {
    revision: 3, today: '2026-10-07', timezone: 'Asia/Bangkok', holidays: [],
    level: levelFor(1240),
    streak: { count: 2, lastActiveDate: '2026-10-06', freezes: 1, activeToday: false, atRisk: true },
    counters: quest.counters, badges: badgeProgress(quest), nextBadge: nextBadge(quest),
    celebrations: [], dailySelfXp: 0, todaysQuest: null, stages: [],
    squad: { classId: 'class-1', className: 'Climate Champions 7A', count: 84, goal: 120 },
    recent: [{ type: 'evidence_submitted', xp: 40, createdAt: '2026-10-06T03:00:00Z' }],
    preferences: { calmView: false, showOnPortfolio: false },
    ...overrides
  };
}

function route(handlers) {
  schoolRequest.mockImplementation(async (method, path, options) => {
    const key = `${method} ${path.split('?')[0]}`;
    const handler = handlers[key];
    if (handler) return typeof handler === 'function' ? handler(options?.body) : handler;
    return { items: [] };
  });
}

const button = text => [...host.querySelectorAll('button, a')].find(b => b.textContent.includes(text));
const render = async el => { await act(async () => { root.render(el); }); await act(async () => {}); };
const click = async el => { await act(async () => { el.click(); }); await act(async () => {}); };

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  schoolRequest.mockReset();
  setDoc.mockClear();
  localStorage.clear();
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

describe('Teen Quest home', () => {
  it('keeps the existing Studio Home when the school has not switched quest mode on', async () => {
    route({});
    await render(<QuestArea school={plainSchool} classes={classes} learnerName="Mia Chen" />);
    expect(host.textContent).toContain('Find the campus energy hotspots');
    expect(schoolRequest.mock.calls.some(([, path]) => path === '/api/quest/me')).toBe(false);
  });

  it('shows level, XP, streak, today\'s quest, boosts, badges and the squad goal', async () => {
    route({ 'GET /api/quest/me': view() });
    await render(<QuestArea school={questSchool} classes={classes} learnerName="Mia Chen" />);
    const text = host.textContent;
    for (const expected of ['Level 7', 'Systems Thinker', '1,240 XP', '260 XP to Level 8', '2-day learning streak', '1 streak freeze ready',
      'Complete at least two STEAM activities', 'Write a 2-minute reflection', 'First Evidence', 'Next: Curious Mind', '84 / 120', 'Evidence submitted']) {
      expect(text).toContain(expected);
    }
    const bar = host.querySelector('[role="progressbar"][aria-label="Progress to level 8"]');
    expect(bar.getAttribute('aria-valuenow')).toBe('35');
    expect(host.textContent).not.toMatch(/rank|leaderboard/i);
  });

  it('saves the project tick before asking the API for step XP', async () => {
    const order = [];
    setDoc.mockImplementation(async () => { order.push('save'); });
    route({
      'GET /api/quest/me': view(),
      'POST /api/quest/events': body => { order.push(`event:${body.type}:${body.phaseId}:${body.index}`); return { duplicate: false, awarded: 10, quest: view({ level: levelFor(1250) }) }; }
    });
    await render(<QuestArea school={questSchool} classes={classes} learnerName="Mia Chen" />);
    await click(button('Mark this step done'));
    expect(order).toEqual(['save', 'event:task_step:explore:0']);
    expect(host.textContent).toContain('Step done. +10 XP');
    expect(host.textContent).toContain('1,250 XP');
  });

  it('explains a daily cap instead of pretending XP was added', async () => {
    route({ 'GET /api/quest/me': view(), 'POST /api/quest/events': { duplicate: false, awarded: 0, capped: true, quest: view() } });
    await render(<QuestArea school={questSchool} classes={classes} learnerName="Mia Chen" />);
    await click(button('Mark this step done'));
    expect(host.textContent).toContain('today\'s XP limit');
  });

  it('requires a real reflection, keeps it private and closes with Escape', async () => {
    route({ 'GET /api/quest/me': view(), 'POST /api/quest/events': { duplicate: false, awarded: 15, quest: view() } });
    await render(<QuestArea school={questSchool} classes={classes} learnerName="Mia Chen" />);
    await click(button('Write a 2-minute reflection'));
    const dialog = host.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('Only you can read your reflections');
    const save = button('Save reflection');
    expect(save.disabled).toBe(true);
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  });

  it('switches to Calm view and back without losing progress', async () => {
    let calm = false;
    route({
      'GET /api/quest/me': () => view({ preferences: { calmView: calm, showOnPortfolio: false } }),
      'PATCH /api/quest/me': body => { calm = body.calmView; return view({ revision: body.revision + 1, preferences: { calmView: calm, showOnPortfolio: false } }); }
    });
    await render(<QuestArea school={questSchool} classes={classes} learnerName="Mia Chen" />);
    await click(button('Calm view'));
    expect(schoolRequest).toHaveBeenCalledWith('PATCH', '/api/quest/me', { body: { calmView: true, revision: 3 } });
    expect(host.textContent).toContain('Calm view is on. Your XP and badges are still saved.');
    expect(host.textContent).toContain('Find the campus energy hotspots');
    await click(button('Switch to Quest Home'));
    expect(host.textContent).toContain('Systems Thinker');
  });

  it('celebrates a level-up once and acknowledges it', async () => {
    route({
      'GET /api/quest/me': view({ celebrations: [{ kind: 'level', level: 8, title: 'Systems Builder' }, { kind: 'badge', badgeId: 'curious-mind', name: 'Curious Mind' }] }),
      'PATCH /api/quest/me': view()
    });
    await render(<QuestArea school={questSchool} classes={classes} learnerName="Mia Chen" />);
    const dialog = host.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('Systems Builder');
    expect(dialog.textContent).toContain('Curious Mind');
    await click(button('Keep going'));
    expect(schoolRequest).toHaveBeenCalledWith('PATCH', '/api/quest/me', { body: { ackCelebrations: true, revision: 3 } });
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  });

  it('opens the Quest Map and the badge cabinet', async () => {
    route({ 'GET /api/quest/me': view() });
    await render(<QuestArea school={questSchool} classes={classes} learnerName="Mia Chen" />);
    await click(button('Quest Map'));
    expect(host.querySelectorAll('.qx-stage')).toHaveLength(7);
    await click([...host.querySelectorAll('.qx-stage')][1]);
    expect(host.textContent).toContain('Talk to at least two people');
    await click(button('Badges'));
    expect(host.textContent).toContain('Still to earn');
    expect(host.textContent).toContain('2 of 3');
  });

  it('falls back to Studio Home with a retry when quest progress cannot load', async () => {
    schoolRequest.mockImplementation(async (method, path) => {
      if (path === '/api/quest/me') throw Object.assign(new Error('UNAVAILABLE'), { code: 'UNAVAILABLE' });
      return { items: [] };
    });
    await render(<QuestArea school={questSchool} classes={classes} learnerName="Mia Chen" />);
    expect(host.textContent).toContain('Your quest progress could not load');
    expect(host.textContent).toContain('Find the campus energy hotspots');
    expect(button('Try again')).toBeTruthy();
  });
});
