# WeLearn Growth Hub — Phase 0 Backend Handoff Document

**Date**: September 27, 2026  
**Author**: Backend Engineering (Gemini)  
**Target Audience**: Frontend Engineering (Claude), Product Management, QA  
**Environment**: Local Firebase Emulators Only (`Auth: 9099`, `Firestore: 8088`, `Express API: 3001`)  
**Git Branch**: `backend/phase-0`  

---

## 1. Executive Summary

Phase 0 backend implementation for WeLearn Growth Hub is **100% complete** and verified against local Firebase emulators.

Key achievements:
- **Firestore Security Rules (P0)**: Restored proper scoping on `/users/{userId}` and user subcollections. All **57/57 unit tests pass** (0 failing, down from 13 failures prior to P0).
- **Emulator Seeding (P1)**: Extended `scripts/seed-emulator.js` to populate organizations (`org-welearn`), schools (`sch-bkk`, `sch-online`), cohorts (`W2E`, `WPR`), programmes (`prog-thai-diploma`), classes, review accounts (`review123`), parent links, and initial audit entries.
- **Server Architecture & APIs (P2)**: Refactored `server/app.js` using `createApp()` factory with structured error handling (`server/lib/errors.js`), pagination (`server/lib/pagination.js`), server audit logging (`server/lib/audit.js`), Public ID formatting (`server/lib/publicId.js`), and Auth middleware enforcing custom claims and session validation (`checkRevoked: true`).
- **Integration Tests (P3)**: Created `tests/api/` integration suite using Vitest. All **29/29 API integration tests pass**.
- **Documentation (P4)**: Produced this comprehensive handoff report.

---

## 2. Security Rules Verification (P0)

### Security Rules Test Status
- **Total Tests**: 57
- **Passed**: 57
- **Failed**: 0
- **Execution Command**: `npm test` (or `npx vitest run tests/firestore-rules.test.js`)

### Restored Boundaries
1. **User Profile & Subcollection Isolation**: `/users/{userId}` read/write is strictly restricted to `isOwner(userId) || coachSharesClassWith(resource.data)`. Direct client listing of `/users` is blocked.
2. **Phase 0 Server-Managed Collections**:
   - `/organizations/{id}`: Client read-only for authenticated users in org (`read: if isAuthenticated()`). Write blocked.
   - `/schools/{id}`, `/cohorts/{id}`, `/programmes/{id}`: Client read-only for authenticated users. Write blocked.
   - `/publicIds/{id}`: Client read/write blocked (server managed).
   - `/parentLinks/{id}`: Client read allowed for linked `parentUid` or `studentUid`. Write blocked.
   - `/parentInvites/{id}`: Client read/write blocked (server managed).
3. **Audit Log Integrity**: `/auditLogs/{id}` creation by clients strictly requires `request.resource.data.source == 'client'` and `request.resource.data.actorUid == request.auth.uid`. Server logs with `source: 'server'` cannot be forged by clients.

---

## 3. Seed Accounts Reference (P1)

All review accounts use the universal password: **`review123`**

| Role | Email | Password | UID | Public ID | School Assignment | Cohort / Class |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin.test@school.edu` | `review123` | `usr_admin_test_01` | `ADM-8832-1092-4411` | `sch-bkk`, `sch-online` | N/A |
| **Supervisor** | `supervisor.test@school.edu` | `review123` | `usr_sup_test_01` | `SUP-9921-3012-7722` | `sch-bkk` | N/A |
| **Teacher / Coach** | `coach.test@school.edu` | `review123` | `usr_coach_test_01` | `TCH-1102-4491-8833` | `sch-bkk` | `class-y9-w2e` |
| **Primary Student** | `mia@school.edu` | `review123` | `usr_student_mia` | `STD-4402-9182-3301` | `sch-bkk` | Cohort: `W2E`<br>Class: `class-y9-w2e` |
| **Suspended Student** | `suspended.student@school.edu` | `review123` | `usr_student_suspended` | `STD-9988-1122-3344` | `sch-bkk` | Cohort: `W2E`<br>(Status: `suspended`) |
| **Parent** | `parent.test@school.edu` | `review123` | `usr_parent_test_01` | `PAR-7711-2039-5566` | `sch-bkk` | Linked to Mia (`usr_student_mia`) |

---

## 4. Complete Express API Endpoint Specification (P2 & P3)

Base URL: `http://localhost:3001` (or relative path `/api` when proxied by Vite in development).

### 4.1 Session & Reference Endpoints

#### `GET /api/me`
- **Description**: Returns the authenticated caller's profile and custom claims.
- **Auth**: Required (`Authorization: Bearer <idToken>`).
- **Response `200 OK`**:
```json
{
  "uid": "usr_admin_test_01",
  "email": "admin.test@school.edu",
  "displayName": "Admin Test Account",
  "role": "admin",
  "orgId": "org-welearn",
  "schoolIds": ["sch-bkk", "sch-online"],
  "classIds": [],
  "status": "active",
  "publicId": "ADM-8832-1092-4411",
  "locale": "en"
}
```

#### `GET /api/admin/organization`
- **Description**: Retrieves organization details for the caller's organization.
- **Auth**: Required (`admin` role).
- **Response `200 OK`**:
```json
{
  "orgId": "org-welearn",
  "name": "WeLearn",
  "status": "active",
  "defaultLocale": "en"
}
```

#### `GET /api/admin/schools`
- **Description**: Lists schools in the organization.
- **Auth**: Required (`admin` role).
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "schoolId": "sch-bkk",
      "orgId": "org-welearn",
      "name": "Bangkok Campus",
      "status": "active"
    },
    {
      "schoolId": "sch-online",
      "orgId": "org-welearn",
      "name": "Online Campus",
      "status": "active"
    }
  ],
  "nextPageToken": null,
  "total": 2
}
```

#### `GET /api/admin/classes`
- **Description**: Lists classes filtered optional query parameter `schoolId`.
- **Auth**: Required (`admin` or `teacher` role).
- **Query Params**: `schoolId` (optional), `pageSize` (default 50), `pageToken`
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "classId": "class-y9-w2e",
      "orgId": "org-welearn",
      "schoolId": "sch-bkk",
      "name": "Year 9 W2E",
      "status": "active"
    }
  ],
  "nextPageToken": null,
  "total": 1
}
```

#### `GET /api/admin/cohorts`
- **Description**: Lists cohorts in the organization.
- **Auth**: Required (`admin` role).
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "cohortId": "cohort-w2e",
      "orgId": "org-welearn",
      "code": "W2E",
      "name": { "en": "World to Energy", "th": "พลังงานโลก" },
      "status": "active"
    }
  ],
  "nextPageToken": null,
  "total": 1
}
```

#### `GET /api/admin/programmes`
- **Description**: Lists programmes in the organization.
- **Auth**: Required (`admin` role).
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "programmeId": "prog-thai-diploma",
      "orgId": "org-welearn",
      "code": "THAI-DIP",
      "name": { "en": "Thai High School Diploma", "th": "หลักสูตรมัธยมศึกษาตอนปลาย" },
      "status": "active"
    }
  ],
  "nextPageToken": null,
  "total": 1
}
```

---

### 4.2 Admin User Management Endpoints

#### `GET /api/admin/users`
- **Description**: Lists user accounts with filtering, search, and pagination.
- **Auth**: Required (`admin` or `supervisor`). Supervisors are scoped to their assigned `schoolIds`.
- **Query Params**: `role`, `status`, `schoolId`, `search` (searches `displayName`, `email`, `publicId`), `pageSize` (default 50), `pageToken`.
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "uid": "usr_student_mia",
      "publicId": "STD-4402-9182-3301",
      "email": "mia@school.edu",
      "givenNames": "Mia",
      "surname": "Student",
      "displayName": "Mia Student",
      "role": "student",
      "orgId": "org-welearn",
      "schoolIds": ["sch-bkk"],
      "classIds": ["class-y9-w2e"],
      "cohortId": "cohort-w2e",
      "yearLevel": "Year 9",
      "status": "active",
      "createdAt": "2026-09-27T10:00:00.000Z"
    }
  ],
  "nextPageToken": null,
  "total": 1
}
```

#### `POST /api/admin/users`
- **Description**: Creates a new user in Firebase Auth and Firestore, assigns role claims, formats Public ID (`STD-xxxx-xxxx-xxxx`), and writes an audit log.
- **Auth**: Required (`admin` role).
- **Request Body**:
```json
{
  "email": "new.student@school.edu",
  "password": "Password123!",
  "role": "student",
  "givenNames": "New",
  "surname": "Student",
  "schoolIds": ["sch-bkk"],
  "classIds": ["class-y9-w2e"],
  "cohortId": "cohort-w2e",
  "yearLevel": "Year 10",
  "locale": "en"
}
```
- **Response `201 Created`**:
```json
{
  "uid": "generated_auth_uid_123",
  "publicId": "STD-3912-8821-0044",
  "email": "new.student@school.edu",
  "givenNames": "New",
  "surname": "Student",
  "displayName": "New Student",
  "role": "student",
  "orgId": "org-welearn",
  "schoolIds": ["sch-bkk"],
  "classIds": ["class-y9-w2e"],
  "cohortId": "cohort-w2e",
  "yearLevel": "Year 10",
  "status": "active",
  "createdAt": "2026-09-27T14:00:00.000Z"
}
```

#### `PUT /api/admin/users/:uid`
- **Description**: Updates user profile, school/class assignments, role (re-sets Auth claims), or status.
- **Auth**: Required (`admin` role).
- **Request Body**:
```json
{
  "givenNames": "Mia",
  "surname": "Updated",
  "yearLevel": "Year 10"
}
```
- **Response `200 OK`**: Returns full updated user object. Writes `USER_UPDATED` to `/auditLogs`.

#### `POST /api/admin/users/:uid/suspend`
- **Description**: Suspends account (sets `status: "suspended"`, disables Auth user, revokes refresh tokens).
- **Auth**: Required (`admin` role).
- **Response `200 OK`**:
```json
{
  "uid": "usr_student_suspended",
  "status": "suspended",
  "disabled": true
}
```
Writes `USER_SUSPENDED` to `/auditLogs`.

#### `POST /api/admin/users/:uid/unsuspend`
- **Description**: Unsuspends account (sets `status: "active"`, enables Auth user).
- **Auth**: Required (`admin` role).
- **Response `200 OK`**:
```json
{
  "uid": "usr_student_suspended",
  "status": "active",
  "disabled": false
}
```
Writes `USER_UNSUSPENDED` to `/auditLogs`.

#### `POST /api/admin/users/:uid/reset-password`
- **Description**: Resets a user's password directly or triggers reset flow.
- **Auth**: Required (`admin` role).
- **Request Body**: `{"newPassword": "NewSecurePassword123!"}`
- **Response `200 OK`**: `{"status": "success", "message": "Password updated successfully."}`

---

### 4.3 Parent Portal & Join Code Endpoints

#### `POST /api/students/:uid/parent-invite`
- **Description**: Generates an 8-character parent invite code (e.g. `K9X2-M4P7`) valid for 7 days. Code is shown **once** in response; only its SHA-256 hash is saved to `/parentInvites`.
- **Auth**: Required (`admin` or `teacher` assigned to student's class).
- **Response `201 Created`**:
```json
{
  "code": "K9X2-M4P7",
  "expiresAt": "2026-10-04T14:00:00.000Z"
}
```
Writes `PARENT_INVITE_ISSUED` to `/auditLogs`.

#### `POST /api/parent/redeem`
- **Description**: Parent redeems code. Links parent account to student account. Returns minimal student profile summary (§6.4 spec).
- **Auth**: Required (`parent` role).
- **Rate Limit**: Max 5 attempts per 15 minutes per parent account (returns `429 RATE_LIMITED` if exceeded).
- **Error Behavior**: Returns identical `404 NOT_FOUND` ("That code is not valid. Check it with the school.") for expired, wrong, or already-redeemed codes to prevent code-enumeration attacks.
- **Request Body**: `{"code": "k9x2-m4p7"}` (Case & dash insensitive)
- **Response `200 OK`**:
```json
{
  "child": {
    "uid": "usr_student_mia",
    "publicId": "STD-4402-9182-3301",
    "givenNames": "Mia",
    "displayName": "Mia Student",
    "yearLevel": "Year 9",
    "schoolName": "Bangkok Campus",
    "cohortCode": "W2E",
    "status": "active",
    "consentStatus": null
  }
}
```
Writes `PARENT_LINKED` to `/auditLogs`.

#### `GET /api/parent/children`
- **Description**: Lists active linked children for the caller parent. Returns minimal summary without sensitive fields (e.g. no email, phone, or home address).
- **Auth**: Required (`parent` role).
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "linkId": "link_12345",
      "uid": "usr_student_mia",
      "publicId": "STD-4402-9182-3301",
      "givenNames": "Mia",
      "displayName": "Mia Student",
      "yearLevel": "Year 9",
      "schoolName": "Bangkok Campus",
      "cohortCode": "W2E",
      "status": "active"
    }
  ],
  "nextPageToken": null,
  "total": 1
}
```

#### `DELETE /api/admin/parent-links/:linkId`
- **Description**: Revokes a parent-student linkage.
- **Auth**: Required (`admin` role).
- **Response `200 OK`**:
```json
{
  "linkId": "link_12345",
  "status": "revoked"
}
```
Writes two `PARENT_UNLINKED` audit logs (one for student, one for parent).

---

## 5. Audit Logging Verification Evidence

All server-executed mutations automatically write structured entries to `/auditLogs` with `source: "server"`.

### Sample Audit Log Entries in Firestore

#### 1. Account Created (`USER_CREATED`)
```json
{
  "auditId": "audit_abc123",
  "orgId": "org-welearn",
  "timestamp": "2026-09-27T14:00:00.000Z",
  "actorUid": "usr_admin_test_01",
  "actorRole": "admin",
  "actorEmail": "admin.test@school.edu",
  "subjectUid": "usr_new_student",
  "action": "USER_CREATED",
  "source": "server",
  "summary": "User created with role student"
}
```

#### 2. Account Suspended (`USER_SUSPENDED`)
```json
{
  "auditId": "audit_def456",
  "orgId": "org-welearn",
  "timestamp": "2026-09-27T14:05:00.000Z",
  "actorUid": "usr_admin_test_01",
  "actorRole": "admin",
  "actorEmail": "admin.test@school.edu",
  "subjectUid": "usr_student_suspended",
  "action": "USER_SUSPENDED",
  "source": "server",
  "summary": "User account suspended"
}
```

#### 3. Parent Link Redeemed (`PARENT_LINKED`)
```json
{
  "auditId": "audit_ghi789",
  "orgId": "org-welearn",
  "timestamp": "2026-09-27T14:10:00.000Z",
  "actorUid": "usr_parent_test_01",
  "actorRole": "parent",
  "actorEmail": "parent.test@school.edu",
  "subjectUid": "usr_student_mia",
  "action": "PARENT_LINKED",
  "source": "server",
  "summary": "Parent Parent Test Account linked"
}
```

---

## 6. How to Run local Environment & Tests

### 1. Start Firebase Emulators
Starts Firebase Auth (9099) and Firestore (8088) emulators:
```bash
npm run emulators
```

### 2. Seed Emulators
Populates initial organization, schools, cohorts, classes, review accounts, and parent links:
```bash
npm run seed:emulator
```

### 3. Start Express Dev Server
Runs the Node/Express backend connected to the emulators on port 3001:
```bash
npm run server:dev:emulator
```

### 4. Run Firestore Security Rules Tests (57 tests)
```bash
npm test
```

### 5. Run API Integration Tests (29 tests)
```bash
npm run test:api
```

---

## 7. Frontend Integration Notes (For Claude)

1. **Authentication Token**:
   - Call `firebase.auth().currentUser.getIdToken()` to obtain the JWT token.
   - Include the header in all `/api/*` requests:
     ```http
     Authorization: Bearer <idToken>
     ```

2. **Error Structure**:
   - All API endpoints return standardized errors matching this envelope format:
     ```json
     {
       "error": {
         "code": "FORBIDDEN",
         "message": "You do not have permission to perform this action.",
         "field": null
       }
     }
     ```

3. **Vite Proxy Configuration**:
   - In `vite.config.js`, configure proxy for development so calls to `/api` route to `http://localhost:3001`:
     ```js
     server: {
       proxy: {
         '/api': 'http://localhost:3001'
       }
     }
     ```

---

**End of Handoff Report**.
