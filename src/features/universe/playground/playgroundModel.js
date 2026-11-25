/**
 * Pure state & simulation model for My Universe: Learner's Playground.
 * Framework-free so React UI, AI crew advisors, and Vitest share one source of truth.
 */

export const PLAYGROUND_VERSION = 1;
export const WEEKLY_HAZARD_COUNT = 3;

export const GOAL_REWARDS = [
  { id: 'goal-stem-lab', title: 'Complete a STEM Investigation', category: 'Inquiry', credits: 60, description: 'Finish any planetary workstation or STEM simulation activity.' },
  { id: 'goal-biosignature', title: 'Log 3 Biosignature Scans', category: 'Discovery', credits: 45, description: 'Survey thermal vents, tide gauges, or fissure fields for life.' },
  { id: 'goal-pbl-milestone', title: 'Achieve a Weekly Learning Goal', category: 'Mastery', credits: 80, description: 'Hit your SPARK weekly learning target or coach-reviewed milestone.' },
  { id: 'goal-hazard-drill', title: 'Pass Crew Safety & Governance Drill', category: 'Governance', credits: 50, description: 'Assign all 4 AI NPC crew members to active planetary roles.' }
];

export const SPECIES_CATALOG = [
  { id: 'biolume-kelp', name: 'Bioluminescent Kelp', biomes: ['ocean'], stage: 'Flora', summary: 'Photosynthetic fronds that glow cyan in deep swells and oxygenate coastal shelves.' },
  { id: 'pelagic-jellies', name: 'Pelagic Lantern-Jellies', biomes: ['ocean'], stage: 'Fauna', summary: 'Translucent filter-feeders riding trade-wind currents around research platforms.' },
  { id: 'tube-worms', name: 'Hydrothermal Tube-Worms', biomes: ['ocean', 'basalt'], stage: 'Fauna', summary: 'Chemosynthetic colonies thriving beside superheated mineral vents.' },
  { id: 'thermophile-mat', name: 'Basalt Thermophile Mat', biomes: ['basalt'], stage: 'Microbe', summary: 'Heat-resistant microbial carpets converting volcanic sulfur into bio-energy.' },
  { id: 'silicate-coral', name: 'Silicate Crystal Coral', biomes: ['basalt', 'ice'], stage: 'Flora', summary: 'Mineral-lattice organisms that stabilize fissure walls and filter trace gases.' },
  { id: 'cryo-tardigrade', name: 'Cryo-Tardigrade Colony', biomes: ['ice'], stage: 'Fauna', summary: 'Resilient microscopic extremophiles hibernating inside sub-glacial brine pockets.' },
  { id: 'frost-lichen', name: 'Aurora Frost-Lichen', biomes: ['ice'], stage: 'Flora', summary: 'Slow-growing lichen absorbing faint starlight and trapping pockets of warm vapor.' },
  { id: 'spore-drifters', name: 'Atmospheric Spore Drifters', biomes: ['ocean', 'basalt', 'ice'], stage: 'Microbe', summary: 'Buoyant aerial microbes seeding cloud layers with organic nuclei.' }
];

export const FEATURE_CATALOG = [
  { id: 'geodesic-biodome', name: 'Geodesic Biodome', category: 'habitat', cost: 45, effects: { habitability: 15, research: 5 }, summary: 'Pressurized glass-and-alloy dome for learner research and crew quarters.' },
  { id: 'solar-float-array', name: 'Orbital Solar Array', category: 'habitat', cost: 35, effects: { habitability: 10, shielding: 5 }, summary: 'Clean starlight collector powering life-support and desalination.' },
  { id: 'hydroponics-bay', name: 'Hydroponics & Algae Bay', category: 'habitat', cost: 40, effects: { habitability: 12, biodiversity: 8 }, summary: 'Closed-loop food and oxygen production for your NPC crew.' },
  { id: 'oxygenator-spire', name: 'Atmosphere Oxygenator', category: 'biosphere', cost: 55, effects: { habitability: 18, biodiversity: 12 }, summary: 'Catalytic tower converting trace gases into breathable air.' },
  { id: 'reef-nursery', name: 'Exo-Reef & Biome Nursery', category: 'biosphere', cost: 50, effects: { biodiversity: 20, habitability: 8 }, summary: 'Protected habitat seeding native flora and aquatic fauna.' },
  { id: 'spore-seeder', name: 'Biosphere Terra-Seeder', category: 'biosphere', cost: 65, effects: { biodiversity: 22, research: 8 }, summary: 'Releases resilient microbes to enrich barren regolith and brines.' },
  { id: 'bioscanner-array', name: 'Deep-Core Bioscanner', category: 'science', cost: 40, effects: { research: 20, biodiversity: 5 }, summary: 'Subsurface sonar and mass-spec rig that accelerates life discovery.' },
  { id: 'xeno-ecology-lab', name: 'Xeno-Ecology Lab', category: 'science', cost: 60, effects: { research: 25, habitability: 5 }, summary: 'Autonomous wet-lab for studying alien genetics and ecosystems.' },
  { id: 'ion-storm-deflector', name: 'Ion Storm Deflector', category: 'defense', cost: 50, effects: { shielding: 25 }, summary: 'Magnetic field emitter that blunts weekly cosmic and ion storms.' },
  { id: 'radiation-shield-grid', name: 'Radiation Shield Grid', category: 'defense', cost: 55, effects: { shielding: 28, habitability: 4 }, summary: 'Overhead plasma canopy blocking solar flares and hazard radiation.' },
  { id: 'fire-suppression-bots', name: 'Automated Fire Suppression', category: 'defense', cost: 35, effects: { shielding: 18, habitability: 5 }, summary: 'Rapid-response drones that contain lab fires before modules are lost.' }
];

export const DEFAULT_CREW = [
  { id: 'lyra-vance', name: 'Dr. Lyra Vance', role: 'Xeno-Biologist', specialty: 'investigate', morale: 85, stamina: 90, task: 'investigate' },
  { id: 'kai-sato', name: 'Chief Kai Sato', role: 'Habitat Engineer', specialty: 'build', morale: 82, stamina: 88, task: 'build' },
  { id: 'aria-7', name: 'Aria-7', role: 'AI Ecologist', specialty: 'cultivate', morale: 95, stamina: 100, task: 'cultivate' },
  { id: 'soren-hale', name: 'Lt. Soren Hale', role: 'Safety Officer', specialty: 'shield', morale: 80, stamina: 86, task: 'shield' }
];

export const CREW_TASKS = [
  { id: 'investigate', label: 'Scan for Life', summary: 'Survey biomes and thermal vents for undiscovered organisms.' },
  { id: 'cultivate', label: 'Develop Biosphere', summary: 'Nurture discovered species and balance atmospheric chemistry.' },
  { id: 'build', label: 'Maintain & Build', summary: 'Construct planetary features and repair station modules.' },
  { id: 'shield', label: 'Hazard Watch', summary: 'Monitor storms, lab safety, and radiation shielding.' },
  { id: 'rest', label: 'Crew Rest', summary: 'Recover stamina and boost crew morale.' }
];

export const HAZARD_TYPES = [
  { id: 'ion-storm', name: 'Cosmic Ion Storm', severity: 18, summary: 'High-energy charged winds disrupt sensors and batter surface domes.', recommendedRole: 'Safety Officer' },
  { id: 'lab-fire', name: 'Research Lab Fire', severity: 16, summary: 'Electrical overload in a wet-lab module triggers smoke and thermal alarms.', recommendedRole: 'Habitat Engineer' },
  { id: 'radiation-spike', name: 'Solar Radiation Hazard', severity: 22, summary: 'Sudden stellar flare bathes the upper atmosphere in ionizing radiation.', recommendedRole: 'Safety Officer' },
  { id: 'cryo-quake', name: 'Subsurface Cryo-Quake', severity: 15, summary: 'Tectonic shift fractures ice shelves and strains platform anchors.', recommendedRole: 'Habitat Engineer' },
  { id: 'spore-bloom', name: 'Uncontrolled Spore Bloom', severity: 14, summary: 'Rapid microbial bloom clogs air filters and shifts local oxygen levels.', recommendedRole: 'Xeno-Biologist' }
];

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(n)));

export function seededRandom(seed) {
  let s = (Math.abs(Math.floor(seed)) % 2147483647) || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export const PLANET_PROFILES = {
  thalassa: { trait: 'Steady Trade Swells', habitability: 25, biodiversity: 10, shielding: 15, research: 10, atmosphere: { o2: 12, co2: 28, n2: 60 } },
  ignis: { trait: 'Geothermal Magma Rifts', habitability: 16, biodiversity: 6, shielding: 20, research: 16, atmosphere: { o2: 7, co2: 38, n2: 55 } },
  boreas: { trait: 'Sub-Glacial Brine Rings', habitability: 18, biodiversity: 8, shielding: 24, research: 14, atmosphere: { o2: 9, co2: 22, n2: 69 } },
  pelagos: { trait: 'Mineral Reef Lagoons', habitability: 28, biodiversity: 14, shielding: 12, research: 11, atmosphere: { o2: 15, co2: 23, n2: 62 } },
  cinder: { trait: 'Tide-Locked Obsidian Wind', habitability: 14, biodiversity: 5, shielding: 18, research: 18, atmosphere: { o2: 6, co2: 42, n2: 52 } },
  aurelia: { trait: 'High-UV Golden Kelp Sea', habitability: 27, biodiversity: 15, shielding: 11, research: 13, atmosphere: { o2: 16, co2: 21, n2: 63 } },
  glaciera: { trait: 'Cryo-Geyser Ice Canyons', habitability: 19, biodiversity: 7, shielding: 22, research: 15, atmosphere: { o2: 10, co2: 24, n2: 66 } },
  pyros: { trait: 'Tidal-Flex Silicate Spires', habitability: 15, biodiversity: 6, shielding: 23, research: 17, atmosphere: { o2: 8, co2: 36, n2: 56 } },
  umbrion: { trait: 'Twilight Bioluminescent Vents', habitability: 20, biodiversity: 11, shielding: 17, research: 19, atmosphere: { o2: 11, co2: 29, n2: 60 } },
  veridia: { trait: 'Emerald Spore Cloud Deck', habitability: 30, biodiversity: 18, shielding: 13, research: 12, atmosphere: { o2: 19, co2: 18, n2: 63 } },
  nyxara: { trait: 'Magnetized Indigo Ice', habitability: 21, biodiversity: 9, shielding: 28, research: 14, atmosphere: { o2: 11, co2: 20, n2: 69 } },
  koralis: { trait: 'Carbonate Coral Shelves', habitability: 29, biodiversity: 16, shielding: 14, research: 12, atmosphere: { o2: 17, co2: 20, n2: 63 } },
  frostholm: { trait: 'Geothermal Ice-Basalt Crust', habitability: 17, biodiversity: 8, shielding: 21, research: 16, atmosphere: { o2: 9, co2: 26, n2: 65 } },
  zephyria: { trait: 'Twin-Sun Jetstream Swells', habitability: 24, biodiversity: 12, shielding: 16, research: 13, atmosphere: { o2: 14, co2: 25, n2: 61 } },
  'obsidian-reach': { trait: 'Emerald Plasma Fissures', habitability: 18, biodiversity: 7, shielding: 25, research: 20, atmosphere: { o2: 8, co2: 34, n2: 58 } }
};

export function defaultPlanetRecord(planetId) {
  const p = PLANET_PROFILES[planetId] || {
    trait: 'Frontier Exoplanet',
    habitability: 25,
    biodiversity: 10,
    shielding: 15,
    research: 10,
    atmosphere: { o2: 12, co2: 28, n2: 60 }
  };
  return {
    planetId,
    trait: p.trait,
    habitability: p.habitability,
    biodiversity: p.biodiversity,
    shielding: p.shielding,
    research: p.research,
    atmosphere: { ...p.atmosphere },
    discoveredSpecies: [],
    cultivatedSpecies: [],
    features: [],
    activeHazard: null,
    crew: DEFAULT_CREW.map((c) => ({ ...c }))
  };
}

export function starModifiersForClass(starClass = '') {
  if (/A-type/i.test(starClass)) return { solarBonus: 1.5, radiationRisk: 1.4, label: 'High-UV Blue-White Star' };
  if (/M-type/i.test(starClass)) return { solarBonus: 0.6, radiationRisk: 0.8, label: 'Dim Red Dwarf (Geothermal Favored)' };
  if (/Binary/i.test(starClass)) return { solarBonus: 1.2, radiationRisk: 1.2, label: 'Turbulent Binary Pair' };
  return { solarBonus: 1.0, radiationRisk: 1.0, label: 'Balanced Main-Sequence Star' };
}

export function fireRiskForRecord(record) {
  const o2 = record?.atmosphere?.o2 ?? 12;
  const suppressed = record?.features?.includes('fire-suppression-bots');
  if (o2 > 28 && !suppressed) return { level: 'Elevated', o2 };
  return { level: 'Nominal', o2 };
}

export function hasProducerSpecies(record) {
  return (record?.cultivatedSpecies || []).some((id) => {
    const sp = SPECIES_CATALOG.find((s) => s.id === id);
    return sp && (sp.stage === 'Flora' || sp.stage === 'Microbe');
  });
}

function shiftAtmosphere(atmo = { o2: 12, co2: 28, n2: 60 }, deltaO2 = 0) {
  const o2 = clamp((atmo.o2 ?? 12) + deltaO2, 5, 45);
  const co2 = clamp(100 - (atmo.n2 ?? 60) - o2, 2, 60);
  const n2 = 100 - o2 - co2;
  return { o2, co2, n2 };
}

export const CLASSROOM_STEWARDS = {
  thalassa: 'Amira K.',
  ignis: 'Mateo R.',
  boreas: 'Priya S.',
  pelagos: 'Noah T.',
  cinder: 'Lina W.',
  aurelia: 'Maya L.',
  glaciera: 'Tariq H.',
  pyros: 'Elena V.',
  umbrion: 'Kenji N.',
  veridia: 'Sofia M.',
  nyxara: 'Devon C.',
  koralis: 'Zara B.',
  frostholm: 'Omar F.',
  zephyria: 'Chloe D.',
  'obsidian-reach': 'Lucas P.'
};

export function stewardForPlanet(planetId, state) {
  if (state?.claimedPlanetId === planetId) return 'You';
  return CLASSROOM_STEWARDS[planetId] || 'Unclaimed';
}

export function initialPlaygroundState(defaultPlanetId = 'thalassa') {
  return {
    version: PLAYGROUND_VERSION,
    credits: 100,
    claimedPlanetId: defaultPlanetId,
    completedGoals: [],
    syncedSparkGoalIds: [],
    aidedThisWeek: [],
    week: 1,
    weeklyBulletin: [],
    captainsLog: [],
    savedShips: [],
    planets: {
      [defaultPlanetId]: defaultPlanetRecord(defaultPlanetId)
    }
  };
}

export function getPlanetRecord(state, planetId) {
  return state.planets?.[planetId] || defaultPlanetRecord(planetId);
}

function withPlanet(state, planetId, updater) {
  const prev = getPlanetRecord(state, planetId);
  const next = updater(prev);
  if (next === prev) return state;
  return {
    ...state,
    planets: {
      ...state.planets,
      [planetId]: next
    }
  };
}

export function claimPlanet(state, planetId) {
  if (!planetId) return state;
  const exists = state.planets?.[planetId];
  return {
    ...state,
    claimedPlanetId: planetId,
    planets: exists ? state.planets : { ...state.planets, [planetId]: defaultPlanetRecord(planetId) }
  };
}

export function completeGoal(state, goalId) {
  const goal = GOAL_REWARDS.find((g) => g.id === goalId);
  if (!goal) return state;
  return {
    ...state,
    credits: state.credits + goal.credits,
    completedGoals: [...state.completedGoals, { goalId, at: new Date().toISOString(), credits: goal.credits }]
  };
}

export function investigatePlanet(state, planet) {
  if (!planet?.id) return { state, discovered: null, reason: 'invalid-planet' };
  const record = getPlanetRecord(state, planet.id);
  const candidates = SPECIES_CATALOG.filter(
    (s) => s.biomes.includes(planet.kind) && !record.discoveredSpecies.includes(s.id)
  );
  if (!candidates.length) {
    const boosted = withPlanet(state, planet.id, (p) => ({
      ...p,
      research: clamp(p.research + 5)
    }));
    return { state: boosted, discovered: null, reason: 'all-discovered' };
  }
  const species = candidates[0];
  const nextState = withPlanet(state, planet.id, (p) => ({
    ...p,
    discoveredSpecies: [...p.discoveredSpecies, species.id],
    research: clamp(p.research + 12),
    biodiversity: clamp(p.biodiversity + 8)
  }));
  return { state: nextState, discovered: species, reason: 'discovered' };
}

export function cultivateLife(state, planetId, speciesId, cost = 25) {
  if (state.credits < cost) return { state, ok: false, reason: 'insufficient-credits' };
  const record = getPlanetRecord(state, planetId);
  if (!record.discoveredSpecies.includes(speciesId)) {
    return { state, ok: false, reason: 'not-discovered' };
  }
  if (record.cultivatedSpecies.includes(speciesId)) {
    return { state, ok: false, reason: 'already-cultivated' };
  }
  const species = SPECIES_CATALOG.find((s) => s.id === speciesId);
  if (species?.stage === 'Fauna' && !hasProducerSpecies(record)) {
    return { state, ok: false, reason: 'needs-producer' };
  }
  const o2Boost = species?.stage === 'Flora' ? 6 : species?.stage === 'Microbe' ? 4 : -1;
  const next = withPlanet({ ...state, credits: state.credits - cost }, planetId, (p) => ({
    ...p,
    cultivatedSpecies: [...p.cultivatedSpecies, speciesId],
    biodiversity: clamp(p.biodiversity + 16),
    habitability: clamp(p.habitability + 10),
    atmosphere: shiftAtmosphere(p.atmosphere, o2Boost)
  }));
  return { state: next, ok: true };
}

export function buildFeature(state, planetId, featureId, { starClass = '' } = {}) {
  const feature = FEATURE_CATALOG.find((f) => f.id === featureId);
  if (!feature) return { state, ok: false, reason: 'unknown-feature' };
  if (state.credits < feature.cost) return { state, ok: false, reason: 'insufficient-credits' };
  const record = getPlanetRecord(state, planetId);
  if (record.features.includes(featureId)) {
    return { state, ok: false, reason: 'already-built' };
  }
  const mods = starModifiersForClass(starClass);
  const habDelta = feature.id === 'solar-float-array'
    ? Math.round((feature.effects.habitability || 0) * mods.solarBonus)
    : (feature.effects.habitability || 0);
  const o2Delta = feature.id === 'oxygenator-spire' ? 8 : feature.id === 'hydroponics-bay' ? 3 : 0;
  const next = withPlanet({ ...state, credits: state.credits - feature.cost }, planetId, (p) => ({
    ...p,
    features: [...p.features, featureId],
    habitability: clamp(p.habitability + habDelta),
    biodiversity: clamp(p.biodiversity + (feature.effects.biodiversity || 0)),
    shielding: clamp(p.shielding + (feature.effects.shielding || 0)),
    research: clamp(p.research + (feature.effects.research || 0)),
    atmosphere: shiftAtmosphere(p.atmosphere, o2Delta)
  }));
  return { state: next, ok: true, feature };
}

export function assignCrewTask(state, planetId, crewId, taskId) {
  if (!CREW_TASKS.some((t) => t.id === taskId)) return state;
  return withPlanet(state, planetId, (p) => {
    const crew = p.crew.map((member) => {
      if (member.id !== crewId) return member;
      const onSpecialty = member.specialty === taskId;
      const morale = clamp(member.morale + (taskId === 'rest' ? 8 : onSpecialty ? 4 : -1));
      const stamina = clamp(member.stamina + (taskId === 'rest' ? 15 : -6));
      return { ...member, task: taskId, morale, stamina };
    });
    return { ...p, crew };
  });
}

export function generateCrewBriefing(record, planetName = 'this exoplanet') {
  const messages = [];
  if (record.activeHazard) {
    messages.push(
      `Alert from ${record.crew.find((c) => c.id === 'soren-hale')?.name || 'Safety Officer'}: "${record.activeHazard.name}" is active on ${planetName}! Recommend dispatching crew or activating emergency containment.`
    );
  } else {
    messages.push(
      `Aria-7 (AI Ecologist): "${planetName} biosphere is at ${record.biodiversity}% biodiversity and ${record.habitability}% habitability. ${record.discoveredSpecies.length} species cataloged."`
    );
  }
  const engineer = record.crew.find((c) => c.id === 'kai-sato');
  if (engineer) {
    messages.push(
      `${engineer.name} (${engineer.role}): "Currently on '${engineer.task}' duty. ${record.features.length} planetary features online; shielding is ${record.shielding}%."`
    );
  }
  return messages;
}

/**
 * Universe Creator weekly event engine:
 * Picks exactly 3 distinct random planets from `allPlanetIds` and triggers a storm or accident on each.
 */
export function runWeeklyUniverseEvent(state, allPlanetIds, { seed = null } = {}) {
  const uniqueIds = [...new Set(allPlanetIds)].filter(Boolean);
  if (uniqueIds.length === 0) return state;
  const rnd = seed !== null ? seededRandom(seed) : Math.random;

  const pool = [...uniqueIds];
  const count = Math.min(WEEKLY_HAZARD_COUNT, pool.length);
  const chosen = [];
  for (let i = 0; i < count; i += 1) {
    const idx = Math.floor(rnd() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }

  const nextWeek = state.week + 1;
  const events = [];
  let nextPlanets = { ...state.planets };

  for (const pid of chosen) {
    const hazard = HAZARD_TYPES[Math.floor(rnd() * HAZARD_TYPES.length)];
    const prev = nextPlanets[pid] || defaultPlanetRecord(pid);
    const mitigation = Math.floor(prev.shielding * 0.25);
    const damage = Math.max(4, hazard.severity - mitigation);
    const incident = {
      id: `${hazard.id}-w${nextWeek}-${pid}`,
      type: hazard.id,
      name: hazard.name,
      summary: hazard.summary,
      recommendedRole: hazard.recommendedRole,
      week: nextWeek,
      damage
    };
    nextPlanets[pid] = {
      ...prev,
      habitability: clamp(prev.habitability - damage),
      activeHazard: incident
    };
    events.push({ planetId: pid, ...incident });
  }

  return {
    ...state,
    week: nextWeek,
    planets: nextPlanets,
    weeklyBulletin: events,
    aidedThisWeek: []
  };
}

/**
 * Syncs real completed SPARK goals from the learner's plan into Universe Credits (idempotent per goal ID).
 */
export function syncAchievedGoals(state, sparkGoalIds = [], creditsPerGoal = 50) {
  if (!Array.isArray(sparkGoalIds) || !sparkGoalIds.length) return { state, newlyAwarded: 0 };
  const already = new Set(state.syncedSparkGoalIds || []);
  const fresh = [...new Set(sparkGoalIds.filter((id) => typeof id === 'string' && id.trim() && !already.has(id)))];
  if (!fresh.length) return { state, newlyAwarded: 0 };
  const addedCredits = fresh.length * creditsPerGoal;
  return {
    state: {
      ...state,
      credits: state.credits + addedCredits,
      syncedSparkGoalIds: [...already, ...fresh]
    },
    newlyAwarded: fresh.length,
    addedCredits
  };
}

/**
 * Classroom Co-Op: send emergency aid to one of the 3 planets hit by this week's Universe Creator event.
 * Awards +10 net Galactic Teamwork Credits and restores +10% habitability on the classmate's planet.
 */
export function sendPlanetaryAid(state, targetPlanetId) {
  if (!targetPlanetId) return { state, ok: false, reason: 'invalid-planet' };
  const record = getPlanetRecord(state, targetPlanetId);
  if (!record.activeHazard) return { state, ok: false, reason: 'no-hazard' };
  if (state.claimedPlanetId === targetPlanetId) return { state, ok: false, reason: 'own-planet' };
  const aided = state.aidedThisWeek || [];
  if (aided.includes(targetPlanetId)) return { state, ok: false, reason: 'already-aided' };

  const nextBase = {
    ...state,
    credits: state.credits + 10,
    aidedThisWeek: [...aided, targetPlanetId]
  };
  const next = withPlanet(nextBase, targetPlanetId, (p) => ({
    ...p,
    habitability: clamp(p.habitability + 10)
  }));
  return { state: next, ok: true, creditDelta: 10 };
}

export function resolvePlanetHazard(state, planetId, method = 'crew') {
  const record = getPlanetRecord(state, planetId);
  if (!record.activeHazard) return { state, ok: false, reason: 'no-hazard' };

  if (method === 'credits') {
    const cost = 20;
    if (state.credits < cost) return { state, ok: false, reason: 'insufficient-credits' };
    const next = withPlanet({ ...state, credits: state.credits - cost }, planetId, (p) => ({
      ...p,
      habitability: clamp(p.habitability + Math.ceil((p.activeHazard?.damage || 10) * 0.8)),
      activeHazard: null
    }));
    return { state: next, ok: true, method };
  }

  // Crew resolution: requires Safety Officer or Engineer not resting, restores partial stability
  const next = withPlanet(state, planetId, (p) => ({
    ...p,
    habitability: clamp(p.habitability + Math.ceil((p.activeHazard?.damage || 10) * 0.5)),
    crew: p.crew.map((m) =>
      m.id === 'soren-hale' || m.id === 'kai-sato'
        ? { ...m, stamina: clamp(m.stamina - 10), task: 'shield' }
        : m
    ),
    activeHazard: null
  }));
  return { state: next, ok: true, method: 'crew' };
}

/** Builds a 2-option STEM governance dilemma between two AI NPC crew specialists. */
export function buildHazardDilemma(hazard, planetName = 'this exoplanet') {
  if (!hazard) return null;
  const byType = {
    'ion-storm': [
      {
        id: 'engineering',
        speaker: 'Lt. Soren Hale (Safety Officer)',
        label: 'Overcharge Magnetic Deflectors (-20 Cr)',
        pitch: `Channel 20 Cr into magnetic field coils to deflect charged particles away from ${planetName}'s domes.`,
        cost: 20,
        effects: { habitability: 14, shielding: 6 }
      },
      {
        id: 'ecological',
        speaker: 'Aria-7 (AI Ecologist)',
        label: 'Ground & Harvest Ion Charge (Free)',
        pitch: `Reroute lightning surges into mineral vents; slower dome recovery, but yields +8% Research data.`,
        cost: 0,
        effects: { habitability: 7, research: 8 }
      }
    ],
    'lab-fire': [
      {
        id: 'engineering',
        speaker: 'Chief Kai Sato (Habitat Engineer)',
        label: 'Seal & Purge Module with Nitrogen (-20 Cr)',
        pitch: `Deploy emergency nitrogen purge to extinguish the fire immediately without risking crew stamina.`,
        cost: 20,
        effects: { habitability: 15, shielding: 4 }
      },
      {
        id: 'ecological',
        speaker: 'Dr. Lyra Vance (Xeno-Biologist)',
        label: 'Manual Crew Containment & Sample Rescue (Free)',
        pitch: `Send crew in thermal suits to save bio-samples—uses crew stamina, but preserves +6% Research.`,
        cost: 0,
        effects: { habitability: 8, research: 6 }
      }
    ],
    'radiation-spike': [
      {
        id: 'engineering',
        speaker: 'Lt. Soren Hale (Safety Officer)',
        label: 'Raise Emergency Plasma Canopy (-20 Cr)',
        pitch: `Spend 20 Cr to energize overhead plasma shielding and protect ${planetName} from ionizing flares.`,
        cost: 20,
        effects: { habitability: 16, shielding: 8 }
      },
      {
        id: 'ecological',
        speaker: 'Dr. Lyra Vance (Xeno-Biologist)',
        label: 'Study Extremophile Mutation Response (Free)',
        pitch: `Shelter crew underground and observe how native life adapts to UV radiation (+10% Research, +4% Biodiversity).`,
        cost: 0,
        effects: { habitability: 6, research: 10, biodiversity: 4 }
      }
    ]
  };
  return byType[hazard.type] || [
    {
      id: 'engineering',
      speaker: 'Chief Kai Sato (Habitat Engineer)',
      label: 'Emergency Containment Protocol (-20 Cr)',
      pitch: `Stabilize ${planetName} infrastructure with emergency reserve power.`,
      cost: 20,
      effects: { habitability: 14, shielding: 5 }
    },
    {
      id: 'ecological',
      speaker: 'Aria-7 (AI Ecologist)',
      label: 'Crew Field Mitigation & Study (Free)',
      pitch: `Dispatch the crew to contain the incident while logging environmental telemetry.`,
      cost: 0,
      effects: { habitability: 8, research: 8 }
    }
  ];
}

export function resolveHazardWithDilemma(state, planetId, optionId, reasoning = '', planetName = '') {
  const record = getPlanetRecord(state, planetId);
  if (!record.activeHazard) return { state, ok: false, reason: 'no-hazard' };
  const options = buildHazardDilemma(record.activeHazard, planetName || planetId);
  const chosen = options.find((o) => o.id === optionId) || options[0];
  if (state.credits < chosen.cost) {
    return { state, ok: false, reason: 'insufficient-credits' };
  }
  const hazard = record.activeHazard;
  const nextBase = {
    ...state,
    credits: state.credits - chosen.cost,
    captainsLog: [
      {
        id: `log-w${state.week}-${planetId}-${Date.now()}`,
        week: state.week,
        planetId,
        planetName: planetName || planetId,
        hazardName: hazard.name,
        choiceLabel: chosen.label,
        reasoning: (reasoning || '').trim() || `Followed ${chosen.speaker}'s recommendation during ${hazard.name}.`,
        createdAt: new Date().toISOString()
      },
      ...(state.captainsLog || [])
    ].slice(0, 30)
  };
  const next = withPlanet(nextBase, planetId, (p) => ({
    ...p,
    habitability: clamp(p.habitability + (chosen.effects.habitability || 0)),
    shielding: clamp(p.shielding + (chosen.effects.shielding || 0)),
    research: clamp(p.research + (chosen.effects.research || 0)),
    biodiversity: clamp(p.biodiversity + (chosen.effects.biodiversity || 0)),
    crew: chosen.cost === 0
      ? p.crew.map((m) => (m.id === 'soren-hale' || m.id === 'kai-sato' ? { ...m, stamina: clamp(m.stamina - 8) } : m))
      : p.crew,
    activeHazard: null
  }));
  return { state: next, ok: true, chosen };
}

export function saveSpaceshipProject(state, snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return state;
  const prev = Array.isArray(state?.savedShips) ? state.savedShips : [];
  const nextEntry = {
    ...snapshot,
    id: snapshot.id || `ship-v${prev.length + 1}-${Date.now()}`,
    version: snapshot.version || prev.length + 1,
    savedAt: snapshot.savedAt || new Date().toISOString()
  };
  return {
    ...state,
    savedShips: [nextEntry, ...prev].slice(0, 20)
  };
}

/**
 * Adopts the server copy of the playground without losing learner work the server does
 * not store yet. Today the server's sanitizer drops `savedShips`, so a remote load would
 * wipe every saved Spaceship blueprint; this keeps the union of both lists (by id, newest
 * first, max 20). Everything else comes from the server copy.
 */
export function mergeRemotePlaygroundState(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  const byId = new Map();
  for (const ship of [...(Array.isArray(remote.savedShips) ? remote.savedShips : []), ...(Array.isArray(local?.savedShips) ? local.savedShips : [])]) {
    if (ship && ship.id && !byId.has(ship.id)) byId.set(ship.id, ship);
  }
  const savedShips = [...byId.values()]
    .sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || '')))
    .slice(0, 20);
  return { ...remote, savedShips };
}

/**
 * Computes the single highest-value next action for a learner on their active exoplanet.
 * Reduces executive-function friction by surfacing one clear step at a time.
 */
export function getNextMission(state, planet) {
  const planetId = planet?.id || state?.claimedPlanetId || 'thalassa';
  const planetName = planet?.name || planetId;
  const record = getPlanetRecord(state, planetId);

  if (record.activeHazard) {
    return {
      id: 'resolve-hazard',
      badge: 'Urgent · Hazard',
      title: `Resolve ${record.activeHazard.name} on ${planetName}`,
      summary: 'Your AI crew has two STEM response proposals waiting for your Captain’s Decision.',
      ctaLabel: 'Review Dilemma',
      actionType: 'focus-hazard'
    };
  }
  if (record.discoveredSpecies.length === 0) {
    return {
      id: 'first-scan',
      badge: 'Step 1 · Discovery',
      title: `Scan ${planetName} for native life`,
      summary: 'Run a biosignature scan to uncover organisms adapted to this biome.',
      ctaLabel: 'Scan for Life',
      actionType: 'scan'
    };
  }
  const uncultivatedProducer = record.discoveredSpecies
    .map((id) => SPECIES_CATALOG.find((s) => s.id === id))
    .find((sp) => sp && (sp.stage === 'Flora' || sp.stage === 'Microbe') && !record.cultivatedSpecies.includes(sp.id));
  if (uncultivatedProducer && state.credits >= 25) {
    return {
      id: 'cultivate-producer',
      badge: 'Step 2 · Biosphere',
      title: `Cultivate ${uncultivatedProducer.name}`,
      summary: 'Establish a producer species first to generate O₂ and unlock Fauna in your food web.',
      ctaLabel: 'Open Life & Build',
      actionType: 'tab-life'
    };
  }
  if (record.features.length === 0 && state.credits >= 35) {
    return {
      id: 'first-build',
      badge: 'Step 3 · Feature Forge',
      title: `Build your first structure on ${planetName}`,
      summary: 'Construct a Biodome, Solar Array, or Bioscanner to boost planetary stats in 3D.',
      ctaLabel: 'Open Feature Forge',
      actionType: 'tab-life'
    };
  }
  if ((state.savedShips || []).length === 0) {
    return {
      id: 'first-ship',
      badge: 'Step 4 · Research Lab',
      title: 'Design & physics-test a spacecraft',
      summary: 'Balance thrust-to-weight, power budget, and crew shielding in the Spaceship Builder.',
      ctaLabel: 'Open Spaceship Lab',
      actionType: 'open-lab'
    };
  }
  return {
    id: 'weekly-cycle',
    badge: `Week ${state.week} · Universe`,
    title: `Advance to Week ${state.week + 1} Cosmic Cycle`,
    summary: 'Trigger weekly hazards across 3 random exoplanets and send co-op aid to classmates.',
    ctaLabel: 'Open Universe Tab',
    actionType: 'tab-creator'
  };
}

const storageKey = (uid) => `spark_universe_playground_v1_${uid || 'guest'}`;

export function loadPlaygroundState(uid, defaultPlanetId = 'thalassa') {
  try {
    if (typeof localStorage === 'undefined') return initialPlaygroundState(defaultPlanetId);
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return initialPlaygroundState(defaultPlanetId);
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== PLAYGROUND_VERSION) return initialPlaygroundState(defaultPlanetId);
    return parsed;
  } catch {
    return initialPlaygroundState(defaultPlanetId);
  }
}

export function savePlaygroundState(uid, state) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(storageKey(uid), JSON.stringify(state));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}
