/**
 * What other screens (e.g. My Universe workstations) need to know about Hex-Grid
 * scenarios, without loading the model. The full scenario lives in scenarios.js.
 */
export const SCENARIO_INFO = {
  'thalassa-station': {
    id: 'thalassa-station',
    activityId: 'hexgrid',
    status: 'draft',
    title: 'Platform design lab',
    summary: 'Build a floating home for 200 researchers in Project Hex-Grid: keep it afloat, fed, watered and powered through the night.'
  }
};
export const scenarioInfo = (id) => (typeof id === 'string' && SCENARIO_INFO[id]) || null;
