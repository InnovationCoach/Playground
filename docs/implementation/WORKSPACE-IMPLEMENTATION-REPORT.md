# School learning workspace — implementation report for Gemini 3.6

3 October 2026. Implemented locally on the existing `main` working tree. No commit, push, production migration, Firebase rules deployment, or Hosting/backend deployment was performed. This report supersedes the earlier handoff's proposed route contracts for the features listed below; the larger implementation plan remains the roadmap.

## Delivered application and API work

- Shared school-learning workspace integrated into coach, student, admin and parent dashboards. Admin opens `#/admin/learning`; coaches have PBL, Academic, Goals and Calendar sections; students have the workspace on their home dashboard; parents have linked-child summaries/goals/academic/calendar. Primary learners receive a read-only school calendar beside Junior Explorers.
- Three distinct program definitions in the confirmed order: Sustainable Futures, District Net-Zero Resilient Microgrid, Project Arachne. The two new programs include their own five milestones and weighted criterion/standard definitions. These are curriculum definitions, not fabricated enrollments or progress.
- Admin creates school/year offerings, assigns or removes classes, issues expiring program-specific class codes, and disables an issued code. Learners join through a rate-limited, hashed-code, idempotent backend transaction. Learners must already have the school assigned in their provisioned profile. The code authorizes only its bound class/offering and does not grant staff privileges.
- Assigned staff draft/edit/publish class-scoped lessons with learning outcomes, instructions and milestone placement. Published content cannot be overwritten; new content must be a new lesson. Draft editing and publishing enforce author/admin access plus current class scope and expected revision.
- Students submit immutable written evidence and optional HTTPS evidence links for published lessons in their enrolled class. Retry IDs cannot overwrite evidence. Coaches publish constructive feedback or request revision with concurrency checks. The review list refreshes every 30 seconds. Lesson review is explicitly separate from formal milestone approval and rubric mastery.
- Coaches assign measurable PBL/STEAM/academic goals with due dates. Learners acknowledge their own goals; assigned staff confirm achievement, reopen, or archive. Parent access is limited to linked children.
- Parent PBL summaries show published-lesson counts and latest submitted/reviewed/revision-requested lesson counts, without raw artifacts, peer names or private evidence. Existing legacy Sustainable Futures portfolios are not included automatically in these new-offering summaries.
- Academic section navigates CambriLearn/Edmentum and recorded courses/levels. Staff can save dated, append-only observations with completed/total units. Numeric zero is preserved; blank/null units are rejected. The source is always `coach_recorded`. Latest course views prioritize observation date, then save time. Automatic provider access remains pending.
- Shared Month/Agenda school calendar, date ranges, local school times/timezone, cancellation, admin-only add/edit/delete, conflict detection and audit records. Calendar updates are polled every 30 seconds; this is not a Firestore realtime listener or provider sync.
- Admin preview/import of 37 distinct supplied 2026–2027 calendar entries. Import uses stable IDs, skips existing entries and preserves admin edits. No reference calendar was imported into production. Personal browser-local additions in the supplied HTML are not automatically migrated.
- Live API network/404 failures no longer silently fall back to sample data. Successful HTML responses from a missing API rewrite are rejected. New workflows always use the real service, even if legacy account screens explicitly run in sample mode. Revoked-access responses clear cached private records; Check access refreshes the Firebase token.
- Corrected `test:api` to select `tests/api/vitest.api.config.js`, so it actually runs the API suites against a consistent demo-project emulator.

## Code ownership and integration points

Application/API additions:

- `src/features/pbl/content/programCatalogue.js`
- `src/features/school/SchoolLearningPanel.jsx`, `useSchoolWorkspace.js`, `schoolWorkspace.css`, `calendarReference.js`
- `server/routes/school-workspace.js`, `server/lib/schoolScope.js`
- Route mount in `server/app.js`; signed-token attachment in `server/middleware/auth.js`
- Real-response checks in `src/services/api/apiClient.js`
- Dashboard mounts in coach/student/parent/admin components and the primary branch of `src/app/App.jsx`; admin route in `src/app/routes.js`

Earlier local coach workspace changes remain intact. Sustainable Futures still reads its original `term-2026-t3` portfolio; the new offering creation does not rename, reset, or migrate that evidence. Tests assert preservation. The source's “Term 3, 2026”/draft label conflict still needs production inventory and an explicit school-year mapping.

## Actual service contract

All paths below are under `/api`. Use a Firebase bearer token and JSON request body for mutations. Errors follow existing `{error:{code,message}}`; records/lists use `{items}` or the record itself. Mutations that edit records need their `revision`. These are implemented endpoints, not the earlier plan's unscoped proposed routes.

- `GET /learning-context`: trusted role, schools/classes, provider access status.
- `GET /schools/:schoolId/learners`: authorized minimal learner names/IDs/class IDs.
- `GET/POST /schools/:schoolId/program-offerings`; `PATCH /schools/:schoolId/program-offerings/:offeringId` for admin class assignments.
- `POST /schools/:schoolId/program-offerings/:offeringId/codes`; `DELETE /schools/:schoolId/program-codes/:codeId`.
- `POST /program-enrollments/join` with `{code}`.
- `GET/POST /schools/:schoolId/program-offerings/:offeringId/lessons`; `PATCH .../lessons/:lessonId`; `POST .../lessons/:lessonId/publish`.
- `GET/POST /schools/:schoolId/program-offerings/:offeringId/submissions`; `POST .../submissions/:submissionId/review`.
- `GET/POST /schools/:schoolId/learner-goals`; `PATCH .../learner-goals/:goalId`.
- `GET /schools/:schoolId/learner-program-summaries?learnerUid=...` (staff also supplies an assigned `classId`).
- `GET/POST /schools/:schoolId/academic-progress`; reads require `learnerUid` and staff supplies an assigned `classId`.
- `GET/POST /schools/:schoolId/calendar-events`; reads require `from/to` local dates with maximum one-year range; `PATCH/DELETE .../calendar-events/:eventId`.
- `POST /schools/:schoolId/calendar-reference/import` with `{confirmYear:'2026-2027'}` after admin review.

School collections: `programOfferings/{id}` with `members`, `lessons`, `submissions` subcollections; `learnerGoals`; `academicSnapshots`; `calendarEvents`; `auditEvents`. Server-only top-level collections: `programEnrollmentCodes` and `programJoinAttempts`. Existing `users`, `classes`, `schools`, `parentLinks` remain authoritative for identity and membership. These paths differ deliberately from the full team/artifact-version schema in the roadmap: the current submission flow is individual written/link evidence.

New authorization uses signed role claims matching the provisioned profile, plus the intersection of signed and current profile school/class scopes. Existing school/class assignment must be verified for every relation. Students require a signed school grant matching their protected profile; self-created profile/class fields alone cannot grant school access. Parents can derive school access from an active child link. New offering enrollment still requires a provisioned student school membership. Removing an offering class revokes its learner access while preserving submissions.

## Verification

- Unit/UI tests: 300 passed, including live-API failure handling, program-switching cleanup, parent controls, and cache removal after revoked access.
- API/Auth integration tests: 50 passed across four suites, including the new school workflows and existing admin/session/parent routes.
- Combined Firestore/emulator/unit/UI suite: 401 passed. This includes the 300 unit/UI tests above; do not add those counts together.
- Production build: passes; the existing large-bundle warning remains.
- Browser checks in an explicitly labeled, isolated preview: lesson draft/publish, coach review and revision feedback, goal assignment, student evidence/goal acknowledgement, parent read-only controls, admin event creation, program switching, zero academic progress/source dates, error state, and narrow layout. At width 390, document width was also 390; the month grid scrolls inside a 332px container. Browser viewport was restored afterward.
- Browser sample data never contacts Firebase and cannot prove production claims or deployment. Emulator integration tests cover real Express/Auth/Firestore behavior. Production credentials were expired, so production database edition, role claims, live data, and end-to-end live accounts are unverified.

Preview: `http://127.0.0.1:5175/tests/school-preview/index.html?role=teacher`. Screenshot: `screenshots/coach-programs.png` (sample banner included). Preview setup is described in `tests/school-preview/README.md`.

## Gemini: required before production release

1. Re-authenticate the Firebase tooling and verify `dnd-master-73449`, actual Firestore edition/database, app settings, deployed revisions and current rules. No new production database should be created for this work.
2. Provision consistent signed `role`, `schoolIds`, `classIds` and corresponding protected profile fields for school staff/admin. Provision signed student `schoolIds` and confirm current school/class membership and verified parent links. Never grant these based solely on a UI role or email. Test claim refresh and reassignment with the real accounts.
3. Deploy the Express backend with the correct project/runtime service identity, then route Hosting `/api/**` to it before any SPA fallback. `firebase.json` still has no API rewrite; this work does not claim that deployment is complete. Confirm same-origin JSON responses, bearer validation and error status codes.
4. Keep every new school collection and enrollment/rate-limit collection browser-denied. All reads/mutations in this release use authorized APIs. Current local default-deny rules already do this and new rules tests verify it, including direct admin writes. Do not apply the reference calendar's public-read/authenticated-write example. If future direct subscriptions are introduced, design explicit scoped read rules first.
5. Independently patch the previously identified legacy feedback/ratings/notification writes and assignment/task destination-scope issues. This release did not alter `firestore.rules` or remedy those old vulnerabilities; test additions alone do not fix them. Also constrain protected school/class fields on initial student profile creation; the legacy create rule currently checks only the role. Confirm which rule file is actually deployed rather than modifying an unused `deploy/` copy.
6. Verify production indexes for existing parent-link equality queries and the new query set; the emulator does not prove production index readiness. New reads otherwise use simple school-scoped collections/single fields. Add pagination/projections and date-window indexing before large rosters/history; this first release is for one school and currently scans scoped collections.
7. Inventory legacy Sustainable Futures evidence and map it to Semester 1 explicitly without overwriting its IDs. New-offering setup is additive; it does not migrate historical portfolios or make production programs live automatically.
8. Preview and verify the 37 reference dates with school admin, then import once through the admin tool. Timed events currently store local dates/times with school timezone; UTC normalization and DST handling remain a later contract extension.
9. Arrange authorized CambriLearn/Edmentum access and provide provider documentation plus sample exports. Automatic synchronization, provider grades, deadlines, identity mappings, imports and scheduled workers remain unimplemented. Keep manual observations distinctly labeled.
10. Release through a staging/preview environment with each real role, record backend/Hosting/rules revisions and rollback procedure. Provide the deployment report and remaining failures. Do not wipe the shared uncommitted working tree; agree a commit boundary with the user.

## Remaining application work from the larger plan

Team/solo collaboration, inquiry board, uploads and private Storage/version validation, teacher-signed formative gates, rubric assessment/publication, provider synchronization/imports/grades/deadlines, school-year/term management and Year/Term calendar views, category management/agenda metadata, academic pacing/reflections, age-band adaptation/eligibility enforcement, full localization, overview intervention summaries, and broader legacy STEAM adapters remain follow-on work. This is a tested first functional release, not completion of the entire platform roadmap.

The report is prepared for the user to share with Gemini; no message has been sent to another developer or external service.
