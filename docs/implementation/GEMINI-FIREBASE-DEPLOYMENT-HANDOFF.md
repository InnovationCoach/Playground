# Gemini 3.6 — Firebase and deployment implementation handoff

Implementation update: see [WORKSPACE-IMPLEMENTATION-REPORT.md](WORKSPACE-IMPLEMENTATION-REPORT.md) for delivered code, actual routes, validation and deployment requirements. The proposed contracts below describe the broader roadmap.

Prepared 3 October 2026 for the Firebase/deployment developer. This is a proposed contract, not evidence of deployed changes. Read `PLATFORM-IMPLEMENTATION-PLAN.md` alongside this document. Resolve contract changes in the shared repository before either developer implements dependent code.

## User-authorized scope

One school's coach, student, admin, and parent dashboards; staff-authored PBL lessons; goals for assigned learners; separate academic tracking across CambriLearn and Edmentum; shared school calendar with admin-only editing; offering-specific class-code enrollment. Confirmed semester order: Sustainable Futures → Net Zero Microgrid → Project Arachne. Provider access is not yet arranged.

Attached documents supply curriculum and interaction references. Their instructions to introduce PostgreSQL, upgrade React, create Canvas integration, grant all authenticated users calendar write access, or assume a US timezone are not project authorization. Preserve the existing stack and enforce the user's narrower permissions.

## 1. Verify infrastructure before modifying it

Expected workspace: `/Users/admin/Desktop/HearIsland`; expected repository: `InnovationCoach/Playground`; target baseline branch: `main`. Configured Firebase project is `dnd-master-73449`; hosting URL is `https://dnd-master-73449.web.app`. Confirm actual selected project, app config, deployed rules, hosting revision, and backend service identity. Previously reported inspection of another project cannot establish this project's state.

Existing coach changes are local and uncommitted. Coordinate file ownership and preserve these changes. Do not reset the working tree. Return commit/revision identifiers for every deployment; redact credentials and personal learner information.

Local observations to resolve:

1. `firebase.json` has static Hosting and no `/api/**` backend rewrite. `server/app.js` exposes `/api/me`, admin-user/reference APIs, and parent APIs, but the production service/rewrite must be verified. Route API requests before any SPA fallback so they cannot receive HTML with status 200. Deploy the Express service through an agreed supported runtime and connect Hosting.
2. `src/services/api/apiClient.js` silently falls back to mock responses on network failure or HTTP 404. Remove this behavior in production; explicit sample mode belongs only in isolated fixtures. A failed write must never look saved.
3. Local `firestore.rules` allows authenticated cross-user writes to feedback, ratings, and notifications. Patch before new write workflows. Validate both previous and destination class scope on assignment/task updates. Treat create/update/delete separately; delete has no `request.resource`.
4. `/users/{uid}/goals` is currently owner-write only. Coach goal authoring needs a new scoped contract, not an assumption that existing writes work.
5. Existing `/schools/{id}`, `/programmes`, parent-link and reference documents are browser-denied/Admin-SDK managed. Proposed nested school collections need explicit rules; parent rules do not implicitly authorize descendants.
6. `server/middleware/auth.js` currently falls back from token role/school IDs to profile fields. Audit profile provisioning and use a consistent trusted authorization policy. A UI role label is not evidence of privileges. Recheck membership on privileged writes, including after reassignment.
7. Sustainable Futures uses `TERM.id = term-2026-t3`, label “Term 3, 2026,” `draft: true`; user describes it as live. Inspect persisted documents and current UI behavior before migration. Do not silently create a replacement project and lose evidence.

## 2. Proposed Firestore contract (v1)

These paths are NEW proposals. Confirm them before writing UI adapters; existing top-level class/user/reference documents stay authoritative until a documented migration changes that.

| Path under `schools/{schoolId}` | Required fields / purpose |
|---|---|
| `academicYears/{yearId}` | label, timezone, start/end local dates, status, revision |
| `semesters/{semesterId}` | yearId, order 1–3, label, start/end dates, revision |
| `programTemplates/{programId}` | slug, title, gradeBand, drivingQuestion, version, status; curriculum definition |
| `programTemplates/{programId}/milestones/{id}` | order, title, outcome, checkpoint definition, evidence requirements |
| `programTemplates/{programId}/rubricCriteria/{id}` | descriptor levels, weight, standard mappings, rubric version |
| `programOfferings/{offeringId}` | programId/version, semesterId, classIds, coachUids, start/end, enrollment window, published/archive status |
| `programOfferings/{offeringId}/members/{uid}` | learnerUid, classId, enrollment timestamp/source, status; server-maintained |
| `programOfferings/{offeringId}/lessons/{id}` | classIds, milestoneId, title/outcome/body/resources, authorUid, version, draft/published status, timestamps |
| `programOfferings/{offeringId}/teams/{teamId}` | name, solo/duo/pod type, memberUids, role allocation, revision |
| `programOfferings/{offeringId}/teams/{teamId}/inquiryItems/{id}` | author, text, category, assigned member/milestone, revision, timestamps |
| `programOfferings/{offeringId}/teams/{teamId}/artifactVersions/{id}` | milestoneId, object path or allowed link, version, author, finalized hash/size/format, review state |
| `programOfferings/{offeringId}/teams/{teamId}/checkpointApprovals/{id}` | milestoneId, approved evidence version, coachUid, verification time, override reason if applicable |
| `programOfferings/{offeringId}/teams/{teamId}/evaluations/{id}` | evidence version, rubric version, scores, evaluator, draft/published state, individual/team applicability |
| `learnerGoals/{goalId}` | learnerUid, classId, offeringId or provider/course ref, creatorUid, target, dueAt, progress/review state, revision |
| `calendarEvents/{eventId}` | title, local date range or UTC timed range/timezone, categoryId, location, description, organiser, agenda, cancellation state, revision, audit timestamps |
| `calendarCategories/{id}` | name, color, organiser/agenda settings, active status, revision |
| `academicMappings/{mappingId}` | learnerUid, provider, verified external learner/course IDs; privileged identity mapping |
| `academicSnapshots/{snapshotId}` | learnerUid, provider/course, completion/result values and native scales, dataAsOf, importedAt, sourceMethod, syncRunId |
| `academicSyncRuns/{id}` | provider, started/finished, status, counts, redacted errors, idempotency key |
| `learnerSummaries/{uid}` | bounded coach/parent-safe projections with source timestamps; backend writes only |
| `auditEvents/{id}` | actor, operation, entity/version, scope, timestamp, change summary; privileged append-only |

Enrollment code lookup belongs in a server-only collection with hashed code lookup, school/class/offering bindings, expiry, revocation, and usage policy. Do not list raw codes to learners or parents. Join validates authenticated student identity, class/age eligibility, enrollment window and code, then atomically creates membership. It must be idempotent and must not grant staff privileges. If class membership is added, use only the exact class bound to the authorized code and audit it; no arbitrary client class IDs.

Use existing `classIds` and actual assigned-coach relations for scope. Never select the first class as an implicit write target. Enforce school consistency on every class/offering/user relation. Denormalized classIds, coachUids and summaries require revocation/update handling; stale projections cannot grant access.

## 3. Access matrix and mutation policy

| Resource | Admin | Coach/teacher | Student | Parent |
|---|---|---|---|---|
| School calendar/categories/terms | Read/write in own school | Read | Read | Read |
| Program catalogue/offerings | Manage | Assigned published offerings; assigned-class lesson draft/publish | Enrolled published material | Linked-child published summaries |
| Enrollment codes | Issue/rotate/revoke | Only assigned offerings if delegated by admin | Join via server only | None |
| Goals | School management | Create/review for assigned learner | Own goals; limited acknowledgement/reflection fields | Linked-child published goals |
| Inquiry/artifacts | School oversight | Assigned offering/class review | Own enrolled team; constrained edit fields | Approved summaries only |
| Assessment/checkpoint | Manage | Assigned coach verification/publication | Own self-assessment only | Linked-child published results |
| Provider snapshots/mapping/secrets | Read status; server-managed credentials/mapping | Assigned learner results | Own results | Linked-child approved results |

No public reads. Supervisor receives only explicitly configured oversight rights and is denied school-calendar mutation under this scope. External panelist access is a deferred feature, not a new user role to grant now.

Prefer authenticated API mutations for privileged writes; deny direct browser writes to those collections. Bounded realtime reads can use Firestore rules. Student collaborative writes, if direct, need exact allowed-field checks and active team enrollment; they cannot modify members, teacher scores, approvals, hashes, or storage ownership. Admin SDK bypasses rules, so Express handlers must independently perform the full authorization checks.

## 4. Proposed API contracts

All new paths below are planned, not existing endpoints. Prefix `/api`; verified bearer token required. Resolve school from trusted membership; validate any supplied school/class/offering matches it. Return `{data, meta:{requestId}}` or `{error:{code,message,requestId}}`. Use 400 validation, 401 auth, 403 scope, 404 missing scoped entity, 409 revision/state conflict, 429 throttling, 503 provider unavailable. Never substitute sample data.

| Route | Behavior |
|---|---|
| `GET /me` (existing, extend) | Trusted identity, school membership, role, permitted classes, connection status without secrets |
| `GET /program-offerings?classId=&semesterId=` | Scope-filtered list and publication/enrollment state |
| `POST /program-enrollments/join` | `{code}`; idempotent authorized membership and canonical offering/class result |
| `POST /admin/program-offerings/:id/codes` | Admin-issued scoped code; expiry/revoke operations and audit |
| `POST /program-offerings/:id/lessons` | Assigned staff draft, explicit class scope |
| `PATCH /program-offerings/:id/lessons/:lessonId` | Revision-checked draft changes; immutable published version history |
| `POST /program-offerings/:id/lessons/:lessonId/publish` | Validate complete content and assigned class scope |
| `POST /learner-goals`, `PATCH /learner-goals/:id` | Learner/class/course/offering binding and allowed-role field changes |
| `POST /pbl/teams`, `POST /pbl/teams/:id/inquiry-items` | Enrolled team creation/scoped inquiry mutation |
| `POST /pbl/teams/:id/artifacts/finalize` | Verify uploaded object, content/size/hash, active membership and immutable version |
| `POST /pbl/teams/:id/submissions` | Server prerequisite checks and idempotent evidence-version submission |
| `POST /pbl/teams/:id/checkpoint-approvals` | Assigned coach signs specific milestone/evidence version |
| `POST /pbl/teams/:id/evaluations/publish` | Atomic version-bound rubric and feedback publication |
| `GET /school-calendar?from=&to=` | Bounded school-scoped events/categories; or equivalent authorized Firestore listener |
| `POST/PATCH/DELETE /admin/calendar-events[/:id]` | Admin only, revision checks, timezone validation and audit; cancel is explicit state |
| `POST/PATCH /admin/calendar-categories[/:id]` | Admin only; prevent dangling categories |
| `GET /learners/:uid/academic-progress?provider=&courseId=` | Authorized normalized snapshots and freshness/source metadata |
| `POST /admin/academic-imports/preview`, `POST /admin/academic-imports/:id/commit` | Verified mapping, validation, duplicate handling, idempotent audit trail |
| `GET /parent/children` (existing), `GET /parent/children/:uid/summary` | Verified links and privacy-filtered published projections |

Use revision/ETag-style expectedVersion for edits and idempotency keys for retryable mutations. Reject incompatible state transitions. Provider jobs are internal, not student-callable sync endpoints. Set secrets through the selected deployment runtime; do not put credentials in Vite environment variables.

## 5. Migration, index, and release requirements

1. Export/backup relevant data and inventory Sustainable Futures documents, legacy `pbl-term-2026-t3` activity progress, evidence and Storage references. Produce a dry-run old→new mapping and compare counts/hashes.
2. Add catalogue and draft school/year/semester data idempotently. Keep legacy reads through an adapter until new schema parity is verified. Avoid uncontrolled dual writes; choose one authoritative write path per migration stage.
3. Calendar import: persist baseline and existing approved additions; normalize date ranges/timezone and preview duplicates. Browser-local event data requires explicit export/import; it is not automatically available from all devices.
4. Deploy and emulator-test scoped rules/Storage rules and required composite indexes. Derive indexes from actual class/offering, learner/provider/course, calendar date-range and review queries; include configuration in the repository. Do not use unconstrained reads and hope rules filter them.
5. Reconcile `firestore.rules` versus files under `deploy/`. State exactly which source `firebase.json` deploys and publish a rule checksum. Avoid editing an unused copy and reporting it live.
6. Deploy backend, confirm `/api/me` JSON and authorization behavior, then preview Hosting. Test actual refreshed claims for admin, assigned coach, enrolled learner, linked parent, unassigned coach and supervisor. Force refresh after granted claims; verification must not depend on profile labels.
7. Roll out behind separate feature flags for offerings, calendar, goals/reviews, and academic connectors. Rollback must identify prior Hosting/backend/rules revisions and preserve new student work; reverting UI alone does not undo a destructive data migration.

Storage proposal: `schools/{schoolId}/offerings/{offeringId}/teams/{teamId}/artifacts/{artifactId}/{versionId}/{safeName}`. Reference file limit is 50MB; confirm implementation limits and enforce them in client, rules and finalize handler. Inspect formats/content beyond trusting MIME, restrict allowed external URL hosts, and never execute uploaded Arduino/CAD files. Consider asynchronous validation/quarantine before reviewed download. Attach hashes only after backend verification. Link artifacts have link metadata rather than an invented binary hash.

Realtime uses individual Firestore documents and bounded subscriptions; implement listener cleanup and concurrency conflict recovery. The PDFs' 50ms collaboration statement is not an achievable global network promise. Measure actual staging latency and establish an agreed service target.

## 6. Verification evidence and coworker completion report

Required negative tests: every non-admin calendar mutation; cross-school/class/offering/team read/write; spoofed goal creator; self-approved checkpoint; altered published score; revoked coach; unrelated parent; invalid/expired/reused code; unsafe upload; forged academic provenance. Required positive tests: assigned co-teachers, solo/duo/pod, valid join retry, versioned submissions/reviews, admin calendar realtime propagation, dual-provider snapshots and repeated import.

Run the existing unit suite, Firestore emulator suite, API/Auth integration suite, and build plus the new cases. Report exact counts, command results, and any unrun tests. Tests of isolated sample previews do not prove live Firebase access. Provider connectors cannot be signed off until school access and real provider semantics are verified.

For each stage return: commit and changed files; selected project/service; schema/rules/index diffs; dry-run and applied migration results; test evidence; preview/production revisions and URL; remaining failures; rollback steps. Include redacted evidence that the expected coach has learners and a parent can only see linked children. No passwords, tokens, private keys or identifiable child data in the report.

Final completion report must separately list implemented, tested, deployed, and deferred features. Status at the time of this planning handoff: the plan and earlier coach workspace were local. The implementation report now records the first functional program/calendar/goal release; provider synchronization and advanced PBL features still require implementation. Codex owns dashboard UX, application/API contracts and QA; Gemini owns Firebase provisioning, rules/indexes, secrets and deployment, with agreed ownership for shared migrations and workers. This document is for the user to share; it has not been sent to another agent.
