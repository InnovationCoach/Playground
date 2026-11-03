# My Universe — O02 / J02 implementation dispatch

2 November 2026 · GPT/Codex lead · Local implementation approved by Mani

Mani's latest **“approved”** follows the accepted G03 packs. Proceed with local implementation, meaningful tests and review. Do not push, remotely merge, deploy or write production data. Product approval is recorded; separate named educator decisions have not been invented.

## Exact starting point and ownership

Both independent valid clones start at `e6e8085` on top of local integration `c709ddb`, incorporating fresh main `3956efc`, existing frontend chain `96684f9`, workstation `b35f8b2`, shared contracts `88d09a1` and the parser correction `e6e8085`. The root dirty checkout and broken saved worktrees are not implementation bases.

| Owner | Sole writer checkout | Branch | Scope |
|---|---|---|---|
| Opus 5.5 | `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-frontend` | `codex/universe-pilot-frontend` | Frontend, coach UI, frontend tests and preview fixtures; source content/catalog copy only as specified below. |
| Gemini 4 Argon | `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-backend` | `codex/universe-pilot-backend` | Server, Functions, rules/indexes, test/build/package configuration, scripts, backend/rules tests and packaging. |
| GPT | `/private/tmp/my-universe-pilot-shared-20261102` | `codex/universe-pilot-shared` | Pure shared module fixes and tests. Send issues to GPT; do not edit shared modules independently. |

One writer per checkout. Local commits are authorized and are the integration handoff; no remote pushes. Read `AGENTS.md` in the assigned clone. Never substitute a model or add another agent.

Read accepted contract 0.1.1, G03 revision 2 and both final reviews from `/Users/admin/Desktop/HearIsland/docs/implementation/`. The reviewed bundle hash is `974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7`. The [G04 record](MY-UNIVERSE-G04-IMPLEMENTATION-2026-11-02.md) specifies the shared exports; actual `shared/universe/README.md` controls implemented helper details.

## Shared implementation now available

`shared/universe/index.js` exports all agreed helpers, API version/capabilities and **empty** `PUBLISHED_RELEASES`. `fixtures/index.js` separately exports the frozen accepted bundle/registry/five exemplars. No fixture is reachable from the production entry. The 22 focused Node tests pass. This is not yet Vite/Functions/API/UI proof.

Opus's parser finding is fixed: long aliases such as “seconds” are matched before “s”; regression cases pass. Legacy 0.1.0 formatting stays in its own read-only history adapter. Capability JSON matches compiled exports, and fixture JavaScript/JSON equality plus all seven hashes are tested. Unicode text counters use code points; numeric `rawText` is bounded to 64 UTF-16 units. Server must enforce actual incoming bytes in addition to canonical helper limits.

Draft bodies may include optional `reflection` (0–2,000 characters) and optional `previousSubmissionId` to preserve returned-work context. The latter never establishes authority: server must verify actual ownership, returned status and exact eligible identity before accepting a resubmission. Final submission requires all evidence and 20–2,000 trimmed reflection characters. All raw learner text remains intact.

## O02 — Opus: build the complete experience

1. Use the accepted three route/tasks, part bindings, table/diagram templates, guided worked examples, hints, solutions and sentence starters. Keep task demand/grade band separate from support choice. Support changes preserve work; route changes use a separate exact-identity draft.
2. Briefing → labeled evidence → step practice → notebook → explicit review screen → send. A `reflect` step never submits. Render text/table/diagram alternatives with equivalent evidence expectations, readable captions/headers and keyboard controls; no upload service.
3. Use shared numeric parsing/check/format for 0.2.0; percent input is accepted for dimensionless CF. Show raw and planning CF separately and explain rounded ledgers. Legacy content is not silently upgraded.
4. API client follows exact paths/envelopes/header/idempotency contract. Distinguish loading, empty, error, not-connected, unavailable/withdrawn and authentic submitted/returned/approved states. Missing or stale availability never enables assessed send/resume.
5. Memory-only defaults. No policy signal currently permits persistent local caching. Show “not saved” until actual server save succeeds. Clear work/status/in-flight results synchronously on UID or organization change. Preview and anonymous sessions stay memory-only.
6. Learner history and coach list/detail show the exact immutable evidence/version/task/support, prior feedback, current availability and reviewed-only outcome. Support returned → revised new submission with previousSubmissionId; no optimistic approval or new planet grant.
7. G03 is a fixture: inject it through explicit preview/emulator entry/props. Production import graph must not reach `fixtures/index.js` (even through a lazy import). Production has no newly published pilot tasks. Never activate fixtures from a production query flag.
8. Hide assessed Hex-Grid lab link while reviewedScenarioVersion is null. Preserve unrelated existing Hex-Grid projects. Give Boreas neutral pending-policy wording matching the server; no “complete journey to unlock” claim. Any catalog content/version change is explicit and reported, not an undocumented hash change.
9. Use existing shell/scenes. Preserve original public exploration and the competencies fix. Add focused UI tests and an isolated synthetic preview demonstrating both missions and review states. Request test/build configuration changes from Gemini rather than editing their files.
10. Run focused tests, keyboard/text-mode checks and available desktop captures; state untested devices/assistive technology honestly. Local dependency installation from the existing lockfile is authorized (no broad upgrade). Coordinate any manifest/lock change with Gemini.

Deliver a local commit and `docs/implementation/MY-UNIVERSE-OPUS55-O02-RESPONSE-2026-11-02.md` **inside your checkout**, naming base/head, changed files, implemented behavior, fresh checks, preview URL, remaining concerns and how to reproduce. Do not edit the lead's shared source or another checkout.

## J02 — Gemini: implement and verify services

1. Load the shared metadata/validators. Verify exact hashes at trusted load/startup using declared canonical encoding. No request may choose a registry or create a release. Preserve legacy reflection-only history as legacy; no new entitlement inferred from historical approval.
2. Implement availability, versioned draft GET/PUT with optimistic revisions, immutable submission POST and caller history, coach queue/review and neutral access. Keep exact full identity and snapshot fields from contract §9.3. A draft fixture is emulator-only; production requires a trusted published registry entry and publication policy, independent of client flags or convincing IDs.
3. Preserve fixture isolation by separate emulator/test entry/dependency injection. The production Functions/app graph must not include fixture data. An `if (emulator) import('./fixtures')` in a common bundled entry is insufficient if esbuild includes it. Prove the production graph and a clean-directory Functions load without root-module fallback.
4. Enforce explicit authoritative organization and current class scope, no org-welearn fallback authority, no self-review or new admin bypass. Keep changes scoped to Universe. Do not broaden global permissions or bypass guards to make a test pass. The approved contract authorizes local implementation of these restrictions; production deployment remains separate.
5. Atomically commit submission/open-slot/idempotency/audit; review decision/revision/slot/audit/outcome together. Hash canonical tuple keys. Bind idempotency to caller/org/method/path/version/body; fresh 201, replay 200, recheck current authorization/availability, and include authorized conflict details. Resolve previousSubmissionId only against actual eligible returned work.
6. Return safe complete list snapshots and no-store headers. Exact seconds/nanoseconds/docId/filter-bound cursors, bounded query/merge and real indexes; no fetch-all/sort. Enforce actual transport/document UTF-8 budgets and unknown-field rejection; preserve raw work and parse numeric values server-side.
7. Deny direct client access to service-only draft/slot/idempotency collections; close equivalent raw submission read bypasses or make them API-only. Restrict universe-v1 to bookmarks/preferences. Review overlapping permissive rules. Local changes and emulator tests only.
8. Reviewed-only outcomes with zero grants. Boreas remains pending policy. Match frontend service requirements and response shape; coordinate ambiguities early rather than independently inventing another payload.
9. Own package/config/build/test changes needed for Vite/preview/Vitest/Functions and relevant CORS/version/idempotency headers. Existing lockfile installs are authorized, plus minimal necessary reproducible build dependencies; no broad upgrades. Provide frontend configuration changes as a committed handoff for integration.
10. Use a dedicated local emulator project and synthetic data only. Before API/rules tests assert FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST point to localhost and required SDK project context is nonproduction. No production credentials, records, seeds or external service writes. Run focused API/rules concurrency/retry/version/org/class/self-review tests and packaging checks; report actual results, not intended tests.

Deliver a local commit and `docs/implementation/MY-UNIVERSE-GEMINI-J02-RESPONSE-2026-11-02.md` **inside your checkout**, naming base/head, changes, actual tests, packaging proof, untested cases and next owner. No merge/push/deploy.

## Integration

GPT integrates local commits in the clean central candidate, returns owned fixes to the responsible writer and runs the two-mission revise/resubmit demonstration. Release readiness requires actual test/build/device evidence and human content decisions. Implementation completion does not itself authorize publication.
