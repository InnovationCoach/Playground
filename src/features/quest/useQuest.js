/**
 * Load and update the learner's quest. The API is the only writer of quest
 * state; this hook never computes XP itself, it only shows what came back.
 */
import { useCallback, useEffect, useState } from 'react';
import { schoolRequest } from '../../services/api/apiClient.js';

export function useQuest(enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try { setData(await schoolRequest('GET', '/api/quest/me')); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [enabled]);

  useEffect(() => { reload(); }, [reload]);

  /** Run a mutation that returns { quest } or a quest view; keep the newest view. */
  const mutate = useCallback(async (method, path, body) => {
    setBusy(true);
    try {
      const result = await schoolRequest(method, path, { body });
      const view = result?.quest || (result?.level ? result : null);
      if (view) setData(view);
      return result;
    } finally {
      setBusy(false);
    }
  }, []);

  const recordStep = useCallback((phaseId, index) => mutate('POST', '/api/quest/events', { type: 'task_step', phaseId, index }), [mutate]);
  const reflect = useCallback((text) => mutate('POST', '/api/quest/events', { type: 'reflection', text }), [mutate]);
  const setPreferences = useCallback((patch) => mutate('PATCH', '/api/quest/me', { ...patch, revision: data?.revision ?? 0 }), [mutate, data?.revision]);
  const acknowledge = useCallback(() => mutate('PATCH', '/api/quest/me', { ackCelebrations: true, revision: data?.revision ?? 0 }), [mutate, data?.revision]);

  return { data, loading, error, busy, reload, recordStep, reflect, setPreferences, acknowledge };
}
