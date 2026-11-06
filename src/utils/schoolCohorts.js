// Cohort boundaries are inclusive at the start and exclusive at the end.
// Primary cohorts (Junior Explorers, ages 6–11) are unchanged.
// Secondary programme cohorts, by US grade: WLS = Grade 6–8, WHS = Grade 9–12.
// Ages are approximate: grade is the source of truth for secondary placement.
// Learning ageBand values remain compatible with the existing learning tools.
export const SCHOOL_COHORTS = [
  { cohortId: 'cohort-lower-primary', code: 'LPRI', name: { en: 'Lower Primary', zh: '小学低年级', th: 'ประถมต้น' }, minAge: 6, maxAgeExclusive: 9, ageBands: ['primary'], status: 'active' },
  { cohortId: 'cohort-higher-primary', code: 'HPRI', name: { en: 'Higher Primary', zh: '小学高年级', th: 'ประถมปลาย' }, minAge: 9, maxAgeExclusive: 11, ageBands: ['primary'], status: 'active' },
  { cohortId: 'cohort-wls', code: 'WLS', name: { en: 'WeLearn Lower Secondary' }, grades: [6, 8], minAge: 11, maxAgeExclusive: 15, ageBands: ['13-15'], status: 'active' },
  { cohortId: 'cohort-whs', code: 'WHS', name: { en: 'WeLearn Higher Secondary' }, grades: [9, 12], minAge: 15, maxAgeExclusive: 19, ageBands: ['13-15', '16-18'], status: 'active' }
];

export function cohortForAge(age) {
  if (!Number.isFinite(age)) return null;
  return SCHOOL_COHORTS.find(c => age >= c.minAge && age < c.maxAgeExclusive) || null;
}
