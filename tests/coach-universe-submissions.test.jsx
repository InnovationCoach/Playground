// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FIXTURE_RELEASES } from '../shared/universe/fixtures/index.js';
import { createSyntheticService, SYNTHETIC_PEOPLE } from './universe-preview/syntheticUniverseService.js';
import { createUniverseClient } from '../src/features/universe/pilot/universeClient.js';

const { CoachUniverseSubmissions } = await import('../src/features/coach/universe/CoachUniverseSubmissions.jsx');

let host, root, service;
const text = () => host.textContent;
const settle = async (n = 8) => { for (let i = 0; i < n; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const click = async (el) => { await act(async () => el.click()); await settle(); };
const button = (name, scope = host) => [...scope.querySelectorAll('button')].find((b) => b.textContent.trim() === name);
const coachClient = (who = 'rivera') => createUniverseClient({ fetchImpl: service.fetchFor(SYNTHETIC_PEOPLE[who]), getToken: async () => 'synthetic' });
const render = async (client = coachClient()) => { await act(async () => root.render(<CoachUniverseSubmissions coachUser={SYNTHETIC_PEOPLE.rivera} client={client} registry={FIXTURE_RELEASES} />)); await settle(); };
const typeNote = async (el, v) => act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); });

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  service = createSyntheticService();
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

describe('Coach mission reviews (contract 0.1.1)', () => {
  it('shows the exact task, help style, reflection and notebook evidence for its own organization only', async () => {
    await render();
    expect(text()).toContain('My Universe · Mission Reviews');
    expect(text()).toMatch(/doesn’t grade mastery or open new planets/);
    const items = host.querySelectorAll('.coach-universe-item');
    expect(items).toHaveLength(1); // Ben; Chen is in another organization despite the same class ID
    expect(items[0].textContent).toContain('Ben (synthetic)');
    expect(items[0].textContent).toMatch(/Plan a journey to Ignis · attempt 1/);
    expect(items[0].textContent).toMatch(/Version 0\.2\.0-draft · Journey timing \(journey-rates\) · Guided help/);
    expect(items[0].textContent).toMatch(/Route diagram/); // the diagram alternative, read as a list
    expect(text()).not.toContain('Chen');
  });

  it('never shows a failed load as an empty queue', async () => {
    service.setMode('unavailable');
    await render();
    expect(text()).toMatch(/couldn’t be loaded, so this isn’t an empty queue/);
    expect(text()).not.toMatch(/No mission work is waiting/);
    service.setMode('normal');
    await click(button('Try again'));
    expect(host.querySelectorAll('.coach-universe-item')).toHaveLength(1);
  });

  it('shows a real empty queue only after a successful load', async () => {
    service.submissions.length = 0;
    await render();
    expect(text()).toContain('No mission work is waiting for your review.');
  });

  it('requires an actionable note to return work, and shows the service result', async () => {
    await render();
    const card = host.querySelector('.coach-universe-item');
    const send = button('Return to learner', card);
    expect(send.disabled).toBe(true);
    await typeNote(card.querySelector('textarea'), 'Label the ion food mass and add one contingency.');
    expect(button('Return to learner', card).disabled).toBe(false);
    await click(button('Return to learner', card));
    expect(card.textContent).toMatch(/Feedback: “Label the ion food mass/);
    const ben = service.submissions.find((s) => s.learnerUid === SYNTHETIC_PEOPLE.ben.uid);
    expect(ben).toMatchObject({ status: 'returned', submissionRevision: 2, coachUid: SYNTHETIC_PEOPLE.rivera.uid, outcome: null });
  });

  it('reports a competing review as a conflict and refreshes', async () => {
    await render();
    const ben = service.submissions.find((s) => s.learnerUid === SYNTHETIC_PEOPLE.ben.uid);
    Object.assign(ben, { status: 'approved', submissionRevision: 2 }); // someone else reviewed meanwhile
    const card = host.querySelector('.coach-universe-item');
    await click(card.querySelectorAll('.coach-universe-decision input')[1]);
    await click(button('Record approval', card));
    expect(text()).toMatch(/already reviewed this attempt|No mission work is waiting/);
  });
});
