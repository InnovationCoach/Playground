import { describe, it, expect } from 'vitest';
import { normaliseContractProgram, needsCourseNumbering } from '../src/services/pblService.js';
import { LIBRARY_PROGRAMS } from '../src/features/pbl/programs/libraryProgramsData.js';
import { normaliseProgram } from '../src/features/pbl/programs/catalog.js';
import { hydrateProgress, newProgress, programProgress, toggleSession, needsRecheck, confirmRecheck } from '../src/features/pbl/programs/progress.js';
import { startHere, programJourney } from '../src/features/dashboard/learningGuidance.js';

const twoStages = (numbers) => ({ id: 'c', title: 'C', phases: [
  { id: 'a', title: 'A', sessions: numbers[0].map((sessionNumber) => ({ sessionNumber, title: 'x' })) },
  { id: 'b', title: 'B', sessions: numbers[1].map((sessionNumber) => ({ sessionNumber, title: 'y' })) }] });

describe('course-wide session numbering', () => {
  it('detects missing and repeated numbers', () => {
    expect(needsCourseNumbering([{ sessionNumber: 1 }, { sessionNumber: 2 }])).toBe(false);
    expect(needsCourseNumbering([{ sessionNumber: 1 }, { sessionNumber: 1 }])).toBe(true);
    expect(needsCourseNumbering([{}, { sessionNumber: 2 }])).toBe(true);
  });
  it('numbers repeated per-stage sessions 1..N in course order and marks the course renumbered', () => {
    const p = normaliseContractProgram(twoStages([[1, 2], [1]]));
    expect(p.sessions.map((s) => s.sessionNumber)).toEqual([1, 2, 3]);
    expect(p.phases.map((ph) => ph.sessions.map((s) => s.sessionNumber))).toEqual([[1, 2], [3]]);
    expect(p.renumbered).toBe(true);
  });
  it('leaves correctly numbered courses alone', () => {
    const p = normaliseContractProgram(twoStages([[1, 2], [3]]));
    expect(p.sessions.map((s) => s.sessionNumber)).toEqual([1, 2, 3]);
    expect(p.renumbered).toBe(false);
  });
  it('gives every bundled library course unique numbers on every read path', () => {
    for (const raw of LIBRARY_PROGRAMS) {
      const numbers = raw.sessions.map((s) => s.sessionNumber);
      expect(numbers).toEqual(numbers.map((_, i) => i + 1));
      expect(raw.phases.flatMap((ph) => ph.sessions.map((s) => s.sessionNumber))).toEqual(numbers);
      expect(normaliseContractProgram(raw).sessions.map((s) => s.sessionNumber)).toEqual(numbers);
      expect(normaliseContractProgram(raw).renumbered).toBe(true);
    }
  });
  it('numbers Course Maker-style courses the same way on both read paths', () => {
    for (const numbers of [[[1, 2], [1]], [[undefined, undefined], [undefined]], [[3, 3], [4]]]) {
      const raw = twoStages(numbers);
      const viaCatalog = normaliseProgram(raw), viaService = normaliseContractProgram(raw);
      expect(viaCatalog.sessions.map((s) => s.sessionNumber)).toEqual([1, 2, 3]);
      expect(viaService.sessions.map((s) => s.sessionNumber)).toEqual([1, 2, 3]);
      expect([viaCatalog.renumbered, viaService.renumbered]).toEqual([true, true]);
    }
    const ok = normaliseProgram(twoStages([[1, 2], [3]]));
    expect([ok.renumbered, ok.sessions.map((s) => s.sessionNumber)]).toEqual([false, [1, 2, 3]]);
  });
  it('the same library course data reads identically through both normalisers', () => {
    for (const raw of LIBRARY_PROGRAMS) {
      expect(normaliseProgram(raw).sessions.map((s) => [s.sessionNumber, s.title])).toEqual(normaliseContractProgram(raw).sessions.map((s) => [s.sessionNumber, s.title]));
      expect(normaliseProgram(raw).renumbered).toBe(true);
    }
  });
  it('one tick now counts as one session', () => {
    const program = normaliseContractProgram(LIBRARY_PROGRAMS.find((p) => p.id === 'ecocool-smart-garden-2026'));
    const summary = programProgress(toggleSession(newProgress(program.id), 1, 10), program);
    expect([summary.done, summary.total]).toEqual([1, 9]);
  });
});

describe('progress saved before the renumbering', () => {
  const program = { id: 'c', renumbered: true, sessions: [{ sessionNumber: 1, activities: [] }, { sessionNumber: 2, activities: [] }], phases: [] };
  const old = { programId: 'c', startedAt: 1, updatedAt: 2, sessions: { 1: { done: true } } };
  it('is flagged for re-check instead of being reinterpreted silently', () => {
    expect(needsRecheck(hydrateProgress(old, program))).toBe(true);
  });
  it('is not flagged when saved after the fix, when empty, or for courses that never changed', () => {
    expect(needsRecheck(hydrateProgress({ ...old, sessionKeys: 'course' }, program))).toBe(false);
    expect(needsRecheck(hydrateProgress({ ...old, sessions: {} }, program))).toBe(false);
    expect(needsRecheck(hydrateProgress(old, { ...program, renumbered: false }))).toBe(false);
  });
  it('stays flagged through edits until the learner confirms the re-check', () => {
    const flagged = toggleSession(hydrateProgress(old, program), 2, 5);
    expect(needsRecheck(flagged)).toBe(true);
    const confirmed = confirmRecheck(flagged, 6);
    expect(needsRecheck(confirmed)).toBe(false);
    expect(needsRecheck(hydrateProgress(confirmed, program))).toBe(false);
  });
  it('makes the dashboard ask for a re-check instead of counting', () => {
    const course = { program: { id: 'c', title: 'Garden', phases: [] }, summary: null, progressUnavailable: false, needsRecheck: true };
    const guidance = startHere({ data: { state: 'ready', courses: [course], warnings: [] }, today: [], checked: new Set(), goalsLoaded: true, hasGoals: true });
    expect(guidance.title).toBe('Re-check your completed sessions');
    expect(guidance.href).toContain('/pbl/programs/c/plan');
    expect(programJourney(course)).toMatchObject({ recheck: true, stages: [] });
  });
});
