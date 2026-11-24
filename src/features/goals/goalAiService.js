/**
 * Intelligent Goal AI Suggestion Service (Client + Local Pedagogical Fallback).
 *
 * Calls `POST /api/goals/suggest` with the learner's goal draft, category,
 * subject/project, and grade level. If the server or Gemini API is offline or
 * unconfigured, provides high-quality, context-aware milestone and step
 * suggestions so students are always in control and never blocked.
 */
import { auth } from '../../firebase.js';
import { API_BASE } from '../../services/apiBase.js';
import { LIMITS } from './goalPlan.js';

export function buildLocalGoalSuggestions({
  category = 'academic',
  goalType = '',
  explore = '',
  subject = '',
  projectTitle = '',
  gradeLevel = '',
  measurableOutcome = ''
} = {}) {
  const cleanGoal = String(explore || '').trim() || 'my goal';
  const contextLabel = subject || projectTitle || cleanGoal;

  if (category === 'academic') {
    const outcome = measurableOutcome || (
      goalType === 'graduation-target'
        ? `Achieve all ${gradeLevel || 'year-level'} academic requirements and complete my portfolio checkpoints on schedule.`
        : goalType === 'assignment-exam'
        ? `Complete all revision topics for ${contextLabel} and score 85%+ on practice assessments before the target date.`
        : `Complete all planned learning units in ${contextLabel} and demonstrate mastery on weekly check-ins.`
    );
    return {
      measurableOutcome: outcome.slice(0, LIMITS.outcome),
      steps: [
        { text: `List the key topics or units I need to master for ${cleanGoal}`.slice(0, LIMITS.text), frequency: 'once', aiSuggested: true },
        { text: `Complete 20 minutes of focused study or practice problems in ${contextLabel}`.slice(0, LIMITS.text), frequency: 'daily', aiSuggested: true },
        { text: `Write down 2 questions on any tricky concepts to review with my coach`.slice(0, LIMITS.text), frequency: 'daily', aiSuggested: true },
        { text: `Complete a weekly self-test or unit checkpoint in ${contextLabel}`.slice(0, LIMITS.text), frequency: 'weekly', aiSuggested: true }
      ],
      aiGenerated: false
    };
  }

  if (category === 'pbl') {
    const outcome = measurableOutcome || (
      goalType === 'deliverable-deadline'
        ? `Deliver a tested prototype and presentation artifact for ${contextLabel} by the target deadline.`
        : goalType === 'research-target'
        ? `Synthesize 3+ credible research sources or experimental data sets for ${contextLabel}.`
        : goalType === 'teamwork-objective'
        ? `Agree on team roles, complete my assigned sprint tasks, and share constructive peer feedback for ${contextLabel}.`
        : `Complete the project milestone for ${contextLabel} and log documented evidence in PBL Studio.`
    );
    return {
      measurableOutcome: outcome.slice(0, LIMITS.outcome),
      steps: [
        { text: `Define the exact deliverable and success criteria for ${cleanGoal}`.slice(0, LIMITS.text), frequency: 'once', aiSuggested: true },
        { text: `Work for 25 focused minutes on my ${contextLabel} build, research, or design`.slice(0, LIMITS.text), frequency: 'daily', aiSuggested: true },
        { text: `Capture 1 photo, note, or test observation as project evidence`.slice(0, LIMITS.text), frequency: 'daily', aiSuggested: true },
        { text: `Share my milestone draft with my team or coach for feedback`.slice(0, LIMITS.text), frequency: 'weekly', aiSuggested: true }
      ],
      aiGenerated: false
    };
  }

  if (category === 'skills') {
    const outcome = measurableOutcome || `Build and demonstrate a working example using ${cleanGoal}.`;
    return {
      measurableOutcome: outcome.slice(0, LIMITS.outcome),
      steps: [
        { text: `Find one tutorial or starter example for ${cleanGoal}`.slice(0, LIMITS.text), frequency: 'once', aiSuggested: true },
        { text: `Practise ${cleanGoal} for 15 minutes and test what I made`.slice(0, LIMITS.text), frequency: 'daily', aiSuggested: true },
        { text: `Apply ${cleanGoal} to one of my class projects or creative builds`.slice(0, LIMITS.text), frequency: 'weekly', aiSuggested: true }
      ],
      aiGenerated: false
    };
  }

  // Personal development default
  const outcome = measurableOutcome || `Practise ${cleanGoal} consistently for 5 days each week and reflect on what works best.`;
  return {
    measurableOutcome: outcome.slice(0, LIMITS.outcome),
    steps: [
      { text: `Set up my workspace and reminder for ${cleanGoal}`.slice(0, LIMITS.text), frequency: 'once', aiSuggested: true },
      { text: `Practise one small action towards ${cleanGoal} today`.slice(0, LIMITS.text), frequency: 'daily', aiSuggested: true },
      { text: `Reflect at the end of the week on how ${cleanGoal} helped me`.slice(0, LIMITS.text), frequency: 'weekly', aiSuggested: true }
    ],
    aiGenerated: false
  };
}

/**
 * Request Gemini AI suggestions for a goal, falling back cleanly if offline/unconfigured.
 */
export async function suggestGoalMilestones(payload = {}, options = {}) {
  const fetchFn = options.fetch || (typeof fetch !== 'undefined' ? fetch : null);
  if (!payload?.explore || !String(payload.explore).trim()) {
    return buildLocalGoalSuggestions(payload);
  }

  if (fetchFn) {
    try {
      let token = options.token || null;
      if (!token && auth?.currentUser?.getIdToken) {
        token = await auth.currentUser.getIdToken().catch(() => null);
      }
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetchFn(`${API_BASE}/api/goals/suggest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res && res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.steps) && data.steps.length > 0) {
          return {
            measurableOutcome: String(data.measurableOutcome || '').trim().slice(0, LIMITS.outcome) || buildLocalGoalSuggestions(payload).measurableOutcome,
            steps: data.steps.map((s) => ({
              text: String(s.text || '').trim().slice(0, LIMITS.text),
              frequency: ['daily', 'weekly', 'once'].includes(s.frequency) ? s.frequency : 'daily',
              aiSuggested: true
            })).filter((s) => s.text.length > 0),
            aiGenerated: Boolean(data.aiGenerated)
          };
        }
      }
    } catch {
      // Fallback to local suggestions
    }
  }

  return buildLocalGoalSuggestions(payload);
}
