/**
 * Microsoft 365 (Entra ID) sign-in, access approval and account linking for WeLearn Spark.
 *
 * Trust model:
 *  - Identity is proven by the Microsoft OpenID Connect ID token, verified here against the
 *    tenant's published signing keys (signature, issuer, tenant, audience, expiry). A Firebase
 *    ID token alone does not carry the tenant, so it is never used to prove one.
 *  - The immutable Entra object ID (`oid`) is the stored key. Email/UPN is only compared
 *    against an administrator-registered expectation, never trusted by itself.
 *  - Approval authority is bound to named Firebase UIDs (SSO_APPROVER_UIDS), not an email.
 *  - Missing configuration fails closed.
 */
import { createPublicKey, createVerify } from 'node:crypto';
import { writeAuditLog } from './audit.js';
import { sendEmail } from './email.js';

export const APPROVED_DOMAIN = 'welearn.org';
const DEFAULT_APPROVER_UIDS = ['zLdxQXTfHbfN221BNalxEn32BzZ2']; // Mani's existing admin account
const ASSIGNABLE_ROLES = ['student', 'teacher', 'coach'];
const REQUESTABLE_ROLES = ['student', 'staff'];
const CLOCK_SKEW_SECONDS = 60;

export class SsoError extends Error {
  constructor(code, message, status = 403) {
    super(message);
    this.name = 'SsoError';
    this.code = code;
    this.status = status;
  }
}

/** Read at call time so tests and deployments can change it. Missing tenant/client => unusable. */
export function getSsoConfig(env = process.env) {
  const approverUids = (env.SSO_APPROVER_UIDS ? env.SSO_APPROVER_UIDS.split(',') : DEFAULT_APPROVER_UIDS)
    .map((u) => u.trim()).filter(Boolean);
  return {
    tenantId: (env.MICROSOFT_ENTRA_TENANT_ID || '').trim(),
    clientId: (env.MICROSOFT_ENTRA_CLIENT_ID || '').trim(),
    approverUids
  };
}

export function isSsoApprover(caller, config = getSsoConfig()) {
  return Boolean(caller && caller.role === 'admin' && caller.uid && config.approverUids.includes(caller.uid));
}

function requireApprover(caller, config) {
  if (!isSsoApprover(caller, config)) {
    throw new SsoError('UNAUTHORIZED_APPROVER', 'Only a designated Spark administrator may do this.', 403);
  }
}

let jwksCache = { tenantId: null, keys: null, fetchedAt: 0 };

async function fetchTenantKeys(tenantId) {
  const fresh = jwksCache.tenantId === tenantId && jwksCache.keys && Date.now() - jwksCache.fetchedAt < 3600_000;
  if (fresh) return jwksCache.keys;
  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`);
  if (!res.ok) throw new SsoError('JWKS_UNAVAILABLE', 'Could not load Microsoft signing keys.', 503);
  const { keys } = await res.json();
  jwksCache = { tenantId, keys, fetchedAt: Date.now() };
  return keys;
}

function decodePart(part) {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

/**
 * Verify a Microsoft ID token and return the proven identity.
 * `fetchKeys` and `nowMs` are injectable for tests.
 */
export async function verifyMicrosoftIdToken(idToken, { config = getSsoConfig(), fetchKeys = fetchTenantKeys, nowMs = Date.now() } = {}) {
  if (!config.tenantId || !config.clientId) {
    throw new SsoError('SSO_NOT_CONFIGURED', 'Microsoft sign-in is not configured on the server.', 503);
  }
  const parts = typeof idToken === 'string' ? idToken.split('.') : [];
  if (parts.length !== 3) throw new SsoError('INVALID_TOKEN', 'Microsoft token is missing or malformed.', 401);

  let header; let claims;
  try { header = decodePart(parts[0]); claims = decodePart(parts[1]); } catch {
    throw new SsoError('INVALID_TOKEN', 'Microsoft token is malformed.', 401);
  }
  if (header.alg !== 'RS256' || !header.kid) throw new SsoError('INVALID_TOKEN', 'Unsupported Microsoft token.', 401);

  const keys = await fetchKeys(config.tenantId);
  const jwk = (keys || []).find((k) => k.kid === header.kid);
  if (!jwk) throw new SsoError('INVALID_TOKEN', 'Microsoft signing key not recognised.', 401);

  const signatureOk = createVerify('RSA-SHA256')
    .update(`${parts[0]}.${parts[1]}`)
    .verify(createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url'));
  if (!signatureOk) throw new SsoError('INVALID_TOKEN', 'Microsoft token signature is invalid.', 401);

  const nowSec = Math.floor(nowMs / 1000);
  if (typeof claims.exp !== 'number' || claims.exp + CLOCK_SKEW_SECONDS < nowSec) {
    throw new SsoError('TOKEN_EXPIRED', 'Microsoft token has expired. Please sign in again.', 401);
  }
  if (typeof claims.nbf === 'number' && claims.nbf - CLOCK_SKEW_SECONDS > nowSec) {
    throw new SsoError('INVALID_TOKEN', 'Microsoft token is not yet valid.', 401);
  }
  if (claims.aud !== config.clientId) throw new SsoError('INVALID_AUDIENCE', 'Token was issued for a different application.', 403);
  if (claims.tid !== config.tenantId || claims.iss !== `https://login.microsoftonline.com/${config.tenantId}/v2.0`) {
    throw new SsoError('UNAPPROVED_TENANT', 'Microsoft account does not belong to WeLearn’s approved organisational directory.', 403);
  }
  if (typeof claims.oid !== 'string' || !claims.oid) throw new SsoError('INVALID_TOKEN', 'Microsoft token has no directory identity.', 401);

  const email = String(claims.email || claims.preferred_username || claims.upn || '').trim().toLowerCase();
  if (!email.endsWith(`@${APPROVED_DOMAIN}`)) {
    throw new SsoError('INVALID_DOMAIN', `Only @${APPROVED_DOMAIN} accounts are permitted.`, 403);
  }
  return { oid: claims.oid, tid: claims.tid, email, name: claims.name || email.split('@')[0] };
}

/** Firebase-side check: the signed-in session really came from Microsoft, and agrees with the proven identity. */
export function assertSessionMatchesIdentity(callerToken, verified) {
  if (!callerToken) throw new SsoError('UNAUTHENTICATED', 'No authentication token provided.', 401);
  if (callerToken.firebase?.sign_in_provider !== 'microsoft.com') {
    throw new SsoError('INVALID_PROVIDER', 'Sign in must use WeLearn Microsoft 365 SSO.', 403);
  }
  const sessionEmail = String(callerToken.email || '').trim().toLowerCase();
  if (sessionEmail && sessionEmail !== verified.email) {
    throw new SsoError('IDENTITY_MISMATCH', 'The Microsoft identity does not match this session.', 403);
  }
}

/**
 * First-time access request. Idempotent per Firebase UID. Stores the verified `oid` so that
 * approval binds the Microsoft identity, not just an email.
 */
export async function submitOrGetAccessRequest(db, callerToken, formData = {}, verified) {
  if (!verified) throw new SsoError('MICROSOFT_TOKEN_REQUIRED', 'A verified Microsoft sign-in is required.', 400);
  assertSessionMatchesIdentity(callerToken, verified);

  const uid = callerToken.uid;
  const requestRef = db.collection('accessRequests').doc(`req_${uid}`);
  const snap = await requestRef.get();
  if (snap.exists) return { request: snap.data(), isNew: false, duplicate: true };

  // An administrator already registered this Microsoft account for an existing learner or staff
  // profile. A second Firebase account must not be created for them.
  const expected = await db.collection('msLinkExpectations').where('upn', '==', verified.email).limit(1).get();
  if (!expected.empty) {
    throw new SsoError(
      'LINK_EXPECTED_FOR_EXISTING_ACCOUNT',
      'An administrator has already registered this Microsoft account for an existing Spark profile. Sign in with your existing Spark account and link Microsoft 365 from Settings.',
      409
    );
  }

  const requestedRole = REQUESTABLE_ROLES.includes(formData.requestedRole) ? formData.requestedRole : 'student';
  const now = new Date().toISOString();
  const newRequest = {
    requestId: `req_${uid}`,
    uid,
    email: verified.email,
    entraOid: verified.oid,
    tenantId: verified.tid,
    displayName: formData.displayName || verified.name,
    givenNames: formData.givenNames || '',
    surname: formData.surname || '',
    requestedRole,
    reason: String(formData.reason || '').slice(0, 1000),
    status: 'pending',
    notificationSent: false,
    notificationError: null,
    reviewedByUid: null,
    reviewedByEmail: null,
    reviewedAt: null,
    assignedRole: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now
  };
  await requestRef.set(newRequest);

  let notificationSent = false;
  let notificationError = null;
  try {
    const result = await sendEmail({
      to: process.env.SSO_NOTIFY_EMAIL || 'mani@welearn.org',
      template: 'access-request-received',
      locale: 'en',
      data: {
        applicantEmail: verified.email,
        applicantName: newRequest.displayName,
        requestedRole,
        reason: newRequest.reason,
        reviewUrl: `https://spark.welearn.org/#/admin/access-requests/req_${uid}`
      }
    });
    notificationSent = result?.sent === true;
    if (!notificationSent) notificationError = result?.reason || 'EMAIL_NOT_CONFIGURED';
  } catch (err) {
    notificationError = err.message;
  }
  newRequest.notificationSent = notificationSent;
  newRequest.notificationError = notificationError;
  await requestRef.update({ notificationSent, notificationError, updatedAt: new Date().toISOString() });
  return { request: newRequest, isNew: true, duplicate: false };
}

/** Approve or reject a request. Approval binds the verified Microsoft identity to the profile. */
export async function reviewAccessRequest(db, adminAuth, approver, requestId, { decision, assignedRole = 'student', rejectionReason = '' }, config = getSsoConfig()) {
  requireApprover(approver, config);
  if (!['approve', 'reject'].includes(decision)) throw new SsoError('INVALID_DECISION', "Decision must be 'approve' or 'reject'.", 400);
  if (decision === 'approve' && !ASSIGNABLE_ROLES.includes(assignedRole)) {
    throw new SsoError('INVALID_ROLE', `Role must be one of: ${ASSIGNABLE_ROLES.join(', ')}.`, 400);
  }

  const requestRef = db.collection('accessRequests').doc(requestId);
  const snap = await requestRef.get();
  if (!snap.exists) throw new SsoError('NOT_FOUND', 'Access request not found.', 404);
  const reqData = snap.data();
  if (reqData.status !== 'pending') throw new SsoError('ALREADY_REVIEWED', 'This request has already been reviewed.', 409);

  const targetUid = reqData.uid;
  const now = new Date().toISOString();
  const userRef = db.collection('users').doc(targetUid);

  if (decision === 'approve') {
    const existing = await userRef.get();
    const existingData = existing.exists ? existing.data() : {};
    if (existingData.status === 'active' && existingData.role === 'admin') {
      throw new SsoError('CONFLICT', 'This account already has an administrator profile.', 409);
    }
    const updatedUser = {
      ...existingData,
      uid: targetUid,
      email: reqData.email,
      displayName: reqData.displayName || existingData.displayName || reqData.email.split('@')[0],
      role: assignedRole,
      status: 'active',
      orgId: existingData.orgId || 'org-welearn',
      schoolIds: existingData.schoolIds || [],
      classIds: existingData.classIds || [],
      microsoftIdentity: { oid: reqData.entraOid, tid: reqData.tenantId, upn: reqData.email, linkedAt: now },
      approvedAt: now,
      approvedBy: approver.email || approver.uid,
      updatedAt: now
    };
    if (!existing.exists) updatedUser.createdAt = now;
    await userRef.set(updatedUser, { merge: true });

    if (adminAuth?.setCustomUserClaims) {
      await adminAuth.setCustomUserClaims(targetUid, {
        role: assignedRole, orgId: updatedUser.orgId, schoolIds: updatedUser.schoolIds, classIds: updatedUser.classIds
      });
    }
    await requestRef.update({
      status: 'approved', assignedRole, reviewedByUid: approver.uid, reviewedByEmail: approver.email || null, reviewedAt: now, updatedAt: now
    });
    await writeAuditLog(db, {
      caller: approver, subjectUid: targetUid, action: 'ACCESS_REQUEST_APPROVED',
      summary: `Approved access for ${reqData.email} as ${assignedRole}`,
      details: { requestId, applicantEmail: reqData.email, assignedRole, entraOid: reqData.entraOid }
    });
    return { success: true, status: 'approved', assignedRole };
  }

  await userRef.set({ status: 'rejected', updatedAt: now }, { merge: true });
  await requestRef.update({
    status: 'rejected', rejectionReason: rejectionReason || 'Access request declined by platform administration.',
    reviewedByUid: approver.uid, reviewedByEmail: approver.email || null, reviewedAt: now, updatedAt: now
  });
  await writeAuditLog(db, {
    caller: approver, subjectUid: targetUid, action: 'ACCESS_REQUEST_REJECTED',
    summary: `Rejected access for ${reqData.email}`, details: { requestId, applicantEmail: reqData.email, rejectionReason: rejectionReason || 'Declined' }
  });
  return { success: true, status: 'rejected', rejectionReason };
}

/** Administrator registers the Microsoft account a specific existing profile will link to. */
export async function registerExpectedMicrosoftLink(db, caller, targetUid, upn) {
  const email = String(upn || '').trim().toLowerCase();
  if (!/^[^\s@]+@welearn\.org$/.test(email)) {
    throw new SsoError('VALIDATION', `Enter the official @${APPROVED_DOMAIN} Microsoft account.`, 400);
  }
  const userSnap = await db.collection('users').doc(targetUid).get();
  if (!userSnap.exists) throw new SsoError('NOT_FOUND', 'No such account.', 404);
  const user = userSnap.data();
  if (user.microsoftIdentity?.oid) throw new SsoError('CONFLICT', 'This account is already linked to a Microsoft identity.', 409);

  const clash = await db.collection('msLinkExpectations').where('upn', '==', email).limit(1).get();
  if (!clash.empty && clash.docs[0].id !== targetUid) {
    throw new SsoError('CONFLICT', 'That Microsoft account is already registered for a different Spark account.', 409);
  }
  const owner = await db.collection('users').where('microsoftIdentity.upn', '==', email).limit(1).get();
  if (!owner.empty && owner.docs[0].id !== targetUid) {
    throw new SsoError('CONFLICT', 'That Microsoft account is already linked to a different Spark account.', 409);
  }

  const now = new Date().toISOString();
  await db.collection('msLinkExpectations').doc(targetUid).set({
    uid: targetUid, upn: email, createdByUid: caller.uid, createdAt: now
  });
  await writeAuditLog(db, {
    caller, subjectUid: targetUid, action: 'MICROSOFT_LINK_REGISTERED',
    summary: 'Microsoft 365 account registered for linking', details: { upn: email }
  });
  return { uid: targetUid, upn: email };
}

/**
 * The signed-in user (an existing Spark account) finishes linking. Requires an administrator
 * registration for this UID, a verified Microsoft identity that matches it, a Microsoft provider
 * actually attached to the Firebase account, and an `oid` not used by any other profile.
 */
export async function completeMicrosoftLink(db, adminAuth, callerToken, verified) {
  const uid = callerToken?.uid;
  if (!uid) throw new SsoError('UNAUTHENTICATED', 'Sign-in required.', 401);

  const expectationRef = db.collection('msLinkExpectations').doc(uid);
  const expectation = await expectationRef.get();
  if (!expectation.exists) {
    throw new SsoError('LINK_NOT_REGISTERED', 'An administrator has not registered a Microsoft account for this profile.', 403);
  }
  if (expectation.data().upn !== verified.email) {
    throw new SsoError('IDENTITY_MISMATCH', 'This Microsoft account is not the one registered for this profile.', 403);
  }

  const authUser = await adminAuth.getUser(uid);
  const provider = (authUser.providerData || []).find((p) => p.providerId === 'microsoft.com');
  if (!provider) throw new SsoError('PROVIDER_NOT_LINKED', 'Microsoft 365 is not attached to this sign-in yet.', 409);
  if (provider.email && provider.email.trim().toLowerCase() !== verified.email) {
    throw new SsoError('IDENTITY_MISMATCH', 'The linked Microsoft account differs from the verified one.', 403);
  }

  const owner = await db.collection('users').where('microsoftIdentity.oid', '==', verified.oid).limit(1).get();
  if (!owner.empty && owner.docs[0].id !== uid) {
    throw new SsoError('CONFLICT', 'This Microsoft identity is already linked to a different Spark account.', 409);
  }

  const now = new Date().toISOString();
  await db.collection('users').doc(uid).set({
    microsoftIdentity: { oid: verified.oid, tid: verified.tid, upn: verified.email, linkedAt: now },
    updatedAt: now
  }, { merge: true });
  await expectationRef.delete();
  await writeAuditLog(db, {
    caller: { uid, email: callerToken.email }, subjectUid: uid, action: 'MICROSOFT_LINK_COMPLETED',
    summary: 'Microsoft 365 account linked', details: { upn: verified.email, entraOid: verified.oid }
  });
  return { uid, upn: verified.email, oid: verified.oid, linkedAt: now };
}

/**
 * Whether a Microsoft-signed session may use the platform: the profile must be approved/active
 * and carry a finalized, server-verified identity. Everything else is limited to the access-request
 * endpoints, so an unfinalized provider link or a first-time sign-in grants nothing.
 */
export function microsoftSessionAllowed(userData = {}) {
  return userData.status === 'active' && Boolean(userData.microsoftIdentity?.oid);
}

/** Gate for the data layer. Rejects pending, rejected or unapproved users. */
export function assertAccessAllowed(caller, callerUserData = {}) {
  const status = callerUserData.status || caller?.status;
  if (status === 'pending') throw new SsoError('ACCESS_PENDING', 'Access pending: your account is awaiting administrator approval.', 403);
  if (status === 'rejected') throw new SsoError('ACCESS_REJECTED', 'Access denied: your registration was rejected.', 403);
  if (status !== 'active') throw new SsoError('ACCESS_UNAPPROVED', 'Access requires an active, approved account.', 403);
  return true;
}
