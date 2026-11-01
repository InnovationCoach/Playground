import { describe, it, expect } from 'vitest';
import React, { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  LIMITS, STAGES, MILESTONE_LIMITS, createSource, listSources, generate, listDrafts, discardDraft, archiveSource, updateMilestones, CourseStudioError
} from '../src/services/courseStudioService.js';

const LONG_PARAGRAPH = 'Floods change how a city moves water, so engineers map low ground before they build. '.repeat(3);

describe('course studio service (mock, contract §3–§4)', () => {
  it('saves a source with a title and text, and lists it', async () => {
    const s = await createSource({ title: 'Flood basics', text: LONG_PARAGRAPH });
    expect(s.id).toMatch(/^src-/);
    const all = await listSources();
    expect(all.some((x) => x.id === s.id)).toBe(true);
  });

  it('rejects a missing title, a too-short text, and personal details', async () => {
    await expect(createSource({ title: '', text: LONG_PARAGRAPH })).rejects.toMatchObject({ code: 'VALIDATION', field: 'title' });
    await expect(createSource({ title: 'x', text: 'short' })).rejects.toMatchObject({ code: 'VALIDATION', field: 'text' });
    await expect(createSource({ title: 'x', text: `${LONG_PARAGRAPH} Contact maya.lin@school.edu.` }))
      .rejects.toBeInstanceOf(CourseStudioError);
  });

  it('rejects a source over the character limit with 413', async () => {
    const huge = 'a'.repeat(LIMITS.sourceChars + 1);
    await expect(createSource({ title: 'Too big', text: huge })).rejects.toMatchObject({ status: 413, code: 'SOURCES_TOO_LARGE' });
  });

  it('generates milestones with one entry per stage, using the contract phase ids', async () => {
    const s = await createSource({ title: 'Stages', text: LONG_PARAGRAPH });
    const r = await generate({ type: 'milestones', cohort: 'primary', sourceIds: [s.id] });
    expect(r.output.milestones).toHaveLength(8);
    expect(r.output.milestones.map((m) => m.phaseId)).toEqual(STAGES.map((st) => st.id));
    expect(r.output.milestones.map((m) => m.phaseId)).toContain('reflect');
    expect(r.note).toMatch(/MOCK DRAFT/);
  });

  it('generates a quiz where every item has an explanation and an answer index', async () => {
    const s = await createSource({ title: 'Quiz source', text: LONG_PARAGRAPH });
    const r = await generate({ type: 'quiz', cohort: 'lower-secondary', sourceIds: [s.id] });
    expect(r.output.items.length).toBeGreaterThan(0);
    for (const item of r.output.items) {
      expect(item.explanation.length).toBeGreaterThan(0);
      expect(item.answers.every((a) => a < item.options.length)).toBe(true);
    }
  });

  it('refuses unknown sources with 403 and an empty source list with 400', async () => {
    await expect(generate({ type: 'slides', cohort: 'primary', sourceIds: ['src-missing'] }))
      .rejects.toMatchObject({ status: 403 });
    await expect(generate({ type: 'slides', cohort: 'primary', sourceIds: [] }))
      .rejects.toMatchObject({ status: 400, code: 'VALIDATION' });
  });

  it('rejects instructions over 500 characters', async () => {
    const s = await createSource({ title: 'Instructions', text: LONG_PARAGRAPH });
    await expect(generate({ type: 'slides', cohort: 'primary', sourceIds: [s.id], instructions: 'x'.repeat(501) }))
      .rejects.toMatchObject({ code: 'VALIDATION', field: 'instructions' });
  });

  it('lists drafts and hides discarded ones', async () => {
    const s = await createSource({ title: 'Discard me', text: LONG_PARAGRAPH });
    const r = await generate({ type: 'script', cohort: 'higher-secondary', sourceIds: [s.id] });
    expect((await listDrafts()).some((d) => d.id === r.draftId)).toBe(true);
    await discardDraft(r.draftId);
    expect((await listDrafts()).some((d) => d.id === r.draftId)).toBe(false);
  });

  it('archived sources drop out of the library', async () => {
    const s = await createSource({ title: 'Archive me', text: LONG_PARAGRAPH });
    await archiveSource(s.id);
    expect((await listSources()).some((x) => x.id === s.id)).toBe(false);
  });
});

describe('milestone edits (contract §3.1 limits)', () => {
  const draftWithMilestones = async () => {
    const s = await createSource({ title: 'Edit source', text: LONG_PARAGRAPH });
    return generate({ type: 'milestones', cohort: 'primary', sourceIds: [s.id] });
  };
  const copy = (ms) => ms.map((m) => ({ ...m, sessions: [...m.sessions] }));

  it('saves a valid edit and keeps stage ids and order', async () => {
    const r = await draftWithMilestones();
    const ms = copy(r.output.milestones);
    ms[0].title = 'Explore the flood map';
    const saved = await updateMilestones(r.draftId, ms);
    expect(saved.output.milestones[0].title).toBe('Explore the flood map');
    expect(saved.output.milestones.map((m) => m.phaseId)).toEqual(STAGES.map((st) => st.id));
  });

  it('rejects an empty title, an over-long goal, a changed stage, and too many sessions', async () => {
    const r = await draftWithMilestones();
    const base = copy(r.output.milestones);
    const bad = (mutate) => { const ms = copy(base); mutate(ms); return ms; };
    await expect(updateMilestones(r.draftId, bad((ms) => { ms[1].title = '  '; }))).rejects.toMatchObject({ code: 'VALIDATION', field: 'title' });
    await expect(updateMilestones(r.draftId, bad((ms) => { ms[2].goal = 'g'.repeat(MILESTONE_LIMITS.goal + 1); }))).rejects.toMatchObject({ field: 'goal' });
    await expect(updateMilestones(r.draftId, bad((ms) => { ms[3].phaseId = 'explore'; }))).rejects.toMatchObject({ field: 'phaseId' });
    await expect(updateMilestones(r.draftId, bad((ms) => { ms[4].sessions = ['a', 'b', 'c', 'd', 'e']; }))).rejects.toMatchObject({ field: 'sessions' });
  });

  it('rejects a list that does not cover all 8 stages', async () => {
    const r = await draftWithMilestones();
    await expect(updateMilestones(r.draftId, copy(r.output.milestones).slice(0, 7))).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});

describe('course studio panel (render check)', () => {
  it('renders the panel heading, the mock label and the draft type choices without crashing', async () => {
    // The app builds with the automatic JSX runtime; this test transform does not, so supply React globally.
    globalThis.React = React;
    const { CourseStudioPanel } = await import('../src/features/coach/studio/CourseStudioPanel.jsx');
    const html = renderToString(createElement(CourseStudioPanel));
    expect(html).toContain('Course material studio');
    expect(html).toContain('Mock drafts');
    expect(html).toContain('Milestones (8 stages)');
    expect(html).toContain('Generate draft');
  });
});
