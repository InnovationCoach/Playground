/**
 * Course Maker Curriculum Alignment Validator
 * Uses the official WeLearn Competency Framework and Design Thinking Framework
 * as the absolute source of truth.
 *
 * Rules:
 * 1. Validates all competency references against `COMPETENCIES`. Invalid IDs are rejected.
 * 2. Validates stage IDs against `WELEARN_DT_FRAMEWORK.phases`.
 * 3. Audits the alignment matrix between learning objectives, activities, evidence, and competencies.
 * 4. Distinguishes coach-approved content from AI suggestions.
 */

import { COMPETENCIES, COMPETENCY_DOMAINS, competencyById, domainById } from '../../pbl/content/competencies.js';
import { WELEARN_DT_FRAMEWORK } from '../../pbl/programs/libraryProgramsData.js';

export const VALID_STAGE_IDS = Object.freeze(WELEARN_DT_FRAMEWORK.phases.map((p) => p.id));

export const VALID_COHORTS = Object.freeze([
  { id: 'primary', label: 'Primary (ages 6–11)', ageBand: '6-11' },
  { id: 'lower-secondary', label: 'Lower Secondary (ages 12–14)', ageBand: '11-13' },
  { id: 'higher-secondary', label: 'Higher Secondary (ages 15–18)', ageBand: '14-18' }
]);

/**
 * Validates an array or set of competency IDs against the official framework.
 * Returns an array of any invalid IDs.
 */
export function findInvalidCompetencyIds(competencyIds = []) {
  const ids = Array.isArray(competencyIds) ? competencyIds : Array.from(competencyIds || []);
  return ids.filter((id) => !competencyById(id));
}

/**
 * Checks whether a single competency ID is valid in the official framework.
 */
export function isValidCompetencyId(id) {
  return Boolean(competencyById(id));
}

/**
 * Validates the course basics and structure.
 */
export function validateCourseBasics(course) {
  const errors = [];
  if (!course.title || typeof course.title !== 'string' || course.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Course title is required.' });
  } else if (course.title.trim().length > 120) {
    errors.push({ field: 'title', message: 'Course title cannot exceed 120 characters.' });
  }

  if (!course.cohort && !course.ageBand) {
    errors.push({ field: 'cohort', message: 'Learner age level or cohort is required.' });
  }

  const durationWeeks = Number(course.durationWeeks || course.duration);
  if (!durationWeeks || isNaN(durationWeeks) || durationWeeks < 1 || durationWeeks > 52) {
    errors.push({ field: 'durationWeeks', message: 'Duration must be between 1 and 52 weeks.' });
  }

  const objectives = Array.isArray(course.objectives)
    ? course.objectives.filter(Boolean)
    : (typeof course.objectives === 'string' ? course.objectives.split('\n').filter(Boolean) : []);

  if (objectives.length === 0) {
    errors.push({ field: 'objectives', message: 'At least one learning objective is required.' });
  }

  // Validate competencies
  const competencyIds = Array.isArray(course.competencies) ? course.competencies : [];
  if (competencyIds.length === 0) {
    errors.push({ field: 'competencies', message: 'Select at least one competency from the curriculum framework.' });
  } else {
    const invalid = findInvalidCompetencyIds(competencyIds);
    if (invalid.length > 0) {
      errors.push({
        field: 'competencies',
        message: `Invalid competency identifiers rejected by curriculum framework: ${invalid.join(', ')}`
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Comprehensive alignment check for publication readiness.
 * Builds an alignment matrix connecting objectives -> lessons -> evidence -> competencies.
 */
export function checkCurriculumAlignment(course) {
  const errors = [];
  const warnings = [];

  // 1. Course basics validation
  const basicsVal = validateCourseBasics(course);
  errors.push(...basicsVal.errors);

  const milestones = Array.isArray(course.milestones) ? course.milestones : [];
  if (milestones.length === 0) {
    errors.push({ field: 'milestones', message: 'Course outline must contain at least one module or milestone.' });
  }

  // 2. Validate stages against official DT Framework
  const usedStages = new Set();
  milestones.forEach((m, idx) => {
    const phaseId = m.phaseId || m.id;
    if (phaseId && !VALID_STAGE_IDS.includes(phaseId)) {
      warnings.push({
        index: idx,
        field: `milestones[${idx}].phaseId`,
        message: `Milestone "${m.title || idx + 1}" uses non-standard stage ID "${phaseId}". Expected one of: ${VALID_STAGE_IDS.join(', ')}.`
      });
    }
    if (phaseId) usedStages.add(phaseId);

    // Check invalid competencies within milestone
    const mCompetencies = m.targetCompetencies || m.competencies || [];
    const invalidMComp = findInvalidCompetencyIds(mCompetencies);
    if (invalidMComp.length > 0) {
      errors.push({
        index: idx,
        field: `milestones[${idx}].competencies`,
        message: `Milestone "${m.title}" references invalid competencies: ${invalidMComp.join(', ')}`
      });
    }

    // Check evidence prompt / requirement
    const hasEvidence = Boolean(m.evidencePrompt || (Array.isArray(m.deliverables) && m.deliverables.length > 0) || (Array.isArray(m.evidence) && m.evidence.length > 0));
    if (!hasEvidence) {
      warnings.push({
        index: idx,
        field: `milestones[${idx}].evidence`,
        message: `Milestone "${m.title || `Stage ${idx + 1}`}" lacks an evidence requirement or deliverable for learner assessment.`
      });
    }

    // Check activities
    const activities = m.activities || [];
    if (activities.length === 0) {
      warnings.push({
        index: idx,
        field: `milestones[${idx}].activities`,
        message: `Milestone "${m.title || `Stage ${idx + 1}`}" has no activities configured.`
      });
    }

    // Check unapproved AI suggestions
    if (m.isAiGenerated && !m.approvedByCoach) {
      warnings.push({
        index: idx,
        field: `milestones[${idx}].approval`,
        message: `Milestone "${m.title || `Stage ${idx + 1}`}" contains AI-generated content that requires coach review before publishing.`
      });
    }
  });

  // 3. Objectives coverage check
  const objectives = Array.isArray(course.objectives)
    ? course.objectives
    : (typeof course.objectives === 'string' ? course.objectives.split('\n').filter(Boolean) : []);

  const courseCompetencyIds = new Set(Array.isArray(course.competencies) ? course.competencies : []);
  const assessedCompetencyIds = new Set();
  milestones.forEach((m) => {
    (m.targetCompetencies || m.competencies || []).forEach((cId) => assessedCompetencyIds.add(cId));
  });

  const unassessedCompetencies = Array.from(courseCompetencyIds).filter((id) => !assessedCompetencyIds.has(id));
  if (unassessedCompetencies.length > 0) {
    const names = unassessedCompetencies.map((id) => {
      const c = competencyById(id);
      return c ? `${c.code || id} (${c.title})` : id;
    });
    warnings.push({
      field: 'competencies',
      message: `Competencies selected in Course Basics are not assessed in any lesson: ${names.join(', ')}.`
    });
  }

  // 4. Matrix Generation
  const matrix = objectives.map((obj, i) => {
    const text = typeof obj === 'string' ? obj : obj.title || obj.statement || `Objective ${i + 1}`;
    // Find matching milestones that reference or align with this objective
    const matchingMilestones = milestones.filter((m) => {
      if (m.objectiveIndex === i || (Array.isArray(m.alignedObjectiveIndices) && m.alignedObjectiveIndices.includes(i))) {
        return true;
      }
      // Heuristic text match or fallback link
      const combined = `${m.title} ${m.learningGoal || ''} ${(m.activities || []).join(' ')}`.toLowerCase();
      const keywords = text.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
      return keywords.some((kw) => combined.includes(kw));
    });

    return {
      objectiveIndex: i,
      objectiveText: text,
      matchedMilestones: matchingMilestones.map((m) => ({
        id: m.id,
        title: m.title,
        phaseId: m.phaseId,
        evidence: m.evidencePrompt || (m.deliverables && m.deliverables[0]) || 'None defined',
        competencies: (m.targetCompetencies || m.competencies || []).map((cId) => competencyById(cId)?.title || cId),
        approved: !m.isAiGenerated || m.approvedByCoach
      })),
      hasCoverage: matchingMilestones.length > 0
    };
  });

  const coveredObjectives = matrix.filter((row) => row.hasCoverage).length;
  const alignmentPercentage = objectives.length > 0 ? Math.round((coveredObjectives / objectives.length) * 100) : 0;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalObjectives: objectives.length,
      coveredObjectives,
      alignmentPercentage,
      totalCompetencies: courseCompetencyIds.size,
      assessedCompetencies: assessedCompetencyIds.size,
      totalMilestones: milestones.length,
      aiDraftMilestones: milestones.filter((m) => m.isAiGenerated && !m.approvedByCoach).length
    },
    matrix
  };
}
