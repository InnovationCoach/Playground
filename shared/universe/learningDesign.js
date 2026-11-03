/**
 * Educator-facing design + concise learner copy for the reviewed local pilot.
 * Presentation only: no answers, evidence rules, registry entries or grants.
 * Exact release/version binding prevents applying this wording to a later task.
 */
export const LEARNING_DESIGN_VERSION = '1.0.0';
const CONTENT_SHA = '974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7';
const VERSION = '0.2.0-draft';
const ms = {
  code: 'MS-ETS1-2', scope: 'Supports comparing designs using agreed criteria; this mission alone does not establish mastery.',
  url: 'https://www.nextgenscience.org/pe/ms-ets1-2-engineering-design'
};
const hs = {
  code: 'HS-ETS1-3', scope: 'Supports evaluating tradeoffs. A full real-world investigation needs additional student-generated evidence and impact analysis.',
  url: 'https://www.nextgenscience.org/pe/hs-ets1-3-engineering-design'
};
const part = (action, reference) => ({ action, reference });
const step = (title, action, { reference, practiceAction, notebookPartIds, parts = {} } = {}) => ({
  title, action, reference, practiceAction, notebookPartIds, parts
});

const designs = [
  {
    missionId: 'thalassa-wind-survey', routeId: 'guided', recommendedGrades: '6–8',
    objective: 'Use energy evidence to recommend a station power plan.',
    role: 'You are the station’s energy investigator.',
    situation: 'Two teams need your help choosing a power plan for Thalassa.',
    decision: 'Recommend a plan, or explain what you need to measure first.',
    routeNote: 'A made-up week helps us test a method. It is not a real weather record.',
    ngss: [ms],
    steps: {
      'evidence-check': step('Check the data', 'Open the wind record and find its source label.', {
        reference: 'A synthetic record is made for learning. A calculated result comes from a rule or formula.',
        parts: { 'data-quality': part('Describe what is made up, what the model assumes, and one missing observation.', 'An observation is a measurement someone actually collects. Do not relabel this fictional week as an observation.') }
      }),
      'agree-criteria': step('Choose your priorities', 'Read the energy, mass and deck-space limits in the plan cards.', {
        reference: 'A constraint is a limit. A priority tells us what matters most when several plans meet the limits.',
        parts: { criteria: part('Record the limits and your top priority.', 'Discuss the criteria with your coach or group. Working alone? Label your criteria “proposed”.') }
      }),
      hours: step('Count the hours', 'Add the hours from all five wind bands.', {
        practiceAction: 'Enter the total number of hours.', notebookPartIds: [],
        reference: 'Include hours with no power. The full record is the comparison time.'
      }),
      'full-power': step('Weight each band', 'For each band, multiply its hours by its output fraction. Add the products.', {
        practiceAction: 'Enter the equivalent full-power hours.', notebookPartIds: [],
        reference: 'Equivalent full-power hours describe the same energy as running at rated power for that many hours.'
      }),
      'capacity-factor': step('Find the energy ratio', 'Divide full-power hours by total hours.', {
        practiceAction: 'Enter the ratio to two decimal places.',
        reference: 'Capacity factor compares actual modeled energy with continuous rated output over the same time.',
        parts: { 'weighted-results': part('Record each band’s contribution, both totals, and the raw and rounded ratios.', 'Use hours for time. The ratio has no unit. Keep the raw ratio separate from the planning value rounded to two decimal places.') }
      }),
      'why-not-average': step('Explain the method', 'Why could using one average wind speed change the energy estimate?', {
        notebookPartIds: [], reference: 'Output does not rise in a straight line with wind speed in this model. Each band contributes differently.'
      }),
      'use-it': step('Compare the plans', 'Use planning capacity factor 0.34 to compare Plan A and Plan B.', {
        reference: 'Daily margin = daily energy supplied − daily energy needed. A positive margin alone does not prove power is available every hour.',
        parts: { 'plan-comparison': part('Record each plan’s base supply, margin, mass, area and whether it meets every limit.', 'Use the authored plan cards. Leave the lower-wind columns for the next action; no simulation is required.') }
      }),
      'stress-check': step('Test less wind', 'Change only the capacity factor to 0.20. Keep the other inputs the same.', {
        reference: 'Changing one input helps reveal how a decision depends on that assumption. This test is not a forecast.',
        parts: { 'plan-comparison': part('Add each plan’s lower-wind supply and energy shortfall to your comparison.', 'Compare each supply with the same demand. A shortfall is the amount still needed.') }
      }),
      reflect: step('Make your recommendation', 'Use your priorities and comparison to make a provisional choice.', {
        reference: 'Provisional means your decision may change when new evidence arrives.',
        parts: {
          recommendation: part('Choose Plan A, Plan B, or more evidence. Explain using your priority and a numerical comparison.', 'There is no universal best plan. Make your reasoning visible.'),
          'limitations-next-measurement': part('Explain one limit of the daily totals and name a useful next measurement.', 'An hourly supply-and-demand record could test reliability. Daily totals cannot establish nighttime coverage.')
        }
      })
    }
  },
  {
    missionId: 'spacecraft-journey', routeId: 'guided', recommendedGrades: '6–8',
    objective: 'Compare travel concepts using rates, units and mission limits.',
    role: 'You are an expedition planner.',
    situation: 'Your team is planning an instrument delivery to Ignis.',
    decision: 'Recommend a concept that fits the teaching case, or request more evidence.',
    routeNote: 'Timing case: use the supplied constant rates. These are not real flight predictions.',
    ngss: [ms],
    steps: {
      'agree-criteria': step('Set the mission priorities', 'Read the 80-day arrival limit and 400 kg food limit.', {
        parts: { criteria: part('Record both limits and the priority you propose or agree with your coach.', 'Consider arrival time and the qualitative propellant assumption. The cards do not supply measured propellant masses.') }
      }),
      compare: step('Compare the rates', 'Find the concept with the greatest supplied average speed.', {
        notebookPartIds: [], reference: 'Compare only the values in this timing case. A real engine’s name does not determine its flight time.'
      }),
      seconds: step('Calculate the travel time', 'Divide 72,000,000 km by 20 km/s.', {
        notebookPartIds: [], practiceAction: 'Enter the chemical concept’s time in seconds.',
        reference: 'Time = distance ÷ speed. Kilometres cancel, leaving seconds.'
      }),
      days: step('Convert to days', 'Divide the travel time in seconds by 86,400 seconds per day.', {
        notebookPartIds: [], practiceAction: 'Enter the time in days to one decimal place.',
        reference: 'Report travel time to one decimal place. Later, round provision days upward so a partial day is covered.'
      }),
      food: step('Plan the allocation', 'Multiply 1.8 kg × 3 people × 42 provision days.', {
        notebookPartIds: [], practiceAction: 'Enter the fictional food allocation in kg.',
        reference: 'Use the rounded-up provision days. This supplied value is for the fictional problem.'
      }),
      'compare-options': step('Check all three concepts', 'Repeat the calculations for chemical, ion and sail concepts.', {
        parts: { comparison: part('Compare travel days, provision days, food and both limits for each concept.', 'Keep the propellant card as a qualitative assumption. It does not justify a numerical mass ranking.') }
      }),
      'route-plan': step('Show the journey', 'Show station → transit → instrument delivery.', {
        parts: { 'route-plan': part('Use a diagram or words to show the ordered route and identify the timing case.', 'Both formats need the same reasoning: the route order and the constant-rate assumption.') }
      }),
      reflect: step('Recommend a concept', 'Explain which feasible concept you prefer, or what evidence is missing.', {
        parts: { recommendation: part('Use calculated numbers, one tradeoff, a backup action and one model limit.', 'A backup action says what you would check or change if a problem occurs. Avoid claiming these rates predict an actual mission.') }
      })
    }
  },
  {
    missionId: 'spacecraft-journey', routeId: 'advanced', recommendedGrades: '9–11',
    objective: 'Evaluate mass, time and power tradeoffs while identifying what the model leaves out.',
    role: 'You are the expedition’s systems investigator.',
    situation: 'Your team must compare two designs under limited mass, time and panel area.',
    decision: 'Make a conditional recommendation and identify evidence that could change it.',
    routeNote: 'Mass-and-power case: ion duration is a separate 140-day input. Do not use the timing case’s 69.4 days.',
    ngss: [hs],
    steps: {
      'agree-criteria': step('Prioritize the limits', 'Read the limits: 150 days, 21,000 kg represented added mass and 260 m² ion-panel area.', {
        parts: { criteria: part('Record all limits and explain how you rank time, represented mass and unknown system risks.', 'Represented added mass is only the modeled propellant-and-supplies ledger. It is not total launch mass.') }
      }),
      'chem-propellant': step('Model chemical propellant', 'Use the supplied ideal rocket equation with chemical Isp = 450 s.', {
        notebookPartIds: [], practiceAction: 'Enter propellant mass rounded to the nearest 10 kg.',
        reference: 'Use dry mass 12,000 kg, Δv = 4,200 m/s and g₀ = 9.81 m/s². The full equation is in the task reference. A scientific calculator is appropriate.'
      }),
      'ion-propellant': step('Model ion propellant', 'Repeat the ideal equation with ion Isp = 3,000 s.', {
        notebookPartIds: [], practiceAction: 'Enter propellant mass rounded to the nearest 10 kg.',
        reference: 'Keep the dry mass, Δv and g₀ unchanged. This model alone does not tell us thrust or travel time.'
      }),
      supplies: step('Compare supplies', 'Calculate supplies for 42 days and 140 days using 5.3 kg per person per day and three people.', {
        notebookPartIds: [], practiceAction: 'Enter the extra supply mass for the ion case.',
        reference: 'Find each case’s allocation, then subtract chemical from ion. The 140-day input belongs only to this mass-and-power case.'
      }),
      panels: step('Size the propulsion panels', 'Use the supplied flux and efficiency to find electrical power per square metre.', {
        notebookPartIds: [], practiceAction: 'Find the area needed for 30,000 W. Enter the nearest whole m².',
        reference: 'Flux = 1,200 ÷ 1.6² W/m². Multiply by 0.25 efficiency. Then area = required power ÷ electrical power per m². This covers propulsion only.'
      }),
      'compare-solutions': step('Build the partial ledger', 'For each design, combine modeled propellant and supplies.', {
        parts: { comparison: part('Record the calculations and check time, represented mass and panel-area limits.', 'Label the sum “partial ledger”. Spacecraft hardware, common loads and other mission systems are omitted.') }
      }),
      'earth-transfer': step('Check real engineering', 'Read the NASA Dawn and solar-power references.', {
        parts: { 'earth-transfer': part('Connect a NASA principle to this case. Explain which real engineering and stakeholder evidence is still missing.', 'Include cost, safety, reliability and social or environmental concerns. Identify evidence needed; do not invent impact scores or claim a real crewed mission is validated.') }
      }),
      'route-plan': step('Label your scenario', 'Show the route and the independent 140-day ion assumption.', {
        parts: { 'route-plan': part('Use a diagram or words to identify the mass-and-power case and its durations.', 'This is a separate teaching case from the constant-rate journey. The two ion times are not interchangeable.') }
      }),
      reflect: step('Defend a conditional choice', 'Use your priorities and ledger to recommend a design provisionally.', {
        parts: { recommendation: part('Explain a numerical tradeoff, a condition that could reverse your choice and the next check you would make.', 'A strong argument can acknowledge uncertainty. Choosing “more evidence needed” is reasonable when you explain which evidence and why.') }
      })
    }
  }
];

function freezeDeep(value) {
  Object.freeze(value);
  for (const child of Object.values(value)) if (child && typeof child === 'object' && !Object.isFrozen(child)) freezeDeep(child);
  return value;
}

export const MISSION_LEARNING_DESIGNS = freezeDeep(designs.map(design => ({
  presentationVersion: LEARNING_DESIGN_VERSION, bundleContentSha256: CONTENT_SHA, missionVersion: VERSION, ...design
})));

/** Require mission, route, version and reviewed content hash; unknown content falls back to its own authored copy. */
export function getMissionLearningDesign(missionId, routeId, missionVersion, bundleContentSha256) {
  return MISSION_LEARNING_DESIGNS.find(design => design.missionId === missionId && design.routeId === routeId
    && design.missionVersion === missionVersion && design.bundleContentSha256 === bundleContentSha256) || null;
}
