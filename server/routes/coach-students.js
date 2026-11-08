import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { schoolCaller, schoolAccess, assignedClass, requireId, requireText, fail, staff } from '../lib/schoolScope.js';

const router = Router();
router.use(requireClaims);
const route = fn => async (req, res, next) => {
  try {
    const caller = await schoolCaller(req);
    if (caller.role !== 'admin' && !staff(caller)) fail(403, 'FORBIDDEN', 'Only administrators and assigned coaches can add students.');
    await fn(req, res, caller);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') return sendError(res, 409, 'CONFLICT', 'This email already has an account. Refresh the roster or ask an administrator to check it.');
    if (error.status) return sendError(res, error.status, error.code, error.message);
    next(error);
  }
};

router.get('/classes', route(async (req, res, caller) => {
  const db = getFirestore();
  const classes = [];
  for (const schoolId of caller.schoolIds) {
    await schoolAccess(caller, schoolId);
    const snapshots = caller.role === 'admin'
      ? (await db.collection('classes').where('schoolId', '==', schoolId).get()).docs
      : await Promise.all(caller.classIds.map(id => db.collection('classes').doc(id).get()));
    for (const snap of snapshots) {
      const cls = snap.data();
      if (!cls || cls.schoolId !== schoolId || cls.status === 'archived') continue;
      classes.push({ id: snap.id, name: cls.name || snap.id, schoolId });
    }
  }
  res.set('Cache-Control', 'no-store').json({ items: classes });
}));

router.post('/', route(async (req, res, caller) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['displayName', 'email', 'classId', 'ageBand', 'gradeLevel', 'cohortId'].includes(key))) fail(400, 'VALIDATION', 'Provide a student name, email, class, and age band only.');
  const displayName = requireText(body.displayName, 'Student name', 160);
  const email = requireText(body.email, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'VALIDATION', 'Enter a valid email address.');
  if (!['primary', '13-15', '16-18'].includes(body.ageBand)) fail(400, 'VALIDATION', 'Choose a learning age band.');
  let gradeLevel = null;
  let cohortId = null;
  if (body.gradeLevel !== undefined && body.gradeLevel !== null && body.gradeLevel !== '') {
    const g = typeof body.gradeLevel === 'string' ? Number(body.gradeLevel.trim()) : Number(body.gradeLevel);
    if (!Number.isInteger(g) || g < 6 || g > 12) fail(400, 'VALIDATION', 'Grade level must be between 6 and 12.');
    const derivedCohort = g <= 8 ? 'cohort-wls' : 'cohort-whs';
    if (body.cohortId && body.cohortId !== derivedCohort) {
      fail(400, 'VALIDATION', `Cohort ${body.cohortId} does not match grade level ${g}. Expected ${derivedCohort}.`);
    }
    gradeLevel = g;
    cohortId = derivedCohort;
  } else if (body.cohortId) {
    cohortId = body.cohortId;
  }
  const classId = requireId(body.classId);
  const db = getFirestore(), auth = getAuth();
  const clsSnap = await db.collection('classes').doc(classId).get();
  if (!clsSnap.exists) fail(403, 'FORBIDDEN', 'This class is unavailable.');
  const schoolId = clsSnap.data().schoolId;
  const school = await schoolAccess(caller, schoolId);
  const cls = await assignedClass(caller, schoolId, classId);
  const orgId = school.orgId;
  if (!orgId || caller.profile.orgId !== orgId) fail(403, 'FORBIDDEN', 'Your organization assignment needs checking.');
  if (!(await db.collection('users').where('email', '==', email).limit(1).get()).empty) fail(409, 'CONFLICT', 'This email already has an account.');

  let created;
  try {
    // No shared or coach-chosen password. The student chooses it using the
    // private Firebase setup link. Never persist or log this bearer link.
    created = await auth.createUser({ email, displayName, emailVerified: false });
    await auth.setCustomUserClaims(created.uid, {
      role: 'student',
      orgId,
      schoolIds: [schoolId],
      classIds: [classId],
      ...(cohortId ? { cohortIds: [cohortId], cohortId } : {})
    });
    const setupLink = await auth.generatePasswordResetLink(email);
    const student = {
      uid: created.uid, role: 'student', status: 'pending', displayName, email,
      orgId, schoolIds: [schoolId], classIds: [classId], groupName: cls.name || classId,
      ageBand: body.ageBand,
      ...(gradeLevel !== null ? { gradeLevel } : {}),
      ...(cohortId ? { cohortId, cohortIds: [cohortId] } : {}),
      createdAt: new Date().toISOString(), createdBy: { uid: caller.uid }
    };
    await db.runTransaction(async tx => {
      // Recheck current access after provisioning, including reassignment or
      // suspension while Auth operations were in flight.
      const [profile, schoolNow, classNow] = await Promise.all([
        tx.get(db.collection('users').doc(caller.uid)),
        tx.get(db.collection('schools').doc(schoolId)),
        tx.get(db.collection('classes').doc(classId))
      ]);
      const p = profile.data(), s = schoolNow.data(), c = classNow.data();
      if (!p || p.role !== caller.role || p.status === 'suspended' || p.orgId !== orgId || !p.schoolIds?.includes(schoolId)
        || !s || s.status === 'suspended' || s.orgId !== orgId || !c || c.schoolId !== schoolId || c.status === 'archived'
        || caller.role !== 'admin' && !p.classIds?.includes(classId)) fail(403, 'FORBIDDEN', 'Your class access changed. Ask an administrator to check it.');
      tx.create(db.collection('users').doc(created.uid), student);
      tx.update(db.collection('classes').doc(classId), {
        learnerIds: FieldValue.arrayUnion(created.uid),
        updatedAt: FieldValue.serverTimestamp()
      });
      tx.create(db.collection('schools').doc(schoolId).collection('auditEvents').doc(), {
        actorUid: caller.uid, action: 'STUDENT_CREATED', entityId: created.uid, classId, createdAt: student.createdAt
      });
    });
    res.set('Cache-Control', 'no-store').status(201).json({ student, setupLink, delivery: 'manual' });
  } catch (error) {
    if (created) {
      try { await auth.deleteUser(created.uid); }
      catch {
        // Disable a stranded account if deletion is temporarily unavailable.
        await auth.updateUser(created.uid, { disabled: true }).catch(() => {});
        console.error('[Student provisioning] Account cleanup required:', created.uid);
        return sendError(res, 503, 'CLEANUP_REQUIRED', 'Account setup failed and needs administrator cleanup. Do not retry until it has been checked.');
      }
    }
    throw error;
  }
}));

// Recover after a lost response or an expired setup link without duplicating
// the student. Limit this operation to pending students in an assigned class.
router.post('/:uid/setup-link', route(async (req, res, caller) => {
  const uid = requireId(req.params.uid);
  const snap = await getFirestore().collection('users').doc(uid).get();
  const student = snap.data();
  if (!student || student.role !== 'student' || student.status !== 'pending' || student.orgId !== caller.profile.orgId) fail(403, 'FORBIDDEN', 'A setup link is unavailable for this account.');
  const schoolId = student.schoolIds?.find(id => caller.schoolIds.includes(id));
  if (!schoolId) fail(403, 'FORBIDDEN', 'This student is outside your school.');
  await schoolAccess(caller, schoolId);
  const classId = student.classIds?.find(id => caller.role === 'admin' || caller.classIds.includes(id));
  const sharesCohort = (student.cohortId && caller.cohortIds?.includes(student.cohortId))
    || student.cohortIds?.some(id => caller.cohortIds?.includes(id));
  if (!classId && !sharesCohort && caller.role !== 'admin') fail(403, 'FORBIDDEN', 'This student is outside your assigned classes.');
  if (classId) await assignedClass(caller, schoolId, classId);
  const account = await getAuth().getUser(uid);
  if (account.disabled || account.providerData.some(provider => provider.providerId === 'password')) fail(409, 'CONFLICT', 'This account has already been used or disabled. Use the normal password reset flow.');
  const setupLink = await getAuth().generatePasswordResetLink(student.email);
  res.set('Cache-Control', 'no-store').json({ setupLink, delivery: 'manual' });
}));

export default router;
