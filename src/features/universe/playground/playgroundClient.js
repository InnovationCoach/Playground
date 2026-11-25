/**
 * Client persistence adapter for My Universe: Learner's Playground.
 * Hydrates from and syncs to /api/universe/playground when a signed-in Firebase
 * user is present; falls back silently to localStorage in offline/preview mode.
 */

async function authHeaders(auth) {
  const headers = { 'Content-Type': 'application/json' };
  const token = await auth?.currentUser?.getIdToken?.();
  if (!token) return null;
  headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function loadRemotePlaygroundState({ auth, baseUrl = '' } = {}) {
  try {
    const headers = await authHeaders(auth);
    if (!headers) return null;
    const res = await fetch(`${baseUrl}/api/universe/playground`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.state || null;
  } catch {
    return null;
  }
}

export async function saveRemotePlaygroundState({ auth, baseUrl = '', state } = {}) {
  try {
    const headers = await authHeaders(auth);
    if (!headers || !state) return false;
    const res = await fetch(`${baseUrl}/api/universe/playground/state`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ state })
    });
    return res.ok;
  } catch {
    return false;
  }
}
