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

// New workflows require signed role/scope AND the current provisioned profile.
// The intersection revokes access immediately after a profile reassignment.
export async function schoolCaller(req) {
  const userRef = getFirestore().collection('users').doc(req.caller.uid);
  const profile = await userRef.get();
  let data = profile.data() || {};
  const claims = req.caller.signedClaims || {};
  const role = claims.role || req.caller.role || data.role || 'student';
  if (!profile.exists) {
    data = {
      uid: req.caller.uid,
      email: req.caller.email || '',
      displayName: req.caller.displayName || (req.caller.email ? req.caller.email.split('@')[0] : 'Learner'),
      role,
      status: 'active',
      schoolIds: claims.schoolIds || [],
      classIds: claims.classIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await userRef.set(data, { merge: true }).catch(() => {});
  }
  const isRoleMatch = !data.role || data.role === role || (['teacher', 'coach'].includes(data.role) && ['teacher', 'coach'].includes(role));
  if (data.status === 'suspended' || !isRoleMatch) fail(403, 'FORBIDDEN', 'Your verified school access needs checking by an administrator.');
  return {
    uid: req.caller.uid,
    role,
    schoolIds: intersection(claims.schoolIds || data.schoolIds, data.schoolIds || claims.schoolIds),
    classIds: intersection(claims.classIds || data.classIds, data.classIds || claims.classIds),
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
    await assignedClass(caller, schoolId, classId);
    if (learner.classIds?.includes(classId)) return learner;
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

