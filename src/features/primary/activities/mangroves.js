/**
 * Junior Explorers - Activity 4: Mangroves vs Waves.
 *
 * The primary version of Bangkok Coastal. A sand beach in a tray, waves made
 * by hand, and sticks standing in for mangrove roots. Children see for
 * themselves that roots hold the sand, and that a thicker forest holds more.
 * The beach must be rebuilt the same way before every test (a fair test).
 */
import { rankChoice } from '../engine/investigationModel.js';

const TRAY_SAFETY = [
  'Wipe up spills so nobody slips.',
  'Keep sand away from your eyes.',
  'Wash your hands after touching sand.'
];

const WASH_ORDER = ['none', 'little', 'lots'];
const washField = {
  id: 'washed', kind: 'choice', label: 'How much sand washed away?',
  options: [
    { id: 'none', label: 'None', icon: '🏖️' },
    { id: 'little', label: 'A little', icon: '🤏' },
    { id: 'lots', label: 'Lots', icon: '🌊' }
  ]
};
const drawField = { id: 'drawing', kind: 'draw', label: 'Draw the beach after the waves' };
const label = (id) => washField.options.find((o) => o.id === id)?.label || id;

/** One fair wave test: same beach, same ruler, same 10 waves. */
const waveTest = (label, icon, setup) => [
  { icon: '🏖️', text: `${label}: build a smooth sand slope.` },
  { icon, text: setup },
  { icon: '🌊', text: 'Push a ruler in the water to make 10 waves.' },
  { icon: '👀', text: 'Look at the beach. Tap how much washed away.' }
];


export const MANGROVES = {
  id: 'mangroves',
  number: 4,
  icon: '🌊',
  colour: '#a855f7',
  title: 'Mangroves vs Waves',
  short: 'Make waves in a sand tray. Do "mangroves" stop the sand washing away?',
  kit: 'a deep tray, damp sand, water, sticks or lolly sticks, a ruler',
  story: 'Waves can wash beaches away. Mangrove trees grow along the coast near Bangkok. Their roots stand in the water. Do they protect the land?',
  standards: ['NGSS 2-ESS2-1 (proposed)', 'NGSS K-2-ETS1-3 (proposed)'],
  investigations: [
    {
      id: 'beach',
      kind: 'build',
      icon: '🏖️',
      title: 'Build your beach',
      short: 'Make a sand beach and a sea in a tray.',
      needs: [
        { icon: '🗃️', label: 'A deep plastic tray' },
        { icon: '🏖️', label: 'Damp sand' },
        { icon: '💧', label: 'A jug of water' },
        { icon: '🧻', label: 'Towels for spills' }
      ],
      safety: TRAY_SAFETY,
      steps: [
        { icon: '🏖️', text: 'Pile damp sand at one end of the tray.' },
        { icon: '✋', text: 'Pat it into a smooth slope, like a beach.' },
        { icon: '💧', text: 'Pour water slowly into the other end.' },
        { icon: '👀', text: 'Stop when the water just touches the sand.' }
      ],
      samples: [{ id: 'beach', label: 'My beach', icon: '🏖️' }],
      fields: [
        {
          id: 'ready', kind: 'choice', label: 'Is your beach ready?',
          options: [
            { id: 'yes', label: 'Smooth slope and water', icon: '✅' },
            { id: 'slides', label: 'The sand keeps sliding', icon: '↘️' }
          ]
        },
        { id: 'drawing', kind: 'draw', label: 'Draw your beach' }
      ],
      wordBank: ['sand', 'beach', 'slope', 'sea', 'water', 'coast'],
      scientists: 'Where the land meets the sea is called the coast. Waves move sand along the coast every day.',
      newWords: [{ word: 'Coast', meaning: 'Where the land meets the sea.' }]
    },

    {
      id: 'roots',
      icon: '🌿',
      title: 'Do roots help?',
      short: 'A beach with no roots, and a beach with roots.',
      question: 'Will "mangrove roots" stop the sand washing away?',
      guessPrompt: 'I think less sand will wash away…',
      options: [
        { id: 'bare', label: 'With no roots', icon: '🏖️' },
        { id: 'roots', label: 'With roots', icon: '🌿' },
        { id: 'same', label: 'Both the same', icon: '⚖️' }
      ],
      guessSentence: (o) => (o.id === 'same'
        ? 'I think the same sand will wash away both times.'
        : `I think less sand will wash away ${o.label.toLowerCase()}.`),
      needs: [
        { icon: '🏖️', label: 'Your sand beach' },
        { icon: '🥢', label: '10 sticks for mangrove roots' },
        { icon: '📏', label: 'A ruler to make waves' }
      ],
      safety: TRAY_SAFETY,
      steps: [
        ...waveTest('Test 1', '🚫', 'Leave the beach bare, with no sticks.'),
        ...waveTest('Test 2', '🥢', 'Push 10 sticks into the sand at the water.')
      ],
      samples: [
        { id: 'bare', label: 'No roots', icon: '🏖️' },
        { id: 'roots', label: 'With roots', icon: '🌿' }
      ],
      fields: [washField, drawField],
      wordBank: ['waves', 'roots', 'mangrove', 'sand', 'washed', 'protect', 'erosion'],
      judge(obs) {
        return rankChoice(obs, this.samples, 'washed', {
          order: WASH_ORDER, want: 'least', optionLabel: label, noun: 'Sand washed away -'
        });
      },
      scientists: 'Mangrove roots slow the waves down and hold the mud and sand in place. Planting mangroves is one way to protect coasts from waves.',
      newWords: [{ word: 'Erosion', meaning: 'When water or wind carries land away.' }]
    },

    {
      id: 'forest',
      icon: '🌳',
      title: 'Thin or thick forest?',
      short: 'Do more roots protect more?',
      question: 'Does a thicker mangrove forest protect the beach better?',
      guessPrompt: 'I think less sand will wash away with…',
      options: [
        { id: 'few', label: '3 sticks', icon: '🥢' },
        { id: 'many', label: '15 sticks', icon: '🌳' },
        { id: 'same', label: 'No difference', icon: '⚖️' }
      ],
      guessSentence: (o) => (o.id === 'same'
        ? 'I think the number of sticks will make no difference.'
        : `I think less sand will wash away with ${o.label.toLowerCase()}.`),
      needs: [
        { icon: '🏖️', label: 'Your sand beach' },
        { icon: '🥢', label: '15 sticks' },
        { icon: '📏', label: 'A ruler to make waves' }
      ],
      safety: TRAY_SAFETY,
      steps: [
        ...waveTest('Test 1', '🥢', 'Push 3 sticks into the sand at the water.'),
        ...waveTest('Test 2', '🌳', 'Push 15 sticks into the sand at the water.')
      ],
      samples: [
        { id: 'few', label: '3 sticks', icon: '🥢' },
        { id: 'many', label: '15 sticks', icon: '🌳' }
      ],
      fields: [washField, drawField],
      wordBank: ['thick', 'thin', 'forest', 'roots', 'more', 'less', 'protect'],
      judge(obs) {
        return rankChoice(obs, this.samples, 'washed', {
          order: WASH_ORDER, want: 'least', optionLabel: label, noun: 'Sand washed away -'
        });
      },
      scientists: 'A wide, thick mangrove forest slows waves more than a thin line of trees. Scientists protect and replant mangroves to keep them thick.',
      newWords: [{ word: 'Protect', meaning: 'To keep something safe from harm.' }]
    }
  ]
};
