/**
 * Junior Explorers - Activity 2: Storm Shelter Challenge.
 *
 * The primary version of Bunker Survival. Children build a LEGO shelter and
 * test it against a fan (wind) and a spray bottle (rain): a wide, low shape
 * stands up to wind better than a tall one, and a sloped roof lets rain run
 * off. Results are ranked picture answers, built only from what they tapped.
 */
import { rankChoice } from '../engine/investigationModel.js';

const FAN_SAFETY = ['Keep fingers away from the fan blades.', 'An adult switches the fan on and off.'];
const WATER_SAFETY = ['Keep water far away from the fan and plugs.', 'Wipe up spills so nobody slips.'];

const WIND_ORDER = ['low', 'medium', 'high', 'never'];
const windField = {
  id: 'fell', kind: 'choice', label: 'Which fan speed knocked it over?',
  options: [
    { id: 'low', label: 'Low', icon: '🍃' },
    { id: 'medium', label: 'Medium', icon: '💨' },
    { id: 'high', label: 'High', icon: '🌪️' },
    { id: 'never', label: 'It never fell', icon: '💪' }
  ]
};

const WET_ORDER = ['dry', 'damp', 'soaked'];
const wetField = {
  id: 'inside', kind: 'choice', label: 'How is the tissue inside?',
  options: [
    { id: 'dry', label: 'Dry', icon: '☀️' },
    { id: 'damp', label: 'A bit damp', icon: '💧' },
    { id: 'soaked', label: 'Soaked', icon: '🌊' }
  ]
};

const drawField = { id: 'drawing', kind: 'draw', label: 'Draw your shelter' };
const label = (field) => (id) => field.options.find((o) => o.id === id)?.label || id;

export const STORM_SHELTER = {
  id: 'storm-shelter',
  number: 2,
  icon: '⛈️',
  colour: '#38bdf8',
  title: 'Storm Shelter Challenge',
  short: 'Build a shelter and test it with wind and rain.',
  kit: 'LEGO bricks and base plate, desk fan, spray bottle, tissue',
  story: 'Big storms bring strong wind and heavy rain. People need shelters that stay standing and keep them dry. Can you build one?',
  standards: ['NGSS 3-ESS3-1 (proposed)', 'NGSS K-2-ETS1-3 (proposed)'],
  investigations: [
    {
      id: 'build',
      kind: 'build',
      icon: '🧱',
      title: 'Build your shelter',
      short: 'Build a LEGO shelter with a roof.',
      needs: [
        { icon: '🧱', label: 'LEGO bricks and a base plate' },
        { icon: '📦', label: 'Card for a roof' },
        { icon: '🧻', label: 'A small piece of tissue' }
      ],
      safety: ['Keep small bricks away from little children.'],
      steps: [
        { icon: '🟩', text: 'Start on a base plate.' },
        { icon: '🧱', text: 'Build four walls. Leave a door.' },
        { icon: '📦', text: 'Put a roof on top.' },
        { icon: '🧻', text: 'Put the tissue inside. It shows if rain gets in.' }
      ],
      samples: [{ id: 'shelter', label: 'My shelter', icon: '🏠' }],
      fields: [
        {
          id: 'stands', kind: 'choice', label: 'Does it stand up by itself?',
          options: [
            { id: 'strong', label: 'Yes, strong', icon: '💪' },
            { id: 'wobbly', label: 'Yes, but wobbly', icon: '〰️' },
            { id: 'falls', label: 'No, it falls', icon: '⬇️' }
          ]
        },
        { id: 'bricks', kind: 'count', label: 'How many bricks did you use?', icon: '🧱', unit: 'bricks', level: 'explorer' },
        drawField
      ],
      wordBank: ['walls', 'roof', 'door', 'strong', 'wobbly', 'shelter', 'bricks'],
      scientists: 'Engineers design buildings to be strong in storms. They test models first, just like you.',
      newWords: [
        { word: 'Shelter', meaning: 'A place that keeps you safe from weather.' },
        { word: 'Engineer', meaning: 'Someone who designs and builds things to solve problems.' }
      ]
    },

    {
      id: 'wind',
      icon: '💨',
      title: 'Tall or wide?',
      short: 'Which shape stands up to stronger wind?',
      question: 'Which shelter stands up to stronger wind?',
      guessPrompt: 'I think the strongest shelter will be…',
      options: [
        { id: 'tall', label: 'Tall and thin', icon: '🗼' },
        { id: 'wide', label: 'Low and wide', icon: '🛖' },
        { id: 'same', label: 'Both the same', icon: '⚖️' }
      ],
      guessSentence: (o) => (o.id === 'same'
        ? 'I think both shelters will be the same.'
        : `I think the ${o.label.toLowerCase()} shelter will be strongest.`),
      needs: [
        { icon: '🧱', label: 'The same number of bricks for two shelters' },
        { icon: '🌀', label: 'A desk fan with three speeds' }
      ],
      safety: FAN_SAFETY,
      steps: [
        { icon: '🗼', text: 'Build a tall, thin shelter.' },
        { icon: '🛖', text: 'Build a low, wide shelter with the same bricks.' },
        { icon: '📏', text: 'Put the fan one ruler away from the shelter.' },
        { icon: '🍃', text: 'Try low, then medium, then high.' },
        { icon: '👆', text: 'Tap the speed that knocked it over.' }
      ],
      samples: [
        { id: 'tall', label: 'Tall shelter', icon: '🗼' },
        { id: 'wide', label: 'Wide shelter', icon: '🛖' }
      ],
      fields: [windField, drawField],
      wordBank: ['wind', 'fan', 'tall', 'wide', 'fell', 'strong', 'blew', 'stable'],
      judge(obs) {
        return rankChoice(obs, this.samples, 'fell', {
          order: WIND_ORDER, want: 'most', optionLabel: label(windField), noun: 'Knocked over by:'
        });
      },
      scientists: 'Tall, thin buildings catch more wind up high and tip more easily. Low, wide buildings are more stable. Engineers make tall buildings extra strong.',
      newWords: [{ word: 'Stable', meaning: 'Hard to knock over.' }]
    },

    {
      id: 'roof',
      icon: '🌧️',
      title: 'Flat roof or sloped roof?',
      short: 'Which roof keeps the rain out?',
      question: 'Which roof keeps the tissue drier?',
      guessPrompt: 'I think the driest shelter will have…',
      options: [
        { id: 'flat', label: 'A flat roof', icon: '▬' },
        { id: 'sloped', label: 'A sloped roof', icon: '🔺' },
        { id: 'same', label: 'Both the same', icon: '⚖️' }
      ],
      guessSentence: (o) => (o.id === 'same'
        ? 'I think both roofs will keep the tissue the same.'
        : `I think the shelter with ${o.label.toLowerCase()} will stay driest.`),
      needs: [
        { icon: '🏠', label: 'Your shelter' },
        { icon: '📦', label: 'Card for a flat roof and a sloped roof' },
        { icon: '🧴', label: 'A spray bottle of water' },
        { icon: '🧻', label: 'Two dry pieces of tissue' }
      ],
      safety: WATER_SAFETY,
      steps: [
        { icon: '▬', text: 'Put a flat roof on. Put dry tissue inside.' },
        { icon: '🧴', text: 'Spray the roof 10 times from above.' },
        { icon: '👀', text: 'Look at the tissue. Tap what you see.' },
        { icon: '🔺', text: 'Fold the card into a slope. Use new tissue.' },
        { icon: '🧴', text: 'Spray 10 times again, then look.' }
      ],
      samples: [
        { id: 'flat', label: 'Flat roof', icon: '▬' },
        { id: 'sloped', label: 'Sloped roof', icon: '🔺' }
      ],
      fields: [wetField, drawField],
      wordBank: ['rain', 'roof', 'flat', 'slope', 'dry', 'damp', 'soaked', 'drip'],
      judge(obs) {
        return rankChoice(obs, this.samples, 'inside', {
          order: WET_ORDER, want: 'least', optionLabel: label(wetField), noun: 'Tissue inside:'
        });
      },
      scientists: 'Rain runs off a sloped roof. On a flat roof it can sit in puddles and leak through. That is why many houses have sloped roofs.',
      newWords: [{ word: 'Slope', meaning: 'A surface that goes up or down at an angle.' }]
    }
  ]
};
