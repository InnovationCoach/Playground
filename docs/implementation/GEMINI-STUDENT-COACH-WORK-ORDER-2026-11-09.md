# Gemini assignment: academic data and coach services

Read AGENTS.md and STUDENT-COACH-IMPLEMENTATION-PLAN-2026-11-09.md in this directory. This is the backend work assignment requested by the user; receipt/execution has not been confirmed.

Own G0–G5 in the plan. Begin G0 by auditing real provider capabilities and publishing a concrete, versioned API/data contract with examples, validation, error states and synthetic fixtures. Supply a specific permission/cohort/parent visibility proposal for Mani; do not implement authentication or permission changes before explicit approval.

Then implement G1 three-term academic calendar, versioned curriculum imports for the three provider adapters, ILP/pacing and approved cohort contract; G2 routines, help requests and review history; G3 PLP/milestones/readiness, essay and recommendation workflows; G4 authored practice/scoring/hints; G5 emulator/security/recovery verification and release proposal.

Work in a separate checkout on backend/student-coach-gemini from the agreed baseline. Preserve unrelated uncommitted work. Own server/, persistence, rules, indexes, scripts/ and backend tests. Opus owns frontend; provide contracts rather than editing the same client files concurrently. Declare ownership of any shared model before editing it.

Discover existing services before proposing parallel collections/endpoints. Define tenant and learner scope, provenance, original grade scales, revision conflicts, retry idempotency, private versus published feedback and reassignments. Canonical pacing and readiness are explainable server outputs. A generic desk must link to existing mission review authority without replacing it.

Provider adapters start with documented exports and reviewed mapping. Synthetic adapters do not prove real provider compatibility. Automatic sync requires authorized provider access and documented capabilities. Failed sync preserves previous data; configuration saved does not mean connected. Never manufacture scores, sync timestamps or successful launches.

First handoff: capability audit, endpoint/schema contract, fixture bundle, exact access-policy proposal, dependencies and G0 verification. Subsequent handoffs include work IDs, branch/commit, changed paths, API/emulator tests, contract revision, reproduction steps, pending approvals and operational limits. See main plan for full acceptance criteria.

No production seed/migration/write/deploy. Use demo Firebase emulators, not merely localhost. Before any push inspect origin/main diff, run relevant tests/build and report. Prepare deployment and rollback instructions only; Mani must authorize the exact step in writing.
