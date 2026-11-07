// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DailyLearningSlide } from '../src/features/dashboard/LearningHub.jsx';
import { SparkUniverse } from '../src/features/dashboard/SparkUniverse.jsx';
import { GoalFlow } from '../src/features/goals/GoalFlow.jsx';
import { firstStepOptions, LIMITS, newPlan } from '../src/features/goals/goalPlan.js';
import { newQuests, questReason, plainTitle } from '../src/features/home/discoveryModel.js';
import { PILOT_RELEASES } from '../src/features/universe/pilot/pilotRegistry.js';
import { DashboardDeck } from '../src/features/dashboard/DashboardDeck.jsx';
import { toolGroups } from '../src/features/dashboard/allTools.js';
import { menuFor } from '../src/features/shell/Sidebar.jsx';
import { hydrateSlides, SLIDES } from '../src/features/dashboard/slideModel.js';
import { parseRoute } from '../src/app/routes.js';

vi.mock('../src/app/i18n/LocaleProvider.jsx', () => ({ useLocale: () => ({ t: (key) => key, locale: 'en' }) }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root, host;
function mount(element) {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(element));
  return host;
}
const buttonIn = (scope, name) => [...scope.querySelectorAll('button')].find((b) => (name instanceof RegExp ? name.test(b.textContent) : b.textContent.trim() === name));
const press = (name, scope = host) => { const b = buttonIn(scope, name); if (!b) throw new Error(`No button: ${name}`); act(() => b.click()); };
const pressRadio = (text) => { const label = [...host.querySelectorAll('label')].find((l) => l.textContent.trim() === text); act(() => label.querySelector('input').click()); };
const type = (el, value) => act(() => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
const question = () => host.querySelector('h2').textContent;
afterEach(() => { act(() => root?.unmount()); host?.remove(); window.localStorage.clear(); });

const ready = { state: 'ready', courses: [], warnings: [], retry: () => {} };
const quests = (plan, today = []) => ({
  data: ready, plan, project: {}, firstName: 'Alex', goalsLoaded: true, goalSync: 'saved', onToggle: vi.fn(), onOpenActivity: vi.fn(),
  model: { today, ticked: new Set(), academic: { items: [] } }
});

describe('My Quests', () => {
  it('leads with one next action and shows no stats', () => {
    const task = { id: 'step:g:s', kind: 'step', text: 'Sketch my idea', goal: 'Build a game' };
    const props = quests({ ...newPlan(), goals: [{ id: 'g', explore: 'Build a game', done: false, steps: [{ id: 's', text: 'Sketch my idea', done: false }] }] }, [task]);
    mount(<DailyLearningSlide {...props} />);
    const next = host.querySelector('section[aria-label="Your next step"]');
    expect(next.querySelector('h3').textContent).toBe('Sketch my idea');
    expect(next.querySelectorAll('a')).toHaveLength(1);
    expect(host.textContent).not.toMatch(/CHARGED|LV\.|STREAK|MOMENTUM/i);
    expect(host.querySelector('[role="progressbar"]')).toBeNull();
    expect(host.querySelector('details.lh-full-plan').open).toBe(false);
    press(/I’ve done this/, next);
    expect(props.onToggle).toHaveBeenCalledWith(task);
  });
  it('keeps the whole plan available', () => {
    mount(<DailyLearningSlide {...quests(newPlan())} />);
    const details = host.querySelector('details.lh-full-plan');
    for (const label of ['Today', 'Coming up', 'Done']) expect(buttonIn(details, label)).toBeTruthy();
    expect(details.querySelector('#lh-pbl-title').textContent).toBe('My projects');
    expect(details.querySelector('#lh-academic-title').textContent).toBe('School courses');
  });
});

describe('Find a Quest', () => {
  const item = (key, title = key) => ({ key, source: key.split(':')[0], id: key.split(':')[1], title, kicker: '', description: 'garden sensors', keywords: '' });
  const items = [item('program:current'), item('program:added'), item('activity:started'), item('partner:site'), item('activity:new'), item('program:other')];
  it('offers only quests the learner hasn’t begun, each with one reason', () => {
    const list = newQuests({ items, focusGoal: { explore: 'garden project' }, courses: [{ program: { id: 'current' } }], started: ['started'], added: ['program:added'] });
    expect(list.map((q) => q.item.key)).toEqual(['activity:new', 'program:other']);
    // A word nearly every course shares isn't a reason.
    expect(newQuests({ items: [item('activity:new')], focusGoal: { explore: 'working prototype' } })[0].reason.type).toBe('try');
    expect(questReason(list[0].reason)).toBe('It connects to your goal: garden project');
  });
  it('explains interest matches and openers plainly', () => {
    const list = newQuests({ items: [item('activity:new')], interestMatches: [{ id: 'new', because: ['Music'] }] });
    expect(questReason(list[0].reason)).toBe('You said you like music');
    expect(questReason({ type: 'interest', interest: 'My community' })).toBe('You said you care about your community');
    expect(questReason(newQuests({ items: [item('activity:new')] })[0].reason)).toMatch(/not sure yet/);
  });
  it('uses a plain title where the official one is hard to read', () => {
    expect(plainTitle({ title: 'Quantitative Biomechanics & Bio-Inspired Robotics' })).toBe('How animals move, and robots that copy them');
    expect(plainTitle({ title: 'Solar Car (12 weeks)' })).toBe('Solar Car');
  });
});

describe('Goal setting flow', () => {
  const next = () => press(/^(Next|Skip)/);
  it('asks one question at a time and ends by choosing a first small step', () => {
    const onAdd = vi.fn();
    mount(<GoalFlow onAdd={onAdd} />);
    expect(host.textContent).toContain('Question 1 of 4');
    expect(buttonIn(host, /^(Next|Skip)/).disabled).toBe(true);
    type(host.querySelector('#gl-flow-explore'), 'solar energy');
    next();
    expect(question()).toBe('How do you want to show what you learned?');
    expect(host.querySelector('#gl-flow-explore')).toBeNull();
    press('A poster');
    next();
    press('A quiet place to work');
    press('A quiet place to work'); // deselecting used to throw
    press('Headphones');
    next();
    expect(question()).toBe('Choose your first small step');
    expect(buttonIn(host, /Save my goal/).disabled).toBe(true);
    pressRadio('Sketch where things go on my poster');
    act(() => host.querySelector('form').requestSubmit());
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd.mock.calls[0][0]).toMatchObject({ explore: 'solar energy', showHow: 'poster', supports: ['headphones'], done: false, steps: [{ text: 'Sketch where things go on my poster', done: false }] });
  });
  it('lets a learner go back, skip, and write their own step', () => {
    const onAdd = vi.fn();
    mount(<GoalFlow onAdd={onAdd} />);
    press('Making a game');
    next();
    press(/Back/);
    expect(host.querySelector('#gl-flow-explore').value).toBe('Making a game');
    next(); next(); next();
    pressRadio('Write my own');
    type(host.querySelector('input[aria-label="My first small step"]'), 'Play one game and take notes');
    act(() => host.querySelector('form').requestSubmit());
    expect(onAdd.mock.calls[0][0]).toMatchObject({ showHow: null, supports: [], steps: [{ text: 'Play one game and take notes' }] });
  });
  it('limits supports to three', () => {
    mount(<GoalFlow onAdd={() => {}} supportsFirst={['quiet', 'timer', 'checklist']} />);
    press('Making a game');
    next(); next();
    expect(buttonIn(host, 'Headphones').disabled).toBe(true);
  });
  it('suggests steps that fit the length limit', () => {
    for (const step of firstStepOptions('x'.repeat(400), 'video')) expect(step.length).toBeLessThanOrEqual(LIMITS.text);
    expect(firstStepOptions('bees', 'video')[2]).toMatch(/video/);
    expect(firstStepOptions('bees')[2]).toMatch(/coach/);
  });
});

describe('My Universe', () => {
  const REVIEWED = [{ ...PILOT_RELEASES[0], status: 'published', reviewState: { science: 'educator-approved', curriculum: 'educator-approved', publication: 'authorized' } }];
  const onPersonalise = vi.fn();
  afterEach(() => onPersonalise.mockClear());
  const universe = (registry) => mount(<SparkUniverse prefs={{ calm: false, interests: ['Music'], tagline: 'Mia’s corner of space' }} plan={{ goals: [{ id: 'g', explore: 'Finished goal', done: true, steps: [] }] }} uid="u1" orgId="o1" onPersonalise={onPersonalise} registry={registry} />);
  it('gives each mission preview exactly one start button', () => {
    universe();
    const cards = host.querySelectorAll('.uv-mission');
    expect(cards.length).toBe(3);
    for (const card of cards) {
      expect(card.querySelectorAll('button, a')).toHaveLength(1);
      expect(card.querySelector('button').textContent).toMatch(/Start/);
    }
  });
  it('keeps the entry, star plate, themes, milestones and atmosphere choice', () => {
    universe();
    expect(buttonIn(host, /Enter My Universe/)).toBeTruthy();
    expect(host.querySelector('.ig-universe .ig-starfield circle')).toBeTruthy();
    const plate = host.querySelector('.ig-universe');
    for (const text of ['Mia’s corner of space', 'My themes', 'Music', 'My milestones', 'Finished goal']) expect(plate.textContent).toContain(text);
    press(/Choose my atmosphere/);
    expect(onPersonalise).toHaveBeenCalledOnce();
  });
  it('walks through Mission Builder one question at a time, then offers one start', async () => {
    universe(REVIEWED);
    press('Make my plan');
    expect(host.textContent).toContain('Question 1 of 4');
    expect(buttonIn(host, /^Next/).disabled).toBe(true);
    press(/Is the wind worth it\?Wind energy estimate/);
    press(/^Next/);
    press('Music');
    press(/^Next/);
    press('15 minutes');
    press(/^Next/);
    press(/Show me how first/);
    await act(async () => { buttonIn(host, /^Make my plan/).click(); });
    expect(host.querySelector('.mc-card h3').textContent).toBe('Is the wind worth it?');
    expect(host.textContent).toContain('What stays the same');
    expect(host.textContent).toContain('Sitting 1, about');
    expect(buttonIn(host, /Start this mission/)).toBeTruthy();
    // The plan survives a reload on this device.
    act(() => root.unmount());
    host.remove();
    universe(REVIEWED);
    expect(buttonIn(host, /Start this mission/)).toBeTruthy();
    expect(host.textContent).not.toMatch(/\bAI\b/);
  });
  it('shows missions as pending and keeps Mission Builder locked until review is recorded', () => {
    universe();
    expect(host.textContent).toContain('Teachers are still checking these missions');
    expect(host.textContent).toContain('Waiting for teacher review');
    expect(buttonIn(host, 'Make my plan')).toBeUndefined();
    expect(host.querySelectorAll('.uv-mission button').length).toBe(3);
    expect(host.textContent).not.toMatch(/\bAI\b/);
  });
});

describe('dashboard menu', () => {
  HTMLDialogElement.prototype.showModal ??= function showModal() { this.setAttribute('open', ''); };
  Element.prototype.scrollTo ??= function scrollTo() {};
  const deck = (props = {}) => {
    const onActive = vi.fn();
    const prefs = { ...hydrateSlides({}), calm: false, theme: 'inherit' };
    mount(<DashboardDeck prefs={prefs} update={() => {}} syncState="saved" name="Alex" active="find" onActive={onActive} onPersonalise={() => {}}
      renderSlide={(id) => <p>body of {id}</p>} {...props} />);
    return onActive;
  };
  it('lists all five sections in order, with labels and descriptions, and sits above the content', () => {
    deck();
    const items = [...host.querySelectorAll('.sd-nav-item')];
    expect(items.map((b) => b.querySelector('strong').textContent)).toEqual(['My Quests', 'Find a Quest', 'My Progress', 'Creative Space', 'My Universe']);
    expect(items.map((b) => b.querySelector('small').textContent)).toEqual(['Continue my learning', 'Try something new', 'See what I’ve done', 'Make and save ideas', 'Explore missions']);
    expect(host.querySelector('.sd-menu').compareDocumentPosition(host.querySelector('.sd-track')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(host.querySelector('.sd-top').compareDocumentPosition(host.querySelector('.sd-menu')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('has no slideshow controls, counters or fractions', () => {
    deck({ stats: {} });
    for (const sel of ['.sd-dock', '.sd-indicator', '.sd-arrows', '.sd-page-number']) expect(host.querySelector(sel)).toBeNull();
    expect(host.querySelector('.sd-menu').textContent).not.toMatch(/\d\s*\/\s*\d/);
    expect(host.querySelector('[aria-roledescription="slide"]')).toBeNull();
  });
  it('marks the selected section and goes to the one you choose from either control', () => {
    const onActive = deck();
    expect(host.querySelector('.sd-nav-item[aria-current="page"] strong').textContent).toBe('Find a Quest');
    press(/^My Progress/, host.querySelector('.sd-nav'));
    expect(onActive).toHaveBeenLastCalledWith('progress');
    const select = host.querySelector('.sd-nav-chooser select');
    expect(select.value).toBe('find');
    expect(select.options.length).toBe(SLIDES.length);
    act(() => { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, 'universe'); select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(onActive).toHaveBeenLastCalledWith('universe');
  });
  it('keeps every section mounted while switching, so drafts survive', () => {
    deck();
    expect(host.querySelectorAll('.sd-slide').length).toBe(5);
  });
  it('opens a labelled All tools panel and closes it', () => {
    deck();
    press(/All tools/);
    const dialog = host.querySelector('dialog.sd-tools');
    expect(dialog.getAttribute('aria-labelledby')).toBe('sd-tools-title');
    expect([...dialog.querySelectorAll('h3')].map((h) => h.textContent)).toEqual(['Learning', 'Goals and skills', 'Creating', 'People and settings']);
    expect(dialog.querySelectorAll('a').length).toBe(12);
    act(() => dialog.querySelector('button[aria-label="Close All tools"]').click());
    expect(host.querySelector('dialog.sd-tools')).toBeNull();
  });
});

describe('All tools matches the sidebar', () => {
  const sidebar = menuFor('student', { onOpenCourses() {}, onOpenGoals() {}, onNavigate() {} }).flatMap((g) => g.items);
  const tools = toolGroups().flatMap((g) => g.tools);
  it('reaches every student sidebar destination except the dashboard you are already on', () => {
    expect(tools.map((t) => t.key).sort()).toEqual(sidebar.map((i) => i.key).filter((k) => k !== 'dashboard').sort());
  });
  it('matches the live student menu, in order, with no Coach programs', () => {
    expect(sidebar.map((i) => i.label)).toEqual(['nav.myDashboard', 'nav.searchPrograms', 'nav.myCourses', 'nav.pbl', 'nav.myCompetencies', 'nav.canva', 'nav.goals', 'nav.futureSkills', 'nav.mySpace', 'nav.portfolioMaker', 'nav.home', 'nav.community', 'nav.settings']);
    expect(tools.some((t) => t.key === 'programs')).toBe(false);
  });
  it('explains every tool and opens the same route as the sidebar, and that route exists', () => {
    for (const tool of tools) {
      expect(tool.about.length).toBeGreaterThan(5);
      const item = sidebar.find((i) => i.key === tool.key);
      if (item.href) expect(tool.href).toBe(item.href);
      expect(parseRoute(tool.href), tool.key).not.toBeNull();
      expect(tool.label).toBe(item.label);
    }
    expect(tools.find((t) => t.key === 'courses').href).toBe('#/courses');
    expect(tools.find((t) => t.key === 'goals').href).toBe('#/goals');
  });
});

describe('an unsaved note', () => {
  it('comes back after leaving the dashboard, and only in this tab', async () => {
    vi.resetModules();
    vi.doMock('../src/auth.js', () => ({ createNote: vi.fn(async () => {}), fetchNotes: vi.fn(async () => []), deleteNote: vi.fn() }));
    const { NotesWidget } = await import('../src/features/dashboard/NotesWidget.jsx');
    await act(async () => { mount(<NotesWidget uid="u1" />); });
    type(host.querySelector('#md-note-title'), 'Half an idea');
    expect(JSON.parse(sessionStorage.getItem('spark.notes.draft.u1')).title).toBe('Half an idea');
    act(() => root.unmount()); host.remove();
    await act(async () => { mount(<NotesWidget uid="u1" />); });
    expect(host.querySelector('#md-note-title').value).toBe('Half an idea');
    act(() => root.unmount()); host.remove();
    await act(async () => { mount(<NotesWidget uid="u2" />); });
    expect(host.querySelector('#md-note-title').value).toBe('');
    sessionStorage.clear();
    vi.doUnmock('../src/auth.js');
  });
});
