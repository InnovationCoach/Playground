/**
 * A learner's term project: pure functions over one plain object, so the
 * rules are unit-tested without React or Firestore (tests/pbl.test.js).
 *
 * Stored as users/{uid}/activityProgress/pbl-<termId>: owner-writable and
 * coach-readable under the existing rules, one document per term. Evidence is
 * text and links only - uploads wait for Firebase Storage (Phase C) - and the
 * caps below keep a full term well under Firestore's 1 MB document limit.
 */
import { PHASES, EVIDENCE_KINDS, IMPACT, CODE_LANGUAGES } from '../content/pblModel.js';
import { competencyById } from '../content/competencies.js';

export const LIMITS = { evidence: 150, title: 120, body: 3000, code: 6000, link: 500, field: 600, sparks: 1500 };

const PHASE_IDS = PHASES.map((p) => p.id);
const KIND_IDS = EVIDENCE_KINDS.map((k) => k.id);
const FORMATS = ['showcase', 'presentation'];
const IMPACT_IDS = IMPACT.map((i) => i.id);
const LANGUAGE_IDS = CODE_LANGUAGES.map((l) => l.id);

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');

/**
 * Only http(s) links are kept. A learner-typed `javascript:` URL rendered as
 * an href would run in the coach's session when they open the portfolio.
 */
export function safeLink(value) {
  const s = str(value, LIMITS.link).trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

export function newProject(termId) {
  return {
    version: 1,
    termId,
    currentPhase: PHASE_IDS[0],
    interests: [],
    sparks: '',
    problem: { hmw: '', who: '', why: '', criteria: '', constraints: '', impactMeasure: '' },
    impact: null,
    codeLanguage: LANGUAGE_IDS[0],
    finalFormat: null,
    tasksDone: {},
    evidence: [],
    updatedAt: null
  };
}

function cleanEvidence(e) {
  if (!e || typeof e !== 'object') return null;
  const kind = KIND_IDS.includes(e.kind) ? e.kind : 'note';
  const item = {
    id: str(e.id, 40) || null,
    phase: PHASE_IDS.includes(e.phase) ? e.phase : PHASE_IDS[0],
    kind,
    title: str(e.title, LIMITS.title).trim(),
    body: str(e.body, kind === 'code' ? LIMITS.code : LIMITS.body),
    link: safeLink(e.link),
    competencies: Array.isArray(e.competencies) ? [...new Set(e.competencies.filter((id) => competencyById(id)))].slice(0, 8) : [],
    createdAt: Number.isFinite(e.createdAt) ? e.createdAt : 0
  };
  if (kind === 'ai') {
    const ai = e.ai || {};
    item.ai = { asked: str(ai.asked, LIMITS.field), gave: str(ai.gave, LIMITS.body), kept: str(ai.kept, LIMITS.field) };
  }
  return item.id && item.title ? item : null;
}

/** Whatever came back from storage, return a well-formed project for this term. */
export function hydrateProject(stored, termId) {
  const base = newProject(termId);
  if (!stored || typeof stored !== 'object' || stored.termId !== termId) return base;
  const p = stored.problem || {};
  const tasksDone = {};
  for (const phase of PHASES) {
    const done = stored.tasksDone?.[phase.id];
    if (Array.isArray(done)) tasksDone[phase.id] = [...new Set(done.filter((i) => Number.isInteger(i) && i >= 0 && i < phase.tasks.length))];
  }
  return {
    ...base,
    currentPhase: PHASE_IDS.includes(stored.currentPhase) ? stored.currentPhase : base.currentPhase,
    interests: Array.isArray(stored.interests) ? stored.interests.filter((i) => typeof i === 'string').slice(0, 6).map((i) => i.slice(0, 40)) : [],
    sparks: str(stored.sparks, LIMITS.sparks),
    problem: Object.fromEntries(Object.keys(base.problem).map((k) => [k, str(p[k], LIMITS.field)])),
    impact: IMPACT_IDS.includes(stored.impact) ? stored.impact : null,
    codeLanguage: LANGUAGE_IDS.includes(stored.codeLanguage) ? stored.codeLanguage : base.codeLanguage,
    finalFormat: FORMATS.includes(stored.finalFormat) ? stored.finalFormat : null,
    tasksDone,
    evidence: Array.isArray(stored.evidence) ? stored.evidence.map(cleanEvidence).filter(Boolean).slice(0, LIMITS.evidence) : [],
    updatedAt: Number.isFinite(stored.updatedAt) ? stored.updatedAt : null
  };
}

const touch = (project, patch, now) => ({ ...project, ...patch, updatedAt: now });

/**
 * Validate a new evidence entry. Returns { project } or { error } - the error
 * is shown to the learner, so it is written for them.
 */
export function addEvidence(project, draft, now = Date.now()) {
  if (project.evidence.length >= LIMITS.evidence) return { error: `Your portfolio is full (${LIMITS.evidence} entries). Ask your coach to archive older ones.` };
  if (!String(draft?.title || '').trim()) return { error: 'Give this evidence a short title.' };
  if (draft.link && !safeLink(draft.link)) return { error: 'Links must start with http:// or https://' };
  if (draft.kind === 'ai' && !String(draft.ai?.asked || '').trim()) return { error: 'For an AI log, write what you asked the AI.' };
  if (draft.kind === 'ai' && !String(draft.ai?.kept || '').trim()) return { error: 'For an AI log, say what you kept, changed or rejected - that is the evidence.' };
  const item = cleanEvidence({ ...draft, id: `ev-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`, createdAt: now });
  if (!item) return { error: 'That entry could not be saved.' };
  return { project: touch(project, { evidence: [item, ...project.evidence] }, now) };
}

export function removeEvidence(project, id, now = Date.now()) {
  return touch(project, { evidence: project.evidence.filter((e) => e.id !== id) }, now);
}

export function toggleTask(project, phaseId, index, now = Date.now()) {
  const done = new Set(project.tasksDone[phaseId] || []);
  if (done.has(index)) done.delete(index); else done.add(index);
  return touch(project, { tasksDone: { ...project.tasksDone, [phaseId]: [...done].sort((a, b) => a - b) } }, now);
}

export function updateProject(project, patch, now = Date.now()) {
  const next = { ...patch };
  if (patch.problem) next.problem = { ...project.problem, ...patch.problem };
  return touch(project, next, now);
}

export function phaseProgress(project, phaseId) {
  const phase = PHASES.find((p) => p.id === phaseId);
  const tasksTotal = phase ? phase.tasks.length : 0;
  const tasksDone = (project.tasksDone[phaseId] || []).length;
  const evidenceCount = project.evidence.filter((e) => e.phase === phaseId).length;
  return { tasksDone, tasksTotal, evidenceCount, complete: tasksTotal > 0 && tasksDone === tasksTotal && evidenceCount > 0 };
}

/** Evidence count per competency id. A competency with no evidence is absent. */
export function competencyCoverage(project) {
  const counts = {};
  for (const e of project.evidence) for (const id of e.competencies) counts[id] = (counts[id] || 0) + 1;
  return counts;
}

/**
 * What a learner needs before the end-of-term showcase. Deliberately about
 * evidence, not polish: each check is something a coach can verify.
 */
export function readiness(project) {
  const has = (pred) => project.evidence.some(pred);
  const phasesWithEvidence = new Set(project.evidence.map((e) => e.phase));
  const checks = [
    { id: 'problem', label: 'A "How might we..." problem statement', ok: project.problem.hmw.trim().length >= 15 },
    { id: 'criteria', label: 'Success criteria you can measure', ok: project.problem.criteria.trim().length >= 10 },
    { id: 'impact', label: 'Who benefits - people, the environment, or both - and how you will measure it', ok: Boolean(project.impact) && project.problem.impactMeasure.trim().length >= 10 },
    { id: 'phases', label: 'Evidence in every Design Thinking phase', ok: PHASES.every((p) => p.id === 'share' || phasesWithEvidence.has(p.id)) },
    { id: 'code', label: 'Code you wrote (with AI help is fine)', ok: has((e) => e.kind === 'code') },
    { id: 'ai', label: 'At least one AI log', ok: has((e) => e.kind === 'ai') },
    { id: 'data', label: 'Test data or results', ok: has((e) => e.kind === 'data') },
    { id: 'feedback', label: 'Feedback from a user or peer', ok: has((e) => e.kind === 'feedback') },
    { id: 'reflection', label: 'A reflection on what you learned', ok: has((e) => e.kind === 'reflection') },
    { id: 'format', label: 'Showcase or presentation chosen', ok: Boolean(project.finalFormat) }
  ];
  return { checks, done: checks.filter((c) => c.ok).length, total: checks.length };
}

/**
 * Context for the tutor fallback, sent as its activityContext (the server
 * truncates at 800 characters, so this is budgeted to fit). It carries only
 * project text the learner wrote - never names or ids.
 */
export function copilotContext(project, phaseId) {
  const phase = PHASES.find((p) => p.id === phaseId) || PHASES[0];
  const impact = IMPACT.find((i) => i.id === project.impact);
  const parts = [
    'You are a project co-pilot for a school Design Thinking project that helps people or the environment.',
    `Current phase: ${phase.title} - ${phase.goal}`,
    'Help the learner plan, research and write or debug code (micro:bit MicroPython, Python, JavaScript, Arduino).',
    'When you give code, comment each line and ask them to test it and explain it back. Do not write their reflections or make their design decisions for them.'
  ];
  if (impact) parts.push(`Who it helps: ${impact.label}.`);
  if (project.problem.hmw.trim()) parts.push(`Their problem: ${project.problem.hmw.trim().slice(0, 200)}`);
  return parts.join('\n').slice(0, 800);
}

/**
 * Body for POST /api/pbl-copilot (docs/BACKEND-PBL-COPILOT-PROMPT-FOR-GEMINI.md).
 * Project text only - no names, uids or evidence from other people.
 */
export function copilotRequest(project, phaseId, message) {
  const p = project.problem;
  return {
    message: String(message || '').slice(0, 2000),
    phase: PHASES.some((ph) => ph.id === phaseId) ? phaseId : PHASES[0].id,
    impact: project.impact,
    language: project.codeLanguage,
    problem: {
      hmw: p.hmw.trim().slice(0, 300),
      who: p.who.trim().slice(0, 200),
      criteria: p.criteria.trim().slice(0, 300),
      constraints: p.constraints.trim().slice(0, 300),
      impactMeasure: p.impactMeasure.trim().slice(0, 200)
    }
  };
}
