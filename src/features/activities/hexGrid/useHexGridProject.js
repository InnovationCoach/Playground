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

export const DEFAULT_PROJECT_ID = 'hex-grid';
/**
 * Where a project lives. The default project keeps its original keys; a scenario
 * project (e.g. My Universe's Thalassa station) gets its own, so the two never mix.
 */
export function projectStorage(projectId = DEFAULT_PROJECT_ID, uid) {
  const who = uid || 'signed-out';
  const local = projectId === DEFAULT_PROJECT_ID ? `hearisland.hexGrid.v1:${who}` : `hearisland.hexGrid.v1:${projectId}:${who}`;
  return { local, cloudPath: `${uid}/activityProgress/${projectId}`, activityId: projectId };
}
const CLOUD_DEBOUNCE_MS = 2500;
const LOCAL_DEBOUNCE_MS = 300;

function emptyProject(seedCity) {
  return {
    role: null,
    portfolioUrl: '',
    city: seedCity || starterCity(),
    baseline: null, // { city, lockedAt }
    draft: { metric: '', expect: 'increase', predicted: '', because: '', idea: '' },
    guideSeen: false,
    experiments: [],
    updatedAt: null
  };
}

function hydrate(stored, seedCity) {
  const base = emptyProject(seedCity);
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

function readLocal(key, seedCity) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? hydrate(JSON.parse(raw), seedCity) : null;
  } catch {
    return null;
  }
}

function writeLocal(key, project) {
  try { localStorage.setItem(key, JSON.stringify(clean(project))); } catch { /* quota / private mode */ }
}

/** `projectId` and `seedCity` are only set by scenarios; the default project behaves exactly as before. */
export function useHexGridProject(uid, { projectId = DEFAULT_PROJECT_ID, seedCity = null } = {}) {
  const store = projectStorage(projectId, uid);
  const [project, setProject] = useState(() => readLocal(store.local, seedCity) || emptyProject(seedCity));
  const [syncState, setSyncState] = useState('idle');
  const localTimer = useRef(null);
  const cloudTimer = useRef(null);
  const loadedFor = useRef(null);

  useEffect(() => {
    if (!uid || loadedFor.current === store.cloudPath) return;
    loadedFor.current = store.cloudPath;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', store.cloudPath));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        if (cancelled || !exists) return;
        const remote = hydrate(snap.data(), seedCity);
        const local = readLocal(store.local, seedCity);
        if (!local || (remote.updatedAt || 0) > (local.updatedAt || 0)) {
          setProject(remote);
          writeLocal(store.local, remote);
        }
      } catch (err) {
        console.warn('[HexGrid] Could not load project:', err?.message);
        setSyncState('local-only');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, store.cloudPath]);

  useEffect(() => {
    if (!project.updatedAt) return undefined;
    clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => writeLocal(store.local, project), LOCAL_DEBOUNCE_MS);
    if (!uid) return () => clearTimeout(localTimer.current);

    clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      setSyncState('saving');
      try {
        await setDoc(doc(db, 'users', store.cloudPath), clean({ ...project, activityId: store.activityId }));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, uid, store.cloudPath]);

  const update = useCallback((fn) => {
    setProject((p) => ({ ...fn(p), updatedAt: Date.now() }));
  }, []);

  return { project, update, syncState };
}
