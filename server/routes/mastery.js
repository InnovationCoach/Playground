/**
 * Mastery Transcript Consortium (MTC) Server Route
 *
 * Implements server-authoritative Mastery recording for coach evaluations:
 * - Scoped coach authorization (school, class, learner, submission)
 * - Safe replay and idempotency (prevents duplicate evidence and comments on retry)
 * - Partial failure handling with stateful resumption
 * - Server-only credential isolation
 */

import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { schoolCaller, schoolAccess, assignedClass, learnerAccess, staff, fail, requireId } from '../lib/schoolScope.js';
import { masteryClient } from '../lib/masteryClient.js';
import { evaluateCompetencyMapping, resolveMasteryCredit } from '../lib/masteryCompetencyMap.js';

const router = Router();
router.use(requireClaims);

const route = (fn) => async (req, res, next) => {
  try {
    const caller = await schoolCaller(req);
    if (caller.role !== 'admin' && !staff(caller)) {
      fail(403, 'FORBIDDEN', 'Only administrators and assigned coaches can record to Mastery Transcript.');
    }
    await fn(req, res, caller);
  } catch (error) {
    if (error.status) {
      return sendError(res, error.status, error.code, error.message);
    }
    console.error('[Mastery Route Error]:', error);
    next(error);
  }
};

/**
 * GET /api/mastery/check-competency?competency=...
 * Evaluates whether a competency can be recorded to Mastery without making an external API call.
 */
router.get('/check-competency', route(async (req, res) => {
  const comp = req.query.competency;
  const evaluation = evaluateCompetencyMapping(comp);
  res.json(evaluation);
}));

/**
 * GET /api/mastery/evaluations/:submissionId/status
 * Fetches the current Mastery recording status for a submission.
 */
router.get('/evaluations/:submissionId/status', route(async (req, res, caller) => {
  const submissionId = requireId(req.params.submissionId);
  const db = getFirestore();
  const subSnap = await db.collection('submissions').doc(submissionId).get();

  if (!subSnap.exists) {
    fail(404, 'NOT_FOUND', 'Submission not found.');
  }

  const sub = subSnap.data();
  const schoolId = sub.schoolId || caller.schoolIds[0] || '15';

  if (caller.role !== 'admin') {
    await schoolAccess(caller, schoolId);
    if (sub.classId) {
      await assignedClass(caller, schoolId, sub.classId);
    }
    if (sub.studentId) {
      await learnerAccess(caller, schoolId, sub.studentId, sub.classId);
    }
  }

  res.json({
    submissionId,
    mastery: sub.mastery || null
  });
}));

/**
 * POST /api/mastery/evaluations/:submissionId/record
 *
 * Server-authoritative recording of an earned competency into the Mastery Sandbox:
 * 1. Verifies coach scope (school, class, learner).
 * 2. Resolves learner's Mastery ID (cached or looked up in sandbox).
 * 3. Resolves competency mapping against MCA framework 11.
 * 4. Idempotently creates or reuses evidence container.
 * 5. Associates competency and awards status: 'EARNED'.
 * 6. Adds coach formative feedback comment.
 * 7. Records confirmed outcome to the submission document.
 */
router.post('/evaluations/:submissionId/record', route(async (req, res, caller) => {
  const submissionId = requireId(req.params.submissionId);
  const body = req.body || {};
  const requestedCompetency = body.competency || null;
  const coachFeedback = body.feedback || '';

  const db = getFirestore();
  const subRef = db.collection('submissions').doc(submissionId);

  // 1. Initial Fetch & Scope Verification
  const subSnap = await subRef.get();
  if (!subSnap.exists) {
    fail(404, 'NOT_FOUND', 'Submission not found.');
  }

  const sub = subSnap.data();
  const schoolId = sub.schoolId || caller.schoolIds[0] || 15;
  const classId = sub.classId;
  const studentId = sub.studentId;

  if (!studentId) {
    fail(400, 'BAD_REQUEST', 'Submission has no associated studentId.');
  }

  await schoolAccess(caller, schoolId);
  if (classId) {
    await assignedClass(caller, schoolId, classId);
  }
  await learnerAccess(caller, schoolId, studentId, classId);

  // 2. Validate Competency Mapping
  const targetCompName = requestedCompetency || (Array.isArray(sub.competencies) && sub.competencies[0]) || null;
  const mappingEval = evaluateCompetencyMapping(targetCompName);

  if (!mappingEval.canRecord) {
    return res.status(422).json({
      success: false,
      code: 'UNMAPPED_COMPETENCY',
      canRecord: false,
      reason: mappingEval.reason,
      ordinaryApprovalAvailable: true
    });
  }

  const credit = mappingEval.credit;

  // 3. Concurrency Lock & Idempotency Check via Atomic Transaction
  const lockResult = await db.runTransaction(async (tx) => {
    const doc = await tx.get(subRef);
    if (!doc.exists) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Submission not found.' };
    }
    const currentData = doc.data();
    const existingMastery = currentData.mastery || {};

    // Idempotency: If already recorded with EARNED status for this credit, return success immediately
    if (existingMastery.status === 'recorded' && existingMastery.creditStatus === 'EARNED' && existingMastery.creditId === credit.id) {
      return { state: 'already_recorded', mastery: existingMastery };
    }

    // Concurrency Lock: If in progress within the last 45 seconds, reject concurrent request
    const now = Date.now();
    if (existingMastery.status === 'in_progress' && (now - (existingMastery.updatedAt || 0) < 45000)) {
      return { state: 'locked', mastery: existingMastery };
    }

    // Acquire lock
    tx.set(subRef, {
      mastery: {
        status: 'in_progress',
        evidenceId: existingMastery.evidenceId || null,
        learnerId: existingMastery.learnerId || null,
        creditId: credit.id,
        lockedBy: caller.uid,
        updatedAt: now
      }
    }, { merge: true });

    return { state: 'acquired', existingMastery };
  });

  if (lockResult.state === 'already_recorded') {
    return res.json({
      success: true,
      alreadyRecorded: true,
      sparkApproved: true,
      mastery: lockResult.mastery
    });
  }

  if (lockResult.state === 'locked') {
    return res.status(409).json({
      success: false,
      code: 'RECORDING_IN_PROGRESS',
      error: 'A Mastery recording operation for this submission is currently in progress. Please wait a moment and refresh.'
    });
  }

  const existingMastery = lockResult.existingMastery || {};

  // 4. Resolve Mastery Learner (P0-01: Server-authoritative resolution, fail-closed, no student-supplied override)
  const userRef = db.collection('users').doc(studentId);
  const userSnap = await userRef.get();
  const userData = userSnap.exists ? userSnap.data() : {};

  const expectedExternalId = `SPARK-${studentId.replace(/[^A-Za-z0-9]/g, '').slice(0, 14)}`;
  let masteryLearnerId = null;

  // Check cached verified masteryLearnerId on user profile
  if (userData.masteryLearnerId) {
    try {
      const verified = await masteryClient.getLearner(userData.masteryLearnerId);
      if (verified && (verified.id === userData.masteryLearnerId || String(verified.id) === String(userData.masteryLearnerId))) {
        masteryLearnerId = verified.id;
      }
    } catch (err) {
      console.warn(`[Mastery] Cached learner ${userData.masteryLearnerId} verification failed:`, err.message);
    }
  }

  // If not verified from cache, perform exact lookup by externalId in school sandbox
  if (!masteryLearnerId) {
    try {
      const candidates = await masteryClient.searchLearners(schoolId, expectedExternalId);
      const exactMatches = candidates.filter(c => c.externalId === expectedExternalId);

      if (exactMatches.length === 1) {
        masteryLearnerId = exactMatches[0].id;
        // Cache verified mapping on user document
        await userRef.set({
          masteryLearnerId: exactMatches[0].id,
          masteryExternalId: expectedExternalId
        }, { merge: true });
      } else if (exactMatches.length > 1) {
        // Release lock
        await subRef.set({ mastery: { status: 'failed', error: 'Ambiguous learner mapping', updatedAt: Date.now() } }, { merge: true });
        return res.status(422).json({
          success: false,
          code: 'AMBIGUOUS_MASTERY_LEARNER',
          error: `Multiple learners found in Mastery sandbox matching externalId ${expectedExternalId}.`,
          ordinaryApprovalAvailable: true
        });
      }
    } catch (err) {
      console.warn(`[Mastery] Search by externalId failed:`, err.message);
    }
  }

  // If still not resolved, fail closed. Do NOT implicitly create learners during evaluation recording.
  if (!masteryLearnerId) {
    await subRef.set({
      mastery: {
        status: 'failed',
        error: `Unregistered learner: externalId ${expectedExternalId} not provisioned in Mastery sandbox school ${schoolId}`,
        updatedAt: Date.now()
      }
    }, { merge: true });

    return res.status(422).json({
      success: false,
      code: 'UNREGISTERED_MASTERY_LEARNER',
      error: `Learner ${studentId} (externalId: ${expectedExternalId}) is not registered in Mastery sandbox school ${schoolId}. Learner must be provisioned before recording competencies.`,
      ordinaryApprovalAvailable: true
    });
  }

  // 5. Evidence Container: Idempotently reuse existing or create once
  let evidenceId = existingMastery.evidenceId || null;
  let evidenceNewlyCreated = false;

  if (!evidenceId) {
    try {
      const title = `${sub.projectTitle || 'PBL Project'} — ${sub.milestoneTitle || 'Milestone Evidence'}`;
      const description = sub.reflection || sub.evidence?.reflection || `Approved deliverable for milestone ${sub.sessionNumber || 1}.`;

      const evResult = await masteryClient.createEvidence(masteryLearnerId, { title, description });
      evidenceId = evResult?.id || evResult;
      evidenceNewlyCreated = true;

      // Immediately persist evidenceId so any subsequent retry reuses it
      await subRef.set({
        mastery: {
          status: 'in_progress',
          evidenceId,
          learnerId: masteryLearnerId,
          creditId: credit.id,
          updatedAt: Date.now()
        }
      }, { merge: true });
    } catch (err) {
      console.error('[Mastery] Failed creating evidence container:', err.message);
      await subRef.set({
        mastery: {
          status: 'failed',
          learnerId: masteryLearnerId,
          creditId: credit.id,
          error: `Evidence creation failed: ${err.message}`,
          failedAt: Date.now()
        }
      }, { merge: true });

      return res.status(502).json({
        success: false,
        code: 'EVIDENCE_CREATION_FAILED',
        error: `Failed to create evidence in Mastery: ${err.message}`,
        creditAwarded: false,
        commentPosted: false,
        canRetry: true
      });
    }
  }

  // 6. Associate Credit & Award Competency
  try {
    // Bulk attach credit to evidence container
    await masteryClient.attachCompetenciesToEvidence(evidenceId, [
      { id: credit.id, status: 'IN_PROGRESS' }
    ]);

    // Award credit on learner record: status 'EARNED'
    await masteryClient.updateLearnerCredit(masteryLearnerId, credit.id, {
      status: 'EARNED'
    });

    // 7. Post Coach Formative Feedback (truthfully track whether comment succeeded)
    let commentPosted = false;
    if (coachFeedback && !existingMastery.commentPosted) {
      try {
        await masteryClient.addEvidenceComment(evidenceId, { content: coachFeedback });
        commentPosted = true;
      } catch (commentErr) {
        console.warn('[Mastery] Formative comment failed:', commentErr.message);
        commentPosted = false;
      }
    } else if (existingMastery.commentPosted) {
      commentPosted = true;
    }

    // 8. Confirmed Mastery Record
    const masteryRecord = {
      status: 'recorded',
      creditStatus: 'EARNED',
      creditId: credit.id,
      creditTitle: credit.title,
      area: credit.area,
      creditType: credit.type,
      evidenceId,
      learnerId: masteryLearnerId,
      recordedAt: Date.now(),
      recordedBy: caller.uid,
      commentPosted,
      error: null
    };

    await subRef.set({
      mastery: masteryRecord
    }, { merge: true });

    return res.json({
      success: true,
      sparkApproved: true,
      mastery: {
        ...masteryRecord,
        evidenceCreated: true,
        creditAwarded: true
      }
    });
  } catch (err) {
    console.error('[Mastery] Failed awarding credit or updating evidence:', err.message);

    // Save partial failure state on the submission doc with evidenceId intact for retry
    await subRef.set({
      mastery: {
        status: 'failed',
        evidenceId,
        learnerId: masteryLearnerId,
        creditId: credit.id,
        error: err.message,
        failedAt: Date.now()
      }
    }, { merge: true });

    return res.status(502).json({
      success: false,
      code: 'MASTERY_RECORDING_FAILED',
      error: err.message,
      partialSuccess: Boolean(evidenceId),
      evidenceId,
      creditAwarded: false,
      commentPosted: false,
      canRetry: true
    });
  }
}));

export default router;
