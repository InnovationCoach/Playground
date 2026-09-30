/**
 * Joining a class with a code, from the browser.
 *
 * There is no backend to do this on: the Express server is not deployed, and
 * `VITE_API_URL` resolves to localhost on a learner's machine. So enrolment runs
 * client-side, and its safety comes from the security rules rather than from
 * this file being trusted.
 *
 * The rule (see isSelfEnrolment in firestore.rules) re-reads classCodes/{CODE}
 * itself and checks the code really names the class being joined. So a learner
 * cannot enrol by guessing a class id, reusing another class's code, or editing
 * this code in devtools - the write is rejected. What follows is therefore a
 * convenience layer, not a gate.
 */

import {
  db, doc, getDoc, updateDoc, arrayUnion, serverTimestamp
} from '../../firebase.js';
import { normaliseJoinCode } from '../../utils/joinCode.js';

/** Distinguishable outcomes, so the UI can say something specific. */
export const JOIN_RESULT = {
  OK: 'ok',
  MALFORMED: 'malformed',
  UNKNOWN_CODE: 'unknown_code',
  ALREADY_MEMBER: 'already_member',
  DENIED: 'denied',
  FAILED: 'failed'
};

/**
 * @param {string} uid       the signed-in learner
 * @param {string} rawCode   exactly what they typed
 * @param {string[]} current their existing classIds
 */
export async function joinClassWithCode(uid, rawCode, current = []) {
  const code = normaliseJoinCode(rawCode);

  if (!code) {
    return {
      status: JOIN_RESULT.MALFORMED,
      message: 'That does not look like a class code. They are eight characters, like ABCD-2345.'
    };
  }

  let codeSnap;
  try {
    codeSnap = await getDoc(doc(db, 'classCodes', code));
  } catch (err) {
    // Reads of a single code document are permitted, so a failure here is a
    // connectivity or configuration problem, not a wrong code.
    console.warn('[Join] Could not read class code:', err.code || err.message);
    return {
      status: JOIN_RESULT.FAILED,
      message: 'Could not check that code just now. Please try again in a moment.'
    };
  }

  const exists = typeof codeSnap?.exists === 'function' ? codeSnap.exists() : !!codeSnap?.exists;
  if (!exists) {
    return {
      status: JOIN_RESULT.UNKNOWN_CODE,
      message: 'No class has that code. Check it with your teacher - codes have no O, I, L, 0 or 1 in them.'
    };
  }

  const { classId, className } = codeSnap.data() || {};
  if (!classId) {
    return { status: JOIN_RESULT.FAILED, message: 'That code is not set up correctly. Please tell your teacher.' };
  }

  if (current.includes(classId)) {
    return {
      status: JOIN_RESULT.ALREADY_MEMBER,
      classId,
      className,
      message: `You are already in ${className || 'that class'}.`
    };
  }

  try {
    // `enrolledVia` is not decoration: the security rule reads it back and
    // fetches that code document to verify it names this exact class. Removing
    // it makes every enrolment fail.
    await updateDoc(doc(db, 'users', uid), {
      classIds: arrayUnion(classId),
      enrolledVia: code,
      groupName: className || classId,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    if (err.code === 'permission-denied') {
      return {
        status: JOIN_RESULT.DENIED,
        message: 'That code could not be used to join. Please check it with your teacher.'
      };
    }
    console.warn('[Join] Enrolment failed:', err.code || err.message);
    return { status: JOIN_RESULT.FAILED, message: 'Could not join just now. Please try again.' };
  }

  return {
    status: JOIN_RESULT.OK,
    classId,
    className,
    message: `You have joined ${className || 'your class'}. Your teacher can now see your work.`
  };
}
