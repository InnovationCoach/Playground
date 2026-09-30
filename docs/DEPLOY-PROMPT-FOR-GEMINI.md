# Task prompt: deploy HearIsland and complete production setup

You have write access to the Firebase project `dnd-master-73449`. The working
tree at `/Users/admin/Desktop/HearIsland` contains changes that are tested and
verified locally but **have never been deployed**. Your job is to get them live
safely and finish three pieces of production setup that need Admin SDK access.

Read this whole document before running anything. **Step order is
load-bearing** — reversing steps 3 and 4 will lock every coach out of the
platform.

---

## 1. What this app is

WeLearn Growth Hub: a PBL/STEAM learning platform for ages 13–18. React shell
(`src/app`, `src/features`) plus five legacy activities that still live as static
markup in `index.html`. Firebase Auth + Firestore. Hosting serves `dist/`
statically — **there is no deployed backend**: no Cloud Functions, no rewrites,
and `VITE_API_URL` is unset, so the Express server in `server/` resolves to
`localhost:3001` on a user's machine and is unreachable in production.

Two security invariants that everything else depends on — do not weaken either:

- **`role` lives only in a custom auth claim.** It is never derived from an email
  address and never read from localStorage. A previous version granted coach
  access to any address containing "coach", which let any student into the coach
  portal.
- **`classIds` is the tenancy boundary.** A coach may only read students who
  share one of their classes. Without it, every coach sees every student in every
  school.

---

## 2. Verified state of production right now

I fetched the live site and inspected the deployed bundle
(`https://dnd-master-73449.web.app/assets/index-BQbcxiUc.js`).

**Already deployed:**
- React shell (`react-root`)
- Class-scoped coach query (`array-contains-any`)
- Claims-based role resolution (`getIdTokenResult`)
- The email-substring role check is gone

**NOT deployed (this is your payload):**
- `Persistence.SESSION` + the `hi:sessionAuthMigrated` flush — the login fix
- `classCodes` / `enrolledVia` / `join-panel` — class enrolment by join code
- Solar Car acceleration model (`simulateRun`) and shown working (`workings`)

**Unknown — you must check, do not assume:** whether the hardened
`firestore.rules` in this repo have ever been deployed, and whether any user has
`classIds` or custom claims set. Verify before acting.

---

## 3. The critical ordering constraint

The hardened rules **require data that production may not have yet**:
`users/{uid}.classIds`, and `role` / `classIds` as custom auth claims.

The migration scripts use the Admin SDK, which **bypasses security rules**, so
they are safe to run at any time. The rules are not safe to deploy before the
migration has produced the data they read.

**If you deploy rules before migrating:** `isTeacher()` reads
`request.auth.token.role`, which will be unset for everyone, so every coach is
demoted to a student and every coach dashboard goes empty. Students keep access
to their own data (the `isOwner` path), so it fails quietly rather than loudly.

Correct order: **migrate → deploy rules → deploy hosting → grant → verify.**

---

## 4. Preconditions

1. Place the service account key at `scripts/firebase-admin-key.json`
   (Firebase Console → Project Settings → Service Accounts → Generate new private
   key). This path is already gitignored. **Never commit it, never paste its
   contents into a chat, and never add it to any file that gets committed.**
   `GOOGLE_APPLICATION_CREDENTIALS` is honoured as an alternative.
2. `npm ci`
3. Confirm the full suite is green before you deploy anything:
   ```bash
   npm run build
   npm run test:unit                              # 53 tests — Solar Car model
   npm test                                       # 46 tests — Firestore rules
   node tests/coach-portal-audit.test.js          # 6
   node tests/all-buttons-clickability.test.js    # 26
   ```
   If any of these fail, **stop and report** rather than deploying.

> `npm test` starts its own Firestore emulator on port 8088 and will fail with
> "port taken" if a local emulator is already running. Either stop it, or run
> `npx vitest run tests/firestore-rules.test.js` against the running one — the
> test project (`demo-hearisland-rules`) is a separate namespace.

---

## 5. Steps

### Step 1 — Record the current state

Before changing anything, capture what production looks like so you can describe
the change and roll back if needed:

- How many documents are in `users`, and how many already have a non-empty
  `classIds`?
- How many have `role: 'teacher'`?
- For each of those, does `getAuth().getUser(uid).customClaims` contain
  `role: 'teacher'`? **The claim, not the Firestore field, is what the rules
  read** — they can disagree, and the claim wins.
- Do the `classes` and `classCodes` collections exist at all?
- What rules are currently live? (Firebase Console → Firestore → Rules, or
  `firebase firestore:rules:get` if available.) Save a copy.

Report this before proceeding.

### Step 2 — Migrate (dry run first)

```bash
npm run migrate:classes:dry
```

This derives one class per distinct `groupName`, assigns each coach to the class
matching their own `groupName`, and issues a join code per class. Read the output
carefully:

- If every user shares the default `groupName` (likely — the old sign-up form
  defaulted everyone to `Climate Champions 7A`), you get **one class**. That is
  fine for a single school.
- The dry run lists any coach it could **not** place. Those coaches will see an
  empty dashboard until you place them manually in Step 6.
- `--assign-all-coaches` gives every coach every class. Use it **only** if this
  is genuinely one school where all coaches share all students. It defeats the
  tenancy boundary across schools, so do not use it if you are unsure.

When the dry run looks right:

```bash
npm run migrate:classes
npm run migrate:agebands:dry     # then, if it looks right:
npm run migrate:agebands
```

The age-band migration rewrites retired bands (`6-9`, `10-13`, `14-18`) to the
supported `13-15` / `16-18`. It deliberately **does not modify** accounts
registered as under-13 — it lists them instead. If any appear, report them and
stop; the platform is 13–18 only and offboarding a child is the user's decision,
not yours.

Record the join codes the migration prints. You will need them for Step 7.

### Step 3 — Deploy the rules

```bash
firebase deploy --only firestore:rules --project dnd-master-73449
```

Then immediately verify in the console that the live rules contain
`isSelfEnrolment` and the `classCodes` match block. If they do not, the deploy
did not take — stop.

### Step 4 — Deploy hosting

```bash
npm run build
firebase deploy --only hosting --project dnd-master-73449
```

**Expected side effect, do not treat as a bug:** everyone currently signed in
gets logged out exactly once. The new build switches auth to
`Persistence.SESSION` and runs a one-time flush of sessions previously persisted
under the old `LOCAL` setting, keyed on `hi:sessionAuthMigrated`. Without that
flush, existing sessions would never expire and would never see the fix.

This is also convenient: coaches need a fresh token to pick up the custom claims
the migration just set, and the forced sign-out delivers exactly that.

### Step 5 — Verify the login fix

In a browser where someone was previously signed in:

1. Load the site. You should get the **login screen**, not a dashboard.
2. Sign in, then refresh — you should **stay** signed in.
3. Close the browser, reopen, load the site — you should be **signed out**.
4. Confirm `localStorage` holds no `firebase:authUser:*` key and
   `sessionStorage` does.

If step 1 still drops you straight into a dashboard, the build did not deploy —
check the asset hash in the served HTML against your local `dist/`.

### Step 6 — Grant Don coach access

`don@welearn.org` is currently a **student**. He was only ever a coach because
his address was hardcoded into the email check that has since been deleted. He
has no `role` claim. The same is true of `mani@welearn.org` and
`akira@welearn.org` — confirm with the user which of them should be coaches
before granting anything.

```bash
node scripts/grant-coach.js --list-classes          # get valid class ids
node scripts/grant-coach.js don@welearn.org --class <classId>
node scripts/grant-coach.js --list                  # confirm the claim is set
```

The script refuses to grant coach access without a class, deliberately: a coach
with no class sees an empty dashboard that looks broken. **Don must sign out and
back in** before the new claim reaches his token.

Verify by signing in as Don: he should get the Coach Dashboard with his class
roster, and must **not** be able to see students from any other class.

### Step 7 — Issue and hand over join codes

The migration already issued one code per class. To review or reissue:

```bash
npm run codes -- --list
npm run codes -- --issue <classId>     # if a class has none
npm run codes -- --rotate <classId>    # replaces it; the old code stops working
```

Codes look like `ABCD-2345`. The alphabet excludes `0 O 1 I L` and all vowels, so
there are no look-alikes and a code can never spell a word. Learners may type
them in any case, with or without the hyphen.

Give each teacher their class code. Learners enter it either in the optional
**Class code** field at sign-up, or afterwards from **Join your class** on their
dashboard.

### Step 8 — Yuri

`yuri.na@welearn.org` needs a student account on Year 9 (or whichever class the
user specifies).

**Have Yuri register herself** at the live site using Sign Up, and enter the
class code. That gives her an account whose password only she knows.

The user proposed the password `welearn`. Please don't set that: it is guessable,
looks like a shared class password, and this platform holds children's personal
data and coursework. If Yuri cannot self-register, create the account with a
random one-time password and have her change it — do not reuse a word connected
to the organisation, and do not write any password into a file in this repo.

Confirm afterwards that she appears on her teacher's dashboard, and that a coach
of a *different* class cannot see her.

---

## 6. Rollback

- **Rules** — redeploy the previous version. Keep the copy you saved in Step 1.
  Firestore also keeps rule history in the console.
- **Hosting** — Firebase Console → Hosting → release history → roll back. Instant.
- **Coach grant** — `node scripts/grant-coach.js <email> --revoke`
- **Join codes** — `npm run codes -- --revoke <classId>`
- **Migration** — additive (it sets `classIds`, claims and new documents; it
  deletes nothing), so there is no destructive change to undo. Reverting means
  clearing `classIds` and the claims, which is only necessary if you also roll
  the rules back.

---

## 7. Guardrails

- **Do not** relax `firestore.rules` to make something work. If a legitimate
  operation is denied, the query is wrong, not the rule. Every rule has a test in
  `tests/firestore-rules.test.js`; changing a rule means changing its test, and
  that should be a deliberate decision you report, not a workaround.
- **Do not** reintroduce role or class detection from email addresses,
  localStorage, or any other client-controlled value.
- **Do not** set `VITE_GEMINI_API_KEY` or any secret as a `VITE_`-prefixed
  variable. Vite inlines those into the public bundle at build time; doing so
  publishes the key. Secrets belong in `server/`'s environment only.
- **Do not** commit `scripts/firebase-admin-key.json` or `.env`.
- **Do not** run `scripts/seed-emulator.js` against production. It creates
  fictional students and coaches and is emulator-only.
- If a step's verification does not match what this document predicts, **stop and
  report** rather than continuing or improvising a fix.

---

## 8. What to report back

1. The production state you found in Step 1 (before/after counts).
2. Which classes now exist, with their join codes.
3. Which accounts were granted coach access, and to which classes.
4. Confirmation of the four login-persistence checks in Step 5.
5. Anything that did not match this document.

---

## 9. Known gaps (context, not tasks)

Do not try to fix these unless the user asks:

- **No backend is deployed.** Every AI feature (tutor, hints, feedback, Solar Car
  design review) calls `localhost:3001` and is dead in production. Fixing it means
  deploying `server/` — Cloud Run or Functions — and setting `VITE_API_URL` to it.
  Enrolment deliberately does **not** depend on this: it is client-side, with the
  security rules doing the verification.
- The Gemini API key was committed in the initial commit (`27e9d6a`), revoked by
  Google, and has since been rotated. The old value in git history is dead. The
  Firebase web API key in the client is **not** a secret — it is a public client
  identifier, and access is controlled by `firestore.rules`.
- Roughly 3,600 lines of never-imported React components sit under
  `src/components/`. They are dead and awaiting a keep-or-delete decision.
- The four non-Solar-Car activities have not been reworked and have no NGSS
  alignment or rubrics yet.
