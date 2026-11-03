# My Universe J02 Backend & Platform Implementation Response (2026-11-02)

- **Owner / Model:** Gemini 4 Argon (actual runtime model; reported truthfully rather than the historical `5.8` filename label)
- **Writer Checkout:** `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-backend`
- **Branch:** `codex/universe-pilot-backend`
- **Starting Base Commit (`HEAD` at handoff):** `e6e80853f6b1746b5e490401531ea5649f483b8c`
- **Final Implementation Commit (`HEAD`):** `332af11710eb87948dab851357f92ae5f6877ecc` (amended with this line)
- **Contract Revision Implemented:** `0.1.1` (`API_CONTRACT_VERSION = "1.0.0"`, `bundleContentSha256 = "974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7"`)
- **Status:** **COMPLETE — Ready for Final G04/J02 Acceptance**

---

## 1. Setup Turn Attribution Clarification

During the earlier bounded J02 setup turn on `/private/tmp/my-universe-pilot-20261102`:
- I resolved and wrote the merged content of `tests/universe-preview/vitest.config.js` (preserving both `tests/universe-preview/**/*.test.js` and `tests/universe-*.test.js` along with `environment: 'jsdom'`).
- Because my unsandboxed `git add` command awaited interactive approval, Opus completed the `git add` staging and baseline merge commit (`c709ddb5d0407360731b79a9d7da3379a7aaae45`).

---

## 2. Summary of J02 Implementation (`Contract 0.1.1`)

All backend, security-rules, composite-index, and Cloud Functions packaging obligations from `MY-UNIVERSE-O02-J02-IMPLEMENTATION-2026-11-02.md`, `MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` (revision `0.1.1`), `MY-UNIVERSE-G04-RULES-AUDIT-2026-11-02.json` (Findings 1–3), and `MY-UNIVERSE-G04-TECHNICAL-REVIEW-2026-11-02.md` (Findings **B1–B6**) are implemented and verified:

1. **Shared Validator & Integrity Binding (`server/lib/universe/missions.js`, `server/app.js`):**
   - Consumes GPT-owned `shared/universe/index.js` directly without forking validators (`API_CONTRACT_VERSION`, `CAPABILITIES`, `PUBLISHED_RELEASES`, `MAX_REQUEST_BYTES`, `canonicalStringify`, `getBundleHashInputs`, `resolveTask`, `validateDraft`, `validateSubmission`, `validateReview`).
   - `verifyBundleIntegrity(bundle)` verifies all 7 canonical SHA-256 digests (`sorted-key-json-ecmascript-v1`), `contractRevision: "0.1.1"`, `apiContractVersion: "1.0.0"`, capability allowlists, and `artifactReferenceEnabled === false` at startup.
   - Collision-safe SHA-256 canonical JSON tuple keys (`hashCanonicalTuple`) are used for:
     - Open review slots (`missionSubmissionLocks/{sha256([orgId, learnerUid, missionId])}`)
     - Versioned drafts (`missionDrafts/{sha256([orgId, learnerUid, releaseId, missionId, missionVersion, routeId, taskId, policyVersion])}`)
     - Endpoint-bound idempotency (`universeIdempotency/{sha256([orgId, callerUid, operation, idempotencyKey])}`)
     - Runtime task availability overrides (`universeTaskStatus/{sha256(["task-status", releaseId, missionId, missionVersion, routeId, taskId, policyVersion])}`)
2. **Transport Guard, Headers & Error Envelope (`server/lib/universe/http.js`):**
   - Every Universe and coach-universe response sets `Cache-Control: private, no-store`, `X-Universe-Contract-Version: 1.0.0`, and `X-Request-Id`.
   - Enforces the 64 KiB (`65,536` UTF-8 bytes) incoming request limit (`413 PAYLOAD_TOO_LARGE`), `contractVersion: "1.0.0"`, and `Idempotency-Key` (`^[A-Za-z0-9._:-]{16,128}$`) on all mutating endpoints.
3. **Learner & Coach Endpoints (`server/routes/universe.js`, `server/routes/coach-universe.js`, `server/lib/universe/cursor.js`):**
   - `GET /api/universe/missions/:missionId/availability`: Evaluates live task availability (`open`, `in-review`, `withdrawn`, `retired`, `unknown`) from the verified registry and `universeTaskStatus` overrides.
   - `GET /api/universe/missions/:missionId/draft` & `PUT /api/universe/missions/:missionId/draft`: Version-bound draft load and optimistic-concurrency save (`expectedRevision` -> `revision + 1`, `409 DRAFT_CONFLICT`), preserving `rawText` (`0..64` chars) and recomputing numeric `value` via `shared/universe`. Transparently serializes table `rows: string[][]` into Firestore-compatible row objects (`rows: Array<{ cells: string[] }>`) on write and restores `rows: string[][]` on read.
   - `POST /api/universe/missions/:missionId/submissions`: Single Firestore transaction enforcing live availability, 1 open submission per `[orgId, learnerUid, missionId]` via `missionSubmissionLocks`, strict `previousSubmissionId` verification, distinct `attemptNumber` vs `submissionRevision: 1`, atomic `auditLogs` creation (`universe.mission.submitted`), and endpoint-bound idempotency.
   - `GET /api/universe/missions/submissions/mine` & `GET /api/coach/universe/submissions`: Deterministic `[createdAt DESC, __name__ DESC]` ordering with `{seconds, nanoseconds, docId, filterHash}` cursors (`400 INVALID_CURSOR` on filter mismatch/tampering) and read-only `legacyFormat: true` compatibility for historical `0.1.0-draft` records.
   - `POST /api/coach/universe/submissions/:id/review`: Single Firestore transaction enforcing live coach org/class/learner roster authority, `status === 'submitted'`, `expectedSubmissionRevision === currentRevision` (`409 REVIEW_CONFLICT`), atomic lock release, atomic `auditLogs` creation (`universe.mission.approved` / `universe.mission.returned`), and `reviewed-only` zero-grant outcomes (`grantIds: []`, no XP/badges/currency).
   - `POST /api/universe/access`: Server-authoritative destination access returning `available` for `thalassa` and `ignis`, `locked` (`boreas-policy-unresolved`) for `boreas`, and `locked` (`unknown-destination`) for any unlisted planet ID.

---

## 3. Closure of G04 Technical Review Findings (`B1–B6`) & Rules Audit Findings (`1–3`)

### Finding B1 — Live Server-Stored Authority on Every Request & Idempotent Replay
- **Fix (`server/lib/universe/auth.js`, `server/routes/universe.js`, `server/routes/coach-universe.js`):**
  - `resolveUniverseCaller()` re-reads live server-stored authority on **every** request via `getAuth().getUser(uid)` (`userRecord.customClaims`) and `db.collection('universeMemberships').doc(uid).get()`.
  - Never trusts decoded JWT claims alone and never falls back to client-writable `users/{uid}` fields for `role`, `orgId`, or `classIds`.
  - If a valid unexpired JWT carries claims that no longer match current server-stored authority (or if both `userRecord.customClaims` and `universeMemberships/{uid}` lack authority), the request fails closed with `403 FORBIDDEN` (`ORG_CONTEXT_REQUIRED` / `FORBIDDEN`).
  - Idempotent replays in `PUT /draft`, `POST /submissions`, and `POST /review` execute after `requireUniverseAuth` and re-verify live org, learner, and class membership inside the transaction before returning any replay payload.

### Finding B2 — Fail-Closed Class Authority & Roster Verification
- **Fix (`server/lib/universe/auth.js`, `server/routes/coach-universe.js`):**
  - Every `classId` in a learner's or coach's authority set is fetched from `classes/{classId}`.
  - Missing, deleted, wrong-org (`classData.orgId !== authoritativeOrgId`), or malformed (`!Array.isArray(classData.coachIds)` or `!Array.isArray(classData.learnerIds)`) class documents fail closed (`403 FORBIDDEN`).
  - Coaches must be present in `classData.coachIds` and learners must be present in `classData.learnerIds`. In `GET /api/coach/universe/submissions` and `POST /api/coach/universe/submissions/:id/review`, the server also verifies that the submission's learner is currently enrolled in the shared `classes/{classId}` roster.

### Finding B3 — Strict `isEmulatorEnvironment()` & Fixture Isolation
- **Fix (`server/lib/universe/missions.js`, `server/emulator-index.js`, `package.json`):**
  - `isEmulatorEnvironment()` requires **both** `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST` on `127.0.0.1` or `localhost`, a nonempty `demo-*` project ID (`trimmed.length > 5`), and no `GOOGLE_APPLICATION_CREDENTIALS`. `FUNCTIONS_EMULATOR='true'` alone or a missing Auth emulator host returns `false`.
  - Production entrypoints (`server/app.js`, `server/gemini-index.js`, `functions/index.js`) never import `shared/universe/fixtures/index.js`. Only `server/emulator-index.js` (`npm run server:dev:emulator`) and test harnesses inject `FIXTURE_RELEASES`.

### Finding B4 — Coherent Draft Idempotent Replay Snapshot
- **Fix (`server/routes/universe.js`):**
  - When `PUT /api/universe/missions/:missionId/draft` replays a previously committed `Idempotency-Key`, it returns the coherent snapshot stored in `idemData.responseSnapshot` (`draftId`, `revision`, `updatedAt`, and nested `draft` all from the original committed save) without reading `draftSnap.data()` into `draft` and without overwriting newer draft revisions.

### Finding B5 — Strict `previousSubmissionId` Task Identity & Legacy Format Rejection
- **Fix (`server/routes/universe.js`, `server/routes/coach-universe.js`):**
  - `verifyPreviousSubmissionLink()` is enforced in both `PUT /draft` and `POST /submissions`.
  - Requires `prevData.orgId === caller.orgId`, `prevData.learnerUid === caller.uid`, `prevData.status === 'returned'`, non-legacy format (`prevData.legacyFormat !== true`, `prevData.missionVersion !== '0.1.0-draft'`, non-empty `evidence`), and exact match on `releaseId`, `missionId`, `missionVersion`, `routeId`, `taskId`, and `policyVersion`.
  - Tracks per-task returned submission IDs (`lastReturnedByTask` and `consumedReturnedIds`) on `missionSubmissionLocks` so superseded returned attempts cannot be reused.

### Finding B6 — 64 KiB Stored Document Budget Across Submission & Review
- **Fix (`server/routes/universe.js`, `server/routes/coach-universe.js`):**
  - `POST /submissions` reserves `MAX_REVIEW_OVERHEAD_BYTES = 4608` bytes so a submission whose canonical stored size plus worst-case review overhead would exceed `65,536` bytes is rejected upfront with `413 PAYLOAD_TOO_LARGE`.
  - `POST /review` computes `Buffer.byteLength(canonicalStringify({ ...updatedSubData, createdAt: ..., reviewedAt: nowIso }), 'utf8')` inside the review transaction before `transaction.update` and aborts with `413 PAYLOAD_TOO_LARGE` if the reviewed record would exceed `65,536` bytes.

### G04 Rules Audit Findings 1–3 (`firestore.rules`, `firestore.indexes.json`)
- **Finding 1 (`users/{userId}`):** Hardened `allow create` so self-created learner profiles cannot include `orgId`, `status`, `publicId`, `consent`, `enrolledVia`, or non-empty `classIds`/`schoolIds`. Changed `allow delete` to `if false;` so owners cannot delete and recreate `users/{uid}`.
- **Finding 2 (`missionSubmissions` & service-only collections):** Added `hasMatchingUniverseOrg(resource.data)` to `missionSubmissions` direct reads and explicitly added `allow read, write: if false;` for `missionDrafts`, `missionSubmissionLocks`, `universeIdempotency`, `universeMemberships`, and `universeTaskStatus`.
- **Finding 3 (`activityProgress/universe-v1` & `progress/universe-v1`):** Embedded `(docId != 'universe-v1' || isValidUniverseExplorerPrefs(request.resource.data))` directly inside the existing `match /activityProgress/{docId}` and `match /progress/{docId}` `allow create, update` rules so the generic owner rule cannot bypass the `universe-v1` field allowlist.
- **Note on broader non-Universe `server/auth.js` (`requireClaims`):** The `org-welearn` fallback was removed from `server/auth.js`, and all Universe routes bypass `requireClaims` in favor of `requireUniverseAuth`. Other legacy non-Universe routes that still call `requireClaims` remain protected by the hardened `users/{userId}` create/delete rules (which prevent self-assigning `orgId`/`classIds` on profile creation), and can be migrated to `universeMemberships` / Auth custom claims in a broader platform phase.

---

## 4. Verification & Test Results

All verification suites were executed in `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-backend`:

1. **Shared Universe Contract Tests:**
   - Command: `node --test shared/universe/tests/contracts.test.js`
   - Result: **22 / 22 passed**
2. **Firestore Security Rules Tests (Emulator):**
   - Command: `firebase emulators:exec --only firestore --project demo-hearisland-rules "npx vitest run tests/mission-submissions-rules.test.js tests/firestore-rules.test.js"`
   - Result: **2 test files passed, 134 / 134 tests passed** (16 tests in `tests/mission-submissions-rules.test.js` covering Rules Audit Findings 1–3 + 118 tests in `tests/firestore-rules.test.js`)
3. **API Emulator Integration Tests (Firestore + Auth Emulators):**
   - Command: `firebase emulators:exec --only firestore,auth --project demo-hearisland-api-test "npx vitest run --config tests/api/vitest.api.config.js"`
   - Result: **5 test files passed, 61 / 61 tests passed** (including all 14 comprehensive Contract 0.1.1 & B1–B6 tests in `tests/api/universe-missions.test.js`)
4. **Unit Test Suite:**
   - Command: `npm run test:unit`
   - Result: **30 test files passed, 537 / 537 tests passed**
5. **Cloud Functions Build, Import-Graph & Isolated Load Check:**
   - Command: `npm --prefix functions run build`
   - Result: Built `functions/dist/index.js` (`233.0 kb`), verified **0 fixture references** across all 36 files in the production import graph (`server/app.js`, `server/gemini-index.js`, `functions/index.js`) and `functions/dist/index.js`, and verified clean ESM import of `dist/index.js` (`api` export present) from an isolated directory outside the repository.
