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

