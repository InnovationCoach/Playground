/**
 * Server Authoritative Mission Registry & Planet Unlock Map
 * Conforms to GEMINI GO-4.md §4 and Review Fixes 1–3.
 *
 * The server must never trust mission or unlock metadata sent by the client.
 * All unlock decisions fail closed: unlisted planets are locked.
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
 * Server-side Planet Unlock Map (Matching Catalog 1.1.0)
 * Unlisted or unknown planets always fail closed ({ type: 'locked' }).
 */
export const PLANET_UNLOCKS = {
  'thalassa': { type: 'public' },
  'ignis': { type: 'public' },
  'boreas': { type: 'mission-approved', missionId: 'spacecraft-journey' }
};

/**
 * Retrieve mission metadata by ID.
 */
export function getMission(missionId) {
  return MISSIONS[missionId] || null;
}

/**
 * Retrieve planet unlock specification.
 * Fails closed: unlisted planets return { type: 'locked', reason: 'unknown-destination' }.
 */
export function getPlanetUnlock(planetId) {
  return PLANET_UNLOCKS[planetId] || { type: 'locked', reason: 'unknown-destination' };
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

/**
 * Determine if running in local emulator environment.
 * ALLOW_DRAFT_MISSIONS is only honoured when this returns true.
 */
export function isEmulatorEnvironment() {
  return process.env.FUNCTIONS_EMULATOR === 'true' || Boolean(process.env.FIRESTORE_EMULATOR_HOST);
}
