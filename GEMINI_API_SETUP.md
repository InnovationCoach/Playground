# 🤖 Gemini API Integration Guide for HearIsland

This guide shows how to integrate Google's Gemini AI into HearIsland for hints, feedback, and explanations.

## ⚠️ IMPORTANT: API Key Security

**Your API key has been exposed.** Immediately regenerate it:
1. Go to https://console.cloud.google.com/apis/credentials
2. Find your Generative AI API key
3. Delete the exposed key
4. Create a new one
5. Update your `.env` file

**Never commit API keys to git or share in messages.**

---

## 🔧 Setup (10 minutes)

### Step 1: Install Dependencies

```bash
npm install express cors dotenv axios
npm install --save-dev nodemon
```

### Step 2: Create `.env` File

```env
# Gemini API
GEMINI_API_KEY=YOUR_NEW_API_KEY_HERE

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
```

**Get your API key:**
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Generative Language API"
4. Go to Credentials → Create API Key
5. Copy the key to `.env`

### Step 3: Start the Server

Copy the code from `server/gemini-index.js` to your `server/index.js`:

```bash
# Or just rename the file
mv server/gemini-index.js server/index.js

# Start development server
npm run server:dev
```

You should see:
```
🚀 HearIsland Server running on http://localhost:3001
🤖 Using Gemini API Model: gemini-2.0-flash
📝 Gemini API Key: Configured ✓
```

### Step 4: Update Your Frontend

Use the new API client in your components:

```javascript
import geminiApi from '../../services/geminiApi.js';
```

---

## 📚 API Endpoints

### GET `/health`
Check server status

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "model": "gemini-2.0-flash",
  "timestamp": "2024-09-08T10:30:00.000Z"
}
```

### POST `/api/hint`
Get a hint for a challenge

```bash
curl -X POST http://localhost:3001/api/hint \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "challengeId": "climate-01",
    "challengeTitle": "Urban Heat Crisis",
    "scenario": "Design a solution for rising city temperatures",
    "difficultyLevel": "beginner"
  }'
```

Response:
```json
{
  "hint": "Think about how materials absorb heat differently. What if buildings reflected more sunlight?",
  "timestamp": "2024-09-08T10:30:05.000Z"
}
```

### POST `/api/feedback`
Get feedback after completing a challenge

```bash
curl -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "challengeId": "climate-01",
    "challengeTitle": "Urban Heat Crisis",
    "score": 85,
    "timeSpent": 15,
    "attempts": 2,
    "solution": "Added green roofs and water features"
  }'
```

### POST `/api/explain`
Get an explanation of a concept

```bash
curl -X POST http://localhost:3001/api/explain \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "concept": "Greenhouse Effect",
    "context": "How does it relate to climate change?",
    "targetAudience": "sen"
  }'
```

### POST `/api/recommendation`
Get next challenge recommendation

```bash
curl -X POST http://localhost:3001/api/recommendation \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "learningPath": "climate",
    "completedChallenges": 3,
    "currentLevel": "beginner"
  }'
```

### POST `/api/challenge-brief`
Generate a challenge brief

```bash
curl -X POST http://localhost:3001/api/challenge-brief \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "learningPath": "climate",
    "topic": "Renewable Energy",
    "difficulty": "intermediate"
  }'
```

---

## 💻 Frontend Usage Examples

### Example 1: Hint System in Challenge

```javascript
import React, { useState } from 'react';
import geminiApi from '../../services/geminiApi.js';
import { auth } from '../../firebase.js';

export function ChallengeView({ challenge }) {
  const [hint, setHint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGetHint = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await geminiApi.getHint(
        auth.currentUser.uid,
        challenge.id,
        challenge.title,
        challenge.scenario,
        challenge.difficulty
      );

      setHint(result.hint);
    } catch (err) {
      setError('Could not get hint. Try again?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="challenge">
      <h2>{challenge.title}</h2>
      <p>{challenge.description}</p>

      <button 
        onClick={handleGetHint}
        disabled={loading || hint}
      >
        {loading ? '⏳ Getting hint...' : '💭 Get a Hint'}
      </button>

      {hint && (
        <div className="hint-box">
          <h4>💡 Hint</h4>
          <p>{hint}</p>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### Example 2: Feedback After Challenge

```javascript
import geminiApi from '../../services/geminiApi.js';

async function handleChallengeComplete(score, timeSpent, attempts) {
  try {
    const result = await geminiApi.getFeedback(
      auth.currentUser.uid,
      challenge.id,
      challenge.title,
      score,
      timeSpent,
      attempts
    );

    showFeedbackModal(result.feedback);
  } catch (error) {
    console.error('Failed to get feedback:', error);
  }
}
```

### Example 3: SEN Tutor Integration

```javascript
// In SENSupportDashboard.jsx
import geminiApi from '../../services/geminiApi.js';

async function handleTutorRequest(type) {
  setShowTutor(true);
  setTutorLoading(true);

  try {
    const result = await geminiApi.getExplanation(
      auth.currentUser.uid,
      'Climate Change',
      'How does greenhouse effect work?',
      'sen' // Special audience for SEN students
    );

    setTutorMessage(result.explanation);
  } catch (error) {
    setTutorMessage('I had trouble with that. Try again?');
  } finally {
    setTutorLoading(false);
  }
}
```

### Example 4: Get Next Challenge Recommendation

```javascript
async function loadRecommendation() {
  try {
    const result = await geminiApi.getRecommendation(
      auth.currentUser.uid,
      userStats.learningPath,
      userStats.completedChallenges,
      userStats.currentLevel,
      userStats
    );

    setNextChallenge(result.recommendation);
  } catch (error) {
    console.error('Failed to get recommendation:', error);
  }
}
```

---

## 🤖 Gemini API Models

**Available Models:**

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| gemini-2.0-flash | ⚡⚡⚡ | ⭐⭐⭐⭐ | $ | Hints, explanations |
| gemini-1.5-pro | ⚡⚡ | ⭐⭐⭐⭐⭐ | $$ | Complex feedback |
| gemini-1.5-flash | ⚡⚡⚡ | ⭐⭐⭐ | $ | Quick responses |

**Current setup uses:** `gemini-2.0-flash` (recommended for HearIsland)

**To change model:** Edit `server/gemini-index.js` line 11:
```javascript
const MODEL = 'gemini-2.0-flash'; // Change this
```

---

## 📊 Pricing & Costs

**Gemini API Pricing (2024):**
- Input tokens: $0.075 per 1M tokens
- Output tokens: $0.30 per 1M tokens

**Estimated costs for HearIsland:**

| Feature | Tokens | Cost | Daily (100 users) |
|---------|--------|------|-------------------|
| Hint | ~50 input, 150 output | $0.0005 | $0.05 |
| Feedback | ~100 input, 250 output | $0.0085 | $0.85 |
| Explanation | ~80 input, 300 output | $0.01 | $1.00 |
| Recommendation | ~120 input, 200 output | $0.0075 | $0.75 |

**Monthly estimate:** $50-150 for 100 active users

**Cost optimization tips:**
1. Cache common explanations
2. Limit output tokens (done in code)
3. Use cheaper model for simple requests
4. Batch requests when possible
5. Monitor usage in Google Cloud Console

---

## 🛡️ Security Best Practices

### API Key Protection ✓
- Never commit `.env` to git
- Use `.gitignore`:
  ```
  .env
  .env.local
  .env.*.local
  node_modules/
  dist/
  ```

### Rate Limiting ✓
Current limits (per minute per user):
- Hints: 5 requests
- Feedback: 20 requests
- Explanations: 15 requests
- Recommendations: 10 requests

**Adjust in server/index.js:**
```javascript
if (!checkRateLimit(`${userId}-hints`, 5, 60000)) {
  return res.status(429).json({ error: 'Too many requests' });
}
```

### Backend-Only API Calls ✓
API key never exposed to frontend. All requests go through Express server.

### Error Handling ✓
Sensitive error details only shown in development mode.

---

## 🚀 Deployment

### Option 1: Railway (Easiest)

```bash
# Install Railway CLI
npm install -g railway

# Login and init
railway login
railway init

# Deploy
railway up

# Set environment variable
railway variable set GEMINI_API_KEY=sk_xxx
```

### Option 2: Vercel Functions

Create `api/hint.js`:
```javascript
import { callGemini } from '../server/gemini-handler.js';

export default async (req, res) => {
  const { userId, challengeId, challengeTitle, scenario, difficulty } = req.body;
  const hint = await callGemini(prompt);
  res.json({ hint });
};
```

### Option 3: Heroku

```bash
heroku create your-app-name
heroku config:set GEMINI_API_KEY=sk_xxx
git push heroku main
```

---

## 🔍 Testing & Debugging

### Check Server Health

```javascript
// In browser console
const health = await fetch('http://localhost:3001/health').then(r => r.json());
console.log(health);
```

### Test API Directly

```bash
# Test hint endpoint
curl -X POST http://localhost:3001/api/hint \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "challengeId": "test-1",
    "challengeTitle": "Test Challenge",
    "scenario": "This is a test",
    "difficultyLevel": "beginner"
  }'
```

### Monitor API Usage

Go to https://console.cloud.google.com/apis/dashboard to see:
- Requests per minute
- Error rates
- Cost tracking

### Common Issues

**Issue: "API key not valid"**
- Check `.env` file has correct key
- Regenerate key if expired
- Restart server after changing .env

**Issue: "429 Too Many Requests"**
- User hit rate limit
- Wait 60 seconds and retry
- Adjust limits in server code if needed

**Issue: "Invalid request"**
- Check JSON format
- Verify all required fields
- Check prompt length (max 32k tokens)

---

## 📈 Monitoring & Analytics

Track in your frontend:
```javascript
// Log API calls
console.log(`[API] ${endpoint} - User: ${userId} - Status: ${status}`);

// Send to analytics
analytics.track('gemini_api_call', {
  endpoint: 'hint',
  userId: userId,
  responseTime: Date.now() - startTime
});
```

Monitor in backend:
```javascript
console.log(`[HINT] User: ${userId}, Challenge: ${challengeId}`);
// Logs appear in terminal when running npm run server:dev
```

---

## 🎓 What Gemini Can Do for HearIsland

✅ **Immediate (Week 1)**
- Generate contextual hints
- Provide adaptive feedback
- Explain concepts simply

✅ **Quick Adds (Week 2)**
- Recommend next challenges
- Generate challenge briefs
- Customize for SEN students

✅ **Advanced (Week 3+)**
- Analyze student misconceptions
- Generate progress reports
- Create personalized learning paths
- Multi-turn tutoring conversations

---

## 📞 Support Resources

- [Gemini API Docs](https://ai.google.dev/)
- [API Reference](https://ai.google.dev/api/rest)
- [Model Comparison](https://ai.google.dev/models)
- [Pricing Calculator](https://ai.google.dev/pricing)
- [Cloud Console](https://console.cloud.google.com/)

---

## ✅ Implementation Checklist

- [ ] Create Google Cloud project
- [ ] Enable Generative Language API
- [ ] Generate API key
- [ ] Add to `.env` file
- [ ] Install dependencies (`npm install`)
- [ ] Copy `server/gemini-index.js` code
- [ ] Start backend (`npm run server:dev`)
- [ ] Copy `src/services/geminiApi.js`
- [ ] Update components to use `geminiApi`
- [ ] Test with curl/Postman
- [ ] Test in browser
- [ ] Deploy backend
- [ ] Monitor costs in Google Cloud Console

---

## 🎯 Next Steps

1. **This hour:** Set up `.env` and start backend
2. **Today:** Test with curl, verify responses
3. **Tomorrow:** Integrate hints in one challenge
4. **This week:** Full Claude → Gemini migration
5. **Next week:** Deploy to production

You're ready to build! 🚀
