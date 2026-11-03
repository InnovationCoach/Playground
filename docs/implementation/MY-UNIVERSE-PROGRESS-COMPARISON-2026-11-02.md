# My Universe — progress compared with the plan and contract

2 November 2026 · Historical pre-closure comparison for Mani

**Later status:** Phase 1 closure is recorded in [the completion record](MY-UNIVERSE-PHASE1-ACCEPTANCE-2026-11-02.md). The findings below describe the earlier inspected snapshot.

**Assessment: substantial implementation progress; Phase 1 and G04 remain incomplete.** The mission content, learner interface and service implementation exist. They have not passed a combined real-client/service acceptance run. The discovery-to-expansion pipeline remains later work. Accept the supplied update as a progress record, with the corrections below; it is not final technical acceptance or evidence that missions are active.

This review compares Mani's pasted Claude update with the approved [next-phases plan](MY-UNIVERSE-NEXT-PHASES-2026-11-02.md), [three-agent assignments](MY-UNIVERSE-THREE-AGENT-ASSIGNMENTS-2026-11-02.md), [contract 0.1.1](MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md), G03 bundle and current source. No application source, release policy or deployment was changed during this review.

## 1. What actually moved

| Work location | Verified state | Meaning |
|---|---|---|
| GitHub `main` | `2bfcc687cac4b5b8af951ff9a9762032a9a0e773`; [PR #9](https://github.com/InnovationCoach/Playground/pull/9) merged 2 November at 15:16 Bangkok; 105 files, +15,275 / −144 lines | Explorer baseline, O02 frontend and panel/orbit changes are in main. This does not establish a deployment. |
| Frontend checkout | `codex/universe-explorer-panel`, `0df3f2c`, clean | Opus's O02 through `6afa10d` plus Gemini's panel/orbit work. |
| Backend checkout | `codex/universe-pilot-backend`, `1e9f15ca32bf57c749b8bb628d92029efde1a664`, clean | J02 exists separately. Its implementation is absent from current main. |
| Lead integration checkout | `codex/universe-pilot-integration`, `25262c9`, clean | Includes O02, presentation adapter 1.0.1 and the acceptance script; J02 and the later panel changes are not integrated here. |

The backend handoff cites `332af11` as its final commit, but the actual checkout HEAD is `1e9f15c`. Use the actual HEAD for integration and correct the handoff's self-reference.

The nine new explorer captures and source changes support the panel/orbit work described in the update. They improve usability but do not close the mission-service integration gate. The frontend checkout contains 22 captures in total. This review did not repeat their browser sessions or verify the currently deployed site.

## 2. Progress against the delivery plan

| Planned gate | Current assessment | What remains |
|---|---|---|
| **0 — Establish one base** | Baseline reconciliation and a main merge are demonstrated; the final combined candidate is unfinished. | Bring the current frontend, J02 and lead fixes into one reviewed line; run relevant combined checks and record the release/rollback diff. |
| **1 — Trustworthy first expedition** | G01/G02 technical agreement and G03 authoring complete. O02 and J02 substantially implemented in separate checkouts. | Resolve interface/security/accessibility findings; demonstrate save → submit → return → revise → approve through the real client and service; complete G04 and applicable O03 checks. |
| **2 — Reviewable expansion** | Shared immutable content identity, hashes and validators provide a foundation. | Editorial draft store, science claim review, educator change-review console, exact-hash approval, immutable publishing, withdrawal and rehearsed rollback. A coach reviewing learner work is a different workflow. |
| **3 — Aurora / Verdantia expedition** | Planned in the atlas. | Three complete reviewed mission packs, new biome/accessible workspace and representative learner pilot. |
| **4 — AI drafts from evidence** | Source references exist for the authored pilot. | One bounded evidence adapter, traceable evidence packet, manual AI drafting, exact reviewable patch and the proposed 20-draft evaluation. |
| **5 — Classroom observations / personal routes** | Planned. | Private observation intake, metadata controls and explainable recommendations with equivalent evidence routes. |
| **6 — Approved expansion cadence** | Planned. | Queue/spend limits, deduplication, correction monitoring, explicit cadence decision and monitored rehearsal. |

The original vision—new missions/worlds inspired by human discoveries—is still the destination. This update delivers much of its first learning loop. It does not deliver an operating AI expansion system or additional galaxies.

## 3. What matches contract 0.1.1

- The accepted G03 bundle still validates: **114/114 checks**, content hash `974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7`.
- The actual pilot has **two missions and three task routes**: wind `guided` / `wind-capacity-factor`, challenge 2, grades 6–8; journey `guided` / `journey-rates`, challenge 2, grades 6–8; journey `advanced` / `journey-mass-power`, provisional challenge 4, grades 9–12. Each offers Guided and Independent support without changing task identity or penalty.
- Scenarios, labeled synthetic data, numerical references, evidence alternatives, rubrics and candidate NGSS support mappings are authored. The NGSS/science review records remain pending; technical agreement is not educator approval.
- Shared validation, exact six-field identity, bounded evidence, no automatic mastery/grants and separate fixture imports follow the agreed architecture.
- `PUBLISHED_RELEASES` is empty on main. Draft pilot tasks remain unpublished. Boreas stays unresolved/gated; the accepted pilot deliberately returns reviewed-only outcomes with no new grant.
- Memory-only unsaved work is an allowed fallback while school/device cache policy is unavailable. Account saves still require the service. This is not proof that account/organization teardown is fully wired in the production host.
- The unreviewed Hex-Grid lab is hidden from assessed pilot flows. Its old standalone preview wording is not a reviewed corrected simulation scenario.

Route challenge labels are implemented. The broader plan's **computed planet entry challenge and mission range** are not demonstrated by this update; they must derive only from published, available missions. An exploration-only planet should not acquire a difficulty number from these draft fixtures.

## 4. Findings that prevent final acceptance

### A. Current main has a coach interface/API mismatch

Main mounts the new `CoachUniverseSubmissions` in `CoachDashboardHost`, while `server/routes/coach-universe.js` still returns the old `{submissions}` list and old `{id,status,...}` review response. The new client requires `contractVersion`, `submissionId`, revisions and the agreed response shapes.

A fresh compatibility probe using the actual frontend adapter and the old list envelope returns **`CONTRACT_VERSION_UNSUPPORTED`**. Thus, main built with the old service cannot provide that new coach flow successfully. The empty mission registry does not disable the separately mounted coach component. This is a source-level release blocker; whether the live site exhibits it depends on the exact deployed frontend/backend pair, which was not checked here.

### B. Even J02 does not yet satisfy the final frontend response requirements

The frontend requires an exact top-level `identity` echo on availability and draft GET. J02 returns availability fields plus `availability`, and draft metadata plus `draft`, without that identity wrapper. Adapter probes with these source-shaped responses both return **`MALFORMED_RESPONSE`**. These probes verify compatibility rejection; they are not a real emulator end-to-end run.

Adopt the canonical envelopes recorded in the [lead review](MY-UNIVERSE-G04-TECHNICAL-REVIEW-2026-11-02.md), then run the real adapter against the service. Separate frontend and API test suites cannot close this gap.

### C. Remaining contract and implementation findings

| Finding | Source evidence / consequence | Owner |
|---|---|---|
| F5 — Learner wording | Adapter 1.0.1 helpers exist only on the lead line. Main/frontend still export adapter 1.0.0 and the sheet renders raw `mission.decision` / authored support instructions. The update overstates integration of the wording fix. | Opus integrates GPT's helper. |
| F6 — Modal keyboard behavior | Pilot sheet declares `aria-modal` but handles Escape only; the explorer skips its own key handling while a mission is open. Tab wrapping and opener restoration need implementation/verification. | Opus |
| Context and late replies | Production `SparkUniverse` does not pass learner/org `viewerKey`; UID-keyed dashboard remounting covers some account changes, but same-account organization changes need proof. Coach requests have an alive flag without a request generation; a slow earlier tab request can replace the newer list. Error handling retains prior items. No actual cross-account disclosure is claimed from this source inspection. | Opus; GPT acceptance cases |
| B7 — Preference bounds | `bookmarks` checks only list type/count ≤50. Nested maps and oversized element values are not rejected by that check. | Gemini |
| B8 — Bounded retry history | `consumedReturnedIds` accumulates prior IDs in one family lock. Use bounded per-attempt supersession metadata while preserving prior evidence/status. | Gemini |
| B10 — Retained drafts | Synthetic submit deletes the task's draft; real service retains it. The lead decision is to retain independent draft work and monotonic revisions. Match the preview to the service and verify revision behavior. | Opus; Gemini verifies service |
| B11 — Retirement | Server enables resume/submit from an `allowInProgressFinish` flag without a verified authored cohort; frontend pauses retired tasks. Current pilot has no authored finish-after-retirement policy. | Gemini |
| Coach paging | Teacher queries fetch a bounded raw window, remove revoked-roster records, then calculate continuation from the filtered list. If the fetched records are all removed, older eligible work can be hidden behind `nextCursor: null`. Page by the last raw record scanned, retain current-scope filtering and test empty continuation pages. | Gemini; Opus adjusts empty-page copy if needed |

B1–B6 corrections and their tests are present on the backend branch. The owner's emulator/build results are useful evidence, but do not establish that all remaining findings are closed or that the combined implementation is accepted. In particular, source-backed current-authority checks should not be summarized as a complete security certification.

## 5. Test evidence: fresh versus reported

| Check | Evidence from this independent review |
|---|---|
| G03 authoring | Fresh **114/114** pass. |
| Frontend current panel branch | Fresh **87/87**, 11 files, using a scratch config that includes the three pilot files. |
| Lead integration frontend | Fresh **86/86**, 11 files; lacks the newer panel test/change. |
| Shared contract tests | Fresh **23/23** in integration; **22/22** in backend. The update's “23 in all checkouts” is inaccurate. |
| Compatibility probes | Fresh rejection of old coach envelope and J02 missing-identity availability/draft envelopes, as described above. |
| Rules 134; API 61; unit 537; Functions isolated build; browser captures | Owner-reported results in handoffs. Not rerun during this comparison. They apply to their named checkout, not automatically to main or the final candidate. |
| Combined real-client/API acceptance | Script exists at `pilot-integration/tests/integration/universe-pilot-acceptance.mjs`; **not run against a merged J02 candidate**. |

The committed `test:universe` configuration still omits the three pilot client/session/UI files; the fresh 87-test run explicitly included them through a scratch configuration. Gemini should make the supported test command include them before final handoff. The UI runs emit jsdom canvas warnings and do not measure real WebGL performance.

## 6. Corrections to Claude's update

1. Wind has one task route, not guided and advanced task routes. Guided/Independent are support choices.
2. Presentation helper 1.0.1 is prepared on the integration line, not consumed by the merged frontend.
3. The backend shared suite currently has 22 tests, not 23. Preserve checkout-specific counts.
4. J02 source exists and its owner reported successful suites; final G04 acceptance remains open.
5. PR #9 is confirmed merged. A merge does not prove which frontend, service or rules are deployed. Backend/rules hardening is absent from main and must not be described as released by that PR.
6. Responsive Chromium screenshots do not close physical touch, Safari/Firefox, assistive-technology or measured device-performance work. The update correctly leaves those pending.

## 7. Next delivery order

1. **GPT lead:** reconcile current main, J02 and shared adapter into one reviewable candidate; settle response/draft/retirement behavior in the handoff; preserve the approved content bytes.
2. **Opus:** complete wording, modal focus and production context/request cleanup; match the synthetic service to retained drafts; verify the coach empty/continuation states.
3. **Gemini:** close response envelopes, bounded preferences/supersession, retirement and coach paging; update the supported test configuration and accurate handoff commit.
4. **GPT with both owners:** run all three task routes through the real client and local demo emulators, including revision/replay, authority denial, account/org switching and late responses. Then run the final relevant rules/build/packaging checks on that same candidate.
5. Complete applicable educator and representative-device review before mission publication. Keep publication, deployment and final Boreas grant policy explicit. The initial reviewed-only pilot does not need a fabricated Boreas grant to demonstrate completion.
6. Begin Phase 2's editorial/publishing workflow, followed by Aurora/Verdantia and the evidence-to-draft adapter. A scheduler or new galaxy is premature while the learning loop and review pipeline remain unfinished.

No final acceptance, production deployment, mission activation or additional agent assignment is made by this comparison.
