/**
 * Five-Level Assistance Ladder for WeLearn Spark AI Learning Companion.
 * 
 * Levels:
 * 1. elicit: Ask what the learner understands or has tried.
 * 2. hint: Give one targeted clue without revealing calculations.
 * 3. scaffold: Break the problem into a small step or representation.
 * 4. analogous_example: Demonstrate a similar problem with different values/context.
 * 5. guided_application: Walk through the method interactively, prompting the learner for
 *    meaningful decisions, then checking independent understanding.
 */

export const ASSISTANCE_LEVELS = {
  ELICIT: 'elicit',
  HINT: 'hint',
  SCAFFOLD: 'scaffold',
  ANALOGOUS_EXAMPLE: 'analogous_example',
  GUIDED_APPLICATION: 'guided_application'
};

export const LEVEL_ORDER = [
  ASSISTANCE_LEVELS.ELICIT,
  ASSISTANCE_LEVELS.HINT,
  ASSISTANCE_LEVELS.SCAFFOLD,
  ASSISTANCE_LEVELS.ANALOGOUS_EXAMPLE,
  ASSISTANCE_LEVELS.GUIDED_APPLICATION
];

export const LEVEL_METADATA = {
  [ASSISTANCE_LEVELS.ELICIT]: {
    index: 1,
    label: 'Exploring your ideas',
    description: 'Asking what you already know or have tried so far.'
  },
  [ASSISTANCE_LEVELS.HINT]: {
    index: 2,
    label: 'Targeted clue',
    description: 'Providing a conceptual hint without giving away the solution.'
  },
  [ASSISTANCE_LEVELS.SCAFFOLD]: {
    index: 3,
    label: 'Step-by-step breakdown',
    description: 'Breaking down the problem into smaller, manageable parts.'
  },
  [ASSISTANCE_LEVELS.ANALOGOUS_EXAMPLE]: {
    index: 4,
    label: 'Similar example',
    description: 'Walking through a parallel problem with different numbers.'
  },
  [ASSISTANCE_LEVELS.GUIDED_APPLICATION]: {
    index: 5,
    label: 'Guided practice',
    description: 'Working together through the steps while you make the key decisions.'
  }
};

/**
 * Detects frustration or emotional distress keywords in student input.
 */
export function detectFrustration(text) {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.toLowerCase();
  const frustrationPatterns = [
    /\bi'?m (so |completely |totally )?stuck\b/,
    /\bi don'?t (even )?(get|understand) this\b/,
    /\bthis is (impossible|too hard|ridiculous|stupid)\b/,
    /\bi hate (this|maths?|physics|coding)\b/,
    /\bi give up\b/,
    /\bi can'?t do this\b/,
    /\bi'?m frustrated\b/,
    /\bthis makes no sense\b/,
    /\bhelp me please i'?m lost\b/
  ];
  return frustrationPatterns.some(pattern => pattern.test(normalized));
}

/**
 * Detects explicit learner requests for specific help levels.
 */
export function detectHelpIntent(text) {
  if (!text || typeof text !== 'string') return null;
  const t = text.toLowerCase();

  if (/\b(explain differently|another way|different way)\b/.test(t)) {
    return 'EXPLAIN_DIFFERENTLY';
  }
  if (/\b(give me a hint|need a hint|just a hint)\b/.test(t)) {
    return ASSISTANCE_LEVELS.HINT;
  }
  if (/\b(break (it )?down|step by step|scaffold|smaller steps)\b/.test(t)) {
    return ASSISTANCE_LEVELS.SCAFFOLD;
  }
  if (/\b(example|similar problem|another problem like this)\b/.test(t)) {
    return ASSISTANCE_LEVELS.ANALOGOUS_EXAMPLE;
  }
  if (/\b(walk me through|work together|guide me|solve together)\b/.test(t)) {
    return ASSISTANCE_LEVELS.GUIDED_APPLICATION;
  }
  return null;
}

/**
 * Validates and calculates the authoritative assistance state for a turn.
 * 
 * Rules:
 * - Direct intent requests are honored (unless restricted by assessment).
 * - After 2 unsuccessful attempts at the current strategy, assistance level escalates or switches.
 * - Frustration triggers cognitive load reduction and offers coach support.
 * - Assessment restrictions cap max assistance to scaffold / analogous_example and forbid answer reveals.
 */
export function resolveAssistanceTransition({
  currentLevel = ASSISTANCE_LEVELS.ELICIT,
  consecutiveFailures = 0,
  studentMessage = '',
  assessmentRestricted = false,
  claimedModelLevel = null,
  prerequisiteMissing = false
}) {
  const isFrustrated = detectFrustration(studentMessage);
  const helpIntent = detectHelpIntent(studentMessage);
  const maxAllowedLevel = assessmentRestricted ? ASSISTANCE_LEVELS.ANALOGOUS_EXAMPLE : ASSISTANCE_LEVELS.GUIDED_APPLICATION;

  let nextLevel = currentLevel;
  let transitionReason = 'MAINTAIN';
  let representationChanged = false;
  let recommendCoachEscalation = isFrustrated;

  if (isFrustrated) {
    transitionReason = 'FRUSTRATION_DE_ESCALATION';
    // Reduce cognitive load: move to scaffold or analogous example
    nextLevel = ASSISTANCE_LEVELS.SCAFFOLD;
  } else if (prerequisiteMissing) {
    // If learner lacks prerequisite, direct explanation/scaffolding starts immediately
    nextLevel = ASSISTANCE_LEVELS.SCAFFOLD;
    transitionReason = 'PREREQUISITE_DIRECT_TEACHING';
  } else if (helpIntent === 'EXPLAIN_DIFFERENTLY') {
    transitionReason = 'LEARNER_REQUESTED_NEW_REPRESENTATION';
    representationChanged = true;
    nextLevel = currentLevel;
  } else if (helpIntent && LEVEL_ORDER.includes(helpIntent)) {
    transitionReason = 'LEARNER_REQUESTED_LEVEL';
    nextLevel = helpIntent;
  } else if (consecutiveFailures >= 2) {
    // Two unsuccessful attempts: escalate ladder or change representation
    const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
    if (currentIndex < LEVEL_ORDER.indexOf(maxAllowedLevel)) {
      nextLevel = LEVEL_ORDER[currentIndex + 1];
      transitionReason = 'CONSECUTIVE_UNSUCCESSFUL_ATTEMPTS';
    } else {
      representationChanged = true;
      transitionReason = 'MAX_LEVEL_REPRESENTATION_SHIFT';
      recommendCoachEscalation = true;
    }
  } else if (claimedModelLevel && LEVEL_ORDER.includes(claimedModelLevel)) {
    // Model suggested level: clamp to valid boundaries (cannot skip more than 1 level ahead without intent)
    const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
    const claimedIndex = LEVEL_ORDER.indexOf(claimedModelLevel);
    if (claimedIndex <= currentIndex + 1) {
      nextLevel = claimedModelLevel;
      transitionReason = 'MODEL_VALIDATED_PROGRESSION';
    }
  }

  // Enforce assessment restriction ceiling
  const nextIndex = LEVEL_ORDER.indexOf(nextLevel);
  const maxIndex = LEVEL_ORDER.indexOf(maxAllowedLevel);
  if (nextIndex > maxIndex) {
    nextLevel = maxAllowedLevel;
    transitionReason = 'CAPPED_BY_ASSESSMENT_RESTRICTION';
  }

  return {
    assistanceLevel: nextLevel,
    transitionReason,
    isFrustrated,
    representationChanged,
    recommendCoachEscalation,
    metadata: LEVEL_METADATA[nextLevel]
  };
}
