/**
 * My Learners (coach): turns a learner's saved records and the coach's own
 * records into what the coach needs to see. Pure; tested in
 * tests/coach-my-learners.test.js.
 *
 * Learner records (read from Firestore, never written here):
 *   users/{uid}                                     goal plan, classes, year level
 *   users/{uid}/activityProgress/pbl-<termId>      the term project and its evidence
 *   users/{uid}/activityProgress/pbl-program-<id>  PBL program missions, reflections, confidence
 *   users/{uid}/dailyStats/{day}                   minutes on the platform
 *   assignments (classId of the learner's class)    class deadlines, no per-learner completion
 *   enrolments/{learner_program}/phaseProgress/{phase}  phase submissions; the coach's
 *                                                   feedback is written back there (coachFeedback)
 *
 * Coach records (check-ins, notes, agreed milestones, feedback, competency
 * judgements, reports) come from coachRecordsStore.js.
 *
 * Rules this file keeps:
 *   - Status comes only from agreed dates and recorded evidence. Missing data is
 *     "not available", never a sign of poor progress.
 *   - Task completion (ticked tasks, missions done) and demonstrated
 *     understanding (coach competency judgements) are kept apart and never
 *     combined into one score.
 *   - The learner's own competency tags and confidence are self-assessment and
 *     are never shown as the coach's judgement.
 *   - Private notes are never read by the report builder.
 *
 * Everything returns codes and values, not sentences, so the screens can
 * translate them.
 */
import { hydratePlan, dayKey } from '../../goals/goalPlan.js';
import { TERM, PHASES, EVIDENCE_KINDS } from '../../pbl/content/pblModel.js';
import { hydrateProject } from '../../pbl/engine/pblProject.js';
import { competencyById } from '../../pbl/content/competencies.js';
import { displayName, programSummaries as rawProgramSummaries, minutesByDay } from '../learners/learnersModel.js';
import { programById } from '../../pbl/programs/catalog.js';

/**
 * Program summaries, with completion withheld when the program's content
 * repeats a session number: one ticked session would otherwise count as
 * several, and the coach would see progress that was never made.
 */
export function programSummaries(progressDocs) {
  return rawProgramSummaries(progressDocs).map((p) => {
    const nums = (programById(p.id)?.sessions || []).map((s) => s.sessionNumber);
    const reliable = new Set(nums).size === nums.length;
    return reliable ? { ...p, countReliable: true } : { ...p, countReliable: false, done: null, total: null, pct: null, next: null };
  });
}

const DAY_MS = 86400000;
/** Evidence a learner logged this long ago or more, with no feedback, is still listed but no longer flagged. */
export const FEEDBACK_WINDOW_DAYS = 28;
/** A record older than this, at the end of a report period, is flagged as possibly out of date. */
export const STALE_DAYS = 30;

export const STATUS = {
  overdue: { id: 'overdue', rank: 0, tone: 'red', urgent: true },
  feedback: { id: 'feedback', rank: 1, tone: 'amber', urgent: false },
  checkin: { id: 'checkin', rank: 2, tone: 'blue', urgent: false },
  ontrack: { id: 'ontrack', rank: 3, tone: 'green', urgent: false }
};

export const LEVELS = ['independent', 'support', 'insufficient'];

const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const dayStart = (key) => new Date(`${key}T00:00:00`).getTime();
/** Whole days from `a` to `b` (both day keys). Positive when b is later. */
export const daysBetween = (a, b) => Math.round((dayStart(b) - dayStart(a)) / DAY_MS);
const dayOf = (ms) => (Number.isFinite(ms) && ms > 0 ? dayKey(new Date(ms)) : null);

export const termProjectDocId = (termId = TERM.id) => `pbl-${termId}`;

/** The learner's term project, or null when they have not started one. */
export function termProject(progressDocs, termId = TERM.id) {
  const d = (progressDocs || []).find((x) => x.id === termProjectDocId(termId));
  if (!d) return null;
  const p = hydrateProject(d.data, termId);
  const started = p.updatedAt || p.evidence.length || p.problem.hmw.trim() || Object.keys(p.tasksDone).length;
  return started ? p : null;
}

function projectSummary(project) {
  if (!project) return null;
  const phase = PHASES.find((ph) => ph.id === project.currentPhase) || PHASES[0];
  const done = new Set(project.tasksDone[phase.id] || []);
  return {
    title: project.problem.hmw.trim() || null,
    drivingQuestion: TERM.drivingQuestion,
    termLabel: TERM.label,
    termDraft: Boolean(TERM.draft),
    phase: { id: phase.id, title: phase.title, weeks: phase.weeks },
    phaseIndex: PHASES.indexOf(phase),
    phaseCount: PHASES.length,
    checklist: phase.tasks.map((text, i) => ({ text, done: done.has(i) })),
    phaseCompetencies: phase.competencies || [],
    updatedAt: project.updatedAt
  };
}

/**
 * Every piece of evidence about this learner, newest first, keyed so coach
 * feedback and judgements can point at it.
 *   proj:<id>          an entry in the learner's term portfolio
 *   prog:<program>:<n> a PBL program session the learner reflected on or submitted work for
 *   coach:<id>         evidence the coach added (an observation, a photo link)
 */
export function evidenceItems({ project, progressDocs, programs, records, enrolments = [] }) {
  const out = [];
  // Phase submissions: the learner submitted a program phase for review. These
  // are the only evidence whose feedback lives in Firestore (phaseProgress.coachFeedback),
  // so the learner sees it; "awaiting" is the record's own status.
  for (const en of enrolments) {
    const program = programById(en.data?.programId);
    for (const ph of en.phases || []) {
      const d = ph.data || {};
      const items = (Array.isArray(d.evidence) ? d.evidence : []).filter((x) => x && typeof x === 'object');
      if (!items.length && d.status !== 'submitted') continue;
      const phase = (program?.phases || []).find((x) => (x.id || x.phaseId) === ph.id);
      // When the learner submitted: the newest evidence entry. updatedAt also moves when the coach reviews, so it is only a fallback.
      const submittedAt = Math.max(0, ...items.map((x) => (Number.isFinite(x.at) ? x.at : 0)));
      const latest = submittedAt || (Number.isFinite(d.updatedAt) ? d.updatedAt : 0);
      const cf = d.coachFeedback && typeof d.coachFeedback === 'object' && String(d.coachFeedback.text || '').trim() ? d.coachFeedback : null;
      out.push({
        key: `phase:${en.id}:${ph.id}`, source: 'learner', kind: 'submission', remote: { enrolmentId: en.id, phaseId: ph.id },
        title: phase?.title || ph.id, project: en.data?.programId || null,
        projectTitle: program ? (program.identity?.short || program.title) : (en.data?.programId || null),
        body: items.map((x) => String(x.note || '').trim()).filter(Boolean).join('\n'),
        links: items.map((x) => x.url).filter((u) => typeof u === 'string' && /^https?:\/\//.test(u)),
        link: '', selfTags: [], at: latest || null, dateExact: true,
        submitted: d.status === 'submitted',
        remoteFeedback: cf ? { text: String(cf.text), at: Number.isFinite(cf.at) ? cf.at : null, remote: true } : null
      });
    }
  }
  for (const e of project?.evidence || []) {
    out.push({
      key: `proj:${e.id}`, source: 'learner', kind: e.kind, title: e.title, body: e.kind === 'ai' ? (e.ai?.kept || e.body) : e.body,
      link: e.link || '', phase: e.phase, project: 'term', selfTags: e.competencies || [], at: e.createdAt || null, dateExact: true
    });
  }
  for (const prog of programs || []) {
    const doc = (progressDocs || []).find((d) => d.id === `pbl-program-${prog.id}`);
    const sessions = doc?.data?.sessions || {};
    // Some program content repeats a session number; one stored entry is one piece of evidence.
    const seen = new Set();
    for (const r of prog.reflections) {
      if (seen.has(r.session)) continue;
      seen.add(r.session);
      const links = Object.values(sessions[r.session]?.submissions || {}).filter((v) => typeof v === 'string' && /^https?:\/\//.test(v));
      out.push({
        key: `prog:${prog.id}:${r.session}`, source: 'learner', kind: 'reflection', title: r.title, body: r.text, link: links[0] || '',
        project: prog.id, projectTitle: prog.title, session: r.session, confidence: sessions[r.session]?.confidence ?? null,
        selfTags: [], at: prog.updatedAt || null, dateExact: false
      });
    }
  }
  for (const e of records?.evidence || []) {
    out.push({
      key: `coach:${e.id}`, source: 'coach', kind: e.kind, title: e.title, body: e.body || '', link: e.link || '',
      phase: e.phase || null, project: e.project || 'term', selfTags: [], at: e.at || null, dateExact: true
    });
  }
  const feedback = records?.feedback || {};
  return out
    .map((e) => ({
      ...e,
      feedback: e.remote ? e.remoteFeedback : (feedback[e.key] || null),
      // A phase submission waits until the coach reviews it, however old; other evidence waits until it has feedback.
      awaiting: e.source === 'learner' && (e.remote ? e.submitted : !feedback[e.key]),
      assessments: (records?.assessments || []).filter((a) => (a.evidenceKeys || []).includes(e.key))
    }))
    .sort((a, b) => (b.at || 0) - (a.at || 0));
}

/** Agreed milestones, oldest due date first, each with its state on `today`. */
export function milestoneList(records, today) {
  return (records?.milestones || [])
    .filter((m) => m && isDay(m.dueOn) && m.title)
    .map((m) => {
      const state = m.doneOn ? 'done' : m.dueOn < today ? 'overdue' : 'upcoming';
      return { ...m, state, daysLate: state === 'overdue' ? daysBetween(m.dueOn, today) : 0, daysLeft: state === 'upcoming' ? daysBetween(today, m.dueOn) : 0 };
    })
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn));
}

export function latestCheckIn(records) {
  const list = (records?.checkIns || []).filter((c) => c && c.at);
  return list.length ? list.reduce((a, b) => (b.at > a.at ? b : a)) : null;
}

/**
 * Attention status with its reasons. Reasons are listed most urgent first; the
 * status is the most urgent reason, or "on track" when there is none.
 */
export function attention({ milestones, evidence, checkIn, today }) {
  const reasons = [];
  for (const m of milestones.filter((x) => x.state === 'overdue')) {
    reasons.push({ status: 'overdue', code: 'milestoneOverdue', title: m.title, dueOn: m.dueOn, days: m.daysLate });
  }
  const waiting = evidence.filter((e) => e.awaiting
    && (e.remote || (e.at && daysBetween(dayOf(e.at), today) < FEEDBACK_WINDOW_DAYS)));
  if (waiting.length) {
    const oldest = Math.max(0, ...waiting.filter((e) => e.at).map((e) => daysBetween(dayOf(e.at), today)));
    reasons.push({ status: 'feedback', code: 'evidenceWaiting', count: waiting.length, days: oldest, title: waiting[0].title });
  }
  if (!checkIn) reasons.push({ status: 'checkin', code: 'noCheckIn' });
  else if (isDay(checkIn.followUpOn) && checkIn.followUpOn <= today) {
    reasons.push({ status: 'checkin', code: 'followUpDue', dueOn: checkIn.followUpOn, days: daysBetween(checkIn.followUpOn, today) });
  }
  const status = reasons.length ? STATUS[reasons[0].status] : STATUS.ontrack;
  return { status, reasons, waitingKeys: waiting.map((e) => e.key) };
}

/**
 * What comes next, in this order: the earliest open agreed milestone (even if
 * overdue), the next class assignment deadline, then the next program session
 * (which has no agreed date).
 */
export function nextStep({ milestones, assignments, programs, today }) {
  const open = milestones.find((m) => m.state !== 'done');
  if (open) return { type: 'milestone', title: open.title, dueOn: open.dueOn, state: open.state };
  const due = (assignments || []).filter((a) => isDay(a.dueOn) && a.dueOn >= today).sort((a, b) => a.dueOn.localeCompare(b.dueOn))[0];
  if (due) return { type: 'assignment', title: due.title, dueOn: due.dueOn, state: 'upcoming' };
  const prog = (programs || []).find((p) => p.next);
  if (prog) return { type: 'session', title: prog.next.title, session: prog.next.number, programTitle: prog.title, dueOn: null };
  return null;
}

/** Class assignments as { id, title, dueOn, classId } for the learner's classes. Completion is not recorded anywhere. */
export function assignmentsFor(assignments, classIds) {
  return (assignments || [])
    .filter((a) => a && a.title && classIds.includes(a.classId))
    .map((a) => ({ id: a.id, title: String(a.title), classId: a.classId, dueOn: Number.isFinite(a.dueAt) ? dayKey(new Date(a.dueAt)) : (isDay(a.dueOn) ? a.dueOn : null) }))
    .sort((a, b) => (a.dueOn || '9999').localeCompare(b.dueOn || '9999'));
}

/** The learner's own goals from their goal plan; null when the plan could not be read. */
function learnerGoals(user) {
  if (!user.goalPlan) return [];
  const plan = hydratePlan(user.goalPlan);
  return plan.goals.map((g) => ({ id: g.id, text: g.explore, done: g.done, stepsDone: g.steps.filter((s) => s.done).length, stepsTotal: g.steps.length }));
}

/**
 * One learner, everything the home table and the profile need.
 * `raw` = { user, progress, stats, readFailed } from the loader; `records` from the coach store.
 */
export function buildLearner(raw, records = {}, { assignments = [], classes = [], today = dayKey() } = {}) {
  const { user, progress = [], stats = [], enrolments = [], readFailed = false } = raw;
  const classIds = Array.isArray(user.classIds) ? user.classIds : [];
  const project = termProject(progress);
  const programs = programSummaries(progress);
  const evidence = evidenceItems({ project, progressDocs: progress, programs, records, enrolments });
  const milestones = milestoneList(records, today);
  const checkIn = latestCheckIn(records);
  const myAssignments = assignmentsFor(assignments, classIds);
  const att = attention({ milestones, evidence, checkIn, today });
  const minutes = minutesByDay(stats);
  const activeDays = Object.keys(minutes).sort();
  const lastSaved = Math.max(0, project?.updatedAt || 0, ...programs.map((p) => p.updatedAt || 0), ...activeDays.map(dayStart));

  return {
    uid: user.uid,
    name: displayName(user),
    email: user.email || '',
    yearLevel: user.yearLevel || '',
    classIds,
    classNames: classIds.map((id) => classes.find((c) => c.id === id)?.name || id),
    accountStatus: user.status || 'active',
    readFailed,
    goals: learnerGoals(user),
    project: projectSummary(project),
    programs,
    evidence,
    milestones,
    assignments: myAssignments,
    checkIn,
    next: nextStep({ milestones, assignments: myAssignments, programs, today }),
    status: att.status,
    reasons: att.reasons,
    waitingKeys: att.waitingKeys,
    // No academic platform is connected: every academic field is "not available".
    academic: { connected: false, source: 'edmentum' },
    lastSavedAt: lastSaved || null,
    currentProjectTitle: project ? (project.problem.hmw.trim() || null) : (programs[0]?.title || null),
    currentProjectKind: project ? 'term' : programs[0] ? 'program' : null
  };
}

// ---------------------------------------------------------------------------
// Home: search, filters, sort
// ---------------------------------------------------------------------------

/** Within one status, the longer something has waited the higher it sorts; "never checked in" comes after a missed follow-up. */
const urgency = (l) => (l.reasons[0] ? (l.reasons[0].code === 'noCheckIn' ? -1 : l.reasons[0].days ?? 0) : 0);

export const FILTERS = ['all', 'attention', 'overdue', 'feedback', 'checkin', 'ontrack'];

export function filterLearners(list, { query = '', filter = 'all', classId = 'all' } = {}) {
  const q = query.trim().toLowerCase();
  return list
    .filter((l) => classId === 'all' || l.classIds.includes(classId))
    .filter((l) => !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
      || (l.currentProjectTitle || '').toLowerCase().includes(q))
    .filter((l) => filter === 'all' || (filter === 'attention' ? l.status.id !== 'ontrack' : l.status.id === filter))
    .sort((a, b) => a.status.rank - b.status.rank || urgency(b) - urgency(a) || a.name.localeCompare(b.name));
}

/** Counts per status for the filter chips. */
export function statusCounts(list) {
  const out = { all: list.length, attention: 0, overdue: 0, feedback: 0, checkin: 0, ontrack: 0 };
  for (const l of list) {
    out[l.status.id] += 1;
    if (l.status.id !== 'ontrack') out.attention += 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Competencies: learner self-assessment and coach judgement, side by side
// ---------------------------------------------------------------------------

/**
 * One row per competency that has either a learner tag or a coach judgement.
 * The two columns are never merged.
 */
export function competencyRows(learner, records) {
  const ids = new Set();
  const self = {};
  for (const e of learner.evidence) for (const id of e.selfTags) { ids.add(id); self[id] = (self[id] || 0) + 1; }
  const coach = {};
  for (const a of records?.assessments || []) {
    if (!competencyById(a.competencyId) || !LEVELS.includes(a.level)) continue;
    ids.add(a.competencyId);
    if (!coach[a.competencyId] || a.at > coach[a.competencyId].at) coach[a.competencyId] = a;
  }
  return [...ids].map((id) => ({
    id,
    competency: competencyById(id),
    selfEvidenceCount: self[id] || 0,
    coach: coach[id] || null
  })).filter((r) => r.competency).sort((a, b) => a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------------------
// Parent report
// ---------------------------------------------------------------------------

const inPeriod = (ms, from, to) => {
  const d = dayOf(ms);
  return Boolean(d) && d >= from && d <= to;
};

/**
 * A report draft built only from records. Nothing is inferred: each section is
 * either filled from a record or left empty and flagged. Private notes are not
 * a parameter, so they cannot reach a report.
 *
 * `sharedNotes` are the coach's notes marked for parents; `checkIns` only count
 * when the coach approved them for parent sharing.
 */
export function buildReportDraft(learner, { checkIns = [], sharedNotes = [], assessments = [] }, { from, to }) {
  const flags = [];
  const shared = checkIns.filter((c) => c.shareWithParent && inPeriod(c.at, from, to)).sort((a, b) => a.at - b.at);
  const milestones = learner.milestones.filter((m) => (m.dueOn >= from && m.dueOn <= to) || (m.doneOn && m.doneOn >= from && m.doneOn <= to));
  const evidence = learner.evidence.filter((e) => inPeriod(e.at, from, to));
  const judged = assessments.filter((a) => inPeriod(a.at, from, to) && competencyById(a.competencyId) && LEVELS.includes(a.level));
  const latest = {};
  for (const a of judged) if (!latest[a.competencyId] || a.at > latest[a.competencyId].at) latest[a.competencyId] = a;
  const comps = Object.values(latest).map((a) => ({ id: a.competencyId, title: competencyById(a.competencyId).title, level: a.level, at: a.at, evidenceKeys: a.evidenceKeys || [] }));

  if (!learner.academic.connected) flags.push({ id: 'academicUnavailable', severity: 'missing' });
  if (!learner.project && !learner.programs.length) flags.push({ id: 'noProject', severity: 'missing' });
  if (!milestones.length) flags.push({ id: 'noMilestones', severity: 'missing' });
  if (!evidence.length) flags.push({ id: 'noEvidence', severity: 'missing' });
  if (evidence.some((e) => !e.dateExact)) flags.push({ id: 'approxDates', severity: 'info' });
  if (!comps.length) flags.push({ id: 'noAssessments', severity: 'missing' });
  if (!shared.length) flags.push({ id: 'noSharedCheckIn', severity: 'missing' });
  const last = learner.lastSavedAt ? dayOf(learner.lastSavedAt) : null;
  if (last && daysBetween(last, to) > STALE_DAYS) flags.push({ id: 'stale', severity: 'outdated', day: last });
  if (learner.project?.termDraft) flags.push({ id: 'termDraft', severity: 'info' });
  if (learner.programs.some((p) => !p.countReliable)) flags.push({ id: 'programCount', severity: 'missing' });

  const lines = (field) => shared.map((c) => String(c[field] || '').trim()).filter(Boolean);
  const done = milestones.filter((m) => m.state === 'done').length;
  const overdue = milestones.filter((m) => m.state === 'overdue').length;
  return {
    period: { from, to },
    flags,
    milestones,
    evidenceOptions: evidence,
    // Evidence a coach already judged or gave feedback on is pre-selected; the coach can change it.
    selectedEvidence: evidence.filter((e) => e.feedback || e.assessments.length).map((e) => e.key),
    competencies: comps,
    facts: {
      projectTitle: learner.project?.title || learner.currentProjectTitle || null,
      stage: learner.project?.phase.title || null,
      tasksDone: learner.project ? learner.project.checklist.filter((c) => c.done).length : null,
      tasksTotal: learner.project ? learner.project.checklist.length : null,
      programs: learner.programs.map((p) => ({ title: p.title, done: p.done, total: p.total, countReliable: p.countReliable })),
      milestonesDone: done,
      milestonesOverdue: overdue,
      milestonesTotal: milestones.length,
      independent: comps.filter((c) => c.level === 'independent').length,
      withSupport: comps.filter((c) => c.level === 'support').length
    },
    text: {
      strengths: lines('strength').join('\n'),
      challenges: lines('challenge').join('\n'),
      nextSteps: lines('nextAction').join('\n'),
      home: sharedNotes.filter((n) => inPeriod(n.at, from, to)).map((n) => n.text.trim()).filter(Boolean).join('\n'),
      narrative: ''
    },
    sources: {
      checkIns: shared.map((c) => c.id),
      sharedNotes: sharedNotes.filter((n) => inPeriod(n.at, from, to)).map((n) => n.id),
      assessments: comps.map((c) => latest[c.id].id)
    }
  };
}

/** A default reporting period: the 4 weeks ending today. */
export function defaultPeriod(today = dayKey()) {
  const d = new Date(`${today}T00:00:00`);
  d.setDate(d.getDate() - 27);
  return { from: dayKey(d), to: today };
}

export const EVIDENCE_KIND_IDS = EVIDENCE_KINDS.map((k) => k.id);
