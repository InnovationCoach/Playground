# My Universe — Opus 5.5 technical review of the G03 pilot mission packs

2 November 2026 · Reviewer: Opus 5.5 (`claude-opus-5-5`, Claude Code desktop session), frontend and 3D owner · Review only · Next owner: **GPT 6.1**

**Decision: one blocking correction (G-B1), then accept with the implementation obligations in §5.** The bundle is internally consistent, matches contract 0.1.1 in identity, part kinds, alternatives, bounds and policy, preserves every legacy step ID in order, and gets the numbers right. What it lacks is the authored **presentation content** the notebook needs: which step collects which part, the table and diagram templates, the guided-support material (worked solutions, starters, the worked example), and a label for "insufficient evidence". Without it O02 would have to invent assessment-shaping content, which the contract assigns to GPT. **O02 is not ready to start until G-B1 is resolved**; everything else can be handled in O02 as listed. This is a technical review. It confers no science, curriculum, exemplar or publication approval.

## 1. What was reviewed

| File (in `docs/implementation/`) | SHA-256 of file bytes | Notes |
|---|---|---|
| `universe-pilot/mission-bundle-0.2.0-draft.json` | `3724651a70bfc1f53e8e59cb293e84cbe8b096e6202dbbbbc81d19034532fef0` | **Review target.** `schemaVersion 1.0.0`, `authoringRevision 1`, `releaseId pilot-fixture-g03-20261102-v1`, `status draft`, `bundleContentSha256 f5252fbc…40b` |
| `universe-pilot/THALASSA-WIND-SURVEY-0.2.0-DRAFT.md` | `a49cd698…e1c` | Readable pack |
| `universe-pilot/SPACECRAFT-JOURNEY-0.2.0-DRAFT.md` | `dafc39b4…d0` | Readable pack |
| `MY-UNIVERSE-G03-HANDOFF-2026-11-02.md` | — | Handoff |
| `MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md` revision 0.1.1 | — | Accepted contract |

Embedded hashes: mission `thalassa-wind-survey` `ea551d22…f0a`, mission `spacecraft-journey` `43d61222…109`, datasets `thalassa-wind-week-02` `1801de66…b81`, `thalassa-plan-cards-02` `af85c6b3…aef`, `journey-constant-rate-02` `c1a31bbd…29d`, `journey-mass-power-case-02` `4a71aa19…0ff`.

**Checks I ran (Python, read-only, on the files above):**
- Recomputed all four dataset hashes, both mission content hashes and the bundle hash with the handoff's definition (sorted keys, compact separators, unescaped Unicode, own checksum field excluded). **All seven match.** The packs quote the same hashes.
- Recomputed every reference answer (§3). All match.
- Validated the three reference artifacts against their route's `requiredParts` and the contract 0.1.1 bounds (§4). All pass.
- Compared step IDs with the legacy source at `b35f8b2` and the Hex-Grid scenario at `b35f8b2` by `git show`.

**Not checked:** `universe-pilot/validation-report.json` is listed in the handoff but **is not in the folder**; the handoff says it is being checked separately. No app, test, build, API or device was run. No source was edited.

## 2. Conformance with contract 0.1.1

| Contract item | Bundle | Result |
|---|---|---|
| Identity on every route (§1, §9.4) | `releaseId`, `missionId`, `version 0.2.0-draft`, `routeId`, `taskId`, `policyVersion` | Pass |
| Route IDs kept, renamed for learners (§9.1) | `guided` "Wind energy estimate"; `guided` "Journey timing"; `advanced` "Mass and power tradeoffs" | Pass |
| Challenge, grade band, support separate (§2, §9.1) | `challengeLevel`, `gradeBand`, `supportModes [guided, independent]` per route | Pass |
| `requiredParts[].anyOfKinds` (§9.1) | Wind 6 parts; journey guided 4; advanced 5. Unique IDs per route | Pass |
| Accessible alternative for every non-text part | Every `table` and `diagram` also accepts `text`; `choice` carries a written reason | Pass |
| `artifact-reference` disabled | `artifactReferenceEnabled: false`; part kinds `text, table, choice, diagram` | Pass |
| Capabilities (§9.4) | `sceneKinds [ocean-station, basalt-fissures]`; no new scene kind | Pass. Bundle omits `workstationKinds`; the shared `capabilities.json` must carry it (§5, O9) |
| Policy (§1, §4) | `reviewed-only`, `grantIds []`, `productionSubmissionsAllowed false` | Pass |
| No night requirement (§9.7) | Wind limitations and rubric reject night/constant-reliability claims; implementation note bans `nightCoverage` | Pass for the bundle; Hex-Grid itself still needs O02 work (O6) |
| Numeric draft answers `rawText` 0–64 (§9.1) | Not a bundle field; applies to drafts | n/a — O02 obligation |
| Separate 69.4-day and 140-day ion cases (§9.7) | `journey-constant-rate-02` (12 km/s, 69.44 d) and `journey-mass-power-case-02` (`ionDays: 140`) with explicit limitation text | Pass |

## 3. Numbers, precision and answer formats

All reference answers recompute exactly:

| Step | Reference | `answerFormat` | Displays as |
|---|---|---|---|
| wind `hours` | 168 | 0 dp | 168 |
| wind `full-power` | 56.5 | 1 dp | 56.5 |
| wind `capacity-factor` | 0.33630952… | 2 dp | **0.34** (legacy `displayAnswer` would show 0.3 — confirmed) |
| journey `seconds` | 3,600,000 | 0 dp | 3,600,000 |
| journey `days` | 41.666… | 1 dp | 41.7 |
| journey `food` | 226.8 | 1 dp | 226.8 |
| advanced `chem-propellant` | 19,072.30… | nearest 10 | 19,070 |
| advanced `ion-propellant` | 1,840.76… | nearest 10 | 1,840 |
| advanced `supplies` | 1,558.2 | 1 dp | 1,558.2 |
| advanced `panels` | 256.000…06 | 0 dp | 256 |

Plan cards also recompute: at planning CF 0.34, one 1 MW turbine gives 8,160 kWh/day, so plan A = 8,160 + 6,000 solar = 14,160 and plan B = 16,320 kWh/day; at the CF 0.20 stress case A = 10,800 and B = 9,600, both below the 12,000 kWh/day demand. The raw CF gives 8,071.4 kWh/day per turbine; the bundle states that raw and planning CF differ and asks learners to say which they used. **Raw CF versus 0.34 is handled correctly in content**; the UI must show both where the weighted-results part asks for both (O3).

**Precision issue to settle (not blocking):** `answerCheck.mode: "reference-or-declared-rounded"` with `absoluteTolerance 1e-6` accepts only the full reference or the exact declared rounding. A learner who types 0.336, 41.67 or 19,072 — all correct and more precise — would get "Not yet". The legacy checker had Correct / Close (within 10%) / Not yet. Proposed semantics in O2; GPT owns the shared validator and should confirm.

The advanced exemplar's partial ledger (19,740.1 / 4,066.8 kg) uses unrounded propellant, while the steps ask for nearest-10 kg values (19,070 + 667.8 = 19,737.8). The rubric already asks learners to identify rounding; the coach view should show the declared rounding beside the reference so either is judged consistent (O3).

## 4. Reference artifacts

| Artifact | Parts and kinds | Bounds | Result |
|---|---|---|---|
| `thalassa-wind-survey-guided` | criteria text; weighted-results table (4×6); plan-comparison table (6×2); recommendation choice `plan-a`; data-quality text; limitations-next-measurement text | 2,375 bytes; reflection 231 chars; longest cell 36 chars | Satisfies all 6 required parts; no extras |
| `spacecraft-journey-guided` | criteria text; comparison table (5×3); route-plan **text**; recommendation text | 1,829 bytes | Satisfies all 4 |
| `spacecraft-journey-advanced` | criteria; comparison table (3×5); route-plan **text**; recommendation; earth-transfer | 2,433 bytes | Satisfies all 5 |

Idempotency keys are 37–39 safe ASCII characters (within 16–128). No artifact supplies learner, organization, role, score or grant fields. **No fixture exercises the `diagram` kind or a text alternative for a table part**, so B1's alternative path has no positive test fixture yet (O8).

## 5. Findings

### Blocking correction

**G-B1 — Authored presentation content for the notebook and support modes.** Add to each route (an `authoringRevision 2` of the same `0.2.0-draft` is enough, since nothing is reviewed yet):

1. **Step → part mapping.** Each step that produces evidence names the part(s) it fills, e.g. wind `evidence-check → data-quality`, `agree-criteria → criteria`, `hours/full-power/capacity-factor → weighted-results`, `use-it` + `stress-check → plan-comparison`, `reflect → recommendation` + `limitations-next-measurement`. Today all prompts are `kind: reflect` with no link to a part, and the legacy UI treats `reflect` as the submit step (`96684f9`), which must not happen in 0.2.0.
2. **Table templates.** Column headers with units, and which cells are pre-filled from the dataset versus entered by the learner, for wind `weighted-results` and `plan-comparison` (including the CF 0.20 columns) and journey `comparison` (both routes). Column choice shapes what the coach judges, so it is authored content, not a UI decision.
3. **Diagram template** for journey `route-plan`: the allowed node vocabulary (e.g. station, transit, delivery, scenario label) and edge types the learner selects from, within 12 nodes / 20 edges. Without it "diagram from selections" cannot exist and only the text alternative would ship.
4. **Guided-support content.** The packs promise "a worked example for one calculation", "unit labels, table starters and sentence/diagram-description starters" and, for Independent, "hints and worked solutions remain available". The bundle has **no `solution` on any numeric step** (legacy 0.1.0 had one on every step), no starters, no worked example, and ten of the twelve numeric/choice steps have zero or one hint (journey `seconds`, `days`, `food`, `ion-propellant`, `supplies`, `panels` have none). Without this, Guided and Independent would render identically and the support choice would be empty.
5. **Choice labels.** Wind `choiceOptions.recommendation` lists IDs only. Plan labels can come from the plan cards ("Mixed resource plan", "Two-turbine plan"), but `insufficient-evidence` needs an authored learner-facing label.

Owner: GPT 6.1. I can review a revision quickly; I will not author these strings myself.

### Implementation obligations for O02 (accepted, Opus owns unless noted)

- **O1 — Answer formatting.** Replace magnitude-based `displayAnswer()` with a formatter driven by `answerFormat` (`decimalPlaces`, `roundingMultiple`, `showGrouping`), using decimal-string rounding (half away from zero), not `toFixed` on binary floats. The legacy 0.1.0 view keeps its formatter only for read-only history.
- **O2 — Practice check semantics (needs GPT confirmation).** Proposed: *Correct* when the parsed input, rounded to the step's declared format, equals the reference rounded to that format, or is within `absoluteTolerance` of the full reference; *Close* within an authored relative band (proposed field `answerCheck.closeRelativeTolerance`, e.g. 0.02) with a rounding hint; otherwise *Not yet*. Parsing accepts grouping commas and trailing units as today. Every result keeps the "practice only, does not approve the mission" label. The same rule must live in the shared validator if any server code ever reuses it.
- **O3 — Precision display.** Weighted-results shows raw CF to at least 4 decimal places alongside the planning 0.34, and labels which one each plan calculation uses. Coach view shows declared rounding beside reference values.
- **O4 — Scenario separation in the journey.** Every given, table and result carries its scenario label ("Scenario G — constant-rate example", "Scenario A — separate mass/power case"). No value is carried between routes; switching route opens that route's own draft; the advanced route is shown to every learner as an optional choice with its own challenge and grade band, never gated or suggested by age.
- **O5 — Support switching** preserves all answers and part drafts; changing support never changes `taskId` or required parts.
- **O6 — Hex-Grid separation.** Plan cards are the assessed basis and work without the lab. The Thalassa Hex-Grid scenario at `b35f8b2` is `0.1.0-draft`, its brief still says "keep the lights on through the night", and its demand comes from 200 people on Earth (Thailand) data, not the cards' 12,000 kWh/day. In the pilot the lab link stays hidden from the assessed flow unless a reviewed `thalassa-station` scenario version without `night`/`all` exists. If shown, lab numbers are typed by the learner into a separately labelled "Lab result (scenario, version, inputs)" area, never merged with the plan cards and never read back from Hex-Grid as authority. The bundle should name the optional lab link and its scenario version when one is reviewed (GPT).
- **O7 — Criteria status.** `agree-criteria` asks solo learners to mark criteria "proposed". O02 offers this as a starter phrase inside the text part; no new field is added.
- **O8 — Fixtures for UI tests.** O02 needs one positive fixture using `diagram` for `route-plan` and one using `text` for a table part, plus negative ones (missing part, wrong kind, duplicate ID). Proposed for GPT's next fixture set; I will keep UI-test fixtures separate and clearly synthetic.
- **O9 — Capabilities.** The shared `capabilities.json` includes `workstationKinds: ["mission", "simulation"]` (absent from the bundle's compatibility block); O02 checks it against compiled renderers.
- **O10 — Memory-only cache by default.** As stated in the handoff and my §13 note: no permitted policy signal exists, so O02 keeps drafts in memory and labels them "not saved" until a server save succeeds. Previews create no persistent learner data.

### Accepted as authored

- Story and roles are concrete and fit existing places: the wind mission at the `weather-mast` workstation on Thalassa; the journey from "Missions here" on Thalassa and Ignis (`locationId: null`). No new scene kind or 3D asset is needed.
- Wind keeps the five core step IDs in their original order (`hours`, `full-power`, `capacity-factor`, `why-not-average`, `use-it`), preceded by `evidence-check` and `agree-criteria` and followed by `stress-check` and `reflect`. The cube-law choice is reworded to a general nonlinear-curve explanation, which suits the bounded synthetic curve.
- Journey keeps legacy step IDs and order on both routes (`compare`, `seconds`, `days`, `food`, `reflect`; `chem-propellant`, `ion-propellant`, `supplies`, `panels`, `reflect`).
- Both wind plans are feasible under the base case and fail the stress case, so there is no single "right" plan; "insufficient evidence" is a valid recommendation. This is playable as a real decision.
- Boreas gets no grant; outcome is review-only.
- Planning time of 45–60 minutes for nine wind steps and six parts is realistic for the notebook design in O01 §5.

## 6. O02 readiness

| Area | Ready? |
|---|---|
| Mission identity, routes, parts, bounds, policy | Yes |
| Numbers and answer formats | Yes, with O1–O3 |
| Scenario separation, Hex-Grid separation | Yes, with O4 and O6 |
| Notebook structure, guided support, diagram, choice labels | **No — G-B1** |
| Cache, capabilities, fixtures | Yes, with O8–O10 |
| Writer turn, implementation base, `shared/universe/` packaging proof | Not assigned / J02 — outside this review |

**O02 can start after G-B1 is resolved, an implementation base is chosen and a writer turn is assigned.** Science/curriculum review of the exemplars and task ratings remains with the named educator.

Changed in this pass: this file only.

---

## 7. Final targeted review of revision 2 — 2 November 2026

**Decision: ACCEPT** bundle `bundleContentSha256 974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7`, `authoringRevision 2`, release `pilot-fixture-g03-20261102-v2`. **G-B1 is closed.** The authoring content is ready for O02, subject to a refreshed implementation base, an assigned writer turn and J02's packaging proof. This is a technical acceptance only; named-educator approval of science, curriculum, exemplars and ratings is still pending.

**Reviewed (in `docs/implementation/universe-pilot/`):**

| File | SHA-256 of file bytes |
|---|---|
| `mission-bundle-0.2.0-draft.json` | `7885a55c262070a470bf035c83bcb7543165098a7228da632bd09822a8647a04` (canonical content hash above) |
| `THALASSA-WIND-SURVEY-0.2.0-DRAFT.md` | `808f4deb…f9b4` |
| `SPACECRAFT-JOURNEY-0.2.0-DRAFT.md` | `35a5d348…f945` |
| `validation-report.json` | `64144274…eaa` — reports 114 checks, 0 failed, bundle hash `974d7ad3…1a7` |
| `validate-authoring.py` | `f17613c3…e215` — read the report, did not run it |

Also read the updated `MY-UNIVERSE-G03-HANDOFF-2026-11-02.md`. Model: Opus 5.5 (`claude-opus-5-5`).

**Independent checks I ran (read-only):**
- Re-implemented `sorted-key-json-ecmascript-v1` in Node (`Object.keys().sort()`, `JSON.stringify` primitives, compact joins, UTF-8 SHA-256, own checksum excluded). **All seven hashes match**: bundle `974d7ad3…1a7`; missions `thalassa-wind-survey` `3e228462…e4d` and `spacecraft-journey` `155394d1…267`; datasets `1801de66…b81`, `ad3498ab…929`, `868c3cdf…de9`, `817d8410…624`. This confirms the hash encoding is reproducible in the frontend runtime.
- Walked every step and template in Python against the route's `requiredParts` and the five reference artifacts (results below).

### G-B1 items

| G-B1 item | Revision 2 | Result |
|---|---|---|
| 1 Step → part mapping | `evidencePartIds` on **every** step of all three routes; every required part is collected by at least one step and no step names an unknown part. `notebookBehavior` states that `reflect` never submits and that a separate "Review your work" screen holds the explicit send. | Closed |
| 2 Table templates | Wind `weighted-results` (4 columns, five band rows plus total and raw/planning CF rows) and `plan-comparison` (8 columns, base and CF 0.20 stress); journey guided `comparison` (7 columns, Scenario G) and advanced partial ledger (4 columns, Scenario A, "not total launch mass"). Given vs editable cells are explicit; given values match the datasets; each has a `textStarter` and serialization rule. | Closed |
| 3 Diagram templates | `route-plan` on both journey routes: four-node vocabulary, three edge types, initial nodes, `wireShape` (`id, label` / `fromId, toId, label`), 12/20 bounds, code-owned layout, required text description and a scenario-labelled caption. | Closed |
| 4 Guided-support content | Every numeric/choice step has a `solution` and at least two hints (all twelve); one `workedExample` per route (three), using analogous data for the journey; `sentenceStarters` for every text-only part and `textStarter`s on every table/diagram template, so every text-capable part has a starter; `supportPresentation` differs for Guided and Independent. | Closed |
| 5 Choice labels | Wind `choiceLabels.recommendation`: Plan A, Plan B and "I need more evidence before choosing a plan". | Closed |

### Earlier obligations

| Obligation | Status in revision 2 |
|---|---|
| O2 practice check | Adopted exactly: `declared-rounding-equivalent`, `closeRelativeTolerance 0.02`, `decimal-half-away-from-zero`, semantics written into each check. Spot-checked: 0.336 and 0.34 → correct; 0.33 → close (≈1.9%); 0.3 → not yet; 41.67 → correct; 19,072 at nearest 10 → correct. **Resolved in content**; O02 implements it in the shared adapter. |
| O3 precision | Weighted-results template has a "CF raw / planning" row; consistent rounded ledgers allowed with a label. Resolved in content; O02 renders it. |
| O6 Hex-Grid | `optionalLab` on the wind mission: `reviewedScenarioVersion: null`, `enabledInAssessedFlow: false`, reason stated. Resolved; O02 hides the link. |
| O8 fixtures | Five positive artifacts with five distinct idempotency keys (37–45 characters), all satisfying their route's required parts exactly. They include **`weighted-results` as text** and **`route-plan` as diagram**; every diagram node and edge is inside the template vocabulary, with a 207-character description. Negative fixtures are still for the shared-validator / J02 tests. |
| O9 capabilities | `workstationKinds: ["mission", "simulation"]` now in `compatibility`. Resolved. |
| O1, O4, O5, O7, O10 | Frontend implementation obligations, unchanged and still mine in O02. |

### Notes for O02 (not blockers)

- **Percent input.** The capacity-factor hint says "0.34 is 34%". O02's parser should either accept "34%" as 0.34 or explain that a decimal is wanted, never mark it "not yet" without saying why. That is a UI parsing choice, not content.
- **Diagram scope.** The route diagram is a short ordered concept (station → transit → delivery, plus a scenario label). It is accessible and correct; the reasoning sits in the required description, which the coach should read first.
- **Numbers in my earlier §3–§4** refer to revision 1; revision 2's hashes and fixture set supersede them. The arithmetic is unchanged.

**O02 readiness:** authoring is **ready**. Still outside this review: a refreshed implementation base (G01 is historical), the assigned O02 writer turn, J02's proof that `shared/universe/` resolves in Vite, Vitest and the Functions bundle, the cache-policy signal (memory-only until then), and the named educator's decisions.

Changed in this pass: this file only (§7 appended).
