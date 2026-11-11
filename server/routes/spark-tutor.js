/**
 * WeLearn Spark AI Tutor Express Router.
 * 
 * Endpoints:
 * - POST  /api/spark-tutor/session
 * - POST  /api/spark-tutor/session/:sessionId/message
 * - GET   /api/spark-tutor/session/:sessionId/history
 * - POST  /api/spark-tutor/session/:sessionId/mode
 * - POST  /api/spark-tutor/session/:sessionId/practice/submit
 * - POST  /api/spark-tutor/session/:sessionId/support-request
 * - GET   /api/spark-tutor/coach/summaries
 * - GET   /api/spark-tutor/coach/settings/:schoolId
 * - PATCH /api/spark-tutor/coach/settings/:schoolId
 */

import { Router } from 'express';
import { requireClaims } from '../middleware/auth.js';
import { flagForReview } from '../auth.js';
import { sendError } from '../lib/errors.js';
import { schoolCaller, staff, validId } from '../lib/schoolScope.js';
import { createRateLimiter } from '../lib/ai-resilience.js';
import { SparkTutorEngine } from '../lib/spark-tutor/engine.js';
import {
  isSparkTutorEnabled,
  startOrResumeSession,
  getAuthorizedSession,
  updateSession,
  recordSessionTurn,
  getSessionTurns,
  saveEvidenceRecord,
  getSessionEvidence,
  createSparkSupportRequest,
  getCoachSummariesForCaller,
  getTutoringSettings,
  updateTutoringSettings,
  acknowledgeSupportRequest
} from '../lib/spark-tutor/service.js';
import {
  createDetour,
  buildReturnToProjectBrief,
  checkNumericAnswer,
  BUILT_IN_PRACTICE_QUESTIONS,
  DETOUR_TOPICS
} from '../lib/spark-tutor/detour.js';
import { recordPracticeEvidence, compileCoachSummary } from '../lib/spark-tutor/evidence.js';
import { LEVEL_ORDER } from '../lib/spark-tutor/assistance.js';

export function createSparkTutorRouter(options = {}) {
  const router = Router();
  const engine = options.engine || new SparkTutorEngine({
    adapter: options.adapter || null,
    modelName: options.modelName || process.env.GEMINI_MODEL || 'gemini-3.6-flash'
  });

  const rateLimiter = options.rateLimiter || createRateLimiter({ maxEntries: 1000 });
  const maxRequestsPerWindow = options.rateLimitMaxRequests || 30; // 30 requests per minute
  const windowMs = options.rateLimitWindowMs || 60000;

  // 1. Authentication
  router.use(requireClaims);

  // 2. Validate Feature Toggle
  router.use((req, res, next) => {
    if (!isSparkTutorEnabled()) {
      return sendError(res, 503, 'FEATURE_DISABLED', 'WeLearn Spark AI Tutor is currently disabled by administrator policy.');
    }
    next();
  });

  // 3. Resolve Verified School Caller
  router.use(async (req, res, next) => {
    try {
      req.schoolCaller = await schoolCaller(req);
      next();
    } catch (err) {
      if (err.status) return sendError(res, err.status, err.code, err.message);
      next(err);
    }
  });

  // 4. Rate Limiter per Learner UID on state-mutating operations
  router.use((req, res, next) => {
    if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
      const uid = req.schoolCaller?.uid || req.user?.uid;
      if (uid) {
        const allowed = rateLimiter.check(uid, maxRequestsPerWindow, windowMs);
        if (!allowed) {
          return sendError(res, 429, 'RATE_LIMITED', 'Rate limit exceeded. Please wait a moment before sending another message.');
        }
      }
    }
    next();
  });

  // Error wrapper
  const wrap = fn => async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error.status) return sendError(res, error.status, error.code, error.message);
      console.error('[SparkTutor Error]', error);
      return sendError(res, 500, 'INTERNAL', 'Failed to process tutor request.');
    }
  };

  /**
   * POST /session - Start or resume session
   */
  router.post('/session', wrap(async (req, res) => {
    const { mode = 'pbl_mentor', projectContext } = req.body || {};
    const schoolId = req.schoolCaller.schoolIds?.[0];
    const classId = req.schoolCaller.classIds?.[0];
    if (schoolId && classId) {
      const settings = await getTutoringSettings(schoolId, classId);
      if (settings.allowedModes && !settings.allowedModes.includes(mode)) {
        return sendError(res, 403, 'FORBIDDEN', `Mode '${mode}' is not permitted by class tutoring policy.`);
      }
    }

    const { session, isNew } = await startOrResumeSession({
      caller: req.schoolCaller,
      mode,
      projectContext
    });

    const isMars = projectContext?.projectId === 'mars-colony-hab-2026';
    const initialGreeting = isNew
      ? (isMars
          ? "Hi! I'm Spark, your learning companion. I see you're working on the Mars Colony solar array sizing. What calculations or power targets are you tackling first?"
          : "Hello! I'm Spark. What project or concept are we exploring today?")
      : "Welcome back! Let's pick up where we left off.";

    res.json({
      session,
      isNew,
      initialMessage: {
        role: 'assistant',
        text: initialGreeting,
        suggestedActions: isMars
          ? ["I need to calculate solar area for 24 kW", "Give me a hint on Martian sunlight"]
          : ["Explore project milestones", "Ask a question"]
      }
    });
  }));

  /**
   * POST /session/:sessionId/message - Submit a message turn
   */
  router.post('/session/:sessionId/message', wrap(async (req, res) => {
    const { sessionId } = req.params;
    const { message, clientTurnId, assessmentRestricted } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return sendError(res, 400, 'VALIDATION', 'Message text is required.');
    }

    const session = await getAuthorizedSession(sessionId, req.schoolCaller);
    const recentTurns = await getSessionTurns(sessionId, session.schoolId, 6);

    // Curriculum resources approved for grounding
    const approvedResources = [
      {
        id: 'res-math-ratios-7',
        title: 'Proportional Reasoning and Unit Rates (Grade 7)',
        summary: 'Power scales proportionally with surface area: Total Watts = (Watts / m²) * Area in m².',
        version: 1
      },
      {
        id: 'res-mars-power-prototype',
        title: 'Martian Habitat Power Specifications',
        summary: 'Base electrical load requires 24 kW. Dust storms reduce normal solar irradiance to 1/4.',
        version: 1
      }
    ];

    // Resolve tutoring settings & restrictions server-side
    const schoolSettings = await getTutoringSettings(session.schoolId, session.classId);

    // 1. Enforce allowedModes policy
    if (schoolSettings.allowedModes && !schoolSettings.allowedModes.includes(session.mode)) {
      return sendError(res, 403, 'FORBIDDEN', `Mode '${session.mode}' is currently disabled for your class.`);
    }

    // 2. Enforce disabledTopics policy if learner is in an active detour or requesting a topic
    const activeOrRequestedTopic = session.activeDetour?.topic || req.body?.requestedTopic;
    if (activeOrRequestedTopic && schoolSettings.disabledTopics?.includes(activeOrRequestedTopic)) {
      return sendError(res, 403, 'FORBIDDEN', `Topic '${activeOrRequestedTopic}' is disabled for your class.`);
    }

    const isRestricted = Boolean(
      session.assessmentRestricted ||
      session.projectContext?.assessmentRestricted ||
      schoolSettings.assessmentLock ||
      assessmentRestricted
    );

    const turnResult = await engine.processTurn({
      learnerProfile: req.schoolCaller.profile || req.schoolCaller,
      session,
      userMessage: message,
      recentTurns,
      approvedResources,
      assessmentRestricted: isRestricted
    });

    // 3. Handle Safeguarding Disclosures
    if (turnResult.safeguardingFlagged) {
      await createSparkSupportRequest({
        session,
        caller: req.schoolCaller,
        question: `[SAFEGUARDING ALERT] Learner disclosed concerning statement: "${message.slice(0, 100)}"`,
        reason: 'SAFEGUARDING',
        priority: 'urgent'
      });

      await flagForReview({
        uid: req.schoolCaller.uid,
        prompt: message,
        reason: 'safeguarding_disclosure',
        severity: 'high',
        endpoint: 'spark-tutor'
      });

      const turnRecord = await recordSessionTurn({
        session,
        userMessage: message,
        replyText: turnResult.reply,
        assistanceLevel: turnResult.assistanceLevel,
        detourState: session.activeDetour,
        clientTurnId,
        blocked: true,
        flagged: true,
        flaggedReason: turnResult.safeguardingReason
      });

      return res.json({
        sessionId,
        turnId: turnRecord.turnId,
        reply: turnResult.reply,
        mode: session.mode,
        assistanceLevel: turnResult.assistanceLevel,
        safeguardingFlagged: true,
        suggestedActions: turnResult.suggestedActions
      });
    }

    // 4. Enforce maxAssistanceLevel ceiling from coach settings
    if (schoolSettings.maxAssistanceLevel) {
      const maxIdx = LEVEL_ORDER.indexOf(schoolSettings.maxAssistanceLevel);
      const currentIdx = LEVEL_ORDER.indexOf(turnResult.assistanceLevel);
      if (currentIdx > maxIdx && maxIdx !== -1) {
        turnResult.assistanceLevel = schoolSettings.maxAssistanceLevel;
      }
    }

    // 5. Suppress detour offers for disabled topics
    if (turnResult.detourOffer && schoolSettings.disabledTopics?.includes(turnResult.detourOffer.topic)) {
      turnResult.detourOffer = null;
    }

    // Update highest assistance level reached in this session
    const currentHighIdx = LEVEL_ORDER.indexOf(session.highestAssistanceUsed || 'elicit');
    const newIdx = LEVEL_ORDER.indexOf(turnResult.assistanceLevel);
    const highestAssistanceUsed = newIdx > currentHighIdx ? turnResult.assistanceLevel : session.highestAssistanceUsed;

    // Record turn in persistence & transcript
    const turnRecord = await recordSessionTurn({
      session,
      userMessage: message,
      replyText: turnResult.reply,
      assistanceLevel: turnResult.assistanceLevel,
      detourState: session.activeDetour,
      clientTurnId
    });

    // Update session state
    session.assistanceLevel = turnResult.assistanceLevel;
    session.highestAssistanceUsed = highestAssistanceUsed;
    session.turnsCount = (session.turnsCount || 0) + 1;
    if (turnResult.detourOffer) {
      session.pendingDetourOffer = turnResult.detourOffer;
    }
    await updateSession(session);

    res.json({
      sessionId,
      turnId: turnRecord.turnId,
      reply: turnResult.reply,
      mode: session.mode,
      assistanceLevel: turnResult.assistanceLevel,
      transitionReason: turnResult.transitionReason,
      detourOffer: turnResult.detourOffer,
      suggestedActions: turnResult.suggestedActions,
      activeDetour: session.activeDetour,
      recommendCoachEscalation: turnResult.recommendCoachEscalation,
      safeguardingFlagged: Boolean(turnResult.safeguardingFlagged)
    });
  }));

  /**
   * GET /session/:sessionId/history - Get bounded turns
   */
  router.get('/session/:sessionId/history', wrap(async (req, res) => {
    const { sessionId } = req.params;
    const session = await getAuthorizedSession(sessionId, req.schoolCaller);
    const limitCount = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 6));
    const turns = await getSessionTurns(sessionId, session.schoolId, limitCount);

    res.json({
      sessionId,
      mode: session.mode,
      assistanceLevel: session.assistanceLevel,
      highestAssistanceUsed: session.highestAssistanceUsed,
      activeDetour: session.activeDetour,
      turns
    });
  }));

  /**
   * POST /session/:sessionId/mode - Switch mode (e.g. entering or returning from Detour)
   */
  router.post('/session/:sessionId/mode', wrap(async (req, res) => {
    const { sessionId } = req.params;
    const { mode, targetMode, detourId, topic, returnToProject } = req.body || {};
    const effectiveMode = mode || targetMode || (detourId ? 'academic_tutor' : null);

    const session = await getAuthorizedSession(sessionId, req.schoolCaller);
    const settings = await getTutoringSettings(session.schoolId, session.classId);

    if (returnToProject) {
      // Return from Academic Detour to originating PBL project
      const returnBrief = buildReturnToProjectBrief(
        session.activeDetour?.originatingProjectContext || session.projectContext,
        session.activeDetour
      );

      session.mode = 'pbl_mentor';
      session.activeDetour = null;
      session.pendingDetourOffer = null;
      await updateSession(session);

      return res.json({
        sessionId,
        mode: session.mode,
        returnedToProject: true,
        brief: returnBrief
      });
    }

    // Enforce allowedModes policy
    if (effectiveMode && settings.allowedModes && !settings.allowedModes.includes(effectiveMode)) {
      return sendError(res, 403, 'FORBIDDEN', `Mode '${effectiveMode}' is not permitted by class tutoring policy.`);
    }

    if (effectiveMode === 'academic_tutor' || detourId) {
      const detourTopic = topic || DETOUR_TOPICS.RATIOS_FRACTIONS;
      // Enforce disabledTopics policy
      if (settings.disabledTopics?.includes(detourTopic)) {
        return sendError(res, 403, 'FORBIDDEN', `Topic '${detourTopic}' is disabled for your class.`);
      }

      // Enter academic detour
      const detour = createDetour({
        originatingProjectContext: session.projectContext,
        topic: detourTopic,
        reason: 'PREREQUISITE_GAP_IDENTIFIED'
      });

      session.mode = 'academic_tutor';
      session.activeDetour = detour;
      session.pendingDetourOffer = null;
      await updateSession(session);

      const firstTask = BUILT_IN_PRACTICE_QUESTIONS[detour.currentTaskId];

      return res.json({
        sessionId,
        mode: session.mode,
        activeDetour: detour,
        initialPracticeTask: {
          taskId: firstTask.id,
          question: firstTask.question,
          promptHint: firstTask.promptHint,
          unit: firstTask.unit
        }
      });
    }

    if (mode === 'pbl_mentor') {
      session.mode = 'pbl_mentor';
      await updateSession(session);
      return res.json({ sessionId, mode: session.mode });
    }

    return sendError(res, 400, 'VALIDATION', 'Invalid mode transition requested.');
  }));

  /**
   * POST /session/:sessionId/practice/submit - Deterministically grade practice
   */
  router.post('/session/:sessionId/practice/submit', wrap(async (req, res) => {
    const { sessionId } = req.params;
    const { taskId, answer } = req.body || {};

    const session = await getAuthorizedSession(sessionId, req.schoolCaller);

    if (!taskId || typeof taskId !== 'string' || !BUILT_IN_PRACTICE_QUESTIONS[taskId]) {
      return sendError(res, 400, 'VALIDATION', `Unknown practice task '${taskId || ''}'. Valid tasks: ${Object.keys(BUILT_IN_PRACTICE_QUESTIONS).join(', ')}`);
    }

    const task = BUILT_IN_PRACTICE_QUESTIONS[taskId];
    const evalResult = checkNumericAnswer(answer, task);

    // Record immutable evidence candidate with absolute NO XP / NO grade impact
    const evidence = recordPracticeEvidence({
      learnerUid: session.learnerUid,
      schoolId: session.schoolId,
      sessionId,
      objectiveId: 'math.ratios.proportional_reasoning',
      taskId: task.id,
      learnerResponse: answer,
      assistanceUsed: session.assistanceLevel,
      evaluationResult: evalResult
    });

    await saveEvidenceRecord(evidence);

    // Update session practiceStats directly on session doc for fast coach summaries
    const currentStats = session.practiceStats || { totalAttempts: 0, correctCount: 0, passRate: null };
    currentStats.totalAttempts = (currentStats.totalAttempts || 0) + 1;
    if (evalResult.correct) {
      currentStats.correctCount = (currentStats.correctCount || 0) + 1;
    }
    currentStats.passRate = Math.round((currentStats.correctCount / currentStats.totalAttempts) * 100);
    session.practiceStats = currentStats;

    let nextTaskId = null;
    let nextTask = null;
    let readyToReturn = false;
    let returnPrompt = null;

    if (evalResult.correct) {
      if (task.id === 'prac-ratio-solar-01') {
        nextTaskId = 'prac-ratio-dust-02';
      } else if (task.id === 'prac-ratio-dust-02') {
        nextTaskId = 'prac-ratio-mars-total-03';
      } else {
        readyToReturn = true;
        const returnBrief = buildReturnToProjectBrief(
          session.activeDetour?.originatingProjectContext || session.projectContext
        );
        returnPrompt = returnBrief.prompt;
      }

      if (nextTaskId && BUILT_IN_PRACTICE_QUESTIONS[nextTaskId]) {
        const nextSpec = BUILT_IN_PRACTICE_QUESTIONS[nextTaskId];
        nextTask = {
          taskId: nextSpec.id,
          question: nextSpec.question,
          promptHint: nextSpec.promptHint,
          unit: nextSpec.unit
        };
        if (session.activeDetour) {
          session.activeDetour.currentTaskId = nextTaskId;
        }
      }
    }

    await updateSession(session);

    res.json({
      sessionId,
      taskId: task.id,
      correct: evalResult.correct,
      feedback: evalResult.feedback,
      userValue: evalResult.userValue,
      expectedValue: evalResult.expectedValue,
      nextTaskId,
      nextTask,
      readyToReturn,
      returnPrompt,
      evidenceCandidate: {
        evidenceId: evidence.evidenceId,
        performanceType: evidence.performanceType,
        officialProgressImpact: false,
        xpAwarded: 0
      }
    });
  }));

  /**
   * POST /session/:sessionId/support-request - "Ask my coach"
   */
  router.post('/session/:sessionId/support-request', wrap(async (req, res) => {
    const { sessionId } = req.params;
    const { question, reason } = req.body || {};

    const session = await getAuthorizedSession(sessionId, req.schoolCaller);
    const requestDoc = await createSparkSupportRequest({
      session,
      caller: req.schoolCaller,
      question,
      reason
    });

    res.json({
      requestId: requestDoc.id,
      status: 'pending',
      message: 'Your coach has been notified and can see where you are working.'
    });
  }));

  /**
   * GET /coach/summaries - Coach dashboard view of learner assistance
   */
  router.get('/coach/summaries', wrap(async (req, res) => {
    if (!staff(req.schoolCaller) && req.schoolCaller.role !== 'admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Only assigned coaches and staff can view summaries.');
    }

    const summaries = await getCoachSummariesForCaller(req.schoolCaller);
    res.json({ items: summaries });
  }));

  /**
   * GET /coach/settings/:scopeId - Get tutoring settings
   */
  router.get('/coach/settings/:scopeId', wrap(async (req, res) => {
    const { scopeId } = req.params;
    if (!validId(scopeId)) return sendError(res, 400, 'VALIDATION', 'Invalid scopeId.');
    const schoolId = req.schoolCaller.schoolIds?.[0];
    if (!schoolId) return sendError(res, 403, 'FORBIDDEN', 'No verified school membership.');

    // Staff/admin can view any class settings; learners can only view default or their own assigned class
    if (!staff(req.schoolCaller) && req.schoolCaller.role !== 'admin') {
      const studentClassIds = req.schoolCaller.classIds || [];
      if (scopeId !== 'default' && !studentClassIds.includes(scopeId)) {
        return sendError(res, 403, 'FORBIDDEN', 'Learners may only view tutoring settings for their own assigned class.');
      }
    }

    const settings = await getTutoringSettings(schoolId, scopeId);
    res.json(settings);
  }));

  /**
   * PATCH /coach/settings/:scopeId - Update tutoring settings
   */
  router.patch('/coach/settings/:scopeId', wrap(async (req, res) => {
    const { scopeId } = req.params;
    if (!validId(scopeId)) return sendError(res, 400, 'VALIDATION', 'Invalid scopeId.');
    if (!staff(req.schoolCaller) && req.schoolCaller.role !== 'admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Only assigned coaches and administrators can update settings.');
    }
    const schoolId = req.schoolCaller.schoolIds?.[0];
    if (!schoolId) return sendError(res, 403, 'FORBIDDEN', 'No verified school membership.');
    const updated = await updateTutoringSettings(schoolId, scopeId, req.body || {}, req.schoolCaller);
    res.json(updated);
  }));

  /**
   * POST /coach/actions/acknowledge - Coach acknowledges support request
   */
  router.post('/coach/actions/acknowledge', wrap(async (req, res) => {
    if (!staff(req.schoolCaller) && req.schoolCaller.role !== 'admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Only assigned coaches can acknowledge support requests.');
    }
    const { requestId } = req.body || {};
    if (!requestId) return sendError(res, 400, 'VALIDATION', 'requestId is required.');
    const schoolId = req.schoolCaller.schoolIds?.[0];
    if (!schoolId) return sendError(res, 403, 'FORBIDDEN', 'No verified school membership.');
    const result = await acknowledgeSupportRequest(schoolId, requestId, req.schoolCaller);
    res.json(result);
  }));

  return router;
}

export default createSparkTutorRouter();
