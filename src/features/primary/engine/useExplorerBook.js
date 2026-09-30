/**
 * A Junior Explorer's lab book for one activity, plus their reading settings.
 *
 * One Firestore document per activity - users/{uid}/activityProgress/junior-<id> -
 * so drawings from eight activities never crowd one 1 MB document. The path is
 * already coach-readable under the existing rules. Same two-layer save as the
 * other React activities: localStorage at once, Firestore a few seconds later,
 * and a failed cloud save degrades to "saved on this iPad".
 *
 * Settings (read-aloud, reading level) are per learner and per device, kept in
 * localStorage under the learner's uid. On a shared class iPad the next child
 * signs in to their own settings.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, doc, getDoc, setDoc } from '../../../firebase.js';
import { newRecord } from './investigationModel.js';

const bookKey = (uid, activityId) => `hearisland.junior.v1:${uid || 'signed-out'}:${activityId}`;
const settingsKey = (uid) => `hearisland.junior.settings.v1:${uid || 'signed-out'}`;
const CLOUD_DEBOUNCE_MS = 2500;
const LOCAL_DEBOUNCE_MS = 300;

const DEFAULT_SETTINGS = { readAloud: true, bigText: true, level: 'starter' };

export function useJuniorSettings(uid) {
  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(settingsKey(uid)) || '{}') }; } catch { return DEFAULT_SETTINGS; }
  });
  const set = useCallback((key, value) => {
    setSettings((s) => {
      const next = { ...s, [key]: value };
      try { localStorage.setItem(settingsKey(uid), JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  }, [uid]);
  return [settings, set];
}

function hydrate(stored) {
  return { records: Array.isArray(stored?.records) ? stored.records : [], updatedAt: stored?.updatedAt || null };
}

function readLocal(uid, activityId) {
  try {
    const raw = localStorage.getItem(bookKey(uid, activityId));
    return raw ? hydrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function useExplorerBook(uid, activityId) {
  const [book, setBook] = useState(() => readLocal(uid, activityId) || hydrate(null));
  const [syncState, setSyncState] = useState('idle');
  const localTimer = useRef(null);
  const cloudTimer = useRef(null);
  const docPath = `${uid}/activityProgress/junior-${activityId}`;

  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', docPath));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        if (cancelled || !exists) return;
        const remote = hydrate(snap.data());
        const local = readLocal(uid, activityId);
        if (!local || (remote.updatedAt || 0) > (local.updatedAt || 0)) setBook(remote);
      } catch (err) {
        console.warn('[JuniorExplorers] Could not load lab book:', err?.message);
        setSyncState('local-only');
      }
    })();
    return () => { cancelled = true; };
  }, [uid, activityId, docPath]);

  useEffect(() => {
    if (!book.updatedAt) return undefined;
    clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      try { localStorage.setItem(bookKey(uid, activityId), JSON.stringify(book)); } catch { /* quota */ }
    }, LOCAL_DEBOUNCE_MS);
    if (!uid) return () => clearTimeout(localTimer.current);

    clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      setSyncState('saving');
      try {
        await setDoc(doc(db, 'users', docPath), { ...book, activityId: `junior-${activityId}` });
        setSyncState('saved');
      } catch (err) {
        console.warn('[JuniorExplorers] Cloud save failed, keeping local copy:', err?.message);
        setSyncState('local-only');
      }
    }, CLOUD_DEBOUNCE_MS);
    return () => {
      clearTimeout(localTimer.current);
      clearTimeout(cloudTimer.current);
    };
  }, [book, uid, activityId, docPath]);

  const startRecord = useCallback((inv) => {
    const now = Date.now();
    setBook((b) => ({ records: [...b.records, newRecord(inv, b.records, now)], updatedAt: now }));
    return `${inv.id}-${now}`; // matches newRecord's id
  }, []);

  const updateRecord = useCallback((id, updater) => {
    setBook((b) => {
      const now = Date.now();
      return { records: b.records.map((r) => (r.id === id ? { ...updater(r), updatedAt: now } : r)), updatedAt: now };
    });
  }, []);

  const deleteRecord = useCallback((id) => {
    setBook((b) => ({ records: b.records.filter((r) => r.id !== id), updatedAt: Date.now() }));
  }, []);

  return { book, startRecord, updateRecord, deleteRecord, syncState };
}
