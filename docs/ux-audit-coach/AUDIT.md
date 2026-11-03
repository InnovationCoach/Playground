# Coach dashboard UX/UI audit

Date: 2 October 2026. Local branch: `main`, commit `dbc57ab`.

Follow-up: [Backend handover review](BACKEND-HANDOVER-REVIEW.md) verifies Gemini's report against local source, corrects unresolved production claims, and records additional security and schema findings.

## Scope and evidence

First stage of the requested whole-project audit: coach dashboard and its shared app shell/API dependencies. Reviewed the live platform with the supplied coach test account, the dashboard source, related navigation, API client, and coach audit script. Inspected desktop at 1280 × 720 and phone at 390 × 844. Opened forms without submitting them. No student accounts, feedback, assignments, or material requests were created. Application code and deployment were not changed.

Local source is supporting evidence; the deployed revision has not been matched to this commit. Findings marked **live** were reproduced in the deployed interface. Findings marked **source** need runtime verification with a populated, correctly assigned class. This is a heuristic and workflow audit, not a usability study with teachers or a completed whole-platform/security audit.

Screenshots: [desktop](desktop.png), [phone](mobile.png).

## Assessment

Product-owner clarification: coaches mainly use laptops. Their primary job is tracking **PBL Studio progress**, **STEAM activity progress**, and **Academic progress in a separate section**. The test coach is expected to have learners already. This makes the zero roster a defect to investigate, not a presumed empty-class onboarding case.

The portal contains useful capabilities, but its landing screen prioritizes account counts and technical simulation details over a coach's decisions. The first question should be “What needs my attention today?” The most urgent issue is confidence in the information: missing, inaccessible, sample, and measured data currently look too similar.

Useful foundations: recognizable global navigation; a clear entry to student review; explicit material-request status text; readable section grouping on desktop; existing student/class filtering; CSV export with quoted fields. Preserve these while improving the workflow.

## Prioritized findings

| ID | Priority / evidence | Finding and user consequence | Recommended change |
|---|---|---|---|
| C01 | Critical, live + source | Live roster shows 0 learners, while curriculum shows 12–15 active learners, class averages, and hours. `activityPositions` contains fixed examples. Coaches cannot tell evidence from demonstration data. | Remove example analytics from production; derive metrics from class/activity records. Use “No activity recorded” or “Unavailable,” with dates and source. Label any separate demo environment unmistakably. |
| C02 | Critical, source; live records match fixtures | `liveRequest` falls back to the mock backend after network failures or HTTP 404, despite the production-mode guard. Seven live material rows match fixture item/cost combinations; their provenance remains unverified. A failed service can look like successful access, including mock writes. | Remove production fallback. Show a recoverable service error. Confine mock behavior to an explicit development/test mode and display its actual provenance. Verify live API responses before treating these rows as school records. |
| C03 | High, live + source | Typing in the search box while on Materials, then clicking Request Materials, no longer opens the form. Search replaces the tab markup and reattaches only inspection events. | Show student search only on student-related views. Preserve event handling across filtering, ideally through React components or delegated handlers. Add a regression test for filtering followed by an action. |
| C04 | High, live + source | Console reports permission-denied for assignments and weekly tasks. UI shows zero counters and an empty-work message without explaining failed access. Student-query errors are also swallowed. Zero learners' root cause remains undetermined. | Distinguish: unassigned coach, empty class, no search results, permission problem, and offline/service error. Keep usable sections available; provide Retry or contact-admin guidance appropriate to each state. |
| C05 | High, source | Goal progress is 65% for every unfinished goal; a missing deadline becomes 2026-09-30. Student detail contains fallback cooling, resilience, XP, and other values. Existence of an activity record is displayed as completion. | Read explicit completion fields and measured progress. If progress cannot be calculated, show a status rather than a percentage. Render missing deadlines as “No due date.” Preserve actual numeric zero. |
| C06 | High, source | Every student card starts at five stars. Rating writes fail only in console and ratings are not loaded into the display; new task failures still insert a local task. Users may believe assessment or assignment saved. | Default to “Not reviewed.” Load persisted ratings; expose saving/saved/failed status. Retain failed drafts and offer retry. Avoid claiming success until persistence is confirmed. |
| C07 | High, source | Class selector has three fixed options. Goals/projects summary counts do not consistently use the filtered roster; Accounts ignores search/class filters. Active projects falls back to learner count. | Populate permitted classes from authoritative records and filter by stable class ID. Define each metric and apply one scope consistently to lists, counts, and exports. |
| C08 | High, live + source | Assignments are absent from current tabs. Weekly-task, time, and class renderers exist but are not dispatched. Dormant assignment/task write handlers omit `classId`, which class-scoped reads/rules require. | Define one discoverable Assignments workflow with class, recipients, activity, due date, criteria, and status. Validate its persisted schema against rules before making it available. |
| C09 | High, live + source | Material form labels are not associated with controls; × has no descriptive name. Dashboard modals lack dialog semantics and source has no focus trap, Escape close, or focus restoration. Search/feedback fields remove outlines without a replacement. | Associate labels using IDs; use accessible dialogs, explicit close names, visible focus, and keyboard-operable rating controls. Verify manually with keyboard and assistive technology. This audit does not claim full accessibility compliance. |
| C10 | Medium, live | White/purple app shell shifts abruptly to navy, bright gradients, and emoji-heavy dashboard controls. Two navigation levels plus four large count cards bury useful work. On the phone the tab content starts around 1580 px down the document. | Reuse shared typography, surfaces, spacing, icons, and theme tokens. Reduce header height; show two compact priority summaries on mobile; collapse secondary navigation. |
| C11 | Medium, source | Student cards foreground Solar Car for every learner, including missing prototype defaults. Charts show only the first five students without a subset label or date range. | Default to a compact roster with current activity, last evidence, review state, and next action. Make simulation telemetry an expandable detail. Use cohort aggregates or disclose subset and date window. |
| C12 | Medium, source | Material submission shows a toast before re-rendering destroys it. Feedback uses blocking alerts; submission lacks a visible pending guard. Activity ordering is only in memory with no save indication. | Keep notifications outside replaced content; use inline progress/error/success. Disable duplicate submissions. Persist curriculum changes with save feedback or label them as a temporary preview. |
| C13 | Medium, source | Coach dashboard is English-only despite shared English/Chinese/Thai support. Currency is fixed to THB; date formatting varies. | Route text through the locale system; use school currency/timezone settings and consistent date formatting. Verify long translations fit controls. |
| C14 | Critical product gap, source | Coach PBL Studio exposes the framework, project phases, rubrics, and competencies read-only, rather than learner portfolios. Dashboard loads activity progress but does not present PBL project phase/evidence/task data. The owner's main workflow is missing. | Add a class PBL progress table and learner evidence review using the existing term project model. Keep framework reference separate from progress tracking. |
| C15 | High product gap, source | No separate Academic progress view exists in the coach dashboard. Student My Courses currently describes Edmentum integration as pending. | Add a distinct Academic section with clear connected/pending/unavailable status. Populate course/unit, provider progress, assessment result, due work, and last sync only from verified sources. Confirm the actual academic provider and data feed with the owner. |

## Proposed coach experience

### Landing screen

1. Compact title and context: “Coach overview,” permitted class selector, term/date range, last successful update.
2. Main navigation: **Overview · PBL Studio · STEAM Activities · Academic Progress**. Put Learners and Materials in secondary management navigation.
3. PBL overview: phase distribution, latest evidence, and work awaiting review. Do not invent “awaiting review” until review records exist.
4. STEAM overview: activity participation, explicit completion and measurable outcomes. Keep it separate from PBL phase progression, with links from evidence to related activities.
5. Academic overview: provider course progress, assessment results, overdue work, and sync freshness, shown separately from simulation scores.
6. Priority queue across these sections with learner, class, domain, reason for attention, and a clear Review action. Use expandable details on laptop to avoid repeated modal trips.

Use the laptop width for a compact sortable roster and side-by-side evidence/review panel. Suggested PBL columns: Learner, Current phase, Phase tasks completed, Evidence count, Latest update, Review. Suggested STEAM columns: Learner, Activity, Status, Outcome, Last attempt. Suggested Academic columns: Learner, Course, Unit, Provider progress, Assessment, Due work, Last sync. Each domain needs its own progress definitions; do not blend these into one unexplained percentage.

Keep Community and Messages in global navigation. Rename the existing PBL framework link to clarify its reference purpose; the coach's PBL tracking entry should open learner progress. Use “Activities” instead of “Activities Position & Curriculum,” “Learners” instead of “Signed Up Accounts,” and “Review work” instead of “View Details & Provide Feedback.” Assignment creation can remain secondary to progress review based on the owner's stated priorities.

### Review flow

Open learner → select submitted evidence/activity → inspect artifact and relevant criteria → write feedback → send → see saved confirmation → move to next item. Feedback should appear beside evidence rather than below seven expanded simulation sections. Show previously sent feedback with date/author. Preserve draft text on failure; avoid accidental loss on close.

### Empty class flow

If the coach is truly unassigned: “No classes assigned. Ask your school administrator to assign a class.” If assigned to an empty class: display the class name and an appropriate enrolment/invitation action. If filtering returns no matches: explain the filter and provide Clear filters. If access fails: show an error and Retry. These are separate states.

### Phone/tablet behavior

Use a compact class/context toolbar, readable compact summaries, and priority work before secondary analytics. Convert wide roster rows to stacked cards where appropriate; keep deliberate table scrolling inside the table region. Use adequate touch targets. A 390 px empty-roster view had no full-page horizontal overflow, but populated student cards have a 360 px minimum track inside a narrower padded container and require further verification. Do not assume mobile readiness from the empty screen.

## Implementation sequence and acceptance

1. **Restore trust:** remove production mock fallback and fabricated measures; expose section failures. Acceptance: offline/404/permission-denied never produce unlabelled examples, invented counts, or saved confirmations.
2. **Repair workflows:** search events, real class selector, consistent scope, persisted rating/task behavior. Acceptance: actions work after search and class change; failed saves keep drafts; reload restores successful writes.
3. **Unify the interface:** shared tokens and icons, smaller header, simplified navigation, keyboard-safe forms and dialogs. Acceptance: coach can operate all primary actions by keyboard; phone users reach their main work without scrolling through administrative counts.
4. **Rebuild around coaching decisions:** review queue and assignments with actual evidence and criteria. Acceptance: representative coaches can find a learner needing feedback, review work, and create a class assignment without assistance. Establish baseline task times first; choose improvement targets from observed sessions.

## QA coverage required

The coach audit script creates sample objects and asserts their fields; it does not execute dashboard code, Firestore writes, or user interactions. It uses console assertions rather than a normal Vitest suite. Replace/extend this with behavior coverage rather than counting these assertions as coach-portal verification.

Essential cases: empty and unassigned classes; two classes with distinct memberships; populated class with zero scores and missing telemetry; 404/offline/permission-denied; search then request/export/rate; exact scope of counts/exports; failed saves and retries; rating reload; assignment class ID; keyboard focus/close/restoration; narrow screens and translated labels. Use emulator/test records for writes. No automated suites were run for this read-only UX audit.

## Whole-project audit continuation

This stage already exposes a shared API reliability issue that can affect Admin, Parent, and account workflows. Further role-by-role audit is still required:

| Area | Main questions to validate next |
|---|---|
| Sign-in / enrolment | Role-appropriate landing, reset recovery, class-code clarity, language continuity. |
| Secondary student | Find assignment, understand deadline and criteria, submit evidence, read feedback. |
| Primary student | Reading burden, touch interactions, worksheet/simulation continuity, recovery after mistakes. |
| Admin / supervisor | Tenant/class context, permissions, user lifecycle, errors, destructive-action recovery. |
| Parent | Correct child links, understandable progress, useful next steps, privacy boundaries. |
| PBL / Community / Messages | Evidence continuity, navigation back to work, notifications, moderation and draft recovery. |
| Microsoft integration | SSO recovery, account linking, Teams narrow-width layouts, sync provenance/status, deadlines across school timezones. Integration designs remain proposals pending implementation verification. |

## Questions for product owner

- Confirmed: laptop use; PBL, STEAM, and separate Academic progress; test learners should already exist. Which class should this coach be assigned to?
- Which system supplies Academic progress: Edmentum, another LMS, teacher entry, or a combination?
- Are the seven material requests expected demonstration records or actual school data?
- How do teachers judge successful work: rubric, completion criteria, stars, or narrative feedback?
- Should coaches create student accounts, invite learners, or manage enrolment through administrators?

If another AI coworker owns the backend, useful handoff topics are: live API availability/provenance, coach class claims, assignment/task schema, and authoritative activity/goal completion fields. No messages were sent to other chats.

Access note: coach sign-in succeeded. The existing rules require a teacher/coach claim plus overlapping coach/student `classIds`; role alone is insufficient. Live assignment/task reads were denied. No local `scripts/firebase-admin-key.json` exists and no Firebase connector is available in this session. Root cause cannot yet be separated among missing/stale claims, class membership, deployed rules, or data/query mismatch. Use an existing authorized Firebase Console/admin session to inspect these before changing access; do not widen rules to make the dashboard appear populated.

## Source map

- `src/components/Coach/CoachDashboard.js`: constructor metrics; `loadData`; `render`; `renderWorkTab`; `renderGoalsTab`; `renderStudentModal`; `attachEvents`; `attachInspectEvents`.
- `src/services/api/apiClient.js`: `liveRequest`, especially lines 87–99.
- `src/services/api/mockFixtures.js`: material samples around lines 209–238.
- `src/features/coach/CoachDashboardHost.jsx`: imperative dashboard mounted inside React.
- `src/features/shell/TopNav.jsx` and `src/features/admin/admin.css`: shared navigation and design tokens.
- `firestore.rules`: class-scoped assignments and weekly tasks around lines 226–237.
- `tests/coach-portal-audit.test.js`: disconnected payload assertions.
