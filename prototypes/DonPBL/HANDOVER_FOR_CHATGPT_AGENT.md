# PBL Studio: Architectural Handover & Pre-Migration Blueprint

**Repository:** `https://github.com/InnovationCoach/Playground`  
**Active Branch:** `DonPBL` (Isolated in `prototypes/DonPBL/`)  
**Updated:** October 20, 2026  
**Verification Suite:** `node prototypes/DonPBL/checks.mjs` (13/13 real module & data checks passing)

---

## 1. Executive Summary

This document provides the pre-migration handover for `prototypes/DonPBL/` following the Platform Lead's 2026-10-20 audit. All prototype code, data models, offline storage, and standalone demo files live strictly inside `prototypes/DonPBL/`.

### Key Deliverables Verified
1. **Builds Cleanly with `esbuild`**: `prototypes/DonPBL/ui/pbl.ts` provides explicit named re-exports (`export { ... }` and `export type { ... }`) for `PblStudioApp.tsx` and all `ui/components/*.tsx` files.
2. **Self-Contained Demo on Port 5180**: `prototypes/DonPBL/demo/` mounts `PblStudioApp` using the root's Vite binary (`node_modules/.bin/vite --config prototypes/DonPBL/demo/vite.config.mjs`) and pinned Tailwind Play CDN (`3.4.17`).
3. **Real Automated Tests (`prototypes/DonPBL/checks.mjs`)**: Bundles the actual TypeScript modules via `esbuild` and tests `engine.ts`, `programRegistry.ts`, `mockFixtures.ts`, and `store.ts`.
4. **7 Complete 12-Week (120-Hour) PBL Programs + 1 Stub**:
   - `interstellar-ark-horizon-2026` (12 Weeks / 120h • 24 Sessions)
   - `entrepreneurship-product-creation-2026` (12 Weeks / 120h • 18 Sessions)
   - `storytelling-genesis-2026` (12 Weeks / 120h • 24 Sessions)
   - `passion-project-blueprint-2026` (12 Weeks / 120h • 24 Sessions)
   - `biomechanics-robotics-2026` (12 Weeks / 120h • 24 Sessions)
   - `hex-city-thailand-2026` (12 Weeks / 120h • 24 Sessions)
   - `ecocool-smart-garden-2026` (12 Weeks / 120h • 24 Sessions)
   - `cleanstream-stormwater-2026` (`status: 'stub'`, `totalSessions: 0`, `phases: []` — excluded from `PROGRAM_REGISTRY` and `PROGRAM_LIST`).
5. **Offline Storage (`prototypes/DonPBL/store.ts`)**:
   - Keys student projects by `(uid, pbl-<programId>)` (`users/{uid}/activityProgress/pbl-<programId>`).
   - Stores `coachFeedback` separately (`users/{uid}/feedback/pbl-<programId>`) and never embeds `coachFeedback` on `StudentProject`.
   - Wraps `localStorage` in `try/catch` with in-memory `Map` fallback and provides `resetDemoData()`.

---

## 2. Operational Configs & Assumptions (`needs_owner_confirmation`)

All operational configs and program assumptions use the structured `ConfirmationRecord` schema and are currently marked `status: 'needs_owner_confirmation'` pending verifiable owner sign-off:

| Config / Export | Provisional Value | Status |
| :--- | :--- | :--- |
| `SCHOOL_SCHEDULE_CONFIG` | 12 weeks/term, 3 terms/year, 2h/weekday (10h/week = 120h/term) | `needs_owner_confirmation` |
| `LEARNER_AGE_CONFIG` | Ages 9–17 (Primary 9–11, Middle 12–14, Senior 15–17) | `needs_owner_confirmation` |
| `HARDWARE_INVENTORY_CONFIG` | BBC micro:bit V2, 5V pumps, capacitive soil sensors, Arduino UNO, ESP32, LEGO Spike | `needs_owner_confirmation` |
| `COPILOT_DEPLOYMENT_CONFIG` | `POST /api/pbl-copilot` — no backend deployed; frontend falls back to `generateMockCopilotReply` | `not_deployed` (`needs_owner_confirmation`) |

---

## 3. Assessment & Safeguarding Alignment

- **85 WeLearn Competencies across 7 Domains (`mockFixtures.ts`)**: `CORE_COMPETENCIES` and `COMPETENCY_DOMAINS` (`sdl`, `ctps`, `lc`, `ec`, `ct`, `sea`, `ent`) match `src/features/pbl/content/competencies.js` verbatim. Every competency ID referenced by any program or fixture is verified by `checks.mjs`.
- **8-Point Showcase Readiness (`engine.ts:evaluateReadiness`)**: Evaluates `hmw`, `impact`, `phases`, `code`, `ai-provenance`, `data-table`, `user-feedback`, and `final-format`.
- **Safeguarding & Privacy**:
  - Under-13 learners never use voice recording or speech-to-text (replaced with tap-to-choose reflection cards, annotated drawings, or a teacher-run scribe).
  - Any audio/video capture of older learners requires prior school consent and must never be stored by the platform.
  - All names (`Mrs. Alvarez`, `Coach Eleanor Vance`, and student cohort teams) are explicitly labelled as fictional synthetic fixtures.
