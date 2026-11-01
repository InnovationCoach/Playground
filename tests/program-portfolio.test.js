/**
 * My Portfolio: one page per PBL program, sections from its competencies.
 */
import { describe, it, expect } from 'vitest';
import { portfolioSections, hydratePortfolio, addEntry, removeEntry, setDetails, coverage, imageProblem, imagePath, LIMITS } from '../src/features/portfolio/portfolioModel.js';

const program = { id: 'p1', title: 'Garden', phases: [
  { id: 'explore', title: 'Explore', competencies: ['ctps-01'], stretchCompetencies: ['sdl-01'],
    sessions: [{ sessionNumber: 2, evidenceToCollect: { prompt: 'Photo of the garden bed', targetCompetencies: ['ctps-01'] } }] },
  { id: 'make', title: 'Make', competencies: ['ctps-01', 'not-a-competency'], sessions: [] }
] };

describe('program portfolio sections', () => {
  it('builds one section per program competency, most developed first, with the program’s own prompts', () => {
    const sections = portfolioSections(program);
    expect(sections.map((s) => s.id)).toEqual(['ctps-01', 'sdl-01']);
    expect(sections[0]).toMatchObject({ kind: 'competency', phases: ['Explore', 'Make'], prompts: [{ text: 'Photo of the garden bed', session: 2 }] });
    expect(sections[0].title).toBeTruthy();
  });
  it('falls back to phases when a program lists no competencies', () => {
    const sections = portfolioSections({ id: 'x', phases: [{ id: 'a', title: 'Ask', sessions: [] }] });
    expect(sections).toEqual([expect.objectContaining({ id: 'phase:a', kind: 'phase', title: 'Ask' })]);
  });
});

describe('program portfolio evidence', () => {
  const empty = hydratePortfolio(null, program);
  it('adds evidence with images, rejects empty or unsafe entries in plain words', () => {
    expect(addEntry(empty, { sectionId: 'ctps-01', title: '' }).error).toMatch(/title/);
    expect(addEntry(empty, { sectionId: 'ctps-01', title: 'Only a title' }).error).toMatch(/image, a link/);
    expect(addEntry(empty, { sectionId: 'ctps-01', title: 'Bad link', link: 'javascript:alert(1)' }).error).toMatch(/http/);
    const { portfolio } = addEntry(empty, { sectionId: 'ctps-01', title: 'Bed photo', images: [{ url: 'https://x/a.png', path: 'portfolio/u/p1/a.png', name: 'a.png' }] }, 5);
    expect(portfolio.entries[0]).toMatchObject({ sectionId: 'ctps-01', title: 'Bed photo', images: [{ url: 'https://x/a.png' }], createdAt: 5 });
    expect(coverage(portfolio, portfolioSections(program))).toEqual({ filled: 1, total: 2, pieces: 1 });
    expect(removeEntry(portfolio, portfolio.entries[0].id).entries).toEqual([]);
  });
  it('round-trips through storage and drops entries for sections the program no longer has', () => {
    const { portfolio } = addEntry(setDetails(empty, { headline: 'My garden', layout: 'journal' }), { sectionId: 'sdl-01', title: 'Plan', note: 'My week plan' });
    const stored = JSON.parse(JSON.stringify({ ...portfolio, entries: [...portfolio.entries, { id: 'old', sectionId: 'gone', title: 'Old' }] }));
    const back = hydratePortfolio(stored, program);
    expect(back).toMatchObject({ headline: 'My garden', layout: 'journal' });
    expect(back.entries.map((e) => e.title)).toEqual(['Plan']);
    expect(hydratePortfolio({ ...stored, programId: 'other' }, program).entries).toEqual([]);
  });
  it('checks images before upload and keeps them under the learner’s own folder', () => {
    expect(imageProblem({ name: 'a.pdf', type: 'application/pdf', size: 1 })).toMatch(/isn’t a JPG/);
    expect(imageProblem({ name: 'big.png', type: 'image/png', size: LIMITS.imageBytes + 1 })).toMatch(/10 MB/);
    expect(imageProblem({ name: 'ok.png', type: 'image/png', size: 10 })).toBeNull();
    expect(imagePath('u1', 'p1', 'my photo (1).png', 36)).toBe('portfolio/u1/p1/10_my_photo_1_.png');
  });
});
