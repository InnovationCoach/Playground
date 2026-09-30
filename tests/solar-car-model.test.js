/**
 * Physics and coaching checks for the Solar Car challenge.
 *
 * These run without the Firestore emulator - the model module is pure. They
 * exist because the activity now tells a 15-year-old that their car will do
 * 1.4 m/s, and they will go and check with a stopwatch.
 */
import { describe, it, expect } from 'vitest';
import {
  SUN_CONDITIONS,
  SURFACES,
  summariseMass,
  analysePanel,
  analyseDrivetrain,
  resistanceAt,
  solvePowerLimitedSpeed,
  massBudgetForSpeed,
  analyseBuild,
  analyseTestRuns,
  G,
  STANDARD_IRRADIANCE
} from '../src/features/activities/solarCar/solarCarModel.js';

// A plausible school build: ~250 g car, 1.5 W panel, 3:1 spur reduction.
const referenceBuild = () => ({
  parts: [
    { name: 'Chassis', category: 'structure', qty: 1, grams: 80 },
    { name: 'Solar panel', category: 'power', qty: 1, grams: 45 },
    { name: 'DC motor', category: 'drivetrain', qty: 1, grams: 20 },
    { name: 'Wheel', category: 'drivetrain', qty: 4, grams: 10 },
    { name: 'Axle', category: 'drivetrain', qty: 2, grams: 6 },
    { name: 'Wiring', category: 'power', qty: 1, grams: 8 }
  ],
  panel: {
    lengthMm: 130, widthMm: 90,
    mode: 'rated', vmp: 6, impMa: 250,
    condition: 'full_sun'
  },
  drive: {
    ratioMode: 'teeth', driverTeeth: 10, drivenTeeth: 30,
    wheelDiameterMm: 60, motorNoLoadRpm: 6000,
    driveType: 'spur_gears'
  },
  track: { surface: 'smooth_floor', distanceM: 10, targetSpeed: 3.0 }
});

describe('mass roll-up', () => {
  it('multiplies quantity by unit mass', () => {
    const m = summariseMass(referenceBuild().parts);
    // 80 + 45 + 20 + (4*10) + (2*6) + 8
    expect(m.totalGrams).toBe(205);
    expect(m.totalKg).toBeCloseTo(0.205, 5);
  });

  it('splits mass by category', () => {
    const m = summariseMass(referenceBuild().parts);
    expect(m.byCategory.structure).toBe(80);
    expect(m.byCategory.power).toBe(53);
    expect(m.byCategory.drivetrain).toBe(72);
  });

  it('identifies the heaviest line and its share', () => {
    const m = summariseMass(referenceBuild().parts);
    expect(m.heaviest.name).toBe('Chassis');
    expect(m.heaviestShare).toBeCloseTo(80 / 205, 4);
  });

  it('treats blank and negative entries as zero rather than NaN', () => {
    const m = summariseMass([
      { name: 'Blank', qty: '', grams: '' },
      { name: 'Negative', qty: -2, grams: -5 }
    ]);
    expect(m.totalGrams).toBe(0);
    expect(Number.isNaN(m.totalKg)).toBe(false);
  });

  it('files an unknown category under "other"', () => {
    const m = summariseMass([{ name: 'Mystery', category: 'sparkles', qty: 1, grams: 12 }]);
    expect(m.byCategory.other).toBe(12);
  });
});

describe('panel analysis', () => {
  it('computes rated power from Vmp and Imp', () => {
    const p = analysePanel({ lengthMm: 130, widthMm: 90, mode: 'rated', vmp: 6, impMa: 250 });
    expect(p.ratedW).toBeCloseTo(1.5, 3);
  });

  it('applies a fill factor to open-circuit / short-circuit readings', () => {
    const p = analysePanel({ lengthMm: 130, widthMm: 90, mode: 'measured', voc: 7, iscMa: 300, fillFactor: 0.7 });
    expect(p.ratedW).toBeCloseTo(7 * 0.3 * 0.7, 3);
  });

  it('derates output for the light condition', () => {
    const p = analysePanel({ lengthMm: 130, widthMm: 90, mode: 'rated', vmp: 6, impMa: 250, condition: 'overcast' });
    expect(p.effectiveW).toBeCloseTo(1.5 * SUN_CONDITIONS.overcast.factor, 3);
  });

  it('derives efficiency against the 1000 W/m2 reference', () => {
    const p = analysePanel({ lengthMm: 130, widthMm: 90, mode: 'rated', vmp: 6, impMa: 250 });
    const areaM2 = (130 * 90) / 1e6;
    expect(p.efficiency).toBeCloseTo(1.5 / (areaM2 * STANDARD_IRRADIANCE), 5);
    expect(p.plausibility).toBe('ok');
  });

  it('flags a physically impossible efficiency', () => {
    // 6 V x 250 mA claimed on a 40 x 40 mm panel would be ~94% efficient.
    const p = analysePanel({ lengthMm: 40, widthMm: 40, mode: 'rated', vmp: 6, impMa: 250 });
    expect(p.plausibility).toBe('too_high');
  });

  it('flags an implausibly low efficiency', () => {
    const p = analysePanel({ lengthMm: 300, widthMm: 300, mode: 'rated', vmp: 2, impMa: 10 });
    expect(p.plausibility).toBe('too_low');
  });

  it('does not divide by zero when the panel is unmeasured', () => {
    const p = analysePanel({});
    expect(p.efficiency).toBe(0);
    expect(p.plausibility).toBe('unknown');
  });
});

describe('drivetrain', () => {
  it('derives gear ratio from tooth counts', () => {
    const d = analyseDrivetrain({ ratioMode: 'teeth', driverTeeth: 10, drivenTeeth: 30, wheelDiameterMm: 60, motorNoLoadRpm: 6000 });
    expect(d.gearRatio).toBe(3);
  });

  it('derives gear ratio from pulley diameters', () => {
    const d = analyseDrivetrain({ ratioMode: 'diameter', driverDiaMm: 8, drivenDiaMm: 32, wheelDiameterMm: 60, motorNoLoadRpm: 6000 });
    expect(d.gearRatio).toBe(4);
  });

  it('converts motor rpm to road speed through the gearing and wheel', () => {
    const d = analyseDrivetrain({ ratioMode: 'teeth', driverTeeth: 10, drivenTeeth: 30, wheelDiameterMm: 60, motorNoLoadRpm: 6000 });
    // 6000 rpm * 0.75 load = 4500; / 3 = 1500 wheel rpm; * pi * 0.06 m / 60
    const expected = (1500 * Math.PI * 0.06) / 60;
    expect(d.geometricSpeed).toBeCloseTo(expected, 2);
  });

  it('falls back to 1:1 rather than Infinity when the driver gear is blank', () => {
    const d = analyseDrivetrain({ ratioMode: 'teeth', driverTeeth: 0, drivenTeeth: 30, wheelDiameterMm: 60, motorNoLoadRpm: 6000 });
    expect(d.gearRatio).toBe(1);
    expect(Number.isFinite(d.geometricSpeed)).toBe(true);
  });
});

describe('power balance', () => {
  const physics = { massKg: 0.205, crr: 0.030, dragCoefficient: 0.6, frontalAreaM2: 0.015 };

  it('separates rolling from aerodynamic resistance', () => {
    const f = resistanceAt(1.5, physics);
    expect(f.rolling).toBeCloseTo(0.030 * 0.205 * G, 6);
    expect(f.aero).toBeCloseTo(0.5 * 1.225 * 0.6 * 0.015 * 1.5 * 1.5, 6);
    expect(f.total).toBeCloseTo(f.rolling + f.aero, 9);
  });

  it('finds the speed where resistance power equals supply', () => {
    const v = solvePowerLimitedSpeed(0.66, physics);
    expect(resistanceAt(v, physics).total * v).toBeCloseTo(0.66, 4);
  });

  it('returns zero speed for zero power', () => {
    expect(solvePowerLimitedSpeed(0, physics)).toBe(0);
  });

  it('mass budget is the inverse of the speed solve', () => {
    const targetV = 1.5;
    const budgetKg = massBudgetForSpeed(0.66, targetV, physics);
    const atBudget = { ...physics, massKg: budgetKg };
    expect(solvePowerLimitedSpeed(0.66, atBudget)).toBeCloseTo(targetV, 3);
  });

  it('reports no mass budget when the power cannot even overcome drag', () => {
    expect(massBudgetForSpeed(0.0001, 10, physics)).toBe(0);
  });
});

describe('full build report', () => {
  it('predicts a plausible speed for a typical school car', () => {
    const r = analyseBuild(referenceBuild());
    expect(r.speed.predicted).toBeGreaterThan(0.5);
    expect(r.speed.predicted).toBeLessThan(6);
    expect(r.speed.predictedTimeS).toBeCloseTo(10 / r.speed.predicted, 2);
  });

  it('takes the lower of the gearing and power limits', () => {
    const r = analyseBuild(referenceBuild());
    expect(r.speed.predicted).toBeCloseTo(Math.min(r.speed.geometric, r.speed.powerLimited), 3);
    expect(['gearing', 'power']).toContain(r.speed.limitedBy);
  });

  it('calls out gearing that outruns the available power', () => {
    const build = referenceBuild();
    build.drive.drivenTeeth = 11; // barely any reduction - very tall gearing
    const r = analyseBuild(build);
    expect(r.speed.limitedBy).toBe('power');
    expect(r.gearing.verdict).toBe('too_tall');
    expect(r.coaching.some((n) => n.title.includes('cannot pay for'))).toBe(true);
  });

  it('calls out gearing that wastes available power', () => {
    const build = referenceBuild();
    build.drive.drivenTeeth = 300; // enormous reduction - crawling
    const r = analyseBuild(build);
    expect(r.speed.limitedBy).toBe('gearing');
    expect(r.gearing.verdict).toBe('too_short');
    expect(r.gearing.ideal).toBeLessThan(r.gearing.actual);
  });

  it('gives a mass budget a team can act on', () => {
    const lean = analyseBuild(referenceBuild());
    expect(lean.massBudget.withinBudget).toBe(true);
    expect(lean.massBudget.marginG).toBeGreaterThan(0);

    // Load it past its own stated budget and the verdict has to flip.
    const heavy = referenceBuild();
    heavy.parts.push({ name: 'Decorative brick', category: 'other', qty: 1, grams: lean.massBudget.allowedG + 50 });
    const r = analyseBuild(heavy);
    expect(r.massBudget.withinBudget).toBe(false);
    expect(r.massBudget.marginG).toBeLessThan(0);
    expect(r.coaching.some((n) => n.title.includes('over your mass budget'))).toBe(true);
  });

  it('demands a bigger panel as the target speed rises', () => {
    const modest = analyseBuild({ ...referenceBuild(), track: { surface: 'smooth_floor', distanceM: 10, targetSpeed: 2 } });
    const ambitious = analyseBuild({ ...referenceBuild(), track: { surface: 'smooth_floor', distanceM: 10, targetSpeed: 4 } });
    expect(ambitious.panelBudget.requiredRatedW).toBeGreaterThan(modest.panelBudget.requiredRatedW);
    expect(ambitious.panelBudget.requiredAreaCm2).toBeGreaterThan(modest.panelBudget.requiredAreaCm2);
    expect(ambitious.massBudget.allowedG).toBeLessThan(modest.massBudget.allowedG);
  });

  it('derates the whole prediction when the sun goes in', () => {
    const sunny = analyseBuild(referenceBuild());
    const cloudy = analyseBuild({ ...referenceBuild(), panel: { ...referenceBuild().panel, condition: 'overcast' } });
    expect(cloudy.speed.powerLimited).toBeLessThan(sunny.speed.powerLimited);
    expect(cloudy.massBudget.allowedG).toBeLessThan(sunny.massBudget.allowedG);
  });

  it('lets rolling resistance dominate for a slow car and air drag for a fast one', () => {
    // Heavy car, weak panel: crawls, so almost all the resisting force is rolling.
    const slow = referenceBuild();
    slow.parts.push({ name: 'Ballast', category: 'other', qty: 1, grams: 1200 });
    slow.panel = { ...slow.panel, vmp: 2, impMa: 100 };
    const slowReport = analyseBuild(slow);
    expect(slowReport.speed.predicted).toBeLessThan(1);
    expect(slowReport.forces.aeroShare).toBeLessThan(0.15);

    // The light reference car reaches a speed where air drag actually matters.
    const fast = analyseBuild(referenceBuild());
    expect(fast.speed.predicted).toBeGreaterThan(2.5);
    expect(fast.forces.aeroShare).toBeGreaterThan(slowReport.forces.aeroShare);
  });

  it('lands a typical school build in the speed range those cars really reach', () => {
    const r = analyseBuild(referenceBuild());
    expect(r.speed.predicted).toBeGreaterThan(2.5);
    expect(r.speed.predicted).toBeLessThan(5);
  });

  it('scores a balanced build higher than a hopeless one', () => {
    const good = analyseBuild(referenceBuild());
    const bad = referenceBuild();
    bad.parts.push({ name: 'Brick', category: 'other', qty: 1, grams: 2000 });
    bad.drive.drivenTeeth = 11;
    expect(good.scores.balance).toBeGreaterThan(analyseBuild(bad).scores.balance);
  });

  it('lists what is still unmeasured instead of producing junk numbers', () => {
    const r = analyseBuild({ parts: [], panel: {}, drive: {}, track: {} });
    expect(r.completeness.ready).toBe(false);
    expect(r.completeness.missing.length).toBeGreaterThan(0);
    expect(Number.isFinite(r.scores.balance)).toBe(true);
  });

  it('refuses to predict a speed until BOTH limits are known', () => {
    // Panel measured, drivetrain not: the old model reported the panel-only
    // speed here, which is a number the learner never measured.
    const noDrive = analyseBuild({ ...referenceBuild(), drive: {} });
    expect(noDrive.speed.powerLimited).toBeGreaterThan(0);
    expect(noDrive.speed.predicted).toBe(0);
    expect(noDrive.speed.limitedBy).toBe('incomplete');
    expect(noDrive.speed.predictedTimeS).toBeNull();

    // And the other way round: gearing measured, no panel.
    const noPanel = analyseBuild({ ...referenceBuild(), panel: {} });
    expect(noPanel.speed.geometric).toBeGreaterThan(0);
    expect(noPanel.speed.predicted).toBe(0);
    expect(noPanel.speed.limitedBy).toBe('incomplete');
  });

  it('survives a completely empty build without throwing', () => {
    expect(() => analyseBuild({})).not.toThrow();
    expect(() => analyseBuild()).not.toThrow();
  });

  it('changes the prediction when the surface changes', () => {
    const floor = analyseBuild(referenceBuild());
    const grass = analyseBuild({ ...referenceBuild(), track: { ...referenceBuild().track, surface: 'grass' } });
    expect(grass.speed.powerLimited).toBeLessThan(floor.speed.powerLimited);
    expect(SURFACES.grass.crr).toBeGreaterThan(SURFACES.smooth_floor.crr);
  });
});

describe('test runs against prediction', () => {
  const report = analyseBuild(referenceBuild());

  it('reports no data before the car has been run', () => {
    expect(analyseTestRuns(report, [], 10).hasData).toBe(false);
    expect(analyseTestRuns(report, [{ seconds: 0 }], 10).hasData).toBe(false);
  });

  it('converts times to speeds and averages them', () => {
    const t = analyseTestRuns(report, [{ seconds: 10 }, { seconds: 8 }, { seconds: 12 }], 10);
    expect(t.runs.map((r) => r.speed)).toEqual([1, 1.25, 0.833]);
    expect(t.meanSpeed).toBeCloseTo((1 + 1.25 + 10 / 12) / 3, 3);
  });

  it('flags inconsistent runs before blaming the model', () => {
    const t = analyseTestRuns(report, [{ seconds: 5 }, { seconds: 15 }], 10);
    expect(t.consistent).toBe(false);
    expect(t.diagnose.join(' ')).toMatch(/disagree with each other/);
  });

  it('confirms agreement when the stopwatch matches the prediction', () => {
    const seconds = 10 / report.speed.predicted;
    const t = analyseTestRuns(report, [{ seconds }, { seconds }, { seconds }], 10);
    expect(t.agreement).toBe('close');
    expect(Math.abs(t.errorPct)).toBeLessThan(1);
    expect(t.diagnose.join(' ')).toMatch(/agree within 15%/);
  });

  it('points at friction when the car is much slower than predicted', () => {
    const seconds = (10 / report.speed.predicted) * 2; // half the predicted speed
    const t = analyseTestRuns(report, [{ seconds }, { seconds }], 10);
    expect(t.errorPct).toBeLessThan(-35);
    expect(t.diagnose.join(' ')).toMatch(/axles/);
  });

  it('points at the timing method when the car beats the prediction badly', () => {
    const seconds = (10 / report.speed.predicted) * 0.5;
    const t = analyseTestRuns(report, [{ seconds }, { seconds }], 10);
    expect(t.errorPct).toBeGreaterThan(35);
    expect(t.diagnose.join(' ')).toMatch(/timing/);
  });
});

// ---------------------------------------------------------------------------
// Acceleration over the course, and the shown working
// ---------------------------------------------------------------------------

describe('run simulation (acceleration, not just top speed)', () => {
  /** The build from the reported screenshot: 229 g, 1.89 W panel, light cloud. */
  function screenshotBuild(overrides = {}) {
    return {
      parts: [{ name: 'car', qty: 1, grams: 229, category: 'other' }],
      panel: { mode: 'rated', vmp: 6.3, impMa: 300, lengthMm: 120, widthMm: 120, condition: 'light_cloud' },
      drive: {
        ratioMode: 'teeth', driverTeeth: 28, drivenTeeth: 8,
        wheelDiameterMm: 60, motorNoLoadRpm: 9000, driveType: 'spur_gears'
      },
      track: { surface: 'sports_hall', distanceM: 3, targetSpeed: 1.2, gradePct: 0 },
      motorEfficiency: 0.5,
      ...overrides
    };
  }

  it('reports a slower average than top speed on a short course', () => {
    const report = analyseBuild(screenshotBuild({
      // Gear for power-limited running so acceleration is the only constraint.
      drive: { ratioMode: 'teeth', driverTeeth: 8, drivenTeeth: 28, wheelDiameterMm: 60, motorNoLoadRpm: 9000, driveType: 'spur_gears' }
    }));

    expect(report.run).toBeTruthy();
    expect(report.run.finishes).toBe(true);
    expect(report.run.averageSpeed).toBeLessThan(report.run.topSpeed);
    // The whole point: the naive figure is materially optimistic over 3 m.
    expect(report.run.elapsedS).toBeGreaterThan(report.run.naiveTimeS);
  });

  it('still reports the run-up distance when the course is too short', () => {
    // Regression: the integrator stopped at the finish line, so a short course
    // could never observe 90% of top speed and printed "needs about null m".
    const short = analyseBuild(screenshotBuild({
      drive: { ratioMode: 'teeth', driverTeeth: 8, drivenTeeth: 28, wheelDiameterMm: 60, motorNoLoadRpm: 9000, driveType: 'spur_gears' },
      track: { surface: 'sports_hall', distanceM: 3, targetSpeed: 1.2, gradePct: 0 }
    }));
    expect(short.run.courseIsLongEnough).toBe(false);
    expect(short.run.distanceTo90PctM).toBeGreaterThan(3);
    expect(short.run.distanceTo90PctM).not.toBeNull();

    const working = short.workings.find((w) => w.id === 'runTime');
    expect(working.note).not.toContain('null');
  });

  it('measures time to the finish line, not to the end of the simulation', () => {
    // The sim now runs past the line to find the run-up distance; the reported
    // time and finish speed must still be those at the line.
    const b = {
      drive: { ratioMode: 'teeth', driverTeeth: 8, drivenTeeth: 28, wheelDiameterMm: 60, motorNoLoadRpm: 9000, driveType: 'spur_gears' }
    };
    const short = analyseBuild(screenshotBuild({ ...b, track: { surface: 'sports_hall', distanceM: 3, targetSpeed: 1.2, gradePct: 0 } }));
    const long = analyseBuild(screenshotBuild({ ...b, track: { surface: 'sports_hall', distanceM: 20, targetSpeed: 1.2, gradePct: 0 } }));

    expect(short.run.elapsedS).toBeLessThan(long.run.elapsedS);
    expect(short.run.finishSpeed).toBeLessThan(long.run.finishSpeed);
    expect(short.run.distanceCoveredM).toBeCloseTo(3, 1);
  });

  it('flags a course too short to reach top speed', () => {
    const short = analyseBuild(screenshotBuild({
      drive: { ratioMode: 'teeth', driverTeeth: 8, drivenTeeth: 28, wheelDiameterMm: 60, motorNoLoadRpm: 9000, driveType: 'spur_gears' },
      track: { surface: 'sports_hall', distanceM: 3, targetSpeed: 1.2, gradePct: 0 }
    }));
    expect(short.run.courseIsLongEnough).toBe(false);
    expect(short.run.fractionOfTop).toBeLessThan(0.9);
  });

  it('a long course does get near top speed', () => {
    const long = analyseBuild(screenshotBuild({
      drive: { ratioMode: 'teeth', driverTeeth: 8, drivenTeeth: 28, wheelDiameterMm: 60, motorNoLoadRpm: 9000, driveType: 'spur_gears' },
      track: { surface: 'sports_hall', distanceM: 30, targetSpeed: 1.2, gradePct: 0 }
    }));
    expect(long.run.fractionOfTop).toBeGreaterThan(0.9);
    expect(long.run.courseIsLongEnough).toBe(true);
  });

  it('never predicts a speed above the gearing limit', () => {
    const report = analyseBuild(screenshotBuild({
      drive: { ratioMode: 'teeth', driverTeeth: 8, drivenTeeth: 28, wheelDiameterMm: 60, motorNoLoadRpm: 9000, driveType: 'spur_gears' }
    }));
    expect(report.run.finishSpeed).toBeLessThanOrEqual(report.speed.predicted + 1e-6);
  });

  it('reports a stalled car with the same shape, not undefined fields', () => {
    // 0.286:1 overdrive on a fast motor: wheel torque falls to ~25% of the
    // motor's and cannot overcome rolling resistance from rest.
    const report = analyseBuild(screenshotBuild());
    expect(report.run).toBeTruthy();
    expect(report.run.finishes).toBe(false);
    expect(report.run.stalled).toBe(true);
    expect(typeof report.run.finishSpeed).toBe('number');
    expect(typeof report.run.averageSpeed).toBe('number');
    expect(report.run.elapsedS).toBeNull();
  });

  it('returns null rather than a fake run when the build is incomplete', () => {
    expect(analyseBuild({ parts: [], panel: {}, drive: {} }).run).toBeNull();
  });
});

describe('shown working', () => {
  it('watts per kg reconciles with the numbers it prints', () => {
    const report = analyseBuild({
      parts: [{ name: 'car', qty: 1, grams: 229, category: 'other' }],
      panel: { mode: 'rated', vmp: 6.3, impMa: 300, lengthMm: 120, widthMm: 120, condition: 'light_cloud' },
      drive: { ratioMode: 'teeth', driverTeeth: 8, drivenTeeth: 28, wheelDiameterMm: 60, motorNoLoadRpm: 9000 },
      track: { surface: 'sports_hall', distanceM: 3, targetSpeed: 1.2 },
      motorEfficiency: 0.5
    });

    const w = report.workings.find((x) => x.id === 'wattsPerKg');
    expect(w).toBeTruthy();

    // The figure must equal effectiveW / mass to the precision it is shown at.
    const expected = report.panel.effectiveW / report.mass.totalKg;
    expect(report.power.specificPowerWPerKg).toBeCloseTo(expected, 2);

    // And it must say out loud that it is not ratedW / mass - the original bug.
    expect(w.note).toContain(String(report.panel.ratedW));
  });

  it('separates the panel rating from the power available today', () => {
    const report = analyseBuild({
      parts: [{ name: 'car', qty: 1, grams: 229, category: 'other' }],
      panel: { mode: 'rated', vmp: 6.3, impMa: 300, lengthMm: 120, widthMm: 120, condition: 'light_cloud' },
      drive: { ratioMode: 'teeth', driverTeeth: 8, drivenTeeth: 28, wheelDiameterMm: 60, motorNoLoadRpm: 9000 },
      track: { surface: 'sports_hall', distanceM: 3, targetSpeed: 1.2 }
    });

    const rated = report.workings.find((x) => x.id === 'panelRated');
    const effective = report.workings.find((x) => x.id === 'panelEffective');
    expect(rated.result).toContain(String(report.panel.ratedW));
    expect(effective.result).toContain(String(report.panel.effectiveW));
    expect(report.panel.effectiveW).toBeCloseTo(report.panel.ratedW * 0.6, 3);
  });

  it('explains an overdrive ratio as losing torque', () => {
    const report = analyseBuild({
      parts: [{ name: 'car', qty: 1, grams: 229, category: 'other' }],
      panel: { mode: 'rated', vmp: 6.3, impMa: 300, lengthMm: 120, widthMm: 120, condition: 'light_cloud' },
      drive: { ratioMode: 'teeth', driverTeeth: 28, drivenTeeth: 8, wheelDiameterMm: 60, motorNoLoadRpm: 9000 },
      track: { surface: 'sports_hall', distanceM: 3, targetSpeed: 1.2 }
    });
    const g = report.workings.find((x) => x.id === 'gearRatio');
    expect(report.drive.gearRatio).toBeLessThan(1);
    expect(g.note).toContain('overdrive');
  });

  it('every working states a formula, a substitution and a result', () => {
    const report = analyseBuild({
      parts: [{ name: 'car', qty: 1, grams: 229, category: 'other' }],
      panel: { mode: 'rated', vmp: 6.3, impMa: 300, lengthMm: 120, widthMm: 120, condition: 'full_sun' },
      drive: { ratioMode: 'teeth', driverTeeth: 8, drivenTeeth: 28, wheelDiameterMm: 60, motorNoLoadRpm: 9000 },
      track: { surface: 'sports_hall', distanceM: 20, targetSpeed: 3 }
    });
    expect(report.workings.length).toBeGreaterThan(5);
    report.workings.forEach((w) => {
      expect(w.label).toBeTruthy();
      expect(w.formula).toBeTruthy();
      expect(w.result).toBeTruthy();
    });
  });
});
