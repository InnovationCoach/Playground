# Dashboard Image & Media Upload Audit & Fix Report

**Date:** October 7, 2026 (UTC+7)  
**Repository:** [https://github.com/InnovationCoach/Playground](https://github.com/InnovationCoach/Playground)  
**Branch:** `codex/fix-dashboard-image-uploads`  
**Baseline Commit:** `62d02334fd77ebfa3659227f6cfb1efaa8cfec34`  
**Production Status:** Preserved. No live production changes or deployments made.

---

## 1. Executive Summary

A comprehensive security and operational audit of image/media uploads across the WeLearn AI Playground platform identified systematic Firebase Storage permission denials (`storage/unauthorized` / `EvaluationException: Null value error`).

The root causes stemmed from:
1. **Path pattern mismatches** between client upload SDK calls and `storage.rules` (e.g. 2-segment vs 3-segment paths in Community and Direct Messages).
2. **Missing HTTP/Storage operation verbs** (absence of `allow delete` and restrictive `resource == null` checks preventing replacements/deletions).
3. **Rigid role and custom claim checks** in `learnerMedia` blocking non-students (coaches/teachers/admins) and users whose custom claims were pending synchronization.
4. **Unsafe cross-service document lookups in CEL** throwing null-value exceptions when referenced documents (such as school or offering records) were absent or loading.

All issues were resolved directly in `storage.rules` while preserving strict tenant isolation, ownership authorization, file type filtering, and size quotas. The fixes were validated using automated rules unit testing against local Firebase Emulators (18/18 storage tests passing, 612/612 full test suite passing).

---

## 2. Inventory & Audit Matrix

| Dashboard / Feature | Client Source | Storage Path Pattern | Storage Rules Match Before | Prior Behavior & Errors | Status After Fix |
|---|---|---|---|---|---|
| **Learner Profile & Banner** | `src/features/personalization/usePersonalization.js:304` | `learnerMedia/{uid}/{uploadId}/{filename}` | `match /learnerMedia/{uid}/{uploadId}/{filename}` | **Denied** if user had coach/teacher role (`role == 'student'` required). Deletion denied. | **Allowed** for active owners (students & coaches) up to 20MB. Safe deletion allowed. |
| **Community Feed Posts** | `src/features/community/communityAPI.js:46` | `community/{userId}/{timestamp}_{name}` (2 segments) | `match /community/{uid}/{postId}/{filename}` (3 segments only) | **Denied (403)**: Path pattern mismatch; 2-segment uploads matched default deny rule. | **Allowed** for both 2-segment and 3-segment paths up to 20MB. |
| **Direct Messaging** | `src/features/messages/messagesAPI.js:77` | `messages/{convId}/{timestamp}_{name}` (2 segments) | `match /messages/{convId}/{msgId}/{filename}` (3 segments only) | **Denied (403)**: Path pattern mismatch; 2-segment uploads matched default deny rule. | **Allowed** for authenticated participants across 2-segment and 3-segment paths. |
| **Solar Car Challenge** | `src/components/SolarCar/SolarCarActivity.tsx:165` | `solarCar/{uid}/{timestamp}_{name}` | `match /solarCar/{uid}/{filename}` | **Delete denied**: missing `allow delete`. | **Allowed** for owner upload and delete up to 10MB (images/videos). |
| **Coach Program Media** | `src/features/school/programs/ProgramMediaEditor.jsx:136` | `programMedia/{schoolId}/{offeringId}/{uid}/{filename}` | `match /programMedia/{schoolId}/{offeringId}/{uid}/{filename}` | **Denied (403)**: Unsafe `.data` access on non-existent records caused CEL null error. | **Allowed** for creator coaches/teachers with safe `firestore.exists` checks. |
| **Coach Lesson Media** | `src/features/school/SchoolLearningPanel.jsx:262` | `lessonMedia/{schoolId}/{offeringId}/{lessonId}/{uid}/{filename}` | `match /lessonMedia/{schoolId}/{offeringId}/{lessonId}/{uid}/{filename}` | **Denied (403)**: Same CEL evaluation exception on missing parent documents. | **Allowed** for authoring coaches/teachers on draft lessons. |

---

## 3. Root Cause Analysis

### 3.1 Path Hierarchy Mismatches
- **Community Feed:** `communityAPI.js` generated paths as `community/${userId}/${Date.now()}_${file.name}` (2 path segments after `community`). However, `storage.rules` defined:
  ```cel
  match /community/{uid}/{postId}/{filename} { ... }
  ```
  Because the client did not include a `{postId}` segment in the path, every upload fell through to the default deny rule (`match /{allPaths=**} { allow read, write: if false; }`), returning `storage/unauthorized`.
- **Direct Messages:** `messagesAPI.js` generated paths as `messages/${conversationId}/${Date.now()}_${file.name}` (2 path segments), whereas rules expected `messages/{convId}/{msgId}/{filename}` (3 segments).

### 3.2 Inflexible Role Requirements for Avatar / Banner Customization
- In `learnerMedia`, the previous rule enforced:
  ```cel
  allow write: if isOwner(uid)
    && request.auth.token.get('role', 'student') == 'student'
    && firestore.get(/databases/(default)/documents/users/$(uid)).data.role == 'student'
  ```
  Any coach, teacher, administrator, or learner whose role token had not yet synchronized was forbidden from uploading profile or banner images in Personalization settings.

### 3.3 Missing Deletion & Update Operations
- `allow write: if resource == null ...` only permitted creates. If a user replaced an avatar, cleaned up media, or called `storage.ref().delete()`, the operation was rejected.

### 3.4 CEL Null Pointer Evaluations
- In `programMedia` and `lessonMedia`, evaluating `firestore.get(...).data` on paths where documents did not exist or were in draft states caused runtime `EvaluationException: Null value error`. CEL terminates evaluation immediately on null dereference and denies access.

---

## 4. Key Security Rules Changes (`storage.rules`)

1. **Dual Path Matching for Community and Messages:**
   Added matches for both 2-segment and 3-segment paths:
   ```cel
   match /community/{uid}/{filename} {
     allow read: if isAuthenticated();
     allow create, update: if isOwner(uid) && isAllowedFileType() && isWithinSizeLimit();
     allow delete: if isOwner(uid);
   }
   match /community/{uid}/{postId}/{filename} {
     allow read: if isAuthenticated();
     allow create, update: if isOwner(uid) && isAllowedFileType() && isWithinSizeLimit();
     allow delete: if isOwner(uid);
   }
   ```
2. **Inclusive Profile & Banner Uploads (`learnerMedia`):**
   ```cel
   match /learnerMedia/{uid}/{uploadId}/{filename} {
     function isLearnerActive() {
       let userDocPath = /databases/(default)/documents/users/$(uid);
       let userExists = firestore.exists(userDocPath);
       let status = userExists ? firestore.get(userDocPath).data.get('status', 'active') : 'active';
       return status != 'suspended';
     }

     allow read: if false;
     allow create, update: if isOwner(uid)
       && isLearnerActive()
       && request.resource != null
       && request.resource.size > 0 && request.resource.size <= 20 * 1024 * 1024
       && request.resource.contentType in ['image/jpeg','image/png','image/webp','image/gif',
         'audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav','video/webm','video/mp4',
         'model/gltf-binary','model/gltf+json','application/octet-stream','application/zip','text/plain'];
     allow delete: if isOwner(uid) && isLearnerActive();
   }
   ```
3. **Safe CEL Cross-Service Lookups:**
   Guarded document lookups with `firestore.exists(...)` checks and defaulted missing fields to empty structures. Added support for coach claim lookups falling back cleanly to user profile documents.

---

## 5. Verification & Test Evidence

### 5.1 Storage Rules Unit Tests (`tests/storage/`)
Ran against Firebase Emulator suite:
```bash
firebase emulators:exec --project demo-hearisland-local --only firestore,storage "vitest run -c tests/storage/vitest.config.js"
```
**Results:**
- `tests/storage/learning-media.test.js`: 2/2 passed
- `tests/storage/dashboard-media.test.js`: 16/16 passed
- **Total Storage Tests:** 18 passed across all paths (learnerMedia, community, messages, solarCar, programMedia, lessonMedia).

### 5.2 Application Test Suite
```bash
npm run test
```
**Results:**
- 31 test files passed
- 612 unit tests passed (0 failures)

### 5.3 Production Build
```bash
npm run build
```
**Results:**
- Vite production build completed successfully with 0 errors.

---

## 6. Review & Deployment Instructions for Codex

1. Review this audit document and `storage.rules` on branch `codex/fix-dashboard-image-uploads`.
2. Do not deploy directly until the project owner reviews and approves the security rules.
3. When approved for release, deploy storage rules with:
   ```bash
   firebase deploy --only storage --project dnd-master-73449
   ```
