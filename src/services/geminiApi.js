/**
 * Gemini AI API Client
 *
 * Handles all communication with the Gemini-powered backend
 * for hints, feedback, explanations, and recommendations
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
   * Directly call Gemini model with prompt and fallback models
   */
  async generateContextualResponse(promptText, systemInstruction = '') {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyC1pcad4Rff4-PMf7LcoZr-3kAZJF0LK9Y';
    const models = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
    let lastErr = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [{ parts: [{ text: promptText }] }]
        };

        if (systemInstruction) {
          payload.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn(`[geminiApi] ${model} returned HTTP ${res.status}:`, errData.error?.message);
        }
      } catch (err) {
        console.warn(`[geminiApi] Error invoking ${model}:`, err.message);
        lastErr = err;
      }
    }

    throw lastErr || new Error('All Gemini AI endpoints failed');
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

