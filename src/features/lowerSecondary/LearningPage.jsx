import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { checkedToday, todayItems, toggleToday } from '../goals/goalPlan.js';
import { programJourney } from '../dashboard/learningGuidance.js';
import { JuniorExplorers } from '../primary/JuniorExplorers.jsx';
import { SchoolLearningPanel } from '../school/SchoolLearningPanel.jsx';
import { courseStatus, taskText } from './lowerSecondaryModel.js';
import { ArrowLink, Failure, Loading, PageTitle } from './common.jsx';
import {
  CourseEightStageDrawer,
  EightStageStructureCard,
  LowerSecondaryCourseCatalog
} from './LowerSecondaryCourseJourney.jsx';

/** Personal check-ins: the learner's own ticks, never counted as course progress. */
function TodayPlan({ goals }) {
  const today = todayItems(goals.plan), ticked = checkedToday(goals.plan);
  return <section className="ls-card ls-plan" aria-labelledby="ls-plan-title">
    <div className="ls-card-head"><h2 id="ls-plan-title">Today’s plan</h2><ArrowLink href={hrefFor.goals()}>Goal setting</ArrowLink></div>
    <p className="ls-muted">Your own check-ins. They’re separate from course progress.</p>
    {!goals.loaded && <Loading>Loading your plan…</Loading>}
    {goals.loaded && !today.length && <p className="ls-empty">Nothing on today’s list yet. <a href={hrefFor.goals()}>Choose a small step.</a></p>}
    {today.length > 0 && <ul className="ls-checks">{today.map((item) => {
      const done = ticked.has(item.id);
      return <li key={item.id}><button type="button" role="checkbox" aria-checked={done} onClick={() => goals.update((state) => toggleToday(state, item))}>
        {done ? <CheckCircle2 size={22} aria-hidden="true" /> : <Circle size={22} aria-hidden="true" />}
        <span><span className={done ? 'ls-done' : ''}>{item.text}</span>{item.goal && <small>{item.goal}</small>}</span>
      </button></li>;
    })}</ul>}
    {goals.syncState === 'local-only' && <p className="ls-note" role="status">Saved on this device · account sync unavailable</p>}
  </section>;
}

function CourseCard({ uid, course, defaultOpen = false, onProgressChanged }) {
  const [liveSummary, setLiveSummary] = useState(null);
  const current = liveSummary && !course.needsRecheck && !course.progressUnavailable ? { ...course, summary: liveSummary } : course;
  const status = courseStatus(current), journey = programJourney(current);
  const href = hrefFor.program(course.program.id, 'plan');
  const canOpenChecklist = !course.needsRecheck && !course.progressUnavailable;
  return <li className="ls-course">
    <div className="ls-course-head">
      <h3>{course.program.title}</h3>
      {course.program.theme && <span className="ls-tag">{course.program.theme}</span>}
    </div>
    {status.kind === 'counted' && <>
      <div className="ls-bar" role="progressbar" aria-label={`${course.program.title} sessions`} aria-valuemin={0} aria-valuemax={status.total} aria-valuenow={status.done}><i style={{ width: `${status.pct}%` }} /></div>
      <p className="ls-muted">{status.label}</p></>}
    {status.kind !== 'counted' && <p className={status.kind === 'unstarted' ? 'ls-muted' : 'ls-note ls-note-warn'}>{status.label}</p>}
    {journey.stages.length > 0 && <ol className="ls-stages" aria-label="Project stages">{journey.stages.map((stage, idx) => <li key={stage.id} className={`is-${stage.state}`} aria-current={stage.state === 'current' ? 'step' : undefined}><span className="ls-stage-pill-num">{idx + 1}</span>{stage.title}</li>)}</ol>}
    {current.summary?.next && !status.kind.match(/recheck|unavailable/) && <p className="ls-next"><strong>Next:</strong> {current.summary.next.title}</p>}
    {canOpenChecklist && <CourseEightStageDrawer uid={uid} program={course.program} summary={course.summary} defaultOpen={defaultOpen} onSummary={setLiveSummary} onChanged={onProgressChanged} />}
    <div className="ls-course-actions">
      <ArrowLink className="ls-secondary" href={href}>{status.kind === 'unstarted' ? 'Open project' : status.kind === 'recheck' ? 'Re-check sessions' : 'Continue'}</ArrowLink>
    </div>
  </li>;
}

function Courses({ uid, courses, onProgressChanged }) {
  return <section className="ls-card ls-courses" aria-labelledby="ls-courses-title">
    <div className="ls-card-head"><h2 id="ls-courses-title">My courses</h2><ArrowLink href={hrefFor.courses()}>All my courses</ArrowLink></div>
    {courses.state === 'loading' && <Loading>Loading your courses…</Loading>}
    {courses.warnings.length > 0 && <Failure onRetry={courses.retry}>{courses.warnings.join(' ')}</Failure>}
    {courses.state === 'ready' && !courses.courses.length && !courses.warnings.length && <p className="ls-empty">No current project was found for your account. <a href={hrefFor.courseDiscovery()}>Find a course</a> or ask your coach.</p>}
    {courses.courses.length > 0 && <ul className="ls-course-list">{courses.courses.map((course, idx) => {
      const isEightStage = (course.program?.phases?.length || 0) >= 6;
      return <CourseCard key={course.program.id} uid={uid} course={course} defaultOpen={idx === 0 && isEightStage} onProgressChanged={onProgressChanged} />;
    })}</ul>}
  </section>;
}

/** Shown only where the server gave a quest: quests belong to the term project, not to any course. */
function TermQuest({ quest }) {
  if (!quest?.todaysQuest) return null;
  const step = quest.todaysQuest;
  return <section className="ls-card ls-tone-mint ls-quest" aria-labelledby="ls-quest-title">
    <h2 id="ls-quest-title">Today’s quest</h2>
    <p><strong>{taskText(step.task)}</strong></p>
    <p className="ls-muted">{step.phaseTitle} · {step.done} of {step.total} steps done · your term project</p>
    <ArrowLink className="ls-secondary" href={hrefFor.pbl('project')}>Open my term project</ArrowLink>
  </section>;
}

export function LearningPage({ uid, goals, courses, quest, onProgressChanged }) {
  const enrolledIds = (courses.courses || []).map((c) => c.program?.id).filter(Boolean);
  return <div className="ls-page">
    <PageTitle title="My Learning" subtitle="Your plan for today, your 8-stage project checklist, and the courses you’re working on." />
    <div className="ls-learning">
      <div className="ls-learning-main">
        <Courses uid={uid} courses={courses} onProgressChanged={onProgressChanged} />
        <EightStageStructureCard uid={uid} />
        {courses.state !== 'error' && (
          <section className="ls-card ls-course-explorer" aria-label="Course catalog">
            <LowerSecondaryCourseCatalog uid={uid} enrolledIds={enrolledIds} onCourseAdded={courses.retry} />
          </section>
        )}
      </div>
      <div className="ls-learning-side"><TodayPlan goals={goals} /><TermQuest quest={quest} />
        <section className="ls-card ls-learning-links" aria-label="More learning"><ArrowLink href={hrefFor.courseDiscovery()}>Find a course</ArrowLink><ArrowLink href={hrefFor.pbl()}>Project-based learning</ArrowLink><ArrowLink href={hrefFor.pbl('competencies')}>My competencies</ArrowLink></section>
      </div>
    </div>
  </div>;
}

export function PrimaryLearningPage({ uid, profile }) {
  return <div className="ls-page ls-embed"><PageTitle title="My Learning" subtitle="Your investigations and your school’s calendar." />
    <JuniorExplorers uid={uid} displayName={profile?.displayName} />
    <SchoolLearningPanel initialArea="calendar" hideTabs />
  </div>;
}

