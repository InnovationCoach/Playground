# 🚀 START HERE: Build HearIsland v2.0

This is your day-by-day implementation guide. Follow these steps to build the new adaptive dashboard with smart behavior tracking.

---

## ✅ Files Already Created For You

**Components:**
- ✅ `AdaptiveDashboard.jsx` - Main dashboard (one for all paths)
- ✅ `PathCard.jsx` - Individual path cards
- ✅ `SmartSENChatbot.jsx` - Auto-triggered help chatbot
- ✅ `behaviorTracker.js` - Behavior monitoring system

**Scripts:**
- ✅ `scripts/migrate-to-multipath.js` - Firestore schema migration

**Docs:**
- ✅ `UPDATED_ARCHITECTURE.md` - Design reference
- ✅ `NEW_FEATURES_SUMMARY.md` - Feature overview
- ✅ `GEMINI_API_SETUP.md` - Gemini integration

---

## 📋 Day 1: Setup & Migration (2 hours)

### Step 1: Backup Your Data
```bash
# Optional: Export your Firestore data as backup
# Via Firebase Console: Firestore Database → Export Collections
```

### Step 2: Test Migration (Dry Run)
```bash
# Preview changes without applying them
node scripts/migrate-to-multipath.js --dry-run
```

**Expected output:**
```
Found X users to process
📝 Processing user-123...
  → Would add learningPaths: { "climate": {...} }
  → Would add senSupport settings
  → Would add behaviorAnalytics
  ✓ Ready to migrate
```

### Step 3: Run Actual Migration
```bash
# Apply migration to Firestore
node scripts/migrate-to-multipath.js
```

**Takes 1-5 minutes depending on user count**

Check Firestore Console to verify:
- Open any user document
- Should see new `learningPaths`, `behaviorAnalytics`, updated `preferences`

✅ **Day 1 Complete**: Your Firestore schema is now ready for multi-path!

---

## 📋 Day 2: Build Dashboard Components (3-4 hours)

### Step 1: Files are Already in Place
All component files are created:
```
src/components/Dashboard/
├─ AdaptiveDashboard.jsx ✅
├─ AdaptiveDashboard.css ✅
├─ PathCard.jsx ✅
└─ PathCard.css ✅

src/components/SEN/
├─ SmartSENChatbot.jsx ✅
└─ SmartSENChatbot.css ✅

src/utils/
└─ behaviorTracker.js ✅
```

### Step 2: Update Your App Router

In your main app component, replace the old dashboard router:

**OLD CODE (remove this):**
```javascript
import { DashboardRouter } from './components/Dashboard/DashboardRouter.jsx';

// ... inside render:
<Route path="/dashboard" element={<DashboardRouter />} />
```

**NEW CODE (add this):**
```javascript
import { AdaptiveDashboard } from './components/Dashboard/AdaptiveDashboard.jsx';

// ... inside render:
<Route path="/dashboard" element={<AdaptiveDashboard />} />
```

### Step 3: Integrate into Auth Flow

After user completes LearningPathSelector and PersonalizationPreferences:

```javascript
import { AdaptiveDashboard } from './components/Dashboard/AdaptiveDashboard.jsx';

// In your auth flow:
if (!user.learningPath) {
  return <LearningPathSelector onComplete={handlePathSelected} />;
}

if (!showedPreferences) {
  return <PersonalizationPreferences />;
}

// Now show the new adaptive dashboard
return <AdaptiveDashboard />;
```

### Step 4: Test Dashboard

1. Sign up/sign in as a test user
2. Should see AdaptiveDashboard
3. Should see "+ Add New Path" button
4. Click to add paths (Climate, Coding)
5. Both paths should display with challenges
6. If senSupport enabled, should see SmartSENChatbot button

✅ **Day 2 Complete**: Adaptive dashboard is live!

---

## 📋 Day 3: Behavior Tracking Integration (3 hours)

### Step 1: Update Challenge Component

Any challenge/game component needs behavior tracking:

```javascript
import BehaviorTracker from '../../utils/behaviorTracker.js';

export function ClimateChallenge({ challengeId, challengeTitle }) {
  const [tracker] = useState(
    () => new BehaviorTracker(auth.currentUser.uid)
  );

  // Start tracking when challenge starts
  useEffect(() => {
    tracker.startTask(challengeId, challengeTitle);

    // End tracking when component unmounts
    return () => {
      const data = tracker.endTask('completed');
      console.log('Task analytics:', data);
      // Could save to analytics service here
    };
  }, [challengeId, tracker]);

  // Track clicks on buttons/elements
  const handleButtonClick = (buttonLabel) => {
    tracker.trackClick(`btn-${Date.now()}`, 'button', buttonLabel);
    // ... rest of button handler
  };

  return (
    <div className="challenge">
      <h2>{challengeTitle}</h2>

      {/* Buttons should track clicks */}
      <button onClick={() => handleButtonClick('submit-btn')}>
        Submit
      </button>

      <button onClick={() => handleButtonClick('hint-btn')}>
        Get Hint
      </button>

      {/* Smart chatbot only if SEN enabled - added elsewhere */}
    </div>
  );
}
```

### Step 2: Test Behavior Tracking

1. Start a challenge
2. Click around (don't solve it)
3. Wait 3+ minutes without clicking
4. Open browser console: `console.log()` should show behavior data
5. If SEN mode enabled: chatbot should auto-open after 2 sec

### Step 3: Customize Behavior Thresholds

In `src/utils/behaviorTracker.js`, tune these (line ~20):

```javascript
this.thresholds = {
  timeBeforeSuggestingHelp: 300000,   // 5 min (set to 180000 for 3 min)
  clicksBeforeSuggestingHelp: 8,      // 8 clicks (set to 5 for earlier help)
  hesitationDelay: 3000,              // 3 sec gaps = hesitation
  abandonmentTime: 600000             // 10 min
};
```

**Recommendation**: Start conservative (5 min), then tighten based on testing.

✅ **Day 3 Complete**: Behavior tracking works!

---

## 📋 Day 4: Smart SEN Chatbot (2 hours)

### Step 1: Ensure Gemini Backend Running

```bash
# Terminal 1: Backend
npm run server:dev

# Should output:
# 🚀 HearIsland Server running on http://localhost:3001
# 🤖 Using Gemini API Model: gemini-2.0-flash
```

### Step 2: Test Chatbot Auto-Trigger

1. Sign up with senSupport enabled (via PersonalizationPreferences)
2. Start a challenge, don't click anything
3. Wait ~5 minutes (or adjust threshold to 1 min for testing)
4. Chatbot should auto-pop with: "I noticed you've been working on X for Y minutes..."
5. Click options (Hint, Explain, Example)
6. Should get Gemini-generated response

### Step 3: Multi-turn Conversation

After getting hint:
1. Click "Ask another question"
2. Type a question
3. Chatbot generates personalized response
4. Can continue conversation

### Step 4: Fine-tune Chatbot

In `SmartSENChatbot.jsx`:

```javascript
// Adjust auto-trigger delay (line ~50)
setTimeout(() => {
  if (!isOpen) {
    setAutoTriggered(true);
    setIsOpen(true);
    handleAutoTriggeredHelp(data);
  }
}, 2000);  // ← Change to 5000 for 5 sec delay
```

✅ **Day 4 Complete**: Smart chatbot is live!

---

## 📋 Day 5: Testing & Polish (3 hours)

### User Acceptance Testing

**Scenario 1: Multi-Path Student**
1. Sign up, choose Climate path
2. Click "+ Add Another Path", add Coding
3. Both paths visible on dashboard
4. Click Climate challenge
5. Click Coding challenge
6. Progress tracked separately ✓

**Scenario 2: SEN Student**
1. Sign up with senSupport enabled
2. See larger fonts, purple theme
3. Start challenge, get stuck
4. Chatbot auto-triggers after 5 min
5. Request hint
6. Get AI-generated help ✓

**Scenario 3: Regular Student**
1. Sign up with senSupport disabled
2. See normal UI (no chatbot button)
3. Progress tracked silently
4. No interruptions ✓

### Performance Checks

```javascript
// In browser console, check:
performance.timing.loadEventEnd - performance.timing.navigationStart
// Should be < 3000ms

// Check Firestore reads/writes
// Firebase Console → Firestore Database → Usage
// Should see reasonable query counts
```

### Mobile Testing

```bash
# In Chrome DevTools: Toggle device toolbar (Ctrl+Shift+M)
# Test on various screen sizes:
# - iPhone 12 (390px)
# - iPad (768px)
# - Tablet (1024px)
```

---

## 🎯 By End of Week 5, You'll Have

✅ **Multi-path support** - Students can take multiple paths
✅ **Adaptive dashboard** - One dashboard, not three
✅ **Behavior tracking** - Silent monitoring of struggles
✅ **Smart chatbot** - Auto-triggers with AI help
✅ **SEN support** - Accessibility mode for all paths
✅ **Gemini integration** - Powered by fast, cheap Gemini API
✅ **Production ready** - Tested, documented, deployed

---

## 🚀 What to Do RIGHT NOW

1. **Backup your data** (5 min)
2. **Run dry-run migration** (5 min)
3. **Verify output looks good** (5 min)
4. **Run actual migration** (5 min)

Then continue with Day 2...

---

## ❓ FAQ

**Q: What if migration fails?**
A: You made a backup, right? Restore it and try again. The script is idempotent - running it twice is safe.

**Q: Can I test with fake users?**
A: Yes! Create test users in Firebase Auth, then run migration. They'll get the new schema.

**Q: How do I roll back?**
A: Delete the new fields manually or restore from backup. The old single-path system can't read the new schema, so you'd need to migrate back old data.

**Q: How much will this cost?**
A: Minimal! Firestore writes during migration are cheap. Gemini API is ~$5-20/month depending on usage.

**Q: Can I enable/disable chatbot per student?**
A: Yes! Each student has `preferences.senSupport.enabled` toggle.

---

## 📞 Need Help?

- Check `UPDATED_ARCHITECTURE.md` for design details
- Check `GEMINI_API_SETUP.md` for Gemini integration
- Read component comments for implementation details
- Test in browser console: `console.log()` debugging

---

**You've got this! Let's build! 🚀**

Questions? Stuck? Reply with what's happening and I'll help debug.
