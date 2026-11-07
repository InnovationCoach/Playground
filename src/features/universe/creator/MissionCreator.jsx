import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { INTERESTS } from '../../pbl/content/pblModel.js';
import { TIME_OPTIONS, SUPPORT_LEVELS, adaptMission, withAiHook, restorePlan } from './missionCreator.js';
import './missionCreator.css';

const storageKey = (uid) => `spark.universe.creatorPlan.${uid || 'guest'}`;
function readSaved(uid) {
  try { return JSON.parse(window.localStorage.getItem(storageKey(uid))); } catch { return null; }
}
function writeSaved(uid, plan) {
  try {
    if (plan) window.localStorage.setItem(storageKey(uid), JSON.stringify(plan));
    else window.localStorage.removeItem(storageKey(uid));
  } catch { /* Private windows can block storage; the plan still works until the page closes. */ }
}

const QUESTIONS = ['mission', 'interest', 'time', 'support'];
const TITLES = {
  mission: 'Which mission do you want to make yours?',
  interest: 'What are you into?',
  time: 'How long do you have each time you sit down?',
  support: 'How much help do you want?'
};

/**
 * Inside My Universe: one question at a time, then a plan. The mission's question,
 * steps and answers come straight from the reviewed mission and never change.
 */
export function MissionCreator({ routes, uid, interests = [], requestHook, onStart }) {
  const [plan, setPlan] = useState(() => restorePlan(readSaved(uid), routes));
  const [creating, setCreating] = useState(false);
  const [at, setAt] = useState(0);
  const [answers, setAnswers] = useState({ mission: null, interest: null, time: null, support: null });
  const [busy, setBusy] = useState(false);
  const heading = useRef(null);
  const moved = useRef(false);
  useEffect(() => { if (moved.current) heading.current?.focus(); }, [at, creating, plan]);

  const interestList = useMemo(() => [...interests, ...INTERESTS.filter((i) => !interests.includes(i))], [interests]);
  if (!routes.length) return null;

  const question = QUESTIONS[at];
  const set = (key, value) => setAnswers((all) => ({ ...all, [key]: value }));
  const step = (to) => { moved.current = true; setAt(to); };
  async function finish() {
    moved.current = true;
    setBusy(true);
    const made = adaptMission({ entry: routes.find((r) => r.key === answers.mission), interest: answers.interest, minutes: answers.time, support: answers.support });
    const next = await withAiHook(made, { request: requestHook });
    writeSaved(uid, next);
    setPlan(next);
    setCreating(false);
    setBusy(false);
  }
  function startOver() {
    moved.current = true;
    writeSaved(uid, null);
    setPlan(null);
    setAnswers({ mission: null, interest: null, time: null, support: null });
    setAt(0);
    setCreating(true);
  }

  if (plan) {
    return <section className="mc-card" aria-labelledby="mc-plan-title">
      <span className="sd-eyebrow"><Sparkles size={13} aria-hidden="true" /> AI Creator · Your plan</span>
      <h3 id="mc-plan-title" ref={heading} tabIndex={-1}>{plan.title}</h3>
      <p className="mc-hook">{plan.hook}</p>
      <h4>Your time plan</h4>
      <ol className="mc-sittings">{plan.sittings.map((s) => <li key={s.number}>
        <strong>{plan.sittings.length === 1 ? `One sitting, about ${s.minutes} minutes` : `Sitting ${s.number}, about ${s.minutes} minutes`}</strong>
        <span>{s.stepTitles.join(', ')}</span>
      </li>)}</ol>
      <h4>Your help</h4>
      <p>{plan.supportDetail} You can change this any time inside the mission.</p>
      <div className="mc-locked"><Lock size={15} aria-hidden="true" /><p><strong>What stays the same:</strong> {plan.drivingQuestion} The steps, what you learn and how your coach looks at your work are the same for everyone.</p></div>
      <div className="mc-actions">
        <button type="button" className="sd-primary" onClick={() => onStart(plan)}>Start this mission <ArrowRight size={16} aria-hidden="true" /></button>
        <button type="button" className="sd-text-button" onClick={startOver}>Make a new plan</button>
      </div>
    </section>;
  }

  if (!creating) {
    return <section className="mc-card mc-intro" aria-labelledby="mc-title">
      <div><span className="sd-eyebrow"><Sparkles size={13} aria-hidden="true" /> AI Creator</span>
        <h3 id="mc-title" ref={heading} tabIndex={-1}>Make a mission fit you</h3>
        <p>Answer four quick questions. We’ll fit a mission around what you like, your time and the help you want. What you learn stays the same.</p></div>
      <button type="button" className="sd-button" onClick={() => { moved.current = true; setCreating(true); }}>Make my plan</button>
    </section>;
  }

  const answered = answers[question] !== null;
  return <section className="mc-card" aria-labelledby="mc-question">
    <span className="sd-eyebrow"><Sparkles size={13} aria-hidden="true" /> AI Creator · Question {at + 1} of {QUESTIONS.length}</span>
    <h3 id="mc-question" ref={heading} tabIndex={-1}>{TITLES[question]}</h3>
    <div className="mc-options" role="group" aria-labelledby="mc-question">
      {question === 'mission' && routes.map((r) => <Option key={r.key} on={answers.mission === r.key} onClick={() => set('mission', r.key)} label={r.mission.title} detail={r.route.name} />)}
      {question === 'interest' && interestList.map((i) => <Option key={i} on={answers.interest === i} onClick={() => set('interest', i)} label={i} />)}
      {question === 'time' && TIME_OPTIONS.map((t) => <Option key={t.minutes} on={answers.time === t.minutes} onClick={() => set('time', t.minutes)} label={t.label} />)}
      {question === 'support' && SUPPORT_LEVELS.map((s) => <Option key={s.id} on={answers.support === s.id} onClick={() => set('support', s.id)} label={s.label} detail={s.detail} />)}
    </div>
    <div className="mc-actions">
      {at > 0
        ? <button type="button" className="sd-text-button" onClick={() => step(at - 1)}><ArrowLeft size={15} aria-hidden="true" /> Back</button>
        : <button type="button" className="sd-text-button" onClick={() => setCreating(false)}>Not now</button>}
      {at < QUESTIONS.length - 1
        ? <button type="button" className="sd-primary" disabled={!answered} onClick={() => step(at + 1)}>Next <ArrowRight size={16} aria-hidden="true" /></button>
        : <button type="button" className="sd-primary" disabled={!answered || busy} onClick={finish}>{busy ? 'Making your plan…' : 'Make my plan'} <ArrowRight size={16} aria-hidden="true" /></button>}
    </div>
  </section>;
}

function Option({ on, onClick, label, detail }) {
  return <button type="button" className="mc-option" aria-pressed={on} onClick={onClick}><strong>{label}</strong>{detail && <span>{detail}</span>}</button>;
}
