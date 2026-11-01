# Existing STEM activities — initial read-only reuse inventory

1 November 2026 · GPT-6 · Documentation handoff support

## Scope and limits

This is an initial source inventory of the canonical My Universe checkout at base `c855527`, not a migration, runtime certification, complete educational review or NGSS alignment audit. No module was rebuilt, wrapped, moved or connected to My Universe. Existing source comments about deployment/security are descriptions in source, not independent verification of production.

The intended future product can host simulations/projects inside planetary environments. It must preserve the original model's scientific scope, user data and evidence semantics. The existence of an activity icon or program outline is not proof of an embeddable simulation.

## Candidate modules

| Existing activity | Located implementation / boundary | Candidate reuse | Coupling and limits to audit before future work |
|---|---|---|---|
| **Project Hex-Grid** | `src/features/activities/hexGrid/ProjectHexGrid.jsx`, `HexMap.jsx`, `hexGridModel.js`, `useHexGridProject.js`, `hexGridSources.js`. The model exposes pure `simulate`, city normalization and hypothesis comparison helpers. | Strong conceptual candidate for an ocean-planet city project: interdependent energy, water, food, waste, population/wellbeing and buoyancy/loading considerations. | Existing city UI is 2D, not a ready-made 3D planetary environment. Persistence uses UID-keyed local storage and `users/{uid}/activityProgress/hex-grid`. The model explicitly describes a **steady-state daily balance** and excludes weather, storms, waves, seasons, costs and other dynamics. Do not depict a future storm as something this model currently simulates. Preserve DATA/ESTIMATE/ASSUMPTION labels, sources and model version. |
| **Solar Car** | `src/features/activities/solarCar/SolarCarChallenge.jsx`, `solarCarModel.js`, `useSolarCarBuild.js`, `designReview.js`. Model calculations are separated from DOM/React/network. | Vehicle/energy engineering workstation, measured-input prediction and design iteration patterns. | Earth/reference constants, supplied motor/irradiance assumptions and physical classroom measurements are not automatically valid for another planet. State includes build measurements, runs and reflection, with local storage and `users/{uid}/activityProgress/solar-car` sync. Review AI design-review dependencies separately from the pure model. Existing outputs do not establish spacecraft propulsion/fuel validity. |
| **SO₂ → Sulfate** | `src/features/activities/so2Sulfate/So2SulfateSimulation.jsx`, `so2Model.js`, `MoleculeScene.jsx`, `LineChart.jsx`, `simulationStore.js`. | Chemistry investigation, parameter/control separation, illustrative kinetics and chart presentation. | `so2Model.js` explicitly states rates are illustrative educational parameters, not fitted experimental measurements. Preserve the simulated-output label and conservation/assumption boundaries. Save/run services have existing Firestore dependencies; they cannot be silently repointed to Universe state. A molecule visual is not a planetary atmosphere simulation. |
| **Gold Filter Lab** | `src/features/activities/so2Sulfate/filter/GoldFilterLab.jsx`, `filterModel.js`, `FilterScene.jsx`, `ledger.js`, `pricing.js`, `labParts.jsx`. Pure filter/sweep calculations exist separately from UI/storage. | Environmental filtration investigation and parameter-sweep/report concepts. | UI imports authentication claims and ledger/store helpers. Its existing budget/transaction/run/report paths are a distinct simulation-credit system, **not Universe XP or verified reward entitlements**. Review current rules/service behavior before any embedding. Do not merge economies or carry client activity credit into destination access. Model output/assumption labels must remain visible. |
| **Plant Microscope Lab** | `src/features/activities/plantLab/PlantMicroscopeLab.jsx`, `plantLabModel.js`, `useLabBook.js`, `DrawPad.jsx`. Observation, hypothesis, analysis and stage helpers exist. | Surface research station or laboratory workflow for observing samples and recording evidence. | This is primarily a guided investigation/lab book, not an autonomous plant/ecosystem growth simulator. Learner-entered observations and general explanatory facts are deliberately distinct. Preserve that distinction, drawing state, record attribution and save behavior. Assess age suitability and accessibility in the new host separately. |
| **Urban Heat, Bunker Survival, Micro:bit Coding, Bangkok Coastal** | `src/features/activities/activityHost.js` identifies legacy containers and navigation IDs (`phase1`, `bunker`, `coding`, `bangkok`). Markup/behavior live in `index.html` and its legacy script structure. | Existing scenario content, exercises and possibly calculation logic may be useful after a dedicated extraction audit. | Not independent React modules. The activity bridge uses `document.getElementById` and hides/shows global containers. Global IDs/styles/listeners and startup lifecycle must be inventoried before any future embedding. Do not iframe/rebuild/extract them now or assume a thumbnail/title is a pure simulation API. |
| **Junior Explorers / Floating House** | `src/features/primary/activities/floatingHouse.js` and shared primary investigation engine. | A physical buoyancy/balance investigation and scaffolded observation patterns may inform an age-appropriate related project. | It describes a real hands-on raft experiment with counts/drawings and safety guidance, not a ready-to-run planetary physics engine. Source lists proposed standards references; those are not educator certification. Its primary-age framing should not be copied wholesale into a teen universe. |
| **PBL program/session content and toolkits** | `src/features/pbl/programs/libraryProgramsData.js`, program/session modules and `tools/index.js`. The inspected toolkit registry references entrepreneurship tools. | Authored projects, session sequence, evidence criteria and contextual tools can inform future mission definitions. | Program outlines are not proof that every described simulation exists. Resolve each proposed tool to an actual implementation and tests. Keep session/goal completion separate from verified achievement; do not assume catalog competencies certify a learner. |

## Existing test evidence to inspect later

Model tests exist for Solar Car, SO₂, filter behavior, Hex-Grid and Plant Lab under `tests/`. The prior application test runs do not establish that these modules are compatible with a 3D host, approved for new planet conditions or currently secure in production. No tests or builds were rerun for this inventory.

## Proposed future embedding boundary — not implemented

A later approved host may supply a versioned scenario, explicit physical/model parameters, locale/accessibility settings and a scoped learner/project reference. A module may return clearly labeled observations, hypotheses, model outputs and evidence references. Lifecycle operations would need cancellation, cleanup and resume semantics.

The host should not depend on a module querying global DOM IDs or awarding progression through browser flags. Module evidence and simulated outcomes remain inputs to a separate reviewed learning process. Gemini must assess existing persistence, authorization and any transactional/economic effects before contracts are connected. Claude must distinguish an integrated investigation/workstation from a decorative scene prop.

No such host contract, adapter, environment event, schedule or migration is built by this document.

## Weekly missions and environmental events — scope boundary

The future universe can present new reviewed missions and events over time. Each should identify its content/scenario version, intended competency/scaffold route and any scientific/model assumptions. Existing Hex-Grid, for example, must not be relabeled a dynamic storm simulator merely because an ocean planet has a storm event.

The product direction does not authorize a scheduler, live world changes, automatic mission publishing or required weekly attendance. Difficulty adaptation requires demonstrated progress/competency and educator-governed supports; student age alone cannot establish readiness or mastery. Neither real-world nor simulated environmental events may implicitly award entitlements.

## Handoff questions

**Claude:** which environments/workstations could make these modules meaningful parts of a planet? What must remain an observation/experiment interface rather than pretend to be embodied physics? What controls, return path and motion alternatives would keep the investigation usable on iPad/laptop?

**Gemini:** which data writes/claims/credit paths already exist, and which must remain independent? How could scenario versions, project evidence and learner state be scoped later without cloning records, weakening authorization or conflating simulation-credit spending with earned Universe access?

**GPT-6:** review the two agents' answers together only after their actual files are complete. This initial inventory is not their design/backend approval.
