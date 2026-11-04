import { competencyById } from '../../pbl/content/competencies.js';

export const STEP_TYPES = [
  { id: 'introduction', label: 'Introduction', icon: '📖', hint: 'Introduce the objective and context' },
  { id: 'resource', label: 'Resource', icon: '📂', hint: 'Reference materials, slides, or role briefs' },
  { id: 'task', label: 'Core Task', icon: '🎯', hint: 'What learners actively build, calculate, or do' },
  { id: 'practice', label: 'Practice', icon: '⚡', hint: 'Guided exercise or simulation challenge' },
  { id: 'reflection', label: 'Reflection', icon: '💭', hint: 'Individual written or verbal reflection' },
  { id: 'submission', label: 'Submission', icon: '📤', hint: 'Deliverable submitted for educator review' }
];

export const SUBMISSION_FORMATS = [
  { id: 'document', label: 'Written document or PDF' },
  { id: 'media', label: 'Photos or video demonstration' },
  { id: 'code', label: 'Code or project archive' },
  { id: 'presentation', label: 'Slides or poster' }
];

export const emptyStep = (order = 1) => ({
  id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  order,
  title: `Step ${order}`,
  type: order === 1 ? 'introduction' : 'task',
  instructions: '',
  durationMinutes: 15,
  competencyIds: []
});

export const emptyLesson = (classId = '', milestoneId = '') => ({
  title: '',
  outcome: '',
  instructions: '',
  estimatedMinutes: 45,
  prerequisites: '',
  prerequisiteCompetencyIds: [],
  classId,
  milestoneId,
  competencyIds: [],
  successCriteria: [],
  steps: [
    { ...emptyStep(1), title: 'Understand the challenge', type: 'introduction', instructions: '' },
    { ...emptyStep(2), title: 'Investigate and build', type: 'task', instructions: '' }
  ],
  evidenceSpec: {
    type: 'individual',
    acceptedFormats: ['document', 'media'],
    reviewer: 'coach',
    completionRule: 'rubric'
  },
  attachments: []
});

/**
 * Normalizes a lesson object so both legacy unstructured lessons and modern
 * 6-section structured lessons render predictably.
 */
export function normalizeLesson(lesson) {
  if (!lesson) return null;

  let steps = Array.isArray(lesson.steps) && lesson.steps.length > 0
    ? lesson.steps.map((s, idx) => ({
        id: s.id || `step-${idx + 1}`,
        order: Number(s.order || idx + 1),
        title: s.title || `Step ${idx + 1}`,
        type: s.type || 'task',
        instructions: s.instructions || '',
        durationMinutes: Number(s.durationMinutes) || 15,
        competencyIds: Array.isArray(s.competencyIds) ? s.competencyIds : []
      }))
    : [];

  // Backward compatibility: If no structured steps exist, hydrate from instructions
  if (steps.length === 0) {
    const rawInstructions = typeof lesson.instructions === 'string' ? lesson.instructions.trim() : '';
    steps = [
      {
        id: 'step-legacy-1',
        order: 1,
        title: 'Lesson overview & instructions',
        type: 'task',
        instructions: rawInstructions || 'Follow the coach instructions provided in class.',
        durationMinutes: Number(lesson.estimatedMinutes) || 45,
        competencyIds: Array.isArray(lesson.competencyIds) ? lesson.competencyIds : []
      }
    ];
  }

  const calculatedMinutes = steps.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  const estimatedMinutes = Number(lesson.estimatedMinutes) || (calculatedMinutes > 0 ? calculatedMinutes : 45);

  const competencyIds = Array.isArray(lesson.competencyIds) ? lesson.competencyIds : [];
  const competencies = competencyIds.map(id => competencyById(id)).filter(Boolean);

  const successCriteria = Array.isArray(lesson.successCriteria)
    ? lesson.successCriteria.filter(c => typeof c === 'string' && c.trim())
    : [];

  const evidenceSpec = {
    type: lesson.evidenceSpec?.type === 'team' ? 'team' : 'individual',
    acceptedFormats: Array.isArray(lesson.evidenceSpec?.acceptedFormats) ? lesson.evidenceSpec.acceptedFormats : ['document', 'media'],
    reviewer: lesson.evidenceSpec?.reviewer || 'coach',
    completionRule: lesson.evidenceSpec?.completionRule || 'rubric'
  };

  return {
    ...lesson,
    title: lesson.title || '',
    outcome: lesson.outcome || '',
    instructions: lesson.instructions || flattenStepsInstructions(steps),
    estimatedMinutes,
    prerequisites: lesson.prerequisites || '',
    prerequisiteCompetencyIds: Array.isArray(lesson.prerequisiteCompetencyIds) ? lesson.prerequisiteCompetencyIds : [],
    competencyIds,
    competencies,
    successCriteria,
    steps,
    evidenceSpec,
    attachments: Array.isArray(lesson.attachments) ? lesson.attachments : []
  };
}

/**
 * Creates a clean text fallback of all steps combined.
 */
export function flattenStepsInstructions(steps = []) {
  if (!Array.isArray(steps) || steps.length === 0) return '';
  return steps
    .map((s, idx) => `### Step ${idx + 1}: ${s.title} (${s.durationMinutes || 15}m)\n${s.instructions || ''}`)
    .join('\n\n')
    .trim();
}
