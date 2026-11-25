# WeLearn SPARK — My Universe: The Learner's Playground

## 1. Refined Product Concept

**My Universe** evolves from a read-only deep-space viewer into an active **Learner's Playground** where every student owns, investigates, develops, and governs an exoplanet using credits earned from real SPARK learning goals.

### Core Loop
1. **Achieve Goals → Earn Universe Credits**: Completing STEM investigations, biosignature scans, PBL milestones, or mastery goals awards **Universe Credits (`Cr`)**.
2. **Explore 3 Galaxies, 6 Star Systems & 15 Exoplanets**: Learners navigate a multi-scale 3D cosmos (`Universe → Galaxy → Star System → Exoplanet → Surface`) containing:
   - **3 Galaxies**: `Lyra Spiral`, `Aurora Elliptical`, `Cygnus Vortex`
   - **6 Star Systems**: `Lyra Prime`, `Lyra Beacon`, `Aurora Core`, `Aurora Halo`, `Cygnus Alpha`, `Cygnus Beta`
   - **15 Exoplanets** (1:1 learner stewardship capacity for 14+ learners, all explorable in 3D and text view)
3. **Investigate & Discover Living Things**: Learners scan ocean swells, basalt fissures, and cryo-vents to catalog native organisms (*Bioluminescent Kelp*, *Hydrothermal Tube-Worms*, *Basalt Thermophile Mats*, *Cryo-Tardigrade Colonies*, etc.) and cultivate them into thriving ecosystems.
4. **Feature Forge (Spend Credits)**: Learners invest Credits to construct planetary features across 4 pillars:
   - **Habitat** (`Geodesic Biodome`, `Orbital Solar Array`, `Hydroponics & Algae Bay`)
   - **Biosphere** (`Atmosphere Oxygenator`, `Exo-Reef & Biome Nursery`, `Biosphere Terra-Seeder`)
   - **Science** (`Deep-Core Bioscanner`, `Xeno-Ecology Lab`)
   - **Defense** (`Ion Storm Deflector`, `Radiation Shield Grid`, `Automated Fire Suppression`)
5. **AI-Powered NPC Crew Governance**: Each exoplanet is staffed by 4 specialized AI NPC crew members (`Dr. Lyra Vance` — Xeno-Biologist, `Chief Kai Sato` — Habitat Engineer, `Aria-7` — AI Ecologist, `Lt. Soren Hale` — Safety Officer). Learners assign crew duties (`investigate`, `cultivate`, `build`, `shield`, `rest`), manage morale & stamina, and receive live AI Crew Briefings.
6. **Universe Creator & Weekly Hazard Engine**: Every week, the Universe Creator selects **3 random exoplanets** across the 15-planet universe and triggers a dynamic event—such as a **Cosmic Ion Storm**, **Research Lab Fire**, **Solar Radiation Hazard**, **Subsurface Cryo-Quake**, or **Uncontrolled Spore Bloom**. Built defense features mitigate damage, and learners govern their crew or spend emergency credits to resolve incidents.

---

## 2. Implemented Client & Catalog Modules

- `public/cosmos/v2/catalog.json` — Validated v2 cosmos catalog (3 galaxies, 6 star systems, 15 exoplanets, 15 surface environments).
- `src/features/universe/playground/playgroundModel.js` — Pure state & simulation engine for credits, planet claiming, species discovery/cultivation, feature forge, AI NPC crew governance, and the weekly 3-planet hazard engine.
- `src/features/universe/playground/PlaygroundPanel.jsx` — Interactive 4-tab drawer integrated into `MyUniverseExplorer.jsx` (`UniversePage.jsx` & `SparkUniverse.jsx`).

---

## 3. Backend Contract for Gemini (`server/` & Firestore)

Per repository ownership rules (`AGENTS.md`), server routes and Firestore rules belong to Gemini. When wiring persistent multi-learner state:

### Firestore Collections
- `orgs/{orgId}/universeWorlds/{planetId}`
  - `claimedByUid`, `habitability`, `biodiversity`, `shielding`, `research`
  - `discoveredSpecies[]`, `cultivatedSpecies[]`, `features[]`
  - `crew[]` (`{ id, role, task, morale, stamina }`)
  - `activeHazard` (`{ id, type, week, damage } | null`)
- `orgs/{orgId}/universeCredits/{uid}`
  - `balance` (integer, server-authoritative), `ledger[]` (`{ goalId, amount, grantedAt }`)
- `universeEvents/weekly/{weekNumber}`
  - `affectedPlanetIds` (length 3), `events[]`, `generatedAt`

### Proposed Endpoints
- `GET /api/universe/playground` — Returns learner's credit balance, claimed planet, and current weekly hazard bulletin.
- `POST /api/universe/playground/claim` — Claims an unclaimed exoplanet for the learner.
- `POST /api/universe/playground/build` — Atomically deducts credits and installs a `FEATURE_CATALOG` item.
- `POST /api/universe/playground/crew` — Updates NPC crew task assignments and returns AI-generated crew briefing (via Gemini).
- `POST /api/universe/playground/resolve-hazard` — Resolves an active storm/fire/radiation incident via crew dispatch or emergency credits.
