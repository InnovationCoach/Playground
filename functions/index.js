/**
 * Cloud Functions for Firebase
 * Entrypoint: functions/index.js
 * Conforms to docs/data-contract.md.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { createLearnerAccount } from '../server/routes/create-learner.js';

if (!getApps().length) {
  initializeApp();
}

/**
 * Callable Cloud Function: createLearner
 * Restricted to coaches and admins.
 * Creates learner account, sets role:'learner', and adds to classes/{classId}.learnerIds.
 */
export const createLearner = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to register learners.');
  }

  const callerRole = request.auth.token.role;
  const callerUid = request.auth.uid;
  const isAllowed = callerRole === 'admin' || callerRole === 'teacher' || callerRole === 'coach';

  if (!isAllowed) {
    throw new HttpsError('permission-denied', 'Only coaches and admins may register new learners.');
  }

  try {
    const result = await createLearnerAccount({
      email: request.data?.email,
      displayName: request.data?.displayName || request.data?.name,
      classId: request.data?.classId,
      caller: {
        uid: callerUid,
        role: callerRole,
        classIds: request.auth.token.classIds || []
      },
      password: request.data?.password
    });
    return result;
  } catch (err) {
    const statusMap = {
      NOT_FOUND: 'not-found',
      CONFLICT: 'already-exists',
      FORBIDDEN: 'permission-denied',
      VALIDATION: 'invalid-argument'
    };
    throw new HttpsError(statusMap[err.code] || 'internal', err.message || 'Failed to create learner.');
  }
});
