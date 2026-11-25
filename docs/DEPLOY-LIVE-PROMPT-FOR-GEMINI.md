# Deploy to live: brief for Gemini (backend + deploys)

Prepared by Claude (frontend) on 2026-11-25 for the WeLearn SPARK release on
`feature/universe-2e-ux-phase1`.

> **AUTHORISATION.** This brief is NOT authorisation. Under AGENTS.md every step marked
> **⛔ GO** needs Mani's written "go" *for that exact step* in chat before you run it.
> Never run a bare `firebase deploy`. Never write to production data, seed, migrate or
> run scripts against production. Never print or commit secrets. Stop at the first failure
> and report.

---

## 1. What is being released

- Repo: `/Users/admin/Desktop/HearIsland`. Remote: `https://github.com/InnovationCoach/Playground.git`
- Branch: `feature/universe-2e-ux-phase1` (pushed). Base: `main` at `4cb1854`.
- Firebase project: `dnd-master-73449`. Live site: `https://dnd-master-73449.web.app`
- The PR to `main` is **not open yet**: the GitHub CLI on this Mac was not signed in.
  Mani opens it, or you open it if your `gh` is signed in. Only Mani approves the merge.

Commits on the branch that are not on `main`, oldest first (`git log --oneline origin/main..HEAD`):

| Commit | What it does | Touches backend? |
|---|---|---|
| `673c33f` `093a346` `75955d1` `940a4dc` `0f9620c` `5c2aaa3` | Program Maker editor, 3D Tinker, landing, journey competency links (already live from the working folder; now committed) | `5c2aaa3` tinker bpy worker |
| `7524bb4` | Goal Coach, Academic Planner, goals redesign | — |
| `01eb889` | Program Trash (7-day) | purge job is yours (not built) |
| `dcfd878` | My Universe Learner Playground, Spaceship Lab, AI crew, telemetry | `server/routes/universePlayground.js`, `universeManagement.js`, `server/lib/universe/*` |
| `277a205` | Edmentum API client, `/api/edmentum`, LTI/OneRoster | yes |
| `9d7648a` | Learner records (portfolios/transcripts) | `pilot-operations.js`, **firestore.rules, storage.rules** |
| `7ed2fc2` | WPR primary cohort | `reference.js`, `admin-users.js` |
| `4abe7c3` | Coach boards, community post starters | — |
| `eccc476` | Profile editor + avatars (`saveUserProfile` writes owner fields on `users/{uid}`) | relies on existing rules |
| `0cb7ba5` | Dashboard AI assistant, tutor intent + safeguarding, **model → `gemini-3.5-flash-lite`** | `server/app.js`, `safety.js`, `functions/index.js` |
| `c1c62f4` | Mastery evidence auto-approve after send | `mastery.js`, `masteryClient.js` |
| `5f07cc9` | Landing images, `#/tinker` route, fixtures | — |
| `e22787e` | Merge of `main` (goals: categories + main's tracks/Teen Quest UI) | — |
| `86d6f83` | Universe: playground saves now send `contractVersion`; Load Blueprint feedback; local blueprints kept on remote load | — |
| *(next commit)* `fix(universe): pay each goal's credits once` | Claim Goal Credit pays once per goal | — |

Verify the branch head includes the last commit before you start.

Deliberately **not** in git (do not add, do not deploy): `scratch/`, `.worktrees/`,
`services/tinker-bpy/app/__pycache__/`, `scripts/seed-ava-emulator.js` (contains a real child's name).

---

## 2. Backend work for you BEFORE any deploy (code changes in your area)

These are contracts from the frontend. Do them on a branch off `feature/universe-2e-ux-phase1`,
with tests, then report.

### B1. Keep Spaceship blueprints on the server (required)
`server/routes/universePlayground.js` → `sanitizePlaygroundState` drops `savedShips`.
Now that saves reach the server (`86d6f83`), every reload would lose blueprints without
the client-side merge. Add:
- `savedShips`: array, max 20, each `{ id (safe id ≤ 80), version (int ≥ 1), name (≤ 80),
  purpose (≤ 120), passengers (int 1–12), parts { hull, propulsion, power, shield } (known part ids),
  simulation (object; keep `passed`, `metrics`, `diagnostics` ≤ 6 strings), reflection (≤ 500),
  savedAt (ISO) }`. Drop invalid entries instead of rejecting the whole state.
- Check the 64 KiB request limit with a worst case (20 ships + 15 planet records). If it can
  exceed, store blueprints in `orgs/{orgId}/universePlayground/{uid}/ships/{shipId}` instead
  and tell Claude so the client can change.

### B2. Credits should not be client-trusted (recommended before real learners)
`PUT /playground/state` accepts any `credits` value up to 1,000,000. The UI now pays each goal
once (`isGoalClaimed`), but a crafted request can still set credits. Minimum: on PUT, reject
a state whose `completedGoals` has a duplicate `goalId`, and cap `credits` at
`existing.credits + sum of newly added goal rewards + 50 × newly synced SPARK goals + 10 × aid sent`.
Better: move claim/aid/sync to server endpoints. Tell Claude which you choose.

### B3. Fix the 6 failing tests (required)
`tests/universe-auth-provider.test.jsx`: its `vi.mock('../src/auth.js')` lacks
`isMicrosoftOnlyUser` (added in `eccc476`). Add it to the mock (returning `false`) and
re-run `npx vitest run --config tests/universe-preview/vitest.config.js`. Expect 190/190.
(Claude can do this instead if you prefer; say so.)

### B4. Functions environment (required)
Names only, never print values. The `api` function needs:
`GEMINI_API_KEY` or `SCHOOL_GEMINI_API_KEY`, `EDMENTUM_*` (see `.env.example`),
`MASTERY_API_KEY`. Confirm the model id `gemini-3.5-flash-lite` works with the key (one
test call from the emulator server, not production). Report which are set and which are missing.

---

## 3. Pre-flight (read-only, no go needed)

1. `git fetch`; check `HEAD..origin/main` is 0. If main moved, stop and report.
2. Clean working tree apart from the excluded files above.
3. `npx vitest run` → expect **120 files / 1630 tests** pass.
4. `npx vitest run --config tests/universe-preview/vitest.config.js` → expect **190/190** after B3.
5. `npm run build` passes.
6. **Live basis check.** Live has been built from the uncommitted working folder. You already
   downloaded the live bundle. Confirm every feature in it exists at the branch head:
   Tinker Studio, goals redesign, avatar editor, Edmentum cards, cohorts, Program Trash.
   List anything live has that HEAD lacks. A deploy must not remove live features.
7. **Rules diff.** `firestore.rules` and `storage.rules` vs what is deployed (Firebase console
   or `firebase firestore:rules` history). The only intended additions are the two
   `learnerRecords` deny-all blocks. Report any other difference.
8. **Security.** `scratch/check_production_users_and_schools.js`, `clean_live_firestore_users.js`,
   `inspect_production_rest.js`, `verify_student_redesign_live.js`,
   `verify_phase1_live_production.js` are in git history with an `AIza…` key, a password and
   refresh-token handling. Tell Mani which are real and need rotating, together with the
   Gemini key already flagged for rotation. Do not paste the values.

Report all of section 2 and 3 to Mani, then wait.

---

## 4. Deploy steps

**STEP 1 ⛔ GO: PR and merge.** PR `feature/universe-2e-ux-phase1` → `main` (plus your B1/B2
branch if separate). Mani approves and merges. Deploy only from a clean checkout of `main`
at the merged commit (`git worktree add ../spark-release origin/main`).

**STEP 2 ⛔ GO: Firestore rules.** Run `tests/firestore-rules.test.js` on the emulator first.
`firebase deploy --only firestore:rules --project dnd-master-73449`

**STEP 3 ⛔ GO: Storage rules.** Run storage-rules tests with project `demo-hearisland-rules`.
`firebase deploy --only storage --project dnd-master-73449`

**STEP 4 ⛔ GO: Functions (`api` only).**
`firebase deploy --only functions:api --project dnd-master-73449`
Smoke test with a test account, GET only, no production writes:
- `GET /api/universe/playground` → 200 with `state`
- `GET /api/edmentum/...` status endpoint → 200 or a clear "not configured"
- tutor with a harmless prompt → reply, model `gemini-3.5-flash-lite`

**STEP 5 ⛔ GO: Hosting preview channel.**
`npm run build && firebase hosting:channel:deploy release-20261125 --expires 7d --project dnd-master-73449`
Check on the preview URL with a test learner, coach and admin account:
- **My Universe:** My Dashboard → Go to → My Universe → Enter My Universe. Playground opens;
  Goals: each "Claim Goal Credit" pays once and turns "Claimed ✓"; Life & Build: scan,
  cultivate, build; AI Crew: quick-ask answers with **"Live AI"** label; Universe: simulate
  week, send aid.
- **Saves reach the server:** network tab shows `PUT /api/universe/playground/state` → **200**
  (was 400 before `86d6f83`).
- **Spaceship Builder:** opens centred full-size; meters + Flight-Certified badge; save a
  blueprint, change parts, Load Blueprint restores it and scrolls to it; **reload the page,
  blueprint still listed** (needs B1).
- Text view: hazard / features badges.
- Goals page: Goal Coach, Academic Planner, Quest Energy bar, waypoints tick steps.
- Edmentum cards, coach "Portfolios & transcripts" tab, admin `#/admin/records`, profile editor,
  WPR cohort picker, dashboard AI assistant.
Send Mani the preview URL and results.

**STEP 6 ⛔ GO: Promote to live.** Record the current live version id first (for rollback).
`firebase hosting:clone dnd-master-73449:release-20261125 dnd-master-73449:live`
Re-run the STEP 5 checks on the live URL.

---

## 5. Rollback

- Hosting: clone the recorded previous version back to live (or roll back in the console).
- Functions: redeploy `api` from the previous `main` commit (`4cb1854`).
- Rules: redeploy the previous `firestore.rules` / `storage.rules` from git.

## 6. Report back after every step

Command run · result summary · what you checked · anything unexpected · what you need from Mani.
