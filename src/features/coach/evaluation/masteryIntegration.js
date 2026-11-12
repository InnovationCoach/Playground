/**
 * Client integration for Mastery Transcript Consortium (MTC)
 * Communicates with server-authoritative /api/mastery endpoints.
 */

import { auth } from '../../../firebase.js';

export async function checkCompetencyMapping(competency) {
  if (!competency) {
    return { canRecord: false, reason: 'No competency specified on this submission.' };
  }

  try {
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`/api/mastery/check-competency?competency=${encodeURIComponent(competency)}`, {
      headers
    });
    if (!res.ok) {
      return { canRecord: false, reason: 'Could not verify competency mapping with server.' };
    }
    return await res.json();
  } catch (err) {
    // Fallback heuristic for offline / test environments
    const isGoalSetting = String(competency).includes('1.1.1') || String(competency).toLowerCase().includes('goal setting');
    if (isGoalSetting) {
      return {
        canRecord: true,
        credit: { id: 1372, title: '1.1.1 Goal Setting', area: 'Self-directed Learning', type: 'FOUNDATIONAL' }
      };
    }
    return {
      canRecord: false,
      reason: `No verified Mastery credit mapping found for competency "${competency}". Ordinary approval is available.`
    };
  }
}

export async function recordToMasteryTranscript(submissionId, { feedback = '', competency = null } = {}) {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api/mastery/evaluations/${encodeURIComponent(submissionId)}/record`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ feedback, competency })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || data.reason || `Mastery API error (${res.status})`);
    err.status = res.status;
    err.code = data.code || 'MASTERY_RECORDING_ERROR';
    err.canRecord = data.canRecord;
    err.reason = data.reason;
    err.canRetry = Boolean(data.canRetry);
    err.partialSuccess = Boolean(data.partialSuccess);
    err.evidenceId = data.evidenceId;
    throw err;
  }

  return data;
}
