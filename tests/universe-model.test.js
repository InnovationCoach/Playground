import { describe, expect, it } from 'vitest';
import { MAX_OBJECTS, starterWorld, hydrateWorld, historyState, universeReducer, updateWorld, gravityPose } from '../src/features/universe/universeModel.js';
describe('Universe prototype state', () => {
  it('has a bounded starter world with a creature and no earned entitlements', () => {
    const w = starterWorld(); expect(hydrateWorld(w)).toEqual(w); expect(w.sampleReward).toBe(null); expect(w.creature.name).toBe('Miso');
  });
  it('places and bounds objects; undo/redo restores exact world states', () => {
    const initial = historyState(starterWorld());
    const placed = universeReducer(initial, { type: 'add', asset: 'tree', id: 'new-tree' });
    const moved = universeReducer(placed, { type: 'move', id: 'new-tree', x: 100000, y: -9999 });
    expect(moved.world.objects.at(-1)).toMatchObject({ x: 890, y: 210 });
    expect(universeReducer(moved, { type: 'undo' }).world).toEqual(placed.world);
    expect(universeReducer(universeReducer(moved, { type: 'undo' }), { type: 'redo' }).world).toEqual(moved.world);
    expect(initial.world.objects).toHaveLength(5);
  });
  it('rejects unsupported assets, duplicate IDs, invalid saves and unowned sample objects', () => {
    const w = starterWorld();
    expect(updateWorld(w, { type: 'add', asset: 'remote-script', id: 'bad' })).toEqual(w);
    expect(updateWorld(w, { type: 'add', asset: 'tree', id: w.objects[0].id })).toEqual(w);
    expect(updateWorld(w, { type: 'add', asset: 'moon', id: 'moon' })).toEqual(w);
    expect(hydrateWorld({ ...w, version: 99 })).toBe(null);
    expect(hydrateWorld({ ...w, objects: [w.objects[0], w.objects[0]] })).toBe(null);
    expect(hydrateWorld({ ...w, objects: Array(MAX_OBJECTS + 1).fill(w.objects[0]) })).toBe(null);
  });
  it('grants only one explicitly sample choice, then permits that asset', () => {
    const w = updateWorld(starterWorld(), { type: 'reward', reward: 'waterfall' });
    expect(updateWorld(w, { type: 'reward', reward: 'moon' }).sampleReward).toBe('waterfall');
    expect(updateWorld(w, { type: 'add', asset: 'waterfall', id: 'waterfall' }).objects.at(-1).asset).toBe('waterfall');
    expect(updateWorld(w, { type: 'add', asset: 'moon', id: 'moon' })).toEqual(w);
    expect(w).not.toHaveProperty('xp'); expect(w).not.toHaveProperty('mastery');
  });
  it('normalizes creature parts and cannot forge a locked accessory through imported state', () => {
    const w = hydrateWorld({ ...starterWorld(), creature: { body: 'unknown', palette: 'unknown', trait: 'unknown', accessory: 'star-hat', name: '<a> Miso', x: Infinity, y: -50 } });
    expect(w.creature).toMatchObject({ body: 'mushroom', palette: 'purple', trait: 'curious', accessory: 'boots', x: 500, y: 210 });
    expect(w.creature.name).toBe('<a> Miso');
  });
  it('preserves scene edits when gravity changes and makes low gravity visibly different', () => {
    expect(gravityPose(.5, 'low').height).toBeGreaterThan(gravityPose(.5, 'normal').height);
    expect(gravityPose(1, 'zero').rotation).not.toBe(0);
    expect(gravityPose(0, 'normal')).toMatchObject({ height: 0, rotation: 0 });
  });
  it('keeps history bounded and lets restore-starter be undone', () => {
    let s = historyState(starterWorld());
    for (let i = 0; i < 60; i++) s = universeReducer(s, { type: 'name', name: `World ${i}` });
    expect(s.past).toHaveLength(40);
    const reset = universeReducer(s, { type: 'reset' });
    expect(universeReducer(reset, { type: 'undo' }).world.name).toBe('World 59');
  });
});
