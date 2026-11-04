# Local image/video upload fix for review

Prepared October 7, 2026 (Asia/Bangkok). No deployment, merge, IAM change, or live user/media changes.

Branch: `codex/fix-dashboard-image-uploads` in the isolated checkout `/private/tmp/hearisland-upload-fix`.
Baseline: `0b6300fcf54793d39a0bcc7c556640bf0111ba95`.
Final local commit: `a9d531b` (exported as `STORAGE-UPLOAD-FIX-a9d531b.patch`). The original workspace's uncommitted work is preserved.

## Result

Known permission defects are closed, phone-format failures receive actionable guidance, and private learner uploads can retry preview without sending their binary again. A successful settings/work save is no longer reported as a failed transaction solely because signing a preview URL failed afterward.

This patch does not prove that every live upload is fixed. The reported live request, file, account, and runtime were not supplied for reproduction.

## Changed files

- `storage.rules`: learner media requires an existing profile with exactly `active` status. Lesson/program uploads require active matching profiles and current signed school/class assignments. Message reads/uploads require conversation participation; updates/deletes require object ownership, with explicit verified-admin moderation. Upload owner metadata is immutable. Scoped school evidence requires an existing offering/submission and matching current school/class access. Students manage only their own submission; scoped staff may read and moderate by deleting, but cannot overwrite another author's file.
- `firestore.rules`: conversation updates cannot change participants or other identity fields; only summary/unread fields may change. This closes the route by which an existing participant could add an outsider and bypass the new Storage membership gate.
- `src/features/messages/messagesAPI.js`: attachment uploads include `ownerUid` metadata and normalized MIME.
- `src/features/community/communityAPI.js`, `src/services/mediaUploadValidation.js`: image/video format and size checks happen before upload. Errors distinguish byte-upload failure from attachment URL retrieval failure.
- `src/features/personalization/learnerUpload.js`: MIME normalization/fallback, explicit HEIC/HEIF and MOV guidance, stage-specific errors, owner checks, preview retry on the retained path, and explicit discard of the unsaved upload.
- `src/features/personalization/usePersonalization.js`, `Personalization.jsx`: preview retry/discard actions; pending uploads block competing file selection; failed saves retain draft attachments. Saved-but-unavailable previews show a warning rather than causing re-upload.
- `server/routes/personalization.js`: strict preview requests return `503 PREVIEW_UNAVAILABLE` if signing fails. Read/save responses preserve data and committed revisions with a preview warning. No new public read permission or cloud IAM role is granted.
- `index.html`, `src/firebase.js`: local emulator mode wires Storage to port 9199, uses a demo bucket, and wires secondary registration apps consistently.
- `firebase.json`, `package.json`: Storage emulator configuration, complete local start commands, and a Storage test command. No dependency was added.
- `vitest.config.js`, `tests/learner-upload.test.js`, `tests/personalization-ui.test.jsx`, `tests/api/personalization.test.js`, `tests/storage/dashboard-media.test.js`, `tests/storage/learning-media.test.js`, `tests/storage/media-hardening.test.js`: meaningful regression coverage for format validation, retry/discard, signing failure after a committed save, active profiles, stale assignments, outsiders, owner metadata spoofing/overwrite, moderation, and protected conversation identities.

## Validation

| Check | Result |
|---|---|
| `npm run test:storage` (Firestore + Storage, `demo-hearisland-local`) | 27 passed across 3 files |
| `npm test` (Firestore, `demo-hearisland-rules`) | 607 passed across 30 files |
| Auth/Firestore emulator + `vitest run --config tests/api/vitest.api.config.js tests/api/personalization.test.js` | 13 passed; signing and object metadata mocked |
| `npm run build` | Passed |
| `git diff --check` | Passed |

The full-suite total already includes the upload unit/UI tests; do not add their count again. Tests use synthetic identities and bytes. MIME-rule tests are authorization tests, not real media-decoding or malware validation.

## Compatibility and limits

1. HEIC/HEIF and MOV are deliberately not presented as playable supported formats. Export photos to JPEG/PNG and genuinely convert videos to MP4/WebM. No HEIC decoder or video transcoder was installed. Existing community/message rules still permit legacy QuickTime files; the updated clients guide new uploads to supported formats.
2. Real Safari/iPhone capture, decoding, playback, browser network behavior, and full browser-to-Storage-to-API upload flows remain unverified. The UI recovery path was verified in jsdom with a simulated preview failure.
3. The legacy `schools/{schoolId}/submissions/{submissionId}/evidence/{filename}` path is denied. No current uploader for it was found. Future evidence uploads must use the actual offering/submission model; this patch supplies the rules, not a new evidence-upload screen. Review any external/older clients before deployment.
4. Legacy message objects without `ownerUid` remain readable by participants but cannot be overwritten/deleted by ordinary clients. Verified admin moderation can delete them. Any metadata backfill must verify ownership from trusted message records; it is not included.
5. Existing permanent download-token URLs are not revoked or converted to scoped URLs by this patch. Storage membership rules protect SDK requests, not possession of an existing bearer URL. A separate controlled migration is needed if revocation of these URLs is required.
6. Explicit discard deletes a pending unsaved learner upload. Closing a tab does not guarantee immediate cleanup; existing backend cleanup removes unreferenced objects older than its 15-minute grace period when invoked by a later save. No background cleanup job was deployed.
7. Staff account profile/role/assignment data must be active and mirrored in signed claims; stale or missing grants now fail closed. The learner customization API remains learner-only; this patch does not expand dashboard roles or create staff customization endpoints.
8. No email-domain restriction was applied. It is a separate policy that could block legitimate non-WeLearn users.

## Production signing verification required

The API uses the Admin Storage SDK's `getSignedUrl`. Tests prove response/retry behavior when signing fails, not that the live runtime can sign. Identify the actual deployed runtime service account and credential mechanism, then verify object-read permission and signing permission. IAM-backed signing needs `iam.serviceAccounts.signBlob` on the signing identity; local private-key signing uses a different mechanism. Do not grant `storage.admin` as a workaround. No cloud permission was changed.

## Review before deployment

Review the commit and compatibility notes, verify active account records/assignments, test representative JPEG/PNG/MP4 files in a nonproduction browser environment, and check the live signing identity. The changed frontend/backend and both rules files need coordinated release because message uploads now include ownership metadata and Firestore membership fields must stay protected. Production release requires separate owner approval.

References: [Firebase Storage rules API](https://firebase.google.com/docs/reference/security/storage), [Storage emulator setup](https://firebase.google.com/docs/emulator-suite/connect_storage).
