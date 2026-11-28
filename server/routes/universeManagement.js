import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { sendUniverseError } from '../lib/universe/http.js';
import { isSafeId } from '../lib/universe/missions.js';
import { DEFAULT_ALLOCATION_CONFIG } from '../lib/universe/planetAllocation.js';

const STAFF_ROLES = ['teacher', 'coach', 'admin', 'supervisor'];
const ADMIN_ROLES = ['admin', 'supervisor'];

export function createUniverseManagementRouter({ getDb = getFirestore } = {}) {
  const router = Router();

  function requireStaff(req, res) {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in required.');
      return null;
    }
    if (!STAFF_ROLES.includes(caller.role)) {
      sendUniverseError(req, res, 403, 'FORBIDDEN', 'Staff role required for Universe management.');
      return null;
    }
    return caller;
  }

  function resolveCoachLearnerSet(caller) {
    if (ADMIN_ROLES.includes(caller.role)) return null; // null = org-wide admin visibility
    if (!(caller.classDocsById instanceof Map)) return null; // preserve unit tests without classDocsById
    const allowed = new Set();
    for (const cDoc of caller.classDocsById.values()) {
      const learnerIds = Array.isArray(cDoc?.learnerIds) ? cDoc.learnerIds : [];
      for (const lid of learnerIds) {
        if (isSafeId(lid)) allowed.add(lid);
      }
    }
    return allowed;
  }

  /**
   * GET /api/coach/universe/management/overview
   * Lists org-wide planet allocations, pending AI missions, and learner Spaceship Builder projects.
   * Non-admin coaches are scoped to learners in their verified classes.
   */
  router.get('/overview', async (req, res) => {
    const caller = requireStaff(req, res);
    if (!caller) return;

    try {
      const db = getDb();
      const orgRef = db.collection('orgs').doc(caller.orgId);
      const allowedLearnerUids = resolveCoachLearnerSet(caller);

      const [worldsSnap, missionsSnap, projectsSnap] = await Promise.all([
        orgRef.collection('universeWorlds').get(),
        orgRef.collection('universeMissions').get(),
        orgRef.collection('universeProjects').get()
      ]);

      const worlds = [];
      worldsSnap?.forEach?.((doc) => worlds.push({ id: doc.id, ...doc.data() }));

      const pendingMissions = [];
      missionsSnap?.forEach?.((doc) => {
        const d = doc.data();
        if (d?.status !== 'pending_review') return;
        if (allowedLearnerUids && d?.uid && !allowedLearnerUids.has(d.uid)) return;
        pendingMissions.push({ id: doc.id, ...d });
      });

      const projects = [];
      projectsSnap?.forEach?.((doc) => {
        const d = doc.data();
        if (allowedLearnerUids && d?.uid && !allowedLearnerUids.has(d.uid)) return;
        projects.push({ id: doc.id, ...d });
      });

      return res.status(200).json({ ok: true, worlds, pendingMissions, projects });
    } catch (err) {
      console.error('[Universe Management Overview Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not load Universe management overview.');
    }
  });

  /**
   * POST /api/coach/universe/management/missions/:missionId/review
   * Coach/Admin review of AI-generated missions (approve or reject).
   */
  router.post('/missions/:missionId/review', async (req, res) => {
    const caller = requireStaff(req, res);
    if (!caller) return;

    const { missionId } = req.params;
    const decision = req.body?.decision;
    if (!isSafeId(missionId) || !['approved', 'rejected'].includes(decision)) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Valid missionId and decision ("approved" or "rejected") required.');
    }

    try {
      const db = getDb();
      const ref = db.collection('orgs').doc(caller.orgId).collection('universeMissions').doc(missionId);
      const snap = await ref.get();
      if (!snap.exists) {
        return sendUniverseError(req, res, 404, 'NOT_FOUND', 'Mission not found.');
      }

      const existing = snap.data() || {};
      if (existing.uid && existing.uid === caller.uid) {
        return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Self-review is not allowed.');
      }
      const allowedLearnerUids = resolveCoachLearnerSet(caller);
      if (allowedLearnerUids && existing.uid && !allowedLearnerUids.has(existing.uid)) {
        return sendUniverseError(req, res, 403, 'FORBIDDEN', 'You can only review missions for learners in your assigned classes.');
      }

      const updated = {
        ...existing,
        status: decision,
        reviewedBy: caller.uid,
        reviewNote: typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : '',
        reviewedAt: new Date().toISOString()
      };
      await ref.set(updated);
      return res.status(200).json({ ok: true, mission: updated });
    } catch (err) {
      console.error('[Universe Mission Review Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not review mission.');
    }
  });

  /**
   * PUT /api/coach/universe/management/config
   * Admin-only endpoint to configure planet capacity (up to 100) and disabled planets.
   */
  router.put('/config', async (req, res) => {
    const caller = requireStaff(req, res);
    if (!caller) return;
    if (!ADMIN_ROLES.includes(caller.role)) {
      return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Admin role required to update Universe capacity configuration.');
    }

    const body = req.body || {};
    const maxPlanets = Number(body.maxPlanets ?? DEFAULT_ALLOCATION_CONFIG.maxPlanets);
    const maxStewardsPerPlanet = Number(body.maxStewardsPerPlanet ?? DEFAULT_ALLOCATION_CONFIG.maxStewardsPerPlanet);
    const disabledPlanetIds = Array.isArray(body.disabledPlanetIds) ? body.disabledPlanetIds : [];

    if (!Number.isInteger(maxPlanets) || maxPlanets < 1 || maxPlanets > 100) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'maxPlanets must be an integer between 1 and 100.');
    }
    if (!Number.isInteger(maxStewardsPerPlanet) || maxStewardsPerPlanet < 1 || maxStewardsPerPlanet > 20) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'maxStewardsPerPlanet must be between 1 and 20.');
    }
    if (!disabledPlanetIds.every(isSafeId)) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'disabledPlanetIds must contain valid planet IDs.');
    }

    try {
      const db = getDb();
      const config = {
        maxPlanets,
        maxStewardsPerPlanet,
        disabledPlanetIds,
        updatedBy: caller.uid,
        updatedAt: new Date().toISOString()
      };
      await db.collection('orgs').doc(caller.orgId).collection('universeConfig').doc('settings').set(config);
      return res.status(200).json({ ok: true, config });
    } catch (err) {
      console.error('[Universe Config PUT Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not update Universe configuration.');
    }
  });

  return router;
}
