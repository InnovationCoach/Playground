import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { writeAuditLog } from '../lib/audit.js';
import { schoolCaller, schoolAccess, assignedClass, requireId, requireText, fail, staff } from '../lib/schoolScope.js';
import {
  resolveUserLayoutSelection,
  validateLayoutOverrideWrite
} from '../lib/layoutSelection.js';

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
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['displayName', 'email', 'classId', 'ageBand'].includes(key))) fail(400, 'VALIDATION', 'Provide a student name, email, class, and age band only.');
  const displayName = requireText(body.displayName, 'Student name', 160);
  const email = requireText(body.email, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'VALIDATION', 'Enter a valid email address.');
  if (!['primary', '13-15', '16-18'].includes(body.ageBand)) fail(400, 'VALIDATION', 'Choose a learning age band.');
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
    await auth.setCustomUserClaims(created.uid, { role: 'student', orgId, schoolIds: [schoolId], classIds: [classId] });
    const setupLink = await auth.generatePasswordResetLink(email);
    const student = {
      uid: created.uid, role: 'student', status: 'pending', isTest: false, displayName, email,
      orgId: orgId || 'org-welearn', schoolIds: [schoolId], classIds: [classId], groupName: cls.name || classId,
      ageBand: body.ageBand, createdAt: new Date().toISOString(), createdBy: { uid: caller.uid }
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
      tx.set(db.collection('userLayoutAuthority').doc(created.uid), {
        uid: created.uid,
        role: 'student',
        orgId: student.orgId,
        schoolIds: [schoolId],
        classIds: [classId],
        dobVerified: false,
        dateOfBirth: null,
        cohortVerified: Boolean(c.cohortId),
        cohortId: c.cohortId || null,
        cohort: null,
        ageBand: body.ageBand,
        overrideVerified: true,
        layoutOverride: null,
        updatedAt: student.createdAt,
        updatedBy: { uid: caller.uid, role: caller.role }
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
  if (!classId) fail(403, 'FORBIDDEN', 'This student is outside your assigned classes.');
  await assignedClass(caller, schoolId, classId);
  const account = await getAuth().getUser(uid);
  if (account.disabled || account.providerData.some(provider => provider.providerId === 'password')) fail(409, 'CONFLICT', 'This account has already been used or disabled. Use the normal password reset flow.');
  const setupLink = await getAuth().generatePasswordResetLink(student.email);
  res.set('Cache-Control', 'no-store').json({ setupLink, delivery: 'manual' });
}));

// Authorized staff/class-scoped layout override for a student in an assigned class.
router.patch('/:uid/layout-override', route(async (req, res, caller) => {
  const uid = requireId(req.params.uid);
  const body = req.body;
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    !('layoutOverride' in body) ||
    Object.keys(body).some(key => !['layoutOverride', 'classId'].includes(key))
  ) {
    fail(400, 'VALIDATION', 'Provide layoutOverride (lower-secondary, existing, or null) only.');
  }

  const db = getFirestore();
  const [userSnap, authoritySnap, account] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('userLayoutAuthority').doc(uid).get(),
    getAuth().getUser(uid).catch(() => null)
  ]);

  if (!userSnap.exists) fail(404, 'NOT_FOUND', 'Student account not found.');
  const student = userSnap.data();
  if (!student || (student.role !== 'student' && student.role !== 'learner')) {
    fail(400, 'VALIDATION', 'Layout overrides can only be set for student accounts.');
  }
  if (student.status === 'suspended' || student.orgId !== caller.profile.orgId) {
    fail(403, 'FORBIDDEN', 'This student account is unavailable.');
  }

  const authority = authoritySnap.exists ? authoritySnap.data() : null;
  const claimSchoolIds = Array.isArray(account?.customClaims?.schoolIds)
    ? account.customClaims.schoolIds
    : Array.isArray(authority?.schoolIds)
      ? authority.schoolIds
      : Array.isArray(student.schoolIds)
        ? student.schoolIds
        : [];
  const profileSchoolIds = Array.isArray(student.schoolIds) ? student.schoolIds : [];
  const verifiedStudentSchoolIds = claimSchoolIds.filter(id => profileSchoolIds.includes(id));

  const schoolId = verifiedStudentSchoolIds.find(id => caller.schoolIds.includes(id));
  if (!schoolId) fail(403, 'FORBIDDEN', 'This student is outside your school.');
  await schoolAccess(caller, schoolId);

  // Require staff-assigned class membership (signed custom claims or server authority),
  // preventing a student from spoofing users/{uid}.classIds via self-enrolment to cross class scope.
  const trustedStudentClassSource = Array.isArray(account?.customClaims?.classIds)
    ? account.customClaims.classIds
    : Array.isArray(authority?.classIds)
      ? authority.classIds
      : [];
  const profileClassIds = Array.isArray(student.classIds) ? student.classIds : [];
  const verifiedStudentClassIds = trustedStudentClassSource.filter(id => profileClassIds.includes(id));

  const requestedClassId = body.classId !== undefined && body.classId !== null ? requireId(body.classId) : null;
  const candidateClassIds = requestedClassId
    ? verifiedStudentClassIds.filter(id => id === requestedClassId)
    : verifiedStudentClassIds;

  const classId = candidateClassIds.find(id => caller.role === 'admin' || caller.classIds.includes(id));
  if (!classId) fail(403, 'FORBIDDEN', 'This student is outside your assigned classes.');
  const cls = await assignedClass(caller, schoolId, classId);

  const verifiedDob = authority?.dobVerified ? authority.dateOfBirth : null;
  const verifiedCohortId = (authority?.cohortVerified && authority.cohortId)
    ? authority.cohortId
    : (cls.cohortId || null);

  let cohortDoc = null;
  if (verifiedCohortId) {
    const cohortSnap = await db.collection('cohorts').doc(verifiedCohortId).get();
    if (cohortSnap.exists) cohortDoc = cohortSnap.data();
  }

  const overrideCheck = validateLayoutOverrideWrite({
    targetRole: student.role,
    layoutOverride: body.layoutOverride,
    verifiedDob,
    cohortDoc,
    cohort: authority?.cohort ?? student.cohort ?? null,
    ageBand: student.ageBand ?? null
  });
  if (!overrideCheck.ok) {
    fail(400, 'VALIDATION', overrideCheck.message);
  }

  const nowIso = new Date().toISOString();
  const nextAuthority = {
    uid,
    role: student.role,
    orgId: student.orgId,
    schoolIds: verifiedStudentSchoolIds,
    classIds: verifiedStudentClassIds,
    dobVerified: Boolean(authority?.dobVerified),
    dateOfBirth: verifiedDob,
    cohortVerified: Boolean(authority?.cohortVerified),
    cohortId: authority?.cohortVerified ? (authority.cohortId ?? null) : null,
    cohort: authority?.cohort ?? null,
    ageBand: authority?.ageBand ?? student.ageBand ?? null,
    overrideVerified: true,
    layoutOverride: overrideCheck.value,
    updatedAt: nowIso,
    updatedBy: { uid: caller.uid, role: caller.role, classId, schoolId }
  };

  await db.runTransaction(async tx => {
    const [callerNowSnap, schoolNowSnap, classNowSnap] = await Promise.all([
      tx.get(db.collection('users').doc(caller.uid)),
      tx.get(db.collection('schools').doc(schoolId)),
      tx.get(db.collection('classes').doc(classId))
    ]);
    const p = callerNowSnap.data(), s = schoolNowSnap.data(), c = classNowSnap.data();
    if (
      !p || p.role !== caller.role || p.status === 'suspended' || p.orgId !== student.orgId || !p.schoolIds?.includes(schoolId) ||
      !s || s.status === 'suspended' || s.orgId !== student.orgId ||
      !c || c.schoolId !== schoolId || c.status === 'archived' ||
      (caller.role !== 'admin' && !p.classIds?.includes(classId))
    ) {
      fail(403, 'FORBIDDEN', 'Your class access changed. Ask an administrator to check it.');
    }
    tx.set(db.collection('userLayoutAuthority').doc(uid), nextAuthority, { merge: true });
    tx.set(db.collection('users').doc(uid), {
      layoutOverride: overrideCheck.value,
      updatedAt: nowIso,
      updatedBy: { uid: caller.uid, email: caller.profile.email || null }
    }, { merge: true });
    tx.create(db.collection('schools').doc(schoolId).collection('auditEvents').doc(), {
      actorUid: caller.uid,
      action: 'LAYOUT_OVERRIDE_CHANGED',
      entityId: uid,
      classId,
      layoutOverride: overrideCheck.value,
      createdAt: nowIso
    });
  });

  await writeAuditLog(db, {
    caller: {
      uid: caller.uid,
      orgId: student.orgId,
      displayName: caller.profile.displayName || caller.profile.email || caller.uid,
      publicId: caller.profile.publicId || null
    },
    subjectUid: uid,
    action: 'LAYOUT_OVERRIDE_CHANGED',
    summary: `Set layoutOverride to ${overrideCheck.value ?? 'null'}`,
    schoolId,
    details: {
      classId,
      before: { layoutOverride: authority?.layoutOverride ?? null },
      after: { layoutOverride: overrideCheck.value }
    }
  });

  const layoutSelection = await resolveUserLayoutSelection(db, {
    uid,
    role: student.role,
    signedClaims: account?.customClaims || {
      role: student.role,
      schoolIds: verifiedStudentSchoolIds,
      classIds: verifiedStudentClassIds
    },
    userData: { ...student, layoutOverride: overrideCheck.value }
  });

  res.set('Cache-Control', 'no-store').json({
    uid,
    layoutOverride: overrideCheck.value,
    layoutSelection
  });
}));

export default router;


