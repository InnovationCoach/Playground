# Portfolios & transcripts: backend contract for Gemini

Frontend: built by Claude on 2026-11-23 (uncommitted, branch `feature/program-maker-rich-editor` working folder).
Backend: **not built**. `server/`, Firestore/Storage rules and indexes are Gemini's. Nothing has been deployed.

## What it does
- **Coach** (Coach dashboard → "Portfolios & transcripts" tab): uploads a file (PDF, DOCX, PNG, JPG, ≤ 5 MB) for one of *their* learners, with kind, title, optional term and note. Sees only their own uploads and their status; may withdraw an upload while it awaits review.
- **Admin** (`#/admin/records`, SPARK card "Portfolio & Transcripts", sidebar "Portfolios & transcripts"): sees every upload in the organisation, downloads it, approves it or returns it to the coach with a note, and marks approved files "shared with parents" after sending them to the family.
- **Supervisor**: same list as admin, read-only (download allowed, no approve/return/share).
- Parents and students: no access. Sharing with parents is done by the admin outside the app for now.

Frontend files: `src/features/records/learnerRecords.js` (client calls), `LearnerRecordsPanel.jsx`, `learnerRecords.css`. Local-dev stand-in that shows the expected shapes: `src/services/api/learnerRecordsFallback.js` (only answers on localhost with emulators when the API returns 404).

## Endpoints (add to `server/routes/pilot-operations.js`, base `/api/pilot/learner-records`)
All require a verified token claim role (existing `requireClaims` + pilot role middleware). `orgId` from the caller.

| # | Method & path | Who | Behaviour |
|---|---|---|---|
| L1 | `GET /learners` | teacher/coach | `{ items: [{ id, displayName }] }` — students whose `classIds` intersect the caller's claim `classIds`, same org. |
| L2 | `GET /` | coach → own uploads (`coachUid == caller.uid`); admin/supervisor → all in org | `{ items: Record[] }`, newest first. **Never include file bytes.** |
| L3 | `POST /` | teacher/coach | Body `{ learnerUid, type, title, term, note, fileName, contentType, size, fileData }` (`fileData` = `data:<mime>;base64,...`). Validate: learner is in caller's classes; `type ∈ portfolio, transcript, report, other`; title 1–120 chars; term ≤ 40; note ≤ 500; contentType ∈ pdf/png/jpeg/docx and decoded bytes match it (check magic bytes); decoded size ≤ 5 MB. Store bytes in Storage at `learnerRecords/{orgId}/{learnerUid}/{recordId}/{safeFileName}`, write metadata to Firestore `learnerRecords/{recordId}`. Returns `201 { id }`. |
| L4 | `GET /:id/download` | admin/supervisor (any in org); coach (own) | `{ url, fileName }` — short-lived signed URL (≈5 min) with `Content-Disposition: attachment; filename="<fileName>"`. |
| L5 | `PATCH /:id` `{ status, response }` | **admin only** | `status ∈ approved, returned`, only from `submitted`; `response` ≤ 500, required when `returned`. Sets `updatedAt`, `updatedBy {uid,name}`. Returns the record. |
| L6 | `PATCH /:id` `{ sharedWithParents: bool }` | **admin only** | Only when `status == approved`. Sets/clears `sharedAt`. Returns the record. |
| L7 | `DELETE /:id` | owning coach | Only while `submitted`; deletes doc and Storage object. 409 otherwise. |

Errors use the existing `sendError` shape (`{ error: { code, message } }`) — the UI shows `message`.

## Record shape (Firestore `learnerRecords/{id}`)
```
{ id, orgId, learnerUid, learnerName, coachUid, coachName,
  type, title, term, note,
  fileName, contentType, size, storagePath,
  status: 'submitted' | 'approved' | 'returned', response,
  sharedWithParents: bool, sharedAt: ISO|null,
  createdAt: ISO, updatedAt?: ISO, updatedBy?: { uid, name } }
```
`storagePath` stays server-side (omit from responses).

## Rules
Server-only (Admin SDK): Firestore `learnerRecords/{id}` and Storage `learnerRecords/**` → `allow read, write: if false;` for clients.

## Notes
- JSON body limit is already 8 mb in `server/app.js`; 5 MB files fit after base64.
- Add an audit log entry on approve/return/share, like the leave requests.
- Learner records are personal data about minors: keep downloads behind signed URLs, never public URLs.
