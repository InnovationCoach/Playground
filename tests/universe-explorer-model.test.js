import { describe, expect, it } from 'vitest';
import {
  initialNav, reduce, current, childrenOf, breadcrumbs, describeView, planetAccess, canLand, pathTo, transitionBetween, framedSelection
} from '../src/features/universe/explore/explorerModel.js';
import { PLANETS, GALAXIES, ENVIRONMENTS, planetById } from '../src/features/universe/explore/cosmosFixture.js';

const preview = { preview: true }, live = { preview: false };
const walk = (...steps) => steps.reduce((nav, a) => reduce(nav, a), initialNav());
const toThalassa = [{ type: 'open', id: 'lyra-spiral' }, { type: 'open', id: 'lyra-prime' }, { type: 'open', id: 'thalassa' }];

describe('My Universe explorer model', () => {
  it('goes Universe → Galaxy → System → Planet → Surface and back again', () => {
    let nav = walk(...toThalassa);
    expect(nav.path.map((p) => p.level)).toEqual(['universe', 'galaxy', 'system', 'planet']);
    nav = reduce(nav, { type: 'open', opts: preview });
    expect(current(nav)).toEqual({ level: 'environment', id: 'thalassa-station' });
    expect(breadcrumbs(nav).map((c) => c.label)).toEqual(['My Universe', 'Lyra Spiral', 'Lyra Prime', 'Thalassa', 'Thalassa Research Station']);
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
    const ignis = planetById('ignis');
    let nav = walk({ type: 'open', id: 'lyra-spiral' }, { type: 'open', id: 'lyra-prime' }, { type: 'select', id: 'ignis' }, { type: 'open', id: 'ignis' });
    expect(current(nav)).toEqual({ level: 'planet', id: 'ignis' });
    for (const opts of [preview, live]) {
      expect(canLand(ignis, opts)).toBe(false);
      expect(reduce(nav, { type: 'open', opts })).toBe(nav);
    }
    nav = walk({ type: 'open', id: 'lyra-spiral' }, { type: 'open', id: 'lyra-prime' }, { type: 'open', id: 'boreas' });
    expect(reduce(nav, { type: 'open', opts: preview })).toBe(nav); // no landing site charted
  });

  it('labels fixture access as preview, and shows "not connected" outside previews', () => {
    const ignis = planetById('ignis'), thalassa = planetById('thalassa'), boreas = planetById('boreas');
    expect(planetAccess(ignis, preview)).toEqual({ status: 'locked', requirementText: ignis.requirementText, preview: true });
    expect(planetAccess(ignis, live)).toEqual({ status: 'not-connected', preview: false });
    expect(planetAccess(thalassa, live).status).toBe('available');
    expect(planetAccess(boreas, preview).status).toBe('charted');
    expect(ignis.requirementText).toMatch(/^Sample requirement/);
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
    expect(pathTo('environment', 'thalassa-station').map((p) => p.level)).toEqual(['universe', 'galaxy', 'system', 'planet', 'environment']);
    expect(pathTo('planet', 'missing')).toBeNull();
    const nav = reduce(initialNav(), { type: 'jump', path: pathTo('system', 'lyra-prime') });
    expect(describeView(nav, preview)).toMatch(/Thalassa \(Available\).*Ignis \(Locked\).*Not to scale/);
    expect(describeView(initialNav(), preview)).toMatch(/2 galaxies charted/);
    expect(childrenOf({ level: 'galaxy', id: 'aurora-elliptical' })).toEqual([]);
  });

  it('keeps the fixture consistent and fictional', () => {
    const ids = [...GALAXIES, ...PLANETS, ...ENVIRONMENTS].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PLANETS) if (p.environmentId) expect(ENVIRONMENTS.some((e) => e.id === p.environmentId && e.planetId === p.id)).toBe(true);
    for (const loc of ENVIRONMENTS[0].locations) for (const o of loc.observations) expect(o).toMatch(/fictional world value|illustrative|modules|Six/);
  });
});
