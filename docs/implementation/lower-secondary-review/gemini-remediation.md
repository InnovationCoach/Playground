# Lower-secondary backend review contract for Gemini

Status: review complete; **not approved for activation or deployment**. No backend or rules edits were made during this review. The existing backend implementation is proposed in its own draft PR for owner review. No change to authentication, permission rules, or LAYOUT_CONTRACT_ENABLED is authorized by this document.

Read security-audit.json and security-probe-results.json alongside the code. Findings are ordered by severity. The audit is scoped to the lower-secondary feature and its direct dependencies; it is not a whole-repository security certification.

Required work before clearance:

1. Close cross-school access to DOB-bearing audit entries. The broad audit read rule predates this feature; new DOB-bearing writes increase its impact. Preserve secure provenance reconstruction or replace it with private authority history. Submit the exact rule/permission diff to Mani before implementation.
2. Resolve contradictory staff age-band and class-cohort inputs. The coach form offers primary / 13–15 / 16–18; that band alone is not a verified 11–14 range. Reject conflicts or return existing/ambiguous. Test real coach-created and admin-created accounts, birthdays at 11/15, ambiguous bands, and mismatched cohorts.
3. Make override writes transactionally revalidate the target learner and authority, not just the acting coach. Do not copy stale DOB/cohort/assignment fields from outside the transaction. Test a simultaneous admin DOB correction and class reassignment.
4. Make profile/authority updates consistent on failure. A failed authority write after a successful profile update must not leave the UI presenting the old age decision as the new profile's decision.
5. Align learner/student and primary semantics, and approve the minimal /api/me evidence contract.
6. Review the proposed protected-field rules in tests/api/layout-selection.test.js. They are applied only in memory to demo emulators, not repository rules or production. Test actual signup fields as well as self-enrollment; the shared auth signup currently writes orgId/status that self-create rules deny. Keep existing production files unchanged until specifically approved.

Acceptance: add negative emulator tests for cross-school get/list, stale-scope writes and age contradictions; re-run the backend suite and combined integration; report all failed attempts and retries. Seek coordinator clearance only after these blockers are resolved. Deployment requires Mani's separate written go for the exact step.
