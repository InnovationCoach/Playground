/**
 * Balanced, capacity-aware Student-to-Planet Allocation Service.
 * Supports admin configuration up to 100 planets, galaxy balancing,
 * and disabled-planet exclusion without duplicating records.
 */

import { PLANET_PROFILES } from '../../../src/features/universe/playground/playgroundModel.js';

export const DEFAULT_ALLOCATION_CONFIG = {
  maxPlanets: 100,
  maxStewardsPerPlanet: 3,
  disabledPlanetIds: []
};

export const PLANET_GALAXY_MAP = {
  thalassa: 'lyra-spiral',
  ignis: 'lyra-spiral',
  boreas: 'lyra-spiral',
  pelagos: 'lyra-spiral',
  cinder: 'lyra-spiral',
  aurelia: 'aurora-elliptical',
  glaciera: 'aurora-elliptical',
  pyros: 'aurora-elliptical',
  umbrion: 'aurora-elliptical',
  veridia: 'aurora-elliptical',
  nyxara: 'cygnus-nebula',
  koralis: 'cygnus-nebula',
  frostholm: 'cygnus-nebula',
  zephyria: 'cygnus-nebula',
  'obsidian-reach': 'cygnus-nebula'
};

/**
 * Selects the most balanced available exoplanet for `uid`.
 * - If `uid` is already assigned to an enabled planet, returns that planet.
 * - Otherwise picks an enabled planet under capacity, preferring:
 *   1) unoccupied planets (0 stewards)
 *   2) galaxies with fewer assigned stewards
 *   3) planets with lowest current steward count
 */
export function selectBalancedPlanet({
  uid,
  planetIds = Object.keys(PLANET_PROFILES),
  existingAssignments = {}, // { [planetId]: string[] }
  config = DEFAULT_ALLOCATION_CONFIG
} = {}) {
  if (!uid) return { ok: false, reason: 'missing-uid' };
  const maxPerPlanet = Math.max(1, Number(config?.maxStewardsPerPlanet) || DEFAULT_ALLOCATION_CONFIG.maxStewardsPerPlanet);
  const maxPlanets = Math.min(100, Math.max(1, Number(config?.maxPlanets) || DEFAULT_ALLOCATION_CONFIG.maxPlanets));
  const disabled = new Set(Array.isArray(config?.disabledPlanetIds) ? config.disabledPlanetIds : []);

  const activePool = planetIds.slice(0, maxPlanets).filter((id) => !disabled.has(id));
  if (!activePool.length) return { ok: false, reason: 'no-available-planets' };

  // Keep existing assignment if valid and enabled
  for (const pid of activePool) {
    const stewards = Array.isArray(existingAssignments[pid]) ? existingAssignments[pid] : [];
    if (stewards.includes(uid)) {
      return { ok: true, planetId: pid, galaxyId: PLANET_GALAXY_MAP[pid] || 'lyra-spiral', reused: true };
    }
  }

  // Count stewards per galaxy for balanced distribution
  const galaxyLoads = {};
  for (const pid of activePool) {
    const g = PLANET_GALAXY_MAP[pid] || 'lyra-spiral';
    const count = Array.isArray(existingAssignments[pid]) ? existingAssignments[pid].length : 0;
    galaxyLoads[g] = (galaxyLoads[g] || 0) + count;
  }

  const eligible = activePool
    .map((pid) => {
      const count = Array.isArray(existingAssignments[pid]) ? existingAssignments[pid].length : 0;
      const g = PLANET_GALAXY_MAP[pid] || 'lyra-spiral';
      return { pid, count, galaxyLoad: galaxyLoads[g] || 0 };
    })
    .filter((entry) => entry.count < maxPerPlanet);

  if (!eligible.length) {
    return { ok: false, reason: 'capacity-reached' };
  }

  eligible.sort((a, b) => {
    if (a.count !== b.count) return a.count - b.count;
    if (a.galaxyLoad !== b.galaxyLoad) return a.galaxyLoad - b.galaxyLoad;
    return a.pid.localeCompare(b.pid);
  });

  const chosen = eligible[0];
  return {
    ok: true,
    planetId: chosen.pid,
    galaxyId: PLANET_GALAXY_MAP[chosen.pid] || 'lyra-spiral',
    reused: false
  };
}
