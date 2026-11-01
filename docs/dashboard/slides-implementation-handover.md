# Five-slide student dashboard handover

October 31, 2026 · Approved design implemented locally

## Outcome and scope

Continued the existing `codex/student-dashboard` branch in `/Users/admin/Desktop/HearIsland/output/student-dashboard-20261030/source`. HEAD remains the original pilot baseline `36a075248f1bf26c9c6f6865bcf7a3b1b460463e`; the earlier uncommitted dashboard, personalization and account-organization work is preserved. The user approved the five-slide design before this implementation. No branch, hosting environment, commit, push, merge or deployment was created. No production data was accessed or written. A pre-change snapshot was saved as `before-slides-20261030.tar.gz` alongside this source checkout.

The dashboard now defaults to viewport-filling horizontal slides within the existing app shell. There is no essential learning section above a separate personal slider. Grid view remains an optional saved alternative. Native touch scrolling supports swipes, and a scoped horizontal-wheel handler pages slides on trackpads without capturing vertical scroll; buttons support mouse use; scoped Left/Right and Home/End keys support keyboard navigation. Inputs and sliders retain their own keyboard behavior. Calm mode and the operating-system reduced-motion preference disable smooth transitions and decorative effects.

## Five default slides

1. **My Daily Learning Plan** — Today, Ahead and Completed; academic connection state, current assigned/enrolled PBL and existing goal-plan tasks. Tasks are checked through the existing goal hook. Project links open existing course/session pages. No deadlines are inferred. Clearly labelled sample academic lessons remain optional and never write progress.
2. **My Goals** — active/achieved goals, per-goal progress rings, and links to the existing Goal Setting page. No competing goal editor exists. Self-reported goal completion is labelled separately from course records.
3. **My Learning Progress** — honest academic unavailable state; recorded PBL session counts, per-phase milestones where the course supplies them, and links to detailed records. No composite academic/mastery percentage is invented. A failed account-progress read suppresses the progress ring. The separate self-reported term workspace/readiness is shown only when a term record exists.
4. **My Creative Space** — existing notes, focus sounds/timer and check-in/reflection tools; portfolio and Canva links; existing named personal spaces and one arrangement editor for optional tools.
5. **My Spark Universe** — appearance controls, existing personal milestones/inspiration tools and reserved space for future optional games/AI companion. XP and all unlocks remain inactive. Legacy badges are explicitly described as self-reported, not verified mastery or entitlement evidence.

## Personalization and preservation

Students can reorder and rename the five slides, but cannot remove essential slide access. Blank or damaged names fall back to template labels. Every new dashboard session begins on Daily Plan; presentation order and grid/slide preference persist through the existing learner-specific preference store.

Legacy personal pages, names, tool order/visibility/sizes, fonts, backgrounds, themes, calm mode, covers, taglines and interests remain intact. Earlier per-space slider layouts are presented as a single column inside the new deck to avoid competing nested swipe surfaces; the stored layout value is preserved. Optional tools have one primary slide: focus/notes/reflection in Creative, readiness in Progress, and badges/recommendations/general skills in Universe. Their arrangement is edited in Creative Space. Global appearance is edited in one native modal dialog, with keyboard focus containment/restoration.

Slide panels remain mounted when inactive, with `inert` and `aria-hidden` preventing offscreen focus/screen-reader access. This preserves note drafts and the existing shared sound/timer session. Grid exposes all slides accessibly. Course records load once in the dashboard parent and are shared between Daily Plan and Progress. Goals reuse the existing plan hook; no backend, rules, account or authentication changes were introduced in this pass. The prior four default admin review fixtures and all other test fixtures are preserved.

## Files changed in this pass

- New `src/features/dashboard/DashboardDeck.jsx`, `dashboardDeck.css`, `slideModel.js`.
- Updated `MyDashboard.jsx`, `LearningHub.jsx`, `PersonalSpace.jsx`, `workspaceModel.js`.
- New `tests/dashboard-slides.test.js`, `tests/dashboard-preview/slides-check.mjs`, `admin-fixtures-check.mjs`.
- Updated `vitest.config.js`, offline `fixtureCourses.js`, and compatibility browser-check entrypoints `check.mjs` / `personalization-check.mjs`.
- This handover and a latest-handover pointer in the preceding handover.

Other uncommitted changes visible against HEAD, particularly account organization and API failure behavior, predate this pass and were preserved rather than recreated.

## Validation

- Existing unit suite: **542 tests pass in 30 files**.
- Focused slide, personalization, course-reader and API/account tests: **17 tests pass in 4 files**.
- Production build passes; the existing large-bundle warning remains.
- `git diff --check` passes.
- Offline browser coverage: five-slide default and indicators; native iPad-style touch swipe; horizontal trackpad-style wheel input, including nested vertical-scroll containment; mouse and keyboard navigation; inactive-panel isolation; grid mode; goal links and status; daily task toggles; sample isolation; shared course read; recorded/unavailable progress; modal focus restoration; saved page/slide preferences; account separation; note-draft and sound/timer continuity.
- Layout checks: 1024×768 and 820×1180 iPad sizes, 1366×1024 laptop, 1440×1000 desktop, and 390/320px mobile widths. No document-level horizontal overflow. Calm/reduced-motion behavior checked. Desktop, creative and iPad screenshots visually inspected.
- Separate account browser regression confirms the four default review fixtures, scoped counts and all-fixture pagination.
- Browser errors and external network requests are asserted absent in fixture tests. These are local synthetic fixtures, not real account records.

## Preview and commands

The existing local fixture preview runs at `http://127.0.0.1:5183/`. Use `?admin=1` for the unchanged account-organization fixture. No hosted preview was changed.

From this source directory:

```
node_modules/.bin/vite --config tests/dashboard-preview/vite.config.js --port 5183
SPARK_PREVIEW_URL=http://127.0.0.1:5183 node tests/dashboard-preview/slides-check.mjs
SPARK_PREVIEW_URL=http://127.0.0.1:5183 node tests/dashboard-preview/admin-fixtures-check.mjs
npm run test:unit
node_modules/.bin/vitest run tests/dashboard-slides.test.js tests/dashboard-personalization.test.js tests/dashboard-hub.test.js tests/account-api-failure.test.js
npm run build
```

## Remaining limits and approval boundaries

Academic/Edmentum records are not connected to the dashboard. Live sign-in, deployed backend behavior, real Firestore cross-device preference saving and denied/offline save recovery still need emulator/end-to-end verification before the pilot. Existing goal/project hooks and backend permissions were reused; this UI change does not establish their deployed correctness. Test simulated touch/keyboard layouts on physical iPad Safari and representative assistive technology before launch. New dashboard copy remains English.

Claude Opus 5.5 was unavailable and was not consulted. Codex proposed, implemented and validated the approved design.

No further design approval is needed for this completed local implementation. Commits, pushes, merges, production writes and any deployment—including the existing `pilot-preview` channel—still require explicit written authorization. The hosted preview's current expiry and branch mapping were not re-verified in this pass.

## Visual UI continuation

The user subsequently requested the UI be built out further. This continuation adds a layered ivory/lilac/mint visual system, illustrated academic/project panels, larger goal/progress treatments, paper-like notes, tinted creative tools, an orbital Universe composition, an avatar and icon-based slide dock. Artwork is decorative code-native geometry and Lucide icons; it carries no progress or entitlement claims. Existing record loading, task/goal editing, sound state, preferences and account fixtures remain unchanged.

Files for this visual pass: new `StudioArtwork.jsx` and `dashboardStudio.css`; updated `LearningHub.jsx`, `MyDashboard.jsx` and `DashboardDeck.jsx`. A panel/gallery CSS class collision was removed. At widths of 720px or less the academic and PBL lanes stack for legibility. Light/dark appearance, calm mode and reduced-motion behavior are preserved.

Validation: production build and 17 focused tests pass. The existing 542-test unit suite passes. In-app browser inspection confirms all five slides, the academic unavailable state and recorded 25% fixture PBL progress, plus dark mode. Responsive DOM checks at 820×1180, 1366×1024, 390×844 and 320×700 show no document horizontal overflow and retain all five slide controls. Screenshot review covers iPad landscape, goals, progress and Universe. No live site or hosted preview was updated.

## Guidance improvements after the read-only main comparison

Implemented the user's approved first three recommendations: a compact personalised Start Here panel above the course artwork, course-specific PBL journey stages with next task and expected evidence, and a next-unfinished-step line on each active goal card. Every goal still opens the existing Goal Setting page. Suggestions update when a task is checked; checked tasks are not immediately suggested again. Missing or failed course reads produce honest fallbacks rather than invented stages or evidence. Completed courses do not retain a stale current-stage label.

New `learningGuidance.js` contains pure record-selection helpers; `LearningHub.jsx` and `dashboardStudio.css` render the guidance. The offline course fixture now includes synthetic stages and evidence instructions solely to demonstrate the new journey UI. Six added regression tests cover suggestion priority, completed tasks, unavailable records, assigned programs, stage/evidence derivation and missing data. Focused suite now passes 23 tests across 4 files; production build and diff check pass. Browser inspection confirms Start Here changes from the checked personal task to the existing next project session, and the fixture task was restored afterwards. No backend, permission, editor, XP or deployment changes were made.

## Instrument Studio visual direction (approved 31 Oct 2026)

Mani approved direction **A · Instrument Studio** from the three proposals in `../design-directions/index.html`. The dial finish follows the light/dark theme by default, with Midnight, Ivory and Mint as optional finishes. Claude chose to use the still starfield on the Universe slide only. It was implemented in the same branch and working tree. There was no new branch, commit, push, merge, deploy or production access. A pre-change snapshot of every changed file was saved as `before-instruments-20261031.tar.gz` next to `source/`.

**What changed**
- **Progress (signature slide):** each course gets a completion gauge. It has a 240° sweep, one tick per session, a needle and the readout "6 of 24 sessions recorded". Numbered milestone notches are drawn only when the course's phase session counts add up to the recorded total. A phase list gives the same stage information as text. Academic learning is shown on a separate dial with a hatched arc, **no needle** and "Not connected", so it can't be read as zero. A third plate shows **personal goal steps** as a segmented step meter labelled "self-reported, separate from assessed learning". Nothing is combined into a composite score. The copy says completion, never speed, ability or rank. If the account progress read fails, no gauge is shown.
- **Daily plan:** Start Here is restyled as a navigation-instruction strip with a "NEXT" marker. Today, Ahead and Completed is a selector switch. The decorative course artwork is removed. The academic lane is a quiet "Not connected" plate. The project card shows the recorded session count and keeps the existing journey, next task and evidence.
- **Goals:** each goal has a numeric readout and a step meter where one segment is one real step, in its saved order. A goal marked achieved no longer shows 100% unless its steps are checked. Every card still links to Goal Setting.
- **Creative:** a workbench treatment with labelled tool headers. Notes, sound player, timer, reflections, portfolio and Canva links are unchanged in behaviour.
- **Universe:** a still star plate that is hidden in Calm view. It shows the learner's tagline, interests as themes, and goals the learner marked achieved, labelled "not assessed mastery". Two dashed bays read "Optional games · Not active" and "AI companion · Not active". XP, rewards and unlocks stay inactive.
- **Dock:** an instrument-bezel style with numbered positions. Swipe, trackpad, keyboard and arrow controls are unchanged.
- **Personalise:** new "Instrument finish" setting, saved as `dialFinish` in the existing learner preferences. Values that are missing or unknown fall back to `theme`. The existing owner-only `activityProgress` rule needs no change.

**Files**
- New: `instrumentModel.js` (pure geometry and integrity rules), `Instruments.jsx` (SessionGauge, UnavailableDial, StepMeter), `SparkUniverse.jsx`, `instrumentStudio.css`, `tests/dashboard-instruments.test.js`.
- Updated: `LearningHub.jsx`, `MyDashboard.jsx`, `workspaceModel.js`, `dashboardStudio.css` and `dashboardDeck.css` (rules for the retired artwork and ring removed), `vitest.config.js`, `tests/dashboard-preview/slides-check.mjs` (the gauge's ARIA values, needle angle, no-needle academic dial, inactive bays, new "Not connected" and XP copy).
- Removed: `StudioArtwork.jsx`, which is now unused.

**Validation**
- Unit suite: 542 tests pass in 30 files.
- Focused dashboard suites: 30 tests pass in 5 files, including 7 new instrument tests: the needle is proportional, unverifiable readings return null instead of 0, milestones are drawn only when counts match, achieved goals don't tick steps, and the finish preference falls back safely.
- Production build passes, with the existing large-bundle warning.
- Offline browser suites pass: slides (swipe, trackpad, keyboard, drafts and audio continuity, grid, saved preferences, account isolation, iPad, laptop and mobile, reduced motion, no external requests) and the four default admin review fixtures.
- Screenshots in `../screens-instruments/` were visually inspected: laptop slides 1–5, iPad landscape and portrait, a 390px phone and dark mode. The 320px layout was checked in the browser; the goal switch and goal cards were fixed for that width.

**Limits:** Academic/Edmentum records are still not connected. Milestones depend on courses supplying phase session counts. The design still needs checking on physical iPad Safari and with screen readers. New copy is English only. Everything requires Mani's written approval before any commit, push or deploy.

### Dark by default (31 Oct 2026)

At the user's request the dashboard now opens in **dark mode** by default. **Light** and **Follow app theme** are options under Personalise → Theme, which now shows readable labels. The default lives in `workspaceModel.js` (`THEMES`, `hydrateWorkspace`). A missing or unknown saved theme falls back to dark, and a saved Light or Follow app theme choice is kept. With the default "Follow light/dark theme" dial finish, the dials use Midnight. This only affects the dashboard area; the app's sidebar and other screens keep the app-wide theme. Tests: one new unit test for the default and fallback. The browser isolation check now sets Light for one learner and confirms another learner still gets dark. Results: 31 focused tests and 542 unit tests pass, the browser and admin-fixture checks pass, and the build succeeds.

## Acceptance review and emulator journey (31 Oct 2026)

**Fixes from the read-only review** (dashboard only)
- A project with no sessions now explains why there's nothing to measure, instead of showing a blank dial area. The Daily slide no longer shows a "0 of 0" chip.
- The stage list is always shown when the course reports its stages. If the stage counts don't add up to the project total, the dial has no markers and a caption explains why. A stage with zero sessions is skipped on the dial instead of removing every marker.
- Wording now says "sessions marked complete (by you) · not coach-verified and not an assessed mastery score". The dial's spoken value is "N of M sessions marked complete by you". The visible readout is hidden from screen readers so the value is announced once.
- In dark mode, filled goal-step segments are lightened to meet the 3:1 non-text contrast minimum. Purple, navy and magenta measured 2.2–2.7:1 before.
- `xp-and-account-contract.md` now explicitly says learner-marked sessions never earn XP or unlocks on their own.
- Tests: 7 new, including render tests for complete, zero-session, mismatched-stage and announced-once states. Results: 37 focused tests and 542 unit tests pass, the browser and admin-fixture checks pass, and the build succeeds.

**Emulator journey.** This used the real app from this checkout on local Auth, Firestore and Storage emulators (`demo-hearisland-local`), seeded with `npm run seed:pilot`, which refuses to run without emulator hosts. Tested by signing in as pilot students.
- Pass: signing in lands on `#/dashboard` in dark mode, and the assigned EcoCool project loads. The project page's "Mark session 1 done" is saved to `users/{uid}/activityProgress`.
- Pass: on a second, isolated browser profile ("device B"), the same student sees the same progress, the Light theme and the renamed "Quest log" slide, all loaded from the account.
- Pass: another student on device B gets the dark default, default slide names and no progress.
- Pass: after leaving and reloading, the dashboard resumes with the same theme, names and progress, opening on Daily plan.
- **Blocker, existing shared code:** `src/services/pblService.js:104` numbers sessions within each stage (`sIdx + 1`) when a Firestore course has no explicit session numbers. EcoCool's numbers come out as 1,2,1,1,1,1,2,1,1, and progress is stored by session number. One tick on "session 1" therefore counts as 7 of 9 sessions on both the project page and the dashboard. The dashboard displays the stored summary faithfully, so the fix belongs in the course model. Number sessions across the whole course, and decide how to handle progress already saved under the colliding numbers. This needs Mani's decision.
- **Blocker, existing shared code:** `src/features/courses/MyCourses.jsx:292` reads `p.identity.tone`. Firestore-loaded courses have no `identity`, so once a learner has saved progress, opening My Courses throws, and with no error boundary the whole app goes blank until the page is reloaded on another route.
- Gap: the pilot seed writes coach stage records (`enrolments/{id}/phaseProgress`), which the dashboard doesn't read; it reads only the learner's own session record. That keeps the boundary between learner-marked and coach-verified, but the coach-verified stages aren't shown anywhere on the student dashboard yet.

Still to do on real devices: iPad Safari (swiping, dials, focus order, Personalise dialog) and VoiceOver on iPad and macOS.

### Follow-up (31 Oct 2026)
- Fixed the My Courses crash in `src/features/courses/MyCourses.jsx`, two lines. The "Continue learning" item now reads `p.identity?.tone`/`?.icon` (ProgramIcon already falls back to a compass) and takes the session total from the progress summary (`s?.total ?? p.sessions?.length ?? 0`). Verified on emulators: a pilot student with saved progress can open My Courses again. Unit tests (542), focused tests (51), the browser check and the build pass.
- **Session numbering fixed** (decision 31 Oct 2026: every account so far is a test account; progress saved before the fix is flagged for the learner to re-check, not guessed).
  - Cause: none of the six built-in library courses had session numbers, and `normaliseContractProgram` numbered them per stage. EcoCool came out as 1,2,1,1,1,1,2,1,1 and the other five as all 1s, so one tick counted as 7 sessions. The catalog read path left five courses with no numbers at all.
  - `libraryProgramsData.js`: sessions are numbered 1..N in course order and the courses are marked `renumbered: true`. `pblService.js`: `needsCourseNumbering()` renumbers any course with missing or repeated numbers (Course Maker/Firestore courses included), and `renumbered` is carried on the program. Every read path now gives the same numbers.
  - `progress.js`: new progress records `sessionKeys: 'course'`. Progress saved earlier for a renumbered course, with at least one session entry, hydrates as `'legacy'` (`needsRecheck`). It stays flagged through edits until the learner presses "I’ve re-checked my sessions" (`confirmRecheck`).
  - While flagged: the project page shows a re-check banner. The dashboard shows no gauge or count, and says the progress can't be counted until re-checked. Start Here points to the project when there's no personal task first. My Courses replaces the percentage with a re-check note (en/zh/th).
  - Tests: new `tests/session-numbering.test.js` (11) and a renumbered-course case in `dashboard-hub.test.js`. Results: 542 unit tests and 709 non-emulator Vitest tests pass, the browser and admin-fixture checks pass, and the build succeeds. No Firestore rules or server changes were needed (`activityProgress` is owner-writable with no key whitelist).
  - Emulator check (student.02, whose progress was saved before the fix): flagged on the dashboard, project page and My Courses. The project page counted 1/2 and then 0 for every other stage, instead of 1/1 everywhere. After confirming, the stored record has `sessionKeys: 'course'`, and the dashboard shows "1 of 9" with the needle at 1/9 on both device A and a separate device B.
