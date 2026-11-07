import { useEffect, useRef, useState } from 'react';
import {
  Apple, ArrowRight, Award, Bot, Bus, Check, CircleCheck, Droplets, Dumbbell, Gamepad2, HeartPulse, Leaf, Lightbulb, LifeBuoy, MessageCircle,
  Music, Palette, PawPrint, Rocket, Shirt, Users, X
} from 'lucide-react';
import { INTERESTS, PHASES } from './content/pblModel.js';
import { phaseProgress, LIMITS, addProof, taskState, updateProject, nextStep } from './engine/pblProject.js';
import { hrefFor } from '../../app/routes.js';

const RING = 2 * Math.PI * 19;

/** The term as one path: where the learner is, and how far each phase has come. */
export function JourneyPath({ project, open, onSelect, readOnly = false }) {
  return <ol className="pb-steps pb-path" aria-label="Design Thinking phases">
    {PHASES.map((phase, i) => {
      const progress = readOnly ? null : phaseProgress(project, phase.id);
      const fraction = progress?.tasksTotal ? progress.tasksDone / progress.tasksTotal : 0;
      const here = phase.id === open;
      return <li key={phase.id} className="pb-path-stop" data-complete={progress?.complete || undefined}>
        <button type="button" className="pb-step" aria-current={here ? 'step' : undefined} onClick={() => onSelect(phase.id)}>
          <span className="pb-ring" aria-hidden="true">
            <svg viewBox="0 0 46 46" focusable="false">
              <circle className="pb-ring-track" cx="23" cy="23" r="19" />
              {fraction > 0 && <circle className="pb-ring-value" cx="23" cy="23" r="19" strokeDasharray={`${RING * fraction} ${RING}`} transform="rotate(-90 23 23)" />}
            </svg>
            <span className="pb-ring-mark">{progress?.complete ? <Award size={17} /> : i + 1}</span>
          </span>
          <span className="pb-step-text">
            <strong>{phase.title}</strong>
            <small>{progress ? `${progress.tasksDone} of ${progress.tasksTotal} tasks` : phase.strap}{progress?.complete ? ', badge earned' : ''}</small>
            {here && !readOnly && <em className="pb-here">You are here</em>}
          </span>
        </button>
      </li>;
    })}
  </ol>;
}

/** A small, still-respectful moment when a phase is finished. */
export function PhaseCelebration({ phaseId, onClose }) {
  const phase = PHASES.find((p) => p.id === phaseId);
  if (!phase) return null;
  return <div className="pb-cele" role="status">
    <span className="pb-cele-badge" aria-hidden="true"><Award size={24} /></span>
    <div className="pb-cele-text"><strong>{phase.title} badge earned</strong><p>You finished every task and showed your work. That took real effort.</p></div>
    <button type="button" className="gl-icon-btn pb-icon-44" aria-label="Close this message" onClick={onClose}><X size={16} aria-hidden="true" /></button>
  </div>;
}

/** Quick proof for one task: a sentence or a link. The fuller form stays further down the phase. */
export function TaskProof({ project, phase, index, apply, onDone }) {
  const [how, setHow] = useState('text');
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState(null);
  const first = useRef(null);
  useEffect(() => { first.current?.focus(); }, [how]);
  function save(event) {
    event.preventDefault();
    const entry = { how, text, link };
    const result = addProof(project, phase.id, index, entry);
    if (result.error) { setError(result.error); return; }
    apply((p) => (p === project ? result.project : addProof(p, phase.id, index, entry).project || p));
    onDone();
  }
  const field = `pb-proof-${phase.id}-${index}`;
  return <form className="pb-proof" onSubmit={save} aria-label={`Add proof: ${phase.tasks[index]}`}>
    <div className="pb-proof-how" role="group" aria-label="How do you want to show it?">
      <button type="button" className="pb-pill" aria-pressed={how === 'text'} onClick={() => { setHow('text'); setError(null); }}>Write a sentence</button>
      <button type="button" className="pb-pill" aria-pressed={how === 'link'} onClick={() => { setHow('link'); setError(null); }}>Add a link</button>
    </div>
    {how === 'text' ? <>
      <label className="gh-label" htmlFor={field}>What did you do or find out?</label>
      <textarea id={field} ref={first} className="gh-input pb-textarea" rows={2} maxLength={LIMITS.body} value={text} onChange={(e) => setText(e.target.value)} />
    </> : <>
      <label className="gh-label" htmlFor={field}>Link to your photo, video, screenshot or voice note</label>
      <input id={field} ref={first} className="gh-input" type="url" inputMode="url" maxLength={LIMITS.link} placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
    </>}
    {error && <p className="pb-error" role="alert">{error}</p>}
    <div className="gh-btn-row">
      <button type="button" className="gh-btn gh-btn-ghost" onClick={onDone}>Not now</button>
      <button type="submit" className="gh-btn gh-btn-primary">Save my proof</button>
    </div>
  </form>;
}

/** The one thing to do now in this phase, and a way out when it feels too big. */
export function NextStepCard({ project, phase, apply, onAskAi, onNextPhase }) {
  const step = nextStep(project, phase.id);
  const [proofing, setProofing] = useState(null);
  const [stuckOpen, setStuckOpen] = useState(false);
  const [example, setExample] = useState(false);
  const nextPhase = PHASES[PHASES.findIndex((p) => p.id === phase.id) + 1];
  useEffect(() => { setProofing(null); setStuckOpen(false); setExample(false); }, [phase.id]);

  function primary() {
    if (step.type === 'task') apply((p) => step.tick(p));
    if (step.type !== 'done') setProofing(step.index);
  }
  const title = step.type === 'done' ? `You finished ${phase.title}` : phase.tasks[step.index];
  const help = step.type === 'proof' ? 'You’ve done this. Show your work to finish it.' : step.type === 'done' ? 'Every task is done and has proof.' : `Step ${step.index + 1} of ${phase.tasks.length} in ${phase.title}.`;
  return <section className="pb-next" aria-labelledby="pb-next-title">
    <span className="pb-kicker">Your next step</span>
    <h3 id="pb-next-title">{title}</h3>
    <p className="pb-next-help">{help}</p>
    {proofing !== null ? <TaskProof project={project} phase={phase} index={proofing} apply={apply} onDone={() => setProofing(null)} />
      : <div className="pb-next-actions">
        {step.type === 'done'
          ? (nextPhase ? <button type="button" className="gh-btn gh-btn-primary pb-next-go" onClick={() => onNextPhase(nextPhase.id)}>Go to {nextPhase.title}<ArrowRight size={16} aria-hidden="true" /></button>
            : <a className="gh-btn gh-btn-primary pb-next-go" href={hrefFor.pbl('portfolio')}>See my portfolio<ArrowRight size={16} aria-hidden="true" /></a>)
          : <button type="button" className="gh-btn gh-btn-primary pb-next-go" onClick={primary}>{step.type === 'task' ? <><Check size={16} aria-hidden="true" />I’ve done this</> : 'Add proof'}</button>}
        {step.type !== 'done' && <button type="button" className="gh-btn gh-btn-ghost pb-stuck-btn" aria-expanded={stuckOpen} onClick={() => setStuckOpen(!stuckOpen)}><LifeBuoy size={16} aria-hidden="true" />Stuck?</button>}
      </div>}
    {stuckOpen && proofing === null && step.type !== 'done' && <div className="pb-stuck">
      <button type="button" className="pb-stuck-option" onClick={() => onAskAi(`I'm stuck on this: ${phase.tasks[step.index]} Help me find the first small step. Don't do it for me.`)}><Bot size={18} aria-hidden="true" /><span><strong>Ask AI</strong>Get help with the first small step.</span></button>
      <a className="pb-stuck-option" href={hrefFor.messages()}><MessageCircle size={18} aria-hidden="true" /><span><strong>Ask my coach</strong>Send a message. Asking early is a good move.</span></a>
      <button type="button" className="pb-stuck-option" aria-expanded={example} onClick={() => setExample(!example)}><Lightbulb size={18} aria-hidden="true" /><span><strong>See an example</strong>What work looks like in this phase.</span></button>
      {example && <ul className="pb-bullets pb-stuck-example">{phase.evidence.map((item) => <li key={item}>{item}</li>)}</ul>}
    </div>}
  </section>;
}

/** Every task in the phase, each with its own proof. */
export function TaskList({ project, phase, apply, onToggle }) {
  const [proofing, setProofing] = useState(null);
  useEffect(() => { setProofing(null); }, [phase.id]);
  return <details className="gh-card pb-all-tasks">
    <summary>See all {phase.title} tasks</summary>
    <ul className="pb-tasks">
      {phase.tasks.map((task, i) => {
        const state = taskState(project, phase.id, i);
        return <li key={i} className="pb-task-row" data-state={state}>
          <label className="pb-task">
            <input type="checkbox" checked={state !== 'todo'} onChange={() => onToggle(i)} />
            <span>{task}</span>
          </label>
          <div className="pb-task-side">
            {state === 'needs-proof' && <span className="pb-task-state">Done, add proof</span>}
            {state === 'complete' && <span className="pb-task-state pb-task-complete"><CircleCheck size={15} aria-hidden="true" />Done with proof</span>}
            <button type="button" className="gh-btn gh-btn-sm pb-proof-btn" aria-label={`Add proof: ${task}`} onClick={() => setProofing(proofing === i ? null : i)}>Add proof</button>
          </div>
          {proofing === i && <TaskProof project={project} phase={phase} index={i} apply={apply} onDone={() => setProofing(null)} />}
        </li>;
      })}
    </ul>
  </details>;
}

const INTEREST_ICONS = {
  'Sport and fitness': Dumbbell, Music, Games: Gamepad2, Animals: PawPrint, Food: Apple, Fashion: Shirt, Health: HeartPulse,
  Environment: Leaf, Transport: Bus, 'Art and design': Palette, Space: Rocket, Robots: Bot, Water: Droplets, 'My community': Users
};

/** First thing in Explore: their interests shape the activities and the co-pilot's suggestions. */
export function InterestPicker({ project, apply }) {
  const toggle = (interest) => apply((p) => updateProject(p, {
    interests: p.interests.includes(interest) ? p.interests.filter((x) => x !== interest) : [...p.interests, interest].slice(0, 6)
  }));
  return <section className="gh-card pb-interests" aria-labelledby="pb-interests-title">
    <h3 id="pb-interests-title" className="pb-h3">What are you into?</h3>
    <p className="pb-sub">Pick up to six. We’ll use them to suggest activities, and your project problem can grow from here.</p>
    <div className="pb-interest-grid" role="group" aria-labelledby="pb-interests-title">
      {INTERESTS.map((interest) => {
        const Icon = INTEREST_ICONS[interest] || Rocket;
        return <button key={interest} type="button" className="pb-interest" aria-pressed={project.interests.includes(interest)} onClick={() => toggle(interest)}>
          <Icon size={22} aria-hidden="true" /><span>{interest}</span>
        </button>;
      })}
    </div>
  </section>;
}
