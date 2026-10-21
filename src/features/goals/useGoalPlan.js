/**
 * Load and save a learner's goal plan (goalPlan.js).
 *
 * Same two-layer save as the PBL program pages: localStorage at once, the
 * user document a few seconds later; the newer copy (by updatedAt) wins on
 * load. A learner who only ever used the old wizard has their goals carried
 * over from `goals` on the user document. Saving also mirrors each big goal
 * and the focus skill to users/{uid}/goals for the coach dashboard, and
 * removes mirrors of goals the learner deleted.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, doc, getDoc, setDoc, deleteDoc } from '../../firebase.js';
import { hydratePlan, migrateLegacy, newPlan, coachGoalDocs } from './goalPlan.js';

const CLOUD_DEBOUNCE_MS = 2000;
export const planStorageKey = (uid) => `goalPlan_${uid || 'signed-out'}`;

export function readLocalPlan(uid) {
  try {
    const raw = localStorage.getItem(planStorageKey(uid));
    return raw ? hydratePlan(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function useGoalPlan(uid) {
  const [plan, setPlan] = useState(() => readLocalPlan(uid) || newPlan());
  const [syncState, setSyncState] = useState('idle'); // idle | saving | saved | local-only
  const [loaded, setLoaded] = useState(false);
  const cloudTimer = useRef(null);
  const mirrored = useRef(new Set());

  useEffect(() => {
    setPlan(readLocalPlan(uid) || newPlan());
    setLoaded(false);
    if (!uid) { setLoaded(true); return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
        if (cancelled) return;
        const data = exists ? snap.data() : {};
        const local = readLocalPlan(uid);
        let remote = null;
        if (data.goalPlan) remote = hydratePlan(data.goalPlan);
        else if (Array.isArray(data.goals?.goals) && data.goals.goals.length) remote = migrateLegacy(data.goals);
        if (remote && (!local || (remote.updatedAt || 0) >= (local.updatedAt || 0))) setPlan(remote);
        for (const g of (remote || local || newPlan()).goals) mirrored.current.add(`plan_${g.id}`);
      } catch (err) {
        console.warn('[Goals] Could not load the goal plan:', err?.message);
        if (!cancelled) setSyncState('local-only');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  useEffect(() => {
    if (!plan.updatedAt) return undefined;
    try { localStorage.setItem(planStorageKey(uid), JSON.stringify(plan)); } catch { /* quota or private mode */ }
    if (!uid) return undefined;
    clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      setSyncState('saving');
      try {
        await setDoc(doc(db, 'users', uid), { goalPlan: plan, isFirstTimeUser: false, updatedAt: new Date().toISOString() }, { merge: true });
        const docs = coachGoalDocs(plan);
        const keep = new Set(docs.map((d) => d.goalId));
        await Promise.all([
          ...docs.map((d) => setDoc(doc(db, 'users', uid, 'goals', d.goalId), d, { merge: true })),
          ...[...mirrored.current].filter((id) => !keep.has(id))
            .map((id) => deleteDoc(doc(db, 'users', uid, 'goals', id)).catch(() => null))
        ]);
        mirrored.current = keep;
        setSyncState('saved');
      } catch (err) {
        console.warn('[Goals] Cloud save failed, keeping the device copy:', err?.message);
        setSyncState('local-only');
      }
    }, CLOUD_DEBOUNCE_MS);
    return () => clearTimeout(cloudTimer.current);
  }, [plan, uid]);

  const update = useCallback((fn) => setPlan((prev) => fn(prev)), []);
  return { plan, update, syncState, loaded };
}
