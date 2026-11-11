/**
 * Labels and state rules for the Spark AI Learning Companion. Kept free of
 * React so the learner and coach views describe the same thing the same way.
 */
import { usingEmulators } from '../../firebase.js';

// The companion only appears where it has been switched on: the emulators, or
// a build made with VITE_SPARK_TUTOR_UI=on. A production build without the flag
// never shows it, whatever the server's own SPARK_AI_TUTOR_ENABLED says.
export const sparkTutorUiEnabled = usingEmulators || import.meta.env?.VITE_SPARK_TUTOR_UI === 'on';

export const MODES = [
  ['pbl_mentor', 'PBL Mentor', 'Your project, milestones and approved resources'],
  ['academic_tutor', 'Academic Tutor', 'Concepts, practice and skill building']
];

const LEVELS = {
  elicit: { learner: 'Exploring your ideas', coach: 'Elicit', rank: 1 },
  hint: { learner: 'A helpful hint', coach: 'Hint', rank: 2 },
  scaffold: { learner: 'Breaking it down into steps', coach: 'Scaffolded', rank: 3 },
  analogous_example: { learner: 'Looking at a similar example', coach: 'Analogous example', rank: 4 },
  guided_application: { learner: 'Working through the method together', coach: 'Guided', rank: 5 }
};

export const levelLabel = (level, audience = 'learner') => LEVELS[level]?.[audience] || null;
export const levelRank = (level) => LEVELS[level]?.rank || 0;

const TOPICS = {
  ratios_and_proportions: 'Ratios & Proportions',
  energy_and_power_conversion: 'Energy & Power Units',
  solving_single_variable_equations: 'Solving Equations'
};

export function topicLabel(topic) {
  if (!topic) return null;
  if (TOPICS[topic]) return TOPICS[topic];
  return String(topic).replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export const QUICK_ACTIONS = [
  ["I'm stuck", "I'm stuck and not sure what to try next."],
  ['Explain differently', 'Can you explain that a different way?'],
  ['Give me a hint', 'Can I have a hint, without the answer?'],
  ['Review my thinking', 'Can you review my thinking so far?']
];

// Server suggestions that map to a companion action rather than a message.
export function suggestionIntent(text) {
  const s = String(text || '').toLowerCase();
  if (/ask (my )?coach/.test(s)) return 'coach';
  if (/do the detour|start the detour|let'?s do (it|the detour)/.test(s)) return 'detour';
  return 'message';
}

/**
 * What the companion should show for a failed request. FEATURE_DISABLED (503)
 * and a missing route (404, the backend not deployed here) both mean "Spark is
 * resting", not an error the learner caused.
 */
export function classifySparkError(err, { hasSession = true } = {}) {
  // Before a session exists, 403 means the learner has no verified school and
  // class yet, not that they opened someone else's conversation.
  if (!hasSession && (err?.status === 403 || err?.code === 'FORBIDDEN')) {
    return { state: 'error', message: 'Spark opens once you are in a class. Ask your coach to check your class enrollment.' };
  }
  if (err?.code === 'FEATURE_DISABLED' || err?.status === 503 || err?.status === 404 || err?.code === 'NOT_FOUND') {
    return { state: 'disabled', message: 'Spark is taking a rest while coaches review the learning space.' };
  }
  if (err?.status === 403 || err?.code === 'FORBIDDEN') {
    return { state: 'error', message: 'This conversation belongs to another account, so Spark cannot open it.' };
  }
  if (err?.status === 401 || err?.code === 'UNAUTHENTICATED') {
    return { state: 'error', message: 'Please sign in again to talk with Spark.' };
  }
  return { state: 'error', message: 'Spark could not answer just now. Check your connection and try again.' };
}

// Saved turns come back oldest first; each holds the learner's words and Spark's reply.
export function messagesFromTurns(turns = []) {
  return turns.flatMap((t, i) => [
    t.userMessage && { id: `${t.turnId || i}-q`, role: 'learner', text: t.userMessage },
    t.replyText && { id: `${t.turnId || i}-a`, role: 'spark', text: t.replyText, level: t.assistanceLevel }
  ].filter(Boolean));
}

// A safeguarding disclosure: never sorted below ordinary help requests.
export const isUrgentSupport = (d) => Boolean(d && (d.priority === 'urgent' || d.category === 'safeguarding' || d.reason === 'SAFEGUARDING'));

// Support requests a coach has not acknowledged yet, urgent first, then newest.
export function openSupportItems(items = []) {
  return items
    .filter((s) => s.supportDetails && s.supportDetails.status !== 'acknowledged')
    .sort((a, b) => (isUrgentSupport(b.supportDetails) - isUrgentSupport(a.supportDetails))
      || String(b.supportDetails.requestedAt || '').localeCompare(String(a.supportDetails.requestedAt || '')));
}
