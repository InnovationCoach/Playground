import { Router } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { getMission, isValidMissionRoute, isMissionReviewed } from '../lib/universe/missions.js';

const router = Router();

/**
 * POST /api/universe/missions/:missionId/submissions
 * Submit a mission reflection for coach review.
 */
router.post('/missions/:missionId/submissions', requireClaims, async (req, res) => {
  const { missionId } = req.params;
  const { routeId, missionVersion, reflection } = req.body || {};
  const learnerUid = req.caller?.uid;

  if (!learnerUid) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Sign-in required.');
  }

  const mission = getMission(missionId);
  if (!mission) {
    return sendError(res, 404, 'NOT_FOUND', `Mission "${missionId}" not found in registry.`);
  }

  if (!isValidMissionRoute(missionId, missionVersion, routeId)) {
    return sendError(res, 400, 'VALIDATION_ERROR', `Invalid route "${routeId}" or version "${missionVersion}".`);
  }

  // Enforce reflection length: 20 to 2,000 characters
  if (typeof reflection !== 'string' || reflection.trim().length < 20 || reflection.trim().length > 2000) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Reflection must be between 20 and 2,000 characters.');
  }

  // Draft check: only reviewed missions may accept submissions in production.
  // Allow drafts if process.env.ALLOW_DRAFT_MISSIONS === 'true' (test/emulator flag).
  const isReviewed = isMissionReviewed(missionId, missionVersion);
  if (!isReviewed && process.env.ALLOW_DRAFT_MISSIONS !== 'true') {
    return sendError(res, 409, 'CONFLICT', `Mission "${missionId}" is a draft and cannot be submitted for coach review.`);
  }

  const db = getFirestore();

  try {
    // Enforce 1 open submission per learner per mission
    const openSnap = await db.collection('missionSubmissions')
      .where('learnerUid', '==', learnerUid)
      .where('missionId', '==', missionId)
      .where('status', '==', 'submitted')
      .limit(1)
      .get();

    if (!openSnap.empty) {
      return sendError(res, 409, 'CONFLICT', 'You already have an open submission for this mission.');
    }

    // Retrieve learner classIds from user document or claims
    const userDoc = await db.collection('users').doc(learnerUid).get();
    const classIds = userDoc.exists && Array.isArray(userDoc.data()?.classIds)
      ? userDoc.data().classIds
      : (req.caller?.classIds || []);

    const docRef = db.collection('missionSubmissions').doc();
    const submissionData = {
      id: docRef.id,
      learnerUid,
      classIds,
      missionId,
      missionVersion,
      routeId,
      reflection: reflection.trim(),
      status: 'submitted',
      coachUid: null,
      coachNote: null,
      createdAt: FieldValue.serverTimestamp(),
      reviewedAt: null
    };

    await docRef.set(submissionData);

    return res.status(201).json({
      submissionId: docRef.id,
      status: 'submitted',
      missionId,
      routeId
    });
  } catch (err) {
    console.error('[Universe Submission Error]:', err);
    return sendError(res, 500, 'INTERNAL', 'Failed to save mission submission.');
  }
});

/**
 * GET /api/universe/missions/submissions/mine
 * Get the signed-in learner's own mission submissions (newest first).
 */
router.get('/missions/submissions/mine', requireClaims, async (req, res) => {
  const learnerUid = req.caller?.uid;
  if (!learnerUid) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Sign-in required.');
  }

  try {
    const db = getFirestore();
    const snap = await db.collection('missionSubmissions')
      .where('learnerUid', '==', learnerUid)
      .get();

    const submissions = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

    return res.json({ submissions });
  } catch (err) {
    console.error('[Universe Submissions Mine Error]:', err);
    return sendError(res, 500, 'INTERNAL', 'Failed to fetch submissions.');
  }
});

/**
 * POST /api/universe/access
 * Authoritative destination access check.
 */
router.post('/access', requireClaims, async (req, res) => {
  const learnerUid = req.caller?.uid;
  if (!learnerUid) {
    return sendError(res, 401, 'UNAUTHENTICATED', 'Sign-in required.');
  }

  const { planetIds } = req.body || {};
  if (!Array.isArray(planetIds) || planetIds.length > 100) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'planetIds must be an array of at most 100 items.');
  }

  const db = getFirestore();
  const destinations = {};

  try {
    // Fetch approved missions for this learner
    const approvedSnap = await db.collection('missionSubmissions')
      .where('learnerUid', '==', learnerUid)
      .where('status', '==', 'approved')
      .get();

    const approvedMissionIds = new Set(approvedSnap.docs.map(doc => doc.data().missionId));

    for (const planetId of planetIds) {
      if (typeof planetId !== 'string' || planetId.length > 64) continue;

      if (planetId === 'thalassa' || planetId === 'ignis') {
        // Public planets per catalog 1.1.0
        destinations[planetId] = {
          status: 'available',
          evaluatedRule: null,
          isVerified: true
        };
      } else if (planetId === 'boreas') {
        // Gated planet unlocked by approved 'spacecraft-journey' mission
        const isApproved = approvedMissionIds.has('spacecraft-journey');
        destinations[planetId] = {
          status: isApproved ? 'available' : 'locked',
          evaluatedRule: 'mission:spacecraft-journey',
          isVerified: isApproved
        };
      } else {
        // Default unconfigured planets
        destinations[planetId] = {
          status: 'available',
          evaluatedRule: null,
          isVerified: true
        };
      }
    }

    return res.json({
      evaluatedAt: new Date().toISOString(),
      destinations
    });
  } catch (err) {
    console.error('[Universe Access Error]:', err);
    return sendError(res, 500, 'INTERNAL', 'Failed to evaluate destination access.');
  }
});

export default router;
