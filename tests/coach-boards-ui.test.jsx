// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/app/i18n/LocaleProvider.jsx', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../src/firebase.js', () => ({ auth: { currentUser: { uid: 'coach' } }, storage: { ref: vi.fn() } }));
vi.mock('../src/services/api/apiClient.js', () => ({ schoolRequest: vi.fn() }));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { SchoolLearningPanel } from '../src/features/school/SchoolLearningPanel.jsx';

const context = { role: 'teacher', schools: [{ id: 'school', name: 'WeLearn School', timezone: 'Asia/Bangkok' }], classes: [{ id: 'class', name: 'Year 9', schoolId: 'school' }] };
const learners = { items: [{ id: 'ava', displayName: 'Ava', classIds: ['class'] }, { id: 'ben', displayName: 'Ben', classIds: ['class'] }] };
let host, root, responses;
function mockRead(method, path) {
  if (path === '/api/learning-context') return Promise.resolve(responses.context);
  if (path.endsWith('/learners')) return Promise.resolve(responses.learners);
  if (path.endsWith('/learner-goals')) return Promise.resolve(responses.goals);
  return Promise.resolve({ items: [] });
}
const render = async area => act(async () => root.render(<SchoolLearningPanel initialArea={area} hideTabs variant="coach" />));
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  responses = { context, learners, goals: { items: [] } };
  schoolRequest.mockImplementation(mockRead);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.clearAllMocks(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

describe('coach school boards', () => {
  it('drops the duplicate school-learning header in the coach workspace', async () => {
    await render('goals');
    expect(host.textContent).not.toContain('WELEARN · SCHOOL LEARNING');
    expect(host.querySelector('.sw-coach-bar h2').textContent).toBe('Learning Goals');
  });

  it('explains a missing school link instead of a bare sentence', async () => {
    responses.context = { ...context, schools: [], classes: [] };
    await render('academic');
    expect(host.textContent).toContain('Your account is not linked to a school yet');
    expect([...host.querySelectorAll('button')].some(b => b.textContent === 'Check again')).toBe(true);
  });

  it('lists every learner with an overdue goal first and opens the learner detail', async () => {
    responses.goals = { items: [{ id: 'g1', learnerUid: 'ben', classId: 'class', target: 'Test two prototypes', domain: 'pbl', dueDate: '2020-01-01', state: 'active', acknowledged: false, revision: 1 }] };
    await render('goals');
    const rows = [...host.querySelectorAll('.cb-row')];
    expect(rows.map(r => r.querySelector('strong').textContent)).toEqual(['Ben', 'Ava']);
    expect(rows[0].textContent).toContain('Overdue');
    expect(rows[1].textContent).toContain('No goal yet');
    await act(async () => rows[1].click());
    expect(host.textContent).toContain('Ava · Learning goals');
    expect(host.textContent).toContain('Assign goal');
  });

  it('explains why school learners are missing when the roster is empty', async () => {
    responses.learners = { items: [] };
    await render('goals');
    expect(host.textContent).toContain('No learners are linked to this school yet');
  });

  it('shows academic learners without observations as a call to record one', async () => {
    await render('academic');
    await act(async () => {});
    expect(host.textContent).toContain('Coach-recorded observations');
    expect([...host.querySelectorAll('.cb-row')].every(r => r.textContent.includes('No observation'))).toBe(true);
  });

  it('opens the calendar on the next eight weeks with an add-event action', async () => {
    await render('calendar');
    expect(host.querySelector('.cb-segmented [aria-pressed=true]').textContent).toBe('Next 8 weeks');
    expect(host.textContent).toContain('Nothing on the school calendar for the next 8 weeks');
    await act(async () => [...host.querySelectorAll('button')].find(b => b.textContent === 'Add the first event').click());
    expect(host.querySelector('#sw-event-form').open).toBe(true);
  });
});
