# My Universe — implementation review findings

2 November 2026 · GPT/Codex lead · Closed for the local Phase 1 pilot; see MY-UNIVERSE-PHASE1-ACCEPTANCE-2026-11-02.md

Read-only review findings from the independent O02/J02 checkouts. Owners retain their files. A finding closes only when its actual fix and verification exist.

## Frontend — Opus

| ID | Observed case | Required result | Status |
|---|---|---|---|
| F1 | `universeClient.js` accepted any successful object; history coalesced missing submissions into `[]`. Initial fix adds envelope checks, but draft checks accepted missing updatedAt and response identity was not bound. | Missing/wrong contract, incomplete/wrong-task drafts and contradictory withdrawn/unknown availability are explicit errors/paused, never successful empty work or enabled assessed actions. | Closed in dd4d581; identity/response cases and the real three-route flow pass. |
| F2 | `partFromWire` decides a saved table fits by dimensions alone. | Same-size tables with different caption/headers retain their exact saved representation; no silent relabeling. | Closed in dd4d581; saved caption/headers/given cells are preserved. |
| F3 | Mission sheet's alive ref is set false during cleanup without restoring/generating it on effect setup. | StrictMode effect replay and old account/org responses cannot disable or overwrite current state. | Closed by StrictMode setup plus 39e70d2 context generations; fresh UI/provider tests pass. |
| F4 | Three G03 wind template cells ask for a summed output fraction or hours for a dimensionless CF. | Read-only “Not applicable” for those slots; weighted hours and raw/planning CF remain learner work. | Closed: getTableTemplate integrated; source hashes unchanged. |
| F5 | Captured Help style text displays authoring instructions (“Show the worked example…initially”) and briefing decision exposes raw plan-a/plan-b IDs. | Learner-facing support/decision wording. | Closed in 63768f2 with shared presentation adapter 1.0.1. |
| F6 | PilotMissionSheet declares aria-modal but handles only Escape; its parent deliberately returns from key handling while the sheet is open. | Tab and Shift+Tab remain inside the active sheet, Escape closes it, and focus returns to the opener when still present. Verify forward/backward wrap and context-switch teardown. | Closed in 63768f2; wrap, dynamic stops, Escape and opener tests plus browser checks pass. |

F4 is an explicit presentation clarification, not a silent mutation of the accepted authoring bundle. It leaves exact source hashes, identity, rubric and numerical references intact. Runtime/published presentation must identify the adapter version and build as well as content version.

## Backend — Gemini

| ID | Observed case | Required result | Status |
|---|---|---|---|
| B1 | New Universe auth can use decoded token role/org/classes without a current protected membership record. | Changing/revoking authority must affect old-token requests and idempotent replay. Re-read current server-controlled claims/authority and deny stale/conflicting/revoked scope. | Closed in J02 and final scoped API/rules checks; stale authority and replay are denied. |
| B2 | New auth retains a claimed class when its class document does not exist; organization and roster checks are conditional on fields being present. | Missing/deleted/malformed or wrong-org class authority fails closed. Seed valid synthetic class data rather than weakening guards for absent fixtures. | Closed in J02; missing/wrong-org/malformed/revoked class/roster cases pass. |
| B3 | `isEmulatorEnvironment` accepts missing project/auth/firestore context in some branches (e.g. FUNCTIONS_EMULATOR alone, or a Firestore host with no Auth host/project). | Fixture/test acceptance requires both local emulator hosts and a nonempty demo-* project. Missing context fails closed; production graph remains fixture-free. | Closed: strict environment and explicit entry guards; four unsafe starts refuse before listening. |
| B4 | Draft idempotent replay chooses the latest draft record, but top-level revision/updatedAt come from the original responseSnapshot. | Retrying save A after save B returns a coherent original committed A result without rewriting B. GET still returns B/current revision. No mixed-revision envelope. | Closed: original committed save response is coherent; later saved work stays current. |
| B5 | Draft/submit previousSubmissionId validation checks owner/org, returned status and mission family, but not exact route/task/version/release/policy or legacy format. | With no authored migration rule, a revision link must match the exact eligible task identity and cannot upgrade a legacy or different-route attempt. | Closed: exact task/owner/returned/non-legacy link validation; no migration inferred. |
| B6 | Submission creation checks stored bytes; the review transaction adds note/outcome/reviewer metadata without another stored-size check. | After a review, the stored snapshot remains within the agreed 64 KiB budget. Reserve review overhead at creation or validate the complete proposed record before transaction writes. | Closed: creation reserve and full proposed reviewed-record byte check; API cases pass. |
| B7 | New explorer-preferences rule bounds bookmarks by list size only. A one-element list may still contain an arbitrary nested map or oversized string. | Reject nested/non-ID bookmark values and bound aggregate preference data on create and update. Test a nested mission-draft map and an oversized bookmark string, alongside valid bookmarks. | Closed in 1167a9f: types + bounded ID shape on create/update; all 50 max-length IDs succeed; nested/oversized/separator cases fail. |
| B8 | Fixing old-return-link reuse added an ever-growing consumedReturnedIds array to the family lock. | Keep the lock bounded; record one bounded supersession pointer/link per returned attempt instead of accumulating every prior ID in one document. Preserve old evidence/status and enforce link uniqueness atomically. | Closed in 1167a9f: one private missionRevisionLinks document per returned attempt; scalar family lock, original evidence untouched. |
| B9 | Backend GET availability is flat and draft GET lacks a top-level identity echo, while final O02 client requires identity-bound wrapped responses. | Adopt the canonical integration envelopes below and run the real frontend client against the real API. | Closed in 1167a9f: canonical identity envelopes pass the actual frontend adapter. |
| B10 | The synthetic service deletes a draft after submit; real service preserves it. | Keep server drafts on submit, preserving independent/newer work and monotonic save revisions. Update the synthetic stand-in and client tests to this behavior. | Closed: real service retains drafts; Opus aligned stand-in/revise behavior; browser reload/resubmit and integration checks pass. |
| B11 | retired + allowInProgressFinish currently enables PUT creation at expectedRevision 0 and POST without proof of a prior in-progress cohort. | Pilot retirement always pauses assessed start/resume/submit. A future authored retirement policy can add verified cohort completion in a new capability/policy. Preserve read-only work/history now; an ad-hoc override flag alone cannot enable new work on a retired version. | Closed in 1167a9f: retired pilot permissions all false regardless of ad-hoc override; read-only recovery preserved. |

Firebase documents reading existing server-stored `customClaims` through `getUser(uid)`, and explains that changed claims reach client ID tokens on refresh or a later sign-in. [Firebase custom claims documentation](https://firebase.google.com/docs/auth/admin/custom-claims).

**Inference for this contract:** signature verification alone does not establish current role/class scope after a claim change. The Universe service needs a current protected authority check, especially before replaying private results. A server-only membership record can supply this if absence/revocation cannot revive an old token's grant.

The initial profile-create/delete-recreate finding is in the separate baseline rules audit. The new auth no longer treats arbitrary profile fields as grants, but B1/B2 must be resolved before claiming the current-scope requirement is satisfied.

Initial B4 reproduction (now fixed): save A with key A at expectedRevision 0 → revision 1; save B with key B at expectedRevision 1 → revision 2; retry A. The initial implementation returned top-level revision 1 together with nested draft B/revision 2. Return the committed original A snapshot consistently; retrieve current state separately.

Firestore lists are not necessarily homogeneous; an `is list` and item-count check alone is not an element/schema check. [Firebase List reference](https://firebase.google.com/docs/reference/rules/rules.List). B7 concerns the explicitly restricted universe-v1 preference document, not a request to redesign unrelated activity storage.

## Canonical integration decisions

These settle implementation details left open by the accepted contract without changing task identity, assessment criteria or production policy:

- **GET availability:** `{contractVersion, identity: {releaseId,missionId,missionVersion,routeId,taskId,policyVersion}, availability: {...}}`.
- **GET draft:** `{contractVersion, identity: {...}, draft: null | {draftId,revision,updatedAt,supportMode,activeStepId,answers,evidence,reflection,previousSubmissionId,...identity}}`. Additional current availability/top-level revision metadata is allowed but must be coherent.
- **PUT draft:** keep the complete committed snapshot under `draft`; idempotent replay is internally consistent with that original save. Current state is retrieved separately.
- **Submitting does not delete the independent draft.** The submitted evidence is an immutable snapshot. Saved draft revision remains monotonic; submitting cannot erase a newer saved draft. The synthetic service must match the real service on this point.
- **Pilot retirement:** read-only history/notes remain available. No currently authored pilot policy permits assessed completion after retirement; all assessed permissions are false. A future version must explicitly define and enforce any eligible in-progress cohort.

The combined `tests/integration/universe-pilot-acceptance.mjs` uses the actual frontend HTTP adapter against the actual service and dedicated local emulators. It covers all three route/tasks, concurrent create/replay, coherent saved-work replay, retained drafts, exact feedback links, cross-org denial and returned → revised → reviewed-only outcomes. It passes all three routes on the integrated candidate with a matching dedicated local Auth/Firestore emulator pair.

## Integration checks completed

- Emulator fixture availability and frontend permissions must agree; no production query flag can activate a fixture.
- Actual incoming request bytes, canonical validation bytes and bounded stored document overhead must all be enforced.
- Production build graphs must exclude fixture data; Functions must load without a parent checkout.
- Exact context cleanup, draft revision conflicts, immutable returned attempts, resubmission and reviewed-only outcomes need a combined demonstration.

## Final closure additions

| ID | Finding and disposition |
|---|---|
| F7 / F7.1 | Actual UID/org host wiring, ID-token observer and callback generations are integrated; 10 provider/subscription cases and delayed UI/queue tests pass. Old-context work/queues and stale profile results cannot restore another account. |
| F8 | Empty continuation pages retain Load more and truthful copy. |
| F9 | Legacy coach records are read-only in the UI and API, including a legacy flag on a currently known task identity. Current-format review still works. |
| B12 | Teacher paging consumes a bounded raw window, then filters current roster and advances by last raw record; newer revoked rows cannot hide older eligible work. |
| B13 | All direct missionSubmissions reads/writes are denied, including legacy/owner/teacher/admin get/list. Current authority is enforced by the API. |
| B14 | Universe feedback/audit events moved into private auditLogs/universe/events; the old flat audit reader cannot expose them. Atomic writes and audit IDs are retained. |

GPT completed remaining backend/rules/config work after the actual Gemini session stopped for insufficient credits; Opus retained frontend ownership. No fourth model was used. The final verification is 114 UI, 23 shared, 537 broader unit, 131 rules and 65 API tests, all three real-client route flows, four entry-safety cases, production fixture isolation and isolated Node 22 Functions loading. See the completion record for exact scope, browser measurements, source hashes and student-device follow-up.

The per-attempt revision link is the bounded supersession rule: any same-owner exact-task returned attempt not already linked may be revised once; no route/version migration or new attempt cap is introduced. Universe audit events are private server records at auditLogs/universe/events/{auditEventId}. Historical authoring bytes and prior baseline findings remain evidence, not outstanding acceptance blockers.
