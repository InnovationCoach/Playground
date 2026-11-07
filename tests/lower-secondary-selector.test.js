import { describe, expect, it, vi } from 'vitest';
vi.mock('../src/firebase.js', () => ({ auth: {}, db: {}, storage: {} }));
import { LAYOUTS, selectLayout, shellSection } from '../src/features/lowerSecondary/layoutSelector.js';
import { alsoToday, continueCourse, courseStatus, heroAction, moreMenuItems, progressView, reflectionItem, WORLDS } from '../src/features/lowerSecondary/lowerSecondaryModel.js';
import { hrefFor, parseRoute } from '../src/app/routes.js';
import { signInDestination } from '../src/app/landing.js';
import { menuFor } from '../src/features/shell/Sidebar.jsx';

const pick = (contract, role = 'student') => selectLayout({ role, contract });
const verified = (extra) => ({ verified: true, ...extra });

describe('layout selection', () => {
  it.each([[11], [12], [13], [14]])('selects lower secondary for a verified age %i', (age) => {
    expect(pick(verified({ age }))).toEqual({ layout: LAYOUTS.LOWER_SECONDARY, reason: 'eligible' });
  });
  it.each([[15], [16], [18], [40]])('keeps the current layout at verified age %i', (age) => {
    expect(pick(verified({ age }))).toEqual({ layout: LAYOUTS.EXISTING, reason: 'older' });
  });
  it('keeps the current layout under 11', () => {
    expect(pick(verified({ age: 10 }))).toEqual({ layout: LAYOUTS.EXISTING, reason: 'outside-rollout' });
  });
  it('treats missing data and unverified contracts as missing', () => {
    expect(pick(null).reason).toBe('missing');
    expect(pick(undefined).reason).toBe('missing');
    expect(pick(verified({})).reason).toBe('missing');
    expect(pick({ age: 13 })).toEqual({ layout: LAYOUTS.EXISTING, reason: 'missing' });
    expect(pick({ age: 13, verified: 'true' }).layout).toBe(LAYOUTS.EXISTING);
  });
  it.each([['twelve'], [12.5], [-1], [999], [null], [NaN]])('treats an invalid age %s as invalid', (age) => {
    expect(pick(verified({ age }))).toEqual({ layout: LAYOUTS.EXISTING, reason: 'invalid' });
  });
  it('accepts a range only when it sits entirely inside the rollout', () => {
    expect(pick(verified({ ageRange: { min: 12, max: 14 } })).layout).toBe(LAYOUTS.LOWER_SECONDARY);
    expect(pick(verified({ ageRange: { min: 13, max: 15 } }))).toEqual({ layout: LAYOUTS.EXISTING, reason: 'ambiguous' });
    expect(pick(verified({ ageRange: { min: 10, max: 12 } }))).toEqual({ layout: LAYOUTS.EXISTING, reason: 'ambiguous' });
    expect(pick(verified({ ageRange: { min: 15, max: 18 } })).reason).toBe('older');
    expect(pick(verified({ ageRange: { min: 14, max: 12 } })).reason).toBe('invalid');
  });
  it('only students qualify', () => {
    for (const role of ['teacher', 'coach', 'admin', 'supervisor', 'parent', null]) expect(pick(verified({ age: 12 }), role)).toEqual({ layout: LAYOUTS.EXISTING, reason: 'not-student' });
  });
  it('applies staff overrides with explicit precedence', () => {
    expect(pick(verified({ age: 13, override: 'existing' })).reason).toBe('override-existing');
    expect(pick(verified({ age: 15, override: 'lowerSecondary' }))).toEqual({ layout: LAYOUTS.LOWER_SECONDARY, reason: 'override-lower-secondary' });
    expect(pick(verified({ override: 'lowerSecondary' })).layout).toBe(LAYOUTS.LOWER_SECONDARY);
    expect(pick(verified({ ageRange: { min: 13, max: 15 }, override: 'lowerSecondary' })).layout).toBe(LAYOUTS.LOWER_SECONDARY);
  });
  it('never lets an override opt in a child who is or may be under 11, or hide bad data', () => {
    expect(pick(verified({ age: 10, override: 'lowerSecondary' })).layout).toBe(LAYOUTS.EXISTING);
    expect(pick(verified({ ageRange: { min: 10, max: 12 }, override: 'lowerSecondary' })).layout).toBe(LAYOUTS.EXISTING);
    expect(pick(verified({ age: 'x', override: 'lowerSecondary' })).reason).toBe('invalid');
    expect(pick(verified({ age: 12, override: 'junior' })).reason).toBe('invalid');
  });
});

describe('routes and landing', () => {
  it('adds shell sections without changing the plain dashboard route', () => {
    expect(parseRoute('#/dashboard')).toEqual({ screen: 'dashboard' });
    expect(parseRoute('#/dashboard/learning')).toEqual({ screen: 'dashboard', section: 'learning' });
    expect(parseRoute('#/dashboard/universe').section).toBe('universe');
    expect(parseRoute('#/dashboard/portfolio').section).toBe('portfolio');
    expect(parseRoute('#/dashboard/anything')).toEqual({ screen: 'dashboard' });
  });
  it('keeps a requested section through sign-in', () => {
    expect(signInDestination('student', false, '#/dashboard/universe')).toBeNull();
    expect(signInDestination('student', false, '')).toBe(hrefFor.dashboard());
  });
  it('only the shell renders a section; other routes keep their guarded branches', () => {
    const on = LAYOUTS.LOWER_SECONDARY;
    expect(shellSection({ layout: LAYOUTS.EXISTING, route: { screen: 'dashboard', section: 'learning' }, isPrimary: false })).toBeNull();
    expect(shellSection({ layout: on, route: { screen: 'dashboard', section: 'learning' }, isPrimary: false })).toBe('learning');
    expect(shellSection({ layout: on, route: { screen: 'dashboard' }, isPrimary: false })).toBe('dashboard');
    for (const screen of ['courses', 'goals', 'pbl', 'settings', 'admin']) expect(shellSection({ layout: on, route: { screen }, isPrimary: true })).toBeNull();
    // Course and project routes keep their own screens, so Continue opens the exact session.
    for (const hash of ['#/courses', '#/pbl', '#/pbl/project', '#/pbl/programs', '#/pbl/programs/river/plan']) expect(shellSection({ layout: on, route: parseRoute(hash), isPrimary: false })).toBeNull();
    // A secondary learner with no hash may be in an activity view: that stays.
    expect(shellSection({ layout: on, route: null, isPrimary: false })).toBeNull();
    expect(shellSection({ layout: on, route: null, isPrimary: true })).toBe('dashboard');
  });
});

describe('page model', () => {
  it('keeps every existing student menu item reachable from More', () => {
    const more = moreMenuItems({ isPrimary: false }).map((item) => item.key);
    const all = menuFor('student').flatMap((group) => group.items).map((item) => item.key);
    expect(more).toEqual(all.filter((key) => key !== 'dashboard'));
    expect(more).toEqual(expect.arrayContaining(['courses', 'pbl', 'goals', 'community', 'settings', 'journey', 'canva']));
  });
  it('gives a primary account no route around the primary gates', () => {
    expect(moreMenuItems({ isPrimary: true }).map((item) => item.key)).toEqual(['resources', 'settings']);
  });
  it('maps every world card to a real destination', () => {
    for (const world of WORLDS) expect(!!world.activity !== !!world.arrival).toBe(true);
    expect(WORLDS.find((w) => w.id === 'science').preview).toBe(true);
    expect(JSON.stringify(WORLDS)).not.toMatch(/mars/i);
  });
  it('reports unknown progress as unknown, never as zero', () => {
    const quest = { loading: false, data: null };
    expect(progressView({ questEnabled: false, schoolLoading: true, quest }).state).toBe('loading');
    expect(progressView({ questEnabled: false, schoolError: new Error('x'), quest }).state).toBe('unknown');
    expect(progressView({ questEnabled: false, quest }).state).toBe('off');
    expect(progressView({ questEnabled: true, quest: { loading: true, data: null } }).state).toBe('loading');
    expect(progressView({ questEnabled: true, quest }).state).toBe('unknown');
    expect(progressView({ questEnabled: true, quest: { data: { level: { level: 3 }, badges: [{ id: 'a', earned: true }, { id: 'b', earned: false }] } } }).earned).toHaveLength(1);
  });
  it('keeps correction warnings and unavailable progress out of the count', () => {
    expect(courseStatus({ needsRecheck: true }).kind).toBe('recheck');
    expect(courseStatus({ progressUnavailable: true }).kind).toBe('unavailable');
    expect(courseStatus({}).kind).toBe('unstarted');
    expect(courseStatus({ summary: { done: 2, total: 6, pct: 33 } })).toMatchObject({ kind: 'counted', done: 2, total: 6 });
  });
  it('continues only a real unfinished course, by its own id', () => {
    const next = { title: 'Step' };
    expect(continueCourse([{ program: { id: 'a' }, needsRecheck: true, summary: { next } }, { program: { id: 'b' }, summary: null }])).toBeNull();
    expect(continueCourse([{ program: { id: 'a b', title: 'T' }, summary: { next, done: 1, total: 2, pct: 50 } }]).href).toBe(hrefFor.program('a b', 'plan'));
  });
  describe('dashboard hero', () => {
    const ready = { state: 'ready', courses: [], warnings: [] }, progress = { state: 'ready' };
    const course = { program: { id: 'river', title: 'River study' }, summary: { next: { title: 'Plan samples' }, done: 2, total: 6, pct: 33 } };
    const quest = { todaysQuest: { task: 'Name who is affected', phaseTitle: 'Define', done: 1, total: 4 } };
    const goal = { source: 'Your learning plan', title: 'Sketch a map', href: hrefFor.goals(), action: 'Open my goal' };
    it('puts an active course ahead of a goal step, at its exact destination, and keeps the rest visible', () => {
      const hero = heroAction({ courses: { ...ready, courses: [course] }, quest, progress, fallback: goal });
      expect(hero).toMatchObject({ kind: 'course', title: 'River study', href: '#/pbl/programs/river/plan', step: '2 of 6 sessions marked complete' });
      expect(alsoToday({ hero, quest, fallback: goal }).map((row) => row.href)).toEqual(['#/pbl/project', hrefFor.goals()]);
    });
    it('shows the server quest when no course is active', () => {
      const hero = heroAction({ courses: ready, quest, progress, fallback: goal });
      expect(hero).toMatchObject({ kind: 'quest', title: 'Name who is affected', href: '#/pbl/project', step: '1 of 4 steps done' });
      expect(alsoToday({ hero, quest, fallback: goal }).map((row) => row.id)).toEqual(['goal']);
    });
    it('never offers to continue a course whose progress cannot be counted', () => {
      const courses = { ...ready, courses: [{ ...course, needsRecheck: true }, { ...course, progressUnavailable: true }] };
      expect(heroAction({ courses, quest: null, progress, fallback: goal }).kind).toBe('guidance');
    });
    it('falls back to the existing guidance with no quest, and waits rather than flashing a wrong action', () => {
      const hero = heroAction({ courses: ready, quest: null, progress: { state: 'off' }, fallback: goal });
      expect(hero).toMatchObject({ kind: 'guidance', title: 'Sketch a map' });
      expect(alsoToday({ hero, quest: null, fallback: goal })).toEqual([]);
      expect(heroAction({ courses: { ...ready, state: 'loading' }, quest, progress, fallback: goal }).loading).toBe(true);
      expect(heroAction({ courses: ready, quest: null, progress: { state: 'loading' }, fallback: goal }).loading).toBe(true);
    });
  });
  it('starts reflections private', () => {
    expect(reflectionItem(' proud ')).toEqual({ title: 'What I’m proud of', kind: 'writing', body: 'proud', link: '', media: null, audiences: [] });
  });
});
