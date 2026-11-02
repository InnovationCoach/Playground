// @vitest-environment jsdom
import React, { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-three/fiber', () => ({ Canvas: () => null, useFrame: () => {}, useThree: () => ({}) }));
vi.mock('@react-three/drei', () => ({ Html: () => null, OrbitControls: () => null }));
const { FIXTURE_RELEASES } = await import('../shared/universe/fixtures/index.js');
const { createSyntheticService, SYNTHETIC_PEOPLE } = await import('./universe-preview/syntheticUniverseService.js');
const { createUniverseClient } = await import('../src/features/universe/pilot/universeClient.js');
const { findPilotMission } = await import('../src/features/universe/pilot/missionSession.js');
const { getSupportDescription, getMissionDecision } = await import('../shared/universe/index.js');
const { tabStops } = await import('../src/features/universe/pilot/dialogFocus.js');
const { PilotMissionSheet } = await import('../src/features/universe/pilot/PilotMissionSheet.jsx');
const { CoachUniverseSubmissions } = await import('../src/features/coach/universe/CoachUniverseSubmissions.jsx');
const { MyUniverseExplorer } = await import('../src/features/universe/explore/MyUniverseExplorer.jsx');
const { buildCosmos } = await import('../src/features/universe/explore/cosmosCatalog.js');
const catalog = (await import('../public/cosmos/v1/catalog.json')).default;

const wind = findPilotMission(FIXTURE_RELEASES, 'thalassa-wind-survey');
let host, root, service;
const text = () => document.body.textContent;
const settle = async (n = 8) => { for (let i = 0; i < n; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const button = (name) => [...document.body.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(name));
const click = async (el) => { await act(async () => el.click()); await settle(); };
const setValue = async (el, v) => {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); });
};
const clientOf = (who) => createUniverseClient({ fetchImpl: service.fetchFor(SYNTHETIC_PEOPLE[who]), getToken: async () => `synthetic-${who}` });
const sheet = (who, props = {}) => <PilotMissionSheet entry={wind} registry={FIXTURE_RELEASES} client={clientOf(who)} preview onClose={() => {}} {...props} />;
const goStep = async (n) => click(document.body.querySelectorAll('.mx-stepper button')[n - 1]);
const check = async (value) => {
  const input = document.body.querySelector('.mx-answer input');
  await setValue(input, value);
  await act(async () => input.form.requestSubmit());
  return document.body.querySelector('.mx-answer .mx-feedback').textContent;
};

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  service = createSyntheticService();
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove(); document.body.innerHTML = '';
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

describe('pilot mission sheet', () => {
  it('shows challenge, grade band and help style separately, then opens the route with honest status', async () => {
    await act(async () => root.render(sheet('ben'))); await settle();
    expect(text()).toContain('Challenge 2 of 5');
    expect(text()).toContain('Grades 6-8');
    expect(text()).toContain('Help: Guided or Independent');
    expect(text()).toMatch(/Draft mission awaiting educator review · not a published task/);
    await click(document.body.querySelector('.mx-route'));
    expect(text()).toContain('Open for work');
    expect(text()).toContain('Not saved');
    expect(text()).toMatch(/kept only until you close it/);
  });

  it('checks numbers with the shared rules: more-precise, close, percent and unreadable input', async () => {
    await act(async () => root.render(sheet('ben'))); await settle();
    await click(document.body.querySelector('.mx-route'));
    await goStep(5);
    expect(await check('0.336')).toMatch(/^Correct for this practice check/);
    expect(await check('34%')).toMatch(/^Correct/);
    expect(await check('0.33')).toMatch(/^Close\. Check your rounding: give the answer to 2 decimal places/);
    expect(await check('0.3')).toMatch(/^Not yet/);
    expect(await check('abc')).toMatch(/isn’t a number this step can read/);
    expect(text()).toMatch(/Practice only: this doesn’t mark or send anything/);
    await goStep(2);
    expect(text()).not.toMatch(/Correct for this practice check/);
  });

  it('opens the worked example for Guided help and keeps every answer when switching to Independent', async () => {
    await act(async () => root.render(sheet('ben'))); await settle();
    await click(document.body.querySelector('.mx-route'));
    await goStep(4);
    expect(document.body.querySelector('.px-worked').open).toBe(true);
    await check('56.5');
    const independent = [...document.body.querySelectorAll('.px-support input')][1];
    await click(independent);
    expect(document.body.querySelector('.px-worked').open).toBe(false);
    expect(document.body.querySelector('.mx-answer input').value).toBe('56.5');
    // The not-applicable cells are given text, not inputs.
    const inputs = [...document.body.querySelectorAll('.px-table input')].map((i) => i.getAttribute('aria-label'));
    expect(inputs).toContain('Total, Hours h');
    expect(inputs).not.toContain('Total, Output fraction');
    expect(inputs).not.toContain('CF raw / planning, Hours h');
    expect(text()).toContain('Not applicable');
  });

  it('saves to the account only when the service confirms, and restores the saved draft in a new sheet', async () => {
    await act(async () => root.render(sheet('ben'))); await settle();
    await click(document.body.querySelector('.mx-route'));
    await setValue(document.body.querySelector('.px-part textarea'), 'The record is authored, not measured; calibration is unknown.');
    expect(text()).toContain('Not saved');
    await click(button('Save now'));
    expect(text()).toMatch(/Saved to your account/);
    expect(service.drafts.size).toBe(1);
    await act(async () => root.render(null));
    await act(async () => root.render(sheet('ben'))); await settle();
    await click(document.body.querySelector('.mx-route'));
    expect(document.body.querySelector('.px-part textarea').value).toBe('The record is authored, not measured; calibration is unknown.');
    expect(text()).toMatch(/Saved to your account/);
  });

  it('pauses assessed work when the service cannot be reached, without inventing an empty history', async () => {
    service.setMode('offline');
    await act(async () => root.render(sheet('ben'))); await settle();
    await click(document.body.querySelector('.mx-route'));
    expect(text()).toMatch(/can’t be reached right now/);
    expect(text()).toMatch(/You can still read the briefing, the evidence and your notes/);
    expect(document.body.querySelector('.px-fieldset').disabled).toBe(true);
    await click(button('My attempts'));
    expect(text()).toMatch(/Your attempts couldn’t be loaded/);
    expect(text()).not.toMatch(/No attempts sent/);
    await click(button('Review and send'));
    expect(button('Send for review').disabled).toBe(true);
  });

  it('shows a withdrawn mission as paused, keeps reading available and blocks sending', async () => {
    service.setMode('withdrawn');
    await act(async () => root.render(sheet('ben'))); await settle();
    await click(document.body.querySelector('.mx-route'));
    expect(text()).toMatch(/paused for a correction/);
    await click(button('Review and send'));
    expect(button('Send for review').disabled).toBe(true);
    expect(document.body.querySelector('.px-blockers').textContent).toMatch(/paused for a correction/);
  });

  it('returns, revises and resubmits through the service, then shows a reviewed-only approval', async () => {
    await act(async () => root.render(sheet('amira'))); await settle();
    await click(button('My attempts (1)'));
    expect(text()).toContain('Returned for revision');
    expect(text()).toMatch(/say which capacity factor you used/);
    await click(button('Revise and resend'));
    expect(text()).toMatch(/Revising attempt 1\./);
    await click(button('Review and send'));
    expect(document.body.querySelectorAll('.px-checklist li.is-done')).toHaveLength(6);
    const send = button('Send revised work for review');
    expect(send.disabled).toBe(false);
    await click(send);
    expect(text()).toMatch(/Sent to your coach · attempt 2/);
    const second = service.submissions.find((s) => s.attemptNumber === 2 && s.learnerUid === SYNTHETIC_PEOPLE.amira.uid);
    expect(second).toMatchObject({ previousSubmissionId: 'synthetic-sub-1', status: 'submitted', supportMode: 'guided', missionVersion: '0.2.0-draft', taskId: 'wind-capacity-factor' });
    expect(second.previousCoachNote).toMatch(/capacity factor/);
    expect(button('Send revised work for review').disabled).toBe(true); // one open review at a time

    // Coach (same organization and class) approves; the screen shows only what the service returns.
    const coachHost = document.createElement('div'); document.body.append(coachHost);
    const coachRoot = createRoot(coachHost);
    await act(async () => coachRoot.render(<CoachUniverseSubmissions coachUser={SYNTHETIC_PEOPLE.rivera} orgId="org-north" client={clientOf('rivera')} registry={FIXTURE_RELEASES} />)); await settle();
    const card = [...coachHost.querySelectorAll('.coach-universe-item')].find((li) => li.textContent.includes('Amira'));
    expect(card.textContent).toMatch(/attempt 2/);
    expect(card.textContent).toMatch(/Your earlier feedback/);
    expect(coachHost.textContent).not.toContain('Chen'); // other organization, colliding class ID
    await click(card.querySelectorAll('.coach-universe-decision input')[1]);
    await click([...card.querySelectorAll('button')].find((b) => b.textContent === 'Record approval'));
    expect(card.textContent).toMatch(/A review records feedback only; it doesn’t open new places/);
    await act(async () => coachRoot.unmount()); coachHost.remove();

    await act(async () => root.render(null));
    await act(async () => root.render(sheet('amira'))); await settle();
    await click(button('My attempts (2)'));
    expect(text()).toContain('Reviewed by your coach');
    expect(text()).not.toMatch(/unlock|now open|Boreas/i);
  });

  it('keeps working under React StrictMode (effect replay must not drop service results)', async () => {
    await act(async () => root.render(<StrictMode>{sheet('amira')}</StrictMode>)); await settle();
    expect(button('My attempts (1)')).toBeTruthy();
  });
});

describe('availability and saved-draft safety', () => {
  const ok = (data) => ({ state: 'loaded', status: 200, data: { contractVersion: '1.0.0', ...data } });
  const withAvailability = (availability) => ({ ...clientOf('ben'), availability: async (id) => ok({ identity: id, availability: { reason: null, ...availability } }) });
  const openRoute = async (client, props = {}) => {
    await act(async () => root.render(<PilotMissionSheet entry={wind} registry={FIXTURE_RELEASES} client={client} preview onClose={() => {}} {...props} />)); await settle();
    await click(document.body.querySelector('.mx-route'));
  };
  const paused = async () => {
    expect(document.body.querySelector('.px-fieldset').disabled).toBe(true);
    await click(button('Review and send'));
    expect(button('Send for review').disabled).toBe(true);
  };

  it('keeps a contradictory withdrawn answer paused even when every permission flag is true', async () => {
    await openRoute(withAvailability({ status: 'withdrawn', canStart: true, canResume: true, canSubmit: true, reason: 'Paused for a correction.' }));
    expect(text()).toMatch(/Paused for a correction/);
    await paused();
  });

  it('keeps unknown and retired statuses paused whatever the flags say', async () => {
    await openRoute(withAvailability({ status: 'unknown', canStart: true, canResume: true, canSubmit: true }));
    await paused();
    await act(async () => root.render(null));
    await openRoute(withAvailability({ status: 'retired', canStart: true, canResume: true, canSubmit: true }));
    await paused();
  });

  it('allows in-review only inside an explicitly trusted fixture preview, and only with service permission', async () => {
    const inReview = withAvailability({ status: 'in-review', canStart: true, canResume: true, canSubmit: true });
    await openRoute(inReview);
    await paused(); // default (production) behaviour
    await act(async () => root.render(null));
    await openRoute(inReview, { allowInReview: true });
    expect(document.body.querySelector('.px-fieldset').disabled).toBe(false);
    await act(async () => root.render(null));
    await openRoute(withAvailability({ status: 'in-review', canStart: false, canResume: false, canSubmit: false }), { allowInReview: true });
    await paused();
  });

  it('never restores a saved draft that does not fit this exact task, and pauses saving instead of overwriting it', async () => {
    const wrongTaskDraft = { draftId: 'd9', revision: 4, updatedAt: '2026-11-02T04:00:00Z', supportMode: 'guided', activeStepId: 'route-plan',
      answers: [], evidence: [{ partId: 'route-plan', kind: 'text', text: 'Journey work from another task' }], reflection: '' };
    const client = { ...clientOf('ben'), getDraft: async (id) => ok({ identity: id, draft: wrongTaskDraft }) };
    await openRoute(client);
    expect(text()).toMatch(/Your saved work for this task couldn’t be read, so it wasn’t loaded/);
    expect(text()).not.toContain('Journey work from another task');
    expect(button('Save now')).toBeUndefined();
    await setValue(document.body.querySelector('.px-part textarea'), 'New note');
    await act(async () => { await new Promise((r) => setTimeout(r, 1400)); });
    expect(service.drafts.size).toBe(0); // autosave did not write over the unreadable account draft
  });

  it('rejects a draft answered for a different task at the adapter, before the editor sees it', async () => {
    const fetchImpl = async () => new Response(JSON.stringify({ contractVersion: '1.0.0', identity: { releaseId: 'x', missionId: 'thalassa-wind-survey', missionVersion: '0.2.0-draft', routeId: 'guided', taskId: 'wind-capacity-factor', policyVersion: 'p' },
      draft: { draftId: 'd', revision: 1, updatedAt: '2026-11-02T04:00:00Z', supportMode: 'guided', activeStepId: 'hours', answers: [], evidence: [], reflection: '' } }), { status: 200 });
    const base = createUniverseClient({ fetchImpl, getToken: async () => 't' });
    await openRoute({ ...clientOf('ben'), getDraft: base.getDraft });
    expect(text()).toMatch(/answered for a different task/);
    expect(document.body.querySelector('.px-part textarea').value).toBe('');
  });
});

describe('explorer with pilot missions', () => {
  const loadCatalog = async () => buildCosmos(catalog);
  const explorer = (who, client) => <MyUniverseExplorer preview forceTextView loadCatalog={loadCatalog} onClose={() => {}}
    missionRegistry={FIXTURE_RELEASES} missionClient={client || clientOf(who)} viewer={{ uid: SYNTHETIC_PEOPLE[who].uid, orgId: SYNTHETIC_PEOPLE[who].orgId }} />;

  it('clears work, status and late responses when the account or organization changes', async () => {
    let release;
    const gate = new Promise((r) => { release = r; });
    const base = clientOf('amira');
    const slow = { ...base, withScope() { return slow; },
      mySubmissions: async () => { await gate; return { state: 'loaded', data: { contractVersion: '1.0.0', nextCursor: null, submissions: [{ submissionId: 'late-1', status: 'returned', missionId: 'thalassa-wind-survey', reflection: 'AMIRA-PRIVATE-NOTE', evidence: [] }] } }; },
      access: async () => { await gate; return { state: 'loaded', data: { contractVersion: '1.0.0', destinations: { boreas: { status: 'available', isVerified: true } } } }; } };
    await act(async () => root.render(explorer('amira', slow))); await settle();
    await click([...document.body.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Open mission')[0]);
    await click(document.body.querySelector('.mx-route'));
    await setValue(document.body.querySelector('.px-part textarea'), 'AMIRA-DRAFT-TEXT');

    await act(async () => root.render(explorer('chen'))); // different learner and organization
    await settle();
    expect(text()).not.toContain('AMIRA-DRAFT-TEXT');
    expect(document.body.querySelector('.px-part')).toBeNull(); // the sheet restarted at the briefing
    await act(async () => release()); await settle();
    expect(text()).not.toContain('AMIRA-PRIVATE-NOTE');
    expect(text()).toMatch(/Boreas\s*Locked/); // Amira's late "available" never reaches Chen
  });

  it('shows the service’s neutral Boreas wording and hides the assessed lab link', async () => {
    await act(async () => root.render(explorer('ben'))); await settle();
    expect(text()).toContain('This expedition is not open yet.');
    expect(text()).not.toMatch(/Ice and Climate|Sample requirement/);
    await click([...document.body.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Open mission')[0]);
    await click(document.body.querySelector('.mx-route'));
    await goStep(7);
    expect(text()).toMatch(/The lab link is hidden in this pilot/);
    expect([...document.body.querySelectorAll('.mx-mission button, .mx-mission a')].some((b) => /open simulation|hex-grid/i.test(b.textContent))).toBe(false);
  });
});

describe('phase 1 closure: wording, focus, context and retained drafts', () => {
  const loadCatalog = async () => buildCosmos(catalog);
  const key = async (key, shiftKey = false) => act(async () => { document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })); });
  const firstTextarea = () => document.body.querySelector('.px-part textarea');
  const openMission = async () => click([...document.body.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Open mission')[0]);

  it('F5: shows the shared learner wording for the decision and each help style, not authoring text', async () => {
    await act(async () => root.render(sheet('ben'))); await settle();
    expect(text()).toContain(getMissionDecision(wind.mission));
    expect(getMissionDecision(wind.mission)).toMatch(/^Recommend Plan A, Plan B, or ask for more evidence/);
    await click(document.body.querySelector('.mx-route'));
    expect(text()).toContain(getSupportDescription('guided'));
    await click([...document.body.querySelectorAll('.px-support input')][1]);
    expect(text()).toContain(getSupportDescription('independent'));
    for (const authoring of Object.values(wind.mission.routes[0].supportPresentation || {})) if (!getSupportDescription('guided').includes(authoring)) expect(text()).not.toContain(authoring);
  });

  it('F6: keeps Tab inside the sheet, skips disabled and hidden controls, closes on Escape and returns focus to its opener', async () => {
    const opener = document.createElement('button'); opener.textContent = 'Opener'; document.body.append(opener); opener.focus();
    const onClose = vi.fn();
    await act(async () => root.render(sheet('ben', { onClose }))); await settle();
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(document.activeElement.id).toBe('px-title');
    await act(async () => opener.focus()); // focus that escapes behind the open sheet comes back to it
    expect(document.activeElement.id).toBe('px-title');
    await key('Tab', true); // from the heading backwards: wraps to the last control
    let stops = tabStops(dialog);
    expect(document.activeElement).toBe(stops[stops.length - 1]);
    await key('Tab');
    expect(document.activeElement).toBe(stops[0]);
    expect(stops[0].getAttribute('aria-label')).toBe('Close mission');
    await key('Tab', true);
    expect(document.activeElement).toBe(stops[stops.length - 1]);

    // Contents change: a route with a disabled Send button and closed drawers.
    await click(document.body.querySelector('.mx-route'));
    await click(button('Review and send'));
    stops = tabStops(dialog);
    const send = button('Send for review');
    expect(send.disabled).toBe(true);
    expect(stops).not.toContain(send);
    expect(stops.every((el) => !el.disabled && (el.tagName === 'SUMMARY' || !el.closest('details:not([open])')))).toBe(true);
    stops[stops.length - 1].focus();
    await key('Tab');
    expect(document.activeElement).toBe(stops[0]);
    expect(dialog.contains(document.activeElement)).toBe(true);

    await key('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
    await act(async () => root.render(null));
    expect(document.activeElement).toBe(opener); // still connected: focus goes back

    await act(async () => root.render(sheet('ben'))); await settle();
    opener.remove();
    await act(async () => root.render(null)); // opener gone: nothing to restore, nothing thrown
    expect(document.activeElement).not.toBe(opener);
  });

  it('F7: requests nothing and opens no mission until the host supplies the learner and a verified organization', async () => {
    const fetchImpl = vi.fn(service.fetchFor(SYNTHETIC_PEOPLE.amira));
    const client = createUniverseClient({ fetchImpl, getToken: async () => 'synthetic' });
    const render = (viewer) => root.render(<MyUniverseExplorer preview forceTextView loadCatalog={loadCatalog} onClose={() => {}} missionRegistry={FIXTURE_RELEASES} missionClient={client} viewer={viewer} />);
    await act(async () => render({ uid: SYNTHETIC_PEOPLE.amira.uid, orgId: null })); await settle();
    expect(fetchImpl).not.toHaveBeenCalled();
    await openMission();
    expect(text()).toMatch(/Missions open once you’re signed in with a school account we can confirm/);
    expect(document.body.querySelector('.mx-route')).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
    await act(async () => render({ uid: SYNTHETIC_PEOPLE.amira.uid, orgId: 'org-north' })); await settle();
    expect(document.body.querySelector('.mx-route')).toBeTruthy();
    expect(fetchImpl.mock.calls.map(([url]) => new URL(url, 'http://x').pathname)).toEqual(expect.arrayContaining(['/api/universe/access', '/api/universe/missions/submissions/mine']));
  });

  it('F7 host: the dashboard passes the signed-in learner and the verified organization claim, or no viewer at all', async () => {
    const seen = [];
    vi.doMock('../src/features/universe/explore/MyUniverseExplorer.jsx', () => ({ MyUniverseExplorer: (props) => { seen.push(props.viewer); return null; } }));
    const { SparkUniverse } = await import('../src/features/dashboard/SparkUniverse.jsx');
    const spark = (orgId) => <SparkUniverse prefs={{ interests: [], calm: true }} plan={{ goals: [] }} uid="learner-1" orgId={orgId} onPersonalise={() => {}} />;
    for (const orgId of [null, 'org-north']) {
      await act(async () => root.render(spark(orgId))); await settle();
      await click(button('Enter My Universe')); await settle();
      await act(async () => root.render(null));
    }
    vi.doUnmock('../src/features/universe/explore/MyUniverseExplorer.jsx');
    expect(seen.at(0)).toBeNull();
    expect(seen.at(-1)).toEqual({ uid: 'learner-1', orgId: 'org-north' });
  });

  it('F7: an organization change for the same learner removes old work at once and ignores the old organization’s late replies', async () => {
    let release;
    const gate = new Promise((r) => { release = r; });
    const north = clientOf('amira');
    const slow = { ...north, withScope() { return slow; },
      getDraft: async (id) => { await gate; return { state: 'loaded', status: 200, data: { contractVersion: '1.0.0', identity: id, draft: null } }; },
      mySubmissions: async () => { await gate; return { state: 'loaded', status: 200, data: { contractVersion: '1.0.0', nextCursor: null, submissions: [{ submissionId: 'late-n', status: 'returned', missionId: 'thalassa-wind-survey', reflection: 'NORTH-ONLY-NOTE', evidence: [] }] } }; } };
    const southPerson = { ...SYNTHETIC_PEOPLE.amira, orgId: 'org-south' };
    const south = createUniverseClient({ fetchImpl: service.fetchFor(southPerson), getToken: async () => 'synthetic' });
    const render = (client, orgId) => root.render(<MyUniverseExplorer preview forceTextView loadCatalog={loadCatalog} onClose={() => {}} missionRegistry={FIXTURE_RELEASES} missionClient={client} viewer={{ uid: SYNTHETIC_PEOPLE.amira.uid, orgId }} />);
    await act(async () => render(slow, 'org-north')); await settle();
    await openMission();
    await click(document.body.querySelector('.mx-route'));
    await setValue(firstTextarea(), 'NORTH-DRAFT-TEXT');
    await act(async () => render(south, 'org-south'));
    expect(text()).not.toContain('NORTH-DRAFT-TEXT'); // gone in the same render, before any reply
    await settle();
    await act(async () => release()); await settle();
    expect(text()).not.toContain('NORTH-ONLY-NOTE');
    expect(document.body.querySelector('.px-part')).toBeNull();
  });

  it('B10: sending keeps the draft and its revision, so revising after a reload saves without a false conflict', async () => {
    await act(async () => root.render(sheet('amira'))); await settle();
    await click(button('My attempts (1)'));
    await click(button('Revise and resend'));
    expect(text()).not.toMatch(/two versions/);
    await click(button('Save now'));
    expect(text()).toMatch(/Saved to your account/);
    await click(button('Review and send'));
    await click(button('Send revised work for review'));
    expect(text()).toMatch(/Sent to your coach · attempt 2/);
    const [draft] = [...service.drafts.values()];
    expect(draft).toMatchObject({ revision: 1, previousSubmissionId: 'synthetic-sub-1' }); // retained, not deleted
    const second = service.submissions.find((s) => s.attemptNumber === 2 && s.learnerUid === SYNTHETIC_PEOPLE.amira.uid);
    Object.assign(second, { status: 'returned', submissionRevision: 2, coachNote: 'Name the capacity factor in each line.', reviewedAt: '2026-11-02T09:00:00Z' });

    await act(async () => root.render(null));
    await act(async () => root.render(sheet('amira'))); await settle();
    await click(button('My attempts (2)'));
    const revisable = [...document.body.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Revise and resend');
    expect(revisable).toHaveLength(1); // the superseded first attempt can't be revised again
    await click(revisable[0]);
    expect(text()).toMatch(/Revising attempt 2\./);
    expect(text()).not.toMatch(/two versions/);
    await click(button('Save now'));
    expect(text()).toMatch(/Saved to your account/);
    expect([...service.drafts.values()][0]).toMatchObject({ revision: 2, previousSubmissionId: second.submissionId });
  });

  it('B10: newer saved work wins over the returned attempt and is never overwritten', async () => {
    await act(async () => root.render(sheet('amira'))); await settle();
    await click(button('My attempts (1)'));
    await click(button('Revise and resend'));
    await click(button('Review and send'));
    await click(button('Send revised work for review'));
    await click(button('Work'));
    await setValue(firstTextarea(), 'Edited after sending: check the night-time gap first.');
    await click(button('Save now'));
    const saved = [...service.drafts.values()][0];
    const second = service.submissions.find((s) => s.attemptNumber === 2 && s.learnerUid === SYNTHETIC_PEOPLE.amira.uid);
    expect(saved.updatedAt > second.createdAt).toBe(true);
    Object.assign(second, { status: 'returned', submissionRevision: 2, coachNote: 'Add one more check.' });

    await act(async () => root.render(null));
    await act(async () => root.render(sheet('amira'))); await settle();
    await click(button('My attempts (2)'));
    await click(button('Revise and resend'));
    expect(firstTextarea().value).toBe('Edited after sending: check the night-time gap first.');
    expect(text()).not.toMatch(/two versions/);
    await click(button('Save now'));
    expect([...service.drafts.values()][0]).toMatchObject({ revision: saved.revision + 1, previousSubmissionId: second.submissionId });
  });
});

describe('production import graph', () => {
  it('never reaches the fixture entry from application source', () => {
    const files = [];
    const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(jsx?|tsx?)$/.test(f)) files.push(p); } };
    walk(join(process.cwd(), 'src'));
    const offenders = files.filter((f) => /shared\/universe\/fixtures/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
