/**
 * Junior Explorers - Activity 1: Hot Spots in Our Playground.
 *
 * The primary version of Urban Heat. Children measure real temperatures around
 * school with a micro:bit and find out what makes a place hot (sun, hard ground,
 * dark colours) - the same ideas the secondary simulator models with cool
 * roofs and trees.
 *
 * The micro:bit's temperature is read from its processor, so it lags and is
 * warmed by hands. The steps say "wait 2 minutes" and "don't hold it" for that
 * reason. Every sentence the app says back is built from their readings.
 */
import { compareCounts, mostCount } from '../engine/investigationModel.js';

const OUTSIDE_SAFETY = [
  'Wear a hat and drink water outside.',
  'Stay where your teacher can see you.',
  'Do not touch very hot ground for long.'
];

const temp = (label = 'What does the micro:bit say?') => ({
  id: 'temp', kind: 'number', label, icon: '🌡️', unit: '°C', unitSpoken: 'degrees', start: 30, min: 0, max: 60
});
const drawField = { id: 'drawing', kind: 'draw', label: 'Draw the place' };

export const HOT_SPOTS = {
  id: 'hot-spots',
  number: 1,
  icon: '🌡️',
  colour: '#f97316',
  title: 'Hot Spots in Our Playground',
  short: 'Find the hottest and coolest places at school, then plan how to cool it down.',
  kit: 'micro:bit with the thermometer program',
  story: 'Cities can get much hotter than the countryside. Some places at school feel hot and some feel cool. Let\'s measure them with a micro:bit thermometer!',
  standards: ['NGSS K-PS3-1 (proposed)', 'NGSS K-PS3-2 (proposed)'],
  investigations: [
    {
      id: 'ready',
      kind: 'build',
      icon: '🔧',
      title: 'Get your thermometer ready',
      short: 'Check your micro:bit shows the temperature.',
      needs: [
        { icon: '🤖', label: 'A micro:bit with a battery pack' },
        { icon: '💾', label: 'The thermometer program from Activity 3' }
      ],
      safety: ['Hold the micro:bit by its edges.', 'Keep the battery pack dry.'],
      steps: [
        { icon: '🔋', text: 'Plug the battery pack into the micro:bit.' },
        { icon: '🅱️', text: 'Press button B to see the temperature.' },
        { icon: '⏳', text: 'Put it on your desk. Wait 2 minutes.' },
        { icon: '🅱️', text: 'Press B again and read the number.' }
      ],
      samples: [{ id: 'classroom', label: 'Our classroom', icon: '🏫' }],
      fields: [temp('Temperature in the classroom')],
      wordBank: ['temperature', 'degrees', 'warm', 'cool', 'number', 'micro:bit'],
      scientists: 'A thermometer tells us how hot or cold something is. We measure temperature in degrees Celsius, written °C.',
      newWords: [
        { word: 'Temperature', meaning: 'How hot or cold something is.' },
        { word: 'Degrees', meaning: 'The steps we count temperature in.' }
      ]
    },

    {
      id: 'sun-shade',
      icon: '🌳',
      title: 'Sun or shade?',
      short: 'Is it hotter in the sun or in the shade?',
      question: 'Is it hotter in the sun or in the shade?',
      guessPrompt: 'I think it will be hotter…',
      options: [
        { id: 'sun', label: 'In the sun', icon: '☀️' },
        { id: 'shade', label: 'In the shade', icon: '🌳' },
        { id: 'same', label: 'Both the same', icon: '⚖️' }
      ],
      guessSentence: (o) => (o.id === 'same'
        ? 'I think the sun and the shade will be the same.'
        : `I think it will be hotter ${o.label.toLowerCase()}.`),
      needs: [
        { icon: '🤖', label: 'Your micro:bit thermometer' },
        { icon: '🌳', label: 'A sunny spot and a shady spot' }
      ],
      safety: OUTSIDE_SAFETY,
      steps: [
        { icon: '☀️', text: 'Put the micro:bit on the ground in the sun.' },
        { icon: '✋', text: 'Do not hold it. Your hand warms it up.' },
        { icon: '⏳', text: 'Wait 2 minutes, then press B and read it.' },
        { icon: '🌳', text: 'Now do the same in the shade.' }
      ],
      samples: [
        { id: 'sun', label: 'In the sun', icon: '☀️' },
        { id: 'shade', label: 'In the shade', icon: '🌳' }
      ],
      fields: [temp(), drawField],
      wordBank: ['sun', 'shade', 'tree', 'hot', 'cool', 'warmer', 'cooler', 'degrees'],
      judge(obs) {
        return compareCounts(obs, {
          field: 'temp', a: this.samples[0], b: this.samples[1], tolerance: 0,
          results: { a: 'sun', b: 'shade', same: 'same' },
          text: (s, sh) => `In the sun it was ${s} °C. In the shade it was ${sh} °C.`
        });
      },
      scientists: 'Sunlight warms the ground and the air. Shade blocks the sunlight, so shady places stay cooler. Trees give shade and cool cities down.',
      newWords: [{ word: 'Shade', meaning: 'A place where something blocks the sunlight.' }]
    },

    {
      id: 'ground',
      icon: '🟫',
      title: 'Which ground is hottest?',
      short: 'Hard ground, grass or sand?',
      question: 'Which ground gets the hottest in the sun?',
      guessPrompt: 'I think the hottest ground will be…',
      options: [
        { id: 'hard', label: 'Hard ground', icon: '🧱' },
        { id: 'grass', label: 'Grass', icon: '🌱' },
        { id: 'sand', label: 'Sand', icon: '🏖️' }
      ],
      guessSentence: (o) => `I think the ${o.label.toLowerCase()} will be the hottest.`,
      needs: [
        { icon: '🤖', label: 'Your micro:bit thermometer' },
        { icon: '☀️', label: 'Hard ground, grass and sand, all in the sun' }
      ],
      safety: OUTSIDE_SAFETY,
      steps: [
        { icon: '🧱', text: 'Lay the micro:bit on hard ground in the sun.' },
        { icon: '⏳', text: 'Wait 2 minutes, then press B and read it.' },
        { icon: '🌱', text: 'Do the same on grass.' },
        { icon: '🏖️', text: 'Do the same on sand.' },
        { icon: '⚖️', text: 'Use the same sunny time for all three.' }
      ],
      samples: [
        { id: 'hard', label: 'Hard ground', icon: '🧱' },
        { id: 'grass', label: 'Grass', icon: '🌱' },
        { id: 'sand', label: 'Sand', icon: '🏖️' }
      ],
      fields: [temp(), drawField],
      wordBank: ['concrete', 'grass', 'sand', 'hottest', 'coolest', 'sun', 'degrees'],
      judge(obs) {
        return mostCount(obs, this.samples, 'temp', 'Temperature in °C');
      },
      scientists: 'Hard, dark ground like concrete and roads soaks up sunlight and gets very hot. Grass has water inside it, and water helps keep it cooler.',
      newWords: [{ word: 'Surface', meaning: 'The top or outside of something.' }]
    },

    {
      id: 'colours',
      icon: '🎨',
      title: 'Dark or light roof?',
      short: 'Does black paper or white paper get hotter?',
      question: 'Which colour gets hotter in the sun?',
      guessPrompt: 'I think it will be hotter under…',
      options: [
        { id: 'black', label: 'Black paper', icon: '⬛' },
        { id: 'white', label: 'White paper', icon: '⬜' },
        { id: 'same', label: 'Both the same', icon: '⚖️' }
      ],
      guessSentence: (o) => (o.id === 'same'
        ? 'I think both colours will be the same.'
        : `I think it will be hotter under the ${o.label.toLowerCase()}.`),
      needs: [
        { icon: '🤖', label: 'Your micro:bit thermometer' },
        { icon: '⬛', label: 'A sheet of black paper' },
        { icon: '⬜', label: 'A sheet of white paper' }
      ],
      safety: OUTSIDE_SAFETY,
      steps: [
        { icon: '⬛', text: 'Put the micro:bit in the sun under black paper.' },
        { icon: '⏳', text: 'Wait 5 minutes, then press B and read it.' },
        { icon: '⬜', text: 'Let it cool, then test under white paper.' },
        { icon: '⚖️', text: 'Use the same spot for both tests.' }
      ],
      samples: [
        { id: 'black', label: 'Under black paper', icon: '⬛' },
        { id: 'white', label: 'Under white paper', icon: '⬜' }
      ],
      fields: [temp(), drawField],
      wordBank: ['black', 'white', 'dark', 'light', 'roof', 'hotter', 'reflect'],
      judge(obs) {
        return compareCounts(obs, {
          field: 'temp', a: this.samples[0], b: this.samples[1], tolerance: 0,
          results: { a: 'black', b: 'white', same: 'same' },
          text: (b, w) => `Under black paper it was ${b} °C. Under white paper it was ${w} °C.`
        });
      },
      scientists: 'Dark colours soak up more sunlight. Light colours bounce more of it away. Painting roofs white is one way cities stay cooler.',
      newWords: [{ word: 'Reflect', meaning: 'To bounce light back, like a mirror.' }]
    }
  ]
};
