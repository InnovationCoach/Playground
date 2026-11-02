/**
 * Focus flow (O03): one learner action at a time. Pure and framework-free.
 *
 * An authored step becomes a short sequence of actions: its practice check (if the
 * step has one), then each notebook part it uses. The position inside a step is
 * UI-only. On the wire `activeStepId` is always the action's authored step ID, and
 * resuming starts at that step's first action. Nothing here gates progress.
 */

import { getMissionLearningDesign } from '../../../../shared/universe/learningDesign.js';

const PRACTICE_KINDS = new Set(['number', 'choose']);

/**
 * The shared learning design for this exact reviewed content (mission, route, version and
 * the bundle's content hash), or null, in which case screens use the authored text.
 */
export function learningDesign(bundle, mission, route, source = getMissionLearningDesign) {
  if (!source || !bundle || !mission || !route) return null;
  const d = source(mission.id, route.id, mission.version, bundle.bundleContentSha256);
  return d && d.missionId === mission.id && d.routeId === route.id && d.missionVersion === mission.version ? d : null;
}

/**
 * Notebook parts a step asks for in the focus flow. The design may defer a shared part to a later
 * consolidation step (`notebookPartIds`, a subset of the authored parts); it can never add one.
 */
function stepParts(step, design) {
  const authored = step.evidencePartIds || [];
  const chosen = design?.steps?.[step.id]?.notebookPartIds;
  return Array.isArray(chosen) ? authored.filter((p) => chosen.includes(p)) : authored;
}

export function buildActions(route, design = null) {
  const actions = [];
  route.steps.forEach((step, stepIndex) => {
    const parts = stepParts(step, design);
    if (PRACTICE_KINDS.has(step.kind)) actions.push({ type: 'practice', stepId: step.id, stepIndex });
    for (const partId of parts) actions.push({ type: 'part', stepId: step.id, stepIndex, partId });
    if (!PRACTICE_KINDS.has(step.kind) && !parts.length) actions.push({ type: 'read', stepId: step.id, stepIndex });
  });
  // A deferral never drops a required artifact: any part left without an action goes to the last authored step that uses it.
  for (const rule of route.requiredParts) {
    if (actions.some((a) => a.partId === rule.partId)) continue;
    const stepIndex = route.steps.map((s, i) => ((s.evidencePartIds || []).includes(rule.partId) ? i : -1)).filter((i) => i >= 0).pop() ?? route.steps.length - 1;
    const at = actions.map((a) => a.stepIndex <= stepIndex).lastIndexOf(true);
    actions.splice(at + 1, 0, { type: 'part', stepId: route.steps[stepIndex].id, stepIndex, partId: rule.partId });
  }
  // A step whose only action was a deferred part still needs one place to land.
  route.steps.forEach((step, stepIndex) => {
    if (!actions.some((a) => a.stepIndex === stepIndex)) {
      const at = actions.map((a) => a.stepIndex < stepIndex).lastIndexOf(true);
      actions.splice(at + 1, 0, { type: 'read', stepId: step.id, stepIndex });
    }
  });
  return actions.map((a, index) => ({ ...a, index, key: `${a.stepId}:${a.type}:${a.partId || ''}` }));
}

/** Deterministic resume: the first action of a saved authored step (or the first action). */
export function firstActionOf(actions, stepId) {
  const i = actions.findIndex((a) => a.stepId === stepId);
  return i < 0 ? 0 : i;
}

/** Steps (1-based numbers) where the flow shows a notebook part: one shared artifact, never re-demanded. */
export function stepsUsingPart(actions, partId) {
  return [...new Set(actions.filter((a) => a.partId === partId).map((a) => a.stepIndex + 1))];
}

/** Rows of a table template that hold something to fill in (one row at a time in focus mode). */
export const workRows = (template) => (template ? template.rows.map((r, i) => (r.cells.some((c) => c.editable) ? i : null)).filter((i) => i !== null) : []);

/** Learner-facing text for one action, from the shared design when available, otherwise the authored step. */
export function actionCopy(action, step, design) {
  const s = design?.steps?.[step.id];
  if (action.type === 'part') {
    const p = s?.parts?.[action.partId];
    return { title: s?.title || step.title, action: p?.action || (PRACTICE_KINDS.has(step.kind) ? null : s?.action || step.prompt), reference: p?.reference || null, fromDesign: !!p };
  }
  // R1: the operation itself is the action text; `practiceAction` is only the short label for the response.
  if (action.type === 'practice') return { title: s?.title || step.title, action: s?.action || step.prompt, responseLabel: s?.practiceAction || null, reference: s?.reference || null, fromDesign: !!s };
  return { title: s?.title || step.title, action: s?.action || step.prompt, reference: s?.reference || null, fromDesign: !!s };
}

/** Unique NGSS entries across every route's design, in route order, each with its own scope note (R2). */
export function standardsAcross(designs) {
  const seen = new Map();
  for (const d of designs) for (const n of d?.ngss || []) if (!seen.has(n.code)) seen.set(n.code, n);
  return [...seen.values()];
}

/** Recommended grades for the pilot come from the shared design; the authored band is shown as written. */
export function gradeLabel(route, design) {
  const g = design?.recommendedGrades;
  if (g) return `Suggested for grades ${Array.isArray(g) ? `${g[0]}–${g[g.length - 1]}` : g}`;
  return `Grades ${route.gradeBand}`;
}
