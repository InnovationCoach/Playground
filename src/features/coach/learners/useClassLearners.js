/**
 * Loads the learners in the signed-in coach's classes, and nothing else.
 *
 * The class list comes from the coach's auth claim (set by
 * scripts/grant-coach.js), which is also what the Firestore rules check. There
 * is deliberately no fallback: an empty claim shows an empty state, never a
 * default class or "all students" (the old dashboard did both).
 *
 * Per learner: the user document (goal plan), dailyStats (minutes) and
 * activityProgress (PBL programs). The rules allow each of these to a coach
 * who shares a class with the learner.
 */
import { useCallback, useEffect, useState } from 'react';
import { db, collection, getDocs, query, where, getAuthClaims } from '../../../firebase.js';
import { loadClasses } from '../classCodes.js';
import { learnerRow } from './learnersModel.js';

const STAFF = new Set(['teacher', 'coach', 'admin', 'supervisor', 'parent']);
const chunk = (xs, n = 10) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));
const docsOf = (snap) => (snap ? snap.docs.map((d) => ({ id: d.id, data: d.data() })) : []);

export function useClassLearners() {
  const [state, setState] = useState({ status: 'loading', classes: [], rows: [], error: null, loadedAt: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: s.rows.length ? 'refreshing' : 'loading', error: null }));
    try {
      const claims = await getAuthClaims();
      const classIds = (Array.isArray(claims.classIds) ? claims.classIds : []).filter(Boolean);
      if (!classIds.length) {
        setState({ status: 'no-classes', classes: [], rows: [], error: null, loadedAt: Date.now() });
        return;
      }
      const [classes, userSnaps] = await Promise.all([
        loadClasses(classIds).catch(() => classIds.map((id) => ({ id, name: id }))),
        Promise.all(chunk(classIds).map((ids) => getDocs(query(collection(db, 'users'), where('classIds', 'array-contains-any', ids)))))
      ]);
      const seen = new Set();
      const users = [];
      for (const snap of userSnaps) {
        for (const d of snap.docs) {
          const data = d.data();
          if (seen.has(d.id) || STAFF.has(data.role)) continue;
          seen.add(d.id);
          users.push({ uid: d.id, ...data });
        }
      }
      const rows = await Promise.all(users.map(async (user) => {
        // A learner whose records cannot be read still appears, with "no data yet".
        const [stats, progress] = await Promise.all([
          getDocs(collection(db, 'users', user.uid, 'dailyStats')).catch(() => null),
          getDocs(collection(db, 'users', user.uid, 'activityProgress')).catch(() => null)
        ]);
        return learnerRow({ user, stats: docsOf(stats).map((s) => ({ id: s.id, ...s.data })), progress: docsOf(progress) });
      }));
      setState({ status: 'ready', classes: classes.filter((c) => classIds.includes(c.id)), rows, error: null, loadedAt: Date.now() });
    } catch (err) {
      console.warn('[Learners] Could not load the class:', err?.code || err?.message);
      setState((s) => ({ ...s, status: 'error', error: err?.code || err?.message || 'unknown' }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
