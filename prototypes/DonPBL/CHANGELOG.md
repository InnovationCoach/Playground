# Don's PBL Prototype Changelog

**Repository:** `https://github.com/InnovationCoach/Playground`  
**Working Branch:** `DonPBL`  
**Prototype Root:** `prototypes/DonPBL/`  
**Last Updated:** October 20, 2026

---

## Change Log Entries

### [2026-10-21] - Added "Engineering Humanity's Next Horizon: Interstellar Ark & Exoplanet Civilization" PBL
- **Program Curriculum (`prototypes/DonPBL/interstellarArkProgram.ts`):**
  - Authored `INTERSTELLAR_ARK_PROGRAM` (`id: 'interstellar-ark-horizon-2026'`), structured across all 7 Design Thinking phases (`explore`, `empathise`, `define`, `ideate`, `prototype`, `test`, `share`), `durationWeeks: 12` (10h/week, 120h total), and `totalSessions: 24`.
  - Incorporated all 35 weekly activities from the PDF curriculum (Deep-Space Physiology/Psychology, Goldilocks Exoplanet Reconnaissance, 500-Colonist Closed-Loop ECLSS & THB/Tonnage Budgets, New World Constitution & Legal Code, Centrifuge/Propulsion & 100-Year Maintenance Drone Bays, 3D/Isometric Schematics & 1,500 THB Low-Fidelity Physical Scale Model, Red-Team Stochastic & Constitutional Crisis Trials, and 4-Pillar United Earth Exodus Council Pitch).
  - Embedded the complete **WeLearn 7 Future Skills Framework Rubric** (Mastery Transcript Consortium aligned: Emerging, Proficient, Advanced, and Project Evidence Required).
- **Interactive Digital Twin Simulator & Gamification (`prototypes/DonPBL/ui/components/InterstellarArkSimulator.tsx` & `engine.ts`):**
  - Added `simulateArkBiosphere` in `engine.ts` to deterministically model 500-colonist caloric yield, oxygen regeneration, water loop recovery, crew psychological morale, 1,500 THB physical build budget compliance, and Red-Team crisis survival margins.
  - Built `InterstellarArkSimulator.tsx` with 4 interactive tabs: (1) Goldilocks Exoplanet & Propulsion Configurator, (2) Digital Twin ECLSS & 1,500 THB Physical Model Planner, (3) Red-Team & Constitutional Crisis Arena, and (4) MTC 7 Future Skills Rubric & 7 Mission Badges (`ARK_GAMIFICATION_BADGES` / `ARK_GAMIFICATION_LEVELS`).

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
