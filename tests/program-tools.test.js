/**
 * Hands-on tools for the Entrepreneurship PBL program (programs/tools/entrepreneurship.js).
 */
import { describe, it, expect } from 'vitest';
import {
  BADGES, LEVELS, PRESETS, SESSION_XP, cleanFriction, isCompleteFriction, topFrictions, cleanCrazy8, crazy8Done,
  presetEconomics, cleanEconomics, unitEconomics, PITCH_BLOCKS, PITCH_SECONDS, cleanPitch, runOnTime,
  earnedBadges, founderXp, founderLevel, autoBadge, SESSION_TOOLS, TOOLS, PROGRAM_ID
} from '../src/features/pbl/programs/tools/entrepreneurship.js';
import { programById } from '../src/features/pbl/programs/catalog.js';
import { newProgress, setTool, toggleSession } from '../src/features/pbl/programs/progress.js';

const program = programById(PROGRAM_ID);
const friction = (n, over = {}) => Array.from({ length: n }, (_, i) => ({ id: `f${i}`, context: `c${i}`, workaround: 'w', impact: 3, frequency: 2, ...over }));

describe('content wiring', () => {
  it('reads Don\'s badges, levels and presets, and maps tools onto real sessions', () => {
    expect(program).toBeTruthy();
    expect(BADGES).toHaveLength(7);
    expect(LEVELS[0].minXp).toBe(0);
    expect(PRESETS.length).toBeGreaterThan(0);
    const numbers = new Set(program.sessions.map((s) => s.sessionNumber));
    for (const n of Object.keys(SESSION_TOOLS)) expect(numbers.has(Number(n))).toBe(true);
    for (const t of TOOLS) for (const n of t.sessions) expect(SESSION_TOOLS[n]).toBe(t.id);
  });

  it('makes the top founder level reachable with every session and badge', () => {
    const max = program.sessions.length * SESSION_XP + BADGES.reduce((s, b) => s + b.xpAward, 0);
    expect(max).toBeGreaterThanOrEqual(LEVELS.at(-1).minXp);
  });
});

describe('friction log', () => {
  it('cleans, scores and picks the top 2 complete entries', () => {
    const d = cleanFriction({ entries: [
      { id: 'a', context: 'locker', workaround: 'kick it', impact: 9, frequency: 2 },
      { id: 'b', context: 'bus', workaround: 'stand', impact: 4, frequency: 5 },
      { id: 'c', context: 'notes', workaround: '', impact: 5, frequency: 5 },
      { id: 'd', context: 'charger', workaround: 'borrow', impact: 3, frequency: 3 }
    ] });
    expect(d.entries[0].impact).toBe(5);
    expect(isCompleteFriction(d.entries[2])).toBe(false);
    expect(topFrictions(d.entries)).toEqual(['b', 'a']);
    expect(cleanFriction({ entries: friction(40) }).entries).toHaveLength(12);
    expect(cleanFriction(null).entries).toEqual([]);
  });
});

describe('crazy 8s', () => {
  it('needs all 8 panels named and one finished sprint', () => {
    const named = Array.from({ length: 8 }, (_, i) => `idea ${i}`);
    expect(crazy8Done(cleanCrazy8({ panels: named, sprints: 0 }))).toBe(false);
    expect(crazy8Done(cleanCrazy8({ panels: named.slice(0, 7), sprints: 1 }))).toBe(false);
    expect(crazy8Done(cleanCrazy8({ panels: named, sprints: 1 }))).toBe(true);
  });
});

describe('unit economics', () => {
  it('follows the session 14 formulas', () => {
    const r = unitEconomics(cleanEconomics({ track: 'physical', items: [{ name: 'webbing', cost: 30 }, { name: 'zip', cost: 15 }],
      marginPct: 62.5, fixedTHB: 1200, cashTHB: 2500, demandWeekly: 18 }));
    expect(r.unitCost).toBe(45);
    expect(r.price).toBe(120);
    expect(r.profit).toBe(75);
    expect(r.breakEvenUnits).toBe(16);
    expect(r.weeksToBreakEven).toBe(1);
    expect(r.cash[0]).toBe(1300);
    expect(r.cash).toHaveLength(13);
    expect(r.inBand).toBe(true);
    expect(r.inBadgeRange).toBe(true);
  });

  it('never divides by zero and flags margins outside the band', () => {
    const r = unitEconomics(cleanEconomics({ track: 'digital', items: [], marginPct: 40, fixedTHB: 900, cashTHB: 0, demandWeekly: 0 }));
    expect(r.breakEvenUnits).toBeNull();
    expect(r.weeksToBreakEven).toBeNull();
    expect(r.inBand).toBe(false);
    expect(r.inBadgeRange).toBe(false);
  });

  it('starts every preset inside the margin range, but only an itemised cost earns the badge', () => {
    for (const p of PRESETS) {
      const r = unitEconomics(cleanEconomics(presetEconomics(p)));
      expect(r.inBadgeRange).toBe(true);
      expect(r.itemised).toBe(false);
    }
    const base = presetEconomics(PRESETS[0]);
    expect(earnedBadges(setTool(newProgress(PROGRAM_ID), 'unit-economics', base))).toEqual([]);
    const itemised = { ...base, items: [{ name: 'webbing', cost: 30 }, { name: 'zip', cost: 15 }] };
    expect(earnedBadges(setTool(newProgress(PROGRAM_ID), 'unit-economics', itemised))).toEqual(['badge-unit-economics-master']);
  });
});

describe('pitch', () => {
  it('is 3 minutes in 4 blocks, on time within 10 seconds with the demo by 0:45', () => {
    expect(PITCH_BLOCKS).toHaveLength(4);
    expect(PITCH_SECONDS).toBe(180);
    expect(runOnTime({ totalSec: 185, block2AtSec: 44 })).toBe(true);
    expect(runOnTime({ totalSec: 185, block2AtSec: 50 })).toBe(false);
    expect(runOnTime({ totalSec: 200, block2AtSec: 40 })).toBe(false);
    expect(cleanPitch({ runs: Array(20).fill({ totalSec: 180, block2AtSec: 45, at: 1 }) }).runs).toHaveLength(10);
  });
});

describe('badges and founder levels', () => {
  it('unlocks only what a tool can see, and adds badge XP to session XP', () => {
    let p = newProgress(PROGRAM_ID);
    expect(earnedBadges(p)).toEqual([]);
    p = setTool(p, 'friction-log', { entries: friction(5) });
    p = toggleSession(p, program.sessions[0].sessionNumber);
    expect(earnedBadges(p)).toEqual(['badge-friction-hunter']);
    expect(founderXp(p, program)).toBe(SESSION_XP + 350);
    expect(autoBadge('badge-unbiased-listener')).toBe(false);
  });

  it('places XP on Don\'s ladder', () => {
    expect(founderLevel(0)).toMatchObject({ level: 1, pct: 0 });
    expect(founderLevel(LEVELS[1].minXp).level).toBe(2);
    expect(founderLevel(99999)).toMatchObject({ level: LEVELS.length, next: null, pct: 100 });
  });
});
