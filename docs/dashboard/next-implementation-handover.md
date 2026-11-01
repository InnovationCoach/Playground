# WeLearn Spark next implementation handover

October 30, 2026 · Local implementation and offline verification

Latest continuation: see [the five-slide implementation handover](slides-implementation-handover.md). The report below describes the earlier personalization stage.

## Checkout and preservation

Existing checkout: `/Users/admin/Desktop/HearIsland/output/student-dashboard-20261030/source`.
Branch remains `codex/student-dashboard`, HEAD `36a075248f1bf26c9c6f6865bcf7a3b1b460463e`; remote is `https://github.com/InnovationCoach/Playground.git`. The earlier dashboard implementation was already uncommitted. It is retained, including the learning hub, learner course reader, landing/deep-link behavior, navigation and prior handover. The working tree combines that earlier work with this continuation; a diff against HEAD includes both. No new branch, checkout, hosted environment, commit, push or deployment was created. No production calls or data writes were made in testing.

Read AGENTS.md, the original dashboard handover, package/testing configuration, relevant frontend models/stores, account API/fixture code, backend account listing, emulator seed guards and Firebase configuration. Backend/rules/scripts were inspected without modification. Local testing used the existing fixture preview with Firebase, auth and course imports substituted. An older temporary checkout was already serving port 5182; it was left running and this checkout was tested on port 5183. This is a local test port, not a new hosted environment.

## Implemented personalization

Up to five named personal pages with independent tool ordering, visibility, compact/wide size and grid/slider layout. Native drag handles plus accessible earlier/later buttons; hidden tools can be restored; pages can be added and removed while one always remains. Essential academic/PBL learning, learning plan, portfolio and discovery links stay above all personal pages and cannot be removed by these controls. Slider tools can be scrolled on touch and keyboard.

Existing accent/cover/tagline/interests remain, with system/rounded/serif fonts, plain/mist/meadow backgrounds, inherited/light/dark themes and calm view. Explicit student themes override the shell palette. Calm view suppresses animation and hides decorative graphics; focus controls remain available. Resizing uses compact/wide presets, not arbitrary pixel dimensions.

Preferences migrate old order/visibility and validate saved values/pages. They reuse the existing learner-scoped local storage key and debounced account preference document. A UID-keyed dashboard remount separates learner state; late cloud reads do not overwrite edits, and adopted remote preferences are cached locally. The existing generated-sound player and timer are reused unchanged; browser checks exercise playback and timer continuity across personal page switches.

## Admin source findings and organization

`src/services/api/mockFixtures.js` creates 182 synthetic records: 129 students, 42 parents and 11 staff. These are browser-memory fixtures, not Firebase Authentication accounts. They remain intact for automated tests. The default account views show four selected existing fixtures across the three tabs: Test Student (`mock-student-012`), Test Coach (`mock-teacher-004`), Test Parent (`mock-parent-141`), Test Administrator (`mock-admin-001`). These are review fixtures, not newly created login credentials.

The account-view selector provides default, confirmed real, test, unclassified and all views. Counts are computed from every page matching the current role/search/status/cohort filters, and explicitly identify their source and scope. Default view preserves real/unclassified records and hides other confirmed test fixtures; all test fixtures remain available. Inventory errors show an error/retry state rather than partial counts.

`apiClient.js` previously fell back to synthetic data on network failure or HTTP 404 even in live mode. It now reports service errors. Explicit dev/emulator mock mode remains available. This is a shared client, so the corrected failure behavior also applies to other API screens: unavailable services now show errors instead of fictional success/data.

`server/routes/admin-users.js` lists Firestore profiles and strips classification fields. It does not enumerate Firebase Authentication. `scripts/seed-emulator.js` and `tests/fixtures/seed-pilot-cohort.emulator.mjs` create Auth and Firestore fixtures only with emulator hosts set and a demo project; neither was executed or changed. No claim is made that these scripts caused any live test accounts. Live Auth/Firestore inventories were not accessed. Confirmed live real/test totals and four designated live test UIDs remain pending backend provenance/reconciliation. Unclassified records remain visible; the UI does not guess they are real.

## XP

The former local XP/level display is removed from My Dashboard; it now states XP is inactive. No rewards, games, companion upgrade or entitlement system is enabled. Existing optional badge widgets remain legacy self-reported milestones and are not XP or unlock evidence. See `docs/dashboard/xp-and-account-contract.md` for the verified-event ledger, permanent optional unlock proposal, safeguards, enablement gates and Gemini backend handoff.

## Changed files in this continuation

Dashboard: `src/features/dashboard/MyDashboard.jsx`, `dashboardModel.js`, `dashboardStore.js`; new `PersonalSpace.jsx`, `workspaceModel.js`, `personalSpace.css`.
Admin/API: `src/features/admin/accounts/AccountList.jsx`; new `accountOrganization.js`, `organizedAccounts.js`; `src/features/admin/ui/usePagedList.js`; `src/services/api/apiClient.js`.
Verification: `tests/dashboard-preview/preview.jsx`, `fixtureFirebase.js`, `check.mjs`; new `personalization-check.mjs`, `tests/dashboard-personalization.test.js`, `tests/account-api-failure.test.js`; `vitest.config.js`.
Docs: this report and `docs/dashboard/xp-and-account-contract.md`.

## Verification

- `npm run test:unit`: 542 tests pass in 30 files.
- Focused new/hub tests: 12 tests pass in 3 files, including migration, page isolation/validation, preservation of 182 fixtures, exactly four review accounts, unknown classification, multi-page inventory, cursor/failure rejection and live API failure without fixture fallback.
- Existing dashboard browser check passes on this checkout: learning columns, navigation/resume links, plan views/toggles, isolated samples, 320/390/768px layouts, themes, mobile menu and loading/empty/error states.
- New browser check passes: persistence, separate students, slider/grid, fonts/background/theme palette, tool reorder/size/removal, sound playback/timer continuity, four review fixtures, all-fixture pagination and scoped counts; external requests blocked and asserted absent, browser errors asserted absent.
- Production build passes with the existing large-bundle warning. `git diff --check` passes.
- Screenshots inspected for desktop personalization and admin organization.

## Try locally

From the checkout above:

```sh
node_modules/.bin/vite --config tests/dashboard-preview/vite.config.js --port 5183
```

Open `http://127.0.0.1:5183/` for the student fixture; `http://127.0.0.1:5183/?admin=1` for admin fixtures. Personalization controls are below the essential learning area. The Personalise button retains accent, cover and interests. Fixture cloud writes stay in browser memory; local preferences persist on that browser/device. Avoid starting the normal app for offline testing because it contains live Firebase configuration.

```sh
SPARK_PREVIEW_URL=http://127.0.0.1:5183 node tests/dashboard-preview/check.mjs
SPARK_PREVIEW_URL=http://127.0.0.1:5183 node tests/dashboard-preview/personalization-check.mjs
npm run test:unit
node_modules/.bin/vitest run tests/account-api-failure.test.js tests/dashboard-personalization.test.js tests/dashboard-hub.test.js
npm run build
```

## Limits and remaining pilot gates

Cross-device Firestore preference saving, sign-in, permissions and real course-provider data have not been exercised; fixture saving is not proof of deployed persistence. Test denied/offline cloud saves and account switching with emulators before pilot deployment. Firebase rules were not changed. Academic integration remains unavailable as in the prior handover. New interface copy is English. Inventory scanning is suitable for this small pilot, with a documented 10,000-record guard; backend pagination/count support is needed for scale and reliable live classification.

The Firebase config still points to `dnd-master-73449` and serves `dist`. No branch-to-hosting mapping exists in that config. The prior report named the existing `pilot-preview` channel; its current release, expiry and branch mapping were not re-verified here. No channel was created or updated. Any deployment requires the exact written go specified in AGENTS.md; production remains untouched.
