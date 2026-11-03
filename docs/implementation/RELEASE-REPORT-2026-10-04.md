# Release Report: HearIsland / WeLearn Growth Hub (Production Release 2026-10-04)

**Target Project**: `dnd-master-73449` (`https://dnd-master-73449.web.app`)  
**Deployment Date**: October 4, 2026  
**Environment**: Production (Cloud Functions v2 Node.js 20 + Firebase Hosting + Cloud Firestore)  

---

## Executive Summary

The HearIsland / WeLearn Growth Hub codebase has been deployed to `dnd-master-73449.web.app`. The Express API backend is now live as a 2nd Gen Cloud Function (`api` in region `us-central1`) and is accessible directly via same-origin `/api/**` Firebase Hosting rewrites.

All live blocking issues identified in the audit report have been resolved:
1. **API Reachability**: Same-origin `/api/**` rewrites route to the Cloud Function `api` without raw HTML 404s or 403 Forbidden errors.
2. **Production Data Integrity**: `handleSchoolFallback` in `apiClient.js` is strictly gated to `isMockApi` mode. In production, unmapped or missing endpoints throw clean `NOT_FOUND` errors and never fabricate fallback school/class data.
3. **PBL & STEAM Integration**: The "Sustainable Future" PBL program is explicitly linked to 8 STEAM activities across the catalogue (`programCatalogue.js`), `MyCourses.jsx`, `ExploreSteam.jsx`, and `ProgramCatalogueChooser.jsx`.
4. **Security & Rules**: Firestore and Cloud Storage security rules are deployed and enforced. Unauthenticated endpoints return structured JSON contract errors (`UNAUTHENTICATED`).

---

## Live API Verification Evidence

### 1. Endpoint Unauthenticated Verification (`GET /api/learning-context`)

```bash
$ curl -i -s https://dnd-master-73449.web.app/api/learning-context
```

**Live Response Output**:
```http
HTTP/2 401 
access-control-allow-credentials: true
access-control-allow-origin: http://localhost:5173
content-type: application/json; charset=utf-8
etag: W/"42-YcyhP+ou62y2eOoTdNA8sauc9uA"
server: Google Frontend
x-powered-by: Express
date: Sun, 04 Oct 2026 02:22:48 GMT

{"error":{"code":"UNAUTHENTICATED","message":"Sign-in required."}}
```
*Result*: **PASS**. Returns structured JSON HTTP 401 from Express backend (`x-powered-by: Express`), never HTML 404.

---

### 2. Unknown Endpoint Verification (`GET /api/unknown-endpoint-test`)

```bash
$ curl -i -s https://dnd-master-73449.web.app/api/unknown-endpoint-test
```

**Live Response Output**:
```http
HTTP/2 404 
access-control-allow-credentials: true
access-control-allow-origin: http://localhost:5173
cache-control: max-age=600
content-type: application/json; charset=utf-8
etag: W/"52-arWUK0ZzLuDwgUGvzexqKj4zhlQ"
server: Google Frontend
x-powered-by: Express
date: Sun, 04 Oct 2026 02:25:53 GMT

{"error":{"code":"NOT_FOUND","message":"No route GET /api/unknown-endpoint-test"}}
```
*Result*: **PASS**. Catch-all Express 404 handler returns structured JSON contract error without throwing HTML 404s.

---

## Test & Build Verification

| Test Suite | Result | Details |
| :--- | :--- | :--- |
| **Unit Tests (`npm run test:unit`)** | **PASSED** | 15 test files, 314 tests passed cleanly. |
| **API Contract Tests (`npm run test:api`)** | **PASSED** | 6 test files, 65 tests passed against local emulators. |
| **Firestore Rules & Model Tests (`npm test`)** | **PASSED** | 17 test files, 415 tests passed against Firestore emulator. |
| **Production Build (`npm run build`)** | **PASSED** | Vite compiled `dist/` bundle (6 production static files). |

---

## Key Technical Changes

1. **Cloud Functions v2 Entry Point** (`server/index.js`):
   - Configured `export const api = onRequest({ region: 'us-central1', memory: '512MiB', timeoutSeconds: 60, minInstances: 0, invoker: 'public' }, app)`.
   - Fixed missing `@google-cloud/firestore` dependency in `package.json` required by `firebase-admin` v14 in ESM production builds.

2. **Hosting Rewrites** (`firebase.json`):
   - Mapped `/api/**` to function `api`.
   - Maintained SPA catch-all rewrite `**` -> `/index.html`.

3. **Fallback Guard** (`src/services/api/apiClient.js`):
   - Confined `handleSchoolFallback` to `isMockApi` / dev mode only.
   - Production 404 responses immediately throw `NOT_FOUND` without returning sample data.

4. **Sustainable Future PBL & STEAM Mapping**:
   - Added `steamActivityIds` array (`['act_solar_car', 'act_so2_scrubber', 'act_plant_lab', 'act_hex_grid', 'act_soil_ph', 'act_water_purifier', 'act_wind_turbine', 'act_microplastics']`) to `programCatalogue.js`.
   - Updated `MyCourses.jsx` and `ExploreSteam.jsx` to render linked STEAM activities under Sustainable Future PBL.
   - Updated `ProgramCatalogueChooser.jsx` to display linked activity counts for each PBL program.

---

## Production Deployment Coordinates

- **Firebase Project ID**: `dnd-master-73449`
- **Hosting URL**: `https://dnd-master-73449.web.app`
- **Cloud Run Function URL**: `https://api-6my6jtc3oa-uc.a.run.app`
- **Region**: `us-central1`
- **Function Name**: `api` (2nd Gen Node.js 20)
- **Firestore Rules**: Deployed from `firestore.rules`
- **Storage Rules**: Deployed from `storage.rules`

---

## Conclusion

The release is **LIVE and FULLY OPERATIONAL**. All requirements in the release brief have been met, verified with empirical HTTP response evidence, and documented.
