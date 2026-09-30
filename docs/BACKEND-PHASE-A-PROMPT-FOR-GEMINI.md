# Task prompt: WeLearn backend, Phase A

You are the **backend engineer** on WeLearn (repo `/Users/admin/Desktop/HearIsland`,
Firebase project `dnd-master-73449`). A separate engineer (Claude) owns the
**frontend UI/UX** and will build the admin console against the API you define
here. Your job is to make that API real, deployed and verified.

Read this whole document before changing anything. Section 9 lists the points
where you must stop and report back rather than proceed.

---

## 1. Scope of Phase A

1. **Deploy a backend.** Nothing server-side runs in production today.
2. **Expand roles** to `admin`, `supervisor`, `teacher` (shown in the UI as
   "Course Coordinator"), `student` and `parent`.
3. **Finish multi-tenancy:** `organizations → schools → classes`, with every
   class and student tagged by **cohort** (section 5).
4. **Admin console API:** list, create, edit, suspend and unsuspend accounts,
   change email, resend activation and view account history. Every change is
   written to the audit log **by the server**.

Out of scope for Phase A: Edmentum/LTI, the course catalogue, gradebook,
transcripts, enquiries, bookings, accreditations and student balances. Do not
build them.

---

## 2. The current state. Verify it yourself; do not assume.

- **Hosting** serves `dist/` statically. `firebase.json` has no `functions`
  block and no rewrites.
- **`server/gemini-index.js`** is an Express app with 8 AI endpoints
  (`/api/tutor`, `/api/hint`, `/api/design-review`, …). It only ever runs on
  `localhost:3001`. The frontend resolves its base URL as
  `import.meta.env.VITE_API_URL || 'http://localhost:3001'`, so **every AI
  feature is dead in production.**
- **`server/auth.js`** has `requireAuth` (verifies Firebase ID tokens) and
  `initAdmin()` (a key file, or `applicationDefault()` as fallback). Reuse
  both. Do not write a second auth layer.
- **`server/safety.js`** holds the AI safety settings, age bands and
  prompt-injection wrapping. Do not weaken any of it.
- **Roles** are the custom auth claim `role`, currently only `teacher` or
  absent (= student). A teacher's classes are in the `classIds` claim. The only
  tool that sets them is `scripts/grant-coach.js` (CLI, Admin SDK).
- **Tenancy boundary** is `users/{uid}.classIds` vs the teacher's `classIds`
  claim. `organizations` and `schools` collections **do not exist**.
- **Join codes**: `classCodes/{CODE} → {classId, className}`, issued by
  `scripts/class-codes.js`. The code format and alphabet are in
  `src/utils/joinCode.js`, which is shared by the browser and scripts. Import it
  and do not fork it.
- **`firestore.rules`** is default-deny and is the spec for who reads what.
  `tests/firestore-rules.test.js` encodes it (`npm test` runs it against the
  emulator).
- **The working tree has ~55 uncommitted changes that have never been
  deployed**, including the hardened rules. Run `git status` and treat
  production as possibly still running an older ruleset.
- **Gemini API key** is in `.env` as `GEMINI_API_KEY` (gitignored). The model
  name comes from `GEMINI_MODEL`, default `gemini-3.6-flash`.

### Security invariants. Breaking any of these is a failed task.

1. `role` comes **only** from a custom claim. Never from an email address, a
   request body, localStorage, or a Firestore field the client can write.
   (A previous version granted coach access to any email containing "coach".)
2. A user can never change their own `role`, `orgId`, `schoolIds`, `classIds`
   or `status`.
3. Every read of student data is scoped: a teacher sees only their classes, a
   supervisor only their schools, an admin only their organization, a parent
   only their linked children.
4. Audit entries for admin actions are written **server-side** and cannot be
   forged, edited or deleted by any client.
5. No endpoint reports success unless the write actually committed. This
   project has already shipped UI that showed "saved" while Firestore rejected
   every write.

---

## 3. Ownership, so two engineers do not collide

| You own | Claude owns | Coordinate first |
|---|---|---|
| `server/`, `functions/` (if you create it) | `src/`, `index.html`, `public/` | `firebase.json` (hosting section) |
| `firestore.rules`, `firestore.indexes.json` | `vite.config.js` | `package.json` (add your deps under a clear commit) |
| `scripts/` (migrations, bootstrap) | frontend tests | `src/utils/joinCode.js` (shared) |
| `tests/firestore-rules.test.js`, new API tests | | |

- Work on branch **`backend/phase-a`**, preferably in a separate git worktree.
- Commit in small, reviewable commits.
- Do **not** edit `src/`. If the frontend needs a change to work with your API,
  write it in the handoff report (section 10) instead.

---

## 4. Deployment target

Use **Cloud Functions for Firebase (2nd gen)**, wrapping the existing Express
app with `onRequest`. Node 20 or 22, a single region that you state in your
report.

- Add a Hosting rewrite: `{"source": "/api/**", "function": {"functionId": "api", "region": "<region>"}}`.
  The browser then calls **same-origin `/api/...`**, which needs no CORS.
  Restrict CORS to the hosting origins plus `http://localhost:5173` for dev.
- `GEMINI_API_KEY` goes in Secret Manager via `defineSecret`. Set it from `.env`
  **without printing the value** to the terminal or to logs.
- In the function, Admin SDK uses `applicationDefault()`. Never deploy a key
  file.
- Keep `npm run server:dev` / `server:dev:emulator` working for local dev. The
  same Express app must run both ways.
- Replace the in-memory `rateLimits` Map with something that works across
  instances, or document plainly that it is per-instance only.
- Set `minInstances: 0` and a sensible `maxInstances`. State the expected cost.
- **This requires the Blaze plan.** If the project is not on Blaze, stop and
  report (section 9).

Frontend note: `VITE_API_URL=''` does **not** work, because the empty string is
falsy and falls back to localhost. Claude will change the frontend default to
same-origin. Do not work around it on your side.

---

## 5. Data model

Use `FieldValue.serverTimestamp()` for every timestamp. Every tenant document
carries `orgId`.

### `organizations/{orgId}`
`name`, `status: 'active'|'suspended'`, `defaultLocale: 'en'|'zh'|'th'`, `createdAt`, `createdBy`

### `cohorts/{cohortId}`
`orgId`, `code` (e.g. `W2E`, `WPR`), `name` (per locale: `{en, zh, th}`),
`ageBands[]`, `defaultLocale`, `curriculumFrameworks[]` (e.g. `NGSS`, Thai
national curriculum), `status`. Cohorts are **data, not an enum**: the school
added a third one (Thai Diploma) while this brief was being written, so adding a
cohort must never need a code change or deploy. Admin-only writes.

### `programmes/{programmeId}`
A dual programme a student takes **alongside** their cohort. The first is the
**Thai Diploma**: teacher-led (not Edmentum), taught in Thai, open to every
cohort, with its own transcript. Fields: `orgId`, `code`, `name` (`{en, zh, th}`),
`defaultLocale: 'th'`, `curriculumFrameworks[]`, `teacherIds[]`, `status`.
Enrolment is admin-only (`PUT /api/admin/users/:uid/programmes`,
`{programmeIds}`), audited as `PROGRAMMES_CHANGED`. Classes may belong to a
programme (`programmeId`) rather than a cohort; a Thai Diploma teacher reads
only students enrolled in their programme classes, under the same tenancy rules
as any teacher.

Teachers uploading learning materials (Firebase Storage) is **Phase C, not
Phase A** - do not build it now, but do not design anything that blocks it.

### `schools/{schoolId}`
`orgId`, `name`, `timezone` (IANA), `locale`, `status`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`

### `classes/{classId}` (existing; add fields)
Existing fields stay as they are. Add `orgId`, `schoolId`, `cohortId`, `name`, `yearLevel`
(string, e.g. `"Year 9"`), `coachIds[]`, `status`, `updatedAt`, `updatedBy`.

### `users/{uid}` (existing; add fields)
| Field | Notes |
|---|---|
| `role` | **Mirror only**, for listing. Rules and the API trust the claim, never this field. |
| `orgId`, `schoolIds[]`, `classIds[]` | `classIds` already exists; keep its semantics |
| `publicId` | Human-readable ID shown in the UI, e.g. `KZN-TKL-PRS-VQM`. Server-generated from the `joinCode.js` alphabet, 4 groups of 3, **unique** (enforce with a `publicIds/{publicId} → {uid}` doc created in the same transaction). |
| `status` | `'pending'` (not yet activated) \| `'active'` \| `'suspended'` |
| `givenNames`, `surname`, `displayName`, `salutation?` | `displayName` derived server-side |
| `email` | Mirror of Auth; Auth is the source of truth |
| `phone?` | Optional, E.164 validated |
| `gender?` | Optional: `female`\|`male`\|`nonbinary`\|`prefer_not_to_say`\|`null` |
| `cohortId` | Students and classes: id of a `cohorts` document (see below). Current cohorts: W2E (twice-exceptional learners, secondary), WPR (international students, primary). |
| `programmeIds[]` | Extra programmes the student is **dual-enrolled** in, on top of their cohort. Today only the Thai Diploma, which any student in any cohort can take. |
| `ageBand` | Students only: `primary` \| `13-15` \| `16-18`. Extends the existing field; `server/safety.js` needs a matching `primary` band. |
| `consent` | WPR / under-13 students only: `{status: 'required'\|'verified'\|'withdrawn', verifiedAt?, parentUid?, method?}` |
| `yearLevel?` | Students only |
| `dateOfBirth?` | Optional. Returned only by the single-user endpoint, and only to `admin`. Never in list responses. |
| `createdAt`, `createdBy{uid,name}`, `updatedAt`, `updatedBy{uid,name}`, `activatedAt?`, `suspendedAt?`, `suspendedBy?` | |

**Age scope now includes primary (under-13) learners** in the WPR cohort. That
changes three things, and none of them is optional:
- **Consent gate.** A student under 13 is created with `status: 'pending'` and
  `consent.status: 'required'`, and **cannot sign in or be activated** until a
  linked parent has given verified consent. Build the data model and the gate
  in Phase A; the parent-facing consent flow is Phase E. Which law applies
  (COPPA, GDPR, UK Age Appropriate Design Code) is still being confirmed by the
  school, so make the consent method a recorded field rather than hard-coding
  one scheme.
- **AI.** For `ageBand: 'primary'` the AI endpoints are **off by default**
  (return `403 AI_DISABLED_FOR_AGE`) unless an admin enables them for that
  class. When enabled, they use the strictest safety settings and a
  primary-level system prompt.
- **W2E support data.** Accommodations and support notes for twice-exceptional
  learners live in `users/{uid}/supportProfile/main`. It is readable **only**
  by the learner's own teachers and admins, never by other students, and it is
  never included in list responses. Treat it as sensitive (special-category)
  data.

### `parentLinks/{linkId}`
`orgId`, `parentUid`, `studentUid`, `status: 'active'|'revoked'`, `createdAt`, `createdVia` (invite id), `revokedAt?`, `revokedBy?`

### `parentInvites/{inviteId}`
`orgId`, `studentUid`, `codeHash` (store a **hash**, never the plain code),
`expiresAt` (7 days), `redeemedAt?`, `redeemedBy?`, `createdBy`. One active
invite per student; issuing a new one revokes the old one.

Parents are **never** linked by typing an email address. That design, which is
in the wireframes, lets anyone attach themselves to any child.

### `auditLogs/{logId}` (existing; extend)
Server-written entries: `source: 'server'`, `orgId`, `schoolId?`, `subjectUid`
(whose history this belongs to), `action` (enum, section 6), `actorUid`,
`actorName`, `actorPublicId`, `summary` (short string for the list view),
`details` (object, including `before`/`after` for field changes; **never**
passwords or tokens), `createdAt`.

Existing client-written entries (coach activity) stay. Rules must require
`source == 'client'` on client creates, so a client can never produce an entry
that looks like `source: 'server'`.

### Custom claims
`{ role, orgId, schoolIds, classIds }`. Claims are capped at **1000 bytes**.
Measure the worst case, e.g. a teacher with 20 classes. If it can overflow,
move `classIds` for staff to a Firestore doc read by rules, and say so in your
report. Parents do **not** get child uids in claims; rules resolve them via
`parentLinks`.

---

## 6. Role and permission matrix

| Action | admin (own org) | supervisor (own schools) | teacher (own classes) | student | parent |
|---|---|---|---|---|---|
| List/read users | all | all in schools | own students | self | self + linked children (read-only) |
| Create/edit users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Change role, schools, classes | ✅ (cannot demote self; the last admin of an org cannot be removed) | ❌ | ❌ | ❌ | ❌ |
| Suspend/unsuspend | ✅ (not self) | ❌ | ❌ | ❌ | ❌ |
| Read account history | ✅ | ✅ | ❌ | ❌ | ❌ |
| Schools CRUD | ✅ | read | read own | ❌ | ❌ |
| Classes CRUD | ✅ | read | read own, edit name | read own | read linked child's |
| Issue/rotate join codes | ✅ | ❌ | ✅ own classes | ❌ | ❌ |
| Issue parent invite | ✅ | ❌ | ✅ own students | ❌ | ❌ |

Existing teacher behaviour (coach dashboard, feedback, ratings, notifications,
assignments) must keep working unchanged. **Keep the claim value `teacher`**;
"Course Coordinator" is only a UI label, so no claim migration is needed.

`audit` actions (enum): `ACCOUNT_CREATED`, `ACTIVATION_EMAIL_SENT`,
`ACTIVATION_EMAIL_RESENT`, `ACCOUNT_ACTIVATED`, `DETAILS_CHANGED`,
`ROLE_CHANGED`, `SCHOOLS_CHANGED`, `CLASSES_CHANGED`, `EMAIL_CHANGE_REQUESTED`,
`EMAIL_CHANGE_CONFIRMED`, `ACCOUNT_SUSPENDED`, `ACCOUNT_UNSUSPENDED`,
`PARENT_INVITE_ISSUED`, `PARENT_LINKED`, `PARENT_UNLINKED`,
`PROGRAMMES_CHANGED`, `JOIN_CODE_ISSUED`, `JOIN_CODE_ROTATED`, `SCHOOL_CREATED`, `SCHOOL_UPDATED`,
`CLASS_CREATED`, `CLASS_UPDATED`.

---

## 7. API contract (the frontend builds against this exactly)

All routes are under `/api`. They need `Authorization: Bearer <Firebase ID token>`,
verified with **`verifyIdToken(token, true)`** (checkRevoked) so a suspended
user is refused immediately.

**Errors** always use this shape, with a correct HTTP status:
```json
{ "error": { "code": "FORBIDDEN", "message": "Human readable.", "field": "email" } }
```
Codes: `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404,
`VALIDATION` 400 (with `field`), `CONFLICT` 409 (e.g. email in use),
`CONSENT_REQUIRED` 403, `AI_DISABLED_FOR_AGE` 403, `EMAIL_NOT_CONFIGURED` 501, `RATE_LIMITED` 429,
`INTERNAL` 500.

**Lists** use cursor pagination: `?pageSize=30&pageToken=…` (max 100), and
respond with `{ "items": [...], "nextPageToken": "…"|null, "total": 129 }`.
`total` comes from a Firestore `count()` aggregate; the UI shows
"Displaying 1–30 of 129".

### Session
| Method | Path | Returns |
|---|---|---|
| GET | `/api/me` | `{uid, publicId, role, orgId, schoolIds, classIds, status, displayName, email, locale}` |

### Users (admin, except where noted)
| Method | Path | Body / query | Notes |
|---|---|---|---|
| GET | `/api/admin/users` | `role, status, schoolId, classId, q, sort, pageSize, pageToken` | Supervisor: scoped to schools. `q` matches name/email/publicId prefix. |
| POST | `/api/admin/users` | `{role, email, givenNames, surname, salutation?, phone?, gender?, schoolIds, classIds?, cohortId?, ageBand?, yearLevel?, dateOfBirth?, sendActivation: true}` | Creates the Auth user with **no password**, sets claims, writes the doc and `publicId`, and emails an activation (password-set) link. Returns the user. |
| GET | `/api/admin/users/:uid` | | Full record + `auth: {lastSignInAt, createdAt, disabled}` + `counts: {classes, parents|children}` |
| PATCH | `/api/admin/users/:uid` | any editable profile field | Not role/email/tenancy. Audit `DETAILS_CHANGED` with before/after. |
| PUT | `/api/admin/users/:uid/role` | `{role}` | Updates claim + mirror, then **revokes refresh tokens** so the change applies now. |
| PUT | `/api/admin/users/:uid/assignments` | `{schoolIds, classIds}` | Same token handling. |
| POST | `/api/admin/users/:uid/suspend` | `{reason}` | Auth `disabled: true` + revoke tokens + `status`. |
| POST | `/api/admin/users/:uid/unsuspend` | | |
| POST | `/api/admin/users/:uid/resend-activation` | | Only while `status == 'pending'`, else 409. |
| POST | `/api/admin/users/:uid/change-email` | `{newEmail}` | `generateVerifyAndChangeEmailLink`; the change completes only when the user clicks it. |
| GET | `/api/admin/users/:uid/history` | `pageSize, pageToken` | Admin + supervisor. Newest first. |

### Organizations, schools and classes
| Method | Path | Notes |
|---|---|---|
| GET/PATCH | `/api/admin/organization` | The caller's own org |
| GET/POST | `/api/admin/schools` | |
| GET/PATCH | `/api/admin/schools/:schoolId` | |
| GET/POST | `/api/admin/classes` | filter `schoolId` |
| GET/PATCH | `/api/admin/classes/:classId` | includes roster count and coaches |
| POST | `/api/classes/:classId/join-code` | `{rotate?: true}`; admin or that class's teacher. Reuse `class-codes.js` logic (rotate deletes the old code first). |

### Parents
| Method | Path | Notes |
|---|---|---|
| POST | `/api/students/:uid/parent-invite` | Admin or the student's teacher. Returns the plain `{code, expiresAt}` **once**. |
| POST | `/api/parent/redeem` | `{code}`; caller must be a `parent`. Rate-limit hard (5 attempts per 15 minutes). |
| GET | `/api/parent/children` | Parent's linked children, with a minimal profile only |
| DELETE | `/api/admin/parent-links/:linkId` | Revoke |

### Email delivery
Activation, resend and change-email all need outbound email. Firebase Admin
*generates* links but does not send custom emails.

**The school already uses Microsoft 365, so send through it with the Microsoft
Graph API** (`POST /users/{mailbox}/sendMail`), not a third-party provider:
- Sender is a dedicated **shared mailbox** (e.g. `no-reply@<school domain>`),
  created by the school's Microsoft 365 admin.
- Auth is an **Entra ID app registration** using the client-credentials flow
  with the **application** permission `Mail.Send`, **restricted to that one
  mailbox** (RBAC for Applications, or an Application Access Policy). An
  unrestricted `Mail.Send` app can send as anyone in the school - do not accept
  that.
- Tenant ID, client ID and the client secret (or certificate, preferred) go in
  Secret Manager via `defineSecret`. The school's admin sets them; never ask
  for them in chat and never log them.
- **Do not use SMTP AUTH with a username and password.** Microsoft disables
  Basic auth for SMTP AUTH by default at the end of December 2026, right
  around this platform's launch.
- Put sending behind a small `sendEmail({to, template, locale, data})` module
  so the transport can change without touching endpoints.
- Respect Exchange Online sending limits (per-mailbox rate and daily recipient
  caps). Bulk sends such as weekly parent summaries must be queued and
  throttled.

If none is configured, those endpoints must return `501 EMAIL_NOT_CONFIGURED`
and **not** create half-finished state. For account creation that means:
create the user, report `activation: {sent: false, reason}`, and leave
`status: 'pending'`. **Never** return the raw activation link in an API
response. Email templates must support `en`, `zh` and `th`.

---

## 8. Firestore rules and migration

### Rules
- Add helpers `isAdminOf(orgId)`, `isSupervisorOf(schoolIds)`,
  `isParentOf(studentUid)` (via `parentLinks`), and update `users`, `classes`,
  `auditLogs` and the new collections to match section 6.
- **Fix an existing leak:** `auditLogs` read is currently `isTeacher()`, so any
  teacher can read every audit entry in every school. Scope it: admin (org) and
  supervisor (schools) read `source == 'server'` entries for their tenants; a
  teacher reads only entries they wrote.
- `organizations`, `schools`, `publicIds`, `parentLinks` and `parentInvites`
  are **client-write: false**. The API is the only writer.
- **Suspension window:** an ID token already issued stays valid in Firestore
  rules for up to 1 hour after suspension. The API is protected immediately by
  checkRevoked. Either add a rules check or document the window explicitly in
  your report. Claude will also sign the user out on the client when their
  `status` changes.
- Keep **every** existing test passing. Add tests for every new rule, including
  the negative cases:
  - a student writes their own role/orgId/status;
  - a teacher reads another school's audit log;
  - a supervisor edits a user;
  - a parent reads an unlinked child;
  - a client creates `source: 'server'` audit entries.
  - another student, or a parent, reads a W2E learner's `supportProfile`;
  - an under-13 student with `consent.status != 'verified'` reads or writes anything.

### Migration: `scripts/migrate-to-orgs.js`
It must be idempotent, support `--dry-run`, and be modelled on
`migrate-to-classes.js`. It:
1. Creates one organization ("WeLearn") and one school (name from a `--school`
   flag).
2. Backfills `orgId`/`schoolIds`/`status: 'active'`/`publicId` on every user,
   and `orgId`/`schoolId` on every class.
3. Re-issues claims (`role`, `orgId`, `schoolIds`, `classIds`) for every
   teacher, **preserving existing `classIds` claims**.
4. Prints counts before and after.

**Order is load-bearing:** migrate data and claims **before** deploying rules
that require `orgId`. Deploying the rules first locks every teacher out.

### Bootstrap: `scripts/grant-role.js`
Generalise `grant-coach.js`:
`grant-role.js <email> --role admin --org <orgId> [--school <id>…] [--class <id>…]`.
Keep `grant-coach.js` working as a thin wrapper, because existing runbooks
reference it.

---

## 9. Stop and report instead of proceeding if:

- The project is not on the **Blaze** plan.
- You would deploy `firestore.rules` to production. First confirm what ruleset
  production currently runs, and report the migration dry-run counts.
- A migration dry-run shows any teacher who would lose access.
- Email delivery needs a provider account or API key you do not have.
- You find a security invariant from section 2 already broken in production.

Do not run production migrations or production rules deploys without the
user's explicit go-ahead. Emulator and preview-channel work needs no approval.

---

## 10. Definition of done and the handoff report

Done means **verified against a running system**, not "it builds" or "it
deployed". For each item below, show the evidence (command and output):

1. `npm test` passes, with the new rules tests included (give the count).
2. API tests run against the Auth + Firestore emulators and cover every
   endpoint's success path and its 401/403 paths.
3. On the deployed function: `GET /api/me` with a real token returns the right
   claims; `/api/tutor` returns a real Gemini reply (proves AI is back in
   production); a suspended test user gets 401 from `/api/me` immediately.
4. For one create, one edit and one suspend: the Firestore doc and the
   `auditLogs` row **actually exist** (read them back).
5. A teacher from before migration can still open the coach dashboard and see
   exactly their students.

Write the report to `docs/BACKEND-PHASE-A-HANDOFF.md` with:
- Deployed URLs, region, function name, and how to run everything locally.
- The final API contract, marking **any deviation from section 7** clearly. The
  frontend is built against section 7.
- Sample request and response JSON for every endpoint.
- The seed data for the emulator: one org, two schools, and at least one user
  of each role, with their emails and passwords, so the frontend can be built
  and tested locally. Extend `scripts/seed-emulator.js`.
- What is verified, what is **not** verified, and what still needs the user
  (e.g. the Microsoft 365 app registration, admin key).
- The expected monthly cost at 500 students.
