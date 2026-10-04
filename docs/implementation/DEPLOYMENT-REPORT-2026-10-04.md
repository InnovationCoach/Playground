# Firebase Production Deployment Report: Baseline Release + Teen Quest

**Firebase Project:** `dnd-master-73449`  
**Hosting Site:** `https://dnd-master-73449.web.app`  
**Deployed Commit:** `588cbc2` on `main`  
**Function Endpoint:** `https://api-6my6jtc3oa-uc.a.run.app` (2nd Gen Node.js 20 `api`)  
**Date:** October 4, 2026  

---

## Executive Summary

The **Baseline Release** (Personalised Dashboards & Portfolios, Coach Program Creation, Class Codes, Simulation Lab, Navigation Refresh, Goal-Setting Journal Modal) and **Teen Quest** (Phases A, B, C: Server-awarded XP, Levels, Badges, Weekday Streaks, Squad Goals, Quest Home, Quest Map, Calm View, Staff/Parent Summaries) have been successfully merged, tested, and deployed to production.

Pilot mode (`schools/school-wpr.features.questMode = true`) was switched on for `school-wpr` and verified live with test accounts (`akira@welearn.org`, `coach.wpr@school.edu`, `admin.test@school.edu`, `parent.test@school.edu`).

---

## 1. Deployed Components & Git References

| Component | Git Branch / Commit | Live Revision / Target | Status |
| :--- | :--- | :--- | :--- |
| **Baseline + Teen Quest Codebase** | `main` @ `588cbc2` | Merged & Fast-Forwarded from `feature/teen-quest` | **DEPLOYED** ✅ |
| **Firestore Security Rules** | `firestore.rules` | `cloud.firestore` | **RELEASED** ✅ |
| **Storage Security Rules** | `storage.rules` | `firebase.storage` | **RELEASED** ✅ |
| **Cloud Function (`api`)** | 2nd Gen Node.js 20 | `us-central1` (`https://api-6my6jtc3oa-uc.a.run.app`) | **UPDATED** ✅ |
| **Firebase Hosting** | `dist/` | `https://dnd-master-73449.web.app` | **RELEASED** ✅ |

---

## 2. Automated Test Verification Evidence

All local test suites passed cleanly prior to deployment:

```
1. Unit & Interface Tests (npm run test:unit):
   Test Files: 21 passed (21)
   Tests:      371 passed (371)

2. API Integration Tests (npm run test:api against Auth & Firestore emulators):
   Test Files: 8 passed (8)
   Tests:      89 passed (89)

3. Combined Rules & Model Tests (npm test):
   Test Files: 23 passed (23)
   Tests:      474 passed (474)

4. Production Build (npm run build):
   Compiled in 1.02s without errors.
```

---

## 3. Unauthenticated API Smoke Tests (Live Environment)

Requests to non-public endpoints verify that same-origin `/api/**` rewrites and auth middleware are active:

```http
1. GET /api/quest/me
   HTTP/2 401 Unauthorized
   {"error":{"code":"UNAUTHENTICATED","message":"Sign-in required."}}

2. GET /api/learner-space
   HTTP/2 401 Unauthorized
   {"error":{"code":"UNAUTHENTICATED","message":"Sign-in required."}}

3. GET /api/no-such-route
   HTTP/2 404 Not Found
   {"error":{"code":"NOT_FOUND","message":"No route GET /api/no-such-route"}}
```

---

## 4. Step 11: Teen Quest Pilot Switch-On Evidence (`school-wpr`)

- **Feature Flag Set:** `schools/school-wpr.features.questMode = true` in Firestore via Admin API.
- **Student Verification (`akira@welearn.org`):**
  - `GET /api/quest/me` returned Level 1 ("Curious Starter"), 0 XP initial state.
  - `POST /api/quest/events` with 40+ character reflection:
    - **Response:** `+15 XP` awarded, daily reflection counter updated to 1 (`curious-mind` progress: 33.3%).
  - Second reflection submission on the same day:
    - **Response:** Capped cleanly (`"already added"`), preventing XP farming.
  - Calm View toggle via `PATCH /api/quest/me`:
    - Switched `calmView: true` and restored `calmView: false` with revision sequence checks.
- **Staff Summary Verification (`coach.wpr@school.edu`):**
  - `GET /api/quest/learners/d27J9hvQwMfpZjsRIrvS0lhBrWo1?schoolId=school-wpr&classId=class-wpr-11a`:
    - **Response:** HTTP 200 OK returning Akira's verified level (Level 1), counters (`reflections: 1`), and streak data.
- **Security Rules Verification (Direct Firestore Access):**
  - `GET https://firestore.googleapis.com/v1/projects/dnd-master-73449/databases/(default)/documents/learnerQuest/d27J9hvQwMfpZjsRIrvS0lhBrWo1`:
    - **Response:** `HTTP 403 Forbidden` (`Missing or insufficient permissions`), confirming server-only protection on `learnerQuest` and `questSquad`.

---

## 5. Rollback & Operational Procedure

- **Disable Teen Quest Pilot:**
  Set `schools/<schoolId>.features.questMode = false` in Firestore. The student interface immediately reverts to Studio Home without data loss.
- **Full Production Rollback:**
  Re-deploy hosting version or function revision via Firebase CLI:
  ```bash
  firebase hosting:clone dnd-master-73449:<previous-version> dnd-master-73449:live
  ```
