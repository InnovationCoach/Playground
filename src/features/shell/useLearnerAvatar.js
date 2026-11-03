/**
 * The learner's dashboard profile picture for the side menu.
 *
 * One request per learner per page load (the URL is a short-lived signed URL;
 * an image that fails later falls back to initials). Staff have no learner
 * space, so the hook returns null for them without calling the API.
 */
import { useEffect, useState } from 'react';
import { schoolRequest } from '../../services/api/apiClient.js';

const cache = new Map();
const listeners = new Set();

/** Let screens that change the picture (Personalize dashboard) refresh the menu. */
export function refreshLearnerAvatar(uid) {
  cache.delete(uid);
  listeners.forEach((fn) => fn(uid));
}

function load(uid) {
  if (!cache.has(uid)) {
    cache.set(uid, schoolRequest('GET', '/api/learner-space')
      .then((data) => data?.dashboard?.appearance?.picture?.url || data?.portfolio?.appearance?.picture?.url || null)
      .catch(() => null));
  }
  return cache.get(uid);
}

export function useLearnerAvatar(uid) {
  const [url, setUrl] = useState(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const fn = (changed) => { if (changed === uid) setVersion((v) => v + 1); };
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, [uid]);
  useEffect(() => {
    let active = true;
    if (!uid) { setUrl(null); return undefined; }
    load(uid).then((value) => { if (active) setUrl(value); });
    return () => { active = false; };
  }, [uid, version]);
  return url;
}
