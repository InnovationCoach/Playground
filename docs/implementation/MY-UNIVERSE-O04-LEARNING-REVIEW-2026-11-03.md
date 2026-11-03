# O04 planet arrival — learning-design review

3 November 2026 · GPT lead educator/content review

Mani requested exploration before a mission and an invitation to place equipment or a feature on the planet. The learning sequence is **arrive → notice → choose a measurement site → place equipment → choose when to start the mission**. This is orientation and agency within the existing fictional world, not an additional assessed mission.

## Learner-facing content

| Planet | Notice first | Place | Think about |
|---|---|---|---|
| Thalassa | Platform, shoreline and weather mast | Portable wind sensor | How could nearby structures or measurement height affect a future comparison? |
| Ignis | Open ground, columns and sensor station | Solar meter | Which observations would help compare available light at different spots? |

The equipment has three authored candidate sites linked to existing catalog locations. They are possible planning choices, not validated engineering installations. The marker uses the chosen location and a small authored visual offset; no coordinates are presented as real field measurements. No reading is generated from choosing a site. The instrument’s visual animation is illustrative.

Use one brief prompt at a time. A placement choice should be possible with tap, click or keyboard, without precise dragging. A short optional question can encourage reasoning; a mandatory paragraph would defeat the small-entry-task purpose.

## Pacing and learner control

The initial suggestion is approximately **45 seconds of active, visible exploration**, within the 40–60 second range Mani described. It is not a timed assessment. Do not display a pressure countdown, count hidden-tab/loading/mission time, or automatically take keyboard focus when the interval ends.

“Ready now” offers placement sooner; “Keep exploring” suppresses repeated timed prompts. “Skip setup” reaches the same mission without penalty. Once equipment is placed, the learner can move it or continue looking around. Only choosing Start mission opens the mission sheet. The placement stays during the current visit, including while that sheet is open.

These choices respond to the requested calm, manageable experience for twice-exceptional learners. They are design hypotheses to test with learners, not claims to treat ADHD, dyslexia, anxiety or depression. Suggested grades and challenge levels of the existing missions remain unchanged.

## NGSS and scientific scope

Orientation helps learners notice differences, ask a question and plan a possible observation. It prepares the engineering comparisons in the pilot, which support [MS-ETS1-2](https://www.nextgenscience.org/pe/ms-ets1-2-engineering-design) and selected aspects of [HS-ETS1-3](https://www.nextgenscience.org/pe/hs-ets1-3-engineering-design). Placement alone does not demonstrate either performance expectation.

The accepted mission data remains the assessment basis. Placing a sensor does not turn synthetic numbers into observations, prove reliability, change capacity factor/solar flux, or validate an actual mission. The advanced journey retains its independent 140-day ion assumption. A later mission using actual observations would need separately reviewed provenance, uncertainty, versions and evidence rules.

## Data and access boundaries

- Orientation state is local memory for the current learner/organization and planet visit. No localStorage, new server record or personal profile is needed.
- Arrival setup is not part of a submission body. The exact mission tuple, required evidence, availability check, save behavior and reviewed-only outcome are unchanged.
- Timer callbacks cannot open a mission, grant XP/mastery or unlock a planet. Normal landing remains subject to the existing access result and catalog surface availability. Boreas remains pending with no landing site.
- Text view must offer an actual focused surface visit and the same placement choice/result. It must work without WebGL.

## Acceptance questions for the implementation

Can a learner understand where they arrived, notice at least one feature, place or move the equipment without help, distinguish a planned site from collected data, and choose when to start? Do reduced motion, keyboard placement and real scrolling work? Does switching account remove the previous placement immediately? Does the equipment remain after opening and closing the mission? Do the original task and requested route remain exact?

Technical acceptance is recorded separately after the isolated 5197 implementation is tested. The existing 5196 preview is kept stable during this work. Physical learner-device validation remains a later round.
