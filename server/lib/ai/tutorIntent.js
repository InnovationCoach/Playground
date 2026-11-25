/**
 * Intent-First Conversational Orchestration for Spark Student Dashboard AI.
 *
 * Pipeline:
 * 1. Safeguarding check (early return)
 * 2. Intent classification on the raw student message + recent history
 * 3. Selective context retrieval following the Context Priority Hierarchy:
 *    Current message & intent > Immediate history > Student profile >
 *    Relevant academic/PBL context > Program/session info > Platform guide
 * 4. Privacy-safe structured audit logging
 */

import { createHash } from 'node:crypto';

export const TUTOR_INTENTS = {
  DASHBOARD_NAVIGATION: 'dashboard_navigation',
  GOAL_SETTING: 'goal_setting',
  PBL_PROJECT: 'pbl_project',
  PROGRAM_CONTINUATION: 'program_continuation',
  ACADEMIC_PROGRESS: 'academic_progress',
  COACH_FEEDBACK: 'coach_feedback',
  FOLLOW_UP: 'follow_up',
  AMBIGUOUS: 'ambiguous',
  TECHNICAL_SUPPORT: 'technical_support',
  GENERAL_KNOWLEDGE: 'general_knowledge',
  ACTIVITY_HELP: 'activity_help',
  GENERAL_CONVERSATION: 'general_conversation'
};

export const DASHBOARD_NAVIGATION_GUIDE = [
  'Spark Student Dashboard Navigation:',
  '- Goal Setting (#/goals): Open the Goal Setting section from the dashboard or navigation menu to create, edit, and track academic or project-based goals.',
  '- Profile Picture / Avatar (#/settings): Click your profile avatar in the top-right header bar or open Settings (#/settings) to update your profile picture and display name.',
  '- My Quests / Daily Checklist (Dashboard - My Quests tab): View today\'s checklist, active quests, and recommended next steps.',
  '- Find a Quest (Dashboard - Find a Quest tab or #/courses/discover): Discover and start new learning quests and courses.',
  '- My Progress (Dashboard - My Progress tab): Track completed steps, badges, and learning progress.',
  '- My Space (#/space or Dashboard - My Space tab): Creative workspace and personal tools.',
  '- My Universe (#/dashboard/universe): Interactive universe explorer and missions.',
  '- PBL Studio (#/pbl): Manage your term PBL project, research questions, prototypes, and evidence.',
  '- Portfolio (#/portfolio): View and share your learning portfolio.',
  '- Future Skills (#/future-skills): Explore AI in education and the 7 future skills.',
  '- Messages (#/messages) & Community (#/community): Message your coach or view community posts.'
].join('\n');

const SAFEGUARDING_PATTERNS = [
  /\b(kill myself|suicide|end my life|self[- ]?harm|hurt myself|want to die)\b/i,
  /\b(abuse|abusing me|hitting me|unsafe at home|molest)\b/i
];

export const SAFEGUARDING_REPLY =
  'That sounds really important. Please talk to your teacher or another adult you trust right now.';

export function isSafeguardingMessage(message) {
  const text = String(message || '').trim();
  if (!text) return false;
  return SAFEGUARDING_PATTERNS.some((re) => re.test(text));
}

/**
 * Classify the student's intent BEFORE applying any program or session context.
 */
export function classifyTutorIntent(message, history = [], { activity = 'student-dashboard', action = 'custom_question' } = {}) {
  const raw = String(message || '').trim();
  const lower = raw.toLowerCase();

  // Explicit quick-action buttons inside an activity or dashboard
  if (action && action !== 'custom_question') {
    if (activity && activity !== 'student-dashboard') {
      return { intent: TUTOR_INTENTS.ACTIVITY_HELP, confidence: 'high', reason: `action:${action}` };
    }
    return { intent: TUTOR_INTENTS.PBL_PROJECT, confidence: 'medium', reason: `dashboard_action:${action}` };
  }

  // Specific interactive STEM labs (solar-car, bunker, urban-heat, coding, bangkok)
  if (activity && activity !== 'student-dashboard' && activity !== 'learning-hub') {
    // Even inside an activity, allow navigation or general knowledge if explicitly asked
    if (/\b(where|how)\b.*\b(set my goals|goal setting|profile picture|avatar|settings|dashboard)\b/i.test(lower)) {
      return { intent: TUTOR_INTENTS.DASHBOARD_NAVIGATION, confidence: 'high', reason: 'explicit_navigation' };
    }
    return { intent: TUTOR_INTENTS.ACTIVITY_HELP, confidence: 'high', reason: `activity:${activity}` };
  }

  // 1. Ambiguous / very short generic help requests
  if (
    /^(help|help me|can you help( me)?|i need help|what should i do|idk|not sure)[?.!\s]*$/i.test(lower) ||
    lower.length <= 2
  ) {
    return { intent: TUTOR_INTENTS.AMBIGUOUS, confidence: 'high', reason: 'short_generic_help' };
  }

  // 2. Dashboard navigation (where to find / how to open / how to change UI settings)
  const navLocationPattern = /\b(where|how do i|how can i|how to|find|open|go to|navigate|locate)\b/i;
  const navTargetPattern = /\b(goal setting|set(ting)? (my )?goals?|my goals?|profile picture|avatar|photo|pfp|settings|portfolio|my space|my universe|find a quest|my quests|my progress|pbl studio|future skills|messages|community|dashboard|courses?)\b/i;
  if (navLocationPattern.test(lower) && navTargetPattern.test(lower)) {
    // Distinguish "where can I set my goals?" (navigation) from "help me create a goal about math" (goal_setting)
    if (/\b(where|find|open|go to|navigate|locate|profile picture|avatar|pfp|settings|change my)\b/i.test(lower)) {
      return { intent: TUTOR_INTENTS.DASHBOARD_NAVIGATION, confidence: 'high', reason: 'navigation_query' };
    }
  }
  if (/\b(profile picture|avatar|change my photo|change my name|settings page)\b/i.test(lower)) {
    return { intent: TUTOR_INTENTS.DASHBOARD_NAVIGATION, confidence: 'high', reason: 'profile_navigation' };
  }

  // 3. Follow-up questions referencing immediate conversation history
  const hasHistory = Array.isArray(history) && history.length > 0;
  const followUpPattern = /^(can you |could you )?(explain|say|tell me|show me|break) (that|it|this) (again|differently|more|simply)|^(how do i do that|what does that mean|why\??|and then what|what next\??|tell me more|elaborate|give me an example of that)[?.!\s]*$/i;
  if (hasHistory && (followUpPattern.test(lower) || (raw.split(/\s+/).length <= 6 && /\b(that|it|those|them|this)\b/i.test(lower) && !/\b(project|goal|day \d+)\b/i.test(lower)))) {
    return { intent: TUTOR_INTENTS.FOLLOW_UP, confidence: 'high', reason: 'anaphoric_followup' };
  }

  // 4. Explicit Program / Session Continuation
  if (/\b(continue|resume|pick up where|back to)\b.*\b(project|program|session|day \d+|quest|lesson)\b/i.test(lower) || /\bday\s*[1-9]\d*\b/i.test(lower)) {
    if (/\bday\s*[1-9]\d*\b/i.test(lower) || /\b(program|session|quest)\b/i.test(lower)) {
      return { intent: TUTOR_INTENTS.PROGRAM_CONTINUATION, confidence: 'high', reason: 'explicit_program_continuation' };
    }
    return { intent: TUTOR_INTENTS.PBL_PROJECT, confidence: 'high', reason: 'explicit_project_continuation' };
  }

  // 5. Goal Setting (working on goals, creating goals, reviewing goals)
  if (/\b(goal|goals|goal setting)\b/i.test(lower)) {
    if (/\b(where|find|open|tab|page|section)\b/i.test(lower)) {
      return { intent: TUTOR_INTENTS.DASHBOARD_NAVIGATION, confidence: 'high', reason: 'goals_navigation' };
    }
    return { intent: TUTOR_INTENTS.GOAL_SETTING, confidence: 'high', reason: 'goals_topic' };
  }

  // 6. Coach Feedback & Mentor Notes
  if (/\b(coach'?s? feedback|coach feedback|feedback from my coach|what did my coach|coach say|coach note|mentor feedback|my feedback|teacher feedback|review comments?)\b/i.test(lower)) {
    return { intent: TUTOR_INTENTS.COACH_FEEDBACK, confidence: 'high', reason: 'coach_feedback_topic' };
  }

  // 7. PBL Project questions
  if (/\b(my project|current project|pbl|term project|hmw|how might we|prototype|evidence|my quest)\b/i.test(lower)) {
    return { intent: TUTOR_INTENTS.PBL_PROJECT, confidence: 'high', reason: 'pbl_topic' };
  }

  // 8. Academic Progress & Subjects
  if (/\b(subjects?|studying|courses?|grades?|scores?|edmentum|assignments?|classes|progress|checklist|today'?s tasks?|focus skill|strengths?|badges?|how am i doing|what am i learning)\b/i.test(lower)) {
    return { intent: TUTOR_INTENTS.ACADEMIC_PROGRESS, confidence: 'high', reason: 'academic_progress_topic' };
  }

  // 9. Technical Support
  if (/\b(bug|error|broken|not working|can'?t log ?in|cannot log ?in|won'?t load|crash|upload failed|mic|camera)\b/i.test(lower)) {
    return { intent: TUTOR_INTENTS.TECHNICAL_SUPPORT, confidence: 'high', reason: 'tech_support' };
  }

  // 9. General Knowledge (explicit factual/conceptual questions)
  if (/^(what|who|when|where|why|how|explain|define|compare|difference between|tell me about)\b/i.test(lower)) {
    return { intent: TUTOR_INTENTS.GENERAL_KNOWLEDGE, confidence: 'medium', reason: 'general_question_form' };
  }

  // 10. Greetings / General Conversation
  return { intent: TUTOR_INTENTS.GENERAL_CONVERSATION, confidence: 'medium', reason: 'open_conversation' };
}

function formatCoachFeedbackLines(feedbackList = []) {
  if (!Array.isArray(feedbackList) || feedbackList.length === 0) return [];
  return feedbackList.slice(0, 4).map((f) => {
    const who = f.coachName || 'Coach';
    const when = f.date ? ` (${f.date})` : '';
    const work = f.workId ? ` on ${f.workId}` : '';
    if (f.feedbackText) {
      return `- ${who}${when}${work}: "${String(f.feedbackText).slice(0, 240)}"`;
    }
    if (Number.isFinite(f.rating)) {
      return `- ${who}${when}${work}: Rated ${f.rating}/5`;
    }
    return null;
  }).filter(Boolean);
}

/**
 * Format only the context slices relevant to the classified intent.
 * Never dumps unrelated Day-based scripts or full program histories.
 */
export function selectTutorContext({ intent, dashboardContext = null, activityContext = '', history = [] } = {}) {
  const progress = dashboardContext?.progress || (dashboardContext?.activity ? dashboardContext : null);
  const categories = [];
  const sections = [];

  if (progress?.studentName) {
    categories.push('student_profile');
    sections.push(`Student First Name: ${String(progress.studentName).slice(0, 40)}`);
  }
  if (Array.isArray(progress?.interests) && progress.interests.length > 0) {
    sections.push(`Student Interests: ${progress.interests.slice(0, 5).join(', ')}`);
  }
  if (Array.isArray(progress?.supports) && progress.supports.length > 0) {
    sections.push(`Preferred Learning Supports: ${progress.supports.slice(0, 4).join(', ')}`);
  }
  if (progress?.engagement?.mood) {
    sections.push(`Today's Check-in Mood: ${progress.engagement.mood}`);
  }

  switch (intent) {
    case TUTOR_INTENTS.DASHBOARD_NAVIGATION: {
      categories.push('navigation_guide');
      sections.push(DASHBOARD_NAVIGATION_GUIDE);
      if (dashboardContext?.tab) {
        sections.push(`Student is currently viewing: ${String(dashboardContext.tab).slice(0, 40)}`);
      }
      break;
    }

    case TUTOR_INTENTS.GOAL_SETTING: {
      categories.push('goals', 'navigation_guide');
      sections.push('Goal Setting Location: Open Goal Setting (#/goals) from the dashboard or navigation menu.');
      const goals = Array.isArray(progress?.goals) ? progress.goals : [];
      if (goals.length > 0) {
        const lines = goals.slice(0, 4).map((g) => {
          const status = g.done ? 'Done' : `${g.stepsDone || 0}/${g.stepsTotal || 0} steps`;
          const show = g.showHow ? ` [Show via: ${g.showHow}]` : '';
          return `- "${g.explore}" [${status}]${show}${g.nextStep ? ` (Next: ${g.nextStep})` : ''}`;
        });
        sections.push(`Student's Current Goals:\n${lines.join('\n')}`);
      } else {
        sections.push('Student has no goals set yet.');
      }
      if (progress?.focusSkill?.skill) {
        sections.push(`Focus Skill: ${progress.focusSkill.skill}${progress.focusSkill.habit ? ` (Habit: ${progress.focusSkill.habit})` : ''}`);
      }
      if (Array.isArray(progress?.strengths) && progress.strengths.length > 0) {
        sections.push(`Strengths: ${progress.strengths.join(', ')}`);
      }
      break;
    }

    case TUTOR_INTENTS.COACH_FEEDBACK: {
      categories.push('coach_feedback');
      const fbLines = formatCoachFeedbackLines(progress?.coachFeedback);
      if (fbLines.length > 0) {
        sections.push(`Recent Coach Feedback:\n${fbLines.join('\n')}`);
      } else {
        sections.push('Recent Coach Feedback: No coach feedback has been recorded yet.');
      }
      const courses = Array.isArray(progress?.pblCourses) ? progress.pblCourses : [];
      if (courses.length > 0) {
        sections.push(`Active PBL Project: ${courses[0].title}${courses[0].nextStep ? ` (Next: ${courses[0].nextStep})` : ''}`);
      }
      break;
    }

    case TUTOR_INTENTS.PBL_PROJECT:
    case TUTOR_INTENTS.PROGRAM_CONTINUATION: {
      categories.push('pbl_projects');
      const courses = Array.isArray(progress?.pblCourses) ? progress.pblCourses : [];
      if (courses.length > 0) {
        const lines = courses.slice(0, 3).map((c) => {
          const pct = Number.isFinite(c.progressPct) ? `${c.progressPct}%` : 'in progress';
          const parts = [
            c.currentStage ? `Stage: ${c.currentStage}` : '',
            c.nextStep ? `Next: ${c.nextStep}` : '',
            c.nextTask ? `Task: ${c.nextTask}` : '',
            c.evidenceToCollect ? `Evidence: ${c.evidenceToCollect}` : ''
          ].filter(Boolean).join(' | ');
          return `- ${c.title} (${pct})${parts ? ` — ${parts}` : ''}`;
        });
        sections.push(`Active PBL Projects:\n${lines.join('\n')}`);
      } else {
        sections.push('Active PBL Projects: None started yet (student can browse Find a Quest or #/pbl/programs).');
      }
      if (progress?.termProject) {
        const tp = progress.termProject;
        sections.push(
          `Term PBL Project: Phase ${tp.currentPhase || 'spark'}` +
          (tp.hmw ? ` | HMW: "${tp.hmw}"` : '') +
          ` | Evidence items: ${tp.evidenceCount || 0}` +
          (tp.checksTotal ? ` | Readiness checks: ${tp.checksPassed || 0}/${tp.checksTotal}` : '')
        );
      }
      const fbLines = formatCoachFeedbackLines(progress?.coachFeedback);
      if (fbLines.length > 0) {
        categories.push('coach_feedback');
        sections.push(`Recent Coach Feedback:\n${fbLines.slice(0, 2).join('\n')}`);
      }
      if (progress?.nextRecommendedStep?.title) {
        sections.push(`Recommended Next Step: ${progress.nextRecommendedStep.title}`);
      }
      break;
    }

    case TUTOR_INTENTS.ACADEMIC_PROGRESS: {
      categories.push('academic_progress', 'goals');
      const ac = progress?.academic;
      if (ac) {
        const acLines = [];
        if (ac.edmentumStatus === 'connected') {
          const summaryBits = [
            Number.isFinite(ac.overallProgressPercent) ? `Overall progress: ${ac.overallProgressPercent}%` : '',
            Number.isFinite(ac.averageCurrentGrade) ? `Average grade: ${ac.averageCurrentGrade}%` : '',
            Number.isFinite(ac.enrolledClassCount) ? `Enrolled classes: ${ac.enrolledClassCount}` : '',
            Number.isFinite(ac.totalTimeOnTaskMinutes) ? `Time on task: ${ac.totalTimeOnTaskMinutes} mins` : ''
          ].filter(Boolean);
          if (summaryBits.length > 0) acLines.push(`Edmentum Academic Summary: ${summaryBits.join(' | ')}`);
          if (Array.isArray(ac.enrolledClasses) && ac.enrolledClasses.length > 0) {
            acLines.push('Enrolled Academic Classes:\n' + ac.enrolledClasses.map((c) =>
              `- ${c.name}${Number.isFinite(c.progressPercent) ? ` (${c.progressPercent}%` : ''}${Number.isFinite(c.currentGrade) ? `, grade ${c.currentGrade}%` : ''}${Number.isFinite(c.progressPercent) ? ')' : ''}`
            ).join('\n'));
          }
          if (Array.isArray(ac.recentScores) && ac.recentScores.length > 0) {
            acLines.push('Recent Scores: ' + ac.recentScores.map((s) => `${s.title}: ${s.score}${s.maxScore ? `/${s.maxScore}` : ''}`).join('; '));
          }
        } else {
          acLines.push(`Academic Courseware (Edmentum): ${ac.edmentumStatus || 'not_connected'}.`);
        }
        if (Array.isArray(ac.steamActivitiesStarted) && ac.steamActivitiesStarted.length > 0) {
          acLines.push(`STEAM Labs Started: ${ac.steamActivitiesStarted.join(', ')}`);
        }
        if (acLines.length > 0) sections.push(acLines.join('\n'));
      }
      const courses = Array.isArray(progress?.pblCourses) ? progress.pblCourses : [];
      if (courses.length > 0) {
        sections.push(
          'Active PBL Projects:\n' +
          courses.slice(0, 3).map((c) => `- ${c.title}${Number.isFinite(c.progressPct) ? ` (${c.progressPct}%)` : ''}`).join('\n')
        );
      }
      const goals = Array.isArray(progress?.goals) ? progress.goals : [];
      if (goals.length > 0) {
        sections.push(
          'Current Goals:\n' +
          goals.slice(0, 3).map((g) => `- ${g.explore} (${g.done ? 'Done' : `${g.stepsDone || 0}/${g.stepsTotal || 0} steps`})`).join('\n')
        );
      }
      if (progress?.todayChecklist?.total > 0) {
        const tc = progress.todayChecklist;
        sections.push(`Today's Checklist: ${tc.completed}/${tc.total} completed.`);
      }
      const fbLines = formatCoachFeedbackLines(progress?.coachFeedback);
      if (fbLines.length > 0) {
        categories.push('coach_feedback');
        sections.push(`Recent Coach Feedback:\n${fbLines.slice(0, 2).join('\n')}`);
      }
      if (Array.isArray(progress?.strengths) && progress.strengths.length > 0) {
        sections.push(`Strengths: ${progress.strengths.join(', ')}`);
      }
      if (progress?.focusSkill?.skill) {
        sections.push(`Focus Skill: ${progress.focusSkill.skill}`);
      }
      if (progress?.engagement?.badgesEarned > 0) {
        sections.push(`Badges Earned (${progress.engagement.badgesEarned}): ${progress.engagement.badgeNames.join(', ')}`);
      }
      break;
    }

    case TUTOR_INTENTS.FOLLOW_UP: {
      categories.push('conversation_history');
      if (history.length > 0) {
        sections.push('Resolve the student\'s follow-up using the immediate conversation history.');
      }
      break;
    }

    case TUTOR_INTENTS.AMBIGUOUS: {
      categories.push('minimal_clarification');
      sections.push('The student\'s request is broad or ambiguous. Briefly ask what they would like help with (e.g., setting goals, academic progress, coach feedback, their PBL project, or a general question).');
      break;
    }

    case TUTOR_INTENTS.TECHNICAL_SUPPORT: {
      categories.push('technical_support');
      sections.push('Help troubleshoot calmly or suggest refreshing the page / asking their coach if the issue persists.');
      break;
    }

    case TUTOR_INTENTS.GENERAL_KNOWLEDGE:
    case TUTOR_INTENTS.GENERAL_CONVERSATION: {
      // Do NOT inject PBL/Day scripts so the AI answers the student's actual question directly first.
      categories.push('none_program_context_withheld');
      break;
    }

    case TUTOR_INTENTS.ACTIVITY_HELP: {
      categories.push('activity_context');
      if (activityContext) {
        sections.push(String(activityContext).slice(0, 800));
      }
      break;
    }

    default:
      break;
  }

  return {
    intent,
    contextCategories: categories,
    contextBlock: sections.join('\n\n').slice(0, 2200),
    useDashboardAssistantMode: intent !== TUTOR_INTENTS.ACTIVITY_HELP
  };
}

/**
 * Normalize and bound conversation history to recent alternating turns.
 */
export function sanitizeConversationHistory(history = [], maxTurns = 8) {
  if (!Array.isArray(history)) return [];
  const cleaned = [];
  for (const item of history.slice(-maxTurns)) {
    const text = String(item?.text ?? item?.content ?? '').trim().slice(0, 800);
    if (!text) continue;
    const rawRole = String(item?.role ?? item?.sender ?? '').toLowerCase();
    const role = rawRole === 'user' || rawRole === 'student' ? 'user' : 'model';
    cleaned.push({ role, text });
  }
  return cleaned;
}

/**
 * Privacy-safe structured audit log for debugging AI orchestration without exposing PII.
 */
export function logTutorAudit({
  requestId = '',
  uid = '',
  intent = '',
  contextCategories = [],
  historyCount = 0,
  model = '',
  status = 'ok',
  latencyMs = 0,
  errorCode = null
} = {}) {
  const uidHash = uid ? createHash('sha256').update(String(uid)).digest('hex').slice(0, 10) : 'anon';
  const entry = {
    type: 'spark_tutor_audit',
    requestId,
    uidHash,
    intent,
    contextCategories,
    historyCount,
    model,
    status,
    latencyMs,
    ...(errorCode ? { errorCode } : {})
  };
  if (process.env.NODE_ENV !== 'test') {
    console.info(JSON.stringify(entry));
  }
  return entry;
}
