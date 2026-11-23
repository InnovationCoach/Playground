/**
 * Edmentum Courseware API v2 Server Routes
 *
 * Server-authoritative integration for Student, Coach, and Admin dashboards.
 * Credentials stay strictly on the server (.env / .env.edmentum).
 * When credentials are not configured yet, endpoints return truthful
 * `providerStatus: 'not_connected'` payloads with empty starting variables.
 */

import { Router } from 'express';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { schoolCaller, staff, adminOnly, fail } from '../lib/schoolScope.js';
import { edmentumClient } from '../lib/edmentumClient.js';
import {
  emptyStudentDashboardVariables,
  emptyCoachDashboardVariables,
  emptyAdminDashboardVariables,
  mapStudentDashboardVariables,
  mapCoachDashboardVariables,
  mapAdminDashboardVariables
} from '../../shared/edmentumVariables.js';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.Results)) return payload.Results;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function defaultStartDateIso(daysBack = 30) {
  const d = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

async function resolveProgram(client, requestedProgramId) {
  const programsPayload = await client.getPrograms();
  const programs = toArray(programsPayload);
  const targetId = requestedProgramId || client.defaultProgramId;
  if (targetId) {
    const match = programs.find((p) => String(p.ProgramId) === String(targetId));
    return { program: match || { ProgramId: Number(targetId) || targetId, ProgramTitle: null }, programs };
  }
  return { program: programs[0] || null, programs };
}

const DASHBOARD_CACHE_TTL_MS = 60_000;
const responseCache = new Map();

function getCached(key) {
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.at < DASHBOARD_CACHE_TTL_MS) {
    return entry.value;
  }
  responseCache.delete(key);
  return null;
}

function setCached(key, value) {
  if (responseCache.size > 200) responseCache.clear();
  responseCache.set(key, { value, at: Date.now() });
  return value;
}

function clearEdmentumCache() {
  responseCache.clear();
}

export function createEdmentumRouter({ client = edmentumClient } = {}) {
  const router = Router();
  router.use(requireClaims);

  /**
   * GET /api/edmentum/status
   * Returns configuration & connection readiness without exposing secrets.
   */
  router.get('/status', async (req, res) => {
    try {
      await schoolCaller(req);
      const status = client.getConfigStatus();
      return res.json({
        providerStatus: status.configured ? 'connected' : 'not_connected',
        ...status
      });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * GET /api/edmentum/student/dashboard
   * Starting set of variables for the Student Dashboard.
   */
  router.get('/student/dashboard', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      const status = client.getConfigStatus();
      if (!status.configured) {
        return res.json(
          emptyStudentDashboardVariables('not_connected', { missingVariables: status.missingVariables })
        );
      }

      const isStaffOrAdmin = staff(caller) || caller.role === 'admin';
      const requestedUserId = isStaffOrAdmin ? req.query?.edmentumUserId : null;
      const requestedSisId = isStaffOrAdmin ? req.query?.sisId : null;
      const cacheKey = `student:${requestedUserId || requestedSisId || caller.uid}:${req.query?.programId || ''}:${req.query?.classId || ''}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);

      let edmentumUser = null;
      const explicitUserId = requestedUserId || caller.profile?.edmentumUserId;
      if (explicitUserId) {
        edmentumUser = await client.getUserById(explicitUserId).catch(() => null);
      }
      if (!edmentumUser) {
        const sisLookup = requestedSisId || caller.profile?.sisId || caller.uid;
        const usersPayload = await client.getUsers({ sisId: sisLookup, pageSize: 10 }).catch(() => null);
        const matches = toArray(usersPayload);
        edmentumUser = matches[0] || null;
      }
      if (!edmentumUser) {
        const email = String(caller.profile?.email || '').trim().toLowerCase();
        const plato = String(caller.profile?.edmentumPlatoName || '').trim().toLowerCase();
        if (email || plato) {
          const allUsers = toArray(await client.getUsers({ pageSize: 200 }).catch(() => []));
          edmentumUser = allUsers.find((u) =>
            (email && String(u.EmailAddress || '').trim().toLowerCase() === email) ||
            (plato && String(u.PlatoName || '').trim().toLowerCase() === plato)
          ) || null;
        }
      }

      const { programs } = await resolveProgram(client, req.query?.programId);
      const targetPrograms = req.query?.programId
        ? programs.filter((p) => String(p.ProgramId) === String(req.query.programId))
        : programs.filter((p) => p.Application === 3 || String(p.ProgramId) === String(client.defaultProgramId));
      const programList = targetPrograms.length > 0 ? targetPrograms : programs.slice(0, 2);

      let classes = [];
      for (const prog of programList) {
        const detailsPayload = await client.getProgramClassDetails(prog.ProgramId, { pageSize: 100 }).catch(() => []);
        classes.push(...toArray(detailsPayload));
      }
      const targetClassId = req.query?.classId || client.defaultClassId;
      if (targetClassId) {
        classes = classes.filter((c) => String(c.ClassId) === String(targetClassId));
      }

      const getLearnerId = (entry) => (
        entry != null && typeof entry === 'object'
          ? (entry.UserId ?? entry.LearnerUserId)
          : entry
      );

      // Pre-filter using ClassDetail.Learners so we only fetch metrics for enrolled classes
      if (edmentumUser?.UserId != null) {
        classes = classes.filter((cls) => {
          if (!Array.isArray(cls.Learners)) return true;
          return cls.Learners.some((l) => Number(getLearnerId(l)) === Number(edmentumUser.UserId));
        });
      }

      const enrolledClasses = [];
      const progressByClass = {};
      const gradesByClass = {};
      const timeOnTaskByClass = {};
      const activitiesByClass = {};
      const activityScoresByClass = {};

      for (const cls of classes.slice(0, 20)) {
        const cid = cls.ClassId;
        const learnersList = Array.isArray(cls.Learners)
          ? cls.Learners
          : toArray(await client.getClassUsers(cid).catch(() => []));
        const assignment = edmentumUser?.UserId != null
          ? learnersList.find((u) => Number(getLearnerId(u)) === Number(edmentumUser.UserId))
          : null;

        if (edmentumUser?.UserId != null && learnersList.length > 0 && !assignment) {
          continue;
        }

        const isComplete = assignment && typeof assignment === 'object' ? Boolean(assignment.IsComplete) : false;
        enrolledClasses.push({ ...cls, IsComplete: isComplete });

        const [progress, grades, timeOnTask, activities, scores] = await Promise.all([
          client.getClassProgress(cid).catch(() => []),
          client.getClassGrades(cid).catch(() => []),
          client.getClassTimeOnTask(cid, { startDate: req.query?.startDate || defaultStartDateIso(30) }).catch(() => []),
          client.getClassActivities(cid).catch(() => []),
          client.getClassActivityScores(cid, {
            learnerUserId: edmentumUser?.UserId ?? undefined
          }).catch(() => [])
        ]);

        progressByClass[cid] = progress;
        gradesByClass[cid] = grades;
        timeOnTaskByClass[cid] = timeOnTask;
        activitiesByClass[cid] = activities;
        activityScoresByClass[cid] = scores;
      }

      return res.json(setCached(cacheKey, {
        edmentumPortalUrl: process.env.EDMENTUM_PORTAL_URL || 'https://f1.apps.elf.edmentum.com/courseware',
        ...mapStudentDashboardVariables({
          user: edmentumUser,
          classes: enrolledClasses,
          progressByClass,
          gradesByClass,
          timeOnTaskByClass,
          activitiesByClass,
          activityScoresByClass
        })
      }));
    } catch (err) {
      if (err.code?.startsWith('EDMENTUM_')) {
        return res.json(
          emptyStudentDashboardVariables('sync_failed', {
            error: { code: err.code, message: err.message }
          })
        );
      }
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * GET /api/edmentum/coach/dashboard
   * Starting set of variables for the Coach Dashboard.
   */
  router.get('/coach/dashboard', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      if (!staff(caller) && caller.role !== 'admin') {
        fail(403, 'FORBIDDEN', 'Coach or administrator access required.');
      }

      const status = client.getConfigStatus();
      if (!status.configured) {
        return res.json(
          emptyCoachDashboardVariables('not_connected', { missingVariables: status.missingVariables })
        );
      }

      const coachCacheKey = `coach:${req.query?.programId || 'auto'}:${req.query?.classId || 'all'}:${req.query?.startDate || '30d'}`;
      if (req.query?.refresh !== '1') {
        const cached = getCached(coachCacheKey);
        if (cached) return res.json(cached);
      }

      const { programs } = await resolveProgram(client, req.query?.programId);
      const targetPrograms = req.query?.programId
        ? programs.filter((p) => String(p.ProgramId) === String(req.query.programId))
        : programs.filter((p) => p.Application === 3);
      const programList = targetPrograms.length > 0 ? targetPrograms : programs.slice(0, 2);
      if (programList.length === 0) {
        return res.json(emptyCoachDashboardVariables('connected'));
      }

      const program = programList.length === 1
        ? programList[0]
        : {
            ProgramId: programList.map((p) => p.ProgramId).join(','),
            ProgramTitle: programList.map((p) => p.ProgramTitle).filter(Boolean).join(' + ')
          };

      let classDetails = [];
      for (const prog of programList) {
        const details = toArray(
          await client.getProgramClassDetails(prog.ProgramId, { pageSize: 100 }).catch(() => [])
        );
        classDetails.push(...details);
      }

      const targetClassId = req.query?.classId || client.defaultClassId;
      if (targetClassId) {
        classDetails = classDetails.filter((c) => String(c.ClassId) === String(targetClassId));
      } else {
        // Keep active classes that actually have learners enrolled so we cover all learners fast
        const populated = classDetails.filter((c) => c.IsActive !== false && (!Array.isArray(c.Learners) || c.Learners.length > 0));
        if (populated.length > 0) classDetails = populated;
      }

      const classUsersByClass = {};
      const progressByClass = {};
      const gradesByClass = {};
      const timeOnTaskByClass = {};
      const startDate = req.query?.startDate || defaultStartDateIso(30);

      for (let i = 0; i < classDetails.length; i += 15) {
        const batch = classDetails.slice(i, i + 15);
        await Promise.all(
          batch.map(async (cls) => {
            const cid = cls.ClassId;
            const [users, progress, grades, timeOnTask] = await Promise.all([
              client.getClassUsers(cid).catch(() => []),
              client.getClassProgress(cid).catch(() => []),
              client.getClassGrades(cid).catch(() => []),
              client.getClassTimeOnTask(cid, { startDate }).catch(() => [])
            ]);
            classUsersByClass[cid] = users;
            progressByClass[cid] = progress;
            gradesByClass[cid] = grades;
            timeOnTaskByClass[cid] = timeOnTask;
          })
        );
      }

      const alertBatches = await Promise.all(
        programList.map((p) => client.getAlertsSummary(p.ProgramId).catch(() => []))
      );
      const alertsSummary = alertBatches.flatMap((b) => toArray(b));

      return res.json(
        setCached(
          coachCacheKey,
          mapCoachDashboardVariables({
            program,
            classDetails,
            classUsersByClass,
            progressByClass,
            gradesByClass,
            timeOnTaskByClass,
            alertsSummary
          })
        )
      );
    } catch (err) {
      if (err.code?.startsWith('EDMENTUM_')) {
        return res.json(
          emptyCoachDashboardVariables('sync_failed', {
            error: { code: err.code, message: err.message }
          })
        );
      }
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * GET /api/edmentum/admin/dashboard
   * Starting set of variables for the Admin Dashboard.
   */
  router.get('/admin/dashboard', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      adminOnly(caller);

      const status = client.getConfigStatus();
      if (!status.configured) {
        return res.json(
          emptyAdminDashboardVariables('not_connected', { missingVariables: status.missingVariables })
        );
      }

      const adminCacheKey = `admin:${req.query?.programId || 'auto'}:${req.query?.startDate || '30d'}`;
      if (req.query?.refresh !== '1') {
        const cached = getCached(adminCacheKey);
        if (cached) return res.json(cached);
      }

      const startDate = req.query?.startDate || defaultStartDateIso(30);
      const [programs, locations, users, timeOnSystem] = await Promise.all([
        client.getPrograms(),
        client.getLocations().catch(() => null),
        client.getUsers({ pageSize: 100 }).catch(() => []),
        client.getTimeOnSystem({ startDate, pageSize: 100 }).catch(() => [])
      ]);

      const programList = toArray(programs);
      const targetProgramId = req.query?.programId || client.defaultProgramId || programList[0]?.ProgramId;
      const classesPayload = targetProgramId
        ? await client.getProgramClasses(targetProgramId, { pageSize: 100 }).catch(() => [])
        : [];
      const classList = toArray(classesPayload);
      const classUsersByClass = {};
      await Promise.all(
        classList.slice(0, 10).map(async (cls) => {
          classUsersByClass[cls.ClassId] = await client.getClassUsers(cls.ClassId).catch(() => []);
        })
      );

      return res.json(
        setCached(
          adminCacheKey,
          mapAdminDashboardVariables({
            programs,
            locations,
            users,
            classes: classList,
            classUsersByClass,
            timeOnSystem
          })
        )
      );
    } catch (err) {
      if (err.code?.startsWith('EDMENTUM_')) {
        return res.json(
          emptyAdminDashboardVariables('sync_failed', {
            error: { code: err.code, message: err.message }
          })
        );
      }
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * GET /api/edmentum/programs
   * Lists Edmentum programs accessible to the configured API account.
   */
  router.get('/programs', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      if (!staff(caller) && caller.role !== 'admin') {
        fail(403, 'FORBIDDEN', 'Coach or administrator access required.');
      }
      const status = client.getConfigStatus();
      if (!status.configured) {
        return res.json({ providerStatus: 'not_connected', programs: [], missingVariables: status.missingVariables });
      }
      const programs = toArray(await client.getPrograms());
      return res.json({ providerStatus: 'connected', programs });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * GET /api/edmentum/classes/:classId/gradetracker
   * Returns progress, grades, activities, scores, and timeOnTask for a class.
   */
  router.get('/classes/:classId/gradetracker', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      if (!staff(caller) && caller.role !== 'admin') {
        fail(403, 'FORBIDDEN', 'Coach or administrator access required.');
      }
      const { classId } = req.params;
      const status = client.getConfigStatus();
      if (!status.configured) {
        return res.json({ providerStatus: 'not_connected', classId, missingVariables: status.missingVariables });
      }

      const [progress, grades, activities, activityScores, timeOnTask] = await Promise.all([
        client.getClassProgress(classId),
        client.getClassGrades(classId),
        client.getClassActivities(classId),
        client.getClassActivityScores(classId, { learnerUserId: req.query?.learnerUserId }),
        client.getClassTimeOnTask(classId, { startDate: req.query?.startDate || defaultStartDateIso(30) })
      ]);

      return res.json({
        providerStatus: 'connected',
        classId,
        progress: toArray(progress),
        grades: toArray(grades),
        activities: toArray(activities),
        activityScores: toArray(activityScores),
        timeOnTask: toArray(timeOnTask)
      });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * GET /api/edmentum/resourcenodes
   * Lists top-level Courseware resource nodes.
   */
  router.get('/resourcenodes', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      if (!staff(caller) && caller.role !== 'admin') {
        fail(403, 'FORBIDDEN', 'Coach or administrator access required.');
      }
      const nodes = toArray(await client.getResourceNodes());
      return res.json({ providerStatus: 'connected', resourceNodes: nodes });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * GET /api/edmentum/resourcenodes/:resourceNodeId
   * Lists immediate child resource nodes for a Courseware resource node.
   */
  router.get('/resourcenodes/:resourceNodeId', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      if (!staff(caller) && caller.role !== 'admin') {
        fail(403, 'FORBIDDEN', 'Coach or administrator access required.');
      }
      const nodes = toArray(await client.getResourceNodeChildren(req.params.resourceNodeId));
      return res.json({ providerStatus: 'connected', resourceNodeId: req.params.resourceNodeId, children: nodes });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * PUT /api/edmentum/classes/:classId/resourcenodes/:resourceNodeId/status
   * Lock or unlock a content node for an entire Courseware class.
   */
  router.put('/classes/:classId/resourcenodes/:resourceNodeId/status', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      if (!staff(caller) && caller.role !== 'admin') {
        fail(403, 'FORBIDDEN', 'Coach or administrator access required.');
      }
      if (typeof req.body?.isLocked !== 'boolean') {
        fail(400, 'INVALID_ARGUMENT', 'Boolean isLocked is required.');
      }
      const { classId, resourceNodeId } = req.params;
      const result = await client.setClassResourceNodeStatus(classId, resourceNodeId, {
        isLocked: req.body.isLocked
      });
      clearEdmentumCache();
      return res.json({
        ok: true,
        classId,
        resourceNodeId,
        isLocked: req.body.isLocked,
        result
      });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * PUT /api/edmentum/classes/:classId/users/:userId/resourcenodes/:resourceNodeId/status
   * Lock or unlock a content node for a specific learner in a Courseware class.
   */
  router.put('/classes/:classId/users/:userId/resourcenodes/:resourceNodeId/status', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      if (!staff(caller) && caller.role !== 'admin') {
        fail(403, 'FORBIDDEN', 'Coach or administrator access required.');
      }
      if (typeof req.body?.isLocked !== 'boolean') {
        fail(400, 'INVALID_ARGUMENT', 'Boolean isLocked is required.');
      }
      const { classId, userId, resourceNodeId } = req.params;
      const result = await client.setClassUserResourceNodeStatus(classId, userId, resourceNodeId, {
        isLocked: req.body.isLocked
      });
      clearEdmentumCache();
      return res.json({
        ok: true,
        classId,
        userId,
        resourceNodeId,
        isLocked: req.body.isLocked,
        result
      });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * GET /api/edmentum/classes/:classId/enrollableusers
   * Lists users eligible to be enrolled in a Courseware class.
   */
  router.get('/classes/:classId/enrollableusers', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      if (!staff(caller) && caller.role !== 'admin') {
        fail(403, 'FORBIDDEN', 'Coach or administrator access required.');
      }
      const users = toArray(
        await client.getEnrollableUsers(req.params.classId, {
          pageSize: Number(req.query?.pageSize) || 100,
          skip: Number(req.query?.skip) || 0
        })
      );
      return res.json({ providerStatus: 'connected', classId: req.params.classId, users });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * POST /api/edmentum/classes/:classId/users/:userId
   * Enroll a user into a Courseware class.
   */
  router.post('/classes/:classId/users/:userId', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      if (!staff(caller) && caller.role !== 'admin') {
        fail(403, 'FORBIDDEN', 'Coach or administrator access required.');
      }
      const { classId, userId } = req.params;
      const result = await client.enrollUserInClass(classId, userId, {
        startDate: req.body?.startDate,
        endDate: req.body?.endDate
      });
      clearEdmentumCache();
      return res.status(201).json({ ok: true, classId, userId, result });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * PUT /api/edmentum/classes/:classId/users/:userId
   * Update start/end dates for a user's Courseware class enrollment.
   */
  router.put('/classes/:classId/users/:userId', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      if (!staff(caller) && caller.role !== 'admin') {
        fail(403, 'FORBIDDEN', 'Coach or administrator access required.');
      }
      const { classId, userId } = req.params;
      const result = await client.updateClassUserDates(classId, userId, {
        startDate: req.body?.startDate,
        endDate: req.body?.endDate
      });
      clearEdmentumCache();
      return res.json({ ok: true, classId, userId, result });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * DELETE /api/edmentum/classes/:classId/users/:userId
   * Withdraw a user from a Courseware class.
   */
  router.delete('/classes/:classId/users/:userId', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      if (!staff(caller) && caller.role !== 'admin') {
        fail(403, 'FORBIDDEN', 'Coach or administrator access required.');
      }
      const { classId, userId } = req.params;
      const result = await client.withdrawUserFromClass(classId, userId);
      clearEdmentumCache();
      return res.json({ ok: true, classId, userId, result });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * POST /api/edmentum/classes/:classId/transfer
   * Transfer a learner from sourceClassroomId into :classId.
   */
  router.post('/classes/:classId/transfer', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      if (!staff(caller) && caller.role !== 'admin') {
        fail(403, 'FORBIDDEN', 'Coach or administrator access required.');
      }
      const { learnerUserId, sourceClassroomId } = req.body || {};
      if (!learnerUserId || !sourceClassroomId) {
        fail(400, 'INVALID_ARGUMENT', 'learnerUserId and sourceClassroomId are required.');
      }
      const result = await client.transferClassUser(req.params.classId, {
        learnerUserId,
        sourceClassroomId
      });
      clearEdmentumCache();
      return res.json({ ok: true, targetClassId: req.params.classId, learnerUserId, sourceClassroomId, result });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * POST /api/edmentum/users
   * Create an Edmentum user (AdminCenter v2.0).
   */
  router.post('/users', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      adminOnly(caller);
      const { PlatoName, FirstName, LastName, Role, Grade, Password } = req.body || {};
      if (!PlatoName || !FirstName || !LastName || !Role || Grade === undefined || !Password) {
        fail(400, 'INVALID_ARGUMENT', 'PlatoName, FirstName, LastName, Role, Grade, and Password are required.');
      }
      const result = await client.createUser(req.body);
      clearEdmentumCache();
      return res.status(201).json({ ok: true, user: result });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * PUT /api/edmentum/users
   * Update an existing Edmentum user (AdminCenter v2.0).
   */
  router.put('/users', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      adminOnly(caller);
      if (!req.body?.UserId || !req.body?.PlatoName) {
        fail(400, 'INVALID_ARGUMENT', 'UserId and PlatoName are required.');
      }
      const result = await client.updateUser(req.body);
      clearEdmentumCache();
      return res.json({ ok: true, user: result });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  /**
   * DELETE /api/edmentum/users/:userId
   * Delete an Edmentum user (AdminCenter v2.0).
   */
  router.delete('/users/:userId', async (req, res) => {
    try {
      const caller = await schoolCaller(req);
      adminOnly(caller);
      const result = await client.deleteUser(req.params.userId);
      clearEdmentumCache();
      return res.json({ ok: true, userId: req.params.userId, result });
    } catch (err) {
      return sendError(res, err.status || 500, err.code || 'INTERNAL', err.message);
    }
  });

  return router;
}

export default createEdmentumRouter();
