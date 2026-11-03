/** Local orientation only. No observations, assessment, persistence or access grants. */
export const PLANET_ARRIVAL_DESIGN_VERSION = '1.0.0';
export const ARRIVAL_EXPLORATION_MS = 45_000;

const designs = [
  {
    planetId: 'thalassa', environmentId: 'thalassa-station', title: 'Welcome to Thalassa',
    lookPrompt: 'Look around the platform, shoreline and weather mast. What might change from one place to another?',
    equipment: { id: 'wind-sensor', name: 'Portable wind sensor', purpose: 'Plan where you would measure the wind.' },
    sites: [
      { id: 'mast-base', locationId: 'weather-mast', name: 'Beside the weather mast', offset: [3, 0, 3], prompt: 'What would you record to compare wind readings from two places?' },
      { id: 'platform-deck', locationId: 'platform', name: 'On the research platform', offset: [-2, 0, -2], prompt: 'How might nearby structures affect what a sensor records?' },
      { id: 'water-level-site', locationId: 'tide-gauge', name: 'Near the tide gauge', offset: [3, 0, 0], prompt: 'Which height would you record along with a wind reading?' }
    ],
    placementNote: 'Placed for this visit only. Placement collects no readings; the mission uses its supplied data.'
  },
  {
    planetId: 'ignis', environmentId: 'ignis-fissure-field', title: 'Welcome to Ignis',
    lookPrompt: 'Look around the open ground, rock columns and sensor station. Where would you investigate first?',
    equipment: { id: 'solar-meter', name: 'Solar meter', purpose: 'Plan where you would compare available sunlight.' },
    sites: [
      { id: 'station-clearing', locationId: 'sensor-station', name: 'Sensor station clearing', offset: [-3, 0, -3], prompt: 'Which nearby structures might change the light reaching a meter?' },
      { id: 'column-terrace', locationId: 'columns', name: 'By the basalt columns', offset: [3, 0, 2], prompt: 'Would you compare open ground and a shaded spot?' },
      { id: 'fissure-viewpoint', locationId: 'fissure', name: 'Fissure viewpoint', offset: [9, 0, 7], prompt: 'Which observations would help you choose a future measurement site?' }
    ],
    placementNote: 'Placed for this visit only. Placement collects no readings; the mission uses its supplied data.'
  }
];

function freezeDeep(value) {
  Object.freeze(value);
  for (const child of Object.values(value)) if (child && typeof child === 'object' && !Object.isFrozen(child)) freezeDeep(child);
  return value;
}
export const PLANET_ARRIVAL_DESIGNS = freezeDeep(designs);
export const getPlanetArrivalDesign = planetId => PLANET_ARRIVAL_DESIGNS.find(d => d.planetId === planetId) || null;

/** The UI keys this memory to the current learner/org + planet visit. Never put it in a mission request. */
export const createArrivalState = () => ({
  phase: 'exploring', elapsedMs: 0, siteId: null, placedSiteId: null, postponed: false, skipped: false
});

/** Call with elapsed visible time only; the UI resets its clock when visibility/activity changes. */
export function advanceArrival(state, deltaMs, { active, visible, ready, missionOpen = false } = {}) {
  if (state.phase !== 'exploring' || state.postponed || active !== true || visible !== true || ready !== true || missionOpen
    || !Number.isFinite(deltaMs) || deltaMs <= 0) return state;
  const elapsedMs = Math.min(ARRIVAL_EXPLORATION_MS, state.elapsedMs + deltaMs);
  return { ...state, elapsedMs, phase: elapsedMs >= ARRIVAL_EXPLORATION_MS ? 'placing' : 'exploring' };
}

/** No correctness check: all authored sites are possible plans, not validated engineering locations. */
export function reduceArrival(state, action, design) {
  if (!design || !action || typeof action.type !== 'string') return state;
  const validSite = id => design.sites.some(site => site.id === id);
  switch (action.type) {
    case 'ready-now':
      return state.phase === 'exploring'
        ? { ...state, phase: state.placedSiteId || state.skipped ? 'ready' : 'placing', postponed: false }
        : state;
    case 'keep-exploring':
      // An explicit dismissal must not be undone by another timer callback.
      return { ...state, phase: 'exploring', postponed: true };
    case 'select-site':
      return state.phase === 'placing' && validSite(action.siteId) ? { ...state, siteId: action.siteId } : state;
    case 'place':
      return state.phase === 'placing' && validSite(state.siteId)
        ? { ...state, phase: 'ready', placedSiteId: state.siteId, skipped: false } : state;
    case 'move':
      return state.phase === 'ready' ? { ...state, phase: 'placing', siteId: state.placedSiteId, postponed: false } : state;
    case 'skip-setup':
      return { ...state, phase: 'ready', siteId: state.placedSiteId, skipped: !state.placedSiteId, postponed: false };
    default: return state;
  }
}
