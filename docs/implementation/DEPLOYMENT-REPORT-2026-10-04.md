# Deployment Report: W2e Studio Home Live Release (2026-10-04)

**Target Project**: `dnd-master-73449` (`https://dnd-master-73449.web.app`)  
**Deployment Date**: October 4, 2026  
**Environment**: Production (Cloud Functions v2 Node.js 20 + Firebase Hosting + Cloud Firestore)  

---

## Executive Summary

The W2e Studio Home deployment for `akira@welearn.org` testing is **LIVE** on `https://dnd-master-73449.web.app`.

The account `akira@welearn.org` has been fully provisioned with signed Firebase custom claims and matching Firestore documents. The Express API backend is deployed as a 2nd Gen Cloud Function (`api`) in region `us-central1`, routed directly via same-origin `/api/**` Firebase Hosting rewrites.

---

## 1. Provisioned Test Accounts & Claims

### Student Test Account (`akira@welearn.org`)
- **Email**: `akira@welearn.org`
- **Password**: `review123`
- **UID**: `d27J9hvQwMfpZjsRIrvS0lhBrWo1`
- **Signed Claims**:
  ```json
  {
    "role": "student",
    "orgId": "org-welearn",
    "schoolIds": ["school-wpr"],
    "classIds": ["class-wpr-11a"]
  }
  ```
- **Firestore Document (`users/d27J9hvQwMfpZjsRIrvS0lhBrWo1`)**:
  - `displayName`: `"Akira"`
  - `role`: `"student"`
  - `status`: `"active"`
  - `schoolIds`: `["school-wpr"]`
  - `classIds`: `["class-wpr-11a"]`
  - `groupName`: `"WPR Year 11 Climate"`

---

## 2. Firestore Infrastructure Documents

| Entity | Collection Path | Key Fields |
| :--- | :--- | :--- |
| **School** | `schools/school-wpr` | `name: "WPR International School"`, `timezone: "Asia/Bangkok"`, `status: "active"` |
| **Class** | `classes/class-wpr-11a` | `name: "WPR Year 11 Climate"`, `learnerIds: ["d27J9hvQwMfpZjsRIrvS0lhBrWo1"]`, `coachIds: ["coach-wpr-1"]` |
| **Coach** | `users/coach-wpr-1` | `email: "coach.wpr@school.edu"`, `displayName: "Coach Sam"`, `classIds: ["class-wpr-11a"]` |
| **Offering** | `schools/school-wpr/programOfferings/2026-2027-sustainable-futures` | `programId: "sustainable-futures"`, `title: "Sustainable Future PBL"`, `status: "published"` |
| **Membership** | `schools/school-wpr/programOfferings/2026-2027-sustainable-futures/members/d27J9hvQwMfpZjsRIrvS0lhBrWo1` | `classId: "class-wpr-11a"`, `status: "active"` |

---

## 3. Live Endpoint Verification Evidence

### Unauthenticated Request Verification (`GET /api/learning-context`)
```http
HTTP/2 401 
content-type: application/json; charset=utf-8
x-powered-by: Express

{"error":{"code":"UNAUTHENTICATED","message":"Sign-in required."}}
```

### Unknown Route Catch-All Verification (`GET /api/notaroute`)
```http
HTTP/2 404 
content-type: application/json; charset=utf-8
x-powered-by: Express

{"error":{"code":"NOT_FOUND","message":"No route GET /api/notaroute"}}
```

---

## 4. Expected User Experience for `akira@welearn.org`

1. Navigate to `https://dnd-master-73449.web.app`
2. Sign in with:
   - **Email**: `akira@welearn.org`
   - **Password**: `review123`
3. Land on **Studio Home** tab with greeting: `"Hi Akira. Start with one step."`
4. Access encouragement slider, next-step cards, progress ring (0/3), curiosity space, and quest planner.
5. Header theme toggle switches between Light and Dark mode with local storage persistence.

---

## 5. Rollback Procedure

Should a rollback be required:
- **Hosting Rollback**: `firebase deploy --only hosting` or redeploy previous build directory `dist/`.
- **Function Rollback**: `firebase deploy --only functions` with previous `server/index.js` revision.
