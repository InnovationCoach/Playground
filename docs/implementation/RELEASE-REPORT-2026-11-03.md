# Release Report: 3 Nov 2026 Deployment

- **Date**: 3 November 2026
- **Lead / Authorizer**: Mani Golzary (Platform Lead)
- **Live URL**: [https://dnd-master-73449.web.app](https://dnd-master-73449.web.app)
- **Git Commit**: `8e89954` (merged into `main` and pushed to GitHub)
- **Active Client Bundle**: `index-Cdti1pIi.js`

---

## 1. What is Live

- **WeLearn SPARK Branding & Navigation**: Full SPARK header, sidebar, My Dashboard, and My Competencies.
- **My Universe Post-O02 & Planet Arrival (O04/O05)**:
  - Full 3D explorer with camera orbit.
  - Planet arrival sequence with flexible exploration and equipment placement.
  - O05 how-to video clips on Thalassa (wind survey, journey timing) and Ignis (mass & power) via Cloudinary.
  - Focused mission flow (O03) and viewport scroll/preview fixes.
- **Pilot Operations Console**: Admin suite for attendance, leave management, and inventory stock adjustments (`#/admin/pilot`).
- **Coach Tools & Student Provisioning**:
  - Coach learner feedback and ratings.
  - Server-authenticated student setup link flow (`POST /api/coach/students`).
- **Backend & Security Infrastructure**:
  - Cloud Functions v2 (`api` gateway on Node 22, `createLearner` callable).
  - Firestore security rules closing client direct writes on Universe collections and tightening coach feedback validation.
  - Storage security rules scoping `programMedia`, `lessonMedia`, and submission evidence.

---

## 2. Channels & Rollback Protection

| Channel Name | URL | Role |
|---|---|---|
| `live` | [https://dnd-master-73449.web.app](https://dnd-master-73449.web.app) | **Production Active** (`index-NPAo-iOk.js`) |
| `release-20261103` | [https://dnd-master-73449--release-20261103-t8rtrat9.web.app](https://dnd-master-73449--release-20261103-t8rtrat9.web.app) | Verified 7-day staging preview channel |
| `pre-release-20261103` | [https://dnd-master-73449--pre-release-20261103-vti77og3.web.app](https://dnd-master-73449--pre-release-20261103-vti77og3.web.app) | **Instant Rollback Clone** of pre-deploy state (`index-DUPZikV5.js`) |

### Rollback Command (If Ever Needed)
```bash
firebase hosting:clone dnd-master-73449:pre-release-20261103 dnd-master-73449:live --project dnd-master-73449
```

---

## 3. Test & Verification Results

All tests executed and verified prior to deployment:

- **Unit Suite** (`npm run test:unit`): 49 files passed, 755 tests passed.
- **Universe Suite** (`npm run test:universe`): 14 files passed, 151 tests passed.
- **Universe Shared Contract** (`npm run test:universe:shared`): 35 contract tests passed.
- **Client Build** (`npm run build`): Transformed 2,873 modules in 2.83s.
- **Functions Build** (`npm --prefix functions run build`): 479.1kb bundle generated in 8ms.

---

## 4. Deploy Steps & Timestamps (Local Time: UTC+7)

1. **16:31:24** – Pushed unified merge `dfe1694` to GitHub `main` (`2bfcc68..dfe1694`).
2. **16:31:45** – Cloned live state to rollback channel `pre-release-20261103`.
3. **16:32:58** – Deployed preview channel `release-20261103` (`index-NPAo-iOk.js`).
4. **16:41:21** – Deployed Cloud Functions v2 (`api`, `createLearner`) with Node 22 runtime.
5. **16:42:58** – Deployed `firestore.rules` and `firestore.indexes.json`.
6. **16:43:47** – Deployed `storage.rules`.
7. **16:44:41** – Promoted `release-20261103` to `live` via `firebase hosting:clone`.
8. **16:47:01** – End-to-end verification of live bundle and live API rewrite (`/api/universe/health`).
9. **18:44:16** – Committed `8e89954` publishing pilot missions into `src/features/universe/pilot/publishedRegistry.js` and exposing expedition cards in `SparkUniverse.jsx`.
10. **18:44:24** – Pushed `8e89954` to GitHub `main`.
11. **18:44:55** – Deployed updated client to preview channel `release-20261103` (`index-Cdti1pIi.js`).
12. **19:03:31** – Promoted `release-20261103` to `live` via `firebase hosting:clone`. Verified active bundle `index-Cdti1pIi.js` on live.
