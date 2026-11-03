# My Universe — O01 response from Opus 5.5

2 November 2026 · Task **O01** (read-only learner-experience audit) · Author: Opus 5.5 (`claude-opus-5-5`, Claude Code desktop session) · Next owner: **GPT 6.1** (G02 contract), with items routed to Gemini 5.8 and the educator below

**Result:** the explorer, live-safe entry, text view, mission sheet, workstation hook and coach review list are solid foundations to keep. The two pilot missions are not yet playable end to end: the wind survey cannot be submitted to the Go 4 service, the submission UI has no loading/unknown/withdrawn/stale states, Boreas shows a requirement that differs from the rule the server enforces, and two parts of my own earlier work conflict with the atlas's "no night-time reliability claim" rule. No source was changed. The pilot contract was **absent** when this was written, so §10 lists my requirements for it instead of an acceptance.

## 1. What was inspected, and how

| Item | Exact commit | Branch (remote ref) | Role |
|---|---|---|---|
| GitHub `main` | `3e461197f748cb62a6d6dfdabc7541307b41f82b` | `origin/main` | PR #4 merged; confirmed after `git fetch` today |
| Live-safe entry | `44b3abccbefaa59eef964db7875fb89355bc316f` | ancestor of `codex/my-universe-prototype` (`f3dd3fb`) | Source of the live release per the 1 Nov record |
| Frontend Go 4 connect | `96684f9b7e9402f249b3b87ad716f4a75761c6c6` | `feat/universe-frontend-go4-connect` | Contains Go 3 (`3aad149`) and Go 4 (`8eb6bca`) ancestry — confirmed |
| Thalassa workstations | `b35f8b2c2f9eca1697c9b7560126edf44b4b73d4` | `feature/thalassa-workstations` | Diverges from `96684f9`; merge base `f3dd3fb` — confirmed |

**Method:** `git show` and `git archive <commit> <paths> | tar -x` into this session's scratchpad (outside the repository). No checkout, worktree, branch, merge, fetch-into-worktree, install, build or test run. `output/my-universe/source/.git` points to `/private/tmp/.../spark-release/.git/worktrees/source1`, which no longer exists — confirmed; that folder was not used or repaired.

**Not inspected / not verified:** the deployed site or its bundle; any authenticated screen; any iPad, phone or touch device; screen readers; the test suites (not run today — counts below are from commit messages only); the root checkout's uncommitted work.

## 2. The learner flow as it exists today

Live (`44b3abc`): Dashboard slide "Explore My Universe" → lazy `MyUniverseExplorer` with `preview={false}` and `calm` from dashboard prefs → full-screen layer → Universe (Lyra Spiral, Aurora Elliptical) → Galaxy → System (Lyra Prime) → Planet → Land (Thalassa, Ignis) → Surface locations. Gated Boreas reads "Access not connected"; draft missions are hidden ("No reviewed missions yet"). Text view (`L`, or automatic without WebGL 2 / after context loss) carries the same destinations, statuses and facts, with "Show in 3D" jumps. Esc goes back a level; catalog version is pinned per visit with a "newer version" offer on the overview.

Branch additions not live:

- `b35f8b2`: catalog `1.2.0`; locations carry `workstations` (`mission` | `simulation`); weather mast → `thalassa-wind-survey`; research platform → Hex-Grid `thalassa-station` scenario via `onOpenActivity`; `missions/registry.js` replaces the list exported from `spacecraftJourney.js`. Workstations render in both the 3D panel and the text view.
- `96684f9`: `universeApi.js` (access, my submissions, submit, coach list, coach review); `planetAccess()` accepts `serverAccess`; the reflect step becomes "Send to my coach" with Submitted / Approved / Returned states; `CoachUniverseSubmissions.jsx` in the coach host.

## 3. Reusable components and capabilities

| Component (file at commit) | Keep for the pilot | Needs |
|---|---|---|
| `MyUniverseExplorer.jsx` shell, `CameraRig`, staged travel, reduced-motion/Calm, context-loss fallback (`44b3abc`) | Yes — the navigation frame | Merge of the two branches' edits (§9) |
| `ExplorerTextView.jsx` (`b35f8b2`) | Yes — the accessible equivalent of every place | Mission evidence drawer and notebook equivalents |
| `cosmosCatalog.js` validation + version pinning | Yes | Validation for withdrawn/retired missions and per-mission version references |
| `Workstations.jsx` + `registry.js` (`b35f8b2`) | Yes — the entry point for M02 at the weather mast | A server-backed mission status per card |
| `MissionSheet.jsx` dialog, route chooser, stepper, Given list with fact tags, hints/worked solution, `missionModel.js` number/choice checks | Yes — becomes the mission flow | Persistence, artifacts, evidence drawer, support switching that keeps work, submit/revise states (§6) |
| `ReflectionSection` + `universeApi.js` (`96684f9`) | Partially — the request layer is reusable | Distinguish "none" from "could not load"; per-mission placeholder; version binding (§5) |
| `StatusChip`, `FactList`, fact tags (`fictional-world`, `real-science` + source, `method`, `unit-fact`) | Yes | A `synthetic-teaching-set` / dataset label for evidence |
| `environmentKit.jsx`, `ocean-station`, `basalt-fissures` renderers | Yes | Nothing for the pilot; scenery stays illustrative |
| Hex-Grid `ScenarioPanel` / `scenarios.js` Thalassa edition (`b35f8b2`) | Yes, for the daily-balance comparison only | Remove or re-version the night challenge (§4, item 3) |
| `CoachUniverseSubmissions.jsx` (`96684f9`) | Yes — base for coach feedback | Error vs empty, mission/version/route display, artifact view |

## 4. Findings

| # | Finding (file at commit) | Effect on the pilot | Owner |
|---|---|---|---|
| 1 | Server registry `server/lib/universe/missions.js` (`96684f9`) lists only `spacecraft-journey`. | Submitting `thalassa-wind-survey` returns 404 "not found in registry". M02 cannot reach coach review. | Gemini |
| 2 | Server unlocks Boreas with `mission-approved: spacecraft-journey`; catalog `1.2.0` `requirementText` says "an Ice and Climate mission". With `96684f9` connected, a locked Boreas shows the Ice and Climate text while a journey approval opens it. | Learners see a requirement that is not the enforced rule. Approval would also only make Boreas "Charted" (no `environmentId`), so the "unlock" changes a chip and nothing else. | Mani + educator decide policy; GPT records it; Gemini + Opus align |
| 3 | Wind survey step `use-it` (`b35f8b2`, version `0.1.0-draft`) asks "Does wind help the station through the night?"; its hint says turbines run around the clock. Hex-Grid Thalassa challenge `night` checks `nightCoverage >= 100`. | Conflicts with the atlas rule that a daily model cannot support a night-time reliability claim. Both are my earlier work. | GPT + educator decide wording; changed content ships as a new version, `0.1.0-draft` stays intact |
| 4 | `ReflectionSection` treats a failed `getMySubmissions()` as "no submission" and shows "Send to my coach". | After a network blip a learner with an open submission is offered Send and gets a 409. No loading state before the list arrives. | Opus (UI); Gemini to return a distinguishable error |
| 5 | Reflection placeholder is hard-coded to "propulsion, transit duration, and food payload". | Wrong prompt in the wind survey. | Opus |
| 6 | Submitted copy says the coach will "unlock gated destinations". | Promises an outcome the policy has not decided (item 2). | Opus, after G02 |
| 7 | Step answers, hints and calculations live only in the sheet; closing it forgets them. Only the final reflection text is submitted. | The atlas artifacts (weighted table, graph or explanation, plan comparison, journey diagram, criteria table, contingency) cannot be submitted or recovered. | GPT defines artifacts; Gemini stores; Opus builds notebook |
| 8 | `submitMissionReflection` sends `mission.version \|\| '0.1.0-draft'` and the client picks the first submission matching `missionId` only. | No binding to a version/route the learner actually used; no visible history of revisions. | GPT contract; Opus |
| 9 | Server open-submission check is a query then `set`, not a transaction; `orgId` falls back to `'org-welearn'`. | Double-clicks or retries can create two open submissions; wrong-org isolation can't be trusted on missing data. | Gemini (J02) |
| 10 | Access check runs on mount and whenever a mission is opened, also in previews; when it fails it keeps the previous `serverAccess`. No "checking" state. | A preview can show real server results mixed with fixture labels; a stale "Available" can persist after a later failure. | Opus |
| 11 | Coach list: `getCoachSubmissions` returns `[]` on failure, so an error reads "No submitted mission submissions". The card shows reflection text only. | A coach can't tell a failure from an empty queue, or which mission version/route they are judging. | Opus (UI); Gemini (error shape, fields) |
| 12 | Live dashboard copy (`44b3abc`): "an ocean world you can land on … nothing is saved and nothing unlocks". | Already one world short today; becomes false once submissions connect. | Opus, at the release that connects Go 4 |
| 13 | Drafts are rejected by the server outside the emulator (409). | Correct, but the pilot needs a reviewed version before any non-emulator demonstration; UI must show "not open for submission yet" rather than an error. | Educator review → GPT → Gemini registry |

The original wind sequence is intact at `b35f8b2`: total hours (168) → full-power hours (Σ hours × output = 56.5) → capacity factor (56.5 ÷ 168 ≈ 0.34) → why averaging speed fails (power ∝ v³) → use the result. The storyboard below keeps those five steps in that order and adds new material only around them.

## 5. Proposed two-mission storyboard (for G02/G03 review — not implemented)

Both missions use the same frame: **Arrive → Briefing → Expected artifact → Support choice → Investigate (steps + evidence drawer + notebook) → Decide → Submit → Feedback → Revise/resubmit → Outcome.** Every frame has a text-view equivalent in the same `MissionSheet`, which already opens identically from 3D and text.

### M02 · Thalassa Wind Survey (`thalassa-wind-survey`)

| # | 3D / panel | Text-view and keyboard equivalent | Content version |
|---|---|---|---|
| 1 Arrive | Land on Thalassa, select the weather mast; workstation card "Mission · Is the wind worth it?" with its status chip from the service | Thalassa details → Surface → Weather mast → same card | existing |
| 2 Briefing | Driving question, fictional-world banner, expected artifact listed before starting | Same sheet | wording from G03 |
| 3 Evidence check (prelude) | Evidence drawer: wind-band table labelled "synthetic teaching set", units, 168 h coverage, measurement note; learner records one quality note | Same drawer as a table with caption | **new version** |
| 4 Support choice | Guided / Independent; switching keeps entered work | Radio group | Guided = existing `guided` key retained |
| 5–9 Core | The five original steps, unchanged order and answers | Same | `0.1.0-draft` sequence |
| 10 Apply | Open Platform design lab (Hex-Grid Thalassa scenario) with the capacity factor; compare two supplied daily plans against given criteria | "Open simulation" button; plan comparison also offered as a table so the decision does not need the simulation | **new version**; no night claim |
| 11 Decide and communicate | Notebook artifact: weighted table (auto-filled from steps), graph or written explanation, plan choice or "need more evidence", data-quality note, next-measurement request | Same, fully keyboard/text | **new version** |
| 12 Submit | "Send to my coach" with the artifact; status from server | Same | — |
| 13 Feedback and revise | Coach note shown inline; returned → edit and resubmit; history visible | Same | — |
| 14 Outcome | Whatever the service returns (reviewed, or an authored next suggestion); no XP | Same | policy from G02 |

### M04 · Plan a Journey to Ignis (`spacecraft-journey`)

| # | 3D / panel | Text-view equivalent | Content version |
|---|---|---|---|
| 1 Arrive | "Missions here" on Thalassa or Ignis (existing) | Planet details → Missions | existing |
| 2 Briefing | Driving question; the two mission concepts; expected artifact | Same | G03 |
| 3 Route | `guided` (challenge 2) / `advanced` kept as keys; advanced labelled with its own reviewed demand | Same | keys kept |
| 4 Investigate | Existing steps (compare engines → seconds → days → food; or propellant ×2 → supplies → panels) with fact tags and limitations | Same | `0.1.0-draft` |
| 5 Build artifact | Journey diagram (drag-free: choose legs from lists; diagram drawn from choices), criteria/constraint table, recommendation with one contingency | Diagram rendered as an ordered list + table | **new version** |
| 6–8 Submit, feedback, revise, outcome | As M02 | As M02 | — |

Essential actions in both work without free camera, sound, fine dragging or colour alone; the 3D scene is a way in, never the only way through.

## 6. Missing interaction and service states

| State | Today | Needed (frontend) | Needs from service |
|---|---|---|---|
| Loading mission status | none | "Checking your submissions…" | — |
| Status unknown (request failed) | shown as "never submitted" | "Couldn't reach your coach's list. Your work is kept. Try again." Send disabled | distinguishable error (not `[]`) |
| Access checking / not connected | no checking state; stale result kept | "Checking access…"; on failure revert to "Access not connected" | — |
| Not open for submission (draft) | server 409 as error text | "This mission is in review and can't be sent yet" | reason code |
| Draft saved / recovered | none | notebook autosave indicator; "Recovered your work from <time>" | learner draft storage (J02) |
| Submitting / retry | button text only | idempotent retry with the same key; no double send | idempotency key |
| Submitted, returned, approved | yes | plus revision history and which version/route | history fields |
| Withdrawn mission | none | "Paused: <reason>. Your work is kept." Start/resume/submit blocked | withdrawal status on start, resume, submit |
| Stale version | none | "This mission was updated. Your submission stays on version X." / choose to continue or copy forward | `missionVersion` policy |
| Policy changed for an outcome | none | explain earlier grants are kept | migration policy |
| Signed out / wrong role | thrown message | "Sign in as a learner to send this" | 401/403 codes |
| Offline | none | keep work locally, require fresh status before submit | — |
| Coach: load failed vs empty | same text | separate error banner | error shape |

## 7. Accessibility and text equivalents still missing

- Evidence drawer, notebook and artifacts have no implementation in either view yet.
- Wind-band table and any graph need a captioned data table equivalent; graph optional where a written explanation is chosen.
- Journey diagram must be built from selections (no fine drag) and readable as an ordered list.
- Status changes (submitted, returned, approved) need `role="status"` announcements — present in `96684f9`; withdrawal/stale need the same.
- Coach tab list uses `role="tab"` without `tabpanel`/arrow-key handling — fix in O04.
- Not checked with VoiceOver, Switch Control or a physical keyboard on iPad.

## 8. Device measurements still missing

Only Apple M5 (macOS, Retina 2×) results exist, from 1 November commit notes: 60 fps at every level; Ignis surface 39 draw calls, about 72k triangles. Not re-measured today. Missing: Mani's named school iPad and phone (model, OS, browser); cold load to first paint of the overview; memory after landing on both surfaces and returning; frame rate during travel and on the surface in High and Standard detail; mission sheet open/close and Hex-Grid launch time; behaviour on context loss and rotation; reduced-motion and Calm on device. The **device and the person measuring are still undecided**.

## 9. Conflicts

- **Branch conflict:** `96684f9` and `b35f8b2` both edit `MyUniverseExplorer.jsx` (imports, `ExplorerShell` signature and `opts`, panel props) and `explorer.css`. `b35f8b2` moves `MISSIONS` into `registry.js`; `96684f9` still imports it from `spacecraftJourney.js` indirectly. Resolution is mechanical but must be done once, by one writer, in the base GPT selects (G01).
- **Policy conflict:** Boreas requirement text vs server rule (item 2).
- **Content conflict:** night-time claims in the wind step and the Hex-Grid night challenge (item 3).
- **Copy conflict:** live dashboard text vs connected behaviour (item 12).

## 10. Pilot contract review

`MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` was **not present** in `docs/implementation/` at the time of writing. I have not reviewed it and do not accept it in advance. My frontend requirements for it:

1. Mission identity: `missionId`, immutable `version`, `routeId` (keep `guided`/`advanced`), and the submission bound to all three.
2. Artifact schema per mission: typed parts (table, choice, text, diagram-from-selections) with size limits, so the notebook and coach view render the same structure.
3. Learner draft save/recover endpoint separate from submission, with `updatedAt` for "recovered" messaging.
4. Submission status enum including `withdrawn` and history; a reason code for every non-2xx (draft-closed, already-open, stale-version, withdrawn, not-signed-in, wrong-role, wrong-org).
5. Idempotency key on submit and review.
6. Mission availability endpoint (or field in access): `open | in-review | withdrawn | retired`, with a learner-safe reason, checked at start, resume and submit.
7. Access response keeps `status`, `evaluatedRule`, `isVerified`, plus a learner-facing requirement key so the shown text is the enforced rule.
8. Outcome payload: what the approval actually does (reviewed only, or a named grant), so the UI never infers an unlock.
9. Errors are distinguishable from empty lists on every read.
10. Challenge demand per route and support variant as separate fields from grade band; planet range computed only from published routes.

## 11. Next owners

| Item | Owner |
|---|---|
| G02 contract incorporating §10; Boreas policy proposal; night-claim wording for M02 and Hex-Grid | GPT 6.1 |
| Add `thalassa-wind-survey` to the server registry; transactional open-submission check; error shapes; orgId fallback | Gemini 5.8 (J02) |
| Science/curriculum review of both missions and the night-time issue | Named educator (not yet named) |
| Choose base and merge order of `96684f9` and `b35f8b2`; name test device and measurer | GPT 6.1 (G01) and Mani |
| O02 implementation of §5–§7 after G02 and an assigned writer turn | Opus 5.5 |

Changed in this pass: this file only.

---

## 12. Review of the pilot contract, revision 0.1.0-proposed — 2 November 2026

**Decision: accepted with changes.** The contract covers all ten requirements in §10 and resolves findings 2, 4, 6, 8, 10 and 13 in §4. It is feasible on the existing explorer, `MissionSheet`, `Workstations`/`registry.js`, text view and coach list without a new renderer or dependency. **Four changes block O02** (12.2); the rest can land in a 0.1.1 revision or in G03 (12.3). This is a frontend review only; it is not an educator approval, a release decision or a claim that anything is implemented.

**Reviewed:** `docs/implementation/MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md`, 251 lines, file time 2 Nov 09:40, author GPT/Codex, revision `0.1.0-proposed`. Checked against the same commits as §1 (`96684f9`, `b35f8b2`, `44b3abc`) by `git show`. Also read for consistency: `MY-UNIVERSE-G01-BASELINE-2026-11-02.md` and `MY-UNIVERSE-GEMINI-J01-RESPONSE-2026-11-02.md` (Gemini 4 Argon, selected by Mani). Model for this review: Opus 5.5 (`claude-opus-5-5`). No source edits, tests, builds or device checks.

**Verified in source:** the wind numbers (168 h, 56.5 full-power h, 56.5 ÷ 168 ≈ 0.33631) match `thalassaWindSurvey.js` at `b35f8b2`. The journey inconsistency is real: guided uses 72,000,000 km at 12 km/s = 6,000,000 s ≈ 69.4 days for the ion drive, while advanced hard-codes `tripDaysIon: 140`.

### 12.1 By section

| Section | Decision | Frontend note |
|---|---|---|
| §1 Decisions and scope | **Accept** | Review-only outcome, Boreas unresolved, `0.1.0-draft` intact and `0.2.0-draft` for revisions all match O01. |
| §2 Mission metadata and routes | **Accept with change C1** | `routeId` stays the task identity and `supportMode` is separate: workable. The current route labels "Guided route" / "Advanced route" will collide with the new Guided/Independent support choice (C1). |
| §2 Wind no-night wording | **Accept** | The new application prompt and the replacement hint are fine. Hex-Grid handling in C8. |
| §2 Journey 69.4 vs 140 days | **Accept** | GPT reconciles in `0.2.0-draft`; UI shows each route's values as its own scenario assumptions. |
| §3 Typed notebook and artifacts | **Accept with blocking change B1, and C2** | All five part kinds render with accessible equivalents; diagram-from-selections fits 12 nodes / 20 edges. Required-part rules cannot yet express "diagram **or** its descriptive equivalent". |
| §4 States, identity, outcomes | **Accept with blocking change B2** | Availability fields map one-to-one to the §6 state table. Offline/401 recovery ("keep local recovery") needs a local storage policy that does not exist yet. |
| §5 API and compatibility | **Accept with blocking changes B3, B4, and C3–C5** | Endpoints, `contractVersion`, idempotency and access fields are implementable. The coach queue item shape and the client's source of `releaseId` are undefined. |
| §6 Errors and concurrency | **Accept** | `loading|loaded|error` lists, typed `not-connected`, no Send from unknown status: exactly what O02 needs. C4 adds one field. |
| §7 Release and migration | **Accept with C6** | Legacy reflection-only submissions as read-only history: agreed. Capability declaration needs a named place (C6). |
| §8 Acceptance cases | **Accept with C7** | Add account switch on a shared device. |

### 12.2 Blocking changes (needed before O02 starts)

- **B1 — Alternative required parts (§3).** Mission definitions list "required part IDs and kinds", but the journey needs "diagram **or** descriptive route" and §3 prefers one composite artifact. Add a `requiredParts` structure with groups, e.g. `[{ partId: 'route', anyOfKinds: ['diagram', 'text'] }]`, validated identically by UI and server. Otherwise either the UI forces a diagram (an accessibility failure) or the server rejects the text equivalent. Owner: GPT (schema), Gemini 4 Argon (server validation).
- **B2 — Local draft cache policy (§4, §6 401/413, offline).** Today the mission sheet keeps nothing locally and a test asserts `localStorage` is untouched. "Keep local recovery" on shared classroom devices needs a rule: proposed **per-uid key, schema-versioned, bounded to the 64 KiB draft budget, cleared on sign-out and on account switch, never shown to or sent for another account, and never treated as submitted**. Or state explicitly that the pilot keeps unsaved work in memory only and loses it on reload. Owner: GPT decides, Gemini 4 Argon checks it against shared-device rules (GEMINI BACKEND §3.2), Opus implements.
- **B3 — Coach queue item shape (§5).** The contract defines the review request and result but not what a coach sees. Needed per item: `submissionId`, `submissionRevision`, `previousSubmissionId`, mission title, `missionVersion`, `routeId`, `taskId`, `supportMode`, `createdAt`, the immutable `evidence[]` snapshot, `reflection`, the prior coach note when it is a resubmission, current availability, and an org-scoped learner display name. Without it the coach UI cannot show the exact work being judged (finding 11). Owner: GPT + Gemini 4 Argon.
- **B4 — Where the client gets `releaseId` and the bundle (§1, §7).** Mission content is compiled into the JS bundle today (`spacecraftJourney.js`, `thalassaWindSurvey.js`); the client only knows `catalogVersion`. Proposal: the reviewed bundle and release manifest live under **`shared/universe/`** at the repository root as pure ESM + JSON with no runtime dependencies; Vite imports it for the frontend (repo root is already the Vite root), and the Go 3 esbuild bundle includes it for the server, so both read the same bytes. Preview fixture releases live beside it with a `pilot-fixture-` prefix and are excluded from production builds. Gemini 4 Argon confirms the functions bundle and vitest include paths; until then Opus will not add files there. Owner: Gemini 4 Argon (packaging), GPT (manifest), Opus (wiring).

### 12.3 Other requested changes (non-blocking)

- **C1 — Route display names.** Keep IDs `guided`/`advanced`, but rename learner-facing route names in `0.2.0-draft` (e.g. "Journey timing" and "Mass and power trade-off") and show challenge level, grade band and support choice as three separate labels. "Guided route" + "Independent support" would confuse learners.
- **C2 — Raw numeric input.** Store a number answer as the bounded raw string the learner typed (max 64 characters) plus the parsed value or `null`. `missionModel.js` accepts input such as "19,070" and "41.7 days"; storing only numbers loses unparsed work.
- **C3 — `supportMode` on submissions.** Add it to the submission payload and history so a coach knows which support was used. Context only, never a grade input.
- **C4 — `SUBMISSION_ALREADY_OPEN` returns the open `submissionId`** so the UI can show the open attempt instead of an error after a reload with a new idempotency key.
- **C5 — Batch availability.** One call per workstation card is fine for two missions; plan a batch form (`missionIds[]`) before more workstations exist.
- **C6 — Capability declaration.** The frontend exports one capability record (`sceneKinds: ['ocean-station', 'basalt-fissures']`, `workstationKinds: ['mission', 'simulation']`, `artifactPartKinds`, `contractVersion`) that the release manifest is checked against. Location follows B4.
- **C7 — Acceptance case:** account switch on a shared device leaves no draft, status or access result from the previous learner visible.
- **C8 — Hex-Grid night challenge.** Proposed for GPT/educator decision: the Thalassa scenario's `night` and `all` challenges move out of the mission-linked path in a new scenario version, or are retitled as a daily-model energy balance with an on-screen "not hourly reliability" caption. The default Hex-Grid project and save keys stay unchanged.
- **C9 — Catalog text for Boreas.** Catalog `1.2.0` still carries the "Ice and Climate" sample `requirementText`. In a later catalog version Opus replaces it with neutral wording, and the UI shows only the server's `requirementText` when the service answers.
- **C10 — Offline/unknown reading.** Clarify that while availability is `unknown` the learner may still read the briefing, evidence and their own local notes; only start, resume of assessed steps and submit are blocked.

### 12.4 What O02 changes in the existing frontend under this contract

These are plans for O02, not work done: submission moves from the final `reflect` step to its own Submit stage after the notebook; `universeApi.js` returns discriminated results (`loading|loaded|error`, typed `not-connected`), matching Gemini 4 Argon's J01 correction; access clears to checking/not-connected on failed refresh; submitted copy says "reviewed" and never "unlock"; the coach list separates error from empty and shows the B3 fields. The live dashboard copy (finding 12) changes in the release that connects the service.

### 12.5 Next owners

| Item | Owner |
|---|---|
| B1, B4 manifest, C1–C3, C7, C10; 0.1.1 revision | GPT 6.1 |
| B1 server validation, B3 fields, B4 packaging, C4, C5; contract review from the backend side | Gemini 4 Argon |
| B2 decision | GPT 6.1 with Gemini 4 Argon; Mani if it touches shared-device policy |
| C8 wording and the journey reconciliation | GPT 6.1 + named educator |
| O02 implementation once B1–B4 are settled and a writer turn is assigned | Opus 5.5 |

Changed in this pass: this file only (§12 appended).

---

## 13. Final confirmation of contract revision 0.1.1 — 2 November 2026

**Decision: ACCEPT.** Revision 0.1.1 resolves all four blockers (B1–B4) and all ten requested changes (C1–C10) from §12. No blocker remains for the first deliverable. This is a technical confirmation of the contract only. It does not authorize O02 source work, a branch, a merge, a deployment or a publication, and it is not an educator approval.

**Reviewed:** `MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` revision **0.1.1** (347 lines, file time 2 Nov 10:06), especially §9, and `MY-UNIVERSE-G02-REVIEW-2026-11-02.md` (49 lines, file time 2 Nov 10:06). Model: Opus 5.5 (`claude-opus-5-5`). Read-only; no source, tests, builds or devices.

| Item | Where resolved | Check |
|---|---|---|
| B1 alternative parts | §9.1 `requiredParts[].anyOfKinds`, unique IDs, one shared pure validator | Journey `route-plan` accepts `diagram` or `text`. Resolved. |
| B2 local cache | §9.2 | Bounded: 64 KiB per draft, six drafts per profile, schema-versioned `welearn.universe.draft.v1:` keys per account/organization/task. **Purged on sign-out, account switch and organization switch**; old in-flight responses ignored; nothing loads before auth/context resolves. **Memory-only** where school/shared-device policy forbids persistence, and always for anonymous, unauthenticated and preview sessions. No silent eviction. Live explorer keeps its no-localStorage safeguard. Resolved. |
| B3 queue and history fields | §9.3 | Every field I requested is defined, plus `attemptNumber`, `missionContentHash`, `policyVersion`, `legacyFormat` and `no-store` caching. Previous feedback bound to the learner's actual previous attempt. Resolved. |
| B4 bundle and release identity | §9.4 | Root `shared/universe/` accepted by both owners; each build imports one explicit manifest; fixtures kept out of the production import graph by entry point, not prefix. Builds still to be proven in J02, as the contract says. Resolved for the contract. |
| C1 route names | §9.1 | "Wind energy estimate", "Journey timing", "Mass and power tradeoffs"; IDs kept; support, challenge and grade shown separately. |
| C2 raw input | §9.1, G02 correction 1 | `rawText` **0–64** characters, so a cleared field saves with `value: null`; the server parses it again. |
| C3 support mode | §9.1, §9.3 | In draft, submission and history; context only. |
| C4 open submission ID | §9.5 | `error.details.openSubmissionId`, authorized caller only. |
| C5 batch availability | §9.5 | Future batch endpoint (25 tuples); a single GET is enough for the pilot. |
| C6 capabilities | §9.4 | `capabilities.json` with `sceneKinds`, `workstationKinds`, artifact kinds and `artifactReferenceEnabled: false`; I check it against compiled renderers in O02. |
| C7 account switch | §9.2, §9.7 | Account/organization switch and late responses are in acceptance. |
| C8 Hex-Grid night | §9.7 | `night` and dependent `all` leave the mission-linked scenario in a new version; default project and save keys unchanged. |
| C9 Boreas wording | §9.7 | Neutral pending-policy text in a later catalog; service text follows the enforced rule. |
| C10 offline reading | §9.7 | Briefing, evidence and own notes stay readable; only assessed start/resume/submit pause. |

**Two notes for O02, not blockers:**

1. **Cache-policy signal.** §9.2 depends on "existing school/shared-device policy", but the frontend has no field that reports it. Until GPT/Gemini define one, O02 will treat a missing signal as **memory-only** and label unsaved work honestly, which is the safe reading of §9.2.
2. **Wind required parts.** §9.1 names the wind rules (weighted results, comparison, limitations) but gives exact part IDs only for the journey. O02 needs the wind `requiredParts` list from the G03 pack before building the wind notebook.

**Still open (human or future evidence, as the contract states):** educator/curriculum reviewer and task ratings; Boreas's final rule; whether the pilot school allows a device cache; test device and person measuring; Vite/Vitest/Functions build proof of `shared/universe/` in J02; an assigned O02 writer turn and base.

**Next owner:** GPT 6.1, to record this confirmation in the G02 review and assign G03 / O02 / J02 when Mani authorizes implementation.

Changed in this pass: this file only (§13 appended).
