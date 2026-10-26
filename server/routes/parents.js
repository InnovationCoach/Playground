import { Router } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { generateJoinCode, normaliseJoinCode } from '../../src/utils/joinCode.js';
import { writeAuditLog } from '../lib/audit.js';

const router = Router();
const SECRET = process.env.PARENT_INVITE_SECRET || 'dev-secret-key-phase0';

function hashCode(code) {
  return crypto.createHmac('sha256', SECRET).update(code).digest('hex');
}

// Helper for minimal child summary required by §6.4 & §7
async function buildChildSummary(db, studentDoc) {
  const schoolId = studentDoc.schoolIds?.[0] || null;
  let schoolName = null;
  if (schoolId) {
    const sSnap = await db.collection('schools').doc(schoolId).get();
    if (sSnap.exists) schoolName = sSnap.data().name;
  }

  const cohortId = studentDoc.cohortId || null;
  let cohortCode = null;
  if (cohortId) {
    const cSnap = await db.collection('cohorts').doc(cohortId).get();
    if (cSnap.exists) cohortCode = cSnap.data().code;
  }

  return {
    uid: studentDoc.uid,
    publicId: studentDoc.publicId || null,
    givenNames: studentDoc.givenNames || '',
    displayName: studentDoc.displayName || `${studentDoc.givenNames || ''} ${studentDoc.surname || ''}`.trim(),
    yearLevel: studentDoc.yearLevel || null,
    schoolName,
    cohortCode,
    status: studentDoc.status || 'active',
    consentStatus: studentDoc.consent?.status || null
  };
}

// POST /api/students/:uid/parent-invite (admin, teacher)
router.post('/students/:uid/parent-invite', requireClaims, async (req, res) => {
  if (!['admin', 'teacher'].includes(req.caller.role)) {
    return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to do that.');
  }

  const db = getFirestore();
  const studentSnap = await db.collection('users').doc(req.params.uid).get();
  if (!studentSnap.exists || studentSnap.data().role !== 'student') {
    return sendError(res, 404, 'NOT_FOUND', 'No such student.');
  }

  const student = studentSnap.data();

  // If teacher, check student is in teacher's classIds
  if (req.caller.role === 'teacher') {
    const sharesClass = student.classIds?.some((c) => req.caller.classIds?.includes(c));
    if (!sharesClass) {
      return sendError(res, 403, 'FORBIDDEN', 'You do not teach this student.');
    }
  }

  // Revoke existing unredeemed invites for this student
  const oldInvitesSnap = await db.collection('parentInvites')
    .where('studentUid', '==', req.params.uid)
    .get();

  const batch = db.batch();
  oldInvitesSnap.docs.forEach((docSnap) => {
    if (!docSnap.data().redeemedAt) {
      batch.update(docSnap.ref, { revokedAt: FieldValue.serverTimestamp() });
    }
  });

  const code = generateJoinCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const inviteRef = db.collection('parentInvites').doc();

  batch.set(inviteRef, {
    inviteId: inviteRef.id,
    orgId: student.orgId || req.caller.orgId || 'org-welearn',
    studentUid: student.uid,
    codeHash,
    expiresAt,
    createdBy: req.caller.uid,
    createdAt: FieldValue.serverTimestamp()
  });

  await batch.commit();

  await writeAuditLog(db, {
    caller: req.caller,
    subjectUid: student.uid,
    action: 'PARENT_INVITE_ISSUED',
    summary: 'Parent invite code issued'
  });

  return res.status(201).json({ code, expiresAt });
});

// POST /api/parent/redeem (parent only)
router.post('/parent/redeem', requireClaims, async (req, res) => {
  if (req.caller.role !== 'parent') {
    return sendError(res, 403, 'FORBIDDEN', 'Only parents can redeem invite codes.');
  }

  const db = getFirestore();
  const now = Date.now();
  const windowStart = now - 15 * 60000;

  // Rate limiting stored in Firestore rateLimits collection
  const rateRef = db.collection('rateLimits').doc(req.caller.uid);
  const rateSnap = await rateRef.get();
  const attempts = (rateSnap.exists ? rateSnap.data().attempts || [] : [])
    .filter((t) => typeof t === 'number' && t > windowStart);

  if (attempts.length >= 5) {
    return sendError(res, 429, 'RATE_LIMITED', 'Too many attempts.');
  }

  await rateRef.set({ attempts: [...attempts, now], updatedAt: FieldValue.serverTimestamp() });

  const rawCode = req.body?.code;
  const normalized = normaliseJoinCode(rawCode);
  if (!normalized) {
    return sendError(res, 404, 'NOT_FOUND', 'That code is not valid. Check it with the school.', 'code');
  }

  const codeHash = hashCode(normalized);
  const inviteSnap = await db.collection('parentInvites')
    .where('codeHash', '==', codeHash)
    .limit(1)
    .get();

  if (inviteSnap.empty) {
    return sendError(res, 404, 'NOT_FOUND', 'That code is not valid. Check it with the school.', 'code');
  }

  const inviteDoc = inviteSnap.docs[0];
  const invite = inviteDoc.data();

  const isExpired = invite.expiresAt && new Date(invite.expiresAt).getTime() < now;
  if (invite.redeemedAt || invite.revokedAt || isExpired) {
    return sendError(res, 404, 'NOT_FOUND', 'That code is not valid. Check it with the school.', 'code');
  }

  const studentSnap = await db.collection('users').doc(invite.studentUid).get();
  if (!studentSnap.exists) {
    return sendError(res, 404, 'NOT_FOUND', 'That code is not valid. Check it with the school.', 'code');
  }

  const student = studentSnap.data();

  // Check existing active link
  const existingLinkSnap = await db.collection('parentLinks')
    .where('parentUid', '==', req.caller.uid)
    .where('studentUid', '==', student.uid)
    .where('status', '==', 'active')
    .get();

  let linkId = null;
  if (existingLinkSnap.empty) {
    const linkRef = db.collection('parentLinks').doc();
    linkId = linkRef.id;

    const b = db.batch();
    b.update(inviteDoc.ref, { redeemedAt: new Date().toISOString(), redeemedBy: req.caller.uid });
    b.set(linkRef, {
      linkId,
      orgId: student.orgId || req.caller.orgId || 'org-welearn',
      parentUid: req.caller.uid,
      studentUid: student.uid,
      status: 'active',
      createdVia: invite.inviteId,
      createdAt: new Date().toISOString()
    });
    await b.commit();

    await writeAuditLog(db, {
      caller: req.caller,
      subjectUid: student.uid,
      action: 'PARENT_LINKED',
      summary: `Parent ${req.caller.displayName || req.caller.name} linked`
    });
  } else {
    await inviteDoc.ref.update({ redeemedAt: new Date().toISOString(), redeemedBy: req.caller.uid });
    linkId = existingLinkSnap.docs[0].id;
  }

  const childSummary = await buildChildSummary(db, student);
  return res.json({ child: childSummary });
});

// GET /api/parent/children (parent only)
router.get('/parent/children', requireClaims, async (req, res) => {
  if (req.caller.role !== 'parent') {
    return sendError(res, 403, 'FORBIDDEN', 'Only parents can view linked children.');
  }

  const db = getFirestore();
  const linksSnap = await db.collection('parentLinks')
    .where('parentUid', '==', req.caller.uid)
    .where('status', '==', 'active')
    .get();

  const items = [];
  for (const docSnap of linksSnap.docs) {
    const link = docSnap.data();
    const studentSnap = await db.collection('users').doc(link.studentUid).get();
    if (studentSnap.exists) {
      const summary = await buildChildSummary(db, studentSnap.data());
      items.push({
        linkId: link.linkId || docSnap.id,
        ...summary
      });
    }
  }

  return res.json({ items, nextPageToken: null, total: items.length });
});

// DELETE /api/admin/parent-links/:linkId (admin)
router.delete('/admin/parent-links/:linkId', requireClaims, async (req, res) => {
  if (req.caller.role !== 'admin') {
    return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to do that.');
  }

  const db = getFirestore();
  const linkRef = db.collection('parentLinks').doc(req.params.linkId);
  const linkSnap = await linkRef.get();

  if (!linkSnap.exists || linkSnap.data().status !== 'active') {
    return sendError(res, 404, 'NOT_FOUND', 'No such link.');
  }

  const link = linkSnap.data();
  const nowStr = new Date().toISOString();

  await linkRef.update({
    status: 'revoked',
    revokedAt: nowStr,
    revokedBy: req.caller.uid
  });

  const studentSnap = await db.collection('users').doc(link.studentUid).get();
  const parentSnap = await db.collection('users').doc(link.parentUid).get();
  const student = studentSnap.exists ? studentSnap.data() : null;
  const parent = parentSnap.exists ? parentSnap.data() : null;

  if (student) {
    await writeAuditLog(db, {
      caller: req.caller,
      subjectUid: student.uid,
      action: 'PARENT_UNLINKED',
      summary: `Parent ${parent?.displayName || link.parentUid} unlinked`
    });
  }

  if (parent) {
    await writeAuditLog(db, {
      caller: req.caller,
      subjectUid: parent.uid,
      action: 'PARENT_UNLINKED',
      summary: `Unlinked from ${student?.displayName || link.studentUid}`
    });
  }

  return res.json({ linkId: req.params.linkId, status: 'revoked' });
});

export default router;
