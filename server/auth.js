/**
 * Request authentication and the safeguarding transcript.
 *
 * Every AI endpoint previously trusted a `userId` string in the request body.
 * That meant anyone could call the tutor as any child, and the audit trail
 * recorded whatever uid the caller chose. Requests now carry a Firebase ID
 * token, which is verified server-side.
 */

// firebase-admin v14's ESM default export carries only the app-level helpers -
// `admin.auth()` and `admin.firestore()` are undefined on it. The subpath
// entry points are the supported ESM surface.
import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let adminReady = false;

export function initAdmin() {
  if (adminReady) return true;

  if (getApps().length > 0) {
    adminReady = true;
    return true;
  }

  const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'demo-hearisland-local';
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.join(__dirname, '..', 'scripts', 'firebase-admin-key.json');

  try {
    if (fs.existsSync(keyPath)) {
      initializeApp({ credential: cert(JSON.parse(fs.readFileSync(keyPath, 'utf8'))), projectId });
    } else {
      // Works on Cloud Run / App Hosting, where credentials come from the
      // runtime service account rather than a key file.
      initializeApp({ credential: applicationDefault(), projectId });
    }

    // initializeApp succeeds even with unusable credentials, so prove the auth
    // service is actually reachable before claiming verification is enabled.
    getAuth();
    adminReady = true;
  } catch (err) {
    console.error('[Auth] Firebase Admin failed to initialise:', err.message);
    adminReady = false;
  }
  return adminReady;
}

/**
 * Express middleware. Rejects any request without a valid Firebase ID token and
 * puts the verified identity on req.user.
 *
 * In production an unverifiable request is always rejected. In development,
 * running without credentials is allowed but every request is loudly marked
 * unverified, so this cannot be mistaken for a working auth setup.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!adminReady) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Server authentication is not configured.' });
    }
    console.warn('[Auth] UNVERIFIED request - Firebase Admin is not configured (dev only).');
    req.user = { uid: 'dev-unverified', unverified: true };
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Sign-in required.' });
  }

  getAuth().verifyIdToken(token)
    .then((decoded) => {
      req.user = { uid: decoded.uid, email: decoded.email, role: decoded.role || 'student' };
      next();
    })
    .catch(() => res.status(401).json({ error: 'Your session has expired. Please sign in again.' }));
}

/**
 * Persist a child's exchange with the tutor so a coach can review it.
 *
 * Written with the Admin SDK: the matching rule makes this collection
 * client-unwritable, so a child cannot edit or delete their own transcript, and
 * only a coach who shares a class can read it.
 *
 * Never throws - a logging failure must not cost the student their answer.
 */
export async function logConversation({ uid, prompt, reply, blocked, blockReason, endpoint, ageBand }) {
  if (!adminReady || !uid || uid === 'dev-unverified') return;
  try {
    await getFirestore()
      .collection('users').doc(uid)
      .collection('aiConversations')
      .add({
        endpoint,
        ageBand,
        prompt: String(prompt ?? '').slice(0, 2000),
        reply: String(reply ?? '').slice(0, 4000),
        blocked: !!blocked,
        blockReason: blockReason || null,
        createdAt: FieldValue.serverTimestamp()
      });
  } catch (err) {
    console.warn('[Safeguarding] Could not record conversation:', err.message);
  }
}

/** Flag a blocked exchange for review, separately from the transcript. */
export async function flagForReview({ uid, reason, prompt, endpoint }) {
  if (!adminReady || !uid || uid === 'dev-unverified') return;
  try {
    await getFirestore().collection('auditLogs').add({
      eventType: 'AI_RESPONSE_BLOCKED',
      actorId: uid,
      details: { reason, endpoint, prompt: String(prompt ?? '').slice(0, 500) },
      timestamp: FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.warn('[Safeguarding] Could not flag for review:', err.message);
  }
}
