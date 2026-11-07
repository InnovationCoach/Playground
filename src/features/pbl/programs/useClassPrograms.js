/**
 * Which programs the viewer's classes run: classes/{id}.programId, set by the
 * coach on the dashboard. Learners can read their own classes and coaches the
 * ones they teach, so the same hook serves both. It also carries each class's
 * program media and covers (programMedia.js).
 *
 * A class can run a program the static catalogue has never heard of (published
 * to pbl_programs from the Studio), so those are read from Firestore. Each
 * entry in `assigned` carries its resolved `program`; a class whose program
 * cannot be found is left out.
 */
import { useEffect, useState } from 'react';
import { loadClasses } from '../../coach/classCodes.js';
import { programById } from './catalog.js';
import { getProgram } from '../../../services/pblService.js';

export function useClassPrograms(classIds) {
  const key = (classIds || []).join('|');
  const [classes, setClasses] = useState([]);
  const [remote, setRemote] = useState({});

  useEffect(() => {
    if (!key) { setClasses([]); return undefined; }
    let cancelled = false;
    loadClasses(key.split('|')).then((list) => { if (!cancelled) setClasses(list); });
    return () => { cancelled = true; };
  }, [key]);

  const unresolved = [...new Set(classes.map((c) => c.programId).filter((id) => id && !programById(id)))].join('|');
  useEffect(() => {
    if (!unresolved) return undefined;
    let cancelled = false;
    Promise.all(unresolved.split('|').map((id) => getProgram(id).then((res) => [id, res.program]).catch(() => [id, null])))
      .then((found) => {
        if (!cancelled) setRemote((old) => ({ ...old, ...Object.fromEntries(found.filter(([, program]) => program)) }));
      });
    return () => { cancelled = true; };
  }, [unresolved]);

  const assigned = classes
    .map((c) => ({ ...c, program: c.programId ? programById(c.programId) || remote[c.programId] || null : null }))
    .filter((c) => c.program);
  /** programId -> class names running it */
  const byProgram = {};
  for (const c of assigned) (byProgram[c.programId] ||= []).push(c.name);
  /** Covers a coach set for the viewer's classes, in class order. */
  const classCovers = classes.map((c) => c.programCovers || {});
  const reload = () => (key ? loadClasses(key.split('|')).then(setClasses) : Promise.resolve());
  return { classes, assigned, byProgram, classCovers, reload };
}
