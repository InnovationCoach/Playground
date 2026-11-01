# Student dashboard implementation handover

## Baseline and preservation

Built from GitHub `release/pilot-candidate` at `36a075248f1bf26c9c6f6865bcf7a3b1b460463e` on the local branch `codex/student-dashboard`. The newer inventory descendant was reviewed separately and not imported into this dashboard change. Old local HearIsland code and unfinished work were not copied into this implementation or overwritten. No commit, push, deployment or live data write was performed.

## Result

Students with an empty/unrecognised entry URL land on My Dashboard. Explicit deep links are preserved. The logo returns secondary students to their dashboard. Student navigation starts with My Dashboard; Home is lower. Primary Junior Explorers and staff/parent landing behaviour stay as before.

The responsive dashboard shows academic learning on the left, current enrolled/assigned PBL programs and activity links on the right. A single learning plan has Today, Ahead and Completed views. Portfolio and discovery links are visible. Notes, reflection, focus sounds, skills, badges and readiness remain in expandable optional tools. Appearance preferences remain available.

`dashboardCourses.js` reads existing learner-filtered enrolments, assigned classes, program documents and account-scoped program progress. It displays read failures and offers retry. It never enrols a student, writes course progress or calls an external provider.

Academic progress is intentionally unavailable until a real provider data source is connected. Optional example lessons run entirely in component state and are labelled as samples. The existing wider My Courses/Edmentum implementation was not changed in this scope.

## Try the isolated offline preview

From this clean checkout:

```
node_modules/.bin/vite --config tests/dashboard-preview/vite.config.js
```

Open http://127.0.0.1:5182/. This preview uses synthetic people and progress and replaces Firebase, notes and course readers with fixtures. It makes no external requests. `?state=empty`, `?state=error` and `?state=loading` exercise course states. The preview demonstrates dashboard links but does not mount destination course screens.

```
npm run build
node_modules/.bin/vitest run tests/dashboard-hub.test.js tests/my-dashboard.test.js tests/spark-home.test.js tests/pbl-programs.test.js tests/goal-plan.test.js
node tests/dashboard-preview/check.mjs
```

The browser check expects Chrome at the standard macOS installation path and the preview server already running.

## Validation and limits

The production build passes. The focused suite passes 102 checks. Offline browser checks cover desktop column order, menu order, resume URLs, goal-plan views and toggles, sample isolation, 320/390/768px layouts without horizontal overflow, light/dark themes, mobile menu and loading/empty/error states. Browser errors and external requests are asserted absent. Desktop/mobile/dark screenshots were visually inspected.

Live Firebase sign-in, deployed APIs, rules and cross-device saves were not exercised. This pass reuses the existing goal/project saving hooks; their delayed cloud saves and offline behaviour need separate end-to-end verification before the pilot. New dashboard copy is English, matching the existing dashboard; translation work remains. The build retains a pre-existing large-bundle warning.

## Existing Firebase test domains confirmed read-only on October 30

- Newest preview: https://dnd-master-73449--preview-release-krhg4rn2.web.app — released October 29, expires November 5 at 15:26 Bangkok time.
- Pilot preview: https://dnd-master-73449--pilot-preview-sb6y5j31.web.app — released October 27, expires November 3 at 09:32 Bangkok time.
- Live: https://dnd-master-73449.web.app.

Firebase release metadata labels these CLI deployments and does not identify a Git commit or branch. No repository GitHub Actions workflow was present in the selected baseline. The exact branch-to-domain mapping is therefore unverified. These existing hosted URLs do not contain this new local dashboard.
