# Firebase deployment handoff for Gemini 3.6: baseline release + Teen Quest

Prepared 4 October 2026 by Claude for Gemini 3.6 (Firebase, backend and deployment). Nothing in this report has been deployed. No production data, rules, functions or hosting were touched. Do not deploy anything not listed here, and do not create a new Firebase project or database.

## 1. What to deploy

| Item | Git ref | Status |
|---|---|---|
| Baseline release (personalised dashboards and portfolios, coach lesson media, coach-created programs and class codes, simulation lab starter, operations routes, new sidebar navigation, goal-setting modal) | `main` @ `b5d22f6` | Committed, tested, **not deployed** |
| Teen Quest Phase A (server-awarded XP, levels, badges, weekday streaks, squad goal, API, rules) | `feature/teen-quest` @ `19e6bbc` | Committed, tested, **not deployed** |
| Teen Quest Phases B–C (Quest Home, Quest Map, badge cabinet, level-up, Calm view, coach/parent summaries) | `feature/teen-quest` @ `fbc8209` | Committed, tested, **not deployed** |

Target: Firebase project `dnd-master-73449`, region `us-central1`, function `api` (2nd gen, Node.js 20), Hosting site currently `https://dnd-master-73449.web.app`, launch domain `welearn.org`.

`feature/teen-quest` is based on `b5d22f6`, so deploying the branch deploys both. **Merge only after the project lead (user) approves the merge into `main`.** Do not force-push or rewrite history.

## 2. Verified locally before handoff

| Suite | Command | Result |
|---|---|---|
| Unit and interface | `npm run test:unit` | 21 files, **371 passed** |
| API integration (Auth + Firestore emulators) | `npm run test:api` | 8 files, **89 passed** (includes 12 new quest tests) |
| Rules, model and unit combined | `npm test` | 23 files, **474 passed** |
| Production build | `npm run build` | Passes; the existing large-bundle warning remains |

Browser checks on the emulator stack (student Mia, student Leo, coach Rivera, parent): Quest Home renders with real data; marking a task step awards +10 XP; a reflection awards +15 XP once per day; Ask my coach sends a support request; Quest Map and badge cabinet open; Calm view switches off and back on; a real level-up (Leo, 95 → 110 XP) shows the Level 2 celebration and the Curious Mind badge; dark mode works; 390 px phone width has no horizontal scroll; the coach sees level, streak, badges and verified activity; the parent sees badges only; no page errors.

## 3. Changes that affect Firebase

### Firestore rules (`firestore.rules`)
New explicit deny rules (the default-deny rule already covered them; these document intent):

```
match /learnerQuest/{uid} { allow read, write: if false; }
match /learnerQuest/{uid}/{document=**} { allow read, write: if false; }
match /classes/{classId}/questSquad/{docId} { allow read, write: if false; }
```

The baseline commit also changed `firestore.rules` and `storage.rules` (personalisation, portfolio and lesson media). Deploy the committed files exactly. Confirm which rules file is live; do not edit any copy under `deploy/`.

### New server-only collections (written by the API's Admin SDK only)
- `learnerQuest/{uid}`: XP, level, counters, streak, daily self-XP cap, badges, celebrations, preferences, revision.
- `learnerQuest/{uid}/xpEvents/{type}__{sourceId}`: append-only, idempotent XP ledger. Reflection text is stored here privately and never returned to staff or parents.
- `classes/{classId}/questSquad/current`: `{count, goal, updatedAt}`, class totals only.
- `schools/{schoolId}.features.questMode`: boolean feature flag (default absent = off).

### Indexes
No new composite indexes. Queries used: `xpEvents` ordered by `createdAt` (single field) and `calendarEvents where startDate >=` (single field). Keep `firestore.indexes.json` as committed.

### API (Cloud Function `api`)
New router `server/routes/quest.js`, mounted in `server/app.js`:
- `GET /api/quest/me`: learner's quest view (learners only)
- `POST /api/quest/events`: self-reported `task_step` / `reflection` only; verified types are refused
- `PATCH /api/quest/me`: `calmView`, `showOnPortfolio`, `ackCelebrations`, with revision check
- `GET /api/quest/learners/:uid?schoolId=&classId=`: staff summary; parents get `{badges}` only

Existing routes in `server/routes/school-workspace.js` now award XP **inside their existing transactions**: evidence submission (+40, plus a squad count), coach review (+25, first review only), goal acknowledgement (+10), coach-confirmed goal achievement (+80). `GET /api/learning-context` now returns `schools[].features.questMode`.

The function source is the repository root (`"source": "."`). The server imports `src/features/quest/questModel.js` and `src/features/pbl/content/pblModel.js`, so `src/` must stay in the function upload (it is not in the `ignore` list; keep it that way).

### Hosting
`index.html` now also loads the Unbounded font from Google Fonts. No new rewrites. `/api/**` → `api` must stay before the SPA catch-all.

## 4. Deployment steps (in order)

1. **Re-authenticate and confirm the target.** `firebase login:list`, `firebase use dnd-master-73449`. Record the currently deployed Hosting release, function revision and rules versions for rollback.
2. **Merge after approval.** With the user's approval, merge `feature/teen-quest` into `main` (fast-forward is possible: the branch is `b5d22f6` + two commits). Do not include uncommitted local files.
3. **Install and test on a clean checkout:** `npm ci`, `npm run test:unit`, `npm run test:api`, `npm test`, `npm run build`. All must pass with the counts above (or higher).
4. **Set server configuration** (environment for the `api` function, never in code or reports):
   - `FRONTEND_URL=https://welearn.org`. Without it, CORS falls back to `http://localhost:5173` (`server/app.js:38`); the 4 Oct live response headers showed this fallback.
   - `FIREBASE_STORAGE_BUCKET` only if the bucket differs from `dnd-master-73449.firebasestorage.app`.
5. **Storage and IAM for the baseline release** (from `coach-lesson-media.md` and `learner-personalization.md`): confirm the Storage bucket is provisioned; enable the Storage rules ↔ Firestore integration and its service-agent permissions; give the function's runtime identity Storage object read/metadata access and `iam.serviceAccounts.signBlob` so it can issue signed URLs.
6. **Deploy rules first:** `firebase deploy --only firestore:rules,storage`.
7. **Deploy the function:** `firebase deploy --only functions:api`.
8. **Deploy hosting:** `firebase deploy --only hosting` (from the `dist/` built in step 3).
9. **Leave Teen Quest off** for every school until step 11 passes. The UI then shows the existing Studio Home, while XP still accrues silently from real learning events.
10. **Smoke test, unauthenticated** (expect JSON, never HTML):
    - `GET /api/quest/me` → `401 {"error":{"code":"UNAUTHENTICATED",...}}`
    - `GET /api/learner-space` → `401` JSON
    - `GET /api/no-such-route` → `404` JSON
    - Response header `access-control-allow-origin` must be `https://welearn.org` (or the Hosting origin while the domain is pending), not `localhost`.
11. **Pilot switch-on.** For the pilot school only (proposed: `school-wpr`, the akira@welearn.org pilot), set `schools/school-wpr.features.questMode = true` with the Admin SDK or the console. Then, signed in as `akira@welearn.org`:
    - the home tab shows Quest Home (Level 1, 0 XP for a new learner);
    - a reflection of 40+ characters returns `+15 XP`, and a second one the same day returns "already added";
    - Calm view hides the game elements and "Switch to Quest Home" restores them;
    - an assigned coach sees the learner's quest summary in Learning Goals; a coach of another class gets no summary (403);
    - a direct browser read of `learnerQuest/<uid>` is denied.
12. **Record evidence**: the deployed function revision, Hosting release ID, rules versions, the curl outputs from step 10 and the step 11 results, in `docs/implementation/DEPLOYMENT-REPORT-<date>.md`. Do not paste passwords, tokens or service-account keys into reports.

## 5. Custom domain `welearn.org` (if launching now)
1. Firebase Hosting → Add custom domain `welearn.org` (and `www.welearn.org` redirecting to the apex). Add the TXT and A records at the registrar and wait for the certificate.
2. Firebase Auth → Authorized domains: add `welearn.org` and `www.welearn.org`.
3. `FRONTEND_URL=https://welearn.org` on the function (step 4) and redeploy it.
4. Storage CORS and Auth email templates: update links to `welearn.org`.

## 6. Rollback
- **Teen Quest only:** set `features.questMode` to false (or remove it) for the school. The UI returns to Studio Home immediately; no data is lost.
- **Full:** redeploy the previously recorded Hosting release and function revision. The new rules only add deny rules, so restoring the previous rules is optional. Quest records and the XP ledger can stay; they are unreachable from browsers.

## 7. Costs and operational notes
- Each evidence submission, review or goal update now adds 2 document reads and 2–3 writes inside its transaction, plus one bounded calendar read for holidays. `GET /api/quest/me` performs about 6 reads plus the calendar read. This is fine for one school; add caching of holidays per school and day before a multi-school rollout.
- Holidays are any shared-calendar events whose category or title contains holiday, break, closure, closed or "no school". Ask the admin to label school closures that way.
- Do **not** run `npm run seed:emulator` against production. It creates test accounts, turns quest mode on for the test schools and writes sample XP. It is for emulators only.

## 8. Known limitations (not blockers)
- Legacy goal-cycle badges in `users/{uid}.goalBadges` (browser-written) are not imported into the new server ledger yet; the new system ignores them by design.
- STEAM activity completion and PBL stage clearing do not award XP yet. They need a server-verified source (planned with coach milestone approval).
- Badge display on the shareable portfolio (`showOnPortfolio`) is stored but not yet rendered on the portfolio page.
- Quest Home appears inside the student home tab with its own Quest Home / Quest Map / Badges tabs; no new top-level routes were added, to avoid conflicting with the new sidebar.
- Junior Explorers (primary) does not render Quest Home; the feature is for secondary learners.
- Automatic CambriLearn / Edmentum sync is still pending provider access (unchanged).

## 9. Files changed on `feature/teen-quest`
`server/lib/quest.js` (new), `server/routes/quest.js` (new), `server/app.js`, `server/routes/school-workspace.js`, `firestore.rules`, `src/features/quest/*` (new), `src/features/school/SchoolLearningPanel.jsx`, `index.html`, `scripts/seed-emulator.js`, `package.json`, `vitest.config.js`, `tests/quest-model.test.js`, `tests/quest-ui.test.jsx`, `tests/api/quest.test.js`, `tests/firestore-rules.test.js`, `docs/implementation/TEEN-QUEST-IMPLEMENTATION-PLAN.md`, this report.

Design reference: Growth Hub Teen Quest Redesign canvas (shared by the project lead). Product rules: `docs/implementation/TEEN-QUEST-IMPLEMENTATION-PLAN.md` §3.
