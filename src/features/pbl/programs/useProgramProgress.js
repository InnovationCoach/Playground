/**
 * Load and save a learner's progress in one program.
 *
 * Same two-layer save as usePblProject: localStorage at once, Firestore a few
 * seconds later, and a failed cloud save degrades to "saved on this device".
 * The newer copy (by updatedAt) wins on load.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, doc, getDoc, setDoc } from '../../../firebase.js';
import { hydrateProgress, progressDocId } from './progress.js';

const CLOUD_DEBOUNCE_MS = 2500;
const LOCAL_DEBOUNCE_MS = 300;
const localKey = (uid, programId) => `hearisland.pblProgram.v1:${uid || 'signed-out'}:${programId}`;

export function readLocalProgress(uid, program) {
  try {
    const raw = localStorage.getItem(localKey(uid, program.id));
    return raw ? hydrateProgress(JSON.parse(raw), program) : null;
  } catch {
    return null;
  }
}

export function useProgramProgress(uid, program) {
  const programId = program.id;
  const [progress, setProgress] = useState(() => readLocalProgress(uid, program) || hydrateProgress(null, program));
  const [syncState, setSyncState] = useState('idle');
  const localTimer = useRef(null);
  const cloudTimer = useRef(null);
  const docPath = `${uid}/activityProgress/${progressDocId(programId)}`;

  // Switching programs must not show the previous program's progress.
  useEffect(() => {
    setProgress(readLocalProgress(uid, program) || hydrateProgress(null, program));
    setSyncState('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, programId]);

  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', docPath));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        if (cancelled || !exists) return;
        const remote = hydrateProgress(snap.data(), program);
        const local = readLocalProgress(uid, program);
        if (!local || (remote.updatedAt || 0) > (local.updatedAt || 0)) setProgress(remote);
      } catch (err) {
        console.warn('[PBL] Could not load program progress:', err?.message);
        setSyncState('local-only');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, docPath]);

  useEffect(() => {
    if (!progress.updatedAt || progress.programId !== programId) return undefined;
    clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      try { localStorage.setItem(localKey(uid, programId), JSON.stringify(progress)); } catch { /* quota */ }
    }, LOCAL_DEBOUNCE_MS);
    if (!uid) return () => clearTimeout(localTimer.current);

    clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      setSyncState('saving');
      try {
        await setDoc(doc(db, 'users', docPath), { ...progress, activityId: progressDocId(programId) });
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
  }, [progress, uid, programId, docPath]);

  /** Apply a pure update: `fn(progress) => progress`. */
  const apply = useCallback((fn) => setProgress((p) => fn(p)), []);

  return { progress, apply, syncState };
}
