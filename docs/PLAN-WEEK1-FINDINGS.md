# Plan week 1 findings (2026-10-26)

Companion to `docs/PLAN-TO-END-NOVEMBER.md`. Findings only; no deletions and no deploys.

## Legacy navy header bar (workstream D, UI)
`index.html` styles every bare `<header>` as the navy app bar. Pages that use a `<header>` with no background of their own inherit it.

- **Fixed in a branch:** `fix/legacy-header-bar` (`9b85eac`) resets it for `.sp-head`, the child profile heading on the parent dashboard (`StudentProfileCard`).
- **Fixed in a branch:** `feature/canva-polish` (`d63be6f`) resets it for `.canva-header`. Not yet in the release branch.
- **Already overridden (checked):** `a6-bar`, `so2-hero`, `gf-hero`, `cp-header`, `ed-header`, `gl-hero`, `ms-thread-head`, `pb-sc-hero`, `gh-topbar`.

## Unimported source files (decision D4)
Checked by filename against import statements. Twelve files are not imported anywhere, 2,767 lines in total.

| Lines | File | Note |
|---|---|---|
| 532 | `src/services/api/mockBackend.js` | Mock API. Confirm nothing loads it by string. |
| 366 | `src/utils/scoringEngine.ts` | |
| 342 | `src/utils/firestore-migration.js` | One-off migration helper. |
| 322 | `src/services/geminiService.ts` | Old client-side Gemini path. Replaced by `server/`. |
| 320 | `src/features/coach/learners/LearnersPage.jsx` | **Do not delete.** The new Learners page waits for Gemini's endpoints (workstream C). |
| 255 | `src/features/goals/GoalQuest.jsx` | |
| 209 | `src/bunker-simulator.js` | |
| 138 | `src/utils/seedCoachTestData.js` | |
| 91 | `src/activities.js` | |
| 89 | `src/utils/i18n.js` | |
| 79 | `src/simulator.js` | |
| 24 | `src/features/shell/BrandMark.jsx` | |

Note: the project notes said about 4,700 lines. This check counts 2,767, so the older figure may include files that are imported and used. The count method is filename-based, so treat it as a first pass.

Another agent already has branch `refactor/clean-legacy-components` (`1ca96d4`) removing unimported legacy components in Dashboard, SolarCar and Auth. Coordinate with it before deleting anything else from the list above.

## Plant Lab on the coach dashboard (workstream D)
The Plant Lab lab book is stored only in `localStorage` (`src/features/activities/plantLab/useLabBook.js`). The coach dashboard can't see it. To show it, the work needs:
1. A server endpoint and a Firestore collection for the lab book, with rules (Gemini).
2. A sync from the local book to that collection, so nothing is lost on refresh (frontend).
3. A coach panel that reads it (frontend, after 1 and 2).

Decision needed: is the lab book visible to coaches only, or to the learner's parent as well?
