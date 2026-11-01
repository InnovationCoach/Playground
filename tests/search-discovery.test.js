import React, { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { buildCatalog, searchCatalog, PARTNER_COURSES } from '../src/features/courses/catalog.js';
import { PROGRAMS } from '../src/features/pbl/programs/catalog.js';
import { LIBRARY_PROGRAMS } from '../src/features/pbl/programs/libraryProgramsData.js';
import { filterResults, tabCounts, typeCounts, courseCompetencies, availability, goalWords, relatedToGoal, suggestions, normaliseCompetencyContext, NOT_CONNECTED } from '../src/features/home/discoveryModel.js';
import { CourseDetails, Suggestions } from '../src/features/home/Discovery.jsx';
import { LocaleProvider } from '../src/app/i18n/LocaleProvider.jsx';

const activities = [{ id: 'solar', label: 'Solar Car', description: 'Race a solar car', keywords: 'solar energy sun' }];
const catalog = buildCatalog({ activities, programs: LIBRARY_PROGRAMS, includePartners: true });
const eco = catalog.find((i) => i.id === 'ecocool-smart-garden-2026');
const html = (el) => { globalThis.React = React; return renderToString(createElement(LocaleProvider, null, el)).replace(/<!-- -->/g, ''); };

describe('search catalogue', () => {
  it('shows the course theme instead of repeating the "PBL program" badge', () => {
    for (const item of catalog.filter((i) => i.source === 'program')) expect(item.kicker.toLowerCase()).not.toBe('pbl program');
  });
  it('matches stage and session titles, not only the title', () => {
    expect(searchCatalog(catalog, 'microclimates').map((i) => i.id)).toContain('ecocool-smart-garden-2026');
    expect(eco.stages.length).toBeGreaterThan(0);
  });
});

describe('source and type filters', () => {
  it('counts every tab accurately and filters within WeLearn by type', () => {
    expect(tabCounts(catalog)).toEqual({ all: catalog.length, welearn: catalog.length - PARTNER_COURSES.length, external: PARTNER_COURSES.length });
    expect(filterResults(catalog, { tab: 'external' }).every((i) => i.source === 'partner')).toBe(true);
    expect(filterResults(catalog, { tab: 'welearn', type: 'activity' }).map((i) => i.id)).toEqual(['solar']);
    expect(typeCounts(catalog, 'welearn')).toEqual({ any: catalog.length - PARTNER_COURSES.length, program: LIBRARY_PROGRAMS.length, activity: 1 });
  });
});

describe('course competencies are course outcomes from explicit mappings', () => {
  it('ranks explicit outline mappings and keeps the original framework statement', () => {
    const list = courseCompetencies(PROGRAMS.find((p) => p.id === 'ecocool-smart-garden-2026'));
    expect(list.length).toBeGreaterThan(5);
    expect(list[0]).toMatchObject({ id: expect.any(String), title: expect.any(String), statement: expect.stringMatching(/^I can/) });
  });
  it('invents nothing when an outline lists no competencies, and drops unknown ids', () => {
    expect(courseCompetencies(LIBRARY_PROGRAMS[0])).toEqual([]);
    expect(courseCompetencies({ phases: [{ competencies: ['not-a-real-id'], sessions: [] }] })).toEqual([]);
  });
});

describe('availability and suggestions use real records only', () => {
  const course = (extra) => ({ program: { id: 'ecocool-smart-garden-2026' }, summary: { next: { title: 'Soil calibration' } }, ...extra });
  it('reports availability from enrolment/assignment records', () => {
    expect(availability(eco, [course({ enrolment: { status: 'active' } })])).toBe('enrolled');
    expect(availability(eco, [course({})])).toBe('assigned');
    expect(availability(eco, [])).toBe('open');
    expect(availability(catalog.find((i) => i.source === 'partner'), [])).toBe('external');
  });
  it('makes no suggestions without a search, course or goal', () => {
    expect(suggestions({ items: catalog, results: [], query: '', courses: [] })).toEqual([]);
  });
  it('explains a current course and never claims a next step it cannot verify', () => {
    const [first] = suggestions({ items: catalog, courses: [course({})] });
    expect(first.reasons).toEqual([{ type: 'continue', next: 'Soil calibration' }]);
    const [recheck] = suggestions({ items: catalog, courses: [course({ needsRecheck: true })] });
    expect(recheck.reasons).toEqual([{ type: 'assigned' }]);
  });
  it('connects to the learner’s goal by its meaningful words', () => {
    expect(goalWords('I want to build a solar-powered greenhouse')).toEqual(['solar', 'powered', 'greenhouse']);
    expect(relatedToGoal(catalog, 'solar greenhouse')[0].item.id).toBe('solar');
    const list = suggestions({ items: catalog, focusGoal: { explore: 'Solar-powered greenhouse' } });
    expect(list.find((s) => s.item.id === 'solar').reasons[0]).toMatchObject({ type: 'goal', word: 'solar' });
  });
  it('while searching, only suggests search results, with the search as a reason', () => {
    const results = searchCatalog(catalog, 'garden');
    const list = suggestions({ items: catalog, results, query: 'garden', courses: [course({})], focusGoal: { explore: 'solar' } });
    expect(list.every((s) => results.includes(s.item))).toBe(true);
    expect(list.every((s) => s.reasons[0].type === 'search')).toBe(true);
    expect(list.length).toBeLessThanOrEqual(3);
  });
});

describe('learner competencies need a connected service', () => {
  it('stays honestly not connected unless a ready context arrives, and drops unknown ids', () => {
    expect(normaliseCompetencyContext(undefined)).toBe(NOT_CONNECTED);
    expect(normaliseCompetencyContext({ status: 'ready', confirmed: [{ competencyId: 'nope' }] }).confirmed).toEqual([]);
  });
});

describe('rendered discovery stays honest', () => {
  const base = { availability: 'open', isAdded: false, onToggleAdd() {}, onOpenActivity() {}, onClose() {} };
  it('labels course competencies as outcomes, and shows prerequisites and quests as unavailable', () => {
    const out = html(createElement(CourseDetails, { ...base, item: eco, outline: courseCompetencies(PROGRAMS.find((p) => p.id === eco.id)) }));
    expect(out).toContain('not what you have achieved');
    expect(out).toContain('Not recorded for this course.');
    expect(out).toContain('isn’t available yet');
    expect(out).not.toMatch(/confirmed|mastered|achieved it/i);
  });
  it('marks external courses as school-listed, not reviewed for competencies', () => {
    const partner = catalog.find((i) => i.source === 'partner');
    const out = html(createElement(CourseDetails, { ...base, item: partner, availability: 'external', outline: [] }));
    expect(out).toContain('Listed by your school');
    expect(out).toContain('fit with competencies not reviewed');
    expect(out).toContain('target="_blank"');
  });
  it('renders suggestion reasons as plain text, without scores', () => {
    const out = html(createElement(Suggestions, { list: [{ item: eco, reasons: [{ type: 'search', q: 'garden' }] }], query: 'garden', outlineFor: () => [], onDetails() {}, onOpenActivity() {} }));
    expect(out).toContain('Matches your search “garden”');
    expect(out).not.toMatch(/\d+\s?%/);
  });
});
