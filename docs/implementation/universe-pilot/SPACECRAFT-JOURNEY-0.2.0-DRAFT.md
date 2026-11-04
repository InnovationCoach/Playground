# Plan a journey to Ignis — complete pilot authoring pack

2 November 2026 · `spacecraft-journey` · **0.2.0-draft / DRAFT**

**Not activated.** Science, curriculum, exemplars and task ratings await a named educator. All world/scenario data is authored fiction or a synthetic teaching set. Public sources support methods and real-engineering comparisons; they are not measurements of these worlds.

Canonical draft: [mission bundle](mission-bundle-0.2.0-draft.json). Content SHA-256: `155394d13e0b8a657dbb511d8dfa0fe2467f08f8ff709453b548dde40887d267`.

## Briefing

**Your role:** Expedition mission planner

The research station is preparing an instrument delivery to Ignis. You are comparing authored concepts, not operating a spacecraft. Each route has its own clearly labeled teaching case.

**Question:** How should a fictional crew deliver its instruments when time, supplies and propulsion choices pull in different directions?

**Your decision:** Recommend a concept under explicit priorities, or identify the missing evidence that prevents a responsible choice.

Work can be paused. Support choice does not affect review or access. A teacher may transcribe a spoken explanation into the same evidence fields. No new upload, public gallery, XP or planet grant is part of this pilot.

## Evidence you receive

### journey-constant-rate-02

Classification: **fictional-world** · version `0.2.0-draft` · dataset SHA-256 `868c3cdf7c3a6280187cd2a46c02ba81c197bf18f914fad3a2568784b44e9de9`.

**Scenario G — constant-rate teaching case.** Path 72,000,000 km; crew 3; fictional food allocation 1.8 kg/person/day; 86,400 s/day. Provision whole days by rounding up. Arrival ≤80 days and food ≤400 kg. Food values are fictional, not advice for people.

| Concept | Supplied average km/s | Calculated days | Provision days | Food kg | Within both limits |
| --- | --- | --- | --- | --- | --- |
| Chemical concept | 20 | 41.7 | 42 | 226.8 | Yes |
| Ion concept | 12 | 69.4 | 70 | 378.0 | Yes |
| Sail concept | 6 | 138.9 | 139 | 750.6 | No |

Chemical is fastest in this supplied case. Ion also meets both limits and has an authored lower-propellant-burden card; the guided dataset does not quantify propellant. Sail fails these timing/food limits. No general speed ranking of propulsion technologies follows.

### journey-mass-power-case-02

Classification: **fictional-world** · version `0.2.0-draft` · dataset SHA-256 `817d8410544306277c966ba10dcdbcb55b2c1d5f16e4456746e7c42cbb8d1624`.

**Scenario A — separate mass/power case.** Chemical 42 days and ion 140 days are independent case inputs. The guided 69.4-day ion result belongs to Scenario G and is not reused here.

| Input | Value |
| --- | --- |
| Dry mass excluding later supplies | 12,000 kg |
| Δv | 4,200 m/s |
| g₀, rounded for the exercise | 9.81 m/s² |
| Chemical / ion Isp | 450 / 3,000 s |
| Supplies / crew | 5.3 kg/person/day / 3 |
| Flux at Thalassa / distance ratio | 1,200 W/m² / 1.6 |
| Ion propulsion load / efficiency | 30,000 W / 0.25 |
| Represented constraints | ≤150 days; ≤21,000 kg partial added mass; ion panel area ≤260 m² |

**Reference methods:** m_prop = m_dry × [exp(Δv/(Isp × g₀)) − 1]; supplies = people × days × per-person daily assumption; flux at Ignis = 1,200/1.6²; panel area = 30,000/(flux × 0.25).

| Result | Reference value |
| --- | --- |
| Chemical propellant | 19072.300884 kg; nearest 10 kg = 19,070 |
| Ion propellant | 1840.764245 kg; nearest 10 kg = 1,840 |
| Chemical / ion supplies | 667.8 / 2226.0 kg |
| Extra ion supplies | 1558.2 kg |
| Flux / electrical output per m² | 468.75000 W/m² / 117.1875000 W/m² |
| Ion propulsion panels | 256 m² |
| Partial propellant + supplies ledger | 19740.1 kg chemical / 4066.8 kg ion |

The ledger is a represented comparison, not total launch mass: consumables were not included in the rocket-equation dry mass and hardware/power/life-support margins are omitted. A complete analysis could change the result. A 60-day arrival priority would rule out the supplied 140-day ion case; the base 150-day limit permits both represented concepts.

## Route: Journey timing

Stable route `guided` · task `journey-rates` · proposed challenge **2** · NGSS band **6-8** · suggested teaching time 45–60 minutes, with pauses allowed.

### Support choices

**Guided:** A worked example for one calculation; pause to complete the next row yourself. Unit labels, table starters and sentence/diagram-description starters. Use a calculator, large text, keyboard navigation or a spoken explanation transcribed into the same evidence fields. Show the worked example, notebook templates and sentence starters initially; hints reveal one at a time and solutions open on request.

**Independent:** Start with the full supplied record and choose a clear comparison method. Hints and worked solutions remain available without penalty. Switch support without losing answers; extra scaffolding is not a lower grade. Show full brief and evidence first; the same templates, worked example, starters, hints and solutions remain available on request. No marks or access depend on support/hint use.

**One rate conversion, then your turn**

- Use an analogous practice path, not the mission data: 8,640,000 km at 10 km/s.
- Time = 864,000 s; divide by 86,400 s/day to get 10 days.
- Now use the mission’s 72,000,000 km and chemical 20 km/s, then compare every option.

### Learner sequence

1. **Agree the mission priorities** (`agree-criteria`): Use the 80-day arrival limit and 400 kg food limit. With your coach, decide whether earliest arrival or the stated propellant-burden assumption deserves more attention. In solo mode label priorities proposed.
   Notebook parts: `criteria`.
2. **Compare the authored engine concepts** (`compare`): Which has the highest supplied average speed in this rate example?
   Hint: Compare the three supplied rate values. Greater speed over the same path gives less time in this constant-rate case.
   Notebook parts: `comparison`.
   Worked solution (reveal on request): Select chemical: 20 km/s exceeds the supplied 12 and 6 km/s. This is a ranking within Scenario G only.
   Options: chemical: Chemical concept / ion: Ion concept / sail: Sail concept. Practice key: chemical.
3. **Chemical travel time in seconds** (`seconds`): Use 72,000,000 km ÷ 20 km/s.
   Hint: Use time = distance / rate. Divide 72 million by 20; keep seconds as the resulting unit.
   Notebook parts: `comparison`.
   Worked solution (reveal on request): 72,000,000 km / (20 km/s) = 3,600,000 s. Kilometres cancel.
   Educator reference: 3,600,000 s. Full reference is in the bundle; use declared formatting, never the old magnitude-based display helper.
4. **Chemical travel time in days** (`days`): Convert 3,600,000 s using 86,400 s/day; show one decimal place.
   Hint: There are 24 × 60 × 60 seconds per day. Time for reporting and whole days for provisions have different rounding rules.
   Notebook parts: `comparison`.
   Worked solution (reveal on request): 3,600,000 s / (86,400 s/day) = 41.6666… days, displayed as 41.7 days. For provision days round upward to 42, not to the nearest whole day.
   Educator reference: 41.7 days. Full reference is in the bundle; use declared formatting, never the old magnitude-based display helper.
5. **Chemical food allocation** (`food`): Provision 42 days. Use 1.8 kg per person per day × 3 people × 42 days.
   Hint: Multiply the per-person daily input by people and provision days. Use 42 provision days rather than 41.7 travel days.
   Notebook parts: `comparison`.
   Worked solution (reveal on request): 1.8 kg/person/day × 3 people × 42 days = 226.8 kg. This is the fictional allocation, not real nutrition guidance.
   Educator reference: 226.8 kg. Full reference is in the bundle; use declared formatting, never the old magnitude-based display helper.
6. **Check every option** (`compare-options`): Complete the supplied comparison table for chemical, ion and sail. Round up provision days; check both limits. Treat the propellant cards as qualitative assumptions, not measured mass.
   Notebook parts: `comparison`.
7. **Explain the journey** (`route-plan`): Make a diagram from station → transit → instrument delivery, or describe the same ordered route in words. Label the scenario and assumptions.
   Notebook parts: `route-plan`.
8. **Your recommendation** (`reflect`): Recommend a feasible concept, or request missing evidence. Use calculated numbers, one tradeoff, one contingency and one model limit.
   Notebook parts: `recommendation`.

### Notebook templates and starters

Every step remains navigable; kind reflect never triggers submission. A separate Review your work screen lists every required part. Send for review is a separate explicit action requiring current service availability.

**comparison — Scenario G — authored constant-rate comparison**

| Concept | Speed km/s | Travel days | Provision days | Food kg | Meets arrival ≤80 d? | Meets food ≤400 kg? |
| --- | --- | --- | --- | --- | --- | --- |
| Chemical concept [given] | 20 [given] |  [learner] |  [learner] |  [learner] |  [learner] |  [learner] |
| Ion concept [given] | 12 [given] |  [learner] |  [learner] |  [learner] |  [learner] |  [learner] |
| Sail concept [given] | 6 [given] |  [learner] |  [learner] |  [learner] |  [learner] |  [learner] |

Scenario G: chemical __ days, provision __ days, food __ kg; ion __, __, __; sail __, __, __. For each, check ≤80 days and ≤400 kg. Our priority is __. Propellant burden here is qualitative, not measured mass.

**route-plan — Scenario G — constant-rate example — conceptual order, not a trajectory**

Node choices: station: Thalassa research station, transit: Authored transit concept, delivery: Ignis instrument delivery, scenario: Scenario G — constant-rate example.
Edges: station → transit (depart), transit → delivery (deliver), scenario → transit (case assumption).
Add the transit node and select the depart/deliver relationships; connect the scenario label. Explain the chosen concept and its assumptions in the required description.
Scenario G — constant-rate example: Thalassa station → __ transit concept → instrument delivery at Ignis. The supplied timing/rate assumptions are __. This is an ordered concept, not a modeled orbit.

- **criteria starter:** We agree / I propose arrival ≤80 days and food ≤400 kg. Our priority is __ because __.
- **recommendation starter:** Under our stated priority, I provisionally recommend __. The numbers are __. An alternative offers __. If __ changes, I would __. The simplified model cannot establish __.

**Practice feedback:** numeric answers are correct when rounding the input to the requested format gives the same result as rounding the reference (or full-reference error ≤0.000001). More precise correct answers are accepted. Otherwise a relative error ≤2% gets a rounding hint; other results invite another try. Decimal ties round away from zero. This never approves a mission.

Keep full precision for later calculations where possible. If you reuse rounded intermediate values, label this; a consistent rounded partial ledger is also reviewable.


### Exact artifact requirements

| Part ID | Accepted kinds | Evidence required |
| --- | --- | --- |
| criteria | text | State arrival/food limits and proposed/agreed priority. |
| comparison | table or text | Compare options, calculations, feasibility and any unquantified propellant claim. |
| route-plan | diagram or text | Show the ordered route and identify the constant-rate scenario. |
| recommendation | text | Recommend a concept or request evidence, with numbers, tradeoff, contingency and limitation. |

All IDs are unique and required. Alternatives have equal reasoning expectations. Reflection is 20–2,000 characters as a transport rule; do not grade word count. Keep the whole request below 64 KiB and at most eight parts. Text ≤2,000 characters per part; tables ≤8 columns/30 rows/200 characters per cell; diagrams ≤12 nodes/20 edges with a text equivalent.

### Coach rubric

| Dimension | Supported | Developing | Needs another look |
| --- | --- | --- | --- |
| Evidence and units | Rate/day/food steps are checkable; scenario labels and units are correct. | Reasoning is traceable but a conversion or label needs revision. | Results cannot be traced to supplied inputs. |
| Design reasoning | Competing options are checked against every agreed limit and the stated priority. | Only one option or some limits are considered. | The recommendation ignores a violated constraint. |
| Contingency and scope | Names a useful contingency and distinguishes simplified case assumptions from real flight evidence. | Names a limitation without a follow-up or contingency. | Treats the given speed as a universal engine property or the food value as a real recommendation. |
| Communication | Diagram/text and comparison clearly explain the decision to another reader/listener. | Some evidence is present but ordering/labels need work. | The artifact does not identify the decision or its evidence. |

These descriptors are feedback for this task. A coach records approved or returned with actionable feedback; there is no global learner ranking, automated mastery claim or penalty for support. Correct intermediate arithmetic alone does not satisfy the rubric. Do not penalize the same upstream calculation error repeatedly when later reasoning is consistent.

### Candidate NGSS evidence mapping

**MS-ETS1-2 / 6-8 — supports only, educator review pending.** Practice: Engaging in argument from evidence. DCI: ETS1.B — Developing Possible Solutions. No CCC is specified in this engineering PE foundation. The listed instructional lenses are additions, not invented required elements.

- Compare alternatives systematically against jointly agreed criteria.
- Identify assumptions and missing propellant/engineering evidence.
- Support a feasible conditional recommendation with calculated evidence.

A rate worksheet alone is practice; collaborative criteria and evaluation evidence remain necessary.

### Candidate acceptable artifact

The following is a draft exemplar for educator review, not a unique answer or an actual learner record. Alternative choices can be equally supported when criteria and evidence justify them.

**criteria** (text)

Use arrival at most 80 days and food at most 400 kg. Our agreed priority is earlier arrival; the qualitative propellant burden remains a tradeoff.

**comparison** (table)

| Concept | Travel days | Provision days | Food kg | Meets limits? |
| --- | --- | --- | --- | --- |
| Chemical | 41.7 | 42 | 226.8 | Yes |
| Ion | 69.4 | 70 | 378 | Yes |
| Sail | 138.9 | 139 | 750.6 | No |

**route-plan** (text)

Thalassa station → authored constant-rate transit → delivery at Ignis research site. The selected chemical concept uses 20 km/s over the supplied 72,000,000 km path; this diagram does not model orbital maneuvers.

**recommendation** (text)

I provisionally recommend the chemical concept for our earlier-arrival priority: about 41.7 days and 226.8 kg food. The ion option also fits both limits and has an assumed lower propellant burden. I would recheck propulsion/trajectory and reserve margins if the delivery date changed; these rate examples do not establish real mission safety.

### Revision and transfer prompts

- Which input or assumption most affects your conclusion?
- What observation could change your choice?
- Show one revision after feedback and explain why you changed it.
- Distinguish the scientific method from the fictional values in this case.

## Route: Mass and power tradeoffs

Stable route `advanced` · task `journey-mass-power` · proposed challenge **4** · NGSS band **9-12** · suggested teaching time 80–120 minutes, with pauses allowed.

### Support choices

**Guided:** A worked example for one calculation; pause to complete the next row yourself. Unit labels, table starters and sentence/diagram-description starters. Use a calculator, large text, keyboard navigation or a spoken explanation transcribed into the same evidence fields. Show the worked example, notebook templates and sentence starters initially; hints reveal one at a time and solutions open on request.

**Independent:** Start with the full supplied record and choose a clear comparison method. Hints and worked solutions remain available without penalty. Switch support without losing answers; extra scaffolding is not a lower grade. Show full brief and evidence first; the same templates, worked example, starters, hints and solutions remain available on request. No marks or access depend on support/hint use.

**One panel example, then your turn**

- Analogous practice case: flux 800 W/m² and efficiency 0.25 give 200 W/m² electrical output.
- A 10,000 W load needs 10,000/200 = 50 m² before omitted margins.
- Now use Scenario A’s distance-scaled flux and 30,000 W propulsion input.

### Learner sequence

1. **Prioritize the design criteria** (`agree-criteria`): For this separate case use arrival ≤150 days, represented added mass ≤21,000 kg and ion propulsion-panel area ≤260 m². Prioritize time, represented mass and unknown system risks; justify the priorities.
   Notebook parts: `criteria`.
2. **Chemical propellant** (`chem-propellant`): Use dry mass 12,000 kg and Δv = 4,200 m/s in m_prop = m_dry × (exp(Δv/(Isp × g0)) − 1), with Isp = 450 s and g0 = 9.81 m/s². Round to nearest 10 kg.
   Hint: First compute effective exhaust speed Isp × g0 in m/s. Use exp(x), subtract one, then multiply by 12,000 kg; do not multiply Δv by Isp.
   Notebook parts: `comparison`.
   Worked solution (reveal on request): 4200/(450×9.81) ≈ 0.951410. 12,000×[exp(4200/4414.5)−1] ≈ 19,072.300884 kg, or 19,070 kg to nearest 10. This deliberately incomplete model excludes the later supplies from dry mass.
   Educator reference: 19,070 kg. Full reference is in the bundle; use declared formatting, never the old magnitude-based display helper.
3. **Ion propellant** (`ion-propellant`): Repeat the same ideal model with Isp = 3,000 s. Round to nearest 10 kg.
   Hint: Change Isp to 3,000 s; keep dry mass and Δv the same. Apply the exponential before subtracting one and multiplying by dry mass.
   Notebook parts: `comparison`.
   Worked solution (reveal on request): 3000×9.81 = 29,430 m/s. 12,000×[exp(4200/29,430)−1] ≈ 1,840.764245 kg, or 1,840 kg to nearest 10.
   Educator reference: 1,840 kg. Full reference is in the bundle; use declared formatting, never the old magnitude-based display helper.
4. **Cost of the longer case** (`supplies`): Use 5.3 kg per person per day and three people for independently supplied durations 42 and 140 days. How much extra supply mass for the ion case?
   Hint: Calculate each case’s supplies separately. Subtract chemical supplies from ion supplies; use the independent 140-day input.
   Notebook parts: `comparison`.
   Worked solution (reveal on request): Chemical: 42×3×5.3 = 667.8 kg. Ion: 140×3×5.3 = 2,226 kg. Difference = 1,558.2 kg. These are Scenario A durations.
   Educator reference: 1,558.2 kg. Full reference is in the bundle; use declared formatting, never the old magnitude-based display helper.
5. **Solar array estimate near Ignis** (`panels`): Use flux 1,200/1.6² W/m² and 25% electrical efficiency. What area supplies the assumed 30,000 W propulsion load? Round to nearest m².
   Hint: Convert 30 kW to 30,000 W. Divide flux by distance ratio squared, multiply by efficiency, then divide needed power by W/m².
   Notebook parts: `comparison`.
   Worked solution (reveal on request): Flux = 1200/1.6² = 468.75 W/m²; electrical output = 468.75×0.25 = 117.1875 W/m². Area = 30,000/117.1875 = 256 m² for the assumed propulsion load only.
   Educator reference: 256 m². Full reference is in the bundle; use declared formatting, never the old magnitude-based display helper.
6. **Compare the represented designs** (`compare-solutions`): Add modeled propellant and supplies to form a partial ledger. Check time/mass/panel constraints. Do not call the sum total launch mass; common spacecraft loads/hardware are omitted.
   Notebook parts: `comparison`.
7. **Compare with real engineering** (`earth-transfer`): Read the NASA Dawn and solar-power references. Identify one relevant propulsion/power principle and one reason the fictional case cannot predict an actual crewed mission. Explain how cost, safety, reliability and stakeholder/environmental concerns would change the evidence needed; do not invent their numerical scores.
   Notebook parts: `earth-transfer`.
8. **Describe this case** (`route-plan`): Diagram or describe the advanced mission case and its separate 140-day ion assumption. Do not copy the guided 69.4-day rate result into this case.
   Notebook parts: `route-plan`.
9. **Make the case** (`reflect`): Give a provisional choice under your priorities, a numerical tradeoff, a missing-data condition that could reverse it, and an actionable next check.
   Notebook parts: `recommendation`.

### Notebook templates and starters

Every step remains navigable; kind reflect never triggers submission. A separate Review your work screen lists every required part. Send for review is a separate explicit action requiring current service availability.

**comparison — Scenario A — partial ledger, not total launch mass**

| Quantity and unit | Chemical | Ion | Limit or interpretation |
| --- | --- | --- | --- |
| Duration days [given] | 42 [given] | 140 [given] | ≤150 days [given] |
| Propellant kg, nearest 10 [given] |  [learner] |  [learner] | Ideal model; label precision [given] |
| Supplies kg [given] |  [learner] |  [learner] | Crew × days × 5.3 kg/person/day [given] |
| Partial propellant + supplies kg [given] |  [learner] |  [learner] | ≤21,000 kg; label rounding [given] |
| Ion propulsion panel m² [given] | Not specified; not zero [given] |  [learner] | Ion ≤260 m² [given] |
| Meets represented limits? [given] |  [learner] |  [learner] | Full system/safety remain unknown [given] |

Scenario A: chemical propellant __ kg, supplies __ kg, partial sum __ kg, time 42 days. Ion propellant __ kg, supplies __ kg, partial sum __ kg, time 140 days, panel __ m². I used full / rounded intermediate values. The constraints are __; missing system evidence is __.

**route-plan — Scenario A — separate mass/power case — conceptual order, not a trajectory**

Node choices: station: Thalassa research station, transit: Authored transit concept, delivery: Ignis instrument delivery, scenario: Scenario A — separate mass/power case.
Edges: station → transit (depart), transit → delivery (deliver), scenario → transit (case assumption).
Add the transit node and select the depart/deliver relationships; connect the scenario label. Explain the chosen concept and its assumptions in the required description.
Scenario A — separate mass/power case: Thalassa station → __ transit concept → instrument delivery at Ignis. The supplied timing/rate assumptions are __. This is an ordered concept, not a modeled orbit.

- **criteria starter:** I prioritize __, then __, because __. The represented limits are __; safety and complete system performance remain unresolved.
- **recommendation starter:** With those priorities I provisionally select __. The represented tradeoff is __. Evidence about __ could reverse this choice; next I would __.
- **earth-transfer starter:** The NASA reference explains __. It relates to this calculation through __. It does not validate __. A real decision also needs __ from __.

**Practice feedback:** numeric answers are correct when rounding the input to the requested format gives the same result as rounding the reference (or full-reference error ≤0.000001). More precise correct answers are accepted. Otherwise a relative error ≤2% gets a rounding hint; other results invite another try. Decimal ties round away from zero. This never approves a mission.

Keep full precision for later calculations where possible. If you reuse rounded intermediate values, label this; a consistent rounded partial ledger is also reviewable.


### Exact artifact requirements

| Part ID | Accepted kinds | Evidence required |
| --- | --- | --- |
| criteria | text | Prioritize criteria and state all represented constraints. |
| comparison | table or text | Propellant, supplies, partial mass ledger, time and panel calculations with units. |
| route-plan | diagram or text | Identify the separate advanced case and durations. |
| recommendation | text | Provisional choice, tradeoff, reversal condition and model limits. |
| earth-transfer | text | Connect identified NASA principles to missing actual engineering/stakeholder evidence. |

All IDs are unique and required. Alternatives have equal reasoning expectations. Reflection is 20–2,000 characters as a transport rule; do not grade word count. Keep the whole request below 64 KiB and at most eight parts. Text ≤2,000 characters per part; tables ≤8 columns/30 rows/200 characters per cell; diagrams ≤12 nodes/20 edges with a text equivalent.

### Coach rubric

| Dimension | Supported | Developing | Needs another look |
| --- | --- | --- | --- |
| Calculation and provenance | Rocket/supply/solar calculations are traceable; inputs are correctly labeled and limitations travel with results. | One method/unit/source relationship needs revision. | The artifact presents unsourced or incompatible calculations. |
| Prioritized evaluation | Checks all represented constraints and explains a conditional choice using explicit priorities. | Calculations are present but the priority/tradeoff reasoning is incomplete. | Claims one design is universally best from a single metric. |
| Real engineering transfer | Uses identified NASA principles and explains missing safety/reliability/cost/stakeholder evidence without fabricating it. | Makes a real-world connection but leaves its scope unclear. | Treats the fictional case as a validated real mission or claims momentum mastery from formula substitution. |
| Communication and revision | An accessible artifact states a reversal condition and useful next test/source. | Has a recommendation but no discriminating follow-up. | Cannot explain what evidence could change the choice. |

These descriptors are feedback for this task. A coach records approved or returned with actionable feedback; there is no global learner ranking, automated mastery claim or penalty for support. Correct intermediate arithmetic alone does not satisfy the rubric. Do not penalize the same upstream calculation error repeatedly when later reasoning is consistent.

### Candidate NGSS evidence mapping

**HS-ETS1-3 / 9-12 — supports only, educator review pending.** Practice: Constructing explanations and designing solutions. DCI: ETS1.B — Developing Possible Solutions. No CCC is specified in this engineering PE foundation. The listed instructional lenses are additions, not invented required elements.

- Prioritize criteria and evaluate represented constraints/tradeoffs.
- Connect the fictional model to real NASA engineering principles and identify missing stakeholder/safety/reliability evidence.
- Give a conditional judgment and a follow-up that could change it.

Supports only: the simplified fictional task and qualitative transfer do not establish the full complex real-world PE; no claim of HS-PS2-2 mastery or orbital validity.

### Candidate acceptable artifact

The following is a draft exemplar for educator review, not a unique answer or an actual learner record. Alternative choices can be equally supported when criteria and evidence justify them.

**criteria** (text)

Under this independent case, require arrival within 150 days, represented added mass at most 21,000 kg and ion propulsion panels at most 260 m². I prioritize represented mass, then time, while treating safety evidence as unresolved.

**comparison** (table)

| Quantity | Chemical | Ion |
| --- | --- | --- |
| Duration days | 42 | 140 |
| Propellant kg rounded to 10 | 19070 | 1840 |
| Supplies kg | 667.8 | 2226 |
| Partial ledger kg, full precision rounded | 19740.1 | 4066.8 |
| Propulsion panel area m² | Not specified; not zero | 256 |

**route-plan** (text)

Advanced mass/power case: Thalassa → authored transfer concept → Ignis. The ion duration is supplied independently as 140 days and is not computed from the guided route's 12 km/s.

**recommendation** (text)

Under the stated represented-mass priority, I provisionally favor ion: the partial ledger is about 4,066.8 kg versus 19,740.1 kg, and 256 m² meets the 260 m² propulsion-panel assumption. Chemical arrives 98 days earlier. A deadline below 140 days, insufficient actual power, or complete life-support/hardware analysis could reverse or prevent this choice.

**earth-transfer** (text)

NASA Dawn provides a real example of efficient low-thrust ion propulsion, and the JPL solar lesson connects array area with distance. Neither validates this fictional crewed case. I need actual trajectory/thrust, full power and mass budgets, redundancy and safety evidence, plus cost and stakeholder/environmental considerations before evaluating a real system.

### Revision and transfer prompts

- Which input or assumption most affects your conclusion?
- What observation could change your choice?
- Show one revision after feedback and explain why you changed it.
- Distinguish the scientific method from the fictional values in this case.

## Limits and implementation handoff

- Average speeds are authored rate examples, not outputs of propulsion simulation or actual trajectories.
- Food mass, crew and limits are fictional, not recommendations for people.
- A lower food mass does not prove a smaller complete spacecraft or a safer mission.
- Separate teaching case from the guided constant-rate scenario: the 140-day ion duration is an independent input, not the result of 12 km/s.
- Rocket-equation dry mass excludes the later consumables ledger; represented propellant plus supplies is a partial comparison, not a total launch-mass calculation.
- Panel hardware mass, life-support energy, thrust history, acceleration, trajectory, redundancy, radiation shielding and safety margins are not modeled.
- Constant stellar output, a single distance and idealized constant panel efficiency are assumed; no complete electrical-system adequacy claim.

- Keep legacy mission ID, guided/advanced route IDs and historical 0.1.0-draft. New 0.2.0-draft introduces explicit scenario separation and evidence tasks.
- The advanced route is a different task/demand, not merely independent support for the guided route.
- Replace displayAnswer threshold rounding with declared per-step answerFormat. Practice checks must distinguish rounded display from full reference precision.
- Neither route grants Boreas access; coach outcome is reviewed-only.
- The artifact is human-reviewed; no automatic competence, crew-safety or real flight approval.

## Sources and claim scope

- [NASA Glenn — Ideal rocket equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/): The ideal rocket equation relates velocity change, effective exhaust speed and mass ratio under stated simplifications.
- [NASA Glenn — Specific impulse](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/specific-impulse/): Specific impulse relates to effective exhaust velocity through the standard-gravity factor.
- [NASA — Dawn ion propulsion FAQ](https://science.nasa.gov/mission/dawn/faq/): Dawn illustrates efficient propellant use with low thrust, rather than a universal ranking of engine travel speeds.
- [NASA — Advanced Composite Solar Sail System](https://www.nasa.gov/smallspacecraft/what-is-acs3/): Sunlight pressure can provide sail propulsion without conventional rocket propellant for that propulsion function.
- [NASA JPL — Calculating solar power in space](https://www.jpl.nasa.gov/edu/resources/lesson-plan/calculating-solar-power-in-space/): Inverse-square distance scaling can support simplified solar-array calculations; real power systems need further engineering.
- [NGSS — MS-ETS1-2](https://www.nextgenscience.org/pe/ms-ets1-2-engineering-design): Systematic evaluation of competing designs, using agreed criteria; argument from evidence and ETS1.B.
- [NGSS — MS-ETS1-2 evidence statements](https://www.nextgenscience.org/sites/default/files/evidence_statement/black_white/MS-ETS1-2%20Evidence%20Statements%20June%202015%20asterisks.pdf): Identify designs/evidence, request missing evidence and compare every design against agreed criteria.
- [NGSS — HS-ETS1-3](https://www.nextgenscience.org/pe/hs-ets1-3-engineering-design): Evaluate complex real-world solutions with prioritized constraints and tradeoffs; formula substitution alone is insufficient.
- [NGSS — HS-ETS1-3 evidence statements](https://www.nextgenscience.org/evidence-statement/hs-ets1-3-evidence-statements): Reviewer reference for the high-school engineering assessment; this pack makes a supports-only claim.

## Educator decision record

| Item | Reviewer / decision / date |
| --- | --- |
| Scientific claims and source support | Pending |
| Scenario assumptions and route suitability | Pending |
| NGSS evidence mapping and limits | Pending |
| Artifact alternatives and rubric/exemplars | Pending |
| Approved learner-facing wording and published version | Pending |

Technical review of the pack does not replace this record. Both tasks remain drafts and production submission remains disabled.
