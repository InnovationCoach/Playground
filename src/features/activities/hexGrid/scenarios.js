/**
 * Hex-Grid scenarios opened from My Universe workstations. A scenario is a
 * separate project (its own save slot, so a learner's Bangkok city is never
 * touched), a set of starting values and a ladder of challenges whose checks
 * read the model's own metrics.
 *
 * DRAFT — awaiting educator review. Shown only in labelled previews until an
 * educator signs off (docs/universe-missions/THALASSA-STATION-REVIEW.md).
 *
 * World values are fictional and labelled. People's needs (food, water,
 * electricity per person) stay as the model's Earth data, and say so.
 * The model is a steady daily average: no tides, waves, storms or seasons.
 */
import { normaliseCity, starterCity, gridCells, hexKey } from './hexGridModel.js';
import { SCENARIO_INFO } from './scenarioInfo.js';

const fictional = (text) => ({ text, tag: 'fictional-world' });

export const THALASSA_STATION = {
  id: 'thalassa-station',
  version: '0.1.0-draft',
  status: SCENARIO_INFO['thalassa-station'].status,
  projectId: 'hex-grid-thalassa',
  title: 'Thalassa Research Station',
  subtitle: 'Build a floating home for 200 researchers on an ocean world.',
  brief: 'The research platform off Thalassa’s headland needs to grow into a small floating settlement. It must stay afloat, feed everyone, supply fresh water, treat wastewater and keep the lights on through the night.',
  worldValues: [
    fictional('200 researchers will live on the platform.'),
    fictional('Rainfall on Thalassa: about 1,800 mm a year.')
  ],
  windNote: 'Wind turbines make no power until you enter a capacity factor. Measure it at the Weather mast workstation, then type it into "Wind capacity factor (from your research)".',
  earthData: 'Food, water and electricity needed per person use the model’s Earth data (Thailand). Thalassa’s people are assumed to need the same.',
  params: { population: 200, rainMm: 1800, windCapacityFactor: null },
  // A small start: the transport hub and two housing blocks. Everything else is open deck to design.
  starter: { '0,0': { type: 'hub' }, '1,0': { type: 'housing', floors: 3 }, '-1,0': { type: 'housing', floors: 3 } },
  challenges: [
    {
      id: 'afloat', tier: 1, title: 'Keep it floating',
      goal: 'No platform is loaded past its safe limit.',
      check: (m) => m.overloaded === 0,
      measure: (m) => `${m.overloaded} platform${m.overloaded === 1 ? '' : 's'} overloaded`
    },
    {
      id: 'water', tier: 1, title: 'Water in, wastewater out',
      goal: 'Fresh water and wastewater treatment both at 100% or more.',
      check: (m) => m.waterCoverage >= 100 && m.wastewaterTreated >= 100,
      measure: (m) => `water ${pct(m.waterCoverage)} · wastewater ${pct(m.wastewaterTreated)}`
    },
    {
      id: 'day-power', tier: 2, title: 'Power the day',
      goal: 'Electricity made covers everything the city uses (100% or more).',
      check: (m) => m.energyCoverage >= 100,
      measure: (m) => `electricity ${pct(m.energyCoverage)}`
    },
    {
      id: 'food', tier: 2, title: 'Feed everyone',
      goal: 'Food energy and protein grown both reach 100% of what 200 people need.',
      check: (m) => m.kcalCoverage >= 100 && m.proteinCoverage >= 100,
      measure: (m) => `food energy ${pct(m.kcalCoverage)} · protein ${pct(m.proteinCoverage)}`
    },
    {
      id: 'night', tier: 3, title: 'Through the night',
      goal: 'Night-time power covered at 100% or more.',
      check: (m) => m.nightCoverage >= 100,
      measure: (m) => `night power ${pct(m.nightCoverage)}`
    },
    {
      id: 'all', tier: 3, title: 'The whole station at once',
      goal: 'Every challenge above met in the same design.',
      check: (m) => ['afloat', 'water', 'day-power', 'food', 'night'].every((id) => THALASSA_STATION.challenges.find((c) => c.id === id).check(m)),
      measure: () => 'all five together'
    }
  ],
  limitations: [
    'The model is a daily average: no tides, waves, storms or seasons. The tide gauge and weather on Thalassa are scenery, not part of this simulation.',
    'People’s needs use Earth (Thailand) data, not measurements of Thalassa.',
    'Platforms are checked one at a time; the connections between them are not.',
    'No money: nothing here says whether the station is affordable.'
  ]
};

const pct = (v) => (Number.isFinite(v) ? `${Math.round(v)}%` : '—');

export const SCENARIOS = { [THALASSA_STATION.id]: THALASSA_STATION };
export const scenarioById = (id) => (typeof id === 'string' && SCENARIOS[id]) || null;

/** The scenario's starting city: model defaults, the scenario's values, and its small starter layout. */
export function scenarioCity(scenario) {
  const base = starterCity();
  const hexes = gridCells().map(({ q, r }) => ({ q, r, ...(scenario.starter[hexKey(q, r)] || { type: 'open' }) }));
  return normaliseCity({ params: { ...base.params, ...scenario.params }, hexes });
}

/** Live challenge status from a simulation result. */
export function evaluateChallenges(scenario, sim) {
  const m = sim.metrics;
  return scenario.challenges.map((c) => ({ id: c.id, tier: c.tier, title: c.title, goal: c.goal, met: !!c.check(m), measure: c.measure(m) }));
}
