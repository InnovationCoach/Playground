/**
 * A learner's Hex-Grid project: their role, their city, a locked baseline and
 * the lab log of hypotheses they have tested.
 *
 * Same two-layer save as the other React activities (see useSolarCarBuild.js):
 * localStorage at once, Firestore users/{uid}/activityProgress/hex-grid a few
 * seconds later - coach-readable under the existing rules.
 *
 * Lab log entries are append-only from the UI. A result a learner did not like
 * is still a result; the log is their evidence portfolio.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, doc, getDoc, setDoc } from '../../../firebase.js';
import { normaliseCity, starterCity } from './hexGridModel.js';

const localKey = (uid) => `hearisland.hexGrid.v1:${uid || 'signed-out'}`;
const CLOUD_DEBOUNCE_MS = 2500;
const LOCAL_DEBOUNCE_MS = 300;

function emptyProject() {
  return {
    role: null,
    portfolioUrl: '',
    city: starterCity(),
    baseline: null, // { city, lockedAt }
    draft: { metric: '', expect: 'increase', predicted: '', because: '', idea: '' },
    guideSeen: false,
    experiments: [],
    updatedAt: null
  };
}

function hydrate(stored) {
  const base = emptyProject();
  if (!stored || typeof stored !== 'object') return base;
  return {
    ...base,
    ...stored,
    city: normaliseCity(stored.city),
    baseline: stored.baseline?.city ? { ...stored.baseline, city: normaliseCity(stored.baseline.city) } : null,
    draft: { ...base.draft, ...(stored.draft || {}) },
    experiments: Array.isArray(stored.experiments) ? stored.experiments : []
  };
}

/** Firestore rejects undefined; Infinity is shown as "no hub" etc, stored as null. */
function clean(value) {
  return JSON.parse(JSON.stringify(value, (_, v) => (typeof v === 'number' && !Number.isFinite(v) ? null : v)));
}

function readLocal(uid) {
  try {
    const raw = localStorage.getItem(localKey(uid));
    return raw ? hydrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeLocal(uid, project) {
  try { localStorage.setItem(localKey(uid), JSON.stringify(clean(project))); } catch { /* quota / private mode */ }
}

export function useHexGridProject(uid) {
  const [project, setProject] = useState(() => readLocal(uid) || emptyProject());
  const [syncState, setSyncState] = useState('idle');
  const localTimer = useRef(null);
  const cloudTimer = useRef(null);
  const loadedFor = useRef(null);

  useEffect(() => {
    if (!uid || loadedFor.current === uid) return;
    loadedFor.current = uid;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', `${uid}/activityProgress/hex-grid`));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        if (cancelled || !exists) return;
        const remote = hydrate(snap.data());
        const local = readLocal(uid);
        if (!local || (remote.updatedAt || 0) > (local.updatedAt || 0)) {
          setProject(remote);
          writeLocal(uid, remote);
        }
      } catch (err) {
        console.warn('[HexGrid] Could not load project:', err?.message);
        setSyncState('local-only');
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  useEffect(() => {
    if (!project.updatedAt) return undefined;
    clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => writeLocal(uid, project), LOCAL_DEBOUNCE_MS);
    if (!uid) return () => clearTimeout(localTimer.current);

    clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      setSyncState('saving');
      try {
        await setDoc(doc(db, 'users', `${uid}/activityProgress/hex-grid`), clean({ ...project, activityId: 'hex-grid' }));
        setSyncState('saved');
      } catch (err) {
        console.warn('[HexGrid] Cloud save failed, keeping local copy:', err?.message);
        setSyncState('local-only');
      }
    }, CLOUD_DEBOUNCE_MS);

    return () => {
      clearTimeout(localTimer.current);
      clearTimeout(cloudTimer.current);
    };
  }, [project, uid]);

  const update = useCallback((fn) => {
    setProject((p) => ({ ...fn(p), updatedAt: Date.now() }));
  }, []);

  return { project, update, syncState };
}
