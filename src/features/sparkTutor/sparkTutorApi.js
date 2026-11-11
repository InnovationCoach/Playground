/**
 * Client for the Spark AI Learning Companion ("Ask Spark"), /api/spark-tutor.
 *
 * Shapes follow server/routes/spark-tutor.js on backend/spark-ai-tutor (Gemini).
 * Where that route differs from the handoff document, the route wins: message
 * replies carry `turnId`, and returning from a detour is `returnToProject: true`.
 *
 * Always the real service: there is no in-browser mock of the tutor, so the
 * companion never shows a made-up reply as if Spark had said it.
 */
import { schoolRequest } from '../../services/api/apiClient.js';

const enc = encodeURIComponent;
const BASE = '/api/spark-tutor';

export const startSparkSession = ({ mode = 'pbl_mentor', projectContext = null } = {}) =>
  schoolRequest('POST', `${BASE}/session`, { body: { mode, projectContext } });

export const sendSparkMessage = (sessionId, { message, clientTurnId }) =>
  schoolRequest('POST', `${BASE}/session/${enc(sessionId)}/message`, { body: { message, clientTurnId } });

export const getSparkHistory = (sessionId, limit = 6) =>
  schoolRequest('GET', `${BASE}/session/${enc(sessionId)}/history`, { query: { limit } });

// Enter the academic detour (optionally accepting a specific offer).
export const startSparkDetour = (sessionId, detourId) =>
  schoolRequest('POST', `${BASE}/session/${enc(sessionId)}/mode`, { body: detourId ? { mode: 'academic_tutor', detourId } : { mode: 'academic_tutor' } });

export const returnSparkToProject = (sessionId) =>
  schoolRequest('POST', `${BASE}/session/${enc(sessionId)}/mode`, { body: { returnToProject: true } });

export const setSparkMentorMode = (sessionId) =>
  schoolRequest('POST', `${BASE}/session/${enc(sessionId)}/mode`, { body: { mode: 'pbl_mentor' } });

export const submitSparkPractice = (sessionId, { taskId, answer }) =>
  schoolRequest('POST', `${BASE}/session/${enc(sessionId)}/practice/submit`, { body: { taskId, answer } });

export const requestSparkCoachSupport = (sessionId, { question, reason = 'LEARNER_INITIATED' }) =>
  schoolRequest('POST', `${BASE}/session/${enc(sessionId)}/support-request`, { body: { question, reason } });

export const getSparkCoachSummaries = () => schoolRequest('GET', `${BASE}/coach/summaries`);

// Coach records that they have seen a learner's support request.
export const acknowledgeSparkSupport = (requestId) =>
  schoolRequest('POST', `${BASE}/coach/actions/acknowledge`, { body: { requestId } });
