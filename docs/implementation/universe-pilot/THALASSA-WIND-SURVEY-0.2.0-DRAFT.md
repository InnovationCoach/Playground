# Is the wind worth it? — complete pilot authoring pack

2 November 2026 · `thalassa-wind-survey` · **0.2.0-draft / DRAFT**

**Not activated.** Science, curriculum, exemplars and task ratings await a named educator. All world/scenario data is authored fiction or a synthetic teaching set. Public sources support methods and real-engineering comparisons; they are not measurements of these worlds.

Canonical draft: [mission bundle](mission-bundle-0.2.0-draft.json). Content SHA-256: `3e228462adc93a8f8ef9dc7fb96525e4a1a64609ea634f2d59737c7a70224e4d`.

## Briefing

**Your role:** Station energy investigator

Two station teams propose different energy layouts. Both can meet the average-day requirement in the teaching case, but they use mass and deck space differently. You are asked to give an evidence-based provisional recommendation.

**Question:** What can this wind record tell us about a station energy plan, and what can it not tell us?

**Your decision:** Recommend plan-a, plan-b or further evidence using agreed criteria; revise after the lower-wind case.

Work can be paused. Support choice does not affect review or access. A teacher may transcribe a spoken explanation into the same evidence fields. No new upload, public gallery, XP or planet grant is part of this pilot.

## Evidence you receive

### thalassa-wind-week-02

Classification: **synthetic-teaching-set** · version `0.2.0-draft` · dataset SHA-256 `1801de66f2a89136553b32655d0f0cb350e8fca9ed7da56f01370b91b0831b81`.

| Wind band | Hours | Output fraction | Equivalent full-power h |
| --- | --- | --- | --- |
| 0 to below 3 m/s | 20 | 0 | 0 |
| 3 to below 6 m/s | 50 | 0.1 | 5 |
| 6 to below 9 m/s | 60 | 0.35 | 21 |
| 9 to below 12 m/s | 30 | 0.75 | 22.5 |
| 12 to 20 m/s in this teaching record | 8 | 1 | 8 |

The reference totals are 168 h, 56.5 full-power h and raw CF ≈0.3363095238. The final band is bounded to this dataset's 20 m/s maximum; historical 0.1.0-draft remains unchanged.

- All 168 authored hours belong to exactly one band; no sequence of hourly readings is available.
- The teaching record assumes no speed above 20 m/s; the final band is bounded to avoid implying output at arbitrarily high speeds.
- The five output fractions are a synthetic teaching curve, not a manufacturer curve or measured turbine performance.
- Sensor calibration, hub height, outages, losses and other seasons are not supplied. They cannot be assumed verified.

### thalassa-plan-cards-02

Classification: **synthetic-teaching-set** · version `0.2.0-draft` · dataset SHA-256 `ad3498abf12f6e3dfd307862d6b0b305562288c871401014076d404eda834929`.

**Planning rule:** round CF to **0.34** before comparing these cards, matching the current lab input step. Demand is **12,000 kWh/day**; installation mass ≤**40 t** and deck area ≤**1,000 m²**. All quantities are synthetic assumptions.

| Plan | Wind units (1 MW each) | Solar kWh/day | Mass t | Area m² |
| --- | --- | --- | --- | --- |
| Mixed resource plan | 1 | 6000 | 28 | 900 |
| Two-turbine plan | 2 | 0 | 36 | 600 |

Daily wind estimate = units × 1,000 kW × planning CF × 24 h/day. Card values are not exported Hex-Grid results.

| Plan | Supply kWh/day at .34 | Surplus kWh/day | Supply at .20 | Shortfall at .20 |
| --- | --- | --- | --- | --- |
| Mixed resource plan | 14160 | 2160 | 10800 | 1200 |
| Two-turbine plan | 16320 | 4320 | 9600 | 2400 |

Both base plans meet the represented constraints. A has lower installation mass; B uses less deck area and has a larger base daily energy margin. Neither is universally best. Under the .20 wind-only case both fall short; the learner should revise or request additional resources/evidence.

**Rounding note:** full raw CF gives 8,071.43 kWh/day per 1 MW; the declared planning input .34 gives 8,160 kWh/day. The exact synthetic week is 56,500 kWh. Do not silently mix precision or describe the rounded daily estimate as exact reconstruction of that week.

## Route: Wind energy estimate

Stable route `guided` · task `wind-capacity-factor` · proposed challenge **2** · NGSS band **6-8** · suggested teaching time 45–60 minutes, with pauses allowed.

### Support choices

**Guided:** A worked example for one calculation; pause to complete the next row yourself. Unit labels, table starters and sentence/diagram-description starters. Use a calculator, large text, keyboard navigation or a spoken explanation transcribed into the same evidence fields. Show the worked example, notebook templates and sentence starters initially; hints reveal one at a time and solutions open on request.

**Independent:** Start with the full supplied record and choose a clear comparison method. Hints and worked solutions remain available without penalty. Switch support without losing answers; extra scaffolding is not a lower grade. Show full brief and evidence first; the same templates, worked example, starters, hints and solutions remain available on request. No marks or access depend on support/hint use.

**One row, then your turn**

- The supplied 3–6 m/s band contains 50 h at output fraction 0.10.
- Multiply 50×0.10 = 5 equivalent full-power h.
- Now do the 6–9 m/s row: 60 h at fraction 0.35. Show your working before revealing the solution.

### Learner sequence

1. **Inspect the evidence** (`evidence-check`): What is authored, what is calculated, and what measurements are missing? Record one data-quality note.
   Notebook parts: `data-quality`.
2. **Agree what a good plan must do** (`agree-criteria`): Discuss the supplied constraints and choose which priority matters most: lower mass, less deck area or larger daily energy margin. Record the agreed criteria; in solo practice mark them proposed.
   Notebook parts: `criteria`.
3. **How long was the record?** (`hours`): Add the five hour counts. How many hours are represented?
   Hint: Sum all five bands, including the zero-output band. One authored week should total 7 × 24 hours.
   Notebook parts: `weighted-results`.
   Worked solution (reveal on request): 20 + 50 + 60 + 30 + 8 = 168 h.
   Educator reference: 168 h. Full reference is in the bundle; use declared formatting, never the old magnitude-based display helper.
4. **Equivalent full-power hours** (`full-power`): Multiply each band's hours by its fractional output, then add. How many equivalent full-power hours?
   Hint: Compute each hours × output product before adding. The zero-output 20 hours count in total time but add zero energy.
   Notebook parts: `weighted-results`.
   Worked solution (reveal on request): 20×0 + 50×0.10 + 60×0.35 + 30×0.75 + 8×1 = 0 + 5 + 21 + 22.5 + 8 = 56.5 full-power h.
   Educator reference: 56.5 h. Full reference is in the bundle; use declared formatting, never the old magnitude-based display helper.
5. **Capacity factor** (`capacity-factor`): Divide full-power hours by all hours. Give the ratio to two decimal places.
   Hint: Divide full-power hours by all hours, not just generating hours. The ratio is dimensionless; 0.34 is 34%, not 0.34%.
   Notebook parts: `weighted-results`.
   Worked solution (reveal on request): 56.5 h / 168 h = 0.3363095238…; to two decimal places use planning CF 0.34. The raw fraction and planning value have different precision.
   Educator reference: 0.34 dimensionless. Full reference is in the bundle; use declared formatting, never the old magnitude-based display helper.
6. **Why not average speed first?** (`why-not-average`): Why can averaging speed before applying this nonlinear output curve change the energy estimate?
   Hint: Compare the contribution of a low-output hour with a high-output hour. No exact average speed is supplied inside each band.
   Notebook parts: `limitations-next-measurement`.
   Worked solution (reveal on request): Select nonlinear. Weighted output uses each band’s output; applying a nonlinear curve to an average speed generally does not preserve that sum.
   Options: nonlinear: Different bands contribute different output; applying a nonlinear curve after averaging does not preserve the weighted result. / same: It always gives exactly the same result. / direction: Only wind direction matters, so speed can be ignored.. Practice key: nonlinear.
7. **Compare the daily plans** (`use-it`): Use planning CF = 0.34 in both authored plan cards. Compare daily supply, demand, mass and area. These cards are the assessment basis. The current optional lab is not linked into this task.
   Notebook parts: `plan-comparison`.
8. **Try a lower-wind case** (`stress-check`): Repeat the daily comparison with CF = 0.20 and the other assumptions unchanged. Does your recommendation change? This is an authored test, not a forecast.
   Notebook parts: `plan-comparison`.
9. **Make a provisional recommendation** (`reflect`): Choose a plan or explain why you need more evidence. State your criteria, one numerical comparison, one limit and one next observation.
   Notebook parts: `recommendation`, `limitations-next-measurement`.

### Notebook templates and starters

Every step remains navigable; kind reflect never triggers submission. A separate Review your work screen lists every required part. Send for review is a separate explicit action requiring current service availability.

**weighted-results — Synthetic week — show weighted output, then label raw and planning CF**

| Wind band | Hours h | Output fraction | Equivalent full-power h |
| --- | --- | --- | --- |
| 0 to below 3 m/s [given] | 20 [given] | 0 [given] |  [learner] |
| 3 to below 6 m/s [given] | 50 [given] | 0.1 [given] |  [learner] |
| 6 to below 9 m/s [given] | 60 [given] | 0.35 [given] |  [learner] |
| 9 to below 12 m/s [given] | 30 [given] | 0.75 [given] |  [learner] |
| 12 to 20 m/s in this teaching record [given] | 8 [given] | 1 [given] |  [learner] |
| Total [given] |  [learner] |  [learner] |  [learner] |
| CF raw / planning [given] |  [learner] |  [learner] |  [learner] |

For each band: hours × output fraction = __ full-power h. Total hours = __ h; full-power hours = __ h. Raw CF = __; planning CF rounded to two places = __.

**plan-comparison — Plan cards only — base CF 0.34; controlled stress CF 0.20**

| Plan | Base supply kWh/day | Base margin kWh/day | Mass t | Deck m² | Meets all base limits? | Stress supply kWh/day | Stress shortfall kWh/day |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mixed resource plan [given] |  [learner] |  [learner] | 28 [given] | 900 [given] |  [learner] |  [learner] |  [learner] |
| Two-turbine plan [given] |  [learner] |  [learner] | 36 [given] | 600 [given] |  [learner] |  [learner] |  [learner] |

At planning CF 0.34, plan A gives __ kWh/day and plan B __. Demand is 12,000 kWh/day, mass limit 40 t and deck limit 1,000 m². At CF 0.20 A gives __ and B __; shortfalls are __ and __. My criterion-by-criterion judgment is __.

- **criteria starter:** Our agreed criteria are __. In solo practice these are my proposed criteria. The fixed limits are __; I prioritize __ because __.
- **recommendation starter:** I provisionally choose __ / need evidence about __. Compared with the alternative, __. After the lower-wind test, __.
- **data-quality starter:** This record is __, the curve is __, and we do not have observations of __.
- **limitations-next-measurement starter:** A daily total cannot tell us __. I would collect __ over __, because it could distinguish __.

- **recommendation labels:** plan-a: Plan A — mixed wind and solar / plan-b: Plan B — two wind turbines / insufficient-evidence: I need more evidence before choosing a plan

**Practice feedback:** numeric answers are correct when rounding the input to the requested format gives the same result as rounding the reference (or full-reference error ≤0.000001). More precise correct answers are accepted. Otherwise a relative error ≤2% gets a rounding hint; other results invite another try. Decimal ties round away from zero. This never approves a mission.

Keep full precision for later calculations where possible. If you reuse rounded intermediate values, label this; a consistent rounded partial ledger is also reviewable.


### Exact artifact requirements

| Part ID | Accepted kinds | Evidence required |
| --- | --- | --- |
| criteria | text | State agreed/proposed constraints and priority. |
| weighted-results | table or text | Show all bands, total hours, weighted full-power hours and raw/rounded CF with units. |
| plan-comparison | table or text | Compare both plans against every constraint and report the lower-wind case. |
| recommendation | choice | Choose plan-a, plan-b or insufficient-evidence with a reason. |
| data-quality | text | Separate synthetic record, model assumption and missing observation. |
| limitations-next-measurement | text | Explain why daily energy does not prove hourly/night reliability and request a useful observation. |

All IDs are unique and required. Alternatives have equal reasoning expectations. Reflection is 20–2,000 characters as a transport rule; do not grade word count. Keep the whole request below 64 KiB and at most eight parts. Text ≤2,000 characters per part; tables ≤8 columns/30 rows/200 characters per cell; diagrams ≤12 nodes/20 edges with a text equivalent.

### Coach rubric

| Dimension | Supported | Developing | Needs another look |
| --- | --- | --- | --- |
| Evidence and calculation | Units/weighted method are traceable; any rounding is identified. | Method is visible but one quantity/rounding/unit needs correction. | A number is asserted without enough working to check it. |
| Systematic design comparison | Both plans are compared against agreed criteria; the choice reflects a stated priority. | Some criteria or one competing plan is missing. | Choice is based on appearance or one unexplained output. |
| Limits and revision | Explains the stress result, a model limit and a discriminating next observation. | Names a limit but does not connect it to the decision. | Claims constant/night-time reliability from a daily total. |
| Communication | An accessible table, explanation or diagram makes evidence and uncertainty understandable. | The reasoning is present but labels/order leave ambiguity. | The audience cannot tell which data or conclusion is being presented. |

These descriptors are feedback for this task. A coach records approved or returned with actionable feedback; there is no global learner ranking, automated mastery claim or penalty for support. Correct intermediate arithmetic alone does not satisfy the rubric. Do not penalize the same upstream calculation error repeatedly when later reasoning is consistent.

### Candidate NGSS evidence mapping

**MS-ETS1-2 / 6-8 — supports only, educator review pending.** Practice: Engaging in argument from evidence. DCI: ETS1.B — Developing Possible Solutions. No CCC is specified in this engineering PE foundation. The listed instructional lenses are additions, not invented required elements.

- Identify the two designs and the evidence each uses.
- Compare each plan against all agreed criteria; state a justified relative judgment.
- Request evidence about timing, losses and community/environmental impacts that the supplied model omits.

Arithmetic alone, solitary unagreed criteria and two energy totals do not establish full PE proficiency.

### Candidate acceptable artifact

The following is a draft exemplar for educator review, not a unique answer or an actual learner record. Alternative choices can be equally supported when criteria and evidence justify them.

**criteria** (text)

We agreed daily supply must reach 12,000 kWh, installation mass stay at or below 40 t, and area at or below 1,000 m². I prioritize lower mass, while recording the energy margin.

**weighted-results** (table)

| Wind band | Hours | Output fraction | Full-power h |
| --- | --- | --- | --- |
| 0 to below 3 m/s | 20 | 0 | 0 |
| 3 to below 6 m/s | 50 | 0.1 | 5 |
| 6 to below 9 m/s | 60 | 0.35 | 21 |
| 9 to below 12 m/s | 30 | 0.75 | 22.5 |
| 12 to 20 m/s in this teaching record | 8 | 1 | 8 |
| Total | 168 | CF raw ≈0.33631; planning 0.34 | 56.5 |

**plan-comparison** (table)

| Plan | Supply kWh/day | Surplus kWh/day | Mass t | Area m² | CF 0.20 supply |
| --- | --- | --- | --- | --- | --- |
| A | 14160 | 2160 | 28 | 900 | 10800 |
| B | 16320 | 4320 | 36 | 600 | 9600 |

**recommendation** (choice)

plan-a: Both satisfy the base teaching constraints; A uses 8 t less mass and has the smaller shortfall when only wind changes to CF 0.20. B has a larger base surplus and uses 300 m² less deck area, so a different priority could justify it.

**data-quality** (text)

This is a synthetic aggregated week and a synthetic curve, not measured turbine performance. The record has 168 authored hours but no time order or calibration evidence.

**limitations-next-measurement** (text)

Neither a weekly CF nor a daily total proves supply at night. I would request time-stamped generation and demand over representative periods, with site/turbine and outage information, before claiming reliability.

### Revision and transfer prompts

- Which input or assumption most affects your conclusion?
- What observation could change your choice?
- Show one revision after feedback and explain why you changed it.
- Distinguish the scientific method from the fictional values in this case.

## Limits and implementation handoff

- Every place and number is fictional or synthetic; external sources support methods only.
- Teaching band output fractions are not a real turbine power curve; high-speed shutdowns are not modeled.
- No hourly sequence, outages, storage dispatch or grid stability is represented.
- The worksheet raw CF and rounded lab CF produce different daily estimates; state which was used.

- Preserve original 0.1.0-draft and five core step IDs/order. New prelude/design evidence belongs to 0.2.0-draft.
- Render per-step answerFormat: the existing generic displayAnswer rounds 0.34 to 0.3 and must not be reused unchanged.
- Plan-card mass/area/solar assumptions are authored cards, not claimed Hex-Grid outputs.
- Use actual Hex-Grid daily supply/demand metrics if attached, with exact scenario version/input. Never require nightCoverage or old night/all badges.
- Artifact-reference is disabled; alternatives are text/table/choice in this pack.
- G03 r2 hides the optional Hex-Grid link from the assessed flow until a corrected scenario is reviewed. No current reviewed lab version is asserted.

## Sources and claim scope

- [EIA — Capacity factor glossary](https://www.eia.gov/tools/glossary/index.php?id=C): Capacity factor compares produced electrical energy with continuous rated output over the same interval.
- [DOE — How wind turbines work](https://www.energy.gov/cmei/systems/how-do-wind-turbines-work): Wind drives a rotor and generator; site conditions affect the resource.
- [DOE — Wind turbine power curve](https://www.energy.gov/cmei/wind/articles/how-do-wind-turbines-survive-severe-weather-and-storms): Electrical output has cut-in, rated and cut-out behavior; stronger wind does not mean indefinitely increasing output.
- [NGSS — MS-ETS1-2](https://www.nextgenscience.org/pe/ms-ets1-2-engineering-design): Systematic evaluation of competing designs, using agreed criteria; argument from evidence and ETS1.B.
- [NGSS — MS-ETS1-2 evidence statements](https://www.nextgenscience.org/sites/default/files/evidence_statement/black_white/MS-ETS1-2%20Evidence%20Statements%20June%202015%20asterisks.pdf): Identify designs/evidence, request missing evidence and compare every design against agreed criteria.

## Educator decision record

| Item | Reviewer / decision / date |
| --- | --- |
| Scientific claims and source support | Pending |
| Scenario assumptions and route suitability | Pending |
| NGSS evidence mapping and limits | Pending |
| Artifact alternatives and rubric/exemplars | Pending |
| Approved learner-facing wording and published version | Pending |

Technical review of the pack does not replace this record. Both tasks remain drafts and production submission remains disabled.
