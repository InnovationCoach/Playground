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

  const turnsCol = db.collection('schools').doc(schoolId)
    .collection('sparkTutorSessions').doc(session.sessionId)
    .collection('turns');

  // Idempotency: if a turn with this clientTurnId was already saved, return it without duplicating or overwriting
  if (clientTurnId) {
    const existingSnap = await turnsCol.where('clientTurnId', '==', clientTurnId).limit(1).get();
    if (!existingSnap.empty) {
      return existingSnap.docs[0].data();
    }
  }

  // Generate unique document ID so turns never overwrite each other
  const turnRef = turnsCol.doc();
  const turnId = turnRef.id;

  const turnRecord = {
    turnId,
    clientTurnId: clientTurnId || null,
    userMessage: String(userMessage || '').slice(0, 1200),
    replyText: String(replyText || '').slice(0, 4000),
    assistanceLevel,
    mode: session.mode,
    activeDetourId: detourState?.detourId || null,
    createdAt: now
  };

  await turnRef.set(turnRecord);

  // Safeguarding transcript persistence
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
 * Retrieves coach summaries for assigned classes, enriched with practice stats and insights.
 */
export async function getCoachSummariesForCaller(caller) {
  const db = getDb();
  const schoolId = caller.schoolIds?.[0] || 'sch-bkk';
  const classIds = caller.classIds || [];

  // Security guard: a teacher with NO assigned class IDs must receive [] immediately
  if (caller.role !== 'admin') {
    if (!classIds || classIds.length === 0) {
      return [];
    }
  }

  let query = db.collection('schools').doc(schoolId).collection('sparkTutorSessions');
  if (caller.role !== 'admin' && classIds.length > 0) {
    query = query.where('classId', 'in', classIds.slice(0, 10));
  }

  const snap = await query.orderBy('updatedAt', 'desc').limit(20).get();
  const summaries = [];

  for (const doc of snap.docs) {
    const s = doc.data();
    const sessionId = doc.id;

    // Fetch practice evidence for this session
    const eviSnap = await db.collection('schools').doc(schoolId)
      .collection('sparkTutorEvidence')
      .where('sessionId', '==', sessionId)
      .get();
    const evidenceList = eviSnap.docs.map(d => d.data());

    // Fetch support request for this session if any
    const supSnap = await db.collection('schools').doc(schoolId)
      .collection('supportRequests')
      .where('sessionId', '==', sessionId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    const supportRequest = !supSnap.empty ? supSnap.docs[0].data() : null;

    const correctCount = evidenceList.filter(e => e.evaluationResult?.correct).length;
    const totalAttempts = evidenceList.length;

    summaries.push({
      sessionId,
      learnerUid: s.learnerUid,
      displayName: s.displayName,
      classId: s.classId,
      mode: s.mode,
      assistanceLevel: s.assistanceLevel,
      highestAssistanceUsed: s.highestAssistanceUsed,
      activeDetour: s.activeDetour ? s.activeDetour.topic : null,
      practiceStats: {
        totalAttempts,
        correctCount,
        passRate: totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : null
      },
      supportRequested: Boolean(supportRequest),
      supportDetails: supportRequest ? {
        id: supportRequest.id,
        status: supportRequest.status,
        question: supportRequest.question,
        requestedAt: supportRequest.createdAt
      } : null,
      provisionalInsights: [
        totalAttempts > 0 && correctCount === totalAttempts
          ? 'Completed all practice tasks accurately.'
          : (totalAttempts > 0 ? 'Practicing proportional scaling.' : null),
        s.highestAssistanceUsed === 'guided_application'
          ? 'Benefited from step-by-step guidance.'
          : null
      ].filter(Boolean),
      updatedAt: s.updatedAt
    });
  }

  return summaries;
}

/**
 * Tutoring settings for school or class scope.
 */
export async function getTutoringSettings(schoolId, scopeId = 'default') {
  const db = getDb();
  const doc = await db.collection('schools').doc(schoolId)
    .collection('tutoringSettings').doc(scopeId)
    .get();

  if (!doc.exists) {
    return {
      scopeId,
      allowedModes: ['pbl_mentor', 'academic_tutor'],
      maxAssistanceLevel: 'guided_application',
      assessmentLock: false,
      disabledTopics: []
    };
  }
  return doc.data();
}

export async function updateTutoringSettings(schoolId, scopeId = 'default', updates = {}, caller) {
  const db = getDb();
  const now = new Date().toISOString();

  const validLevels = ['elicit', 'hint', 'scaffold', 'analogous_example', 'guided_application'];
  const sanitized = {
    scopeId,
    allowedModes: Array.isArray(updates.allowedModes) ? updates.allowedModes : ['pbl_mentor', 'academic_tutor'],
    maxAssistanceLevel: validLevels.includes(updates.maxAssistanceLevel) ? updates.maxAssistanceLevel : 'guided_application',
    assessmentLock: Boolean(updates.assessmentLock),
    disabledTopics: Array.isArray(updates.disabledTopics) ? updates.disabledTopics : [],
    updatedBy: caller.uid,
    updatedAt: now
  };

  await db.collection('schools').doc(schoolId)
    .collection('tutoringSettings').doc(scopeId)
    .set(sanitized, { merge: true });

  return sanitized;
}

/**
 * Coach action: acknowledge a support request or student session.
 */
export async function acknowledgeSupportRequest(schoolId, requestId, caller) {
  const db = getDb();
  const reqRef = db.collection('schools').doc(schoolId).collection('supportRequests').doc(requestId);
  const snap = await reqRef.get();
  if (!snap.exists) fail(404, 'NOT_FOUND', 'Support request not found.');

  await reqRef.update({
    status: 'acknowledged',
    reviewedBy: caller.uid,
    reviewedAt: new Date().toISOString()
  });

  return { ok: true, requestId, status: 'acknowledged' };
}
