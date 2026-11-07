import { useCallback, useEffect, useState } from 'react';

/**
 * Hash routing, kept because existing links and the legacy inline script both
 * use `#/coach/dashboard` style hashes. A real router can replace this in Phase
 * 2 without changing any caller.
 *
 * `clearHash` leaves a hash screen (My Courses, Settings) WITHOUT firing
 * hashchange. Setting `#/` instead woke index.html's legacy router, whose
 * default for an unknown hash is switchPhase('home') - so opening an activity
 * from My Courses landed on Home.
 */
export function useHashRoute() {
  const [hash, setHashState] = useState(() => window.location.hash || '');

  useEffect(() => {
    const onChange = () => setHashState(window.location.hash || '');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const setHash = useCallback((next) => { window.location.hash = next; }, []);
  const clearHash = useCallback(() => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setHashState('');
  }, []);

  return [hash, setHash, clearHash];
}
