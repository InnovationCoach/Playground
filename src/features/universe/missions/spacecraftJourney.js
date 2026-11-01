/**
 * Mission draft: "Plan a journey from Thalassa to Ignis" (V1.0 vision example).
 * DRAFT — awaiting educator review. Shown only in labelled previews until an
 * educator approves the science, the maths, the standards mapping and the
 * evidence criteria (docs/universe-missions/SPACECRAFT-JOURNEY-REVIEW.md).
 *
 * Every world value is fictional and labelled so. The two formulas used in the
 * advanced route (rocket equation, inverse-square law) are real physics and are
 * labelled as such, with their simplifications listed in `limitations`.
 * Answers are computed from the givens below, never typed in by hand.
 * Self-checks are practice: nothing is marked, saved, rewarded or unlocked.
 */

const G0 = 9.81; // standard gravity, m/s² (real constant)

// Fictional world values (one place, so the answer key can never drift from the text).
export const WORLD = {
  distanceKm: 72_000_000, // Thalassa → Ignis transfer path
  crew: 3,
  options: [
    { id: 'chemical', name: 'Chemical rocket', speedKmS: 20, note: 'Fast, but burns a lot of propellant.' },
    { id: 'ion', name: 'Solar-electric ion drive', speedKmS: 12, note: 'Very efficient with propellant, needs a lot of electric power.' },
    { id: 'sail', name: 'Solar sail', speedKmS: 6, note: 'Needs no propellant at all, but is slow.' }
  ],
  foodKgPerPersonDay: 1.8,
  dryMassKg: 12_000,
  deltaVKmS: 4.2,
  ispChemicalS: 450,
  ispIonS: 3000,
  tripDaysChemical: 42, // the guided route's 41.7 days, rounded up: both routes describe one world
  tripDaysIon: 140,
  supplyKgPerPersonDay: 5.3, // food + water + oxygen, no recycling
  fluxAtThalassaWm2: 1200,
  distanceRatioIgnisToThalassa: 1.6, // Ignis orbits 1.6× farther from Lyra Prime
  ionPowerKw: 30,
  panelEfficiency: 0.25
};

const W = WORLD;
const chem = W.options[0];
const secondsChem = W.distanceKm / chem.speedKmS;
const daysChem = secondsChem / 86_400;
const foodDays = Math.ceil(daysChem);
const massRatio = (isp) => Math.exp((W.deltaVKmS * 1000) / (isp * G0));
const propellant = (isp) => W.dryMassKg * (massRatio(isp) - 1);
const supplies = (days) => W.supplyKgPerPersonDay * W.crew * days;
const fluxAtIgnis = W.fluxAtThalassaWm2 / W.distanceRatioIgnisToThalassa ** 2;

const fictional = (text) => ({ text, tag: 'fictional-world' });
const science = (text, source) => ({ text, tag: 'real-science', source });

export const SPACECRAFT_JOURNEY = {
  id: 'spacecraft-journey',
  version: '0.1.0-draft',
  status: 'draft', // 'draft' → shown only in previews; 'reviewed' needs an educator sign-off recorded outside this file
  title: 'Plan a journey to Ignis',
  planetIds: ['thalassa', 'ignis'],
  drivingQuestion: 'How should a crew of three travel from the research station on Thalassa to the fissure field on Ignis?',
  context: [
    fictional(`The transfer path from Thalassa to Ignis is ${W.distanceKm.toLocaleString('en-US')} km long.`),
    fictional(`The crew is ${W.crew} people.`)
  ],
  routes: [
    {
      id: 'guided',
      name: 'Guided route',
      summary: 'Compare three engines, work out travel time step by step and plan the crew’s food.',
      steps: [
        {
          id: 'compare', kind: 'choose', title: 'Compare the engines',
          prompt: 'Which engine would get the crew to Ignis fastest?',
          given: W.options.map((o) => fictional(`${o.name}: average speed ${o.speedKmS} km/s. ${o.note}`)),
          choices: W.options.map((o) => ({ id: o.id, label: o.name })),
          answer: 'chemical',
          hints: ['Fastest means the highest speed. Compare the km/s numbers.'],
          solution: `The chemical rocket has the highest speed (${chem.speedKmS} km/s), so it arrives first. Fastest is not automatically best: the next steps look at what speed costs.`
        },
        {
          id: 'seconds', kind: 'number', title: 'Travel time in seconds',
          prompt: `How many seconds does the chemical rocket take to travel ${W.distanceKm.toLocaleString('en-US')} km at ${chem.speedKmS} km/s?`,
          given: [fictional(`Distance: ${W.distanceKm.toLocaleString('en-US')} km`), fictional(`Speed: ${chem.speedKmS} km/s (km travelled every second)`)],
          answer: secondsChem, unit: 's', tolerance: 0.01,
          hints: ['time = distance ÷ speed', 'Both use kilometres, so km cancels and you are left with seconds.'],
          solution: `${W.distanceKm.toLocaleString('en-US')} km ÷ ${chem.speedKmS} km/s = ${secondsChem.toLocaleString('en-US')} s`
        },
        {
          id: 'days', kind: 'number', title: 'Travel time in days',
          prompt: 'Turn that time into days. Round to one decimal place.',
          given: [{ text: 'One day has 24 × 60 × 60 = 86,400 seconds.', tag: 'unit-fact' }],
          answer: Math.round(daysChem * 10) / 10, unit: 'days', tolerance: 0.01,
          hints: ['Divide the seconds by the number of seconds in one day.'],
          solution: `${secondsChem.toLocaleString('en-US')} s ÷ 86,400 s/day ≈ ${daysChem.toFixed(1)} days`
        },
        {
          id: 'food', kind: 'number', title: 'Food for the journey',
          prompt: `Plan food for ${foodDays} days (the trip, rounded up). How many kilograms of food does the crew need?`,
          given: [fictional(`Each person eats about ${W.foodKgPerPersonDay} kg of food per day.`), fictional(`Crew: ${W.crew} people`)],
          answer: W.foodKgPerPersonDay * W.crew * foodDays, unit: 'kg', tolerance: 0.01,
          hints: ['Food per person per day × number of people × number of days.'],
          solution: `${W.foodKgPerPersonDay} kg × ${W.crew} × ${foodDays} days = ${(W.foodKgPerPersonDay * W.crew * foodDays).toFixed(1)} kg`
        },
        {
          id: 'reflect', kind: 'reflect', title: 'Your recommendation',
          prompt: 'Which engine would you choose for this crew, and why? Mention speed and one thing that speed costs.',
          hints: ['A slower trip needs more food. A faster trip needs more propellant.']
        }
      ]
    },
    {
      id: 'advanced',
      name: 'Advanced route',
      summary: 'Use the rocket equation and the inverse-square law to weigh propellant, supplies and power.',
      steps: [
        {
          id: 'chem-propellant', kind: 'number', title: 'Propellant for the chemical rocket',
          prompt: 'How much propellant (kg) does the chemical rocket need for the transfer? Round to the nearest 10 kg.',
          given: [
            fictional(`Ship mass without propellant (dry mass): ${W.dryMassKg.toLocaleString('en-US')} kg`),
            fictional(`Velocity change needed (Δv): ${W.deltaVKmS} km/s`),
            fictional(`Chemical engine specific impulse (Isp): ${W.ispChemicalS} s`),
            science('Rocket equation: Δv = Isp × g₀ × ln(m₀ ÷ m_dry), so m₀ ÷ m_dry = e^(Δv ÷ (Isp × g₀)), with g₀ = 9.81 m/s².', 'Tsiolkovsky rocket equation (standard physics); educator review pending'),
            { text: 'Propellant = m₀ − m_dry = m_dry × (mass ratio − 1). Remember to use Δv in m/s.', tag: 'method' }
          ],
          answer: propellant(W.ispChemicalS), unit: 'kg', tolerance: 0.02,
          hints: ['Exhaust speed = Isp × g₀ = 450 × 9.81 m/s.', 'Mass ratio = e^(4200 ÷ exhaust speed).'],
          solution: `Exhaust speed = ${W.ispChemicalS} × 9.81 = ${(W.ispChemicalS * G0).toFixed(1)} m/s. Mass ratio = e^(4200 ÷ ${(W.ispChemicalS * G0).toFixed(1)}) ≈ ${massRatio(W.ispChemicalS).toFixed(3)}. Propellant ≈ ${W.dryMassKg.toLocaleString('en-US')} × ${(massRatio(W.ispChemicalS) - 1).toFixed(3)} ≈ ${Math.round(propellant(W.ispChemicalS)).toLocaleString('en-US')} kg.`
        },
        {
          id: 'ion-propellant', kind: 'number', title: 'Propellant for the ion drive',
          prompt: 'Now the ion drive. How much propellant (kg) does it need? Round to the nearest 10 kg.',
          given: [fictional(`Ion drive specific impulse (Isp): ${W.ispIonS} s`), { text: 'Same dry mass and Δv as before.', tag: 'method' }],
          answer: propellant(W.ispIonS), unit: 'kg', tolerance: 0.02,
          hints: ['Same steps, with Isp = 3000 s.'],
          solution: `Exhaust speed = ${(W.ispIonS * G0).toFixed(0)} m/s. Mass ratio ≈ ${massRatio(W.ispIonS).toFixed(4)}. Propellant ≈ ${Math.round(propellant(W.ispIonS)).toLocaleString('en-US')} kg.`
        },
        {
          id: 'supplies', kind: 'number', title: 'The cost of a slower trip',
          prompt: `The chemical trip takes ${W.tripDaysChemical} days and the ion trip ${W.tripDaysIon} days. How many more kilograms of supplies does the ion trip need?`,
          given: [fictional(`Supplies (food, water and oxygen, without recycling): ${W.supplyKgPerPersonDay} kg per person per day`), fictional(`Crew: ${W.crew} people`)],
          answer: supplies(W.tripDaysIon) - supplies(W.tripDaysChemical), unit: 'kg', tolerance: 0.01,
          hints: ['Work out supplies for each trip, then subtract.'],
          solution: `Ion: ${W.supplyKgPerPersonDay} × ${W.crew} × ${W.tripDaysIon} = ${supplies(W.tripDaysIon).toFixed(1)} kg. Chemical: ${supplies(W.tripDaysChemical).toFixed(1)} kg. Difference = ${(supplies(W.tripDaysIon) - supplies(W.tripDaysChemical)).toFixed(1)} kg.`
        },
        {
          id: 'panels', kind: 'number', title: 'Solar power near Ignis',
          prompt: `The ion drive needs ${W.ionPowerKw} kW of electricity. How many square metres of solar panels does it need near Ignis? Round to the nearest m².`,
          given: [
            fictional(`Sunlight at Thalassa’s orbit: ${W.fluxAtThalassaWm2} W/m²`),
            fictional(`Ignis orbits ${W.distanceRatioIgnisToThalassa} times farther from Lyra Prime than Thalassa does.`),
            fictional(`Panel efficiency: ${W.panelEfficiency * 100}% of sunlight becomes electricity`),
            science('Inverse-square law: sunlight per square metre falls with the square of distance from the star.', 'Inverse-square law for radiation (standard physics); educator review pending')
          ],
          answer: (W.ionPowerKw * 1000) / (fluxAtIgnis * W.panelEfficiency), unit: 'm²', tolerance: 0.02,
          hints: [`Sunlight at Ignis = ${W.fluxAtThalassaWm2} ÷ ${W.distanceRatioIgnisToThalassa}²`, 'Electricity per m² = sunlight × efficiency. Area = power needed ÷ electricity per m².'],
          solution: `Sunlight at Ignis = ${W.fluxAtThalassaWm2} ÷ ${W.distanceRatioIgnisToThalassa ** 2} ≈ ${fluxAtIgnis.toFixed(1)} W/m². Each m² gives ${(fluxAtIgnis * W.panelEfficiency).toFixed(1)} W. Area = 30,000 W ÷ ${(fluxAtIgnis * W.panelEfficiency).toFixed(1)} W/m² ≈ ${Math.round((W.ionPowerKw * 1000) / (fluxAtIgnis * W.panelEfficiency))} m².`
        },
        {
          id: 'reflect', kind: 'reflect', title: 'Make the case',
          prompt: 'Recommend chemical or ion for this crew. Use your propellant, supplies and panel results, and name one limitation of this simple model.',
          hints: ['Total extra mass = propellant + supplies. Which option carries less? What would a crew worry about on a 140-day trip?']
        }
      ]
    }
  ],
  limitations: [
    'Supplies are added after the rocket equation. A fuller model would include them in the dry mass, which raises the propellant needed.',
    'Speeds are averages; real transfers speed up and slow down, and follow curved orbits.',
    'The ion drive is treated as if its thrust were enough for the stated trip time; thrust, acceleration and power-to-thrust are not modelled.',
    'Solar flux uses a single distance for Ignis; real orbits change that distance.',
    'Supplies ignore recycling, spares, safety margins and radiation shielding.'
  ]
};

