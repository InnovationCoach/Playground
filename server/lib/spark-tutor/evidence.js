/**
 * Evidence Tracking Engine for WeLearn Spark AI Learning Companion.
 * 
 * Invariants & Boundaries:
 * - Distinguishes 5 categories:
 *   1. learner_statement
 *   2. practice_attempt
 *   3. deterministic_check
 *   4. ai_suggested_interpretation
 *   5. coach_reviewed
 * - Does NOT award XP.
 * - Does NOT update official grades, course completion, or competency awards.
 * - A correct answer after substantial help (Level 4 or 5) is recorded as
 *   'supported_performance', never 'independent_mastery'.
 * - Never infers mastery from fluency, time spent, or "I understand".
 */

export const EVIDENCE_TYPES = {
  LEARNER_STATEMENT: 'learner_statement',
  PRACTICE_ATTEMPT: 'practice_attempt',
  DETERMINISTIC_CHECK: 'deterministic_check',
  AI_SUGGESTED_INTERPRETATION: 'ai_suggested_interpretation',
  COACH_REVIEWED: 'coach_reviewed'
};

export const PERFORMANCE_TYPES = {
  SUPPORTED_PERFORMANCE: 'supported_performance',
  INDEPENDENT_ATTEMPT: 'independent_attempt',
  PROVISIONAL_UNDERSTANDING: 'provisional_understanding',
  UNRESOLVED_DIFFICULTY: 'unresolved_difficulty'
};

/**
 * Creates an immutable evidence record for a practice attempt.
 */
export function recordPracticeEvidence({
  learnerUid,
  schoolId,
  sessionId,
  objectiveId = 'math.ratios.proportional_reasoning',
  taskId,
  taskVersion = 1,
  learnerResponse,
  assistanceUsed = 'hint',
  evaluationResult, // { correct: boolean, expectedValue: number, userValue: number }
  provenance = 'spark_tutor_detour'
}) {
  const isSupported = assistanceUsed === 'analogous_example' || assistanceUsed === 'guided_application';

  let performanceType;
  if (!evaluationResult.correct) {
    performanceType = PERFORMANCE_TYPES.UNRESOLVED_DIFFICULTY;
  } else if (isSupported) {
    performanceType = PERFORMANCE_TYPES.SUPPORTED_PERFORMANCE;
  } else {
    performanceType = PERFORMANCE_TYPES.PROVISIONAL_UNDERSTANDING;
  }

  return {
    evidenceId: `evi_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: EVIDENCE_TYPES.DETERMINISTIC_CHECK,
    learnerUid,
    schoolId,
    sessionId,
    objectiveId,
    taskId,
    taskVersion,
    learnerResponse: String(learnerResponse || '').slice(0, 500),
    assistanceUsed,
    evaluationMethod: 'deterministic_check',
    evaluationResult: {
      correct: evaluationResult.correct,
      expected: evaluationResult.expectedValue,
      actual: evaluationResult.userValue
    },
    performanceType,
    provisionalInterpretation: evaluationResult.correct
      ? (isSupported
          ? 'Learner solved proportional reasoning correctly with guided scaffolding.'
          : 'Learner demonstrated independent application of proportional ratios.')
      : 'Learner struggled with the scaling calculation; further practice or coach guidance recommended.',
    // Absolute progress immutability boundary:
    officialProgressImpact: false,
    xpAwarded: 0,
    gradeChange: null,
    masteryAwarded: false,
    pblStageAdvanced: false,
    reviewStatus: 'pending_coach_review',
    provenance,
    createdAt: new Date().toISOString()
  };
}

/**
 * Summarizes session evidence for the coach review desk.
 */
export function compileCoachSummary({
  learnerProfile,
  session,
  evidenceList = [],
  supportRequest = null
}) {
  const practiceItems = evidenceList.filter(e => e.type === EVIDENCE_TYPES.DETERMINISTIC_CHECK);
  const correctCount = practiceItems.filter(e => e.evaluationResult?.correct).length;
  const totalCount = practiceItems.length;

  const highestAssistanceUsed = session.highestAssistanceUsed || session.assistanceLevel || 'elicit';

  return {
    learnerUid: learnerProfile.uid,
    displayName: learnerProfile.displayName || 'Learner',
    cohortId: learnerProfile.cohortId || null,
    sessionId: session.sessionId,
    mode: session.mode,
    activeTopic: session.activeDetour ? session.activeDetour.topic : (session.projectContext?.projectId || 'General Learning'),
    highestAssistanceUsed,
    practiceStats: {
      totalAttempts: totalCount,
      correctCount,
      passRate: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : null
    },
    hasActiveDetour: Boolean(session.activeDetour),
    supportRequested: Boolean(supportRequest),
    supportDetails: supportRequest ? {
      requestedAt: supportRequest.createdAt,
      question: supportRequest.question,
      status: supportRequest.status
    } : null,
    provisionalInsights: [
      totalCount > 0 && correctCount === totalCount
        ? 'Successfully completed ratios detour practice. Returned to solar panel project calculation.'
        : 'Currently working through proportional scaling concepts.',
      highestAssistanceUsed === 'guided_application'
        ? 'Benefited from step-by-step guided breakdown during calculation.'
        : null
    ].filter(Boolean),
    lastActiveAt: session.updatedAt || session.createdAt
  };
}
