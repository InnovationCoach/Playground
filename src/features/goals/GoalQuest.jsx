import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowLeft, ArrowRight, Dices, Plus, Rocket, Volume2, X, Check } from 'lucide-react';
import { SUPPORTS, SHOW_HOW, LIMITS, XP, newId, goalSentence } from './goalPlan.js';

/**
 * "Goal quest": builds one big goal a question at a time in a modal dialog,
 * instead of one long form. The goal it hands back is the same shape the old
 * form saved (see goalPlan.js), so the coach mirror and Today list are unchanged.
 *
 * Web platform bits, each optional: <dialog> for the modal and focus trap,
 * the View Transitions API to slide between questions, and speechSynthesis
 * for "Read it to me".
 */

export const SHOW_EMOJI = { slides: '🖥️', talk: '🎤', model: '🛠️', video: '🎬', diagram: '✏️', code: '💻', poster: '🖼️', writing: '📝' };
export const SUPPORT_EMOJI = {
  'small-steps': '🪜', checklist: '✅', timer: '⏱️', quiet: '🤫', movement: '🏃', 'say-it': '🗣️', typing: '⌨️',
  'read-aloud': '🔊', 'extra-time': '⏳', headphones: '🎧', example: '👀', 'check-ins': '💬', harder: '🚀'
};

/** Ideas to roll when a learner is stuck, nudged towards the strengths they picked. Only suggestions. */
const IDEAS = {
  'big-picture': ['how a whole city could run on clean energy', 'how the internet actually works'],
  'deep-questions': ['how black holes bend light', 'why we dream'],
  creative: ['how to design my own board game', 'how inventors come up with new ideas'],
  building: ['how to build a walking robot', 'how bridges hold up heavy loads'],
  patterns: ['the maths hidden in nature', 'how weather forecasts are made'],
  talking: ['how great speeches persuade people', 'how to make my own podcast'],
  art: ['how colour changes how people feel', 'how animators make characters move'],
  tech: ['how video games use physics', 'how to build a simple chatbot'],
  expert: ['the history of something I already love', 'what experts still argue about in my favourite topic'],
  persistence: ['how athletes train their brains', 'how to learn a hard skill in 30 days'],
  empathy: ['how animals communicate', 'how to make a space welcoming for everyone'],
  humour: ['the science of why things are funny', 'how comic artists tell a story in 4 panels']
};
const ALL_IDEAS = Object.values(IDEAS).flat();

const FIRST_STEPS = {
  slides: ['Find 3 facts that surprise me', 'Sketch my first 3 slides'],
  talk: ['Write 3 questions I want answered', 'Practise my opening line out loud'],
  model: ['Sketch my design on paper', 'Gather the materials I need'],
  video: ['Watch one video about it', 'Write a 5-line script'],
  diagram: ['Sketch a rough first version', 'Label the key parts'],
  code: ['Try a tiny example program', 'Write down what my app should do'],
  poster: ['Pick a title and one big image', 'Find 3 key facts'],
  writing: ['Write 3 questions I want answered', 'Write my first paragraph']
};
const DEFAULT_STEPS = ['Watch one video about it', 'Write 3 questions I want answered'];

const QUESTIONS = [
  { id: 'explore', title: 'What sparks your curiosity?', say: 'What do you want to explore? Type anything, or roll the dice for an idea.' },
  { id: 'show', title: 'How will you show what you learn?', say: 'Pick the way you would most like to show what you learn. You do not have to write an essay.' },
  { id: 'help', title: 'What will help you on the way?', say: 'Pick the things that help you work. Your picks from What helps me are already chosen.' },
  { id: 'steps', title: 'Plan your first tiny steps', say: 'Add one or two tiny first steps. Tap a suggestion or write your own.' },
  { id: 'launch', title: 'Ready to launch?', say: 'Here is your goal. Press Launch goal to add it to your plan.' }
];

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function GoalQuest({ open, onClose, onLaunch, strengths, supportsFirst }) {
  const dialog = useRef(null);
  const [step, setStep] = useState(0);
  const [explore, setExplore] = useState('');
  const [showHow, setShowHow] = useState(null);
  const [ownSupports, setSupports] = useState(null);
  const supports = ownSupports ?? supportsFirst.slice(0, 3);
  const [steps, setSteps] = useState([]);
  const [draft, setDraft] = useState('');
  const [rolling, setRolling] = useState(false);
  const ordered = useMemo(() => [...SUPPORTS].sort((a, b) => supportsFirst.includes(b.id) - supportsFirst.includes(a.id)), [supportsFirst]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      setStep(0); setExplore(''); setShowHow(null); setSupports(null); setSteps([]); setDraft('');
      d.showModal?.();
    } else if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => () => { if (canSpeak()) window.speechSynthesis.cancel(); }, []);

  const q = QUESTIONS[step];
  const ready = [explore.trim().length > 0, true, true, true, true];
  const goal = { explore: explore.trim(), showHow, supports };

  function go(n) {
    if (canSpeak()) window.speechSynthesis.cancel();
    const apply = () => flushSync(() => setStep(n));
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !reduce) {
      document.documentElement.dataset.glDir = n > step ? 'fwd' : 'back';
      document.startViewTransition(apply);
    } else apply();
  }

  function next(e) {
    e?.preventDefault();
    if (!ready[step]) return;
    if (step < QUESTIONS.length - 1) go(step + 1);
    else launch(e?.nativeEvent?.submitter);
  }

  function launch(fromEl) {
    if (!explore.trim()) return;
    onLaunch({
      id: newId('g'), explore: explore.trim().slice(0, LIMITS.text), showHow, supports, done: false, createdAt: Date.now(),
      steps: steps.slice(0, LIMITS.steps).map((text) => ({ id: newId('s'), text, done: false }))
    }, fromEl);
  }

  function roll() {
    const pool = strengths.flatMap((s) => IDEAS[s] || []);
    const list = (pool.length ? pool : ALL_IDEAS).filter((i) => i !== explore);
    setRolling(true);
    setTimeout(() => setRolling(false), 500);
    setExplore(list[Math.floor(Math.random() * list.length)]);
  }

  function speak() {
    if (!canSpeak()) return;
    window.speechSynthesis.cancel();
    const text = step === 4 && goal.explore ? `${q.say} ${goalSentence(goal)}` : q.say;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  const addStep = (text) => {
    const t = text.trim().slice(0, LIMITS.text);
    if (t && !steps.includes(t) && steps.length < LIMITS.steps) setSteps((cur) => [...cur, t]);
  };
  const suggestions = (FIRST_STEPS[showHow] || DEFAULT_STEPS).filter((s) => !steps.includes(s));

  return (
    <dialog ref={dialog} className="gl-quest" aria-labelledby="gl-quest-title" onClose={onClose}
            onClick={(e) => { if (e.target === dialog.current) onClose(); }}>
      <form className="gl-quest-inner" onSubmit={next}>
        <div className="gl-quest-top">
          <span className="gl-quest-count">Question {step + 1} of {QUESTIONS.length}</span>
          <div className="gl-quest-tools">
            {canSpeak() && (
              <button type="button" className="gl-icon-btn" onClick={speak} aria-label="Read the question to me" title="Read it to me">
                <Volume2 size={18} aria-hidden="true" />
              </button>
            )}
            <button type="button" className="gl-icon-btn" onClick={onClose} aria-label="Close without saving"><X size={18} aria-hidden="true" /></button>
          </div>
        </div>
        <ol className="gl-quest-path" aria-hidden="true">
          {QUESTIONS.map((x, i) => <li key={x.id} className={i < step ? 'done' : i === step ? 'now' : ''}><span className="gl-quest-dot">{i < step ? <Check size={13} /> : i + 1}</span></li>)}
        </ol>

        <div className="gl-quest-step" key={q.id}>
          <h2 id="gl-quest-title">{q.title}</h2>

          {q.id === 'explore' && (
            <>
              <p className="gl-quest-hint">A topic, a question, or something you want to make. Big or small is fine.</p>
              <div className="gl-quest-explore">
                <input className="gh-input gl-quest-input" value={explore} maxLength={LIMITS.text} autoFocus
                       onChange={(e) => setExplore(e.target.value)} aria-label="What do you want to explore?"
                       placeholder="e.g. how to build a walking robot" />
                <button type="button" className={rolling ? 'gh-btn gl-dice is-rolling' : 'gh-btn gl-dice'} onClick={roll}>
                  <Dices size={18} aria-hidden="true" />Surprise me
                </button>
              </div>
              {strengths.length > 0 && <p className="gl-quest-note">Ideas are picked from the strengths you chose.</p>}
            </>
          )}

          {q.id === 'show' && (
            <div className="gl-tiles" role="group" aria-label="How you will show it">
              {SHOW_HOW.map((s) => (
                <button key={s.id} type="button" className="gl-tile" aria-pressed={showHow === s.id}
                        onClick={() => setShowHow((cur) => (cur === s.id ? null : s.id))}>
                  <span className="gl-tile-emoji" aria-hidden="true">{SHOW_EMOJI[s.id]}</span>{s.label}
                </button>
              ))}
            </div>
          )}

          {q.id === 'help' && (
            <div className="gl-tiles gl-tiles-sm" role="group" aria-label="What will help">
              {ordered.map((s) => (
                <button key={s.id} type="button" className="gl-tile" aria-pressed={supports.includes(s.id)}
                        onClick={() => setSupports(supports.includes(s.id) ? supports.filter((x) => x !== s.id) : [...supports, s.id])}>
                  <span className="gl-tile-emoji" aria-hidden="true">{SUPPORT_EMOJI[s.id]}</span>{s.label}
                </button>
              ))}
            </div>
          )}

          {q.id === 'steps' && (
            <>
              <p className="gl-quest-hint">Make each one so small you could start it today. You can skip this and add steps later.</p>
              {suggestions.length > 0 && steps.length < LIMITS.steps && (
                <div className="gl-chips" role="group" aria-label="Suggested steps">
                  {suggestions.map((s) => (
                    <button key={s} type="button" className="gl-chip gl-chip-add" onClick={() => addStep(s)}>
                      <Plus size={14} aria-hidden="true" />{s}
                    </button>
                  ))}
                </div>
              )}
              {steps.length > 0 && (
                <ol className="gl-quest-steps">
                  {steps.map((s, i) => (
                    <li key={s}><span className="gl-quest-step-n">{i + 1}</span><span className="gl-grow">{s}</span>
                      <button type="button" className="gl-icon-btn" aria-label={`Remove step: ${s}`}
                              onClick={() => setSteps((cur) => cur.filter((x) => x !== s))}><X size={15} aria-hidden="true" /></button>
                    </li>
                  ))}
                </ol>
              )}
              {steps.length < LIMITS.steps && (
                <div className="gl-addstep">
                  <input className="gh-input" value={draft} maxLength={LIMITS.text} placeholder="Or write your own step" aria-label="Your own step"
                         onChange={(e) => setDraft(e.target.value)}
                         onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStep(draft); setDraft(''); } }} />
                  <button type="button" className="gh-btn gh-btn-sm" disabled={!draft.trim()} onClick={() => { addStep(draft); setDraft(''); }}>
                    <Plus size={14} aria-hidden="true" />Add
                  </button>
                </div>
              )}
            </>
          )}

          {q.id === 'launch' && (
            <div className="gl-quest-card">
              <span className="gl-quest-card-emoji" aria-hidden="true">{SHOW_EMOJI[showHow] || '🌟'}</span>
              <p className="gl-quest-card-sentence">{goalSentence(goal)}</p>
              {steps.length > 0 && (
                <ul className="gl-quest-card-steps">{steps.map((s) => <li key={s}>{s}</li>)}</ul>
              )}
              <p className="gl-quest-card-xp">+{XP.goal} XP when you launch · +{XP.step} XP for every step you finish</p>
            </div>
          )}
        </div>

        <div className="gl-quest-nav">
          {step > 0
            ? <button type="button" className="gh-btn gh-btn-ghost" onClick={() => go(step - 1)}><ArrowLeft size={16} aria-hidden="true" />Back</button>
            : <span />}
          {step < QUESTIONS.length - 1 ? (
            <button type="submit" className="gh-btn gh-btn-accent" disabled={!ready[step]}>
              {step === 3 && steps.length === 0 ? 'Skip for now' : 'Next'}<ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button type="submit" className="gh-btn gh-btn-primary gl-launch"><Rocket size={16} aria-hidden="true" />Launch goal</button>
          )}
        </div>
      </form>
    </dialog>
  );
}
