import { describe, it, expect } from 'vitest';
import React, { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  LIMITS, STAGES, createSource, listSources, generate, listDrafts, discardDraft, archiveSource, CourseStudioError
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
    const r = await generate({ type: 'milestones', ageBand: '11-13', sourceIds: [s.id] });
    expect(r.output.milestones).toHaveLength(8);
    expect(r.output.milestones.map((m) => m.phaseId)).toEqual(STAGES.map((st) => st.id));
    expect(r.output.milestones.map((m) => m.phaseId)).toContain('reflect');
    expect(r.note).toMatch(/MOCK DRAFT/);
  });

  it('generates a quiz where every item has an explanation and an answer index', async () => {
    const s = await createSource({ title: 'Quiz source', text: LONG_PARAGRAPH });
    const r = await generate({ type: 'quiz', ageBand: '14-16', sourceIds: [s.id] });
    expect(r.output.items.length).toBeGreaterThan(0);
    for (const item of r.output.items) {
      expect(item.explanation.length).toBeGreaterThan(0);
      expect(item.answers.every((a) => a < item.options.length)).toBe(true);
    }
  });

  it('refuses unknown sources with 403 and an empty source list with 400', async () => {
    await expect(generate({ type: 'slides', ageBand: '11-13', sourceIds: ['src-missing'] }))
      .rejects.toMatchObject({ status: 403 });
    await expect(generate({ type: 'slides', ageBand: '11-13', sourceIds: [] }))
      .rejects.toMatchObject({ status: 400, code: 'VALIDATION' });
  });

  it('rejects instructions over 500 characters', async () => {
    const s = await createSource({ title: 'Instructions', text: LONG_PARAGRAPH });
    await expect(generate({ type: 'slides', ageBand: '11-13', sourceIds: [s.id], instructions: 'x'.repeat(501) }))
      .rejects.toMatchObject({ code: 'VALIDATION', field: 'instructions' });
  });

  it('lists drafts and hides discarded ones', async () => {
    const s = await createSource({ title: 'Discard me', text: LONG_PARAGRAPH });
    const r = await generate({ type: 'script', ageBand: '17-18', sourceIds: [s.id] });
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
