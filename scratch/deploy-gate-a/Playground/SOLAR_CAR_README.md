# ☀️ Solar Car Challenge - Complete Implementation Guide

## Overview

**Solar Car Challenge** is Activity 5 for WeLearn's Climate Gamification Suite. Students design, build, and iterate on solar car prototypes using:
- Real component selection (weight calculations)
- Gemini AI image analysis (aerodynamics, drag, panel placement)
- Multi-dimensional scoring (efficiency + aerodynamics + innovation + speed)
- Live leaderboard competition

**Total Time to Implement: 4-5 weeks**

---

## 📦 What's Included

### React Components
1. **SolarCarActivity.tsx** - Main container, state management, Firebase integration
2. **BuildPrototype.tsx** - Tab 1: Component selection, weight calculator
3. **TestIterate.tsx** - Tab 2: Image upload, AI analysis results, iteration history
4. **CompeteLeaderboard.tsx** - Tab 3: Scoring breakdown, leaderboard, strategies
5. **MobileResponsive.tsx** - Mobile-optimized wrapper with responsive UI
6. **TeacherDashboard.tsx** - Teacher analytics, team monitoring, feedback

### Services & Utilities
1. **geminiService.ts** - Gemini Vision API integration with structured JSON output
2. **scoringEngine.ts** - All 4 scoring dimensions + leaderboard ranking
3. **SOLAR_CAR_SETUP.md** - Firebase config, Gemini setup, database schema

### Key Features
- ✅ Real-time weight calculations
- ✅ AI-powered image analysis (aerodynamics, drag, panel coverage, weight distribution)
- ✅ Multi-round iteration tracking
- ✅ Mobile-responsive design
- ✅ Teacher analytics dashboard
- ✅ Leaderboard with multi-dimensional scoring
- ✅ Achievement badges system

---

## 🚀 Quick Start (5 Steps)

### Step 1: Copy Files to Your Project
```bash
# Copy all React components
cp components/SolarCar/* your-project/src/components/SolarCar/
cp components/TeacherDashboard.tsx your-project/src/components/

# Copy services and utilities
cp services/geminiService.ts your-project/src/services/
cp utils/scoringEngine.ts your-project/src/utils/
```

### Step 2: Install Dependencies
```bash
npm install @google/generative-ai firebase react-firebase-hooks
```

### Step 3: Configure Environment
Create `.env.local`:
```env
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_GEMINI_API_KEY=your_gemini_key
```

### Step 4: Add to Router
```typescript
import SolarCarActivity from './components/SolarCar/SolarCarActivity';

<Route path="/activity/solar-car" element={<SolarCarActivity />} />
```

### Step 5: Deploy
```bash
npm run build
firebase deploy
```

---

## 📊 Component Architecture

```
SolarCarActivity (Main Container)
├── BuildPrototype
│   ├── Component Database (Chassis, Motor, Battery, Controller, Solar Panel)
│   ├── Weight Calculator (Real-time updates)
│   └── Component Grid Selection
├── TestIterate
│   ├── Image Upload Zone
│   ├── Gemini AI Analysis
│   │   ├── Aerodynamics Rating
│   │   ├── Drag Coefficient (Cd)
│   │   ├── Solar Coverage %
│   │   └── Weight Balance
│   ├── AI Suggestions
│   └── Iteration History
└── CompeteLeaderboard
    ├── Score Breakdown (4 categories)
    ├── Live Leaderboard Rankings
    └── Competition Tips

TeacherDashboard (Separate Route)
├── Class Statistics
├── Team Grid View
└── Detailed Team Analysis Modal
```

---

## 🎮 How Students Use It

### Phase 1: Build (15-20 min)
1. Select chassis type (aluminum/carbon/steel)
2. Choose motor (brushed DC/BLDC/geared)
3. Pick battery pack (2×18650/LiPo/Li-ion)
4. Add microcontroller
5. Select solar panel size (20W/30W/50W)
6. Add optional components (GPS, sensors, etc.)
7. **See real-time**: Total weight, power efficiency (W/kg)

### Phase 2: Test & Iterate (30-45 min)
1. Upload photo of physical/CAD prototype
2. Gemini AI analyzes in ~3-5 seconds
3. Get structured feedback:
   - Aerodynamic shape quality
   - Drag coefficient estimate
   - Solar panel coverage %
   - Weight distribution balance
   - 3-5 specific improvements
4. Refine design based on AI feedback
5. Upload new image (Iteration 2)
6. Repeat 2-3 times for innovation bonus

### Phase 3: Compete (10-15 min)
1. View their score (0-550 points)
2. See leaderboard ranking
3. Compare strategy with top teams
4. Choose next challenge mode

---

## 🤖 Gemini AI Integration

### What It Analyzes
```
Input: Solar car prototype image (JPG/PNG)
↓
Gemini Vision API
↓
Output (JSON):
{
  "aerodynamics": "good",           // poor/fair/good/excellent
  "dragCoefficient": 0.16,          // 0.05-0.35
  "solarCoverage": 72,              // 0-100%
  "weightBalance": "balanced",      // unbalanced/slight/balanced
  "suggestions": [
    "Taper rear section more aggressively...",
    "Reposition solar panel 5cm forward...",
    ...
  ]
}
```

### How It Works
1. Student uploads image → stored in Firebase Storage
2. Image URL → converted to base64 for Gemini API
3. Structured prompt → forces JSON output (no markdown)
4. Validation layer → ensures all fields are correct
5. Fallback → conservative estimates if API fails
6. Results stored → in Firestore for iteration tracking

### Cost Estimate (Google Cloud)
- Gemini 2.0 Flash: $0.075 per 1M input tokens, $0.30 per 1M output tokens
- 1 image analysis ≈ 500KB → ~$0.001 per analysis
- 30 students × 3 iterations = 90 analyses = ~$0.09 per class

---

## 📈 Scoring System (550 Points Total)

### 1. **Efficiency Score (0-250 pts)**
Formula: `(Power Output / Weight in kg) × 50`
- **Target**: 10+ W/kg
- **Examples**:
  - 30W motor + 3kg = 10 W/kg = 200 pts ✅
  - 50W motor + 4kg = 12.5 W/kg = 250 pts 🎯
  - 20W motor + 5kg = 4 W/kg = 80 pts

### 2. **Aerodynamics Score (0-150 pts)**
Based on Gemini drag coefficient estimate:
- **Cd < 0.10** = 150 pts (excellent)
- **Cd 0.10-0.15** = 120-150 pts (good) ← Target range
- **Cd 0.15-0.20** = 75-120 pts (fair)
- **Cd > 0.20** = 0-75 pts (poor)

### 3. **Innovation Score (0-100 pts)**
- **Iteration bonus**: 10 pts per iteration (max 50)
- **Component diversity**: 15 pts for carbon fiber, BLDC, LiPo, etc.
- **Image documentation**: 8 pts per uploaded image (max 40)
- **Total**: Up to 100 pts for 3+ iterations with unique choices

### 4. **Speed Bonus (0-50 pts)**
- **Full time used** (15 min) = 0 pts
- **Half time used** (7.5 min) = 25 pts
- **No time used** = 50 pts
- **Over time limit** = 0 pts (no penalty)

### Example Scoring
```
Team A (Efficiency Focus):
- Weight: 3.1kg, 30W motor → 96 W/kg = 240 pts ✅
- Drag coefficient: 0.18 → 90 pts
- 3 iterations, standard components → 40 pts
- Finished in 12 min → 20 pts
- TOTAL: 390 pts

Team B (Aerodynamic Focus):
- Weight: 3.8kg, 30W motor → 79 W/kg = 158 pts
- Drag coefficient: 0.13 → 145 pts ⭐
- 4 iterations, carbon fiber chassis → 60 pts
- Finished in 14 min → 5 pts
- TOTAL: 368 pts
```

---

## 🏆 Teacher Dashboard

### What Teachers See
- **Overview Stats**: Total teams, avg score, avg iterations, avg weight
- **Filter Tabs**: All teams, in-progress, completed
- **Team Cards**: Quick view of each team (score, weight, iterations, images)
- **Detailed Modal**: Per-team analytics, AI feedback, score breakdown, prototype images
- **Feedback Box**: Add personalized notes for each team

### Usage
```typescript
// Access at: /teacher/solar-car-dashboard
// Requires: user.teacher = true (custom Firebase claim)
```

### Features
1. **Class Analytics**
   - Distribution chart of scores
   - Avg iterations per team
   - Weight optimization trends
   - Aerodynamic improvement tracking

2. **Individual Team View**
   - All 4 images with timestamps
   - Each image's AI analysis results
   - Score progression across iterations
   - Component choices and weight breakdown

3. **Feedback & Coaching**
   - Add personalized comments per team
   - Share AI suggestions with class
   - Highlight exemplary designs
   - Track which teams need help

---

## 📱 Mobile Responsiveness

### Design Principles
- **Tabs sticky at top** on mobile (horizontal scroll)
- **Compact weight display** - grid layout on small screens
- **Large touch targets** for buttons (48px min)
- **Stack components vertically** on mobile
- **Image upload optimized** for phone camera
- **Leaderboard scrollable** with compressed columns

### Tested Breakpoints
- **Mobile**: 375px (iPhone SE)
- **Tablet**: 768px (iPad)
- **Desktop**: 1024px+ (monitors)

### Code
```typescript
// MobileResponsive.tsx wraps all components with:
// - Responsive grid layouts (grid-cols-1 md:grid-cols-2)
// - Touch-friendly spacing (p-4 md:p-8)
// - Overflow handling for leaderboards
// - Mobile-first color scheme (dark theme optimized)
```

---

## 🔧 Customization Guide

### Change Scoring Weights
Edit `utils/scoringEngine.ts`:
```typescript
// Increase efficiency importance
const EFFICIENCY_MAX = 300; // Was 250

// Decrease innovation bonus
const INNOVATION_MAX = 75; // Was 100
```

### Add New Components
Edit `SolarCarActivity.tsx`:
```typescript
const COMPONENT_DATABASE = {
  // Add new motor type
  motor: [
    ...,
    { id: 'hub_motor', name: 'Hub Motor', weight: 600, powerOutput: 120, cost: 180 }
  ],
  // Add new battery
  battery: [
    ...,
    { id: 'solid_state', name: 'Solid-State Battery', weight: 300, capacity: 15000, cost: 250 }
  ]
};
```

### Modify AI Analysis Prompt
Edit `services/geminiService.ts`:
```typescript
const analysisPrompt = `
  // Add new analysis criteria
  - Wheel design optimization for solar cars
  - Motor mounting vibration analysis
  - Cable routing efficiency
`;
```

### Adjust Time Limits
Edit `CompeteLeaderboard.tsx`:
```typescript
const TIME_LIMITS = {
  novice: 1350000,      // 22.5 min (was)
  standard: 1200000,    // 20 min (customize)
  expert: 600000        // 10 min (customize)
};
```

---

## 🐛 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Gemini API returns 401 | Invalid API key | Verify `REACT_APP_GEMINI_API_KEY` in .env |
| Images won't upload | Storage quota exceeded | Check Firebase Storage usage, clean old images |
| Scores not calculating | AI analysis missing | Ensure image uploaded successfully before scoring |
| Mobile tabs not sticking | CSS specificity issue | Check Tailwind `sticky` class is applied |
| Leaderboard not updating | Firestore rules blocking | Review security rules, verify user auth |
| Drag coefficient unrealistic | Prompt needs refinement | Adjust Gemini prompt with more specific guidance |

---

## 📚 File Structure

```
/src
├── components/
│   ├── SolarCar/
│   │   ├── SolarCarActivity.tsx          ← Main entry point
│   │   ├── BuildPrototype.tsx            ← Component selection tab
│   │   ├── TestIterate.tsx               ← Image analysis tab
│   │   ├── CompeteLeaderboard.tsx        ← Scoring & leaderboard tab
│   │   └── MobileResponsive.tsx          ← Mobile wrapper (optional)
│   └── TeacherDashboard.tsx              ← Teacher analytics
├── services/
│   └── geminiService.ts                  ← Gemini Vision API calls
├── utils/
│   └── scoringEngine.ts                  ← All scoring logic
└── config/
    └── firebase.ts                       ← Firebase initialization

/docs
├── SOLAR_CAR_SETUP.md                    ← Detailed setup guide
└── SOLAR_CAR_README.md                   ← This file
```

---

## 🚢 Deployment Checklist

- [ ] Firebase project created and configured
- [ ] Gemini API key generated and added to .env
- [ ] Firestore collections created with proper schema
- [ ] Firestore security rules deployed
- [ ] Firebase Storage rules configured
- [ ] All components copied to project
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set
- [ ] Routes added to React Router
- [ ] Components rendered in main app
- [ ] Tested on desktop (Chrome, Safari, Firefox)
- [ ] Tested on mobile (iOS Safari, Android Chrome)
- [ ] Teacher dashboard accessible with proper auth
- [ ] Sample data tested with pilot group
- [ ] Error handling verified (network, API failures)
- [ ] Production deployed with analytics enabled

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review SOLAR_CAR_SETUP.md for detailed config
3. Check Firebase docs for auth/database issues
4. Check Gemini API docs for AI analysis issues
5. Contact your development team with error logs

---

## 🎓 Student Learning Outcomes

By completing Solar Car Challenge, students will:
1. **Systems Thinking** - Balance competing engineering constraints
2. **Iteration & Refinement** - Use AI feedback to improve designs
3. **Data Analysis** - Interpret drag coefficient, efficiency metrics
4. **Decision-Making** - Trade-off analysis (weight vs. power vs. aerodynamics)
5. **Engineering Design** - Real component selection with cost/weight/performance
6. **AI Literacy** - Critical evaluation of machine learning output

---

**Last Updated**: September 2026  
**Version**: 1.0  
**Status**: Production Ready ✅
