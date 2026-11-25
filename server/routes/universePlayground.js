import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { sendUniverseError } from '../lib/universe/http.js';
import { isSafeId } from '../lib/universe/missions.js';
import {
  PLAYGROUND_VERSION,
  claimPlanet,
  initialPlaygroundState,
  runWeeklyUniverseEvent,
  sendPlanetaryAid
} from '../../src/features/universe/playground/playgroundModel.js';
import { PLANET_GALAXY_MAP, selectBalancedPlanet } from '../lib/universe/planetAllocation.js';
import { buildLearnerContext } from '../lib/universe/learnerContext.js';
import { generateUniverseMission } from '../lib/universe/architect.js';
import {
  FACILITY_RULES,
  completeMissionWithEvidence,
  computeDevelopmentStage,
  unlockFacilityServer
} from '../lib/universe/livingProgression.js';
import { simulateSpaceshipDesign } from '../../src/features/universe/lab/spaceshipSim.js';

const MAX_PLANETS = 32;
const MAX_LOG_ENTRIES = 30;

function playgroundDocRef(db, orgId, uid) {
  return db.collection('orgs').doc(orgId).collection('universePlayground').doc(uid);
}

function sanitizePlaygroundState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (raw.version !== PLAYGROUND_VERSION) return null;
  if (!Number.isInteger(raw.credits) || raw.credits < 0 || raw.credits > 1_000_000) return null;
  if (!isSafeId(raw.claimedPlanetId)) return null;
  if (!Number.isInteger(raw.week) || raw.week < 1 || raw.week > 10_000) return null;
  if (!raw.planets || typeof raw.planets !== 'object' || Array.isArray(raw.planets)) return null;
  if (Object.keys(raw.planets).length > MAX_PLANETS) return null;

  return {
    version: PLAYGROUND_VERSION,
    credits: raw.credits,
    claimedPlanetId: raw.claimedPlanetId,
    completedGoals: Array.isArray(raw.completedGoals) ? raw.completedGoals.slice(-100) : [],
    syncedSparkGoalIds: Array.isArray(raw.syncedSparkGoalIds) ? raw.syncedSparkGoalIds.slice(-100) : [],
    aidedThisWeek: Array.isArray(raw.aidedThisWeek) ? raw.aidedThisWeek.slice(0, 10) : [],
    week: raw.week,
    weeklyBulletin: Array.isArray(raw.weeklyBulletin) ? raw.weeklyBulletin.slice(0, 10) : [],
    captainsLog: Array.isArray(raw.captainsLog) ? raw.captainsLog.slice(0, MAX_LOG_ENTRIES) : [],
    planets: raw.planets
  };
}

export function createUniversePlaygroundRouter({ getDb = getFirestore } = {}) {
  const router = Router();

  router.get('/', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to access your Universe Playground.');
    }

    try {
      const db = getDb();
      const ref = playgroundDocRef(db, caller.orgId, caller.uid);
      const snap = await ref.get();
      if (!snap.exists) {
        const starter = initialPlaygroundState('thalassa');
        await ref.set({ ...starter, updatedAt: new Date().toISOString() });
        return res.status(200).json({ state: starter, source: 'initialized' });
      }
      const data = snap.data();
      const clean = sanitizePlaygroundState(data) || initialPlaygroundState('thalassa');
      return res.status(200).json({ state: clean, source: 'firestore' });
    } catch (err) {
      console.error('[Universe Playground GET Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not load playground state.');
    }
  });

  router.put('/state', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to save your Universe Playground.');
    }

    const clean = sanitizePlaygroundState(req.body?.state);
    if (!clean) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Invalid playground state payload.', { field: 'state' });
    }

    try {
      const db = getDb();
      const ref = playgroundDocRef(db, caller.orgId, caller.uid);
      const existingSnap = await ref.get();
      const existing = existingSnap.exists ? existingSnap.data() : {};
      // Server-authoritative progression fields cannot be forged via PUT /state
      const merged = {
        ...clean,
        unlockedFacilities: Array.isArray(existing.unlockedFacilities) ? existing.unlockedFacilities : [],
        completedMissionIds: Array.isArray(existing.completedMissionIds) ? existing.completedMissionIds : [],
        verifiedCompetencies: Array.isArray(existing.verifiedCompetencies) ? existing.verifiedCompetencies : [],
        developmentStage: existing.developmentStage || 'initial_settlement',
        developmentHistory: Array.isArray(existing.developmentHistory) ? existing.developmentHistory : [],
        updatedAt: new Date().toISOString()
      };
      await ref.set(merged);
      return res.status(200).json({ ok: true, state: merged });
    } catch (err) {
      console.error('[Universe Playground PUT Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not save playground state.');
    }
  });

  router.post('/weekly-event', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to trigger a weekly event.');
    }

    const planetIds = req.body?.planetIds;
    if (!Array.isArray(planetIds) || planetIds.length === 0 || planetIds.length > 50 || !planetIds.every(isSafeId)) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'planetIds must be a non-empty list of valid planet IDs.', { field: 'planetIds' });
    }

    try {
      const db = getDb();
      const ref = playgroundDocRef(db, caller.orgId, caller.uid);
      const snap = await ref.get();
      const current = snap.exists ? (sanitizePlaygroundState(snap.data()) || initialPlaygroundState(planetIds[0])) : initialPlaygroundState(planetIds[0]);
      const next = runWeeklyUniverseEvent(current, planetIds);
      await ref.set({ ...next, updatedAt: new Date().toISOString() });
      return res.status(200).json({ ok: true, state: next });
    } catch (err) {
      console.error('[Universe Playground Weekly Event Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not trigger weekly universe event.');
    }
  });

  /**
   * POST /api/universe/playground/allocate
   * Balanced, capacity-aware server-side planet assignment for the signed-in learner.
   */
  router.post('/allocate', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to allocate an exoplanet.');
    }

    try {
      const db = getDb();
      const worldsCol = db.collection('orgs').doc(caller.orgId).collection('universeWorlds');
      const worldSnaps = await worldsCol.get();
      const existingAssignments = {};
      if (worldSnaps && typeof worldSnaps.forEach === 'function') {
        worldSnaps.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data?.stewardUids)) existingAssignments[doc.id] = data.stewardUids;
        });
      }

      const allocation = selectBalancedPlanet({
        uid: caller.uid,
        existingAssignments,
        config: req.body?.config
      });
      if (!allocation.ok) {
        return sendUniverseError(req, res, 409, 'CAPACITY_REACHED', `Cannot allocate planet: ${allocation.reason}`);
      }

      if (!allocation.reused) {
        const currentStewards = existingAssignments[allocation.planetId] || [];
        await worldsCol.doc(allocation.planetId).set({
          planetId: allocation.planetId,
          galaxyId: allocation.galaxyId,
          stewardUids: [...currentStewards, caller.uid],
          updatedAt: new Date().toISOString()
        });
      }

      const pgRef = playgroundDocRef(db, caller.orgId, caller.uid);
      const pgSnap = await pgRef.get();
      const currentPg = pgSnap.exists
        ? (sanitizePlaygroundState(pgSnap.data()) || initialPlaygroundState(allocation.planetId))
        : initialPlaygroundState(allocation.planetId);
      const nextPg = claimPlanet(currentPg, allocation.planetId);
      await pgRef.set({ ...nextPg, updatedAt: new Date().toISOString() });

      return res.status(200).json({ ok: true, allocation, state: nextPg });
    } catch (err) {
      console.error('[Universe Allocation Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not allocate exoplanet.');
    }
  });

  /**
   * GET /api/universe/playground/context
   * Minimal, PII-free Learner Intelligence summary for the signed-in learner.
   */
  router.get('/context', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to load learner context.');
    }

    try {
      const db = getDb();
      const pgSnap = await playgroundDocRef(db, caller.orgId, caller.uid).get();
      const pg = pgSnap.exists ? (sanitizePlaygroundState(pgSnap.data()) || initialPlaygroundState('thalassa')) : initialPlaygroundState('thalassa');
      const previousMissionTitles = Array.isArray(pgSnap.data()?.missionHistory) ? pgSnap.data().missionHistory : [];
      const context = buildLearnerContext({
        uid: caller.uid,
        orgId: caller.orgId,
        playgroundState: pg,
        previousMissionTitles
      });
      return res.status(200).json({ ok: true, context });
    } catch (err) {
      console.error('[Universe Context Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not load learner intelligence context.');
    }
  });

  /**
   * POST /api/universe/playground/missions/generate
   * Runs Learner Intelligence -> AI Universe Architect -> Validation Pipeline -> stores mission.
   */
  router.post('/missions/generate', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to generate a STEM mission.');
    }

    try {
      const db = getDb();
      const pgRef = playgroundDocRef(db, caller.orgId, caller.uid);
      const pgSnap = await pgRef.get();
      const pgData = pgSnap.exists ? pgSnap.data() : {};
      const pg = pgSnap.exists ? (sanitizePlaygroundState(pgData) || initialPlaygroundState('thalassa')) : initialPlaygroundState('thalassa');
      const previousMissionTitles = Array.isArray(pgData?.missionHistory) ? pgData.missionHistory : [];

      const context = buildLearnerContext({
        uid: caller.uid,
        orgId: caller.orgId,
        playgroundState: pg,
        previousMissionTitles
      });
      const generated = await generateUniverseMission({ context });
      const missionId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const missionRecord = { id: missionId, uid: caller.uid, orgId: caller.orgId, ...generated.mission };

      await db.collection('orgs').doc(caller.orgId).collection('universeMissions').doc(missionId).set(missionRecord);
      await pgRef.set({
        ...pg,
        missionHistory: [...previousMissionTitles, missionRecord.title].slice(-25),
        updatedAt: new Date().toISOString()
      });

      return res.status(200).json({ ok: true, source: generated.source, mission: missionRecord });
    } catch (err) {
      console.error('[Universe Architect Generate Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not generate STEM mission.');
    }
  });

  /**
   * GET /api/universe/playground/progression
   * Returns facility rules, current developmentStage, unlockedFacilities, and history.
   */
  router.get('/progression', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to view planet progression.');
    }

    try {
      const db = getDb();
      const snap = await playgroundDocRef(db, caller.orgId, caller.uid).get();
      const data = snap.exists ? snap.data() : initialPlaygroundState('thalassa');
      const unlockedFacilities = Array.isArray(data.unlockedFacilities) ? data.unlockedFacilities : [];
      const developmentStage = computeDevelopmentStage(unlockedFacilities);
      return res.status(200).json({
        ok: true,
        facilityRules: FACILITY_RULES,
        developmentStage,
        unlockedFacilities,
        completedMissionIds: Array.isArray(data.completedMissionIds) ? data.completedMissionIds : [],
        verifiedCompetencies: Array.isArray(data.verifiedCompetencies) ? data.verifiedCompetencies : [],
        developmentHistory: Array.isArray(data.developmentHistory) ? data.developmentHistory : []
      });
    } catch (err) {
      console.error('[Universe Progression GET Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not load progression state.');
    }
  });

  /**
   * POST /api/universe/playground/missions/:missionId/complete
   * Records mission completion with supporting evidence idempotently.
   */
  router.post('/missions/:missionId/complete', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to complete a mission.');
    }
    const { missionId } = req.params;
    if (!isSafeId(missionId)) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Invalid missionId.');
    }

    try {
      const db = getDb();
      const missionRef = db.collection('orgs').doc(caller.orgId).collection('universeMissions').doc(missionId);
      const missionSnap = await missionRef.get();
      if (!missionSnap.exists) {
        return sendUniverseError(req, res, 404, 'NOT_FOUND', 'Mission not found.');
      }
      const mission = missionSnap.data();
      if (mission.uid && mission.uid !== caller.uid) {
        return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Cannot complete another learner’s mission.');
      }

      const pgRef = playgroundDocRef(db, caller.orgId, caller.uid);
      const pgSnap = await pgRef.get();
      const current = pgSnap.exists ? pgSnap.data() : initialPlaygroundState('thalassa');

      const result = completeMissionWithEvidence({
        playgroundState: current,
        mission,
        evidence: req.body?.evidence
      });
      if (!result.ok) {
        const status = result.code === 'DUPLICATE_COMPLETION' ? 409 : 400;
        return sendUniverseError(req, res, status, result.code, result.message);
      }

      await pgRef.set({ ...result.state, updatedAt: new Date().toISOString() });
      await missionRef.set({ ...mission, completedAt: new Date().toISOString(), status: 'completed' });
      return res.status(200).json({
        ok: true,
        creditsAwarded: result.creditsAwarded,
        historyEntry: result.historyEntry,
        state: result.state
      });
    } catch (err) {
      console.error('[Universe Mission Complete Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not complete mission.');
    }
  });

  /**
   * POST /api/universe/playground/facilities/unlock
   * Server-authoritative facility unlock gated by credits, completed missions, and competencies.
   */
  router.post('/facilities/unlock', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to unlock planetary facilities.');
    }
    const facilityId = req.body?.facilityId;
    if (!isSafeId(facilityId)) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Valid facilityId is required.', { field: 'facilityId' });
    }

    try {
      const db = getDb();
      const pgRef = playgroundDocRef(db, caller.orgId, caller.uid);
      const pgSnap = await pgRef.get();
      const current = pgSnap.exists ? pgSnap.data() : initialPlaygroundState('thalassa');

      const result = unlockFacilityServer({ playgroundState: current, facilityId });
      if (!result.ok) {
        const status = result.code === 'NOT_FOUND' ? 404 : result.code === 'ALREADY_UNLOCKED' ? 409 : 403;
        return sendUniverseError(req, res, status, result.code, result.message);
      }

      await pgRef.set({ ...result.state, updatedAt: new Date().toISOString() });
      return res.status(200).json({
        ok: true,
        facility: result.facility,
        developmentStage: result.developmentStage,
        notification: result.notification,
        state: result.state
      });
    } catch (err) {
      console.error('[Universe Facility Unlock Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not unlock facility.');
    }
  });

  /**
   * GET /api/universe/playground/projects
   * Lists the signed-in learner's saved Spaceship Builder projects.
   */
  router.get('/projects', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to view lab projects.');
    }
    try {
      const db = getDb();
      const snaps = await db.collection('orgs').doc(caller.orgId).collection('universeProjects').get();
      const projects = [];
      if (snaps && typeof snaps.forEach === 'function') {
        snaps.forEach((doc) => {
          const d = doc.data();
          if (d?.uid === caller.uid) projects.push({ id: doc.id, ...d });
        });
      }
      return res.status(200).json({ ok: true, projects });
    } catch (err) {
      console.error('[Universe Projects GET Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not load lab projects.');
    }
  });

  /**
   * POST /api/universe/playground/projects
   * Saves a Spaceship Builder design version and re-verifies physics simulation server-side.
   */
  router.post('/projects', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to save lab projects.');
    }
    const { name, purpose, passengers, parts, reflection } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || !parts || typeof parts !== 'object') {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Spaceship name and parts are required.');
    }

    try {
      const verifiedSimulation = simulateSpaceshipDesign({ name, purpose, passengers, parts });
      const projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const record = {
        id: projectId,
        uid: caller.uid,
        orgId: caller.orgId,
        labType: 'engineering',
        projectType: 'spaceship-builder',
        name: verifiedSimulation.craftName,
        purpose: verifiedSimulation.purpose,
        passengers: verifiedSimulation.passengers,
        parts: verifiedSimulation.parts,
        simulationRun: verifiedSimulation,
        reflection: typeof reflection === 'string' ? reflection.trim().slice(0, 1000) : '',
        createdAt: new Date().toISOString()
      };
      const db = getDb();
      await db.collection('orgs').doc(caller.orgId).collection('universeProjects').doc(projectId).set(record);
      return res.status(200).json({ ok: true, project: record });
    } catch (err) {
      console.error('[Universe Projects POST Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not save lab project.');
    }
  });

  /**
   * GET /api/universe/playground/galaxies
   * Returns org-wide galaxy collaboration stats and planet steward counts.
   */
  router.get('/galaxies', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to view galaxy stats.');
    }
    try {
      const db = getDb();
      const snaps = await db.collection('orgs').doc(caller.orgId).collection('universeWorlds').get();
      const stats = {
        'lyra-spiral': { id: 'lyra-spiral', name: 'Lyra Spiral', planetCount: 5, stewardCount: 0 },
        'aurora-elliptical': { id: 'aurora-elliptical', name: 'Aurora Elliptical', planetCount: 5, stewardCount: 0 },
        'cygnus-nebula': { id: 'cygnus-nebula', name: 'Cygnus Vortex', planetCount: 5, stewardCount: 0 }
      };
      if (snaps && typeof snaps.forEach === 'function') {
        snaps.forEach((doc) => {
          const d = doc.data();
          const gid = d?.galaxyId || PLANET_GALAXY_MAP[doc.id] || 'lyra-spiral';
          if (stats[gid] && Array.isArray(d?.stewardUids)) {
            stats[gid].stewardCount += d.stewardUids.length;
          }
        });
      }
      return res.status(200).json({ ok: true, galaxies: Object.values(stats) });
    } catch (err) {
      console.error('[Universe Galaxies GET Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not load galaxy collaboration stats.');
    }
  });

  /**
   * POST /api/universe/playground/aid
   * Server-authoritative co-op aid for classmates hit by weekly Universe Creator hazards.
   */
  router.post('/aid', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to send planetary aid.');
    }
    const targetPlanetId = req.body?.targetPlanetId;
    if (!isSafeId(targetPlanetId)) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Valid targetPlanetId is required.');
    }

    try {
      const db = getDb();
      const pgRef = playgroundDocRef(db, caller.orgId, caller.uid);
      const pgSnap = await pgRef.get();
      const current = pgSnap.exists ? pgSnap.data() : initialPlaygroundState('thalassa');

      const result = sendPlanetaryAid(current, targetPlanetId);
      if (!result.ok) {
        const status = result.reason === 'already-aided' ? 409 : 400;
        return sendUniverseError(req, res, status, 'AID_REJECTED', `Cannot send aid: ${result.reason}`);
      }

      await pgRef.set({ ...result.state, updatedAt: new Date().toISOString() });
      return res.status(200).json({ ok: true, creditDelta: result.creditDelta, state: result.state });
    } catch (err) {
      console.error('[Universe Aid POST Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not send planetary aid.');
    }
  });

  return router;
}
