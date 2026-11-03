import { useEffect, useState } from 'react';
import { ArrowRight, FlaskConical, Rocket, Flag, Unplug, Mountain, ListChecks, Swords, Plus, Check, X, Compass } from 'lucide-react';
import { PHASES } from '../pbl/content/pblModel.js';
import { phaseProgress } from '../pbl/engine/pblProject.js';
import { hrefFor } from '../../app/routes.js';
import { startHere, programJourney } from './learningGuidance.js';
import { splitGoals } from './slideModel.js';
import { loadDashboardCourses } from './dashboardCourses.js';
import { SessionGauge, UnavailableDial, StepMeter, Spark } from './Instruments.jsx';
import { phaseMilestones, phaseStages, gaugeReading } from './instrumentModel.js';
import { QUEST_LABELS, questOptions, questValue, questTarget, questStatus, questTally } from './questModel.js';
import './learningHub.css';
import './quests.css';

/** One account-scoped read shared by My Quests and Find a Quest. */
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


/**
 * My Quests (formerly the Daily plan, My Goals and Progress slides):
 *   Goal  - the long vision (finish a level, learn a new skill);
 *   Tasks - the checklist that breaks the goal down;
 *   Quest - the learning each task is done through.
 * Course and project quests keep their own recorded progress below.
 */
export function QuestsSlide({ data, model, plan, project, firstName, goalsLoaded, goalSync, onToggleTask, onSetQuest, onOpenActivity, onFindQuest, renderReadiness }) {
  const { active, completed } = splitGoals(plan);
  const [view, setView] = useState('active');
  const guidance = startHere({ data, today: model.today, checked: model.ticked, goalsLoaded, hasGoals: plan.goals.length > 0, termProject: project });
  const tally = questTally(active.filter((goal) => !goal.done));
  const options = questOptions({ courses: data.courses, activities: model.academic.items });
  const extras = model.today.filter((item) => item.kind !== 'step');
  const goals = view === 'active' ? active : completed;
  return <>
    <p className="sd-intro">{firstName ? <><strong className="ig-greeting">Hi, {firstName}.</strong> </> : null}Dream big, then break it down: a goal, the tasks that get you there, and a quest for every task.</p>
    <section className="sd-start-here" aria-label="Start here" aria-live="polite"><span className="sd-start-icon" aria-hidden="true"><Spark size={24} /><b>NEXT</b></span><div><span className="sd-eyebrow">Start here{guidance.source ? ` · ${guidance.source}` : ''}</span><h3>{guidance.title}</h3><p>{guidance.body}</p></div>{guidance.href && <a className="sd-primary" href={guidance.href}>{guidance.action}<ArrowRight size={16} /></a>}</section>
    <ol className="qs-ladder" aria-label="How My Quests works">
      <li><Mountain size={18} aria-hidden="true" /><div><strong>Goal</strong><span>Your long vision · finish a level, learn a new skill</span></div></li>
      <li><ListChecks size={18} aria-hidden="true" /><div><strong>Tasks</strong><span>The checklist that gets you there</span></div></li>
      <li><Swords size={18} aria-hidden="true" /><div><strong>Quest</strong><span>The learning you do for each task</span></div></li>
    </ol>

    <section className="qs-goals" aria-labelledby="qs-goals-title">
      <div className="sd-section-line"><h3 id="qs-goals-title" className="ig-lane-title">My goals</h3><a className="sd-link" href={hrefFor.goals()}>Add or edit goals & tasks <ArrowRight size={15} /></a></div>
      <div className="sd-plan-tabs lh-tabs" role="group" aria-label="Goal status">{[['active', 'Current goals', active.length], ['completed', 'Achieved', completed.length]].map(([id, label, n]) => <button type="button" key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label} <span>{n}</span></button>)}</div>
      {view === 'active' && goalsLoaded && tally.total > 0 && <p className="sd-caption qs-tally">{tally.done} of {tally.total} tasks checked · {tally.withQuest} of {tally.total} tasks have a quest</p>}
      {!goalsLoaded ? <p role="status">Loading your goals…</p> : goals.length ? <div className="qs-goal-list">{goals.map((goal) =>
        <GoalQuestCard key={goal.id} goal={goal} achieved={view === 'completed'} today={model.today} options={options} courses={data.courses}
          onToggleTask={onToggleTask} onSetQuest={onSetQuest} onOpenActivity={onOpenActivity} onFindQuest={onFindQuest} />)}</div>
        : <div className="sd-empty"><Mountain size={25} aria-hidden="true" /><h4>{view === 'active' ? 'What’s your long vision?' : 'Leave room for your first achievement.'}</h4><p>{view === 'active' ? 'A goal is something bigger, like finishing a level or learning a new skill. Set one in Goal Setting and break it into a few tasks.' : 'Achieved goals stay here. They are never cleared to make room.'}</p>{view === 'active' && <a className="sd-primary" href={hrefFor.goals()}>Set my first goal <ArrowRight size={16} /></a>}</div>}
      {extras.length > 0 && <div className="qs-daily"><span className="sd-eyebrow">Every day</span><ul className="qs-tasks">{extras.map((item) => {
        const on = model.ticked.has(item.id);
        return <li key={item.id}><button type="button" className="qs-check" aria-pressed={on} onClick={() => onToggleTask(item)}>{on ? <Check size={15} aria-hidden="true" /> : null}<span className="qs-sr">{on ? 'Untick' : 'Tick'} {item.text}</span></button><span className="qs-task-text">{item.text}<small>{item.kind === 'habit' ? 'Your daily habit' : 'A break that recharges you'}</small></span></li>;
      })}</ul></div>}
      {goalSync === 'local-only' && <p className="sd-notice" role="status">Your goals are saved on this device. Account sync is unavailable.</p>}
      {goalSync === 'saving' && <p className="sd-caption" role="status">Saving your goals…</p>}
      <p className="sd-caption">Tasks are personal check-ins, separate from assessed course progress.</p>
    </section>

    <CourseQuests data={data} project={project} renderReadiness={renderReadiness} onOpenActivity={onOpenActivity} activities={model.academic.items} />
  </>;
}

function GoalQuestCard({ goal, achieved, today, options, courses, onToggleTask, onSetQuest, onOpenActivity, onFindQuest }) {
  const done = goal.steps.filter((step) => step.done).length;
  const [editing, setEditing] = useState(null);
  return <article className="qs-goal" aria-labelledby={`qs-goal-${goal.id}`}>
    <header className="qs-goal-head">
      <div className="ig-goal-readout" aria-hidden="true"><strong>{goal.steps.length ? done : '–'}</strong><small>{goal.steps.length ? `of ${goal.steps.length} tasks` : 'no tasks yet'}</small></div>
      <div><span className="sd-eyebrow"><Mountain size={12} aria-hidden="true" /> {achieved ? 'Achieved goal' : 'Goal · long vision'}</span><h4 id={`qs-goal-${goal.id}`}>{goal.explore}</h4><StepMeter states={goal.steps.map((step) => step.done)} label={`${done} of ${goal.steps.length} tasks checked`} /></div>
    </header>
    {goal.steps.length ? <ul className="qs-tasks" aria-label={`Tasks for ${goal.explore}`}>{goal.steps.map((step) => {
      const item = today.find((entry) => entry.stepId === step.id && entry.goalId === goal.id) || { id: `task:${goal.id}:${step.id}`, kind: 'task', goalId: goal.id, stepId: step.id };
      return <li key={step.id} data-done={step.done || undefined}>
        <button type="button" className="qs-check" aria-pressed={step.done} disabled={achieved} onClick={() => onToggleTask(item)}>{step.done ? <Check size={15} aria-hidden="true" /> : null}<span className="qs-sr">{step.done ? 'Untick' : 'Tick'} task: {step.text}</span></button>
        <span className="qs-task-text">{step.text}</span>
        {editing === step.id ? <QuestPicker step={step} options={options} onCancel={() => setEditing(null)} onFindQuest={onFindQuest}
          onSave={(quest) => { onSetQuest(goal.id, step.id, quest); setEditing(null); }} />
          : <QuestChip quest={step.quest} courses={courses} locked={achieved} onOpenActivity={onOpenActivity} onEdit={() => setEditing(step.id)} taskText={step.text} />}
      </li>;
    })}</ul> : <p className="sd-caption">Break this goal into a few tasks in <a href={hrefFor.goals()}>Goal Setting</a>, then give each task a quest.</p>}
  </article>;
}

function QuestChip({ quest, courses, locked, onOpenActivity, onEdit, taskText }) {
  if (!quest) return locked ? null : <button type="button" className="qs-add-quest" onClick={onEdit} aria-label={`Choose a quest for: ${taskText}`}><Plus size={14} aria-hidden="true" /> Choose a quest</button>;
  const target = questTarget(quest), status = questStatus(quest, courses);
  const body = <><Swords size={14} aria-hidden="true" /><span><small>{QUEST_LABELS[quest.kind]}{status ? ` · ${status}` : ''}</small>{quest.title}</span>{target && <ArrowRight size={14} aria-hidden="true" />}</>;
  return <span className="qs-quest">
    {target?.href ? <a className="qs-quest-go" href={target.href} aria-label={`Open quest: ${quest.title}`}>{body}</a>
      : target?.activity ? <button type="button" className="qs-quest-go" onClick={() => onOpenActivity?.(target.activity)} aria-label={`Open quest: ${quest.title}`}>{body}</button>
      : <span className="qs-quest-go">{body}</span>}
    {!locked && <button type="button" className="sd-text-button qs-change" onClick={onEdit} aria-label={`Change quest for: ${taskText}`}>Change</button>}
  </span>;
}

function QuestPicker({ step, options, onSave, onCancel, onFindQuest }) {
  const [value, setValue] = useState(step.quest?.kind === 'own' ? 'own:' : questValue(step.quest) || '');
  const [own, setOwn] = useState(step.quest?.kind === 'own' ? step.quest.title : '');
  const chosen = options.flatMap((group) => group.items).find((item) => item.value === value)?.quest;
  const quest = value === 'own:' ? (own.trim() ? { kind: 'own', ref: '', title: own } : null) : chosen || null;
  return <form className="qs-picker" onSubmit={(event) => { event.preventDefault(); if (quest) onSave(quest); }}>
    <label>Quest for this task<select value={value} onChange={(event) => setValue(event.target.value)} autoFocus>
      <option value="" disabled>Choose a quest…</option>
      {options.map((group) => <optgroup key={group.group} label={group.group}>{group.items.map((item) => <option key={item.value} value={item.value}>{item.quest.title}</option>)}</optgroup>)}
      <optgroup label="Something else"><option value="own:">My own challenge…</option></optgroup>
    </select></label>
    {value === 'own:' && <label>Describe your challenge<input maxLength={160} value={own} onChange={(event) => setOwn(event.target.value)} placeholder="e.g. Build a weather station with my sister" /></label>}
    <div className="qs-picker-actions">
      <button type="submit" className="sd-primary" disabled={!quest}>Save quest</button>
      {step.quest && <button type="button" className="sd-text-button" onClick={() => onSave(null)}>Remove quest</button>}
      <button type="button" className="sd-text-button" onClick={onFindQuest}><Compass size={14} aria-hidden="true" /> Find a new quest</button>
      <button type="button" className="sd-button" aria-label="Cancel" onClick={onCancel}><X size={16} /></button>
    </div>
  </form>;
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

/** Course and project quests: the real records behind course quests, one instrument per record. */
export function CourseQuests({ data, project, renderReadiness, onOpenActivity, activities = [] }) {
  return <section className="qs-courses" aria-labelledby="qs-courses-title">
    <div className="sd-section-line"><h3 id="qs-courses-title" className="ig-lane-title">Quests from my courses</h3><a className="sd-link" href={hrefFor.courses()}>My Courses <ArrowRight size={15} /></a></div>
    <p className="sd-caption">Recorded completion only. Nothing here measures speed, ability or rank.</p>
    <div className="ig-cluster">
      <section className="ig-pbl" aria-labelledby="ig-pbl-title"><h3 id="ig-pbl-title" className="ig-lane-title">STEM & PBL · course sessions</h3><CourseStatus data={data} />
        {data.courses.map((course) => {
          const { program, summary, progressUnavailable, needsRecheck } = course;
          const reading = summary && !progressUnavailable ? gaugeReading(summary.done, summary.total) : null;
          const stages = summary ? phaseStages(program.phases, summary) : [];
          const milestones = reading ? phaseMilestones(program.phases, summary).map((mark) => ({ ...mark, complete: stages.find((stage) => stage.id === mark.id)?.complete })) : [];
          return <article className="sd-record ig-plate ig-dial-plate" key={program.id}>
            <div className="ig-plate-head"><span className="sd-eyebrow">Course quest</span><h4>{program.title}</h4></div>
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
            {summary?.pct !== 100 && <ProjectJourney course={course} />}
            <a className="sd-primary" href={hrefFor.program(program.id, 'plan')}>{summary?.pct === 100 ? 'Review project' : summary ? 'Continue project' : 'Open project'} <ArrowRight size={16} /></a>
          </article>;
        })}
        {activities.length > 0 && <details className="sd-explore"><summary><FlaskConical size={16} /> Explore a STEM activity</summary><div className="sd-activity-links">{activities.map((item) => <button type="button" key={item.id} onClick={() => onOpenActivity(item.id)}>{item.label}<ArrowRight size={15} /></button>)}</div><p className="sd-caption">Exploration is optional; opening an activity is not counted as course mastery.</p></details>}
      </section>
      <div className="ig-side">
        <section className="ig-plate ig-academic" aria-labelledby="ig-academic-title"><h3 id="ig-academic-title" className="ig-lane-title">Academic learning</h3>
          <UnavailableDial label="Academic progress" status="Not connected" detail="No needle · not zero" />
          <AcademicLearning />
        </section>
      </div>
    </div>
    {project?.updatedAt ? <TermProjectPlate project={project} renderReadiness={renderReadiness} /> : null}
  </section>;
}
