// F7.1: subscribeToAuth keeps the stale-session gate and its default observer; { tokens: true }
// switches only the provider to ID-token changes.
import { afterEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ calls: [] }));
vi.mock('../src/firebase.js', () => ({
  auth: { name: 'auth' }, db: {},
  onAuthStateChanged: (a, cb) => { h.calls.push(['state', cb]); return () => h.calls.push(['unsub-state']); },
  onIdTokenChanged: (a, cb) => { h.calls.push(['token', cb]); return () => h.calls.push(['unsub-token']); },
  createUserWithEmailAndPassword: vi.fn(), signInWithEmailAndPassword: vi.fn(), signOut: vi.fn(),
  doc: vi.fn(), setDoc: vi.fn(), getDoc: vi.fn(), collection: vi.fn(), addDoc: vi.fn(), getDocs: vi.fn(), deleteDoc: vi.fn(), serverTimestamp: vi.fn()
}));
const { subscribeToAuth } = await import('../src/auth.js');

afterEach(() => { h.calls.length = 0; delete globalThis.window; });

describe('subscribeToAuth', () => {
  it('waits for the stale-session check, then uses the requested observer', async () => {
    let ready;
    globalThis.window = { __hearIslandAuthReady: new Promise((r) => { ready = r; }) };
    const cb = () => {};
    const stopState = subscribeToAuth(cb);
    const stopToken = subscribeToAuth(cb, { tokens: true });
    await Promise.resolve(); await Promise.resolve();
    expect(h.calls).toEqual([]); // nothing subscribes before the check finishes
    ready(); await new Promise((r) => setTimeout(r, 0));
    expect(h.calls.map(([k]) => k)).toEqual(['state', 'token']);
    stopState(); stopToken();
    expect(h.calls.slice(2).map(([k]) => k)).toEqual(['unsub-state', 'unsub-token']);
  });

  it('never subscribes when cancelled before the check finishes', async () => {
    let ready;
    globalThis.window = { __hearIslandAuthReady: new Promise((r) => { ready = r; }) };
    subscribeToAuth(() => {}, { tokens: true })();
    ready(); await new Promise((r) => setTimeout(r, 0));
    expect(h.calls).toEqual([]);
  });
});
