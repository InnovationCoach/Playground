import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';

export const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
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
const actor = req => ({ uid: req.caller.uid, name: req.caller.displayName });
const stamp = req => ({ updatedAt: new Date().toISOString(), updatedBy: actor(req) });
const belongs = (req, record) => record?.orgId === org(req);
const fail = (res, message) => sendError(res, 400, 'VALIDATION', message);

router.get('/attendance', consoleOnly, async (req, res) => {
  const { date, kind } = req.query;
  if (!validDate(date) || !['staff', 'students'].includes(kind)) return fail(res, 'Select a valid date and attendance group.');
  const db = getFirestore();
  const [users, records] = await Promise.all([
    db.collection('users').where('orgId', '==', org(req)).get(),
    db.collection('pilotAttendance').where('orgId', '==', org(req)).where('date', '==', date).get()
  ]);
  const byUid = new Map(records.docs.map(d => [d.data().uid, d.data()]));
  const items = users.docs.filter(d => kind === 'students' ? d.data().role === 'student' : ['admin', 'supervisor', 'teacher', 'coach'].includes(d.data().role)).map(d => {
    const u = d.data();
    return { uid: d.id, name: u.displayName || `${u.givenNames || ''} ${u.surname || ''}`.trim() || u.email || d.id, classIds: u.classIds || [], ...(byUid.get(d.id) || { status: 'unmarked', note: '' }) };
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
export default router;
