import { z } from 'zod';
import { COMPETENCIES, competencyById } from '../src/features/pbl/content/competencies.js';
import { STEAM_NGSS } from '../src/features/pbl/content/steamNgss.js';

export const APPROVED_NGS_CATALOG = (() => {
  const seen = new Map();
  for (const [activityId, entry] of Object.entries(STEAM_NGSS || {})) {
    for (const pe of entry?.pes || []) {
      if (pe?.code && !seen.has(pe.code)) {
        seen.set(pe.code, {
          framework: 'ngs',
          id: pe.code,
          code: pe.code,
          title: pe.title,
          statement: pe.title,
          activityId
        });
      }
    }
  }
  return Array.from(seen.values());
})();

const ngsByCode = new Map(APPROVED_NGS_CATALOG.map((item) => [item.id, item]));
export const ngsById = (id) => ngsByCode.get(id) || null;

/**
 * Resolves a { framework, id } reference against the approved WeLearn and NGS catalogs.
 * Returns null if the framework or ID is not in the approved catalogs.
 */
export function resolveApprovedCompetency(ref) {
  if (!ref || typeof ref !== 'object' || Array.isArray(ref)) return null;
  const rawFramework = typeof ref.framework === 'string' ? ref.framework.trim().toLowerCase() : '';
  const id = typeof ref.id === 'string' ? ref.id.trim() : '';
  if (!id) return null;

  if (rawFramework === 'welearn') {
    const found = competencyById(id);
    if (!found) return null;
    return {
      framework: 'welearn',
      id: found.id,
      code: found.code,
      title: found.title,
      statement: found.statement
    };
  }

  if (rawFramework === 'ngs' || rawFramework === 'ngss') {
    const found = ngsById(id);
    if (!found) return null;
    return {
      framework: rawFramework,
      id: found.id,
      code: found.code,
      title: found.title,
      statement: found.statement
    };
  }

  return null;
}

/**
 * Resolves either a { framework, id } object or a bare approved ID string.
 * Used when validating milestone competency mappings returned by the AI model.
 */
export function coerceApprovedCompetency(item, allowedMap = null) {
  if (!item) return null;
  let resolved = null;
  if (typeof item === 'string') {
    const trimmed = item.trim();
    const wl = competencyById(trimmed);
    if (wl) {
      resolved = { framework: 'welearn', id: wl.id, code: wl.code, title: wl.title, statement: wl.statement };
    } else {
      const ngs = ngsById(trimmed);
      if (ngs) {
        resolved = { framework: 'ngs', id: ngs.id, code: ngs.code, title: ngs.title, statement: ngs.statement };
      }
    }
  } else if (typeof item === 'object') {
    resolved = resolveApprovedCompetency(item);
  }
  if (!resolved) return null;
  if (allowedMap && allowedMap.size > 0) {
    return allowedMap.get(resolved.id) || null;
  }
  return resolved;
}

/**
 * Validates requested competencies array [{ framework, id }] from client/API payload.
 * Throws an Error with code = 'VALIDATION' and status = 400 on unknown IDs or invalid shapes.
 */
export function validateRequestedCompetencies(competencies, { max = 20 } = {}) {
  if (competencies === undefined || competencies === null) return [];
  const failValidation = (message) => {
    const err = new Error(message);
    err.code = 'VALIDATION';
    err.status = 400;
    throw err;
  };

  if (!Array.isArray(competencies)) {
    failValidation('Competencies must be an array of {framework, id} selections.');
  }
  if (competencies.length > max) {
    failValidation(`Competencies allows at most ${max} selections.`);
  }

  const seen = new Set();
  const resolved = [];
  for (const item of competencies) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      failValidation('Each competency selection must be an object with {framework, id}.');
    }
    const entry = resolveApprovedCompetency(item);
    if (!entry) {
      const fw = typeof item.framework === 'string' ? item.framework : 'unknown';
      const rawId = typeof item.id === 'string' ? item.id : '';
      failValidation(`Unknown or unapproved competency '${fw}:${rawId}'. Choose from the approved WeLearn or NGS catalogs.`);
    }
    const key = `${entry.framework === 'ngss' ? 'ngs' : entry.framework}:${entry.id}`;
    if (seen.has(key)) {
      failValidation(`Duplicate competency selection '${entry.id}'.`);
    }
    seen.add(key);
    resolved.push(entry);
  }
  return resolved;
}

export const PblCompetencyRefSchema = z.object({
  framework: z.enum(['welearn', 'ngs', 'ngss']),
  id: z.string().min(1),
  code: z.string().optional(),
  title: z.string().optional(),
  statement: z.string().optional()
});

export const PblMilestoneSchema = z.object({
  id: z.string().default(() => `ms-${Math.random().toString(36).slice(2, 9)}`),
  stageNumber: z.number().int().min(1).max(16),
  stageName: z.string().default('Milestone'),
  title: z.string().min(1),
  week: z.number().int().min(1).max(16).default(1),
  durationMin: z.number().int().default(90),
  learningGoal: z.string().default(''),
  activities: z.array(z.string()).default([]),
  makerSpaceTools: z.array(z.string()).default([]),
  evidencePrompt: z.string().default('Submit your milestone evidence or demo.'),
  allowedSubmissions: z.array(z.enum(['video', 'github', 'prototype', 'note', 'photo', 'data'])).default(['video', 'github', 'prototype']),
  coachCue: z.string().default('Guide learner initiation and review prototype iterations.'),
  competencies: z.array(PblCompetencyRefSchema).default([])
});

export const PBL_STAGES = [
  { stageNumber: 1, stageName: 'Curiosity & Exploration', week: 1 },
  { stageNumber: 2, stageName: 'Empathy & Research', week: 2 },
  { stageNumber: 3, stageName: 'Problem Definition', week: 3 },
  { stageNumber: 4, stageName: 'Ideation & Concept Design', week: 4 },
  { stageNumber: 5, stageName: 'Prototyping & Fabrication', week: 5 },
  { stageNumber: 6, stageName: 'Testing & Iteration', week: 6 },
  { stageNumber: 7, stageName: 'Reflection & Synthesis', week: 7 },
  { stageNumber: 8, stageName: 'Showcase & Public Expo', week: 8 }
];

export const MakerSpaceSpecSchema = z.object({
  toolType: z.string().default('MakerSpace Workstation'),
  specs: z.string().default('General fabrication & prototyping'),
  safetyGuidelines: z.string().default('Wear eye protection and follow coach instructions.')
});

export const CoachCuesSchema = z.object({
  leadCoach: z.string().default('Coach Donovan'),
  initiationCue: z.string().default('Break down the starter milestone into a visible 15-minute challenge.'),
  frustrationDeescalationCue: z.string().default('Pause, review the error log or prototype joint, and test one sub-assembly.'),
  midCheckCue: z.string().default('Check sensory inputs and mechanical tolerances against success criteria.'),
  showcaseCue: z.string().default('Prepare a 60s pitch demonstrating telemetry, real impact, and key failure iterations.')
});

export const QuizItemSchema = z.object({
  id: z.string().default(() => `q-${Math.random().toString(36).slice(2, 7)}`),
  type: z.enum(['single', 'multi', 'true_false']).default('single'),
  prompt: z.string().min(1),
  options: z.array(z.string()).min(2),
  answers: z.array(z.number().int()).min(1),
  explanation: z.string().default(''),
  difficulty: z.number().int().min(1).max(3).default(1),
  stageNumber: z.number().int().optional()
});

export const PblUnitSchema = z.object({
  id: z.string().default(() => `pbl-${Date.now()}`),
  unitTitle: z.string().min(1),
  theme: z.string().min(1),
  drivingQuestion: z.string().min(1),
  unitType: z.enum(['pbl_unit', 'steam_activity', 'milestones', 'quiz']).default('pbl_unit'),
  programme: z.enum(['WLS', 'WHS', 'primary']).default('WLS'),
  duration: z.union([z.string(), z.number()]).default('8 stages'),
  language: z.enum(['en-GB', 'th']).default('en-GB'),
  realProblem: z.object({
    summary: z.string().default(''),
    peopleImpact: z.string().default(''),
    environmentalImpact: z.string().default('')
  }).default({ summary: '', peopleImpact: '', environmentalImpact: '' }),
  targetLearner: z.object({
    id: z.string().default('universal-all'),
    name: z.string().default('All Learners'),
    learningNeeds: z.union([z.string(), z.array(z.string())]).transform((v) => (Array.isArray(v) ? v.join('; ') : v || '')).default(''),
    consumingPassions: z.union([z.string(), z.array(z.string())]).transform((v) => (Array.isArray(v) ? v.join(', ') : v || '')).default(''),
    appliedAccommodations: z.array(z.string()).default([])
  }).default({ id: 'universal-all', name: 'All Learners', learningNeeds: '', consumingPassions: '', appliedAccommodations: [] }),
  makerSpaceSpecs: z.array(MakerSpaceSpecSchema).default([]),
  coachCues: CoachCuesSchema.default({}),
  competencies: z.array(PblCompetencyRefSchema).default([]),
  milestones: z.array(PblMilestoneSchema).max(16).default([]),
  quizItems: z.array(QuizItemSchema).optional(),
  sourcesUsed: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'in_progress', 'archived']).default('draft'),
  publishedAt: z.number().nullable().default(null)
});

/**
 * Normalizes raw model output, injecting missing required identifiers,
 * validating milestone competency mappings against approved catalogs,
 * and ensuring strict adherence to PblUnitSchema.
 */
export function normalizePblUnit(raw, fallback = {}) {
  const now = Date.now();
  const rawObj = (raw && typeof raw === 'object') ? raw : {};

  const id = rawObj.id || fallback.id || `pbl-${(fallback.programme || 'unit').toLowerCase()}-${now}`;

  // Resolve requested/unit-level competencies from approved catalogs only
  const rawUnitCompetencies = Array.isArray(fallback.competencies) && fallback.competencies.length > 0
    ? fallback.competencies
    : (Array.isArray(rawObj.competencies) ? rawObj.competencies : []);

  const unitCompetencies = [];
  const allowedById = new Map();
  for (const item of rawUnitCompetencies) {
    const resolved = coerceApprovedCompetency(item);
    if (resolved && !allowedById.has(resolved.id)) {
      allowedById.set(resolved.id, resolved);
      unitCompetencies.push(resolved);
    }
  }

  const normalizeMilestoneCompetencies = (rawList, idx) => {
    const list = Array.isArray(rawList) ? rawList : [];
    const seen = new Set();
    const valid = [];
    for (const item of list) {
      const resolved = coerceApprovedCompetency(item, allowedById.size > 0 ? allowedById : null);
      if (resolved && !seen.has(resolved.id)) {
        seen.add(resolved.id);
        valid.push(resolved);
      }
    }
    if (valid.length === 0 && unitCompetencies.length > 0) {
      // Deterministically map requested competencies when model omits or mislabels milestone mappings
      const assigned = unitCompetencies[idx % unitCompetencies.length];
      return assigned ? [assigned] : [];
    }
    return valid;
  };

  let milestones = Array.isArray(rawObj.milestones) ? rawObj.milestones.map((m, idx) => ({
    id: m?.id || `ms-${idx + 1}-${now}`,
    stageNumber: Number(m?.stageNumber) || (idx + 1),
    stageName: m?.stageName || `Stage ${idx + 1}`,
    title: m?.title || `Milestone ${idx + 1}`,
    week: Number(m?.week) || Math.min(idx + 1, 12),
    durationMin: Number(m?.durationMin) || 90,
    learningGoal: m?.learningGoal || '',
    activities: Array.isArray(m?.activities) ? m.activities : (m?.activities ? [m.activities] : []),
    makerSpaceTools: Array.isArray(m?.makerSpaceTools) ? m.makerSpaceTools : [],
    evidencePrompt: m?.evidencePrompt || 'Upload demo video or code link.',
    allowedSubmissions: Array.isArray(m?.allowedSubmissions) ? m.allowedSubmissions : ['video', 'github', 'prototype'],
    coachCue: m?.coachCue || 'Check prototype tolerances and celebrate iterations.',
    competencies: normalizeMilestoneCompetencies(m?.competencies, idx)
  })) : [];

  if (milestones.length === 0 && fallback.unitType !== 'quiz') {
    milestones = PBL_STAGES.map((st, idx) => ({
      id: `ms-${idx + 1}-${now}`,
      stageNumber: st.stageNumber,
      stageName: st.stageName,
      title: `${st.stageName}: Project Development`,
      week: st.week,
      durationMin: 90,
      learningGoal: `Engage with ${st.stageName.toLowerCase()} goals.`,
      activities: [`Active participation in ${st.stageName.toLowerCase()} activities.`],
      makerSpaceTools: ['Electronics bench', 'Prototyping tools'],
      evidencePrompt: `Milestone artifact for ${st.stageName}.`,
      allowedSubmissions: ['video', 'github', 'prototype'],
      coachCue: 'Facilitate hands-on initiation.',
      competencies: normalizeMilestoneCompetencies([], idx)
    }));
  }

  // If milestones introduced valid approved competencies and unitCompetencies was empty, collect them
  if (unitCompetencies.length === 0) {
    for (const m of milestones) {
      for (const c of m.competencies || []) {
        if (!allowedById.has(c.id)) {
          allowedById.set(c.id, c);
          unitCompetencies.push(c);
        }
      }
    }
  }

  const targetLearner = {
    id: rawObj.targetLearner?.id || fallback.learner?.id || fallback.learner?.uid || 'universal-all',
    name: fallback.learner?.name || fallback.learner?.displayName || 'All Learners',
    learningNeeds: fallback.learningNeeds || fallback.learner?.learningNeeds || '',
    consumingPassions: fallback.learner?.consumingPassions || fallback.consumingPassions || '',
    appliedAccommodations: fallback.learningNeedsList || fallback.learner?.appliedAccommodations || []
  };

  const makerSpaceSpecs = Array.isArray(rawObj.makerSpaceSpecs) && rawObj.makerSpaceSpecs.length > 0
    ? rawObj.makerSpaceSpecs.map((spec) => {
        if (typeof spec === 'string') {
          return { toolType: spec, specs: 'General fabrication & prototyping', safetyGuidelines: 'Standard lab safety' };
        }
        return {
          toolType: spec?.toolType || spec?.toolName || 'MakerSpace Workstation',
          specs: spec?.specs || 'General fabrication & prototyping',
          safetyGuidelines: spec?.safetyGuidelines || 'Standard lab safety'
        };
      })
    : [{ toolType: 'MakerSpace Workstation', specs: 'General fabrication & prototyping', safetyGuidelines: 'Standard lab safety' }];

  const candidate = {
    ...rawObj,
    id,
    unitTitle: rawObj.unitTitle || fallback.unitTitle || (rawObj.theme ? `PBL: ${rawObj.theme}` : 'Untitled Learning Unit'),
    theme: rawObj.theme || fallback.theme || 'STEM Innovation',
    drivingQuestion: rawObj.drivingQuestion || fallback.drivingQuestion || 'How might we engineer a sustainable solution to this real-world challenge?',
    unitType: fallback.unitType || rawObj.unitType || 'pbl_unit',
    programme: fallback.programme || rawObj.programme || 'WLS',
    duration: fallback.duration || rawObj.duration || `${milestones.length} milestones`,
    language: fallback.language || rawObj.language || 'en-GB',
    realProblem: {
      summary: rawObj.realProblem?.summary || '',
      peopleImpact: rawObj.realProblem?.peopleImpact || '',
      environmentalImpact: rawObj.realProblem?.environmentalImpact || ''
    },
    targetLearner,
    makerSpaceSpecs,
    coachCues: {
      leadCoach: rawObj.coachCues?.leadCoach || 'Coach Donovan',
      initiationCue: rawObj.coachCues?.initiationCue || 'Break down the starter milestone into a visible 15-minute challenge.',
      frustrationDeescalationCue: rawObj.coachCues?.frustrationDeescalationCue || 'Pause, review the error log or prototype joint, and test one sub-assembly.',
      midCheckCue: rawObj.coachCues?.midCheckCue || 'Check sensory inputs and mechanical tolerances against success criteria.',
      showcaseCue: rawObj.coachCues?.showcaseCue || 'Prepare a 60s pitch demonstrating telemetry, real impact, and key failure iterations.'
    },
    competencies: unitCompetencies,
    milestones,
    quizItems: Array.isArray(rawObj.quizItems) ? rawObj.quizItems : [],
    sourcesUsed: Array.isArray(fallback.sourcesUsed) ? fallback.sourcesUsed : (rawObj.sourcesUsed || []),
    status: rawObj.status || 'draft',
    publishedAt: rawObj.publishedAt || null
  };

  return PblUnitSchema.parse(candidate);
}
