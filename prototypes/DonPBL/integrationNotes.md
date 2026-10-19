# Proposed Integration Architecture for PBL Studio

**Target Branch:** `DonPBL` (proposals only; no shared files modified)  
**Reference Document:** `docs/DonPBL-HANDOVER.md` & `docs/PBL-STUDIO-NOTES.md`

---

## 1. Context and Objective

The existing PBL Studio (`src/features/pbl/PblStudio.jsx`) defines a framework for term projects with 6 project phases and STEAM Explore activities. However, the current code relies on a single static `TERM` placeholder in `pblModel.js` and notes that:
1. The coach portfolio review screen is not yet connected.
2. The AI co-pilot (`POST /api/pbl-copilot`) is waiting on backend deployment.
3. Term programs need rich, structured multi-week session plans, learner choice pathways, and explicit measurable impact criteria.

This prototype demonstrates a complete, battle-tested program implementation ("EcoCool") that can either be plugged in directly or serve as the template for future PBL programs in WeLearn.

---

## 2. File-by-File Integration Mapping

### A. Program Content (`src/features/pbl/content/pblModel.js`)
Currently, `pblModel.js` exports:
- `TERM` (single object)
- `IMPACT` (`['people', 'environment', 'both']`)
- `PHASES` (7 phases with weeks, goals, tasks, evidence, ai, competencies)

**Proposed Integration:**
- Maintain backward compatibility by exporting `PROGRAMS = [SAMPLE_PROGRAM]` or creating a `PROGRAM_REGISTRY`.
- Allow the teacher/coordinator to select or assign the active program (e.g. `ecocool-smart-garden-2026`).
- Each phase in `PHASES` gains an optional `sessions` array containing the session-by-session lesson plans, learner choices, and reflection prompts.

### B. Project Engine (`src/features/pbl/engine/pblProject.js`)
The prototype engine (`prototypes/DonPBL/engine.ts`) is 100% compatible with the schema in `pblProject.js`:
- `safeLink(url)`: Tested and hardened against `javascript:` and `data:` schemes.
- `evaluateReadiness(project)`: Formalizes the 8 readiness criteria into a clear checklist with percentage scoring and phase attribution.
- `validateAndAddEvidence(project, item)`: Standardizes the `ai` evidence type with mandatory `asked` and `kept` fields, matching the WeLearn AI ethics rule ("using AI well is evidence").

### C. Co-Pilot Endpoint Integration (`src/features/pbl/Copilot.jsx` & `server/`)
In `docs/BACKEND-PBL-COPILOT-PROMPT-FOR-GEMINI.md`, the backend contract specifies:
- `POST /api/pbl-copilot`
- Request body: `{ message, phase, impact, language, problem, ageBand }`
- Rules: Model generates complete working code, adds "How to test on device" steps, and poses an "Explain-it-back challenge".

**Proposed Integration:**
- When `POST /api/pbl-copilot` is available in production, `Copilot.jsx` forwards the request directly.
- If the endpoint returns 404 or network is unavailable, the fallback uses the client-side rule generator implemented in `prototypes/DonPBL/engine.ts:generateMockCopilotReply` rather than degrading to generic hint-only responses.

### D. Coach View Integration (`src/features/pbl/PblStudio.jsx`)
In the existing `PblStudio.jsx`, coach tabs only show `Approach`, `Project phases (read-only)`, `Explore: NGSS rubrics`, and `Competencies`.
- The prototype adds a **Cohort Portfolio Reviewer** and **Competency Assessment Matrix** (scoring 1 to 4 against WeLearn's 85 competencies).
- Once Firestore rules allow coach reads on `users/{uid}/activityProgress/pbl-<termId>`, the coach dashboard can mount this exact review component.

---

## 3. Recommended Migration Sequence for Owner

1. **Step 1 (Zero-Risk Review):** Review `prototypes/DonPBL/` on branch `DonPBL` and test the standalone checks (`node prototypes/DonPBL/checks.js`).
2. **Step 2 (Content Review with Academic Team):** Confirm learner age band (12–15), 12-week schedule, and sensor kit inventory with school coordinators.
3. **Step 3 (Engine Updates):** Merge the enhanced `evaluateReadiness` and `safeLink` tests into `tests/pbl.test.js`.
4. **Step 4 (Coach UI Mount):** Wire the Coach Cohort Review tab into `PblStudio.jsx` under `COACH_TABS`.
5. **Step 5 (Backend Co-Pilot Deployment):** Deploy `POST /api/pbl-copilot` on Cloud Run according to `docs/BACKEND-PBL-COPILOT-PROMPT-FOR-GEMINI.md`.
