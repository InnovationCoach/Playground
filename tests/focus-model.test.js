/**
 * Focus sounds on My Dashboard: mixer and timer logic (src/features/focus/focusModel.js).
 */
import { describe, it, expect } from 'vitest';
import {
  SOUNDS, PRESETS, cleanMix, isSilent, toggleSound, setLevel, IDLE, startTimer, pauseTimer, resumeTimer, isPaused,
  remainingMs, progress, afterPhase, BREAK_MIN, fmt, addBlock, DEFAULT_LEVEL
} from '../src/features/focus/focusModel.js';

describe('mixer', () => {
  it('keeps only known sounds at 0..1, and drops silent ones', () => {
    expect(cleanMix({ rain: 2, ocean: -1, keys: 0.333, disco: 1 })).toEqual({ rain: 1, keys: 0.33 });
    expect(cleanMix(null)).toEqual({});
    expect(isSilent({ rain: 0 })).toBe(true);
  });

  it('toggles a sound on at the default level and off again', () => {
    const on = toggleSound({}, 'rain');
    expect(on).toEqual({ rain: DEFAULT_LEVEL });
    expect(toggleSound(on, 'rain')).toEqual({});
    expect(toggleSound(on, 'nope')).toEqual(on);
    expect(setLevel(on, 'rain', 0.2)).toEqual({ rain: 0.2 });
  });

  it('only offers presets made of real sounds', () => {
    const ids = new Set(SOUNDS.map((s) => s.id));
    for (const p of PRESETS) for (const id of Object.keys(p.mix)) expect(ids.has(id)).toBe(true);
  });
});

describe('timer', () => {
  it('counts down, pauses and resumes without losing time', () => {
    let t = startTimer(25, 0);
    expect(remainingMs(t, 60000)).toBe(24 * 60000);
    t = pauseTimer(t, 60000);
    expect(isPaused(t)).toBe(true);
    expect(remainingMs(t, 999999)).toBe(24 * 60000);
    t = resumeTimer(t, 100000);
    expect(remainingMs(t, 100000)).toBe(24 * 60000);
    expect(progress(t, 100000)).toBeCloseTo(1 / 25);
  });

  it('goes focus -> break -> idle and remembers the focus length', () => {
    const brk = afterPhase(startTimer(45, 0), 1000);
    expect(brk).toMatchObject({ phase: 'break', minutes: 45 });
    expect(remainingMs(brk, 1000)).toBe(BREAK_MIN * 60000);
    expect(progress(brk, 1000 + 60000)).toBeCloseTo(1 / BREAK_MIN);
    expect(afterPhase(brk, 2000)).toEqual({ ...IDLE, minutes: 45 });
  });

  it('formats mm:ss rounding up', () => {
    expect(fmt(25 * 60000)).toBe('25:00');
    expect(fmt(61001)).toBe('1:02');
    expect(fmt(0)).toBe('0:00');
  });
});

describe('blocks per day', () => {
  it('counts per day and keeps two weeks', () => {
    let log = addBlock({}, '2026-10-23');
    log = addBlock(log, '2026-10-23');
    expect(log['2026-10-23']).toBe(2);
    for (let d = 1; d <= 20; d += 1) log = addBlock(log, `2026-09-${String(d).padStart(2, '0')}`);
    expect(Object.keys(log)).toHaveLength(14);
    expect(log['2026-10-23']).toBe(2);
  });
});
