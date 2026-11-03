import { Router } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { paginateArray } from '../lib/pagination.js';

const router = Router();

function requireConsoleAccess(req, res, next) {
  if (!['admin', 'supervisor'].includes(req.caller.role)) {
    return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to do that.');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.caller.role !== 'admin') {
    return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to do that.');
  }
  next();
}

// Default initial sample material requests if collection is empty
const SAMPLE_MATERIALS = [
  {
    requestId: 'mat-001',
    item: 'Digital Solar Irradiance Sensors',
    category: 'Lab Equipment',
    quantity: 5,
    estimatedCost: 2500,
    totalCost: 12500,
    requestedByUid: 'coach-wpr-1',
    requestedByName: 'Coach Sam',
    requestedByEmail: 'coach.wpr@school.edu',
    reason: 'For Year 11 Net Zero Microgrid solar efficiency measurements.',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    requestId: 'mat-002',
    item: 'Microplastics Water Sample Centrifuge',
    category: 'Lab Equipment',
    quantity: 2,
    estimatedCost: 8900,
    totalCost: 17800,
    requestedByUid: 'coach-wpr-1',
    requestedByName: 'Coach Sam',
    requestedByEmail: 'coach.wpr@school.edu',
    reason: 'Water quality analysis lab for Sustainable Futures cohort.',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    requestId: 'mat-003',
    item: 'Arduino Microcontroller Kits (Pack of 10)',
    category: 'Tech/Hardware',
    quantity: 3,
    estimatedCost: 3500,
    totalCost: 10500,
    requestedByUid: 'coach-wpr-1',
    requestedByName: 'Coach Sam',
    requestedByEmail: 'coach.wpr@school.edu',
    reason: 'Hands-on IoT sensors for air quality monitoring.',
    status: 'fulfilled',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

// Seed material requests if missing
async function ensureMaterialRequestsSeed(db) {
  const coll = db.collection('materialRequests');
  const snap = await coll.get();
  if (snap.empty) {
    const batch = db.batch();
    for (const item of SAMPLE_MATERIALS) {
      batch.set(coll.doc(item.requestId), item);
    }
    await batch.commit();
  }
}

// GET /api/admin/materials
router.get('/materials', requireClaims, requireConsoleAccess, async (req, res) => {
  const db = getFirestore();
  await ensureMaterialRequestsSeed(db);

  const snap = await db.collection('materialRequests').get();
  let rows = snap.docs.map(d => ({ requestId: d.id, ...d.data() }));

  if (req.query.category) {
    rows = rows.filter(r => r.category === req.query.category);
  }
  if (req.query.status) {
    rows = rows.filter(r => r.status === req.query.status);
  }
  if (req.query.q) {
    const qStr = String(req.query.q).toLowerCase();
    rows = rows.filter(r =>
      (r.item || '').toLowerCase().includes(qStr) ||
      (r.requestedByName || '').toLowerCase().includes(qStr) ||
      (r.reason || '').toLowerCase().includes(qStr)
    );
  }

  rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // Compute summary stats
  const pendingCount = rows.filter(r => r.status === 'pending').length;
  const approvedCount = rows.filter(r => r.status === 'approved').length;
  const fulfilledCount = rows.filter(r => r.status === 'fulfilled').length;
  const totalEstimatedCost = rows.reduce((sum, r) => sum + (Number(r.totalCost) || Number(r.estimatedCost * r.quantity) || 0), 0);

  const page = paginateArray(rows, req.query.pageToken, req.query.pageSize);

  return res.json({
    items: page.items,
    total: page.total,
    nextPageToken: page.nextPageToken,
    extra: {
      summary: {
        pendingCount,
        approvedCount,
        fulfilledCount,
        totalEstimatedCost
      }
    }
  });
});

// POST /api/admin/materials
router.post('/materials', requireClaims, async (req, res) => {
  const db = getFirestore();
  const { item, category, quantity, estimatedCost, reason } = req.body || {};

  if (!item || !item.trim()) {
    return sendError(res, 400, 'VALIDATION', 'Item name is required.', 'item');
  }

  const qty = Number(quantity) || 1;
  const cost = Number(estimatedCost) || 0;
  const totalCost = qty * cost;
  const requestId = `mat-${Date.now()}`;

  const record = {
    requestId,
    item: item.trim(),
    category: category || 'Classroom Supplies',
    quantity: qty,
    estimatedCost: cost,
    totalCost,
    requestedByUid: req.caller.uid,
    requestedByName: req.caller.displayName || req.caller.email,
    requestedByEmail: req.caller.email,
    reason: (reason || '').trim(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  await db.collection('materialRequests').doc(requestId).set(record);
  return res.status(201).json(record);
});

// PATCH /api/admin/materials/:requestId
router.patch('/materials/:requestId', requireClaims, requireConsoleAccess, async (req, res) => {
  const db = getFirestore();
  const ref = db.collection('materialRequests').doc(req.params.requestId);
  const snap = await ref.get();

  if (!snap.exists) {
    return sendError(res, 404, 'NOT_FOUND', 'Material request not found.');
  }

  const { status } = req.body || {};
  if (!['pending', 'approved', 'fulfilled', 'rejected'].includes(status)) {
    return sendError(res, 400, 'VALIDATION', 'Invalid status value.');
  }

  await ref.update({
    status,
    updatedAt: new Date().toISOString(),
    updatedBy: { uid: req.caller.uid, name: req.caller.displayName }
  });

  const updatedSnap = await ref.get();
  return res.json({ requestId: ref.id, ...updatedSnap.data() });
});

// Financial Billing Endpoints
// GET /api/admin/billing
router.get('/billing', requireClaims, requireConsoleAccess, async (req, res) => {
  const db = getFirestore();
  const orgId = req.caller.orgId || 'org-welearn';

  // Get student users
  const studentsSnap = await db.collection('users')
    .where('orgId', '==', orgId)
    .where('role', '==', 'student')
    .get();

  const billingSnap = await db.collection('studentBilling').get();
  const billingMap = {};
  billingSnap.docs.forEach(d => {
    billingMap[d.id] = d.data();
  });

  let rows = [];
  for (const docSnap of studentsSnap.docs) {
    const student = docSnap.data();
    const b = billingMap[student.uid] || {};

    const totalTuition = Number(b.totalTuition) || 120000; // Default term tuition in THB
    const amountPaid = Number(b.amountPaid) || 0;
    const remainingBalance = Math.max(0, totalTuition - amountPaid);
    
    let status = b.status;
    if (!status) {
      if (amountPaid >= totalTuition) status = 'paid';
      else if (amountPaid > 0) status = 'partial';
      else status = 'overdue';
    }

    rows.push({
      uid: student.uid,
      studentName: student.displayName || `${student.givenNames || ''} ${student.surname || ''}`.trim() || 'Student',
      email: student.email || '',
      publicId: student.publicId || null,
      cohortId: student.cohortId || 'cohort-w2e',
      totalTuition,
      amountPaid,
      remainingBalance,
      status,
      nextBillingDate: b.nextBillingDate || '2026-11-01'
    });
  }

  if (req.query.status) {
    rows = rows.filter(r => r.status === req.query.status);
  }
  if (req.query.cohortId) {
    rows = rows.filter(r => r.cohortId === req.query.cohortId);
  }
  if (req.query.q) {
    const qStr = String(req.query.q).toLowerCase();
    rows = rows.filter(r =>
      r.studentName.toLowerCase().includes(qStr) ||
      r.email.toLowerCase().includes(qStr) ||
      (r.publicId || '').toLowerCase().includes(qStr)
    );
  }

  const totalRevenue = rows.reduce((sum, r) => sum + r.amountPaid, 0);
  const totalOutstanding = rows.reduce((sum, r) => sum + r.remainingBalance, 0);
  const overdueCount = rows.filter(r => r.status === 'overdue').length;
  const paidCount = rows.filter(r => r.status === 'paid').length;

  const page = paginateArray(rows, req.query.pageToken, req.query.pageSize);

  return res.json({
    items: page.items,
    total: page.total,
    nextPageToken: page.nextPageToken,
    extra: {
      summary: {
        totalRevenue,
        totalOutstanding,
        overdueCount,
        paidCount,
        totalStudents: rows.length
      }
    }
  });
});

// POST /api/admin/billing/:uid/payment
router.post('/billing/:uid/payment', requireClaims, requireAdmin, async (req, res) => {
  const db = getFirestore();
  const studentUid = req.params.uid;
  const { amount, nextBillingDate } = req.body || {};

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return sendError(res, 400, 'VALIDATION', 'Enter a valid payment amount.');
  }

  const billingRef = db.collection('studentBilling').doc(studentUid);
  const snap = await billingRef.get();
  const existing = snap.exists ? snap.data() : {};

  const totalTuition = Number(existing.totalTuition) || 120000;
  const currentPaid = Number(existing.amountPaid) || 0;
  const newAmountPaid = currentPaid + numAmount;
  const remaining = Math.max(0, totalTuition - newAmountPaid);
  const newStatus = remaining === 0 ? 'paid' : 'partial';

  const updated = {
    uid: studentUid,
    totalTuition,
    amountPaid: newAmountPaid,
    remainingBalance: remaining,
    status: newStatus,
    nextBillingDate: nextBillingDate || existing.nextBillingDate || '2026-11-01',
    lastPaymentDate: new Date().toISOString(),
    lastPaymentAmount: numAmount,
    updatedAt: new Date().toISOString(),
    updatedBy: { uid: req.caller.uid, name: req.caller.displayName }
  };

  await billingRef.set(updated, { merge: true });

  // Record payment in transaction history subcollection
  await billingRef.collection('payments').add({
    amount: numAmount,
    createdAt: new Date().toISOString(),
    recordedBy: { uid: req.caller.uid, name: req.caller.displayName }
  });

  return res.json(updated);
});

export default router;
