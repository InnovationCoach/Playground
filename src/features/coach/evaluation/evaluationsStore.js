/**
 * Coach Evaluation Desk Store
 * Manages student multi-modal submissions (Video demos, GitHub repos, MakerSpace prototypes, Reflections)
 * and coach formative evaluations, XP awards, and feedback loops.
 */

// v2: v1 held sample learners' work in browsers; v2 starts empty.
const STORAGE_KEY = 'hearisland.coach_evaluations.v2';

/** No sample work in the app: the desk shows only real submissions. */
const INITIAL_EVALUATIONS = [];

/** Used only when the browser has no storage (tests, private modes). */
let memoryEvals = null;

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // Ignore
  }
  return null;
}

export function getEvaluations() {
  try {
    const s = getStorage();
    if (!s) return memoryEvals ?? INITIAL_EVALUATIONS;
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) {
      s.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EVALUATIONS));
      return INITIAL_EVALUATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EVALUATIONS;
  }
}

export function saveEvaluations(evals) {
  try {
    const s = getStorage();
    if (s) s.setItem(STORAGE_KEY, JSON.stringify(evals));
    else memoryEvals = evals;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hearisland-evaluations-updated', { detail: { evals } }));
    }
  } catch (err) {
    console.error('[EvaluationsStore] Failed saving:', err);
  }
}

export function approveSubmission(evalId, { feedback = '', xp = 100, coachName = 'Coach' } = {}) {
  const list = getEvaluations();
  const next = list.map((item) => {
    if (item.id === evalId) {
      return {
        ...item,
        status: 'approved',
        coachFeedback: feedback || item.coachFeedback || 'Milestone verified and approved! Excellent craftsmanship and technical evidence.',
        xpAwarded: xp,
        evaluatedBy: coachName,
        evaluatedAt: Date.now()
      };
    }
    return item;
  });
  saveEvaluations(next);
  return next.find((i) => i.id === evalId);
}

export function requestRevisionSubmission(evalId, { guidance = '' } = {}) {
  const list = getEvaluations();
  const next = list.map((item) => {
    if (item.id === evalId) {
      return {
        ...item,
        status: 'revision_requested',
        coachFeedback: guidance || 'Please provide updated telemetry data or clarify your design documentation before milestone approval.',
        evaluatedAt: Date.now()
      };
    }
    return item;
  });
  saveEvaluations(next);
  return next.find((i) => i.id === evalId);
}
