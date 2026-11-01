import { auth } from '../../firebase.js';
import { API_BASE } from '../../services/apiBase.js';

async function getAuthHeader() {
  try {
    const user = auth?.currentUser;
    if (!user) return null;
    const token = await user.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  } catch {
    return null;
  }
}

/**
 * Authoritatively check destination access for planets.
 * Fails closed to 'not-connected' if offline, unauthenticated, or server error.
 */
export async function checkDestinationAccess(planetIds) {
  if (!Array.isArray(planetIds) || planetIds.length === 0) {
    return { destinations: {}, notConnected: false };
  }
  const headers = await getAuthHeader();
  if (!headers) {
    return { destinations: null, notConnected: true };
  }

  try {
    const res = await fetch(`${API_BASE}/api/universe/access`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ planetIds })
    });
    if (!res.ok) {
      return { destinations: null, notConnected: true, status: res.status };
    }
    const data = await res.json();
    return { destinations: data.destinations || {}, notConnected: false };
  } catch (err) {
    console.warn('[Universe API] Access check failed:', err);
    return { destinations: null, notConnected: true };
  }
}

/**
 * Fetch signed-in learner's own submissions.
 */
export async function getMySubmissions() {
  const headers = await getAuthHeader();
  if (!headers) return { submissions: [] };

  try {
    const res = await fetch(`${API_BASE}/api/universe/missions/submissions/mine`, {
      method: 'GET',
      headers
    });
    if (!res.ok) return { submissions: [] };
    const data = await res.json();
    return { submissions: Array.isArray(data.submissions) ? data.submissions : [] };
  } catch (err) {
    console.warn('[Universe API] Fetching submissions failed:', err);
    return { submissions: [] };
  }
}

/**
 * Submit a mission reflection for coach review.
 */
export async function submitMissionReflection({ missionId, routeId, missionVersion, reflection }) {
  const headers = await getAuthHeader();
  if (!headers) {
    throw new Error('Sign-in required to submit reflections to your coach.');
  }

  const res = await fetch(`${API_BASE}/api/universe/missions/${encodeURIComponent(missionId)}/submissions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ routeId, missionVersion, reflection })
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const errorMsg = data?.error?.message || 'Failed to submit reflection.';
    const err = new Error(errorMsg);
    err.status = res.status;
    err.code = data?.error?.code;
    throw err;
  }
  return data;
}

/**
 * Fetch pending submissions for a coach's classes.
 */
export async function getCoachSubmissions({ status = 'submitted' } = {}) {
  const headers = await getAuthHeader();
  if (!headers) return { submissions: [] };

  try {
    const url = `${API_BASE}/api/coach/universe/submissions?status=${encodeURIComponent(status)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers
    });
    if (!res.ok) return { submissions: [] };
    const data = await res.json();
    return { submissions: Array.isArray(data.submissions) ? data.submissions : [] };
  } catch (err) {
    console.warn('[Universe API] Fetching coach submissions failed:', err);
    return { submissions: [] };
  }
}

/**
 * Coach reviews a submission: approve or return.
 */
export async function reviewSubmission({ submissionId, decision, note }) {
  const headers = await getAuthHeader();
  if (!headers) {
    throw new Error('Sign-in required to review submissions.');
  }

  const res = await fetch(`${API_BASE}/api/coach/universe/submissions/${encodeURIComponent(submissionId)}/review`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ decision, note })
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const errorMsg = data?.error?.message || 'Failed to review submission.';
    const err = new Error(errorMsg);
    err.status = res.status;
    err.code = data?.error?.code;
    throw err;
  }
  return data;
}
