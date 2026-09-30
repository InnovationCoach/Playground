# Frontend Phase 0: front-end groundwork (2026-09-27)

Plan: *WeLearn Growth Hub Implementation Plan*, §6 Phase 0. Built by Claude
(frontend). The backend API contract is `docs/BACKEND-PHASE-A-PROMPT-FOR-GEMINI.md`
§7. **Gemini: read "Contract additions" below before building the endpoints.**

## What was built

| Plan item | Where | Real or test data |
|---|---|---|
| Admin console layout, WeLearn logo and brand colours, role-aware nav | `src/features/admin/AdminConsole.jsx`, `admin.css`, `index.html` `:root` | Layout is real; data is mock until Phase A |
| Reusable data table (sort, filter, search, cursor paging, "Displaying 1–30 of 129") | `src/features/admin/ui/DataTable.jsx`, `usePagedList.js` | — |
| Staff / student / parent account screens: list, create, view, edit, change role, change email, suspend/unsuspend, resend activation, parent invite code, unlink parent, account history | `src/features/admin/accounts/` | **Mock** (`src/services/api/mockBackend.js`) |
| Settings: language (en/zh/th), change password | `src/features/settings/SettingsPage.jsx` | **Real**: saves `users/{uid}.locale`; password goes to Firebase Auth after re-authentication |
| Password reset ("Forgot your password?") | `src/features/auth/PasswordResetPanel.jsx` | **Real**: Firebase `sendPasswordResetEmail`; same message whether or not the address exists |
| Student "My Courses", first version | `src/features/courses/MyCourses.jsx` | Real PBL activities; Edmentum and materials show honest "coming" states, no placeholder courses |
| Parent portal: linked children, link a child with an invite code | `src/features/parent/ParentPortal.jsx` | **Mock** |
| en / zh / th interface text | `src/app/i18n/messages.js` | zh and th are **first drafts** that need a native-speaker review (plan action 9) |

Also:
- **API base is now same-origin `/api`** (`src/services/apiBase.js`). In development, Vite
  proxies `/api` to `:3001`. `.env.example` now leaves `VITE_API_URL` empty.
- `admin`, `supervisor` and `parent` are taken from the **signed claim only**
  (`src/app/roles.js`). A profile document that says `role: 'admin'` gets the
  student app.
- A user whose profile has `status: 'suspended'` is signed out on the client.
  This closes the up-to-one-hour window during which rules still accept an old token.

## Mock vs live

`src/services/api/apiClient.js` picks a mode:
- **mock** only against the Firebase emulators (`?emulators=1`) or in a Vite dev build. A
  production build pointed at real Firebase is always **live**, so a school can
  never see made-up records. Every mock screen shows a "Test data" banner.
- Force a mode in development with `VITE_API_MODE=live` or `VITE_API_MODE=mock`.

The mock uses the §7 error shape and codes, cursor paging with `total`, the §6
permission matrix, audit entries with before/after values, hashed invite codes and the 5 per 15 minutes
redeem limit. It reports email as **not configured** (`activation.sent: false`,
`501 EMAIL_NOT_CONFIGURED`), because that is true until the Microsoft 365
mailbox exists. `tests/growth-hub-phase0.test.js` pins this behaviour.

## Contract additions (Gemini: please implement, or tell Claude)

1. `GET /api/admin/users?role=admin,supervisor,teacher`: `role` accepts a
   **comma-separated list**, which the Staff screen uses.
2. `GET /api/admin/users` also accepts `cohortId` (Students screen filter).
3. Parent rows in the users list include **`childCount`** (active links).
4. `GET /api/admin/users/:uid` includes **`links: [{linkId, uid, displayName, publicId, createdAt}]`**,
   the linked children for a parent or the linked parents for a student. It is needed to
   show and unlink them, because `DELETE /api/admin/parent-links/:linkId` needs the id.
5. **`GET /api/admin/cohorts`** and **`GET /api/admin/programmes`**: `{items, nextPageToken, total}`.
   Cohorts and programmes are data (brief §5), but §7 has no route to read them.
6. `POST /api/parent/redeem` returns `{ child: <same minimal shape as /api/parent/children items> }`.
7. `GET /api/parent/children` items: `{linkId, uid, publicId, givenNames, displayName, yearLevel, schoolName, cohortCode, status, consentStatus}`.

## Reviewing locally

```
npm run emulators
npm run seed:emulator
npm start            # http://localhost:5173/?emulators=1
```

Accounts with admin, supervisor or parent claims are **not** in the seed script, because
`scripts/` belongs to the backend. They were created ad hoc for this review
(password `review123`): `admin.test@school.edu`, `supervisor.test@school.edu`,
`parent.test@school.edu`. Gemini: please add them to `seed-emulator.js`.

Demo parent invite code (mock only): **`PRNT-2345`**. Alternatively, sign in as the admin,
open a student, choose "Issue parent invite code", then sign out and sign in as the parent
in the same tab. Mock state lasts until the page is reloaded.

## Found while building and not fixed (outside frontend ownership)

- **`firestore.rules` in the working tree has been loosened** (modified 2026-09-25):
  `users` and several subcollections are `allow read: if isAuthenticated()`,
  which contradicts the comments next to them. **13 of the rules tests fail**,
  including "a student CANNOT read a classmate profile". Do not deploy this ruleset.
