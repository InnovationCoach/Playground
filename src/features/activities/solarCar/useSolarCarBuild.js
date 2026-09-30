/**
 * Build state for the Solar Car challenge.
 *
 * A build is a record of measurements a team takes over several lessons, so it
 * has to survive a closed laptop. Two layers:
 *
 *   localStorage - written on every keystroke (debounced), so a refresh, a flat
 *                  battery or a browser crash never costs a lesson's work.
 *   Firestore    - written every few seconds to users/{uid}/activityProgress/solar-car,
 *                  which is already coach-readable under the existing rules. That
 *                  is what lets a teacher see a team's real numbers without
 *                  asking them to read them out.
 *
 * Firestore is best-effort: a school wifi drop must not block the activity, so a
 * failed sync degrades to "saved on this device" rather than an error.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, doc, getDoc, setDoc } from '../../../firebase.js';
import { PART_TEMPLATES } from './solarCarModel.js';

// Keyed by user. The original unscoped key meant the next learner on a shared
// computer opened the previous team's build, and the "newer copy wins" sync
// below then uploaded it into their own Firestore record. The old key is purged
// by utils/deviceData.js.
const localKey = (uid) => `hearisland.solarCar.build.v1:${uid || 'signed-out'}`;
const CLOUD_DEBOUNCE_MS = 2500;
const LOCAL_DEBOUNCE_MS = 400;

export function emptyBuild() {
  return {
    teamName: '',
    version: 1,
    parts: PART_TEMPLATES.map((t, i) => ({ ...t, id: `p${i}`, grams: '' })),
    panel: {
      lengthMm: '', widthMm: '',
      mode: 'rated',
      vmp: '', impMa: '',
      voc: '', iscMa: '',
      condition: 'full_sun'
    },
    drive: {
      ratioMode: 'teeth',
      driverTeeth: '', drivenTeeth: '',
      driverDiaMm: '', drivenDiaMm: '',
      wheelDiameterMm: '',
      motorNoLoadRpm: '',
      driveType: 'spur_gears',
      stallTorqueMnm: ''
    },
    track: {
      surface: 'smooth_floor',
      distanceM: 10,
      targetSpeed: 3,
      gradePct: 0,
      dragCoefficient: 0.6,
      frontalAreaM2: 0.015,
      motorEfficiency: 0.5
    },
    runs: [{ id: 'r1', seconds: '' }, { id: 'r2', seconds: '' }, { id: 'r3', seconds: '' }],
    reflection: '',
    review: null,
    updatedAt: null
  };
}

/**
 * Merge a stored build over the current defaults.
 *
 * Shallow-per-section rather than a blanket spread, so a build saved before a
 * new field existed still opens, with the new field at its default instead of
 * undefined. Without this, adding one input to the panel form would break every
 * build already saved in a classroom.
 */
function hydrate(stored) {
  const base = emptyBuild();
  if (!stored || typeof stored !== 'object') return base;
  return {
    ...base,
    ...stored,
    panel: { ...base.panel, ...(stored.panel || {}) },
    drive: { ...base.drive, ...(stored.drive || {}) },
    track: { ...base.track, ...(stored.track || {}) },
    parts: Array.isArray(stored.parts) && stored.parts.length ? stored.parts : base.parts,
    runs: Array.isArray(stored.runs) && stored.runs.length ? stored.runs : base.runs
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

function writeLocal(uid, build) {
  try {
    localStorage.setItem(localKey(uid), JSON.stringify(build));
  } catch { /* private browsing, quota - the cloud copy still runs */ }
}

export function useSolarCarBuild(uid) {
  const [build, setBuild] = useState(() => readLocal(uid) || emptyBuild());
  const [syncState, setSyncState] = useState('idle'); // idle | saving | saved | local-only
  const localTimer = useRef(null);
  const cloudTimer = useRef(null);
  const loadedFor = useRef(null);

  // Pull the cloud copy once per signed-in user. It wins over localStorage only
  // when it is newer, so a team that worked offline on this machine does not
  // lose that work to a stale copy from another device.
  useEffect(() => {
    if (!uid || loadedFor.current === uid) return;
    loadedFor.current = uid;

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', `${uid}/activityProgress/solar-car`));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        if (cancelled || !exists) return;

        const remote = hydrate(snap.data());
        const local = readLocal(uid);
        if (!local || (remote.updatedAt || 0) > (local.updatedAt || 0)) {
          setBuild(remote);
          writeLocal(uid, remote);
        }
      } catch (err) {
        console.warn('[SolarCar] Could not load saved build:', err?.message);
        setSyncState('local-only');
      }
    })();

    return () => { cancelled = true; };
  }, [uid]);

  // Persist on change. The two timers run at different rates on purpose: local
  // storage is cheap and should be near-instant, a Firestore write is neither.
  useEffect(() => {
    clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => writeLocal(uid, build), LOCAL_DEBOUNCE_MS);

    if (!uid) return () => clearTimeout(localTimer.current);

    clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      setSyncState('saving');
      try {
        await setDoc(
          doc(db, 'users', `${uid}/activityProgress/solar-car`),
          { ...build, activityId: 'solar-car', updatedAt: Date.now() },
          { merge: true }
        );
        setSyncState('saved');
      } catch (err) {
        console.warn('[SolarCar] Cloud save failed, keeping local copy:', err?.message);
        setSyncState('local-only');
      }
    }, CLOUD_DEBOUNCE_MS);

    return () => {
      clearTimeout(localTimer.current);
      clearTimeout(cloudTimer.current);
    };
  }, [build, uid]);

  // Section-scoped updaters. Components never reach into the whole build object,
  // which keeps every edit a single shallow merge and avoids clobbering a field
  // another stage is mid-edit on.
  const patch = useCallback((section, changes) => {
    setBuild((b) => ({ ...b, [section]: { ...b[section], ...changes }, updatedAt: Date.now() }));
  }, []);

  const setField = useCallback((key, value) => {
    setBuild((b) => ({ ...b, [key]: value, updatedAt: Date.now() }));
  }, []);

  const setParts = useCallback((updater) => {
    setBuild((b) => ({
      ...b,
      parts: typeof updater === 'function' ? updater(b.parts) : updater,
      updatedAt: Date.now()
    }));
  }, []);

  const setRuns = useCallback((updater) => {
    setBuild((b) => ({
      ...b,
      runs: typeof updater === 'function' ? updater(b.runs) : updater,
      updatedAt: Date.now()
    }));
  }, []);

  const reset = useCallback(() => {
    const fresh = emptyBuild();
    setBuild(fresh);
    writeLocal(uid, fresh);
  }, [uid]);

  return { build, patch, setField, setParts, setRuns, reset, syncState };
}
