import { hydrateProject, phaseProgress, readiness } from '../pbl/engine/pblProject.js';
import { TERM, PHASES } from '../pbl/content/pblModel.js';

export function projectProgress(records) {
  const raw = records?.[`pbl-${TERM.id}`];
  if (!raw || raw.termId !== TERM.id) return null;
  const project = hydrateProject(raw, TERM.id);
  const phases = PHASES.map(phase => ({ ...phase, ...phaseProgress(project, phase.id) }));
  return { project, phases, readiness: readiness(project) };
}

export const STEAM_ACTIVITIES = [
  ['urban-heat', 'Urban Heat'], ['bunker', 'Bunker Survival'], ['microbit', 'Micro:bit Coding'],
  ['bangkok', 'Bangkok Coastal'], ['solar-car', 'Solar Car'], ['so2-sulfate', 'SO₂ Simulation'],
  ['plant-lab', 'Plant Microscope Lab'], ['hex-grid', 'Project Hex Grid']
];

export function activityProgress(id, record) {
  if (!record) return { status: 'No cloud record', detail: 'Work saved only on the learner’s device will not appear here.' };
  let detail = 'A cloud record is available to inspect.';
  if (id === 'solar-car') {
    const runs = Array.isArray(record.runs) ? record.runs : [];
    const timed = runs.filter(r => Number.isFinite(Number(r.seconds)) && Number(r.seconds) > 0);
    detail = `${timed.length} timed ${timed.length === 1 ? 'run' : 'runs'} recorded${record.version ? ` · Build v${record.version}` : ''}`;
  } else if (id === 'plant-lab') detail = `${Array.isArray(record.records) ? record.records.length : 0} lab entries recorded`;
  else if (typeof record.score === 'number') detail = `Recorded score: ${record.score}`;
  else if (typeof record.xp === 'number') detail = `Recorded XP: ${record.xp}`;
  return { status: record.completed === true ? 'Marked complete' : 'Cloud record available', detail };
}

export function dateLabel(value) {
  const date = value?.toDate?.() || new Date(value);
  return value && Number.isFinite(date.getTime()) ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'No update recorded';
}
