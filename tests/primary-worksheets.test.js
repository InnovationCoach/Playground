/**
 * Printable hands-on material for Junior Explorers: every activity has a
 * complete teacher guide, and the worksheet is built from the same content the
 * app runs.
 */
import { describe, it, expect } from 'vitest';
import { JUNIOR_ACTIVITIES } from '../src/features/primary/activities/index.js';
import { HANDS_ON_GUIDES } from '../src/features/primary/activities/handsOnGuides.js';
import {
  kitList, safetyList, glossary, tableFields, drawFields, cellSpec, investigationTag, runOrderWithTimes
} from '../src/features/primary/print/sheetModel.js';
import { parseRoute } from '../src/app/routes.js';

describe('every activity has a complete hands-on guide', () => {
  it('one guide per activity, no strays', () => {
    expect(Object.keys(HANDS_ON_GUIDES).sort()).toEqual(JUNIOR_ACTIVITIES.map((a) => a.id).sort());
  });
  for (const a of JUNIOR_ACTIVITIES) {
    const g = HANDS_ON_GUIDES[a.id];
    it(a.id, () => {
      expect(g.bigQuestion).toMatch(/\?$/);
      expect(g.time).toBeTruthy();
      expect(g.groups).toBeTruthy();
      expect(g.goals).toHaveLength(3);
      for (const goal of g.goals) expect(goal).toMatch(/^I can .+\.$/);
      expect(Object.keys(g.steam)).toEqual(['S', 'T', 'E', 'A', 'M']);
      for (const v of Object.values(g.steam)) expect(v.length).toBeGreaterThan(10);
      expect(g.prep.length).toBeGreaterThanOrEqual(3);
      expect(g.runOrder.length).toBeGreaterThanOrEqual(4);
      expect(g.discussion.length).toBeGreaterThanOrEqual(3);
      expect(g.art.title && g.art.prompt).toBeTruthy();
      expect(g.maths.starter && g.maths.explorer).toBeTruthy();
      expect(g.lookFors.starter && g.lookFors.explorer).toBeTruthy();
      expect(g.realWorld && g.extension).toBeTruthy();
    });
    it(`${a.id}: lesson fits in 90 minutes`, () => {
      const total = g.runOrder.reduce((n, r) => n + r.min, 0);
      expect(total).toBeGreaterThanOrEqual(40);
      expect(total).toBeLessThanOrEqual(90);
    });
  }
});

describe('worksheet parts come from the activity content', () => {
  const floating = JUNIOR_ACTIVITIES.find((a) => a.id === 'floating-house');
  const hot = JUNIOR_ACTIVITIES.find((a) => a.id === 'hot-spots');

  it('kit and safety are listed once each', () => {
    const kit = kitList(floating).map((k) => k.label.toLowerCase());
    expect(new Set(kit).size).toBe(kit.length);
    expect(kit).toContain('the tub of water');
    expect(kit.some((k) => k.startsWith('your '))).toBe(false);
    const safety = safetyList(floating);
    expect(safety.filter((s) => s === 'Keep the water tub on the floor.')).toHaveLength(1);
    expect(glossary(floating).map((w) => w.word)).toContain('Buoyancy');
  });

  it('explorer-only fields appear only on the Explorer sheet', () => {
    const build = floating.investigations[0];
    expect(tableFields(build, 'starter').map((f) => f.id)).not.toContain('bricks');
    expect(tableFields(build, 'explorer').map((f) => f.id)).toContain('bricks');
    expect(drawFields(build, 'starter').map((f) => f.id)).toEqual(['drawing']);
  });

  it('counts become three tries for Explorers; readings get a box with the unit', () => {
    const coins = floating.investigations[1].fields.find((f) => f.id === 'coins');
    expect(cellSpec(coins, 'starter')).toEqual({ type: 'box', unit: 'coins' });
    expect(cellSpec(coins, 'explorer')).toEqual({ type: 'trials', unit: 'coins' });
    const temp = hot.investigations[1].fields.find((f) => f.id === 'temp');
    expect(cellSpec(temp, 'starter')).toEqual({ type: 'box', unit: '°C' });
    const stopwatch = JUNIOR_ACTIVITIES.find((a) => a.id === 'sun-power').investigations[2].fields.find((f) => f.kind === 'stopwatch');
    expect(cellSpec(stopwatch, 'explorer').unit).toBe('seconds');
  });

  it('picture answers become options to circle, including Plant Lab kinds', () => {
    const plant = JUNIOR_ACTIVITIES.find((a) => a.id === 'plant-lab');
    for (const inv of plant.investigations) {
      for (const f of tableFields(inv, 'explorer')) {
        const spec = cellSpec(f, 'explorer');
        if (spec.type === 'circle') expect(spec.options.length).toBeGreaterThan(1);
      }
    }
    const lens = plant.investigations[0].fields.find((f) => f.kind === 'lens');
    expect(cellSpec(lens, 'starter').options.map((o) => o.label)).toEqual(['4×', '10×', '40×']);
  });

  it('labels the build first, then numbered tests', () => {
    expect(floating.investigations.map((i) => investigationTag(floating, i)))
      .toEqual(['Start here: build', 'Test 1', 'Test 2', 'Test 3']);
  });

  it('running order gets clock times', () => {
    expect(runOrderWithTimes([{ min: 10, what: 'a' }, { min: 15, what: 'b' }]))
      .toEqual([{ min: 10, what: 'a', from: 0, to: 10 }, { min: 15, what: 'b', from: 10, to: 25 }]);
  });
});

describe('routes', () => {
  it('parses the printable routes', () => {
    expect(parseRoute('#/primary-resources')).toEqual({ screen: 'resources' });
    expect(parseRoute('#/worksheet/hot-spots')).toEqual({ screen: 'worksheet', activityId: 'hot-spots' });
    expect(parseRoute('#/guide/acid-rain')).toEqual({ screen: 'guide', activityId: 'acid-rain' });
    expect(parseRoute('#/worksheet')).toBeNull();
  });
});
