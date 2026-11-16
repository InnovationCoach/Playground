/** Checks every program toolkit must pass; used by each tests/program-tools-<program>.test.js. */
import { expect } from 'vitest';
import { programById } from '../src/features/pbl/programs/catalog.js';
import { toolkitFor } from '../src/features/pbl/programs/tools/index.js';
import { newProgress, setTool, hydrateProgress, LIMITS } from '../src/features/pbl/programs/progress.js';

export function expectKitWiring(m, { auto }) {
  const program = programById(m.PROGRAM_ID);
  expect(program, 'program is in the catalog').toBeTruthy();
  const kit = toolkitFor(m.PROGRAM_ID);
  expect(kit.tools).toBe(m.TOOLS);
  expect(kit.sessionXp).toBe(150);

  // 7 badges, each readable by the shelf and the unlock toast.
  expect(m.BADGES).toHaveLength(7);
  for (const b of m.BADGES) {
    expect(b.id).toMatch(/^[a-z0-9_-]{1,80}$/i);
    expect(b.name).toBeTruthy();
    expect(b.icon).toBeTruthy();
    expect(b.xpAward).toBeGreaterThan(0);
    expect(b.condition).toBeTruthy();
  }
  expect(m.BADGES.filter((b) => m.autoBadge(b.id)).map((b) => b.id).sort()).toEqual([...auto].sort());

  // Tools sit on real sessions, and their ids are storable.
  const numbers = new Set(program.sessions.map((s) => s.sessionNumber));
  for (const t of m.TOOLS) {
    expect(t.id).toMatch(/^[a-z0-9-]{1,40}$/);
    expect(t.sessions.length).toBeGreaterThan(0);
    for (const n of t.sessions) { expect(numbers.has(n)).toBe(true); expect(m.SESSION_TOOLS[n]).toBe(t.id); }
  }
  for (const [n, id] of Object.entries(m.SESSION_TOOLS)) {
    expect(numbers.has(Number(n))).toBe(true);
    expect(m.TOOLS.some((t) => t.id === id)).toBe(true);
  }

  // Nothing is earned on a blank record; junk badges and tool state are ignored.
  expect(m.earnedBadges(newProgress(m.PROGRAM_ID))).toEqual([]);
  expect(m.earnedBadges({ badges: ['not-a-badge', 42], tools: { junk: 'x' } })).toEqual([]);
  expect(m.earnedBadges(null)).toEqual([]);
  // A badge saved earlier (a coach award) is kept.
  const coachBadge = m.BADGES.find((b) => !m.autoBadge(b.id));
  expect(m.earnedBadges({ ...newProgress(m.PROGRAM_ID), badges: [coachBadge.id] })).toEqual([coachBadge.id]);

  for (const v of m.VOCAB) { expect(v.en).toBeTruthy(); expect(v.th).toMatch(/[฀-๿]/); }
  return program;
}

/** A tool's cleaned state must fit the progress document and survive a save and reload. */
export function expectStorable(m, toolId, data) {
  const program = programById(m.PROGRAM_ID);
  expect(JSON.stringify(data).length).toBeLessThan(Math.min(12000, LIMITS.toolBytes));
  const saved = setTool(newProgress(m.PROGRAM_ID), toolId, data);
  expect(saved.tools[toolId]).toEqual(data);
  const back = hydrateProgress(JSON.parse(JSON.stringify(saved)), program);
  expect(back.tools[toolId]).toEqual(JSON.parse(JSON.stringify(data)));
  return saved;
}

export const withTools = (m, tools) => ({ ...newProgress(m.PROGRAM_ID), tools });
