# Coach AI activity builder: handoff log

Append one entry per handoff (newest last): date, agent, step, branch and commits, test counts, what's next, open issues. Never paste keys, tokens or passwords here.

---

## 2026-10-04 · Step 0 · Gemini 3.6 (recorded by Claude from the git history)

- `main` at `0f24c2d`: `9d8a7d0` restricts CORS to an allow-list and keeps the signed-out guard in `apiClient.js`; `0f24c2d` merges `feature/ux-sprint1`.
- Verified by Claude: unknown origins now get `callback(null, false)`; `if (!user)` guard present.
- Note for Gemini: the allow-list also contains `https://dnd-master-73449.firebaseapp.app` (typo of `.com`, harmless but unused).
- Not yet logged by Gemini: Sprint 1 production deployment report (an uncommitted edit to `DEPLOYMENT-REPORT-2026-10-04.md` was still in progress on `main`).

## 2026-10-04 · Step 1 · Claude: shared contract

- Branch `feature/coach-activities-contract` from `0f24c2d`, merged to `main`.
- Added:
  - `src/features/activities/spec/activitySpec.js`: `validateActivity`, `safetyWarnings`, `validateActivityResponses`, `sampleActivity`.
  - `server/lib/ai/activityPrompt.js`: prompt template with the context allow-list, block prompt, and tolerant JSON parsing.
  - `server/lib/ai/adapter.js`: interface, `aiError`, `maskKey`, `createMockAdapter`.
  - `firestore.rules`: deny rules for `coachAiConnections`, `activityDrafts`, `aiUsage`.
  - `docs/implementation/COACH-AI-ACTIVITIES-CONTRACT.md`.
- Tests: 28 new contract tests and 1 rules test. Unit 400 passed · combined emulator suite 504 passed · API 90 passed · build OK (no chunk > 500 kB).
- Decisions used (defaults from the brief, §2): school key default with personal keys optional; Gemini first; coaches publish after safety confirmation; text and simulations only.
- Next: **GPT-6 may start Phase 1** on `feature/coach-activities-p1` from `main` (brief §4.3; contract §3 "Phase 1", §2 responses, §7 UI). In parallel, **Gemini may start Step 2b** (KMS, Secret Manager, IAM, budgets; brief §4.1).

**contract ready; GPT-6 may start Phase 1**

---

## 2026-10-04 · GPT-6 · Phase 1: manual activities

**Phase 1 ready for Claude review**

- Branch: `feature/coach-activities-p1`, based on the merged contract at `eaf30c5`. Commits: `059c63e` (validated lesson specs and response evidence), `03d8a8d` (contract edge cases), `b41f808` (Studio, Player, integrations and screenshots).
- Isolated checkout: `/private/tmp/hear-island-coach-p1`. The shared checkout switched back to `main` during implementation and lost the initial uncommitted edits; work was rebuilt in this isolated checkout to prevent interference. Shared `main` was not merged or modified by this phase.
- Manual Studio in coach PBL Programs: blank/sample starts; structured metadata and all nine block editors; add/delete/reorder buttons and Alt + arrow controls; chart references follow their source tables; per-field validation with accessible descriptions; safety warnings; desktop/390 px live preview; existing lesson draft/revision APIs; focus-contained safety review dialog before publication.
- Student Player: all nine block types; reusable resource lab; table inputs and accessible chart text; answer explanations; code displayed/copied as text; reflection-prefilled editable evidence summary. Responses and retry IDs stay local per learner, lesson and revision until submission. The existing submission API validates responses and preserves XP behavior. Published activities appear in both Program lessons and today's Teen Quest.
- Server owns provenance, rejects invalid activity specs with field diagnostics, records reviewer/time and publication audit metadata, enforces AI-assisted safety confirmation for existing/future AI records, and keeps published lessons immutable. No generation routes, adapters, key management or other later-phase features were added.
- Final verification: `npm run test:unit` **425 passed** (23 files); `npm run test:api` **93 passed** (8 files); `npm test` **529 passed** (25 files, combined rules/unit suite); `npm run build` **passed**, largest chunk **148.61 kB**. Studio and Player are separate lazy-loaded chunks. Shared contract files, rules and `firebase.json` are unchanged.
- Browser verification: disposable coach/student emulator accounts on the isolated preview at localhost:5184; coach created a program offering, saved a sample activity, confirmed safety and published; student joined by class code, saw the published lesson and today's quest activity, answered a prediction, entered data, viewed the chart/text alternative, answered a check, wrote a reflection and submitted evidence successfully. Phone check at **390 × 844** confirmed document width **390 px**, with table overflow contained locally. Keyboard reorder, focus containment, Escape/focus restoration and fallback failures are covered by UI tests. Temporary preview servers/emulators were stopped and the temporary browser tab closed.
- Browser screenshots: `docs/implementation/coach-activities-p1/review-desktop.png` and `student-mobile.png`.
- Next: Claude reviews/refines this phase on the same branch, then owns merging; Gemini deploys only after that review/merge.
- Open issues: no blocking failures. Chinese and Thai translations remain marked for native-speaker review. Exact shared-validator diagnostics remain in English alongside localized guidance; activity/sample content is coach-authored text. The existing resource simulation remains a simplified model. Local answers are device-specific, not cross-device draft sync.
- No deployment, production writes or merge to main was performed.
