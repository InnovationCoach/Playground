/**
 * The learner's lab book for the Plant Microscope Lab.
 *
 * Same two layers as the Solar Car build (see useSolarCarBuild.js):
 *   localStorage - near-instant, so nothing tapped is ever lost to a refresh
 *   Firestore    - users/{uid}/activityProgress/plant-lab, coach-readable under
 *                  the existing rules, so a teacher sees the lab book without
 *                  asking the learner to read it out.
 *
 * Drawings are stored inline as small JPEG data URLs (~5-10 KB each). A
 * Firestore document tops out at 1 MB, so a very long lab book can outgrow the
 * cloud copy; that shows as "saved on this device" rather than losing anything.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, doc, getDoc, setDoc } from '../../../firebase.js';
import { newRecord } from './plantLabModel.js';

const localKey = (uid) => `hearisland.plantLab.v1:${uid || 'signed-out'}`;
const CLOUD_DEBOUNCE_MS = 2500;
const LOCAL_DEBOUNCE_MS = 300;

function emptyBook() {
  return { records: [], settings: { readAloud: false, bigText: true }, updatedAt: null };
}

function hydrate(stored) {
  const base = emptyBook();
  if (!stored || typeof stored !== 'object') return base;
  return {
    ...base,
    ...stored,
    settings: { ...base.settings, ...(stored.settings || {}) },
    records: Array.isArray(stored.records) ? stored.records : []
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

function writeLocal(uid, book) {
  try {
    localStorage.setItem(localKey(uid), JSON.stringify(book));
  } catch { /* private browsing, quota - the cloud copy still runs */ }
}

export function useLabBook(uid) {
  const [book, setBook] = useState(() => readLocal(uid) || emptyBook());
  const [syncState, setSyncState] = useState('idle'); // idle | saving | saved | local-only
  const localTimer = useRef(null);
  const cloudTimer = useRef(null);
  const loadedFor = useRef(null);

  useEffect(() => {
    if (!uid || loadedFor.current === uid) return;
    loadedFor.current = uid;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', `${uid}/activityProgress/plant-lab`));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        if (cancelled || !exists) return;
        const remote = hydrate(snap.data());
        const local = readLocal(uid);
        if (!local || (remote.updatedAt || 0) > (local.updatedAt || 0)) {
          setBook(remote);
          writeLocal(uid, remote);
        }
      } catch (err) {
        console.warn('[PlantLab] Could not load lab book:', err?.message);
        setSyncState('local-only');
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  useEffect(() => {
    if (!book.updatedAt) return undefined; // nothing written yet
    clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => writeLocal(uid, book), LOCAL_DEBOUNCE_MS);
    if (!uid) return () => clearTimeout(localTimer.current);

    clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      setSyncState('saving');
      try {
        await setDoc(
          doc(db, 'users', `${uid}/activityProgress/plant-lab`),
          { ...book, activityId: 'plant-lab' }
        );
        setSyncState('saved');
      } catch (err) {
        console.warn('[PlantLab] Cloud save failed, keeping local copy:', err?.message);
        setSyncState('local-only');
      }
    }, CLOUD_DEBOUNCE_MS);

    return () => {
      clearTimeout(localTimer.current);
      clearTimeout(cloudTimer.current);
    };
  }, [book, uid]);

  const startRecord = useCallback((experimentId) => {
    const now = Date.now();
    setBook((b) => ({ ...b, records: [...b.records, newRecord(experimentId, b.records, now)], updatedAt: now }));
    return `${experimentId}-${now}`; // matches newRecord's id
  }, []);

  /** Apply `updater(record) => record` to one record. */
  const updateRecord = useCallback((id, updater) => {
    setBook((b) => {
      const now = Date.now();
      return {
        ...b,
        records: b.records.map((r) => (r.id === id ? { ...updater(r), updatedAt: now } : r)),
        updatedAt: now
      };
    });
  }, []);

  const deleteRecord = useCallback((id) => {
    setBook((b) => ({ ...b, records: b.records.filter((r) => r.id !== id), updatedAt: Date.now() }));
  }, []);

  const setSetting = useCallback((key, value) => {
    setBook((b) => ({ ...b, settings: { ...b.settings, [key]: value }, updatedAt: Date.now() }));
  }, []);

  return { book, startRecord, updateRecord, deleteRecord, setSetting, syncState };
}
