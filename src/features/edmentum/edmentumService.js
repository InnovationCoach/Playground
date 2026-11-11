/**
 * Edmentum client service.
 *
 * Truthful by construction (O0):
 * - Connection state comes only from the school service
 *   (GET /api/learning-context → providerStatus.edmentum); see providerState.js.
 *   There is no client-side "connected" default and no browser-stored config.
 * - Scores and progress are never generated here. Until the provider contract
 *   (G0/G1) delivers ProgressObservation records, the UI shows no results.
 * - A launch reports success only when the server returns a launch package.
 *   Any network, HTTP or shape failure is returned as { ok: false } and the
 *   caller must say so. There is no offline fallback launch.
 *
 * The sample course catalogue used by the coach diagnostics lives in
 * fixtures/syntheticEdmentum.js and is labelled synthetic wherever it appears.
 */
import { schoolRequest } from '../../services/api/apiClient.js';

const LAUNCH_ERRORS = {
  UNAUTHENTICATED: 'Please sign in again, then try the launch.',
  FORBIDDEN: 'You do not have access to launch this course.',
  NOT_FOUND: 'The launch service is not available.',
  UNAVAILABLE: 'The launch service could not be reached. Nothing was opened.',
  BAD_RESPONSE: 'The launch service sent an incomplete reply. Nothing was opened.'
};

/**
 * Request an LTI 1.3 launch package from the server.
 *
 * Identity is derived by the server from the signed-in session; this client
 * sends only the course reference.
 *
 * @returns {Promise<{ok: true, launchUrl, idToken, courseTitle} | {ok: false, code, message}>}
 */
export async function launchEdmentumCourse(course, { role } = {}) {
  if (!course?.id) return { ok: false, code: 'VALIDATION', message: 'Choose a course to launch.' };
  let data;
  try {
    data = await schoolRequest('POST', `/api/lti/launch/${encodeURIComponent(course.id)}`, {
      body: { targetLinkUri: course.targetLinkUri, courseTitle: course.title, ...(role ? { role } : {}) }
    });
  } catch (err) {
    const code = err?.code || 'UNAVAILABLE';
    return { ok: false, code, message: LAUNCH_ERRORS[code] || LAUNCH_ERRORS.UNAVAILABLE };
  }
  if (!data || typeof data.launchUrl !== 'string' || !data.launchUrl || typeof data.id_token !== 'string' || !data.id_token) {
    return { ok: false, code: 'BAD_RESPONSE', message: LAUNCH_ERRORS.BAD_RESPONSE };
  }
  return { ok: true, launchUrl: data.launchUrl, idToken: data.id_token, courseTitle: data.courseTitle || course.title };
}
