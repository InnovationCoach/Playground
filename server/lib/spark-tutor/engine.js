/**
 * Spark AI Tutor Orchestration Engine.
 * 
 * Coordinates:
 * - Safeguarding & prompt injection defense.
 * - 5-level assistance ladder transitions.
 * - Mars colony to ratios detour offers.
 * - Upstream AI completion with adapter injection (supporting test doubles).
 * - Output validation, citation filtering, and assessment leak defense.
 */

import { wrapStudentInput } from '../../safety.js';
import { resolveAssistanceTransition, LEVEL_ORDER } from './assistance.js';
import { assembleTutorContext, buildTutorSystemPrompt } from './context.js';
import {
  checkSafeguarding,
  detectPromptInjection,
  filterApprovedCitations,
  sanitizeAssessmentAnswerLeaks,
  SAFEGUARDING_REFERRAL_MESSAGE
} from './safety.js';
import { DETOUR_TOPICS } from './detour.js';

export class SparkTutorEngine {
  constructor({ adapter = null, modelName = 'gemini-3.6-flash' } = {}) {
    this.adapter = adapter;
    this.modelName = modelName;
  }

  /**
   * Process a single learner turn.
   */
  async processTurn({
    learnerProfile,
    session,
    userMessage,
    recentTurns = [],
    approvedResources = [],
    assessmentRestricted = false,
    maxAssistanceLevel = null
  }) {
    const rawMessage = String(userMessage || '').trim();

    // 1. Safeguarding Guard
    const safeguarding = checkSafeguarding(rawMessage);
    if (safeguarding.flagged) {
      return {
        reply: SAFEGUARDING_REFERRAL_MESSAGE,
        assistanceLevel: session.assistanceLevel,
        safeguardingFlagged: true,
        safeguardingReason: safeguarding.reason,
        suggestedActions: ['Talk to my coach', 'Return to safe activities'],
        detourOffer: null
      };
    }

    // 2. Prompt Injection Defense
    const isInjectionAttempt = detectPromptInjection(rawMessage);
    if (isInjectionAttempt) {
      return {
        reply: "I'm here to help you understand concepts and guide your learning. Let's focus on the topic we're working on together.",
        assistanceLevel: session.assistanceLevel,
        promptInjectionDetected: true,
        transitionReason: 'PROMPT_INJECTION_DEFENSE',
        suggestedActions: ['Continue current lesson', 'Ask a project question'],
        detourOffer: null
      };
    }
    const sanitizedStudentMessage = wrapStudentInput(rawMessage);

    // 3. Check for Prerequisite Gaps & Detour Triggers
    const lower = rawMessage.toLowerCase();
    const isMarsSolarProblem = session.projectContext?.projectId === 'mars-colony-hab-2026' ||
      (session.projectContext?.taskDescription && session.projectContext.taskDescription.includes('solar'));
    const strugglesWithRatios = lower.includes('ratio') || lower.includes('dust') || lower.includes('how many square meters') || lower.includes('kW') || lower.includes('divide');

    const shouldOfferRatiosDetour = session.mode === 'pbl_mentor' && !session.activeDetour && isMarsSolarProblem && strugglesWithRatios;

    // 4. Resolve Assistance Ladder Transition (clamped to maxAssistanceLevel BEFORE response generation)
    const assistanceTransition = resolveAssistanceTransition({
      currentLevel: session.assistanceLevel,
      consecutiveFailures: session.consecutiveFailures || 0,
      studentMessage: rawMessage,
      assessmentRestricted,
      prerequisiteMissing: shouldOfferRatiosDetour,
      maxAssistanceLevel
    });

    const activeLevel = assistanceTransition.assistanceLevel;

    // 5. Assemble Structured Context
    const tutorContext = assembleTutorContext({
      learnerProfile,
      session: {
        ...session,
        assistanceLevel: activeLevel
      },
      projectContext: session.projectContext,
      recentTurns,
      approvedResources,
      assessmentRestricted
    });

    const systemPrompt = buildTutorSystemPrompt(tutorContext);

    // 6. Upstream AI Call or Mock Completion
    let replyText = '';
    if (this.adapter && typeof this.adapter.complete === 'function') {
      const result = await this.adapter.complete({
        system: systemPrompt,
        user: sanitizedStudentMessage
      });
      replyText = typeof result?.text === 'string' ? result.text : String(result || '');
    } else {
      // Default rule-based fallback response if adapter is not provided
      replyText = this.generateFallbackResponse({
        context: tutorContext,
        assistanceLevel: activeLevel,
        isMarsSolarProblem,
        userMessage: rawMessage
      });
    }

    // 7. Filter Citations & Sanitize Assessment Leaks
    replyText = filterApprovedCitations(replyText, approvedResources);
    replyText = sanitizeAssessmentAnswerLeaks(replyText, {
      assessmentRestricted,
      expectedAnswer: session.projectContext?.expectedAnswer
    });

    // 8. Construct Detour Offer if appropriate
    let detourOffer = null;
    if (shouldOfferRatiosDetour) {
      detourOffer = {
        detourId: 'detour-mars-ratios',
        topic: DETOUR_TOPICS.RATIOS_FRACTIONS,
        title: 'Scaling Solar Arrays with Ratios',
        reason: 'Understanding how power scales proportionally with surface area will help you calculate the Martian habitat array.',
        suggestedDetour: true
      };
    }

    // 9. Suggested Actions
    const suggestedActions = this.buildSuggestedActions({
      mode: session.mode,
      activeDetour: session.activeDetour,
      hasDetourOffer: Boolean(detourOffer),
      assistanceLevel: activeLevel,
      recommendCoach: assistanceTransition.recommendCoachEscalation
    });

    return {
      reply: replyText.trim(),
      assistanceLevel: activeLevel,
      transitionReason: assistanceTransition.transitionReason,
      detourOffer,
      suggestedActions,
      isFrustrated: assistanceTransition.isFrustrated,
      representationChanged: assistanceTransition.representationChanged,
      recommendCoachEscalation: assistanceTransition.recommendCoachEscalation
    };
  }

  generateFallbackResponse({ context, assistanceLevel, isMarsSolarProblem, userMessage }) {
    if (isMarsSolarProblem && assistanceLevel === 'hint') {
      return "Calculating power for the Mars habitat is all about scaling! Notice how the dust storm drops sunlight by a ratio of 1 to 4. What would happen to your required surface area if each panel produces only one-fourth of its normal power?";
    }
    if (isMarsSolarProblem && assistanceLevel === 'scaffold') {
      return "Let's break the Mars solar problem down into two steps:\n1. First, find how many Watts one square meter produces during a dust storm.\n2. Second, divide the total 24,000 W needed by that number to find the total area in m².\nWhat do you think is step 1?";
    }
    if (assistanceLevel === 'analogous_example') {
      return "Here is a similar example: Imagine a research buoy in the ocean needing 500 W. If 1 m² produces 50 W, the ratio is 500 / 50 = 10 m². Notice how dividing total power by power-per-area gives the area needed!";
    }
    return "What part of the calculation feels most uncertain right now? Tell me what you've calculated so far.";
  }

  buildSuggestedActions({ mode, activeDetour, hasDetourOffer, assistanceLevel, recommendCoach }) {
    const actions = [];

    if (hasDetourOffer) {
      actions.push("Let's do the detour", "I want to try the Mars numbers first");
    } else if (activeDetour) {
      actions.push("Next practice question", "Explain differently", "Return to my project");
    } else {
      if (assistanceLevel === 'elicit') actions.push("Give me a hint", "Break it down");
      else if (assistanceLevel === 'hint') actions.push("Show me a similar example", "Explain differently");
      else if (assistanceLevel === 'scaffold') actions.push("Walk me through it", "I'm stuck");
      else actions.push("Review my thinking", "Let me try another one");
    }

    if (recommendCoach) {
      actions.push("Ask my coach");
    }

    return actions.slice(0, 4);
  }
}
