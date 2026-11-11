// @vitest-environment jsdom
// O0: disconnected, pending, unknown, zero, stale and failed states stay
// distinct, and a failed launch never reports success.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/firebase.js', () => ({ auth: { currentUser: { uid: 'coach' } }, usingEmulators: true }));
vi.mock('../src/services/api/apiClient.js', () => ({ schoolRequest: vi.fn() }));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { providerStatus, progressFigure, hasProviderData, PROVIDER_STATES } from '../src/features/edmentum/providerState.js';
import { launchEdmentumCourse } from '../src/features/edmentum/edmentumService.js';
import * as edmentumService from '../src/features/edmentum/edmentumService.js';
import { ProviderStatusCard } from '../src/features/edmentum/ProviderStatusCard.jsx';
import { EdmentumIntegrationConsole } from '../src/features/edmentum/EdmentumIntegrationConsole.jsx';
import { SYNTHETIC_EDMENTUM_COURSES } from '../src/features/edmentum/fixtures/syntheticEdmentum.js';
import { buildChildProgress } from '../src/features/parent/childProgress.js';

const course = SYNTHETIC_EDMENTUM_COURSES[0];

describe('providerStatus', () => {
  it('keeps every server state distinct and never invents "connected"', () => {
    const states = ['not_connected', 'access_pending', 'connected', 'stale', 'sync_failed'];
    const labels = states.map((s) => providerStatus(s).label);
    expect(new Set(labels).size).toBe(states.length);
    expect(providerStatus(undefined).state).toBe(PROVIDER_STATES.UNKNOWN);
    expect(providerStatus('ready').state).toBe(PROVIDER_STATES.UNKNOWN);
    expect(providerStatus(true).state).toBe(PROVIDER_STATES.UNKNOWN);
    expect(providerStatus({ connected: true }).state).toBe(PROVIDER_STATES.UNKNOWN);
  });

  it('treats a failed request as unknown, even when an older response said connected', () => {
    const s = providerStatus('connected', { error: { code: 'UNAVAILABLE' } });
    expect(s.state).toBe(PROVIDER_STATES.UNKNOWN);
    expect(s.canLaunch).toBe(false);
  });

  it('shows a loading state only while there is no answer yet', () => {
    expect(providerStatus(undefined, { loading: true }).state).toBe('loading');
  });

  it('requires an explicit launch capability before launch is offered', () => {
    expect(providerStatus('connected').canLaunch).toBe(false);
    expect(providerStatus({ state: 'connected', capabilities: { launch: true } }).canLaunch).toBe(true);
    expect(providerStatus({ state: 'stale', capabilities: { launch: true } }).canLaunch).toBe(false);
  });

  it('keeps source dates and marks synthetic data', () => {
    const s = providerStatus({ state: 'sync_failed', syncedAt: '2026-11-01T08:00:00Z', lastAttemptAt: '2026-11-08T08:00:00Z', synthetic: true });
    expect(s.syncedAt).toBe(Date.parse('2026-11-01T08:00:00Z'));
    expect(s.lastAttemptAt).toBe(Date.parse('2026-11-08T08:00:00Z'));
    expect(s.synthetic).toBe(true);
    expect(hasProviderData(s)).toBe(true);
    expect(hasProviderData(providerStatus('access_pending'))).toBe(false);
  });
});

describe('progressFigure', () => {
  it('separates "no data" from a real zero', () => {
    expect(progressFigure(null)).toEqual({ available: false, percent: null, text: 'Not available' });
    expect(progressFigure(undefined).available).toBe(false);
    expect(progressFigure(NaN).available).toBe(false);
    expect(progressFigure('40').available).toBe(false);
    expect(progressFigure(0)).toEqual({ available: true, percent: 0, text: '0%' });
    expect(progressFigure(140).percent).toBe(100);
  });
});

describe('edmentumService', () => {
  afterEach(() => vi.clearAllMocks());

  it('exports no client-side connection default, catalogue or score store', () => {
    expect(Object.keys(edmentumService)).toEqual(['launchEdmentumCourse']);
  });

  it('reports failure when the launch service cannot be reached', async () => {
    schoolRequest.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'UNAVAILABLE', status: 0 }));
    const r = await launchEdmentumCourse(course);
    expect(r.ok).toBe(false);
    expect(r.code).toBe('UNAVAILABLE');
    expect(r).not.toHaveProperty('launchUrl');
  });

  it('reports failure for a forbidden launch', async () => {
    schoolRequest.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'FORBIDDEN', status: 403 }));
    const r = await launchEdmentumCourse(course);
    expect(r).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('reports failure when the reply has no launch package', async () => {
    schoolRequest.mockResolvedValueOnce({ launchUrl: 'https://example.invalid' });
    expect((await launchEdmentumCourse(course)).ok).toBe(false);
    schoolRequest.mockResolvedValueOnce(null);
    expect((await launchEdmentumCourse(course)).code).toBe('BAD_RESPONSE');
  });

  it('reports success only with a server launch package, and sends no client identity', async () => {
    schoolRequest.mockResolvedValueOnce({ launchUrl: 'https://example.invalid/x', id_token: 'a.b.c', courseTitle: 'T' });
    const r = await launchEdmentumCourse(course);
    expect(r).toEqual({ ok: true, launchUrl: 'https://example.invalid/x', idToken: 'a.b.c', courseTitle: 'T' });
    const body = schoolRequest.mock.calls[0][2].body;
    expect(body).not.toHaveProperty('uid');
    expect(body).not.toHaveProperty('email');
  });
});

describe('parent Edmentum section', () => {
  const build = (edmentum) => buildChildProgress({ child: { uid: 'c', displayName: 'Child' }, edmentum, now: new Date('2026-11-09T00:00:00Z') }).edmentum;

  it('keeps pending, unknown and not-connected apart, with no courses', () => {
    expect(build(undefined)).toEqual({ status: 'not_connected', courses: [] });
    expect(build({ status: 'access_pending' })).toEqual({ status: 'access_pending', courses: [] });
    expect(build({ status: 'weird' })).toEqual({ status: 'unknown', courses: [] });
  });

  it('keeps last data and its date for stale and failed syncs', () => {
    const s = build({ status: 'sync_failed', syncedAt: '2026-11-01T00:00:00Z', courses: [{ id: 'm', title: 'Maths', progressPercent: 0 }] });
    expect(s.status).toBe('sync_failed');
    expect(s.syncedAt).toBe(Date.parse('2026-11-01T00:00:00Z'));
    expect(s.courses[0].progressPercent).toBe(0);
  });

  it('carries the synthetic flag from test fixtures', () => {
    expect(build({ status: 'connected', synthetic: true, courses: [] }).synthetic).toBe(true);
  });
});

let host, root;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.clearAllMocks(); vi.unstubAllGlobals(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

describe('ProviderStatusCard', () => {
  it('renders the state it is given and offers a retry only when unknown', async () => {
    const retry = vi.fn();
    await act(async () => root.render(<ProviderStatusCard provider="Edmentum" status={providerStatus('access_pending')} onRetry={retry} />));
    expect(host.textContent).toContain('Edmentum: Access pending');
    expect(host.querySelector('button')).toBeNull();
    await act(async () => root.render(<ProviderStatusCard provider="Edmentum" status={providerStatus('connected', { error: {} })} onRetry={retry} />));
    expect(host.textContent).toContain('Status unknown');
    await act(async () => host.querySelector('button').click());
    expect(retry).toHaveBeenCalled();
  });

  it('shows the source date for a failed sync', async () => {
    await act(async () => root.render(<ProviderStatusCard provider="Edmentum" status={providerStatus({ state: 'sync_failed', syncedAt: '2026-11-01T08:00:00Z', lastAttemptAt: '2026-11-08T08:00:00Z' })} />));
    expect(host.textContent).toContain('Last update failed');
    expect(host.textContent).toContain('Last received');
    expect(host.textContent).toContain('Last attempt');
  });
});

describe('EdmentumIntegrationConsole', () => {
  function serve({ edmentum = 'access_pending', launch } = {}) {
    schoolRequest.mockImplementation((method, path) => {
      if (path === '/api/learning-context') return Promise.resolve({ classes: [], schools: [], providerStatus: { edmentum } });
      if (path === '/api/lti/config') return Promise.resolve({ registration: { issuer: 'http://localhost', clientId: 'client-x' } });
      if (path.startsWith('/api/lti/launch/')) return launch();
      return Promise.reject(Object.assign(new Error('nf'), { code: 'NOT_FOUND', status: 404 }));
    });
  }
  const findButton = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));

  it('shows the school connection state, not a "ready" badge', async () => {
    serve();
    await act(async () => root.render(<EdmentumIntegrationConsole coachUser={{ uid: 'coach', role: 'teacher' }} />));
    expect(host.textContent).toContain('School connection: Access pending');
    expect(host.textContent).not.toMatch(/AGS Ready|Connected Edmentum/);
    expect(host.textContent).not.toContain('Test AGS Passback');
    expect(host.textContent).toContain('Synthetic sample courses');
    expect(host.textContent).toContain('client-x');
  });

  it('says a launch failed when the server rejects it', async () => {
    serve({ launch: () => Promise.reject(Object.assign(new Error('x'), { code: 'UNAVAILABLE', status: 0 })) });
    await act(async () => root.render(<EdmentumIntegrationConsole coachUser={{ uid: 'coach', role: 'teacher' }} />));
    await act(async () => findButton('Request test launch token').click());
    const alert = host.querySelector('[role="alert"]');
    expect(alert.dataset.ok).toBe('false');
    expect(alert.textContent).toContain('Launch failed');
    expect(alert.textContent).not.toContain('token issued');
  });

  it('labels a failed self-test as failed, with no fabricated passes', async () => {
    serve();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }));
    await act(async () => root.render(<EdmentumIntegrationConsole coachUser={{ uid: 'coach', role: 'teacher' }} />));
    await act(async () => findButton('Run signing self-test').click());
    expect(host.textContent).toContain('0 of 1 checks passed');
    expect(host.textContent).toContain('Nothing was checked');
  });
});
