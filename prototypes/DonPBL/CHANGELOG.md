# Don's PBL Prototype Changelog

**Repository:** `https://github.com/InnovationCoach/Playground`  
**Working Branch:** `DonPBL`  
**Prototype Root:** `prototypes/DonPBL/`  
**Last Updated:** October 20, 2026

---

## Change Log Entries

### [2026-10-21] - Added "Project Voyager: 3D-Printed RC Truck & Solar Charging Bay" PBL (12 Weeks / 120 Hours)
- **Program Curriculum (`prototypes/DonPBL/voyagerProgram.ts`):**
  - Added `VOYAGER_PROGRAM` (`id: 'project-voyager-rc-solar-2026'`), a 12-week, 120-hour, 24-session curriculum structured across all 7 Design Thinking phases (`explore` [1, 1], `empathise` [2, 2], `define` [3, 4], `ideate` [5, 6], `prototype` [7, 9], `test` [10, 11], `share` [12, 12]).
  - Incorporated the **5 ESL-Friendly Team Roles & Stage 1–5 Portfolio Evidence Checklists** (`VOYAGER_TEAM_ROLES`: `1. 3D Body Designer (The Car Builder)`, `2. Chassis & Motor Mechanic (The Driver & Mover)`, `3. Solar & Battery Engineer (The Power Maker)`, `4. Garage Builder & Painter (The Base Maker)`, `5. Team Captain & Storyteller (The Boss & Recorder)`), the **Daily 2-Hour Class Routine** (`0:00–0:15` Warm-Up & Goal Setting, `0:15–1:30` Hands-On Building Time, `1:30–1:45` Clean Up & Save Work, `1:45–2:00` Portfolio Log), the **Weekly Friday Routine ("Show, Tell, Reflect")**, and the complete **12-Week Schedule (`VOYAGER_12_WEEK_SCHEDULE`)** with Weekly Driving Questions and role-by-role studio tasks.
  - Embedded **Step-by-Step Activity Guides (`VOYAGER_ACTIVITY_GUIDES`)** for **Guide A: Designing & 3D Printing the Truck Body** (`Activity 1: The "Box-Fit" & "No-Go Zones"`, `Activity 2: Shaping & "Shelling" (Hollowing Out)` with `2.5mm–3.0mm` wall thickness, `Activity 3: Splitting for the 3D Printer` for `220mm × 220mm` print beds + `15%–20%` infill & `3` wall loops, `Activity 4: Sanding, Gluing & Mounting`) and **Guide B: Building the Solar Charging Bay** (`Step 1: Sizing the Garage` with `+5cm` extra space on all sides, `Step 2: Building the Slanted Roof` at `15°–30°`, `Step 3: Mounting the Solar Panel & Wiring`).
  - Embedded the **WeLearn / MTC Assessment Rubric (`VOYAGER_WELEARN_MTC_RUBRIC`)** across all 7 competencies (`Critical Thinking & Problem Solving`, `Creativity`, `Self-Directed Learning`, `Effective Communication`, `Collaboration`, `Social & Emotional Awareness`, `Entrepreneurship`) and Levels 1–4 (`1 - Emerging`, `2 - Developing`, `3 - Proficient`, `4 - Advanced`), plus the **Final 12-Question MTC Portfolio Reflection (`VOYAGER_MTC_REFLECTION_QUESTIONS`)** and **7 Voyager Badges (`VOYAGER_GAMIFICATION_BADGES`)**.
- **Interactive Simulator & Gamification (`prototypes/DonPBL/ui/components/VoyagerSimulator.tsx` & `engine.ts`):**
  - Added `simulateVoyagerRcSolar` in `engine.ts` and `VoyagerSimulator.tsx` featuring an interactive 3D Shell & Solar Charging Bay Lab, 5 Roles & 12-Week Schedule Browser, Step-by-Step Guide A/B Checklists & Weekly Friday `"Show, Tell, Reflect"` Builder, and WeLearn/MTC Rubric, 12 Reflection Qs & 7 Badges.

### [2026-10-21] - Replaced "Project Genesis Engine: Creative IP & Cinematic Narrative" with "Project \"Genesis Engine\": Build Your Own Movie Universe!" (12 Weeks / 120 Hours)
- **Program Curriculum (`prototypes/DonPBL/storytellingProgram.ts`):**
  - Replaced `STORYTELLING_PROGRAM` (`id: 'storytelling-genesis-2026'`) with **Project "Genesis Engine": Build Your Own Movie Universe!** (`12 Weeks, 5 days a week, 2 hours a day = 120 Hours of Creation`, `24 Sessions`) structured across all 7 Design Thinking phases (`explore` [1, 2], `empathise` [3, 3], `define` [4, 4], `ideate` [5, 6], `prototype` [7, 9], `test` [10, 11], `share` [12, 12]):
    - **3 Final Deliverables (`GENESIS_DELIVERABLES`)**: `1. Your Universe Guide (Story Bible)`, `2. A 3-Scene Movie Script`, `3. A Mini-Movie / Pitch Trailer`.
    - **Phase 1: Building Your World (Weeks 1–3)**: Week 1 Inside Your Character’s Mind (`Want` vs. `Need`, `Flaw`, `Ghost`, `Rival`, and Day 5 Milestone: 500-word argument about something small like a broken tool); Week 2 World Rules & The Big Problem (`Inciting Incident`, `"World Rules Guide"` + location map + 3 story starts); Week 3 Mapping the Story & Locking Your Story Bible (`Plot Point 1`, `Midpoint`, `Lowest Point`, `Climax`, `"Therefore..." / "But..."`, 15-step Story Map, and `Phase 1 Checkpoint`).
    - **Phase 2: Writing the Movie Script (Weeks 4–6)**: Week 4 Pro Script Formatting & Hidden Meaning (`Scene Headings`, `Action Lines`, `Character Lines`, `subtext`, 1-page silent action scene + 1-page subtext dialogue scene); Week 5 Writing the First Draft (`Scenes 1, 2 & 3`, Goal: 8–10 pages); Week 6 Polishing & Perfecting the Script (supercharging action lines with strong verbs, classroom `Table Read`, and `Phase 2 Checkpoint: Lock the Final Script!`).
    - **Phase 3: Pre-Production, Art & Sound Prep (Weeks 7–9)**: Week 7 Storyboarding & Camera Angles (`Wide Shots`, `Medium Shots`, `Close-Ups`, `Pans/Tilts/Tracking`, at least `30 Storyboard frames`); Week 8 Creating the Final Art Assets (`Asset Manifest` & `Production Art Pack` with transparent backgrounds); Week 9 Voice Acting, Sound Prep & The Animatic (`Sound List`, voice/dialogue prep with under-13 safeguarding, and `Phase 3 Checkpoint: Export Locked Production Animatic!`).
    - **Phase 4: Final Production, Polish & Launch! (Weeks 10–12)**: Week 10 Final Art Assembly & Multi-Layer Sound Mixing (camera moves, `Foley`, audio `ducking`, `Picture & Sound Lock!`); Week 11 Final Mastering, Color Grading & Pro Portfolio (`Final Master Video` + `Behind-the-Scenes Pro Portfolio`); Week 12 The Big Pitch & Grand Showcase! (`5-Minute Pitch Presentation` & `THE GRAND SHOWCASE!`).
    - **How Your Project is Scored (`GENESIS_SUCCESS_CHECKLIST`)**: `1. Strong World Rules`, `2. Pro Script Formatting`, `3. Smart Organization & Planning`, `4. Smooth Sight & Sound`.
- **Interactive Simulator (`prototypes/DonPBL/ui/components/StorytellingSimulator.tsx`):**
  - Updated with 4 tabs covering (1) Story Bible, Character Mind, World Rules & `"Therefore/But"` Rollercoaster, (2) 3-Scene Movie Script Subtext & Strong Verb Studio, (3) 30+ Storyboard Animatic Player, Camera Moves, Color Grading & 4-Layer Foley Ducking Mixer, and (4) 12-Week Roadmap, 4-Part Success Checklist & 7 Showrunner Badges.

### [2026-10-21] - Replaced "Entrepreneurship: Product Creation" with "Entrepreneurship: Creating a Product" (5 Phases / 11 Activities)
- **Program Curriculum (`prototypes/DonPBL/entrepreneurshipProgram.ts`):**
  - Replaced `ENTREPRENEURSHIP_PROGRAM` (`id: 'entrepreneurship-product-creation-2026'`) with **Entrepreneurship: Creating a Product**, structured across all 7 Design Thinking phases (`explore` [1, 2], `empathise` [3, 4], `define` [5, 5], `ideate` [6, 6], `prototype` [7, 8], `test` [9, 10], `share` [11, 12]; 12 weeks, 18 sessions) and exported `ENTREPRENEURSHIP_PDF_ACTIVITIES` covering all 5 Phases and 11 Activities from the attached document:
    - **Phase 1: Finding a Problem and Checking if People Care** (`Activity 1: The Problem Diary (Friction Log)`, `Activity 2: Talking to Real Users (Customer Interviews)`, `Activity 3: Writing the Problem Statement` with `[Specific Group of People]`, `[Do a Specific Action]`, `[Specific Reason]`, and the brass musicians sentence).
    - **Phase 2: Brainstorming Ideas and Choosing a Path** (`Activity 1: "Crazy 8s" Fast Brainstorming` Boxes 1–2, 3–4, 5–6, 7–8; `Activity 2: Choosing Your Best Idea` Physical vs. Digital + 1–5 scoring in Feasibility, Desirability, Durability).
    - **Phase 3: Building a Test Model (Prototyping)** (`Activity 1: Building a Quick, Cheap Model` Option A Physical 1:1 with red marker vs. Option B Digital 4-screen paper cards in $\le 3$ taps; `Activity 2: Testing with Users and Making Improvements` with 3 classmates under **The Silent Rule** and **Build Version 1.1**).
    - **Phase 4: Calculating Costs and Prices** (`Activity 1: Cost to Make One Item (COGS)` with pack division: 100 THB roll / 5 bags = 20 THB per bag, 350 THB monthly website fee / 50 users = 7 THB per user; `Activity 2: Setting the Price and Break-Even Point` with $\text{SellingPrice} = \frac{\text{UnitCost}}{1 - \text{DesiredProfitMargin}}$, $\text{Break-EvenUnits} = \frac{\text{One-TimeStartupCosts}}{\text{SellingPrice} - \text{UnitCost}}$, and the Final 4 Numbers).
    - **Phase 5: Selling and Presenting Your Product** (`Activity 1: Finding Customers and Launching` for first 25 customers + 1-sentence `"Unlike..."` Catchphrase; `Activity 2: The 3-Minute Sales Pitch` in 4 timed parts: `0:00–0:45`, `0:45–1:45`, `1:45–2:30`, `2:30–3:00` + `<20s` Q&A).
- **Interactive Simulator (`prototypes/DonPBL/ui/components/EntrepreneurshipSimulator.tsx`):**
  - Updated with interactive Phase 1–5 Worksheets (Who-What-Why Problem Statement Builder, Crazy 8s Feasibility/Desirability/Durability 1–5 Scorer, Final 4 Numbers THB Calculator, and `"Unlike..."` Catchphrase & 3-Minute Sales Pitch Builder).

### [2026-10-21] - Updated "Quantitative Biomechanics & Bio-Inspired Robotics" with Full 60-Day / 12-Week / 120-Hour Curriculum
- **Program Curriculum (`prototypes/DonPBL/biomechanicsProgram.ts`):**
  - Updated `BIOMECHANICS_PROGRAM` (`id: 'biomechanics-robotics-2026'`) to incorporate all 60 daily hands-on lessons (Days 1–60 | Weeks 1–12 | Hours 1–120) from the Biomechanics curriculum document across the 7 Design Thinking phases (`explore` [1, 2], `empathise` [3, 4], `define` [5, 5], `ideate` [6, 7], `prototype` [8, 9], `test` [10, 11], `share` [12, 12]).
  - Added `BIOMECHANICS_60_DAY_SCHEDULE` (all 12 weeks / 60 days verbatim), the 3 Day-26 Engineering Projects (`1. Underground / Rough-Ground Rescue Robot`, `2. Ocean Plastic Cleaner`, `3. Gentle Fruit-Picking Gripper`), `BIOMECHANICS_OLDER_STUDENT_PILLARS` (`Advanced Mechanics`, `Real Electronics`, `Text Coding in C/C++`, `Professional Engineering Habits`), and `BIOMECHANICS_GAMIFICATION_BADGES`.
- **Interactive Simulator (`prototypes/DonPBL/ui/components/BiomechanicsSimulator.tsx`):**
  - Added interactive tabs for (1) 4-Bar Linkage, Planetary/Worm Gearbox & C++ IMU Lab, (2) 60-Day Schedule & 3 Day-26 Robot Projects Browser, (3) Phase 5 FMEA, Steel-Rod Upgrades & Test Runs 1–10 Benchmark, and (4) Older-Student Special Pillars & 7 Studio Badges.

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
