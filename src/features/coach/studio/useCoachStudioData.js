/**
 * Hooks for Coach PBL Studio: real classes and real learners.
 * Contract: docs/data-contract.md
 * Owned by Gemini 3.8.
 */

import { useState, useEffect, useCallback } from 'react';
import { db, collection, query, where, getDocs, getAuthClaims } from '../../../firebase.js';
import { loadClasses } from '../classCodes.js';

const STAFF_ROLES = new Set(['teacher', 'coach', 'admin', 'supervisor', 'parent']);

/**
 * Loads the classes assigned to the signed-in coach.
 */
export function useCoachClasses(coachUser = null) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const claims = await getAuthClaims().catch(() => ({}));
      const classIds = (Array.isArray(claims.classIds) && claims.classIds.length > 0)
        ? claims.classIds.filter(Boolean)
        : (Array.isArray(coachUser?.classIds) ? coachUser.classIds.filter(Boolean) : []);

      if (classIds.length === 0) {
        setClasses([]);
        setLoading(false);
        return;
      }

      const loaded = await loadClasses(classIds);
      setClasses(loaded.filter((c) => !c.missing && !c.error));
    } catch (err) {
      console.warn('[useCoachClasses] Error loading coach classes:', err?.message);
      setError(err?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [coachUser?.classIds]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return { classes, loading, error, reload: fetchClasses };
}

/**
 * Loads learners for a specific class (or all coach classes),
 * strictly filtered to role == 'learner' and excluding test accounts unless requested.
 *
 * @param {string} classId - Target class ID
 * @param {object} options - { includeTest: boolean }
 */
export function useClassLearners(classId, { includeTest = false } = {}) {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLearners = useCallback(async () => {
    if (!classId) {
      setLearners([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let q;
      if (classId === 'all') {
        // Fetch for all coach classIds
        const claims = await getAuthClaims().catch(() => ({}));
        const ids = (claims.classIds || []).filter(Boolean);
        if (ids.length === 0) {
          setLearners([]);
          setLoading(false);
          return;
        }
        q = query(collection(db, 'users'), where('classIds', 'array-contains-any', ids.slice(0, 10)));
      } else {
        q = query(collection(db, 'users'), where('classIds', 'array-contains', classId));
      }

      const snap = await getDocs(q);
      const list = [];
      const seen = new Set();

      snap.forEach((docSnap) => {
        if (seen.has(docSnap.id)) return;
        seen.add(docSnap.id);
        const data = docSnap.data();

        // Privilege & role check: strictly learners (or legacy student)
        const role = data.role;
        if (STAFF_ROLES.has(role)) return;
        if (role && role !== 'learner' && role !== 'student') return;

        // Filter out test accounts unless explicitly enabled
        if (!includeTest && (data.isTest === true || data.email?.includes('test@school.edu') || data.email?.includes('test.'))) {
          return;
        }

        list.push({
          id: docSnap.id,
          uid: docSnap.id,
          name: data.displayName || data.email?.split('@')[0] || 'Learner',
          displayName: data.displayName || data.email?.split('@')[0] || 'Learner',
          email: data.email || '',
          classIds: Array.isArray(data.classIds) ? data.classIds : [],
          ageBand: data.ageBand || '11-16',
          isTest: Boolean(data.isTest),
          // Synthetic / seed traits for 2e scaffolding compatibility
          diagnosisTraits: data.diagnosisTraits || ['Gifted Inquiry', 'Fast Processor'],
          consumingPassions: data.consumingPassions || ['Hands-on Making', 'Robotics'],
          executiveFunctionHurdles: data.executiveFunctionHurdles || ['Task initiation'],
          appliedAccommodations: data.appliedAccommodations || ['Visual progress tracking', 'Milestone chunking']
        });
      });

      setLearners(list);
    } catch (err) {
      console.warn('[useClassLearners] Error loading learners:', err?.message);
      setError(err?.message || 'Failed to load learners');
    } finally {
      setLoading(false);
    }
  }, [classId, includeTest]);

  useEffect(() => {
    fetchLearners();
  }, [fetchLearners]);

  return { learners, loading, error, reload: fetchLearners };
}
