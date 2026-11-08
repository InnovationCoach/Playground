/**
 * Trusted Layout-Selection Contract & Provenance Verification
 *
 * Determines whether an authenticated account qualifies for the Lower-Secondary
 * learner experience ('lower-secondary', ages 11–14 inclusive) or retains the
 * existing layout ('existing').
 *
 * Security & Provenance Invariants:
 * 1. Client-editable fields on `users/{uid}` (dateOfBirth, cohortId, cohort,
 *    ageBand, yearLevel, layoutOverride) are NEVER trusted on their own.
 * 2. Automatic selection of 'lower-secondary' requires a staff/server-verified
 *    source:
 *    - Staff-verified `dateOfBirth` (recorded in `userLayoutAuthority/{uid}` or
 *      server-authored `auditLogs` where `source === 'server'`) yielding integer
 *      age 11..14.
 *    - Staff-verified `cohortId` (from `userLayoutAuthority/{uid}`, server
 *      `auditLogs`, or staff-assigned classes in `signedClaims.classIds` ∩
 *      `users/{uid}.classIds`) whose `cohorts/{cohortId}` record defines an
 *      active age range entirely within 11..14 (`minAge >= 11 && maxAge <= 14`).
 * 3. Self-enrolment (`isSelfEnrolment()` via class join codes or program codes)
 *    updates `users/{uid}.classIds` without updating `signedClaims.classIds` and
 *    cannot establish a staff-verified class cohort.
 * 4. Authorized staff override (`layoutOverride`: 'lower-secondary' | 'existing' | null)
 *    is stored in `userLayoutAuthority/{uid}` (Admin SDK only; denied to clients
 *    in `firestore.rules`). Precedence prevents `layoutOverride: 'lower-secondary'`
 *    from opting non-students or under-11 / unverified-age primary students into
 *    the lower-secondary rollout.
 */

export const LAYOUT_CONTRACT_VERSION = 1;
export const ALLOWED_LAYOUT_OVERRIDES = ['lower-secondary', 'existing'];
const VALID_OVERRIDE_INPUTS = new Set(['lower-secondary', 'lowerSecondary', 'existing']);

export function normalizeOverrideInput(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value === 'lower-secondary' || value === 'lowerSecondary') return 'lower-secondary';
  if (value === 'existing') return 'existing';
  return '__invalid__';
}

function toContractOverride(normalizedOverride) {
  if (normalizedOverride === 'lower-secondary') return 'lowerSecondary';
  if (normalizedOverride === 'existing') return 'existing';
  return undefined;
}
export const LAYOUT_SELECTION_REASONS = [
  'eligible',
  'older',
  'outside-rollout',
  'missing',
  'invalid',
  'ambiguous',
  'staff-override'
];

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_PLAUSIBLE_LEARNER_AGE = 4;
const MAX_PLAUSIBLE_LEARNER_AGE = 25;
const LOWER_SECONDARY_MIN_AGE = 11;
const LOWER_SECONDARY_MAX_AGE = 14;

/**
 * Formats a Date into YYYY-MM-DD in Asia/Bangkok (or UTC fallback).
 */
export function getReferenceDateIso(referenceDate = null) {
  if (typeof referenceDate === 'string' && ISO_DATE_REGEX.test(referenceDate.trim())) {
    return referenceDate.trim();
  }
  const dateObj = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
    ? referenceDate
    : new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(dateObj);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // Fallback to UTC ISO slice
  }
  return dateObj.toISOString().slice(0, 10);
}

/**
 * Parses and validates an ISO YYYY-MM-DD dateOfBirth string and computes integer
 * completed years as of `referenceDate`.
 *
 * Returns:
 * - { status: 'missing', age: null, dob: null }
 * - { status: 'invalid', age: null, dob: null }
 * - { status: 'valid', age: number, dob: string }
 */
export function parseVerifiedDob(dob, referenceDate = null) {
  if (dob === null || dob === undefined || dob === '') {
    return { status: 'missing', age: null, dob: null };
  }
  if (typeof dob !== 'string') {
    return { status: 'invalid', age: null, dob: null };
  }
  const trimmed = dob.trim();
  const match = ISO_DATE_REGEX.exec(trimmed);
  if (!match) {
    return { status: 'invalid', age: null, dob: null };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return { status: 'invalid', age: null, dob: null };
  }

  const refIso = getReferenceDateIso(referenceDate);
  const refMatch = ISO_DATE_REGEX.exec(refIso);
  if (!refMatch) {
    return { status: 'invalid', age: null, dob: null };
  }

  const refYear = Number(refMatch[1]);
  const refMonth = Number(refMatch[2]);
  const refDay = Number(refMatch[3]);

  let age = refYear - year;
  if (refMonth < month || (refMonth === month && refDay < day)) {
    age -= 1;
  }

  if (!Number.isInteger(age) || age < MIN_PLAUSIBLE_LEARNER_AGE || age > MAX_PLAUSIBLE_LEARNER_AGE) {
    return { status: 'invalid', age: null, dob: null };
  }

  return { status: 'valid', age, dob: trimmed };
}

/**
 * Evaluates a `cohorts/{cohortId}` document's numeric age bounds.
 * Cohort bounds use inclusive `minAge` and exclusive `maxAgeExclusive`.
 *
 * Returns:
 * - { status: 'missing' | 'ambiguous' | 'valid', classification: 'eligible' | 'older' | 'outside-rollout' | 'ambiguous' | 'missing', range: { min, max, cohortId } | null }
 */
export function evaluateCohortRange(cohortDoc, cohortId = null) {
  if (!cohortDoc || typeof cohortDoc !== 'object') {
    return { status: 'missing', classification: 'missing', range: null };
  }
  if (cohortDoc.status === 'inactive') {
    return { status: 'ambiguous', classification: 'ambiguous', range: null };
  }

  const minAge = cohortDoc.minAge;
  const maxAgeExclusive = cohortDoc.maxAgeExclusive;
  if (
    !Number.isInteger(minAge) ||
    !Number.isInteger(maxAgeExclusive) ||
    minAge < 0 ||
    maxAgeExclusive <= minAge
  ) {
    return { status: 'ambiguous', classification: 'ambiguous', range: null };
  }

  const min = minAge;
  const max = maxAgeExclusive - 1;
  const resolvedId = cohortId || cohortDoc.cohortId || cohortDoc.id || null;
  const range = { min, max, cohortId: resolvedId };

  if (min >= LOWER_SECONDARY_MIN_AGE && max <= LOWER_SECONDARY_MAX_AGE) {
    return { status: 'valid', classification: 'eligible', range };
  }
  if (min > LOWER_SECONDARY_MAX_AGE) {
    return { status: 'valid', classification: 'older', range };
  }
  if (max < LOWER_SECONDARY_MIN_AGE) {
    return { status: 'valid', classification: 'outside-rollout', range };
  }

  // Crosses a rollout boundary (e.g. 6..11 or 13..15 or 11..18)
  return { status: 'ambiguous', classification: 'ambiguous', range };
}

/**
 * Pure deterministic layout selector operating on verified contract signals.
 *
 * Precedence order:
 * 1. Role gate: Only 'student' and 'learner' qualify. All other roles resolve to
 *    `layout: 'existing', reason: 'outside-rollout'`.
 * 2. Override validation: Invalid `staffOverride` values resolve to
 *    `layout: 'existing', reason: 'invalid'`.
 * 3. Under-11 safeguard: If verified DOB is < 11, or verified cohort range is
 *    entirely < 11 (without a verified DOB >= 11), or the profile is classified
 *    as 'primary' without a verified DOB proving age 11..14, `staffOverride: 'lower-secondary'`
 *    is blocked and resolves to `layout: 'existing', reason: 'outside-rollout', overrideBlocked: true`.
 * 4. Authorized staff override: `'lower-secondary'` or `'existing'` selects that
 *    layout with `reason: 'staff-override', source: 'staff_override'`.
 * 5. Verified DOB:
 *    - invalid -> `existing` (`reason: 'invalid'`)
 *    - 11..14 -> `lower-secondary` (`reason: 'eligible', source: 'verified_dob'`)
 *    - >= 15 -> `existing` (`reason: 'older', source: 'verified_dob'`)
 *    - < 11 -> `existing` (`reason: 'outside-rollout', source: 'verified_dob'`)
 * 6. Verified Cohort Range (entirely within a single rollout bucket):
 *    - 11..14 -> `lower-secondary` (`reason: 'eligible'`)
 *    - >= 15 -> `existing` (`reason: 'older'`)
 *    - < 11 -> `existing` (`reason: 'outside-rollout'`)
 * 7. Ambiguous / unverified signals (e.g. '13-15' band, boundary-crossing cohort,
 *    conflicting class cohorts, or unverified self-editable fields) ->
 *    `existing` (`reason: 'ambiguous'`).
 * 8. Missing data -> `existing` (`reason: 'missing'`).
 *
 * Also populates `verified: true`, `age`, `ageRange`, and `override` (`'lowerSecondary' | 'existing'`)
 * so the returned object can be passed directly as `contract` to `selectLayout({ role, contract })`
 * in `src/features/lowerSecondary/layoutSelector.js`.
 */
export function evaluateLayoutSelection(input = {}) {
  if (!input || typeof input !== 'object') {
    return {
      contractVersion: LAYOUT_CONTRACT_VERSION,
      layout: 'existing',
      reason: 'invalid',
      verified: true,
      evidenceVerified: false,
      age: null,
      source: 'none',
      role: null,
      isPrimary: false,
      trustedAge: null,
      trustedAgeStatus: 'invalid',
      trustedAgeRange: null,
      trustedCohortStatus: 'missing',
      staffOverride: null,
      overrideBlocked: false
    };
  }

  const role = typeof input.role === 'string' && input.role.trim() ? input.role.trim() : null;
  const isStudentRole = role === 'student' || role === 'learner';
  const isPrimary = Boolean(input.isPrimary);
  const rawOverrideInput = input.staffOverride ?? input.override ?? null;
  const normalizedOverride = normalizeOverrideInput(rawOverrideInput);
  const cohortSource = input.cohortSource === 'verified_class_cohort'
    ? 'verified_class_cohort'
    : 'verified_cohort';

  if (!isStudentRole) {
    return {
      contractVersion: LAYOUT_CONTRACT_VERSION,
      layout: 'existing',
      reason: 'outside-rollout',
      verified: false,
      evidenceVerified: false,
      source: 'none',
      role,
      isPrimary: false,
      trustedAge: null,
      trustedAgeStatus: 'missing',
      trustedAgeRange: null,
      trustedCohortStatus: 'missing',
      staffOverride: normalizedOverride === '__invalid__' ? null : normalizedOverride,
      overrideBlocked: normalizedOverride === 'lower-secondary'
    };
  }

  let trustedAgeStatus = input.trustedAgeStatus || 'missing';
  let trustedAge = input.trustedAge ?? null;
  if (trustedAgeStatus === 'valid') {
    if (!Number.isInteger(trustedAge) || trustedAge < MIN_PLAUSIBLE_LEARNER_AGE || trustedAge > MAX_PLAUSIBLE_LEARNER_AGE) {
      trustedAgeStatus = 'invalid';
      trustedAge = null;
    }
  } else {
    trustedAge = null;
  }

  let trustedCohortStatus = input.trustedCohortStatus || 'missing';
  let trustedAgeRange = null;
  let rangeClassification = null;

  if (input.trustedAgeRange && typeof input.trustedAgeRange === 'object') {
    const { min, max, cohortId = null } = input.trustedAgeRange;
    if (Number.isInteger(min) && Number.isInteger(max) && min >= 0 && max >= min) {
      trustedAgeRange = { min, max, cohortId };
      if (min >= LOWER_SECONDARY_MIN_AGE && max <= LOWER_SECONDARY_MAX_AGE) {
        rangeClassification = 'eligible';
      } else if (min > LOWER_SECONDARY_MAX_AGE) {
        rangeClassification = 'older';
      } else if (max < LOWER_SECONDARY_MIN_AGE) {
        rangeClassification = 'outside-rollout';
      } else {
        rangeClassification = 'ambiguous';
        if (trustedCohortStatus === 'valid') trustedCohortStatus = 'ambiguous';
      }
    } else {
      trustedCohortStatus = 'invalid';
    }
  } else if (trustedCohortStatus === 'valid') {
    trustedCohortStatus = 'missing';
  }

  const isAmbiguousSignal =
    trustedCohortStatus === 'ambiguous' ||
    trustedCohortStatus === 'unverified' ||
    trustedAgeStatus === 'unverified' ||
    Boolean(input.hasUnverifiedAgeSignal);

  // Build frontend selector-compatible `age` and `ageRange` fields
  const buildSelectorEvidence = () => {
    const fields = {};
    if (trustedAgeStatus === 'invalid' || trustedCohortStatus === 'invalid') {
      fields.age = null;
      return fields;
    }
    if (trustedAgeStatus === 'valid') {
      fields.age = trustedAge;
      return fields;
    }
    if (trustedAgeRange) {
      fields.ageRange = { min: trustedAgeRange.min, max: trustedAgeRange.max };
      return fields;
    }
    if (isPrimary) {
      // Unverified-age primary learner spans 6..11 (crosses 11 -> ambiguous & blocks under-11 override)
      fields.ageRange = { min: 6, max: 11 };
      return fields;
    }
    if (isAmbiguousSignal) {
      // Unverified/ambiguous secondary signal spans 13..15 (crosses 14/15 -> ambiguous without override)
      fields.ageRange = { min: 13, max: 15 };
      return fields;
    }
    return fields;
  };

  const selectorEvidence = buildSelectorEvidence();

  // Validate staffOverride value
  if (normalizedOverride === '__invalid__') {
    return {
      contractVersion: LAYOUT_CONTRACT_VERSION,
      layout: 'existing',
      reason: 'invalid',
      verified: true,
      evidenceVerified: false,
      ...selectorEvidence,
      override: rawOverrideInput,
      source: 'none',
      role,
      isPrimary,
      trustedAge,
      trustedAgeStatus,
      trustedAgeRange,
      trustedCohortStatus,
      staffOverride: null,
      overrideBlocked: true
    };
  }

  // Invalid age/cohort data cannot be papered over by an override
  if (trustedAgeStatus === 'invalid' || trustedCohortStatus === 'invalid') {
    return {
      contractVersion: LAYOUT_CONTRACT_VERSION,
      layout: 'existing',
      reason: 'invalid',
      verified: true,
      evidenceVerified: false,
      age: null,
      ...(normalizedOverride ? { override: toContractOverride(normalizedOverride) } : {}),
      source: 'none',
      role,
      isPrimary,
      trustedAge: null,
      trustedAgeStatus,
      trustedAgeRange,
      trustedCohortStatus,
      staffOverride: normalizedOverride,
      overrideBlocked: Boolean(normalizedOverride)
    };
  }

  // Under-11 safeguard:
  // A student is protected against silent/accidental opt-in if:
  // - Verified DOB shows age < 11, OR
  // - No verified DOB, and verified cohort range has min < 11, OR
  // - No verified DOB, and learner is classified as 'primary' (ages 6-11).
  const isVerifiedUnder11ByDob = trustedAgeStatus === 'valid' && trustedAge < LOWER_SECONDARY_MIN_AGE;
  const isUnder11OrBoundaryByCohort =
    trustedAgeStatus !== 'valid' &&
    trustedAgeRange !== null &&
    trustedAgeRange.min < LOWER_SECONDARY_MIN_AGE;
  const isUnverifiedAgePrimary = trustedAgeStatus !== 'valid' && isPrimary;

  if (
    normalizedOverride === 'lower-secondary' &&
    (isVerifiedUnder11ByDob || isUnder11OrBoundaryByCohort || isUnverifiedAgePrimary)
  ) {
    const blockedSource = isVerifiedUnder11ByDob
      ? 'verified_dob'
      : isUnder11OrBoundaryByCohort && trustedCohortStatus === 'valid'
        ? cohortSource
        : 'none';
    const blockedReason =
      isVerifiedUnder11ByDob || (isUnder11OrBoundaryByCohort && rangeClassification === 'outside-rollout') || isUnverifiedAgePrimary
        ? 'outside-rollout'
        : 'ambiguous';
    return {
      contractVersion: LAYOUT_CONTRACT_VERSION,
      layout: 'existing',
      reason: blockedReason,
      verified: true,
      evidenceVerified: isVerifiedUnder11ByDob || (isUnder11OrBoundaryByCohort && trustedCohortStatus === 'valid'),
      ...selectorEvidence,
      override: toContractOverride(normalizedOverride),
      source: blockedSource,
      role,
      isPrimary,
      trustedAge,
      trustedAgeStatus,
      trustedAgeRange,
      trustedCohortStatus,
      staffOverride: normalizedOverride,
      overrideBlocked: true
    };
  }

  // Apply authorized staff override
  if (normalizedOverride === 'existing' || normalizedOverride === 'lower-secondary') {
    return {
      contractVersion: LAYOUT_CONTRACT_VERSION,
      layout: normalizedOverride,
      reason: 'staff-override',
      verified: true,
      evidenceVerified: true,
      ...selectorEvidence,
      override: toContractOverride(normalizedOverride),
      source: 'staff_override',
      role,
      isPrimary,
      trustedAge,
      trustedAgeStatus,
      trustedAgeRange,
      trustedCohortStatus,
      staffOverride: normalizedOverride,
      overrideBlocked: false
    };
  }

  // Automatic resolution: 1. Verified DOB
  if (trustedAgeStatus === 'valid') {
    const dobReason =
      trustedAge >= LOWER_SECONDARY_MIN_AGE && trustedAge <= LOWER_SECONDARY_MAX_AGE
        ? 'eligible'
        : trustedAge > LOWER_SECONDARY_MAX_AGE
          ? 'older'
          : 'outside-rollout';
    return {
      contractVersion: LAYOUT_CONTRACT_VERSION,
      layout: dobReason === 'eligible' ? 'lower-secondary' : 'existing',
      reason: dobReason,
      verified: true,
      evidenceVerified: true,
      ...selectorEvidence,
      source: 'verified_dob',
      role,
      isPrimary,
      trustedAge,
      trustedAgeStatus,
      trustedAgeRange,
      trustedCohortStatus,
      staffOverride: null,
      overrideBlocked: false
    };
  }

  // Automatic resolution: 2. Verified Cohort Range
  if (trustedCohortStatus === 'valid' && rangeClassification) {
    return {
      contractVersion: LAYOUT_CONTRACT_VERSION,
      layout: rangeClassification === 'eligible' ? 'lower-secondary' : 'existing',
      reason: rangeClassification,
      verified: true,
      evidenceVerified: true,
      ...selectorEvidence,
      source: cohortSource,
      role,
      isPrimary,
      trustedAge: null,
      trustedAgeStatus,
      trustedAgeRange,
      trustedCohortStatus,
      staffOverride: null,
      overrideBlocked: false
    };
  }

  // Automatic resolution: 3. Ambiguous / Unverified signals vs Missing
  const isAmbiguous = isAmbiguousSignal || isPrimary;

  return {
    contractVersion: LAYOUT_CONTRACT_VERSION,
    layout: 'existing',
    reason: isAmbiguous ? 'ambiguous' : 'missing',
    verified: true,
    evidenceVerified: false,
    ...selectorEvidence,
    source: 'none',
    role,
    isPrimary,
    trustedAge: null,
    trustedAgeStatus,
    trustedAgeRange,
    trustedCohortStatus,
    staffOverride: null,
    overrideBlocked: false
  };
}

/**
 * Reconstructs server-verified fields from `auditLogs` (where `source === 'server'`)
 * when `userLayoutAuthority/{uid}` has not yet been written for an account.
 */
async function reconstructFromServerAuditLogs(db, uid) {
  try {
    const snap = await db.collection('auditLogs').where('subjectUid', '==', uid).get();
    if (snap.empty) return null;

    const serverEntries = snap.docs
      .map((d) => d.data())
      .filter(
        (entry) =>
          entry &&
          entry.source === 'server' &&
          ['ACCOUNT_CREATED', 'DETAILS_CHANGED', 'LAYOUT_OVERRIDE_CHANGED'].includes(entry.action)
      )
      .sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate().toISOString() : String(a.createdAt || '');
        const tb = b.createdAt?.toDate ? b.createdAt.toDate().toISOString() : String(b.createdAt || '');
        return ta.localeCompare(tb);
      });

    if (!serverEntries.length) return null;

    const state = {
      hasServerAudit: true,
      dobVerified: false,
      dateOfBirth: null,
      cohortVerified: false,
      cohortId: null,
      cohort: null,
      overrideVerified: false,
      layoutOverride: null
    };

    for (const entry of serverEntries) {
      const after = entry.details?.after || entry.details || {};
      if ('dateOfBirth' in after) {
        state.dobVerified = true;
        state.dateOfBirth = after.dateOfBirth ?? null;
      }
      if ('cohortId' in after) {
        state.cohortVerified = true;
        state.cohortId = after.cohortId ?? null;
      }
      if ('cohort' in after) {
        state.cohort = after.cohort ?? null;
      }
      if ('layoutOverride' in after) {
        state.overrideVerified = true;
        state.layoutOverride = after.layoutOverride ?? null;
      }
    }

    return state;
  } catch {
    return null;
  }
}

/**
 * Resolves the trusted `layoutSelection` contract for a user from Firestore
 * and verified Auth claims.
 */
export async function resolveUserLayoutSelection(
  db,
  { uid, role, signedClaims = {}, userData = {}, referenceDate = null }
) {
  const effectiveRole = role || signedClaims?.role || userData?.role || null;
  if (effectiveRole !== 'student' && effectiveRole !== 'learner') {
    return evaluateLayoutSelection({ role: effectiveRole });
  }

  const isPrimary =
    userData?.ageBand === 'primary' ||
    userData?.cohort === 'primary';

  // 1. Load server-only authority document `userLayoutAuthority/{uid}`
  let authority = null;
  if (uid) {
    try {
      const authSnap = await db.collection('userLayoutAuthority').doc(uid).get();
      if (authSnap.exists) {
        authority = authSnap.data();
      }
    } catch {
      authority = null;
    }
  }

  // 2. Fallback to server-authored audit logs if no authority doc exists yet
  if (!authority && uid) {
    authority = await reconstructFromServerAuditLogs(db, uid);
  }

  let hasUnverifiedAgeSignal = false;

  // 3. Resolve staffOverride from server authority only
  let staffOverride = null;
  if (authority && ('layoutOverride' in authority)) {
    staffOverride = authority.layoutOverride ?? null;
  }
  if (
    userData?.layoutOverride !== undefined &&
    userData?.layoutOverride !== null &&
    userData.layoutOverride !== staffOverride
  ) {
    // Client-written layoutOverride on users/{uid} without matching server authority
    hasUnverifiedAgeSignal = true;
  }

  // 4. Resolve verified dateOfBirth
  let trustedAgeStatus = 'missing';
  let trustedAge = null;

  if (authority?.dobVerified && authority.dateOfBirth !== null && authority.dateOfBirth !== undefined && authority.dateOfBirth !== '') {
    const parsed = parseVerifiedDob(authority.dateOfBirth, referenceDate);
    trustedAgeStatus = parsed.status;
    trustedAge = parsed.age;
    // Detect if client also modified users/{uid}.dateOfBirth away from authority
    if (userData?.dateOfBirth && userData.dateOfBirth !== authority.dateOfBirth) {
      hasUnverifiedAgeSignal = true;
    }
  } else if (userData?.dateOfBirth !== undefined && userData?.dateOfBirth !== null && String(userData.dateOfBirth).trim() !== '') {
    // dateOfBirth present on client-writable users/{uid} without server authority
    trustedAgeStatus = 'unverified';
    hasUnverifiedAgeSignal = true;
  }

  // 5. Resolve verified cohortId (from authority or staff-assigned classes)
  let trustedCohortStatus = 'missing';
  let trustedAgeRange = null;
  let cohortSource = 'verified_cohort';

  const verifiedCohortId = authority?.cohortVerified && authority.cohortId ? authority.cohortId : null;

  // Determine staff-assigned classIds: must be present in BOTH signed custom claims
  // (or authority.classIds) AND userData.classIds, and not self-enrolled via joinCode.
  const claimClassIds = Array.isArray(signedClaims?.classIds)
    ? signedClaims.classIds
    : Array.isArray(authority?.classIds)
      ? authority.classIds
      : [];
  const profileClassIds = Array.isArray(userData?.classIds) ? userData.classIds : [];
  const claimSchoolIds = Array.isArray(signedClaims?.schoolIds)
    ? signedClaims.schoolIds
    : Array.isArray(authority?.schoolIds)
      ? authority.schoolIds
      : [];
  const profileSchoolIds = Array.isArray(userData?.schoolIds) ? userData.schoolIds : [];

  const staffAssignedClassIds = claimClassIds.filter(
    (cid) => typeof cid === 'string' && cid.length > 0 && profileClassIds.includes(cid)
  );
  const staffAssignedSchoolIds = claimSchoolIds.filter(
    (sid) => typeof sid === 'string' && sid.length > 0 && profileSchoolIds.includes(sid)
  );

  if (verifiedCohortId) {
    const cohortSnap = await db.collection('cohorts').doc(verifiedCohortId).get();
    if (cohortSnap.exists) {
      const evaluated = evaluateCohortRange(cohortSnap.data(), verifiedCohortId);
      trustedCohortStatus = evaluated.status;
      trustedAgeRange = evaluated.range;
      cohortSource = 'verified_cohort';
    } else {
      trustedCohortStatus = 'ambiguous';
    }
    if (userData?.cohortId && userData.cohortId !== verifiedCohortId) {
      hasUnverifiedAgeSignal = true;
    }
  } else if (staffAssignedClassIds.length > 0) {
    const classSnaps = await Promise.all(
      staffAssignedClassIds.map((cid) => db.collection('classes').doc(cid).get())
    );
    const activeClasses = classSnaps
      .filter((snap) => snap.exists)
      .map((snap) => ({ id: snap.id, ...snap.data() }))
      .filter((cls) => {
        if (cls.status === 'archived') return false;
        if (staffAssignedSchoolIds.length > 0 && cls.schoolId) {
          return staffAssignedSchoolIds.includes(cls.schoolId);
        }
        return true;
      });

    const classCohortIds = [
      ...new Set(
        activeClasses
          .map((cls) => cls.cohortId)
          .filter((cid) => typeof cid === 'string' && cid.trim().length > 0)
      )
    ];

    if (classCohortIds.length === 1) {
      const cid = classCohortIds[0];
      const cohortSnap = await db.collection('cohorts').doc(cid).get();
      if (cohortSnap.exists) {
        const evaluated = evaluateCohortRange(cohortSnap.data(), cid);
        trustedCohortStatus = evaluated.status;
        trustedAgeRange = evaluated.range;
        cohortSource = 'verified_class_cohort';
      } else {
        trustedCohortStatus = 'ambiguous';
      }
      if (userData?.cohortId && userData.cohortId !== cid) {
        hasUnverifiedAgeSignal = true;
      }
    } else if (classCohortIds.length > 1) {
      trustedCohortStatus = 'ambiguous';
      hasUnverifiedAgeSignal = true;
    } else if (userData?.cohortId) {
      trustedCohortStatus = 'unverified';
      hasUnverifiedAgeSignal = true;
    }
  } else if (userData?.cohortId) {
    trustedCohortStatus = 'unverified';
    hasUnverifiedAgeSignal = true;
  }

  // 6. Check for legacy/unverified self-editable age/cohort signals on users/{uid}
  if (
    Boolean(userData?.ageBand) ||
    Boolean(userData?.cohort) ||
    Boolean(userData?.yearLevel) ||
    Boolean(userData?.enrolledVia)
  ) {
    hasUnverifiedAgeSignal = true;
  }

  const resolvedIsPrimary =
    isPrimary ||
    authority?.cohort === 'primary' ||
    (trustedCohortStatus === 'valid' &&
      trustedAgeRange &&
      trustedAgeRange.max < LOWER_SECONDARY_MIN_AGE);

  return evaluateLayoutSelection({
    role: effectiveRole,
    isPrimary: resolvedIsPrimary,
    trustedAge,
    trustedAgeStatus,
    trustedAgeRange,
    trustedCohortStatus,
    staffOverride,
    hasUnverifiedAgeSignal,
    cohortSource
  });
}

/**
 * Validates a proposed `layoutOverride` write for a target user and checks
 * under-11 safeguard rules.
 *
 * Returns `{ ok: true, value: 'lower-secondary' | 'existing' | null }` or
 * `{ ok: false, field: 'layoutOverride', message: string }`.
 */
export function validateLayoutOverrideWrite({
  targetRole,
  layoutOverride,
  verifiedDob = null,
  cohortDoc = null,
  cohort = null,
  ageBand = null,
  referenceDate = null
}) {
  if (targetRole !== 'student' && targetRole !== 'learner') {
    return {
      ok: false,
      field: 'layoutOverride',
      message: 'Layout overrides can only be set for student accounts.'
    };
  }

  const normalized = normalizeOverrideInput(layoutOverride);
  if (normalized === null) {
    return { ok: true, value: null };
  }

  if (normalized === '__invalid__') {
    return {
      ok: false,
      field: 'layoutOverride',
      message: 'Choose a valid layout override: lower-secondary, existing, or null.'
    };
  }

  if (normalized === 'lower-secondary') {
    const dobParsed = parseVerifiedDob(verifiedDob, referenceDate);
    if (dobParsed.status === 'invalid') {
      return {
        ok: false,
        field: 'dateOfBirth',
        message: 'Enter a valid date of birth (YYYY-MM-DD) before overriding layout.'
      };
    }

    if (dobParsed.status === 'valid' && dobParsed.age < LOWER_SECONDARY_MIN_AGE) {
      return {
        ok: false,
        field: 'layoutOverride',
        message: 'Under-11 students cannot be opted into the lower-secondary layout.'
      };
    }

    if (dobParsed.status !== 'valid') {
      const cohortRange = evaluateCohortRange(cohortDoc);
      if (cohortRange.range && cohortRange.range.min < LOWER_SECONDARY_MIN_AGE) {
        return {
          ok: false,
          field: 'layoutOverride',
          message: 'Under-11 primary cohort students cannot be opted into the lower-secondary layout.'
        };
      }
      if (cohort === 'primary' || ageBand === 'primary') {
        return {
          ok: false,
          field: 'layoutOverride',
          message: 'Primary students without a verified age of 11–14 cannot be opted into the lower-secondary layout.'
        };
      }
    }
  }

  return { ok: true, value: normalized };
}

