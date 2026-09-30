# Task prompt: deploy Activity 6 ONLY, to its own site

You are deploying one approved release for WeLearn Growth Hub, Firebase project
`dnd-master-73449`. The repository is `/Users/admin/Desktop/HearIsland`.

**Scope, approved by the Platform Lead on 2026-09-30:** Activity 6 (SO₂ → Sulfate,
v1.1 Gold Nanoparticle Filter lab) goes live at a separate address,
`https://welearn-activity6.web.app`, so a student can use it. **Nothing else ships.**
The production freeze on the rest of the platform stays in force.

Read this whole document before running anything. If any check fails, **stop and
report**. Do not improvise a fix, and do not widen the scope.

---

## 1. Hard rules (breaking any of these is a failed task)

1. **Never run a bare `firebase deploy`**, and never deploy without `--config`. The
   default `firebase.json` deploys the whole unfinished working tree to the main site.
2. **The main site `dnd-master-73449` (https://dnd-master-73449.web.app) must not
   change.** Never pass `--only hosting` together with `firebase.json`, and never target
   site `dnd-master-73449`.
3. **Never deploy the working-tree `firestore.rules`.** It is the hardened ruleset, and
   deploying it before the claims migration locks every coach out. Deploy only
   `deploy/firestore.production+activity6.rules`, through `firebase.rules-activity6.json`.
4. **Deploy nothing else:** no `firestore:indexes`, `functions`, `storage`, `database`,
   `auth` or `extensions`.
5. **No data changes:** no migration scripts, no `seed*`, no `grant-coach.js`, no
   `class-codes.js`, and no Admin SDK writes.
6. **Do not edit any file** except to fix a failed build, and only after reporting it.
   Do not commit, push, or change branches.
7. Do not create accounts, and do not sign in with anyone's real password.

---

## 2. What is being released

| Piece | File(s) | Goes to |
|---|---|---|
| Standalone page | `activity6.html`, `src/activity6/`, `src/features/activities/so2Sulfate/**` | built into `dist-activity6/` |
| Build config | `vite.activity6.config.js` (reads no `.env`; outputs only Activity 6) | — |
| Hosting config | `firebase.activity6.json` → `"site": "welearn-activity6"` | new site only |
| Rules | `deploy/firestore.production+activity6.rules`, via `firebase.rules-activity6.json` | Firestore rules |
| Rollback copy | `deploy/firestore.production.rules` (the live ruleset before this release) | — |

The rules file is the **currently live ruleset** (`d38303cc-fdde-460a-950f-1dc5da259a5b`,
released 2026-09-25) with only two marked additions (`// >>> ACTIVITY 6 v1.1` …
`// <<< ACTIVITY 6 v1.1`):

- the `simulationResults` create rule gains a second shape for filter runs (read rule unchanged);
- new collections `budgets`, `transactions`, `simulationRuns`, `simulationParameters`,
  `savedSimulations`, `reports`, which enforce the virtual credit economy.

Every other rule is byte-for-byte the live ruleset, so no existing access changes.

Already done: site `welearn-activity6` has been created (it currently shows "Site Not
Found"). The code is committed at `be1625d` on branch `backend/phase-0`.

---

## 3. Pre-flight checks. All must pass before any deploy

Run from `/Users/admin/Desktop/HearIsland`.

**3.1 Right code:**
```bash
git log --oneline -3
```
`be1625d` must be in the list. Then:
```bash
git status --porcelain -- activity6.html src/activity6 src/features/activities/so2Sulfate vite.activity6.config.js firebase.activity6.json firebase.rules-activity6.json deploy
```
It must print nothing (no uncommitted changes to the release files).

**3.2 Logged in and the site exists:**
```bash
npx firebase login:list
```
```bash
npx firebase hosting:sites:list --project dnd-master-73449
```
`welearn-activity6` must be listed.

**3.3 Record the main site's current state** (you will compare it after the deploy):
```bash
curl -s https://dnd-master-73449.web.app/ | grep -o 'assets/index-[^"]*\.js'
```
Write the value down. On 2026-09-30 it was `assets/index-DWzvbCSg.js`.

**3.4 Tests.** Start the emulator in a second terminal if one is not already running on
port 8088 (`npm run emulators`), then:
```bash
RULES_FILE="deploy/firestore.production+activity6.rules" npx vitest run tests/sim-economy.test.js
```
It must report **29 passed**. Then:
```bash
npx vitest run tests/so2-filter.test.js
```
All must pass.

**3.5 Build and inspect.** The build must contain Activity 6 and nothing else:
```bash
npx vite build --config vite.activity6.config.js
```
```bash
ls dist-activity6 dist-activity6/assets
```
Expect exactly `activity6.html` plus one `.js` and one `.css` in `assets/`. The JS
should be about 293 kB. If it is around 430 kB or larger, React's development build got in: stop.
```bash
grep -l -E "gh-app|PBL Studio|Junior Explorers|parentInvites|GoogleGenerativeAI" dist-activity6/assets/*.js || echo "OK: no other features"
```
It must print `OK: no other features`.

**3.6 The live rules are still the merge base.** If production rules changed since
2026-09-25, the merged file is stale and deploying it would undo someone's change.
Save this as `/tmp/check-rules.cjs`:
```js
const FT = require('child_process').execSync('npm root -g').toString().trim() + '/firebase-tools/lib';
const { requireAuth } = require(FT + '/requireAuth');
const { getGlobalDefaultAccount } = require(FT + '/auth');
const rules = require(FT + '/gcp/rules');
const fs = require('fs');
const norm = (s) => s.replace(/\s+$/, '');
(async () => {
  const acc = getGlobalDefaultAccount();
  await requireAuth({ project: 'dnd-master-73449', user: acc.user, tokens: acc.tokens });
  const rel = await rules.listReleases('dnd-master-73449');
  const r = (rel.releases || rel).find((x) => x.name.endsWith('cloud.firestore'));
  const live = norm((await rules.getRulesetContent(r.rulesetName))[0].content);
  const dir = '/Users/admin/Desktop/HearIsland/deploy/';
  console.log('released ruleset:', r.rulesetName.split('/').pop(), r.updateTime);
  console.log('equals PRE-release (firestore.production.rules):', live === norm(fs.readFileSync(dir + 'firestore.production.rules', 'utf8')));
  console.log('equals POST-release (firestore.production+activity6.rules):', live === norm(fs.readFileSync(dir + 'firestore.production+activity6.rules', 'utf8')));
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
```
```bash
node /tmp/check-rules.cjs
```
Before the deploy it must print `equals PRE-release …: true`. If it is `false`, **stop and report.**

---

## 4. Deploy: exactly two commands, in this order

**Step A: rules.** Rules go first, so saving works as soon as the page is reachable.
```bash
npx firebase deploy --only firestore:rules --config firebase.rules-activity6.json --project dnd-master-73449
```
Wait for `Deploy complete!`. Then:
```bash
node /tmp/check-rules.cjs
```
It must now print `equals POST-release …: true`. If it does not, roll back (section 6) and stop.

**Step B: hosting, new site only.**
```bash
npx firebase deploy --only hosting --config firebase.activity6.json --project dnd-master-73449
```
The output must name `welearn-activity6` and `https://welearn-activity6.web.app`. If
it mentions `dnd-master-73449.web.app` as the target, **stop and report immediately.**

---

## 5. Post-deploy verification

1. **The new site serves the Activity 6 build:**
   ```bash
   curl -s https://welearn-activity6.web.app/ | grep -o -E "<title>[^<]*</title>|assets/activity6-[A-Za-z0-9_-]+\.js"
   ```
   The title must be `Activity 6 · SO₂ → Sulfate · WeLearn`, and the JS filename must
   match `dist-activity6/assets/`.
2. **The main site is untouched:** rerun the 3.3 command. The `assets/index-….js` value
   must be **identical** to what you recorded.
3. **The rules are the merged file:** `node /tmp/check-rules.cjs` prints `equals POST-release …: true`.
4. Open `https://welearn-activity6.web.app` in a browser and confirm the sign-in page
   renders with no console errors. **Do not sign in.** The Platform Lead or teacher
   will do the signed-in check with a real account: choose a budget, run one
   simulation, and see a ledger row appear.

---

## 6. Rollback

- **Rules** (restore the exact pre-release ruleset). Create a temporary config pointing at the saved copy:
  ```bash
  printf '{ "firestore": { "rules": "deploy/firestore.production.rules" } }\n' > /tmp/firebase.rollback.json
  ```
  ```bash
  npx firebase deploy --only firestore:rules --config /tmp/firebase.rollback.json --project dnd-master-73449
  ```
  If the CLI refuses a config outside the project folder, copy the file into the repo
  root as `firebase.rollback.json`, deploy, then delete it.
- **Hosting** (take the new site offline; the main site is unaffected either way):
  ```bash
  npx firebase hosting:disable --site welearn-activity6 --project dnd-master-73449
  ```

---

## 7. Report back

Reply with:
- each pre-flight check (3.1–3.6): pass/fail, with the key output line;
- the two deploy outputs (last ~10 lines each);
- the three post-deploy results, including main-site asset hash before and after;
- anything you did not do, and why.

"Done" means verified on the running site, not just "the command succeeded".

## 8. Context you do not need to act on

- The live ruleset lets any signed-in user read all user profiles and several
  subcollections. That is a known, separate issue, fixed by the planned claims
  migration and hardened rules. **It is out of scope here. Do not "fix" it in this release.**
- Credits in Activity 6 are virtual simulation credits for teaching. They are not money.
