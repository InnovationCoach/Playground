/**
 * Solar car physics + coaching engine.
 *
 * This module is deliberately pure: no DOM, no React, no network. Everything a
 * learner types goes in, a report comes out. That is what makes it testable
 * (tests/solar-car-model.test.js) and what lets the same numbers drive the UI,
 * the AI design review prompt and the coach dashboard without drifting apart.
 *
 * The old activity asked students to pick a chassis from a dropdown and showed
 * them a number that was true of nothing. This one takes the measurements from
 * the car actually sitting on their desk - masses off a kitchen scale, panel
 * dimensions off a ruler, gear teeth counted by hand, RPM off the motor's
 * datasheet - and predicts how that car will behave. The learning happens in
 * the gap between the prediction and the stopwatch.
 *
 * Every empirical constant is exported and overridable, because "where did 0.015
 * come from?" is a question a 15-year-old should be able to ask and answer.
 */

export const G = 9.81;              // m/s^2
export const AIR_DENSITY = 1.225;   // kg/m^3 at sea level, 15 C
export const STANDARD_IRRADIANCE = 1000; // W/m^2, the "1 sun" reference all panels are rated at

/**
 * Small brushed DC motors are not efficient. A 0.5 W solar motor turns roughly
 * half its electrical input into shaft work; the rest is heat in the windings
 * and brush friction. Learners can override this once they measure it.
 */
export const DEFAULT_MOTOR_EFFICIENCY = 0.5;

/**
 * A DC motor under light load does not spin at its no-load rating. 0.75 is the
 * usual classroom rule of thumb for a well-geared model car.
 */
export const LOADED_RPM_FRACTION = 0.75;

/** Fill factor for estimating max power from open-circuit / short-circuit readings. */
export const FILL_FACTOR = 0.7;

/**
 * Light conditions. `factor` scales a panel's 1-sun rating down to what it will
 * actually make today. These are the numbers that explain why the car that flew
 * on Tuesday crawls on Wednesday - the single most common source of "the app
 * lied to me" in a solar car unit.
 */
export const SUN_CONDITIONS = {
  full_sun:     { id: 'full_sun',     label: 'Full direct sun',        irradiance: 1000, factor: 1.00 },
  light_cloud:  { id: 'light_cloud',  label: 'Hazy / light cloud',     irradiance: 600,  factor: 0.60 },
  overcast:     { id: 'overcast',     label: 'Overcast',               irradiance: 200,  factor: 0.20 },
  shade:        { id: 'shade',        label: 'Open shade',             irradiance: 120,  factor: 0.12 },
  halogen:      { id: 'halogen',      label: 'Indoor halogen lamp',    irradiance: 150,  factor: 0.15 },
  led_classroom:{ id: 'led_classroom',label: 'Indoor classroom LEDs',  irradiance: 40,   factor: 0.04 }
};

/**
 * Effective rolling resistance coefficients for a model car.
 *
 * These are deliberately several times higher than the tyre figures quoted for
 * road vehicles, because on a car this small the tyre is not the main loss: a
 * plain plastic axle turning in a plastic hole, plus any wheel that is not
 * perfectly square to the axle, dominates. Treat them as a starting estimate -
 * a class that measures its own coast-down distance can and should replace them.
 *
 * Calibrated so a 200-400 g car on a 1-2 W panel lands at 2.5-4 m/s, which is
 * where Junior-Solar-Sprint-class cars actually finish.
 */
export const SURFACES = {
  smooth_floor: { id: 'smooth_floor', label: 'Smooth floor / lino',   crr: 0.030 },
  sports_hall:  { id: 'sports_hall',  label: 'Sports hall / vinyl',   crr: 0.040 },
  tarmac:       { id: 'tarmac',       label: 'Playground tarmac',     crr: 0.060 },
  short_carpet: { id: 'short_carpet', label: 'Short carpet',          crr: 0.110 },
  grass:        { id: 'grass',        label: 'Cut grass',             crr: 0.200 }
};

/** Drivetrain transmission efficiency by type. */
export const DRIVE_TYPES = {
  spur_gears:  { id: 'spur_gears',  label: 'Spur gears',        efficiency: 0.88 },
  belt_pulley: { id: 'belt_pulley', label: 'Belt and pulleys',  efficiency: 0.92 },
  worm_gear:   { id: 'worm_gear',   label: 'Worm gear',         efficiency: 0.55 },
  direct:      { id: 'direct',      label: 'Direct drive (no reduction)', efficiency: 0.97 }
};

/** Starter parts list. Every mass is a placeholder the learner overwrites. */
export const PART_TEMPLATES = [
  { name: 'Chassis / base plate', category: 'structure',   grams: 60, qty: 1 },
  { name: 'Body shell',           category: 'structure',   grams: 25, qty: 1 },
  { name: 'Solar panel',          category: 'power',       grams: 30, qty: 1 },
  { name: 'DC motor',             category: 'drivetrain',  grams: 18, qty: 1 },
  { name: 'Drive gear / pulley',  category: 'drivetrain',  grams: 3,  qty: 2 },
  { name: 'Axle',                 category: 'drivetrain',  grams: 6,  qty: 2 },
  { name: 'Wheel',                category: 'drivetrain',  grams: 9,  qty: 4 },
  { name: 'Wiring and connectors',category: 'power',       grams: 8,  qty: 1 },
  { name: 'Switch',               category: 'power',       grams: 4,  qty: 1 },
  { name: 'Fixings (screws, glue)',category: 'structure',  grams: 5,  qty: 1 }
];

export const PART_CATEGORIES = {
  structure:  { id: 'structure',  label: 'Structure' },
  drivetrain: { id: 'drivetrain', label: 'Drivetrain' },
  power:      { id: 'power',      label: 'Power' },
  other:      { id: 'other',      label: 'Other' }
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const num = (v, fallback = 0) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const round = (v, dp = 2) => {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
};

// ---------------------------------------------------------------------------
// Stage 1 - mass
// ---------------------------------------------------------------------------

/**
 * Roll up the parts list a learner has weighed.
 *
 * Returns grams (what they measured with), kilograms (what the physics needs)
 * and a per-category split, because "where is my mass?" is the question that
 * turns a parts table into a design decision.
 */
export function summariseMass(parts = []) {
  const rows = parts.map((p) => ({
    ...p,
    qty: Math.max(0, num(p.qty, 1)),
    grams: Math.max(0, num(p.grams, 0)),
    totalGrams: Math.max(0, num(p.qty, 1)) * Math.max(0, num(p.grams, 0))
  }));

  const totalGrams = rows.reduce((sum, r) => sum + r.totalGrams, 0);

  const byCategory = {};
  Object.keys(PART_CATEGORIES).forEach((c) => { byCategory[c] = 0; });
  rows.forEach((r) => {
    const cat = PART_CATEGORIES[r.category] ? r.category : 'other';
    byCategory[cat] += r.totalGrams;
  });

  const heaviest = rows.length
    ? rows.reduce((a, b) => (b.totalGrams > a.totalGrams ? b : a))
    : null;

  return {
    rows,
    totalGrams: round(totalGrams, 1),
    totalKg: totalGrams / 1000,
    byCategory,
    heaviest,
    // Share of total held by the single heaviest line - flags the one part
    // worth redesigning first.
    heaviestShare: totalGrams > 0 && heaviest ? heaviest.totalGrams / totalGrams : 0
  };
}

// ---------------------------------------------------------------------------
// Stage 2 - the panel
// ---------------------------------------------------------------------------

/**
 * Work out what a learner's panel actually delivers.
 *
 * Two entry routes, because classrooms have two kinds of panel: one with a spec
 * label (Vmp/Imp at the maximum power point) and one salvaged from a garden
 * light, where all you can do is put a multimeter across it and read open-circuit
 * volts and short-circuit amps. The second route needs the fill factor, since
 * Voc x Isc overstates real output by about 30%.
 */
export function analysePanel(panel = {}) {
  const {
    lengthMm = 0,
    widthMm = 0,
    mode = 'rated',       // 'rated' (Vmp/Imp) | 'measured' (Voc/Isc)
    vmp = 0, impMa = 0,
    voc = 0, iscMa = 0,
    condition = 'full_sun',
    fillFactor = FILL_FACTOR
  } = panel;

  const areaM2 = (num(lengthMm) * num(widthMm)) / 1e6;
  const areaCm2 = areaM2 * 1e4;

  const ratedW = mode === 'measured'
    ? num(voc) * (num(iscMa) / 1000) * clamp(num(fillFactor, FILL_FACTOR), 0.4, 0.9)
    : num(vmp) * (num(impMa) / 1000);

  const sun = SUN_CONDITIONS[condition] || SUN_CONDITIONS.full_sun;
  const effectiveW = ratedW * sun.factor;

  // Efficiency is the honesty check on the whole stage. A learner who types a
  // 6 V 250 mA rating onto a 60 x 60 mm panel has just claimed 41% efficiency,
  // which no silicon cell on earth reaches - so one of their numbers is wrong.
  const efficiency = areaM2 > 0 ? ratedW / (areaM2 * STANDARD_IRRADIANCE) : 0;

  let plausibility = 'unknown';
  if (areaM2 > 0 && ratedW > 0) {
    if (efficiency > 0.28) plausibility = 'too_high';
    else if (efficiency < 0.04) plausibility = 'too_low';
    else plausibility = 'ok';
  }

  return {
    areaM2,
    areaCm2: round(areaCm2, 1),
    ratedW: round(ratedW, 3),
    effectiveW: round(effectiveW, 3),
    efficiency,                       // 0-1
    efficiencyPct: round(efficiency * 100, 1),
    plausibility,
    condition: sun
  };
}

// ---------------------------------------------------------------------------
// Stage 3 - the drivetrain
// ---------------------------------------------------------------------------

/**
 * Gear ratio and the speed the drivetrain geometry allows.
 *
 * Note this speed has nothing to do with the sun. It is the answer to "if the
 * motor spins at its rated RPM, how fast do the wheels carry the car?" - pure
 * geometry. The next function answers "how fast can the available power push
 * this mass?". Where those two answers meet is the whole gearing lesson.
 */
export function analyseDrivetrain(drive = {}) {
  const {
    ratioMode = 'teeth',       // 'teeth' | 'diameter' | 'direct'
    driverTeeth = 0, drivenTeeth = 0,
    driverDiaMm = 0, drivenDiaMm = 0,
    wheelDiameterMm = 0,
    motorNoLoadRpm = 0,
    driveType = 'spur_gears',
    loadedFraction = LOADED_RPM_FRACTION
  } = drive;

  let gearRatio = 1;
  if (ratioMode === 'teeth' && num(driverTeeth) > 0) {
    gearRatio = num(drivenTeeth) / num(driverTeeth);
  } else if (ratioMode === 'diameter' && num(driverDiaMm) > 0) {
    gearRatio = num(drivenDiaMm) / num(driverDiaMm);
  }
  if (!Number.isFinite(gearRatio) || gearRatio <= 0) gearRatio = 1;

  const drivetrain = DRIVE_TYPES[driveType] || DRIVE_TYPES.spur_gears;
  const wheelCircumferenceM = (Math.PI * num(wheelDiameterMm)) / 1000;
  const wheelRadiusM = num(wheelDiameterMm) / 2000;

  const loadedRpm = num(motorNoLoadRpm) * clamp(num(loadedFraction, LOADED_RPM_FRACTION), 0.3, 1);
  const wheelRpm = gearRatio > 0 ? loadedRpm / gearRatio : 0;
  const geometricSpeed = (wheelRpm * wheelCircumferenceM) / 60; // m/s

  return {
    gearRatio: round(gearRatio, 3),
    driveEfficiency: drivetrain.efficiency,
    driveType: drivetrain,
    wheelCircumferenceM,
    wheelRadiusM,
    loadedRpm: round(loadedRpm, 0),
    wheelRpm: round(wheelRpm, 1),
    geometricSpeed: round(geometricSpeed, 3),
    // Torque multiplication is the other half of the bargain: every unit of
    // speed the gearing gives away comes back as force at the wheel.
    torqueMultiplier: round(gearRatio * drivetrain.efficiency, 3)
  };
}

// ---------------------------------------------------------------------------
// The power balance
// ---------------------------------------------------------------------------

/**
 * Total resisting force at speed v.
 *
 * Deliberately returns both terms separately: at 1.5 m/s rolling resistance is
 * typically 20-50x the aerodynamic term, and seeing those two numbers side by
 * side is what stops a class from spending three lessons on a pointy nose cone
 * while running on carpet.
 */
export function resistanceAt(v, { massKg, crr, dragCoefficient, frontalAreaM2 }) {
  const rolling = crr * massKg * G;
  const aero = 0.5 * AIR_DENSITY * dragCoefficient * frontalAreaM2 * v * v;
  return { rolling, aero, total: rolling + aero };
}

/**
 * Top speed the available mechanical power can sustain.
 *
 * Solves P = F(v) * v for v by bisection. Closed form exists for the cubic but
 * bisection is three lines, cannot blow up, and stays correct if someone later
 * adds another velocity-dependent loss term.
 */
export function solvePowerLimitedSpeed(mechanicalW, opts) {
  if (!(mechanicalW > 0)) return 0;
  const power = (v) => resistanceAt(v, opts).total * v;

  let lo = 0;
  let hi = 1;
  // Expand the bracket until it definitely contains the root.
  while (power(hi) < mechanicalW && hi < 200) hi *= 2;
  if (power(hi) < mechanicalW) return hi;

  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (power(mid) < mechanicalW) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Mass that the available power can carry at a target speed.
 *
 * This is `solvePowerLimitedSpeed` rearranged, and it is the number that turns
 * "make it lighter" from a slogan into a budget: it tells a team how many grams
 * they are allowed, so they can go and find them.
 */
export function massBudgetForSpeed(mechanicalW, targetSpeed, { crr, dragCoefficient, frontalAreaM2 }) {
  if (!(mechanicalW > 0) || !(targetSpeed > 0) || !(crr > 0)) return 0;
  const aero = 0.5 * AIR_DENSITY * dragCoefficient * frontalAreaM2 * targetSpeed * targetSpeed;
  const forceBudget = mechanicalW / targetSpeed - aero;
  if (forceBudget <= 0) return 0;
  return forceBudget / (crr * G);
}

/**
 * Show the working behind every headline number.
 *
 * Each entry is the symbolic formula, the learner's own values substituted into
 * it, and the result - so any figure on screen can be checked on a calculator.
 *
 * This exists because of a specific failure: the readout showed "1.89 W",
 * "229 g" and "4.95 W/kg" side by side, and 1.89/0.229 is 8.25, not 4.95. The
 * watts-per-kg figure used the sun-derated EFFECTIVE power while the tile beside
 * it showed the full-sun RATING, with nothing on screen saying so. A learner who
 * checked the arithmetic would conclude the app was broken - in an activity
 * whose whole rule is that no number appears unearned.
 */
function explainNumbers(report) {
  const fmt = (n, dp = 2) => (Number.isFinite(n) ? Number(n).toFixed(dp) : '?');
  const out = [];
  const add = (e) => { if (e) out.push(e); };

  const mass = report.mass;
  const panel = report.panel;
  const drive = report.drive;
  const power = report.power;

  add({
    id: 'mass',
    label: 'Total mass',
    formula: 'sum of (quantity x mass) for every part',
    substitution: `${mass.rows.filter((r) => r.totalGrams > 0).length} parts recorded`,
    result: `${mass.totalGrams} g = ${fmt(mass.totalKg, 3)} kg`
  });

  if (panel.ratedW > 0) {
    add({
      id: 'panelRated',
      label: 'Panel power (rating)',
      formula: panel.condition && panel.ratedW
        ? 'Vmp x Imp   (or Voc x Isc x fill factor if measured)'
        : 'Vmp x Imp',
      substitution: 'from the figures you entered for the panel',
      result: `${panel.ratedW} W at full sun`,
      note: 'This is the full-sun rating. It is not what your panel is giving you right now.'
    });

    add({
      id: 'panelEffective',
      label: 'Effective power today',
      formula: 'rated power x sun factor',
      substitution: `${panel.ratedW} W x ${fmt(panel.condition.factor, 2)} (${panel.condition.label})`,
      result: `${panel.effectiveW} W`,
      note: 'Every number below uses this, not the rating.'
    });
  }

  if (power.specificPowerWPerKg > 0) {
    add({
      id: 'wattsPerKg',
      label: 'Watts per kg',
      formula: 'effective power / total mass',
      substitution: `${panel.effectiveW} W / ${fmt(mass.totalKg, 3)} kg`,
      result: `${power.specificPowerWPerKg} W/kg`,
      note: panel.condition.factor < 1
        ? `Uses the ${panel.effectiveW} W you have today, not the ${panel.ratedW} W rating - that is why this is not ${fmt(panel.ratedW / mass.totalKg, 2)}.`
        : null
    });
  }

  if (power.mechanicalW > 0) {
    add({
      id: 'mechanical',
      label: 'Power reaching the wheels',
      formula: 'effective power x motor efficiency x drivetrain efficiency',
      substitution: `${panel.effectiveW} W x ${fmt(power.etaMotor, 2)} x ${fmt(power.etaDrive, 2)}`,
      result: `${power.mechanicalW} W`,
      note: `${fmt((1 - power.etaTotal) * 100, 0)}% is lost as heat before it ever turns a wheel.`
    });
  }

  if (drive.gearRatio > 0 && drive.wheelCircumferenceM > 0) {
    add({
      id: 'gearRatio',
      label: 'Gear ratio',
      formula: 'teeth on the driven gear / teeth on the motor pinion',
      substitution: 'from the gears you counted',
      result: `${drive.gearRatio}:1`,
      note: drive.gearRatio < 1
        ? `Below 1 means overdrive: the wheel turns ${fmt(1 / drive.gearRatio, 2)}x faster than the motor, and wheel torque drops to ${fmt(drive.gearRatio * 100, 0)}% of the motor's.`
        : `The wheel turns ${fmt(1 / drive.gearRatio, 2)}x for each motor turn, and wheel torque is ${fmt(drive.gearRatio, 2)}x the motor's.`
    });

    add({
      id: 'geometricSpeed',
      label: 'Top speed the gearing allows',
      formula: '(motor rpm under load / gear ratio) x wheel circumference / 60',
      substitution: `(${drive.loadedRpm} rpm / ${drive.gearRatio}) x ${fmt(drive.wheelCircumferenceM, 3)} m / 60`,
      result: `${drive.geometricSpeed} m/s`,
      note: 'Pure geometry - this answer does not care how much sun you have.'
    });
  }

  if (report.speed.powerLimited > 0) {
    add({
      id: 'powerSpeed',
      label: 'Top speed the power allows',
      formula: 'solve  P = (Crr x m x g + 1/2 x rho x Cd x A x v^2) x v  for v',
      substitution: `${power.mechanicalW} W = (${fmt(report.track.crr, 3)} x ${fmt(mass.totalKg, 3)} x 9.81 + 0.5 x 1.225 x ${fmt(report.forcesInput.dragCoefficient, 2)} x ${fmt(report.forcesInput.frontalAreaM2, 3)} x v^2) x v`,
      result: `${report.speed.powerLimited} m/s`,
      note: report.forces.aeroN <= report.forces.rollingN
        ? `Rolling resistance is ${report.forces.rollingN} N; air resistance only ${report.forces.aeroN} N at this speed - the floor is costing you far more than the air.`
        : `At ${report.speed.predicted} m/s air resistance (${report.forces.aeroN} N) has overtaken rolling resistance (${report.forces.rollingN} N) - fast enough that shape now matters as much as friction.`
    });
  }

  if (report.speed.predicted > 0) {
    add({
      id: 'predicted',
      label: 'Predicted top speed',
      formula: 'the smaller of the two limits above',
      substitution: `min(${report.drive.geometricSpeed} m/s gearing, ${report.speed.powerLimited} m/s power)`,
      result: `${report.speed.predicted} m/s`,
      note: report.speed.limitedBy === 'gearing'
        ? 'Your gearing is the bottleneck - the power is there but the drivetrain cannot use it.'
        : 'Your power is the bottleneck - the gearing could go faster if the panel could feed it.'
    });
  }

  const run = report.run;
  if (run && run.finishes) {
    add({
      id: 'runTime',
      label: `Time over your ${report.track.distanceM} m course`,
      formula: 'simulated from a standing start: m dv/dt = thrust - resistance',
      substitution: `starting from rest, capped at ${run.topSpeed} m/s`,
      result: `${run.elapsedS} s, averaging ${run.averageSpeed} m/s`,
      note: run.courseIsLongEnough
        ? `It reaches ${run.finishSpeed} m/s by the line.`
        : `It only reaches ${run.finishSpeed} m/s - ${fmt(run.fractionOfTop * 100, 0)}% of top speed. It needs about ${run.distanceTo90PctM} m to get near ${run.topSpeed} m/s, and your course is ${report.track.distanceM} m. Dividing distance by top speed would have predicted ${run.naiveTimeS} s, which your stopwatch would not agree with.`
    });
  }

  return out;
}

/**
 * Simulate the car actually driving the course, from a standing start.
 *
 * Why this exists: every speed above is a STEADY-STATE top speed, and a model
 * solar car needs roughly 10-13 m to get near it. On a 3 m course a car with a
 * 3.3 m/s top speed reaches only about 2.3 m/s and averages 1.6 m/s - so
 * `distance / topSpeed` predicted 0.90 s where a stopwatch reads 1.9 s.
 *
 * That error is not academic. This activity asks learners to predict a time and
 * then check it with a stopwatch; a prediction that is 2x optimistic teaches
 * them their car is broken when in fact the maths was.
 *
 * Method: forward Euler on  m dv/dt = F_thrust(v) - F_resist(v),  with thrust
 * the lesser of what the power can supply (P/v) and what the wheels can transmit
 * before slipping or stalling (the start force already computed). Speed is
 * capped at the gearing limit, which the motor cannot exceed no matter how much
 * power is available.
 */
export function simulateRun(report, { dt = 2e-4, maxSeconds = 120 } = {}) {
  const vCap = num(report?.speed?.predicted, 0);
  const distance = num(report?.track?.distanceM, 0);
  const massKg = num(report?.mass?.totalKg, 0);
  const mechanicalW = num(report?.power?.mechanicalW, 0);
  const maxThrustN = num(report?.starting?.startForceN, 0);

  if (!(vCap > 0) || !(distance > 0) || !(massKg > 0) || !(mechanicalW > 0)) return null;

  const physics = {
    massKg,
    crr: num(report.track.crr, 0.04),
    dragCoefficient: num(report.forcesInput?.dragCoefficient, 0.6),
    frontalAreaM2: num(report.forcesInput?.frontalAreaM2, 0.015)
  };

  const gradeN = massKg * G * Math.sin(Math.atan(num(report.track.gradePct, 0) / 100));

  let v = 1e-4;
  let x = 0;
  let t = 0;
  let reached90 = null;
  let finishT = null;
  let finishV = null;
  const steps = Math.ceil(maxSeconds / dt);

  // Runs past the finish line when the course is too short to reach 90% of top
  // speed, because "your course needs to be about 13 m" is the actionable
  // number for a teacher - and stopping at the line reported it as null.
  for (let i = 0; i < steps; i += 1) {
    if (x >= distance && reached90 !== null) break;
    const powerThrust = mechanicalW / v;
    const thrust = maxThrustN > 0 ? Math.min(powerThrust, maxThrustN) : powerThrust;
    const drag = resistanceAt(v, physics).total + gradeN;

    v = Math.min(vCap, Math.max(0, v + ((thrust - drag) / massKg) * dt));
    x += v * dt;
    t += dt;

    if (finishT === null && x >= distance) { finishT = t; finishV = v; }
    if (reached90 === null && v >= 0.9 * vCap) reached90 = x;

    // A car whose wheels cannot out-push the resistance never gets going. Fall
    // through rather than returning early, so the caller always gets the same
    // shape - an early return with half the fields set is how `finishSpeed`
    // silently became undefined for stalled builds.
    if (v <= 0 && i > 0) break;
  }

  const finished = finishT !== null;
  const averageSpeed = finished && finishT > 0 ? distance / finishT : 0;

  return {
    finishes: finished,
    stalled: !finished && v <= 0,
    distanceCoveredM: round(Math.min(x, distance), 2),
    topSpeed: round(vCap, 3),
    finishSpeed: round(finished ? finishV : v, 3),
    averageSpeed: round(averageSpeed, 3),
    elapsedS: finished ? round(finishT, 2) : null,
    fractionOfTop: vCap > 0 ? round((finished ? finishV : v) / vCap, 3) : 0,
    distanceTo90PctM: reached90 === null ? null : round(reached90, 1),
    // The naive figure this replaces, kept so the UI can show the gap and so the
    // regression is visible if anyone reintroduces it.
    naiveTimeS: round(distance / vCap, 2),
    courseIsLongEnough: reached90 !== null && reached90 <= distance
  };
}

// ---------------------------------------------------------------------------
// Stage 4 - the ratio challenge
// ---------------------------------------------------------------------------

/**
 * The full build report: everything above, plus the three design judgements the
 * activity is actually about.
 *
 *   1. mass vs panel  - is the panel big enough to move this much car?
 *   2. gearing        - does the drivetrain let the car reach the speed the
 *                       power allows, without asking for more than it has?
 *   3. traction/start - can it get moving at all from a standstill?
 */
export function analyseBuild(build = {}) {
  const {
    parts = [],
    panel = {},
    drive = {},
    track = {}
  } = build;

  const {
    surface = 'smooth_floor',
    distanceM = 10,
    targetSpeed = 3.0,   // a competitive model solar car pace; the class can change it
    gradePct = 0,
    dragCoefficient = 0.6,        // a boxy model car; a shaped shell gets to ~0.35
    frontalAreaM2 = 0.015,        // ~150 mm x 100 mm
    motorEfficiency = DEFAULT_MOTOR_EFFICIENCY
  } = track;

  const mass = summariseMass(parts);
  const panelReport = analysePanel(panel);
  const driveReport = analyseDrivetrain(drive);

  const surf = SURFACES[surface] || SURFACES.smooth_floor;
  const massKg = mass.totalKg;
  const etaTotal = clamp(num(motorEfficiency, DEFAULT_MOTOR_EFFICIENCY), 0.1, 0.95) * driveReport.driveEfficiency;
  const mechanicalW = panelReport.effectiveW * etaTotal;

  const physics = {
    massKg,
    crr: surf.crr,
    dragCoefficient: num(dragCoefficient, 0.6),
    frontalAreaM2: num(frontalAreaM2, 0.015)
  };

  const powerSpeed = massKg > 0 ? solvePowerLimitedSpeed(mechanicalW, physics) : 0;
  const geometricSpeed = driveReport.geometricSpeed;

  // The car does whichever is the tighter constraint: it cannot outrun its
  // gearing, and it cannot outrun its power.
  //
  // Both limits must be known before there is a prediction at all. An earlier
  // version treated an unmeasured drivetrain as "no limit" and happily reported
  // a speed derived from the panel alone - a number the learner had not earned,
  // which is the exact failure mode this activity was rewritten to remove.
  const haveGearing = geometricSpeed > 0;
  const havePower = powerSpeed > 0;
  const usableSpeed = haveGearing && havePower ? Math.min(geometricSpeed, powerSpeed) : 0;
  const limitedBy = usableSpeed === 0
    ? 'incomplete'
    : (geometricSpeed < powerSpeed ? 'gearing' : 'power');

  const predictedTimeS = usableSpeed > 0 ? num(distanceM, 10) / usableSpeed : null;

  const forces = resistanceAt(usableSpeed, physics);
  const specificPowerWPerKg = massKg > 0 ? panelReport.effectiveW / massKg : 0;

  // --- Judgement 1: mass vs panel -----------------------------------------
  const massBudgetKg = massBudgetForSpeed(mechanicalW, num(targetSpeed, 3.0), physics);
  const massMarginG = (massBudgetKg - massKg) * 1000;

  const requiredMechW = massKg > 0
    ? resistanceAt(num(targetSpeed, 3.0), physics).total * num(targetSpeed, 3.0)
    : 0;
  const requiredPanelW = etaTotal > 0 ? requiredMechW / etaTotal : 0;
  const requiredRatedW = panelReport.condition.factor > 0
    ? requiredPanelW / panelReport.condition.factor
    : 0;
  const assumedEfficiency = panelReport.plausibility === 'ok' ? panelReport.efficiency : 0.15;
  const requiredPanelAreaCm2 = assumedEfficiency > 0
    ? (requiredRatedW / (assumedEfficiency * STANDARD_IRRADIANCE)) * 1e4
    : 0;

  // --- Judgement 2: gearing ------------------------------------------------
  // The drivetrain should be geared for a top speed just above what the power
  // can sustain: enough headroom that the motor is not the ceiling, not so much
  // that it stalls trying to reach a speed the sun cannot pay for.
  const idealRatioFor = (speed) => (
    speed > 0 && driveReport.wheelCircumferenceM > 0
      ? (driveReport.loadedRpm * driveReport.wheelCircumferenceM) / (60 * speed)
      : 0
  );
  const gearWindow = {
    min: idealRatioFor(powerSpeed * 1.45),   // taller gearing than this outruns the power
    ideal: idealRatioFor(powerSpeed * 1.15),
    max: idealRatioFor(powerSpeed * 1.0)     // shorter than this throws speed away
  };
  const gearMatch = powerSpeed > 0 && geometricSpeed > 0 ? geometricSpeed / powerSpeed : 0;
  let gearVerdict = 'unknown';
  if (gearMatch > 0) {
    if (gearMatch < 0.85) gearVerdict = 'too_short';      // over-geared for torque, leaving speed unused
    else if (gearMatch > 1.6) gearVerdict = 'too_tall';   // asking for speed the panel cannot fund
    else gearVerdict = 'matched';
  }

  // --- Judgement 3: can it start? -----------------------------------------
  // For a brushed DC motor P_max = tau_stall * omega_noload / 4, so an estimate
  // of stall torque falls out of the power we already know. Flagged as an
  // estimate in the UI - learners who stall-test their motor can override it.
  const omegaNoLoad = (driveReport.loadedRpm / LOADED_RPM_FRACTION) * ((2 * Math.PI) / 60);
  const estimatedStallTorqueNm = omegaNoLoad > 0 ? (4 * mechanicalW) / omegaNoLoad : 0;
  const suppliedStall = num(drive.stallTorqueMnm, 0) / 1000;
  const stallTorqueNm = suppliedStall > 0 ? suppliedStall : estimatedStallTorqueNm;

  const wheelTorqueNm = stallTorqueNm * driveReport.gearRatio * driveReport.driveEfficiency;
  const startForceN = driveReport.wheelRadiusM > 0 ? wheelTorqueNm / driveReport.wheelRadiusM : 0;

  const theta = Math.atan(num(gradePct, 0) / 100);
  const startNeededN = massKg * G * (Math.sin(theta) + surf.crr * Math.cos(theta));
  const startMargin = startNeededN > 0 ? startForceN / startNeededN : 0;
  const maxGradePct = massKg > 0 && startForceN > 0
    ? Math.tan(Math.max(0, Math.asin(clamp(startForceN / (massKg * G) - surf.crr, -1, 1)))) * 100
    : 0;

  const report = {
    mass,
    panel: panelReport,
    drive: driveReport,
    track: { ...surf, distanceM: num(distanceM, 10), targetSpeed: num(targetSpeed, 3.0), gradePct: num(gradePct, 0) },
    power: {
      etaMotor: clamp(num(motorEfficiency, DEFAULT_MOTOR_EFFICIENCY), 0.1, 0.95),
      etaDrive: driveReport.driveEfficiency,
      etaTotal: round(etaTotal, 3),
      mechanicalW: round(mechanicalW, 3),
      specificPowerWPerKg: round(specificPowerWPerKg, 2)
    },
    speed: {
      powerLimited: round(powerSpeed, 3),
      geometric: round(geometricSpeed, 3),
      predicted: round(usableSpeed, 3),
      limitedBy,
      predictedTimeS: predictedTimeS === null ? null : round(predictedTimeS, 2)
    },
    forcesInput: {
      dragCoefficient: physics.dragCoefficient,
      frontalAreaM2: physics.frontalAreaM2
    },
    forces: {
      rollingN: round(forces.rolling, 4),
      aeroN: round(forces.aero, 4),
      totalN: round(forces.total, 4),
      aeroShare: forces.total > 0 ? round(forces.aero / forces.total, 3) : 0
    },
    massBudget: {
      allowedG: round(massBudgetKg * 1000, 0),
      actualG: mass.totalGrams,
      marginG: round(massMarginG, 0),
      withinBudget: massMarginG >= 0
    },
    panelBudget: {
      requiredRatedW: round(requiredRatedW, 3),
      actualRatedW: panelReport.ratedW,
      requiredAreaCm2: round(requiredPanelAreaCm2, 0),
      actualAreaCm2: panelReport.areaCm2,
      headroom: requiredRatedW > 0 ? round(panelReport.ratedW / requiredRatedW, 2) : 0
    },
    gearing: {
      ...gearWindow,
      min: round(gearWindow.min, 2),
      ideal: round(gearWindow.ideal, 2),
      max: round(gearWindow.max, 2),
      actual: driveReport.gearRatio,
      match: round(gearMatch, 2),
      verdict: gearVerdict
    },
    starting: {
      stallTorqueNm: round(stallTorqueNm, 5),
      stallTorqueEstimated: suppliedStall <= 0,
      startForceN: round(startForceN, 3),
      neededN: round(startNeededN, 3),
      margin: round(startMargin, 2),
      willStart: startMargin >= 1,
      maxGradePct: round(maxGradePct, 1)
    }
  };

  // Ordered: the run needs the finished report, and the coaching needs the run
  // so it can talk about the time the learner will actually stopwatch.
  report.run = simulateRun(report);
  report.workings = explainNumbers(report);
  report.completeness = assessCompleteness(report, build);
  report.scores = scoreBuild(report);
  report.coaching = coachBuild(report);

  return report;
}

/**
 * What is still missing before the numbers mean anything.
 *
 * Shown as a checklist rather than as an error: an empty field is where the
 * learner is in the process, not a mistake they have made.
 */
function assessCompleteness(report, build) {
  const missing = [];
  if (report.mass.totalGrams <= 0) missing.push({ field: 'parts', label: 'Weigh your parts and enter their masses' });
  if (report.panel.areaM2 <= 0) missing.push({ field: 'panelSize', label: 'Measure your solar panel (length x width)' });
  if (report.panel.ratedW <= 0) missing.push({ field: 'panelOutput', label: 'Enter the panel voltage and current' });
  if (num(build.drive?.wheelDiameterMm) <= 0) missing.push({ field: 'wheel', label: 'Measure your wheel diameter' });
  if (num(build.drive?.motorNoLoadRpm) <= 0) missing.push({ field: 'rpm', label: 'Find your motor RPM (datasheet or tachometer)' });
  if (build.drive?.ratioMode !== 'direct' && report.drive.gearRatio === 1) {
    missing.push({ field: 'gears', label: 'Count the teeth on your driver and driven gears' });
  }
  return {
    missing,
    ready: missing.length === 0,
    pct: Math.round(((6 - missing.length) / 6) * 100)
  };
}

/**
 * Three gauges, 100 points each, plus a bonus for evidence.
 *
 * Scoring rewards a balanced design rather than an extreme one - a featherweight
 * car with gearing it cannot use scores no better than a heavy one, which is
 * exactly the trade-off the unit is teaching.
 */
function scoreBuild(report) {
  // Power-to-weight: this is the headline "panel size vs total mass" ratio the
  // challenge is built around. 3 W/kg barely moves; 10 W/kg (say 2 W on 200 g)
  // is a quick car and takes full marks.
  const sp = report.power.specificPowerWPerKg;
  const powerScore = Math.round(clamp((sp / 10) * 100, 0, 100));

  // Gearing: full marks inside the window, falling off either side of it.
  const m = report.gearing.match;
  let gearScore = 0;
  if (m > 0) {
    if (m >= 0.85 && m <= 1.6) gearScore = 100;
    else if (m < 0.85) gearScore = Math.round(clamp((m / 0.85) * 100, 0, 100));
    else gearScore = Math.round(clamp(100 - (m - 1.6) * 40, 0, 100));
  }

  // Panel sizing: 1.0x the requirement is a pass, 1.4x is comfortable, far above
  // that means panel mass is being carried for nothing.
  const h = report.panelBudget.headroom;
  let panelScore = 0;
  if (h > 0) {
    if (h >= 1 && h <= 1.6) panelScore = 100;
    else if (h < 1) panelScore = Math.round(clamp(h * 100, 0, 100));
    else panelScore = Math.round(clamp(100 - (h - 1.6) * 30, 40, 100));
  }

  const startScore = report.starting.willStart ? 100 : Math.round(clamp(report.starting.margin * 100, 0, 99));

  const total = Math.round((powerScore + gearScore + panelScore + startScore) / 4);

  return {
    powerToWeight: powerScore,
    gearing: gearScore,
    panelSizing: panelScore,
    startability: startScore,
    balance: total,
    band: total >= 85 ? 'Tuned' : total >= 65 ? 'Workable' : total >= 40 ? 'Needs balancing' : 'Back to the bench'
  };
}

/**
 * Turn the numbers into things a 13-18 year old can go and do.
 *
 * Each note carries the figure it is based on. "Too heavy" teaches nothing;
 * "82 g over the budget your 0.9 W panel can push at 1.5 m/s" sends a team
 * looking for 82 g.
 */
function coachBuild(report) {
  const notes = [];
  const g = (n) => `${Math.abs(Math.round(n))} g`;

  if (report.panel.plausibility === 'too_high') {
    notes.push({
      level: 'check',
      title: 'Those panel numbers cannot both be right',
      body: `Your figures work out to ${report.panel.efficiencyPct}% efficiency. The best silicon cells reach about 22%, and classroom panels are 10-17%. Re-read the label, or check whether the current is in mA rather than A.`
    });
  } else if (report.panel.plausibility === 'too_low') {
    notes.push({
      level: 'check',
      title: 'Your panel looks under-rated for its size',
      body: `${report.panel.efficiencyPct}% efficiency is low even for an old cell. Check you entered millimetres, not centimetres, for the panel size.`
    });
  }

  if (report.massBudget.actualG > 0 && report.panel.effectiveW > 0) {
    if (report.massBudget.withinBudget) {
      notes.push({
        level: 'good',
        title: `You have ${g(report.massBudget.marginG)} of mass in hand`,
        body: `At ${report.track.targetSpeed} m/s on ${report.track.label.toLowerCase()}, your ${report.panel.effectiveW} W could carry ${g(report.massBudget.allowedG)}. You built ${g(report.massBudget.actualG)}. Spend that margin on something useful - a bigger wheel, a stiffer chassis - or bank it as speed.`
      });
    } else {
      notes.push({
        level: 'act',
        title: `You are ${g(report.massBudget.marginG)} over your mass budget`,
        body: `To hit ${report.track.targetSpeed} m/s your ${report.panel.effectiveW} W can only move ${g(report.massBudget.allowedG)}. Either find ${g(report.massBudget.marginG)} to remove, or step the panel up to about ${report.panelBudget.requiredRatedW} W (roughly ${report.panelBudget.requiredAreaCm2} cm² at your cell efficiency).`
      });
    }
  }

  if (report.mass.heaviestShare > 0.35 && report.mass.heaviest) {
    notes.push({
      level: 'idea',
      title: `${report.mass.heaviest.name} is ${Math.round(report.mass.heaviestShare * 100)}% of your car`,
      body: `At ${g(report.mass.heaviest.totalGrams)} it is the one part where a redesign actually moves the total. Halving it saves more than shaving every other part.`
    });
  }

  if (report.gearing.verdict === 'too_tall') {
    notes.push({
      level: 'act',
      title: 'Your gearing is asking for speed the panel cannot pay for',
      body: `The drivetrain is geared for ${report.speed.geometric} m/s, but your power only sustains ${report.speed.powerLimited} m/s. The motor will bog down and may not start. Increase the gear ratio to about ${report.gearing.ideal}:1 (bigger gear on the wheel, or a smaller pinion on the motor).`
    });
  } else if (report.gearing.verdict === 'too_short') {
    notes.push({
      level: 'act',
      title: 'Your gearing is throwing away speed you have already paid for',
      body: `You have enough power for ${report.speed.powerLimited} m/s but the drivetrain tops out at ${report.speed.geometric} m/s. Drop the ratio towards ${report.gearing.ideal}:1 - anywhere between ${report.gearing.min}:1 and ${report.gearing.max}:1 works.`
    });
  } else if (report.gearing.verdict === 'matched') {
    notes.push({
      level: 'good',
      title: `Gearing is matched at ${report.gearing.actual}:1`,
      body: `Your drivetrain tops out at ${report.speed.geometric} m/s and your power sustains ${report.speed.powerLimited} m/s. That is the balance you are looking for: a little headroom, nothing wasted.`
    });
  }

  if (report.starting.stallTorqueNm > 0 && !report.starting.willStart) {
    notes.push({
      level: 'act',
      title: 'This car may not start from a standstill',
      body: `You need ${report.starting.neededN} N at the wheels to get moving and the drivetrain delivers about ${report.starting.startForceN} N. A higher gear ratio multiplies torque - it is the same change that fixes tall gearing.`
    });
  }

  if (report.forces.aeroShare > 0 && report.forces.aeroShare < 0.1 && report.speed.predicted > 0) {
    notes.push({
      level: 'idea',
      title: 'Air drag is not your problem yet',
      body: `At ${report.speed.predicted} m/s, air resistance is only ${Math.round(report.forces.aeroShare * 100)}% of the force holding you back - the other ${Math.round((1 - report.forces.aeroShare) * 100)}% is rolling resistance. Straighter axles and freer-spinning wheels will beat any body shell at this speed.`
    });
  }

  if (report.panel.condition.factor < 0.5 && report.panel.ratedW > 0) {
    notes.push({
      level: 'check',
      title: `${report.panel.condition.label} costs you ${Math.round((1 - report.panel.condition.factor) * 100)}% of your power`,
      body: `Your ${report.panel.ratedW} W panel is only making about ${report.panel.effectiveW} W in this light. Test in the same conditions you will race in, or your numbers will not match your stopwatch.`
    });
  }

  return notes;
}

// ---------------------------------------------------------------------------
// Stage 5 - predicted vs measured
// ---------------------------------------------------------------------------

/**
 * Compare the prediction against the stopwatch.
 *
 * This is the point of the whole activity. A model that disagrees with reality
 * is not a broken model - it is a list of things the model did not know about,
 * and naming them is the engineering. `diagnose` suggests where to look based on
 * the direction and size of the error.
 */
export function analyseTestRuns(report, runs = [], distanceM) {
  const dist = num(distanceM, report?.track?.distanceM || 10);
  const valid = runs
    .map((r) => ({ ...r, seconds: num(r.seconds, 0) }))
    .filter((r) => r.seconds > 0);

  if (!valid.length) {
    return { hasData: false, runs: [], distanceM: dist };
  }

  const speeds = valid.map((r) => dist / r.seconds);
  const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const best = Math.max(...speeds);
  const worst = Math.min(...speeds);
  const spread = mean > 0 ? (best - worst) / mean : 0;

  const predicted = report?.speed?.predicted || 0;
  const errorPct = predicted > 0 ? ((mean - predicted) / predicted) * 100 : null;

  return {
    hasData: true,
    distanceM: dist,
    runs: valid.map((r, i) => ({ ...r, index: i + 1, speed: round(dist / r.seconds, 3) })),
    meanSpeed: round(mean, 3),
    bestSpeed: round(best, 3),
    worstSpeed: round(worst, 3),
    meanTimeS: round(dist / mean, 2),
    spread: round(spread, 3),
    consistent: spread < 0.15,
    predictedSpeed: predicted,
    errorPct: errorPct === null ? null : round(errorPct, 1),
    agreement: errorPct === null ? 'unknown'
      : Math.abs(errorPct) <= 15 ? 'close'
      : Math.abs(errorPct) <= 35 ? 'fair' : 'far',
    diagnose: diagnoseGap(errorPct, spread, report)
  };
}

function diagnoseGap(errorPct, spread, report) {
  const out = [];
  if (errorPct === null) return out;

  if (spread >= 0.15) {
    out.push('Your runs disagree with each other by more than 15%. Before blaming the model, look at what changed between runs: a cloud crossing the sun, a different starting push, a wheel rubbing on one side.');
  }

  if (errorPct <= -35) {
    out.push('The car is far slower than predicted. The usual causes, in order: axles not square so the wheels scrub, gears meshing too tightly, wheels rubbing the chassis, or a motor efficiency well below the 50% assumed here.');
    out.push(`Try measuring your real motor efficiency: it is the one number in this model that is a guess. Lower it until the prediction matches, and you have measured your drivetrain's losses.`);
  } else if (errorPct < -15) {
    out.push('Slower than predicted, but in the right region. Friction losses are almost always the gap - check the axles spin freely when you flick a wheel by hand.');
  } else if (errorPct > 35) {
    out.push('Faster than predicted. Check the run distance and timing method first - hand timing over a short course can easily be out by half a second. If the timing is sound, your panel may be outperforming the light condition you selected.');
  } else if (errorPct > 15) {
    out.push('A little faster than predicted, which usually means the surface is smoother than the rolling resistance figure assumes. Try the next surface up in the list and see if the prediction lands.');
  } else {
    out.push('Prediction and measurement agree within 15%. For a model built from hand measurements, that is a genuinely good result - your model of the car matches the car.');
  }

  if (report?.speed?.limitedBy === 'gearing' && errorPct < -15) {
    out.push('Your car is gearing-limited, so a slow result points at the drivetrain rather than the panel. Recount the gear teeth and re-measure the wheel diameter.');
  }

  return out;
}

/**
 * A compact, ordered summary for the AI design review and the coach view.
 *
 * Kept separate from the report so the prompt sent off-device contains build
 * measurements only - never the learner's name, class or account.
 */
export function buildSummaryForReview(report, testReport) {
  const lines = [
    `Total mass: ${report.mass.totalGrams} g`,
    `Heaviest part: ${report.mass.heaviest ? `${report.mass.heaviest.name} at ${report.mass.heaviest.totalGrams} g` : 'not recorded'}`,
    `Panel: ${report.panel.areaCm2} cm², ${report.panel.ratedW} W rated, ${report.panel.effectiveW} W in ${report.panel.condition.label}, ${report.panel.efficiencyPct}% efficient`,
    `Gear ratio: ${report.drive.gearRatio}:1 via ${report.drive.driveType.label}; wheel ${round(report.drive.wheelCircumferenceM * 1000 / Math.PI, 1)} mm diameter`,
    `Motor: ${round(report.drive.loadedRpm / LOADED_RPM_FRACTION, 0)} rpm no-load`,
    `Surface: ${report.track.label} (Crr ${report.track.crr})`,
    `Power-limited top speed: ${report.speed.powerLimited} m/s`,
    `Gearing-limited top speed: ${report.speed.geometric} m/s`,
    `Predicted speed: ${report.speed.predicted} m/s, limited by ${report.speed.limitedBy}`,
    `Specific power: ${report.power.specificPowerWPerKg} W/kg`,
    `Mass budget: ${report.massBudget.allowedG} g allowed, ${report.massBudget.actualG} g built (${report.massBudget.marginG >= 0 ? '+' : ''}${report.massBudget.marginG} g)`,
    `Gearing window: ${report.gearing.min}:1 to ${report.gearing.max}:1, ideal ${report.gearing.ideal}:1, actual ${report.gearing.actual}:1 (${report.gearing.verdict})`,
    `Balance score: ${report.scores.balance}/100 (${report.scores.band})`
  ];

  if (testReport?.hasData) {
    lines.push(`Measured over ${testReport.distanceM} m: mean ${testReport.meanSpeed} m/s across ${testReport.runs.length} runs, prediction error ${testReport.errorPct}%`);
  }

  return lines.join('\n');
}

export default {
  SUN_CONDITIONS,
  SURFACES,
  DRIVE_TYPES,
  PART_TEMPLATES,
  PART_CATEGORIES,
  summariseMass,
  analysePanel,
  analyseDrivetrain,
  resistanceAt,
  solvePowerLimitedSpeed,
  massBudgetForSpeed,
  analyseBuild,
  analyseTestRuns,
  buildSummaryForReview
};
