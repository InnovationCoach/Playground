import { useState } from 'react';
import {
  Sparkles, Circle, Plus, Trash, Flag, Zap, Heart, MessageCircle, BatteryCharging,
  Cloud, CloudOff, Eye, RotateCcw, Check, Copy, ArrowRight, Compass,
  CheckCircle2, Award
} from 'lucide-react';
import {
  STRENGTHS, SUPPORTS, FOCUS_SKILLS, PHRASES, RECHARGE, LIMITS,
  touch, newId, goalSentence, todayItems, checkedToday, toggleToday, habitWeek, dayKey
} from './goalPlan.js';
import { useGoalPlan } from './useGoalPlan.js';
import { hrefFor } from '../../app/routes.js';
import { ArchetypeRadar } from './ArchetypeRadar.jsx';
import { DailyBountyBoard } from './DailyBountyBoard.jsx';
import { GoalFlow } from './GoalFlow.jsx';
import '../admin/admin.css';
import './goals.css';

const TABS = [
  { id: 'quests', label: 'My goals', Icon: Flag },
  { id: 'today', label: 'Today', Icon: Zap },
  { id: 'skills', label: 'How I like to work', Icon: Award },
  { id: 'toolkit', label: 'What helps me', Icon: Sparkles }
];

/**
 * Goal setting (#/goals). A new goal is a short guided flow (GoalFlow.jsx); the
 * tabs keep the rest: today's checklist and habit, each goal's steps, working
 * styles, and the strengths, supports, phrases and breaks a learner chooses.
 */
export function GoalsPage({ uid, displayName }) {
  const { plan, update, syncState, loaded } = useGoalPlan(uid);
  const [activeTab, setActiveTab] = useState('quests');
  const firstName = String(displayName || '').split(' ')[0];

  const set = (patch) => update((p) => touch(p, patch));
  const toggleIn = (key, id) =>
    update((p) => touch(p, { [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id] }));

  return (
    <div className="gh-page gl-page gl-teen">
      <header className="gl-head">
        <div>
          <h1>{firstName ? `${firstName}’s goals` : 'My goals'}</h1>
          <p className="gl-subtitle">Pick something you care about, then take one small step at a time.</p>
          <p className="gl-privacy"><Eye size={14} aria-hidden="true" /> Your coach can see this so they know what helps you. We never ask about a diagnosis.</p>
        </div>
        <SyncBadge state={syncState} />
      </header>

      <nav className="gl-tabs" role="tablist" aria-label="Goal views">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={activeTab === id} aria-controls={`panel-${id}`}
            className={`gl-tab ${activeTab === id ? 'is-active' : ''}`} onClick={() => setActiveTab(id)}>
            <span className="gl-tab-icon"><Icon size={16} aria-hidden="true" /></span>
            <span className="gl-tab-text">{label}</span>
          </button>
        ))}
      </nav>

      <main className="gl-tab-content">
        {activeTab === 'quests' && (
          <div id="panel-quests" role="tabpanel" aria-labelledby="tab-quests" className="gl-pane gl-pane-quests">
            {loaded ? <BigGoalsSection plan={plan} update={update} /> : <p role="status">Loading your goals…</p>}
          </div>
        )}

        {activeTab === 'today' && (
          <div id="panel-today" role="tabpanel" aria-labelledby="tab-today" className="gl-pane gl-pane-today">
            <div className="gl-grid-two">
              <TodayCard plan={plan} update={update} onGoQuests={() => setActiveTab('quests')} onGoToolkit={() => setActiveTab('toolkit')} />
              <div className="gl-side-col">
                <FocusSkillCard plan={plan} set={set} />
                <QuickRechargeCard plan={plan} onGoToolkit={() => setActiveTab('toolkit')} />
              </div>
            </div>
            <DailyBountyBoard plan={plan} update={update} />
          </div>
        )}

        {activeTab === 'skills' && (
          <div id="panel-skills" role="tabpanel" aria-labelledby="tab-skills" className="gl-pane gl-pane-skills">
            <ArchetypeRadar plan={plan} />
          </div>
        )}

        {activeTab === 'toolkit' && (
          <div id="panel-toolkit" role="tabpanel" aria-labelledby="tab-toolkit" className="gl-pane gl-pane-toolkit">
            <ToolkitSection plan={plan} set={set} toggleIn={toggleIn} />
          </div>
        )}
      </main>
    </div>
  );
}

/* =========================================================================
   COMPONENTS
   ========================================================================= */

function SyncBadge({ state }) {
  if (state === 'local-only') {
    return (
      <span className="gl-tag gl-tag-warn" title="Only stored locally in your browser">
        <CloudOff size={13} aria-hidden="true" />
        <span>Local only</span>
      </span>
    );
  }
  if (state === 'saving') {
    return (
      <span className="gl-tag gl-tag-saving">
        <Cloud size={13} aria-hidden="true" />
        <span>Saving…</span>
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="gl-tag gl-tag-saved">
        <Check size={13} aria-hidden="true" />
        <span>Synced</span>
      </span>
    );
  }
  return null;
}

/* ---------------- TODAY VIEW ---------------- */

function TodayCard({ plan, update, onGoQuests, onGoToolkit }) {
  const items = todayItems(plan);
  const checked = checkedToday(plan);
  const done = items.filter((i) => checked.has(i.id)).length;
  const isAllComplete = items.length > 0 && done === items.length;
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <section className="gl-card gl-today-hero" id="gl-today">
      <div className="gl-card-header">
        <div className="gl-card-title-group">
          <span className="gl-icon-bubble gl-bubble-lime">
            <Zap size={18} aria-hidden="true" />
          </span>
          <div>
            <h2>Today</h2>
            <p className="gl-subtitle">{dateStr}</p>
          </div>
        </div>
        {items.length > 0 && (
          <span className={`gl-meter-pill ${isAllComplete ? 'is-complete' : ''}`}>
            {done} of {items.length} done
          </span>
        )}
      </div>

      {items.length > 0 ? (
        <>
          <ul className="gl-task-list">
            {items.map((it) => {
              const on = checked.has(it.id);
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    className={`gl-task-item ${on ? 'is-checked' : ''}`}
                    aria-pressed={on}
                    onClick={() => update((p) => toggleToday(p, it))}
                  >
                    <span className="gl-checkbox">
                      {on ? <CheckCircle2 size={22} className="gl-checked-icon" /> : <Circle size={22} className="gl-unchecked-icon" />}
                    </span>
                    <span className="gl-task-body">
                      <span className="gl-task-text">{it.text}</span>
                      <span className="gl-task-tag">
                        {it.kind === 'habit' ? 'Daily habit' : it.kind === 'recharge' ? 'Break' : `Step for: ${it.goal}`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {isAllComplete && (
            <div className="gl-celebration-banner">
              <Check size={20} aria-hidden="true" />
              <div>
                <strong>That’s everything for today.</strong>
                <p>Nice work. Take a break, or try something you enjoy.</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="gl-empty-box">
          <Compass size={32} className="gl-empty-icon" aria-hidden="true" />
          <h3>Nothing here yet</h3>
          <p>Your list fills in from your goals, your daily habit and the breaks you pick.</p>
          <div className="gl-empty-actions">
            <button type="button" className="gh-btn gh-btn-sm gh-btn-accent" onClick={onGoQuests}>
              <Plus size={14} aria-hidden="true" />Set a goal
            </button>
            <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={onGoToolkit}>
              Choose what helps me
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function FocusSkillCard({ plan, set }) {
  const focus = plan.focus;
  const skill = FOCUS_SKILLS.find((s) => s.id === focus?.skill);
  const week = habitWeek(plan);
  const today = dayKey();

  const choose = (id) => {
    const s = FOCUS_SKILLS.find((x) => x.id === id);
    set({ focus: focus?.skill === id ? null : { skill: id, habit: s.habits[0], daysPerWeek: focus?.daysPerWeek || 5 } });
  };

  return (
    <section className="gl-card gl-focus-card" id="gl-focus">
      <div className="gl-card-header">
        <div className="gl-card-title-group">
          <span className="gl-icon-bubble gl-bubble-purple">
            <Zap size={18} aria-hidden="true" />
          </span>
          <div>
            <h2>Daily habit</h2>
            <p className="gl-subtitle">One small thing to practise each day</p>
          </div>
        </div>
      </div>

      <div className="gl-chip-group" role="group" aria-label="Choose a skill to practise">
        {FOCUS_SKILLS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`gl-pill ${focus?.skill === s.id ? 'is-selected' : ''}`}
            aria-pressed={focus?.skill === s.id}
            onClick={() => choose(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {skill && (
        <div className="gl-focus-active-box">
          <div className="gl-field">
            <span className="gl-field-label">My habit</span>
            <div className="gl-chip-group gl-habit-options" role="group" aria-label="Suggested habits">
              {skill.habits.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`gl-pill gl-pill-subtle ${focus.habit === h ? 'is-selected' : ''}`}
                  aria-pressed={focus.habit === h}
                  onClick={() => set({ focus: { ...focus, habit: h } })}
                >
                  {h}
                </button>
              ))}
            </div>
            <input
              className="gh-input gl-habit-input"
              value={focus.habit}
              maxLength={LIMITS.text}
              aria-label="My own habit"
              onChange={(e) => set({ focus: { ...focus, habit: e.target.value } })}
              placeholder="Or write your own"
            />
          </div>

          <div className="gl-field">
            <span className="gl-field-label">Days each week</span>
            <div className="gl-chip-group" role="group" aria-label="Days per week target">
              {[3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`gl-pill gl-pill-num ${focus.daysPerWeek === n ? 'is-selected' : ''}`}
                  aria-pressed={focus.daysPerWeek === n}
                  onClick={() => set({ focus: { ...focus, daysPerWeek: n } })}
                >
                  {n} days
                </button>
              ))}
            </div>
          </div>

          <div className="gl-streak-tracker">
            <span className="gl-streak-title">The last 7 days</span>
            <div className="gl-dot-row">
              {week.days.map((d) => (
                <div key={d.day} className="gl-dot-col">
                  <span
                    className={`gl-dot ${d.done ? 'is-done' : ''} ${d.day === today ? 'is-today' : ''}`}
                    title={`${new Date(`${d.day}T12:00`).toLocaleDateString(undefined, { weekday: 'long' })}: ${d.done ? 'Done' : 'Pending'}`}
                  >
                    {d.done ? '✓' : new Date(`${d.day}T12:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
                  </span>
                  <span className="gl-dot-day">{new Date(`${d.day}T12:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                </div>
              ))}
            </div>
            <div className="gl-streak-stat">
              <strong>{week.count} of {week.target}</strong> days done this week
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function QuickRechargeCard({ plan, onGoToolkit }) {
  const topRecharge = plan.recharge[0];
  const item = RECHARGE.find((r) => r.id === topRecharge);

  return (
    <section className="gl-card gl-recharge-compact">
      <div className="gl-card-header">
        <div className="gl-card-title-group">
          <span className="gl-icon-bubble gl-bubble-cyan">
            <BatteryCharging size={18} aria-hidden="true" />
          </span>
          <div>
            <h2>My break</h2>
            <p className="gl-subtitle">What you do when you need a rest</p>
          </div>
        </div>
      </div>
      {item ? (
        <div className="gl-recharge-pill-active">
          <span>My break: <strong>{item.label}</strong></span>
          <button type="button" className="gl-link-action" onClick={onGoToolkit}>
            Change it →
          </button>
        </div>
      ) : (
        <div className="gl-recharge-empty">
          <span>You haven’t picked a break yet.</span>
          <button type="button" className="gl-link-action" onClick={onGoToolkit}>
            Choose one →
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------------- MY GOALS ---------------- */

function BigGoalsSection({ plan, update }) {
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(null);
  const full = plan.goals.length >= LIMITS.goals;
  const showFlow = !full && (adding || plan.goals.length === 0);

  const patchGoal = (id, fn) =>
    update((p) => touch(p, { goals: p.goals.map((g) => (g.id === id ? fn(g) : g)) }));

  const removeGoal = (id) =>
    update((p) => touch(p, { goals: p.goals.filter((g) => g.id !== id) }));

  return (
    <div className="gl-quests-layout" id="gl-goals">
      {saved && !showFlow && (
        <div className="gl-celebration-banner gl-flow-saved" role="status">
          <Check size={20} aria-hidden="true" />
          <div>
            <strong>Goal saved. Your first step: {saved}</strong>
            <p><a href={hrefFor.dashboard()}>Go to My Quests <ArrowRight size={14} aria-hidden="true" /></a></p>
          </div>
        </div>
      )}

      {showFlow ? (
        <GoalFlow
          supportsFirst={plan.supports}
          onCancel={plan.goals.length ? () => setAdding(false) : null}
          onAdd={(g) => {
            update((p) => touch(p, { goals: [...p.goals, g] }));
            setSaved(g.steps[0].text);
            setAdding(false);
          }}
        />
      ) : !full && (
        <div className="gl-quests-top">
          <button type="button" className="gh-btn gh-btn-accent" onClick={() => { setSaved(null); setAdding(true); }}>
            <Plus size={16} aria-hidden="true" />
            <span>Set a new goal</span>
          </button>
        </div>
      )}

      {plan.goals.length > 0 && (
        <div className="gl-quest-cards-grid">
          {plan.goals.map((g) => (
            <QuestCard
              key={g.id}
              goal={g}
              patch={(fn) => patchGoal(g.id, fn)}
              remove={() => removeGoal(g.id)}
            />
          ))}
        </div>
      )}

      {full && (
        <p className="gl-capacity-note">
          Three goals at a time is plenty. Finish or remove one to add another.
        </p>
      )}
    </div>
  );
}

function QuestCard({ goal, patch, remove }) {
  const [newStepText, setNewStepText] = useState('');
  const [confirming, setConfirming] = useState(false);
  const doneCount = goal.steps.filter((s) => s.done).length;
  const isGoalFinished = goal.done;

  function addStep(e) {
    e.preventDefault();
    if (!newStepText.trim()) return;
    patch((g) => ({
      ...g,
      steps: [...g.steps, { id: newId('s'), text: newStepText.trim().slice(0, LIMITS.text), done: false }].slice(0, LIMITS.steps)
    }));
    setNewStepText('');
  }

  return (
    <article className={`gl-card gl-quest-card ${isGoalFinished ? 'is-completed-quest' : ''}`}>
      <div className="gl-quest-card-head">
        <div className="gl-quest-title-area">
          <span className={`gl-quest-badge ${isGoalFinished ? 'is-done' : ''}`}>
            {isGoalFinished ? <Check size={14} aria-hidden="true" /> : <Flag size={14} aria-hidden="true" />}
            <span>{isGoalFinished ? 'Done' : 'My goal'}</span>
          </span>
          <h3 className="gl-quest-sentence">{goalSentence(goal)}</h3>
        </div>
      </div>

      {/* Steps checklist */}
      <div className="gl-quest-steps-wrapper">
        <div className="gl-steps-header">
          <span className="gl-steps-count">
            <strong>{doneCount} of {goal.steps.length}</strong> steps done
          </span>
        </div>

        <ul className="gl-quest-step-list">
          {goal.steps.map((s) => (
            <li key={s.id} className="gl-step-row">
              <button
                type="button"
                className={`gl-step-check ${s.done ? 'is-done' : ''}`}
                aria-pressed={s.done}
                onClick={() => patch((g) => ({
                  ...g,
                  steps: g.steps.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x))
                }))}
              >
                {s.done ? <CheckCircle2 size={18} className="gl-check-icon" /> : <Circle size={18} />}
                <span className="gl-step-text">{s.text}</span>
              </button>
              <button
                type="button"
                className="gl-icon-btn gl-step-delete"
                aria-label={`Remove step: ${s.text}`}
                onClick={() => patch((g) => ({ ...g, steps: g.steps.filter((x) => x.id !== s.id) }))}
              >
                <Trash size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        {!isGoalFinished && goal.steps.length < LIMITS.steps && (
          <form className="gl-step-form" onSubmit={addStep}>
            <input
              className="gh-input gl-step-input"
              value={newStepText}
              maxLength={LIMITS.text}
              onChange={(e) => setNewStepText(e.target.value)}
              placeholder="Add the next small step…"
              aria-label={`Add step to ${goal.explore}`}
            />
            <button type="submit" className="gh-btn gh-btn-sm" disabled={!newStepText.trim()}>
              <Plus size={14} aria-hidden="true" />
              <span>Add</span>
            </button>
          </form>
        )}
      </div>

      {/* Quest Actions */}
      <div className="gl-quest-footer">
        <button
          type="button"
          className={`gh-btn gh-btn-sm ${isGoalFinished ? 'gh-btn-ghost' : 'gh-btn-accent'}`}
          onClick={() => patch((g) => ({ ...g, done: !g.done }))}
        >
          {isGoalFinished ? (
            <>
              <RotateCcw size={14} aria-hidden="true" />
              <span>Reopen this goal</span>
            </>
          ) : (
            <>
              <Check size={14} aria-hidden="true" />
              <span>I’ve finished this goal</span>
            </>
          )}
        </button>

        {confirming ? (
          <div className="gl-confirm-strip">
            <span>Remove this goal?</span>
            <button type="button" className="gh-btn gh-btn-sm gh-btn-danger" onClick={remove}>
              Remove
            </button>
            <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={() => setConfirming(false)}>
              Keep
            </button>
          </div>
        ) : (
          <button type="button" className="gl-delete-ghost" onClick={() => setConfirming(true)} aria-label="Remove goal">
            <Trash size={14} aria-hidden="true" />
            <span>Remove</span>
          </button>
        )}
      </div>
    </article>
  );
}

/* ---------------- WHAT HELPS ME ---------------- */

function ToolkitSection({ plan, set, toggleIn }) {
  const [copiedPhrase, setCopiedPhrase] = useState(null);

  const copyPhrase = (text, id) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedPhrase(id);
      setTimeout(() => setCopiedPhrase(null), 2000);
    } catch {
      /* clipboard write denied in some contexts */
    }
  };

  return (
    <div className="gl-toolkit-grid">
      {/* 1. Strengths */}
      <section className="gl-card gl-toolkit-card" id="gl-strengths">
        <div className="gl-card-header">
          <div className="gl-card-title-group">
            <span className="gl-icon-bubble gl-bubble-purple">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>What I’m good at</h2>
              <p className="gl-subtitle">What do you enjoy or find easy?</p>
            </div>
          </div>
          <span className="gl-counter-chip">{plan.strengths.length} picked</span>
        </div>

        <div className="gl-chip-group" role="group" aria-label="Strengths">
          {STRENGTHS.map((it) => {
            const on = plan.strengths.includes(it.id);
            return (
              <button
                key={it.id}
                type="button"
                className={`gl-pill ${on ? 'is-selected' : ''}`}
                aria-pressed={on}
                onClick={() => toggleIn('strengths', it.id)}
              >
                {it.label}
              </button>
            );
          })}
        </div>

        <div className="gl-own-field">
          <label htmlFor="own-strength">Have another superpower?</label>
          <input
            id="own-strength"
            className="gh-input"
            value={plan.strengthsOwn || ''}
            maxLength={LIMITS.own}
            onChange={(e) => set({ strengthsOwn: e.target.value })}
            placeholder="e.g. 3D modeling, trivia, storytelling"
          />
        </div>
      </section>

      {/* 2. Supports */}
      <section className="gl-card gl-toolkit-card" id="gl-supports">
        <div className="gl-card-header">
          <div className="gl-card-title-group">
            <span className="gl-icon-bubble gl-bubble-lime">
              <Heart size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>What helps me learn</h2>
              <p className="gl-subtitle">The tools and setup that make learning easier for you</p>
            </div>
          </div>
          <span className="gl-counter-chip">{plan.supports.length} picked</span>
        </div>

        <div className="gl-chip-group" role="group" aria-label="Supports">
          {SUPPORTS.map((it) => {
            const on = plan.supports.includes(it.id);
            return (
              <button
                key={it.id}
                type="button"
                className={`gl-pill ${on ? 'is-selected' : ''}`}
                aria-pressed={on}
                onClick={() => toggleIn('supports', it.id)}
              >
                {it.label}
              </button>
            );
          })}
        </div>

        <div className="gl-own-field">
          <label htmlFor="own-support">Anything else that helps you thrive?</label>
          <input
            id="own-support"
            className="gh-input"
            value={plan.supportsOwn || ''}
            maxLength={LIMITS.own}
            onChange={(e) => set({ supportsOwn: e.target.value })}
            placeholder="e.g. sitting near a window, dark mode screen"
          />
        </div>
      </section>

      {/* 3. Phrases */}
      <section className="gl-card gl-toolkit-card" id="gl-phrases">
        <div className="gl-card-header">
          <div className="gl-card-title-group">
            <span className="gl-icon-bubble gl-bubble-blue">
              <MessageCircle size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>Things I can say</h2>
              <p className="gl-subtitle">Words you can use when you need something</p>
            </div>
          </div>
        </div>

        <ul className="gl-phrase-cards">
          {PHRASES.map((p) => {
            const active = plan.phrases.includes(p.id);
            const isCopied = copiedPhrase === p.id;
            return (
              <li key={p.id}>
                <div className={`gl-phrase-card ${active ? 'is-selected' : ''}`}>
                  <button
                    type="button"
                    className="gl-phrase-toggle"
                    aria-pressed={active}
                    onClick={() => toggleIn('phrases', p.id)}
                  >
                    <span className="gl-phrase-quote">“{p.text}”</span>
                  </button>
                  <button
                    type="button"
                    className="gl-phrase-copy-btn"
                    onClick={() => copyPhrase(p.text, p.id)}
                    title="Copy phrase to clipboard"
                  >
                    {isCopied ? <Check size={14} className="gl-copied-icon" /> : <Copy size={14} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="gl-own-field">
          <label htmlFor="own-phrase">My own go-to phrase</label>
          <input
            id="own-phrase"
            className="gh-input"
            value={plan.phraseOwn || ''}
            maxLength={LIMITS.own}
            onChange={(e) => set({ phraseOwn: e.target.value })}
            placeholder="Write a sentence you feel comfortable using in class"
          />
        </div>
      </section>

      {/* 4. Vibe Reset (Recharge Plan) */}
      <section className="gl-card gl-toolkit-card" id="gl-recharge">
        <div className="gl-card-header">
          <div className="gl-card-title-group">
            <span className="gl-icon-bubble gl-bubble-cyan">
              <BatteryCharging size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>What I do for a break</h2>
              <p className="gl-subtitle">What helps you feel better after a hard day?</p>
            </div>
          </div>
          <span className="gl-counter-chip">{plan.recharge.length} picked</span>
        </div>

        <div className="gl-chip-group" role="group" aria-label="Recharge activities">
          {RECHARGE.map((it) => {
            const on = plan.recharge.includes(it.id);
            return (
              <button
                key={it.id}
                type="button"
                className={`gl-pill ${on ? 'is-selected' : ''}`}
                aria-pressed={on}
                onClick={() => toggleIn('recharge', it.id)}
              >
                {it.label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
