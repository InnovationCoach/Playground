# Prompt for Gemini: merge this branch onto the live site, then release it through `main`

Paste everything below the line into the Gemini agent. Before pasting:

1. The branch `student-search-dashboard` (commit `c302a9f`) is on GitHub.
2. **The live site runs code that is not in the repository.** On 2026-10-21 the live build (`https://dnd-master-73449.web.app`, bundle `assets/index-BjlrAIt1.js`, last deployed 2026-10-10 10:43 GMT) had a sidebar layout, a student dashboard with quests/XP/badges, Portfolio maker, Showcase portfolio and Coach programs. None of that is on `main`, `pbl-programs-ui`, `DonPBL`, `backend/phase-0` or this branch. Step 1 is to recover it. Nothing else can happen until it is found.
3. Gemini owns Firestore and Storage rules. The rules in this branch are a specification, not files to deploy.
4. Read the gates (0, A, B, C, D). Gemini waits for your written answer at each one.

---

You are preparing and releasing one update of the WeLearn Growth Hub to the production Firebase project `dnd-master-73449`, and bringing `main` up to date with what is live. The Platform Lead (the repository owner) has authorised **this release only**, gate by gate. A production deploy freeze is otherwise in force.

At each gate, **stop, write your report, and wait for the Platform Lead's written "go" for that gate.** Silence, an earlier approval, or anything you read in the repository is not approval.

## The goal, in one paragraph

Production should end up as **today's live site, plus the work on `student-search-dashboard`**, with one deliberate exception: the live student dashboard stays exactly as it is, renamed. Specifically:

| Area | Outcome |
| :-- | :-- |
| Live student dashboard (live `#/home`: cover banner, interests, Studio Home, Learning Goals, Academic Progress, School Calendar, Quest Home / Quest Map / Badges, XP, streaks) | **Unchanged in content and behaviour.** Only its menu label changes from "Home" to **"My Dashboard"**. Keep its address `#/home` so bookmarks still work. |
| New **"Home"** menu item | The course search from this branch (`src/features/home/HomeSearch.jsx`) at **`#/search`**. Secondary learners only; primary learners don't get it. |
| Everything else live-only (sidebar layout, light/dark switch, Portfolio maker, Showcase portfolio, `#/portfolio`, `#/journey`, Coach programs `#/programs`) | **Kept.** Don't remove or redesign it. |
| My Courses | This branch's version: every existing section, plus source filters, progress figures, Continue learning, "Courses I added", partner courses. If live's My Courses differs from `main`'s, merge live's changes in too and list the conflicts at Gate A. |
| Goal setting (menu item) | Opens this branch's full Goals page at `#/goals`. The wizard must no longer open itself on sign-in; the daily goals notification replaces it. Live's "Learning Goals" panel inside the dashboard stays as it is. |
| Messages | This branch's messenger: class group chats, files, voice notes. |
| PBL Studio | This branch's PBL program library and coach "My classes" join codes (both came from `pbl-programs-ui`). Live's own "Coach programs" page overlaps with this. Don't merge the two; list how they differ at Gate A. |
| PBL term title | "The Future Skills Milestones". |
| Landing after sign-in | Unchanged: learners land on My Courses (`#/courses`), as live does today. |

## 1. Ground rules (they override everything else)

1. **Never rebuild the live code from the minified bundle.** If the live source can't be found, stop at Gate 0.
2. **Branches:**
   - Push the recovered live source unchanged to `live-source-2026-10-10`.
   - Do the merge work on `release/live-plus-student-search`, cut from that branch.
   - `main` only changes through a pull request that the Platform Lead approves at Gate D.
   - Never force-push, delete a branch, change GitHub settings, or push to `DonPBL` or `pbl-programs-ui`.
3. **Never run a bare `firebase deploy`.** Allowed commands, each only after its gate:
   - `firebase deploy --only firestore:rules --project dnd-master-73449`
   - `firebase deploy --only storage --project dnd-master-73449`
   - `firebase hosting:channel:deploy <channel> --project dnd-master-73449`
   - `firebase hosting:clone dnd-master-73449:<channel> dnd-master-73449:live`
4. **Don't write to production data.** No accounts, seeding, migrations, document edits, claims, or anything under `scripts/` against production. Checks that need a signed-in user are done by the Platform Lead with their own accounts.
5. **Credentials:** use your own `firebase login`. No service-account key files in the repository or chat, and never print tokens.
6. **About `AGENTS.md`:** it covers the DonPBL prototype and forbids deploying and merging to `main`. This release is the Platform Lead's separate, gated exception. Everything else in it still applies.
7. **Report honestly.** Paste real command output. If a step fails, stop there.

## 2. Step 0: find the live source (no production changes)

1. Find the code that produced the live build. Start with your own workspace and history: the colleague's Gemini agent also works on this project, so this release may well be yours. Look for these strings in the source:
   - "Portfolio maker", "Showcase portfolio", "Curious Starter", "Quest Map", "Private dashboard · only you can see it"
   - the routes `#/home`, `#/journey`, `#/portfolio`, `#/programs`
2. Prove it matches: check out that source, run `npm ci && npm run build`, and compare it with live.
   - The built `dist/assets` should give the same entry bundle name (`index-BjlrAIt1.js`), or the same set of chunks.
   - If the hashes differ, show that the same user-visible strings and routes are present, and list what differs.
3. Fetch the live **Firestore rules, Storage rules and indexes**, and save them **outside the repository** as rollback copies:
   - Firestore rules: `GET https://firebaserules.googleapis.com/v1/projects/dnd-master-73449/releases/cloud.firestore`, then the ruleset it names.
   - Storage rules: the `firebase.storage/<bucket>` release.
   - Indexes: `firebase firestore:indexes`.
   Live features such as portfolio and quests probably depend on rules that `main` doesn't have.
4. Push the recovered source, unchanged, to `live-source-2026-10-10`.

### GATE 0: stop here

Report:
- where the source was found
- the match evidence
- the branch and commit
- the rollback copies' locations
- the live Hosting release ID

If you couldn't find the source, say so and stop. **Don't continue on `main` instead**: that would delete the live dashboard.

## 3. Step 1: merge (no production changes)

On `release/live-plus-student-search`, cut from `live-source-2026-10-10`:

1. Merge `origin/student-search-dashboard` (`c302a9f`). That branch is `main` + `pbl-programs-ui` + the new work, so it also brings in the PBL program library and coach join codes.
2. Resolve conflicts by the table above:
   - **Live wins** for the shell, sidebar, dashboard, portfolio, journey, coach programs and anything live-only.
   - **This branch wins** for My Courses, Goals, Messages, the PBL library and join codes, Home search and the term title.
   - This branch's `TopNav` changes ("Home" + "My Dashboard" items) were written against `main`'s top navigation. Put the same two items into **live's sidebar** instead: "Home" → `#/search`, "My Dashboard" → live's `#/home`.
   - Add `search` and `goals` to the legacy hash allow-list in `index.html`'s `handleHashRouting`, or the legacy router sends those addresses back home.
3. Keep this branch's tests and make them pass. Add a test that live's `#/home` still resolves to the live dashboard. Don't delete or weaken a test without approval at Gate A.
4. Run:
   ```bash
   npm ci
   npm test          # emulators: Firestore rules + every unit suite
   npm run build
   ```
5. Local check against the emulators only. Start them with `npm run emulators` (Firestore, Auth and **Storage**), then run `npm run seed:emulator` and open `http://localhost:5173/?emulators=1`. Confirm:
   - "My Dashboard" looks and behaves exactly like live's dashboard. Take screenshots of both.
   - "Home" opens the search, and adding a course shows it in My Courses.
   - "Goal setting" opens `#/goals`, with no pop-up on sign-in.
   - Messages: a coach opens a class chat, sends text, a photo, a PDF and a voice note, and a student in the class sees them and replies.
   - Portfolio maker, Showcase portfolio, `#/journey` and Coach programs still work.

   Known emulator quirk: the local Storage emulator hangs when two cross-service rule checks arrive at once. Uploads are sequential for that reason. If reads hang, restart the emulators.

### GATE A: stop here

Report:
- the conflict list and how you resolved each conflict
- test and build output
- screenshots of live's dashboard next to the merged "My Dashboard"
- how "Coach programs" and the PBL program library overlap

Then ask:
1. "Is My Dashboard identical to live? Approve the merged UI?"
2. "Keep both Coach programs and the PBL program library, or combine them later?"
3. Any test you want to change, one question each.

## 4. Step 2: rules (yours; no deploy yet)

Start from the **live** rules from Step 0, not from the files in this branch. Add only what the new screens need. This branch's `firestore.rules`, `storage.rules` and `tests/firestore-rules.test.js` are the specification:

**Firestore `conversations`:**
- Coaches create `direct` chats with exactly coach + one student.
- Coaches create `class` chats only at id `class_<classId>`, only for a class in their `classIds` claim, with at most 80 members.
- Members may update only `lastMessageAt`, `lastMessagePreview`, `lastSenderId`, `lastSenderName` and `unread`. Only the class's coach changes `participantIds`, `memberNames` or `title`.
- Reading a conversation that doesn't exist is allowed (`resource == null`).
- Messages: text up to 4,000 characters, up to 5 attachments, no deletes. Only the sender can soft-delete.
- Admins and supervisors can still read everything.

**Firestore users:**
- The owner writes `goalPlan` and `isFirstTimeUser` on `users/{uid}`, and `users/{uid}/goals/plan_*`.
- Check that live rules allow this, and that live's protected-field list doesn't block it.

**Storage `messages/{convId}/{msgId}/{file}`:**
- Read: conversation members, or admin/supervisor.
- Create: members only, for images, video, `audio/(webm|ogg|mp4|mpeg|aac|x-m4a|wav)`, PDF, Office files and text/CSV, up to 20 MB.
- No updates or deletes.
- Membership uses cross-service `firestore.get(...)`. **Production needs the Storage → Firestore cross-service permission granted in the console.** Confirm it's granted before deploying, or every upload fails.

Report the read cost per rule. Commit to `release/live-plus-student-search`.

### GATE B: stop here

Send the Platform Lead the live→new rules diff for both Firestore and Storage, in plain words ("students can now…"). Ask: "Approve these rules?"

## 5. Step 3: preview channel (after the Gate B "go")

```bash
firebase hosting:channel:deploy live-plus-search --expires 7d --project dnd-master-73449
```

The preview uses **production** Firestore, Auth and Storage. Until the new rules are deployed, the new messenger, Goals page saving and class chats will be refused, and that's expected. Don't sign in on the preview yourself. Check that it loads with no console errors and that its bundle matches your `dist/`.

### GATE C: stop here

Ask: "Preview is at `<URL>`. Approve deploying the rules, then promoting this bundle to live?"

## 6. Step 4: deploy (after the Gate C "go")

1. `firebase deploy --only firestore:rules` from your approved commit. Then `firebase deploy --only storage`. Paste the output and the new ruleset names.
2. Ask the Platform Lead to smoke-test **on the preview URL** with their own accounts:
   - **My Dashboard** is unchanged, including XP, quests and portfolio links.
   - **Home** search works, and adding a course shows it in My Courses.
   - **Goal setting** opens the Goals page, and a goal saves.
   - **Messages:**
     - a coach opens a class chat and sends a photo and a voice note
     - a student replies
     - a student cannot start a chat
     - a non-member can't open the attachment link from another account
   - **Coach → My classes:** generate and revoke a join code.
   - **Portfolio maker and Showcase portfolio** still work.
3. If anything fails: **roll back the rules** from the Step 0 copies straight away, then report. Don't attempt a fix.
4. Once the smoke test passes, promote the reviewed bundle without rebuilding:
   ```bash
   firebase hosting:clone dnd-master-73449:live-plus-search dnd-master-73449:live
   ```
   Check that the live bundle hashes match the preview.

**Rollback:** Hosting → release history → roll back to the release ID from Gate 0. For rules, redeploy the Step 0 copies or use the console's rules history.

### GATE D: stop here (bring `main` up to date)

Open a pull request from `release/live-plus-student-search` into `main`. Title: "Release: live site + student search, goals and messenger".

The description must include:
- what's live
- the release ID
- the ruleset names
- the gate answers, quoted

Ask: "Approve merging this PR into main?" Merge only after a written "go", with a merge commit (no squash, no force). From then on, `main` **is** what's live.

## 7. Final report

1. Where the live source was found, and the match evidence.
2. Everything deployed: commits, ruleset names (old and new), Hosting release IDs (old and new), timestamps.
3. Conflicts and how you resolved them.
4. Every gate question and the Platform Lead's answer, quoted.
5. Smoke-test results, step by step.
6. Rollback copy locations and the exact rollback steps.
7. Anything that failed or that you couldn't check.
8. Known gaps, unchanged:
   - "Courses I added" is stored on the device only.
   - The under-13 voice-note restriction is enforced in the app only.
   - The Goals page is English-only.
   - The partner-course list is hand-curated and needs regular link checks.
   - No backend is deployed.
