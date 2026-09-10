import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.0-flash';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Rate limiting (simple implementation)
const rateLimits = new Map();

function checkRateLimit(userId, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userKey = `${userId}-${Math.floor(now / windowMs)}`;

  if (!rateLimits.has(userKey)) {
    rateLimits.set(userKey, 0);
  }

  const count = rateLimits.get(userKey) + 1;
  rateLimits.set(userKey, count);

  return count <= maxRequests;
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'HearIsland API Server',
    status: 'online',
    frontendUrl: 'http://localhost:5173',
    healthCheck: 'http://localhost:3001/health',
    endpoints: [
      '/api/hint',
      '/api/feedback',
      '/api/explain',
      '/api/recommendation',
      '/api/challenge-brief'
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    model: MODEL_NAME,
    timestamp: new Date().toISOString()
  });
});

// ============= GEMINI API ENDPOINTS =============

/**
 * Helper function to call Gemini API using official GoogleGenerativeAI SDK
 */
async function callGemini(prompt, maxOutputTokens = 256) {
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens,
        temperature: 0.7,
        topP: 0.9
      }
    });
    const responseText = result.response.text();
    if (!responseText) {
      throw new Error('Empty response from Gemini');
    }
    return responseText;
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    throw error;
  }
}


/**
 * POST /api/hint
 * Generate a contextual hint for a challenge using Gemini
 */
app.post('/api/hint', async (req, res) => {
  try {
    const { userId, challengeId, challengeTitle, scenario, difficultyLevel } = req.body;

    // Validate input
    if (!userId || !challengeId || !challengeTitle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check rate limit (max 5 hints per minute per user)
    if (!checkRateLimit(`${userId}-hints`, 5, 60000)) {
      return res.status(429).json({ error: 'Too many hint requests. Please wait a moment.' });
    }

    // Build prompt for Gemini
    const prompt = `You are a helpful tutor for students learning through interactive challenges.

Challenge: ${challengeTitle}
Scenario: ${scenario}
Difficulty: ${difficultyLevel}

Provide a SHORT, encouraging hint (1-2 sentences) that helps the student think about the problem without giving away the answer. Use simple language. End with a thinking question.

Format: Just the hint text, no numbering or extra formatting.`;

    const hint = await callGemini(prompt, 150);

    // Log for analytics
    console.log(`[HINT] User: ${userId}, Challenge: ${challengeId}`);

    res.json({ hint, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error generating hint:', error.message);
    res.status(500).json({
      error: 'Failed to generate hint',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/feedback
 * Generate adaptive feedback based on challenge completion using Gemini
 */
app.post('/api/feedback', async (req, res) => {
  try {
    const { userId, challengeId, challengeTitle, score, timeSpent, attempts, solution } = req.body;

    if (!userId || !challengeId || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check rate limit
    if (!checkRateLimit(`${userId}-feedback`, 20, 60000)) {
      return res.status(429).json({ error: 'Too many requests. Please wait.' });
    }

    // Determine feedback type based on score
    let feedbackContext;
    if (score >= 90) {
      feedbackContext = 'The student scored 90%+. Give enthusiastic praise and suggest a more advanced challenge.';
    } else if (score >= 70) {
      feedbackContext = `The student scored ${score}%. Give constructive feedback and one specific thing they did well.`;
    } else {
      feedbackContext = `The student scored ${score}%. Be encouraging, identify one area to improve, and offer to help.`;
    }

    const prompt = `You are a supportive tutor providing feedback to a student who just completed a challenge.

Challenge: ${challengeTitle}
Score: ${score}%
Time spent: ${timeSpent} minutes
Number of attempts: ${attempts}
${solution ? `Student's approach: ${solution.substring(0, 200)}` : ''}

${feedbackContext}

Keep the feedback to 3-4 sentences. Be positive and growth-minded. Use simple language suitable for middle school students.

Format: Just the feedback text, no numbering.`;

    const feedback = await callGemini(prompt, 250);

    console.log(`[FEEDBACK] User: ${userId}, Challenge: ${challengeId}, Score: ${score}`);

    res.json({ feedback, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error generating feedback:', error.message);
    res.status(500).json({
      error: 'Failed to generate feedback',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/explain
 * Generate a simplified explanation of a concept using Gemini
 */
app.post('/api/explain', async (req, res) => {
  try {
    const { userId, concept, context, targetAudience = 'middle-school' } = req.body;

    if (!userId || !concept) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check rate limit
    if (!checkRateLimit(`${userId}-explain`, 15, 60000)) {
      return res.status(429).json({ error: 'Too many requests. Please wait.' });
    }

    let audienceGuidance = '';
    if (targetAudience === 'sen') {
      audienceGuidance = 'Use VERY simple language, short sentences (max 10 words), and concrete examples. Avoid jargon. Use emoji for clarity.';
    } else if (targetAudience === 'beginner') {
      audienceGuidance = 'Use simple, clear language suitable for beginners. Include a real-world analogy.';
    } else {
      audienceGuidance = 'Explain clearly for middle-school students with basic background knowledge.';
    }

    const prompt = `You are a patient teacher explaining concepts to students.

Concept: ${concept}
${context ? `Context: ${context}` : ''}

${audienceGuidance}

Provide a clear, concise explanation (3-4 sentences) followed by one simple example. Make it engaging and encouraging.

Format:
Explanation: [your explanation]
Example: [simple real-world example]`;

    const explanation = await callGemini(prompt, 300);

    console.log(`[EXPLAIN] User: ${userId}, Concept: ${concept}`);

    res.json({ explanation, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error generating explanation:', error.message);
    res.status(500).json({
      error: 'Failed to generate explanation',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/recommendation
 * Suggest next challenge based on user progress using Gemini
 */
app.post('/api/recommendation', async (req, res) => {
  try {
    const { userId, learningPath, completedChallenges, currentLevel, stats } = req.body;

    if (!userId || !learningPath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check rate limit
    if (!checkRateLimit(`${userId}-recommend`, 10, 60000)) {
      return res.status(429).json({ error: 'Too many requests. Please wait.' });
    }

    const prompt = `You are an educational advisor recommending learning paths.

User Profile:
- Learning Path: ${learningPath}
- Completed: ${completedChallenges || 0} challenges
- Current Level: ${currentLevel || 'beginner'}
- Completion Rate: ${stats?.completionRate || 'unknown'}%

Based on the user's progress, suggest the next challenge they should try. Consider:
1. Difficulty progression (don't jump too far)
2. Engagement (mix of topics to prevent boredom)
3. Skill building (sequential learning)

Provide a recommendation for the NEXT challenge they should tackle, with a brief explanation (2-3 sentences) of why it's a good choice.

For ${learningPath} path:
- If beginner: suggest foundational skills
- If intermediate: introduce new concepts
- If advanced: offer specialized challenges

Format:
Challenge: [name of challenge]
Why: [brief explanation]`;

    const recommendation = await callGemini(prompt, 200);

    console.log(`[RECOMMEND] User: ${userId}, Path: ${learningPath}`);

    res.json({ recommendation, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error generating recommendation:', error.message);
    res.status(500).json({
      error: 'Failed to generate recommendation',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/challenge-brief
 * Generate a personalized challenge brief using Gemini
 */
app.post('/api/challenge-brief', async (req, res) => {
  try {
    const { userId, learningPath, difficulty, topic } = req.body;

    if (!userId || !learningPath || !topic) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!checkRateLimit(`${userId}-brief`, 10, 60000)) {
      return res.status(429).json({ error: 'Too many requests. Please wait.' });
    }

    const prompt = `You are a creative educator designing learning challenges.

Create a brief, engaging challenge for a student.

Learning Path: ${learningPath}
Topic: ${topic}
Difficulty: ${difficulty || 'intermediate'}

Write a 2-3 sentence challenge brief that:
1. Explains the problem clearly
2. Makes it relevant and interesting
3. Motivates the student to solve it

For ${learningPath} path:
- Climate: Focus on real-world environmental scenarios
- Coding: Focus on building practical projects
- SEN: Keep language simple and encouraging

Format: Just the challenge brief, no extra text.`;

    const brief = await callGemini(prompt, 200);

    console.log(`[BRIEF] User: ${userId}, Path: ${learningPath}, Topic: ${topic}`);

    res.json({ brief, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error generating challenge brief:', error.message);
    res.status(500).json({
      error: 'Failed to generate challenge brief',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HearIsland Server running on http://localhost:${PORT}`);
  console.log(`🤖 Using Gemini API Model: ${MODEL_NAME}`);
  console.log(`📝 Gemini API Key: ${GEMINI_API_KEY ? 'Configured ✓' : 'Missing ✗'}`);
});
