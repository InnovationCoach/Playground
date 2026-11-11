/**
 * Truthful provider connection states (O0).
 *
 * The UI only ever shows what a server response says. Each state below stays
 * distinct: "we have not connected", "access is being arranged", "we could not
 * check", "connected", "connected but the last sync is old" and "the last sync
 * failed" each mean something different to a learner, parent or coach.
 *
 * Nothing here decides that a provider is connected. A value the server did
 * not send, or one this client does not recognise, is `unknown`, never
 * `connected`. Progress with no number is unavailable, not zero.
 */

export const PROVIDER_STATES = Object.freeze({
  NOT_CONNECTED: 'not_connected',
  ACCESS_PENDING: 'access_pending',
  UNKNOWN: 'unknown',
  CONNECTED: 'connected',
  STALE: 'stale',
  SYNC_FAILED: 'sync_failed'
});

const KNOWN = new Set(Object.values(PROVIDER_STATES));

const COPY = {
  not_connected: {
    label: 'Not connected',
    detail: 'Your school has not connected this provider to WeLearn yet.'
  },
  access_pending: {
    label: 'Access pending',
    detail: 'Your school is arranging access. Courses and results appear here once the connection is confirmed.'
  },
  unknown: {
    label: 'Status unknown',
    detail: 'We could not check the connection right now. Nothing has been changed.'
  },
  connected: {
    label: 'Connected',
    detail: 'Course information comes from the provider.'
  },
  stale: {
    label: 'Out of date',
    detail: 'The provider has not sent new information recently. What you see is the last data we received.'
  },
  sync_failed: {
    label: 'Last update failed',
    detail: 'The last update from the provider did not complete. What you see is the last data we received.'
  }
};

function toMillis(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Normalise a provider status from the school service.
 *
 * @param {string|object|undefined} raw  `providerStatus.edmentum` as sent by
 *   GET /api/learning-context: today a bare string ('access_pending'); a
 *   later contract may send { state, syncedAt, lastAttemptAt, capabilities }.
 * @param {object} [request]  { loading, error } from the resource hook.
 * @returns {{ state, label, detail, syncedAt, lastAttemptAt, canLaunch, loading, synthetic }}
 */
export function providerStatus(raw, { loading = false, error = null } = {}) {
  if (loading && raw === undefined) {
    return { state: 'loading', label: 'Checking…', detail: 'Checking the connection.', syncedAt: null, lastAttemptAt: null, canLaunch: false, loading: true, synthetic: false };
  }
  const record = raw && typeof raw === 'object' ? raw : { state: raw };
  let state = KNOWN.has(record.state) ? record.state : PROVIDER_STATES.UNKNOWN;
  // A failed request is "could not check", even if an older response said more.
  if (error) state = PROVIDER_STATES.UNKNOWN;
  const syncedAt = toMillis(record.syncedAt);
  const lastAttemptAt = toMillis(record.lastAttemptAt);
  const copy = COPY[state];
  return {
    state,
    label: copy.label,
    detail: copy.detail,
    syncedAt,
    lastAttemptAt,
    // Launch is a separate capability the server must declare; being
    // connected for progress does not make one-click launch work.
    canLaunch: state === PROVIDER_STATES.CONNECTED && record.capabilities?.launch === true,
    loading: false,
    synthetic: record.synthetic === true
  };
}

/** True only for states where provider data may be on screen. */
export function hasProviderData(status) {
  return [PROVIDER_STATES.CONNECTED, PROVIDER_STATES.STALE, PROVIDER_STATES.SYNC_FAILED].includes(status?.state);
}

/**
 * A progress figure the UI can show. `null`, missing or non-numeric values are
 * unavailable; 0 is a real zero.
 */
export function progressFigure(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return { available: false, percent: null, text: 'Not available' };
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  return { available: true, percent, text: `${percent}%` };
}
