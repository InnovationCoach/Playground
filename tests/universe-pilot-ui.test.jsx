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
const { getMissionLearningDesign } = await import('../shared/universe/learningDesign.js');
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
    expect(text()).toContain('Suggested for grades 6–8'); // shared design's pilot range; authored band unchanged
    expect(text()).toMatch(/Grade ranges are suggestions, not limits/);
    expect(text()).toMatch(/Draft mission awaiting educator review · not a published task/);
    await click(document.body.querySelector('.mx-route'));
    expect(document.body.querySelector('.px-avail').textContent).toBe('Open');
    expect(text()).toContain('Not saved');
    expect(text()).not.toMatch(/kept only until you close it/); // the unsaved consequence is shown when closing (O03)
  });

  it('shows a Mission Builder plan beside the reviewed mission and starts in the help mode it chose', async () => {
    const route = wind.mission.routes[0];
    const plan = { missionId: wind.mission.id, routeId: route.id, supportMode: 'independent', hook: 'Bands plan around limits too.', sittings: [{ number: 1, minutes: 15, stepTitles: [route.steps[0].title] }] };
    await act(async () => root.render(sheet('ben', { plan, initial: { id: wind.mission.id, route: route.id } }))); await settle();
    expect(document.body.querySelector('.px-my-plan').textContent).toContain('Bands plan around limits too.');
    const modes = [...document.body.querySelectorAll('input[name="px-support"]')];
    expect(modes.length).toBe(2);
    expect(modes.find((m) => m.checked).closest('label').textContent).toContain('Independent');
    expect(document.body.querySelector('#px-title').textContent).toBe(wind.mission.title);
    // A plan for another mission doesn't show.
    await act(async () => root.render(null));
    await act(async () => root.render(sheet('ben', { plan: { ...plan, missionId: 'other' } }))); await settle();
    expect(document.body.querySelector('.px-my-plan')).toBeNull();
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

  it('keeps the worked example closed even with Guided help, and keeps every answer when switching to Independent', async () => {
    await act(async () => root.render(sheet('ben'))); await settle();
    await click(document.body.querySelector('.mx-route'));
    await goStep(4);
    expect(document.body.querySelector('.px-worked').open).toBe(false); // optional help starts closed (O03)
    await check('56.5');
    const independent = [...document.body.querySelectorAll('.px-support input')][1];
    await click(independent);
    expect(document.body.querySelector('.px-worked').open).toBe(false);
    expect(document.body.querySelector('.mx-answer input').value).toBe('56.5');
    // The weighted table is gathered once, at step 5's notebook action; the full table is one click away.
    await goStep(5);
    await click(button('Next'));
    await click(button('Show full table'));
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
    expect(document.body.querySelector('.px-save').textContent).toMatch(/^Saved/);
    expect(service.drafts.size).toBe(1);
    await act(async () => root.render(null));
    await act(async () => root.render(sheet('ben'))); await settle();
    await click(document.body.querySelector('.mx-route'));
    expect(document.body.querySelector('.px-part textarea').value).toBe('The record is authored, not measured; calibration is unknown.');
    expect(document.body.querySelector('.px-save').textContent).toMatch(/^Saved/);
  });

  it('pauses assessed work when the service cannot be reached, without inventing an empty history', async () => {
    service.setMode('offline');
    await act(async () => root.render(sheet('ben'))); await settle();
    await click(document.body.querySelector('.mx-route'));
    expect(text()).toMatch(/can’t be reached right now/);
    expect(text()).toMatch(/You can still read everything/);
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
    expect(text()).toMatch(/Revising attempt 1/);
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
    // The reviewed shared design supplies the decision; GPT's earlier learner wording stays the fallback.
    expect(text()).toContain(getMissionLearningDesign(wind.mission.id, 'guided', wind.mission.version, wind.bundle.bundleContentSha256).decision);
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
    expect(document.body.querySelector('.px-save').textContent).toMatch(/^Saved/);
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
    expect(text()).toMatch(/Revising attempt 2/);
    expect(text()).not.toMatch(/two versions/);
    await click(button('Save now'));
    expect(document.body.querySelector('.px-save').textContent).toMatch(/^Saved/);
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

describe('O03 focus flow: one action at a time', () => {
  // Exact names here: "Next" must not match "Next row" or "Next stage".
  const button = (name) => [...document.body.querySelectorAll('button')].find((b) => b.textContent.trim() === name);
  const journey = findPilotMission(FIXTURE_RELEASES, 'spacecraft-journey');
  const card = () => document.body.querySelector('.px-action-card');
  const heading = () => card().querySelector('.px-action-title');
  const openRoute = async (entry = wind, routeIndex = 0, props = {}) => {
    await act(async () => root.render(<PilotMissionSheet entry={entry} registry={FIXTURE_RELEASES} client={clientOf('ben')} preview onClose={() => {}} {...props} />)); await settle();
    await click(document.body.querySelectorAll('.mx-route')[routeIndex]);
  };

  it('shows exactly one action and one response group at every position, with optional help closed', async () => {
    await openRoute();
    const route = wind.mission.routes[0];
    let n = 0;
    for (;;) {
      const c = card();
      const practice = c.querySelectorAll(':scope > .mx-answer, :scope > .mx-choices').length, parts = c.querySelectorAll('.px-part').length;
      expect(practice + parts).toBe(1); // one practice check OR one notebook part, never both or several
      expect(c.querySelectorAll('details[open]')).toHaveLength(0); // hints, examples, references, criteria, full task: all closed
      n += 1;
      const next = button('Next');
      if (!next) break;
      await click(next);
    }
    expect(n).toBe(11); // 9 authored steps → 11 actions with the shared design's deferrals
    expect(button('Review your work')).toBeTruthy();
    expect(route.steps).toHaveLength(9);
  });

  it('separates practice from the notebook, and Back keeps both answers', async () => {
    await openRoute();
    await goStep(5);
    expect(card().querySelector('.mx-answer')).toBeTruthy();
    expect(card().querySelector('.px-part')).toBeNull();
    await setValue(card().querySelector('.mx-answer input'), '0.336');
    await click(button('Next'));
    expect(card().querySelector('.mx-answer')).toBeNull();
    const row = card().querySelector('.px-rowfocus input');
    await setValue(row, '0');
    const label = row.getAttribute('aria-label');
    await click(button('Back'));
    expect(card().querySelector('.mx-answer input').value).toBe('0.336');
    await click(button('Next'));
    expect(card().querySelector(`input[aria-label="${label}"]`).value).toBe('0');
  });

  it('moves keyboard focus to the current action heading on Next and Back', async () => {
    await openRoute();
    await click(button('Next'));
    expect(document.activeElement).toBe(heading());
    const second = heading().textContent;
    await click(button('Back'));
    expect(document.activeElement).toBe(heading());
    expect(heading().textContent).not.toBe(second);
  });

  it('shows a table one row at a time, with the full table and the written alternative keeping the same work', async () => {
    await openRoute();
    await goStep(5); await click(button('Next'));
    expect(card().querySelector('.px-part .px-table')).toBeNull();
    expect(card().querySelector('.px-rowpos').textContent).toMatch(/row 1 of \d+/);
    const first = card().querySelector('.px-rowfocus input');
    const label = first.getAttribute('aria-label'); // read now: the same input element is reused for the next row
    await setValue(first, '0');
    await click(button('Next row'));
    expect(card().querySelector('.px-rowpos').textContent).toMatch(/row 2 of/);
    await click(button('Show full table'));
    expect(card().querySelector(`.px-table input[aria-label="${label}"]`).value).toBe('0');
    const written = [...card().querySelectorAll('.px-format input')][1];
    await click(written);
    await setValue(card().querySelector('.px-part textarea'), 'Each band adds hours × fraction.');
    await click([...card().querySelectorAll('.px-format input')][0]);
    expect(card().querySelector(`.px-table input[aria-label="${label}"]`).value).toBe('0'); // both versions kept
    await click([...card().querySelectorAll('.px-format input')][1]);
    expect(card().querySelector('.px-part textarea').value).toBe('Each band adds hours × fraction.');
  });

  it('builds a diagram one stage at a time, with the description and the written format still available', async () => {
    await openRoute(journey, 0);
    await goStep(7);
    expect(card().querySelector('.px-part-name').textContent).toMatch(/Route plan/);
    const stages = () => [...card().querySelectorAll('.px-stages button')];
    expect(stages().map((b) => b.textContent)).toEqual(['1. Places', '2. Links', '3. In words']);
    expect(card().querySelector('legend').textContent).toBeTruthy();
    expect([...card().querySelectorAll('legend')].map((l) => l.textContent)).toContain('Places in the route');
    expect([...card().querySelectorAll('legend')].map((l) => l.textContent)).not.toContain('Relationships');
    await click(stages()[2]);
    await setValue(card().querySelector('.px-diagram textarea'), 'Thalassa to Ignis at a constant rate.');
    await click(stages()[0]);
    await click(stages()[2]);
    expect(card().querySelector('.px-diagram textarea').value).toBe('Thalassa to Ignis at a constant rate.');
    expect([...card().querySelectorAll('.px-format label')].map((l) => l.textContent)).toEqual(['Route diagram', 'Written explanation']);
  });

  it('saves only authored step IDs: the cursor inside a step never reaches the wire, and resume lands on that step', async () => {
    const base = clientOf('ben');
    const sent = [];
    const client = { ...base, saveDraft: async (m, body, k) => { sent.push(body.activeStepId); return base.saveDraft(m, body, k); } };
    await openRoute(wind, 0, { client });
    await goStep(5); await click(button('Next')); // step 5's notebook action
    await setValue(card().querySelector('.px-rowfocus input'), '0');
    await click(button('Save now'));
    await goStep(9); await click(button('Next')); // step 9's second notebook action
    await setValue(card().querySelector('.px-part textarea'), 'A daily total cannot show night-time supply.');
    await click(button('Save now'));
    const ids = wind.mission.routes[0].steps.map((x) => x.id);
    expect(sent).toEqual(['capacity-factor', 'reflect']);
    expect(sent.every((id) => ids.includes(id))).toBe(true);
    await act(async () => root.render(null));
    await openRoute(wind, 0, { client });
    expect(document.body.querySelector('.px-progress').textContent).toMatch(/^Step 9 of 9 · part 1 of 2/); // deterministic: first action of the saved step
  });

  it('asks before closing with unsaved work: keep working, save and close, or close without saving', async () => {
    const onClose = vi.fn();
    await openRoute(wind, 0, { onClose });
    await setValue(card().querySelector('.px-part textarea'), 'Unsaved observation note.');
    await click(document.body.querySelector('[aria-label="Close mission"]'));
    expect(onClose).not.toHaveBeenCalled();
    expect(text()).toMatch(/Your latest changes aren’t saved to your account yet\. If you close now, they will be lost\./);
    await click(button('Keep working'));
    expect(card().querySelector('.px-part textarea').value).toBe('Unsaved observation note.');
    await click(document.body.querySelector('[aria-label="Close mission"]'));
    await act(async () => { document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(onClose).not.toHaveBeenCalled(); // Escape on the question keeps working
    expect(card().querySelector('.px-part textarea').value).toBe('Unsaved observation note.');
    await click(document.body.querySelector('[aria-label="Close mission"]'));
    await click(button('Save and close'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(service.drafts.size).toBe(1);
    const saved = [...service.drafts.values()][0];
    expect(saved.evidence.find((e) => e.partId === 'data-quality').text).toBe('Unsaved observation note.');
  });

  it('closes at once when everything is saved, and can close without saving after the question', async () => {
    const onClose = vi.fn();
    await openRoute(wind, 0, { onClose });
    await click(document.body.querySelector('[aria-label="Close mission"]'));
    expect(onClose).toHaveBeenCalledTimes(1); // nothing typed: no question
    onClose.mockClear();
    await act(async () => root.render(null));
    await openRoute(wind, 0, { onClose });
    await setValue(card().querySelector('.px-part textarea'), 'Will be dropped.');
    await click(document.body.querySelector('[aria-label="Close mission"]'));
    await click(button('Close without saving'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(service.drafts.size).toBe(0);
  });

  it('labels the two journey cases clearly so the timing and mass cases never mix', async () => {
    await openRoute(journey, 1);
    expect(document.body.querySelector('.px-meta').textContent).toMatch(/Mass-and-power case: ion duration is a separate 140-day input/);
    expect(document.body.querySelector('.px-meta').textContent).toMatch(/Suggested for grades 9–11/);
    await click(button('Review and send'));
    expect(text()).toMatch(/Do not use the timing case’s 69\.4 days/);
    await act(async () => root.render(null));
    await openRoute(journey, 0);
    expect(document.body.querySelector('.px-meta').textContent).toMatch(/^Timing case/);
  });

  it('reviews with a short checklist first, full evidence on request, and the same explicit Send and validation', async () => {
    await openRoute();
    await click(button('Review and send'));
    expect(document.activeElement.textContent).toBe('Review and send');
    expect(text()).toMatch(/0 of 6 notebook parts ready/);
    const all = [...document.body.querySelectorAll('details')].find((d) => /See everything you’ll send/.test(d.textContent));
    expect(all.open).toBe(false);
    expect(button('Send for review').disabled).toBe(true);
    expect(document.body.querySelector('.px-blockers').textContent).toMatch(/Finish every notebook part.*Write a reflection of at least 20 characters/s);
    await click([...document.body.querySelectorAll('.px-checklist button')][1]); // Go to this part: weighted results
    expect(card().querySelector('.px-part-name').textContent).toMatch(/Weighted results/);
  });

  it('R1: a practice card shows the operation itself, with the short response label separate', async () => {
    await openRoute();
    await goStep(3);
    const design = getMissionLearningDesign(wind.mission.id, 'guided', wind.mission.version, wind.bundle.bundleContentSha256);
    expect(card().querySelector('.px-action').textContent).toBe(design.steps.hours.action); // “Add the hours from all five wind bands.”
    // R6: one answer label with the unit and rounding; no second paragraph repeating it.
    expect(card().querySelector('.px-response-label')).toBeNull();
    expect(card().querySelector('.mx-answer label').textContent).toBe('Your answer (h, as a whole number)');
    expect(card().textContent).not.toContain(design.steps.hours.practiceAction);
    const ref = [...card().querySelectorAll('details')].find((d) => /Reference: what this means/.test(d.textContent));
    expect(ref.open).toBe(false);
    expect([...card().querySelectorAll('details')].some((d) => /Evidence for this task/.test(d.querySelector('summary').textContent))).toBe(true);
  });

  it('R2: the briefing lists the unique NGSS standards of every route, each with its scope', async () => {
    await act(async () => root.render(<PilotMissionSheet entry={journey} registry={FIXTURE_RELEASES} client={clientOf('ben')} preview onClose={() => {}} />)); await settle();
    const ngss = [...document.body.querySelectorAll('details')].find((d) => /Science standards \(NGSS\)/.test(d.textContent));
    const items = [...ngss.querySelectorAll('li')].map((li) => li.textContent);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatch(/^MS-ETS1-2 · Supports comparing designs/);
    expect(items[1]).toMatch(/^HS-ETS1-3 · Supports evaluating tradeoffs/);
  });

  it('R3: with unsaved work in two routes, closing names both, offers no Save and close, and closes only on explicit discard', async () => {
    const onClose = vi.fn();
    await openRoute(journey, 0, { onClose });
    await setValue(card().querySelector('.px-part textarea'), 'Timing-case criteria, not saved.');
    await click(button('Routes'));
    await click(document.body.querySelectorAll('.mx-route')[1]);
    await setValue(card().querySelector('.px-part textarea'), 'Mass-case criteria, not saved.');
    await click(document.body.querySelector('[aria-label="Close mission"]'));
    expect(onClose).not.toHaveBeenCalled();
    expect([...document.body.querySelectorAll('.px-close-list li')].map((li) => li.textContent)).toEqual(journey.mission.routes.map((r) => r.name));
    expect(button('Save and close')).toBeUndefined();
    await click(button('Keep working'));
    expect(card().querySelector('.px-part textarea').value).toBe('Mass-case criteria, not saved.');
    await click(button('Routes')); // closing from the Routes screen with pending work asks too
    await click(document.body.querySelector('[aria-label="Close mission"]'));
    expect(onClose).not.toHaveBeenCalled();
    expect(button('Save and close')).toBeUndefined();
    await click(button('Close without saving'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(service.drafts.size).toBe(0);
  });

  it('R3: a save still in flight for one route counts as unsaved after switching routes; Save and close never drops it', async () => {
    let release;
    const gate = new Promise((r) => { release = r; });
    const base = clientOf('ben');
    const client = { ...base, saveDraft: async (...args) => { await gate; return base.saveDraft(...args); } };
    const onClose = vi.fn();
    await openRoute(journey, 0, { client, onClose });
    await setValue(card().querySelector('.px-part textarea'), 'Timing case, save pending.');
    await click(button('Save now')); // held by the gate
    await click(button('Routes'));
    await click(document.body.querySelectorAll('.mx-route')[1]);
    await setValue(card().querySelector('.px-part textarea'), 'Mass case, not saved.');
    await click(document.body.querySelector('[aria-label="Close mission"]'));
    expect(document.body.querySelectorAll('.px-close-list li')).toHaveLength(2);
    expect(button('Save and close')).toBeUndefined();
    await act(async () => release()); await settle();
    expect(onClose).not.toHaveBeenCalled();
    await click(button('Keep working'));
    await click(document.body.querySelector('[aria-label="Close mission"]'));
    // The timing case is now saved, so only the open mass case is pending and Save and close is safe.
    expect(document.body.querySelector('.px-close-list')).toBeNull();
    await click(button('Save and close'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(service.drafts.size).toBe(2);
  });

  it('R4: Keep working during a delayed Save and close, then editing, never closes or drops the newer edit', async () => {
    let release;
    const gate = new Promise((r) => { release = r; });
    const base = clientOf('ben');
    const client = { ...base, saveDraft: async (...args) => { await gate; return base.saveDraft(...args); } };
    const onClose = vi.fn();
    await openRoute(wind, 0, { client, onClose });
    await setValue(card().querySelector('.px-part textarea'), 'First version.');
    await click(document.body.querySelector('[aria-label="Close mission"]'));
    await click(button('Save and close')); // request held by the gate
    await click(button('Keep working'));
    await setValue(card().querySelector('.px-part textarea'), 'First version, then a newer edit.');
    await act(async () => release()); await settle();
    expect(onClose).not.toHaveBeenCalled();
    expect(card().querySelector('.px-part textarea').value).toBe('First version, then a newer edit.');
    expect(document.body.querySelector('.px-save').textContent).toMatch(/^Not saved/); // the newer edit is not claimed as saved
  });

  it('R4: a save that returns after an edit reports the work as not saved, so Save and close stays open', async () => {
    let release;
    const gate = new Promise((r) => { release = r; });
    const base = clientOf('ben');
    const client = { ...base, saveDraft: async (...args) => { await gate; return base.saveDraft(...args); } };
    await openRoute(wind, 0, { client });
    await setValue(card().querySelector('.px-part textarea'), 'Saved part.');
    await click(button('Save now'));
    await setValue(card().querySelector('.px-part textarea'), 'Saved part, plus more.');
    await act(async () => release()); await settle();
    expect(document.body.querySelector('.px-save').textContent).toMatch(/^Not saved/);
  });

  it('names a single pending task when it is not the one open, and withholds Save and close', async () => {
    await openRoute(journey, 0);
    await setValue(card().querySelector('.px-part textarea'), 'Timing case only.');
    await click(button('Routes'));
    await click(document.body.querySelectorAll('.mx-route')[1]);
    await click(document.body.querySelector('[aria-label="Close mission"]'));
    expect([...document.body.querySelectorAll('.px-close-list li')].map((li) => li.textContent)).toEqual([journey.mission.routes[0].name]);
    expect(button('Save and close')).toBeUndefined();
  });

  it('R5: the focus notebook part is labelled by a rendered element, and a row change is announced briefly', async () => {
    await openRoute();
    await goStep(5); await click(button('Next'));
    const part = card().querySelector('.px-part.is-focus');
    const label = document.getElementById(part.getAttribute('aria-labelledby'));
    expect(label).toBeTruthy();
    expect(label.textContent).toBe('Notebook · Weighted results');
    await click(button('Next row'));
    const live = card().querySelector('.px-rowfocus [role="status"]');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toMatch(/^Row 2 of \d+: /);
    expect(live.textContent).not.toMatch(/Synthetic week/); // not the caption or the whole table
    expect(live.querySelector('table, input')).toBeNull();
  });

  it('R6: in focus mode the Guided sentence starter stays closed until asked for, and the Add starter button still works', async () => {
    await openRoute(); // Guided help by default
    const c = card();
    const starter = [...c.querySelectorAll('details')].find((d) => /See the sentence starter/.test(d.querySelector('summary').textContent));
    expect(starter).toBeTruthy();
    expect(starter.open).toBe(false);
    expect([...c.querySelectorAll('.px-starter-hint')].every((h) => h.closest('details:not([open])'))).toBe(true);
    await click(button('Add sentence starter'));
    expect(card().querySelector('.px-part textarea').value).not.toBe('');
    expect(button('Starter added')).toBeTruthy();
  });

  it('falls back to the authored text when the content hash does not match the reviewed design', async () => {
    const changed = { ...wind, bundle: { ...wind.bundle, bundleContentSha256: '0'.repeat(64) } };
    await openRoute(changed);
    expect(document.body.querySelector('.px-meta').textContent).toMatch(/Grades 6-8/);
    expect(card().querySelector('.px-action').textContent).toBe(wind.mission.routes[0].steps[0].prompt);
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
