import { useEffect, useState } from 'react';
import { listSchools, listCohorts, listProgrammes, listClasses } from '../../../services/api/endpoints.js';

let cache = null;

const FALLBACK_SCHOOLS = [
  { schoolId: 'school-wpr', name: 'WPR International School' },
  { schoolId: 'sch-w2e', name: 'W2E Campus' },
  { schoolId: 'sch-wpr', name: 'WPR International School' }
];

const FALLBACK_COHORTS = [
  { cohortId: 'cohort-wpr', code: 'WPR', name: { en: 'WPR (international, primary)', zh: 'WPR（国际，小学）', th: 'WPR (นานาชาติ ประถม)' }, ageBands: ['primary'] },
  { cohortId: 'cohort-wls', code: 'WLS', name: { en: 'WLS (Lower Secondary, 13–15)', zh: 'WLS（初中，13–15岁）', th: 'WLS (มัธยมต้น 13–15 ปี)' }, ageBands: ['13-15'] },
  { cohortId: 'cohort-whs', code: 'WHS', name: { en: 'WHS (Higher Secondary, 16–18)', zh: 'WHS（高中，16–18岁）', th: 'WHS (มัธยมปลาย 16–18 ปี)' }, ageBands: ['16-18'] },
  { cohortId: 'cohort-w2e', code: 'W2E', name: { en: 'W2E (twice-exceptional, secondary)', zh: 'W2E（双重特殊，中学）', th: 'W2E (ผู้เรียนอัจฉริยภาพสองด้าน มัธยม)' }, ageBands: ['13-15', '16-18'] }
];

/**
 * Schools, cohorts, programmes and classes, for labels and form options.
 * Loaded once per session; they change rarely and every screen needs them.
 * A failure is not cached, so the next screen tries again.
 */
export function useReferenceData() {
  const [state, setState] = useState(() => (cache ? { loading: false, error: null, ...cache } : { loading: true, error: null, schools: FALLBACK_SCHOOLS, cohorts: FALLBACK_COHORTS, programmes: [], classes: [] }));

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    Promise.all([listSchools(), listCohorts(), listProgrammes(), listClasses()])
      .then(([s, c, p, k]) => {
        const schools = s?.items?.length ? s.items : FALLBACK_SCHOOLS;
        const cohorts = c?.items?.length ? c.items : FALLBACK_COHORTS;
        cache = { schools, cohorts, programmes: p?.items || [], classes: k?.items || [] };
        if (!cancelled) setState({ loading: false, error: null, ...cache });
      })
      .catch((error) => {
        if (!cancelled) setState((st) => ({ ...st, loading: false, error, schools: FALLBACK_SCHOOLS, cohorts: FALLBACK_COHORTS }));
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}

/** `{en, zh, th}` name objects fall back to English. */
export const localName = (name, locale) => (typeof name === 'string' ? name : name?.[locale] || name?.en || '');

export function clearReferenceCache() { cache = null; }
