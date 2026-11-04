import { hrefFor, parseRoute } from './routes.js';

/** Keep requested deep links; only choose a default when no screen was requested. */
export function signInDestination(role, isPrimary, openedHash) {
  if (isPrimary || parseRoute(openedHash)) return null;
  if (role === 'admin' || role === 'supervisor') return hrefFor.list('students');
  if (role === 'teacher' || role === 'coach') return hrefFor.coach();
  if (role === 'parent') return hrefFor.parent();
  return hrefFor.dashboard();
}
