// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/services/api/endpoints.js', () => ({ getMe: vi.fn() }));
import { getMe } from '../src/services/api/endpoints.js';
import { LAYOUT_CONTRACT_ENABLED, resolveLayout, useLayoutSelection } from '../src/features/lowerSecondary/layoutContract.js';
import { LAYOUTS } from '../src/features/lowerSecondary/layoutSelector.js';
import { SCENARIOS } from './lower-secondary-preview/scenarios.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const me = (uid, layoutSelection, role = 'student') => ({ uid, role, layoutSelection });
const resolve = (scenario) => resolveLayout({ me: me('u', SCENARIOS[scenario].layoutSelection), uid: 'u', role: 'student' });

describe('resolveLayout: documented contract', () => {
  it.each([['age11', 'eligible'], ['age14', 'eligible'], ['age11primary', 'eligible'], ['overrideOn', 'override-lower-secondary']])('%s gets the new layout', (scenario, reason) => {
    expect(resolve(scenario)).toEqual({ layout: LAYOUTS.LOWER_SECONDARY, reason });
  });
  it.each([['age15', 'older'], ['older', 'older'], ['under11', 'outside-rollout'], ['missing', 'missing'], ['invalid', 'invalid'], ['ambiguous', 'ambiguous'], ['overrideOff', 'override-existing'], ['overrideUnder', 'outside-rollout']])('%s keeps the existing layout', (scenario, reason) => {
    expect(resolve(scenario)).toEqual({ layout: LAYOUTS.EXISTING, reason });
  });
});

describe('resolveLayout: fails closed', () => {
  const eligible = SCENARIOS.age14.layoutSelection;
  it.each(['unverified', 'unsupported', 'disagree', 'absent'])('malformed scenario %s keeps the existing layout', (scenario) => {
    expect(resolve(scenario).layout).toBe(LAYOUTS.EXISTING);
  });
  it.each([
    ['null response', null], ['string response', 'yes'], ['null selection', me('u', null)], ['string selection', me('u', 'lower-secondary')],
    ['no version', me('u', { ...eligible, contractVersion: undefined })], ['string version', me('u', { ...eligible, contractVersion: '1' })],
    ['unknown layout', me('u', { ...eligible, layout: 'junior' })], ['camelCase layout', me('u', { ...eligible, layout: 'lowerSecondary' })], ['inherited layout name', me('u', { ...eligible, layout: 'constructor' })],
    ['truthy verified', me('u', { ...eligible, verified: 'true' })], ['bad override', me('u', { ...eligible, override: 'junior' })],
    ['another account', me('other', eligible)], ['another role', me('u', eligible, 'teacher')], ['non-student', me('u', eligible, 'learner')]
  ])('%s', (_, response) => {
    expect(resolveLayout({ me: response, uid: 'u', role: 'student' }).layout).toBe(LAYOUTS.EXISTING);
  });
  it('gives a non-student role the existing layout even with an eligible payload', () => {
    expect(resolveLayout({ me: me('u', eligible, 'teacher'), uid: 'u', role: 'teacher' }).layout).toBe(LAYOUTS.EXISTING);
  });
  it('reads nothing but the response: spoofed profile fields, storage and parameters have no effect', () => {
    localStorage.setItem('layoutSelection', JSON.stringify(eligible));
    localStorage.setItem('layout', 'lowerSecondary');
    window.history.replaceState(null, '', '/?layout=lowerSecondary&learner=age14');
    const spoofed = { uid: 'u', role: 'student', email: 'age12@school.test', ageBand: '13-15', dateOfBirth: '2014-01-01', layoutOverride: 'lower-secondary', age: 12, verified: true };
    expect(resolveLayout({ me: spoofed, uid: 'u', role: 'student' }).layout).toBe(LAYOUTS.EXISTING);
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });
});

describe('useLayoutSelection', () => {
  let host, root, seen;
  function Probe(props) { seen = useLayoutSelection(props); return null; }
  const render = async (props) => { await act(async () => { root.render(<Probe {...props} />); }); };
  const flush = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }); };
  const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
  const enabled = (uid, fetchMe, extra = {}) => ({ uid, role: 'student', enabled: true, fetchMe, ...extra });
  const eligible = SCENARIOS.age14.layoutSelection, older = SCENARIOS.age15.layoutSelection;
  beforeEach(() => { vi.clearAllMocks(); host = document.createElement('div'); root = createRoot(host); });
  afterEach(async () => { await act(async () => root.unmount()); vi.useRealTimers(); });

  it('ships disabled: no request, no pending, existing layout for an eligible account', async () => {
    getMe.mockResolvedValue(me('u', eligible));
    expect(LAYOUT_CONTRACT_ENABLED).toBe(false);
    await render({ uid: 'u', role: 'student' });
    await flush();
    expect(getMe).not.toHaveBeenCalled();
    expect(seen).toMatchObject({ layout: LAYOUTS.EXISTING, pending: false });
  });
  it('once enabled reads through the API client and holds until the response arrives', async () => {
    getMe.mockResolvedValue(me('u', eligible));
    await render({ uid: 'u', role: 'student', enabled: true });
    await flush();
    expect(getMe).toHaveBeenCalledTimes(1);
    expect(seen).toMatchObject({ layout: LAYOUTS.LOWER_SECONDARY, reason: 'eligible', pending: false });
  });
  it('does not ask for signed-out or non-student accounts', async () => {
    const fetchMe = vi.fn();
    await render(enabled(null, fetchMe));
    expect(seen.pending).toBe(false);
    await render({ uid: 'c', role: 'coach', enabled: true, fetchMe });
    await flush();
    expect(fetchMe).not.toHaveBeenCalled();
    expect(seen).toMatchObject({ layout: LAYOUTS.EXISTING, pending: false });
  });
  it('clears on sign-out: the next account never inherits the layout', async () => {
    const fetchA = vi.fn(async () => me('a', eligible));
    await render(enabled('a', fetchA));
    await flush();
    expect(seen.layout).toBe(LAYOUTS.LOWER_SECONDARY);
    await render(enabled(null, fetchA));
    expect(seen).toMatchObject({ layout: LAYOUTS.EXISTING, pending: false });
    const b = deferred();
    await render(enabled('b', () => b.promise));
    expect(seen).toMatchObject({ layout: LAYOUTS.EXISTING, pending: true });
    await act(async () => b.resolve(me('b', older)));
    await flush();
    expect(seen).toMatchObject({ layout: LAYOUTS.EXISTING, reason: 'older', pending: false });
  });
  it('ignores a stale response after switching accounts', async () => {
    const a = deferred(), b = deferred();
    await render(enabled('a', () => a.promise));
    await render(enabled('b', () => b.promise));
    await act(async () => b.resolve(me('b', older)));
    await flush();
    expect(seen.reason).toBe('older');
    await act(async () => a.resolve(me('a', eligible)));
    await flush();
    expect(seen).toMatchObject({ layout: LAYOUTS.EXISTING, reason: 'older', pending: false });
  });
  it('switching straight from an eligible account shows nothing of theirs while the next one loads', async () => {
    await render(enabled('a', async () => me('a', eligible)));
    await flush();
    const b = deferred();
    await render(enabled('b', () => b.promise));
    expect(seen).toMatchObject({ layout: LAYOUTS.EXISTING, pending: true });
  });
  it('a failed request keeps the existing layout', async () => {
    await render(enabled('u', async () => { throw new Error('503'); }));
    await flush();
    expect(seen).toMatchObject({ layout: LAYOUTS.EXISTING, pending: false });
  });
  it('a synchronous throw keeps the existing layout', async () => {
    await render(enabled('u', () => { throw new Error('boom'); }));
    await flush();
    expect(seen).toMatchObject({ layout: LAYOUTS.EXISTING, pending: false });
  });
  it('a request that hangs stops holding the page, and a late answer is ignored', async () => {
    vi.useFakeTimers();
    const late = deferred();
    await render(enabled('u', () => late.promise, { timeoutMs: 5000 }));
    expect(seen.pending).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(seen).toMatchObject({ layout: LAYOUTS.EXISTING, pending: false });
    await act(async () => { late.resolve(me('u', eligible)); await vi.advanceTimersByTimeAsync(0); });
    expect(seen.layout).toBe(LAYOUTS.EXISTING);
  });
});
