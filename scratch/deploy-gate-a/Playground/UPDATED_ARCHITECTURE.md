# 🏗️ Updated HearIsland Architecture

## 📋 Key Changes

Based on your feedback:
1. ✅ Users CAN switch learning paths later
2. ✅ Students CAN do multiple paths simultaneously
3. ✅ SEN is an **accessibility mode** (preference modifier), not a separate path
4. ✅ Smart behavior tracking + auto-triggering SEN chatbot

---

## 🏛️ New Firestore Schema

### User Document Structure

```javascript
/users/{uid}
├─ email, displayName, createdAt, updatedAt
├─ learningPaths: {
│   ├─ climate: {
│   │   ├─ started: timestamp
│   │   ├─ progress: 45
│   │   ├─ completedChallenges: [id1, id2, id3]
│   │   └─ currentChallenge: "climate-05"
│   │   
│   ├─ coding: {
│   │   ├─ started: timestamp
│   │   ├─ progress: 20
│   │   ├─ completedChallenges: [id1]
│   │   └─ currentChallenge: "coding-02"
│   │
│   └─ (can add more paths anytime)
│
├─ preferences: {
│   ├─ theme: "dark"
│   ├─ fontSize: "medium"
│   ├─ dyslexiaMode: false
│   ├─ highContrast: false
│   ├─ reduceAnimations: false
│   ├─ language: "en"
│   ├─ difficultyLevel: "beginner"
│   ├─ learningPace: "self-paced"
│   │
│   └─ senSupport: {
│       ├─ enabled: true           ← NEW: SEN is mode, not path!
│       ├─ autoHelpEnabled: true   ← Auto-trigger chatbot
│       ├─ helpTriggerTime: 300000 ← 5 min before suggesting help
│       ├─ trackBehavior: true
│       └─ simplifiedUI: true
│
├─ stats: {
│   ├─ totalPoints: 2450
│   ├─ completedChallenges: 8
│   ├─ currentStreak: 7
│   ├─ lastActive: timestamp
│   └─ pathStats: {
│       ├─ climate: { points: 1200, completed: 5 }
│       ├─ coding: { points: 450, completed: 2 }
│       └─ (more paths...)
│
└─ behaviorAnalytics: {
    ├─ lastSessionTime: timestamp
    ├─ sessionsCount: 24
    ├─ trackingEnabled: true
    ├─ recentSessions: [...]
    └─ strugglesDetected: [
        {
          taskId: "climate-05",
          timestamp: "2024-09-08T10:30:00",
          type: "passive_stuck",
          timeSpent: 480000,
          clicks: 2,
          aiHelpRequested: true
        }
      ]
```

---

## 🎨 Dashboard Evolution

### BEFORE (3 separate dashboards)
```
ClimateChallengeDashboard
  └─ Only shows climate
  
CodingIoTDashboard
  └─ Only shows coding
  
SENSupportDashboard
  └─ Only shows SEN students
```

### AFTER (1 adaptive dashboard)
```
AdaptiveDashboard
├─ Shows all learning paths user is in
├─ Adapts UI based on senSupport preference
├─ Includes SmartSENChatbot (if SEN enabled)
└─ Tracks behavior across all paths
```

**New Component Structure:**

```
src/components/Dashboard/
├─ AdaptiveDashboard.jsx          ← Main (replaces router)
│   ├─ PathCard.jsx               ← Reusable path section
│   ├─ LeaderboardWidget.jsx
│   ├─ AchievementsWidget.jsx
│   └─ StatsWidget.jsx
├─ SEN/
│   ├─ SmartSENChatbot.jsx        ← NEW: Auto-trigger chatbot
│   └─ BehaviorTracker.jsx        ← NEW: Track user behavior
└─ Dashboard.css (unified styles)
```

---

## 🤖 Smart SEN Chatbot Flow

### Auto-Trigger Logic

```
User starts challenge
  ↓
BehaviorTracker starts tracking clicks & time
  ↓
[Every 10 seconds] Check: checkForStruggles()
  ↓
Is struggling? (Conditions below)
  ↓ YES
Wait 2 seconds (give them chance to figure it out)
  ↓
Auto-open SmartSENChatbot
  ↓
Show: "I noticed you've been working on X for Y minutes.
       Would you like help?"
  ↓
User chooses:
├─ 💭 Hint
├─ 📚 Explain
├─ ✨ Example
└─ ✋ No thanks
```

### Struggle Detection Criteria

```javascript
// Auto-trigger if:

// 1. Passive stuck (no progress)
if (timeOnTask > 5 minutes && clicksOnTask < 3) {
  triggerHelp("passive_stuck");
}

// 2. Active struggling (lots of clicking)
if (clicks > 8 && hasHesitation) {
  triggerHelp("active_struggling");
}

// 3. Hesitation detected (3+ second gaps)
if (avgClickDelay > 3000) {
  triggerHelp("hesitant");
}
```

---

## 📊 Behavior Tracking Data Collected

For each task/challenge:

```javascript
{
  taskId: "climate-05",
  taskTitle: "Urban Heat Crisis",
  duration: 480000,           // milliseconds
  clicks: 8,                   // total clicks
  clickSequence: [             // what they clicked
    "hint-button",
    "input-field",
    "slider",
    "submit-button",
    ...
  ],
  hesitation: true,            // detected pauses
  aiHelpRequested: true,       // used chatbot
  status: "completed",         // or "abandoned", "helped"
  timestamp: "2024-09-08T10:30:00"
}
```

**NOT Collected** (privacy-first):
- ✓ Mouse position/movements
- ✓ Eye gaze
- ✓ Personal identifying info
- ✓ Private thoughts

**IS Collected** (learning insights):
- Interaction patterns
- Time on task
- Progress indicators
- Help-seeking behavior

---

## 🔄 Multi-Path Support

### User Flow

```
Onboarding
  ├─ Sign up
  ├─ Set preferences (including senSupport mode)
  └─ Choose FIRST path (Climate | Coding | SEN-friendly)

Dashboard View
  ├─ Shows all started paths
  ├─ Users can click "+ New Path" anytime
  └─ Progress tracked separately per path

Learning
  ├─ Switch between paths anytime
  ├─ Recommendations consider all paths
  ├─ Leaderboards per path
  └─ Overall stats combine all paths

SEN Chatbot
  ├─ Active on ALL paths if senSupport enabled
  ├─ Tracks behavior across all paths
  ├─ Offers path-specific help
  └─ Remembers context within session
```

---

## 💻 Implementation Guide

### Step 1: Update User Schema

**Firestore Migration Script** (add to migration.js):

```javascript
export async function updateUserSchemaForMultiPath(uid) {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  const data = userDoc.data();

  // Convert old single-path to multi-path
  const updates = {
    learningPaths: {
      [data.learningPath]: {
        started: new Date(),
        progress: data.stats?.completedChallenges || 0,
        completedChallenges: [],
        currentChallenge: null
      }
    },
    'preferences.senSupport': {
      enabled: data.preferences?.dyslexiaMode || false,
      autoHelpEnabled: data.preferences?.dyslexiaMode || false,
      helpTriggerTime: 300000,
      trackBehavior: true,
      simplifiedUI: data.preferences?.dyslexiaMode || false
    },
    behaviorAnalytics: {
      lastSessionTime: null,
      sessionsCount: 0,
      trackingEnabled: data.preferences?.dyslexiaMode || false,
      recentSessions: [],
      strugglesDetected: []
    }
  };

  await updateDoc(userRef, updates);
}
```

### Step 2: Create Adaptive Dashboard

```javascript
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import BehaviorTracker from '../../utils/behaviorTracker.js';
import { SmartSENChatbot } from '../SEN/SmartSENChatbot.jsx';
import PathCard from './PathCard.jsx';
import './AdaptiveDashboard.css';

export function AdaptiveDashboard() {
  const [user, setUser] = useState(null);
  const [behaviorTracker, setBehaviorTracker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      setUser(userDoc.data());

      // Initialize behavior tracker if SEN enabled
      if (userDoc.data()?.preferences?.senSupport?.enabled) {
        const tracker = new BehaviorTracker(auth.currentUser.uid);
        setBehaviorTracker(tracker);
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className={`adaptive-dashboard ${user.preferences.senSupport?.enabled ? 'sen-mode' : ''}`}>
      <header className="dashboard-header">
        <h1>Welcome back, {user.displayName}! 👋</h1>
        <div className="quick-stats">
          <span>{user.stats.totalPoints} Points</span>
          <span>{user.stats.currentStreak}🔥 Streak</span>
        </div>
      </header>

      <section className="learning-paths">
        <h2>Your Learning Paths</h2>
        <div className="paths-grid">
          {Object.entries(user.learningPaths || {}).map(([pathId, pathData]) => (
            <PathCard
              key={pathId}
              pathId={pathId}
              pathData={pathData}
              onTaskStart={(taskId) => {
                if (behaviorTracker) {
                  behaviorTracker.startTask(taskId, pathData.currentChallenge);
                }
              }}
            />
          ))}
          <button className="add-path-btn">+ Add New Path</button>
        </div>
      </section>

      {/* Smart SEN Chatbot - shows if SEN mode enabled */}
      {user.preferences.senSupport?.enabled && (
        <SmartSENChatbot
          isEnabled={true}
          behaviorTracker={behaviorTracker}
          learningPath={Object.keys(user.learningPaths)[0]}
        />
      )}
    </div>
  );
}
```

### Step 3: Add Behavior Tracking to Challenges

```javascript
// In challenge component
import { useEffect } from 'react';
import BehaviorTracker from '../../utils/behaviorTracker.js';

export function ChallengeView({ challenge, behaviorTracker }) {
  useEffect(() => {
    if (behaviorTracker) {
      behaviorTracker.startTask(challenge.id, challenge.title);
    }

    return () => {
      if (behaviorTracker) {
        const data = behaviorTracker.endTask('completed');
        console.log('Task analytics:', data);
      }
    };
  }, [challenge, behaviorTracker]);

  const handleElementClick = (elementLabel) => {
    if (behaviorTracker) {
      behaviorTracker.trackClick(`elem-${Date.now()}`, 'button', elementLabel);
    }
  };

  return (
    <div className="challenge">
      {/* ... challenge content ... */}
      <button onClick={() => handleElementClick('hint-button')}>
        Get Hint
      </button>
    </div>
  );
}
```

---

## 🔐 Updated Firestore Rules

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // User with multi-path support
    match /users/{userId} {
      allow read, update: if isOwner(userId);
      
      match /notes/{noteId} {
        allow read, write: if isOwner(userId);
      }
      
      match /progress/{pathId}/{challengeId} {
        allow read, write: if isOwner(userId);
      }
    }

    // Path-specific leaderboards (unchanged)
    match /leaderboards/{pathId}/{document=**} {
      allow read: if true;
      allow create, update, delete: if request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid))
             .data.learningPaths[pathId] != null;
    }
  }
}
```

---

## 📈 Benefits of This Architecture

✅ **Flexibility**: Users switch paths anytime
✅ **Personalization**: SEN is a preference, not a silo
✅ **Behavior-Driven**: AI learns when to help
✅ **Privacy-First**: Only learning-relevant data tracked
✅ **Scalable**: Add new paths without code changes
✅ **Accessible**: SEN features available to all if needed

---

## 🔄 Migration Path

If you have existing users on the old 3-dashboard system:

```
Old System          →  New System
─────────────────────────────────
User with path:     →  User with multiple paths
"climate"               learningPaths: {
                          climate: { ... }
                        }

SEN user            →  User with senSupport enabled
                        preferences: {
                          senSupport: { enabled: true }
                        }

                    →  Behavior tracking active
                        SmartSENChatbot available
```

**Migration Steps:**
1. Update Firestore schema
2. Run migration script on all users
3. Deploy adaptive dashboard
4. Keep old dashboards as fallback (1 week)
5. Retire old dashboards

---

## 🚀 Next Steps

1. **Today**: Review this architecture with team
2. **Tomorrow**: Start building AdaptiveDashboard
3. **This Week**: Integrate BehaviorTracker
4. **Next Week**: Test SmartSENChatbot with real users

---

**This new architecture supports all your requirements while keeping the codebase clean and scalable!** 🎯
