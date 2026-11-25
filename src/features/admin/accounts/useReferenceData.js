import { useEffect, useState } from 'react';
import { listSchools, listCohorts, listProgrammes, listClasses } from '../../../services/api/endpoints.js';

let cache = null;

function sanitizeCohorts(items) {
  if (!Array.isArray(items)) return [];
  const active = items.filter((c) => {
    if (c.hidden || c.status === 'hidden' || c.status === 'inactive') return false;
    const code = (c.code || '').toUpperCase();
    const id = (c.cohortId || '').toLowerCase();
    // The age-based primary cohorts are retired; WeLearn Primary (WPR, Grades 1–5) replaces them.
    if (code === 'LPRI' || code === 'HPRI' || id.includes('primary')) return false;
    return true;
  });

  return active.map((c) => {
    const code = (c.code || (c.cohortId === 'cohort-whs' ? 'WHS' : c.cohortId === 'cohort-wls' ? 'WLS' : c.cohortId === 'cohort-wpr' ? 'WPR' : '')).toUpperCase();
    const isPrimary = code === 'WPR';
    const defaultName = code === 'WHS' ? 'WeLearn Higher Secondary' : isPrimary ? 'WeLearn Primary' : 'WeLearn Lower Secondary';
    const defaultBands = isPrimary ? ['primary'] : code === 'WLS' ? ['13-15'] : ['13-15', '16-18'];
    const bands = Array.isArray(c.ageBands) && c.ageBands.length ? c.ageBands.filter((b) => isPrimary ? b === 'primary' : b !== 'primary') : [];
    return {
      ...c,
      code,
      name: typeof c.name === 'string' ? { en: c.name } : (c.name || { en: defaultName }),
      ageBands: bands.length ? bands : defaultBands
    };
  });
}

/**
 * Schools, cohorts, programmes and classes, for labels and form options.
 * Loaded once per session; they change rarely and every screen needs them.
 * A failure is not cached, so the next screen tries again.
 */
export function useReferenceData() {
  const [state, setState] = useState(() => (cache ? { loading: false, error: null, ...cache } : { loading: true, error: null, schools: [], cohorts: [], programmes: [], classes: [] }));

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    Promise.all([listSchools(), listCohorts(), listProgrammes(), listClasses()])
      .then(([s, c, p, k]) => {
        cache = { schools: s?.items || [], cohorts: sanitizeCohorts(c?.items), programmes: p?.items || [], classes: k?.items || [] };
        if (!cancelled) setState({ loading: false, error: null, ...cache });
      })
      .catch((error) => { if (!cancelled) setState((st) => ({ ...st, loading: false, error })); });
    return () => { cancelled = true; };
  }, []);

  return state;
}

/** `{en, zh, th}` name objects fall back to English. */
export const localName = (name, locale) => (typeof name === 'string' ? name : name?.[locale] || name?.en || '');

export function clearReferenceCache() { cache = null; }
