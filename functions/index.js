/**
 * Cloud Functions for Firebase
 * Entrypoint: functions/index.js
 * Conforms to docs/data-contract.md.
 */

import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { createLearnerAccount } from '../server/routes/create-learner.js';
import { createApp } from '../server/app.js';

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
      gradeLevel: request.data?.gradeLevel,
      cohortId: request.data?.cohortId,
      caller: {
        uid: callerUid,
        role: callerRole,
        classIds: request.auth.token.classIds || [],
        cohortIds: request.auth.token.cohortIds || []
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

/**
 * HTTP Cloud Function: api (Express Gateway)
 * Wraps server/app.js Express app for /api rewrites.
 */
let appInstance;
function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}

export const api = onRequest(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
    minInstances: 0,
    cors: false
  },
  (req, res) => getApp()(req, res)
);

/**
 * Callable Cloud Function: generateCoachCue
 * Generates an AI coaching cue strictly grounded in a genuine submission.
 * Server-side execution only.
 */
export const generateCoachCue = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to generate coaching cues.');
  }

  const callerRole = request.auth.token?.role;
  const isAllowed = callerRole === 'admin' || callerRole === 'teacher' || callerRole === 'coach';
  if (!isAllowed) {
    throw new HttpsError('permission-denied', 'Only coaches and admins may generate coaching cues.');
  }

  const submissionId = request.data?.submissionId;
  if (!submissionId || typeof submissionId !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid submissionId is required.');
  }

  const { getFirestore } = await import('firebase-admin/firestore');
  const db = getFirestore();
  const subSnap = await db.collection('submissions').doc(submissionId).get();
  if (!subSnap.exists) {
    throw new HttpsError('not-found', 'Submission not found.');
  }

  const sub = subSnap.data();
  if (!sub.studentId || (!sub.reflection && !sub.evidence)) {
    throw new HttpsError('failed-precondition', 'Submission does not have sufficient content for cue generation.');
  }

  const studentSnap = await db.collection('users').doc(sub.studentId).get();
  const student = studentSnap.exists ? studentSnap.data() : {};

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  let cueText = '';

  if (apiKey) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an expert pedagogical coach at WeLearn SPARK.
Generate a concise, 1-2 sentence actionable coaching cue for the teacher reviewing this student submission.
Ground your response strictly on the student's submission without inventing facts.

Student Name: ${student.displayName || 'Learner'}
Activity: ${sub.activityId || sub.projectTitle || 'Milestone'}
Student Reflection: "${sub.reflection || 'None provided'}"
Evidence: ${JSON.stringify(sub.evidence || {})}

Format your response as a single concise coaching cue:`;

      const result = await model.generateContent(prompt);
      cueText = result.response.text()?.trim() || '';
    } catch (err) {
      console.warn('[generateCoachCue] AI generation error:', err);
      cueText = `Review ${student.displayName || 'Learner'}'s milestone evidence and formative reflection for ${sub.projectTitle || 'this project'}.`;
    }
  } else {
    cueText = `Review ${student.displayName || 'Learner'}'s milestone evidence and formative reflection for ${sub.projectTitle || 'this project'}.`;
  }

  const cuePayload = {
    coachCue: cueText,
    coachCueGeneratedAt: Date.now(),
    coachCueSourceSubmissionId: submissionId
  };

  await db.collection('submissions').doc(submissionId).update(cuePayload);

  return {
    submissionId,
    coachCue: cueText,
    generatedAt: cuePayload.coachCueGeneratedAt
  };
});
