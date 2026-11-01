/**
 * Secure Server Endpoint & Cloud Function logic for Learner Creation.
 * Restricted to coaches and admins.
 * Generates one-time random credentials, sets role:'learner', and updates classes.learnerIds.
 * Conforms to docs/data-contract.md.
 */

import crypto from 'crypto';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { sendError } from '../lib/errors.js';
import { writeAuditLog } from '../lib/audit.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function generateSecurePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(12);
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars[bytes[i] % chars.length];
  }
  return pass + '1A!';
}

/**
 * Core business logic for creating a learner account safely.
 * Can be called by Express route or Firebase Callable Cloud Function.
 */
export async function createLearnerAccount({ email, displayName, classId, caller, generatePassword = true, password = null }) {
  const db = getFirestore();
  const auth = getAuth();

  const callerRole = caller?.role;
  const callerUid = caller?.uid;
  const isAllowed = callerRole === 'admin' || callerRole === 'teacher' || callerRole === 'coach';

  if (!isAllowed) {
    throw { status: 403, code: 'FORBIDDEN', message: 'Only coaches and admins may register new learners.' };
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    throw { status: 400, code: 'VALIDATION', message: 'Enter a valid email address.', field: 'email' };
  }

  const cleanName = String(displayName || '').trim();
  if (!cleanName) {
    throw { status: 400, code: 'VALIDATION', message: 'Name is required.', field: 'displayName' };
  }

  const cleanClassId = String(classId || '').trim();
  if (!cleanClassId) {
    throw { status: 400, code: 'VALIDATION', message: 'Class assignment by classId is required.', field: 'classId' };
  }

  // Verify class exists
  const classDocRef = db.collection('classes').doc(cleanClassId);
  const classSnap = await classDocRef.get();
  if (!classSnap.exists) {
    throw { status: 404, code: 'NOT_FOUND', message: `Class "${cleanClassId}" does not exist.`, field: 'classId' };
  }

  const classData = classSnap.data() || {};

  // If coach, verify tenancy boundary: coach must be assigned to this class
  if (callerRole === 'teacher' || callerRole === 'coach') {
    const coachClassIds = Array.isArray(caller?.classIds) ? caller.classIds : [];
    const isCoachOfClass = coachClassIds.includes(cleanClassId) || (Array.isArray(classData.coachIds) && classData.coachIds.includes(callerUid));
    if (!isCoachOfClass) {
      throw { status: 403, code: 'FORBIDDEN', message: 'You are not assigned to this class.' };
    }
  }

  // Generate secure random temporary password if not provided
  const temporaryPassword = password || generateSecurePassword();

  // Create Firebase Auth user
  let authUser;
  try {
    authUser = await auth.createUser({
      email: cleanEmail,
      displayName: cleanName,
      password: temporaryPassword,
      emailVerified: false
    });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw { status: 409, code: 'CONFLICT', message: 'An account with this email already exists.', field: 'email' };
    }
    throw { status: 500, code: 'INTERNAL', message: err.message || 'Could not create auth user.' };
  }

  const newUid = authUser.uid;
  const now = Date.now();

  // Set Auth Custom Claims
  await auth.setCustomUserClaims(newUid, {
    role: 'learner',
    classIds: [cleanClassId]
  });

  // Prepare Firestore writes
  const batch = db.batch();

  // 1. users/{uid} document strictly matching contract
  const userRef = db.collection('users').doc(newUid);
  batch.set(userRef, {
    uid: newUid,
    displayName: cleanName,
    email: cleanEmail,
    role: 'learner',
    classIds: [cleanClassId],
    createdAt: now,
    status: 'active'
  });

  // 2. Add to classes/{classId}.learnerIds
  batch.update(classDocRef, {
    learnerIds: FieldValue.arrayUnion(newUid),
    updatedAt: FieldValue.serverTimestamp()
  });

  await batch.commit();

  // Audit log
  try {
    await writeAuditLog(db, {
      orgId: classData.orgId || 'org-welearn',
      schoolId: classData.schoolId || 'sch-bkk',
      subjectUid: newUid,
      action: 'LEARNER_REGISTERED',
      actorUid: callerUid,
      actorName: caller?.displayName || 'Coach',
      summary: `Registered learner ${cleanName} (${cleanEmail}) in class ${classData.name || cleanClassId}`,
      details: { classId: cleanClassId, email: cleanEmail }
    });
  } catch {
    // Non-fatal
  }

  return {
    uid: newUid,
    displayName: cleanName,
    email: cleanEmail,
    role: 'learner',
    classId: cleanClassId,
    temporaryPassword
  };
}

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const result = await createLearnerAccount({
      email: req.body?.email,
      displayName: req.body?.displayName || req.body?.name,
      classId: req.body?.classId,
      caller: req.caller,
      password: req.body?.password
    });
    res.status(201).json(result);
  } catch (err) {
    sendError(res, err.status || 500, err.code || 'INTERNAL', err.message, err.field);
  }
});

export default router;
