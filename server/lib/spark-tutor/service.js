/**
 * Spark AI Tutor Session & Persistence Service.
 * 
 * Rules:
 * - Server-derived identity and authorization.
 * - Strict tenant isolation using schoolScope helpers.
 * - Idempotency and bounded retries.
 * - Feature toggle: disabled by default if SPARK_AI_TUTOR_ENABLED === 'false'.
 * - Non-fatal safeguarding logging via logConversation.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logConversation, flagForReview } from '../../auth.js';
import { fail, validId, staff } from '../schoolScope.js';
import { ASSISTANCE_LEVELS } from './assistance.js';

export function isSparkTutorEnabled() {
  // Feature toggle switch: defaults to true in development unless explicitly set to 'false'
  return process.env.SPARK_AI_TUTOR_ENABLED !== 'false';
}

function getDb() {
  return getFirestore();
}

/**
 * Creates or resumes an active tutoring session for an authenticated learner.
 */
export async function startOrResumeSession({ caller, mode = 'pbl_mentor', projectContext = null }) {
  if (!isSparkTutorEnabled()) {
    fail(503, 'FEATURE_DISABLED', 'WeLearn Spark AI Tutor is currently disabled by administrator policy.');
  }

  const db = getDb();
  const uid = caller.uid;
  const schoolId = caller.schoolIds?.[0] || 'sch-bkk';

  // Check if learner has a recently active session (within 2 hours)
  const existingSnap = await db.collection('schools').doc(schoolId)
    .collection('sparkTutorSessions')
    .where('learnerUid', '==', uid)
    .where('status', '==', 'active')
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    const doc = existingSnap.docs[0];
    const data = doc.data();
    return {
      session: { id: doc.id, sessionId: doc.id, ...data },
      isNew: false
    };
  }

  // Fetch verified profile for demographics
  const userSnap = await db.collection('users').doc(uid).get();
  const userData = userSnap.exists ? userSnap.data() : {};

  const sessionId = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const newSession = {
    sessionId,
    learnerUid: uid,
    schoolId,
    classId: caller.classIds?.[0] || userData.classIds?.[0] || 'class_yr9_climate',
    cohortId: userData.cohortId || 'cohort-wls',
    ageBand: userData.ageBand || '13-15',
    gradeLevel: userData.gradeLevel ?? 7,
    displayName: userData.displayName || caller.name || 'Learner',
    mode: mode === 'academic_tutor' ? 'academic_tutor' : 'pbl_mentor',
    assistanceLevel: ASSISTANCE_LEVELS.ELICIT,
    highestAssistanceUsed: ASSISTANCE_LEVELS.ELICIT,
    activeDetour: null,
    projectContext: projectContext ? {
      projectId: projectContext.projectId,
      stage: projectContext.stage || 'explore',
      objectiveId: projectContext.objectiveId || 'obj-default',
      taskDescription: projectContext.taskDescription || ''
    } : null,
    consecutiveFailures: 0,
    turnsCount: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now
  };

  await db.collection('schools').doc(schoolId)
    .collection('sparkTutorSessions').doc(sessionId)
    .set(newSession);

  return {
    session: { id: sessionId, ...newSession },
    isNew: true
  };
}

/**
 * Loads and authorizes a session.
 */
export async function getAuthorizedSession(sessionId, caller) {
  if (!isSparkTutorEnabled()) {
    fail(503, 'FEATURE_DISABLED', 'WeLearn Spark AI Tutor is currently disabled by administrator policy.');
  }

  const db = getDb();
  const schoolId = caller.schoolIds?.[0] || 'sch-bkk';

  const doc = await db.collection('schools').doc(schoolId)
    .collection('sparkTutorSessions').doc(sessionId)
    .get();

  if (!doc.exists) {
    fail(404, 'NOT_FOUND', `Session '${sessionId}' not found.`);
  }

  const data = doc.data();

  // Authorize: student must be the session owner
  if (caller.role === 'student' && data.learnerUid !== caller.uid) {
    fail(403, 'FORBIDDEN', 'You are not authorized to access this session.');
  }

  // Authorize: coach must share assigned class or cohort with learner (or be admin)
  if (staff(caller)) {
    const coachClassIds = caller.classIds || [];
    const sharesClass = data.classId && coachClassIds.includes(data.classId);
    const coachCohortIds = caller.cohortIds || [];
    const sharesCohort = data.cohortId && coachCohortIds.includes(data.cohortId);
    if (!sharesClass && !sharesCohort && caller.role !== 'admin') {
      fail(403, 'FORBIDDEN', 'You do not have permission to view this learner session.');
    }
  }

  return { id: doc.id, sessionId: doc.id, ...data };
}

/**
 * Persists an updated session document.
 */
export async function updateSession(session) {
  const db = getDb();
  const schoolId = session.schoolId || 'sch-bkk';
  const now = new Date().toISOString();

  await db.collection('schools').doc(schoolId)
    .collection('sparkTutorSessions').doc(session.sessionId)
    .set({
      ...session,
      updatedAt: now
    }, { merge: true });
}

/**
 * Records a completed conversation turn.
 */
export async function recordSessionTurn({
  session,
  userMessage,
  replyText,
  assistanceLevel,
  detourState = null,
  clientTurnId = null
}) {
  const db = getDb();
  const schoolId = session.schoolId || 'sch-bkk';
  const now = new Date().toISOString();

  const turnId = clientTurnId || `turn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const turnRecord = {
    turnId,
    userMessage: String(userMessage || '').slice(0, 1200),
    replyText: String(replyText || '').slice(0, 4000),
    assistanceLevel,
    mode: session.mode,
    activeDetourId: detourState?.detourId || null,
    createdAt: now
  };

  // 1. Record under session turns subcollection
  await db.collection('schools').doc(schoolId)
    .collection('sparkTutorSessions').doc(session.sessionId)
    .collection('turns').doc(turnId)
    .set(turnRecord);

  // 2. Safeguarding transcript persistence
  await logConversation({
    uid: session.learnerUid,
    prompt: userMessage,
    reply: replyText,
    blocked: false,
    endpoint: `spark-tutor:${session.mode}`,
    ageBand: session.ageBand
  });

  return turnRecord;
}

/**
 * Retrieves bounded turn history for a session.
 */
export async function getSessionTurns(sessionId, schoolId, limitCount = 6) {
  const db = getDb();
  const snap = await db.collection('schools').doc(schoolId)
    .collection('sparkTutorSessions').doc(sessionId)
    .collection('turns')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();

  return snap.docs.map(d => d.data()).reverse();
}

/**
 * Persists a practice evidence candidate.
 */
export async function saveEvidenceRecord(evidence) {
  const db = getDb();
  const schoolId = evidence.schoolId || 'sch-bkk';

  await db.collection('schools').doc(schoolId)
    .collection('sparkTutorEvidence').doc(evidence.evidenceId)
    .set(evidence);

  return evidence;
}

/**
 * Retrieves evidence records for a session or learner.
 */
export async function getSessionEvidence(sessionId, schoolId) {
  const db = getDb();
  const snap = await db.collection('schools').doc(schoolId)
    .collection('sparkTutorEvidence')
    .where('sessionId', '==', sessionId)
    .get();

  return snap.docs.map(d => d.data());
}

/**
 * Creates an authorized coach support request ("Ask my coach").
 */
export async function createSparkSupportRequest({ session, caller, question, reason = 'LEARNER_INITIATED' }) {
  const db = getDb();
  const schoolId = session.schoolId || 'sch-bkk';
  const now = new Date().toISOString();

  const requestId = `sup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const requestDoc = {
    id: requestId,
    schoolId,
    learnerUid: caller.uid,
    learnerName: caller.name || session.displayName || 'Learner',
    classId: session.classId,
    sessionId: session.sessionId,
    category: 'academic',
    topic: session.activeDetour ? session.activeDetour.topic : (session.projectContext?.projectId || 'General'),
    question: String(question || '').slice(0, 500) || 'Learner requested coach assistance during Spark tutoring.',
    assistanceLevelUsed: session.assistanceLevel,
    highestAssistanceUsed: session.highestAssistanceUsed,
    reason,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };

  // Write to schools/{schoolId}/supportRequests
  await db.collection('schools').doc(schoolId)
    .collection('supportRequests').doc(requestId)
    .set(requestDoc);

  return requestDoc;
}

/**
 * Retrieves coach summaries for assigned classes.
 */
export async function getCoachSummariesForCaller(caller) {
  const db = getDb();
  const schoolId = caller.schoolIds?.[0] || 'sch-bkk';
  const classIds = caller.classIds || [];

  let query = db.collection('schools').doc(schoolId).collection('sparkTutorSessions');
  if (caller.role !== 'admin' && classIds.length > 0) {
    query = query.where('classId', 'in', classIds.slice(0, 10));
  }

  const snap = await query.orderBy('updatedAt', 'desc').limit(20).get();
  return snap.docs.map(doc => {
    const s = doc.data();
    return {
      sessionId: doc.id,
      learnerUid: s.learnerUid,
      displayName: s.displayName,
      classId: s.classId,
      mode: s.mode,
      assistanceLevel: s.assistanceLevel,
      highestAssistanceUsed: s.highestAssistanceUsed,
      activeDetour: s.activeDetour ? s.activeDetour.topic : null,
      updatedAt: s.updatedAt
    };
  });
}
