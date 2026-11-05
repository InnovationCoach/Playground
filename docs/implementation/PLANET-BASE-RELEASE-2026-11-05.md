# My Universe planet-base release — 5 November 2026

## Release scope
Prepared in an isolated checkout from current remote main 6cc0e73, branch codex/universe-planet-bases. The prior NOAA expansion prototype commit 9252213 is not included. Parent working folders and unrelated user changes are preserved.

User authorization in chat: “after completeing deploy the chnages to My universe”, followed by “continue”. Deployment scope is Firebase Hosting only on dnd-master-73449. No functions, database data, rules, permissions, or accounts are changed. Main branch is not merged by this release.

## What changed
- My Universe dashboard entry opens a keyboard-accessible ship/base expedition dialog.
- Standalone /universe-expedition provides the same practice flow without account writes.
- Tidekeeper first contact, 3D modular ship, grade 6–12 content and optional age-based grade suggestions.
- Assemble → destination selection → three-step landing guide → surface survey → design plus evidence → blueprint unlock → visible installation.
- Nine base missions across Thalassa, Ignis and Nivalis. Nivalis is explicitly a fictional moon scenario; Boreas remains a gated ice giant in the existing explorer. Existing reviewed mission access is unchanged.
- Each destination has foundation, habitat and energy modules. Completion and installations are separate; the next mission requires installation of the previous module. Duplicate evidence submissions do not duplicate rewards.
- Science workbench varies star distance, planet mass/radius and reference moon distance independently, without changing assessed scenario data.
- Browser-only practice state is discarded when the expedition closes/reloads. No persistent wallet or validated course result is claimed.
- Local-only Gemini generation remains available to preview developers, hidden from the production interface until a deployed service is configured.

## Scientific model and limitations
Surface gravity scales as planet mass/radius²; incoming stellar irradiance as star luminosity/distance²; illustrative one-moon tidal forcing as moon mass/distance³ for fixed planet size. Atmosphere, reflectivity, internal heat, rotation and local observations matter separately. Neither distance nor moon count determines an ecosystem. Values for all three worlds are explicitly fictional. Models do not supply real construction or life-support specifications.

Primary references consulted:
- NASA, Newton’s Law of Gravitation: https://imagine.gsfc.nasa.gov/observatories/learning/swift/classroom/docs/law_grav_guide.pdf
- NASA, inverse square law of light: https://www.nasa.gov/stem-content/the-inverse-square-law-of-light/
- NOAA, causes of tides: https://oceanservice.noaa.gov/education/tutorial_tides/tides02_cause.html
- NASA, conditions for life: https://science.nasa.gov/astrobiology/learning-resources/alp/if-a-planet-can-have-life/

NGSS targets remain scaffolded MS-ETS1-2 / HS-ETS1-3 engineering practice, with existing beacon tasks targeting MS-PS4-3 / HS-PS4-2. The gravity sandbox alone is not claimed to demonstrate orbital-model performance expectations. See FIRST-CONTACT-CURRICULUM-2026-11-05.md for the earlier curriculum mapping.

## Validation
168 tests across 20 files pass in the isolated release checkout. Build passes with the existing large-chunk warning. Tests include all nine base challenges at grades 6, 9 and 12, pre-ship/guide/progression gates, evidence requirements, independent bases, duplicate submission protection, scientific formula scaling, and dashboard dialog open/focus/Escape-close behavior. Browser walkthrough of the built /universe-expedition.html verified 3D assembly, landing guide, evidence unlock, installation and next-mission availability. Whitespace check passes.

## Before deployment
Recorded live version: projects/dnd-master-73449/sites/dnd-master-73449/versions/76d448fe63d3fac7.
Recorded live release: projects/dnd-master-73449/sites/dnd-master-73449/channels/live/releases/1793783441587000.
Previous release time: 4 November 2026. This is the rollback reference if the new website fails verification.

## How to try
My Dashboard → My Universe → Start ship & base expedition, or /universe-expedition directly. Complete first contact, fit three ship parts, assemble, choose a destination, follow the guide, complete a design/evidence challenge, return to the base site and install the unlocked module.

## Remaining work
Educator review beyond these scaffolded target mappings; persistent account-scoped progress and inventories; production AI authoring/review workflow; richer 3D base placement and orbital flight simulation. These limitations do not block the explicitly labelled practice release.
