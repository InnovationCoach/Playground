# Audit 001: Opus decisions and corrected root causes

8 Nov 2026 · answers the "For Opus" items in *Coach & Student Dashboard Audit (Report 001)*.
Gemini implements the server, rules and scripts items below. Opus reviews the diff before any deploy. Every deploy still needs Mani's written go.

## 0. What the build under test actually was

The coach-preview channel (`index-DQ-q9bwL.js`) was built from `backend/coach-fixes` @ `aad8a5f`, not from `main` and not from the root checkout.

The root checkout (`codex/lower-secondary-handoff`, uncommitted) already contains fixes the report raises again: C-04 shows "not started" when there is no stage, and C-07 has an allow-listed payload and no auto-run. Those fixes were never in the deployed build.

**Decided (Mani, 8 Nov): `backend/coach-fixes` is the 7 Dec ship branch.** The other line is merged into it. Nothing is re-implemented.

What must come over:
1. **Two commits on `codex/lower-secondary-handoff`:** `1168865` (coach: every real learner, dashboard tabs) and `10bdec9` (lower-secondary shell). A trial merge conflicts in 4 files: `package.json`, `vitest.config.js`, `src/components/Coach/CoachDashboard.js` and `src/features/coach/CoachWorkspace.jsx`. For `CoachWorkspace.jsx`, keep the `ec17601` roster fix and the cohort `displayGroup` logic.
2. **Uncommitted work in the root checkout (about 60 files).** It includes C-04 (`LearnerSupervisionView` "not started"), C-07 (`pblSynthesizer` allow-list; `CoachPblStudio` click-only), the Evaluation Desk, `firestore.rules`, `universe/auth.js`, `coach-students.js` and `school-workspace.js`. Its owner must commit it to a branch first; it can't be merged from a dirty folder. The server and rules parts are Gemini's to review.
3. After merging: full test run (5 failures already exist in `coach-pbl-studio` and `coach-roster-stats`; fix or explain them), `npm run build`, and the `#/coach/dashboard` zero-console-error smoke check before any preview deploy.

| Item | Status |
|---|---|
| C-01 | Fixed on `backend/coach-fixes` @ `ec17601`, with a regression test. Not yet deployed. |

## C-03 · Root cause is archived classes, not a second membership model

Read-only probe as Mani (uid `0rE6…m8z1`):

| Source | `class-wpr-11a` | `class_climate_champions_7a` |
|---|---|---|
| Token claim `classIds` | present | present |
| `users/{uid}.classIds` | present | present |
| `classes/{id}.coachIds` includes Mani | yes | yes |
| `classes/{id}.status` | **archived** | **archived** |

`aad8a5f` ("remove WPR and Climate Champions") archived both classes. Mani was not moved to a WLS or WHS class.

- **Right behaviour (keep):** `server/lib/universe/auth.js` skips non-active classes and returns 403 for a class-scoped role with no active class. `coach-students.js` skips archived classes, so its class list is empty.
- **Wrong behaviour:** these places still treat archived classes as live:
  - `server/routes/school-workspace.js:86-92`: the per-caller loop in `/api/learning-context` doesn't filter on `status`. The admin loop at line 97 does.
  - `src/features/coach/CoachWorkspace.jsx`: the class picker and roster use claim `classIds` as they are.
  - Firestore rules `myClassIds()` / `coachSharesClassWith` / `isCoachOf`: they authorise from token claims, so a coach keeps read access, and `activeProgramId` write access, to learners in an archived class.

**Decision.** There is one membership model: `classes/{id}` with `status == 'active'` and the uid in `coachIds`/`learnerIds`. Claims and `users.classIds` are caches of it.
1. Gemini filters archived classes in `/api/learning-context` and in the coach roster.
2. Archiving a class must also update the claims and `users.classIds` of every coach and learner in it. Use the existing claim-sync path; don't add a new one.
3. **Data step (Mani approves, admin UI, not a script):** assign Mani and the affected coaches and learners to the active WLS/WHS classes.

Acceptance as in C-03. Also: after a class is archived, its coaches get 403 or an empty list on all three endpoints, and Firestore denies reads of its learners.

## C-06 · One store each

| Data | Source of truth | Retire or repoint |
|---|---|---|
| Mission submissions and reviews | `missionSubmissions` via `/api/universe/*` and `/api/coach/universe/*` (server-validated, idempotent, audited) | Spark Evaluation Desk (`evaluationsStore.js` → top-level `submissions`) reads the coach API instead. Nothing in the student app writes `submissions`, so the desk is reading an orphan collection. |
| XP | `learnerQuest/{uid}` + `xpEvents` (computed on the server) | Coach views read `/api/quest/learners/:id`. Never store XP on `users`. |
| Program progress | `enrolments/{learner}_{program}` + `phaseProgress` | Supervision cards derive the stage from the active enrolment's `currentPhaseId`. Drop `users.currentStageIndex`; nothing writes it. |

No new stores. Show "Not started – 0%" when there is no enrolment. The root checkout's `LearnerSupervisionView` already does this; reuse it.

## C-07 · AI data minimisation policy

- **Trigger:** a coach click only. `backend/coach-fixes` `CoachPblStudio.jsx:126` auto-runs synthesis in an effect; remove that call. The click path at line 179 stays.
- **Payload allow-list:** `cohort`, `grade` (band), `consumingPassions` (free text, max 300 chars), `appliedAccommodations` (from the fixed list only). **Never send:** name, email, uid, dateOfBirth, `diagnosisTraits`, `executiveFunctionHurdles`. Send an opaque per-request id in place of the uid.
- **Server:** `/api/pbl/synthesize` must strip any field outside the allow-list. The client allow-list isn't trusted. Validate the model output against the same Zod schema and return a typed error instead of a 200 with an invalid body.
- Under-13 learners: no learner-derived fields at all unless consent is recorded on the learner (`consent.ai == true`).

## C-11 · Rules decisions and the tests Gemini adds

Current rules (`backend/coach-fixes`): a parent is not `isTeacher()`, so parents can't read classmates' `users` docs. That's correct; keep it. A teacher can read **any** `users` doc that shares a class, including staff, parents and `dateOfBirth`.

**Decisions**
1. `coachSharesClassWith` / `isCoachOf` apply only when the target's `role in ['student','learner']`. Staff and parent docs in a class are not readable through class membership.
2. Move `dateOfBirth` and `diagnosisTraits` out of `users/{uid}` into `users/{uid}/private/profile`, readable by the owner, admins and the server only. Coaches get `ageBand`. Until that lands, the roster query must not display those fields.
3. Rules helpers authorise from active class membership, as in C-03 decision 1, not from raw claims. If the `get()` cost is too high, claim sync on archive (C-03 decision 2) is acceptable instead.

**Required emulator rules tests**
- (a) A parent can't read a non-child classmate's `users` doc.
- (b) A teacher can't write `activeProgramId` for a student outside their active classes, including a student in an archived class.
- (c) A teacher can't read a staff or parent doc that shares their class.
- (d) A teacher can create an enrolment only for a student in their active class.

## Order for Gemini

1. Merge into `backend/coach-fixes` (section 0).
2. Run the C-03 code fixes and the C-11 rules plus tests (a)–(d) together, since both touch class authority.
3. C-07 trigger, plus allow-lists on the client and the server.
4. C-06 repointing.
5. Mani assigns the real classes (data), then the retest from Report 001's plan.
