# First-contact curriculum and 3D ship — 5 November 2026

Scope: local first-contact practice adventure only, version 0.3.0-grade-banded. Existing published Universe notebooks and release manifests are not modified. No production deployment.

## Grade and age behaviour
School grades 6–12 are selectable. Grades 6–8 share a middle-school investigation route, 9–10 an applied high-school route, and 11–12 a high-school evaluation route. NGSS itself defines middle/high school bands, not these narrower product levels. Optional age 11–19 suggests a starting grade using age minus five (bounded to grades 6–12); this is a convenience, not a universal school placement rule or ability inference. The learner chooses actual grade. Age is not persisted or sent to AI.

Guided support displays scaffolds; independent support makes them optional; stretch opens design extensions. Supports do not lower a grade's target or reduce rewards. Grade changes occur at arrival or in the shop, not halfway through a scored attempt. Wallet and inventory are preserved, and a different grade cannot farm duplicate mission rewards. There is no inference of age from account data and no automatic mastery-based grade reassignment.

## Mission map
| Activity | Grades 6–8 | Grades 9–10 | Grades 11–12 | NGSS target |
|---|---|---|---|---|
| Receiver selection | Means, minimum mean requirement and budget | Per-trial reliability rather than mean alone | Worst-case requirement, cost priority and limits of three trials | MS-ETS1-2 / HS-ETS1-3 |
| Beacon reply | Explain digital threshold behaviour using pulses and a rule | Evaluate a question testing threshold drift | Evaluate error recovery against transmission overhead | MS-PS4-3 / HS-PS4-2 |
| Cargo plan | Required payload, mass and cost | Percentage reserve capacity | Upper mass estimate, budget and packaging impact | MS-ETS1-2 / HS-ETS1-3 |
| Workshop energy | Wh = W × h with budget | Delivery efficiency | Conservative power estimate and habitat trade-offs | MS-ETS1-2 / HS-ETS1-3 |
| Panel testing | Matched conditions and repeats | Area normalisation plus confounds | Calibration, randomisation, uncertainty and limits of conclusions | MS-ETS1-2 / HS-ETS1-3 |
| Additional practice | Energy-budget calculation | Include efficiency losses | Include uncertainty before efficiency | Supporting mathematics for MS-ETS1-2 / HS-ETS1-3 |

STEAM is embedded through signal/energy science, sensor/digital technology, engineering constraints, mathematical evidence, and visual communication/design notebook prompts. Arts prompts ask for labelled diagrams, accessible symbol systems and honest communication of uncertainty. The typed notebook is visit-only and ungraded. Ship assembly, shopping and scenic visits are narrative interactions, not stand-alone standards assessments.

## What the mapping does and does not establish
These are scaffolded activities supporting parts of performance expectations, not a complete NGSS course or proof of full performance-expectation mastery. Multiple-choice correctness alone does not assess an independent investigation or an original argument. The teacher-facing notes and learner panels state this limitation. Full assessment requires student-generated evidence, a reviewed rubric, educator judgement and a broader sequence. MS-PS4-3 does not require binary counting: the task classifies high/low pulses, not decimal-to-binary arithmetic. High-school beacon questions explicitly evaluate testable questions rather than only decoding a pattern.

All datasets are fictional and units/assumptions are explicit. Energy totals do not establish hourly/night reliability. Ranges are not treated as confidence intervals or significance tests.

## Primary standards references
- https://www.nextgenscience.org/pe/ms-ets1-2-engineering-design
- https://www.nextgenscience.org/pe/hs-ets1-3-engineering-design
- https://www.nextgenscience.org/pe/ms-ps4-3-waves-and-their-applications-technologies-information-transfer
- https://www.nextgenscience.org/pe/hs-ps4-2-waves-and-their-applications-technologies-information-transfer

## Gemini boundary
The local endpoint accepts only grade (integer 6–12). It generates a bounded dataset for the existing energy-design template, not arbitrary curricula. The application assigns NGSS IDs and computes answers independently; grade-specific efficiency/uncertainty rules reject mismatched output. Text remains an unreviewed draft, without currency or claims of mastery. No age, notebook or learner identity is sent. Credentials remain unconfigured, so no live provider response has been verified.

## 3D model
Original procedural Three.js model: pearl/violet ceramic-metal fuselage, shaped canopy, swept wings, twin engine pods, emissive exhaust, navigation array, optional solar wings and scanner. Components reflect fitted/owned state. One interactive workshop canvas plus a compact scene view; demand rendering, bounded pixel ratio, no external textures or model downloads. Pointer orbit, keyboard-accessible rotation/reset controls, static diagram fallback if WebGL is unavailable or a renderer fails. Models dispose their geometries/materials when replaced or unmounted.

Standalone inspection: /shipyard.html. Adventure: /first-contact.html. Item cards retain lightweight part diagrams; the assembled ship and workshop use real 3D geometry.

## Verification
162 tests across 18 files pass, including grade-specific datasets, rejection of mismatched generated difficulty, independently calculated energy answers, age suggestions, grade-change guards, grade-12 scoring, and fitted 3D geometry. Production build and whitespace checks pass; existing large-bundle warnings remain. Browser verification confirmed real WebGL rendering, rotation, solar/scanner upgrades, grade/support selectors, and grade-12 reliability criteria. Screenshot: ship-3d-preview.png. Full educator review, live Gemini testing, persistent progress and production rollout remain outstanding.
