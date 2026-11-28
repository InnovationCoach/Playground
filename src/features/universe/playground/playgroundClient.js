/**
 * Client persistence adapter for My Universe: Learner's Playground.
 * Hydrates from and syncs to /api/universe/playground when a signed-in Firebase
 * user is present; falls back silently to localStorage in offline/preview mode.
 */

import { API_CONTRACT_VERSION } from '../../../../shared/universe/index.js';

// The /api/universe transport guard rejects any PUT/POST without a matching contractVersion
// (400 CONTRACT_VERSION_UNSUPPORTED), so every save must carry it in the body and header.
const CONTRACT_HEADER = 'X-Universe-Contract-Version';

async function authHeaders(auth) {
  const headers = { 'Content-Type': 'application/json', [CONTRACT_HEADER]: API_CONTRACT_VERSION };
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
      body: JSON.stringify({ contractVersion: API_CONTRACT_VERSION, state })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function loadClassmatePlanets({ auth, baseUrl = '' } = {}) {
  try {
    const headers = await authHeaders(auth);
    if (!headers) return [];
    const res = await fetch(`${baseUrl}/api/universe/playground/classmates`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.peers) ? data.peers : [];
  } catch {
    return [];
  }
}

export async function visitClassmatePlanet({ auth, baseUrl = '', peerId } = {}) {
  try {
    if (!peerId) return null;
    const headers = await authHeaders(auth);
    if (!headers) return null;
    const res = await fetch(`${baseUrl}/api/universe/playground/visit/${encodeURIComponent(peerId)}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.visit || null;
  } catch {
    return null;
  }
}

export async function sendCoopAidRemote({ auth, baseUrl = '', targetPlanetId, targetPeerId = null } = {}) {
  try {
    if (!targetPlanetId) return null;
    const headers = await authHeaders(auth);
    if (!headers) return null;
    const res = await fetch(`${baseUrl}/api/universe/playground/aid`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contractVersion: API_CONTRACT_VERSION,
        targetPlanetId,
        ...(targetPeerId ? { targetPeerId } : {})
      })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
