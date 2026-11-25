// Cohort boundaries are inclusive at the start and exclusive at the end.
// Programme cohorts by US grade: WPR = Grade 1–5, WLS = Grade 6–8, WHS = Grade 9–12.
// WPR (WeLearn Primary) is placed by grade only, so it has no age range and
// cohortForAge keeps using the age-based primary cohorts (Junior Explorers, 6–11).
// Ages are approximate: grade is the source of truth for secondary placement.
// Learning ageBand values remain compatible with the existing learning tools.
export const SCHOOL_COHORTS = [
  { cohortId: 'cohort-wpr', code: 'WPR', name: { en: 'WeLearn Primary' }, grades: [1, 5], ageBands: ['primary'], status: 'active' },
  { cohortId: 'cohort-lower-primary', code: 'LPRI', name: { en: 'Lower Primary', zh: '小学低年级', th: 'ประถมต้น' }, minAge: 6, maxAgeExclusive: 9, ageBands: ['primary'], status: 'active' },
  { cohortId: 'cohort-higher-primary', code: 'HPRI', name: { en: 'Higher Primary', zh: '小学高年级', th: 'ประถมปลาย' }, minAge: 9, maxAgeExclusive: 11, ageBands: ['primary'], status: 'active' },
  { cohortId: 'cohort-wls', code: 'WLS', name: { en: 'WeLearn Lower Secondary' }, grades: [6, 8], minAge: 11, maxAgeExclusive: 15, ageBands: ['13-15'], status: 'active' },
  { cohortId: 'cohort-whs', code: 'WHS', name: { en: 'WeLearn Higher Secondary' }, grades: [9, 12], minAge: 15, maxAgeExclusive: 19, ageBands: ['13-15', '16-18'], status: 'active' }
];

export function cohortForAge(age) {
  if (!Number.isFinite(age)) return null;
  return SCHOOL_COHORTS.find(c => age >= c.minAge && age < c.maxAgeExclusive) || null;
}

/** Programme cohort for a US grade: 1–5 WPR, 6–8 WLS, 9–12 WHS; null otherwise. */
export function cohortForGrade(grade) {
  const g = typeof grade === 'string' ? Number(grade.trim()) : Number(grade);
  if (!Number.isInteger(g)) return null;
  return SCHOOL_COHORTS.find(c => c.grades && g >= c.grades[0] && g <= c.grades[1]) || null;
}
