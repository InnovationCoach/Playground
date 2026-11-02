# Opus 5.5 — learner experience and 3D worlds work order

2 November 2026 · Lead-authored brief for the actual Opus 5.5 session

Read [team assignments](MY-UNIVERSE-THREE-AGENT-ASSIGNMENTS-2026-11-02.md), [development plan](MY-UNIVERSE-NEXT-PHASES-2026-11-02.md), [mission atlas](MY-UNIVERSE-MISSION-ATLAS-2026-11-02.md), the applicable `AGENTS.md` and your existing Universe design/status handoffs. Respect the reconciled base and actual chat authorizations.

You own the learner experience, frontend interactions, 3D scenes, accessible alternatives and device evidence. GPT owns learning/shared contracts; Gemini owns backend, rules and scripts. Preserve the existing SPARK shell and working explorer rather than creating a competing product.

## Begin with O01

Inspect actual Universe navigation, the live-safe entry, existing mission UI and the Thalassa workstation branch. Compare them with the two-mission pilot. Deliver a storyboard, reusable components/capabilities, missing UI/service states and measurement gaps. Report what you inspected; do not claim a physical iPad or authenticated deployed screen was checked unless it was.

Coordinate with G01 before changing source. Canonical reference is `output/my-universe/source`, but GPT must establish the actual implementation base. Do not build from the older root checkout by assumption. Read-only work can overlap with the other agents; shared-folder writes must be serialized.

## Next responsibilities

1. **O02:** implement the agreed mission flow: briefing, driving question, expected artifact, evidence drawer, tasks, support choice, notebook, submit/revise and coach feedback. Represent loading, unavailable access service, draft, withdrawn, stale-version and retry states accurately.
2. **O03:** verify desktop/touch/keyboard, reduced motion and complete text mode. Measure agreed devices and record actual load/memory/frame behavior rather than inheriting the report's M5 numbers.
3. **O04:** build educator review screens showing the exact candidate diff, source claims, validation findings, approval/rejection reasons and release status from Gemini's service. UI cannot grant editorial authority itself.
4. **O05:** build Verdantia as the first new ecological biome after the pilot/review gates. Deliver meaningful field-station interactions and data equivalents; a planet sphere alone is not a mission environment.
5. **O06–O08:** implement discovery previews, field notebook/recommendations, later workstation/biome reuse and clear update/correction notices.

## Content and world constraints

- Preserve Lyra/Aurora and existing planet IDs. Boreas is an ice giant; use orbital/probe workspaces, not a solid ice landing. Cryora is a separate proposed rocky ice world.
- Preserve the original wind-survey capacity-factor sequence and `0.1.0-draft`. New evidence-quality tasks are a reviewed new version. Retain `spacecraft-journey` route IDs/version compatibility.
- Show challenge demand separately from support choice and grade band. Compute planet ranges from published/available tasks; hidden drafts do not count.
- Cosmetic weather, waves, lava/glow and gas are illustrative. Do not imply a reviewed simulation exists because an animation looks realistic.
- Make evidence, meaningful decisions and revision playable. Do not use checklist clicks as assessment. Essential actions work without free camera, sound, fine dragging or color alone.

## Definition of done and handoff

Deliver reviewable UI/scenes, captures, relevant tests, named device results and explicit untested cases. A learner can complete both pilot missions through 3D and accessible alternatives, submit to the real agreed service and understand feedback/outcomes. Synthetic preview records stay labeled and isolated.

Return service/rules changes to Gemini and contract/science questions to GPT/educator. Do not introduce dependencies by editing shared manifests concurrently; route the agreed change to Gemini. Update only your own authored handoff/status files, with task ID, exact base, files, fresh verification and next owner. This brief is an assignment, not a claim that you received/started it or a production authorization.
