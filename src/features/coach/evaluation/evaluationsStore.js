/**
 * Coach Evaluation Desk Store
 * Live Firestore integration for genuine multi-modal student submissions.
 * Conforms to WeLearn SPARK Phase 2 specifications.
 */

import {
  db,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy
} from '../../../firebase.js';

const LEGACY_STORAGE_KEY = 'hearisland.coach_evaluations.v1';

// One-time cache cleanup of fabricated legacy evaluations
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Normalizes a raw Firestore submission document into the Evaluation Deck presentation shape.
 */
export function formatSubmissionDoc(id, data, studentData = {}) {
  return {
    id,
    submissionId: id,
    studentId: data.studentId || '',
    studentName: studentData.displayName || studentData.name || data.studentName || 'Learner',
    avatar: studentData.avatar || data.avatar || '👤',
    grade: studentData.grade || studentData.yearLevel || data.grade || 'Secondary',
    traits: Array.isArray(studentData.diagnosisTraits)
      ? studentData.diagnosisTraits.join(', ')
      : (studentData.traits || data.traits || ''),
    classId: data.classId || '',
    projectTitle: data.projectTitle || data.activityTitle || data.activityId || 'Project Work',
    programId: data.programId || data.activityId || '',
    activityId: data.activityId || '',
    sessionNumber: data.sessionNumber || data.milestoneNumber || 1,
    milestoneStage: data.milestoneStage || data.stage || 'Submission',
    milestoneTitle: data.milestoneTitle || data.title || 'Milestone Deliverable',
    submittedAt: data.createdAt || data.submittedAt || Date.now(),
    status: data.status || 'pending', // 'pending' | 'approved' | 'revision_requested'
    competencies: Array.isArray(data.competencies) ? data.competencies : [],
    submissions: {
      video: data.evidence?.video || (data.evidence?.videoUrl ? { url: data.evidence.videoUrl, title: data.evidence.videoTitle || 'Video Demo' } : null),
      github: data.evidence?.github || (data.evidence?.githubUrl ? { url: data.evidence.githubUrl, repo: data.evidence.repo || '', branch: data.evidence.branch || 'main', commit: data.evidence.commit || '' } : null),
      prototype: data.evidence?.prototype || (data.evidence?.prototypeTag ? { station: data.evidence.station || 'MakerSpace Lab', assetTag: data.evidence.prototypeTag, spec: data.evidence.spec || '', verifiedSafety: Boolean(data.evidence.verifiedSafety) } : null),
      reflection: data.reflection || data.evidence?.reflection || '',
      files: Array.isArray(data.evidence?.files) ? data.evidence.files : []
    },
    coachCue: data.coachCue || '',
    coachFeedback: data.coachFeedback || '',
    xpAwarded: Number(data.xpAwarded) || 0,
    evaluatedBy: data.evaluatedBy || null,
    evaluatedAt: data.evaluatedAt || null
  };
}

/**
 * Fetch real submissions for a class (or set of classes) from Firestore.
 */
export async function fetchSubmissions({ classIds = [], studentId = null } = {}) {
  try {
    const validClassIds = (Array.isArray(classIds) ? classIds : [classIds]).filter(Boolean);
    if (validClassIds.length === 0 && !studentId) {
      return [];
    }

    let q;
    const subCol = collection(db, 'submissions');

    if (studentId) {
      q = query(subCol, where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
    } else if (validClassIds.length === 1) {
      q = query(subCol, where('classId', '==', validClassIds[0]), orderBy('createdAt', 'desc'));
    } else {
      q = query(subCol, where('classId', 'in', validClassIds.slice(0, 10)), orderBy('createdAt', 'desc'));
    }

    const snap = await getDocs(q);
    const results = [];

    // Preload student display info for returned submissions
    const studentIds = new Set();
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.studentId) studentIds.add(data.studentId);
    });

    const studentMap = {};
    await Promise.all(
      Array.from(studentIds).map(async (uid) => {
        try {
          const userSnap = await getDoc(doc(db, 'users', uid));
          if (userSnap.exists()) {
            studentMap[uid] = userSnap.data();
          }
        } catch {
          // Rule boundary or missing doc
        }
      })
    );

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      results.push(formatSubmissionDoc(docSnap.id, data, studentMap[data.studentId] || {}));
    });

    return results;
  } catch (err) {
    console.warn('[evaluationsStore] Failed fetching submissions from Firestore:', err?.message);
    return [];
  }
}

/**
 * Create a real student submission in the root submissions collection.
 */
export async function createSubmission(submissionData) {
  const subId = submissionData.id || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const submissionRef = doc(db, 'submissions', subId);

  const payload = {
    studentId: submissionData.studentId,
    classId: submissionData.classId,
    activityId: submissionData.activityId || 'pbl-milestone',
    projectTitle: submissionData.projectTitle || 'Project Milestone',
    milestoneTitle: submissionData.milestoneTitle || 'Deliverable',
    milestoneStage: submissionData.milestoneStage || 'Prototyping',
    evidence: submissionData.evidence || {},
    reflection: submissionData.reflection || '',
    competencies: Array.isArray(submissionData.competencies) ? submissionData.competencies : [],
    status: 'pending',
    coachFeedback: '',
    xpAwarded: 0,
    evaluatedBy: null,
    evaluatedAt: null,
    coachCue: submissionData.coachCue || null,
    createdAt: Date.now()
  };

  await setDoc(submissionRef, payload);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hearisland-evaluations-updated'));
  }
  return { id: subId, ...payload };
}

/**
 * Approve a student submission with formative feedback and verified XP.
 */
export async function approveSubmission(submissionId, { feedback = '', xp = 100, coachUid = '', coachName = 'Coach' } = {}) {
  const submissionRef = doc(db, 'submissions', submissionId);
  const patch = {
    status: 'approved',
    coachFeedback: feedback || 'Milestone verified and approved! Excellent craftsmanship and technical evidence.',
    xpAwarded: Number(xp) || 100,
    evaluatedBy: coachUid || coachName,
    evaluatedAt: Date.now()
  };

  await updateDoc(submissionRef, patch);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hearisland-evaluations-updated'));
  }
  return patch;
}

/**
 * Request revisions on a student submission.
 */
export async function requestRevisionSubmission(submissionId, { guidance = '', coachUid = '', coachName = 'Coach' } = {}) {
  const submissionRef = doc(db, 'submissions', submissionId);
  const patch = {
    status: 'revision_requested',
    coachFeedback: guidance || 'Please clarify your design documentation or update your technical evidence before approval.',
    evaluatedBy: coachUid || coachName,
    evaluatedAt: Date.now()
  };

  await updateDoc(submissionRef, patch);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hearisland-evaluations-updated'));
  }
  return patch;
}

/**
 * Delete a submission (for test cleanup).
 */
export async function deleteSubmission(submissionId) {
  const submissionRef = doc(db, 'submissions', submissionId);
  await deleteDoc(submissionRef);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hearisland-evaluations-updated'));
  }
}

/**
 * Compatibility helper for existing components: returns empty array if no live submissions.
 */
export function getEvaluations() {
  return [];
}
