/**
 * Mastery Transcript Consortium (MTC) Server Route
 *
 * Implements server-authoritative Mastery recording for coach evaluations:
 * - Scoped coach authorization (school, class, learner, submission)
 * - Server-owned collision-resistant learner identity with ownership verification
 * - Server-authoritative coursework competency validation
 * - Operation fencing, durable leases, and vendor-side evidence reconciliation
 * - Granular phase tracking (evidence, credit, comment) with feedback-only retry
 * - Server-only credential isolation
 */

import { Router } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { schoolCaller, schoolAccess, assignedClass, learnerAccess, staff, fail, requireId } from '../lib/schoolScope.js';
import { masteryClient } from '../lib/masteryClient.js';
import { evaluateCompetencyMapping, resolveMasteryCredit } from '../lib/masteryCompetencyMap.js';

const router = Router();
router.use(requireClaims);

/**
 * Approved Spark schoolId to Mastery schoolId mapping table.
 * Rejects arbitrary or unapproved tenant scopes.
 */
export const APPROVED_SPARK_TO_MASTERY_SCHOOLS = Object.freeze({
  'school-wls-pbl': 15,
  'welearn-academy': 15,
  'wls-academy-us': 15,
  '15': 15
});

/**
 * Deterministic, collision-resistant Mastery external ID derivation.
 * Guarantees uniqueness within Mastery's 20-character limit even when
 * Spark UIDs share initial prefixes.
 */
export function buildDeterministicMasteryExternalId(sparkUid) {
  if (!sparkUid || typeof sparkUid !== 'string') {
    throw new Error('Valid sparkUid required for externalId derivation');
  }
  const clean = sparkUid.trim();
  // For short alphanumeric UIDs (<= 14 chars), use SPARK-<clean> (matches sandbox synthetic test accounts like SPARK-MWD1CP92)
  if (/^[A-Za-z0-9_-]{1,14}$/.test(clean)) {
    return `SPARK-${clean.toUpperCase()}`;
  }
  // For longer UIDs or UIDs with special characters, use SHA-256 digest prefix to strictly prevent prefix collisions within 20 chars
  const hash = createHash('sha256').update(clean).digest('hex').slice(0, 14).toUpperCase();
  return `SP-${hash}`; // exactly 17 characters total, <= 20
}

/**
 * Resolves server-authoritative coursework competencies from learning records
 * (activities, pbl_programs, assignments, weeklyTasks).
 */
export async function getAuthorizedCompetenciesForSubmission(db, sub) {
  const allowed = new Set();

  // 1. Check activities collection
  if (sub.activityId) {
    try {
      const actSnap = await db.collection('activities').doc(sub.activityId).get();
      if (actSnap.exists) {
        const actData = actSnap.data() || {};
        const comps = actData.competencies || actData.targetCompetencies || [];
        comps.forEach(c => {
          if (typeof c === 'string') allowed.add(c);
          else if (c?.title) allowed.add(c.title);
          else if (c?.code) allowed.add(c.code);
          else if (c?.id) allowed.add(c.id);
        });
      }
    } catch (err) {
      console.warn('[Mastery] Failed checking activities collection:', err.message);
    }
  }

  // 2. Check pbl_programs collection
  const progId = sub.programId || sub.activityId;
  if (progId) {
    try {
      const progSnap = await db.collection('pbl_programs').doc(progId).get();
      if (progSnap.exists) {
        const progData = progSnap.data() || {};
        const comps = progData.competencies || progData.targetCompetencies || [];
        comps.forEach(c => {
          if (typeof c === 'string') allowed.add(c);
          else if (c?.title) allowed.add(c.title);
          else if (c?.code) allowed.add(c.code);
          else if (c?.id) allowed.add(c.id);
        });

        if (Array.isArray(progData.milestones)) {
          progData.milestones.forEach(m => {
            if (m.sessionNumber === sub.sessionNumber || m.id === sub.milestoneId || !sub.milestoneId) {
              const mComps = m.competencies || [];
              mComps.forEach(c => {
                if (typeof c === 'string') allowed.add(c);
                else if (c?.title) allowed.add(c.title);
                else if (c?.code) allowed.add(c.code);
                else if (c?.id) allowed.add(c.id);
              });
            }
          });
        }
      }
    } catch (err) {
      console.warn('[Mastery] Failed checking pbl_programs collection:', err.message);
    }
  }

  // 3. Check assignments & weeklyTasks
  const taskId = sub.taskId || sub.assignmentId || sub.activityId;
  if (taskId) {
    try {
      const [taskSnap, assignSnap] = await Promise.all([
        db.collection('weeklyTasks').doc(taskId).get(),
        db.collection('assignments').doc(taskId).get()
      ]);
      if (taskSnap.exists) {
        const tData = taskSnap.data() || {};
        (tData.competencies || []).forEach(c => allowed.add(typeof c === 'string' ? c : c.title || c.code || c.id));
      }
      if (assignSnap.exists) {
        const aData = assignSnap.data() || {};
        (aData.competencies || []).forEach(c => allowed.add(typeof c === 'string' ? c : c.title || c.code || c.id));
      }
    } catch (err) {
      console.warn('[Mastery] Failed checking tasks/assignments:', err.message);
    }
  }

  return Array.from(allowed).filter(Boolean);
}

function isCompetencyAuthorized(requestedName, credit, allowedList) {
  if (!allowedList || allowedList.length === 0) return false;
  const reqNorm = (requestedName || '').toLowerCase().trim();
  const creditTitleNorm = (credit.title || '').toLowerCase().trim();
  const creditCode = (credit.title.match(/^\d+(\.\d+)*/)?.[0] || '').toLowerCase();

  return allowedList.some(item => {
    const norm = String(item).toLowerCase().trim();
    if (norm === reqNorm || norm === creditTitleNorm) return true;
    if (creditCode && norm.startsWith(creditCode)) return true;
    return false;
  });
}

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
 */
router.get('/check-competency', route(async (req, res) => {
  const comp = req.query.competency;
  const evaluation = evaluateCompetencyMapping(comp);
  res.json(evaluation);
}));

/**
 * GET /api/mastery/evaluations/:submissionId/status
 */
router.get('/evaluations/:submissionId/status', route(async (req, res, caller) => {
  const submissionId = requireId(req.params.submissionId);
  const db = getFirestore();
  const subSnap = await db.collection('submissions').doc(submissionId).get();

  if (!subSnap.exists) {
    fail(404, 'NOT_FOUND', 'Submission not found.');
  }

  const sub = subSnap.data();
  const rawSchoolId = sub.schoolId;
  if (!rawSchoolId) {
    fail(400, 'MISSING_SCHOOL_SCOPE', 'Submission missing school scope.');
  }

  if (caller.role !== 'admin') {
    await schoolAccess(caller, rawSchoolId);
    if (sub.classId) {
      await assignedClass(caller, rawSchoolId, sub.classId);
    }
    if (sub.studentId) {
      await learnerAccess(caller, rawSchoolId, sub.studentId, sub.classId);
    }
  }

  res.json({
    submissionId,
    mastery: sub.mastery || null
  });
}));

/**
 * POST /api/mastery/evaluations/:submissionId/record
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
  const rawSchoolId = sub.schoolId;
  if (!rawSchoolId) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_SCHOOL_SCOPE',
      error: 'Submission does not have an associated schoolId.',
      ordinaryApprovalAvailable: true
    });
  }

  const masterySchoolId = APPROVED_SPARK_TO_MASTERY_SCHOOLS[String(rawSchoolId)];
  if (!masterySchoolId) {
    return res.status(422).json({
      success: false,
      code: 'UNAPPROVED_SCHOOL_SCOPE',
      error: `Spark school '${rawSchoolId}' is not approved for Mastery recording in this environment.`,
      ordinaryApprovalAvailable: true
    });
  }

  const classId = sub.classId;
  const studentId = sub.studentId;

  if (!studentId) {
    fail(400, 'BAD_REQUEST', 'Submission has no associated studentId.');
  }

  await schoolAccess(caller, rawSchoolId);
  if (classId) {
    await assignedClass(caller, rawSchoolId, classId);
  }
  await learnerAccess(caller, rawSchoolId, studentId, classId);

  // 2. Validate Competency Mapping against MCA Framework
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

  // 3. Verify Competency Authorization against Server-Authoritative Learning Records
  const allowedCompetencies = await getAuthorizedCompetenciesForSubmission(db, sub);
  if (allowedCompetencies.length === 0) {
    return res.status(422).json({
      success: false,
      code: 'NO_AUTHORITATIVE_COURSEWORK',
      error: `No server-authoritative coursework record found for activity/program '${sub.activityId || sub.programId || 'unspecified'}'. Cannot verify competency authorization for evaluated work.`,
      ordinaryApprovalAvailable: true
    });
  }

  if (!isCompetencyAuthorized(targetCompName, credit, allowedCompetencies)) {
    return res.status(422).json({
      success: false,
      code: 'COMPETENCY_NOT_AUTHORIZED_FOR_WORK',
      error: `Competency '${targetCompName}' is not authorized for the evaluated coursework. Authorized competencies: ${allowedCompetencies.join(', ')}`,
      ordinaryApprovalAvailable: true
    });
  }

  // 4. Concurrency Lock, Lease Acquisition & Phase Check via Atomic Transaction
  const lockResult = await db.runTransaction(async (tx) => {
    const docSnap = await tx.get(subRef);
    if (!docSnap.exists) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Submission not found.' };
    }
    const currentData = docSnap.data();
    const m = currentData.mastery || {};
    const now = Date.now();

    const creditDone = (m.creditAwarded === true || m.creditStatus === 'EARNED') && m.creditId === credit.id;
    const commentDone = m.commentPosted === true || !coachFeedback;

    // Idempotency: Completely recorded already
    if (creditDone && commentDone && m.status === 'recorded') {
      return { state: 'already_recorded', mastery: m };
    }

    // Feedback-Only Retry Path: Credit is earned, but comment failed or is new
    if (creditDone && !commentDone) {
      const fenceToken = (m.fenceToken || 0) + 1;
      const lockId = randomUUID();
      tx.set(subRef, {
        mastery: {
          ...m,
          status: 'feedback_in_progress',
          fenceToken,
          lockId,
          lockedAt: now,
          leaseExpiresAt: now + 45000,
          updatedAt: now
        }
      }, { merge: true });
      return { state: 'feedback_retry', mastery: m, fenceToken, lockId };
    }

    // Active Lease Check: Reject concurrent operation
    if (m.status === 'in_progress' && m.leaseExpiresAt && now < m.leaseExpiresAt) {
      return { state: 'locked', mastery: m };
    }

    // Acquire new lease with monotonic fenceToken
    const fenceToken = (m.fenceToken || 0) + 1;
    const lockId = randomUUID();
    tx.set(subRef, {
      mastery: {
        ...m,
        status: 'in_progress',
        evidenceId: m.evidenceId || null,
        learnerId: m.learnerId || null,
        creditId: credit.id,
        fenceToken,
        lockId,
        lockedBy: caller.uid,
        lockedAt: now,
        leaseExpiresAt: now + 45000,
        updatedAt: now
      }
    }, { merge: true });

    return { state: 'acquired', mastery: m, fenceToken, lockId };
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

  const existingMastery = lockResult.mastery || {};
  const { fenceToken, lockId } = lockResult;

  // 5. Feedback-Only Retry Path (Credit is already awarded; bypass learner resolution)
  if (lockResult.state === 'feedback_retry') {
    const targetEvidenceId = existingMastery.evidenceId;
    if (!targetEvidenceId) {
      return res.status(502).json({
        success: false,
        code: 'MISSING_EVIDENCE_FOR_FEEDBACK',
        error: 'Cannot retry feedback without an existing evidence container.',
        creditAwarded: true,
        commentPosted: false,
        canRetry: false
      });
    }

    try {
      await masteryClient.addEvidenceComment(targetEvidenceId, { content: coachFeedback });

      // Verify fence before saving
      const curSnap = await subRef.get();
      if (curSnap.data()?.mastery?.fenceToken === fenceToken) {
        await subRef.set({
          mastery: {
            ...existingMastery,
            status: 'recorded',
            commentPosted: true,
            phases: {
              ...existingMastery.phases,
              comment: { status: 'posted', postedAt: Date.now() }
            },
            error: null,
            updatedAt: Date.now()
          }
        }, { merge: true });
      }

      return res.json({
        success: true,
        sparkApproved: true,
        mastery: {
          ...existingMastery,
          status: 'recorded',
          creditAwarded: true,
          commentPosted: true,
          evidenceId: targetEvidenceId,
          creditId: credit.id,
          feedbackOnlyRetry: true
        }
      });
    } catch (err) {
      return res.status(502).json({
        success: false,
        code: 'FEEDBACK_POST_FAILED',
        error: err.message,
        creditAwarded: true, // Truthful: credit is still earned
        commentPosted: false,
        canRetry: true
      });
    }
  }

  // 6. Server-Authoritative Learner Resolution & Ownership Verification
  const userRef = db.collection('users').doc(studentId);
  const userSnap = await userRef.get();
  const userData = userSnap.exists ? userSnap.data() : {};

  const expectedExternalId = buildDeterministicMasteryExternalId(studentId);
  let masteryLearnerId = null;

  // Validate cached ID: fetch vendor record and strictly verify ownership
  if (userData.masteryLearnerId) {
    try {
      const vendorLearner = await masteryClient.getLearner(userData.masteryLearnerId);
      const isOwner = vendorLearner &&
        String(vendorLearner.id) === String(userData.masteryLearnerId) &&
        Number(vendorLearner.schoolId) === Number(masterySchoolId) &&
        String(vendorLearner.externalId || '').toUpperCase() === expectedExternalId.toUpperCase();

      if (isOwner) {
        masteryLearnerId = vendorLearner.id;
      } else {
        console.warn(`[Mastery] Legacy cached learner ${userData.masteryLearnerId} failed ownership verification: externalId/schoolId mismatch.`);
      }
    } catch (err) {
      console.warn(`[Mastery] Cached learner ${userData.masteryLearnerId} verification failed:`, err.message);
    }
  }

  // If not verified from cache, search sandbox strictly by expectedExternalId
  if (!masteryLearnerId) {
    try {
      const candidates = await masteryClient.searchLearners(masterySchoolId, expectedExternalId);
      const exactMatches = candidates.filter(c =>
        String(c.externalId || '').toUpperCase() === expectedExternalId.toUpperCase() &&
        Number(c.schoolId) === Number(masterySchoolId)
      );

      if (exactMatches.length === 1) {
        masteryLearnerId = exactMatches[0].id;
      } else if (exactMatches.length > 1) {
        await subRef.set({ mastery: { status: 'failed', error: 'Ambiguous learner mapping', updatedAt: Date.now() } }, { merge: true });
        return res.status(422).json({
          success: false,
          code: 'AMBIGUOUS_MASTERY_LEARNER',
          error: `Multiple learners found in Mastery school ${masterySchoolId} matching externalId ${expectedExternalId}.`,
          ordinaryApprovalAvailable: true
        });
      }
    } catch (err) {
      console.warn(`[Mastery] Search by externalId failed:`, err.message);
    }
  }

  // Fail closed if learner is unregistered. Never implicitly create learners during evaluation recording.
  if (!masteryLearnerId) {
    await subRef.set({
      mastery: {
        status: 'failed',
        error: `Unregistered learner: externalId ${expectedExternalId} not provisioned in Mastery school ${masterySchoolId}`,
        updatedAt: Date.now()
      }
    }, { merge: true });

    return res.status(422).json({
      success: false,
      code: 'UNREGISTERED_MASTERY_LEARNER',
      error: `Learner ${studentId} (externalId: ${expectedExternalId}) is not registered in Mastery school ${masterySchoolId}. Learner must be provisioned before recording competencies.`,
      ordinaryApprovalAvailable: true
    });
  }

  // 7. Evidence Container: Idempotent Reconciliation against Vendor
  const deterministicTitle = `SPARK [${submissionId}]: ${sub.projectTitle || 'PBL Project'}`;
  let evidenceId = existingMastery.evidenceId || null;

  if (!evidenceId) {
    try {
      // Reconcile before creating: check if evidence container with this deterministic title already exists
      const vendorEvidences = await masteryClient.listLearnerEvidence(masteryLearnerId);
      const existingMatch = (Array.isArray(vendorEvidences) ? vendorEvidences : []).find(e =>
        e.title === deterministicTitle || e.title?.startsWith(`SPARK [${submissionId}]`)
      );

      if (existingMatch) {
        evidenceId = existingMatch.id;
        console.log(`[Mastery] Reconciled existing evidence container ${evidenceId} for submission ${submissionId}`);
      } else {
        const description = sub.reflection || sub.evidence?.reflection || `Approved deliverable for submission ${submissionId}.`;
        const evResult = await masteryClient.createEvidence(masteryLearnerId, { title: deterministicTitle, description });
        evidenceId = evResult?.id || evResult;
      }

      // Verify fence before updating
      const fCheck = await subRef.get();
      if (fCheck.data()?.mastery?.fenceToken !== fenceToken) {
        return res.status(409).json({
          success: false,
          code: 'LEASE_LOST',
          error: 'Operation lease was acquired by another request.'
        });
      }

      // Immediately persist evidenceId locally
      await subRef.set({
        mastery: {
          evidenceId,
          learnerId: masteryLearnerId,
          creditId: credit.id,
          phases: {
            evidence: { status: 'created', evidenceId, title: deterministicTitle, createdAt: Date.now() }
          },
          updatedAt: Date.now()
        }
      }, { merge: true });
    } catch (err) {
      console.error('[Mastery] Failed reconciling or creating evidence container:', err.message);
      await subRef.set({
        mastery: {
          status: 'failed',
          learnerId: masteryLearnerId,
          creditId: credit.id,
          error: `Evidence container error: ${err.message}`,
          failedAt: Date.now()
        }
      }, { merge: true });

      return res.status(502).json({
        success: false,
        code: 'EVIDENCE_CREATION_FAILED',
        error: `Failed to create or reconcile evidence in Mastery: ${err.message}`,
        creditAwarded: false,
        commentPosted: false,
        canRetry: true
      });
    }
  }

  // 8. Associate Credit & Award Competency
  let creditAwarded = false;
  try {
    await masteryClient.attachCompetenciesToEvidence(evidenceId, [
      { id: credit.id, status: 'IN_PROGRESS' }
    ]);

    await masteryClient.updateLearnerCredit(masteryLearnerId, credit.id, {
      status: 'EARNED'
    });
    creditAwarded = true;

    // 9. Post Coach Formative Feedback
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

    // Verify fence before final save
    const fCheckFinal = await subRef.get();
    if (fCheckFinal.data()?.mastery?.fenceToken !== fenceToken) {
      return res.status(409).json({
        success: false,
        code: 'LEASE_LOST',
        error: 'Operation lease expired while recording.'
      });
    }

    const finalStatus = (!coachFeedback || commentPosted) ? 'recorded' : 'partial';
    const masteryRecord = {
      status: finalStatus,
      creditStatus: 'EARNED',
      creditId: credit.id,
      creditTitle: credit.title,
      area: credit.area,
      creditType: credit.type,
      evidenceId,
      learnerId: masteryLearnerId,
      creditAwarded: true,
      commentPosted,
      fenceToken,
      recordedAt: Date.now(),
      recordedBy: caller.uid,
      phases: {
        evidence: { status: 'created', evidenceId, title: deterministicTitle },
        credit: { status: 'earned', creditId: credit.id, awardedAt: Date.now() },
        comment: { status: commentPosted ? 'posted' : 'none', postedAt: commentPosted ? Date.now() : null }
      },
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
        creditAwarded: true,
        canRetryComment: !commentPosted && Boolean(coachFeedback)
      }
    });
  } catch (err) {
    console.error('[Mastery] Failed awarding credit or updating evidence:', err.message);

    await subRef.set({
      mastery: {
        status: creditAwarded ? 'partial' : 'failed',
        evidenceId,
        learnerId: masteryLearnerId,
        creditId: credit.id,
        creditAwarded,
        commentPosted: false,
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
      creditAwarded,
      commentPosted: false,
      canRetry: true
    });
  }
}));

export default router;
