import { FOCUS_SKILLS, SHOW_HOW, STRENGTHS, SUPPORTS } from '../goals/goalPlan.js';
import { nextGoalStep, programJourney, startHere } from './learningGuidance.js';

const SLIDE_LABELS = {
  daily: 'My Quests',
  find: 'Find a Quest',
  progress: 'My Progress',
  creative: 'My Space',
  universe: 'My Universe'
};

const labelFor = (list, id) => list.find((item) => item.id === id)?.label || null;

/**
 * Build a compact, live snapshot of the student's dashboard state (PBL courses,
 * term project, personal goals, today's checklist, strengths, and focus skill)
 * for the Smart Learning Assistant.
 */
export function buildDashboardAssistantContext({
  activeSlide = 'daily',
  studentName = '',
  profile = null,
  prefs = null,
  data = { state: 'loading', courses: [], warnings: [] },
  project = null,
  plan = { goals: [], strengths: [], supports: [], focus: null },
  model = { today: [], ticked: new Set(), skill: null },
  signals = null,
  edmentum = null,
  edmentumStatus = 'unknown',
  learningContext = null,
  coachFeedback = [],
  goalsLoaded = true,
  focusText = null
} = {}) {
  const tab = SLIDE_LABELS[activeSlide] || activeSlide || 'My Quests';

  const pblCourses = (data?.courses || []).slice(0, 3).map((course) => {
    const journey = programJourney(course);
    return {
      id: course.program?.id || '',
      title: course.program?.title || 'PBL Project',
      progressPct: Number.isFinite(course.summary?.pct) ? course.summary.pct : null,
      currentStage: journey.current?.title || null,
      nextStep: course.summary?.next?.title || null,
      nextTask: journey.task || null,
      evidenceToCollect: journey.evidence || null
    };
  });

  const hasTermProject = Boolean(
    project?.updatedAt ||
    (project?.problem?.hmw || '').trim() ||
    (project?.evidence || []).length > 0
  );

  const checks = Array.isArray(model?.checks) ? model.checks : [];
  const termProject = hasTermProject
    ? {
        termId: project.termId || '',
        currentPhase: project.currentPhase || 'spark',
        hmw: (project.problem?.hmw || '').trim(),
        who: (project.problem?.who || '').trim(),
        why: (project.problem?.why || '').trim(),
        impact: project.impact || null,
        evidenceCount: (project.evidence || []).length,
        checksPassed: checks.filter((c) => c.done).length,
        checksTotal: checks.length
      }
    : null;

  const goals = (plan?.goals || []).slice(0, 4).map((goal) => {
    const steps = Array.isArray(goal.steps) ? goal.steps : [];
    const next = nextGoalStep(goal);
    return {
      explore: goal.explore,
      category: goal.category || goal.goalType || null,
      showHow: labelFor(SHOW_HOW, goal.showHow),
      done: goal.done === true,
      stepsDone: steps.filter((s) => s.done).length,
      stepsTotal: steps.length,
      nextStep: next?.text || null
    };
  });

  const today = Array.isArray(model?.today) ? model.today : [];
  const ticked = model?.ticked instanceof Set ? model.ticked : new Set();
  const remainingToday = today.filter((item) => !ticked.has(item.id)).map((item) => item.text);

  const focusSkill = plan?.focus?.skill
    ? {
        skill: labelFor(FOCUS_SKILLS, plan.focus.skill) || plan.focus.skill,
        habit: plan.focus.habit || ''
      }
    : null;

  const strengths = (plan?.strengths || [])
    .map((id) => labelFor(STRENGTHS, id))
    .filter(Boolean)
    .slice(0, 4);

  const supports = (plan?.supports || [])
    .map((id) => labelFor(SUPPORTS, id))
    .filter(Boolean)
    .slice(0, 4);

  const recommended = startHere({
    data: data || { state: 'ready', courses: [], warnings: [] },
    today,
    checked: ticked,
    goalsLoaded,
    hasGoals: (plan?.goals || []).length > 0,
    termProject: project
  });

  // Academic progress (Edmentum Courseware + STEAM labs)
  const edSummary = edmentum?.summary || {};
  const edClasses = Array.isArray(edmentum?.enrolledClasses) ? edmentum.enrolledClasses : [];
  const edScores = Array.isArray(edmentum?.recentScores) ? edmentum.recentScores : [];
  const steamStarted = Array.isArray(model?.academic?.items)
    ? model.academic.items.filter((i) => i.started).map((i) => i.title || i.id)
    : [];

  const academic = {
    edmentumStatus: edmentum?.providerStatus || edmentumStatus || 'unknown',
    enrolledClassCount: edSummary.enrolledClassCount ?? edClasses.length ?? 0,
    completedClassCount: edSummary.completedClassCount ?? 0,
    overallProgressPercent: Number.isFinite(edSummary.overallProgressPercent) ? edSummary.overallProgressPercent : null,
    averageCurrentGrade: Number.isFinite(edSummary.averageCurrentGrade) ? edSummary.averageCurrentGrade : null,
    totalTimeOnTaskMinutes: Number.isFinite(edSummary.totalTimeOnTaskSeconds)
      ? Math.round(edSummary.totalTimeOnTaskSeconds / 60)
      : null,
    enrolledClasses: edClasses.slice(0, 5).map((c) => ({
      name: c.className || c.courseName || c.name || 'Course',
      progressPercent: Number.isFinite(c.progressPercent) ? c.progressPercent : null,
      currentGrade: Number.isFinite(c.currentGrade) ? c.currentGrade : null
    })),
    recentScores: edScores.slice(0, 3).map((s) => ({
      title: s.activityTitle || s.title || 'Assessment',
      score: s.score ?? null,
      maxScore: s.maxScore ?? null
    })),
    steamActivitiesStarted: steamStarted
  };

  // Coach feedback (from Firestore users/{uid}/feedback & notifications)
  const normalizedFeedback = (Array.isArray(coachFeedback) ? coachFeedback : [])
    .slice(0, 5)
    .map((item) => ({
      coachName: item.coachName || item.from || 'Coach',
      type: item.type || 'written_feedback',
      feedbackText: item.feedbackText || item.message || '',
      rating: Number.isFinite(item.rating) ? item.rating : null,
      workId: item.workId || null,
      date: item.timestamp ? new Date(item.timestamp).toISOString().slice(0, 10) : null
    }))
    .filter((item) => item.feedbackText || item.rating !== null);

  // Engagement, badges & interests
  const earnedBadges = Array.isArray(model?.badges)
    ? model.badges.filter((b) => b.earned).map((b) => b.label || b.title || b.id)
    : [];

  const interests = Array.isArray(prefs?.interests) && prefs.interests.length > 0
    ? prefs.interests.slice(0, 6)
    : (Array.isArray(profile?.interests) ? profile.interests.slice(0, 6) : []);

  const engagement = {
    mood: signals?.mood || null,
    badgesEarned: earnedBadges.length,
    badgeNames: earnedBadges.slice(0, 5)
  };

  const schoolClasses = Array.isArray(learningContext?.classes)
    ? learningContext.classes.map((c) => c.name).filter(Boolean).slice(0, 5)
    : [];

  return {
    activity: 'student-dashboard',
    tab,
    progress: {
      activity: 'Student Dashboard',
      tab,
      studentName: studentName || '',
      ageBand: profile?.ageBand || profile?.cohort || null,
      yearGroup: profile?.yearGroup || null,
      interests,
      tagline: prefs?.tagline || null,
      schoolClasses,
      pblCourses,
      termProject,
      goals,
      todayChecklist: {
        total: today.length,
        completed: ticked.size,
        remaining: remainingToday.slice(0, 4)
      },
      focusSkill,
      strengths,
      supports,
      academic,
      coachFeedback: normalizedFeedback,
      engagement,
      skillOfTheWeek: model?.skill?.title || null,
      focusTimer: focusText || null,
      nextRecommendedStep: recommended?.title
        ? { title: recommended.title, source: recommended.source || '' }
        : null
    }
  };
}
