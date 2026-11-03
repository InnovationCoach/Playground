# O04 — explore, place equipment, then choose the mission

Mani asks: when a learner enters a planet, allow about **40–60 seconds of exploration first**, then invite them to place equipment or a useful feature before opening the mission. GPT interprets this as **45 seconds of active, visible exploration**, with **Ready now**, **Keep exploring** and an accessible way to skip setup. No forced countdown or automatic modal interruption.

## Ownership / isolated implementation

Opus owns UI/scenes/UI tests in the newly prepared checkout:

`/Users/admin/Desktop/HearIsland/output/my-universe/pilot-arrival`

Branch `codex/universe-planet-arrival`, base `8c847caa2c194c0c85d254a358b5f41559cf5a2f`. It contains the accepted O03, overlay and scroll fixes. `node_modules` points at the identical locked dependencies in integration: **do not install/update dependencies**. Start your independent preview on **5197**, not 5195 or 5196. Do not edit either existing runtime checkout. GPT owns shared arrival definitions/model in integration and will send an immutable commit for you to cherry-pick. No backend/rules/auth changes are needed or assigned.

Keep Mani's current 5196 preview stable: do not change it, reload their tab, or test with writes to its real-service learner draft. Use your separate 5197 `pilot.html` synthetic in-memory preview for interactive tests. Read-only service launch/draft restore is fine; never load a reference example over existing learner work. Nothing is pushed/deployed.

## Experience to build

1. **Arrive on an accessible surface.** Normal landing or a learner expedition card opens the world first, with no mission sheet covering it. Wind → Thalassa, journey timing → Thalassa (departure station), mass/power → Ignis (solar-meter observation at the destination). Respect `canLand`, failed environment loads and gated Boreas; no new access authority. Preserve existing `initialMission` as an explicit technical/deep-link bypass for legacy tests and draft/device checks. Add an `initialArrival` path for the normal learner cards, carrying `{ planetId, missionId, routeId }`.
2. **Look around.** A small, nonmodal card: “Welcome to Thalassa. Look around and notice what changes from place to place.” The 3D world stays usable; no wall of text. About 45 seconds of **active visible** surface exploration (pause while hidden/inactive, during landing/loading or while a mission is open) makes the placement invitation available. Timer must not reopen a dismissed prompt, steal focus, or auto-open a mission. “Ready now” offers the setup immediately. “Keep exploring” postpones it; the setup stays discoverable.
3. **Place something useful.** One compact instruction, e.g. “Place a portable wind sensor” on Thalassa; “Place a solar meter” on Ignis. Three authored sites, selected by tap/click or keyboard buttons, then explicit **Place equipment**. No precision dragging requirement. Show a simple code-built 3D instrument/marker at the selected site's location (existing catalog positions); keep it visible while exploring. Provide the same choice/result in text view. “Move equipment” lets the learner change their mind. A brief explanation can ask what they would investigate there, but do not create a new required written response.
4. **Offer the mission.** After placement, show a small card with the next mission title and **Start mission**, plus **Explore more**. The learner chooses when the existing O03 mission sheet opens. Keep the requested route when entering from an expedition card. A learner may skip the placement step and reach the same mission with no penalty. For a general landing with no preselected mission, offer only missions actually present for that planet in the supplied trusted registry/legacy visibility rules. No invented published mission.

Placement is **a plan, not a measurement**. It does not produce wind/solar readings, alter the accepted mission dataset, change a task identity or assessment, grant mastery/XP/unlocks, or persist to any server/localStorage. Say briefly: “Placed for this visit. The mission uses its supplied data.” Do not present a fictional placement as human observation or a validated engineering site. Local visit state must be keyed to the current learner/org and planet, and discarded on sign-out/account change or leaving the session.

## Integration shape

GPT will supply `shared/universe/planetArrival.js` with:

```js
ARRIVAL_EXPLORATION_MS // 45000
getPlanetArrivalDesign(planetId) // null for unsupported planets
// { planetId, environmentId, title, lookPrompt, equipment:
//   { id, name, purpose }, sites: [{ id, locationId, name, prompt, offset }],
//   placementNote }
createArrivalState() // { phase:'exploring', elapsedMs:0, siteId:null, placedSiteId:null, postponed:false, skipped:false }
advanceArrival(state, deltaMs, { active, visible, ready, missionOpen })
// pure; eligibility only changes phase from exploring to placing at >=45000
reduceArrival(state, action, design)
// ready-now, keep-exploring, select-site {siteId}, place, move, skip-setup
// phases exploring / placing / ready; unknown/invalid actions leave state unchanged
```

The UI owns timers, focus, scoped visit resets and selecting/opening an actual mission. Use the definitions’ location IDs against the loaded catalog; do not change/hash-mutate the accepted catalog or bundle. Keep the shared module out of the server production import graph. Start layout work with a fallback/local stub until the commit arrives; replace the stub before final validation.

## Accessibility and correctness

- Make the introduction usable in the text fallback: there must be an explicit way to enter a planet/surface without WebGL. Surface facts/locations can be explored one at a time. Do not make the fallback a giant list of all planets while claiming the learner entered one.
- Keep a single scrollable region where needed; preserve the O03 scroll fix and avoid another fixed debug card blocking controls. The orientation card must not capture camera gestures outside itself. Optional reduced-motion behavior remains available.
- Scoped time/placement must not leak across accounts or planets. No timer after leaving the planet, closing/unmounting, or switching account. Guard stale callbacks.
- Do not turn a 45-second suggestion into a correctness/access gate. Same mission, same evidence requirements and same feedback with Ready now or Skip setup.
- Existing server availability/draft loading remains authoritative when a mission opens. Reviewed-only policy and pending Boreas are unchanged.

## Deliverable

Implement UI and code-native equipment visuals; add meaningful timer/arrival/placement/navigation/scope tests and keep prior tests valid or deliberately adapt changed normal-entry expectations. Test **real wheel scrolling** and keyboard placement, including text fallback, hidden-tab pause, leaving/reentering and account switch. Run the supported Universe suite, shared tests and build. Use the local 5197 preview with a new `arrival` entry/switch if needed so the normal home cards demonstrate the flow. Capture arrival/exploration, placement and mission offer. Write `MY-UNIVERSE-OPUS55-O04-RESPONSE-2026-11-03.md`, commit owned source/tests/evidence, and release the new checkout. Report exact commits, results, limitations and preview URL.

Model semantics: Keep exploring sets `postponed: true` so the timer cannot interrupt again. After a placement or skip, Ready now returns to the mission offer; Move starts a new site choice while retaining the placed object until confirmation. The UI must reset its elapsed-time reference whenever visibility, activity, readiness or mission-open state changes, avoiding counting time from before a pause.
Lead integration checks to keep in mind: retain the placed object and setup state while the mission sheet is open and when it closes (hide the card rather than unmount/reset the visit). Scope changes must synchronously hide old placement markers as well as card content. An `initialArrival` jump must validate the catalog destination and `canLand`; the navigation reducer's generic `jump` action itself is not an access gate. A selected expedition's requested route must reach the same exact route/scenario when Start mission is chosen. The timer may offer placement, but only a learner action opens a mission or moves keyboard focus.

## Lead UI review while O04 is being built

- **A — Keep the world visible.** On initial surface arrival, collapse the existing details dock so the new orientation card and the old details panel do not cover most of the 3D scene together. At 625×505 and 375×600, verify there is ample usable scene area and the card can be collapsed. Keep the initial prompt especially short; this phase is for looking around.
  Selecting a candidate placement site should frame that site without reopening the old details dock automatically. The learner can still explicitly open details or inspect a world landmark when wanted.
- **B — Keyboard interaction.** Keys used inside the arrival card/site choices must not also reach the explorer's global arrow-key camera handler. Preserve native button/radio behavior while using the setup controls.
- **C — Quiet timing.** Check the 45-second transition while a learner has keyboard focus on Ready now / Keep exploring. Replacing that focused control must not strand focus on the document body. Keep the control in place or defer the content transition until interaction ends; do not steal focus merely because time elapsed.
- **D — Hidden on first mount.** The explorer currently initializes `hidden` to false and only updates on a later visibilitychange event. Initialize or synchronize it from the actual document visibility on mount too, so opening the page already in a background tab cannot spend the exploration interval. Add the initial-hidden case to the timer test.
