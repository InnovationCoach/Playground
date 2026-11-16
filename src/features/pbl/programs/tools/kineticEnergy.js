/**
 * Hands-on tools for "Kinetic & Smart Energy Harvesting": pure functions,
 * unit-tested in tests/program-tools-kinetic-energy.test.js. The UI is
 * KineticEnergyTools.jsx.
 *
 * Content comes from Don's program file: the 4 transducer options (peak
 * voltage, joules per footstep, deflection, BOM at 1 / 100 / 10,000 units),
 * the 3 site bottlenecks with their footfall and deflection notes, the diode
 * drops in the Activity 2.2 prompt (0.7 V per 1N4007, 0.25 V per 1N5819), the
 * 1000 uF capacitor and the under-5 mm trip-free limit. Imported as-is.
 *
 * In a full-wave bridge the current always passes through two diodes, so the
 * bridge costs twice the single-diode drop: 1.4 V silicon, 0.5 V Schottky.
 *
 * The charge curve is a teaching model. The ROI sums are plain arithmetic on
 * numbers the learner supplies; nothing is assumed for them without a label.
 */
import {
  KINETIC_GAMIFICATION_BADGES, KINETIC_TRANSDUCER_OPTIONS, KINETIC_SITE_BOTTLENECKS
} from '../../../../../prototypes/DonPBL/kineticEnergyProgram.ts';
import { SESSION_XP, int, num, bool, pick, idList, round, normalizeBadges, makeEarnedBadges, weekSessions, sessionToolMap } from './kit.js';

export const PROGRAM_ID = 'kinetic-smart-energy-2026';
export { SESSION_XP };
export const BADGES = normalizeBadges(KINETIC_GAMIFICATION_BADGES);
export const TRANSDUCERS = KINETIC_TRANSDUCER_OPTIONS.map((t) => ({ ...t, short: t.mechanism.replace(/\s*\(.*\)/, '') }));
const TRANSDUCER_IDS = TRANSDUCERS.map((t) => t.id);
/** Deflection limits written into each site's accessibility notes; the general limit is under 5.0 mm. */
const SITE_LIMIT_MM = { 'site-main-staircase': 3.5, 'site-cafeteria-queue': 4.5, 'site-park-plaza': 5.0 };
export const TRIP_LIMIT_MM = 5.0;
export const SITES = KINETIC_SITE_BOTTLENECKS.map((s) => ({ ...s, short: s.locationType, limitMm: SITE_LIMIT_MM[s.id] ?? TRIP_LIMIT_MM }));
const SITE_IDS = SITES.map((s) => s.id);

/* --------------------------------------------------------- Rectifier bench */

export const DIODES = [
  { id: '1n4007', label: '1N4007 silicon', dropPerDiode: 0.7 },
  { id: '1n5819', label: '1N5819 Schottky', dropPerDiode: 0.25 }
];
export const bridgeDrop = (diode) => round(diode.dropPerDiode * 2, 2);
export const CAP_FARADS = 1000e-6;
/** Activity 2.2 charges the capacitor from 50 footsteps. */
export const LAB_STEPS = 50;

export function cleanRectifier(d) {
  return {
    transducerId: pick(d?.transducerId, TRANSDUCER_IDS, TRANSDUCER_IDS[0]),
    diodeId: pick(d?.diodeId, DIODES.map((x) => x.id), '1n5819'),
    steps: int(d?.steps, 1, 200) ?? LAB_STEPS,
    /** Share of the remaining gap to full voltage that one footstep closes. */
    gainPct: int(d?.gainPct, 2, 40) ?? 8,
    /** Load across the capacitor once the footsteps stop. */
    loadKohm: num(d?.loadKohm, 1, 200) ?? 10
  };
}

/** Voltage on the capacitor after each footstep: it climbs toward (peak - bridge drop) and never past it. */
export function chargeCurve(peakV, dropV, steps, gainPct) {
  const ceiling = Math.max(0, peakV - dropV);
  const out = [0];
  for (let i = 0; i < steps; i += 1) out.push(round(out[i] + (ceiling - out[i]) * (gainPct / 100), 3));
  return out;
}

/** Discharge through a resistor: V = V0 x e^(-t / RC), sampled each second. */
export function decayCurve(v0, loadOhm, seconds = 30, cap = CAP_FARADS) {
  const tau = loadOhm * cap;
  return Array.from({ length: seconds + 1 }, (_, t) => round(v0 * Math.exp(-t / tau), 3));
}

/** Energy in a capacitor: half C V squared, in millijoules. */
export const capEnergyMj = (v, cap = CAP_FARADS) => round(0.5 * cap * v * v * 1000, 2);

export function rectifierReport(r) {
  const t = TRANSDUCERS.find((x) => x.id === r.transducerId);
  const runs = DIODES.map((diode) => {
    const drop = bridgeDrop(diode);
    const charge = chargeCurve(t.openCircuitPeakV, drop, r.steps, r.gainPct);
    const v = charge.at(-1);
    return { diode, drop, charge, v: round(v, 2), ceiling: round(Math.max(0, t.openCircuitPeakV - drop), 2), energyMj: capEnergyMj(v), lostPct: round((drop / t.openCircuitPeakV) * 100, 1) };
  });
  const [si, sch] = runs;
  const chosen = runs.find((x) => x.diode.id === r.diodeId);
  return {
    transducer: t, runs, chosen,
    decay: decayCurve(chosen.v, r.loadKohm * 1000),
    tauSec: round(r.loadKohm * 1000 * CAP_FARADS, 1),
    schottkyGainPct: si.energyMj > 0 ? Math.round(((sch.energyMj - si.energyMj) / si.energyMj) * 100) : null
  };
}

/* ------------------------------------------------------ Deflection checker */

export const ACCESS_CHECKS = [
  { id: 'wheelchair', label: 'Wheelchair rolled over it' },
  { id: 'cane', label: 'Cane user test' },
  { id: 'stroller', label: 'Stroller or cart rolled over it' },
  { id: 'bevel', label: 'Flush, beveled edges' },
  { id: 'grip', label: 'High-grip top surface' }
];
const ACCESS_IDS = ACCESS_CHECKS.map((c) => c.id);

export function cleanDeflection(d) {
  return {
    siteId: pick(d?.siteId, SITE_IDS, SITE_IDS[0]),
    measuredMm: num(d?.measuredMm, 0, 12),
    loadKg: int(d?.loadKg, 10, 150) ?? 70,
    checks: idList(d?.checks, ACCESS_IDS)
  };
}

export function deflectionReport(d) {
  const site = SITES.find((s) => s.id === d.siteId);
  const mm = d.measuredMm;
  const state = mm == null ? 'none' : mm >= TRIP_LIMIT_MM ? 'bad' : mm > site.limitMm ? 'warn' : 'ok';
  return {
    site, state,
    tripFree: mm != null && mm < TRIP_LIMIT_MM,
    siteOk: mm != null && mm <= site.limitMm,
    marginMm: mm == null ? null : round(site.limitMm - mm, 1),
    checksDone: d.checks.length, checksTotal: ACCESS_IDS.length,
    pass: mm != null && mm <= site.limitMm && mm < TRIP_LIMIT_MM && d.checks.length === ACCESS_IDS.length
  };
}

/* ------------------------------------------- Stress test and honest ROI */

export const STRESS_STEPS = 1000;
export const FOOTFALL = { min: 1000, max: 100000 };
export const SCALES = [
  { id: 'proto', label: '1 unit', key: 'unitPrototypeBomUSD' },
  { id: 'bulk100', label: '100 units', key: 'bulk100UnitCostUSD' },
  { id: 'bulk10000', label: '10,000 units', key: 'bulk10000UnitCostUSD' }
];
const J_PER_KWH = 3.6e6;

export function cleanRoi(d) {
  return {
    transducerId: pick(d?.transducerId, TRANSDUCER_IDS, TRANSDUCER_IDS[0]),
    // 1,000-footstep stress test: what the team measured.
    steps: int(d?.steps, 0, 100000) ?? 0,
    jStart: num(d?.jStart, 0, 50),
    jEnd: num(d?.jEnd, 0, 50),
    // The money model.
    useMeasured: bool(d?.useMeasured),
    footfall: int(d?.footfall, FOOTFALL.min, FOOTFALL.max) ?? 5000,
    tiles: int(d?.tiles, 1, 500) ?? 16,
    scale: pick(d?.scale, SCALES.map((s) => s.id), 'bulk100'),
    /** The learner looks up their own tariff. 0.12 USD/kWh is only a starting value. */
    gridUsdPerKwh: num(d?.gridUsdPerKwh, 0.01, 2) ?? 0.12,
    /** Yearly cost of the battery-powered footfall sensor each tile would replace. Researched by the team. */
    sensorUsdPerYear: num(d?.sensorUsdPerYear, 0, 500) ?? 0
  };
}

export function stressReport(r) {
  const logged = r.jStart != null && r.jStart > 0 && r.jEnd != null && r.jEnd >= 0;
  return {
    logged,
    complete: logged && r.steps >= STRESS_STEPS,
    fadePct: logged ? Math.round((1 - r.jEnd / r.jStart) * 100) : null
  };
}

export function roiReport(r) {
  const t = TRANSDUCERS.find((x) => x.id === r.transducerId);
  const stress = stressReport(r);
  const measured = r.useMeasured && stress.logged;
  const jPerStep = measured ? r.jEnd : t.joulesPerFootstepOrCycle;
  const unitUsd = t[SCALES.find((s) => s.id === r.scale).key];
  const costUsd = round(unitUsd * r.tiles, 2);
  const kwhYear = (r.footfall * jPerStep * r.tiles * 365) / J_PER_KWH;
  const gridUsdYear = kwhYear * r.gridUsdPerKwh;
  const sensorUsdYear = r.sensorUsdPerYear * r.tiles;
  const years = (perYear) => (perYear > 0 ? costUsd / perYear : null);
  const avgWatts = (r.footfall * jPerStep * r.tiles) / 86400;
  return {
    transducer: t, stress, measured, jPerStep, unitUsd, costUsd,
    whDay: round((r.footfall * jPerStep * r.tiles) / 3600, 1),
    kwhYear: round(kwhYear, 2),
    gridUsdYear: round(gridUsdYear, 2),
    sensorUsdYear: round(sensorUsdYear, 2),
    gridPaybackYears: years(gridUsdYear),
    totalPaybackYears: years(gridUsdYear + sensorUsdYear),
    usdPerAvgWatt: avgWatts > 0 ? Math.round(costUsd / avgWatts) : null,
    avgWatts: round(avgWatts, 2)
  };
}

/** Activity 5.1 and 5.2 together: the full stress test logged, and the money model run on the team's own number. */
export const honestRoiDone = (r) => { const s = stressReport(r); return s.complete && r.useMeasured; };

/* ----------------------------------------------------------------- Badges */

const AUTO = {
  'badge-honest-roi-analyst': (t) => !!t['roi-calculator'] && honestRoiDone(cleanRoi(t['roi-calculator']))
};
export const autoBadge = (id) => id in AUTO;
export const earnedBadges = makeEarnedBadges(BADGES, AUTO);

export const TOOLS = [
  { id: 'rectifier-bench', emoji: '🔌', title: 'Bridge Rectifier Bench', blurb: 'Silicon against Schottky diodes charging a 1000 µF capacitor, one footstep at a time.', sessions: weekSessions(3, 4) },
  { id: 'deflection-checker', emoji: '📏', title: 'Tile Deflection Checker', blurb: 'Is your tile trip-free? Check the measured dip against the under-5 mm limit.', sessions: weekSessions(7, 8) },
  { id: 'roi-calculator', emoji: '📊', title: 'Stress Test & Honest ROI', blurb: 'Log the 1,000-footstep test, then see what the energy is really worth.', sessions: weekSessions(10, 11) }
];
export const SESSION_TOOLS = sessionToolMap(TOOLS);

export const VOCAB = [
  { en: 'voltage', th: 'แรงดันไฟฟ้า' },
  { en: 'diode', th: 'ไดโอด', note: 'lets current flow one way only' },
  { en: 'rectifier', th: 'วงจรเรียงกระแส', note: 'turns AC into DC' },
  { en: 'capacitor', th: 'ตัวเก็บประจุ' },
  { en: 'deflection', th: 'ระยะยุบตัว', note: 'how far the tile dips when stepped on' },
  { en: 'footfall', th: 'จำนวนคนเดินผ่าน' },
  { en: 'payback', th: 'ระยะเวลาคืนทุน' },
  { en: 'co-benefit', th: 'ประโยชน์ร่วม' }
];
