/**
 * Where the backend API lives.
 *
 * Default is same-origin: in production Firebase Hosting rewrites `/api/**` to
 * the Cloud Function, and in development vite.config.js proxies `/api` to the
 * local Express server on :3001. So the browser always calls `/api/...` and
 * needs no CORS.
 *
 * `??` rather than `||`: an explicitly empty VITE_API_URL means same-origin.
 * With `||` the empty string was falsy and every build fell back to
 * http://localhost:3001 - which is why AI features were dead in production.
 */
export const API_BASE = (import.meta.env?.VITE_API_URL ?? '').replace(/\/$/, '');
