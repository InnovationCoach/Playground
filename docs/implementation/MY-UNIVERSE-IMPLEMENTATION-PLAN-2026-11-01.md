# My Universe — implementation plan

1 November 2026 · WeLearn SPARK · Product plan for Mani, Opus and Gemini

## Product promise

**Your learning opens possibilities. Your imagination decides what happens next.**

My Universe becomes a personal world learners can construct, inhabit and experiment with. Learners shape places, invent creatures and connect their real projects to their worlds. Verified learning achievements unlock additional creative choices. The world is enjoyable from the start, without waiting for an award.

All three experiences are in scope: **world-building, creature creation and responsive experiments**. We will deliver them together in a small playable release, then deepen them. Social visits, collaboration and model-assisted creation follow a reliable private-world foundation.

Planning only: this document does not authorize production changes, spending, changes to permissions or deployment.

## Verified starting point and project boundary

The inspected newer checkout is `/Users/admin/Desktop/HearIsland/output/course-discovery/source`, branch `feature/search-discovery`, commit `c855527` at inspection. It descends from the live-code release line described in the course-discovery handoff. That does not establish the currently deployed revision; Gemini must verify the release baseline before implementation or release.

Relevant existing files in that checkout:

- `src/features/dashboard/SparkUniverse.jsx`: atmosphere control, interests, self-marked personal milestones and inactive future-feature bays.
- `src/features/dashboard/MyDashboard.jsx`, `DashboardDeck.jsx`, `slideModel.js`: existing Universe slide and dashboard navigation.
- `docs/dashboard/xp-and-account-contract.md`: proposed server-authoritative learning events, permanent optional entitlements and essential tools remaining freely accessible.
- `docs/dashboard/slides-implementation-handover.md`: SPARK appearance, calm mode and explicit distinction between self-marked activity and verified achievement.
- `AGENTS.md`: Opus/frontend ownership versus Gemini's server/rules/indexes ownership, feature-branch workflow and exact release-authorization requirements.

Current inspected Universe is not a world editor, creature engine or reward system. Local Codex competency-pathway prototypes in the older root checkout are not established live services. Do not merge that old-design line or treat its records as production achievements. Assess and selectively adapt useful logic only through agreed contracts on the verified release line.

## Learner experience

1. **Arrive:** open the existing Universe slide. See the last saved world and one clear Build or Explore action.
2. **Create:** place landforms, buildings, plants, decorations and portals; customize atmosphere and soundtrack.
3. **Inhabit:** create a named creature, assign playful traits and watch supported behaviors.
4. **Experiment:** change a supported world variable and observe a visible response. Reset or undo freely.
5. **Connect:** attach an approved project artifact to a landmark or exhibition space.
6. **Grow:** when trusted learning progress grants a reward, choose an expansion and use it in the world.
7. **Share optionally:** later, invite a permitted visitor to a selected published snapshot. Private worlds remain a complete experience.

Keep these actions in My Universe. Learning Goals, Find a Quest and portfolio remain the authoritative learning-management areas; Universe can link to them without recreating their editors or marking achievement itself.

## Visual and interaction direction

**Preserve the live SPARK shell, colors, fonts, navigation, shared controls and Daylight/Night/Calm settings.** Opus inspects the authenticated current page before styling. No replacement platform theme or independent dashboard navigation.

Inside the scene, the learner may choose a cosmic garden, orbital workshop or neon settlement. These are world themes, not a platform-wide redesign. Avoid forcing a childish style; allow quiet, expressive, funny and ambitious worlds.

Four modes share one world:

| Mode | Main actions |
|---|---|
| Explore | Pan/zoom, select places, interact with creatures, open linked projects. |
| Build | Select an item, place, move, rotate, resize within limits, duplicate, remove and undo/redo. |
| Creatures | Assemble, name, color and assign supported traits/behaviors. |
| Experiment | Change supported variables, predict/observe, pause and reset. |

A compact inventory groups Place, Nature, Structures, Creatures, Effects and My Projects. Owned items and future unlocks are distinct. Locked items explain how they may be earned; learners can preview them without misleading ownership or purchase flows.

Desktop: large scene, compact toolbar and contextual inspector. Phone: large touch targets, bottom tool tray, tap-to-place and a full-width inspector when needed. Provide keyboard placement, move controls and a structured object list so dragging and free-camera interaction are optional. Scene movement must not conflict with dashboard slide navigation.

## The first playable universe

The first reviewable build should contain a small amount of each core system:

- **One world** with a floating island and an optional second area.
- **Three scene themes**, reusing the same scene model.
- **About 20 reusable placeable assets**, including landscape pieces, plants, structures and decorations. Final asset count follows art review.
- **One creature system** with modular body, face, accessory, color and movement choices. Start with a few combinations, not an open-ended character generator.
- **One playful experiment:** low gravity. Supported creatures bounce or float differently; loose decorative objects respond within explicit limits. Pause/reset and reduced-motion alternatives are included.
- **One project landmark** that can reference a learner-owned artifact without automatically publishing it.
- **One sample reward choice** in the isolated preview, then one real verified reward only after the backend gate passes.
- **Account-scoped save/reopen**, conflict handling and recovery. No fake saved state or preview data in real learner records.

Example: a learner builds a small moon garden, creates a mushroom astronaut, lowers gravity and watches it bounce between platforms. After an authorized coach confirms a qualifying milestone, the learner chooses a waterfall kit, a small moon or new creature parts. The chosen item is permanently available.

## Phases, ownership and exit gates

Estimates are active effort ranges for a coordinated frontend/backend team, not promised calendar dates. Refine them after the baseline and scene prototype. Do not sum them as a single developer's schedule; some work can overlap after contracts are agreed.

| Phase | Deliverable | Owner | Exit gate | Initial effort range |
|---|---|---|---|---|
| 0. Baseline and contracts | Inspect authenticated Universe; identify exact release line, persistence and trusted progress sources; agree scene and reward interfaces. | Opus + Gemini; Mani chooses reward policy | Actual screen captured; interfaces and responsibilities documented; no old-line assumptions. | 1–2 days |
| 1. Playable local slice | One scene, asset placement, one configurable creature and low-gravity experiment; SPARK-styled controls and labeled fictional records. | Opus | A teen can build, inhabit and experiment on desktop and phone; keyboard alternative and reset work. | 4–6 days |
| 2. Personal world persistence | Real private world save/load, owned inventory reads, revision/conflict handling, backup/recovery and error states. | Gemini backend; Opus integration | Reload and second-device resume work; wrong-account access denied; stale saves cannot overwrite silently. | 3–5 days |
| 3. Verified reward loop | One trusted learning-event adapter, immutable award ledger, reward choice, permanent entitlement and audit/review path. | Gemini; Opus reward UI; Mani/educator policy | Duplicate/concurrent events award once; learner ticks cannot grant rewards; choice survives retries; absent source means no fabricated award. | 3–5 days after source readiness |
| 4. Deeper creation and learning | More creature behaviors, day/night cycle and water/light experiments; project exhibitions and one optional scientific challenge. | Opus + educator; Gemini for required data | Experiments behave consistently; science claims have checked models; project visibility is explicit. | 4–7 days |
| 5. Optional shared worlds | Invite-only visits to snapshots, approved reactions, then a shared construction site with assigned edit zones. | Gemini permissions; Opus collaboration UI | Visitor/editor roles enforced; invite revocation works; private learning information stays private; conflicts tested. | 4–7 days |
| 6. AI-assisted creation | Constrained creature/world blueprints from descriptions, previews and explicit apply; usage limits and school configuration. | Gemini model service; Opus creation experience | Outputs validate against supported assets/behaviors; no arbitrary executable code; unavailable AI preserves manual creation. | 3–5 days after provider readiness |

**First pilot = phases 0–3**, with all three creative systems present from phase 1. Phase 1 can be reviewed while Gemini builds persistence/reward services. Real rewards stay off if the verified event source is not ready. The starter world remains usable.

Do not wait for a large 3D engine, complete competency migration or live AI generation to make the first experience playable. Do not release misleading reward claims to meet a date.

## Technical approach and scope

Use the existing React application. Start with a stylized **2.5D scene**: depth layers, original vector assets, bounded transforms and simple animation. Prototype whether SVG/DOM or Canvas gives the best editing/accessibility/performance balance. Use a separate accessible inspector and object list regardless of rendering choice. Full camera-driven 3D is a later measured decision.

Keep world state separate from rendering. One versioned scene model describes areas, placed assets, transforms, creature parts, supported behavior settings and experiment parameters. Save intentional scene changes, not every animation frame. Pin asset IDs/versions so later artwork updates do not break old worlds.

Proposed modules, adapted to the verified checkout's conventions:

```text
UniverseEntry → existing dashboard slide
UniverseEditor → build/explore modes and undo/redo
SceneRenderer → scene display and bounded simulation
AssetCatalog / Inventory → item definitions versus owned entitlements
CreatureBuilder / BehaviorEngine → parts and supported actions
ExperimentLab → controls, prediction/observation and reset
UniverseApi → account-scoped state, revisions and saved status
RewardInbox → available choice, claim and inventory refresh
ProjectLandmarks → permission-checked artifact references
```

Initial limits should be measured on a representative school phone: roughly 40 placed objects and 2 active creatures as a starting budget, with static/reduced-motion fallback. Set final caps from profiling rather than promising a frame rate on untested devices. Pause animation when the tab/slide is hidden. Keep scene sound opt-in and respect the existing sound player and volume preferences.

## Gemini backend contracts

These are conceptual contracts, not an approved database schema or existing endpoints. Gemini selects physical records, rules and indexes after verifying the live database edition, conventions and tenant/learner authorization.

| Contract | Required behavior |
|---|---|
| World state | Owner, world/version, asset references, bounded placements, creature definitions, settings, revision and timestamps. Scoped read/write; size/type limits and stale-save detection. |
| Asset catalog | Versioned school-approved definitions, themes, compatible slots, allowed behaviors and availability. Never accept arbitrary scripts or remote asset URLs as scene content. |
| Inventory | Server-owned entitlements separate from owner-editable world layout. Validate ownership again when saving a placed premium/unlocked asset. |
| Learning event | Trusted source ID, learner/school, milestone/version, verifier, evidence reference, policy version and timestamps. No browser-supplied award amount. |
| Reward grant and choice | Atomic unique award, available choices, one claim, persisted entitlement and retry-safe response. Replay of a milestone version cannot generate additional rewards unless policy explicitly allows it. |
| Corrections | Audited correction/review records. Normal learning-record corrections do not silently remove permanent creative ownership; abuse handling needs an explicit separate policy. |
| Project reference | Preserve the artifact's existing permissions. Private world reference is not permission to publish the project. |
| Sharing | Later: explicit snapshot, invited audience, visitor/editor scope, expiry/revocation and moderation/report path. No public-by-default links. |

The existing XP contract is the starting point. For the pilot, prefer **one qualifying verified milestone → one reward choice** rather than inventing an economy or arbitrary XP thresholds. This can evolve into verified XP later without rewriting item ownership.

Accept awards only from explicitly authorized coach approvals or verified provider records. Self-marked goals, session checkboxes, activity starts, clicks, timers, evidence upload alone, sample events and client-local completion never grant entitlements. Do not retrospectively convert legacy self-reported milestones into rewards.

## Creature and experiment design

Creatures begin as modular creations. Learners choose a name, palette, parts and a small number of supported traits such as curious, sleepy or energetic. Traits control understandable behaviors: wander, investigate a placed object, rest, follow a path or respond to light. No unrestricted chat or simulated dependency on the learner is required.

Later AI can suggest a validated blueprint: “sleepy mushroom astronaut with enormous boots” maps to supported body/accessory/palette/behavior IDs. The learner previews and edits it before adding it. Manual construction remains complete without AI. Cosmetic unlocks do not increase model access, privacy permissions or essential learning support.

Experiments use two explicit categories:

- **Play sandbox:** stylized low gravity, funny weather, creature preferences and visual transformations. Clearly playful; no claims of scientific prediction.
- **Learning simulation:** checked assumptions, units, bounded model and an educator-defined question. Example: comparing day length and light exposure for a simplified plant model, with its limitations explained.

Starter low-gravity experiment is a play sandbox. Later educational challenges can ask the learner to predict, observe and explain, with optional evidence submitted through the existing learning workflow. Simulation activity alone never establishes competency mastery.

## Rewards, agency and fairness

- Everyone starts with meaningful building, creature and experiment tools. Core learning, accessibility, basic appearance and calm settings remain available regardless of rewards.
- Learners choose between comparably appealing reward categories. Science achievements need not force a science aesthetic.
- Unlock creative breadth: new terrain, creature parts, sky effects or build tools. Avoid locking the ability to learn or create entirely behind performance.
- Earned ownership is permanent under normal use. No spending currency, random paid loot, expiration, public ranking, attendance penalty or streak pressure in this plan.
- Learners can hide reward prompts, pause animation and ignore social features. Nothing breaks when they are absent.
- Educators approve qualifying milestones and review fairness for different ages, accommodations, project lengths and opportunities to demonstrate progress. Award amounts and thresholds are unset until that review.

## Acceptance and testing

**Frontend/browser:** create a world, place/move/remove an asset, undo/redo, assemble a creature, run/pause/reset low gravity, change theme and return to Explore. Test touch and keyboard, 390 px phone and desktop, both platform themes, Calm/reduced motion, hidden-tab suspension and scene navigation inside the slide deck.

**Persistence:** save indication is truthful; retry does not duplicate objects; reload and another device resume; offline/interrupted edits have a recoverable draft; concurrent revisions show a readable conflict; account switching removes the previous world immediately. Validate migrations with an older scene fixture.

**Rewards:** coach/provider event qualifies; learner-forged event fails; wrong learner/school/verifier fails; unsigned/unsupported/sample event fails; duplicate and concurrent events award once; two simultaneous reward selections create one entitlement; reconnect/retry retrieves the existing grant; inaccessible source shows unavailable state rather than estimated progress.

**Sharing, later:** owner, invited visitor, allowed collaborator, revoked visitor and unrelated learner have different enforced access. Shared snapshots omit private goals, accommodations, messages and evidence unless separately authorized.

**AI, later:** malformed output, unknown assets, unsupported behaviors, instruction injection, unavailable provider and usage limits cannot bypass validation or lose the existing scene.

## Definition of first pilot done

A learner can sign in, enter the existing My Universe slide, build a small world, create a creature, run the starter experiment, leave and resume their saved world. A designated coach confirms one qualifying learning milestone; one reward choice arrives; the learner claims it once and uses the new asset. Another learner cannot read, change or award anything in that world. The experience works on a school phone, supports calm/keyboard use and preserves existing SPARK styling.

Use fictional records/emulators until the contracts and tests pass. Test the pilot with a small representative group and observe whether learners can create something personal without instructions, understand what earned a reward and recover from mistakes. Treat that observation as the next design input.

## Immediate work orders

**Opus:** inspect the authenticated Universe baseline; preserve the shell; build phase 1 in an isolated preview on the designated live-code descendant. Deliver desktop/phone captures of Build, Creatures and Experiment modes. Use clearly labeled sample entitlements, not invented live XP. Preserve existing personalization and audio behavior.

**Gemini:** verify baseline, database conventions and existing trusted learning sources. Propose the minimal private-world, inventory and reward contracts above; implement phase 2 and then phase 3 with emulator tests. Do not port the entire older workspace backend or change auth/permissions without the required authorization.

**Mani + educator:** choose the initial three scene themes, approve the first asset set and one fair qualifying milestone/reward-choice policy. These decisions can be reviewed against the playable prototype rather than blocking the first scene.

Release requires the exact reviewed commit, scoped tests, rollback references and Mani's written approval for that specific deployment under the project instructions. No approval is requested by this planning document.
