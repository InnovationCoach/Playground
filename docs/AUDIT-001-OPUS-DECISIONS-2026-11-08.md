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

## Addendum, 8 Nov 2026 afternoon: retest of the coach-preview channel

Build under test: `index-DeSHayHm.js`, built from `backend/coach-fixes` @ `fbf55d7` and deployed to `coach-preview` only (Mani's go, 14:19 Bangkok time). Signed in as Mani (teacher). Read-only: no form was submitted.

**C-01 closed on preview.** `#/coach/dashboard` renders with the 6-learner roster, and the new bundle logged no console errors across reloads. Learner review (phases, evidence, feedback form), STEAM Activities, School Calendar, Posts for students, Mission reviews (empty queue), Day-off requests and Management tools all load.

### Production changed during the audit (for Mani)

- **The live `api` Cloud Function was redeployed at 13:33 Bangkok time** (Cloud Functions `updateTime` 06:33:49Z). Antigravity session `18ec2a46` contains `deploy --only functions:api` and `deploy --only firestore:rules` commands. Since then, `/api/coach/universe/submissions` returns 200 (it was 403) and `/api/universe/access` returns 404 (the route existed this morning). AGENTS.md requires Mani's written go for each deploy. Gemini: state which commit was deployed and when Mani approved it.
- **Production class records were renamed.** `classes/class-wpr-11a.name` is now "WHS" and `classes/class_climate_champions_7a.name` is "WLS". Both are still `status: "archived"`. This makes the screens look right but does not fix C-03 (see section C-03): Mani and the learners still belong only to archived classes. That is a production data write. It needs Mani's go and should be done through the admin UI, not a script.

### New and confirmed issues (coach-preview, 8 Nov)

| # | Severity | Where | Problem | Fix direction |
|---|---|---|---|---|
| P-01 | Critical | Add a student | Dialog says "No classes are available". `/api/coach/students/classes` returns `[]` because both classes are archived. | C-03 decisions 1–3: assign active WLS/WHS classes. Don't rename archived ones. |
| P-02 | High | Learners → Academic Progress, Learning Goals | 403 on `/api/schools/school-wpr/learner-goals`, `/academic-progress`, `/learners/{uid}/pathway` and `/api/quest/learners/{uid}`. Academic Progress shows a correct "no access" message but still offers "Record a dated academic observation". | Same root cause as C-03. Also hide the record form whenever the read returns 403. |
| P-03 | High | Class & join codes | Shows the archived classes (relabelled WHS/WLS) as live, with a program picker and "Generate code". A code would enrol learners into archived classes. | Exclude `status != 'active'` classes from this panel and from code generation (client and server). |
| P-04 | Medium | Roster vs Learning Goals/Academic vs Management tools | Learner counts disagree: roster 6; goals/academic pickers 10 (include Leo Boonmee, Nicha Chen, Thanawat Hughes and "Penny Primary", which looks like a test account); Management tools "Signed Up Accounts (7)". | One shared roster filter (students only, active, not `isTest`, in an active class) used by every panel. Ties to C-05 and C-11. |
| P-05 | Medium | Roster, Management tools | Old class names still shown: Akira's group "WPR Year 11 Climate"; Management tools lists "Climate Champions", "Climate Champions 7A" and "WPR Year 11 Climate" next to WLS/WHS. Four learners show "WHS, WLS" because they are in both archived classes. | Fix the data via C-03, then derive group labels from the learner's active class, not stored `groupName`. Don't string-match names in code. |
| P-06 | Low | Class & join codes | Each program appears twice in the program picker. | De-duplicate by program id. |
| P-07 | Low | Add a student | Age bands "Primary / 13–15 / 16–18" don't match the grade-based WLS (5–8) / WHS (8–12) model used elsewhere. | Use grade level, as `admin-users.js` now does. |
| P-08 | Low | Learning Goals (coach view) | Shows student copy ("MY LEARNING PATHWAY… show your coach the evidence"). | Use coach wording in the coach view. |

Still unverified: every write flow (create student, generate code, assign program, review, rating, post), the student side, and the third-party scripts the audit browser blocked (Google Fonts, Cloudinary, the Firebase compat SDK loaded by `index.html`). Check those in a normal browser before going live.

### Updated order for Gemini

1. Report the 13:33 functions deploy and the class-name writes to Mani (above). Make no further production deploys or data writes without Mani's written go.
2. C-03 + P-01/P-02/P-03/P-05: archived classes excluded everywhere, and real active-class assignment through the admin UI with Mani's go.
3. C-11 rules and tests, then P-04 (one roster filter).
4. C-07, C-06, then P-06–P-08.
