# Program Trash: backend contract for Gemini

Status: frontend built on `feature/program-maker-rich-editor` (uncommitted, 2026-11-25). Nothing deployed.
Needs from Gemini: one scheduled purge job, and a review of the fields below against `firestore.rules`.
No rules change is required for the frontend to work.

## What coaches can do now
- In the Program library (`#/pbl/programs`) a coach sees a trash button on programs **they authored**
  (`authorId`/`authorUid` == their uid). Built-in WeLearn programs (Don's prototype + `LIBRARY_PROGRAMS`)
  have no button.
- A program one of the coach's classes is running cannot be removed; the dialog tells them to move the
  class to another program first.
- Removing moves it to **Trash** for 7 days. Trash lists it with days left and a Restore button.
  After 7 days it is gone for good.

## Fields the client writes on `pbl_programs/{programId}` (merge)
| Field | Type | On remove | On restore |
|---|---|---|---|
| `deletedAt` | number (ms epoch) | now | `null` |
| `deletedBy` | string uid | coach uid | `null` |
| `purgeAt`   | number (ms epoch) | `deletedAt + 7 days` | `null` |
| `updatedAt` | number | (unchanged) | now |

These go through the existing `allow update` (author or org admin). Every program list in the app
(`ProgramLibrary`, `ClassProgramsPanel`, `HomeSearch`, `MyCourses`, `getAllPrograms`) skips a record
with a truthy `deletedAt`.

## Asked of Gemini
1. **Purge job** (scheduled function, e.g. daily): delete `pbl_programs` docs where `purgeAt <= now`
   and `deletedAt != null`. Rules keep `allow delete: if false`; the Admin SDK bypasses them.
   Suggested query: `where('purgeAt', '<=', Date.now())` (single-field index is automatic).
   Decide what else goes with it (enrolments on that programId, Storage media) and log what was removed.
2. **Optional hardening**: in `allow update`, a teacher who is not the author should not be able to set
   `deletedAt` (already true today because only the author may update). Decided by Mani 2026-11-25:
   only the author removes their own programs; built-in WeLearn programs are never removable, admins included.
3. **Optional**: reject `deletedAt`/`purgeAt` that are not numbers or where `purgeAt - deletedAt != 7 days`.

## Client-side details you may meet
- A local index `localStorage['hearisland.pbl_program_trash.v1']` keeps a tombstone after purge, so a
  Firestore copy that the job has not deleted yet cannot reappear on that device.
- Learners on other devices are hidden from a trashed program by the `deletedAt` field alone.

Files: `src/features/coach/programs/programTrash.js`, `src/features/coach/programs/customProgramsStore.js`,
`src/features/pbl/programs/ProgramLibrary.jsx`, tests in `tests/program-trash.test.jsx`.
