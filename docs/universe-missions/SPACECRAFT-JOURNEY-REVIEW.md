# Educator review: "Plan a journey to Ignis" (mission draft 0.1.0)

**Prepared by:** Claude (Opus 5.5) for Mani and the reviewing educator · **Date:** 1 November 2026
**Source of truth:** `src/features/universe/missions/spacecraftJourney.js`. The step listing below is generated from that file, so it matches what learners see.

**Status: DRAFT, awaiting educator review.**
- The mission appears only in labelled previews. Real students never see it.
- Self-checks are practice only: nothing is marked, saved, rewarded or used to unlock anything.
- No standards alignment is claimed until you confirm it.

## What we need you to decide
1. **Science accuracy:** are the two physics formulas stated correctly, and are their simplifications acceptable at this level?
2. **Plausibility:** the world values are fictional. Are any of them so far from real-world magnitudes that they would mislead learners?
3. **Routes:** does each route suit its intended learners? How should a learner or coach choose between them? Today the learner simply picks; age is never used.
4. **Standards:** confirm, change or reject the candidate mappings below.
5. **Evidence:** approve or edit the draft criteria for the two reflection steps.
6. **Sign-off:** record the decision at the end. Only then may the status change from `draft` to `reviewed`.

## Driving question
How should a crew of three travel from the research station on Thalassa to the fissure field on Ignis?

## Content and answer key

### Guided route

Compare three engines, work out travel time step by step and plan the crew’s food.

**1. Compare the engines** (choose)

- Prompt: Which engine would get the crew to Ignis fastest?
- Given (fictional world value): Chemical rocket: average speed 20 km/s. Fast, but burns a lot of propellant.
- Given (fictional world value): Solar-electric ion drive: average speed 12 km/s. Very efficient with propellant, needs a lot of electric power.
- Given (fictional world value): Solar sail: average speed 6 km/s. Needs no propellant at all, but is slow.
- **Answer key:** Chemical rocket
- Worked solution: The chemical rocket has the highest speed (20 km/s), so it arrives first. Fastest is not automatically best: the next steps look at what speed costs.
- Hint: Fastest means the highest speed. Compare the km/s numbers.

**2. Travel time in seconds** (number)

- Prompt: How many seconds does the chemical rocket take to travel 72,000,000 km at 20 km/s?
- Given (fictional world value): Distance: 72,000,000 km
- Given (fictional world value): Speed: 20 km/s (km travelled every second)
- **Answer key:** about 3,600,000 s (accepted within ±1%; within 10% shows "Close")
- Worked solution: 72,000,000 km ÷ 20 km/s = 3,600,000 s
- Hint: time = distance ÷ speed
- Hint: Both use kilometres, so km cancels and you are left with seconds.

**3. Travel time in days** (number)

- Prompt: Turn that time into days. Round to one decimal place.
- Given (unit fact): One day has 24 × 60 × 60 = 86,400 seconds.
- **Answer key:** about 41.7 days (accepted within ±1%; within 10% shows "Close")
- Worked solution: 3,600,000 s ÷ 86,400 s/day ≈ 41.7 days
- Hint: Divide the seconds by the number of seconds in one day.

**4. Food for the journey** (number)

- Prompt: Plan food for 42 days (the trip, rounded up). How many kilograms of food does the crew need?
- Given (fictional world value): Each person eats about 1.8 kg of food per day.
- Given (fictional world value): Crew: 3 people
- **Answer key:** about 227 kg (accepted within ±1%; within 10% shows "Close")
- Worked solution: 1.8 kg × 3 × 42 days = 226.8 kg
- Hint: Food per person per day × number of people × number of days.

**5. Your recommendation** (reflect)

- Prompt: Which engine would you choose for this crew, and why? Mention speed and one thing that speed costs.
- Open response; not checked automatically. See the draft evidence criteria below.
- Hint: A slower trip needs more food. A faster trip needs more propellant.

### Advanced route

Use the rocket equation and the inverse-square law to weigh propellant, supplies and power.

**1. Propellant for the chemical rocket** (number)

- Prompt: How much propellant (kg) does the chemical rocket need for the transfer? Round to the nearest 10 kg.
- Given (fictional world value): Ship mass without propellant (dry mass): 12,000 kg
- Given (fictional world value): Velocity change needed (Δv): 4.2 km/s
- Given (fictional world value): Chemical engine specific impulse (Isp): 450 s
- Given (real science): Rocket equation: Δv = Isp × g₀ × ln(m₀ ÷ m_dry), so m₀ ÷ m_dry = e^(Δv ÷ (Isp × g₀)), with g₀ = 9.81 m/s². Source: Tsiolkovsky rocket equation (standard physics); educator review pending.
- Given (method note): Propellant = m₀ − m_dry = m_dry × (mass ratio − 1). Remember to use Δv in m/s.
- **Answer key:** about 19,070 kg (accepted within ±2%; within 10% shows "Close")
- Worked solution: Exhaust speed = 450 × 9.81 = 4414.5 m/s. Mass ratio = e^(4200 ÷ 4414.5) ≈ 2.589. Propellant ≈ 12,000 × 1.589 ≈ 19,072 kg.
- Hint: Exhaust speed = Isp × g₀ = 450 × 9.81 m/s.
- Hint: Mass ratio = e^(4200 ÷ exhaust speed).

**2. Propellant for the ion drive** (number)

- Prompt: Now the ion drive. How much propellant (kg) does it need? Round to the nearest 10 kg.
- Given (fictional world value): Ion drive specific impulse (Isp): 3000 s
- Given (method note): Same dry mass and Δv as before.
- **Answer key:** about 1,840 kg (accepted within ±2%; within 10% shows "Close")
- Worked solution: Exhaust speed = 29430 m/s. Mass ratio ≈ 1.1534. Propellant ≈ 1,841 kg.
- Hint: Same steps, with Isp = 3000 s.

**3. The cost of a slower trip** (number)

- Prompt: The chemical trip takes 42 days and the ion trip 140 days. How many more kilograms of supplies does the ion trip need?
- Given (fictional world value): Supplies (food, water and oxygen, without recycling): 5.3 kg per person per day
- Given (fictional world value): Crew: 3 people
- **Answer key:** about 1,560 kg (accepted within ±1%; within 10% shows "Close")
- Worked solution: Ion: 5.3 × 3 × 140 = 2226.0 kg. Chemical: 667.8 kg. Difference = 1558.2 kg.
- Hint: Work out supplies for each trip, then subtract.

**4. Solar power near Ignis** (number)

- Prompt: The ion drive needs 30 kW of electricity. How many square metres of solar panels does it need near Ignis? Round to the nearest m².
- Given (fictional world value): Sunlight at Thalassa’s orbit: 1200 W/m²
- Given (fictional world value): Ignis orbits 1.6 times farther from Lyra Prime than Thalassa does.
- Given (fictional world value): Panel efficiency: 25% of sunlight becomes electricity
- Given (real science): Inverse-square law: sunlight per square metre falls with the square of distance from the star. Source: Inverse-square law for radiation (standard physics); educator review pending.
- **Answer key:** about 256 m² (accepted within ±2%; within 10% shows "Close")
- Worked solution: Sunlight at Ignis = 1200 ÷ 2.5600000000000005 ≈ 468.7 W/m². Each m² gives 117.2 W. Area = 30,000 W ÷ 117.2 W/m² ≈ 256 m².
- Hint: Sunlight at Ignis = 1200 ÷ 1.6²
- Hint: Electricity per m² = sunlight × efficiency. Area = power needed ÷ electricity per m².

**5. Make the case** (reflect)

- Prompt: Recommend chemical or ion for this crew. Use your propellant, supplies and panel results, and name one limitation of this simple model.
- Open response; not checked automatically. See the draft evidence criteria below.
- Hint: Total extra mass = propellant + supplies. Which option carries less? What would a crew worry about on a 140-day trip?


## Model limitations shown to learners
- Supplies are added after the rocket equation. A fuller model would include them in the dry mass, which raises the propellant needed.
- Speeds are averages; real transfers speed up and slow down, and follow curved orbits.
- The ion drive is treated as if its thrust were enough for the stated trip time; thrust, acceleration and power-to-thrust are not modelled.
- Solar flux uses a single distance for Ignis; real orbits change that distance.
- Supplies ignore recycling, spares, safety margins and radiation shielding.

## Candidate standards (unconfirmed, for the educator to confirm or reject)

These are suggestions only. The product must not claim any alignment until you approve it. A space theme alone is not NGSS alignment (`UNIVERSE.md` §7).

| Route | Candidate | Why it might fit | Concern to check |
|---|---|---|---|
| Guided | CCSS Math 6.RP.A.3 (ratio and rate reasoning, unit conversion) | Speed as a rate; seconds → days | Large numbers may need calculator guidance |
| Guided | NGSS MS-ETS1-2 (evaluate competing design solutions against criteria) | Comparing three engines on speed vs. cost | Criteria are only implied; the reflection may need an explicit criteria list |
| Advanced | CCSS Math HSN-Q.A.1 (use units to guide multi-step problems) | km/s → m/s, Isp × g₀ | — |
| Advanced | CCSS Math HSF-LE (exponential models) | e^x in the rocket equation | Learners use the formula; they don't derive or model it |
| Advanced | NGSS HS-ETS1-3 (evaluate solutions using prioritized criteria and trade-offs) | Propellant vs. supplies vs. power | Needs explicit criteria and constraints in the reflection |
| Advanced | NGSS HS-PS2-2 (conservation of momentum) | The rocket equation follows from momentum conservation | Only applied, not derived. Probably not a fit unless a derivation step is added |

## Draft evidence criteria for the reflection steps (not used for grading)
- **Guided:** names a choice; gives at least one reason using a calculated number (days or kg); names one cost of the choice (for example, more food for a slower trip).
- **Advanced:** makes a recommendation; compares total added mass (propellant + supplies) for both options using their results; mentions the panel area or power need; names one model limitation from the list.

## Reviewer questions
1. Should the advanced route show the momentum derivation of the rocket equation, or keep it as a given formula?
2. Is "average speed" for the guided route acceptable, given that real transfers follow curved, accelerating paths? This is stated in the limitations.
3. Is the ±1–2% answer tolerance right? "Close" appears within 10%.
4. Do the guided numbers (millions of km, millions of seconds) need a calculator note for younger learners?

## Sign-off (to be completed by the educator)
| Item | Decision | Reviewer | Date |
|---|---|---|---|
| Science accuracy | | | |
| Plausibility of world values | | | |
| Route suitability | | | |
| Standards mapping | | | |
| Evidence criteria | | | |
| Approved to change status to `reviewed` | | | |
