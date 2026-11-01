# Deploy prompt for Gemini: today's frontend work (2026-10-23)

> **This document is not authorisation.** Under AGENTS.md, every deploy step needs
> Mani's written "go" in the chat for that exact step. Stop at each **GATE** below
> and wait. Never run a bare `firebase deploy`. Do not deploy Firestore rules,
> Storage rules, indexes or functions as part of this release.

## What ships

Build **only** from commit `11d9981` on local branch `feature/parent-dashboard`.
It contains everything below, in order:

| Commit | What |
|---|---|
| `cc5cf57`, `0ca7924`, `710abd5` | Portfolio media (Canva/Cloudinary embeds, Showcase) and its docs (earlier, not yet on main) |
| `bacc163` | PBL program poster covers and coach media (earlier, not yet on main) |
| `26f77f0` | Left sidebar menu (earlier, not yet on main) |
| `369bc7b` | Goals: Goal Quest builder, readable banner, XP/level/streak, rewards |
| `beefc86` | PBL programs: sessions as missions, Entrepreneurship toolkit and badges; program banner fix |
| `2f4cf2f` | My Dashboard: Focus sounds widget and mini player |
| `7283c35` | Focus sounds: pause, end and stop really silence the audio |
| `a7768d6` | My Dashboard: Launchpad (section tiles, sliding stage, typed and voice commands) |
| `f19261a` | Sidebar: auto-hiding rail, gliding highlight, live badges |
| `abb09b3` | Coach Learners page (**in the code but not routed**; invisible to users) |
| `11d9981` | Parent child view: badges, time on platform, active days (en/zh/th) |

**No backend or rules changes are needed.** Mission progress (steps, confidence,
tool data) goes into `users/{uid}/activityProgress/pbl-program-*`, which the rules
let the owner write with no field restrictions. The goal plan is already on
`users/{uid}`. Focus sounds, the Launchpad layout and the sidebar mode use
localStorage only. Check that the **live** rules behave the same for these two paths
before Gate B (the repo's `firestore.rules` is known to have drifted from live).

## What must NOT ship

- **Your own uncommitted work in the shared folder** (`src/features/coach/studio/`,
  `evaluation/`, `supervision/`, `programs/`, the Edmentum LTI changes in `App.jsx`,
  `routes.js`, `Sidebar.jsx`, plus `firebase.js`, `firestore.rules`, `server/app.js`,
  `tests/firestore-rules.test.js`, `tests/coach-pbl-studio.test.js`, `tests/edmentum-lti.test.js`,
  `vitest.config.js`). Commit it to your own branch first. Do not mix it into this release.
- `AGENTS.md` and `.claude/launch.json` (local edits, not part of the app).

### Read this before Gate A: live will lose things

The current live bundle (`assets/index-CgNS5So3.js`) was built from an **uncommitted
working tree**. It already contains your coach studio ("AI PBL Authoring & Mentorship
Studio", "Learner Supervision") and the parent changes. Deploying `11d9981` will
**remove the coach studio and Edmentum from live**, because they are not in this commit.
Tell Mani this explicitly and get his decision:

1. ship `11d9981` as is (coach studio leaves live until it is reviewed), or
2. first commit your work on its own branch, have it reviewed, merge it with this one,
   and come back with a new combined commit and a new written go.

Note for that review: `LearnerSupervisionView` shows **hard-coded sample learners**
("Hardcoded cohort metrics", `pendingEvals = 2 // Liam & Maya`). Real coaches must not
see invented learners. The real-data loader is in `src/features/coach/learners/`.

## Step 0: record what is live now (read-only)

Note the current live release in the Firebase console (Hosting → release history) so it
can be rolled back. Record the live asset names from `https://dnd-master-73449.web.app/`.

## Step 1: clean build from the commit (no deploy)

```bash
git worktree add ../spark-release 11d9981
```

```bash
cd ../spark-release && npm ci
```

```bash
npm run test:unit
```

```bash
npm test
```

```bash
npm run build
```

Expected (checked on `11d9981`): `test:unit` reports 24 files / 481 tests passing, and the build succeeds.
`npm test` starts its own Firestore emulator on port 8088, so stop any running review
emulator first. Report all results to Mani with the exact numbers.

Check what API mode the production build uses. Pages that call `/api` (admin console,
parent portal) need a deployed backend and a Hosting rewrite. If there is none, say which
screens will fail, rather than shipping them silently.

## GATE A: wait for Mani's written "go" for the preview channel

Then, from `../spark-release` only:

```bash
firebase hosting:channel:deploy release-2026-10-23 --expires 7d --project dnd-master-73449
```

This deploys **Hosting only**, to a temporary preview URL. Report the URL.

### Checks on the preview

The preview uses the **production** Firebase project. Do not create accounts, seed data
or sign in with test accounts. Check signed-out pages yourself. Signed-in checks are for
Mani with his own account.

- **Signed out:** the sign-in page loads, no console errors, and the bundle names differ from live.
- **Student:**
  - `#/spark` home.
  - `#/dashboard`: Launchpad tiles slide between sections; Ctrl/⌘ K opens "Where to?"; the
    mic shows its consent note before listening; Focus sounds start, and then Pause, End
    and Stop all go silent.
  - `#/goals`: the banner is readable, the quest map works, "Start a new goal" runs the
    5-question builder.
  - PBL Studio → Programs → Entrepreneurship: the banner text is not under the poster;
    Term plan missions tick; the Toolkit tab tools work.
  - Sidebar: on desktop it rests as an icon rail and opens on hover; `[` pins it.
- **Parent:** the child view shows badges, time on platform and active days.
- **Coach:** `#/coach/dashboard` (legacy) still loads. The Learners page is not reachable,
  which is expected.

## GATE B: wait for Mani's written "go" to promote the preview to live

```bash
firebase hosting:clone dnd-master-73449:release-2026-10-23 dnd-master-73449:live
```

Only this command. No `firebase deploy`, no rules, no storage, no functions.

## After release

- Confirm live serves the new asset names and the signed-out page has no console errors.
- **Roll back** if anything breaks: use the Hosting release history to restore the release
  recorded in Step 0, after telling Mani.
- Remove the worktree with `git worktree remove ../spark-release`.

## Report back to Mani

- the commit deployed;
- test and build results;
- the preview URL and what was checked, and by whom;
- the time it went live;
- anything that did not work;
- his decision on the coach studio question.

## Out of scope (separate approvals)

- Merging to `main`: needs a pull request that Mani approves.
- Wiring the coach Learners page: needs a route, a sidebar link, and a fix in
  `App.jsx`'s `navigate('coach')` so it keeps `#/coach/<sub>` addresses. Do this after
  your App.jsx changes are committed.
- Any Firestore rules deploy.
