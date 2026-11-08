import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createApp } from '../../server/app.js';
import { FIXTURE_RELEASES } from '../../shared/universe/fixtures/index.js';

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'demo-hearisland-rules';
if (!PROJECT_ID.startsWith('demo-') || PROJECT_ID.length <= 5) {
  throw new Error(`Safety guard: tests must run against a demo project (starts with 'demo-'), but got '${PROJECT_ID}'.`);
}
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error('Safety guard: GOOGLE_APPLICATION_CREDENTIALS must not be set during emulator tests.');
}

const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_FIRESTORE_EMULATOR_ADDRESS || '127.0.0.1:8088';

if (
  !/^(127\.0\.0\.1|localhost):\d+$/.test(AUTH_EMULATOR_HOST) ||
  !/^(127\.0\.0\.1|localhost):\d+$/.test(FIRESTORE_EMULATOR_HOST)
) {
  throw new Error(
    `Safety guard: emulator hosts must point to localhost/127.0.0.1, got auth='${AUTH_EMULATOR_HOST}', firestore='${FIRESTORE_EMULATOR_HOST}'.`
  );
}

process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR_HOST;
process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;

export async function setupApiTestEnv(options = {}) {
  const { universeRegistry = FIXTURE_RELEASES } = options;

  if (!getApps().length) {
    initializeApp({ projectId: PROJECT_ID });
  }

  const auth = getAuth();
  const db = getFirestore();
  const app = createApp({ universeRegistry });

  // Start server on random free port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  async function getIdToken(uid, claims = null) {
    // Create or update user in auth emulator
    try {
      await auth.getUser(uid);
    } catch {
      await auth.createUser({ uid, email: `${uid}@welearn.test`, emailVerified: true });
    }

    if (claims !== null) {
      await auth.setCustomUserClaims(uid, claims);
    }

    const customToken = await auth.createCustomToken(uid);

    // Exchange custom token for ID token via Auth emulator REST endpoint
    const response = await fetch(
      `http://${AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-key`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true })
      }
    );

    const data = await response.json();
    return data.idToken;
  }

  async function request(method, path, reqOptions = {}) {
    const { token, body, rawBody, query, headers: extraHeaders = {} } = reqOptions;
    let url = `${baseUrl}${path}`;

    if (query) {
      const searchParams = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) searchParams.append(k, String(v));
      });
      const qStr = searchParams.toString();
      if (qStr) url += `?${qStr}`;
    }

    const headers = { 'Content-Type': 'application/json', ...extraHeaders };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions = {
      method,
      headers
    };

    if (typeof rawBody === 'string') {
      fetchOptions.body = rawBody;
    } else if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    const status = response.status;
    let resBody = null;
    try {
      resBody = await response.json();
    } catch {
      resBody = null;
    }

    const resHeaders = {};
    response.headers.forEach((value, key) => {
      resHeaders[key.toLowerCase()] = value;
    });

    return { status, body: resBody, headers: resHeaders };
  }

  function teardown() {
    return new Promise((resolve) => {
      server.close(() => resolve());
    });
  }

  return { app, auth, db, baseUrl, getIdToken, request, teardown };
}
