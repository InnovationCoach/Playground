/**
 * Load and save a learner's term project.
 *
 * Same two-layer save as the other React activities: localStorage at once,
 * Firestore a few seconds later, and a failed cloud save degrades to "saved on
 * this device". The newer copy (by updatedAt) wins on load.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, doc, getDoc, setDoc } from '../../../firebase.js';
import { hydrateProject } from './pblProject.js';

const CLOUD_DEBOUNCE_MS = 2500;
const LOCAL_DEBOUNCE_MS = 300;
const localKey = (uid, termId) => `hearisland.pbl.v1:${uid || 'signed-out'}:${termId}`;

function readLocal(uid, termId) {
  try {
    const raw = localStorage.getItem(localKey(uid, termId));
    return raw ? hydrateProject(JSON.parse(raw), termId) : null;
  } catch {
    return null;
  }
}

export function usePblProject(uid, termId) {
  const [project, setProject] = useState(() => readLocal(uid, termId) || hydrateProject(null, termId));
  const [syncState, setSyncState] = useState('idle');
  const localTimer = useRef(null);
  const cloudTimer = useRef(null);
  const docPath = `${uid}/activityProgress/pbl-${termId}`;

  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', docPath));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        if (cancelled || !exists) return;
        const remote = hydrateProject(snap.data(), termId);
        const local = readLocal(uid, termId);
        if (!local || (remote.updatedAt || 0) > (local.updatedAt || 0)) setProject(remote);
      } catch (err) {
        console.warn('[PBL] Could not load project:', err?.message);
        setSyncState('local-only');
      }
    })();
    return () => { cancelled = true; };
  }, [uid, termId, docPath]);

  useEffect(() => {
    if (!project.updatedAt) return undefined;
    clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      try { localStorage.setItem(localKey(uid, termId), JSON.stringify(project)); } catch { /* quota */ }
    }, LOCAL_DEBOUNCE_MS);
    if (!uid) return () => clearTimeout(localTimer.current);

    clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      setSyncState('saving');
      try {
        await setDoc(doc(db, 'users', docPath), { ...project, activityId: `pbl-${termId}` });
        setSyncState('saved');
      } catch (err) {
        console.warn('[PBL] Cloud save failed, keeping local copy:', err?.message);
        setSyncState('local-only');
      }
    }, CLOUD_DEBOUNCE_MS);
    return () => {
      clearTimeout(localTimer.current);
      clearTimeout(cloudTimer.current);
    };
  }, [project, uid, termId, docPath]);

  /** Apply a pure update: `fn(project) => project`. */
  const apply = useCallback((fn) => setProject((p) => fn(p)), []);

  return { project, apply, syncState };
}
