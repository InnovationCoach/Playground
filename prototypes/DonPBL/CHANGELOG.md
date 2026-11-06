# Don's PBL Prototype Changelog

**Repository:** `https://github.com/InnovationCoach/Playground`  
**Working Branch:** `DonPBL`  
**Prototype Root:** `prototypes/DonPBL/`  
**Last Updated:** October 20, 2026

---

## Change Log Entries

### [2026-10-21] - Added "Project Vital Flow: Biomedical Engineering & Closed-Loop Fluid Dynamics" PBL
- **Program Curriculum (`prototypes/DonPBL/vitalFlowProgram.ts`):**
  - Added `VITAL_FLOW_PROGRAM` (`id: 'project-vital-flow-2026'`), a 12-week, 120-hour, 24-session curriculum structured across all 7 Design Thinking phases (`explore` [1, 1], `empathise` [2, 2], `define` [3, 4], `ideate` [5, 6], `prototype` [7, 9], `test` [10, 11], `share` [12, 12]).
  - Incorporated the Weekly Studio Rhythm (Monday–Friday, 2 hrs/day), the 3 Core Deliverables (`1. Working Circulatory Prototype`, `2. Biomedical Engineering Blueprint`, `3. Clinical Evaluation & Cost-Benefit Report`), all hands-on activities (`Activity 1.1: The "Why Don't We Explode?" Inquiry`, `Activity 1.2: Fluid Mechanics Discovery Lab`, `Activity 1.3: The "Gravity Challenge" & Extremity Survey`, `Activity 2.1: The Vascular Bottleneck Audit`, `Activity 2.2: The One-Way Valve Lab`, `Activity 3.1: 60-Minute Rapid Syringe-and-Tube Sketching`, `Activity 3.2: Full-Scale Anatomical Blueprint Studio`, `Activity 4.1: Constructing the Dual-Chamber Pump & Lung Loop`, `Activity 4.2: Extremity Branching & Capillary Network Build`, `Activity 4.3: Finalizing the Biomedical Engineering Blueprint`, `Activity 5.1: The 60-Second Continuous Perfusion Stress Test`, `Activity 5.2: Clinical Data Analysis & Cost-Benefit Report`, `Activity 6.1: Preparing the Medical Device Pitch`, `Activity 6.2: The Biomedical Engineering Symposium`), and the Circulatory System anatomical reference pathways (Common Carotid, Subclavian, Aorta, Vena Cava, Pulmonary Artery/Veins, Brachial, Radial, Ulnar, Digital, Iliac, Femoral, Great/Small Saphenous, Tibial, Peroneal, Arcuate, Dorsal Digital).
- **Interactive Simulator & Gamification (`prototypes/DonPBL/ui/components/VitalFlowSimulator.tsx` & `engine.ts`):**
  - Added `simulateVitalFlowCirculation` in `engine.ts` and `VitalFlowSimulator.tsx` featuring an interactive Closed-Loop Pump & One-Way Valve Lab, 5-Zone Anatomical Vascular Blueprint & Extremity Branching Inspector, 60-Second Continuous Perfusion Stress Test & V1.0 vs. V2.0 Clinical Data Table, and WeLearn 7 Future Skills & 7 Gamification Badges.

### [2026-10-21] - Added "Smart Cities & Adaptive Infrastructure: Kinetic and Smart Energy Harvesting" PBL
- **Program Curriculum (`prototypes/DonPBL/kineticEnergyProgram.ts`):**
  - Added `KINETIC_ENERGY_PROGRAM` (`id: 'kinetic-smart-energy-2026'`), a 12-week, 120-hour, 24-session curriculum structured across all 7 Design Thinking phases (`explore` [1, 1], `empathise` [2, 2], `define` [3, 4], `ideate` [5, 6], `prototype` [7, 9], `test` [10, 11], `share` [12, 12]).
  - Incorporated the Weekly Studio Rhythm (Monday–Friday, 2 hrs/day), 3-student multidisciplinary engineering pod roles (`Mechanical & CAD Lead`, `Electrical & Power Conditioning Lead`, `Urban Systems & Telemetry Lead`), and all hands-on activities (`Activity 1.1: The "Human Watt" Challenge`, `Activity 1.2: Thermal Gradient Harvesting`, `Activity 1.3: Kinetic & Thermal Heatmap Safari`, `Activity 2.1: DIY IoT Footstep & Thermal Counter`, `Activity 2.2: The "Lossless" Rectifier Lab`, `Activity 3.1: 60-Minute Cardboard Kinematics`, `Activity 3.2: Digital Twin Retrofit Studio`, `Activity 4.1: Piezo/Hybrid Array Matrix Soldering`, `Activity 4.2: Smart Tile Telemetry Build`, `Activity 4.3: Full-Sheet Engineering Blueprint Production`, `Activity 5.1: The 1,000-Footstep Stress Test`, `Activity 5.2: The "Honest ROI" Financial Simulator`, `Activity 5.3: Interactive Civic Pitch & Live Watt-Meter Demo`).
- **Interactive Simulator & Gamification (`prototypes/DonPBL/ui/components/KineticEnergySimulator.tsx` & `engine.ts`):**
  - Added `simulateKineticHarvesting` in `engine.ts` and `KineticEnergySimulator.tsx` featuring a 1N5819 Schottky vs. 1N4007 Silicon full-wave bridge rectifier bench (`1000µF` 50-step capacitor charge test), `<5.0mm` ADA trip-free deflection check, 3-Panel A1/Arch D Architectural & Electrical Blueprint checklist, 1,000-Footstep Stress Test & Honest ROI Financial Simulator (comparing grid kWh payback vs. batteryless IoT footfall sensor co-benefits across 1 / 100 / 10,000 units), WeLearn 7 Future Skills table, and 7 claimable gamification badges.

### [2026-10-21] - Replaced with "Project Exodus: Building Our New Home in Space" PBL
- **Program Curriculum (`prototypes/DonPBL/interstellarArkProgram.ts`):**
  - Replaced `Engineering Humanity's Next Horizon` in `INTERSTELLAR_ARK_PROGRAM` (`id: 'interstellar-ark-horizon-2026'`) with **Project Exodus: Building Our New Home in Space**, structured across all 7 Design Thinking phases (`explore`, `empathise`, `define`, `ideate`, `prototype`, `test`, `share`), `durationWeeks: 12` (10h/week, 120h total), and `totalSessions: 24`.
  - Incorporated all 12 weekly descriptions and exact hour allocations (Week 1 Human Needs Chart, Week 2 Goldilocks Planet Fact File, Week 3 500-Person Food/Water & Recycling Loop Map + Thai Baht Budget, Week 4 New Planet Rulebook, Week 5 Spaceship Rooms & Layout, Week 6 Ship Repair Guide, Week 7 Paper Blueprints / Tinkercad / FreeCAD / Blender 3D Models, Week 8 Physical Model with Color Coding & Cutaway Windows, Week 9 Space Emergency Game, Week 10 Rulebook Testing, Week 11 Preparing the 4-Part Big Pitch, Week 12 Space Launch Showcase & Digital Learning Folder).
  - Embedded all **6 Space Emergency Game Cards** (Part 1: Cards 1–6), the **7-section New Planet Rulebook Worksheet** (Part 2 Fill-in-the-Blank Template), **What You Need to Hand In**, and the **How You Will Grow: WeLearn Future Skills Guide** (`Getting Started`, `Doing Great`, `Going Above and Beyond` across all 7 skills).
- **Interactive Simulator & Gamification (`prototypes/DonPBL/ui/components/InterstellarArkSimulator.tsx` & `engine.ts`):**
  - Updated `InterstellarArkSimulator.tsx` to include interactive tabs for (1) Goldilocks Planet Fact File & Fake-Gravity Spaceship, (2) 500-Person Recycling Loop Map & Physical Model Supply Budget (in Thai Baht), (3) All 6 Space Emergency Game Cards + Interactive 7-Section Fill-in-the-Blank New Planet Rulebook Worksheet, and (4) WeLearn Future Skills Guide, 4-Part Big Pitch Checklist, and 7 Mission Badges.

### [2026-10-20] - Platform Lead Pre-Migration Audit Remediation

#### Fixed & Added
- **UI Build & Explicit Barrel (`prototypes/DonPBL/ui/pbl.ts`):**
  - Created `prototypes/DonPBL/ui/pbl.ts` with explicit named value and type re-exports (`export { ... }` / `export type { ... }`) for `programData.ts`, `programRegistry.ts`, `mockFixtures.ts`, `engine.ts`, and `store.ts`.
  - Converted all type-only imports across `prototypes/DonPBL/` to `import type`.
  - Verified clean bundle via `node_modules/.bin/esbuild prototypes/DonPBL/ui/PblStudioApp.tsx --bundle --jsx=automatic --format=esm --outfile=/tmp/donpbl-ui.js --log-level=warning` (0 errors, 0 warnings).
- **Self-Contained Runnable Demo (`prototypes/DonPBL/demo/`):**
  - Added `demo/index.html`, `demo/main.tsx`, and `demo/vite.config.mjs` running on port `5180` with pinned Tailwind Play CDN (`https://cdn.tailwindcss.com/3.4.17`) for demo styling.
- **Real Automated Verification Suite (`prototypes/DonPBL/checks.mjs`):**
  - Replaced `checks.js` with `checks.mjs`, which bundles the real TypeScript modules with `esbuild` and tests `engine.ts`, `programRegistry.ts`, `mockFixtures.ts`, and `store.ts`.
- **Honest Confirmation Status & Data Corrections:**
  - Replaced unsupported `"Confirmed by Don"` / `'verified'` strings across code and docs with structured `ConfirmationRecord` objects (`status: 'needs_owner_confirmation'`).
  - Updated `COPILOT_DEPLOYMENT_CONFIG` to `status: 'not_deployed'` (`deploymentTimingConfirmed: false`) and documented fallback to `generateMockCopilotReply`.
  - Standardized all 6 active programs (`entrepreneurship-product-creation-2026`, `storytelling-genesis-2026`, `passion-project-blueprint-2026`, `biomechanics-robotics-2026`, `hex-city-thailand-2026`, `ecocool-smart-garden-2026`) to `durationWeeks: 12` with non-overlapping phase weeks within `1..12` and accurate `totalSessions` (18 for Entrepreneurship; 24 for the other 5 programs).
  - Marked `CLEAN_STREAM_PROGRAM` as `status: 'stub'` (`totalSessions: 0`, `phases: []`) and removed it from `PROGRAM_REGISTRY` and `PROGRAM_LIST`.
  - Synchronized `CORE_COMPETENCIES` in `mockFixtures.ts` with all 85 school competencies from `src/features/pbl/content/competencies.js` and fixed malformed competency IDs in `entrepreneurshipProgram.ts`.
  - Removed under-13 voice recording / speech-to-text from `passionBlueprintProgram.ts`, `PassionBlueprintSimulator.tsx`, and `storytellingProgram.ts` (replaced with tap-to-choose cards, drawing, or teacher-run scribing) and added safeguarding notices.
  - Labelled `"Mrs. Alvarez"`, `"Coach Eleanor Vance"`, and all cohort teams as synthetic fictional fixtures.
- **Local Store Persistence (`prototypes/DonPBL/store.ts`):**
  - Added `PblStore` (`createLocalStore`, `createMemoryStore`) keying projects by `(uid, pbl-<programId>)` and storing `coachFeedback` separately from `StudentProject`.
  - Wired `PblStudioApp.tsx`, `StudentView.tsx`, `TeacherView.tsx`, and `Header.tsx` (with a **"Reset Demo Data"** button) to `store.ts`.

---

### [2026-10-07] - Initial Prototype & Multi-Program Authoring (Historical Entries)

- Authored initial prototype programs (`EcoCool`, `Hex-City Thailand`, `Biomechanics & Bio-Robotics`, `The Passion Project Blueprint`, `Project Genesis Engine: Storytelling IP`, `Entrepreneurship: Product Creation`, and `CleanStream` stub) and interactive simulator components under `prototypes/DonPBL/`.
- *Note: Earlier changelog entries claiming owner confirmation, backend deployment readiness, or root `npm run build` / `tsc --noEmit` verification were superseded and corrected by the 2026-10-20 audit remediation above.*
