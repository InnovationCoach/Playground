# Don's PBL Prototype Changelog

**Repository:** `https://github.com/InnovationCoach/Playground`  
**Working Branch:** `DonPBL`  
**Prototype Root:** `prototypes/DonPBL/`  
**Last Updated:** October 20, 2026

---

## Change Log Entries

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
