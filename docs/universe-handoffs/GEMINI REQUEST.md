# Documentation handoff request — Gemini

**Delivery state:** prepared by GPT-6; not sent. Depends on Claude's actual design document.  
**Authorized scope:** documentation only, approved by Mani on 1 November 2026.

Work in the existing shared checkout:

```text
/Users/admin/Desktop/HearIsland/output/my-universe/source
```

Read `AGENTS.md`, `UNIVERSE.md`, **Claude's completed `CLAUDE DESIGN.md`**, the existing My Universe technical report and `docs/universe-handoffs/STEM-REUSE-AUDIT.md`. If Claude's document is absent or incomplete, stop and report the missing dependency. Do not invent Claude's decisions or treat this request as a replacement for the design.

Include Claude's existing 3D prototype report at `/Users/admin/Desktop/HearIsland/output/universe-3d/UNIVERSE-3D-TECHNICAL-REPORT.md` in the read-only audit. Keep its current in-memory `owned` sample inventory distinct from authoritative entitlements and its preview `store` contract distinct from a deployed persistence service. Do not migrate or repair that implementation in this stage.

Write **only** `GEMINI BACKEND.md` at this checkout's root. Inspect relevant existing source/docs read-only. This is a backend audit and contract proposal, not implementation authorization. Preserve source, prototypes, saves and other agents' files. Do not install dependencies, create branches/another checkout, modify code/rules/indexes/config/tests, change authentication/permissions/secrets/IAM, perform migrations, seed data, merge or deploy. Do not create or alter a live database. Mark unavailable live metadata as unverified rather than resolving it through an unapproved access change.

Include:

1. Inspected repository base/branch and what services/records/rules actually exist on the intended release line. Keep older local prototype services separate from deployed/available capabilities.
2. Proposed boundaries for versioned universe/galaxy/system/planet/environment catalogs, learner-owned exploration/saves and trusted access/progression. Clearly label new contracts as proposed, not existing endpoints/collections.
3. Ownership/tenant isolation, authenticated scope, shared-device behavior, revisions/conflicts, retry/idempotency, publication/version pinning, retention/recovery and limits.
4. How authoritative reviewed learning evidence/readiness could gate optional destinations. Age informs scaffolding; it does not by itself establish competency. Browser sample rewards, local self-checks, clicks and simulation outputs are not verified achievement.
5. XP/rewards disabled until trusted source verification, an authoritative ledger/grant flow and tests exist. No essential educational tools may be locked or inactivity penalties introduced.
6. Future planetary STEM modules: source-audit their existing state/persistence, identity, simulation outputs, evidence and any credit/economy interactions. Identify possible adapters without writing them. A floating-city ocean planet is a future interdisciplinary example, not a required migration now.
7. Future weekly mission/environmental-event lifecycle: authored/reviewed/versioned content, learner assignments/scaffolds, reproducibility and authoritative progress. Do not implement scheduling, task wakeups, mission generation or changes to existing activity data.
8. Future connected-universe snapshots, approved visitors, revocation and supervised resource exchange. Preserve private data; no unrestricted student communications.
9. Future AI generation as draft proposals subject to educational/scientific/safety/quality review and controlled publication; no automatic access grants or publishing.
10. Responses to each of Claude's backend questions, conflicts with the current architecture, unresolved decisions, risks, an emulator verification plan for later approval and a bounded proposed implementation sequence.

Database edition, deployed release and existing provider/service availability must be established before future schema/rule implementation; source inspection is not live verification. Do not port the older workspace backend wholesale.

Finish with a dated handoff status, remaining decisions and exact path to the completed file. Confirm documentation-only changes. GPT-6 will review both documents and update `UNIVERSE.md`; implementation waits for Mani's explicit approval of that coordinated recommendation.
