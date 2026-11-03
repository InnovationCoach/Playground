# UX/UI Sprint 1 report: quick wins

Branch `feature/ux-sprint1` (based on `588cbc2`), 4 October 2026. Plan: `UX-UI-ENHANCEMENT-PLAN.md`. Not merged and not deployed.

## Delivered

| Plan item | Result | Commit |
|---|---|---|
| Code splitting | Every role screen, the four React activities and the legacy goal-setting/SEN widgets load on demand. Initial download **1.28 MB → 289 KB (354 KB → 87 KB gzip)**; the >500 kB chunk warning is gone. Largest lazy chunk: SO₂ activity, 145 KB. | `1cb2bbe` |
| Coach headline contrast | Root cause: legacy `header h1 { color: #fff }` rules applied to every new screen that used `<header>`. Now scoped to the five legacy activity containers. Coach headline measured `rgb(15, 44, 76)` on a light background. | `c0a9666` |
| Label renames | Staff and admin see **Learner support** instead of "Studio Home"; parents keep Family overview / PBL Progress (one `areaLabel()` helper). "Theme awaiting confirmation" placeholders removed from the coach context bar and PBL Studio. | `c0a9666` |
| Empty states | Support tiles say "Not tracked yet" and where to look instead of "Unavailable"; coach zero counters explain what will appear. | `c0a9666` |
| Emoji icons | Replaced with Lucide icons on new screens (join class, notes, messages, audit view). Delete and remove buttons now have accessible names. | `c0a9666` |
| Teen Quest pilot switch | `PATCH /api/schools/:schoolId/features` (admin only, audited as `FEATURE_QUEST_ON/OFF`) and a **School features** card in admin Settings (EN/ZH/TH; ZH/TH await native review). Verified: admin ticks WPR → Akira's home becomes Quest Home. | `c375a38`, `b4fe220`* |
| Admin lists on live data | No code change needed: production builds always use the live API. The "Test data" banner appears only in local emulator runs (`resolveMode()` in `apiClient.js`). | — |

\* The final commit passes `role` into the admin console's embedded Settings page.

## Verification

- Unit/UI 371 passed · API 90 passed (one new feature-switch test) · combined emulator suite 474 passed · production build OK.
- Browser checks against the worktree's own API and web server (coach, admin, student): headline colour, tab names, empty-state hints, Settings toggle and "Saved." message, Quest Home after the toggle, Lucide icon in the join heading, no page errors.

## For deployment (Gemini)

- Deploy the `api` function and Hosting together; no Firestore rules or index changes in this sprint.
- After deployment, the pilot is switched on by the school admin in **Settings › School features** (no console edits needed).

## Merge note

`main` currently has uncommitted changes from another agent in `server/app.js`, `apiClient.js`, `useSchoolWorkspace.js`, `StudentDashboard.jsx` and personalisation files. Sprint 1 also touches `StudentDashboard.jsx` (notes heading icon). Expect a small, easy conflict there when merging. Two issues in that uncommitted work should be fixed before it ships:

1. `server/app.js` CORS: both branches of the origin check call `callback(null, true)`, so every origin is allowed. Unknown origins should get `callback(null, false)`.
2. `apiClient.js`: the `if (!user)` guard was removed, so a signed-out request throws a TypeError instead of a clean `UNAUTHENTICATED` error.
