import { useEffect, useState } from 'react';
import { ArrowRight, FlaskConical, Rocket, Flag, Unplug } from 'lucide-react';
import { PHASES } from '../pbl/content/pblModel.js';
import { phaseProgress } from '../pbl/engine/pblProject.js';
import { hrefFor } from '../../app/routes.js';
import { TodayWidget } from './DashboardWidgets.jsx';
import { startHere, nextGoalStep, programJourney } from './learningGuidance.js';
import { splitGoals } from './slideModel.js';
import { loadDashboardCourses } from './dashboardCourses.js';
import { SessionGauge, UnavailableDial, StepMeter, Spark } from './Instruments.jsx';
import { phaseMilestones, phaseStages, goalSteps, gaugeReading } from './instrumentModel.js';
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
    {data.warnings.length > 0 && <div className="sd-notice" role="alert">{data.warnings.join(' ')} <button className="sd-text-button" onClick={data.retry}>Try again</button></div>}
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
    <div className="sd-empty ig-plate ig-plate-quiet"><span className="ig-status-pill"><Unplug size={14} aria-hidden="true" /> Not connected</span><h4>Academic courses</h4><p>Connected academic courses will appear here when available. Edmentum tasks and progress aren’t connected to this dashboard yet.</p><a className="sd-link" href={hrefFor.courses()}>Open My Courses <ArrowRight size={16} /></a></div>
    <button type="button" className="sd-text-button" aria-expanded={examples} onClick={() => { setExamples(!examples); setSample(null); }}>{examples ? 'Hide example courses' : 'Show example courses'}</button>
    {examples && <div className="sd-examples"><p className="sd-caption">Examples only · no provider connection · no progress saved</p>{EXAMPLES.map((example) => <div className="sd-example lh-example" key={example.id}><span className="sd-eyebrow">{example.subject} · sample</span><h4>{example.title}</h4><button type="button" className="sd-text-button" aria-expanded={sample === example.id} onClick={() => setSample(sample === example.id ? null : example.id)}>Preview sample lesson <ArrowRight size={15} /></button>{sample === example.id && <div><strong>{example.lesson}</strong><p>{example.prompt}</p><small>Sample activity only. This does not change your learning record.</small></div>}</div>)}</div>}
  </div>;
}

export function DailyLearningSlide({ data, model, plan, project, firstName, onToggle, goalsLoaded, goalSync, onOpenActivity }) {
  const [period, setPeriod] = useState('today');
  const completedTasks = plan.goals.flatMap((goal) => goal.steps.filter((s) => s.done).map((step) => ({ ...step, goal: goal.explore })));
  const guidance = startHere({ data, today: model.today, checked: model.ticked, goalsLoaded, hasGoals: plan.goals.length > 0, termProject: project });
  const upcomingTasks = plan.goals.filter((g) => !g.done).flatMap((goal) => goal.steps.filter((s) => !s.done).map((step) => ({ ...step, goal: goal.explore })));
  return <>
    <p className="sd-intro">{firstName ? <><strong className="ig-greeting">Hi, {firstName}.</strong> </> : null}One useful next step. Then another. Start with what matters to you.</p>
    <section className="sd-start-here" aria-label="Start here" aria-live="polite"><span className="sd-start-icon" aria-hidden="true"><Spark size={24} /><b>NEXT</b></span><div><span className="sd-eyebrow">Start here{guidance.source ? ` · ${guidance.source}` : ''}</span><h3>{guidance.title}</h3><p>{guidance.body}</p></div>{guidance.href && <a className="sd-primary" href={guidance.href}>{guidance.action}<ArrowRight size={16} /></a>}</section>
    <div className="sd-plan-tabs lh-tabs" role="group" aria-label="Learning plan timeframe">{[['today', 'Today'], ['ahead', 'Ahead'], ['completed', 'Completed']].map(([id, label]) => <button type="button" key={id} aria-pressed={period === id} onClick={() => setPeriod(id)}>{label}</button>)}</div>
    <div className="sd-learning-columns lh-columns">
      <section className="sd-learning-lane"><h3 id="lh-academic-title">Academic learning</h3><AcademicLearning /></section>
      <section className="sd-learning-lane"><h3 id="lh-pbl-title">STEM & PBL</h3><CourseStatus data={data} />
        {data.courses.map(({ program, summary, progressUnavailable, enrolment, needsRecheck }) => <article className="sd-project lh-project" key={program.id}>
          <div className="ig-project-head"><span className="sd-eyebrow">{period === 'completed' ? 'Recorded course work' : 'Current project'}</span></div><div className="ig-project-main"><div className="ig-project-text"><h4>{program.title}</h4>
          {period === 'completed' ? <p>{needsRecheck ? RECHECK : progressUnavailable ? 'Account progress is unavailable.' : summary ? `${summary.done} of ${summary.total} sessions marked complete.` : 'No completed sessions recorded yet.'}</p> : <>
            <p>{program.drivingQuestion || (summary?.pct === 100 ? 'Your recorded sessions are complete. Open your project to review your work.' : 'Open your project to find your next investigation.')}</p>
            <span className="sd-caption">{period === 'ahead' ? 'Next unfinished session · no scheduled due date' : 'Next session · no scheduled due date'}</span>
          </>}</div>
          {!needsRecheck && summary && !progressUnavailable && gaugeReading(summary.done, summary.total) && <div className="ig-mini"><SessionGauge label={`${program.title}: project sessions`} done={summary.done} total={summary.total} /></div>}</div>
          {period !== 'completed' && <ProjectJourney course={{ program, summary, progressUnavailable, enrolment, needsRecheck }} />}
          <a className="sd-primary" href={hrefFor.program(program.id, 'plan')}>{period === 'completed' ? 'Review project' : summary ? 'Continue project' : 'Open project'} <ArrowRight size={16} /></a>
        </article>)}
        {period !== 'completed' && <details className="sd-explore"><summary><FlaskConical size={16} /> Explore a STEM activity</summary><div className="sd-activity-links">{model.academic.items.map((item) => <button type="button" key={item.id} onClick={() => onOpenActivity(item.id)}>{item.label}<ArrowRight size={15} /></button>)}</div><p className="sd-caption">Exploration is optional; opening an activity is not counted as course mastery.</p></details>}
      </section>
    </div>
    <section className="sd-personal-tasks" aria-labelledby="lh-plan-title"><div className="sd-section-line"><h3 id="lh-plan-title">My personal tasks</h3><a className="sd-link" href={hrefFor.goals()}>Manage in Goal Setting <ArrowRight size={15} /></a></div>
      {!goalsLoaded ? <p role="status">Loading your plan…</p> : period === 'today' ? <TodayWidget items={model.today} checked={model.ticked} onToggle={onToggle} onOpenGoals={() => { window.location.hash = hrefFor.goals(); }} /> : <>
        <p className="sd-caption">{period === 'ahead' ? 'Remaining tasks from your goals. No dates are assumed.' : 'Completed goal steps, kept with your plan.'}</p>
        {(period === 'completed' ? completedTasks : upcomingTasks).length ? <ul className="sd-task-list">{(period === 'completed' ? completedTasks : upcomingTasks).map((task) => <li key={task.id}><span aria-hidden="true">{period === 'completed' ? '✓' : '○'}</span><div><strong>{task.text}</strong><small>{task.goal}</small></div><a href={hrefFor.goals()} aria-label={`View task: ${task.text}`}>↗</a></li>)}</ul> : <p className="sd-caption">{period === 'completed' ? 'Completed tasks will appear here.' : 'No remaining tasks. Plan your next step in Goal Setting.'}</p>}
      </>}
      {goalSync === 'local-only' && <p className="sd-notice" role="status">Your plan is saved on this device. Account sync is unavailable.</p>}
      {goalSync === 'saving' && <p className="sd-caption" role="status">Saving your plan…</p>}
    </section>
  </>;
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
      </div>
    </div>
    {project.updatedAt ? <TermProjectPlate project={project} renderReadiness={renderReadiness} /> : null}
    <section className="ig-goals-section" aria-labelledby="ig-goals-title">
      <h3 id="ig-goals-title" className="ig-lane-title">My goals · personal check-ins</h3>
      <GoalsSlide plan={plan} loaded={goalsLoaded} syncState={goalSync} />
    </section>
  </>;
}
