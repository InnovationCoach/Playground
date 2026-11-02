/**
 * Coach / Staff Universe Queue & Atomic Review Routes
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
  validateReview
} from '../../shared/universe/index.js';
import {
  buildReviewedOnlyOutcome,
  computeIdempotencyRequestHash,
  evaluateTaskAvailability,
  getIdempotencyDocId,
  getOpenSlotDocId,
  getTaskStatusOverrideDocId,
  isSafeId
} from '../lib/universe/missions.js';
import {
  compareRawSubmissionsDesc,
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

const STAFF_ROLES = ['teacher', 'coach', 'admin', 'supervisor'];
const ADMIN_ROLES = ['admin', 'supervisor'];
const ALLOWED_QUEUE_STATUSES = ['submitted', 'returned', 'approved'];

function chunkArray(items, size = 30) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function createCoachUniverseRouter({ getRegistry = () => PUBLISHED_RELEASES } = {}) {
  const router = Router();

  router.use(universeTransportGuard);
  router.use(requireUniverseAuth);

  /**
   * GET /api/coach/universe/submissions?status=submitted&limit=...&cursor=...
   * Same-organization and assigned-class queue with bounded pagination and exact cursor.
   */
  router.get('/submissions', async (req, res) => {
    const caller = req.universeCaller;
    if (!STAFF_ROLES.includes(caller.role)) {
      return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Only coaches, teachers, and organization admins may view universe submissions.');
    }

    const { status = 'submitted', classId, limit: rawLimit, cursor: rawCursor } = req.query || {};
    if (typeof status !== 'string' || !ALLOWED_QUEUE_STATUSES.includes(status)) {
      return sendUniverseError(
        req,
        res,
        400,
        'VALIDATION_ERROR',
        'status must be one of "submitted", "returned", or "approved".',
        { field: 'status' }
      );
    }

    if (classId !== undefined && classId !== '' && !isSafeId(classId)) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Invalid classId filter parameter.', {
        field: 'classId'
      });
    }

    const limitResult = parsePageLimit(rawLimit);
    if (!limitResult.ok) {
      return sendUniverseError(req, res, 400, limitResult.error.code, limitResult.error.message, { field: limitResult.error.field });
    }
    const pageLimit = limitResult.value;

    const isAdmin = ADMIN_ROLES.includes(caller.role);
    const coachClassIds = Array.isArray(caller.classIds) ? [...caller.classIds].sort() : [];

    if (classId && !isAdmin && !coachClassIds.includes(classId)) {
      return sendUniverseError(
        req,
        res,
        403,
        'FORBIDDEN',
        'You are not assigned to this class in your organization.',
        { field: 'classId' }
      );
    }

    const effectiveCoachClassIds = classId ? [classId] : coachClassIds;

    const filterHash = computeCursorFilterHash([
      'coach-queue',
      caller.orgId,
      caller.uid,
      caller.role,
      status,
      classId || null,
      isAdmin ? (classId ? [classId] : ['*org*']) : effectiveCoachClassIds
    ]);

    const cursorResult = decodeUniverseCursor(rawCursor, filterHash);
    if (!cursorResult.ok) {
      return sendUniverseError(req, res, 400, cursorResult.error.code, cursorResult.error.message, { field: cursorResult.error.field });
    }
    const cursor = cursorResult.value;

    if (!isAdmin && effectiveCoachClassIds.length === 0) {
      return res.status(200).json({
        contractVersion: API_CONTRACT_VERSION,
        submissions: [],
        nextCursor: null
      });
    }

    try {
      const db = getFirestore();
      const registry = getRegistry();
      let candidateDocs = [];

      if (isAdmin) {
        let queryRef = db
          .collection('missionSubmissions')
          .where('orgId', '==', caller.orgId)
          .where('status', '==', status);

        if (classId) {
          queryRef = queryRef.where('classIds', 'array-contains', classId);
        }

        queryRef = queryRef
          .orderBy('createdAt', 'desc')
          .orderBy(FieldPath.documentId(), 'desc');

        if (cursor) {
          queryRef = queryRef.startAfter(cursor.timestamp, cursor.docId);
        }
        queryRef = queryRef.limit(pageLimit + 1);
        const snap = await queryRef.get();
        candidateDocs = snap.docs.map(d => ({ id: d.id, data: d.data() }));
      } else {
        const chunks = chunkArray(effectiveCoachClassIds, 30);
        const snaps = await Promise.all(
          chunks.map(chunk => {
            let q = db
              .collection('missionSubmissions')
              .where('orgId', '==', caller.orgId)
              .where('status', '==', status)
              .where('classIds', 'array-contains-any', chunk)
              .orderBy('createdAt', 'desc')
              .orderBy(FieldPath.documentId(), 'desc');
            if (cursor) {
              q = q.startAfter(cursor.timestamp, cursor.docId);
            }
            return q.limit(pageLimit + 1).get();
          })
        );

        const deduped = new Map();
        for (const snap of snaps) {
          for (const docSnap of snap.docs) {
            if (!deduped.has(docSnap.id)) {
              const d = docSnap.data();
              if (d.orgId !== caller.orgId) continue;
              const subClassIds = Array.isArray(d.classIds) ? d.classIds : [];
              const activelySharesClass = subClassIds.some(cid => {
                if (!effectiveCoachClassIds.includes(cid)) return false;
                const classDoc = caller.classDocsById?.get(cid);
                return Boolean(classDoc && Array.isArray(classDoc.learnerIds) && classDoc.learnerIds.includes(d.learnerUid));
              });
              if (activelySharesClass) {
                deduped.set(docSnap.id, { id: docSnap.id, data: d });
              }
            }
          }
        }

        candidateDocs = Array.from(deduped.values()).sort((a, b) =>
          compareRawSubmissionsDesc(
            { ...a.data, submissionId: a.id },
            { ...b.data, submissionId: b.id }
          )
        );
      }

      const hasNext = candidateDocs.length > pageLimit;
      const pageEntries = hasNext ? candidateDocs.slice(0, pageLimit) : candidateDocs;

      // Load task status overrides for distinct identities in the page
      const overrideMap = new Map();
      const distinctIdentities = new Map();
      for (const entry of pageEntries) {
        const d = entry.data;
        if (d.releaseId && d.missionId && d.missionVersion && d.routeId && d.taskId && d.policyVersion) {
          const identity = {
            releaseId: d.releaseId,
            missionId: d.missionId,
            missionVersion: d.missionVersion,
            routeId: d.routeId,
            taskId: d.taskId,
            policyVersion: d.policyVersion
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
      const submissions = pageEntries.map(entry =>
        formatSubmissionItem(entry.id, entry.data, { registry, overrideMap, nowIso })
      );

      let nextCursor = null;
      if (hasNext && pageEntries.length > 0) {
        const lastEntry = pageEntries[pageEntries.length - 1];
        const lastTs = extractExactTimestamp(lastEntry.data.createdAt);
        nextCursor = encodeUniverseCursor({
          seconds: lastTs.seconds,
          nanoseconds: lastTs.nanoseconds,
          docId: lastEntry.id,
          filterHash
        });
      }

      return res.status(200).json({
        contractVersion: API_CONTRACT_VERSION,
        submissions,
        nextCursor
      });
    } catch (err) {
      console.error('[Coach Universe Queue GET Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Failed to fetch coach submission queue.');
    }
  });

  /**
   * POST /api/coach/universe/submissions/:id/review
   * Atomic review of exact submitted revision with expectedSubmissionRevision,
   * idempotency, organization + current class scope, no self-review, slot release,
   * reviewed-only outcome and durable audit record.
   */
  router.post('/submissions/:id/review', async (req, res) => {
    const caller = req.universeCaller;
    if (!STAFF_ROLES.includes(caller.role)) {
      return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Only coaches, teachers, and organization admins may review universe submissions.');
    }

    const idempotencyKey = requireIdempotencyKey(req, res);
    if (!idempotencyKey) return;

    const { id } = req.params;
    if (!isSafeId(id)) {
      return sendUniverseError(req, res, 404, 'NOT_FOUND', 'Submission not found.');
    }

    const validation = validateReview(req.body);
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
    const validatedReview = validation.value;

    const endpointPath = `/api/coach/universe/submissions/${id}/review`;
    const operation = `POST:${endpointPath}`;
    const idemId = getIdempotencyDocId(caller.orgId, caller.uid, operation, idempotencyKey);
    const requestHash = computeIdempotencyRequestHash({
      contractVersion: API_CONTRACT_VERSION,
      orgId: caller.orgId,
      callerUid: caller.uid,
      method: 'POST',
      path: endpointPath,
      body: req.body
    });

    const db = getFirestore();
    const subRef = db.collection('missionSubmissions').doc(id);
    const idemRef = db.collection('universeIdempotency').doc(idemId);
    const registry = getRegistry();

    try {
      let responsePayload = null;

      await db.runTransaction(async (transaction) => {
        const [subSnap, idemSnap] = await Promise.all([
          transaction.get(subRef),
          transaction.get(idemRef)
        ]);

        if (!subSnap.exists) {
          const err = new Error('Submission not found.');
          err.statusCode = 404;
          err.code = 'NOT_FOUND';
          throw err;
        }

        const subData = subSnap.data();

        // 1. Strict Organization Isolation (applies to ALL roles including admin/supervisor)
        if (!subData.orgId || subData.orgId !== caller.orgId) {
          const err = new Error('Submission belongs to another organization.');
          err.statusCode = 403;
          err.code = 'FORBIDDEN';
          throw err;
        }

        // 2. No Self-Review (§9.6, J02 item 4)
        if (subData.learnerUid === caller.uid) {
          const err = new Error('Reviewers cannot review their own submissions.');
          err.statusCode = 403;
          err.code = 'FORBIDDEN';
          throw err;
        }

        // 3. Current Class Scope Check for teachers/coaches (including live class doc & learner membership)
        const isAdmin = ADMIN_ROLES.includes(caller.role);
        if (!isAdmin) {
          const coachClassIds = Array.isArray(caller.classIds) ? caller.classIds : [];
          const subClassIds = Array.isArray(subData.classIds) ? subData.classIds : [];
          let candidateSharedClassIds = subClassIds.filter(cid => isSafeId(cid) && coachClassIds.includes(cid));

          if (candidateSharedClassIds.length === 0) {
            const err = new Error('You do not share a current class with this learner.');
            err.statusCode = 403;
            err.code = 'FORBIDDEN';
            throw err;
          }

          const [learnerUserSnap, learnerMemberSnap, ...sharedClassSnaps] = await Promise.all([
            transaction.get(db.collection('users').doc(subData.learnerUid)),
            transaction.get(db.collection('universeMemberships').doc(subData.learnerUid)),
            ...candidateSharedClassIds.map(cid => transaction.get(db.collection('classes').doc(cid)))
          ]);

          if (learnerMemberSnap.exists) {
            const lmData = learnerMemberSnap.data() || {};
            if (
              lmData.revoked === true ||
              (lmData.status !== undefined && lmData.status !== 'active') ||
              lmData.orgId !== caller.orgId ||
              !Array.isArray(lmData.classIds)
            ) {
              candidateSharedClassIds = [];
            } else {
              const lmSet = new Set(lmData.classIds);
              candidateSharedClassIds = candidateSharedClassIds.filter(cid => lmSet.has(cid));
            }
          }

          if (learnerUserSnap.exists && learnerUserSnap.data()?.classIds !== undefined) {
            const luClasses = learnerUserSnap.data().classIds;
            if (!Array.isArray(luClasses)) {
              candidateSharedClassIds = [];
            } else {
              const luSet = new Set(luClasses);
              candidateSharedClassIds = candidateSharedClassIds.filter(cid => luSet.has(cid));
            }
          }

          const verifiedSharedClasses = [];
          for (let i = 0; i < sharedClassSnaps.length; i++) {
            const snap = sharedClassSnaps[i];
            const cid = snap.id;
            if (!candidateSharedClassIds.includes(cid) || !snap.exists) continue;
            const cData = snap.data();
            if (!cData || typeof cData !== 'object') continue;
            if (cData.orgId !== caller.orgId) continue;
            if (cData.revoked === true || (cData.status !== undefined && cData.status !== 'active')) continue;
            if (!Array.isArray(cData.coachIds) || !cData.coachIds.includes(caller.uid)) continue;
            if (!Array.isArray(cData.learnerIds) || !cData.learnerIds.includes(subData.learnerUid)) continue;
            verifiedSharedClasses.push(cid);
          }

          if (verifiedSharedClasses.length === 0) {
            const err = new Error('You do not share a current class with this learner.');
            err.statusCode = 403;
            err.code = 'FORBIDDEN';
            throw err;
          }
        }

        const identity = {
          releaseId: subData.releaseId,
          missionId: subData.missionId,
          missionVersion: subData.missionVersion,
          routeId: subData.routeId,
          taskId: subData.taskId,
          policyVersion: subData.policyVersion
        };
        const resolved = resolveTask(registry, identity);
        const overrideId = getTaskStatusOverrideDocId(identity);
        const lockId = getOpenSlotDocId(subData.orgId, subData.learnerUid, subData.missionId);
        const lockRef = db.collection('missionSubmissionLocks').doc(lockId);
        const overrideRef = db.collection('universeTaskStatus').doc(overrideId);

        const [lockSnap, overrideSnap] = await Promise.all([
          transaction.get(lockRef),
          transaction.get(overrideRef)
        ]);

        const nowTs = Timestamp.now();
        const nowIso = nowTs.toDate().toISOString();
        const overrideData = overrideSnap.exists ? overrideSnap.data() : null;
        const availability = resolved.ok
          ? evaluateTaskAvailability(resolved.value, { overrideData, nowIso })
          : evaluateTaskAvailability(null, { nowIso });

        // 4. Idempotent Replay Check (after verifying current authorization!)
        if (idemSnap.exists) {
          const idemData = idemSnap.data();
          if (idemData.requestHash !== requestHash) {
            const err = new Error('This Idempotency-Key was already used with a different review payload.');
            err.statusCode = 409;
            err.code = 'IDEMPOTENCY_KEY_REUSED';
            err.field = 'Idempotency-Key';
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

          const formattedItem = formatSubmissionItem(subSnap.id, subData, {
            registry,
            overrideMap,
            nowIso
          });

          responsePayload = {
            contractVersion: API_CONTRACT_VERSION,
            submissionId: formattedItem.submissionId,
            id: formattedItem.submissionId,
            submissionRevision: formattedItem.submissionRevision,
            attemptNumber: formattedItem.attemptNumber,
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
            coachUid: formattedItem.coachUid,
            coachNote: formattedItem.coachNote,
            reviewedAt: formattedItem.reviewedAt,
            auditEventId: subData.reviewAuditEventId || idemData.auditEventId || null,
            outcome: formattedItem.outcome,
            availability,
            idempotentReplay: true,
            submission: formattedItem
          };
          return;
        }

        // 5. Enforce current task availability before committing a new review decision (§4, §6)
        if (!availability.canSubmit) {
          const err = new Error(availability.reason || 'This mission is not currently open for review.');
          err.statusCode = statusForErrorCode(availability.reasonCode || 'MISSION_NOT_OPEN');
          err.code = availability.reasonCode || 'MISSION_NOT_OPEN';
          throw err;
        }

        // 6. Enforce status === 'submitted' and expectedSubmissionRevision === currentRevision
        const currentRevision = Number.isSafeInteger(subData.submissionRevision) ? subData.submissionRevision : 1;
        if (subData.status !== 'submitted' || validatedReview.expectedSubmissionRevision !== currentRevision) {
          const err = new Error(
            subData.status !== 'submitted'
              ? `Submission has already been reviewed (status is "${subData.status}").`
              : `Submission revision mismatch (expected ${validatedReview.expectedSubmissionRevision}, current is ${currentRevision}).`
          );
          err.statusCode = 409;
          err.code = 'REVIEW_CONFLICT';
          err.details = {
            currentStatus: subData.status,
            currentSubmissionRevision: currentRevision
          };
          throw err;
        }

        const newRevision = currentRevision + 1;
        const decision = validatedReview.decision;
        const cleanNote = validatedReview.note ? validatedReview.note : null;
        const outcome = decision === 'approved' ? buildReviewedOnlyOutcome() : null;
        const auditRef = db.collection('auditLogs').doc();

        const updatedFields = {
          status: decision,
          submissionRevision: newRevision,
          coachUid: caller.uid,
          coachNote: cleanNote,
          reviewedAt: nowTs,
          reviewedAtIso: nowIso,
          outcome,
          reviewAuditEventId: auditRef.id
        };

        const lockData = lockSnap.exists ? lockSnap.data() : null;
        const updatedSubData = { ...subData, ...updatedFields };

        const reviewedBytes = Buffer.byteLength(
          canonicalStringify({
            ...updatedSubData,
            createdAt: subData.createdAtIso || nowIso,
            reviewedAt: nowIso
          }),
          'utf8'
        );
        if (reviewedBytes > MAX_REQUEST_BYTES) {
          const err = new Error('Reviewed submission record exceeds the 64 KiB storage budget.');
          err.statusCode = 413;
          err.code = 'PAYLOAD_TOO_LARGE';
          throw err;
        }

        // Atomically update submission, release open slot, create audit log, and create idempotency record
        transaction.update(subRef, updatedFields);
        transaction.set(lockRef, {
          lockId,
          orgId: subData.orgId,
          learnerUid: subData.learnerUid,
          missionId: subData.missionId,
          status: 'released',
          openSubmissionId: null,
          lastSubmissionId: id,
          lastDecision: decision,
          lastReturnedSubmissionId:
            decision === 'returned' ? id : (lockData?.lastReturnedSubmissionId || null),
          lastReturnedByTask:
            decision === 'returned'
              ? { ...(lockData?.lastReturnedByTask || {}), [overrideId]: id }
              : (lockData?.lastReturnedByTask || {}),
          consumedReturnedIds: lockData?.consumedReturnedIds || [],
          attemptCount: lockData?.attemptCount || subData.attemptNumber || 1,
          updatedAt: nowTs
        });
        transaction.set(auditRef, {
          logId: auditRef.id,
          source: 'server',
          orgId: caller.orgId,
          schoolId: null,
          subjectUid: subData.learnerUid,
          action: `universe.mission.${decision}`,
          actorUid: caller.uid,
          actorName: caller.displayName,
          actorPublicId: caller.publicId || null,
          summary: `Coach ${caller.displayName} ${decision} mission submission ${id} (revision ${newRevision}) for mission ${subData.missionId}`,
          details: {
            submissionId: id,
            submissionRevision: newRevision,
            attemptNumber: updatedSubData.attemptNumber || 1,
            decision,
            note: cleanNote,
            outcome,
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
          submissionId: id,
          auditEventId: auditRef.id,
          createdAt: nowTs
        });

        const formattedItem = formatSubmissionItem(id, updatedSubData, {
          registry,
          nowIso
        });
        formattedItem.availability = availability;

        responsePayload = {
          contractVersion: API_CONTRACT_VERSION,
          submissionId: id,
          id,
          submissionRevision: newRevision,
          attemptNumber: formattedItem.attemptNumber,
          releaseId: formattedItem.releaseId,
          missionId: formattedItem.missionId,
          missionTitle: formattedItem.missionTitle,
          missionVersion: formattedItem.missionVersion,
          missionContentHash: formattedItem.missionContentHash,
          routeId: formattedItem.routeId,
          taskId: formattedItem.taskId,
          supportMode: formattedItem.supportMode,
          policyVersion: formattedItem.policyVersion,
          status: decision,
          coachUid: caller.uid,
          coachNote: cleanNote,
          reviewedAt: nowIso,
          auditEventId: auditRef.id,
          outcome,
          availability,
          idempotentReplay: false,
          submission: formattedItem
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
      console.error('[Coach Universe Review POST Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Failed to review mission submission.');
    }
  });

  return router;
}

export default createCoachUniverseRouter();
