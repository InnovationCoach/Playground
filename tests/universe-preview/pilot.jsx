import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MyUniverseExplorer } from '../../src/features/universe/explore/MyUniverseExplorer.jsx';
import { CoachUniverseSubmissions } from '../../src/features/coach/universe/CoachUniverseSubmissions.jsx';
// Fixture registry: imported only by this explicit synthetic preview entry, never by the app.
import { FIXTURE_RELEASES } from '../../shared/universe/fixtures/index.js';
import { createSyntheticService, SYNTHETIC_PEOPLE } from './syntheticUniverseService.js';
import { createUniverseClient } from '../../src/features/universe/pilot/universeClient.js';
import catalogUrl from '../../public/cosmos/v1/catalog.json?url';
import { ARRIVAL_VIDEOS } from '../../src/features/universe/explore/arrivalVideos.js';

const flags = new URLSearchParams(location.search);
// Learner expedition cards (O04): each opens the planet first; the mission waits for the learner.
const EXPEDITIONS = [
  { id: 'wind', planetId: 'thalassa', missionId: 'thalassa-wind-survey', routeId: 'guided', title: 'Wind energy estimate', where: 'Thalassa', description: 'Help Thalassa choose a power plan.', grades: '6–8', challenge: 2 },
  { id: 'journey-guided', planetId: 'thalassa', missionId: 'spacecraft-journey', routeId: 'guided', title: 'Journey timing', where: 'Thalassa departure station', description: 'Compare travel time and supplies for Ignis.', grades: '6–8', challenge: 2 },
  { id: 'journey-advanced', planetId: 'ignis', missionId: 'spacecraft-journey', routeId: 'advanced', title: 'Mass and power tradeoffs', where: 'Ignis', description: 'Balance the expedition’s mass, time and power.', grades: '9–11', challenge: 4 }
];
// Preview-only clip source: ?video=local plays the rendered file from ./media (not committed); ?video=<link> plays that link.
const videoParam = flags.get('video');
// ?video=local plays every clip from ./media/<name>-how-it-works.mp4; ?video=<link> sets the wind clip only.
const LOCAL_CLIPS = { 'thalassa-wind-survey|guided': 'thalassa-wind', 'spacecraft-journey|guided': 'journey-timing', 'spacecraft-journey|advanced': 'mass-power' };
const previewVideos = !videoParam ? undefined : videoParam === 'local'
  ? Object.fromEntries(Object.entries(ARRIVAL_VIDEOS).map(([k, v]) => [k, { ...v, src: `./media/${LOCAL_CLIPS[k]}-how-it-works.mp4`, poster: `./media/${LOCAL_CLIPS[k]}-poster.jpg` }]))
  : { ...ARRIVAL_VIDEOS, 'thalassa-wind-survey|guided': { ...ARRIVAL_VIDEOS['thalassa-wind-survey|guided'], src: videoParam } };
const expeditionFor = (id) => { const x = EXPEDITIONS.find((e) => e.id === id); return x ? { planetId: x.planetId, missionId: x.missionId, routeId: x.routeId } : null; };
const service = createSyntheticService({ latency: Number(flags.get('latency') ?? 350) });
if (flags.get('mode')) service.setMode(flags.get('mode'));

function Harness() {
  const [who, setWho] = useState(flags.get('as') || 'amira');
  const [view, setView] = useState(flags.get('view') || (who === 'rivera' ? 'coach' : 'explorer'));
  const [mode, setMode] = useState(service.mode);
  const [run, setRun] = useState(0);
  const [arrival, setArrival] = useState(() => expeditionFor(flags.get('arrive')));
  const person = SYNTHETIC_PEOPLE[who];
  // The real HTTP adapter, talking to the synthetic service through a fetch stand-in.
  const client = useMemo(() => createUniverseClient({ fetchImpl: service.fetchFor(person), getToken: async () => `synthetic-token-${person.uid}` }), [person, run]);
  const viewer = { uid: person.uid, orgId: person.orgId };
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
    {person.role === 'coach' && <CoachUniverseSubmissions key={`${viewerKey}|${run}`} coachUser={person} orgId={person.orgId} client={client} registry={FIXTURE_RELEASES} />}
  </main></>;
  if (view === 'explorer' && person.role === 'student') return <>{bar}<MyUniverseExplorer key={run} preview catalogUrl={catalogUrl} forceTextView={flags.get('text') === '1'}
    missionRegistry={FIXTURE_RELEASES} missionClient={client} viewer={viewer} onClose={() => setView('home')} allowInReviewMissions
    initialArrival={arrival} arrivalVideos={previewVideos} trustArrivalVideos={videoParam === 'local'}
    initialMission={flags.get('open') ? { id: flags.get('open'), route: flags.get('route'), view: flags.get('tab'), step: flags.get('step') } : null} /></>;
  return <>{bar}<main className="pv-home"><h1>My Universe pilot · synthetic preview</h1>
    <p>Both pilot missions (G03 revision 2 fixtures) with an in-memory stand-in for the mission service. Use the controls to switch learner, organization and service state.</p>
    {person.role === 'student' && <>
      <h2>Choose an expedition</h2>
      <div className="pv-cards">{EXPEDITIONS.map((x) => <button type="button" className="pv-card" key={x.id} onClick={() => { setArrival(expeditionFor(x.id)); setView('explorer'); }}>
        <strong>{x.title}</strong><span>{x.description}</span><small>{x.where} · Suggested grades {x.grades} · Challenge {x.challenge} of 5</small></button>)}</div>
      <button type="button" onClick={() => { setArrival(null); setView('explorer'); }}>Enter My Universe as {person.displayName}</button>
    </>}
  </main></>;
}
createRoot(document.getElementById('root')).render(<Harness />);
