import React, { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { ProgressLearningSlide } from '../src/features/dashboard/LearningHub.jsx';
import { completionReading, phaseStages, goalSteps, hydrateDialFinish } from '../src/features/dashboard/instrumentModel.js';
import { hydrateWorkspace } from '../src/features/dashboard/workspaceModel.js';

const phases = [{ id: 'explore', title: 'Explore' }, { id: 'define', title: 'Define' }, { id: 'make', title: 'Make & test' }];
const summary = { done: 6, total: 24, byPhase: { explore: { done: 4, total: 4, complete: true }, define: { done: 2, total: 4 }, make: { done: 0, total: 16 } } };

describe('dashboard instruments', () => {
  it('fills the circle in exact proportion to the recorded count', () => {
    expect(completionReading(6, 24).fraction).toBe(0.25);
    expect(completionReading(0, 24).fraction).toBe(0);
    expect(completionReading(24, 24).fraction).toBe(1);
  });
  it('refuses readings it cannot verify instead of showing zero', () => {
    for (const [d, t] of [[0, 0], [5, 4], [-1, 4], [1.5, 4], [undefined, 4], [2, null]]) expect(completionReading(d, t)).toBeNull();
  });
  it('lists every reported stage', () => {
    expect(phaseStages(phases, summary)[0].complete).toBe(true);
    expect(phaseStages(phases, { ...summary, total: 30 }).map((s) => s.title)).toEqual(['Explore', 'Define', 'Make & test']);
  });
  it('counts only checked personal steps, even on goals marked achieved', () => {
    expect(goalSteps([{ done: true, steps: [{ done: true }, { done: false }] }, { steps: [{ done: true }] }])).toEqual({ done: 2, total: 3 });
  });
  it('keeps the dial finish preference safe and defaulted', () => {
    expect(hydrateDialFinish('midnight')).toBe('midnight');
    expect(hydrateDialFinish('chrome')).toBe('theme');
    expect(hydrateWorkspace({}).dialFinish).toBe('theme');
    expect(hydrateWorkspace({ dialFinish: 'mint' }).dialFinish).toBe('mint');
  });
  it('follows the app theme by default and keeps a choice the learner made', () => {
    expect(hydrateWorkspace({}).theme).toBe('inherit');
    expect(hydrateWorkspace({ theme: 'neon' }).theme).toBe('inherit');
    expect(hydrateWorkspace({ theme: 'dark' }).theme).toBe('inherit'); // the old saved default, not a choice
    expect(hydrateWorkspace({ theme: 'dark', themeChosen: true })).toMatchObject({ theme: 'dark', themeChosen: true });
    expect(hydrateWorkspace({ theme: 'light' }).theme).toBe('light');
    expect(hydrateWorkspace({ theme: 'inherit' }).theme).toBe('inherit');
  });
});

const two = [{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Beta' }];
const slide = (summary, programPhases = two) => {
  globalThis.React = React;
  return renderToString(createElement(ProgressLearningSlide, { data: { state: 'ready', warnings: [], courses: [{ program: { id: 'p', title: 'P', phases: programPhases }, summary, progressUnavailable: false }] },
    project: {}, plan: { goals: [] }, goalsLoaded: true, renderReadiness: () => null })).replace(/<!-- -->/g, '');
};
describe('progress slide record states', () => {
  it('shows a complete record as full, with learner-marked wording', () => {
    const html = slide({ done: 4, total: 4, byPhase: { a: { done: 2, total: 2, complete: true }, b: { done: 2, total: 2, complete: true } } });
    expect(html).toContain('aria-valuetext="4 of 4 sessions marked complete by you"');
    expect(html).toContain('Your coach hasn’t checked them');
    expect(html).not.toContain('sessions recorded');
  });
  it('links to My Competencies', () => {
    const html = slide({ done: 0, total: 0, byPhase: {} }, []);
    expect(html).toContain('My Competencies');
    expect(html).toContain('href="#/pbl/competencies"');
  });
  it('explains a project with no sessions instead of showing an empty dial', () => {
    const html = slide({ done: 0, total: 0, byPhase: {} }, []);
    expect(html).not.toContain('role="progressbar"');
    expect(html).toContain('doesn’t list any sessions yet');
  });
  it('keeps the stage list when stage counts do not add up, and says why there are no markers', () => {
    const html = slide({ done: 1, total: 6, byPhase: { a: { done: 1, total: 2 }, b: { done: 0, total: 2 } } });
    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain('ig-needle');
    expect(html).toContain('Alpha'); expect(html).toContain('Beta');
  });
  it('hides the visible readout from screen readers so the value is announced once', () => {
    expect(slide({ done: 1, total: 4, byPhase: { a: { done: 1, total: 2 }, b: { done: 0, total: 2 } } })).toContain('class="ig-readout" aria-hidden="true"');
  });
});

import { dockStats, termStep, startHere } from '../src/features/dashboard/learningGuidance.js';
describe('dock status and term-project guidance', () => {
  const plan = { goals: [{ id: 'g', explore: 'Garden', done: false, steps: [{ id: 's', text: 'Sketch', done: false }] }] };
  const course = (summary, extra = {}) => ({ program: { id: 'p', title: 'P', phases: [] }, summary, progressUnavailable: false, ...extra });
  it('shows only verified counts and never a combined percentage', () => {
    const stats = dockStats({ data: { courses: [course({ done: 1, total: 9 })] }, today: [{ id: 'a' }, { id: 'b' }], ticked: new Set(['a']), plan, goalsLoaded: true, focus: '12:04' });
    expect(stats).toEqual({
      progress: { text: '1/9', label: '1 of 9 sessions marked complete' }, creative: { text: '12:04', label: 'focus timer 12:04 left' }
    });
    expect(JSON.stringify(stats)).not.toContain('%');
  });
  it('omits progress that is unavailable, needs a re-check or has no sessions', () => {
    for (const c of [course({ done: 1, total: 9 }, { progressUnavailable: true }), course(null, { needsRecheck: true }), course({ done: 0, total: 0 })]) {
      expect(dockStats({ data: { courses: [c] }, today: [], ticked: new Set(), plan: { goals: [] }, goalsLoaded: true })).toEqual({});
    }
  });
  it('suggests term-project steps only for a learner who has started a term project', () => {
    expect(termStep(null)).toBeNull();
    expect(termStep({ updatedAt: 0, problem: { hmw: '' }, evidence: [] })).toBeNull();
    expect(termStep({ updatedAt: 5, problem: { hmw: 'short' }, evidence: [] }).title).toBe('Write your How-might-we problem');
    expect(termStep({ updatedAt: 5, problem: { hmw: 'How might we cool the garden?' }, evidence: [] }).title).toBe('Add a piece of evidence');
    expect(termStep({ updatedAt: 5, problem: { hmw: 'How might we cool the garden?' }, evidence: [1, 2, 3] })).toBeNull();
  });
  it('keeps the learner’s own task first, then courses, then the term project', () => {
    const data = { state: 'ready', courses: [], warnings: [] };
    const term = { updatedAt: 5, problem: { hmw: '' }, evidence: [] };
    expect(startHere({ data, today: [{ id: 't', kind: 'step', text: 'Sketch', goal: 'Garden' }], checked: new Set(), goalsLoaded: true, hasGoals: true, termProject: term }).title).toBe('Sketch');
    expect(startHere({ data, today: [], checked: new Set(), goalsLoaded: true, hasGoals: false, termProject: term }).title).toBe('Write your How-might-we problem');
    expect(startHere({ data, today: [], checked: new Set(), goalsLoaded: true, hasGoals: false, termProject: null }).title).toBe('Choose something to work towards');
  });
});
