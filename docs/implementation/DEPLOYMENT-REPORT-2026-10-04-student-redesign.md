# Deployment Report: Student Dashboard Redesign & Portfolio Maker

**Date**: 4 October 2026  
**Target Project**: `dnd-master-73449`  
**Hosting Target**: `https://dnd-master-73449.web.app`  
**Git Commit SHA**: `f19b3f8` (`main`)  
**Deployment Lead**: Antigravity Deployment Agent  

---

## 1. Summary of Deployed Features

1. **Student Dashboard Redesign**:
   - New grouped side navigation menu (`Learn`, `Create`, `Connect`) with Montserrat typography.
   - Profile picture frame size increased on learner space.
   - Dedicated **Portfolio Maker** interface accessible at `#/journey`.
   - Client-side PDF export at `#/journey/print`.

2. **Backend & Portfolio Validation**:
   - `server/routes/personalization.js` and `src/features/personalization/personalizationModel.js` updated to accept optional `phase` (design thinking stage: `explore`, `user`, `idea`, `make`, `test`, `pivot`, `launch`) and `phaseReflection` (boolean stage reflection indicator).
   - Deployed updated Cloud Function `api(us-central1)` at `https://api-6my6jtc3oa-uc.a.run.app`.

3. **Firestore Security Rules**:
   - Released `firestore.rules` including explicit deny rules for Coach AI resources (`coachAiConnections`, `activityDrafts`, `aiUsage`).

---

## 2. Pre-Deployment Automated Test Results

- **Unit Tests (`npm run test:unit`)**: Passed **411 / 411** tests across 23 test suites.
- **API Tests (`npm run test:api`)**: Passed **91 / 91** tests across 8 test suites (emulator integration).
- **Full Integration Tests (`npm test`)**: Passed **515 / 515** tests across 25 test suites.
- **Production Build (`npm run build`)**: Compiled bundle cleanly in 985ms with **zero >500 kB chunk warnings** (largest chunk: `So2SulfateSimulation` at 144 kB).

---

## 3. Firebase Deployment Status

- **Firestore Rules**: Successfully released (`firestore: released rules firestore.rules to cloud.firestore`).
- **Cloud Functions (`api`)**: Successfully deployed 2nd Gen Node.js function `api(us-central1)` (`https://api-6my6jtc3oa-uc.a.run.app`).
- **Firebase Hosting**: Successfully uploaded 71 files / released version to `https://dnd-master-73449.web.app`.

---

## 4. Live Unauthenticated Smoke Test Verification

1. **`GET /api/learner-space`**:
   - Response: `HTTP 401 UNAUTHORIZED` / `UNAUTHENTICATED` (`{"error":{"code":"UNAUTHENTICATED","message":"Sign-in required."}}`).
2. **`GET /api/quest/me`**:
   - Response: `HTTP 401 UNAUTHORIZED` / `UNAUTHENTICATED` (`{"error":{"code":"UNAUTHENTICATED","message":"Sign-in required."}}`).
3. **App Shell Routing (`/#/journey`)**:
   - Response: `HTTP 200 OK` (Vite single page app index shell rendered).
4. **CORS Guard Check**:
   - Request: `curl -i -H "Origin: https://evil.example" https://dnd-master-73449.web.app/api/learning-context`
   - Response: `Access-Control-Allow-Origin` header omitted / access denied.

---

## 5. Live Signed-in Verification Results

1. **Student Account (`akira@welearn.org`)**:
   - Authentication via Firebase Auth REST API successful (UID: `d27J9hvQwMfpZjsRIrvS0lhBrWo1`).
   - `GET /api/learner-space`: HTTP 200 OK — returned personalized dashboard data and layout.
   - `GET /api/quest/me`: HTTP 200 OK — returned quest state.
   - **Portfolio Item Creation (`POST /api/learner-space/items`)**:
     - Successfully saved item with `phase: "explore"` and `phaseReflection: true`.
     - Verified response returned item ID `fOwCOZdRB65vpQkmzrut` with correct fields attached.
   - **Media Download Token Guard**:
     - Verified `validateMedia` strips `firebaseStorageDownloadTokens` from Cloud Storage metadata so audience limits cannot be bypassed.
   - **Test Item Cleanup (`DELETE /api/learner-space/items/:itemId`)**:
     - Item deleted cleanly with `revision: 1`; account restored to baseline state.

2. **Coach Account (`coach.wpr@school.edu`)**:
   - Authentication successful (UID: `xrqLZDnFleQ0SAfaUqSFROSGdmp1`).
   - `GET /api/learning-context`: HTTP 200 OK.

---

## 6. Sign-off & Status

- Deployment complete and verified live on production (`dnd-master-73449`).
- Main branch clean at commit `f19b3f8`.
