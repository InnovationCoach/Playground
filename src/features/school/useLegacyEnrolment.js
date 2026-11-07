import { useEffect, useState } from 'react';
import { hasSavedProject } from '../pbl/engine/usePblProject.js';

/**
 * Whether a learner counts as enrolled in a program through a portfolio saved
 * under its old term id. Programs without a legacy term never ask. If the read
 * fails the learner is treated as not enrolled, which leaves the class-code
 * form usable.
 */
export function useLegacyEnrolment(uid, termId) {
  const key = uid && termId ? `${uid}:${termId}` : null;
  const [state, setState] = useState({ key: null, enrolled: false });

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    hasSavedProject(uid, termId).catch((err) => {
      console.warn('[School] Could not read saved project:', err?.message);
      return false;
    }).then((enrolled) => { if (!cancelled) setState({ key, enrolled }); });
    return () => { cancelled = true; };
  }, [key, uid, termId]);

  if (!key) return { loading: false, enrolled: false };
  return state.key === key ? { loading: false, enrolled: state.enrolled } : { loading: true, enrolled: false };
}
