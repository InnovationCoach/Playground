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
- main clean at `c0fd464caac1bb1296d7dff89a6258e855d5a0cd`; Claude may start Step 1.

---

## 2026-10-04 · Side task (project lead request) · Claude: student dashboard redesign + Portfolio maker

Not part of the Coach AI phases, but it changes shared student-side files. **GPT-6: build Phase 1 on top of `main` at or after `c4ad7ae`.**

- Merged `feature/student-dashboard-design` (`7ed46f2`) into `main` (`c4ad7ae`).
- Changed shared files: `src/features/shell/TopNav.jsx` + `sidebar.css` (new grouped side menu, class prefix `hb-`; add new student links to `studentGroups()`), `src/app/App.jsx` (new lazy `JourneyPortfolio` and `#/journey` screen), `src/app/routes.js`, `src/app/i18n/messages.js` (`nav.*`, `journey.*` keys), `src/features/personalization/*` (larger dashboard header; portfolio items accept `phase` + `phaseReflection`).
- New: `src/features/journey/*` (Portfolio maker and printable PDF document), `src/features/shell/useLearnerAvatar.js`.
- For the Activity Player (contract §7): learners reach it from Learn › Lessons. If you need a side-menu entry, add it to the `learn` group in `studentGroups()`. Do not restyle the `hb-` menu.
- Tests: unit 411 · API 91 · combined 515 · build OK. Uploads are verified by unit tests with a mocked upload. A real file upload still needs a check on staging (the local stack has no Storage emulator).
- Deploy note for Gemini: hosting and the `api` function together (portfolio item validation changed); no rules changes.

---

## 2026-10-04 · Side task deployment · Gemini 3.6: student redesign deployed at f19b3f8

- Deployed `main` at `f19b3f8` to Firebase project `dnd-master-73449` (`https://dnd-master-73449.web.app`).
- Included: Student dashboard redesign, new grouped side navigation menu, Portfolio maker (`#/journey` and PDF export `#/journey/print`), `phase` & `phaseReflection` server-side validation in `server/routes/personalization.js`, and updated `firestore.rules` (including deny rules for `coachAiConnections`, `activityDrafts`, `aiUsage`).
- Verified test suites: Unit 411/411 passed · API 91/91 passed · Combined 515/515 passed · Production build 985ms with zero >500 kB chunk warnings.
- Verified live deployment:
  - Firestore security rules updated.
  - Cloud Function `api(us-central1)` deployed (`https://api-6my6jtc3oa-uc.a.run.app`).
  - Hosting released (`https://dnd-master-73449.web.app`).
  - Unauthenticated endpoints (`/api/learner-space`, `/api/quest/me`) return `HTTP 401 UNAUTHORIZED`.
  - App shell (`/#/journey`) loads `HTTP 200 OK`.
  - CORS origin check verified.
  - Signed-in verification with Akira (`akira@welearn.org`): verified `GET /api/learner-space`, `GET /api/quest/me`, `POST /api/learner-space/items` with `phase: "explore"` and `phaseReflection: true`, verified `firebaseStorageDownloadTokens` removal, and cleaned up test portfolio item cleanly (`DELETE`).
  - Signed-in verification with Coach (`coach.wpr@school.edu`): `GET /api/learning-context` HTTP 200 OK.
- Detailed report written to `docs/implementation/DEPLOYMENT-REPORT-2026-10-04-student-redesign.md`.

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

---

## 2026-10-04 · Refinement & Release · Gemini 3.6: Phase 1 deployed at 6763d69

- Merged `feature/coach-activities-p1` into `main` at commit `6763d69`.
- Integrated with recent `main` changes (student dashboard redesign + Portfolio maker).
- Refined Studio and Player accessibility, dynamic table index tracking for charts, focus containment, i18n, and error handling.
- Verification after merge:
  - Unit tests (`npm run test:unit`): **436 / 436 passed** (24 files).
  - API integration tests (`npm run test:api`): **94 / 94 passed** (8 files).
  - Rules & full test suite (`npm test`): **540 / 540 passed** (26 files).
  - Production build (`npm run build`): Clean compilation in 961ms with **zero >500 kB chunk warnings**.
- Firebase Deployment & Smoke Tests:
  - Firestore rules released.
  - Cloud Function `api(us-central1)` deployed (`https://api-6my6jtc3oa-uc.a.run.app`).
  - Hosting released (`https://dnd-master-73449.web.app`).
  - Production smoke tests verified 401 unauthenticated response, CORS origin guard, Coach sign in (`coach.wpr@school.edu`), and Student sign in (`akira@welearn.org`).
- Detailed release report created: `docs/implementation/DEPLOYMENT-REPORT-2026-10-04-coach-activities-p1.md`.

---

## 2026-10-05 · GPT-6 · Phase 2 started: provider and validation foundation

- Branch: `feature/coach-activities-p2`, isolated checkout `/private/tmp/hear-island-coach-p2`, based on `main` at `e17ecef`. Shared main and unrelated work are untouched.
- Added server-only Gemini REST adapter with explicit model configuration, header-only credentials, fixed provider endpoint, redirect rejection, cancellation/45-second deadline, sanitized failures and usage validation. Added activity generation and same-type block regeneration pipelines using the shared prompt builders and validator, one validation repair, forced AI provenance and safety warnings. No HTTP route exposes this foundation yet.
- New provider/pipeline tests use simulated responses only. No real Gemini call, microphone/browser test, cloud configuration, deployment, `firebase.json` change or merge was performed.
- Verification: unit **462 passed** (25 files, including 26 new provider/pipeline tests); API **94 passed** (8 files); combined rules/unit **566 passed** (27 files); production build passed, largest chunk **159.09 kB**. API and rules tests ran sequentially against disposable local emulators, which shut down afterward. No generation-route, rate-limit or cap integration is claimed by these counts.
- Contract questions for Claude, required by agent brief §4.3 before dependent implementation:
  1. What exact lesson request field links a generated draft to its lesson, and how must server-owned AI provenance survive subsequent coach edits? Phase 1 currently marks incoming lesson activities as manual; trusting browser-supplied provenance would bypass the AI review requirement.
  2. How are edited generated drafts saved and versioned before block regeneration? Define the request/version behavior for unsaved edits and simultaneous regeneration; current routes only specify generate, regenerate, list and delete.
  3. Which approved fields/records reserve monthly tokens and rolling-hour attempts across concurrent requests? Define reservation release, UTC month boundaries, successful provider calls whose JSON fails validation, repair usage, timeouts and persistence failures. Provider calls must not run inside retryable Firestore transactions.
  4. Confirm school eligibility for the shared secret/model configuration, Phase 2 response for `keySource:'personal'`, and the compatibility behavior for existing consumers of legacy `/ai-drafts`. Record Secret Manager binding/readiness before a real provider smoke test.
- Next: close those contract decisions, then implement authorized routes, usage enforcement and Studio integration. This is a partial foundation, **not Phase 2 ready for Claude review**.
