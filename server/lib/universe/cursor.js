/**
 * Exact Timestamp & Document ID Cursor Pagination and Submission Snapshot Formatter
 * Conforms to MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md (§9.3, §9.5).
 *
 * Never truncates timestamps to milliseconds so records created within the same
 * millisecond are never skipped or duplicated across pages.
 */

import { Timestamp } from 'firebase-admin/firestore';
import { resolveTask } from '../../../shared/universe/index.js';
import {
  evaluateTaskAvailability,
  hashCanonicalTuple,
  isSafeId
} from './missions.js';

const MAX_CURSOR_LENGTH = 512;

export function extractExactTimestamp(ts) {
  if (!ts) {
    return { seconds: 0, nanoseconds: 0, iso: null };
  }
  if (typeof ts._seconds === 'number' && typeof ts._nanoseconds === 'number') {
    const t = new Timestamp(ts._seconds, ts._nanoseconds);
    return { seconds: ts._seconds, nanoseconds: ts._nanoseconds, iso: t.toDate().toISOString() };
  }
  if (typeof ts.seconds === 'number' && typeof ts.nanoseconds === 'number') {
    const t = new Timestamp(ts.seconds, ts.nanoseconds);
    return { seconds: ts.seconds, nanoseconds: ts.nanoseconds, iso: t.toDate().toISOString() };
  }
  if (typeof ts === 'string') {
    const ms = Date.parse(ts);
    if (Number.isFinite(ms)) {
      const t = Timestamp.fromMillis(ms);
      return { seconds: t.seconds, nanoseconds: t.nanoseconds, iso: new Date(ms).toISOString() };
    }
  }
  if (typeof ts === 'number' && Number.isFinite(ts)) {
    const t = Timestamp.fromMillis(ts);
    return { seconds: t.seconds, nanoseconds: t.nanoseconds, iso: new Date(ts).toISOString() };
  }
  return { seconds: 0, nanoseconds: 0, iso: null };
}

export function computeCursorFilterHash(filterTuple) {
  return hashCanonicalTuple(filterTuple);
}

export function encodeUniverseCursor({ seconds, nanoseconds, docId, filterHash }) {
  const payload = JSON.stringify({ s: seconds, n: nanoseconds, d: docId, f: filterHash });
  return Buffer.from(payload, 'utf8').toString('base64url');
}

export function decodeUniverseCursor(cursorStr, expectedFilterHash) {
  if (cursorStr === undefined || cursorStr === null || cursorStr === '') {
    return { ok: true, value: null };
  }
  if (typeof cursorStr !== 'string' || cursorStr.length > MAX_CURSOR_LENGTH || !/^[A-Za-z0-9_-]+$/.test(cursorStr)) {
    return { ok: false, error: { code: 'INVALID_CURSOR', message: 'Invalid pagination cursor.', field: 'cursor' } };
  }
  let parsed;
  try {
    const json = Buffer.from(cursorStr, 'base64url').toString('utf8');
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: { code: 'INVALID_CURSOR', message: 'Malformed pagination cursor.', field: 'cursor' } };
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    Object.keys(parsed).length !== 4 ||
    !Number.isSafeInteger(parsed.s) ||
    parsed.s < 0 ||
    parsed.s > 9_999_999_999 ||
    !Number.isSafeInteger(parsed.n) ||
    parsed.n < 0 ||
    parsed.n > 999_999_999 ||
    !isSafeId(parsed.d) ||
    typeof parsed.f !== 'string' ||
    parsed.f !== expectedFilterHash
  ) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CURSOR',
        message: 'Pagination cursor does not match the current query parameters or scope.',
        field: 'cursor'
      }
    };
  }

  return {
    ok: true,
    value: {
      seconds: parsed.s,
      nanoseconds: parsed.n,
      timestamp: new Timestamp(parsed.s, parsed.n),
      docId: parsed.d,
      filterHash: parsed.f
    }
  };
}

export function parsePageLimit(rawLimit) {
  if (rawLimit === undefined || rawLimit === null || rawLimit === '') {
    return { ok: true, value: 20 };
  }
  const str = String(rawLimit).trim();
  if (!/^\d+$/.test(str)) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'limit must be an integer between 1 and 50.', field: 'limit' } };
  }
  const num = Number(str);
  if (!Number.isSafeInteger(num) || num < 1 || num > 50) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'limit must be between 1 and 50.', field: 'limit' } };
  }
  return { ok: true, value: num };
}

/**
 * Exact comparator matching Firestore `.orderBy('createdAt', 'desc').orderBy('__name__', 'desc')`.
 */
export function compareRawSubmissionsDesc(a, b) {
  const tsA = extractExactTimestamp(a.createdAt);
  const tsB = extractExactTimestamp(b.createdAt);
  if (tsB.seconds !== tsA.seconds) return tsB.seconds - tsA.seconds;
  if (tsB.nanoseconds !== tsA.nanoseconds) return tsB.nanoseconds - tsA.nanoseconds;
  const idA = String(a.submissionId || a.id || '');
  const idB = String(b.submissionId || b.id || '');
  if (idB > idA) return 1;
  if (idB < idA) return -1;
  return 0;
}

function normalizeStoredEvidence(evidence) {
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

/**
 * Format a stored missionSubmissions document into the complete Contract §9.3 item snapshot.
 * Preserves legacy 0.1.0-draft reflection-only records via read-only legacyFormat: true adapter.
 */
export function formatSubmissionItem(docId, data, { registry = [], overrideMap = new Map(), nowIso = new Date().toISOString() } = {}) {
  const submissionId = data.submissionId || data.id || docId;
  const createdParts = extractExactTimestamp(data.createdAt);
  const reviewedParts = data.reviewedAt ? extractExactTimestamp(data.reviewedAt) : { iso: null };

  const isLegacy =
    data.legacyFormat === true ||
    data.missionVersion === '0.1.0-draft' ||
    !Array.isArray(data.evidence);

  const identity = {
    releaseId: data.releaseId || (isLegacy ? 'legacy-0.1.0-draft' : null),
    missionId: data.missionId || null,
    missionVersion: data.missionVersion || null,
    routeId: data.routeId || null,
    taskId: data.taskId || null,
    policyVersion: data.policyVersion || (isLegacy ? 'legacy-0.1.0-draft' : null)
  };

  let availability;
  if (isLegacy) {
    availability = {
      ...identity,
      status: 'retired',
      canStart: false,
      canResume: false,
      canSubmit: false,
      reasonCode: 'MISSION_RETIRED',
      reason: 'Legacy 0.1.0-draft reflection-only record (read-only history).',
      availabilityRevision: 1,
      checkedAt: nowIso
    };
  } else {
    const resolved = resolveTask(registry, identity);
    const overrideKey = JSON.stringify([
      identity.releaseId,
      identity.missionId,
      identity.missionVersion,
      identity.routeId,
      identity.taskId,
      identity.policyVersion
    ]);
    const overrideData = overrideMap.get(overrideKey) || null;
    availability = resolved.ok
      ? evaluateTaskAvailability(resolved.value, { overrideData, nowIso })
      : evaluateTaskAvailability(null, { nowIso });
  }

  const rawDisplayName = typeof data.learnerDisplayName === 'string' ? data.learnerDisplayName.trim() : '';
  const safeDisplayName = rawDisplayName && !rawDisplayName.includes('@') ? rawDisplayName.slice(0, 120) : 'Learner';

  return {
    submissionId,
    id: submissionId,
    submissionRevision: Number.isSafeInteger(data.submissionRevision) ? data.submissionRevision : 1,
    attemptNumber: Number.isSafeInteger(data.attemptNumber) ? data.attemptNumber : 1,
    previousSubmissionId: data.previousSubmissionId || null,
    releaseId: identity.releaseId,
    missionId: identity.missionId,
    missionTitle: data.missionTitle || identity.missionId || 'Universe Mission',
    missionVersion: identity.missionVersion,
    missionContentHash: data.missionContentHash || null,
    routeId: identity.routeId,
    taskId: identity.taskId,
    supportMode: data.supportMode || (isLegacy ? 'guided' : null),
    policyVersion: identity.policyVersion,
    learnerUid: data.learnerUid,
    learnerDisplayName: safeDisplayName,
    orgId: data.orgId || null,
    classIds: Array.isArray(data.classIds) ? data.classIds : [],
    status: data.status,
    reflection: typeof data.reflection === 'string' ? data.reflection : '',
    evidence: normalizeStoredEvidence(data.evidence),
    previousCoachNote: data.previousCoachNote ?? null,
    coachUid: data.coachUid ?? null,
    coachNote: data.coachNote ?? null,
    createdAt: data.createdAtIso || createdParts.iso,
    reviewedAt: data.reviewedAtIso || reviewedParts.iso,
    availability,
    outcome: data.outcome ?? null,
    legacyFormat: Boolean(isLegacy)
  };
}
