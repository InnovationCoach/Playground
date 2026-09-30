/**
 * Checks for the SO₂ → sulfate kinetic model.
 *
 * The model makes no quantitative claim about real Au/TiO₂, so these tests do
 * not check numbers against experiment. They check the things a chemistry
 * teacher would catch: sulfur is conserved, gold is never consumed, no Au/TiO₂
 * interface means (almost) no oxidation, and the electrochemical mode really
 * depends on the applied potential.
 */
import { describe, it, expect } from 'vitest';
import {
  simulate,
  defaultParameters,
  normaliseParameters,
  rateConstants,
  stateAt,
  sulfurBalance,
  MODEL_VERSION,
  BASELINE_DATE,
  PARAMETERS
} from '../src/features/activities/so2Sulfate/so2Model.js';

const base = () => defaultParameters();
const end = (run) => run.samples[run.samples.length - 1];

describe('versioning', () => {
  it('pins the model version and baseline date', () => {
    expect(MODEL_VERSION).toBe('SO2-Au-TiO2-v1.0');
    expect(BASELINE_DATE).toBe('2026-09-24');
  });
});

describe('sulfur mass balance', () => {
  for (const mode of ['surface', 'electrochemical']) {
    it(`conserves sulfur at every sample (${mode})`, () => {
      const run = simulate(base(), mode);
      for (const s of run.samples) {
        expect(Math.abs(sulfurBalance(s, run.parameters))).toBeLessThan(1e-6);
      }
    });
  }

  it('conserves sulfur at the stiffest corner of the parameter space', () => {
    const p = Object.fromEntries(PARAMETERS.map((d) => [d.key, d.max]));
    for (const mode of ['surface', 'electrochemical']) {
      const run = simulate(p, mode);
      for (const s of run.samples) {
        expect(Math.abs(sulfurBalance(s, run.parameters))).toBeLessThan(1e-5);
        expect(s.activeSites).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('the qualitative story', () => {
  it('SO₂ falls while sulfate rises', () => {
    const run = simulate(base(), 'surface');
    expect(end(run).so2).toBeLessThan(run.samples[0].so2);
    expect(end(run).sulfate).toBeGreaterThan(0);
    expect(run.samples[0].sulfate).toBe(0);
  });

  it('with no gold there is no interface, and far less oxidation', () => {
    const withAu = simulate(base(), 'surface');
    const noAu = simulate({ ...base(), auLoading: 0 }, 'surface');
    expect(rateConstants({ ...base(), auLoading: 0 }, 'surface').interfaceActivity).toBe(0);
    expect(end(noAu).sulfate).toBeLessThan(end(withAu).sulfate * 0.25);
  });

  it('gold with an inert support has no interface activity either', () => {
    expect(rateConstants({ ...base(), supportActivity: 0 }, 'surface').interfaceActivity).toBe(0);
  });

  it('smaller particles at equal loading give more interface', () => {
    const small = rateConstants({ ...base(), particleSizeNm: 2 }, 'surface');
    const large = rateConstants({ ...base(), particleSizeNm: 15 }, 'surface');
    expect(small.interface).toBeGreaterThan(large.interface);
  });

  it('surface catalysis stops without an oxidant', () => {
    const run = simulate({ ...base(), o2Availability: 0 }, 'surface');
    expect(end(run).sulfate).toBe(0);
    expect(end(run).electronTransfer).toBe(0);
  });

  it('electrochemical oxidation increases with applied potential', () => {
    const low = simulate({ ...base(), potentialV: 0.3 }, 'electrochemical');
    const high = simulate({ ...base(), potentialV: 1.0 }, 'electrochemical');
    expect(end(high).sulfate).toBeGreaterThan(end(low).sulfate);
  });

  it('electrochemical mode ignores dissolved O₂', () => {
    const a = simulate({ ...base(), o2Availability: 0 }, 'electrochemical');
    const b = simulate({ ...base(), o2Availability: 1 }, 'electrochemical');
    expect(end(a).sulfate).toBeCloseTo(end(b).sulfate, 10);
  });

  it('with no release, sulfate stays on the surface and blocks sites', () => {
    const run = simulate({ ...base(), releaseFactor: 0 }, 'surface');
    expect(end(run).sulfate).toBe(0);
    expect(end(run).surfaceSulfate).toBeGreaterThan(0);
    expect(end(run).activeSites).toBeGreaterThan(simulate(base(), 'surface').summary.finalActiveSites);
  });

  it('a lower sulfate yield factor routes sulfur to the untracked branch', () => {
    const run = simulate({ ...base(), sulfateYield: 0.5 }, 'surface');
    expect(end(run).surfaceOther).toBeGreaterThan(0);
  });

  it('two electrons per sulfur: integrated electron transfer = 2 × sulfur oxidised', () => {
    const run = simulate(base(), 'electrochemical', { points: 2000 });
    let electrons = 0;
    for (let i = 1; i < run.samples.length; i++) {
      const A = run.samples[i - 1];
      const B = run.samples[i];
      electrons += ((A.electronTransfer + B.electronTransfer) / 2) * (B.t - A.t);
    }
    const s = end(run);
    const oxidised = s.surfaceSO3 + s.surfaceSulfate + s.surfaceOther + s.sulfate;
    expect(electrons / oxidised).toBeCloseTo(2, 2);
  });
});

describe('inputs', () => {
  it('clamps out-of-range and missing values instead of producing NaN', () => {
    const p = normaliseParameters({ so2Initial: 999, temperatureK: 'hot' });
    expect(p.so2Initial).toBe(5);
    expect(p.temperatureK).toBe(298);
    expect(Number.isFinite(end(simulate(p, 'surface')).so2)).toBe(true);
  });

  it('interpolates the trajectory for the live clock', () => {
    const run = simulate(base(), 'surface');
    const mid = stateAt(run.samples, run.samples[10].t + 0.0001);
    expect(mid.so2).toBeLessThanOrEqual(run.samples[10].so2);
    expect(stateAt(run.samples, 1e9)).toBe(end(run));
  });
});
