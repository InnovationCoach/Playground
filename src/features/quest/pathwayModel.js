import { competencyById } from '../pbl/content/competencies.js';

export const FRAMEWORK_VERSION = 'welearn-source-2026-09-28';
export const PATHWAY_VERSION = 1;

// Only explicit coach decisions establish achievement. XP and task ticks are
// deliberately absent from this model. Prerequisites are authored, not inferred.
export function confirmedIds(decisions = []) {
  return new Set(decisions.filter(d => d.state === 'confirmed' && d.frameworkVersion === FRAMEWORK_VERSION && competencyById(d.competencyId)).map(d => d.competencyId));
}

export function recommendPathway({ lessons = [], achievements = [], goals = [] }) {
  const mastered = confirmedIds(achievements);
  const active = new Set(goals.filter(g => g.state === 'active' && g.source === 'competency-pathway').map(g => g.recommendationId));
  return lessons.flatMap(lesson => {
    const ids = lesson.competencyIds;
    const required = lesson.prerequisiteCompetencyIds || [];
    if (lesson.status !== 'published' || !Array.isArray(ids) || !ids.length || ids.some(id => !competencyById(id))) return [];
    if (!Array.isArray(required) || required.some(id => !competencyById(id) || !mastered.has(id))) return [];
    // Free-text prior knowledge cannot be evaluated as a competency rule.
    if (lesson.prerequisites?.trim() && !required.length) return [];
    const targetIds = [...new Set(ids)].filter(id => !mastered.has(id));
    if (!targetIds.length || targetIds.some(id => required.includes(id))) return [];
    if (targetIds.some(id => competencyById(id).level === 'advanced') && !required.length) return [];
    const criteria = (lesson.successCriteria || []).filter(c => typeof c === 'string' && c.trim());
    const steps = (lesson.steps || []).filter(s => s.title && s.instructions).map(s => ({ id: s.id, title: s.title, instructions: s.instructions }));
    if (!criteria.length || !steps.length || !lesson.outcome) return [];
    const id = `${lesson.offeringId}:${lesson.id}`;
    if (active.has(id)) return [];
    const basis = required.map(id => competencyById(id).title);
    return [{
      id, offeringId: lesson.offeringId, lessonId: lesson.id,
      lessonRevision: lesson.revision, title: lesson.title, goal: lesson.outcome,
      competencyIds: targetIds, competencies: targetIds.map(competencyById),
      prerequisiteCompetencyIds: required, steps, successCriteria: criteria,
      estimatedMinutes: lesson.estimatedMinutes || null,
      reason: basis.length ? `Your coach confirmed ${basis.join(', ')}. This lesson builds on those achievements.` : 'This is a foundational lesson with no recorded competency prerequisites. Choose it with your coach if it fits your interests.',
      basis: basis.length ? 'confirmed-prerequisites' : 'foundational',
      source: 'published-lesson-rules', pathwayVersion: PATHWAY_VERSION
    }];
  }).sort((a, b) => b.prerequisiteCompetencyIds.length - a.prerequisiteCompetencyIds.length || a.id.localeCompare(b.id)).slice(0, 3);
}
