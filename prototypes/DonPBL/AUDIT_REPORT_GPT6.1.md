# PBL Prototype Pre-Migration Audit & Verification Report

**Repository:** `https://github.com/InnovationCoach/Playground`  
**Branch:** `DonPBL`  
**Working Directory:** `prototypes/DonPBL/`  
**Audit Remediation Date:** October 20, 2026  
**Safety Status:** 100% Isolated Prototype. Zero production code, root dependencies, Firebase rules, or cloud APIs modified.

---

## 1. Summary of Pre-Migration Audit Fixes (2026-10-20)

In response to the Platform Lead's 2026-10-20 audit of `prototypes/DonPBL/`, the following issues were resolved strictly within `prototypes/DonPBL/`:

1. **Fixed UI Bundling (`prototypes/DonPBL/ui/pbl.ts`):**
   - Created `prototypes/DonPBL/ui/pbl.ts` using explicit named re-exports (`export { ... }` and `export type { ... }`) rather than `export *` to prevent silent symbol collisions.
   - Converted all type-only imports across `prototypes/DonPBL/` to `import type { ... }`.
   - Verified all 74 `lucide-react` icons imported by the UI exist in the root `node_modules` (`lucide-react@^1.48.0`) and bundled without `--external:lucide-react`.

2. **Added Self-Contained Runnable Demo (`prototypes/DonPBL/demo/`):**
   - Created `prototypes/DonPBL/demo/index.html`, `prototypes/DonPBL/demo/main.tsx`, and `prototypes/DonPBL/demo/vite.config.mjs` configured for port `5180` (`node_modules/.bin/vite --config prototypes/DonPBL/demo/vite.config.mjs`).
   - Loaded pinned Tailwind Play CDN (`https://cdn.tailwindcss.com/3.4.17`) in `demo/index.html` for the demo only (styling will be rebuilt against the main app's CSS during migration).

3. **Replaced Fake String-Grepping Checks with Real Module Tests (`prototypes/DonPBL/checks.mjs`):**
   - Deleted `prototypes/DonPBL/checks.js` and created `prototypes/DonPBL/checks.mjs`, which bundles the real TypeScript modules with `esbuild` into `os.tmpdir()` and `import()`s the compiled bundle.
   - Tests the real exports of `engine.ts` (`safeLink`, `evaluateReadiness`, `validateAndAddEvidence`, `getPhaseProgress`, `getCompetencyCoverage`, `calculateUnitEconomics`, `simulateMarketStep`), `programRegistry.ts`, `mockFixtures.ts`, and `store.ts`.

4. **Corrected Unsupported Claims, Program Durations, Competency IDs & Safeguarding:**
   - Replaced all `"Confirmed by Don"` / `status: 'verified'` claims with structured `ConfirmationRecord` objects (`status: 'needs_owner_confirmation'`).
   - Set `COPILOT_DEPLOYMENT_CONFIG.status` to `'not_deployed'` (`deploymentTimingConfirmed: false`) with a clear note that no backend is deployed and the UI falls back to `generateMockCopilotReply`.
   - Standardized all 6 active programs in `PROGRAM_REGISTRY` to `durationWeeks: 12` (120h) with non-overlapping phase weeks within `1..12` and accurate `totalSessions` (`18` for Entrepreneurship; `24` for Storytelling, Passion Blueprint, Biomechanics, Hex-City, and EcoCool).
   - Marked `CLEAN_STREAM_PROGRAM` as `status: 'stub'` (`totalSessions: 0`, `phases: []`) and removed it from `PROGRAM_REGISTRY` and `PROGRAM_LIST`.
   - Populated `CORE_COMPETENCIES` in `mockFixtures.ts` with all 85 school competencies verbatim from `src/features/pbl/content/competencies.js` and fixed Entrepreneurship competency IDs (`sdl-01`, `ctps-01`, `ec-01`, `lc-01`, `ent-01`, etc.).
   - Removed under-13 voice recording / speech-to-text from `passionBlueprintProgram.ts`, `PassionBlueprintSimulator.tsx`, and `storytellingProgram.ts` (replaced with tap-to-choose cards, drawing, or teacher-run scribing) and added safeguarding notices that any recording of older learners requires school consent and must never be stored by the platform.
   - Explicitly labelled `"Mrs. Alvarez"`, `"Coach Eleanor Vance"`, and all student teams as fictional synthetic fixtures.

5. **Implemented Local Persistence (`prototypes/DonPBL/store.ts`):**
   - Implemented `PblStore` (`loadProject`, `saveProject`, `listCohort`, `loadFeedback`, `addFeedback`, `resetDemoData`) with `createLocalStore` and `createMemoryStore`.
   - Keys student projects by `(uid, pbl-<programId>)` and stores `coachFeedback` separately from `StudentProject`.
   - Wired `PblStudioApp.tsx`, `StudentView.tsx`, `TeacherView.tsx`, and `Header.tsx` (including a **"Reset Demo Data"** button) to `store.ts`.

---

## 2. Verification Commands

```bash
# 1. Bundle UI with root esbuild (must exit 0 with no warnings):
node_modules/.bin/esbuild prototypes/DonPBL/ui/PblStudioApp.tsx \
  --bundle --jsx=automatic --format=esm --outfile=/tmp/donpbl-ui.js --log-level=warning

# 2. Run real module and data verification suite:
node prototypes/DonPBL/checks.mjs

# 3. Start standalone demo on port 5180:
node_modules/.bin/vite --config prototypes/DonPBL/demo/vite.config.mjs
```
