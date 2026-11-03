# 🤖 Claude API Integration Guide

This guide shows how to integrate Claude AI into HearIsland for intelligent features like hints, adaptive feedback, and explanations.

## 📋 Overview

Claude will power these features:

1. **Hint System** - Context-aware hints for challenges
2. **Adaptive Feedback** - Personalized feedback based on user performance
3. **Challenge Explainer** - Break down complex scenarios into simple explanations
4. **Personalized Recommendations** - Suggest next challenges based on progress
5. **SEN Support** - Generate simplified explanations for students with learning differences

## 🏗️ Architecture

```
Frontend (React)
    ↓
    ├→ LearningPathSelector
    ├→ Dashboard (Climate/Coding/SEN)
    └→ Challenge Components
         ↓
    [API Request]
         ↓
Backend Server (Node.js/Express)
    ├→ Request validation
    ├→ Rate limiting
    ├→ Context preparation
         ↓
    [Claude API Call]
         ↓
Claude AI Service
    ├→ Process request
    ├→ Generate response
    └→ Stream back to backend
         ↓
    [Response formatting]
         ↓
Frontend receives response
    ↓
Display to user
```

## 🔧 Backend Setup

### 1. Install Dependencies

```bash
npm install express cors dotenv axios
npm install --save-dev nodemon
```

### 2. Create Backend Server

**File: `server/index.js`**

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============= CLAUDE API ENDPOINTS =============

/**
 * POST /api/hint
 * Generate a contextual hint for a challenge
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

    // Call Claude API
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-opus-4-1',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `You are a helpful tutor for students learning through interactive challenges.

Challenge: ${challengeTitle}
Scenario: ${scenario}
Difficulty: ${difficultyLevel}

Provide a SHORT, encouraging hint (1-2 sentences) that helps the student think about the problem without giving away the answer. Use simple language. End with a thinking question.

Format: Just the hint text, no numbering or extra formatting.`
          }
        ]
      },
      {
        headers: {
          'anthropic-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const hint = response.data.content[0].text;

    // Log for analytics
    console.log(`[HINT] User: ${userId}, Challenge: ${challengeId}`);

    res.json({ hint, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error generating hint:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate hint',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/feedback
 * Generate adaptive feedback based on challenge completion
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
    let feedbackPrompt;
    if (score >= 90) {
      feedbackPrompt = 'The student scored 90%+. Give enthusiastic praise and suggest a more advanced challenge.';
    } else if (score >= 70) {
      feedbackPrompt = `The student scored ${score}%. Give constructive feedback and one specific thing they did well.`;
    } else {
      feedbackPrompt = `The student scored ${score}%. Be encouraging, identify one area to improve, and offer to help.`;
    }

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-opus-4-1',
        max_tokens: 250,
        messages: [
          {
            role: 'user',
            content: `You are a supportive tutor providing feedback to a student who just completed a challenge.

Challenge: ${challengeTitle}
Score: ${score}%
Time spent: ${timeSpent} minutes
Number of attempts: ${attempts}
${solution ? `Student's approach: ${solution.substring(0, 200)}` : ''}

${feedbackPrompt}

Keep the feedback to 3-4 sentences. Be positive and growth-minded. Use simple language suitable for middle school students.

Format: Just the feedback text, no numbering.`
          }
        ]
      },
      {
        headers: {
          'anthropic-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const feedback = response.data.content[0].text;

    console.log(`[FEEDBACK] User: ${userId}, Challenge: ${challengeId}, Score: ${score}`);

    res.json({ feedback, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error generating feedback:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate feedback',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/explain
 * Generate a simplified explanation of a concept
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
      audienceGuidance = 'Use VERY simple language, short sentences, and concrete examples. Avoid jargon.';
    } else if (targetAudience === 'beginner') {
      audienceGuidance = 'Use simple, clear language suitable for beginners. Include a real-world analogy.';
    } else {
      audienceGuidance = 'Explain clearly for middle-school students with basic background knowledge.';
    }

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-opus-4-1',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `You are a patient teacher explaining concepts to students.

Concept: ${concept}
${context ? `Context: ${context}` : ''}

${audienceGuidance}

Provide a clear, concise explanation (3-4 sentences) followed by one simple example. Make it engaging and encouraging.

Format: 
Explanation: [your explanation]
Example: [simple real-world example]`
          }
        ]
      },
      {
        headers: {
          'anthropic-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const text = response.data.content[0].text;

    console.log(`[EXPLAIN] User: ${userId}, Concept: ${concept}`);

    res.json({ explanation: text, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error generating explanation:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate explanation',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/recommendation
 * Suggest next challenge based on user progress
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

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-opus-4-1',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `You are an educational advisor recommending learning paths.

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

Format:
Challenge: [name of challenge]
Why: [brief explanation]`
          }
        ]
      },
      {
        headers: {
          'anthropic-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const recommendation = response.data.content[0].text;

    console.log(`[RECOMMEND] User: ${userId}, Path: ${learningPath}`);

    res.json({ recommendation, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error generating recommendation:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate recommendation',
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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Claude API key loaded: ${process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No'}`);
});
```

### 3. Environment Setup

**File: `.env`**

```env
# Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### 4. Add Start Script to package.json

```json
{
  "scripts": {
    "start": "vite",
    "dev": "vite",
    "build": "vite build",
    "server": "node server/index.js",
    "server:dev": "nodemon server/index.js"
  }
}
```

## 🔌 Frontend Integration

### 1. Create API Client

**File: `src/services/claudeApi.js`**

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const claudeApi = {
  // Request a hint for a challenge
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

  // Get feedback on completed challenge
  async getFeedback(userId, challengeId, challengeTitle, score, timeSpent, attempts, solution) {
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

  // Get explanation of a concept
  async getExplanation(userId, concept, context, targetAudience = 'middle-school') {
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

  // Get next challenge recommendation
  async getRecommendation(userId, learningPath, completedChallenges, currentLevel, stats) {
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
  }
};
```

### 2. Use API in Components

**Example: Using Hints in a Challenge**

```javascript
import { useState } from 'react';
import { claudeApi } from '../../services/claudeApi.js';
import { auth } from '../../firebase.js';

export function ChallengeComponent({ challenge }) {
  const [hint, setHint] = useState(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [hintError, setHintError] = useState(null);

  const handleRequestHint = async () => {
    setLoadingHint(true);
    setHintError(null);

    try {
      const result = await claudeApi.getHint(
        auth.currentUser.uid,
        challenge.id,
        challenge.title,
        challenge.scenario,
        challenge.difficulty
      );

      setHint(result.hint);
    } catch (error) {
      setHintError(error.message);
    } finally {
      setLoadingHint(false);
    }
  };

  return (
    <div className="challenge">
      <h2>{challenge.title}</h2>
      <p>{challenge.description}</p>

      <button 
        onClick={handleRequestHint}
        disabled={loadingHint}
      >
        {loadingHint ? 'Getting hint...' : 'Get a Hint 💭'}
      </button>

      {hint && (
        <div className="hint-box">
          <p>{hint}</p>
        </div>
      )}

      {hintError && (
        <div className="error-message">
          {hintError}
        </div>
      )}
    </div>
  );
}
```

### 3. SEN Dashboard Tutor Integration

```javascript
// In SENSupportDashboard.jsx
const handleTutorRequest = async (type) => {
  setShowTutor(true);
  setTutorLoading(true);

  try {
    const result = await claudeApi.getExplanation(
      auth.currentUser.uid,
      'Climate Change Basics',
      'How does the greenhouse effect work?',
      'sen' // Special audience for SEN students
    );

    setTutorMessage(result.explanation);
  } catch (error) {
    setTutorMessage('I had trouble getting that explanation. Try again?');
  } finally {
    setTutorLoading(false);
  }
};
```

## 📊 Prompting Best Practices

### For Hints
- Keep hints SHORT (1-2 sentences)
- Use Socratic method (ask guiding questions)
- Never give away the answer
- Encourage critical thinking

### For Feedback
- Match tone to score (celebratory for high, encouraging for low)
- Always identify at least one strength
- Provide ONE specific area to improve
- Never be discouraging

### For Explanations
- Use concrete examples
- Adapt to audience level
- Use analogies for abstract concepts
- Keep sentences short

### For Recommendations
- Respect difficulty progression
- Vary topic to maintain engagement
- Consider time since last activity
- Balance challenge with success

## 🛡️ Security Considerations

1. **API Key Protection** - Never expose `ANTHROPIC_API_KEY` to frontend
2. **Rate Limiting** - Implemented in backend to prevent abuse
3. **Input Validation** - Validate all inputs before sending to Claude
4. **User Authentication** - Use Firebase UID to track requests
5. **Error Handling** - Don't expose sensitive error details to frontend

## 📈 Cost Management

Claude API pricing (as of 2024):
- **Input**: $3 per million tokens
- **Output**: $15 per million tokens
- **Average hint request**: ~150 output tokens = ~$0.0023

Estimated costs:
- 100 hints/day = $0.23/day
- 1000 feedback requests/day = $3.50/day
- At scale: ~$100-200/month for moderate usage

**Cost Optimization:**
- Cache common explanations
- Batch requests when possible
- Set reasonable output token limits
- Monitor usage per user

## 🚀 Deployment

### Local Development

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run server:dev
```

### Production Deployment

1. **Backend** - Deploy Express server to:
   - Heroku
   - Railway.app
   - Vercel Functions
   - AWS Lambda

2. **Environment variables** - Set in hosting platform:
   - `ANTHROPIC_API_KEY`
   - `FRONTEND_URL` (for CORS)

3. **Example: Railway Deployment**
   ```bash
   railway login
   railway init
   railway up --detach
   railway variable set ANTHROPIC_API_KEY=sk-ant-...
   ```

## ✅ Testing Checklist

- [ ] Hints generate within 2 seconds
- [ ] Feedback is specific and encouraging
- [ ] Explanations are at appropriate reading level
- [ ] Rate limiting prevents abuse
- [ ] Error messages are user-friendly
- [ ] SEN explanations use simple language
- [ ] API key is never logged or exposed
- [ ] Responses are cached where appropriate
- [ ] Monitor token usage and costs

## 📞 Support

For issues with Claude API:
- Check [Claude API docs](https://docs.anthropic.com/)
- Review [API reference](https://docs.anthropic.com/messages)
- Test with `curl` before debugging in app

## Next Steps

1. Set up backend server locally
2. Add API client to frontend
3. Integrate hint system in one challenge
4. Test with SEN dashboard
5. Monitor performance and iterate
