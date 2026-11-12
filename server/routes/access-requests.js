import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import {
  submitOrGetAccessRequest,
  reviewAccessRequest,
  validateMicrosoftIdentity,
  verifyAccountLinking,
  MANI_ADMIN_EMAIL
} from '../lib/microsoft-sso-auth.js';

const router = Router();

/**
 * First-time user submits an access request after signing in with Microsoft 365.
 * Idempotent: repeated submissions return the existing pending/reviewed record.
 */
router.post('/auth/access-request', requireClaims, async (req, res) => {
  const db = getFirestore();
  const callerToken = req.caller?.signedClaims;

  if (!callerToken) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Valid session token required.');
  }

  try {
    const { givenNames = '', surname = '', requestedRole = 'student', reason = '' } = req.body || {};
    const result = await submitOrGetAccessRequest(db, callerToken, {
      givenNames,
      surname,
      requestedRole,
      reason
    });

    return res.status(result.isNew ? 201 : 200).json({
      ok: true,
      isNew: result.isNew,
      duplicate: result.duplicate,
      request: result.request
    });
  } catch (err) {
    const status = err.status || 400;
    const code = err.code || 'VALIDATION';
    return sendError(res, status, code, err.message);
  }
});

/**
 * Current user checks their own access request status.
 * Accessible even when the account status is 'pending' or 'rejected'.
 */
router.get('/auth/access-request/me', requireClaims, async (req, res) => {
  const db = getFirestore();
  const uid = req.caller.uid;

  try {
    const docSnap = await db.collection('accessRequests').doc(`req_${uid}`).get();
    if (!docSnap.exists) {
      return res.json({
        ok: true,
        hasRequest: false,
        request: null
      });
    }

    return res.json({
      ok: true,
      hasRequest: true,
      request: docSnap.data()
    });
  } catch (err) {
    return sendError(res, 500, 'INTERNAL', err.message);
  }
});

/**
 * Verify and record account linking from password account to Microsoft 365.
 */
router.post('/auth/verify-linking', requireClaims, async (req, res) => {
  const db = getFirestore();
  const auth = getAuth();
  const uid = req.caller.uid;

  try {
    const authUser = await auth.getUser(uid);
    const existingProfile = req.callerUserData || {};
    const existingClaims = req.caller.signedClaims || {};

    const check = verifyAccountLinking(existingProfile, existingClaims, authUser);
    if (!check.valid) {
      return sendError(res, 400, 'LINKING_FAILED', check.error);
    }

    return res.json({
      ok: true,
      linked: true,
      uid: check.uid,
      email: check.email
    });
  } catch (err) {
    return sendError(res, 500, 'INTERNAL', err.message);
  }
});

/**
 * List all access requests for administrative review.
 * Bound strictly to Mani (mani@welearn.org) with admin role.
 */
router.get('/admin/access-requests', requireClaims, async (req, res) => {
  const caller = req.caller;
  if (!caller || caller.email?.toLowerCase() !== MANI_ADMIN_EMAIL || caller.role !== 'admin') {
    return sendError(res, 403, 'FORBIDDEN', 'Only Mani (Platform Lead, Platform Admin) may review access requests.');
  }

  const db = getFirestore();
  const statusFilter = req.query.status || 'pending'; // 'pending' | 'approved' | 'rejected' | 'all'

  try {
    let query = db.collection('accessRequests');
    if (statusFilter !== 'all') {
      query = query.where('status', '==', statusFilter);
    }

    const snap = await query.get();
    const requests = snap.docs.map((d) => d.data());
    return res.json({
      ok: true,
      total: requests.length,
      items: requests
    });
  } catch (err) {
    return sendError(res, 500, 'INTERNAL', err.message);
  }
});

/**
 * Approve or reject an access request.
 * Bound strictly to Mani (mani@welearn.org) with admin role.
 */
router.post('/admin/access-requests/:id/review', requireClaims, async (req, res) => {
  const caller = req.caller;
  const requestId = req.params.id;
  const { decision, assignedRole = 'student', rejectionReason = '' } = req.body || {};

  const db = getFirestore();
  const auth = getAuth();

  try {
    const result = await reviewAccessRequest(db, auth, caller, requestId, {
      decision,
      assignedRole,
      rejectionReason
    });

    return res.json({
      ok: true,
      ...result
    });
  } catch (err) {
    const status = err.status || 400;
    const code = err.code || 'REVIEW_FAILED';
    return sendError(res, status, code, err.message);
  }
});

export default router;
