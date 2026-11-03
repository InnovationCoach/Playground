// Cohort boundaries are inclusive at the start and exclusive at the end.
// Learning ageBand values remain compatible with the existing learning tools.
export const SCHOOL_COHORTS = [
  { cohortId: 'cohort-lower-primary', code: 'LPRI', name: { en: 'Lower Primary', zh: '小学低年级', th: 'ประถมต้น' }, minAge: 6, maxAgeExclusive: 9, ageBands: ['primary'], status: 'active' },
  { cohortId: 'cohort-higher-primary', code: 'HPRI', name: { en: 'Higher Primary', zh: '小学高年级', th: 'ประถมปลาย' }, minAge: 9, maxAgeExclusive: 11, ageBands: ['primary'], status: 'active' },
  { cohortId: 'cohort-lower-secondary', code: 'LSEC', name: { en: 'Lower Secondary', zh: '初中', th: 'มัธยมต้น' }, minAge: 11, maxAgeExclusive: 15, ageBands: ['13-15'], status: 'active' },
  { cohortId: 'cohort-higher-secondary', code: 'HSEC', name: { en: 'Higher Secondary', zh: '高中', th: 'มัธยมปลาย' }, minAge: 15, maxAgeExclusive: 19, ageBands: ['13-15', '16-18'], status: 'active' }
];

export function cohortForAge(age) {
  if (!Number.isFinite(age)) return null;
  return SCHOOL_COHORTS.find(c => age >= c.minAge && age < c.maxAgeExclusive) || null;
}
