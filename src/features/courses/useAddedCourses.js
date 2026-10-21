/**
 * The courses a learner added from search ("Courses I added" on My Courses).
 * Shared by the Home search and My Courses; both read the same device copy
 * (catalog.js: pathStorageKey / parsePath / togglePath), so an add on Home
 * shows up on My Courses. Device-only until the backend stores it.
 */
import { useEffect, useState } from 'react';
import { pathStorageKey, parsePath, togglePath } from './catalog.js';

export function useAddedCourses(uid, catalog) {
  const [keys, setKeys] = useState([]);

  useEffect(() => {
    try { setKeys(parsePath(localStorage.getItem(pathStorageKey(uid)), catalog.map((c) => c.key))); } catch { setKeys([]); }
  }, [uid, catalog]);

  function toggle(key) {
    setKeys((prev) => {
      const next = togglePath(prev, key);
      try { localStorage.setItem(pathStorageKey(uid), JSON.stringify(next)); } catch { /* private mode: keep in memory */ }
      return next;
    });
  }

  const added = keys.map((k) => catalog.find((c) => c.key === k)).filter(Boolean);
  return { keys, added, toggle };
}
