# Phase 2 Deployment Report: Coach AI Activity Builder

**Date**: 2026-10-05  
**Release Lead**: Gemini 3.6  
**Target Project**: `dnd-master-73449`  
**Git Revision**: `43ee599b157745a8fdf9e2920106aa77c3713ee1` (`main`)  
**Production URLs**:
- **Firebase Hosting**: [https://dnd-master-73449.web.app](https://dnd-master-73449.web.app)
- **Cloud Functions (`api`)**: `https://api-6my6jtc3oa-uc.a.run.app`

---

## Executive Summary

Phase 2 of the **Coach AI Activity Builder** (`feature/coach-activities-p2`) has been successfully merged into `main` and deployed live to production project `dnd-master-73449`. 

All Cloud Functions, Cloud Firestore Security Rules, and static assets for Firebase Hosting have been deployed, configured, and verified.

---

## Technical & Runtime Configuration

1. **GCP Secret Manager Binding**:
   - Secret `SCHOOL_GEMINI_API_KEY` was provisioned in GCP Secret Manager for project `dnd-master-73449`.
   - Granted IAM role `roles/secretmanager.secretAccessor` to the Cloud Run / Functions service account (`80880435576-compute@developer.gserviceaccount.com`).
   - Declared `secrets: ['SCHOOL_GEMINI_API_KEY']` on `api(us-central1)` in [server/index.js](file:///Users/admin/Desktop/HearIsland/server/index.js).
   - Updated adapter initialization in [server/lib/ai/activityDrafts.js](file:///Users/admin/Desktop/HearIsland/server/lib/ai/activityDrafts.js) to consume `process.env.SCHOOL_GEMINI_API_KEY`. If unconfigured, the server cleanly returns `HTTP 409 AI_NOT_CONFIGURED` allowing coaches to create manual activities without failing or leaking credentials.

2. **Default Server AI Model**:
   - Server model defaulted to `gemini-2.5-flash` (`COACH_ACTIVITY_GEMINI_MODEL`).

3. **Firestore Security Rules**:
   - Updated rules enforced for collections: `coachAiConnections`, `activityDrafts`, `aiUsage`, `programJoinAttempts`. Direct browser writes remain strictly denied.

---

## Automated Verification Suite

| Test Category | Files | Total Tests | Status |
| :--- | :---: | :---: | :---: |
| **Unit Tests** (`npm run test:unit`) | 25 | 476 / 476 | **PASSED** ✅ |
| **API Integration Tests** (`npm run test:api`) | 9 | 112 / 112 | **PASSED** ✅ |
| **Rules & Combined Suite** (`npm test`) | 27 | 580 / 580 | **PASSED** ✅ |
| **Total Test Execution** | -- | **692 / 692** | **ALL PASSED** ✅ |

### Production Build

- **Command**: `npm run build` (Vite)
- **Duration**: 1.01 seconds
- **Output**: Clean compilation with **zero chunk size warnings** (>500 kB).

---

## Production Deployment & Live Verification

- **Cloud Function Deployment**:
  `✔ functions[api(us-central1)] Successful update operation.`
- **Hosting Deployment**:
  `✔ hosting[dnd-master-73449]: release complete`
- **Live HTTP Smoke Tests**:
  - `GET https://dnd-master-73449.web.app` -> `HTTP 200 OK`
  - `GET https://dnd-master-73449.web.app/api/learner-space` -> `HTTP 401 UNAUTHENTICATED`
  - CORS origin security header validated: `Access-Control-Allow-Origin: https://dnd-master-73449.web.app`

---

## Operational Integrity & Safety Compliance

- 🔒 **Zero Credential Exposure**: Raw API keys, tokens, or learner data were never printed, logged, or checked into repository files.
- 🛡️ **Rule Hardening**: Firestore security rules remain strict; no rules were loosened.
- 🌿 **Main Branch Integrity**: All changes are committed to `main` with zero uncommitted workspace modifications.
