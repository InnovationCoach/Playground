# 🎓 Learning Path Integration Guide

This guide shows you how to integrate the new learning path sign-up flow into HearIsland.

## 📋 What's New

Three new components have been created in `/src/components/Auth/`:

1. **LearningPathSelector.jsx** - Step 3: User selects their learning path (Climate, Coding, or SEN)
2. **PersonalizationPreferences.jsx** - Step 4: User customizes accessibility and learning preferences
3. **Updated Firestore Schema** - New fields added to user documents

## 🔄 Integration Steps

### Step 1: Update Your Main Auth Component

Modify your existing auth flow (likely in a component that handles sign-up) to include the new steps.

**Before (current flow):**
```
Step 1: Email & Password
  ↓
Step 2: Display Name
  ↓
Dashboard
```

**After (new flow):**
```
Step 1: Email & Password
  ↓
Step 2: Display Name
  ↓
NEW → Step 3: Learning Path Selection
  ↓
NEW → Step 4: Personalization Preferences
  ↓
Dashboard
```

### Step 2: Update Firestore Security Rules

Replace your current `firestore.rules` with the new path-aware security rules:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // User profiles with learning path tracking
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId) && !has('learningPath'); // Allow on first creation
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);

      match /notes/{noteId} {
        allow read, create, update, delete: if isOwner(userId);
      }

      match /progress/{docId} {
        allow read, create, update, delete: if isOwner(userId);
      }

      match /dashboard/{docId} {
        allow read: if isOwner(userId);
        allow create, update: if isOwner(userId);
      }
    }

    // Path-specific leaderboards
    match /leaderboards/{pathId}/{document=**} {
      allow read: if true;
      allow create: if isAuthenticated() &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.learningPath == pathId &&
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Teachers (add if you have teacher roles)
    match /teachers/{userId} {
      allow read, write: if isOwner(userId);

      match /classes/{classId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

### Step 3: Add New Fields to User Documents

When creating a new user, include:

```javascript
// In your signUpUser function (auth.js)
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

export async function signUpUser(email, password, displayName = "") {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document with NEW fields
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName || email.split("@")[0],
      // NEW FIELDS:
      learningPath: null, // Will be set in LearningPathSelector
      profile: {
        bio: "",
        interests: [],
        joinedAt: serverTimestamp(),
        pathSelectedAt: null // Set when user selects path
      },
      preferences: {
        theme: "dark",
        fontSize: "medium",
        dyslexiaMode: false,
        highContrast: false,
        reduceAnimations: false,
        language: "en",
        difficultyLevel: "beginner",
        learningPace: "self-paced"
      },
      stats: {
        totalPoints: 0,
        completedChallenges: 0,
        currentStreak: 0,
        lastActive: null
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true, user };
  } catch (error) {
    console.error("Error signing up:", error);
    return { success: false, error: error.message };
  }
}
```

### Step 4: Create Auth Flow Component

Here's a complete example of how to orchestrate the auth flow with all steps:

**src/components/Auth/AuthFlow.jsx:**

```javascript
import React, { useState } from 'react';
import { signUpUser, signInUser } from '../../auth.js';
import { LearningPathSelector } from './LearningPathSelector.jsx';
import { PersonalizationPreferences } from './PersonalizationPreferences.jsx';
import './AuthFlow.css';

export function AuthFlow() {
  const [step, setStep] = useState('signin'); // 'signin', 'signup', 'path', 'preferences'
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPath, setSelectedPath] = useState(null);
  const [error, setError] = useState('');

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp && !displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    const result = await signUpUser(email, password, displayName);
    if (result.success) {
      // Move to path selection
      setStep('path');
      setError('');
    } else {
      setError(result.error);
    }
  };

  const handlePathSelected = (path) => {
    setSelectedPath(path);
    setStep('preferences');
  };

  const handlePreferencesComplete = () => {
    // User is fully onboarded, load dashboard
    window.location.href = '/dashboard'; // or use your router
  };

  // Render different screens based on step
  if (step === 'path') {
    return (
      <LearningPathSelector onComplete={handlePathSelected} />
    );
  }

  if (step === 'preferences') {
    return (
      <PersonalizationPreferences 
        learningPath={selectedPath} 
        onComplete={handlePreferencesComplete} 
      />
    );
  }

  // Regular auth screen (signin/signup)
  return (
    <div className="auth-flow">
      <div className="auth-card">
        <h1>HearIsland</h1>
        
        {error && <div className="alert alert-error">{error}</div>}

        <div className="tab-group">
          <button 
            className={`tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(false); setError(''); }}
          >
            Sign In
          </button>
          <button 
            className={`tab ${isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(true); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSignUpSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## 📊 Data Structure

### User Document Schema

```javascript
{
  uid: "abc123...",
  email: "user@example.com",
  displayName: "Alex Chen",
  
  // Learning Path
  learningPath: "climate" | "coding" | "sen" | null,
  
  // Profile
  profile: {
    bio: "I love climate science",
    interests: ["environment", "coding"],
    joinedAt: Timestamp,
    pathSelectedAt: Timestamp
  },
  
  // User Preferences
  preferences: {
    theme: "dark" | "light",
    fontSize: "small" | "medium" | "large",
    dyslexiaMode: boolean,
    highContrast: boolean,
    reduceAnimations: boolean,
    language: "en" | "es" | "fr" | "de",
    difficultyLevel: "beginner" | "intermediate" | "expert",
    learningPace: "self-paced" | "structured" | "social"
  },
  
  // Learning Stats
  stats: {
    totalPoints: number,
    completedChallenges: number,
    currentStreak: number,
    lastActive: Timestamp
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🎨 Applying User Preferences

To apply user preferences to your UI, update your main app component:

```javascript
// App.jsx or main layout component
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase.js';

export function App() {
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (userData?.preferences) {
          // Apply preferences to document root
          const root = document.documentElement;
          root.setAttribute('data-path', userData.learningPath || 'none');
          root.setAttribute('data-font-size', userData.preferences.fontSize);
          root.setAttribute('data-dyslexia', userData.preferences.dyslexiaMode);
          root.setAttribute('data-high-contrast', userData.preferences.highContrast);
          root.setAttribute('data-reduce-animations', userData.preferences.reduceAnimations);
          
          // Apply CSS variables
          if (userData.preferences.dyslexiaMode) {
            root.style.fontFamily = "'OpenDyslexic', system-ui, sans-serif";
          }
        }
      }
    });
    
    return unsubscribe;
  }, []);

  return (
    // Your app structure
  );
}
```

## 📦 CSS Variables for Paths

Add these to your main CSS file:

```css
:root {
  /* Climate Path */
  --climate-primary: #10b981;
  --climate-secondary: #34d399;
  
  /* Coding Path */
  --coding-primary: #f59e0b;
  --coding-secondary: #fbbf24;
  
  /* SEN Path */
  --sen-primary: #a855f7;
  --sen-secondary: #c084fc;
}

body[data-path="climate"] {
  --primary: var(--climate-primary);
}

body[data-path="coding"] {
  --primary: var(--coding-primary);
}

body[data-path="sen"] {
  --primary: var(--sen-primary);
}
```

## ✅ Testing Checklist

- [ ] New users see Learning Path selector after sign-up
- [ ] New users see Personalization Preferences after selecting path
- [ ] Preferences are saved to Firestore correctly
- [ ] Preferences are applied to the UI (fonts, colors, animations)
- [ ] Existing users can update their path in settings
- [ ] Each path shows appropriate content/leaderboard
- [ ] SEN path has dyslexia font and simplified UI
- [ ] Climate path shows climate challenges
- [ ] Coding path shows code projects
- [ ] Security rules prevent users from seeing other paths' data

## 🚀 Next Steps

1. **Dashboard Components**: Create path-specific dashboards for each learning path
2. **Claude AI Integration**: Add hint system and adaptive feedback
3. **Teacher Tools**: Build class management and assignment distribution
4. **Offline Support**: Add service worker for offline capability
5. **Mobile Optimization**: Test and refine mobile experience

## 📞 Support

For questions or issues during integration:
- Check the component documentation in their JSX files
- Review the example usage in this guide
- Test with the browser console open for any errors
