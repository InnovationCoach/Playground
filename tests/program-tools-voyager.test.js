/** Hands-on tools for Project Voyager (programs/tools/voyager.js). */
import { describe, it, expect } from 'vitest';
import * as m from '../src/features/pbl/programs/tools/voyager.js';
import { expectKitWiring, expectStorable, withTools } from './program-tools-shared.js';

const {
  cleanShell, shellReport, wallStatus, sliceReady, cleanBay, bayReport, sunCatchPct, cadShellDone, ROLES, STAGES, cleanLog, logReport, fridayComplete, earnedBadges
} = m;

describe('content wiring', () => {
  it('reads Don\'s badges and his 5 team roles with 5 stages of evidence', () => {
    expectKitWiring(m, { auto: ['badge-voyager-cad-shell'] });
    expect(ROLES).toHaveLength(5);
    expect(STAGES).toHaveLength(5);
    for (const r of ROLES) { expect(r.evidence).toHaveLength(5); for (const e of r.evidence) expect(e).toBeTruthy(); }
  });
});

describe('shell and slicing checker', () => {
  it('checks the 220 mm bed and says how many parts a long shell needs', () => {
    expect(shellReport(cleanShell({ lengthMm: 220, widthMm: 220 })).fitsBed).toBe(true);
    const long = shellReport(cleanShell({ lengthMm: 300, widthMm: 160, parts: 1 }));
    expect(long).toMatchObject({ fitsBed: false, partsNeeded: 2, tooWide: false });
    expect(shellReport(cleanShell({ lengthMm: 300, widthMm: 160, parts: 2 }))).toMatchObject({ fitsBed: true, partLen: 150 });
    expect(shellReport(cleanShell({ lengthMm: 300, widthMm: 240, parts: 3 }))).toMatchObject({ fitsBed: false, tooWide: true, partsNeeded: null });
  });

  it('warns on fragile and over-thick walls, and passes 2.5 to 3.0 mm', () => {
    expect(wallStatus(1.9).state).toBe('bad');
    expect(wallStatus(2.2).state).toBe('warn');
    expect(wallStatus(2.5).state).toBe('ok');
    expect(wallStatus(3.0).state).toBe('ok');
    expect(wallStatus(3.5).state).toBe('warn');
    expect(wallStatus(4.1).state).toBe('bad');
  });

  it('is slice-ready only with spec walls, 15-20% infill and 3 wall loops', () => {
    const ok = { lengthMm: 200, widthMm: 150, wallMm: 2.8, infillPct: 20, loops: 3 };
    expect(sliceReady(cleanShell(ok))).toBe(true);
    expect(sliceReady(cleanShell({ ...ok, infillPct: 25 }))).toBe(false);
    expect(sliceReady(cleanShell({ ...ok, loops: 2 }))).toBe(false);
    expect(sliceReady(cleanShell({ ...ok, wallMm: 1.5 }))).toBe(false);
    expect(cleanShell({ wallMm: 99, infillPct: -3, loops: 'many', parts: 9 })).toMatchObject({ wallMm: 5, infillPct: 5, loops: 3, parts: 3 });
    expect(shellReport(cleanShell(ok)).plasticG).toBeGreaterThan(0);
  });
});

describe('solar bay', () => {
  it('catches the most sun when the panel faces it squarely', () => {
    expect(sunCatchPct(90, 0)).toBe(100);
    expect(sunCatchPct(70, 20)).toBe(100);
    expect(sunCatchPct(30, 0)).toBe(50);
    expect(sunCatchPct(10, 60)).toBeLessThan(100);
    expect(bayReport(cleanBay({ sunAltitude: 75, tiltDeg: 20 }))).toMatchObject({ tiltOk: true, bestTilt: 15 });
    expect(bayReport(cleanBay({ tiltDeg: 14 })).tiltOk).toBe(false);
    expect(bayReport(cleanBay({ tiltDeg: 31 })).tiltOk).toBe(false);
  });

  it('needs 5 cm of clearance on every side', () => {
    const truck = { l: 280, w: 160, h: 120 };
    expect(bayReport(cleanBay({ truck, bay: { l: 380, w: 260, h: 170 } }))).toMatchObject({ clearanceOk: true, short: [] });
    const tight = bayReport(cleanBay({ truck, bay: { l: 379, w: 260, h: 150 } }));
    expect(tight.clearanceOk).toBe(false);
    expect(tight.short).toEqual(['length', 'top']);
  });
});

describe('CAD shell badge', () => {
  it('needs real CAD numbers, spec walls, a fit, both details and a 15-30° roof', () => {
    const shell = { lengthMm: 300, widthMm: 160, parts: 2, wallMm: 2.6, grill: true, wheelWells: true, fromCad: true };
    const bay = { tiltDeg: 25 };
    expect(cadShellDone(cleanShell(shell), cleanBay(bay))).toBe(true);
    expect(cadShellDone(cleanShell({ ...shell, fromCad: false }), cleanBay(bay))).toBe(false);
    expect(cadShellDone(cleanShell({ ...shell, grill: false }), cleanBay(bay))).toBe(false);
    expect(cadShellDone(cleanShell({ ...shell, parts: 1 }), cleanBay(bay))).toBe(false);
    expect(cadShellDone(cleanShell(shell), cleanBay({ tiltDeg: 45 }))).toBe(false);
    expect(earnedBadges(withTools(m, { 'shell-checker': shell }))).toEqual([]);
    expect(earnedBadges(withTools(m, { 'shell-checker': shell, 'solar-bay': bay }))).toEqual(['badge-voyager-cad-shell']);
    expectStorable(m, 'shell-checker', cleanShell(shell));
    expectStorable(m, 'solar-bay', cleanBay(bay));
  });
});

describe('role portfolio log', () => {
  it('tracks evidence per role and counts only complete Friday entries', () => {
    const role = ROLES[2].id;
    const d = cleanLog({
      role, week: 40, done: { [role]: [0, 0, 4, 7, 'x'], ghost: [1] },
      fridays: { 1: { show: 'We built a shell', tell: 'It rubbed', reflect: 'Sand it' }, 2: { show: 'Only this' }, 13: { show: 'a', tell: 'b', reflect: 'c' } }
    });
    expect(d.week).toBe(12);
    expect(d.done[role]).toEqual([0, 4]);
    expect(Object.keys(d.done)).toHaveLength(5);
    expect(Object.keys(d.fridays)).toEqual(['1', '2']);
    expect(fridayComplete(d.fridays[2])).toBe(false);
    expect(logReport(d)).toMatchObject({ evidenceDone: 2, evidenceTotal: 25, fridays: 1 });
    expect(cleanLog({ fridays: { 3: { show: 'x'.repeat(500) } } }).fridays[3].show).toHaveLength(120);
    expectStorable(m, 'role-log', d);
  });
});
