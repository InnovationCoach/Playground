/**
 * Living Planet Engine & Server-Authoritative Facility Progression (Part 8 & Part 9).
 * All unlocks, mission completions, and competency-evidence links are validated
 * server-side with idempotent guards and auditable history.
 */

export const DEVELOPMENT_STAGES = [
  { id: 'initial_settlement', label: 'Initial Settlement', minFacilities: 0 },
  { id: 'construction_unlocked', label: 'Construction Unlocked', minFacilities: 1 },
  { id: 'research_unlocked', label: 'Research Unlocked', minFacilities: 2 },
  { id: 'engineering_developed', label: 'Engineering Developed', minFacilities: 3 },
  { id: 'sustainability_developed', label: 'Sustainability Developed', minFacilities: 4 },
  { id: 'advanced_infrastructure', label: 'Advanced Space Infrastructure', minFacilities: 5 }
];

export const FACILITY_RULES = [
  {
    id: 'construction-workshop',
    name: 'Construction Workshop',
    category: 'engineering',
    cost: 40,
    minMissions: 0,
    requiredCompetency: null,
    summary: 'Unlocks planetary module fabrication and basic structural assembly.'
  },
  {
    id: 'research-laboratory',
    name: 'Research Laboratory',
    category: 'research',
    cost: 55,
    minMissions: 1,
    requiredCompetency: 'scientific_reasoning',
    summary: 'Unlocks the AI Research Lab, Spaceship Builder, and biosignature wet-labs.'
  },
  {
    id: 'engineering-center',
    name: 'Engineering Center',
    category: 'engineering',
    cost: 70,
    minMissions: 1,
    requiredCompetency: 'engineering_design',
    summary: 'Supports advanced propulsion, structural stress testing, and heavy habitats.'
  },
  {
    id: 'environmental-center',
    name: 'Environmental Center',
    category: 'environmental',
    cost: 65,
    minMissions: 1,
    requiredCompetency: 'ecosystem_balance',
    summary: 'Coordinates water recovery, atmospheric scrubbing, and biosphere restoration.'
  },
  {
    id: 'space-exploration-station',
    name: 'Space Exploration Station',
    category: 'space',
    cost: 90,
    minMissions: 2,
    requiredCompetency: 'measurement',
    summary: 'Orbital docking and deep-space telemetry station for inter-system expeditions.'
  },
  {
    id: 'innovation-center',
    name: 'Innovation Center',
    category: 'creativity',
    cost: 110,
    minMissions: 3,
    requiredCompetency: 'energy_systems',
    summary: 'Flagship hub for original learner inventions and cross-galaxy collaboration.'
  }
];

export function computeDevelopmentStage(unlockedFacilities = []) {
  const count = Array.isArray(unlockedFacilities) ? unlockedFacilities.length : 0;
  let stage = DEVELOPMENT_STAGES[0];
  for (const s of DEVELOPMENT_STAGES) {
    if (count >= s.minFacilities) stage = s;
  }
  return stage;
}

/**
 * Records mission completion + supporting evidence idempotently.
 * Duplicate completion of the same missionId never grants duplicate rewards.
 */
export function completeMissionWithEvidence({
  playgroundState,
  mission,
  evidence = {}
} = {}) {
  if (!playgroundState || !mission?.id) {
    return { ok: false, code: 'VALIDATION_ERROR', message: 'Valid playground state and mission are required.' };
  }
  const completedIds = Array.isArray(playgroundState.completedMissionIds) ? playgroundState.completedMissionIds : [];
  if (completedIds.includes(mission.id)) {
    return { ok: false, code: 'DUPLICATE_COMPLETION', message: 'Mission has already been completed and rewarded.' };
  }

  const explanation = typeof evidence.explanation === 'string' ? evidence.explanation.trim() : '';
  const reflection = typeof evidence.reflection === 'string' ? evidence.reflection.trim() : '';
  if (explanation.length < 10 || reflection.length < 10) {
    return {
      ok: false,
      code: 'EVIDENCE_REQUIRED',
      message: 'Please provide both a scientific explanation and a personal reflection (at least 10 characters each).'
    };
  }

  const rewardCredits = 60;
  const newCompetencies = new Set(playgroundState.verifiedCompetencies || []);
  for (const obj of mission.learningObjectives || []) {
    newCompetencies.add(obj);
  }

  const now = new Date().toISOString();
  const historyEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'mission_completed',
    missionId: mission.id,
    title: mission.title,
    planetId: mission.planetId || playgroundState.claimedPlanetId,
    creditsAwarded: rewardCredits,
    competencies: mission.learningObjectives || [],
    evidenceSummary: explanation.slice(0, 160),
    at: now
  };

  const nextState = {
    ...playgroundState,
    credits: playgroundState.credits + rewardCredits,
    completedMissionIds: [...completedIds, mission.id],
    verifiedCompetencies: [...newCompetencies],
    developmentHistory: [historyEntry, ...(playgroundState.developmentHistory || [])].slice(0, 50)
  };

  return { ok: true, state: nextState, historyEntry, creditsAwarded: rewardCredits };
}

/**
 * Evaluates eligibility and unlocks a planetary facility server-side.
 */
export function unlockFacilityServer({ playgroundState, facilityId } = {}) {
  const rule = FACILITY_RULES.find((f) => f.id === facilityId);
  if (!rule) {
    return { ok: false, code: 'NOT_FOUND', message: `Unknown facility "${facilityId}".` };
  }

  const unlocked = Array.isArray(playgroundState?.unlockedFacilities) ? playgroundState.unlockedFacilities : [];
  if (unlocked.includes(facilityId)) {
    return { ok: false, code: 'ALREADY_UNLOCKED', message: `${rule.name} is already unlocked.` };
  }

  const completedCount = (playgroundState?.completedMissionIds || []).length;
  if (completedCount < rule.minMissions) {
    return {
      ok: false,
      code: 'REQUIREMENT_NOT_MET',
      message: `${rule.name} requires at least ${rule.minMissions} completed STEM mission(s).`
    };
  }

  const competencies = new Set(playgroundState?.verifiedCompetencies || []);
  if (rule.requiredCompetency && !competencies.has(rule.requiredCompetency)) {
    return {
      ok: false,
      code: 'COMPETENCY_REQUIRED',
      message: `${rule.name} requires demonstrated competency evidence in "${rule.requiredCompetency}".`
    };
  }

  if ((playgroundState?.credits ?? 0) < rule.cost) {
    return {
      ok: false,
      code: 'INSUFFICIENT_CREDITS',
      message: `${rule.name} costs ${rule.cost} Credits.`
    };
  }

  const nextUnlocked = [...unlocked, facilityId];
  const stage = computeDevelopmentStage(nextUnlocked);
  const now = new Date().toISOString();
  const historyEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'facility_unlocked',
    facilityId: rule.id,
    facilityName: rule.name,
    planetId: playgroundState.claimedPlanetId,
    cost: rule.cost,
    developmentStage: stage.id,
    at: now
  };

  const nextState = {
    ...playgroundState,
    credits: playgroundState.credits - rule.cost,
    unlockedFacilities: nextUnlocked,
    developmentStage: stage.id,
    developmentHistory: [historyEntry, ...(playgroundState.developmentHistory || [])].slice(0, 50)
  };

  return {
    ok: true,
    state: nextState,
    facility: rule,
    developmentStage: stage,
    notification: `Unlocked ${rule.name}! Planet reached stage: ${stage.label}.`
  };
}
