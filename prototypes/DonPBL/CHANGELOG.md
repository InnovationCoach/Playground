# Don's PBL Prototype Changelog & Handover Log

**Repository:** `https://github.com/InnovationCoach/Playground`  
**Working Branch:** `DonPBL`  
**Prototype Root:** `prototypes/DonPBL/`  
**Last Updated:** October 7, 2026

---

## Change Log Entries

### [2026-10-07] - Confirmation: Learner Age Cohorts (Primary through Upper Secondary: Ages 9–17)

#### Verified & Configured
- **Multi-Tiered Learner Cohort Specification (`LEARNER_AGE_CONFIG` in `programData.ts` & `programRegistry.ts`):**
  - **Overall Age Span:** Confirmed by Don covering Primary through Upper Secondary: **Ages 9–17 (Grades 4–12)**.
  - **Track 1 — Younger Primary Track (Ages 9–11 / Grades 4–6):**
    - *Scaffolding Focus:* Sensory discovery, guided exploratory prompts, tactile cardboard & craft prototyping, gamified badge progression.
    - *Code Tool:* MakeCode Block Editor / Scratch 3.0 / Visual Flowcharts.
    - *Hardware Focus:* BBC micro:bit V2 built-in sensors (light, temperature, buttons, sound buzzer), alligator clips, continuous servos.
    - *Key Deliverables:* Tactile Pop-Up Prototype, Visual Block Program, Illustrated Story/Discovery Journal, Classroom Mini-Expo Pitch.
  - **Track 2 — Junior / Middle Secondary Track (Ages 12–14 / Grades 7–9):**
    - *Scaffolding Focus:* Scientific method hypothesis rigor, hybrid block-to-Python coding, 4-bar mechanical linkage modeling, structured stakeholder empathy interviews.
    - *Code Tool:* MicroPython / CircuitPython / MakeCode Python mode.
    - *Hardware Focus:* External analog sensors (capacitive soil probe, DS18B20 1-wire), 5V relay/MOSFET motor drivers, 4-bar linkage servos.
    - *Key Deliverables:* Working Automated Rig, Calibrated Data Graph, User Empathy Field Map, Community Showcase Pitch & Live Demo.
  - **Track 3 — Upper Secondary Track (Ages 15–17 / Grades 10–12):**
    - *Scaffolding Focus:* Algorithmic optimization, native embedded Python/C++, 3D parametric CAD linkages, mathematical thermodynamics/kinematics modeling, industry pitch decks.
    - *Code Tool:* Native Python / Arduino C++ / Embedded WebAssembly / CAD Fusion 360.
    - *Hardware Focus:* Multi-sensor I2C buses, ESP32/micro:bit telemetry, precision load cells, bio-inspired kinematic mechanisms.
    - *Key Deliverables:* Production-Grade Functional Prototype, Mathematical Efficacy & Error Model, Dual Stakeholder Field Trial, Formal Capstone Exhibition & Investor Deck.
- **Assumption Verification & UI Reflection:**
  - `asmp-age` in `SAMPLE_PROGRAM.assumptions` officially marked **CONFIRMED BY DON: Multi-tiered tracks desired across Primary through Secondary, ages 9–17**.
  - `AssumptionsBanner.tsx` updated with a live verified indicator badge: `Cohorts Confirmed: Ages 9–17 (Primary through Upper Secondary)` and green confirmation card.
  - `Header.tsx` hero area updated with blue cohort pill: `Ages 9–17 (Primary–Secondary Tracks)`.
  - `TeacherView.tsx` updated with a comprehensive Multi-Tiered Age Track Scaffolding card displaying tools, hardware, and deliverables for each track, along with differentiation notes.
  - `StudentView.tsx` Project Definition tab updated with clear age track scaffolding and cohort tier indicator.
  - `mockFixtures.ts` updated with sample projects for Primary Track (Team SproutGuard / Grade 5) and Upper Secondary Track (Team AeroPulse / Grade 11).
  - All 5 PBL program definitions (`SAMPLE_PROGRAM`, `hexCityProgram`, `biomechanicsProgram`, `passionBlueprintProgram`, `storytellingProgram`, `CLEAN_STREAM_PROGRAM`) updated with differentiated track notes across Ages 9–17.
- **Verification (`checks.js`):**
  - Added Check 12 verifying the complete 9–17 learner age band configuration (`LEARNER_AGE_CONFIG`, Primary, Middle, and Senior tracks, and confirmed assumption).
  - All 12 verification checks PASSED successfully.

### [2026-10-07] - Confirmation: School Operating Model (12 Weeks/Term, 3 Terms/Year, 2h/Weekday)

#### Verified & Configured
- **School Operating Model Specification (`SCHOOL_SCHEDULE_CONFIG` in `programData.ts` & `programRegistry.ts`):**
  - **Term Duration:** Confirmed 12 weeks per term.
  - **Academic Structure:** Confirmed 3 terms per academic year (36 weeks total).
  - **Daily Contact:** Confirmed 2 hours per weekday (Monday through Friday).
  - **Weekly Contact Hours:** 5 days × 2 hours/day = 10 hours per week.
  - **Term Total Hours:** 12 weeks × 10 hours/week = 120 contact hours per term.
  - **Academic Year Total Hours:** 3 terms × 120 hours = 360 contact hours per academic year.
- **Assumption Verification & UI Reflection:**
  - `asmp-duration` in `SAMPLE_PROGRAM.assumptions` officially marked **CONFIRMED BY DON**.
  - `AssumptionsBanner.tsx` updated with a live verified schedule indicator and green confirmation card.
  - `Header.tsx` hero area updated to highlight the 12-week schedule with `2 hrs / weekday (10h/wk • 120h/term)` badge.
  - Catalog list themes in `programRegistry.ts` updated to reference the confirmed 12 Wks / 120h structure across programs.
- **Verification (`checks.js`):**
  - Added Check 11 verifying the complete 12-week / 3-term / 2-hour-daily school operating model constants and registry exports.
  - All 11 verification checks PASSED successfully.

### [2026-10-07] - PBL: Project "Genesis Engine" Creative IP & Cinematic Narrative (20 Weeks / 200 Hours)

#### Added
- **Project Genesis Engine Program Specification (`storytellingProgram.ts`):**
  - Formatted directly from the official "Project Genesis Engine: Creative IP & Cinematic Narrative" curriculum PDF into standard WeLearn `PblProgram` architecture.
  - Comprehensive 20-week / 200-hour professional creative pipeline (structured into 24 high-impact workshop sessions) for learners aged 13–18.
  - 3 Core Industry Deliverables:
    1. *Creative Intellectual Property (IP) Story Bible:* Character psychology dossiers (Want vs Need, Fatal Flaws, The Ghost/Wound), systematic world rules with inviolable costs/limitations, and 15-Point Beat Sheet with "Therefore / But" causality tracking.
    2. *Production-Ready 3-Scene Script:* Formatted strictly to Hollywood/Fountain industry standard (sluglines, present-tense visual action lines, character cues, parentheticals, and weaponized subtext).
    3. *Cinematic Pitch Preview / Micro-Short Film:* 16:9 animatic combining original visual assets, clean voiceover stems, and multi-track audio landscape (Dialogue, Room Atmosphere, Spot Foley, and Musical score with ducking).
  - 4-Dimension Mastery Assessment Matrix:
    - *World Design Rigor:* Strict laws and costs generating natural narrative friction without cheap plot devices.
    - *Formatting Precision:* Industry screenplay layouts and subtextual dialogue design.
    - *Pipeline & Resource Management:* Asset catalogs, chronological milestones, and pre-production discipline.
    - *Sonic & Visual Continuity:* 180-degree axis line adherence, vocal inflection, and immersive audio layering.
- **Cinematic Narrative & Screenplay Simulator Sandbox (`StorytellingSimulator.tsx`):**
  - Interactive Story Bible editor with Want vs Need and Systemic World Rules evaluator.
  - Screenplay Subtext Engine featuring an interactive "40% Subtext Word Cut" that replaces on-the-nose exposition with subtextual power struggles and calculates real-time tension scores.
  - 16:9 Animatic Viewport with multi-angle camera movement keyframing (Push-in, Dynamic shake, 180° axis line overlay).
  - 4-Layer Digital Audio Workstation (DAW) Mixer with automatic -8 dB dialogue sidechain ducking.
- **Gamification & Showrunner Challenges:**
  - Real-time Showrunner XP progression (+XP for subtext cuts, beat sheet causality, audio ducking).
  - 5 Collectible Industry Badges: 🎭 Subtext Wordsmith, 🌌 Cosmic Lawmaker, 🎬 Cinematic Maestro, 🎚️ Foley Sound Sculptor, 🏆 Genesis Showrunner.
- **Multi-Program Catalog Registration (`programRegistry.ts`):**
  - Registered `storytelling-genesis-2026` in `PROGRAM_REGISTRY` and `PROGRAM_LIST`.
  - Added dedicated launcher button in top navigation bar (`Header.tsx`) and modal in `App.tsx`.
- **Verification (`checks.js`):**
  - Added Check 10 verifying Genesis Engine program schema, characters fixture, world rules, 4-track audio design, and 20-week curriculum.
  - 100% passes in `node prototypes/DonPBL/checks.js` (10/10 verification tests).

### [2026-10-07] - PBL: The Passion Project Blueprint (2e Neuro-Scaffolding & Simulation)

#### Added
- **Passion Project Blueprint Program Specification (`passionBlueprintProgram.ts`):**
  - Formatted directly from the official "The Passion Project Blueprint: Discovering Your Next Big Idea" curriculum PDF into standard WeLearn `PblProgram` architecture.
  - Designed for learners aged 10–18 (Upper Primary, Secondary & Twice-Exceptional / 2e Learners) across 12 weeks / 24 structured 50-minute sessions.
  - Sourced from 3-part blueprint: Part 1 Deep Dives (Rabbit Hole, Fixer-Upper, Culture Check, Infinite Saturday), Part 2 Toolkit & 80/20 Rule (Comfort Zone vs Stretch Zone), Part 3 Learning Style & Neuro-Support (Brain Speed, Friction Points, Dream Audience).
  - Quick-Fire Vibe Configuration honoring complete learner agency: Physical vs Digital vs Theoretical; Fast & Experimental vs Slow, Deep & Precise; Solo Wolf vs Crew Collaboration.
  - 5 Concrete 2e Friction Scaffolding Strategies:
    - *Perfectionism Paralysis:* 15-Minute "Ugly First Draft" Challenge
    - *Mid-Project ADHD Boredom Drop:* The "Mashup Twist" Pivot
    - *Writing Paragraph Dread:* Speech-to-Text & Audio Voice Notes
    - *Time Blindness:* Granular 20-Minute Kanban Micro-Sprints with WIP limits
    - *Brain Freeze / Staring at Wall:* Sensory Reset & Mentor Example Bank
- **Interactive Passion Blueprint Simulator & Neuro-Scaffold Sandbox (`PassionBlueprintSimulator.tsx`):**
  - Full interactive diagnostic engine reproducing Prompts 1 through 10 from the curriculum.
  - Real-time simulated metrics: Executive Functioning Barrier score (down to 18%), Learner Autonomy & Agency Index (up to 98%), and 12-Week Dopamine Retention percentage.
  - Generated 20-minute Kanban micro-sprint backlog with strict WIP limits.
- **Gamification & Friction Boss Battles:**
  - Real-time XP tracking (+XP for diagnostics and boss victories).
  - 5 Collectible Badges: 🚀 Rabbit Hole Pioneer, ⚡ Hyperfocus Alchemist, 🛡️ Perfectionism Slayer, 🎨 Mashup Alchemist, 🎙️ Audio Chronicler.
  - 3 Live Boss Battles:
    - *Boss 1: The Perfectionism Demon* (Live 15-minute countdown sprint for crude builds)
    - *Boss 2: The Boredom Swamp* (Mashup Twist Randomizer injecting secondary passions)
    - *Boss 3: The Wall of Stare* (Voice Memo Dictation simulator with audio transcription)
- **Multi-Program Catalog Registration (`programRegistry.ts`):**
  - Registered `passion-project-blueprint-2026` in `PROGRAM_REGISTRY` and `PROGRAM_LIST`.
  - Added dedicated launcher button in top navigation bar (`Header.tsx`) and modal in `App.tsx`.
- **Verification (`checks.js`):**
  - Added Check 9 verifying Passion Blueprint schema, 5 friction strategies, 2e neuro-scaffolding, and 12-week phases.
  - 100% passes in `node prototypes/DonPBL/checks.js` (9/9 verification tests).

### [2026-10-07] - PBL: Biomechanics & Bio-Inspired Robotics (14-Week Curriculum & Kinematics Simulator)

#### Added
- **Quantitative Biomechanics Program Specification (`biomechanicsProgram.ts`):**
  - Formatted into standard WeLearn `PblProgram` architecture covering 14 weeks / 24 structured sessions (140 contact hours).
  - Designed for learners aged 14–18 (Grades 9–12 / Pre-Engineering) using LEGO Technic, Arduino Nano C/C++, and closed-loop electromechanics.
  - Sourced and synthesized from WeLearn Academy / InnovationCoach Biomechanics curriculum.
  - 3 Real-World Engineering Challenge Tracks:
    - **Track A: Subterranean Search & Rescue Rover** (Serpentine & Klann/Theo Jansen linkages, MPU-6050 IMU, L298N H-Bridge).
    - **Track B: Microplastic & Debris Interceptor** (Basking shark & whale baleen cross-flow filtration, cam-follower backwash scraper).
    - **Track C: Adaptive Soft-Grip Crop Harvester** (Chameleon tongue & gecko dry fibrillar micro-adhesion, load cells, bistable compliant pads).
  - Comprehensive Bill of Materials (BOM) & engineering toolchain: LEGO Technic geartrains, Arduino Nano, TB6612FNG, MPU-6050 6-DOF IMU, Sharp IR proximity, load cells.
  - Formal Engineering Protocols: Grübler's criterion for planar mechanism degrees of freedom, Failure Mode and Effects Analysis (FMEA), biological scaling laws (allometry / square-cube law), and closed-loop proportional tilt correction.
- **Interactive Kinematics & Linkage Gait Simulator (`BiomechanicsSimulator.tsx`):**
  - Real-time kinematic simulation of 4-bar Klann/Theo Jansen walking linkages with parametric coupler curve foot trajectory calculation.
  - Dynamic powertrain physics controls: motor RPM (30–300 RPM), gear ratios (1:1, 12:1, 40:1, 120:1), terrain incline (-25° to +25°), and proportional gain Kp.
  - Live calculations: Grübler's criterion DOF ($DOF = 3(n-1) - 2j_1 - j_2$), angular velocity ($\omega$ in rad/s), output torque ($N\cdot cm$), mechanical power ($W$), and closed-loop IMU chassis stabilization.
- **Gamification & Engineering Trials:**
  - Real-time XP reward mechanics (+600 XP per solved trial challenge).
  - 4 Unlockable engineering badges:
    - 🦗 Klann Kinematics Wizard
    - 🐜 Mandible Torque Champion
    - 🦎 Gecko Adhesion Master
    - 🐋 Baleen Hydrodynamic Ace
  - 3 Live Trial Challenges: Earthquake Rubble Incline Climb, High-Turbidity Microplastic Estuary Run, and Delicate Berry Grasping Trial.
- **Multi-Program Catalog Registration (`programRegistry.ts`):**
  - Added `biomechanics-robotics-2026` to `PROGRAM_REGISTRY` and `PROGRAM_LIST`.
  - Integrated into top navigation bar and Student view with dedicated action launcher.
- **Verification (`checks.js`):**
  - Added Check 8 validating Biomechanics program schema, 3 biomimetic tracks, kinematic linkages, Arduino kit, and 14-week phases.
  - 100% passes in `node prototypes/DonPBL/checks.js` (8/8 verification tests).

### [2026-10-07] - Hex-City Thailand 12-Week Floating City PBL & Simulation Engine

#### Added
- **Hex-City Thailand Program Specification (`hexCityProgram.ts`):**
  - Converted official 15-page PDF into standard WeLearn `PblProgram` architecture.
  - Scale 1:2500 Physical Model specifications (Full-scale 3.0 km width vs 120.0 cm model width; 200 mm foam hull base; 2 mm black foam decks).
  - 6 Specialized Student Roles: Architecture & Structures, Energy & Grid, Food & Agriculture, Water & Waste, Civic & Wellbeing, Health & Biosecurity.
  - 12-Week schedule across 24 structured 50-minute sessions with learner choice pathways and reflection prompts.
  - Turnkey Bill of Quantities (BOQ) in Thai Baht: itemized 2,094,300,000 THB budget with 7% VAT and 15% emergency contingency buffer.
- **Interactive Digital Twin Simulation Sandbox (`HexCitySimulator.tsx`):**
  - Top-down/isometric 7-Hex modular cluster visualizer with color-coded sector lighting (Agri Green, Solar Yellow, Water Blue, Clinic Red).
  - Environmental physics controls: wave height / typhoon storm surge (0.5m–5.5m), solar irradiance / monsoon cloud cover (10%–100%), population load.
  - Dynamic telemetry calculations: freeboard margin (cm), solar net flow (MWh/day), LiFePO4 battery level, water reserve days, catenary mooring tension.
- **Gamification & Disaster Challenges:**
  - Real-time City Resilience Rating (0–100%) and Citizen Survival/Morale Index.
  - 3 Interactive Crisis Scenarios: (1) Runaway barge collision & ballast flooding, (2) 7-day monsoon zero-solar blackout, (3) Waterborne pathogen contamination.
  - Interactive manual override buttons (Counter-ballast trim valves, Emergency grid cutover switch, Water isolation valve).
  - XP progression and 5 collectible achievement badges (e.g. 🛡️ Barge Impact Survivor, ⚡ Micro-Grid Commander, 💧 Bio-Shield Guardian, 🏛️ Master City Architect).
- **Program Registry Integration:**
  - Registered `hex-city-thailand-2026` in `programRegistry.ts` as primary program alongside EcoCool and CleanStream.
- **Verification:**
  - Updated `checks.js` with test group 7 verifying Hex-City schema, roles, BOQ, and scale hull parameters (All 7 test suites passed).

### [2026-10-07] - Multi-Program Registry & CleanStream Expansion (Commit `d99d87e`)

#### Added
- **Multi-Program Registry (`programRegistry.ts`):**
  - Added `PROGRAM_REGISTRY` mapping program IDs to full `PblProgram` instances.
  - Implemented Program 2 template: **"CleanStream: Smart Urban Stormwater & Micro-Filter Sentinel"** (turbidity sensor + Hall-effect water flow rate + motorized diverter gate).
  - Integrated dynamic Program Selector dropdown in `Header.tsx` and `StudentView.tsx`.
  - Enables switching between EcoCool and CleanStream seamlessly in the interactive prototype.

### [2026-10-07] - Initial Prototype & Audit Package (Commits `a2b4cee`, `08b9010`)

#### Added
- **Complete Program Specification (`programData.ts`):**
  - "EcoCool: Smart Urban Heat & Community Garden Monitor"
  - 12-week schedule with 24 structured 50-minute sessions.
  - Learner choice pathways, deliverables, reflection prompts, and teacher guidance tips for every session.
  - 4 quantitative impact metrics: $\ge 40\%$ water reduction, root soil temp $\le 28^\circ\text{C}$, seedling vigor $\ge 4/5$, volunteer tending time $\le 10$m.
- **Pure Engine Logic (`engine.ts`):**
  - `safeLink` URL sanitizer (XSS protection against `javascript:` / `data:`).
  - 8-point Showcase Readiness Audit evaluator (`evaluateReadiness`).
  - Evidence validator enforcing mandatory AI prompt provenance (`asked` vs `kept`).
  - Simulated AI Co-Pilot generator following `BACKEND-PBL-COPILOT-PROMPT-FOR-GEMINI.md`.
- **Synthetic Fixtures (`mockFixtures.ts`):**
  - Cohort teams: Team EcoCool (94% complete), Team HydroShade (68%), Team BioShield (38%), Team SolGuard (0% empty state).
  - 14 rich evidence artifacts across all 7 phases with MicroPython code, DHT22/capacitive moisture data, and AI logs.
  - Complete WeLearn 85 competencies lookup catalog and 7 domains.
  - NGSS 3D look-fors for MS-ESS3-3, MS-PS3-3, MS-ETS1-2 across 4 levels.
- **Standalone Test Suite (`checks.js`):**
  - Automated Node.js verification script executing 6 test groups without cloud dependencies.
- **Audit & Integration Documentation:**
  - `README.md`: Program guide and local start commands.
  - `integrationNotes.md`: Architectural mapping to WeLearn Playground.
  - `AUDIT_REPORT_GPT6.1.md`: Formal audit report for GPT 6.1 peer reviewer.
- **Interactive UI Workbench:**
  - BBC micro:bit V2 sensor & canopy simulator with 5x5 LED matrix, servo canopy, pump relay, and serial REPL telemetry.
  - Simulated AI Co-Pilot modal with syntax-highlighted code and "Explain-It-Back Challenge Question".
  - Evidence logger modal with live validation and competency tagging.
  - Teacher facilitation dashboard with cohort inspector and 1–4 competency scoring.

#### Verified
- `node prototypes/DonPBL/checks.js`: All 6 test suites passed.
- `npm run build`: Succeeded.
- `tsc --noEmit`: Zero errors.
- Git branch isolation: Zero shared production files touched.

---

## How to Record Future Changes

For each new change from your side:
1. Append a new dated section under `## Change Log Entries` above.
2. List files modified under `prototypes/DonPBL/`.
3. Record the test run status (`node prototypes/DonPBL/checks.js`).
4. Stage and commit exclusively to branch `DonPBL`.
