/**
 * "How to play" content for Project Hex-Grid: idea starters per role.
 *
 * Each starter names one change and the number to watch, but never the answer -
 * the learner still predicts which way it will go. `apply` performs the change
 * on a city; the UI never calls it (the learner makes the change themselves on
 * the map). It exists so tests/hex-grid-model.test.js can prove every starter
 * really moves its number in the starter city (or, for `surprise` ideas, that
 * it genuinely does not - those are the lesson), and so the worked example is
 * calculated by the model rather than written by hand.
 */

const firstHex = (city, type) => city.hexes.find((h) => h.type === type);
const withHex = (city, match, patch) => ({
  ...city,
  hexes: city.hexes.map((h) => (h === match ? { q: h.q, r: h.r, ...patch } : h))
});
const withParam = (city, key, value) => ({ ...city, params: { ...city.params, [key]: value } });
/** The first open-deck hex; in the starter city it does not touch any housing. */
const openHex = (city) => city.hexes.find((h) => h.type === 'open');

export const IDEAS = {
  livestock: [
    { change: 'Swap the hens for tilapia fish tanks', metric: 'tilt', hint: 'Fish tanks are full of water. Where on the city is that hex?',
      apply: (c) => withHex(c, firstHex(c, 'livestock'), { type: 'livestock', animal: 'tilapia' }) },
    { change: 'Ship in 5,000 kg of animal feed a day (setting)', metric: 'animalProteinKgDay', hint: 'The hens are hungry right now.',
      apply: (c) => withParam(c, 'importFeedKgDay', 5000) },
    { change: 'Swap the hens for meat chickens', metric: 'feedMet', hint: 'Compare how much each animal eats (feed conversion).',
      apply: (c) => withHex(c, firstHex(c, 'livestock'), { type: 'livestock', animal: 'broiler' }) }
  ],
  agriculture: [
    { change: 'Turn a rice farm into sweet potato', metric: 'kcalCoverage', hint: 'Compare the yields in the hex panel.',
      apply: (c) => withHex(c, c.hexes.find((h) => h.type === 'farm' && h.crop === 'rice'), { type: 'farm', crop: 'sweetPotato' }) },
    { change: 'Add a hydroponics hex on open deck', metric: 'energyCoverage', hint: 'More food - but what does it cost?',
      apply: (c) => withHex(c, openHex(c), { type: 'hydro' }) },
    { change: 'Set harvests per year from 2 to 3 (setting)', metric: 'kcalCoverage', hint: 'Is 3 harvests realistic in Thailand? Research it.',
      apply: (c) => withParam(c, 'harvestsPerYear', 3) }
  ],
  nutrition: [
    { change: 'Change "How active people are" to Active (setting)', metric: 'kcalCoverage', hint: 'Active bodies burn more food energy.',
      apply: (c) => withParam(c, 'activity', 'high') },
    { change: 'Raise the population from 500 to 800 (setting)', metric: 'proteinCoverage',
      apply: (c) => withParam(c, 'population', 800) },
    { change: 'Remove the sports court (make it open deck)', metric: 'exerciseCoverage', hint: 'WHO: 60 min a day for young people.',
      apply: (c) => withHex(c, firstHex(c, 'sports'), { type: 'open' }) }
  ],
  waste: [
    { change: 'Add a second biogas digester on open deck', metric: 'biogasKWh', hint: 'Is there enough food waste to fill two?', surprise: true,
      apply: (c) => withHex(c, openHex(c), { type: 'biogas' }) },
    { change: 'Raise the recyclable share of rubbish to 45% (setting)', metric: 'wasteManaged', hint: 'Better sorting at home.',
      apply: (c) => withParam(c, 'recyclableShare', 0.45) },
    { change: 'Remove the recycling centre (make it open deck)', metric: 'wasteManaged',
      apply: (c) => withHex(c, firstHex(c, 'recycling'), { type: 'open' }) }
  ],
  entertainment: [
    { change: 'Raise video to archive from 2,000 to 20,000 hours (setting)', metric: 'archiveKWh', hint: 'Video takes far more space than audio.',
      apply: (c) => withParam(c, 'archiveVideoHours', 20000) },
    { change: 'Remove the studio hex', metric: 'energySurplus',
      apply: (c) => withHex(c, firstHex(c, 'studio'), { type: 'open' }) },
    { change: 'Add a second studio on open deck', metric: 'cultureSpace',
      apply: (c) => withHex(c, openHex(c), { type: 'studio' }) }
  ],
  energy: [
    { change: 'Turn on solar panels on housing roofs (setting)', metric: 'energyCoverage', hint: 'Roofs are free space - but check the weight too.',
      apply: (c) => withParam(c, 'rooftopSolar', true) },
    { change: 'Add a second battery store on open deck', metric: 'nightCoverage', hint: 'A battery can only store spare daytime power.', surprise: true,
      apply: (c) => withHex(c, openHex(c), { type: 'battery' }) },
    { change: 'Add a solar farm on open deck', metric: 'nightCoverage',
      apply: (c) => withHex(c, openHex(c), { type: 'solar' }) }
  ],
  infrastructure: [
    { change: 'Change the platform material to concrete (setting)', metric: 'maxLoad', hint: 'Concrete is ~2.5× denser than HDPE plastic.',
      apply: (c) => withParam(c, 'material', 'concrete') },
    { change: 'Make the pontoons 3.5 m deep (setting)', metric: 'maxLoad', hint: 'Archimedes: more water pushed aside…',
      apply: (c) => withParam(c, 'pontoonDepth', 3.5) },
    { change: 'Build one housing hex up from 3 to 6 floors', metric: 'overloaded',
      apply: (c) => withHex(c, firstHex(c, 'housing'), { type: 'housing', floors: 6 }) }
  ],
  wellbeing: [
    { change: 'Give everyone 50 m² of home instead of 20 (setting)', metric: 'housingShortfall', hint: 'Space per person vs. homes available.',
      apply: (c) => withParam(c, 'm2PerPerson', 50) },
    { change: 'Turn an open hex into a park', metric: 'greenPerPerson',
      apply: (c) => withHex(c, openHex(c), { type: 'park' }) },
    { change: 'Move the biogas digester away from the homes', metric: 'nuisanceHomes', hint: 'Use the "Smell & noise" map view: how many plants does each home touch?', surprise: true,
      apply: (c) => {
        const b = firstHex(c, 'biogas');
        const far = c.hexes.find((h) => h.type === 'open' && h.q === 1 && h.r === -3) || openHex(c);
        return withHex(withHex(c, b, { type: 'open' }), far, { type: 'biogas' });
      } }
  ]
};

/** The worked example on the guide page: calculated live, never typed in. */
export const WORKED_EXAMPLE = {
  role: 'infrastructure',
  idea: IDEAS.infrastructure[0],
  prediction: 'increase',
  because: 'Concrete is about 2.5 times denser than plastic, so the platform uses up more of its own floating power.'
};
