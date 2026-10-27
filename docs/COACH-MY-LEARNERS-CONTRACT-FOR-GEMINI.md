# My Learners (coach): backend contract for Gemini

Status: **proposal, nothing deployed.** The frontend is built on branch `feature/coach-my-learners` (`src/features/coach/myLearners/`). This file describes behaviour. You own the rules, indexes, server and scripts, and how they are written and optimised. Nothing here authorises a deploy: Mani approves each one in writing.

## Why it is needed

My Learners reads only records the current rules already allow a coach to read:
- `users` filtered by the coach's `classIds` claim
- `users/{uid}/activityProgress`
- `users/{uid}/dailyStats`
- `assignments` where `classId` is one of the coach's classes

The coach's **own** records have no backend yet:
- check-ins
- private notes
- notes approved for parents
- agreed milestones
- feedback on evidence
- competency judgements
- coach-added evidence
- parent reports

They are stored **on the coach's device only** (`localStorage`, key `welearn.coachRecords.v1:<coachUid>:<learnerUid>`). The screens say so. This is acceptable for review on the emulators. **It is not acceptable before real learners**:
- the records do not follow the coach to another device;
- other coaches of the class cannot see them;
- private notes about minors sit in browser storage.

Two existing paths were considered and **not** used:
- `users/{uid}/feedback` and `users/{uid}/ratings` allow create, update and delete by **any signed-in user** (`isAuthenticated()`). They need tightening whatever happens with this contract.
- `users/{uid}/notes` is owner-only, so the learner would own the coach's notes.

The only code that changes when the backend lands is `loadRecords` / `saveRecords` in `src/features/coach/myLearners/coachRecordsStore.js`. Every mutator there is a pure, validated function, and the document shapes below match it.

## Already live in the frontend: phase submissions (no new rules needed)

My Learners' Evidence tab is now the one coach review screen. It reads `enrolments` (queried per learner with `learnerId ==`) and each enrolment's `phaseProgress`. A phase with `status: 'submitted'` is "awaiting coach feedback". Saving feedback writes to the learner's own record:

```
enrolments/{enrolmentId}/phaseProgress/{phaseId}
  coachFeedback: { text, coachId, at }   // no rating: the coach gave none
  status: 'reviewed'
  updatedAt: <ms>
```

This works under the current rules. In the emulator, a coach of another class gets `permission-denied`. Please:
- **P1:** Restrict the coach update on `phaseProgress` to `coachFeedback`, `status`, `updatedAt`. Today a coach may rewrite the learner's `evidence` too.
- **P2:** Remove the `!exists(enrolment) && isTeacher()` branches on `phaseProgress` read, create and update. They let any teacher read or write when the enrolment doc is missing.
- **P3:** `pblService.saveCoachFeedback` writes `rating: 5` when no rating is given. My Learners doesn't call it. Drop the default or the field.
- **P4:** Retire the Evaluation Desk tab in `CoachPblStudio` (your folder). Remove `evaluationsStore.js` and its hard-coded submissions, which it also writes into each browser's `localStorage` under `hearisland.coach_evaluations.v1`; that copy needs clearing too. Point coaches to `#/coach/dashboard` (My Learners) instead.
- **P5:** No learner screen calls `submitPhaseEvidence` yet. Until one does, there are no real submissions to review.

## Proposed data (shape only; paths are your call)

"Coach of L" means the same test as the current `isCoachOf(L)`: a teacher claim whose `classIds` overlaps the learner's `classIds`.

| Record | Fields | Suggested path |
|---|---|---|
| Check-in | `id, at, strength, challenge, nextAction, followUpOn (YYYY-MM-DD), shareWithParent (bool), authorUid` | `learners/{L}/checkIns/{id}` |
| Agreed milestone | `id, title, dueOn, doneOn \| null, fromCheckIn?, at, authorUid` | `learners/{L}/milestones/{id}` |
| Goal set by a coach | `id, text, dueOn \| null, doneOn \| null, at, authorUid` | `learners/{L}/coachGoals/{id}` |
| Feedback on evidence | `evidenceKey, text, at, authorUid` (keys: `proj:<id>`, `prog:<programId>:<n>`, `coach:<id>`) | `learners/{L}/feedback/{evidenceKey}` |
| Competency judgement | `id, competencyId, level ∈ {independent, support, insufficient}, evidenceKeys[], note, at, authorUid` | `learners/{L}/assessments/{id}` |
| Coach-added evidence | `id, kind, title, body, link (http/https only), phase, project, at, authorUid` | `learners/{L}/coachEvidence/{id}` |
| Note for parents | `id, text, at, authorUid` | `learners/{L}/parentNotes/{id}` |
| Private note | `id, text, at` | `coachPrivate/{coachUid}/learners/{L}/notes/{id}` |
| Parent report | `id, period{from,to}, text{…}, selectedEvidence[], sources{checkIns[], sharedNotes[], assessments[]}, status ∈ {draft, approved}, approvedAt, createdAt, updatedAt, authorUid` | `learners/{L}/reports/{id}` |

## Behaviour (who / operation / allowed)

| # | Who | Operation | Allowed? |
|---|---|---|---|
| M1 | Coach of L | read check-ins, milestones, feedback, judgements, coach evidence, parent notes and reports for L | yes |
| M2 | Coach **not** of L (other class) | read or write any of L's coaching records | **no** |
| M3 | Coach of L | create a check-in, milestone, feedback, judgement, coach evidence or parent note for L, with `authorUid == auth.uid` | yes |
| M4 | Coach of L | update a milestone or a coach-set goal written by another coach of L (e.g. mark it done) | **yes** (decided, Q2) |
| M4b | Coach of L | update or delete another coach's check-in, judgement, note or report | **no** |
| M5 | The author coach | read or write their own private notes about L | yes |
| M6 | Anyone else: other coaches of L, the learner, parents, admins and supervisors, by any route including the server | read private notes | **no**. Private notes stay private (decided, Q3). |
| M7 | Learner L | read coaches' feedback on their evidence, goals coaches set for them, milestones, and coach-added evidence about them | **yes** (decided, Q1) |
| M7b | Coach of L | read L's own goals (`users/{L}.goalPlan`, already allowed) | yes (decided, Q1) |
| M8 | Learner L | read check-ins, judgements, parent notes, reports | **no** |
| M8b | Admin or supervisor | read (never write) check-ins, milestones, coach-set goals, feedback, judgements, parent notes and reports | **yes**, read-only (decided, Q5). Never private notes (M6). |
| M9 | Learner L | write any coaching record | **no** |
| M10 | Parent | read any coaching record directly | **no**. Parents only ever get an approved report through the server (S3). |
| M11 | Coach of L | set `status: approved` on a report | yes, and only together with `approvedAt == request.time` |
| M12 | Anyone | change an approved report's `text`, `period` or `selectedEvidence` | **no**. A change creates a new draft (the client already does this), so what a parent saw is never rewritten. |
| M13 | Judgement with `level` ≠ `insufficient` and empty `evidenceKeys` | create | **no** (no judgement without evidence) |
| M14 | Coach-added evidence with a non-http(s) `link` | create | **no** |
| M15 | `users/{uid}/feedback`, `users/{uid}/ratings` (existing) | create, update, delete by a signed-in user who is not a coach of `uid` | **no** (tighten the existing rule) |

## Server endpoints (none exist yet)

| # | Endpoint | What it does | Why |
|---|---|---|---|
| S1 | `GET /api/coach/learners/summary` | One row per learner in the caller's claim classes: the fields `buildLearner()` needs (project stage, evidence timestamps, programs, last saved), plus the coaching records. | Today the client does 2 subcollection reads per learner (N+1). Fine for 50, slow for 300. Running the same `buildLearner` server-side keeps one definition of status. |
| S2 | `POST /api/coach/learners/:uid/reports/draft-text` | **AI drafting.** Input: the record ids the coach selected (never private notes; reject if any are passed). Output: draft text per section, each sentence carrying the ids it came from. | No report-drafting endpoint exists. The frontend currently offers only a "summary of the facts" button that restates records with fixed templates. The model must not add achievements, grades, observations or explanations that are not in the cited records. |
| S3 | `POST /api/coach/learners/:uid/reports/:id/share` | Publishes an **approved** report to the linked parents' portal (`GET /api/parent/children/:uid/progress` or a new reports list). | Nothing sends today. Coaches print or save as PDF. Never automatic: the coach presses Share, and only `status == approved` is accepted. Needs an audit-log entry. |
| S4 | Academic platform (Edmentum, LTI 1.3 AGS) | Per learner: courses, assignments with due dates and completion, assessment results, progress against pacing. | Every academic field shows "Not available" until this exists. Keep grades separate from PBL competency judgements; the UI never merges them. |
| S5 | Storage upload for coach evidence | Photos and documents uploaded by the coach, scoped like M1–M3. | Evidence is links only today. |

## Migration from device storage

When the backend lands, offer each coach a one-time "Move my records from this device" action:
- it reads `welearn.coachRecords.v1:<coachUid>:*`, posts it through the same validators, then clears the device copy;
- it is never automatic or silent;
- private notes go only to `coachPrivate/{coachUid}`.

## Decisions (Mani, 2026-10-26)

- **Q1, what learners see:**
  - Learners see coaches' feedback on their evidence.
  - Coaches can set goals for learners, and learners see those goals.
  - Coaches see the learners' own goals.
  - Consequences:
    - add `coachGoals` (M7);
    - learners need a "Goals from your coach" view on `#/goals` (frontend, after the store exists);
    - feedback on non-phase evidence must move from the device to `learners/{L}/feedback` (M7).
  - Check-ins, judgements, parent notes and reports stay coach-only (M8).
- **Q2, co-coaches:** yes, co-coaches of the class may edit each other's milestones and coach-set goals (M4). Check-ins, judgements, notes and reports stay with their author (M4b).
- **Q3, private notes:** they stay private: the author only, with no admin, supervisor or server read path (M6).
- **Q5, admin and supervisor oversight (2026-10-26):** admins and supervisors may read, but never write, coaches' check-ins, judgements, parent notes and reports (and the learner-visible records). Private notes stay author-only (M8b, M6).
- **Q4, retention: 30 days, confirmed by Mani on 2026-10-26.**
  - A Firestore TTL policy deletes private notes and unapproved report drafts 30 days after their last update.
  - Approved reports are not deleted by this rule.
  - The coach is told "Deleted after 30 days" next to private notes and drafts.
  - Still open: a safeguarding concern written in a private note would also be deleted after 30 days, so concerns need their own recording route outside private notes.

The frontend now has coach-set goals, stored on the device until `coachGoals` exists. Learners can't see them yet, and the screen says so.
