/**
 * The courses a learner added from search ("Courses I added" on My Courses).
 * Shared by the Home search and My Courses.
 * Reads and writes both device localStorage and Firestore enrolments (addToMyCourse).
 * Conforms to docs/data-contract.md.
 */
import { useEffect, useState, useCallback } from 'react';
import { pathStorageKey, parsePath, togglePath } from './catalog.js';
import { db, collection, query, where, getDocs } from '../../firebase.js';
import { addToMyCourse } from '../../services/pblService.js';

export function useAddedCourses(uid, catalog) {
  const [keys, setKeys] = useState([]);

  // Load from localStorage and Firestore enrolments
  useEffect(() => {
    let cancelled = false;
    const catalogKeys = catalog.map((c) => c.key);

    // 1. Initialise from localStorage
    try {
      const local = parsePath(localStorage.getItem(pathStorageKey(uid)), catalogKeys);
      setKeys(local);
    } catch {
      setKeys([]);
    }

    // 2. Fetch remote enrolments if user is signed in
    if (!uid) return undefined;

    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'enrolments'), where('learnerId', '==', uid)));
        if (cancelled) return;
        const remoteKeys = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.programId) {
            remoteKeys.push(`program:${data.programId}`);
          }
        });

        if (remoteKeys.length > 0) {
          setKeys((prev) => {
            const merged = Array.from(new Set([...prev, ...remoteKeys]));
            try {
              localStorage.setItem(pathStorageKey(uid), JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('[useAddedCourses] Could not fetch enrolments from Firestore:', err?.message);
      }
    })();

    return () => { cancelled = true; };
  }, [uid, catalog]);

  const toggle = useCallback((key) => {
    setKeys((prev) => {
      const willAdd = !prev.includes(key);
      const next = togglePath(prev, key);
      try {
        localStorage.setItem(pathStorageKey(uid), JSON.stringify(next));
      } catch {}

      // If adding a PBL program, write to Firestore enrolments
      if (willAdd && key.startsWith('program:') && uid) {
        const programId = key.replace(/^program:/, '');
        addToMyCourse(programId, uid).catch((err) => {
          console.warn('[useAddedCourses] Remote self-enrolment failed:', err?.message);
        });
      }

      return next;
    });
  }, [uid]);

  const added = keys.map((k) => catalog.find((c) => c.key === k)).filter(Boolean);
  return { keys, added, toggle };
}
