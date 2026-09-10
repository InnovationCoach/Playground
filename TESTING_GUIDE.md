# 🧪 HearIsland SEN Integration - Testing Guide

## ✅ What's Been Built

### Core Components
- ✅ **BehaviorTracker** (`src/utils/behaviorTrackerVanilla.js`) - Monitors activity engagement
- ✅ **SmartSENChatbot** (`src/components/SEN/SmartSENChatbotVanilla.js`) - Auto-triggered help
- ✅ **SENIntegration** (`src/integrations/senIntegration.js`) - Coordinates everything
- ✅ **SENPreferenceToggle** (`src/components/SEN/SENPreferenceToggle.js`) - UI for SEN mode
- ✅ **ActivityTracker** (`src/activities.js`) - Activity-level tracking
- ✅ **Gemini Backend** (`server/gemini-index.js`) - AI hint/feedback service

### Integration Points
- ✅ SEN chatbot container added to `index.html`
- ✅ SEN preference toggle added to `index.html`
- ✅ `main.js` now initializes SEN system on user login
- ✅ All dependencies installed

---

## 🚀 Quick Test (5 Minutes)

### Terminal 1: Start Backend
```bash
npm run server:dev
```

You should see:
```
╔════════════════════════════════════════╗
║  🚀 HearIsland Gemini Backend Server   ║
╠════════════════════════════════════════╣
║  Port: 3001                            ║
║  Model: gemini-2.0-flash               ║
║  Status: ✅ Ready                      ║
╚════════════════════════════════════════╝

🤖 Gemini API Key: ✅ Configured ✓
```

### Terminal 2: Start Frontend
```bash
npm start
```

Navigate to: http://localhost:5173

---

## 📋 Test Scenarios

### Scenario 1: Basic SEN Initialization
**Goal**: Verify SEN system loads correctly

**Steps**:
1. Open browser DevTools (F12)
2. Click "Sign In" tab
3. Sign in with an existing account (or create new: test@example.com / password123)
4. Check Console - should see:
   ```
   [Auth] SEN system initialized: { userId: "xyz...", senEnabled: false }
   [SENToggle] Container rendered
   ```

**✅ Success**: No console errors, messages appear

---

### Scenario 2: Enable SEN Support
**Goal**: Test SEN toggle UI

**Steps**:
1. Look top-right of page for **🤖 SEN Learning Support** toggle
2. Click the toggle to enable
3. Check Console - should see:
   ```
   [SENToggle] SEN Support enabled ✅
   [SENIntegration] Behavior tracker initialized
   [SENIntegration] SEN chatbot initialized
   ```
4. Notification appears: "✅ SEN Support enabled!"

**✅ Success**: Toggle works, SEN system activates

---

### Scenario 3: Activity Tracking Starts
**Goal**: Verify tracking when activity starts

**Steps**:
1. With SEN enabled, click: **🚀 Launch Activity 1: Urban Heat**
2. Check Console - should see:
   ```
   [Activities] Started tracking: 🌴 Activity 1: Urban Heat
   [BehaviorTracker] Started tracking: phase1
   ```
3. Adjust sliders (Green Roofs, Street Trees, etc.)
4. Each interaction tracked (no visible changes, but happening in background)

**✅ Success**: Console shows tracking started

---

### Scenario 4: Manual Help Trigger
**Goal**: Test chatbot opening

**Steps**:
1. In Activity 1 (Urban Heat), look for **💬 Ask for Help** button (bottom-right)
2. Click it
3. Purple chatbot modal should slide up from bottom
4. Should see quick-action buttons: 💭 Hint, 📚 Explain, ✨ Example, ✋ Keep Trying

**✅ Success**: Chatbot opens without errors

---

### Scenario 5: Get AI Hint (Requires Backend)
**Goal**: Test Gemini integration

**Steps**:
1. Chatbot is open (from Scenario 4)
2. Click **💭 Hint** button
3. Chatbot should show: "Getting hint..."
4. After ~2-3 seconds, should display: AI-generated hint for Urban Heat activity

**Example Response**:
```
💭 Consider which strategy has the highest impact on temperature 
with the lowest cost. You might want to focus on tree coverage first!
```

**✅ Success**: Chatbot displays hint from Gemini API
**❌ Failed**: Check browser console for API errors, verify backend is running

---

### Scenario 6: Auto-Triggered Help (Long Test)
**Goal**: Test auto-trigger on struggle

**Steps**:
1. Start Activity 1 (Urban Heat)
2. **Don't click anything** for 5 minutes (or change threshold in code for 30 seconds)
3. After threshold time:
   - Chatbot should auto-open
   - Message: "I noticed you've been working on this task for a while..."

**⚠️ For Testing**: Modify in `src/utils/behaviorTrackerVanilla.js` line ~20:
```javascript
this.thresholds = {
  timeBeforeSuggestingHelp: 30000,   // Change to 30 seconds for testing
  // ... rest
};
```

**✅ Success**: Chatbot auto-triggers without user action

---

### Scenario 7: Multi-Turn Conversation
**Goal**: Test chat continuation

**Steps**:
1. After getting a hint, click **Ask another question** field
2. Type: "Can you explain what UTCI means?"
3. Click Send button
4. Chatbot should display: AI-generated explanation

**✅ Success**: Conversation flows naturally

---

### Scenario 8: SEN Mode Simplification
**Goal**: Test SEN-aware responses

**Steps**:
1. In `SmartSENChatbot.js`, responses for SEN users should be:
   - Shorter sentences
   - Simpler vocabulary
   - More encouraging
   - More visual examples

**Verify**: Click 📚 Explain button - SEN responses should be noticeably clearer

**✅ Success**: SEN-mode responses are simpler/clearer

---

## 🔧 Troubleshooting

### Issue: "Chatbot not appearing"
**Solution**:
- Check browser console for errors
- Verify `sen-chatbot-container` exists in HTML
- Check CSS isn't hiding it (z-index conflicts?)

### Issue: "Backend returns 429 (Rate Limited)"
**Solution**:
- Wait 60 seconds between requests (rate limit window)
- Or modify rates in `server/gemini-index.js` lines ~27-40

### Issue: "Gemini API returns error"
**Solution**:
- Verify GEMINI_API_KEY in `.env` is correct
- Test endpoint: `curl http://localhost:3001/health`
- Check backend is still running

### Issue: "Console shows 'Cannot find module'"
**Solution**:
- Run `npm install` to ensure all dependencies installed
- Check file paths in imports (case-sensitive on Linux/Mac)

---

## 📊 What Gets Tracked

When a student uses an activity with SEN enabled, we track:

| Data | Purpose |
|------|---------|
| **Click count** | How many buttons clicked |
| **Time-on-task** | How long spent on activity |
| **Hesitation gaps** | Pauses > 3 seconds between clicks |
| **Struggle patterns** | Passive (stuck), active (clicking a lot), hesitant |
| **Conversation history** | What hints/explanations were requested |

---

## 📈 Next Steps After Testing

### If all tests pass ✅
1. **Deploy backend** to production (`npm run server:dev` → PM2/Docker)
2. **Test with real students** - adjust thresholds based on feedback
3. **Add to other activities** - integrate tracking into Bunker, Coding, Bangkok
4. **Connect to Firestore** - save behavior analytics to user profile

### If tests fail ❌
1. Check console errors first
2. Verify backend is running (`curl http://localhost:3001/health`)
3. Check Gemini API key is valid
4. Review error logs in `server/gemini-index.js`

---

## 🎯 Success Criteria

You'll know it's working when:

- ✅ SEN toggle appears after login
- ✅ Chatbot button (💬) appears at bottom-right
- ✅ Clicking chatbot opens it
- ✅ Quick-action buttons work without errors
- ✅ Gemini API returns hints/explanations
- ✅ No JavaScript errors in console
- ✅ Behavior tracking log messages appear

---

## 📝 Test Report Template

After testing, fill this out:

```
Date: _______________
Tester: _______________

Scenario 1 (Init):        ✅ / ❌
Scenario 2 (Toggle):      ✅ / ❌
Scenario 3 (Tracking):    ✅ / ❌
Scenario 4 (Chatbot):     ✅ / ❌
Scenario 5 (Hint API):    ✅ / ❌
Scenario 6 (Auto):        ✅ / ❌
Scenario 7 (Chat):        ✅ / ❌
Scenario 8 (SEN):         ✅ / ❌

Issues Found:
- _______________
- _______________

Notes:
_______________
```

---

**Ready to test?** Start with Terminal setup above! 🚀
