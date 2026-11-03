# Phase 1 science, STEAM and NGSS review

2 November 2026 · Reviewer: GPT lead (AI), explicitly designated by Mani in chat

**Decision: accepted for the controlled local Phase 1 pilot with the existing “supports” alignment claims and stated model limitations.** This is the AI review Mani requested. It is not a human educator credential, NGSS certification, measured learner outcome or permission to publish. Mani selected this Mac for current testing and student devices for the next validation round. Historical pending review markers inside the immutable authoring bundle remain unchanged; this separate record supplies the current review decision.

Reviewed bundle: `pilot-fixture-g03-20261102-v2`, content SHA-256 `974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7`. [Independent numeric record](universe-pilot/lead-science-review-2026-11-02.json): **30 checks passed**. Original authoring validator: **114 checks passed**. Accepted bundle bytes were not edited.

## Science and numerical review

| Area | Independent finding | Scope retained |
|---|---|---|
| Wind record | Hours total 168; weighted full-power hours 56.5; raw capacity factor 0.3363095238; rated 1 MW gives 56.5 MWh/week, averaging 8.0714286 MWh/day. | This is a synthetic aggregate teaching record. The rounded planning CF 0.34 is distinct from the raw result. |
| Plan comparison | Planning daily totals A 14,160 / B 16,320 kWh; surpluses 2,160 / 4,320. CF 0.20 gives A 10,800 / B 9,600 against demand 12,000. Both stress cases fall short. | A is lighter and less short under that isolated stress; B uses less area and has more base surplus. Neither is universally best. Solar/demand remain fixed in the stress case. |
| Guided journey | Chemical 41.6667 days, provision 42 days / 226.8 kg fictional food; ion 69.4444 days, 70 / 378 kg; sail 138.8889 days, 139 / 750.6 kg. | Authored average speeds; no real propulsion ranking or flight prediction. Food is a fictional case value. |
| Advanced journey | Ideal propellant chemical 19,072.3009 kg / ion 1,840.7642 kg; supplies 667.8 / 2,226 kg. Fictional flux 468.75 W/m²; electrical output 117.1875 W/m²; propulsion-only panel area 256 m². | Separate 140-day ion input. Partial propellant/supplies ledger excludes hardware/life-support and is not complete launch mass. |

The capacity-factor method agrees with the [EIA definition](https://www.eia.gov/tools/glossary/index.php?id=C). Wind generation and output limits are supported by [DOE's turbine explanation](https://www.energy.gov/cmei/systems/how-do-wind-turbines-work) and [power-curve discussion](https://www.energy.gov/cmei/wind/articles/how-do-wind-turbines-survive-severe-weather-and-storms). **Review inference:** weekly/daily energy totals cannot establish hourly or nighttime adequacy without time-resolved supply/demand and storage/operating evidence. The authored limitations correctly preserve that distinction.

The advanced reference calculation uses the [NASA ideal rocket equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/) and [specific-impulse relationship](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/specific-impulse/) within its explicit simplifications. The real low-thrust example is consistent with [NASA's Dawn explanation](https://science.nasa.gov/mission/dawn/faq/). The sail assumption matches [NASA's solar-sail description](https://www.nasa.gov/smallspacecraft/what-is-acs3/); the inverse-square exercise matches [JPL's solar-power lesson](https://www.jpl.nasa.gov/edu/resources/lesson-plan/calculating-solar-power-in-space/). These sources support principles; none validates the fictional crewed mission, its travel time or its safety.

## NGSS evidence review

| Route | Mapping accepted for pilot | Learner evidence that supports the mapping | Limit of the claim |
|---|---|---|---|
| Wind energy estimate, grades 6–8 | Supports MS-ETS1-2; argument from evidence; ETS1.B. | State agreed criteria, compare both plans systematically, explain a conditional choice, inspect the low-wind result and request missing evidence. | Arithmetic or choosing the largest output alone is insufficient. Actual collaboration/criteria agreement must be evidenced in classroom use. |
| Journey timing, grades 6–8 | Supports MS-ETS1-2; argument from evidence; ETS1.B. | Compare competing concepts against arrival/provision constraints, explain tradeoffs and a contingency, and distinguish scenario assumptions from a real journey. | A rate worksheet alone is insufficient; the decision and missing-evidence explanation matter. |
| Mass and power tradeoffs, grades 9–12 | Supports selected aspects of HS-ETS1-3; designing/evaluating solutions; ETS1.B. | Prioritize criteria, compare represented constraints, explain conditional tradeoffs and connect the model to real engineering evidence and unresolved impacts. | The fictional case does not establish the full complex real-world expectation or replace student-generated evidence about implementation and social/cultural impacts. |

The middle-school judgments follow the [MS-ETS1-2 evidence statements](https://www.nextgenscience.org/sites/default/files/evidence_statement/black_white/MS-ETS1-2%20Evidence%20Statements%20June%202015%20asterisks.pdf). The advanced boundary follows the [HS-ETS1-3 evidence statements](https://www.nextgenscience.org/sites/default/files/evidence_statement/black_white/HS-ETS1-3%20Evidence%20Statements%20June%202015%20asterisks.pdf). The latter also includes an engineering/society connection under its crosscutting heading; the pack's real-engineering transfer and missing-impact prompts address that connection without inventing a required generic CCC. No whole-PE mastery score should be inferred.

## STEAM, evidence alternatives and difficulty

Science supplies model principles and limitations; technology supplies data/measurement and power-system context; engineering supplies criteria and competing designs; mathematics supports quantitative comparisons; visual/text communication makes the reasoning accessible to another person. Diagram/text alternatives must carry the same reasoning. Guided/Independent support changes scaffolding, never grade or outcome eligibility. Rubrics evaluate evidence, reasoning, revision and communication rather than clicks or word count.

The contract's provisional task challenges remain **2 / 2 / 4** for wind / journey timing / mass-power. Confirm demand and suggested duration with actual student work in the next round. Do not describe these as measured learner ability or derive live planet ratings from unpublished drafts.

## Current review boundaries and next student validation

- Keep synthetic datasets, fictional values, real principles and model-derived results visibly distinct in both the interface and coach evidence view.
- Keep the unsupported legacy Hex-Grid nighttime claim outside assessed pilot flows. No server-verified city/night reliability result is approved by this review.
- Coach approval means reviewed work under the current pilot policy; no automatic mastery, XP or Boreas grant.
- On student devices, check comprehension of the question, data labels and support choice; ability to explain a tradeoff and uncertainty; accessible evidence entry; save/recovery and feedback revision; and actual touch/browser/performance behavior.
- Student-device testing is the next round Mani requested. Publication/deployment remains a separate product decision after the reviewable implementation is complete.
