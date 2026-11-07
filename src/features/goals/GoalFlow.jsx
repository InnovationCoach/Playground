import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { SHOW_HOW, SUPPORTS, LIMITS, newId, firstStepOptions } from './goalPlan.js';

const QUESTIONS = ['explore', 'show', 'help', 'first'];
const MAX_SUPPORTS = 3;
const IDEAS = ['How robots sense things', 'Making a game', 'Solar energy', 'Drawing comics'];

/**
 * Setting a goal, one question at a time, ending with "choose your first small
 * step". Saves the same goal shape as before, so My Quests, My Progress and the
 * coach's view all read it unchanged. Only the first answer and the step are needed.
 */
export function GoalFlow({ supportsFirst = [], onAdd, onCancel }) {
  const [at, setAt] = useState(0);
  const [explore, setExplore] = useState('');
  const [showHow, setShowHow] = useState(null);
  const [ownSupports, setSupports] = useState(null);
  const supports = ownSupports ?? supportsFirst.slice(0, MAX_SUPPORTS);
  const [step, setStep] = useState(null);
  const [ownStep, setOwnStep] = useState('');
  const heading = useRef(null);
  const moved = useRef(false);
  useEffect(() => { if (moved.current) heading.current?.focus(); }, [at]);

  const ordered = useMemo(() => [...SUPPORTS].sort((a, b) => supportsFirst.includes(b.id) - supportsFirst.includes(a.id)), [supportsFirst]);
  const options = useMemo(() => firstStepOptions(explore, showHow), [explore, showHow]);
  const question = QUESTIONS[at];
  const firstStep = step === 'own' ? ownStep.trim() : step;
  const go = (to) => { moved.current = true; setAt(to); };

  function save() {
    onAdd({
      id: newId('g'), explore: explore.trim().slice(0, LIMITS.text), showHow, supports, done: false, createdAt: Date.now(),
      steps: [{ id: newId('s'), text: firstStep.slice(0, LIMITS.text), done: false }]
    });
  }
  function submit(event) {
    event.preventDefault();
    if (question === 'explore' && !explore.trim()) return;
    if (question === 'first') { if (firstStep) save(); return; }
    go(at + 1);
  }

  return <form className="gl-card gl-flow" onSubmit={submit} aria-labelledby="gl-flow-question">
    <p className="gl-flow-count">Question {at + 1} of {QUESTIONS.length}</p>

    {question === 'explore' && <>
      <h2 id="gl-flow-question" ref={heading} tabIndex={-1}><label htmlFor="gl-flow-explore">What do you want to learn about or make?</label></h2>
      <input id="gl-flow-explore" className="gh-input gl-flow-input" value={explore} maxLength={LIMITS.text} autoFocus
        onChange={(e) => setExplore(e.target.value)} placeholder="For example: how to build a game" />
      <div className="gl-chip-group" role="group" aria-label="Ideas to get you started">
        {IDEAS.map((idea) => <button key={idea} type="button" className="gl-pill" aria-pressed={explore === idea} onClick={() => setExplore(idea)}>{idea}</button>)}
      </div>
    </>}

    {question === 'show' && <>
      <h2 id="gl-flow-question" ref={heading} tabIndex={-1}>How do you want to show what you learned?</h2>
      <p className="gl-subtitle">You can skip this if you’re not sure yet.</p>
      <div className="gl-chip-group" role="group" aria-labelledby="gl-flow-question">
        {SHOW_HOW.map((it) => <button key={it.id} type="button" className="gl-pill" aria-pressed={showHow === it.id} onClick={() => setShowHow((cur) => (cur === it.id ? null : it.id))}>{it.label}</button>)}
      </div>
    </>}

    {question === 'help' && <>
      <h2 id="gl-flow-question" ref={heading} tabIndex={-1}>What helps you do your best work?</h2>
      <p className="gl-subtitle">Pick up to {MAX_SUPPORTS}, or skip this. Your coach can see these so they know what helps.</p>
      <div className="gl-chip-group" role="group" aria-labelledby="gl-flow-question">
        {ordered.map((it) => {
          const selected = supports.includes(it.id);
          return <button key={it.id} type="button" className="gl-pill" aria-pressed={selected} disabled={!selected && supports.length >= MAX_SUPPORTS}
            onClick={() => setSupports(selected ? supports.filter((x) => x !== it.id) : [...supports, it.id])}>{it.label}</button>;
        })}
      </div>
    </>}

    {question === 'first' && <>
      <h2 id="gl-flow-question" ref={heading} tabIndex={-1}>Choose your first small step</h2>
      <p className="gl-subtitle">Pick something you could do today. You can add more steps later.</p>
      <div className="gl-flow-steps" role="radiogroup" aria-labelledby="gl-flow-question">
        {options.map((text) => <label key={text} className="gl-flow-step" data-on={step === text || undefined}>
          <input type="radio" name="gl-first-step" checked={step === text} onChange={() => setStep(text)} /><span>{text}</span>
        </label>)}
        <label className="gl-flow-step" data-on={step === 'own' || undefined}>
          <input type="radio" name="gl-first-step" checked={step === 'own'} onChange={() => setStep('own')} /><span>Write my own</span>
        </label>
        {step === 'own' && <input className="gh-input gl-flow-input" value={ownStep} maxLength={LIMITS.text} autoFocus aria-label="My first small step"
          onChange={(e) => setOwnStep(e.target.value)} placeholder="What’s one small thing you could do?" />}
      </div>
    </>}

    <div className="gl-flow-actions">
      {at > 0
        ? <button type="button" className="gh-btn gh-btn-ghost" onClick={() => go(at - 1)}><ArrowLeft size={15} aria-hidden="true" /> Back</button>
        : onCancel ? <button type="button" className="gh-btn gh-btn-ghost" onClick={onCancel}>Not now</button> : <span />}
      {question === 'first'
        ? <button type="submit" className="gh-btn gh-btn-accent" disabled={!firstStep}><Check size={15} aria-hidden="true" /> Save my goal</button>
        : <button type="submit" className="gh-btn gh-btn-accent" disabled={question === 'explore' && !explore.trim()}>
            {(question === 'show' && !showHow) || (question === 'help' && !supports.length) ? 'Skip' : 'Next'} <ArrowRight size={15} aria-hidden="true" />
          </button>}
    </div>
  </form>;
}
