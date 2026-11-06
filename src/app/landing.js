import { hrefFor, parseRoute } from './routes.js';

/** Keep requested deep links; only choose a default when no screen was requested. */
export function signInDestination(role, isPrimary, openedHash) {
  if (isPrimary || parseRoute(openedHash)) return null;
  if (role === 'student') return hrefFor.dashboard();
  if (role === 'teacher' || role === 'coach') return hrefFor.coach();
  return hrefFor.spark();
}
