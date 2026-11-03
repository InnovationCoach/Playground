# Coach program resources

Local implementation, 7 October 2026. Built on the existing uncommitted ProgramMaker work without replacing it.

Coaches can add program posters, MP4/WebM video, PDF, PPT and PPTX resources. The first program image appears on its catalogue card. The program resource gallery and lesson attachments use a shared renderer: images display, videos play, PDFs open in a separate tab, and PowerPoint presentations download. Files are limited to eight per program or lesson, 100 MB each. Uploads persist one file at a time so completed resources remain saved after a later failure.

Program assets use programMedia/{schoolId}/{offeringId}/{uid}/{filename}. The PATCH /api/schools/:schoolId/program-offerings/:offeringId/media route checks the creator (or admin), assigned classes, object paths, verified Storage metadata and optimistic revision. Storage rules enforce creator/class access. Lesson Storage rules and backend validation also accept PDF and PowerPoint files. Permanent SDK download tokens are removed during attachment validation. Authorized reads issue one-hour signed URLs after program enrollment checks; previously issued URLs can remain usable until expiry.

Deployment must include the web build, API and storage.rules together. This turn did not deploy or alter production content. Signed URL generation still requires a correctly configured production Storage bucket and signing permissions. The live URL opened at sign-in; live coach/student upload testing requires test account access. This change addresses coach lesson/program resources; the separate learner portfolio document flow remains outside this change.

Validation completed: production build, dashboard/program maker regression tests, file metadata validation, program API authorization and enrollment tests with Auth/Firestore emulators, and Storage emulator checks for PDF/PPT/PPTX, foreign authors, students, removed class claims, published lessons and unsupported types. Storage tests run with npm run test:storage. Program API tests are in tests/api/program-media.test.js; the dashboard upload integration test is in tests/school-workspace-ui.test.jsx.

The isolated preview is tests/school-preview/index.html using tests/coach-preview/vite.config.js. Preview records and uploads never use real Firebase; its PDF and poster are fixtures.
