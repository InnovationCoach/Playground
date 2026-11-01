# My Universe — first playable prototype

1 November 2026 · Local implementation, not deployed

## Checkout and boundaries

Work is isolated in `/Users/admin/Desktop/HearIsland/output/my-universe/source`, branch `codex/my-universe-prototype`, based on `c855527` from the newer `feature/search-discovery` checkout. That starting revision is a source baseline, not a claim about the current production release.

The existing course-discovery checkout and old root checkout were not modified for this feature. No backend, authentication, Firestore/Storage rules, accounts, real progress, provider calls, deployment, push or merge was changed/performed. Backend ownership remains with Gemini.

## Try it

The standalone review server is `http://127.0.0.1:5192/`.

From this checkout:

```sh
node_modules/.bin/vite --config tests/universe-preview/vite.config.js
```

This entry imports only the prototype, its pure model/art and existing SPARK styles. It has no Firebase or model adapter. The fictional preview identity is `fictional-universe-preview`. The browser sandbox is separate from real goals, XP and assessed achievement.

In the actual dashboard source, open My Spark Universe → **Try the playable prototype**. It is lazy-loaded and returns to the original Universe content through **Back to Universe**. That action attempts a local save before closing; a failed save leaves the editor open with a clear error. Existing interests, self-marked milestones, appearance controls and inactive future-feature messaging are preserved.

## Working interactions

- Build/Explore/Creatures/Experiment modes.
- Eighteen starter catalog objects across Nature, Structures and Little details; two additional sample reward assets. Catalog count is 20 placeable types total.
- Place, pointer-drag, keyboard arrows, position/depth/size sliders, rotation, duplication, removal, object list and bounded undo/redo.
- Forty-object placement cap and validated coordinates, IDs, scales and supported asset references.
- Three scene themes: Moon garden, Orbital workshop and Neon outpost. Platform controls use existing SPARK navy/purple/lime tokens; scene themes do not change global appearance preferences.
- A creature with three bodies, four palettes, three personalities, three starter accessories, an editable name and a sample star-hat accessory.
- Scripted personality quotes clearly labeled as not AI. Personality affects animation pace.
- Earth-like, low-gravity and float modes, Run/Pause, Reset motion and manual One step. This is a stylized play sandbox, explicitly not a scientific physics model.
- Calm motion honors the initial dashboard preference and system reduced-motion preference; enabling Calm stops continuous motion. The manual step action remains available.
- Animation pauses when the page is hidden, when a different dashboard slide is active, or when leaving Experiment mode. Animation frames are never persisted.
- Manual **Save locally**, account-keyed browser sandbox, reload recovery and honest blocked/quota failure state. No claim of cloud sync, multi-device resume or real private-world service.
- A clearly marked sample reward choice: mini moon, waterfall kit or creature star hat. It consumes no progress or XP and creates no real entitlement. The demonstration choice can be changed through prototype undo/reset. Production permanent-ownership policy is not implemented here.
- Restore starter world is undoable. There is no irreversible delete of school data.

Names are edited as drafts and committed on blur/Enter, preserving spaces and avoiding a history entry for every keystroke. Empty names revert to the previous value. Text is rendered as React text, not HTML.

## Files

- `src/features/universe/universeModel.js`: versioned validated world model, bounded history, catalog and pure movement/gravity helpers.
- `src/features/universe/UniverseArt.jsx`: original code-native SVG objects, creature assembly, scene backdrop and isolated animation clock.
- `src/features/universe/UniversePrototype.jsx`: editor, inspectors, local-save adapter and sample reward dialog.
- `src/features/universe/universe.css`: responsive SPARK-compatible controls, scene themes and reduced-motion styling.
- `src/features/dashboard/SparkUniverse.jsx`: lazy prototype invitation/return flow.
- `src/features/dashboard/MyDashboard.jsx`: passes account ID, Calm preference and active-slide state.
- `tests/universe-preview/*`: standalone fixture-only entry and scoped Vite/Vitest configurations.
- `tests/universe-model.test.js`, `tests/universe-ui.test.jsx`: model and interface tests.
- `package.json`, `vitest.config.js`: test commands and model-suite inclusion.

## Validation actually performed

- `npm run test:unit`: **537 passed** across 30 files. This includes the seven new model tests.
- `npm run test:universe`: **14 passed**: seven model tests plus seven interface tests. There are **544 distinct passing tests** across these commands, not 551.
- `npm run build`: passed. The application still reports the existing large-chunk warning. The prototype is lazy-loaded; its new JavaScript chunk is approximately 12.8 kB gzip, CSS approximately 5.0 kB gzip in this build.
- `git diff --check`: passed.
- Browser: placed a tree; moved it with arrow keys; rotated/duplicated/undid; directly dragged the habitat dome and observed its coordinates change; configured and named a robot creature; ran and paused low gravity; verified nonzero motion; used a manual Calm-mode step; claimed a sample waterfall; saved/reloaded and observed the same named creature, objects and sample choice.
- 390 px layout: no horizontal page overflow; inspected build and creature controls and neon-theme contrast. Keyboard activation worked. This is responsive-browser testing, not physical phone/touch-device certification.
- SPARK Night/Daylight were inspected. Native reward dialog behavior and readable explicit sample status were checked.
- Existing offline dashboard: Universe invitation appeared, prototype opened, arrow-key editing moved the object without leaving Universe, and Back to Universe restored the original content.
- Prototype and dashboard browser error logs were empty in the checked sessions.

The connected browser's coordinate input did not align with viewport overrides during one responsive interaction. Responsive mode/theme actions were verified with keyboard activation; direct pointer dragging was independently verified after returning to normal viewport sizing. Do not describe that as a physical mobile drag test.

Review screenshots are under `/Users/admin/Desktop/HearIsland/output/my-universe/review/`: `desktop.png`, `preview.png`, `mobile-build.png`, `mobile-neon.png`, `mobile-creature.png`, `spark-night.png`, `sample-rewards.png`.

## Deliberate limitations and next work

This completes the first local playable slice, not the production My Universe service. It has one world, one creature, a bounded scene without a free camera, English prototype copy and browser-local manual saves. There are no real learning rewards, assessed completion, AI generation, project-publication links, external assets, social visits, collaboration, cloud recovery or offline merge service.

Next review with learners: can they place/move an object without explanation; find and customize their creature; understand the difference between a sample unlock and a real reward; use the gravity controls; and locate Save locally? Inspect actual school phones and keyboard-only flows. Refine touch hit targets, viewport/camera behavior and localization from that feedback.

Then agree Gemini's world-state, inventory and verified-event contracts from `MY-UNIVERSE-IMPLEMENTATION-PLAN-2026-11-01.md` in the root implementation documents. Replace only the local persistence adapter and sample reward adapter after those services exist, keeping the same validated scene structure. Do not treat browser-owned sample inventory as a source of server entitlements or convert self-marked milestones into rewards.

Before release, verify the actual deployed baseline, merge through the approved workflow and obtain Mani's explicit authorization for the exact deployment under AGENTS.md. No deployment authorization is requested by this handoff.
