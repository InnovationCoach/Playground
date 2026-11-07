# Shared Programs library: backend handoff for Gemini

Branch: `feature/programs-library` (local, not pushed). Date: 2026-11-07.
**Status: requires Mani's written approval.** This changes permissions, so `AGENTS.md` requires it before anything is applied. Nothing here has been deployed, and `firestore.rules` on this branch is unchanged apart from the existing `ai_usage` baseline block.

Until these rules are applied, the frontend fails safely: "Save & Preview" reports "You do not have permission to do this. Nothing was saved."

## What Gemini owns

| File | Change |
| --- | --- |
| `firestore.rules` | Apply `firestore.rules.patch` in this folder (full text: `firestore.rules.proposed`). |
| `tests/programs-library-rules.test.js` | After applying, delete the `.proposed` path and read `firestore.rules`. Keep the tests. |
| `firestore.indexes.json` | No change. Every query is a single-field `where('orgId', '==', …)`, sorted on the client. |
| `server/` | No new route is needed. All writes are client transactions constrained by rules. |

## Schema

**`program_library/{programId}`**: staff only. `programId` is the same id as the published `pbl_programs` doc.
`programId, orgId, creatorUid, creatorName, title, description, unit (map), status ('draft'|'published'), draftVersion (int, +1 per saved change), publishedVersion (int|null), hasUnpublishedChanges (bool), createdAt, updatedAt, publishedAt (ms|null), lastPublishedAt, lastPublishedBy`

**`program_library/{programId}/comments/{id}`**: staff only, append-only.
`authorUid, authorName, orgId, body (1–2000 chars), view ('draft'|'published'), version (int), createdAt`

**`coach_notifications/program-review_{programId}`**: staff only, create-only, written in the same transaction as the record's first save. One document per program, so retries cannot duplicate it. Recipients are every library-role account in the org except `actorUid`.
`type ('program_review'), programId, orgId, actorUid, actorName, programTitle, createdAt`

**`users/{uid}/notificationReads/{notificationId}`**: owner only. `readAt`.

**`pbl_programs/{programId}`** (existing): a library publish adds `libraryManaged: true, libraryVersion, orgId`.

## Permission changes to approve

1. Coaches, admins and supervisors in an org can read drafts, comments and notifications. Students, parents, signed-out users and other orgs cannot.
2. The creator or an `admin` can edit and publish. A supervisor can read and comment only.
3. **`pbl_programs` tightens for library programs only.** Today any teacher can update any program. A `libraryManaged` doc, or an id with a `program_library` record, becomes writable only by its creator or an admin. Legacy programs keep today's behaviour.
4. **Admins gain write access to library-managed `pbl_programs`**, which they did not have, because the brief says only owners and admins may publish.
5. A missing `orgId` claim counts as `org-welearn`.

## Decisions Mani should check

- **Org claim.** `scripts/grant-coach.js` sets only `role` and `classIds`, so real coaches probably have no `orgId` claim. The fallback matches `server/routes/admin-users.js`. It is right while there is one organization; a second one would need a claim backfill first, or its unclaimed coaches would land in WeLearn. Production claims were not inspected.
- **Suspended coaches** keep access until their token expires. The rules use claims alone, as `isTeacher()` does elsewhere. `canWriteCoachRecord` shows the stricter pattern if wanted.

## Existing issues found, for Gemini to review

1. **Published courses lose content (not fixed).** `publishProgram` and this library both store `PblProgramContractSchema` output, and that schema strips `realProblem`, `subtitle`, and session fields such as `learningGoal`, `learnerChoices`, `teacherTips`, plus `materialsAndKit`, `teacherGuidance`, `coachCues`, `makerSpaceSpecs`. Students see fallback text: the driving question under "The real problem", and "Community impact" placeholders. The preview shows this faithfully because it runs the same pipeline. Fix: extend the schema (`src/services/pblService.js`, which names Gemini as owner); previews and new publishes then pick it up automatically, with no library change.
2. **`POST /api/pbl/programs/:programId/archive`** (`server/app.js`) lets any coach archive any program, bypassing the creator-only rule above. It should check `program_library.creatorUid` or admin.
3. **`src/services/pblService.js` was changed on this branch: please review.** `getProgram` returned this device's cached copy before Firestore, so republished content did not reach a learner who had already seen the course. Cached custom programs no longer outrank Firestore; the cache remains the offline fallback. Covered in `tests/programs-library-preview.test.jsx`.
4. **Baseline conflict.** Carrying the repaired `/api/pbl/synthesize` onto main conflicted with main's `gradeRange` prompt line and programme upper-casing. The repaired route was kept, so `gradeRange` is ignored. Restore it if anything sends it. The studio does not.
5. **Lost-acknowledgement edge.** Comments use `addDoc`; a dropped response followed by a manual resend could post twice.

## How to verify

```bash
firebase emulators:exec --only firestore --project demo-hearisland-rules --config firebase.programs-library.local.json "npx vitest run tests/programs-library-rules.test.js"
```

Do not run a bare `firebase deploy`. Rules deployment needs Mani's separate written "go" for that exact step.
