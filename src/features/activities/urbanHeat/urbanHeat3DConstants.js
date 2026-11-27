/**
 * 3D visual descriptors, thermal color ramps, and NE sea-breeze flow field
 * calculations for the Urban Heat 3D isometric city designer.
 *
 * Pure module (no React, no WebGL context required) so it can be unit-tested
 * directly alongside urbanHeatModel.js.
 */
import { COLS, ROWS, TILE_TYPES, stressBand } from './urbanHeatModel.js';

export const TILE_SIZE = 1.0;
export const TILE_GAP = 0.04;
export const TILE_STEP = TILE_SIZE + TILE_GAP;

/** Visual 3D geometry & material specs for all 13 TILE_TYPES. */
export const TILE_3D_SPECS = {
  R: {
    baseColor: '#2d3138',
    accentColor: '#f8fafc',
    elevation: 0.08,
    kind: 'road',
    roadStyle: 'asphalt',
    hasTrees: false,
    roughness: 0.92
  },
  C: {
    baseColor: '#b8c4d0',
    accentColor: '#f1f5f9',
    elevation: 0.08,
    kind: 'road',
    roadStyle: 'cool',
    hasTrees: false,
    roughness: 0.62
  },
  E: {
    baseColor: '#3a424d',
    accentColor: '#e2e8f0',
    elevation: 0.08,
    kind: 'road',
    roadStyle: 'tree-street',
    hasTrees: true,
    treeCount: 2,
    canopyColor: '#3f8f29',
    roughness: 0.85
  },
  P: {
    baseColor: '#9e978e',
    accentColor: '#cbd5e1',
    elevation: 0.1,
    kind: 'plaza',
    roughness: 0.88
  },
  S: {
    baseColor: '#b6afa6',
    accentColor: '#38bdf8',
    sailColor: '#0ea5e9',
    elevation: 0.1,
    kind: 'sail-plaza',
    roughness: 0.78
  },
  G: {
    baseColor: '#b9935a',
    accentColor: '#a17c47',
    elevation: 0.09,
    kind: 'dry-grass',
    roughness: 0.95
  },
  K: {
    baseColor: '#34c759',
    accentColor: '#16a34a',
    elevation: 0.11,
    kind: 'park',
    roughness: 0.86
  },
  T: {
    baseColor: '#2e7d32',
    accentColor: '#166534',
    elevation: 0.11,
    kind: 'forest',
    hasTrees: true,
    treeCount: 4,
    canopyColor: '#1f7a38',
    roughness: 0.9
  },
  W: {
    baseColor: '#0284c7',
    accentColor: '#38bdf8',
    elevation: 0.04,
    kind: 'water',
    roughness: 0.18
  },
  B: {
    baseColor: '#8d877e',
    wallColor: '#e7dfd5',
    roofColor: '#5c2323',
    elevation: 0.1,
    buildingHeight: 0.52,
    kind: 'building',
    roofStyle: 'dark',
    roughness: 0.78
  },
  L: {
    baseColor: '#8d877e',
    wallColor: '#ece7df',
    roofColor: '#f1f5f9',
    elevation: 0.1,
    buildingHeight: 0.52,
    kind: 'building',
    roofStyle: 'cool',
    roughness: 0.45
  },
  V: {
    baseColor: '#8d877e',
    wallColor: '#e5dfd5',
    roofColor: '#65a30d',
    elevation: 0.1,
    buildingHeight: 0.52,
    kind: 'building',
    roofStyle: 'green',
    roughness: 0.75
  },
  H: {
    baseColor: '#64748b',
    wallColor: '#cbd5e1',
    roofColor: '#334155',
    elevation: 0.1,
    buildingHeight: 1.38,
    kind: 'tower',
    roofStyle: 'tower',
    roughness: 0.55
  }
};

/** Parse #rrggbb to [r, g, b] in 0..1. */
export function hexToRgb(hex) {
  const clean = (hex || '#64748b').replace('#', '');
  const n = parseInt(clean, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Linearly interpolate two #rrggbb hex colors. */
export function lerpHex(hexA, hexB, t) {
  const k = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const r = Math.round((r1 + (r2 - r1) * k) * 255);
  const g = Math.round((g1 + (g2 - g1) * k) * 255);
  const b = Math.round((b1 + (b2 - b1) * k) * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Continuous false-color ramp for 3 pm Ground Surface temperature (°C). */
export function surfaceHeatColor(tempC) {
  if (tempC <= 31) return '#10b981';
  if (tempC <= 35) return lerpHex('#10b981', '#facc15', (tempC - 31) / 4);
  if (tempC <= 41) return lerpHex('#facc15', '#f97316', (tempC - 35) / 6);
  if (tempC <= 49) return lerpHex('#f97316', '#dc2626', (tempC - 41) / 8);
  return lerpHex('#dc2626', '#7f1d1d', Math.min(1, (tempC - 49) / 10));
}

/** False-color ramp for 3 am Heat Island excess (°C above countryside). */
export function nightHeatColor(excessC) {
  if (excessC <= 0.4) return '#1e3a5f';
  if (excessC <= 1.0) return lerpHex('#1e3a5f', '#f59e0b', (excessC - 0.4) / 0.6);
  if (excessC <= 1.8) return lerpHex('#f59e0b', '#ea580c', (excessC - 1.0) / 0.8);
  if (excessC <= 2.5) return lerpHex('#ea580c', '#dc2626', (excessC - 1.8) / 0.7);
  return lerpHex('#dc2626', '#991b1b', Math.min(1, (excessC - 2.5) / 1.0));
}

/**
 * Compute tile display color and thermal emissive glow for the active view mode.
 * Returns { baseColor, roofColor, emissiveColor, emissiveIntensity, hasHeatHaze }.
 */
export function getTileVisualState(code, tileHeat, view, nightRef) {
  const spec = TILE_3D_SPECS[code] || TILE_3D_SPECS.G;
  if (view === 'map' || !tileHeat) {
    return {
      baseColor: spec.baseColor,
      roofColor: spec.roofColor || spec.baseColor,
      wallColor: spec.wallColor || '#e2e8f0',
      emissiveColor: '#000000',
      emissiveIntensity: 0,
      hasHeatHaze: false
    };
  }

  if (view === 'surface') {
    const col = surfaceHeatColor(tileHeat.surfaceDay);
    const hotFactor = Math.max(0, Math.min(1, (tileHeat.surfaceDay - 40) / 18));
    return {
      baseColor: col,
      roofColor: col,
      wallColor: lerpHex(spec.wallColor || '#cbd5e1', col, 0.45),
      emissiveColor: hotFactor > 0.2 ? '#ea580c' : '#000000',
      emissiveIntensity: hotFactor * 0.42,
      hasHeatHaze: tileHeat.surfaceDay >= 46
    };
  }

  if (view === 'day') {
    const band = stressBand(tileHeat.feelsDay);
    const hotFactor = Math.max(0, Math.min(1, (tileHeat.feelsDay - 36) / 12));
    return {
      baseColor: band.color,
      roofColor: band.color,
      wallColor: lerpHex(spec.wallColor || '#cbd5e1', band.color, 0.45),
      emissiveColor: band.id === 'extreme' || band.id === 'very-strong' ? '#dc2626' : '#000000',
      emissiveIntensity: hotFactor * 0.35,
      hasHeatHaze: band.id === 'extreme' || band.id === 'very-strong'
    };
  }

  // view === 'night'
  const excess = Math.max(0, tileHeat.airNight - nightRef);
  const col = nightHeatColor(excess);
  const glow = Math.max(0, Math.min(1, (excess - 0.5) / 2.2));
  return {
    baseColor: lerpHex('#172554', col, 0.72),
    roofColor: lerpHex('#1e293b', col, 0.78),
    wallColor: lerpHex('#1e293b', '#475569', 0.35),
    emissiveColor: glow > 0.08 ? '#f97316' : '#0f172a',
    emissiveIntensity: glow * 0.85,
    hasHeatHaze: false
  };
}

/** Convert grid index (0..47) to world XZ center coordinates centered around (0, 0). */
export function tileToWorld(index) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const x = (col - (COLS - 1) / 2) * TILE_STEP;
  const z = (row - (ROWS - 1) / 2) * TILE_STEP;
  return { x, z, row, col };
}

/**
 * Compute Townsville NE sea-breeze flow field across the 8×6 grid.
 *
 * North is -Z, East is +X, so the NE sea breeze blows toward (-0.707, +0.707).
 * Tall buildings ('H') obstruct airflow and generate downwind turbulent eddies;
 * open corridors (roads, parks, plazas, water) channel smooth laminar ribbons.
 */
export function computeWindField(grid, weatherId = 'breeze') {
  const baseSpeed = weatherId === 'heatwave' ? 0.22 : 1.0;
  return grid.map((code, i) => {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    const t = TILE_TYPES[code] || TILE_TYPES.G;

    // Check upwind NE tile and immediate N/E neighbours for tall towers
    let blocked = 0;
    if (code === 'H') blocked += 0.9;
    else if (t.building) blocked += 0.3;

    if (r > 0 && c < COLS - 1) {
      const upNE = grid[(r - 1) * COLS + (c + 1)];
      if (upNE === 'H') blocked += 0.85;
      else if (TILE_TYPES[upNE]?.building) blocked += 0.25;
    }
    if (r > 1 && c < COLS - 2) {
      const upNE2 = grid[(r - 2) * COLS + (c + 2)];
      if (upNE2 === 'H') blocked += 0.45;
    }

    const turbulence = Math.min(1, blocked * (weatherId === 'heatwave' ? 0.4 : 1));
    const corridorBonus = !t.building ? 1.15 : 0.72;
    const speed = Math.max(0.15, baseSpeed * corridorBonus * (1 - turbulence * 0.55));

    // Slight cooling tint if upwind or current tile has vegetation/water
    const coolCarry = t.veg > 0.3 || t.pond ? 1 : 0;

    return {
      index: i,
      speed,
      turbulence,
      coolCarry,
      vx: -0.707 * speed,
      vz: 0.707 * speed
    };
  });
}

/** Detect whether the current runtime supports WebGL (returns false in jsdom). */
export function detectWebGLSupport() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  // jsdom userAgent check avoids console warnings from unimplemented canvas.getContext
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')) return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}
