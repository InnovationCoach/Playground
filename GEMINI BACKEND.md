# GEMINI BACKEND — My Universe (Deep-Space Exploration)

**Author:** Gemini (Antigravity) · **Date:** 1 November 2026 · **Role:** Backend Architecture, Existing Service Audit & Bounded Contracts  
**Authorized Scope:** Documentation only (approved by Mani on 1 November 2026). No source code modification, rules deployment, dependency installation, branch creation, database mutation, data seeding, or live operations.  
**Inputs Audited (Read-Only):**
- `UNIVERSE.md` (GPT-6 authoritative alignment & brief)
- `CLAUDE DESIGN.md` (Claude / Opus 5.5 visual architecture & storyboard)
- `docs/universe-handoffs/GEMINI REQUEST.md` (GPT-6 specification & requirements)
- `docs/universe-handoffs/STEM-REUSE-AUDIT.md` (read-only module inventory)
- `/Users/admin/Desktop/HearIsland/output/universe-3d/UNIVERSE-3D-TECHNICAL-REPORT.md` (Claude 3D prototype report)
- `../MY-UNIVERSE-TECHNICAL-IMPLEMENTATION-REPORT-2026-11-01.md` (SVG prototype report)
- Active codebase on base `c855527`: `firestore.rules`, `storage.rules`, `firebase.json`, `server/app.js`, `server/auth.js`, `server/routes/*`, `src/features/activities/*`.

---

## 0. Executive Summary for Reviewers

1. **Strictly Documentation-Only:** This document is an architectural audit of the active release line and a formal proposal for backend contracts. It implements zero endpoints, alters zero Firestore or Storage rules, installs no npm packages, and creates no database records.
2. **Existing Infrastructure vs. Prototypes:** The current release line (`c855527`) possesses a robust, secure Express/Firestore foundation for user tenancy, class grouping, coach authorization, and server-validated Teen Quest XP. However, **no backend services, Firestore collections, or storage buckets currently exist for My Universe**. Both existing prototypes (SVG 2.5D and R3F 3D) rely entirely on client-controlled browser `localStorage`.
3. **Core Architectural Proposal:**
   - **Cosmos Catalog:** Immutable, content-addressed, versioned static JSON manifests distributed via Firebase Hosting CDN (`/cosmos/v1/...`), backed by an administrative Firestore collection for reviewed draft publication.
   - **Learner State:** Non-authoritative exploration progress (viewed locations, camera preferences) stored under `users/{uid}/activityProgress/universe-v1` with strict owner-only rules and payload size caps.
   - **Authoritative Gating:** Optional destinations gated strictly by an Express service (`/api/universe/access`) that evaluates coach-verified competencies and PBL project milestones. When disconnected or unavailable, the client defaults to `"not-connected"`.
   - **Progress & Rewards:** XP, badges, and permanent item unlocks remain **strictly disabled** until an authoritative server ledger, verification pipeline, and automated test suite are formally approved.
4. **Prototypes Preserved:** The browser saves of the SVG prototype (`spark-universe-prototype:v1:<uid>`) and the 3D prototype (`spark.universe.preview.v1`) remain completely untouched and isolated. They will not be read, migrated, or granted production entitlements.
5. **Future Directions Bounded:** Planetary STEM workstations (such as the ocean-world floating city), weekly mission lifecycles, connected-universe snapshots, and AI drafting are evaluated as long-term architectural extensions. They are not required or authorized for initial implementation.

---

## 1. Baseline Service & Security Audit (Base `c855527`)

### 1.1 Inspected Worktree & Provenance
- **Canonical Handoff Worktree:** `/Users/admin/Desktop/HearIsland/output/my-universe/source`
- **Branch:** `codex/my-universe-prototype`
- **Base Commit:** `c85552768424dbefea6c1b2d2cf18942a368494e` (`feat(search,dashboard): Find a Quest discovery, My Quests and SPARK Daylight`)
- **Parent Commit:** `697f785e83a7ecb9489dea6a2c8996b04d4cfc8b` (matches current live release bundle `assets/index-VQ2jxVeQ.js`)
- *Disclaimer:* Source inspection of configuration files reflects repository declarations; it does not constitute runtime verification of live GCP/Firebase IAM, live index builds, or live Cloud Function instances.

### 1.2 What Actually Exists in Backend Source

| Subsystem | Existing File / Path | Current Production/Release Line Capability | Direct Universe Applicability |
|---|---|---|---|
| **Firestore Security Rules** | `firestore.rules` (v2) | Default-deny (`match /{document=**} { allow read, write: if false; }`). Enforces custom auth claims (`role`, `classIds`). Learner subcollections under `users/{userId}/*` (`activityProgress`, `activityPreferences`, `goals`, `dailyStats`, `notes`) restricted to owner reads/writes and assigned-coach reads. Closed collections (`learnerQuest/{uid}`, `learnerSpaces/{uid}`, `learnerPortfolios/{uid}`, `coachAiConnections/{uid}`) set to `allow read, write: if false;`. | **High.** Provides proven patterns for tenant isolation and owner-only access. Currently has **no rules** for universe catalogs, exploration saves, or celestial entities. |
| **Server Application** | `server/app.js` (Express on Node.js 20) | Mounted behind `/api/**` rewrite in `firebase.json`. Uses Firebase Admin SDK, CORS whitelist, global JSON parser (8MB limit), in-memory rate limiting for AI endpoints. Routes mounted: `/api/session`, `/api/admin/users`, `/api/admin/reference`, `/api/admin/operations`, `/api/parents`, `/api/school-workspace`, `/api/personalization`, `/api/quest`. | **High.** Standard host for future Universe access-check and save-sync endpoints. Currently has **no universe routes**. |
| **Auth & Claims** | `server/auth.js`, `server/middleware/auth.js` | Firebase Auth token verification. Roles (`student`, `teacher`, `coach`, `admin`, `supervisor`) passed via custom claims. Class tenancy evaluated via `classIds` array in token. | **High.** Eliminates document reads to verify student/coach tenancy. Future Universe endpoints can rely entirely on `req.claims`. |
| **Authoritative Progression (Teen Quest)** | `server/routes/quest.js`, `server/lib/quest.js` | API-only writes to `learnerQuest/{uid}`. Uses Firestore transactions (`prepareXp` read phase + `apply` write phase). Idempotent event keys (`${event.type}__${event.sourceId}`). Calendar-aware streak evaluation using school timezone. | **Pattern Benchmark.** Exact architectural pattern required when My Universe progression/rewards are eventually designed. |
| **Storage Rules** | `storage.rules` | Enforces ownership and path boundaries for learner uploads (`/users/{uid}/...`) and coach lesson media (`/schools/{schoolId}/...`). | **Reference.** Relevant for future user snapshot storage or custom student artifact attachments. |
| **STEM Simulation Persistence** | `src/features/activities/**` | Varied: `users/{uid}/activityProgress/{activityId}` for Hex-Grid and Solar Car; client-driven Firestore collections (`budgets/{uid}`, `transactions/{uid}_{seq}`, `simulationRuns/{runId}`) for Gold Filter Lab. | **Constraint.** Disparate legacy patterns. Must be insulated from My Universe core progression. |

### 1.3 What Does NOT Exist for My Universe
1. **No Universe Collections:** Firestore contains no documents or collections for `universes`, `galaxies`, `solarSystems`, `planets`, `environments`, or `universeProgression`.
2. **No Universe API Routes:** `server/routes/` has no handlers for universe catalog delivery, exploration state persistence, or destination access evaluation.
3. **No 3D Asset Hosting / Bucket:** Storage contains no dedicated bucket or public CDN distribution for `.glb`, `.gltf`, Draco-compressed meshes, or planetary texture maps.
4. **No Server-Side Entitlement Engine:** The sample reward mechanisms in both the SVG prototype (`sampleReward` string) and the 3D prototype (`owned` array) exist purely in client memory and `localStorage`.

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
│  SPARK Client Engine  │◄───────────┤   Authoritative API Host    │
│  (R3F 8 / three.js)   ├───────────►│      (Cloud Functions)      │
└───────────┬───────────┘            └──────────────┬──────────────┘
            │                                       │
            │ Direct Owner Read/Write               │ Admin SDK
            ▼                                       ▼
┌───────────────────────────────────┐ ┌────────────────────────────┐
│      Cloud Firestore Client       │ │      Cloud Firestore       │
│ users/{uid}/activityProgress/     │ │ learnerQuest/{uid}         │
│   universe-v1                     │ │ classes/{classId}          │
│ (Non-authoritative exploration)   │ │ (Authoritative evidence)   │
└───────────────────────────────────┘ └────────────────────────────┘
```

### 2.1 Versioned Public Cosmos Catalog
*Recommendation:* **Static JSON manifests hosted on Firebase Hosting CDN**, complemented by an internal Firestore staging collection (`cosmosCatalogDrafts`) for authoring/review.

*Rationale:*
- Planet geometry, orbital constants, astronomical descriptions, and environment layout manifests are **identical for all learners** and change only upon authored release.
- Serving catalog data via Firestore would incur massive, unnecessary document read operations (and latency) on every viewport transition.
- Static JSON at `/cosmos/v1/...` leverages edge caching, supports sub-50ms downloads, guarantees content-hash immutability, and allows offline caching via service workers.

#### Proposed Catalog Data Contract (`/cosmos/v1/catalog.json`)
```json
{
  "catalogVersion": "1.0.0",
  "generatedAt": "2026-11-01T12:00:00Z",
  "galaxies": [
    {
      "id": "lyra-spiral",
      "name": "Lyra Spiral",
      "type": "spiral",
      "palette": {
        "core": "#f5e6ff",
        "arms": "#8250a0",
        "dust": "#05101f"
      },
      "position": [0, 0, 0],
      "systemsCount": 1,
      "status": "charted",
      "manifestUrl": "/cosmos/v1/galaxies/lyra-spiral.json"
    },
    {
      "id": "aurora-elliptical",
      "name": "Aurora Elliptical",
      "type": "elliptical",
      "palette": {
        "core": "#fff4d4",
        "halo": "#e0a838",
        "dust": "#081226"
      },
      "position": [450, 120, -200],
      "systemsCount": 0,
      "status": "charted",
      "manifestUrl": null
    }
  ]
}
```

#### Proposed Planet Manifest Contract (`/cosmos/v1/systems/{systemId}.json`)
```json
{
  "systemId": "lyra-prime",
  "name": "Lyra Prime",
  "star": {
    "spectralClass": "G2V",
    "color": "#fff2a3",
    "radius": 1.0
  },
  "planets": [
    {
      "id": "thalassa-ocean",
      "name": "Thalassa",
      "radiusClass": "terrestrial-large",
      "surfaceMaterial": "ocean-swell-v1",
      "atmosphere": {
        "color": "#9bd2ff",
        "density": 1.15,
        "fresnel": 0.45
      },
      "facts": [
        {
          "statement": "Global ocean with mean depth of 12,000 meters.",
          "tag": "fictional-world",
          "annotation": "Authored world context"
        },
        {
          "statement": "Atmospheric pressure at sea level is 112 kPa.",
          "tag": "real-science",
          "annotation": "Derived from standard hydrostatic fluid calculations"
        }
      ],
      "accessRequirement": {
        "type": "public"
      },
      "environmentUrl": "/cosmos/v1/environments/thalassa-station.json"
    },
    {
      "id": "vulcan-basalt",
      "name": "Ignis",
      "radiusClass": "terrestrial-rocky",
      "surfaceMaterial": "basalt-fissure-v1",
      "atmosphere": {
        "color": "#ffaa66",
        "density": 0.82,
        "fresnel": 0.3
      },
      "facts": [
        {
          "statement": "Surface rich in sulfur dioxide and columnar basalt.",
          "tag": "real-science",
          "annotation": "Volcanic gas composition"
        }
      ],
      "accessRequirement": {
        "type": "competency-verified",
        "competencyId": "comp-env-sci-so2",
        "requirementText": "Requires verified competency in Atmospheric Sulfur Cycles."
      },
      "environmentUrl": null
    }
  ]
}
```

### 2.2 Learner Exploration State (Non-Authoritative)
Learner exploration data (what destinations have been inspected, client camera preferences, and local bookmarks) is non-authoritative. It must never unlock destinations or grant rewards on its own.

*Proposed Firestore Location:*
```text
users/{userId}/activityProgress/universe-v1
```

*Rationale for Subcollection Location:*
- Existing `firestore.rules` already defines:
  ```javascript
  match /activityProgress/{docId} {
    allow read: if isOwner(userId) || isCoachOf(userId);
    allow create, update, delete: if isOwner(userId);
  }
  ```
- This allows immediate client storage for the learner without introducing new rule definitions in this phase, while keeping coaches capable of reviewing progress and guaranteeing that other learners cannot read or overwrite the record.

#### Proposed Envelope Schema
```json
{
  "schemaVersion": 1,
  "revision": 14,
  "lastUpdated": "2026-11-01T14:30:00Z",
  "activeDestination": {
    "galaxyId": "lyra-spiral",
    "systemId": "lyra-prime",
    "planetId": "thalassa-ocean",
    "environmentId": "thalassa-station",
    "locationId": "research-platform"
  },
  "charted": {
    "galaxies": ["lyra-spiral"],
    "systems": ["lyra-prime"],
    "planets": ["thalassa-ocean", "vulcan-basalt"]
  },
  "preferences": {
    "calmDrift": false,
    "preferredScale": "standard"
  }
}
```

### 2.3 Authoritative Destination Access Service (PROPOSED)
Gated planets or special workstations must be evaluated by a trusted server service to prevent client bypass.

*Proposed Endpoint:*
```http
POST /api/universe/access
Authorization: Bearer <Firebase_ID_Token>
Content-Type: application/json

{
  "planetIds": ["thalassa-ocean", "vulcan-basalt"]
}
```

*Proposed Response Contract:*
```json
{
  "evaluatedAt": "2026-11-01T14:30:05Z",
  "destinations": {
    "thalassa-ocean": {
      "status": "available",
      "reason": null
    },
    "vulcan-basalt": {
      "status": "locked",
      "requirementText": "Requires verified competency in Atmospheric Sulfur Cycles.",
      "evaluatedRule": "comp-env-sci-so2",
      "isVerified": false
    }
  }
}
```

*Service Down / Network Failure Fallback:*
If the endpoint returns 5xx, times out (>3000ms), or network connectivity fails, the client MUST treat all gated destinations as `"not-connected"` (rendered as Claude's grey dashed chip: **Access not connected**). Public destinations remain `"available"`.

---

## 3. Security, Multi-Device, Isolation & Governance

### 3.1 Ownership and Tenant Isolation
- **Learner Boundaries:** Every document write to `activityProgress/universe-v1` is strictly bound to `request.auth.uid == userId`. Cross-student writes are rejected by Firestore rules.
- **Coach Visibility:** A coach can read a student’s `activityProgress/universe-v1` only if `coachSharesClassWith(resource.data)` evaluates to true (i.e. the student belongs to a class assigned to the coach in `request.auth.token.classIds`).
- **Zero Public Leakage:** Universe progress is never stored in public collections, shared feeds, or unauthenticated indexes.

### 3.2 Shared-Device Safety (Classroom / Lab Use)
In shared school environments (e.g. Chromebooks or shared iPads), multiple students often use the same physical browser profile sequentially.
- **Immediate State Purge:** Upon sign-out or account switch, the client application must completely clear in-memory universe state, purge local canvas buffers, and invalidate session caches.
- **No Unscoped LocalStorage:** Client persistence must never use static un-namespaced keys. The legacy prototype defect where keys collided or persisted across sign-outs is explicitly avoided.
- **Auth Token Expiration:** Tokens expire after 60 minutes. The access evaluation endpoint will reject expired tokens with `401 UNAUTHENTICATED`, prompting the shell to refresh credentials.

### 3.3 Concurrency, Conflict Resolution & Retry Idempotency
- **Optimistic Concurrency:** The learner envelope includes a monotonically increasing integer: `revision`.
- **Client Writes:** When writing to `activityProgress/universe-v1`, client writes merge non-destructively:
  - Charted destination lists use `FieldValue.arrayUnion()`.
  - Timestamp updates use `FieldValue.serverTimestamp()`.
- **Idempotent API Requests:** For future progression or milestone claims, each claim MUST carry a deterministically computed idempotent key:
  ```text
  idempotencyKey = sha256("${uid}:${activityId}:${milestoneId}:${scenarioVersion}")
  ```
  The server verifies this key against an append-only event log before applying state changes.

### 3.4 Rate Limiting & Storage Quotas
- **Payload Cap:** Total document size for `activityProgress/universe-v1` must not exceed **64 KB**. If an envelope exceeds this size during validation, it is rejected to prevent document bloat.
- **API Rate Limiting:** The `/api/universe/*` Express endpoints will implement token-bucket rate limiting via `checkRateLimit` (e.g., maximum 30 requests per minute per UID).

---

## 4. Learning Evidence vs. Gated Access (Educational Integrity)

### 4.1 The Fundamental Progression Principle
> **Local client actions, clicks, self-checks, simulation runs, and visual navigation do NOT constitute verified educational achievement.**

In accordance with product principles:
1. **Age Informs Scaffolding, Not Mastery:** A learner's grade or age band dictates UI text density, vocabulary complexity, and introductory scaffolding. It does **not** grant automatic unlocks to advanced environments.
2. **Authoritative Evidence Gating:** A destination marked `locked` can only transition to `available` if the learner's server-side record contains verified evidence:
   - A coach-evaluated assessment or approved rubric score.
   - An educator-reviewed PBL milestone recorded in `users/{uid}/progress` or `learnerQuest/{uid}`.
3. **Essential Educational Tools Remain Open:** Planetary exploration may provide optional destinations, but core curriculum tools, daily goals, required worksheets, and classroom activities **must never be locked** behind 3D exploration achievements.
4. **No Inactivity Penalties:** Inactivity, paused study, or absence from the universe must never degrade a student’s standing, decrease their unlocked access, or penalize their scores.

---

## 5. Progression & Reward Ledger Guardrails (XP Inactive)

### 5.1 Current Inactive State
In the current release line, **all Universe XP, currency, and rewards remain deactivated**.
- Sample reward choosers (e.g., mini-moons, star hats, waterfall kits) in existing prototypes are strictly classified as non-authoritative local demos.
- The defect identified in Claude's 3D report (§6)—where reward ownership was held only in transient component memory and lost upon reload—is recognized but will **not** be patched with unvetted client persistence. Real inventory requires a trusted backend ledger.

### 5.2 Required Blueprint for Future Activation
When Mani and educators authorize reward integration, it must follow the hardened **Teen Quest** ledger architecture:
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
| **Project Hex-Grid** | `src/features/activities/hexGrid/ProjectHexGrid.jsx`<br>`hexGridModel.js` (`MODEL_VERSION = '1.0'`) | `localStorage`<br>`users/{uid}/activityProgress/hex-grid` | Pure steady-state daily balance: `{ energy, water, food, waste, population, displacement, reserveFraction }`. | **None.** No currency or credit logic. | **Ideal for Ocean Planet Floating City.** Computational model can run inside a workstation host. Constants (`DENSITY_SEAWATER = 1025 kg/m³`) must be parameterized per planet rather than hardcoded to Earth. |
| **Solar Car Challenge** | `src/features/activities/solarCar/SolarCarChallenge.jsx`<br>`solarCarModel.js` | `users/{uid}/activityProgress/solar-car` | Physical build parameters & race kinematics: `{ mass, drag, solarArea, velocity, finishTime }`. | **None.** Pure simulation outputs. | Vehicle testing bay on arid/crater planets. Must override Earth gravity (`g = 9.81 m/s²`) and solar irradiance (`1000 W/m²`) with authored planetary values. |
| **SO₂ → Sulfate** | `src/features/activities/so2Sulfate/So2SulfateSimulation.jsx`<br>`so2Model.js` | Firestore `simulations/`, `simulationResults/` | Chemical reaction rates. Explicitly labeled: *"Simulated / illustrative model output"*. | **None.** Educational parameters, not empirical kinetics. | Volcanic/basalt vent workstation. Simulation outputs must retain illustrative disclaimer labels. |
| **Gold Filter Lab** | `src/features/activities/so2Sulfate/filter/GoldFilterLab.jsx`<br>`filterModel.js`, `ledger.js` | `budgets/{uid}`<br>`transactions/{uid}_{seq}`<br>`simulationRuns/{runId}` | Filter sweep efficiency, cost per cubic meter, particulate capture rates. | **Closed Simulation Economy.** Has starting balance, cost per run, sequence checks. | **STRICT ISOLATION.** Filter Lab credits are simulation tokens for cost-optimization tasks. They must **never** be linked to Universe progression, XP, or unlocked access. |
| **Plant Microscope Lab** | `src/features/activities/plantLab/PlantMicroscopeLab.jsx`<br>`plantLabModel.js` | `users/{uid}/activityProgress/plant-lab`<br>Canvas draw data | Guided observation notes, labeled cell sketches, hypothesis text. | **None.** Qualitative lab notebook. | Research lab dome workstation. Preserves drawing strokes and qualitative qualitative observations. |

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
3. **Reproducibility & Determinism:** Environmental phenomena use deterministic pseudo-random seeds (`seedrandom` based on event ID and planet ID) so that every learner experiences identical physical parameters for a given event.
4. **No Penalties for Missed Events:** If a learner does not participate in a weekly event, no negative records or streak penalties are recorded.

---

## 8. Connected Universes, Approved Visitors & Privacy Guardrails

1. **Read-Only Exported Snapshots:** Any future "shared universe" feature will operate solely on **immutable, exported read-only snapshots** stored in a dedicated Storage path (`/snapshots/{classId}/{snapshotId}.json`).
2. **Strict COPPA / FERPA Compliance:**
   - Snapshots contain only scene layout, placement coordinates, and assigned asset IDs.
   - **Zero PII:** Student real names, email addresses, personal notes, coach feedback, and assessment grades are strictly excluded from snapshot exports.
3. **No Unmoderated Peer Communication:**
   - Absolutely **no real-time text chat, freeform messaging, or direct student-to-student commenting** in 3D spaces.
   - Interactions are strictly limited to structured, coach-moderated reactions or standardized peer reviews.
4. **Revocation & Class Scoping:** Snapshots are viewable only within the student’s verified `classId`. A coach or student can revoke access at any time, which immediately deletes the snapshot reference.

---

## 9. AI Generation Safety & Controlled Publication

1. **Drafts, Never Direct Deploys:** Any future generative capability (e.g. generating planet lore, science challenges, or mission blueprints via Gemini) MUST write to an internal administrative staging collection:
   ```text
   admin/universe/draftBlueprints/{draftId}
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
- **Authoring & Review Pipeline:** Internal authoring and educator reviews occur in a private administrative collection (`adminUniverseDrafts`).
- **Publication Gate:** When reviewed and approved by Mani/Educator, a build script exports the documents to static JSON in the hosting build directory, tagged with an immutable semantic version (e.g. `catalog-v1.0.0.json`).
- **Benefits:** Maximum delivery speed, zero Firestore read costs, high cacheability at the edge, and full offline resilience.

### Question 2: Access Status Endpoint & Failure Behavior
> *The endpoint or contract that returns per-destination status (`charted | available | locked{requirementText} | not-connected`) for the signed-in learner, its latency, and its behaviour when the service is down.*

**Response:**
- **Endpoint:** `POST /api/universe/access` (described in §2.3).
- **Latency Budget:** Target < 250ms (evaluates custom claims and cached student progress).
- **Failure Behavior:** If the server times out (>3000ms), returns 5xx, or the network is offline, the client MUST gracefully map all requirement-gated destinations to Claude's **`not-connected`** status (grey dashed chip). Public destinations remain `available`. The UI remains fully interactive and never crashes or blocks.

### Question 3: Discovered Markers & Limits
> *May "charted/discovered" be stored per learner as a non-authoritative convenience? If so, where, and with what limits?*

**Response:**
**Yes.** Charted/discovered markers are non-authoritative client convenience data.
- **Location:** `users/{uid}/activityProgress/universe-v1` (uses existing Firestore rules).
- **Limits:** Arrays for `charted.galaxies`, `charted.systems`, `charted.planets`, and `charted.environments` are capped at **100 entries each**. The total document payload is hard-capped at **64 KB**. Client writes cannot write arbitrary keys outside the defined schema.

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
- **Hosting Location:** Firebase Hosting static directory (`public/assets/universe/...`) for core shared assets (planet LOD meshes, common textures, starfield sprites); Cloud Storage for larger optional environment packs.
- **Caching Rules:** Cache-Control headers set to `public, max-age=31536000, immutable` for content-hashed assets (e.g. `thalassa-terrain-c855527.glb`).
- **Size Limits:**
  - Individual planet LOD mesh: < **250 KB**.
  - Planet surface texture: < **1.5 MB** (using KTX2/Basis Universal or WebP).
  - Total first-slice environment payload: < **15 MB** compressed.
- **Cache-Busting:** Asset URLs in the catalog manifest will embed content hashes or version query strings.

### Question 7: Shared Universes & Moderation
> *The audience, permission and moderation model for visiting approved planets. No messaging.*

**Response:**
- **Audience:** Strictly scoped to enrolled classmates within the student's authenticated `classId`.
- **Permission Model:** Opt-in publication requiring coach approval. Read-only snapshot generated on demand.
- **Zero Messaging:** No student-to-student text entry, chat boxes, or graffiti. Visits are strictly spectator-mode flythroughs of the approved layout.

---

## 11. Architectural Conflicts, Risks & Implementation Plan

### 11.1 Identified Architectural Conflicts & Resolutions
1. **Slide Gesture vs. 3D Camera Controls:**
   - *Conflict:* My Dashboard uses horizontal swipe gestures and arrow keys to navigate between slides. An embedded 3D canvas intercepting touch/drag events creates severe input conflicts.
   - *Resolution:* Adopt Claude’s proposal (§5.1): My Universe opens as a **dedicated full-viewport exploration overlay** outside the slide deck, leaving the dashboard slide as an entry portal.
2. **Missing Dependencies in Canonical Checkout:**
   - *Conflict:* Neither `three`, `@react-three/fiber`, nor `@react-three/drei` are installed in the canonical checkout (`codex/my-universe-prototype`).
   - *Resolution:* Dependency installation must be requested as an explicit, isolated step once GPT-6 completes the coordinated review and Mani approves.

### 11.2 Emulator Verification Plan (For Later Implementation Gate)
Before any backend code touches staging or production, all universe contracts must be verified in the local Firebase emulator:
1. **Firestore Rules Suite (`tests/universe-rules.test.js`):**
   - Verify learner cannot read or write another learner's `activityProgress/universe-v1`.
   - Verify unauthenticated requests are rejected.
   - Verify coaches can read only their enrolled students' universe progress.
   - Verify client writes to `learnerQuest` or catalog collections fail.
2. **API Endpoint Suite (`tests/api/universe-access.test.js`):**
   - Test `/api/universe/access` with valid student tokens, expired tokens, and missing tokens.
   - Test destination status evaluation with mocked coach competencies.
   - Test rate-limiting behavior under burst conditions.

### 11.3 Bounded Proposed Implementation Sequence (Awaiting Approval)
```
Stage 1: Catalog & Schema (Static Hosting Manifests + TypeScript/JSDoc Types)
   │
Stage 2: Device Spike & R3F Integration (Canonical Dependency Approval)
   │
Stage 3: First Aligned Exploration Slice (2 Galaxies, 1 System, 3 Planets, 1 Ocean Environment)
   │
Stage 4: Authoritative Access Service & Verified Progression
```

---

## 12. Handoff Status & Confirmation

| Item | Status |
|---|---|
| **Handoff Document** | `/Users/admin/Desktop/HearIsland/output/my-universe/source/GEMINI BACKEND.md` |
| **Date** | 1 November 2026 |
| **Documentation-Only Scope** | **Confirmed.** Zero source code modifications, zero rules changes, zero dependency installs, zero database mutations, zero deployments. |
| **Prototypes & Saves** | **Preserved.** Both SVG and 3D prototypes and their local saves remain untouched. |
| **Next Step** | Handoff to **GPT-6** to review `CLAUDE DESIGN.md` and `GEMINI BACKEND.md`, reconcile decisions, update `UNIVERSE.md`, and present a coordinated implementation plan for Mani's explicit approval. |
