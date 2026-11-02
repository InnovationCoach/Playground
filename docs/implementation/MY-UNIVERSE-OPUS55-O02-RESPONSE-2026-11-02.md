# My Universe — O02 response from Opus 5.5

2 November 2026 · Task **O02** (pilot learner experience and coach review) · Author: Opus 5.5 (`claude-opus-5-5`, Claude Code desktop session) · Writer turn: **released** · Next owner: **GPT 6.1** (integration), with requests to Gemini 4 Argon in §6

**Result:** both pilot missions are playable end to end in the existing explorer, in 3D and in text view. They run against a synthetic stand-in for the J02 service through the real HTTP adapter. That covers briefing, evidence, route choice, practice steps, a notebook with accessible alternatives, explicit review and send, the learner's attempt history with return → revise → resubmit, and coach review with reviewed-only outcomes. Production behaviour is unchanged: the published registry is empty, so no pilot task appears in the live app. Nothing was pushed, merged remotely, deployed or published.

## 1. Base, head and checkout

| Item | Value |
|---|---|
| Checkout | `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-frontend` (sole writer for this turn) |
| Branch | `codex/universe-pilot-frontend` |
| Starting HEAD | `e6e80853f6b1746b5e490401531ea5649f483b8c` |
| Cherry-picked | `72c107c` from `/private/tmp/my-universe-pilot-shared-20261102` → local `c16d11a` (GPT's `getTableTemplate`; shared files only) |
| O02 code commit | `ed2d097` — `feat(universe): O02 pilot mission flow, notebook, history and coach review` |
| This document | committed after `ed2d097` (see `git log`) |

Root `HearIsland`, `/private/tmp/my-universe-pilot-20261102`, the shared clone and the broken saved worktrees were not written. Dependencies were installed with `npm ci` from the existing lockfile; `package.json` and `package-lock.json` are unchanged.

## 2. Files

**New**
- `src/features/universe/pilot/universeClient.js`: contract client.
- `src/features/universe/pilot/missionSession.js`: pure work-state model.
- `src/features/universe/pilot/PilotMissionSheet.jsx`: mission UI.
- `src/features/universe/pilot/NotebookParts.jsx`: part editors and the read-only evidence view.
- `src/features/universe/pilot/DatasetView.jsx`: labelled evidence.
- `src/features/universe/pilot/pilot.css`
- `tests/universe-pilot-client.test.js`, `tests/universe-pilot-session.test.js`, `tests/universe-pilot-ui.test.jsx`
- `tests/universe-preview/pilot.html`, `pilot.jsx`: synthetic preview entry.
- `tests/universe-preview/syntheticUniverseService.js`: in-memory stand-in service, preview and tests only.
- `docs/implementation/captures/o02/*.png`: 13 desktop captures.

**Changed**
- `src/features/universe/explore/MyUniverseExplorer.jsx`:
  - new props `missionRegistry`, `missionClient`, `viewerKey` and `initialMission`
  - the access check now uses the contract client
  - the pilot sheet opens from here
  - banner wording when missions exist
- `src/features/universe/explore/explorerModel.js`: `PENDING_POLICY_TEXT`; the requirement text now comes from the service.
- `src/features/universe/missions/MissionList.jsx`, `Workstations.jsx`: pilot registry first; a legacy draft with the same ID is never shown twice.
- `src/features/universe/universeApi.js`: namespace import of `firebase.js`, so preview stubs load. It remains legacy-only.
- `src/features/coach/universe/CoachUniverseSubmissions.jsx`, `coachUniverse.css`: rebuilt on the contract client.
- `tests/coach-universe-submissions.test.jsx`: rewritten for the new component.
- `tests/universe-explorer-model.test.js`, `tests/universe-explorer-ui.test.jsx`: updated for the neutral Boreas wording.

**Not touched:**
- `shared/**` (apart from the cherry-pick)
- `server/**`, `functions/**`, rules and indexes
- `vite.config.js`, `vitest.config.js`, `tests/universe-preview/vitest.config.js` and `vite.config.js`
- `package*.json`
- `public/cosmos/v1/catalog.json`: unchanged, so its hash and catalog version are unchanged.

## 3. Implemented behaviour

**Mission flow**
- **Briefing:** story, role, driving question, scenario and decision, plus a labelled evidence drawer.
- **Route cards:** challenge (n of 5), grade band, planning minutes, step and part counts and help styles appear as separate labels. The copy says age never chooses the route.
- **Separate drafts per route:** each route opens its own exact-identity draft (release, mission, version, route, task and policy). Work never moves between routes.
- **Help style:** Guided or Independent, using `supportPresentation`. Switching keeps every answer and part. Guided opens the route's worked example; Independent keeps it collapsed. Hints appear one at a time, and worked solutions open on request.
- **Practice checks:**
  - They use the shared `checkNumber` and `displayAnswer` on 0.2.0 steps, with declared rounding and a close band.
  - A percent answer is accepted only on the dimensionless CF step.
  - Feedback always says it is practice only.
  - Legacy 0.1.0 content keeps its own formatter in the legacy sheet.
- **Notebook:** parts are bound to each step's `evidencePartIds`, and every accepted format keeps its own content.
  - **Text:** code-point counter and a sentence-starter button.
  - **Table:** layout from `getTableTemplate`. Given cells are read-only, including the three "Not applicable" wind cells. Each input is labelled "row, column".
  - **Choice:** uses `choiceLabels`, with a required reason.
  - **Diagram:** built from vocabulary checkboxes. A relationship is enabled only when both of its places are chosen. Layout is drawn by the app, and an ordered-list equivalent plus a required description sit beside it.
- **Saved tables in another layout:** a different caption, column labels or given cells means the table is kept exactly as sent, never relabelled into the template.
- **Review and send:**
  - lists each part as Ready or Not finished with the reason, plus a "Go to this part" link
  - shows the reflection with a counter (20–2,000 characters)
  - lists every blocker
  - Send is a separate explicit action
  - `reflect` steps never submit
- **Raw versus planning CF:** the weighted-results table has its own "CF raw / planning" row, and the dataset view never shows authored `reference…`, `stress…` or `provision…` answers.
- **Lab link:** hidden (`optionalLab.enabledInAssessedFlow: false`); steps that mention the lab say so.

**Service states and storage**
- Work is memory-only. "Not saved" shows until a save response is confirmed. Autosave runs 1.2 s after a pause, only while the service permits work. "Save now" is also available.
- Draft saves send `expectedRevision`. `DRAFT_CONFLICT` shows both choices: load the account version, or keep this screen's work and save it. Nothing is overwritten silently.
- Saves and sends reuse their idempotency key when the body is unchanged, and use a new key when it changes.
- **Availability:** assessed actions follow the explicit `canStart`, `canResume` and `canSubmit` flags (GPT's semantics); `status` only chooses the wording. Loading, not-connected, unauthenticated, withdrawn, in-review and retired states all keep reading available and pause editing and sending.
- **History:** loading, error (never shown as "no attempts") and loaded states. An open attempt blocks sending.
- **Send outcomes:** `SUBMISSION_ALREADY_OPEN` and withdrawal errors refresh the history and the availability check.
- **Learner history:**
  - exact version, route, task, help style and timestamps
  - prior coach feedback, the sent evidence read-only, and reviewed-only outcome text
  - "Revise and resend" appears only for a returned attempt with an exact identity match and no open attempt. It creates a new attempt with `previousSubmissionId`; the returned attempt is unchanged.
  - other versions and legacy reflection-only attempts are read-only
- **Account or organization change:** the sheet is re-keyed by `viewerKey` and its in-memory work is dropped. Late responses after unmount are ignored. The explorer clears its access result on a viewer change or a failed refresh.
- The `alive` guard is set in effect setup, so React StrictMode's effect replay can't leave it false.

**Service adapter**
- Every request sends `X-Universe-Contract-Version: 1.0.0`, mutations carry `contractVersion` in the body, and `Idempotency-Key` is sent on save, submit and review.
- Results are `loaded`, `error`, `unauthenticated` or `not-connected`.
- A successful body without `contractVersion: "1.0.0"` returns `CONTRACT_VERSION_UNSUPPORTED`. A body missing its endpoint envelope returns `MALFORMED_RESPONSE`, so a list never collapses into an empty list.
- No token means no request.

**Explorer and Boreas**
- Production gets `PUBLISHED_RELEASES` (empty) and a client built on the signed-in user's token, so the live behaviour is unchanged.
- Locked destinations show the service's `requirementText`. Without it, they show the neutral "This expedition is not open yet." The catalog's "Ice and Climate" sample text is never displayed, and no copy says completing a mission unlocks a planet.

**Coach review**
- Tabs: waiting, returned, reviewed. Load failures show an error, never "No mission work is waiting". Paging uses `nextCursor`.
- Each card shows:
  - learner display name, mission, attempt, version, route, task, help style, time and availability
  - earlier feedback, the reflection, and the evidence (tables, choices with labels, the diagram as a list plus its description)
- A return needs a note of 1–1,000 characters; an approval note is optional. Reviews send `expectedSubmissionRevision` with an idempotency key.
- `REVIEW_CONFLICT` shows a message and reloads. The card shows only what the service returned: status, outcome text and audit reference. Own-work review is refused in the UI; the server must enforce it too.

**Fixture isolation:** fixtures are imported only by `tests/universe-preview/pilot.jsx`, the synthetic service and tests. A test walks `src/` and finds no fixture import. The production build contains no fixture data (zero matches for `pilot-fixture-g03` in `dist`).

## 4. Fresh checks (run 2 November 2026 in this checkout)

| Check | Result |
|---|---|
| Universe + pilot suites (scratch include, see §6) — `tests/universe-*.test.js(x)`, coach, Thalassa scenario | **11 files, 79/79 passed** |
| Committed `tests/universe-preview/vitest.config.js` (Gemini-owned include list) | 8 files, 54/54 passed |
| `node --test shared/universe/tests/contracts.test.js` | 23/23 passed |
| Related unit tests (`universe-model`, `hex-grid-model`, `my-dashboard`, `spark-home`) | 4 files, 94/94 passed |
| `npm run build` | passed; `grep pilot-fixture-g03 dist` → 0 files |
| Browser (in-app Chromium pane, 1280×860): explorer 3D overview, text view, wind briefing → route → CF practice (`34%` correct), autosave/save, history | No console errors after the final reload (earlier errors came from an intermediate hot-reload state, since fixed) |
| Keyboard, real key presses | Focus lands on the mission title when the sheet opens; Tab order runs close → Work → Review and send; Space toggles the diagram checkboxes; Escape closes the sheet |

What the new tests cover:
- **Adapter:** paths and headers, `200 {}` and an old contract version, malformed list and envelope cases, 401, network failure and typed 409.
- **Session model:**
  - all five exemplars round-trip byte for byte and validate
  - a same-size relabelled table is preserved
  - the not-applicable cells come from the getter, and the source bytes are untouched
  - blank cells and "__" blanks block completion
  - formats are kept when switching, and diagram edges are pruned
  - each route has its own identity
  - raw numbers and cleared fields round-trip
- **UI:**
  - separate labels and honest status on open
  - numeric checks (more precise, close, percent, invalid)
  - Guided/Independent with the worked example and no lost answers
  - save and restore
  - offline and withdrawn states
  - full return → revise → resubmit → coach approval with a reviewed-only outcome, and another organization hidden from the coach
  - StrictMode
  - account/organization switch with late responses
  - neutral Boreas wording and the hidden lab link
  - the fixture-free `src/` import graph
- **Coach:** organization scope, error versus empty, a required return note, and the review conflict.

## 5. Preview and captures

- **Preview:** `http://127.0.0.1:5195/pilot.html`. It was started from this checkout with `./node_modules/.bin/vite --config tests/universe-preview/vite.config.js --port 5195 --strictPort`, and may have stopped when this session ended; restart it with the same command.
  - The root `.claude/launch.json` has no entry for this checkout, and I didn't write the root.
  - The committed preview config's own port, 5192, is used by another saved entry.
- **Flags:**
  - `as=amira|ben|chen|rivera`, `view=coach`
  - `mode=offline|unavailable|withdrawn`
  - `text=1`, `latency=<ms>`
  - deep link: `open=<missionId>&route=<routeId>&tab=work|review|history&step=<n>`
- **Synthetic people:** Amira, Ben and Chen are learners; Ms Rivera is a coach. Chen is in a different organization with the same class ID as the others, to show isolation. Amira starts with a returned wind attempt; Ben and Chen start with open journey attempts.
- **Captures** (headless Chrome, 1280 px wide), in `docs/implementation/captures/o02/`:
  - `01` explorer overview
  - `02` text view with Boreas pending
  - `03` wind briefing
  - `04` worked example
  - `05` weighted-results table with "Not applicable" cells
  - `06` plan table with the lab hidden
  - `07` journey route diagram
  - `08` review screen, not ready
  - `09` history with a returned attempt
  - `10` offline
  - `11` withdrawn
  - `12` coach queue
  - `13` coach load failure

## 6. Requests to other owners

**Gemini 4 Argon (configuration and service):**
1. Add `tests/universe-pilot-client.test.js`, `tests/universe-pilot-session.test.js` and `tests/universe-pilot-ui.test.jsx` to `tests/universe-preview/vitest.config.js` `include`. I ran them with a scratch config outside the checkout.
2. **Shapes the frontend expects (please confirm or correct):**
   - Availability is `{ contractVersion, availability: { status, canStart, canResume, canSubmit, reasonCode, reason, availabilityRevision, checkedAt } }`. A flat body is also accepted.
   - Draft GET is `{ contractVersion, draft: null | {...} }`.
   - Draft PUT is `{ contractVersion, draft: { draftId, revision, updatedAt } }`.
   - Submit returns the §9.3 record plus `submissionRevision`.
   - Lists are `{ contractVersion, submissions, nextCursor }`.
   - Review returns `{ contractVersion, submissionId, submissionRevision, status, reviewedAt, auditEventId, outcome }`.
   - Access is `{ contractVersion, destinations: { id: { status, evaluatedRule, isVerified, requirementKey, requirementText } } }`.
   - Every 2xx body must carry `contractVersion`.
3. **Query parameters:** availability and draft GET send `releaseId, missionVersion, routeId, taskId, policyVersion` (§5 named the first three; the exact draft tuple in §9.6 needs all five). `/submissions/mine` sends `missionId, limit, cursor`. Access POST sends `{ contractVersion, planetIds }`.
4. **Open question:** should a successful submit clear or supersede that task's server draft? The synthetic service clears it. If it doesn't, the "Revise and resend" flow will show the draft-conflict choice, which is honest but noisy.
5. **CORS:** please allow the `X-Universe-Contract-Version` and `Idempotency-Key` request headers.

**GPT 6.1 (content):**
- The five G03 reference artifacts use revision-1 table layouts that differ from the revision-2 templates (for example "Full-power h" against "Equivalent full-power h"). The UI preserves them exactly as saved tables, but the exemplars don't show the rev-2 template a learner will actually fill in.
- The existing Hex-Grid "Platform design lab" workstation summary (`scenarioInfo`, preview-only, not assessed) still says "powered through the night". It belongs to the separate scenario-version correction.

## 7. Untested and remaining concerns

- **No real service:** J02 isn't integrated, so everything ran against the synthetic stand-in through the real adapter. Contract mismatches with Gemini's actual payloads are possible until integration (§6).
- **No physical devices:** no iPad, phone or touch device. No VoiceOver, TalkBack or Switch Control. No Safari, Firefox or 200% zoom. No 3D frame-rate or memory measurement this turn. Captures and checks are desktop Chromium only.
- **Small layouts:** the mission sheet fills the screen below 820 px through the existing rule, but I didn't check it at phone width.
- **Diagram picture:** labels in the boxes are truncated at about 26 characters, for example "Scenario G — co…". The full text is in the list and the description beside it.
- **Persistent cache:** no school-policy signal exists, so work is memory-only and lost on reload until a server save succeeds, as intended.
- **Dev-time import:** `firebase.js` is still imported by the explorer and coach modules for the production client (as before). Previews alias it to the offline stub.
- **Dist output:** the build wrote `dist/`, which is ignored by git and not committed.

## 8. Reproduce

```bash
cd /Users/admin/Desktop/HearIsland/output/my-universe/pilot-frontend
npm ci
node --test shared/universe/tests/contracts.test.js
npx vitest run --config tests/universe-preview/vitest.config.js
npx vitest run tests/universe-pilot-client.test.js tests/universe-pilot-session.test.js tests/universe-pilot-ui.test.jsx --config <a config whose include lists them>
npm run build
./node_modules/.bin/vite --config tests/universe-preview/vite.config.js --port 5195 --strictPort   # then open /pilot.html
```

Writer turn for `pilot-frontend` is released. No further source writes from Opus until a new turn is assigned.
