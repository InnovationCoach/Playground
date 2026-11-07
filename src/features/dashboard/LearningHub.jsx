import { useEffect, useState } from 'react';
import {
  ArrowRight, Brain, Check, FlaskConical, Rocket, Flag, Unplug,
  Trophy, Target, Users, MessageSquare, Lightbulb, Heart, Sparkles
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

const RECHECK = 'The session numbers in this course changed after you saved, so we can’t count them yet. Open the project and check which sessions you’ve done.';

function CourseStatus({ data }) {
  return <>
    {data.state === 'loading' && <p className="sd-notice" role="status">Loading your projects…</p>}
    {data.warnings.length > 0 && data.courses.length === 0 && <div className="sd-notice" role="alert">{data.warnings.join(' ')} <button className="sd-text-button" onClick={data.retry}>Try again</button></div>}
    {data.state === 'ready' && data.courses.length === 0 && <div className="sd-empty"><Rocket size={25} /><h4>No project yet</h4><p>Pick one in My Courses, or ask your coach.</p><a className="sd-link" href={hrefFor.courses()}>Find my project <ArrowRight size={16} /></a></div>}
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
        <span style={{ fontSize: '11px', color: 'var(--sp-sky-text)', fontWeight: 650 }}>Edmentum</span>
      </div>
      <h4>School courses</h4>
      <p>Your school courses will show up here once your school connects them.</p>
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
      <p className="sd-caption">Just examples. Nothing here is saved.</p>
      {EXAMPLES.map((example) => (
        <div className="sd-example lh-example" key={example.id} style={{ padding: '16px 20px', borderRadius: 16, background: 'var(--gh-surface)', border: '1px solid var(--gh-border)', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span className="sd-eyebrow" style={{ color: 'var(--sp-sky-text)' }}>{example.subject} · example</span>
            <span style={{ fontSize: '11px', background: 'var(--sp-sky-soft)', color: 'var(--sp-sky-text)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Mini-Challenge</span>
          </div>
          <h4 style={{ margin: '4px 0 8px', fontSize: '16px' }}>{example.title}</h4>
          <button type="button" className="sd-text-button" aria-expanded={sample === example.id} onClick={() => setSample(sample === example.id ? null : example.id)}>
            {sample === example.id ? 'Hide example lesson' : 'Show example lesson'} <ArrowRight size={15} />
          </button>
          {sample === example.id && <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--gh-subtle)', borderLeft: '3px solid var(--sp-sky-line)' }}>
            <strong style={{ display: 'block', marginBottom: 4, color: 'var(--gh-heading)' }}>{example.lesson}</strong>
            <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--gh-text-2)' }}>{example.prompt}</p>
            <small style={{ color: 'var(--gh-text-3)', fontSize: '11px' }}>Just an example. It doesn’t change your record.</small>
          </div>}
        </div>
      ))}
    </div>}
  </div>;
}

/**
 * My Quests answers one question: what do I do next? One action sits on the
 * page; the rest of the plan is a tap away, with its numbers in My Progress.
 */
export function DailyLearningSlide({ data, model, plan, project, firstName, onToggle, goalsLoaded, goalSync, onOpenActivity, joinPanel = null }) {
  const guidance = startHere({ data, today: model.today, checked: model.ticked, goalsLoaded, hasGoals: plan.goals.length > 0, termProject: project });
  return <>
    <p className="sd-intro">{firstName ? <><strong className="ig-greeting">Hi, {firstName}.</strong> </> : null}Here’s what to do next.</p>
    <section className="sd-start-here" aria-label="Your next step" aria-live="polite">
      <span className="sd-start-icon" aria-hidden="true"><Spark size={24} /><b>NEXT</b></span>
      <div><span className="sd-eyebrow">{guidance.source || 'Your next step'}</span><h3>{guidance.title}</h3><p>{guidance.body}</p></div>
      <div className="lh-next-actions">
        {guidance.href && <a className="sd-primary" href={guidance.href}>{guidance.action}<ArrowRight size={16} /></a>}
        {guidance.item && <button type="button" className="sd-text-button" onClick={() => onToggle(guidance.item)}><Check size={15} aria-hidden="true" /> I’ve done this</button>}
      </div>
    </section>
    {joinPanel}
    <details className="lh-full-plan">
      <summary>See my whole plan</summary>
      <FullPlan data={data} model={model} plan={plan} onToggle={onToggle} goalsLoaded={goalsLoaded} goalSync={goalSync} onOpenActivity={onOpenActivity} />
    </details>
  </>;
}

function FullPlan({ data, model, plan, onToggle, goalsLoaded, goalSync, onOpenActivity }) {
  const [period, setPeriod] = useState('today');
  const { active: activeGoals, completed: achievedGoals } = splitGoals(plan);
  const completedTasks = plan.goals.flatMap((goal) => goal.steps.filter((s) => s.done).map((step) => ({ ...step, goal: goal.explore })));
  return <>
    <div className="sd-plan-tabs lh-tabs" role="group" aria-label="Which part of my plan">
      {[['today', 'Today'], ['ahead', 'Coming up'], ['completed', 'Done']].map(([id, label]) => (
        <button type="button" key={id} aria-pressed={period === id} onClick={() => setPeriod(id)}>
          {label}
        </button>
      ))}
    </div>

    <section className="sd-personal-tasks" aria-labelledby="lh-plan-title">
      <div className="sd-section-line">
        <h3 id="lh-plan-title" className="ig-lane-title">
          {period === 'today' ? 'Today' : period === 'ahead' ? 'Coming up' : 'Done'}
        </h3>
        <a className="sd-link" href={hrefFor.goals()}>Change my goals <ArrowRight size={15} /></a>
      </div>

      {!goalsLoaded ? (
        <p role="status">Loading your plan…</p>
      ) : period === 'today' ? (
        <TodayWidget items={model.today} checked={model.ticked} onToggle={onToggle} onOpenGoals={() => { window.location.hash = hrefFor.goals(); }} />
      ) : period === 'ahead' ? (
        activeGoals.length > 0 ? (
          <div className="lh-goal-list">
            {activeGoals.map((goal) => {
              const pendingSteps = goal.steps.filter((s) => !s.done);
              return (
                <article key={goal.id} className="lh-goal">
                  <span className="sd-eyebrow">My goal</span>
                  <h4>{goal.explore}</h4>
                  {pendingSteps.length > 0 ? (
                    <ul className="sd-task-list">
                      {pendingSteps.map((step) => (
                        <li key={step.id}>
                          <span aria-hidden="true">○</span>
                          <div><strong>{step.text}</strong></div>
                          <a href={hrefFor.goals()} aria-label={`Open step: ${step.text}`}>↗</a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="sd-caption">All steps are done. Add a next step, or mark this goal as done.</p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="sd-caption">Nothing coming up. Set a goal to plan your next step.</p>
        )
      ) : (
        <div className="lh-goal-list">
          {achievedGoals.map((goal) => (
            <article key={goal.id} className="lh-goal" data-done>
              <span className="sd-eyebrow"><Trophy size={13} aria-hidden="true" /> Goal done</span>
              <h4>{goal.explore}</h4>
            </article>
          ))}
          {completedTasks.length > 0 ? (
            <ul className="sd-task-list">
              {completedTasks.map((task) => (
                <li key={task.id}>
                  <span aria-hidden="true">✓</span>
                  <div><strong>{task.text}</strong><small>{task.goal}</small></div>
                  <a href={hrefFor.goals()} aria-label={`Open step: ${task.text}`}>↗</a>
                </li>
              ))}
            </ul>
          ) : achievedGoals.length === 0 ? (
            <p className="sd-caption">Steps you finish will show up here.</p>
          ) : null}
        </div>
      )}

      {goalSync === 'local-only' && <p className="sd-notice" role="status">Your plan is saved on this device only. We can’t reach your account right now.</p>}
      {goalSync === 'saving' && <p className="sd-caption" role="status">Saving your plan…</p>}
    </section>

    <div className="sd-learning-columns lh-columns">
      <section className="sd-learning-lane">
        <h3 id="lh-academic-title">School courses</h3>
        <AcademicLearning />
      </section>

      <section className="sd-learning-lane">
        <h3 id="lh-pbl-title">My projects</h3>
        <CourseStatus data={data} />
        {data.courses.map(({ program, summary, progressUnavailable, enrolment, needsRecheck }) => (
          <article className="sd-project lh-project" key={program.id}>
            <div className="ig-project-main">
              <div className="ig-project-text">
                <h4>{program.title}</h4>
                {period === 'completed' ? (
                  <p>{needsRecheck ? RECHECK : progressUnavailable ? 'We can’t load your progress right now.' : summary ? `You’ve marked ${summary.done} of ${summary.total} sessions as done.` : 'No sessions marked as done yet.'}</p>
                ) : (
                  <p>{program.drivingQuestion || (summary?.pct === 100 ? 'You’ve marked every session as done. Open your project to look back at your work.' : 'Open your project to find your next step.')}</p>
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
              {period === 'completed' ? 'Look back at this project' : summary ? 'Continue project' : 'Open project'} <ArrowRight size={16} />
            </a>
          </article>
        ))}

        {period !== 'completed' && (
          <details className="sd-explore">
            <summary><FlaskConical size={16} /> Try a STEM activity</summary>
            <div className="sd-activity-links">
              {model.academic.items.map((item) => (
                <button type="button" key={item.id} onClick={() => onOpenActivity(item.id)}>
                  {item.label}<ArrowRight size={15} />
                </button>
              ))}
            </div>
            <p className="sd-caption">These are optional. Opening one doesn’t count towards your courses.</p>
          </details>
        )}
      </section>
    </div>
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
    <details className="sd-competencies-section lh-full-plan" aria-labelledby="sd-competencies-title">
      <summary id="sd-competencies-title">The 7 skills you’re building</summary>
      <p className="sd-caption" style={{ margin: '12px 0 16px' }}>
        You build these skills across your quests and projects. Add work from your projects to show how you’re growing.
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
      <a className="sd-link" href={hrefFor.pbl('competencies')} style={{ marginTop: 14 }}>
        See all my competencies <ArrowRight size={15} />
      </a>
    </details>
  );
}

function ProjectJourney({ course }) {
  const journey = programJourney(course);
  return <section className="sd-course-journey" aria-label={`${course.program.title}: where you are`}>
    <span className="sd-eyebrow"><Flag size={12} aria-hidden="true" /> Where you are</span>
    {journey.recheck ? <p className="sd-notice">{RECHECK}</p> : journey.unavailable ? <p className="sd-notice">We can’t load this right now. Open your project to see your saved work.</p> : <>
      {journey.stages.length > 0 && <ol aria-label="Program stages">{journey.stages.map((stage, index) => <li key={stage.id} data-state={stage.state} aria-current={stage.state === 'current' ? 'step' : undefined}><span aria-hidden="true">{stage.state === 'done' ? '✓' : index + 1}</span>{stage.title}</li>)}</ol>}
      <dl><div><dt>Stage</dt><dd>{journey.current?.title || (course.summary?.pct === 100 ? 'All sessions done' : 'Open the project to see your stage')}</dd></div>
        <div><dt>Next thing to do</dt><dd>{journey.task || 'Open the project to see what’s next'}</dd></div>
        <div><dt>What to save</dt><dd>{journey.evidence || 'Open the project to see what to save'}</dd></div></dl>
    </>}
  </section>;
}

export function GoalsSlide({ plan, loaded, syncState }) {
  const { active, completed } = splitGoals(plan);
  const [view, setView] = useState('active');
  return <>
    <div className="sd-section-line"><p className="sd-intro">Small steps towards something bigger.</p><a className="sd-link" href={hrefFor.goals()}>Change my goals <ArrowRight size={16} /></a></div>
    <div className="sd-plan-tabs" role="group" aria-label="Goal status">{[['active', 'Goals I’m working on'], ['completed', 'Goals I’ve finished']].map(([id, label]) => <button type="button" key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label} <span>{(id === 'active' ? active : completed).length}</span></button>)}</div>
    {!loaded ? <p role="status">Loading your goals…</p> : <div className="sd-goals">{(view === 'active' ? active : completed).map((goal) => {
      const done = goal.steps.filter((step) => step.done).length;
      return <a className="sd-goal" href={hrefFor.goals()} key={goal.id} aria-label={`Open goal: ${goal.explore}${nextGoalStep(goal) ? `. Next step: ${nextGoalStep(goal).text}` : ''}`}>
        <div className="ig-goal-readout" aria-hidden="true"><strong>{goal.steps.length ? done : '–'}</strong><small>{goal.steps.length ? `of ${goal.steps.length} steps` : 'no steps yet'}</small></div>
        <div><span className="sd-eyebrow">{view === 'completed' ? 'Finished goal' : 'My goal'}</span><h3>{goal.explore}</h3><StepMeter states={goal.steps.map((step) => step.done)} /><p>{goal.steps.length ? `${goal.done ? 'You marked this goal as done · ' : ''}${done} of ${goal.steps.length} steps ticked` : goal.done ? 'You marked this goal as done.' : 'Add a small step to get going.'}</p>{view === 'active' && nextGoalStep(goal) && <div className="sd-goal-next"><span>Next step</span><strong>{nextGoalStep(goal).text}</strong></div>}</div><ArrowRight size={20} />
      </a>;
    })}</div>}
    {loaded && !(view === 'active' ? active : completed).length && <div className="sd-empty"><h3>{view === 'active' ? 'What would you like to work towards?' : 'Nothing finished yet'}</h3><p>{view === 'active' ? 'Answer a few short questions and pick a small first step.' : 'Goals you finish stay here.'}</p><a className="sd-primary" href={hrefFor.goals()}>Set a goal <ArrowRight size={16} /></a></div>}
    {plan.focus?.habit && <p className="sd-caption">Your daily habit: {plan.focus.habit}. Tick it off in My Quests.</p>}
    <p className="sd-caption">You tick these yourself. They aren’t marked or graded.{syncState === 'local-only' ? ' We can’t reach your account, so this is the plan saved on this device.' : ''}</p>
  </>;
}

/** The PBL Studio term project: Design Thinking tasks the learner ticked, kept apart from course sessions. */
function TermProjectPlate({ project, renderReadiness }) {
  const phases = PHASES.map((phase) => ({ ...phase, ...phaseProgress(project, phase.id) }));
  const done = phases.reduce((n, p) => n + p.tasksDone, 0), total = phases.reduce((n, p) => n + p.tasksTotal, 0);
  return <section className="ig-plate ig-term" aria-labelledby="ig-term-title">
    <div className="sd-section-line"><h3 id="ig-term-title" className="ig-lane-title">My term project</h3><a className="sd-link" href={hrefFor.pbl('project')}>Continue my project <ArrowRight size={16} /></a></div>
    <div className="ig-goal-readout"><strong>{done}</strong><small>of {total} project tasks ticked</small></div>
    <ol className="ig-term-phases" aria-label="Project stages">{phases.map((phase) => {
      const state = phase.complete ? 'done' : phase.id === project.currentPhase ? 'current' : 'planned';
      return <li key={phase.id} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
        <span>{phase.title}<em>{state === 'done' ? 'Done' : state === 'current' ? 'You are here' : phase.tasksDone ? 'Started' : 'Not started'}</em></span>
        <StepMeter done={phase.tasksDone} total={phase.tasksTotal} label={`${phase.title}: ${phase.tasksDone} of ${phase.tasksTotal} tasks ticked`} /><small>{phase.tasksDone}/{phase.tasksTotal}</small>
      </li>;
    })}</ol>
    <p className="sd-caption">You ticked these yourself in PBL Studio. They aren’t marked or graded.</p>
    <details className="sd-term-record"><summary>Am I ready to show my work?</summary>{renderReadiness()}</details>
  </section>;
}

export function ProgressLearningSlide({ data, project, plan, goalsLoaded, goalSync, renderReadiness, renderExtras = null }) {
  const steps = goalSteps(splitGoals(plan).active);
  return <>
    <p className="sd-intro">What you’ve finished so far. This shows what’s done, not how fast you are or how you compare with anyone.</p>
    <div className="ig-cluster">
      <section className="ig-pbl" aria-labelledby="ig-pbl-title"><h3 id="ig-pbl-title" className="ig-lane-title">My projects</h3><CourseStatus data={data} />
        {data.courses.map(({ program, summary, progressUnavailable, needsRecheck }) => {
          const reading = summary && !progressUnavailable ? gaugeReading(summary.done, summary.total) : null;
          const stages = summary ? phaseStages(program.phases, summary) : [];
          const milestones = reading ? phaseMilestones(program.phases, summary).map((mark) => ({ ...mark, complete: stages.find((stage) => stage.id === mark.id)?.complete })) : [];
          return <article className="sd-record ig-plate ig-dial-plate" key={program.id}>
            <div className="ig-plate-head"><span className="sd-eyebrow">Project</span><h4>{program.title}</h4></div>
            {needsRecheck ? <p className="sd-notice">{RECHECK}</p> : progressUnavailable ? <p className="sd-notice">We can’t load your progress for this course right now.</p> : !summary ? <p className="sd-caption">Nothing marked as done yet. Open your project to begin.</p>
              : !reading ? <p className="sd-notice">This project doesn’t list any sessions yet. Open the project or ask your coach.</p> : <div className="ig-dial-row">
              <SessionGauge label={`${program.title}: project sessions`} done={summary.done} total={summary.total} milestones={milestones} />
              <div className="ig-dial-key"><p className="sd-caption">You mark these as done yourself. Your coach hasn’t checked them, and they aren’t a grade.</p>
                {stages.length > 0 && <ol className="sd-milestones ig-milestones" aria-label="Project stages">{stages.map((stage) => <li key={stage.id} data-complete={stage.complete || undefined}>
                  <span className="ig-mark" aria-hidden="true">{stage.index + 1}</span><span>{stage.title}<em>{stage.total === 0 ? 'No sessions in this stage' : stage.complete ? 'Done' : stage.done > 0 ? 'Started' : 'Not started'}</em></span><small>{stage.done} of {stage.total} sessions</small>
                </li>)}</ol>}
                {stages.length > 0 && !milestones.length && <p className="sd-caption">The stage markers aren’t on the dial because the stage session counts don’t add up to the project total.</p>}
              </div>
            </div>}
            <a className="sd-link" href={hrefFor.program(program.id, 'plan')}>See this project in detail <ArrowRight size={16} /></a>
          </article>;
        })}
      </section>
      <div className="ig-side">
        <section className="ig-plate ig-academic" aria-labelledby="ig-academic-title"><h3 id="ig-academic-title" className="ig-lane-title">School courses</h3>
          <UnavailableDial label="School courses" status="Not connected" detail="This doesn’t mean zero" />
          <p className="sd-caption">Your school courses and grades will show here once your school connects them.</p>
          <a className="sd-link" href={hrefFor.courses()}>Open My Courses <ArrowRight size={16} /></a></section>
        <section className="ig-plate ig-goal-plate" aria-labelledby="ig-goal-title"><h3 id="ig-goal-title" className="ig-lane-title">My goal steps</h3>
          {!goalsLoaded ? <p role="status" className="sd-caption">Loading your goals…</p> : steps.total ? <>
            <div className="ig-goal-readout"><strong>{steps.done}</strong><small>of {steps.total} steps ticked</small></div>
            <StepMeter done={steps.done} total={steps.total} label={`${steps.done} of ${steps.total} steps ticked across the goals you’re working on`} />
          </> : <p className="sd-caption">Your goals don’t have any steps yet.</p>}
          <p className="sd-caption">You tick these yourself. They aren’t marked or graded.</p>
          <a className="sd-link" href={hrefFor.goals()}>Open my goals <ArrowRight size={16} /></a></section>
        <section className="ig-plate ig-competency-plate" aria-labelledby="ig-competency-title"><h3 id="ig-competency-title" className="ig-lane-title">My Competencies</h3>
          <p className="sd-caption">The skills you’re building, one area at a time, with the work you’ve added to each.</p>
          <a className="sd-link" href={hrefFor.pbl('competencies')}>See my competencies <ArrowRight size={16} /></a></section>
      </div>
    </div>
    {project.updatedAt ? <TermProjectPlate project={project} renderReadiness={renderReadiness} /> : null}
    <section className="ig-goals-section" aria-labelledby="ig-goals-title">
      <h3 id="ig-goals-title" className="ig-lane-title">My goals</h3>
      <GoalsSlide plan={plan} loaded={goalsLoaded} syncState={goalSync} />
    </section>
    <DashboardCompetenciesSection />
    {renderExtras}
  </>;
}
