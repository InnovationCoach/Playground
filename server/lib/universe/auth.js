/**
 * Authoritative Universe Authentication & Organization/Role/Class Resolution
 * Conforms to MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md (§5, §9.3, §9.6),
 * closes MY-UNIVERSE-G04-RULES-AUDIT-2026-11-02.json Finding 1, and
 * resolves MY-UNIVERSE-G04-TECHNICAL-REVIEW-2026-11-02.md Findings B1 & B2.
 *
 * Security Invariants:
 * 1. Never falls back to 'org-welearn'.
 * 2. Never trusts client-writable users/{uid} profile fields (orgId, role, classIds)
 *    as an authority grant, closing forged create and delete/recreate attacks.
 * 3. Never trusts decoded JWT claims alone without re-reading current server-controlled
 *    authority (live Firebase Auth customClaims via getAuth().getUser(uid) and/or
 *    server-only universeMemberships/{uid}), so claim/membership changes or revocations
 *    immediately affect old-token requests and idempotent replays (B1).
 * 4. Fails closed on missing, deleted, malformed, wrong-organization, or roster-revoked
 *    classes/{classId} documents (B2).
 * 5. Never falls back to an email address for learnerDisplayName.
 */

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '../../auth.js';
import { isSafeId } from './missions.js';
import { sendUniverseError, setUniverseHeaders } from './http.js';

const VALID_ROLES = ['student', 'learner', 'teacher', 'coach', 'admin', 'supervisor'];
const LEARNER_ROLES = ['student', 'learner'];
const TEACHER_ROLES = ['teacher', 'coach'];
const STAFF_ROLES = ['teacher', 'coach', 'admin', 'supervisor'];
const CLASS_SCOPED_ROLES = ['student', 'learner', 'teacher', 'coach'];

function rolesCompatible(roleA, roleB) {
  if (roleA === roleB) return true;
  if (LEARNER_ROLES.includes(roleA) && LEARNER_ROLES.includes(roleB)) return true;
  return false;
}

function sanitizeDisplayName(candidates, fallback = 'Learner') {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.length >= 1 && !trimmed.includes('@')) {
        return trimmed.slice(0, 120);
      }
    }
  }
  return fallback;
}

export async function requireUniverseAuth(req, res, next) {
  setUniverseHeaders(req, res);

  const adminReady = initAdmin();
  if (!adminReady) {
    return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Server authentication is not configured.');
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) {
    return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Sign-in required.');
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(token, true);
  } catch (err) {
    if (err?.code === 'auth/id-token-revoked' || err?.code === 'auth/user-disabled') {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Your session has been revoked.');
    }
    return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Your session has expired. Please sign in again.');
  }

  if (decoded.firebase?.sign_in_provider === 'anonymous') {
    return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Anonymous sessions cannot access authenticated Universe services.');
  }

  const db = getFirestore();
  let authUser;
  let userSnap;
  let membershipSnap;
  try {
    [authUser, userSnap, membershipSnap] = await Promise.all([
      getAuth().getUser(decoded.uid),
      db.collection('users').doc(decoded.uid).get(),
      db.collection('universeMemberships').doc(decoded.uid).get()
    ]);
  } catch (err) {
    if (err?.code === 'auth/user-not-found' || err?.code === 'auth/user-disabled') {
      return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Your account is no longer active.');
    }
    console.error('[Universe Auth Authority Lookup Error]:', err);
    return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not verify account context.');
  }

  const liveClaims = authUser?.customClaims || {};
  const userData = userSnap.exists ? userSnap.data() || {} : null;
  const membershipData = membershipSnap.exists ? membershipSnap.data() || {} : null;

  if (decoded.disabled || authUser?.disabled || userData?.status === 'suspended' || membershipData?.status === 'suspended') {
    return sendUniverseError(req, res, 401, 'UNAUTHENTICATED', 'Your account has been suspended.');
  }

  if (
    membershipData?.revoked === true ||
    (membershipData?.status !== undefined && membershipData.status !== 'active') ||
    liveClaims?.revoked === true ||
    (liveClaims?.status !== undefined && liveClaims.status !== 'active')
  ) {
    return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Universe membership authority has been revoked.');
  }

  // 1. Resolve current server-controlled Role & Organization (B1).
  //    Never trust decoded JWT claims alone or client-writable users/{uid} fields as a grant.
  const liveRole = typeof liveClaims.role === 'string' && VALID_ROLES.includes(liveClaims.role) ? liveClaims.role : null;
  const liveOrgId = typeof liveClaims.orgId === 'string' && isSafeId(liveClaims.orgId) ? liveClaims.orgId : null;

  let authoritativeRole = null;
  let authoritativeOrgId = null;

  if (membershipSnap.exists) {
    const memberRole = typeof membershipData.role === 'string' && VALID_ROLES.includes(membershipData.role) ? membershipData.role : null;
    const memberOrgId = typeof membershipData.orgId === 'string' && isSafeId(membershipData.orgId) ? membershipData.orgId : null;

    if (!memberRole) {
      return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Current membership record is missing a valid role.');
    }
    if (!memberOrgId) {
      return sendUniverseError(req, res, 403, 'ORG_CONTEXT_REQUIRED', 'Current membership record is missing a valid organization.');
    }
    if (liveClaims.role !== undefined && (!liveRole || !rolesCompatible(memberRole, liveRole))) {
      return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Current Auth claims conflict with membership role authority.');
    }
    if (liveClaims.orgId !== undefined && (!liveOrgId || liveOrgId !== memberOrgId)) {
      return sendUniverseError(req, res, 403, 'ORG_CONTEXT_REQUIRED', 'Current Auth claims conflict with membership organization authority.');
    }

    authoritativeRole = memberRole;
    authoritativeOrgId = memberOrgId;
  } else {
    if (!liveRole) {
      return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Verified current server role authority is required.');
    }
    if (!liveOrgId) {
      return sendUniverseError(
        req,
        res,
        403,
        'ORG_CONTEXT_REQUIRED',
        'Explicit server-verified organization context is required. Profile-only or unbacked token organization is not authoritative.'
      );
    }

    authoritativeRole = liveRole;
    authoritativeOrgId = liveOrgId;
  }

  // Reject stale/conflicting presented JWT token claims (B1: old token after claim/membership change).
  if (decoded.role !== undefined && (typeof decoded.role !== 'string' || !rolesCompatible(decoded.role, authoritativeRole))) {
    return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Token role is stale or conflicts with current server authority.');
  }
  if (decoded.orgId !== undefined && (typeof decoded.orgId !== 'string' || decoded.orgId !== authoritativeOrgId)) {
    return sendUniverseError(req, res, 403, 'ORG_CONTEXT_REQUIRED', 'Token organization is stale or conflicts with current server authority.');
  }

  // Reject if client-writable profile attempts to claim a conflicting role or organization.
  if (userData?.role !== undefined && userData?.role !== null) {
    if (typeof userData.role !== 'string' || !rolesCompatible(authoritativeRole, userData.role)) {
      return sendUniverseError(req, res, 403, 'FORBIDDEN', 'User profile role conflicts with verified role authority.');
    }
  }
  if (userData?.orgId !== undefined && userData?.orgId !== null && userData.orgId !== authoritativeOrgId) {
    return sendUniverseError(
      req,
      res,
      403,
      'ORG_CONTEXT_REQUIRED',
      'User profile organization conflicts with verified organization authority.'
    );
  }

  // 2. Resolve candidate classIds strictly from current server-controlled sources (B1).
  let candidateClassIds = [];
  if (membershipSnap.exists) {
    if (!Array.isArray(membershipData.classIds)) {
      candidateClassIds = [];
    } else {
      candidateClassIds = membershipData.classIds.filter(isSafeId);
    }
    if (liveClaims.classIds !== undefined) {
      if (!Array.isArray(liveClaims.classIds)) {
        return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Malformed classIds in current Auth claims.');
      }
      const liveSet = new Set(liveClaims.classIds.filter(isSafeId));
      candidateClassIds = candidateClassIds.filter(cid => liveSet.has(cid));
    }
  } else {
    if (liveClaims.classIds !== undefined && !Array.isArray(liveClaims.classIds)) {
      return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Malformed classIds in current Auth claims.');
    }
    candidateClassIds = Array.isArray(liveClaims.classIds) ? liveClaims.classIds.filter(isSafeId) : [];
  }

  // If the presented token carried classIds, intersect so an old token cannot exercise classes it wasn't issued for,
  // and any class removed from current live authority is dropped.
  if (decoded.classIds !== undefined) {
    if (!Array.isArray(decoded.classIds)) {
      return sendUniverseError(req, res, 403, 'FORBIDDEN', 'Malformed classIds in token.');
    }
    const tokenClassSet = new Set(decoded.classIds.filter(isSafeId));
    candidateClassIds = candidateClassIds.filter(cid => tokenClassSet.has(cid));
  }

  candidateClassIds = Array.from(new Set(candidateClassIds));

  // If users/{uid} exists and carries classIds, intersect so revocations on users/{uid}
  // take effect immediately, while forged extra classes in users/{uid} are never added.
  if (userData && userData.classIds !== undefined) {
    if (!Array.isArray(userData.classIds)) {
      candidateClassIds = [];
    } else {
      const profileClassSet = new Set(userData.classIds.filter(isSafeId));
      candidateClassIds = candidateClassIds.filter(cid => profileClassSet.has(cid));
    }
  }

  // 3. Strictly verify every candidate class against classes/{classId} in Firestore (B2).
  //    Missing, deleted, malformed, or wrong-org class documents fail closed.
  const verifiedClassIds = [];
  const classDocsById = new Map();

  if (candidateClassIds.length > 0) {
    let classSnaps;
    try {
      classSnaps = await Promise.all(
        candidateClassIds.map(cid => db.collection('classes').doc(cid).get())
      );
    } catch (err) {
      console.error('[Universe Auth Class Lookup Error]:', err);
      return sendUniverseError(req, res, 503, 'SERVICE_UNAVAILABLE', 'Could not verify class authority.');
    }

    for (let i = 0; i < candidateClassIds.length; i++) {
      const cid = candidateClassIds[i];
      const snap = classSnaps[i];

      // Fail closed if class document does not exist (B2)
      if (!snap.exists) {
        return sendUniverseError(req, res, 403, 'FORBIDDEN', `Class authority "${cid}" does not exist or has been removed.`);
      }

      const cData = snap.data();
      if (!cData || typeof cData !== 'object') {
        return sendUniverseError(req, res, 403, 'FORBIDDEN', `Class authority "${cid}" is malformed.`);
      }

      // Mandatory organization field & match check (B2)
      if (typeof cData.orgId !== 'string' || !isSafeId(cData.orgId) || cData.orgId !== authoritativeOrgId) {
        return sendUniverseError(req, res, 403, 'FORBIDDEN', `Class "${cid}" does not belong to your verified organization.`);
      }

      // Mandatory roster array structure checks (B2)
      if (!Array.isArray(cData.coachIds) || !Array.isArray(cData.learnerIds)) {
        return sendUniverseError(req, res, 403, 'FORBIDDEN', `Class "${cid}" is missing required roster authority fields.`);
      }

      if (cData.revoked === true || (cData.status !== undefined && cData.status !== 'active')) {
        continue;
      }

      if (TEACHER_ROLES.includes(authoritativeRole) && !cData.coachIds.includes(decoded.uid)) {
        continue;
      }

      if (LEARNER_ROLES.includes(authoritativeRole) && !cData.learnerIds.includes(decoded.uid)) {
        continue;
      }

      verifiedClassIds.push(cid);
      classDocsById.set(cid, cData);
    }
  }

  // Learner roles (student, learner) require at least one active verified class (B1/B2).
  if (LEARNER_ROLES.includes(authoritativeRole) && verifiedClassIds.length === 0) {
    return sendUniverseError(
      req,
      res,
      403,
      'FORBIDDEN',
      'Active verified class membership in your organization is required.'
    );
  }

  const defaultDisplayFallback = STAFF_ROLES.includes(authoritativeRole) ? 'Coach' : 'Learner';
  const displayName = sanitizeDisplayName(
    [membershipData?.displayName, userData?.displayName, authUser?.displayName, decoded.name],
    defaultDisplayFallback
  );

  req.universeCaller = {
    uid: decoded.uid,
    role: authoritativeRole,
    orgId: authoritativeOrgId,
    classIds: verifiedClassIds,
    classDocsById,
    displayName,
    publicId: userData?.publicId || null
  };

  return next();
}
