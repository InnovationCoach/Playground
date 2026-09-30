/**
 * Model and pricing tests for the Activity 6 filter lab (SO2-Au-TiO2-v1.1,
 * SIM-COST-v1.0). No emulator needed.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import {
  simulateFilter, filterSulfurBalance, defaultFilterParameters, normaliseFilterParameters, runSweep,
  CATALYST_CONFIGS, FILTER_MODEL_VERSION
} from '../src/features/activities/so2Sulfate/filter/filterModel.js';
import {
  ACTIONS, BUDGET_PRESETS, PARTICLE_TIERS, quote, explainQuote, nanoparticleMultiplier
} from '../src/features/activities/so2Sulfate/filter/pricing.js';

const base = defaultFilterParameters();

describe('filter model', () => {
  it('is versioned as the brief asked', () => {
    expect(FILTER_MODEL_VERSION).toBe('SO2-Au-TiO2-v1.1');
  });

  it('conserves sulfur at every sample, at both resolutions', () => {
    for (const resolution of ['standard', 'high']) {
      for (const p of [base, { ...base, temperatureK: 473, flowLpm: 10 }, { ...base, water: 0, so2Ppm: 1000, durationMin: 30 }]) {
        const run = simulateFilter(p, { resolution });
        const scale = Math.max(1e-15, run.samples.at(-1).fedMol);
        for (const s of run.samples) expect(Math.abs(filterSulfurBalance(s)) / scale).toBeLessThan(1e-6);
      }
    }
  });

  it('keeps coverages within [0, 1]', () => {
    const run = simulateFilter({ ...base, so2Ppm: 1000, water: 0, durationMin: 30 });
    for (const s of run.samples) {
      expect(s.siteUtilization).toBeGreaterThanOrEqual(0);
      expect(s.siteUtilization).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('makes no sulfate without water: the pathway stalls at SO₃*', () => {
    const run = simulateFilter({ ...base, water: 0 });
    expect(run.summary.sulfateUg).toBeLessThan(1e-9);
    expect(run.samples.at(-1).thetaSO3).toBeGreaterThan(0.01);
  });

  it('converts more with the Au/TiO₂ interface than without it', () => {
    const withAu = simulateFilter(base).summary.conversionPct;
    const control = simulateFilter({ ...base, auLoading: 0 }).summary.conversionPct;
    const inert = simulateFilter({ ...base, support: 'inert' }).summary.conversionPct;
    expect(withAu).toBeGreaterThan(control);
    expect(withAu).toBeGreaterThan(inert);
  });

  it('removes a smaller fraction of SO₂ at higher flow', () => {
    const slow = simulateFilter({ ...base, flowLpm: 0.5 }).summary.removalPct;
    const fast = simulateFilter({ ...base, flowLpm: 8 }).summary.removalPct;
    expect(slow).toBeGreaterThan(fast);
  });

  it('rounds duration to whole minutes (it is also a price multiplier)', () => {
    expect(normaliseFilterParameters({ durationMin: 4.6 }).durationMin).toBe(5);
  });

  it('gives finite outputs for every catalyst configuration and sweep', () => {
    for (const c of CATALYST_CONFIGS) {
      const s = simulateFilter(c.apply(base)).summary;
      for (const v of Object.values(s)) expect(Number.isFinite(v)).toBe(true);
    }
    const pts = runSweep('TEMPERATURE_SWEEP', base);
    expect(pts.every((p) => Number.isFinite(p.conversionPct))).toBe(true);
  });
});

describe('pricing (SIM-COST-v1.0)', () => {
  it('matches the brief\'s worked example: $25 × 2 × 3 × 5 = $750', () => {
    const q = quote('START_SIMULATION', { resolution: 'high', particleCount: 3200, minutes: 5, nanoparticles: 100 });
    expect(q.multipliers).toEqual({ resolution: 2, particles: 3, time: 5, nanoparticles: 1 });
    expect(q.cost).toBe(750);
    expect(explainQuote(q).formula).toBe('$25 × 2 × 3 × 5 × 1 = $750');
  });

  it('uses the default prices from the brief', () => {
    const expected = {
      START_SIMULATION: 25, RESET_SIMULATION: 10, STEP_MODE: 5, FAST_FORWARD: 15, HIGH_RESOLUTION_SIMULATION: 50,
      NANOPARTICLE_VIEW: 20, ACTIVE_SITE_VIEW: 35, MOLECULAR_TRAJECTORY_TRACKING: 40, ADD_100_AU_NANOPARTICLES: 75,
      INCREASE_PARTICLE_RESOLUTION: 100, DOUBLE_PARTICLE_COUNT: 150, TEMPERATURE_SWEEP: 200, SO2_CONCENTRATION_SWEEP: 200,
      FLOW_RATE_SWEEP: 175, CATALYST_LOADING_SWEEP: 250, FULL_PARAMETER_SWEEP: 750, GENERATE_PERFORMANCE_GRAPH: 15,
      GENERATE_DETAILED_REPORT: 50, EXPORT_DATA: 25, EXPORT_HIGH_RES_GRAPHICS: 40, SAVE_SIMULATION: 5, LOAD_SAVED_SIMULATION: 5
    };
    for (const [k, v] of Object.entries(expected)) expect(ACTIONS[k].base).toBe(v);
    expect(Object.fromEntries(Object.entries(BUDGET_PRESETS).map(([k, p]) => [k, p.amount])))
      .toEqual({ STUDENT: 1000, RESEARCHER: 10000, ADVANCED: 50000, INSTITUTION: 250000 });
  });

  it('never prices an action below its base, and ignores multipliers that do not apply', () => {
    for (const a of Object.keys(ACTIONS)) {
      const q = quote(a, { resolution: 'high', particleCount: 3200, minutes: 30, nanoparticles: 1000 });
      expect(q.cost).toBeGreaterThanOrEqual(ACTIONS[a].base);
      for (const [k, m] of Object.entries(q.multipliers)) if (!ACTIONS[a].scales.includes(k)) expect(m).toBe(1);
      expect(Number.isInteger(q.cost)).toBe(true);
    }
  });

  it('charges per tracked molecule', () => {
    expect(quote('MOLECULAR_TRAJECTORY_TRACKING', { quantity: 3 }).cost).toBe(120);
  });

  // firestore.rules keeps its own copy of the table: that copy is what a
  // tampered client runs into, so the two must never drift apart.
  it('agrees with the price table and tiers in firestore.rules', () => {
    const rules = fs.readFileSync('firestore.rules', 'utf8');
    for (const [k, a] of Object.entries(ACTIONS)) expect(rules).toMatch(new RegExp(`'${k}': ${a.base}\\b`));
    for (const [k, p] of Object.entries(BUDGET_PRESETS)) expect(rules).toMatch(new RegExp(`'${k}': ${p.amount}\\b`));
    for (const t of PARTICLE_TIERS) expect(rules).toMatch(new RegExp(`'${t.count}': ${t.multiplier}\\b`));
    for (let n = 100; n <= 1000; n += 100) expect(rules).toMatch(new RegExp(`'${n}': ${nanoparticleMultiplier(n)}\\b`));
    for (const [k, a] of Object.entries(ACTIONS)) {
      if (!a.scales.length) continue;
      const list = a.scales.map((s) => `'${s}'`).join(', ');
      expect(rules).toContain(`'${k}': [${list}]`);
    }
  });
});
