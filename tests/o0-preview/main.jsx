import { createRoot } from 'react-dom/client';
import { ProviderStatusCard } from '../../src/features/edmentum/ProviderStatusCard.jsx';
import { providerStatus } from '../../src/features/edmentum/providerState.js';
import { EdmentumIntegrationConsole } from '../../src/features/edmentum/EdmentumIntegrationConsole.jsx';
import '../../src/features/admin/admin.css';
import '../../src/features/edmentum/edmentum.css';

// SYNTHETIC: every state, date and value below is made up for review screenshots.
const DAY = 86400000, now = Date.parse('2026-11-09T09:00:00Z');
const STATES = [
  ['Loading', providerStatus(undefined, { loading: true })],
  ['Not connected', providerStatus('not_connected')],
  ['Access pending (what the server sends today)', providerStatus('access_pending')],
  ['Request failed', providerStatus('connected', { error: { code: 'UNAVAILABLE' } })],
  ['Unrecognised value', providerStatus('ready')],
  ['Connected (sample)', providerStatus({ state: 'connected', syncedAt: now - 3 * 3600000, synthetic: true })],
  ['Stale (sample)', providerStatus({ state: 'stale', syncedAt: now - 9 * DAY, synthetic: true })],
  ['Last sync failed (sample)', providerStatus({ state: 'sync_failed', syncedAt: now - 4 * DAY, lastAttemptAt: now - 2 * 3600000, synthetic: true })]
];
const view = new URLSearchParams(window.location.search).get('view') || 'states';

function States() {
  return (
    <main className="gh-app" style={{ maxWidth: 760, margin: '0 auto', padding: 16 }}>
      <p style={{ fontWeight: 700, color: '#9a5b00' }}>Synthetic preview. Not connected to any school or provider.</p>
      <h1 style={{ fontSize: '1.3rem' }}>My Courses: Edmentum section, every state</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {STATES.map(([caption, status]) => (
          <section key={caption} aria-label={caption}>
            <h2 style={{ fontSize: '0.8rem', margin: '0 0 4px', color: '#5b6478' }}>{caption}</h2>
            <ProviderStatusCard provider="Edmentum" status={status} onRetry={() => {}} />
          </section>
        ))}
      </div>
    </main>
  );
}

function Console() {
  return <div className="gh-app" style={{ background: '#0d1117', minHeight: '100vh' }}><EdmentumIntegrationConsole coachUser={{ uid: 'synthetic-coach', role: 'teacher' }} /></div>;
}

createRoot(document.getElementById('root')).render(view === 'console' ? <Console /> : <States />);
