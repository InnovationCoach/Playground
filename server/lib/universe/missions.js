/**
 * Server Authoritative Mission Registry
 * Conforms to GEMINI GO-4.md §4.
 *
 * The server must never trust mission metadata sent by the client.
 * Tracks valid missions, supported versions, routes, and educator review status.
 */

export const MISSIONS = {
  'spacecraft-journey': {
    id: 'spacecraft-journey',
    title: 'Plan a journey to Ignis',
    versions: {
      '0.1.0-draft': {
        version: '0.1.0-draft',
        status: 'draft', // 'draft' | 'reviewed'
        routes: ['guided', 'advanced'],
        planetIds: ['thalassa', 'ignis']
      }
    },
    currentVersion: '0.1.0-draft',
    status: 'draft',
    routes: ['guided', 'advanced']
  }
};

/**
 * Retrieve mission metadata by ID.
 */
export function getMission(missionId) {
  return MISSIONS[missionId] || null;
}

/**
 * Verify that a mission, version, and route are valid.
 */
export function isValidMissionRoute(missionId, version, routeId) {
  const mission = getMission(missionId);
  if (!mission) return false;
  const versionObj = mission.versions?.[version];
  if (!versionObj) return false;
  return Array.isArray(versionObj.routes) && versionObj.routes.includes(routeId);
}

/**
 * Verify whether a mission version has educator review sign-off.
 */
export function isMissionReviewed(missionId, version) {
  const mission = getMission(missionId);
  if (!mission) return false;
  const versionObj = mission.versions?.[version];
  if (!versionObj) return false;
  return versionObj.status === 'reviewed';
}
