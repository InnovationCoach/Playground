// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXTURE_RELEASES, REFERENCE_ARTIFACTS } from '../shared/universe/fixtures/index.js';
import { createSyntheticService, SYNTHETIC_PEOPLE } from './universe-preview/syntheticUniverseService.js';
import { createUniverseClient } from '../src/features/universe/pilot/universeClient.js';

const { CoachUniverseSubmissions } = await import('../src/features/coach/universe/CoachUniverseSubmissions.jsx');

let host, root, service;
const text = () => host.textContent;
const settle = async (n = 8) => { for (let i = 0; i < n; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const click = async (el) => { await act(async () => el.click()); await settle(); };
const button = (name, scope = host) => [...scope.querySelectorAll('button')].find((b) => b.textContent.trim() === name);
const coachClient = (who = 'rivera') => createUniverseClient({ fetchImpl: service.fetchFor(SYNTHETIC_PEOPLE[who]), getToken: async () => 'synthetic' });
const render = async (client = coachClient()) => { await act(async () => root.render(<CoachUniverseSubmissions coachUser={SYNTHETIC_PEOPLE.rivera} orgId={SYNTHETIC_PEOPLE.rivera.orgId} client={client} registry={FIXTURE_RELEASES} />)); await settle(); };
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

  it('stays closed and requests nothing until the coach’s organization is confirmed', async () => {
    const fetchImpl = vi.fn(service.fetchFor(SYNTHETIC_PEOPLE.rivera));
    await act(async () => root.render(<CoachUniverseSubmissions coachUser={SYNTHETIC_PEOPLE.rivera} orgId={null} client={createUniverseClient({ fetchImpl, getToken: async () => 's' })} registry={FIXTURE_RELEASES} />)); await settle();
    expect(text()).toMatch(/Mission reviews open once your school account is confirmed/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('removes the old organization’s queue in the same render and ignores its late reply', async () => {
    let release;
    const gate = new Promise((r) => { release = r; });
    const north = coachClient();
    const slow = { ...north, withScope() { return slow; }, coachQueue: async (q) => { const r = await north.coachQueue(q); await gate; return r; } };
    await render(); // org-north, answered: Ben visible
    expect(text()).toContain('Ben (synthetic)');
    await act(async () => root.render(<CoachUniverseSubmissions coachUser={SYNTHETIC_PEOPLE.rivera} orgId="org-north" client={slow} registry={FIXTURE_RELEASES} />));
    await click(host.querySelector('.coach-refresh-btn')); // a north reply is now in flight
    const southCoach = { ...SYNTHETIC_PEOPLE.rivera, orgId: 'org-south' };
    const south = createUniverseClient({ fetchImpl: service.fetchFor(southCoach), getToken: async () => 's' });
    await act(async () => root.render(<CoachUniverseSubmissions coachUser={SYNTHETIC_PEOPLE.rivera} orgId="org-south" client={south} registry={FIXTURE_RELEASES} />));
    expect(text()).not.toContain('Ben (synthetic)'); // same render: the north queue is gone
    await settle();
    await act(async () => release()); await settle();
    expect(text()).not.toContain('Ben (synthetic)'); // the late north reply never lands in the south queue
    expect(text()).toContain('Chen (synthetic)'); // org-south's own record, from the south service
  });

  it('ignores a slow reply from a tab the coach has already left', async () => {
    let release;
    const gate = new Promise((r) => { release = r; });
    const base = coachClient();
    const client = { ...base, withScope() { return client; }, coachQueue: async (q) => { const r = await base.coachQueue(q); if (q.status === 'submitted') await gate; return r; } };
    await render(client);
    expect(text()).toContain('Loading mission submissions');
    await click(button('Returned for revision'));
    expect(host.querySelector('.coach-universe-item').textContent).toContain('Amira (synthetic)');
    await act(async () => release()); await settle();
    expect(text()).not.toContain('Ben (synthetic)');
    expect(host.querySelectorAll('.coach-universe-item')).toHaveLength(1);
  });

  it('clears loaded learner work when the service stops accepting this coach (401 or 403)', async () => {
    let denied = null;
    const real = service.fetchFor(SYNTHETIC_PEOPLE.rivera);
    const fetchImpl = async (url, init) => (denied ? new Response(JSON.stringify({ contractVersion: '1.0.0', error: { code: 'FORBIDDEN', message: 'Not your class any more.' } }), { status: denied }) : real(url, init));
    await render(createUniverseClient({ fetchImpl, getToken: async () => 's' }));
    expect(text()).toContain('Ben (synthetic)');
    denied = 401;
    await click(host.querySelector('.coach-refresh-btn'));
    expect(text()).not.toContain('Ben (synthetic)');
    expect(text()).toMatch(/couldn’t be loaded, so this isn’t an empty queue/);
    denied = null;
    await click(button('Try again'));
    expect(text()).toContain('Ben (synthetic)');
    denied = 403; // a review refused for scope clears the queue too
    const card = host.querySelector('.coach-universe-item');
    await typeNote(card.querySelector('textarea'), 'Please add units.');
    await click(button('Return to learner', card));
    expect(text()).not.toContain('Ben (synthetic)');
    expect(text()).toMatch(/Not your class any more/);
  });

  it('F8: keeps paging past a bounded window with nobody from the coach’s current classes, without claiming the queue is empty', async () => {
    const moved = { uid: 'synthetic-learner-moved', displayName: 'Moved learner (synthetic)', orgId: 'org-north', classIds: ['class-7b'], role: 'student' };
    const request = REFERENCE_ARTIFACTS.find((a) => a.name === 'spacecraft-journey-advanced').request;
    for (let i = 0; i < 21; i++) service.addSubmission({ ...moved, uid: `${moved.uid}-${i}` }, 'spacecraft-journey', request, `2026-11-02T0${i % 9}:${String(i).padStart(2, '0')}:00Z`);
    await render();
    expect(host.querySelectorAll('.coach-universe-item')).toHaveLength(0);
    expect(text()).not.toContain('No mission work is waiting');
    expect(text()).toMatch(/The list isn’t finished: load more to keep checking/);
    await click(button('Load more'));
    expect(host.querySelectorAll('.coach-universe-item')).toHaveLength(1);
    expect(text()).toContain('Ben (synthetic)');
    expect(button('Load more')).toBeUndefined();
    expect(text()).not.toContain('Moved learner');
  });
});
