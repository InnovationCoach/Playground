/**
 * Scoring Engine for Solar Car Challenge
 * Calculates scores across 4 dimensions:
 * 1. Efficiency (weight ÷ power output)
 * 2. Aerodynamics (drag coefficient from AI)
 * 3. Innovation (iteration count + unique component choices)
 * 4. Speed (completion within time limit)
 */

interface PrototypeData {
  weight: {
    total: number;
  };
  components: {
    chassis: string;
    motor: string;
    battery: string;
    controller: string;
    solarPanel: string;
    additionalComponents: string[];
  };
  currentVersion: number;
  images: any[];
  createdAt: number;
  lastUpdated: number;
}

interface AIAnalysis {
  aerodynamics: string;
  dragCoefficient: number;
  solarCoverage: number;
  weightBalance: string;
  suggestions: string[];
}

interface ScoreBreakdown {
  efficiency: number;
  aerodynamics: number;
  innovation: number;
  speed: number;
  total: number;
  breakdown: {
    efficiencyRatio: number;
    weightScore: number;
    powerScore: number;
    dragScore: number;
    iterationBonus: number;
    componentDiversity: number;
    timeBonus: number;
  };
}

// Component database for uniqueness scoring
const COMPONENT_DATABASE = {
  chassis: ["aluminum_frame", "carbon_tube", "steel_frame"],
  motor: ["brushed_dc", "bldc", "geared_motor"],
  battery: ["li_18650_2x", "li_poly_3s", "li_ion_pack"],
  solarPanel: ["solar_20w", "solar_30w", "solar_50w"],
};

/**
 * Calculate total prototype score
 */
export function calculatePrototypeScore(
  prototype: PrototypeData,
  aiAnalysis: AIAnalysis,
  timeLimit: number = 900000 // 15 minutes default
): ScoreBreakdown {
  const efficiencyScore = calculateEfficiencyScore(prototype, aiAnalysis);
  const aerodynamicsScore = calculateAerodynamicsScore(aiAnalysis);
  const innovationScore = calculateInnovationScore(prototype);
  const speedScore = calculateSpeedScore(prototype, timeLimit);

  const total = efficiencyScore + aerodynamicsScore + innovationScore + speedScore;

  return {
    efficiency: Math.round(efficiencyScore),
    aerodynamics: Math.round(aerodynamicsScore),
    innovation: Math.round(innovationScore),
    speed: Math.round(speedScore),
    total: Math.round(total),
    breakdown: {
      efficiencyRatio: prototype.weight.total / 1000,
      weightScore: calculateWeightScore(prototype.weight.total),
      powerScore: extractPowerFromComponents(prototype.components),
      dragScore: aiAnalysis.dragCoefficient,
      iterationBonus: Math.min(prototype.currentVersion - 1, 5) * 10,
      componentDiversity: calculateComponentDiversity(prototype.components),
      timeBonus: Math.max(0, timeLimit - (prototype.lastUpdated - prototype.createdAt)),
    },
  };
}

/**
 * Efficiency Score (0-250 points)
 * Formula: (Power Output / Weight in kg) × 50
 * Rewards: Low weight + high power output
 * Penalties: Heavy prototypes
 */
function calculateEfficiencyScore(
  prototype: PrototypeData,
  aiAnalysis: AIAnalysis
): number {
  const weightKg = prototype.weight.total / 1000;
  const powerOutput = extractPowerFromComponents(prototype.components);

  // Efficiency ratio: W/kg
  const efficiencyRatio = powerOutput / weightKg;

  // Scale to 0-250 points
  // Target: 10 W/kg (20 points / 1 W/kg)
  // Max: 15+ W/kg = 250 points
  const baseScore = Math.min(efficiencyRatio * 20, 250);

  // Apply solar coverage bonus (up to 30 additional points)
  const coverageBonus = (aiAnalysis.solarCoverage / 100) * 30;

  // Apply weight penalty if over recommended 5kg
  const weightPenalty =
    weightKg > 5 ? Math.max(0, 30 - (weightKg - 5) * 10) : 0;

  return Math.max(0, baseScore + coverageBonus - weightPenalty);
}

/**
 * Aerodynamics Score (0-150 points)
 * Based on drag coefficient from Gemini AI analysis
 * Target: Cd < 0.15 = 150 points
 */
function calculateAerodynamicsScore(aiAnalysis: AIAnalysis): number {
  const { dragCoefficient, aerodynamics } = aiAnalysis;

  // Base score on drag coefficient
  // Cd < 0.10 = 150 pts (excellent)
  // Cd 0.10-0.15 = 120-150 pts (good)
  // Cd 0.15-0.20 = 75-120 pts (fair)
  // Cd > 0.20 = 0-75 pts (poor)

  let baseScore: number;

  if (dragCoefficient < 0.10) {
    baseScore = 150;
  } else if (dragCoefficient < 0.15) {
    // Linear interpolation: 0.10 (150) to 0.15 (120)
    baseScore = 150 - ((dragCoefficient - 0.1) / 0.05) * 30;
  } else if (dragCoefficient < 0.20) {
    // Linear interpolation: 0.15 (120) to 0.20 (75)
    baseScore = 120 - ((dragCoefficient - 0.15) / 0.05) * 45;
  } else if (dragCoefficient < 0.25) {
    // Linear interpolation: 0.20 (75) to 0.25 (25)
    baseScore = 75 - ((dragCoefficient - 0.2) / 0.05) * 50;
  } else {
    baseScore = Math.max(0, 25 - (dragCoefficient - 0.25) * 50);
  }

  // Aerodynamic rating bonus
  let aeroBonusMultiplier = 1;
  if (aerodynamics === "excellent") aeroBonusMultiplier = 1.1;
  else if (aerodynamics === "good") aeroBonusMultiplier = 1.05;

  return Math.min(150, baseScore * aeroBonusMultiplier);
}

/**
 * Innovation Score (0-100 points)
 * Rewards iteration depth and component diversity
 */
function calculateInnovationScore(prototype: PrototypeData): number {
  // Iteration bonus: 10 points per iteration (max 50 points for 5+ iterations)
  const iterationBonus = Math.min(prototype.currentVersion - 1, 5) * 10;

  // Component diversity bonus: unique/unusual component choices
  const componentDiversity = calculateComponentDiversity(prototype.components);

  // Image documentation bonus: points for uploading iterations
  const imageBonus = Math.min(prototype.images.length, 5) * 8; // Max 40 points

  return Math.min(100, iterationBonus + componentDiversity + imageBonus);
}

/**
 * Speed Score (0-50 points)
 * Bonus for completing within time limit
 */
function calculateSpeedScore(
  prototype: PrototypeData,
  timeLimit: number
): number {
  const timeElapsed = prototype.lastUpdated - prototype.createdAt;

  if (timeElapsed > timeLimit) {
    return 0; // No speed bonus if over time
  }

  // Linear scoring: full time used = 0 points, no time used = 50 points
  const timeRatio = timeElapsed / timeLimit;
  return Math.round((1 - timeRatio) * 50);
}

/**
 * Calculate weight-based score (component of efficiency)
 * Rewards lighter designs
 */
function calculateWeightScore(weightGrams: number): number {
  const weightKg = weightGrams / 1000;

  // Target weight: 3-5 kg
  // Optimal: 4 kg (100 points)
  // Range: 2-6 kg (50-100 points)
  // Outside range: scales down

  const optimalWeight = 4;
  const deviation = Math.abs(weightKg - optimalWeight);

  if (deviation <= 1) {
    // 3-5 kg range: 50-100 points
    return 100 - deviation * 50;
  } else if (deviation <= 2) {
    // 2-3 kg or 5-6 kg range: 25-50 points
    return 50 - (deviation - 1) * 25;
  } else {
    // Below 2 kg or above 6 kg: 0-25 points
    return Math.max(0, 25 - (deviation - 2) * 10);
  }
}

/**
 * Extract power output from selected components
 */
function extractPowerFromComponents(components: any): number {
  const POWER_OUTPUT: Record<string, number> = {
    // Motors
    brushed_dc: 50,
    bldc: 75,
    geared_motor: 100,

    // Solar Panels
    solar_20w: 20,
    solar_30w: 30,
    solar_50w: 50,
  };

  let motorPower = POWER_OUTPUT[components.motor] || 50;
  let solarPower = POWER_OUTPUT[components.solarPanel] || 30;

  // Total power = motor rating + solar panel power
  return motorPower + solarPower;
}

/**
 * Calculate component diversity bonus
 * Rewards unique/advanced component choices
 */
function calculateComponentDiversity(components: any): number {
  const COMPONENT_PRESTIGE: Record<string, number> = {
    // High prestige: uncommon, advanced choices
    carbon_tube: 15,
    bldc: 15,
    li_ion_pack: 15,
    solar_50w: 10,

    // Medium prestige: balanced choices
    aluminum_frame: 5,
    brushed_dc: 5,
    li_poly_3s: 5,
    solar_30w: 5,

    // Standard prestige: common choices
    steel_frame: 0,
    geared_motor: 0,
    li_18650_2x: 0,
    solar_20w: 0,
  };

  let score = 0;

  score += COMPONENT_PRESTIGE[components.chassis] || 0;
  score += COMPONENT_PRESTIGE[components.motor] || 0;
  score += COMPONENT_PRESTIGE[components.battery] || 0;
  score += COMPONENT_PRESTIGE[components.solarPanel] || 0;

  // Additional components bonus
  if (components.additionalComponents && components.additionalComponents.length > 0) {
    score += Math.min(components.additionalComponents.length * 5, 15);
  }

  return Math.min(score, 40); // Cap at 40 points
}

/**
 * Rank teams and assign tier badges
 */
export function rankTeams(teams: Array<{ score?: ScoreBreakdown }>): Array<{
  rank: number;
  tier: string;
  badge: string;
}> {
  return teams.map((team, index) => {
    const rank = index + 1;
    let tier: string;
    let badge: string;

    if (rank === 1) {
      tier = "Champion";
      badge = "🥇";
    } else if (rank === 2) {
      tier = "Runner-Up";
      badge = "🥈";
    } else if (rank === 3) {
      tier = "Third Place";
      badge = "🥉";
    } else if (rank <= 10) {
      tier = "Elite";
      badge = "⭐";
    } else if (rank <= 25) {
      tier = "Advanced";
      badge = "🌟";
    } else {
      tier = "Participant";
      badge = "🚀";
    }

    return { rank, tier, badge };
  });
}

/**
 * Calculate projected score based on current state
 * Useful for "what-if" analysis
 */
export function projectedScore(
  prototype: PrototypeData,
  aiAnalysis: AIAnalysis,
  assumedIterations: number = prototype.currentVersion
): number {
  const projected = { ...prototype, currentVersion: assumedIterations };
  const score = calculatePrototypeScore(projected, aiAnalysis);
  return score.total;
}

/**
 * Generate score improvement suggestions
 */
export function suggestScoreImprovements(
  scoreBreakdown: ScoreBreakdown
): string[] {
  const suggestions: string[] = [];

  if (scoreBreakdown.efficiency < 150) {
    suggestions.push("Focus on reducing weight or increasing solar panel size to boost Efficiency score");
  }

  if (scoreBreakdown.aerodynamics < 100) {
    suggestions.push("Iterate prototype design focusing on drag reduction (target Cd < 0.15)");
  }

  if (scoreBreakdown.innovation < 50) {
    suggestions.push("Upload more prototype images and iterate 3+ times to unlock Innovation bonus");
  }

  if (scoreBreakdown.speed < 25) {
    suggestions.push("Try the Novice or Speed modes if you're running out of time");
  }

  return suggestions;
}
