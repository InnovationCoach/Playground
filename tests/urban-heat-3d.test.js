import { describe, expect, it } from 'vitest';
import { TILE_TYPES, COLS, ROWS, computeHeat, fillGrid, countrysideNight } from '../src/features/activities/urbanHeat/urbanHeatModel.js';
import { scenarioById } from '../src/features/activities/urbanHeat/urbanHeatScenarios.js';
import {
  TILE_3D_SPECS,
  surfaceHeatColor,
  nightHeatColor,
  getTileVisualState,
  tileToWorld,
  computeWindField,
  detectWebGLSupport
} from '../src/features/activities/urbanHeat/urbanHeat3DConstants.js';

describe('urban heat 3D visual specs', () => {
  it('defines a 3D descriptor for every tile type in TILE_TYPES', () => {
    Object.keys(TILE_TYPES).forEach((code) => {
      const spec = TILE_3D_SPECS[code];
      expect(spec, `missing 3D spec for ${code}`).toBeDefined();
      expect(spec.baseColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(spec.elevation).toBeGreaterThan(0);
    });
  });

  it('distinguishes dark, cool white, and green building roofs', () => {
    expect(TILE_3D_SPECS.B.roofStyle).toBe('dark');
    expect(TILE_3D_SPECS.L.roofStyle).toBe('cool');
    expect(TILE_3D_SPECS.V.roofStyle).toBe('green');
    expect(TILE_3D_SPECS.H.buildingHeight).toBeGreaterThan(TILE_3D_SPECS.B.buildingHeight * 2);
  });

  it('maps grid indices symmetrically around world origin', () => {
    const topLeft = tileToWorld(0);
    const bottomRight = tileToWorld(COLS * ROWS - 1);
    expect(topLeft.x).toBeCloseTo(-bottomRight.x, 5);
    expect(topLeft.z).toBeCloseTo(-bottomRight.z, 5);
  });
});

describe('thermal visual modes', () => {
  it('ramps ground 3 pm colors from emerald green (<32°C) to deep crimson (>50°C)', () => {
    expect(surfaceHeatColor(29)).toBe('#10b981');
    expect(surfaceHeatColor(60)).toBe('#7f1d1d');
    expect(surfaceHeatColor(40)).not.toBe(surfaceHeatColor(30));
  });

  it('enables heat haze on scorching asphalt in surface and feels-like views, and infrared underglow at 3 am', () => {
    const cbd = scenarioById('city-heart');
    const heat = computeHeat(cbd.start, 'breeze', cbd.focus);
    const nightRef = countrysideNight('breeze');
    const roadIdx = cbd.start.indexOf('R');
    const towerIdx = cbd.start.indexOf('H');

    const mapVis = getTileVisualState('R', heat.tiles[roadIdx], 'map', nightRef);
    expect(mapVis.hasHeatHaze).toBe(false);
    expect(mapVis.emissiveIntensity).toBe(0);

    const surfVis = getTileVisualState('R', heat.tiles[roadIdx], 'surface', nightRef);
    expect(surfVis.hasHeatHaze).toBe(true);

    const nightVis = getTileVisualState('H', heat.tiles[towerIdx], 'night', nightRef);
    expect(nightVis.emissiveIntensity).toBeGreaterThan(0.4);
    expect(nightHeatColor(3.0)).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('Townsville NE sea breeze flow field', () => {
  it('channels faster laminar breeze over open parks and creates turbulent wakes behind tall towers', () => {
    const grid = fillGrid('K');
    // Place a tall tower at row 1, col 4 (index 12)
    grid[1 * COLS + 4] = 'H';
    const field = computeWindField(grid, 'breeze');

    const openCell = field[0]; // row 0, col 0 (unobstructed park)
    const downwindOfTower = field[2 * COLS + 3]; // row 2, col 3 (SW of tower)

    expect(openCell.turbulence).toBe(0);
    expect(openCell.coolCarry).toBe(1);
    expect(downwindOfTower.turbulence).toBeGreaterThan(0.5);
    expect(openCell.speed).toBeGreaterThan(downwindOfTower.speed);
  });

  it('slows breeze significantly during a heatwave', () => {
    const grid = fillGrid('R');
    const breeze = computeWindField(grid, 'breeze');
    const heatwave = computeWindField(grid, 'heatwave');
    expect(heatwave[0].speed).toBeLessThan(breeze[0].speed * 0.4);
  });

  it('safely reports false for WebGL support in non-browser Node/jsdom test environments', () => {
    expect(detectWebGLSupport()).toBe(false);
  });
});
