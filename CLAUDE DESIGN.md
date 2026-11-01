# CLAUDE DESIGN — My Universe (deep-space exploration)

**Author:** Claude (Opus 5.5) · **Date:** 1 November 2026 · **Role:** visual architecture, interaction and asset design
**Inputs read:** `UNIVERSE.md` (GPT-6), `docs/universe-handoffs/CLAUDE REQUEST.md`, `docs/universe-handoffs/STEM-REUSE-AUDIT.md`, the official *Product Vision & Visual Alignment Brief V1.0*, `AGENTS.md`, `../MY-UNIVERSE-TECHNICAL-IMPLEMENTATION-REPORT-2026-11-01.md`, `/Users/admin/Desktop/HearIsland/output/universe-3d/UNIVERSE-3D-TECHNICAL-REPORT.md`, and the source of both prototypes and the named STEM modules (read-only).
**Nature of this document:** a design proposal. Nothing here is implemented, installed, approved or scheduled. Every visual, interaction, number and interface below is **proposed** unless a row explicitly says **exists**.

---

## 0. Summary for reviewers

1. **Direction.** My Universe becomes a cinematic, scientifically flavoured exploration viewport: **Universe → Galaxy → Solar system → Planet inspection → Planet environment → Location/workstation**. It sits inside the unchanged SPARK shell. The landing is deep space, never the floating island.
2. **Renderer recommendation.** **Evolve the existing, tested React Three Fiber 8 / three 0.169 / drei 9 stack** from the `feature/universe-3d` worktree, using raw three.js inside it wherever performance needs it (instancing, custom shaders, manual disposal). I recommend this over starting a direct-three.js host. The reasons are in §3. Either path needs Mani's dependency approval, because **neither library is installed in this canonical checkout**.
3. **First slice.** One universe landing with two galaxies, one detailed solar system with three inspectable planets, and **one enterable authored environment**. The proposed environment is an ocean-world research region, with a volcanic/basalt alternative. The slice includes full back/breadcrumb navigation, a complete non-3D destination fallback, honest access states, and no rewards.
4. **Both prototypes are preserved unchanged.** Their engineering patterns are reusable. Their island/garden presentation and creature art are not. Old saves are neither migrated nor deleted.
5. **Future direction only:** planetary STEM workstations (including the **ocean-planet floating city**), reviewed missions and environmental events over time, and competency-adapted routes. None of these is a current requirement.

---

## 1. Baseline actually reviewed (proposed vs existing)

### 1.1 Repositories and branches inspected

| Location | Branch / base | What exists | Status |
|---|---|---|---|
| `output/my-universe/source` (this canonical checkout) | `codex/my-universe-prototype`, base `c855527` | React/SVG 2.5D island prototype (`src/features/universe/{UniversePrototype.jsx 167, UniverseArt.jsx 79, universeModel.js 85, universe.css 8}` lines), lazy invitation in `src/features/dashboard/SparkUniverse.jsx`, tests `tests/universe-{model,ui}.test*`, preview `tests/universe-preview/*` | **Exists**, uncommitted, not deployed. **No three.js/R3F installed here.** |
| `output/universe-3d/source` | `feature/universe-3d`, base `c855527` | Genuine 3D island prototype on **three 0.169.0, @react-three/fiber 8.17.10, @react-three/drei 9.114.0** (React 18): `src/features/universe/{worldModel.js 161, physics.js 54, Assets3D.jsx 97, UniverseScene.jsx 124, UniverseStudio.jsx 209, universe.css 84}`, 9 unit tests, preview `tests/universe-preview/*` (port 5189) | **Exists**, uncommitted, not pushed, **not integrated** into the app; island concept **superseded** |
| Live-line dashboard (`c855527`) | as above | My Spark Universe slide (`SparkUniverse.jsx`), inactive-features bays, SPARK Night/Daylight tokens (`sparkBrand.css`), Calm preference, slide deck with swipe/arrow navigation | **Exists** on the release line; the slide is the agreed entry point |
| STEM modules | this checkout | Hex-Grid, Solar Car, SO₂→Sulfate, Gold Filter Lab, Plant Microscope Lab, legacy `index.html` activities, Junior Explorers, PBL program content | **Exists**; read-only reuse assessment in §11 |

### 1.2 Visual artifacts reviewed

- SVG prototype screenshots: `../review/{desktop,preview,mobile-build,mobile-neon,mobile-creature,spark-night,sample-rewards}.png`.
- 3D prototype screenshots: `/Users/admin/Desktop/HearIsland/output/universe-3d/screens/{1-explore,2-build,3-creatures,4-experiment-moon,5-mobile-daylight}.png`.
- The current SPARK shell and dashboard as captured during earlier dashboard work.

### 1.3 Gap against the V1.0 vision

| Vision requirement | SVG prototype | 3D prototype | Proposed |
|---|---|---|---|
| Vast deep-space landing | No (fixed island) | No (one island in a starfield) | **New:** universe overview scene |
| Multiple galaxies, nebulae, systems | No | Decorative backdrop only | **New:** data-driven hierarchy |
| Spherical planets with meaningful selection | Decorative shapes | One decorative ringed planet, not selectable | **New:** lit spheres with inspection |
| Smooth camera travel into a planet | No camera | Orbit camera only | **New:** staged travel transitions |
| Planet entry reveals a real environment | No | No (the island is not a planet surface) | **New:** authored terrain environment |
| Available / discovered / locked + reasons | No | No | **New:** status model (§4.4), backed by Gemini later |
| Teen-appropriate, non-cartoon | Cartoon garden | Low-poly cartoon island and creatures | **Redesign** (§4) |
| iPad/laptop, touch, keyboard, reduced motion | Partial | Partial (buttons and keys, Calm, reduced motion, demand rendering) | Reuse the patterns and extend them |
| XP/rewards inactive | Sample chooser (client-owned) | Sample chooser (client-owned; **ownership lost on reload**) | Keep inactive; samples only in labelled previews |

---

## 2. Design principles

1. **Space is the stage; SPARK is the frame.** The viewport is dark, cinematic space. Everything around it (navigation, panels, buttons, type, preferences) stays SPARK.
2. **Every pixel that looks interactive is interactive.** No static decorative planets pretending to be destinations. If something can't be visited, it reads as background.
3. **Truthful states.** *Discovered* (you've seen it) is never confused with *available* (you may enter) or *verified* (a trusted service says you've met a requirement). Fictional world values are labelled separately from real science.
4. **Learners control the camera.** No forced auto-flight, no long unskippable cinematics, and an instant route everywhere.
5. **One feature, one renderer surface, staged scales.** No second Universe app, no canvas per object, and no literal astronomical coordinates.
6. **Essential learning is never locked.** Exploration can unlock optional destinations; tools and missions needed for learning stay open.

---

## 3. Renderer approach: evolve the existing Fiber stack (recommended) vs direct three.js

**What both options share.** The same three.js `WebGLRenderer` (WebGL 2), materials, geometry and disposal rules. Performance ceilings are set by three.js and the GPU, not by the wrapper.

| Criterion | Evolve the existing **R3F 8 + drei 9 + three 0.169** | **Direct three.js** in a React host component |
|---|---|---|
| Existing evidence | Running prototype: scene lifecycle, demand frame loop, ref-driven per-frame updates without React re-renders, pinned React-18-compatible versions, 9 passing model tests, measured preview bundle about 286 KB gzip **including React** (about 240 KB for the 3D stack). It's still a prototype; no device profiling. | None in this repo; would start from zero |
| Fit with hierarchy | Declarative scene graph maps naturally onto nested levels. `<Suspense>` plus lazy components give per-environment code splitting and loading states. drei offers `CameraControls`/`OrbitControls`, `Instances`, `useGLTF`, `Html`, `Bvh` | Imperative scene graph; the team writes its own loader, suspense integration, picking and lifecycle |
| Lifecycle risk | R3F disposes objects it creates on unmount. Externally loaded assets still need explicit ownership and disposal | All disposal is manual: more control, more leak risk |
| Per-frame performance | `useFrame` plus refs (already used) keeps React out of the frame loop. Raw three objects remain accessible | Full control by default |
| Dependency count | Three packages (three, fiber, drei) | One package (three) plus whatever is hand-written |
| Team fit | Same React idiom as the dashboard code | Separate imperative layer to maintain |

**Recommendation: evolve the existing Fiber stack.** It is already compatible, pinned and exercised. Discarding it would rebuild tested lifecycle and interaction code. Within it:
- keep React state for navigation, selection and overlays only
- keep camera paths, star fields and environment animation in refs
- drop to raw three.js for instancing, custom shaders and asset disposal

GPT-6 listed direct three.js as the initial candidate. If the coordinated review chooses it, the reusable parts are still the world-model/validation patterns, the quality-tier logic, the demand-render/visibility rules and the accessibility patterns (§7). Only the scene glue would be rewritten.

**Not decided here:** installing these packages into the canonical checkout, upgrading versions, or any post-processing/physics library (none is needed for the first slice).

---

## 4. Scene hierarchy and visual storyboard

### 4.1 Hierarchy (proposed data, not a schema)

```text
Universe (personal view of a shared catalog)
 └─ Galaxy            id, name, type (spiral/elliptical/irregular), palette, position in overview
     └─ Solar system  id, star class/colour, planets[]
         └─ Planet    id, radius class, surface material, atmosphere, rings/moons, facts (labelled real/fictional),
                      status (discovered/available/locked/not-connected/preview), environments[]
             └─ Environment  id, biome, terrain manifest, sky/atmosphere, locations[]
                 └─ Location / workstation  id, purpose, linked mission/module (future)
```

Stable IDs and content versions belong to GPT-6/Gemini's catalog contract. The design only needs these fields to render and explain.

### 4.2 Staged scales and camera

Each level is its own **presentation scale with a local origin**: the overview in "galaxy units", a system in "AU-like display units", an environment in metres. Travelling between levels is a **staged transition**: the outgoing scene is replaced or cross-faded while the camera continues the motion. It is never one continuous all-scale scene. Real astronomical values appear as text with units, never as scene coordinates.

### 4.3 Storyboard

**Level 1: Universe overview (landing)**
- *Composition:* a deep field with layered starfields (instanced points, three parallax depths) and 2–3 soft nebula volumes (billboarded textures, low overdraw). In the first slice, two galaxies: one spiral, glowing violet-magenta; one elliptical, gold-white. Distant unvisited galaxies appear as faint smudges labelled "Not yet charted" (not clickable). Brand colours appear in light, never as UI chrome inside space.
- *Camera:* starts slightly above the galactic plane, angled 15–20°. Orbit is limited (no flipping); zoom is bounded between "see both galaxies" and "galaxy fills the view".
- *Arrival into this level:* from the dashboard Universe slide, "Enter My Universe" opens the full exploration view (§5.1) with a 600–900 ms fade from black and the stars resolving. Reduced motion: an instant cut.
- *Interaction:* hovering or focusing a galaxy shows a halo and a name label. Selecting it opens the inspect panel (name, type, short description, number of charted systems, status) with **Explore galaxy**.
- *Overlay:* breadcrumb "My Universe", a destination list button (opens the non-3D list), zoom +/−, reset view, help, and a **Leave Universe** button back to the dashboard.

**Level 2: Galaxy focus**
- *Transition:* about 1.6 s ease-in-out dolly toward the galaxy core. The overview stars streak subtly, then the galaxy's own systems resolve as distinct points with soft lens glow. Reduced motion: a fade (≤300 ms) and direct placement. **Skippable:** any input completes the move instantly.
- *Composition:* the galaxy disc seen from about 30° above, with 3–6 marked systems (the first slice details only one; others are labelled "Preview" or "Not charted").
- *Interaction:* select a system to show its star class, planet count and status, then **Visit system**.
- *Breadcrumb:* My Universe › Lyra Spiral (example name).

**Level 3: Solar system**
- *Transition:* a dolly toward the star, which brightens; planets appear on faint orbit rings (display-scaled, labelled "not to scale").
- *Composition:* the central star (emissive sphere plus soft corona sprite), 3 planets for the first slice with clearly different silhouettes: an ocean world (blue, cloud bands, thin atmosphere rim), a basalt/volcanic world (dark, glowing fissures), and an ice world with rings. Orbits are static by default; optional slow motion is available when motion is allowed.
- *Interaction:* select a planet to frame it at inspection distance (Level 4). Keyboard and list selection work the same way.

**Level 4: Planet inspection**
- *Composition:* a lit sphere filling about 45% of the viewport with a visible day/night terminator. Atmosphere uses a Fresnel shell, rings and moons come from data, and surface detail comes from a material (procedural noise or authored texture) that reads as geology, not cartoon.
- *Camera:* orbit around the planet. Zoom is clamped above the surface, and the camera shows the dark side only when the learner chooses.
- *Panel* (SPARK-styled): name; **status chip**; "What it's like" (environment, resources, scientific features), with every fact tagged **Real science** (with units and source) or **Fictional world** (with a reason); "Missions here" (future; empty state in the slice); and **Enter environment** (primary) only when the status allows. Locked planets show the authored requirement text, and "verified" only when Gemini says so. Otherwise the chip reads "Access not connected yet".
- *Prefetch:* while a planet is being inspected, its environment loads in the background, with progress shown on the Enter button ("Preparing landing… 60%").

**Level 5: Planet environment (entry)**
- *Transition (normal motion):* about 2.5 s total, interruptible:
  1. the camera dives toward the planet's lit limb
  2. the atmosphere colour floods the view
  3. a cloud layer passes
  4. the terrain resolves below
  5. the view settles at an elevated "survey" viewpoint about 40 m above ground
- *Transition (reduced motion):* a cross-fade (≤300 ms) to the survey viewpoint.
- *Failure:* if the environment fails to load, the inspection view stays usable, the button reads "Landing failed. Try again", and "Explore in text view" opens the fallback description. No partial broken scene.
- *Composition (proposed first environment, ocean world):* a bounded coastal-ocean region about 1 km across. It has long swells (a vertex-displaced plane at modest resolution with a calm-motion option), a volcanic headland, a research platform (the future floating-city foundation site), a weather mast, a tide gauge and a sea-floor vent visible through clear water near the headland. A sky dome with sun position, distant cloud banks and horizon haze. The scale reads through human-sized structures.
  *Alternative:* a volcanic/basalt research landscape (columnar basalt, a lava channel glow, a sensor station), as named in `UNIVERSE.md`.
- *Camera:* survey mode by default (orbit around a focus point, limited height and distance). **Location hop:** selecting a location glides about 1 s to a framed viewpoint, or cuts instantly with reduced motion. No free first-person walking in the slice.
- *Locations:* 3–4 inspectable points shown as SPARK-styled pins with labels. Each opens a location panel describing purpose, observations ("Swell height: about 2 m (fictional world value)") and future workstation links (shown as "Coming later", not active).
- *Return:* breadcrumb back to the planet, which lifts the camera back to orbit at inspection framing (reverse transition; instant with reduced motion). The browser Back button maps to the same stack.

**Level 6: Location / workstation (future host).** A framed view plus an anchored panel or full-height side sheet that will host STEM modules (§10–§11). In the first slice it is an informational panel only.

### 4.4 Status vocabulary (UI; values come from data/Gemini)

| Chip | Meaning | Visual |
|---|---|---|
| **Charted** | Visible and inspectable; facts available | Outline chip, star icon |
| **Available** | May be entered | Lime chip, door icon |
| **Locked** | An authored requirement exists and isn't verified | Lock icon plus the requirement text |
| **Access not connected** | No trusted progress source yet | Grey dashed chip |
| **Preview** | Fictional sample shown in a labelled preview only | Amber chip |
| **Not charted** | Background only; not interactive | No chip; faint rendering |

"Discovered" can be tracked locally for convenience, but never grants access.

---

## 5. Interaction design

### 5.1 Where the experience lives

- **Entry:** the existing **My Spark Universe** slide keeps its intro and adds **Enter My Universe**, which replaces the current "sample universe" invitation once approved. The slide itself does not host the live 3D canvas.
- **Full exploration view:** opens as a **full-viewport route or overlay inside the SPARK shell**: SPARK top bar visible, dashboard slide dock hidden. This removes gesture conflicts with the deck's horizontal swipe and arrow keys, and gives the canvas full height on iPad. Leaving returns to the same dashboard slide.
- **Legacy prototypes:** stay reachable only from their existing preview entries. Nothing is deleted.

### 5.2 Input mapping (proposed)

| Action | iPad / touch | Laptop: mouse / trackpad | Keyboard |
|---|---|---|---|
| Orbit / look | One-finger drag | Drag; two-finger trackpad pan rotates | Arrow keys rotate (step), with an on-screen hint |
| Zoom | Pinch | Wheel / pinch | `+` / `-` |
| Select | Tap (with a small movement tolerance so drags don't select) | Click | `Tab` cycles destinations; `Enter` selects |
| Go deeper | "Explore / Visit / Enter" button in the panel | Same | `Enter` on the focused primary button |
| Back one level | Breadcrumb or Back button | Same, plus browser Back | `Esc` (when no dialog is open), `Backspace` on breadcrumb |
| Reset view | Reset button | Same | `R` |
| Destination list | List button | Same | `L` |
| Skip transition | Any tap | Any click | Any key |

- Touch targets are ≥44 px. Panels are bottom sheets on iPad portrait and side panels on landscape and laptop.
- Labels for 3D objects are HTML anchored to world positions, so they're readable, translatable and focusable.
- **Every 3D action has an HTML equivalent.** The scene is never the only way to do anything.

### 5.3 Motion and comfort

- No idle auto-rotation. Optional "slow drift" in settings, off by default.
- Transitions under 2.5 s, interruptible and eased (no snap-zoom). With reduced motion or Calm, fades of ≤300 ms or instant cuts, with no parallax streaks, swell animation or cloud motion.
- The camera is clamped to avoid inversion and near-surface clipping, and the field of view stays fixed during travel (no dolly-zoom).
- Rendering pauses when the view is hidden, the tab is backgrounded, or the dashboard slide is inactive. When stationary, it renders on demand.

### 5.4 Non-3D fallback (a first-class product view)

Shown when WebGL 2 is unavailable, after a lost context that can't be restored, when the learner chooses the **List view**, or when an environment fails to load.

- **Structure:** an accordion tree Universe › Galaxies › Systems › Planets, with the same status chips and the same inspect content (facts with real/fictional tags).
- **Environments:** each has a **text and illustration page** (a static rendered still once art exists) with its locations and their descriptions.
- **Missions** (future) are fully usable from this view.
- **Never** shows the old illustrated island as "3D".

---

## 6. Visual direction (teen-appropriate, ages 11–18)

### 6.1 Tone
Grounded, scientific and cinematic, closer to space-documentary visualisation and serious exploration games than to toys. Quiet beauty: big negative space, a few strong light sources, readable silhouettes. Humour and personality can live in mission writing, not in cartoon art.

### 6.2 Colour and light
- **Space:** near-black blue (`#05101f`–`#0b1430`), with nebulae in desaturated violet/magenta/teal at low opacity.
- **SPARK brand:**
  - lime `#96d700` for interactive focus, available states and primary actions
  - purple `#8250a0` for the selected destination
  - magenta `#ae266c` (lightened for dark backgrounds) for warnings or lock emphasis
  - sky `#9bd2ff` for scientific data annotations
- **Planets:** colours come from plausible geology and atmosphere, not brand colours.
- **Lighting:** one key light per system (the star) plus ambient fill; a visible terminator on planets; Fresnel atmosphere rim; subtle emissive features (fissures, city lights) only where the world data justifies them.

### 6.3 Typography and overlay (SPARK)
- **Type:** Plus Jakarta Sans for names and titles; Inter for body; monospace for coordinates and values with units (as on the dashboard instruments).
- **Panels:** solid SPARK Night surfaces (`#0d2340`, border `#1f3d61`) at 92–96% opacity, so space isn't washed out. **No heavy glassmorphism or blur on iPad.** Daylight preference applies to the panels and shell; the space viewport stays dark by design and is stated as such in settings.
- **Labels:** small caps-style eyebrow (category), name, one-line status. Leader lines are thin, lime when focused.
- **Brand presence:** the SPARK sparkle marks the current focus and available destinations (consistent with the dashboard's "Next" marker).

### 6.4 Avoid (from V1.0)
Floating islands as landing, cartoon gardens, oversized mushrooms and trees, flat illustration passed off as 3D, admin cards in the viewport, childish proportions, static decorative planets.

### 6.5 Asset requirements (first slice, proposed)

| Asset | Approach | Notes |
|---|---|---|
| Starfields (3 layers) | Procedural instanced points | Seeded, so stable per universe |
| Nebulae (2–3) | Painted alpha textures on large billboards, low count | The largest overdraw risk; cap the layers |
| Galaxies (2) | Particle disc (spiral arms by procedural distribution) plus a core sprite | One instanced draw call per galaxy |
| Star (1 detailed) | Emissive sphere, corona sprite, colour by spectral class | |
| Planets (3) | Sphere plus surface material (procedural noise shader or 2K texture), atmosphere shell, optional rings | Separate far (low-poly, small texture) and near (high-poly, 2K) LODs |
| Moons (0–2) | Simple spheres | |
| Ocean environment | Ocean plane (displaced, LOD), headland terrain (heightmap 256–512² plus detail texture), research platform kit, mast, tide gauge, vent | Authored structures as glTF/GLB from Blender (or licensed); compressed |
| Sky | Gradient dome plus sun disc plus haze; distant cloud banks | No HDR download required |
| UI icons | Existing Lucide set | Consistent with SPARK |

Sourcing and art direction decisions are Mani's (procedural-only, CC0 packs, or a commissioned Blender artist). No purchases or generation services are authorized here. All assets must be served from WeLearn hosting, never from learner-supplied URLs.

---

## 7. Reuse assessment of both existing prototypes (read-only; preserve both)

### 7.1 Reusable as engineering or interaction patterns

| From | Pattern | Reuse in new design |
|---|---|---|
| 3D `worldModel.js` | Versioned, pure data model; `hydrate*` that rejects other versions, drops unknown IDs and clamps values; pure edit functions; undo/redo; `describeWorld` plain-language summary | Same shape for the **catalog and navigation state** (validated destinations, a back stack as history, plain-language descriptions for screen readers and the text fallback) |
| 3D `UniverseScene.jsx` | Canvas with `frameloop` switching (`always` while moving, `demand` otherwise), DPR caps per quality tier, ref-driven per-frame updates, pointer-delta guard so drags don't select, bounded orbit controls | Directly applicable to all levels |
| 3D `UniverseStudio.jsx` | Quality tier selection (auto plus manual), Calm/reduced-motion/hidden-tab pause, live-region announcements, a pluggable `store` prop, HTML equivalents for every 3D action | Core of the new overlay and accessibility behaviour |
| 3D `Assets3D.jsx` | Composition of modular meshes from data | Pattern for building planets and structures from manifests (not the art itself) |
| 3D `physics.js` | Small pure, tested motion helpers | Pattern for transition easing and camera-path helpers. **Not** a science model |
| SVG `universeModel.js` / `UniversePrototype.jsx` | Strict validation, ID uniqueness, bounded transforms, manual save with honest status, storage-failure messaging | Persistence UX patterns ("Saved", "Not saved: …") for future learner state |
| SVG `SparkUniverse.jsx` | Lazy-loaded entry from the dashboard slide with a clean return to the original content; `active` flag for pausing | Entry and return pattern (§5.1) |
| Both | Clearly labelled preview harnesses with fictional data, "no Firebase, no AI, no real rewards" banners | Same practice for every new preview |

### 7.2 Requires redesign or retirement from the primary experience

| Item | Reason |
|---|---|
| Floating island (SVG and 3D), garden/mushroom/tree assets, cartoon creatures | Superseded by V1.0; not suitable for the landing or environments |
| 2D screen-coordinate transforms (SVG `x/y` "depth") | Not convertible to 3D surface coordinates |
| Sine-based (SVG) and hop-kinematics (3D) gravity toys | Play animations, not physics; must not appear as science |
| Build mode (placing decorations) | Not part of the exploration vision's first slice. May return later as authored "base building" tied to missions |
| Sample reward choosers | Client-owned demonstrations. Never eligible for real unlocks or migration |

### 7.3 Saves and known gaps (record only; nothing fixed)
- **SVG prototype saves:** browser key `spark-universe-prototype:v1:<uid|sample>`. **3D prototype saves:** `spark.universe.preview.v1` (preview only).
- **Neither will be migrated, deleted or read** by the new experience. If ever surfaced, they stay in a clearly labelled "Legacy sandbox" entry.
- **3D prototype known gaps (from its report):**
  - sample-reward ownership is in-memory only, so **a placed reward item disappears after reload**
  - no physical-device or screen-reader testing
  - basic quality heuristic
  - creature selection ring rises with hops
  - studio text not localised
- **SVG prototype known gaps (from its report):** sample choice is client-owned and reversible; no cloud state; touch drag not certified on devices.

---

## 8. First aligned slice (bounded) and acceptance criteria

### 8.1 In scope (Stage C in `UNIVERSE.md`, after the device spike)
1. A universe overview with **2 galaxies**, layered stars and nebulae, and "Not charted" background.
2. **1 detailed galaxy → 1 solar system → 3 inspectable planets** (ocean, basalt, ice-ring), each with real/fictional-tagged facts and status chips.
3. **1 enterable environment** (ocean world proposed) with 3–4 inspectable locations and location hop.
4. Complete navigation: breadcrumbs, Back, `Esc`, reset, skippable transitions, reduced-motion routes, loading progress and failure recovery.
5. **Complete non-3D destination view** with parity of content.
6. Access states from a **fixture adapter** in previews ("Preview" chips). In the real app, "Access not connected" until Gemini's service exists. No unlocks, XP or rewards.
7. Entry from the existing Universe slide into the full exploration view; return to the slide.

### 8.2 Out of the first slice
Missions, STEM workstations, other environments, travel between galaxies beyond the two, base building, creatures, sharing, AI generation, weekly content, real progression.

### 8.3 Acceptance criteria (design)
- **Navigation:** a learner can go Universe → Galaxy → System → Planet → Environment → Location and back to the Universe with touch only, mouse only and keyboard only. The breadcrumb and browser Back restore the previous camera framing.
- **Meaningful entry:** inside the environment, terrain relief, sky/atmosphere, human-scale structures and ≥3 inspectable locations are present. It isn't just a sphere or a static image.
- **Interruptible transitions:** any input completes a transition immediately. Reduced motion or Calm replaces all travel with ≤300 ms fades or instant cuts, and stops ambient motion.
- **Failure path:** a forced environment load failure leaves inspection usable with retry and text-view options. A forced WebGL-unavailable state opens the destination list with full content.
- **Honest states:** no destination shows "Available" or "Verified" in the real app without a trusted source. Preview fixtures always show "Preview".
- **SPARK fidelity:** shell, fonts, colours and controls match the dashboard. Panels meet WCAG AA contrast on the dark viewport. Focus is always visible.
- **Lifecycle:** leaving the Universe or switching dashboard slides stops rendering. Repeating enter/leave 10 times shows no growing GPU memory (measured with renderer info during the spike).
- **Device check:** profiled on Mani's chosen **physical iPad and laptop**. Budgets are set from that measurement, not assumed (§9).

---

## 9. Performance and content assumptions, uncertainties

**Assumptions** (to verify in the spike; no benchmarks are claimed):
- one rendering surface
- demand rendering when stationary
- starfields and galaxy particles instanced (a few draw calls each)
- planets at two levels of detail
- nebula overdraw capped
- one environment resident at a time, with a bounded cache (current plus one prefetched)
- DPR capped lower on iPad by default

**Measured facts available today:** only the 3D prototype's preview build size (about 286 KB gzip including React). It hasn't been profiled on devices.

**Uncertainties:**
1. Real frame rate and heat on the target iPad generation with displaced ocean water and atmosphere shells.
2. Texture memory for three 2K planet materials plus terrain on older iPads.
3. Shader compile hitches on the first environment entry (may need warm-up during prefetch).
4. Whether instanced galaxy discs read as "beautiful" at budget, or need painted sprites.
5. Asset production cost and lead time (art direction pending).
6. Gesture behaviour inside the SPARK shell on iPad Safari (edge-swipe Back vs orbit drags).

**Proposed spike budgets** (targets only, refined after measurement): ≥30 fps during navigation on the agreed iPad; low hundreds of draw calls; environment payload in the low tens of MB at most before compression decisions; first overview visible within a few seconds on school Wi-Fi with progressive refinement.

---

## 10. Future direction: planetary STEM integration (not a current requirement)

**Concept.** Locations in an environment become **workstations**: framed places where an existing or new learning module runs, with the planet as meaningful context. The workstation is the interface; the module keeps its own model, labels and limits.

### 10.1 Example: ocean planet, floating city (illustrative)

*Driving question:* "How might we design a floating settlement that keeps a community safe, powered and fed on an ocean world?"

| Discipline | Workstation in the environment | What the learner does (future) | Existing basis and limits |
|---|---|---|---|
| Engineering | **Platform design dock** on the research platform | Lay out hex modules (housing, farms, energy, water) | **Hex-Grid** (`hexGridModel.js`, `HexGrid-v1.0`): real hex-grid layout and module balances |
| Physics | **Buoyancy test basin** | Check platform loading against displacement and reserve | Hex-Grid computes displacement using seawater density and a reserve fraction (`hexGridModel.js` ~L500). **Earth seawater constants**; a fictional ocean's density must be authored and labelled |
| Mathematics | **Survey table** | Hex areas, scaling, unit conversions, energy budgets | Hex area and distance helpers exist; tasks need educator authoring |
| Energy systems | **Power hub** | Balance solar, wind and biogas against demand | Hex-Grid energy balance is a **steady-state daily average** |
| Environmental science | **Tide gauge and vent observatory** | Water, waste, food loops; ecosystem impact | Model includes water/waste/food balances; **excludes weather, storms, waves, seasons, costs** (its `LIMITATIONS`) |

**Design rule:** the ocean environment may *show* swells and weather for atmosphere, but a storm event may **not** be presented as something Hex-Grid simulates. If storm resilience becomes a mission, it needs a new reviewed model, or must be framed as a design-reasoning task, not a simulation result.

This is a planet-based project, **not** a return to the floating-island landing.

### 10.2 Other natural fits (illustrative)
- **Basalt world:** SO₂ → sulfate chemistry at a volcanic vent station (illustrative kinetics; label preserved) and the Gold Filter Lab for air/water filtration (its credit/ledger system kept separate from Universe progression).
- **Rover/vehicle bay:** Solar Car design and testing patterns. Earth irradiance, gravity and air constants must be re-authored per planet before use.
- **Research lab dome:** Plant Microscope Lab as an observation and lab-book station (a guided investigation, not a growth simulator).

---

## 11. STEM module reuse assessment (read-only) and proposed host interface

### 11.1 What each module actually is

| Module | Classification | Embeddable core | Must preserve |
|---|---|---|---|
| **Hex-Grid** | **Computational model** (steady-state) plus a 2D design UI | Pure `simulate` and helpers in `hexGridModel.js`; `MODEL_VERSION` | DATA/ESTIMATE/ASSUMPTION labels, sources, `LIMITATIONS`, Bangkok/Earth context unless re-authored |
| **Solar Car** | **Computational model** plus physical-build workflow | Pure functions in `solarCarModel.js` (`G = 9.81`, `AIR_DENSITY`, `STANDARD_IRRADIANCE`) | Earth reference constants; classroom-measured inputs; AI design review is a separate dependency |
| **SO₂ → Sulfate** | **Illustrative simulation** | `so2Model.js` (`OUTPUT_LABEL = 'Simulated / illustrative model output'`) | Not fitted to experiments; label on every curve |
| **Gold Filter Lab** | **Computational sweep** plus a **credit/ledger** subsystem | `filterModel.js` | Ledger/pricing are a separate economy; never Universe XP or access |
| **Plant Microscope Lab** | **Guided investigation / lab book** (not a simulator) | Observation and hypothesis helpers | Learner observations distinct from reference facts; drawing state |
| **Urban Heat, Bunker, Micro:bit, Bangkok Coastal** | **Legacy page containers** in `index.html` | None yet (global DOM IDs) | Needs an extraction audit before any embedding |
| **Junior Explorers: Floating House** | **Hands-on physical activity guide** (primary age) | Investigation steps | Not a physics engine; age framing |
| **PBL program/session content** | **Program outlines and toolkits** | Session data, evidence criteria | An outline is not proof that a described simulation exists |

### 11.2 Proposed host interface (design only; not built, no wrappers now)

```text
WorkstationHost (planet location) ──props──▶ Module
  scenario: { id, version, planetContext: { authoredConstants, labels }, locale, accessibility: { reducedMotion, calm } }
  learnerRef: opaque, scoped project/evidence reference (Gemini-defined)
  lifecycle: mount → resume(state?) → suspend → dispose (must cancel timers and release GPU/DOM)
Module ──events──▶ Host
  observation | hypothesis | modelOutput{ values, units, modelVersion, label } | evidenceRef
  (never: award, unlock, xp, completion-as-mastery)
```

- Modules render in a **2D panel/sheet** anchored to the workstation. They aren't forced into 3D.
- The host never reads module globals or browser flags to infer progress.
- Any learning credit comes only from Gemini's verified process, using module outputs as evidence inputs.

---

## 12. Future direction: missions, environmental events, adaptation (not a current requirement)

- **Mission board:** a panel at the system or planet level listing reviewed missions, each with driving question, competency focus, route (scaffolded or advanced), estimated effort and evidence expectations. In the real app it is empty until reviewed content and Gemini's readiness data exist.
- **Environmental events:** authored, versioned scenario variants ("A storm front approaches the platform this week"), shown as a **dated notice in the environment** with the scenario assumptions visible. "This week" describes how often content is published, **not** a scheduler, required attendance, streaks or penalties. Missing an event costs nothing.
- **Adaptation:** route suggestions use demonstrated competency and educator-chosen supports returned by the backend. Age alone never sets difficulty. Without assessments, learners choose supported exploration, and coaches can assign routes.
- **Example mission family:** a spacecraft journey (from V1.0), with a scaffolded route (compare supplied energy options, read a distance diagram, compute travel time with given units) and an advanced route (power/mass trade-offs, unit conversion, life-support constraints). Both need educator-reviewed NGSS performance expectations and math objectives. A space theme alone isn't alignment.

---

## 13. Questions and dependencies

### For Gemini (backend)
1. **Catalog:** where do galaxy/system/planet/environment manifests live (Firestore documents vs versioned hosting JSON), and how are content versions and reviews published?
2. **Access status:** the endpoint or contract that returns per-destination status (`charted | available | locked{requirementText} | not-connected`) for the signed-in learner, its latency, and its behaviour when the service is down. The UI shows "Access not connected" on failure.
3. **Discovered markers:** may "charted/discovered" be stored per learner as a non-authoritative convenience? If so, where, and with what limits?
4. **Legacy saves:** confirm both prototype browser saves stay out of scope (no reading, migration or awarding).
5. **Workstation evidence (future):** what is the scoped `learnerRef`/evidence reference for module outputs, and how is Gold Filter's ledger kept separate from Universe progression?
6. **Assets:** hosting location and caching rules for 3D assets (Firebase Hosting vs Storage), size limits, and cache-busting by content version.
7. **Shared universes (future):** the audience, permission and moderation model for visiting approved planets. No messaging.

### For GPT-6 (coordination)
1. Final renderer choice: evolve R3F (recommended here) vs direct three.js, and whether to adopt the existing pinned versions in the canonical checkout.
2. Approve the full exploration view as a route or overlay outside the slide deck (§5.1).
3. Confirm the first environment: ocean world (recommended, ties to the future floating-city direction) vs basalt.
4. The device-spike plan, and who owns the physical iPad and laptop measurements.

### For Mani
1. Art direction and sourcing (procedural, CC0 packs, or a commissioned Blender artist), and the target iPad model for budgets.
2. Names and tone for the first galaxy, system and planets (or approval to propose them).
3. Approval of the first-slice scope in §8 after GPT-6's coordinated review.

### Dependencies
- Gemini's catalog and access contracts (for real status).
- Educator review (for any mission or fact tagged "Real science").
- Mani's dependency approval (renderer packages in the canonical checkout).
- Asset sourcing decision.
- The physical device spike.

---

## 14. Handoff status

| Item | Status |
|---|---|
| Date | 1 November 2026 |
| Inspected checkout and base | `/Users/admin/Desktop/HearIsland/output/my-universe/source`, branch `codex/my-universe-prototype`, base `c85552768424dbefea6c1b2d2cf18942a368494e` (feature work uncommitted) |
| Also inspected (read-only) | `/Users/admin/Desktop/HearIsland/output/universe-3d/source`, branch `feature/universe-3d`, base `c855527` (uncommitted) |
| Files written | **Only** this file: `CLAUDE DESIGN.md` at the checkout root |
| Code, config, tests, assets, dependencies, branches | **No changes.** Both prototypes and all saves preserved |
| Builds, tests, deploys, merges, migrations | **None** run or performed |
| XP, rewards, unlocks | Remain **inactive** |
| Next owner | **Gemini**, to read `UNIVERSE.md` and this document and write `GEMINI BACKEND.md`. Then GPT-6 reviews both |
| Implementation | **Not started. Still awaiting Mani's approval of GPT-6's coordinated plan.** This design does not self-approve or authorize development |
