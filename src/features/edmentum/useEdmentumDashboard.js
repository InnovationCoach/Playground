import { useCallback, useEffect, useState } from 'react';
import {
  getStudentEdmentumDashboard,
  getCoachEdmentumDashboard,
  getAdminEdmentumDashboard
} from './edmentumDashboardService.js';
import {
  emptyStudentDashboardVariables,
  emptyCoachDashboardVariables,
  emptyAdminDashboardVariables
} from '../../../shared/edmentumVariables.js';

const FETCHERS = {
  student: getStudentEdmentumDashboard,
  coach: getCoachEdmentumDashboard,
  admin: getAdminEdmentumDashboard
};

const EMPTY_FACTORIES = {
  student: emptyStudentDashboardVariables,
  coach: emptyCoachDashboardVariables,
  admin: emptyAdminDashboardVariables
};

/**
 * React hook for Student, Coach, and Admin dashboards to consume
 * the Edmentum Courseware API v2 starting variable sets.
 *
 * Truthful by construction: starts in 'unknown'/loading state and never
 * fabricates connected data when credentials are not configured.
 */
export function useEdmentumDashboard(role = 'student', params = {}, { enabled = true } = {}) {
  const emptyFactory = EMPTY_FACTORIES[role] || emptyStudentDashboardVariables;
  const fetcher = FETCHERS[role] || getStudentEdmentumDashboard;
  const serializedParams = JSON.stringify(params || {});

  const [data, setData] = useState(() => emptyFactory('unknown'));
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled) return null;
    setLoading(true);
    setError(null);
    try {
      const parsed = JSON.parse(serializedParams);
      const res = await fetcher(parsed);
      setData(res && typeof res === 'object' ? res : emptyFactory('unknown'));
      return res;
    } catch (err) {
      setError(err);
      setData(emptyFactory('unknown'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, fetcher, emptyFactory, serializedParams]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
