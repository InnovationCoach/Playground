import { describe, it, expect } from 'vitest';
import { BED_MM, WALL, INFILL, WALL_LOOPS, cleanShell, shellReport, sliceReady } from '../src/features/pbl/programs/tools/voyager.js';

describe('3D Printing Gatekeeper & Voyager Rules', () => {
  it('validates standard 220mm bed constraints correctly', () => {
    expect(BED_MM).toBe(220);
    expect(WALL.min).toBe(2.5);
    expect(WALL.max).toBe(3.0);
    expect(WALL.fragileBelow).toBe(2.0);
  });

  it('detects when shell needs multi-part splitting to fit print bed', () => {
    const oversizedShell = cleanShell({
      lengthMm: 280, // longer than 220 mm bed
      widthMm: 160,
      heightMm: 90,
      wallMm: 2.6,
      infillPct: 18,
      loops: 3,
      parts: 1
    });

    const report1 = shellReport(oversizedShell);
    expect(report1.fitsBed).toBe(false);
    expect(report1.partsNeeded).toBe(2);
    expect(sliceReady(oversizedShell)).toBe(false);

    // After splitting into 2 parts
    const splitShell = cleanShell({ ...oversizedShell, parts: 2 });
    const report2 = shellReport(splitShell);
    expect(report2.partLen).toBe(140);
    expect(report2.fitsBed).toBe(true);
    expect(sliceReady(splitShell)).toBe(true);
  });

  it('rejects fragile walls under 2.0 mm', () => {
    const thinShell = cleanShell({
      lengthMm: 200,
      widthMm: 150,
      heightMm: 80,
      wallMm: 1.8, // under fragileBelow (2.0 mm)
      parts: 1
    });

    const report = shellReport(thinShell);
    expect(report.wall.state).toBe('bad');
    expect(report.wallOk).toBe(false);
    expect(sliceReady(thinShell)).toBe(false);
  });
});
