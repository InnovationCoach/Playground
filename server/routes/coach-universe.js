import { Router } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { writeAuditLog } from '../lib/audit.js';

const router = Router();

function isCoachRole(role) {
  return ['teacher', 'coach', 'admin', 'supervisor'].includes(role);
}

/**
 * GET /api/coach/universe/submissions?status=submitted
 * Retrieve pending submissions for learners in the coach's classes.
 */
router.get('/submissions', requireClaims, async (req, res) => {
  const caller = req.caller;
  if (!isCoachRole(caller?.role)) {
    return sendError(res, 403, 'FORBIDDEN', 'Only coaches and teachers may view universe submissions.');
  }

  const coachClassIds = Array.isArray(caller.classIds) ? caller.classIds : [];
  const isAdmin = ['admin', 'supervisor'].includes(caller.role);

  if (!isAdmin && coachClassIds.length === 0) {
    return res.json({ submissions: [] });
  }

  const { status = 'submitted' } = req.query;

  try {
    const db = getFirestore();
    let queryRef = db.collection('missionSubmissions');

    if (status) {
      queryRef = queryRef.where('status', '==', status);
    }

    const snap = await queryRef.get();
    let submissions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter to coach's class tenancy (unless admin)
    if (!isAdmin) {
      submissions = submissions.filter(sub => {
        const subClassIds = Array.isArray(sub.classIds) ? sub.classIds : [];
        return subClassIds.some(cid => coachClassIds.includes(cid));
      });
    }

    // Sort newest first
    submissions.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    return res.json({ submissions });
  } catch (err) {
    console.error('[Coach Universe Submissions Error]:', err);
    return sendError(res, 500, 'INTERNAL', 'Failed to fetch coach universe submissions.');
  }
});

/**
 * POST /api/coach/universe/submissions/:id/review
 * Coach reviews a submission: decision is 'approved' | 'returned'.
 */
router.post('/submissions/:id/review', requireClaims, async (req, res) => {
  const caller = req.caller;
  if (!isCoachRole(caller?.role)) {
    return sendError(res, 403, 'FORBIDDEN', 'Only coaches and teachers may review universe submissions.');
  }

  const { id } = req.params;
  const { decision, note } = req.body || {};

  if (!['approved', 'returned'].includes(decision)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Decision must be either "approved" or "returned".');
  }

  if (note !== undefined && note !== null && (typeof note !== 'string' || note.length > 1000)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Note must be a string of at most 1,000 characters.');
  }

  const db = getFirestore();
  const subRef = db.collection('missionSubmissions').doc(id);

  try {
    const subDoc = await subRef.get();
    if (!subDoc.exists) {
      return sendError(res, 404, 'NOT_FOUND', 'Submission not found.');
    }

    const subData = subDoc.data();

    // Must be in 'submitted' status
    if (subData.status !== 'submitted') {
      return sendError(res, 409, 'CONFLICT', `Submission has already been reviewed (status is "${subData.status}").`);
    }

    // Tenancy check: Coach must share a class with the learner (unless admin)
    const isAdmin = ['admin', 'supervisor'].includes(caller.role);
    const coachClassIds = Array.isArray(caller.classIds) ? caller.classIds : [];
    const subClassIds = Array.isArray(subData.classIds) ? subData.classIds : [];

    if (!isAdmin && !subClassIds.some(cid => coachClassIds.includes(cid))) {
      return sendError(res, 403, 'FORBIDDEN', 'You do not share a class with this learner.');
    }

    const updatePayload = {
      status: decision,
      coachUid: caller.uid,
      coachNote: note ? note.trim() : null,
      reviewedAt: FieldValue.serverTimestamp()
    };

    await subRef.update(updatePayload);

    // Audit log via server/lib/audit.js
    await writeAuditLog(db, {
      caller: {
        uid: caller.uid,
        role: caller.role,
        orgId: caller.orgId,
        displayName: caller.displayName
      },
      subjectUid: subData.learnerUid,
      action: `universe.mission.${decision}`,
      summary: `Coach ${caller.displayName || caller.uid} ${decision} mission submission ${id} for mission ${subData.missionId}`,
      details: {
        submissionId: id,
        missionId: subData.missionId,
        decision,
        note: note ? note.trim() : null
      }
    });

    return res.json({
      id,
      status: decision,
      coachUid: caller.uid,
      reviewedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Coach Universe Review Error]:', err);
    return sendError(res, 500, 'INTERNAL', 'Failed to review mission submission.');
  }
});

export default router;
