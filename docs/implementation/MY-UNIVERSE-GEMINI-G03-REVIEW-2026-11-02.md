# My Universe — G03 Technical Review of Pilot Mission Bundle (`0.2.0-draft`)

**Date:** 2 November 2026  
**Task ID:** `G03` Technical Review (Bounded Read-Only Review for `J02` Interoperability)  
**Author / Actual Model:** **Gemini 4 Argon** (selected by Mani; reported truthfully)  
**Decision:** **`ACCEPT`** — Initial review (§§1–8) accepted Revision 1 with notes `N1`/`N2`; **Section 9** confirms final **`ACCEPT`** (zero remaining blockers) on **Authoring Revision 2** (`releaseId: "pilot-fixture-g03-20261102-v2"`, `bundleContentSha256: "974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7"`), where `N1`, `N2`, and Opus `G-B1` are resolved directly in the bundle.  
**Scope & Authority:** Technical interoperability, schema/bounds, arithmetic, hash, and security/policy review only. **This is not educator/curriculum/science approval and does not authorize production release or source edits in this turn.**

---

## 1. Inspected G03 Artifacts, Revisions & Hashes (Initial Review — Revision 1)

All files were inspected read-only and verified directly against accepted Contract `0.1.1` ([MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md](MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md)) and baseline `G01` ([MY-UNIVERSE-G01-BASELINE-2026-11-02.md](MY-UNIVERSE-G01-BASELINE-2026-11-02.md)) without relying on `validation-report.json` (see **Section 9** for Revision 2 hashes):

| Artifact | Revision / Status | Declared Internal SHA-256 | File SHA-256 on Disk (Bytes) |
| :--- | :--- | :--- | :--- |
| [mission-bundle-0.2.0-draft.json](universe-pilot/mission-bundle-0.2.0-draft.json) | `schemaVersion: "1.0.0"`, `authoringRevision: 1`, `releaseId: "pilot-fixture-g03-20261102-v1"`, `status: "draft"` | `bundleContentSha256`: `f5252fbc23030b7c2f02264eeaf26c6bf08e306f1e26467d0c810e1b8f37a40b` | `3724651a70bfc1f53e8e59cb293e84cbe8b096e6202dbbbbc81d19034532fef0` (`64,717` B) |
| [THALASSA-WIND-SURVEY-0.2.0-DRAFT.md](universe-pilot/THALASSA-WIND-SURVEY-0.2.0-DRAFT.md) | `thalassa-wind-survey`, `version: "0.2.0-draft"`, `status: "draft"` | `contentSha256`: `ea551d223943f2f0a05fce46df73a4d5bc19d8a4afe8704d5ed8fd8fe5b6f90a` | `a49cd698dbd844faa4850ea9c9b80bc095300125925c21500a73437f94663e1e` (`15,104` B) |
| [SPACECRAFT-JOURNEY-0.2.0-DRAFT.md](universe-pilot/SPACECRAFT-JOURNEY-0.2.0-DRAFT.md) | `spacecraft-journey`, `version: "0.2.0-draft"`, `status: "draft"` | `contentSha256`: `43d612220b968fa075ea2290b62980ce3b7701667ac5cd842193972e909a1109` | `dafc39b46f407573ca534536e15aabbdc4f1f7b72bdf8941c4d0b0bb288d2b80` (`23,997` B) |
| [MY-UNIVERSE-G03-HANDOFF-2026-11-02.md](MY-UNIVERSE-G03-HANDOFF-2026-11-02.md) | Handoff specification | N/A | `87433d7e0a6409e90c39449962b077d93bb4fba72e2bb9ff61e5d82b83bbeedb` (`7,088` B) |

- **Catalog Hash Alignment:** `compatibility.catalogSha256` (`44c038cf1e3c6b6fc290a925ebec93083d8137686115397ff3420ff79c3bbe7d`) matches `b35f8b2:public/cosmos/v1/catalog.json` (`catalogVersion: "1.2.0"`) byte-for-byte.

---

## 2. Exact Mission, Route, Task, Part Identity & Request Examples vs. Contract `0.1.1`

### 2.1 Mission / Route / Task Identity Matrix
All three route definitions in `mission-bundle-0.2.0-draft.json` conform strictly to Contract `0.1.1` §§1, 2, 9.1:

| Mission ID (`version`) | `routeId` | `taskId` | Learner-Facing `name` | `challengeLevel` / `gradeBand` | `supportModes` | Preserved Legacy Step IDs + New `0.2.0-draft` Steps |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `thalassa-wind-survey` (`0.2.0-draft`) | `guided` | `wind-capacity-factor` | `"Wind energy estimate"` | `2` / `"6-8"` | `["guided", "independent"]` | Preserves 5 legacy step IDs (`hours`, `full-power`, `capacity-factor`, `why-not-average`, `use-it`); adds 4 new `0.2.0-draft` steps (`evidence-check`, `agree-criteria`, `stress-check`, `reflect`; 9 steps total). |
| `spacecraft-journey` (`0.2.0-draft`) | `guided` | `journey-rates` | `"Journey timing"` | `2` / `"6-8"` | `["guided", "independent"]` | Preserves `compare`, `seconds`, `days`, `food`, `reflect`; adds `agree-criteria`, `compare-options`, `route-plan` (8 steps total). |
| `spacecraft-journey` (`0.2.0-draft`) | `advanced` | `journey-mass-power` | `"Mass and power tradeoffs"` | `4` / `"9-12"` | `["guided", "independent"]` | Preserves `chem-propellant`, `ion-propellant`, `supplies`, `panels`, `reflect`; adds `agree-criteria`, `compare-solutions`, `earth-transfer`, `route-plan` (9 steps total). |

- **Catalog & Capability References:** `planetIds` (`["thalassa"]` and `["thalassa", "ignis"]`), `locationId` (`"weather-mast"`), `sceneKinds` (`["ocean-station", "basalt-fissures"]`), `artifactPartKinds` (`["text", "table", "choice", "diagram"]`), and `artifactReferenceEnabled: false` match the installed renderer capabilities and Contract `0.1.1` §9.4.

### 2.2 Synthetic Request Examples (`referenceArtifacts`) Verification
All three entries in `referenceArtifacts` (`thalassa-wind-survey-guided`, `spacecraft-journey-guided`, `spacecraft-journey-advanced`) were validated against Contract `0.1.1` §§3, 5, 9.1, 9.5:
1. **Identity & Envelope Fields:** Every request carries `contractVersion: "1.0.0"`, `releaseId: "pilot-fixture-g03-20261102-v1"`, `missionVersion: "0.2.0-draft"`, exact `routeId` and `taskId`, `supportMode: "guided"`, `policyVersion: "pilot-review-only-0.1.0-draft"`, and `previousSubmissionId: null`. Zero client-authority fields (`learnerUid`, `orgId`, `status`, `outcome`, `grantIds`, `coachUid`) appear in the request bodies.
2. **Idempotency Headers:** `Idempotency-Key` values are 37–39 safe ASCII characters (`g03-fixture-thalassa-wind-survey-guided`, `g03-fixture-spacecraft-journey-guided`, `g03-fixture-spacecraft-journey-advanced`), within the `16..128` character contract bound.
3. **Byte & Length Budgets:**
   - `thalassa-wind-survey-guided`: `2,269` UTF-8 bytes (`<= 65,536` B), `reflection` `231` trimmed chars (`20..2,000`), `6` evidence parts (`<= 8`).
   - `spacecraft-journey-guided`: `1,765` UTF-8 bytes (`<= 65,536` B), `reflection` `342` trimmed chars (`20..2,000`), `4` evidence parts (`<= 8`).
   - `spacecraft-journey-advanced`: `2,365` UTF-8 bytes (`<= 65,536` B), `reflection` `355` trimmed chars (`20..2,000`), `5` evidence parts (`<= 8`).

---

## 3. Bounded `requiredParts` Alternatives & `choiceOptions`

Each route's `requiredParts` array satisfies Contract `0.1.1` §3 and §9.1 (`GB1` / `B1`):
- **Unique `partId`s & 1-to-1 Satisfaction:**
  - `wind-capacity-factor` (`6` parts): `criteria` (`["text"]`), `weighted-results` (`["table", "text"]`), `plan-comparison` (`["table", "text"]`), `recommendation` (`["choice"]`), `data-quality` (`["text"]`), `limitations-next-measurement` (`["text"]`).
  - `journey-rates` (`4` parts): `criteria` (`["text"]`), `comparison` (`["table", "text"]`), `route-plan` (`["diagram", "text"]`), `recommendation` (`["text"]`).
  - `journey-mass-power` (`5` parts): `criteria` (`["text"]`), `comparison` (`["table", "text"]`), `route-plan` (`["diagram", "text"]`), `recommendation` (`["text"]`), `earth-transfer` (`["text"]`).
- **Accessible Alternatives:** Every `table` and `diagram` part includes `"text"` in `anyOfKinds`, allowing screen-reader, keyboard-only, or spoken-transcript learners to submit equivalent structured reasoning without requiring visual drawing or external uploads.
- **Authored Choice Validation:** `thalassa-wind-survey` `guided` declares `choiceOptions.recommendation: ["plan-a", "plan-b", "insufficient-evidence"]`. The server validator can deterministically verify that any submitted `choice` part with `partId === "recommendation"` has `selectedId` in `route.choiceOptions[partId]` and `reason` trimmed length `1..2,000` characters.

---

## 4. Numeric `answerFormat` & `answerCheck` Interoperability

All 10 `kind: "number"` steps across the three routes declare explicit `answerFormat` (`{ decimalPlaces, roundingMultiple, showGrouping }`) and `answerCheck` (`{ mode: "reference-or-declared-rounded", absoluteTolerance: 1e-06, practiceOnly: true }`):

| Mission / Route | Step ID | Raw `answer` | `answerFormat` (`decimalPlaces`, `roundingMultiple`) | Declared Rounded Value | Unit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `thalassa-wind-survey` / `guided` | `hours` | `168` | `0`, `null` | `168` | `h` |
| `thalassa-wind-survey` / `guided` | `full-power` | `56.5` | `1`, `null` | `56.5` | `h` |
| `thalassa-wind-survey` / `guided` | `capacity-factor` | `0.33630952380952384` | `2`, `null` | `0.34` | `dimensionless` |
| `spacecraft-journey` / `guided` | `seconds` | `3600000` | `0`, `null` | `3600000` | `s` |
| `spacecraft-journey` / `guided` | `days` | `41.666666666666664` | `1`, `null` | `41.7` | `days` |
| `spacecraft-journey` / `guided` | `food` | `226.8` | `1`, `null` | `226.8` | `kg` |
| `spacecraft-journey` / `advanced` | `chem-propellant` | `19072.300884096952` | `0`, `10` | `19070` | `kg` |
| `spacecraft-journey` / `advanced` | `ion-propellant` | `1840.7642445419074` | `0`, `10` | `1840` | `kg` |
| `spacecraft-journey` / `advanced` | `supplies` | `1558.2` | `1`, `null` | `1558.2` | `kg` |
| `spacecraft-journey` / `advanced` | `panels` | `256.00000000000006` | `0`, `null` | `256` | `m²` |

### Interoperability Verification & Non-Blocking Note (`N2`)
1. **Fixes `0.34 → 0.3` Legacy Display Bug:** Replacing magnitude-based rounding (`Math.abs(n) < 100` → 1 decimal place) with `answerFormat` ensures `capacity-factor` (`0.3363095...`) displays as `0.34` (`decimalPlaces: 2`) and propellant steps round to the nearest `10 kg` (`19,070` and `1,840`).
2. **Deterministic `reference-or-declared-rounded` Evaluation:**
   - Given `declaredRounded(step)`: if `roundingMultiple != null`, `v = Math.round(answer / roundingMultiple) * roundingMultiple`; then `v = Number(v.toFixed(decimalPlaces))`.
   - A parsed finite number `x` (parsed on the server/adapter from `rawText` `0..64` chars after stripping grouping commas and optional matching unit suffix) satisfies `reference-or-declared-rounded` when `Math.abs(x - step.answer) <= step.answerCheck.absoluteTolerance || Math.abs(x - declaredRounded(step)) <= step.answerCheck.absoluteTolerance`.
   - All `number` and `choose` steps carry `practiceOnly: true`; practice checks never gate or score mission submissions.
3. **Cross-Engine Floating-Point Tolerance:** On `ionPropellantKg`, Python `12000 * (math.exp(4200 / (3000 * 9.81)) - 1)` yields `1840.7642445419074` while V8/Node.js `Math.exp` yields `1840.7642445419067` (a 3-ULP difference of `6.82e-13` kg). The declared `absoluteTolerance: 1e-6` (`0.000001`) is 6 orders of magnitude larger than this ULP difference, ensuring 100% agreement between Python authoring checks and Node.js/browser runtime checks.
4. **Non-Blocking Markdown Display Note (`N2`):** In [SPACECRAFT-JOURNEY-0.2.0-DRAFT.md](universe-pilot/SPACECRAFT-JOURNEY-0.2.0-DRAFT.md#L85), the markdown generator rendered `Educator reference: 3.6e+06 s` for step `seconds`, whereas `mission-bundle-0.2.0-draft.json` L776–782 specifies `answer: 3600000.0` with `answerFormat: { decimalPlaces: 0, roundingMultiple: null, showGrouping: true }` (`3,600,000 s`). Runtime adapters and UI components must format numbers strictly from `answerFormat` in the JSON bundle (`3,600,000 s`), never Python `%g` scientific notation.

---

## 5. Dataset & Content Hashing — Cross-Runtime Normalization Requirement (`N1`)

All seven internal SHA-256 digests in `mission-bundle-0.2.0-draft.json` were independently recomputed under both Python 3 (`json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False)`) and Node.js (`JSON.parse` + recursive key-sorted `JSON.stringify`):

| Target Object | Stored SHA-256 in Bundle | Matches Python `json.dumps`? | Node.js `JSON.stringify` SHA-256 |
| :--- | :--- | :--- | :--- |
| `dataset: thalassa-wind-week-02` | `1801de66f2a89136553b32655d0f0cb350e8fca9ed7da56f01370b91b0831b81` | **Yes (`True`)** | `1801de66f2a89136553b32655d0f0cb350e8fca9ed7da56f01370b91b0831b81` (**Match**) |
| `dataset: thalassa-plan-cards-02` | `af85c6b383fb836b4226a1d3b94d0ef2ffadcb5fe7429399e99758c60dc03aef` | **Yes (`True`)** | `ad3498abf12f6e3dfd307862d6b0b305562288c871401014076d404eda834929` (Differs) |
| `dataset: journey-constant-rate-02` | `c1a31bbd23a5315bbab56bda35a606233f2ad92c2f50a284622474969c41229d` | **Yes (`True`)** | `868c3cdf7c3a6280187cd2a46c02ba81c197bf18f914fad3a2568784b44e9de9` (Differs) |
| `dataset: journey-mass-power-case-02` | `4a71aa1914dfbe77e2238d83c3348a06638dfbedea6bdefed3a84bf178c0f0ff` | **Yes (`True`)** | `817d8410544306277c966ba10dcdbcb55b2c1d5f16e4456746e7c42cbb8d1624` (Differs) |
| `mission: thalassa-wind-survey` | `ea551d223943f2f0a05fce46df73a4d5bc19d8a4afe8704d5ed8fd8fe5b6f90a` | **Yes (`True`)** | `448ae64624015aa057537e9714efe4e723ecf880d0c543efe4f636ab3784cb8d` (Differs) |
| `mission: spacecraft-journey` | `43d612220b968fa075ea2290b62980ce3b7701667ac5cd842193972e909a1109` | **Yes (`True`)** | `ce2b9d379b6c7e4a42b17ffd99df4232e006e24e600323d69d6f21c921a4ce13` (Differs) |
| `bundleContentSha256` | `f5252fbc23030b7c2f02264eeaf26c6bf08e306f1e26467d0c810e1b8f37a40b` | **Yes (`True`)** | `82ed6bf716d399511de50887d545e0a26f4825d9efd22f7fc03e3f28bef40cf7` (Differs) |

### Technical Finding `N1` — Python vs. ECMAScript Canonical JSON Number Serialization
- **Cause:** `mission-bundle-0.2.0-draft.json` contains whole-number Python floats with `.0` suffixes (`14160.0`, `2160.0`, `10800.0`, `16320.0`, `4320.0`, `9600.0`, `3600000.0`, `6000000.0`, `378.0`, `12000000.0`, `2226.0`, `168.0`) and scientific notation `1e-06`. Once parsed by JavaScript `JSON.parse()`, IEEE-754 `Number` does not retain a `.0` tag on integers (`JSON.stringify(168.0) === "168"`) and formats `1e-6` in fixed notation (`JSON.stringify(1e-6) === "0.000001"`).
- **Contract & Adapter Resolution (Aligns with `MY-UNIVERSE-G03-HANDOFF-2026-11-02.md` L44):**
  1. **Authoring Verification:** The stored hashes in `mission-bundle-0.2.0-draft.json` are 100% valid under the Python generator and uniquely identify this `G03` draft revision.
  2. **Runtime Manifest Normalization (`shared/universe/`):** When generating the runtime `shared/universe/` modules, normalize exact integer-valued floats (`x % 1 === 0` → integer `168`, `14160`, `3600000`, etc.) and serialize numbers using RFC 8785 / ECMAScript `Number.toString()` (`0.000001` instead of `1e-06`) so Python build scripts and Node.js runtime `JSON.stringify` produce identical bytes and SHA-256 digests.
  3. **Server Adapter Rule (`J02`):** When recording `missionContentHash` on `missionSubmissions`, the server reads the verified `contentSha256` from the loaded release manifest rather than ad-hoc re-stringifying mutated runtime objects, while verifying manifest integrity at startup.

---

## 6. Raw CF vs. Rounded Planning Arithmetic & Separate Journey Assumptions

All dataset and step calculations were independently verified in Node.js:
1. **Thalassa Wind Survey (`thalassa-wind-week-02` & `thalassa-plan-cards-02`):**
   - Total hours: `20 + 50 + 60 + 30 + 8 = 168 h`.
   - Equivalent full-power hours: `(20×0) + (50×0.1) + (60×0.35) + (30×0.75) + (8×1) = 0 + 5 + 21 + 22.5 + 8 = 56.5 h` (`56,500 kWh/week` at `1,000 kW`).
   - Raw capacity factor: `56.5 / 168 = 0.33630952380952384` (`≈ 8,071.43 kWh/day` per 1 MW turbine).
   - Declared planning/lab capacity factor: `0.34` (`1,000 kW × 0.34 × 24 h = 8,160 kWh/day` per 1 MW turbine). The pack and dataset explicitly distinguish the `8,071.43 kWh/day` raw weekly average from the `8,160 kWh/day` rounded planning estimate.
   - Base plans at `CF = 0.34` (`demand = 12,000 kWh/day`, `mass <= 40 t`, `area <= 1,000 m²`):
     - `plan-a`: `8,160 + 6,000 = 14,160 kWh/day` (`+2,160 kWh/day` surplus), `28 t`, `900 m²` (feasible; favors lower mass).
     - `plan-b`: `(2 × 8,160) + 0 = 16,320 kWh/day` (`+4,320 kWh/day` surplus), `36 t`, `600 m²` (feasible; favors smaller deck area and higher base margin).
   - Lower-wind stress case at `CF = 0.20` (`4,800 kWh/day` per 1 MW turbine):
     - `plan-a`: `4,800 + 6,000 = 10,800 kWh/day` (`1,200 kWh/day` shortfall; smaller deficit).
     - `plan-b`: `2 × 4,800 = 9,600 kWh/day` (`2,400 kWh/day` shortfall).
2. **Journey to Ignis — Separate Scenario G (`journey-constant-rate-02`) vs. Scenario A (`journey-mass-power-case-02`):**
   - **Scenario G (`guided` / `journey-rates`):** `72,000,000 km`, `3` crew, `1.8 kg/person/day`, limits `<= 80 d` and `<= 400 kg`:
     - `chemical` (`20 km/s`): `3,600,000 s` = `41.6667 d` → provision `42 d` → `226.8 kg` food (meets both limits).
     - `ion` (`12 km/s`): `6,000,000 s` = `69.4444 d` → provision `70 d` → `378.0 kg` food (meets both limits).
     - `sail` (`6 km/s`): `12,000,000 s` = `138.8889 d` → provision `139 d` → `750.6 kg` food (exceeds both limits).
   - **Scenario A (`advanced` / `journey-mass-power`):** Explicitly separated from Scenario G (`ionDays: 140` is an independent case input, never derived from `12 km/s`):
     - `m_prop = 12,000 × (exp(4,200 / (Isp × 9.81)) − 1)`: `chemical` (`Isp = 450 s`) = `19,072.30 kg` (`19,070 kg` nearest 10); `ion` (`Isp = 3,000 s`) = `1,840.76 kg` (`1,840 kg` nearest 10).
     - Supplies (`3 × 5.3 kg/day × days`): `chemical` (`42 d`) = `667.8 kg`; `ion` (`140 d`) = `2,226.0 kg`; extra ion supplies = `1,558.2 kg`.
     - Partial added-mass ledger (`m_prop + supplies`, explicitly labeled partial and not total launch mass): `19,740.10 kg` (`chemical`) vs. `4,066.76 kg` (`ion`), both `<= 21,000 kg`.
     - Solar array area near Ignis (`ignisDistanceRatio: 1.6` — relative orbital-distance ratio to Thalassa, not an asserted AU distance): flux `1,200 / 1.6² = 468.75 W/m²`; electrical `468.75 × 0.25 = 117.1875 W/m²`; area `30,000 / 117.1875 = 256 m² <= 260 m²`.

---

## 7. Production Fixture Rejection & `reviewed-only` Policy Enforcement

1. **Draft / Fixture Rejection in Production:**
   - `mission-bundle-0.2.0-draft.json` carries top-level `status: "draft"`, `releaseId: "pilot-fixture-g03-20261102-v2"` (Revision 2), `reviewState.publication: "not-authorized"`, `policy.productionSubmissionsAllowed: false`, and `missions[*].status: "draft"`.
   - In `J02`, the server availability and submission guards will check:
     1. Whether the release is in the production release registry (`status === "published"` and `policy.productionSubmissionsAllowed === true`), or
     2. Whether `isEmulatorEnvironment() && process.env.ALLOW_DRAFT_MISSIONS === "true"` for `in-review` / `draft` fixture releases.
   - Outside the emulator, any draft/fixture `releaseId` or `missionVersion` (`0.1.0-draft`, `0.2.0-draft`, `pilot-fixture-*`) fails closed with `409 MISSION_NOT_OPEN` (`canStart: false, canResume: false, canSubmit: false`), even if a client sends preview headers or flags.
2. **Reviewed-Only Policy (`No Grants`):**
   - `policy` specifies `{ "version": "pilot-review-only-0.1.0-draft", "type": "reviewed-only", "grantIds": [] }` and both missions reference `completionPolicyRef: "pilot-review-only-0.1.0-draft"`.
   - Coach approval of either mission records `outcome: { type: "reviewed-only", grantIds: [], messageKey: "universe.mission.reviewed", nextMissionIds: [] }` and grants zero planet unlocks. `POST /api/universe/access` keeps `boreas` locked with `evaluatedRule: "boreas-policy-unresolved"`, `requirementKey: "universe.boreas.policyPending"`, and `requirementText: "This expedition is not open yet."`

---

## 8. J02 Implementation Obligations for Gemini 4 Argon (Next Backend Turn)

Once a freshly verified integration checkout from `origin/main` (`3e461197f748cb62a6d6dfdabc7541307b41f82b` was the historical `G01` audit observation and must be freshly re-verified before branching) and the `J02` writer turn are assigned, **Gemini 4 Argon** will execute:

1. **Packaging & Shared Module Wiring (`shared/universe/`, `functions/`, `vite.config.js`, `tests/universe-preview/`):**
   - Configure `functions/package.json` (`esbuild`), `vite.config.js`, `tests/universe-preview/vite.config.js`, and `tests/universe-preview/vitest.config.js` to resolve GPT's pure ESM/JSON modules under `/shared/universe/`, keeping fixture entry points isolated from production bundles and verifying hashes with `sorted-key-json-ecmascript-v1`.
   - Prove isolated `functions/dist/index.js` bundle loading in a clean directory without root `node_modules` fallback.
2. **Server Registry & Availability Adapter (`server/lib/universe/`):**
   - Consume the `0.2.0-draft` mission/route/task/part/choiceOptions/diagramTemplates/tableTemplates definitions (while retaining read-only history compatibility for `0.1.0-draft`).
   - Implement `GET /api/universe/missions/:missionId/availability` enforcing `open | in-review | withdrawn | retired | unknown` and rejecting draft/fixture bundles in production.
3. **API & Atomic Firestore Transactions (`server/routes/universe.js`, `server/routes/coach-universe.js`):**
   - Enforce `contractVersion: "1.0.0"` and `X-Universe-Contract-Version: 1.0.0`.
   - Enforce explicit server-resolved `orgId` (never trusting client `orgId` or falling back to `'org-welearn'`), class overlap for coaches/teachers, and no self-review (`caller.uid !== subData.learnerUid`).
   - Use SHA-256 canonical JSON tuple keys for `missionSubmissionLocks` (`[orgId, learnerUid, missionId]`), `universeIdempotency` (`[orgId, callerUid, operation, idempotencyKey]`), and `missionDrafts` (`[orgId, learnerUid, releaseId, missionId, missionVersion, routeId, taskId, policyVersion]`).
   - Validate `requiredParts` (`anyOfKinds`), `choiceOptions`, diagram wire shape (`nodes: [{ id, label }]`, `edges: [{ fromId, toId, label }]`, `description`, `<= 12` nodes / `<= 20` edges), `rawText` (`0..64` chars parsed server-side), 64 KiB body/doc limits, and `artifactReferenceEnabled: false`.
   - Execute submission creation and coach review atomically with `missionSubmissionLocks`, `universeIdempotency`, and `auditLogs` inside `db.runTransaction()`, returning `201` on creation and `200` (`idempotentReplay: true`) on verified replay.
   - Implement exact `{ seconds, nanoseconds, docId, filterHash }` cursor pagination and `Cache-Control: private, no-store` on learner/coach list endpoints.
   - Return `type: "reviewed-only"` outcomes on review and `boreas-policy-unresolved` on `POST /api/universe/access`.
4. **Firestore Rules & Composite Indexes (`firestore.rules`, `firestore.indexes.json`):**
   - Deny direct client reads/writes (`allow read, write: if false;`) on `missionSubmissionLocks`, `universeIdempotency`, `missionDrafts`, and `missionSubmissions` (or enforce strict equivalent org/class/field rules where direct reads are permitted).
   - Restrict `users/{userId}/activityProgress/universe-v1` strictly to explorer bookmarks/preferences (`schemaVersion`, `updatedAt`, `lastPlanetId`, `lastLocationId`, `visitedPlanetIds`, `visitedLocationIds`).
   - Add composite indexes for paged org- and class-scoped queries and verify all suites (`test:rules`, `test:api`, `test:universe`, `test:unit`) in the Firebase Emulator Suite.

---

## 9. Final Confirmation of G03 Authoring Revision 2 (`pilot-fixture-g03-20261102-v2` — `ACCEPT`)

**Decision:** **`ACCEPT`** (zero remaining technical blockers for `authoringRevision: 2` / `releaseId: "pilot-fixture-g03-20261102-v2"` / `bundleContentSha256: "974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7"`).

**Author / Actual Model:** **Gemini 4 Argon** (selected by Mani; reported truthfully).  
**Scope:** Bounded technical confirmation of `G03` Revision 2 only. Educator/science/curriculum review remains pending (`reviewState.publication: "not-authorized"`). No runtime source/config edits, branches, package installs, merges, or deployments were performed.

---

### 9.1 Verified Revision 2 Hashes (`sorted-key-json-ecmascript-v1`)

All seven declared SHA-256 digests in [mission-bundle-0.2.0-draft.json](universe-pilot/mission-bundle-0.2.0-draft.json) (`authoringRevision: 2`, `releaseId: "pilot-fixture-g03-20261102-v2"`) were recomputed directly in Node.js using the bundle's declared `hashEncoding` (`sorted-key-json-ecmascript-v1`: recursive UTF-16 key sort, array order preserved, ECMAScript `JSON.stringify` primitive encoding, compact UTF-8, excluding only the object's own checksum field):

| Object / File | Declared `sorted-key-json-ecmascript-v1` SHA-256 | Node.js Verification | File SHA-256 on Disk |
| :--- | :--- | :--- | :--- |
| **Bundle (`mission-bundle-0.2.0-draft.json`)** | `974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7` | **Match (`true`)** | `7885a55c262070a470bf035c83bcb7543165098a7228da632bd09822a8647a04` |
| **Dataset `thalassa-wind-week-02`** | `1801de66f2a89136553b32655d0f0cb350e8fca9ed7da56f01370b91b0831b81` | **Match (`true`)** | *(in bundle)* |
| **Dataset `thalassa-plan-cards-02`** | `ad3498abf12f6e3dfd307862d6b0b305562288c871401014076d404eda834929` | **Match (`true`)** | *(in bundle)* |
| **Dataset `journey-constant-rate-02`** | `868c3cdf7c3a6280187cd2a46c02ba81c197bf18f914fad3a2568784b44e9de9` | **Match (`true`)** | *(in bundle)* |
| **Dataset `journey-mass-power-case-02`** | `817d8410544306277c966ba10dcdbcb55b2c1d5f16e4456746e7c42cbb8d1624` | **Match (`true`)** | *(in bundle)* |
| **Mission `thalassa-wind-survey`** | `3e228462adc93a8f8ef9dc7fb96525e4a1a64609ea634f2d59737c7a70224e4d` | **Match (`true`)** | `808f4deba3287ebeaab7a4f147254dc704519de7362fa64a764fbb69564ef9b4` (MD) |
| **Mission `spacecraft-journey`** | `155394d13e0b8a657dbb511d8dfa0fe2467f08f8ff709453b548dde40887d267` | **Match (`true`)** | `35a5d348f97d5d15407ee887b0220d9f3e1377b812133e4669687ae6de31f945` (MD) |
| **Handoff (`MY-UNIVERSE-G03-HANDOFF-2026-11-02.md`)** | N/A | N/A | `de470ce48855c6e50c8d7179b937696a75775246481a74307b020564f2644628` |

---

### 9.2 Confirmed Resolutions in Revision 2

1. **`N1` Resolved in Authoring Bundle (`sorted-key-json-ecmascript-v1`):**
   - `mission-bundle-0.2.0-draft.json` now specifies `hashEncoding: "sorted-key-json-ecmascript-v1"` and uses Node/ECMAScript primitive encoding during authoring and validation. All 7 hashes verify natively in Node.js (`match_node === true`) without any deferred normalization step.
2. **`N2` Resolved in Readable Packs (`3,600,000 s`):**
   - Readable educator references now use the declared `answerFormat` decimal/grouping rules (e.g., `3,600,000 s` in `SPACECRAFT-JOURNEY-0.2.0-DRAFT.md` instead of `3.6e+06 s`).
3. **Opus `G-B1` Additions & Server/Shared Adapter Interoperability:**
   - **Step-to-Part Bindings, Starters, Worked Examples & Solutions:** `notebookBehavior`, `tableTemplates` (explicitly distinguishing given vs. learner-entered cells), `sentenceStarters`, `workedExample`, `choiceLabels` (including `"insufficient-evidence": "I need more evidence before choosing a plan"`), complete `solution` explanations, and `>= 2` `hints` per practice step are present and cleanly structured.
   - **Diagram Wire Shape & Vocabulary (`diagramTemplates['route-plan']`):** Specifies bounded `nodeVocabulary` and `edgeVocabulary`, `wireShape` (`nodes: [{ id, label }]`, `edges: [{ fromId, toId, label }]`, `description` `1..2,000` chars), `maxNodes: 12`, `maxEdges: 20`, and `autoLayout` (no coordinates or executable drawing commands accepted on the wire).
   - **Capabilities:** `compatibility.workstationKinds: ["mission", "simulation"]` is declared alongside `sceneKinds: ["ocean-station", "basalt-fissures"]`, `artifactPartKinds: ["text", "table", "choice", "diagram"]`, and `artifactReferenceEnabled: false`.
   - **Five Positive Request Fixtures (`referenceArtifacts`):**
     1. `thalassa-wind-survey-guided` (`Idempotency-Key: "g03-fixture-thalassa-wind-survey-guided"`, `2,269` UTF-8 bytes)
     2. `spacecraft-journey-guided` (`Idempotency-Key: "g03-fixture-spacecraft-journey-guided"`, `1,765` UTF-8 bytes)
     3. `spacecraft-journey-advanced` (`Idempotency-Key: "g03-fixture-spacecraft-journey-advanced"`, `2,365` UTF-8 bytes)
     4. `thalassa-wind-survey-guided-text-alternative` (`Idempotency-Key: "g03-fixture-thalassa-wind-survey-guided-text"`, `2,085` UTF-8 bytes, exercising `weighted-results` as `kind: "text"`)
     5. `spacecraft-journey-guided-diagram-alternative` (`Idempotency-Key: "g03-fixture-spacecraft-journey-guided-diagram"`, `2,191` UTF-8 bytes, exercising `route-plan` as `kind: "diagram"` with resolved `nodes` and `edges`)
   - **Practice `answerCheck` Semantics (`declared-rounding-equivalent`):**
     - `mode: "declared-rounding-equivalent"`, `absoluteTolerance: 0.000001`, `closeRelativeTolerance: 0.02`, `rounding: "decimal-half-away-from-zero"`, `practiceOnly: true`.
     - Accepts inputs whose value rounded under `answerFormat` (decimal half-away-from-zero) equals the reference rounded under `answerFormat` (so more-precise work such as `0.336` for CF or `41.67` for days is accepted as correct), or within `1e-6` of the full reference; gives a rounding/close hint within `2%` relative error (`closeRelativeTolerance: 0.02` using `max(abs(reference), 1e-9)` as denominator); and never confers assessment or submission authority.
   - **Hidden Lab Link (`optionalLab`):** `thalassa-wind-survey` sets `optionalLab.enabledInAssessedFlow: false` and `reviewedScenarioVersion: null`, keeping the Hex-Grid station link hidden in the assessed flow until its scenario is separately corrected, reviewed, and versioned.
4. **Confirmed Wording Corrections in This Review Document:**
   - Updated §2.1 (`L33`): in `thalassa-wind-survey`, `reflect` is one of the 4 new `0.2.0-draft` steps (`evidence-check`, `agree-criteria`, `stress-check`, `reflect`), while the 5 preserved legacy `0.1.0-draft` step IDs are `hours`, `full-power`, `capacity-factor`, `why-not-average`, and `use-it`.
   - Updated §6 (`L136`): `ignisDistanceRatio: 1.6` is a relative orbital-distance ratio to Thalassa, not an asserted AU distance.
   - Updated §8 (`L156`): `3e461197f748cb62a6d6dfdabc7541307b41f82b` is a historical `G01` observation; any later implementation checkout must freshly verify `origin/main` before a writer turn begins.

