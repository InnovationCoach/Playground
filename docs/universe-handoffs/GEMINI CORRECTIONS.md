# Correction request for Gemini: `GEMINI BACKEND.md`

**Date:** 1 November 2026
**Prepared by:** Claude (Opus 5.5), on Mani's instruction, finishing the review GPT-6/Codex started before its credit ran out. GPT-6 had already found that the draft treated older local quest routes as release-line features and overstated what the save rules enforce.
**Scope:** documentation only. Edit **only** `GEMINI BACKEND.md` in `/Users/admin/Desktop/HearIsland/output/my-universe/source`.
**Not allowed in this task:**
- changing source, rules, indexes, configuration or tests
- installing dependencies
- creating branches
- merging or deploying
- making live database changes

Your direction is accepted (see `UNIVERSE.md` §13.1). Please fix the factual errors below, each checked by reading source at `c85552768424dbefea6c1b2d2cf18942a368494e`. Re-check each one yourself before you edit.

1. **No `/api` rewrite.** `firebase.json` has no `rewrites`; Hosting serves `dist` only. Remove "mounted behind `/api/**` rewrite". State that the Express server's deployment target and its public route are **not defined on this line and unverified**.
2. **Mounted routes.** `server/app.js` mounts only these, plus inline AI endpoints:
   - `/api` (session)
   - `/api/admin/users`
   - `/api/admin` (reference)
   - `/api` (parents)
   - `/api/lti`
   - `/api/oneroster/v1p1`
   - `/api/coach/learners`
   - `/api/canva`

   `server/routes/` has no `quest.js`, `school-workspace.js` or `personalization.js`. Remove these from the release-line description.
3. **Teen Quest ledger.** `server/routes/quest.js` and `server/lib/quest.js` do not exist at this commit. Describe the two-phase transactional ledger as a **proposed future pattern** (or "from an older local line, not present here"), not as existing infrastructure or a release-line "benchmark". Apply this in §0, §1.2, §2 diagram and §5.2.
4. **Closed collections.** `learnerQuest`, `learnerSpaces`, `learnerPortfolios` and `coachAiConnections` don't appear in `firestore.rules`. They fall under the general default-deny rule only. Correct §1.2.
5. **Storage rules.** `storage.rules` matches only `/community/{uid}/{postId}/{filename}` plus a catch-all. Remove the `/users/{uid}/...` and `/schools/{schoolId}/...` claims.
6. **`activityProgress` enforcement.** The existing rule is `allow create, update, delete: if isOwner(userId)`, with no key, size or schema checks. In §0, §2.2, §3.4 and Q3:
   - State that the 100-entry caps, 64 KB cap and fixed key set are **proposed new rules (Gemini-owned)**, with emulator tests.
   - Say they are not existing protections.
   - Remove "uses existing Firestore rules … without introducing new rule definitions" as a safety claim.
7. **Coach read helper.** Under `users/{userId}/activityProgress/{docId}`, coach reads use `isCoachOf(userId)`, not `coachSharesClassWith(resource.data)` (§3.1).
8. **Fact tags.** In §2.1, Thalassa's "112 kPa" and Ignis's sulfur dioxide statement are facts about fictional planets, so tag them `fictional-world`. Keep `real-science` only for sourced, real-world facts reviewed by an educator.
9. **Hex-Grid identifiers.** In §6, use `MODEL_VERSION = 'HexGrid-v1.0'` and `K.seawaterDensity.v = 1025 kg/m³`, not `'1.0'` or `DENSITY_SEAWATER`. Keep the point that it is a steady-state daily balance that excludes weather, storms, waves and seasons. State that the `thalassa-storm` example is described content, not a Hex-Grid simulation.
10. **`seedrandom`.** It isn't a dependency. Say "a seeded deterministic function", or mark adding it as a future dependency decision.
11. **"Cloud Functions" API host.** `functions/index.js` exports only the callable `createLearner`. Label the API host as undecided or proposed.
12. **Numbers and hashes.** Mark "sub-50ms", "<250ms" and the asset size limits as **proposed budgets, not measured**. Use an asset content hash in example filenames, not the source commit `c855527`.
13. **Compliance wording.** Change "Strict COPPA / FERPA Compliance" to privacy design goals that need a legal or privacy review.
14. **Staging store name.** Choose one proposed name instead of `cosmosCatalogDrafts`, `adminUniverseDrafts` and `admin/universe/draftBlueprints`.
15. **Live-match note.** In §1.1, label "`697f785` matches live bundle" as "per earlier session verification; not re-checked".

When you finish:
- Add a dated "Corrections applied" note to §12 of `GEMINI BACKEND.md`.
- Confirm that you changed documentation only.
- Report the saved path.

Then stop. Mani decides the next step (`UNIVERSE.md` §13.4). Implementation is still awaiting Mani's written approval.
