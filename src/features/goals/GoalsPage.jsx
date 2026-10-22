import { useMemo, useState } from 'react';
import {
  Target, Sparkles, CircleCheck, Circle, Plus, Trash, Flag, Zap, Heart, MessageCircle, BatteryCharging,
  Cloud, CloudOff, Eye, Trophy, RotateCcw, Flame, Check, Copy, ArrowRight, ChevronRight, Compass,
  CheckCircle2, Sparkle
} from 'lucide-react';
import {
  STRENGTHS, SUPPORTS, SHOW_HOW, FOCUS_SKILLS, PHRASES, RECHARGE, LIMITS,
  touch, newId, hasPlan, goalSentence, todayItems, checkedToday, toggleToday, habitWeek, dayKey
} from './goalPlan.js';
import { useGoalPlan } from './useGoalPlan.js';
import '../admin/admin.css';
import './goals.css';

/**
 * Modern, teen-centric Goal Setting (#/goals).
 * High-momentum, strength-based executive flow:
 *   - ⚡ Daily Flow: Micro-habits, today checklist, streak tracker & celebration
 *   - 🎯 Active Quests: Goal roadmaps, bite-sized steps & milestone wins
 *   - 🚀 Superpower Toolkit: Strengths, classroom hacks, power phrases & recharge
 */
export function GoalsPage({ uid, displayName }) {
  const { plan, update, syncState, loaded } = useGoalPlan(uid);
  const [activeTab, setActiveTab] = useState('today');
  const firstName = String(displayName || '').split(' ')[0];

  const set = (patch) => update((p) => touch(p, patch));
  const toggleIn = (key, id) =>
    update((p) => touch(p, { [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id] }));

  // Quick counts for tab badges
  const todayList = useMemo(() => todayItems(plan), [plan]);
  const checkedSet = useMemo(() => checkedToday(plan), [plan]);
  const todayDone = todayList.filter((i) => checkedSet.has(i.id)).length;
  const activeGoalsCount = plan.goals.filter((g) => !g.done).length;
  const toolkitCount = plan.strengths.length + plan.supports.length + plan.recharge.length;

  const week = useMemo(() => habitWeek(plan), [plan]);

  return (
    <div className="gh-page gl-page gl-teen">
      {/* Hero Banner */}
      <header className="gl-hero">
        <div className="gl-hero-content">
          <div className="gl-hero-badges">
            <span className="gl-tag gl-tag-glow">
              <Zap size={14} aria-hidden="true" />
              <span>SPARK Momentum</span>
            </span>
            {week.count > 0 && (
              <span className="gl-tag gl-tag-streak" title={`${week.count} active days in the last 7 days`}>
                <Flame size={14} aria-hidden="true" />
                <span>{week.count} Day Streak</span>
              </span>
            )}
            <SyncBadge state={syncState} />
          </div>

          <h1 className="gl-hero-title">
            {firstName ? `Let's make moves, ${firstName}` : 'Build on what makes you unstoppable'}
          </h1>
          <p className="gl-hero-subtitle">
            Turn your curiosity into real-world quests. Small daily habits, your personal classroom hacks, and time to recharge.
          </p>

          <div className="gl-privacy-pill">
            <Eye size={14} aria-hidden="true" />
            <span>Shared with your coach so they know what helps you fly. Never any diagnosis or labels.</span>
          </div>
        </div>

        {/* Hero Quick Stat Ring / Card */}
        <div className="gl-hero-stats">
          <div className="gl-stat-card">
            <div className="gl-stat-num">{todayDone}/{todayList.length}</div>
            <div className="gl-stat-label">Today's Focus</div>
            <div className="gl-mini-progress">
              <div
                className="gl-mini-bar"
                style={{ width: `${todayList.length ? (todayDone / todayList.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="gl-stat-card">
            <div className="gl-stat-num">{activeGoalsCount}</div>
            <div className="gl-stat-label">Active Quests</div>
            <div className="gl-stat-sub">Max {LIMITS.goals}</div>
          </div>
        </div>
      </header>

      {/* Onboarding Assistant if brand new */}
      {loaded && !hasPlan(plan) && (
        <GettingStarted onSelectTab={setActiveTab} />
      )}

      {/* Segmented Navigation Bar */}
      <nav className="gl-tabs" role="tablist" aria-label="Goal views">
        <button
          type="button"
          role="tab"
          id="tab-today"
          aria-selected={activeTab === 'today'}
          aria-controls="panel-today"
          className={`gl-tab ${activeTab === 'today' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <span className="gl-tab-icon"><Zap size={16} aria-hidden="true" /></span>
          <span className="gl-tab-text">Today's Flow</span>
          {todayList.length > 0 && (
            <span className={`gl-tab-badge ${todayDone === todayList.length ? 'is-complete' : ''}`}>
              {todayDone}/{todayList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          id="tab-quests"
          aria-selected={activeTab === 'quests'}
          aria-controls="panel-quests"
          className={`gl-tab ${activeTab === 'quests' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('quests')}
        >
          <span className="gl-tab-icon"><Flag size={16} aria-hidden="true" /></span>
          <span className="gl-tab-text">My Quests</span>
          {plan.goals.length > 0 && (
            <span className="gl-tab-badge">{plan.goals.length}</span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          id="tab-toolkit"
          aria-selected={activeTab === 'toolkit'}
          aria-controls="panel-toolkit"
          className={`gl-tab ${activeTab === 'toolkit' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('toolkit')}
        >
          <span className="gl-tab-icon"><Sparkles size={16} aria-hidden="true" /></span>
          <span className="gl-tab-text">Superpower Toolkit</span>
          {toolkitCount > 0 && (
            <span className="gl-tab-badge">{toolkitCount}</span>
          )}
        </button>
      </nav>

      {/* Tab Panels */}
      <main className="gl-tab-content">
        {/* TAB 1: Today's Flow */}
        {activeTab === 'today' && (
          <div id="panel-today" role="tabpanel" aria-labelledby="tab-today" className="gl-pane gl-pane-today">
            <div className="gl-grid-two">
              {/* Daily Checklist */}
              <TodayCard
                plan={plan}
                update={update}
                onGoQuests={() => setActiveTab('quests')}
                onGoToolkit={() => setActiveTab('toolkit')}
              />

              {/* Habit Spotlight & Habit Week Tracker */}
              <div className="gl-side-col">
                <FocusSkillCard plan={plan} set={set} />
                <QuickRechargeCard plan={plan} update={update} onGoToolkit={() => setActiveTab('toolkit')} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Quests (Big Goals) */}
        {activeTab === 'quests' && (
          <div id="panel-quests" role="tabpanel" aria-labelledby="tab-quests" className="gl-pane gl-pane-quests">
            <BigGoalsSection plan={plan} update={update} onGoToolkit={() => setActiveTab('toolkit')} />
          </div>
        )}

        {/* TAB 3: Superpower Toolkit */}
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

function GettingStarted({ onSelectTab }) {
  return (
    <div className="gl-onboarding-card">
      <div className="gl-onboarding-icon">
        <Sparkle size={24} aria-hidden="true" />
      </div>
      <div className="gl-onboarding-info">
        <h3>Welcome to your Goals Command Center</h3>
        <p>Three quick steps to kickstart your personal learning momentum:</p>
      </div>
      <div className="gl-onboarding-steps">
        <button type="button" className="gl-step-btn" onClick={() => onSelectTab('toolkit')}>
          <span className="gl-step-num">1</span>
          <div>
            <strong>Pick your Superpowers</strong>
            <span>What you love doing & what helps you focus</span>
          </div>
          <ChevronRight size={16} aria-hidden="true" />
        </button>

        <button type="button" className="gl-step-btn" onClick={() => onSelectTab('quests')}>
          <span className="gl-step-num">2</span>
          <div>
            <strong>Launch one Big Quest</strong>
            <span>Pick a real project you want to explore</span>
          </div>
          <ChevronRight size={16} aria-hidden="true" />
        </button>

        <button type="button" className="gl-step-btn" onClick={() => onSelectTab('today')}>
          <span className="gl-step-num">3</span>
          <div>
            <strong>Choose a Micro-Habit</strong>
            <span>One tiny action to practice each day</span>
          </div>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
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
            <h2>Today's Checklist</h2>
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
          <div className="gl-progress-track" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={items.length}>
            <div className="gl-progress-fill" style={{ width: `${(done / items.length) * 100}%` }} />
          </div>

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
                        {it.kind === 'habit' ? '⚡ Focus Habit' : it.kind === 'recharge' ? '🔋 Recharge Break' : `🎯 Step for: ${it.goal}`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {isAllComplete && (
            <div className="gl-celebration-banner">
              <Trophy size={20} className="gl-trophy-pulse" aria-hidden="true" />
              <div>
                <strong>You crushed all goals for today!</strong>
                <p>Momentum saved. Take a breather or explore a passion project.</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="gl-empty-box">
          <Compass size={32} className="gl-empty-icon" aria-hidden="true" />
          <h3>Your daily queue is clear</h3>
          <p>Your checklist builds automatically from your focus habit, quest next steps, and recharge picks.</p>
          <div className="gl-empty-actions">
            <button type="button" className="gh-btn gh-btn-sm gh-btn-accent" onClick={onGoQuests}>
              <Plus size={14} aria-hidden="true" />Add a Quest
            </button>
            <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={onGoToolkit}>
              Set Daily Habit
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
            <h2>Daily Focus Habit</h2>
            <p className="gl-subtitle">One executive skill made tiny enough to repeat</p>
          </div>
        </div>
      </div>

      <div className="gl-chip-group" role="group" aria-label="Choose executive focus skill">
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
            <span className="gl-field-label">Current Micro-Habit</span>
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
              aria-label="Custom habit text"
              onChange={(e) => set({ focus: { ...focus, habit: e.target.value } })}
              placeholder="Or write your own custom habit"
            />
          </div>

          <div className="gl-field">
            <span className="gl-field-label">Target Days per Week</span>
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
            <span className="gl-streak-title">Past 7 Days</span>
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
              <strong>{week.count} of {week.target}</strong> completed this week
              {week.count >= week.target && <span className="gl-goal-hit">🎯 Target hit!</span>}
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
            <h2>Recharge Station</h2>
            <p className="gl-subtitle">Your brain break strategy</p>
          </div>
        </div>
      </div>
      {item ? (
        <div className="gl-recharge-pill-active">
          <span>Current break pick: <strong>{item.label}</strong></span>
          <button type="button" className="gl-link-action" onClick={onGoToolkit}>
            Change in toolkit →
          </button>
        </div>
      ) : (
        <div className="gl-recharge-empty">
          <span>No recharge activity picked yet.</span>
          <button type="button" className="gl-link-action" onClick={onGoToolkit}>
            Choose your vibe →
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------------- QUESTS (BIG GOALS) VIEW ---------------- */

function BigGoalsSection({ plan, update, onGoToolkit }) {
  const [adding, setAdding] = useState(plan.goals.length === 0);
  const full = plan.goals.length >= LIMITS.goals;

  const patchGoal = (id, fn) =>
    update((p) => touch(p, { goals: p.goals.map((g) => (g.id === id ? fn(g) : g)) }));

  const removeGoal = (id) =>
    update((p) => touch(p, { goals: p.goals.filter((g) => g.id !== id) }));

  return (
    <div className="gl-quests-layout" id="gl-goals">
      <div className="gl-quests-top">
        <div>
          <h2>Active Learning Quests</h2>
          <p className="gl-subtitle">
            Big goals you want to explore. Pick how you will show what you learned and what hacks keep you in flow.
          </p>
        </div>
        {!adding && !full && (
          <button type="button" className="gh-btn gh-btn-accent" onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden="true" />
            <span>New Quest</span>
          </button>
        )}
      </div>

      {adding && !full && (
        <NewQuestCard
          supportsFirst={plan.supports}
          onCancel={plan.goals.length ? () => setAdding(false) : null}
          onAdd={(g) => {
            update((p) => touch(p, { goals: [...p.goals, g] }));
            setAdding(false);
          }}
          onGoToolkit={onGoToolkit}
        />
      )}

      {plan.goals.length === 0 && !adding && (
        <div className="gl-empty-box gl-empty-large">
          <Flag size={36} className="gl-empty-icon" aria-hidden="true" />
          <h3>No Quests Yet</h3>
          <p>Pick a topic or curiosity you love, set a couple of bite-sized steps, and start building.</p>
          <button type="button" className="gh-btn gh-btn-accent" onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden="true" />
            <span>Launch Your First Quest</span>
          </button>
        </div>
      )}

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

      {full && (
        <p className="gl-capacity-note">
          ⚡ 3 active quests is the sweet spot to stay focused without burning out. Wrap up or retire one to add another.
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
            {isGoalFinished ? <Trophy size={14} aria-hidden="true" /> : <Flag size={14} aria-hidden="true" />}
            <span>{isGoalFinished ? 'Quest Completed' : 'Active Quest'}</span>
          </span>
          <h3 className="gl-quest-sentence">{goalSentence(goal)}</h3>
        </div>
      </div>

      {/* Steps checklist */}
      <div className="gl-quest-steps-wrapper">
        <div className="gl-steps-header">
          <span className="gl-steps-count">
            Steps Done: <strong>{doneCount} / {goal.steps.length}</strong>
          </span>
          {goal.steps.length > 0 && (
            <div className="gl-quest-mini-progress">
              <div
                className="gl-quest-bar-fill"
                style={{ width: `${(doneCount / goal.steps.length) * 100}%` }}
              />
            </div>
          )}
        </div>

        <ul className="gl-quest-step-list">
          {goal.steps.map((s) => (
            <li key={s.id} className="gl-step-row">
              <button
                type="button"
                className={`gl-step-check ${s.done ? 'is-done' : ''}`}
                aria-pressed={s.done}
                onClick={() =>
                  patch((g) => ({
                    ...g,
                    steps: g.steps.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x))
                  }))
                }
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
              placeholder="Add next small milestone step…"
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
              <span>Reopen Quest</span>
            </>
          ) : (
            <>
              <Trophy size={14} aria-hidden="true" />
              <span>Mission Accomplished</span>
            </>
          )}
        </button>

        {confirming ? (
          <div className="gl-confirm-strip">
            <span>Retire quest?</span>
            <button type="button" className="gh-btn gh-btn-sm gh-btn-danger" onClick={remove}>
              Delete
            </button>
            <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={() => setConfirming(false)}>
              Keep
            </button>
          </div>
        ) : (
          <button type="button" className="gl-delete-ghost" onClick={() => setConfirming(true)} aria-label="Delete quest">
            <Trash size={14} aria-hidden="true" />
            <span>Retire</span>
          </button>
        )}
      </div>
    </article>
  );
}

function NewQuestCard({ onAdd, onCancel, supportsFirst, onGoToolkit }) {
  const [explore, setExplore] = useState('');
  const [showHow, setShowHow] = useState(null);
  const [ownSupports, setSupports] = useState(null);
  const supports = ownSupports ?? supportsFirst.slice(0, 3);
  const [steps, setSteps] = useState(['', '']);

  const ordered = useMemo(
    () => [...SUPPORTS].sort((a, b) => supportsFirst.includes(b.id) - supportsFirst.includes(a.id)),
    [supportsFirst]
  );

  function submit(e) {
    e.preventDefault();
    if (!explore.trim()) return;
    onAdd({
      id: newId('g'),
      explore: explore.trim().slice(0, LIMITS.text),
      showHow,
      supports,
      done: false,
      createdAt: Date.now(),
      steps: steps
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, LIMITS.steps)
        .map((text) => ({ id: newId('s'), text, done: false }))
    });
  }

  const preview = explore.trim() ? goalSentence({ explore: explore.trim(), showHow, supports }) : null;

  return (
    <div className="gl-card gl-new-quest-modal">
      <div className="gl-card-header">
        <div className="gl-card-title-group">
          <span className="gl-icon-bubble gl-bubble-lime">
            <Plus size={18} aria-hidden="true" />
          </span>
          <div>
            <h3>Design a New Quest</h3>
            <p className="gl-subtitle">Turn what you love into an exciting project</p>
          </div>
        </div>
      </div>

      <form className="gl-quest-builder-form" onSubmit={submit}>
        {/* Step 1 */}
        <div className="gl-builder-step">
          <label className="gl-builder-label" htmlFor="quest-explore-input">
            <span className="gl-step-tag">1</span>
            <strong>What do you want to explore?</strong>
          </label>
          <input
            id="quest-explore-input"
            className="gh-input gl-main-input"
            value={explore}
            maxLength={LIMITS.text}
            onChange={(e) => setExplore(e.target.value)}
            placeholder="e.g. how autonomous cars navigate, how to build a game in Python, solar energy"
            required
            autoFocus
          />
        </div>

        {/* Step 2 */}
        <div className="gl-builder-step">
          <label className="gl-builder-label">
            <span className="gl-step-tag">2</span>
            <strong>How will you show what you build or learn?</strong>
          </label>
          <div className="gl-chip-group" role="group" aria-label="Show how options">
            {SHOW_HOW.map((it) => (
              <button
                key={it.id}
                type="button"
                className={`gl-pill ${showHow === it.id ? 'is-selected' : ''}`}
                aria-pressed={showHow === it.id}
                onClick={() => setShowHow((cur) => (cur === it.id ? null : it.id))}
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3 */}
        <div className="gl-builder-step">
          <div className="gl-builder-label">
            <span className="gl-step-tag">3</span>
            <div>
              <strong>What hacks or support will help you?</strong>
              <p className="gl-micro-hint">Choose up to 3 things that keep you in flow</p>
            </div>
          </div>
          <div className="gl-chip-group" role="group" aria-label="Supports options">
            {ordered.map((it) => {
              const selected = supports.includes(it.id);
              return (
                <button
                  key={it.id}
                  type="button"
                  className={`gl-pill ${selected ? 'is-selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() =>
                    setSupports(selected ? supports.filter((x) => x !== id) : [...supports, it.id])
                  }
                >
                  {it.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4 */}
        <div className="gl-builder-step">
          <label className="gl-builder-label">
            <span className="gl-step-tag">4</span>
            <div>
              <strong>First 2 small steps</strong>
              <p className="gl-micro-hint">Make them tiny so you can start right away</p>
            </div>
          </label>
          <div className="gl-mini-steps-inputs">
            {steps.map((s, i) => (
              <input
                key={i}
                className="gh-input"
                value={s}
                maxLength={LIMITS.text}
                aria-label={`Step ${i + 1}`}
                placeholder={i === 0 ? 'e.g. Watch one breakdown video' : 'e.g. Write 3 questions to explore'}
                onChange={(e) => setSteps((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))}
              />
            ))}
          </div>
        </div>

        {preview && (
          <div className="gl-quest-live-preview">
            <Sparkles size={16} aria-hidden="true" />
            <div>
              <span className="gl-preview-title">Quest Preview</span>
              <p>{preview}</p>
            </div>
          </div>
        )}

        <div className="gl-builder-actions">
          <button type="submit" className="gh-btn gh-btn-accent" disabled={!explore.trim()}>
            Launch Quest
          </button>
          {onCancel && (
            <button type="button" className="gh-btn gh-btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/* ---------------- TOOLKIT VIEW ---------------- */

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
      {/* 1. Superpowers (Strengths) */}
      <section className="gl-card gl-toolkit-card" id="gl-strengths">
        <div className="gl-card-header">
          <div className="gl-card-title-group">
            <span className="gl-icon-bubble gl-bubble-purple">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>My Superpowers</h2>
              <p className="gl-subtitle">What are you naturally good at or love doing?</p>
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

      {/* 2. Classroom Hacks (Supports) */}
      <section className="gl-card gl-toolkit-card" id="gl-supports">
        <div className="gl-card-header">
          <div className="gl-card-title-group">
            <span className="gl-icon-bubble gl-bubble-lime">
              <Heart size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>Classroom Hacks & Supports</h2>
              <p className="gl-subtitle">The tools and setup that make learning effortless for you</p>
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

      {/* 3. Power Phrases */}
      <section className="gl-card gl-toolkit-card" id="gl-phrases">
        <div className="gl-card-header">
          <div className="gl-card-title-group">
            <span className="gl-icon-bubble gl-bubble-blue">
              <MessageCircle size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>Self-Advocacy Phrases</h2>
              <p className="gl-subtitle">Say it with confidence when you need room to do your best work</p>
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
              <h2>Vibe Reset & Flow State</h2>
              <p className="gl-subtitle">What pulls you into deep flow when you need to recharge?</p>
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
