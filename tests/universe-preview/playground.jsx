import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { buildCosmos } from '../../src/features/universe/explore/cosmosCatalog.js';
import catalogV2 from '../../public/cosmos/v2/catalog.json';
import { PlaygroundPanel } from '../../src/features/universe/playground/PlaygroundPanel.jsx';
import { ExplorerTextView } from '../../src/features/universe/explore/ExplorerTextView.jsx';
import { buildFeature, completeGoal, getPlanetRecord, initialPlaygroundState } from '../../src/features/universe/playground/playgroundModel.js';
import '../../src/features/universe/explore/explorer.css';

// Phase 4 harness: synthetic playground state only (Firebase is stubbed by this preview's Vite config).
// ?hazard=0 starts without the hazard; ?text=1 shows the Text View parity badges instead of the panel.
const flags = new URLSearchParams(location.search);
const cosmos = buildCosmos(catalogV2);

function seed() {
  let s = completeGoal(initialPlaygroundState('thalassa'), 'goal-hazard-drill');
  s = buildFeature(s, 'thalassa', 'geodesic-biodome', {}).state;
  if (flags.get('hazard') !== '0') {
    const rec = getPlanetRecord(s, 'thalassa');
    s = { ...s, planets: { ...s.planets, thalassa: { ...rec, activeHazard: { id: 'flare', name: 'Solar Flare', summary: 'A synthetic flare for this preview.', damage: 12 } } } };
  }
  return s;
}

function Harness() {
  const [state, setState] = useState(seed);
  if (flags.get('text') === '1') {
    return <div className="pg-text mx-text"><ExplorerTextView cosmos={cosmos} opts={{ preview: true }} canUse3d={false} playgroundPlanets={state.planets} /></div>;
  }
  return <PlaygroundPanel cosmos={cosmos} state={state} onChange={setState} onClose={() => {}} />;
}
createRoot(document.getElementById('root')).render(<Harness />);
