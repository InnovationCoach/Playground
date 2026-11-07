/**
 * Grounded AI PBL Unit Synthesizer
 * Synthesizes a structured PBL/STEAM curriculum unit using Gemini AI,
 * grounded in uploaded/attached sources and adapted to student learning needs.
 * Validates output using shared Zod contract schema.
 */

import { PblUnitSchema, validateRequestedCompetencies } from '../../../../shared/pblUnitSchema.js';
import { API_BASE } from '../../../services/apiBase.js';
import { auth } from '../../../firebase.js';

/**
 * Synthesizes a grounded PBL/STEAM unit via server AI.
 *
 * @param {object} params
 * @param {object} params.learner - Student profile or Universal Learner
 * @param {Array} params.sources - Active grounding documents
 * @param {string} [params.customFocus] - Optional coach focus/theme input (max 500 chars)
 * @param {string} [params.programme='WLS'] - 'WLS' | 'WHS' | 'primary'
 * @param {string} [params.unitType='pbl_unit'] - 'pbl_unit' | 'steam_activity' | 'milestones' | 'quiz'
 * @param {string|number} [params.duration='8 stages'] - e.g. '4 sessions' or '6 weeks'
 * @param {string} [params.language='en-GB'] - 'en-GB' | 'th'
 * @param {string} [params.step='full'] - 'outline' | 'details' | 'full'
 * @param {Array<{framework: string, id: string}>} [params.competencies=[]] - Approved WeLearn / NGS competencies
 * @returns {Promise<object>} Validated PblUnit
 */
export async function synthesizeGroundedUnit({
  learner,
  sources = [],
  customFocus = '',
  programme = 'WLS',
  unitType = 'pbl_unit',
  duration = '8 stages',
  language = 'en-GB',
  step = 'full',
  competencies = []
}) {
  const activeSources = (Array.isArray(sources) ? sources : []).filter((s) => s.active);
  const groundingContext = activeSources
    .map((s) => `[SOURCE: ${s.title}]\n${s.excerpt || s.summary || ''}`)
    .join('\n\n');

  if (typeof customFocus !== 'string' || customFocus.length > 500) {
    throw new Error('Keep coach focus instructions to 500 characters or fewer.');
  }

  const validatedCompetencies = validateRequestedCompetencies(competencies).map(({ framework, id }) => ({
    framework,
    id
  }));

  const controller = new AbortController();
  // Allow the server's 45-second AI deadline plus response/audit overhead.
  const timer = setTimeout(() => controller.abort(), 60000);
  const startedAt = Date.now();
  let status = null;
  let failureCode = 'NETWORK_ERROR';
  try {
    let res;
    try {
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      res = await fetch(`${API_BASE}/api/pbl/synthesize`, {
        method: 'POST',
        signal: controller.signal,
        headers,
        body: JSON.stringify({
          learner: {
            id: learner?.id || learner?.uid || 'universal-all',
            name: learner?.name || learner?.displayName || 'Learner',
            cohort: learner?.cohort || programme,
            grade: learner?.grade || '',
            consumingPassions: learner?.consumingPassions || '',
            diagnosisTraits: learner?.diagnosisTraits || '',
            appliedAccommodations: learner?.appliedAccommodations || []
          },
          groundingContext,
          customFocus,
          programme,
          unitType,
          duration,
          language,
          step,
          competencies: validatedCompetencies,
          activeSources: activeSources.map((s) => s.title || s.id)
        })
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        failureCode = 'CLIENT_TIMEOUT';
        throw new Error('Generation timed out. Your draft has not been published. Please try again.');
      }
      throw new Error('The AI service could not be reached. Check your connection and try again.');
    }

    status = res.status;
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      failureCode = typeof body?.code === 'string' ? body.code : 'HTTP_ERROR';
      const guidance = res.status === 401 ? 'Please sign in again and retry.'
        : res.status === 403 ? 'A verified coach account with access is required.'
        : (failureCode === 'AI_SERVICE_ERROR' || failureCode === 'AI_NOT_CONFIGURED' || failureCode === 'MODEL_UNAVAILABLE')
          ? 'Ask the platform lead to check the server Gemini key and model configuration.'
        : 'Please try again. If this continues, contact the platform lead.';
      const message = typeof body?.error === 'string' ? body.error : 'The AI service returned an unsuccessful response.';
      throw new Error(`${message} ${guidance} (HTTP ${res.status}; ${failureCode})`);
    }

    // Never normalize a missing/malformed response into a fabricated draft.
    failureCode = 'INVALID_RESPONSE';
    const parsed = PblUnitSchema.safeParse(body?.unit);
    if (!parsed.success) {
      throw new Error('The AI service returned an invalid course draft. Nothing was published. Please retry or contact the platform lead.');
    }
    return parsed.data;
  } catch (error) {
    // Metadata only: never log tokens, learner profiles, prompts or generated content.
    console.warn('[PBL generation failed]', { endpoint: '/api/pbl/synthesize', status, code: failureCode, elapsedMs: Date.now() - startedAt });
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
