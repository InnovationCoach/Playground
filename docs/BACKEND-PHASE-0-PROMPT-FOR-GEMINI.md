# Task prompt: WeLearn backend, Phase 0 support

You are the **backend engineer** on WeLearn Growth Hub (repo
`/Users/admin/Desktop/HearIsland`, Firebase project `dnd-master-73449`). Claude
owns the frontend. It has finished its Phase 0 screens, which currently run
on a **mock API in the browser**. Your job in Phase 0 is to make the real
backend able to replace that mock, **working locally against the Firebase
emulators only**. Nothing is deployed in this phase.

Read the whole document before you change anything. Section 10 lists when you
must stop and report back instead of continuing.

Background documents. Read them in this order:
1. `docs/FRONTEND-PHASE-0-NOTES.md`: what Claude built, and the contract
   additions the screens depend on.
2. `docs/BACKEND-PHASE-A-PROMPT-FOR-GEMINI.md`: the data model (§5), the
   permission matrix (§6) and the API contract (§7). **This document does not
   replace it.** It picks out the part of Phase A that can be built now,
   before the Blaze plan exists, and adds what the Phase 0 screens need.
3. `src/services/api/mockBackend.js`: the executable reference for the
   behaviour the screens expect. Where this prompt and the mock disagree,
   **this prompt wins**. Tell Claude about the disagreement in your handoff.

---

## 1. Why Phase 0 has backend work at all

The plan says Phase 0 "needs nothing from the school". That is true of your
part too: none of it needs Blaze, Microsoft 365 or Edmentum. The Firebase emulators
cover everything. Doing it now means Phase A becomes "deploy and migrate" and
not "build, deploy and migrate".

Your deliverables, in priority order:

| # | Deliverable | Why it matters |
|---|---|---|
| P0 | **Restore `firestore.rules`** so every rules test passes | The working tree is currently unsafe (§3) |
| P1 | **Emulator seed**: org, schools, cohorts, programme, classes, one account for every role, parent links | Claude and reviewers need real data locally |
| P2 | **Admin, parent and session API** in the Express server, running under `npm run server:dev:emulator` | Lets the screens switch from mock to live |
| P3 | **API tests** against the emulators, covering every endpoint in §6 of this prompt | "Done" means verified (§11) |
| P4 | **Handoff report**: `docs/BACKEND-PHASE-0-HANDOFF.md` | Claude builds against it |

---

## 2. Ground rules

### Ownership. Do not cross these lines.

| You own | Claude owns (do not edit) | Coordinate first |
|---|---|---|
| `server/`, `functions/` if you create it | `src/`, `index.html`, `public/` | `firebase.json` |
| `firestore.rules`, `firestore.indexes.json` | `vite.config.js`, `vitest.config.js` | `package.json` (put your deps in a clearly separate commit) |
| `scripts/` | `tests/growth-hub-phase0.test.js` and the other frontend tests | `src/utils/joinCode.js` (shared: import it, never fork it) |
| `tests/firestore-rules.test.js`, new `tests/api/*` | `docs/FRONTEND-*` | |

If the frontend needs a change so it works with your API, **write it in the
handoff**. Do not edit `src/`.

### Git: read this carefully

- `main` has **~57 uncommitted paths** (several are whole new directories; both engineers' work, never
  committed). `git worktree add` from `HEAD` would give you a tree **without**
  the hardened server, the tests or the frontend. **Do not use a fresh
  worktree.**
- Work in this checkout. Create your branch with `git switch -c backend/phase-0`
  (uncommitted changes come with you). Commit **only files you own**, in small
  commits. **Never** run `git stash`, `git reset`, `git checkout -- <file>`,
  `git clean` or `git add -A`. Any of them can destroy the other engineer's
  uncommitted work. Stage files by explicit path.
- End each commit message with a line saying it was written by Gemini.

### Security invariants (from the Phase A brief §2). Breaking one fails the task.

1. `role` comes **only** from the custom claim. Never from an email address, a
   request body, localStorage, or a Firestore field the client can write.
2. A user can never change their own `role`, `orgId`, `schoolIds`,
   `classIds`, `status`, `publicId` or `consent`.
3. Every read is scoped: a teacher sees their classes, a supervisor their
   schools, an admin their organisation, a parent only their linked children.
4. Audit entries for admin actions are written **server-side** with
   `source: 'server'`. No client can forge, edit or delete them.
5. No endpoint reports success unless the write committed. This project has
   already shipped UI that said "saved" while Firestore rejected every write.

### Absolutely not in Phase 0

No `firebase deploy` of anything: rules, functions or hosting. No command
against the production project. No production migration. No Microsoft Graph
code that sends mail (build the pluggable interface only, §7). No Edmentum/LTI,
catalogue, gradebook or consent flow.

---

## 3. P0: restore `firestore.rules` (do this first)

**Current state, verified 2026-09-27:** `firestore.rules` was modified on
2026-09-25. `/users/{userId}` and at least eight subcollections (`goals`,
`dailyStats`, `activityProgress`, `ratings`, `feedback` and others) now say
`allow read: if isAuthenticated();`. The comments right next to them describe
owner and coach scoping. With these emulator hosts set:

```
FIRESTORE_EMULATOR_HOST=127.0.0.1:8088 npx vitest run tests/firestore-rules.test.js
```

**13 tests fail**, including:
- `student data isolation > a student CANNOT read a classmate profile` (also: goals, dailyStats)
- `coach access is scoped to their own classes > a coach CANNOT read a student from another class` (also: goals)
- `coach roster query (list, not get) > a coach CANNOT list the whole users collection` (also: another class's students, another class's weeklyTasks, and a student listing classmates)
- `privilege boundary: role > an email containing "coach" grants nothing`
- `weeklyTasks are no longer world-writable` (two tests)
- `SO₂ simulation runs > a classmate CANNOT read a run; the class coach can`

What to do:
1. Before editing, find out **why** it was loosened. `grep` the repo, and read
   `firestore-debug.log` and any notes. The likely reason is a feature that
   broke under the strict rules (for example a query that was not constrained). If you find one,
   **fix the query's constraint in your report** (Claude will change `src/`),
   not the rule.
2. Restore the scoping the comments describe. Use the existing helpers
   (`isOwner`, `isTeacher`, `myClassIds`, `coachSharesClassWith`, `isCoachOf`).
   On `/users/{userId}` itself, keep the `resource`-based check, not `get()`.
   The comment in the file explains why (`list` queries fail with "Null value error").
3. **Do not edit a test to make it pass.** If you believe a test is wrong, stop
   and report it (§10).
4. Add rules and negative tests for the Phase 0 fields. Self-update of the own
   user document must:
   - **allow** `locale` and `updatedAt` (the Settings screen writes
     `{locale, updatedAt}` with `set(..., {merge: true})`);
   - **deny** changes to `role`, `orgId`, `schoolIds`, `classIds` (except the
     existing `isSelfEnrolment()` path), `status`, `publicId`, `consent`
     and `enrolledVia`.
5. Add these collections as **client-write: false, client-read: false**:
   `organizations`, `schools`, `cohorts`, `programmes`, `publicIds`,
   `parentLinks`, `parentInvites`. The API is the only reader and writer in Phase 0.
6. `auditLogs`: fix the leak described in the Phase A brief §8. Today any
   teacher reads every entry. Clients may only create entries with
   `source == 'client'`. Server entries are unreadable to clients in Phase 0,
   because the console reads history through the API.
7. The owner must still be able to **read** their own `status`. The frontend signs a
   user out when their profile has `status: 'suspended'`.

**Done when:** every test in `tests/firestore-rules.test.js` passes (report
the count before and after) and the new negative tests exist. **Do not deploy.**

---

## 4. P1: emulator seed (`scripts/seed-emulator.js`)

Extend the script. Do not replace it. Keep every existing account (the two
coaches, the five students, password `review123`), because review notes and
memory refer to them. Keep it idempotent: running it twice must not
duplicate anything.

Add, following the Phase A data model (§5), with `FieldValue.serverTimestamp()` everywhere:
- `organizations/org-welearn` "WeLearn". Existing seed classes use
  `org_riverside`: **move them to `org-welearn`** so there is one org.
- Two schools, for example `sch-bkk` (Asia/Bangkok) and `sch-online`.
- `cohorts`: `W2E` (ageBands `13-15`, `16-18`) and `WPR` (ageBands
  `primary`), with `name: {en, zh, th}`.
- `programmes`: Thai Diploma (`defaultLocale: 'th'`).
- Tag every class with `orgId`, `schoolId`, `cohortId`, `yearLevel`, `coachIds`, `status`.
- Give every user `orgId`, `schoolIds`, `status`, a unique `publicId`
  (with its `publicIds/{id}` doc), plus `givenNames` and `surname`.
- **These review accounts** were created by hand for Phase 0 and must now come
  from the seed, with the same emails and password `review123`:
  - `admin.test@school.edu`: claims `{role: 'admin', orgId}`
  - `supervisor.test@school.edu`: `{role: 'supervisor', orgId, schoolIds: ['sch-bkk']}`
  - `parent.test@school.edu`: `{role: 'parent', orgId}`. Link it to
    `mia@school.edu` with a `parentLinks` doc.
  - Also add one **primary** WPR student, `status: 'pending'`,
    `consent: {status: 'required'}`, and one **suspended** student
    (Auth `disabled: true`).
- A few `auditLogs` entries (`source: 'server'`) so the history tab has content.
- Re-issue coach claims **preserving `classIds`**.

Print a table of every account, its role and its password when the script finishes.

---

## 5. P2: server structure

`server/gemini-index.js` builds the app **and** calls `app.listen()` when it is
imported, so it cannot be tested with supertest or reused by Cloud Functions
later. Refactor:
- `server/app.js` exports `createApp()` (middleware + routes, no listen).
- `server/gemini-index.js` becomes the local entry point that calls `createApp().listen(PORT)`.
  Keep `npm run server:dev` and `npm run server:dev:emulator` working unchanged.
- The admin, parent and session routes go in their own modules (e.g.
  `server/routes/admin-users.js`, `server/routes/parents.js`,
  `server/routes/reference.js`). Put shared logic in `server/lib/`
  (errors, pagination, audit, publicId, email).

**Auth middleware.** The existing `requireAuth` is not good enough for these
routes, for three reasons:
1. When the Admin SDK is not ready it lets the request through as
   `dev-unverified`. **Admin, parent and session routes must never accept an
   unverified caller.** Return `500 INTERNAL` instead.
2. It calls `verifyIdToken(token)`. These routes need
   **`verifyIdToken(token, true)`** (checkRevoked), so a suspended user is refused at once.
3. It returns `{ error: 'string' }`. These routes need the contract shape.

Write `requireClaims` (or similar) for the new routes. It puts `{uid, email,
role, orgId, schoolIds, classIds}` from the **verified token claims** on
`req.caller`. Leave the AI endpoints' behaviour unchanged in this phase.

**Errors.** Every error from the new routes uses:
```json
{ "error": { "code": "VALIDATION", "message": "Human readable.", "field": "phone" } }
```
Codes and statuses: `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404,
`VALIDATION` 400 (always with `field`), `CONFLICT` 409, `CONSENT_REQUIRED` 403,
`EMAIL_NOT_CONFIGURED` 501, `RATE_LIMITED` 429, `INTERNAL` 500. Unknown
`/api/*` routes return the `NOT_FOUND` shape, not Express's HTML page.

**JSON conventions the frontend depends on:**
- All timestamps are **ISO 8601 strings** (`"2026-09-27T12:53:00.000Z"`),
  never Firestore Timestamp objects. The UI calls `new Date(value)`.
- Absent optional values are `null`, not missing, in single-record responses.
- Lists are `{ "items": [...], "nextPageToken": "opaque"|null, "total": 129 }`.
  `pageSize` defaults to 30, max 100. `total` is a Firestore `count()` over the
  **same filtered query**. `pageToken` is opaque (encode a cursor, for example
  base64 JSON of the sort value and the doc id).

---

## 6. P2: endpoints, with the exact behaviour the screens rely on

The frontend calls these, and only these (`src/services/api/endpoints.js`).
The mock implements each one. Match it.

### 6.1 Session
`GET /api/me` → `{uid, publicId, role, orgId, schoolIds, classIds, status, displayName, email, locale}`

### 6.2 Users (admin; supervisor read-only, scoped to their schools)

**`GET /api/admin/users`**. Query: `role`, `status`, `schoolId`, `classId`, `cohortId`, `q`, `sort`, `pageSize`, `pageToken`.
- `role` may be a **comma-separated list** (`admin,supervisor,teacher` for the Staff screen). **[addition 1]**
- `cohortId` filter. **[addition 2]**
- `q` is a **case-insensitive prefix** match on given names, surname, full
  name, email, or `publicId` (hyphens ignored: `Z32RK` matches `Z32-RKH-…`).
  Firestore cannot OR prefix queries. A workable approach is a server-maintained
  `searchPrefixes` array (lowercased prefixes of each term, capped) queried
  with `array-contains`. Choose your own approach, but explain it and make
  `total` correct.
- `sort`: `field` ascending or `-field` descending. Allowed fields:
  `surname`, `givenNames`, `createdAt`, `status`, `publicId`, `email`, `role`.
  Default `surname`. Break ties deterministically (by doc id) so pages never repeat or skip a row.
- Item shape:
  `{uid, publicId, role, status, givenNames, surname, displayName, email, schoolIds, classIds, createdAt}`.
  Students add `cohortId, yearLevel, ageBand`. Parents add
  **`childCount`** (active links). **[addition 3]**
- **Never** include `dateOfBirth`, `phone`, `consent` or support-profile data in list items.
- Legacy users with no `givenNames`/`surname` must not break the list or
  sort. Derive both from `displayName` in the response, and report how many there are.
- Supervisors see only users whose `schoolIds` overlap theirs. Teachers, students and parents get `403 FORBIDDEN`.
- Add whatever composite indexes this needs to `firestore.indexes.json`.

**`POST /api/admin/users`** (admin). Body:
`{role, email, givenNames, surname, salutation?, phone?, gender?, schoolIds, classIds?, cohortId?, ageBand?, yearLevel?, dateOfBirth?, programmeIds?, sendActivation: true}`
- Validate, and return `VALIDATION` with these exact `field` names: `role`, `email`,
  `givenNames`, `surname` (required, ≤ 80 chars), `phone` (E.164:
  `^\+[1-9]\d{7,14}$`), `gender` (`female|male|nonbinary|prefer_not_to_say`),
  `schoolIds` (≥ 1, must be schools in the caller's org), `cohortId` and
  `ageBand` (required for students; the band must be one the cohort allows).
- Email already in use → `409 CONFLICT` with `field: 'email'`.
- Creates the Auth user with **no password**, sets claims, writes `users/{uid}`
  and `publicIds/{publicId}`, and writes `ACCOUNT_CREATED` to the audit log.
  Write the Firestore documents in one transaction. If the Auth user was
  created and the transaction then fails, delete the Auth user. Never leave half an account.
- `status: 'pending'`. A student with `ageBand: 'primary'` also gets
  `consent: {status: 'required'}`.
- `programmeIds` is accepted here. **[addition 8]**
- Response `201`: the full record (as in GET below) plus
  `activation: {sent: false, reason: 'EMAIL_NOT_CONFIGURED'}` while no mail
  transport exists. **Never** return an activation link.

**`GET /api/admin/users/:uid`** (admin; supervisor if the user is in their schools, otherwise 404)
- Full record + `auth: {lastSignInAt, createdAt, disabled}` (from Firebase Auth)
  + `counts: {classes, parents? , children?}`
  + **`links: [{linkId, uid, displayName, publicId, createdAt}]`**: the active
  links (children for a parent, parents for a student). **[addition 4]**
- `dateOfBirth` is returned **to admins only**.
- Another org's user → `404`, not `403`, so the response does not reveal that the user exists.

**`PATCH /api/admin/users/:uid`** (admin)
- Editable: `salutation, givenNames, surname, phone, gender, cohortId, ageBand, yearLevel, dateOfBirth, programmeIds, locale`.
  Any other key (`role`, `email`, `status`, `classIds`, …) → `400 VALIDATION` naming that key as `field`.
- Recompute `displayName`. Set `updatedAt` and `updatedBy {uid, name}`.
- Audit `DETAILS_CHANGED` with `details: {before, after}` containing **only the
  fields that changed**. If `programmeIds` changed, write a separate
  `PROGRAMMES_CHANGED` entry. A PATCH that changes nothing writes no audit entry.
- Returns the full record.

**`PUT /api/admin/users/:uid/role`** `{role}` (admin)
- Changing your own role → `403 FORBIDDEN`. Demoting the org's last admin →
  `409 CONFLICT`. Updates the claim and the `role` mirror, **revokes refresh tokens**,
  audits `ROLE_CHANGED` with before/after, and returns the full record.

**`PUT /api/admin/users/:uid/assignments`** `{schoolIds, classIds}` (admin)
- Same token handling. Audit `SCHOOLS_CHANGED` and/or `CLASSES_CHANGED`.

**`POST /api/admin/users/:uid/suspend`** `{reason}` (admin)
- Empty reason → `VALIDATION` with `field: 'reason'`. Suspending yourself → `403`.
  Already suspended → `409`.
- Auth `disabled: true`, revoke tokens, `status: 'suspended'`, `suspendedAt`,
  `suspendedBy`. Audit `ACCOUNT_SUSPENDED` with `details: {reason}`. Returns the full record.

**`POST /api/admin/users/:uid/unsuspend`** (admin)
- Not suspended → `409`. Back to `active` if the account was ever activated,
  otherwise to `pending`. **Never** straight to active. Audit
  `ACCOUNT_UNSUSPENDED`. Returns the full record.

**`POST /api/admin/users/:uid/resend-activation`** (admin)
- `status != 'pending'` → `409`. No mail transport → `501 EMAIL_NOT_CONFIGURED`.

**`POST /api/admin/users/:uid/change-email`** `{newEmail}` (admin)
- Invalid → `VALIDATION` with `field: 'newEmail'`. Already in use → `409` with
  `field: 'newEmail'`. No mail transport → `501 EMAIL_NOT_CONFIGURED`. Write
  nothing in that case.

**`GET /api/admin/users/:uid/history`** (admin; supervisor scoped)
- Newest first, paginated. Items: `{logId, action, summary, actorUid,
  actorName, actorPublicId, details, createdAt}`. `details` never contains
  passwords, tokens or links.

### 6.3 Reference data (admin + supervisor)
- `GET /api/admin/organization`
- `GET /api/admin/schools`
- `GET /api/admin/classes?schoolId=`
- **`GET /api/admin/cohorts`**, **`GET /api/admin/programmes`** **[addition 5]**
All four lists use the list shape and are scoped to the caller's org.

### 6.4 Parents
**`POST /api/students/:uid/parent-invite`** (admin, or a teacher of that student)
- Code from `generateJoinCode()` in `src/utils/joinCode.js` (format `XXXX-XXXX`).
- Store **only a hash**. Use HMAC-SHA256 with a server secret (an env var, never
  committed; generate a random one in dev and say so). A plain unsalted hash
  of a 28⁸ code space can be brute-forced.
- `expiresAt` = now + 7 days. Issuing a new invite revokes the student's
  previous unredeemed one. Audit `PARENT_INVITE_ISSUED`.
- Response `201 {code, expiresAt}`. This is the only time the code is ever returned.

**`POST /api/parent/redeem`** `{code}` (parent only)
- Normalise with `normaliseJoinCode()` (so `n2kh r3sk` works).
- Wrong, already used and expired codes all return **the same**
  `404 NOT_FOUND` with `field: 'code'` and the same message.
- Rate limit **5 attempts per 15 minutes per parent**, stored in Firestore, not
  in memory (it must hold across instances later) → `429 RATE_LIMITED`.
- In one transaction: mark the invite redeemed, create the `parentLinks` doc
  (skip it if the link already exists), and audit `PARENT_LINKED` on the student.
- Response `{child: <child summary>}`. **[addition 6]**

**`GET /api/parent/children`** (parent only)
- Items: `{linkId, uid, publicId, givenNames, displayName, yearLevel,
  schoolName, cohortCode, status, consentStatus}`. **Nothing more**: no email,
  phone, DOB or support data. **[addition 7]**

**`DELETE /api/admin/parent-links/:linkId`** (admin)
- Sets `status: 'revoked'`, `revokedAt`, `revokedBy`. Audits `PARENT_UNLINKED`
  on **both** the student and the parent. Returns `{linkId, status: 'revoked'}`.

---

## 7. Email: the interface only

Create `server/lib/email.js` exporting `sendEmail({to, template, locale, data})`
and `isEmailConfigured()`. Phase 0 transport: **none**, so
`isEmailConfigured()` returns false and every caller takes the "not configured"
path above. Also add a **dev-only** transport that writes the rendered email to
the console, enabled only when `EMAIL_TRANSPORT=console` and never when
`NODE_ENV=production`. Templates are `activation`, `change-email` and
`parent-weekly` in `en`, `zh` and `th`. Keep them short. They will get a native-speaker
review later.

With the console transport on, `activation.sent` is `true`, and the link
appears **only in the server console**, never in the HTTP response. Test both modes.

Microsoft Graph comes in Phase A (Phase A brief §7). Design the module so
Graph slots in without any endpoint changing.

---

## 8. P3: tests

- `tests/api/*.test.js` runs the Express app from `createApp()` against the
  Auth and Firestore emulators, using real ID tokens from the Auth emulator for
  each role.
- For **every** endpoint in §6, cover: the success path, `401` (no token and a
  bad token), `403` (each role that must be refused), and the specific cases
  called out above: last admin, self-suspend, self role change, unsuspend back to
  pending, duplicate email, PATCH of a forbidden key, identical errors for wrong
  and used codes, the rate limit, a supervisor reading outside their school
  (`404`), and list items that never contain `dateOfBirth`.
- After each create, edit, suspend or redeem, **read back** the Firestore doc and
  the `auditLogs` row, and assert on them. Do not trust the response alone.
- Wire the tests into an npm script (e.g. `test:api`) that runs under
  `firebase emulators:exec`. Do not add them to `vitest.config.js` (Claude
  owns it). Tell Claude the command and Claude will add them.
- **Parity:** `tests/growth-hub-phase0.test.js` pins the mock's behaviour. Read
  it. Every behaviour it asserts should also hold for your API, or appear as a
  deviation in your handoff.

---

## 9. How Claude will verify your work

With the emulators seeded, `npm run server:dev:emulator` on :3001 and
`VITE_API_MODE=live npm start`, the browser calls same-origin `/api`, and Vite
proxies it to :3001. Claude will sign in as each review account and go through
every screen. Before you hand over, try at least the list, detail, create and
redeem calls yourself with `curl` and a token from the Auth emulator.

---

## 10. Stop and report instead of continuing if:

- Restoring the rules breaks a feature, or you find the loosening was deliberate.
- You believe a rules test or a frontend expectation in this prompt is wrong.
- A requirement here conflicts with the Phase A brief.
- Anything would touch the production project, deploy, or need credentials you do not have.
- You find a security invariant from §2 already broken somewhere else.

---

## 11. Definition of done and the handoff

"Done" means **verified against the running emulators**, not "it builds".
Write `docs/BACKEND-PHASE-0-HANDOFF.md` with:

1. **Rules:** test counts before and after (it should be 13 failing → 0 failing), the
   cause of the loosening if you found it, and every new rules test.
2. **Seed:** the table of accounts, roles and passwords.
3. **API:** the command to run it, every endpoint with a sample request and
   response JSON, and a clear list of **every deviation** from §6 of this prompt and
   from §7 of the Phase A brief. Claude builds against your handoff, so an undocumented
   difference becomes a UI bug.
4. **Tests:** the command, the count, and pasted output.
5. **Evidence:** for one create, one edit, one suspend and one redeem, the
   Firestore doc and the audit row read back from the emulator.
6. **Frontend changes needed** (Claude will make them). Examples: a changed
   field name, a query that must be constrained for your rules.
7. **Not done / not verified**, and anything that needs the user.
