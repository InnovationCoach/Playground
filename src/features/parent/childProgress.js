/**
 * What a parent sees of one linked child's learning, built from the child's
 * own saved records. This is the response body of
 * GET /api/parent/children/:uid/progress (docs/PARENT-DASHBOARD-CONTRACT.md):
 * the backend reads the records below with the Admin SDK after checking an
 * active parent link, and returns buildChildProgress(...) unchanged. The mock
 * backend and the tests call the same function, so the three cannot drift.
 *
 * Records read (all under users/{childUid}):
 *   goalPlan                               - the Goals page plan
 *   activityProgress/pbl-<termId>          - the PBL Studio project
 *   activityProgress/solar-car, plant-lab, hex-grid - STEAM activities
 *   Edmentum results via LTI 1.3 AGS       - once the school connects it
 *
 * Privacy: a parent gets progress, not the child's private writing. Never
 * returned: mood check-ins, notes, reflection and evidence text, AI logs,
 * strengths and supports from Goal setting, dashboard personalisation.
 * Every number comes from a saved record; nothing is estimated.
 */
import { PHASES, TERM, EVIDENCE_KINDS } from '../pbl/content/pblModel.js';
import { hydrateProject, phaseProgress, competencyCoverage, readiness } from '../pbl/engine/pblProject.js';
import { COMPETENCIES, COMPETENCY_DOMAINS } from '../pbl/content/competencies.js';
import { hydratePlan } from '../goals/goalPlan.js';
import { goalSummary, TRACKED_ACTIVITIES } from '../dashboard/dashboardModel.js';

/** The STEAM activity records, by TRACKED_ACTIVITIES id. */
export const ACTIVITY_DOCS = { solar: 'solar-car', plants: 'plant-lab', hexgrid: 'hex-grid' };

/** What the dashboard tells parents is and isn't shared, shown on the page. */
export const SHARED = ['PBL project phases, tasks and evidence titles', 'Goals, goal steps and the daily habit', 'Competencies shown in evidence', 'STEAM activities started', 'Edmentum course progress and scores'];
export const NOT_SHARED = ['Mood check-ins', 'Notes and reflections', 'What they wrote in evidence and AI logs', 'Strengths and supports from Goal setting'];

const DAY_MS = 86400000;
const pct = (done, total) => (total > 0 ? Math.round((100 * done) / total) : 0);
const kindLabel = (id) => EVIDENCE_KINDS.find((k) => k.id === id)?.label || 'Evidence';
const phaseTitle = (id) => PHASES.find((p) => p.id === id)?.title || id;

const hasRecord = (v) => Boolean(v) && typeof v === 'object' && Object.keys(v).length > 0;
const finite = (v) => (Number.isFinite(v) ? v : null);
const toMillis = (v) => {
  if (Number.isFinite(v)) return v;
  if (typeof v === 'string') { const t = Date.parse(v); return Number.isNaN(t) ? null : t; }
  if (v && typeof v.toMillis === 'function') return v.toMillis();
  return null;
};

function pblSection(project) {
  const phases = PHASES.map((p) => {
    const pp = phaseProgress(project, p.id);
    const state = pp.complete ? 'done' : p.id === project.currentPhase ? 'current' : 'upcoming';
    return { id: p.id, title: p.title, tasksDone: pp.tasksDone, tasksTotal: pp.tasksTotal, evidenceCount: pp.evidenceCount, state };
  });
  const tasksDone = phases.reduce((n, p) => n + p.tasksDone, 0);
  const tasksTotal = phases.reduce((n, p) => n + p.tasksTotal, 0);
  const ready = readiness(project);
  const byKind = {};
  for (const e of project.evidence) byKind[e.kind] = (byKind[e.kind] || 0) + 1;
  return {
    termLabel: TERM.label,
    theme: TERM.theme,
    question: project.problem.hmw.trim() || null,
    started: project.updatedAt !== null,
    currentPhase: { id: project.currentPhase, title: phaseTitle(project.currentPhase) },
    phases,
    tasks: { done: tasksDone, total: tasksTotal, percent: pct(tasksDone, tasksTotal) },
    readiness: { done: ready.done, total: ready.total, percent: pct(ready.done, ready.total), checks: ready.checks.map((c) => ({ id: c.id, label: c.label, ok: c.ok })) },
    evidence: {
      total: project.evidence.length,
      byKind: EVIDENCE_KINDS.filter((k) => byKind[k.id]).map((k) => ({ id: k.id, label: k.label, count: byKind[k.id] })),
      // Titles only: the body is the child's own writing.
      recent: [...project.evidence].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
        .map((e) => ({ title: e.title, kind: e.kind, kindLabel: kindLabel(e.kind), phase: phaseTitle(e.phase), createdAt: e.createdAt || null }))
    },
    updatedAt: project.updatedAt
  };
}

function goalsSection(plan, now) {
  const g = goalSummary(plan, now);
  if (!g) return null;
  return {
    items: g.items.map((i) => ({ text: i.text, done: i.done, stepsDone: i.stepsDone, stepsTotal: i.stepsTotal })),
    steps: { done: g.done, total: g.total, percent: g.percent },
    achieved: g.achieved,
    habit: g.habit ? { text: g.focusHabit, count: g.habit.count, target: g.habit.target, days: g.habit.days } : null,
    today: g.today,
    updatedAt: finite(plan.updatedAt)
  };
}

/**
 * A competency is "shown" once the child has tagged it on at least one piece
 * of evidence. That is the child's claim, not a grade: coach confirmation is
 * a later contract field (`confirmed`), false until the backend supplies it.
 */
function competencySection(project, confirmed = []) {
  const counts = competencyCoverage(project);
  const confirmedSet = new Set(confirmed);
  const domains = COMPETENCY_DOMAINS.map((d) => {
    const items = COMPETENCIES.filter((c) => c.domain === d.id);
    const shown = items.filter((c) => counts[c.id]).map((c) => ({
      id: c.id, code: c.code, title: c.title, statement: c.statement, level: c.level,
      evidenceCount: counts[c.id], confirmed: confirmedSet.has(c.id)
    })).sort((a, b) => b.evidenceCount - a.evidenceCount);
    return { id: d.id, title: d.title, shown: shown.length, total: items.length, percent: pct(shown.length, items.length), items: shown };
  });
  const shown = domains.reduce((n, d) => n + d.shown, 0);
  return { shown, total: COMPETENCIES.length, confirmed: domains.reduce((n, d) => n + d.items.filter((i) => i.confirmed).length, 0), domains };
}

function activitiesSection(activityDocs) {
  const items = TRACKED_ACTIVITIES.map((a) => {
    const rec = activityDocs?.[ACTIVITY_DOCS[a.id]];
    return { id: a.id, label: a.label, started: hasRecord(rec), updatedAt: hasRecord(rec) ? toMillis(rec.updatedAt) : null };
  });
  const done = items.filter((i) => i.started).length;
  return { done, total: items.length, percent: pct(done, items.length), items };
}

/**
 * Edmentum results arrive as LTI 1.3 Assignment and Grade Services scores per
 * line item. Until the school connects Edmentum the backend sends
 * { status: 'not_connected' } and the dashboard says so; it never shows zeros.
 */
function edmentumSection(edmentum) {
  if (!edmentum || edmentum.status !== 'connected') return { status: 'not_connected', courses: [] };
  const courses = (Array.isArray(edmentum.courses) ? edmentum.courses : []).map((c) => {
    const recent = (Array.isArray(c.recent) ? c.recent : [])
      .filter((r) => r && r.title && Number.isFinite(r.scoreGiven) && Number.isFinite(r.scoreMaximum) && r.scoreMaximum > 0)
      .map((r) => ({ title: String(r.title).slice(0, 120), scoreGiven: r.scoreGiven, scoreMaximum: r.scoreMaximum, percent: pct(r.scoreGiven, r.scoreMaximum), submittedAt: toMillis(r.submittedAt) }))
      .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))
      .slice(0, 5);
    const scored = recent.length ? Math.round(recent.reduce((s, r) => s + r.percent, 0) / recent.length) : null;
    return {
      id: String(c.id || c.title),
      title: String(c.title || 'Edmentum course').slice(0, 120),
      progressPercent: Number.isFinite(c.progressPercent) ? Math.max(0, Math.min(100, Math.round(c.progressPercent))) : null,
      averageScore: Number.isFinite(c.averageScore) ? Math.round(c.averageScore) : scored,
      lastActivityAt: toMillis(c.lastActivityAt),
      recent
    };
  }).sort((a, b) => (b.lastActivityAt || 0) - (a.lastActivityAt || 0));
  return { status: 'connected', syncedAt: toMillis(edmentum.syncedAt), courses };
}

/** Recent things the child did, newest first, from dated records only. */
function recentActivity(pbl, activities, edmentum, now) {
  const since = now.getTime() - 14 * DAY_MS;
  const out = [];
  for (const e of pbl.evidence.recent) if (e.createdAt && e.createdAt >= since) out.push({ type: 'evidence', text: `Added "${e.title}" (${e.kindLabel})`, detail: `PBL, ${e.phase}`, at: e.createdAt });
  for (const a of activities.items) if (a.updatedAt && a.updatedAt >= since) out.push({ type: 'activity', text: `Worked on ${a.label}`, detail: 'STEAM activity', at: a.updatedAt });
  for (const c of edmentum.courses) for (const r of c.recent) if (r.submittedAt && r.submittedAt >= since) out.push({ type: 'edmentum', text: `Scored ${r.scoreGiven}/${r.scoreMaximum} on "${r.title}"`, detail: c.title, at: r.submittedAt });
  return out.sort((a, b) => b.at - a.at).slice(0, 6);
}

/**
 * Two or three questions a parent could ask at dinner, picked from where the
 * child actually is. Open questions about the work, never about scores.
 */
export function conversationStarters(name, p) {
  const out = [];
  const who = name || 'your child';
  if (p.pbl.question) out.push(`Ask ${who} who their project question would help, and why they chose it: "${p.pbl.question}"`);
  else if (p.pbl.started) out.push(`Ask ${who} which problem they are thinking of solving this term, and who it affects.`);
  const phase = p.pbl.currentPhase.id;
  const byPhase = {
    explore: `Ask ${who} what surprised them in the STEAM activities so far.`,
    empathise: `Ask ${who} who they have talked to about their problem, and what they learned from them.`,
    define: `Ask ${who} how they will know if their solution works.`,
    ideate: `Ask ${who} for their wildest idea, even one they will not build.`,
    prototype: `Ask ${who} to show you what they are building, and what broke along the way.`,
    test: `Ask ${who} what their testing showed, and what they would change.`,
    share: `Ask ${who} to practise their showcase talk with you.`
  };
  if (p.pbl.started && byPhase[phase]) out.push(byPhase[phase]);
  if (p.goals?.items.some((g) => g.done)) out.push(`${who} finished a goal they set themselves. Ask how it felt and what they want to try next.`);
  else if (p.goals?.items.length) out.push(`Ask ${who} about their goal "${p.goals.items[0].text}" and what the next small step is.`);
  if (p.goals?.habit && p.goals.habit.count >= p.goals.habit.target && p.goals.habit.target > 0) out.push(`${who} kept their daily habit every planned day this week. That is worth noticing.`);
  const topDomain = [...p.competencies.domains].sort((a, b) => b.shown - a.shown)[0];
  if (topDomain && topDomain.shown > 0) out.push(`Ask ${who} for an example of when they used ${topDomain.title.toLowerCase()} in their project.`);
  if (!out.length) out.push(`Ask ${who} to show you WeLearn and pick one STEAM activity to try together.`);
  return out.slice(0, 3);
}

/**
 * @param {object} input
 * @param {object} input.child          the /api/parent/children item for this child
 * @param {object} [input.goalPlan]     users/{uid}.goalPlan
 * @param {object} [input.pblProject]   users/{uid}/activityProgress/pbl-<termId>
 * @param {object} [input.activityDocs] { 'solar-car': {...}, 'plant-lab': {...}, 'hex-grid': {...} }
 * @param {object} [input.edmentum]     { status, syncedAt, courses: [{ id, title, progressPercent, averageScore, lastActivityAt, recent: [{ title, scoreGiven, scoreMaximum, submittedAt }] }] }
 * @param {string[]} [input.confirmedCompetencies] competency ids a coach has confirmed
 */
export function buildChildProgress({ child, goalPlan, pblProject, activityDocs, edmentum, confirmedCompetencies, now = new Date() }) {
  const plan = hydratePlan(goalPlan);
  const project = hydrateProject(pblProject, TERM.id);
  const pbl = pblSection(project);
  const goals = goalsSection(plan, now);
  const competencies = competencySection(project, confirmedCompetencies);
  const activities = activitiesSection(activityDocs);
  const edm = edmentumSection(edmentum);
  const recent = recentActivity(pbl, activities, edm, now);
  const dates = [pbl.updatedAt, goals?.updatedAt, ...activities.items.map((a) => a.updatedAt), ...edm.courses.map((c) => c.lastActivityAt)].filter(Number.isFinite);
  const progress = {
    child,
    generatedAt: now.getTime(),
    lastActiveAt: dates.length ? Math.max(...dates) : null,
    pbl,
    goals,
    competencies,
    activities,
    edmentum: edm,
    recent
  };
  progress.starters = conversationStarters(child?.givenNames, progress);
  return progress;
}
