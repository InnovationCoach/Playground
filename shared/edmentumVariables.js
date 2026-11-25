/**
 * Edmentum Courseware API v2 — Starting Dashboard Variable Contracts & Mappers
 *
 * Maps Edmentum API v2 payloads (https://app.edmentum.com/api/v2/swagger.json)
 * into clean, truthful starting variable sets for:
 *  - Student Dashboard
 *  - Coach Dashboard
 *  - Admin Dashboard
 */

export const EDMENTUM_DASHBOARD_ROLES = Object.freeze(['student', 'coach', 'admin']);

export function computeProgressPercent(completed, total) {
  if (typeof completed !== 'number' || typeof total !== 'number' || !Number.isFinite(completed) || !Number.isFinite(total)) {
    return null;
  }
  if (total <= 0) return null;
  const pct = Math.round((completed / total) * 100);
  return Math.max(0, Math.min(100, pct));
}

function toFullName(user) {
  if (!user || typeof user !== 'object') return '';
  return [user.FirstName, user.LastName].filter(Boolean).join(' ').trim() || user.PlatoName || '';
}

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.Results)) return payload.Results;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function toDateKey(rawDate) {
  if (!rawDate || typeof rawDate !== 'string') return null;
  return rawDate.slice(0, 10);
}

function recordSeconds(rec) {
  if (typeof rec?.TimeOnTaskInMilliseconds === 'number') {
    return Math.round(rec.TimeOnTaskInMilliseconds / 1000);
  }
  if (typeof rec?.TimeOnTask === 'number') {
    return rec.TimeOnTask;
  }
  return 0;
}

/**
 * Starting set of variables for the Student Dashboard.
 */
export function emptyStudentDashboardVariables(providerStatus = 'not_connected', extra = {}) {
  return {
    providerStatus,
    syncedAt: null,
    student: {
      edmentumUserId: null,
      platoName: null,
      fullName: null,
      sisId: null,
      grade: null,
      isActive: null
    },
    summary: {
      enrolledClassCount: 0,
      completedClassCount: 0,
      overallProgressPercent: null,
      averageCurrentGrade: null,
      totalTimeOnTaskSeconds: 0
    },
    enrolledClasses: [],
    graduatedCourses: [],
    dailyTimeOnTask: [],
    recentScores: [],
    ...extra
  };
}

export function mapStudentDashboardVariables({
  user = null,
  classes = [],
  progressByClass = {},
  gradesByClass = {},
  timeOnTaskByClass = {},
  activitiesByClass = {},
  activityScoresByClass = {},
  syncedAt = new Date().toISOString()
} = {}) {
  const edmentumUserId = user?.UserId ?? null;
  const enrolledClasses = [];
  const graduatedCourses = [];
  const dailyMap = new Map();
  const recentScores = [];
  let totalTimeOnTaskSeconds = 0;
  const progressValues = [];
  const gradeValues = [];
  let completedClassCount = 0;

  for (const cls of classes) {
    const classId = cls.ClassId;
    const progressList = toArray(progressByClass[classId]);
    const gradeList = toArray(gradesByClass[classId]);
    const timeList = toArray(timeOnTaskByClass[classId]);
    const activityList = toArray(activitiesByClass[classId]);
    const scoreList = toArray(activityScoresByClass[classId]);

    const myProgress = edmentumUserId != null
      ? progressList.find((p) => p.LearnerUserId === edmentumUserId)
      : progressList[0];
    const myGrade = edmentumUserId != null
      ? gradeList.find((g) => g.LearnerUserId === edmentumUserId)
      : gradeList[0];
    const myTimeRecords = edmentumUserId != null
      ? timeList.filter((t) => t.LearnerUserId === edmentumUserId)
      : timeList;
    const myScores = edmentumUserId != null
      ? scoreList.filter((s) => s.LearnerUserId === edmentumUserId)
      : scoreList;

    let classTimeSeconds = 0;
    for (const rec of myTimeRecords) {
      const sec = recordSeconds(rec);
      classTimeSeconds += sec;
      const date = toDateKey(rec.Date);
      if (date && sec > 0) {
        dailyMap.set(date, (dailyMap.get(date) || 0) + sec);
      }
    }
    totalTimeOnTaskSeconds += classTimeSeconds;

    const activitiesCompleted = myProgress?.ActivitiesCompleted ?? null;
    const activitiesTotal = myProgress?.ActivitiesTotal ?? null;
    const progressPercent = computeProgressPercent(activitiesCompleted, activitiesTotal);
    if (progressPercent !== null) progressValues.push(progressPercent);

    const currentGrade = typeof myGrade?.CurrentGrade === 'number' ? myGrade.CurrentGrade : null;
    const courseGrade = typeof myGrade?.CourseGrade === 'number' ? myGrade.CourseGrade : null;
    if (currentGrade !== null) gradeValues.push(currentGrade);

    const isComplete = Boolean(cls.IsComplete) || progressPercent === 100;
    if (isComplete) completedClassCount += 1;

    const entry = {
      classId,
      programId: cls.ProgramId ?? null,
      name: cls.Name || cls.ResourceNodeName || `Class ${classId}`,
      courseName: cls.ResourceNodeName || cls.Name || null,
      startDate: cls.StartDate ?? null,
      endDate: cls.EndDate ?? null,
      isActive: cls.IsActive ?? true,
      isComplete,
      activitiesCompleted,
      activitiesTotal,
      progressPercent,
      currentGrade,
      courseGrade,
      onTargetGrade: typeof myGrade?.OnTargetGrade === 'number' ? myGrade.OnTargetGrade : null,
      timeOnTaskSeconds: classTimeSeconds,
      masteryTestThreshold: cls.MasteryTestThreshold ?? null
    };
    enrolledClasses.push(entry);

    if (isComplete) {
      graduatedCourses.push({
        classId,
        name: entry.name,
        courseName: entry.courseName,
        endDate: entry.endDate,
        courseGrade: entry.courseGrade ?? entry.currentGrade,
        progressPercent: entry.progressPercent ?? 100
      });
    }

    const activityByNode = new Map(activityList.map((a) => [a.ResourceNodeId, a]));
    for (const s of myScores) {
      const act = activityByNode.get(s.ResourceNodeId);
      recentScores.push({
        classId,
        className: cls.Name || cls.ResourceNodeName || null,
        resourceNodeId: s.ResourceNodeId,
        activityTitle: act?.ActivityTitle || `Activity ${s.ResourceNodeId}`,
        categoryName: act?.GradetrackerCategoryName || null,
        score: s.Score ?? null,
        possibleScore: act?.GradetrackerPossibleScore ?? null,
        scoreDate: s.ScoreDate ?? null
      });
    }
  }

  recentScores.sort((a, b) => {
    const ta = a.scoreDate ? Date.parse(a.scoreDate) : 0;
    const tb = b.scoreDate ? Date.parse(b.scoreDate) : 0;
    return tb - ta;
  });

  const dailyTimeOnTask = Array.from(dailyMap.entries())
    .map(([date, seconds]) => ({
      date,
      seconds,
      minutes: Math.round(seconds / 60)
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  const overallProgressPercent = progressValues.length > 0
    ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
    : null;
  const averageCurrentGrade = gradeValues.length > 0
    ? Math.round((gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length) * 10) / 10
    : null;

  return {
    providerStatus: 'connected',
    syncedAt,
    student: {
      edmentumUserId,
      platoName: user?.PlatoName ?? null,
      fullName: toFullName(user) || null,
      sisId: user?.SisId ?? null,
      grade: user?.Grade ?? null,
      isActive: user?.IsActive ?? null
    },
    summary: {
      enrolledClassCount: enrolledClasses.length,
      completedClassCount,
      overallProgressPercent,
      averageCurrentGrade,
      totalTimeOnTaskSeconds
    },
    enrolledClasses,
    graduatedCourses,
    dailyTimeOnTask,
    recentScores: recentScores.slice(0, 20)
  };
}

/**
 * Starting set of variables for the Coach Dashboard.
 */
export function emptyCoachDashboardVariables(providerStatus = 'not_connected', extra = {}) {
  return {
    providerStatus,
    syncedAt: null,
    program: {
      programId: null,
      programTitle: null
    },
    summary: {
      classCount: 0,
      activeClassCount: 0,
      learnerCount: 0,
      graduatedCourseCount: 0,
      averageProgressPercent: null,
      averageCurrentGrade: null,
      alertCount: 0
    },
    classes: [],
    learners: [],
    graduatedCourses: [],
    dailyTimeOnTask: [],
    alerts: [],
    ...extra
  };
}

export function mapCoachDashboardVariables({
  program = null,
  classDetails = [],
  classUsersByClass = {},
  progressByClass = {},
  gradesByClass = {},
  timeOnTaskByClass = {},
  alertsSummary = [],
  syncedAt = new Date().toISOString()
} = {}) {
  const alertsList = toArray(alertsSummary);
  const alertsByUser = new Map(alertsList.map((a) => [a.UserId, a.AlertSummary]));

  const classes = [];
  const learners = [];
  const graduatedCourses = [];
  const dailyTotals = new Map(); // date -> { seconds, learnerIds: Set }
  const progressValues = [];
  const gradeValues = [];
  const uniqueLearnerIds = new Set();

  for (const cls of classDetails) {
    const classId = cls.ClassId;
    const users = toArray(classUsersByClass[classId]);
    const progressList = toArray(progressByClass[classId]);
    const gradeList = toArray(gradesByClass[classId]);
    const timeList = toArray(timeOnTaskByClass[classId]);

    const progressMap = new Map(progressList.map((p) => [p.LearnerUserId, p]));
    const gradeMap = new Map(gradeList.map((g) => [g.LearnerUserId, g]));

    const classLearners = users.length > 0
      ? users.filter((u) => !u.Role || String(u.Role).toLowerCase().includes('learner') || String(u.Role).toLowerCase().includes('student'))
      : toArray(cls.Learners);

    classes.push({
      classId,
      programId: cls.ProgramId ?? program?.ProgramId ?? null,
      name: cls.Name || `Class ${classId}`,
      resourceNodeName: cls.ResourceNodeName || null,
      startDate: cls.StartDate ?? null,
      endDate: cls.EndDate ?? null,
      isActive: cls.IsActive ?? true,
      learnerCount: classLearners.length,
      teacherCount: Array.isArray(cls.Teachers) ? cls.Teachers.length : 0,
      masteryTestThreshold: cls.MasteryTestThreshold ?? null,
      masteryTestAttempts: cls.MasteryTestAttempts ?? null
    });

    for (const learner of classLearners) {
      const learnerUserId = learner.UserId ?? learner.LearnerUserId;
      if (learnerUserId == null) continue;
      uniqueLearnerIds.add(learnerUserId);

      const prog = progressMap.get(learnerUserId);
      const grade = gradeMap.get(learnerUserId);
      const progressPercent = computeProgressPercent(prog?.ActivitiesCompleted, prog?.ActivitiesTotal);
      if (progressPercent !== null) progressValues.push(progressPercent);

      const currentGrade = typeof grade?.CurrentGrade === 'number' ? grade.CurrentGrade : null;
      const courseGrade = typeof grade?.CourseGrade === 'number' ? grade.CourseGrade : null;
      if (currentGrade !== null) gradeValues.push(currentGrade);

      let timeOnTaskSeconds = 0;
      for (const rec of timeList) {
        if (rec.LearnerUserId !== learnerUserId) continue;
        const sec = recordSeconds(rec);
        timeOnTaskSeconds += sec;
        const date = toDateKey(rec.Date);
        if (date && sec > 0) {
          const entry = dailyTotals.get(date) || { seconds: 0, learnerIds: new Set() };
          entry.seconds += sec;
          entry.learnerIds.add(learnerUserId);
          dailyTotals.set(date, entry);
        }
      }

      const isComplete = Boolean(learner.IsComplete) || progressPercent === 100;
      const fullName = toFullName(learner) || null;

      learners.push({
        learnerUserId,
        platoName: learner.PlatoName ?? null,
        fullName,
        email: learner.EmailAddress ?? null,
        grade: learner.Grade ?? null,
        classId,
        className: cls.Name || null,
        courseName: cls.ResourceNodeName || cls.Name || null,
        isComplete,
        activitiesCompleted: prog?.ActivitiesCompleted ?? null,
        activitiesTotal: prog?.ActivitiesTotal ?? null,
        progressPercent,
        currentGrade,
        courseGrade,
        onTargetGrade: typeof grade?.OnTargetGrade === 'number' ? grade.OnTargetGrade : null,
        timeOnTaskSeconds,
        alertSummary: alertsByUser.get(learnerUserId) ?? null
      });

      if (isComplete) {
        graduatedCourses.push({
          learnerUserId,
          learnerName: fullName || `Learner ${learnerUserId}`,
          classId,
          className: cls.Name || `Class ${classId}`,
          courseName: cls.ResourceNodeName || cls.Name || null,
          endDate: learner.EndDate ?? cls.EndDate ?? null,
          courseGrade: courseGrade ?? currentGrade
        });
      }
    }
  }

  const dailyTimeOnTask = Array.from(dailyTotals.entries())
    .map(([date, info]) => ({
      date,
      seconds: info.seconds,
      minutes: Math.round(info.seconds / 60),
      activeLearners: info.learnerIds.size
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  return {
    providerStatus: 'connected',
    syncedAt,
    program: {
      programId: program?.ProgramId ?? null,
      programTitle: program?.ProgramTitle ?? null
    },
    summary: {
      classCount: classes.length,
      activeClassCount: classes.filter((c) => c.isActive).length,
      learnerCount: uniqueLearnerIds.size,
      graduatedCourseCount: graduatedCourses.length,
      averageProgressPercent: progressValues.length > 0
        ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
        : null,
      averageCurrentGrade: gradeValues.length > 0
        ? Math.round((gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length) * 10) / 10
        : null,
      alertCount: alertsList.length
    },
    classes,
    learners,
    graduatedCourses,
    dailyTimeOnTask,
    alerts: alertsList.map((a) => ({
      userId: a.UserId,
      alertSummary: a.AlertSummary ?? null
    }))
  };
}

/**
 * Starting set of variables for the Admin Dashboard.
 */
export function emptyAdminDashboardVariables(providerStatus = 'not_connected', extra = {}) {
  return {
    providerStatus,
    syncedAt: null,
    summary: {
      programCount: 0,
      locationCount: 0,
      totalUsers: 0,
      activeUsers: 0,
      learnerCount: 0,
      instructorCount: 0,
      adminCount: 0,
      totalClasses: 0,
      activeClasses: 0,
      graduatedCourseCount: 0,
      totalTimeOnSystemSeconds: 0
    },
    programs: [],
    locations: [],
    graduatedCourses: [],
    timeOnSystem: [],
    ...extra
  };
}

export function mapAdminDashboardVariables({
  programs = [],
  locations = null,
  users = [],
  classes = [],
  classUsersByClass = {},
  timeOnSystem = [],
  syncedAt = new Date().toISOString()
} = {}) {
  const programList = toArray(programs);
  const userList = toArray(users);
  const classList = toArray(classes);
  const timeList = toArray(timeOnSystem);

  const locationItems = Array.isArray(locations)
    ? locations
    : (Array.isArray(locations?.Locations) ? locations.Locations : (locations ? [locations] : []));

  let activeUsers = 0;
  let learnerCount = 0;
  let instructorCount = 0;
  let adminCount = 0;

  for (const u of userList) {
    if (u.IsActive) activeUsers += 1;
    const role = String(u.Role || '').toLowerCase();
    if (role.includes('learner') || role.includes('student')) learnerCount += 1;
    else if (role.includes('instructor') || role.includes('teacher') || role.includes('coach')) instructorCount += 1;
    else if (role.includes('admin')) adminCount += 1;
  }

  const graduatedCourses = [];
  for (const cls of classList) {
    const classUsers = toArray(classUsersByClass[cls.ClassId]);
    for (const u of classUsers) {
      if (u.IsComplete) {
        graduatedCourses.push({
          learnerUserId: u.UserId,
          learnerName: toFullName(u) || `Learner ${u.UserId}`,
          classId: cls.ClassId,
          className: cls.Name || `Class ${cls.ClassId}`,
          courseName: cls.ResourceNodeName || cls.Name || null,
          endDate: u.EndDate ?? cls.EndDate ?? null
        });
      }
    }
  }

  const totalTimeOnSystemSeconds = timeList.reduce(
    (sum, r) => sum + (typeof r.TimeOnSystemSeconds === 'number' ? r.TimeOnSystemSeconds : 0),
    0
  );

  return {
    providerStatus: 'connected',
    syncedAt,
    summary: {
      programCount: programList.length,
      locationCount: locationItems.length,
      totalUsers: userList.length,
      activeUsers,
      learnerCount,
      instructorCount,
      adminCount,
      totalClasses: classList.length,
      activeClasses: classList.filter((c) => c.IsActive).length,
      graduatedCourseCount: graduatedCourses.length,
      totalTimeOnSystemSeconds
    },
    programs: programList.map((p) => ({
      programId: p.ProgramId,
      programTitle: p.ProgramTitle,
      application: p.Application ?? null,
      accessType: p.AccessType ?? null,
      isEOAProgram: Boolean(p.IsEOAProgram),
      locations: p.Locations ?? []
    })),
    locations: locationItems,
    graduatedCourses,
    timeOnSystem: timeList.slice(0, 100).map((t) => ({
      userId: t.UserId,
      date: t.Date ?? null,
      timeOnSystemSeconds: t.TimeOnSystemSeconds ?? 0
    }))
  };
}
