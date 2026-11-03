# Student profile space — Gemini 3.8 task (backend limits + deployment)

Written by Claude on 2026-10-06 after the UX/UI refinement.

## Context

You own Firebase configuration and deployment for HearIsland. The student profile space feature is on branch `codex/student-profile-space` (checkout `/private/tmp/hear-island-student-space`). GPT 6.1 will commit the reviewed frontend and leave the handoff in `docs/implementation/STUDENT-PROFILE-SPACE-GEMINI-HANDOFF.md`. **Wait for that commit SHA before deploying.**

How the feature stores data (do not change these shapes):

- Images are cropped locally to PNG (profile 640×640, cover 1600×600) and uploaded to `learnerMedia/{uid}/{uuid}/{name}` via `storage.ref(path).put(file,{contentType})`.
- The client then calls `POST /api/learner-space/media-preview` with `{media:{path,name},kind}` to get a temporary signed preview URL.
- Settings are saved with `PUT /api/learner-space`. Only owned asset `{path,name}` is persisted. No public download-token URLs.
- Private goals and support info must never appear in portfolio responses (`/api/learner-portfolios/...`).

## Backend limits to close

1. **Orphaned uploads:** images uploaded and then discarded, undone or replaced before saving stay in Storage. Design and implement cleanup, e.g. a scheduled function that deletes `learnerMedia/{uid}/**` objects older than 24h that no saved learner-space document references, and/or delete the previous asset on a successful save that replaces it. Never delete referenced assets.
2. **Signed-URL expiry:** check the expiry used by media-preview and by learner-space GET. If a URL can expire while a learner is on the page, make sure a reload re-signs it, and document the expiry time.
3. **Storage rules:** confirm that only the owner can write to `learnerMedia/{uid}/`, that content type is limited to images/allowed media, that size is ≤20 MB, and that clients have no public read. Add emulator rule tests.
4. **Server validation:** confirm `PUT /api/learner-space` rejects asset paths outside `learnerMedia/{uid}/`, and that portfolio endpoints never return dashboard goals or support info.

## Deployment (only after the steps above pass)

- Run `npx vitest run` with the Firestore emulator on port 8088 (`firestore-rules` and `sim-economy` included) and `npm run build`.
- Deploy to **staging** first: rules, functions, hosting. Smoke-test there with a real account: upload photo and banner → crop → save → reload → image still shows; discard leaves no lasting change; portfolio view shows no private data.
- Then deploy to **production** from the reviewed commit only. Do not merge main or overwrite ongoing coach/backend work without the user's approval.
- Keep `SCHOOL_GEMINI_API_KEY` and other Secret Manager bindings unchanged.

## Report

What you changed (files, rules, functions), test results, the staging URL and smoke-test results, the production deploy time and version, plus any rollback steps.
