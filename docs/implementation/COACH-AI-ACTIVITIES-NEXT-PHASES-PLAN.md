# Coach AI Activity Builder: coordinated plan for Phases 2 and 3

Prepared 4 October 2026. This is a work allocation and acceptance plan, not confirmation that a phase has shipped and not an instruction to deploy immediately.

## 1. Objective and starting state

Enable a coach to describe a STEAM activity, generate a validated draft using the school AI connection, refine individual blocks, review safety and publish to an assigned class. Then offer an optional personal AI connection for Gemini, Anthropic or OpenAI, with protected credentials and transparent usage.

Read these sources before taking a task:

- `COACH-AI-ACTIVITIES-AGENT-BRIEFS.md`
- `COACH-AI-ACTIVITIES-CONTRACT.md`
- `COACH-AI-ACTIVITIES-LOG.md`
- This plan and the latest phase review/deployment report.

The contract governs data and API shapes. This plan does not silently extend it. Record unresolved contract questions in the handoff log; Claude resolves them in the contract before builders implement dependent behavior.

Phase 1 was reported ready on `feature/coach-activities-p1`, with its isolated checkout at `/private/tmp/hear-island-coach-p1`. Reported commits: `059c63e`, `03d8a8d`, `b41f808`, `bc58739`. The recorded build had no chunk above 500 kB; tests were 425 unit, 93 API and 529 combined. These are historical results, not the acceptance baseline for later phases.

At preparation time, the shared main checkout's log records the student redesign release but does not yet record a Phase 1 merge/release or completed AI cloud setup. Verify actual Git and cloud state rather than assuming either happened. Phase 1 must be integrated with the later student dashboard/navigation work on main before Phase 2 branches.

The project lead's previous instruction assigned Gemini the Phase 1 refinement, merge and release. That exception applies to Phase 1. For subsequent phases, use the ownership below unless the project lead changes it.

## 2. Agent ownership and handoffs

| Agent | Responsibility | Deliverable | Must not do independently |
|---|---|---|---|
| GPT-6 | Feature implementation: routes, adapters, Studio/settings, usage enforcement and tests | Small commits on the phase branch; build/test results; browser evidence; ready-for-review entry | Merge to main, deploy, edit firebase.json, or invent contract fields |
| Claude | Contract decisions, independent security/correctness review, refinement, accessibility and content quality | Approved contract amendments; review fixes; review report; verified merge | Assume a provider's output is safe or skip independent testing |
| Gemini 3.6 | Firebase infrastructure, secret bindings, KMS/IAM, budget controls, deployment and live smoke tests | Infrastructure readiness entry; release and rollback report | Add feature behavior or deploy an unreviewed feature branch |

One editor owns a phase branch at a time: GPT-6 builds → Claude reviews/refines → Claude merges → Gemini deploys from main. Transfer ownership explicitly in the log. Do not message or launch other agents automatically merely because this document describes their responsibilities.

Use separate checkouts for feature and infrastructure work. Never switch another agent's checkout, discard uncommitted work, force-push, or rewrite main. Preserve unrelated files, including scratch work. If cloud setup needs code/config binding changes, agree file ownership and a separate infrastructure branch before editing shared function entrypoints.

Each handoff records date, owner, branch, commit SHAs, actual test counts, browser checks, limitations, next owner and exact next action. Never record credentials or private learner content.

## 3. Dependency order

| Gate | Work | Owner | Starts after |
|---|---|---|---|
| G0 | Verify Phase 1 review, integration with current main, merge and release report | Gemini, under the existing Phase 1 assignment | Phase 1 ready handoff |
| G1 | Resolve Phase 2 contract gaps and freeze implementation details | Claude | Phase 1 code inspected; can run alongside infrastructure |
| G2a | School Secret Manager connection and function binding ready | Gemini | Existing cloud configuration inspected |
| G2b | KMS, personal-key IAM and budget setup ready | Gemini | Existing cloud configuration inspected; can run alongside Phase 2 |
| G3 | Build Phase 2 with provider mocks | GPT-6 | G0 merge and G1 contract decisions |
| G4 | Review and merge Phase 2 | Claude | GPT-6 Phase 2 ready handoff; G2a available for real-provider verification |
| G5 | Release Phase 2 and verify coach-to-student flow | Gemini | G4 merged, G2a ready and required deployment authorization |
| G6 | Build Phase 3 | GPT-6 | Phase 2 merged; G2b readiness logged; Phase 3 contract decisions resolved |
| G7 | Review and merge Phase 3 | Claude | GPT-6 Phase 3 ready handoff |
| G8 | Release Phase 3 and close the feature | Gemini | G7 merged and required deployment authorization |

Mock-backed Phase 2 implementation does not require live provider credentials. Real generation and its release do. Phase 3 can begin after Phase 2 merges and KMS readiness is logged, but its production release must preserve or explicitly account for the Phase 2 release state.

## 4. Contract decisions before dependent implementation

Claude owns resolution; GPT-6 supplies implementation constraints; Gemini supplies infrastructure constraints. Document exact request/response shapes, error behavior and migration impact. Do not choose undocumented defaults in code.

1. **Generated draft → lesson identity and provenance.** The current lesson request includes activity data but no explicit generated-draft reference. Define how the server identifies the authorized stored draft without trusting client provenance, how coach edits are validated, and how AI provenance remains intact after edits. A manual PATCH must not become a bypass for AI safety confirmation.
2. **Draft edit/regeneration concurrency.** Define the source of truth for local edits, draft persistence, stale regeneration results and concurrent tabs. The listed routes lack a general draft-update route/revision shape. Resolve that gap before introducing one. Define whether a regenerated block can overwrite unsaved coach edits and how stale results are rejected.
3. **Retry and usage accounting.** Specify how both provider calls in the one-repair retry contribute usage, how failed output with billable tokens is accounted for, whether retries consume additional rate slots, and what happens if the provider succeeds but storing the draft fails. The current successful-call accounting wording needs an explicit interpretation.
4. **Concurrent monthly caps.** Specify how simultaneous requests avoid exceeding the cap, including reservation/settlement or another reviewed method, and how abandoned requests release capacity. Do not run provider calls inside retryable Firestore transactions. Agree any additional browser-denied records and tests before creating them.
5. **School key meaning.** Confirm whether the existing named secret represents this application's default school connection or separate credentials per school. Do not invent a per-school key mapping. Confirm eligible schools, configurable cap ownership and usage-month timezone.
6. **Phase 2 key source.** Personal connections are not available until Phase 3. Define the Phase 2 error for personal-key requests; keep the UI on the school source and never silently substitute a connection.
7. **Envelope encryption.** The brief requires envelope encryption while the contract names ciphertext and kmsKeyVersion. Agree encrypted data-key storage, authenticated metadata, algorithm/version handling and decryption format before Phase 3. Do not replace the requirement with an undocumented direct-KMS scheme.
8. **Draft expiry and privacy.** Specify list/use behavior for expired drafts and the cleanup mechanism. Review safe handling of learner personal information pasted into the coach's free-text prompt: allow-listing context alone does not remove it. Define rejection/redaction and readable errors without silently retaining or logging private content.
9. **Operational behavior.** Resolve whether admin unpublish already exists and what smoke test is applicable; the briefs reference it without listing an endpoint here. Clarify legacy placeholder-route compatibility, user-facing usage scope, provider/model configuration and revoked-connection status behavior.

The existing 45-second per-provider timeout is a hard request limit; the brief's under-30-second generation goal is a performance target. Define an overall request budget for the optional second call and loading/error messages rather than promising an unverified completion time.

## 5. Gemini: infrastructure readiness

### School connection — required for Phase 2 live use

- Inspect the existing project, runtime service account and secret resources; reuse correct resources instead of duplicating them.
- Configure `school-gemini-api-key` in Secret Manager, grant secret access only to the necessary runtime identity, and bind the secret to the API function using the established Firebase mechanism.
- Remove the old plaintext environment copy after verifying the replacement. Never print values or include them in commands, logs, screenshots or reports.
- Coordinate function-entrypoint changes with GPT-6 so adapter code and secret binding agree. Verify the current SDK/API and supported model against official provider documentation before choosing a production model.
- Log secret resource name/version reference, runtime identity, binding commit and access verification, with no secret values.

### Personal connections — required for Phase 3

- Inspect/create key ring `growth-hub` in `us-central1` and symmetric key `coach-ai-keys`, with the brief's 90-day rotation policy.
- Grant the runtime service account KMS encrypt/decrypt access on that key only. Expose `KMS_KEY_NAME` using the established configuration path.
- Configure project spend alerts at 50/90/100% and the requested Generative Language API spend alert. Budget notifications are alerts, not spending stops; application caps provide separate enforcement.
- Configure approved draft expiry/index requirements after Claude settles the contract. Expiry cleanup does not replace API checks on expired records.
- Verify encryption/decryption using disposable test data. Verify access denial for an identity without the intended permission. Record rotation and recovery implications without revealing encrypted contents or keys.

Readiness entry: resource names, IAM scope, config commits, verification results and any remaining blockers. Infrastructure work may run in parallel with mock-backed feature work but must not edit the same branch or files concurrently.

## 6. GPT-6: Phase 2 — AI drafts using the school connection

Branch `feature/coach-activities-p2` from verified merged main. Reuse the Phase 1 Studio, Player, existing lesson pipeline and shared validators. Do not add personal-key settings.

### P2.1 Server generation and draft lifecycle

- Implement `server/lib/ai/gemini.js` to the adapter interface: complete and minimal key test, normalized usage, timeout/cancellation and safe mapped errors. Read current official provider documentation during implementation; keep model selection configurable.
- Implement contracted generate, regenerate-block, list-own-drafts and delete-own-draft routes under the program offering.
- Check current school/role/class/offering access before any provider request. Check draft ownership, expiry and current assignment before reading, regenerating, saving or deleting.
- Build prompts through the shared prompt functions using only approved context. Never include learner identities, evidence, goals, support notes, messages or rosters.
- Parse output, validate the full spec and retry once using validation errors. Reject a second invalid result with AI_BAD_OUTPUT. Do not return raw provider responses to the browser.
- Enforce prompt ≤2,000 characters, regeneration instruction ≤500, spec ≤50 KB, at most 20 blocks and all existing field limits.
- Force server provenance; return safetyWarnings without silently changing the coach's content.
- Save drafts with the contracted seven-day expiry and approved usage-accounting behavior. List only the caller's own drafts, newest first, at most 20.
- Regeneration must preserve the requested block type and leave the complete spec valid, including charts that reference data tables.
- Connect generated drafts to lesson saving using Claude's agreed mechanism. Preserve AI provenance through edits. Require the existing safety confirmation when publishing, and set reviewer/time on the server.
- Retire or explicitly handle the hard-coded placeholder endpoint according to the agreed compatibility decision. Do not leave it presented as real AI output.

### P2.2 Rate and cost controls

Implement in Phase 2, before real provider calls are exposed:

- 10 generate/regenerate requests per coach per rolling hour, enforced server-side.
- Configurable monthly school cap; default 2,000,000 tokens.
- Atomic enforcement across concurrent requests, retries and process instances according to the reviewed contract.
- Clear RATE_LIMITED and AI_CAP_REACHED responses; no provider call after a rejected limit check.
- Safe counts-only operational logs. Do not log prompts, generated specs, credentials or provider errors that contain sensitive request details.

### P2.3 Coach experience

- Add a Describe your activity form for prompt, age band, duration, materials, standards and milestone context.
- Show generating, validation repair, completed, unavailable, timeout, denied and limit-reached states honestly. Preserve manual drafting when AI is unavailable.
- Load generated output into the existing editor and preview. Provide a clear Regenerate this block action with an editable instruction, according to the approved edit/concurrency behavior.
- Show safety warnings beside affected fields/blocks and in the review dialog.
- Show AI-assisted provenance and distinguish an unreviewed draft from a published coach-reviewed activity.
- Keep manual and generated activities in the same existing publication/submission workflow; AI never publishes automatically.
- Add EN/ZH/TH strings, keyboard controls and announcements; mark translations for native review. Preserve grouped student navigation and private-dashboard/portfolio separation.

### P2 acceptance

A coach generates a validated draft using the school connection, edits it, regenerates one block, previews and explicitly publishes it. An enrolled student completes it and submits evidence through the existing XP workflow. Another class cannot see it. Invalid output, injection attempts, missing configuration, expiry and usage limits produce readable failures without losing manual edits or bypassing publication review.

Handoff: append **Phase 2 ready for Claude review**, commits, fresh counts, browser evidence and limitations; stop feature work.

## 7. Claude: Phase 2 review and refinement

Take branch ownership after the builder handoff.

- Independently inspect the complete diff against the latest main and approved contract decisions.
- Test prompt injection, provenance spoofing, manual-edit downgrades, foreign-school/class/draft access, revoked assignments and concurrent regeneration.
- Inspect outgoing provider requests using test spies to prove excluded learner fields are absent. Inspect logging/error redaction.
- Test both generation attempts, accounting settlement, concurrent cap/rate enforcement and expiry behavior.
- Evaluate educational quality: meaningful learner actions, reflection, suitable age band, explicit assumptions and units, readable safety guidance and no unsupported claims of standards alignment. Use the existing sample/program context; do not invent advanced simulation kinds under the current schema.
- Refine the form/editor, review dialog, loading/error states and accessibility. Test mobile at 390 px, tablet and desktop, keyboard-only flow and reduced motion.
- Run all required suites and build. Document mocks separately from real-provider checks and request designated credentials only if a real-provider check cannot otherwise be completed.
- Record findings, fixes, residual limitations, test counts and readiness for release. Merge through the repository's approved main/PR workflow only after checks pass.

## 8. GPT-6: Phase 3 — optional personal AI connections

Branch `feature/coach-activities-p3` from Phase 2 merged main, after KMS readiness and relevant contract decisions are logged.

### P3.1 Protected connection endpoints

Implement contracted GET/PUT/DELETE `/api/coach/ai-connection` with current authorized coach identity and no cross-coach access.

- Accept provider, model and API key only in the PUT request; validate them before use.
- Make one minimal provider key-test call. Reject invalid keys without replacing a working connection.
- Encrypt through the approved envelope scheme and store only its encrypted representation plus safe connection metadata. Support the agreed version/rotation format.
- Decrypt only for the current server request. Never cache plaintext credentials across requests or echo them in errors, responses, logs or analytics.
- GET returns only connected status, provider/model, last4, status and approved usage fields.
- DELETE removes the connection and produces an honest disconnected state. Define in-flight behavior according to the reviewed contract; do not promise provider-side revocation merely because the app connection is removed.

### P3.2 Providers and source selection

- Implement `server/lib/ai/anthropic.js` and `openai.js` to the existing adapter interface, using current official provider documentation.
- Apply equivalent timeout, cancellation, JSON validation, repair retry, usage normalization and redaction to every provider.
- Preserve the school default. Personal usage must use the authenticated coach's own connection only.
- A missing/revoked personal key must not silently fall back to school credentials. Offer an explicit switch to the school source.
- Keep Phase 2 rate/cap enforcement across all providers and key sources according to the approved usage scope. Do not introduce a second, weaker limit implementation.

### P3.3 Settings and usage UI

- Settings › AI assistant: provider/model selection, password-style key entry, Test & save, Remove and readable connection status with only the last four characters displayed.
- Keep the raw key only in transient input memory while entering/submitting it; clear it promptly after completion/dismissal. Never use local/session storage, persisted form state or analytics for it.
- Show key source clearly in Studio and safe per-coach monthly request/token counts. Label unavailable counts honestly.
- Show invalid key, unavailable provider, timeout and removed-connection states without exposing provider request bodies.
- Explain concise privacy and billing implications: only approved activity context is sent; personal provider usage may incur charges; displayed app usage is not a provider billing invoice.
- Preserve accessibility, translations and lazy loading.

### P3 acceptance

Designated coach test connections can be saved, used, switched and removed. One coach cannot read/use another coach's connection. Firestore holds no plaintext key. Invalid replacement preserves the existing working connection. Missing/revoked credentials produce safe errors and require explicit school-source selection. Each shipped provider passes its adapter tests and documented live verification, or is explicitly withheld from the released selection until verified.

Handoff: append **Phase 3 ready for Claude review**, commits, fresh counts, provider verification status and limitations; stop feature work.

## 9. Claude: Phase 3 review

- Review envelope encryption implementation, authenticated metadata, least-privilege usage and key-version handling with Gemini.
- Search source, logs, error responses, fixture snapshots, browser storage and telemetry paths for accidental credential exposure, using disposable test keys and without printing real values.
- Test cross-user access, invalid/revoked keys, failed replacement, removal, source switching and concurrent usage enforcement.
- Confirm that all providers apply the same contract and school/source scope. Confirm no automatic fallback on personal-key failure.
- Run all suites, build and coach/student browser regression checks. Record real-provider coverage separately from mocks.
- Refine and merge only after blocking defects are closed; log remaining nonblocking limitations and release readiness.

## 10. Shared verification matrix

| Area | Required cases | Primary owner |
|---|---|---|
| Generation | Valid JSON; fenced JSON; malformed output; one repair; repeated invalid output; empty output; timeout; provider unavailable | GPT-6; Claude verifies |
| Authorization | Signed out; student/parent blocked from coach routes; foreign school/class; foreign draft; revoked assignment; stale token with changed profile | GPT-6; Claude verifies |
| Publication | No automatic publish; forged AI/manual provenance; edit preserves AI origin; explicit safety confirmation; server reviewer; immutable published lessons | GPT-6; Claude verifies |
| Privacy | Context allow-list; no learner records transmitted; pasted personal-data handling; no prompt/output/secret logging | Claude |
| Limits | Rolling-hour boundary; simultaneous calls; retries; cap boundary; month rollover; failed write/accounting; key-source switches | GPT-6; Claude verifies |
| Credentials | Invalid key; safe replacement; encrypted storage; no key in GET/errors; cross-coach denial; KMS unavailable; rotation; removal | GPT-6 + Claude + Gemini |
| Rules | Browser reads/writes denied for AI collections and any approved new operational records | Claude tests; Gemini deploys |
| UI | Loading/empty/error/denied; edit preservation; keyboard/focus; mobile overflow; translations; reduced motion | GPT-6 + Claude |
| Student regression | Published lesson visibility; all blocks; local answer recovery; retry ID; evidence/XP; privacy and portfolio separation | GPT-6 + Claude |
| Release | Exact merged SHA; secret/KMS bindings; unauthenticated 401; CORS; signed-in real-provider flow; rules; rollback references | Gemini |

For every phase run `npm run test:unit`, `npm run test:api`, `npm test` and `npm run build`. Use mocks and disposable emulators in automated tests. Coordinate ports; stop only your own emulators. Capture actual counts—do not hard-code historical totals. No output chunk above 500 kB. Any schema or dependency change needs appropriate regression coverage.

## 11. Gemini: release checklist for each phase

Release only verified merged main after the review handoff and applicable project-lead authorization. A planning document alone is not immediate authorization to spend money, alter IAM or deploy.

1. Verify project/environment, clean checkout, exact merge SHA, required checks and secret/config readiness.
2. Record prior Hosting release, API revision, rules version and relevant config references. Define recovery for any irreversible data/config change before applying it.
3. Deploy required rules/indexes first, then API function, then Hosting. Preserve unrelated infrastructure.
4. Smoke-test new routes returning 401 JSON when signed out; expected CORS policy; browser-denied collections; current assigned-class authorization; generation, review, publish, student evidence and usage counters.
5. For Phase 3, verify designated test connections and removals; do not expose their credentials. Verify provider failure does not silently use the school key.
6. Verify existing manual activity and dashboard/portfolio flows. Test staging-only workflows on staging, and identify which checks actually ran in production.
7. Investigate failures and roll back affected components if needed. Hosting rollback alone does not revert API, rules, configuration or data; document a coordinated recovery.
8. Write a dated phase deployment report with merge SHA, release IDs, function revision, fresh checks, actual live results, previous-release references and remaining limitations. Append the release handoff to the main log.

## 12. Final completion and deferred scope

The feature is complete when both phases have reviewed merges and verified releases; school generation and optional personal connections work; coaches review before publication; enrolled students complete activities and earn existing evidence XP; cross-class access is denied; and credentials/private learner information remain protected. Add an AI activity page to the staff testing guide and a short coach guide covering generation, safety review, key source, limits and troubleshooting.

Deferred beyond this contract: AI-generated images, arbitrary executable simulations, new microgrid simulation engines, primary-age AI activities, automatic grading/publishing, and new sharing or portfolio permissions. A requested advanced STEAM program should be planned separately against approved learning standards and an explicit simulation schema extension, rather than silently added to Phase 2 or 3.

## 13. Agent start instructions

**GPT-6:** Read the briefs, contract, log and this plan. Verify your phase's dependency gates. Build only the assigned phase on its feature branch. Reuse existing shared code. Implement approved contract decisions, tests and localized accessible UI. Log readiness for Claude and stop; do not merge or deploy.

**Claude:** Read the same sources. Resolve the listed contract decisions before dependent implementation. After each builder handoff, take branch ownership, independently review and refine, verify all checks and browser behavior, record your review, and merge through the approved repository workflow. Hand the exact merged SHA to Gemini through the log.

**Gemini 3.6:** Verify the Phase 1 release handoff and infrastructure readiness first. Coordinate school secret binding and KMS/IAM without touching another agent's files. After each reviewed merge and applicable authorization, deploy from main, smoke-test the actual release, record rollback references and report the outcome. Do not start feature phases on behalf of the builder unless the project lead explicitly reassigns them.
