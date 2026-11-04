/**
 * One short context line per SPARK card, from data the app already has for
 * this user. A reader that has nothing true to say returns null and the card
 * shows no line: no placeholder counts, no invented activity.
 *
 * Inputs:
 *   student - loadSignals() from the dashboard model (this device's saved work)
 *   parent  - the child progress body from /api/parent/children/:uid/progress
 *   console - { pending } accounts awaiting activation, from /api/admin/users
 */
import { PHASES } from '../pbl/content/pblModel.js';

const phaseTitle = (id) => PHASES.find((p) => p.id === id)?.title || id;

export function studentContext(signals, t) {
  if (!signals) return {};
  const out = {};
  const p = signals.project;
  if (p?.updatedAt) {
    const done = PHASES.reduce((n, ph) => n + (p.tasksDone[ph.id] || []).length, 0);
    const total = PHASES.reduce((n, ph) => n + ph.tasks.length, 0);
    out.project = t('spark.ctx.phase', { phase: phaseTitle(p.currentPhase), done, total });
  }
  if (p?.evidence?.length) out.evidence = t('spark.ctx.evidence', { count: p.evidence.length });
  if (signals.started?.length) out.activities = t('spark.ctx.activities', { count: signals.started.length });
  const today = signals.goals?.today;
  if (today?.total) out.goalsToday = t('spark.ctx.today', { done: today.done, total: today.total });
  return out;
}

export function parentContext(progress, t, ago) {
  if (!progress) return {};
  const out = {};
  if (progress.lastActiveAt) out.childActive = t('spark.ctx.lastActive', { when: ago(progress.lastActiveAt) });
  if (progress.pbl?.started) out.childPhase = t('spark.ctx.nowIn', { phase: progress.pbl.currentPhase.title });
  if (progress.pbl?.evidence?.total) out.childEvidence = t('spark.ctx.evidence', { count: progress.pbl.evidence.total });
  if (progress.competencies?.shown) out.childCompetencies = t('spark.ctx.shown', { count: progress.competencies.shown });
  if (progress.goals?.steps?.total) out.childGoals = t('spark.ctx.steps', { done: progress.goals.steps.done, total: progress.goals.steps.total });
  return out;
}

export function consoleContext(data, t) {
  if (!data || !Number.isFinite(data.pending)) return {};
  return data.pending > 0 ? { pendingAccounts: t('spark.ctx.pending', { count: data.pending }) } : {};
}

/** Where a dashboard next-step target goes, as an href (or an activity id for the legacy view switcher). */
export function nextStepHref(target, hrefFor) {
  if (!target) return null;
  if (target.type === 'goals') return { href: hrefFor.goals() };
  if (target.type === 'pbl') return { href: hrefFor.pbl(target.tab) };
  if (target.type === 'activity') return { activity: target.id };
  return null;
}
