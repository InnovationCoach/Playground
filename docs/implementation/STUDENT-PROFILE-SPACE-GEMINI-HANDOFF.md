# Student profile space — reviewed frontend handoff to Gemini

Date: 2026-10-06
Branch: `codex/student-profile-space`
Checkout: `/private/tmp/hear-island-student-space`
Reviewed frontend commit: **`64fce2dd24bcacfcfd56c23522ca67ec688fa959`**
Base: `5d0d247`; original profile functionality: `c83d5ab`.

This handoff follows the backend/deploy task in [STUDENT-PROFILE-SPACE-GEMINI-TASK.md](STUDENT-PROFILE-SPACE-GEMINI-TASK.md). No deployment, main merge, Firebase configuration/rules change, or coach/backend edit was performed for this review. This document is a separate documentation commit after the frontend commit above.

## Reviewed changes and fixes

- Kept Claude's learner-name heading, editable tagline, photo camera control, cover control, inline Image settings, interest chips, and single sticky dashboard Save changes / Undo / Discard bar. Portfolio saving remains separate.
- Fixed a real browser regression: selecting a file through the camera button with Image settings collapsed did not open the crop dialog. Both image buttons now expand their underlying inputs before invoking the native picker.
- Explicitly remember the picker opener and restore focus to the camera/banner button after Cancel, Escape or successful Apply; direct input selection retains its input as the opener.
- Normalize settings before PUT so image references contain only owned `{path,name}`. Signed preview URLs, content types and portfolio-entry response data are excluded from this settings payload; revision is retained. Updated the API mock to rehydrate a signed URL in its save response, matching the real server.
- Centralized private-profile, toolbar, cover-placeholder, crop, error/status and save-bar copy in `src/features/personalization/profileSpaceStrings.js`. English wording is unchanged; locale selection/translations remain future work.
- No upload occurs before Use this crop; cancellation does not call Storage. Successful Apply uploads the locally cropped PNG and produces an unsaved settings preview. Save persists the asset reference.
- Reviewed keyboard/drag widget ordering, Undo/Discard, default layout restoration, revision-safe Undo after saving, failed-upload recovery, validation, safe text rendering, and separate private dashboard/portfolio presentation. Goals and dashboard introduction are excluded from portfolio previews. Server privacy/ownership implementation was inspected without editing it.

## Validation

| Check | Result |
| --- | --- |
| Focused profile UI/model/crop tests | 25 passed across 3 files |
| Full `npx vitest run` with local Firestore emulator on 127.0.0.1:8088 | **591 passed across 28 files; no skipped tests** |
| Profile UI tests within the full suite | 15 passed (Claude's 1 addition and 3 picker/reset/focus regression cases) |
| `npm run build` | Passed; Vite 6.4.3, 2068 modules, 956 ms, no oversized-chunk warning |
| `git diff --check` | Passed |

Full tests were launched through `firebase emulators:exec --config /private/tmp/student-space-emulator.json --only firestore --project demo-hearisland-rules 'npx vitest run'`. The disposable configuration was outside the repository and loaded its existing Firestore rules; the emulator shut down afterward. The initial sandbox-only run could not connect to port 8088; the successful emulator run supersedes it. The full run emitted the existing jsdom `Window.scrollTo()` not-implemented warning; no tests failed. API integration and Storage-emulator suites were not separately run in this frontend review.

### Actual browser file-picker checks

Local fixture: `http://127.0.0.1:5190/`, running the existing `tests/profile-space-preview/vite.config.js` preview. Used actual camera/banner buttons and native file chooser with a generated local PNG; did not use the fixture's synthetic crop buttons for these checks.

| Initial state | Verified |
| --- | --- |
| Both images absent | Camera → chooser → photo crop → Cancel restores camera focus and leaves images absent. Banner → chooser → banner crop → Apply adds cover; Undo restores absent cover. |
| `?images=cover` (banner only) | Camera → chooser → Apply adds photo, keeps banner; Discard restores banner-only state. Focus returns to camera. |
| `?images=photo` (photo only) | Banner → chooser → Apply adds cover, keeps photo; Discard restores photo-only state. Focus returns to banner. |
| 375 × 812 mobile | Actual banner crop and actions fit; document scroll width equals 375 px. Temporary viewport override reset after testing. |

Proof: `docs/implementation/student-profile-space/refined/review-mobile-real-banner-picker.jpg`. Claude's desktop 1440 px, tablet 615 px, long-name, empty, image and save-bar captures remain in that directory. Development hot updates emitted duplicate-createRoot warnings in the fixture; no crop-flow runtime failure was observed after the fix.

**Boundary:** file chooser, image decoding, crop preview and canvas PNG encoding were real. Upload/save responses were simulated by the fixture. This is not an authenticated staging or production persistence test.

## Gemini backend work required before release

Keep the existing contracts:

- Local crop output: photo 640 × 640 PNG; cover 1600 × 600 PNG (animated GIF produces one still frame).
- Storage path: `learnerMedia/{uid}/{uuid}/{name}`, uploaded with explicit content type.
- `POST /api/learner-space/media-preview`: `{media:{path,name},kind}`; response supplies a temporary signed preview URL.
- `PUT /api/learner-space`: structured settings plus current revision; image references only owned `{path,name}`. Never persist public download-token URLs.
- Private dashboard goals, notes and support information must never reach shared portfolio endpoints/previews.

1. **Orphan cleanup:** cropped files uploaded on Apply remain in Storage when discarded, undone or replaced before Save. Implement safe cleanup, for example pruning unreferenced objects older than 24 hours and/or deleting replaced assets after a successful save. Check references across saved private-dashboard and portfolio images/work before deletion. Never delete a referenced asset.
2. **Signed URL lifetime:** current server inspection shows five-minute signed URLs. Verify both media-preview and learner-space GET, document the lifetime, and confirm reload issues fresh URLs. Check behavior after expiry during an open session. This review did not add automatic renewal.
3. **Storage security and tests:** verify only the owner writes `learnerMedia/{uid}/`, allowed MIME types, size ≤20 MB, and no public/browser reads. Add/run Storage emulator rule tests; the 591-test run covered existing Firestore/economy tests, not new Storage rules.
4. **Server validation/privacy:** verify PUT rejects other-user paths, malformed references and invalid revisions, validates actual uploaded file metadata, and portfolio responses omit private goals/support information. Test owner/coaches/classmates/approved wider audience boundaries.

The retained English Image settings note says "nothing is kept until you save." Settings references are saved only on Save, but Apply already creates a Storage object. Close orphan cleanup before release and review the disclosure for accurate storage behavior; English was intentionally left unchanged in this localization preparation.

## Gemini staging/deployment sequence

1. Integrate the reviewed branch revision without overwriting ongoing coach/backend work. Do not merge main without the user's approval.
2. Finish the backend items above and record the new backend commit(s). Re-run full Vitest with Firestore emulator8088, relevant API/Storage security tests, and the production build against the integrated revision.
3. Deploy rules, functions and hosting to **staging first**. Keep `SCHOOL_GEMINI_API_KEY` and other Secret Manager bindings unchanged; never expose credentials.
4. With a real learner account on staging: select photo and banner through the actual buttons → crop → Apply → Save → reload → verify images persist; verify expiry/re-signing; Cancel creates no upload; Discard changes no saved reference; Undo and keyboard/drag ordering work; portfolio audiences never see private data. Confirm cleanup does not remove referenced work.
5. Only after staging passes and release is authorized, deploy the reviewed integrated revision to production. No production release was performed or authorized by this frontend review request.
6. Report changed backend/rules/functions files, exact tested/deployed revision(s), test counts, staging URL and authenticated smoke results, production deployment time/version, and rollback steps.

Open items: backend cleanup, URL lifetime/renewal verification, Storage security tests, authenticated staging persistence/privacy smoke testing, subsequent authorized release, and actual translated locale maps.
