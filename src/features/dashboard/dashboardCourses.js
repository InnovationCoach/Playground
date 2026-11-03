import { db, collection, query, where, getDocs, doc, getDoc } from '../../firebase.js';
import { getProgram } from '../../services/pblService.js';
import { loadClasses } from '../coach/classCodes.js';
import { readLocalProgress } from '../pbl/programs/useProgramProgress.js';
import { hydrateProgress, progressDocId, programProgress, needsRecheck } from '../pbl/programs/progress.js';

export function readLocalAddedPrograms(uid) {
  const ids = [];
  try {
    if (typeof localStorage !== 'undefined') {
      const storageKey = `learningPath_${uid || 'signed-out'}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (typeof item === 'string') {
              const cleaned = item.startsWith('program:') ? item.replace(/^program:/, '') : item;
              if (cleaned && !cleaned.startsWith('activity:')) ids.push(cleaned);
            }
          }
        }
      }
      const enrolledRaw = localStorage.getItem(`hearisland.enrolled_programs.v1:${uid || 'signed-out'}`);
      if (enrolledRaw) {
        const parsedEnrolled = JSON.parse(enrolledRaw);
        if (Array.isArray(parsedEnrolled)) {
          parsedEnrolled.forEach((p) => p && ids.push(p));
        }
      }
    }
  } catch {
    // Non-fatal
  }
  return ids;
}

/** Read only the signed-in learner's enrolments and assigned classes. Never enrol or seed. */
export async function loadDashboardCourses(uid, classIds, activeProgramId, services = {}) {
  const api = { getDocs, getDoc, getProgram, loadClasses, readLocalProgress, ...services };
  const warnings = [];
  const ids = new Set(activeProgramId ? [activeProgramId] : []);
  const enrolments = new Map();

  // Read student-added courses from local learning path so all chosen programs appear
  readLocalAddedPrograms(uid).forEach((id) => ids.add(id));

  const results = await Promise.allSettled([
    api.getDocs(query(collection(db, 'enrolments'), where('learnerId', '==', uid))),
    api.loadClasses(classIds)
  ]);
  if (results[0].status === 'fulfilled') {
    results[0].value.forEach((snap) => {
      const row = snap.data();
      if (row.programId && row.status !== 'archived' && row.status !== 'completed') {
        ids.add(row.programId); enrolments.set(row.programId, row);
      }
    });
  } else warnings.push('Your course enrolments could not be loaded.');
  if (results[1].status === 'fulfilled') {
    for (const cls of results[1].value) {
      if (cls.programId) ids.add(cls.programId);
      if (cls.error || cls.missing) warnings.push('A class assignment could not be loaded.');
    }
  } else warnings.push('Your class assignments could not be loaded.');
  const courses = (await Promise.all([...ids].map(async (id) => {
    const result = await api.getProgram(id);
    if (result.status !== 'found' || !result.program) {
      warnings.push('An assigned project is unavailable. Open My Courses or ask your coach.');
      return null;
    }
    const program = result.program;
    let progress = api.readLocalProgress(uid, program);
    let progressUnavailable = false;
    try {
      const snap = await api.getDoc(doc(db, 'users', uid, 'activityProgress', progressDocId(id)));
      const exists = typeof snap.exists === 'function' ? snap.exists() : snap.exists;
      if (exists) {
        const remote = hydrateProgress(snap.data(), program);
        if (!progress || (remote.updatedAt || 0) > (progress.updatedAt || 0)) progress = remote;
      }
    } catch { progressUnavailable = true; }
    // Progress saved under the old per-stage numbers can't be counted honestly until the learner re-checks it.
    const recheck = !progressUnavailable && needsRecheck(progress);
    return { program, enrolment: enrolments.get(id), summary: progress && !recheck ? programProgress(progress, program) : null, progressUnavailable, needsRecheck: recheck };
  }))).filter(Boolean);
  courses.sort((a, b) => Number(b.program.id === activeProgramId) - Number(a.program.id === activeProgramId));
  return { courses, warnings: [...new Set(warnings)] };
}
