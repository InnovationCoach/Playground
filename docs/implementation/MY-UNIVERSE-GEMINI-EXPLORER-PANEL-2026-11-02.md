# My Universe — Explorer Panel & Camera Orbit Fixes (Gemini 4 Argon)

2 November 2026 · Author: Gemini 4 Argon · Writer turn: **released**

## 1. Base, head and checkout

| Item | Value |
|---|---|
| Checkout | `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-frontend` |
| Base branch & commit | `codex/universe-pilot-frontend` (`6afa10d49aadcac6a72a408aedc92a29d8293d28`) |
| Feature branch | `codex/universe-explorer-panel` |
| Code & captures commit | `bd832f3` — `fix(universe): collapsible details panel, 30% mobile peek sheet and full 3D camera orbit` |
| Handoff commit | Committed immediately after `bd832f3` on `codex/universe-explorer-panel` (see `git log -n 2`) |

No remote push, merge or deploy was performed.

## 2. Files changed

- `src/features/universe/explore/explorer.css`
- `src/features/universe/explore/MyUniverseExplorer.jsx`
- `src/features/universe/explore/ExplorerScene.jsx`
- `tests/universe-explorer-ui.test.jsx`
- `docs/implementation/captures/explorer-panel/*.png` (9 browser captures)
- `docs/implementation/MY-UNIVERSE-GEMINI-EXPLORER-PANEL-2026-11-02.md`

Untouched: mission logic, `src/features/universe/pilot/**`, service client, `shared/**`, `server/**`, Firestore rules, `public/cosmos/v1/catalog.json`, `package.json`, `package-lock.json`, and Vite/Vitest configs.

## 3. Implemented behaviour

### Problem 1 & Problem 2 — Non-blocking details panel, show/hide toggle, and mobile peek sheet
- **Desktop (`> 820 px`):**
  - `.mx-panel-dock` is `pointer-events: none` so pointer events outside the visible card or below a short card pass directly to `.mx-canvas`.
  - `.mx-panel` sizes to its content (`max-height: 100%`) rather than forcing a full-height column when content is short, and includes a top-right `"Hide details"` toggle button (`aria-expanded="true"`, `aria-controls="mx-panel"`).
  - When collapsed, `#mx-panel` is hidden (`hidden` attribute / `display: none`) and a compact floating `"Show details"` button (`aria-expanded="false"`, `aria-controls="mx-panel"`) remains at the top right, leaving the 3D scene completely unobstructed.
- **Mobile / iPad portrait (`≤ 820 px`):**
  - When open, the bottom sheet defaults to a **30% maximum peek height** (`max-height: 30%`, measured `192 px / 640 px = 0.300` at `390×844`) so both galaxies stay visible in the upper 70% of the stage.
  - A header bar on the sheet provides `"Expand details"` / `"Compact view"` (`aria-expanded`, `aria-controls="mx-panel"`) to expand to full height (`calc(100% - 64px)`) and `"Hide details"` to collapse down to a slim floating `"Show details"` pill at the bottom.
- **Auto-open and learner preference (`nextPanelOpen`):**
  - Opens automatically on initial entry, whenever the learner selects a new destination (`nextNav.selected !== prevNav.selected`), or whenever the learner moves to another level (`universe`, `galaxy`, `system`, `planet`, `environment`).
  - Also auto-opens if a surface landing fails (`env.status === 'failed'`) or a newer catalog version notice appears at the universe overview.
  - Respects the learner's collapse choice across camera rotation, zoom, reset (`R`), detail toggles, or selecting the already-selected item, and never reopens while the learner is dragging the camera.
  - Stored in React state for the current visit only (zero `localStorage` / `sessionStorage` usage).
- **Keyboard & focus management:**
  - Added shortcut `D` / `d` in 3D view (alongside `L`, `R`, arrow keys, `+`/`-`, and `Esc`) to toggle the details panel.
  - When the panel hides (via click or `D`), focus moves to the persistent `.mx-panel-toggle` button so focus stays inside the explorer and never falls to `document.body`.
- **Reduced motion & Calm mode:**
  - `.mx-root.is-still .mx-panel-dock` and `@media (prefers-reduced-motion: reduce)` disable transitions so opening, expanding, and closing happen instantaneously.
- **Unchanged flows:**
  - Mission sheets (`MissionSheet`, `PilotMissionSheet`), the newer-version offer, landing error recovery, and the text view (`ExplorerTextView`) work unchanged. Text view renders no panel toggle.

### Problem 3 — Full 360° camera rotation and polar range
- **Space levels (`universe`, `galaxy`, `system`, `planet`):**
  - `OrbitControls` now uses `SPACE_MIN_POLAR = 0.02` rad and `SPACE_MAX_POLAR = Math.PI - 0.02` rad (~`3.1216` rad) alongside unlimited horizontal azimuth, allowing full 360° horizontal and near-180° pole-to-pole vertical rotation above and below the galaxy/orbital plane without pole-flip.
- **Planet surfaces (`environment`):**
  - Expanded vertical polar range to `SURFACE_MIN_POLAR = 0.04` rad (overhead zenith) through `SURFACE_MAX_POLAR = 1.53` rad (horizon floor just above `Math.PI / 2`), keeping the camera above the terrain/sea while allowing full 360° horizontal rotation and a wider vertical look.
- **Keyboard orbit, zoom, reset & canvas drag:**
  - Extended `api.current.orbit(azimDeg, polarDeg)` and `onKeyDown` to support `ArrowUp` and `ArrowDown` vertical polar orbit in addition to `ArrowLeft` / `ArrowRight` horizontal orbit, `+`/`-` zoom, and `R` reset.
  - `CameraRig` clears its view offset when `panelOpen` is `false` so the scene centers across the full viewport when the panel is hidden.
  - Verified in headless Chrome that `document.elementFromPoint` next to and below the panel card hits `CANVAS` directly and dragging rotates the scene without swallowing pointer events or reopening a closed panel.

## 4. Test results

| Command | Result |
|---|---|
| `npx vitest run --config tests/universe-preview/vitest.config.js` | **8 test files, 55/55 tests passed** (includes new test in `tests/universe-explorer-ui.test.jsx` covering `nextPanelOpen`, auto-open on selection/level change, staying closed on camera keys/drags, `D` shortcut, focus retention, and `aria-expanded` / `aria-controls`) |
| `npm run build` | **Passed** (`dist/` built cleanly in 2.66s) |

## 5. Browser captures

Captured from `http://127.0.0.1:5195/pilot.html` with zero page/console errors in `docs/implementation/captures/explorer-panel/`:

- **Desktop (`1280×860`):**
  - `docs/implementation/captures/explorer-panel/01-desktop-1280x860-panel-open.png` — initial overview with details panel open (`aria-expanded="true"`).
  - `docs/implementation/captures/explorer-panel/02-desktop-1280x860-panel-hidden.png` — details panel hidden (`aria-expanded="false"`), floating `"Show details"` button focused at top right.
  - `docs/implementation/captures/explorer-panel/03-desktop-1280x860-galaxy-above.png` — Lyra Spiral with panel hidden and camera tilted above the galaxy plane.
  - `docs/implementation/captures/explorer-panel/04-desktop-1280x860-galaxy-below.png` — Lyra Spiral with panel hidden and camera tilted into the southern hemisphere below the galaxy plane.
- **Phone (`390×844`):**
  - `docs/implementation/captures/explorer-panel/05-phone-390x844-panel-open.png` — bottom sheet in 30% peek height (`dockHeight: 192px`, `stageHeight: 640px`, ratio `0.300`), both galaxies visible above the sheet.
  - `docs/implementation/captures/explorer-panel/06-phone-390x844-panel-expanded.png` — bottom sheet expanded via `"Expand details"`.
  - `docs/implementation/captures/explorer-panel/07-phone-390x844-panel-hidden.png` — bottom sheet collapsed to the slim `"Show details"` floating button.
  - `docs/implementation/captures/explorer-panel/08-phone-390x844-galaxy-above.png` — camera tilted above the galaxy plane at `390×844`.
  - `docs/implementation/captures/explorer-panel/09-phone-390x844-galaxy-below.png` — camera tilted below the galaxy plane at `390×844`.

## 6. Untested

- **Physical iPad and phone hardware:** tested via Chromium responsive viewport emulation (`1280×860` and `390×844`), not on a physical iPad or iPhone.
- **Physical multi-touch gestures:** two-finger pinch-to-zoom and touch rotation on hardware touchscreens were not tested (mouse drag, wheel, and keyboard orbit/zoom were tested).
- **Screen readers:** ARIA attributes (`aria-expanded`, `aria-controls`, `hidden`, `aria-live`) and focus targets were verified in DOM/jsdom and headless Chrome, but not tested with VoiceOver, TalkBack, or NVDA.
- **Other browsers:** Safari (WebKit) and Firefox were not tested this turn.

---

**Writer turn:** released for `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-frontend`.
