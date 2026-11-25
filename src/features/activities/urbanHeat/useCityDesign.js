/**
 * Saved state for the Urban Heat city designer.
 *
 * Same two layers as the Solar Car build (useSolarCarBuild.js):
 *   localStorage - every change, so a refresh never costs a lesson's work.
 *   Firestore    - users/{uid}/activityProgress/urban-heat, debounced. That
 *                  path is already owner-writable and coach-readable under the
 *                  existing rules, so a coach can open a team's plans and pitch
 *                  without a new collection or a rules change.
 *
 * One project per district, so a learner who tries City Heart and then the
 * school does not lose either design.
 *
 * Firestore cannot hold an array directly inside an array. Grids are flat
 * arrays of tile letters, and plans are objects that contain a grid, so the
 * stored shape is arrays-in-maps-in-arrays, which Firestore accepts.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, doc, getDoc, setDoc } from '../../../firebase.js';
import { isValidGrid } from './urbanHeatModel.js';
import { scenarioById } from './urbanHeatScenarios.js';

export const DOC_ID = 'urban-heat';
export const MAX_PLANS = 3;
const localKey = (uid) => `hearisland.urbanHeat.v1:${uid || 'signed-out'}`;
const CLOUD_DEBOUNCE_MS = 2500;
const LOCAL_DEBOUNCE_MS = 400;

export function emptyProject(scenarioId) {
  const scenario = scenarioById(scenarioId);
  return {
    grid: scenario ? [...scenario.start] : [],
    prediction: { hotTiles: [], bestStrategy: '', strongerAt: '', locked: false },
    plans: [],
    finalPlanId: '',
    pitch: { claim: '', evidence: '', reasoning: '', tradeoff: '' }
  };
}

export function emptyState() {
  return { version: 1, scenarioId: '', cityName: '', stage: 'choose', projects: {}, updatedAt: null };
}

/** Merge stored data over defaults, dropping anything that no longer fits the model. */
export function hydrate(stored) {
  const base = emptyState();
  if (!stored || typeof stored !== 'object') return base;
  const projects = {};
  Object.entries(stored.projects || {}).forEach(([id, p]) => {
    if (!scenarioById(id) || !p || typeof p !== 'object') return;
    const fresh = emptyProject(id);
    projects[id] = {
      ...fresh,
      ...p,
      grid: isValidGrid(p.grid) ? p.grid : fresh.grid,
      prediction: { ...fresh.prediction, ...(p.prediction || {}) },
      plans: Array.isArray(p.plans) ? p.plans.filter((pl) => pl && isValidGrid(pl.grid)).slice(0, MAX_PLANS) : [],
      pitch: { ...fresh.pitch, ...(p.pitch || {}) }
    };
  });
  return {
    ...base,
    ...stored,
    scenarioId: scenarioById(stored.scenarioId) ? stored.scenarioId : '',
    projects
  };
}

function readLocal(uid) {
  try {
    const raw = localStorage.getItem(localKey(uid));
    return raw ? hydrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeLocal(uid, state) {
  try {
    localStorage.setItem(localKey(uid), JSON.stringify(state));
  } catch { /* private browsing or quota - the cloud copy still runs */ }
}

export function useCityDesign(uid) {
  const [state, setState] = useState(() => readLocal(uid) || emptyState());
  const [syncState, setSyncState] = useState('idle'); // idle | saving | saved | local-only
  const localTimer = useRef(null);
  const cloudTimer = useRef(null);
  const loadedFor = useRef(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (!uid || loadedFor.current === uid) return;
    loadedFor.current = uid;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', `${uid}/activityProgress/${DOC_ID}`));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        if (cancelled || !exists) return;
        const remote = hydrate(snap.data());
        const local = readLocal(uid);
        if (!local || (remote.updatedAt || 0) > (local.updatedAt || 0)) {
          setState(remote);
          writeLocal(uid, remote);
        }
      } catch (err) {
        console.warn('[UrbanHeat] Could not load saved design:', err?.message);
        setSyncState('local-only');
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  useEffect(() => {
    // Opening the activity must not write anything: only a learner's change does.
    if (!dirty.current) return undefined;
    clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => writeLocal(uid, state), LOCAL_DEBOUNCE_MS);
    if (!uid) return () => clearTimeout(localTimer.current);

    clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      setSyncState('saving');
      try {
        await setDoc(
          doc(db, 'users', `${uid}/activityProgress/${DOC_ID}`),
          { ...state, activityId: DOC_ID, updatedAt: Date.now() },
          { merge: true }
        );
        setSyncState('saved');
      } catch (err) {
        console.warn('[UrbanHeat] Cloud save failed, keeping local copy:', err?.message);
        setSyncState('local-only');
      }
    }, CLOUD_DEBOUNCE_MS);

    return () => {
      clearTimeout(localTimer.current);
      clearTimeout(cloudTimer.current);
    };
  }, [state, uid]);

  const update = useCallback((fn) => {
    dirty.current = true;
    setState((s) => ({ ...fn(s), updatedAt: Date.now() }));
  }, []);

  const set = useCallback((changes) => update((s) => ({ ...s, ...changes })), [update]);

  /** Choose a district; an existing project for it is kept, not reset. */
  const chooseScenario = useCallback((scenarioId) => update((s) => ({
    ...s,
    scenarioId,
    stage: 'predict',
    projects: { ...s.projects, [scenarioId]: s.projects[scenarioId] || emptyProject(scenarioId) }
  })), [update]);

  /** Patch the current district's project. */
  const patchProject = useCallback((changes) => update((s) => {
    if (!s.scenarioId) return s;
    const current = s.projects[s.scenarioId] || emptyProject(s.scenarioId);
    const next = typeof changes === 'function' ? changes(current) : { ...current, ...changes };
    return { ...s, projects: { ...s.projects, [s.scenarioId]: next } };
  }), [update]);

  const resetProject = useCallback(() => update((s) => (
    s.scenarioId ? { ...s, projects: { ...s.projects, [s.scenarioId]: emptyProject(s.scenarioId) }, stage: 'predict' } : s
  )), [update]);

  const project = state.scenarioId ? (state.projects[state.scenarioId] || emptyProject(state.scenarioId)) : null;

  return { state, project, set, chooseScenario, patchProject, resetProject, syncState };
}
