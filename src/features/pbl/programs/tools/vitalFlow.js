/**
 * Hands-on tools for "Project Vital Flow": pure functions, unit-tested in
 * tests/program-tools-vital-flow.test.js. The UI is VitalFlowTools.jsx.
 *
 * Content comes from Don's program file: the 4 pump options, the 4 valve
 * options (with their backflow prevention and pressure drop), the 5 vascular
 * zones with their distance from the heart, and the week 3 success metrics
 * (0 leaks, all 20 digits perfused within 30 seconds, visible venous return).
 * Imported as-is, never edited.
 *
 * The bench and the pressure view are a teaching model: simple arithmetic on
 * those numbers plus three knobs the learner tunes to match their own rig.
 * The stress test holds only what the team measured.
 */
import {
  VITAL_FLOW_GAMIFICATION_BADGES, VITAL_FLOW_PUMP_OPTIONS, VITAL_FLOW_VALVE_OPTIONS, VITAL_FLOW_VASCULAR_PATHWAYS
} from '../../../../../prototypes/DonPBL/vitalFlowProgram.ts';
import { SESSION_XP, int, num, bool, pick, idList, round, normalizeBadges, makeEarnedBadges, weekSessions, sessionToolMap } from './kit.js';

export const PROGRAM_ID = 'project-vital-flow-2026';
export { SESSION_XP };
export const BADGES = normalizeBadges(VITAL_FLOW_GAMIFICATION_BADGES);
export const PUMPS = VITAL_FLOW_PUMP_OPTIONS;
export const VALVES = VITAL_FLOW_VALVE_OPTIONS;
export const ZONES = [...VITAL_FLOW_VASCULAR_PATHWAYS].sort((a, b) => a.distanceFromHeartCm - b.distanceFromHeartCm)
  .map((z) => ({ ...z, short: z.zoneName.replace(/^\d+\.\s*/, '').replace(/\s*\(.*\)$/, '') }));
const PUMP_IDS = PUMPS.map((p) => p.id);
const VALVE_IDS = VALVES.map((v) => v.id);
const ZONE_IDS = ZONES.map((z) => z.id);
const DEFAULT_VALVE = 'valve-rubber-flap';

/* -------------------------------------------------------------- Pump bench */

export const BPM = { min: 40, max: 160 };
export const STROKE = { min: 40, max: 100 };

export function cleanBench(d) {
  const pumpId = pick(d?.pumpId, PUMP_IDS);
  return {
    pumpId,
    valveId: pick(d?.valveId, VALVE_IDS, DEFAULT_VALVE),
    bpm: int(d?.bpm, BPM.min, BPM.max) ?? 70,
    strokeMl: int(d?.strokeMl, STROKE.min, STROKE.max) ?? 55,
    loopMl: int(d?.loopMl, 100, 3000) ?? 600
  };
}

/**
 * Each squeeze pushes the stroke volume forward; the valve lets some of it
 * slosh back (100% - its backflow prevention). What is left is the net flow.
 * One circuit = the tubing's total volume / net flow.
 */
export function benchReport(b) {
  const valve = VALVES.find((v) => v.id === b.valveId);
  const keep = valve.backflowPreventionPct / 100;
  const forward = b.bpm * b.strokeMl;
  const net = Math.round(forward * keep);
  return {
    valve,
    forwardMlMin: forward,
    backflowMlBeat: round(b.strokeMl * (1 - keep), 1),
    backflowPct: 100 - valve.backflowPreventionPct,
    netMlMin: net,
    netLMin: round(net / 1000, 2),
    strokesPerCircuit: Math.ceil(b.loopMl / (b.strokeMl * keep)),
    circuitSec: net > 0 ? Math.round((b.loopMl / net) * 60) : null,
    regurgitant: valve.backflowPreventionPct < 50
  };
}

/* ------------------------------------------------------ Pressure inspector */

export function cleanPressure(d) {
  return {
    pumpId: pick(d?.pumpId, PUMP_IDS, PUMP_IDS[0]),
    valveId: pick(d?.valveId, VALVE_IDS, DEFAULT_VALVE),
    /** mmHg lost for every 10 cm of tubing and branching. */
    lossPer10cm: num(d?.lossPer10cm, 0.5, 8) ?? 3,
    /** How much of the peak pressure stretchy tubing holds between beats, with a perfect valve. */
    recoilPct: int(d?.recoilPct, 20, 90) ?? 65,
    /** Pressure needed to push dyed water through the 2.5 mm micro-straws. */
    needMmHg: int(d?.needMmHg, 5, 80) ?? 30,
    zoneId: pick(d?.zoneId, ZONE_IDS, ZONE_IDS[0])
  };
}

/** Mean arterial pressure: diastolic plus one third of the pulse pressure. */
export const meanArterial = (sys, dia) => Math.round(dia + (sys - dia) / 3);

export function pressureReport(p) {
  const pump = PUMPS.find((x) => x.id === p.pumpId);
  const valve = VALVES.find((x) => x.id === p.valveId);
  const atHeart = pump.peakSystolicMmHg - valve.forwardPressureDropMmHg;
  const zones = ZONES.map((z) => {
    const sys = Math.max(0, Math.round(atHeart - (z.distanceFromHeartCm / 10) * p.lossPer10cm));
    const dia = Math.round(sys * (p.recoilPct / 100) * (valve.backflowPreventionPct / 100));
    const map = meanArterial(sys, dia);
    return { id: z.id, short: z.short, distanceCm: z.distanceFromHeartCm, sys, dia, map, perfused: map >= p.needMmHg };
  });
  return { pump, valve, atHeart, zones, dry: zones.filter((z) => !z.perfused).map((z) => z.short), allPerfused: zones.every((z) => z.perfused) };
}

/* ----------------------------------------------------- 60-second stress test */

export const TEST_SECONDS = 60;
export const WINDOWS = ['0–20 s', '20–40 s', '40–60 s'];
export const DIGITS = 20;
export const REACH_LIMIT_SEC = 30;
export const FATIGUE = [
  { id: 'none', label: 'No damage' },
  { id: 'kinked', label: 'Kinked tube' },
  { id: 'ballooned', label: 'Ballooned ("aneurysm")' },
  { id: 'split', label: 'Split or popped off' }
];
const FATIGUE_IDS = FATIGUE.map((f) => f.id);
export const VERSIONS = [{ id: 'v1', label: 'Prototype V1.0' }, { id: 'v2', label: 'Prototype V2.0' }];

function cleanRun(r) {
  return {
    ran: bool(r?.ran),
    bpm: int(r?.bpm, 0, 300),
    reachSec: int(r?.reachSec, 0, 600),
    digits: int(r?.digits, 0, DIGITS),
    ml: WINDOWS.map((_, i) => int(r?.ml?.[i], 0, 5000)),
    leaks: idList(r?.leaks, ZONE_IDS),
    fatigue: pick(r?.fatigue, FATIGUE_IDS),
    venous: bool(r?.venous)
  };
}

export function cleanTest(d) {
  return { version: pick(d?.version, ['v1', 'v2'], 'v1'), v1: cleanRun(d?.v1), v2: cleanRun(d?.v2) };
}

export function runReport(r) {
  const logged = r.ml.every((m) => m != null);
  const total = logged ? r.ml.reduce((s, m) => s + m, 0) : null;
  const mean = logged ? total / WINDOWS.length : 0;
  /** 100% = the same output in every 20-second window. */
  const stabilityPct = logged && mean > 0 ? Math.max(0, Math.round(100 - ((Math.max(...r.ml) - Math.min(...r.ml)) / mean) * 100)) : null;
  const complete = r.ran && logged && r.bpm != null && r.reachSec != null && r.digits != null && r.fatigue != null;
  return {
    complete, flowMlMin: total, stabilityPct,
    perfusionPct: r.digits != null ? Math.round((r.digits / DIGITS) * 100) : null,
    reachOk: r.reachSec != null && r.reachSec <= REACH_LIMIT_SEC,
    leakCount: r.leaks.length,
    pass: complete && r.digits === DIGITS && r.reachSec <= REACH_LIMIT_SEC && r.leaks.length === 0 && r.venous
  };
}

/** V1 against V2, one row per measure; `better` is 'v1', 'v2' or null. */
export function compareRuns(d) {
  const a = runReport(d.v1); const b = runReport(d.v2);
  const row = (label, x, y, higherIsBetter, unit = '') => ({
    label, v1: x == null ? '–' : `${x}${unit}`, v2: y == null ? '–' : `${y}${unit}`,
    better: x == null || y == null || x === y ? null : (y > x) === higherIsBetter ? 'v2' : 'v1'
  });
  return [
    row('Digits perfused (of 20)', d.v1.digits, d.v2.digits, true),
    row('Time to reach the toes', d.v1.reachSec, d.v2.reachSec, false, ' s'),
    row('Distal output', a.flowMlMin, b.flowMlMin, true, ' mL/min'),
    row('Flow stability', a.stabilityPct, b.stabilityPct, true, '%'),
    row('Leak points', d.v1.ran ? a.leakCount : null, d.v2.ran ? b.leakCount : null, false),
    row('Pump rate', d.v1.bpm, d.v2.bpm, true, ' BPM')
  ];
}

/* ----------------------------------------------------------------- Badges */

const AUTO = {
  'badge-reach-the-toes': (t) => !!t['stress-test'] && runReport(cleanTest(t['stress-test']).v2).pass
};
export const autoBadge = (id) => id in AUTO;
export const earnedBadges = makeEarnedBadges(BADGES, AUTO);

export const TOOLS = [
  { id: 'pressure-inspector', emoji: '🫀', title: 'Vascular Zones & Pressure Inspector', blurb: 'Follow blood through 5 zones and see where the pressure runs out.', sessions: weekSessions(1, 2, 6) },
  { id: 'pump-bench', emoji: '⚙️', title: 'Pulsatile Pump & Valve Bench', blurb: 'Set the pump rate and stroke, swap valves, and watch the backflow.', sessions: weekSessions(4, 5) },
  { id: 'stress-test', emoji: '⏱️', title: '60-Second Perfusion Stress Test', blurb: 'Time a 60-second run, log what you measured, and compare V1 with V2.', sessions: weekSessions(10, 11) }
];
export const SESSION_TOOLS = sessionToolMap(TOOLS);

export const VOCAB = [
  { en: 'artery', th: 'หลอดเลือดแดง' },
  { en: 'vein', th: 'หลอดเลือดดำ' },
  { en: 'capillary', th: 'หลอดเลือดฝอย' },
  { en: 'valve', th: 'ลิ้นหัวใจ', note: 'a one-way door for blood' },
  { en: 'backflow', th: 'การไหลย้อนกลับ' },
  { en: 'blood pressure', th: 'ความดันโลหิต' },
  { en: 'perfusion', th: 'การไหลเวียนเลือดไปเลี้ยงเนื้อเยื่อ' },
  { en: 'leak', th: 'รั่ว' }
];
