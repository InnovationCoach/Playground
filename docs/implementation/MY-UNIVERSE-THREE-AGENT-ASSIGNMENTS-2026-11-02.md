# My Universe — assignments for GPT 6.1, Opus 5.5 and Gemini 4 Argon

2 November 2026 · Task allocation by GPT/Codex for Mani

**Execution update:** Mani selected Gemini 4 Argon in Antigravity after Gemini 5.8 was not available. All current Gemini assignments below use that actual model; the original GEMINI58 brief filename is retained for existing references.

**First deliverable completed:** G01 baseline verification, O01/J01 audits and G02 contract 0.1.1 technical agreement are complete. Actual Opus and Gemini sessions received their tasks and wrote their own final ACCEPT decisions. See the [baseline](MY-UNIVERSE-G01-BASELINE-2026-11-02.md), [contract](MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md) and [review record](MY-UNIVERSE-G02-REVIEW-2026-11-02.md). No implementation writer turn or production action was started.

**G03 authoring complete:** the [two complete mission packs](MY-UNIVERSE-G03-HANDOFF-2026-11-02.md) include three route/tasks, concrete support/notebook content, four labeled datasets, five candidate exemplars and 114 passing authoring checks. Both actual owners explicitly accepted revision 2, with zero remaining authoring blockers. Educator review and O02/J02 runtime implementation remain outstanding. A fresh isolated implementation base and coordinated writer turns are required before source changes; the handoff gives the next sequence.

**GPT 6.1 leads architecture, learning/content contracts and integration. Opus 5.5 owns the learner experience and 3D worlds. Gemini 4 Argon owns backend, permissions, persistence and publication operations.**

This allocation follows the existing project ownership and continuity of work. It is not a claim of comparative model benchmarks. No fourth AI agent is needed for the planned work. “Evidence scout,” “mission architect” and other roles in the development plan are responsibilities distributed among these three agents, not requests to create additional agents.

This document assigns work; it does not establish that the actual Opus/Gemini sessions have received it or started. Their names are the model/session targets requested by Mani. Do not substitute another model and label its output as theirs. No merge, deployment, live publication, permission change or scheduler activation is authorized by this allocation alone.

Read alongside the [next-phases plan](MY-UNIVERSE-NEXT-PHASES-2026-11-02.md) and [24-mission atlas](MY-UNIVERSE-MISSION-ATLAS-2026-11-02.md). Those documents define the product/content; this one defines who delivers each part.

## 1. The three owners

| Agent | Accountable for | Concrete output | Boundary |
|---|---|---|---|
| **GPT 6.1 — lead engineer and learning systems architect** | One correct base, architecture, shared data contracts, source/claim rules, mission scenarios, difficulty model, NGSS evidence mapping drafts, generator specifications, integration and final technical review. | Baseline report; versioned contracts; reviewable mission/evidence packs; generation prompts and pure validation logic; combined acceptance evidence. | Does not rewrite Gemini's backend/rules or Opus's scenes to resolve a disagreement. Sends the correction to the owner. Does not self-approve curriculum or releases. |
| **Opus 5.5 — experience and world-building lead** | Universe navigation, planet environments, mission interactions, learner-facing story presentation, field notebook, educator review interface, accessibility and device performance. | A coherent playable mission flow; reusable workstations; tested text/touch/keyboard equivalents; new biomes and screenshots/device evidence. | Implements the agreed learning and service contracts. Does not invent data, infer approval from clicks, change unlock policy or create server/rules changes. |
| **Gemini 4 Argon — backend and platform lead** | API contracts and services, identity/organization checks, submissions, coach review, access grants, learner-state rules, draft storage, evidence adapters, publication runtime and deployment preparation. | Emulator-tested services/rules; immutable release pipeline; retries/concurrency controls; operations and rollback evidence. | No curriculum self-approval, fabricated measurement or automatic live publication. Deployment/publication steps retain their explicit authorization gates. |

**Human responsibilities stay human:** the named educator reviews science, NGSS assessment evidence, scenarios and rubrics; Mani makes product decisions and authorizes the applicable merges, deployments, publications and cadence. These are not additional AI agents.

## 2. File ownership and coordination

Paths below are relative to the implementation checkout selected after baseline reconciliation. The older root checkout is not automatically that base. The existing Universe reference is `output/my-universe/source`; local refs and the report do not prove its revision is today's deployed release.

| Area | Sole writer | Coordination rule |
|---|---|---|
| `UNIVERSE.md`, integrated plan/decision log, new learning/evidence specification documents | GPT 6.1 | Record decisions and actual results; do not rewrite the other agents' authored handoffs. |
| `CLAUDE DESIGN.md`, `src/features/universe/**` frontend, relevant coach Universe UI, `public/cosmos/**` authored scene layouts | Opus 5.5 | GPT supplies mission/evidence patches and contracts. Opus integrates them without silently changing task IDs or versions. |
| `GEMINI BACKEND.md`, `server/**`, `functions/**`, `scripts/**`, rules, indexes, Firebase configuration | Gemini 4 Argon | GPT/Opus request changes through a contract or review note. Gemini owns server-side generation, validation integration and publishing code. |
| Proposed `shared/universe/**` pure schemas, reference checks, difficulty calculations and content validation | GPT 6.1 after the shared-module location is agreed | New proposed area, not existing code. No network, credentials, role decisions or publication side effects. Gemini owns any build/packaging scripts needed to consume it; Opus wires it into the frontend. |
| UI/scene tests, preview fixtures and device captures | Opus 5.5 | Use the existing test organization and clearly synthetic data. |
| API/rules/transaction/concurrency tests and backend fixtures | Gemini 4 Argon | Include wrong-organization, retry and version-policy cases. |
| New shared-contract tests and combined end-to-end acceptance scenarios | GPT 6.1 | Test meaningful boundary behavior; reuse each owner's tests rather than duplicating them. |
| Shared package manifests/lockfiles and build/test configuration | Gemini 4 Argon, after a coordinated request | Opus/GPT propose the smallest required change; no simultaneous dependency editing or unrequested upgrades. |

If a current file already has a more specific owner, respect it and record any reassignment before editing. A publication service produces staged immutable artifacts; it does not compete with Opus to hand-edit `public/cosmos` during a task. One reviewed source bundle must generate consistent frontend/server mission views.

Only one agent may write in the same checkout at a time. Read-only inspections can overlap. After the baseline is reconciled, the lead allocates approved task branches/checkouts for parallel implementation; otherwise use explicit writer turns. No new branch/worktree is created by this document. The lead integrates reviewed changes and asks an owner to resolve conflicts in that owner's files.

## 3. First assignments: begin with evidence

These three read-only tasks can happen in parallel. Each agent reports to its own handoff; serialize any writes in a shared checkout.

| ID | Owner | First task | Required handoff |
|---|---|---|---|
| **G01** | GPT 6.1 | Reconcile current remote branches/PRs, candidate source and deployed revision with the report. Identify already-integrated changes and the remaining dependency order. | Exact commits; source of deployment verification or “unverified”; integration sequence; owned-file map; existing approvals versus pending release steps. Preserve all unrelated root work. |
| **O01** | Opus 5.5 | Audit the actual learner flow and existing Thalassa/Ignis mission/workstation branches against the atlas. | Screen flow, reusable UI/scenes, missing interaction states, proposed two-mission storyboard, capabilities and measurements still missing. Preserve existing work rather than redesigning the shell. |
| **J01** | Gemini 4 Argon | Audit Go 3/Go 4 code, rules, packaging and Go 5 readiness on the identified lines. | Existing versus proposed behavior; submission race/version-policy issues; organization isolation; draft-store/deployment gaps; minimal service contract and emulator check plan. |

**First shared gate:** GPT resolves the baseline and conflicting contracts with the two owners. The resulting reviewed task scope determines what can be implemented under the existing authorizations; this allocation is not a blanket implementation or production “go.” No code starts from the old local root by assumption.

## 4. First playable expedition

The first deliverable is two missions using existing worlds: `thalassa-wind-survey` and `spacecraft-journey`. A learner can investigate, save/recover work, submit, receive revision feedback, resubmit and receive an authorized outcome.

| ID | Owner | Work package | Depends on | Done when |
|---|---|---|---|---|
| **G02** | GPT 6.1 | Define shared mission/evidence/release contracts, task versions, challenge demand, support variants, completion outcomes and source/claim rules. Propose Boreas's corrected access policy for human decision. | G01, O01, J01 | Both implementers review the same contract; examples include success, revision, unavailable service, stale version and withdrawal. An undecided policy stays explicit. |
| **G03** | GPT 6.1 | Prepare complete authoring packs for the two missions: actual draft inspection, sources, synthetic-data labels, calculations, scenarios, artifacts, rubrics/exemplars and NGSS support notes. | G02 | Educator can review the actual tasks and artifacts. Preserve original wind draft `0.1.0-draft` and its capacity-factor sequence; substantive additions have a new version. No hourly/night reliability claim from the daily model. |
| **O02** | Opus 5.5 | Build mission presentation and interaction: briefing, evidence drawer, steps, support choice, notebook, submit/revise and coach feedback, including non-3D equivalents. | G02 and reviewed pilot content from G03 | Both missions are usable in the existing SPARK shell; loading/empty/error/retry/withdrawn states are truthful; local clicks never imply approval. |
| **J02** | Gemini 4 Argon | Implement/finish versioned submission, persistence/recovery, scoped coach review, restricted learner-state rules and server-owned outcome/access behavior. Correct duplicate-open-submission races and version/policy checks. | G02 and the applicable implementation/rules scope | Emulator tests prove organization isolation, owner boundaries, atomic retries, revision history, approval authority and stable task/policy binding. No client-writable entitlement. |
| **O03** | Opus 5.5 | Verify desktop, touch, keyboard, reduced motion and complete text mode; measure the agreed device, scene load/memory and interaction performance. | O02, J02 integration | Captures and fresh measured results name the actual device/browser; untested iPad/assistive-tech cases remain explicit. |
| **G04** | GPT 6.1 | Integrate the pilot, reconcile failures through the owners and prepare the release review. | G03, O02, J02, O03 | Fresh relevant tests/build/emulator results; complete two-mission demonstration; educator decision; exact release diff; deployment/rollback plan. No unsupported claims of live readiness. |

G03 can proceed while Opus and Gemini implement agreed interfaces with synthetic fixtures. G03 content cannot be presented as educator-approved until that review actually occurs. Any permission or deployment change retains its specific gate.

## 5. Expansion work after the pilot

The order below follows the development plan. Work begins only after the previous phase gate and the applicable authorization; preparatory design can continue without pretending a blocked service exists.

| Phase / work package | GPT 6.1 | Opus 5.5 | Gemini 4 Argon | Exit gate |
|---|---|---|---|---|
| **Reviewed content pipeline** | **G05:** schema/claim/source validation rules, exact-diff expectations and stale-review/correction acceptance cases. | **O04:** educator review UI with evidence, changes, reasons, validation findings and publication status. | **J03:** server-only draft writes, editorial access, exact-hash approvals, immutable bundles, atomic publish pointer, audit and rollback runtime. | Editing/rebasing invalidates approval; rejected/stale drafts leave live intact; publication is retry-safe; severe withdrawal reaches pinned visits. |
| **Aurora / Verdantia pilot** | **G06:** finish the three Verdantia task packs, coherent progression, source evidence and challenge mapping; prepare educator review. | **O05:** first new ecological biome, field-station interactions and accessible equivalents; assemble the compatible catalog patch. | **J04:** compatible content/service delivery and versioned state support only where needed; avoid unnecessary backend expansion. | A representative pilot produces evidence and revisions; new renderer/schema capabilities are reviewed before the new catalog requires them. |
| **Manual evidence-to-draft generation** | **G07:** source-selection method, claim ledger, prompts, novelty/size decision and pure output validators; evaluate the proposed 20-draft sample. | **O06:** observation/evidence preview and readable candidate-world/mission diffs; unsupported renderers remain unavailable. | **J05:** one server-side evidence adapter, cached snapshots, bounded model calls, draft-only output, retries, quotas and logs. | Validated, traceable drafts; educator review of actual quality; no AI live writes; human authoring still works when the model fails. |
| **Private learner observation and recommendations** | **G08:** observation protocol, uncertainty, de-identification requirements and explainable recommendation rules; equivalent learning routes. | **O07:** field notebook, prepared-data alternative, understandable recommendation/revision UI. | **J06:** protected observation storage, metadata removal, current access checks, de-identified export for generation and artifact-permission preservation. | No private originals/precise coordinates sent to the generator; no self-unlocks; no peer messaging or automatic external citizen-science upload. |
| **Approved cadence and later worlds** | **G09:** editorial queue/novelty rules, quality monitoring, readiness review for Cryora/Solara/Lumen/Tessera and the proposed 14-day run. | **O08:** biome/workstation reuse, discovery notices, device budgets and later world interactions. | **J07:** scheduled drafting only after cadence approval; queue/spend caps, deduplication, stop controls and correction monitoring. | Zero unapproved publications; review capacity respected; measured rollback; source failures or no worthwhile evidence can yield no new draft. |

## 6. Mission ownership across all 24 cards

The mission atlas has **one learning/content owner: GPT 6.1**. Opus owns playable realization and narrative presentation; Gemini owns required data/runtime behavior. This keeps educational criteria consistent and avoids three independent versions of a mission.

| World / cards | GPT 6.1 prepares | Opus 5.5 implements | Gemini 4 Argon enables |
|---|---|---|---|
| Thalassa M01–M03 | Sensor criteria; wind/energy reasoning; city rubric and source limits. | Weather mast, diagrams/data interactions, city design workspace. | Save/submit/revise, model-input validation and policy-approved outcomes. |
| Ignis M04–M06 | Journey criteria; atom-conservation task; thermal testing evidence. | Journey planning, particle diagrams, thermal design interaction. | Versioned task payloads/submissions; reviewed calculation/model service only if required. |
| Boreas M07–M09 | Earth weather transfer, probe evidence, circulation model and policy proposal. | Orbital/probe workspace; no solid-surface landing. | Current access decisions and evidence/model delivery. |
| Verdantia M10–M12 | Sampling, ecosystem arguments, corridor criteria and Earth evidence. | Field station, observation map and corridor design. | Private records and versioned task data. |
| Cryora M13–M15 | Ice-image comparisons, fair thermal tests, water-cycle/base brief. | Image comparison, container/base design and later ice biome. | Snapshot delivery and persistence; no invented live climate service. |
| Solara M16–M18 | Shade criteria; energy units/model boundaries; resilient-plan evaluation. | Shade/design and energy workspaces using audited reusable activities. | POWER adapter when approved, cached data and bounded model inputs. |
| Lumen M19–M21 | Signal alternatives, digital-signal explanation, multi-source astronomy task. | Accessible light curves, signal demo and evidence exhibit. | Curated archive adapter, snapshot references and reproducible data. |
| Tessera M22–M24 | Material properties, resource-to-material evidence, circular-flow criteria. | Material investigation, lifecycle and repair/reuse design workspaces. | Task datasets, permitted artifact references and persistence. |

An owner can challenge a science or interaction assumption in another owner's work. The responsible writer makes the change, and the human educator makes the final curriculum/science decision. Do not add model calls or backend services to tasks that work well as deterministic local activities.

## 7. Reviews, handoffs and completion

- GPT reviews Opus changes against learning, contract and integration requirements. Gemini reviews frontend assumptions about access/version/security where relevant.
- GPT reviews Gemini changes against contracts and acceptance cases. Opus verifies that real service states can be represented accurately in the interface.
- Opus and Gemini review GPT's shared contracts for renderability, feasibility and enforceability. Educator review remains required for science/assessment claims.
- The author cannot mark their own work accepted solely because it compiles. GPT's integrated readiness report is a technical recommendation, not permission to merge, deploy or publish.

Every handoff records task ID, date, exact base/branch, files changed, what is implemented versus proposed, how to inspect it, fresh verification results, untested cases, blockers and the named next owner. A model that is unavailable leaves a clearly named queued task; another model does not impersonate it.

Each of the three agents uses its own authored status file. This assignment document and the work orders below are lead-authored instructions, not purported replies from Opus or Gemini.

## 8. Additional agents: exception only

Use these three agents for all planned work. Consider one additional specialist only if a concrete issue is better served by a distinct capability or qualification—for example, formal accessibility evaluation, specialist atmospheric chemistry review, or a required asset-production tool.

Before involving one, record the exact task, the demonstrated gap in the three-agent team, the expected improvement, the narrow input/data scope and the accepting primary owner. Extra capacity or a different model name alone is not a reason. An AI specialist cannot replace a qualified human science/curriculum reviewer. No additional agent has been launched for this allocation.

## Ready-to-use individual briefs

- [GPT 6.1 work order](MY-UNIVERSE-GPT61-WORK-ORDER-2026-11-02.md)
- [Opus 5.5 work order](MY-UNIVERSE-OPUS55-WORK-ORDER-2026-11-02.md)
- [Gemini 4 Argon work order](MY-UNIVERSE-GEMINI58-WORK-ORDER-2026-11-02.md)
