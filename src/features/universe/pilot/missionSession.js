import { parseNumber, resolveTask, validateEvidence, validateSubmission, validateDraft, getTableTemplate } from '../../../../shared/universe/index.js';

/** Table layout always comes from the shared presentation getter (it marks not-applicable cells). */
export const tableTemplate = (route, partId) => getTableTemplate(route, partId);

/**
 * Pure state for one learner working on one exact task (release, mission, version,
 * route, task, policy). Everything lives in memory: nothing here touches storage
 * or the network. The notebook keeps every alternative a part allows (table and
 * its text equivalent, diagram and its description) so switching format or
 * support never loses work.
 */

export const IDENTITY_KEYS = ['releaseId', 'missionId', 'missionVersion', 'routeId', 'taskId', 'policyVersion'];

/** Missions from a trusted registry (published releases in production, fixtures only in previews). */
export function pilotMissions(registry) {
  const out = [];
  for (const bundle of registry || []) for (const mission of bundle.missions || []) out.push({ bundle, mission });
  return out;
}
export const pilotMissionsForPlanet = (registry, planetId) => pilotMissions(registry).filter((m) => m.mission.planetIds.includes(planetId));
export const findPilotMission = (registry, missionId) => pilotMissions(registry).find((m) => m.mission.id === missionId) || null;

export function identityFor(bundle, mission, route) {
  return { releaseId: bundle.releaseId, missionId: mission.id, missionVersion: mission.version, routeId: route.id, taskId: route.taskId, policyVersion: bundle.policy.version };
}
export const identityKey = (identity) => IDENTITY_KEYS.map((k) => identity?.[k] ?? '').join('|');
export const sameIdentity = (a, b) => !!a && !!b && IDENTITY_KEYS.every((k) => a[k] === b[k]);

/** Datasets a route works from, in authored order. */
export function routeDatasets(bundle, mission, route) {
  const ids = route.scenarioIds?.length ? route.scenarioIds : mission.evidenceRefs || [];
  return ids.map((id) => bundle.datasets.find((d) => d.id === id)).filter(Boolean);
}

function defaultKind(route, rule) {
  if (rule.anyOfKinds.includes('table') && tableTemplate(route, rule.partId)) return 'table';
  if (rule.anyOfKinds.includes('diagram') && route.diagramTemplates?.[rule.partId]) return 'diagram';
  return rule.anyOfKinds[0];
}

function emptyPart(route, rule) {
  const table = tableTemplate(route, rule.partId);
  const diagram = route.diagramTemplates?.[rule.partId];
  return {
    kind: defaultKind(route, rule),
    text: '',
    cells: table ? table.rows.map((r) => r.cells.map((c) => (c.editable ? '' : c.value))) : null,
    selectedId: '', reason: '',
    savedTable: null,
    nodeIds: diagram ? [...diagram.initialNodeIds] : [],
    edgeKeys: diagram ? (diagram.initialEdges || []).map(edgeKey) : [],
    description: ''
  };
}

export const edgeKey = (e) => `${e.fromId}>${e.toId}>${e.label}`;

export function emptyWork(route, { supportMode = 'guided' } = {}) {
  return {
    supportMode: route.supportModes.includes(supportMode) ? supportMode : route.supportModes[0],
    activeStepId: route.steps[0].id,
    answers: {},
    parts: Object.fromEntries(route.requiredParts.map((rule) => [rule.partId, emptyPart(route, rule)])),
    reflection: '',
    previousSubmissionId: null
  };
}

/** Immutable updates. */
export const withAnswer = (work, stepId, answer) => ({ ...work, answers: { ...work.answers, [stepId]: answer } });
export const withPart = (work, partId, patch) => ({ ...work, parts: { ...work.parts, [partId]: { ...work.parts[partId], ...patch } } });
export function withCell(work, partId, row, col, value) {
  const cells = work.parts[partId].cells.map((r, i) => (i === row ? r.map((c, j) => (j === col ? value : c)) : r));
  return withPart(work, partId, { cells });
}

/** One notebook part in contract wire form (current chosen format only). */
export function partToWire(route, partId, p) {
  if (p.kind === 'text') return { partId, kind: 'text', text: p.text };
  if (p.kind === 'choice') return { partId, kind: 'choice', selectedId: p.selectedId, reason: p.reason };
  if (p.kind === 'table') {
    if (p.savedTable) return { partId, kind: 'table', caption: p.savedTable.caption, columns: [...p.savedTable.columns], rows: p.savedTable.rows.map((r) => [...r]) };
    const t = tableTemplate(route, partId);
    return { partId, kind: 'table', caption: t.caption, columns: [...t.columns], rows: p.cells.map((r) => [...r]) };
  }
  if (p.kind === 'diagram') {
    const t = route.diagramTemplates[partId];
    const nodes = t.nodeVocabulary.filter((n) => p.nodeIds.includes(n.id)).map((n) => ({ id: n.id, label: n.label }));
    const present = new Set(nodes.map((n) => n.id));
    const edges = t.edgeVocabulary.filter((e) => p.edgeKeys.includes(edgeKey(e)) && present.has(e.fromId) && present.has(e.toId))
      .map((e) => ({ fromId: e.fromId, toId: e.toId, label: e.label }));
    return { partId, kind: 'diagram', nodes, edges, description: p.description };
  }
  throw new Error(`Unknown part kind ${p.kind}`);
}

export const evidenceFromWork = (route, work) => route.requiredParts.map((rule) => partToWire(route, rule.partId, work.parts[rule.partId]));

const hasBlank = (s) => /(^|\s)__+(\s|[.,;:]|$)/.test(s);

/**
 * Whether one part is ready to send: it passes the shared validator on its own,
 * every editable table cell is filled, and no sentence-starter blank (“__”) is left.
 * A complete part is not an approved part.
 */
export function partStatus(route, partId, p) {
  const wire = partToWire(route, partId, p);
  const rule = route.requiredParts.find((r) => r.partId === partId);
  // An empty explanation is "not started", not a length problem (the shared message speaks only to the upper limit).
  if (wire.kind === 'text' && !(wire.text || '').trim()) return { complete: false, reason: 'Write your explanation for this part.' };
  const alone = validateEvidence([wire], { ...route, requiredParts: [rule] });
  if (!alone.ok) return { complete: false, reason: alone.error.message };
  if (wire.kind === 'table' && !p.savedTable) {
    const t = tableTemplate(route, partId);
    const empty = t.rows.some((r, i) => r.cells.some((c, j) => c.editable && !p.cells[i][j].trim()));
    if (empty) return { complete: false, reason: 'Fill every blank cell, or switch to a written explanation.' };
  }
  const words = [wire.text, wire.reason, wire.description].filter(Boolean).join(' ');
  if (hasBlank(words)) return { complete: false, reason: 'Replace each “__” in the starter with your own words.' };
  return { complete: true, reason: '' };
}

function answersToWire(route, work) {
  const out = [];
  for (const step of route.steps) {
    const a = work.answers[step.id];
    if (!a) continue;
    if (step.kind === 'number') out.push({ stepId: step.id, kind: 'number', rawText: a.rawText ?? '', value: parseNumber(a.rawText ?? '', step) });
    else if (step.kind === 'choose') out.push({ stepId: step.id, kind: 'choose', selectedId: a.selectedId ?? '' });
    else if (step.kind === 'reflect') out.push({ stepId: step.id, kind: 'reflect', text: a.text ?? '' });
  }
  return out;
}

const bodyIdentity = (identity) => Object.fromEntries(IDENTITY_KEYS.filter((k) => k !== 'missionId').map((k) => [k, identity[k]]));

export function draftBody(route, identity, work, expectedRevision) {
  const body = {
    ...bodyIdentity(identity), expectedRevision, supportMode: work.supportMode, activeStepId: work.activeStepId,
    answers: answersToWire(route, work), evidence: evidenceFromWork(route, work), reflection: work.reflection
  };
  if (work.previousSubmissionId) body.previousSubmissionId = work.previousSubmissionId;
  return body;
}

export function submissionBody(route, identity, work) {
  return {
    ...bodyIdentity(identity), supportMode: work.supportMode, previousSubmissionId: work.previousSubmissionId || null,
    reflection: work.reflection, evidence: evidenceFromWork(route, work)
  };
}

/** Local pre-checks with the same shared validators the server uses. Advisory only: the server decides. */
export const checkDraft = (registry, identity, body) => validateDraft({ contractVersion: '1.0.0', ...body }, { registry, missionId: identity.missionId });
export const checkSubmission = (registry, identity, body) => validateSubmission({ contractVersion: '1.0.0', ...body }, { registry, missionId: identity.missionId });
export const resolveIdentity = (registry, identity) => resolveTask(registry, identity);

/** Restore a part from wire form into the editor state, keeping the other alternatives empty. */
function partFromWire(route, rule, wire) {
  const p = emptyPart(route, rule);
  if (!wire || !rule.anyOfKinds.includes(wire.kind)) return p;
  p.kind = wire.kind;
  if (wire.kind === 'text') p.text = wire.text ?? '';
  if (wire.kind === 'choice') { p.selectedId = wire.selectedId ?? ''; p.reason = wire.reason ?? ''; }
  if (wire.kind === 'table') {
    const t = tableTemplate(route, rule.partId);
    // Same size is not enough: a different caption, column label or given cell means a different table.
    const fits = !!t && p.cells && wire.caption === t.caption && Array.isArray(wire.columns) &&
      wire.columns.length === t.columns.length && wire.columns.every((c, i) => c === t.columns[i]) &&
      Array.isArray(wire.rows) && wire.rows.length === t.rows.length &&
      wire.rows.every((r, i) => Array.isArray(r) && r.length === t.rows[i].cells.length &&
        t.rows[i].cells.every((c, j) => c.editable || r[j] === c.value));
    // A table saved in another layout is kept exactly as sent, never reshaped into the template.
    if (fits) p.cells = wire.rows.map((r) => r.map(String));
    else p.savedTable = { caption: wire.caption ?? '', columns: [...(wire.columns || [])], rows: (wire.rows || []).map((r) => r.map(String)) };
  }
  if (wire.kind === 'diagram') {
    p.nodeIds = (wire.nodes || []).map((n) => n.id);
    p.edgeKeys = (wire.edges || []).map(edgeKey);
    p.description = wire.description ?? '';
  }
  return p;
}

/** Work restored from a server draft or a returned submission (revise). */
export function workFromSaved(route, saved, { previousSubmissionId } = {}) {
  const base = emptyWork(route, { supportMode: saved.supportMode });
  const byPart = new Map((saved.evidence || []).map((e) => [e.partId, e]));
  const answers = {};
  for (const a of saved.answers || []) {
    if (a.kind === 'number') answers[a.stepId] = { rawText: a.rawText ?? '' };
    else if (a.kind === 'choose') answers[a.stepId] = { selectedId: a.selectedId ?? '' };
    else if (a.kind === 'reflect') answers[a.stepId] = { text: a.text ?? '' };
  }
  return {
    ...base,
    activeStepId: route.steps.some((s) => s.id === saved.activeStepId) ? saved.activeStepId : base.activeStepId,
    answers,
    parts: Object.fromEntries(route.requiredParts.map((rule) => [rule.partId, partFromWire(route, rule, byPart.get(rule.partId))])),
    reflection: saved.reflection ?? '',
    previousSubmissionId: previousSubmissionId ?? saved.previousSubmissionId ?? null
  };
}

/** Count text the way the shared validators do (Unicode code points). */
export const codePoints = (s) => Array.from(s || '').length;
