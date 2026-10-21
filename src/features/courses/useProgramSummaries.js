/**
 * Read-only progress for every PBL program, for the My Courses dashboard.
 *
 * Same sources as useProgramProgress: the device copy first, then the cloud
 * copy (users/{uid}/activityProgress/pbl-program-<id>), newer updatedAt wins.
 * It never writes; editing stays in the program pages.
 */
import { useEffect, useState } from 'react';
import { db, doc, getDoc } from '../../firebase.js';
import { hydrateProgress, progressDocId, programProgress } from '../pbl/programs/progress.js';
import { readLocalProgress } from '../pbl/programs/useProgramProgress.js';

const summarise = (programs, pick) => Object.fromEntries(programs.map((p) => {
  const progress = pick(p);
  return [p.id, progress ? { startedAt: progress.startedAt, updatedAt: progress.updatedAt, ...programProgress(progress, p) } : null];
}));

export function useProgramSummaries(uid, programs, enabled = true) {
  const [byId, setById] = useState(() => (enabled ? summarise(programs, (p) => readLocalProgress(uid, p)) : {}));

  useEffect(() => {
    if (!enabled) { setById({}); return undefined; }
    const local = Object.fromEntries(programs.map((p) => [p.id, readLocalProgress(uid, p)]));
    setById(summarise(programs, (p) => local[p.id]));
    if (!uid) return undefined;

    let cancelled = false;
    Promise.all(programs.map(async (p) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid, 'activityProgress', progressDocId(p.id)));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        return exists ? hydrateProgress(snap.data(), p) : null;
      } catch {
        return null; // offline or not allowed: the device copy stands
      }
    })).then((remote) => {
      if (cancelled) return;
      setById(summarise(programs, (p) => {
        const r = remote[programs.indexOf(p)];
        const l = local[p.id];
        return r && (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) ? r : l;
      }));
    });
    return () => { cancelled = true; };
    // programs is a module constant; re-run only when the learner changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, enabled]);

  return byId;
}
