# My Universe — Phase 1 completion record

2 November 2026 · GPT lead · **Accepted for the local pilot on this Mac**

Phase 1's two-mission learning loop is complete in the integrated development candidate: investigate → save → submit → coach feedback → revise/resubmit → reviewed-only outcome. All three task routes pass against the real HTTP adapter and service with local Auth/Firestore emulators. The learner and coach screens also completed the flow in a real browser on this Mac. Student-device testing is the next round Mani requested.

This acceptance follows contract 0.1.1 and Mani's decisions: “complete phase 1”; GPT performs the science/NGSS review; test this device now, then student devices. GPT is recorded as an AI reviewer. No human educator credential, NGSS certification or measured student learning outcome is asserted. Publication and deployment remain separate operations.

## Candidate and authorship

- Checkout: `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-integration`
- Branch: `codex/universe-pilot-integration`
- Tested code anchor: `d2b78afb6c31b11c6b6f23d3870f0870e371c87b`. Later completion-record commits contain documentation only.
- Upstream base: `2bfcc687cac4b5b8af951ff9a9762032a9a0e773` / PR #9, rechecked against GitHub main at final validation.
- Opus 5.5 supplied frontend closure through `805f75c`, the real-service demo, captures and account/token callback tests.
- Gemini 4 Argon supplied J02 through `1e9f15c`. Its actual Antigravity session then stopped for insufficient credits. GPT completed the remaining backend/rules/config fixes in the separate integration checkout; no fourth model or credit purchase was used.
- GPT supplied the shared contracts/content, science review, combined acceptance, backend closure and integration review. The old dirty root application checkout and broken saved worktrees were not used for runtime implementation.

The accepted G03 authoring bundle remains byte-for-byte unchanged, file SHA-256 `7885a55c262070a470bf035c83bcb7543165098a7228da632bd09822a8647a04`, content SHA-256 `974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7`. Catalog 1.2.0 also retains its original hash. Production `PUBLISHED_RELEASES` remains empty; these are explicitly isolated pilot fixtures.

## Delivered learning experience

| Mission / task | Challenge and band | Evidence and decision |
|---|---|---|
| Thalassa wind / `wind-capacity-factor` | 2; grades 6–8 | Interpret a synthetic week, calculate weighted output/CF, compare both daily energy plans, stress-test lower wind, explain a recommendation and missing observations. |
| Journey timing / `journey-rates` | 2; grades 6–8 | Compare authored travel/provision cases, make an accessible route representation and justify a conditional delivery decision. |
| Mass and power / `journey-mass-power` | Provisional 4; grades 9–12 | Compare ideal propellant, supplies and power-area assumptions, prioritize constraints and explain tradeoffs, limitations and a real engineering connection. |

Each has Guided/Independent support without loss of work or grade penalty. Notebook evidence supports bounded text/table/choice/diagram alternatives. The same mission UI works from the explorer and text mode. Route drafts remain distinct and recover from the account service; unsaved local work is memory-only. Returned evidence stays immutable; a revision is a new linked attempt. Legacy reflection-only records remain readable and cannot be approved or returned in this pilot.

Challenge belongs to the task, not a learner's ability. These unpublished tasks do not create live planet difficulty statistics. The broader mission atlas, new biomes, evidence adapters and AI expansion/publishing pipeline remain later phases.

## Contract and review closure

- Availability/draft responses echo the exact six-field task identity. Malformed, mismatched, withdrawn, retired and unknown responses fail closed.
- Account/organization state is wired through the actual app host. Token-only changes update scope; stale profile/claims callbacks cannot restore an old account. Old-context work/queues disappear and late replies are ignored. Tokens are checked against the scope before sending work.
- Mission dialogs contain keyboard focus, skip hidden/disabled controls, close with Escape and restore an existing opener. Learner-facing support/decision wording uses presentation adapter 1.0.1 without editing the accepted content.
- Saves use revisions and coherent idempotent snapshots. Submission retains the independent draft. Concurrent submissions share one atomic open slot; review, outcome and audit changes commit atomically.
- Current server-controlled role/org/class/roster authority is checked on requests and replay; wrong-org, stale/revoked scope and self-review paths are denied.
- Private records are API-only. Universe audit events live under `auditLogs/universe/events/{auditEventId}` so the older flat audit reader cannot reveal feedback. Unrelated flat audit behavior is unchanged.
- A returned attempt gets at most one atomic `missionRevisionLinks/{previousSubmissionId}` successor. The family lock keeps scalar state, without growing arrays/maps or an arbitrary attempt cap. There is no cross-route/version migration rule.
- Explorer preferences accept at most 50 bounded ASCII IDs and typed allowlisted preferences; nested work, authority fields and invalid updates are denied.
- Teacher pagination advances through bounded raw records before current-roster filtering, so an empty page can truthfully offer Load more and older eligible work remains reachable.
- Retired pilot tasks cannot start/resume/submit, including with an ad-hoc finish flag. Read-only work/history remains available. Coach outcomes are reviewed-only with no XP, mastery or new planet grant. Boreas remains pending policy.

The [technical review](MY-UNIVERSE-G04-TECHNICAL-REVIEW-2026-11-02.md), [scoped rules assessment](MY-UNIVERSE-PHASE1-RULES-ASSESSMENT-2026-11-02.json) and [science/NGSS review](MY-UNIVERSE-PHASE1-SCIENCE-NGSS-REVIEW-2026-11-02.md) provide the detailed evidence. The older baseline rules score is historical, not the current assessment.

## Fresh verification on the integrated candidate

| Check | Result |
|---|---|
| Supported `npm run test:universe` | **114/114**, 13 files, including production auth observer/provider tests |
| Shared contracts | **23/23** |
| Broader existing unit command | **537/537**, 30 files |
| Firestore rules | **131/131**, 2 files; includes maximum-length 50-ID case, nested/oversized/type/delimiter attacks and private record/audit get/list/write denial |
| API suite | **65/65**, 5 files; includes current authority, transport/storage budgets, exact revision links, legacy read-only behavior, retirement and empty-page continuation |
| Real client → API → Auth/Firestore | **All three routes pass** save/replay/concurrent submit/return/revise/approve; no grants; immutable evidence retained |
| Emulator-entry safety | **4/4** refusals for missing hosts, missing project, non-demo project or credential-bearing environment |
| Authoring / independent numeric review | **114 authoring checks / 30 numerical checks pass** |
| Production Vite build | Pass; no accepted fixture data, demo actors/password/config or metrics switch in output |
| Functions | Node **22** bundle builds; isolated package outside the checkout loads on **v22.23.4**, `api` export present; 36 production graph inputs, zero fixture imports |

Final database/API tests used a separate matching demo emulator pair (Firestore 8288/Auth 9399, `demo-universe-phase1-checks`), preserving the interactive demo at 8188/9299. [Machine-readable validation](universe-pilot/phase1-validation-2026-11-02.json) records hashes and counts. jsdom canvas and existing bundle-size warnings are not hardware measurements.

Functions preparation now targets Node 22 because Google's [runtime schedule](https://docs.cloud.google.com/functions/docs/runtime-support) lists Node 20 decommissioning on 30 October 2026. This is a local packaging change, not a deployment. Existing locked dependency versions were retained; production rollout still needs its own dependency/configuration preflight.

## This Mac and the next device round

Actual browser: Claude desktop's Chromium-based in-app browser, `Chrome/152.0.7977.167`, viewport 664×695 CSS px, DPR 2. Host: Mac17,3, 16 GB, macOS 26.5.1; WebGL reports Apple M5 via ANGLE Metal.

- Real browser: wind and advanced journey completed save → send → return → revise/reload → resend → approve through the local service. All three task examples saved/reloaded. Another-organization reviewer received empty scoped lists and 403 on a foreign review.
- Current-device sample: travel dipped to approximately 48–52 fps and recovered to 60. Thalassa surface: 43 draw calls / 85,410 triangles at high detail; standard detail 34,914 triangles. First canvas/counters appeared around 135 ms; the warm-cache surface heading appeared around 257 ms.
- Universe and system-selection views rendered on demand. Galaxy/planet views continued rendering after travel; optimizing that is a follow-up for battery/load behavior before a low-power device performance claim.
- Responsive phone/tablet widths, text mode, keyboard, reduced motion and 200% equivalent layout width have captures/tests. Counts of geometries/textures are not byte memory measurements.

See [Opus's exact browser record and limits](MY-UNIVERSE-OPUS55-PHASE1-CLOSURE-2026-11-02.md), including `captures/phase1/` and `captures/service-demo/`. The latter contains 14 real-service/metrics captures. Physical student-device touch, Safari/Firefox and assistive-technology testing remain the next round; no results for those are invented.

## Try the completed pilot

Open **http://127.0.0.1:5196/service.html** while the local services are running. The visibly separate demo controls let you choose the synthetic learner/coach, choose a task and load a labeled reference example into the server draft. Open the mission, send it, switch to the synthetic coach, return it with feedback, then revise/resend and approve. “Other-organization admin” provides the denied-access check. All data is synthetic and confined to local demo emulators.

To restart from the integration checkout, use separate terminals in this order:

```sh
npm run emulators:universe:phase1
npm run seed:universe:phase1
npm run server:universe:phase1
npm run preview:universe:phase1
```

The first, third and fourth commands keep running; run the seed command after the emulators report ready. Auth is in memory, so a browser reload may require choosing the synthetic actor again. No production sign-in is needed.

## Release and rollback boundary

No push, remote merge, deployment, mission publication or production data write was performed during Phase 1 closure. The live site is unchanged by this work. The previous report's main coach/API incompatibility is fixed in this candidate; main/live do not inherit that fix until an approved release.

Before a later rollout: review the exact candidate diff; verify real pilot account provisioning and signed org claims; inspect any pre-existing flat Universe audit data; select the compatible published content/policy; and authorize the precise rules/index, API and Hosting steps. `api` is configured for `us-central1`. Do not ship an `/api/**` Hosting rewrite before the matching API exists, and do not use a bare deploy.

Rollback preparation must retain the previous frontend artifact, API source/runtime/config, rules/index definitions and release pointer before any authorized rollout. On a staged candidate, rehearse pausing assessed operations, restoring the previous compatible frontend/API/content pair and confirming history/private access. Rules rollback requires its own review so an older permissive rule is not silently reintroduced. Because nothing was deployed here, no production rollback was executed or claimed.

**Next round:** validate with learners on their devices, then proceed to Phase 2's reviewed content/publication workflow. New galaxies and scheduled AI drafting are not part of this Phase 1 completion.
