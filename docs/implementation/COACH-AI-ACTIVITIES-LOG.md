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

## 2026-10-04 · Step 0 Finalized · Gemini 3.6

- Verified `main` branch state: CORS allow-list configured in `server/app.js`, `apiClient.js` signed-out user guard restored, `feature/ux-sprint1` merged, all test suites passed (Unit 372 passed, API 90 passed, Rules 475 passed, production build clean), Firebase Functions & Hosting deployed live, and unauthenticated smoke tests verified.
- main clean at `eaf30c5d49cbea1d54cd5786017b507cf30e2888`; Claude may start Step 1.

