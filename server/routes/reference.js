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
  const targetOrg = req.caller.orgId || 'org-welearn';
  const snap = await db.collection('cohorts').get();
  let items = snap.docs
    .map((d) => ({ cohortId: d.id, ...d.data() }))
    .filter((c) => {
      if (c.orgId && c.orgId !== targetOrg) return false;
      if (c.hidden || c.status === 'hidden' || c.status === 'inactive') return false;
      const code = (c.code || '').toUpperCase();
      const id = (c.cohortId || '').toLowerCase();
      // Primary cohorts are retired in WeLearn Spark active workflows
      if (code === 'LPRI' || code === 'HPRI' || code === 'WPR' || id.includes('primary') || id === 'cohort-wpr') return false;
      return true;
    });

  // Normalize metadata for active secondary cohorts (WLS & WHS)
  items = items.map((c) => {
    const code = (c.code || (c.cohortId === 'cohort-whs' ? 'WHS' : c.cohortId === 'cohort-wls' ? 'WLS' : '')).toUpperCase();
    if (code === 'WLS' || c.cohortId === 'cohort-wls') {
      return {
        ...c,
        cohortId: c.cohortId || 'cohort-wls',
        code: 'WLS',
        name: typeof c.name === 'string' ? { en: c.name } : (c.name || { en: 'WeLearn Lower Secondary' }),
        ageBands: Array.isArray(c.ageBands) && c.ageBands.length ? c.ageBands.filter((b) => b !== 'primary') : ['13-15'],
        grades: c.grades || [6, 8]
      };
    }
    if (code === 'WHS' || c.cohortId === 'cohort-whs') {
      return {
        ...c,
        cohortId: c.cohortId || 'cohort-whs',
        code: 'WHS',
        name: typeof c.name === 'string' ? { en: c.name } : (c.name || { en: 'WeLearn Higher Secondary' }),
        ageBands: Array.isArray(c.ageBands) && c.ageBands.length ? c.ageBands.filter((b) => b !== 'primary') : ['13-15', '16-18'],
        grades: c.grades || [9, 12]
      };
    }
    return c;
  });

  items.sort((a, b) => {
    if (a.code === 'WLS') return -1;
    if (b.code === 'WLS') return 1;
    return (a.code || '').localeCompare(b.code || '');
  });

  if (items.length === 0) {
    items = [
      { cohortId: 'cohort-wls', code: 'WLS', name: { en: 'WeLearn Lower Secondary' }, ageBands: ['13-15'], grades: [6, 8], status: 'active' },
      { cohortId: 'cohort-whs', code: 'WHS', name: { en: 'WeLearn Higher Secondary' }, ageBands: ['13-15', '16-18'], grades: [9, 12], status: 'active' }
    ];
  }

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
