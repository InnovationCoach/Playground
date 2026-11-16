/** Hands-on tools for Kinetic & Smart Energy Harvesting (programs/tools/kineticEnergy.js). */
import { describe, it, expect } from 'vitest';
import * as m from '../src/features/pbl/programs/tools/kineticEnergy.js';
import { expectKitWiring, expectStorable, withTools } from './program-tools-shared.js';

const {
  TRANSDUCERS, SITES, DIODES, bridgeDrop, chargeCurve, decayCurve, capEnergyMj, cleanRectifier, rectifierReport,
  cleanDeflection, deflectionReport, ACCESS_CHECKS, TRIP_LIMIT_MM, cleanRoi, roiReport, stressReport, honestRoiDone, earnedBadges
} = m;

describe('content wiring', () => {
  it('reads Don\'s badges, 4 transducers and 3 sites', () => {
    expectKitWiring(m, { auto: ['badge-honest-roi-analyst'] });
    expect(TRANSDUCERS).toHaveLength(4);
    expect(SITES.map((s) => s.limitMm)).toEqual([3.5, 4.5, 5.0]);
    for (const t of TRANSDUCERS) expect(t.verticalDeflectionMm).toBeLessThan(TRIP_LIMIT_MM);
  });
});

describe('bridge rectifier bench', () => {
  it('costs two diode drops per pulse: 1.4 V silicon, 0.5 V Schottky', () => {
    expect(DIODES.map(bridgeDrop)).toEqual([1.4, 0.5]);
  });

  it('charges toward peak minus the drop, never past it, and stores half C V squared', () => {
    const c = chargeCurve(10, 1.4, 500, 10);
    expect(c[0]).toBe(0);
    expect(c[1]).toBeCloseTo(0.86, 2);
    expect(Math.max(...c)).toBeLessThanOrEqual(8.6);
    expect(c.at(-1)).toBeCloseTo(8.6, 1);
    expect(chargeCurve(1, 1.4, 50, 10).at(-1)).toBe(0);
    expect(capEnergyMj(10)).toBe(50);
    expect(capEnergyMj(0)).toBe(0);
  });

  it('discharges with time constant RC', () => {
    const d = decayCurve(10, 10000, 30);
    expect(d).toHaveLength(31);
    expect(d[0]).toBe(10);
    expect(d[10]).toBeCloseTo(3.679, 2);
    expect(d[30]).toBeLessThan(d[29]);
  });

  it('always stores more with Schottky diodes, most of all on the low-voltage harvester', () => {
    const gain = (id) => rectifierReport(cleanRectifier({ transducerId: id })).schottkyGainPct;
    for (const t of TRANSDUCERS) expect(gain(t.id)).toBeGreaterThan(0);
    expect(gain('transducer-peltier-seebeck')).toBeGreaterThan(gain('transducer-piezo-array'));
    const r = rectifierReport(cleanRectifier({ steps: 9999, gainPct: 500, loadKohm: -4, diodeId: 'led' }));
    expect(r.runs[0].charge).toHaveLength(201);
    expect(r.chosen.diode.id).toBe('1n5819');
    expect(r.tauSec).toBe(1);
    expectStorable(m, 'rectifier-bench', cleanRectifier({ steps: 50 }));
  });
});

describe('deflection checker', () => {
  const all = ACCESS_CHECKS.map((c) => c.id);
  it('enforces the under-5 mm trip limit and the stricter site limits', () => {
    const at = (siteId, mm) => deflectionReport(cleanDeflection({ siteId, measuredMm: mm, checks: all }));
    expect(at('site-main-staircase', 3.5)).toMatchObject({ state: 'ok', pass: true, marginMm: 0 });
    expect(at('site-main-staircase', 3.6)).toMatchObject({ state: 'warn', pass: false, tripFree: true });
    expect(at('site-park-plaza', 4.9)).toMatchObject({ state: 'ok', pass: true });
    expect(at('site-park-plaza', 5.0)).toMatchObject({ state: 'bad', pass: false, tripFree: false });
    expect(at('site-cafeteria-queue', 9)).toMatchObject({ state: 'bad', pass: false });
  });

  it('needs a measurement and all five audit checks', () => {
    expect(deflectionReport(cleanDeflection(null))).toMatchObject({ state: 'none', pass: false });
    expect(deflectionReport(cleanDeflection({ measuredMm: 2, checks: all.slice(1) })).pass).toBe(false);
    expect(cleanDeflection({ measuredMm: -3, checks: ['wheelchair', 'jetpack'], siteId: 'moon' })).toMatchObject({ measuredMm: 0, checks: ['wheelchair'], siteId: SITES[0].id });
    expectStorable(m, 'deflection-checker', cleanDeflection({ measuredMm: 2.4, checks: all }));
  });
});

describe('stress test and honest ROI', () => {
  it('turns footsteps into kWh and an honest payback', () => {
    const r = roiReport(cleanRoi({ transducerId: 'transducer-em-spring', footfall: 10000, tiles: 10, scale: 'bulk100', gridUsdPerKwh: 0.1 }));
    // 10,000 steps x 3.2 J x 10 tiles x 365 / 3.6e6 = 32.44 kWh a year.
    expect(r.jPerStep).toBe(3.2);
    expect(r.kwhYear).toBe(32.44);
    expect(r.gridUsdYear).toBe(3.24);
    expect(r.costUsd).toBe(410);
    expect(Math.round(r.gridPaybackYears)).toBe(126);
    expect(r.totalPaybackYears).toBe(r.gridPaybackYears);
    expect(r.avgWatts).toBe(3.7);
  });

  it('shortens the payback only when a researched sensor saving is entered', () => {
    const base = { transducerId: 'transducer-piezo-array', footfall: 5000, tiles: 16, scale: 'bulk10000' };
    const plain = roiReport(cleanRoi(base));
    const sensing = roiReport(cleanRoi({ ...base, sensorUsdPerYear: 12 }));
    expect(plain.sensorUsdYear).toBe(0);
    expect(sensing.sensorUsdYear).toBe(192);
    expect(sensing.totalPaybackYears).toBeLessThan(1);
    expect(sensing.gridPaybackYears).toBe(plain.gridPaybackYears);
    // 3.65 kWh a year is worth about 0.44 USD against 152 USD of tiles.
    expect(Math.round(plain.gridPaybackYears)).toBe(347);
  });

  it('clamps footfall to 1,000-100,000 a day and refuses negative prices', () => {
    expect(cleanRoi({ footfall: 5, gridUsdPerKwh: -1, sensorUsdPerYear: -9, tiles: 0 })).toMatchObject({ footfall: 1000, gridUsdPerKwh: 0.01, sensorUsdPerYear: 0, tiles: 1 });
    expect(cleanRoi({ footfall: 9e9 }).footfall).toBe(100000);
  });

  it('uses the team\'s measured energy only when logged, and unlocks the badge at 1,000 steps on their own number', () => {
    const logged = { steps: 1000, jStart: 0.5, jEnd: 0.4, useMeasured: true };
    expect(stressReport(cleanRoi(logged))).toMatchObject({ logged: true, complete: true, fadePct: 20 });
    expect(roiReport(cleanRoi(logged))).toMatchObject({ measured: true, jPerStep: 0.4 });
    expect(roiReport(cleanRoi({ useMeasured: true })).measured).toBe(false);
    expect(honestRoiDone(cleanRoi(logged))).toBe(true);
    expect(honestRoiDone(cleanRoi({ ...logged, steps: 999 }))).toBe(false);
    expect(honestRoiDone(cleanRoi({ ...logged, useMeasured: false }))).toBe(false);
    expect(honestRoiDone(cleanRoi({ ...logged, jStart: null }))).toBe(false);
    expect(earnedBadges(withTools(m, { 'roi-calculator': logged }))).toEqual(['badge-honest-roi-analyst']);
    expectStorable(m, 'roi-calculator', cleanRoi(logged));
  });
});
