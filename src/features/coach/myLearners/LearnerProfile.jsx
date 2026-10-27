import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, FileText, Target, Rocket, GraduationCap, MessageCircle, CalendarCheck, Plus, ExternalLink,
  Lock, Users, Check, Link2, Image, StickyNote
} from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { hrefFor, COACH_TABS } from '../../../app/routes.js';
import { Alert } from '../../admin/ui/bits.jsx';
import { dayKey } from '../../goals/goalPlan.js';
import { COMPETENCY_DOMAINS, COMPETENCIES, competencyById } from '../../pbl/content/competencies.js';
import { PHASES, EVIDENCE_KINDS } from '../../pbl/content/pblModel.js';
import { programById, programCompetencies } from '../../pbl/programs/catalog.js';
import {
  useCoachRecords, addCheckIn, addNote, removeNote, addMilestone, setMilestoneDone, setFeedback, addAssessment, addCoachEvidence,
  addGoal, setGoalDone
} from './coachRecordsStore.js';
import { competencyRows, LEVELS } from './myLearnersModel.js';
import { saveSubmissionFeedback } from './submissionFeedback.js';
import { StatusBadge, ReasonText, NotAvailable, Empty, DeviceStoreNote, NextCell, Missions, useDay, useWhen } from './ui.jsx';

const PROFILE_TABS = COACH_TABS;
const TAB_ICON = { overview: Target, projects: Rocket, evidence: Image, notes: MessageCircle };

const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dayKey(d); };

/**
 * One learner. Four tabs so detail stays off the home page; the reasons for
 * the learner's status are always at the top, above the tabs.
 */
export function LearnerProfile({ coachUser, learner, classes, assignmentsFailed, tab, navigate, today, reload }) {
  const { t } = useLocale();
  const { records, update, saveError } = useCoachRecords(coachUser.uid, learner.uid);
  const active = PROFILE_TABS.includes(tab) ? tab : 'overview';
  const tabRefs = useRef({});
  const go = (next) => navigate(hrefFor.coachLearner(learner.uid, next === 'overview' ? null : next));

  const onTabKey = (e) => {
    const i = PROFILE_TABS.indexOf(active);
    const to = e.key === 'ArrowRight' ? PROFILE_TABS[(i + 1) % PROFILE_TABS.length]
      : e.key === 'ArrowLeft' ? PROFILE_TABS[(i + PROFILE_TABS.length - 1) % PROFILE_TABS.length]
      : e.key === 'Home' ? PROFILE_TABS[0] : e.key === 'End' ? PROFILE_TABS[PROFILE_TABS.length - 1] : null;
    if (!to) return;
    e.preventDefault();
    go(to);
    setTimeout(() => tabRefs.current[to]?.focus(), 0);
  };

  return (
    <div className="gh-page ml-page">
      <a className="gh-crumb" href={hrefFor.coach()}><ArrowLeft size={15} aria-hidden="true" />{t('ml.title')}</a>
      <div className="gh-page-head ml-profile-head">
        <div>
          <h1>{learner.name}</h1>
          <p className="gh-sub">{[learner.yearLevel, ...learner.classNames].filter(Boolean).join(' · ')}
            {learner.accountStatus !== 'active' && <span className="gh-badge gh-badge-pending ml-acct">{t(`status.${learner.accountStatus}`)}</span>}
          </p>
        </div>
        <a className={`gh-btn ${active === 'overview' ? 'gh-btn-primary' : ''}`} href={hrefFor.coachReport(learner.uid)}>
          <FileText size={16} aria-hidden="true" />{t('ml.report.open')}
        </a>
      </div>

      <section className={`ml-why-box ml-why-${learner.status.id}`} aria-label={t('ml.why.label')}>
        <StatusBadge status={learner.status} />
        {learner.reasons.length ? (
          <ul>{learner.reasons.map((r, i) => <li key={i}><ReasonText reason={r} /></li>)}</ul>
        ) : <p>{t('ml.why.onTrack')}</p>}
      </section>
      {learner.readFailed && <Alert type="info">{t('ml.readFailedLong')}</Alert>}
      {saveError && <Alert type="error">{t('ml.saveFailed')}</Alert>}

      <div className="gh-tabs ml-tabs" role="tablist" aria-label={t('ml.profile.sections')}>
        {PROFILE_TABS.map((id) => {
          const Icon = TAB_ICON[id];
          return (
            <button key={id} ref={(el) => { tabRefs.current[id] = el; }} type="button" role="tab" id={`ml-tab-${id}`}
                    className="gh-tab" aria-selected={active === id} aria-controls={`ml-panel-${id}`} tabIndex={active === id ? 0 : -1}
                    onClick={() => go(id)} onKeyDown={onTabKey}>
              <Icon size={16} aria-hidden="true" />{t(`ml.tab.${id}`)}
              {id === 'evidence' && learner.waitingKeys.length > 0 && <span className="ml-tab-n" aria-label={t('ml.waitingCount', { count: learner.waitingKeys.length })}>{learner.waitingKeys.length}</span>}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`ml-panel-${active}`} aria-labelledby={`ml-tab-${active}`}>
        {active === 'overview' && <Overview learner={learner} go={go} records={records} update={update} today={today} />}
        {active === 'projects' && <Projects learner={learner} records={records} update={update} classes={classes} assignmentsFailed={assignmentsFailed} today={today} />}
        {active === 'evidence' && <Evidence learner={learner} records={records} update={update} coachUid={coachUser.uid} reload={reload} />}
        {active === 'notes' && <Notes learner={learner} records={records} update={update} />}
      </div>
      <DeviceStoreNote />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function Overview({ learner, go, records, update, today }) {
  const { t } = useLocale();
  const day = useDay();
  const when = useWhen();
  const ci = learner.checkIn;
  const upcoming = learner.milestones.filter((m) => m.state !== 'done').slice(0, 3);
  return (
    <div className="ml-grid">
      <section className="gh-card">
        <h2 className="ml-h2"><Target size={17} aria-hidden="true" />{t('ml.ov.goals')}</h2>
        <h3 className="ml-h3">{t('ml.goals.learner')}</h3>
        {learner.goals.length ? (
          <ul className="ml-list">
            {learner.goals.map((g) => (
              <li key={g.id}>{g.text || t('ml.ov.goalNoText')}
                <span className="ml-cell-sub"> · {g.done ? t('ml.ov.goalDone') : t('ml.ov.goalSteps', { done: g.stepsDone, total: g.stepsTotal })}</span>
              </li>
            ))}
          </ul>
        ) : <NotAvailable>{t('ml.ov.noGoals')}</NotAvailable>}
        <CoachGoals records={records} update={update} today={today} />
      </section>

      <section className="gh-card">
        <h2 className="ml-h2"><Rocket size={17} aria-hidden="true" />{t('ml.ov.project')}</h2>
        {learner.courses.map((c) => <CourseBlock key={c.enrolmentId} course={c} compact go={go} />)}
        {learner.project || learner.programs.length ? (
          <dl className="ml-dl">
            {learner.project && <div><dt>{t('ml.pbl.question')}</dt><dd>{learner.project.title || <NotAvailable>{t('ml.pbl.noQuestion')}</NotAvailable>}</dd></div>}
            {learner.project && <div><dt>{t('ml.pbl.stage')}</dt><dd>{t('ml.pbl.stageOf', { stage: learner.project.phase.title, n: learner.project.phaseIndex + 1, total: learner.project.phaseCount })}</dd></div>}
            {learner.programs.map((p) => (
              <div key={p.id}><dt>{t('ml.pbl.program')}</dt><dd>{p.title} · <Missions p={p} /></dd></div>
            ))}
          </dl>
        ) : !learner.courses.length && <NotAvailable>{t('ml.pbl.none')}</NotAvailable>}
        <h3 className="ml-h3">{t('ml.ov.upcoming')}</h3>
        {upcoming.length ? (
          <ul className="ml-list">
            {upcoming.map((m) => <li key={m.id}>{m.title} <span className={`ml-cell-sub${m.state === 'overdue' ? ' ml-late' : ''}`}>· {m.state === 'overdue' ? t('ml.next.wasDue', { date: day(m.dueOn) }) : t('ml.next.due', { date: day(m.dueOn) })}</span></li>)}
          </ul>
        ) : (
          <p><NotAvailable>{t('ml.ms.none')}</NotAvailable> <button type="button" className="gh-link-btn ml-link" onClick={() => go('projects')}>{t('ml.ms.agreeOne')}</button></p>
        )}
      </section>

      <section className="gh-card">
        <h2 className="ml-h2"><GraduationCap size={17} aria-hidden="true" />{t('ml.ov.academic')}</h2>
        <NotAvailable />
        <p className="ml-source">{t('ml.academic.notConnected')}</p>
        {learner.assignments.length > 0 && (
          <p className="ml-cell-sub">{t('ml.academic.classDeadlines', { count: learner.assignments.length })}</p>
        )}
      </section>

      <section className="gh-card">
        <h2 className="ml-h2"><CalendarCheck size={17} aria-hidden="true" />{t('ml.ov.checkIn')}</h2>
        {ci ? (
          <>
            <p className="ml-cell-sub">{t('ml.ci.on', { date: when(ci.at) })}</p>
            <dl className="ml-dl">
              {ci.strength && <div><dt>{t('ml.ci.strength')}</dt><dd>{ci.strength}</dd></div>}
              {ci.challenge && <div><dt>{t('ml.ci.challenge')}</dt><dd>{ci.challenge}</dd></div>}
              <div className="ml-next-action"><dt>{t('ml.ov.nextAction')}</dt><dd><strong>{ci.nextAction}</strong>
                <div className="ml-cell-sub">{t('ml.ci.followUp', { date: day(ci.followUpOn) })}</div></dd></div>
            </dl>
          </>
        ) : (
          <Empty title={t('ml.ci.noneYet')} body={t('ml.ci.noneBody')}
                 action={<button type="button" className="gh-btn gh-btn-sm" onClick={() => go('notes')}>{t('ml.ci.record')}</button>} />
        )}
      </section>
      <section className="gh-card ml-span">
        <h2 className="ml-h2">{t('ml.ov.nextStep')}</h2>
        <NextCell next={learner.next} day={day} />
      </section>
    </div>
  );
}

/**
 * A course the learner is enrolled in: its phases in order, with the state
 * recorded for each. Phase states are the learner's submissions and your
 * reviews, not a grade.
 */
function CourseBlock({ course, compact, go }) {
  const { t } = useLocale();
  const c = course;
  return (
    <div className="ml-course">
      <dl className="ml-dl">
        <div><dt>{t('ml.course.title')}</dt><dd><strong>{c.title || t('ml.notAvailable')}</strong>
          {!c.defined && <div className="ml-cell-sub">{t('ml.course.noDefinition')}</div>}</dd></div>
        <div><dt>{t('ml.pbl.stage')}</dt><dd>{c.current
          ? t('ml.course.phaseOf', { phase: c.current.title, n: c.current.index + 1, total: c.current.total })
          : <NotAvailable />}</dd></div>
        {!compact && c.drivingQuestion && <div className="ml-next-action"><dt>{t('ml.course.drivingQuestion')}</dt><dd>{c.drivingQuestion}</dd></div>}
      </dl>
      {c.phases.length > 0 && (
        <ol className="ml-phases" aria-label={t('ml.course.phases')}>
          {c.phases.map((ph) => (
            <li key={ph.id} className={`ml-phase ml-phase-${ph.state}${c.current?.id === ph.id ? ' is-current' : ''}`}>
              <span className="ml-phase-title">{ph.title}</span>
              <span className={`ml-phase-state ml-phase-state-${ph.state}`}>{t(`ml.phase.${ph.state}`)}</span>
              {c.current?.id === ph.id && <span className="ml-tag">{t('ml.course.current')}</span>}
            </li>
          ))}
        </ol>
      )}
      {compact && c.phases.some((ph) => ph.state === 'submitted') && go && (
        <button type="button" className="gh-link-btn ml-link" onClick={() => go('evidence')}>{t('ml.course.reviewSubmission')}</button>
      )}
      {!compact && <p className="ml-source">{t('ml.course.statesNote')}</p>}
    </div>
  );
}

/** Goals the coach sets for the learner. Learners see them once WeLearn stores them (not on this device). */
function CoachGoals({ records, update, today }) {
  const { t } = useLocale();
  const day = useDay();
  const [text, setText] = useState('');
  const [dueOn, setDueOn] = useState('');
  const [error, setError] = useState(null);
  const add = (e) => {
    e.preventDefault();
    const res = update((r) => addGoal(r, { text, dueOn }));
    if (res.error) setError(res.error); else { setText(''); setDueOn(''); setError(null); }
  };
  return (
    <>
      <h3 className="ml-h3">{t('ml.goals.coach')}</h3>
      {records.goals.length ? (
        <ul className="ml-list ml-goal-list">
          {records.goals.map((g) => (
            <li key={g.id} className={g.doneOn ? 'is-done' : ''}>
              <span>{g.text}<span className="ml-cell-sub"> · {g.doneOn ? t('ml.ms.done', { date: day(g.doneOn) })
                : g.dueOn ? t('ml.next.due', { date: day(g.dueOn) }) : t('ml.next.noDate')}</span></span>
              <button type="button" className="gh-link-btn" onClick={() => update((r) => setGoalDone(r, g.id, g.doneOn ? null : today))}>
                {g.doneOn ? t('ml.ms.reopen') : t('ml.goals.markMet')}
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="ml-cell-sub">{t('ml.goals.none')}</p>}
      <form className="ml-inline-form" onSubmit={add}>
        <label className="gh-label" htmlFor="ml-goal-text">{t('ml.goals.add')}</label>
        <div className="ml-row">
          <input id="ml-goal-text" className="gh-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={140} placeholder={t('ml.goals.placeholder')} />
          <input className="gh-input ml-date" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} aria-label={t('ml.goals.target')} />
          <button type="submit" className="gh-btn"><Plus size={15} aria-hidden="true" />{t('ml.ms.addBtn')}</button>
        </div>
        <p className="gh-hint">{t('ml.goals.visibility')}</p>
        {error && <p className="gh-field-error" role="alert">{t(`ml.err.${error}`)}</p>}
      </form>
    </>
  );
}

// ---------------------------------------------------------------------------
// Projects & Academics
// ---------------------------------------------------------------------------

function Projects({ learner, records, update, classes, assignmentsFailed, today }) {
  const { t } = useLocale();
  const day = useDay();
  const when = useWhen();
  const [title, setTitle] = useState('');
  const [dueOn, setDueOn] = useState(plusDays(7));
  const [error, setError] = useState(null);
  const p = learner.project;
  const feedback = learner.evidence.filter((e) => e.feedback).slice(0, 3);
  const learnerClasses = classes.filter((c) => learner.classIds.includes(c.id));

  const add = (e) => {
    e.preventDefault();
    const res = update((r) => addMilestone(r, { title, dueOn }));
    if (res.error) setError(res.error); else { setTitle(''); setError(null); }
  };

  return (
    <div className="ml-stack">
      <section className="gh-card">
        <h2 className="ml-h2"><Rocket size={17} aria-hidden="true" />{t('ml.pbl.title')}</h2>
        {learner.courses.map((c) => <CourseBlock key={c.enrolmentId} course={c} />)}
        {learner.courses.length > 0 && <h3 className="ml-h3">{t('ml.pbl.termProject')}</h3>}
        {p ? (
          <>
            <dl className="ml-dl">
              <div><dt>{t('ml.pbl.drivingQuestion')}</dt><dd>{p.drivingQuestion}{p.termDraft && <span className="ml-cell-sub"> · {t('ml.pbl.termDraft')}</span>}</dd></div>
              <div><dt>{t('ml.pbl.question')}</dt><dd>{p.title || <NotAvailable>{t('ml.pbl.noQuestion')}</NotAvailable>}</dd></div>
              <div><dt>{t('ml.pbl.stage')}</dt><dd>{t('ml.pbl.stageOf', { stage: p.phase.title, n: p.phaseIndex + 1, total: p.phaseCount })} · {t('ml.pbl.weeks', { from: p.phase.weeks[0], to: p.phase.weeks[1] })}</dd></div>
            </dl>
            <h3 className="ml-h3">{t('ml.pbl.checklist')} <span className="ml-tag">{t('ml.completion')}</span></h3>
            <ul className="ml-checklist">
              {p.checklist.map((c, i) => (
                <li key={i} className={c.done ? 'is-done' : ''}>
                  <span className="ml-tick" aria-hidden="true">{c.done ? <Check size={13} /> : null}</span>
                  <span className="gh-visually-hidden ml-sr">{c.done ? t('ml.pbl.ticked') : t('ml.pbl.notTicked')}: </span>{c.text}
                </li>
              ))}
            </ul>
            <p className="ml-source">{t('ml.pbl.checklistSource')}</p>
          </>
        ) : <p><NotAvailable>{t('ml.pbl.noTermProject')}</NotAvailable></p>}

        {learner.programs.length > 0 && (
          <>
            <h3 className="ml-h3">{t('ml.pbl.programs')} <span className="ml-tag">{t('ml.completion')}</span></h3>
            <ul className="ml-list">
              {learner.programs.map((pr) => (
                <li key={pr.id}>{pr.title} · <Missions p={pr} />
                  {pr.next && <span className="ml-cell-sub"> · {t('ml.next.session', { n: pr.next.number, title: pr.next.title })}</span>}
                </li>
              ))}
            </ul>
          </>
        )}

        <h3 className="ml-h3">{t('ml.ms.title')}</h3>
        {learner.milestones.length ? (
          <div className="gh-table-wrap">
            <table className="gh-table ml-mini-table">
              <thead><tr><th scope="col">{t('ml.ms.what')}</th><th scope="col">{t('ml.ms.due')}</th><th scope="col">{t('ml.ms.state')}</th><th scope="col"><span className="ml-sr">{t('ml.ms.actions')}</span></th></tr></thead>
              <tbody>
                {learner.milestones.map((m) => (
                  <tr key={m.id}>
                    <td>{m.title}{m.fromCheckIn && <div className="ml-cell-sub">{t('ml.ms.fromCheckIn')}</div>}</td>
                    <td className="gh-nowrap">{day(m.dueOn)}</td>
                    <td><span className={`ml-ms ml-ms-${m.state}`}>{t(`ml.ms.${m.state}`, { date: day(m.doneOn) })}</span></td>
                    <td className="gh-cell-end">
                      {m.state === 'done'
                        ? <button type="button" className="gh-link-btn" onClick={() => update((r) => setMilestoneDone(r, m.id, null))}>{t('ml.ms.reopen')}</button>
                        : <button type="button" className="gh-btn gh-btn-sm" onClick={() => update((r) => setMilestoneDone(r, m.id, today))}>{t('ml.ms.markDone')}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p><NotAvailable>{t('ml.ms.none')}</NotAvailable></p>}
        <form className="ml-inline-form" onSubmit={add}>
          <label className="gh-label" htmlFor="ml-ms-title">{t('ml.ms.add')}</label>
          <div className="ml-row">
            <input id="ml-ms-title" className="gh-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('ml.ms.placeholder')} maxLength={140} />
            <input className="gh-input ml-date" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} aria-label={t('ml.ms.due')} required />
            <button type="submit" className="gh-btn"><Plus size={15} aria-hidden="true" />{t('ml.ms.addBtn')}</button>
          </div>
          {error && <p className="gh-field-error" role="alert">{t(`ml.err.${error}`)}</p>}
        </form>

        <h3 className="ml-h3">{t('ml.pbl.feedback')}</h3>
        {feedback.length ? (
          <ul className="ml-list">
            {feedback.map((e) => <li key={e.key}><strong>{e.title}</strong>: {e.feedback.text} <span className="ml-cell-sub">· {when(e.feedback.at)}</span></li>)}
          </ul>
        ) : <NotAvailable>{t('ml.pbl.noFeedback')}</NotAvailable>}
      </section>

      <section className="gh-card">
        <h2 className="ml-h2"><GraduationCap size={17} aria-hidden="true" />{t('ml.ac.title')}</h2>
        <Alert type="info">{t('ml.academic.notConnected')}</Alert>
        <dl className="ml-dl">
          <div><dt>{t('ml.ac.courses')}</dt><dd>{learnerClasses.length ? learnerClasses.map((c) => c.name || c.id).join(', ') : <NotAvailable />}
            <div className="ml-cell-sub">{t('ml.ac.coursesNote')}</div></dd></div>
          <div><dt>{t('ml.ac.results')}</dt><dd><NotAvailable /></dd></div>
          <div><dt>{t('ml.ac.schedule')}</dt><dd><NotAvailable /></dd></div>
        </dl>
        <h3 className="ml-h3">{t('ml.ac.assignments')} <span className="ml-tag">{t('ml.completion')}</span></h3>
        {assignmentsFailed ? <NotAvailable>{t('ml.ac.assignmentsFailed')}</NotAvailable>
          : learner.assignments.length ? (
            <ul className="ml-list">
              {learner.assignments.map((a) => (
                <li key={a.id}>{a.title} <span className="ml-cell-sub">· {a.dueOn ? t('ml.next.due', { date: day(a.dueOn) }) : t('ml.next.noDate')} · {t('ml.ac.completionUnknown')}</span></li>
              ))}
            </ul>
          ) : <NotAvailable>{t('ml.ac.noAssignments')}</NotAvailable>}
        <p className="ml-source">{t('ml.ac.separate')}</p>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Evidence & Competencies
// ---------------------------------------------------------------------------

const KIND_LABEL = Object.fromEntries(EVIDENCE_KINDS.map((k) => [k.id, k.label]));
/** Kinds a coach adds evidence as: an observation or a link to a document, photo, video or design. */
const COACH_KINDS = ['note', 'media', 'design', 'data', 'feedback'];

function Evidence({ learner, records, update, coachUid, reload }) {
  const { t } = useLocale();
  const [view, setView] = useState(learner.waitingKeys.length ? 'waiting' : 'all');
  const [adding, setAdding] = useState(false);
  const rows = useMemo(() => competencyRows(learner, records), [learner, records]);
  const list = view === 'waiting' ? learner.evidence.filter((e) => learner.waitingKeys.includes(e.key)) : learner.evidence;

  return (
    <div className="ml-stack">
      <section className="gh-card">
        <div className="ml-section-head">
          <h2 className="ml-h2"><Image size={17} aria-hidden="true" />{t('ml.ev.title')}</h2>
          <div className="gh-segmented" role="radiogroup" aria-label={t('ml.filter')}>
            <button type="button" role="radio" aria-checked={view === 'waiting'} onClick={() => setView('waiting')}>{t('ml.ev.waiting', { count: learner.waitingKeys.length })}</button>
            <button type="button" role="radio" aria-checked={view === 'all'} onClick={() => setView('all')}>{t('ml.ev.all', { count: learner.evidence.length })}</button>
          </div>
          <button type="button" className="gh-btn gh-btn-sm" onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
            <Plus size={15} aria-hidden="true" />{t('ml.ev.add')}
          </button>
        </div>
        {adding && <AddEvidence learner={learner} update={update} onDone={() => { setAdding(false); setView('all'); }} />}
        {list.length ? (
          <ul className="ml-evidence">
            {list.map((e) => <EvidenceItem key={e.key} item={e} learner={learner} update={update} waiting={learner.waitingKeys.includes(e.key)}
                                            coachUid={coachUid} reload={reload} />)}
          </ul>
        ) : (
          <Empty icon={Image} title={view === 'waiting' ? t('ml.ev.noneWaiting') : t('ml.ev.none')} body={view === 'waiting' ? null : t('ml.ev.noneBody')} />
        )}
      </section>

      <section className="gh-card">
        <h2 className="ml-h2">{t('ml.comp.title')}</h2>
        <p className="ml-source">{t('ml.comp.explain')}</p>
        {rows.length ? (
          <div className="gh-table-wrap">
            <table className="gh-table ml-mini-table">
              <thead><tr><th scope="col">{t('ml.comp.competency')}</th><th scope="col">{t('ml.comp.self')}</th><th scope="col">{t('ml.comp.coach')}</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.competency.title}</strong><div className="ml-cell-sub">{r.competency.statement}</div></td>
                    <td>{r.selfEvidenceCount ? t(r.selfEvidenceCount === 1 ? 'ml.comp.selfTaggedOne' : 'ml.comp.selfTagged', { count: r.selfEvidenceCount }) : <NotAvailable>{t('ml.comp.notTagged')}</NotAvailable>}</td>
                    <td>{r.coach ? <LevelBadge level={r.coach.level} /> : <NotAvailable>{t('ml.comp.notJudged')}</NotAvailable>}
                      {r.coach && <div className="ml-cell-sub">{t(r.coach.evidenceKeys.length === 1 ? 'ml.comp.fromEvidenceOne' : 'ml.comp.fromEvidence', { count: r.coach.evidenceKeys.length })}</div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title={t('ml.comp.none')} body={t('ml.comp.noneBody')} />}
      </section>
    </div>
  );
}

function LevelBadge({ level }) {
  const { t } = useLocale();
  return <span className={`ml-level ml-level-${level}`}>{t(`ml.level.${level}`)}</span>;
}

function EvidenceItem({ item, learner, update, waiting, coachUid, reload }) {
  const { t } = useLocale();
  const when = useWhen();
  const [mode, setMode] = useState(null); // 'feedback' | 'assess'
  const [text, setText] = useState(item.feedback?.text || '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const phase = PHASES.find((ph) => ph.id === item.phase);
  const saveFeedback = async (e) => {
    e.preventDefault();
    if (item.remote) {
      // Phase submissions: written to the learner's record in WeLearn, which the learner can read.
      setSaving(true);
      const res = await saveSubmissionFeedback(item.remote, text, coachUid);
      setSaving(false);
      if (res.error) { setError(res.error); return; }
      setMode(null); setError(null);
      reload?.();
      return;
    }
    const res = update((r) => setFeedback(r, item.key, text));
    if (res.error) setError(res.error); else { setMode(null); setError(null); }
  };
  return (
    <li className={`ml-ev${waiting ? ' is-waiting' : ''}`}>
      <div className="ml-ev-head">
        <span className="ml-tag">{item.kind === 'submission' ? t('ml.ev.submission') : (KIND_LABEL[item.kind] || item.kind)}</span>
        {item.remote && (item.submitted
          ? <span className="ml-tag ml-tag-wait">{t('ml.ev.submitted')}</span>
          : item.feedback && <span className="ml-tag ml-tag-done"><Check size={12} aria-hidden="true" />{t('ml.ev.reviewed')}</span>)}
        <strong className="ml-ev-title">{item.title}</strong>
        <span className="ml-cell-sub">
          {item.source === 'coach' ? t('ml.ev.byCoach') : t('ml.ev.byLearner')}
          {' · '}{item.kind === 'submission' ? item.projectTitle
            : item.projectTitle ? t('ml.next.session', { n: item.session, title: item.projectTitle })
            : phase ? phase.title : t('ml.ev.termProject')}
          {' · '}{item.at ? (item.dateExact ? when(item.at) : t('ml.ev.approxDate', { date: when(item.at) })) : t('ml.notAvailable')}
        </span>
      </div>
      {item.body && <p className="ml-ev-body">{item.kind === 'reflection' && <span className="ml-label-inline">{t('ml.ev.reflection')}: </span>}{item.body}</p>}
      {[item.link, ...(item.links || [])].filter(Boolean).map((href, i) => (
        <a key={i} className="ml-ev-link" href={href} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} aria-hidden="true" />{t('ml.ev.openLink')}{(item.links || []).length > 1 ? ` ${i + 1}` : ''}</a>
      ))}
      {item.remote && !item.body && !(item.links || []).length && <p className="ml-cell-sub">{t('ml.ev.submittedEmpty')}</p>}
      {(item.selfTags.length > 0 || item.confidence) && (
        <p className="ml-self"><span className="ml-label-inline">{t('ml.ev.selfAssessment')}:</span>{' '}
          {item.selfTags.map((id) => competencyById(id)?.title).filter(Boolean).join(', ')}
          {item.confidence ? `${item.selfTags.length ? ' · ' : ''}${t('ml.ev.confidence', { n: item.confidence })}` : ''}
        </p>
      )}
      {item.assessments.length > 0 && (
        <ul className="ml-judged">
          {item.assessments.map((a) => (
            <li key={a.id}><LevelBadge level={a.level} /> {competencyById(a.competencyId)?.title}{a.note && <span className="ml-cell-sub"> · {a.note}</span>}</li>
          ))}
        </ul>
      )}
      {item.feedback && mode !== 'feedback' && (
        <p className="ml-feedback"><span className="ml-label-inline">{t(item.remote ? 'ml.ev.coachFeedback' : 'ml.ev.yourFeedback')}:</span> {item.feedback.text} <span className="ml-cell-sub">· {when(item.feedback.at)}{item.remote ? ` · ${t('ml.ev.learnerSees')}` : ''}</span>
          {item.remote && item.submitted && <span className="ml-cell-sub ml-block">{t('ml.ev.resubmitted')}</span>}</p>
      )}
      {mode === 'feedback' && (
        <form className="ml-inline-form" onSubmit={saveFeedback}>
          <label className="gh-label" htmlFor={`fb-${item.key}`}>{t('ml.ev.feedbackLabel')}</label>
          <textarea id={`fb-${item.key}`} className="gh-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={1200} autoFocus
                    aria-describedby={`fb-${item.key}-hint`} />
          <p className="gh-hint" id={`fb-${item.key}-hint`}>{t(item.remote ? 'ml.ev.feedbackRemoteHint' : 'ml.ev.feedbackLocalHint')}</p>
          {error && <p className="gh-field-error" role="alert">{t(`ml.err.${error}`)}</p>}
          <div className="gh-btn-row"><button type="submit" className="gh-btn gh-btn-primary" disabled={saving}>
            {saving ? t('ml.ev.saving') : t(item.remote ? 'ml.ev.saveFeedbackRemote' : 'ml.ev.saveFeedback')}</button>
            <button type="button" className="gh-btn" onClick={() => setMode(null)}>{t('ml.cancel')}</button></div>
        </form>
      )}
      {mode === 'assess' && <AssessForm item={item} learner={learner} update={update} onDone={() => setMode(null)} />}
      {!mode && (
        <div className="ml-ev-actions">
          <button type="button" className="gh-btn gh-btn-sm" onClick={() => setMode('feedback')}>{item.feedback ? t('ml.ev.editFeedback') : t('ml.ev.addFeedback')}</button>
          <button type="button" className="gh-btn gh-btn-sm" onClick={() => setMode('assess')}><Link2 size={14} aria-hidden="true" />{t('ml.ev.linkCompetency')}</button>
        </div>
      )}
    </li>
  );
}

/** Competencies offered first: the ones the learner tagged and the current phase's, then the whole framework by domain. */
function CompetencySelect({ id, value, onChange, suggested }) {
  const { t } = useLocale();
  return (
    <select id={id} className="gh-input gh-select" value={value} onChange={(e) => onChange(e.target.value)} required>
      <option value="">{t('ml.comp.choose')}</option>
      {suggested.length > 0 && (
        <optgroup label={t('ml.comp.suggested')}>
          {suggested.map((cid) => <option key={`s-${cid}`} value={cid}>{competencyById(cid).title}</option>)}
        </optgroup>
      )}
      {COMPETENCY_DOMAINS.map((d) => (
        <optgroup key={d.id} label={d.title}>
          {COMPETENCIES.filter((c) => c.domain === d.id).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

function AssessForm({ item, learner, update, onDone }) {
  const { t } = useLocale();
  const phase = PHASES.find((ph) => ph.id === item.phase);
  const fromProject = item.project && item.project !== 'term'
    ? programCompetencies(programById(item.project))
    : (phase?.competencies || learner.project?.phaseCompetencies || []);
  const suggested = [...new Set([...item.selfTags, ...fromProject])].filter((id) => competencyById(id));
  const [competencyId, setCompetencyId] = useState(suggested[0] || '');
  const [level, setLevel] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const save = (e) => {
    e.preventDefault();
    const res = update((r) => addAssessment(r, { competencyId, level, evidenceKeys: [item.key], note }));
    if (res.error) setError(res.error); else onDone();
  };
  const cid = `as-${item.key}`;
  return (
    <form className="ml-inline-form ml-assess" onSubmit={save}>
      <label className="gh-label" htmlFor={cid}>{t('ml.comp.competency')}</label>
      <CompetencySelect id={cid} value={competencyId} onChange={setCompetencyId} suggested={suggested} />
      {competencyId && <p className="gh-hint">{competencyById(competencyId)?.statement}</p>}
      <fieldset className="ml-levels">
        <legend className="gh-label">{t('ml.comp.levelLegend')}</legend>
        {LEVELS.map((l) => (
          <label key={l} className="ml-level-opt">
            <input type="radio" name={`lv-${item.key}`} value={l} checked={level === l} onChange={() => setLevel(l)} required />
            <span><strong>{t(`ml.level.${l}`)}</strong><span className="ml-cell-sub"> {t(`ml.level.${l}.hint`)}</span></span>
          </label>
        ))}
      </fieldset>
      <label className="gh-label" htmlFor={`${cid}-note`}>{t('ml.comp.note')} <span className="gh-opt">({t('common.optional')})</span></label>
      <input id={`${cid}-note`} className="gh-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
      {error && <p className="gh-field-error" role="alert">{t(`ml.err.${error}`)}</p>}
      <div className="gh-btn-row"><button type="submit" className="gh-btn gh-btn-primary">{t('ml.comp.save')}</button>
        <button type="button" className="gh-btn" onClick={onDone}>{t('ml.cancel')}</button></div>
    </form>
  );
}

function AddEvidence({ learner, update, onDone }) {
  const { t } = useLocale();
  const [form, setForm] = useState({ kind: 'note', title: '', link: '', body: '', phase: learner.project?.phase.id || '' });
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = (e) => {
    e.preventDefault();
    const res = update((r) => addCoachEvidence(r, form));
    if (res.error) setError(res.error); else onDone();
  };
  return (
    <form className="ml-inline-form ml-add-evidence" onSubmit={save}>
      <div className="gh-form-grid">
        <div>
          <label className="gh-label" htmlFor="ae-kind">{t('ml.ev.kind')}</label>
          <select id="ae-kind" className="gh-input gh-select" value={form.kind} onChange={set('kind')}>
            {COACH_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </div>
        <div>
          <label className="gh-label" htmlFor="ae-phase">{t('ml.ev.phase')}</label>
          <select id="ae-phase" className="gh-input gh-select" value={form.phase} onChange={set('phase')}>
            <option value="">{t('ml.ev.noPhase')}</option>
            {PHASES.map((ph) => <option key={ph.id} value={ph.id}>{ph.title}</option>)}
          </select>
        </div>
        <div className="gh-span">
          <label className="gh-label" htmlFor="ae-title">{t('ml.ev.titleLabel')}</label>
          <input id="ae-title" className="gh-input" value={form.title} onChange={set('title')} maxLength={140} required />
        </div>
        <div className="gh-span">
          <label className="gh-label" htmlFor="ae-link">{t('ml.ev.link')} {form.kind === 'note' && <span className="gh-opt">({t('common.optional')})</span>}</label>
          <input id="ae-link" className="gh-input" type="url" value={form.link} onChange={set('link')} placeholder="https://" aria-describedby="ae-link-hint" />
          <p className="gh-hint" id="ae-link-hint">{t('ml.ev.linkHint')}</p>
        </div>
        <div className="gh-span">
          <label className="gh-label" htmlFor="ae-body">{t('ml.ev.description')} <span className="gh-opt">({t('common.optional')})</span></label>
          <textarea id="ae-body" className="gh-input" value={form.body} onChange={set('body')} maxLength={1200} />
        </div>
      </div>
      {error && <p className="gh-field-error" role="alert">{t(`ml.err.${error}`)}</p>}
      <div className="gh-btn-row"><button type="submit" className="gh-btn gh-btn-primary">{t('ml.ev.save')}</button>
        <button type="button" className="gh-btn" onClick={onDone}>{t('ml.cancel')}</button></div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Coaching Notes
// ---------------------------------------------------------------------------

function Notes({ learner, records, update }) {
  const { t } = useLocale();
  const when = useWhen();
  const day = useDay();
  const blank = { strength: '', challenge: '', nextAction: '', followUpOn: plusDays(7), asMilestone: true, shareWithParent: false };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = (e) => {
    e.preventDefault();
    const res = update((r) => addCheckIn(r, form));
    if (res.error) { setError(res.error); setSaved(false); } else { setForm(blank); setError(null); setSaved(true); }
  };
  const history = records.checkIns;

  return (
    <div className="ml-stack">
      <section className="gh-card">
        <h2 className="ml-h2"><CalendarCheck size={17} aria-hidden="true" />{t('ml.ci.title')}</h2>
        <form onSubmit={save} className="ml-checkin" noValidate>
          <div className="gh-form-grid">
            <div>
              <label className="gh-label" htmlFor="ci-strength">{t('ml.ci.strength')}</label>
              <textarea id="ci-strength" className="gh-input" value={form.strength} onChange={set('strength')} maxLength={1200} placeholder={t('ml.ci.strengthPh')} />
            </div>
            <div>
              <label className="gh-label" htmlFor="ci-challenge">{t('ml.ci.challenge')}</label>
              <textarea id="ci-challenge" className="gh-input" value={form.challenge} onChange={set('challenge')} maxLength={1200} placeholder={t('ml.ci.challengePh')} />
            </div>
            <div>
              <label className="gh-label" htmlFor="ci-next">{t('ml.ci.nextAction')}</label>
              <input id="ci-next" className="gh-input" value={form.nextAction} onChange={set('nextAction')} maxLength={140} required
                     aria-invalid={error === 'nextActionRequired' ? 'true' : undefined} placeholder={t('ml.ci.nextPh')} />
            </div>
            <div>
              <label className="gh-label" htmlFor="ci-follow">{t('ml.ci.followUpOn')}</label>
              <input id="ci-follow" className="gh-input" type="date" value={form.followUpOn} onChange={set('followUpOn')} required />
            </div>
          </div>
          <label className="gh-check ml-check"><input type="checkbox" checked={form.asMilestone} onChange={set('asMilestone')} />{t('ml.ci.asMilestone')}</label>
          <label className="gh-check ml-check"><input type="checkbox" checked={form.shareWithParent} onChange={set('shareWithParent')} />
            <span>{t('ml.ci.share')}<span className="gh-hint ml-block">{t('ml.ci.shareHint')}</span></span></label>
          {error && <p className="gh-field-error" role="alert">{t(`ml.err.${error}`)}</p>}
          {saved && <p className="ml-saved" role="status"><Check size={14} aria-hidden="true" />{t('ml.ci.saved')}</p>}
          <div className="gh-btn-row"><button type="submit" className="gh-btn gh-btn-primary">{t('ml.ci.save')}</button></div>
        </form>
        {history.length > 0 && (
          <details className="ml-history">
            <summary>{t('ml.ci.history', { count: history.length })}</summary>
            <ul className="ml-list">
              {history.map((c) => (
                <li key={c.id}>
                  <strong>{when(c.at)}</strong>{' '}
                  {c.shareWithParent ? <span className="ml-tag ml-tag-share"><Users size={12} aria-hidden="true" />{t('ml.notes.sharedTag')}</span>
                    : <span className="ml-tag"><Lock size={12} aria-hidden="true" />{t('ml.notes.privateTag')}</span>}
                  <div className="ml-cell-sub">
                    {[c.strength && `${t('ml.ci.strength')}: ${c.strength}`, c.challenge && `${t('ml.ci.challenge')}: ${c.challenge}`,
                      `${t('ml.ci.nextAction')}: ${c.nextAction} (${day(c.followUpOn)})`].filter(Boolean).join(' · ')}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <div className="ml-notes-split">
        <NoteColumn visibility="private" icon={Lock} records={records} update={update} />
        <NoteColumn visibility="parent" icon={Users} records={records} update={update} />
      </div>
    </div>
  );
}

function NoteColumn({ visibility, icon: Icon, records, update }) {
  const { t } = useLocale();
  const when = useWhen();
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const notes = records.notes.filter((n) => n.visibility === visibility);
  const id = `note-${visibility}`;
  const add = (e) => {
    e.preventDefault();
    const res = update((r) => addNote(r, { text, visibility }));
    if (res.error) setError(res.error); else { setText(''); setError(null); }
  };
  return (
    <section className={`gh-card ml-notes ml-notes-${visibility}`} aria-labelledby={`${id}-h`}>
      <h2 className="ml-h2" id={`${id}-h`}><Icon size={17} aria-hidden="true" />{t(`ml.notes.${visibility}.title`)}</h2>
      <p className="ml-source">{t(`ml.notes.${visibility}.explain`)}</p>
      <form onSubmit={add}>
        <label className="gh-label ml-sr" htmlFor={id}>{t(`ml.notes.${visibility}.add`)}</label>
        <textarea id={id} className="gh-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={1200} placeholder={t(`ml.notes.${visibility}.add`)} />
        {error && <p className="gh-field-error" role="alert">{t(`ml.err.${error}`)}</p>}
        <div className="gh-btn-row"><button type="submit" className="gh-btn gh-btn-sm"><StickyNote size={14} aria-hidden="true" />{t('ml.notes.save')}</button></div>
      </form>
      {notes.length ? (
        <ul className="ml-list ml-note-list">
          {notes.map((n) => (
            <li key={n.id}><p>{n.text}</p>
              <span className="ml-cell-sub">{when(n.at)} · <button type="button" className="gh-link-btn" onClick={() => update((r) => removeNote(r, n.id))}>{t('ml.notes.remove')}</button></span>
            </li>
          ))}
        </ul>
      ) : <p className="ml-cell-sub">{t('ml.notes.none')}</p>}
    </section>
  );
}
