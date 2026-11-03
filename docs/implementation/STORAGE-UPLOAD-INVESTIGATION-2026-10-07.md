# Image and video upload investigation

Date: October 7, 2026, Asia/Bangkok. Investigation only; no production changes.

## Verified evidence

- Read the production Storage release for `dnd-master-73449.firebasestorage.app` using the existing Firebase login. Its update time is `2026-10-07T05:54:58.157354Z` (12:54:58 Bangkok).
- Deployed rules are identical to the current workspace `storage.rules`. The recent local fix is already present in the deployed rule source; redeploying it alone is not a supported solution.
- Read project IAM: an unconditional `roles/firebaserules.firestoreServiceAgent` binding includes a Firebase Storage service agent. The expected cross-service role is present; this does not verify every live request.
- Ran `npm run test:storage`: 2 files, 18 tests passed, using Firestore and Storage emulators on `demo-hearisland-local`.
- Ran additional synthetic emulator probes against the exact downloaded deployed rules. MP4 owner upload succeeds; learner MOV/QuickTime and HEIC uploads fail; private learner metadata read fails after successful upload; unrelated signed-in users can upload/delete message attachments and upload school evidence without membership or parent records.
- No live uploads, media reads, account changes, IAM changes, or rule deployments were performed.

## Findings and solutions

| Finding | Evidence | Proposed solution |
|---|---|---|
| No global Storage denial in the tested rules | Own MP4 upload succeeds in emulator; existing suite passes | Capture the actual failing request before changing permission policy |
| Phone formats are inconsistent | `storage.rules:104` excludes MOV/QuickTime and HEIC; community accepts QuickTime; school media accepts MP4/WebM only | Choose supported formats deliberately: convert HEIC to JPEG and MOV to supported MP4 where feasible, or add tested support consistently across client, rules, backend validation, and playback. Do not merely rename extensions |
| Size caps vary | Learner/community/messages 20 MiB; solar car 10 MiB; lesson/program 100 MiB | Display limits before upload and reject oversized files locally; offer video compression or a separately reviewed larger cap |
| Upload and subsequent save/preview can fail separately | `usePersonalization.js:46` uploads, then line 48 calls media-preview; program editor uploads before PATCH | Distinguish upload authorization, preview generation, and metadata-save errors in UI and diagnostics. Preserve completed upload state for retry |
| Private direct reads are intentionally denied | `storage.rules:99`, `:54`, `:81`; emulator metadata read denied | Keep learner/lesson/program media private and obtain authorized temporary URLs through the API. Check signed-URL permissions if preview fails after upload; do not introduce public read access |
| Coach uploads have narrower authorization than generic signed-in access | Program creator, school/class membership; lesson author and draft status | Reproduce with the actual role and assignments. Repair missing assignments or align collaborator policy with backend permissions; do not grant all coaches access to all schools |
| Local emulator mode does not isolate Storage | `index.html:1650` wires only Auth and Firestore; `npm run emulators` starts only those; backend emulator script lacks Storage host | Wire compat Storage `useEmulator('127.0.0.1',9199)`, start Storage locally, and set backend `FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199`. Use a demo bucket/project and fail closed if local Storage is unavailable |
| Message attachments lack participant checks | `storage.rules:123`–`:131`; outsider upload/delete confirmed | Authorize reads/uploads by conversation membership and deletion/overwrite by intended ownership or explicit moderation policy. Add outsider tests |
| School evidence lacks submission/tenant checks | `storage.rules:142`–`:145`; outsider upload confirmed | Require existing submission, school/class membership and submission owner or scoped staff authorization; add cross-school and cross-owner tests |
| Missing learner profile currently permits upload | `storage.rules:95` defaults missing profile to active; confirmed probe | Decide whether enrollment/profile must exist; if required, deny missing records explicitly rather than silently treating them as active |

## Email-domain restriction

A verified `@welearn.org` gate is a separate policy decision. It does not repair MIME, size, path, role, preview, or save errors. Apply it in conjunction with existing authorization on every relevant allow path; a new broad allow rule can bypass narrower rules. Backend Admin SDK operations need corresponding application authorization because Storage rules do not govern them. Existing non-WeLearn learners would lose upload access, and unverified emails would be rejected.

## Remaining evidence needed to identify the reported live failure

For one failed image and one failed video: dashboard/URL, exact error code, upload object path and bucket, file MIME type and size, authenticated UID/role/verification status, and which request failed (Storage upload, URL/preview, or metadata save). Inspect sensitive claims locally; never share raw tokens or real student information. The currently deployed frontend/backend versions and the affected user's permissions have not been verified.

Then reproduce with equivalent synthetic fixtures, implement the smallest fix, run authorization and full-flow tests, and prepare a separate production change for owner review.

## Security audit assessment

This assessment covers the inspected Storage rules, not the entire application.

```json
{
  "score": 1,
  "summary": "Uploads can succeed, but message attachments and school evidence lack identity and tenant authorization. The specific reported live failure is not yet reproduced.",
  "findings": [
    {"check":"Field-Level vs. Identity-Level Security","severity":"critical","issue":"Any signed-in account can read, upload, overwrite and delete message attachments at a known path without conversation membership.","recommendation":"Enforce participant and object ownership/moderation checks and test outsiders."},
    {"check":"Field-Level vs. Identity-Level Security","severity":"critical","issue":"Any signed-in account can read, upload, overwrite and delete school evidence at a known path without school or submission authorization.","recommendation":"Require scoped membership and submission ownership/staff authorization."},
    {"check":"Business Logic vs. Rules","severity":"major","issue":"Local emulator mode leaves Storage unconnected while Auth and Firestore are emulated.","recommendation":"Connect frontend and backend Storage to the emulator and use explicit demo configuration."},
    {"check":"Authority Source","severity":"moderate","issue":"Missing learner profile defaults to active and passes the upload gate.","recommendation":"Require an existing authorized profile if enrollment is the intended access boundary."},
    {"check":"Business Logic vs. Rules","severity":"moderate","issue":"Accepted formats and size limits vary; MOV/HEIC are denied in learner media and post-upload preview can fail separately.","recommendation":"Align supported formats and expose stage-specific error messages."}
  ]
}
```

Official references: [Storage conditions](https://firebase.google.com/docs/storage/security/rules-conditions), [Storage emulator setup](https://firebase.google.com/docs/emulator-suite/connect_storage), [Rules deployment and cross-service permissions](https://firebase.google.com/docs/rules/manage-deploy).
