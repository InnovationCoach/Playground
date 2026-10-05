# Coach AI Activity Builder — Phase 2 report

Implemented on `feature/coach-activities-p2`, isolated from the shared main checkout. GPT owns contract decisions and feature work under the user's October 5 instruction; Gemini 3.6 owns Firebase setup and deployment. No Claude dependency remains.

## Changes

- Prominent **Programs & activities** and **Create your own program** controls replace the hard-to-find creation entry. New programs remain selectable immediately after creation. Class/year/semester and existing join-code management are retained.
- Students can find **Coach programs** in navigation and Courses, enroll by code, and select authorized coach-created programs. Saved coach home/course routes render the coach workspace.
- School-key activity generation, one validation repair, owned seven-day drafts, editable revision checks, same-type block regeneration, resumable drafts, safe text rendering and English/Chinese/Thai UI messages.
- Server-owned AI provenance survives edits; publication requires explicit safety confirmation. Review status comes from the server. Client-supplied provenance cannot relabel a generated linked lesson as manual.
- Assigned-class authorization is checked before inference and again before persistence. Transactional token reservations protect concurrent school budgets; rolling-hour limits apply across schools. Provider errors are sanitized and unknown billing is conservative.

## Verification

Unit suite: **476 passed** (25 files). API integration suite: **112 passed** (9 files). Combined rules/unit suite: **580 passed** (27 files). Production build passed; largest emitted chunk **159.81 kB**, with no chunk over 500 kB. Tests used isolated disposable emulators; the final test instance shut down after completion.

Browser review used disposable local coach/student accounts: coach created **Microgrid makers**, issued a code, generated and regenerated simulated activity content, saved and safety-reviewed publication. Student enrolled with the code, opened the lesson, entered table data, recorded an experiment and submitted reflection/evidence. The coach could see the submitted work. Keyboard activation and responsive widths 375px, 615px and 1440px were checked; settled page widths had no horizontal overflow. Automated checks cover keyboard block reordering and regeneration instructions staying attached to their block.

Screenshots are in [coach-activities-p2](./coach-activities-p2/): coach programs at desktop/tablet widths, AI form, publication, student submission and student mobile/desktop layouts.

## Limits and handoff

The preview's `local-mock` adapter uses static simulated Gemini responses. No real provider call or production microphone test is claimed; voice is outside this feature. The live site has not been updated. Secret binding/model configuration and real-generation deployment checks belong to Gemini and are detailed in [the Firebase handoff](./COACH-AI-ACTIVITIES-PHASE-2-FIREBASE-HANDOFF.md).

Personal API keys remain Phase 3. Generated simulation blocks use the existing supported resource-lab engine; arbitrary scripts and new advanced simulation engines are not enabled. Contact-data checks are heuristic, quota reservations are intentionally conservative, expired draft storage is not automatically pruned, and new translations would benefit from native-speaker review.

Local review instructions and disposable credentials are in [the test guide](./COACH-AI-ACTIVITIES-PHASE-2-TEST-GUIDE.md).
