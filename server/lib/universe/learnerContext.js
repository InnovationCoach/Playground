/**
 * Learner Intelligence Engine (Part 6 & Part 13).
 * Retrieves only the minimal, privacy-safe learner context needed for
 * personalized mission generation (no PII, no full database dumps).
 */

import { PLANET_PROFILES, getPlanetRecord, initialPlaygroundState } from '../../../src/features/universe/playground/playgroundModel.js';
import { PLANET_GALAXY_MAP } from './planetAllocation.js';

const CONDITION_BY_TRAIT = {
  'Steady Trade Swells': 'tidal_energy_and_buoyancy',
  'Geothermal Magma Rifts': 'thermal_management',
  'Sub-Glacial Brine Rings': 'cryogenic_filtration',
  'Mineral Reef Lagoons': 'water_salinity_balance',
  'Tide-Locked Obsidian Wind': 'wind_shear_shielding',
  'High-UV Golden Kelp Sea': 'solar_radiation_and_photosynthesis',
  'Cryo-Geyser Ice Canyons': 'water_scarcity_and_geyser_capture',
  'Tidal-Flex Silicate Spires': 'structural_engineering',
  'Twilight Bioluminescent Vents': 'low_light_ecology',
  'Emerald Spore Cloud Deck': 'atmospheric_oxygen_balance',
  'Magnetized Indigo Ice': 'magnetic_storm_deflection',
  'Carbonate Coral Shelves': 'carbon_scrubbing',
  'Geothermal Ice-Basalt Crust': 'subsurface_habitat_heating',
  'Twin-Sun Jetstream Swells': 'aerodynamic_propulsion',
  'Emerald Plasma Fissures': 'mineral_conductivity'
};

/**
 * Builds a minimal, PII-free learner context object from playground + mastery records.
 */
export function buildLearnerContext({
  uid,
  orgId,
  playgroundState = null,
  masterySummary = null,
  previousMissionTitles = [],
  ageBand = '13-15'
} = {}) {
  const pg = playgroundState || initialPlaygroundState('thalassa');
  const planetId = pg.claimedPlanetId || 'thalassa';
  const galaxyId = PLANET_GALAXY_MAP[planetId] || 'lyra-spiral';
  const planet = getPlanetRecord(pg, planetId);
  const profile = PLANET_PROFILES[planetId] || {};

  const strengths = [];
  const practiceAreas = [];

  if (planet.research >= 25) strengths.push('scientific_reasoning');
  else practiceAreas.push('measurement');

  if (planet.biodiversity >= 20) strengths.push('ecosystem_balance');
  else practiceAreas.push('biology_inquiry');

  if ((planet.features || []).length >= 2) strengths.push('engineering_design');
  else practiceAreas.push('engineering_design');

  if (Array.isArray(masterySummary?.verifiedCompetencies)) {
    for (const c of masterySummary.verifiedCompetencies.slice(0, 6)) {
      if (typeof c === 'string' && !strengths.includes(c)) strengths.push(c);
    }
  }
  if (Array.isArray(masterySummary?.practiceAreas)) {
    for (const p of masterySummary.practiceAreas.slice(0, 6)) {
      if (typeof p === 'string' && !practiceAreas.includes(p)) practiceAreas.push(p);
    }
  }

  return {
    scope: { uid: uid || 'anonymous', orgId: orgId || 'unknown' },
    ageBand,
    planetId,
    galaxyId,
    planetTrait: planet.trait || profile.trait || 'Frontier Exoplanet',
    planetCondition: CONDITION_BY_TRAIT[planet.trait || profile.trait] || 'resource_stewardship',
    metrics: {
      habitability: planet.habitability,
      biodiversity: planet.biodiversity,
      shielding: planet.shielding,
      research: planet.research,
      o2: planet.atmosphere?.o2 ?? 12
    },
    unlockedFeatures: [...(planet.features || [])],
    discoveredSpeciesCount: (planet.discoveredSpecies || []).length,
    activeHazard: planet.activeHazard?.type || null,
    strengths: strengths.slice(0, 5),
    practiceAreas: practiceAreas.slice(0, 5),
    previousMissionTitles: previousMissionTitles.slice(-15)
  };
}
