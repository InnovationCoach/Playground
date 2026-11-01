import { useMemo, useState } from 'react';
import { evaluateChallenges } from './scenarios.js';

const TIER = { 1: 'Start here', 2: 'Trade-offs', 3: 'Hard' };

/**
 * The My Universe challenge brief shown above the Hex-Grid tabs when a scenario
 * is open: world values, live challenge status from the model, its limits and a
 * way back. Status is the learner's own working, never a mark or a reward.
 */
export function ScenarioPanel({ scenario, sim, onExit }) {
  const results = useMemo(() => evaluateChallenges(scenario, sim), [scenario, sim]);
  const [open, setOpen] = useState(true);
  const done = results.filter((r) => r.met).length;
  return (
    <section className="hx-scenario" aria-labelledby="hx-scenario-title">
      {scenario.status === 'draft' && <p className="hx-scenario-draft">Draft challenge · awaiting educator review · your progress here is practice, not a mark</p>}
      <div className="hx-scenario-head">
        <div>
          <span className="hx-scenario-eyebrow">My Universe · Thalassa workstation</span>
          <h3 id="hx-scenario-title">{scenario.title}</h3>
          <p>{scenario.subtitle}</p>
        </div>
        <div className="hx-scenario-actions">
          <span className="hx-scenario-count" aria-live="polite">{done} of {results.length} met</span>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>{open ? 'Hide brief' : 'Show brief'}</button>
          {onExit && <button type="button" onClick={onExit}>Back to My Dashboard</button>}
        </div>
      </div>
      {open && <div className="hx-scenario-body">
        <p>{scenario.brief}</p>
        <ul className="hx-scenario-world">{scenario.worldValues.map((v) => <li key={v.text}>{v.text} <span className="hx-scenario-tag">Fictional world</span></li>)}</ul>
        {scenario.windNote && <p className="hx-scenario-note"><strong>Wind:</strong> {scenario.windNote}</p>}
        <p className="hx-scenario-note">{scenario.earthData}</p>
        <ol className="hx-scenario-challenges">{results.map((r) => <li key={r.id} className={r.met ? 'is-met' : ''}>
          <span className="hx-scenario-tick" aria-hidden="true">{r.met ? '✓' : '○'}</span>
          <div><strong>{r.title}</strong> <small>{TIER[r.tier]}</small><br />{r.goal}<br /><span className="hx-scenario-measure">Now: {r.measure}{r.met ? ' · met' : ''}</span></div>
        </li>)}</ol>
        <details><summary>What this model leaves out</summary><ul>{scenario.limitations.map((l) => <li key={l}>{l}</li>)}</ul></details>
      </div>}
    </section>
  );
}
