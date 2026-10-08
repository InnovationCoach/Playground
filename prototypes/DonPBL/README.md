# Don's PBL Program Prototype: "EcoCool"

**Repository:** `https://github.com/InnovationCoach/Playground`  
**Working Branch:** `DonPBL`  
**Prototype Directory:** `prototypes/DonPBL/`  
**Status:** Isolated, Fixture-Based Prototype (No Live Production Impact)

---

## 1. Executive Summary & Design Overview

This directory contains the isolated, fixture-based Project-Based Learning (PBL) program prototype built for Don's PBL initiative in accordance with `AGENTS.md` and `docs/DonPBL-HANDOVER.md`.

The prototype introduces **"EcoCool: Smart Urban Heat & Community Garden Monitor"**, a 12-week hands-on STEAM and Design Thinking program where learners build physical computing devices that solve a dual problem helping **both people and the environment**.

Learners use BBC micro:bit V2 microcontrollers, capacitive analog soil moisture probes, digital temperature sensors, and servo-deployed reflective Mylar canopies to protect urban community garden beds from 42°C+ summer heatwaves—reducing water consumption by over 40% and preventing volunteer heat exhaustion.

---

## 2. Program Specifications

| Parameter | Specification | School Status / Verification |
| :--- | :--- | :--- |
| **Program Title** | EcoCool: Smart Urban Heat & Community Garden Monitor | **Provisional Prototype** |
| **Driving Question** | *How might we use sensor-guided micro-irrigation and reflective shade canopies to protect urban community garden vegetables from extreme heat waves, reducing water waste by over 40% while keeping plants thriving?* | **Provisional Proposal** |
| **Real Problem Category** | **Both People and Environment** | Aligned with WeLearn PBL philosophy |
| **Learner Cohort** | Ages 12–15 (Grades 7–9 / Lower Secondary) | **Assumption (Needs Owner Confirmation)** |
| **Duration** | 12 Weeks (2 sessions/week = 24 sessions @ 50 mins) | **Assumption (Term 3, 2026 pacing)** |
| **Primary Kit** | BBC micro:bit V2, breakout board, capacitive moisture probe, DS18B20 temp probe, SG90 servo, 5V mini pump + relay | Classroom low-voltage kit (3.3V–5V DC) |
| **Software / Code** | micro:bit MicroPython / MakeCode JavaScript | Written with AI Co-Pilot assistance |
| **Assessment Model** | Explore = NGSS 3D Rubrics (MS-ESS3-3, MS-PS3-3, MS-ETS1-2); Project Phases = WeLearn 85 Competencies across 7 Domains | Aligned with `content/pblModel.js` & `competencies.js` |

### Measurable Impact Criteria
1. **Water Conservation:** $\ge 40\%$ reduction in liters applied vs. daily manual hose baseline over a 14-day cycle.
2. **Thermal Shielding:** Root zone soil temperature maintained $\le 28^\circ\text{C}$ when ambient air exceeds $38^\circ\text{C}+$.
3. **Seedling Vigor:** Botanical health score maintained $\ge 4.0 / 5.0$ over 14 days without leaf scorch.
4. **Volunteer Relief:** Physical tending time reduced from 45 min/day to $\le 10$ min/day with automated alerting.

---

## 3. Seven-Phase Project Structure (24 Sessions)

1. **Explore (Weeks 1–2, Sessions 1–4):**  
   STEAM inquiry labs on urban heat islands, soil thermal inertia, and capacitive vs resistive sensor physics. Aligned with NGSS MS-ESS3-3 & MS-PS3-3 with 4-level rubrics. Students log "Sparks".
2. **Empathise (Weeks 3–4, Sessions 5–8):**  
   Field observations and stakeholder interviews with community gardeners (e.g. Mrs. Alvarez). Empathy mapping (Says, Thinks, Does, Feels) and baseline data audit.
3. **Define (Week 5, Sessions 9–10):**  
   Scoping the Driving Question and HMW statement. Criteria & Constraints matrix. Committing to a quantitative impact metric.
4. **Ideate and Plan (Week 6, Sessions 11–12):**  
   Crazy Eights sketching, morphological concept matrix, circuit pinout schematic, state-machine algorithm flowchart, and initial AI Co-Pilot consultation.
5. **Prototype (Weeks 7–8, Sessions 13–16):**  
   Chassis assembly (upcycled cardboard, basswood dowels, Mylar film), breadboard circuit wiring, and AI Co-Pilot code generation in MicroPython or MakeCode with line-by-line understanding.
6. **Test and Improve (Weeks 9–10, Sessions 17–20):**  
   Multi-trial thermal stress tests (3 trials minimum), data analytics ($\Delta T$ and $\%$ water saved), stakeholder usability testing, and verified engineering improvements (anti-siphon break + servo sleep).
7. **Showcase or Present (Weeks 11–12, Sessions 21–24):**  
   Format selection (Interactive Expo Booth vs Formal Pitch Deck), rehearsal critique, public community demonstration, and comprehensive reflection across WeLearn competencies.

---

## 4. Safe Local Development & Zero Cloud Dependencies

This prototype uses **100% synthetic fixtures** and mocked services. It strictly avoids:
- Live Firebase Firestore / Authentication connections.
- External cloud AI API endpoints.
- Real user accounts or student PII.
- Modifying shared application code in `src/features/pbl/` or root dependencies.

### Running the Standalone Verification Suite
To run the automated integrity checks:
```bash
node prototypes/DonPBL/checks.js
```

### Running the Clickable Interactive Demo
The interactive demo is served locally through Vite on port 3000 (or port 5173 if using local Vite):
```bash
# In the repository root:
npm run dev
```
Open your browser at `http://localhost:3000` (or the development preview URL).

The demo interface provides:
- **Role Switcher:** Toggle between **Student View** and **Teacher / Coach View**.
- **State Simulator:** Toggle between **Populated Student** (Team EcoCool, 94% complete), **Mid-Stage Student** (Team HydroShade), **Brand-New Student** (Team SolGuard, 0 evidence empty state), **Loading State**, and **Error State**.
- **Simulated Hardware Test-Bed:** Interactively adjust ambient temperature slider and soil moisture slider to see the virtual micro:bit V2 trigger the servo canopy and pump relay in real-time.
- **Simulated AI Co-Pilot:** Test real-time prompt generation, complete MicroPython code generation, "How to test on device" steps, and the "Explain-It-Back Challenge Question".
- **Evidence Portfolio Logger:** Add new evidence items with real-time validation, link safety sanitization, and WeLearn competency multi-tagging.
- **Teacher Assessment Matrix:** Score student evidence against the 85 WeLearn competencies and view NGSS 3D look-fors.

---

## 5. Confirmed Operational Parameters & Verified Decisions

In response to questions posed during the prototype phase, the following core specifications have been officially **confirmed by Don** and integrated across all program models, verification suites, and UI views:

1. **School Operating Schedule:** **CONFIRMED BY DON**
   - **Term Length:** 12 weeks per term
   - **Terms per Year:** 3 terms per academic year (36 weeks total)
   - **Daily Schedule:** 2 hours per weekday (Monday–Friday)
   - **Weekly Hours:** 10 contact hours per week
   - **Term Total:** 120 contact hours per term (360 total hours per academic year)
   - *Architecture export:* `SCHOOL_SCHEDULE_CONFIG` in `programData.ts` & `programRegistry.ts`

2. **Learner Age Demographics & Multi-Tiered Tracks:** **CONFIRMED BY DON**
   - **Span:** Primary through Upper Secondary: **Ages 9–17 (Grades 4–12)**
   - **Track 1 (Younger Primary / Ages 9–11 / Grades 4–6):** Visual block coding (MakeCode/Scratch), built-in micro:bit sensors, tactile craft/cardboard prototyping, gamified badge progression.
   - **Track 2 (Junior Secondary / Ages 12–14 / Grades 7–9):** Hybrid block-to-MicroPython, external analog sensors, 4-bar mechanical linkage modeling, community empathy fieldwork.
   - **Track 3 (Upper Secondary / Ages 15–17 / Grades 10–12):** Native Python/C++/CAD, multi-sensor I2C buses, mathematical efficacy models, dual-stakeholder field trials, investor/expo pitch deck.
   - *Architecture export:* `LEARNER_AGE_CONFIG` in `programData.ts` & `programRegistry.ts`

3. **Complete Suite of 5 Standardized PBL Programs:**
   - **EcoCool:** Smart Urban Heat & Community Garden Monitor (120 contact hours)
   - **Hex-City Thailand:** Floating Resilient Architecture & Urban Disaster Resilience (120 contact hours)
   - **Biomechanics & Bio-Robotics:** Bio-Inspired Kinematics & Assistive Technology (140 contact hours)
   - **The Passion Project Blueprint:** 2e Neuro-Scaffolding & Rapid Prototyping (120 contact hours)
   - **Project Genesis Engine:** Cinematic IP, Hollywood Screenplay & Narrative Simulation (200 contact hours)

---

## 6. Proposed Integration with Existing PBL Studio

When the repository owner decides to integrate this work into the main application, the architecture maps cleanly to existing files:

| Prototype Component | Target Shared App Location | Integration Strategy |
| :--- | :--- | :--- |
| `programData.ts` & `programRegistry.ts` | `src/features/pbl/content/pblModel.js` | Add as pre-configured program options under multi-program selector. |
| Engine Logic (`engine.ts`) | `src/features/pbl/engine/pblProject.js` | Direct drop-in for `safeLink`, `readiness`, and `evaluateReadiness` audits. |
| AI Co-Pilot Simulator | `src/features/pbl/Copilot.jsx` & `server/` | Connect to `POST /api/pbl-copilot` once backend endpoint lands; keep mock fallback. |
| Hardware Test Rig | `src/features/pbl/ProjectJourney.jsx` | Embed as interactive visual sandbox for physical computing learners. |
| Coach Assessment Grid | `src/features/pbl/PblStudio.jsx` (Coach Tabs) | Powers the planned Coach Dashboard portfolio review tab. |
| Simulation Engines (`StorytellingSimulator.tsx`, `PassionBlueprintModal.tsx`) | `src/features/pbl/components/` | Drop-in interactive sandboxes for narrative and passion project tracks. |

---

## 7. Syncing & Pushing to the `DonPBL` Branch

All prototype commits are cleanly isolated and staged on the `DonPBL` branch. Because external git push operations from this cloud container require GitHub credentials, Don can sync to GitHub using either method below:

### Option 1 — Unpack the Standalone Git Bundle (Recommended)
On your local machine in your `Playground` repository clone on the `DonPBL` branch:
```bash
# 1. Pull the bundle commits into your local DonPBL branch:
git pull prototypes/DonPBL/donpbl-prototype.bundle DonPBL

# 2. Push to GitHub:
git push origin DonPBL
```

### Option 2 — Push Directly with Personal Access Token (PAT)
If using the terminal in this container or on your machine:
```bash
git push https://<GITHUB_PAT>@github.com/InnovationCoach/Playground.git HEAD:refs/heads/DonPBL
```
*(Replace `<GITHUB_PAT>` with your GitHub Personal Access Token with repo scope).*
