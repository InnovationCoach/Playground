import { useRef, useState } from 'react';
import {
  Target, Sparkles, CircleCheck, Circle, Plus, Trash, Flag, Zap, Heart, MessageCircle, BatteryCharging,
  Cloud, CloudOff, Eye, Trophy, RotateCcw, Flame, Rocket, Check, ChevronRight
} from 'lucide-react';
import {
  STRENGTHS, SUPPORTS, FOCUS_SKILLS, PHRASES, RECHARGE, LIMITS, XP,
  touch, newId, goalSentence, todayItems, checkedToday, toggleToday, habitWeek, dayKey,
  planLevel, streak, questStations
} from './goalPlan.js';
import { useGoalPlan } from './useGoalPlan.js';
import { GoalQuest, SHOW_EMOJI } from './GoalQuest.jsx';
import { confetti, confettiFrom, buzz } from './celebrate.js';
import '../admin/admin.css';
import './goals.css';

/**
 * Full-page goal setting (#/goals), replacing the pop-up wizard for secondary
 * learners. Strength-based: see goalPlan.js for the model and why it never
 * asks for a diagnosis.
 *
 * The banner turns the page into a short quest (four stations, XP from real
 * progress, a streak) so a first-time learner can see what to do next; new
 * goals are built a question at a time in GoalQuest.
 */
export function GoalsPage({ uid, displayName }) {
  const { plan, update, syncState, loaded } = useGoalPlan(uid);
  const [questOpen, setQuestOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const firstName = String(displayName || '').split(' ')[0];
  const set = (patch) => update((p) => touch(p, patch));
  const toggleIn = (key, id) => update((p) => touch(p, { [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id] }));
  const cheer = (text) => {
    clearTimeout(toastTimer.current);
    setToast({ text, at: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };
  const canAdd = plan.goals.length < LIMITS.goals;
  const startQuest = () => { if (canAdd) setQuestOpen(true); else scrollTo('gl-goals'); };

  function launch(goal) {
    update((p) => touch(p, { goals: [...p.goals, goal] }));
    setQuestOpen(false);
    confetti({ big: true });
    buzz([20, 40, 20]);
    cheer(`Goal launched! +${XP.goal} XP`);
  }

  return (
    <div className="gh-page gl-page">
      <QuestHero plan={plan} firstName={firstName} syncState={syncState} loaded={loaded}
                 onStation={(id) => (id === 'goal' ? startQuest() : scrollTo(`gl-${id}`))}
                 onStart={startQuest} canAdd={canAdd} />

      <p className="gl-visible"><Eye size={15} aria-hidden="true" />Your coach can see this page, so they know what helps you. You never need to name a diagnosis here.</p>

      <div className="gl-grid">
        <div className="gl-col">
          <TodayCard plan={plan} update={update} cheer={cheer} />
          <BigGoals plan={plan} update={update} onStart={startQuest} cheer={cheer} />
          <FocusSkill plan={plan} set={set} />
        </div>
        <div className="gl-col">
          <ChipCard id="gl-strengths" icon={Sparkles} title="My strengths" hint="What are you good at, or love doing? Your goal ideas start here."
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

      <GoalQuest open={questOpen} onClose={() => setQuestOpen(false)} onLaunch={launch}
                 strengths={plan.strengths} supportsFirst={plan.supports} />
      <div className="gl-toast-host" aria-live="polite">{toast && <span className="gl-toast" key={toast.at}>{toast.text}</span>}</div>
    </div>
  );
}

function scrollTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.classList.remove('gl-flash');
  void el.offsetWidth; // restart the highlight animation
  el.classList.add('gl-flash');
}

function SyncBadge({ state }) {
  if (state === 'local-only') return <span className="gl-sync gl-sync-warn"><CloudOff size={14} aria-hidden="true" />Saved on this device only</span>;
  if (state === 'saving') return <span className="gl-sync"><Cloud size={14} aria-hidden="true" />Saving…</span>;
  if (state === 'saved') return <span className="gl-sync gl-sync-ok"><Cloud size={14} aria-hidden="true" />Saved</span>;
  return null;
}

const STATION_ICON = { strengths: Sparkles, goal: Flag, focus: Zap, today: CircleCheck };
const STATION_HELP = {
  strengths: 'Tap what you are good at',
  goal: 'Answer 5 quick questions',
  focus: 'One small daily habit',
  today: 'Tick steps, earn XP'
};

function QuestHero({ plan, firstName, syncState, loaded, onStation, onStart, canAdd }) {
  const { stations, next } = questStations(plan);
  const lvl = planLevel(plan);
  const days = streak(plan);
  const C = 2 * Math.PI * 34;
  return (
    // A <section>, not <header>: index.html still styles every bare `header` for the legacy app.
    <section className="gl-hero" aria-labelledby="gl-hero-title">
      <div className="gl-hero-top">
        <div className="gl-hero-text">
          <span className="gl-kicker"><Target size={15} aria-hidden="true" />My goals</span>
          <h1 id="gl-hero-title">{firstName ? `${firstName}, build on what you are great at` : 'Build on what you are great at'}</h1>
          <p>Set a goal in five quick questions, then tick off one tiny step a day. Every step earns XP.</p>
          <div className="gl-hero-actions">
            {canAdd && (
              <button type="button" className="gh-btn gh-btn-primary gl-hero-cta" onClick={onStart}>
                <Rocket size={17} aria-hidden="true" />{plan.goals.length ? 'Start a new goal' : 'Start my first goal'}
              </button>
            )}
            <SyncBadge state={syncState} />
          </div>
        </div>
        <div className="gl-hero-stats">
          <div className="gl-level" role="img" aria-label={`Level ${lvl.level}, ${lvl.title}. ${lvl.into} of ${lvl.perLevel} XP to the next level.`}>
            <svg viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r="34" className="gl-level-track" />
              <circle cx="40" cy="40" r="34" className="gl-level-fill"
                      strokeDasharray={C} strokeDashoffset={C * (1 - lvl.into / lvl.perLevel)} />
            </svg>
            <span className="gl-level-n"><small>Level</small>{lvl.level}</span>
          </div>
          <div className="gl-hero-meta">
            <strong>{lvl.title}</strong>
            <span>{lvl.xp} XP · {lvl.perLevel - lvl.into} to next level</span>
            <span className={days ? 'gl-streak on' : 'gl-streak'}><Flame size={15} aria-hidden="true" />
              {days ? `${days}-day streak` : 'Tick one thing today to start a streak'}</span>
          </div>
        </div>
      </div>

      <ol className="gl-map" aria-label="How goal setting works">
        {stations.map((s, i) => {
          const Icon = STATION_ICON[s.id];
          const isNext = loaded && s.id === next;
          return (
            <li key={s.id}>
              <button type="button" className={`gl-station${s.done ? ' done' : ''}${isNext ? ' next' : ''}`} onClick={() => onStation(s.id)}
                      aria-label={`Step ${i + 1}: ${s.title}. ${s.done ? 'Done.' : isNext ? 'Do this next.' : ''}`}>
                <span className="gl-station-dot">{s.done ? <Check size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}</span>
                <span className="gl-station-text">
                  <strong>{i + 1}. {s.title}</strong>
                  <span>{isNext ? 'Start here' : STATION_HELP[s.id]}</span>
                </span>
                <ChevronRight size={16} className="gl-station-go" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
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

function TodayCard({ plan, update, cheer }) {
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
                  <button type="button" className="gl-check" aria-pressed={on} onClick={(e) => {
                    update((p) => toggleToday(p, it));
                    if (on) return;
                    buzz();
                    if (done + 1 === items.length) { confettiFrom(e.currentTarget, { big: true }); cheer('Everything done today!'); }
                    else { confettiFrom(e.currentTarget); if (it.kind === 'step') cheer(`Step done! +${XP.step} XP`); }
                  }}>
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
        <p className="gl-empty">Nothing to tick yet. Your list fills itself in from your goal steps, your tiny habit and your recharge plan. Start with the quest map above.</p>
      )}
    </Card>
  );
}

/* ---------------- Big goals ---------------- */

function BigGoals({ plan, update, onStart, cheer }) {
  const full = plan.goals.length >= LIMITS.goals;
  const patchGoal = (id, fn) => update((p) => touch(p, { goals: p.goals.map((g) => (g.id === id ? fn(g) : g)) }));
  const removeGoal = (id) => update((p) => touch(p, { goals: p.goals.filter((g) => g.id !== id) }));
  return (
    <Card id="gl-goals" icon={Flag} title="My big goals"
          hint="Something you want to explore, how you will show it, and the tiny steps to get there."
          action={plan.goals.length > 0 && !full && (
            <button type="button" className="gh-btn gh-btn-sm" onClick={onStart}><Plus size={15} aria-hidden="true" />New goal</button>
          )}>
      {plan.goals.map((g) => <GoalItem key={g.id} goal={g} cheer={cheer} patch={(fn) => patchGoal(g.id, fn)} remove={() => removeGoal(g.id)} />)}
      {plan.goals.length === 0 && (
        <button type="button" className="gl-empty-quest" onClick={onStart}>
          <span className="gl-empty-quest-emoji" aria-hidden="true">🚀</span>
          <strong>Start your first goal quest</strong>
          <span>Five quick questions. No long forms, and you can change anything later.</span>
        </button>
      )}
      {full && <p className="gl-note">Three big goals at a time keeps things manageable. Finish or remove one to add another.</p>}
    </Card>
  );
}

function GoalItem({ goal, patch, remove, cheer }) {
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
      <div className="gl-goal-head">
        <span className="gl-goal-emoji" aria-hidden="true">{goal.done ? '🏆' : SHOW_EMOJI[goal.showHow] || '🌟'}</span>
        <p className="gl-goal-sentence">{goalSentence(goal)}</p>
      </div>
      {goal.steps.length > 0 && (
        <>
          <span className="gl-goal-meta">{done} of {goal.steps.length} steps done</span>
          <span className="gl-bar gl-bar-sm" aria-hidden="true"><i style={{ width: `${(done / goal.steps.length) * 100}%` }} /></span>
          <ul className="gl-steps">
            {goal.steps.map((s) => (
              <li key={s.id}>
                <button type="button" className="gl-check gl-check-sm" aria-pressed={s.done}
                        onClick={(e) => {
                          patch((g) => ({ ...g, steps: g.steps.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) }));
                          if (!s.done) { buzz(); confettiFrom(e.currentTarget); cheer(done + 1 === goal.steps.length ? 'All steps done! Ready to press "I did it"?' : `Step done! +${XP.step} XP`); }
                        }}>
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
        <button type="button" className={goal.done ? 'gh-btn gh-btn-sm' : 'gh-btn gh-btn-sm gh-btn-primary'} onClick={(e) => {
          patch((g) => ({ ...g, done: !g.done }));
          if (!goal.done) { buzz([20, 40, 20]); confettiFrom(e.currentTarget, { big: true }); cheer(`Goal achieved! +${XP.achieved} XP`); }
        }}>
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
