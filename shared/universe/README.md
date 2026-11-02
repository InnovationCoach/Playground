# Universe mission contracts

`index.js` is the production-safe, dependency-free ESM entry. It exports pure
task resolution, artifact/draft/submission/review validation, number parsing and
decimal practice feedback, canonical hash inputs and capability metadata.

The published mission registry is deliberately empty. The accepted authoring
packs are drafts. Import `fixtures/index.js` only from explicit preview/emulator
entries. A production client flag must never select that registry. Server routes
must use a server-chosen registry and enforce current availability/authentication,
organization, class scope, atomic revisions and idempotency outside these pure
helpers. A structurally valid artifact is not an approved artifact.

Every validator returns `{ ok: true, value }` or
`{ ok: false, error: { code, message, field } }`. `resolveTask(registry, identity)`
returns the exact bundle, mission, route, policy and identity under `value`.
`validateSubmission(body, {registry, missionId})` requires the complete authored
evidence; `validateDraft` accepts partial known evidence, preserves raw input and
recomputes its numeric value. Draft reflection is optional (0–2,000 characters).
Optional draft `previousSubmissionId` preserves a returned-work link; the server
must authorize and verify that link before resubmission.

Unknown fields and client authority flags are rejected. Payloads are bounded to
64 KiB of canonical UTF-8 JSON; the server must also enforce the actual incoming
transport byte limit. Text budgets count Unicode code points; numeric `rawText`
uses a strict maximum of 64 UTF-16 code units. No trimming silently changes the
stored raw learner text. Tables accept text alternatives. Journey diagrams use
authored nodes (`id`, `label`) and edges (`fromId`, `toId`, `label`) and require
their equivalent text description.

`parseNumber(rawText, step)` accepts well-formed comma/space grouping, authored
units, decimals and finite scientific notation. A percent suffix is accepted
only for a dimensionless step and divided by 100. Cleared or unfinished input
parses to null while remaining recoverable in the draft. Decimal rounding uses
integer ratios with ties away from zero. `checkNumber` returns
`correct|close|incorrect|invalid`, for practice only.

`canonicalStringify` implements the accepted `sorted-key-json-ecmascript-v1`.
`getBundleHashInputs` returns seven `{kind,id,expected,canonical}` records for
the pilot. The caller supplies Node crypto or WebCrypto; the shared entry has
no Node/browser service dependencies. Hash validation does not substitute for a
trusted registry or editorial/publication approval.

Run the focused contract suite with:

```sh
node --test shared/universe/tests/contracts.test.js
```

The JSON capability/manifest files are review artifacts. The capability export
is checked against its JSON counterpart. The fixture JavaScript and JSON copies
are checked for semantic equality and all seven accepted checksums. The focused
suite also walks the production entry graph to prevent fixture dependencies.
Application, emulator, build, device and educator verification are separate.

`getTableTemplate(route, partId)` applies presentation adapter 1.0.1. It makes
the wind table's total-row output fraction and CF-row time cells read-only
“Not applicable”; learners still supply weighted hours, total time and raw/planning
CF. It never mutates the accepted hashed bundle or changes task criteria. Use
this view consistently for editor initialization, rendering and serialization.
`getSupportDescription(mode)` and `getMissionDecision(mission)` supply learner
wording so authoring instructions and internal plan IDs do not leak into the UI.
