# Lower-secondary experience: inspection and agent handoffs

Date: 2026-11-07. Status: inspected and scoped; implementation not started.
Coordinator: ChatGPT. Frontend owner: Opus. Backend owner: Gemini.
No reachable Opus/Gemini session was identified in the available chat tools; these prompts have NOT been dispatched. No substitute model was assigned their ownership.

## Workspace baseline

Development branch: `codex/lower-secondary-handoff`, branched from `feature/coach-dashboard-ui-light-mode` with all existing uncommitted work retained. Origin normalized to `https://github.com/InnovationCoach/Playground.git`. No push or deployment.

The starting working tree has extensive frontend/backend edits and untracked files, including recent course generation repairs. Do not reset, stash, commit indiscriminately, or replace it with origin/main. The inspected diff against the locally available origin/main spans 64 tracked files; that remote reference was not refreshed. Coordinate a single editor in this folder. Separate branches alone do not isolate concurrent working-tree edits: use separate worktrees or sequential handoffs, preserving the repaired baseline explicitly.

## Findings

- `src/auth.js`: signup age bands are `13-15` and `16-18`; `primary` is readable. `getUserProfile` spreads the stored profile but normalizes unrecognized/missing ageBand to `13-15`. Never use that fallback to select the new UI. A 13–15 band cannot distinguish age 14 from 15.
- `server/routes/admin-users.js`: existing student fields include `cohort`, `ageBand`, `yearLevel`, and `dateOfBirth`; creation and updates already support some of these. Exact DOB coverage and validity in production were NOT queried. Existing DOB may be reused where trusted; do not collect DOB solely for this change.
- `src/features/studentProfile/studentProfileService.js` is explicitly an in-memory synthetic mock. Its computed age and DOB must NOT drive production selection. It labels primary 6–11 and lower-secondary 12–14, conflicting with this rollout's inclusion of 11.
- `firestore.rules`, users create/update rules: self-writes protect role and tenancy fields but do not protect age/DOB/cohort or a future layout override. Merely reading these from Firestore does not establish staff verification. Historical values cannot be assumed trusted after tightening future writes.
- `src/app/AuthProvider.jsx` resolves authentication and scope; `src/app/App.jsx` gates screens; `src/app/landing.js` retains recognized deep links. Keep those access decisions intact. Age-11 primary accounts need layout selection independently of `isPrimaryProfile`; do not change primary classification to unlock courses.
- Shared theme is applied globally by `src/app/theme/ThemeProvider.jsx`. New styles must be scoped to the junior shell, preserving older learners' appearance and saved preferences.

## Concept-to-feature map

| Requested section | Existing integration points | Constraints |
| --- | --- | --- |
| My Dashboard | `src/features/dashboard/MyDashboard.jsx`, `LearningHub.jsx`, `dashboardCourses.js`, `dashboardStore.js`; `src/features/quest/useQuest.js` | Existing enrolled/class-assigned courses and progress; quest API owns XP. Do not fabricate concept badges or Mars progress. |
| My Learning | `LearningHub.jsx`, `learningGuidance.js`, `src/features/goals/useGoalPlan.js`, `src/features/quest/QuestHome.jsx`, `src/features/courses/MyCourses.jsx`, PBL program progress | Goal check-ins differ from assessed/course progress. Preserve active program and activity IDs, session correction warnings and local-only indicators. |
| My Universe | `src/features/dashboard/SparkUniverse.jsx`, `src/features/universe/explore/MyUniverseExplorer.jsx`, published mission registry, activity host, `FindQuestSlide.jsx` | Existing destinations include Thalassa and Ignis. Science/design/technology cards must map to real destinations, not imaginary worlds. Current explorer integration explicitly uses preview flags; label preview content honestly. |
| My Portfolio | `src/features/personalization/Personalization.jsx`, `usePersonalization.js`, `src/features/journey/JourneyPortfolio.jsx`, `src/features/pbl/Portfolio.jsx` | Existing learner-space items, reflections, uploads, audiences and skill evidence. Preserve editor/viewer distinctions and permissions. |

`useQuest` reads `/api/quest/me` and uses existing event/preferences endpoints. `usePersonalization` uses `/api/learner-space` and item endpoints; portfolio viewer uses `/api/learner-portfolios/:uid`; uploads use learner-owned Storage paths. Reuse these services. Their existence is verified in code, not certified by an end-to-end run in this inspection.

AI: `FindQuestSlide` is catalog/rule-based; `LearnerPathway` explicitly says AI suggestions are not enabled. Do not relabel these as AI. Verify an existing student-authorized generation flow before including an AI creation button; otherwise offer clearly labelled exploration using the real catalog. Preserve repaired `src/services/pblService.js`, coach studio, and server generation behavior.

## Selection contract

Backend trust verification is a prerequisite to automatic production selection. Use a pure frontend selector on a verified server/profile contract, with reasons such as eligible, older, missing, invalid, ambiguous, or outside-rollout. Only student roles qualify. Valid trusted age 11–14 selects lower-secondary; 15+ retains current layout; missing/invalid/ambiguous data and under-11 retain current layout. Do not infer age from email, year group without a verified school mapping, or `13-15` fallback. Trusted age ranges entirely within 11–14 can suffice; ranges crossing rollout boundaries cannot.

An authorized staff override may select existing/lower-secondary only through protected server data. Define precedence explicitly and do not let it silently opt under-11 students into this rollout. Missing/invalid ages default to existing; any staff resolution must be explicit and validated. Never use query parameters/local storage as production authorization or verified age. Fixture-only preview switches are acceptable with a persistent development label and no live services.

## Handoff prompt: Gemini (first, backend contract only)

Inspect AGENTS.md and the current dirty baseline before editing. You own only necessary backend/profile work. Verify the provenance and write protection of existing age/cohort/DOB/yearLevel fields. Propose the smallest compatible trusted layout-selection contract using existing records and existing authenticated profile delivery where possible. A protected field or server-derived response is a proposal, not an already implemented API. Do not duplicate learners, collect new DOB solely for visuals, modify course APIs, or alter existing role/course authorization.

Ownership: necessary files under `server/`, Firebase rules/indexes only if required, backend tests. No frontend edits. Confirm whether existing trusted staff-controlled data can satisfy the contract; document how legacy self-editable data remains unresolved rather than automatically trusted. If introducing an override, protect it on both create and update and all alternate write paths, validate allowed values and staff/class scope, and test student spoofing plus cross-student access. Check self-enrolment branches for bypasses.

Repository instructions require Mani's approval before authentication or permission changes. Prepare an exact proposed rule/permission diff and request that specific approval before implementing such changes; a redesign request does not itself approve unspecified permission changes. No deploy or production data changes. Return the precise read contract, provenance rules, fallback behavior, changed files and emulator test evidence. Release the shared folder before Opus edits.

## Handoff prompt: Opus (frontend owner)

Implement the user's four-page lower-secondary experience, in order: Dashboard, Learning, Universe, Portfolio. First read AGENTS.md, this inspection, the user's full request, and the three original image attachments in Downloads. Use their ivory/white/purple visual direction, generous rounded cards, real responsive navigation and illustrations, not screenshots as page UI. Concept names and numerical achievements are illustrative, not actual student records. No My Learning concept was supplied: extend the same visual system.

Own new `src/features/lowerSecondary/` components/styles/selector, focused routing integration in `src/app/App.jsx`, `routes.js`, and `landing.js` only as necessary, frontend tests, and `tests/lower-secondary-preview/`. Reuse shared hooks/services instead of cloning records. Coordinate any changes to existing dashboard, shell or personalization components; those files already contain unrelated edits. Do not edit auth, server, rules, scripts, repaired course-generation code or global styles. Consume Gemini's verified contract when available; until then preserve production selection and build the explicitly marked offline fixture preview.

Scope the light palette to the junior shell; retain current 15+ layout. Keep all omitted existing features reachable through an accessible More menu and preserve guarded deep links. A new layout must never bypass primary/course gates. Provide visible focus, keyboard access, usable touch targets, no mobile horizontal overflow, reduced-motion support and contrast. If Calm mode is shown, disable decorative motion and reduce visual density, persist per-account safely, and test it.

Connect next actions to actual quest/course/activity identifiers. Render true loading/error/empty states and retry actions; unknown progress is not zero. Keep goal tasks, quests, courses and portfolio evidence in their existing relationships. Use server XP/badges only. Show real portfolio items and existing upload/reflection flows with existing audience controls. No invented AI endpoint or template presented as generated content.

Return a reviewable development build and a fixture-only preview with screenshots of all four sections at desktop, tablet and mobile sizes. Preview must stub all Firebase/API/storage calls, or use demo emulators explicitly; localhost is not a safety boundary. Include age 11/14/15/older, missing/invalid/ambiguous/under-11, overrides, account switching, reload/deep-link, progress parity, continuation and portfolio action tests. Do not claim fixture screenshots prove production integrations.

## Coordinator review and delivery gate

After the owners return patches: inspect diffs against the preserved baseline and origin/main; verify no unrelated course repairs were lost. Run relevant existing unit/UI checks, API and permission tests with demo emulators, then production build. Review the four sections visually at 1440, 768 and 390px, keyboard navigation, reduced motion, Calm mode and menu overflow. Test real emulator sign-in, refresh/direct links, same-record progress across layouts, quest resume, course access, upload/view/reflection permissions and two-student isolation.

Deliver changed-file summary, exact preview instructions, four-section screenshots, test counts/results, backend changes separately and explicit limitations. No production or Hosting preview deployment without Mani's exact written go. At this inspection stage there is no new preview/build, no screenshots of implemented pages, and no completed implementation tests.
