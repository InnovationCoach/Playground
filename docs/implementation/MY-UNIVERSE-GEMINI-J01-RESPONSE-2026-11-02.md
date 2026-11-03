# My Universe — J01 Backend, Security, Data & Release Audit Response

**Date:** 2 November 2026  
**Task ID:** `J01` (Read-Only Backend, Security, Data & Release Audit + Contract Requirements)  
**Author / Actual Model:** **Gemini 4 Argon** (selected by Mani because Gemini 5.8 is not offered in the model selector; reported truthfully per work-order rule — never labeled as Gemini 5.8)  
**Role:** Backend, Firestore Rules, Server API, Storage/Export, Emulator & Release Gate Owner  
**Status of `MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md`:** Initial `J01` audit (§1–§6) written at `09:39+07:00`; **Section 7** (`09:49+07:00`) reviewed `0.1.0-proposed`; **Section 8** (`10:15+07:00`) records final **`ACCEPT`** of contract revision **`0.1.1`** (`/Users/admin/Desktop/HearIsland/docs/implementation/MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` §9 and `/Users/admin/Desktop/HearIsland/docs/implementation/MY-UNIVERSE-G02-REVIEW-2026-11-02.md`) and incorporates all lead factual corrections.  
**Audit Execution Mode:** Strictly read-only repository and Git object inspection. Zero source edits, merges, branch creation, pushes, deployments, permission changes, credential outputs, test/build executions, or subagent spawns were performed in this audit.

---

## 1. Inspected Commits, Branch Topology & Worktree State

All commit objects below were verified directly from the root Git object store in `/Users/admin/Desktop/HearIsland`:

| Ref / Role | Commit SHA | Summary & Relationship |
| :--- | :--- | :--- |
| **GitHub `origin/main`** | `3e461197f748cb62a6d6dfdabc7541307b41f82b` | Merge PR #4 (`InnovationCoach/codex/my-universe-prototype`). Live production Hosting release is recorded as `44b3abc` (rollback channel `pre-universe-20261101`). |
| **Prototype / Live-Safe Branch (PR #6)** | `f3dd3fb` (`origin/codex/my-universe-prototype`) | Open **PR #6** targets `main` from `codex/my-universe-prototype` (`f3dd3fb0bddd6fe67c65c50900d2cca81a813742`), containing `44b3abc` live-safe dashboard fixes and release documentation. |
| **Go 3 Emulator Packaging** | `ae6c3e7` → `3aad149` (`origin/feat/universe-backend-go3-emulator`) | Descends from `f3dd3fb`. Adds `functions/package.json` (with `dotenv`), `esbuild` bundle (`functions/dist/index.js`), `/api/**` Hosting rewrite in `firebase.json`, and Go 5 secret/env documentation in `GEMINI BACKEND.md`. |
| **Go 4 Backend Access & Review** | `4daca20` → `8eb6bca` (`origin/feat/universe-backend-go4-access`) | Branches from `3aad149`. Adds `server/lib/universe/missions.js`, `server/routes/universe.js`, `server/routes/coach-universe.js`, `missionSubmissions` Firestore rules (`allow write: if false`), and composite indexes in `firestore.indexes.json`. |
| **Frontend Go 4 Connect** | `96684f9` (`origin/feat/universe-frontend-go4-connect`) | Branches from `8eb6bca` (includes full Go 3 + Go 4 ancestry; separate branch from PR #6). Connects `src/features/universe/universeApi.js`, `MissionSheet.jsx`, `CoachUniverseSubmissions.jsx`, and `MyUniverseExplorer.jsx` to `/api/universe/*` and `/api/coach/universe/*`. |
| **Thalassa Workstations (PR #7)** | `b35f8b2` (`origin/feature/thalassa-workstations`) | Open **PR #7** (targets `codex/my-universe-prototype`); **diverges** from common ancestor `f3dd3fb` (pre-Go 3/Go 4). Upgrades catalog to `1.2.0` (workstations), adds `src/features/universe/missions/thalassaWindSurvey.js` (`thalassa-wind-survey`, `0.1.0-draft`, `guided` route only) and `hex-grid-thalassa` scenario (`src/features/activities/hexGrid/scenarios.js`), plus `docs/universe-missions/THALASSA-STATION-REVIEW.md`. |
| **Root Working Tree `HEAD`** | `0b6300f` (`codex/fix-dashboard-image-uploads`) | Older divergent branch with unrelated dirty changes. **Must not** be used as the implementation base. |
| **Saved Worktrees** | `output/my-universe/source`, `output/my-universe/thalassa-wt` | Contains broken `.git` gitdir pointers referencing a removed `/tmp/...` repository. Per instructions, these folders were **not** repaired or used; all inspections used root Git commit objects. |

### Recommended Integration Base for J02 / G03
- **Clean Integration Base:** Follow the `G01` integration sequence: align `main` (`3e461197f748cb62a6d6dfdabc7541307b41f82b`) through PR #6 (`f3dd3fb`), integrate the `Go 3` → `Go 4 backend` → `Go 4 frontend` (`96684f9`) chain and PR #7 (`b35f8b2`) once authorized, and run fresh verification suites on the combined candidate.

---

## 2. Actual Implemented State vs. Proposed Architecture Matrix

| Capability / Surface | Actual State in `96684f9` (Go 3 + Go 4 + Connect) | Actual State in `b35f8b2` (Workstations) | Proposed / Required for Pilot (`J02`/`J03`/`Go 5`) |
| :--- | :--- | :--- | :--- |
| **Cloud Functions Packaging (`functions/`)** | **Implemented in branch (historically checked in prior turn; not re-run in `J01`).** `functions/package.json` bundles `functions/index.js` + `server/**` into `functions/dist/index.js` via `esbuild`. Exports `createLearner` and `api` (`region: 'asia-southeast1'`). | Not present (`b35f8b2` predates Go 3). | **Keep `functions/dist/index.js` bundle**; verify isolated build with `/shared/universe/` in `J02` and add `defineSecret(...)` binding before `Go 5`. |
| **Hosting `/api/**` Rewrite (`firebase.json`)** | **Implemented in branch (`96684f9`).** Rewrites `/api/**` → Cloud Function `api`. | Not present. | **Release Gate:** Must **not** be deployed to live Hosting until the `api` function is deployed and healthy in production (`Go 5`). |
| **Server Mission Registry (`server/lib/universe/missions.js`)** | **Partial.** Only registers `spacecraft-journey` (`0.1.0-draft`, status `'draft'`). Maps `thalassa: public`, `ignis: public`, `boreas: mission-approved (spacecraft-journey)`. | Client adds `thalassa-wind-survey` (`0.1.0-draft`) in `src/features/universe/missions/thalassaWindSurvey.js`, but `server/lib/universe/missions.js` does not exist on `b35f8b2`. | **Required in J02:** Unify mission registry via a generated/shared release manifest covering `spacecraft-journey`, `thalassa-wind-survey`, and pilot missions with content hashes, version policies, and educator review status. |
| **Learner Submission & Access API (`server/routes/universe.js`)** | **Implemented with 4 contract gaps:** (1) query-then-create duplicate race; (2) `'org-welearn'` fallback; (3) version-blind access check; (4) no draft/saved-work state or withdrawal check. | Not present. | **Harden in J02:** Transactional deterministic lock doc + idempotency key, fail-closed `orgId`, version/policy-bound access check, and withdrawal guard. |
| **Coach Queue & Review API (`server/routes/coach-universe.js`)** | **Implemented with 3 contract gaps:** (1) coach class query/review omits `orgId` check; (2) admin `orgId` check falls back to `'org-welearn'` or skips if falsy; (3) `writeAuditLog` runs outside transaction. | Not present. | **Harden in J02:** Mandatory `orgId` match for all coach/teacher/admin queries and reviews; move `auditLogs` write inside `db.runTransaction()`. |
| **Client API Wrapper (`src/features/universe/universeApi.js`)** | **Implemented with error-collapsing bug:** `getMySubmissions()` and `getCoachSubmissions()` return `{ submissions: [] }` on `!headers`, `!res.ok`, or `catch`. | Offline stub only. | **Harden in J02/G03:** Return discriminated status (`{ ok, status, code, error, submissions }`) so UI distinguishes `unauthenticated`/`forbidden`/`unavailable` from empty data. |
| **Learner-State Rules (`users/{uid}/activityProgress/universe-v1`)** | **Proposed only (Not in `firestore.rules`).** `firestore.rules` L255–258 still has unrestricted `allow create, update, delete: if isOwner(userId);` on `activityProgress/{docId}`. | Client uses `localStorage` (`welearn.universe.v1` / `hexgrid`). | **Harden in J02:** Enforce strict schema, key whitelist (`schemaVersion === 1`), array bounds, and byte/string size caps for `activityProgress/universe-v1` (or `universeState/{docId}`) in `firestore.rules`. |
| **Submission Rules (`missionSubmissions/{id}`)** | **Implemented (`firestore.rules` L946–953) with tenancy gap:** `allow write: if false;` is enforced, but `allow read` allows `isAdminOrSupervisor()` and `isTeacher() && classIds.hasAny(...)` without checking `resource.data.orgId`. | Not present. | **Harden in J02:** Enforce `resource.data.orgId == myOrgId()` on coach and org-admin reads in `firestore.rules`. |
| **Editorial Draft & Approval Store (`adminUniverseDrafts`)** | **Not Implemented.** Currently missions are static JS files with manual `status: 'draft'`. | Static markdown review pack (`THALASSA-STATION-REVIEW.md`). | **Implement in J03:** Server-governed `adminUniverseDrafts` + immutable `universeReleases` manifest bound to `contentHash`, reviewer UID, and withdrawal status. |
| **Verified Activity Evidence Adapters (`ProjectHexGrid`, etc.)** | **Not Implemented.** Hex-Grid Thalassa checks challenges client-side in `ScenarioPanel.jsx` (`b35f8b2`), with no server-verifiable evidence record. | Client-only challenge check in `b35f8b2`. | **Implement in J02/J03:** Server-validated evidence submission/adapter recording `{ scenarioId, scenarioVersion, challengeIdsPassed, inputs, metrics, sourceHash }`. |

---

## 3. Detailed Audit of Specific Contract & Security Issues

### Issue 3.1 — Duplicate-Open-Submission Query-Then-Create Race
- **Actual Code (`96684f9:server/routes/universe.js` L53–92):**
  ```javascript
  const openSnap = await db.collection('missionSubmissions')
    .where('learnerUid', '==', learnerUid)
    .where('missionId', '==', missionId)
    .where('status', '==', 'submitted')
    .limit(1)
    .get();
  if (!openSnap.empty) {
    return sendError(res, 409, 'CONFLICT', 'You already have an open submission for this mission.');
  }
  ...
  const docRef = db.collection('missionSubmissions').doc();
  await docRef.set(submissionData);
  ```
- **Vulnerability / Failure Mode:** Because the query and the random-ID `.doc().set()` happen outside a transaction (and Firestore transactions cannot lock the absence of an arbitrary query result without a deterministic document reference), two rapid clicks, a network retry, or two open tabs will both read `openSnap.empty === true` and create two concurrent `'submitted'` documents for the same `(learnerUid, missionId)`.
- **Minimal Contract Correction (`J02`):**
  1. Introduce a deterministic server-only pointer/lock document at `missionSubmissionLocks/{learnerUid}__{missionId}` (or `users/{learnerUid}/universeMissionLocks/{missionId}`).
  2. Accept an optional `idempotencyKey` (string, `16..128` chars) in `POST /api/universe/missions/:missionId/submissions`.
  3. Execute submission creation inside `db.runTransaction(async (tx) => ...)`:
     - Read `lockRef` (`missionSubmissionLocks/{learnerUid}__{missionId}`).
     - If `lockDoc.exists` and `lockDoc.data().activeStatus === 'submitted'`:
       - If `idempotencyKey && lockDoc.data().idempotencyKey === idempotencyKey`, return the existing `activeSubmissionId` with HTTP `200 OK` (`idempotentReplay: true`).
       - Otherwise abort with HTTP `409 CONFLICT` (`OPEN_SUBMISSION_EXISTS`).
     - Create `missionSubmissions/{newSubmissionId}` (with `attemptNumber: (lockDoc.data()?.attemptCount || 0) + 1`, `previousSubmissionId: lockDoc.data()?.activeSubmissionId || null`) and update `lockRef` atomically in the same transaction.
  4. When a coach reviews a submission (`approved` or `returned`) in `POST /api/coach/universe/submissions/:id/review`, update `lockRef.activeStatus = decision` inside the same review transaction.

---

### Issue 3.2 — `org-welearn` Fallbacks and Missing-Organization Checks
- **Actual Code:**
  - `96684f9:server/middleware/auth.js` L39:
    ```javascript
    const orgId = decoded.orgId || userData.orgId || 'org-welearn';
    ```
  - `96684f9:server/routes/universe.js` L70–72:
    ```javascript
    const orgId = userDoc.exists && userDoc.data()?.orgId
      ? userDoc.data().orgId
      : (req.caller?.orgId || 'org-welearn');
    ```
  - `96684f9:server/routes/coach-universe.js` L47:
    ```javascript
    const orgId = caller.orgId || 'org-welearn';
    ```
  - `96684f9:server/routes/coach-universe.js` L141 (inside review transaction):
    ```javascript
    if (subData.orgId && caller.orgId && subData.orgId !== caller.orgId) {
    ```
- **Vulnerability / Failure Mode:**
  1. Any user or learner record missing `orgId` is silently assigned to `'org-welearn'`. A misconfigured external tenant user without an `orgId` claim/profile field is thus placed into the primary WeLearn organization (`'org-welearn'`).
  2. In `coach-universe.js` L141, if either `subData.orgId` or `caller.orgId` is missing/empty, `subData.orgId && caller.orgId` evaluates to `false` and the cross-organization check is bypassed completely.
- **Minimal Contract Correction (`J02`):**
  1. For all Universe endpoints (`/api/universe/*` and `/api/coach/universe/*`), **do not fall back to `'org-welearn'`**. Read `const explicitOrgId = decoded.orgId || userData.orgId || null;` and attach `req.caller.explicitOrgId` (or remove the `'org-welearn'` fallback once non-universe routes are verified).
  2. In `POST /api/universe/missions/:missionId/submissions`, require a non-empty `orgId` from the learner's verified profile/claims. If missing, fail closed with `403 FORBIDDEN` (`MISSING_ORG_SCOPE`).
  3. In `GET /api/coach/universe/submissions` and `POST /api/coach/universe/submissions/:id/review`, require `!caller.explicitOrgId || !subData.orgId || caller.explicitOrgId !== subData.orgId` to immediately fail closed with `403 FORBIDDEN` (`ORG_SCOPE_MISMATCH`), unless the caller holds an explicit platform super-admin claim (`caller.isPlatformAdmin === true`).

---

### Issue 3.3 — Coach Class Query & Review Must Also Enforce Organization
- **Actual Code (`96684f9:server/routes/coach-universe.js` L54–65 and L132–138):**
  - In `GET /api/coach/universe/submissions` (L58–64):
    ```javascript
    let q = db.collection('missionSubmissions');
    if (status) {
      q = q.where('status', '==', status);
    }
    return q.where('classIds', 'array-contains-any', chunk).get();
    ```
  - In `POST /api/coach/universe/submissions/:id/review` (L132–138):
    ```javascript
    if (!isAdmin) {
      if (!subClassIds.some(cid => coachClassIds.includes(cid))) {
        throw forbiddenErr;
      }
    }
    ```
  - In `96684f9:firestore.rules` (L948–952):
    ```javascript
    allow read: if isAuthenticated() && (
      request.auth.uid == resource.data.learnerUid ||
      isAdminOrSupervisor() ||
      (isTeacher() && resource.data.get('classIds', []).hasAny(myClassIds()))
    );
    ```
- **Vulnerability / Failure Mode:** Neither the coach list query, nor the coach review transaction, nor the `missionSubmissions` Firestore security rule checks `orgId` for coaches/teachers. If two organizations have colliding class IDs (e.g., `'class-101'` or `'default'`) or a stale class ID remains on a user profile across org boundaries, a coach in Org B can list, read, and approve/return submissions belonging to a learner in Org A.
- **Minimal Contract Correction (`J02`):**
  1. **Coach List Query (`GET /api/coach/universe/submissions`):** Include `.where('orgId', '==', caller.explicitOrgId)` in every chunk query alongside `.where('status', '==', status)` and `.where('classIds', 'array-contains-any', chunk)`, and verify `doc.data().orgId === caller.explicitOrgId` before returning.
  2. **Composite Index (`firestore.indexes.json`):** Update the composite index on `missionSubmissions` to `(orgId ASC, status ASC, classIds ARRAY_CONTAINS)`.
  3. **Coach Review Transaction (`POST /api/coach/universe/submissions/:id/review`):** Enforce `orgId` equality **first** for **all** roles (coaches, teachers, org admins, supervisors):
     ```javascript
     if (!caller.explicitOrgId || !subData.orgId || subData.orgId !== caller.explicitOrgId) {
       throw forbidden('Submission belongs to a different organization.');
     }
     if (!isAdmin && !subClassIds.some((cid) => coachClassIds.includes(cid))) {
       throw forbidden('You do not share a class with this learner.');
     }
     ```
  4. **Firestore Security Rules (`firestore.rules` L946–953):** Require `resource.data.orgId == userOrgId()` on both `isAdminOrSupervisor()` (unless `isPlatformAdmin()`) and `isTeacher()` reads.

---

### Issue 3.4 — Approved Mission IDs Ignore Task, Mission & Policy Versions
- **Actual Code (`96684f9:server/routes/universe.js` L157–180):**
  ```javascript
  const approvedSnap = await db.collection('missionSubmissions')
    .where('learnerUid', '==', learnerUid)
    .where('status', '==', 'approved')
    .get();

  const approvedMissionIds = new Set(approvedSnap.docs.map(doc => doc.data().missionId));
  ...
  const isApproved = approvedMissionIds.has(unlock.missionId);
  ```
- **Vulnerability / Failure Mode:**
  1. `POST /api/universe/access` collapses all approved submissions into `Set<missionId>`, completely ignoring `missionVersion`, `routeId`, `contentHash`, and `policyVersion`.
  2. If a draft mission (`0.1.0-draft`) was approved in testing or an older flawed version (`1.0.0`) was later withdrawn/superseded by a new educator-reviewed version (`2.0.0`), the old approval still permanently unlocks the destination.
  3. Conversely, when a mission undergoes a minor editorial fix (`1.0.0` → `1.0.1`), there is no policy specifying whether `1.0.0` approvals remain valid (`acceptedVersions: ['1.0.0', '1.0.1']` / `minAcceptedVersion: '1.0.0'`) or require re-completion.
- **Minimal Contract Correction (`J02`):**
  1. **Submission Binding:** Every `missionSubmissions` document must record immutable version metadata at submission time:
     - `missionId`, `missionVersion`, `routeId`, `missionContentHash` (SHA-256 of the published mission definition), `unlockPolicyVersion`, and `evidenceRefs` (array of verified activity/simulation run IDs if required by the mission).
  2. **Unlock Policy Specification (`server/lib/universe/missions.js` / release manifest):**
     ```javascript
     'boreas': {
       type: 'mission-approved',
        policyVersion: '1.1.0',
       requiredMissionId: '<agreed-mission-id>', // see Issue 3.8
       acceptedMissionVersions: ['1.0.0'], // or emulator draft version only when isEmulatorEnvironment()
       allowHistoricalApprovedVersions: true, // true for non-withdrawn prior reviewed versions
       withdrawnMissionVersions: [] // never accepted even if previously approved
     }
     ```
  3. **Access Route Evaluation (`POST /api/universe/access`):** Check that an approved submission matches:
     - `sub.missionId === unlock.requiredMissionId`
     - `!unlock.withdrawnMissionVersions.includes(sub.missionVersion)`
     - `unlock.acceptedMissionVersions.includes(sub.missionVersion)` (or `isEmulatorEnvironment() && process.env.ALLOW_DRAFT_MISSIONS === 'true'` for `-draft` versions)
     - Return `{ status, evaluatedRule, policyVersion, satisfiedBySubmissionId, satisfiedByVersion, isVerified }` in the response payload.

---

### Issue 3.5 — Audit Log Written After Review Transaction Commit Can Fail
- **Actual Code (`96684f9:server/routes/coach-universe.js` L110–175):**
  ```javascript
  await db.runTransaction(async (transaction) => {
    ...
    transaction.update(subRef, {
      status: decision,
      coachUid: caller.uid,
      coachNote: note ? note.trim() : null,
      reviewedAt: FieldValue.serverTimestamp()
    });
  });

  // Audit log via server/lib/audit.js written after transaction commits
  await writeAuditLog(db, { ... });
  ```
- **Vulnerability / Failure Mode:**
  1. `writeAuditLog` executes *after* `db.runTransaction` has already committed the status change (`approved` or `returned`).
  2. If `writeAuditLog` throws (e.g., transient Firestore error or invalid field), the submission is permanently mutated without any FERPA/COPPA audit record in `auditLogs`.
  3. Worse, the catch block returns HTTP `500 INTERNAL` to the coach UI, prompting the coach to click "Approve" again — which then fails with HTTP `409 CONFLICT` (`Submission has already been reviewed`).
- **Minimal Contract Correction (`J02`):**
  1. Add a transactional helper `writeAuditLogInTransaction(transaction, db, payload)` in `server/lib/audit.js` (or construct `const auditRef = db.collection('auditLogs').doc(); transaction.set(auditRef, auditRecord);` directly inside the review `db.runTransaction` callback).
  2. Both `missionSubmissions/{id}` (`transaction.update`), `missionSubmissionLocks/{learnerUid}__{missionId}` (`transaction.set/update`), and `auditLogs/{auditId}` (`transaction.set`) must commit or roll back as a single atomic Firestore transaction.
  3. Support idempotent review replay: if `subData.status === decision && subData.coachUid === caller.uid && (subData.coachNote || null) === (note ? note.trim() : null)`, return HTTP `200 OK` (`idempotentReplay: true`) instead of `409 CONFLICT`.

---

### Issue 3.6 — Client List APIs Collapse Errors and Auth Failures to Empty Arrays
- **Actual Code (`96684f9:src/features/universe/universeApi.js` L51–67 and L98–115):**
  ```javascript
  export async function getMySubmissions() {
    const headers = await getAuthHeader();
    if (!headers) return { submissions: [] };
    try {
      const res = await fetch(`${API_BASE}/api/universe/missions/submissions/mine`, { ... });
      if (!res.ok) return { submissions: [] };
      ...
    } catch (err) {
      return { submissions: [] };
    }
  }
  ```
  (Identical pattern in `getCoachSubmissions()` at L98–115.)
- **Vulnerability / Failure Mode:**
  1. When a learner or coach is signed out (`!headers`), has an expired token (`401`), lacks role/org permission (`403`), or hits an offline/500 backend (`500` or network error), `getMySubmissions()` and `getCoachSubmissions()` return `{ submissions: [] }` with no error flag.
  2. In `MissionSheet.jsx` (L94–104), a learner whose previous submission is already `'submitted'` or `'approved'` will see an empty textarea and an active "Send to my coach" button whenever `getMySubmissions()` fails transiently — causing confusing `409 CONFLICT` errors on submit.
  3. In `CoachUniverseSubmissions.jsx`, a coach whose session expired or whose backend is unreachable sees `"No mission reflections waiting for review"` instead of an error/retry banner.
- **Minimal Contract Correction (`J02` / `G03`):**
  1. Standardized client return envelope for `getMySubmissions()`, `getCoachSubmissions()`, and `checkPlanetAccess()`:
     ```ts
     type UniverseListResult<T> =
       | { ok: true; state: 'ready'; submissions: T[]; status: 200 }
       | { ok: false; state: 'unauthenticated' | 'forbidden' | 'unavailable'; submissions: []; status: number | null; code: string; message: string };
     ```
  2. `MissionSheet.jsx` and `CoachUniverseSubmissions.jsx` must render an explicit non-blocking status banner + Retry button when `ok === false`, and disable submission creation if the learner's existing submission state could not be verified (`state === 'unavailable'`).

---

### Issue 3.7 — Reflection UI Matches `missionId` Only & Discards Unsaved Work
- **Actual Code (`96684f9:src/features/universe/missions/MissionSheet.jsx` L30–145):**
  ```javascript
  const found = (res.submissions || []).find((s) => s.missionId === mission.id);
  ```
- **Vulnerability / Failure Mode:**
  1. **Ambiguous Matching:** `.find((s) => s.missionId === mission.id)` matches only `missionId`. If a learner has historical submissions across versions or routes, or multiple returned/resubmitted attempts, `.find()` relies solely on array ordering and ignores `missionVersion` and `route.id`. Furthermore, the `useEffect` dependency array is `[mission.id]`, so switching between `guided` and `advanced` routes does not re-evaluate route context, and there is no attempt history (`attemptNumber`, previous coach notes).
  2. **Lost Learner Work on Close/Refresh:** Numeric and multiple-choice step inputs (`StepCard` state: `value`, `result`, `hints`, `showSolution`) and unsent reflection drafts (`ReflectionSection` `value`) live solely in ephemeral React component state (`useState`). Closing the mission sheet, switching routes, or refreshing the page wipes all step progress and unsent reflection text.
- **Minimal Contract Correction (`J02` / `G03`):**
  1. **Submission Matching Rule:** Filter submissions for the active `mission.id` (and compatible `missionVersion`), sort deterministically by `attemptNumber DESC, createdAt DESC`, and select:
     - Active `'approved'` submission (if version-valid), else
     - Active `'submitted'` submission, else
     - Latest `'returned'` submission (preserving its `reflection` and `coachNote` as the starting point for revision, while exposing prior attempts in a collapsible revision history).
  2. **Saved-Work Recovery (`users/{uid}/activityProgress/universe-v1` + local cache):**
     - Persist in-progress mission step answers (`stepStates[stepId] = { value, status, hintsUsed }`) and unsent reflection draft (`reflectionDraft`, `updatedAt`) to bounded local storage keyed by `welearn.universe.missionDraft.v1.${uid || 'anon'}.${missionId}.${missionVersion}` and sync for signed-in learners to `users/{uid}/activityProgress/universe-v1` (debounced).
     - If a local draft is newer than the last `'returned'` submission's `reviewedAt`, restore the draft and offer a `"Restore last sent reflection"` toggle.

---

### Issue 3.8 — Missing `thalassa-wind-survey` in Server Registry & Boreas Unlock Requirement Mismatch
- **Actual Code:**
  - **Missing Mission on Server:** `b35f8b2` adds `THALASSA_WIND_SURVEY` (`id: 'thalassa-wind-survey'`, `version: '0.1.0-draft'`, `routes: ['guided']` — only the `guided` route exists in `b35f8b2`, `planetIds: ['thalassa']`, `locationId: 'weather-mast'`) to `src/features/universe/missions/thalassaWindSurvey.js` and `src/features/universe/missions/registry.js`. However, `96684f9:server/lib/universe/missions.js` only contains `'spacecraft-journey'`. Any attempt to submit `thalassa-wind-survey` to `POST /api/universe/missions/thalassa-wind-survey/submissions` in current code (`96684f9:server/routes/universe.js` L28–32) fails with `404 NOT_FOUND` (`Mission "thalassa-wind-survey" not found.`).
  - **Boreas Catalog vs. Server Unlock Disagreement:**
    - `public/cosmos/v1/catalog.json` (both `1.1.0` in `96684f9` and `1.2.0` in `b35f8b2`) defines Boreas with:
      - `"unlockRule": "complete-competency:ice-and-climate"`
      - `"requirementText": "Sample requirement: an Ice and Climate mission reviewed by your coach."`
    - `96684f9:server/lib/universe/missions.js` L27 defines:
      - `'boreas': { type: 'mission-approved', missionId: 'spacecraft-journey' }` (where `spacecraft-journey` is `"Plan a journey to Ignis"`, an interplanetary transit & propulsion mission on Thalassa/Ignis, **not** an Ice and Climate mission).
- **Minimal Contract Correction (`G02` / `O01` / `J02`):**
  1. **Server Registry Synchronization (`J02`):** Register `thalassa-wind-survey` (`routes: ['guided']`, `planetIds: ['thalassa']`, `locationId: 'weather-mast'`) from the shared `/shared/universe/` bundle imported by both client and server so client/server registries cannot drift.
  2. **Boreas Unlock Policy Gate (Explicit Decision Required from Mani / Educator Review via `O01`/`G02`):**
     - Per Contract `0.1.1` §1 & §9.7, the initial pilot outcome is **review-only (`type: "reviewed-only"`)** with no planet grant; Boreas remains gated (`boreas-policy-unresolved`) until Mani and educator review establish the final requirement and grant policy.

---

## 4. Learner-State Rules (`universe-v1`), Editorial Draft Store (`adminUniverseDrafts`) & Evidence Boundaries

### 4.1 Bounded Learner-State Rules (`users/{userId}/activityProgress/universe-v1`)
Currently `firestore.rules` L255–258 allows arbitrary owner writes to `activityProgress/{docId}`. Per Contract `0.1.1` §9.2 & §9.6, mission drafts belong in API-owned `missionDrafts` (not an owner-writable nested map in `universe-v1`), and `universe-v1` in `firestore.rules` must be restricted strictly to explorer bookmarks and preferences (accounting for any overlapping rules in `firestore.rules`):
- **Allowed Top-Level Keys Only (`hasOnly`):**
  `['schemaVersion', 'updatedAt', 'lastPlanetId', 'lastLocationId', 'visitedPlanetIds', 'visitedLocationIds']`
- **Field Bounds:**
  - `schemaVersion == 1` (`int`)
  - `updatedAt is timestamp`
  - `lastPlanetId` (`null` or `string` `<= 64` chars)
  - `lastLocationId` (`null` or `string` `<= 64` chars)
  - `visitedPlanetIds is list && visitedPlanetIds.size() <= 50`
  - `visitedLocationIds is list && visitedLocationIds.size() <= 200`
- **Explicit Prohibition:** No nested mission drafts, trusted completion flags, role claims, or entitlement fields are permitted in `universe-v1`. Client writes to `missionSubmissions/{id}` and `missionDrafts/{id}` remain `allow write: if false;`.

### 4.2 Editorial Draft Store (`adminUniverseDrafts`) & Release Pipeline (`J03`)
To replace ad-hoc code edits for educator review and mission publication:
1. **Firestore Collections:**
   - `adminUniverseDrafts/{draftId}`: Server-governed (or org/platform-admin + curriculum-reviewer scoped) draft documents containing `{ missionId, version, status: 'draft' | 'in_review' | 'approved_for_release' | 'withdrawn', content, contentHash, authorUid, updatedAt }`.
   - `universeReleases/{releaseId}`: Immutable published mission/catalog release records written **only** by the server (`allow write: if false` in `firestore.rules`, `allow read: if isAuthenticated()`), containing `{ releaseId, missionId, version, status: 'published' | 'withdrawn', contentHash, reviewerUid, reviewerSignOffAt, reviewNotes, unlockPolicyVersion, withdrawnAt, withdrawnReason }`.
2. **Content-Hash Approval Binding:**
   - Educator approval (`POST /api/admin/universe/drafts/:draftId/approve`) requires `{ expectedContentHash, reviewNotes }`. If the draft's computed SHA-256 `contentHash` does not match `expectedContentHash`, the approval is rejected with `409 CONFLICT` (`CONTENT_HASH_MISMATCH`).
   - Any subsequent edit to a draft creates a new version/hash and resets status to `'draft'`.
3. **Withdrawal Check at Start, Resume & Submit:**
   - If a mission version or release is marked `'withdrawn'`, `GET /api/universe/missions/:missionId/availability`, `POST /api/universe/missions/:missionId/submissions`, and `POST /api/universe/access` fail closed (`409 MISSION_WITHDRAWN`) with a structured reason so the UI preserves work while pausing new starts/resumes/submissions.

### 4.3 Evidence Boundaries (`hex-grid-thalassa` & Pilot Artifacts)
Per Contract `0.1.1` §9.6:
- Pilot artifacts (`text`, `table`, `choice`, `diagram`) are labeled learner evidence for **human coach review**.
- Client Hex-Grid challenge flags are not authoritative completion, and **no new workstation-verification service is required** to submit a mission explanation or table in the two-mission pilot.
- The server must **not** invent unreviewed metrics (`nightStorageHours`, `budgetUsed`, `ecologicalImpact`) or require exact `0.34` as an observed measurement; any future server-verified metric or automatically decisive result must be recomputed from bounded versioned inputs using the actual reviewed model, keeping model outputs distinct from measurements and human approval.

---

## 5. Publication Readiness, Go 5 Prerequisites & Emulator Verification Plan

### 5.1 Go 5 Production Prerequisites (Do Not Execute Until Mani's Explicit Go 5 Approval)
1. **Hosting Rewrite Safety Gate:**
   - `firebase.json` on `96684f9` rewrites `/api/**` to the `api` Cloud Function.
   - **Rule:** Never deploy `firebase.json` with the `/api/**` rewrite to live Hosting (`welearn-spark`) before the `api` Cloud Function is deployed, bound to secrets/env vars, and verified healthy in `asia-southeast1`. Note that Hosting preview channels **do not** isolate Cloud Functions (`firebase deploy --only functions` always targets the project's live Functions runtime).
2. **Secret Manager Inventory (Names Only — No Values Printed):**
   - Must be provisioned in Google Cloud Secret Manager and bound via `defineSecret(...)` on the `api` function before `Go 5`:
     1. `GEMINI_API_KEY`
     2. `PARENT_INVITE_SECRET`
     3. `CANVA_CLIENT_SECRET`
     4. `CANVA_TOKEN_KEY`
     5. `CLOUDINARY_API_SECRET`
     6. `CLOUDINARY_API_KEY`
3. **Non-Secret Runtime Environment Variables Inventory (Names Only):**
   - `FRONTEND_URL`, `GEMINI_MODEL`, `EMAIL_TRANSPORT`, `STORAGE_BUCKET`, `CLOUDINARY_CLOUD_NAME`, `CANVA_CLIENT_ID`, `CANVA_REDIRECT_URI`, `LTI_ISSUER`, `LTI_CLIENT_ID`, `LTI_DEPLOYMENT_ID`, `LTI_KEYSET_URL`, `LTI_AUTH_TOKEN_URL`, `LTI_AUTH_LOGIN_URL`, `EDMENTUM_API_BASE`, `EDMENTUM_KEY`, `EDMENTUM_SECRET` (move to Secret Manager if Edmentum integration is active).
4. **ADC Rule in Cloud Runtime:**
   - `GOOGLE_APPLICATION_CREDENTIALS` **must not** be set in Cloud Functions; `server/auth.js` must use Application Default Credentials (ADC) in the cloud runtime.
5. **Composite Indexes (`firestore.indexes.json`):**
   - Deploy `firestore.indexes.json` (updated with `(orgId ASC, status ASC, classIds ARRAY_CONTAINS)` and `(learnerUid ASC, status ASC)`) and wait for index state `READY` before routing traffic to `/api/coach/universe/submissions`.

### 5.2 Emulator Verification Plan for J02 & J03
All backend changes in `J02` and `J03` will be verified strictly against `demo-hearisland-rules` in the local Firebase Emulator Suite (`npm run test:rules`, `npm run test:api`, `npm run test:universe`, `npm run test:unit`, plus isolated `functions/dist/index.js` bundle load test):
1. **Concurrency & Retry Test:** Fire `2` simultaneous `POST /api/universe/missions/:missionId/submissions` requests for the same `(learnerUid, missionId)`:
   - With different/missing `idempotencyKey`: assert exactly one `201 Created` and one `409 CONFLICT` (`OPEN_SUBMISSION_EXISTS`), and exactly `1` open document in `missionSubmissions`.
   - With identical `idempotencyKey`: assert `201 Created` + `200 OK` (`idempotentReplay: true`) returning the same `submissionId`.
2. **Organization Isolation Test:**
   - Learner or coach missing `orgId` → `403 FORBIDDEN` (no silent `'org-welearn'` fallback).
   - Coach in `org-b` sharing class ID `'class-shared'` with a submission in `org-a` → `GET /api/coach/universe/submissions` returns `[]` and `POST /api/coach/universe/submissions/:id/review` returns `403 FORBIDDEN`.
   - Firestore rules test: teacher in `org-b` with `'class-shared'` denied direct `get`/`list` on `org-a` `missionSubmissions`.
3. **Version & Withdrawal Binding Test:**
   - Approval for `missionVersion: '0.1.0-draft'` or a withdrawn version `'1.0.0-withdrawn'` does **not** unlock `boreas` when active policy requires reviewed `'1.0.0'` (outside emulator draft flag).
4. **Transactional Audit Log Test:**
   - Verify `POST /api/coach/universe/submissions/:id/review` writes both the `missionSubmissions/{id}` status update, `missionSubmissionLocks` update, and `auditLogs/{logId}` inside a single transaction; simulate a failure inside the transaction and verify neither document is mutated.

---

## 6. Minimal Contract Requirements for `MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` & Next Owner Handoff

Because `/Users/admin/Desktop/HearIsland/docs/implementation/MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` is not yet written on disk, **Gemini 4 Argon** submits the following **8 mandatory backend & security clauses** for **GPT 6.1** to incorporate into `G02` (`MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md`):

1. **Deterministic Submission Lock & Idempotency (§3.1):** `missionSubmissionLocks/{learnerUid}__{missionId}` enforced inside `db.runTransaction()`, with optional client `idempotencyKey` and monotonic `attemptNumber`.
2. **Strict Organization Tenancy Without Default Fallback (§3.2, §3.3):** No `'org-welearn'` fallback on Universe APIs; mandatory `orgId` equality on learner submit, coach list query (`where('orgId', '==', caller.orgId)`), coach review transaction, and `firestore.rules` `missionSubmissions` read rules.
3. **Version-, Hash- & Policy-Bound Access Unlocks (§3.4):** `missionSubmissions` and `POST /api/universe/access` bind to `{ missionId, missionVersion, routeId, missionContentHash, unlockPolicyVersion }` and reject withdrawn versions.
4. **Atomic Review + Audit Transaction (§3.5):** Coach review state mutation, submission lock update, and `auditLogs` creation execute inside one `db.runTransaction()`, with idempotent replay support.
5. **Non-Collapsing Client API Envelope (§3.6):** `universeApi.js` returns discriminated `{ ok, state, status, code, message, submissions }` instead of collapsing auth/network/server errors to `{ submissions: [] }`.
6. **Deterministic Reflection Selection & Bounded `universe-v1` Draft Persistence (§3.7, §4.1):** Match submissions by `(missionId, compatibleVersion)` ordered by `attemptNumber DESC`; persist unsent step/reflection work in bounded `users/{uid}/activityProgress/universe-v1` (enforced in `firestore.rules` with `schemaVersion == 1`, strict key whitelist, and size limits) + local fallback.
7. **Unified Client/Server Mission Manifest & Boreas Unlock Resolution (§3.8):** Register `thalassa-wind-survey` and `spacecraft-journey` in a single shared manifest; resolve the Boreas `"Ice and Climate mission"` vs. `spacecraft-journey` mismatch explicitly in `G02` with **Opus 5.5 (`O01`)** and **Mani**.
8. **Server-Verified Workstation Evidence & Release Governance (§4.2, §4.3):** Server re-computes `hex-grid-thalassa` challenge metrics on submission; educator sign-off binds to SHA-256 `contentHash` in `universeReleases`.

### Next Owner Handoff
- **Next Owners:**
  1. **GPT 6.1 (`G01` / `G02`):** Incorporate the findings and 8 contract clauses above (along with **Claude Opus 5.5's `O01`** scientific/pedagogical audit) into `/Users/admin/Desktop/HearIsland/docs/implementation/MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md`.
  2. **Gemini 4 Argon (Ready for `J02`):** Once `MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` (`G02`) is published and accepted, Gemini 4 Argon will immediately execute `J02` (hardening `server/routes/universe.js`, `server/routes/coach-universe.js`, `server/lib/universe/missions.js`, `firestore.rules`, `firestore.indexes.json`, and emulator tests) on a clean branch from `3e461197f748cb62a6d6dfdabc7541307b41f82b`.

---

## 7. Review of `MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` (Revision `0.1.0-proposed`)

**Decision:** **Accepted with concrete backend/security refinements (`GB1`–`GB8` below, coordinated with Opus 5.5's `B1`–`B4` and `C1`–`C10` in `MY-UNIVERSE-OPUS55-O01-RESPONSE-2026-11-02.md` §12).**

**Reviewed Files:**
- `/Users/admin/Desktop/HearIsland/docs/implementation/MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` (`0.1.0-proposed`, 252 lines, authored by GPT/Codex)
- `/Users/admin/Desktop/HearIsland/docs/implementation/MY-UNIVERSE-G01-BASELINE-2026-11-02.md` (90 lines, authored by GPT/Codex)
- `/Users/admin/Desktop/HearIsland/docs/implementation/MY-UNIVERSE-OPUS55-O01-RESPONSE-2026-11-02.md` (§12 contract review by Claude Opus 5.5)

**Model Disclosure:** Reviewed by **Gemini 4 Argon** (selected by Mani). This review evaluates backend storage, API, transaction enforceability, error/version semantics, organization/direct-read security rules, idempotency, review/audit atomicity, withdrawal, and the review-only (`no-grant`) pilot policy. It does not claim educator sign-off or production release approval.

---

### 7.1 Section-by-Section Decision Matrix (`0.1.0-proposed`)

| Contract Section | Gemini 4 Argon Decision | Backend, Security & Packaging Assessment |
| :--- | :--- | :--- |
| **§1 Decisions and scope** | **Accept** | Single versioned content source (`shared/universe/`), full identity tuple (`releaseId`, `missionId`, `missionVersion`, `routeId`, `taskId`, `policyVersion`), preserving `0.1.0-draft` while proposing `0.2.0-draft`, and the conservative **`type: 'reviewed-only'`** pilot outcome (with Boreas kept locked as `boreas-policy-unresolved`) cleanly eliminate the `spacecraft-journey` → Boreas mismatch without inventing unapproved curriculum policy. |
| **§2 Mission and evidence definitions** | **Accept (with `GB1` / Opus `C1`)** | The shared mission schema (`schemaVersion: '1.0.0'`, `id`, `version`, `status`, `routes[]` with `taskId`, `challengeLevel`, `gradeBand`, `supportModes`) is clean and server-enforceable. Separating `routeId` (task identity) from `supportMode: 'guided' | 'independent'` works cleanly on the backend. |
| **§3 Typed notebook and submitted artifacts** | **Accept with `GB1` & `GB2` (aligns with Opus `B1`, `C2`)** | The 64 KiB request/document ceiling (`<= 65,536` UTF-8 bytes) and part limits (`<= 8` parts; bounded `text`, `table`, `choice`, `diagram`) fit comfortably inside Firestore's 1 MiB document limit and Express JSON body limits. Needs **`GB1`** (`anyOfKinds` for diagram-or-text equivalence + bounded `rawText` on numeric step answers) and **`GB2`** (`artifact-reference` explicitly disabled in the two-mission pilot). |
| **§4 States, identity and outcomes** | **Accept with `GB3` & `GB4` (aligns with Opus `B2`)** | Availability state machine (`open | in-review | withdrawn | retired | unknown`), immutable submission snapshots with `previousSubmissionId`, and `type: 'reviewed-only'` outcome envelope are fully enforceable. Needs **`GB3`** (exact Firestore key for the open-review lock slot) and **`GB4`** (shared-device local draft cache rule). |
| **§5 API contract and compatibility** | **Accept with `GB5`, `GB6`, `GB7` (aligns with Opus `B3`, `B4`, `C3`–`C5`)** | All 8 endpoints, `contractVersion: '1.0.0'`, fail-closed organization resolution (no `org-welearn` fallback), and `Idempotency-Key` (`16..128` ASCII chars) are accepted. Needs **`GB5`** (explicit coach queue item schema), **`GB6`** (`shared/universe/` packaging confirmation for esbuild + Vite/Vitest), and **`GB7`** (consistent HTTP `201` vs `200` replay rule, cursor pagination encoding, and `openSubmissionId` on `409`). |
| **§6 Errors, concurrency and durable review** | **Accept with `GB8`** | Error envelope (`contractVersion`, `code`, `message`, `retryable`, `requestId`, `field`), status table (`400`, `401`, `403`, `404`, `409`, `413`, `429/503`), and atomic transaction requirement are accepted. **`GB8`** locks down the exact Firestore transaction document set and direct-read security rules (`firestore.rules`). |
| **§7 Release compatibility and migration** | **Accept (with Opus `C6`)** | Immutable release manifest (`releaseId`, `schemaVersion`, hashes, capability version, `policyVersion`), read-only legacy reflection display (`legacyFormat: true`), and `shared/universe` packaging ownership are accepted. |
| **§8 Acceptance evidence and owner review** | **Accept (with Opus `C7`)** | All 13 acceptance cases plus Opus `C7` (shared-device account switch leaves zero cross-account draft/status/access residue) are accepted and mapped to emulator/API/rules test suites for `J02`. |

---

### 7.2 Blocking Refinements & Backend Commitments for `0.1.1` / `J02`

#### `GB1` (Resolves Opus `B1` & `C2`) — Alternative Required Parts (`anyOfKinds`) & Raw Numeric Answer Storage
1. **Alternative Required Parts (§3):** In `shared/universe` mission definitions, define `requiredParts` as an array of rules supporting either a single kind or an accessible equivalence group:
   ```json
   "requiredParts": [
     { "partId": "comparison-table", "anyOfKinds": ["table"] },
     { "partId": "route-plan", "anyOfKinds": ["diagram", "text"] },
     { "partId": "recommendation", "anyOfKinds": ["text"] }
   ]
   ```
   Both the frontend validator and `POST /api/universe/missions/:missionId/submissions` will run the same pure validator function from `shared/universe/validateArtifact.js` so a learner submitting a `text` route description in place of a `diagram` is validated identically on client and server.
2. **Bounded Raw Numeric Input (§3, Opus `C2`):** In `PUT /api/universe/missions/:missionId/draft`, step `answers[]` entries for `number` steps will store `{ stepId, kind: 'number', rawText: string (1..64 chars), value: number | null }` so unparsed intermediate strings (e.g., `"19,070"` or `"41.7 days"`) survive draft save/recovery without data loss.

#### `GB2` — `artifact-reference` Disabled for the Two-Mission Pilot (§3)
- Confirming per §3 L67 & L75: `artifact-reference` is **disabled (`enabled: false` in capability manifest)** for the `thalassa-wind-survey` and `spacecraft-journey` pilot. The server validator will reject `kind: 'artifact-reference'` with `400 VALIDATION_ERROR` (`field: 'evidence'`) until an explicit cross-service artifact permission check is contracted in a post-pilot phase.

#### `GB3` — Enforceable Firestore Transaction & Open-Review Slot Keying (§4, §6)
To guarantee one open submission per organization + learner + mission family without query-then-create races, Gemini 4 Argon will enforce the following deterministic Firestore collections (all `allow read, write: if false;` for direct client SDK access):
1. **Open-Review Slot Document:** `missionSubmissionLocks/{orgId}__{learnerUid}__{missionId}`
   - Holds `{ orgId, learnerUid, missionId, openSubmissionId: string | null, latestSubmissionId: string, latestRevision: number, status: 'submitted' | 'returned' | 'approved', updatedAt }`.
   - Because the document ID is keyed by `{orgId}__{learnerUid}__{missionId}` (without `missionVersion` or `routeId`), a single Firestore transaction atomically enforces the §4 rule: *"One open review per organization/learner/mission family, across versions and routes."*
2. **Idempotency Record Document:** `universeIdempotency/{orgId}__{callerUid}__{operation}__{idempotencyKey}`
   - Where `operation` is `draft_save`, `mission_submit`, or `coach_review`.
   - Stores `{ requestHash (SHA-256 of canonical body), statusCode, responseBody, createdAt, expiresAt }`.
   - Inside `db.runTransaction()`:
     - If the idempotency doc exists and `requestHash` matches: return the stored `responseBody` with **`HTTP 200 OK`** (`idempotentReplay: true`) for replays (while fresh submission creation returns **`HTTP 201 Created`**).
     - If the idempotency doc exists and `requestHash` differs: abort with **`HTTP 409 IDEMPOTENCY_KEY_REUSED`**.
3. **Atomic Submission Transaction (`POST /api/universe/missions/:missionId/submissions`):**
   - Single `db.runTransaction()` reads: `universeIdempotencyRef`, `missionSubmissionLocksRef`, and (if `previousSubmissionId` is supplied) `previousSubmissionRef`.
   - Verifies current task availability (`open`, or `in-review` only when `isEmulatorEnvironment() && process.env.ALLOW_DRAFT_MISSIONS === 'true'`).
   - If `lockDoc.exists && lockDoc.data().status === 'submitted'`, aborts with `409 SUBMISSION_ALREADY_OPEN` and includes `openSubmissionId: lockDoc.data().openSubmissionId` in the error details (satisfying Opus `C4`).
   - Atomically writes: `missionSubmissions/{submissionId}` (`submissionRevision: nextRev`), `missionSubmissionLocks/{orgId}__{learnerUid}__{missionId}`, `universeIdempotency/{...}`, and `auditLogs/{auditEventId}` (`action: 'universe.mission.submitted'`).
4. **Atomic Review Transaction (`POST /api/coach/universe/submissions/:id/review`):**
   - Single `db.runTransaction()` reads: `universeIdempotencyRef`, `missionSubmissions/{id}`, and `missionSubmissionLocks/{orgId}__{learnerUid}__{missionId}`.
   - Verifies:
     1. `caller.explicitOrgId` exists and `subData.orgId === caller.explicitOrgId` (mandatory for all roles).
     2. For coaches/teachers (`!isAdmin`): `subData.classIds` shares at least one current class with `caller.classIds`.
     3. `subData.submissionRevision === expectedSubmissionRevision`.
     4. If `subData.status !== 'submitted'`: if not already handled by idempotency key, abort with `409 REVIEW_CONFLICT`.
   - Atomically updates `missionSubmissions/{id}` (`status: decision`, `coachUid`, `coachNote`, `reviewedAt`, `outcome`, `auditEventId`), updates `missionSubmissionLocks` (`openSubmissionId: null`, `status: decision`), writes `universeIdempotency/{...}`, and writes `auditLogs/{auditEventId}` (`action: 'universe.mission.approved' | 'universe.mission.returned'`).

#### `GB4` (Resolves Opus `B2` & `C7`) — Server Draft Persistence & Shared-Device Local Cache Policy (§4, §6)
1. **Server Draft Document:** `missionDrafts/{orgId}__{learnerUid}__{releaseId}__{missionId}__{missionVersion}__{routeId}`
   - Managed via `GET /api/universe/missions/:missionId/draft` and `PUT /api/universe/missions/:missionId/draft` with optimistic concurrency (`expectedRevision`: `0` creates `revision: 1`; mismatch returns `409 DRAFT_CONFLICT` along with `{ currentDraft }` so the UI can offer recovery/merge/copy without silent overwrite).
   - Also keep `users/{userId}/activityProgress/universe-v1` strictly bounded in `firestore.rules` (as specified in §4.1 above) for lightweight explorer bookmark state (`lastPlanetId`, `visitedPlanetIds`, `visitedLocationIds`).
2. **Shared-Device Browser Cache Rule (Opus `B2` / `C7`):**
   - Local recovery in `localStorage` is permitted **only** for authenticated non-anonymous users under a strictly scoped key:
     `welearn.universe.draft.v1:${orgId}:${uid}:${releaseId}:${missionId}:${missionVersion}:${routeId}`
   - Maximum serialized size: `64 KiB` per draft, at most `6` cached drafts per browser profile.
   - **Shared-Device Guard (GEMINI BACKEND §3.2):** On sign-out (`auth.signOut()`) or whenever `onAuthStateChanged` detects a different `uid` (or `null`), all `welearn.universe.draft.v1:*` keys for any other `uid` (or all universe draft keys on sign-out) must be purged from `localStorage` and in-memory state. Unauthenticated or anonymous sessions keep unsaved work in memory only and never read/write `localStorage`.

#### `GB5` (Resolves Opus `B3` & `C3`) — Coach Queue Item & Learner History Item Schema (§5)
Every item in `GET /api/coach/universe/submissions` and `GET /api/universe/missions/submissions/mine` will return the following complete, bounded shape (so the coach and learner UIs have all required context without N+1 queries):
```json
{
  "submissionId": "sub_01J...",
  "submissionRevision": 2,
  "previousSubmissionId": "sub_01H...",
  "releaseId": "pilot-fixture-20261102",
  "missionId": "thalassa-wind-survey",
  "missionTitle": "Is the wind worth it?",
  "missionVersion": "0.2.0-draft",
  "routeId": "guided",
  "taskId": "wind-capacity-factor",
  "supportMode": "guided",
  "policyVersion": "pilot-review-only-0.1.0-draft",
  "learnerUid": "uid_student_1",
  "learnerDisplayName": "Alex Rivera",
  "orgId": "org-school-a",
  "classIds": ["class-6a"],
  "status": "submitted",
  "reflection": "The daily estimate supports a comparison, but it cannot prove night-time reliability.",
  "evidence": [
    {
      "partId": "limitation",
      "kind": "text",
      "text": "The input is one synthetic week; hourly timing is not represented."
    }
  ],
  "previousCoachNote": "Check whether the 168-hour table tells you what happens at night.",
  "coachUid": null,
  "coachNote": null,
  "createdAt": "2026-11-02T03:00:00.000Z",
  "reviewedAt": null,
  "availability": {
    "status": "in-review",
    "canStart": true,
    "canResume": true,
    "canSubmit": true,
    "reasonCode": null,
    "reason": null,
    "availabilityRevision": 1,
    "checkedAt": "2026-11-02T03:05:00.000Z"
  },
  "outcome": null,
  "legacyFormat": false
}
```
- Note: `previousCoachNote` is copied from `previousSubmissionId` inside the submission creation transaction so the coach queue item displays prior feedback immediately without an extra document read.

#### `GB6` (Resolves Opus `B4` & `C6`) — `shared/universe/` Packaging & Build Verification (§1, §7)
Gemini 4 Argon confirms that placing the canonical mission bundle, release manifest, capability record (`C6`), and pure schema/artifact validators under **`/shared/universe/`** at the repository root is 100% compatible with both build pipelines:
1. **Cloud Functions (`functions/package.json`):** `esbuild index.js --bundle --platform=node --target=node20 --format=esm --outfile=dist/index.js --packages=external` bundles all relative imports (`../server/...` and `../../shared/universe/...`) directly into `functions/dist/index.js`. As long as `/shared/universe/` uses pure ESM/JSON with no external npm imports, the isolated `functions/` deployment bundle remains completely self-contained.
2. **Vite & Vitest (`vite.config.js`, `tests/universe-preview/vite.config.js`, `tests/universe-preview/vitest.config.js`):**
   - Repo root is already the main Vite root (`import ... from '/shared/universe/...'` or relative `../../../shared/universe/...`).
   - For `tests/universe-preview/vite.config.js` and `tests/universe-preview/vitest.config.js` (where `root` is `tests/universe-preview`), Gemini 4 Argon will add `server: { fs: { allow: ['../..'] } }` and path alias `'@shared/universe': path.resolve(__dirname, '../../shared/universe')` in `J02` while resolving the `vitest.config.js` three-way merge identified in `G01` L56.
3. **Preview Fixture Isolation:** Release manifests with `releaseId` starting with `pilot-fixture-` or status `'in-review'`/`'draft'` are rejected in production by `server/lib/universe/missions.js` unless `isEmulatorEnvironment() && process.env.ALLOW_DRAFT_MISSIONS === 'true'`.

#### `GB7` (Resolves Opus `C4` & `C5`) — Error Details on `SUBMISSION_ALREADY_OPEN`, Batch Availability & Pagination Cursors (§5, §6)
1. **Error Details Field (`C4`):** Add optional `"details": object | null` to the §6 error envelope:
   ```json
   {
     "contractVersion": "1.0.0",
     "error": {
       "code": "SUBMISSION_ALREADY_OPEN",
       "message": "You already have a submission waiting for coach review for this mission.",
       "retryable": false,
       "requestId": "req_123",
       "field": null,
       "details": {
         "openSubmissionId": "sub_01J...",
         "missionVersion": "0.2.0-draft",
         "routeId": "guided"
       }
     }
   }
   ```
2. **Availability Endpoint (`C5`):** Support both single-task `GET /api/universe/missions/:missionId/availability?releaseId=...&missionVersion=...&routeId=...` and optional batch `POST /api/universe/missions/availability` (accepting up to 25 `{ releaseId, missionId, missionVersion, routeId }` tuples) so workstation lists never need N+1 calls as stations grow.
3. **Pagination Cursor Format (§5):** `GET /api/universe/missions/submissions/mine` and `GET /api/coach/universe/submissions` return `{ contractVersion: "1.0.0", submissions: [...], nextCursor: string | null }`, where `nextCursor` is a base64url-encoded JSON token `{ t: createdAtMillis, id: docId }` using deterministic ordering `.orderBy('createdAt', 'desc').orderBy(FieldPath.documentId(), 'desc')`.

#### `GB8` — Direct Firestore Read Rules vs. API Authority (`firestore.rules` & `firestore.indexes.json`)
1. **Direct-Read Lockdown (`G01` L68, Contract §5 L112):**
   - Neither the student explorer (`MissionSheet.jsx`) nor the coach queue (`CoachUniverseSubmissions.jsx`) queries `missionSubmissions` via the client Firestore SDK; all reads go through `/api/universe/*` and `/api/coach/universe/*`.
   - However, to ensure no client SDK call can ever bypass API organization/class/field rules, `firestore.rules` in `J02` will:
     - Set `allow read, write: if false;` on `missionSubmissionLocks/{lockId}`, `universeIdempotency/{keyId}`, and `missionDrafts/{draftId}` (100% Admin-SDK/API-mediated).
     - On `missionSubmissions/{submissionId}`, retain `allow write: if false;` and tighten `allow read` so every branch requires explicit non-empty organization equality (`resource.data.orgId is string && resource.data.orgId == userOrgId()`):
       ```javascript
       match /missionSubmissions/{submissionId} {
         allow write: if false;
         allow read: if isAuthenticated()
           && resource.data.orgId is string
           && resource.data.orgId == userOrgId()
           && (
             request.auth.uid == resource.data.learnerUid
             || isAdminOrSupervisor()
             || (isTeacher() && resource.data.get('classIds', []).hasAny(myClassIds()))
           );
       }
       ```
2. **Required Composite Indexes (`firestore.indexes.json` in `J02`):**
   - `missionSubmissions`: `(orgId ASC, learnerUid ASC, createdAt DESC, __name__ DESC)`
   - `missionSubmissions`: `(orgId ASC, learnerUid ASC, missionId ASC, createdAt DESC, __name__ DESC)`
   - `missionSubmissions`: `(orgId ASC, status ASC, classIds ARRAY_CONTAINS, createdAt DESC, __name__ DESC)`
   - `missionSubmissions`: `(orgId ASC, status ASC, createdAt DESC, __name__ DESC)`

---

### 7.3 Summary of Next Actions

1. **GPT 6.1 (`G02` `0.1.1` Contract Freeze):** Fold Opus 5.5's `B1–B4` / `C1–C10` and Gemini 4 Argon's matching `GB1–GB8` refinements into `MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` (`0.1.1`).
2. **Gemini 4 Argon (`J02` Execution upon Writer Turn Assignment):**
   - Create clean integration branch from `origin/main` (`3e461197f748cb62a6d6dfdabc7541307b41f82b`) incorporating the `96684f9` and `b35f8b2` backend/config prerequisites.
   - Add `/shared/universe/` packaging & validators (`GB1`, `GB6`) and resolve `tests/universe-preview/vitest.config.js`.
   - Implement `contractVersion: "1.0.0"` endpoints (`availability`, `draft` GET/PUT, `submissions` POST/mine, coach `submissions` GET/review, `access` POST) with atomic Firestore transactions (`GB3`, `GB5`, `GB7`), strict organization enforcement (no `org-welearn` fallback), and tightened `firestore.rules` + `firestore.indexes.json` (`GB8`).
   - Run full emulator verification (`test:rules`, `test:api`, `test:universe`, `test:unit`, and isolated `functions/dist/index.js` bundle check).

---

## 8. Final Owner Confirmation of Contract Revision `0.1.1` (`ACCEPT`)

**Decision:** **`ACCEPT`** (zero unresolved technical blockers).

**Reviewed Documents:**
- `/Users/admin/Desktop/HearIsland/docs/implementation/MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` (Revision `0.1.1`, §§1–9, lines 1–348)
- `/Users/admin/Desktop/HearIsland/docs/implementation/MY-UNIVERSE-G02-REVIEW-2026-11-02.md` (`G02` owner review and resolution record, lines 1–50)

**Author / Actual Model:** **Gemini 4 Argon** (selected by Mani; reported truthfully).  
**Scope:** Final technical interface agreement on contract revision `0.1.1` only. No `J02` implementation, branch creation, source edits, builds, test runs, or deployments were performed in this turn.

---

### 8.1 Explicit Confirmation of `0.1.1` (§9) & `G02` Review Record Corrections

1. **Numeric Draft Answers (`rawText` `0..64` Characters & Server Parsing — §9.1, Review #1):**
   - **Confirmed.** Numeric draft answers (`{ stepId, kind: "number", rawText, value }`) allow `rawText` of **`0..64` characters** so a cleared input field saves cleanly with `rawText: ""` and `value: null` while preserving unit/comma-formatted strings during editing. The server parses `rawText` itself and never trusts a client-supplied numeric `value`.
2. **Collision-Safe Hashed Canonical Tuple Document Keys (§9.6, Review #2):**
   - **Confirmed.** Server-only collections (`missionSubmissionLocks`, `universeIdempotency`, `missionDrafts` — all `allow read, write: if false;` in `firestore.rules`) supersede the earlier `__` concatenation proposal in §7.2 and use **SHA-256 hex digests of canonical JSON array tuples**:
     - Open slot (`missionSubmissionLocks`): `sha256(JSON.stringify([orgId, learnerUid, missionId]))`
     - Idempotency (`universeIdempotency`): `sha256(JSON.stringify([orgId, callerUid, operation, idempotencyKey]))`
     - Draft (`missionDrafts`): `sha256(JSON.stringify([orgId, learnerUid, releaseId, missionId, missionVersion, routeId, taskId, policyVersion]))`
3. **Exact `seconds`/`nanoseconds` Timestamp Pagination (§9.5, Review #3):**
   - **Confirmed.** Pagination cursors supersede the millisecond token in §7.2 `GB7` and carry base64url-encoded `{ seconds, nanoseconds, docId, filterHash }` ordered by `(createdAt DESC, __name__ DESC)`. Timestamps are **never truncated to milliseconds** (preventing skipped same-millisecond records). Every paged request validates cursor types/precision, re-applies caller organization/role/class scope and filters, and performs bounded merging across coach class-query chunks (no unbounded fetch-all/sort).
4. **Distinct `attemptNumber` vs. `submissionRevision` Counters (§9.3, Review #4):**
   - **Confirmed.**
     - `attemptNumber`: family-level attempt counter across submissions for `[orgId, learnerUid, missionId]` (increments when a new submission or resubmission after `returned` is created).
     - `submissionRevision`: per-document revision counter starting at `1` on creation and advancing on review (`expectedSubmissionRevision` governs review concurrency).
   - Every coach queue and learner history item also includes `missionContentHash`, `Cache-Control: private, no-store`, and an org-scoped `learnerDisplayName` (never falling back to an email address).
5. **Endpoint-Bound Idempotency & Current Authorization Enforcement (§9.5, §9.6, Review #5):**
   - **Confirmed.**
     - The idempotency hash covers the normalized request body (without normalizing away raw learner input) **plus HTTP method, endpoint target path, organization, caller UID, and `contractVersion`**.
     - GET requests advertise `X-Universe-Contract-Version: 1.0.0`; mutation headers (if sent) must match body `contractVersion`.
     - Replays always re-verify **current** caller authentication, organization, and role/class scope before returning stored results, and refresh current review/availability state as specified in §5.
     - All roles require explicit matching `orgId` (strictly distinguished from the middleware's `'org-welearn'` default fallback); coaches/teachers additionally require current class overlap; **self-review (`caller.uid === subData.learnerUid`) and any new platform-admin cross-org bypass are strictly forbidden.**
     - Foreign or unauthorized IDs never leak `openSubmissionId` in `SUBMISSION_ALREADY_OPEN` error details.
6. **Account + Organization Cache Clearing & School-Policy Memory-Only Rule (§9.2, §9.7, Review #2):**
   - **Confirmed.**
     - On sign-out, account switch, **or organization switch**, the client synchronously clears old learner work/status/access from UI and memory, cancels/ignores in-flight responses from the prior context, and purges other-context `welearn.universe.draft.v1:` keys. Cached work is never loaded before authentication and organization context resolve.
     - Where existing school/shared-device policy prohibits persistent local storage — and always for anonymous, unauthenticated, fixture-preview, and public live explorer sessions — the app uses **memory-only** state and truthfully labels unsaved work as not recoverable after reload.
     - Server-owned `missionDrafts` is the authoritative cross-device draft store. `users/{uid}/activityProgress/universe-v1` is restricted strictly to explorer bookmarks/preferences (no nested mission drafts, completion, role, or entitlement fields), and direct reads on `missionSubmissions` must either enforce equivalent current org/class/field scope or be denied entirely (`allow read, write: if false;`) so raw-document reads can never expose broader fields than the API.
7. **Ownership Boundaries, Packaging Verification Scope & Evidence Boundaries (§9.4, §9.6, Review #6 & #7):**
   - **Confirmed.**
     - **GPT** owns shared content, schemas, `releaseManifest.json`, `capabilities.json`, and pure validators in `shared/universe/`.
     - **Gemini 4 Argon** owns packaging/configuration (`functions/`, Vite/Vitest configs) and server adapters.
     - **Opus 5.5** owns frontend/renderer integration and verifies `capabilities.json` against compiled renderers.
     - Fixture releases use separate preview/emulator entry imports and never enter the production import graph (not guarded by string prefix checks alone).
     - **Build Verification Note:** Packaging acceptance in `J01` is a source-level feasibility check only, **not** a measured build result. Actual Vite, preview, Vitest, and isolated `functions/dist/index.js` builds without a parent checkout remain future verification evidence required in `J02`.
     - **Human-Reviewed Evidence Boundary:** Pilot artifacts are labeled learner evidence for human coach review; no new workstation-verification service or invented Hex-Grid metrics (`nightStorageHours`, `budgetUsed`, `ecologicalImpact`, or exact `0.34` as an observed measurement) are required or assumed.
8. **Factual Corrections Incorporated from `G02` Review Record Item 8:**
   - **Confirmed and corrected in §§1, 2, 3.8, 4.1, and 4.3 above:**
     1. GitHub **PR #6** is `codex/my-universe-prototype` (`f3dd3fb`) → `main` (prototype-to-main alignment), whereas `96684f9` is `origin/feat/universe-frontend-go4-connect` (and **PR #7** is `b35f8b2` → `codex/my-universe-prototype`).
     2. In current server code (`96684f9:server/routes/universe.js` L28–32), submitting an unregistered mission (`thalassa-wind-survey`) returns **`404 NOT_FOUND`**, not `400 VALIDATION_ERROR`.
     3. In `b35f8b2:src/features/universe/missions/thalassaWindSurvey.js`, `thalassa-wind-survey` (`0.1.0-draft`) defines **only the `guided` route** (`routes: [{ id: 'guided', ... }]`), not `['guided', 'advanced']`.
     4. Earlier emulator/bundle checks from prior turns are historical context only and are not reported as fresh `J01` test or build runs.


