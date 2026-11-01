# Next request for Gemini: My Universe backend (documentation only)

**Date:** 1 November 2026
**Prepared by:** Claude, for Mani
**Scope:** edit only `GEMINI BACKEND.md` in `/Users/admin/Desktop/HearIsland/output/my-universe/source`.
**Not allowed in this task:**
- changing code, rules, indexes or configuration
- deploying, or running scripts against production
- changing authentication or permissions
- creating branches

These are proposals for Mani to approve. Nothing is to be built yet.

**Context.** The Stage B 3D explorer spike is built and committed on `codex/my-universe-prototype`. Its data is the fixture at `src/features/universe/explore/cosmosFixture.js`, and its navigation and access rules are in `explorerModel.js`. On this Mac (Apple M5, Retina) it held 60 fps in every view; see `UNIVERSE.md` §13.9. The next stage (C) replaces the fixture with real catalog data, so your contracts need to fit what the explorer already uses.

## 1. Apply the 15 corrections first
Follow `docs/universe-handoffs/GEMINI CORRECTIONS.md`. In short:
- remove routes and rules that don't exist on `c855527`
- state that there is no `/api` rewrite
- mark the `universe-v1` limits as new rules still to be written
- retag the fictional planet facts as fictional
- fix the Hex-Grid identifiers
- label all numbers as proposed budgets, not measurements
- choose one name for the staging store

## 2. Match the catalog contract to the explorer's fixture
Compare your §2.1 catalog and planet-manifest JSON with `cosmosFixture.js`, field by field. The explorer reads:

| Record | Fields |
|---|---|
| Galaxy | `id, name, type, position, tilt, colors, summary, systems[], uncharted` |
| System | `id, galaxyId, name, starClass, starColor, summary, planets[]` |
| Planet | `id, systemId, name, kind, orbit, angle, radius, rings?, colors, summary, facts[], access ('public' \| 'gated'), requirementText?, environmentId` |
| Environment | `id, planetId, name, biome, summary, locations[]` |
| Location | `id, name, position, view, purpose, observations[]` |

Then:
- Propose the published JSON shape and say where it differs from the fixture and why. The fixture's `facts` are plain strings; propose how each one is tagged fictional-world or real-science.
- Say how versions are pinned: what an open session does when a new catalog version is published.

## 3. Server deployment path (proposal)
There is no `/api` rewrite and no defined target for the Express server on this line. Propose:
- where it runs (Cloud Run, Cloud Functions or another target)
- the Hosting rewrite it needs
- how the emulator setup mirrors it

List exactly which steps need Mani's written "go". This is a prerequisite for any access endpoint.

## 4. `users/{uid}/activityProgress/universe-v1` rules (proposal)
Write the exact proposed rule text (allowed keys, sizes, types, owner-only writes, coach read) and the emulator test cases. Don't change `firestore.rules`.

## 5. 3D asset hosting (proposal)
Propose:
- where `.glb` and texture files live (Hosting or Storage)
- cache headers and content-hash naming
- size budgets, labelled as proposed
- how the catalog references assets

Stage B uses only generated-in-code art. Stage C may add authored models.

## Not needed now
XP or reward ledgers, shared universes, AI generation, weekly events.

When finished:
- Add a dated note to §12 of `GEMINI BACKEND.md`.
- Confirm documentation-only changes.
- Report the saved path, then stop.
