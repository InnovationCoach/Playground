# My Universe — shared contract for the two-mission pilot

2 November 2026 · Contract revision **0.1.1** · Author: GPT/Codex

**Status: technically ACCEPTED by Opus 5.5 and Gemini 4 Argon for the first deliverable.** Opus's own response §13 and Gemini's own response §8 explicitly accept revision 0.1.1 with no unresolved technical blockers. Section 9 resolves their earlier requested changes; the [review record](MY-UNIVERSE-G02-REVIEW-2026-11-02.md) records the actual decisions and verification scope. This is a concrete interface/content contract, not an implemented service, an educator approval or a release authorization. See the [verified base](MY-UNIVERSE-G01-BASELINE-2026-11-02.md) and [team ownership](MY-UNIVERSE-THREE-AGENT-ASSIGNMENTS-2026-11-02.md).

The pilot covers `thalassa-wind-survey` and `spacecraft-journey`. It preserves the current explorer, existing route IDs, draft history and complete text view. No new biome, live AI, XP, public sharing or scheduler is required.

## 1. Decisions and scope

| Decision | Contract |
|---|---|
| One content source | One reviewed versioned bundle derives the frontend mission presentation and server registry. No separately maintained answer/unlock metadata. |
| Identity | Every saved draft/submission carries `releaseId`, `missionId`, `missionVersion`, `routeId`, `taskId` and `policyVersion`. Server resolves and verifies these against known artifacts. |
| Drafts | Existing `0.1.0-draft` content stays intact. Revised content is proposed `0.2.0-draft`; no production submission accepts either until the specific version is educator-approved and published. |
| Pilot outcome | **Review only. No new planet grant in the initial proposed pilot policy.** Thalassa/Ignis remain public; Boreas remains gated/unresolved. Its requirement and real grant policy need Mani/educator decision before activation. Do not ship the demo journey→Boreas rule as a final policy. |
| Challenge/support | Challenge belongs to the task/route. `supportMode` is `guided` or `independent` and may change without losing work. Existing `routeId: guided|advanced` is a legacy task identity, not the new support setting. |
| Evidence | Typed, bounded notebook parts are submitted with a reflection; practice checks/solutions are available without granting credit. |
| Review | Keep wire statuses `submitted`, `returned`, `approved`. UI says “Returned for revision.” Editorial review of content is a different role/workflow. |
| Withdrawal | Mission availability is independent of submission review status. A withdrawn task can contain an earlier approved submission; never erase or relabel that review. |
| Environments | Use `ocean-station` and `basalt-fissures`; no new renderer required. Boreas has no surface. |

“Review only” is the lead's conservative policy proposal, not a claim that Mani has accepted a new access rule. If a grant demonstration is requested later, add an explicitly selected destination/capability and versioned policy in emulator fixtures first. Approval of a mission does not imply permission to land where no renderer/environment exists.

## 2. Mission and evidence definitions

### Shared mission metadata

The reviewed authoring bundle must contain:

| Field | Type / requirement |
|---|---|
| `schemaVersion` | Content schema version, separate from catalog version. Proposed `1.0.0`. |
| `id`, `version`, `status` | Stable mission ID; immutable task content version; editorial `draft|reviewed|published|retired`. Moving to a new stage creates a new immutable release envelope; reviewed content bytes do not mutate. |
| `title`, `drivingQuestion`, `scenario`, `role`, `decision` | Learner-facing story and concrete decision. Plain text, not executable/HTML content. |
| `planetIds`, optional `locationId` | All references resolve in the compatible catalog; the wind location is `weather-mast`. |
| `routes[]` | Stable `id`, distinct `taskId`, provisional `challengeLevel: 1..5`, `gradeBand`, supported `supportModes`, versioned steps and artifact definition. |
| `steps[]` | Preserve existing step IDs where the task is retained. Supported `number|choose|reflect` plus notebook parts; any new executable interaction requires reviewed code. |
| `evidenceRefs`, `claimRefs`, `limitations` | Reproducible teaching data and explicit scope. Sources support individual claims, not merely the page theme. |
| `alignment[]` | PE/source URL, band, SEP/DCI elements, CCC or explicit no specified CCC, required artifact evidence, assessment boundaries, `claim: supports`, review state. |
| `rubric`, `exemplar`, `completionPolicyRef` | Human-review evidence criteria and the exact outcome policy. |

Keep existing fact tags compatible. Add richer evidence classification through the versioned contract: `synthetic-teaching-set`, `observed-measurement`, `model-derived`, `scientific-explanation`, `hypothesis`, `fictional-world`. These new labels are proposed evidence fields, not silently accepted additions to the current catalog enum.

Each evidence record includes stable ID, version/hash, publisher/source or authored-synthetic attribution, observation interval when applicable, retrieval/version/query, units/time basis, processing, quality/uncertainty, use/attribution conditions and reviewer state. Synthetic data never acquires “real observation” status because its method is scientific. A source string saying “standard physics; review pending” is insufficient publication provenance.

### Pilot routes and scenarios

| Mission / route | Proposed demand and band | Preserved work | New reviewed evidence task |
|---|---|---|---|
| Wind / `guided` / `wind-capacity-factor` | Challenge **2**, grades **6–8**; guided or independent support | Hours → weighted full-power hours → capacity factor → why averaging speed first fails → model application. | Data-quality note; compare two supplied **daily** energy plans against jointly agreed criteria; recommendation/limitation/next measurement. Keep the dataset small. |
| Journey / `guided` / `journey-rates` | Challenge **2**, grades **6–8**; given criteria and bounded calculations | Engine options; seconds/days; food; recommendation. | Structured comparison and route diagram from selections; one contingency; distinguish fictional case values from physics. |
| Journey / `advanced` / `journey-mass-power` | Provisional challenge **4**, grades **9–12**; educator confirms | Rocket-equation propellant comparison; supplies; inverse-square panel area; model limitations. | Prioritized criteria and explicit tradeoff argument. Retain as an optional separately assessed task; never assign it automatically from learner age or label it merely reduced support. |

The existing guided journey's ion speed implies about 69.4 days at the supplied distance, whereas the advanced case independently supplies 140 days. Revised content must explicitly distinguish those authored scenario assumptions or reconcile them in a new version; do not imply both are the same calculated trip. Preserve historical versions/results.

**Wind source/method:** the authored 168-hour band record gives 56.5 full-power hours and capacity factor `56.5/168 ≈ 0.33631` (display `0.34`). At the assumed 1 MW rating that is **56.5 MWh for the week**, approximately **8.07143 MWh/day on average**. These are calculations from synthetic inputs, not measurements of Thalassa. The definition relates produced energy to maximum possible energy over the same period. [EIA glossary](https://www.eia.gov/tools/glossary/index.php?id=C).

The new application step says: **“Using this synthetic week's average, compare the two supplied daily energy budgets. What can you conclude, and what additional observations would you need to assess power at night?”** Replace the earlier “turbines run around the clock” hint with a limitation about variable output. The scenario's old `night`/`all` challenge wording and interpretation must be corrected/versioned by Opus after model/content review; a daily average alone is not evidence of hourly service reliability.

**Journey method:** preserve the simplified ideal rocket-equation calculation as an optional model with explicit assumptions, not a full flight predictor. Published physics claims need actual sources such as [NASA's ideal rocket-equation reference](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/). All transfer distance, speed, mass, supplies, panel and fictional star values remain labeled scenario assumptions. Food/supplies are not real-life recommendations.

**NGSS:** wind and guided journey support [MS-ETS1-2](https://www.nextgenscience.org/pe/ms-ets1-2-engineering-design) only when the learner systematically evaluates competing designs using agreed criteria and evidence; arithmetic alone is insufficient. The PE's practice is argument from evidence and its DCI is ETS1.B; its foundation does not specify a CCC. Use systems/energy lenses as explicit additional instruction. Advanced journey can provisionally support [HS-ETS1-3](https://www.nextgenscience.org/pe/hs-ets1-3-engineering-design) after adding prioritized constraints, tradeoffs and an appropriate real-world transfer/evidence task; using an exponential formula is not proof of full alignment. An educator must approve the actual tasks and exemplars.

## 3. Typed notebook and submitted artifacts

Initial pilot needs no new upload service. Use structured inline evidence. `artifact-reference` is explicitly disabled for both pilot missions until a later permission contract is reviewed. No arbitrary remote URLs or changed artifact visibility.

| Part kind | Fields | Limits / rendering |
|---|---|---|
| `text` | `partId`, `kind`, `text` | 1–2,000 characters; plain text; includes an oral explanation's approved transcript if used. |
| `table` | `partId`, `kind`, `caption`, `columns[]`, `rows[][]` | At most 8 named columns, 30 rows and 200 characters per cell; row width must match columns. Accessible caption/header table. |
| `choice` | `partId`, `kind`, `selectedId`, `reason` | `selectedId` must be an authored option; reason max 2,000 characters. “Need more evidence” can be an authored valid option. |
| `diagram` | `partId`, `kind`, `nodes[]`, `edges[]`, `description` | At most 12 nodes/20 edges; IDs resolve; labels max 120 characters; description max 2,000. UI creates from selections, not arbitrary drawing code. Equivalent ordered list/description required. |
| `artifact-reference` | Reserved future shape only | Disabled in this pilot; reject with `400 VALIDATION_ERROR` if supplied. No file, external URL or cross-service reference is accepted. |

Mission definitions specify required part IDs and kinds. Both UI and server validate against the exact task version. A short accessible evidence alternative is reviewed for equivalent reasoning, not forced into a handwriting/image requirement. Prefer one composite table/text artifact over requiring every medium.

Wind expected parts: weighted calculation table; daily-plan comparison/choice; data-quality note; limitation/next-measurement explanation. Journey guided: calculation/comparison table; diagram or its equivalent descriptive route; recommendation/contingency. Advanced: calculations, prioritized comparison and limitations.

Practice answers are also saved by `stepId` as authored choice IDs or bounded text. Numeric answers preserve `rawText` (0–64 characters, including an empty field) plus parsed `value: number|null`; the server recomputes the parse rather than trusting the supplied value. Self-check feedback, hints used and worked-solution views are not grades or access evidence. Switching support preserves answers. Switching task route opens that route's own draft and never silently reinterprets the old answers.

Budgets: no more than 8 artifact parts; reflection 20–2,000 trimmed characters for the current pilot transport; combined UTF-8 request body at most **64 KiB**; bounded stored document below the same budget; reject unknown fields. Minimum text length is a transport check, not an assessment of reasoning. Opus must present non-text alternatives appropriately. Data/role/content limits are enforced server-side and in direct database rules where applicable.

## 4. States, identity and outcomes

**Learner draft:** `editing` and `saved/recovered/conflict/offline` are presentation/save states, not review decisions. Save `revision`, `updatedAt`, exact task identity, support, active step, answers and artifact. Server resolves owner/organization from authenticated authoritative records; client cannot choose them.

**Submission review:** `submitted → returned → a new submitted revision`, or `submitted → approved`. A submission's evidence snapshot is immutable once sent. A returned attempt is retained; resubmission receives a new ID and references `previousSubmissionId`. One open review per organization/learner/mission family, across versions and routes, unless a future explicit policy changes that rule.

**Availability:** `open|in-review|withdrawn|retired|unknown` with `canStart`, `canResume`, `canSubmit`, `reasonCode`, safe `reason`, `availabilityRevision`, `checkedAt`. `in-review` includes unpublished drafts: available only in explicitly isolated emulator/preview fixtures, never accepted in production. `withdrawn` pauses new start/resume/submission while preserving work and past decisions. `retired` preserves history; whether a prior in-progress task can finish must be explicitly authored, not assumed. `unknown` is fail-closed for assessed operations.

Check availability on start/resume and again on the server at submission/review. The client cannot override withdrawal with a cached release or a boolean. Offline users retain recoverable notes, but cannot start/resume the assessed task or submit until fresh status is obtained. Public exploration remains available; missing mission service is not an invented learning failure.

Every approval response has a server-authored outcome:

```json
{
  "type": "reviewed-only",
  "grantIds": [],
  "messageKey": "universe.mission.reviewed",
  "nextMissionIds": []
}
```

Future `access-granted` outcomes must name actual durable grants, target IDs and the exact policy. No UI text may say “approve and unlock planet” when the outcome is review-only. `isVerified` in an access response means the access decision came from the service; it does not certify learning mastery.

## 5. API contract and compatibility

Keep existing endpoint paths where possible, and use **`contractVersion: "1.0.0"`** in proposed JSON request/response envelopes. This changes staged Go 4 payloads: update both clients and server in one candidate. The currently observed live site has no usable same-origin mission API. If Gemini finds a deployed older client/service, supply an explicitly reviewed adapter or versioned route rather than silently treating missing version fields as valid. Unsupported contract versions fail with `CONTRACT_VERSION_UNSUPPORTED`.

All operations require normal authentication and the server-resolved role/organization except publicly published metadata if separately designed. Missing/ambiguous organization denies access; never fall back to `org-welearn`. Reviewers need a permitted role **and** the same organization **and** current assigned-class scope where applicable. Direct Firestore reads must enforce equivalent boundaries or be denied. Artifact references also retain their own permissions.

### Endpoint matrix

| Endpoint | Proposed behavior |
|---|---|
| `GET /api/universe/missions/:missionId/availability?releaseId=...&missionVersion=...&routeId=...` | Exact-task current availability; no “open” inferred from a bundle's stale editorial label. |
| `GET /api/universe/missions/:missionId/draft?releaseId=...&missionVersion=...&routeId=...` | Retrieve the caller's exact draft or successful `draft: null`; return save revision and timestamp. |
| `PUT /api/universe/missions/:missionId/draft` | Version-bound save with `expectedRevision` (0 creates); conflict returns `DRAFT_CONFLICT` and current revision, no silent last-write overwrite. |
| `POST /api/universe/missions/:missionId/submissions` | Atomically create one immutable submission from the exact payload/task; require idempotency. |
| `GET /api/universe/missions/submissions/mine?missionId=...&missionVersion=...&routeId=...&limit=...&cursor=...` | Caller-only history, bounded pagination; limit default 20/max 50, opaque cursor. `[]` only on a successful empty result. |
| `GET /api/coach/universe/submissions?status=submitted&limit=...&cursor=...` | Same-organization and assigned-class queue; bounded pagination; controlled status enum. |
| `POST /api/coach/universe/submissions/:id/review` | Atomic review of the exact submitted revision, with expected revision and idempotency; returns outcome and durable audit/event reference. |
| `POST /api/universe/access` | Known published destinations only; returns effective policy/version and requirement key/text matching the enforced rule. Unknown destinations fail closed. |

Save/submit/review all require an **`Idempotency-Key`**, 16–128 safe ASCII characters; scope it to organization + caller + operation. Same key and normalized payload returns the committed original result. Reusing a key with a different payload yields `IDEMPOTENCY_KEY_REUSED`. Do not create a second submission because a network response was lost. The same key cannot replay across users/organizations.

### Submission example (synthetic wire example)

```json
{
  "contractVersion": "1.0.0",
  "releaseId": "pilot-fixture-20261102",
  "missionVersion": "0.2.0-draft",
  "routeId": "guided",
  "taskId": "wind-capacity-factor",
  "supportMode": "guided",
  "policyVersion": "pilot-review-only-0.1.0-draft",
  "previousSubmissionId": null,
  "reflection": "The daily estimate supports a comparison, but it cannot prove night-time reliability.",
  "evidence": [
    {
      "partId": "limitation",
      "kind": "text",
      "text": "The input is one synthetic week; hourly timing is not represented."
    }
  ]
}
```

This example demonstrates shape, not a complete acceptable wind artifact; production must reject its draft release/version and its missing required parts. Fixtures must exercise both structural validation and semantic task requirements. No `learnerUid`, `orgId`, reviewer role, score, approval or grant may be supplied as writable authority.

Submission success: HTTP 201 with `contractVersion`, `submissionId`, `submissionRevision: 1`, `attemptNumber`, exact task identity, `status: submitted`, server `createdAt`, current availability and `outcome: null`. An idempotent replay returns HTTP 200, the same committed identity/result and `idempotentReplay: true`. Recheck current authorization and availability before exposing stored results; a replay is not permission to restart a withdrawn task. Re-fetch current review status after replay instead of treating its historical creation status as current. Never respond with only an optimistic local status.

Review request: `contractVersion`, `decision: approved|returned`, `note`, `expectedSubmissionRevision`. Returned decisions require a learner-safe reason/actionable note (1–1,000 trimmed characters); approved notes are optional. Reviewer UID/organization/time are server fields. A successful result includes exact reviewed identity, final status/revision, server timestamp, `auditEventId` and outcome. A stale competing decision gets `REVIEW_CONFLICT`, unless it is the exact same idempotent replay.

Draft save request: `contractVersion`, exact task identity, `expectedRevision`, `supportMode`, `activeStepId`, bounded `answers[]` and `evidence[]`. The server authorizes owner, validates known steps/parts and returns `draftId`, incremented `revision` and `updatedAt`. A conflict allows explicit recovery/merge/copy in UI; the server never silently discards the competing draft.

### Access response example (synthetic)

```json
{
  "contractVersion": "1.0.0",
  "releaseId": "pilot-fixture-20261102",
  "policyVersion": "pilot-review-only-0.1.0-draft",
  "evaluatedAt": "2026-11-02T02:40:00Z",
  "destinations": {
    "thalassa": {
      "status": "available",
      "evaluatedRule": "public",
      "isVerified": true,
      "requirementKey": null,
      "requirementText": null
    },
    "boreas": {
      "status": "locked",
      "evaluatedRule": "boreas-policy-unresolved",
      "isVerified": false,
      "requirementKey": "universe.boreas.policyPending",
      "requirementText": "This expedition is not open yet."
    }
  }
}
```

The server-supplied requirement key/text follows the effective rule. Localized UI must not substitute a different Ice/Climate or journey requirement. A failed refresh clears usable gated access to checking/not-connected; an old positive result is not authority for a new entry. Preserve public destinations' authored public exploration behavior.

## 6. Errors, concurrency and durable review

Use the existing error envelope, extended in a compatible explicit contract version:

```json
{
  "contractVersion": "1.0.0",
  "error": {
    "code": "MISSION_WITHDRAWN",
    "message": "This investigation is paused for a correction. Your saved work is kept.",
    "retryable": false,
    "requestId": "example-request-id",
    "field": null
  }
}
```

| HTTP | Codes / required meaning |
|---|---|
| 400 | `VALIDATION_ERROR`, `CONTRACT_VERSION_UNSUPPORTED`, `IDEMPOTENCY_KEY_REQUIRED`; no private internals. |
| 401 | `UNAUTHENTICATED`; keep local recovery, do not show empty remote history. |
| 403 | `FORBIDDEN`, `ORG_CONTEXT_REQUIRED`; inaccessible objects may return 404 to avoid existence leaks. |
| 404 | `NOT_FOUND` for unknown/inaccessible tasks or artifacts; no unknown destination can grant access. |
| 409 | `MISSION_NOT_OPEN`, `MISSION_WITHDRAWN`, `MISSION_RETIRED`, `CONTENT_VERSION_UNAVAILABLE`, `POLICY_VERSION_UNAVAILABLE`, `SUBMISSION_ALREADY_OPEN`, `DRAFT_CONFLICT`, `REVIEW_CONFLICT`, `IDEMPOTENCY_KEY_REUSED`. |
| 413 | `PAYLOAD_TOO_LARGE`; preserve local work. |
| 429 / 503 | `RATE_LIMITED` / `SERVICE_UNAVAILABLE`; retryable, optional `Retry-After`; never substitute a fixture or an empty queue. |

Network failure is a typed client state `not-connected`, not an invented server JSON response. All list functions distinguish `loading|loaded|error`; only `loaded` with zero items means no work. A missing status must not enable Send.

Use an atomic open-review slot keyed by server-resolved organization + learner + mission family, or an equivalent enforceable design chosen by Gemini. Create the immutable submission, open slot, idempotency record and audit event in a transaction or equivalent atomic operation. Review must atomically verify status/revision/organization/scope/current availability, record the decision, release the open slot and persist the outcome/audit event. An outbox can deliver external audit projections after commit; failure to project cannot make an already successful decision appear uncommitted.

Do not query then create a random independent document to enforce uniqueness. Do not grant by searching only for an approved mission ID. A future grant binds the exact eligible task/version/routes, verification, organization, policy and migration rule. Existing historical approvals are preserved and do not create new policy entitlements by inference.

## 7. Release compatibility and migration

An immutable release manifest binds `releaseId`, `schemaVersion`, catalog version/hash, mission versions/content hashes, evidence hashes, renderer/workstation capability version, policy version and human review records. Draft previews use separate labeled fixture releases. Never fake review records or content signatures.

Old visits retain their release/task data. Server policy explicitly lists which published versions can continue; “latest release differs” alone does not invalidate valid saved work. Unsupported/withdrawn versions get truthful recovery/status responses, not silent content replacement. A legacy reflection-only submission can be displayed in read-only history but must not be upgraded to a fully evidenced pilot submission or grant without a defined human-reviewed migration.

The workstation schema introduces richer metadata through an adapter/code release, not by adding arbitrary enums to existing v1 JSON. New content cannot demand unknown scene kinds, models, assets or remote code. Shared pure schemas/validators are proposed under `shared/universe`; Opus/Gemini must agree packaging/location before code is added. Gemini owns packaging scripts/configuration; Opus owns renderer integration.

## 8. Acceptance evidence and owner review

| Case | Expected result / primary owner |
|---|---|
| Both pilot IDs in frontend and server | Same task/version/route metadata from one bundle; Gemini + Opus. |
| Wind calculation | 168 h; 56.5 full-power h; CF about 0.33631; daily model claim limited; GPT + educator. |
| Close/reopen, switch support, second device | Work recovered with exact route/version and timestamps; no silent overwrite; Opus + Gemini. |
| Two simultaneous submissions | One open review; retry returns original; no duplicate grant/audit; Gemini. |
| Wrong/missing organization; colliding class IDs | List, direct read, draft, submit, review and access deny appropriately; Gemini. |
| Returned revision | Previous artifact immutable; new attempt linked; actionable feedback visible; Gemini + Opus. |
| Different route/version history | Exact binding, no first-match-by-ID leakage; Opus. |
| Service failure versus empty | Distinct readable UI states; Send/gated entry not enabled from unknown state; Opus. |
| Withdrawn older pinned task | Start/resume/submit blocked by current server status; work/history retained; Gemini + Opus. |
| Coach approval | Review-only outcome for this proposed policy; no claim of mastery or a planet unlock; Gemini + Opus. |
| Draft fixture reaches production | Rejected even if a client sends preview flags; Gemini. |
| Artifact bounds/permissions | Invalid shapes, excess bytes, arbitrary URL or unauthorized reference rejected; Gemini; accessible equivalents rendered by Opus. |
| Integrated candidate | Relevant fresh unit/UI/API/rules/build results and named-device evidence; GPT coordinates. No old report counts recycled. |

**Requested Opus confirmation:** revision 0.1.1 resolves B1–B4 and C1–C10 as mapped in the review record. Confirm the final interface or name any unresolved blocker in your own response. This is not an O02 writer turn.

**Requested Gemini confirmation:** revision 0.1.1 resolves GB1–GB8 with the explicit refinements in §9, including collision-safe keys and exact-timestamp pagination. Confirm the final interface or name any unresolved blocker in your own response. This is not a J02 writer turn.

**Open human decisions:** actual curriculum/science reviewer; final pilot grade/task ratings; Boreas requirement/grant policy; representative device and measurer; applicable implementation/release scope. These do not prevent contract review. They do prevent claiming curriculum approval, final access policy or measured device readiness.

## 9. Resolved owner refinements for revision 0.1.1

This section supplies the missing details identified in the two actual reviews and controls less-specific wording in §§1–8.

### 9.1 Accessible artifact requirements and raw answers

Each route has an explicit `requiredParts` list. IDs are unique; exactly one submitted part must satisfy each rule. Duplicate IDs/unsupported kinds fail validation. Alternatives preserve the same reasoning, while the coach judges the actual evidence.

```json
{
  "requiredParts": [
    {"partId": "comparison", "anyOfKinds": ["table", "text"]},
    {"partId": "route-plan", "anyOfKinds": ["diagram", "text"]},
    {"partId": "recommendation", "anyOfKinds": ["text"]}
  ]
}
```

This is the journey structure; wind has its own named weighted-results/comparison/limitations rules. A composite alternative explicitly identifies the rubric evidence it covers. The same pure validator/bounds run on client and server; no task supplies executable validation code. `artifact-reference` is disabled in both pilot missions.

Numeric draft answers are `{stepId, kind: "number", rawText, value}`. `rawText` allows 0–64 characters so a cleared field can save with `value: null`; preserve units/comma-formatted input. The server parses the raw value itself. `supportMode` appears in draft/submission/history as context only, never a grade or penalty input.

Preserve `routeId`, but rename revised learner-facing routes to avoid confusing task and support: wind “Wind energy estimate”; journey `guided` “Journey timing”; `advanced` “Mass and power tradeoffs.” Display support, challenge and grade band separately.

### 9.2 Draft recovery and shared-device isolation

Use API-owned `missionDrafts`, not an arbitrary owner-writable nested map. `expectedRevision: 0` creates revision 1; a mismatch returns authorized `error.details.currentDraft` with `DRAFT_CONFLICT`. Recovery/merge is explicit.

Adopt the reviewers' bounded local-recovery proposal for authenticated non-anonymous users with verified organization context: schema-versioned account/organization/task keys under `welearn.universe.draft.v1:`, at most 64 KiB per draft and six cached drafts per profile. No tokens, approvals, grants or private originals from another service. Persistent cache is subject to existing school/shared-device policy; if prohibited, use memory only and truthfully label unsaved work as not recoverable after reload. This contract does not change that policy.

On sign-out, account switch **or organization switch**, synchronously clear old learner work/status/access from UI/memory, cancel or ignore old in-flight responses, and purge other-context Universe draft keys. Never load cached learner work before authentication/context resolves. Anonymous, unauthenticated and fixture-preview sessions use memory only. Cache never means submitted/approved. If full, do not silently evict unsynced work: show storage/recovery status and continue in memory. Server saves are the cross-device recovery source.

Keep the existing no-localStorage safeguard for the public live explorer and anonymous/preview exploration; test the new authorized notebook path separately. Saved UI copy distinguishes “saved on this device,” “saved to account,” and “not saved.”

### 9.3 Coach queue and learner history

Both list endpoints return `{contractVersion, submissions, nextCursor}` and successful-empty versus error remains explicit. Authenticated record responses use `Cache-Control: private, no-store`. Generic/shared caches must not hold learner records.

Every item includes:

| Fields | Definition |
|---|---|
| `submissionId`, `submissionRevision`, `attemptNumber`, `previousSubmissionId` | Per-record revision starts 1 and advances on review; family attempt number increases across submissions. These are distinct counters. |
| `releaseId`, `missionId`, `missionTitle`, `missionVersion`, `missionContentHash`, `routeId`, `taskId`, `supportMode`, `policyVersion` | Exact authoritative identity/display snapshot; never client authority. |
| `learnerUid`, `learnerDisplayName`, `orgId`, `classIds` | Scoped fields needed for review; display name from permitted organization records, never an email fallback. |
| `status`, `reflection`, `evidence` | Immutable work snapshot and current `submitted|returned|approved` decision. |
| `previousCoachNote`, `coachUid`, `coachNote`, `createdAt`, `reviewedAt` | Authorized previous feedback snapshot/current review and server timestamps; null if absent. |
| `availability`, `outcome`, `legacyFormat` | Current task availability, server outcome/null and explicit legacy reflection-only flag. |

Previous feedback must resolve to this learner's actual previous returned attempt. Exact identity selects the editor/history; other compatible versions appear only in explicitly labeled read-only history. Do not pick the first matching mission ID.

### 9.4 Shared bundle, capabilities and release identity

Both owners accept repository-root **`shared/universe/`**, pure ESM/JSON without runtime dependencies. GPT owns shared content/schema/validators; Gemini owns packaging/configuration and server adapters; Opus owns frontend/renderer imports. No runtime file is created or reassigned by this contract.

Proposed files: `releaseManifest.json`, mission definitions, `capabilities.json`, pure validators. Each published build imports a specific manifest, providing UI/server the same `releaseId`, catalog hash, task hashes and policy version. A legacy catalog gets an explicit adapter mapping; no release ID is invented from catalog version alone.

Fixture releases/modules use separate preview/emulator entry imports and never enter the production import graph. Prefix checks alone do not isolate a fixture. The capability record declares contract/capability versions, installed `sceneKinds: ["ocean-station", "basalt-fissures"]`, `workstationKinds: ["mission", "simulation"]`, enabled artifact kinds and `artifactReferenceEnabled: false`. Opus verifies the declaration against compiled code; GPT authors it; Gemini checks compatibility and owns any config changes.

Gemini's packaging acceptance is source-based feasibility, **not a fresh build result**. J02 must prove Vite/preview/Vitest imports and an isolated Functions bundle resolve these relative modules without a parent checkout. Do not report “100% compatible” as measured before those checks.

### 9.5 Retry, paging and error details

Fresh submission: 201. Replay: 200 and `idempotentReplay: true`. Save/review return 200, with the same replay indicator when applicable. The idempotency hash covers normalized body **plus method, endpoint target, organization, caller and contract version**. Do not normalize away raw learner input. Recheck current authorization before returning stored data, then refresh current review/availability state as specified in §5.

Errors gain bounded allowlisted `error.details: object|null`. `SUBMISSION_ALREADY_OPEN` returns `{openSubmissionId}` only for the authorized learner/context. `DRAFT_CONFLICT` may return that caller's `currentDraft`; `REVIEW_CONFLICT` only permitted revision/status. Foreign/unknown IDs reveal no open submission.

GET requests advertise `X-Universe-Contract-Version: 1.0.0`; mutation bodies include `contractVersion`. Any mutation version header must agree with the body. A future batch form is `POST /api/universe/missions/availability` with up to 25 exact task tuples; it is not needed for the two-mission pilot.

Paging orders by descending server `createdAt` then document ID. An opaque base64url cursor can carry exact `{seconds, nanoseconds}`, final document ID and filter fingerprint. **Do not truncate to milliseconds:** records inside one millisecond could be skipped. Validate size/types/precision and reapply organization, role/class scope and filters on every request. Cursor contents never authorize access. Gemini validates the actual indexes and bounded merging across class-query chunks; no unbounded fetch-all/sort queue.

### 9.6 Storage, authorization and evidence boundaries

Server-only collections: `missionSubmissionLocks`, `universeIdempotency`, `missionDrafts`; direct client reads/writes denied. Use collision-safe IDs from SHA-256 of a canonical JSON tuple, not ambiguous unescaped `__` concatenation:

- Open slot: `[orgId, learnerUid, missionId]`.
- Idempotency: `[orgId, callerUid, operation, idempotencyKey]`.
- Draft: `[orgId, learnerUid, releaseId, missionId, missionVersion, routeId, taskId, policyVersion]`.

Submission/slot/idempotency/audit commit atomically. Review reads current record revision, slot and withdrawal/authorization state, then commits decision/slot/audit/outcome together. All roles require explicit matching organization; coaches/teachers also need current class scope. **No self-review or new platform-admin bypass.** Universe context must distinguish explicit identity from the middleware-generated `org-welearn` fallback; rejecting missing route fields does not remove that fallback.

Bound `universe-v1` to explorer bookmarks/preferences, without arbitrary nested mission drafts, trusted completion, role or entitlement fields. Rules must account for overlapping permissive matches. Submission direct reads must enforce equivalent current scope/field access or be denied entirely; pilot clients use APIs. An API's minimized response cannot be undermined by broader raw-document reads. Rules/index deployment remains a separate step.

Pilot artifacts are labeled learner evidence for **human coach review**. Client Hex-Grid challenge flags are not authoritative completion. No new workstation-verification service is required merely to submit an explanation/table. Any advertised server-verified metric or automatically decisive result must be recomputed from bounded versioned inputs using the **actual reviewed model**. Do not invent night-storage, budget or ecological metrics, or require exact `0.34` as an observed value. Deterministic reference calculations are supported; model outputs remain distinct from measurements and human approval.

### 9.7 Content resolutions and remaining gates

- In a new Thalassa scenario version, remove `night` and dependent `all` requirements from the mission-linked assessment. Preserve unrelated default Hex-Grid projects/save keys. A new daily-balance synthesis needs its own ID/criteria. Historical drafts remain intact; educator review of wording/model scope remains required.
- Revised journey scenarios explicitly distinguish the guided rate example from the advanced 140-day ion case. Labels/limitations prevent presenting them as results of identical inputs. G03 supplies the full versioned pack.
- A later catalog version gives Boreas neutral pending-policy wording. Service-supplied requirements follow the effective rule. No new grant is introduced by the proposed review-only pilot.
- Unknown/offline availability still allows reading briefings, evidence and the learner's own notes; only assessed start/resume/submit pauses. Public exploration remains usable.
- Add account/organization switching and late network responses to acceptance: no draft, status or access data crosses contexts.

Technical agreement does not activate cache on prohibited devices, approve curriculum/task ratings, settle Boreas's final rule, authorize source implementation beyond the current first deliverable, or authorize merge/deployment/publication. No next implementation writer turn is assigned here.
