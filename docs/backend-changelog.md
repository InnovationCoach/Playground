# WeLearn SPARK — Backend & Data Engineering Changelog

**Date:** 24 October 2026  
**Author:** Gemini 3.8 (Backend & Data Engineer)  
**Branch:** `feature/coach-pbl-studio-edmentum`  
**Target Release:** QA Staging & Preview Channel  

---

## 1. Executive Summary & Audit Mapping

This release addresses all QA audit findings from 24 Oct 2026 (build `index-CgNS5So3.js`). All fixes strictly adhere to the shared **Data Contract** (`docs/data-contract.md`) and the repository rules (`AGENTS.md`). No live production data or services were modified without written authorization.

| Issue ID | Problem | Root Cause | Resolution |
|---|---|---|---|
| **P0-1** | Transfer write fails but UI reports success | Catch block in `pblTransferService.js` fell back to mock mode and resolved as success. | Replaced transfer with typed `publishProgram(draft, { assignTo })` in `src/services/pblService.js`. Strict contract validation with Zod; rejects on error; eliminated mock fallback in production. |
| **P0-2** | Student View crashes on missing arrays | Readers unconditionally called `.map()` on `raw.phases`. | Added reader guards in `src/services/pblService.js` (`getProgram`, `normaliseContractProgram`) and `src/features/pbl/programs/catalog.js`. Returns `{ status: 'not_found' }` if missing; guarantees default arrays `[]`. |
| **P0-3** | SPARK Studio learners hard-coded | Fixed mock learner profiles in `CoachPblStudio.jsx`. | Implemented `useCoachClasses` and `useClassLearners(classId)` in `src/features/coach/studio/useCoachStudioData.js`. Reads real learners (`role === 'learner' \|\| 'student'`), excludes staff, test account toggle. |
| **P0-4** | No learner self-enrolment path | No program discovery or self-enrolment mutation path existed. | Created `searchPrograms(q)` (using `searchTokens array-contains`) and idempotent `addToMyCourse(programId)` creating `enrolments/{uid}_{programId}` with `source: 'self-added'`. Integrated into `useAddedCourses.js`, `HomeSearch.jsx`, and `MyCourses.jsx`. |
| **P0-5** | Studio programs cannot be assigned | Fixed list of 6 hardcoded slugs in `ClassProgramsPanel.jsx`. | Dynamically queries `pbl_programs` collection from Firestore in `ClassProgramsPanel.jsx`. Any published Studio or Library program can be assigned to classes. |
| **P1-7** | Role filtering & coach count 0 | `CoachDashboard.js` allowed `admin`, `parent`, `supervisor` into `this.students`; `this.coaches` was never loaded. | Strictly filtered learners to `role === 'learner' \|\| 'student'`, excluding all staff. Queried real coaches into `this.coaches` (`where('role', 'in', ['coach', 'teacher'])`). |
| **P1-8** | Class data drift & doubled strings | Free-text group names stored in user docs; dropdown had hardcoded phantom classes. | Dynamically queries real classes in `CoachDashboard.js`. Created `scripts/migrate-class-drift.js` mapping free-text (including doubled `"Climate Champions 7AClimate Champions 7A"`) to valid `classId`s. |
| **P1-9** | Placeholder progress across roster | Solar Car v1 / 3.20 kg / Brushed DC rendered unconditionally for all learners. | Solar Car telemetry in `CoachDashboard.js` (card & modal) is rendered **only** when a real `solarCar_prototypes` document exists for that learner. Shows active PBL program badges from `enrolments`. |
| **P1-10** | Client-side account creation with shared password | Browser created Firebase Auth users with shared default `Student123!`. | Moved learner account creation to secure backend API (`/api/coach/learners`) and callable Cloud Function (`createLearner`). Generates secure one-time temporary passwords, restricts to coach/admin callers, and atomically updates `classes/{classId}.learnerIds`. |
| **P1-11** | Time tracking runaways (> 22h) | Heartbeat accumulated 30s intervals directly without session documents or timeout. | Refactored `src/utils/timeTracker.js` to create `sessions/{sessionId}` with 60s heartbeats. Inactive sessions time out after 5 minutes and close at `lastHeartbeatAt`. Created `scripts/recompute-time-sessions.js` to audit and close stale sessions. |
| **P1-12** | Double load on dashboard | `useEffect` in `CoachDashboardHost.jsx` had unstable `[coachUser]` dependency; lack of cleanup. | Changed dependency to `[coachUser?.uid]`, added `destroy()` cleanup method to `CoachDashboard.js`, and deduplicated audit logger events by `actorId:eventType:route:minuteBucket`. |
| **P2-13** | Dev build in production | Monolithic 2.6 MB chunk with un-split simulators and potential dev flags. | Configured `vite.config.js` with manual chunks (`vendor-react`, `vendor-firebase`, `vendor-icons`, `sim-solar-car`, `sim-bunker`, `sim-plant-lab`, `sim-so2-sulfate`, `sim-hex-grid`, `coach-pbl-studio`). Main bundle dropped from **2,617 kB** to **864 kB** (**67% reduction**). |

---

## 2. Shared Data Contract

All schema definitions live in `docs/data-contract.md` (shared with Opus 5.5). Any future mutations must be negotiated and reflected there first.

Key collections implemented:
- `users/{uid}`: `{ uid, displayName, email, role: 'learner'|'coach'|'admin'|'parent'|'supervisor', classIds: string[], ageBand?, createdAt, isTest? }`
- `classes/{classId}`: `{ name, coachIds: string[], learnerIds: string[], programId?, joinCode?, joinCodeActive, createdAt }`
- `frameworks/welearn-dt`: Single source of truth with 7 phases: `explore`, `empathise`, `define`, `ideate`, `prototype`, `test`, `showcase`.
- `pbl_programs/{programId}`: Complete program contract with validated `phases`, `sessions`, `tools`, `deliverables`, `searchTokens`, `visibility: 'class'|'centre'`, and `status`.
- `enrolments/{learnerUid}_{programId}`: Tracks learner enrollment, phase progress, and evidence.
- `enrolments/{id}/phaseProgress/{phaseId}`: Holds submitted evidence (learner-writable) and `coachFeedback` (coach-writable only).
- `sessions/{sessionId}`: Tracks active platform engagement with `startedAt`, `lastHeartbeatAt`, and `endedAt`.

---

## 3. Scripts & Tooling Created

1. **`scripts/seed-pbl-programs.js`**
   - Seeds `frameworks/welearn-dt` (7 phases).
   - Migrates and seeds the 6 official library programs into `pbl_programs` with `status: 'published'`, `visibility: 'centre'`, and `source: 'library'`.
   - Command: `npm run seed:programs:emulator` or `npm run seed:programs`

2. **`scripts/migrate-class-drift.js`**
   - Scans `users` collection for legacy free-text class names.
   - Cleans up concatenated strings (e.g. `"Climate Champions 7AClimate Champions 7A"` -> `"Climate Champions 7A"`).
   - Maps normalized class names to known Firestore `classes/{classId}` documents.
   - Upgrades `role: 'student'` to `role: 'learner'`.
   - Atomically updates `users.classIds` and `classes.learnerIds`.
   - Command: `node scripts/migrate-class-drift.js [--dry-run]`

3. **`scripts/recompute-time-sessions.js`**
   - Scans `sessions` collection for open sessions with missing `endedAt`.
   - Closes sessions with no heartbeat for > 5 minutes at `lastHeartbeatAt`.
   - Audits all users' `dailyStats` and outputs a structured table of daily outliers exceeding 8 hours/day.
   - Command: `node scripts/recompute-time-sessions.js [--dry-run]`

---

## 4. Security Rules & Test Coverage

- **`firestore.rules`**:
  - Authored and updated via the `firestore-rules-author` specialist subagent.
  - Role mutation is strictly forbidden to prevent privilege escalation.
  - Learners can only write evidence to their own `phaseProgress` subcollection; writing `coachFeedback` or marking `status: 'reviewed'` is denied.
  - Coaches can read learners in their classes, write `coachFeedback`, and assign programs.
  - `pbl_programs` readable by learners only if `status == 'published'` and (`visibility == 'centre'` or assigned to learner's class).
  - `auditLogs` is strictly append-only (create allowed, update and delete denied).
  - `sessions` is strictly owner-managed.
- **Unit Tests**:
  - `tests/firestore-rules.test.js`: Comprehensive rules assertions for enrolments, feedback, and role security.
  - `tests/spark-data-layer.test.js`: Zod schema validation, array normalization, and token generation.
  - **All 25 test suites (486 tests) pass cleanly.**

---

## 5. Build Hygiene & Bundle Size Comparison

Production build was performed with `NODE_ENV=production` using Vite 6 code-splitting:

| Chunk | Size Before | Size After | Notes |
|---|---|---|---|
| **Main Application (`index-*.js`)** | **2,617.5 kB** | **864.4 kB** | **67% reduction (-1,753 kB)** |
| `vendor-react` | 313.7 kB | 141.8 kB | Core React runtime |
| `vendor-icons` | (bundled) | 49.6 kB | Lucide icons |
| `sim-solar-car` | (bundled) | 68.6 kB | Solar Car Challenge code-split |
| `sim-hex-grid` | (bundled) | 73.9 kB | Hex Grid simulator code-split |
| `sim-plant-lab` | (bundled) | 38.9 kB | Plant Lab simulator code-split |
| `sim-so2-sulfate` | (bundled) | 144.8 kB | SO₂ Aerosol simulator code-split |
| `coach-pbl-studio` | (bundled) | 197.8 kB | Studio editor & synthesizer |
| `prototype-donpbl` | (bundled) | 285.5 kB | DonPBL prototype models |

Verification confirmed that no `jsxDEV` flags or developer local file paths (`/Users/admin/...`) exist anywhere in `dist/`.

---

## 6. How to Verify & Test

### On Local Emulator:
```bash
# 1. Start Firebase emulators
npm run emulators

# 2. Seed framework and library programs
npm run seed:programs:emulator

# 3. Seed emulator synthetic fixtures
npm run seed:emulator

# 4. Start frontend and API dev server
npm run server:dev:emulator
npm run start
```

### Staging / Preview Channel Deployment:
Per `AGENTS.md`, deployment to a preview channel is recommended for Mani's inspection:
```bash
firebase hosting:channel:deploy qa
```
*(Live production deploy and migration writes remain on hold pending Mani's written approval).*

---

## 7. Open Questions for Mani (Platform Lead)

1. **Design Thinking Framework (8th Phase Reflect Week Range)**:
   - "Reflect" is officially added as an 8th phase in `frameworks/welearn-dt`. However, Showcase occupies weeks `[11, 12]`. To avoid guessing whether Reflect shares week 12 (`[12, 12]`) or extends the program, Reflect's `weeks` field has been set to `null` pending your confirmation.
2. **Parental Consent for Lower Secondary 12-Year-Olds**:
   - Primary learners (ages 6–11) strictly require parental consent (`consent: { status: 'required' }`). Lower Secondary spans ages 12–14. Does the parental consent requirement apply to 12-year-olds in Lower Secondary as well, or strictly under 12?
3. **Reference Cohorts Collection (W2E & WPR)**:
   - The reference Firestore collection `cohorts` contains `cohort-w2e` (secondary) and `cohort-wpr` (primary). Should these documents be migrated to three records matching the cohorts (`primary`, `lower-secondary`, `higher-secondary`), or stay as an institutional grouping layer above cohorts? Left unmodified until your written decision.
4. **Time Outlier Reconciliation & Class Drift Migration**:
   - Ready for live execution once Mani approves in writing and exports a verified Firestore backup.

---

## 8. Cohort Migration Transition (Primary, Lower Secondary, Higher Secondary)

- **Cohorts Adopted**:
  - `primary`: ages 6–11
  - `lower-secondary`: ages 12–14
  - `higher-secondary`: ages 15–18
- **Data Contract & Server Changes**:
  - `docs/data-contract.md`: Replaced `users.ageBand` with `cohort: 'primary' | 'lower-secondary' | 'higher-secondary'`.
  - `server/safety.js`: Replaced `13-15` and `16-18` bands with `primary`, `lower-secondary`, and `higher-secondary`. Maintained strict safety block thresholds (`BLOCK_LOW_AND_ABOVE`) across all cohorts.
  - `server/routes/admin-users.js`: Updated validation and document creation to accept `cohort` with backward compatibility for legacy `ageBand`.
  - `scripts/migrate-age-bands.js` and `scripts/seed-emulator.js`: Updated to populate and migrate learner cohorts. Tested via emulator dry runs.

