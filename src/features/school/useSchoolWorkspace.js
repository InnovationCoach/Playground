import { useCallback, useEffect, useState } from 'react';
import { schoolRequest } from '../../services/api/apiClient.js';
export function useSchoolResource(path, poll = false) {
  const [state, setState] = useState({
      path,
      data: null,
      error: null,
      loading: !!path
    }),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true,
      timer;
    setState({
      path,
      data: null,
      error: null,
      loading: !!path
    });
    async function load() {
      try {
        const data = await schoolRequest('GET', path, {refreshToken: path==='/api/learning-context' && version>0});
        if (active) setState({
          path,
          data,
          error: null,
          loading: false
        });
      } catch (error) {
        if (active) setState(old => ({
          ...old,
          data: [401,403].includes(error.status) ? null : old.data,
          error,
          loading: false
        }));
      } finally {
        if (active && poll) timer = setTimeout(load, 30000);
      }
    }
    if (path) load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [path, version, poll]);
  const reload = useCallback(() => setVersion(n => n + 1), []);
  return state.path === path ? {
    ...state,
    reload
  } : {
    data: null,
    error: null,
    loading: !!path,
    reload
  };
}
export const schoolPath = (schoolId, path) => `/api/schools/${encodeURIComponent(schoolId)}/${path}`;
export async function mutateSchool(method, path, body) {
  return schoolRequest(method, path, {
    body
  });
}
export function serviceMessage(error) {
  const messages = {
    NOT_FOUND: 'School learning is unavailable. Please try again or ask your school to check access.',
    UNAVAILABLE: 'School learning could not be reached. Please try again shortly.',
    UNAUTHENTICATED: 'Please sign in again to view your school records.',
    FORBIDDEN: 'You do not currently have access to these records. Ask your school to check your assignment.'
  };
  const msg = String(error?.message || error?.code || '');
  if (msg.includes('invalid-refresh-token') || msg.includes('user-token-expired')) {
    return messages.UNAUTHENTICATED;
  }
  const code = error?.code || error?.message;
  if (messages[code]) return messages[code];
  if (error?.message && !/^[A-Z_]+$/.test(error.message) && !error.message.startsWith('Firebase:')) {
    return error.message;
  }
  return 'School records are unavailable. Please try again.';
}
