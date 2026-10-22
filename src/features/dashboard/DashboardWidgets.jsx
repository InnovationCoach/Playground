import { ArrowRight, Award, CircleCheck, Circle, Flame, Frown, Lock, Meh, Smile, Target, Zap, Sparkles } from 'lucide-react';
import { PHASES } from '../pbl/content/pblModel.js';
import { phaseProgress } from '../pbl/engine/pblProject.js';
import { parseActivityLabel } from '../shell/activityIcons.jsx';
import { MOODS, matchActivities, reflectionPrompt } from './dashboardModel.js';

/**
 * The bodies of the My Dashboard widgets. Each one is given only what it shows
 * and the callbacks it needs, so none of them reads storage itself.
 */

const MOOD_ICONS = { energised: Zap, steady: Smile, unsure: Meh, stuck: Frown };

export function Meter({ label, percent, detail }) {
  return (
    <div className="md-meter-row">
      <div className="md-meter-head">
        <span>{label}</span>
        <span className="md-meter-value">{detail ?? `${percent}%`}</span>
      </div>
      <div className="md-meter" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function ProgressWidget({ academic, pbl, onOpenProject }) {
  return (
    <div className="md-progress">
      <div className="md-progress-block">
        <h3 className="md-sub">Academic study</h3>
        <Meter label="STEAM activities started" percent={academic.percent} detail={`${academic.done} of ${academic.total}`} />
        <p className="md-muted md-small">Edmentum courses will add to this bar once your school connects them.</p>
        <ul className="md-check-list">
          {academic.items.map((item) => (
            <li key={item.id} data-done={item.started || undefined}>
              {item.started ? <CircleCheck size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="md-progress-block">
        <h3 className="md-sub">PBL work</h3>
        <Meter label="Overall PBL progress" percent={pbl.overall} />
        <Meter
          label="Goal steps done"
          percent={pbl.goals ? pbl.goals.percent : 0}
          detail={pbl.goals ? `${pbl.goals.done} of ${pbl.goals.total}` : 'Set a goal to track'}
        />
        {pbl.habit && <Meter label="Daily habit this week" percent={pbl.habit.percent} detail={`${pbl.habit.done} of ${pbl.habit.total} days`} />}
        <Meter label="STEAM activities explored" percent={pbl.activities.percent} detail={`${pbl.activities.done} of ${pbl.activities.total}`} />
        <Meter label="Design Thinking tasks" percent={pbl.tasks.percent} detail={`${pbl.tasks.done} of ${pbl.tasks.total}`} />
        <Meter label="Showcase readiness" percent={pbl.readiness.percent} detail={`${pbl.readiness.done} of ${pbl.readiness.total}`} />
        <button type="button" className="md-link" onClick={onOpenProject}>
          Open my project <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function NextStepWidget({ next, onAction }) {
  return (
    <div className="md-next">
      <h3 className="md-next-title">{next.title}</h3>
      <p className="md-muted">{next.body}</p>
      <button type="button" className="md-btn md-btn-primary" onClick={() => onAction(next.target)}>
        {next.cta} <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function JourneyWidget({ project, onOpenProject }) {
  return (
    <div>
      <ol className="md-journey" aria-label="Design Thinking phases">
        {PHASES.map((phase) => {
          const p = phaseProgress(project, phase.id);
          const state = p.complete ? 'done' : phase.id === project.currentPhase ? 'current' : 'upcoming';
          return (
            <li key={phase.id} className="md-journey-step" data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="md-journey-dot">{state === 'done' ? <CircleCheck size={16} aria-hidden="true" /> : null}</span>
              <span className="md-journey-label">{phase.title}</span>
              <span className="md-journey-count">{p.tasksDone}/{p.tasksTotal} tasks</span>
            </li>
          );
        })}
      </ol>
      <button type="button" className="md-link" onClick={onOpenProject}>
        Continue my project <ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

export function GoalsWidget({ goals, onOpenGoals }) {
  if (!goals) {
    return (
      <div>
        <p className="md-muted">No goals yet. Start from something you want to explore, then add a few small steps.</p>
        <button type="button" className="md-btn" onClick={onOpenGoals}><Target size={16} aria-hidden="true" /> Set a goal</button>
      </div>
    );
  }
  return (
    <div>
      {goals.items.length > 0 ? (
        <ul className="md-goal-list">
          {goals.items.map((g) => (
            <li key={g.id} data-done={g.done || undefined}>
              <div className="md-goal-head">
                {g.done ? <CircleCheck size={16} aria-hidden="true" /> : <Target size={16} aria-hidden="true" />}
                <span>{g.text}</span>
              </div>
              {g.stepsTotal > 0 && (
                <Meter label="Steps" percent={g.done ? 100 : Math.round((100 * g.stepsDone) / g.stepsTotal)}
                       detail={g.done ? 'Done' : `${g.stepsDone} of ${g.stepsTotal}`} />
              )}
            </li>
          ))}
        </ul>
      ) : <p className="md-muted">No big goal yet, just your focus skill.</p>}
      {goals.habit && (
        <div className="md-habit">
          <span className="md-kicker">Daily habit</span>
          <p>{goals.focusHabit}</p>
          <ol className="md-dots" aria-label={`Done on ${goals.habit.count} of the last 7 days, aiming for ${goals.habit.target}`}>
            {goals.habit.days.map((d) => <li key={d.day} data-on={d.done || undefined} title={d.day} />)}
          </ol>
          <span className="md-muted">{goals.habit.count} of {goals.habit.target} days this week</span>
        </div>
      )}
      <button type="button" className="md-link" onClick={onOpenGoals}>
        Open my goals <ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Today's checklist from Goal setting, tickable here. */
export function TodayWidget({ items, checked, onToggle, onOpenGoals }) {
  if (!items.length) {
    return (
      <div>
        <p className="md-muted">Your checklist builds itself from your daily habit, the next step of each big goal and your recharge break.</p>
        <button type="button" className="md-btn" onClick={onOpenGoals}><Target size={16} aria-hidden="true" /> Set it up</button>
      </div>
    );
  }
  const done = items.filter((i) => checked.has(i.id)).length;
  return (
    <div>
      <Meter label="Done today" percent={Math.round((100 * done) / items.length)} detail={`${done} of ${items.length}`} />
      <ul className="md-today">
        {items.map((it) => {
          const on = checked.has(it.id);
          return (
            <li key={it.id}>
              <button type="button" className="md-today-item" aria-pressed={on} onClick={() => onToggle(it)}>
                {on ? <CircleCheck size={18} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}
                <span>{it.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {done === items.length && <p className="md-tip">All done for today. Nice work.</p>}
    </div>
  );
}

/** One Future Skill per week, with a way to practise it. */
export function SkillWidget({ skill, onOpenSkills }) {
  return (
    <div className="md-skill">
      <span className="md-skill-icon"><Sparkles size={18} aria-hidden="true" /></span>
      <h3 className="md-next-title">{skill.name}</h3>
      <p className="md-tagline-sm">{skill.tagline}</p>
      <p className="md-muted">{skill.teens}</p>
      <button type="button" className="md-link" onClick={onOpenSkills}>
        About your Future Skills <ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

export function CheckinWidget({ today, mood, onMood, onOpenPortfolio }) {
  const chosen = MOODS.find((m) => m.id === mood);
  return (
    <div>
      <p className="md-sub">How does your project feel today?</p>
      <div className="md-moods" role="group" aria-label="How are you feeling about your project?">
        {MOODS.map((m) => {
          const Icon = MOOD_ICONS[m.id];
          return (
            <button key={m.id} type="button" className="md-mood" aria-pressed={mood === m.id} onClick={() => onMood(m.id)}>
              <Icon size={20} aria-hidden="true" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
      {chosen && <p className="md-tip">{chosen.tip}</p>}

      <div className="md-prompt">
        <span className="md-kicker">Today's reflection</span>
        <p>{reflectionPrompt(today)}</p>
        <button type="button" className="md-link" onClick={onOpenPortfolio}>
          Write it in my portfolio <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function PickedWidget({ interests, onOpenActivity, onOpenPanel }) {
  if (!interests.length) {
    return (
      <div>
        <p className="md-muted">Tell us what you enjoy and we will suggest activities to start with.</p>
        <button type="button" className="md-btn" onClick={onOpenPanel}>Choose interests</button>
      </div>
    );
  }
  const matches = matchActivities(interests).slice(0, 4);
  if (!matches.length) {
    return <p className="md-muted">Nothing matches those yet. Try adding another interest.</p>;
  }
  return (
    <ul className="md-picked">
      {matches.map((a) => {
        const { kicker, title } = parseActivityLabel(a.label);
        return (
          <li key={a.id}>
            <button type="button" className="md-picked-card" onClick={() => onOpenActivity(a.id)}>
              <span className="md-kicker">{kicker || 'STEAM activity'}</span>
              <strong>{title}</strong>
              <span className="md-muted">{a.description}</span>
              <span className="md-chips">
                {a.because.map((i) => <span key={i} className="md-chip">{i}</span>)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function BadgesWidget({ badges }) {
  const earned = badges.filter((b) => b.earned).length;
  return (
    <div>
      <p className="md-muted">{earned} of {badges.length} earned</p>
      <ul className="md-badges">
        {badges.map((b) => (
          <li key={b.id} className="md-badge" data-earned={b.earned || undefined}>
            <span className="md-badge-icon">{b.earned ? <Award size={20} aria-hidden="true" /> : <Lock size={18} aria-hidden="true" />}</span>
            <strong>{b.label}</strong>
            <span className="md-muted">{b.earned ? 'Earned' : b.hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReadinessWidget({ checks, evidence, onOpenPortfolio }) {
  const done = checks.filter((c) => c.ok).length;
  return (
    <div>
      <Meter label="Checks passed" percent={Math.round((100 * done) / checks.length)} detail={`${done} of ${checks.length}`} />
      <ul className="md-check-list">
        {checks.map((c) => (
          <li key={c.id} data-done={c.ok || undefined}>
            {c.ok ? <CircleCheck size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
            <span>{c.label}</span>
          </li>
        ))}
      </ul>
      <p className="md-muted">{evidence} evidence {evidence === 1 ? 'entry' : 'entries'} so far.</p>
      <button type="button" className="md-link" onClick={onOpenPortfolio}>
        Open my portfolio <ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Flame chip with the visit streak, shown in the hero. */
export function StreakChip({ days }) {
  return (
    <span className="md-chip md-chip-streak">
      <Flame size={15} aria-hidden="true" />
      {days > 0 ? `${days}-day streak` : 'Start a streak today'}
    </span>
  );
}
