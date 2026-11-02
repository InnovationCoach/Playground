# My Universe — G03 complete pilot mission packs

2 November 2026 · GPT/Codex · Authoring drafts for technical and educator review

The two pilot missions now have complete learner briefs, inputs, calculations, decision tasks, exact artifact parts, support routes, rubrics, candidate exemplars and source/NGSS mappings. The canonical draft is one JSON bundle; the readable packs are generated from that same content. Nothing is activated in the learner app.

## Deliverables

| Artifact | Purpose |
|---|---|
| [Canonical mission bundle](universe-pilot/mission-bundle-0.2.0-draft.json) | Both missions, three route/tasks, four versioned authored datasets, 12 primary-source references, exact `requiredParts`, answer-format metadata and five synthetic candidate submission artifacts. |
| [Thalassa Wind Survey pack](universe-pilot/THALASSA-WIND-SURVEY-0.2.0-DRAFT.md) | Grades 6–8 / proposed challenge 2; preserve weighted wind calculations and add an explicit comparison, low-wind test, limits and recommendation. |
| [Journey to Ignis pack](universe-pilot/SPACECRAFT-JOURNEY-0.2.0-DRAFT.md) | Grades 6–8 timing task / proposed challenge 2 and optional grades 9–12 mass/power task / proposed challenge 4, with separate scenario assumptions. |
| [Authoring validation report](universe-pilot/validation-report.json) | Fresh checks of reference integrity, arithmetic, artifact bounds, hashes and preserved legacy inputs. Not an application/API test result. |

Contract: [accepted 0.1.1](MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md). Baseline: [G01](MY-UNIVERSE-G01-BASELINE-2026-11-02.md). New task content is **0.2.0-draft**, retaining the existing mission IDs and `guided`/`advanced` route IDs. Historical 0.1.0-draft remains in its source commits and is not changed or silently migrated.

## Fresh authoring checks

The reproducible [authoring checker](universe-pilot/validate-authoring.py) passes **114 checks** against bundle SHA-256 `974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7`, authoring revision **2**, release `pilot-fixture-g03-20261102-v2`. It recomputes the arithmetic independently, checks dataset/mission/bundle hashes and references, checks templates, support content and every exemplar's required parts/payload bounds, and reads the historical pure mission modules from commit `b35f8b2` to verify retained quantities and core step order. The five synthetic requests are 2,269 / 1,765 / 2,365 / 2,085 / 2,191 UTF-8 bytes, well within 64 KiB. Alternative fixtures use distinct idempotency keys.

These are authoring checks. No application/API, runtime validator, emulator, packaging build, device or assistive-technology check is claimed. The external primary sources were reviewed during authoring; the checker does not re-fetch their content. A repeat run writes a fresh validation timestamp and report without changing mission content.

## Important content decisions

1. **Exact wind parts are supplied.** `criteria`, `weighted-results`, `plan-comparison`, `recommendation`, `data-quality`, `limitations-next-measurement`. Text/table equivalents share reasoning criteria; recommendation permits either plan or “insufficient evidence.”
2. **Both energy plans are initially feasible.** At declared planning CF 0.34: A supplies 14,160 kWh/day, with 28 t installation mass and 900 m² deck use; B supplies 16,320 kWh/day, with 36 t and 600 m². Both meet synthetic demand 12,000 kWh/day and the 40 t / 1,000 m² constraints. A favors mass; B favors deck use/base energy margin. There is no universally preferred plan.
3. **Precision is visible.** Raw CF is approximately 0.3363095238; planning/lab CF is 0.34. The raw week's 56,500 kWh is not silently equated to a rounded 8,160 kWh/day estimate. The lower-wind CF 0.20 case tests a controlled assumption, not a weather prediction.
4. **The wind curve is explicitly synthetic and bounded.** The fifth band is 12–20 m/s in this dataset; no cut-out events or higher speeds are represented. Real electrical output is not an unlimited cube-law extrapolation. DOE sources support the power-curve limitation, not these fictional values.
5. **Journey assumptions are separated.** Guided constant-rate ion time is about 69.4 days. Advanced ion time is an independent 140-day input. Neither is a real trajectory prediction. The advanced propellant-plus-supplies ledger is explicitly partial and is not called total launch mass.
6. **No fake NGSS certification.** Both introductory tasks support MS-ETS1-2 through agreed criteria and systematic comparison; the advanced task supports selected HS-ETS1-3 work with real-engineering transfer. The packs explain what remains needed for a full performance-expectation assessment. No CCC is invented where the engineering PE foundation supplies none.
7. **Human review is still required.** Technical pack review does not make an exemplar educator-approved. All science/curriculum/publication records remain pending and the fixture policy allows no production submissions or new planet grants.

## Frontend handoff — Opus 5.5

Use the complete route/task metadata and exact artifact IDs. Keep support choice separate from route demand and grade band. Switching support retains answers; changing route uses the correct scenario/draft identity. Drawn/diagram alternatives must remain available as text descriptions or tables without an upload service.

**New formatting issue found:** the existing `missionModel.js` generic `displayAnswer()` rounds all values below 100 to one decimal place, so it would show capacity factor 0.34 as 0.3. The bundle declares `answerFormat` for each numeric step. Render the stated decimal places or nearest multiple, rather than magnitude-based rounding. Revision 2 adopts Opus's proposed practice semantics: `declared-rounding-equivalent` accepts an input whose declared rounding matches the reference's declared rounding, or whose error from the full reference is at most 0.000001. A nonmatching answer within 2% relative error gets a rounding hint. Decimal ties round away from zero. This accepts correct more-precise work such as 0.336 or 41.67; no local check approves the mission. These are authoring definitions for the forthcoming shared adapter, not a claim the old UI already supports them.

Plan cards are the assessed basis. The optional Hex-Grid link is explicitly **hidden** in this task until its old `night`/dependent `all` wording and differing inputs are separately corrected/reviewed/versioned; `reviewedScenarioVersion` is null. A future optional lab record must identify actual daily metrics and exact scenario/input and remain separate from these authored cards. No new scene kind is needed.

Cache policy remains unknown → memory-only until a permitted signal exists. Do not create persistent learner data from previews. Legacy exploration's no-storage behavior remains intact.

## Backend/shared-content handoff — Gemini 4 Argon and GPT

Use the same route/task/part definitions for server validation and frontend imports. GPT remains the owner of future pure shared validators/content; Gemini owns API/storage, packaging and configuration. Draft source lives under documentation until a valid integration checkout and writer turn are assigned. Do not copy runtime source into the old dirty root or repair broken saved worktrees by assumption.

Reference artifacts are synthetic positive-shape candidates, not proof of learner work or production eligibility. The server must still reject the entire fixture/draft in production. Validate exact identity, required parts/alternatives, authored choices and bounded payloads; references and client correctness flags never confer authority.

Hash encoding in revision 2 is **`sorted-key-json-ecmascript-v1`**: recursively sort object keys by ECMAScript UTF-16 ordering; preserve array order; encode keys and primitive values using ECMAScript `JSON.stringify`; join with compact separators; hash UTF-8 bytes with SHA-256, excluding only the object's own checksum field. Finite JSON values only. This fixes Python `.0`/exponent formatting differences now; ordinary Python `json.dumps` is not the hash algorithm. The checker uses Node's primitive encoding and a known integer/0.000001 vector. Runtime integration must preserve the declared hashes and verify them using the same algorithm; they are distinct from file-byte hashes. No educator signature is fabricated.

## Technical review request

Opus: check story/interaction feasibility, exact wind artifacts, accessibility equivalence, precision/answer-format handling and separation from actual Hex-Grid outputs. Gemini: check manifest/identity/data/part interoperability, calculation metadata and production rejection of fixtures. Both write their own G03 review responses; they do not edit the lead-authored bundle.

Their technical decisions will be recorded here. No O02/J02 source implementation or production operation is claimed by this handoff.

## Review corrections and current status

Both actual sessions reviewed revision 1: [Opus's review](MY-UNIVERSE-OPUS55-G03-REVIEW-2026-11-02.md) found one content blocker, G-B1; [Gemini's review](MY-UNIVERSE-GEMINI-G03-REVIEW-2026-11-02.md) accepted with cross-runtime hash normalization and number-display notes. Their original findings remain in their own files.

Revision 2 resolves G-B1 with step-to-part mappings, concrete table templates identifying given/learner cells, bounded journey diagram vocabulary, route-specific worked examples, all numeric/choice solutions and at least two hints, sentence starters, and a label for “I need more evidence.” It also supplies text-table and diagram positive fixtures, the workstation capability kinds, explicit support presentation, the hidden lab rule, readable grouped numbers and the revised precision semantics. Gemini's N1 is resolved by the explicit ECMAScript hash encoding above; N2 is resolved by declared-format rendering (3,600,000 s).

**Final technical decision: revision 2 accepted by both owners, zero remaining authoring blockers.** Opus's §7 explicitly closes G-B1 and accepts hash `974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7`; Gemini's §9 independently accepts the same hash and confirms N1/N2 resolved. Both independently recomputed all seven hashes in Node. Their own review files are the evidence; this lead record does not impersonate their decisions.

The frozen bundle retains its creation-time `technical: pending-owner-review` marker. The separate, exact-hash review records above carry the later technical decisions; do not mutate the accepted content merely to change that marker. Science/curriculum remain pending and publication remains unauthorized.

No substitute reviewer or additional agent was used. **G03 authoring is complete and technically ready for O02/J02.** Named educator review, actual implementation and fresh runtime/build/device evidence remain outstanding. Any implementation base must be refreshed before a writer turn; G01 is a historical baseline, not proof today's remote main or live site is unchanged.

## Next implementation handoff

1. GPT and Gemini refresh the remote/base evidence and prepare a valid isolated candidate, preserving the dirty root and the broken saved worktree folders. Reconcile the frontend/workstation conflicts through their owners; do not apply the packs directly to the old root runtime.
2. GPT supplies the pure shared content/schema/validators under the accepted `shared/universe/` location. Include exact-identity, artifact alternatives, number parsing/rounding and fixture-rejection boundary cases; source work is separate from the authoring checks above.
3. Gemini owns packaging proof and J02 save/submit/review services, rules and concurrency tests. Opus owns O02 mission/notebook/coach presentation and truthful service states, including memory-only defaults and the hidden lab link. Assign separate valid checkouts or serialized writer turns.
4. Integrate and run the actual two-mission revise/resubmit demonstration. Obtain named educator decisions before publishing the reviewed task version. Prepare the concrete release diff and verification evidence before requesting any release decision.
