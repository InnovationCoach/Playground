/**
 * Client for the WeLearn backend API (contract: docs/BACKEND-PHASE-A-PROMPT-FOR-GEMINI.md §7).
 *
 * Two modes:
 *   'live' - real HTTP to same-origin /api with the caller's Firebase ID token.
 *   'mock' - an in-browser implementation of the same contract over made-up
 *            accounts (mockBackend.js), so the admin console, account screens
 *            and parent portal can be built before the backend is deployed.
 *
 * Mock is only ever possible against the Firebase emulators or in a Vite dev
 * build. A production build pointed at real Firebase always goes live, so a
 * stray VITE_API_MODE can never show a school made-up records. Screens show a
 * "Test data" banner whenever mock is on (see isMockApi).
 */
import { auth, getAuthClaims, usingEmulators } from '../../firebase.js';
import { API_BASE } from '../apiBase.js';

export class ApiError extends Error {
  constructor({ code = 'INTERNAL', message = '', field = null, status = 0 } = {}) {
    super(message || code);
    this.name = 'ApiError';
    this.code = code;
    this.field = field;
    this.status = status;
  }
}

function resolveMode() {
  const requested = import.meta.env?.VITE_API_MODE;
  const mockAllowed = usingEmulators || import.meta.env?.DEV === true;
  if (!mockAllowed) return 'live';
  if (requested === 'live' || requested === 'mock') return requested;
  // Default: the backend is not deployed yet (Phase A), so emulator reviews use mock.
  return usingEmulators ? 'mock' : 'live';
}

export const API_MODE = resolveMode();
export const isMockApi = API_MODE === 'mock';

function buildQuery(query) {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    params.set(k, Array.isArray(v) ? v.join(',') : String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

let mockModule = null;

async function mockRequest(method, path, { query, body }) {
  // Loaded on demand so the fixtures never ship in a live bundle's main chunk.
  mockModule = mockModule || await import('./mockBackend.js');
  const user = auth.currentUser;
  if (!user) throw new ApiError({ code: 'UNAUTHENTICATED', status: 401 });
  const claims = await getAuthClaims();
  const caller = {
    uid: user.uid,
    email: user.email,
    role: claims.role || 'student',
    name: user.displayName || user.email?.split('@')[0] || 'You'
  };
  const res = await mockModule.handle({ method, path, query: query || {}, body: body || null, caller });
  if (res.status >= 400) {
    throw new ApiError({ ...res.body.error, status: res.status });
  }
  return res.body;
}

async function liveRequest(method, path, { query, body }) {
  const user = auth.currentUser;
  if (!user) throw new ApiError({ code: 'UNAUTHENTICATED', status: 401 });

  const token = await user.getIdToken();
  let res;
  try {
    res = await fetch(`${API_BASE}${path}${buildQuery(query)}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError({ code: 'NETWORK', status: 0 });
  }

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (!res.ok) {
    // Contract error shape: { error: { code, message, field } }. Anything else
    // (an HTML 404 from Hosting because the backend is not deployed, a proxy
    // error) is reported by status so the UI still says something true.
    const err = data?.error;
    if (err?.code) throw new ApiError({ ...err, status: res.status });
    const fallback = res.status === 404 ? 'NOT_FOUND'
      : res.status === 401 ? 'UNAUTHENTICATED'
      : res.status === 403 ? 'FORBIDDEN'
      : res.status === 429 ? 'RATE_LIMITED'
      : 'INTERNAL';
    throw new ApiError({ code: fallback, status: res.status });
  }
  return data;
}

export function apiRequest(method, path, options = {}) {
  return (isMockApi ? mockRequest : liveRequest)(method, path, options);
}

/**
 * Message for an ApiError in the current language. `t` comes from useLocale().
 * Server messages are English only, so a known code is always translated
 * locally; the server's text is used only for codes we have no string for.
 */
export function describeApiError(err, t) {
  if (!err) return '';
  if (err.code === 'VALIDATION') return err.message || t('common.error');
  const key = `errors.${err.code}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return err.message || t('common.error');
}
