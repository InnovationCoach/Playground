/**
 * Which programs the viewer's classes run: classes/{id}.programId, set by the
 * coach on the dashboard. Learners can read their own classes and coaches the
 * ones they teach, so the same hook serves both.
 */
import { useEffect, useState } from 'react';
import { loadClasses } from '../../coach/classCodes.js';
import { programById } from './catalog.js';

export function useClassPrograms(classIds) {
  const key = (classIds || []).join('|');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (!key) { setClasses([]); return undefined; }
    let cancelled = false;
    loadClasses(key.split('|')).then((list) => { if (!cancelled) setClasses(list); });
    return () => { cancelled = true; };
  }, [key]);

  const assigned = classes.filter((c) => c.programId && programById(c.programId));
  /** programId -> class names running it */
  const byProgram = {};
  for (const c of assigned) (byProgram[c.programId] ||= []).push(c.name);
  return { assigned, byProgram };
}
