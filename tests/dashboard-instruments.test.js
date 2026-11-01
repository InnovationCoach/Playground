import React, { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { CourseQuests } from '../src/features/dashboard/LearningHub.jsx';
import { GAUGE, gaugeReading, phaseMilestones, phaseStages, goalSteps, hydrateDialFinish, arcPath } from '../src/features/dashboard/instrumentModel.js';
import { hydrateWorkspace } from '../src/features/dashboard/workspaceModel.js';

const phases = [{ id: 'explore', title: 'Explore' }, { id: 'define', title: 'Define' }, { id: 'make', title: 'Make & test' }];
const summary = { done: 6, total: 24, byPhase: { explore: { done: 4, total: 4, complete: true }, define: { done: 2, total: 4 }, make: { done: 0, total: 16 } } };

describe('dashboard instruments', () => {
  it('places the needle in exact proportion to the recorded count', () => {
    const r = gaugeReading(6, 24);
    expect(r.fraction).toBe(0.25);
    expect(r.angle).toBe(GAUGE.start + GAUGE.sweep * 0.25);
    expect(gaugeReading(0, 24).angle).toBe(GAUGE.start);
    expect(gaugeReading(24, 24).angle).toBe(GAUGE.start + GAUGE.sweep);
  });
  it('refuses readings it cannot verify instead of showing zero', () => {
    for (const [d, t] of [[0, 0], [5, 4], [-1, 4], [1.5, 4], [undefined, 4], [2, null]]) expect(gaugeReading(d, t)).toBeNull();
  });
  it('derives milestone notches from course phase session counts', () => {
    const marks = phaseMilestones(phases, summary);
    expect(marks.map((m) => m.at)).toEqual([4, 8, 24]);
    expect(phaseStages(phases, summary)[0].complete).toBe(true);
    expect(marks[2].angle).toBe(GAUGE.start + GAUGE.sweep);
  });
  it('draws no milestones when phase counts do not match the recorded total', () => {
    expect(phaseMilestones(phases, { ...summary, total: 30 })).toEqual([]);
    expect(phaseMilestones(phases, { ...summary, byPhase: { explore: summary.byPhase.explore } })).toEqual([]);
    expect(phaseMilestones([], summary)).toEqual([]);
  });
  it('skips a zero-session stage instead of dropping every notch', () => {
    const marks = phaseMilestones([...phases, { id: 'extra', title: 'Extra' }], { ...summary, byPhase: { ...summary.byPhase, extra: { done: 0, total: 0 } } });
    expect(marks.map((m) => [m.id, m.index, m.at])).toEqual([['explore', 0, 4], ['define', 1, 8], ['make', 2, 24]]);
  });
  it('lists every reported stage even when it cannot be placed on the dial', () => {
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
  it('defaults to dark and keeps light or app-theme choices', () => {
    expect(hydrateWorkspace({}).theme).toBe('dark');
    expect(hydrateWorkspace({ theme: 'neon' }).theme).toBe('dark');
    expect(hydrateWorkspace({ theme: 'light' }).theme).toBe('light');
    expect(hydrateWorkspace({ theme: 'inherit' }).theme).toBe('inherit');
  });
  it('draws no arc for an empty reading', () => {
    expect(arcPath(0, 0, 10, GAUGE.start, GAUGE.start)).toBe('');
  });
});

const two = [{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Beta' }];
const slide = (summary, programPhases = two) => {
  globalThis.React = React;
  return renderToString(createElement(CourseQuests, { data: { state: 'ready', warnings: [], courses: [{ program: { id: 'p', title: 'P', phases: programPhases }, summary, progressUnavailable: false }] },
    project: {}, renderReadiness: () => null, onOpenActivity: () => {} })).replace(/<!-- -->/g, '');
};
describe('course quest record states', () => {
  it('shows a complete record as full, with learner-marked wording', () => {
    const html = slide({ done: 4, total: 4, byPhase: { a: { done: 2, total: 2, complete: true }, b: { done: 2, total: 2, complete: true } } });
    expect(html).toContain('aria-valuetext="4 of 4 sessions marked complete by you"');
    expect(html).toContain('not coach-verified');
    expect(html).not.toContain('sessions recorded');
  });
  it('explains a project with no sessions instead of showing an empty dial', () => {
    const html = slide({ done: 0, total: 0, byPhase: {} }, []);
    expect(html).not.toContain('role="progressbar"');
    expect(html).toContain('doesn’t list any sessions yet');
  });
  it('keeps the stage list when stage counts do not add up, and says why there are no markers', () => {
    const html = slide({ done: 1, total: 6, byPhase: { a: { done: 1, total: 2 }, b: { done: 0, total: 2 } } });
    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain('class="ig-milestone"');
    expect(html).toContain('Alpha'); expect(html).toContain('Beta');
    expect(html).toContain('don’t add up');
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
      daily: { text: '0/1', label: '0 of 1 tasks checked across your goals' }, creative: { text: '12:04', label: 'focus timer 12:04 left' }
    });
    expect(dockStats({ data: { courses: [] }, today: [{ id: 'a' }, { id: 'b' }], ticked: new Set(['a']), plan: { goals: [] }, goalsLoaded: true }).daily).toEqual({ text: '1/2', label: '1 of 2 done today' });
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
