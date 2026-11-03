// @vitest-environment jsdom
// O04 planet arrival: the world first, optional equipment, then the learner starts the mission.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom has no WebGL: these run the text view, whose surface and arrival card match the 3D ones.
vi.mock('@react-three/fiber', () => ({ Canvas: () => null, useFrame: () => {}, useThree: () => ({}) }));
vi.mock('@react-three/drei', () => ({ Html: () => null, OrbitControls: () => null }));
const { FIXTURE_RELEASES } = await import('../shared/universe/fixtures/index.js');
const { ARRIVAL_EXPLORATION_MS } = await import('../shared/universe/planetArrival.js');
const { createSyntheticService, SYNTHETIC_PEOPLE } = await import('./universe-preview/syntheticUniverseService.js');
const { createUniverseClient } = await import('../src/features/universe/pilot/universeClient.js');
const { MyUniverseExplorer, arrivalNav, arrivesOn } = await import('../src/features/universe/explore/MyUniverseExplorer.jsx');
const { resolveExpedition, arrivalChoices } = await import('../src/features/universe/explore/PlanetArrival.jsx');
const { buildCosmos } = await import('../src/features/universe/explore/cosmosCatalog.js');
const catalog = (await import('../public/cosmos/v1/catalog.json')).default;
const cosmos = buildCosmos(catalog);
const loadCatalog = async () => cosmos;

const WIND = { planetId: 'thalassa', missionId: 'thalassa-wind-survey', routeId: 'guided' };
const MASS_POWER = { planetId: 'ignis', missionId: 'spacecraft-journey', routeId: 'advanced' };

let host, root, service;
const text = () => document.body.textContent;
const settle = async (n = 8) => { for (let i = 0; i < n; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const named = (name) => [...document.body.querySelectorAll('button')].find((b) => b.textContent.trim() === name);
const click = async (name) => { const b = typeof name === 'string' ? named(name) : name; expect(b, `button ${name}`).toBeTruthy(); await act(async () => b.click()); await settle(); };
const card = () => document.body.querySelector('.mx-arrival');
const site = (name) => [...document.body.querySelectorAll('.mx-arrival-sites label')].find((l) => l.textContent.trim() === name)?.querySelector('input');
const choose = async (name) => { const r = site(name); expect(r, `site ${name}`).toBeTruthy(); await act(async () => r.click()); await settle(); };
const heading = () => card()?.querySelector('h3')?.textContent;
const viewer = (who) => ({ uid: SYNTHETIC_PEOPLE[who].uid, orgId: SYNTHETIC_PEOPLE[who].orgId });
const clients = {};
const clientOf = (who) => (clients[who] ||= createUniverseClient({ fetchImpl: service.fetchFor(SYNTHETIC_PEOPLE[who]), getToken: async () => `synthetic-${who}` }));
// Arrival tests run without how-to clips unless a test passes them (the shipped registry is checked separately).
const explorer = ({ who = 'amira', ...props } = {}) => <MyUniverseExplorer preview forceTextView loadCatalog={loadCatalog} onClose={() => {}}
  missionRegistry={FIXTURE_RELEASES} missionClient={clientOf(who)} viewer={viewer(who)} allowInReviewMissions arrivalVideos={{}} {...props} />;
const show = async (props) => { await act(async () => root.render(explorer(props))); await settle(); };
const setVisibility = async (state) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  await act(async () => document.dispatchEvent(new Event('visibilitychange')));
};

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  service = createSyntheticService();
  for (const k of Object.keys(clients)) delete clients[k];
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.useRealTimers();
  delete document.visibilityState;
  host.remove(); document.body.innerHTML = '';
});

describe('planet arrival', () => {
  it('an expedition card lands on the planet first; the mission opens only when started, on the requested route', async () => {
    const before = JSON.stringify(localStorage);
    await show({ initialArrival: WIND });
    expect(document.body.querySelector('.px-sheet')).toBeNull(); // no mission covers the world
    expect(document.body.querySelector('.mx-text-surface h2').textContent).toBe('Thalassa Research Station');
    expect(heading()).toBe('Welcome to Thalassa');
    expect(document.body.querySelector('.mx-text-galaxy')).toBeNull(); // the surface, not the list of every planet
    // Places one at a time.
    expect(text()).toContain('Choose a place to read about it.');
    await click('Weather mast');
    expect([...document.body.querySelectorAll('.mx-text-surface > .mx-detail > h4')].map((h) => h.textContent)).toEqual(['Weather mast']);
    await click('Tide gauge');
    expect([...document.body.querySelectorAll('.mx-text-surface > .mx-detail > h4')].map((h) => h.textContent)).toEqual(['Tide gauge']);

    await click('Skip setup');
    expect(heading()).toBe('Ready for a mission');
    expect(text()).toContain('Equipment setup skipped. You can set it up any time.');
    const offers = [...card().querySelectorAll('.mx-arrival-choice')].map((c) => c.querySelector('strong').textContent + ' / ' + (c.querySelector('.mx-muted')?.textContent || ''));
    expect(offers).toEqual(['Is the wind worth it? / Wind energy estimate']);
    await click('Start mission');
    expect(document.body.querySelector('.px-sheet')).toBeTruthy();
    expect(text()).toContain('Mission · Wind energy estimate'); // the requested route, opened through the normal server draft path
    expect(card()).toBeNull(); // the card waits while the mission is open
    expect(JSON.stringify(localStorage)).toBe(before);
  });

  it('mass and power lands on Ignis with a solar meter and opens the advanced route, with or without setup', async () => {
    await show({ initialArrival: MASS_POWER });
    expect(heading()).toBe('Welcome to Ignis');
    await click('Ready now');
    expect(heading()).toBe('Place a solar meter');
    expect(named('Place equipment').disabled).toBe(true); // a site is chosen first; no dragging needed
    await choose('By the basalt columns');
    expect(site('By the basalt columns').checked).toBe(true);
    expect(text()).toContain('To think about: Would you compare open ground and a shaded spot?');
    expect(document.body.querySelector('.mx-text-surface > .mx-detail > h4').textContent).toBe('Basalt columns'); // choosing a site shows that place
    await click('Place equipment');
    expect(heading()).toBe('Solar meter placed');
    expect(text()).toContain('Placement collects no readings; the mission uses its supplied data.');
    expect(card().querySelector('textarea, input')).toBeNull(); // no new written response
    await click('Start mission');
    expect(text()).toContain('Mission · Mass and power tradeoffs');
  });

  it('offers setup after 45 seconds of visible time without stealing focus or opening a mission; Keep exploring holds', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    await show({ initialArrival: WIND });
    const place = named('Weather mast');
    place.focus();
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => vi.advanceTimersByTime(30_000));
    expect(heading()).toBe('Welcome to Thalassa');

    await setVisibility('hidden'); // a hidden tab does not count, and holds no timer
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => vi.advanceTimersByTime(120_000));
    await setVisibility('visible');
    await act(async () => vi.advanceTimersByTime(14_000));
    expect(heading()).toBe('Welcome to Thalassa');
    await act(async () => vi.advanceTimersByTime(ARRIVAL_EXPLORATION_MS - 30_000 - 14_000 + 1_000));
    expect(heading()).toBe('Place a portable wind sensor');
    expect(document.activeElement).toBe(place); // the learner keeps their place
    expect(document.body.querySelector('.px-sheet')).toBeNull();
    expect(card().querySelector('[aria-live]').textContent).toMatch(/set up equipment when you’re ready/);

    await click('Keep exploring');
    expect(named('Set up equipment')).toBeTruthy();
    expect(document.activeElement).toBe(named('Set up equipment'));
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => vi.advanceTimersByTime(600_000));
    expect(card().classList.contains('is-pill')).toBe(true); // never reopened by time
    await click('Set up equipment');
    expect(heading()).toBe('Place a portable wind sensor');

    await click('Back to Thalassa orbit'); // leaving the planet leaves no timer behind
    expect(vi.getTimerCount()).toBe(0);
  });

  it('opened in an already hidden tab spends no exploration time until it becomes visible (lead D)', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); // no event: hidden from the start
    await show({ initialArrival: WIND });
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => vi.advanceTimersByTime(ARRIVAL_EXPLORATION_MS * 3));
    expect(heading()).toBe('Welcome to Thalassa');
    await setVisibility('visible');
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => vi.advanceTimersByTime(ARRIVAL_EXPLORATION_MS - 2_000));
    expect(heading()).toBe('Welcome to Thalassa');
    await act(async () => vi.advanceTimersByTime(3_000));
    expect(heading()).toBe('Place a portable wind sensor');
  });

  it('places, moves and keeps equipment with buttons and keyboard focus only', async () => {
    await show({ initialArrival: WIND });
    await click('Ready now');
    expect(document.activeElement.textContent).toBe('Place a portable wind sensor');
    expect([...card().querySelectorAll('.mx-arrival-sites label')].map((l) => [l.textContent, l.querySelector('input').type, l.querySelector('input').checked]))
      .toEqual([['Beside the weather mast', 'radio', false], ['On the research platform', 'radio', false], ['Near the tide gauge', 'radio', false]]);
    expect(card().querySelector('fieldset legend').textContent).toBe('Choose a site');
    await choose('On the research platform');
    await click('Place equipment');
    expect(document.activeElement.textContent).toBe('Portable wind sensor placed');
    expect(text()).toContain('On the research platform. To think about: How might nearby structures affect what a sensor records?');
    await click('Move equipment');
    expect(heading()).toBe('Move the portable wind sensor');
    expect(text()).toContain('Now: on the research platform.');
    await choose('Near the tide gauge');
    await click('Keep it where it is'); // a proposed move is not applied until placed
    expect(text()).toContain('On the research platform. To think about');
    await click('Move equipment');
    await choose('Near the tide gauge');
    await click('Place equipment');
    expect(text()).toContain('Near the tide gauge. To think about');
  });

  it('keeps a visit for this learner and planet only: kept after orbit and re-landing, fresh for another planet or account', async () => {
    await show({ initialArrival: WIND });
    await click('Ready now'); await choose('Beside the weather mast'); await click('Place equipment');
    await click('Back to Thalassa orbit');
    expect(card()).toBeNull();
    await click('Land on Thalassa');
    expect(heading()).toBe('Portable wind sensor placed');

    await click('Back to Thalassa orbit');
    await click('Land on Ignis');
    expect(heading()).toBe('Welcome to Ignis'); // another planet starts fresh

    await show({ initialArrival: WIND, who: 'chen' }); // another learner in another organization
    await click('Back to Ignis orbit');
    await click('Land on Thalassa');
    expect(heading()).toBe('Welcome to Thalassa');
    expect(text()).not.toContain('Portable wind sensor placed');

    await show({ initialArrival: WIND, who: 'amira' }); // switching back does not restore discarded visits
    expect(heading()).toBe('Welcome to Thalassa');
  });

  it('a general landing offers only missions the trusted registry has for that planet', async () => {
    await show();
    await click('Land on Ignis');
    await click('Skip setup');
    expect([...card().querySelectorAll('.mx-arrival-choice strong')].map((s) => s.textContent)).toEqual(['Plan a journey to Ignis']);
    await click('Back to Ignis orbit');
    await click('Land on Thalassa');
    await click('Skip setup');
    expect([...card().querySelectorAll('.mx-arrival-choice strong')].map((s) => s.textContent).sort()).toEqual(['Is the wind worth it?', 'Plan a journey to Ignis']);

    // Production shape: no published release and no preview drafts, so nothing is offered or invented.
    await act(async () => root.unmount()); root = createRoot(host);
    await act(async () => root.render(<MyUniverseExplorer preview={false} forceTextView loadCatalog={loadCatalog} onClose={() => {}} />)); await settle();
    await click('Land on Thalassa');
    await click('Skip setup');
    expect(text()).toContain('No missions are open on Thalassa yet.');
    expect(named('Start mission')).toBeUndefined();
  });

  it('keeps initialMission as a direct technical bypass and never lands on a gated planet', async () => {
    await show({ initialMission: { id: 'thalassa-wind-survey', route: 'guided' }, initialArrival: WIND });
    expect(document.body.querySelector('.px-sheet')).toBeTruthy();
    expect(card()).toBeNull();

    await act(async () => root.unmount()); root = createRoot(host);
    await show({ initialArrival: { planetId: 'boreas', missionId: 'thalassa-wind-survey', routeId: 'guided' } });
    expect(card()).toBeNull();
    expect(named('Land on Boreas')).toBeUndefined();
    expect(text()).toContain('This expedition is not open yet.');
  });

  it('accepts only an expedition mission and route the registry places on that planet', () => {
    const opts = { preview: true, serverAccess: null, pilotRegistry: FIXTURE_RELEASES };
    expect(resolveExpedition(MASS_POWER, FIXTURE_RELEASES, opts).choice).toEqual({ id: 'spacecraft-journey', title: 'Plan a journey to Ignis', routeId: 'advanced', routeName: 'Mass and power tradeoffs' });
    expect(resolveExpedition({ ...WIND, planetId: 'ignis' }, FIXTURE_RELEASES, opts)).toBeNull(); // wind is not an Ignis mission
    expect(resolveExpedition({ ...WIND, routeId: 'invented' }, FIXTURE_RELEASES, opts)).toBeNull();
    expect(resolveExpedition({ planetId: 'thalassa', missionId: 'invented' }, FIXTURE_RELEASES, opts)).toBeNull();
    expect(arrivalChoices('boreas', null, opts)).toEqual([]);
    expect(arrivalNav({ planetId: 'thalassa' }, cosmos, opts).path.at(-1)).toEqual({ level: 'environment', id: 'thalassa-station' });
    expect(arrivalNav({ planetId: 'boreas' }, cosmos, opts).path.at(-1)).toEqual({ level: 'planet', id: 'boreas' });
    expect(arrivalNav({ planetId: 'nowhere' }, cosmos, opts).path).toEqual([{ level: 'universe' }]);
    expect(arrivesOn(arrivalNav(WIND, cosmos, opts), cosmos)).toBe(true);
    expect(arrivesOn(arrivalNav({ planetId: 'boreas' }, cosmos, opts), cosmos)).toBe(false);
  });

  it('holds the 45-second change while focus is on a card control, then changes without taking focus (lead C)', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    await show({ initialArrival: WIND });
    const ready = named('Ready now');
    await act(async () => ready.focus());
    // The window losing focus (another app or tab) blurs the control but keeps it as the document's focus.
    await act(async () => { ready.dispatchEvent(new FocusEvent('blur')); ready.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); });
    await act(async () => vi.advanceTimersByTime(ARRIVAL_EXPLORATION_MS + 10_000));
    expect(heading()).toBe('Welcome to Thalassa'); // the focused control is not replaced under the learner
    expect(document.activeElement).toBe(ready);
    expect(ready.isConnected).toBe(true);

    const place = named('Weather mast'); // focus moves on, out of the card
    await act(async () => place.focus());
    await act(async () => vi.advanceTimersByTime(2_000));
    expect(heading()).toBe('Place a portable wind sensor');
    expect(document.activeElement).toBe(place);
  });
});

describe('planet arrival in the 3D view', () => {
  let getContext;
  beforeEach(() => {
    getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind) { return kind === 'webgl2' ? {} : null; }; // the scene itself stays mocked
  });
  afterEach(() => { HTMLCanvasElement.prototype.getContext = getContext; });
  const loadEnvironment = async () => ({ default: () => null });
  const show3d = async (props) => { await act(async () => root.render(explorer({ forceTextView: false, loadEnvironment, ...props }))); await settle(); };
  const dock = () => document.body.querySelector('.mx-panel-dock');

  it('arrives with the details dock collapsed, and choosing a site in the card keeps it collapsed (lead A)', async () => {
    await show3d({ initialArrival: WIND });
    expect(dock().classList.contains('is-collapsed')).toBe(true);
    expect(document.body.querySelector('#mx-panel').hidden).toBe(true);
    expect(heading()).toBe('Welcome to Thalassa');
    expect(card().querySelectorAll('p').length).toBe(2); // a short opening: the prompt and the live region
    await click('Ready now');
    await choose('Beside the weather mast');
    expect(dock().classList.contains('is-collapsed')).toBe(true);
    await click('Show details'); // still one press away
    expect(document.body.querySelector('#mx-panel').hidden).toBe(false);
    expect(document.body.querySelector('#mx-panel-title').textContent).toBe('Thalassa Research Station');
  });

  it('keeps keys pressed in the card away from the explorer shortcuts (lead B)', async () => {
    await show3d({ initialArrival: WIND });
    const key = (el, k) => act(async () => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })));
    for (const k of ['Escape', 'l', 'ArrowLeft', 'r', 'd']) await key(named('Ready now'), k);
    expect(dock()).toBeTruthy(); // still 3D: L did not switch views
    expect(dock().classList.contains('is-collapsed')).toBe(true); // D did not toggle the dock
    expect(document.body.querySelector('[aria-current="location"]').textContent).toBe('Thalassa Research Station'); // Escape did not leave
    await key(document.body.querySelector('.mx-root'), 'l'); // the same key outside the card still works
    expect(dock()).toBeNull();
  });
});

describe('how-this-mission-works clip on arrival (O05)', () => {
  const CLIP = 'https://res.cloudinary.com/dkplz6vbx/video/upload/v1/universe/thalassa-wind-how-it-works.mp4';
  const withClip = (src) => ({ 'thalassa-wind-survey|guided': { title: 'How this mission works', duration: '1:13', summary: 'Reading the wind table.', src, cues: [[0.6, 1.8, 'Welcome to Thalassa.']] } });

  it('offers the clip first, plays it only on request with captions, and leaves the arrival as it was', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    await show({ initialArrival: WIND, arrivalVideos: withClip(CLIP) });
    expect(heading()).toBe('Welcome to Thalassa');
    expect(named('Watch the video · 1:13')).toBeTruthy();
    expect(card().querySelector('img').getAttribute('src')).toBe('https://res.cloudinary.com/dkplz6vbx/video/upload/so_15,w_1280/v1/universe/thalassa-wind-how-it-works.jpg');
    expect(document.body.querySelector('video')).toBeNull(); // nothing plays by itself
    expect(card().querySelector('details summary').textContent).toBe('Read it instead');

    await click('Watch the video · 1:13');
    const video = document.body.querySelector('video.mx-arrival-video');
    expect(video.getAttribute('src')).toBe(CLIP);
    expect(video.controls).toBe(true);
    expect(document.activeElement.textContent).toBe('How this mission works');
    expect(vi.getTimerCount()).toBe(0); // watching is not exploring time
    await act(async () => vi.advanceTimersByTime(120_000));
    await act(async () => video.dispatchEvent(new Event('ended')));
    expect(document.body.querySelector('video')).toBeNull();
    expect(heading()).toBe('Welcome to Thalassa'); // still exploring: the 45 s did not pass while watching
    expect(document.activeElement.textContent).toBe('Welcome to Thalassa');
    expect(vi.getTimerCount()).toBe(1);
    expect(named('Watch how this mission works (1:13)')).toBeTruthy(); // available again
  });

  it('the shipped registry offers the uploaded Cloudinary clip for the wind expedition', async () => {
    const { ARRIVAL_VIDEOS } = await import('../src/features/universe/explore/arrivalVideos.js');
    await show({ initialArrival: WIND, arrivalVideos: ARRIVAL_VIDEOS });
    expect(named('Watch the video · 1:13')).toBeTruthy();
    await click('Watch the video · 1:13');
    expect(document.body.querySelector('video').getAttribute('src')).toMatch(/^https:\/\/res\.cloudinary\.com\/dkplz6vbx\/video\/upload\/v\d+\/[\w-]+\.mp4$/);
    await act(async () => root.unmount()); root = createRoot(host);
    await show({ initialArrival: MASS_POWER, arrivalVideos: ARRIVAL_VIDEOS }); // no clip for this route yet
    expect(named('Skip video')).toBeUndefined();
    expect(named('Ready now')).toBeTruthy();
  });

  it('can be skipped with no effect on setup or the mission', async () => {
    await show({ initialArrival: WIND, arrivalVideos: withClip(CLIP) });
    await click('Skip video');
    expect(heading()).toBe('Welcome to Thalassa');
    await click('Skip setup');
    expect(named('Watch how this mission works (1:13)')).toBeTruthy();
    await click('Start mission');
    expect(text()).toContain('Mission · Wind energy estimate');
  });

  it('shows no player without an uploaded Cloudinary link, for other hosts, or when several missions are offered', async () => {
    await show({ initialArrival: WIND, arrivalVideos: withClip(null) }); // not uploaded yet
    expect(named('Skip video')).toBeUndefined();
    await act(async () => root.unmount()); root = createRoot(host);
    await show({ initialArrival: WIND, arrivalVideos: withClip('https://example.com/video/upload/x.mp4') });
    expect(named('Skip video')).toBeUndefined();
    await act(async () => root.unmount()); root = createRoot(host);
    await show({ arrivalVideos: withClip(CLIP) });
    await click('Land on Thalassa'); // general landing: two missions, so no single how-to clip
    expect(named('Skip video')).toBeUndefined();
  });
});
