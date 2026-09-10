# 🎯 SEN Integration Guide (Vanilla JS)

Your HearIsland app is vanilla JavaScript + Vite, so I've created vanilla JS versions of the behavior tracker and SEN chatbot.

---

## 📦 What's New

**3 Files Created:**
1. `src/utils/behaviorTrackerVanilla.js` - Tracks user clicks, hesitation, time-on-task
2. `src/components/SEN/SmartSENChatbotVanilla.js` - Purple chatbot that auto-triggers on struggle
3. `src/integrations/senIntegration.js` - Coordinator that ties everything together

---

## ⚡ Quick Start (5 minutes)

### Step 1: Add to HTML Header

In `index.html`, add this before your existing scripts:

```html
<div id="sen-chatbot-container"></div>
```

### Step 2: Initialize in main.js

At the top of `src/main.js`, add:

```javascript
import { initializeSENGlobally } from './integrations/senIntegration.js';

// Initialize after user logs in (in subscribeToAuth callback)
subscribeToAuth((user) => {
  if (user) {
    authCard.classList.add("hidden");
    dashboardCard.classList.remove("hidden");
    userEmailSpan.textContent = user.email;

    // ✨ ADD THIS:
    const senEnabled = localStorage.getItem('senEnabled') === 'true'; // Read user preference
    initializeSENGlobally({
      userId: user.uid,
      senEnabled: senEnabled,
      geminiEndpoint: 'http://localhost:3001/api'
    });

    loadNotes();
  } else {
    authCard.classList.remove("hidden");
    dashboardCard.classList.add("hidden");
    userEmailSpan.textContent = "";
  }
});
```

### Step 3: Track Activities

When a user starts a challenge/quiz, call:

```javascript
// When starting Activity 1 (Urban Heat)
function switchPhase(phase) {
  if (window.senIntegration) {
    window.senIntegration.startActivity(phase, `Activity: ${phase}`);
  }
  
  // ... rest of your switchPhase logic
}
```

### Step 4: Track Button Clicks (Optional)

For more detailed tracking, add to button click handlers:

```javascript
// Example: In your Urban Heat simulator
document.getElementById('slider-roofs').addEventListener('input', (e) => {
  if (window.senIntegration) {
    window.senIntegration.trackClick('slider-roofs', 'Green Roofs Adjustment');
  }
  
  updateP1Simulation(); // Your existing function
});
```

### Step 5: Deploy Gemini Backend

In another terminal, start the backend server:

```bash
npm run server:dev
```

You should see:
```
🚀 HearIsland Server running on http://localhost:3001
🤖 Using Gemini API Model: gemini-2.0-flash
```

---

## 🎬 Testing

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Sign up with SEN enabled:**
   - During signup, check the "SEN Support" checkbox (you'll need to add this to PersonalizationPreferences)
   - The preference is stored as `senEnabled` in localStorage

3. **Start a challenge:**
   - Click "Launch Activity 1: Urban Heat"
   - The tracker auto-starts

4. **Trigger help (for testing):**
   - Click the **💬 Ask for Help** button (bottom-right corner)
   - Or wait ~5 minutes without clicking (then chatbot auto-triggers)

5. **Get AI Response:**
   - Click "💭 Hint" or "📚 Explain"
   - Response comes from Gemini API

---

## 🔧 Configuration

### Adjust Behavior Thresholds

In `src/utils/behaviorTrackerVanilla.js`, modify these values:

```javascript
this.thresholds = {
  timeBeforeSuggestingHelp: 300000,    // 5 minutes (change to 180000 for 3 min)
  clicksBeforeSuggestingHelp: 8,       // 8 clicks (change to 5 for earlier help)
  hesitationDelay: 3000,               // 3 second gaps
  abandonmentTime: 600000              // 10 minutes
};
```

### Disable Chatbot Auto-Trigger (for testing)

```javascript
initializeSENGlobally({
  userId: user.uid,
  senEnabled: true,
  autoTrigger: false  // Add this
});
```

---

## 📊 User Preference Storage

Currently, SEN is enabled/disabled via localStorage. To make it a preference in PersonalizationPreferences:

1. **Add checkbox to PersonalizationPreferences component:**
   ```html
   <label>
     <input type="checkbox" id="senSupport" />
     SEN Learning Support (Auto-help on struggling)
   </label>
   ```

2. **Save preference to localStorage/Firestore:**
   ```javascript
   localStorage.setItem('senEnabled', document.getElementById('senSupport').checked);
   ```

3. **Load on signup:**
   ```javascript
   const senEnabled = localStorage.getItem('senEnabled') === 'true';
   initializeSENGlobally({
     userId: user.uid,
     senEnabled: senEnabled
   });
   ```

---

## 🌐 API Endpoints (Gemini Backend)

Your `server/gemini-index.js` provides these endpoints:

| Endpoint | Purpose | Body |
|----------|---------|------|
| `POST /api/hint` | Get contextual hint | `{taskId, userId, senMode}` |
| `POST /api/explain` | Explain concept | `{taskId, userId, senMode}` |
| `POST /api/example` | Show example | `{taskId, userId, senMode}` |
| `POST /api/chat` | Multi-turn chat | `{message, history, senMode}` |

---

## ❓ FAQ

**Q: Will this work with the existing vanilla JS app?**
A: Yes! It's pure vanilla JS, no React needed.

**Q: How do I disable SEN tracking?**
A: Set `senEnabled: false` when initializing.

**Q: How do I test without waiting 5 minutes?**
A: Modify the threshold in behaviorTrackerVanilla.js:
```javascript
this.thresholds.timeBeforeSuggestingHelp = 30000; // 30 seconds for testing
```

**Q: What if the Gemini API key is missing?**
A: Add it to `.env`:
```
GEMINI_API_KEY=your_key_here
```

---

## 🚀 Next Steps

1. ✅ Create vanilla JS modules (DONE)
2. ⬜ Add SEN checkbox to PersonalizationPreferences
3. ⬜ Integrate into main.js (see Step 2 above)
4. ⬜ Test with real activity data
5. ⬜ Adjust thresholds based on testing
6. ⬜ Deploy Gemini backend to production

**Ready to integrate?** Start with Step 1 in "Quick Start" above! 🎉
