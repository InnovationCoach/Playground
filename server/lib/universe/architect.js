/**
 * AI Universe Architect & Mission Validation Pipeline (Part 5 & Part 13).
 * Generates structured STEM missions tailored to planet conditions & learner context,
 * validates safety/age-appropriateness/schema/anti-repetition, and falls back to
 * curated missions if AI generation is unavailable or fails validation.
 */

export const MISSION_SCHEMA_VERSION = '1.0.0';

export const ALLOWED_MISSION_TYPES = [
  'environmental_engineering',
  'biology_investigation',
  'physics_propulsion',
  'space_research',
  'planetary_defense'
];

export const AUTO_APPROVED_TYPES = [
  'environmental_engineering',
  'biology_investigation',
  'physics_propulsion',
  'space_research'
];

export const ALLOWED_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export const ALLOWED_OBJECTIVES = [
  'measurement',
  'scientific_reasoning',
  'engineering_design',
  'ecosystem_balance',
  'energy_systems'
];

const UNSAFE_CONTENT_RE = /(explosive|gunpowder|bleach\s*\+\s*ammonia|open\s+flame|high\s+voltage\s+mains|https?:\/\/|<script|ignore\s+previous\s+instructions)/i;

const isNonEmptyText = (v, max = 240) => typeof v === 'string' && v.trim().length >= 3 && v.length <= max;

export const CURATED_FALLBACK_MISSIONS = [
  {
    missionType: 'environmental_engineering',
    planetCondition: 'water_scarcity_and_geyser_capture',
    title: 'Glacial Geyser Water Recovery',
    challenge: 'Design a multi-stage filtration and condensation collector to turn mineral-heavy geyser vapor into clean colony water.',
    learningObjectives: ['measurement', 'scientific_reasoning', 'engineering_design'],
    difficulty: 'intermediate',
    requiredMaterials: ['filter_medium', 'collection_container', 'thermal_condenser'],
    completionRequirements: ['submit_design', 'explain_filtration_process', 'reflect_on_results'],
    potentialRewards: ['credits_60', 'research_lab_upgrade']
  },
  {
    missionType: 'physics_propulsion',
    planetCondition: 'aerodynamic_propulsion',
    title: 'Jetstream Scout Glider',
    challenge: 'Calculate lift-to-mass ratios and design a lightweight probe capable of riding twin-sun jetstreams without stalling.',
    learningObjectives: ['measurement', 'engineering_design', 'energy_systems'],
    difficulty: 'intermediate',
    requiredMaterials: ['composite_wing', 'telemetry_sensor', 'solar_cell'],
    completionRequirements: ['submit_design', 'run_simulation', 'reflect_on_results'],
    potentialRewards: ['credits_60', 'spaceship_bay_unlock']
  },
  {
    missionType: 'biology_investigation',
    planetCondition: 'low_light_ecology',
    title: 'Twilight Vent Food-Web Survey',
    challenge: 'Map how chemosynthetic microbes support higher organisms around dim red-dwarf thermal vents.',
    learningObjectives: ['scientific_reasoning', 'ecosystem_balance'],
    difficulty: 'beginner',
    requiredMaterials: ['bioscanner', 'sample_vial', 'field_journal'],
    completionRequirements: ['submit_observations', 'explain_trophic_links', 'reflect_on_results'],
    potentialRewards: ['credits_50', 'biosphere_boost']
  },
  {
    missionType: 'space_research',
    planetCondition: 'magnetic_storm_deflection',
    title: 'Ion Storm Shield Calibration',
    challenge: 'Measure magnetic field strength across orbit and size a deflector ring to blunt weekly solar particle surges.',
    learningObjectives: ['measurement', 'scientific_reasoning', 'energy_systems'],
    difficulty: 'advanced',
    requiredMaterials: ['magnetometer', 'copper_coil', 'shield_capacitor'],
    completionRequirements: ['submit_design', 'explain_shield_math', 'reflect_on_results'],
    potentialRewards: ['credits_80', 'shield_upgrade']
  }
];

/**
 * Validates a generated mission against schema, safety, age-appropriateness,
 * STEM objectives, and anti-repetition rules.
 */
export function validateGeneratedMission(raw, { previousTitles = [] } = {}) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: ['mission must be a JSON object'] };
  }

  if (!ALLOWED_MISSION_TYPES.includes(raw.missionType)) {
    errors.push(`missionType must be one of ${ALLOWED_MISSION_TYPES.join(', ')}`);
  }
  if (!isNonEmptyText(raw.planetCondition, 80)) errors.push('planetCondition is required');
  if (!isNonEmptyText(raw.title, 100)) errors.push('title is required');
  if (!isNonEmptyText(raw.challenge, 400)) errors.push('challenge is required');
  if (!ALLOWED_DIFFICULTIES.includes(raw.difficulty)) {
    errors.push(`difficulty must be one of ${ALLOWED_DIFFICULTIES.join(', ')}`);
  }

  if (!Array.isArray(raw.learningObjectives) || raw.learningObjectives.length === 0 || raw.learningObjectives.length > 5) {
    errors.push('learningObjectives must have 1-5 entries');
  } else if (!raw.learningObjectives.every((o) => ALLOWED_OBJECTIVES.includes(o))) {
    errors.push('learningObjectives contains unsupported objective');
  }

  if (!Array.isArray(raw.requiredMaterials) || raw.requiredMaterials.length === 0 || raw.requiredMaterials.length > 8) {
    errors.push('requiredMaterials must have 1-8 entries');
  } else if (!raw.requiredMaterials.every((m) => isNonEmptyText(m, 60))) {
    errors.push('requiredMaterials entries must be non-empty strings');
  }

  if (!Array.isArray(raw.completionRequirements) || raw.completionRequirements.length === 0 || raw.completionRequirements.length > 6) {
    errors.push('completionRequirements must have 1-6 entries');
  }

  if (!Array.isArray(raw.potentialRewards) || raw.potentialRewards.length === 0 || raw.potentialRewards.length > 4) {
    errors.push('potentialRewards must have 1-4 entries');
  }

  const combinedText = [
    raw.title,
    raw.challenge,
    ...(Array.isArray(raw.requiredMaterials) ? raw.requiredMaterials : []),
    ...(Array.isArray(raw.completionRequirements) ? raw.completionRequirements : [])
  ].join(' ');
  if (UNSAFE_CONTENT_RE.test(combinedText)) {
    errors.push('mission failed safety or prompt-injection screening');
  }

  const normalizedPrev = new Set(previousTitles.map((t) => String(t).trim().toLowerCase()));
  if (isNonEmptyText(raw.title, 100) && normalizedPrev.has(raw.title.trim().toLowerCase())) {
    errors.push('mission title duplicates a previously completed/generated mission');
  }

  if (errors.length) return { ok: false, errors };

  const status = AUTO_APPROVED_TYPES.includes(raw.missionType) ? 'approved' : 'pending_review';
  return {
    ok: true,
    value: {
      schemaVersion: MISSION_SCHEMA_VERSION,
      missionType: raw.missionType,
      planetCondition: raw.planetCondition.trim(),
      title: raw.title.trim(),
      challenge: raw.challenge.trim(),
      learningObjectives: [...new Set(raw.learningObjectives)],
      difficulty: raw.difficulty,
      requiredMaterials: raw.requiredMaterials.map((m) => m.trim()),
      completionRequirements: raw.completionRequirements.map((r) => String(r).trim()),
      potentialRewards: raw.potentialRewards.map((r) => String(r).trim()),
      status
    }
  };
}

function pickCuratedFallback(context) {
  const prev = new Set((context?.previousMissionTitles || []).map((t) => String(t).trim().toLowerCase()));
  const byCondition = CURATED_FALLBACK_MISSIONS.find(
    (m) => m.planetCondition === context?.planetCondition && !prev.has(m.title.toLowerCase())
  );
  if (byCondition) return byCondition;

  const byPractice = CURATED_FALLBACK_MISSIONS.find(
    (m) => context?.practiceAreas?.some((area) => m.learningObjectives.includes(area)) && !prev.has(m.title.toLowerCase())
  );
  if (byPractice) return byPractice;

  const unused = CURATED_FALLBACK_MISSIONS.find((m) => !prev.has(m.title.toLowerCase()));
  if (unused) return unused;

  // Last-resort variation suffix if all curated titles were already played
  const base = CURATED_FALLBACK_MISSIONS[0];
  return {
    ...base,
    title: `${base.title} — ${context?.planetId || 'Frontier'} Edition`
  };
}

/**
 * Orchestrates AI mission generation with strict validation and curated fallback.
 */
export async function generateUniverseMission({ context, aiGenerate = null } = {}) {
  const previousTitles = context?.previousMissionTitles || [];

  if (typeof aiGenerate === 'function') {
    try {
      const prompt = {
        system: 'You are the SPARK AI Universe Architect. Return ONLY valid JSON matching the mission schema. Never include URLs, unsafe physical instructions, or answers.',
        user: JSON.stringify({
          planetId: context?.planetId,
          planetTrait: context?.planetTrait,
          planetCondition: context?.planetCondition,
          ageBand: context?.ageBand || '13-15',
          practiceAreas: context?.practiceAreas || ['measurement'],
          avoidTitles: previousTitles
        })
      };
      const candidate = await aiGenerate(prompt);
      const checked = validateGeneratedMission(candidate, { previousTitles });
      if (checked.ok) {
        return {
          ok: true,
          source: 'ai',
          mission: {
            ...checked.value,
            planetId: context?.planetId || 'thalassa',
            generatedBy: 'ai-universe-architect',
            createdAt: new Date().toISOString()
          }
        };
      }
    } catch {
      // Fall back to curated mission if AI fails or times out
    }
  }

  const fallback = pickCuratedFallback(context);
  const checked = validateGeneratedMission(fallback, { previousTitles });
  const finalMission = checked.ok ? checked.value : { ...fallback, schemaVersion: MISSION_SCHEMA_VERSION, status: 'approved' };

  return {
    ok: true,
    source: 'curated-fallback',
    mission: {
      ...finalMission,
      planetId: context?.planetId || 'thalassa',
      generatedBy: 'curated-fallback',
      createdAt: new Date().toISOString()
    }
  };
}
