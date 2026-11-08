import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from '../../src/app/i18n/LocaleProvider.jsx';
import { parseRoute } from '../../src/app/routes.js';
import { selectLayout, shellSection } from '../../src/features/lowerSecondary/layoutSelector.js';
import { LowerSecondaryShell } from '../../src/features/lowerSecondary/LowerSecondaryShell.jsx';
import { auth } from './fixtureFirebase.js';
import { SCENARIOS, scenarioId } from './scenarios.js';

const params = new URLSearchParams(location.search);

function useHash() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => { const on = () => setHash(location.hash); addEventListener('hashchange', on); return () => removeEventListener('hashchange', on); }, []);
  return hash;
}

function Preview() {
  const hash = useHash();
  const id = scenarioId();
  const scenario = SCENARIOS[id];
  auth.currentUser = { uid: id };
  const choice = selectLayout({ role: scenario.role || 'student', contract: scenario.contract });
  const route = parseRoute(hash);
  const section = shellSection({ layout: choice.layout, route: route || (scenario.primary ? null : { screen: 'dashboard' }), isPrimary: !!scenario.primary });
  const pick = (next) => { params.set('learner', next); location.search = params.toString(); };
  return <LocaleProvider>
    <div className="lsp-bar" data-testid="fixture-label">
      <span>OFFLINE FIXTURE PREVIEW · synthetic people and records · no live services</span>
      <label>Scenario <select value={id} onChange={(e) => pick(e.target.value)}>{Object.entries(SCENARIOS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}</select></label>
      <span data-testid="selection">Layout: {choice.layout} ({choice.reason})</span>
    </div>
    {section
      ? <LowerSecondaryShell uid={id} orgId="fixture-org" profile={scenario.profile} classIds={scenario.classIds ?? ['fixture-class']} isPrimary={!!scenario.primary} section={section}
                             onOpenActivity={(activity) => { document.title = `activity:${activity}`; }} onJoined={() => {}} onSignOut={() => {}} />
      : <div className="lsp-held" data-testid="held"><strong>This account keeps the existing layout ({choice.reason}), or this address belongs to another screen.</strong></div>}
  </LocaleProvider>;
}
createRoot(document.getElementById('root')).render(<Preview />);
