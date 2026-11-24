import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Send, GraduationCap, Rocket, Award, Target, Calendar, Check, X, RotateCcw,
  Trash, Plus, Wand2, ListChecks, SlidersHorizontal, Bot
} from 'lucide-react';
import { GOAL_CATEGORIES, STEP_FREQUENCIES, LIMITS, newId, dayKey, categoryMeta, subtypeLabel } from './goalPlan.js';
import { MANUAL_SUBJECT_OPTIONS } from './adventumGoalIntegration.js';
import { suggestGoalMilestones } from './goalAiService.js';
import {
  analyseGoalText, inferGoalType, coachIdeas, coachReadback, outcomeSuggestions, smartCheck,
  TIMEFRAMES, timeframeDate, parseTimeframe, buildCoachGoal, daysBetween
} from './goalCoach.js';

const CAT_ICON = { academic: GraduationCap, pbl: Rocket, skills: Award, personal: Target };

const instant = () => import.meta.env?.MODE === 'test'
  || (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const prettyDate = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : '');

/**
 * SPARK Goal Coach: a short conversation that turns "what I want" into a SMART
 * goal, with a live blueprint of the goal building beside it.
 *
 * Props:
 *   firstName, academicContext, supports (plan.supports for the goal's helps)
 *   preset: { category?, subject? } when opened from a subject lane or tab
 *   onSave(goal), onCancel(), onUseForm(draft) to continue in the detailed form
 */
export function GoalCoach({ firstName = '', academicContext = null, supports = [], preset = null, onSave, onCancel, onUseForm }) {
  const subjects = academicContext?.subjects || [];
  const pblProjects = academicContext?.pblProjects || [];
  const today = dayKey();

  const [draft, setDraft] = useState(() => ({
    explore: '',
    category: preset?.category || null,
    goalType: '',
    subject: preset?.subject || '',
    projectId: '',
    projectTitle: '',
    gradeLevel: academicContext?.gradeLevel || '',
    targetDate: '',
    measurableOutcome: '',
    steps: []
  }));
  const [stage, setStage] = useState('goal');
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [aiSource, setAiSource] = useState(null);
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const timers = useRef([]);

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));

  const say = (text, extra = {}) => {
    const msg = { id: newId('m'), from: 'coach', text, ...extra };
    if (instant()) { setMessages((m) => [...m, msg]); return; }
    setTyping(true);
    const t = setTimeout(() => { setTyping(false); setMessages((m) => [...m, msg]); }, 420 + Math.min(500, text.length * 6));
    timers.current.push(t);
  };
  const echo = (text) => setMessages((m) => [...m, { id: newId('m'), from: 'me', text }]);

  useEffect(() => {
    const hello = firstName ? `Hi ${firstName}! ` : 'Hi! ';
    const lead = preset?.subject
      ? `Let’s set a ${preset.subject} goal together. What do you want to get better at, or get done?`
      : preset?.category === 'pbl'
      ? 'Let’s plan a project goal. What do you want your project to achieve next?'
      : 'I’m your SPARK Goal Coach. Tell me something you want to achieve, in your own words.';
    setMessages([{ id: 'hello', from: 'coach', text: `${hello}${lead}` }]);
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  useEffect(() => { if (!typing) inputRef.current?.focus({ preventScroll: true }); }, [stage, typing]);

  const smart = useMemo(() => smartCheck(draft, today), [draft, today]);

  /* ---------------- stage transitions ---------------- */

  function askNextAfterCategory(d) {
    if (d.category === 'academic' && !d.subject) {
      setStage('subject');
      say('Which subject is this for?');
      return;
    }
    if (d.category === 'pbl' && !d.projectTitle && pblProjects.length) {
      setStage('project');
      say('Is this for one of your projects?');
      return;
    }
    askWhen(d);
  }

  function askWhen(d) {
    if (d.targetDate) {
      setStage('outcome');
      say(`Target date: ${prettyDate(d.targetDate)}. Now, how will you know you’ve done it? Pick one or write your own.`);
      return;
    }
    setStage('when');
    say('By when do you want to reach it? A date makes a goal much easier to plan.');
  }

  function answerGoal(text) {
    const explore = text.slice(0, LIMITS.text);
    const a = analyseGoalText(explore, { subjects, pblProjects, today });
    const category = preset?.category || a.category;
    const next = {
      ...draft,
      explore,
      category,
      goalType: inferGoalType(category, explore),
      subject: draft.subject || (category === 'academic' ? a.subject : ''),
      projectId: a.project?.id || draft.projectId,
      projectTitle: a.project?.title || draft.projectTitle,
      targetDate: a.timeframe?.date || draft.targetDate
    };
    setDraft(next);
    if (preset?.category) {
      say(`Great goal. ${coachReadback({ ...a, category, subject: next.subject })}`);
      askNextAfterCategory(next);
      return;
    }
    setStage('category');
    say(`${coachReadback({ ...a, subject: next.subject })} Is that right? Tap another type if not.`);
  }

  function chooseCategory(cat) {
    const next = { ...draft, category: cat, goalType: inferGoalType(cat, draft.explore), subject: cat === 'academic' ? draft.subject : '' };
    setDraft(next);
    echo(cat === draft.category ? 'Yes, that’s right' : categoryMeta(cat).label);
    askNextAfterCategory(next);
  }

  function chooseSubject(subject) {
    const next = { ...draft, subject: subject.slice(0, 80) };
    setDraft(next);
    echo(subject);
    askWhen(next);
  }

  function chooseProject(p) {
    const next = { ...draft, projectId: p?.id || '', projectTitle: p?.title || '' };
    setDraft(next);
    echo(p ? p.title : 'Not linked to a project');
    askWhen(next);
  }

  function chooseDate(date, label) {
    if (!date || daysBetween(today, date) <= 0) {
      say('That date has already passed. Pick a day in the future.');
      return;
    }
    const next = { ...draft, targetDate: date };
    setDraft(next);
    echo(label || prettyDate(date));
    setStage('outcome');
    say(`${prettyDate(date)} it is: ${daysBetween(today, date)} days to go. How will you know you’ve done it?`);
  }

  async function chooseOutcome(text) {
    const next = { ...draft, measurableOutcome: text.slice(0, LIMITS.outcome) };
    setDraft(next);
    echo(text);
    setStage('steps');
    say('Nice, that’s measurable. Let me break it into small steps…');
    await buildSteps(next, false);
  }

  async function buildSteps(d, replace) {
    setBusy(true);
    try {
      const res = await suggestGoalMilestones({
        category: d.category,
        goalType: d.goalType,
        explore: d.explore,
        subject: d.category === 'academic' ? d.subject : '',
        projectTitle: d.category === 'pbl' ? d.projectTitle : '',
        gradeLevel: d.gradeLevel,
        measurableOutcome: d.measurableOutcome,
        targetDate: d.targetDate
      });
      const fresh = (res.steps || []).map((s) => ({ id: newId('s'), text: s.text, frequency: s.frequency || 'daily', aiSuggested: true }));
      setDraft((cur) => {
        const keep = replace ? cur.steps.filter((s) => !s.aiSuggested) : cur.steps;
        const seen = new Set(keep.map((s) => s.text.toLowerCase()));
        return { ...cur, steps: [...keep, ...fresh.filter((s) => !seen.has(s.text.toLowerCase()))].slice(0, LIMITS.steps) };
      });
      setAiSource(res.aiGenerated ? 'gemini' : 'local');
      say(
        res.aiGenerated
          ? `Here’s a plan with ${fresh.length} steps. Edit, remove or add your own on the right, then save.`
          : `Here’s a starter plan with ${fresh.length} steps (from SPARK’s built-in planner, because AI suggestions aren’t available right now). Make it yours, then save.`,
        { kind: 'steps' }
      );
      setStage('review');
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- free text input ---------------- */

  function submitText(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    if (stage === 'goal') { echo(text); answerGoal(text); return; }
    if (stage === 'category') {
      echo(text);
      const merged = `${draft.explore} ${text}`;
      const a = analyseGoalText(merged, { subjects, pblProjects, today });
      const next = { ...draft, explore: merged.slice(0, LIMITS.text), category: a.category, goalType: inferGoalType(a.category, merged), subject: a.subject || draft.subject };
      setDraft(next);
      say(coachReadback({ ...a, subject: next.subject }));
      askNextAfterCategory(next);
      return;
    }
    if (stage === 'subject') { chooseSubject(text); return; }
    if (stage === 'project') { chooseProject({ id: '', title: text.slice(0, 120) }); return; }
    if (stage === 'when') {
      const tf = parseTimeframe(text, today) || parseTimeframe(`in ${text}`, today);
      if (tf) chooseDate(tf.date, text);
      else { echo(text); say('I couldn’t read a date from that. Try “in 3 weeks”, or tap a button.'); }
      return;
    }
    if (stage === 'outcome') { chooseOutcome(text); return; }
    if (stage === 'review' || stage === 'steps') {
      if (draft.steps.length >= LIMITS.steps) { say(`You already have ${LIMITS.steps} steps. Remove one to add another.`); return; }
      echo(text);
      patch({ steps: [...draft.steps, { id: newId('s'), text: text.slice(0, LIMITS.text), frequency: 'weekly' }] });
      say('Added to your plan.');
    }
  }

  function restart() {
    timers.current.forEach(clearTimeout);
    setTyping(false);
    setDraft((d) => ({ ...d, explore: '', category: preset?.category || null, goalType: '', subject: preset?.subject || '', projectId: '', projectTitle: '', targetDate: '', measurableOutcome: '', steps: [] }));
    setAiSource(null);
    setStage('goal');
    setMessages([{ id: newId('m'), from: 'coach', text: 'Fresh start. What do you want to achieve?' }]);
  }

  const canSave = Boolean(draft.explore.trim()) && draft.steps.some((s) => s.text.trim());

  function save() {
    if (!canSave) return;
    onSave?.(buildCoachGoal(draft, { supports }));
  }

  /* ---------------- quick replies per stage ---------------- */

  const placeholder = {
    goal: 'Type your goal, e.g. “Get 80% on my next maths test”',
    category: 'Or tell me more about it…',
    subject: 'Or type a subject…',
    project: 'Or type the project name…',
    when: 'Or type “in 3 weeks”…',
    outcome: 'Or write how you’ll know you’ve done it…',
    steps: 'Add your own step…',
    review: 'Add your own step…'
  }[stage];

  let quick = null;
  if (!typing && !busy) {
    if (stage === 'goal') {
      quick = coachIdeas({ subjects, pblProjects, presetCategory: preset?.category, presetSubject: preset?.subject })
        .map((idea) => ({ key: idea, label: idea, onClick: () => { echo(idea); answerGoal(idea); } }));
    } else if (stage === 'category') {
      quick = [
        { key: 'yes', label: 'Yes, that’s right', primary: true, Icon: Check, onClick: () => chooseCategory(draft.category) },
        ...GOAL_CATEGORIES.filter((c) => c.id !== draft.category).map((c) => ({ key: c.id, label: c.shortLabel, Icon: CAT_ICON[c.id], onClick: () => chooseCategory(c.id) }))
      ];
    } else if (stage === 'subject') {
      const own = subjects.map((s) => s.subject).filter(Boolean);
      const list = [...new Set([...own, ...MANUAL_SUBJECT_OPTIONS])].slice(0, 8);
      quick = list.map((s) => ({ key: s, label: s, onClick: () => chooseSubject(s) }));
    } else if (stage === 'project') {
      quick = [
        ...pblProjects.slice(0, 4).map((p) => ({ key: p.id, label: p.title, onClick: () => chooseProject(p) })),
        { key: 'none', label: 'Not linked to a project', onClick: () => chooseProject(null) }
      ];
    } else if (stage === 'when') {
      quick = TIMEFRAMES.map((t) => ({ key: t.id, label: t.label, Icon: Calendar, onClick: () => chooseDate(timeframeDate(t.id, today), t.label) }));
    } else if (stage === 'outcome') {
      quick = outcomeSuggestions(draft).map((o) => ({ key: o, label: o, onClick: () => chooseOutcome(o) }));
    } else if (stage === 'review') {
      quick = [
        { key: 'save', label: 'Save my goal', primary: true, Icon: Check, onClick: save, disabled: !canSave },
        { key: 'again', label: 'Suggest different steps', Icon: RotateCcw, onClick: () => { echo('Suggest different steps'); buildSteps(draft, true); } }
      ];
    }
  }

  const CatIcon = CAT_ICON[draft.category] || Sparkles;
  const daysLeft = draft.targetDate ? daysBetween(today, draft.targetDate) : null;
  const ringC = 2 * Math.PI * 22;

  return (
    <section className="gc-shell" aria-label="SPARK Goal Coach">
      <div className="gc-chat">
        <header className="gc-chat-head">
          <span className="gc-avatar" aria-hidden="true"><Bot size={20} /></span>
          <div className="gc-chat-title">
            <h2>SPARK Goal Coach</h2>
            <p>
              <span className="gc-live-dot" aria-hidden="true" />
              {aiSource === 'gemini' ? 'AI steps by Gemini' : aiSource === 'local' ? 'Built-in planner (AI unavailable)' : 'Here to help you plan'}
            </p>
          </div>
          <div className="gc-head-actions">
            <button type="button" className="gc-icon-btn" onClick={restart} title="Start over" aria-label="Start over">
              <RotateCcw size={16} aria-hidden="true" />
            </button>
            {onUseForm && (
              <button type="button" className="gc-text-btn" onClick={() => onUseForm(draft)}>
                <SlidersHorizontal size={14} aria-hidden="true" /> Use the detailed form
              </button>
            )}
            {onCancel && (
              <button type="button" className="gc-icon-btn" onClick={onCancel} title="Close coach" aria-label="Close coach">
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </header>

        <div className="gc-log" ref={logRef} role="log" aria-live="polite" aria-label="Conversation with the goal coach">
          {messages.map((m) => (
            <div key={m.id} className={`gc-msg gc-msg-${m.from}`}>
              {m.from === 'coach' && <span className="gc-msg-avatar" aria-hidden="true"><Sparkles size={13} /></span>}
              <p className="gc-bubble">{m.text}</p>
            </div>
          ))}
          {(typing || busy) && (
            <div className="gc-msg gc-msg-coach" aria-label="Coach is typing">
              <span className="gc-msg-avatar" aria-hidden="true"><Sparkles size={13} /></span>
              <p className="gc-bubble gc-typing"><span /><span /><span /></p>
            </div>
          )}
        </div>

        {quick && quick.length > 0 && (
          <div className="gc-quick" role="group" aria-label="Quick replies">
            {quick.map(({ key, label, onClick, primary, Icon, disabled }) => (
              <button key={key} type="button" className={`gc-chip ${primary ? 'is-primary' : ''}`} onClick={onClick} disabled={disabled}>
                {Icon && <Icon size={14} aria-hidden="true" />}
                <span>{label}</span>
              </button>
            ))}
            {stage === 'when' && (
              <label className="gc-chip gc-chip-date">
                <Calendar size={14} aria-hidden="true" />
                <span className="gc-sr">Pick a date</span>
                <input
                  type="date"
                  min={today}
                  aria-label="Pick a target date"
                  onChange={(e) => e.target.value && chooseDate(e.target.value)}
                />
              </label>
            )}
          </div>
        )}

        <form className="gc-input-row" onSubmit={submitText}>
          <label htmlFor="gc-input" className="gc-sr">Message the goal coach</label>
          <input
            id="gc-input"
            ref={inputRef}
            className="gc-input"
            value={input}
            maxLength={LIMITS.text}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            disabled={busy}
          />
          <button type="submit" className="gc-send" aria-label="Send" disabled={!input.trim() || busy}>
            <Send size={17} aria-hidden="true" />
          </button>
        </form>
      </div>

      <aside className="gc-blueprint" aria-label="Your goal so far">
        <div className="gc-bp-top">
          <span className="gc-bp-kicker"><Wand2 size={13} aria-hidden="true" /> Live goal blueprint</span>
          <div className="gc-smart-ring" role="img" aria-label={`SMART score ${smart.score} of ${smart.total}`}>
            <svg viewBox="0 0 52 52" aria-hidden="true">
              <circle cx="26" cy="26" r="22" className="gc-ring-track" />
              <circle cx="26" cy="26" r="22" className="gc-ring-value" strokeDasharray={ringC} strokeDashoffset={ringC * (1 - smart.score / smart.total)} />
            </svg>
            <strong>{smart.score}/{smart.total}</strong>
          </div>
        </div>

        <div className={`gc-bp-card gc-cat-${draft.category || 'none'}`}>
          <div className="gc-bp-badges">
            <span className="gc-bp-cat"><CatIcon size={13} aria-hidden="true" /> {draft.category ? categoryMeta(draft.category).shortLabel : 'Type of goal'}</span>
            {draft.goalType && <span className="gc-bp-sub">{subtypeLabel(draft.goalType)}</span>}
          </div>
          <h3 className={draft.explore ? '' : 'is-placeholder'}>{draft.explore || 'Your goal will appear here'}</h3>
          <dl className="gc-bp-facts">
            {(draft.subject || draft.category === 'academic') && (
              <div><dt>Subject</dt><dd>{draft.subject || '—'}</dd></div>
            )}
            {draft.projectTitle && <div><dt>Project</dt><dd>{draft.projectTitle}</dd></div>}
            <div>
              <dt>Target</dt>
              <dd>{draft.targetDate ? <>{prettyDate(draft.targetDate)} <span className="gc-bp-days">{daysLeft} days</span></> : '—'}</dd>
            </div>
            <div className="gc-bp-wide"><dt>Success looks like</dt><dd>{draft.measurableOutcome || '—'}</dd></div>
          </dl>
        </div>

        <div className="gc-smart" aria-label="SMART checklist">
          {smart.items.map((it) => (
            <div key={it.id} className={`gc-smart-item ${it.met ? 'is-met' : ''}`} title={it.met ? `${it.label}: done` : it.tip}>
              <span className="gc-smart-letter" aria-hidden="true">{it.letter}</span>
              <span className="gc-smart-label">{it.label}</span>
              {it.met ? <Check size={14} aria-hidden="true" className="gc-smart-tick" /> : <span className="gc-smart-tip">{it.tip}</span>}
            </div>
          ))}
        </div>

        <div className="gc-steps">
          <div className="gc-steps-head">
            <ListChecks size={15} aria-hidden="true" />
            <span>Steps ({draft.steps.length}/{LIMITS.steps})</span>
            {aiSource && <span className={`gc-src gc-src-${aiSource}`}>{aiSource === 'gemini' ? 'Gemini AI' : 'Built-in planner'}</span>}
          </div>
          {draft.steps.length === 0 ? (
            <p className="gc-steps-empty">{busy ? 'Planning your steps…' : 'Your coach will suggest steps once you’ve picked a target.'}</p>
          ) : (
            <ol className="gc-step-list">
              {draft.steps.map((s, i) => (
                <li key={s.id} className="gc-step">
                  <span className="gc-step-n" aria-hidden="true">{i + 1}</span>
                  <textarea
                    className="gc-step-text"
                    rows={2}
                    value={s.text}
                    maxLength={LIMITS.text}
                    aria-label={`Step ${i + 1}`}
                    onChange={(e) => patch({ steps: draft.steps.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)) })}
                  />
                  <select
                    className="gc-step-freq"
                    value={s.frequency || 'once'}
                    aria-label={`How often for step ${i + 1}`}
                    onChange={(e) => patch({ steps: draft.steps.map((x) => (x.id === s.id ? { ...x, frequency: e.target.value } : x)) })}
                  >
                    {STEP_FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{f.id === 'once' ? 'Once' : f.id === 'daily' ? 'Daily' : 'Weekly'}</option>)}
                  </select>
                  <button
                    type="button"
                    className="gc-icon-btn"
                    aria-label={`Remove step ${i + 1}`}
                    onClick={() => patch({ steps: draft.steps.filter((x) => x.id !== s.id) })}
                  >
                    <Trash size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
          )}
          {draft.steps.length > 0 && draft.steps.length < LIMITS.steps && (
            <button
              type="button"
              className="gc-text-btn"
              onClick={() => patch({ steps: [...draft.steps, { id: newId('s'), text: '', frequency: 'weekly' }] })}
            >
              <Plus size={14} aria-hidden="true" /> Add a step
            </button>
          )}
        </div>

        <button type="button" className="gc-save" onClick={save} disabled={!canSave}>
          <Check size={17} aria-hidden="true" /> Save my goal
        </button>
      </aside>
    </section>
  );
}
