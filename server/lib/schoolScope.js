import { getFirestore } from 'firebase-admin/firestore';
export function fail(status, code, message) {
  const error = new Error(message);
  Object.assign(error, {
    status,
    code
  });
  throw error;
}
export function validId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value);
}
export function requireId(value) {
  if (!validId(value)) fail(400, 'VALIDATION', 'A valid school record ID is required.');
  return value;
}
export function requireText(value, label, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail(400, 'VALIDATION', `${label} is required (maximum ${max} characters).`);
  return value.trim();
}
export const staff = caller => ['teacher', 'coach'].includes(caller.role);
export function adminOnly(caller) {
  if (caller.role !== 'admin') fail(403, 'FORBIDDEN', 'Only the school admin can make this change.');
}
export function intersection(a, b) {
  return Array.isArray(a) && Array.isArray(b) ? a.filter(id => validId(id) && b.includes(id)) : [];
}

export function cohortForGrade(grade) {
  const g = typeof grade === 'string' ? Number(grade.trim()) : Number(grade);
  if (!Number.isInteger(g) || g < 6 || g > 12) return null;
  if (g >= 6 && g <= 8) return 'cohort-wls';
  if (g >= 9 && g <= 12) return 'cohort-whs';
  return null;
}

export function validateGradeAndCohort({ gradeLevel, cohortId }) {
  if (gradeLevel !== undefined && gradeLevel !== null && gradeLevel !== '') {
    const g = typeof gradeLevel === 'string' ? Number(gradeLevel.trim()) : Number(gradeLevel);
    if (!Number.isInteger(g) || g < 6 || g > 12) {
      fail(400, 'VALIDATION', 'Grade level must be between 6 and 12.');
    }
    const derivedCohort = g <= 8 ? 'cohort-wls' : 'cohort-whs';
    if (cohortId && cohortId !== derivedCohort) {
      fail(400, 'VALIDATION', `Cohort ${cohortId} does not match grade level ${g}. Expected ${derivedCohort}.`);
    }
    return { gradeLevel: g, cohortId: derivedCohort };
  }
  return { gradeLevel: null, cohortId: cohortId || null };
}

// New workflows require signed role/scope AND the current provisioned profile.
// The intersection revokes access immediately after a profile reassignment.
export async function schoolCaller(req) {
  const profile = await getFirestore().collection('users').doc(req.caller.uid).get();
  const data = profile.data() || {};
  const claims = req.caller.signedClaims || {};
  const role = claims.role || 'student';
  if (!profile.exists || data.status === 'suspended' || data.role !== role) fail(403, 'FORBIDDEN', 'Your verified school access needs checking by an administrator.');
  return {
    uid: req.caller.uid,
    role,
    schoolIds: intersection(claims.schoolIds, data.schoolIds),
    classIds: intersection(claims.classIds, data.classIds),
    cohortIds: intersection(claims.cohortIds, data.cohortIds),
    profile: data
  };
}
export async function schoolAccess(caller, schoolId) {
  requireId(schoolId);
  const db = getFirestore();
  const school = await db.collection('schools').doc(schoolId).get();
  if (!school.exists || school.data().status === 'suspended') fail(403, 'FORBIDDEN', 'School access is unavailable.');
  if (caller.schoolIds.includes(schoolId)) return school.data();
  // School enrollment is a signed administrative grant. A self-created
  // student profile or classIds field alone must not grant school access.
  if (caller.role === 'parent') {
    const links = await db.collection('parentLinks').where('parentUid', '==', caller.uid).where('status', '==', 'active').get();
    for (const link of links.docs) {
      const child = await db.collection('users').doc(link.data().studentUid).get();
      if (child.exists && child.data().schoolIds?.includes(schoolId)) return school.data();
    }
  }
  fail(403, 'FORBIDDEN', 'You do not have access to this school.');
}
export async function assignedClass(caller, schoolId, classId) {
  requireId(classId);
  const c = await getFirestore().collection('classes').doc(classId).get();
  if (!c.exists || c.data().schoolId !== schoolId || c.data().status === 'archived' || caller.role !== 'admin' && (!staff(caller) || !caller.classIds.includes(classId))) fail(403, 'FORBIDDEN', 'This class is not assigned to you.');
  return c.data();
}
export async function learnerAccess(caller, schoolId, learnerUid, classId) {
  requireId(learnerUid);
  const snap = await getFirestore().collection('users').doc(learnerUid).get();
  const learner = snap.data();
  if (!learner || learner.role !== 'student' || !learner.schoolIds?.includes(schoolId)) fail(403, 'FORBIDDEN', 'Learner access is unavailable.');
  if (caller.role === 'admin') return learner;
  if (staff(caller)) {
    if (classId) {
      await assignedClass(caller, schoolId, classId);
      if (learner.classIds?.includes(classId)) return learner;
    }
    const sharesCohort = (learner.cohortId && caller.cohortIds?.includes(learner.cohortId))
      || learner.cohortIds?.some(id => caller.cohortIds?.includes(id));
    if (sharesCohort) return learner;
    if (learner.classIds?.some(id => caller.classIds.includes(id))) return learner;
  }
  if (caller.role === 'student' && caller.uid === learnerUid) return learner;
  if (caller.role === 'parent') {
    const links = await getFirestore().collection('parentLinks').where('parentUid', '==', caller.uid).where('studentUid', '==', learnerUid).where('status', '==', 'active').get();
    if (!links.empty) return learner;
  }
  fail(403, 'FORBIDDEN', 'You do not have access to this learner.');
}

export function validateSupportCategory(category) {
  const allowed = ['first_step', 'explain_different', 'need_break', 'private_talk'];
  if (typeof category !== 'string' || !allowed.includes(category)) {
    fail(400, 'VALIDATION', 'Choose a valid support category.');
  }
  return category;
}

export function validateSupportStatus(status) {
  const allowed = ['submitted', 'acknowledged', 'checked_in', 'resolved'];
  if (typeof status !== 'string' || !allowed.includes(status)) {
    fail(400, 'VALIDATION', 'Choose a valid support status.');
  }
  return status;
}

