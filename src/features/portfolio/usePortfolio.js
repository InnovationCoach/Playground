/**
 * Load and save a learner's portfolio for one program.
 *
 * Same two-layer save as useProgramProgress: localStorage at once, Firestore a
 * few seconds later, and a failed cloud save degrades to "saved on this
 * device". The newer copy (by updatedAt) wins on load.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, doc, getDoc, setDoc, storage } from '../../firebase.js';
import { hydratePortfolio, portfolioDocId, imagePath } from './portfolioModel.js';

const CLOUD_DEBOUNCE_MS = 2000;
const localKey = (uid, programId) => `welearn.portfolio.v1:${uid || 'signed-out'}:${programId}`;

function readLocal(uid, program) {
  try {
    const raw = localStorage.getItem(localKey(uid, program.id));
    return raw ? hydratePortfolio(JSON.parse(raw), program) : null;
  } catch {
    return null;
  }
}

export function usePortfolio(uid, program) {
  const programId = program.id;
  const [portfolio, setPortfolio] = useState(() => readLocal(uid, program) || hydratePortfolio(null, program));
  const [syncState, setSyncState] = useState('idle');
  const cloudTimer = useRef(null);
  const docPath = `${uid}/activityProgress/${portfolioDocId(programId)}`;

  useEffect(() => {
    setPortfolio(readLocal(uid, program) || hydratePortfolio(null, program));
    setSyncState('idle');
    if (!uid) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', docPath));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        if (cancelled || !exists) return;
        const remote = hydratePortfolio(snap.data(), program);
        const local = readLocal(uid, program);
        if (!local || (remote.updatedAt || 0) > (local.updatedAt || 0)) setPortfolio(remote);
      } catch (err) {
        console.warn('[Portfolio] Could not load portfolio:', err?.message);
        if (!cancelled) setSyncState('local-only');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, docPath]);

  useEffect(() => {
    if (!portfolio.updatedAt || portfolio.programId !== programId) return undefined;
    try { localStorage.setItem(localKey(uid, programId), JSON.stringify(portfolio)); } catch { /* quota */ }
    if (!uid) return undefined;
    clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      setSyncState('saving');
      try {
        await setDoc(doc(db, 'users', docPath), { ...portfolio, activityId: portfolioDocId(programId) });
        setSyncState('saved');
      } catch (err) {
        console.warn('[Portfolio] Cloud save failed, keeping local copy:', err?.message);
        setSyncState('local-only');
      }
    }, CLOUD_DEBOUNCE_MS);
    return () => clearTimeout(cloudTimer.current);
  }, [portfolio, uid, programId, docPath]);

  /** Apply a pure update: `fn(portfolio) => portfolio`. */
  const apply = useCallback((fn) => setPortfolio((p) => fn(p)), []);
  return { portfolio, apply, syncState };
}

/** Upload one checked image to portfolio/{uid}/{programId}/ and return { url, path, name }. */
export function uploadPortfolioImage(uid, programId, file, onProgress) {
  if (!uid || !storage?.ref) return Promise.reject(new Error('Image upload is unavailable right now.'));
  const path = imagePath(uid, programId, file.name);
  return new Promise((resolve, reject) => {
    const ref = storage.ref(path);
    const task = ref.put(file, { contentType: file.type });
    task.on('state_changed',
      (s) => onProgress?.(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0),
      reject,
      async () => { try { resolve({ url: await ref.getDownloadURL(), path, name: file.name }); } catch (e) { reject(e); } });
  });
}

/** Best-effort removal of an entry's images; the entry is already gone from the page. */
export function deletePortfolioImages(images = []) {
  if (!storage?.ref) return;
  for (const img of images) if (img.path) storage.ref(img.path).delete().catch(() => {});
}
