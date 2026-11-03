import { useEffect, useState } from 'react';
import {
  ArrowRight, FlaskConical, Rocket, Flag, Unplug, Zap, Brain, Flame,
  Trophy, Target, Users, MessageSquare, Lightbulb, Heart, Sparkles, Plus
} from 'lucide-react';
import { PHASES } from '../pbl/content/pblModel.js';
import { phaseProgress } from '../pbl/engine/pblProject.js';
import { hrefFor } from '../../app/routes.js';
import { TodayWidget } from './DashboardWidgets.jsx';
import { startHere, nextGoalStep, programJourney } from './learningGuidance.js';
import { splitGoals } from './slideModel.js';
import { loadDashboardCourses } from './dashboardCourses.js';
import { SessionGauge, UnavailableDial, StepMeter, Spark } from './Instruments.jsx';
import { phaseMilestones, phaseStages, goalSteps, gaugeReading } from './instrumentModel.js';
import { COMPETENCY_DOMAINS } from '../pbl/content/competencies.js';
import './learningHub.css';

/** One account-scoped read shared by the plan and progress slides. */
export function useLearningCourses(uid, classIds, activeProgramId) {
  const [data, setData] = useState({ state: 'loading', courses: [], warnings: [] });
  const [attempt, retry] = useState(0);
  const key = classIds.join('|');
  useEffect(() => {
    let cancelled = false;
    setData({ state: 'loading', courses: [], warnings: [] });
    if (!uid) {
      setData({ state: 'error', courses: [], warnings: ['Sign in to load your courses.'] });
      return;
    }
    loadDashboardCourses(uid, key ? key.split('|') : [], activeProgramId)
      .then((result) => { if (!cancelled) setData({ ...result, state: 'ready' }); })
      .catch(() => { if (!cancelled) setData({ state: 'error', courses: [], warnings: ['Your courses could not be loaded. Please try again.'] }); });
    return () => { cancelled = true; };
  }, [uid, key, activeProgramId, attempt]);
  return { ...data, retry: () => retry((n) => n + 1) };
}

const RECHECK = 'This course’s session numbers were corrected after you saved progress, so it can’t be counted yet. Open the project to re-check which sessions you’ve completed.';

function CourseStatus({ data }) {
  return <>
    {data.state === 'loading' && <p className="sd-notice" role="status">Loading your projects…</p>}
    {data.warnings.length > 0 && data.courses.length === 0 && <div className="sd-notice" role="alert">{data.warnings.join(' ')} <button className="sd-text-button" onClick={data.retry}>Try again</button></div>}
    {data.state === 'ready' && data.courses.length === 0 && <div className="sd-empty"><Rocket size={25} /><h4>Your next big idea starts here</h4><p>No current project could be found for your account. Find a program in My Courses or ask your coach.</p><a className="sd-link" href={hrefFor.courses()}>Find my project <ArrowRight size={16} /></a></div>}
  </>;
}

const EXAMPLES = [
  { id: 'biology', title: 'The living world', subject: 'Science', lesson: 'Notice an ecosystem', prompt: 'Name one living thing and one non-living thing outside. How might they depend on each other?' },
  { id: 'maths', title: 'Patterns everywhere', subject: 'Mathematics', lesson: 'Find a pattern', prompt: 'Find a repeating pattern around you. Sketch its next three steps and explain your rule.' }
];

function AcademicLearning() {
  const [examples, setExamples] = useState(false), [sample, setSample] = useState(null);
  return <div className="sd-academic">
    <div className="sd-empty ig-plate ig-plate-quiet">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <span className="ig-status-pill"><Unplug size={14} aria-hidden="true" /> Not connected</span>
        <span style={{ fontSize: '11px', color: 'var(--sp-sky-text)', fontWeight: 650 }}>Edmentum Academic Partner</span>
      </div>
      <h4>Academic courses</h4>
      <p>Connected academic courses will appear here when available. Edmentum tasks and progress aren’t connected to this dashboard yet.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <a className="sd-link" href={hrefFor.courses()}>Open My Courses <ArrowRight size={16} /></a>
      </div>
    </div>
    <div style={{ marginTop: 12 }}>
      <button type="button" className="sd-text-button" aria-expanded={examples} onClick={() => { setExamples(!examples); setSample(null); }}>
        {examples ? 'Hide example courses' : 'Show example courses'}
      </button>
    </div>
    {examples && <div className="sd-examples" style={{ marginTop: 12 }}>
      <p className="sd-caption">Examples only · no provider connection · no progress saved</p>
      {EXAMPLES.map((example) => (
        <div className="sd-example lh-example" key={example.id} style={{ padding: '16px 20px', borderRadius: 16, background: 'var(--gh-surface)', border: '1px solid var(--gh-border)', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span className="sd-eyebrow" style={{ color: 'var(--sp-sky-text)' }}>{example.subject} · sample quest</span>
            <span style={{ fontSize: '11px', background: 'var(--sp-sky-soft)', color: 'var(--sp-sky-text)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Mini-Challenge</span>
          </div>
          <h4 style={{ margin: '4px 0 8px', fontSize: '16px' }}>{example.title}</h4>
          <button type="button" className="sd-text-button" aria-expanded={sample === example.id} onClick={() => setSample(sample === example.id ? null : example.id)}>
            {sample === example.id ? 'Close sample lesson' : 'Preview sample lesson'} <ArrowRight size={15} />
          </button>
          {sample === example.id && <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--gh-subtle)', borderLeft: '3px solid var(--sp-sky-line)' }}>
            <strong style={{ display: 'block', marginBottom: 4, color: 'var(--gh-heading)' }}>{example.lesson}</strong>
            <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--gh-text-2)' }}>{example.prompt}</p>
            <small style={{ color: 'var(--gh-text-3)', fontSize: '11px' }}>Sample activity only. This does not change your learning record.</small>
          </div>}
        </div>
      ))}
    </div>}
  </div>;
}

export function DailyLearningSlide({ data, model, plan, project, firstName, onToggle, goalsLoaded, goalSync, onOpenActivity }) {
  const [period, setPeriod] = useState('today');
  const { active: activeGoals, completed: achievedGoals } = splitGoals(plan);
  const completedTasks = plan.goals.flatMap((goal) => goal.steps.filter((s) => s.done).map((step) => ({ ...step, goal: goal.explore })));
  const guidance = startHere({ data, today: model.today, checked: model.ticked, goalsLoaded, hasGoals: plan.goals.length > 0, termProject: project });
  const upcomingTasks = plan.goals.filter((g) => !g.done).flatMap((goal) => goal.steps.filter((s) => !s.done).map((step) => ({ ...step, goal: goal.explore })));

  const doneToday = model.today.filter((i) => model.ticked.has(i.id)).length;
  const totalToday = Math.max(model.today.length, 1);
  const momentumPercent = Math.round((doneToday / totalToday) * 100);

  return <>
    <p className="sd-intro">{firstName ? <><strong className="ig-greeting">Hi, {firstName}.</strong> </> : null}One useful next step. Then another. Start with what matters to you.</p>

    {/* Engaging Momentum Energy Tracker */}
    <div className="sd-momentum-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 18px', background: 'var(--gh-surface)', border: '1px solid var(--gh-border)', borderRadius: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'var(--sp-lime-fill)', color: 'var(--sp-lime-ink)', fontWeight: 800, fontSize: '11px', letterSpacing: '0.04em' }}>
          <Zap size={13} fill="currentColor" /> SPARK MOMENTUM
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'var(--sp-purple-soft)', color: 'var(--sp-purple-text)', fontWeight: 700, fontSize: '11px' }}>
          <Brain size={13} /> SYSTEMS ANALYST (LV. 3)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: '#ff9a4d22', color: '#ff9a4d', fontWeight: 700, fontSize: '11px' }}>
          <Flame size={13} fill="currentColor" /> 1 DAY STREAK
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200, flex: '1 1 auto', maxWidth: 360 }}>
        <div style={{ flex: 1, height: 8, background: 'var(--gh-subtle)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--gh-border)' }}>
          <div style={{ width: `${momentumPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand-lime), var(--sp-lime-line))', borderRadius: 999, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--sp-lime-text)', whiteSpace: 'nowrap' }}>
          {momentumPercent}% CHARGED
        </span>
      </div>
    </div>

    {/* Start here: next spark banner */}
    <section className="sd-start-here" aria-label="Start here" aria-live="polite">
      <span className="sd-start-icon" aria-hidden="true"><Spark size={24} /><b>NEXT</b></span>
      <div><span className="sd-eyebrow">Start here{guidance.source ? ` · ${guidance.source}` : ''}</span><h3>{guidance.title}</h3><p>{guidance.body}</p></div>
      {guidance.href && <a className="sd-primary" href={guidance.href}>{guidance.action}<ArrowRight size={16} /></a>}
    </section>

    {/* Timeframe switch tabs */}
    <div className="sd-plan-tabs lh-tabs" role="group" aria-label="Learning plan timeframe">
      {[['today', 'Today'], ['ahead', 'Ahead'], ['completed', 'Completed']].map(([id, label]) => (
        <button type="button" key={id} aria-pressed={period === id} onClick={() => setPeriod(id)}>
          {label}
        </button>
      ))}
    </div>

    {/* Primary Goals & Quests Section */}
    <section className="sd-personal-tasks" aria-labelledby="lh-plan-title">
      <div className="sd-section-line">
        <h3 id="lh-plan-title" className="ig-lane-title">
          {period === 'today' ? "Today's Quests & Focus" : period === 'ahead' ? 'Quests Ahead · Next Milestones' : 'Completed Quests & Achievements'}
        </h3>
        <a className="sd-link" href={hrefFor.goals()}>Manage in Goal Setting <ArrowRight size={15} /></a>
      </div>

      {!goalsLoaded ? (
        <p role="status">Loading your plan…</p>
      ) : period === 'today' ? (
        <div>
          <TodayWidget items={model.today} checked={model.ticked} onToggle={onToggle} onOpenGoals={() => { window.location.hash = hrefFor.goals(); }} />

          {/* Active goal cards on Today */}
          {activeGoals.map((goal) => {
            const doneCount = goal.steps.filter((s) => s.done).length;
            const allStepsDone = goal.steps.length > 0 && doneCount === goal.steps.length;
            return (
              <div key={goal.id} style={{ marginTop: 12, padding: '14px 18px', borderRadius: 14, background: 'var(--gh-surface)', border: '1px solid var(--gh-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <span className="sd-eyebrow" style={{ color: 'var(--sp-magenta-text)' }}>Active Quest Goal</span>
                  <h4 style={{ margin: '2px 0 4px', fontSize: '15px' }}>{goal.explore}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--gh-text-2)' }}>
                    {allStepsDone
                      ? `All ${goal.steps.length} task${goal.steps.length === 1 ? '' : 's'} done! You're ready for your next milestone.`
                      : goal.steps.length === 0
                      ? 'Goal active. Ready to set your first task checklist.'
                      : `${doneCount} of ${goal.steps.length} tasks finished.`}
                  </p>
                </div>
                <a className="sd-link" href={hrefFor.goals()} style={{ fontSize: '12px' }}>
                  {allStepsDone || goal.steps.length === 0 ? '+ Plan Next Step' : 'View Goal'} <ArrowRight size={14} />
                </a>
              </div>
            );
          })}
        </div>
      ) : period === 'ahead' ? (
        <div>
          <p className="sd-caption">Remaining tasks and active goals ahead. No fixed deadlines assumed.</p>
          {activeGoals.length > 0 ? (
            <div style={{ display: 'grid', gap: 12, marginTop: 10 }}>
              {activeGoals.map((goal) => {
                const doneCount = goal.steps.filter((s) => s.done).length;
                const pendingSteps = goal.steps.filter((s) => !s.done);
                return (
                  <article key={goal.id} style={{ padding: '16px 20px', borderRadius: 16, background: 'var(--gh-surface)', border: '1px solid var(--gh-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="sd-eyebrow" style={{ color: 'var(--sp-magenta-text)' }}>Active Goal</span>
                      <span style={{ fontSize: '11px', color: 'var(--gh-text-2)' }}>{doneCount} of {goal.steps.length} tasks done</span>
                    </div>
                    <h4 style={{ margin: '0 0 10px', fontSize: '16px' }}>{goal.explore}</h4>
                    <StepMeter states={goal.steps.map((s) => s.done)} label={`${doneCount} of ${goal.steps.length} tasks completed`} />
                    {pendingSteps.length > 0 ? (
                      <ul className="sd-task-list" style={{ marginTop: 12 }}>
                        {pendingSteps.map((step) => (
                          <li key={step.id}>
                            <span aria-hidden="true">○</span>
                            <div><strong>{step.text}</strong><small>{goal.explore}</small></div>
                            <a href={hrefFor.goals()} aria-label={`View task: ${step.text}`}>↗</a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="sd-caption" style={{ marginTop: 10 }}>All listed steps are finished! Set your next milestone in Goal Setting.</p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="sd-caption">No remaining tasks. Plan your next step in Goal Setting.</p>
          )}

          {upcomingTasks.length > 0 && !activeGoals.length && (
            <ul className="sd-task-list" style={{ marginTop: 12 }}>
              {upcomingTasks.map((task) => (
                <li key={task.id}>
                  <span aria-hidden="true">○</span>
                  <div><strong>{task.text}</strong><small>{task.goal}</small></div>
                  <a href={hrefFor.goals()} aria-label={`View task: ${task.text}`}>↗</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          <p className="sd-caption">Achieved goals and completed steps, kept permanently with your learning journey.</p>
          {achievedGoals.length > 0 && (
            <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              {achievedGoals.map((goal) => (
                <article key={goal.id} style={{ padding: '16px 20px', borderRadius: 16, background: 'var(--gh-surface)', border: '1px solid var(--sp-lime-line, #96d700)', boxShadow: '0 4px 12px rgba(150,215,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 800, color: 'var(--sp-lime-text)', background: 'var(--sp-lime-soft, #f2fadf)', padding: '3px 8px', borderRadius: 6 }}>
                      <Trophy size={13} /> Achieved Goal
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--gh-text-2)' }}>100% Complete</span>
                  </div>
                  <h4 style={{ margin: '4px 0 8px', fontSize: '16px', color: 'var(--gh-heading)' }}>{goal.explore}</h4>
                  <StepMeter states={[true]} label="Achieved goal" />
                </article>
              ))}
            </div>
          )}
          {completedTasks.length > 0 ? (
            <ul className="sd-task-list">
              {completedTasks.map((task) => (
                <li key={task.id}>
                  <span aria-hidden="true">✓</span>
                  <div><strong>{task.text}</strong><small>{task.goal}</small></div>
                  <a href={hrefFor.goals()} aria-label={`View task: ${task.text}`}>↗</a>
                </li>
              ))}
            </ul>
          ) : achievedGoals.length === 0 ? (
            <p className="sd-caption">Completed tasks will appear here.</p>
          ) : null}
        </div>
      )}

      {goalSync === 'local-only' && <p className="sd-notice" role="status" style={{ marginTop: 12 }}>Your plan is saved on this device. Account sync is unavailable.</p>}
      {goalSync === 'saving' && <p className="sd-caption" role="status" style={{ marginTop: 8 }}>Saving your plan…</p>}
    </section>

    {/* Learning Lanes: Academic Learning & STEM/PBL Courses */}
    <div className="sd-learning-columns lh-columns">
      <section className="sd-learning-lane">
        <h3 id="lh-academic-title">Academic learning</h3>
        <AcademicLearning />
      </section>

      <section className="sd-learning-lane">
        <h3 id="lh-pbl-title">STEM & PBL · My Chosen Courses</h3>
        <CourseStatus data={data} />
        {data.courses.map(({ program, summary, progressUnavailable, enrolment, needsRecheck }) => (
          <article className="sd-project lh-project" key={program.id}>
            <div className="ig-project-head">
              <span className="sd-eyebrow">{period === 'completed' ? 'Recorded course work' : 'Current project'}</span>
            </div>
            <div className="ig-project-main">
              <div className="ig-project-text">
                <h4>{program.title}</h4>
                {period === 'completed' ? (
                  <p>{needsRecheck ? RECHECK : progressUnavailable ? 'Account progress is unavailable.' : summary ? `${summary.done} of ${summary.total} sessions marked complete.` : 'No completed sessions recorded yet.'}</p>
                ) : (
                  <>
                    <p>{program.drivingQuestion || (summary?.pct === 100 ? 'Your recorded sessions are complete. Open your project to review your work.' : 'Open your project to find your next investigation.')}</p>
                    <span className="sd-caption">{period === 'ahead' ? 'Next unfinished session · no scheduled due date' : 'Next session · no scheduled due date'}</span>
                  </>
                )}
              </div>
              {!needsRecheck && summary && !progressUnavailable && gaugeReading(summary.done, summary.total) && (
                <div className="ig-mini">
                  <SessionGauge label={`${program.title}: project sessions`} done={summary.done} total={summary.total} />
                </div>
              )}
            </div>
            {period !== 'completed' && <ProjectJourney course={{ program, summary, progressUnavailable, enrolment, needsRecheck }} />}
            <a className="sd-primary" href={hrefFor.program(program.id, 'plan')}>
              {period === 'completed' ? 'Review project' : summary ? 'Continue project' : 'Open project'} <ArrowRight size={16} />
            </a>
          </article>
        ))}

        {period !== 'completed' && (
          <details className="sd-explore">
            <summary><FlaskConical size={16} /> Explore a STEM activity</summary>
            <div className="sd-activity-links">
              {model.academic.items.map((item) => (
                <button type="button" key={item.id} onClick={() => onOpenActivity(item.id)}>
                  {item.label}<ArrowRight size={15} />
                </button>
              ))}
            </div>
            <p className="sd-caption">Exploration is optional; opening an activity is not counted as course mastery.</p>
          </details>
        )}
      </section>
    </div>

    {/* Dedicated My Competencies Section on Dashboard */}
    <DashboardCompetenciesSection />
  </>;
}

function DashboardCompetenciesSection() {
  const DOMAIN_ICONS = {
    sdl: Target,
    ctps: Brain,
    lc: Users,
    ec: MessageSquare,
    ct: Lightbulb,
    sea: Heart,
    ent: Rocket
  };

  return (
    <section className="sd-competencies-section" style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--gh-border)' }} aria-labelledby="sd-competencies-title">
      <div className="sd-section-line" style={{ marginBottom: 14 }}>
        <div>
          <span className="sd-eyebrow" style={{ color: 'var(--sp-purple-text)' }}>WeLearn Future Skills</span>
          <h3 id="sd-competencies-title" className="ig-lane-title" style={{ margin: '4px 0 0' }}>My Competencies</h3>
        </div>
        <a className="sd-link" href={hrefFor.pbl('competencies')}>
          See all competencies & rubrics <ArrowRight size={15} />
        </a>
      </div>
      <p className="sd-caption" style={{ marginBottom: 16 }}>
        The 7 future-skills competency domains developed across your quests and PBL investigations. Tag evidence in your project showcase to demonstrate growth.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {COMPETENCY_DOMAINS.map((domain) => {
          const IconComponent = DOMAIN_ICONS[domain.id] || Sparkles;
          return (
            <a
              key={domain.id}
              href={hrefFor.pbl('competencies')}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderRadius: 16,
                background: 'var(--gh-surface)',
                border: '1px solid var(--gh-border)',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              className="sd-comp-card"
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, background: 'var(--sp-purple-soft)', color: 'var(--sp-purple-text)' }}>
                    <IconComponent size={18} />
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sp-purple-text)' }}>
                    {domain.id.toUpperCase()}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 750, color: 'var(--gh-heading)' }}>
                  {domain.title}
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--gh-text-2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {domain.description}
                </p>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--gh-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--gh-text-3)', fontWeight: 600 }}>Future Skills</span>
                <span style={{ fontSize: '11px', color: 'var(--md-accent-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Explore <ArrowRight size={12} />
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function ProjectJourney({ course }) {
  const journey = programJourney(course);
  return <section className="sd-course-journey" aria-label={`${course.program.title}: project journey`}>
    <span className="sd-eyebrow"><Flag size={12} aria-hidden="true" /> Project journey</span>
    {journey.recheck ? <p className="sd-notice">{RECHECK}</p> : journey.unavailable ? <p className="sd-notice">Project stage and task records are unavailable. Open your project to check saved work.</p> : <>
      {journey.stages.length > 0 && <ol aria-label="Program stages">{journey.stages.map((stage, index) => <li key={stage.id} data-state={stage.state} aria-current={stage.state === 'current' ? 'step' : undefined}><span aria-hidden="true">{stage.state === 'done' ? '✓' : index + 1}</span>{stage.title}</li>)}</ol>}
      <dl><div><dt>Current stage</dt><dd>{journey.current?.title || (course.summary?.pct === 100 ? 'Recorded sessions complete' : 'Open the project to check your stage')}</dd></div>
        <div><dt>Next task</dt><dd>{journey.task || 'Open the project for task instructions'}</dd></div>
        <div><dt>Expected evidence</dt><dd>{journey.evidence || 'Open the project for evidence instructions'}</dd></div></dl>
    </>}
  </section>;
}

export function GoalsSlide({ plan, loaded, syncState }) {
  const { active, completed } = splitGoals(plan);
  const [view, setView] = useState('active');
  return <>
    <div className="sd-section-line"><p className="sd-intro">Small steps towards something bigger.</p><a className="sd-link" href={hrefFor.goals()}>Edit goals <ArrowRight size={16} /></a></div>
    <div className="sd-plan-tabs" role="group" aria-label="Goal status">{[['active', 'Current goals'], ['completed', 'Achieved goals']].map(([id, label]) => <button type="button" key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label} <span>{(id === 'active' ? active : completed).length}</span></button>)}</div>
    {!loaded ? <p role="status">Loading your goals…</p> : <div className="sd-goals">{(view === 'active' ? active : completed).map((goal) => {
      const done = goal.steps.filter((step) => step.done).length;
      return <a className="sd-goal" href={hrefFor.goals()} key={goal.id} aria-label={`Open goal in Goal Setting: ${goal.explore}${nextGoalStep(goal) ? `. Next step: ${nextGoalStep(goal).text}` : ''}`}>
        <div className="ig-goal-readout" aria-hidden="true"><strong>{goal.steps.length ? done : '–'}</strong><small>{goal.steps.length ? `of ${goal.steps.length} steps` : 'no steps yet'}</small></div>
        <div><span className="sd-eyebrow">{view === 'completed' ? 'Achieved goal' : 'My goal'} · personal check-ins</span><h3>{goal.explore}</h3><StepMeter states={goal.steps.map((step) => step.done)} /><p>{goal.steps.length ? `${goal.done ? 'Goal marked achieved · ' : ''}${done} of ${goal.steps.length} steps checked` : goal.done ? 'Goal marked achieved.' : 'Add the steps you want to take in Goal Setting.'}</p>{view === 'active' && nextGoalStep(goal) && <div className="sd-goal-next"><span>Next unfinished step</span><strong>{nextGoalStep(goal).text}</strong></div>}</div><ArrowRight size={20} />
      </a>;
    })}</div>}
    {loaded && !(view === 'active' ? active : completed).length && <div className="sd-empty"><h3>{view === 'active' ? 'What would you like to work towards?' : 'Leave room for your first achievement.'}</h3><p>{view === 'active' ? 'Create a goal and its steps in your existing Goal Setting space.' : 'Completed goals stay here. They are never cleared to make room.'}</p><a className="sd-primary" href={hrefFor.goals()}>Open Goal Setting <ArrowRight size={16} /></a></div>}
    {plan.focus?.habit && <p className="sd-caption">Your daily habit: {plan.focus.habit} · check it off in your Daily Learning Plan.</p>}
    <p className="sd-caption">Goal steps are personal check-ins, separate from assessed course progress.{syncState === 'local-only' ? ' Account sync is unavailable; showing this device’s plan.' : ''}</p>
  </>;
}

/** The PBL Studio term project: Design Thinking tasks the learner ticked, kept apart from course sessions. */
function TermProjectPlate({ project, renderReadiness }) {
  const phases = PHASES.map((phase) => ({ ...phase, ...phaseProgress(project, phase.id) }));
  const done = phases.reduce((n, p) => n + p.tasksDone, 0), total = phases.reduce((n, p) => n + p.tasksTotal, 0);
  return <section className="ig-plate ig-term" aria-labelledby="ig-term-title">
    <div className="sd-section-line"><h3 id="ig-term-title" className="ig-lane-title">Term project · PBL Studio</h3><a className="sd-link" href={hrefFor.pbl('project')}>Continue my project <ArrowRight size={16} /></a></div>
    <div className="ig-goal-readout"><strong>{done}</strong><small>of {total} Design Thinking tasks ticked</small></div>
    <ol className="ig-term-phases" aria-label="Design Thinking phases">{phases.map((phase) => {
      const state = phase.complete ? 'done' : phase.id === project.currentPhase ? 'current' : 'planned';
      return <li key={phase.id} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
        <span>{phase.title}<em>{state === 'done' ? 'Complete' : state === 'current' ? 'Current phase' : phase.tasksDone ? 'Started' : 'Not started'}</em></span>
        <StepMeter done={phase.tasksDone} total={phase.tasksTotal} label={`${phase.title}: ${phase.tasksDone} of ${phase.tasksTotal} tasks ticked`} /><small>{phase.tasksDone}/{phase.tasksTotal}</small>
      </li>;
    })}</ol>
    <p className="sd-caption">Tasks you ticked yourself in PBL Studio · separate from course sessions and not an assessed score.</p>
    <details className="sd-term-record"><summary>Showcase readiness</summary>{renderReadiness()}</details>
  </section>;
}

export function ProgressLearningSlide({ data, project, plan, goalsLoaded, goalSync, renderReadiness }) {
  const steps = goalSteps(splitGoals(plan).active);
  return <>
    <p className="sd-intro">Recorded completion, one instrument per record. Nothing here measures speed, ability or rank.</p>
    <div className="ig-cluster">
      <section className="ig-pbl" aria-labelledby="ig-pbl-title"><h3 id="ig-pbl-title" className="ig-lane-title">STEM & PBL · course sessions</h3><CourseStatus data={data} />
        {data.courses.map(({ program, summary, progressUnavailable, needsRecheck }) => {
          const reading = summary && !progressUnavailable ? gaugeReading(summary.done, summary.total) : null;
          const stages = summary ? phaseStages(program.phases, summary) : [];
          const milestones = reading ? phaseMilestones(program.phases, summary).map((mark) => ({ ...mark, complete: stages.find((stage) => stage.id === mark.id)?.complete })) : [];
          return <article className="sd-record ig-plate ig-dial-plate" key={program.id}>
            <div className="ig-plate-head"><span className="sd-eyebrow">Project</span><h4>{program.title}</h4></div>
            {needsRecheck ? <p className="sd-notice">{RECHECK}</p> : progressUnavailable ? <p className="sd-notice">Account progress is unavailable. We can’t verify this course’s current status.</p> : !summary ? <p className="sd-caption">No saved session progress yet. Open your project to begin.</p>
              : !reading ? <p className="sd-notice">This project doesn’t list any sessions yet, so there’s nothing to measure. Open the project or ask your coach.</p> : <div className="ig-dial-row">
              <SessionGauge label={`${program.title}: project sessions`} done={summary.done} total={summary.total} milestones={milestones} />
              <div className="ig-dial-key"><p className="sd-caption">Marked complete by you · not coach-verified and not an assessed mastery score.</p>
                {stages.length > 0 && <ol className="sd-milestones ig-milestones" aria-label="Project stages">{stages.map((stage) => <li key={stage.id} data-complete={stage.complete || undefined}>
                  <span className="ig-mark" aria-hidden="true">{stage.index + 1}</span><span>{stage.title}<em>{stage.total === 0 ? 'No sessions listed' : stage.complete ? 'Complete' : stage.done > 0 ? 'In progress' : 'Not started'}</em></span><small>{stage.done}/{stage.total} sessions</small>
                </li>)}</ol>}
                {stages.length > 0 && !milestones.length && <p className="sd-caption">Stage markers aren’t drawn on the dial because the stage session counts don’t add up to the project total.</p>}
              </div>
            </div>}
            <a className="sd-link" href={hrefFor.program(program.id, 'plan')}>View detailed project record <ArrowRight size={16} /></a>
          </article>;
        })}
      </section>
      <div className="ig-side">
        <section className="ig-plate ig-academic" aria-labelledby="ig-academic-title"><h3 id="ig-academic-title" className="ig-lane-title">Academic learning</h3>
          <UnavailableDial label="Academic progress" status="Not connected" detail="No needle · not zero" />
          <p className="sd-caption">Academic completion, grades and milestones appear only once verified provider records are connected.</p>
          <a className="sd-link" href={hrefFor.courses()}>View My Courses <ArrowRight size={16} /></a></section>
        <section className="ig-plate ig-goal-plate" aria-labelledby="ig-goal-title"><h3 id="ig-goal-title" className="ig-lane-title">Personal goal steps</h3>
          {!goalsLoaded ? <p role="status" className="sd-caption">Loading your goals…</p> : steps.total ? <>
            <div className="ig-goal-readout"><strong>{steps.done}</strong><small>of {steps.total} steps checked</small></div>
            <StepMeter done={steps.done} total={steps.total} label={`${steps.done} of ${steps.total} personal steps checked across current goals`} />
          </> : <p className="sd-caption">No steps in your current goals yet.</p>}
          <p className="sd-caption">Self-reported check-ins from your current goals. Separate from assessed learning.</p>
          <a className="sd-link" href={hrefFor.goals()}>Open Goal Setting <ArrowRight size={16} /></a></section>
        <section className="ig-plate ig-competency-plate" aria-labelledby="ig-competency-title"><h3 id="ig-competency-title" className="ig-lane-title">My Competencies</h3>
          <p className="sd-caption">WeLearn’s future-skills competencies, area by area, with the evidence you have tagged to each. Coach-verified mastery comes later.</p>
          <a className="sd-link" href={hrefFor.pbl('competencies')}>See my competencies <ArrowRight size={16} /></a></section>
      </div>
    </div>
    {project.updatedAt ? <TermProjectPlate project={project} renderReadiness={renderReadiness} /> : null}
    <section className="ig-goals-section" aria-labelledby="ig-goals-title">
      <h3 id="ig-goals-title" className="ig-lane-title">My goals · personal check-ins</h3>
      <GoalsSlide plan={plan} loaded={goalsLoaded} syncState={goalSync} />
    </section>
  </>;
}
