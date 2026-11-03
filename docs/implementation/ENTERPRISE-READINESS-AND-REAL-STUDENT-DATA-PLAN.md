# Enterprise readiness and real student data — director's implementation plan

Date: 2026-10-06. Reviewed local main at `0d118a5`, including audit fixes `b76b927` and student-profile merge `6d1500e`. Planning only: no product, backend, rules, configuration or production data changes. This plan complements the existing Coach AI Activity Builder phase plan; its enterprise stages are separate from those feature phases.

## 1. Assessment of Gemini's update

The update improves roster filtering, goal display, recorded engagement, validation and explicit editor closure. It does not establish enterprise readiness or verify the deployed version. There is no fresh authenticated live audit in this review. The reported 492-unit-test run excludes Firestore rules/economy tests and is not a complete backend/security release gate.

Independent verification performed: `npx vitest run tests/coach-roster-stats.test.js tests/activity-builder.test.jsx`: **40/40 passed across two files** (3 roster/stat tests, 37 editor tests). The 492-test total and latest build in Gemini's report were not independently rerun here. The earlier 591-test full-emulator result applies to the reviewed student-profile commit, not automatically to the newer backend changes.

### Remaining findings to resolve first

| Finding | Evidence | Required correction / evidence |
| --- | --- | --- |
| Time remains partly estimated | `CoachDashboard.js` calculates `else hoursSum += 0.5` when an activity record has no duration. Explicit zero durations also hit this fallback. | Remove invented duration; show recorded total plus coverage/unknown counts. Reject negative/nonfinite duration. Define elapsed versus active time and units. |
| Roster fallback scope remains | `loadData()` falls back to a default class, then `listUsers`, then all-user collection reads when the assigned roster is empty. | Fail closed to the current coach's active school/class assignments; empty and denied states must remain empty/denied. Verify API/rules enforcement. Code alone does not prove unauthorized access succeeds. |
| New roster test does not exercise the loader | The first test filters its own mockDocs with copied logic; the constructed CoachDashboard instance is not used to load data. | Invoke the actual loader with mocked queries and scoped API responses; test empty class, mixed roles, other school, revoked coach and suspended learner. Add emulator integration tests. |
| Goal representation is ambiguous | Render code reads `progress`, `progressPercent`, completion flags/status; it does not read `completedGoals` despite report wording. Numeric values accept fractions and percentages. | Define one canonical contract and adapt actual legacy goal writes. Test completedGoals, zero, invalid values and migration; distinguish personal goals from assigned work. |
| Activity engagement is not yet a defined metric | Any nonempty record counts as active; UI retains a fixed five-mission label. | Define started/completed/currently active over a documented time window; derive mission counts from the program. Separate records from observed engagement. |
| Cleanup is partial and can break Undo | `cleanupUnreferencedMedia` only receives previously saved paths on save/item edit/delete. It never enumerates previews abandoned without a save. Immediate deletion can invalidate old image paths retained in Undo history. | Add delayed, reference-aware cleanup with grace period, retries/metrics and concurrency-safe asset lifecycle. Test saved A → replace B → Save → Undo → Save. |
| Cleanup lacks meaningful tests | Existing personalization API Storage mock has no file delete implementation; deletion errors are swallowed. | Add assertions for actual deletions, preserved shared references, failed deletion retry, unsaved preview cleanup and concurrent reattachment. No ignored error may be reported as successful cleanup. |
| Editor navigation protection is incomplete | Close confirmation and beforeunload exist. Client-side route changes can unmount without beforeunload. | Verify sidebar, hash route, browser Back and program switching; implement a route guard/draft recovery where needed. Localize confirmation and test keyboard behavior. |

Immediate priorities: tenant/assignment scoping, accurate telemetry, and safe media lifecycle. No claim that all audit issues are closed until those checks pass.

## 2. Agent responsibilities and coordination

| Owner | Responsibility | Handoff |
| --- | --- | --- |
| Codex / director | Architecture and data contracts; frontend/workflow implementation; acceptance matrix; integrate review findings; maintain release ledger | Reviewed feature SHA, tests, browser evidence, known limits to Claude |
| Claude | Independent code/security review, UX/accessibility refinement, educational design and adversarial testing | Severity-ranked findings and signed-off exact SHA to director |
| Gemini | All Firebase/backend work: Auth, APIs, rules, indexes, Storage, jobs, secrets, migrations, infrastructure and deployments | Backend commits, emulator results, staging evidence, deployment/rollback records |
| Human school lead | Authorized roster source, pilot cohort, roles, data-policy decisions, learning outcomes and user acceptance | Pilot approval and discrepancy resolution |
| Human privacy/legal and operations owners | Applicable-country review, customer agreements, support/incident ownership and commercial release approval | Approved documents and operational readiness |

These are assignments for subsequent work, not agents already dispatched. Use isolated branches/checkouts and small PRs; one owner per shared file at a time. Agree frontend/backend request/response schemas before editing. Never use main as a shared scratch branch. Record implementation SHA, review SHA and deployed SHA separately. Firebase changes remain Gemini-owned.

## 3. Stage E0 — establish a trustworthy release baseline

Owners: Codex specifications, Gemini backend corrections, Claude independent review.

- Close findings above. Replace demo/default-class fallbacks with explicit scoped access; label unavailable metrics honestly.
- Maintain a route-by-role matrix: administrator, assigned coach, enrolled student, linked parent, supervisor; include empty/new school, suspended users, revoked assignments and two-school isolation.
- Re-run complete unit, API, Firestore/economy and Storage security suites against the integrated revision, plus build. Add regression tests around actual runtime paths rather than reproducing implementation logic in tests.
- Gemini deploys to staging only after review; test program creation, join-code enrollment, manual/AI activity generation, editing, publishing, student evidence, coach feedback, calendar visibility and private portfolio boundaries with real authenticated test accounts.
- Record deployed SHA, test counts, screenshots and rollback release. Eliminate release-blocking defects.

Exit gate: exact reviewed staging revision passes the end-to-end role matrix and cross-school denial tests; no fabricated statistics or destructive cleanup regression. Production rollout is a separate authorized action.

## 4. Stage E1 — data foundation and safe school onboarding

Owners: Codex contract/admin workflow; Gemini data model/import/API/rules; Claude review. School lead supplies source and approvals.

Start with a small authorized cohort in one school after E0, not a bulk production upload. Until the school authorizes identifiable records, use synthetic records; real data must not enter agent prompts, logs or committed CSVs.

### Data contract

- Stable school, class, membership, offering, enrollment and learner identifiers. Auth UID is distinct from school-issued student ID; do not match solely by name/email. Membership is scoped to school and class, with active/archived/suspended states and academic year.
- Minimum learner fields: school-scoped external ID, display name, age band, class assignments and account status. Add email only when required for the chosen authentication method. Parent contacts/verified links are separate restricted records. No diagnoses or sensitive support details in general profile/roster exports.
- Record source, schema version, import job ID, actor and timestamps. Separate demo records from real tenants. Validate actual deployed structures and migrate incrementally; do not destructively redesign existing IDs.
- Define who can see personal goals: private dashboard remains owner-only; assigned educational goals are a separate contract. Coaches/parents do not gain blanket access to private personalization or support records.

### Import workflow

1. School administrator uploads the agreed CSV template through a restricted interface.
2. Server validates encoding, required columns, types, school/class authority, duplicate external IDs and account collisions; reject spreadsheet-formula content in exported cells.
3. Dry-run shows created/updated/skipped/error counts and per-row actionable errors; no data writes yet.
4. Administrator approves a specific preview/job version. Worker applies bounded idempotent batches, retry checkpoints and a complete import audit trail.
5. Reconcile source count against active roster and enrollments; failed rows remain visible for correction. Provide a safe rollback/compensating plan that preserves preexisting users and learning submissions.
6. Invite/provision accounts without shared passwords or committed credentials. Student enrollment codes are expiring/rate-limited enrollment tools, not substitutes for identity authentication. Verify guardian/student relationships through school-approved process.

Exit gate: rerunning the same import produces no duplicates; invalid rows never partially create accounts/memberships; foreign-school imports are denied; source and roster totals reconcile; school approves pilot roster. Real import requires source, school authority and destination approval, none supplied in this planning request.

## 5. Stage E2 — complete the daily learning product

Owners: Codex learner/coach/parent workflows; Gemini scoped persistence and APIs; Claude UX/educational review.

- Coach creates a program, sets classes, creates rotating enrollment codes, assigns activities, reviews evidence and gives feedback. Lifecycle: draft, reviewed/published, archived; revision conflict behavior must be clear.
- Student has a photo/banner private space, goals, today's work, progress, feedback and clear next actions. Saving survives reload and device changes; private content is excluded from shareable portfolio audiences.
- Year/month/week school calendar with coach editing and school/class/parent scope; timezone/date handling and cancelled/updated events work across dashboards. Google Calendar integration is an optional connector with explicit permissions and synchronization rules after native calendar reliability.
- Parents see only verified linked learners' authorized learning summaries/events. Administrators manage classes, coaches, enrollment and guardian access; deactivation revokes access promptly.
- Define server-validated events: activity started, meaningful interaction, evidence submitted, feedback recorded, goal updated. Include school/class/offering/activity, event ID, timestamp and schema version. Use idempotent handling and documented retention.
- Specify metric numerator, denominator, window, timestamps and missing-data coverage. Time recorded is not learning quality; measured outcomes and rubric evidence are separate.
- Test mobile, keyboard, screen readers, low bandwidth and interrupted sessions. Support English/Thai copy with human translation review. Use WCAG 2.2 AA as acceptance target, not an unverified certification claim.

Exit gate: teacher → learner → feedback → parent flow completes with no support intervention in moderated pilot sessions; persistence and role boundaries pass; usability issues have measured evidence and assigned owners.

## 6. Stage E3 — enterprise security, privacy and operations

Owners: Gemini infrastructure/security implementation; Codex admin controls and integration; Claude adversarial review; human privacy/ops sign-off.

- Enforce tenant isolation server-side and in Firestore/Storage rules. Verify every API, export, file URL, dashboard query and background job with two-school fixtures. No frontend filter is a security boundary.
- Staff/admin MFA and customer-required SSO; school-scoped role delegation, least privilege and session revocation. Account recovery must not disclose learner records.
- Data inventory/classification, purpose limitation, guardian/school authorization, retention, account export/deletion, backup expiration and end-of-contract deletion. Explicit subprocessors, AI/voice-service disclosures and data location decision.
- Keep learner PII and support notes out of AI prompts by default; review logging, analytics and error reporting for sensitive data. AI drafts require educator review and safety confirmation before publication.
- Audit privileged actions without storing learner content in logs. Secure file handling/downloads, dependency scanning, rate limits, secret rotation and external security assessment/remediation.
- Separate staging and production; staging uses synthetic/deidentified data. CI gates, monitored staged rollouts and rollback. Prove backup restoration in an isolated environment, with proposed RPO ≤24h and RTO ≤4h until customer needs/engineering cost are agreed.
- Define availability/error/latency dashboards and alerts, incident severity, escalation contacts and school communications. Proposed initial target: 99.5% monthly availability, then evidence-based enterprise SLA; do not sell unsupported guarantees.

Exit gate: zero unresolved critical/high access or data-loss findings; restore drill passes; owner/retention/incident procedures approved; school can obtain its data and leave the service.

For US customers, determine applicable FERPA/COPPA obligations with qualified review. School consent is limited to the authorized educational context and does not authorize unrelated commercial uses. For Thailand/international customers, resolve local requirements and cross-border processing separately. Do not label the product compliant or certified solely on test results.

## 7. Stage E4 — rigorous STEAM content and AI builder

Owners: Codex activity features; Claude content/UX assessment; Gemini provider controls and infrastructure; educator validates learning design.

- Preserve the current reviewed school-managed AI builder before implementing personal API-key connections from the separate Phase 3 plan. Personal keys are not a prerequisite for a school pilot.
- Create program-specific libraries, starting with Sustainable Futures / District Net-Zero Resilient Microgrid: generation/storage dispatch, demand response, critical-load outage resilience, lifecycle carbon/cost and equity tradeoffs. Review mathematical assumptions, units, edge cases and expected results.
- Map activities to specific NGSS performance expectations, practices and crosscutting concepts through educator review. Record standards source/version and rubric evidence; avoid broad unsupported alignment labels.
- Simulations need consequential learner decisions, changing outputs, prediction, evidence and reflection. Reuse safe supported activity schemas; arbitrary executable scripts/HTML are not a shortcut for custom simulations.
- Version templates, published activities and rubric changes; maintain reproducible examples and age/language variants. Teachers can edit generated drafts and retain provenance.
- Define school AI quotas, spend alerts, timeout/fallback, prompt-injection defenses and provider data-processing terms. Test requests for excluded learner data; manual creation must remain available.

Exit gate: educator approves a complete program sequence; pilot demonstrates observable learner work; AI unavailable/limited conditions retain manual workflows without data loss or unsafe publishing.

## 8. Stage E5 — paid pilot and commercial packaging

Owners: director and school lead; Gemini operational/cost evidence; Claude UX; human commercial/legal owners.

- Select one buyer and one initial school cohort; suggested starting range 20–50 students and 2–5 coaches, adjusted by school. Record baseline onboarding time, completion evidence and support demand.
- Run 4–6 weeks after readiness gates, as a planning range rather than a promised launch date. Weekly review of login failures, teacher workload, student completion, school-isolation incidents, upload/save failures and AI cost.
- Price from observed hosting, Storage, support and AI costs. Prefer an annual school license with a student band and included AI quota; agree overage and budget controls. Invoiced pilot first; self-service billing can follow validated demand.
- Prepare onboarding/training, service/support terms, data-processing agreement, subprocessors, accessibility statement, security questionnaire, deletion/export procedure and buyer-facing demonstration using synthetic accounts.
- Establish pilot pass/fail criteria before starting: no unresolved critical/high security defects; all required accounts reconcile; core role workflows succeed; reliability and support targets meet the agreed thresholds; school accepts outcomes and renewal value.

Exit gate: school signs pilot acceptance and a commercial order; operating cost supports sustainable pricing. Marketing claims match tested capability. No real student photos or work in sales materials without separate explicit authorization.

## 9. Stage E6 — district-scale release

Start only after paid-pilot acceptance. Prioritize according to actual buyer requirements.

- Multi-school district administration, SSO and roster integration (evaluate OneRoster/SIS/LMS needs before choosing a connector); scoped delegated administrators and academic-year rollover.
- Pagination, indexed queries and aggregation replace per-student fan-out where load tests show need. Set a named target, e.g. 10 schools/5,000 learners with 500 concurrent sessions, and validate representative workflows before claiming capacity.
- Load/cost testing, quota isolation by tenant, accessible reporting/export, billing entitlements, customer support processes and disaster-recovery evidence.
- Independent security assessment, accessibility evaluation and procurement readiness. SOC 2 work is a separate organizational evidence program if buyers require it, not a badge AI agents can claim from code review.

Exit gate: named capacity/latency/cost budgets met, customer-specific contracts and procurement checks pass, release/rollback and support are staffed.

## 10. Next implementation assignments

1. **Codex:** publish contracts for scoped roster, canonical goal progress, recorded duration and navigation/Undo acceptance tests. Fix frontend estimates/fallbacks and route guards on a feature branch only after backend compatibility is agreed.
2. **Gemini:** implement and test tenant-scope enforcement, reference-aware delayed media cleanup and signed-URL refresh behavior. Run complete emulator/API/Storage tests and record exact backend/release revision. No mass real-data import yet.
3. **Claude:** independently test empty/foreign-school roster, telemetry without duration, progress contract, saved-image Undo, navigation loss and real picker UX. Report findings against exact SHA; do not self-certify the builder's tests.
4. **Director + school owner:** choose target market, identify pilot school/authorized roster source, agree data minimization/retention and authentication. Then start E1 import dry-run tooling with synthetic records.

No automatic deployment or data-import authorization is implied by this plan. Director records readiness; human release owner authorizes production actions.

## Reference guidance

- FTC COPPA FAQ: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- US Department of Education, third-party providers under FERPA: https://studentprivacy.ed.gov/resources/responsibilities-third-party-service-providers-under-ferpa
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/

These sources guide acceptance planning; jurisdiction applicability and contractual commitments require qualified human review.
