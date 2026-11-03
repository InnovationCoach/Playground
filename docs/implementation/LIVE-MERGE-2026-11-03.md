# Live merge: 3 Nov snapshot onto GitHub main (3 November 2026)

Branch `codex/live-merge-main-20261103` in `output/my-universe/live-merge`, created from GitHub `main` (`2bfcc68`). It merges snapshot `4b08cb0`, the root checkout that built `index-CcohZ1fN.js` (live briefly at 11:56). **Not pushed, not deployed.**

`codex/universe-planet-arrival` (`dc0c975`) is **not** included. It still needs Mani's decision and merges on top of this branch afterwards.

## Result

| Check | Result |
|---|---|
| `npm run build` | passes |
| Universe suite (`npm run test:universe` config) | 8 files, 55/55 |
| Root vitest, emulator-only suites excluded | 70 files, 933/933 |
| Firestore rules suites on the emulator (`firestore-rules`, `mission-submissions-rules`, `pathway-rules`, `sim-economy`) | 170/170 |
| Storage rules (`npm run test:storage`, emulator) | 17/18. The failure also occurs on the untouched snapshot (see risks). |
| API integration (`npm run test:api`, emulator) | 178/179. The failure also occurs on the untouched snapshot (see risks). |
| Local browser check (emulators + demo seed, `?emulators=1`) | WeLearn SPARK branding on sign-in and header. Learner lands on My Dashboard. Sidebar shows My Competencies. My Universe opens. A `learnerMedia` cover-banner upload returns 200 and saves. Course discovery and Pilot operations load in the SPARK shell. |

No hosting preview channel was created. AGENTS.md requires Mani's written go for preview-channel deploys too.

## What was kept from main

WeLearn SPARK header and wordmark, sidebar shell, login styling, My Dashboard landing, SPARK Home, My Competencies, My Universe (explorer, missions, coach submissions), My Courses (catalogue, Edmentum, progress), and the redesigned Messages: group chats, members-only attachments, voice notes. Main's CORS, test-safety guards, firebase.json functions codebase (`functions/`), and the `#/home` route left to the legacy dashboard are also unchanged.

## What came in from the snapshot

- Storage-rule fixes for image uploads (`learnerMedia`, 2-segment `community`, `programMedia`, `lessonMedia`, owner deletes on `solarCar`).
- Storage emulator wiring.
- Pilot operations: admin home, attendance, leave, inventory, and coach day-off requests.
- Course discovery.
- Learner pathway and competency decisions.
- School programs and lessons, media viewer, personalization and portfolio, Teen Quest, activity builder, coach workspace and student invite, and Firestore rule hardening for feedback and notifications.
- nodejs22 functions runtime.

## Conflict decisions (29 files)

| File | Decision |
|---|---|
| `firebase.json` | Main's file. Added `runtime: nodejs22` to the existing `functions/` codebase and an SPA fallback (`**` → `/index.html`) after the `/api/**` rewrite. Dropped the snapshot's root-source functions block, which duplicated the `functions` key and the `api` function. `functions/package.json` now uses node 22 and an esbuild target of node22. |
| `package.json` / lock | Union of scripts and deps. `test:unit` covers both lists. `test:api` uses `tests/api/vitest.api.config.js` with main's project. Kept `engines.node 22`. Dropped `"main": "server/index.js"` because root is not a functions source. Lock regenerated with `npm install`. |
| `vitest.config.js` | Union of include lists (main's + snapshot's suites). |
| `.claude/launch.json` | Main's. The snapshot entries pointed at root worktrees. |
| `index.html` | Main's storage-emulator guard. The React-routed hash list is main's plus `programs\|portfolio\|journey\|space`. |
| `src/app/App.jsx` | Main's shell (eager imports, Sidebar, SparkHome, landing logic). Added `#/space` (personal dashboard with cover/profile images), `#/programs`, `#/journey`, `#/portfolio[/uid]` and `#/courses/discover`, all inside main's Header and Sidebar. Primary learners get the school calendar under Junior Explorers. Not taken: snapshot's lazy loading, TopNav, `#/home` React route, coaches redirected from learner URLs (`isCoachWorkspaceRoute`), and the console default to pilot for non-admin screens. |
| `src/app/routes.js` | Union. Admin default is `pilot`, with attendance, leave, inventory and learning pages. The snapshot's `#/home` route is renamed `#/space`, because main reserves `#/home` and its test expects null. Added `courseDiscovery`, `space`, `journey` and `portfolio` hrefs. |
| `src/features/shell/Sidebar.jsx` (auto) + `messages.js` | Main's sidebar extended. Admin Operations adds Pilot overview, Staff/Student attendance, Day-off requests and Inventory. Admin Teaching adds School learning & calendar. Student Learning adds Coach programs. A new student Create group holds My space, Portfolio maker and Showcase. New labels are in en, zh and th. |
| `Header.jsx`, `sidebar.css`, `TopNav.jsx` | Main's header (no quick theme toggle). Main's sidebar CSS. TopNav stays deleted. |
| `ThemeProvider.jsx` | Main's `system` default, plus the snapshot's effect that follows the saved preference after sign-in. |
| `admin.css` | Main's (theme-aware login). Dropped the snapshot's forced-white login and theme-button CSS. |
| `AdminConsole.jsx` | Main's icon import. Snapshot pilot pages are auto-merged into the body. |
| `CoachDashboardHost.jsx` | Snapshot structure (day-off panel, CoachWorkspace, invite dialog, management tools). Main's `ClassProgramsPanel` and `CoachUniverseSubmissions` (My Universe) sit above the workspace. Main's `destroy()` teardown kept. |
| `CoachDashboard.js` | Snapshot version, because of HTML escaping, removed demo/global roster fallbacks, validated ratings and no client-side account creation. Main's `destroy()`/`isDestroyed` and contrast colours (`#94a3b8`, `#2563eb`) ported. Not ported: main's all-classes/all-users roster fallbacks (privacy) and enrolment chips. |
| `src/firebase.js` | Snapshot `registerStudentAccount` → `POST /api/coach/students` (setup-link flow). Main's `/api/coach/learners` call with a dev-only secondary-app fallback was removed. **Auth change: needs Mani's approval.** |
| Messages (`messagesAPI`, `ConversationView`, `StartConversationModal`, `AdminAuditView`) | Main's versions. The snapshot only changed paths/icons for the old 2-segment upload, which main replaced. |
| `storage.rules` | Snapshot rules for `lessonMedia`, `programMedia`, `learnerMedia`, community (2- and 3-segment) and `solarCar`. **Main's members-only, create-only `messages/{conv}/{msg}/{file}` rule kept.** The snapshot's "any signed-in user may read/write/delete any message file" was not taken. Main's `canva-exports` kept. `tests/storage/dashboard-media.test.js` updated to main's message semantics. |
| `server/app.js` | Union of routers (coach-students, operations, pilot, school-workspace, personalization, quest + main's lti, oneroster, create-learner, canva, universe, coach-universe). Main's CORS, with `https://welearn.org` added to the defaults. |
| `scripts/seed-emulator.js` | Snapshot cohort IDs and classes, plus main's `cohort` field. |
| `MyCourses.jsx` | Main's screen. Course discovery is a separate screen at `#/courses/discover`, linked by a card on My Courses. |
| `ParentPortal.jsx` | Main's child-dashboard button. Snapshot school panel kept. The consent alert was dropped because main removed the consent gate. |
| `goalSettingIntegration.js` | Main's (`showGoalsPanel`). |
| `tests/api/api-test-helper.js` | Main's demo-project guard. |
| `tests/growth-hub-phase0.test.js` | Union. `#/home` → `#/space`. Snapshot "coach entry links" test removed (behaviour not adopted). |
| `tests/journey.test.jsx` | TopNav test replaced by a `menuFor` check for the Create group. |

## Fixes made after the merge (not conflicts)

1. **Pilot operations never reached the API.** `PilotOperations.jsx` called `/pilot/...` instead of `/api/pilot/...`, so every card showed "Unavailable" in the snapshot too, including the 11:56 live build. Fixed, and the test was updated.
2. **Course discovery headline was unreadable.** The legacy `index.html` `header {}` style painted `.cd-hero` navy behind dark text (also in the snapshot). Fixed with a scoped override in `discovery.css`.
3. **`server/auth.js` (auto-merged from the snapshot)** defaulted to the production project `dnd-master-73449` when no project env was set, and dropped `applicationDefault()` and the `getAuth()` readiness check. Restored main's `demo-hearisland-local` default and credential handling. Kept the snapshot's `storageBucket` (needed for signed media URLs): `<project>.firebasestorage.app`, or `<project>.appspot.com` for demo projects.

## Needs Gemini's review (server, rules, scripts)

- About 4,000 lines of server and rules changes: `server/routes/{school-workspace,personalization,operations,pilot-operations,quest,coach-students}.js`, `server/lib/*`, `server/auth.js`, `firestore.rules` (feedback/notification hardening, API-only collections), `storage.rules`, `firebase.json`, `functions/package.json`, and scripts.
- `functions/package.json` does not list `@google-cloud/firestore`. Check that the bundled `functions/` build has every dependency the new server routes import.
- **Storage rule widening (pre-existing in the snapshot):** `programMedia` allows any coach whose class overlaps the offering's, so `learning-media.test.js` "rejects other authors" fails: the peer coach upload succeeds. Decide whether the rule or the test is right.
- **`schools/{schoolId}/submissions/{id}/evidence/{file}`** lets any signed-in user read, write or delete across schools. It is from the snapshot and kept as is. Recommend scoping it.
- **Personalization API (pre-existing in the snapshot):** `GET /api/learner-space` returns 200, where the test expects 403, for one of coach, parent or admin. That makes private customization reachable by staff. Decide behaviour and test.
- `admin-users.js` auto-merged main's cohort mapping with the snapshot's age-band edits. The tests pass, but please review.

## Needs Mani's written approval before any deploy

- Student provisioning moves to `POST /api/coach/students` (setup links, no shared default password). Main's `/api/coach/learners` route and the `createLearner` callable remain on the server but are unused by the UI.
- Firestore rules tighten feedback and notification writes to currently assigned coaches.
- Storage rules: new `learnerMedia`, `programMedia` and `lessonMedia` paths, plus owner deletes.
- Backend: the new routes above. A hosting-only preview channel still uses the project's existing `/api/**` → `api` function rewrite, so preview pages call the **currently deployed** backend. Pilot operations, personal space images, discovery suggestions and school lessons need the new backend to work end to end.

## Suggested next steps

1. Gemini reviews the server and rules items above.
2. Mani decides: (a) include `codex/universe-planet-arrival`; (b) approve a hosting-only preview channel (for example `live-merge-20261103`). Before that: `firebase hosting:channel:deploy live-merge-20261103 --expires 7d`, never a bare deploy.
3. After backend approval: deploy functions + rules to staging or a preview, then save live to a rollback channel before any live step.

## How to try it locally

```bash
cd output/my-universe/live-merge
firebase emulators:start --only firestore,auth,storage --project demo-hearisland-local
npm run seed:emulator          # demo accounts, password in scripts/seed-emulator.js
npm run server:dev:emulator    # API on :3001
npx vite --port 5191           # open http://localhost:5191/?emulators=1
```

Signed media URLs cannot be created by the emulator, because there are no credentials. An uploaded banner saves, but shows the default art locally.

## Arrival merge (`arrival/main` dc0c975 onto `codex/release-20261103`)

Merged `arrival/main` (`dc0c975`) into `codex/release-20261103`. All 6 conflict files resolved:

| File | Decision |
|---|---|
| `docs/implementation/MY-UNIVERSE-O04-PLANET-ARRIVAL-2026-11-03.md` | Kept HEAD's lead UI review section documenting viewport visibility, keyboard interaction, and quiet timing checks. |
| `docs/implementation/MY-UNIVERSE-SCROLL-FIX-QA-2026-11-03.md` | Adopted arrival/main's completed Opus read-only QA report and lead acceptance section. |
| `package.json` | Combined `server:dev:emulator` to run `server/emulator-index.js` with `ALLOW_DRAFT_MISSIONS=true`, all emulator host envs, and storage bucket. Preserved arrival/main's new universe test/emulator scripts and HEAD's full unit/api test commands. |
| `server/auth.js` | Combined arrival/main's `usingEmulators` check with HEAD's `storageBucket` configuration across all initialization branches. |
| `src/features/coach/CoachDashboardHost.jsx` | Kept HEAD's `ManagementTools` subcomponent, day-off leave panel, invite dialog, and `CoachWorkspace` shell, while adopting arrival/main's `orgId = null` parameter and forwarding it to `<CoachUniverseSubmissions coachUser={coachUser} orgId={orgId} />`. |
| `tests/firestore-rules.test.js` | Adopted arrival/main's dynamic `rulesHostname` and `rulesPort` parsing from `process.env.FIRESTORE_EMULATOR_HOST`. |

