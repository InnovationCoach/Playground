/**
 * Gemini AI API Client
 *
 * Handles all communication with the Gemini-powered backend
 * for hints, feedback, explanations, and recommendations
 */

import { auth } from '../firebase.js';
import { API_BASE as API_BASE_URL } from './apiBase.js';

/**
 * Attach the caller's Firebase ID token.
 *
 * The server used to trust a `userId` field in the body, so any caller could act
 * as any child. The uid now comes from this verified token instead.
 */
async function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch (err) {
    console.warn('[GeminiAPI] Could not attach auth token:', err.message);
  }
  return headers;
}

/**
 * The age band drives reading level and vocabulary server-side. Set from the
 * profile at sign-in; falls back to the younger supported band. The server
 * re-resolves it either way and never trusts it as a privilege signal.
 */
export function getAgeBand() {
  try {
    return localStorage.getItem('ageBand') || '13-15';
  } catch {
    return '13-15';
  }
}

export const geminiApi = {
  /**
   * Request a hint for a challenge
   * @param {string} userId - Firebase user ID
   * @param {string} challengeId - Unique challenge identifier
   * @param {string} challengeTitle - Title of the challenge
   * @param {string} scenario - Challenge scenario/description
   * @param {string} difficultyLevel - beginner|intermediate|expert
   * @returns {Promise<{hint: string, timestamp: string}>}
   */
  async getHint(userId, challengeId, challengeTitle, scenario, difficultyLevel) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hint`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          userId,
          challengeId,
          challengeTitle,
          scenario,
          difficultyLevel
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get hint');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching hint:', error);
      throw error;
    }
  },

  /**
   * Get feedback on completed challenge
   * @param {string} userId - Firebase user ID
   * @param {string} challengeId - Unique challenge identifier
   * @param {string} challengeTitle - Title of the challenge
   * @param {number} score - Score achieved (0-100)
   * @param {number} timeSpent - Time spent in minutes
   * @param {number} attempts - Number of attempts
   * @param {string} solution - Optional: user's solution/approach
   * @returns {Promise<{feedback: string, timestamp: string}>}
   */
  async getFeedback(userId, challengeId, challengeTitle, score, timeSpent, attempts, solution = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          userId,
          challengeId,
          challengeTitle,
          score,
          timeSpent,
          attempts,
          solution
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get feedback');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  },

  /**
   * Get explanation of a concept
   * @param {string} userId - Firebase user ID
   * @param {string} concept - Concept to explain
   * @param {string} context - Optional: additional context
   * @param {string} targetAudience - 'middle-school'|'beginner'|'sen'
   * @returns {Promise<{explanation: string, timestamp: string}>}
   */
  async getExplanation(userId, concept, context = '', targetAudience = 'middle-school') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/explain`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          userId,
          concept,
          context,
          targetAudience
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get explanation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching explanation:', error);
      throw error;
    }
  },

  /**
   * Get next challenge recommendation
   * @param {string} userId - Firebase user ID
   * @param {string} learningPath - 'climate'|'coding'|'sen'
   * @param {number} completedChallenges - Number of completed challenges
   * @param {string} currentLevel - 'beginner'|'intermediate'|'expert'
   * @param {object} stats - Additional stats object
   * @returns {Promise<{recommendation: string, timestamp: string}>}
   */
  async getRecommendation(userId, learningPath, completedChallenges = 0, currentLevel = 'beginner', stats = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendation`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          userId,
          learningPath,
          completedChallenges,
          currentLevel,
          stats
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get recommendation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      throw error;
    }
  },

  /**
   * Generate a personalized challenge brief
   * @param {string} userId - Firebase user ID
   * @param {string} learningPath - 'climate'|'coding'|'sen'
   * @param {string} topic - Challenge topic
   * @param {string} difficulty - 'beginner'|'intermediate'|'expert'
   * @returns {Promise<{brief: string, timestamp: string}>}
   */
  async getChallengeBrief(userId, learningPath, topic, difficulty = 'intermediate') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenge-brief`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          userId,
          learningPath,
          topic,
          difficulty
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate challenge brief');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating challenge brief:', error);
      throw error;
    }
  },

  /**
   * Free-form tutor turn.
   *
   * This used to call generativelanguage.googleapis.com straight from the
   * browser with `import.meta.env.VITE_GEMINI_API_KEY`. Two problems: any
   * VITE_-prefixed variable is inlined into the public bundle at build time, so
   * turning the tutor on would have published the API key; and with the key
   * unset it silently returned one hardcoded sentence about drag coefficients,
   * so the "AI tutor" was not an AI at all.
   *
   * It now goes through the server, which holds the key and applies safety
   * settings, age banding and the safeguarding transcript.
   */
  async generateContextualResponse(promptText, activityContext = '', ageBand = null) {
    const response = await fetch(`${API_BASE_URL}/api/tutor`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        message: promptText,
        activityContext,
        ageBand: ageBand || getAgeBand()
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'The tutor is unavailable right now.');
    }

    const data = await response.json();
    return data.reply;
  },

  /**
   * PBL project co-pilot: unlike the tutor, it may write complete, commented
   * code for the learner's own project. Contract in
   * docs/BACKEND-PBL-COPILOT-PROMPT-FOR-GEMINI.md. The error carries `status`
   * so the caller can tell "endpoint not deployed yet" (404) from a failure.
   */
  async pblCopilot({ message, phase, problem, impact, language, ageBand = null }) {
    const response = await fetch(`${API_BASE_URL}/api/pbl-copilot`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ message, phase, problem, impact, language, ageBand: ageBand || getAgeBand() })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const err = new Error(body.error?.message || body.error || 'The co-pilot is unavailable right now.');
      err.status = response.status;
      throw err;
    }
    return response.json();
  },

  /**
   * Check server health
   * @returns {Promise<{status: string, model: string}>}
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error('Server not responding');
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', error: error.message };
    }
  }
};

// Export for use in components
export default geminiApi;

