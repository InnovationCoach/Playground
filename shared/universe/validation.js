import { API_CONTRACT_VERSION, MAX_REQUEST_BYTES } from './constants.js';
import { canonicalStringify } from './canonical.js';
import { parseNumber } from './numbers.js';

const IDENTITY_KEYS = ['releaseId', 'missionId', 'missionVersion', 'routeId', 'taskId', 'policyVersion'];
const BODY_IDENTITY_KEYS = IDENTITY_KEYS.filter(k => k !== 'missionId');
const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;
const ok = value => ({ ok: true, value });
const fail = (message, field = null, code = 'VALIDATION_ERROR') => ({ ok: false, error: { code, message, field } });
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const chars = value => Array.from(value).length;
const boundedText = (value, min, max) => typeof value === 'string' &&
  chars(value.trim()) >= min && chars(value) <= max;
const keysAllowed = (value, keys) => plain(value) && Object.keys(value).every(k => keys.includes(k));
const id = value => typeof value === 'string' && SAFE_ID.test(value);
const revision = (value, min = 0) => Number.isSafeInteger(value) && value >= min;

function bodyBound(body) {
  if (!plain(body)) return fail('Expected a JSON object.');
  try {
    const bytes = new TextEncoder().encode(canonicalStringify(body)).byteLength;
    if (bytes > MAX_REQUEST_BYTES) return fail('Keep this work within 64 KiB.', null, 'PAYLOAD_TOO_LARGE');
  } catch {
    return fail('Expected finite JSON values.');
  }
  return null;
}

function contract(body) {
  return body.contractVersion === API_CONTRACT_VERSION ? null :
    fail('This mission request uses an unsupported contract version.', 'contractVersion', 'CONTRACT_VERSION_UNSUPPORTED');
}

export function resolveTask(registry, identity) {
  if (!plain(identity) || !IDENTITY_KEYS.every(k => id(identity[k]))) return fail('Supply the exact task identity.', 'identity');
  if (!Array.isArray(registry)) return fail('This mission version is unavailable.', 'releaseId', 'CONTENT_VERSION_UNAVAILABLE');
  const bundles = registry.filter(b => b.releaseId === identity.releaseId);
  if (bundles.length !== 1) return fail('This mission release is unavailable.', 'releaseId', 'CONTENT_VERSION_UNAVAILABLE');
  const bundle = bundles[0];
  const mission = bundle.missions?.find(m => m.id === identity.missionId && m.version === identity.missionVersion);
  if (!mission) return fail('This mission version is unavailable.', 'missionVersion', 'CONTENT_VERSION_UNAVAILABLE');
  const route = mission.routes?.find(r => r.id === identity.routeId && r.taskId === identity.taskId);
  if (!route) return fail('This task route is unavailable.', 'routeId', 'NOT_FOUND');
  if (bundle.policy?.version !== identity.policyVersion || mission.completionPolicyRef !== identity.policyVersion)
    return fail('This outcome policy is unavailable.', 'policyVersion', 'POLICY_VERSION_UNAVAILABLE');
  return ok({ bundle, mission, route, policy: bundle.policy,
    identity: Object.fromEntries(IDENTITY_KEYS.map(k => [k, identity[k]])) });
}

function evidencePart(part, route, partial, index) {
  const field = 'evidence[' + index + ']';
  if (!plain(part)) return fail('Use a structured notebook part.', field);
  const rule = route.requiredParts.find(p => p.partId === part.partId);
  if (!rule || !rule.anyOfKinds.includes(part.kind)) return fail('Use a known part and an accepted evidence format.', field);
  switch (part.kind) {
    case 'text':
      if (!keysAllowed(part, ['partId', 'kind', 'text']) || !boundedText(part.text, partial ? 0 : 1, 2000))
        return fail('Keep this explanation within 2,000 characters.', field + '.text');
      break;
    case 'choice': {
      if (!keysAllowed(part, ['partId', 'kind', 'selectedId', 'reason']) ||
          !(partial && part.selectedId === '') && !route.choiceOptions?.[part.partId]?.includes(part.selectedId))
        return fail('Choose one of this task’s options.', field + '.selectedId');
      if (!boundedText(part.reason, partial ? 0 : 1, 2000)) return fail('Add a reason within 2,000 characters.', field + '.reason');
      break;
    }
    case 'table': {
      if (!keysAllowed(part, ['partId', 'kind', 'caption', 'columns', 'rows']) ||
          !boundedText(part.caption, partial ? 0 : 1, 2000) || !Array.isArray(part.columns) ||
          part.columns.length < 1 || part.columns.length > 8 ||
          !part.columns.every(c => boundedText(c, partial ? 0 : 1, 200)) || !Array.isArray(part.rows) ||
          part.rows.length < (partial ? 0 : 1) || part.rows.length > 30 ||
          !part.rows.every(row => Array.isArray(row) && row.length === part.columns.length && row.every(c => boundedText(c, 0, 200))))
        return fail('Use a captioned table with at most 8 columns, 30 rows and 200 characters per cell.', field);
      break;
    }
    case 'diagram': {
      if (!keysAllowed(part, ['partId', 'kind', 'nodes', 'edges', 'description']) || !Array.isArray(part.nodes) ||
          !Array.isArray(part.edges) || part.nodes.length > 12 || part.edges.length > 20 ||
          part.nodes.length < (partial ? 0 : 1) || !boundedText(part.description, partial ? 0 : 1, 2000))
        return fail('Use a bounded route diagram and an equivalent description.', field);
      const nodes = new Map();
      const template = route.diagramTemplates?.[part.partId];
      for (const node of part.nodes) {
        if (!keysAllowed(node, ['id', 'label']) || !id(node.id) || nodes.has(node.id) || !boundedText(node.label, 1, 120))
          return fail('Use unique, labeled route nodes.', field + '.nodes');
        if (template && !template.nodeVocabulary.some(n => n.id === node.id && n.label === node.label))
          return fail('Select nodes from this task’s route vocabulary.', field + '.nodes');
        nodes.set(node.id, node);
      }
      const edges = new Set();
      for (const edge of part.edges) {
        if (!keysAllowed(edge, ['fromId', 'toId', 'label']) || !nodes.has(edge.fromId) || !nodes.has(edge.toId) ||
            !boundedText(edge.label, 1, 120)) return fail('Each relationship must reference route nodes.', field + '.edges');
        const key = JSON.stringify([edge.fromId, edge.toId, edge.label]);
        if (edges.has(key)) return fail('Remove the duplicate route relationship.', field + '.edges');
        if (template && !template.edgeVocabulary.some(e => e.fromId === edge.fromId && e.toId === edge.toId && e.label === edge.label))
          return fail('Select a relationship from this task’s vocabulary.', field + '.edges');
        edges.add(key);
      }
      break;
    }
    default: return fail('This evidence format is unavailable.', field + '.kind');
  }
  return ok(part);
}

export function validateEvidence(evidence, route, { partial = false } = {}) {
  if (!Array.isArray(evidence) || evidence.length > 8 || !Array.isArray(route?.requiredParts))
    return fail('Use at most eight authored notebook parts.', 'evidence');
  const seen = new Set();
  for (let i = 0; i < evidence.length; i++) {
    const part = evidence[i];
    if (seen.has(part?.partId)) return fail('Each notebook part appears once.', 'evidence[' + i + '].partId');
    const result = evidencePart(part, route, partial, i);
    if (!result.ok) return result;
    seen.add(part.partId);
  }
  if (!partial && route.requiredParts.some(p => !seen.has(p.partId))) return fail('Complete every required notebook part.', 'evidence');
  return ok(evidence);
}

function taskFromBody(body, options) {
  if (!id(options?.missionId)) return fail('A mission endpoint is required.', 'missionId');
  return resolveTask(options.registry, { ...Object.fromEntries(BODY_IDENTITY_KEYS.map(k => [k, body[k]])), missionId: options.missionId });
}

export function validateSubmission(body, options) {
  const bounds = bodyBound(body);
  if (bounds) return bounds;
  const version = contract(body);
  if (version) return version;
  if (!keysAllowed(body, ['contractVersion', ...BODY_IDENTITY_KEYS, 'supportMode', 'previousSubmissionId', 'reflection', 'evidence']))
    return fail('The submission contains unsupported fields.');
  const task = taskFromBody(body, options);
  if (!task.ok) return task;
  if (!task.value.route.supportModes.includes(body.supportMode)) return fail('Select a supported help mode.', 'supportMode');
  if (body.previousSubmissionId !== null && !id(body.previousSubmissionId)) return fail('Supply a prior submission ID or null.', 'previousSubmissionId');
  if (!boundedText(body.reflection, 20, 2000)) return fail('Use a reflection of 20–2,000 characters.', 'reflection');
  const evidence = validateEvidence(body.evidence, task.value.route);
  return evidence.ok ? ok({ ...body }) : evidence;
}

export function validateDraft(body, options) {
  const bounds = bodyBound(body);
  if (bounds) return bounds;
  const version = contract(body);
  if (version) return version;
  if (!keysAllowed(body, ['contractVersion', ...BODY_IDENTITY_KEYS, 'expectedRevision', 'supportMode', 'activeStepId',
    'answers', 'evidence', 'reflection', 'previousSubmissionId'])) return fail('The draft contains unsupported fields.');
  const task = taskFromBody(body, options);
  if (!task.ok) return task;
  const route = task.value.route;
  if (!revision(body.expectedRevision)) return fail('Use the current draft revision.', 'expectedRevision');
  if (!route.supportModes.includes(body.supportMode)) return fail('Select a supported help mode.', 'supportMode');
  if (!route.steps.some(s => s.id === body.activeStepId)) return fail('Select a step from this task.', 'activeStepId');
  if (body.reflection !== undefined && !boundedText(body.reflection, 0, 2000)) return fail('Keep reflection within 2,000 characters.', 'reflection');
  if (body.previousSubmissionId !== undefined && body.previousSubmissionId !== null && !id(body.previousSubmissionId))
    return fail('Use a prior submission ID or null.', 'previousSubmissionId');
  if (!Array.isArray(body.answers) || body.answers.length > route.steps.length) return fail('Use answers from this task.', 'answers');
  const seen = new Set();
  const answers = [];
  for (let i = 0; i < body.answers.length; i++) {
    const answer = body.answers[i];
    const step = plain(answer) && route.steps.find(s => s.id === answer.stepId);
    const field = 'answers[' + i + ']';
    if (!step || seen.has(answer.stepId) || step.kind !== answer.kind) return fail('Use one answer per known step.', field);
    seen.add(answer.stepId);
    if (answer.kind === 'number') {
      if (!keysAllowed(answer, ['stepId', 'kind', 'rawText', 'value']) || typeof answer.rawText !== 'string' ||
          answer.rawText.length > 64 || !(answer.value === null || typeof answer.value === 'number' && Number.isFinite(answer.value)))
        return fail('Keep the raw numeric input within 64 characters.', field);
      answers.push({ ...answer, value: parseNumber(answer.rawText, step) });
    } else if (answer.kind === 'choose') {
      if (!keysAllowed(answer, ['stepId', 'kind', 'selectedId']) ||
          !(answer.selectedId === '' || step.choices.some(c => c.id === answer.selectedId))) return fail('Use an authored choice.', field);
      answers.push({ ...answer });
    } else if (answer.kind === 'reflect') {
      if (!keysAllowed(answer, ['stepId', 'kind', 'text']) || !boundedText(answer.text, 0, 2000)) return fail('Keep this step note within 2,000 characters.', field);
      answers.push({ ...answer });
    } else return fail('This step type is unavailable.', field);
  }
  const evidence = validateEvidence(body.evidence, route, { partial: true });
  return evidence.ok ? ok({ ...body, answers }) : evidence;
}

export function validateReview(body) {
  const bounds = bodyBound(body);
  if (bounds) return bounds;
  const version = contract(body);
  if (version) return version;
  if (!keysAllowed(body, ['contractVersion', 'decision', 'note', 'expectedSubmissionRevision']) ||
      !['approved', 'returned'].includes(body.decision)) return fail('Choose a supported review decision.', 'decision');
  if (!revision(body.expectedSubmissionRevision, 1)) return fail('Use the current submission revision.', 'expectedSubmissionRevision');
  if (body.note === undefined && body.decision === 'approved') return ok({ ...body, note: '' });
  if (!boundedText(body.note, body.decision === 'returned' ? 1 : 0, 1000)) return fail('Use an actionable review note within 1,000 characters.', 'note');
  return ok({ ...body });
}
