# GEMINI BACKEND — My Universe (Deep-Space Exploration)

**Author:** Gemini (Antigravity) · **Date:** 1 November 2026 (Updated with Review Corrections Rounds 1 & 2) · **Role:** Backend Architecture, Existing Service Audit & Bounded Contracts  
**Authorized Scope:** Documentation only (approved by Mani on 1 November 2026). No source code modification, rules deployment, dependency installation, branch creation, database mutation, data seeding, or live operations.  
**Inputs Audited (Read-Only):**
- `UNIVERSE.md` (GPT-6 authoritative alignment & brief)
- `CLAUDE DESIGN.md` (Claude / Opus 5.5 visual architecture & storyboard)
- `docs/universe-handoffs/GEMINI REQUEST.md` (GPT-6 specification & requirements)
- `docs/universe-handoffs/GEMINI CORRECTIONS.md` (Claude / Opus 5.5 review corrections round 1)
- `docs/universe-handoffs/GEMINI NEXT.md` (Stage C alignment specification)
- `docs/universe-handoffs/GEMINI CORRECTIONS 2.md` (Claude / Opus 5.5 review corrections round 2)
- `docs/universe-handoffs/STEM-REUSE-AUDIT.md` (read-only module inventory)
- `src/features/universe/explore/cosmosFixture.js` (Stage B 3D explorer catalog fixture)
- `src/features/universe/explore/explorerModel.js` (Stage B pure navigation and access model)
- Active codebase on base `c855527` / `codex/my-universe-prototype`: `firestore.rules`, `storage.rules`, `firebase.json`, `server/app.js`, `server/auth.js`, `server/routes/*`, `src/features/activities/*`.

---

## 0. Executive Summary for Reviewers

1. **Strictly Documentation-Only:** This document is an architectural audit of the active release line and a formal proposal for backend contracts. It implements zero endpoints, alters zero Firestore or Storage rules, installs no npm packages, and creates no database records.
2. **Existing Infrastructure vs. Prototypes:**
   - The current release line (`c855527`) possesses an Express/Firestore foundation for user tenancy, class grouping, and coach authorization.
   - **No `/api` rewrite exists in `firebase.json`**; Firebase Hosting currently serves `dist` statically only. The Express server's public deployment target and public routing are **not defined on this line and unverified**.
   - `server/app.js` mounts only a limited subset of routes (`session`, `admin-users`, `reference`, `parents`, `lti`, `oneroster`, `coach/learners`, `canva`), plus inline AI endpoints. Older local routes like `quest.js`, `school-workspace.js`, and `personalization.js` do **not** exist at this commit.
   - The two-phase transactional Teen Quest ledger is a **proposed future pattern** (from an older local line, not present in this checkout), not existing infrastructure or a release-line benchmark.
   - **No backend services, Firestore collections, or storage buckets currently exist for My Universe**. Both existing prototypes (SVG 2.5D and R3F 3D) rely entirely on client-controlled browser `localStorage`.
3. **Core Architectural Proposal:**
   - **Cosmos Catalog:** Immutable, content-addressed, versioned static JSON manifests distributed via Firebase Hosting CDN (`/cosmos/v1/...`), matching the exact record fields read by the 3D explorer fixture (`cosmosFixture.js`). Authoring and review drafts are managed in an internal administrative staging collection (`adminUniverseDrafts`). The catalog is the single source of truth for all authored `requirementText`.
   - **Learner State:** Non-authoritative exploration progress stored under `users/{uid}/activityProgress/universe-v1`. The 100-entry array limits, per-field 64-character ID limits, and fixed key set are **proposed new rules (Gemini-owned)** with emulator tests (§11.2). Because Firestore security rules cannot measure aggregate document byte size or iterate over array elements, bloat is prevented via per-field limits, while array element typing and overall payload size (< 64 KB) are guarded by client-side save validation.
   - **Authoritative Gating:** Optional destinations evaluated by an Express service (`/api/universe/access`) that checks coach-verified competencies. The response returns only status and rule verification state, deferring requirement text to the catalog. When disconnected, timed out, or unverified, the client defaults to `"not-connected"` (grey dashed chip). Connecting this endpoint requires Mani's explicit approval of the server hosting target and Hosting rewrite.
   - **Progress & Rewards:** XP, badges, and permanent item unlocks remain **strictly disabled** until an authoritative server ledger, verification pipeline, and automated test suite are formally approved.
4. **Prototypes Preserved:** The browser saves of the SVG prototype (`spark-universe-prototype:v1:<uid>`) and the 3D prototype (`spark.universe.preview.v1`) remain completely untouched and isolated. They will not be read, migrated, or granted production entitlements.
5. **Future Directions Bounded:** Planetary STEM workstations (such as the ocean-world floating city), weekly mission lifecycles, connected-universe snapshots, and AI drafting are evaluated as long-term architectural proposals. They are not required or authorized for initial implementation.

---

## 1. Baseline Service & Security Audit (Base `c855527`)

### 1.1 Inspected Worktree & Provenance
- **Canonical Handoff Worktree:** `/Users/admin/Desktop/HearIsland/output/my-universe/source`
- **Branch:** `codex/my-universe-prototype`
- **Base Commit:** `c85552768424dbefea6c1b2d2cf18942a368494e` (`feat(search,dashboard): Find a Quest discovery, My Quests and SPARK Daylight`)
- **Parent Commit:** `697f785e83a7ecb9489dea6a2c8996b04d4cfc8b` (matches current live release bundle `assets/index-VQ2jxVeQ.js`, per earlier session verification; not re-checked).
- *Disclaimer:* Source inspection of configuration files reflects repository declarations; it does not constitute runtime verification of live GCP/Firebase IAM, live index builds, or live Cloud Function instances.

### 1.2 What Actually Exists in Backend Source

| Subsystem | Existing File / Path | Current Production/Release Line Capability | Direct Universe Applicability |
|---|---|---|---|
| **Firestore Security Rules** | `firestore.rules` (v2) | Default-deny (`match /{document=**} { allow read, write: if false; }`). Enforces custom auth claims (`role`, `classIds`). Learner subcollections under `users/{userId}/*` (`activityProgress`, `activityPreferences`, `goals`, `dailyStats`, `notes`) restricted to owner reads/writes and assigned-coach reads (`isCoachOf(userId)`). Unmentioned collections (`learnerQuest`, `learnerSpaces`, `learnerPortfolios`, `coachAiConnections`) fall under the general default-deny rule only (`allow read, write: if false;`). Existing `activityProgress/{docId}` rule allows owner create/update/delete with **no key, type, or size checks**. | **High (Base Tenancy).** Provides proven patterns for tenant isolation. Currently has **no rules** for universe catalogs, exploration schema validation, or celestial entities. |
| **Server Application** | `server/app.js` (Express on Node.js 20) | **No `/api` rewrite exists in `firebase.json`**; Hosting serves `dist` only. Server deployment target and public routing are **unverified and not defined on this line**. Routes actually mounted in `server/app.js`: `/api` (session), `/api/admin/users`, `/api/admin` (reference), `/api` (parents), `/api/lti`, `/api/oneroster/v1p1`, `/api/coach/learners`, `/api/canva`, plus inline AI endpoints (`callGemini`, `callGeminiWithImage`). `server/routes/` has **no** `quest.js`, `school-workspace.js`, or `personalization.js`. | **High (Code Structure).** Standard Express pattern for future Universe access-check endpoints, once deployment target and Hosting rewrites are approved. Currently has **no universe routes**. |
| **Auth & Claims** | `server/auth.js`, `server/middleware/auth.js` | Firebase Auth token verification. Roles (`student`, `teacher`, `coach`, `admin`, `supervisor`) passed via custom claims. Class tenancy evaluated via `classIds` array in token. | **High.** Eliminates document reads to verify student/coach tenancy. Future Universe endpoints can rely on `req.claims`. |
| **Progression Architecture** | Proposed Pattern (from older local branch) | Two-phase transactional commit (`prepare` read phase + `apply` write phase) with idempotent event keys. **Does not exist at commit `c855527`** (`server/routes/quest.js` and `server/lib/quest.js` are absent). | **Future Pattern Proposal.** Architectural blueprint for when My Universe progression/rewards are eventually designed and approved. |
| **Storage Rules** | `storage.rules` | Matches only `/community/{uid}/{postId}/{filename}` (authenticated read, owner write <= 20MB), `/messages/{convId}/{msgId}/{filename}`, `/solarCar/{uid}/{filename}`, and `/canva-exports/{ownerUid}/{filename}`. Catch-all default-deny on `{allPaths=**}`. Contains **no** `/users/{uid}/...` or `/schools/{schoolId}/...` rules. | **Reference.** Shows bucket ownership conventions. Currently has **no rules or bucket** for Universe 3D assets or snapshots. |
| **STEM Simulation Persistence** | `src/features/activities/**` | Varied: `users/{uid}/activityProgress/{activityId}` for Hex-Grid and Solar Car; client-driven Firestore collections (`budgets/{uid}`, `transactions/{uid}_{seq}`, `simulationRuns/{runId}`) for Gold Filter Lab. | **Constraint.** Disparate legacy patterns. Must be insulated from My Universe core progression. |

### 1.3 What Does NOT Exist for My Universe
1. **No `/api` Hosting Rewrite:** `firebase.json` contains no `rewrites` configuration. The Express API server is not wired to public hosting traffic, and its live deployment host is undefined.
2. **No Universe Collections:** Firestore contains no documents or collections for `universes`, `galaxies`, `solarSystems`, `planets`, `environments`, or `universeProgression`.
3. **No Universe API Routes:** `server/routes/` has no handlers for universe catalog delivery, exploration state persistence, or destination access evaluation.
4. **No 3D Asset Hosting / Bucket:** Storage contains no dedicated bucket or public CDN distribution for `.glb`, `.gltf`, Draco-compressed meshes, or planetary texture maps.
5. **No Server-Side Entitlement Engine:** The sample reward mechanisms in both the SVG prototype (`sampleReward` string) and the 3D prototype (`owned` array) exist purely in client memory and `localStorage`.

---

## 2. Proposed Architecture & Bounded Contracts (PROPOSED)

To deliver Claude’s deep-space hierarchy (**Universe → Galaxy → Solar System → Planet Inspection → Planet Environment → Workstation**) without compromising platform security, performance, or budget, the following contracts are proposed.

```
                    ┌──────────────────────────────────────────────┐
                    │          Firebase Hosting CDN Edge           │
                    │         /cosmos/v1/catalog.json              │
                    │         /cosmos/v1/galaxies/{id}.json        │
                    │         /cosmos/v1/environments/{id}.json   │
                    └──────────────────────┬───────────────────────┘
                                           │ Read-only manifests (Cached)
                                           ▼
┌───────────────────────┐            ┌─────────────────────────────┐
│  SPARK Client Engine  │◄───────────┤   Proposed API Host         │
│  (R3F 8 / three.js)   ├───────────►│ (Cloud Run / Cloud Funcs)   │
└───────────┬───────────┘            │ (Target Undecided — §11.1)  │
            │                        └──────────────┬──────────────┘
            │ Direct Owner Read/Write               │ Admin SDK
            ▼                                       ▼
┌───────────────────────────────────┐ ┌────────────────────────────┐
│      Cloud Firestore Client       │ │      Cloud Firestore       │
│ users/{uid}/activityProgress/     │ │ Proposed Ledger (Future)   │
│   universe-v1                     │ │ classes/{classId}          │
│ (Non-authoritative exploration)   │ │ (Authoritative evidence)   │
└───────────────────────────────────┘ └────────────────────────────┘
```

### 2.1 Versioned Public Cosmos Catalog

*Recommendation:* **Static JSON manifests hosted on Firebase Hosting CDN**, complemented by an internal Firestore staging collection (`adminUniverseDrafts`) for authoring/review.

*Rationale:*
- Planet geometry, orbital constants, astronomical descriptions, and environment layout manifests are **identical for all learners** and change only upon authored release.
- Serving catalog data via Firestore would incur massive, unnecessary document read operations (and latency) on every viewport transition.
- Static JSON at `/cosmos/v1/...` leverages edge caching, supports sub-50ms downloads (proposed budget, not measured), guarantees content-hash immutability, and allows offline caching via service workers.

#### Contract Alignment with Explorer Fixture (`cosmosFixture.js`)

The Stage B 3D explorer spike reads exact record structures defined in `cosmosFixture.js`. To ensure seamless drop-in replacement when moving from fixture to real catalog in Stage C, the published catalog JSON shape matches the explorer's fixture field-by-field:

| Record | Fixture Fields (`cosmosFixture.js`) | Proposed Catalog JSON Fields | Differences & Rationale |
|---|---|---|---|
| **Galaxy** | `id, name, type, position, tilt, colors, summary, systems[], uncharted` | Identical: `id, name, type, position, tilt, colors, summary, systems, uncharted` | **Aligned.** Preserves `colors: { core, arm, dust }` (hex strings), `tilt` (float), `position` (`[x,y,z]`), `systems` (array of system IDs), and `uncharted` (integer count). |
| **System** | `id, galaxyId, name, starClass, starColor, summary, planets[]` | Identical: `id, galaxyId, name, starClass, starColor, summary, planets` | **Aligned.** Preserves `galaxyId`, `starClass`, `starColor`, and `planets` (array of planet IDs). |
| **Planet** | `id, systemId, name, kind, orbit, angle, radius, rings?, colors, summary, facts[], access, requirementText?, environmentId` | Identical core fields; `facts` supported as structured array with string coercion | **Extended for Fact Tagging.** In the fixture, `facts` is `string[]`. The catalog supports objects `{ text: string, tag: "fictional-world" \| "real-science", source?: string }`. A 2-line client normalizer ensures backwards compatibility (`factText = typeof f === 'string' ? f : f.text`). `access` is `'public' \| 'gated'`. `requirementText` is authored directly here in the catalog. |
| **Environment** | `id, planetId, name, biome, summary, locations[], sceneKind` | Identical: `id, planetId, name, biome, summary, locations, sceneKind` | **Aligned.** Direct 1:1 match with explorer catalog format (`sceneKind` names the client 3D surface renderer, e.g. `'ocean-station'`). |
| **Location** | `id, name, position, view, purpose, observations[]` | Identical: `id, name, position, view, purpose, observations` | **Aligned.** Direct 1:1 match with fixture structure. |

#### Proposed Published Catalog Root Contract (`/cosmos/v1/catalog.json`)
```json
{
  "catalogVersion": "1.0.0",
  "generatedAt": "2026-11-01T12:00:00Z",
  "galaxies": [
    {
      "id": "lyra-spiral",
      "name": "Lyra Spiral",
      "type": "spiral",
      "position": [-15, 0, 0],
      "tilt": 0.45,
      "colors": {
        "core": "#fff1d6",
        "arm": "#b98ee0",
        "dust": "#e0589c"
      },
      "summary": "A barred spiral with bright violet arms and one charted star system.",
      "systems": ["lyra-prime"],
      "uncharted": 2
    },
    {
      "id": "aurora-elliptical",
      "name": "Aurora Elliptical",
      "type": "elliptical",
      "position": [16, 4, -10],
      "tilt": 0.2,
      "colors": {
        "core": "#fff6dc",
        "arm": "#e8c37a",
        "dust": "#ffd9a0"
      },
      "summary": "An old, golden elliptical galaxy. No systems charted here yet.",
      "systems": [],
      "uncharted": 3
    }
  ],
  "systems": [
    {
      "id": "lyra-prime",
      "galaxyId": "lyra-spiral",
      "name": "Lyra Prime",
      "starClass": "Yellow dwarf (G-type)",
      "starColor": "#ffe9a8",
      "summary": "A single yellow star with three charted planets.",
      "planets": ["thalassa", "ignis", "boreas"]
    }
  ],
  "planets": [
    {
      "id": "thalassa",
      "systemId": "lyra-prime",
      "name": "Thalassa",
      "kind": "ocean",
      "orbit": 7.0,
      "angle": 0.6,
      "radius": 1.1,
      "colors": {
        "base": "#1d5f8a",
        "deep": "#0b2f52",
        "light": "#7cc7e8",
        "cloud": "#eaf6ff",
        "atmosphere": "#9bd2ff"
      },
      "summary": "A warm ocean world with volcanic headlands and long, steady swells.",
      "facts": [
        {
          "text": "Almost the whole surface is ocean; a few volcanic headlands break the water.",
          "tag": "fictional-world",
          "annotation": "Authored world setting"
        },
        {
          "text": "Atmospheric pressure at sea level is 112 kPa.",
          "tag": "fictional-world",
          "annotation": "Fictional world parameter; not measured Earth science"
        },
        {
          "text": "A research platform floats off the largest headland.",
          "tag": "fictional-world",
          "annotation": "World lore"
        }
      ],
      "access": "public",
      "environmentId": "thalassa-station"
    },
    {
      "id": "ignis",
      "systemId": "lyra-prime",
      "name": "Ignis",
      "kind": "basalt",
      "orbit": 11.0,
      "angle": 2.4,
      "radius": 0.85,
      "colors": {
        "base": "#4d4440",
        "deep": "#231d1c",
        "light": "#85766c",
        "glow": "#ff7a2e",
        "atmosphere": "#ffb27a"
      },
      "summary": "A dark basalt world crossed by glowing fissures.",
      "facts": [
        {
          "text": "Columnar basalt plains cover most of the surface.",
          "tag": "fictional-world",
          "annotation": "Authored world geological setting"
        },
        {
          "text": "Volcanic vents release sulfur-rich gas.",
          "tag": "fictional-world",
          "annotation": "Fictional planetary atmosphere composition"
        }
      ],
      "access": "gated",
      "requirementText": "Sample requirement: an Atmospheric Chemistry mission reviewed by your coach.",
      "environmentId": null
    },
    {
      "id": "boreas",
      "systemId": "lyra-prime",
      "name": "Boreas",
      "kind": "ice",
      "orbit": 15.5,
      "angle": 4.3,
      "radius": 1.3,
      "rings": true,
      "colors": {
        "base": "#cfe3ef",
        "deep": "#8fb3c9",
        "light": "#ffffff",
        "ring": "#d9cbb0",
        "atmosphere": "#dff1ff"
      },
      "summary": "A ringed ice giant. No landing site is charted yet.",
      "facts": [
        {
          "text": "Its rings are mostly ice and dust.",
          "tag": "fictional-world",
          "annotation": "Authored planetary feature"
        },
        {
          "text": "Upper clouds are bitterly cold.",
          "tag": "fictional-world",
          "annotation": "Authored environmental description"
        }
      ],
      "access": "public",
      "environmentId": null
    }
  ],
  "environments": [
    {
      "id": "thalassa-station",
      "planetId": "thalassa",
      "name": "Thalassa Research Station",
      "biome": "Coastal ocean and volcanic headland",
      "sceneKind": "ocean-station",
      "summary": "A bounded stretch of open ocean beside a basalt headland, with a floating research platform.",
      "locations": [
        {
          "id": "platform",
          "name": "Research platform",
          "position": [6, 1.6, 4],
          "view": [16, 9, 18],
          "purpose": "Future home of a floating-settlement design project.",
          "observations": [
            "Platform deck about 40 m across (fictional world value).",
            "Six hexagonal modules on pontoons."
          ]
        },
        {
          "id": "tide-gauge",
          "name": "Tide gauge",
          "position": [-6, 0.5, 10],
          "view": [-14, 6, 24],
          "purpose": "Records water level over time.",
          "observations": [
            "Tidal range about 1.8 m (fictional world value)."
          ]
        },
        {
          "id": "weather-mast",
          "name": "Weather mast",
          "position": [-14, 8.5, -6],
          "view": [-4, 14, 10],
          "purpose": "Measures wind, temperature and pressure on the headland.",
          "observations": [
            "Steady easterly wind, about 6 m/s (fictional world value)."
          ]
        },
        {
          "id": "vent",
          "name": "Vent overlook",
          "position": [2, -1, -14],
          "view": [14, 8, -4],
          "purpose": "A shallow hydrothermal vent visible through clear water.",
          "observations": [
            "Warm water shimmers above the vent (illustrative, not simulated)."
          ]
        }
      ]
    }
  ]
}
```

#### Fact Tagging Policy (`fictional-world` vs `real-science`)
- **`fictional-world`:** Applied to all authored world descriptions, orbital coordinates, surface pressures, and fictional planet parameters (e.g., Thalassa's "112 kPa" and Ignis's sulfur dioxide emissions). These are creative setting elements for educational immersion.
- **`real-science`:** Reserved exclusively for verified, educator-reviewed real-world scientific principles and empirical references (e.g., "Liquid water at 1 atm freezes at 0°C", "Solar irradiance on Earth is approximately 1361 W/m²").

#### Catalog Version Pinning & Open Sessions
- **Session Pinning:** When the client launches My Universe, it fetches `/cosmos/v1/catalog.json` and records `catalogVersion` in memory (e.g. `"1.0.0"`). All sub-manifests and navigation lookups during the active session remain pinned to this version.
- **Publication of New Version:** If a new catalog version (e.g. `"1.1.0"`) is deployed to Firebase Hosting while a learner is exploring:
  1. The active session is **never interrupted** or torn down mid-navigation.
  2. In-flight 3D state, camera positions, and selected destinations continue using the in-memory catalog.
  3. When the learner returns to the Universe root view or navigates back to My Dashboard, the client performs a lightweight `HEAD` check on `/cosmos/v1/catalog.json`. If `ETag` or version has updated, it displays an unobtrusive indicator: *"New cosmos sector available — reload to chart"*.
  4. On full page reload or next login, the client fetches the new catalog cleanly.

---

### 2.2 Learner Exploration State (Non-Authoritative)
Learner exploration data (what destinations have been inspected, client visual detail setting, and bookmarks) is non-authoritative convenience data. It must never unlock destinations or grant rewards on its own.

*Firestore Document Path:*
```text
users/{userId}/activityProgress/universe-v1
```

*Existing Security Rules Baseline:*
Existing `firestore.rules` (lines 255–258) specifies:
```javascript
match /activityProgress/{docId} {
  allow read: if isOwner(userId) || isCoachOf(userId);
  allow create, update, delete: if isOwner(userId);
}
```
> [!IMPORTANT]
> The existing production rule allows any owner write without checking document keys, data types, or payload sizes. The 100-entry array limits, per-field 64-character ID limits, and strict key validation described below are **proposed new rules (Gemini-owned)** that require formal review and emulator testing before deployment (see §11.2). They are **not** existing platform protections.

#### Proposed Envelope Schema
```json
{
  "schemaVersion": 1,
  "revision": 14,
  "lastUpdated": "2026-11-01T14:30:00Z",
  "activeDestination": {
    "galaxyId": "lyra-spiral",
    "systemId": "lyra-prime",
    "planetId": "thalassa",
    "environmentId": "thalassa-station",
    "locationId": "platform"
  },
  "charted": {
    "galaxies": ["lyra-spiral"],
    "systems": ["lyra-prime"],
    "planets": ["thalassa", "ignis"]
  },
  "preferences": {
    "detail": "standard"
  }
}
```
*Note on Destination Levels:* Unvisited or higher-level states omit sub-level keys (e.g. at galaxy level, only `galaxyId` is present; `systemId`, `planetId`, etc. are omitted). Security rules must read these with `.get()` defaults to prevent read failures on partial paths.

*Note on Preferences:* Stores only 3D exploration visual detail (`'standard' | 'high'`). Calm mode is managed globally by dashboard preferences and is not duplicated here.

---

### 2.3 Authoritative Destination Access Service (PROPOSED)
Gated planets or special workstations must be evaluated by a trusted server service to prevent client bypass.

*Proposed Endpoint:*
```http
POST /api/universe/access
Authorization: Bearer <Firebase_ID_Token>
Content-Type: application/json

{
  "planetIds": ["thalassa", "ignis", "boreas"]
}
```

*Proposed Response Contract:*
```json
{
  "evaluatedAt": "2026-11-01T14:30:05Z",
  "destinations": {
    "thalassa": {
      "status": "available",
      "evaluatedRule": null,
      "isVerified": true
    },
    "ignis": {
      "status": "locked",
      "evaluatedRule": "comp-env-sci-so2",
      "isVerified": false
    },
    "boreas": {
      "status": "available",
      "evaluatedRule": null,
      "isVerified": true
    }
  }
}
```

*Single Source of Truth for Requirement Text:*
The catalog (`/cosmos/v1/catalog.json`) owns `requirementText`. The access service returns only destination `status` (`available` | `locked`), `evaluatedRule`, and `isVerified`. When a destination is `locked`, the client displays the authored `requirementText` from the catalog.

*Proposed Latency Budget & Service Down Fallback:*
- **Latency Budget (Proposed):** Target < 250ms (evaluates custom claims in token and cached student progress). This is an architectural budget target, not a measured benchmark.
- **Service Down / Network Failure Fallback:** If the endpoint returns 5xx, times out (> 3000ms), or network connectivity fails, the client MUST gracefully map all requirement-gated destinations to Claude's **`not-connected`** status (grey dashed chip). Public destinations remain `"available"`. The UI remains fully interactive and never crashes or blocks.

---

## 3. Security, Multi-Device, Isolation & Governance

### 3.1 Ownership and Tenant Isolation
- **Learner Boundaries:** Every document write to `activityProgress/universe-v1` is strictly bound to `request.auth.uid == userId`. Cross-student writes are rejected by Firestore rules.
- **Coach Visibility:** A coach can read a student’s `activityProgress/universe-v1` only if `isCoachOf(userId)` evaluates to true (evaluating whether the coach shares a class with the student via `request.auth.token.classIds` and reading the student's document tenancy).
- **Zero Public Leakage:** Universe progress is never stored in public collections, shared feeds, or unauthenticated indexes.

### 3.2 Shared-Device Safety (Classroom / Lab Use)
In shared school environments (e.g. Chromebooks or shared iPads), multiple students often use the same physical browser profile sequentially.
- **Immediate State Purge:** Upon sign-out or account switch, the client application must completely clear in-memory universe state, purge local canvas buffers, and invalidate session caches.
- **No Unscoped LocalStorage:** Client persistence must never use static un-namespaced keys. The legacy prototype defect where keys collided or persisted across sign-outs is explicitly avoided.
- **Auth Token Expiration:** Tokens expire after 60 minutes. The access evaluation endpoint will reject expired tokens with `401 UNAUTHENTICATED`, prompting the shell to refresh credentials.

### 3.3 Concurrency, Conflict Resolution & Retry Idempotency
- **Optimistic State Tracking:** The learner envelope includes an integer `revision` (tracked by client code to observe state sequence changes). Security rules validate `revision is int && revision >= 0` rather than enforcing strict monotonicity on write, which preserves non-destructive atomic `FieldValue.arrayUnion()` operations without requiring read-modify-write transactional locking.
- **Client Writes:** When writing to `activityProgress/universe-v1`, client writes merge non-destructively:
  - Charted destination lists use `FieldValue.arrayUnion()`.
  - Timestamp updates use `FieldValue.serverTimestamp()`.
- **Idempotent API Requests:** For future progression or milestone claims, each claim MUST carry a deterministically computed idempotent key:
  ```text
  idempotencyKey = sha256("${uid}:${activityId}:${milestoneId}:${scenarioVersion}")
  ```
  The server verifies this key against an append-only event log before applying state changes.

### 3.4 Rate Limiting & Storage Quotas
- **Field Bounds & Document Quotas (Proposed New Rule):** Because Firestore security rules cannot measure total document byte size (there is no `request.resource.size()` in Firestore rules), bloat is prevented through strict per-field constraints: every ID string is bounded to `<= 64` characters (`size() <= 64`), and every charted array is bounded to `<= 100` entries. Client-side validation enforces an overall target budget under 64 KB before dispatching writes.
- **Array Caps (Proposed New Rule):** Arrays under `charted` are capped at **100 entries each**. Note that Firestore rules cannot inspect individual array elements; type and length validation of array entries is performed by client-side save logic and future server pruning.
- **API Rate Limiting (Proposed):** The `/api/universe/*` Express endpoints will implement token-bucket rate limiting via `checkRateLimit` (e.g., maximum 30 requests per minute per UID).

---

## 4. Learning Evidence vs. Gated Access (Educational Integrity)

### 4.1 The Fundamental Progression Principle
> **Local client actions, clicks, self-checks, simulation runs, and visual navigation do NOT constitute verified educational achievement.**

In accordance with product principles:
1. **Age Informs Scaffolding, Not Mastery:** A learner's grade or age band dictates UI text density, vocabulary complexity, and introductory scaffolding. It does **not** grant automatic unlocks to advanced environments.
2. **Authoritative Evidence Gating:** A destination marked `locked` can only transition to `available` if the learner's server-side record contains verified evidence:
   - A coach-evaluated assessment or approved rubric score.
   - An educator-reviewed PBL milestone recorded in verified progress collections.
3. **Essential Educational Tools Remain Open:** Planetary exploration may provide optional destinations, but core curriculum tools, daily goals, required worksheets, and classroom activities **must never be locked** behind 3D exploration achievements.
4. **No Inactivity Penalties:** Inactivity, paused study, or absence from the universe must never degrade a student’s standing, decrease their unlocked access, or penalize their scores.

---

## 5. Progression & Reward Ledger Guardrails (XP Inactive)

### 5.1 Current Inactive State
In the current release line, **all Universe XP, currency, and rewards remain deactivated**.
- Sample reward choosers (e.g., mini-moons, star hats, waterfall kits) in existing prototypes are strictly classified as non-authoritative local demos.
- The defect identified in Claude's 3D report (§6)—where reward ownership was held only in transient component memory and lost upon reload—is recognized but will **not** be patched with unvetted client persistence. Real inventory requires a trusted backend ledger.

### 5.2 Proposed Architecture for Future Activation
When Mani and educators authorize reward integration, it should follow the hardened two-phase transactional ledger pattern (from older local designs, not in `c855527`):
1. **API-Only Writes:** Client code is prohibited from writing to any reward or inventory collection (`allow write: if false;` in Firestore).
2. **Two-Phase Transactional Commit:**
   - *Phase 1 (Prepare):* Inspect student eligibility, ensure the reward has not been claimed, and check prerequisites.
   - *Phase 2 (Apply):* Append an immutable ledger record in `users/{uid}/universeLedger/{eventId}` and update the aggregate profile document in a single atomic Firestore transaction.
3. **Audit Trail:** Every ledger record must store `{ eventId, sourceId, verifiedBy, standardId, timestamp, grantType }`.

---

## 6. Read-Only Source Audit of Existing STEM Modules & Future Adapters

As documented in `CLAUDE DESIGN.md` (§10–§11) and `STEM-REUSE-AUDIT.md`, future planetary environments may host specialized workstations. Below is the backend audit of existing STEM modules and their technical constraints.

| Module | Inspected Path & Model | Existing Persistence & Identity | Outputs & Data Contract | Economic / Credit Interaction | Future Planetary Adapter Strategy (Concept Only) |
|---|---|---|---|---|---|
| **Project Hex-Grid** | `src/features/activities/hexGrid/ProjectHexGrid.jsx`<br>`hexGridModel.js` (`MODEL_VERSION = 'HexGrid-v1.0'`) | `localStorage`<br>`users/{uid}/activityProgress/hex-grid` | Pure steady-state daily balance: `{ energy, water, food, waste, population, displacement, reserveFraction }`. Excludes weather, storms, waves, and seasons. | **None.** No currency or credit logic. | **Ideal for Ocean Planet Floating City.** Computational model can run inside a workstation host. Constants (`K.seawaterDensity.v = 1025 kg/m³`) must be parameterized per planet rather than hardcoded to Earth. *Note:* The `thalassa-storm` example in §7 is described narrative content, not a Hex-Grid physical simulation. |
| **Solar Car Challenge** | `src/features/activities/solarCar/SolarCarChallenge.jsx`<br>`solarCarModel.js` | `users/{uid}/activityProgress/solar-car` | Physical build parameters & race kinematics: `{ mass, drag, solarArea, velocity, finishTime }`. | **None.** Pure simulation outputs. | Vehicle testing bay on arid/crater planets. Must override Earth gravity (`g = 9.81 m/s²`) and solar irradiance (`1000 W/m²`) with authored planetary values. |
| **SO₂ → Sulfate** | `src/features/activities/so2Sulfate/So2SulfateSimulation.jsx`<br>`so2Model.js` | Firestore `simulations/`, `simulationResults/` | Chemical reaction rates. Explicitly labeled: *"Simulated / illustrative model output"*. | **None.** Educational parameters, not empirical kinetics. | Volcanic/basalt vent workstation. Simulation outputs must retain illustrative disclaimer labels. |
| **Gold Filter Lab** | `src/features/activities/so2Sulfate/filter/GoldFilterLab.jsx`<br>`filterModel.js`, `ledger.js` | `budgets/{uid}`<br>`transactions/{uid}_{seq}`<br>`simulationRuns/{runId}` | Filter sweep efficiency, cost per cubic meter, particulate capture rates. | **Closed Simulation Economy.** Has starting balance, cost per run, sequence checks. | **STRICT ISOLATION.** Filter Lab credits are simulation tokens for cost-optimization tasks. They must **never** be linked to Universe progression, XP, or unlocked access. |
| **Plant Microscope Lab** | `src/features/activities/plantLab/PlantMicroscopeLab.jsx`<br>`plantLabModel.js` | `users/{uid}/activityProgress/plant-lab`<br>Canvas draw data | Guided observation notes, labeled cell sketches, hypothesis text. | **None.** Qualitative lab notebook. | Research lab dome workstation. Preserves drawing strokes and qualitative observations. |

---

## 7. Future Weekly Missions & Environmental Event Lifecycle

1. **Authored & Versioned Bundles:** Environmental events (e.g. "Equinoctial Swell Front at Thalassa Research Platform") and weekly missions are versioned static data bundles published via the Cosmos Catalog.
2. **No Background Daemons or Unapproved Schedulers:** Events do not require a live background cron job, agent wakeup, or persistent server polling. They activate based on client-evaluated date ranges defined in the published catalog manifest:
   ```json
   {
     "eventId": "thalassa-storm-2026-w45",
     "activeFrom": "2026-11-02T00:00:00Z",
     "activeTo": "2026-11-09T00:00:00Z",
     "scenarioModifications": {
       "swellHeightMultiplier": 1.8,
       "windSpeedKts": 42
     }
   }
   ```
   *(Note: This scenario is authored narrative/environmental content, not a physics simulation executed by Hex-Grid).*
3. **Reproducibility & Determinism:** Environmental phenomena use a seeded deterministic function (adding a library like `seedrandom` is flagged as a future dependency decision) so that every learner experiences identical physical parameters for a given event.
4. **No Penalties for Missed Events:** If a learner does not participate in a weekly event, no negative records or streak penalties are recorded.

---

## 8. Connected Universes, Approved Visitors & Privacy Guardrails

1. **Read-Only Exported Snapshots:** Any future "shared universe" feature will operate solely on **immutable, exported read-only snapshots** stored in a dedicated Storage path (`/snapshots/{classId}/{snapshotId}.json`).
2. **Privacy Design Goals (Subject to Legal & Privacy Review):**
   - Snapshots contain only scene layout, placement coordinates, and assigned asset IDs.
   - **Zero PII:** Student real names, email addresses, personal notes, coach feedback, and assessment grades are strictly excluded from snapshot exports.
   - Formal legal and privacy review is required before implementation.
3. **No Unmoderated Peer Communication:**
   - Absolutely **no real-time text chat, freeform messaging, or direct student-to-student commenting** in 3D spaces.
   - Interactions are strictly limited to structured, coach-moderated reactions or standardized peer reviews.
4. **Revocation & Class Scoping:** Snapshots are viewable only within the student’s verified `classId`. A coach or student can revoke access at any time, which immediately deletes the snapshot reference.

---

## 9. AI Generation Safety & Controlled Publication

1. **Drafts, Never Direct Deploys:** Any future generative capability (e.g. generating planet lore, science challenges, or mission blueprints via Gemini) MUST write to the internal administrative staging collection:
   ```text
   adminUniverseDrafts/{draftId}
   ```
2. **Mandatory Educational & Safety Review:** No AI-generated asset, texture, or mission can appear in the live catalog without explicit approval from Mani or a designated educator.
3. **Safety Filtering:** All generative prompts must pass through the platform’s existing safety filters (`server/safety.js`), enforcing age-appropriate boundaries and blocking sensitive content.
4. **Schema Validation:** Generated blueprints must validate against strict JSON schemas before being submitted for review.

---

## 10. Direct Responses to Claude’s Seven Backend Questions

In `CLAUDE DESIGN.md` (§13), Claude posed seven specific technical questions for Gemini. Here are the authoritative backend responses:

### Question 1: Catalog Storage & Publishing
> *Where do galaxy/system/planet/environment manifests live (Firestore documents vs versioned hosting JSON), and how are content versions and reviews published?*

**Response:**
Manifests will live as **versioned static JSON files distributed via Firebase Hosting CDN** (e.g. `public/cosmos/v1/...`). 
- **Authoring & Review Pipeline:** Internal authoring and educator reviews occur in a private administrative Firestore collection (`adminUniverseDrafts`).
- **Publication Gate:** When reviewed and approved by Mani/Educator, an administrative export script serializes the documents into static JSON manifests in the hosting build directory, tagged with an immutable semantic version (e.g. `catalog-v1.0.0.json`).
- **Benefits:** Maximum delivery speed, zero Firestore read costs, high cacheability at the edge, and full offline resilience.

### Question 2: Access Status Endpoint & Failure Behavior
> *The endpoint or contract that returns per-destination status (`charted | available | locked{requirementText} | not-connected`) for the signed-in learner, its latency, and its behaviour when the service is down.*

**Response:**
- **Endpoint:** `POST /api/universe/access` (described in §2.3).
- **Latency Budget (Proposed):** Target < 250ms (evaluates custom claims and cached student progress). This is an architectural proposal, not a measured benchmark.
- **Failure Behavior:** If the server times out (> 3000ms), returns 5xx, or the network is offline, the client MUST gracefully map all requirement-gated destinations to Claude's **`not-connected`** status (grey dashed chip). Public destinations remain `available`. The UI remains fully interactive and never crashes or blocks.

### Question 3: Discovered Markers & Limits
> *May "charted/discovered" be stored per learner as a non-authoritative convenience? If so, where, and with what limits?*

**Response:**
**Yes.** Charted/discovered markers are non-authoritative client convenience data.
- **Location:** `users/{uid}/activityProgress/universe-v1`.
- **Proposed New Rules & Limits:** Arrays for `charted.galaxies`, `charted.systems`, `charted.planets`, and `charted.environments` are capped at **100 entries each**. Individual string IDs in `activeDestination` are capped at **64 characters**. Client-side validation bounds total document size under 64 KB. Client writes cannot write arbitrary keys outside the defined schema.
- **Important Note:** These caps and schema constraints are **proposed new rules** (§11.2) to be verified in emulator tests, not existing Firestore protections.

### Question 4: Legacy Prototype Saves
> *Confirm both prototype browser saves stay out of scope (no reading, migration or awarding).*

**Response:**
**Confirmed.** 
- The SVG prototype save (`spark-universe-prototype:v1:<uid>`) and the 3D prototype preview save (`spark.universe.preview.v1`) are **completely out of scope**.
- The production Universe backend will neither read, migrate, repair, nor award inventory from these local keys. They will remain isolated within their respective prototype previews.

### Question 5: Workstation Evidence & Gold Filter Ledger Separation
> *What is the scoped `learnerRef`/evidence reference for module outputs, and how is Gold Filter's ledger kept separate from Universe progression?*

**Response:**
- **Scoped Reference:** Future workstation outputs will be encapsulated as:
  ```json
  {
    "evidenceRef": "evidence_${uid}_${planetId}_${workstationId}_${Date.now()}",
    "scenarioVersion": "1.0",
    "modelOutputs": { /* pure numerical outputs + units */ },
    "submittedAt": "2026-11-01T14:35:00Z"
  }
  ```
- **Gold Filter Ledger Isolation:** Gold Filter Lab’s `budgets/{uid}` and `transactions/{uid}_{seq}` belong exclusively to the chemical engineering simulation economy. **They are completely decoupled from My Universe.** Universe progression will never query, deduct, or credit filter lab tokens.

### Question 6: 3D Asset Hosting, Caching & Size Limits
> *Hosting location and caching rules for 3D assets (Firebase Hosting vs Storage), size limits, and cache-busting by content version.*

**Response:**
- **Hosting Location:** Firebase Hosting static directory (`public/assets/universe/...`) for core shared assets (planet LOD meshes, common textures, starfield sprites); Cloud Storage for larger optional environment packs (see proposal in §11.4).
- **Caching Rules:** Cache-Control headers set to `public, max-age=31536000, immutable` for content-hashed assets (e.g. `thalassa-platform-a1b2c3d4.glb`).
- **Proposed Size Budgets (Architectural Targets, Not Measured):**
  - Individual planet LOD mesh: < **250 KB**.
  - Planet surface texture: < **1.5 MB** (using KTX2/Basis Universal or WebP).
  - Environment station mesh: < **2.5 MB**.
  - Total first-slice environment payload: < **15 MB** compressed.
- **Cache-Busting:** Asset URLs in the catalog manifest embed content hashes (e.g. `thalassa-platform-e4a8b2c1.glb`).

### Question 7: Shared Universes & Moderation
> *The audience, permission and moderation model for visiting approved planets. No messaging.*

**Response:**
- **Audience:** Strictly scoped to enrolled classmates within the student's authenticated `classId`.
- **Permission Model:** Opt-in publication requiring coach approval. Read-only snapshot generated on demand.
- **Zero Messaging:** No student-to-student text entry, chat boxes, or graffiti. Visits are strictly spectator-mode flythroughs of the approved layout.

---

## 11. Implementation Proposals: Server, Rules & Asset Hosting

### 11.1 Server Deployment Path: Cloud Functions 2nd Gen (Decided: Go 1)

**Decision (1 November 2026):** Mani selected **Cloud Functions 2nd Gen `onRequest`** (Option B) wrapping the existing Express app (`server/app.js`). Cloud Run is not selected.

#### Coexistence with Existing Callable Function
`functions/index.js` currently exports the `createLearner` callable (`onCall`). In Cloud Functions 2nd Gen, multiple triggers comfortably coexist in the same module entrypoint:
- `createLearner`: Dedicated `onCall` function for coach/admin registration.
- `api`: New `onRequest` HTTP function handling all `/api/**` traffic via the Express router.

#### Concrete Proposal for Go 3 (Awaiting Mani's Approval)
The exact code and configuration changes proposed for Go 3 are documented below. *Zero files have been modified yet; these await Mani's written approval.*

##### 1. Proposed `functions/index.js` Export
```javascript
import { onRequest } from 'firebase-functions/v2/https';
import { createApp } from '../server/app.js';

// Lazy-initialized singleton to optimize cold-start memory
let appInstance;
function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}

/**
 * Proposed Express API Host (Cloud Functions 2nd Gen)
 * Wrapped with lazy initialization and internal CORS delegation.
 */
export const api = onRequest(
  {
    region: 'us-central1',          // Proposed region
    memory: '512MiB',              // Proposed budget
    timeoutSeconds: 60,            // Proposed timeout
    minInstances: 0,               // Scales to zero to prevent idle billing
    cors: false                    // Handled internally by server/app.js cors middleware
  },
  (req, res) => getApp()(req, res)
);
```

##### 2. Proposed `firebase.json` Configuration
```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ]
    }
  ],
  "hosting": {
    "public": "dist",
    "cleanUrls": true,
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ],
    "headers": [
      {
        "source": "**/*.html",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      },
      {
        "source": "/cosmos/**",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=3600, stale-while-revalidate=86400" }
        ]
      },
      {
        "source": "/assets/universe/**",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      }
    ]
  },
  "emulators": {
    "firestore": { "port": 8088 },
    "auth": { "port": 9099 },
    "storage": { "port": 9199 },
    "functions": { "port": 5001 },
    "hosting": { "port": 5000 },
    "ui": { "enabled": false }
  }
}
```

##### 3. Local Emulator Execution (`demo-` Isolated)
To test the full suite locally without touching live GCP/Firebase services or incurring billing:
```bash
firebase emulators:start --only firestore,auth,functions,hosting --project demo-hearisland-rules
```
*Safety Guarantee:* Specifying `--project demo-hearisland-rules` prevents any emulator process from contacting production GCP infrastructure or leaking live credentials.

#### Mani's Pre-Deployment Verification Checklist for Go 2
Before Go 2 can be approved, Mani must verify the following items in the Google Cloud / Firebase console (marked as unverified until confirmed):
- [ ] **Billing Plan (Unverified):** Project `dnd-master-73449` must have Blaze (Pay as you go) active. Cloud Functions 2nd Gen utilizes Google Cloud Build and Artifact Registry, which require Blaze.
- [ ] **Target Region (Unverified):** Confirmation that `us-central1` is the desired region (must match the region configured in `functions/index.js` and `firebase.json`).
- [ ] **Service Account & IAM Roles (Unverified):** The default Cloud Functions service account (`dnd-master-73449@appspot.gserviceaccount.com` or App Engine default service account) must possess the `Cloud Datastore User` (or `Firebase Admin`) role to read/write Firestore.

#### Updated Server Go Checklist
- [x] **Go 1 (Decided 1 Nov 2026):** Cloud Functions 2nd Gen `onRequest` selected by Mani.
- [ ] **Go 2 (Pending Mani's Check):** Blaze billing verification, region confirmation (`us-central1`), IAM roles.
- [ ] **Go 3 (Pending Mani's Approval):** Proposed `functions/index.js` export, `firebase.json` rewrite, and emulator setup.
- [ ] **Go 4 (Pending Mani's Approval):** Mounting `/api/universe/access` route in `server/app.js`.
- [ ] **Go 5 (Pending Mani's Approval):** Staging deployment and live smoke test.

---

### 11.2 Proposed Firestore Security Rules for `universe-v1`

To secure `users/{userId}/activityProgress/universe-v1` without relying on unconstrained owner writes, the following rule definitions are proposed for `firestore.rules`:

```javascript
// ============================================================================
// PROPOSED UNIVERSE PROGRESSION RULES (Draft for Mani's Review)
// Target: users/{userId}/activityProgress/universe-v1
// ============================================================================

function isValidUniverseProgress() {
  let data = request.resource.data;
  
  // 1. Strict key restriction (no unauthorized injection of rewards/XP)
  return data.keys().hasOnly(['schemaVersion', 'revision', 'lastUpdated', 'activeDestination', 'charted', 'preferences'])
    
    // 2. Schema version and revision counter
    && data.schemaVersion is int
    && data.schemaVersion == 1
    && data.revision is int
    && data.revision >= 0
    && data.lastUpdated is timestamp
    
    // 3. Active destination shape (using .get() to prevent errors when keys are omitted at higher levels)
    && data.activeDestination is map
    && data.activeDestination.keys().hasOnly(['galaxyId', 'systemId', 'planetId', 'environmentId', 'locationId'])
    && (data.activeDestination.get('galaxyId', null) == null || (data.activeDestination.galaxyId is string && data.activeDestination.galaxyId.size() <= 64))
    && (data.activeDestination.get('systemId', null) == null || (data.activeDestination.systemId is string && data.activeDestination.systemId.size() <= 64))
    && (data.activeDestination.get('planetId', null) == null || (data.activeDestination.planetId is string && data.activeDestination.planetId.size() <= 64))
    && (data.activeDestination.get('environmentId', null) == null || (data.activeDestination.environmentId is string && data.activeDestination.environmentId.size() <= 64))
    && (data.activeDestination.get('locationId', null) == null || (data.activeDestination.locationId is string && data.activeDestination.locationId.size() <= 64))
    
    // 4. Charted arrays bounded (maximum 100 entries each to prevent document bloat)
    // Note: Firestore Security Rules cannot iterate over array elements (no map/every operator).
    // Array element types and individual string lengths are enforced by client validation before save,
    // with optional server cleanup/pruning.
    && data.charted is map
    && data.charted.keys().hasOnly(['galaxies', 'systems', 'planets', 'environments'])
    && data.charted.galaxies is list
    && data.charted.galaxies.size() <= 100
    && data.charted.systems is list
    && data.charted.systems.size() <= 100
    && data.charted.planets is list
    && data.charted.planets.size() <= 100
    && (data.charted.get('environments', []) is list)
    && data.charted.get('environments', []).size() <= 100
    
    // 5. Preferences shape (aligned to explorer visual detail setting)
    && data.preferences is map
    && data.preferences.keys().hasOnly(['detail'])
    && (data.preferences.get('detail', 'standard') in ['standard', 'high']);
}

// Subcollection rule inside match /users/{userId}
match /activityProgress/{docId} {
  // Existing behavior preserved for legacy activities
  // Specific hardened validation applied to universe-v1:
  allow read: if isOwner(userId) || isCoachOf(userId);
  allow create, update: if isOwner(userId) 
    && (docId != 'universe-v1' || isValidUniverseProgress());
  allow delete: if isOwner(userId);
}
```

---

### 11.3 Firestore Emulator Test Suite Proposal

To verify the proposed rules before production deployment, an automated test suite using `@firebase/rules-unit-testing` is proposed:

```javascript
/**
 * Proposed Test Suite: tests/universe-rules.test.js
 * Verification of users/{userId}/activityProgress/universe-v1 security rules.
 */
import { describe, it, beforeAll, beforeEach, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import fs from 'node:fs';

let testEnv;

const validPayload = {
  schemaVersion: 1,
  revision: 1,
  lastUpdated: new Date(),
  activeDestination: {
    galaxyId: 'lyra-spiral',
    systemId: 'lyra-prime',
    planetId: 'thalassa',
    environmentId: 'thalassa-station',
    locationId: 'platform'
  },
  charted: {
    galaxies: ['lyra-spiral'],
    systems: ['lyra-prime'],
    planets: ['thalassa'],
    environments: ['thalassa-station']
  },
  preferences: {
    detail: 'standard'
  }
};

describe('Firestore Security Rules: activityProgress/universe-v1', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-hearisland-rules',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
        host: '127.0.0.1',
        port: 8088
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('1. Owner can read their own universe-v1 progress', async () => {
    const studentDb = testEnv.authenticatedContext('student_1', { role: 'student' }).firestore();
    const docRef = studentDb.doc('users/student_1/activityProgress/universe-v1');
    await assertSucceeds(docRef.get());
  });

  it('2. Owner can write a valid universe-v1 progress document', async () => {
    const studentDb = testEnv.authenticatedContext('student_1', { role: 'student' }).firestore();
    const docRef = studentDb.doc('users/student_1/activityProgress/universe-v1');
    await assertSucceeds(docRef.set(validPayload));
  });

  it('3. Owner can save progress at galaxy level (omitted sub-levels)', async () => {
    const studentDb = testEnv.authenticatedContext('student_1', { role: 'student' }).firestore();
    const docRef = studentDb.doc('users/student_1/activityProgress/universe-v1');
    const galaxyLevelPayload = {
      schemaVersion: 1,
      revision: 2,
      lastUpdated: new Date(),
      activeDestination: {
        galaxyId: 'lyra-spiral'
      },
      charted: {
        galaxies: ['lyra-spiral'],
        systems: [],
        planets: [],
        environments: []
      },
      preferences: {
        detail: 'standard'
      }
    };
    await assertSucceeds(docRef.set(galaxyLevelPayload));
  });

  it('4. Unauthenticated user cannot read or write universe-v1 progress', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    const docRef = anonDb.doc('users/student_1/activityProgress/universe-v1');
    await assertFails(docRef.get());
    await assertFails(docRef.set(validPayload));
  });

  it('5. Another student cannot read or write student_1 progress', async () => {
    const student2Db = testEnv.authenticatedContext('student_2', { role: 'student' }).firestore();
    const docRef = student2Db.doc('users/student_1/activityProgress/universe-v1');
    await assertFails(docRef.get());
    await assertFails(docRef.set(validPayload));
  });

  it('6. Coach sharing class with student can read student_1 progress', async () => {
    // Setup student profile with classIds
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('users/student_1').set({ classIds: ['class_bio_1'] });
      await context.firestore().doc('users/student_1/activityProgress/universe-v1').set(validPayload);
    });

    const coachDb = testEnv.authenticatedContext('coach_1', {
      role: 'coach',
      classIds: ['class_bio_1']
    }).firestore();

    const docRef = coachDb.doc('users/student_1/activityProgress/universe-v1');
    await assertSucceeds(docRef.get());
  });

  it('7. Coach cannot write or overwrite student_1 progress', async () => {
    const coachDb = testEnv.authenticatedContext('coach_1', {
      role: 'coach',
      classIds: ['class_bio_1']
    }).firestore();

    const docRef = coachDb.doc('users/student_1/activityProgress/universe-v1');
    await assertFails(docRef.set(validPayload));
  });

  it('8. Reject write containing unauthorized keys (e.g. injected XP/rewards)', async () => {
    const studentDb = testEnv.authenticatedContext('student_1', { role: 'student' }).firestore();
    const docRef = studentDb.doc('users/student_1/activityProgress/universe-v1');
    const taintedPayload = {
      ...validPayload,
      unlockedRewards: ['super-star-badge'],
      xp: 5000
    };
    await assertFails(docRef.set(taintedPayload));
  });

  it('9. Reject write when charted arrays exceed 100 items', async () => {
    const studentDb = testEnv.authenticatedContext('student_1', { role: 'student' }).firestore();
    const docRef = studentDb.doc('users/student_1/activityProgress/universe-v1');
    const bloatedPlanets = Array.from({ length: 101 }, (_, i) => `planet_${i}`);
    const bloatedPayload = {
      ...validPayload,
      charted: { ...validPayload.charted, planets: bloatedPlanets }
    };
    await assertFails(docRef.set(bloatedPayload));
  });

  it('10. Reject write when an activeDestination ID exceeds 64 characters', async () => {
    const studentDb = testEnv.authenticatedContext('student_1', { role: 'student' }).firestore();
    const docRef = studentDb.doc('users/student_1/activityProgress/universe-v1');
    const oversizedId = 'x'.repeat(65);
    const invalidPayload = {
      ...validPayload,
      activeDestination: { ...validPayload.activeDestination, locationId: oversizedId }
    };
    await assertFails(docRef.set(invalidPayload));
  });
});
```

---

### 11.4 3D Asset Hosting, Caching & Size Budgets Proposal

#### Storage Location: Hosting CDN vs Cloud Storage

| Asset Type | Recommended Host | Rationale |
|---|---|---|
| **Core 3D Assets** (Planet LOD meshes, common normal maps, starfield skybox, environment props) | **Firebase Hosting** (`public/assets/universe/...`) | Included in global CDN distribution; zero Cloud Storage egress fees; deploys atomically with the web application; supports immutable edge caching. |
| **Heavy / Optional Content** (Authored high-poly meshes, voiceover audio, secondary biomes) | **Cloud Storage** (`gs://<project>.appspot.com/universe/...`) | Kept outside git bundle; downloaded on demand by client loaders; authenticated via signed URLs or public read rules. |

*Stage B / C Recommendation:* Stage B uses only generated-in-code procedural geometry. For Stage C authored assets, **Firebase Hosting static assets** (`public/assets/universe/...`) are recommended for all core exploratory models.

#### Content-Hash Naming & Browser Caching Headers
- **Naming Pattern:** Every authored 3D asset must include an 8-character content hash in its filename:
  ```text
  [asset-name]-[contenthash:8].[ext]
  ```
  *Examples:*
  - `thalassa-platform-a1b2c3d4.glb`
  - `ocean-normal-e5f6g7h8.webp`
  - `basalt-column-9i0j1k2l.glb`
  *(Note: Content hashes are generated from file contents during build, not repository git commit hashes).*
- **Cache-Control Headers:** Defined in `firebase.json` for `/assets/universe/**`:
  ```http
  Cache-Control: public, max-age=31536000, immutable
  ```
  Browsers will cache models and textures permanently; updates are achieved by publishing a new manifest pointing to a newly hashed filename.

#### Proposed Asset Size Budgets (Architectural Targets, Not Measured)
The following limits are proposed asset size budgets to keep download payloads bounded and manageable across classroom networks and mobile devices:

| Asset Category | Target Format | Proposed Size Budget |
|---|---|---|
| **Planet LOD Mesh** | GLB (Draco / Meshopt compressed) | < **250 KB** |
| **Planet Surface Texture** | KTX2 / Basis Universal or WebP | < **1.5 MB** |
| **Station / Workstation Model** | GLB (Draco compressed) | < **2.5 MB** |
| **Total Environment First-Slice Payload** | Meshes + Textures combined | < **15 MB** compressed |

#### How the Catalog References Assets
The catalog manifest records clean relative or canonical paths. When the explorer loads an environment or planet, it resolves the asset URL directly:
```json
{
  "id": "thalassa-station",
  "planetId": "thalassa",
  "name": "Thalassa Research Station",
  "modelUrl": "/assets/universe/models/thalassa-platform-a1b2c3d4.glb",
  "textureUrl": "/assets/universe/textures/ocean-normal-e5f6g7h8.webp",
  "environmentId": "thalassa-station"
}
```
If an asset is absent or fails to load, the 3D engine gracefully falls back to the Stage B procedural material/geometry.

---

## 12. Architectural Conflicts, Risks & Implementation Plan

### 12.1 Identified Architectural Conflicts & Resolutions
1. **Slide Gesture vs. 3D Camera Controls:**
   - *Conflict:* My Dashboard uses horizontal swipe gestures and arrow keys to navigate between slides. An embedded 3D canvas intercepting touch/drag events creates severe input conflicts.
   - *Resolution:* Adopt Claude’s proposal (`CLAUDE DESIGN.md` §5.1): My Universe opens as a **dedicated full-viewport exploration overlay** outside the slide deck, leaving the dashboard slide as an entry portal.
2. **3D Dependencies in Canonical Checkout:**
   - *Status:* `three`, `@react-three/fiber`, and `@react-three/drei` were installed for the Stage B 3D spike (`codex/my-universe-prototype`, `UNIVERSE.md` §13.6). The 3D engine is active and building cleanly on this branch.

### 12.2 Bounded Proposed Implementation Sequence (Awaiting Approval)
```
Stage B (Completed): 3D Explorer Spike & Device Performance Verification (60 fps on M5, UNIVERSE.md §13.9)
   │
Stage C (Completed in fa553a4): Explorer Runs on Published Cosmos Catalog (/cosmos/v1/catalog.json)
   │
Stage D (Proposed): Server Deployment & Authoritative Access Service (Mani's Written Go)
   │
Stage E (Future): Verified Progress Ledger & Workstation Integration
```

---

## 13. Handoff Status & Confirmation

| Item | Status |
|---|---|
| **Handoff Document** | `/Users/admin/Desktop/HearIsland/output/my-universe/source/GEMINI BACKEND.md` |
| **Date** | 1 November 2026 |
| **Review Updates Applied** | **15 Review Corrections Applied (Round 1):**<br>1. Removed `/api` rewrite claim; documented deployment target as unverified.<br>2. Corrected mounted routes to match `server/app.js` exactly (removed non-existent `quest.js`, `school-workspace.js`, `personalization.js`).<br>3. Relabeled Teen Quest two-phase commit as a proposed future pattern from an older branch.<br>4. Corrected unmentioned collections (`learnerQuest`, etc.) to default-deny.<br>5. Corrected storage rules description (matches `/community`, `/messages`, `/solarCar`, `/canva-exports`).<br>6. Marked 100-entry caps and 64KB cap as proposed new rules with emulator tests.<br>7. Corrected coach read check to use `isCoachOf(userId)`.<br>8. Retagged Thalassa 112 kPa and Ignis SO2 facts as `fictional-world`.<br>9. Fixed Hex-Grid identifiers to `MODEL_VERSION = 'HexGrid-v1.0'` and `K.seawaterDensity.v = 1025 kg/m³`; clarified `thalassa-storm` is described narrative content.<br>10. Removed `seedrandom` dependency claim; framed as seeded deterministic function.<br>11. Labeled API host as proposed/undecided (Cloud Run vs Cloud Functions).<br>12. Labeled latency/size metrics as proposed budgets, not measured; used content hashes.<br>13. Replaced strict compliance claims with privacy design goals requiring legal review.<br>14. Standardized staging store name to `adminUniverseDrafts`.<br>15. Labeled `697f785` match note as "per earlier session verification; not re-checked".<br><br>**8 Review Corrections Applied (Round 2 — `GEMINI CORRECTIONS 2.md`):**<br>1. Removed non-existent `request.resource.size() <= 64 * 1024` check; replaced with per-field ID bounds (`size() <= 64`) and array bounds (`size() <= 100`); documented that array element types are enforced by client validation.<br>2. Fixed `activeDestination` reading using `.get(field, null)` so saves at galaxy level (omitted planet/environment fields) are not denied.<br>3. Changed test project ID to `demo-hearisland-rules` (matching repo conventions to guarantee tests only run against the local emulator).<br>4. Replaced strict monotonic revision claim with application-level counter validation (`revision >= 0`), preserving non-destructive `arrayUnion` merges.<br>5. Replaced `calmDrift` and `preferredScale` with `detail: 'standard' | 'high'`, matching the explorer and decoupling from dashboard calm preferences.<br>6. Made the catalog the single source of truth for `requirementText`; stripped redundant text from `/api/universe/access` response.<br>7. Updated 3D package status to installed for Stage B, and marked Stage B complete in the implementation sequence.<br>8. Reworded size budget rationale to bounding download payloads rather than guaranteeing 60 fps; labeled Cloud Functions cold-start figure as unverified.<br><br>**Stage C Catalog Sync (`fa553a4`):**<br>- Added `sceneKind` field to Environment records matching the committed catalog validator (`cosmosCatalog.js`).<br><br>**Backend Step 1 Decision (`GEMINI BACKEND GO-1.md`):**<br>- Recorded Go 1 as decided: Cloud Functions 2nd Gen `onRequest` (wrapping `server/app.js`, coexisting with `createLearner`).<br>- Documented concrete Go 3 proposals (`functions/index.js` export, `firebase.json` rewrites, and `demo-` isolated emulator command).<br>- Documented Go 2 pre-deployment checklist (Blaze billing, region confirmation, and IAM roles) as unverified awaiting Mani's check. |
| **Documentation-Only Scope** | **Confirmed.** Zero source code modifications, zero rules changes, zero dependency installs, zero database mutations, zero deployments. |
| **Prototypes & Saves** | **Preserved.** Both SVG and 3D prototypes and their local saves remain untouched. |
| **Next Step** | Handoff to **Mani** and **GPT-6 / Claude** to review the proposals. No implementation or deployment occurs until Mani's explicit written approval. |
