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
  const subSnap = await subRef.get();

  if (!subSnap.exists) {
    fail(404, 'NOT_FOUND', 'Submission not found.');
  }

  const sub = subSnap.data();
  const schoolId = sub.schoolId || caller.schoolIds[0] || '15';
  const classId = sub.classId;
  const studentId = sub.studentId;

  // 1. Verify Scope
  await schoolAccess(caller, schoolId);
  if (classId) {
    await assignedClass(caller, schoolId, classId);
  }
  if (studentId) {
    await learnerAccess(caller, schoolId, studentId, classId);
  }

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

  // 3. Resolve Mastery Learner
  const userRef = db.collection('users').doc(studentId);
  const userSnap = await userRef.get();
  const userData = userSnap.exists ? userSnap.data() : {};

  let masteryLearnerId = userData.masteryLearnerId || sub.mastery?.learnerId || null;

  if (!masteryLearnerId) {
    // Search sandbox by email or student ID
    try {
      const searchTarget = userData.email || studentId;
      const found = await masteryClient.searchLearners(15, searchTarget);
      if (found.length > 0) {
        masteryLearnerId = found[0].id;
      }
    } catch (err) {
      console.warn('[Mastery] Search learner failed, will attempt create:', err.message);
    }
  }

  if (!masteryLearnerId) {
    // In sandbox, provision or link test learner
    try {
      const names = (userData.displayName || sub.studentName || 'Learner').split(' ');
      const firstName = names[0] || 'Learner';
      const lastName = names.slice(1).join(' ') || 'Spark';
      const email = userData.email || `${studentId}@sandbox.welearn.org`;
      const externalId = `SPARK-${studentId.replace(/[^A-Za-z0-9]/g, '').slice(0, 14)}`;

      const created = await masteryClient.createLearner(15, {
        firstName,
        lastName,
        email,
        externalId,
        sendEmail: false
      });
      masteryLearnerId = created.id;
    } catch (err) {
      console.error('[Mastery] Failed creating learner in sandbox:', err.message);
      return res.status(502).json({
        success: false,
        code: 'MASTERY_LEARNER_UNAVAILABLE',
        error: `Could not link or create learner in Mastery sandbox: ${err.message}`
      });
    }

    // Cache masteryLearnerId on the user record for subsequent evaluations
    try {
      await userRef.set({ masteryLearnerId }, { merge: true });
    } catch (err) {
      console.warn('[Mastery] Failed caching masteryLearnerId on user:', err.message);
    }
  }

  // 4. Safe Replay / Idempotency Check
  const existingMastery = sub.mastery || {};
  let evidenceId = existingMastery.evidenceId || null;
  let evidenceNewlyCreated = false;

  // If evidence already exists, reuse it. Otherwise, create container.
  if (!evidenceId) {
    try {
      const title = `${sub.projectTitle || 'PBL Project'} — ${sub.milestoneTitle || 'Milestone Evidence'}`;
      const description = sub.reflection || sub.evidence?.reflection || `Approved deliverable for milestone ${sub.sessionNumber || 1}.`;

      const evResult = await masteryClient.createEvidence(masteryLearnerId, { title, description });
      evidenceId = evResult?.id || evResult;
      evidenceNewlyCreated = true;

      // Immediately write partial evidence progress to Firestore to guarantee safe retry
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
      return res.status(502).json({
        success: false,
        code: 'EVIDENCE_CREATION_FAILED',
        error: `Failed to create evidence in Mastery: ${err.message}`,
        canRetry: true
      });
    }
  }

  // 5. Associate Credit & Award Competency
  try {
    // Bulk attach credit to evidence container
    await masteryClient.attachCompetenciesToEvidence(evidenceId, [
      { id: credit.id, status: 'IN_PROGRESS' }
    ]);

    // Award credit on learner record: status 'EARNED'
    await masteryClient.updateLearnerCredit(masteryLearnerId, credit.id, {
      status: 'EARNED'
    });

    // 6. Post Coach Comment to Evidence (if feedback is provided and not already commented)
    if (coachFeedback && !existingMastery.commentPosted) {
      try {
        await masteryClient.addEvidenceComment(evidenceId, { content: coachFeedback });
      } catch (commentErr) {
        // Comment failure should not invalidate earned credit, but is noted
        console.warn('[Mastery] Failed adding comment to evidence:', commentErr.message);
      }
    }

    // 7. Confirmed Mastery Record
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
      commentPosted: Boolean(coachFeedback),
      error: null
    };

    await subRef.set({
      mastery: masteryRecord
    }, { merge: true });

    return res.json({
      success: true,
      mastery: masteryRecord
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
      partialSuccess: true,
      evidenceId,
      canRetry: true
    });
  }
}));

export default router;
