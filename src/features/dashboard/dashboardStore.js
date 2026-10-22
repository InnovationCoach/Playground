/**
 * Reads and saves for My Dashboard. The rules live in dashboardModel.js; this
 * file only moves data in and out of storage.
 *
 * Preferences use the same two-layer save as the PBL project: localStorage at
 * once, the learner's own users/{uid}/activityProgress document a few seconds
 * later, and a failed cloud save leaves the local copy in place. The newer copy
 * (by updatedAt) wins on load, so a change made on another device is picked up.
 * The page only reads the PBL cloud copy; PBL Studio remains its writer.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, doc, getDoc, setDoc } from '../../firebase.js';
import { STORAGE_KEYS, CLOUD_PREFS_PATH, CLOUD_PBL_PATH, hydratePrefs, recordVisit } from './dashboardModel.js';
import { hydrateProject } from '../pbl/engine/pblProject.js';
import { TERM } from '../pbl/content/pblModel.js';

const CLOUD_DEBOUNCE_MS = 2500;

/** localStorage, or an empty stand-in where the browser refuses access to it. */
export function deviceStorage() {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {} };
  }
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Private mode or a full quota: the page still works, nothing is kept on this device.
    return false;
  }
}

/** Note today's visit on this device and return the updated visit list. */
export function logVisit(uid, day) {
  const stored = readJson(STORAGE_KEYS.visits(uid));
  const visits = recordVisit(Array.isArray(stored) ? stored : [], day);
  writeJson(STORAGE_KEYS.visits(uid), visits);
  return visits;
}

export function saveMood(uid, mood, day) {
  writeJson(STORAGE_KEYS.mood(uid), { day, mood });
}

/** Learner preferences, saved on this device and to the learner's account. */
export function useDashboardPrefs(uid) {
  const [prefs, setPrefs] = useState(() => hydratePrefs(readJson(STORAGE_KEYS.prefs(uid))));
  const [syncState, setSyncState] = useState('idle'); // idle | saving | saved | local-only
  const edited = useRef(false);
  const cloudTimer = useRef(null);

  // Adopt the cloud copy only when it was saved after this device's copy.
  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', CLOUD_PREFS_PATH(uid)));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        if (cancelled || !exists) return;
        const remote = hydratePrefs(snap.data());
        setPrefs((local) => (remote.updatedAt > local.updatedAt ? remote : local));
        setSyncState('saved');
      } catch (err) {
        console.warn('[Dashboard] Could not load preferences:', err?.message);
        setSyncState('local-only');
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  useEffect(() => {
    if (!edited.current) return undefined;
    writeJson(STORAGE_KEYS.prefs(uid), prefs);
    if (!uid) return undefined;
    clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      setSyncState('saving');
      try {
        await setDoc(doc(db, 'users', CLOUD_PREFS_PATH(uid)), { ...prefs, activityId: 'dashboard-prefs' });
        setSyncState('saved');
      } catch (err) {
        console.warn('[Dashboard] Cloud save failed, keeping this device copy:', err?.message);
        setSyncState('local-only');
      }
    }, CLOUD_DEBOUNCE_MS);
    return () => clearTimeout(cloudTimer.current);
  }, [prefs, uid]);

  /** Apply a pure update: `fn(prefs) => prefs`. Stamps updatedAt so the newer copy wins. */
  const update = useCallback((fn) => {
    edited.current = true;
    setPrefs((p) => ({ ...fn(p), updatedAt: Date.now() }));
  }, []);

  return { prefs, update, syncState };
}

/** The learner's term project as saved to their account, read once, never written here. */
export function useCloudProject(uid) {
  const [remote, setRemote] = useState(null);
  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', CLOUD_PBL_PATH(uid)));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        if (!cancelled && exists) setRemote(hydrateProject(snap.data(), TERM.id));
      } catch (err) {
        console.warn('[Dashboard] Could not read the PBL project:', err?.message);
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);
  return remote;
}
