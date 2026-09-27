import { initializeApp, getApps, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createApp } from '../../server/app.js';

const PROJECT_ID = 'demo-hearisland-local';
const AUTH_EMULATOR_HOST = '127.0.0.1:9099';
const FIRESTORE_EMULATOR_HOST = '127.0.0.1:8088';

process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR_HOST;
process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;

export async function setupApiTestEnv() {
  if (!getApps().length) {
    initializeApp({ projectId: PROJECT_ID });
  }

  const auth = getAuth();
  const db = getFirestore();
  const app = createApp();

  // Start server on random free port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  async function getIdToken(uid, claims = {}) {
    // Create or update user in auth emulator
    try {
      await auth.getUser(uid);
    } catch {
      await auth.createUser({ uid, email: `${uid}@welearn.test`, emailVerified: true });
    }

    if (Object.keys(claims).length) {
      await auth.setCustomUserClaims(uid, claims);
    }

    const customToken = await auth.createCustomToken(uid, claims);

    // Exchange custom token for ID token via Auth emulator REST endpoint
    const response = await fetch(`http://${AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    });

    const data = await response.json();
    return data.idToken;
  }

  async function request(method, path, options = {}) {
    const { token, body, query } = options;
    let url = `${baseUrl}${path}`;

    if (query) {
      const searchParams = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) searchParams.append(k, String(v));
      });
      const qStr = searchParams.toString();
      if (qStr) url += `?${qStr}`;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {})
    });

    const status = response.status;
    let resBody = null;
    try {
      resBody = await response.json();
    } catch {
      resBody = null;
    }

    return { status, body: resBody };
  }

  function teardown() {
    return new Promise((resolve) => {
      server.close(() => resolve());
    });
  }

  return { auth, db, baseUrl, getIdToken, request, teardown };
}
