# ☀️ Solar Car Challenge - Quick Reference Checklist

Print this page or use it as a bookmark. Check off tasks as you complete them.

---

## 📦 Phase 1: Foundation (Week 1-2)

### Setup & Configuration
- [ ] Create Firebase project
- [ ] Enable Firestore Database
- [ ] Enable Firebase Storage
- [ ] Create `.env.local` with all keys
- [ ] Install npm dependencies

### Component Integration
- [ ] Copy all React components to `/src/components/SolarCar/`
- [ ] Copy `geminiService.ts` to `/src/services/`
- [ ] Copy `scoringEngine.ts` to `/src/utils/`
- [ ] Register route in React Router
- [ ] Create test user in Firestore

### Testing
- [ ] App loads at `/activity/solar-car`
- [ ] BuildPrototype tab displays
- [ ] Weight calculator works in real-time
- [ ] Component selection saves to Firestore
- [ ] Mobile responsive on tablet

**Target Completion: End of Week 2**

---

## 🧪 Phase 2: AI Integration (Week 3)

### Gemini API Setup
- [ ] Enable Generative Language API in Google Cloud
- [ ] Create API key
- [ ] Add to `.env.local`
- [ ] Test API key with simple prompt

### Implementation
- [ ] Image upload to Firebase Storage works
- [ ] Gemini API call returns JSON
- [ ] All 4 metrics display (aerodynamics, drag, coverage, balance)
- [ ] Suggestions appear as bulleted list
- [ ] Images and analysis saved to Firestore
- [ ] Fallback analysis works on API failure

### Refinement
- [ ] Collect 10 sample prototype images
- [ ] Test Gemini analysis on each
- [ ] Evaluate drag coefficient estimates (should be 0.10-0.20)
- [ ] Evaluate solar coverage % (should be 60-80%)
- [ ] Check suggestions are specific and actionable
- [ ] Refine prompt if needed

**Target Completion: End of Week 3**

---

## 🏆 Phase 3: Scoring & Leaderboard (Week 4)

### Scoring Algorithm
- [ ] Test all 4 scoring dimensions individually
- [ ] Verify efficiency calculation: (Power W / Weight kg) × 50
- [ ] Verify aerodynamics: drag coefficient mapping to 0-150 pts
- [ ] Verify innovation: iteration bonus + component diversity
- [ ] Verify speed: time-based bonus (0-50 pts)
- [ ] Total score calculation: 0-550 points

### Leaderboard
- [ ] Create `solarCar_leaderboard` collection
- [ ] Real-time sorting by total score
- [ ] Rank badges assign correctly (🥇 🥈 🥉 ⭐)
- [ ] Score transparency: breakdown visible
- [ ] Achievement badges display

### Testing
- [ ] Create 5 test teams with different strategies
- [ ] Verify leaderboard ranks correctly
- [ ] Check score breakdowns match calculations
- [ ] Verify real-time updates when new team joins

**Target Completion: End of Week 4**

---

## 🚀 Phase 4: Polish & Launch (Week 5)

### Pilot Testing (20 Students)
- [ ] Recruit 20 diverse students
- [ ] Provide test login credentials
- [ ] Send testing instructions
- [ ] Collect feedback survey (5 questions)
- [ ] Observe pain points and confusions

### Gemini Refinement (Based on Pilot Feedback)
- [ ] Identify "confusing" feedback from students
- [ ] Update prompt with clearer context/examples
- [ ] Re-test on sample images
- [ ] Verify suggestions more understandable

### Mobile Optimization
- [ ] Test on iPad (landscape + portrait)
- [ ] Test on iPhone (landscape + portrait)
- [ ] Test on Android phone
- [ ] Fix responsive layout issues
- [ ] Verify tap targets are 48px minimum

### Teacher Dashboard
- [ ] Dashboard loads with test teams
- [ ] Teachers can find teams quickly
- [ ] Team details modal shows score breakdown
- [ ] Prototype images display
- [ ] Feedback input works and saves

### Pre-Launch
- [ ] All Firestore rules reviewed and deployed
- [ ] All Storage rules reviewed and deployed
- [ ] Error messages are helpful (not technical)
- [ ] No sensitive data in logs
- [ ] Analytics enabled
- [ ] Firebase Console monitored for usage

### Deployment
- [ ] Production build test: `npm run build && npm run start`
- [ ] Deploy to Firebase: `firebase deploy`
- [ ] Test production URL in browser
- [ ] Test as a real user (login, build, submit)
- [ ] Check teacher dashboard in production

**Target Completion: End of Week 5**

---

## 📋 Daily Standup Template (Use for team meetings)

```
What did I complete today?
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

What's blocking me?
- Issue 1: [description]
- Issue 2: [description]

What's next?
- [ ] Task for tomorrow 1
- [ ] Task for tomorrow 2
```

---

## 🚨 Emergency Troubleshooting

| Problem | Quick Fix | Details |
|---------|-----------|---------|
| App won't load | Check .env.local keys | See SOLAR_CAR_SETUP.md |
| Firebase 401 error | Verify API key in console | Google Cloud Console > Credentials |
| Gemini returns error | Check API is enabled | Google Cloud > Generative Language API |
| Weight calc wrong | Debug COMPONENT_DATABASE | Check each component's weight value |
| Leaderboard stuck | Restart app, check Firestore rules | Firebase Console > Firestore > Rules |
| Mobile broken | Test on real device | Use Chrome DevTools > device emulator |

---

## 🎯 Success Metrics Checklist

### Phase 1
- [ ] Component selection works ✅
- [ ] Weight calculation accurate ✅
- [ ] Mobile responsive ✅

### Phase 2
- [ ] Image upload successful ✅
- [ ] Gemini analysis returns all 4 metrics ✅
- [ ] Suggestions helpful to students ✅

### Phase 3
- [ ] Scores calculate correctly ✅
- [ ] Leaderboard updates in real-time ✅
- [ ] Different strategies can win ✅

### Phase 4
- [ ] 20 pilot students complete challenge ✅
- [ ] Avg satisfaction ≥ 4/5 stars ✅
- [ ] No critical bugs found ✅
- [ ] Mobile works on real devices ✅
- [ ] Teachers can monitor progress ✅

---

## 📞 Key Contacts & Resources

### Documentation
- Setup Guide: `SOLAR_CAR_SETUP.md`
- User Guide: `SOLAR_CAR_README.md`
- Implementation: `PHASE_BY_PHASE_GUIDE.md`
- This: `QUICK_REFERENCE_CHECKLIST.md`

### External Services
- **Firebase Console**: console.firebase.google.com
- **Google Cloud Console**: console.cloud.google.com
- **Gemini Docs**: ai.google.dev/docs

### Common Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy

# View Firebase logs
firebase functions:log

# Test Firestore locally
firebase emulators:start
```

---

## 💾 Backup & Version Control

```bash
# Before each phase, commit to git
git add .
git commit -m "Phase [1-4]: [brief description]"

# Create backup of .env.local (NEVER commit this!)
cp .env.local .env.local.backup

# Tag production release
git tag -a v1.0-production -m "Production launch"
git push origin v1.0-production
```

---

## 📈 Progress Tracker

Use this to see overall progress:

```
Phase 1: Foundation
████████░░ 80% (Day 11/14)

Phase 2: AI Integration
██░░░░░░░░ 20% (Day 2/7)

Phase 3: Scoring
░░░░░░░░░░ 0% (Not started)

Phase 4: Launch
░░░░░░░░░░ 0% (Not started)

Overall: ████░░░░░░ 20% (Week 2/5)
```

---

## 🏁 You're Ready to Launch!

Once all boxes ☑️ are checked across all 4 phases, you're ready to:
1. Deploy to production
2. Train teachers on dashboard
3. Rollout to full class
4. Monitor metrics
5. Iterate based on real usage

**Expected Timeline**: 5 weeks from start to production  
**Support**: Reference PHASE_BY_PHASE_GUIDE.md for detailed steps  
**Questions**: Check SOLAR_CAR_SETUP.md for configuration issues

**Good luck! 🚗☀️**
