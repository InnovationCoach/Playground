/**
 * Junior Explorers - Activity 6: Acid Rain Detectives.
 *
 * The primary version of the SO₂ → Sulfate model. Children make a red-cabbage
 * indicator (pink in acids, purple in plain water, blue-green in bases), test
 * everyday liquids, then watch vinegar fizz on limestone - the way acid rain
 * wears away stone buildings and statues.
 *
 * Material note: much modern classroom chalk is gypsum and does NOT fizz in
 * vinegar. The kit asks for limestone chips or eggshell (calcium carbonate),
 * which do. An adult prepares the cabbage water (knife, hot water).
 */
import { rankChoice } from '../engine/investigationModel.js';

const LAB_SAFETY = [
  'Wear safety glasses.',
  'Never drink or taste anything in science.',
  'Wash your hands when you finish.'
];

const colourField = {
  id: 'colour', kind: 'choice', label: 'What colour did it turn?',
  options: [
    { id: 'pink', label: 'Pink or red', icon: '🩷' },
    { id: 'purple', label: 'Purple', icon: '💜' },
    { id: 'blue', label: 'Blue or green', icon: '💚' }
  ]
};

const FIZZ_ORDER = ['none', 'few', 'lots'];
const fizzField = {
  id: 'fizz', kind: 'choice', label: 'How many bubbles?',
  options: [
    { id: 'none', label: 'None', icon: '⚪' },
    { id: 'few', label: 'A few', icon: '🫧' },
    { id: 'lots', label: 'Lots', icon: '🍾' }
  ]
};
const fizzLabel = (id) => fizzField.options.find((o) => o.id === id)?.label || id;

export const ACID_RAIN = {
  id: 'acid-rain',
  number: 6,
  icon: '🧪',
  colour: '#3b82f6',
  title: 'Acid Rain Detectives',
  short: 'Make a red-cabbage colour tester. Watch vinegar fizz on stone like acid rain on buildings.',
  kit: 'red cabbage, vinegar, baking soda, limestone chips or eggshell, clear cups',
  story: 'Smoke from factories and cars can make rain a little bit acidic. Acid rain can harm plants and wear away stone. Let\'s become acid detectives!',
  standards: ['NGSS 2-PS1-1 (proposed)', 'NGSS 5-PS1-4 (proposed)'],
  investigations: [
    {
      id: 'tester',
      kind: 'build',
      icon: '🥬',
      title: 'Make your colour tester',
      short: 'Turn red cabbage into a magic colour tester.',
      needs: [
        { icon: '🥬', label: 'A few red cabbage leaves' },
        { icon: '🫖', label: 'Hot water (an adult pours it)' },
        { icon: '🥣', label: 'A bowl, a sieve and a jug' }
      ],
      safety: ['Only an adult uses the knife and hot water.', ...LAB_SAFETY],
      steps: [
        { icon: '✂️', text: 'An adult chops the cabbage into small pieces.' },
        { icon: '🫖', text: 'An adult pours hot water over it.' },
        { icon: '⏳', text: 'Wait until the water is cool and purple.' },
        { icon: '🥣', text: 'Pour it through a sieve into a jug.' }
      ],
      samples: [{ id: 'tester', label: 'My colour tester', icon: '🥬' }],
      fields: [colourField, { id: 'drawing', kind: 'draw', label: 'Draw your tester' }],
      wordBank: ['cabbage', 'purple', 'colour', 'tester', 'sieve', 'cool'],
      scientists: 'Red cabbage has a colour inside it that changes when it meets an acid or its opposite, a base. Scientists call a colour tester an indicator.',
      newWords: [{ word: 'Indicator', meaning: 'Something that changes colour to tell us about a liquid.' }]
    },

    {
      id: 'detectives',
      icon: '🔍',
      title: 'Colour detectives',
      short: 'Which liquid is an acid?',
      question: 'Which liquid will turn the tester pink?',
      guessPrompt: 'I think the one that turns pink will be…',
      options: [
        { id: 'water', label: 'Plain water', icon: '💧' },
        { id: 'vinegar', label: 'Vinegar', icon: '🍶' },
        { id: 'soda', label: 'Baking soda water', icon: '🧂' }
      ],
      guessSentence: (o) => `I think the ${o.label.toLowerCase()} will turn pink.`,
      needs: [
        { icon: '🥬', label: 'Your colour tester' },
        { icon: '🥤', label: 'Three clear cups' },
        { icon: '🍶', label: 'Water, vinegar and baking soda water' }
      ],
      safety: [...LAB_SAFETY, 'Tell an adult if anything splashes in your eyes.'],
      steps: [
        { icon: '🥤', text: 'Put a little of each liquid in its own cup.' },
        { icon: '🏷️', text: 'Label the cups so you remember which is which.' },
        { icon: '🥬', text: 'Add a spoon of colour tester to each cup.' },
        { icon: '👀', text: 'Look at each colour. Tap what you see.' }
      ],
      samples: [
        { id: 'water', label: 'Water', icon: '💧' },
        { id: 'vinegar', label: 'Vinegar', icon: '🍶' },
        { id: 'soda', label: 'Baking soda water', icon: '🧂' }
      ],
      fields: [colourField],
      wordBank: ['acid', 'pink', 'purple', 'blue', 'green', 'vinegar', 'soda', 'indicator'],
      judge(obs) {
        const seen = this.samples.filter((s) => obs[s.id]?.colour);
        if (seen.length < 2) return null;
        const pink = seen.filter((s) => obs[s.id].colour === 'pink');
        const list = seen.map((s) => `${s.label.toLowerCase()}: ${colourField.options.find((o) => o.id === obs[s.id].colour).label.toLowerCase()}`).join(', ');
        return {
          result: pink.map((s) => s.id),
          text: `Your colours - ${list}.${pink.length ? ` Pink means acid, so ${pink.map((s) => s.label.toLowerCase()).join(' and ')} is an acid.` : ' Nothing turned pink.'}`
        };
      },
      scientists: 'Acids turn red cabbage pink or red. Plain water keeps it purple. Bases, like baking soda, turn it blue or green. Vinegar is a weak acid.',
      newWords: [
        { word: 'Acid', meaning: 'A sour kind of liquid, like vinegar or lemon juice.' },
        { word: 'Base', meaning: 'The opposite of an acid, like baking soda.' }
      ]
    },

    {
      id: 'stone',
      icon: '🗿',
      title: 'Acid on stone',
      short: 'What does acid do to stone buildings?',
      question: 'What happens to stone in vinegar?',
      guessPrompt: 'I think more bubbles will come from the stone in…',
      options: [
        { id: 'water', label: 'Water', icon: '💧' },
        { id: 'vinegar', label: 'Vinegar', icon: '🍶' },
        { id: 'same', label: 'Both the same', icon: '⚖️' }
      ],
      guessSentence: (o) => (o.id === 'same'
        ? 'I think the stone will do the same in both cups.'
        : `I think more bubbles will come from the stone in ${o.label.toLowerCase()}.`),
      needs: [
        { icon: '🪨', label: 'Two limestone chips or eggshell pieces' },
        { icon: '🥤', label: 'Two clear cups' },
        { icon: '🍶', label: 'Water and vinegar' }
      ],
      safety: LAB_SAFETY,
      steps: [
        { icon: '💧', text: 'Pour water into one cup.' },
        { icon: '🍶', text: 'Pour vinegar into the other cup.' },
        { icon: '🪨', text: 'Drop one stone into each cup.' },
        { icon: '👀', text: 'Watch closely for 5 minutes.' },
        { icon: '👆', text: 'Tap how many bubbles you see in each cup.' }
      ],
      samples: [
        { id: 'water', label: 'Stone in water', icon: '💧' },
        { id: 'vinegar', label: 'Stone in vinegar', icon: '🍶' }
      ],
      fields: [fizzField, { id: 'drawing', kind: 'draw', label: 'Draw what you see' }],
      wordBank: ['fizz', 'bubbles', 'stone', 'acid', 'vinegar', 'dissolve', 'statue'],
      judge(obs) {
        return rankChoice(obs, this.samples, 'fizz', {
          order: FIZZ_ORDER, want: 'most', optionLabel: fizzLabel, noun: 'Bubbles -'
        });
      },
      scientists: 'Limestone and eggshell are made of a stuff that acids break down. The bubbles are a gas made as the stone wears away. Acid rain slowly wears away stone statues and buildings the same way.',
      newWords: [{ word: 'Dissolve', meaning: 'When something breaks down and mixes into a liquid.' }]
    }
  ]
};
