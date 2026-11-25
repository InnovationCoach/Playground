import { describe, expect, it } from 'vitest';
import {
  TILE_TYPES, WEATHER, COLS, ROWS,
  surfaceDay, computeHeat, computeBudget, unreachableBuildings, evaluateDesign,
  fairTest, hottestTiles, fillGrid, parseLayout, isValidGrid, stressBand, countrysideNight, explainTile,
  DEMOLITION_COST
} from '../src/features/activities/urbanHeat/urbanHeatModel.js';
import { SCENARIOS, scenarioById } from '../src/features/activities/urbanHeat/urbanHeatScenarios.js';
import { hydrate, emptyState } from '../src/features/activities/urbanHeat/useCityDesign.js';

const at = (code) => computeHeat(fillGrid(code), 'breeze').tiles[20];

describe('urban heat physics', () => {
  it('dark asphalt bakes near 60 °C while shaded, watered ground stays near air temperature', () => {
    expect(surfaceDay('R')).toBeGreaterThan(55);
    expect(surfaceDay('R')).toBeLessThan(65);
    expect(surfaceDay('T')).toBeLessThanOrEqual(WEATHER.breeze.airDay);
    expect(surfaceDay('T')).toBeGreaterThanOrEqual(WEATHER.breeze.airDay - 2);
  });

  it('a white roof is cooler than a dark roof by albedo alone', () => {
    expect(TILE_TYPES.L.shade).toBe(TILE_TYPES.B.shade);
    expect(TILE_TYPES.L.veg).toBe(TILE_TYPES.B.veg);
    expect(surfaceDay('L')).toBeLessThan(surfaceDay('B') - 10);
  });

  it('shade helps a person more than a cool surface does', () => {
    expect(at('E').feelsDay).toBeLessThan(at('C').feelsDay - 5);
    expect(at('S').feelsDay).toBeLessThan(at('P').feelsDay - 5);
  });

  it('the heat island is stronger at night than in the day for a built-up district', () => {
    const cbd = scenarioById('city-heart');
    const h = computeHeat(cbd.start, 'breeze', cbd.focus);
    expect(h.nightIsland).toBeGreaterThan(h.dayIsland);
    expect(h.nightIsland).toBeGreaterThan(1);
  });

  it('towers and asphalt hold the most heat at night; open countryside is the reference', () => {
    const ref = countrysideNight('breeze');
    expect(at('G').airNight).toBeCloseTo(ref, 0);
    expect(at('H').airNight).toBeGreaterThan(at('R').airNight);
    expect(at('R').airNight).toBeGreaterThan(at('K').airNight);
  });

  it('a heatwave is hotter than a breezy day everywhere', () => {
    const grid = scenarioById('city-heart').start;
    const b = computeHeat(grid, 'breeze');
    const hw = computeHeat(grid, 'heatwave');
    hw.tiles.forEach((t, i) => expect(t.feelsDay).toBeGreaterThan(b.tiles[i].feelsDay));
  });

  it('a park cools the block downwind (south-west) more than the block upwind', () => {
    const grid = fillGrid('P');
    const park = 2 * COLS + 4; // row 2, col 4
    grid[park] = 'T';
    const { tiles } = computeHeat(grid, 'breeze');
    const downwind = park + COLS - 1; // row 3, col 3
    const upwind = park - COLS + 1;   // row 1, col 5
    expect(tiles[downwind].airDay).toBeLessThan(tiles[upwind].airDay);
  });

  it('uses the UTCI bands for feels-like', () => {
    expect(stressBand(47).id).toBe('extreme');
    expect(stressBand(40).id).toBe('very-strong');
    expect(stressBand(33).id).toBe('strong');
    expect(stressBand(27).id).toBe('moderate');
    expect(stressBand(20).id).toBe('none');
  });

  it('shows its working for every tile', () => {
    Object.keys(TILE_TYPES).forEach((code) => {
      const lines = explainTile(code);
      expect(lines.length).toBeGreaterThan(1);
      lines.forEach((l) => expect(l).not.toMatch(/NaN|undefined/));
    });
  });
});

describe('rules: budget, water, people and access', () => {
  const cbd = scenarioById('city-heart');

  it('the starting map costs nothing and meets the rules', () => {
    SCENARIOS.filter((s) => s.id !== 'riverside').forEach((s) => {
      const e = evaluateDesign(s.start, s);
      expect(e.budget.cost).toBe(0);
      expect(e.rulesMet).toBe(true);
    });
    // The paddock has nobody living on it yet - housing people is the task.
    expect(evaluateDesign(scenarioById('riverside').start, scenarioById('riverside')).checks.people).toBe(false);
  });

  it('knocking down a building costs demolition and loses its people', () => {
    const grid = [...cbd.start];
    grid[0] = 'T';
    const b = computeBudget(grid, cbd.start);
    expect(b.cost).toBe(TILE_TYPES.T.cost + DEMOLITION_COST);
    expect(b.people).toBe(computeBudget(cbd.start, cbd.start).people - TILE_TYPES.B.people);
    expect(evaluateDesign(grid, cbd).checks.people).toBe(false);
  });

  it('a cool roof keeps the building and its people', () => {
    const grid = [...cbd.start];
    grid[0] = 'L';
    const b = computeBudget(grid, cbd.start);
    expect(b.cost).toBe(TILE_TYPES.L.cost);
    expect(b.demolished).toBe(0);
  });

  it('turning every street into forest cuts buildings off', () => {
    const grid = cbd.start.map((c) => (TILE_TYPES[c].road ? 'T' : c));
    expect(unreachableBuildings(grid).length).toBeGreaterThan(0);
  });

  it('tree-lined streets still count as streets', () => {
    const grid = cbd.start.map((c) => (TILE_TYPES[c].road ? 'E' : c));
    expect(unreachableBuildings(grid)).toEqual([]);
  });

  it('buildings can be reached through a plaza that touches a street', () => {
    const school = scenarioById('school-zone');
    expect(unreachableBuildings(school.start)).toEqual([]);
    const grid = [...school.start];
    [24, 25, 32, 33].forEach((i) => { grid[i] = 'T'; }); // plant over the car-park path
    expect(unreachableBuildings(grid)).toContain(16);
  });

  it('no stars while a rule is broken, even if the goals are met', () => {
    const grid = cbd.start.map((c) => (c === 'R' ? 'E' : c === 'B' ? 'V' : c)); // green roofs everywhere: far over budget
    const e = evaluateDesign(grid, cbd);
    expect(e.checks.budget).toBe(false);
    expect(e.stars).toBe(0);
  });
});

describe('every district can be won', () => {
  const WINNING = {
    'city-heart': ['LLHLLHLL', 'EEEEEEEE', 'LSLLHLSL', 'LLSLLLLT', 'RRRERRER', 'LLLTTLLH'],
    riverside: ['GGGGGGGG', 'THSHTHTG', 'EEEEEEEE', 'GTHTHTGG', 'GGGGGGGG', 'GGTTGGGG'],
    'school-zone': ['RRRRRRRR', 'LLSTSTLL', 'LLTSTSGG', 'SPPSTGGG', 'SPPSGGGG', 'RRRRRRRR']
  };

  SCENARIOS.forEach((s) => {
    it(`${s.name}: a 3-star design exists, and the start earns none`, () => {
      expect(s.start).toHaveLength(COLS * ROWS);
      expect(evaluateDesign(s.start, s).stars).toBe(0);
      // The cooling goal for the focus area is never already met.
      expect(evaluateDesign(s.start, s).goals.find((g) => g.id === 'walk').met).toBe(false);
      const e = evaluateDesign(parseLayout(WINNING[s.id]), s);
      expect(e.rulesMet).toBe(true);
      expect(e.stars).toBe(3);
    });
  });
});

describe('prediction support', () => {
  it('the fair test changes only the focus area and ranks shade first', () => {
    SCENARIOS.forEach((s) => {
      const tests = fairTest(s);
      expect(tests).toHaveLength(5);
      expect(['trees', 'sails']).toContain(tests[0].id);
      expect(tests[tests.length - 1].id).toBe('cool');
    });
  });

  it('the hottest tiles of City Heart are on the asphalt street', () => {
    const cbd = scenarioById('city-heart');
    hottestTiles(cbd.start, 3).forEach((i) => expect(cbd.start[i]).toBe('R'));
  });
});

describe('saved state', () => {
  it('validates layouts', () => {
    expect(isValidGrid(fillGrid('G'))).toBe(true);
    expect(isValidGrid(['X'])).toBe(false);
    expect(() => parseLayout(['RRR'])).toThrow();
  });

  it('drops unknown districts and broken grids when loading', () => {
    const s = hydrate({
      scenarioId: 'atlantis',
      projects: {
        atlantis: { grid: [] },
        'city-heart': { grid: ['nope'], plans: [{ id: 'a', grid: fillGrid('T') }, { id: 'b', grid: [1, 2] }] }
      }
    });
    expect(s.scenarioId).toBe('');
    expect(Object.keys(s.projects)).toEqual(['city-heart']);
    expect(s.projects['city-heart'].grid).toEqual(scenarioById('city-heart').start);
    expect(s.projects['city-heart'].plans.map((p) => p.id)).toEqual(['a']);
    expect(hydrate(null)).toEqual(emptyState());
  });

  it('a saved project is Firestore-safe (no array directly inside an array)', () => {
    const s = hydrate({ scenarioId: 'riverside', projects: { riverside: { grid: fillGrid('G'), plans: [{ id: 'p', grid: fillGrid('T') }] } } });
    const nested = (v) => Array.isArray(v) ? v.some((x) => Array.isArray(x) || nested(x))
      : v && typeof v === 'object' ? Object.values(v).some(nested) : false;
    expect(nested(s)).toBe(false);
  });
});

describe('working shown to learners', () => {
  it('the tile working always ends at the value the map shows', () => {
    Object.keys(TILE_TYPES).forEach((code) => {
      const lines = explainTile(code);
      const last = lines[lines.length - 1];
      if (TILE_TYPES[code].pond) return;
      expect(last).toContain(`${surfaceDay(code).toFixed(1)} °C`);
    });
  });
});
