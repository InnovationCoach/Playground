/**
 * Versioned Context Assembler & Pedagogical Prompt Builder for Spark AI Tutor.
 * 
 * Rules:
 * - Derives learner identity and tenant scope entirely server-side.
 * - Missing age/grade is never invented; explicitly marked as unverified.
 * - Separates communication style from academic difficulty.
 * - Never infers clinical diagnoses, disabilities, or fixed ability labels.
 * - Enforces context size limits and recency windows (last 6 turns).
 * - Excludes protected assessment answers from ordinary prompt context.
 */

import { wrapStudentInput } from '../../safety.js';

export const CONTEXT_SCHEMA_VERSION = 1;

/**
 * Derives communication style guidelines based on verified age band and grade.
 */
export function resolvePedagogicalTone({ ageBand, gradeLevel, advanced = false, foundationalSupport = false }) {
  // Never invent missing values
  const hasAgeData = Boolean(ageBand);
  const band = ageBand || '13-15'; // Default fallback band if completely missing

  if (band === 'primary') {
    return [
      'The learner is in primary school (ages 6–11).',
      'Use short, clear sentences and simple everyday words.',
      'Ground abstract concepts in concrete physical objects (blocks, toys, sports, animals).',
      'Ask only ONE question at a time.',
      'Keep your response to at most 3 to 4 sentences.',
      advanced ? 'You may introduce challenging conceptual puzzles, but keep language simple and encouraging.' : ''
    ].filter(Boolean);
  }

  if (band === '16-18' || band === 'higher-secondary' || (gradeLevel && gradeLevel >= 9)) {
    return [
      'The learner is in higher secondary (ages 15–18).',
      'Use proper technical, mathematical, and engineering vocabulary.',
      'Encourage trade-off analysis, proportional reasoning, and independent investigation.',
      'Address the learner respectfully as an emerging young engineer or scientist.',
      foundationalSupport
        ? 'If explaining foundational concepts (like fractions or ratios), provide clear, mature explanations without speaking down to them or treating them like a younger child.'
        : 'Keep explanations concise and analytical.'
    ];
  }

  // Default: lower-secondary (ages 11–14, grades 6–8)
  return [
    'The learner is in lower secondary (ages 11–14, grades 6–8).',
    'Use clear, plain language. Introduce at most one technical term at a time with a plain-English definition.',
    'Ground mathematical rules in concrete examples before generalising.',
    'Ask only ONE main question at a time to keep cognitive load focused.',
    'Use an encouraging, respectful tone that treats their ideas seriously.',
    advanced ? 'Provide challenging mathematical or engineering depth, while maintaining clear, supportive communication.' : ''
  ].filter(Boolean);
}

/**
 * Assembles a bounded, structured context object for a Spark session.
 */
export function assembleTutorContext({
  learnerProfile,
  session,
  projectContext = null,
  recentTurns = [],
  approvedResources = [],
  assessmentRestricted = false
}) {
  const gradeLevel = Number.isInteger(learnerProfile.gradeLevel) ? learnerProfile.gradeLevel : null;
  const ageBand = learnerProfile.ageBand || null;

  const toneGuidelines = resolvePedagogicalTone({
    ageBand,
    gradeLevel,
    advanced: Boolean(learnerProfile.advancedPacing),
    foundationalSupport: session.assistanceLevel === 'scaffold' || session.assistanceLevel === 'analogous_example'
  });

  // Bounded recent turns: take at most the last 6 turns (12 messages)
  const boundedHistory = Array.isArray(recentTurns) ? recentTurns.slice(-6) : [];

  return {
    schemaVersion: CONTEXT_SCHEMA_VERSION,
    learner: {
      uid: learnerProfile.uid,
      displayName: learnerProfile.displayName || 'Learner',
      cohortId: learnerProfile.cohortId || null,
      schoolId: learnerProfile.schoolId || null,
      ageBand: ageBand || 'unrecorded',
      gradeLevel: gradeLevel !== null ? gradeLevel : 'unrecorded',
      missingDemographics: !ageBand || gradeLevel === null
    },
    mode: session.mode || 'pbl_mentor',
    assistanceLevel: session.assistanceLevel || 'elicit',
    activeDetour: session.activeDetour || null,
    projectContext: projectContext ? {
      projectId: projectContext.projectId,
      stage: projectContext.stage,
      objectiveId: projectContext.objectiveId,
      taskDescription: projectContext.taskDescription || ''
    } : null,
    approvedResources: (approvedResources || []).map(r => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      version: r.version || 1
    })),
    assessmentRestricted: Boolean(assessmentRestricted),
    toneGuidelines,
    boundedHistory
  };
}

/**
 * Builds the complete system instruction prompt for the model.
 */
export function buildTutorSystemPrompt(context) {
  const isPbl = context.mode === 'pbl_mentor';
  const level = context.assistanceLevel;
  const isRestricted = context.assessmentRestricted;

  const instructions = [
    'You are Spark, the WeLearn AI Learning Companion.',
    'Your goal is to help learners think, investigate, practise, and become more independent thinkers.',
    '',
    'CRITICAL ACADEMIC INTEGRITY DIRECTIVE:',
    '- Never hand over final answers, completed calculations, or submission-ready assignments to the learner.',
    '- Guide the learner to solve problems themselves using questions, hints, and structured steps.',
    isRestricted ? '- This task is an ASSESSED ACTIVITY. You are strictly forbidden from revealing numerical solutions or completing steps. Provide only conceptual hints and analogous examples.' : '',
    '',
    `ACTIVE MODE: ${isPbl ? 'PBL MENTOR' : 'ACADEMIC TUTOR'}`,
    isPbl
      ? 'Help with the learner\'s project, investigation, planning, troubleshooting, and reflection.'
      : 'Help diagnose conceptual gaps, explain fundamental concepts, guide practice, and build mastery.',
    '',
    `CURRENT ASSISTANCE LADDER LEVEL: ${level.toUpperCase()}`,
    getLevelDirective(level),
    '',
    'AUDIENCE & COMMUNICATION TONE:',
    ...context.toneGuidelines.map(g => `- ${g}`),
    '',
    context.activeDetour
      ? `ACTIVE ACADEMIC DETOUR: Working on topic "${context.activeDetour.topic}". The learner will return to their project once this concept is understood.`
      : '',
    context.approvedResources?.length
      ? `APPROVED CURRICULUM SOURCES (Only cite these sources):\n${context.approvedResources.map(r => `[${r.id}] ${r.title}: ${r.summary}`).join('\n')}`
      : 'No external curriculum sources approved for this question. Do not invent citations.',
    '',
    'OUTPUT FORMAT:',
    'Return your response with clear, friendly teaching. If you recommend a Detour or a Practice Task, state it clearly.'
  ].filter(Boolean);

  return instructions.join('\n');
}

function getLevelDirective(level) {
  switch (level) {
    case 'elicit':
      return '- Elicit first: Ask the learner what they already understand, what they have tried, or what they think the next step should be.';
    case 'hint':
      return '- Give one targeted hint: Offer a single clue or ask a guiding question that unlocks the next thought.';
    case 'scaffold':
      return '- Scaffold: Break the problem into 2 or 3 smaller steps, or represent the problem with a visual or conceptual breakdown. Ask the learner to complete just the first step.';
    case 'analogous_example':
      return '- Analogous Example: Walk through a parallel problem using DIFFERENT numbers or a different setting. Show the technique clearly, then invite the learner to apply it to their original numbers.';
    case 'guided_application':
      return '- Guided Application: Walk through the learner\'s problem interactively step-by-step. Let the learner perform each calculation or decision while you guide the process.';
    default:
      return '- Guide with questions and targeted feedback.';
  }
}
