# My Universe — G01 verified development baseline

2 November 2026 · GPT/Codex lead audit · Checked approximately 09:26–09:35 Asia/Bangkok

**Result:** use GitHub `main` at `3e461197f748cb62a6d6dfdabc7541307b41f82b` as the verified repository base. It already contains PR #4, but does not contain the live-safe `44b3abc` changes from open PR #6. The complete two-mission pilot is not on one branch yet. No merge or implementation checkout was created in this audit.

## Evidence and limitations

Read-only `git ls-remote` against `https://github.com/InnovationCoach/Playground.git` and authenticated GitHub GET requests verified the current branch and PR state. Root cached objects match the returned branch SHAs, so committed source was inspected with `git show`, ancestry checks and a read-only three-way conflict check. No branch ref was changed by this audit.

| Item | Verified result |
|---|---|
| GitHub `main` | `3e461197f748cb62a6d6dfdabc7541307b41f82b` |
| PR #4 | Merged 1 November 2026 at 19:05:19 Bangkok; Universe Stage B/C already in main. [PR #4](https://github.com/InnovationCoach/Playground/pull/4). |
| PR #6 | Open; source `codex/my-universe-prototype` at `f3dd3fb0bddd6fe67c65c50900d2cca81a813742`; target main. Contains live-safe dashboard fixes and documentation. [PR #6](https://github.com/InnovationCoach/Playground/pull/6). |
| PR #7 | Open; workstation head `b35f8b2c2f9eca1697c9b7560126edf44b4b73d4`; targets the prototype branch, not main. [PR #7](https://github.com/InnovationCoach/Playground/pull/7). |
| PR #8 | Separate open competencies work; exclude from the Universe integration scope unless separately selected. |
| Root worktree | `codex/fix-dashboard-image-uploads` at `0b6300fcf54793d39a0bcc7c556640bf0111ba95`; substantial unrelated changes. Not the implementation base. |
| Saved Universe source folders | Both `.git` pointer files refer to missing worktree metadata inside a former temporary `spark-release` repository. Their files remain readable, but they are not valid Git worktrees. Do not repair, reset, stash, delete or build an implementation on them by assumption. |
| GitHub deployment records | GET deployments returned `[]`. This is no proof that Firebase has never been deployed. |

Public HTTPS GETs verified these currently served artifacts:

| Public resource | Response / fingerprint |
|---|---|
| [Live page](https://dnd-master-73449.web.app/) | HTTP 200; application script `/assets/index-CemmqLyW.js`; HTML SHA-256 `53434b042cb31b1c1d307b450cf961db1b3a2bd80298b65916b639827c758bcd`. |
| [Published catalog](https://dnd-master-73449.web.app/cosmos/v1/catalog.json) | HTTP 200, JSON, `catalogVersion: 1.1.0`; Thalassa/Ignis/Boreas; 9,188 bytes; SHA-256 `c3a2a105b86925267e63b0a0a64561fc0647fb2b9120abdc7940b57c2981216e`. Matches the committed 1.1.0 catalog bytes. |
| `/api/universe/missions/submissions/mine` without credentials | HTTP 404, HTML. The documented same-origin learner mission endpoint is not currently usable at that URL. This does not establish the absence of every possible backend or off-origin deployment. |

The script filename agrees with the report's live release record for `44b3abc`. Neither that filename nor the shared catalog proves the exact full deployed source commit. Hosting release metadata/source attestation remains unverified; Gemini should reconcile it during deployment readiness. No authenticated page, learner record, secret, Cloud Function inventory or security-rule deployment was read. Python's certificate store failed; the system HTTPS client then succeeded with certificate verification enabled.

## Branch relationships

| Line | Fresh remote head | Relationship |
|---|---|---|
| Prototype/live-safe | `f3dd3fb0bddd6fe67c65c50900d2cca81a813742` | Includes `44b3abc`; PR #6 is the pending main-alignment step. |
| Go 3 | `3aad1499bdb627856f5801976e396ebe93b201ca` | Descends from prototype; includes packaging `153e051` and later corrections. |
| Go 4 backend | `8eb6bcab9b2e7258351a80d31c4855a02e72c104` | Descends from Go 3; includes `4daca20` and review fixes. |
| Go 4 frontend | `96684f9b7e9402f249b3b87ad716f4a75761c6c6` | Descends from Go 4 backend and therefore already contains Go 3. |
| Thalassa workstations | `b35f8b2c2f9eca1697c9b7560126edf44b4b73d4` | Separate branch from common ancestor `f3dd3fb`; catalog 1.2.0, wind draft and Hex-Grid scenario. |

These are one backend/frontend chain plus one divergent workstation line, not four independent feature implementations. Preserve reviewable dependency stages, but do not cherry-pick the same ancestor changes repeatedly.

## Integration recommendation, not a performed merge

1. Record current release evidence and retain the known rollback reference from the report; verify that channel still exists before a future release.
2. With the existing merge gate, align main through PR #6. Recheck remote SHAs immediately before integration; the hashes here are audit observations, not permanently current pointers.
3. Integrate the existing Go 3 → Go 4 backend → Go 4 frontend chain in reviewable stages, or one explicitly reviewed cumulative change. Avoid replaying ancestor commits already present.
4. Incorporate workstation PR #7 into that same candidate; account for its current prototype target rather than silently retargeting it.
5. Resolve content/service mismatches against the pilot contract, then run fresh relevant unit, UI, build, API and rules checks on the actual combined candidate. This audit did not create or test such a candidate.

A read-only three-way check using common base `f3dd3fb`, frontend `96684f9` and workstations `b35f8b2` found textual conflicts in:

- `src/features/universe/explore/MyUniverseExplorer.jsx` — **Opus** resolves navigation/workstation/access wiring.
- `src/features/universe/explore/explorer.css` — **Opus** resolves combined interface styles.
- `tests/universe-preview/vitest.config.js` — **Gemini**, as assigned shared configuration owner, resolves with Opus's preview requirements.

Other files may combine textually while still conflicting semantically: the frontend/server mission registries, generic reflection prompts, source/review status and Hex-Grid claims. A clean textual merge is not acceptance evidence.

## Pilot blockers confirmed in source

| Finding | Source evidence | Required owner action |
|---|---|---|
| Wind mission absent from server | Backend registry at `8eb6bca` contains only `spacecraft-journey`; workstation registry has both missions. | Gemini registers the exact reviewed wind task/version from the shared bundle. |
| No structured evidence/recoverable notebook | Current submit body is `routeId, missionVersion, reflection`; transient step state is discarded. | GPT contracts; Gemini persistence; Opus notebook/artifact views. |
| Duplicate-open submission race | Open-query followed by random document creation. | Gemini provides atomic uniqueness and idempotency. |
| Organization fail-open paths | Submission/admin queue default to `org-welearn`; admin review only rejects different organizations when both values exist; coach scope uses class overlap without an explicit organization match. | Gemini defines required server-resolved organization identity, fails closed and tests every route. |
| Direct Firestore reads bypass intended API scoping | `missionSubmissions` rules allow any `isAdminOrSupervisor()` read and teacher class overlap without explicit organization equality in that rule block. | Gemini audits rule helpers and closes equivalent direct-read paths or makes reads API-only. The contract cannot depend only on API guards. |
| Access ignores task/policy version | Approved mission IDs are collected into a set. | Gemini binds grants/decisions to exact policy-approved task versions and routes. |
| Review/audit inconsistency | Review commits in a transaction; audit write happens afterward and can fail separately. | Gemini makes the decision/outcome/audit event retry-safe and durable together, with an outbox if needed. |
| Errors become empty lists | Client list helpers return `[]` on auth/network/server failure. | Opus/Gemini preserve unknown/error states and prevent false “not submitted / empty queue.” |
| Old work selected by mission ID only | Reflection UI ignores version/route when choosing a saved submission. | Opus uses exact identity and visible revision history. |
| Boreas rule text differs from enforced rule | Catalog asks for Ice/Climate; server demo accepts spacecraft journey. | Keep real grants disabled for the pilot until the policy is decided and both surfaces agree. |
| Night-time inference exceeds demonstrated model scope | Wind step asks about the night; Thalassa scenario checks `nightCoverage`, while describing a daily-average model. | Version corrected mission/scenario copy; pilot demonstrates daily balance only until model validity is separately reviewed. |

These are observed code paths and integration concerns, not results of a production penetration test. No production vulnerability was exercised.

## Authorization and coordination record

Mani authorized GPT's baseline/contract deliverable, then explicitly authorized control of Claude/Antigravity to send their tasks. Opus 5.5 was visible in Claude and received O01 in its existing Universe chat. Antigravity offered no Gemini 5.8; Mani selected **Gemini 4 Argon**, which was selected and received J01 in the existing backend chat. Both were instructed to perform read-only audits and write only their own response documents. No additional agents were introduced.

The applicable source-checkout [AGENTS.md](../../output/my-universe/source/AGENTS.md) requires specific written approval for production actions and Gemini ownership of backend/rules/scripts. The present audit/contract work neither needs nor grants a production action. No deployment approval is being requested at this stage.

## Deliverable status

- **G01:** repository base and branch/PR relationships verified; public release fingerprints verified; full deployed source commit unverified; safe integration sequence documented.
- **G02:** [pilot contract 0.1.1](MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md) is technically accepted by both actual owners; see the [final review record](MY-UNIVERSE-G02-REVIEW-2026-11-02.md). Runtime implementation and human curriculum/release decisions are separate.
- **Next implementation base:** a valid checkout of freshly fetched `origin/main`, with approved existing changes integrated through the above sequence. There is no honest single already-complete pilot base to name today.
- **Checks in this audit:** remote metadata, source/ancestry inspection, public GET fingerprints and read-only conflict detection. No app test suite/build or device measurement was run.
