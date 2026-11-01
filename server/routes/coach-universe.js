import { Router } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { writeAuditLog } from '../lib/audit.js';

const router = Router();

function isCoachRole(role) {
  return ['teacher', 'coach', 'admin', 'supervisor'].includes(role);
}

function chunkArray(items, size = 30) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * GET /api/coach/universe/submissions?status=submitted
 * Retrieve pending submissions for learners in the coach's classes (chunked by 30).
 * Admins/supervisors are scoped to their orgId.
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
    let submissions = [];

    if (isAdmin) {
      // Admins/supervisors scoped to their orgId
      const orgId = caller.orgId || 'org-welearn';
      let queryRef = db.collection('missionSubmissions').where('orgId', '==', orgId);
      if (status) {
        queryRef = queryRef.where('status', '==', status);
      }
      const snap = await queryRef.get();
      submissions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      // Coaches queried directly by class tenancy using array-contains-any (chunked by 30)
      const chunks = chunkArray(coachClassIds, 30);
      const snaps = await Promise.all(
        chunks.map(chunk => {
          let q = db.collection('missionSubmissions');
          if (status) {
            q = q.where('status', '==', status);
          }
          return q.where('classIds', 'array-contains-any', chunk).get();
        })
      );

      const subMap = new Map();
      for (const snap of snaps) {
        for (const doc of snap.docs) {
          if (!subMap.has(doc.id)) {
            subMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        }
      }
      submissions = Array.from(subMap.values());
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
 * Coach reviews a submission atomically in a Firestore transaction.
 * Decision is 'approved' | 'returned'. Status must still be 'submitted'.
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
    let subData;
    await db.runTransaction(async (transaction) => {
      const subDoc = await transaction.get(subRef);
      if (!subDoc.exists) {
        const notFoundErr = new Error('Submission not found.');
        notFoundErr.statusCode = 404;
        notFoundErr.code = 'NOT_FOUND';
        throw notFoundErr;
      }

      subData = subDoc.data();

      // Must still be in 'submitted' status
      if (subData.status !== 'submitted') {
        const conflictErr = new Error(`Submission has already been reviewed (status is "${subData.status}").`);
        conflictErr.statusCode = 409;
        conflictErr.code = 'CONFLICT';
        throw conflictErr;
      }

      // Tenancy check: Coach must share a class with the learner (unless admin)
      const isAdmin = ['admin', 'supervisor'].includes(caller.role);
      const coachClassIds = Array.isArray(caller.classIds) ? caller.classIds : [];
      const subClassIds = Array.isArray(subData.classIds) ? subData.classIds : [];

      if (!isAdmin) {
        if (!subClassIds.some(cid => coachClassIds.includes(cid))) {
          const forbiddenErr = new Error('You do not share a class with this learner.');
          forbiddenErr.statusCode = 403;
          forbiddenErr.code = 'FORBIDDEN';
          throw forbiddenErr;
        }
      } else {
        // Admin tenancy check: orgId scoping
        if (subData.orgId && caller.orgId && subData.orgId !== caller.orgId) {
          const forbiddenErr = new Error('Submission belongs to another organization.');
          forbiddenErr.statusCode = 403;
          forbiddenErr.code = 'FORBIDDEN';
          throw forbiddenErr;
        }
      }

      transaction.update(subRef, {
        status: decision,
        coachUid: caller.uid,
        coachNote: note ? note.trim() : null,
        reviewedAt: FieldValue.serverTimestamp()
      });
    });

    // Audit log via server/lib/audit.js written after transaction commits
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
    if (err.statusCode && err.code) {
      return sendError(res, err.statusCode, err.code, err.message);
    }
    console.error('[Coach Universe Review Error]:', err);
    return sendError(res, 500, 'INTERNAL', 'Failed to review mission submission.');
  }
});

export default router;
