# My Universe O03 focus flow: Opus 5.5 response

2 November 2026 · Opus 5.5 (UI owner) · brief: `MY-UNIVERSE-FOCUS-FLOW-2026-11-02.md` (O03 plus lead review R1–R6).

Local commits only. Nothing was pushed, merged or deployed. No server, rules, config, package or fixture bytes were changed, and the Phase 1 closure reports were left as they are.

## 1. Branch and commits

- **Checkout:** `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-frontend`
- **Branch:** `codex/universe-focus-flow`, from `805f75c`

| Commit | What |
|---|---|
| `4d7a2c8` | Cherry-pick of GPT `6e4bf42`: `shared/universe/learningDesign.js`, its test, and the brief. The `package.json` hunk (integration-only scripts not present on this branch) was resolved to this branch's version, because package files are not mine to change. |
| `ab7508e` | O03 focus flow, plus R1–R5 and their tests |
| `0740049` | R6 text-load polish |
| this commit | This response and `captures/o03/` |

## 2. What the learner sees now

### Briefing
- The opening states the situation, then shows **Your role**, **Your decision** and **Goal**, all from the shared design.
- Route cards show the route name, "Challenge N of 5", "Suggested for grades 6–8" or "9–11" (from the design), planning minutes, and the route note. A line underneath says "Grade ranges are suggestions, not limits."
- Authored `gradeBand` values are unchanged. When the design is unavailable, the card falls back to "Grades 6-8" / "Grades 9-12".
- The full story, evidence and sources, model limits, and **science standards (NGSS)** sit behind disclosures.
- The standards list is unique across all routes (R2): MS-ETS1-2 and HS-ETS1-3, each with its scope note and link.

### Work: one action at a time
- **Actions** (`focusFlow.js`, pure): each authored step becomes its practice check (number/choose), then each notebook part it uses.
- **Deferred parts:** the design's `notebookPartIds` can defer a shared part to a later step, but never drops a required part; a guard re-adds it if it would be lost.
  - Wind: 9 steps become 11 actions.
  - Journey timing (guided): 8 steps become 8 actions.
  - Journey mass and power (advanced): 9 steps become 9 actions.
  - Repeated tables are gathered once.
- **The action card** shows an eyebrow ("Try it" / "Your notebook"), the action heading and one action sentence, then exactly one response group:
  - **Practice card (R1/R6):** shows the operation itself (for example "Add the hours from all five wind bands."). The input's own label carries the unit and rounding ("Your answer (h, as a whole number)"); the design's `practiceAction` isn't repeated as a second paragraph.
  - **Notebook card:** shows one part. A part shared by several steps says so once, and nothing gates on finishing it.
- **Optional items, all closed at first** (Guided included): Hints, Worked example, "Reference: what this means", "What your coach reviews" (the authored criterion), "Full task" (the authored prompt), Evidence for this task.
- **Navigation:**
  - Back / Next never check correctness; there are no penalties, timers or streaks.
  - The last action leads to "Review your work".
  - "All steps" (closed) jumps to any step.
- **Focus** moves to the action heading on Next, Back, jump, and the Work/Review tabs.

### Notebook editors in focus mode
- **Table:** one row at a time, showing the given facts beside the cells to fill.
  - Previous row / Next row, with a short polite announcement like "Row 2 of 7: 3 to below 6 m/s" (R5). The caption and the table are not read out.
  - "Show full table" shows the same cells as a full table.
- **Diagram:** in stages: 1. Places, 2. Links, 3. In words. "See the diagram so far" (closed) shows the picture and its text list.
- **Formats:** the format switch (Table or Written; Route diagram or Written) keeps both versions.
- **Starters:** the Guided sentence starter sits behind a closed "See the sentence starter"; "Add sentence starter" works as before (R6).
- **No nagging:** the in-progress reason no longer appears mid-step; the review checklist names what is missing.
- **Labels:** the part's `aria-labelledby` points at its rendered "Notebook · …" label (R5).

### Status, help and closing
- **Status line:** one compact line: "Open" (or the reason it isn't), the save state ("Saved · time" / "Not saved yet" / "Saving…") with Save now, and a small Help: Guided / Independent choice with a closed "What changes?".
- **Alerts:** load-failure and two-version conflict alerts keep their full actions.
- **Close question:** closing with unsaved work asks "Close this mission?" and states the consequence. It is not shown as a permanent banner.
  - **Keep working** (also Escape) returns to the work.
  - **Close without saving** discards it.
  - **Save and close** appears only when the open task is the only unsaved one (R3). It closes only if the exact work on screen was saved and the learner didn't choose Keep working meanwhile (R4: `doSave` returns `latest.current[key] === submitted`).
  - **Naming pending tasks:** when another task (or several) is unsaved, including one whose save is still in flight, the panel names each task. No partial save-and-close is offered.
- **Storage:** nothing is written to `localStorage`.

### Review
- Review shows the route/scenario note, "N of M notebook parts ready", a short checklist with "Go to this part", and the required reflection.
- "See everything you'll send" (closed) shows the full evidence, followed by the same blockers, shared validation and explicit Send.
- **Route labels in the sheet header:**
  - Advanced: "Mass-and-power case: ion duration is a separate 140-day input. Do not use the timing case's 69.4 days."
  - Guided: "Timing case: …"

### Unchanged
Exact identity, policy, evidence formats and required parts, old attempts, save/conflict/account and organization boundaries, reviewed-only outcomes, the legacy read-only coach card, and accepted bundle bytes.

**Wire:** `activeStepId` is always an authored step ID. The in-step position is UI-only, and resume lands on the first action of the saved step. No exact sub-action persistence is claimed.

**Design binding:** `getMissionLearningDesign(mission.id, route.id, mission.version, bundle.bundleContentSha256)`, with all four arguments. If the content hash doesn't match, every screen uses the authored text.

## 3. Tests

**Commands (this checkout, after `0740049`):**
```bash
./node_modules/.bin/vitest run --config <scratch config: tests/universe-*.test.js(x), coach, Thalassa>
./node_modules/.bin/vitest run --config tests/universe-preview/vitest.config.js
node --test shared/universe/tests/*.test.js
./node_modules/.bin/vitest run --exclude tests/firestore-rules.test.js --exclude tests/mission-submissions-rules.test.js
npm run build
```

| Suite | Result |
|---|---|
| Universe include | 13 files, **134/134** (125 before R1–R6) |
| Committed Universe config | 62/62 |
| Shared (including GPT's learning-design test) | 28/28 |
| Root vitest, excluding the two emulator rules suites | 43 files, 683/683 (`sim-economy` passes now that the local emulator on 8088 is running) |
| `npm run build` | Passed, `index-igCyGYHn.js`. 0 matches for fixtures, reference examples, the fixture release ID, or the demo project. |

**New and updated cases in `tests/universe-pilot-ui.test.jsx`** (the "O03 focus flow" block):
- exactly one response group at every one of the 11 wind positions, with no `details[open]`
- practice and notebook kept separate; Back keeps both answers
- focus moves to the action heading on Next and Back
- table one row at a time, then the full table, then the written alternative, keeping both
- diagram stages and the written format
- wire step IDs: saves at step 5's notebook action and step 9's second part send `capacity-factor` and `reflect`, and resume lands at "Step 9 of 9 · part 1 of 2"
- close question: Keep working, Escape, Save and close, and immediate close when nothing is unsaved
- R3: two unsaved routes, the multi-route list, no Save and close, closing from the Routes screen, and a save in flight plus a route switch
- R4: a delayed Save and close, then Keep working, then an edit: no close and the newer text kept. Without the fix this test fails.
- naming a single pending task that isn't the open one
- R1, R2, R5, R6
- clear journey case labels; review checklist first with evidence closed
- falling back to authored text on a hash mismatch

Existing Phase 1 cases were updated only where the brief changed the copy or behaviour:
- the grade label
- the worked example, now closed in Guided
- shorter save and status wording
- the decision coming from the design
- the persistent "kept only until you close it" banner, replaced by the close question

## 4. Browser checks (synthetic preview `localhost:5195/pilot.html`, no Firebase)

**Browser:** Claude desktop in-app browser (Chromium; `Claude/4.4212.0 Chrome/152.0.7977.167`), at 800 px and with 375×812 mobile emulation. At 375 px, `scrollWidth` equalled `innerWidth` on every screen checked.

**Captures** in `docs/implementation/captures/o03/`:
- `01` desktop briefing
- `02` desktop practice card: the operation plus one input label (after R6)
- `03` desktop table one row. This was captured before the mid-step amber reason was removed, so that line still shows.
- `04` phone table row
- `05` phone diagram stage 1
- `06` phone close question with a pending task in another route. Taken before the R4/R6 change that names that task.
- `07` phone review checklist
- `08` desktop notebook part with the closed sentence starter

**Real keyboard check:** a click on Next moved focus to the new action heading ("Weight each band").

## 5. Limitations and notes for GPT
- `learningDesign.js` is now in the production bundle. It is presentation copy bound by content hash, and with `PUBLISHED_RELEASES` empty it is unused there.
- The autosave timer is per open task: switching routes before it fires leaves that task unsaved, and the close question names it. Behaviour is unchanged from Phase 1.
- Not done: physical student devices, Safari, touch hardware, screen readers, and educator review of the new copy. Grade ranges come only from the shared design.

The `pilot-frontend` writer turn is released after this commit.
