import { Link2, Unplug, Clock, AlertTriangle, HelpCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { PROVIDER_STATES } from './providerState.js';

const ICONS = {
  [PROVIDER_STATES.NOT_CONNECTED]: Unplug,
  [PROVIDER_STATES.ACCESS_PENDING]: Clock,
  [PROVIDER_STATES.UNKNOWN]: HelpCircle,
  [PROVIDER_STATES.CONNECTED]: CheckCircle2,
  [PROVIDER_STATES.STALE]: AlertTriangle,
  [PROVIDER_STATES.SYNC_FAILED]: AlertTriangle,
  loading: RefreshCw
};

function dateText(ms) {
  if (!ms) return null;
  return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * One provider's connection state, said plainly. Renders exactly the state it
 * is given (see providerState.js); it never adds courses, scores or a launch
 * button of its own.
 */
export function ProviderStatusCard({ provider, status, onRetry, children }) {
  const Icon = ICONS[status.state] || Link2;
  const synced = dateText(status.syncedAt);
  const attempted = dateText(status.lastAttemptAt);
  return (
    <div className="gh-placeholder mc-provider-status" data-state={status.state} role={status.loading ? 'status' : undefined}>
      <span className="gh-empty-icon"><Icon size={20} aria-hidden="true" /></span>
      <div className="mc-provider-status-body">
      <p className="mc-provider-status-head"><strong>{provider}: {status.label}</strong>{status.synthetic && <span className="mc-provider-sample"> · Sample data</span>}</p>
      <p className="mc-provider-status-detail">{status.detail}</p>
      {(synced || attempted) && (
        <p className="mc-provider-status-dates">
          {synced && <>Last received {synced}. </>}
          {attempted && status.state === PROVIDER_STATES.SYNC_FAILED && <>Last attempt {attempted}.</>}
        </p>
      )}
      {status.state === PROVIDER_STATES.UNKNOWN && onRetry && (
        <button type="button" className="gh-btn" onClick={onRetry}>Check again</button>
      )}
      {children}
      </div>
    </div>
  );
}
