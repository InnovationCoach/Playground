import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
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

// GET /api/admin/organization
router.get('/organization', requireClaims, requireConsoleAccess, async (req, res) => {
  const db = getFirestore();
  const orgSnap = await db.collection('organizations').doc(req.caller.orgId || 'org-welearn').get();
  if (!orgSnap.exists) {
    return res.json({ orgId: req.caller.orgId || 'org-welearn', name: 'WeLearn', status: 'active', defaultLocale: 'en' });
  }
  return res.json(orgSnap.data());
});

// GET /api/admin/schools
router.get('/schools', requireClaims, requireConsoleAccess, async (req, res) => {
  const db = getFirestore();
  const snap = await db.collection('schools').where('orgId', '==', req.caller.orgId || 'org-welearn').get();
  let items = snap.docs.map((d) => ({ schoolId: d.id, ...d.data() }));

  // Supervisors see only their schools
  if (req.caller.role === 'supervisor') {
    items = items.filter((s) => req.caller.schoolIds.includes(s.schoolId));
  }

  return res.json(paginateArray(items, req.query.pageToken, req.query.pageSize));
});

// GET /api/admin/classes
router.get('/classes', requireClaims, requireConsoleAccess, async (req, res) => {
  const db = getFirestore();
  let query = db.collection('classes').where('orgId', '==', req.caller.orgId || 'org-welearn');
  if (req.query.schoolId) {
    query = query.where('schoolId', '==', req.query.schoolId);
  }

  const snap = await query.get();
  let items = snap.docs.map((d) => ({ classId: d.id, ...d.data() }));

  if (req.caller.role === 'supervisor') {
    items = items.filter((c) => req.caller.schoolIds.includes(c.schoolId));
  }

  return res.json(paginateArray(items, req.query.pageToken, req.query.pageSize));
});

// GET /api/admin/cohorts
router.get('/cohorts', requireClaims, requireConsoleAccess, async (req, res) => {
  const db = getFirestore();
  const snap = await db.collection('cohorts').where('orgId', '==', req.caller.orgId || 'org-welearn').get();
  const items = snap.docs.map((d) => ({ cohortId: d.id, ...d.data() }));
  return res.json(paginateArray(items, req.query.pageToken, req.query.pageSize));
});

// GET /api/admin/programmes
router.get('/programmes', requireClaims, requireConsoleAccess, async (req, res) => {
  const db = getFirestore();
  const snap = await db.collection('programmes').where('orgId', '==', req.caller.orgId || 'org-welearn').get();
  const items = snap.docs.map((d) => ({ programmeId: d.id, ...d.data() }));
  return res.json(paginateArray(items, req.query.pageToken, req.query.pageSize));
});

export default router;
