/**
 * The three Townsville districts a learner can choose to redesign.
 *
 * Each one asks a different design question, so a class that splits across
 * them has something real to compare at the end:
 *   City Heart  - retrofit: you cannot move anyone, only change surfaces.
 *   Riverside   - greenfield: you place every home, so density is your choice.
 *   School Zone - one group of people (children) at one time of day (3 pm).
 *
 * The districts are fictional blocks of a real city. The street names in the
 * stories are there for colour, not as maps of real places.
 *
 * Layout letters are TILE_TYPES ids (urbanHeatModel.js). North is at the top;
 * the sea breeze arrives from the top-right corner.
 */
import { COLS, parseLayout } from './urbanHeatModel.js';

const row = (r) => Array.from({ length: COLS }, (_, c) => r * COLS + c);

export const SCENARIOS = [
  {
    id: 'city-heart',
    name: 'City Heart',
    emoji: '🏙️',
    kind: 'Retrofit',
    difficulty: 'Medium',
    story: 'Townsville\'s busiest shopping street is a heat trap. Shoppers, workers and bus riders walk it every afternoon in full sun, and the apartments above stay hot all night. The council wants it cooler - without moving a single resident.',
    question: 'How do you cool a street where every block is already taken?',
    focusLabel: 'the shopping street (row 2)',
    start: parseLayout([
      'BBHBBHBB',
      'RRRRRRRR',
      'BPBBHBPB',
      'BBPBBBBG',
      'RRRRRRRR',
      'BBBPPBBH'
    ]),
    focus: row(1),
    budget: 2800000,
    waterLimitKl: 40,
    minPeople: 1520,
    goals: [
      { id: 'walk', metric: 'focusFeels', target: 32, label: 'Make the shopping street feel 32 °C or less at 3 pm' },
      { id: 'night', metric: 'nightIsland', target: 1.2, label: 'Cut the 3 am heat island to 1.2 °C or less' },
      { id: 'district', metric: 'districtFeels', target: 36.5, label: 'Bring the whole district to 36.5 °C feels-like or less' }
    ]
  },
  {
    id: 'riverside',
    name: 'Riverside Rise',
    emoji: '🌾',
    kind: 'New suburb',
    difficulty: 'Open design',
    story: 'A paddock on the edge of Townsville will become a new suburb. One main road already crosses it, and a few old trees grow by the creek. You decide where every home, street and park goes - but 800 people need somewhere to live.',
    question: 'Spread-out houses or a few towers - which makes the cooler suburb?',
    focusLabel: 'the main road and bus stop (row 3)',
    start: parseLayout([
      'GGGGGGGG',
      'GGGGGGGG',
      'RRRRRRRR',
      'GGGGGGGG',
      'GGGGGGGG',
      'GGTTGGGG'
    ]),
    focus: row(2),
    budget: 2500000,
    waterLimitKl: 70,
    minPeople: 800,
    goals: [
      { id: 'walk', metric: 'focusFeels', target: 32, label: 'Make the walk to the bus stop feel 32 °C or less at 3 pm' },
      { id: 'night', metric: 'nightIsland', target: 0.8, label: 'Keep the 3 am heat island at 0.8 °C or less' },
      { id: 'district', metric: 'districtFeels', target: 36, label: 'Keep the whole suburb at 36 °C feels-like or less' }
    ]
  },
  {
    id: 'school-zone',
    name: 'Coral Coast School',
    emoji: '🏫',
    kind: 'Retrofit',
    difficulty: 'Starter',
    story: 'At 3 pm the bell rings and 240 children cross a black asphalt playground and a sunny car park to get home. Teachers have stopped running PE outside in Term 1. The P&C has raised money to fix it.',
    question: 'Where should the shade go so children are cool when they need it most?',
    focusLabel: 'the playground',
    start: parseLayout([
      'RRRRRRRR',
      'BBPPPPBB',
      'BBPPPPGG',
      'PPPPGGGG',
      'PPPPGGGG',
      'RRRRRRRR'
    ]),
    focus: [10, 11, 12, 13, 18, 19, 20, 21],
    budget: 1700000,
    waterLimitKl: 30,
    minPeople: 240,
    goals: [
      { id: 'walk', metric: 'focusFeels', target: 31, label: 'Make the playground feel 31 °C or less at 3 pm' },
      { id: 'night', metric: 'nightIsland', target: 0.9, label: 'Cut the 3 am heat island to 0.9 °C or less' },
      { id: 'district', metric: 'districtFeels', target: 37, label: 'Bring the whole school to 37 °C feels-like or less' }
    ]
  }
];

export const scenarioById = (id) => SCENARIOS.find((s) => s.id === id) || null;
