/**
 * Server Authoritative Universe Mission Registry, Integrity Verification & Tuple Hashing
 * Conforms to MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md (0.1.1) and J02 requirements.
 *
 * IMPORTANT: Production entry graph must NEVER import shared/universe/fixtures/index.js.
 * Fixture bundles are injected only by explicit emulator/test entries when running
 * against verified localhost emulators on a nonproduction demo-* project.
 */

import { createHash } from 'node:crypto';
import {
  API_CONTRACT_VERSION,
  CAPABILITIES,
  PUBLISHED_RELEASES,
  canonicalStringify,
  getBundleHashInputs,
  resolveTask
} from '../../../shared/universe/index.js';

const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/;
const LOCALHOST_HOST = /^(127\.0\.0\.1|localhost)(:\d{2,5})?$/;

export function isSafeId(value) {
  return typeof value === 'string' && SAFE_ID.test(value);
}

export function isLocalhostEmulatorAddress(value) {
  return typeof value === 'string' && LOCALHOST_HOST.test(value.trim());
}

export function getActiveProjectId(env = process.env) {
  return env.GCLOUD_PROJECT || env.GOOGLE_CLOUD_PROJECT || '';
}

export function isNonProductionProject(projectId = getActiveProjectId()) {
  if (typeof projectId !== 'string') return false;
  const trimmed = projectId.trim();
  return trimmed.length > 5 && trimmed.startsWith('demo-');
}

/**
 * Determine if running in a verified local emulator environment (B3).
 * Requires BOTH local emulator hosts (FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST),
 * a nonempty nonproduction demo-* project ID, and no GOOGLE_APPLICATION_CREDENTIALS.
 * Missing context fails closed.
 */
export function isEmulatorEnvironment(env = process.env) {
  const firestoreHost = env.FIRESTORE_EMULATOR_HOST;
  const authHost = env.FIREBASE_AUTH_EMULATOR_HOST;
  const projectId = getActiveProjectId(env);

  if (!isLocalhostEmulatorAddress(firestoreHost)) {
    return false;
  }
  if (!isLocalhostEmulatorAddress(authHost)) {
    return false;
  }
  if (!isNonProductionProject(projectId)) {
    return false;
  }
  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    return false;
  }
  return true;
}

/**
 * Draft/fixture missions are accepted ONLY when running inside a verified local emulator
 * environment and ALLOW_DRAFT_MISSIONS === 'true'. Client flags never enable drafts.
 */
export function isDraftMissionsAllowed() {
  return (
    process.env.NODE_ENV !== 'production' &&
    isEmulatorEnvironment() &&
    process.env.ALLOW_DRAFT_MISSIONS === 'true'
  );
}

/**
 * Compute SHA-256 hex digest of a UTF-8 string.
 */
export function sha256Hex(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Collision-safe document ID from SHA-256 of a canonical JSON tuple (§9.6).
 */
export function hashCanonicalTuple(tuple) {
  if (!Array.isArray(tuple) || tuple.length === 0) {
    throw new TypeError('Canonical tuple must be a non-empty array.');
  }
  return sha256Hex(canonicalStringify(tuple));
}

/**
 * Open review slot ID: SHA-256 of canonical [orgId, learnerUid, missionId] (§9.6).
 */
export function getOpenSlotDocId(orgId, learnerUid, missionId) {
  return hashCanonicalTuple([orgId, learnerUid, missionId]);
}

/**
 * Idempotency record ID: SHA-256 of canonical [orgId, callerUid, operation, idempotencyKey] (§9.6).
 */
export function getIdempotencyDocId(orgId, callerUid, operation, idempotencyKey) {
  return hashCanonicalTuple([orgId, callerUid, operation, idempotencyKey]);
}

/**
 * Draft document ID: SHA-256 of canonical [orgId, learnerUid, releaseId, missionId, missionVersion, routeId, taskId, policyVersion] (§9.6).
 */
export function getDraftDocId(orgId, learnerUid, identity) {
  return hashCanonicalTuple([
    orgId,
    learnerUid,
    identity.releaseId,
    identity.missionId,
    identity.missionVersion,
    identity.routeId,
    identity.taskId,
    identity.policyVersion
  ]);
}

/**
 * Endpoint-bound idempotency payload hash (§9.5).
 * Covers contractVersion, orgId, callerUid, HTTP method, endpoint path, and request body
 * preserving raw learner input.
 */
export function computeIdempotencyRequestHash({ contractVersion = API_CONTRACT_VERSION, orgId, callerUid, method, path, body }) {
  return sha256Hex(
    canonicalStringify({
      contractVersion,
      orgId,
      callerUid,
      method: String(method || '').toUpperCase(),
      path: String(path || ''),
      body
    })
  );
}

/**
 * Verify all dataset, mission, and bundle SHA-256 digests and capability bounds at load/startup.
 */
export function verifyBundleIntegrity(bundle) {
  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) {
    throw new Error('Invalid mission bundle: expected object.');
  }
  if (bundle.schemaVersion !== '1.0.0') {
    throw new Error(`Unsupported bundle schemaVersion "${bundle.schemaVersion}".`);
  }
  const compat = bundle.compatibility;
  if (!compat || compat.apiContractVersion !== API_CONTRACT_VERSION || compat.contractRevision !== '0.1.1') {
    throw new Error(`Incompatible bundle contract metadata for release "${bundle.releaseId}".`);
  }
  if (compat.artifactReferenceEnabled !== false) {
    throw new Error(`Bundle "${bundle.releaseId}" enables disabled artifact-reference capability.`);
  }
  if (
    !Array.isArray(compat.sceneKinds) ||
    !compat.sceneKinds.every(k => CAPABILITIES.sceneKinds.includes(k)) ||
    !Array.isArray(compat.workstationKinds) ||
    !compat.workstationKinds.every(k => CAPABILITIES.workstationKinds.includes(k)) ||
    !Array.isArray(compat.artifactPartKinds) ||
    !compat.artifactPartKinds.every(k => CAPABILITIES.artifactPartKinds.includes(k))
  ) {
    throw new Error(`Bundle "${bundle.releaseId}" requests unsupported workstation/scene/artifact capabilities.`);
  }

  const hashInputs = getBundleHashInputs(bundle);
  if (!Array.isArray(hashInputs) || hashInputs.length === 0) {
    throw new Error(`Bundle "${bundle.releaseId}" produced no hash inputs.`);
  }
  for (const item of hashInputs) {
    const actual = sha256Hex(item.canonical);
    if (actual !== item.expected) {
      throw new Error(
        `Integrity check failed for ${item.kind} "${item.id}" in release "${bundle.releaseId}": expected ${item.expected}, got ${actual}.`
      );
    }
  }
  return true;
}

/**
 * Build and verify the server mission registry at startup.
 * In production (or outside verified emulator environment), only PUBLISHED_RELEASES are loaded
 * and any draft/non-production bundle is excluded.
 */
export function createUniverseRegistry(injectedReleases = null) {
  const candidates =
    Array.isArray(injectedReleases) && isEmulatorEnvironment() && process.env.NODE_ENV !== 'production'
      ? injectedReleases
      : PUBLISHED_RELEASES;

  const verified = [];
  const seenReleaseIds = new Set();

  for (const bundle of candidates) {
    verifyBundleIntegrity(bundle);
    if (seenReleaseIds.has(bundle.releaseId)) {
      throw new Error(`Duplicate releaseId "${bundle.releaseId}" in universe registry.`);
    }
    if (!isEmulatorEnvironment() || process.env.NODE_ENV === 'production') {
      if (bundle.status !== 'published' || bundle.policy?.productionSubmissionsAllowed !== true) {
        continue;
      }
    }
    seenReleaseIds.add(bundle.releaseId);
    verified.push(bundle);
  }

  return Object.freeze(verified);
}

/**
 * Resolve full 6-part task identity from query parameters (filling taskId and policyVersion
 * from the uniquely matched route/bundle when omitted on GET query endpoints, and verifying
 * via shared resolveTask).
 */
export function resolveTaskFromQuery(registry, missionId, query = {}) {
  const { releaseId, missionVersion, routeId, taskId, policyVersion } = query || {};
  if (!isSafeId(missionId)) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Supply a valid missionId.', field: 'missionId' } };
  }
  if (!isSafeId(releaseId)) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Supply a valid releaseId query parameter.', field: 'releaseId' } };
  }
  if (!isSafeId(missionVersion)) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Supply a valid missionVersion query parameter.', field: 'missionVersion' } };
  }
  if (!isSafeId(routeId)) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Supply a valid routeId query parameter.', field: 'routeId' } };
  }
  if (taskId !== undefined && !isSafeId(taskId)) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Supply a valid taskId query parameter.', field: 'taskId' } };
  }
  if (policyVersion !== undefined && !isSafeId(policyVersion)) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Supply a valid policyVersion query parameter.', field: 'policyVersion' } };
  }

  const activeRegistry = Array.isArray(registry) ? registry : [];
  const bundle = activeRegistry.find(b => b.releaseId === releaseId);
  if (!bundle) {
    return {
      ok: false,
      error: { code: 'CONTENT_VERSION_UNAVAILABLE', message: 'This mission release is unavailable.', field: 'releaseId' }
    };
  }
  const mission = bundle.missions?.find(m => m.id === missionId && m.version === missionVersion);
  if (!mission) {
    return {
      ok: false,
      error: { code: 'CONTENT_VERSION_UNAVAILABLE', message: 'This mission version is unavailable.', field: 'missionVersion' }
    };
  }
  const route = mission.routes?.find(r => r.id === routeId);
  if (!route) {
    return {
      ok: false,
      error: { code: 'NOT_FOUND', message: 'This task route is unavailable.', field: 'routeId' }
    };
  }

  const effectiveIdentity = {
    releaseId,
    missionId,
    missionVersion,
    routeId,
    taskId: taskId !== undefined ? taskId : route.taskId,
    policyVersion: policyVersion !== undefined ? policyVersion : bundle.policy?.version
  };

  return resolveTask(activeRegistry, effectiveIdentity);
}

/**
 * Firestore document ID for server-controlled runtime task availability overrides
 * (e.g., pausing/withdrawing or retiring a specific task version).
 */
export function getTaskStatusOverrideDocId(identity) {
  return hashCanonicalTuple([
    'task-status',
    identity.releaseId,
    identity.missionId,
    identity.missionVersion,
    identity.routeId,
    identity.taskId,
    identity.policyVersion
  ]);
}

/**
 * Evaluate authoritative current task availability (§4, §5, §6).
 * Never infers "open" from a client flag or stale bundle label.
 */
export function evaluateTaskAvailability(resolvedTask, { overrideData = null, nowIso = new Date().toISOString() } = {}) {
  if (!resolvedTask) {
    return {
      status: 'unknown',
      canStart: false,
      canResume: false,
      canSubmit: false,
      reasonCode: 'CONTENT_VERSION_UNAVAILABLE',
      reason: 'This mission version is not available on this server.',
      availabilityRevision: 1,
      checkedAt: nowIso
    };
  }

  const { bundle, mission, policy, identity } = resolvedTask;
  const availabilityRevision =
    Number.isSafeInteger(overrideData?.availabilityRevision) && overrideData.availabilityRevision >= 1
      ? overrideData.availabilityRevision
      : 1;

  const effectiveStage = overrideData?.status || mission.status || bundle.status || 'unknown';

  if (effectiveStage === 'withdrawn') {
    return {
      ...identity,
      status: 'withdrawn',
      canStart: false,
      canResume: false,
      canSubmit: false,
      reasonCode: 'MISSION_WITHDRAWN',
      reason: overrideData?.reason || 'This investigation is paused for a correction. Your saved work is kept.',
      availabilityRevision,
      checkedAt: nowIso
    };
  }

  if (effectiveStage === 'retired') {
    return {
      ...identity,
      status: 'retired',
      canStart: false,
      canResume: false,
      canSubmit: false,
      reasonCode: 'MISSION_RETIRED',
      reason: overrideData?.reason || 'This mission version has been retired. Your past records are preserved.',
      availabilityRevision,
      checkedAt: nowIso
    };
  }

  const isDraft =
    bundle.status === 'draft' ||
    mission.status === 'draft' ||
    effectiveStage === 'draft' ||
    effectiveStage === 'in-review' ||
    policy?.productionSubmissionsAllowed === false;

  if (isDraft) {
    if (isDraftMissionsAllowed()) {
      return {
        ...identity,
        status: 'in-review',
        canStart: true,
        canResume: true,
        canSubmit: true,
        reasonCode: null,
        reason: 'Draft fixture active in isolated emulator environment.',
        availabilityRevision,
        checkedAt: nowIso
      };
    }
    return {
      ...identity,
      status: 'in-review',
      canStart: false,
      canResume: false,
      canSubmit: false,
      reasonCode: 'MISSION_NOT_OPEN',
      reason: 'This mission is an unpublished draft and cannot accept submissions in production.',
      availabilityRevision,
      checkedAt: nowIso
    };
  }

  if (bundle.status === 'published' && mission.status === 'published' && policy?.productionSubmissionsAllowed === true) {
    return {
      ...identity,
      status: 'open',
      canStart: true,
      canResume: true,
      canSubmit: true,
      reasonCode: null,
      reason: null,
      availabilityRevision,
      checkedAt: nowIso
    };
  }

  return {
    ...identity,
    status: 'unknown',
    canStart: false,
    canResume: false,
    canSubmit: false,
    reasonCode: 'MISSION_NOT_OPEN',
    reason: 'This mission is not currently open.',
    availabilityRevision,
    checkedAt: nowIso
  };
}

/**
 * Server-side Planet Access Policy Map (Contract 0.1.1 §1, §5, §9.7).
 * Thalassa & Ignis are public; Boreas remains locked under pending policy (`boreas-policy-unresolved`).
 * Unlisted destinations fail closed (`unknown-destination`).
 */
export const PLANET_UNLOCKS = Object.freeze({
  thalassa: Object.freeze({
    type: 'public',
    status: 'available',
    evaluatedRule: 'public',
    isVerified: true,
    requirementKey: null,
    requirementText: null
  }),
  ignis: Object.freeze({
    type: 'public',
    status: 'available',
    evaluatedRule: 'public',
    isVerified: true,
    requirementKey: null,
    requirementText: null
  }),
  boreas: Object.freeze({
    type: 'policy-pending',
    status: 'locked',
    evaluatedRule: 'boreas-policy-unresolved',
    isVerified: false,
    requirementKey: 'universe.boreas.policyPending',
    requirementText: 'This expedition is not open yet.'
  })
});

export function getPlanetUnlock(planetId) {
  if (typeof planetId === 'string' && Object.prototype.hasOwnProperty.call(PLANET_UNLOCKS, planetId)) {
    return PLANET_UNLOCKS[planetId];
  }
  return {
    type: 'locked',
    status: 'locked',
    evaluatedRule: 'unknown-destination',
    isVerified: false,
    requirementKey: 'universe.destination.unknown',
    requirementText: 'This destination is not charted.'
  };
}

export function buildReviewedOnlyOutcome() {
  return {
    type: 'reviewed-only',
    grantIds: [],
    messageKey: 'universe.mission.reviewed',
    nextMissionIds: []
  };
}
