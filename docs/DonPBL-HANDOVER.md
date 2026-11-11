# Don's PBL prototype handover

Repository: https://github.com/InnovationCoach/Playground

Working branch: **DonPBL** (case sensitive).

**DO NOT CHANGE ANYTHING FROM LIVE PRODUCTION.** Upload prototype work only to
this branch. The owner will decide separately whether anything should be integrated.

## Join and connect

1. Give the repository owner your GitHub username and accept the repository invitation.
2. Create a fresh checkout; do not reuse the owner's working directory:

   ```sh
   git clone --branch DonPBL --single-branch https://github.com/InnovationCoach/Playground.git Playground-DonPBL
   cd Playground-DonPBL
   git branch --show-current
   git remote -v
   ```

3. Open this folder in your AI agent's editor. Give the agent the prompt below and
   ask it to read `AGENTS.md` and this document before doing work. The assignment
   does not require changing the application's Gemini model or installing a model SDK.
   Use whichever Gemini model your own agent account actually provides; the owner's
   label “Gemini 3.8” is not a verified model identifier.

## Prototype scope

Start with an isolated, fixture-based PBL program prototype under
`prototypes/DonPBL/`, with its own README and any local demo setup inside that folder.
Do not connect it to the live application's routes or services yet.

Each program should include:

- Title, learner age range, duration, learning goals, materials, and teacher guidance.
- A driving question and a real problem helping people, the environment, or both.
- Explore, empathise, define, ideate/plan, prototype, test/improve, and showcase phases.
- Session activities, learner choices, evidence to collect, reflection prompts,
  assessment rubrics, and a measurable impact or success criterion.
- Mock student and teacher views, example evidence, and empty/error/loading states
  where relevant. All names, accounts, evidence, and results must be fictional.

Suggested first deliverable: one complete sample program, a clickable local demo,
and a short explanation of how it could later fit the existing PBL Studio.
Confirm actual theme, age band, duration, and learning priorities with the owner;
label provisional choices clearly instead of presenting them as school decisions.

## Existing code to read

- `docs/PBL-STUDIO-NOTES.md`: existing PBL experience and known questions.
- `src/features/pbl/PblStudio.jsx`: PBL Studio composition.
- `src/features/pbl/content/pblModel.js`: term and phase content.
- `src/features/pbl/content/competencies.js`: school competencies and known data issues.
- `src/features/pbl/content/steamNgss.js`: STEAM alignment and rubric structure.
- `src/features/pbl/engine/pblProject.js`: existing project/evidence model.
- `tests/pbl.test.js`: existing model expectations.
- `docs/BACKEND-PBL-COPILOT-PROMPT-FOR-GEMINI.md`: historical endpoint reference,
  not permission to implement or deploy the backend in this assignment.

This branch starts from GitHub `main` at
`dbc57ab3fc6f228882c9b927deab92f67d2dcf6f`. It does not include the owner's
uncommitted work or work from other development branches.

## Safe local development

Use a standalone mock demo as the default. Keep its dependencies, scripts, and
assets inside `prototypes/DonPBL/`; document the exact installation and start
commands when creating it. Do not copy `.env` files or production credentials.

The existing application uses React/Vite and Firebase. Its normal Firebase setup
points to a live project. Do not open the normal app and assume localhost is safe.
Do not use real student accounts, call deployed APIs, upload media, run live seed
or migration scripts, or use production service account credentials.

If an existing-app comparison is necessary, inspect all Firebase clients and
network paths first. The existing emulator scripts use `demo-hearisland-local`:

```sh
npm ci
npm run emulators
# In another terminal:
npm run server:dev:emulator
# In another terminal:
npm start
```

Only open `http://localhost:5173/?emulators=1#/pbl` after verifying emulators are
running. Check `window.__hearIslandUseEmulators === true`, the Firebase project ID
is `demo-hearisland-local`, and requests go to local services. Stop if verification
fails; never fall back to live services. This setup wires Auth and Firestore,
but does not establish complete isolation: Storage and secondary Firebase apps
(such as account-registration helpers) need separate verification. Do not use
uploads, registration, or cloud AI during prototype review. If full isolation
cannot be demonstrated, use the standalone mock demo instead.

## Save and hand back

Keep new code and program content under `prototypes/DonPBL/`. Document any desired
shared-app changes as proposals, rather than editing the shared files.

Before each upload:

```sh
git branch --show-current
git status --short
git diff
git add prototypes/DonPBL/
git diff --cached --stat
git diff --cached
git commit -m "Prototype PBL program on DonPBL"
git push origin HEAD:refs/heads/DonPBL
```

The branch check must return `DonPBL`. Stage specific files only. Never use a
force push. Fetch `main` for comparison if needed, but do not merge or rebase
without owner direction. Review the full branch diff against `origin/main`.

Deliver: a branch link, changed-file list, local demo instructions, meaningful
checks and their results, screenshots if useful, assumptions, and integration
questions. Do not create a production-targeted pull request or merge the work.

## Prompt to paste into the colleague's Gemini agent

```text
You are helping Don prototype Project-Based Learning programs in
https://github.com/InnovationCoach/Playground on branch DonPBL only.

DO NOT CHANGE ANYTHING FROM LIVE PRODUCTION.

Read AGENTS.md and docs/DonPBL-HANDOVER.md first. Verify the repository remote and
that the checked-out branch is exactly DonPBL before making changes. If either
does not match, stop and report it.

Build one isolated PBL program prototype under prototypes/DonPBL/ using synthetic
data and mocked services. Read the existing PBL Studio content and model for
context. Include a driving question, target learners, duration, learning goals,
phase/session plan, assessment, evidence, reflections, and measurable impact.
Label unknown school requirements as assumptions. Keep setup self-contained and
provide a local demo README.

Do not edit shared app code, root dependencies, Firebase configuration, rules,
deployment files, workflows, or production data. Do not deploy, create cloud
resources, use live accounts/secrets, merge, force-push, or push any other branch.
Treat historical backend prompts as reference only. Mock cloud AI and Firebase.

Run meaningful checks for your prototype, review all diffs, and commit only your
prototype files. Upload with git push origin HEAD:refs/heads/DonPBL. Hand back the
branch link, changed files, demo steps, check results, and proposed integration
questions for the owner. Stop after the prototype handover; integration requires
a separate assignment.
```

## Owner access note

The colleague's GitHub username is needed to send the invitation. Repository write
access is not limited to one branch by this document. At preparation time, `main`
had no branch protection and the repository had no GitHub Actions workflows.
External hosting integrations have not been verified. The owner should arrange
appropriate branch protection and production access restrictions before granting
write access if technical enforcement is required. This handover does not change
repository settings or production deployment configuration.
