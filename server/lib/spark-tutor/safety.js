/**
 * Child Safety, Prompt Injection Guard, and Assessment Protection for Spark AI Tutor.
 */

import { wrapStudentInput } from '../../safety.js';

export const SAFEGUARDING_REFERRAL_MESSAGE =
  "That sounds really important. Please talk to your coach, teacher, or another adult you trust right now.";

export const SAFEGUARDING_PATTERNS = [
  {
    pattern: /\b(kill myself|commit suicide|end my life|want to die|hurt myself|cut myself|cutting myself|cut my wrist|cutting my wrist|slit my wrist|take my own life|kms|hang myself|overdose|suicidal|suicide|end it all|rather be dead|better off dead|no reason to live|dont want to live|don't want to live|self-harm|self harm|bleed out|want to disappear forever)\b/i,
    reason: 'SELF_HARM'
  },
  {
    pattern: /\b(being abused|touches me inappropriately|touches me|hits me at home|abused by|abusing me|sexual abuse|physical abuse|domestic violence|beaten at home|beats me|hurts me at home)\b/i,
    reason: 'ABUSE'
  },
  {
    pattern: /\b(in danger|someone is hurting me|scared to go home|forced to|forcing me|traffick(ed|ing)|someone threatened to kill me|threatened to hurt me|stalking me|kidnapped)\b/i,
    reason: 'IMMEDIATE_DANGER'
  }
];

/**
 * Checks for safeguarding triggers (self-harm, abuse, immediate danger).
 */
export function checkSafeguarding(text) {
  if (!text || typeof text !== 'string') return { flagged: false, reason: null };
  const lower = text.toLowerCase();

  for (const { pattern, reason } of SAFEGUARDING_PATTERNS) {
    if (pattern.test(lower)) {
      return { flagged: true, reason };
    }
  }

  return { flagged: false, reason: null };
}

/**
 * Detects prompt injection attempts aiming to override tutor policies.
 */
export function detectPromptInjection(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.toLowerCase();

  const injectionPatterns = [
    /\bignore (all |previous |prior )?instructions\b/,
    /\byou are now (in developer mode|an unrestricted ai|jailbroken|dan)\b/,
    /\breveal (your |the )?(system prompt|instructions|rules)\b/,
    /\bas (the |my )?coach,? (i order|i authorize|give me)\b/,
    /\bpretend (there are no rules|you are not a tutor)\b/,
    /\bgive me the (answer key|test answers|direct solution)\b/
  ];

  return injectionPatterns.some(p => p.test(t));
}

/**
 * Validates that model citations strictly match approved curriculum resources.
 */
export function filterApprovedCitations(replyText, approvedResources = []) {
  if (!replyText || typeof replyText !== 'string') return replyText;
  const approvedIds = new Set((approvedResources || []).map(r => r.id));

  // Match bracketed citations e.g. [res-math-ratios-7] or [source: 123]
  return replyText.replace(/\[(?:source:\s*)?([a-zA-Z0-9_-]+)\]/g, (match, citationId) => {
    if (approvedIds.has(citationId)) {
      return match;
    }
    // Remove or neutralize unapproved or invented citation
    return '';
  });
}

/**
 * Inspects and validates model output against assessment restrictions.
 * If the task is assessed, prevents the model from blurting out direct answers.
 */
export function sanitizeAssessmentAnswerLeaks(replyText, { assessmentRestricted = false, expectedAnswer = null }) {
  if (!assessmentRestricted || !replyText) return replyText;

  let sanitized = replyText;

  // If an expected answer exists (e.g. 9 or 480), ensure it isn't given as "The answer is X"
  if (expectedAnswer !== null && expectedAnswer !== undefined) {
    const answerPattern = new RegExp(`\\b(the answer is|the result is|equals|final answer:?)\\s*${expectedAnswer}\\b`, 'gi');
    if (answerPattern.test(sanitized)) {
      sanitized = sanitized.replace(
        answerPattern,
        "let's walk through how to calculate the value step-by-step"
      );
    }
  }

  // Generic direct reveal guards for assessed tasks
  const directRevealPatterns = [
    /\bthe final answer is [0-9.]+\b/gi,
    /\bhere is the completed calculation:\s*[0-9.]+\b/gi
  ];

  for (const pattern of directRevealPatterns) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, "Think about how the ratio scales the value");
    }
  }

  return sanitized;
}
