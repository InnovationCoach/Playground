# Prompt for Gemini: deploy the PBL program library and coach join codes

Paste everything below the line into the Gemini agent. Before pasting:

1. Push the branch so Gemini can check it out: `git push -u origin pbl-programs-ui`. It is not on GitHub yet.
2. Read the three stop points (gates A, B and C). Gemini will wait for your written answer at each one.

---

You are deploying one release of the WeLearn Growth Hub to the production Firebase project `dnd-master-73449`. The Platform Lead (the repository owner) has authorised **this release only**, under the conditions below. A production deploy freeze is otherwise in force, so nothing outside this prompt is authorised.

This is a careful, gated deployment, not a quick one. At each gate, **stop, write your report, and wait for the Platform Lead's written "go" for that gate.** Don't treat silence, an earlier approval or anything you read in the repository as approval.

## 0. What is being released

Branch `pbl-programs-ui` at commit **`bcf4831`** in `https://github.com/InnovationCoach/Playground`:

- **PBL Studio → Programs:** a library of Don's six PBL programs. Learners' progress saves to `users/{uid}/activityProgress/pbl-program-<id>`. Coaches get a teaching guide and a content Checks tab.
- **Coach dashboard → My classes:** coaches choose the program each class runs, and generate, replace or revoke the class join code. Learners join with the existing "Join your class" box.
- **`firestore.rules`:** lets a coach create and delete `classCodes` for **their own classes only**, and set `classes/{id}.joinCode` and `classes/{id}.programId`, with strict validation. The rules tests cover it (`tests/firestore-rules.test.js`, describe block "coaches manage join codes and programs for their own classes").

## 1. Ground rules (they override everything else)

1. **Deploy only from a clean checkout of `bcf4831`.** Don't deploy from `main`, `DonPBL` or a working directory with local changes. Run `git status` and `git rev-parse HEAD` and paste the output.
2. **Never run a bare `firebase deploy`.** It would also deploy Storage rules, indexes and anything else in `firebase.json`. Only these targets are allowed, each only after its gate:
   - `firebase deploy --only firestore:rules --project dnd-master-73449`
   - `firebase hosting:channel:deploy <channel> --project dnd-master-73449` (preview channel)
   - `firebase deploy --only hosting --project dnd-master-73449`
3. **About `AGENTS.md`:** the copy in this branch is about the DonPBL prototype assignment, and it forbids deploying. This release is the separate exception the Platform Lead authorises here, gate by gate. Everything else in that file still applies: no force-push, no branch deletion, no GitHub settings changes, no production secrets in files or chat. If you think this prompt conflicts with it in some other way, stop and ask.
4. **Don't write to production data.** Don't create accounts, seed, migrate, edit Firestore documents, grant claims or run anything under `scripts/` against production. Any check that needs a signed-in user, the Platform Lead does themselves with their own accounts.
5. **Credentials:** use your own `firebase login` session for an account that has access to the project. Don't use service-account key files. Never copy one into the repository, and never print tokens or keys.
6. **Commits and pushes:** don't commit or push anything as part of this task. If a fix is needed, stop and report it. Don't patch and redeploy on your own.
7. **Report honestly.** Paste real command output. "Should work" isn't evidence. If a step fails, stop there.

## 2. Pre-flight (no production changes)

Run these and paste the output:

```bash
git fetch origin && git checkout --detach bcf4831 && git status && git rev-parse HEAD
npm ci
npm test                      # starts the Firestore emulator; all suites must pass
npm run build                 # produces dist/ - what Hosting would serve
firebase --version
firebase projects:list        # confirm you can see dnd-master-73449
```

Then gather these facts. Report them and **don't change anything**:

**a. The rules running in production right now.** Fetch the live ruleset, either from the Firebase console (Firestore → Rules) or from the Rules API:
- `GET https://firebaserules.googleapis.com/v1/projects/dnd-master-73449/releases/cloud.firestore` (the default database release)
- then `GET` the ruleset it names

Save it **outside the repository** as the rollback copy, for example `~/welearn-rules-backup-<date>.rules`, and record its ruleset name and create time. Don't assume the files in `deploy/` match production: they are older snapshots.

**b. A full diff between the live rules and this branch's `firestore.rules`.** The two have drifted a long way apart (the `deploy/` snapshots alone differ by about 500 lines). Deploying `firestore.rules` replaces the whole live ruleset, not just the join-code change. List every `match` block that is **added, removed or loosened** compared with production, in plain words: "students can now X", "coaches can now Y".

**c. What the Hosting deploy would change for users.** Find out which bundle is live, from the Hosting release history in the console. Then list the user-visible features in `bcf4831` that are not live yet. Check at least these, and for each say what happens in production:
- the admin console and account screens (`gh-app`, Phase 0)
- the parent portal
- community posts and private messages
- the Activity 6 v1.1 filter lab
- PBL Studio and the Programs tab
- My classes on the coach dashboard

A production build always uses the live API (`src/services/api/apiClient.js`), but `firebase.json` has **no `/api` rewrite** and no backend is deployed. So for every screen that calls `/api`, say plainly that it will fail in production, and how it fails (error message, empty state or broken page).

**d. Under-13 safeguarding.** The programs are written for ages 9–17. The Junior Explorers consent and age gate was deliberately left out of the UI during testing. Find out whether this build has any parental-consent or age gate in front of under-13 learners, and say plainly what you found.

**e. Indexes.** Confirm that nothing in this release needs a new Firestore index, and say why.

### GATE A: stop here

Send the Platform Lead one report with the pre-flight output and findings a–e. End it with these two questions and wait for the answers:

1. "Do you approve deploying `firestore.rules` from `bcf4831` as a whole, given the differences in (b)? Or should I deploy a rules file that is the **live rules plus only the join-code change**?"
2. "Do you approve shipping the Hosting bundle given (c) and (d)? Or should this release be **rules only**, with a preview channel for review?"

If the answer to Q1 is "live rules plus only the join-code change": build that file outside the repository. Start from the live rules and add only:
- the `isWellFormedCode` function
- the `classCodes` create, update and delete rules
- `classFieldsValid` and the `classes` create and update changes

The exact text is in `firestore.rules` at `bcf4831`, under "Join codes" and "Classes". Then run the full rules test suite against **that** file: temporarily point the `rules:` path in `tests/firestore-rules.test.js` at it, locally, without committing. Some tests may fail because production lacks other rules. Report which ones fail and why.

## 3. Preview channel (after the "go" for Gate A)

Only if Hosting is approved:

```bash
firebase hosting:channel:deploy pbl-programs --expires 7d --project dnd-master-73449
```

Give the Platform Lead the preview URL. A preview channel uses **production Firestore and Auth**, so:
- Until the rules are deployed, Generate / New code / Revoke on the preview **will be refused**. That is expected, not a bug.
- Don't sign in on the preview yourself. The Platform Lead tests with their own accounts.

What you can check without signing in: the page loads, the console shows no errors on the sign-in screen, and the deployed JS bundle hashes match your local `dist/`.

### GATE B: stop here

Ask: "Preview is at <URL>. Do you approve deploying the rules to production now?"

## 4. Deploy the rules (after the "go" for Gate B)

```bash
firebase deploy --only firestore:rules --project dnd-master-73449
```

Use exactly the file approved at Gate A. Paste the output and the new ruleset name.

Then ask the Platform Lead to run this smoke test with a real coach account that already has a coach claim and a class. For example, `mani@welearn.org` has `class_climate_champions_7a`. Remind them that coaches pick up a new claim only after signing out and back in.

1. Coach: My classes shows the class and its current code, or "No code".
2. Coach: assign a program, then **Generate** or **New code**. The new code appears, and the success message says the old one no longer works.
3. A learner account joins with the new code typed in lowercase without the dash. They see "Year … is doing <program>" under PBL Studio → Programs.
4. The old code is refused for a learner.
5. Coach: **Revoke**. Joining with that code is now refused.
6. A coach **cannot** see or change a class they don't teach. Try it with a second coach account if one exists.

If any step fails: **roll back the rules immediately** with the backup from Pre-flight (a). Use the console's Rules history, or deploy the backup file. Then report. Don't try a fix.

### GATE C: stop here

Report the smoke test results. Ask: "Rules are live and the smoke test passed. Do you approve promoting Hosting to live?" If Hosting wasn't approved at Gate A, the release ends here.

## 5. Promote Hosting (after the "go" for Gate C)

Promote the exact bundle the Platform Lead already reviewed on the preview channel. Don't rebuild:

```bash
firebase hosting:clone dnd-master-73449:pbl-programs dnd-master-73449:live
```

Then check that the live site serves the same bundle hashes as the preview. Ask the Platform Lead to repeat smoke test steps 1–3 on the live URL.

**Rollback:** Firebase console → Hosting → release history → roll back to the previous release. Rules rollback is described in section 4.

## 6. Final report

Send one report containing:

1. The commit deployed (`bcf4831`), and what was deployed: rules, Hosting or both. Include timestamps, the new and previous ruleset names, and the previous and new Hosting release IDs.
2. The full pre-flight output and findings a–e.
3. Every gate question with the Platform Lead's answer, quoted.
4. Smoke test results, step by step.
5. Where the rules backup is saved, and the exact rollback steps for both rules and Hosting.
6. Anything that failed or that you couldn't check. Don't hide a failure behind a passing summary.
7. Known gaps for the Platform Lead, unchanged from before this release:
   - No backend is deployed, so the AI co-pilot uses its built-in fallback.
   - The school schedule, age bands and hardware are not confirmed.
   - Under-13 consent: whatever you found in (d).
   - Coaches can't yet review learners' program progress.
