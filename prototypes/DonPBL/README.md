# Don's PBL Program Prototype (`prototypes/DonPBL/`)

**Repository:** `https://github.com/InnovationCoach/Playground`  
**Working Branch:** `DonPBL`  
**Prototype Directory:** `prototypes/DonPBL/`  
**Status:** Isolated, Self-Contained Prototype (Zero Live Production Impact)

---

## 1. Executive Summary & Scope

This directory contains the isolated Project-Based Learning (PBL) prototype built on branch `DonPBL` in accordance with `AGENTS.md` and `docs/DonPBL-HANDOVER.md`.

Key architectural properties:
- **100% Isolated inside `prototypes/DonPBL/`**: No root configuration (`package.json`, `vite.config.*`, `firestore.rules`, `firebase.json`), `src/`, `server/`, `scripts/`, or GitHub workflows are modified.
- **7 Complete 12-Week (120-Hour) PBL Programs + 1 Explicit Stub**:
  1. `interstellar-ark-horizon-2026` — **Engineering Humanity's Next Horizon: Interstellar Ark & Exoplanet Civilization** (12 Weeks / 120h • 24 Sessions)
  2. `entrepreneurship-product-creation-2026` — **PBL: Entrepreneurship: Product Creation** (12 Weeks / 120h • 18 Sessions)
  3. `storytelling-genesis-2026` — **Project "Genesis Engine": Creative IP & Cinematic Narrative** (12 Weeks / 120h • 24 Sessions)
  4. `passion-project-blueprint-2026` — **The Passion Project Blueprint: Discovering Your Next Big Idea** (12 Weeks / 120h • 24 Sessions)
  5. `biomechanics-robotics-2026` — **Quantitative Biomechanics & Bio-Inspired Robotics** (12 Weeks / 120h • 24 Sessions)
  6. `hex-city-thailand-2026` — **Hex-City Thailand: Modular Resilient Floating City** (12 Weeks / 120h • 24 Sessions)
  7. `ecocool-smart-garden-2026` — **EcoCool: Smart Urban Heat & Community Garden Monitor** (12 Weeks / 120h • 24 Sessions)
  - *Stub Program (excluded from `PROGRAM_REGISTRY` and `PROGRAM_LIST` until dedicated sessions are authored)*: `cleanstream-stormwater-2026` (`status: 'stub'`, `totalSessions: 0`, `phases: []`).
- **Offline Persistence (`prototypes/DonPBL/store.ts`)**:
  - Keys student projects by `(uid, pbl-<programId>)` so learners across different programs never overwrite each other's documents.
  - Stores `coachFeedback` in a separate coach-writable key (`users/{uid}/feedback/pbl-<programId>`) and never embeds `coachFeedback` on `StudentProject` (matching Firestore rules where `users/{uid}/activityProgress/pbl-<programId>` is student-owner writable).
  - Wraps every `localStorage` call in `try/catch` and falls back seamlessly to an in-memory `Map`.
  - Includes a **"Reset Demo Data"** button in the header to clear local storage and restore initial synthetic fixtures.
- **Synthetic Fixtures & Safeguarding**:
  - All student teams, learner names, coach profiles (`Coach Eleanor Vance`), and community personas (`Mrs. Alvarez`, an invented example persona) are 100% fictional.
  - No voice recording or speech-to-text is used for under-13 learners (replaced with tap-to-choose reflection cards, annotated drawings, or a teacher-run scribe). Any audio/video capture for older learners requires prior school consent and must never be stored by the platform.

---

## 2. Running the Self-Contained Demo (Port 5180)

Because the main application's root dev server does not import `prototypes/DonPBL/`, this folder includes its own self-contained Vite configuration (`prototypes/DonPBL/demo/vite.config.mjs`) that runs on port `5180` (avoiding ports `3000` and `5173` used by the main app).

From the repository root, start the demo using the root's installed Vite binary:

```bash
node_modules/.bin/vite --config prototypes/DonPBL/demo/vite.config.mjs
```

Then open **`http://127.0.0.1:5180/`** in your browser.

### Styling Note for Migration
The prototype UI components use Tailwind utility classes, whereas the main application uses its own CSS stylesheet. For the standalone demo only, `prototypes/DonPBL/demo/index.html` loads the pinned Tailwind Play CDN (`https://cdn.tailwindcss.com/3.4.17`). During migration into `src/features/pbl/`, component styling will be rebuilt against the main application's own CSS.

---

## 3. Running the Real Verification & Bundle Checks

### 3.1 Bundle the UI with `esbuild`
Verify that `prototypes/DonPBL/ui/PblStudioApp.tsx` and its explicit named barrel (`prototypes/DonPBL/ui/pbl.ts`) bundle cleanly with zero errors and zero warnings (including all `lucide-react` icons):

```bash
node_modules/.bin/esbuild prototypes/DonPBL/ui/PblStudioApp.tsx \
  --bundle --jsx=automatic --format=esm --outfile=/tmp/donpbl-ui.js --log-level=warning
```

### 3.2 Run the Automated Test Suite (`checks.mjs`)
`prototypes/DonPBL/checks.mjs` bundles the actual TypeScript modules via `esbuild` into `os.tmpdir()`, imports the compiled bundle, and tests the real exports of `engine.ts`, `programRegistry.ts`, `programData.ts`, `mockFixtures.ts`, and `store.ts`:

```bash
node prototypes/DonPBL/checks.mjs
```

What `checks.mjs` verifies:
1. `ui/pbl.ts` and `ui/PblStudioApp.tsx` bundle with `esbuild` with 0 errors and 0 warnings.
2. `engine.safeLink`: blocks `javascript:`, mixed-case `JaVaScRiPt:`, leading whitespace, `data:`, `vbscript:`, protocol-relative `//evil.com`, and `ftp:`; accepts `http:` and `https:`; enforces the 500-character length limit (`LIMITS.link`).
3. `engine.evaluateReadiness`: asserts exact readiness scores and failing check IDs across empty (`proj-solguard-04`: `0/8`), early (`proj-bioshield-03`: `2/8`), half-done (`proj-hydroshade-02`: `4/8`), and complete (`proj-ecocool-01`: `8/8`) fixture projects.
4. `engine.validateAndAddEvidence`: rejects missing title, invalid phase, unsafe link, and `ai` items missing `asked` or `kept`; accepts valid items; returns a new project object without mutating its input.
5. `engine.getPhaseProgress` and `engine.getCompetencyCoverage` on fixtures.
6. `engine.calculateUnitEconomics`: verifies hand-computed cases, zero units, and zero price overrides without ever returning `NaN` or `Infinity`.
7. `engine.simulateMarketStep`: verifies determinism for a given input and supports an injectable random number generator (`rng`).
8. `PROGRAM_REGISTRY` keys equal each program's `id`, `PROGRAM_LIST` has the exact same 6 IDs in order, and `CLEAN_STREAM_PROGRAM` is marked `status: 'stub'` and excluded from `PROGRAM_REGISTRY`.
9. Every program has all 7 phases (`explore`, `empathise`, `define`, `ideate`, `prototype`, `test`, `share`) in order, with non-overlapping weeks within `durationWeeks: 12`, and session counts summing to `totalSessions` (18 for Entrepreneurship; 24 for the other 5 programs).
10. Every competency ID referenced by any program or fixture exists in the 85 school competencies (`CORE_COMPETENCIES` in `mockFixtures.ts`, verbatim from `src/features/pbl/content/competencies.js`).
11. Every program and fixture is strictly JSON-serialisable (`JSON.parse(JSON.stringify(p))` deep-equals `p`) for Firestore storage.
12. All config and assumption `confirmation` objects follow the structured `ConfirmationRecord` schema, and `COPILOT_DEPLOYMENT_CONFIG.status` is `'not_deployed'`.
13. `store.ts` (`createMemoryStore` / `createLocalStore`) persists projects per `(uid, pbl-<programId>)`, keeps `coachFeedback` separate from `StudentProject`, and resets cleanly via `resetDemoData()`.

---

## 4. Operational Configs, Assumptions & Confirmation Status

Per audit ground rules, every operational config and program assumption uses a structured `confirmation` field:

```ts
confirmation: {
  status: 'confirmed' | 'needs_owner_confirmation';
  confirmedBy?: string;   // person who confirmed
  confirmedOn?: string;   // ISO date
  source?: string;        // verifiable citation (message, date, sender/recipient)
}
```

Because no external citation record with person, ISO date, and message source is attached in the repository, all operational configs and program assumptions are set to `status: 'needs_owner_confirmation'` for the Platform Lead to review with Don:

1. **School Schedule (`SCHOOL_SCHEDULE_CONFIG`)** — `status: 'needs_owner_confirmation'`
   - Provisional assumption: 12 weeks/term, 3 terms/year, 2 hours/weekday (10 hours/week = 120 contact hours/term).
2. **Learner Age Tracks (`LEARNER_AGE_CONFIG`)** — `status: 'needs_owner_confirmation'`
   - Provisional assumption: Ages 9–17 across Primary (9–11), Middle Secondary (12–14), and Upper Secondary (15–17).
3. **Hardware Inventory (`HARDWARE_INVENTORY_CONFIG`)** — `status: 'needs_owner_confirmation'`
   - Provisional assumption: Class sets of BBC micro:bit V2 boards, 5V pumps, capacitive soil sensors, plus Arduino UNO, ESP32, and LEGO Spike kits.
4. **AI Co-Pilot Endpoint (`COPILOT_DEPLOYMENT_CONFIG`)** — `status: 'not_deployed'` (`confirmation.status: 'needs_owner_confirmation'`)
   - `POST /api/pbl-copilot` is **not deployed**, and a production deploy freeze is in force. The prototype frontend falls back to the local mock (`generateMockCopilotReply`).

---

## 5. Complete 7-Program Catalog Summary

| Program ID | Title | Duration | Contact Hours | Total Sessions | Phase Week Ranges |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `interstellar-ark-horizon-2026` | Engineering Humanity's Next Horizon: Interstellar Ark & Exoplanet Civilization | 12 Weeks | 120h | **24 Sessions** | `[1,1], [2,2], [3,4], [5,6], [7,8], [9,10], [11,12]` |
| `entrepreneurship-product-creation-2026` | PBL: Entrepreneurship: Product Creation | 12 Weeks | 120h | **18 Sessions** | `[1,2], [3,4], [5,5], [6,6], [7,8], [9,10], [11,12]` |
| `storytelling-genesis-2026` | Project "Genesis Engine": Creative IP & Cinematic Narrative | 12 Weeks | 120h | **24 Sessions** | `[1,2], [3,4], [5,5], [6,6], [7,8], [9,10], [11,12]` |
| `passion-project-blueprint-2026` | The Passion Project Blueprint: Discovering Your Next Big Idea | 12 Weeks | 120h | **24 Sessions** | `[1,2], [3,4], [5,5], [6,6], [7,8], [9,10], [11,12]` |
| `biomechanics-robotics-2026` | Quantitative Biomechanics & Bio-Inspired Robotics | 12 Weeks | 120h | **24 Sessions** | `[1,2], [3,4], [5,5], [6,6], [7,8], [9,10], [11,12]` |
| `hex-city-thailand-2026` | Hex-City Thailand: Modular Resilient Floating City | 12 Weeks | 120h | **24 Sessions** | `[1,2], [3,4], [5,5], [6,6], [7,8], [9,10], [11,12]` |
| `ecocool-smart-garden-2026` | EcoCool: Smart Urban Heat & Community Garden Monitor | 12 Weeks | 120h | **24 Sessions** | `[1,2], [3,4], [5,5], [6,6], [7,8], [9,10], [11,12]` |
| `cleanstream-stormwater-2026` *(Stub)* | CleanStream: Smart Urban Stormwater & Micro-Filter Sentinel | 12 Weeks | — | **0 (Stub)** | Excluded from `PROGRAM_REGISTRY` (`status: 'stub'`) |
