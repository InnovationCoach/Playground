import { describe, expect, it } from 'vitest';
import {
  initialNav, reduce as rawReduce, current, childrenOf, breadcrumbs, describeView, planetAccess, canLand, pathTo, transitionBetween, framedSelection, validPrefix,
  PENDING_POLICY_TEXT
} from '../src/features/universe/explore/explorerModel.js';
import { buildCosmos } from '../src/features/universe/explore/cosmosCatalog.js';
import catalog from '../public/cosmos/v1/catalog.json';

// The published catalog is the only content source; tests read the same file the app serves.
const cosmos = buildCosmos(catalog);
const { planetById } = cosmos, PLANETS = cosmos.planets, GALAXIES = cosmos.galaxies, ENVIRONMENTS = cosmos.environments;
const reduce = (nav, action) => rawReduce(nav, { cosmos, ...action });

const preview = { preview: true }, live = { preview: false };
const walk = (...steps) => steps.reduce((nav, a) => reduce(nav, a), initialNav());
const toThalassa = [{ type: 'open', id: 'lyra-spiral' }, { type: 'open', id: 'lyra-prime' }, { type: 'open', id: 'thalassa' }];

describe('My Universe explorer model', () => {
  it('goes Universe → Galaxy → System → Planet → Surface and back again', () => {
    let nav = walk(...toThalassa);
    expect(nav.path.map((p) => p.level)).toEqual(['universe', 'galaxy', 'system', 'planet']);
    nav = reduce(nav, { type: 'open', opts: preview });
    expect(current(nav)).toEqual({ level: 'environment', id: 'thalassa-station' });
    expect(breadcrumbs(nav, cosmos).map((c) => c.label)).toEqual(['My Universe', 'Lyra Spiral', 'Lyra Prime', 'Thalassa', 'Thalassa Research Station']);
    nav = reduce(nav, { type: 'back' });
    expect(current(nav).level).toBe('planet');
    expect(nav.selected).toBe('thalassa-station');
    nav = reduce(nav, { type: 'goto', depth: 1 });
    expect(current(nav)).toEqual({ level: 'galaxy', id: 'lyra-spiral' });
    expect(nav.selected).toBe('lyra-prime'); // the system you came from stays focused
    expect(reduce(nav, { type: 'home' })).toEqual(initialNav());
  });

  it('ignores destinations that are not children of the current view', () => {
    const nav = initialNav();
    expect(reduce(nav, { type: 'open', id: 'thalassa' })).toBe(nav);
    expect(reduce(nav, { type: 'open', id: 'nope' })).toBe(nav);
    expect(reduce(nav, { type: 'back' })).toBe(nav);
    expect(reduce(nav, { type: 'jump', path: [{ level: 'galaxy', id: 'lyra-spiral' }] })).toBe(nav);
  });

  it('keeps discovery separate from permission: selecting never unlocks, gated planets never land', () => {
    const boreas = planetById('boreas');
    const nav = walk({ type: 'open', id: 'lyra-spiral' }, { type: 'open', id: 'lyra-prime' }, { type: 'select', id: 'boreas' }, { type: 'open', id: 'boreas' });
    expect(current(nav)).toEqual({ level: 'planet', id: 'boreas' });
    for (const opts of [preview, live]) {
      expect(canLand(boreas, opts)).toBe(false);
      expect(reduce(nav, { type: 'open', opts })).toBe(nav);
    }
  });

  it('lands on each charted surface: Thalassa (ocean) and Ignis (basalt)', () => {
    for (const [planet, env] of [['thalassa', 'thalassa-station'], ['ignis', 'ignis-fissure-field']]) {
      const at = walk({ type: 'open', id: 'lyra-spiral' }, { type: 'open', id: 'lyra-prime' }, { type: 'open', id: planet });
      expect(current(reduce(at, { type: 'open', opts: preview }))).toEqual({ level: 'environment', id: env });
    }
  });

  it('labels fixture access as preview, and shows "not connected" outside previews', () => {
    const boreas = planetById('boreas'), thalassa = planetById('thalassa'), ignis = planetById('ignis');
    // The catalog's sample requirement is never shown: the Boreas policy is undecided (neutral pending wording).
    expect(planetAccess(boreas, preview)).toEqual({ status: 'locked', requirementText: PENDING_POLICY_TEXT, preview: true });
    expect(planetAccess(boreas, live)).toEqual({ status: 'not-connected', preview: false });
    expect(planetAccess(thalassa, live).status).toBe('available');
    expect(planetAccess(ignis, preview).status).toBe('available');
    expect(boreas.requirementText).toMatch(/^Sample requirement/);
  });

  it('chooses camera moves: approach inward, retreat outward, keep the learner camera on simple selection', () => {
    const a = initialNav(), b = reduce(a, { type: 'open', id: 'lyra-spiral' });
    expect(transitionBetween(a, b)).toMatchObject({ kind: 'approach', duration: 1.6 });
    expect(transitionBetween(b, a)).toMatchObject({ kind: 'retreat' });
    expect(transitionBetween(a, reduce(a, { type: 'select', id: 'lyra-spiral' })).kind).toBe('none');
    const planet = walk(...toThalassa), surface = reduce(planet, { type: 'open', opts: preview });
    expect(transitionBetween(planet, surface)).toMatchObject({ kind: 'approach', duration: 2.4 });
    expect(transitionBetween(surface, reduce(surface, { type: 'select', id: 'platform' })).kind).toBe('refocus');
    expect(framedSelection(reduce(a, { type: 'select', id: 'lyra-spiral' }))).toBeNull();
  });

  it('builds direct paths for the text view and describes every view in plain language', () => {
    expect(pathTo('environment', 'thalassa-station', cosmos).map((p) => p.level)).toEqual(['universe', 'galaxy', 'system', 'planet', 'environment']);
    expect(pathTo('planet', 'missing', cosmos)).toBeNull();
    const nav = reduce(initialNav(), { type: 'jump', path: pathTo('system', 'lyra-prime', cosmos) });
    expect(describeView(nav, preview, cosmos)).toMatch(/Thalassa \(Available\).*Ignis \(Available\).*Boreas \(Locked\).*Not to scale/);
    expect(describeView(initialNav(), preview, cosmos)).toMatch(/2 galaxies charted/);
    expect(childrenOf({ level: 'galaxy', id: 'aurora-elliptical' }, cosmos)).toEqual([]);
    expect(validPrefix(pathTo('environment', 'thalassa-station', cosmos), cosmos)).toHaveLength(5);
    expect(validPrefix([{ level: 'universe' }, { level: 'galaxy', id: 'lyra-spiral' }, { level: 'system', id: 'gone' }], cosmos)).toHaveLength(2);
  });

  it('keeps the fixture consistent and fictional', () => {
    const ids = [...GALAXIES, ...PLANETS, ...ENVIRONMENTS].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PLANETS) if (p.environmentId) expect(ENVIRONMENTS.some((e) => e.id === p.environmentId && e.planetId === p.id)).toBe(true);
    for (const loc of ENVIRONMENTS[0].locations) for (const o of loc.observations) expect(o).toMatch(/fictional world value|illustrative|modules|Six/);
  });

  it('evaluates destination access authoritatively when serverAccess is provided', () => {
    const boreas = planetById('boreas');
    // 1. When server returns Boreas locked
    const lockedAccess = {
      boreas: { status: 'locked', isVerified: false, evaluatedRule: 'mission:spacecraft-journey' }
    };
    expect(planetAccess(boreas, { serverAccess: lockedAccess })).toEqual({
      status: 'locked',
      requirementText: PENDING_POLICY_TEXT,
      preview: false,
      isVerified: false
    });

    // 2. When coach approves mission and server returns Boreas available
    const approvedAccess = {
      boreas: { status: 'available', isVerified: true, evaluatedRule: 'mission:spacecraft-journey' }
    };
    expect(planetAccess(boreas, { serverAccess: approvedAccess })).toEqual({
      status: 'charted',
      preview: false,
      isVerified: true
    });
  });

  it('shows the requirement text the service enforces, never the catalog sample', () => {
    const boreas = planetById('boreas');
    const serverAccess = { boreas: { status: 'locked', isVerified: false, evaluatedRule: 'boreas-policy-unresolved', requirementKey: 'universe.boreas.policyPending', requirementText: 'Server wording for the enforced rule.' } };
    expect(planetAccess(boreas, { serverAccess }).requirementText).toBe('Server wording for the enforced rule.');
    expect(planetAccess(boreas, { serverAccess: { boreas: { status: 'unknown' } } })).toEqual({ status: 'not-connected', preview: false });
  });
});
