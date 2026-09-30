import { useEffect, useState } from 'react';
import { listSchools, listCohorts, listProgrammes, listClasses } from '../../../services/api/endpoints.js';

let cache = null;

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
        cache = { schools: s.items, cohorts: c.items, programmes: p.items, classes: k.items };
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
