import { useEffect, useRef, useState } from 'react';
import { X, Lightbulb, Eye, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { FactList } from '../explore/ExplorerTextView.jsx';
import { checkNumber, checkChoice, FEEDBACK, displayAnswer } from './missionModel.js';

/**
 * A mission as an HTML sheet over the explorer (the same in 3D and text view).
 * The learner picks a route; nothing about age or past results chooses it.
 * Answers, hints and reflections live only in this sheet: closing it forgets them.
 */
export function MissionSheet({ mission, onClose }) {
  const [routeId, setRouteId] = useState(null);
  const [index, setIndex] = useState(0);
  const heading = useRef(null);
  const route = mission.routes.find((r) => r.id === routeId);
  useEffect(() => { heading.current?.focus(); }, [routeId, index]);

  function onKeyDown(e) {
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onClose(); }
  }

  return <div className="mx-mission-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
  <section className="mx-mission" role="dialog" aria-modal="true" aria-labelledby="mx-mission-title" onKeyDown={onKeyDown}>
    <header className="mx-mission-top">
      <div><span className="mx-eyebrow">Mission{route ? ` · ${route.name}` : ''}</span><h2 id="mx-mission-title" ref={heading} tabIndex={-1}>{mission.title}</h2></div>
      <button type="button" className="mx-icon" onClick={onClose} aria-label="Close mission"><X size={20} aria-hidden="true" /></button>
    </header>
    {mission.status === 'draft' && <p className="mx-draft">Draft mission · awaiting educator review · self-checks are practice only: nothing is marked, saved or rewarded</p>}
    <div className="mx-mission-body">
      {!route && <>
        <p className="mx-question">{mission.drivingQuestion}</p>
        <FactList facts={mission.context} />
        <h3>Choose your route</h3>
        <p className="mx-muted">Both routes answer the same question. Pick the one that suits you today; you can switch any time.</p>
        <div className="mx-routes">{mission.routes.map((r) => <button type="button" key={r.id} className="mx-route" onClick={() => { setRouteId(r.id); setIndex(0); }}>
          <strong>{r.name}</strong><span>{r.summary}</span><small>{r.steps.length} steps</small>
        </button>)}</div>
        <details className="mx-limits"><summary>What this model leaves out</summary><ul>{mission.limitations.map((l) => <li key={l}>{l}</li>)}</ul></details>
      </>}
      {route && <>
        <ol className="mx-stepper" aria-label="Steps">{route.steps.map((s, i) => <li key={s.id}>
          <button type="button" aria-current={i === index ? 'step' : undefined} onClick={() => setIndex(i)}>{i + 1}<span className="mx-sr"> {s.title}</span></button>
        </li>)}</ol>
        <Step key={`${route.id}-${route.steps[index].id}`} step={route.steps[index]} />
        <nav className="mx-step-nav" aria-label="Step navigation">
          {index > 0 ? <button type="button" onClick={() => setIndex(index - 1)}><ChevronLeft size={16} aria-hidden="true" />Previous</button> : <button type="button" onClick={() => setRouteId(null)}><ChevronLeft size={16} aria-hidden="true" />Routes</button>}
          {index < route.steps.length - 1 ? <button type="button" className="mx-primary" onClick={() => setIndex(index + 1)}>Next step<ChevronRight size={16} aria-hidden="true" /></button>
            : <button type="button" className="mx-primary" onClick={() => setRouteId(null)}>Finish<Check size={16} aria-hidden="true" /></button>}
        </nav>
      </>}
    </div>
  </section>
  </div>;
}

function Step({ step }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [hints, setHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const fieldId = `mx-answer-${step.id}`;
  const check = () => setResult(step.kind === 'choose' ? checkChoice(step, value) : checkNumber(step, value));
  return <div className="mx-step">
    <h3>{step.title}</h3>
    <p>{step.prompt}</p>
    {step.given?.length > 0 && <div className="mx-given"><span className="mx-eyebrow">Given</span><GivenList items={step.given} /></div>}

    {step.kind === 'number' && <form className="mx-answer" onSubmit={(e) => { e.preventDefault(); check(); }}>
      <label htmlFor={fieldId}>Your answer ({step.unit})</label>
      <div><input id={fieldId} inputMode="decimal" autoComplete="off" value={value} onChange={(e) => { setValue(e.target.value); setResult(null); }} aria-describedby={`${fieldId}-fb`} />
        <button type="submit" className="mx-primary">Check</button></div>
    </form>}
    {step.kind === 'choose' && <fieldset className="mx-choices"><legend className="mx-sr">{step.prompt}</legend>
      {step.choices.map((c) => <label key={c.id}><input type="radio" name={step.id} value={c.id} checked={value === c.id} onChange={() => { setValue(c.id); setResult(null); }} />{c.label}</label>)}
      <button type="button" className="mx-primary" disabled={!value} onClick={check}>Check</button>
    </fieldset>}
    {step.kind === 'reflect' && <div className="mx-answer"><label htmlFor={fieldId}>Your thinking (stays on this screen only)</label>
      <textarea id={fieldId} rows={4} value={value} onChange={(e) => setValue(e.target.value)} /></div>}

    <p id={`${fieldId}-fb`} className={`mx-feedback${result ? ` is-${result}` : ''}`} role="status">{result ? FEEDBACK[result] : ''}</p>

    <div className="mx-help">
      {step.hints?.length > 0 && hints < step.hints.length && <button type="button" onClick={() => setHints(hints + 1)}><Lightbulb size={15} aria-hidden="true" />{hints ? 'Another hint' : 'Show a hint'}</button>}
      {step.solution && !showSolution && <button type="button" onClick={() => setShowSolution(true)}><Eye size={15} aria-hidden="true" />Show worked solution</button>}
    </div>
    {hints > 0 && <ul className="mx-hints">{step.hints.slice(0, hints).map((h) => <li key={h}>{h}</li>)}</ul>}
    {showSolution && <div className="mx-solution"><p>{step.solution}</p>{step.kind === 'number' && <p><strong>Answer:</strong> about {displayAnswer(step)}</p>}</div>}
  </div>;
}

/** Givens carry their own tags: fictional world values, real science (with source), unit facts and method notes. */
function GivenList({ items }) {
  const tag = { 'fictional-world': 'Fictional world', 'real-science': 'Real science', 'unit-fact': 'Unit fact', method: 'Method' };
  return <ul className="mx-facts">{items.map((g) => <li key={g.text}>{g.text}
    <span className={`mx-tag is-${g.tag}`}>{tag[g.tag]}</span>
    {g.source && <small className="mx-source">Source: {g.source}</small>}
  </li>)}</ul>;
}
