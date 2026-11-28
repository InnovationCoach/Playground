/**
 * Self-Directed AI Mission Evaluator & Coach Report Generator
 *
 * Evaluates learner mission evidence & reflection immediately upon submission
 * under policy.type === 'ai-self-directed'.
 * - Sends ZERO PII (no learner name, email, or uid) to any AI model.
 * - Approves substantive STEM work immediately, generates warm learner feedback,
 *   awards Universe Credits + competencies, and creates a structured Coach Report
 *   for the Coach Dashboard.
 * - Returns gibberish/placeholder submissions with kind Socratic guidance so
 *   learners can revise immediately without waiting on a human reviewer.
 */

const MISSION_COMPETENCIES = {
  'thalassa-wind-survey:guided': ['measurement', 'scientific_reasoning', 'energy_systems'],
  'spacecraft-journey:guided': ['measurement', 'scientific_reasoning', 'engineering_design'],
  'spacecraft-journey:advanced': ['measurement', 'scientific_reasoning', 'engineering_design', 'energy_systems']
};

function extractTextFromPart(part) {
  if (!part || typeof part !== 'object') return '';
  if (part.kind === 'text') return String(part.text || '').trim();
  if (part.kind === 'choice') return `${part.selectedId || ''}: ${String(part.reason || '').trim()}`;
  if (part.kind === 'diagram') return String(part.description || '').trim();
  if (part.kind === 'table' && Array.isArray(part.rows)) {
    return part.rows.flat().map((c) => String(c || '').trim()).filter(Boolean).join(' ');
  }
  return '';
}

/**
 * Detects placeholder blanks ("__") or pure single-character/gibberish repetition
 * so empty spam isn't auto-approved while genuine student writing at any age/fluency passes.
 */
export function isSubstantiveSubmission(evidence = [], reflection = '') {
  const cleanReflection = String(reflection || '').trim();
  if (cleanReflection.length < 20 || /_{2,}/.test(cleanReflection)) {
    return { ok: false, reason: 'Finish replacing any blanks (__) in your reflection and explain what you decided.' };
  }
  // Reject repeated keyboard mashing like "aaaaaaa aaaaaaa aaaaaaa" or single unique token repeated
  const words = cleanReflection.toLowerCase().match(/[a-z0-9]+/g) || [];
  const uniqueWords = new Set(words);
  if (words.length < 3 || uniqueWords.size < 2 || /(.)\1{7,}/i.test(cleanReflection)) {
    return { ok: false, reason: 'Add a clear sentence or two in your reflection explaining your choice and what you would check next.' };
  }

  for (const part of evidence) {
    const txt = extractTextFromPart(part);
    if (!txt || /_{2,}/.test(txt) || /(.)\1{8,}/i.test(txt)) {
      return {
        ok: false,
        reason: `Complete the "${part.partId}" notebook section in your own words (remove any "__" blanks) before submitting.`
      };
    }
    if ((part.kind === 'text' || part.kind === 'choice' || part.kind === 'diagram') && (txt.match(/[a-z0-9]+/gi) || []).length < 2) {
      return {
        ok: false,
        reason: `Add a brief explanation in "${part.partId}" so Spark AI can review your reasoning.`
      };
    }
  }

  return { ok: true };
}

function summarizeEvidenceForPrompt(route, evidence = []) {
  return evidence.map((part) => {
    const rule = route?.requiredParts?.find((r) => r.partId === part.partId);
    const criterion = rule?.evidenceCriterion || '';
    if (part.kind === 'choice') {
      const label = route?.choiceLabels?.[part.partId]?.find((c) => c.id === part.selectedId)?.label || part.selectedId;
      return `- ${part.partId} (choice "${label}"): ${part.reason} [Criterion: ${criterion}]`;
    }
    if (part.kind === 'table') {
      const previewRows = (part.rows || []).slice(0, 6).map((r) => r.join(' | ')).join('; ');
      return `- ${part.partId} (table: ${part.columns?.join(', ')}): ${previewRows} [Criterion: ${criterion}]`;
    }
    if (part.kind === 'diagram') {
      const edges = (part.edges || []).map((e) => `${e.fromId}->${e.toId} (${e.label})`).join(', ');
      return `- ${part.partId} (diagram: ${edges}): ${part.description} [Criterion: ${criterion}]`;
    }
    return `- ${part.partId} (text): ${part.text} [Criterion: ${criterion}]`;
  }).join('\n');
}

function buildDeterministicReport({ mission, route, evidence, reflection, competencies, creditsAwarded }) {
  const recPart = evidence.find((p) => p.partId === 'recommendation');
  let choiceSummary = 'completed all required evidence parts';
  if (recPart?.kind === 'choice' && recPart.selectedId) {
    const label = route?.choiceLabels?.recommendation?.find((c) => c.id === recPart.selectedId)?.label || recPart.selectedId;
    choiceSummary = `recommended "${label}" with supporting evidence`;
  } else if (recPart?.kind === 'text' && recPart.text) {
    choiceSummary = `defended a recommendation in writing (${recPart.text.slice(0, 90).trim()}${recPart.text.length > 90 ? '…' : ''})`;
  }

  const hasNumbers = evidence.some((p) => /\d/.test(extractTextFromPart(p)));
  const strengths = [
    `Completed all ${evidence.length} structured notebook sections for ${mission.title} (${route.name}).`,
    hasNumbers
      ? 'Grounded your analysis in quantitative evidence and mission constraints.'
      : 'Clearly articulated mission priorities, trade-offs, and model boundaries.'
  ];

  const nextStep = mission.id === 'thalassa-wind-survey'
    ? 'Try testing an hourly storage or solar-plus-wind layout in Thalassa’s Project Hex-Grid simulation.'
    : route.id === 'guided'
      ? 'Ready for an extra challenge? Explore the Spaceship Builder Lab or try the Advanced mass-and-power route to Ignis.'
      : 'Apply your mass-and-power trade-offs by certifying a custom craft in the Playground Spaceship Builder!';

  const learnerFeedback = `Approved by Spark AI! You ${choiceSummary} and reflected thoughtfully on what to check next.${creditsAwarded > 0 ? ` +${creditsAwarded} Universe Credits added to your colony!` : ''}`;
  const coachSummary = `Self-directed AI evaluation (Approved): Learner completed ${mission.title} (${route.name}), ${choiceSummary}. Reflection: "${String(reflection).trim().slice(0, 160)}${reflection.length > 160 ? '…' : ''}"`;

  return {
    evaluatedBy: 'spark-ai',
    source: 'rubric-engine',
    decision: 'approved',
    learnerFeedback,
    strengths,
    nextStep,
    coachSummary,
    competencies,
    creditsAwarded
  };
}

export async function evaluateUniverseSubmissionWithAi({
  resolvedTask,
  validatedSubmission,
  alreadyCompletedMission = false,
  generateText = null
} = {}) {
  const { mission, route } = resolvedTask;
  const { evidence = [], reflection = '' } = validatedSubmission;
  const competencies = MISSION_COMPETENCIES[`${mission.id}:${route.id}`] || ['scientific_reasoning', 'measurement'];

  const substantive = isSubstantiveSubmission(evidence, reflection);
  if (!substantive.ok) {
    return {
      decision: 'returned',
      creditsAwarded: 0,
      competencies: [],
      coachNote: substantive.reason,
      aiReport: {
        evaluatedBy: 'spark-ai',
        source: 'rubric-engine',
        decision: 'returned',
        learnerFeedback: substantive.reason,
        strengths: ['Your draft is saved—just expand the incomplete section and send again anytime.'],
        nextStep: substantive.reason,
        coachSummary: `Returned by Spark AI for quick revision: ${substantive.reason}`,
        competencies: [],
        creditsAwarded: 0
      }
    };
  }

  const creditsAwarded = alreadyCompletedMission ? 0 : 60;
  const fallbackReport = buildDeterministicReport({
    mission,
    route,
    evidence,
    reflection,
    competencies,
    creditsAwarded
  });

  if (typeof generateText === 'function') {
    try {
      const prompt = [
        `You are Spark AI evaluating a student's self-directed STEM mission in WeLearn SPARK (no grades/scores; warm, specific, Socratic feedback).`,
        `Mission: ${mission.title} — Route: ${route.name} (${mission.drivingQuestion})`,
        `Submitted Evidence:\n${summarizeEvidenceForPrompt(route, evidence)}`,
        `Student Reflection: "${String(reflection).trim().slice(0, 600)}"`,
        `Return ONLY valid JSON with keys: {"learnerFeedback":"2 encouraging sentences naming a specific part of their reasoning","strengths":["strength 1","strength 2"],"nextStep":"1 concrete curiosity step","coachSummary":"2-sentence objective summary for the teacher dashboard"}.`
      ].join('\n\n');

      const rawText = await Promise.race([
        generateText(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI_EVAL_TIMEOUT')), 6500))
      ]);

      if (typeof rawText === 'string' && rawText.trim()) {
        const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);
        if (
          typeof parsed?.learnerFeedback === 'string' && parsed.learnerFeedback.trim().length >= 15 &&
          typeof parsed?.coachSummary === 'string' && parsed.coachSummary.trim().length >= 15
        ) {
          const aiReport = {
            evaluatedBy: 'spark-ai',
            source: 'gemini',
            decision: 'approved',
            learnerFeedback: parsed.learnerFeedback.trim().slice(0, 600),
            strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0
              ? parsed.strengths.slice(0, 3).map((s) => String(s).trim().slice(0, 220)).filter(Boolean)
              : fallbackReport.strengths,
            nextStep: typeof parsed.nextStep === 'string' && parsed.nextStep.trim()
              ? parsed.nextStep.trim().slice(0, 260)
              : fallbackReport.nextStep,
            coachSummary: parsed.coachSummary.trim().slice(0, 500),
            competencies,
            creditsAwarded
          };
          return {
            decision: 'approved',
            creditsAwarded,
            competencies,
            coachNote: aiReport.learnerFeedback,
            aiReport
          };
        }
      }
    } catch {
      // Fall back cleanly to deterministic rubric evaluation if Gemini is offline or times out
    }
  }

  return {
    decision: 'approved',
    creditsAwarded,
    competencies,
    coachNote: fallbackReport.learnerFeedback,
    aiReport: fallbackReport
  };
}
