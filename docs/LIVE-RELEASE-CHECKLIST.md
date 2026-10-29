# Live release checklist: `release/live-candidate`

Prepared 2026-10-29 by Claude. **Nothing here is deployed, pushed or merged to `main`.** Every step in section 6 needs Mani's written "go" for that exact step (AGENTS.md). Never run a bare `firebase deploy`.

- Project: `dnd-master-73449` (`.firebaserc` default)
- Branch: `release/live-candidate`, local only, cut from `release/pilot-candidate` 36a0752
- Head: the commit that adds this file (on top of merge `c758f12`)
- Ahead of `origin/main` (21fe421, 2026-10-22): 103 commits, 258 files, +66,070 / −7,119

## 1. What is included

### 1.1 Already on `release/pilot-candidate` (base)
backend/api-resilience, backend/canva-connect, backend/coach-records-firestore, backend/coach-rules-hardening, backend/cohorts, backend/phase-0-finish, chore/remove-consent-gate, feature/canva-polish, feature/canva-ux, feature/coach-my-learners, feature/coach-pbl-studio-edmentum, feature/course-maker, feature/course-maker-ux, feature/course-studio-contract, feature/course-studio-ui, feature/goals-quest-pbl-missions, feature/live-ui-polish, feature/parent-engagement-contract, feature/parent-profile-ui, feature/parent-progress-api, feature/program-media, feature/storage-evidence-rules, fix/dark-mode-text, release/candidate, release/full-2026-10-26.

### 1.2 Merged on top (confirmed by Mani, 2026-10-29)

| Merge | Branch | Commits | What it adds |
|---|---|---|---|
| 7063f09 | backend/asset-inventory-rules | 0482531, 341a1ae, 60c1767 | Equipment inventory and loans: rules, Storage rules, indexes, tests, admin UI at `#/admin/inventory` |
| d36d11b | feature/coach-records-safe-sync | 0e25a51, 5491b8f | Coach records save to Firestore only; Q6 co-coach duties doc |
| c8f3386 | feature/parent-dashboard | 11d9981 | Parent child view: badges, time on platform, active days |
| e20e02e | fix/legacy-header-bar | 9b85eac | No navy header bar on the parent's child profile heading |
| a741110 | feature/portfolio-media | 75816b4 | Doc: Cloudinary for public media, Storage for private work |
| 46e139e | refactor/clean-legacy-components | 1ca96d4 | Deletes 19 unimported legacy files (−6,232 lines) |
| 0287110 | docs/november-plan | b62af1c, 733a579, 5b500bc | Plan decisions D1–D5, PL, PD |
| 07b8879 | feature/coach-ui-cleanup | c595ebc, 59bcbd6, 989b32c | Removes sample learners, the fake Edmentum score and seeded reviews from the coach workspace |
| c758f12 | backend/asset-inventory-rules | 931f4f2, ca464b2 | Storage rules `firestore.exists` guards; profile card header fix |

### 1.3 Left out (confirmed by Mani)
- **Superseded:** feature/showcase-canva-slot and feature/canva-section (the Canva slot is already in Showcase); release/canva-candidate and fix/mycourses-catalogcard-import (merging them changes nothing); feature/asset-inventory-plan (already inside backend/asset-inventory-rules).
- **Out of scope:** origin/DonPBL (changes only `prototypes/DonPBL`).
- **Uncommitted, untouched:** 9 files in the old `scratchpad/canva-wt` worktree (an early Canva Studio draft).

## 2. Conflicts and how they were resolved

### 2.1 Small conflicts
- `vitest.config.js` (coach-records-safe-sync): kept both new test files.
- `docs/PLAN-TO-END-NOVEMBER.md` (november-plan): kept the decisions table and pilot's "Consent (D1), done" heading. D4 is marked as included.
- `studentProfile.css` (c758f12): both sides made the same header fix. Kept one.

### 2.2 feature/coach-ui-cleanup (14 files)
Rule used: keep what pilot built later, and apply the cleanup's removal of sample data.
- **CoachPblStudio** (the coach's SPARK home):
  - The cleanup's slim workspace, with real classes and learners from Firestore.
  - The fallback to sample 2e learners (Liam, Maya, Sam, Kai) is removed.
  - Edmentum is parked (`SHOW_EDMENTUM = false`, Mani's earlier decision).
  - The Reviews tab points to My Learners → Evidence.
- **LearnerSupervisionView:** stages are no longer invented by list position, and the hard-coded "100%" is gone. A learner with no stage shows "Not started yet".
- **evaluationsStore:** starts empty (v2 key) and clears the v1 browser copy.
- **Edmentum console:** keeps the real launch panel. The "Test AGS Passback" button, which wrote a random score for Liam Chen, is removed.
- **Deleted:** learnerProfiles.js, pblSynthesizer.js, pblUnitSchema.js, utils/seedCoachTestData.js.
- **Kept on purpose:** `groundingSources.js`. Pilot's `courseStudioService.js` imports it. Git would have deleted it silently and broken the build.
- **Dropped:** the printable report at `#/coach/report`. My Learners → Report already does this with real data, approval and Save as PDF.
- **Tests:** the open-catalog publish tests now build a small unit by hand instead of using the retired synthesiser.

### 2.3 Uncommitted fix, needs Mani's go to commit
`src/features/coach/studio/useCoachStudioData.js` (owned by Gemini):
- **Problem:** the hook filled empty learner records with made-up data: "Gifted Inquiry", passions "Hands-on Making, Robotics", and two accommodations. After the cleanup these showed on real learners' cards in the coach workspace (seen in the browser on the emulators).
- **Fix:** the hook now returns only what the record holds.
- **Scope:** only CoachPblStudio uses the hook.

## 3. Test results (emulators only, synthetic seed)

| Check | Result |
|---|---|
| Full vitest suite incl. Firestore + Storage rules (`emulators:exec --project demo-hearisland-rules`, alternate ports) | **854 / 854** |
| `npm run test:unit` | **558 / 558** |
| API tests (`tests/api`, auth + Firestore emulators) | **50 / 50** |
| `npm run build` | passes (one chunk over 600 kB: a size warning, not an error) |
| Browser click-through at `?emulators=1` | admin, supervisor, coach, student and parent all sign in. SPARK home renders for each; no console errors. Admin Inventory, coach workspace (5 real learners, no sample people) and My Learners, student My Courses, parent portal all render. |

Note: two Storage tests fail if run against emulators started with `npm run emulators` (project `demo-hearisland-local`). Storage→Firestore lookups resolve in the emulator's own project, so this is the environment, not the rules. `npm test` uses the right project.

Not covered in the browser: the parent badges view (the seed links no child; covered by `parent-dashboard.test.js`), and anything that needs the deployed backend (see 5.1).

## 4. Changes to rules, indexes and Storage vs `origin/main`

**firestore.rules** (+484 lines changed). New or changed matches:
- canvaConnections, canvaOAuthStates (server only)
- pbl_programs, frameworks
- enrolments + phaseProgress
- sessions
- coachPrivate/{coach}/learners/{learner}/notes
- learners/{id} with checkIns, milestones, coachGoals, feedback, assessments, coachEvidence, parentNotes, reports
- assets + loans
- `resource == null` overwrite guards on messages/evidence

Backup of the live rules taken 2026-10-26: `docs/firestore-rules-live-backup-20261026-1857.rules`. Take a fresh one before deploying.

**firestore.indexes.json** (+74 lines): composite indexes on `assets` (4), `enrolments` (2), `pbl_programs` (2) and `users` (1).

**storage.rules** (+49 lines): new paths:
- `canva-exports/{ownerUid}/{filename}`
- `evidence/{uid}/{programId}/{phaseId}/{filename}` (class-scoped coach read, strict file types)
- `assets/{assetId}/{filename}` (admin write, 5 MB images, no overwrite)

**Cross-service permission:** `storage.rules` calls `firestore.get()` and `firestore.exists()`:
- `isConversationMember`, for message attachments
- `isCoachOf`, for evidence

In production, these calls work only after the Cloud Storage service agent has the **Firebase Rules Firestore Service Agent** role (`roles/firebaserules.firestoreServiceAgent`). `firebase deploy --only storage` offers to grant it the first time. Granting it is an IAM change and needs Mani's go. Without it, every attachment and evidence read that depends on these checks is denied.

## 5. Hazards found

### 5.1 Blocker: no backend behind `/api` in production
- **The gap:** `firebase.json` has no `hosting.rewrites` and no `functions` section; it is unchanged from `main`. The code assumes Hosting rewrites `/api/**` to the backend (`apiBase.js`, `.env.example`). Nothing in the repository does that.
- **Effect:** a production build always uses the live API (mock is impossible against real Firebase). These features would fail on live:
  - admin console account management
  - parent portal and the parent progress endpoint
  - AI tutor and PBL co-pilot
  - Canva Connect
  - Edmentum LTI and OneRoster
  - create-learner (`functions/index.js`)
- **Next step:** the deploy target and rewrite are Gemini's to define (server/, functions/).

### 5.2 Other checks

| Hazard | Finding |
|---|---|
| Mock API left on (`VITE_API_MODE`) | Safe. `apiClient.js` forces live mode in a production build against real Firebase. `mockBackend` ships as a lazy chunk and is loaded only in mock mode. |
| Test-data banner | Shown only when mock is on, so never against real Firebase. |
| Consent gate | Removed (Mani, 2026-10-26). No consent gate left in `src/`. It must return before real under-15 learners (pilot plan: physical consent at WeLearn). |
| Secrets in the bundle | None found. Only the public Firebase web key appears. No `.env` VITE_ variables, no private keys, no Gemini key, no `review123`. |
| Sample people in the bundle | None (Liam Chen, Maya Patel and the invented accommodations are not in `dist/`). |
| `bunker.html` | A student page asks the learner to paste their own Gemini API key, stores it in localStorage and calls Gemini from the browser. Already in the build before this release; flagged as a question. |
| Build source | Build from this branch in a clean checkout. The main folder has a local `.env` (no VITE_ keys today). |

## 6. Deploy order: each step needs Mani's written go

0. **Before anything:**
   - Mani approves the include list and this branch.
   - The 5.1 backend question is answered.
   - Commit the uncommitted fix (2.3).
   - Download the current live Firestore rules, Storage rules and indexes as backups.
1. **Indexes:** `firebase deploy --only firestore:indexes --project dnd-master-73449`. Wait until every index shows "Enabled" in the console.
2. **Firestore rules:** `firebase deploy --only firestore:rules --project dnd-master-73449`
3. **Storage rules:** `firebase deploy --only storage --project dnd-master-73449`. Grant the cross-service role (section 4) only with Mani's go.
4. **Hosting preview channel:**
   - Build first: `npm ci && npm run build`.
   - Then `firebase hosting:channel:deploy live-candidate --expires 7d --project dnd-master-73449`.
   - Mani checks each role on the preview URL with real (non-test) accounts. A preview channel uses the **production** Firestore and Auth.
5. **Hosting to live:** `firebase hosting:clone dnd-master-73449:live-candidate dnd-master-73449:live`
6. **Backend** (Gemini, separate go): whatever 5.1 decides. It must exist before hosting goes live, or the features in 5.1 fail.

Merging `release/live-candidate` into `main` goes through a PR that Mani approves in writing. It can happen before step 4, so live matches `main`.

## 7. Rollback

- **Hosting:**
  - In the Firebase console, open Hosting → release history and roll back to the previous release.
  - Or: `firebase hosting:clone dnd-master-73449:@<previous-version-id> dnd-master-73449:live`.
  - Note the current live version ID before step 5.
- **Firestore rules:** in the console, open Firestore → Rules → history and restore the previous ruleset. Or deploy the backed-up file from a branch whose `firebase.json` points at it.
- **Storage rules:** in the console, open Storage → Rules → history and restore.
- **Indexes:** extra indexes are harmless; leave them. Deploying an older `firestore.indexes.json` does not delete indexes unless `--force` is used.
- **Data:** none of these steps writes production data. The coach records' "one-click device migration" runs only when a coach clicks it.

## 8. Open questions for Mani
1. **Backend (5.1):** how does `/api` reach the server in production (Cloud Run, Functions or App Hosting), and who deploys it? Live should not go ahead without it.
2. **Fix 2.3:** OK to commit the `useCoachStudioData.js` fix (no invented traits or accommodations)? Gemini owns the file.
3. **Cross-service IAM role** for Storage rules (section 4): OK to grant at step 3?
4. **`bunker.html`:** should a student page ask learners for their own Gemini API key? Suggest removing that box before live.
5. **Edmentum:** stays parked (`SHOW_EDMENTUM = false`)?
6. **Suspended or pending learners:** "Sam Suspended" and "Penny Primary (pending)" show in the coach workspace. Hide them?
7. **Consent:** confirm live goes ahead without the consent gate. Real learners' consent is physical at WeLearn.
8. **Branch moves:** `backend/asset-inventory-rules` moved twice today. Freeze the include list at `ca464b2`, or keep merging?
