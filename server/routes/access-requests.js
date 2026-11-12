import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import {
  submitOrGetAccessRequest,
  reviewAccessRequest,
  verifyMicrosoftIdToken,
  completeMicrosoftLink,
  isSsoApprover,
  SsoError
} from '../lib/microsoft-sso-auth.js';

const router = Router();

function fail(res, err, fallbackCode) {
  if (err instanceof SsoError) return sendError(res, err.status, err.code, err.message);
  console.error('[sso]', err);
  return sendError(res, 500, fallbackCode, 'Something went wrong. Please try again.');
}

/**
 * First-time user submits an access request after signing in with Microsoft 365.
 * The body must carry the Microsoft ID token, which is verified against the approved tenant.
 * Idempotent: repeated submissions return the existing record.
 */
router.post('/auth/access-request', requireClaims, async (req, res) => {
  try {
    const { microsoftIdToken, givenNames = '', surname = '', requestedRole = 'student', reason = '' } = req.body || {};
    const verified = await verifyMicrosoftIdToken(microsoftIdToken);
    const result = await submitOrGetAccessRequest(getFirestore(), req.caller.signedClaims, { givenNames, surname, requestedRole, reason }, verified);
    return res.status(result.isNew ? 201 : 200).json({ ok: true, isNew: result.isNew, duplicate: result.duplicate, request: result.request });
  } catch (err) {
    return fail(res, err, 'VALIDATION');
  }
});

/** The caller's own request status. Reachable while the account is pending or rejected. */
router.get('/auth/access-request/me', requireClaims, async (req, res) => {
  try {
    const snap = await getFirestore().collection('accessRequests').doc(`req_${req.caller.uid}`).get();
    return res.json({ ok: true, hasRequest: snap.exists, request: snap.exists ? snap.data() : null });
  } catch (err) {
    return fail(res, err, 'INTERNAL');
  }
});

/**
 * An existing Spark account finishes linking Microsoft 365 after the client attached the provider.
 * Requires an administrator registration for this account; see completeMicrosoftLink.
 */
router.post('/auth/link-microsoft', requireClaims, async (req, res) => {
  try {
    const verified = await verifyMicrosoftIdToken((req.body || {}).microsoftIdToken);
    const result = await completeMicrosoftLink(getFirestore(), getAuth(), req.caller.signedClaims, verified);
    return res.json({ ok: true, linked: true, ...result });
  } catch (err) {
    return fail(res, err, 'LINKING_FAILED');
  }
});

/** Pending and decided requests, for the designated approver only. */
router.get('/admin/access-requests', requireClaims, async (req, res) => {
  if (!isSsoApprover(req.caller)) {
    return sendError(res, 403, 'FORBIDDEN', 'Only a designated Spark administrator may review access requests.');
  }
  try {
    const status = req.query.status || 'pending';
    let query = getFirestore().collection('accessRequests');
    if (status !== 'all') query = query.where('status', '==', status);
    const snap = await query.get();
    const items = snap.docs.map((d) => d.data());
    return res.json({ ok: true, total: items.length, items });
  } catch (err) {
    return fail(res, err, 'INTERNAL');
  }
});

router.post('/admin/access-requests/:id/review', requireClaims, async (req, res) => {
  const { decision, assignedRole = 'student', rejectionReason = '' } = req.body || {};
  try {
    const result = await reviewAccessRequest(getFirestore(), getAuth(), req.caller, req.params.id, { decision, assignedRole, rejectionReason });
    return res.json({ ok: true, ...result });
  } catch (err) {
    return fail(res, err, 'REVIEW_FAILED');
  }
});

export default router;
