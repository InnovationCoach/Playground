import { useMemo } from 'react';
import { GraduationCap, Sparkles, CalendarRange, BookOpen, Rocket, Award, Target, AlertTriangle } from 'lucide-react';
import { dayKey } from './goalPlan.js';
import { academicLanes, roadmapWeeks } from './goalCoach.js';
import { MANUAL_SUBJECT_OPTIONS } from './adventumGoalIntegration.js';

const CAT_ICON = { academic: GraduationCap, pbl: Rocket, skills: Award, personal: Target };

function dueLabel(days) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
}

/**
 * Academic planner on the Academic tab: one lane per subject (from the
 * learner's record and their goals) and an 8-week roadmap of target dates.
 * Record progress is shown only when the academic record reports it.
 */
export function AcademicPlanner({ plan, academicContext, onPlanSubject, onOpenCoach, roadmapGoals = null }) {
  const today = dayKey();
  const lanes = useMemo(() => academicLanes(plan, academicContext, today), [plan, academicContext, today]);
  const goals = roadmapGoals || (plan.goals || []).filter((g) => (g.category || 'academic') === 'academic');
  const weeks = useMemo(() => roadmapWeeks(goals, today), [goals, today]);
  const anyDated = weeks.some((w) => w.items.length);
  const starters = MANUAL_SUBJECT_OPTIONS.filter((s) => !lanes.some((l) => l.subject === s)).slice(0, lanes.length ? 3 : 6);
  const grade = plan.academicProfile?.gradeLevel || academicContext?.gradeLevel || '';

  return (
    <section className="ap-wrap" aria-label="Academic planner">
      <div className="ap-head">
        <div>
          <span className="ap-kicker"><GraduationCap size={14} aria-hidden="true" /> Academic planner{grade ? ` · ${grade}` : ''}</span>
          <h2>Your subjects at a glance</h2>
          <p>Each subject shows your goals, steps done and what’s due next. Plan a new one with the coach in under a minute.</p>
        </div>
        <button type="button" className="ap-coach-btn" onClick={() => onOpenCoach?.()}>
          <Sparkles size={16} aria-hidden="true" /> Plan with AI coach
        </button>
      </div>

      <div className="ap-lanes">
        {lanes.map((lane) => (
          <article key={lane.subject} className="ap-lane">
            <div className="ap-lane-top">
              <span className="ap-lane-icon" aria-hidden="true"><BookOpen size={16} /></span>
              <h3>{lane.subject}</h3>
              {lane.provider && <span className="ap-src">{lane.provider}</span>}
            </div>
            <div className="ap-lane-stats">
              <span><strong>{lane.activeCount}</strong> active</span>
              <span><strong>{lane.doneCount}</strong> done</span>
              <span><strong>{lane.stepsDone}/{lane.stepsTotal}</strong> steps</span>
            </div>
            <div className="ap-bar" role="img" aria-label={`${lane.stepPct}% of steps done`}>
              <span style={{ width: `${lane.stepPct}%` }} />
            </div>
            {lane.recordPct !== null && (
              <p className="ap-record">Record: {lane.recordPct}% of units complete</p>
            )}
            {lane.recordPct === null && lane.recordGrade && <p className="ap-record">Record grade: {lane.recordGrade}</p>}
            <p className={`ap-next ${lane.next && lane.next.daysLeft < 0 ? 'is-late' : lane.next && lane.next.daysLeft <= 3 ? 'is-soon' : ''}`}>
              {lane.next ? <>Next: <strong>{lane.next.goal.explore}</strong> · {dueLabel(lane.next.daysLeft)}</> : lane.activeCount ? 'No target date yet' : 'No goal yet'}
            </p>
            <button type="button" className="ap-lane-btn" onClick={() => onPlanSubject?.(lane.subject === 'General academic' ? '' : lane.subject)}>
              <Sparkles size={14} aria-hidden="true" /> {lane.activeCount ? 'Add a goal' : 'Set a goal'}
            </button>
          </article>
        ))}
        <article className="ap-lane ap-lane-start">
          <h3>{lanes.length ? 'Another subject?' : 'Start with a subject'}</h3>
          <div className="ap-start-chips">
            {starters.map((s) => (
              <button key={s} type="button" className="ap-start-chip" onClick={() => onPlanSubject?.(s)}>{s}</button>
            ))}
          </div>
        </article>
      </div>

      <div className="ap-roadmap">
        <div className="ap-roadmap-head">
          <CalendarRange size={16} aria-hidden="true" />
          <h3>{roadmapGoals ? 'Goal roadmap' : 'Academic roadmap'}: the next 8 weeks</h3>
        </div>
        {anyDated ? (
          <div className="ap-weeks" role="list">
            {weeks.filter((w) => w.id !== 'overdue' || w.items.length).map((w) => (
              <div key={w.id} role="listitem" className={`ap-week ${w.id === 'overdue' ? 'is-overdue' : ''} ${w.items.length ? 'has-items' : ''}`}>
                <span className="ap-week-label">{w.id === 'overdue' && w.items.length ? <AlertTriangle size={12} aria-hidden="true" /> : null}{w.label}</span>
                <div className="ap-week-items">
                  {w.items.map(({ goal, days }) => {
                    const Icon = CAT_ICON[goal.category || 'academic'] || Target;
                    return (
                      <span key={goal.id} className={`ap-pin ap-pin-${goal.category || 'academic'}`} title={`${goal.explore} · ${dueLabel(days)}`}>
                        <Icon size={12} aria-hidden="true" />
                        <span>{goal.subject || goal.projectTitle || goal.explore}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="ap-roadmap-empty">Give a goal a target date and it shows up here, week by week.</p>
        )}
      </div>
    </section>
  );
}
