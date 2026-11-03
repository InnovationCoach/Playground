# Deployment & Release Report: Coach Activity Builder Phase 1

**Date**: 4 October 2026  
**Target Project**: `dnd-master-73449`  
**Hosting Target**: `https://dnd-master-73449.web.app`  
**Cloud Function Target**: `api(us-central1)` (`https://api-6my6jtc3oa-uc.a.run.app`)  
**Feature Branch**: `feature/coach-activities-p1`  
**Final Merge SHA**: `6763d69` (`main`)  
**Deployment Lead**: Gemini 3.6  

---

## 1. Executive Summary

Phase 1 of the **Coach Activity Builder** (Manual Activities, Studio & Activity Player) has been refined, integrated with recent `main` changes (including Student Dashboard Redesign and Portfolio Maker), verified across all 4 test suites, merged into `main`, and deployed to production.

No AI generation, provider adapters, key management, or later-phase features were introduced in this release.

---

## 2. Refinements & Enhancements

1. **Coach Activity Studio (`ActivityStudio.jsx`)**:
   - Supports blank activity creation and the *Sustainable Futures* sample activity.
   - Editors for all 9 block types: `intro`, `steps`, `prediction`, `simulation`, `dataTable`, `chart`, `check`, `code`, and `reflection`.
   - Block reordering via UI buttons and `Alt + ArrowUp / ArrowDown` keyboard shortcuts. Dynamic table index tracking (`reorderBlocks`) ensures `chart` block references stay valid when source `dataTable` blocks move.
   - Accessibility & Focus: Focus trap in safety review modal (`PublishDialog`), visible focus indicators (`:focus-visible`), `Escape` key dismissal, focus restoration, and `prefers-reduced-motion` animations disabled.
   - Live desktop and 390 px mobile preview switcher.

2. **Student Activity Player (`ActivityPlayer.jsx`)**:
   - Keyboard accessible input elements and responsive layout.
   - Interactive data tables and SVGs charts with accessible list fallback (`<ul aria-label="...">`).
   - Knowledge checks with post-answer explanation reveals.
   - Display-and-copy MicroPython / MakeCode text block with clipboard copy feedback.
   - Written reflection pre-fills the editable lesson evidence summary (`body`).
   - Offline-tolerant local response storage (`localStorage`) isolated by learner UID, school, offering, lesson, and revision.
   - Idempotent submission retry: re-submitting with identical answers reuses the submission ID without duplicating XP awards.

3. **Backend & Security Contract (`server/routes/school-workspace.js`)**:
   - Class-scoped access control on all lesson and activity routes.
   - Provenance forced to `{ aiAssisted: false }` for manual lessons, preventing client-side spoofing.
   - Safety confirmation (`safetyConfirmed: true`) enforced at publish time for AI-assisted activities.
   - Published lessons remain immutable.
   - Firestore security rules deny direct client reads/writes to `coachAiConnections`, `activityDrafts`, and `aiUsage`.

4. **i18n & Localization**:
   - Full string coverage in English (`en`), Chinese (`zh`), and Thai (`th`).
   - Chinese and Thai translation strings documented as draft translations for native-speaker review.

---

## 3. Automated Test Verification Results

All automated test suites were executed cleanly after merging `main`:

| Suite | Command | Result |
|---|---|---|
| **Unit Tests** | `npm run test:unit` | **436 / 436 passed** (24 test files) |
| **API Integration Tests** | `npm run test:api` | **94 / 94 passed** (8 test files with emulators) |
| **Rules & Full Suite** | `npm test` | **540 / 540 passed** (26 test files with emulators) |
| **Production Build** | `npm run build` | **Passed (961ms)** · **Zero chunks > 500 kB** |

**Bundle Chunk Highlights**:
- `ActivityStudio`: **16.53 kB** (Lazy loaded)
- `ActivityPlayer`: **8.83 kB** (Lazy loaded)
- `JourneyPortfolio`: **16.32 kB** (Lazy loaded)
- Largest chunk: `index-D7g14D5L.js` at **159.09 kB** (well under 500 kB threshold).

---

## 4. Production Deployment & Smoke Tests

### Firebase Releases
1. **Firestore Rules**: Successfully compiled and released `firestore.rules`.
2. **Cloud Functions**: Deployed Node.js 20 2nd Gen `api(us-central1)` (`https://api-6my6jtc3oa-uc.a.run.app`).
3. **Hosting**: Version finalized and 75 files released to `https://dnd-master-73449.web.app`.

### Production Smoke Test Output
1. **Unauthenticated API Guard**:
   - Request: `GET https://dnd-master-73449.web.app/api/learner-space`
   - Outcome: `HTTP 401 UNAUTHORIZED` (`UNAUTHENTICATED`).
2. **CORS Guard**:
   - Request: `GET https://dnd-master-73449.web.app/api/learning-context` with `Origin: https://evil.example`
   - Outcome: Access denied; no origin reflection.
3. **Authenticated Coach Flow (`coach.wpr@school.edu`)**:
   - Verified authentication (UID `xrqLZDnFleQ0SAfaUqSFROSGdmp1`, role `teacher`).
   - Fetched program offerings for `school-wpr` (`2026-2027-sustainable-futures`).
4. **Authenticated Student Flow (`akira@welearn.org`)**:
   - Verified authentication (UID `d27J9hvQwMfpZjsRIrvS0lhBrWo1`, role `student`).
   - Fetched program offering lessons for `school-wpr`.

---

## 5. Rollback Reference

In the event of a production issue:
- **Previous Release Commit**: `e89e070`
- **Rollback Hosting Command**: `firebase hosting:clone dnd-master-73449:<previous_version> dnd-master-73449:live`

---

## 6. Documented Limitations

- Chinese and Thai translations are drafts marked for native-speaker review.
- Shared-validator error diagnostics remain in English alongside localized helper text.
- Local answer recovery is per-device (`localStorage`), not cross-device cloud draft sync.
