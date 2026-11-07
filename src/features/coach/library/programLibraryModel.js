/**
 * Shared Programs library: the pure rules, so they can be unit-tested.
 *
 * A record in `program_library/{programId}` holds the coach-only draft. The
 * published copy students read stays in `pbl_programs/{programId}`, under the
 * same id, so the library and the student dashboard share one program identity.
 */
import { normaliseContractProgram, PblProgramContractSchema } from '../../../services/pblService.js';
import { convertUnitToProgram } from '../studio/pblTransferService.js';

// The server and admin tools treat a missing org the same way (admin-users.js).
export const DEFAULT_ORG_ID = 'org-welearn';
export const LIBRARY_ROLES = ['teacher', 'coach', 'admin', 'supervisor'];
export const COMMENT_MAX = 2000;

export const resolveOrgId = (orgId) => (typeof orgId === 'string' && orgId ? orgId : DEFAULT_ORG_ID);
export const isLibraryRole = (role) => LIBRARY_ROLES.includes(role);
export const isCoachRole = (role) => role === 'teacher' || role === 'coach';
export const reviewNotificationId = (programId) => `program-review_${programId}`;

/** The creator controls a program; an administrator keeps the same authority. */
export function canManageProgram(record, { uid, role } = {}) {
  if (!record || !uid) return false;
  return role === 'admin' || record.creatorUid === uid;
}

const sortValue = (value) => {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      if (value[key] !== undefined) out[key] = sortValue(value[key]);
      return out;
    }, {});
  }
  return value;
};

/** Firestore returns map keys in its own order, so compare with sorted keys. */
export const contentFingerprint = (unit) => JSON.stringify(sortValue(unit));

/** Firestore rejects `undefined`, which unit objects can carry after inline edits. */
export const toStorable = (value) => JSON.parse(JSON.stringify(value));

/**
 * Takes a unit through exactly the path a publish and a student read use, so a
 * preview shows what a learner will get: `data` is what is stored in
 * pbl_programs, `view` is what getProgram hands to the course player.
 */
export function programFromUnit(unit, creatorUid) {
  if (!unit?.id) throw new Error('This course has no program id. Run the synthesis again.');
  if (!Array.isArray(unit.milestones) || unit.milestones.length === 0) {
    throw new Error('This course has no stages to save.');
  }
  const converted = convertUnitToProgram(unit, creatorUid);
  converted.authorId = creatorUid;
  const normalised = normaliseContractProgram(converted);
  normalised.slug = normalised.slug || unit.id;
  const parsed = PblProgramContractSchema.safeParse(normalised);
  if (!parsed.success) {
    throw new Error(`This course is incomplete: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
  }
  return { data: parsed.data, view: normaliseContractProgram({ id: unit.id, ...parsed.data }) };
}

/**
 * Learner progress is keyed by session number, and enrolments point at the live
 * program, so renumbering or reshaping stages would misattribute completed work.
 */
export function stageStructure(phases) {
  return (Array.isArray(phases) ? phases : []).map((phase) => ({
    id: phase.id || phase.phaseId,
    title: phase.title,
    sessions: (phase.sessions || []).map((s) => s.sessionNumber)
  }));
}

export function sameStageStructure(a, b) {
  return JSON.stringify(stageStructure(a)) === JSON.stringify(stageStructure(b));
}

export function shortDescription(unit, max = 160) {
  const text = String(unit?.realProblem?.summary || unit?.drivingQuestion || '').trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Published programs stay in Published, even with pending draft changes. */
export function filterPrograms(records, { tab = 'in-progress', createdByMe = false, uid = null } = {}) {
  return (records || [])
    .filter((r) => (tab === 'published' ? r.status === 'published' : r.status !== 'published'))
    .filter((r) => !createdByMe || r.creatorUid === uid)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/** The creator never hears about their own program; unread is per reader. */
export function visibleNotifications(notifications, readIds, uid) {
  const read = readIds instanceof Set ? readIds : new Set(readIds || []);
  return (notifications || [])
    .filter((n) => n.actorUid !== uid)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map((n) => ({ ...n, unread: !read.has(n.id) }));
}

export const notificationText = (n) => `${n.actorName || 'A coach'} added ${n.programTitle || 'a program'} for review.`;

export function explainLibraryError(err, fallback) {
  if (err?.code === 'permission-denied' || /permission/i.test(err?.message || '')) {
    return 'You do not have permission to do this. Nothing was saved.';
  }
  return err?.message || fallback;
}
