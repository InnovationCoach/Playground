/**
 * Coach feedback on a program phase submission, written to the learner's own
 * record: enrolments/{enrolmentId}/phaseProgress/{phaseId}.coachFeedback.
 *
 * The existing rules let a coach of the learner write coachFeedback and set
 * status 'reviewed' (learners cannot). Unlike pblService.saveCoachFeedback,
 * no rating is written: the coach did not give one, and a default score would
 * be a number nobody decided.
 */
import { db, doc, updateDoc } from '../../../firebase.js';

export const FEEDBACK_MAX = 1200;

export function feedbackRecord(text, coachUid, now = Date.now()) {
  const t = String(text || '').trim().slice(0, FEEDBACK_MAX);
  if (!t) return null;
  return { text: t, coachId: String(coachUid), at: now };
}

/** Returns { ok } or { error } with a code the screen translates. */
export async function saveSubmissionFeedback({ enrolmentId, phaseId }, text, coachUid) {
  const coachFeedback = feedbackRecord(text, coachUid);
  if (!coachFeedback) return { error: 'feedbackEmpty' };
  try {
    await updateDoc(doc(db, 'enrolments', enrolmentId, 'phaseProgress', phaseId), {
      coachFeedback,
      status: 'reviewed',
      updatedAt: coachFeedback.at
    });
    return { ok: true };
  } catch (err) {
    console.warn('[My Learners] Could not save feedback:', err?.code || err?.message);
    return { error: err?.code === 'permission-denied' ? 'feedbackDenied' : 'feedbackRemote' };
  }
}
