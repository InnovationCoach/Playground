/** Hands-on tools for Robo-Buddy Companion (programs/tools/roboBuddy.js). */
import { describe, it, expect } from 'vitest';
import * as m from '../src/features/pbl/programs/tools/roboBuddy.js';
import { expectKitWiring, expectStorable, withTools } from './program-tools-shared.js';

const {
  cleanGait, gaitReport, balanceAt, whispererDone, MOVES, TRIM_TARGET, cleanPet, petMood, petTick, petAct, petDismiss, alarmDismissedBy, PET_RULES,
  PINOUTS, cleanPinout, pinoutReport, cleanBench, setTrial, benchScore, survivorDone, BENCH_TOTAL, BENCH_TARGET, earnedBadges
} = m;

describe('content wiring', () => {
  it('reads Don\'s badges and pinouts and maps tools onto real sessions', () => {
    expectKitWiring(m, { auto: ['badge-rb-90deg-whisperer', 'badge-rb-40test-survivor'] });
    expect(PINOUTS.map((p) => p.versionId)).toEqual(['microbit', 'arduino-nano']);
    for (const p of PINOUTS) expect(p.powerRuleWarning).toMatch(/4xAA \(6V\)/);
  });
});

describe('gait lab', () => {
  it('clamps trims to ±15° and drops unknown servos and moves', () => {
    const d = cleanGait({ trims: { lh: 99, rh: -99, lf: '3', rf: 'x' }, centered: ['lh', 'lh', 'tail'], move: 'fly', fromRobot: 'yes' });
    expect(d.trims).toEqual({ lh: 15, rh: -15, lf: 3, rf: 0 });
    expect(d.centered).toEqual(['lh']);
    expect(d.move).toBe('forward');
    expect(d.fromRobot).toBe(false);
    expect(cleanGait(null).trims).toEqual({ lh: 0, rh: 0, lf: 0, rf: 0 });
  });

  it('walks every move with level trims, and tips when the feet lean the wrong way', () => {
    for (const mv of MOVES) expect(gaitReport(cleanGait({ move: mv.id })).walks).toBe(true);
    expect(gaitReport(cleanGait({ trims: { lf: -5, rf: -5 } })).walks).toBe(true);
    const off = gaitReport(cleanGait({ trims: { lf: -12, rf: -12 } }));
    expect(off.walks).toBe(false);
    expect(off.inTarget).toBe(false);
    // Weight must be over the standing foot before the other one lifts.
    expect(balanceAt({ lh: 0, rh: 0, lf: 0, rf: 0 }, { com: 0, lift: 'L' }).stable).toBe(false);
    expect(balanceAt({ lh: 0, rh: 0, lf: 0, rf: 0 }, { com: 0.7, lift: 'L' }).stable).toBe(true);
  });

  it('unlocks the 90° badge only with 4 centred servos and real trims inside ±5°', () => {
    const all = ['lh', 'rh', 'lf', 'rf'];
    const good = { centered: all, fromRobot: true, trims: { lh: -2, rh: 1, lf: TRIM_TARGET, rf: -TRIM_TARGET } };
    expect(whispererDone(cleanGait(good))).toBe(true);
    expect(whispererDone(cleanGait({ ...good, fromRobot: false }))).toBe(false);
    expect(whispererDone(cleanGait({ ...good, centered: all.slice(0, 3) }))).toBe(false);
    expect(whispererDone(cleanGait({ ...good, trims: { ...good.trims, lh: 6 } }))).toBe(false);
    expect(earnedBadges(withTools(m, { 'gait-lab': good }))).toEqual(['badge-rb-90deg-whisperer']);
    expectStorable(m, 'gait-lab', cleanGait(good));
  });
});

describe('pet brain', () => {
  it('follows the week 8 thresholds, one mood at a time', () => {
    const base = cleanPet(null);
    expect(petMood(base)).toBe('happy');
    expect(petMood({ ...base, hunger: PET_RULES.hungryAt })).toBe('hungry');
    expect(petMood({ ...base, hunger: PET_RULES.hungryAt - 1 })).toBe('happy');
    expect(petMood({ ...base, energy: PET_RULES.sleepyAt })).toBe('sleepy');
    expect(petMood({ ...base, happiness: PET_RULES.boredAt })).toBe('bored');
    expect(petMood({ ...base, hunger: 90, alarm: true })).toBe('alarm');
  });

  it('petting adds 15 happiness, a flashlight feed takes 20 off hunger, and stats stay in 0-100', () => {
    const s = cleanPet({ hunger: 70, happiness: 95, energy: 500 });
    expect(s.energy).toBe(100);
    expect(petAct(s, 'pet').happiness).toBe(100);
    expect(petAct(s, 'feed').hunger).toBe(50);
    expect(petAct(cleanPet({ hunger: 5 }), 'feed').hunger).toBe(0);
    let t = cleanPet(null);
    for (let i = 0; i < 200; i += 1) t = petTick(t, 1);
    expect(t).toMatchObject({ hunger: 100, happiness: 0, energy: 0 });
    expect(t.seen).toContain('hungry');
  });

  it('dismisses the alarm after 3 head touches or a wave within 15 cm, never otherwise', () => {
    expect(alarmDismissedBy({ touches: 2, distanceCm: 16 })).toBeNull();
    expect(alarmDismissedBy({ touches: 3, distanceCm: 200 })).toBe('touch');
    expect(alarmDismissedBy({ touches: 0, distanceCm: 15 })).toBe('wave');
    const ringing = petAct(cleanPet(null), 'ring');
    expect(petMood(ringing)).toBe('alarm');
    const quiet = petDismiss(ringing, 'wave');
    expect(quiet.alarm).toBe(false);
    expect(quiet.dismissed).toEqual(['wave']);
    expect(petDismiss(ringing, 'shout')).toBe(ringing);
    expectStorable(m, 'pet-brain', cleanPet(quiet));
  });
});

describe('pinout inspector', () => {
  it('warns when servos are wired without the 4xAA rail and is ready only with every wire and the battery', () => {
    const v = PINOUTS[1];
    const all = v.pins.map((_, i) => i);
    expect(pinoutReport(cleanPinout({ version: v.versionId, wired: { [v.versionId]: [0] } })).powerRisk).toBe(true);
    expect(pinoutReport(cleanPinout({ version: v.versionId, wired: { [v.versionId]: all } })).ready).toBe(false);
    const ok = cleanPinout({ version: v.versionId, wired: { [v.versionId]: [...all, 99, -1, 'x'] }, battery: true });
    expect(ok.wired[v.versionId]).toEqual(all);
    expect(pinoutReport(ok)).toMatchObject({ ready: true, powerRisk: false });
    expect(cleanPinout({ version: 'raspberry-pi' }).version).toBe('microbit');
    expectStorable(m, 'pinout-inspector', ok);
  });
});

describe('40-point scorecard', () => {
  it('scores 20 + 10 + 10 trials and ignores bad input', () => {
    expect(BENCH_TOTAL).toBe(40);
    let d = cleanBench({ walk: 'ppfxp'.repeat(10), alarm: 42 });
    expect(d.walk).toHaveLength(20);
    expect(d.walk.slice(0, 5)).toBe('ppf-p');
    expect(d.alarm).toBe('----------');
    d = setTrial(d, 'care', 3, 'p');
    expect(setTrial(d, 'care', 30, 'p')).toBe(d);
    expect(setTrial(d, 'care', 0, 'maybe')).toBe(d);
    const r = benchScore(d);
    expect(r.parts.map((p) => p.trials)).toEqual([20, 10, 10]);
    expect(r.pass).toBe(13);
    expect(r.complete).toBe(false);
  });

  it('unlocks the survivor badge at 32 of 40 with every trial run and foot grips added', () => {
    const at = (pass) => cleanBench({ walk: 'p'.repeat(20), alarm: 'p'.repeat(10), care: 'p'.repeat(pass - 30) + 'f'.repeat(40 - pass), grips: true });
    expect(survivorDone(at(BENCH_TARGET))).toBe(true);
    expect(survivorDone(at(BENCH_TARGET - 1))).toBe(false);
    expect(survivorDone({ ...at(40), grips: false })).toBe(false);
    expect(survivorDone(cleanBench({ walk: 'p'.repeat(20), alarm: 'p'.repeat(10), care: 'pp', grips: true }))).toBe(false);
    expect(earnedBadges(withTools(m, { benchmark: at(36) }))).toEqual(['badge-rb-40test-survivor']);
    expectStorable(m, 'benchmark', at(36));
  });
});
