# Verified XP and account organization — proposed backend contract

Status: design only, October 30, 2026. No reward writer, ledger, new rule, provider connection, migration, or deployment was added. Gemini owns server/, rules, indexes and scripts/ under AGENTS.md; this document is a handoff, not authorization to change live data.

## XP eligibility and integrity

The existing local XP calculator accepts activity starts, checklist ticks, habits and readiness. These are not verified learning evidence. My Dashboard no longer calls or displays that calculator. Keep the legacy pure helper only for compatibility; never use its results for awards or migration.

Propose server-authoritative events from a provider completion/mastery record or an authorized coach's approved PBL rubric/milestone with evidence. Before enabling rewards, define academic source availability, passing/completion criteria, coach scope and rubric approval rules with the platform lead. No XP for clicks, visits, timers, opening an activity, self-checked goals, samples, local progress records or merely uploading evidence. Sessions a learner marks complete in their own `activityProgress` record are learner-reported completion, not coach-verified mastery: they never earn XP or unlocks on their own, and dashboard wording must keep saying "marked complete by you · not coach-verified". Only an authorized coach's approval of that work (or a provider mastery record) can become an award event. No automatic conversion of legacy local data.

Each accepted event needs organization, learner UID, trusted source/provider, immutable source event ID and milestone ID/version, evidence reference, verifier identity, occurredAt, receivedAt, policy version and awarded amount. Validate learner ownership, enrolment and verifier scope on the server. In one transaction, insert an immutable ledger event with a unique key derived from source + learner + milestone + version, update the verified total, and grant newly reached entitlements. Replays, retries, concurrent requests and repeated completion must award once. A new version of the same milestone does not automatically qualify again: policy must explicitly permit it. Reject incomplete, unsigned, unsupported, test and sandbox events. Do not accept amounts, totals or unlock flags from the browser.

Store corrections as audited compensating events with reasons and verifier identity. A learner may request review. Normal corrections do not revoke permanent unlocks; abuse/administrative revocation requires a separate audited policy. Never maintain the ledger in the existing owner-writable activityProgress collection. New protected storage and rules require a separately implemented and tested backend contract.

## Optional permanent rewards

Proposed, unapproved catalogue: visual themes/effects, optional mini-games, and cosmetic AI companion appearances. Thresholds and award amounts remain unset until verified event samples and fairness review exist. Once earned, an entitlement remains available without spending XP or requiring daily attendance. No streak pressure, expiry, leaderboard or penalty for absence. AI companion cosmetic upgrades must not alter safety, privacy, required learning support or spending limits.

Courses, PBL work, learning plans, notes, focus sounds, accessibility settings, calm view, essential themes/fonts and navigation remain free and available regardless of XP. Respect calm/reduced-motion settings for every optional effect. Keep rewards disabled when a provider is unavailable; show honest connection status rather than estimating XP.

Enablement gate: reliable academic and PBL feeds; evidence/identity checks; replay, correction and concurrency emulator tests; scoped coach permissions; server-only ledger rule tests; accessible UI review; synthetic event reconciliation; pilot review; explicit approval for the exact preview deployment. Production enablement is a separate decision.

## Account provenance and counts

The account list API currently returns Firestore user profiles and pagination, not a Firebase Authentication inventory. Its formatListItem strips classification metadata. Therefore the client cannot verify live real/test totals, Auth-only users or Firestore-only profiles. Unmarked records remain Unclassified and visible by default, never silently counted as real.

Proposed server fields: accountType = real | test | unclassified, classificationSource, reviewedBy, reviewedAt, and optional reviewRole = student | coach | parent | administrator. These fields must be admin-controlled, organization-scoped and exposed in the list response. Configure exactly one existing test UID per review role after human verification; do not infer from names, email domains or role alone, and do not create or delete accounts to make the UI match.

Add server-side accountView filters applied before pagination, and counts scoped to organization, caller permissions, current role/search/status/cohort filters. Return source, asOf, classification counts, selected review UIDs and whether the inventory is complete. Separately reconcile Auth and Firestore by UID using read-only administrative inventory access, with counts of Auth-only, profile-only, linked and disabled records. Access and output must preserve privacy. No auth role, credential or permission changes are authorized by this contract.

The current frontend reads all authorized pages before counting/filtering, fails on page errors/repeated cursors and caps at 10,000 records. Replace this adapter with server-side filtering/counts before scaling. Never count one page as the complete inventory. Preserve all synthetic fixtures for automated tests. No user data was deleted, archived, disabled or relabeled by this implementation.
