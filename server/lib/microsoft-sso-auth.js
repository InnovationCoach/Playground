/**
 * Microsoft 365 Entra ID SSO & Access Approval Workflow for WeLearn Spark.
 *
 * Implements:
 * 1. Server-side validation of Microsoft Entra ID tenant & exact @welearn.org domain.
 * 2. First-time access request handling, idempotency, and status retrieval.
 * 3. Authority binding for approvals strictly to Mani (mani@welearn.org) with admin role.
 * 4. Audit logging and resilient email notification handling.
 * 5. Safe account linking validation ensuring UID and claims preservation.
 */

import { writeAuditLog } from './audit.js';
import { sendEmail } from './email.js';

export const APPROVED_ENTRA_TENANT_ID = process.env.MICROSOFT_ENTRA_TENANT_ID || 'welearn-prod-tenant-id';
export const APPROVED_DOMAIN = 'welearn.org';
export const MANI_ADMIN_EMAIL = 'mani@welearn.org';

/**
 * Validate that an authenticated token originated from Microsoft 365,
 * belongs to the approved Entra tenant, and carries an exact @welearn.org email.
 */
export function validateMicrosoftIdentity(decodedToken, expectedTenantId = APPROVED_ENTRA_TENANT_ID) {
  if (!decodedToken) {
    return { valid: false, code: 'UNAUTHENTICATED', message: 'No authentication token provided.' };
  }

  // Verify provider is microsoft.com
  const provider = decodedToken.firebase?.sign_in_provider;
  if (provider && provider !== 'microsoft.com') {
    return {
      valid: false,
      code: 'INVALID_PROVIDER',
      message: 'Sign in must use WeLearn Microsoft 365 SSO.'
    };
  }

  // Verify email domain is exactly @welearn.org
  const email = (decodedToken.email || '').trim().toLowerCase();
  if (!email || !email.endsWith(`@${APPROVED_DOMAIN}`)) {
    return {
      valid: false,
      code: 'INVALID_DOMAIN',
      message: `Only verified @${APPROVED_DOMAIN} accounts are permitted.`
    };
  }

  // Verify Entra Tenant ID (can be in claims tid, tenant, or firebase tenant)
  const tenantId = decodedToken.tid || decodedToken.tenantId || decodedToken.tenant || decodedToken.firebase?.tenant;
  if (expectedTenantId && tenantId && tenantId !== expectedTenantId) {
    return {
      valid: false,
      code: 'UNAPPROVED_TENANT',
      message: 'Microsoft account does not belong to WeLearn’s approved organizational directory.'
    };
  }

  return { valid: true, email, uid: decodedToken.uid, tenantId: tenantId || expectedTenantId };
}

/**
 * Submit or retrieve a first-time access request.
 * Idempotent: repeated sign-ins or submissions return the existing request without duplicating.
 */
export async function submitOrGetAccessRequest(db, callerToken, formData = {}) {
  const validation = validateMicrosoftIdentity(callerToken);
  if (!validation.valid) {
    const err = new Error(validation.message);
    err.code = validation.code;
    err.status = 403;
    throw err;
  }

  const uid = callerToken.uid;
  const email = validation.email;
  const requestRef = db.collection('accessRequests').doc(`req_${uid}`);
  const snap = await requestRef.get();

  if (snap.exists) {
    // Existing request found - return it idempotently
    return { request: snap.data(), isNew: false, duplicate: true };
  }

  // Create new request
  const newRequest = {
    requestId: `req_${uid}`,
    uid,
    email,
    tenantId: validation.tenantId,
    displayName: formData.displayName || callerToken.name || email.split('@')[0],
    givenNames: formData.givenNames || '',
    surname: formData.surname || '',
    requestedRole: formData.requestedRole || 'student', // 'staff' | 'student'
    reason: formData.reason || '',
    status: 'pending', // 'pending' | 'approved' | 'rejected'
    notificationSent: false,
    notificationError: null,
    reviewedByUid: null,
    reviewedByEmail: null,
    reviewedAt: null,
    assignedRole: null,
    rejectionReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save the request first to guarantee it is safely recorded in the queue
  await requestRef.set(newRequest);

  // Attempt to notify Mani by email
  let notificationSent = false;
  let notificationError = null;
  try {
    const emailResult = await sendEmail({
      to: MANI_ADMIN_EMAIL,
      template: 'access-request-received',
      locale: 'en',
      data: {
        applicantEmail: email,
        applicantName: newRequest.displayName,
        requestedRole: newRequest.requestedRole,
        reason: newRequest.reason,
        reviewUrl: `https://spark.welearn.org/admin/access-requests/req_${uid}`
      }
    });
    notificationSent = emailResult?.sent === true;
    if (!notificationSent) {
      notificationError = emailResult?.reason || 'EMAIL_NOT_CONFIGURED';
    }
  } catch (mailErr) {
    notificationSent = false;
    notificationError = mailErr.message;
  }

  // Update notification state on the record
  newRequest.notificationSent = notificationSent;
  newRequest.notificationError = notificationError;
  await requestRef.update({
    notificationSent,
    notificationError,
    updatedAt: new Date().toISOString()
  });

  return { request: newRequest, isNew: true, duplicate: false };
}

/**
 * Review an access request (Approve or Reject).
 * Binds approval authority strictly to Mani (mani@welearn.org) with admin role.
 */
export async function reviewAccessRequest(db, adminAuth, approver, requestId, { decision, assignedRole = 'student', rejectionReason = '' }) {
  if (!approver || approver.email?.toLowerCase() !== MANI_ADMIN_EMAIL || approver.role !== 'admin') {
    const err = new Error('Unauthorized approval authority. Only Mani (Platform Lead, Platform Admin) may review access requests.');
    err.code = 'UNAUTHORIZED_APPROVER';
    err.status = 403;
    throw err;
  }

  if (!['approve', 'reject'].includes(decision)) {
    const err = new Error("Decision must be either 'approve' or 'reject'.");
    err.code = 'INVALID_DECISION';
    err.status = 400;
    throw err;
  }

  const requestRef = db.collection('accessRequests').doc(requestId);
  const snap = await requestRef.get();
  if (!snap.exists) {
    const err = new Error('Access request not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const reqData = snap.data();
  const targetUid = reqData.uid;
  const now = new Date().toISOString();

  if (decision === 'approve') {
    // 1. Assign role and initialize/update Firestore users profile
    const userRef = db.collection('users').doc(targetUid);
    const existingUserSnap = await userRef.get();
    const existingUserData = existingUserSnap.exists ? existingUserSnap.data() : {};

    const updatedUser = {
      ...existingUserData,
      uid: targetUid,
      email: reqData.email,
      displayName: reqData.displayName || existingUserData.displayName || reqData.email.split('@')[0],
      role: assignedRole,
      status: 'active',
      orgId: existingUserData.orgId || 'org-welearn',
      schoolIds: existingUserData.schoolIds || ['sch-welearn-main'],
      classIds: existingUserData.classIds || [],
      approvedAt: now,
      approvedBy: approver.email,
      updatedAt: now
    };

    if (!existingUserSnap.exists) {
      updatedUser.createdAt = now;
    }

    await userRef.set(updatedUser, { merge: true });

    // 2. Set Custom Claims via Admin SDK if adminAuth is provided
    if (adminAuth?.setCustomUserClaims) {
      await adminAuth.setCustomUserClaims(targetUid, {
        role: assignedRole,
        orgId: updatedUser.orgId,
        schoolIds: updatedUser.schoolIds,
        classIds: updatedUser.classIds
      });
    }

    // 3. Update request record
    await requestRef.update({
      status: 'approved',
      assignedRole,
      reviewedByUid: approver.uid,
      reviewedByEmail: approver.email,
      reviewedAt: now,
      updatedAt: now
    });

    // 4. Record audit log
    await writeAuditLog(db, {
      caller: approver,
      subjectUid: targetUid,
      action: 'ACCESS_REQUEST_APPROVED',
      summary: `Approved access for ${reqData.email} as ${assignedRole}`,
      details: {
        requestId,
        applicantEmail: reqData.email,
        assignedRole,
        reviewedBy: approver.email
      }
    });

    return { success: true, status: 'approved', assignedRole };
  } else {
    // Decision is reject
    const userRef = db.collection('users').doc(targetUid);
    await userRef.set({ status: 'rejected', updatedAt: now }, { merge: true });

    await requestRef.update({
      status: 'rejected',
      rejectionReason: rejectionReason || 'Access request declined by platform administration.',
      reviewedByUid: approver.uid,
      reviewedByEmail: approver.email,
      reviewedAt: now,
      updatedAt: now
    });

    await writeAuditLog(db, {
      caller: approver,
      subjectUid: targetUid,
      action: 'ACCESS_REQUEST_REJECTED',
      summary: `Rejected access for ${reqData.email}`,
      details: {
        requestId,
        applicantEmail: reqData.email,
        rejectionReason: rejectionReason || 'Declined',
        reviewedBy: approver.email
      }
    });

    return { success: true, status: 'rejected', rejectionReason };
  }
}

/**
 * Gate check for data layer and API protection.
 * Asserts whether a caller is allowed to access school classes, student records, and Edmentum.
 * Rejects pending, rejected, or unapproved users.
 */
export function assertAccessAllowed(caller, callerUserData = {}) {
  const status = callerUserData.status || caller?.status;
  if (status === 'pending') {
    const err = new Error('Access pending: your account is awaiting administrator approval.');
    err.code = 'ACCESS_PENDING';
    err.status = 403;
    throw err;
  }

  if (status === 'rejected') {
    const err = new Error('Access denied: your registration was rejected.');
    err.code = 'ACCESS_REJECTED';
    err.status = 403;
    throw err;
  }

  if (status !== 'active') {
    const err = new Error('Access requires an active, approved account.');
    err.code = 'ACCESS_UNAPPROVED';
    err.status = 403;
    throw err;
  }

  return true;
}

/**
 * Verifies that an existing user linking Microsoft credentials retains their Firebase UID,
 * custom claims, and existing profile associations.
 */
export function verifyAccountLinking(existingProfile, existingClaims, linkedAuthUser) {
  if (existingProfile.uid !== linkedAuthUser.uid) {
    return {
      valid: false,
      error: 'UID mismatch: account linking failed to preserve original Firebase UID.'
    };
  }

  // Verify email matches
  if (existingProfile.email?.toLowerCase() !== linkedAuthUser.email?.toLowerCase()) {
    return {
      valid: false,
      error: 'Email mismatch between existing profile and linked provider.'
    };
  }

  // Ensure claims were preserved
  const rolePreserved = existingClaims?.role === existingProfile.role;
  const classesPreserved = JSON.stringify(existingClaims?.classIds || []) === JSON.stringify(existingProfile.classIds || []);

  if (!rolePreserved || !classesPreserved) {
    return {
      valid: false,
      error: 'Claim degradation: existing roles or classIds were not preserved.'
    };
  }

  return {
    valid: true,
    uid: existingProfile.uid,
    email: existingProfile.email,
    role: existingProfile.role,
    classIds: existingProfile.classIds
  };
}
