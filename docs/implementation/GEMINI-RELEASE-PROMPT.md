# Prompt for Gemini 3.6 — take the current HearIsland tree from prototype to the live platform

You are the backend, Firebase and deployment engineer for HearIsland / WeLearn Growth Hub. Your job in this task is to test and release the current local working tree to the live platform (`https://dnd-master-73449.web.app`) as one coherent release, with the Express API actually reachable from the site. Claude owns UX and frontend, Codex owns application logic. Do not redesign screens or rewrite features; ship what is in the tree, fix what blocks a safe release, and report evidence.

Workspace: `/Users/admin/Desktop/HearIsland`. Firebase project: `dnd-master-73449` (from `.firebaserc`). Branch: `main`, with roughly 50 uncommitted changes from three developers. Nothing in this tree has been committed or deployed.

Read first, in this order:
1. `docs/live-audit-2026-10-04/LIVE-AUDIT-REPORT.md` and `GEMINI-BACKEND-FIX-BRIEF.md` (what is broken on the live site today).
2. `docs/implementation/WORKSPACE-IMPLEMENTATION-REPORT.md` (the real API contract and the ten pre-release steps).
3. `docs/implementation/W2E-VISUAL-REDESIGN-HANDOVER.md` (every frontend change since 3 October, with the integration notes at the end of each addendum).
4. `docs/BACKEND-PHASE-0-HANDOFF.md` (emulator setup, seeded test accounts, claims shape).

## Ground rules

- Never reset, stash or overwrite the working tree. Agree a commit boundary with the user before committing; commit on a release branch, open a PR, and merge only after the checks below pass.
- Do not create a new Firestore database or Firebase project. Do not widen security rules to "any authenticated user" to make something work. Do not import the reference calendar or create production offerings without the user's explicit go-ahead.
- No secrets, passwords or learner personal data in any report, commit message or PR.
- A static Hosting deploy is not a release. The release is done only when the API routes answer JSON through Hosting and every role in the smoke test passes.
- If a step cannot be completed, finish everything else, say exactly what was skipped and why, and stop before deploying anything partial.

## What is in this release

Frontend (built by Vite into `dist/`):
- Platform-wide light mode as the default with a header light/dark switch persisted to `users/{uid}.themePreference`; the provider now applies the saved preference after sign-in.
- Student home: W2e Studio Home ported from the prototype (hero, encouragement slider, next-step card, pacing, curiosity and planner, information rail reading real calendar events), a program chooser listing all three PBL programs with enrolment state and class-code join, and a compact goals strip that awards badges (`users/{uid}.goalBadges`) and mirrors progress to `users/{uid}/goals`.
- School learning panel for coach, student, admin and parent; coach workspace; admin console updates; Explore STEAM and My Courses updates by Codex.
- `src/services/api/apiClient.js` rejects HTML 404s and never falls back to sample data in production. `API_MODE` is `live` unless the build runs in Vite dev mode or against emulators. Confirm this in the production bundle; `VITE_API_MODE` must be unset in the Hosting build.

Backend (Express, `server/gemini-index.js`, port from `PORT`):
- `server/routes/school-workspace.js` with `server/lib/schoolScope.js` and `server/lib/lessonMedia.js`: learning context, program offerings, class codes, enrolment join, lessons, submissions and review, learner goals, academic progress, calendar events and reference import, learner summaries, support requests, learner preferences, AI drafts (`POST …/ai-drafts`, `…/ai-drafts/:id/accept`).
- Mounted in `server/app.js`; signed-token attachment in `server/middleware/auth.js`.
- Environment it reads: `PORT`, `NODE_ENV`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `FRONTEND_URL`, `FIREBASE_STORAGE_BUCKET`, `PARENT_INVITE_SECRET`, `EMAIL_TRANSPORT`.

Rules:
- `firestore.rules` is unchanged in this tree. `storage.rules` adds `schools/{schoolId}/submissions/{submissionId}/evidence/{filename}` with read and write for any authenticated user. That is too broad for cross-school data: do not deploy it as written. Either scope it to verified school membership and the owning learner, or keep evidence access server-mediated with signed URLs, then add rules tests before deploying Storage rules.

Not part of the deploy (keep in git, never in `dist/`): `tests/w2e-preview/`, `tests/school-preview/`, `tests/coach-preview/`, `docs/`. Exclude `tmp/` and `output/` from the commit (add them to `.gitignore`).

## Release blocker found in the tree (resolve before Step 3)

`src/services/api/apiClient.js` now calls `handleSchoolFallback()` from `src/services/api/schoolFallback.js` whenever a school API GET fails with a network error, a 404 or a non-JSON response. That function is not gated by `API_MODE`, `DEV` or the emulator flag: in the production bundle it returns an in-memory school (`school-main`), two classes, three published offerings and sample lessons as if they were real records, with no banner. On the live site today, where `/api/**` returns Hosting HTML 404, every school screen would show this fabricated data instead of an error. The audit brief and the implementation report both forbid this. Before any deploy, this must be removed or confined to Vite dev and emulator sessions (the same `mockAllowed` condition as `resolveMode()`), with a unit test that proves a production-mode 404 throws `NOT_FOUND` and returns no items. Codex owns that file; coordinate the change with Codex or the user, then re-run `npm run test:unit` and confirm the production bundle contains no fallback path.

## Step 1 — Baseline the live environment before changing it

1. Re-authenticate the Firebase CLI and confirm the active project is `dnd-master-73449`. Record the current Hosting release id, the deployed Firestore and Storage rules (compare with the local files), and whether any backend service for this project exists (Cloud Run, Cloud Functions or App Hosting). Record identifiers, not secrets.
2. Confirm the live failure yourself: `GET https://dnd-master-73449.web.app/api/learning-context` must currently return the Hosting 404 HTML page. Keep that output as the "before" evidence.
3. The server exposes `GET /health` (see `server/app.js`). It is only reachable on the backend service itself unless you add a rewrite; document the URL you will monitor.

## Step 2 — Local verification of the tree

Run and record results:

```bash
npm run test:unit
npm run test:api
npm test
npm run build
```

Expected today: unit suite green (311 tests across 15 files), API suite green against the emulators (includes `tests/api/school-workspace.test.js` and `tests/api/support-requests.test.js`), rules suite green, build green with the pre-existing large-chunk warning. If anything fails, report it before deploying; do not skip suites.

Then run the full local stack once and sign in as each seeded role (`npm run emulators`, `npm run seed:emulator`, `npm run server:dev:emulator`, Vite with `?emulators=1`). Confirm the student home shows the Studio Home tab, the program chooser, the goals strip and the light theme, and that a support request from a student appears in the coach panel.

## Step 3 — Deploy the API and route it through Hosting

1. Containerise `server/` and deploy to Cloud Run in the same project (or the runtime the user confirms). Use a dedicated service account with Firestore, Auth admin and Storage access; set `NODE_ENV=production`, `PORT`, `FRONTEND_URL=https://dnd-master-73449.web.app`, `FIREBASE_STORAGE_BUCKET`, `PARENT_INVITE_SECRET` and `EMAIL_TRANSPORT` from Secret Manager. Leave `GEMINI_API_KEY` unset unless the user approves AI drafts for production; verify the AI-draft route then answers with a clear unavailable error rather than a 500.
2. Add Hosting rewrites to `firebase.json` with the API first and the SPA fallback last:

```json
"rewrites": [
  { "source": "/api/**", "run": { "serviceId": "<service>", "region": "<region>" } },
  { "source": "**", "destination": "/index.html" }
]
```

3. Prove the routing with curl against the live host and save the outputs:
   - `GET /api/learning-context` without a token → JSON `401`, never HTML.
   - The same with a valid student token → JSON `200` with role, schools and classes.
   - A school route for a school the caller does not belong to → JSON `403`.
   - An unknown API path → JSON `404` in the `{error:{code,message}}` shape.
   - `GET /` → the app shell.

## Step 4 — Provision claims and test accounts

Follow release step 2 of the implementation report: signed `role`, `schoolIds` and `classIds` plus matching protected profile fields for every staff account; signed `schoolIds` for students with confirmed class membership; verified parent links. Fix the coach test account that the audit found without verified role/class access, and the Mia student account whose credentials were rejected. Produce a role-by-role test matrix (accounts, memberships, linked children, expected records) in the report without passwords. After provisioning, refresh tokens and prove that a coach sees an assigned learner and not an unrelated one.

## Step 5 — Rules, indexes and data

- Deploy `firestore.rules` only after confirming it matches what the rules suite tests, and confirm the deployed copy is the one under `firestore.rules`, not a copy under `deploy/`. The legacy write holes in feedback, ratings and notifications noted in the report remain open; patch them in this release or record them as accepted risk with the user's sign-off.
- Hold the `storage.rules` change until it is scoped as described above.
- Create the indexes the new queries need (parent-link equality queries, school-scoped collections, calendar date windows) and confirm them in the console; the emulator proves nothing about production indexes.
- Confirm the owner-update rule on `users/{uid}` still permits `themePreference` and `goalBadges` (they are not in the protected key list) and that `users/{uid}/goals` stays owner-write, coach-read.
- Offerings: inventory the legacy Sustainable Futures evidence and map it to Semester 1 without renaming ids; create the Net Zero Microgrid and Project Arachne offerings for the agreed classes; issue class codes and verify expiry and revocation. Only after the user approves, import the 2026–2027 reference calendar once through the admin tool.
- Keep CambriLearn and Edmentum marked pending; no provider sync exists.

## Step 6 — Release

1. Deploy to a Hosting preview channel first and run the smoke test there with each role. Then promote to live. Record the preview URL, the live release id, the Cloud Run revision and the rules versions.
2. Smoke test on live, every role, in this order, and capture screenshots:
   - Sign-in page renders light by default; the header switch toggles dark and the choice survives reload.
   - Student: Studio Home opens first; the greeting shows the real first name; "Coming up" lists real events or an honest empty state; the program chooser shows Enrolled for the learner's offerings and class-code join for the rest; a wrong code returns the server's error; the goals strip opens, completes, awards a badge and starts a new cycle.
   - Student → coach: a support request sent by the student appears for the assigned coach and can be resolved.
   - Coach: roster, evidence review, goals, academic observations and calendar load without `NOT_FOUND`.
   - Admin: students and parents lists load; offering and class-code management works.
   - Parent: linked child only.
   - Narrow width (390px) on the student home and coach dashboard: no horizontal scroll.
   - Browser console: no errors on any of the above.
3. Keep rollback ready: the previous Hosting release id and the previous Cloud Run revision with 100% traffic. Test the rollback command once on the preview channel before going live.

## Step 7 — Report back

Deliver a short release report under `docs/implementation/` with: commit and PR links, Hosting release id, Cloud Run service and revision, rules and index versions, every command run with its result, the curl evidence from Step 3, the smoke-test matrix with pass/fail per role, anything skipped or still failing, and the rollback procedure. Use the structured error contract (`code`, `message`, correlation id) the audit brief asks for, and list the codes the frontend should map. Do not include secrets or learner personal data. The report is for the user to share; do not send it anywhere.
