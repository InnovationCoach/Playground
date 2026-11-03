import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ARRIVAL_EXPLORATION_MS, PLANET_ARRIVAL_DESIGNS, getPlanetArrivalDesign, createArrivalState, advanceArrival, reduceArrival } from '../planetArrival.js';

const active = { active: true, visible: true, ready: true };
const thalassa = getPlanetArrivalDesign('thalassa');
const act = (state, type, extra = {}) => reduceArrival(state, { type, ...extra }, thalassa);

test('the invitation arrives after 45 seconds of eligible time, with no mission opening or grant', () => {
  let state = advanceArrival(createArrivalState(), 44_999, active);
  assert.equal(state.phase, 'exploring');
  state = advanceArrival(state, 1, active);
  assert.equal(state.phase, 'placing');
  assert.equal(state.elapsedMs, ARRIVAL_EXPLORATION_MS);
  assert.equal(state.placedSiteId, null);
  assert.equal('missionId' in state, false);
  assert.equal('grantIds' in state, false);
});

test('hidden, inactive, loading, and mission time do not count; invalid durations cannot progress time', () => {
  const state = createArrivalState();
  for (const flags of [{ ...active, visible: false }, { ...active, active: false }, { ...active, ready: false }, { ...active, missionOpen: true }, {}]) {
    assert.equal(advanceArrival(state, 90_000, flags), state);
  }
  for (const delta of [-1, 0, NaN, Infinity, '45000']) assert.equal(advanceArrival(state, delta, active), state);
});

test('Ready now and Skip setup are equally valid alternatives to waiting or placing', () => {
  assert.equal(act(createArrivalState(), 'ready-now').phase, 'placing');
  const skipped = act(createArrivalState(), 'skip-setup');
  assert.equal(skipped.phase, 'ready');
  assert.equal(skipped.skipped, true);
  assert.equal(skipped.placedSiteId, null);
});

test('Keep exploring does not trigger another timed interruption', () => {
  const state = act(act(createArrivalState(), 'ready-now'), 'keep-exploring');
  assert.equal(advanceArrival(state, 1_000_000, active), state);
  assert.equal(act(state, 'ready-now').phase, 'placing');
});

test('only an authored site may be placed, and a proposed move keeps the previous placement until confirmed', () => {
  let state = act(createArrivalState(), 'ready-now');
  assert.equal(act(state, 'place'), state);
  assert.equal(act(state, 'select-site', { siteId: 'unreviewed-site' }), state);
  state = act(state, 'select-site', { siteId: 'mast-base' });
  state = act(state, 'place');
  assert.equal(state.placedSiteId, 'mast-base');
  state = act(state, 'move');
  state = act(state, 'select-site', { siteId: 'platform-deck' });
  assert.equal(state.placedSiteId, 'mast-base');
  state = act(state, 'place');
  assert.equal(state.placedSiteId, 'platform-deck');
  assert.equal(state.phase, 'ready');
  assert.equal(state.skipped, false);
});

test('exploring after setup keeps the placement, and Ready now returns to the mission offer', () => {
  let state = act(act(createArrivalState(), 'ready-now'), 'select-site', { siteId: 'mast-base' });
  state = act(act(state, 'place'), 'keep-exploring');
  assert.equal(state.placedSiteId, 'mast-base');
  assert.equal(act(state, 'ready-now').phase, 'ready');
  const movedThenSkipped = act(act(act(state, 'ready-now'), 'move'), 'skip-setup');
  assert.equal(movedThenSkipped.placedSiteId, 'mast-base');
  assert.equal(movedThenSkipped.skipped, false);
});

test('a fresh visit has no placement; supported equipment sites belong to the actual catalog environment', () => {
  assert.equal(createArrivalState().placedSiteId, null);
  assert.equal(getPlanetArrivalDesign('boreas'), null);
  const catalog = JSON.parse(readFileSync(new URL('../../../public/cosmos/v1/catalog.json', import.meta.url)));
  for (const design of PLANET_ARRIVAL_DESIGNS) {
    const environment = catalog.environments.find(e => e.id === design.environmentId && e.planetId === design.planetId);
    assert.ok(environment);
    assert.equal(new Set(design.sites.map(s => s.id)).size, 3);
    for (const site of design.sites) {
      assert.ok(environment.locations.some(l => l.id === site.locationId));
      assert.ok(site.offset.length === 3 && site.offset.every(Number.isFinite));
      assert.ok(Object.isFrozen(site));
    }
    assert.match(design.placementNote, /no readings/);
  }
});
