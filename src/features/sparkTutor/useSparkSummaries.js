import { useCallback, useEffect, useState } from 'react';
import { acknowledgeSparkSupport, getSparkCoachSummaries } from './sparkTutorApi.js';
import { classifySparkError } from './sparkTutorModel.js';

/**
 * Spark coach summaries, loaded once for the whole coach workspace so an
 * urgent safeguarding request can be flagged on every tab, not only inside
 * the Review Desk. Pass enabled=false where the companion is switched off.
 */
export function useSparkSummaries(enabled = true) {
  const [data, setData] = useState({ state: enabled ? 'loading' : 'off', items: [] });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setData((d) => ({ state: 'loading', items: d.items }));
    getSparkCoachSummaries()
      .then((res) => { if (!cancelled) setData({ state: 'ready', items: Array.isArray(res?.items) ? res.items : [] }); })
      .catch((err) => { if (!cancelled) setData({ state: classifySparkError(err).state === 'disabled' ? 'disabled' : 'error', items: [], error: err }); });
    return () => { cancelled = true; };
  }, [enabled, version]);

  const reload = useCallback(() => setVersion((n) => n + 1), []);

  // Marks the request seen only after the server confirms it.
  const acknowledge = useCallback(async (requestId) => {
    await acknowledgeSparkSupport(requestId);
    setData((d) => ({
      ...d,
      items: d.items.map((s) => (s.supportDetails?.id === requestId
        ? { ...s, supportDetails: { ...s.supportDetails, status: 'acknowledged' } }
        : s))
    }));
  }, []);

  return { ...data, reload, acknowledge };
}
