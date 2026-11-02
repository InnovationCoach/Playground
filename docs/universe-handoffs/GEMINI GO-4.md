# Backend Go 4: unlocking a planet with a coach-approved mission

**Date:** 1 November 2026
**Decision by:** Mani: "Coach-approved mission", chosen in the Claude session.
**Specification by:** Claude
**Build owner:** Gemini (server/, rules, scripts)
**Scope of this step: EMULATOR ONLY.**
- Work on a branch.
- No deploys, no production project, no live data.
- Tests and the emulator use `--project demo-hearisland-rules`.
- Go 5 (any cloud deploy) still needs Mani's separate written "go".

## 1. The rule in one sentence
A locked planet opens for a learner only when the **server** holds a record that the learner submitted a linked mission **and their coach approved it**. Clicks, self-checks, answers, browser storage and simulation outputs never unlock anything.

## 2. Proposed data (server-written only)

`missionSubmissions/{submissionId}`

| Field | Type | Notes |
|---|---|---|
| `learnerUid` | string | From the verified ID token, never from the request body |
| `classIds` | string[] | Copied from the learner's user document at submit time, so coach scoping works |
| `missionId` | string | Must exist in the server's mission registry (§4) |
| `missionVersion` | string | The version the learner worked on |
| `routeId` | `'guided' \| 'advanced'` | Must exist on that mission |
| `reflection` | string | The learner's written recommendation, 20–2,000 characters |
| `status` | `'submitted' \| 'approved' \| 'returned'` | |
| `coachUid` | string \| null | Set on review |
| `coachNote` | string \| null | Up to 1,000 characters, shown to the learner |
| `createdAt`, `reviewedAt` | timestamp | Server timestamps |

- **Excluded: self-check results.** They are practice, not evidence.
- **Rules:** client `write: if false`. Read is allowed for the learner (`learnerUid == auth.uid`) and for a coach who shares a class (`classIds` against the coach's `classIds` claim). Admin access follows the existing admin pattern.
- **One open submission** per learner per mission. A returned submission may be resubmitted, which creates a new document; history is kept.

## 3. Proposed endpoints (Express, mounted under `/api`)

| Method and path | Who | Behaviour |
|---|---|---|
| `POST /api/universe/missions/:missionId/submissions` | Signed-in learner | Body: `{ routeId, missionVersion, reflection }`. Validate the mission, route, version and length. **Reject with 409 if the mission's status isn't `reviewed`** (drafts can't be submitted in production; the emulator may allow drafts behind an explicit test-only flag). Rate-limit. |
| `GET /api/universe/missions/submissions/mine` | Learner | The learner's own submissions, newest first |
| `GET /api/coach/universe/submissions?status=submitted` | Coach | Only learners in the coach's classes. Paginated. |
| `POST /api/coach/universe/submissions/:id/review` | Coach of that learner | Body: `{ decision: 'approved' \| 'returned', note }`. Allowed only from `submitted`. Idempotent. Audit-logged via `server/lib/audit.js`. |
| `POST /api/universe/access` | Learner | As already specified (§2.3 of `GEMINI BACKEND.md`). A planet whose unlock is `mission-approved` is `available` if an approved submission exists for that learner and `missionId`, otherwise `locked`. It never returns requirement text. |

On any failure, the client shows "Access not connected". This is already built.

## 4. Mission registry and the catalog link (proposed)
- **Mission registry:** the server needs its own trusted list of missions (id, versions, routes, status). Proposed: a versioned JSON published like the cosmos catalog (for example `public/missions/v1/missions.json`, generated from `src/features/universe/missions/*.js`), with a copy bundled into the function. The server must never trust mission data sent by the client.
- **Catalog link:** planets gain an optional field `unlock: { type: 'mission-approved', missionId: 'spacecraft-journey' }`. Requirement text stays in the catalog.
- **Content change, Claude's job once the contract is agreed:** Boreas's sample requirement ("an Ice and Climate mission") points to a mission that doesn't exist. Proposed: catalog 1.2.0 links Boreas to `spacecraft-journey`, with matching requirement text. Note that `spacecraft-journey` is still a **draft**, so in production nobody can submit it, and Boreas stays locked until an educator approves the mission.

## 5. Tests (emulator)
- **Rules:**
  - a client can't create or alter `missionSubmissions`
  - a learner reads only their own submissions
  - a coach reads only their own classes' submissions
  - other learners are denied
- **API:**
  - auth is required
  - a draft mission is rejected (409)
  - bad route or version is rejected
  - reflection length is enforced
  - duplicate open submissions are rejected
  - a coach can't review another class's learner
  - review is allowed only from `submitted`
  - approval makes `/api/universe/access` return `available` for the linked planet, and `locked` before approval
  - a returned submission keeps the planet locked
- **No XP, ledger or reward fields anywhere.**

## 6. Front end (Claude, after Gemini confirms the contract)
- **Mission dialog, reflection step:** a "Send to my coach" button. It appears only for signed-in learners on a reviewed mission (or in the emulator), and shows the submission status and the coach's note.
- **Explorer:** call `/api/universe/access` and show Locked or Available from the server, with the existing "Access not connected" fallback.
- **Coach workspace:** a review list (pending submissions, read the reflection, Approve or Return with a note).

## 7. What Gemini should deliver now
1. Confirm or amend §2–§4 in `GEMINI BACKEND.md` as the Go 4 contract, with any changes explained.
2. Implement it **in the emulator only**, on a branch from `feat/universe-backend-go3-emulator`:
   - routes
   - rules for `missionSubmissions` (default-deny client writes)
   - the mission registry
   - the tests in §5
3. Run the existing suites (`npm run test:unit`, the rules tests) and report changed files and results.
4. Then stop. No deploys.
