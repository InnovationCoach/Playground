import path from 'node:path';
import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { writeAuditLog } from '../lib/audit.js';

export const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const DEFAULT_ORG = 'org-welearn';
const STAFF_ROLES = ['admin', 'supervisor', 'teacher', 'coach'];
const router = Router();
router.use(requireClaims);
// Privileged access comes from verified token claims, never an editable profile.
router.use((req, res, next) => {
  req.pilotRole = req.caller.signedClaims?.role;
  if (!['admin', 'supervisor', 'teacher', 'coach'].includes(req.pilotRole)) return sendError(res, 403, 'FORBIDDEN', 'Staff access required.');
  next();
});
const consoleOnly = (req, res, next) => ['admin', 'supervisor'].includes(req.pilotRole) ? next() : sendError(res, 403, 'FORBIDDEN', 'Administrator access required.');
const adminOnly = (req, res, next) => req.pilotRole === 'admin' ? next() : sendError(res, 403, 'FORBIDDEN', 'Only administrators can make changes.');
const org = req => req.caller.orgId;
// Sign-in details for the attendance list. Auth is read in batches of 100; a failed lookup
// leaves the Firestore email in place rather than failing the whole list.
async function loginDetails(uids) {
  const details = new Map();
  for (let i = 0; i < uids.length; i += 100) {
    try {
      const { users } = await getAuth().getUsers(uids.slice(i, i + 100).map(uid => ({ uid })));
      users.forEach(u => details.set(u.uid, {
        authEmail: u.email || null,
        lastSignInAt: u.metadata?.lastSignInTime ? new Date(u.metadata.lastSignInTime).toISOString() : null,
        accountDisabled: Boolean(u.disabled)
      }));
    } catch (error) {
      console.warn('Pilot attendance: login details unavailable', error.message);
    }
  }
  return details;
}
const actor = req => ({ uid: req.caller.uid, name: req.caller.displayName });
const stamp = req => ({ updatedAt: new Date().toISOString(), updatedBy: actor(req) });
const belongs = (req, record) => record?.orgId === org(req);
const fail = (res, message) => sendError(res, 400, 'VALIDATION', message);

router.get('/attendance', consoleOnly, async (req, res) => {
  const { date, kind } = req.query;
  if (!validDate(date) || !['staff', 'students'].includes(kind)) return fail(res, 'Select a valid date and attendance group.');
  const db = getFirestore();
  // Filter by role in the query and by organization in memory: older user records may have no
  // orgId, and those are treated as the default organization everywhere else (see auth middleware).
  const [users, records] = await Promise.all([
    db.collection('users').where('role', 'in', kind === 'students' ? ['student'] : STAFF_ROLES).get(),
    db.collection('pilotAttendance').where('orgId', '==', org(req)).where('date', '==', date).get()
  ]);
  const people = users.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .filter(u => (u.orgId || DEFAULT_ORG) === org(req));
  const logins = await loginDetails(people.map(u => u.uid));
  const byUid = new Map(records.docs.map(d => [d.data().uid, d.data()]));
  const items = people.map(u => {
    const login = logins.get(u.uid) || {};
    return {
      uid: u.uid,
      name: u.displayName || `${u.givenNames || ''} ${u.surname || ''}`.trim() || u.email || u.uid,
      classIds: u.classIds || [],
      publicId: u.publicId || null,
      email: u.email || login.authEmail || null,
      lastSignInAt: login.lastSignInAt || null,
      accountStatus: u.status || null,
      accountDisabled: login.accountDisabled ?? (u.status === 'suspended'),
      ...(byUid.get(u.uid) || { status: 'unmarked', note: '' })
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  res.json({ items });
});
router.put('/attendance/:uid', adminOnly, async (req, res) => {
  const { date, status, note = '', reason = '' } = req.body || {};
  if (!validDate(date) || !['present', 'absent', 'late', 'excused', 'unmarked'].includes(status) || typeof note !== 'string' || note.length > 500 || typeof reason !== 'string' || !reason.trim() || reason.length > 500) return fail(res, 'Choose a valid attendance status and provide a correction reason (up to 500 characters).');
  const db = getFirestore();
  const person = await db.collection('users').doc(req.params.uid).get();
  if (!person.exists || !belongs(req, person.data()) || !['student', 'teacher', 'coach', 'admin', 'supervisor'].includes(person.data().role)) return sendError(res, 404, 'NOT_FOUND', 'Person not found.');
  const ref = db.collection('pilotAttendance').doc(`${date}_${req.params.uid}`);
  const record = { orgId: org(req), uid: req.params.uid, date, status, note: note.trim(), ...stamp(req) };
  await db.runTransaction(async tx => {
    const before = await tx.get(ref);
    tx.set(ref.collection('history').doc(), { before: before.exists ? before.data() : null, after: record, reason: reason.trim(), ...stamp(req) });
    tx.set(ref, record);
  });
  res.json(record);
});
router.get('/attendance/:uid/history', consoleOnly, async (req, res) => {
  if (!validDate(req.query.date)) return fail(res, 'Select a valid date.');
  const ref = getFirestore().collection('pilotAttendance').doc(`${req.query.date}_${req.params.uid}`);
  const record = await ref.get();
  if (!record.exists || !belongs(req, record.data())) return res.json({ items: [] });
  const history = await ref.collection('history').get();
  res.json({ items: history.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) });
});
router.get('/leave', async (req, res) => {
  let query = getFirestore().collection('pilotLeave').where('orgId', '==', org(req));
  if (!['admin', 'supervisor'].includes(req.pilotRole)) query = query.where('uid', '==', req.caller.uid);
  const snap = await query.get();
  res.json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});
router.post('/leave', async (req, res) => {
  const { startDate, endDate, reason } = req.body || {};
  if (!validDate(startDate) || !validDate(endDate) || endDate < startDate || typeof reason !== 'string' || !reason.trim() || reason.length > 1000) return fail(res, 'Enter valid dates and a reason of up to 1,000 characters.');
  const db = getFirestore();
  const ref = db.collection('pilotLeave').doc();
  // Serialize requests per coach to prevent duplicate/overlapping submissions.
  await db.runTransaction(async tx => {
    const lock = db.collection('pilotLeaveLocks').doc(req.caller.uid);
    await tx.get(lock);
    const existing = await tx.get(db.collection('pilotLeave').where('uid', '==', req.caller.uid).where('orgId', '==', org(req)));
    if (existing.docs.some(d => { const r = d.data(); return r.status !== 'rejected' && r.startDate <= endDate && r.endDate >= startDate; })) {
      const error = new Error('A pending or approved request already overlaps these dates.'); error.status = 409; throw error;
    }
    tx.set(lock, stamp(req));
    tx.set(ref, { orgId: org(req), uid: req.caller.uid, name: req.caller.displayName, startDate, endDate, reason: reason.trim(), status: 'pending', createdAt: new Date().toISOString(), ...stamp(req) });
  }).catch(error => { if (error.status === 409) return sendError(res, 409, 'CONFLICT', error.message); throw error; });
  if (!res.headersSent) res.status(201).json({ id: ref.id });
});
router.patch('/leave/:id', adminOnly, async (req, res) => {
  const { status, response = '' } = req.body || {};
  if (!['approved', 'rejected'].includes(status) || typeof response !== 'string' || response.length > 500) return fail(res, 'Choose approve or reject and a response of up to 500 characters.');
  const ref = getFirestore().collection('pilotLeave').doc(req.params.id);
  const result = await getFirestore().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists || !belongs(req, snap.data())) return 404;
    if (snap.data().status !== 'pending') return 409;
    tx.update(ref, { status, response: response.trim(), ...stamp(req) });
    return 200;
  });
  if (result !== 200) return sendError(res, result, result === 404 ? 'NOT_FOUND' : 'CONFLICT', result === 404 ? 'Request not found.' : 'This request has already been reviewed. Refresh to see the decision.');
  res.json({ ok: true });
});
router.get('/inventory', consoleOnly, async (req, res) => {
  const snap = await getFirestore().collection('pilotInventory').where('orgId', '==', org(req)).get();
  res.json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)) });
});
router.post('/inventory', adminOnly, async (req, res) => {
  const { name, location = '', quantity, minimum = 0 } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || name.length > 120 || typeof location !== 'string' || location.length > 120 || !Number.isSafeInteger(quantity) || quantity < 0 || !Number.isSafeInteger(minimum) || minimum < 0) return fail(res, 'Enter an item name and non-negative whole stock quantities.');
  const record = { orgId: org(req), name: name.trim(), location: location.trim(), quantity, minimum, ...stamp(req) };
  const db = getFirestore();
  const ref = db.collection('pilotInventory').doc();
  const batch = db.batch();
  batch.set(ref, record);
  batch.set(ref.collection('history').doc(), { change: quantity, quantity, reason: 'Opening stock', ...stamp(req) });
  await batch.commit();
  res.status(201).json({ id: ref.id, ...record });
});
router.patch('/inventory/:id', adminOnly, async (req, res) => {
  const { change, reason } = req.body || {};
  if (!Number.isSafeInteger(change) || change === 0 || typeof reason !== 'string' || !reason.trim() || reason.length > 500) return fail(res, 'Enter a non-zero whole stock adjustment and a reason.');
  const db = getFirestore();
  const ref = db.collection('pilotInventory').doc(req.params.id);
  const result = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists || !belongs(req, snap.data())) return 404;
    const quantity = snap.data().quantity + change;
    if (!Number.isSafeInteger(quantity) || quantity < 0) return 400;
    tx.update(ref, { quantity, ...stamp(req) });
    tx.set(ref.collection('history').doc(), { change, quantity, reason: reason.trim(), ...stamp(req) });
    return 200;
  });
  if (result !== 200) return sendError(res, result, result === 404 ? 'NOT_FOUND' : 'VALIDATION', result === 404 ? 'Item not found.' : 'Stock cannot go below zero.');
  res.json({ ok: true });
});
router.get('/inventory/:id/history', consoleOnly, async (req, res) => {
  const ref = getFirestore().collection('pilotInventory').doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists || !belongs(req, snap.data())) return sendError(res, 404, 'NOT_FOUND', 'Item not found.');
  const history = await ref.collection('history').get();
  res.json({ items: history.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) });
});

// ---------------------------------------------------------------------------
// Learner Records: portfolios, transcripts, progress reports (L1–L7)
// ---------------------------------------------------------------------------
const getRecordsBucket = () => {
  const bucketName = process.env.STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || undefined;
  return getStorage().bucket(bucketName);
};

const ALLOWED_RECORD_TYPES = ['portfolio', 'transcript', 'report', 'other'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

function validateMagicBytes(buf, mime) {
  if (!buf || buf.length < 4) return false;
  const lower = (mime || '').toLowerCase();
  if (lower === 'application/pdf') {
    return buf.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  if (lower === 'image/png') {
    return buf.length >= 8 &&
           buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
           buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A;
  }
  if (lower === 'image/jpeg' || lower === 'image/jpg') {
    return buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  }
  if (lower === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return buf[0] === 0x50 && buf[1] === 0x4B && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07);
  }
  return false;
}

const stripRecord = ({ storagePath, fileData, ...rest } = {}) => rest;

// L1: List assigned learners for coach/teacher
router.get('/learner-records/learners', async (req, res) => {
  const coachClassIds = Array.isArray(req.caller.signedClaims?.classIds)
    ? req.caller.signedClaims.classIds
    : (Array.isArray(req.caller.classIds) ? req.caller.classIds : []);

  const isConsole = ['admin', 'supervisor'].includes(req.pilotRole);
  if (!isConsole && coachClassIds.length === 0) {
    return res.json({ items: [] });
  }

  const db = getFirestore();
  const usersSnap = await db.collection('users').where('role', '==', 'student').get();

  const items = usersSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u => {
      if ((u.orgId || DEFAULT_ORG) !== org(req)) return false;
      if (isConsole && coachClassIds.length === 0) return true;
      const uClassIds = Array.isArray(u.classIds) ? u.classIds : [];
      return uClassIds.some(cid => coachClassIds.includes(cid));
    })
    .map(u => ({
      id: u.id,
      displayName: u.displayName || `${u.givenNames || ''} ${u.surname || ''}`.trim() || u.email || u.id
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  res.json({ items });
});

// L2: List records (coach sees own uploads; admin/supervisor sees all in org)
router.get('/learner-records', async (req, res) => {
  const db = getFirestore();
  const isConsole = ['admin', 'supervisor'].includes(req.pilotRole);
  let query = db.collection('learnerRecords').where('orgId', '==', org(req));
  if (!isConsole) {
    query = query.where('coachUid', '==', req.caller.uid);
  }
  const snap = await query.get();
  const items = snap.docs
    .map(d => ({ id: d.id, ...stripRecord(d.data()) }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  res.json({ items });
});

// L3: Upload a learner record (teacher/coach)
router.post('/learner-records', async (req, res) => {
  if (!['teacher', 'coach'].includes(req.pilotRole)) {
    return sendError(res, 403, 'FORBIDDEN', 'Teacher or coach access required.');
  }

  const { learnerUid, type, title, term = '', note = '', fileName, contentType, fileData } = req.body || {};

  if (!learnerUid || typeof learnerUid !== 'string') {
    return fail(res, 'Choose a learner.');
  }
  if (!type || !ALLOWED_RECORD_TYPES.includes(type)) {
    return fail(res, 'Choose what kind of file this is.');
  }
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) {
    return fail(res, 'Give the file a title (up to 120 characters).');
  }
  if (term !== undefined && term !== null && (typeof term !== 'string' || term.trim().length > 40)) {
    return fail(res, 'Keep the term under 40 characters.');
  }
  if (note !== undefined && note !== null && (typeof note !== 'string' || note.trim().length > 500)) {
    return fail(res, 'Keep the note under 500 characters.');
  }
  if (typeof fileName !== 'string' || !fileName.trim()) {
    return fail(res, 'Choose a file to upload.');
  }

  const normContentType = (contentType || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(normContentType)) {
    return fail(res, 'Upload a PDF, Word (.docx), PNG or JPG file.');
  }

  if (typeof fileData !== 'string' || !fileData.startsWith('data:')) {
    return fail(res, 'Invalid file data.');
  }
  const commaIndex = fileData.indexOf(',');
  if (commaIndex === -1) {
    return fail(res, 'Invalid file data.');
  }
  const header = fileData.slice(0, commaIndex);
  if (!header.includes(';base64')) {
    return fail(res, 'File data must be base64 encoded.');
  }
  const base64Str = fileData.slice(commaIndex + 1);
  const buffer = Buffer.from(base64Str, 'base64');
  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  if (buffer.length === 0) {
    return fail(res, 'The file is empty.');
  }
  if (buffer.length > MAX_FILE_BYTES) {
    return fail(res, 'The file is larger than 5 MB. Export a smaller file and try again.');
  }
  if (!validateMagicBytes(buffer, normContentType)) {
    return fail(res, 'The file content does not match the chosen file type.');
  }

  const db = getFirestore();
  const coachClassIds = Array.isArray(req.caller.signedClaims?.classIds)
    ? req.caller.signedClaims.classIds
    : (Array.isArray(req.caller.classIds) ? req.caller.classIds : []);

  const learnerDoc = await db.collection('users').doc(learnerUid).get();
  if (!learnerDoc.exists) {
    return fail(res, 'Choose a learner from your classes.');
  }
  const learner = learnerDoc.data();
  if (learner.role !== 'student' || (learner.orgId || DEFAULT_ORG) !== org(req)) {
    return fail(res, 'Choose a learner from your classes.');
  }
  const learnerClasses = Array.isArray(learner.classIds) ? learner.classIds : [];
  if (!learnerClasses.some(cid => coachClassIds.includes(cid))) {
    return fail(res, 'Choose a learner from your classes.');
  }
  const learnerName = learner.displayName || `${learner.givenNames || ''} ${learner.surname || ''}`.trim() || learner.email || learnerUid;

  const ref = db.collection('learnerRecords').doc();
  const recordId = ref.id;
  const safeBase = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_') || 'record';
  const storagePath = `learnerRecords/${org(req)}/${learnerUid}/${recordId}/${safeBase}`;

  const bucket = getRecordsBucket();
  const file = bucket.file(storagePath);
  await file.save(buffer, {
    metadata: {
      contentType: normContentType,
      metadata: {
        orgId: org(req),
        learnerUid,
        recordId,
        uploadedBy: req.caller.uid
      }
    }
  });

  const record = {
    orgId: org(req),
    learnerUid,
    learnerName,
    coachUid: req.caller.uid,
    coachName: req.caller.displayName || req.caller.name || 'Coach',
    type,
    title: title.trim(),
    term: (term || '').trim(),
    note: (note || '').trim(),
    fileName: fileName.trim(),
    contentType: normContentType,
    size: buffer.length,
    storagePath,
    status: 'submitted',
    response: '',
    sharedWithParents: false,
    sharedAt: null,
    createdAt: new Date().toISOString()
  };

  try {
    await ref.set(record);
  } catch (err) {
    try { await file.delete({ ignoreNotFound: true }); } catch {}
    throw err;
  }

  res.status(201).json({ id: recordId });
});

// L4: Download URL (signed URL, 5 min)
router.get('/learner-records/:id/download', async (req, res) => {
  const ref = getFirestore().collection('learnerRecords').doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists || !belongs(req, snap.data())) {
    return sendError(res, 404, 'NOT_FOUND', 'Record not found.');
  }
  const record = snap.data();
  const isConsole = ['admin', 'supervisor'].includes(req.pilotRole);
  if (!isConsole && record.coachUid !== req.caller.uid) {
    return sendError(res, 403, 'FORBIDDEN', 'You can only download your own uploads.');
  }

  const downloadFileName = record.fileName || 'learner-record';
  const bucket = getRecordsBucket();
  const file = bucket.file(record.storagePath);

  let url;
  try {
    [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000,
      responseDisposition: `attachment; filename="${downloadFileName.replace(/["\r\n]/g, '_')}"`
    });
  } catch (err) {
    if (process.env.STORAGE_EMULATOR_HOST) {
      const host = process.env.STORAGE_EMULATOR_HOST.startsWith('http')
        ? process.env.STORAGE_EMULATOR_HOST
        : `http://${process.env.STORAGE_EMULATOR_HOST}`;
      url = `${host}/v0/b/${bucket.name}/o/${encodeURIComponent(record.storagePath)}?alt=media`;
    } else {
      throw err;
    }
  }

  res.json({ url, fileName: downloadFileName });
});

// L5 & L6: Review & Share (admin only)
router.patch('/learner-records/:id', adminOnly, async (req, res) => {
  const { status, response, sharedWithParents } = req.body || {};
  if (status === undefined && typeof sharedWithParents !== 'boolean') {
    return fail(res, 'Provide a status or sharing update.');
  }

  const db = getFirestore();
  const ref = db.collection('learnerRecords').doc(req.params.id);

  let auditEvent = null;
  let updatedRecord = null;

  const result = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists || !belongs(req, snap.data())) return 404;
    const current = snap.data();
    const patch = { ...stamp(req) };

    if (status !== undefined) {
      if (!['approved', 'returned'].includes(status)) {
        return { error: 400, message: 'Status must be approved or returned.' };
      }
      if (current.status !== 'submitted') {
        return { error: 409, message: 'Only files awaiting review can be reviewed.' };
      }
      if (status === 'returned' && (typeof response !== 'string' || !response.trim())) {
        return { error: 400, message: 'Provide a response note when returning a file to the coach.' };
      }
      if (response !== undefined && (typeof response !== 'string' || response.trim().length > 500)) {
        return { error: 400, message: 'Keep the response under 500 characters.' };
      }
      patch.status = status;
      patch.response = (response || '').trim();
      auditEvent = {
        action: status === 'approved' ? 'LEARNER_RECORD_APPROVED' : 'LEARNER_RECORD_RETURNED',
        summary: `Learner record ${snap.id} (${current.title}) ${status === 'approved' ? 'approved' : 'returned to coach'}`
      };
    }

    if (typeof sharedWithParents === 'boolean') {
      const effectiveStatus = patch.status || current.status;
      if (effectiveStatus !== 'approved') {
        return { error: 409, message: 'Only approved records can be shared with parents.' };
      }
      patch.sharedWithParents = sharedWithParents;
      patch.sharedAt = sharedWithParents ? new Date().toISOString() : null;
      if (!auditEvent) {
        auditEvent = {
          action: sharedWithParents ? 'LEARNER_RECORD_SHARED' : 'LEARNER_RECORD_UNSHARED',
          summary: `Learner record ${snap.id} (${current.title}) ${sharedWithParents ? 'shared with parents' : 'unmarked shared with parents'}`
        };
      }
    }

    tx.update(ref, patch);
    updatedRecord = { ...current, ...patch, id: snap.id };
    return 200;
  });

  if (result !== 200) {
    if (result === 404) return sendError(res, 404, 'NOT_FOUND', 'Record not found.');
    return sendError(res, result.error, result.error === 409 ? 'CONFLICT' : 'VALIDATION', result.message);
  }

  if (auditEvent) {
    try {
      await writeAuditLog(db, {
        caller: req.caller,
        subjectUid: updatedRecord.learnerUid,
        action: auditEvent.action,
        summary: auditEvent.summary,
        details: { recordId: updatedRecord.id, title: updatedRecord.title }
      });
    } catch (err) {
      console.warn('Failed to write audit log for learner record update', err.message);
    }
  }

  res.json(stripRecord(updatedRecord));
});

// L7: Withdraw record (owning coach only, while submitted)
router.delete('/learner-records/:id', async (req, res) => {
  const db = getFirestore();
  const ref = db.collection('learnerRecords').doc(req.params.id);

  let storagePathToDelete = null;

  const result = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists || !belongs(req, snap.data())) return 404;
    const current = snap.data();
    if (current.coachUid !== req.caller.uid) return 403;
    if (current.status !== 'submitted') return 409;
    storagePathToDelete = current.storagePath;
    tx.delete(ref);
    return 200;
  });

  if (result !== 200) {
    if (result === 404) return sendError(res, 404, 'NOT_FOUND', 'Record not found.');
    if (result === 403) return sendError(res, 403, 'FORBIDDEN', 'You can only withdraw your own uploads.');
    if (result === 409) return sendError(res, 409, 'CONFLICT', 'Only files awaiting review can be withdrawn.');
  }

  if (storagePathToDelete) {
    try {
      const bucket = getRecordsBucket();
      await bucket.file(storagePathToDelete).delete({ ignoreNotFound: true });
    } catch (err) {
      console.warn('Failed to delete storage object', storagePathToDelete, err.message);
    }
  }

  res.json({ ok: true });
});

export default router;

