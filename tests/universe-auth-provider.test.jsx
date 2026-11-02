// @vitest-environment jsdom
// F7.1: the real AuthProvider driven through its auth/ID-token observer, with delayed profile and
// claim reads, so stale callbacks, token-only organization changes and late refreshes are exercised.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ observer: null, options: null, profiles: [], logout: null, tracking: [] }));
vi.mock('../src/auth.js', () => ({
  subscribeToAuth: (cb, options) => { h.observer = cb; h.options = options; return () => { h.observer = null; }; },
  // Each read waits until the test resolves it, so ordering is under test control.
  getUserProfile: (uid) => new Promise((resolve) => h.profiles.push({ uid, resolve })),
  logoutUser: (...a) => h.logout(...a)
}));
vi.mock('../src/utils/timeTracker.js', () => ({ startTimeTracking: (uid) => h.tracking.push(['start', uid]), stopTimeTracking: () => h.tracking.push(['stop']) }));
vi.mock('../src/utils/deviceData.js', () => ({ purgeUnscopedUserData: () => {}, purgeUserDataFor: () => {} }));
vi.mock('../src/app/i18n/LocaleProvider.jsx', () => ({ useLocale: () => ({ setLocale: () => {} }) }));

const { AuthProvider, useAuth } = await import('../src/app/AuthProvider.jsx');

let host, root, seen;
const settle = async (n = 6) => { for (let i = 0; i < n; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const user = (uid, claims) => ({ uid, email: `${uid}@example.test`, claims, getIdTokenResult: async function () { return { claims: { ...this.claims } }; } });
const profile = (uid, extra = {}) => ({ uid, displayName: uid, ...extra });
const emit = async (u) => { await act(async () => h.observer(u)); };
const resolveNext = async (uid, value) => {
  const i = h.profiles.findIndex((p) => p.uid === uid);
  const [p] = h.profiles.splice(i, 1);
  await act(async () => p.resolve(value));
  await settle();
};
function Probe() { seen = useAuth(); return null; }

beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  Object.assign(h, { observer: null, options: null, profiles: [], tracking: [], logout: vi.fn(async () => ({ success: true })) });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<AuthProvider><Probe /></AuthProvider>));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

describe('AuthProvider context (F7.1)', () => {
  it('observes ID-token changes, not only sign-in and sign-out', () => {
    expect(h.options).toEqual({ tokens: true });
  });

  it('a delayed callback for account A cannot restore A or sign out B', async () => {
    const a = user('learner-a', { role: 'student', orgId: 'org-a' });
    const b = user('learner-b', { role: 'student', orgId: 'org-b' });
    await emit(a); // A's profile read is still pending
    await emit(b);
    await resolveNext('learner-b', profile('learner-b'));
    expect(seen).toMatchObject({ status: 'ready', orgId: 'org-b' });
    expect(seen.user.uid).toBe('learner-b');

    await resolveNext('learner-a', null); // A's read "failed" late: it must not sign B out
    expect(h.logout).not.toHaveBeenCalled();
    expect(seen.user.uid).toBe('learner-b');
    expect(seen.orgId).toBe('org-b');
    expect(h.tracking).toEqual([['start', 'learner-b']]);
  });

  it('a delayed callback for A after sign-out leaves the screen signed out', async () => {
    const a = user('learner-a', { role: 'student', orgId: 'org-a' });
    await emit(a);
    await emit(null);
    expect(seen).toMatchObject({ status: 'signed-out', user: null, orgId: null });
    await resolveNext('learner-a', profile('learner-a'));
    expect(seen).toMatchObject({ status: 'signed-out', user: null, orgId: null });
    expect(h.tracking.some(([k, uid]) => k === 'start' && uid === 'learner-a')).toBe(false);
  });

  it('a same-user token change updates or removes the organization without reloading the profile', async () => {
    const a = user('learner-a', { role: 'student', orgId: 'org-a', classIds: ['c1'] });
    await emit(a);
    await resolveNext('learner-a', profile('learner-a'));
    expect(seen).toMatchObject({ status: 'ready', orgId: 'org-a', classIds: ['c1'] });

    a.claims = { role: 'student', orgId: 'org-b', classIds: ['c2'] };
    await emit(a); await settle();
    expect(seen).toMatchObject({ status: 'ready', orgId: 'org-b', classIds: ['c2'] });
    expect(h.profiles).toHaveLength(0); // no second profile read, no loading flash

    a.claims = { role: 'student', classIds: ['c2'] }; // organization claim removed
    await emit(a); await settle();
    expect(seen).toMatchObject({ status: 'ready', orgId: null });

    const unchanged = seen;
    await emit(a); await settle(); // a plain refresh with the same claims changes nothing
    expect(seen).toBe(unchanged);
  });

  it('a role change in the token takes the full load path instead of being patched in place', async () => {
    const a = user('person-a', { role: 'student', orgId: 'org-a' });
    await emit(a);
    await resolveNext('person-a', profile('person-a'));
    a.claims = { role: 'admin', orgId: 'org-a' };
    await emit(a); await settle();
    expect(seen.status).toBe('loading');
    expect(seen.orgId).toBeNull();
    await resolveNext('person-a', profile('person-a'));
    expect(seen).toMatchObject({ status: 'ready', role: 'admin', orgId: 'org-a' });
  });

  it('a slow claims read for an older token loses to the newer token', async () => {
    let release;
    const gate = new Promise((r) => { release = r; });
    const a = user('learner-a', { role: 'student', orgId: 'org-a' });
    await emit(a);
    await resolveNext('learner-a', profile('learner-a'));
    const slow = { ...a, getIdTokenResult: async () => { await gate; return { claims: { role: 'student', orgId: 'org-old' } }; } };
    await emit(slow);
    a.claims = { role: 'student', orgId: 'org-new' };
    await emit(a); await settle();
    await act(async () => release()); await settle();
    expect(seen.orgId).toBe('org-new');
  });

  it('a delayed refreshProfile for A cannot overwrite B’s profile', async () => {
    const a = user('learner-a', { role: 'student', orgId: 'org-a' });
    const b = user('learner-b', { role: 'student', orgId: 'org-b' });
    await emit(a);
    await resolveNext('learner-a', profile('learner-a'));
    let pending;
    await act(async () => { pending = seen.refreshProfile(); });
    await emit(b);
    await resolveNext('learner-b', profile('learner-b', { displayName: 'B' }));
    await resolveNext('learner-a', profile('learner-a', { displayName: 'A-REFRESHED' }));
    await act(async () => pending);
    expect(seen.user.uid).toBe('learner-b');
    expect(seen.profile.displayName).toBe('B');
  });

  it('applies a refreshProfile answer for the same signed-in account', async () => {
    const a = user('learner-a', { role: 'student', orgId: 'org-a' });
    await emit(a);
    await resolveNext('learner-a', profile('learner-a', { classIds: [] }));
    let pending;
    await act(async () => { pending = seen.refreshProfile(); });
    await resolveNext('learner-a', profile('learner-a', { classIds: ['joined'] }));
    await act(async () => pending);
    expect(seen.profile.classIds).toEqual(['joined']);
  });
});
