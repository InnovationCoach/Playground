/**
 * Learner & Explorer Universe API Routes
 * Conforms to MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md (0.1.1) and J02 requirements.
 */

import { Router } from 'express';
import { getFirestore, Timestamp, FieldPath } from 'firebase-admin/firestore';
import {
  API_CONTRACT_VERSION,
  MAX_REQUEST_BYTES,
  PUBLISHED_RELEASES,
  canonicalStringify,
  resolveTask,
  validateDraft,
  validateSubmission
} from '../../shared/universe/index.js';
import {
  buildReviewedOnlyOutcome,
  computeIdempotencyRequestHash,
  evaluateTaskAvailability,
  getDraftDocId,
  getIdempotencyDocId,
  getOpenSlotDocId,
  getPlanetUnlock,
  getTaskStatusOverrideDocId,
  isSafeId,
  resolveTaskFromQuery
} from '../lib/universe/missions.js';
import {
  computeCursorFilterHash,
  decodeUniverseCursor,
  encodeUniverseCursor,
  extractExactTimestamp,
  formatSubmissionItem,
  parsePageLimit
} from '../lib/universe/cursor.js';
import {
  requireIdempotencyKey,
  sendUniverseError,
  statusForErrorCode,
  universeTransportGuard
} from '../lib/universe/http.js';
import { requireUniverseAuth } from '../lib/universe/auth.js';

const LEARNER_ROLES = ['student', 'learner'];
// Reserve worst-case review metadata overhead (4-byte UTF-8 1000-char note + reviewer fields + outcome)
const MAX_REVIEW_OVERHEAD_BYTES = 4608;

/**
 * Firestore does not permit directly nested arrays (`rows: string[][]`).
 * Convert any table `rows: string[][]` to `rows: Array<{ cells: string[] }>` when writing to Firestore,
 * and restore `rows: string[][]` when reading from Firestore.
 */
export function serializeEvidenceForFirestore(evidence) {
  if (!Array.isArray(evidence)) return [];
  return evidence.map((part) => {
    if (part && part.kind === 'table' && Array.isArray(part.rows)) {
      return {
        ...part,
        rows: part.rows.map((row) => (Array.isArray(row) ? { cells: [...row] } : row))
      };
    }
    return JSON.parse(JSON.stringify(part));
  });
}

export function deserializeEvidenceFromFirestore(evidence) {
  if (!Array.isArray(evidence)) return [];
  return evidence.map((part) => {
    if (part && part.kind === 'table' && Array.isArray(part.rows)) {
      return {
        ...part,
        rows: part.rows.map((row) =>
          Array.isArray(row) ? row : Array.isArray(row?.cells) ? [...row.cells] : []
        )
      };
    }
    return part;
  });
}

function formatDraftSnapshot(draftId, data) {
  return {
    draftId,
    revision: data.revision,
    updatedAt: data.updatedAtIso,
    releaseId: data.releaseId,
    missionId: data.missionId,
    missionVersion: data.missionVersion,
    routeId: data.routeId,
    taskId: data.taskId,
    policyVersion: data.policyVersion,
    supportMode: data.supportMode,
    activeStepId: data.activeStepId,
    answers: Array.isArray(data.answers) ? data.answers : [],
    evidence: deserializeEvidenceFromFirestore(data.evidence),
    reflection: typeof data.reflection === 'string' ? data.reflection : '',
    previousSubmissionId: data.previousSubmissionId ?? null
  };
}

/**
 * Verify that previousSubmissionId references an eligible returned attempt for this caller/org
 * with the exact same task identity (releaseId, missionId, missionVersion, routeId, taskId, policyVersion)
 * and is not a legacy reflection-only submission (B5).
 */
function verifyPreviousSubmissionLink(prevSubSnap, caller, identity, { lockData = null, enforceLatestForSubmission = false } = {}) {
  if (!prevSubSnap.exists) {
    const err = new Error('Referenced previous submission was not found.');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    err.field = 'previousSubmissionId';
    throw err;
  }

  const prevData = prevSubSnap.data();
  if (prevData.orgId !== caller.orgId || prevData.learnerUid !== caller.uid) {
    const err = new Error('Referenced previous submission was not found.');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    err.field = 'previousSubmissionId';
    throw err;
  }

  if (prevData.status !== 'returned') {
    const err = new Error('previousSubmissionId must reference a returned submission.');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    err.field = 'previousSubmissionId';
    throw err;
  }

  if (
    prevData.legacyFormat === true ||
    prevData.missionVersion === '0.1.0-draft' ||
    !Array.isArray(prevData.evidence) ||
    prevData.evidence.length === 0
  ) {
    const err = new Error('Legacy reflection-only submissions cannot be linked or upgraded without a reviewed migration rule.');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    err.field = 'previousSubmissionId';
    throw err;
  }

  if (
    prevData.releaseId !== identity.releaseId ||
    prevData.missionId !== identity.missionId ||
    prevData.missionVersion !== identity.missionVersion ||
    prevData.routeId !== identity.routeId ||
    prevData.taskId !== identity.taskId ||
    prevData.policyVersion !== identity.policyVersion
  ) {
    const err = new Error(
      'previousSubmissionId must match the exact releaseId, missionId, missionVersion, routeId, taskId, and policyVersion.'
    );
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    err.field = 'previousSubmissionId';
    throw err;
  }

  if (enforceLatestForSubmission && lockData) {
    const consumed = Array.isArray(lockData.consumedReturnedIds) ? lockData.consumedReturnedIds : [];
    if (consumed.includes(prevSubSnap.id)) {
      const err = new Error('previousSubmissionId has already been superseded by a newer attempt.');
      err.statusCode = 409;
      err.code = 'MISSION_NOT_OPEN';
      err.field = 'previousSubmissionId';
      throw err;
    }

    const taskKey = getTaskStatusOverrideDocId(identity);
    const latestForTask = lockData.lastReturnedByTask?.[taskKey];
    if (latestForTask && latestForTask !== prevSubSnap.id) {
      const err = new Error('previousSubmissionId does not match your latest returned attempt for this task.');
      err.statusCode = 409;
      err.code = 'MISSION_NOT_OPEN';
      err.field = 'previousSubmissionId';
      throw err;
    }
    if (!lockData.lastReturnedByTask && lockData.lastReturnedSubmissionId && lockData.lastReturnedSubmissionId !== prevSubSnap.id) {
      const err = new Error('previousSubmissionId does not match your latest returned attempt.');
      err.statusCode = 409;
      err.code = 'MISSION_NOT_OPEN';
      err.field = 'previousSubmissionId';
      throw err;
    }
  }

  return prevData;
}

export function createUniverseRouter({ getRegistry = () => PUBLISHED_RELEASES } = {}) {
  const router = Router();

  router.use(universeTransportGuard);
  router.use(requireUniverseAuth);

  /**
   * GET /api/universe/missions/:missionId/availability
   * Exact-task current availability; never inferred from a client flag or stale bundle label.
   */
  router.get('/missions/:missionId/availability', async (req, res) => {
    const { missionId } = req.params;
    const registry = getRegistry();

    const resolved = resolveTaskFromQuery(registry, missionId, req.query);
    if (!resolved.ok) {
      return sendUniverseError(
        req,
        res,
        statusForErrorCode(resolved.error.code),
        resolved.error.code,
        resolved.error.message,
        { field: resolved.error.field }
      );
    }

    try {
      const db = getFirestore();
      const overrideId = getTaskStatusOverrideDocId(resolved.value.identity);
      const overrideSnap = await db.collection('universeTaskStatus').doc(overrideId).get();
      const overrideData = overrideSnap.exists ? overrideSnap.data() : null;
      const availability = evaluateTaskAvailability(resolved.value, { overrideData });

      return res.status(200).json({
        contractVersion: API_CONTRACT_VERSION,
        ...availability,
        availability
      });
    } catch (err) {
      console.error('[Universe Availability Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Failed to evaluate mission availability.');
    }
  });

  /**
   * GET /api/universe/missions/:missionId/draft
   * Retrieve the caller's exact versioned draft or draft: null.
   */
  router.get('/missions/:missionId/draft', async (req, res) => {
    const caller = req.universeCaller;
    if (!LEARNER_ROLES.includes(caller.role)) {
      return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Only learners and students may access mission drafts.');
    }

    const { missionId } = req.params;
    const registry = getRegistry();
    const resolved = resolveTaskFromQuery(registry, missionId, req.query);
    if (!resolved.ok) {
      return sendUniverseError(
        req,
        res,
        statusForErrorCode(resolved.error.code),
        resolved.error.code,
        resolved.error.message,
        { field: resolved.error.field }
      );
    }

    const { identity } = resolved.value;
    const draftId = getDraftDocId(caller.orgId, caller.uid, identity);
    const overrideId = getTaskStatusOverrideDocId(identity);

    try {
      const db = getFirestore();
      const [draftSnap, overrideSnap] = await Promise.all([
        db.collection('missionDrafts').doc(draftId).get(),
        db.collection('universeTaskStatus').doc(overrideId).get()
      ]);

      const overrideData = overrideSnap.exists ? overrideSnap.data() : null;
      const availability = evaluateTaskAvailability(resolved.value, { overrideData });

      if (!draftSnap.exists) {
        return res.status(200).json({
          contractVersion: API_CONTRACT_VERSION,
          draftId,
          revision: 0,
          updatedAt: null,
          availability,
          draft: null
        });
      }

      const draftData = draftSnap.data();
      if (draftData.orgId !== caller.orgId || draftData.learnerUid !== caller.uid) {
        return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Draft belongs to another learner or organization.');
      }

      const formatted = formatDraftSnapshot(draftId, draftData);
      return res.status(200).json({
        contractVersion: API_CONTRACT_VERSION,
        draftId,
        revision: formatted.revision,
        updatedAt: formatted.updatedAt,
        availability,
        draft: formatted
      });
    } catch (err) {
      console.error('[Universe Draft GET Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Failed to load mission draft.');
    }
  });

  /**
   * PUT /api/universe/missions/:missionId/draft
   * Version-bound save with expectedRevision (0 creates) and atomic idempotency.
   */
  router.put('/missions/:missionId/draft', async (req, res) => {
    const caller = req.universeCaller;
    if (!LEARNER_ROLES.includes(caller.role)) {
      return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Only learners and students may save mission drafts.');
    }

    const idempotencyKey = requireIdempotencyKey(req, res);
    if (!idempotencyKey) return;

    const { missionId } = req.params;
    const registry = getRegistry();

    const validation = validateDraft(req.body, { registry, missionId });
    if (!validation.ok) {
      return sendUniverseError(
        req,
        res,
        statusForErrorCode(validation.error.code),
        validation.error.code,
        validation.error.message,
        { field: validation.error.field }
      );
    }

    const validatedDraft = validation.value;
    const identity = {
      releaseId: validatedDraft.releaseId,
      missionId,
      missionVersion: validatedDraft.missionVersion,
      routeId: validatedDraft.routeId,
      taskId: validatedDraft.taskId,
      policyVersion: validatedDraft.policyVersion
    };

    const resolved = resolveTask(registry, identity);
    if (!resolved.ok) {
      return sendUniverseError(
        req,
        res,
        statusForErrorCode(resolved.error.code),
        resolved.error.code,
        resolved.error.message,
        { field: resolved.error.field }
      );
    }

    const endpointPath = `/api/universe/missions/${missionId}/draft`;
    const operation = `PUT:${endpointPath}`;
    const draftId = getDraftDocId(caller.orgId, caller.uid, identity);
    const idemId = getIdempotencyDocId(caller.orgId, caller.uid, operation, idempotencyKey);
    const overrideId = getTaskStatusOverrideDocId(identity);
    const requestHash = computeIdempotencyRequestHash({
      contractVersion: API_CONTRACT_VERSION,
      orgId: caller.orgId,
      callerUid: caller.uid,
      method: 'PUT',
      path: endpointPath,
      body: req.body
    });

    const db = getFirestore();
    const draftRef = db.collection('missionDrafts').doc(draftId);
    const idemRef = db.collection('universeIdempotency').doc(idemId);
    const overrideRef = db.collection('universeTaskStatus').doc(overrideId);
    const prevSubRef =
      validatedDraft.previousSubmissionId ? db.collection('missionSubmissions').doc(validatedDraft.previousSubmissionId) : null;

    try {
      let responsePayload;
      await db.runTransaction(async (transaction) => {
        const reads = [
          transaction.get(overrideRef),
          transaction.get(idemRef),
          transaction.get(draftRef),
          ...(prevSubRef ? [transaction.get(prevSubRef)] : [])
        ];
        const [overrideSnap, idemSnap, draftSnap, prevSubSnap] = await Promise.all(reads);

        const nowTs = Timestamp.now();
        const nowIso = nowTs.toDate().toISOString();
        const overrideData = overrideSnap.exists ? overrideSnap.data() : null;
        const availability = evaluateTaskAvailability(resolved.value, { overrideData, nowIso });

        if (!availability.canResume) {
          const err = new Error(availability.reason || 'This mission is not currently open for saving work.');
          err.statusCode = statusForErrorCode(availability.reasonCode || 'MISSION_NOT_OPEN');
          err.code = availability.reasonCode || 'MISSION_NOT_OPEN';
          throw err;
        }

        if (idemSnap.exists) {
          const idemData = idemSnap.data();
          if (idemData.requestHash !== requestHash) {
            const err = new Error('This Idempotency-Key was already used with a different draft payload.');
            err.statusCode = 409;
            err.code = 'IDEMPOTENCY_KEY_REUSED';
            err.field = 'Idempotency-Key';
            throw err;
          }
          if (idemData.orgId !== caller.orgId || idemData.callerUid !== caller.uid) {
            const err = new Error('Forbidden replay across organization or learner context.');
            err.statusCode = 403;
            err.code = 'FORBIDDEN';
            throw err;
          }
          const committedSnapshot = idemData.responseSnapshot || {};
          const committedDraft = committedSnapshot.draft
            ? {
                ...committedSnapshot.draft,
                evidence: deserializeEvidenceFromFirestore(committedSnapshot.draft.evidence)
              }
            : null;
          responsePayload = {
            contractVersion: API_CONTRACT_VERSION,
            draftId: committedSnapshot.draftId || draftId,
            revision: committedSnapshot.revision ?? 1,
            updatedAt: committedSnapshot.updatedAt ?? nowIso,
            idempotentReplay: true,
            availability,
            draft: committedDraft
          };
          return;
        }

        if (prevSubRef) {
          verifyPreviousSubmissionLink(prevSubSnap, caller, identity);
        }

        const currentRevision = draftSnap.exists ? draftSnap.data().revision : 0;
        if (validatedDraft.expectedRevision !== currentRevision) {
          const err = new Error('Draft revision conflict. Reload or merge the current saved draft before saving.');
          err.statusCode = 409;
          err.code = 'DRAFT_CONFLICT';
          err.field = 'expectedRevision';
          err.details = {
            currentRevision,
            currentDraft: draftSnap.exists ? formatDraftSnapshot(draftId, draftSnap.data()) : null
          };
          throw err;
        }

        const newRevision = currentRevision + 1;
        const draftRecord = {
          draftId,
          orgId: caller.orgId,
          learnerUid: caller.uid,
          classIds: caller.classIds,
          ...identity,
          revision: newRevision,
          supportMode: validatedDraft.supportMode,
          activeStepId: validatedDraft.activeStepId,
          answers: validatedDraft.answers,
          evidence: serializeEvidenceForFirestore(validatedDraft.evidence),
          reflection: validatedDraft.reflection ?? '',
          previousSubmissionId: validatedDraft.previousSubmissionId ?? null,
          updatedAt: nowTs,
          updatedAtIso: nowIso
        };

        const storedBytes = Buffer.byteLength(canonicalStringify({
          ...draftRecord,
          updatedAt: nowIso
        }), 'utf8');
        if (storedBytes > MAX_REQUEST_BYTES) {
          const err = new Error('Draft document exceeds the 64 KiB storage budget.');
          err.statusCode = 413;
          err.code = 'PAYLOAD_TOO_LARGE';
          throw err;
        }

        const formattedDraft = formatDraftSnapshot(draftId, draftRecord);
        const responseSnapshot = {
          draftId,
          revision: newRevision,
          updatedAt: nowIso,
          draft: formattedDraft
        };

        transaction.set(draftRef, draftRecord);
        transaction.set(idemRef, {
          idempotencyId: idemId,
          orgId: caller.orgId,
          callerUid: caller.uid,
          operation,
          idempotencyKey,
          requestHash,
          draftId,
          responseSnapshot: {
            ...responseSnapshot,
            draft: {
              ...formattedDraft,
              evidence: serializeEvidenceForFirestore(formattedDraft.evidence)
            }
          },
          createdAt: nowTs
        });

        responsePayload = {
          contractVersion: API_CONTRACT_VERSION,
          ...responseSnapshot,
          idempotentReplay: false,
          availability
        };
      });

      return res.status(200).json(responsePayload);
    } catch (err) {
      if (err.statusCode && err.code) {
        return sendUniverseError(req, res, err.statusCode, err.code, err.message, {
          field: err.field || null,
          details: err.details || null
        });
      }
      console.error('[Universe Draft PUT Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Failed to save mission draft.');
    }
  });

  /**
   * POST /api/universe/missions/:missionId/submissions
   * Atomically create one immutable submission, open-review slot, idempotency record and audit log.
   */
  router.post('/missions/:missionId/submissions', async (req, res) => {
    const caller = req.universeCaller;
    if (!LEARNER_ROLES.includes(caller.role)) {
      return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Only learners and students may submit mission work.');
    }

    const idempotencyKey = requireIdempotencyKey(req, res);
    if (!idempotencyKey) return;

    const { missionId } = req.params;
    const registry = getRegistry();

    const validation = validateSubmission(req.body, { registry, missionId });
    if (!validation.ok) {
      return sendUniverseError(
        req,
        res,
        statusForErrorCode(validation.error.code),
        validation.error.code,
        validation.error.message,
        { field: validation.error.field }
      );
    }

    const validatedSub = validation.value;
    const identity = {
      releaseId: validatedSub.releaseId,
      missionId,
      missionVersion: validatedSub.missionVersion,
      routeId: validatedSub.routeId,
      taskId: validatedSub.taskId,
      policyVersion: validatedSub.policyVersion
    };

    const resolved = resolveTask(registry, identity);
    if (!resolved.ok) {
      return sendUniverseError(
        req,
        res,
        statusForErrorCode(resolved.error.code),
        resolved.error.code,
        resolved.error.message,
        { field: resolved.error.field }
      );
    }

    const endpointPath = `/api/universe/missions/${missionId}/submissions`;
    const operation = `POST:${endpointPath}`;
    const lockId = getOpenSlotDocId(caller.orgId, caller.uid, missionId);
    const idemId = getIdempotencyDocId(caller.orgId, caller.uid, operation, idempotencyKey);
    const overrideId = getTaskStatusOverrideDocId(identity);
    const requestHash = computeIdempotencyRequestHash({
      contractVersion: API_CONTRACT_VERSION,
      orgId: caller.orgId,
      callerUid: caller.uid,
      method: 'POST',
      path: endpointPath,
      body: req.body
    });

    const db = getFirestore();
    const lockRef = db.collection('missionSubmissionLocks').doc(lockId);
    const idemRef = db.collection('universeIdempotency').doc(idemId);
    const overrideRef = db.collection('universeTaskStatus').doc(overrideId);
    const prevSubRef =
      validatedSub.previousSubmissionId ? db.collection('missionSubmissions').doc(validatedSub.previousSubmissionId) : null;

    try {
      let statusCode = 201;
      let responsePayload = null;

      await db.runTransaction(async (transaction) => {
        const reads = [
          transaction.get(overrideRef),
          transaction.get(idemRef),
          transaction.get(lockRef),
          ...(prevSubRef ? [transaction.get(prevSubRef)] : [])
        ];
        const [overrideSnap, idemSnap, lockSnap, prevSubSnap] = await Promise.all(reads);

        const nowTs = Timestamp.now();
        const nowIso = nowTs.toDate().toISOString();
        const overrideData = overrideSnap.exists ? overrideSnap.data() : null;
        const availability = evaluateTaskAvailability(resolved.value, { overrideData, nowIso });

        // 1. Check Idempotency Replay first, refreshing live review status and current availability (§5, §9.5)
        if (idemSnap.exists) {
          const idemData = idemSnap.data();
          if (idemData.requestHash !== requestHash) {
            const err = new Error('This Idempotency-Key was already used with a different submission payload.');
            err.statusCode = 409;
            err.code = 'IDEMPOTENCY_KEY_REUSED';
            err.field = 'Idempotency-Key';
            throw err;
          }

          const existingSubRef = db.collection('missionSubmissions').doc(idemData.submissionId);
          const existingSubSnap = await transaction.get(existingSubRef);
          if (!existingSubSnap.exists) {
            const err = new Error('Original submission record for idempotent replay is unavailable.');
            err.statusCode = 404;
            err.code = 'NOT_FOUND';
            throw err;
          }

          const liveSubData = existingSubSnap.data();
          if (
            liveSubData.orgId !== caller.orgId ||
            liveSubData.learnerUid !== caller.uid ||
            !Array.isArray(liveSubData.classIds) ||
            !liveSubData.classIds.some((cid) => caller.classIds.includes(cid))
          ) {
            const err = new Error('Forbidden replay across organization, learner, or revoked class context.');
            err.statusCode = 403;
            err.code = 'FORBIDDEN';
            throw err;
          }

          const overrideMap = new Map();
          if (overrideData) {
            overrideMap.set(
              JSON.stringify([
                identity.releaseId,
                identity.missionId,
                identity.missionVersion,
                identity.routeId,
                identity.taskId,
                identity.policyVersion
              ]),
              overrideData
            );
          }

          const formattedItem = formatSubmissionItem(existingSubSnap.id, liveSubData, {
            registry,
            overrideMap,
            nowIso
          });

          statusCode = 200;
          responsePayload = {
            contractVersion: API_CONTRACT_VERSION,
            submissionId: formattedItem.submissionId,
            submissionRevision: formattedItem.submissionRevision,
            attemptNumber: formattedItem.attemptNumber,
            previousSubmissionId: formattedItem.previousSubmissionId,
            releaseId: formattedItem.releaseId,
            missionId: formattedItem.missionId,
            missionTitle: formattedItem.missionTitle,
            missionVersion: formattedItem.missionVersion,
            missionContentHash: formattedItem.missionContentHash,
            routeId: formattedItem.routeId,
            taskId: formattedItem.taskId,
            supportMode: formattedItem.supportMode,
            policyVersion: formattedItem.policyVersion,
            status: formattedItem.status,
            createdAt: formattedItem.createdAt,
            reviewedAt: formattedItem.reviewedAt,
            coachUid: formattedItem.coachUid,
            coachNote: formattedItem.coachNote,
            availability,
            outcome: formattedItem.outcome,
            auditEventId: liveSubData.auditEventId || null,
            idempotentReplay: true,
            submission: formattedItem
          };
          return;
        }

        // 2. Enforce current task availability for new submissions
        if (!availability.canSubmit) {
          const err = new Error(availability.reason || 'This mission is not currently open for submissions.');
          err.statusCode = statusForErrorCode(availability.reasonCode || 'MISSION_NOT_OPEN');
          err.code = availability.reasonCode || 'MISSION_NOT_OPEN';
          throw err;
        }

        // 3. Enforce 1 open submission per [orgId, learnerUid, missionId] via collision-safe slot
        const lockData = lockSnap.exists ? lockSnap.data() : null;
        if (lockData && lockData.status === 'open' && lockData.openSubmissionId) {
          const err = new Error('You already have an open submission awaiting coach review for this mission.');
          err.statusCode = 409;
          err.code = 'SUBMISSION_ALREADY_OPEN';
          err.details = { openSubmissionId: lockData.openSubmissionId };
          throw err;
        }

        // 4. Verify previousSubmissionId against actual eligible returned attempt for this exact task
        let previousCoachNote = null;
        let prevAttemptNumber = 0;
        if (prevSubRef) {
          const prevData = verifyPreviousSubmissionLink(prevSubSnap, caller, identity, {
            lockData,
            enforceLatestForSubmission: true
          });
          previousCoachNote = prevData.coachNote ?? null;
          prevAttemptNumber = Number.isSafeInteger(prevData.attemptNumber) ? prevData.attemptNumber : 1;
        }

        const attemptNumber = Math.max((lockData?.attemptCount || 0) + 1, prevAttemptNumber + 1);
        const subRef = db.collection('missionSubmissions').doc();
        const auditRef = db.collection('auditLogs').doc();

        const { mission } = resolved.value;
        const submissionRecord = {
          submissionId: subRef.id,
          id: subRef.id,
          submissionRevision: 1,
          attemptNumber,
          previousSubmissionId: validatedSub.previousSubmissionId ?? null,
          releaseId: identity.releaseId,
          missionId: identity.missionId,
          missionTitle: mission.title,
          missionVersion: identity.missionVersion,
          missionContentHash: mission.contentSha256,
          routeId: identity.routeId,
          taskId: identity.taskId,
          supportMode: validatedSub.supportMode,
          policyVersion: identity.policyVersion,
          learnerUid: caller.uid,
          learnerDisplayName: caller.displayName,
          orgId: caller.orgId,
          classIds: caller.classIds,
          status: 'submitted',
          reflection: validatedSub.reflection,
          evidence: serializeEvidenceForFirestore(validatedSub.evidence),
          previousCoachNote,
          coachUid: null,
          coachNote: null,
          createdAt: nowTs,
          createdAtIso: nowIso,
          reviewedAt: null,
          reviewedAtIso: null,
          outcome: null,
          legacyFormat: false,
          auditEventId: auditRef.id
        };

        const storedBytes = Buffer.byteLength(
          canonicalStringify({
            ...submissionRecord,
            createdAt: nowIso
          }),
          'utf8'
        );
        if (storedBytes + MAX_REVIEW_OVERHEAD_BYTES > MAX_REQUEST_BYTES) {
          const err = new Error(
            'Submission record exceeds the 64 KiB storage budget after reserving space for coach review fields.'
          );
          err.statusCode = 413;
          err.code = 'PAYLOAD_TOO_LARGE';
          throw err;
        }

        const nextConsumedReturnedIds = prevSubRef
          ? Array.from(new Set([...(lockData?.consumedReturnedIds || []), validatedSub.previousSubmissionId]))
          : (lockData?.consumedReturnedIds || []);

        // Atomically commit submission, open slot, audit event, and idempotency record
        transaction.set(subRef, submissionRecord);
        transaction.set(lockRef, {
          lockId,
          orgId: caller.orgId,
          learnerUid: caller.uid,
          missionId: identity.missionId,
          status: 'open',
          openSubmissionId: subRef.id,
          lastSubmissionId: subRef.id,
          lastReturnedSubmissionId: lockData?.lastReturnedSubmissionId || null,
          lastReturnedByTask: lockData?.lastReturnedByTask || {},
          consumedReturnedIds: nextConsumedReturnedIds,
          attemptCount: attemptNumber,
          updatedAt: nowTs
        });
        transaction.set(auditRef, {
          logId: auditRef.id,
          source: 'server',
          orgId: caller.orgId,
          schoolId: null,
          subjectUid: caller.uid,
          action: 'universe.mission.submitted',
          actorUid: caller.uid,
          actorName: caller.displayName,
          actorPublicId: caller.publicId || null,
          summary: `Learner ${caller.displayName} submitted mission ${identity.missionId} (${identity.routeId}/${identity.taskId}) attempt #${attemptNumber}`,
          details: {
            submissionId: subRef.id,
            submissionRevision: 1,
            attemptNumber,
            previousSubmissionId: submissionRecord.previousSubmissionId,
            ...identity
          },
          createdAt: nowTs
        });
        transaction.set(idemRef, {
          idempotencyId: idemId,
          orgId: caller.orgId,
          callerUid: caller.uid,
          operation,
          idempotencyKey,
          requestHash,
          submissionId: subRef.id,
          createdAt: nowTs
        });

        const formattedItem = formatSubmissionItem(subRef.id, submissionRecord, {
          registry,
          nowIso
        });
        formattedItem.availability = availability;

        statusCode = 201;
        responsePayload = {
          contractVersion: API_CONTRACT_VERSION,
          submissionId: subRef.id,
          submissionRevision: 1,
          attemptNumber,
          previousSubmissionId: submissionRecord.previousSubmissionId,
          releaseId: identity.releaseId,
          missionId: identity.missionId,
          missionTitle: mission.title,
          missionVersion: identity.missionVersion,
          missionContentHash: mission.contentSha256,
          routeId: identity.routeId,
          taskId: identity.taskId,
          supportMode: validatedSub.supportMode,
          policyVersion: identity.policyVersion,
          status: 'submitted',
          createdAt: nowIso,
          availability,
          outcome: null,
          auditEventId: auditRef.id,
          idempotentReplay: false,
          submission: formattedItem
        };
      });

      return res.status(statusCode).json(responsePayload);
    } catch (err) {
      if (err.statusCode && err.code) {
        return sendUniverseError(req, res, err.statusCode, err.code, err.message, {
          field: err.field || null,
          details: err.details || null
        });
      }
      console.error('[Universe Submission POST Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Failed to create mission submission.');
    }
  });

  /**
   * GET /api/universe/missions/submissions/mine
   * Caller-only history with exact seconds/nanoseconds/docId cursor pagination.
   */
  router.get('/missions/submissions/mine', async (req, res) => {
    const caller = req.universeCaller;
    const registry = getRegistry();

    const { missionId, missionVersion, routeId, releaseId, taskId, policyVersion, limit: rawLimit, cursor: rawCursor } = req.query || {};

    for (const [field, val] of [
      ['missionId', missionId],
      ['missionVersion', missionVersion],
      ['routeId', routeId],
      ['releaseId', releaseId],
      ['taskId', taskId],
      ['policyVersion', policyVersion]
    ]) {
      if (val !== undefined && val !== '' && !isSafeId(val)) {
        return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', `Invalid ${field} filter parameter.`, { field });
      }
    }

    const limitResult = parsePageLimit(rawLimit);
    if (!limitResult.ok) {
      return sendUniverseError(req, res, 400, limitResult.error.code, limitResult.error.message, { field: limitResult.error.field });
    }
    const pageLimit = limitResult.value;

    const filterHash = computeCursorFilterHash([
      'mine',
      caller.orgId,
      caller.uid,
      missionId || null,
      missionVersion || null,
      routeId || null,
      releaseId || null,
      taskId || null,
      policyVersion || null
    ]);

    const cursorResult = decodeUniverseCursor(rawCursor, filterHash);
    if (!cursorResult.ok) {
      return sendUniverseError(req, res, 400, cursorResult.error.code, cursorResult.error.message, { field: cursorResult.error.field });
    }
    const cursor = cursorResult.value;

    try {
      const db = getFirestore();
      let queryRef = db
        .collection('missionSubmissions')
        .where('orgId', '==', caller.orgId)
        .where('learnerUid', '==', caller.uid);

      if (missionId) queryRef = queryRef.where('missionId', '==', missionId);
      if (missionVersion) queryRef = queryRef.where('missionVersion', '==', missionVersion);
      if (routeId) queryRef = queryRef.where('routeId', '==', routeId);
      if (releaseId) queryRef = queryRef.where('releaseId', '==', releaseId);
      if (taskId) queryRef = queryRef.where('taskId', '==', taskId);
      if (policyVersion) queryRef = queryRef.where('policyVersion', '==', policyVersion);

      queryRef = queryRef.orderBy('createdAt', 'desc').orderBy(FieldPath.documentId(), 'desc');
      if (cursor) {
        queryRef = queryRef.startAfter(cursor.timestamp, cursor.docId);
      }
      queryRef = queryRef.limit(pageLimit + 1);

      const snap = await queryRef.get();
      const hasNext = snap.docs.length > pageLimit;
      const pageDocs = hasNext ? snap.docs.slice(0, pageLimit) : snap.docs;

      // Load any task status overrides for distinct identities in the page
      const overrideMap = new Map();
      const distinctIdentities = new Map();
      for (const d of pageDocs) {
        const data = d.data();
        if (data.releaseId && data.missionId && data.missionVersion && data.routeId && data.taskId && data.policyVersion) {
          const identity = {
            releaseId: data.releaseId,
            missionId: data.missionId,
            missionVersion: data.missionVersion,
            routeId: data.routeId,
            taskId: data.taskId,
            policyVersion: data.policyVersion
          };
          const key = JSON.stringify([
            identity.releaseId,
            identity.missionId,
            identity.missionVersion,
            identity.routeId,
            identity.taskId,
            identity.policyVersion
          ]);
          if (!distinctIdentities.has(key)) {
            distinctIdentities.set(key, identity);
          }
        }
      }

      if (distinctIdentities.size > 0) {
        const entries = Array.from(distinctIdentities.entries());
        const overrideSnaps = await Promise.all(
          entries.map(([, idObj]) => db.collection('universeTaskStatus').doc(getTaskStatusOverrideDocId(idObj)).get())
        );
        for (let i = 0; i < entries.length; i++) {
          if (overrideSnaps[i].exists) {
            overrideMap.set(entries[i][0], overrideSnaps[i].data());
          }
        }
      }

      const nowIso = new Date().toISOString();
      const submissions = pageDocs.map(docSnap =>
        formatSubmissionItem(docSnap.id, docSnap.data(), { registry, overrideMap, nowIso })
      );

      let nextCursor = null;
      if (hasNext && pageDocs.length > 0) {
        const lastDoc = pageDocs[pageDocs.length - 1];
        const lastTs = extractExactTimestamp(lastDoc.data().createdAt);
        nextCursor = encodeUniverseCursor({
          seconds: lastTs.seconds,
          nanoseconds: lastTs.nanoseconds,
          docId: lastDoc.id,
          filterHash
        });
      }

      return res.status(200).json({
        contractVersion: API_CONTRACT_VERSION,
        submissions,
        nextCursor
      });
    } catch (err) {
      console.error('[Universe Submissions Mine Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Failed to fetch learner submission history.');
    }
  });

  /**
   * POST /api/universe/access
   * Authoritative destination access check under reviewed-only pilot policy (§1, §5, §9.7).
   * Thalassa and Ignis are public; Boreas remains locked under boreas-policy-unresolved.
   * Unknown destinations fail closed.
   */
  router.post('/access', async (req, res) => {
    const body = req.body || {};
    const allowedKeys = ['contractVersion', 'planetIds', 'releaseId', 'policyVersion'];
    if (!Object.keys(body).every(k => allowedKeys.includes(k))) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'The access request contains unsupported fields.');
    }

    const { planetIds } = body;
    if (!Array.isArray(planetIds) || planetIds.length > 100 || !planetIds.every(isSafeId)) {
      return sendUniverseError(
        req,
        res,
        400,
        'VALIDATION_ERROR',
        'planetIds must be an array of at most 100 valid destination IDs.',
        { field: 'planetIds' }
      );
    }

    const registry = getRegistry();
    const activeBundle = Array.isArray(registry) && registry.length > 0 ? registry[0] : null;
    const destinations = {};

    for (const planetId of planetIds) {
      const unlock = getPlanetUnlock(planetId);
      destinations[planetId] = {
        status: unlock.status,
        evaluatedRule: unlock.evaluatedRule,
        isVerified: unlock.isVerified,
        requirementKey: unlock.requirementKey,
        requirementText: unlock.requirementText
      };
    }

    return res.status(200).json({
      contractVersion: API_CONTRACT_VERSION,
      releaseId: activeBundle?.releaseId ?? null,
      policyVersion: activeBundle?.policy?.version ?? 'pilot-review-only-0.1.0-draft',
      evaluatedAt: new Date().toISOString(),
      destinations
    });
  });

  return router;
}

export default createUniverseRouter();
