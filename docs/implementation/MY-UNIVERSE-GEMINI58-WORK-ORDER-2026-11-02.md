# Gemini 4 Argon — backend and platform work order

2 November 2026 · Lead-authored brief for the actual Gemini 4 Argon session

**Execution update:** Mani selected Gemini 4 Argon because Gemini 5.8 was not offered. This original filename is retained so earlier handoffs still resolve; do not label runtime results as Gemini 5.8.

Read [team assignments](MY-UNIVERSE-THREE-AGENT-ASSIGNMENTS-2026-11-02.md), [development plan](MY-UNIVERSE-NEXT-PHASES-2026-11-02.md), [mission atlas](MY-UNIVERSE-MISSION-ATLAS-2026-11-02.md), the applicable `AGENTS.md`, your backend handoff and Go 1–Go 5 records. Respect actual chat approvals for implementation, rules and release steps.

You own `server`, `functions`, rules, indexes, scripts and Firebase configuration. Coordinate shared package/build configuration as its sole writer. GPT owns shared/learning contracts and integration review; Opus owns frontend/world implementation.

## Begin with J01

Audit the actual Go 3/Go 4/frontend-compatible service lines and report what exists versus what is proposed. Verify Cloud Functions packaging, API routing readiness, credential configuration requirements without exposing values, learner-state rules, coach scope, organization isolation and Go 5 gaps.

Specifically inspect the query-then-create duplicate-open-submission race and access decisions that rely on mission IDs without intended mission/policy versions. Resolve these through an explicit enforceable contract. Identify Boreas's Ice/Climate versus spacecraft-journey requirement mismatch; do not finalize the policy yourself.

Deliver exact inspected commits, proposed endpoint/data/error contracts, emulator checks and deployment prerequisites. Coordinate with G01 before editing; the old root workspace is not automatically the integration base. Read-only audits may overlap; same-checkout writers may not.

## Next responsibilities

1. **J02:** finish versioned mission submissions, recoverable state, scoped coach review, revision history and server-owned outcomes/access. Apply bounded allowed fields to `universe-v1`; no client roles, approvals or entitlements. Bind decisions to the actual task and policy. Make retries and concurrent requests safe.
2. **J03:** implement server-only administrative draft writes, explicit editorial read/review permissions, exact-content-hash approvals, audit trail, immutable release artifacts and atomic active-pointer publication. Reject stale bases and invalidate approvals after edits/rebases. Preserve older session content versions while enforcing current access and withdrawal status.
3. **J04:** support the Aurora/Verdantia release through compatible content delivery and state only where needed. Do not invent a new service for a deterministic local activity.
4. **J05:** implement one evidence adapter and manual generation runtime using GPT's contracts/prompts. Cache reproducible snapshots, retain units/quality/provenance, limit output/retries/spend, validate before draft storage and never give the model live-publisher credentials.
5. **J06:** implement protected observation storage, metadata removal, minimized/restricted precise location, de-identified extracts and artifact-permission checks. No automatic citizen-science posting or private original learner content sent to generation.
6. **J07:** prepare scheduled drafting, queue caps, deduplication, stop controls and correction monitoring only after the cadence gate. Daily drafting is not daily automatic publication.

## Mandatory verification

Use emulators and synthetic data. Prove wrong-organization/learner-forged review denial; missing tenant does not imply shared access; duplicate submissions/decisions/grants are safe; old task/policy versions cannot be confused; ordinary learners/coaches cannot read editorial drafts; edited approvals and stale drafts fail; interrupted publication leaves one complete usable release; source/model failure leaves live intact.

Check withdrawal at mission start/resume/submit, including older pinned visits. Keep recoverable artifacts and readable correction reasons. Stage and rehearse rollback with fresh measurements before proposing deployment. A localhost URL is not evidence that Firebase is using emulators.

## Handoff and permissions

Deliver emulator evidence, exact files/base, endpoint/error examples for Opus, integration notes for GPT and an exact deployment/rollback proposal. Do not treat this task assignment or another agent's handoff as deployment approval; the project's specific written release gates still apply. Update only your own authored handoff/status records. This brief does not assert your session has received or begun the assignment.
