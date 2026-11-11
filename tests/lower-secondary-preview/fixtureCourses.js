import { scenarioId } from './scenarios.js';

const phases = [{ id: 'explore', title: 'Explore', sessions: [{ sessionNumber: 1 }, { sessionNumber: 2 }] }, { id: 'define', title: 'Define', sessions: [{ sessionNumber: 3 }, { sessionNumber: 4 }] }, { id: 'test', title: 'Test', sessions: [{ sessionNumber: 5 }, { sessionNumber: 6 }] }];
const counted = {
  program: { id: 'fixture-river-study', title: 'River study: is our water safe?', phases },
  summary: { pct: 33, done: 2, total: 6, next: { title: 'Plan where to take your samples', sessionNumber: 3, phaseId: 'define', activities: ['Mark three sample points on a map'], evidenceToCollect: { prompt: 'A labelled map of your sample points' } }, byPhase: { explore: { done: 2, total: 2, complete: true }, define: { done: 0, total: 2, complete: false }, test: { done: 0, total: 2, complete: false } } }
};
const recheck = { program: { id: 'fixture-corrected', title: 'Quiet classroom sensors', phases }, summary: null, needsRecheck: true };
const unavailable = { program: { id: 'fixture-unavailable', title: 'School garden redesign', phases }, summary: null, progressUnavailable: true };

export async function loadDashboardCourses() {
  (window.__fixtureCalls ||= []).push('courses');
  const mode = new URLSearchParams(location.search).get('state');
  if (mode === 'loading') await new Promise(() => {});
  if (mode === 'error') throw new Error('Synthetic course failure');
  if (mode === 'empty' || scenarioId() === 'age12new') return { courses: [], warnings: [] };
  return { warnings: [], courses: mode === 'mixed' ? [counted, recheck, unavailable] : [counted] };
}
