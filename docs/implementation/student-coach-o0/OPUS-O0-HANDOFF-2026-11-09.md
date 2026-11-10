# Opus O0 handoff: truthful Edmentum states and reuse inventory

Date: 9 November 2026. Work item: O0. Branch: `feature/student-coach-opus`, cut from `origin/main` at 964836e (PR #43). The user chose this baseline. Checkout: `/Users/admin/Desktop/HearIsland-student-coach-opus`. Committed locally only: not pushed, merged or deployed.

Status: stopped for review. O1 service integration waits for Gemini's G0 contract.

## 1. O0 findings on origin/main

| # | Where | Problem | Who saw it |
|---|---|---|---|
| F1 | `edmentumService.js` `getEdmentumConfig` | Defaulted to `connected: true` with a fake `syncedAt` three hours ago, and read its config from localStorage. | Students (My Courses), coaches |
| F2 | `edmentumService.js` `getEdmentumLearnerScores` | Returned invented progress (68%, 45%) and scores (92, 88) for every learner. | Every secondary student in My Courses |
| F3 | `edmentumService.js` `launchEdmentumCourse` | On any failure it returned `success: true` with a `mock-lti-token-…` and opened the provider URL. | Students and coaches |
| F4 | `recordAgsScore` and console "Test AGS Passback" | Generated random 88–98 scores into localStorage, with confetti. | Coaches |
| F5 | Coach console and PBL Studio tab | Showed "LTI 1.3 & AGS Ready" and "Connected Edmentum Courseware Catalog (4)" with no connection behind them. Diagnostics confetti fired on HTTP 200 even when checks failed. | Coaches |
| F6 | `MyCourses.jsx` | Rendered four "connected" courses with progress, scores and a "1-Click Launch" button (F1+F2+F3). | Students |
| F7 | `childProgress.js` | Folded every non-connected state into `not_connected`, so pending, unknown, stale and failed looked the same. | Parents |
| F8 | `mockChildRecords.js` | The mock parent fixture (emulator/dev only) said `status: 'connected'` with no sample label. | Parents (mock mode) |
| F9 | `LearningHub.jsx` | Hard-coded "Not connected" even when the server says `access_pending`. | Students |
| F10 | `edmentum.css` | Console headings were dark on a dark background (`.gh-app h1/h2` outranks `.ed-title`), grids overflowed at 375px, and the pulse dot ignored reduced motion. | Coaches |

### Backend and policy findings for Gemini/Mani (not changed; outside Opus ownership)

- B1 `server/routes/lti.js` `POST /api/lti/launch/:courseId` has no `requireAuth`. It trusts `uid`, `displayName`, `email` and `role` from the request body, so anyone can mint an Instructor-role token for any uid. The server should derive identity from the verified session.
- B2 The launch response's `launchUrl` is the course's `targetLinkUri`. Opening it with a GET is not an LTI 1.3 launch (that needs the OIDC login initiation and a form_post of `id_token` from the tool). So a real launch capability does not exist yet.
- B3 `POST /api/lti/diagnostics` and `GET /api/lti/config` are unauthenticated. The diagnostics' AGS check reports "operational (95%)" from a local store.
- B4 `providerStatus.edmentum` is a bare hard-coded string `'access_pending'` in `school-workspace.js` (two places). There is no `syncedAt`, `lastAttemptAt` or capability flags.
- B5 Any signed-in role can open the `#/edmentum` route (a frontend route; no role gate). This is a permissions question for Mani, so I left it unchanged.

## 2. O0 fixes

- Added `src/features/edmentum/providerState.js`: the only place that turns server status into UI state. It has six distinct states: `not_connected`, `access_pending`, `unknown`, `connected`, `stale`, `sync_failed`, plus `loading`.
  - An unrecognised value or a request error becomes `unknown`, never `connected`.
  - `canLaunch` requires `state === 'connected'` and `capabilities.launch === true` from the server.
  - `progressFigure` returns "Not available" for null, missing or non-numeric values; 0 stays "0%".
- `edmentumService.js` now exports only `launchEdmentumCourse`. It returns `{ ok: false, code, message }` on network, HTTP or shape failure, sends no client identity, and goes through the authenticated `schoolRequest`. The default config, catalogue, score store and AGS simulator are gone.
- Added `fixtures/syntheticEdmentum.js`: two `SAMPLE-` courses with `example.invalid` URLs. They appear only in the coach console under emulator/dev builds, under a "Synthetic … Development only" banner.
- Added `ProviderStatusCard.jsx`: renders the state it is given, with source dates ("Last received", plus "Last attempt" for failures) and "Check again" only when the state is unknown. It never renders courses or a launch button.
- **My Courses** reads `GET /api/learning-context` → `providerStatus.edmentum` and shows the status card. It shows no courses, scores or launch until G0/G1.
- **Coach console** ("Edmentum setup"):
  - The header shows the real school connection state.
  - Registration values come from `GET /api/lti/config` ("Not available" if that fails).
  - The self-test is labelled as proving signing only. A launch failure shows "Launch failed"; a success says the server signed a token but "This does not show that Edmentum accepted it".
  - The passback simulator is removed.
- **PBL Studio** tab now reads "Edmentum setup"; the "LTI 1.3 Ready" pill is removed.
- **Parent view** keeps pending, unknown, stale and failed distinct. Stale and failed keep the last data with its date. A `synthetic` fixture shows "Sample data, not a live connection". Added i18n keys in en, zh and th.
- **Student dashboard** Learning Hub pill and text come from the same status.
- **CSS:** heading contrast fixed, grids use `minmax(min(…,100%),1fr)`, and the pulse dot respects reduced motion.

## 3. Changed files

Modified: `package.json` (test:unit list), `vitest.config.js`, `src/app/i18n/messages.js`, `src/features/coach/studio/CoachPblStudio.jsx`, `src/features/courses/MyCourses.jsx`, `src/features/dashboard/LearningHub.jsx`, `src/features/dashboard/MyDashboard.jsx`, `src/features/edmentum/{EdmentumIntegrationConsole.jsx,edmentum.css,edmentumService.js}`, `src/features/parent/{ParentChildDashboard.jsx,childProgress.js,parentDashboard.css}`, `src/services/api/mockChildRecords.js`, `tests/edmentum-lti.test.js`.

New: `src/features/edmentum/{providerState.js,ProviderStatusCard.jsx,fixtures/syntheticEdmentum.js}`, `tests/edmentum-truthful-states.test.jsx`, `tests/o0-preview/*` (an isolated synthetic preview; Firebase and the API client are aliased to offline stubs), and this folder.

Nothing under `server/`, rules, indexes, `scripts/`, auth or permissions was touched.

## 4. Checks

- `npm run test:unit`: 53 files, 820 tests, all passing. This includes the new `edmentum-truthful-states` (19 tests) and the updated `edmentum-lti`.
- `npx vitest run --exclude 'tests/*rules*.test.js'` (the full vitest config minus emulator rules suites): 1046 pass, 5 fail. The same 5 fail on clean origin/main (`coach-pbl-studio` ×4, `coach-roster-stats` ×1), so they are not caused by this change.
- `npm test` (with the rules emulator): **not run**. Port 8088 is held by another session's Firestore emulator, and I did not stop it.
- `npm run build`: passes.
- Browser (headless Chrome, synthetic static build, requests intercepted, no server and no Firebase):
  - No horizontal overflow at 375px, 640px@2x (a 200% zoom stand-in) or desktop.
  - Keyboard: Tab reaches "Request test launch token", which has a visible 2px focus outline. Enter on it, with the service failing, produces `role=alert` `data-ok=false` "Launch failed … Nothing was opened."
  - Not yet covered: real 200% browser zoom, screen reader, and the full authenticated app.

Screenshots (synthetic) are in this folder: `states-desktop.png`, `states-mobile-375.png`, `states-200pct-zoom.png`, `console-launch-failed-keyboard.png`, `console-selftest-failed-token-issued.png`, `console-mobile-375.png`.

Try it:
```bash
cd /Users/admin/Desktop/HearIsland-student-coach-opus && npx vite --config tests/o0-preview/vite.config.js
```
Then open `http://127.0.0.1:5197/?view=states`, or `?view=console&edmentum=access_pending&launch=fail` (use `launch=ok` for success).

## 5. Reuse inventory (what O1–O4 build on)

| Need | Reuse | Caveat |
|---|---|---|
| Daily checklist / Today | `goals/goalPlan.js` (`todayItems`, `toggleToday`, `dayKey`), `dashboard/DashboardWidgets.jsx` `TodayWidget`, `learningGuidance.js` | goalPlan saves last-write-wins (localStorage then `users/{uid}.goalPlan`), with no revision |
| Coach-set targets / ILP base | School `learner-goals` API (`target, domain, dueDate, state, revision`) in `SchoolLearningPanel.jsx` | No term or lesson link yet |
| Focus room | `focus/focusModel.js` (wall-clock `endsAt`), `focusStore.js`, `soundEngine.js` (audio starts only on a user click), `FocusWidget.jsx` (respects reduced motion) | A running timer is not saved, so refresh recovery needs new code |
| Notes | `dashboard/NotesWidget.jsx` → `users/{uid}/notes` | Parents can't see them (`NOT_SHARED`) |
| Portfolio / evidence | `pbl/Evidence.jsx`, `Portfolio.jsx`, `Showcase.jsx`, `journey/JourneyPortfolio.jsx` | Tied to a single term |
| Messaging | `messages/messagesAPI.js` (conversations, class chat, audit), `messageModel.js` | Use for contextual replies instead of a new thread store |
| Help requests | `support-requests` API (`submitted → acknowledged → resolved`, revision); `W2eCoachSupportPanel.jsx`, `W2eLearnerStudio.jsx`, `QuestHome.jsx` | Categories are wellbeing-style today; the plan's form fields and lifecycle need G2 |
| Review semantics | Universe `CoachUniverseSubmissions.jsx` (`submitted/returned/approved`, Idempotency-Key, paged, note required on return); lesson submissions `submitted/reviewed` + revision | The desk should link to these, not copy their state |
| Coach shell | `coach/CoachWorkspace.jsx` (sections, class/cohort filter, learner detail), `coach/learners/` (`needs attention`, `QUIET_DAYS`) | |
| Parent | `parent/childProgress.js` `SHARED` / `NOT_SHARED` | ILP/PLP visibility must be added after Mani's policy decision |
| Calendar | `school/calendarReference.js` (2026–27 term events), `calendar-events` API | Events only, not a term model. `TERM` constant and offering `semester` conflict with three terms |
| Cohort | `utils/schoolCohorts.js` (`cohortForAge`, WLS 6–8, WHS 9–12), `isPrimary` | The lower-secondary shell (`lowerSecondary/`) is **not on origin/main**; it lives only on `codex/lower-secondary-followup` |
| Academic progress | `academic-progress` API (`provider, course, completed, total, dataAsOf, sourceMethod: coach_recorded`) | Coach observations, not a provider feed. Keep the label |

What doesn't exist yet: a three-term year model, course outlines and lessons, ILP, PLP, cross-area readiness, a practice bank, server-backed routines and sessions, focus-timer recovery, idempotency outside Universe, and parent visibility rules for the new data.

## 6. Proposed screen map (for review; nothing built beyond O0)

Student, upper secondary (15–18), from the existing student shell:
- **Today**: weekly priorities and today's lessons (target vs actual with source date), routine checklist (reuse `TodayWidget`), focus room entry, and open help requests with their latest reply.
- **Courses**: provider → course → unit → lesson. The lesson page has an "Ask for help about this lesson" form and shows coach replies on that lesson.
- **My plan (ILP)**: term tabs T1/T2/T3, per course target lessons vs completed, difference, last update and source. "Not available" when there is no date or denominator.
- **Future plan (PLP)**: pathway choice (University suggested, not preselected), parent discussion status, milestones, and readiness in three separate areas with criteria, evidence and dates (no combined score).
- **Applications**: essay versions with feedback links, and recommendation requests.
- **Practice**: session, graduated hints, feedback, topic breakdown and revision links.
- **Focus room**: the existing FocusWidget, with timer, audio, tasks and notes.

Student, lower secondary (11–14): Today (a small next-action list and a routine), Courses, Goals (goal vs actual, optional XP/streak with no penalty on holidays), Focus/reflect. Uses the lower-secondary shell once it is merged; unknown or ambiguous cohort keeps the current layout.

Coach:
- **Desk overview**: overdue requests, pending reviews, and pacing flags (each with a reason and source date).
- **Queue**: filters for class, student, category, status and due date; returning from a learner keeps the queue context.
- **Learner detail**: ILP by term, recent requests and reviews, private staff notes (separate from published replies), and links to the authoritative mission and lesson review.
- **Imports**: outline preview, row errors, duplicate quarantine, then commit.
- **Edmentum setup** (this O0 page).

Parent: the existing child dashboard plus PLP discussion status and published milestones only, per the approved policy.

## 7. Contract fields Opus needs from G0 (before O1 integration)

1. **Provider status** (replacing the bare string in `learning-context`): `providerStatus.<provider> = { state: not_connected|access_pending|connected|stale|sync_failed, syncedAt?, lastAttemptAt?, lastError?: {code, message}, capabilities: { outline, progress, launch }, staleAfterHours? }`. The client treats anything else as `unknown`.
2. **Launch**: an authenticated endpoint that derives identity from the session and returns either `{ mode: 'form_post', action, fields }` or `{ mode: 'redirect', url }`, plus explicit errors (`NOT_REGISTERED`, `FORBIDDEN`, `UNAVAILABLE`). It must not return a plain target URL as a "launch".
3. **AcademicYear/Term**: `yearId, schoolId, timezone, revision, terms[3]: {id, label, startDate, endDate}, nonStudyDays[]`, and how legacy `semester` maps to a term.
4. **CourseOutline**: `provider, externalCourseId, outlineVersion, units[{id, title, order, lessons[{id, title, order, durationMin?, weight?}]}], source {method, importedAt, batchId}`.
5. **ProgressObservation**: `learnerUid, outlineVersion, lessonId|unitId, status, score?: {given, max, scale}, sourceMethod (provider|coach_recorded|import), observedAt, receivedAt, verification, supersedes?`.
6. **Pacing projection** (server-computed): `termId, courseId, targetLessons, completedLessons, difference, method (dated|equal_weight|weighted), eligibleStudyDays, asOf, sources[]`, plus `unavailable: {reason}` when there is no denominator or dates.
7. **ILP**: `learnerUid, yearId, termId, courseId, selectedLessonIds, baselineTarget, currentTarget, studyDays, accommodations, revision, adjustments[{by, at, from, to, reason}]`, with a preview endpoint for a coach adjustment.
8. **Cohort**: `{ cohort: lower|upper|unknown, evidence, asOf }` from the server. The client never infers entitlement from a profile field.
9. **SupportRequest** (G2): `category, related {type, id}, workingOn, tried, stuckOn, helpNeeded, assignee, dueAt, state (open|assigned|awaiting_student|resolved), visibility, revision, history[]`, with Idempotency-Key on create.
10. Common rules: error codes (`VALIDATION, FORBIDDEN, NOT_FOUND, CONFLICT, UNAVAILABLE`), cursor pagination, `contractVersion` on every response.

## 8. Open dependencies and decisions

- **Gemini G0:** fields above; fixes for B1–B4.
- **Mani:** B5 (route gating for `#/edmentum`); the parent visibility policy for ILP/PLP; when to merge the lower-secondary shell into main (O1 cohort presentation depends on it).
- **School:** real 2026–27 term dates, timezone and pacing policy.
- **Edmentum:** registration and launch documentation before any learner-facing launch.
- Rules emulator suite to be re-run once port 8088 is free.
