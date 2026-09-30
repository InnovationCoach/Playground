/**
 * Checks for the Project Hex-Grid floating-city model.
 *
 * These check what a science teacher would catch: Archimedes is applied
 * correctly, animals really compete with people for crops, a turbine with no
 * data makes no power, every DATA constant has a source, and a hypothesis is
 * judged on what actually moved.
 */
import { describe, it, expect } from 'vitest';
import {
  K, simulate, starterCity, normaliseCity, hexArea, gridCells, hexDistance,
  evaluateHypothesis, describeChanges, direction, METRICS, ROLES, MATERIALS
} from '../src/features/activities/hexGrid/hexGridModel.js';
import { SOURCES } from '../src/features/activities/hexGrid/hexGridSources.js';

const clone = (c) => JSON.parse(JSON.stringify(c));
const setHex = (city, q, r, patch) => {
  const c = clone(city);
  c.hexes = c.hexes.map((h) => (h.q === q && h.r === r ? { q, r, ...patch } : h));
  return c;
};
const setParam = (city, key, value) => ({ ...clone(city), params: { ...city.params, [key]: value } });

describe('geometry', () => {
  it('a radius-3 grid has 37 hexes', () => expect(gridCells().length).toBe(37));
  it('hex area is 3√3/2 × side²', () => expect(hexArea(10)).toBeCloseTo(259.81, 2));
  it('hex distance', () => expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: -3 })).toBe(3));
});

describe('every number is honest about where it came from', () => {
  it('each DATA constant names a real source', () => {
    for (const [key, c] of Object.entries(K)) {
      expect(['DATA', 'ESTIMATE'], key).toContain(c.tag);
      if (c.tag === 'DATA') expect(SOURCES[c.src], `${key} → ${c.src}`).toBeTruthy();
    }
  });
  it('every role metric exists', () => {
    for (const r of Object.values(ROLES)) for (const m of r.metrics) expect(METRICS[m], m).toBeTruthy();
  });
  it('every metric has workings', () => {
    const { workings } = simulate(starterCity());
    for (const m of Object.keys(METRICS)) expect(workings[m]?.length, m).toBeGreaterThan(0);
  });
});

describe('buoyancy (Archimedes)', () => {
  it('safe load = seawater displaced × (1 − reserve) − shell mass', () => {
    const city = starterCity();
    const p = city.params;
    const A = hexArea(p.hexSide);
    const mat = MATERIALS[p.material];
    const expected = A * p.pontoonDepth * 1025 * (1 - p.reserve) - 2 * mat.shellM * mat.density * A;
    expect(simulate(city).safeKg).toBeCloseTo(expected, 3);
  });

  it('a deeper pontoon carries more', () => {
    const shallow = simulate(setParam(starterCity(), 'pontoonDepth', 1.5)).metrics.maxLoad;
    const deep = simulate(setParam(starterCity(), 'pontoonDepth', 3)).metrics.maxLoad;
    expect(deep).toBeLessThan(shallow);
  });

  it('heavy concrete sinks the starter housing that light plastic floats', () => {
    expect(simulate(starterCity()).metrics.overloaded).toBe(0);
    expect(simulate(setParam(starterCity(), 'material', 'concrete')).metrics.overloaded).toBeGreaterThan(0);
  });

  it('fish tanks weigh more than chicken sheds', () => {
    const chickens = simulate(setHex(starterCity(), 3, -3, { type: 'livestock', animal: 'broiler' }));
    const fish = simulate(setHex(starterCity(), 3, -3, { type: 'livestock', animal: 'tilapia' }));
    const load = (r) => r.hexes.find((h) => h.q === 3 && h.r === -3).loadKg;
    expect(load(fish)).toBeGreaterThan(load(chickens));
  });
});

describe('food and feed compete', () => {
  it('animals eat crops people would have eaten', () => {
    const base = starterCity();
    base.hexes = base.hexes.map((h) => (h.type === 'livestock' ? { q: h.q, r: h.r, type: 'open' } : h));
    const withChickens = setHex(base, 3, -3, { type: 'livestock', animal: 'broiler' });
    const a = simulate(base).metrics;
    const b = simulate(withChickens).metrics;
    expect(b.feedMet).toBeLessThan(100);
    // The soy and rice go to the birds first, so plant calories for people fall.
    const plantKcal = (r) => r.foods.filter((f) => f.group !== 'animal').reduce((s, f) => s + f.kg * 10 * f.kcal, 0);
    expect(plantKcal(simulate(withChickens))).toBeLessThan(plantKcal(simulate(base)));
    expect(a.feedMet).toBe(100); // no animals, nothing to feed
  });

  it('shipped-in feed spares the city\'s own crops', () => {
    const hungry = simulate(starterCity());
    const fed = simulate(setParam(starterCity(), 'importFeedKgDay', 5000));
    expect(fed.metrics.feedMet).toBe(100);
    expect(fed.metrics.animalProteinKgDay).toBeGreaterThan(hungry.metrics.animalProteinKgDay);
  });

  it('chili and basil alone are flagged, not counted as calories', () => {
    const city = starterCity();
    city.hexes = city.hexes.map((h) => (h.type === 'farm' ? { ...h, crop: 'herbs' } : h));
    const r = simulate(city);
    expect(r.flags.some((f) => /chili and basil/i.test(f.text))).toBe(true);
  });

  it('more people need more food', () => {
    const small = simulate(setParam(starterCity(), 'population', 200)).metrics.kcalCoverage;
    const big = simulate(setParam(starterCity(), 'population', 800)).metrics.kcalCoverage;
    expect(big).toBeLessThan(small);
  });
});

describe('energy', () => {
  it('hydroponics costs 25 kWh per kg of lettuce (Barbosa 2015)', () => {
    const r = simulate(starterCity());
    const lettuce = r.foods.find((f) => f.name === 'Lettuce').kg;
    expect(r.demand.hydroponics).toBeCloseTo(lettuce * 25, 6);
  });

  it('a wind turbine with no capacity factor makes nothing, and says so', () => {
    const r = simulate(setHex(starterCity(), -3, 0, { type: 'wind' }));
    expect(r.supply.wind).toBe(0);
    expect(r.flags.some((f) => /capacity factor/.test(f.text))).toBe(true);
  });

  it('batteries cannot store more than the daytime surplus', () => {
    const city = starterCity();
    const noSolar = clone(city);
    noSolar.hexes = noSolar.hexes.map((h) => (h.type === 'solar' ? { q: h.q, r: h.r, type: 'battery' } : h));
    const r = simulate(noSolar);
    // Only biogas runs at night; batteries have nothing to charge from.
    expect(r.metrics.nightCoverage).toBeLessThan(5);
  });
});

describe('hypothesis testing', () => {
  it('adding solar supports "energy coverage will increase"', () => {
    const base = starterCity();
    const test = setHex(base, -3, 0, { type: 'solar' });
    const res = evaluateHypothesis(base, test, { metric: 'energyCoverage', expect: 'increase', role: 'energy' });
    expect(res.verdict).toBe('supported');
    expect(res.changes).toEqual(['Hex -3,0: Open deck → Solar farm']);
  });

  it('a wrong prediction is "not supported", and teammates see ripples', () => {
    const base = starterCity();
    const test = setHex(base, -3, 0, { type: 'hydro' });
    const res = evaluateHypothesis(base, test, { metric: 'energyCoverage', expect: 'increase', role: 'agriculture' });
    expect(res.verdict).toBe('not-supported');
    expect(res.ripples.map((r) => r.roleId)).toContain('energy');
  });

  it('tiny changes count as "same"', () => {
    expect(direction(100, 101)).toBe('same');
    expect(direction(100, 110)).toBe('increase');
    expect(direction(0, 0)).toBe('same');
  });

  it('describeChanges reports parameter edits', () => {
    expect(describeChanges(starterCity(), setParam(starterCity(), 'hexSide', 30))).toEqual(['Hex side length: 25 m → 30 m']);
  });

  it('a damaged save still opens', () => {
    const c = normaliseCity({ params: { population: 'lots' }, hexes: [{ q: 0, r: 0, type: 'spaceport' }] });
    expect(c.hexes).toHaveLength(37);
    expect(c.hexes.find((h) => h.q === 0 && h.r === 0).type).toBe('open');
    expect(() => simulate(c)).not.toThrow();
  });
});

describe('how-to-play idea starters', async () => {
  const { IDEAS, WORKED_EXAMPLE } = await import('../src/features/activities/hexGrid/hexGridGuide.js');

  it('every role has ideas, each watching a real number', () => {
    for (const role of Object.keys(ROLES)) {
      expect(IDEAS[role]?.length, role).toBeGreaterThan(0);
      for (const idea of IDEAS[role]) expect(METRICS[idea.metric], idea.change).toBeTruthy();
    }
  });

  it('each idea really moves its number in the starter city - unless it is a deliberate surprise', () => {
    for (const [role, list] of Object.entries(IDEAS)) {
      for (const idea of list) {
        const res = evaluateHypothesis(starterCity(), idea.apply(starterCity()), { metric: idea.metric, expect: 'increase', role });
        expect(res.changes.length, idea.change).toBeGreaterThan(0);
        if (idea.surprise) expect(res.target.dir, idea.change).toBe('same');
        else expect(res.target.dir, idea.change).not.toBe('same');
      }
    }
  });

  it('the worked example is supported, as the guide text says', () => {
    const res = evaluateHypothesis(starterCity(), WORKED_EXAMPLE.idea.apply(starterCity()), {
      metric: WORKED_EXAMPLE.idea.metric, expect: WORKED_EXAMPLE.prediction, role: WORKED_EXAMPLE.role
    });
    expect(res.verdict).toBe('supported');
  });
});
