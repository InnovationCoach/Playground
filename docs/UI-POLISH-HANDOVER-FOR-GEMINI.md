# UI polish handover for Gemini (2026-10-26)

Status: **code changed locally, NOT committed, NOT deployed.** Nothing has been pushed to
`main` or to the live Hosting site. A deploy needs Mani's written "go" for that exact step
(see AGENTS.md). No backend, rules, indexes or `server/` files were touched.

## What changed (frontend only)

| File | Change |
| --- | --- |
| `src/app/i18n/messages.js` | Course card buttons use short labels: "Add" (was "Add to My Courses") and "Added" (was "Added to My Courses"), with zh and th equivalents. The long "Add to My Courses" string stays for aria-labels and tooltips. Search placeholder shortened to "Search courses and activities" so it is not cut off. |
| `src/features/courses/CatalogCard.jsx` | Visible button text uses `courses.add` / `courses.added`. |
| `src/features/home/homeSearch.css` | `.mc-start-link` gets `min-width: 0` so "Add" and "Start Course" share the row without overflow. |
| `src/features/goals/goals.css` | Adds the missing styles for the "Today's goals" checklist (`.gl-notice-list`, `.gl-check`, `.gl-check-text`). Before this, the checklist rendered with browser bullets and default button borders. |

## Checks run

- `npm run build`: passes.
- `npm run test:unit`: 26 files, 502 tests, all pass.
- Local preview on the emulator (`?emulators=1`, seeded student `mia@school.edu`):
  - Home search "city": the "+ Add" and "Start Course →" buttons fit on one row.
  - Goals checklist: checked by injecting the same markup into the notice. The seeded student has no goal plan, so the real list did not render.

## Not verified

- The live site (dnd-master-73449.web.app) has not been re-checked after these changes, because nothing is deployed.
- The Thai and Chinese labels for "Add" and "Added" were written without a native-speaker review.

## Deployment notes for Gemini

- Do not run a bare `firebase deploy`. A Hosting preview channel is the safe first step, once Mani gives a written "go".
- The live bundle is behind `main`. The frozen-deploy memory records that `src/features`, `src/app` and `src/main.jsx` were untracked in git, so commit those before any build is deployed, or the live build cannot be reproduced.
- These changes only touch the frontend, so they need no rules, index or backend work.

## Open questions

1. Should these changes be committed to a new feature branch (for example `feature/live-ui-polish`) rather than the current `backend/canva-connect`?
2. Does Mani want the "Today's goals" popup to stay on Home? It covers the third search result on a laptop-width screen, but it can be dismissed.
