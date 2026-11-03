# Storage & Media Upload Hardening: Integration, Verification & Deployment Plan

**Date:** October 7, 2026 (Asia/Bangkok)  
**Target Project:** `dnd-master-73449`  
**Hosting Target:** `dnd-master-73449` (`https://dnd-master-73449.web.app/`)  
**Backend Target:** Cloud Functions v2 `api` (us-central1, nodejs20, 512MiB)  
**Storage Bucket:** `dnd-master-73449.firebasestorage.app`  
**Integration Branch:** `codex/fix-dashboard-image-uploads`  
**Baseline Commit:** `0b6300fcf54793d39a0bcc7c556640bf0111ba95`  
**Integrated Patch Commit:** `012c755f7d8bbb13271d9d79d6592d5628bf26a3`  

---

## 1. Executive Summary & Verification Evidence

Codex's comprehensive upload hardening patch (`STORAGE-UPLOAD-FIX-a9d531b.patch`) was safely integrated into an isolated verification environment (`/private/tmp/hearisland-integration`), preserving all uncommitted work in the main workspace.

### Actual Automated Verification Results

| Test Suite / Step | Command | Result | Details |
|---|---|---|---|
| **Storage Rules Tests** | `npm run test:storage` | **27 / 27 PASSED** (3 files) | Verified in `demo-hearisland-local` emulators: `dashboard-media`, `learning-media`, `media-hardening` |
| **Firestore & Unit Tests** | `npm test` | **607 / 607 PASSED** (30 files) | Verified against Firestore emulator (`demo-hearisland-rules`) |
| **Personalization API Tests** | `vitest run --config tests/api/vitest.api.config.js tests/api/personalization.test.js` | **13 / 13 PASSED** (1 file) | Verified against Auth & Firestore emulators |
| **Frontend Production Build** | `npm run build` | **PASSED** (0 errors) | Built cleanly via Vite in 989ms |
| **Whitespace / Conflict Check** | `git diff --check` | **PASSED** (0 warnings/errors) | Clean diff formatting across all 21 modified files |

---

## 2. Intended Behavior & Security Safeguards Confirmed

1. **Active Profile Mandate:**
   - `storage.rules`: `isLearnerActive()` and `hasActiveProfile()` require that `/users/$(request.auth.uid)` explicitly exists and has `status == 'active'`. Missing, pending, or suspended user profiles fail closed.
2. **Conversation Attachment Membership & Ownership:**
   - `storage.rules`: Reading or uploading message attachments (`messages/{convId}/...`) requires active profile and presence in `conversations/$(convId).participantIds`.
   - Modifying or deleting attachments requires matching `resource.metadata.ownerUid == request.auth.uid` or verified admin moderation.
   - `firestore.rules`: Updates to `conversations/{convId}` are restricted via `.affectedKeys().hasOnly(['lastMessageAt', 'lastMessagePreview', 'unread'])`, preventing clients from altering conversation participants to bypass storage boundaries.
3. **School Evidence Scoping:**
   - `storage.rules`: Legacy unscoped `schools/{schoolId}/submissions/{submissionId}/evidence/{filename}` is denied (`allow read, write: if false;`).
   - Scoped path `schools/{schoolId}/programOfferings/{offeringId}/submissions/{submissionId}/evidence/{filename}` enforces active school status, current enrolled class membership, matching custom claims, and student ownership (or scoped staff moderation).
4. **Learner Media Privacy & Preview Recovery:**
   - Direct client reads on `learnerMedia`, `lessonMedia`, and `programMedia` remain denied (`allow read: if false;`). Access requires temporary signed URLs issued by the Express backend.
   - `src/features/personalization/learnerUpload.js`: Upload failures are distinguished from preview signing failures. If signing fails, the upload path is retained so preview or save can be retried without re-uploading bytes.
   - `src/features/personalization/usePersonalization.js`: An explicit discard action (`discardPendingUpload`) deletes uncommitted storage blobs.
   - `server/routes/personalization.js`: When saving settings succeeds but preview URL signing fails, Firestore revisions and document updates are preserved with a `mediaPreviewUnavailable` flag rather than failing the transaction.
5. **Format Validation & Guidance:**
   - Supported client formats (JPEG, PNG, WebP, GIF, MP4, WebM) are validated before upload.
   - For `.mov`, `.heic`, and `.heif`, the UI provides actionable conversion guidance rather than unhandled network rejections.
6. **Local Emulator Integration:**
   - `firebase.json` and `src/firebase.js`: Configured Storage emulator port `9199` with demo project bucket fallback, ensuring offline test parity.

---

## 3. Production Configuration & Target Architecture

| Component | Target Identity / Configuration | Verification Note |
|---|---|---|
| **Hosting** | `dnd-master-73449.web.app` | Classic Firebase Hosting rewriting `/api/**` to Cloud Function `api` |
| **Cloud Function** | `api` (v2, us-central1, nodejs20, 512MiB) | Default App Engine / compute service account (`dnd-master-73449@appspot.gserviceaccount.com`) |
| **Storage Bucket** | `dnd-master-73449.firebasestorage.app` | Private bucket with cross-service Firestore integration |
| **Cross-Service IAM** | `service-[PROJECT_NUM]@gcp-sa-firebasestorage.iam.gserviceaccount.com` | Verified present with `roles/firebaserules.firestoreServiceAgent` |
| **URL Signing Identity** | Default Compute / Firebase Admin SDK | Uses Cloud IAM signing in Cloud Functions v2. No `storage.admin` permission needed or granted |

---

## 4. Legacy Compatibility & Transition Impact

1. **Older Frontend Clients:**
   - Previous versions of `messagesAPI.js` did not send custom `ownerUid` metadata on upload.
   - **Effect:** Once new storage rules are deployed, message attachment uploads from obsolete, un-refreshed client sessions will fail until the page reloads.
   - **Mitigation:** Existing uploaded message attachments without `ownerUid` metadata remain readable by all conversation participants, but cannot be edited or deleted by non-admin clients.
2. **Legacy School Evidence Path:**
   - Unscoped path `schools/{schoolId}/submissions/{submissionId}/evidence/{filename}` is locked (`allow read, write: if false`). No active client in the repository uses this path.
3. **Existing Download Tokens:**
   - Any pre-existing bearer tokens on older objects are not revoked by rule deployment; private paths ensure all new assets require signed URL access.

---

## 5. Deployment Plan (Step-by-Step)

> [!IMPORTANT]
> **Owner Approval Required:** Do not run these deployment steps until explicit authorization is given.

### Pre-Deployment Checklist
- [ ] Confirm baseline commit `0b6300f` and integration commit `012c755`.
- [ ] Verify that current live traffic is stable and no ongoing exam/lesson sessions are active.
- [ ] Record current release versions:
  ```bash
  firebase hosting:releases:list --project dnd-master-73449
  ```

### Execution Steps
1. **Deploy Firestore Security Rules:**
   ```bash
   firebase deploy --only firestore:rules --project dnd-master-73449
   ```
2. **Deploy Storage Security Rules:**
   ```bash
   firebase deploy --only storage --project dnd-master-73449
   ```
3. **Deploy Backend API Function:**
   ```bash
   firebase deploy --only functions:api --project dnd-master-73449
   ```
4. **Build & Deploy Frontend Hosting:**
   ```bash
   npm run build
   firebase deploy --only hosting --project dnd-master-73449
   ```

---

## 6. Post-Deployment Verification & Smoke Tests

1. **Learner Space:** Sign in as a student, upload avatar/banner (JPEG/PNG), verify preview generation, save settings, reload page, verify image displays.
2. **Message Attachments:** Send an attachment in an existing conversation; verify `ownerUid` is set and recipient can view it.
3. **Outsider Denial:** Attempt unauthorized cross-user access to ensure rules reject non-participants.
4. **Unsupported Formats:** Attempt HEIC/MOV upload; verify user receives format conversion instructions.

---

## 7. Rollback Plan

If critical regressions occur after release:

1. **Hosting Rollback (Instant):**
   ```bash
   firebase hosting:rollback --project dnd-master-73449
   ```
2. **Storage & Firestore Rules Rollback:**
   - Redeploy the pre-patch baseline `storage.rules` (from commit `0b6300f`):
     ```bash
     git checkout 0b6300f -- storage.rules firestore.rules
     firebase deploy --only firestore:rules,storage --project dnd-master-73449
     ```
   *(Note: The pre-patch storage rules retain the previous permission set without deleting any uploaded assets).*
3. **Backend Rollback:**
   - Re-deploy the previous function source:
     ```bash
     git checkout 0b6300f -- server/
     firebase deploy --only functions:api --project dnd-master-73449
     ```
4. **Data Safety Assurance:**
   - No user media or Firestore records will be deleted as part of rollback.

---

## 8. Status & Approval Request

- Integration: **Complete and verified** on branch `codex/fix-dashboard-image-uploads`.
- Tests: **All passing** (27 Storage, 607 Core, 13 API, 0 Build errors).
- Working Tree: Main workspace uncommitted changes are untouched and preserved.
- **Awaiting owner decision before any production deployment.**
