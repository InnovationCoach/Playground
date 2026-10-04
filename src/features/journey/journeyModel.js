/**
 * Portfolio maker helpers (pure, unit-tested in tests/journey.test.jsx).
 *
 * A learner's design journey is built from two sources:
 * - portfolio items (learnerPortfolios, server-validated uploads) tagged with a
 *   design-thinking `phase`; one written item per phase may be the stage
 *   reflection (`phaseReflection: true`);
 * - text/link evidence already recorded in PBL Studio (read-only here).
 */
import { PHASES } from '../pbl/content/pblModel.js';

export const STAGES = PHASES;

const MODEL_EXT = /\.(glb|gltf|obj)$/i;
const CODE_EXT = /\.(zip|txt|py|js|ts|json|html|css|ino)$/i;

/** Portfolio work type for an uploaded file, or null if it is not supported. */
export function kindForFile(file) {
  const name = file?.name || '';
  const type = (file?.type || '').split(';')[0];
  if (/^image\/(jpeg|png|webp|gif)$/.test(type)) return 'image';
  if (/^(audio|video)\//.test(type)) return 'recording';
  if (MODEL_EXT.test(name)) return 'model';
  if (CODE_EXT.test(name)) return 'code';
  return null;
}

/** A readable default title from a filename ("solar_test-2.jpg" → "solar test 2"). */
export function titleFromFile(name) {
  return String(name || 'Evidence').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 160) || 'Evidence';
}

export function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

/** { [phaseId]: { evidence: item[], reflection: item|null, studio: entry[] } } */
export function groupJourney(items = [], project = null) {
  const out = Object.fromEntries(STAGES.map((s) => [s.id, { evidence: [], reflection: null, studio: [] }]));
  for (const item of items) {
    if (!item?.phase || !out[item.phase]) continue;
    if (item.phaseReflection) out[item.phase].reflection = item;
    else out[item.phase].evidence.push(item);
  }
  for (const entry of project?.evidence || []) {
    if (out[entry.phase]) out[entry.phase].studio.push(entry);
  }
  return out;
}

/** 'complete' (reflection + some evidence) | 'inProgress' | 'notStarted'. */
export function stageStatus(group) {
  const hasEvidence = group.evidence.length + group.studio.length > 0;
  const hasReflection = Boolean(group.reflection?.body?.trim());
  if (hasEvidence && hasReflection) return 'complete';
  if (hasEvidence || hasReflection) return 'inProgress';
  return 'notStarted';
}

export function journeyProgress(groups) {
  const statuses = STAGES.map((s) => stageStatus(groups[s.id]));
  return { done: statuses.filter((s) => s === 'complete').length, total: STAGES.length, statuses };
}

/** The item body sent to the API for a stage reflection (create or update). */
export function reflectionItem(stage, text, existing) {
  return {
    ...(existing ? { id: existing.id, revision: existing.revision } : {}),
    kind: 'writing',
    title: `${stage.title} reflection`,
    body: text.trim(),
    link: '',
    media: null,
    audiences: existing?.audiences || [],
    phase: stage.id,
    phaseReflection: true
  };
}
