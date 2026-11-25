import { cohortForGrade } from '../../../utils/schoolCohorts.js';

/** Cohort choices in the coach dashboard's class filter, with their labels. */
export const COHORT_OPTIONS = [
  ['cohort:cohort-wpr', 'WPR · Grade 1–5'],
  ['cohort:cohort-wls', 'WLS · Grade 6–8'],
  ['cohort:cohort-whs', 'WHS · Grade 9–12']
];
export const COHORT_SCOPES = COHORT_OPTIONS.map(([value]) => value);

const gradeFrom = value => {
  const n = Number(String(value ?? '').match(/\d+/)?.[0]);
  return Number.isFinite(n) ? n : null;
};

/**
 * Which cohort a learner belongs to: 'cohort-wpr' (Primary, grades 1–5),
 * 'cohort-wls' (Lower Secondary, grades 6–8), 'cohort-whs' (Higher Secondary,
 * grades 9–12) or null when nothing says.
 * Older accounts lack cohortId, so fall back to the legacy cohort field, the
 * group name ("WLS Lower Secondary"), then the grade. yearLevel is skipped:
 * it mixes UK years and US grades ("Year 9" is grade 8).
 */
export function learnerCohortId(learner) {
  if (!learner) return null;
  const id = String(learner.cohortId || '').toLowerCase();
  if (id === 'cohort-wpr' || id === 'wpr') return 'cohort-wpr';
  if (id === 'cohort-wls' || id === 'wls') return 'cohort-wls';
  if (id === 'cohort-whs' || id === 'whs') return 'cohort-whs';
  const label = `${learner.cohort || ''} ${learner.groupName || ''}`.toLowerCase();
  if (/\bwhs\b|higher[\s-]secondary/.test(label)) return 'cohort-whs';
  if (/\bwls\b|lower[\s-]secondary/.test(label)) return 'cohort-wls';
  // Only the full name: a bare "WPR" also appears in the school's name.
  if (/welearn primary/.test(label)) return 'cohort-wpr';
  return cohortForGrade(gradeFrom(learner.gradeLevel ?? learner.grade))?.cohortId || null;
}
