# Prompt for Gemini: fix the DonPBL prototype before migration

Paste everything below the line into the Gemini agent working in the DonPBL checkout.

---

You are working on Don's PBL prototype in `https://github.com/InnovationCoach/Playground`, branch `DonPBL`, folder `prototypes/DonPBL/`. The Platform Lead audited this branch on 2026-10-20 before moving it into the main app's coach dashboard. The audit found that the UI does not build, nothing is saved, and several claims in the docs and data are not true. Your job is to fix those problems **on the DonPBL branch only**, so the migration can start from a prototype that is honest and actually works.

Do not start the migration itself. Don't convert anything to JSX, wire it into `src/`, add join codes or touch Firebase. The Platform Lead will do that after reviewing your work.

## 0. Ground rules (read first, they override everything else)

1. Read `AGENTS.md` and `docs/DonPBL-HANDOVER.md` again and follow them.
2. Before any edit, run `git branch --show-current` (must print `DonPBL`) and `git remote -v` (must be `InnovationCoach/Playground`). If either is wrong, stop and report back.
3. Only edit files under `prototypes/DonPBL/`. Don't touch root `package.json`, lockfiles, `vite.config.*`, `firestore.rules`, `firebase.json`, `src/`, `server/`, `scripts/` or workflows. Don't install any dependencies.
4. No deploys, Hosting previews, Firebase connections, live accounts or real student data. A production deploy freeze is in force, and no backend is deployed.
5. **Don't claim a check passed unless you ran it in this session and can paste its output.** The last report said `npm run build` succeeded and `tsc --noEmit` returned zero errors. Neither can be true: the repo has no TypeScript and no tsconfig, and nothing in the build imports the prototype. Reports like that are why this audit happened.
6. **Never write "confirmed by Don", "verified" or "approved" unless you can cite where the confirmation came from: a message, a date and who said it.** If you can't cite it, the item is an assumption.
7. Commit in small, focused commits on `DonPBL`. Push only to `DonPBL`. Never force-push.

## 1. Make the UI build

**Problem.** Nine imports in `ui/` point at a module that does not exist:

- `ui/PblStudioApp.tsx` imports from `./pbl`
- `ui/components/*.tsx` import from `../pbl` (AiCopilotModal, StudentView, TeacherView, HexCitySimulator and others)

There's no `ui/pbl.ts` or `ui/pbl/index.ts` in the branch, so the bundler fails with `Could not resolve "../pbl"`.

**Fix.**

1. Create `prototypes/DonPBL/ui/pbl.ts` as a barrel that re-exports exactly what the UI imports from `../programData`, `../programRegistry`, `../engine` and `../mockFixtures`. Use **named** re-exports, not `export *`. With `export *`, a name that two modules both export is silently dropped, and the UI gets `undefined` at runtime with no build error. `programRegistry.ts` already re-exports several names from `programData.ts`, so this collision can happen.
2. Every `import { SomeType }` that is a type only must be `import type { SomeType }`, so the files can also run under type-stripping.
3. Check that every `lucide-react` icon the UI imports exists in the version installed in the root `node_modules` (`^1.48.0`). Bundle **without** `--external:lucide-react`, so a missing icon fails the build instead of rendering nothing.

**How to verify.** Use the `esbuild` that's already installed in the repo root. Don't install anything.

```bash
node_modules/.bin/esbuild prototypes/DonPBL/ui/PblStudioApp.tsx \
  --bundle --jsx=automatic --format=esm --outfile=/tmp/donpbl-ui.js --log-level=warning
```

This must exit 0 with **no warnings**. Paste the full output in your report.

## 2. Make the demo actually runnable

**Problem.** The README says `npm run dev` and opening `http://localhost:3000` shows the demo. It doesn't: no route or entry file in the app imports `prototypes/DonPBL`, so the root dev server never shows it.

**Fix.** Add a self-contained demo inside the prototype folder, without editing any root config:

- `prototypes/DonPBL/demo/index.html` and `prototypes/DonPBL/demo/main.tsx`, which mount `PblStudioApp`.
- `prototypes/DonPBL/demo/vite.config.mjs`, which sets `root` to the demo folder and runs on port **5180**. Don't use 3000 or 5173, because the main app uses those. Run it with the root's installed Vite: `node_modules/.bin/vite --config prototypes/DonPBL/demo/vite.config.mjs`.
- **Styling.** The components use Tailwind class names, and the main app doesn't use Tailwind, so the components currently render unstyled. For the demo only, load the Tailwind Play CDN in `demo/index.html`. Pin the version, for example `https://cdn.tailwindcss.com/3.4.17`. Don't add Tailwind to the root project. Note in the README that styling will be rebuilt against the app's own CSS during migration.

**How to verify.** Start the demo, open it in a browser, and switch through Student and Teacher view, every program in the program selector, and every simulator modal. Check the browser console. Report any error, plus a screenshot of the student view and the teacher view.

## 3. Replace the fake checks with real tests

**Problem.** `checks.js` reports "All 15 verification checks PASSED", but it never runs the prototype's code:

- It **re-implements** `safeLink` inside `checks.js` and tests that copy, not `engine.ts:33`.
- Most other "checks" are `fs.readFileSync(...).includes('some string')`. They pass if the text appears anywhere in the file, even in a comment.

So the suite would still pass if `engine.ts` were completely broken.

**Fix.** Rewrite it as `prototypes/DonPBL/checks.mjs`, which:

1. Bundles the real modules with the root's `esbuild` (build API, `bundle: true`, `format: 'esm'`, output to `os.tmpdir()`), then `import()`s the result. That avoids the extensionless-import problem with Node's type-stripping and adds no dependencies.
2. Tests the **real** exports of `engine.ts`:
   - `safeLink`: blocks `javascript:`, `data:`, `vbscript:`, protocol-relative `//evil.com`, mixed case `JaVaScRiPt:` and leading whitespace; accepts http and https; enforces the length limit.
   - `evaluateReadiness`: an empty project, a half-done project and the complete fixture project each give the expected score and failing criteria. Assert exact numbers.
   - `validateAndAddEvidence`: rejects a missing title, a bad phase, an unsafe link, and an `ai` item missing `asked` or `kept`; accepts a valid item; returns a **new** object without mutating its input.
   - `getPhaseProgress` and `getCompetencyCoverage` on the fixtures.
   - `calculateUnitEconomics`: hand-computed cases, including zero units and zero price. No `NaN` or `Infinity` should reach the UI.
   - `simulateMarketStep`: stays deterministic for a given seed or input. If it uses `Math.random`, give it an injectable random source.
3. Tests the **data**, by importing `PROGRAM_REGISTRY`, not by grepping text:
   - Every registry key equals its program's `id`, and `PROGRAM_LIST` has exactly the same ids as the registry.
   - Every program has all 7 phases (`explore, empathise, define, ideate, prototype, test, share`) in order, with non-overlapping weeks that stay within `durationWeeks`.
   - Session counts add up to `totalSessions`.
   - Every competency id a program references exists in the competency list in `mockFixtures.ts`.
   - Every program is JSON-serialisable: `JSON.parse(JSON.stringify(p))` deep-equals `p`. No functions, `Date` objects, class instances or JSX inside program data. The migration will store programs as Firestore documents.
4. Exits non-zero on any failure and prints one line per check.

Delete the old `checks.js` once `checks.mjs` replaces it, and update every doc that mentions it.

**How to verify.** Run `node prototypes/DonPBL/checks.mjs` and paste the full output. Then break `safeLink` on purpose, show that the suite fails, and revert the change. Paste that output too.

## 4. Correct the claims in the data and docs

These are the specific false or unsupported statements the audit found. Fix each one.

### 4a. "Confirmed by Don"

- `programData.ts:352`, `:358`, `:364` put `CONFIRMED BY DON: ...` inside a field called `ownerVerificationNeeded`, which contradicts itself.
- `programData.ts:42`, `:55`, `:75`, `:85`, `:156`, `:180` set `status: 'verified'` or `'confirmed'` on the schedule, age, hardware and co-pilot configs.
- The README §5 and `checks.js` repeat these claims.

Replace them with a structured field on each config and assumption:

```ts
confirmation: {
  status: 'confirmed' | 'needs_owner_confirmation';
  confirmedBy?: string;   // a person, e.g. "Don"
  confirmedOn?: string;   // ISO date
  source?: string;        // where: "WhatsApp to Platform Lead", "meeting notes 2026-10-05", ...
}
```

Use `'confirmed'` only where you can fill in all three fields from a real record. Everything else is `'needs_owner_confirmation'`. List every item you downgraded in your report, so the Platform Lead can ask Don.

### 4b. AI co-pilot deployment

`COPILOT_DEPLOYMENT_CONFIG` and the README §5.4 say `POST /api/pbl-copilot` is "confirmed and ready for staging deployment". That's false. No backend is deployed, and production deploys are frozen. Change the config to `status: 'not_deployed'`, and say in a note that the frontend falls back to the local mock (`generateMockCopilotReply`). Remove the matching check.

### 4c. Program count and durations

The docs say "5 standardized programs" and list 6. The registry has 7. Durations disagree with the confirmed 12-week, 120-hour term:

| Program | Data says | `PROGRAM_LIST` says |
| :-- | :-- | :-- |
| Biomechanics | `durationWeeks: 14` (`biomechanicsProgram.ts:70`), README "140 contact hours" | "12 Wks / 120h" |
| Storytelling / Genesis | `durationWeeks: 20` (`storytellingProgram.ts:95`), README "200 contact hours", check says "20-week curriculum" | "12 Wks / 120h Core Term" |

Fix it like this:

- Make every program fit one 12-week term (`SCHOOL_SCHEDULE_CONFIG`). If a program really needs longer, model it as two terms with separate phase plans, and make that visible in the data. Don't leave a number that disagrees with the label.
- Stop hand-writing the theme strings in `PROGRAM_LIST`. Derive weeks and hours from the program object, so they can't drift apart again.
- **CleanStream** (`programRegistry.ts`) reuses EcoCool's phases (`phases: SAMPLE_PROGRAM.phases`), so its sessions teach garden canopies instead of stormwater. Either write its own phases or mark it `status: 'stub'` and leave it out of `PROGRAM_LIST`. Don't present it as a complete program.
- Make the README, `HANDOVER_FOR_CHATGPT_AGENT.md` and `AUDIT_REPORT_GPT6.1.md` state the same count and the same list.

### 4d. People who are presented as real

- `Coach Eleanor Vance` is hardcoded as the coach name on every feedback entry, at `ui/PblStudioApp.tsx:129` and six places in `mockFixtures.ts`. In the UI, take the coach name from a prop (`coachName`, and later the signed-in coach). It can only stay in fixtures, clearly marked as a fixture.
- `Mrs. Alvarez` (`programData.ts:626` and the EcoCool stakeholder text) reads as a real community gardener. Wherever the program content shows her to learners, label her as an **example persona**, and tell teachers to replace her with a real local stakeholder.
- Every fixture team, student and coach name must sit in `mockFixtures.ts` under a comment that says the people are invented.

### 4e. Safeguarding for under-13 learners

The programs now cover ages 9–17, and the platform has rules for under-13s that the prototype breaks:

- **No speech-to-text for under-13s.** `passionBlueprintProgram.ts:131` gives the **ages 9–11 primary track** "speech-to-text audio reflections", and `:121` and `:632` recommend speech-to-text dictation in general. Remove speech-to-text from the 9–11 track. Offer tap-to-choose options, drawing, or a teacher scribe instead. For the older tracks, keep it only as a teacher-run option, never a feature that records a child's voice.
- `:101` lists USB microphones and webcams. Note that any recording of learners needs school consent and must not be stored by the platform.
- Don't add any feature that collects a learner's name, photo, voice, location or contact details. Fixtures must stay obviously synthetic.

### 4f. Unsafe or wrong instructions in the README

- **Remove** README §7 Option 2 (`git push https://<GITHUB_PAT>@github.com/...`). Putting a token in a URL leaves it in shell history and in git config. People should use normal `git push` with their credential helper.
- **Remove** the bundle instructions in README §7 Option 1 and `HANDOVER_FOR_CHATGPT_AGENT.md:236`. `donpbl-prototype.bundle` isn't in the branch.
- Fix `integrationNotes.md` §2D. It says coaches can't read `users/{uid}/activityProgress/pbl-<termId>` yet, but `firestore.rules` already lets a coach who shares a class read it. What coaches **cannot** do is *write* to a student's document. Section 5 below follows from that.
- Rewrite `AUDIT_REPORT_GPT6.1.md` §1 so it shows only commands you actually ran in this session, with their real output.

## 5. Make state persistent through a storage interface

**Problem.** Everything lives in React `useState`. Evidence a learner adds, coach scores and feedback all disappear on refresh.

**Fix.** Keep it prototype-only and offline, with no Firebase. Shape it so the migration can swap in Firestore without changing any component:

1. Add `prototypes/DonPBL/store.ts` with this interface:

   ```ts
   interface PblStore {
     loadProject(uid: string, programId: string): Promise<StudentProject | null>;
     saveProject(uid: string, programId: string, project: StudentProject): Promise<void>;
     listCohort(classId: string, programId: string): Promise<StudentProject[]>;
     loadFeedback(uid: string, programId: string): Promise<CoachFeedback[]>;
     addFeedback(uid: string, programId: string, entry: CoachFeedback): Promise<void>;
   }
   ```

2. Implement `createLocalStore()` on `localStorage`. Wrap every read and write in try/catch, and fall back to memory when storage is unavailable, for example in a private window. Seed it from `mockFixtures` on first load. Add a "Reset demo data" button.
3. **Keep coach feedback separate from the student's project.** In the app, the student's project document is writable only by the student, so the coach's scores can't live inside it. Move `coachFeedback` off `StudentProject` into its own records, keyed by student and program. Today `handleUpdateFeedback` in `PblStudioApp.tsx` writes it into the project.
4. Key projects by **program**, not by term: `pbl-<programId>`. Learners in different programs must never share a document.
5. Pass the store into `PblStudioApp` as a prop, so the migration can pass a Firestore-backed store instead.

**How to verify.** In the demo, add an evidence item as a student and a score as a coach, reload the page, and confirm both are still there. Then press reset and confirm both are gone. Add store tests to `checks.mjs` using an in-memory implementation of the same interface.

## 6. Out of scope (don't do these)

- Converting TypeScript to JSX, or restyling with the app's CSS.
- Join codes, enrolment or class assignment.
- Firestore rules, the backend co-pilot endpoint, or any deployment.
- New programs or new simulators.
- Editing `AGENTS.md` or `docs/DonPBL-HANDOVER.md`.

## 7. What to send back

Reply with one report that contains:

1. The output of `git branch --show-current`, `git remote -v` and `git log --oneline origin/main..HEAD`.
2. `git diff --stat origin/main...HEAD`. Everything must be under `prototypes/DonPBL/`, apart from the `AGENTS.md` and `docs/DonPBL-HANDOVER.md` already on the branch.
3. The full output of the esbuild command in §1 and of `node prototypes/DonPBL/checks.mjs`, plus the deliberate-failure run.
4. Screenshots of the demo (student view and teacher view) and the console status after clicking through every program and modal.
5. A table of every item you changed from confirmed or verified to `needs_owner_confirmation`, so the Platform Lead can ask Don.
6. The final program list with weeks, sessions and status for each program.
7. Anything you couldn't fix, and why. Don't hide a failure behind a passing summary.
