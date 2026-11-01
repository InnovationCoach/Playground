import { hrefFor, parseRoute } from './routes.js';

/** Keep requested deep links; only choose a default when no screen was requested. */
export function signInDestination(role, isPrimary, openedHash) {
  if (isPrimary || parseRoute(openedHash)) return null;
  return role === 'student' ? hrefFor.dashboard() : hrefFor.spark();
}
