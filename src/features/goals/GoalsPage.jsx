import { useMemo, useState } from 'react';
import {
  Target, Sparkles, CircleCheck, Circle, Plus, Trash, Flag, Zap, Heart, MessageCircle, BatteryCharging,
  Cloud, CloudOff, Eye, Trophy, RotateCcw
} from 'lucide-react';
import {
  STRENGTHS, SUPPORTS, SHOW_HOW, FOCUS_SKILLS, PHRASES, RECHARGE, LIMITS,
  touch, newId, hasPlan, goalSentence, todayItems, checkedToday, toggleToday, habitWeek, dayKey
} from './goalPlan.js';
import { useGoalPlan } from './useGoalPlan.js';
import '../admin/admin.css';
import './goals.css';

/**
 * Full-page goal setting (#/goals), replacing the pop-up wizard for secondary
 * learners. Strength-based: see goalPlan.js for the model and why it never
 * asks for a diagnosis.
 */
export function GoalsPage({ uid, displayName }) {
  const { plan, update, syncState, loaded } = useGoalPlan(uid);
  const firstName = String(displayName || '').split(' ')[0];
  const set = (patch) => update((p) => touch(p, patch));
  const toggleIn = (key, id) => update((p) => touch(p, { [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id] }));

  return (
    <div className="gh-page gl-page">
      <header className="gl-head">
        <div>
          <span className="gl-kicker"><Target size={15} aria-hidden="true" />My goals</span>
          <h1>{firstName ? `${firstName}, build on what you are great at` : 'Build on what you are great at'}</h1>
          <p>Big goals start from what you love. Small daily steps, the support that works for you, and time to recharge get you there.</p>
        </div>
        <SyncBadge state={syncState} />
      </header>

      <p className="gl-visible"><Eye size={15} aria-hidden="true" />Your coach can see this page, so they know what helps you. You never need to name a diagnosis here.</p>

      {loaded && !hasPlan(plan) && <GettingStarted />}

      <div className="gl-grid">
        <div className="gl-col">
          <TodayCard plan={plan} update={update} />
          <BigGoals plan={plan} update={update} />
          <FocusSkill plan={plan} set={set} />
        </div>
        <div className="gl-col">
          <ChipCard id="gl-strengths" icon={Sparkles} title="My strengths" hint="What are you good at, or love doing?"
                    items={STRENGTHS} selected={plan.strengths} onToggle={(id) => toggleIn('strengths', id)}
                    own={plan.strengthsOwn} onOwn={(v) => set({ strengthsOwn: v })} ownLabel="Another strength" />
          <ChipCard id="gl-supports" icon={Heart} title="What helps me" hint="Pick the things that make work easier for you."
                    items={SUPPORTS} selected={plan.supports} onToggle={(id) => toggleIn('supports', id)}
                    own={plan.supportsOwn} onOwn={(v) => set({ supportsOwn: v })} ownLabel="Something else that helps" />
          <Phrases plan={plan} toggle={(id) => toggleIn('phrases', id)} set={set} />
          <ChipCard id="gl-recharge" icon={BatteryCharging} title="My recharge plan"
                    hint="After a hard day, what gets you back into flow? Your first pick shows up as a daily break."
                    items={RECHARGE} selected={plan.recharge} onToggle={(id) => toggleIn('recharge', id)} />
        </div>
      </div>
    </div>
  );
}

function SyncBadge({ state }) {
  if (state === 'local-only') return <span className="gl-sync gl-sync-warn"><CloudOff size={14} aria-hidden="true" />Saved on this device only</span>;
  if (state === 'saving') return <span className="gl-sync"><Cloud size={14} aria-hidden="true" />Saving…</span>;
  if (state === 'saved') return <span className="gl-sync gl-sync-ok"><Cloud size={14} aria-hidden="true" />Saved</span>;
  return null;
}

function GettingStarted() {
  const steps = [
    ['gl-strengths', 'Pick your strengths', 'and what helps you work.'],
    ['gl-goals', 'Set one big goal', 'from something you want to explore.'],
    ['gl-focus', 'Choose one focus skill', 'and a tiny daily habit.']
  ];
  return (
    <ol className="gl-start" aria-label="Getting started">
      {steps.map(([href, title, body], i) => (
        <li key={href}><a href={`#${href}`} onClick={(e) => { e.preventDefault(); document.getElementById(href)?.scrollIntoView({ behavior: 'smooth' }); }}>
          <span className="gl-start-n">{i + 1}</span><span><strong>{title}</strong> {body}</span>
        </a></li>
      ))}
    </ol>
  );
}

function Card({ id, icon: Icon, title, hint, action, children }) {
  return (
    <section className="gl-card" id={id} aria-labelledby={`${id}-h`}>
      <div className="gl-card-head">
        <span className="gl-card-icon"><Icon size={17} aria-hidden="true" /></span>
        <div className="gl-grow">
          <h2 id={`${id}-h`}>{title}</h2>
          {hint && <p>{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Chips({ items, selected, onToggle, single = false, label }) {
  return (
    <div className="gl-chips" role="group" aria-label={label}>
      {items.map((it) => {
        const on = single ? selected === it.id : selected.includes(it.id);
        return (
          <button key={it.id} type="button" className="gl-chip" aria-pressed={on} onClick={() => onToggle(it.id)}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function ChipCard({ id, icon, title, hint, items, selected, onToggle, own, onOwn, ownLabel }) {
  return (
    <Card id={id} icon={icon} title={title} hint={hint}>
      <Chips items={items} selected={selected} onToggle={onToggle} label={title} />
      {onOwn && (
        <label className="gl-own">
          <span>{ownLabel}</span>
          <input className="gh-input" value={own} maxLength={LIMITS.own} onChange={(e) => onOwn(e.target.value)} placeholder="Optional" />
        </label>
      )}
    </Card>
  );
}

/* ---------------- Today ---------------- */

function TodayCard({ plan, update }) {
  const items = todayItems(plan);
  const checked = checkedToday(plan);
  const done = items.filter((i) => checked.has(i.id)).length;
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <Card id="gl-today" icon={CircleCheck} title="Today" hint={date}
          action={items.length > 0 && <span className="gl-today-count">{done} of {items.length} done</span>}>
      {items.length ? (
        <>
          <span className="gl-bar" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={items.length} aria-label="Today's goals">
            <i style={{ width: `${(done / items.length) * 100}%` }} />
          </span>
          <ul className="gl-today">
            {items.map((it) => {
              const on = checked.has(it.id);
              return (
                <li key={it.id}>
                  <button type="button" className="gl-check" aria-pressed={on} onClick={() => update((p) => toggleToday(p, it))}>
                    {on ? <CircleCheck size={20} aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}
                    <span>
                      <span className="gl-check-text">{it.text}</span>
                      <span className="gl-check-kind">
                        {it.kind === 'habit' ? 'Focus skill habit' : it.kind === 'recharge' ? 'Recharge' : `Step towards: ${it.goal}`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {done === items.length && <p className="gl-cheer"><Trophy size={16} aria-hidden="true" />All done for today. Nice work.</p>}
        </>
      ) : (
        <p className="gl-empty">Your daily checklist builds itself from your focus habit, the next step of each big goal, and your recharge plan. Add those below.</p>
      )}
    </Card>
  );
}

/* ---------------- Big goals ---------------- */

function BigGoals({ plan, update }) {
  const [adding, setAdding] = useState(plan.goals.length === 0);
  const full = plan.goals.length >= LIMITS.goals;
  const patchGoal = (id, fn) => update((p) => touch(p, { goals: p.goals.map((g) => (g.id === id ? fn(g) : g)) }));
  const removeGoal = (id) => update((p) => touch(p, { goals: p.goals.filter((g) => g.id !== id) }));
  return (
    <Card id="gl-goals" icon={Flag} title="My big goals"
          hint="Start from something you want to explore. Then choose how you will show it and what will help."
          action={!adding && !full && (
            <button type="button" className="gh-btn gh-btn-sm" onClick={() => setAdding(true)}><Plus size={15} aria-hidden="true" />Add</button>
          )}>
      {plan.goals.map((g) => <GoalItem key={g.id} goal={g} patch={(fn) => patchGoal(g.id, fn)} remove={() => removeGoal(g.id)} />)}
      {adding && !full && (
        <NewGoalForm supportsFirst={plan.supports} onCancel={plan.goals.length ? () => setAdding(false) : null}
                     onAdd={(g) => { update((p) => touch(p, { goals: [...p.goals, g] })); setAdding(false); }} />
      )}
      {full && <p className="gl-note">Three big goals at a time keeps things manageable. Finish or remove one to add another.</p>}
    </Card>
  );
}

function NewGoalForm({ onAdd, onCancel, supportsFirst }) {
  const [explore, setExplore] = useState('');
  const [showHow, setShowHow] = useState(null);
  // Follows "What helps me" until the learner changes it here.
  const [ownSupports, setSupports] = useState(null);
  const supports = ownSupports ?? supportsFirst.slice(0, 3);
  const [steps, setSteps] = useState(['', '']);
  const ordered = useMemo(() => [...SUPPORTS].sort((a, b) => supportsFirst.includes(b.id) - supportsFirst.includes(a.id)), [supportsFirst]);

  function submit(e) {
    e.preventDefault();
    if (!explore.trim()) return;
    onAdd({
      id: newId('g'), explore: explore.trim().slice(0, LIMITS.text), showHow, supports, done: false, createdAt: Date.now(),
      steps: steps.map((s) => s.trim()).filter(Boolean).slice(0, LIMITS.steps).map((text) => ({ id: newId('s'), text, done: false }))
    });
  }
  const preview = explore.trim() ? goalSentence({ explore: explore.trim(), showHow, supports }) : null;

  return (
    <form className="gl-form" onSubmit={submit}>
      <label className="gl-field">
        <span>1. What do you want to explore?</span>
        <input className="gh-input" value={explore} maxLength={LIMITS.text} onChange={(e) => setExplore(e.target.value)}
               placeholder="e.g. how black holes bend light, or how to build a walking robot" required />
      </label>
      <div className="gl-field">
        <span>2. How will you show what you learn?</span>
        <Chips items={SHOW_HOW} selected={showHow} single label="How you will show it"
               onToggle={(id) => setShowHow((cur) => (cur === id ? null : id))} />
      </div>
      <div className="gl-field">
        <span>3. What will help you?</span>
        <Chips items={ordered} selected={supports} label="What will help"
               onToggle={(id) => setSupports(supports.includes(id) ? supports.filter((x) => x !== id) : [...supports, id])} />
      </div>
      <div className="gl-field">
        <span>4. First small steps <em>(optional)</em></span>
        {steps.map((s, i) => (
          <input key={i} className="gh-input" value={s} maxLength={LIMITS.text} aria-label={`Step ${i + 1}`}
                 placeholder={i === 0 ? 'e.g. Watch one video about it' : 'e.g. Write 3 questions I want answered'}
                 onChange={(e) => setSteps((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))} />
        ))}
        {steps.length < LIMITS.steps && (
          <button type="button" className="gl-link" onClick={() => setSteps((cur) => [...cur, ''])}><Plus size={14} aria-hidden="true" />Another step</button>
        )}
      </div>
      {preview && <p className="gl-preview"><strong>Your goal:</strong> {preview}</p>}
      <div className="gl-actions">
        <button type="submit" className="gh-btn gh-btn-accent" disabled={!explore.trim()}>Save goal</button>
        {onCancel && <button type="button" className="gh-btn gh-btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function GoalItem({ goal, patch, remove }) {
  const [step, setStep] = useState('');
  const [confirming, setConfirming] = useState(false);
  const done = goal.steps.filter((s) => s.done).length;
  function addStep(e) {
    e.preventDefault();
    if (!step.trim()) return;
    patch((g) => ({ ...g, steps: [...g.steps, { id: newId('s'), text: step.trim().slice(0, LIMITS.text), done: false }].slice(0, LIMITS.steps) }));
    setStep('');
  }
  return (
    <article className={goal.done ? 'gl-goal is-done' : 'gl-goal'}>
      <p className="gl-goal-sentence">{goalSentence(goal)}</p>
      {goal.steps.length > 0 && (
        <>
          <span className="gl-goal-meta">{done} of {goal.steps.length} steps done</span>
          <ul className="gl-steps">
            {goal.steps.map((s) => (
              <li key={s.id}>
                <button type="button" className="gl-check gl-check-sm" aria-pressed={s.done}
                        onClick={() => patch((g) => ({ ...g, steps: g.steps.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) }))}>
                  {s.done ? <CircleCheck size={17} aria-hidden="true" /> : <Circle size={17} aria-hidden="true" />}
                  <span className="gl-check-text">{s.text}</span>
                </button>
                <button type="button" className="gl-icon-btn" aria-label={`Remove step: ${s.text}`}
                        onClick={() => patch((g) => ({ ...g, steps: g.steps.filter((x) => x.id !== s.id) }))}>
                  <Trash size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {!goal.done && goal.steps.length < LIMITS.steps && (
        <form className="gl-addstep" onSubmit={addStep}>
          <input className="gh-input" value={step} maxLength={LIMITS.text} onChange={(e) => setStep(e.target.value)}
                 placeholder="Add a small step" aria-label={`Add a step to: ${goal.explore}`} />
          <button type="submit" className="gh-btn gh-btn-sm" disabled={!step.trim()}><Plus size={14} aria-hidden="true" />Add</button>
        </form>
      )}
      <div className="gl-goal-actions">
        <button type="button" className="gh-btn gh-btn-sm" onClick={() => patch((g) => ({ ...g, done: !g.done }))}>
          {goal.done ? <><RotateCcw size={14} aria-hidden="true" />Reopen</> : <><Trophy size={14} aria-hidden="true" />I did it</>}
        </button>
        {confirming ? (
          <span className="gl-confirm">Remove this goal?
            <button type="button" className="gh-btn gh-btn-sm gh-btn-danger" onClick={remove}>Remove</button>
            <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={() => setConfirming(false)}>Keep</button>
          </span>
        ) : (
          <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={() => setConfirming(true)}><Trash size={14} aria-hidden="true" />Remove</button>
        )}
      </div>
    </article>
  );
}

/* ---------------- Focus skill ---------------- */

function FocusSkill({ plan, set }) {
  const focus = plan.focus;
  const skill = FOCUS_SKILLS.find((s) => s.id === focus?.skill);
  const week = habitWeek(plan);
  const today = dayKey();
  const choose = (id) => {
    const s = FOCUS_SKILLS.find((x) => x.id === id);
    set({ focus: focus?.skill === id ? null : { skill: id, habit: s.habits[0], daysPerWeek: focus?.daysPerWeek || 5 } });
  };
  return (
    <Card id="gl-focus" icon={Zap} title="One focus skill"
          hint="Work on one thinking-and-organising skill at a time, with a habit so small it is easy to start.">
      <Chips items={FOCUS_SKILLS} selected={focus?.skill || null} single onToggle={choose} label="Focus skill" />
      {skill && (
        <div className="gl-focus">
          <div className="gl-field">
            <span>My tiny daily habit</span>
            <div className="gl-chips" role="group" aria-label="Suggested habits">
              {skill.habits.map((h) => (
                <button key={h} type="button" className="gl-chip" aria-pressed={focus.habit === h}
                        onClick={() => set({ focus: { ...focus, habit: h } })}>{h}</button>
              ))}
            </div>
            <input className="gh-input" value={focus.habit} maxLength={LIMITS.text} aria-label="Your own habit"
                   onChange={(e) => set({ focus: { ...focus, habit: e.target.value } })} placeholder="Or write your own" />
          </div>
          <div className="gl-field">
            <span>How many days a week?</span>
            <div className="gl-chips" role="group" aria-label="Days a week">
              {[3, 4, 5, 6, 7].map((n) => (
                <button key={n} type="button" className="gl-chip gl-chip-n" aria-pressed={focus.daysPerWeek === n}
                        onClick={() => set({ focus: { ...focus, daysPerWeek: n } })}>{n}</button>
              ))}
            </div>
          </div>
          <div className="gl-week" aria-label={`Habit done on ${week.count} of the last 7 days, aiming for ${week.target}`}>
            {week.days.map((d) => (
              <span key={d.day} className={`gl-dot${d.done ? ' on' : ''}${d.day === today ? ' today' : ''}`}
                    title={`${new Date(`${d.day}T12:00`).toLocaleDateString(undefined, { weekday: 'long' })}: ${d.done ? 'done' : 'not yet'}`}>
                {new Date(`${d.day}T12:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
              </span>
            ))}
            <span className="gl-week-text">{week.count} of {week.target} this week</span>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ---------------- Self-advocacy ---------------- */

function Phrases({ plan, toggle, set }) {
  return (
    <Card id="gl-phrases" icon={MessageCircle} title="What I can say"
          hint="Pick phrases you can use when you need something in class. Practise them so they feel easy.">
      <ul className="gl-phrases">
        {PHRASES.map((p) => (
          <li key={p.id}>
            <button type="button" className="gl-phrase" aria-pressed={plan.phrases.includes(p.id)} onClick={() => toggle(p.id)}>
              “{p.text}”
            </button>
          </li>
        ))}
      </ul>
      <label className="gl-own">
        <span>My own words</span>
        <input className="gh-input" value={plan.phraseOwn} maxLength={LIMITS.own} placeholder="Optional"
               onChange={(e) => set({ phraseOwn: e.target.value })} />
      </label>
    </Card>
  );
}
