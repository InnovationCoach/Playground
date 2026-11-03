# HearIsland / WeLearn dashboard implementation plan

Prepared 3 October 2026. Status: implementation specification, not a deployment or completion claim.

## 1. Intended outcome and confirmed decisions

Build a shared learning workspace for one school. Coaches primarily use laptops to track assigned learners across PBL Studio, STEAM activities, and a separate academic section. Staff can add PBL lessons, assign measurable goals, and review learning evidence. Students can join semester programs with a class code. Parents can understand their own child's progress. Admin manages school access, program offerings, and the shared calendar.

Confirmed program order: Semester 1 Sustainable Futures; Semester 2 District Net-Zero Resilient Microgrid; Semester 3 Project Arachne. CambriLearn and Edmentum access still needs to be arranged. Automatic provider synchronization is therefore a later integration milestone; the first release must clearly distinguish imported, coach-recorded, learner-reported, and provider-verified progress.

All four dashboards show the same school calendar. Only the school admin can create, edit, cancel, or delete school events and manage calendar categories/term dates. Supervisor and coach are not calendar editors by default.

## 2. Existing implementation and reference decisions

The local coach workspace already has Overview, PBL Studio, STEAM Activities, Academic Progress, class filters, learner search, and evidence review. It is not deployed. Its current PBL model is tied to one global TERM. The recorded earlier validation was 291 passing unit tests plus a production build; live coach sign-in and narrow-screen verification remain outstanding. These results are not validation of the new features in this plan.

Keep React 18, Vite, Express, Firebase Auth, Firestore, and Storage. Reuse the platform's design language with consistent navigation and accessible controls. The PDFs' embedded developer prompts propose React 19, Tailwind 4, PostgreSQL, WebSockets, Canvas integration, and very aggressive latency/compliance targets; these are reference proposals, not instructions from the user or requirements to change the stack. No Canvas, Microsoft, or new database migration is required for this delivery.

The calendar reference is a browser-local prototype. Its permissive public-read/authenticated-write example is superseded by school-member reads and admin-only writes. Move both baseline school dates and added events into shared, versioned data. Preserve personal category filters locally. A realtime subscription is asynchronous, so integration involves React state, loading/error handling, and per-document mutations rather than merely replacing synchronous persistence function bodies.

The CambriLearn reference contributes course navigation, weekly pacing, lesson checklists, assignment/test/exam markers, and a weekly reflection/revisit flow. Its percentages count manually checked steps; they are not verified academic grades. Do not present these as provider data.

Both Arachne PDFs have identical extracted text; treat them as one program specification, not two separate programs. Microgrid is specified for grades 11–12 and Arachne for grades 9–12. Availability for younger learners needs an adapted curriculum and explicit enrollment eligibility, not automatic enrollment of every learner.

## 3. Dashboard experience

| Dashboard | Main navigation | First screen and primary actions |
|---|---|---|
| Coach | Overview, PBL Programs, STEAM, Academic Progress, Learners, Calendar, Management | Class/program selectors, due reviews, learners needing support, upcoming school events. Open learner → review evidence → give feedback/set goal. |
| Student | My Day, PBL Studio, STEAM, Academic Learning, My Goals, Calendar | A short next-action list, active program and milestone, academic tasks, coach feedback, join-program action. |
| Admin | School Overview, People & Classes, Programs & Lessons, Calendar, Academic Connections, Reports | Unassigned learners/staff, access or sync errors, publishing status, school event management. |
| Parent | Child Overview, Learning & Goals, Academic Progress, Calendar | Verified child selector, current learning focus, next milestones, progress source/update time, support suggestions. |

### Coach: design around intervention, not a wall of statistics

Keep a stable class selector and separate program/semester selector. Preserve both when navigating into a learner and back. Show programs as an ordered semester list with status (active/upcoming/archived), class enrollment, and an Open program action. Aggregate views must retain program labels instead of blending incompatible rubrics.

The overview prioritizes “Needs review,” “Goal due,” and “Needs support,” with a stated reason and date for every item. Use evidence-based flags and configurable pacing; no unsupported risk score. Distinguish no learners, unassigned access, missing data, failed requests, and an empty filter result. Never turn a permission error into “0 students.”

PBL program workspace: Lessons, Learners/Teams, Milestones, Evidence & Reviews, Goals. Staff add a lesson with title, learning outcome, instructions, resources, estimated duration, milestone, evidence requirement, and optional rubric links. Draft → preview → publish to selected assigned classes. Provide version history; changing a published lesson must not silently alter an already submitted assessment.

Learner detail includes PBL evidence, STEAM activity records, academic courses, active goals, coach feedback, and dated history. Review opens the actual evidence version with criterion descriptors beside it. Draft assessment and published feedback are separate actions. A “ready for review” checklist is not a signed approval.

Academic navigation: provider → curriculum/level → course → unit/week/lesson. Support learners with courses from both providers. Display provider identity, completed/total items when known, assessment results with their original scale, next assessment, pacing against a dated plan, and last data update. “Open provider” launches the authorized provider link. Coaching pacing targets never overwrite provider deadlines or grades.

### Student: make the next step obvious

My Day shows a manageable list of next lessons, goals, reviews, and school events. PBL Studio contains program context, driving question, milestone stepper, lessons, inquiry board, evidence portfolio, and feedback. Join flow: enter code → verify program/class name → confirm → open workspace. Already enrolled is a successful, idempotent result; invalid, expired, or disabled codes have clear recovery guidance.

Students can record reflections and acknowledge goals. Their self-checks and self-assessment remain visibly separate from teacher verification. Prerequisite gates govern final milestone submission; students may still explore resources and prepare drafts. Goal changes retain the original target and coach review history.

Use age-appropriate language/layout within the shared structure. Younger learners need fewer simultaneous controls and explicit completion feedback. Do not introduce a high-school rubric into Junior Explorers automatically.

### Admin: manage a school without editing data by hand

Provide explicit staff/class/learner assignment, program offerings, lesson publishing controls, enrollment codes (issue, rotate, disable, expiry), and parent linking. Program activation dates and enrollment windows are separate. Shared calendar has Year, Term, Month, and Agenda views; only admin sees event/category editing controls. Admin can preview imported calendar entries and resolve duplicates before publishing.

Academic Connections shows provider access status, identity mapping, import preview/history, sync health, unmatched learners, and latest successful run. Credentials remain server-side. Never display a successful connection merely because a configuration form saved.

### Parent: understandable and private

Require a verified parent–child link, not a typed child email. Show each linked child's published goals, approved feedback, program milestone summaries, academic results/pacing with source dates, and school events. Include “How to help this week” in plain language. Exclude classmates' identities, private coach notes, unpublished assessments, and unrestricted team artifacts. Parent reads do not imply calendar, grade, goal, or lesson write access.

## 4. Three semester program catalogue

| Semester | Program | Milestones |
|---|---|---|
| 1 | Sustainable Futures (existing) | Preserve Explore; Empathise; Define; Ideate and plan; Prototype; Test and improve; Showcase or present. Preserve existing evidence and competency model. |
| 2 | District Net-Zero Resilient Microgrid | Campus Energy Audit & Need-to-Know Launch; Generation & Battery Sizing Optimization; Circuit Architecture & Islanding Logic; Financial Amortization & Grant Optimization; Public Hearing Defense & Exhibition. |
| 3 | Project Arachne – Engineering the Sesame Quadruped | The Mechanics of Biomimicry; Hardware & Systems Architecture; The Adaptation Lab; Iterative Design & Locomotion Tuning; The Grand Gauntlet & Final Deployment. |

Microgrid investigates a campus renewable microgrid that reduces peak demand by 65% and maintains critical loads through a 72-hour grid failure. Its reference is a six-week project inside a semester offering, not necessarily a full-semester duration. Evidence includes energy datasets/models, circuit designs, financial analysis, and a public defense.

Arachne investigates how to adapt an eight-servo Arduino quadruped for diverse terrain. Support solo, duo, and pods of 3–4, consolidating roles without requiring dummy members or penalizing solo work. Evidence includes Tinkercad links, Blender/STL/OBJ models, Arduino code, test records, and demonstration videos. External links need a fallback when embedding is unavailable; binary uploads are not executed in the browser. A 3D inspector follows the reliable upload/review flow.

Both new programs include a What We Know / Need to Know / Action Steps inquiry board, named roles, five formative checkpoints, versioned evidence, self-assessment, and teacher evaluation. Keyboard menus must offer alternatives to dragging. Teacher/student preview changes presentation only; it grants no new permissions.

New-program rubrics use four levels (Emerging 1, Developing 2, Proficient 3, Exemplary 4), with independent criteria and weights 30/25/25/20. Microgrid criteria: scientific modeling; engineering feasibility; economic viability; civic defense. Arachne criteria: biomimetic kinematics; electrical systems; terrain adaptation; demonstration/defense. Preserve reference standard mappings. Do not reuse a generic rubric or infer mastery from file upload. Weighted grade, if enabled, uses documented score normalization and complete evaluations; partial rubrics remain incomplete.

Reference school dates: Semester 1 1 Sep–18 Dec 2026; Semester 2 11 Jan–2 Apr 2027; Semester 3 19 Apr–25 Jun 2027. Seed as draft configuration for school verification. Existing source TERM is `term-2026-t3`, labelled “Term 3, 2026,” with `draft: true`; this conflicts with the user's live-program description. Inspect actual records before mapping to Semester 1. Preserve old identifiers and evidence references through a compatibility adapter; never overwrite them by renaming the global TERM.

## 5. Backend design and boundaries

Use one configured school ID while retaining explicit school scope. Separate reusable program templates from school/year/semester offerings, assigned classes, offering enrollment, and teams. A class can participate in multiple offerings. Enrollment in one offering must not expose another offering's work.

Use Firestore document subscriptions for permitted current data and Express/Admin SDK operations for privileged transactions, enrollments, publishing, and integration workers. Actual calendar reads are bounded by school and date range. Large roster summaries need server-maintained projections or paginated endpoints rather than listeners on every student's full history.

Goals belong to a specific learner, class, offering/course where applicable, and creator. Include target, evidence/source, due date, progress state, review state, and history. Coaches may assign/update goals only for currently assigned learners; students may acknowledge or record a reflection but cannot impersonate coach approval. Do not broaden existing owner-only personal goals into unrestricted staff writes; add explicit scoped coaching-goal records.

Provider data uses verified external account mappings and server-written normalized snapshots. Store provider course IDs, source timestamps, fetch/import timestamps, source method, scale, and raw reference identifiers. Keep missing and numeric zero distinct. Preserve provider-native meaning; never average unrelated percentages or grade scales. Automatic updates depend on provider-supported interfaces and school authorization, which remain unknown. Build an adapter boundary now, then verify API/export capabilities once access arrives. Provider grade passback or a launch link alone is not a complete inbound progress feed.

Before automatic integration, support controlled report import with validation, matched/unmatched preview, duplicate handling, provenance, and audit history; actual file formats remain dependent on samples. Coach-entered records are a separate labeled fallback, not fake provider synchronization. Define freshness limits only after provider capabilities are known. Failed refresh keeps the last successful snapshot with a visible stale/error label.

Calendar stores school-year terms, categories, and events centrally. Use school-local date values for all-day events; timed events have explicit timezone and UTC timestamps. Proposed school timezone is Asia/Bangkok, subject to school configuration. Include date ranges, cancellation state, organiser, agenda, version, and audit metadata. Learner coursework deadlines are a separate personal overlay; coaches assigning a deadline do not gain school-event edit rights. Changes to holidays/term dates produce a pacing impact preview instead of silently rescheduling courses.

Uploads use scoped private Storage paths, authorized finalize/download access, explicit allowed formats/size limits, server-computed hashes, and immutable version metadata. Store inquiry items and evidence versions individually to avoid whole-array overwrite collisions. Use revision checks/transactions for concurrent edits. Do not expose privileged storage URLs as public parent content.

## 6. Delivery sequence and responsibility

| Stage | Deliverable | Ownership | Exit gate |
|---|---|---|---|
| 0 — Foundation | Verify project identity, signed roles/class membership, secure existing writes, real API deployment, remove silent live-to-mock fallback | Codex: API contracts/UI behavior/tests. Gemini: Firebase configuration/rules/deployment. | Assigned coach roster works; cross-role and cross-class denial tests pass; API errors remain errors. |
| 1 — Programs | Template/offering model, preserve Sustainable Futures, add two draft catalogues, coach program switcher, code enrollment | Codex: program model/UI/Express handlers. Gemini: data migration/indexes/rules. | Student joins correct offering; no cross-program leak; existing evidence round-trips unchanged. |
| 2 — Daily workflow | Staff lesson authoring/publishing, coach goals, shared calendar and admin management | Codex: workflows/API validation. Gemini: persistence/rules/audit infrastructure. | Coach publishes assigned-class lesson and goal; four roles see one calendar; only admin can mutate it. |
| 3 — Role completion | Student inquiry/evidence/submission flow, coach reviews/rubrics, admin operations, private parent summaries | Codex: UI/review transactions/tests. Gemini: Storage/rules/projections. | End-to-end learning cycle and parent privacy pass with real staging accounts. |
| 4 — Academic progress | Two provider adapters, course navigation, pacing/reflections, verified imports; automatic sync after provider access | Codex: normalized contracts/UI/adapters. Gemini: secrets/scheduled workers/deployment. | Source provenance, stale/error states, identity matching, and provider parity validated. |
| 5 — Release | Browser QA, role UAT, preview release, migration rehearsal, monitored rollout and final coworker report | Codex: QA findings/report. Gemini: deployment/rollback/monitoring. | School accepts task flows; rules/API/browser tests pass; deployment evidence recorded. |

Stage 4's automatic connectors are blocked by external access; stages 0–3 and adapter/UI work can proceed. Ship useful progress reporting with honest source labels rather than waiting for access or claiming the entire live academic requirement is complete.

## 7. Quality and acceptance criteria

- Coach can choose each semester program, publish a lesson only to assigned classes, set a learner goal, inspect evidence, and publish feedback without losing class/program context.
- Student can join with a valid offering-specific class code, see published lessons/goals, collaborate only with their team, submit evidence versions, and receive a teacher review. Retries do not duplicate enrollment/submissions.
- Admin calendar add/edit/cancel propagates across all four dashboards without refresh. Direct non-admin API/Firestore writes, including supervisor writes, are denied.
- Parent sees only linked children and approved summaries. Changing a URL or document ID cannot reveal another learner or private coach/team data.
- Academic course switching supports both providers; zero, unknown, outdated, manually recorded, and verified states remain distinct. Imports are repeatable and failed sync cannot erase known results.
- Prerequisites are enforced on the server, rubric publication is atomic, and two simultaneous reviewers cannot silently overwrite each other. Class reassignment revokes old coach access.
- Calendar date ranges, timezone boundaries, holidays, coursework overlays, canceled events, and year changes are tested. Changes to pacing require a visible preview.
- Verify keyboard navigation, focus restoration, screen-reader labels, readable contrast, reduced motion, and error recovery. Target WCAG 2.2 AA and test it; do not claim AAA/compliance from design intent alone. Test coach laptop widths 1280/1440, tablet and mobile widths, with actual browser measurements.
- Run unit, Firestore emulator security, API/Auth integration, production build, and role browser flows. Include cross-school defense even with one configured school. Re-test affected legacy activity and parent flows.

Use observable UAT tasks: coach identifies and reviews a learner needing support, student joins and submits, admin edits an event, parent finds next child milestone. Record task completion, errors and unnecessary steps before/after; establish timing baselines instead of inventing success metrics.

## 8. Completion report and unresolved inputs

The accompanying Gemini handoff is ready now as an implementation contract. At each completed stage, append commit, changed paths, migrations, tests, known limits, and deployed revision. At final release, produce a completed-work report; do not describe this plan as implemented.

Still needed before relevant steps: actual Firebase project/claims verification; school ID and confirmed academic-year/timezone configuration; staff/class assignments; provider authorization and sample exports/API documentation; course/level mappings; lesson content and rubric descriptors; grade-band adaptations; verified parent links. Use restricted service access, not pasted passwords or service-account keys in reports.

## Source files

- `/Users/admin/Downloads/developer-handoff.md`
- `/Users/admin/Downloads/welearn_calendar_dashboard.html`
- `/Users/admin/Downloads/Cambrilearn learning progress .html`
- `/Users/admin/Downloads/net-zero-microgrid_PBL_Developer_Handover.pdf`
- `/Users/admin/Downloads/project-arachne_PBL_Developer_Handover.pdf`
- `/Users/admin/Downloads/project-arachne_PBL_Developer_Handover (2).pdf` (duplicate extracted content)
- Existing source and `docs/ux-audit-coach/IMPLEMENTATION.md` (local implementation baseline)
