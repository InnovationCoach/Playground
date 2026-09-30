import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { paginateArray } from '../lib/pagination.js';
import { generateUniquePublicId } from '../lib/publicId.js';
import { writeAuditLog } from '../lib/audit.js';
import { isEmailConfigured, sendEmail } from '../lib/email.js';

const router = Router();

const ROLES = ['admin', 'supervisor', 'teacher', 'student', 'parent'];
const STATUSES = ['pending', 'active', 'suspended'];
const GENDERS = ['female', 'male', 'nonbinary', 'prefer_not_to_say'];
const AGE_BANDS = ['primary', '13-15', '16-18'];
const EDITABLE = ['salutation', 'givenNames', 'surname', 'phone', 'gender', 'cohortId', 'ageBand', 'yearLevel', 'dateOfBirth', 'programmeIds', 'locale'];
const SORTABLE = ['surname', 'givenNames', 'createdAt', 'status', 'publicId', 'email', 'role'];

const E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireAdmin(req, res, next) {
  if (req.caller.role !== 'admin') {
    return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to do that.');
  }
  next();
}

function requireConsoleAccess(req, res, next) {
  if (!['admin', 'supervisor'].includes(req.caller.role)) {
    return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to do that.');
  }
  next();
}

async function buildLinkSummaries(db, user) {
  const linksSnap = await db.collection('parentLinks')
    .where('status', '==', 'active')
    .where(user.role === 'parent' ? 'parentUid' : 'studentUid', '==', user.uid)
    .get();

  const summaries = [];
  for (const docSnap of linksSnap.docs) {
    const link = docSnap.data();
    const otherUid = user.role === 'parent' ? link.studentUid : link.parentUid;
    const otherSnap = await db.collection('users').doc(otherUid).get();
    if (otherSnap.exists) {
      const other = otherSnap.data();
      summaries.push({
        linkId: link.linkId || docSnap.id,
        uid: other.uid,
        displayName: other.displayName || `${other.givenNames || ''} ${other.surname || ''}`.trim(),
        publicId: other.publicId || null,
        createdAt: link.createdAt
      });
    }
  }
  return summaries;
}

async function buildFullRecord(db, user, callerRole) {
  const authUser = await getAuth().getUser(user.uid).catch(() => null);
  const links = await buildLinkSummaries(db, user);

  const record = {
    uid: user.uid,
    publicId: user.publicId || null,
    role: user.role,
    status: user.status,
    givenNames: user.givenNames || '',
    surname: user.surname || '',
    displayName: user.displayName || `${user.givenNames || ''} ${user.surname || ''}`.trim(),
    salutation: user.salutation || null,
    email: user.email,
    phone: user.phone || null,
    gender: user.gender || null,
    orgId: user.orgId || 'org-welearn',
    schoolIds: user.schoolIds || [],
    classIds: user.classIds || [],
    programmeIds: user.programmeIds || [],
    locale: user.locale || 'en',
    createdAt: user.createdAt || null,
    createdBy: user.createdBy || null,
    updatedAt: user.updatedAt || null,
    updatedBy: user.updatedBy || null,
    auth: {
      lastSignInAt: authUser?.metadata?.lastSignInTime || null,
      createdAt: authUser?.metadata?.creationTime || user.createdAt || null,
      disabled: authUser ? authUser.disabled : (user.status === 'suspended')
    },
    counts: {
      classes: (user.classIds || []).length,
      ...(user.role === 'parent' ? { children: links.length } : {}),
      ...(user.role === 'student' ? { parents: links.length } : {})
    },
    links
  };

  if (user.role === 'student') {
    Object.assign(record, {
      cohortId: user.cohortId || null,
      ageBand: user.ageBand || null,
      yearLevel: user.yearLevel || null,
      consent: user.consent || null
    });
  }

  if (callerRole === 'admin') {
    record.dateOfBirth = user.dateOfBirth || null;
  }

  return record;
}

function formatListItem(u, activeLinkCountMap) {
  const item = {
    uid: u.uid,
    publicId: u.publicId || null,
    role: u.role,
    status: u.status,
    givenNames: u.givenNames || (u.displayName ? u.displayName.split(' ')[0] : ''),
    surname: u.surname || (u.displayName ? u.displayName.split(' ').slice(1).join(' ') : ''),
    displayName: u.displayName || `${u.givenNames || ''} ${u.surname || ''}`.trim(),
    email: u.email,
    schoolIds: u.schoolIds || [],
    classIds: u.classIds || [],
    createdAt: u.createdAt || null
  };

  if (u.role === 'student') {
    Object.assign(item, {
      cohortId: u.cohortId || null,
      yearLevel: u.yearLevel || null,
      ageBand: u.ageBand || null
    });
  }

  if (u.role === 'parent') {
    item.childCount = activeLinkCountMap[u.uid] || 0;
  }

  return item;
}

// GET /api/admin/users
router.get('/', requireClaims, requireConsoleAccess, async (req, res) => {
  const db = getFirestore();
  const orgId = req.caller.orgId || 'org-welearn';

  const snap = await db.collection('users').where('orgId', '==', orgId).get();
  let rows = snap.docs.map((d) => d.data());

  // Role filter (supports comma-separated list like 'admin,supervisor,teacher')
  if (req.query.role) {
    const rolesList = String(req.query.role).split(',').filter((r) => ROLES.includes(r));
    if (rolesList.length > 0) {
      rows = rows.filter((u) => rolesList.includes(u.role));
    }
  }

  if (req.query.status && STATUSES.includes(req.query.status)) {
    rows = rows.filter((u) => u.status === req.query.status);
  }

  if (req.query.schoolId) {
    rows = rows.filter((u) => u.schoolIds?.includes(req.query.schoolId));
  }

  if (req.query.classId) {
    rows = rows.filter((u) => u.classIds?.includes(req.query.classId));
  }

  if (req.query.cohortId) {
    rows = rows.filter((u) => u.cohortId === req.query.cohortId);
  }

  // Supervisor scoping check
  if (req.caller.role === 'supervisor') {
    rows = rows.filter((u) => u.schoolIds?.some((s) => req.caller.schoolIds?.includes(s)));
  }

  // q search (case-insensitive prefix match on givenNames, surname, displayName, email, publicId)
  if (req.query.q) {
    const qStr = String(req.query.q).trim().toLowerCase();
    const qId = qStr.replace(/[^a-z0-9]/g, '');

    rows = rows.filter((u) => {
      const g = (u.givenNames || '').toLowerCase();
      const s = (u.surname || '').toLowerCase();
      const d = (u.displayName || `${g} ${s}`).toLowerCase();
      const e = (u.email || '').toLowerCase();
      const p = (u.publicId || '').replace(/-/g, '').toLowerCase();

      return g.startsWith(qStr) || s.startsWith(qStr) || d.startsWith(qStr) || e.startsWith(qStr) || (qId && p.startsWith(qId));
    });
  }

  // Sort handling
  const sortParam = String(req.query.sort || 'surname');
  const desc = sortParam.startsWith('-');
  const field = SORTABLE.includes(sortParam.replace(/^-/, '')) ? sortParam.replace(/^-/, '') : 'surname';

  rows.sort((a, b) => {
    const av = String(a[field] ?? '');
    const bv = String(b[field] ?? '');
    const c = av.localeCompare(bv) || (a.givenNames || '').localeCompare(b.givenNames || '') || a.uid.localeCompare(b.uid);
    return desc ? -c : c;
  });

  // Calculate active parentLink counts for parent items
  const parentLinksSnap = await db.collection('parentLinks').where('status', '==', 'active').get();
  const activeLinkCountMap = {};
  parentLinksSnap.docs.forEach((docSnap) => {
    const pUid = docSnap.data().parentUid;
    activeLinkCountMap[pUid] = (activeLinkCountMap[pUid] || 0) + 1;
  });

  const page = paginateArray(rows, req.query.pageToken, req.query.pageSize);
  const items = page.items.map((u) => formatListItem(u, activeLinkCountMap));

  return res.json({
    items,
    nextPageToken: page.nextPageToken,
    total: page.total
  });
});

// POST /api/admin/users
router.post('/', requireClaims, requireAdmin, async (req, res) => {
  const body = req.body || {};
  const db = getFirestore();

  if (!ROLES.includes(body.role)) {
    return sendError(res, 400, 'VALIDATION', 'Choose a role.', 'role');
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return sendError(res, 400, 'VALIDATION', 'Enter a valid email address.', 'email');
  }

  const givenNames = String(body.givenNames || '').trim();
  if (!givenNames) return sendError(res, 400, 'VALIDATION', 'This field is required.', 'givenNames');
  if (givenNames.length > 80) return sendError(res, 400, 'VALIDATION', 'Keep this under 80 characters.', 'givenNames');

  const surname = String(body.surname || '').trim();
  if (!surname) return sendError(res, 400, 'VALIDATION', 'This field is required.', 'surname');
  if (surname.length > 80) return sendError(res, 400, 'VALIDATION', 'Keep this under 80 characters.', 'surname');

  if (body.phone && !E164.test(body.phone)) {
    return sendError(res, 400, 'VALIDATION', 'Use international format: + then 8–15 digits.', 'phone');
  }

  if (body.gender && !GENDERS.includes(body.gender)) {
    return sendError(res, 400, 'VALIDATION', 'Unknown gender value.', 'gender');
  }

  if (!Array.isArray(body.schoolIds) || !body.schoolIds.length) {
    return sendError(res, 400, 'VALIDATION', 'Choose a school.', 'schoolIds');
  }

  if (body.role === 'student') {
    if (!body.cohortId) return sendError(res, 400, 'VALIDATION', 'Choose a cohort.', 'cohortId');
    const cohortSnap = await db.collection('cohorts').doc(body.cohortId).get();
    if (!cohortSnap.exists) return sendError(res, 400, 'VALIDATION', 'Choose a cohort.', 'cohortId');

    if (!body.ageBand || !AGE_BANDS.includes(body.ageBand)) {
      return sendError(res, 400, 'VALIDATION', 'Choose an age band.', 'ageBand');
    }
  }

  // Check email conflict
  try {
    await getAuth().getUserByEmail(email);
    return sendError(res, 409, 'CONFLICT', 'That email is already in use.', 'email');
  } catch {
    // Email is free
  }

  const existingDbUser = await db.collection('users').where('email', '==', email).limit(1).get();
  if (!existingDbUser.empty) {
    return sendError(res, 409, 'CONFLICT', 'That email is already in use.', 'email');
  }

  const displayName = `${givenNames} ${surname}`;
  let authUser;
  try {
    authUser = await getAuth().createUser({
      email,
      displayName,
      emailVerified: false
    });
  } catch (err) {
    return sendError(res, 500, 'INTERNAL', err.message);
  }

  const uid = authUser.uid;
  const createdAt = new Date().toISOString();
  const orgId = req.caller.orgId || 'org-welearn';
  const publicId = await generateUniquePublicId(db);

  // Set claims
  const claims = {
    role: body.role,
    orgId,
    schoolIds: body.schoolIds,
    classIds: body.classIds || []
  };
  await getAuth().setCustomUserClaims(uid, claims);

  const isPrimary = body.role === 'student' && body.ageBand === 'primary';
  const userDoc = {
    uid,
    publicId,
    role: body.role,
    status: 'pending',
    givenNames,
    surname,
    displayName,
    salutation: body.salutation || null,
    email,
    phone: body.phone || null,
    gender: body.gender || null,
    orgId,
    schoolIds: body.schoolIds,
    classIds: body.classIds || [],
    programmeIds: body.programmeIds || [],
    locale: 'en',
    createdAt,
    createdBy: { uid: req.caller.uid, name: req.caller.displayName },
    updatedAt: null,
    updatedBy: null
  };

  if (body.role === 'student') {
    Object.assign(userDoc, {
      cohortId: body.cohortId,
      ageBand: body.ageBand,
      yearLevel: body.yearLevel || null,
      dateOfBirth: body.dateOfBirth || null,
      consent: isPrimary ? { status: 'required' } : null
    });
  }

  try {
    const batch = db.batch();
    batch.set(db.collection('users').doc(uid), userDoc);
    batch.set(db.collection('publicIds').doc(publicId), { uid, createdAt });
    await batch.commit();

    await writeAuditLog(db, {
      caller: req.caller,
      subjectUid: uid,
      action: 'ACCOUNT_CREATED',
      summary: `Account created as ${body.role}`
    });
  } catch (err) {
    // Rollback auth user creation if DB write fails
    await getAuth().deleteUser(uid).catch(() => {});
    return sendError(res, 500, 'INTERNAL', 'Failed to save user document.');
  }

  const fullRecord = await buildFullRecord(db, userDoc, req.caller.role);
  const emailSent = isEmailConfigured();
  if (emailSent) {
    await sendEmail({ to: email, template: 'activation', locale: 'en', data: { uid, email } });
  }

  return res.status(201).json({
    ...fullRecord,
    activation: {
      sent: emailSent,
      reason: emailSent ? null : 'EMAIL_NOT_CONFIGURED'
    }
  });
});

// GET /api/admin/users/:uid
router.get('/:uid', requireClaims, requireConsoleAccess, async (req, res) => {
  const db = getFirestore();
  const userSnap = await db.collection('users').doc(req.params.uid).get();

  if (!userSnap.exists) {
    return sendError(res, 404, 'NOT_FOUND', 'No such account.');
  }

  const user = userSnap.data();

  // Supervisor scoping
  if (req.caller.role === 'supervisor') {
    const hasOverlap = user.schoolIds?.some((s) => req.caller.schoolIds?.includes(s));
    if (!hasOverlap) {
      return sendError(res, 404, 'NOT_FOUND', 'No such account.');
    }
  }

  const record = await buildFullRecord(db, user, req.caller.role);
  return res.json(record);
});

// PATCH /api/admin/users/:uid
router.patch('/:uid', requireClaims, requireAdmin, async (req, res) => {
  const db = getFirestore();
  const userRef = db.collection('users').doc(req.params.uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return sendError(res, 404, 'NOT_FOUND', 'No such account.');
  }

  const user = userSnap.data();
  const body = req.body || {};

  const forbidden = Object.keys(body).find((k) => !EDITABLE.includes(k));
  if (forbidden) {
    return sendError(res, 400, 'VALIDATION', `${forbidden} cannot be changed here.`, forbidden);
  }

  // Validate fields
  if ('givenNames' in body) {
    const v = String(body.givenNames || '').trim();
    if (!v) return sendError(res, 400, 'VALIDATION', 'This field is required.', 'givenNames');
    if (v.length > 80) return sendError(res, 400, 'VALIDATION', 'Keep this under 80 characters.', 'givenNames');
  }

  if ('surname' in body) {
    const v = String(body.surname || '').trim();
    if (!v) return sendError(res, 400, 'VALIDATION', 'This field is required.', 'surname');
    if (v.length > 80) return sendError(res, 400, 'VALIDATION', 'Keep this under 80 characters.', 'surname');
  }

  if (body.phone && !E164.test(body.phone)) {
    return sendError(res, 400, 'VALIDATION', 'Use international format: + then 8–15 digits.', 'phone');
  }

  if (body.gender && !GENDERS.includes(body.gender)) {
    return sendError(res, 400, 'VALIDATION', 'Unknown gender value.', 'gender');
  }

  if (user.role === 'student') {
    if ('cohortId' in body && !body.cohortId) return sendError(res, 400, 'VALIDATION', 'Choose a cohort.', 'cohortId');
    if ('ageBand' in body && !AGE_BANDS.includes(body.ageBand)) return sendError(res, 400, 'VALIDATION', 'Choose an age band.', 'ageBand');
  }

  const before = {};
  const after = {};
  const updates = {};

  Object.entries(body).forEach(([k, v]) => {
    const nextVal = typeof v === 'string' ? (v.trim() || null) : v;
    if (JSON.stringify(user[k] ?? null) !== JSON.stringify(nextVal ?? null)) {
      before[k] = user[k] ?? null;
      after[k] = nextVal;
      updates[k] = nextVal;
    }
  });

  if (!Object.keys(after).length) {
    const record = await buildFullRecord(db, user, req.caller.role);
    return res.json(record);
  }

  const givenNames = updates.givenNames || user.givenNames;
  const surname = updates.surname || user.surname;
  updates.displayName = `${givenNames} ${surname}`;
  updates.updatedAt = new Date().toISOString();
  updates.updatedBy = { uid: req.caller.uid, name: req.caller.displayName };

  await userRef.update(updates);

  // Write audit
  if (after.programmeIds) {
    await writeAuditLog(db, {
      caller: req.caller,
      subjectUid: user.uid,
      action: 'PROGRAMMES_CHANGED',
      summary: 'Programme enrolments changed',
      details: { before: { programmeIds: before.programmeIds }, after: { programmeIds: after.programmeIds } }
    });
    delete after.programmeIds;
    delete before.programmeIds;
  }

  if (Object.keys(after).length > 0) {
    await writeAuditLog(db, {
      caller: req.caller,
      subjectUid: user.uid,
      action: 'DETAILS_CHANGED',
      summary: `Changed ${Object.keys(after).join(', ')}`,
      details: { before, after }
    });
  }

  const updatedSnap = await userRef.get();
  const record = await buildFullRecord(db, updatedSnap.data(), req.caller.role);
  return res.json(record);
});

// PUT /api/admin/users/:uid/role
router.put('/:uid/role', requireClaims, requireAdmin, async (req, res) => {
  const db = getFirestore();
  const userRef = db.collection('users').doc(req.params.uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return sendError(res, 404, 'NOT_FOUND', 'No such account.');
  }

  const user = userSnap.data();
  const newRole = req.body?.role;

  if (!ROLES.includes(newRole)) {
    return sendError(res, 400, 'VALIDATION', 'Choose a role.', 'role');
  }

  if (user.uid === req.caller.uid) {
    return sendError(res, 403, 'FORBIDDEN', 'You cannot change your own role.');
  }

  if (user.role === 'admin' && newRole !== 'admin') {
    const adminsSnap = await db.collection('users').where('orgId', '==', user.orgId).where('role', '==', 'admin').get();
    if (adminsSnap.size <= 1) {
      return sendError(res, 409, 'CONFLICT', 'The last administrator cannot be removed.');
    }
  }

  if (user.role === newRole) {
    const record = await buildFullRecord(db, user, req.caller.role);
    return res.json(record);
  }

  const beforeRole = user.role;
  const nowStr = new Date().toISOString();

  // Update claims & revoke refresh tokens
  await getAuth().setCustomUserClaims(user.uid, {
    role: newRole,
    orgId: user.orgId || 'org-welearn',
    schoolIds: user.schoolIds || [],
    classIds: user.classIds || []
  });
  await getAuth().revokeRefreshTokens(user.uid);

  await userRef.update({
    role: newRole,
    updatedAt: nowStr,
    updatedBy: { uid: req.caller.uid, name: req.caller.displayName }
  });

  await writeAuditLog(db, {
    caller: req.caller,
    subjectUid: user.uid,
    action: 'ROLE_CHANGED',
    summary: `Role changed from ${beforeRole} to ${newRole}`,
    details: { before: { role: beforeRole }, after: { role: newRole } }
  });

  const updatedSnap = await userRef.get();
  const record = await buildFullRecord(db, updatedSnap.data(), req.caller.role);
  return res.json(record);
});

// PUT /api/admin/users/:uid/assignments
router.put('/:uid/assignments', requireClaims, requireAdmin, async (req, res) => {
  const db = getFirestore();
  const userRef = db.collection('users').doc(req.params.uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return sendError(res, 404, 'NOT_FOUND', 'No such account.');
  }

  const user = userSnap.data();
  const before = { schoolIds: user.schoolIds || [], classIds: user.classIds || [] };
  const updates = {};

  if (Array.isArray(req.body?.schoolIds)) updates.schoolIds = req.body.schoolIds;
  if (Array.isArray(req.body?.classIds)) updates.classIds = req.body.classIds;

  updates.updatedAt = new Date().toISOString();
  updates.updatedBy = { uid: req.caller.uid, name: req.caller.displayName };

  const after = { schoolIds: updates.schoolIds || before.schoolIds, classIds: updates.classIds || before.classIds };

  await getAuth().setCustomUserClaims(user.uid, {
    role: user.role,
    orgId: user.orgId || 'org-welearn',
    schoolIds: after.schoolIds,
    classIds: after.classIds
  });
  await getAuth().revokeRefreshTokens(user.uid);

  await userRef.update(updates);

  await writeAuditLog(db, {
    caller: req.caller,
    subjectUid: user.uid,
    action: 'CLASSES_CHANGED',
    summary: 'Schools and classes changed',
    details: { before, after }
  });

  const updatedSnap = await userRef.get();
  const record = await buildFullRecord(db, updatedSnap.data(), req.caller.role);
  return res.json(record);
});

// POST /api/admin/users/:uid/suspend
router.post('/:uid/suspend', requireClaims, requireAdmin, async (req, res) => {
  const db = getFirestore();
  const userRef = db.collection('users').doc(req.params.uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return sendError(res, 404, 'NOT_FOUND', 'No such account.');
  }

  const user = userSnap.data();
  if (user.uid === req.caller.uid) {
    return sendError(res, 403, 'FORBIDDEN', 'You cannot suspend yourself.');
  }

  if (user.status === 'suspended') {
    return sendError(res, 409, 'CONFLICT', 'Already suspended.');
  }

  const reason = String(req.body?.reason || '').trim();
  if (!reason) {
    return sendError(res, 400, 'VALIDATION', 'Give a reason.', 'reason');
  }

  const nowStr = new Date().toISOString();

  try {
    await getAuth().updateUser(user.uid, { disabled: true });
    await getAuth().revokeRefreshTokens(user.uid);
  } catch (err) {
    console.warn(`[Auth] Warning updating auth user ${user.uid}:`, err.message);
  }

  await userRef.update({
    status: 'suspended',
    suspendedAt: nowStr,
    suspendedBy: { uid: req.caller.uid, name: req.caller.displayName },
    statusBeforeSuspension: user.status
  });

  await writeAuditLog(db, {
    caller: req.caller,
    subjectUid: user.uid,
    action: 'ACCOUNT_SUSPENDED',
    summary: 'Account suspended',
    details: { reason }
  });

  const updatedSnap = await userRef.get();
  const record = await buildFullRecord(db, updatedSnap.data(), req.caller.role);
  return res.json(record);
});

// POST /api/admin/users/:uid/unsuspend
router.post('/:uid/unsuspend', requireClaims, requireAdmin, async (req, res) => {
  const db = getFirestore();
  const userRef = db.collection('users').doc(req.params.uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return sendError(res, 404, 'NOT_FOUND', 'No such account.');
  }

  const user = userSnap.data();
  if (user.status !== 'suspended') {
    return sendError(res, 409, 'CONFLICT', 'Not suspended.');
  }

  const nextStatus = user.activatedAt ? 'active' : 'pending';

  await getAuth().updateUser(user.uid, { disabled: false });

  await userRef.update({
    status: nextStatus,
    suspendedAt: null,
    suspendedBy: null
  });

  await writeAuditLog(db, {
    caller: req.caller,
    subjectUid: user.uid,
    action: 'ACCOUNT_UNSUSPENDED',
    summary: 'Account unsuspended'
  });

  const updatedSnap = await userRef.get();
  const record = await buildFullRecord(db, updatedSnap.data(), req.caller.role);
  return res.json(record);
});

// POST /api/admin/users/:uid/resend-activation
router.post('/:uid/resend-activation', requireClaims, requireAdmin, async (req, res) => {
  const db = getFirestore();
  const userSnap = await db.collection('users').doc(req.params.uid).get();

  if (!userSnap.exists) {
    return sendError(res, 404, 'NOT_FOUND', 'No such account.');
  }

  const user = userSnap.data();
  if (user.status !== 'pending') {
    return sendError(res, 409, 'CONFLICT', 'This account is already activated.');
  }

  if (!isEmailConfigured()) {
    return sendError(res, 501, 'EMAIL_NOT_CONFIGURED', 'Email sending is not set up yet.');
  }

  await sendEmail({ to: user.email, template: 'activation', locale: 'en', data: { uid: user.uid, email: user.email } });
  return res.json({ sent: true });
});

// POST /api/admin/users/:uid/change-email
router.post('/:uid/change-email', requireClaims, requireAdmin, async (req, res) => {
  const db = getFirestore();
  const userSnap = await db.collection('users').doc(req.params.uid).get();

  if (!userSnap.exists) {
    return sendError(res, 404, 'NOT_FOUND', 'No such account.');
  }

  const newEmail = String(req.body?.newEmail || '').trim().toLowerCase();
  if (!EMAIL_REGEX.test(newEmail)) {
    return sendError(res, 400, 'VALIDATION', 'Enter a valid email address.', 'newEmail');
  }

  try {
    await getAuth().getUserByEmail(newEmail);
    return sendError(res, 409, 'CONFLICT', 'That email is already in use.', 'newEmail');
  } catch {
    // Free
  }

  if (!isEmailConfigured()) {
    return sendError(res, 501, 'EMAIL_NOT_CONFIGURED', 'Email sending is not set up yet.');
  }

  await sendEmail({ to: newEmail, template: 'change-email', locale: 'en', data: { uid: req.params.uid, newEmail } });
  return res.json({ sent: true });
});

// GET /api/admin/users/:uid/history
router.get('/:uid/history', requireClaims, requireConsoleAccess, async (req, res) => {
  const db = getFirestore();
  const userSnap = await db.collection('users').doc(req.params.uid).get();

  if (!userSnap.exists) {
    return sendError(res, 404, 'NOT_FOUND', 'No such account.');
  }

  // Supervisor scoping
  if (req.caller.role === 'supervisor') {
    const hasOverlap = userSnap.data().schoolIds?.some((s) => req.caller.schoolIds?.includes(s));
    if (!hasOverlap) {
      return sendError(res, 404, 'NOT_FOUND', 'No such account.');
    }
  }

  const logsSnap = await db.collection('auditLogs')
    .where('subjectUid', '==', req.params.uid)
    .get();

  const rows = logsSnap.docs.map((d) => {
    const data = d.data();
    return {
      logId: d.id,
      action: data.action || 'UNKNOWN',
      summary: data.summary || '',
      actorUid: data.actorUid || 'server',
      actorName: data.actorName || 'Server Admin',
      actorPublicId: data.actorPublicId || null,
      details: data.details || {},
      createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString()
    };
  });

  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.logId.localeCompare(a.logId));

  return res.json(paginateArray(rows, req.query.pageToken, req.query.pageSize));
});

export default router;
