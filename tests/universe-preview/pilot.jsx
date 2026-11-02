import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MyUniverseExplorer } from '../../src/features/universe/explore/MyUniverseExplorer.jsx';
import { CoachUniverseSubmissions } from '../../src/features/coach/universe/CoachUniverseSubmissions.jsx';
// Fixture registry: imported only by this explicit synthetic preview entry, never by the app.
import { FIXTURE_RELEASES } from '../../shared/universe/fixtures/index.js';
import { createSyntheticService, SYNTHETIC_PEOPLE } from './syntheticUniverseService.js';
import { createUniverseClient } from '../../src/features/universe/pilot/universeClient.js';
import catalogUrl from '../../public/cosmos/v1/catalog.json?url';

const flags = new URLSearchParams(location.search);
const service = createSyntheticService({ latency: Number(flags.get('latency') ?? 350) });
if (flags.get('mode')) service.setMode(flags.get('mode'));

function Harness() {
  const [who, setWho] = useState(flags.get('as') || 'amira');
  const [view, setView] = useState(flags.get('view') || (who === 'rivera' ? 'coach' : 'explorer'));
  const [mode, setMode] = useState(service.mode);
  const [run, setRun] = useState(0);
  const person = SYNTHETIC_PEOPLE[who];
  // The real HTTP adapter, talking to the synthetic service through a fetch stand-in.
  const client = useMemo(() => createUniverseClient({ fetchImpl: service.fetchFor(person), getToken: async () => `synthetic-token-${person.uid}` }), [person, run]);
  const viewerKey = `${person.uid}|${person.orgId}`;
  const bar = <details className="pv-bar" aria-label="Synthetic preview controls">
    <summary>SYNTHETIC PREVIEW · {person.displayName} · {mode}</summary><span>Fictional people and data · no Firebase · nothing leaves this page</span>
    <label>Signed in as <select value={who} onChange={(e) => { setWho(e.target.value); setView(e.target.value === 'rivera' ? 'coach' : 'explorer'); }}>
      {Object.entries(SYNTHETIC_PEOPLE).map(([id, p]) => <option key={id} value={id}>{p.displayName} · {p.orgId}</option>)}</select></label>
    <label>Service <select value={mode} onChange={(e) => { service.setMode(e.target.value); setMode(e.target.value); setRun((n) => n + 1); }}>
      <option value="normal">normal</option><option value="offline">offline (not connected)</option><option value="unavailable">503 unavailable</option><option value="withdrawn">mission withdrawn</option></select></label>
    <button type="button" onClick={() => { service.reset(); setMode('normal'); setRun((n) => n + 1); }}>Reset data</button>
    {person.role === 'student' && <button type="button" onClick={() => setView('explorer')}>Open explorer</button>}
  </details>;
  if (view === 'coach') return <>{bar}<main className="pv-coach">
    {person.role !== 'coach' && <p>Switch to Ms Rivera to see the coach queue.</p>}
    {person.role === 'coach' && <CoachUniverseSubmissions key={`${viewerKey}|${run}`} coachUser={person} client={client} registry={FIXTURE_RELEASES} />}
  </main></>;
  if (view === 'explorer' && person.role === 'student') return <>{bar}<MyUniverseExplorer key={run} preview catalogUrl={catalogUrl} forceTextView={flags.get('text') === '1'}
    missionRegistry={FIXTURE_RELEASES} missionClient={client} viewerKey={viewerKey} onClose={() => setView('home')}
    initialMission={flags.get('open') ? { id: flags.get('open'), route: flags.get('route'), view: flags.get('tab'), step: flags.get('step') } : null} /></>;
  return <>{bar}<main className="pv-home"><h1>My Universe pilot · synthetic preview</h1>
    <p>Both pilot missions (G03 revision 2 fixtures) with an in-memory stand-in for the mission service. Use the controls to switch learner, organization and service state.</p>
    {person.role === 'student' && <button type="button" onClick={() => setView('explorer')}>Enter My Universe as {person.displayName}</button>}
  </main></>;
}
createRoot(document.getElementById('root')).render(<Harness />);
