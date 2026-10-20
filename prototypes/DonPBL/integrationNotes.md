# Proposed Integration Architecture for PBL Studio

**Target Branch:** `DonPBL` (proposals only; no shared files modified)  
**Reference Documents:** `AGENTS.md`, `docs/DonPBL-HANDOVER.md`, `docs/PBL-STUDIO-NOTES.md`

---

## 1. Context and Objective

The existing PBL Studio (`src/features/pbl/PblStudio.jsx`) defines a framework for term projects with 7 phases (`explore`, `empathise`, `define`, `ideate`, `prototype`, `test`, `share`) and STEAM Explore activities. Currently:
1. `src/features/pbl/content/pblModel.js` defines a single placeholder `TERM`.
2. The coach portfolio review and competency scoring view is not yet wired in.
3. `POST /api/pbl-copilot` is not deployed (`status: 'not_deployed'`), and production deploys are frozen.

This prototype provides 6 complete, JSON-serialisable 12-week (120-hour) programs, a pure validation and readiness engine (`engine.ts`), an offline storage adapter (`store.ts`) matching the Firestore document model, and a self-contained demo (`demo/vite.config.mjs` on port `5180`).

---

## 2. File-by-File Integration Mapping

### A. Program Catalog (`prototypes/DonPBL/programRegistry.ts` → `src/features/pbl/content/pblModel.js`)
- `PROGRAM_REGISTRY` exports 6 complete 12-week programs (each with all 7 phases in order, non-overlapping weeks within `1..12`, session counts summing to `totalSessions`, and valid competency IDs from the 85 school competencies in `src/features/pbl/content/competencies.js`).
- Every program passes `JSON.parse(JSON.stringify(p))` deep-equality so programs can be stored directly as Firestore documents during migration.
- `CLEAN_STREAM_PROGRAM` is explicitly marked `status: 'stub'` (`phases: []`, `totalSessions: 0`) and excluded from `PROGRAM_REGISTRY` and `PROGRAM_LIST` until its dedicated sessions are authored.

### B. Storage & Persistence (`prototypes/DonPBL/store.ts` → Firestore)
- Student projects are keyed by `(uid, pbl-<programId>)` (`users/{uid}/activityProgress/pbl-<programId>`), preventing collisions when a learner participates in multiple programs.
- Coach feedback (`CoachFeedback[]`) is stored in a separate collection path (`users/{uid}/feedback/pbl-<programId>`) and stripped from `StudentProject` documents so student writes and coach writes never conflict under Firestore security rules.
- `localStorage` access is wrapped in `try/catch` with an automatic in-memory `Map` fallback.

### C. Project Engine (`prototypes/DonPBL/engine.ts` → `src/features/pbl/engine/pblProject.js`)
- `safeLink(url)`: Rejects `javascript:`, mixed-case `JaVaScRiPt:`, leading whitespace, `data:`, `vbscript:`, protocol-relative `//evil.com`, and URLs over 500 chars (`LIMITS.link`); accepts `http:` and `https:`.
- `evaluateReadiness(project)`: Evaluates the 8 readiness gates (`hmw`, `impact`, `phases`, `code`, `ai-provenance`, `data-table`, `user-feedback`, `final-format`).
- `validateAndAddEvidence(project, item)`: Validates required fields, phase, link safety, and AI provenance (`asked` and `kept`), returning a new `StudentProject` without mutating the input.
- `calculateUnitEconomics` & `simulateMarketStep`: Deterministic financial and market sandbox helpers guarded against `NaN` and `Infinity`.

### D. AI Co-Pilot Fallback (`COPILOT_DEPLOYMENT_CONFIG`)
- `COPILOT_DEPLOYMENT_CONFIG.status` is `'not_deployed'`. Until `POST /api/pbl-copilot` is deployed after the production deploy freeze, the UI falls back to the local mock (`generateMockCopilotReply`).

---

## 3. Verification Commands

1. **Bundle UI with root `esbuild`:**
   ```bash
   node_modules/.bin/esbuild prototypes/DonPBL/ui/PblStudioApp.tsx \
     --bundle --jsx=automatic --format=esm --outfile=/tmp/donpbl-ui.js --log-level=warning
   ```
2. **Run real module & data verification tests:**
   ```bash
   node prototypes/DonPBL/checks.mjs
   ```
3. **Run standalone demo on port 5180:**
   ```bash
   node_modules/.bin/vite --config prototypes/DonPBL/demo/vite.config.mjs
   ```
   *(Note: `demo/index.html` uses the pinned Tailwind Play CDN `3.4.17` for the isolated demo; styling will be rebuilt against the main app's CSS during migration).*
