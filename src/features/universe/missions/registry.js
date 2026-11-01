/** Every mission the explorer knows. Drafts appear only in labelled previews until an educator reviews them. */
import { SPACECRAFT_JOURNEY } from './spacecraftJourney.js';
import { THALASSA_WIND_SURVEY } from './thalassaWindSurvey.js';

export const MISSIONS = [SPACECRAFT_JOURNEY, THALASSA_WIND_SURVEY];
const visible = (m, { preview }) => m.status !== 'draft' || preview;
export const missionById = (id) => MISSIONS.find((m) => m.id === id) || null;
export const missionsForPlanet = (planetId, opts) => MISSIONS.filter((m) => m.planetIds.includes(planetId) && visible(m, opts));
/** A mission placed at a workstation, if it may be shown. */
export const visibleMission = (id, opts) => { const m = missionById(id); return m && visible(m, opts) ? m : null; };
