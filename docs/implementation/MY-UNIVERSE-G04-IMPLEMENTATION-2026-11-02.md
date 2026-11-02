# My Universe — approved pilot implementation

2 November 2026 · GPT/Codex coordination record

Mani wrote **“approved”** after the G03 completion report. This authorizes proceeding with the local pilot implementation and review. It is recorded as Mani's product approval; no separate educator identity, credential, science/curriculum sign-off or production release is inferred. The accepted G03 bytes remain unchanged.

## Refreshed base and work locations

Fresh `git ls-remote` and fetch verified:

| Line | Commit |
|---|---|
| main | `3956efc714e75716f9ef79a77950034f4eeef6ef` |
| Existing frontend / Go 3 / Go 4 chain | `96684f9b7e9402f249b3b87ad716f4a75761c6c6` |
| Existing workstations | `b35f8b2c2f9eca1697c9b7560126edf44b4b73d4` |

The new valid standalone clone is `/private/tmp/my-universe-pilot-20261102`, branch `codex/universe-pilot-integration`. A local merge of main and the existing frontend chain succeeded. The workstation merge has the three previously predicted conflicts. Gemini has the first bounded writer turn for `tests/universe-preview/vitest.config.js`; Opus then resolves the two explorer UI files. No remote merge/push occurs in this setup.

GPT's separate shared-module checkout is `/private/tmp/my-universe-pilot-shared-20261102`, branch `codex/universe-pilot-shared`. Separate valid backend/frontend checkouts will be assigned after the baseline merge. The dirty root and broken saved source folders remain untouched.

## Shared module interface for O02 / J02

GPT owns `shared/universe/`, including pure modules and tests. The production entry `shared/universe/index.js` must never import the fixture entry. Preview/emulator code imports `shared/universe/fixtures/index.js` explicitly. The accepted authoring bundle is a fixture, not a published release.

Planned exports from `shared/universe/index.js`:

| Export | Behavior |
|---|---|
| `API_CONTRACT_VERSION`, `CAPABILITIES`, `PUBLISHED_RELEASES` | API 1.0.0, agreed compiled capability declaration, initially empty published mission registry. No fake publication is created. |
| `resolveTask(registry, identity)` | Resolve exact `{releaseId, missionId, missionVersion, routeId, taskId, policyVersion}`. Returns `{ok:true,value:{bundle,mission,route,policy,identity}}` or `{ok:false,error:{code,message,field}}`. Registry is an array of trusted loaded bundles, never request-supplied content. No authorization decision. |
| `validateSubmission(body, {registry, missionId})` | Exact contract shape/identity, bounded required evidence and reflection. Returns the normalized body as `value` on success. No availability, role, grant or assessment authority. |
| `validateDraft(body, {registry, missionId})` | Exact task, support, active step, unique answers, partial evidence and expected revision. Recomputes numeric values from `rawText`; preserves cleared/invalid raw input with `value:null`. |
| `validateReview(body)` | Decision/note/expectedSubmissionRevision and contract shape; role, scope, current state and idempotency stay in server transactions. |
| `validateEvidence(evidence, route, {partial:false})` | Unique authored part IDs and allowed kinds, text/table/choice/diagram bounds, exact choices, diagram references, no artifact-reference. Draft partial mode permits missing parts and incomplete fields. |
| `parseNumber(rawText, step)`, `checkNumber(step, rawText)`, `displayAnswer(step)` | Bounded parsing with authored units; decimal rounding half away from zero; checks return legacy-compatible `correct|close|incorrect|invalid`. Percent input is accepted as a ratio only on the dimensionless CF step. Correctness remains practice only. |
| `canonicalStringify(value)`, `getBundleHashInputs(bundle)` | Declared ECMAScript canonical JSON encoding; hash inputs/expected digests for server/WebCrypto integrity checks. No Node imports or network/storage side effects. |

The fixture entry will export `PILOT_BUNDLE`, `FIXTURE_RELEASES`, `REFERENCE_ARTIFACTS`. It must not become reachable through the production entry. A separate explicit emulator/preview application entry is required; client flags cannot enable fixtures in a production API.

Draft clarification for both owners: an optional `reflection` string of 0–2,000 characters may be saved with draft work, since the final submission requires it. This does not make reflection a complete artifact. Submission still requires 20–2,000 trimmed characters plus all route evidence. Draft `answers` are `{stepId,kind,rawText,value}` for numbers, `{stepId,kind,selectedId}` for choices, and `{stepId,kind,text}` for reflection steps. Values never carry client correctness/approval flags.

Validation errors use `{ok:false,error:{code,message,field}}`; `code` is an existing contract code. These functions never access a database, authenticated identity, environment variable, browser storage or remote service. Gemini must enforce production registration, current availability, explicit organization/current class scope, no self-review, atomic idempotency/review and transport size before invoking the pure checks.

## Owner acceptance demonstrations

- GPT: positive and invalid artifact alternatives; unknown/duplicate identity and parts; numeric raw input/rounding/percent cases; fixture-free production import graph; exact content hashes.
- Opus: both complete mission flows, support switching, separate route drafts, accessible artifact alternatives, truthful save/network/review states, return/revise/resubmit and account/organization-switch cleanup.
- Gemini: availability/draft/submit/review/history services, atomic slots/idempotency/audit, explicit org/class checks, wrong-org/self-review denial, precise cursor paging, immutable snapshots, fixture rejection and isolated packaging.

Review only synthetic/emulator data. Localhost does not authorize use of the real Firebase project. Production and release operations remain separate from this implementation approval.

## Current status

Baseline merge resolution and shared implementation are in progress. O02/J02 implementation results, tests and integrated revision will be appended after they actually exist.
