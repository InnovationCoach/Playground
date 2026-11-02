/**
 * Mission draft: "Is the wind worth it?" (Thalassa weather mast workstation).
 * DRAFT — awaiting educator review (docs/universe-missions/THALASSA-STATION-REVIEW.md).
 *
 * Learners turn a week of (fictional) wind records into a turbine capacity
 * factor, then use it in the Thalassa Hex-Grid station. The method — a weighted
 * average of output over time — is real; the wind record is fictional.
 * Answers are computed from the givens below, never typed in by hand.
 */

// Fictional week of readings at the mast: hours spent in each wind band, and the share of
// full power a 1 MW turbine gives in that band (simplified power curve).
export const WIND_WEEK = [
  { band: 'below 3 m/s', hours: 20, output: 0 },
  { band: '3–6 m/s', hours: 50, output: 0.10 },
  { band: '6–9 m/s', hours: 60, output: 0.35 },
  { band: '9–12 m/s', hours: 30, output: 0.75 },
  { band: '12 m/s or more', hours: 8, output: 1 }
];

const totalHours = WIND_WEEK.reduce((s, b) => s + b.hours, 0);
const fullPowerHours = WIND_WEEK.reduce((s, b) => s + b.hours * b.output, 0);
const capacityFactor = fullPowerHours / totalHours;

const fictional = (text) => ({ text, tag: 'fictional-world' });
const science = (text, source) => ({ text, tag: 'real-science', source });

export const THALASSA_WIND_SURVEY = {
  id: 'thalassa-wind-survey',
  version: '0.1.0-draft',
  status: 'draft',
  title: 'Is the wind worth it?',
  planetIds: ['thalassa'],
  locationId: 'weather-mast',
  drivingQuestion: 'How much power could a wind turbine really give the Thalassa research station?',
  context: [
    fictional('The weather mast logged one week (168 hours) of wind on the headland.'),
    fictional('The station is considering 1 MW turbines.')
  ],
  routes: [
    {
      id: 'guided',
      name: 'Guided route',
      summary: 'Read the wind record, find the turbine’s full-power hours and its capacity factor.',
      steps: [
        {
          id: 'hours', kind: 'number', title: 'How long was the record?',
          prompt: 'Add up the hours in all the wind bands. How many hours did the mast record?',
          given: WIND_WEEK.map((b) => fictional(`${b.band}: ${b.hours} hours`)),
          answer: totalHours, unit: 'hours', tolerance: 0.001,
          hints: ['Add the five numbers of hours.'],
          solution: `${WIND_WEEK.map((b) => b.hours).join(' + ')} = ${totalHours} hours, one full week.`
        },
        {
          id: 'full-power', kind: 'number', title: 'Full-power hours',
          prompt: 'In each band the turbine gives only part of its full power. How many hours of full power does the week add up to?',
          given: WIND_WEEK.map((b) => fictional(`${b.band}: ${b.hours} h at ${Math.round(b.output * 100)}% of full power`)),
          answer: fullPowerHours, unit: 'hours', tolerance: 0.02,
          hints: ['For each band: hours × share of full power.', 'Then add the five results.'],
          solution: `${WIND_WEEK.map((b) => `${b.hours} × ${b.output}`).join(' + ')} = ${fullPowerHours} full-power hours.`
        },
        {
          id: 'capacity-factor', kind: 'number', title: 'Capacity factor',
          prompt: 'The capacity factor is full-power hours ÷ all hours. What is it? Give a decimal to two places.',
          given: [{ text: 'Capacity factor = full-power hours ÷ total hours (0 = never runs, 1 = full power all the time).', tag: 'method' }],
          answer: Math.round(capacityFactor * 100) / 100, unit: '', tolerance: 0.03,
          hints: [`${fullPowerHours} ÷ ${totalHours}`],
          solution: `${fullPowerHours} ÷ ${totalHours} ≈ ${capacityFactor.toFixed(3)}, so about ${capacityFactor.toFixed(2)}.`
        },
        {
          id: 'why-not-average', kind: 'choose', title: 'Why not just average the wind speed?',
          prompt: 'Why can’t we simply take the average wind speed and read the power for that speed?',
          given: [science('A turbine’s power rises roughly with the cube of wind speed (until it reaches full power).', 'Wind power ∝ v³ (standard physics); educator review pending')],
          choices: [
            { id: 'cube', label: 'Power grows much faster than speed, so windy hours count far more than calm ones.' },
            { id: 'same', label: 'Average speed gives the same answer, it is just slower to calculate.' },
            { id: 'direction', label: 'Because the wind direction changes.' }
          ],
          answer: 'cube',
          hints: ['If speed doubles, what happens to power when it grows with the cube?'],
          solution: 'Doubling the speed gives about eight times the power, so a few windy hours can matter more than many calm ones. Averaging speeds first hides that.'
        },
        {
          id: 'use-it', kind: 'reflect', title: 'Use your result',
          prompt: `Open the Platform design lab at the research platform and enter your capacity factor in "Wind capacity factor (from your research)". Does wind help the station through the night? Explain what you saw.`,
          hints: ['Wind turbines run around the clock; solar panels only by day.']
        }
      ]
    }
  ],
  limitations: [
    'One week of wind is a small sample; real surveys use at least a year.',
    'The power curve is simplified into five bands.',
    'Turbine outages, maintenance and losses are not included.'
  ]
};

export const WIND_SURVEY_RESULT = { totalHours, fullPowerHours, capacityFactor };
