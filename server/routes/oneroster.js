import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { edmentumClient } from '../lib/edmentumClient.js';

const router = Router();

function requireOneRosterAccess(req, res, next) {
  if (!req.caller || !['admin', 'supervisor'].includes(req.caller.role)) {
    return sendError(res, 403, 'FORBIDDEN', 'OneRoster endpoints are restricted to administrators.');
  }
  const tokenOrgId = req.caller.signedClaims?.orgId || req.callerUserData?.orgId;
  if (!tokenOrgId || typeof tokenOrgId !== 'string') {
    return sendError(res, 403, 'FORBIDDEN', 'Explicit organization context required for OneRoster.');
  }
  req.onerosterOrgId = tokenOrgId;
  next();
}

router.use(requireClaims);
router.use(requireOneRosterAccess);

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.Data)) return payload.Data;
  return [];
}

async function resolveTargetProgramId(req) {
  if (req.query?.programId) return String(req.query.programId);
  if (edmentumClient.defaultProgramId) return String(edmentumClient.defaultProgramId);
  const programs = toArray(await edmentumClient.getPrograms());
  const courseware = programs.find((p) => p.Application === 3) || programs[0];
  return courseware?.ProgramId != null ? String(courseware.ProgramId) : null;
}

/**
 * GET /api/oneroster/v1p1/users
 */
router.get('/users', async (req, res) => {
  try {
    const db = getFirestore();
    const orgId = req.onerosterOrgId;
    const snap = await db.collection('users').where('orgId', '==', orgId).limit(200).get();
    if (!snap.empty) {
      const users = snap.docs.map((doc) => {
        const d = doc.data();
        const parts = String(d.displayName || '').trim().split(/\s+/).filter(Boolean);
        return {
          sourcedId: doc.id,
          status: d.status === 'inactive' ? 'tobedeleted' : 'active',
          dateLastModified: d.updatedAt || new Date().toISOString(),
          enabledUser: d.status !== 'inactive',
          orgSourcedIds: [orgId],
          role: d.role === 'teacher' || d.role === 'coach' ? 'teacher' : (d.role === 'admin' ? 'administrator' : 'student'),
          username: d.edmentumPlatoName || d.email?.split('@')[0] || doc.id,
          userIds: d.edmentumUserId ? [{ type: 'Edmentum', identifier: String(d.edmentumUserId) }] : [],
          givenName: parts[0] || d.firstName || 'User',
          familyName: parts.slice(1).join(' ') || d.lastName || '',
          email: d.email || ''
        };
      });
      return res.json({ users });
    }
    return res.json({ users: [] });
  } catch (err) {
    return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message || 'Unable to load OneRoster users.');
  }
});

/**
 * GET /api/oneroster/v1p1/classes
 */
router.get('/classes', async (req, res) => {
  if (!edmentumClient.isConfigured()) {
    return res.json({ classes: [] });
  }
  try {
    const programId = await resolveTargetProgramId(req);
    if (!programId) return res.json({ classes: [] });
    const rawClasses = toArray(await edmentumClient.getProgramClassDetails(programId, { pageSize: 100 }));
    const nowIso = new Date().toISOString();
    const classes = rawClasses.map((c) => ({
      sourcedId: String(c.ClassId),
      status: c.IsActive === false ? 'tobedeleted' : 'active',
      dateLastModified: nowIso,
      title: c.Name || c.CourseName || `Class ${c.ClassId}`,
      classCode: String(c.ClassId),
      classType: 'scheduled',
      courseSourcedId: c.CourseId != null ? String(c.CourseId) : String(c.ClassId),
      schoolSourcedId: req.onerosterOrgId,
      termSourcedIds: []
    }));
    return res.json({ classes });
  } catch (err) {
    return sendError(res, err.status || 502, err.code || 'EDMENTUM_API_ERROR', err.message || 'Unable to load OneRoster classes.');
  }
});

/**
 * GET /api/oneroster/v1p1/enrollments
 */
router.get('/enrollments', async (req, res) => {
  if (!edmentumClient.isConfigured()) {
    return res.json({ enrollments: [] });
  }
  try {
    const programId = await resolveTargetProgramId(req);
    if (!programId) return res.json({ enrollments: [] });
    const rawClasses = toArray(await edmentumClient.getProgramClassDetails(programId, { pageSize: 100 }));
    const nowIso = new Date().toISOString();
    const enrollments = [];
    for (const cls of rawClasses) {
      for (const learner of Array.isArray(cls.Learners) ? cls.Learners : []) {
        if (learner?.UserId == null) continue;
        enrollments.push({
          sourcedId: `enr-${cls.ClassId}-${learner.UserId}`,
          status: 'active',
          dateLastModified: nowIso,
          userSourcedId: String(learner.UserId),
          classSourcedId: String(cls.ClassId),
          schoolSourcedId: req.onerosterOrgId,
          role: 'student',
          primary: true
        });
      }
      for (const instructor of Array.isArray(cls.Instructors) ? cls.Instructors : []) {
        if (instructor?.UserId == null) continue;
        enrollments.push({
          sourcedId: `enr-${cls.ClassId}-t-${instructor.UserId}`,
          status: 'active',
          dateLastModified: nowIso,
          userSourcedId: String(instructor.UserId),
          classSourcedId: String(cls.ClassId),
          schoolSourcedId: req.onerosterOrgId,
          role: 'teacher',
          primary: true
        });
      }
    }
    return res.json({ enrollments });
  } catch (err) {
    return sendError(res, err.status || 502, err.code || 'EDMENTUM_API_ERROR', err.message || 'Unable to load OneRoster enrollments.');
  }
});

/**
 * GET /api/oneroster/v1p1/courses
 */
router.get('/courses', async (req, res) => {
  if (!edmentumClient.isConfigured()) {
    return res.json({ courses: [] });
  }
  try {
    const programId = await resolveTargetProgramId(req);
    if (!programId) return res.json({ courses: [] });
    const rawClasses = toArray(await edmentumClient.getProgramClassDetails(programId, { pageSize: 100 }));
    const byCourse = new Map();
    for (const c of rawClasses) {
      const courseId = String(c.CourseId ?? c.ClassId);
      if (!byCourse.has(courseId)) {
        byCourse.set(courseId, {
          sourcedId: courseId,
          status: c.IsActive === false ? 'tobedeleted' : 'active',
          title: c.CourseName || c.Name || `Course ${courseId}`,
          courseCode: courseId,
          orgSourcedId: req.onerosterOrgId
        });
      }
    }
    return res.json({ courses: Array.from(byCourse.values()) });
  } catch (err) {
    return sendError(res, err.status || 502, err.code || 'EDMENTUM_API_ERROR', err.message || 'Unable to load OneRoster courses.');
  }
});

export default router;
