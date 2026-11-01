# Backend Audit Report — WeLearn SPARK
**Date:** 24 October 2026  
**Auditor:** Gemini 3.8 (Backend and Data Engineer)  
**Target:** WeLearn SPARK (`dnd-master-73449`), build `index-CgNS5So3.js`

---

## 1. Executive Summary & Audit Mapping

This audit maps each QA issue found on 24 Oct 2026 to the exact file, function, and root cause in the codebase.

| Issue | Finding | File(s) Responsible | Function / Component | Root Cause |
|---|---|---|---|---|
| **P0-1** | Transfer write fails but UI reports success | `src/features/coach/studio/pblTransferService.js`<br>`src/features/coach/studio/CoachPblStudio.jsx` | `publishAndTransferToStudent`<br>`handleTransfer` | `pblTransferService.js` caught the Firestore error in a `try/catch`, logged `[PBL Transfer] Firestore save notice (offline/emulator mock mode active): ...`, suppressed the throw, and returned `{ success: true }`. `CoachPblStudio.jsx` then fired confetti and celebratory buzz without detecting failure. |
| **P0-2** | Student View crash on `#/pbl/programs/pbl-2e-liam-chen-2026` | `src/features/pbl/programs/catalog.js`<br>`src/features/pbl/programs/ProgramDetail.jsx`<br>`src/features/pbl/programs/useProgramProgress.js` | `normaliseProgram`<br>`programById`<br>`ProgramDetail`<br>`hydrateProgress` | `catalog.js` reads static registry without guarding against missing programs or undefined array fields (`phases`, `sessions`, `tools`, `deliverables`). When a dynamic or nonexistent slug is accessed, `phases.map(...)` throws `TypeError: Cannot read properties of undefined (reading 'map')`. |
| **P0-3** | SPARK Studio learners are hardcoded | `src/features/coach/studio/learnerProfiles.js`<br>`src/features/coach/studio/CoachPblStudio.jsx`<br>`src/features/coach/supervision/LearnerSupervisionView.jsx` | `STUDENT_2E_PROFILES`<br>`getLearnerById`<br>`CoachPblStudio` | Studio directly imported static fixture objects (Liam Chen, Maya Patel, Sam Wongsakul, Kai Srisuk) instead of querying Firestore `users` filtered by `role == 'learner'` and coach's assigned `classIds`. |
| **P0-4** | No learner self-enrolment ("Add to my course") | `src/features/courses/useAddedCourses.js`<br>`src/features/courses/MyCourses.jsx`<br>`src/features/pbl/programs/ProgramLibrary.jsx` | `useAddedCourses`<br>`togglePath`<br>`ProgramCard` | Course addition was only written to client browser `localStorage` (`pathStorageKey`). There was no Firestore path writing to `enrolments/{learnerUid}_{programId}` with `source: 'self-added'`. |
| **P0-5** | Studio programs cannot be assigned to classes | `src/features/coach/ClassProgramsPanel.jsx`<br>`src/features/pbl/programs/catalog.js` | `ClassProgramsPanel`<br>`ClassRow`<br>`PROGRAMS` | Program dropdown rendered `<option>` exclusively from static array `PROGRAMS` (imported from prototype). It never queried Firestore `pbl_programs` collection for published studio programs. |
| **P1-7** | Role filtering failure in Coach Dashboard | `src/components/Coach/CoachDashboard.js` | `CoachDashboard.loadData` | Roster query filtered out only `role === 'teacher' \|\| role === 'coach'`, allowing `parent`, `admin`, and `supervisor` accounts into the "Registered Learners" total (`32`). Registered Coaches displayed `0` because `this.coaches` was never fetched or initialized. |
| **P1-8** | Class data drift & free-text strings | `src/components/Coach/CoachDashboard.js`<br>`src/firebase.js`<br>`src/features/enrolment/joinClass.js` | `CoachDashboard.render`<br>`registerStudentAccount`<br>`joinClassWithCode` | Dashboard dropdown hardcoded string literals (`Eco-Designers 8B`, `Green Tech 9C`) not in Firestore. Student registration and join codes wrote free-text `groupName` (e.g. `"Climate Champions 7AClimate Champions 7A"`) rather than strict relational `classId` references. |
| **P1-9** | Placeholder progress defaults | `src/components/Coach/CoachDashboard.js` | `CoachDashboard.render` (Student Cards) | Card rendering used fallback defaults: `sc?.currentVersion \|\| 1`, `sc?.weight?.total ? ... : '3.20'`, and `sc?.components?.motor ? ... : 'Brushed DC'`. Telemetry rendered unconditionally even when no `solarCar_prototypes` document existed. |
| **P1-10** | Client-side account creation with shared password | `src/firebase.js`<br>`src/components/Coach/CoachDashboard.js` | `registerStudentAccount`<br>`#coach-register-student-form` listener | `registerStudentAccount` spawned a secondary Firebase client app in browser and created auth accounts directly with shared default password `Student123!`. Lacks server authorization, generates weak predictable credentials, and sets obsolete `role: 'student'`. |
| **P1-11** | Unclosed time tracking sessions | `src/utils/timeTracker.js`<br>`src/app/AuthProvider.jsx` | `logSessionHeartbeat`<br>`startTimeTracking` | Heartbeat timer blindly accumulated seconds without maintaining an active `sessions/{sessionId}` document lifecycle or closing stale sessions after inactivity, resulting in orphaned 22h+ sessions. |
| **P1-12** | Double load on Coach Dashboard | `src/features/coach/CoachDashboardHost.jsx`<br>`src/components/Coach/CoachDashboard.js` | `useEffect` in `CoachDashboardHost`<br>`CoachDashboard.init` | `CoachDashboardHost` re-instantiated `new CoachDashboard` upon React re-renders/auth updates without snapshot cleanup. Each instantiation invoked `init()` and triggered `logAuditEvent('COACH_DASHBOARD_LOADED')` twice without deduplication. |
| **P2-13** | Development build in production bundle | `vite.config.js`<br>`package.json` | Vite build pipeline | Production bundle contained `jsxDEV`, local developer machine file paths (`/Users/admin/...`), and un-split monolithic simulator bundles due to missing production build flags and chunk configuration. |

---

## 2. In-Depth Analysis of Code Paths

### A. Register Student
- **File:** `src/firebase.js` (`registerStudentAccount`, L176–L208)
- **Invocation:** `src/components/Coach/CoachDashboard.js` (Form submit handler, L1644–L1685)
- **Mechanism:**
  - Instantiates a secondary Firebase client instance: `firebase.initializeApp(firebaseConfig, "StudentReg_" + Date.now())`.
  - Calls `secondaryApp.auth().createUserWithEmailAndPassword(email, password)`.
  - Hardcodes password input to `Student123!`.
  - Directly writes to `users/{uid}` and `students/{uid}` with `role: 'student'` and string `groupName`.
  - **Risk:** Client-side privilege escalation, shared default credentials, schema divergence from `role: 'learner'` and `classIds: string[]`.

### B. Join Code Flow
- **Files:**
  - Coach issuance: `src/features/coach/classCodes.js` (`issueCode`, `revokeCode`)
  - Learner redemption: `src/features/enrolment/joinClass.js` (`joinClassWithCode`)
  - Code generation/normalization: `src/utils/joinCode.js` (`generateJoinCode`, `normaliseJoinCode`)
- **Mechanism:**
  - Coach runs a Firestore transaction on `classCodes/{code}` and `classes/{classId}`.
  - Learner fetches `classCodes/{code}`, verifies existence, and updates `users/{uid}` with `classIds: arrayUnion(classId)` and `enrolledVia: code`.
  - **Defect:** `classes/{classId}.learnerIds` is not updated when the learner joins, violating the Data Contract requirement for bidirectional class membership.

### C. Coach Dashboard Loader
- **Files:** `src/components/Coach/CoachDashboard.js` (`init`, `loadData`), `src/features/coach/CoachDashboardHost.jsx`
- **Mechanism:**
  - `loadData` fetches users matching coach `classIds`.
  - Inverted role filter: checks `if (role !== 'teacher' && role !== 'coach')`, mistakenly retaining `parent`, `admin`, and `supervisor`.
  - Fallback logic: if no class matches, queries the entire `users` collection.
  - Coach metrics: `this.coaches` is never populated, showing `0`.
  - Audit logging: `logAuditEvent('COACH_DASHBOARD_LOADED')` executes in `init()` on every uncoordinated React render cycle.

### D. SPARK Transfer Pipeline
- **Files:** `src/features/coach/studio/pblTransferService.js` (`publishAndTransferToStudent`), `src/features/coach/studio/CoachPblStudio.jsx` (`handleTransfer`)
- **Mechanism:**
  - `convertUnitToProgram` transforms studio draft into program structure.
  - Saves to client `localStorage` via `customProgramsStore.js`.
  - Attempts `setDoc(doc(db, 'pbl_programs', program.id))` and `users/{studentUid}` update.
  - Catch block suppresses errors (`console.info('[PBL Transfer] Firestore save notice (offline/emulator mock mode active): ...')`).
  - Returns `success: true`, triggering confetti in UI even if the network or Firestore security rules denied the write.

### E. Program Library (Coach & Learner)
- **Files:** `src/features/pbl/programs/catalog.js` (`normaliseProgram`, `programById`, `PROGRAMS`), `src/features/pbl/programs/ProgramDetail.jsx`, `src/features/pbl/programs/ProgramLibrary.jsx`
- **Mechanism:**
  - Hard-coded prototype registry: `PROGRAM_REGISTRY` in `prototypes/DonPBL/programRegistry.ts`.
  - `programById` checks local storage `customProgramsStore` or static `PROGRAMS`. It does not perform Firestore queries on `pbl_programs`.
  - Reader un-guarded: `normaliseProgram` and `ProgramDetail` assume all phase arrays and session collections exist. Missing docs or missing arrays crash with `TypeError: Cannot read properties of undefined (reading 'map')`.

### F. Learner Dashboard Progress Writes
- **Files:** `src/features/pbl/programs/useProgramProgress.js` (`useProgramProgress`), `src/features/pbl/programs/progress.js`
- **Mechanism:**
  - Saves progress to `users/{uid}/activityProgress/{progressDocId}` and browser `localStorage`.
  - Does not conform to Data Contract:
    - Missing top-level `enrolments/{learnerUid}_{programId}`.
    - Missing subcollection `enrolments/{id}/phaseProgress/{phaseId}` with structured evidence and coach feedback schema.

---

## 3. Corrective Plan
1. Establish `frameworks/welearn-dt` and migrate 6 library programs to Firestore `pbl_programs`.
2. Implement typed, validated `publishProgram` service rejecting on error and writing transactional `pbl_programs` + `enrolments`.
3. Guard reader `getProgram(id)` returning `{ status: 'not_found' }` and normalizing all arrays to `[]`.
4. Replace hard-coded Studio learner fixtures with `useCoachClasses` and `useClassLearners` hooks.
5. Implement `searchPrograms` and `addToMyCourse` for learner discovery and idempotent self-enrolment.
6. Centralize learner account creation into a secure backend service / Cloud Function `createLearner` with random credentials, and execute class drift migration.
7. Role-filtered counts, progress from `enrolments` + `phaseProgress`, and conditional Solar Car telemetry.
8. Revise session time tracking to 60s heartbeats with 5-minute inactivity termination.
9. Deduplicate Coach Dashboard initialization and audit logs.
10. Update Firestore rules and unit tests.
11. Optimize Vite production build configuration.
