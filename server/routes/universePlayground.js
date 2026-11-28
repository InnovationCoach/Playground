import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { sendUniverseError } from '../lib/universe/http.js';
import { isSafeId } from '../lib/universe/missions.js';
import {
  PLAYGROUND_VERSION,
  GOAL_REWARDS,
  claimPlanet,
  formatCoopStewardName,
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
const VALID_ATMOSPHERES = new Set(['thin', 'toxic', 'breathable', 'shielded']);

const KNOWN_PARTS = {
  hull: new Set(['lightweight-alloy', 'composite-frame', 'titanium-hull']),
  propulsion: new Set(['ion-thruster', 'chemical-booster', 'plasma-drive']),
  power: new Set(['solar-array', 'rtg-core', 'fusion-microcell']),
  shield: new Set(['thermal-shield', 'radiation-canopy', 'oxygen-scrubber'])
};

const GOAL_CREDIT_MAP = new Map(GOAL_REWARDS.map((g) => [g.id, g.credits]));

function playgroundDocRef(db, orgId, uid) {
  return db.collection('orgs').doc(orgId).collection('universePlayground').doc(uid);
}

function clampStat(val, fallback = 30) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function sanitizePlanetRecord(pid, rawPlanet) {
  if (!isSafeId(pid) || !rawPlanet || typeof rawPlanet !== 'object' || Array.isArray(rawPlanet)) {
    return null;
  }
  const activeHazard =
    rawPlanet.activeHazard && typeof rawPlanet.activeHazard === 'object' && !Array.isArray(rawPlanet.activeHazard)
      ? {
          id: isSafeId(rawPlanet.activeHazard.id) ? rawPlanet.activeHazard.id : 'solar-flare',
          title: typeof rawPlanet.activeHazard.title === 'string' ? rawPlanet.activeHazard.title.slice(0, 80) : 'Planetary Hazard',
          desc: typeof rawPlanet.activeHazard.desc === 'string' ? rawPlanet.activeHazard.desc.slice(0, 240) : '',
          targetStat: typeof rawPlanet.activeHazard.targetStat === 'string' ? rawPlanet.activeHazard.targetStat.slice(0, 32) : 'habitability',
          penalty: Number.isFinite(Number(rawPlanet.activeHazard.penalty)) ? Math.max(0, Math.min(50, Math.round(Number(rawPlanet.activeHazard.penalty)))) : 10,
          mitigationFeature: isSafeId(rawPlanet.activeHazard.mitigationFeature) ? rawPlanet.activeHazard.mitigationFeature : 'magnetic-shield',
          week: Number.isInteger(rawPlanet.activeHazard.week) ? rawPlanet.activeHazard.week : 1
        }
      : null;

  return {
    planetId: pid,
    habitability: clampStat(rawPlanet.habitability, 35),
    biodiversity: clampStat(rawPlanet.biodiversity, 10),
    shielding: clampStat(rawPlanet.shielding, 20),
    research: clampStat(rawPlanet.research, 15),
    atmosphere: VALID_ATMOSPHERES.has(rawPlanet.atmosphere) ? rawPlanet.atmosphere : 'thin',
    discoveredSpecies: Array.isArray(rawPlanet.discoveredSpecies)
      ? rawPlanet.discoveredSpecies.filter(isSafeId).slice(0, 20)
      : [],
    cultivatedSpecies: Array.isArray(rawPlanet.cultivatedSpecies)
      ? rawPlanet.cultivatedSpecies.filter(isSafeId).slice(0, 20)
      : [],
    features: Array.isArray(rawPlanet.features)
      ? rawPlanet.features.filter(isSafeId).slice(0, 20)
      : [],
    activeHazard
  };
}

function sanitizeSavedShips(rawShips) {
  if (!Array.isArray(rawShips)) return [];
  const sanitized = [];
  for (const ship of rawShips) {
    if (!ship || typeof ship !== 'object' || Array.isArray(ship)) continue;
    if (!isSafeId(ship.id) || ship.id.length > 80) continue;
    if (!Number.isInteger(ship.version) || ship.version < 1) continue;
    if (typeof ship.name !== 'string' || !ship.name.trim() || ship.name.length > 80) continue;
    if (typeof ship.purpose !== 'string' || ship.purpose.length > 120) continue;
    if (!Number.isInteger(ship.passengers) || ship.passengers < 1 || ship.passengers > 12) continue;

    const parts = ship.parts;
    if (!parts || typeof parts !== 'object' || Array.isArray(parts)) continue;
    if (!KNOWN_PARTS.hull.has(parts.hull)) continue;
    if (!KNOWN_PARTS.propulsion.has(parts.propulsion)) continue;
    if (!KNOWN_PARTS.power.has(parts.power)) continue;
    if (!KNOWN_PARTS.shield.has(parts.shield)) continue;

    const sim = ship.simulation;
    if (!sim || typeof sim !== 'object' || Array.isArray(sim)) continue;
    const diagnostics = Array.isArray(sim.diagnostics)
      ? sim.diagnostics.slice(0, 6).filter((d) => typeof d === 'string').map((d) => d.slice(0, 200))
      : [];
    const metrics = (sim.metrics && typeof sim.metrics === 'object' && !Array.isArray(sim.metrics)) ? {
      totalMassKg: Number(sim.metrics.totalMassKg) || 0,
      thrustToWeightRatio: Number(sim.metrics.thrustToWeightRatio) || 0,
      powerOutputKw: Number(sim.metrics.powerOutputKw) || 0,
      powerDrawKw: Number(sim.metrics.powerDrawKw) || 0,
      powerBalanceKw: Number(sim.metrics.powerBalanceKw) || 0,
      deltaVKms: Number(sim.metrics.deltaVKms) || 0,
      shieldRating: Number(sim.metrics.shieldRating) || 0,
      maxSafePassengers: Number(sim.metrics.maxSafePassengers) || 0
    } : {};

    const reflection = typeof ship.reflection === 'string' ? ship.reflection.slice(0, 500) : '';
    const savedAt = typeof ship.savedAt === 'string' && !isNaN(Date.parse(ship.savedAt))
      ? ship.savedAt
      : new Date().toISOString();

    sanitized.push({
      id: ship.id,
      version: ship.version,
      name: ship.name.trim(),
      purpose: ship.purpose,
      passengers: ship.passengers,
      parts: {
        hull: parts.hull,
        propulsion: parts.propulsion,
        power: parts.power,
        shield: parts.shield
      },
      simulation: {
        passed: Boolean(sim.passed),
        metrics,
        diagnostics
      },
      reflection,
      savedAt
    });

    if (sanitized.length >= 20) break;
  }
  return sanitized;
}

function isSafeAidId(id) {
  if (typeof id !== 'string' || id.length < 1 || id.length > 140) return false;
  return /^[a-zA-Z0-9_:-]+$/.test(id);
}

function sanitizePlaygroundState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (raw.version !== PLAYGROUND_VERSION) return null;
  if (!Number.isInteger(raw.credits) || raw.credits < 0 || raw.credits > 1_000_000) return null;
  if (!isSafeId(raw.claimedPlanetId)) return null;
  if (!Number.isInteger(raw.week) || raw.week < 1 || raw.week > 10_000) return null;
  if (!raw.planets || typeof raw.planets !== 'object' || Array.isArray(raw.planets)) return null;
  const planetEntries = Object.entries(raw.planets);
  if (planetEntries.length > MAX_PLANETS) return null;

  const cleanPlanets = {};
  for (const [pid, pVal] of planetEntries) {
    const cleanP = sanitizePlanetRecord(pid, pVal);
    if (!cleanP) return null;
    cleanPlanets[pid] = cleanP;
  }

  let cleanCompletedGoals = [];
  if (Array.isArray(raw.completedGoals)) {
    const seenGoalIds = new Set();
    for (const g of raw.completedGoals) {
      const gid = typeof g === 'string' ? g : g?.goalId;
      if (!gid || typeof gid !== 'string' || !isSafeId(gid)) return null;
      if (seenGoalIds.has(gid)) return null; // Reject duplicate goalId
      seenGoalIds.add(gid);
    }
    cleanCompletedGoals = raw.completedGoals.slice(-100);
  }

  return {
    version: PLAYGROUND_VERSION,
    credits: raw.credits,
    claimedPlanetId: raw.claimedPlanetId,
    completedGoals: cleanCompletedGoals,
    syncedSparkGoalIds: Array.isArray(raw.syncedSparkGoalIds)
      ? raw.syncedSparkGoalIds.filter(isSafeId).slice(-100)
      : [],
    aidedThisWeek: Array.isArray(raw.aidedThisWeek)
      ? raw.aidedThisWeek.filter(isSafeAidId).slice(0, 20)
      : [],
    week: raw.week,
    weeklyBulletin: Array.isArray(raw.weeklyBulletin) ? raw.weeklyBulletin.slice(0, 10) : [],
    captainsLog: Array.isArray(raw.captainsLog) ? raw.captainsLog.slice(0, MAX_LOG_ENTRIES) : [],
    savedShips: sanitizeSavedShips(raw.savedShips),
    planets: cleanPlanets
  };
}

function preserveServerFields(existing = {}, nextState = {}, callerDisplayName = '') {
  const labelCandidate = callerDisplayName || existing?.stewardLabel || '';
  const stewardLabel = labelCandidate ? formatCoopStewardName(labelCandidate, 'Classmate') : (existing?.stewardLabel || 'Classmate');
  return {
    ...nextState,
    stewardLabel,
    unlockedFacilities: Array.isArray(existing?.unlockedFacilities) ? existing.unlockedFacilities : [],
    completedMissionIds: Array.isArray(existing?.completedMissionIds) ? existing.completedMissionIds : [],
    verifiedCompetencies: Array.isArray(existing?.verifiedCompetencies) ? existing.verifiedCompetencies : [],
    developmentStage: existing?.developmentStage || 'initial_settlement',
    developmentHistory: Array.isArray(existing?.developmentHistory) ? existing.developmentHistory : [],
    missionHistory: Array.isArray(existing?.missionHistory) ? existing.missionHistory : []
  };
}

function resolveVerifiedClassmateUids(caller) {
  if (!(caller?.classDocsById instanceof Map)) return [];
  const peers = new Set();
  for (const cDoc of caller.classDocsById.values()) {
    const learnerIds = Array.isArray(cDoc?.learnerIds) ? cDoc.learnerIds : [];
    for (const lid of learnerIds) {
      if (isSafeId(lid) && lid !== caller.uid) {
        peers.add(lid);
      }
    }
  }
  return Array.from(peers).slice(0, 40);
}

async function resolvePeerStewardName(db, peerUid, pgData) {
  if (typeof pgData?.stewardLabel === 'string' && pgData.stewardLabel.trim() && pgData.stewardLabel !== 'Classmate') {
    return formatCoopStewardName(pgData.stewardLabel, 'Classmate');
  }
  try {
    const userRef = db.collection('users')?.doc?.(peerUid);
    if (typeof userRef?.get === 'function') {
      const uSnap = await userRef.get();
      if (uSnap?.exists) {
        const rawName = uSnap.data()?.displayName || '';
        if (rawName && !String(rawName).includes('@')) {
          return formatCoopStewardName(rawName, 'Classmate');
        }
      }
    }
  } catch {
    // Non-fatal fallback to privacy-safe label
  }
  return formatCoopStewardName(pgData?.stewardLabel || '', 'Classmate');
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
        const starter = preserveServerFields({}, initialPlaygroundState('thalassa'), caller.displayName);
        await ref.set({ ...starter, updatedAt: new Date().toISOString() });
        return res.status(200).json({ state: starter, source: 'initialized' });
      }
      const data = snap.data() || {};
      const baseClean = sanitizePlaygroundState(data) || initialPlaygroundState('thalassa');
      const clean = preserveServerFields(data, baseClean, caller.displayName);
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

      // Server-authoritative credit capping (B2)
      const prevCredits = typeof existing.credits === 'number' ? existing.credits : 100;
      const existingGoalIds = new Set(
        (Array.isArray(existing.completedGoals) ? existing.completedGoals : [])
          .map((g) => (typeof g === 'string' ? g : g?.goalId))
          .filter(Boolean)
      );

      let newlyAddedGoalRewards = 0;
      for (const g of clean.completedGoals) {
        const gid = typeof g === 'string' ? g : g?.goalId;
        if (gid && !existingGoalIds.has(gid)) {
          const reward = GOAL_CREDIT_MAP.get(gid) ?? 0;
          newlyAddedGoalRewards += reward;
        }
      }

      const existingSparkIds = new Set(
        Array.isArray(existing.syncedSparkGoalIds) ? existing.syncedSparkGoalIds : []
      );
      const newlySyncedSparkCount = clean.syncedSparkGoalIds.filter((id) => !existingSparkIds.has(id)).length;
      const sparkCredits = newlySyncedSparkCount * 50;

      const existingAided = new Set(Array.isArray(existing.aidedThisWeek) ? existing.aidedThisWeek : []);
      const newlyAidedCount = clean.aidedThisWeek.filter((id) => !existingAided.has(id)).length;
      const aidCredits = newlyAidedCount * 10;

      const maxAllowedCredits = prevCredits + newlyAddedGoalRewards + sparkCredits + aidCredits;
      const authorizedCredits = Math.max(0, Math.min(clean.credits, maxAllowedCredits));

      // Server-authoritative progression fields cannot be forged via PUT /state
      const merged = {
        ...preserveServerFields(existing, { ...clean, credits: authorizedCredits }, caller.displayName),
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
      const existingData = snap.exists ? snap.data() : {};
      const current = snap.exists ? (sanitizePlaygroundState(existingData) || initialPlaygroundState(planetIds[0])) : initialPlaygroundState(planetIds[0]);
      const next = preserveServerFields(existingData, runWeeklyUniverseEvent(current, planetIds), caller.displayName);
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

      const cfgRef = db.collection('orgs').doc(caller.orgId).collection('universeConfig').doc('settings');
      const cfgSnap = typeof cfgRef?.get === 'function' ? await cfgRef.get() : null;
      const orgConfig = cfgSnap?.exists ? cfgSnap.data() : req.body?.config;

      const allocation = selectBalancedPlanet({
        uid: caller.uid,
        existingAssignments,
        config: orgConfig
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
      const existingData = pgSnap.exists ? pgSnap.data() : {};
      const currentPg = pgSnap.exists
        ? (sanitizePlaygroundState(existingData) || initialPlaygroundState(allocation.planetId))
        : initialPlaygroundState(allocation.planetId);
      const nextPg = preserveServerFields(existingData, claimPlanet(currentPg, allocation.planetId), caller.displayName);
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
      const nextPg = preserveServerFields(pgData, pg, caller.displayName);
      await pgRef.set({
        ...nextPg,
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
      const col = db.collection('orgs').doc(caller.orgId).collection('universeProjects');
      const snaps = typeof col.where === 'function'
        ? await col.where('uid', '==', caller.uid).get()
        : await col.get();
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
   * GET /api/universe/playground/classmates
   * Classroom Co-Op Privacy Mode: returns privacy-safe ("First L.") planet snapshots
   * strictly for verified classmates in the caller's classIds. Never exposes emails,
   * full surnames, private reflections, or cross-class learners.
   */
  router.get('/classmates', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to view Classroom Co-Op planets.');
    }

    try {
      const db = getDb();
      const peerUids = resolveVerifiedClassmateUids(caller);
      if (peerUids.length === 0) {
        return res.status(200).json({ ok: true, privacyMode: 'first-name-initial', peers: [] });
      }

      const snaps = await Promise.all(
        peerUids.map((peerUid) => playgroundDocRef(db, caller.orgId, peerUid).get())
      );

      const peers = [];
      for (let i = 0; i < peerUids.length; i += 1) {
        const peerId = peerUids[i];
        const snap = snaps[i];
        if (!snap?.exists) continue;
        const raw = snap.data() || {};
        const clean = sanitizePlaygroundState(raw);
        if (!clean) continue;

        const stewardName = await resolvePeerStewardName(db, peerId, raw);
        const claimedId = clean.claimedPlanetId || 'thalassa';
        const planet = clean.planets[claimedId] || sanitizePlanetRecord(claimedId, {});

        peers.push({
          peerId,
          stewardName,
          claimedPlanetId: claimedId,
          week: clean.week,
          shipCount: Array.isArray(clean.savedShips) ? clean.savedShips.length : 0,
          unlockedFacilities: Array.isArray(raw.unlockedFacilities) ? raw.unlockedFacilities.slice(0, 10) : [],
          developmentStage: raw.developmentStage || 'initial_settlement',
          planet
        });
      }

      return res.status(200).json({
        ok: true,
        privacyMode: 'first-name-initial',
        peers
      });
    } catch (err) {
      console.error('[Universe Classmates GET Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not load Classroom Co-Op planets.');
    }
  });

  /**
   * GET /api/universe/playground/visit/:peerId
   * Classroom Co-Op Privacy Mode: read-only 3D visit snapshot of a verified classmate's planet.
   */
  router.get('/visit/:peerId', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to visit a classmate planet.');
    }

    const { peerId } = req.params;
    if (!isSafeId(peerId)) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Valid classmate ID required.');
    }

    const peerUids = resolveVerifiedClassmateUids(caller);
    if (!peerUids.includes(peerId)) {
      return sendUniverseError(
        req,
        res,
        403,
        'FORBIDDEN',
        'Classroom Co-Op Privacy Mode only allows visiting classmates in your verified class.'
      );
    }

    try {
      const db = getDb();
      const snap = await playgroundDocRef(db, caller.orgId, peerId).get();
      if (!snap.exists) {
        return sendUniverseError(req, res, 404, 'NOT_FOUND', 'This classmate has not established a planet outpost yet.');
      }

      const raw = snap.data() || {};
      const clean = sanitizePlaygroundState(raw) || initialPlaygroundState('thalassa');
      const stewardName = await resolvePeerStewardName(db, peerId, raw);
      const requestedPlanetId = typeof req.query?.planetId === 'string' && isSafeId(req.query.planetId)
        ? req.query.planetId
        : clean.claimedPlanetId;
      const planetId = clean.planets[requestedPlanetId] ? requestedPlanetId : clean.claimedPlanetId;
      const record = clean.planets[planetId] || sanitizePlanetRecord(planetId, {});

      return res.status(200).json({
        ok: true,
        privacyMode: 'first-name-initial',
        visit: {
          peerId,
          stewardName,
          claimedPlanetId: clean.claimedPlanetId,
          planetId,
          record,
          unlockedFacilities: Array.isArray(raw.unlockedFacilities) ? raw.unlockedFacilities.slice(0, 10) : [],
          developmentStage: raw.developmentStage || 'initial_settlement',
          savedShipsCount: Array.isArray(clean.savedShips) ? clean.savedShips.length : 0
        }
      });
    } catch (err) {
      console.error('[Universe Visit Peer GET Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not load classmate planet.');
    }
  });

  /**
   * POST /api/universe/playground/aid
   * Server-authoritative co-op aid for classmates hit by weekly Universe Creator hazards
   * or live Classroom Co-Op peer worlds.
   */
  router.post('/aid', async (req, res) => {
    const caller = req.universeCaller;
    if (!caller?.uid || !caller?.orgId) {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign in to send planetary aid.');
    }
    const targetPlanetId = req.body?.targetPlanetId;
    const targetPeerId = req.body?.targetPeerId;
    if (!isSafeId(targetPlanetId)) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Valid targetPlanetId is required.');
    }

    try {
      const db = getDb();
      const pgRef = playgroundDocRef(db, caller.orgId, caller.uid);
      const pgSnap = await pgRef.get();
      const existingData = pgSnap.exists ? pgSnap.data() : {};
      const current = pgSnap.exists
        ? (sanitizePlaygroundState(existingData) || initialPlaygroundState('thalassa'))
        : initialPlaygroundState('thalassa');

      // Live Classroom Co-Op peer aid path
      if (targetPeerId !== undefined && targetPeerId !== null) {
        if (!isSafeId(targetPeerId)) {
          return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Valid targetPeerId is required.');
        }
        const peerUids = resolveVerifiedClassmateUids(caller);
        if (!peerUids.includes(targetPeerId)) {
          return sendUniverseError(req, res, 403, 'FORBIDDEN', 'You can only send aid to classmates in your verified class.');
        }

        const aidKey = `${targetPeerId}:${targetPlanetId}`;
        if ((current.aidedThisWeek || []).includes(aidKey)) {
          return sendUniverseError(req, res, 409, 'AID_REJECTED', 'Cannot send aid: already-aided');
        }

        const peerRef = playgroundDocRef(db, caller.orgId, targetPeerId);
        const peerSnap = await peerRef.get();
        if (!peerSnap.exists) {
          return sendUniverseError(req, res, 404, 'NOT_FOUND', 'Classmate planet outpost not found.');
        }

        const peerRaw = peerSnap.data() || {};
        const peerClean = sanitizePlaygroundState(peerRaw) || initialPlaygroundState(targetPlanetId);
        const peerSteward = await resolvePeerStewardName(db, targetPeerId, peerRaw);
        const senderLabel = formatCoopStewardName(caller.displayName || existingData.stewardLabel || '', 'Classmate');
        const now = new Date().toISOString();

        const peerPlanet = peerClean.planets[targetPlanetId] || sanitizePlanetRecord(targetPlanetId, {});
        const updatedPeerPlanet = {
          ...peerPlanet,
          habitability: Math.min(100, (peerPlanet.habitability || 35) + 10),
          activeHazard: null
        };
        const nextPeer = preserveServerFields(peerRaw, {
          ...peerClean,
          planets: { ...peerClean.planets, [targetPlanetId]: updatedPeerPlanet },
          captainsLog: [
            {
              at: now,
              type: 'coop-aid-received',
              planetId: targetPlanetId,
              note: `Classmate ${senderLabel} sent an orbital relief pod (+10% Habitability).`
            },
            ...(peerClean.captainsLog || [])
          ].slice(0, MAX_LOG_ENTRIES)
        }, peerRaw.stewardLabel);
        await peerRef.set({ ...nextPeer, updatedAt: now });

        const creditDelta = 10;
        const nextCaller = preserveServerFields(existingData, {
          ...current,
          credits: current.credits + creditDelta,
          aidedThisWeek: [...(current.aidedThisWeek || []), aidKey].slice(0, 20),
          captainsLog: [
            {
              at: now,
              type: 'coop-aid',
              planetId: targetPlanetId,
              note: `Sent relief pod to ${peerSteward}’s ${targetPlanetId} (+10 Cr co-op bonus).`
            },
            ...(current.captainsLog || [])
          ].slice(0, MAX_LOG_ENTRIES)
        }, caller.displayName);
        await pgRef.set({ ...nextCaller, updatedAt: now });

        return res.status(200).json({
          ok: true,
          creditDelta,
          peerSteward,
          state: nextCaller
        });
      }

      const result = sendPlanetaryAid(current, targetPlanetId);
      if (!result.ok) {
        const status = result.reason === 'already-aided' ? 409 : 400;
        return sendUniverseError(req, res, status, 'AID_REJECTED', `Cannot send aid: ${result.reason}`);
      }

      const nextState = preserveServerFields(existingData, result.state, caller.displayName);
      await pgRef.set({ ...nextState, updatedAt: new Date().toISOString() });
      return res.status(200).json({ ok: true, creditDelta: result.creditDelta, state: nextState });
    } catch (err) {
      console.error('[Universe Aid POST Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not send planetary aid.');
    }
  });

  return router;
}
