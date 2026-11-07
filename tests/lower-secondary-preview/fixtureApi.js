/**
 * Stands in for schoolRequest. Query parameters switch states: ?quest=on|off|error|loading
 * and ?space=error|empty. Every call is logged so a check can prove which reads happened.
 */
import { defaults } from '../../src/features/personalization/personalizationModel.js';
import { badgeProgress, emptyQuest, levelFor, nextBadge } from '../../src/features/quest/questModel.js';
import { scenarioId } from './scenarios.js';

const params = new URLSearchParams(location.search);
const uid = scenarioId();
const isNew = uid === 'age12new';
export class ApiError extends Error { constructor({ code, message, status }) { super(message); this.code = code; this.status = status; } }
export const request = (...args) => schoolRequest(...args);
export const apiRequest = (...args) => schoolRequest(...args);

const space = { ...defaults(), revision: 2, items: isNew || params.get('space') === 'empty' ? [] : [
  { id: 'w1', revision: 1, kind: 'writing', title: 'Why the riverbank smells', body: 'I noticed the smell was worse after rain, so I want to compare samples from two days.', link: '', media: null, audiences: ['coaches'] },
  { id: 'w2', revision: 1, kind: 'code', title: 'Moisture sensor script', body: 'from microbit import *\nwhile True:\n    display.scroll(pin0.read_analog())\n    sleep(1000)', link: '', media: null, audiences: [] },
  { id: 'w3', revision: 1, kind: 'model', title: 'Sample holder, version 2', body: 'Printed holder that keeps three test tubes upright.', link: '', media: null, audiences: ['coaches', 'classmates'] }
] };

function questView() {
  const quest = isNew ? emptyQuest() : { ...emptyQuest(), xp: 262, counters: { ...emptyQuest().counters, reflections: 3, evidence: 1, taskSteps: 4 }, badges: [{ id: 'first-evidence', earnedAt: '2026-10-01T00:00:00Z' }, { id: 'curious-mind', earnedAt: '2026-10-20T00:00:00Z' }] };
  return { revision: 3, today: '2026-11-07', level: levelFor(quest.xp), streak: { count: isNew ? 0 : 2 }, counters: quest.counters, badges: badgeProgress(quest), nextBadge: nextBadge(quest), celebrations: [], stages: [],
    todaysQuest: { phaseId: 'define', phaseTitle: 'Define the problem', index: isNew ? 0 : 1, task: 'Write who is affected by the problem you chose', done: isNew ? 0 : 1, total: 4, xp: 10 }, recent: [], preferences: { calmView: false, showOnPortfolio: false } };
}

export async function schoolRequest(method, path, { body } = {}) {
  (window.__fixtureCalls ||= []).push(`${method} ${path}`);
  const mode = params.get('quest') || 'on';
  if (path === '/api/learning-context') return { schools: [{ id: 'fixture-school', name: 'Fixture School', features: { questMode: mode !== 'off' } }], classes: [] };
  if (path === '/api/quest/me') {
    if (mode === 'error') throw new ApiError({ code: 'UNAVAILABLE', message: 'Synthetic quest failure', status: 503 });
    if (mode === 'loading') await new Promise(() => {});
    return questView();
  }
  if (path.startsWith('/api/learner-space')) {
    if (params.get('space') === 'error') throw new ApiError({ code: 'UNAVAILABLE', message: 'Your portfolio could not be loaded (synthetic failure).', status: 503 });
    if (method === 'POST' && path === '/api/learner-space/items') space.items = [{ ...body, id: `w${Date.now()}`, revision: 1 }, ...space.items];
    return structuredClone(space);
  }
  throw new ApiError({ code: 'NOT_FOUND', message: `No fixture for ${method} ${path}`, status: 404 });
}
