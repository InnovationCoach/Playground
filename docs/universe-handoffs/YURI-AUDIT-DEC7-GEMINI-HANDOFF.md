# My Universe: Yuri audit → Gemini implementation handoff

Prepared 9 November 2026. Target: 7 December 2026.

## Outcome and scope

Deliver one complete learner–coach loop: an appropriately published mission is available to its intended cohort; a verified learner selects a route, saves and resumes notebook work, submits it, and receives coach feedback. Recover gracefully from lost 3D graphics without losing the learner's place or work.

Priorities: (1) mission saving, (2) 3D recovery, (3) coach review and cohort publication. Fix small wording/navigation defects encountered in that path. Defer programme galaxies, new planets, evidence-based unlocks, competency stars/Your sky integration, portfolio export, crew missions, and NASA-data missions until after this target. Do not rebuild the universe.

## Boundaries

- Follow root AGENTS.md. This document is a work specification, not Mani's authorization to change authentication, permissions, production data, or deploy anything.
- Gemini owns server/, rules, indexes, and scripts/. Diagnose access failures and prepare a concrete proposed correction; obtain Mani's written approval before changing authentication or permissions.
- Develop with synthetic identities and Firebase emulators. A localhost page alone is insufficient: verify every backend, Auth, Firestore, and Storage destination is local and the project is a demo project before running a write scenario.
- No production account repair, seeding, migrations, publication, or deployment under this handoff. Any production action needs separate, specific written authorization consistent with AGENTS.md.
- Use a feature branch with origin https://github.com/InnovationCoach/Playground.git. Coordinate a single writer per working folder. Preserve unrelated work. Do not force-push, delete branches, push tags, or change GitHub settings.

## 1. Establish the baseline

Record the checkout revision and, if available through approved read-only access, the audited release revision. Treat Yuri's observations as reported behavior, not a reproduction on this checkout. Do not assume the source and live release match.

Relevant existing implementation:

| Area | Starting points |
| --- | --- |
| Membership verification | `server/lib/universe/auth.js` |
| Learner persistence/submission API | `server/routes/universe.js` |
| Notebook and client | `src/features/universe/pilot/PilotMissionSheet.jsx`, `src/features/universe/pilot/universeClient.js` |
| Explorer and graphics | `src/features/universe/explore/MyUniverseExplorer.jsx` |
| Coach queue and feedback | `src/features/coach/universe/CoachUniverseSubmissions.jsx`, `server/routes/coach-universe.js` |
| Mission definitions | `src/features/universe/pilot/publishedBundle.json`, `src/features/universe/missions/` |
| Existing contracts | `docs/implementation/MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` |

Read applicable existing contracts and integration tests before extending them. Locate the dashboard entry points and active publication/catalog path rather than creating a parallel system.

## 2. Unblock mission work without weakening access boundaries

**Reported:** selecting a route in “Is the wind worth it?” produces two membership banners, pauses saving, and locks the notebook.

**Verified in source:** the exact message “Active verified class membership in your organization is required.” originates in `server/lib/universe/auth.js`. This server guard combines live Auth authority, optional `universeMemberships/{uid}`, presented token claims, optional user-profile class restrictions, and class documents/rosters. It rejects class-scoped callers with no verified class. The WLS/WHS restructure is a hypothesis, not a confirmed cause; a Firestore-rule change is not automatically the remedy.

1. Reproduce with a synthetic learner and inspect the failing request, status, and error code. Identify whether failure precedes notebook loading, save, or both.
2. Trace the first point at which the intended class stops qualifying: role/org consistency; membership status; classIds across live authority, token, and profile; class existence and organization; active/revoked status; learner roster inclusion. Document sanitized findings without tokens or personal data.
3. Build fixtures reflecting the suspected WLS/WHS mismatch. Distinguish stale-token behavior from missing authoritative membership, stale profile restrictions, and roster/schema mismatches.
4. Propose the smallest correction and its affected records/code. If authentication or permissions change, present the exact diff/contract and regression evidence for Mani's approval before implementing that change. Do not bypass membership validation, trust client-added classIds, grant blanket access, or repair real Yuri records through a development script.
5. Consolidate duplicate failure banners into one actionable message. Explain that saving is unavailable and whom to contact. Never claim a successful save when the server rejected it; preserve unsaved input during an in-session failure without leaking it to another identity.

Acceptance: a valid synthetic learner can choose a route, save answers, reload, resume the same work, and submit. Missing/revoked/wrong-org membership and invalid roster access remain denied. Test stale-token and membership-change handling, including account switching and failed saves. Confirm class/cohort isolation for synthetic WLS and WHS learners.

## 3. Recover from graphics context loss

**Verified in source:** the explorer registers `webglcontextlost`, sets `contextLost`, and hides 3D controls when that flag is set. The scene is conditional on `in3d`; simply adding a restored listener is insufficient if fallback unmounts its canvas.

1. Implement lifecycle-managed lost/restored listeners with cleanup. Choose a bounded canvas retention or recreation strategy that actually allows recovery after fallback.
2. Keep the text fallback and add a visible, keyboard-accessible **Back to 3D** or **Try 3D again** control after loss. Show retry progress and an honest failure state; avoid automatic retry loops.
3. Handle `webglcontextrestored` when the retained canvas receives it. Respect a learner's deliberate choice to stay in text view; restoration must not unexpectedly move focus or close a notebook.
4. Preserve navigation path, selected site, mission/route, arrival state, and notebook answers across loss and retry. Graphics recovery must not re-submit work or replay the intro unnecessarily.

Acceptance: exercise loss, restoration, retry success, repeated retry failure, and repeated mount/unmount. Where supported, use `WEBGL_lose_context` in a local browser test; supplement with event/lifecycle tests. Verify text view remains usable when 3D cannot recover and that listeners do not accumulate.

## 4. Finish the coach–student exchange using existing work

**Verified in source:** `CoachUniverseSubmissions.jsx` already provides Waiting for review, Returned for revision, and Reviewed tabs. The backend already exposes submission listing and review actions, with revision/idempotency handling and organization/class checks. Approval records review, not mastery or planet unlocking.

1. Retest the existing queue from the Coaching Dashboard with synthetic authorized coaches. Determine whether missing navigation, configuration, access, or deployment explains its absence from the audited experience.
2. Prove the complete loop: learner saves → submits → assigned coach reads the submitted notebook revision → returns with feedback → learner revises/resubmits → coach approves → learner sees the resulting status. Reuse existing contracts and preserve immutable submitted evidence.
3. Separately inventory **mission-content review/publication**. Approving a learner submission does not approve the mission itself. Extend the current catalog/publication system only where needed to let authorized educators review a specific draft version and publish it to explicitly selected WLS/WHS cohorts.
4. Before introducing publication endpoints or permissions, specify the existing versus proposed role authority, version/state transitions, cohort identifiers, audit fields, withdrawal behavior, and API error/conflict semantics. Obtain Mani's approval for permission changes. Do not infer that every submission reviewer may publish content.
5. Keep draft preview labels truthful. Only eligible cohorts should receive published assignments. Publishing a later revision must not silently change the evidence or instructions attached to an existing attempt. Define withdrawal behavior for in-progress attempts and coach review.

Acceptance: intended cohorts can access the approved version; other cohorts cannot. Learners cannot publish or review their own work. Revoked/unrelated coaches cannot read or act on attempts. Duplicate clicks and concurrent reviews/publications do not create duplicate or contradictory results. Drafts remain distinct from published tasks; one approved mission is enough for the release slice.

## 5. Targeted consistency and navigation checks

- Use the same arrival content and choices in 3D and text view. Make the Thalassa intro available accessibly in both, with equivalent text and skip behavior. The current explorer shares an ArrivalCard component, so check state/layout differences before replacing it.
- Resolve “Inspect the evidence” versus “Check the data: data quality” through the existing mission definition; avoid independent titles in the step list and notebook.
- Retest text planet cards with actual interaction state, not only delayed screenshots. Provide clear selection/open feedback, keyboard activation, and appropriate focus movement.
- Retest the My Universe breadcrumb from Research Station and ensure it returns to the universe root. Check at laptop and narrow widths; keep Back, recovery, and Leave discoverable while reducing header crowding.
- Verify the reported content counts, Aurora's empty state, Boreas's lock explanation, and the journey mission appearing under two planets. Determine whether the latter is intentional cross-listing before changing it. Do not invent new content to fill gaps.

Preserve Fictional world/Real science labels, model limitations, Guided/Independent help, sentence starters, NGSS tags, grades as suggestions rather than limits, and the text fallback. Keep the no-XP/rewards/unlocks statement accurate until separately approved integrations exist.

## 6. Verification and delivery

Use existing suites as the starting point: `npm run test:universe`, `npm run test:universe:shared`, and the relevant API/rules tests through demo-project emulators. Relevant integration files include `tests/integration/universe-emulator-entry.test.mjs` and `tests/integration/universe-pilot-acceptance.mjs`; inspect their configuration before execution. Add meaningful regression cases for the failures above.

Before pushing, inspect the diff against `origin/main`, run the repository-required tests and `npm run build`, and report results and failures accurately. Include browser evidence for the complete learner–coach loop and graphics recovery, including text-only operation and laptop-width navigation. No live learner testing or writes are authorized by this document.

Deliver: changed files; confirmed root cause versus remaining hypotheses; exact emulator reproduction steps; test/build results; screenshots or a short local walkthrough; outstanding approval decisions; and a concrete release proposal. A deploy prompt in this or another document is not authorization to deploy.

## Handoff preparation status

This handoff was checked against local source. No live Yuri session or production records were inspected, no application behavior was changed, and no tests/build were run for this documentation-only task. The reported content inventory and intermittent navigation symptoms remain to be reproduced.
