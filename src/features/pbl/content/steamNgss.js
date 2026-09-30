/**
 * The STEAM activities as the EXPLORE phase of the term, each aligned to NGSS
 * and assessed with a three-dimensional rubric (practice, core idea,
 * crosscutting concept, plus engineering design where the activity is a
 * design task).
 *
 * Performance expectation codes and dimension names follow the NGSS (2013).
 * `title` is our short paraphrase for the card, not the official PE wording -
 * teachers should read the full PE on nextgenscience.org when planning.
 *
 * The rubric levels are shared (RUBRIC_LEVELS x DIMENSION_DESCRIPTORS); what
 * changes per activity is the `lookFor` line - what that dimension looks like
 * in THIS activity. A coach scores against the level, guided by the look-for.
 */

export const RUBRIC_LEVELS = [
  { score: 1, label: 'Emerging' },
  { score: 2, label: 'Developing' },
  { score: 3, label: 'Proficient' },
  { score: 4, label: 'Extending' }
];

export const DIMENSIONS = {
  sep: { label: 'Science & Engineering Practice', short: 'SEP' },
  dci: { label: 'Disciplinary Core Idea', short: 'DCI' },
  ccc: { label: 'Crosscutting Concept', short: 'CCC' },
  ets: { label: 'Engineering Design', short: 'ETS' }
};

/** Level descriptors per dimension, indexed like RUBRIC_LEVELS. */
export const DIMENSION_DESCRIPTORS = {
  sep: [
    'Uses the practice only with step-by-step guidance; the work is incomplete or has major errors.',
    'Uses parts of the practice independently; some steps are missing or not justified.',
    'Uses the practice independently and accurately to answer the question or solve the problem.',
    'Uses the practice independently, justifies each choice, and improves the method or explains its limits.'
  ],
  dci: [
    'Recalls words or isolated facts but cannot yet use the idea to explain what happened.',
    'Explains using the core idea, with some gaps or misconceptions.',
    'Uses the core idea accurately to explain or predict what was observed.',
    'Applies the core idea to a new situation, or links it to another core idea.'
  ],
  ccc: [
    'Does not yet notice the concept in the activity.',
    'Identifies the concept when prompted.',
    'Uses the concept to organise an explanation or a design decision.',
    'Uses the concept to connect this activity to other phenomena or to their own project.'
  ],
  ets: [
    'Builds without stated criteria and does not test.',
    'States criteria and constraints; tests once.',
    'Tests against the criteria and uses the data to choose or improve a design.',
    'Iterates systematically, compares competing designs with data, and justifies the trade-offs.'
  ]
};

/**
 * Keyed by activity id (activityHost.js). `bridge` says what the activity gives
 * a learner's own project - the reason it sits in the Explore phase.
 */
export const STEAM_NGSS = {
  phase1: {
    pes: [
      { code: 'MS-ESS3-3', title: 'Design a method to monitor and minimise a human impact on the environment' },
      { code: 'HS-ESS3-4', title: 'Evaluate or refine a solution that reduces human impacts on natural systems' }
    ],
    rubric: {
      sep: { name: 'Constructing Explanations and Designing Solutions', lookFor: 'Chooses cooling measures and explains, with the temperature results, why they worked within the budget.' },
      dci: { name: 'ESS3.C Human Impacts on Earth Systems', lookFor: 'Explains how surfaces, trees and buildings change how much heat a city holds.' },
      ccc: { name: 'Cause and Effect', lookFor: 'Links each change (a cool roof, more trees) to its measured effect on temperature.' },
      ets: { name: 'ETS1.B Developing Possible Solutions', lookFor: 'Compares at least two plans against cost and cooling before choosing one.' }
    },
    bridge: 'Measuring a human impact and designing within a budget.'
  },
  bunker: {
    pes: [
      { code: 'MS-ETS1-1', title: 'Define the criteria and constraints of a design problem' },
      { code: 'MS-ETS1-2', title: 'Evaluate competing design solutions against criteria' },
      { code: 'MS-ESS3-2', title: 'Use data on natural hazards to inform technologies that reduce their effects' }
    ],
    rubric: {
      sep: { name: 'Asking Questions and Defining Problems', lookFor: 'States what the shelter must survive and what limits the design (materials, space, cost).' },
      dci: { name: 'ESS3.B Natural Hazards', lookFor: 'Explains how the chosen disaster threatens people and which features protect against it.' },
      ccc: { name: 'Structure and Function', lookFor: 'Explains how the shape and materials of each part let it do its job.' },
      ets: { name: 'ETS1.A Defining and Delimiting Engineering Problems', lookFor: 'Uses the criteria to reject at least one weaker design, with reasons.' }
    },
    bridge: 'Writing criteria and constraints - the Define phase in miniature.'
  },
  coding: {
    pes: [
      { code: 'MS-ETS1-4', title: 'Develop a model to generate data for iterative testing and modification of a design' }
    ],
    note: 'NGSS has no computing standards. Pair this activity with your computing framework for coding skills; NGSS covers the testing and modelling.',
    rubric: {
      sep: { name: 'Using Mathematics and Computational Thinking', lookFor: 'Writes a program that reads a sensor, uses the values, and changes behaviour with conditions or loops.' },
      dci: { name: 'ETS1.C Optimizing the Design Solution', lookFor: 'Changes the program based on what the test runs showed.' },
      ccc: { name: 'Systems and System Models', lookFor: 'Describes the device as input, processing and output, and how the parts interact.' },
      ets: { name: 'ETS1.B Developing Possible Solutions', lookFor: 'Tests the code on the device, records what happened, and fixes at least one bug.' }
    },
    bridge: 'The coding and sensor skills most prototypes need.'
  },
  bangkok: {
    pes: [
      { code: 'MS-ESS3-2', title: 'Analyse data on natural hazards to inform mitigation technologies' },
      { code: 'HS-ESS3-1', title: 'Explain how resources, natural hazards and climate change have influenced human activity' }
    ],
    rubric: {
      sep: { name: 'Analyzing and Interpreting Data', lookFor: 'Uses sea-level and flooding data to justify where protection is needed most.' },
      dci: { name: 'ESS3.B Natural Hazards', lookFor: 'Explains why coastal Bangkok floods and how mangroves or barriers reduce it.' },
      ccc: { name: 'Stability and Change', lookFor: 'Describes what changes over time on the coast and what keeps it stable.' },
      ets: { name: 'ETS1.B Developing Possible Solutions', lookFor: 'Weighs natural and engineered defences against each other, with evidence.' }
    },
    bridge: 'Reading real data and weighing solutions for a community.'
  },
  solar: {
    pes: [
      { code: 'MS-PS3-1', title: 'Relate kinetic energy to mass and speed using graphs of data' },
      { code: 'MS-ETS1-3', title: 'Analyse test data to find the best features of several designs' },
      { code: 'HS-PS3-3', title: 'Design, build and refine a device that converts one form of energy to another' }
    ],
    rubric: {
      sep: { name: 'Planning and Carrying Out Investigations', lookFor: 'Measures the real car with repeated timed runs and changes one variable at a time.' },
      dci: { name: 'PS3.B Conservation of Energy and Energy Transfer', lookFor: 'Traces energy from sunlight to electrical to motion and explains where it is lost.' },
      ccc: { name: 'Energy and Matter', lookFor: 'Uses energy flow to explain why a change (gearing, mass, panel angle) helped or hurt.' },
      ets: { name: 'ETS1.C Optimizing the Design Solution', lookFor: 'Uses the measured results to decide the next change, then re-tests.' }
    },
    bridge: 'Measuring a real build and improving it with data.'
  },
  so2: {
    pes: [
      { code: 'HS-PS1-5', title: 'Explain how temperature and concentration affect reaction rate' },
      { code: 'MS-PS1-2', title: 'Use data on properties before and after substances interact to identify a reaction' }
    ],
    rubric: {
      sep: { name: 'Developing and Using Models', lookFor: 'Runs the model with a plan, changes one input at a time, and states what the model cannot show.' },
      dci: { name: 'PS1.B Chemical Reactions', lookFor: 'Explains how the catalyst changes the rate of SO₂ turning into sulfate.' },
      ccc: { name: 'Scale, Proportion, and Quantity', lookFor: 'Explains why nanoparticle size and surface area matter to the reaction.' }
    },
    bridge: 'Using a computer model to test ideas you cannot test by hand.'
  },
  plants: {
    pes: [
      { code: 'MS-LS1-1', title: 'Provide evidence that living things are made of cells' },
      { code: 'MS-LS1-6', title: 'Explain the role of photosynthesis in cycling matter and energy' }
    ],
    rubric: {
      sep: { name: 'Planning and Carrying Out Investigations', lookFor: 'Prepares slides, observes under the microscope and records what was seen accurately.' },
      dci: { name: 'LS1.A Structure and Function', lookFor: 'Identifies cells and stomata and explains what they do for the plant.' },
      ccc: { name: 'Structure and Function', lookFor: 'Connects the shape of a structure (a stoma, a cell wall) to its job.' }
    },
    bridge: 'Careful observation and recording - the habit behind good evidence.'
  },
  hexgrid: {
    pes: [
      { code: 'HS-ESS3-3', title: 'Simulate how resource management, population and biodiversity interact' },
      { code: 'HS-ETS1-4', title: 'Use a computer simulation to model the impact of proposed solutions' }
    ],
    rubric: {
      sep: { name: 'Using Mathematics and Computational Thinking', lookFor: 'States a hypothesis, runs the simulation to test it, and reports the numbers honestly.' },
      dci: { name: 'ESS3.C Human Impacts on Earth Systems', lookFor: 'Explains the trade-offs between energy, food and waste in the floating city.' },
      ccc: { name: 'Systems and System Models', lookFor: 'Explains how changing one part of the city affects the others.' },
      ets: { name: 'ETS1.B Developing Possible Solutions', lookFor: 'Compares team layouts using the model and justifies the chosen one.' }
    },
    bridge: 'Testing a hypothesis in a model before building - a full mini-project.'
  }
};

export const ngssFor = (activityId) => STEAM_NGSS[activityId] || null;
