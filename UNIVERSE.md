# WeLearn SPARK — My Universe

## Authoritative alignment and shared handoff

**Vision:** Official Product Vision & Visual Alignment Brief V1.0, supplied by Mani on 1 November 2026.  
**Author:** GPT-6 / Codex.  
**Status:** overall alignment approved by Mani; documentation handoff in progress. Implementation remains unapproved and has not started under this revised vision.  
**Current action:** documentation only. No source changes, dependency installation, branch creation, production operation, merge or deployment.

**Audit correction discovered when agent access resumed:** Claude has an existing genuine-3D prototype in `output/universe-3d/source`, branch `feature/universe-3d`, and a technical report at `/Users/admin/Desktop/HearIsland/output/universe-3d/UNIVERSE-3D-TECHNICAL-REPORT.md`. It uses Three.js 0.169.0, React Three Fiber 8.17.10 and Drei 9.114.0 with the existing React 18 line. This is separate pre-existing work, not a branch or implementation created for the present handoff. The earlier sections describing no installed renderer apply to the **canonical SVG checkout**, not to all repository worktrees. Both prototypes must be reviewed and preserved; do not create a third implementation or assume the 3D stack needs to be rebuilt from scratch.

Claude's 3D prototype still depicts the superseded floating-island concept and is not the official deep-space architecture. Its reported reusable candidates include camera controls, renderer lifecycle, mesh/creature composition, edit/history helpers, store abstraction and quality/Calm handling. Its report records unresolved sample-reward persistence and device/accessibility gaps; source inspection confirms separate in-memory sample ownership. No defect is to be fixed in this documentation stage. Review these capabilities against the new hierarchy before selecting the renderer approach. The prior direct-Three.js recommendation below is now a **candidate to compare**, not a settled instruction to replace the existing compatible Fiber stack. Avoid replacing dependencies or discarding tested code without an explicit coordinated rationale and approval.

The official vision supersedes the earlier floating-island creative-world concept. The existing prototype is retained as prior work and implementation evidence; it is not the approved visual direction for the revised product.

## Approved documentation scope and long-term additions

Mani approved the overall alignment and proposed direction, then explicitly authorized only this sequence: ask Claude for `CLAUDE DESIGN.md`; ask Gemini to read both documents and prepare `GEMINI BACKEND.md`; GPT-6 reviews both and updates this file with a coordinated recommendation. Implementation, dependencies, branches, merges and deployments remain prohibited until Mani approves the coordinated plan.

Preserve these long-term product directions in both handoffs:

- STEM simulations and interactive learning activities should eventually live inside planetary environments, rather than remaining disconnected activities outside My Universe.
- Planets should support meaningful interdisciplinary projects and simulations. A floating city on an **ocean planet** is an example: engineering, physics, mathematics, energy systems and environmental science may combine in one environment. This is a planet-based project, not approval to restore the rejected floating-island landing experience.
- The universe should evolve through new weekly missions, environmental events and challenges adapted to learner progress and demonstrated competencies. “Weekly” describes future content evolution, not an authorized scheduler, an implemented cadence or pressure to attend every week.
- Existing STEM simulations must be audited as potentially reusable modules. Record entry points, dependencies, state/persistence assumptions, inputs/outputs, educational validity, accessibility/performance and possible future embedding boundaries. Do not rebuild, move, wrap, migrate or connect them in this stage.

These additions are future product directions, not extra requirements for the current documentation stage or an expanded implementation milestone. The design and backend documents must label them accordingly.

## 1. Product decision

**My Universe is an expanding educational exploration environment: Universe → Galaxy → Planet → Planet Environment.** Solar systems are explicit children within galaxies and connect the galaxy view to its planets.

The first screen is deep space: discoverable galaxies, nebulae, stars, distant systems and true spherical planets with meaningful selection. A student navigates inward through a galaxy/system, inspects a planet and enters an actual environmental scene. Progress can eventually unlock destinations through verified learning decisions; it must not be inferred from play, clicks or browser-owned records.

The primary experience will not be a floating island, miniature garden, decorative-object collection or administrative card grid. Sphere inspection alone does not satisfy planet entry. Preserve SPARK's surrounding navigation, brand colors, fonts, accessibility preferences and shared controls; make the exploration viewport cinematic and spacious within that shell. The viewport can depict dark space while platform appearance preferences continue to govern the surrounding interface.

## 2. Shared repository and writer protocol

The repository remote is `https://github.com/InnovationCoach/Playground.git`.

**Canonical handoff checkout for this alignment:**

```text
/Users/admin/Desktop/HearIsland/output/my-universe/source
```

Existing branch: `codex/my-universe-prototype`. Base commit: `c85552768424dbefea6c1b2d2cf18942a368494e`. Existing prototype changes are uncommitted. That base is a source revision, not a verification of today's production release.

All participating agents must read/write the following files in this exact checkout. Another worktree of the same Git repository does not automatically see these uncommitted files. Do not duplicate handoffs into another checkout, create a competing application or create a new branch. If another agent cannot access this path, report that access problem before proceeding rather than inventing a separate workspace.

| File | Writer | Purpose / present status |
|---|---|---|
| `UNIVERSE.md` | GPT-6 | Authoritative alignment, technical proposal, decisions and review log. This document. |
| `CLAUDE DESIGN.md` | Claude / Opus | Visual architecture, scene storyboard, controls, asset direction and design acceptance. Completed by Claude (Opus 5.5), 1 November 2026; covered by the coordinated review in §13; not authored by GPT-6. |
| `GEMINI BACKEND.md` | Gemini | Existing service audit, proposed contracts, identity/isolation, persistence and verified unlock requirements. First draft saved 1 November 2026; **factual corrections requested** (see §13.3 and `docs/universe-handoffs/GEMINI CORRECTIONS.md`); not authored by GPT-6 or Claude. |

**Sequence:** overall alignment approved → Claude reads it and writes design → Gemini reads both and writes backend findings/contracts → GPT-6 reviews both and records a coordinated recommendation in this file → Mani approves the coordinated implementation scope before source work begins. Documentation handoffs are not permission to implement, spend money or deploy.

Use one writer at a time in this checkout, as required by AGENTS.md. Each agent updates only its assigned handoff file during alignment, with date, inspected base, proposed versus existing behavior, decisions, unresolved questions and next owner. Do not change another agent's file or imply a response exists before it has been written. The actual Claude request was delivered through the existing Claude Code session; Gemini follows only after the completed design is available.

User direction not to create another branch takes precedence over the general project suggestion to coordinate through separate branches. For this alignment we serialize work in the existing checkout. Gemini retains ownership of server code, rules, indexes and backend scripts; release authorization requirements remain unchanged.

## 3. What exists today

The technical implementation report is:

```text
/Users/admin/Desktop/HearIsland/output/my-universe/
MY-UNIVERSE-TECHNICAL-IMPLEMENTATION-REPORT-2026-11-01.md
```

The current runtime is React plus SVG, not genuine 3D. It has one fixed island, one modular creature, predefined decorative objects, screen-coordinate positioning, manual browser saves and sine-based creature movement. The sample reward chooser is explicitly client-owned demonstration state. There is no authoritative learning unlock, cloud world service, AI generation or shared universe.

Main audited implementation files:

- `src/features/universe/UniversePrototype.jsx`
- `src/features/universe/UniverseArt.jsx`
- `src/features/universe/universeModel.js`
- `src/features/universe/universe.css`
- `src/features/dashboard/SparkUniverse.jsx`
- `src/features/dashboard/MyDashboard.jsx`
- `tests/universe-model.test.js`, `tests/universe-ui.test.jsx`
- `tests/universe-preview/*`

React dependency is `^18.3.1`. Three.js and React Three Fiber are not installed in this checkout. Existing test/build results belong to the SVG prototype; they do not validate the proposed 3D architecture.

## 4. Vision gap and reuse decisions

| Area | Current implementation | Alignment decision |
|---|---|---|
| Landing | Fixed floating-island SVG scene. | Replace as the primary experience with genuine deep-space exploration. Preserve the old files and saves. |
| Universe/galaxies/systems | No navigable hierarchy. | Introduce a stable, data-driven destination hierarchy, with separate visual scales. |
| Planets | Decorative SVG shapes and a sample mini-moon object. | Build actual spherical 3D destinations with lighting, metadata, selection and entry. Existing art is not a suitable planet mesh/material. |
| Environment | One illustrated island, with no walkable/full environment or camera. | Create a separate explorable terrain/atmosphere environment for at least one planet. It must not resemble the rejected floating garden. |
| Camera | Fixed SVG viewBox. | Replace with bounded 3D camera navigation, focus/zoom, travel transitions and accessible alternate controls. |
| Editing | Position/scale/rotation, selection, undo/redo and object list. | Reuse interaction patterns and pure history concepts where relevant later. Screen-coordinate transforms cannot be reused as 3D surface coordinates. |
| State validation | Stable asset IDs, version gate, bounded state and supported-value validation. | Reuse those engineering patterns. Introduce an explicit new scene/content contract; do not silently reinterpret version-1 SVG saves. |
| Creature | Cartoon mushroom/blob/robot, fixed quotes and animation. | Preserve as legacy prototype work. Do not use the mushroom/cartoon style to define the new landing experience. Any future ecology/assets need Claude's visual review. |
| Motion/Calm | Run/pause, manual stepping, hidden-page and inactive-slide behavior. | Reuse lifecycle/accessibility principles, not the old animation as a scientific physics model. |
| Local save | UID-prefixed localStorage, manual save. | Retain only as clearly labeled legacy sandbox. Not a cloud identity or entitlement source. Persistence adapter pattern is reusable. |
| Sample rewards | One demonstration choice; reversible in client history. | Not eligible for real unlocks or migration. Future progression must use Gemini's authoritative service. |
| Shell | Existing Universe slide, lazy invitation, SPARK tokens and return flow. | Reuse the same feature entry and shared shell. No second Universe product or replacement LMS theme. |
| Tests | Pure state/UI tests and responsive preview artifacts. | Retain as regression evidence for the old prototype; adapt general testing patterns and write separate approved tests for new behavior later. |

The SVG island, cartoon objects and decorative planets cannot be presented as genuine 3D, and relabeling them would not meet the brief. Keep the current prototype unchanged while alignment is reviewed. After approval, evolve the existing Universe entry in place; decisions about legacy prototype access and saves must be explicit. Do not delete or overwrite old browser saves or automatically award ownership from them.

## 5. Proposed visual architecture

```text
SPARK shell / My Universe
  Universe overview
    Galaxy focus
      Solar-system focus / destination orbit
        Planet inspection
          Planet environment
            Local scientific interactions / mission workspace
```

This is one feature with navigation state, not separate competing implementations. Back and breadcrumbs restore the prior view, target and camera context.

### Universe overview

- Large, navigable deep-space scene with multiple spatially separated galaxies, distant systems, stars and nebulae.
- Genuine spherical planets at suitable viewing distances; atmospheric lighting and scale cues, not a static wallpaper.
- Minimal overlay: location breadcrumb, destination focus/search, zoom/reset controls and an optional readable destination list.
- Select a galaxy to reveal its identity and a clear Explore action. Avoid loading every planet surface.
- Convey enormous scale through staging and visual depth. Explain that the map is not drawn to astronomical scale; scientific values appear separately with units.

### Galaxy and solar-system view

- Focus into the selected galaxy and expose its systems and planetary destinations.
- Inspect a planet's name, environment, resources, characteristics and available missions.
- Keep **unvisited / discovered** separate from **available / locked / access not connected**. Seeing/selecting a planet does not imply achievement or permission.
- Show a lock reason only when backed by authored requirements; show verified satisfaction only from a trusted service. Preview-only scenarios are explicitly labeled.

### Planet inspection and arrival

- Orbit a lit sphere with a meaningful surface, atmosphere where appropriate, terminator and optional rings/moons according to its authored description.
- Display a compact inspect panel styled with existing SPARK controls. Enter environment is a distinct action.
- Loading is progressive: prefetch the selected environment while its planet is inspected. The travel transition must be interruptible; failed loads leave the inspection view usable.
- Smooth travel for ordinary motion settings; short fade/direct arrival for reduced motion. No forced spinning, auto-drift or long unskippable flight.

### Planet environment

- Load a bounded but real 3D surface region with terrain relief, atmosphere/sky, ground-level viewpoints, structures and multiple inspectable locations.
- Start with a volcanic/basalt research landscape or another Claude-approved sophisticated biome, not the old island garden. The exact planet is a design proposal, not an approved asset commitment.
- Provide environmental phenomena and scientific interactions with purpose: inspect mineral evidence, compare environmental measurements or plan an energy system. Claims must distinguish fictional world values from validated science.
- Surface staging is a planet environment, not simply orbiting a sphere or displaying a terrain image. Separate environment modules permit future biomes without replacing the shell.

## 6. Recommended genuine-3D approach

**Initial proposal, subject to the audit correction above: Three.js directly, hosted by a dedicated React component inside the existing Universe entry.** Because Claude's existing prototype already has a compatible Fiber 8/React 18 stack, the documentation handoff must compare evolving that stack against direct Three.js before making a final recommendation. No dependency is installed, changed or selected by this handoff.

Rationale: it supplies actual mesh/camera/rendering capabilities with one principal runtime addition, preserves the existing React 18 application and lets the first scene/navigation pipeline be evaluated before adding another renderer abstraction. React owns interface/navigation state; the 3D controller owns frame-by-frame camera/object updates and GPU lifecycle. Do not push per-frame camera values through React state.

| Option | Assessment |
|---|---|
| Existing SVG | Useful legacy prototype; cannot satisfy the required 3D landing and planetary environments. |
| Direct Three.js | Recommended initial route. Smaller dependency decision and explicit control; requires disciplined lifecycle, input and resource ownership. |
| React Three Fiber | Viable alternative if the team prefers declarative scene ownership. Official installation guidance pairs Fiber 8 with React 18 and Fiber 9 with React 19. Do not install an incompatible latest major or silently upgrade React. [Official compatibility guidance](https://r3f.docs.pmnd.rs/getting-started/installation). |
| Additional game/physics/postprocessing framework | No demonstrated initial need. Consider only after a specific approved mission or visual requirement justifies it. |

Recommended renderer baseline is WebGL 2 with capability detection and a readable non-3D destination/mission interface when unavailable. Current Three.js WebGLRenderer requires WebGL 2; this must be tested on actual target devices. A fallback must not relabel the old illustrated island as 3D. [Official renderer documentation](https://threejs.org/docs/pages/WebGLRenderer.html).

Camera controls can start with Three.js OrbitControls, which supports orbit, zoom/pan and touch gestures, supplemented by explicit keyboard-accessible destination, zoom, focus and return actions. Those controls still need tuning to avoid conflicts with the dashboard's swipe/arrow navigation. [Official controls documentation](https://threejs.org/docs/pages/OrbitControls.html).

### Proposed module responsibilities, not files already created

- **Universe entry:** existing dashboard feature host, preferences, approved navigation and fallback.
- **Cosmos catalog:** stable galaxy/system/planet/environment IDs, descriptions, authored requirements, manifests and content versions.
- **Exploration navigation:** explicit overview/focus/inspection/environment states, back stack and cancellation.
- **3D renderer controller:** camera, picking, input, render scheduling and lifecycle.
- **Destination renderers:** efficient far-view representations and detailed near-view meshes.
- **Environment loader:** selected surface region, LOD, locations, loading/error/retry states and resource release.
- **Learning adapter:** reviewed mission definitions and server-returned learner readiness; no direct award authority.
- **Progression/persistence adapter:** Gemini's future authenticated contracts; fixture-only until implemented.

Use one active 3D rendering surface for the feature. Use local coordinate systems and staged scene scales rather than literal galaxy-scale coordinates and one enormous mesh scene. Keep astronomical distance/scientific data separate from presentation coordinates. Reuse geometry/materials and batch star/repeated-object rendering. Load a planet's surface only on demand; release no-longer-needed GPU resources with explicit ownership. Three.js requires explicit resource cleanup. [Official cleanup guidance](https://threejs.org/manual/pages/cleanup.html).

## 7. Learning, adaptation and progression

The new mission experience must use age-appropriate scaffolding and demonstrated competency, not one difficulty for every learner. Age alone does not establish readiness. When assessed records are unavailable, offer supported exploration and coach selection without fabricating competency.

**Proposed mission family, not implemented or certified alignment:** plan a spacecraft journey. A younger/scaffolded route might compare supplied energy choices, read a distance diagram and calculate travel time with provided units; an advanced route might examine power/mass trade-offs, unit conversions, assumptions and life-support constraints. They share a driving question but need separately reviewed tasks, supports and assessment criteria. Do not represent advanced propulsion calculations as a trivial fuel-divided-by-distance rule.

Educators must review explicit NGSS performance-expectation mappings, scientific/engineering practices, disciplinary ideas and crosscutting concepts, plus relevant mathematics objectives and evidence criteria. A space theme alone is not NGSS alignment. NGSS organizes expectations by grade/grade band and integrates those science dimensions. [NGSS glossary](https://www.nextgenscience.org/glossary), [instruction and assessment resources](https://www.nextgenscience.org/instruction-and-assessment/instruction-and-assessment).

Destination requirements and mission difficulty are versioned authored content. Gemini returns authoritative learner decisions; the client explains them. Seeing an animation, completing a self-check, submitting evidence or finishing a local scene cannot award mastery. XP and real reward claims stay inactive until a trusted source, verifier scope, ledger and server validation exist. Essential educational tools remain available, and absence/inactivity creates no penalty.

## 8. Performance risks and mitigations

All numbers below are proposed test budgets, not achieved performance or device guarantees.

| Risk | Initial mitigation / verification |
|---|---|
| iPad GPU fill-rate, high pixel density and transparent nebula overdraw | Cap/adapt drawing-buffer resolution, reduce transparent layers and make expensive effects optional. Measure on a physical school iPad. Three.js notes that drawing-buffer sizing needs explicit handling. [Responsive rendering guidance](https://threejs.org/manual/pages/responsive.html). |
| Battery use from constant cosmic animation | Render on input/change when stationary; animate only during travel or meaningful active phenomena; pause hidden/inactive scenes. Demand rendering is an established approach, but implementation must include controlled camera updates. [Demand-rendering guidance](https://r3f.docs.pmnd.rs/next/advanced/scaling-performance). |
| Memory growth while changing destinations | Bounded environment cache; reuse shared assets; explicit dispose/reference ownership; repeat enter/leave tests and monitor renderer memory. |
| Long initial load and shader compilation stalls | Lazy-load the renderer; small overview first; progressively load a selected planet/environment; compile/warm necessary materials where supported; show truthful progress and failure recovery. |
| Astronomical coordinates, clipping and depth precision | Separate presentation scales/local origins for universe, system and surface scenes. No literal all-scale scene graph. |
| Camera sickness and inaccessible gestures | Bounded controls, no default auto-flight, instant/reduced-motion path and complete HTML destination/action equivalents. |
| “Cinematic” target exceeds asset budget | First approve a measured visual slice; use lighting/material quality, composition and authored assets before costly volumetrics/full-screen effects. |
| Endless data/content growth | Stable IDs and manifests, independently loadable environments, schema versions and reviewed migrations; do not keep the full universe resident. |
| Failed WebGL context, device rotation or resume | Capability/resize/context-loss recovery checks; keep mission text and navigation usable; retry without loss of authoritative progress. |

Initial proposal: target at least 30 fps during ordinary navigation on an agreed representative iPad/laptop, with a higher-quality tier only when measured headroom permits; cap initial low-tier render resolution around DPR 1–1.5, and aim for low hundreds rather than thousands of active draw calls in the first slice. Refine budgets after the device spike. Do not report these targets as passed until profiled.

Do not create one canvas per object, preload all planetary environments or add expensive bloom/volumetric effects as mandatory dependencies. Asset sources, licensing, sizes and any model-generation costs require a concrete reviewed asset plan; this alignment authorizes no purchases or provider calls.

## 9. Incremental proposal and complexity

**Only planning is authorized now.** The following stages require design/contract review and approval before implementation.

| Stage | Proposed output | Acceptance gate / complexity |
|---|---|---|
| A. Design alignment | Claude's universe/galaxy/system/planet/surface storyboard, visual references, asset direction, interaction and accessibility plan. | Mani approves a sophisticated space direction that preserves SPARK shell conventions. Medium design effort. |
| B. Technical and device spike | One real sphere, bounded camera/picking, one small terrain scene, progressive load/unload and reduced-motion/fallback paths within the existing feature host. | Proves the chosen rendering path on a physical iPad and laptop; not presented as a finished universe. Medium-to-high engineering effort. |
| C. First aligned exploration slice | Universe landing with at least two discoverable galaxies; one detailed galaxy/system with several inspectable planets; one enterable authored environment; working return/navigation. | Genuine 3D depth, meaningful selection, enterable surface and truthful preview/access states. High visual/content effort. Other destinations may have explicit preview or authored future states. |
| D. Educational mission slice | One reviewed mission family with scaffolded and advanced routes, authored mappings/evidence criteria and defined fallback when assessments are absent. | Educator accepts scientific accuracy, suitability and evidence design. High instructional-design effort. |
| E. Backend integration | Gemini's private-universe persistence, approved progress/readiness and verified progression services when ready. | Tenant/owner isolation, versioning, retries and source verification pass; real rewards remain off until every gate passes. High backend/integration effort. |
| F. Expansion and connected universes | More manifests/environments, reviewed AI proposals and permitted shared snapshots after foundational services exist. | Separate educational/privacy/permissions review; no unrestricted messaging. Future scope, not a first-slice promise. |

The earlier 4–6-day estimate described the already-built SVG prototype. It does **not** apply to this substantially different genuine-3D vision. A delivery estimate should follow Claude's asset scope, the device spike and Gemini's source/contract audit. No replacement schedule is committed in this document.

## 10. Responsibilities and integration boundaries

**GPT-6:** maintain this alignment, review existing work and official technical constraints, reconcile Claude/Gemini handoffs, record conflicts and propose the next bounded implementation milestone. Do not self-approve the revised scope or claim another agent's design/backend work exists.

**Claude / Opus:** read this file and the user's V1.0 vision; write `CLAUDE DESIGN.md` in this checkout. Describe the four-view visual architecture, actual scene/environment direction, camera travel storyboard, SPARK overlay styling, responsive/touch/keyboard controls, reduced-motion alternatives and asset inventory. Clearly distinguish proposals from delivered visuals. Do not start a second Universe or replace existing code before the approval gate. After implementation ownership is approved, preserve shared component conventions.

**Gemini:** read this file and Claude's design; write `GEMINI BACKEND.md` in this checkout. Audit what actually exists on the intended release line. Propose private universe/catalog/progress contracts, entitlement verification, tenant/learner authorization, content publication/review, versioned saves and future shared-snapshot permissions. Verify database edition/conventions before actual schema/rules work. Do not trust the client sample reward or old local prototype as backend evidence. No auth/rules/deployment changes are authorized by this file.

### Documentation dispatch record — 1 November 2026

The exact requests are prepared at:

- `docs/universe-handoffs/CLAUDE REQUEST.md`
- `docs/universe-handoffs/GEMINI REQUEST.md`
- Supporting read-only inventory: `docs/universe-handoffs/STEM-REUSE-AUDIT.md`

**Initial delivery blocker, now resolved:** desktop control originally returned “Computer Use permissions are not granted.” After Mani's “approve go,” access to the existing Claude Code session succeeded. No connected direct Claude/Gemini messaging tools or command-line agents on PATH were found. Claude’s request was delivered and its completed design was saved at the canonical path. Gemini’s request is next. A GPT agent has not been substituted for Claude or Gemini, and their owned documents have not been fabricated.

Claude’s actual design is complete and its final confirmation reports documentation-only changes. Access to the actual Gemini session in Antigravity also succeeded. Gemini's request is to be delivered only after Claude's actual completed design file exists in the canonical checkout. Source code, prototype assets and saves remain unchanged. No tests, builds, dependency installation, branch creation, merges or deployments were performed in this documentation handoff pass.

The cross-agent review is **pending**, not completed: GPT-6 must read the two actual authored documents, reconcile vision and contracts, record conflicts/resolutions and propose a bounded next milestone for Mani's approval. The initial STEM inventory does not substitute for either agent's work.

**Mani + educator:** approve the product/visual slice and learning scope; authorize content review and eventual implementation/release actions explicitly. Match tasks to evidence and support needs. Keep essential educational access independent of reward unlocks.

AI-generated planets/missions are future proposals only. They require reviewed schema/content, educational/scientific/safety quality gates and an authorized publication decision. Shared universes require explicit audience and current permission checks, isolated personal data and supervised collaboration/resource exchange. No unrestricted student communication is included.

## 11. Approval and current handoff state

Mani's received approval covers **this overall alignment and documentation/design handoff**, not source modification or production release:

1. Adopt the official deep-space hierarchy and replace the island as the primary future presentation while preserving all old work.
2. Use the existing My Universe entry and this existing checkout as the single handoff location.
3. Compare direct Three.js with reuse of the existing compatible Fiber stack. Claude recommends evolving Fiber; coordinated review and Mani’s approval are still required before any dependency or implementation change.
4. Ask Claude to write the design proposal, then Gemini to write the backend audit/contracts, before GPT-6 coordinates an implementation request.

| Gate | Status |
|---|---|
| Official V1.0 vision received | Complete |
| Existing prototype/report compared | Complete |
| Reuse/replacement decisions and technical proposal documented | Complete, proposed |
| Mani approval of overall alignment and documentation handoff | Received; implementation approval still required after coordinated review |
| Claude design handoff | Complete: actual Claude / Opus 5.5 authored `CLAUDE DESIGN.md`; no source changes |
| Gemini backend handoff | First draft saved; factual corrections requested from Gemini (§13.3); not yet accepted |
| Cross-agent review | Completed in §13 by Claude on Mani’s instruction after GPT-6/Codex stopped (credit exhausted); conditional on Gemini’s corrections |
| Revised-vision implementation | Not started |
| Dependencies/branches/production changes | None made in this alignment |

The physical API endpoints, data schema, 3D packages/versions, final assets and delivery schedule remain unapproved. This file does not activate XP, expose shared worlds or authorize deployment.

## 12. Evidence and references

- User's official brief: `/Users/admin/.codex/attachments/bd69662d-23ec-45d3-829e-3a643a508790/Pasted text.txt`.
- Existing technical report: `../MY-UNIVERSE-TECHNICAL-IMPLEMENTATION-REPORT-2026-11-01.md`.
- Existing implementation details: `docs/dashboard/my-universe-prototype-handover.md`.
- Prior concept plan: `/Users/admin/Desktop/HearIsland/docs/implementation/MY-UNIVERSE-IMPLEMENTATION-PLAN-2026-11-01.md`. Its island-first direction is superseded by V1.0; its service-integrity concepts require fresh design/contract review.
- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html).
- [Three.js OrbitControls](https://threejs.org/docs/pages/OrbitControls.html).
- [Three.js cleanup](https://threejs.org/manual/pages/cleanup.html).
- [Three.js responsive rendering](https://threejs.org/manual/pages/responsive.html).
- [React Three Fiber installation and React pairing](https://r3f.docs.pmnd.rs/getting-started/installation).
- [React Three Fiber performance guidance](https://r3f.docs.pmnd.rs/next/advanced/scaling-performance).
- [NGSS glossary](https://www.nextgenscience.org/glossary) and [instruction/assessment resources](https://www.nextgenscience.org/instruction-and-assessment/instruction-and-assessment).

Technical sources checked on 1 November 2026. Recommendations and budgets are engineering proposals based on the inspected code and these references, not a tested implementation of the revised vision.

## 13. Coordinated cross-agent review — 1 November 2026

**Who wrote this section.** GPT-6/Codex started this review and then stopped because its credit ran out. Its last recorded status: "Both documents are saved, but my review found factual problems in Gemini's first draft … I'm sending those back for correction before accepting the coordinated plan." On Mani's instruction, Claude (Opus 5.5) finished the review and wrote it here. Claude changed only these handoff records. No source, rules, configuration, dependencies, branches or other agents' documents were changed, and nothing was built, tested, merged or deployed.

**Inspected base.** Canonical checkout `/Users/admin/Desktop/HearIsland/output/my-universe/source`, branch `codex/my-universe-prototype`, HEAD `c85552768424dbefea6c1b2d2cf18942a368494e`. All findings come from reading source at that commit. None is a check of the live environment.

### 13.1 Agreed decisions (proposed; still need Mani's approval)

| Topic | Claude design | Gemini backend | Coordinated recommendation |
|---|---|---|---|
| Renderer | Evolve the existing React Three Fiber 8.17.10 / three 0.169.0 / drei 9.114.0 stack | Assumes the same stack (§2, §11.1) | **Evolve the existing pinned Fiber stack.** Plain three.js is no longer the lead candidate. Confirm it with the device spike before committing to the full slice. |
| Entry | A full-screen exploration view outside the dashboard slide deck (§5.1) | Agrees (§11.1) | **Adopt.** The dashboard slide stays as the way in. |
| First environment | Ocean world, with basalt as the alternative | Uses the ocean world (Thalassa) in examples | **Ocean world, if the device spike passes.** If the animated water or atmosphere doesn't meet the iPad budget, switch to the basalt landscape. |
| Catalog | Data-driven hierarchy with stable IDs | Versioned static JSON on Hosting, with a separate review/staging store | **Accept the direction.** Gemini must settle on one name for the staging store (the draft uses three; see §13.3). |
| Learner exploration state | "Discovered" is a convenience only and never grants access | `users/{uid}/activityProgress/universe-v1` | **Accept the location.** The proposed size and key limits **need new rules** written by Gemini. The current rule lets the owner write any content. |
| Access status | Chips: Charted / Available / Locked / Access not connected / Preview | Proposed `POST /api/universe/access`; on failure, show "not connected" | **Accept as a future contract.** The first slice doesn't depend on it: the real app shows "Access not connected" and previews show labelled "Preview" fixtures. |
| XP/rewards | Off | Off; a Teen-Quest-style ledger blueprint for later | **Off.** The ledger pattern is a future design reference, not something that exists in this codebase (see §13.3). |
| Legacy saves | Preserve them; don't migrate | Confirms this | **Agreed.** Neither prototype's saves are read, migrated or awarded. |

### 13.2 Clarifications carried into the plan

1. **Discovered is not permission.** Seeing, charting or inspecting a destination never makes it Available or Verified.
2. **Previews are labelled.** Sample access states appear only in previews and always show the "Preview" chip.
3. **Waves are scenery, not model output.** Animated ocean swells and weather in the ocean world don't mean Hex-Grid simulates waves or storms. Hex-Grid is a steady-state daily balance model. Gemini's example event `thalassa-storm-2026-w45` (§7) can only be content describing a scenario, unless a new, reviewed model is approved.
4. **No scheduling.** Content descriptions may use the word "weekly", but no scheduler, required participation or penalty is approved.
5. **Separate economies.** Gold Filter Lab's budget and transaction records stay completely separate from Universe progression. Both documents agree.

### 13.3 Gemini draft: factual corrections required before it is accepted

Each item below was checked by reading source at `c855527`:

| # | Gemini claim | What the source shows |
|---|---|---|
| 1 | §1.2: `server/app.js` is "mounted behind `/api/**` rewrite in `firebase.json`" | `firebase.json` has **no rewrites** of any kind. Hosting serves `dist` only. Earlier session evidence also showed the live site had no `/api` rewrite and no deployed server. |
| 2 | §1.2: routes mounted include `/api/school-workspace`, `/api/personalization`, `/api/quest` | `server/app.js` mounts only session, admin/users, admin reference, parents, lti, oneroster, coach/learners and canva, plus inline AI endpoints. `server/routes/` has **no** `quest.js`, `school-workspace.js` or `personalization.js`. These come from the older local workspace line. |
| 3 | §1.2 and §5.2: Teen Quest ledger in `server/routes/quest.js` and `server/lib/quest.js` (transactions, idempotent keys, streaks) is a release-line capability and "pattern benchmark" | **Neither file exists at `c855527`.** It can only be cited as an older local design idea, not as an existing service. |
| 4 | §1.2: closed collections `learnerQuest`, `learnerSpaces`, `learnerPortfolios`, `coachAiConnections` are in `firestore.rules` | **None of these appear** in `firestore.rules` at this commit. They are covered only by the general default-deny rule. |
| 5 | §1.2: `storage.rules` enforces `/users/{uid}/...` and `/schools/{schoolId}/...` | `storage.rules` here matches only `/community/{uid}/{postId}/{filename}` plus a catch-all. |
| 6 | §2.2 and Q3: storing at `activityProgress/universe-v1` "uses existing Firestore rules", with 100-entry and 64 KB caps and "client writes cannot write arbitrary keys" | The existing rule is `allow create, update, delete: if isOwner(userId)`, with **no** key, size or schema checks. Those limits need **new**, Gemini-owned rules and emulator tests. |
| 7 | §3.1: coach reads use `coachSharesClassWith(resource.data)` | The `activityProgress` subcollection rule uses `isCoachOf(userId)`, which reads the learner's user document. |
| 8 | §2.1 example facts: Thalassa "112 kPa" and Ignis "rich in sulfur dioxide" are tagged `real-science` | These are facts about fictional planets, so they must be tagged `fictional-world`. "Real science" is only for sourced, real-world facts reviewed by an educator. |
| 9 | §6: Hex-Grid `MODEL_VERSION = '1.0'`, constant `DENSITY_SEAWATER` | The source has `MODEL_VERSION = 'HexGrid-v1.0'` and `K.seawaterDensity.v = 1025` (tagged DATA). |
| 10 | §7.3: deterministic events using `seedrandom` | `seedrandom` isn't a dependency. Describe it as a seeded deterministic function, not a named package. |
| 11 | §2 diagram: API host is "Cloud Functions" | `functions/index.js` exports only a callable `createLearner`. The Express server's deployment target isn't defined at this commit and is unverified. |
| 12 | §2.1 and Q6: "sub-50ms downloads"; size limits presented as decisions; content hash shown as a commit hash (`…-c855527.glb`) | Label the numbers as proposed budgets, not measurements. Use a content hash of the asset, not a source commit. |
| 13 | §8.2: "Strict COPPA / FERPA Compliance" | Reword as privacy design goals. Compliance needs a legal or privacy review, not a design document. |
| 14 | Staging store has three names: `cosmosCatalogDrafts`, `adminUniverseDrafts`, `admin/universe/draftBlueprints` | Choose one proposed name. |
| 15 | §1.1: parent `697f785` "matches current live release bundle" | That's true from an earlier session's check. Today it should be labelled "per earlier verification; not re-checked". |

The rest of Gemini's draft is consistent with the code and with Claude's design:
- the overall statement that nothing exists for My Universe yet
- the Gold Filter Lab collections and their isolation
- Hex-Grid and Plant Lab using `activityProgress` plus `localStorage`
- SO₂ using `simulations`/`simulationResults`
- the `checkRateLimit` helper being in `server/app.js`
- the answers on the legacy saves

The correction request is at `docs/universe-handoffs/GEMINI CORRECTIONS.md`. Gemini edits its own file. No other agent has rewritten `GEMINI BACKEND.md`.

### 13.4 Proposed next milestone (needs Mani's written approval; not started)

**Stage B: technical and device spike.** Its scope:
- one real planet sphere with bounded camera and picking
- one small piece of terrain
- staged travel between levels, with a reduced-motion version
- loading, then unloading with memory checks
- the non-3D list fallback

It lives inside the existing Universe entry and uses fixture data only. There's no backend, no new collections, no rules and no XP.

Decisions Mani needs to make before Stage B starts:
1. Approve installing the pinned versions `three@0.169.0`, `@react-three/fiber@8.17.10` and `@react-three/drei@9.114.0` into the canonical checkout, or say otherwise.
2. Choose where the work happens. `AGENTS.md` asks for feature branches, but this handoff has used no new branch. Either continue in `codex/my-universe-prototype`, or approve one named feature branch.
3. Name the physical iPad and laptop to measure on, and who runs the measurements.
4. Decide how the 3D artwork will be sourced (procedural, CC0 packs or a commissioned artist). Stage B can be procedural only.
5. Confirm the first environment: ocean, with basalt as the fallback.

Other conditions:
- **Backend work comes after Stage B, owned by Gemini:** rules for `universe-v1`, the catalog store, the access endpoint, and a defined server deployment target with a `/api` rewrite. It goes on a separately approved, emulator-first plan, after Gemini's corrections are accepted.
- **Educator review** is still required before any mission, NGSS mapping or "real science" fact is published.

### 13.5 Review status

| Item | Status |
|---|---|
| Date | 1 November 2026 |
| Claude design | Accepted as the design baseline (proposed) |
| Gemini backend | Accepted in direction; **factual corrections pending (§13.3)** |
| Coordinated recommendation | §13.1–§13.4 above |
| Implementation | **Not started. Still awaiting Mani's approval.** This review doesn't approve itself |
| Changes made in this pass | `UNIVERSE.md` (§2 table rows, §11 gate rows, this §13) and the new `docs/universe-handoffs/GEMINI CORRECTIONS.md`. No code, rules, configuration, tests, dependencies, branches or deployments |

### 13.6 Mani's approval — 1 November 2026

Mani replied **"go approve"** to the §13.4 recommendations. Claude reads this as approval to **start Stage B (technical and device spike) only**:

- **Packages:** install the pinned `three@0.169.0`, `@react-three/fiber@8.17.10` and `@react-three/drei@9.114.0`.
- **Branch:** work continues in `codex/my-universe-prototype` in this checkout. No new branch was created.
- **Artwork:** generated in code only. No purchases, paid services or AI asset generation.
- **First environment:** the ocean world.
- **Data:** fixture data only.
- **Not included:** backend changes, rules, collections, XP, commits, pushes, merges or deploys.

Physical iPad and laptop measurements remain open. Mani still needs to name the devices and who measures them. Stage C, the full first slice, needs separate approval after the spike results. The SVG prototype and the 3D island prototype stay untouched.

### 13.7 Stage B spike: built and checked in a browser — 1 November 2026 (Claude)

**What was built** (uncommitted, branch `codex/my-universe-prototype`, base `c855527`):

New code in `src/features/universe/explore/`:

| File | Purpose |
|---|---|
| `cosmosFixture.js` | Fictional fixture catalog |
| `explorerModel.js` | Pure navigation and access model |
| `proceduralTextures.js` | Planet, nebula and ring textures generated in code; no downloaded art |
| `ExplorerScene.jsx` | The space levels and the camera rig |
| `ExplorerEnvironment.jsx` | The ocean surface, as its own lazy-loaded chunk |
| `ExplorerTextView.jsx` | The complete non-3D view |
| `MyUniverseExplorer.jsx` | The full-screen host |
| `explorer.css` | Styling |

Changes elsewhere:
- **Dashboard entry:** a new "Enter My Universe" plate in `SparkUniverse.jsx`. The SVG prototype invitation is unchanged.
- **Dependencies:** `three@0.169.0`, `@react-three/fiber@8.17.10` and `@react-three/drei@9.114.0` added, exact versions, React 18.3.1 deduplicated.
- **Tests:** `tests/universe-explorer-model.test.js` and `tests/universe-explorer-ui.test.jsx`.
- **Device-spike page:** `tests/universe-preview/explorer.html` with URL scenarios `?calm=1`, `?fail=1`, `?text=1` and `?metrics=0`.

**What works:**
- **Navigation:** Universe (two galaxies, uncharted background) → Lyra Spiral → Lyra Prime (three planets, not to scale) → planet inspection → landing on Thalassa Research Station, with four inspectable locations and a glide to each.
- **Getting around:** breadcrumbs, Back and Esc. Clicking, tapping, any key or scrolling completes a camera move at once.
- **Reduced motion and Calm:** instant cuts, and the sea stops moving.
- **Rendering:** on demand when the view is still. The surface is downloaded while its planet is inspected.
- **Landing failure:** the planet view stays usable, with Try again and the text view.
- **No WebGL 2 or a lost 3D context:** the full text view opens instead.
- **Status labels:** sample labels everywhere (Preview, Fictional world, Sample requirement). Gated planets read "Access not connected" outside previews. No XP, saves, Firebase or backend.
- **Keyboard:** arrow keys rotate, `+`/`-` zoom, R resets, L switches to text. Key presses don't reach the dashboard slides underneath.

**Results:**
- **Tests:** 24 of 24 universe tests pass (14 original and 10 new). All 537 unit tests in `npm run test:unit` pass. The production build succeeds.
- **Bundle:** the explorer loads only on entry, as its own chunk of about 237 KB gzipped. The ocean surface chunk is about 2.7 KB gzipped. The main bundle is 266 KB gzipped and contains no 3D code.
- **Headless Chrome counts, desktop size:**
  - 8–25 draw calls in space and about 45 on the surface
  - about 85k triangles on the surface at high detail
  - textures fall from 11 to 1 on landing and return to 11 in orbit, with no growth over one round trip

  The frame rates measured here come from Chrome's software renderer, so **they are not device benchmarks.**
- **Screenshots:** `../review/explorer-spike/1-universe.png` to `12-text-view.png`.

**Still to do (not done here):**
1. Physical iPad and laptop measurements. Mani still needs to name the devices and who measures them.
2. The browser Back button isn't connected to the explorer's back stack.
3. The metrics readout keeps its last sample while the view is idle.
4. Art quality: the headland and planet surfaces are generated in code and serviceable, but final art direction is still open.
5. Screen-reader and real touch testing.
6. The 10-cycle enter/leave memory test from CLAUDE DESIGN §8.3.

Stage C, the full first slice, needs Mani's approval after the device results. Nothing has been committed, pushed, merged or deployed.

### 13.8 Stage B follow-up items closed — 1 November 2026 (Claude)

These four were in the §13.7 "still to do" list; all four are now done.

| §13.7 item | Result |
|---|---|
| 2. Browser Back | Each level inward adds a same-URL history entry. The hash router only listens to `hashchange`, so it ignores these. Back returns one level and keeps the previous place focused, and Forward restores the deeper path. Breadcrumb jumps, the text-view jump and Leave remove the explorer's entries quietly. Checked in headless Chrome: Back twice, Forward once, breadcrumb home. |
| 3. Idle metrics | Renderer counts now update on every rendered frame, including on-demand frames. The frame rate updates once a second. |
| 6. Repeated enter/leave memory | Landing and returning 10 times: the planet view settles at 7 geometries and 5 textures, with no growth. Leaving and re-entering, then landing, 10 times: the JS heap after garbage collection went 27 → 30–38 → 33 MB and didn't keep climbing. These come from headless Chrome's software renderer and **are not iPad results**. |
| 5. Accessibility (automated part only) | Chrome's accessibility tree shows 0 unnamed controls. Heading structure is correct, and the live region describes each view. Screen-reader and real touch testing are still needed. |

Tests: 24 of 24 universe tests and 537 of 537 unit tests pass. The build succeeds.

**Still open:**
1. Physical iPad and laptop measurements. Mani still needs to name the devices and who measures them.
2. Manual VoiceOver and touch testing.
3. Final art direction.
4. Gemini's 15 corrections. The request is in `docs/universe-handoffs/GEMINI CORRECTIONS.md` and hasn't been delivered yet.

Stage C still needs Mani's approval after the device results. Nothing has been committed, pushed, merged or deployed.

### 13.9 Performance on this Mac — 1 November 2026 (Claude)

Mani asked to focus on this Mac first and adjust for other devices later. Measured on an **Apple M5 MacBook (Mac17,3), Chrome with Metal GPU rendering, 1280×832 at Retina 2×**. These are real GPU measurements, counted as frames actually drawn over each interval.

| View | High detail | Standard detail |
|---|---|---|
| Universe, camera drag | 60 fps | 60 fps |
| Travel into the galaxy / into the system | 60 / 58 fps | 60 / 59 fps |
| Galaxy, system and planet, camera drag | 60 fps | 60 fps |
| Landing transition | 59 fps | 60 fps |
| Ocean surface, six 10-second samples over 1 minute | 60 fps each | 60 fps each |
| Standing still | 0 frames (renders nothing) | 0 frames |

The surface is about 85.6k triangles at High and 35.1k at Standard, with 45 draw calls. No errors and no slowdown over the minute. **This Mac meets the proposed 30 fps budget with plenty to spare.**

Also fixed: the spike's readout now shows the real rate while dragging, and "idle" when nothing is drawn.

**Other devices.** iPads, other laptops and Chromebooks are deferred by Mani's decision. The interface will be adjusted for them later. These results say nothing about older or weaker devices.

**Next for Gemini.** `docs/universe-handoffs/GEMINI NEXT.md` asks for five documentation-only items:
1. the 15 corrections
2. matching the catalog contract to the explorer fixture
3. a server deployment and `/api` rewrite proposal
4. the `universe-v1` rule text and tests
5. a 3D asset hosting plan

### 13.10 Gemini update reviewed; galaxy visuals fixed — 1 November 2026 (Claude)

**Gemini's update to `GEMINI BACKEND.md` was checked against source.**

Accepted:
- **The 15 first-round corrections:** all applied correctly. One of them is more accurate than Claude's request: `storage.rules` also covers `/messages`, `/solarCar` and `/canva-exports`. Claude's correction #5 had said "only `/community`", which was wrong.
- **The catalog contract:** matches `cosmosFixture.js` field for field.
- **In direction:** fact objects with a string normaliser, session version pinning, the Cloud Run vs Cloud Functions comparison and the five-step "go" checklist, and the asset hosting plan.

**Second round of fixes requested** (`docs/universe-handoffs/GEMINI CORRECTIONS 2.md`):
1. The proposed rule uses `request.resource.size()`, which doesn't exist in Firestore rules. The 64 KB cap does nothing, and test 9 would fail.
2. `activeDestination` fields are read directly, so a save made at galaxy level would be denied.
3. The test suite's project ID is derived from the live project name. The convention is `demo-hearisland-rules`.
4. `revision` isn't enforced as increasing.
5. The stored preferences don't match the explorer's settings.
6. The requirement text should come from the catalog only.
7. §12 is out of date: the packages are installed and the spike is built.
8. Remove or label unsupported numbers: "budgets ensure 60 fps", and the cold-start figure.

None of these rules are applied anywhere. They remain proposals.

**Galaxy views** (reported by Mani from a screenshot of the Aurora Elliptical view):
- The "Not charted" labels sat on the galaxy, and the galaxy rendered as a white blob of oversized dots.
- **Fixes:**
  - Elliptical galaxies now have a centrally concentrated golden distribution with smaller, fainter stars.
  - Spiral close-ups use more, finer stars and proportionally wider arms.
  - Uncharted markers sit in the outer halo on the open side of the view, clear of the core and the side panel.
- Checked on the M5 GPU: universe, Aurora and Lyra views.

### 13.11 Gemini round 2 accepted — 1 November 2026 (Claude)

All 8 items in `GEMINI CORRECTIONS 2.md` were checked against `GEMINI BACKEND.md`:
1. The non-existent size check is removed. It's replaced by per-field bounds: IDs up to 64 characters, lists up to 100 entries.
2. `activeDestination` uses `.get(field, null)`, and test 3 covers a save at galaxy level.
3. The test project ID is `demo-hearisland-rules`.
4. The claim that `revision` always increases is dropped. It's kept as an integer of 0 or more, so `arrayUnion` merges still work.
5. Preferences are now `detail: 'standard' | 'high'`.
6. The catalog is the only source of requirement text. The access response returns `status`, `evaluatedRule` and `isVerified`.
7. §12 is updated: packages installed, Stage B done.
8. Size budgets are reworded, and the cold-start figure is labelled unverified.

**`GEMINI BACKEND.md` is accepted as the backend proposal baseline.**

Non-blocking note for implementation: the rule reads `schemaVersion`, `revision`, `lastUpdated`, `activeDestination`, `charted.{galaxies, systems, planets}` and `preferences` directly. A write missing any of them is therefore denied. This fails safe, but the save code must always send the complete envelope. Consider `keys().hasAll([...])` so the requirement is explicit.

**Documentation alignment is complete:** `UNIVERSE.md`, `CLAUDE DESIGN.md` and `GEMINI BACKEND.md` are consistent.

**Next decisions for Mani:**
- **Stage C:** replace the fixture with a catalog JSON in the same shape. This is client-only and can be done on this Mac.
- **Backend:** separate written "go" steps for each item in Gemini's §11.1 checklist (server target, billing/IAM, `/api` rewrite, the access route, staging), and for adding the `universe-v1` rules.

### 13.12 Stage C: explorer runs on the published catalog — 1 November 2026 (Claude)

Mani said **"go"** to the Stage C option in §13.11. Scope: this Mac, front end only. No server, rules, Firebase or deploy changes.

**What changed:**
- **One content source.** `public/cosmos/v1/catalog.json` (version `1.0.0`) replaces the built-in fixture, and `cosmosFixture.js` was removed. The app, the preview page and the tests all read this one file. It follows the contract accepted in `GEMINI BACKEND.md` §2.1. Facts are `{ text, tag, annotation }` objects, and every one is tagged `fictional-world`. Vite copies the file into `dist/cosmos/v1/`.
- **Validated loading.** `src/features/universe/explore/cosmosCatalog.js` loads the catalog and checks it completely before use:
  - IDs are well formed and unique, and every reference resolves in both directions
  - galaxy type, planet kind, access and fact tags come from fixed lists
  - colours must be `#rrggbb` values
  - positions are 3-number vectors
  - gated planets need requirement text
  - **`real-science` facts must name a source**
  - each environment's `sceneKind` must have a renderer, and the renderer's required locations must exist

  An invalid or unreachable catalog shows "The universe map didn't load" with Try again. Previews also list the problems. A partial universe is never rendered.
- **Version pinning.** A visit keeps the version it opened with. Returning to the overview fetches the catalog again, bypassing the cache. If a newer version exists, the explorer offers "Load it" and never swaps mid-journey.
- **Explicit catalog.** The model, scene and text view now receive the catalog as an argument (`childrenOf(entry, cosmos)` and so on) instead of importing fixed data.

**Contract addition for Gemini.** Environments carry `sceneKind` (currently only `ocean-station`), which tells the client which surface renderer to load. Add it to `GEMINI BACKEND.md` §2.1 the next time that document is edited.

**Checks:**
- **Tests:** 31 of 31 universe tests pass: 24 existing, 6 new catalog tests (validity, broken references, sources for real science, unsafe values, string facts, HTTP and cache behaviour), and 1 new UI test for load failure and Retry. All 537 unit tests pass, and the build succeeds.
- **Walkthrough on this Mac's M5 GPU:** every level renders at 60 fps from the published file.
- **Version pinning, browser test:** a version `1.1.0` was published mid-visit. The visit stayed on `1.0.0`, the offer appeared on returning to the overview, and "Load it" showed the renamed galaxy.
- **Screenshots:** `../review/stage-c/`.

Nothing is pushed or deployed. Backend steps still need Mani's separate written "go" for each.

### 13.13 Second landable world: Ignis Fissure Field — 1 November 2026 (Claude)

Mani said "go ahead" to the Ignis option in §13.12. Front end and catalog only.

**Catalog `1.1.0`:**
- Ignis becomes `public`, with the new environment `ignis-fissure-field` (sceneKind `basalt-fissures`) and four locations: sensor station, glowing fissure, basalt columns and gas vent.
- **Boreas takes over as the gated example**, with a sample requirement. It has no landing site, so nothing that was enterable becomes unreachable.
- Every new value is labelled as a fictional world value or as illustrative. The fissure glow and the gas plume are explicitly "illustrative, not simulated". The vent is marked as a possible future site for the SO₂ → sulfate investigation; it doesn't run that model.

**Renderer:** `ExplorerBasaltEnvironment.jsx`, a separate lazy chunk. It's procedural:
- terrain with a raised terrace and a sunken fissure
- columnar basalt as **one instanced mesh** (hundreds of columns, one draw call)
- a glowing fissure floor with four warm lights
- a gas plume of sprites that holds still under reduced motion or Calm
- a sensor station

The sky and location beacons now come from a shared `environmentKit.jsx` that both surfaces use.

**Checks:**
- **Tests:** 32 of 32 universe tests pass, including a new test that both surfaces can be landed on. Boreas covers the locked and "Access not connected" cases. All 537 unit tests pass, and the build succeeds.
- **Apple M5, Retina 2×, High detail:** the Ignis surface ran at **60 fps** over 10 seconds, with 39 draw calls and about 72k triangles. No errors.
- **Screenshots:** `../review/stage-c/17` to `24`.

**Housekeeping note:** the top-level `/Users/admin/Desktop/HearIsland/node_modules` was found empty during this work. Claude didn't touch it; another process may be reinstalling. The canonical checkout's own `node_modules` is intact.

### 13.14 First mission (draft) and backend Go 1 — 1 November 2026 (Claude)

**Mission: "Plan a journey to Ignis"** (the spacecraft example from the V1.0 vision). It's a **draft awaiting educator review**.
- **Content:** `src/features/universe/missions/spacecraftJourney.js`. One driving question with two routes the learner chooses between; age is never used to choose.
  - **Guided:** compare three engines, then time = distance ÷ speed (seconds → days), then the crew's food, then a reflection.
  - **Advanced:** propellant for chemical vs. ion engines with the rocket equation, the supply cost of the slower trip, solar-panel area near Ignis with the inverse-square law, then a reflection.
- **Labels:** world values are fictional and tagged. The two formulas are tagged real science with a source, marked "educator review pending". Five model limitations are shown to learners.
- **Answer key:** answers are computed from the givens in code, and an independent test recomputes them. The chemical trip length is consistent across both routes (42 days).
- **Self-checks:** `missionModel.js` reads typed numbers ("19,070", "41.7 days") and responds Correct / Close (within 10%) / Not yet / not a number. It also offers hints and a worked solution. **Nothing is marked, saved, rewarded or unlocked.** A test checks that `localStorage` is untouched.
- **Where it appears:** "Missions here" on Thalassa and Ignis, in the 3D panel and the text view. The mission opens as an HTML dialog with a backdrop; Esc or the backdrop closes it. **Drafts appear only when `preview` is on**; outside previews the panel says "No reviewed missions yet".
- **Educator pack:** `docs/universe-missions/SPACECRAFT-JOURNEY-REVIEW.md`. It contains the content and answer key (generated from the source), the limitations, *candidate* standards marked unconfirmed, draft evidence criteria, reviewer questions and a sign-off table. The status may move to `reviewed` only after that sign-off.
- **Checks:** 39 of 39 universe tests pass, including 5 new mission tests and 2 new mission UI tests. Screenshots: `../review/stage-c/25` to `29`.

**Backend Go 1: decided by Mani as Cloud Functions 2nd gen** (`onRequest` wrapping the Express app). Recorded in `docs/universe-handoffs/GEMINI BACKEND GO-1.md`, which asks Gemini for documentation only: record the decision, write the exact Go 3 changes for approval, and list what Mani must confirm for Go 2. Go 2 to Go 5 and any rules change remain unapproved.

### 13.15 PR status and Go-1 review — 1 November 2026 (Claude)

- **PR #3 was the dashboard release** (`release/dashboard-on-live`, `697f785`), not Find a Quest. Claude had mislabelled it earlier. It was merged into `main` (`4d8eb69`), so `main` now matches the dashboard release line.
- **Find a Quest (`c855527`) never had its own PR.** PR #4 now targets `main` and contains **Find a Quest plus the 9 My Universe commits** (10 commits, 73 files). Merging #4 would also merge Find a Quest. That's Mani's decision. Merging deploys nothing.
- **Gemini's Go-1 write-up** in `GEMINI BACKEND.md` §11.1 is accepted. The Go 3 proposal has a packaging gap: the functions source folder can't import `../server`, there's no `functions/package.json`, and `firebase-functions` isn't installed. This must be solved before Go 3 is approved; details are in `GEMINI BACKEND GO-1.md`.

### 13.16 Pre-launch fixes for the live dashboard — 1 November 2026 (Claude)

Mani asked to go live. A pre-flight check found two problems with shipping the branch as it was:
1. **The dashboard opened the explorer in preview mode.** In production that would have shown real students the **unreviewed draft mission** and "Locked · Preview" chips.
   - **Fix:** `SparkUniverse` now opens it with `preview={false}`. Drafts are hidden ("No reviewed missions yet"), and Boreas reads "Access not connected".
   - A banner still states "Fictional worlds for exploring · nothing is saved · no XP, rewards or unlocks". Previews keep their "Sample universe" banner.
2. **The superseded SVG island prototype card would have gone live** next to the explorer.
   - **Fix:** removed from the dashboard only. The prototype code, its tests and its preview page are unchanged, and it's no longer in the production build.

Find a Quest (merged in PR #5) is hosting-only, with honest "not connected" states, so it's safe to release. The production build uses the built-in public Firebase web configuration, and sample data can't be enabled in production. Tests: 39 of 39 universe and 537 of 537 unit tests pass. The build succeeds.

### 13.17 Release: My Universe live — 1 November 2026 (Claude, on Mani's "let's go live")

| Item | Value |
|---|---|
| Source | `codex/my-universe-prototype` at `44b3abc` (= `main` + My Universe + the pre-launch fixes in §13.16) |
| What went live | My Universe explorer (both worlds, catalog 1.1.0, text view; non-preview mode, so drafts are hidden and Boreas reads "Access not connected"), on top of the existing dashboard and Find a Quest |
| What did NOT change | No server, Cloud Functions, Firestore/Storage rules, indexes or data. Backend Go 2–5 are still unapproved. |
| Before the release | Live bundle `index-B4Yd8WjY.js` (dashboard + Find a Quest, released 18:04 local). Saved to channel **`pre-universe-20261101`**: https://dnd-master-73449--pre-universe-20261101-iu343mbr.web.app |
| Tested preview | Channel `universe-release` (expires 8 Nov 2026): https://dnd-master-73449--universe-release-rhfgit4f.web.app |
| Release method | `hosting:channel:deploy universe-release`, verified, then `hosting:clone universe-release → live`. Hosting only; never a bare `firebase deploy`. |
| Live after | `index-CemmqLyW.js`, `/cosmos/v1/catalog.json` = 1.1.0, explorer and both surface chunks return 200. The only 404 is `/favicon.ico`, which was already missing before. |
| Rollback | `npx firebase hosting:clone dnd-master-73449:pre-universe-20261101 dnd-master-73449:live --project dnd-master-73449` |

**Follow-up:** `main` doesn't yet contain My Universe. Merge PR #4 so that `main` matches production.

### 13.18 Go 4 decided: a coach-approved mission unlocks a planet — 1 November 2026

- **Decision (Mani):** a locked planet opens only when the server holds a coach-approved submission of a linked mission. The browser, self-checks and simulation outputs never unlock anything.
- **Specification:** `docs/universe-handoffs/GEMINI GO-4.md`:
  - server-only `missionSubmissions`
  - learner submit and coach review endpoints
  - drafts rejected in production
  - a server-side mission registry
  - an `unlock: { type: 'mission-approved', missionId }` link from planets
  - emulator tests
- **Build:** Gemini (emulator only), then Claude's front end (submit button, live access status, coach review list).
- **Status:** no deploys; Go 5 still needs Mani's "go".
- **PR housekeeping:** PR #4 was merged at `b87843a`, before the pre-launch fixes. PR #6 brings `main` up to the live release (`44b3abc`, `b2d6c0a`, `f3dd3fb`). Claude could not merge it (the merge was blocked by a safety check), so it is waiting for Mani.

### 13.19 First STEAM integration: Thalassa Research Station workstations — 1 November 2026 (Claude)

Mani asked to start integrating the existing STEAM simulations into the planets, beginning with Thalassa. Built on branch `feature/thalassa-workstations` (a separate worktree, so Gemini's backend branch is untouched). **Drafts awaiting educator review**, hidden from students.

**Workstations:** catalog 1.2.0 adds an optional `workstations` list to locations (`mission` or `simulation`, validated).
- **Weather mast → mission "Is the wind worth it?"** A fictional 168-hour wind record turns into a turbine capacity factor (168 h → 56.5 full-power h → 0.34). It also explains why averaging wind speed fails, since power grows roughly with the cube of speed.
- **Research platform → simulation "Platform design lab".** It opens **Project Hex-Grid, Thalassa edition**:
  - separate project and save slot (`hex-grid-thalassa`), so a learner's Bangkok city is never touched
  - 200 people, 1,800 mm rain, wind left for the learner to measure
  - six graded challenges checked live against the model: floating, water and wastewater, day power, food, night power, the whole station
  - the Bangkok brief is replaced by a pointer to the Thalassa brief; roles are unchanged
- **Feasibility, tested:** every goal at once is reachable only with the survey's capacity factor and 1 MW turbines (12 designs found). Without wind data, the best design reaches 19% on its weakest goal. A test keeps this true.

**Honesty:**
- Hex-Grid's limits are shown: a daily average with no tides, waves, storms or seasons, and Earth (Thailand) data for people's needs.
- The tide gauge, swell and vent remain scenery. They aren't connected to this simulation.

**App changes:**
- `navigate(view, { scenario })` carries the scenario to Hex-Grid. Every existing call is unchanged.
- The dashboard passes `onOpenActivity` to the explorer, and workstations are shown only for reviewed content or in previews.

**Review pack:** `docs/universe-missions/THALASSA-STATION-REVIEW.md`, generated from the source.

**Tests:** 47 of 47 universe tests (8 new) and 537 of 537 unit tests pass, and the build succeeds. The preview page `tests/universe-preview/hexgrid-thalassa.html` uses an offline Firebase stub, so preview pages can't reach any Firebase project.

**Screenshots:** `../review/stage-c/30` to `33`.
