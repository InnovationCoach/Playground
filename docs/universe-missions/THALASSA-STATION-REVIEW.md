# Educator review: Thalassa Research Station workstations (drafts 0.1.0)

**Prepared by:** Claude (Opus 5.5) · **Date:** 1 November 2026
**Source of truth:** `src/features/activities/hexGrid/scenarios.js` and `src/features/universe/missions/thalassaWindSurvey.js`. The listing below is generated from those files.
**Status: DRAFT, awaiting educator review.** Both workstations appear only in labelled previews. Progress is practice: nothing is marked, saved as evidence, rewarded or unlocked.

## How the two workstations fit together
1. **Weather mast: "Is the wind worth it?"** (mission). Learners turn a fictional week of wind records into a turbine **capacity factor**.
2. **Research platform: "Platform design lab"** (simulation). Learners open **Project Hex-Grid, Thalassa edition** and design a floating station for 200 people, entering their capacity factor in the model.

**Why the link matters:** in our own testing, every goal at once was reachable only with the survey result (0.34) and large turbines. Without wind data, the best design reached 19% on its weakest goal. An automated test keeps this true if the model changes.

## Simulation: Thalassa Research Station

The research platform off Thalassa’s headland needs to grow into a small floating settlement. It must stay afloat, feed everyone, supply fresh water, treat wastewater and keep the lights on through the night.

**World values (fictional):**
- 200 researchers will live on the platform.
- Rainfall on Thalassa: about 1,800 mm a year.
- Wind turbines make no power until you enter a capacity factor. Measure it at the Weather mast workstation, then type it into "Wind capacity factor (from your research)".
- Food, water and electricity needed per person use the model’s Earth data (Thailand). Thalassa’s people are assumed to need the same.

**Challenges** (each checked live against the model):

| Tier | Challenge | Goal |
|---|---|---|
| 1 | Keep it floating | No platform is loaded past its safe limit. |
| 1 | Water in, wastewater out | Fresh water and wastewater treatment both at 100% or more. |
| 2 | Power the day | Electricity made covers everything the city uses (100% or more). |
| 2 | Feed everyone | Food energy and protein grown both reach 100% of what 200 people need. |
| 3 | Through the night | Night-time power covered at 100% or more. |
| 3 | The whole station at once | Every challenge above met in the same design. |

**Limits shown to learners:**
- The model is a daily average: no tides, waves, storms or seasons. The tide gauge and weather on Thalassa are scenery, not part of this simulation.
- People’s needs use Earth (Thailand) data, not measurements of Thalassa.
- Platforms are checked one at a time; the connections between them are not.
- No money: nothing here says whether the station is affordable.

## Mission: Is the wind worth it?

**Driving question:** How much power could a wind turbine really give the Thalassa research station?

**Fictional wind record** (168 hours):

| Wind band | Hours | Share of full power |
|---|---|---|
| below 3 m/s | 20 | 0% |
| 3–6 m/s | 50 | 10% |
| 6–9 m/s | 60 | 35% |
| 9–12 m/s | 30 | 75% |
| 12 m/s or more | 8 | 100% |

**1. How long was the record?** (number)

- Prompt: Add up the hours in all the wind bands. How many hours did the mast record?
- **Answer key:** 168 hours (±0.1%)
- Worked solution: 20 + 50 + 60 + 30 + 8 = 168 hours, one full week.

**2. Full-power hours** (number)

- Prompt: In each band the turbine gives only part of its full power. How many hours of full power does the week add up to?
- **Answer key:** 56.5 hours (±2%)
- Worked solution: 20 × 0 + 50 × 0.1 + 60 × 0.35 + 30 × 0.75 + 8 × 1 = 56.5 full-power hours.

**3. Capacity factor** (number)

- Prompt: The capacity factor is full-power hours ÷ all hours. What is it? Give a decimal to two places.
- Given (method): Capacity factor = full-power hours ÷ total hours (0 = never runs, 1 = full power all the time).
- **Answer key:** 0.34 (±3%)
- Worked solution: 56.5 ÷ 168 ≈ 0.336, so about 0.34.

**4. Why not just average the wind speed?** (choose)

- Prompt: Why can’t we simply take the average wind speed and read the power for that speed?
- Given (real-science): A turbine’s power rises roughly with the cube of wind speed (until it reaches full power). Source: Wind power ∝ v³ (standard physics); educator review pending.
- **Answer key:** Power grows much faster than speed, so windy hours count far more than calm ones.
- Worked solution: Doubling the speed gives about eight times the power, so a few windy hours can matter more than many calm ones. Averaging speeds first hides that.

**5. Use your result** (reflect)

- Prompt: Open the Platform design lab at the research platform and enter your capacity factor in "Wind capacity factor (from your research)". Does wind help the station through the night? Explain what you saw.
- Open response; not checked automatically.

**Limits shown to learners:**
- One week of wind is a small sample; real surveys use at least a year.
- The power curve is simplified into five bands.
- Turbine outages, maintenance and losses are not included.

## Candidate standards (unconfirmed, for the educator to confirm or reject)

| Workstation | Candidate | Why it might fit |
|---|---|---|
| Wind survey | CCSS Math 6.SP / 7.SP (summarising data, weighted averages) | Turning a frequency table into a single measure |
| Wind survey | NGSS MS-PS3-1 (kinetic energy relates to speed) | Why windy hours count far more than calm ones |
| Platform design lab | NGSS MS-ETS1-2 / HS-ETS1-3 (evaluate designs against criteria and trade-offs) | Food vs power vs space on a fixed platform |
| Platform design lab | NGSS HS-ESS3-2 / HS-ESS3-4 (evaluate solutions for resource and environmental impact) | Water, waste and energy loops |

No alignment is claimed until confirmed.

## Reviewer questions
1. Is the five-band power curve a fair simplification at this level?
2. Should the "Through the night" and "whole station" tiers be reserved for older learners?
3. Is it acceptable that Thalassa uses Earth (Thailand) data for people’s needs?
4. Should the platform challenge ask for a short written justification that a coach can review (Go 4 flow)?

## Sign-off (to be completed by the educator)
| Item | Decision | Reviewer | Date |
|---|---|---|---|
| Science and maths accuracy | | | |
| Fictional values plausible | | | |
| Challenge tiers suitable | | | |
| Standards mapping | | | |
| Approved to change status to `reviewed` | | | |
