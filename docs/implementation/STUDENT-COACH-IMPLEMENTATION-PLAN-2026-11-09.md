# Student learning and coach support implementation plan

Date: 9 November 2026. Status: assigned work specification; not implemented, dispatched, or approved for deployment.

## Outcome

Connect each student's daily learning, three-term academic pacing, future plans, practice and help requests to a coach's actionable review workflow. Reuse the existing React/Vite/Firebase stack, goals, focus tools, portfolios, messaging and mission reviews. This plan governs the new student/coach scope; it does not replace unrelated platform or Universe work.

## Ownership and working agreement

- **Opus:** student, coach and parent-facing frontend; accessible interaction design; client adapters; frontend tests and browser verification.
- **Gemini:** server services, provider parsing/imports, canonical pacing calculations, persistence, indexes, scripts, backend tests and security design. Gemini alone owns server/, rules, indexes and scripts/.
- **Codex:** independent contract and integrated acceptance review when implementation is ready; no claim that review has already run.
- **Mani:** exact approval of authentication/permission changes and each deployment; academic/calendar and policy decisions.

The existing working folder contains unrelated uncommitted work. Do not reset, stash, commit or overwrite it. Use separate checkouts/worktrees and feature branches based on an agreed reviewed baseline. Suggested branches: feature/student-coach-opus and backend/student-coach-gemini. Separate branches in the same working folder do not permit simultaneous editing. If separate checkouts cannot be arranged, use a sequential folder handoff. Remote must remain https://github.com/InnovationCoach/Playground.git.

No production writes, seeds, migrations or deploys. Use demo-project Firebase emulators and synthetic fixtures; localhost alone is insufficient. Do not change authentication or permissions without Mani's explicit approval. Gemini can prepare the proposed policy and test cases while approval is pending. Provider access is a separate dependency, not assumed authorization or availability.

## Delivery sequence and assignments

| Phase | Opus deliverables | Gemini deliverables | Exit gate |
|---|---|---|---|
| 0 — Truthful baseline and contract | O0: remove production-facing sample scores, false connected labels and successful mock launch fallbacks; preserve explicitly labelled fixtures in isolated previews. Inventory existing goals/focus/review reuse. | G0: audit actual provider/backend capabilities; publish versioned request/response contracts, synthetic fixtures, permission proposal and capability states. | Disconnected, unknown, zero, stale and failed states remain distinct; failed launch cannot report success; both owners agree contracts. |
| 1 — Curriculum and three terms | O1: provider/course/unit/lesson navigation; import preview and row errors; ILP target-versus-actual display; age-appropriate lower/upper navigation using trusted cohort response. | G1: academic-year/three-term model; versioned outlines; Acellus/Edmentum/CambriLearn adapter boundary; reviewed import pipeline; canonical pacing service; cohort contract design and approved implementation. | A synthetic course from each provider maps to lessons and a term; duplicate imports do not duplicate records; calendar and pacing boundary cases pass. |
| 2 — Daily learning and coach desk | O2: Today, routines, focus room with timer/audio/tasks/notes, structured help, contextual replies; coach queue and learner detail. | G2: persistent routines/sessions and request service; assignments, statuses, versioned reviews, history and scoped queue. | Student asks about a lesson, coach replies, student sees reply at that lesson; retries, concurrent reviews and class reassignment are handled. |
| 3 — PLP and readiness | O3: three pathway choices; University initially suggested; parent discussion status; milestones; credit, portfolio/application and exam views; essay versions and recommendation requests. | G3: versioned PLP/milestones, credit and exam records, parent acknowledgement references, essay review versions and explainable readiness projections. | Synthetic upper-secondary learner completes plan-review cycle; parent sees only permitted published child information; readiness is traceable to evidence. |
| 4 — Practice and revision | O4: practice session, graduated Socratic hints, feedback, topic breakdown and revision actions; coach diagnostic view. | G4: versioned question bank and scoring; attempt/hint records; practice summaries; optional bounded AI assistance after authored baseline works. | Attempts restore correctly; hints guide without revealing the answer; explanations follow attempt/submission; practice never becomes an official exam result. |
| 5 — Integrated acceptance | O5: responsive/accessibility verification, complete student/coach/parent journeys, screenshots and frontend fixes. | G5: API/security/emulator tests, import reconciliation and failure recovery, operational/deployment proposal with rollback. | Reviewed diff, tests/build, end-to-end evidence and limitations reported; exact deployment step remains subject to Mani's written go. |

Phases are gates, not promised dates. Both agents start with phase 0. Opus can develop against agreed synthetic contracts while Gemini implements services. Integrate phase 1 before computing live-facing readiness. Deliver phases 0–2 as the first useful increment; phases 3 and 4 follow independently once their contracts are stable.

## Contract package Gemini must provide before dependent UI integration

Specify endpoint paths, methods, payloads, validation limits, response examples, error codes, pagination and authorization behavior in a companion contract. Names below are logical entities, not permission to invent parallel infrastructure.

| Entity | Minimum contract |
|---|---|
| AcademicYear / Term | School, year ID, timezone, three ordered non-overlapping terms with actual dates, holidays/non-study days, revision. Preserve old project IDs; map legacy semester labels explicitly instead of renaming stored records. |
| CourseOutline | Provider, external course ID, outline version, units and stable lesson IDs, order, optional duration/weight, original source metadata and import batch. Outline access and progress access are separate capabilities. |
| Enrollment / ProgressObservation | Learner, course/outline version, lesson/unit reference, status, original grade scale, source method, observed time, received time, verification status and superseded observation reference. |
| ILP | Learner, year, term, course, selected lessons, baseline/current targets, study days, accommodations, revision and coach adjustment history. Completion checks do not establish mastery or earned credit. |
| Cohort | Server-verified age/cohort evidence and permitted override; unknown/ambiguous remains safe existing layout. No learner-writable profile field grants access or chooses authoritative eligibility. |
| SupportRequest / Review | Learner, category, related lesson/attempt/artifact/milestone, question, attempted steps, attachments, assignee, due date, state, visibility, revision and dated history. Review records evidence version and reviewer. |
| PLP / Milestone | Pathway, student choice, parent discussion/acknowledgement status, plan revision, linked course units and artifacts, due dates, dependencies and evidence. Pathway changes retain prior history. |
| Application / Exam / Practice | Essay versions and feedback links; recommendation request status; exam type/date/original score scale/source; question version, attempts, hints and diagnostic topic breakdown. |

All sensitive reads/writes must derive school/user scope from verified server context. Client IDs are selectors, not authority. Mutations use revision checks and idempotency where retries could duplicate requests/imports/submissions. Return explicit loading-compatible empty/error/forbidden/conflict states and stable IDs. Existing mission approvals retain their semantics; a common queue may link to their authoritative workflow without duplicating approval state.

## Product and calculation rules

### Curriculum and pacing

Start with documented, authorized export formats and a manual structured outline fallback. Each provider adapter declares what it actually supports. Obtain real sample exports and provider documentation before claiming format compatibility; synthetic fixtures demonstrate the internal contract only. Do not scrape authenticated provider portals or invent APIs. Automatic sync is a later capability gated by access and reconciliation tests.

Imports require preview, identity matching and explicit commit; reject malformed rows, surface duplicates and quarantine ambiguous mappings. Re-import is idempotent. Failed imports/syncs preserve last known data and its age. Never overwrite a provider grade with a coach estimate.

Pacing uses eligible study days within dated plan windows, excluding holidays and approved pauses. Prefer explicit lesson dates; when spreading work automatically, disclose whether lessons are equally weighted or use supplied duration/weights. Show target units/lessons, actual completion, difference and last update. No denominator/date data means unavailable, not zero. Preview revised targets before saving a coach adjustment. Test holidays, zero study days, late enrollment, changed outlines, year rollover and timezone boundaries.

### Two cohorts and daily tools

Lower Secondary (11–14): small next-action list, focus/note-taking/reflection routine, goal versus actual, optional XP/streak/badges. Reward recorded learning actions; visits are not study. Avoid punitive streak loss for school holidays or approved pauses. Upper Secondary (15–18): weekly priorities and three readiness areas, retaining optional focus tools. Age/cohort is presentation context, not an entitlement change.

Reuse FocusWidget, focusStore/soundEngine, goalPlan/useGoalPlan and current portfolio services. Handle refresh/background timer recovery, user-initiated audio and reduced motion. Do not collect browsing surveillance as focus evidence.

### Coach desk and help

Request form: what I am working on; what I have tried; where I am stuck; what help I need. Categories include academic help, plan review, essay feedback and recommendation request. Suggested lifecycle: open → assigned → awaiting-student → resolved, with reopening and history. This differs from evidence submitted → returned/approved; preserve both rather than forcing one status model.

Coach overview prioritizes overdue requests, pending reviews and evidenced pacing issues. Every flag explains its reason and source date. Queue filters include class, student, category, status and due date. Preserve context when returning from a learner. Separate private staff notes from student-visible published replies; parent visibility must follow approved policy.

### PLP, parents and readiness

Offer University/Higher Education, Direct Workforce, and Entrepreneurship/Gap Year. University is an initial suggestion, not a silently agreed destination. All three include a parent discussion workflow, but acknowledgement must not falsely imply legal consent or grant access. Follow existing verified parent links; additional access awaits approval.

Academic readiness uses required/completed credits and course criteria; portfolio/application readiness uses artifact and application milestones; exam/certification readiness uses applicable diagnostics and deadlines. Display individual criteria, missing evidence and timestamps. Avoid an unexplained combined score. Map units to relevant milestone dependencies rather than implying course completion guarantees admission.

Store SAT, ACT, AP, A-Level and certification results with their original scale and provenance. Distinguish self-report, verified result and practice diagnostic. No cross-exam averaging. Only show a score estimate if a documented validated mapping exists; otherwise show topic accuracy/sample size and 'insufficient evidence'.

### Practice

Begin with educator-reviewed questions, deterministic scoring and authored progressive hints. Include question/topic/version, explanation, attempt history and actionable revision links. Track hint use separately from independent performance. Any AI hints must be grounded in the approved question/rubric, bounded, tested for answer leakage and have an authored fallback. Question content and reuse rights are required before a real exam preparation release.

## Acceptance and release evidence

Use synthetic students aged 11, 14, 15 and 18 plus unknown/ambiguous cohort; assigned and reassigned coaches; linked/unlinked parents; distinct schools. Verify denied cross-student/school reads, expired sessions, stale revisions, failed saves, offline/retry states and duplicate requests. Permission-changing implementation waits for explicit approval even if emulator tests are ready.

Run relevant unit/UI tests, API/Auth and Firestore/Storage emulator checks as applicable, and npm run build. Inspect diff against origin/main before any push. Browser checks: coach laptop, 375px student mobile, tablet, keyboard-only, 200% zoom, reduced motion, readable labels and focus restoration. Do not treat successful build as workflow acceptance.

Required end-to-end evidence: import outline → review mapping → save ILP → student completes routine/lesson → pacing changes with source label → student requests help → coach replies → student revises; plus PLP parent discussion, essay revision, recommendation request and practice diagnostic flows as those phases arrive. Verify existing Universe, PBL, goals and parent views are not regressed.

Each handoff reports work item IDs, branch/commit and baseline, changed files, contract version, exact checks/results, synthetic reproduction steps, screenshots where useful, known limits, pending decisions and next owner. No production deploy is implied by passing tests or another agent's handoff.

## Inputs needed only before the dependent milestone

- School's academic-year dates, three term boundaries, timezone, holidays and pacing policy; use labelled fixtures until confirmed.
- Provider-authorized sample outlines/progress exports, external identity mapping and supported integration documentation; do not block manual planning on automatic sync.
- Mani's approval of the concrete cohort/support/parent access policy changes before implementing those changes.
- Graduation/credit criteria, pathway-specific milestone templates, recommendation process and parent visibility policy.
- Educator-reviewed practice bank and validated score mappings if estimates are required.

## Entry points reviewed

src/features/edmentum/edmentumService.js; src/features/courses/MyCourses.jsx; src/features/school/SchoolLearningPanel.jsx; src/features/lowerSecondary/layoutSelector.js; src/features/lowerSecondary/DashboardPage.jsx; src/features/dashboard/MyDashboard.jsx; src/features/focus/; src/features/goals/; src/features/coach/CoachWorkspace.jsx; src/features/coach/universe/CoachUniverseSubmissions.jsx; src/features/parent/.
