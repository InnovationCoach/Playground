import { describe, it, expect } from 'vitest';
import { PROGRAMS, programById, resolveCompetencyId, programCompetencies, sessionsInWeek, PLATFORM_NOTES, shortAges, normaliseProgram, speechToTextOffers, isSourcedConfirmation } from '../src/features/pbl/programs/catalog.js';
import {
  newProgress, hydrateProgress, startProgram, toggleSession, chooseOption, setReflection, programProgress, progressDocId, LIMITS
} from '../src/features/pbl/programs/progress.js';
import { competencyById } from '../src/features/pbl/content/competencies.js';
import { parseRoute, hrefFor } from '../src/app/routes.js';

describe('program catalogue', () => {
  it('loads every program from the prototype registry with sessions in order', () => {
    expect(PROGRAMS.length).toBeGreaterThanOrEqual(6);
    for (const p of PROGRAMS) {
      expect(p.phases.map((ph) => ph.id)).toEqual(['explore', 'empathise', 'define', 'ideate', 'prototype', 'test', 'share']);
      const nums = p.sessions.map((s) => s.sessionNumber);
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
    }
  });

  it('only ever exposes competency ids the school framework has', () => {
    for (const p of PROGRAMS) {
      for (const id of programCompetencies(p)) expect(competencyById(id)).not.toBeNull();
    }
  });

  it('maps the prototype unpadded ids and rejects unknown ones', () => {
    expect(resolveCompetencyId('sdl-1')).toBe('sdl-01');
    expect(resolveCompetencyId('sdl-01')).toBe('sdl-01');
    expect(resolveCompetencyId('zzz-1')).toBeNull();
    expect(resolveCompetencyId('ctps-13')).toBe(competencyById('ctps-13') ? 'ctps-13' : null);
  });

  it('finds no blocking problems in the fixed prototype content', () => {
    for (const p of PROGRAMS) {
      expect(p.issues.filter((i) => i.level === 'block'), p.id).toEqual([]);
      expect(p.durationWeeks, p.id).toBe(12);
      expect(p.sessions.length, p.id).toBe(p.totalSessions);
    }
    expect(PLATFORM_NOTES.some((n) => /not deployed/.test(n.text))).toBe(true);
  });

  it('still reports every kind of problem when content regresses', () => {
    const good = programById('ecocool-smart-garden-2026');
    const raw = JSON.parse(JSON.stringify({ ...good, issues: undefined, identity: undefined, sessions: undefined }));
    raw.id = 'synthetic-bad';
    raw.durationWeeks = 20;
    raw.totalSessions = 30;
    raw.phases[1].weeks = [1, 3];
    raw.phases[0].competencies = ['zzz-9'];
    raw.assumptions = [{ id: 'x', domain: 'Kit', assumption: 'All kits exist', confirmation: { status: 'confirmed' } }];
    raw.teacherGuidance.differentiationNotes = ['Primary track (ages 9–11): speech-to-text audio reflections.'];
    const text = normaliseProgram(raw).issues.map((i) => `${i.level}: ${i.text}`).join('\n');
    expect(text).toMatch(/Runs 20 weeks/);
    expect(text).toMatch(/Says 30 sessions/);
    expect(text).toMatch(/overlap/);
    expect(text).toMatch(/zzz-9/);
    expect(text).toMatch(/"Kit" is marked as confirmed, with no record/);
    expect(text).toMatch(/^block: Offers speech-to-text to ages 9–11/m);
  });

  it('tells offering speech-to-text apart from ruling it out', () => {
    expect(speechToTextOffers({ a: 'No speech-to-text or voice recording for under-13 learners.' })).toEqual([]);
    expect(speechToTextOffers({ a: 'Offer speech-to-text dictation.' })).toHaveLength(1);
  });

  it('counts a confirmation only with who, when and where', () => {
    expect(isSourcedConfirmation({ status: 'confirmed' })).toBe(false);
    expect(isSourcedConfirmation({ status: 'needs_owner_confirmation', confirmedBy: 'Don', confirmedOn: '2026-10-01', source: 'x' })).toBe(false);
    expect(isSourcedConfirmation({ status: 'confirmed', confirmedBy: 'Don', confirmedOn: '2026-10-01', source: 'meeting notes' })).toBe(true);
  });

  it('groups sessions by week', () => {
    const p = programById('ecocool-smart-garden-2026');
    expect(sessionsInWeek(p, 1).every((s) => s.week === 1)).toBe(true);
    expect(sessionsInWeek(p, 99)).toEqual([]);
  });

  it('shortens the age line for cards', () => {
    expect(shortAges('Ages 9–17 (Primary through Upper Secondary: 9–11, 12–14, 15–17)')).toBe('Ages 9–17');
  });
});

describe('learner progress in a program', () => {
  const program = programById('ecocool-smart-garden-2026');
  const s1 = program.sessions[0];
  const withChoice = program.sessions.find((s) => s.learnerChoices?.options?.length);

  it('starts empty and keys the document by program', () => {
    expect(newProgress(program.id)).toMatchObject({ programId: program.id, startedAt: null, sessions: {} });
    expect(progressDocId(program.id)).toBe('pbl-program-ecocool-smart-garden-2026');
  });

  it('marks sessions done and back, and starts the program on first touch', () => {
    let p = toggleSession(newProgress(program.id), s1.sessionNumber, 1000);
    expect(p.sessions[s1.sessionNumber].done).toBe(true);
    expect(p.startedAt).toBe(1000);
    expect(programProgress(p, program)).toMatchObject({ done: 1, total: program.sessions.length });
    p = toggleSession(p, s1.sessionNumber, 2000);
    expect(p.sessions[s1.sessionNumber]).toBeUndefined();
    expect(p.startedAt).toBe(1000);
  });

  it('accepts only real options, and choosing again clears the choice', () => {
    const opt = withChoice.learnerChoices.options[0].id;
    let p = chooseOption(newProgress(program.id), withChoice, 'not-an-option');
    expect(p.sessions).toEqual({});
    p = chooseOption(p, withChoice, opt);
    expect(p.sessions[withChoice.sessionNumber].choice).toBe(opt);
    p = chooseOption(p, withChoice, opt);
    expect(p.sessions[withChoice.sessionNumber]).toBeUndefined();
  });

  it('caps reflections', () => {
    const p = setReflection(newProgress(program.id), s1.sessionNumber, 'x'.repeat(LIMITS.reflection + 50));
    expect(p.sessions[s1.sessionNumber].reflection).toHaveLength(LIMITS.reflection);
  });

  it('hydrates defensively: wrong program, unknown sessions and bad values are dropped', () => {
    expect(hydrateProgress({ programId: 'other', sessions: { 1: { done: true } } }, program).sessions).toEqual({});
    const h = hydrateProgress({
      programId: program.id,
      startedAt: 5,
      sessions: { [s1.sessionNumber]: { done: true, choice: 'bogus', reflection: 42 }, 999: { done: true } },
      updatedAt: 'yesterday'
    }, program);
    expect(h.sessions).toEqual({ [s1.sessionNumber]: { done: true, choice: null, reflection: '' } });
    expect(h.startedAt).toBe(5);
    expect(h.updatedAt).toBeNull();
  });

  it('points at the next unfinished session', () => {
    const p = startProgram(toggleSession(newProgress(program.id), s1.sessionNumber));
    expect(programProgress(p, program).next.sessionNumber).toBe(program.sessions[1].sessionNumber);
  });
});

describe('program routes', () => {
  it('round-trips program links and leaves the other PBL routes unchanged', () => {
    expect(parseRoute(hrefFor.program('ecocool-smart-garden-2026'))).toEqual({ screen: 'pbl', tab: 'programs', programId: 'ecocool-smart-garden-2026', section: null });
    expect(parseRoute(hrefFor.program('hex-city-thailand-2026', 'plan'))).toEqual({ screen: 'pbl', tab: 'programs', programId: 'hex-city-thailand-2026', section: 'plan' });
    expect(parseRoute('#/pbl/programs')).toEqual({ screen: 'pbl', tab: 'programs' });
    expect(parseRoute('#/pbl')).toEqual({ screen: 'pbl', tab: null });
  });
});
