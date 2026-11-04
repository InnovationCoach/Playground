// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/services/api/apiClient.js', () => ({ schoolRequest: vi.fn() }));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { LearnerPathway } from '../src/features/quest/LearnerPathway.jsx';
import { recommendPathway } from '../src/features/quest/pathwayModel.js';

let host, root, data;
const lesson = { id: 'plan', offeringId: 'offering', revision: 1, title: 'Plan an investigation', status: 'published', outcome: 'Set a measurable goal', competencyIds: ['sdl-01'],
  successCriteria: ['Include steps and a deadline'], steps: [{ id: 'step', title: 'Plan', instructions: 'Write your goal and steps.' }] };
const base = '/api/schools/school/learners/learner/pathway';
const render = async (role = 'student', learnerUid = 'learner') => act(async () => root.render(<LearnerPathway key={learnerUid} school={{ id: 'school' }} learnerUid={learnerUid} classId="class" role={role} />));
const button = text => [...host.querySelectorAll('button')].find(b => b.textContent.includes(text));
const click = async text => act(async () => button(text).click());
const change = async (element, value) => act(async () => {
  const setter = Object.getOwnPropertyDescriptor(element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLSelectElement.prototype, 'value').set;
  setter.call(element, value); element.dispatchEvent(new Event('change', { bubbles: true }));
  if (element.tagName === 'TEXTAREA') element.dispatchEvent(new Event('input', { bubbles: true }));
});
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  data = { revision: 0, achievements: [], quests: [], evidence: [], recommendations: recommendPathway({ lessons: [lesson] }) };
  schoolRequest.mockImplementation(async method => method === 'GET' ? data : { saved: true });
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.resetAllMocks(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

describe('Learner competency pathway', () => {
  it('explains the real basis, goal and evidence, and saves only the selected suggestion identity', async () => {
    await render();
    expect(host.textContent).toContain('AI-generated suggestions are not enabled yet');
    expect(host.textContent).toContain('no recorded competency prerequisites');
    expect(host.textContent).toContain('Include steps and a deadline');
    await click('Choose this quest');
    expect(schoolRequest).toHaveBeenCalledWith('POST', `${base}/choose?classId=class`, { body: { revision: 0, recommendationId: 'offering:plan' } });
    expect(host.textContent).toContain('Your chosen goal and quest are saved');
  });
  it('shows an honest error with retry and clears another learner’s records on a scope change', async () => {
    await render(); expect(host.textContent).toContain('Plan an investigation');
    schoolRequest.mockRejectedValue(Object.assign(new Error('Class access changed'), { status: 403 }));
    await render('student', 'other');
    expect(host.querySelector('[role=alert]').textContent).toContain('Class access changed');
    expect(host.textContent).not.toContain('Plan an investigation'); expect(button('Refresh pathway')).toBeTruthy();
  });
  it('preserves evidence text on failed submission and reuses the retry identifier', async () => {
    data.quests = [{ id: 'goal', target: lesson.outcome, state: 'active', quest: data.recommendations[0] }]; data.recommendations = [];
    schoolRequest.mockImplementation(async method => {
      if (method === 'GET') return data;
      throw new Error('Evidence could not save');
    });
    await render();
    const textarea = host.querySelector('textarea'); await change(textarea, 'My goal has three steps and a deadline.');
    const form = host.querySelector('form');
    await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(textarea.value).toContain('three steps');
    const writes = schoolRequest.mock.calls.filter(([method]) => method === 'POST');
    expect(writes).toHaveLength(2); expect(writes[0][2].body.submissionId).toBe(writes[1][2].body.submissionId);
    expect(host.textContent).toContain('Evidence could not save');
  });
  it('only lets a coach assess a competency mapped to selected reviewed evidence', async () => {
    data.evidence = [{ offeringId: 'offering', submissionId: 'reviewed', title: 'Plan an investigation', competencyIds: ['sdl-01'] }];
    await render('coach'); expect(button('Choose this quest')).toBeUndefined();
    const form = host.querySelector('form[aria-label="Assess competency"]');
    const selects = form.querySelectorAll('select');
    expect(button('Save competency decision').disabled).toBe(true);
    await change(selects[1], 'offering:reviewed'); await change(selects[2], 'sdl-01');
    await change(form.querySelector('textarea'), 'Clear goal, steps and deadline in the work.');
    await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(schoolRequest).toHaveBeenCalledWith('POST', `${base}/decisions?classId=class`, { body: {
      revision: 0, state: 'confirmed', competencyId: 'sdl-01', offeringId: 'offering', submissionId: 'reviewed', reason: 'Clear goal, steps and deadline in the work.'
    } });
  });
});
