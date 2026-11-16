/** Hands-on tools for Project Vital Flow (programs/tools/vitalFlow.js). */
import { describe, it, expect } from 'vitest';
import * as m from '../src/features/pbl/programs/tools/vitalFlow.js';
import { expectKitWiring, expectStorable, withTools } from './program-tools-shared.js';

const {
  PUMPS, VALVES, ZONES, cleanBench, benchReport, cleanPressure, pressureReport, meanArterial, cleanTest, runReport, compareRuns, DIGITS, REACH_LIMIT_SEC, earnedBadges
} = m;

const goodRun = { ran: true, bpm: 72, reachSec: 24, digits: DIGITS, ml: [60, 58, 62], leaks: [], fatigue: 'none', venous: true };

describe('content wiring', () => {
  it('reads Don\'s badges, 4 pumps, 4 valves and 5 zones ordered by distance', () => {
    expectKitWiring(m, { auto: ['badge-reach-the-toes'] });
    expect(PUMPS).toHaveLength(4);
    expect(VALVES).toHaveLength(4);
    expect(ZONES.map((z) => z.distanceFromHeartCm)).toEqual([28, 35, 42, 78, 135]);
  });
});

describe('pump and valve bench', () => {
  it('keeps the rate in 40-160 BPM and the stroke in 40-100 mL', () => {
    expect(cleanBench({ bpm: 500, strokeMl: 5 })).toMatchObject({ bpm: 160, strokeMl: 40 });
    expect(cleanBench({ bpm: 'fast', valveId: 'magic', pumpId: 'jetpack' })).toMatchObject({ bpm: 70, valveId: 'valve-rubber-flap', pumpId: null });
  });

  it('works out net flow, backflow and circuit time from the valve\'s own figures', () => {
    const r = benchReport(cleanBench({ bpm: 60, strokeMl: 50, valveId: 'valve-rubber-flap', loopMl: 600 }));
    expect(r.forwardMlMin).toBe(3000);
    expect(r.netMlMin).toBe(2820);
    expect(r.backflowMlBeat).toBe(3);
    expect(r.strokesPerCircuit).toBe(13);
    expect(r.circuitSec).toBe(13);
    expect(r.regurgitant).toBe(false);
    const open = benchReport(cleanBench({ bpm: 60, strokeMl: 50, valveId: 'valve-none-control' }));
    expect(open).toMatchObject({ regurgitant: true, backflowPct: 82, netMlMin: 540 });
  });
});

describe('pressure inspector', () => {
  it('uses the standard mean arterial pressure formula', () => {
    expect(meanArterial(120, 80)).toBe(93);
    expect(meanArterial(90, 60)).toBe(70);
  });

  it('loses pressure with distance, never goes negative, and names the dry zones', () => {
    const r = pressureReport(cleanPressure({ pumpId: 'pump-glove-ventricle', valveId: 'valve-rubber-flap', lossPer10cm: 3, recoilPct: 65, needMmHg: 40 }));
    expect(r.atHeart).toBe(89);
    expect(r.zones[0]).toMatchObject({ distanceCm: 28, sys: 81 });
    expect(r.zones.map((z) => z.sys)).toEqual([...r.zones.map((z) => z.sys)].sort((a, b) => b - a));
    expect(r.zones.at(-1).distanceCm).toBe(135);
    // Toes: 89 - 13.5 x 3 = 49 systolic, 30 diastolic, MAP 36: under the 40 needed.
    expect(r.zones.at(-1)).toMatchObject({ sys: 49, dia: 30, map: 36, perfused: false });
    expect(r.dry).toHaveLength(1);
    expect(r.allPerfused).toBe(false);
    for (const z of r.zones) { expect(z.dia).toBeLessThanOrEqual(z.map); expect(z.map).toBeLessThanOrEqual(z.sys); }
    const steep = pressureReport(cleanPressure({ lossPer10cm: 999 }));
    expect(steep.zones.at(-1).sys).toBe(0);
    expect(pressureReport(cleanPressure({ lossPer10cm: 0.5, needMmHg: 5 })).allPerfused).toBe(true);
    expectStorable(m, 'pressure-inspector', cleanPressure({ zoneId: ZONES[4].id }));
  });
});

describe('60-second stress test', () => {
  it('cleans what was typed and reports flow, stability and perfusion', () => {
    const d = cleanTest({ version: 'v9', v1: { ...goodRun, digits: 99, ml: [60, 'x', 62], leaks: ['zone-lower-extremities', 'elbow'], fatigue: 'melted' } });
    expect(d.version).toBe('v1');
    expect(d.v1.digits).toBe(20);
    expect(d.v1.ml).toEqual([60, null, 62]);
    expect(d.v1.leaks).toEqual(['zone-lower-extremities']);
    expect(d.v1.fatigue).toBeNull();
    expect(runReport(d.v1)).toMatchObject({ complete: false, flowMlMin: null, stabilityPct: null });
    const r = runReport(cleanTest({ v2: goodRun }).v2);
    expect(r).toMatchObject({ complete: true, flowMlMin: 180, perfusionPct: 100, reachOk: true, leakCount: 0, pass: true });
    expect(r.stabilityPct).toBe(93);
    expect(runReport(cleanTest({ v1: { ...goodRun, ml: [0, 0, 0] } }).v1).stabilityPct).toBeNull();
  });

  it('passes only with 20 digits inside 30 seconds, zero leaks and venous return', () => {
    const pass = (patch) => runReport(cleanTest({ v2: { ...goodRun, ...patch } }).v2).pass;
    expect(pass({})).toBe(true);
    expect(pass({ digits: 19 })).toBe(false);
    expect(pass({ reachSec: REACH_LIMIT_SEC + 1 })).toBe(false);
    expect(pass({ leaks: ['zone-cranial-carotid'] })).toBe(false);
    expect(pass({ venous: false })).toBe(false);
    expect(pass({ ran: false })).toBe(false);
  });

  it('awards the perfusion badge for V2.0 only, and compares the two versions', () => {
    expect(earnedBadges(withTools(m, { 'stress-test': { v1: goodRun } }))).toEqual([]);
    expect(earnedBadges(withTools(m, { 'stress-test': { v2: goodRun } }))).toEqual(['badge-reach-the-toes']);
    const d = cleanTest({ v1: { ...goodRun, digits: 14, reachSec: 41, ml: [30, 20, 40], leaks: ['zone-upper-extremities'] }, v2: goodRun });
    const rows = Object.fromEntries(compareRuns(d).map((r) => [r.label, r.better]));
    expect(rows['Digits perfused (of 20)']).toBe('v2');
    expect(rows['Time to reach the toes']).toBe('v2');
    expect(rows['Leak points']).toBe('v2');
    expect(rows['Pump rate']).toBeNull();
    expectStorable(m, 'stress-test', d);
  });
});
