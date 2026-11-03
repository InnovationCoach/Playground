# Prompt for GPT: fix and deploy My Universe + 3 Nov work to live

You are GPT, the integrator for WeLearn SPARK (repository https://github.com/InnovationCoach/Playground, Firebase project `dnd-master-73449`). You own this release from start to finish: you finish the merge, fix whatever blocks it, verify it, and deploy it to live at **https://dnd-master-73449.web.app/#/dashboard**. Gemini (server/, rules, indexes, scripts/) and Opus (UI) can review if you ask, but you are responsible for getting it done.

Read `AGENTS.md` first and follow it. Mani (Platform Lead) authorises every production step in writing **in your chat**. This prompt is the plan, not the authorisation. Before each step marked **[GO]**, stop, say exactly what you will run, and wait for Mani's "go".

## Where things are

- Work only in `/Users/admin/Desktop/HearIsland/output/my-universe/live-merge`, branch `codex/live-merge-main-20261103`. It holds GitHub `main` (`2bfcc68`) with the 3 Nov snapshot merged in (`ef23081`, `24a6996`). Read `docs/implementation/LIVE-MERGE-2026-11-03.md` before anything else: it has every conflict decision, the test results and the open items.
- My Universe planet-arrival work: branch `codex/universe-planet-arrival` (`dc0c975`), checked out at `output/my-universe/pilot-arrival` (remote `arrival` in the live-merge checkout).
- Do **not** edit, build or deploy from the root checkout `/Users/admin/Desktop/HearIsland`. It is the old design line, and deploying from it removed SPARK branding, My Competencies and My Universe from live on 3 Nov.
- Live now: the reviewed 2 Nov release `index-DvME41HX.js`. Rollback channels: `explorer-panel-20261102` (current live) and `pre-arrival-20261103` (the 11:56 build; do not restore it).

## Goal

Live shows, at `#/dashboard` and across the app:

- WeLearn SPARK branding.
- My Dashboard, with My Competencies in the sidebar.
- The full My Universe, including planet arrival.
- The 3 Nov work: dashboard and feature image uploads, Pilot operations, Course discovery, learner pathway, school programs and lessons, media, My space and portfolio.
- The backend (`api` function, nodejs22) and Firestore and Storage rules that these features need.

Nothing that is live today may regress.

## Steps

### 1. Merge My Universe arrival

Make a new branch from `codex/live-merge-main-20261103`, for example `codex/release-20261103`, and merge `arrival/main` (`dc0c975`) into it. Keep main's design and the SPARK shell. Resolve each conflict deliberately, and add a "Arrival merge" table to the merge report listing every decision.

### 2. Fix the open items

These are listed in the merge report. Fix each one, add or adjust tests, and record the result:

- `programMedia` storage rule lets a coach of an overlapping class upload. Restrict it to the creator, an assigned coach, or an admin, and make `tests/storage/learning-media.test.js` pass.
- `schools/{schoolId}/submissions/{id}/evidence/{file}` lets any signed-in user read and delete across schools. Scope it to the submitting learner, their assigned coaches and admins.
- `GET /api/learner-space` returns 200 to staff where the test expects 403. Make private customization learner-only, and make `tests/api/personalization.test.js` pass.
- `functions/package.json`: make sure every package the server routes import is listed, so the bundled `functions/` build deploys and starts.
- Review the `admin-users.js` cohort/age-band merge, and the client switch to `POST /api/coach/students` for student provisioning (setup links). That switch is an auth change: put it to Mani explicitly.
- Anything else you find. Fix it, don't paper over it.

### 3. Verify locally (emulators, demo projects only)

All of these must pass, and you report the counts:

- `npm ci`, then `npm run build`.
- `npm run test:universe`.
- Root vitest.
- `npm test`, `npm run test:storage` and `npm run test:api`, all through the emulators.
- `npm --prefix functions run build`, which must succeed.

Then do a browser check at `http://localhost:<port>/?emulators=1` with `npm run seed:emulator`:

- As a learner: sign in, see SPARK branding, land on My Dashboard, see My Competencies in the sidebar, open My Universe including planet arrival, upload a banner in My space, and open Course discovery.
- As an admin: Pilot operations.
- As a coach: the coach dashboard, with My Universe submissions.

Check desktop and phone width. Never use live data or live credentials.

### 4. Push and open a PR

Push the release branch to GitHub and open a PR into `main`. The PR description lists:

- changed files;
- test results;
- the arrival conflict decisions;
- the fixes;
- the auth, permission and rules changes;
- the rollback plan.

Mani approves the PR merge.

### 5. [GO] Save live

Clone current live into a fresh rollback channel:

```bash
firebase hosting:clone dnd-master-73449:live dnd-master-73449:pre-release-20261103 --project dnd-master-73449
```

Confirm the channel serves `index-DvME41HX.js`.

### 6. [GO] Hosting preview channel

Build from the release branch, then deploy hosting only:

```bash
firebase hosting:channel:deploy release-20261103 --expires 7d --project dnd-master-73449
```

The preview still calls the currently deployed `api` function, so new backend features only work fully after step 7. Check branding, My Dashboard, My Competencies and My Universe, and send Mani the URL and screenshots.

### 7. [GO, separately for each] Backend and rules

Never run a bare `firebase deploy`. Mani approves each of these on its own:

```bash
firebase deploy --only functions --project dnd-master-73449
```

```bash
firebase deploy --only firestore:rules,firestore:indexes --project dnd-master-73449
```

```bash
firebase deploy --only storage --project dnd-master-73449
```

Before each one:

- Confirm `SCHOOL_GEMINI_API_KEY` and the other Secret Manager bindings exist. Never print secrets.
- Note the current rules version, so you can restore it.

After each one, re-check the preview channel end to end with a test account Mani provides. Never create accounts, seed or migrate production data yourself.

### 8. [GO] Promote to live

Clone the approved preview to live:

```bash
firebase hosting:clone dnd-master-73449:release-20261103 dnd-master-73449:live --project dnd-master-73449
```

Then open https://dnd-master-73449.web.app/#/dashboard (hard refresh) and verify:

- the new `index-*.js` is served;
- SPARK branding;
- My Dashboard, My Competencies and My Universe;
- a banner upload in My space;
- Pilot operations as an admin;
- no console errors.

### 9. Rollback, if anything regresses

Restore hosting:

```bash
firebase hosting:clone dnd-master-73449:pre-release-20261103 dnd-master-73449:live --project dnd-master-73449
```

Restore the previous rules versions and the previous functions build. Tell Mani immediately.

## Report back

Write a short report to Mani covering:

- what is live: commit, bundle hash, channel names;
- test results;
- each fix;
- each deploy step with its time;
- what was not done, and any follow-ups.

Save it as `docs/implementation/RELEASE-REPORT-2026-11-03.md` and include it in the PR.
