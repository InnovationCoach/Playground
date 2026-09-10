# Solar Car Challenge - Complete Setup Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Firebase Configuration](#firebase-configuration)
3. [Gemini API Setup](#gemini-api-setup)
4. [Component Installation](#component-installation)
5. [Database Schema](#database-schema)
6. [Deployment](#deployment)

---

## Quick Start

### Prerequisites
- Node.js 16+
- Firebase Project
- Google Cloud Project with Gemini API enabled
- React 18+
- Tailwind CSS

### Installation
```bash
npm install firebase
npm install @google/generative-ai
npm install react-firebase-hooks
npm install firebase-admin
```

---

## Firebase Configuration

### 1. Create `.env.local`
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

### 2. Initialize Firebase (`config/firebase.ts`)
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 3. Create Firestore Collections
Run in Firebase Console or use Admin SDK:

```javascript
// Initialize Firestore with these collections:
db.collection('solarCar_prototypes').doc(userId).set({
  teamId: 'team_123',
  teamName: 'Team Name',
  userId: 'user_456',
  currentVersion: 1,
  components: {
    chassis: 'aluminum_frame',
    motor: 'brushed_dc',
    battery: 'li_18650_2x',
    controller: 'arduino_nano',
    solarPanel: 'solar_30w',
    additionalComponents: []
  },
  weight: {
    chassis: 1800,
    battery: 600,
    motor: 450,
    controller: 7,
    solarPanel: 480,
    additional: 0,
    total: 3337
  },
  specs: {},
  images: [],
  score: null,
  createdAt: Date.now(),
  lastUpdated: Date.now()
});
```

### 4. Firestore Security Rules
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own prototype
    match /solarCar_prototypes/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Allow public read of leaderboard
    match /solarCar_leaderboard/{document=**} {
      allow read: if true;
    }
    
    // Teacher access (requires 'teacher' custom claim)
    match /solarCar_analytics/{document=**} {
      allow read: if request.auth.token.teacher == true;
    }
  }
}
```

### 5. Firebase Storage Rules
```storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /solarCar/{userId}/{allPaths=**} {
      allow write: if request.auth.uid == userId && 
                      request.resource.size < 10 * 1024 * 1024;
      allow read: if request.auth != null;
    }
  }
}
```

---

## Gemini API Setup

### 1. Enable Gemini API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Search for "Generative Language API"
3. Click "Enable"
4. Create API key in Credentials section
5. Add to `.env.local` as `REACT_APP_GEMINI_API_KEY`

### 2. API Call Structure
```typescript
// The service automatically handles:
// - Image to base64 conversion
// - JSON parsing and validation
// - Fallback analysis if API fails
// - Rate limiting (implement in production)
```

### 3. Prompt Engineering
The Gemini prompt is optimized for solar car analysis:
- **Aerodynamic Rating**: poor/fair/good/excellent
- **Drag Coefficient**: 0.05-0.35 range
- **Solar Coverage**: 0-100% estimate
- **Weight Balance**: unbalanced/slight/balanced
- **Suggestions**: 3-5 actionable improvements

### 4. Rate Limiting (Production)
```typescript
// Add to geminiService.ts
const RATE_LIMIT = {
  requestsPerMinute: 60,
  requestsPerDay: 1000
};

async function checkRateLimit(userId: string) {
  // Track API calls in Firestore
  const docRef = doc(db, 'api_usage', userId);
  const docSnap = await getDoc(docRef);
  // Implement exponential backoff
}
```

---

## Component Installation

### 1. Copy Files to Your Project
```
/components
  /SolarCar
    - SolarCarActivity.tsx (main)
    - BuildPrototype.tsx
    - TestIterate.tsx
    - CompeteLeaderboard.tsx
    - MobileResponsive.tsx

/services
  - geminiService.ts

/utils
  - scoringEngine.ts

/components
  - TeacherDashboard.tsx
```

### 2. Register in Router
```typescript
import SolarCarActivity from './components/SolarCar/SolarCarActivity';
import TeacherDashboard from './components/TeacherDashboard';

<Routes>
  <Route path="/activity/solar-car" element={<SolarCarActivity />} />
  <Route path="/teacher/solar-car-dashboard" element={<TeacherDashboard />} />
</Routes>
```

### 3. Add to Activity Menu
```typescript
{
  id: 'solar-car',
  emoji: '☀️',
  title: 'Solar Car Challenge',
  description: 'Engineer a solar-powered prototype with AI feedback',
  path: '/activity/solar-car',
  difficulty: 'Advanced',
  estimatedTime: '60-120 minutes'
}
```

---

## Database Schema

### Collections Structure

#### `solarCar_prototypes/{userId}`
```json
{
  "teamId": "team_xyz",
  "teamName": "Solar Strikers",
  "userId": "user_123",
  "currentVersion": 3,
  "components": {
    "chassis": "carbon_tube",
    "motor": "bldc",
    "battery": "li_poly_3s",
    "controller": "esp32",
    "solarPanel": "solar_30w",
    "additionalComponents": ["gps_module", "current_sensor"]
  },
  "weight": {
    "chassis": 900,
    "battery": 420,
    "motor": 350,
    "controller": 8,
    "solarPanel": 480,
    "additional": 24,
    "total": 2182
  },
  "specs": {
    "dragCoefficient": 0.16,
    "solarCoverage": 72,
    "weightBalance": "balanced",
    "aerodynamicRating": "good"
  },
  "images": [
    {
      "iteration": 1,
      "url": "gs://bucket/image1.jpg",
      "timestamp": 1234567890,
      "aiAnalysis": {
        "aerodynamics": "fair",
        "dragCoefficient": 0.20,
        "solarCoverage": 65,
        "weightBalance": "slight",
        "suggestions": [...]
      }
    }
  ],
  "score": {
    "efficiency": 210,
    "aerodynamics": 120,
    "innovation": 75,
    "speed": 40,
    "total": 445
  },
  "createdAt": 1700000000,
  "lastUpdated": 1700003600
}
```

#### `solarCar_leaderboard/{teamId}`
```json
{
  "teamId": "team_xyz",
  "teamName": "Solar Strikers",
  "userId": "user_123",
  "schoolName": "Lincoln High",
  "totalScore": 445,
  "rank": 1,
  "efficiency": 210,
  "aerodynamics": 120,
  "innovation": 75,
  "speed": 40,
  "weight": 2182,
  "dragCoefficient": 0.16,
  "iterations": 3,
  "completedAt": 1700003600
}
```

#### `solarCar_analytics/{classId}`
```json
{
  "classId": "class_456",
  "className": "Physics 101",
  "teacher": "user_789",
  "totalTeams": 12,
  "averageScore": 385,
  "averageIterations": 2.3,
  "averageWeight": 4.2,
  "completionRate": 0.75,
  "topTeams": [...],
  "lastUpdated": 1700003600
}
```

---

## Deployment

### 1. Pre-Deployment Checklist
- [ ] Gemini API key stored in environment variables
- [ ] Firebase rules reviewed and deployed
- [ ] Image upload storage limits set (10MB max)
- [ ] Rate limiting implemented
- [ ] User authentication configured
- [ ] Mobile responsiveness tested

### 2. Deploy to Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### 3. Deploy Cloud Functions (Optional - for background jobs)
```typescript
// functions/index.js
import { onDocumentWritten } from "firebase-functions/firestore";
import { calculateScore } from "./scoring";

export const updateLeaderboard = onDocumentWritten(
  "solarCar_prototypes/{userId}",
  async (event) => {
    const data = event.data.after.data();
    if (data.score && data.score.total > 0) {
      // Update leaderboard rankings
      await db.collection("solarCar_leaderboard")
        .doc(data.teamId)
        .set(data);
    }
  }
);
```

### 4. Monitor Performance
- Set up Firebase Analytics
- Track API usage (Gemini)
- Monitor storage usage
- Set up error logging (Sentry)

```typescript
// services/analytics.ts
import { logEvent } from 'firebase/analytics';

export function trackAnalysis(teamId: string, dragCoefficient: number) {
  logEvent(analytics, 'prototype_analyzed', {
    teamId,
    dragCoefficient,
    timestamp: Date.now()
  });
}
```

---

## Testing

### Component Tests
```bash
npm test -- SolarCarActivity.test.tsx
npm test -- geminiService.test.ts
npm test -- scoringEngine.test.ts
```

### Test with Sample Data
```typescript
// Use provided mock data from components
const MOCK_TEAM = {
  teamId: 'test_team',
  teamName: 'Test Team',
  // ... (see SolarCarActivity.tsx for full structure)
};

const MOCK_AI_ANALYSIS = {
  aerodynamics: 'good',
  dragCoefficient: 0.16,
  solarCoverage: 72,
  weightBalance: 'balanced',
  suggestions: [...]
};
```

---

## Troubleshooting

### Gemini API Errors
- **401 Unauthorized**: Check API key in .env
- **429 Rate Limited**: Implement exponential backoff
- **500 Server Error**: Fallback analysis will return conservative estimates

### Firebase Errors
- **Permission Denied**: Check Firestore rules
- **Storage Quota**: Monitor bucket usage, consider cleanup policy
- **Authentication Failed**: Verify auth is initialized before queries

### Performance Issues
- Cache Gemini responses per image URL
- Batch leaderboard updates
- Use Firestore indexes for frequent queries
- Implement pagination for image histories

---

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Gemini API Guide](https://ai.google.dev/docs)
- [React Firebase Hooks](https://github.com/CSFrequist/react-firebase-hooks)
- Solar Car Challenge GitHub Issues: Contact your development team

---

## Next Steps

1. **Week 1-2**: Set up Firebase, configure Gemini API
2. **Week 3**: Integrate components into your app
3. **Week 4**: Test with pilot group of students
4. **Week 5**: Deploy to production, iterate based on feedback
