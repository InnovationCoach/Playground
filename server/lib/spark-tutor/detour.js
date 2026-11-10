/**
 * Detour Engine connecting PBL Projects with Academic Tutor Practice.
 * 
 * Supports:
 * - Diagnosing prerequisite academic gaps (e.g., ratios and fractions).
 * - Transitioning into an academic detour while preserving full project context.
 * - Generating deterministic practice questions with mathematical grading.
 * - Seamlessly returning the learner to their originating project problem.
 * - Operating as a standalone academic tutor when no project exists.
 */

export const DETOUR_TOPICS = {
  RATIOS_FRACTIONS: 'ratios_and_proportions',
  ENERGY_POWER_UNITS: 'energy_and_power_conversion',
  ALGEBRAIC_FORMULAS: 'solving_single_variable_equations'
};

export const BUILT_IN_PRACTICE_QUESTIONS = {
  'prac-ratio-solar-01': {
    id: 'prac-ratio-solar-01',
    topic: DETOUR_TOPICS.RATIOS_FRACTIONS,
    question: 'If a 3 m² solar panel produces 600 W of electrical power, how many m² are required to produce 1800 W at the same efficiency?',
    promptHint: 'Think about the ratio: how many times greater is 1800 W than 600 W?',
    expectedValue: 9,
    unit: 'm²',
    unitAliases: ['m2', 'm^2', 'sqm', 'square meters', 'meters squared'],
    tolerance: 0.01,
    explanation: '1800 W is 3 times 600 W (1800 / 600 = 3). Because power scales proportionally with surface area, you need 3 times the area: 3 m² × 3 = 9 m².'
  },
  'prac-ratio-dust-02': {
    id: 'prac-ratio-dust-02',
    topic: DETOUR_TOPICS.RATIOS_FRACTIONS,
    question: 'On Earth, a panel generates 200 W per m². On Mars, global dust storms attenuate sunlight to a 1:4 ratio (1/4 of Earth irradiance). How many Watts does 1 m² produce on Mars during a storm?',
    promptHint: 'Calculate one fourth of 200 W.',
    expectedValue: 50,
    unit: 'W',
    unitAliases: ['watts', 'watt', 'w'],
    tolerance: 0.01,
    explanation: 'With a 1:4 ratio, power drops to 1/4 of normal: 200 W × (1 / 4) = 50 W per m².'
  },
  'prac-ratio-mars-total-03': {
    id: 'prac-ratio-mars-total-03',
    topic: DETOUR_TOPICS.RATIOS_FRACTIONS,
    question: 'Now connecting back: If 1 m² generates 50 W during a Mars dust storm, how many m² are needed to provide 1000 W (1 kW)?',
    promptHint: 'Divide the target 1000 W by the power generated per square meter (50 W/m²).',
    expectedValue: 20,
    unit: 'm²',
    unitAliases: ['m2', 'm^2', 'sqm', 'square meters'],
    tolerance: 0.01,
    explanation: '1000 W / 50 W/m² = 20 m². So each kilowatt needs 20 m² of solar panels during dust storms.'
  }
};

/**
 * Deterministically checks a learner's numeric answer against expected solution.
 */
export function checkNumericAnswer(userAnswerText, taskSpec) {
  if (!userAnswerText || typeof userAnswerText !== 'string') {
    return {
      correct: false,
      feedback: 'Please enter a numeric answer.',
      userValue: null,
      expectedValue: taskSpec.expectedValue
    };
  }

  // Extract clean number: match integer or decimal (e.g. "9", "9.0", "9 m²")
  const match = userAnswerText.trim().match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!match) {
    return {
      correct: false,
      feedback: 'Could not find a number in your answer. Please provide the calculated value.',
      userValue: null,
      expectedValue: taskSpec.expectedValue
    };
  }

  const parsedValue = parseFloat(match[0]);
  if (!Number.isFinite(parsedValue)) {
    return {
      correct: false,
      feedback: 'Invalid number format.',
      userValue: null,
      expectedValue: taskSpec.expectedValue
    };
  }

  const diff = Math.abs(parsedValue - taskSpec.expectedValue);
  const isCorrect = diff <= (taskSpec.tolerance || 0.05);

  return {
    correct: isCorrect,
    userValue: parsedValue,
    expectedValue: taskSpec.expectedValue,
    feedback: isCorrect
      ? `Spot on! ${taskSpec.explanation}`
      : `Not quite. You answered ${parsedValue}, but the expected calculation gives ${taskSpec.expectedValue}. Here is how to think about it: ${taskSpec.explanation}`
  };
}

/**
 * Creates an academic detour state bundle.
 */
export function createDetour({
  originatingProjectContext = null,
  topic = DETOUR_TOPICS.RATIOS_FRACTIONS,
  reason = 'PREREQUISITE_GAP_IDENTIFIED',
  firstTaskId = 'prac-ratio-solar-01'
}) {
  const task = BUILT_IN_PRACTICE_QUESTIONS[firstTaskId] || BUILT_IN_PRACTICE_QUESTIONS['prac-ratio-solar-01'];
  return {
    detourId: `detour-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: 'active',
    topic,
    reason,
    originatingProjectContext: originatingProjectContext ? {
      projectId: originatingProjectContext.projectId,
      stage: originatingProjectContext.stage,
      objectiveId: originatingProjectContext.objectiveId,
      returnTarget: originatingProjectContext.returnTarget || 'original_project_calculation'
    } : null,
    currentTaskId: task.id,
    practiceHistory: [],
    completed: false,
    startedAt: new Date().toISOString()
  };
}

/**
 * Resolves return-to-project prompt and guidance after completing a detour.
 */
export function buildReturnToProjectBrief(originatingProjectContext, detourSummary) {
  if (!originatingProjectContext || !originatingProjectContext.projectId) {
    return {
      canReturnToProject: false,
      prompt: "You've successfully completed this practice concept! What would you like to investigate next?"
    };
  }

  const projectName = originatingProjectContext.projectId === 'mars-colony-hab-2026'
    ? 'Sustainable Mars Colony Habitat'
    : originatingProjectContext.projectId;

  return {
    canReturnToProject: true,
    projectId: originatingProjectContext.projectId,
    projectName,
    stage: originatingProjectContext.stage,
    prompt: `Excellent! Now that you've demonstrated how solar power scales with surface area using ratios, let's bring that exact insight back to your ${projectName} project. Your habitat needs 24 kW of continuous base load during Martian dust storms. Knowing that 1 kW requires 20 m² during a storm, how many square meters of panels will your 24 kW array need in total?`
  };
}
