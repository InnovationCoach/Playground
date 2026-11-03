# My Universe O04 planet arrival: Opus 5.5 response

3 November 2026 · Opus 5.5 (UI owner) · brief: `MY-UNIVERSE-O04-PLANET-ARRIVAL-2026-11-03.md`, including lead review A–D.

Local commits only. Nothing was pushed, merged or deployed. No server, rules, auth, package, config or fixture bytes were changed. Mani's 5196 preview and its local-service learner draft were not used.

## 1. Branch and commits

- **Checkout:** `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-arrival`
- **Branch:** `codex/universe-planet-arrival`, from `8c847ca`

| Commit | What |
|---|---|
| `6a2edcc` | Cherry-pick of GPT `5795ef0`: `shared/universe/planetArrival.js`, its test, and the brief. Applied unchanged. |
| this commit | O04 UI, 3D equipment, preview entries, tests, this response and `captures/o04/` |

## 2. What the learner sees

### Arrival

- **Entry:** an expedition card lands on the planet's surface first, with no mission sheet over it.
  - Wind → Thalassa.
  - Journey timing → Thalassa (departure station).
  - Mass and power → Ignis.
- **`initialArrival { planetId, missionId, routeId }`** is a new explorer prop.
  - `arrivalNav` checks the catalog destination and `canLand`. Otherwise it stops at the planet, so Boreas shows its access message and never lands.
  - The generic `jump` action is never relied on as an access gate.
- **`initialMission`** stays the explicit technical bypass and wins if both are passed.
- **Normal landing** (the 3D Land button, or the new text-view **Land on …**) starts the same arrival.
- **Lead A, world visible:** the old details dock starts collapsed whenever a learner arrives on a surface with an arrival design. Choosing a site in the card frames that place without reopening the dock, and "Show details" is one press away.
  - At 625×505 the card covers about 30% of the stage (340×197 of 625×360).
  - At 375×600 it covers about 42% (the eyebrow is hidden and the buttons are compact).
  - The opening is just the title, the shared look prompt and three buttons.

### Look around

- **Card:** small and nonmodal, in the top left (full width on phones). Only the card takes pointer input, so camera gestures elsewhere are unaffected.
- **Buttons:** **Ready now**, **Keep exploring**, **Skip setup**.
- **Timing:** the setup invitation appears after 45 seconds of active, visible, ready surface time.
  - **What doesn't count:** landing, loading, a hidden tab, an inactive explorer, or an open mission. The clock restarts from "now" whenever any of these changes, so time from before a pause never counts.
  - **Lead D:** the explorer reads the real `document.visibilityState` when it opens (initial state, plus a sync on mount), so an explorer opened in a tab that is already hidden spends no exploration time until it becomes visible.
  - **What the timer never does:** it doesn't move focus, reopen a postponed card or open a mission.
  - **Keep exploring** collapses the card to a pill ("Set up equipment"), and time won't reopen it.
- **Lead C, quiet timing:** while a card control has focus, the timed change waits, so the focused "Ready now" or "Keep exploring" is never replaced under the learner.
  - The check reads `document.activeElement` at each tick, so a window or tab blur (which fires `blur` but keeps focus) doesn't release it.
  - A click on the 3D world moves focus to the body, so the change then follows without moving focus.

### Place something useful

- **Instruction:** "Place a portable wind sensor" (Thalassa) or "Place a solar meter" (Ignis), with three authored sites.
- **Choosing a site:**
  - **Lead B:** sites are a native radio group (`fieldset` with a hidden "Choose a site" legend), so arrow keys and Space work natively.
  - Choosing a site frames that place and shows a blue ring there.
  - **Place equipment** is enabled once a site is chosen; no dragging is needed.
- **Instruments:** code-built, at catalog location plus authored offset:
  - wind sensor: tripod, cup anemometer that turns only with motion on, and a vane;
  - solar meter: tripod, tilted plate and logger;
  - each on a lime ring, with a small float at the waterline on Thalassa or on the platform deck.
  - The instrument stays visible while exploring, and while a mission is open behind the sheet.
- **After placing:** the card says where it was placed, shows the site's "To think about" prompt (no written response required) and the shared note "Placed for this visit only. Placement collects no readings; the mission uses its supplied data."
- **Move equipment:** reopens the choice while the placed instrument stays put. "Keep it where it is" cancels the move.
- **Keyboard isolation:** keys pressed inside the card stop there, so arrows, +/−, R, D, L and Escape don't reach the explorer's shortcuts. The same keys outside the card still work.

### Offer the mission

- **The card offers:** "Next mission", with **Start mission** and **Explore more** (Explore more collapses the card to a pill).
  - **From an expedition card:** only that mission and route ("Plan a journey to Ignis · Mass and power tradeoffs").
  - **From a general landing:** only missions the trusted registry, or legacy visibility rules, has for that planet. In production (no published release) it says "No missions are open on Thalassa yet."
  - `resolveExpedition` rejects a mission that isn't on that planet, or an unknown route or mission.
- **Start mission** opens the existing O03 sheet with `{ id, route }`. The availability and draft loading are the server's own; there is no step, view or reference example.
- **Skip setup:** reaches the same mission with no penalty.
- **While a mission is open:** the card hides but its state is kept, and closing the mission brings the card back as it was.

### Text fallback

- **Planet list:** "Land on <planet>" appears in a landable planet's details, under the same `canLand` rule.
- **Surface view:** a landed surface replaces the whole-universe list with a one-surface view:
  - the surface name and summary;
  - the same arrival card, in the page flow;
  - **Places to inspect** as buttons, with one place's details at a time;
  - Show the surface in 3D, and Back to <planet> orbit.
- **Scrolling:** one scroll area (`.mx-text`).

### Scope

- **Keying:** visit state is held in memory, keyed by learner/org (`viewerKey`) and planet.
  - A different learner never sees another's visits, even for one render.
  - Any account change clears all visits, so switching back restores nothing.
  - Leaving and landing again in the same session keeps the placement; another planet starts fresh.
  - Unmounting the explorer discards everything.
- **No persistence:** nothing goes to `localStorage` or any server; the arrival state never enters a mission request.
- **No stale updates:** the tick and dispatch guard against a changed owner or planet, and no interval survives leaving the planet, a hidden tab, a postponed card or unmounting.

## 3. Preview (5197, synthetic, in memory)

- `http://127.0.0.1:5197/pilot.html?latency=0&as=amira&view=home`: new **Choose an expedition** cards (Wind, Journey timing, Mass and power) open with `initialArrival`. The old "Enter My Universe" button is a general entry.
- `…/pilot.html?latency=0&as=amira&arrive=wind|journey-guided|journey-advanced` opens a card directly; `&text=1` forces the text view.
- `open=` stays the technical deep link.
- `service.html`: the three home cards now open the planet first (`view: 'arrive'`, `initialArrival`). "Open mission sheet" in Test tools stays the `initialMission` bypass. Not run against the real local service in this round (5196 untouched).

## 4. Tests

**Commands (this checkout):**
```bash
./node_modules/.bin/vitest run --config <scratch config: tests/universe-*.test.js(x), coach, Thalassa>
./node_modules/.bin/vitest run --config tests/universe-preview/vitest.config.js
node --test shared/universe/tests/*.test.js
./node_modules/.bin/vitest run --exclude tests/firestore-rules.test.js --exclude tests/mission-submissions-rules.test.js
npm run build
```

| Suite | Result |
|---|---|
| Universe include (14 files, including the new `tests/universe-arrival-ui.test.jsx`) | **146/146** |
| Committed Universe config (13 files; doesn't include the new file) | 134/134 |
| Shared (including GPT's `planet-arrival.test.js`, 7) | 35/35 |
| Root vitest, excluding the two emulator rules suites | 42 of 43 files, 654 passed, 29 skipped. `sim-economy.test.js` fails to connect: `ECONNREFUSED 127.0.0.1:8088` (no local emulator running); it doesn't touch Universe code. |
| `npm run build` | Passed, `index-jIWCuWHa.js`. 0 files contain FIXTURE_RELEASES, pilot-fixture, REFERENCE_ARTIFACTS, demo-universe-phase1 or syntheticUniverseService. |

**New `tests/universe-arrival-ui.test.jsx` (12 tests):**
- the expedition lands first, places are shown one at a time, and Skip then Start opens the requested route;
- Ignis: solar meter, radio selection frames the place, no new input, advanced route;
- 45-second timer with fake time: hidden-tab pause (no interval held), no focus theft, no mission, Keep exploring holds for 10 minutes, no interval after leaving the planet;
- **D:** opened already hidden (no event), there's no interval and no progress for 135 s; once visible, the invitation arrives only after a further 45 s;
- radio placement, Move, Keep it where it is, and focus on the result heading;
- scope: kept after orbit and re-landing, fresh on another planet, discarded for another learner/org and **not** restored on switching back (this caught a real defect, now fixed);
- general-landing offers from the registry only; production shape offers none;
- the `initialMission` bypass, and a gated planet never lands;
- `resolveExpedition`, `arrivalChoices`, `arrivalNav` and `arrivesOn` rules;
- **C:** a focused control survives a window blur and the 45-second mark, and the change follows when focus moves on, without moving it;
- **A (3D shell):** the dock is collapsed on arrival and stays collapsed after a card site choice;
- **B (3D shell):** Escape, L, arrows, R and D inside the card don't reach the explorer; L outside it does.

Removing each A, B, C or D fix in turn fails its test.

**Not in the committed config:** the new file isn't in `tests/universe-preview/vitest.config.js`, which I don't own. **GPT:** please add `tests/universe-arrival-ui.test.jsx` (and the two auth tests still outstanding from F7.1).

## 5. Browser checks (Claude in-app Chromium, my own tabs at 5197)

- **Real 45-second timer:** the invitation appeared at 47 s after load (45 s plus the landing). Focus stayed on the panel heading and no mission opened.
- **Lead C, real browser:**
  - "Ready now" was focused with the keyboard, and the tab lost window focus while I worked in another tab. At 67 s it was still "Welcome to Thalassa" with focus on "Ready now".
  - This exposed a blur-based hold that released too early; it was replaced by the `activeElement` check.
  - After a real click on the world (focus moves to the body), the invitation followed without moving focus.
- **Hidden-tab pause:** this browser can't truly hide a tab, so `visibilityState` was overridden in the page. After 70 s hidden there was still no invitation.
- **Lead B, real keys:** in Ignis 3D, Space and ArrowDown moved through the native radios and framed the Basalt columns. L and Escape pressed in the card didn't switch views or leave the planet.
- **Text fallback:** at 375 px, a keyboard-only Tab and Enter placement worked (focus order: surface heading → Ready now → card heading → three radios → Place equipment). The wheel scrolls the single `.mx-text` area (0 → 400 of 592) with no sideways overflow.
- **Wheel scrolling:**
  - the card itself at 664 px with the dock open (0 → 74.5 max, Start mission and Explore more in view);
  - the O03 mission sheet after Start mission (0 → 445 max → 0, stage 0).
- **Mission close:** the card returned as "Portable wind sensor placed".
- **Account switch** in the preview controls (Amira → Chen): fresh "Welcome to Thalassa", no placement.

**Captures** (`captures/o04/`):
- `01-625x505-arrival-dock-collapsed.jpg`
- `02-3d-placement-choose-site.jpg` (radios, blue ring at the chosen site)
- `03-3d-placed-mission-offer.jpg` (wind sensor at the weather mast, offer)
- `04-phone-text-ignis-arrival.jpg`
- `05-phone-text-mission-offer.jpg`
- `06-375x600-arrival-dock-collapsed.jpg`

## 6. Limitations and notes for GPT

- **Production bundle:** `planetArrival.js` copy is in the app bundle (presentation only, like `learningDesign.js`). The server never imports it.
- **Phone placement:** at 375×600 the placement card is capped at half the stage and scrolls inside itself, so "Place equipment" is below the three sites and needs a short scroll. A sticky action row was tried and dropped: its wrapped buttons used too much of the card.
- **Card width:** the card is 340 px from 600 to 820 px wide, and full width below 600 px.
- **Not done:** Safari, physical devices and touch hardware, screen readers, and educator review of the arrival copy. The real local-service (`service.html`) arrival path compiled but wasn't driven, to keep 5196 and its draft untouched.

The `pilot-arrival` writer turn is released after this commit.
