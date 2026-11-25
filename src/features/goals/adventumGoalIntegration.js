/**
 * Adventum (Edmentum) & School Academic Integration for Goal Setting.
 *
 * Truthfully retrieves available student academic data from:
 *   1. Auth/User profile (`yearLevel`, `gradeLevel`, `cohort`, `cohortId`, `ageBand`, `classIds`, `schoolIds`)
 *   2. School Workspace Learning Context (`GET /api/learning-context` -> `providerStatus.edmentum`, `schools`, `classes`)
 *   3. School Academic Progress Observations (`GET /api/schools/:schoolId/academic-progress?learnerUid=:uid`)
 *   4. Coach-Assigned Learner Goals (`GET /api/schools/:schoolId/learner-goals`)
 *   5. Student Profile Service (`getStudentProfile` -> `grades`, `gpa`, `academicProgress`)
 *   6. Enrolled PBL Courses & Projects (`loadDashboardCourses` / `PROGRAM_CATALOGUE`)
 *
 * Strictly follows the O0 Truthful Provider Contract:
 *   - Never invents unavailable grades, scores, or connection status.
 *   - Automatically surfaces available subjects, current grade/year level, progress, and assignments.
 *   - Generates relevant Academic and PBL goal recommendations from real available data.
 *   - Provides clean manual alternatives when integration data is pending or unavailable.
 */
import { useCallback, useEffect, useState } from 'react';
import { schoolRequest } from '../../services/api/apiClient.js';
import { providerStatus, PROVIDER_STATES, hasProviderData } from '../edmentum/providerState.js';
import { getStudentProfile } from '../studentProfile/studentProfileService.js';
import { PROGRAM_CATALOGUE } from '../pbl/content/programCatalogue.js';
import { readLocalAddedPrograms } from '../dashboard/dashboardCourses.js';
import { db, doc, getDoc } from '../../firebase.js';

export const MANUAL_SUBJECT_OPTIONS = Object.freeze([
  'Mathematics',
  'English Language & Literature',
  'Integrated Science',
  'Biology',
  'Chemistry',
  'Physics',
  'Computer Science & AI',
  'Engineering & Robotics',
  'World History & Geography',
  'Art, Design & Media',
  'Thai Language & Culture',
  'Entrepreneurship & Economics'
]);

export const GRADE_LEVEL_OPTIONS = Object.freeze([
  'Year 7 / Grade 6',
  'Year 8 / Grade 7',
  'Year 9 / Grade 8',
  'Year 10 / Grade 9',
  'Year 11 / Grade 10',
  'Year 12 / Grade 11',
  'Year 13 / Grade 12'
]);

/**
 * Derive a readable grade/year level from a learner's profile or cohort.
 */
export function resolveStudentGradeLevel(profile = {}, planAcademicProfile = null) {
  if (planAcademicProfile?.gradeLevel) return planAcademicProfile.gradeLevel;
  if (profile?.yearLevel) {
    const yl = String(profile.yearLevel).trim();
    if (/^\d+$/.test(yl)) return `Year ${yl}`;
    return yl;
  }
  if (profile?.gradeLevel) {
    const gl = String(profile.gradeLevel).trim();
    if (/^\d+$/.test(gl)) return `Grade ${gl}`;
    return gl;
  }
  const cohort = String(profile?.cohort || profile?.cohortId || '').toLowerCase();
  if (cohort.includes('wls') || cohort.includes('lower-secondary')) return 'Lower Secondary (Years 7–9)';
  if (cohort.includes('whs') || cohort.includes('higher-secondary')) return 'Higher Secondary (Years 10–13)';
  if (profile?.ageBand === '13-15') return 'Lower Secondary (Ages 13–15)';
  if (profile?.ageBand === '16-18') return 'Higher Secondary (Ages 16–18)';
  return null;
}

/**
 * Normalise academic courses/subjects from school academic snapshots and student profile grades.
 */
export function normalizeAcademicSubjects({ academicSnapshots = [], profileGrades = [] } = {}) {
  const bySubject = new Map();

  // 1. From school academic snapshots (Edmentum / CambriLearn observations)
  for (const snap of academicSnapshots) {
    if (!snap || !snap.course) continue;
    const title = String(snap.course).trim();
    if (!title) continue;
    const key = title.toLowerCase();
    const completed = Number(snap.completed);
    const total = Number(snap.total);
    const hasUnits = Number.isFinite(completed) && Number.isFinite(total) && total > 0;
    const progressPct = hasUnits ? Math.round((completed / total) * 100) : null;
    if (!bySubject.has(key)) {
      bySubject.set(key, {
        id: snap.id || `subj_${key.replace(/[^a-z0-9]+/g, '_')}`,
        subject: title,
        provider: snap.provider === 'edmentum' ? 'Adventum / Edmentum' : snap.provider === 'cambrilearn' ? 'CambriLearn' : (snap.provider || 'School'),
        curriculum: snap.curriculum || null,
        completedUnits: hasUnits ? completed : null,
        totalUnits: hasUnits ? total : null,
        progressPct,
        grade: null,
        term: null,
        dataAsOf: snap.dataAsOf || null,
        source: snap.sourceMethod === 'coach_recorded' ? 'Coach observation' : 'Academic record'
      });
    }
  }

  // 2. From student profile grades
  for (const g of profileGrades) {
    if (!g || !g.subject) continue;
    const title = String(g.subject).trim();
    if (!title) continue;
    const key = title.toLowerCase();
    const existing = bySubject.get(key);
    if (existing) {
      existing.grade = g.grade || existing.grade;
      existing.term = g.term || existing.term;
      existing.comment = g.comment || existing.comment;
    } else {
      bySubject.set(key, {
        id: g.id || `grade_${key.replace(/[^a-z0-9]+/g, '_')}`,
        subject: title,
        provider: 'School Record',
        curriculum: g.term || null,
        completedUnits: null,
        totalUnits: null,
        progressPct: null,
        grade: g.grade || null,
        term: g.term || null,
        comment: g.comment || null,
        dataAsOf: null,
        source: 'Term grade record'
      });
    }
  }

  return [...bySubject.values()];
}

/**
 * Generate intelligent, personalized goal recommendations from available academic & PBL data.
 * Never invents fake progress: each recommendation cites its exact source.
 */
export function buildGoalRecommendations({
  gradeLevel = null,
  subjects = [],
  academicProgress = null,
  coachGoals = [],
  pblProjects = [],
  existingGoals = []
} = {}) {
  const existingTitles = new Set(
    (existingGoals || []).map((g) => String(g.explore || '').toLowerCase().trim())
  );
  const recommendations = [];

  const addRec = (rec) => {
    if (!rec.explore || existingTitles.has(rec.explore.toLowerCase().trim())) return;
    if (recommendations.some((r) => r.explore.toLowerCase() === rec.explore.toLowerCase())) return;
    recommendations.push(rec);
  };

  // 1. From subjects with observed unit progress (Edmentum / CambriLearn)
  for (const subj of subjects) {
    if (subj.completedUnits !== null && subj.totalUnits !== null && subj.completedUnits < subj.totalUnits) {
      const remaining = subj.totalUnits - subj.completedUnits;
      const nextChunk = Math.min(remaining, 3);
      addRec({
        id: `rec_units_${subj.id}`,
        category: 'academic',
        goalType: 'subject-goal',
        subject: subj.subject,
        explore: `Complete the next ${nextChunk} unit${nextChunk === 1 ? '' : 's'} in ${subj.subject}`,
        measurableOutcome: `Move from ${subj.completedUnits}/${subj.totalUnits} units (${subj.progressPct}%) to ${subj.completedUnits + nextChunk}/${subj.totalUnits} units completed`,
        reason: `Based on your ${subj.provider} record (${subj.completedUnits} of ${subj.totalUnits} units complete)`,
        steps: [
          { text: `Review the learning objectives for unit ${subj.completedUnits + 1} in ${subj.subject}`, frequency: 'daily' },
          { text: `Complete the practice exercises and take notes on key concepts`, frequency: 'daily' },
          { text: `Finish the unit check-in assessment and review with my coach`, frequency: 'weekly' }
        ]
      });
    } else if (subj.grade) {
      addRec({
        id: `rec_grade_${subj.id}`,
        category: 'academic',
        goalType: 'performance-target',
        subject: subj.subject,
        explore: `Strengthen mastery and exam readiness in ${subj.subject}`,
        measurableOutcome: `Build on ${subj.term || 'current'} grade (${subj.grade}) by mastering core problem types and completing weekly practice`,
        reason: `Recommended from your ${subj.subject} academic profile (${subj.grade}${subj.comment ? ` — ${subj.comment}` : ''})`,
        steps: [
          { text: `Identify 2 challenging topics in ${subj.subject} to focus on this week`, frequency: 'weekly' },
          { text: `Practise 15 minutes of active recall or problem-solving in ${subj.subject}`, frequency: 'daily' },
          { text: `Complete a self-check quiz and review answers with my coach`, frequency: 'weekly' }
        ]
      });
    } else {
      addRec({
        id: `rec_subj_${subj.id}`,
        category: 'academic',
        goalType: 'short-term-learning',
        subject: subj.subject,
        explore: `Master the current module in ${subj.subject}`,
        measurableOutcome: `Complete all module activities and summarize 3 key takeaways`,
        reason: `From your enrolled subject: ${subj.subject}`,
        steps: [
          { text: `Read the current module overview in ${subj.subject}`, frequency: 'daily' },
          { text: `Complete one lesson activity and log any questions`, frequency: 'daily' }
        ]
      });
    }
  }

  // 2. From coach-assigned learning goals in school workspace
  for (const cg of coachGoals) {
    if (!cg || cg.state === 'achieved' || cg.state === 'archived' || !cg.target) continue;
    const isPbl = cg.domain === 'pbl' || cg.domain === 'steam';
    addRec({
      id: `rec_coach_${cg.id}`,
      category: isPbl ? 'pbl' : 'academic',
      goalType: isPbl ? 'project-objective' : 'assignment-exam',
      explore: String(cg.target).slice(0, 140),
      targetDate: cg.dueDate || undefined,
      measurableOutcome: `Complete coach-assigned target and record evidence by ${cg.dueDate || 'target date'}`,
      reason: `Assigned by your coach${cg.dueDate ? ` (Due ${cg.dueDate})` : ''}`,
      steps: [
        { text: `Break "${String(cg.target).slice(0, 60)}" into 2 small work sessions`, frequency: 'daily' },
        { text: `Complete the first draft or test and share progress with my coach`, frequency: 'weekly' }
      ]
    });
  }

  // 3. From active PBL projects
  for (const proj of pblProjects) {
    const nextMilestone = proj.milestones?.[0] || 'Research & Prototype Milestone';
    addRec({
      id: `rec_pbl_${proj.id}`,
      category: 'pbl',
      goalType: 'project-milestone',
      projectId: proj.id,
      projectTitle: proj.title,
      explore: `Complete "${nextMilestone}" for ${proj.title}`,
      measurableOutcome: `Submit documented evidence and reflection for ${nextMilestone} in PBL Studio`,
      reason: `Active PBL Project: ${proj.title}`,
      steps: [
        { text: `Review the driving question and criteria for ${proj.title}`, frequency: 'daily' },
        { text: `Build or document one piece of evidence for ${nextMilestone}`, frequency: 'daily' },
        { text: `Request peer or coach feedback on my prototype/findings`, frequency: 'weekly' }
      ]
    });
  }

  // 4. Grade-level / Graduation readiness recommendation if few academic recs exist
  if (gradeLevel && recommendations.filter((r) => r.category === 'academic').length < 2) {
    addRec({
      id: 'rec_grad_target',
      category: 'academic',
      goalType: 'graduation-target',
      gradeLevel,
      explore: `Build my ${gradeLevel} academic portfolio & term readiness`,
      measurableOutcome: `Maintain on-track completion across all core subjects this term`,
      reason: `Tailored for your current level (${gradeLevel})`,
      steps: [
        { text: `List my core subjects and upcoming assessment dates for this term`, frequency: 'once' },
        { text: `Complete 20 minutes of focused subject review each school day`, frequency: 'daily' },
        { text: `Check in with my coach every Friday on my term targets`, frequency: 'weekly' }
      ]
    });
  }

  return recommendations.slice(0, 6);
}

/**
 * Pure async loader so both React components and unit tests can fetch and inspect
 * the learner's Adventum / Academic & PBL context.
 */
export async function fetchAdventumAcademicContext(uid, profile = null, options = {}) {
  const api = {
    schoolRequest,
    getStudentProfile,
    getDoc: db ? (path) => getDoc(doc(db, ...path)) : null,
    ...options
  };

  let userDoc = profile || {};
  if (uid && !profile && api.getDoc) {
    try {
      const snap = await api.getDoc(['users', uid]);
      const exists = typeof snap?.exists === 'function' ? snap.exists() : snap?.exists;
      if (exists) userDoc = { ...snap.data(), uid };
    } catch {
      // Fallback to empty profile
    }
  }

  // 1. Query school learning context (/api/learning-context)
  let learningContext = null;
  let contextError = null;
  if (uid) {
    try {
      learningContext = await api.schoolRequest('GET', '/api/learning-context');
    } catch (err) {
      contextError = err;
    }
  }

  const edmentumStatus = providerStatus(
    learningContext?.providerStatus?.edmentum,
    { loading: false, error: contextError }
  );
  const cambrilearnStatus = providerStatus(
    learningContext?.providerStatus?.cambrilearn,
    { loading: false, error: contextError }
  );

  const school = learningContext?.schools?.[0] || null;
  const classes = learningContext?.classes || [];

  // 2. If a school is available, query academic-progress and learner-goals
  let academicSnapshots = [];
  let coachGoals = [];
  if (uid && school?.id) {
    const [acadRes, goalsRes] = await Promise.allSettled([
      api.schoolRequest('GET', `/api/schools/${encodeURIComponent(school.id)}/academic-progress?learnerUid=${encodeURIComponent(uid)}`),
      api.schoolRequest('GET', `/api/schools/${encodeURIComponent(school.id)}/learner-goals?learnerUid=${encodeURIComponent(uid)}`)
    ]);
    if (acadRes.status === 'fulfilled' && Array.isArray(acadRes.value?.items)) {
      academicSnapshots = acadRes.value.items;
    }
    if (goalsRes.status === 'fulfilled' && Array.isArray(goalsRes.value?.items)) {
      coachGoals = goalsRes.value.items;
    }
  }

  // 3. Query Student Profile service for grades / GPA / academicProgress
  let studentProfile = null;
  if (uid) {
    try {
      const data = await api.getStudentProfile(uid, { viewerUid: uid, role: 'student' });
      // Only include non-synthetic profile data OR if the learner has explicit grades/progress
      if (data && (data.grades?.length > 0 || data.academicProgress || data.gpa)) {
        studentProfile = data;
      }
    } catch {
      // Ignore profile errors
    }
  }

  // 4. Resolve PBL projects available to the student
  const addedProgramIds = new Set(readLocalAddedPrograms(uid));
  if (userDoc?.activeProgramId) addedProgramIds.add(userDoc.activeProgramId);
  const pblProjects = PROGRAM_CATALOGUE.map((p) => ({
    id: p.id,
    title: p.title,
    drivingQuestion: p.drivingQuestion,
    gradeBand: p.gradeBand,
    enrolled: addedProgramIds.has(p.id),
    milestones: (p.milestones || []).map((m) => m.title)
  })).sort((a, b) => Number(b.enrolled) - Number(a.enrolled));

  const subjects = normalizeAcademicSubjects({
    academicSnapshots,
    profileGrades: studentProfile?.grades || []
  });

  const gradeLevel = resolveStudentGradeLevel(userDoc) || (studentProfile?.cohort ? String(studentProfile.cohort) : null);

  const overallAcademicProgress = studentProfile?.academicProgress?.percent ?? (
    subjects.some((s) => s.progressPct !== null)
      ? Math.round(
          subjects.filter((s) => s.progressPct !== null).reduce((sum, s) => sum + s.progressPct, 0) /
          subjects.filter((s) => s.progressPct !== null).length
        )
      : null
  );

  // Merge connected subjects with manual fallback list so students always have rich subject choices
  const subjectNames = [...new Set([
    ...subjects.map((s) => s.subject),
    ...MANUAL_SUBJECT_OPTIONS
  ])];

  return {
    loaded: true,
    edmentumStatus,
    cambrilearnStatus,
    isAdventumConnected: hasProviderData(edmentumStatus) || subjects.length > 0,
    school,
    classes,
    gradeLevel,
    gpa: studentProfile?.gpa || null,
    overallAcademicProgress,
    academicNote: studentProfile?.academicProgress?.note || null,
    subjects,
    subjectOptions: subjectNames,
    coachGoals,
    pblProjects,
    PROVIDER_STATES
  };
}

/**
 * React hook for Adventum & Academic Profile data in the Goal Setting experience.
 */
export function useAdventumAcademicContext(uid, profile = null) {
  const [context, setContext] = useState(() => ({
    loaded: false,
    edmentumStatus: providerStatus(undefined, { loading: true }),
    cambrilearnStatus: providerStatus(undefined, { loading: true }),
    isAdventumConnected: false,
    school: null,
    classes: [],
    gradeLevel: resolveStudentGradeLevel(profile),
    gpa: null,
    overallAcademicProgress: null,
    academicNote: null,
    subjects: [],
    subjectOptions: [...MANUAL_SUBJECT_OPTIONS],
    coachGoals: [],
    pblProjects: PROGRAM_CATALOGUE.map((p) => ({
      id: p.id,
      title: p.title,
      drivingQuestion: p.drivingQuestion,
      gradeBand: p.gradeBand,
      enrolled: false,
      milestones: (p.milestones || []).map((m) => m.title)
    }))
  }));

  const refresh = useCallback(async () => {
    if (!uid) {
      setContext((prev) => ({ ...prev, loaded: true, edmentumStatus: providerStatus('not_connected') }));
      return;
    }
    const result = await fetchAdventumAcademicContext(uid, profile);
    setContext(result);
  }, [uid, profile]);

  useEffect(() => {
    let cancelled = false;
    fetchAdventumAcademicContext(uid, profile).then((res) => {
      if (!cancelled) setContext(res);
    });
    return () => { cancelled = true; };
  }, [uid, profile]);

  return { ...context, refresh };
}
