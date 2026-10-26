/**
 * Loads the learners in the signed-in coach's classes, and nothing else.
 *
 * Tenancy is the same as the Learners roster (../learners/useClassLearners.js):
 * the class list comes from the coach's auth claim, which is what the
 * Firestore rules check, and there is no fallback. An empty claim shows an
 * empty state, never a default class or "all students".
 *
 * Per learner: the user document, activityProgress (term project and PBL
 * programs), dailyStats, and program enrolments with their phaseProgress
 * (phase submissions and the coach's feedback). Enrolments are queried one
 * learner at a time because the rule checks the coach against that learner.
 * Class assignments are read once per class. A
 * learner whose records cannot be read still appears, flagged, with "not
 * available" where the data would be.
 */
import { useCallback, useEffect, useState } from 'react';
import { db, collection, getDocs, query, where, getAuthClaims } from '../../../firebase.js';
import { loadClasses } from '../classCodes.js';

const STAFF = new Set(['teacher', 'coach', 'admin', 'supervisor', 'parent']);
const chunk = (xs, n = 10) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));
const docsOf = (snap) => (snap ? snap.docs.map((d) => ({ id: d.id, data: d.data() })) : []);

/** One learner's program enrolments, each with its phaseProgress docs; null when they could not be read. */
async function loadEnrolments(uid) {
  try {
    const snap = await getDocs(query(collection(db, 'enrolments'), where('learnerId', '==', uid)));
    return await Promise.all(docsOf(snap).map(async (en) => {
      const phases = await getDocs(collection(db, 'enrolments', en.id, 'phaseProgress')).catch(() => null);
      return { ...en, phases: docsOf(phases) };
    }));
  } catch {
    return null;
  }
}

export function useMyLearners() {
  const [state, setState] = useState({ status: 'loading', classes: [], raw: [], assignments: [], assignmentsFailed: false, error: null, loadedAt: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: s.raw.length ? 'refreshing' : 'loading', error: null }));
    try {
      const claims = await getAuthClaims();
      const classIds = (Array.isArray(claims.classIds) ? claims.classIds : []).filter(Boolean);
      if (!classIds.length) {
        setState({ status: 'no-classes', classes: [], raw: [], assignments: [], assignmentsFailed: false, error: null, loadedAt: Date.now() });
        return;
      }
      let assignmentsFailed = false;
      const [classes, userSnaps, assignmentSnaps] = await Promise.all([
        loadClasses(classIds).catch(() => classIds.map((id) => ({ id, name: id }))),
        Promise.all(chunk(classIds).map((ids) => getDocs(query(collection(db, 'users'), where('classIds', 'array-contains-any', ids))))),
        Promise.all(chunk(classIds, 30).map((ids) => getDocs(query(collection(db, 'assignments'), where('classId', 'in', ids)))))
          .catch(() => { assignmentsFailed = true; return []; })
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
      const raw = await Promise.all(users.map(async (user) => {
        const [stats, progress, enrolments] = await Promise.all([
          getDocs(collection(db, 'users', user.uid, 'dailyStats')).catch(() => null),
          getDocs(collection(db, 'users', user.uid, 'activityProgress')).catch(() => null),
          loadEnrolments(user.uid)
        ]);
        return {
          user,
          stats: docsOf(stats).map((s) => ({ id: s.id, ...s.data })),
          progress: docsOf(progress),
          enrolments: enrolments || [],
          readFailed: !stats || !progress || !enrolments
        };
      }));
      const assignments = assignmentSnaps.flatMap((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setState({
        status: 'ready', classes: classes.filter((c) => classIds.includes(c.id)), raw, assignments, assignmentsFailed, error: null, loadedAt: Date.now()
      });
    } catch (err) {
      console.warn('[My Learners] Could not load the class:', err?.code || err?.message);
      setState((s) => ({ ...s, status: 'error', error: err?.code || err?.message || 'unknown' }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
