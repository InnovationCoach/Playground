import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MyUniverseExplorer } from '../../src/features/universe/explore/MyUniverseExplorer.jsx';
// The real published catalog file (public/cosmos/v1/catalog.json), served by this preview's Vite.
import catalogUrl from '../../public/cosmos/v1/catalog.json?url';

// Stage B device-spike harness. Scenarios are URL flags so a tester can open them directly on an iPad.
const flags = new URLSearchParams(location.search);
const on = (name) => flags.get(name) === '1';
const SCENARIOS = [
  ['?', 'Normal (metrics on)'],
  ['?calm=1', 'Calm / no motion'],
  ['?fail=1', 'Landing fails (retry and text-view recovery)'],
  ['?text=1', 'No WebGL 2 (text view only)'],
  ['?catalog=missing', 'Catalog cannot load (error and Retry)'],
  ['?metrics=0', 'Metrics hidden']
];

function Harness() {
  const [open, setOpen] = useState(true);
  if (open) return <MyUniverseExplorer preview catalogUrl={flags.get('catalog') === 'missing' ? '/cosmos/v1/missing.json' : catalogUrl} calm={on('calm')} failLanding={on('fail')} forceTextView={on('text')}
    showMetrics={flags.get('metrics') !== '0'} onClose={() => setOpen(false)}
    onOpenActivity={(id, opts) => { if (id === 'hexgrid' && opts?.scenario === 'thalassa-station') location.href = './hexgrid-thalassa.html'; }} />;
  return <main className="spike-home">
    <h1>My Universe explorer · Stage B spike</h1>
    <p>Loads the published catalog (public/cosmos/v1/catalog.json). Fictional worlds. No Firebase, no saves, no XP. Use these scenarios on the physical iPad and laptop and note the frame rate and renderer counts shown in the corner.</p>
    <button type="button" onClick={() => setOpen(true)}>Enter again</button>
    <ul>{SCENARIOS.map(([q, label]) => <li key={q}><a href={q}>{label}</a></li>)}</ul>
  </main>;
}
createRoot(document.getElementById('root')).render(<Harness />);
