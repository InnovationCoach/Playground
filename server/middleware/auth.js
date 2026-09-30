import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '../auth.js';
import { sendError } from '../lib/errors.js';

/**
 * Express middleware for Admin, Parent, and Session endpoints.
 * Enforces checkRevoked = true on verifyIdToken and attaches custom claims to req.caller.
 */
export async function requireClaims(req, res, next) {
  const adminReady = initAdmin();
  if (!adminReady) {
    return sendError(res, 500, 'INTERNAL', 'Server authentication is not configured.');
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Sign-in required.');
  }

  try {
    // verifyIdToken(token, checkRevoked = true)
    const decoded = await getAuth().verifyIdToken(token, true);

    // Fetch user profile document for mirror check & full details if needed
    const userDocSnap = await getFirestore().collection('users').doc(decoded.uid).get();
    const userData = userDocSnap.exists ? userDocSnap.data() : {};

    // Immediate refusal for suspended accounts
    if (userData.status === 'suspended' || decoded.disabled) {
      return sendError(res, 401, 'UNAUTHENTICATED', 'Your account has been suspended.');
    }

    const role = decoded.role || userData.role || 'student';
    const orgId = decoded.orgId || userData.orgId || 'org-welearn';
    const schoolIds = decoded.schoolIds || userData.schoolIds || [];
    const classIds = decoded.classIds || userData.classIds || [];
    const displayName = userData.displayName || decoded.name || decoded.email || decoded.uid;
    const publicId = userData.publicId || null;

    req.caller = {
      uid: decoded.uid,
      email: decoded.email,
      role,
      orgId,
      schoolIds,
      classIds,
      displayName,
      name: displayName,
      publicId
    };

    next();
  } catch (err) {
    console.error('[requireClaims Auth Error]:', err.message, err.code);
    if (err.code === 'auth/id-token-revoked' || err.code === 'auth/user-disabled') {
      return sendError(res, 401, 'UNAUTHENTICATED', 'Your session has been revoked.');
    }
    return sendError(res, 401, 'UNAUTHENTICATED', 'Your session has expired. Please sign in again.');
  }
}
