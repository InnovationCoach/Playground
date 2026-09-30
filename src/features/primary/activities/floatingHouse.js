/**
 * Junior Explorers - Activity 8: Build a Floating House.
 *
 * The primary version of Project Hex-Grid. Instead of a model city, children
 * build a real one: a raft of sealed plastic bottles with a LEGO house on top,
 * floated in a tub, then loaded with coins. The three tests teach the same ideas
 * Hex-Grid models - a bigger base floats more (buoyancy), weight in the middle
 * stops tipping (balance), and a material that soaks up water fails (materials) -
 * with evidence they collected with their own hands.
 *
 * Everything the app says back is built from their counts. Facts in
 * `scientists` are general physics, not figures.
 */
import { compareCounts, mostCount } from '../engine/investigationModel.js';

const TUB_SAFETY = ['Keep the water tub on the floor.', 'Wipe up spills so nobody slips.'];

const coinsField = { id: 'coins', kind: 'count', label: 'How many coins did it carry?', icon: '🪙', unit: 'coins', trials: 3 };
const endField = {
  id: 'end', kind: 'choice', label: 'What happened at the end?',
  options: [
    { id: 'water', label: 'Water came on', icon: '💧' },
    { id: 'tipped', label: 'It tipped over', icon: '↪️' },
    { id: 'sank', label: 'It sank', icon: '⬇️' }
  ]
};
const drawField = { id: 'drawing', kind: 'draw', label: 'Draw it' };

export const FLOATING_HOUSE = {
  id: 'floating-house',
  number: 8,
  icon: '🏠',
  title: 'Build a Floating House',
  colour: '#0ea5e9',
  short: 'Build a raft house from bottles and LEGO, then test how many coins it can carry.',
  kit: 'plastic bottles, LEGO, coins, water tub',
  story: 'Bangkok has lots of water, and floods are coming more often. Some families live in houses that float! Let\'s build one and test it.',
  standards: ['NGSS 2-PS1-2', 'NGSS 3-5-ETS1-3 (proposed)'],
  investigations: [
    {
      id: 'build',
      kind: 'build',
      icon: '🔨',
      title: 'Build your floating house',
      short: 'Follow the steps to build a raft and a house.',
      needs: [
        { icon: '🧴', label: '4 empty plastic bottles with lids' },
        { icon: '📦', label: 'Stiff card or a plastic tray for the floor' },
        { icon: '🩹', label: 'Strong tape' },
        { icon: '🧱', label: 'LEGO bricks for the house' },
        { icon: '🛁', label: 'A big tub of water' },
        { icon: '🧻', label: 'Towels for spills' }
      ],
      safety: [...TUB_SAFETY, 'Ask an adult if you need scissors.'],
      steps: [
        { icon: '🧴', text: 'Screw the lids on all 4 bottles, tight.' },
        { icon: '🩹', text: 'Tape the bottles side by side to make a raft.' },
        { icon: '📦', text: 'Tape the card or tray on top. This is the floor.' },
        { icon: '🧱', text: 'Build a small LEGO house in the middle.' },
        { icon: '🛁', text: 'Put your house gently on the water.' },
        { icon: '👀', text: 'Look from the side. Is it flat and level?' }
      ],
      samples: [{ id: 'house', label: 'My floating house', icon: '🏠' }],
      fields: [
        {
          id: 'floats', kind: 'choice', label: 'Does your house float?',
          options: [
            { id: 'level', label: 'Yes, and level', icon: '✅' },
            { id: 'tilts', label: 'Yes, but it leans', icon: '↗️' },
            { id: 'sinks', label: 'No, it sinks', icon: '⬇️' }
          ]
        },
        { id: 'bottles', kind: 'count', label: 'How many bottles did you use?', icon: '🧴', unit: 'bottles' },
        { id: 'bricks', kind: 'count', label: 'How many LEGO bricks in your house?', icon: '🧱', unit: 'bricks', level: 'explorer' },
        { id: 'drawing', kind: 'draw', label: 'Draw your floating house' }
      ],
      wordBank: ['bottles', 'raft', 'floor', 'house', 'floats', 'level', 'leans', 'strong', 'wobbly'],
      scientists: 'Floating houses are real! Some families in the Netherlands live in floating homes, and Thailand has raft houses on rivers. When a flood comes, the house rises with the water.',
      newWords: [
        { word: 'Float', meaning: 'To stay on top of the water.' },
        { word: 'Raft', meaning: 'A flat boat made by joining things that float.' }
      ]
    },

    {
      id: 'size',
      icon: '📏',
      title: 'Big raft or small raft?',
      short: 'Which raft can carry more coins?',
      question: 'Will a bigger raft carry more coins?',
      guessPrompt: 'I think more coins will fit on the…',
      options: [
        { id: 'small', label: 'Small raft (2 bottles)', icon: '🧴' },
        { id: 'big', label: 'Big raft (4 bottles)', icon: '🧴🧴' },
        { id: 'same', label: 'Both the same', icon: '⚖️' }
      ],
      guessSentence: (o) => (o.id === 'same'
        ? 'I think both rafts will carry the same number of coins.'
        : `I think the ${o.id} raft will carry more coins.`),
      needs: [
        { icon: '🏠', label: 'Your 4-bottle raft (take the house off)' },
        { icon: '🧴', label: '2 more bottles and tape for a small raft' },
        { icon: '🪙', label: 'A bag of coins, all the same size' },
        { icon: '🛁', label: 'The tub of water' }
      ],
      safety: TUB_SAFETY,
      steps: [
        { icon: '🧴', text: 'Tape 2 bottles together. This is the small raft.' },
        { icon: '🛁', text: 'Float the small raft in the tub.' },
        { icon: '🪙', text: 'Put coins in the middle, one at a time.' },
        { icon: '✋', text: 'Stop when water comes on, or it tips.' },
        { icon: '👆', text: 'Tap the counter once for every coin.' },
        { icon: '🔁', text: 'Now test the big raft the same way.' }
      ],
      samples: [
        { id: 'small', label: 'Small raft', icon: '🧴' },
        { id: 'big', label: 'Big raft', icon: '🧴🧴' }
      ],
      fields: [coinsField, endField, drawField],
      wordBank: ['coins', 'heavy', 'sank', 'tipped', 'water', 'big', 'small', 'more', 'less'],
      judge(obs) {
        return compareCounts(obs, {
          field: 'coins', a: this.samples[0], b: this.samples[1], tolerance: 1,
          results: { a: 'small', b: 'big', same: 'same' },
          text: (s, b) => `The small raft carried ${s} coins. The big raft carried ${b} coins.`
        });
      },
      scientists: 'A bigger raft pushes more water out of the way. The water pushes back up, so a bigger raft can hold more. This push is called buoyancy.',
      newWords: [
        { word: 'Buoyancy', meaning: 'The push of water that holds things up.' },
        { word: 'Fair test', meaning: 'Change one thing. Keep everything else the same.' }
      ]
    },

    {
      id: 'balance',
      icon: '⚖️',
      title: 'Middle or side?',
      short: 'Where should heavy things go?',
      question: 'Where should heavy things go so the house does not tip?',
      guessPrompt: 'I think the raft carries more coins when they are…',
      options: [
        { id: 'middle', label: 'In the middle', icon: '🎯' },
        { id: 'side', label: 'On one side', icon: '👉' },
        { id: 'same', label: 'No difference', icon: '⚖️' }
      ],
      guessSentence: (o) => (o.id === 'same'
        ? 'I think it makes no difference where the coins go.'
        : `I think the raft carries more coins when they are ${o.label.toLowerCase()}.`),
      needs: [
        { icon: '🏠', label: 'Your 4-bottle raft' },
        { icon: '🪙', label: 'A bag of coins, all the same size' },
        { icon: '🛁', label: 'The tub of water' }
      ],
      safety: TUB_SAFETY,
      steps: [
        { icon: '🎯', text: 'Test 1: put coins in the middle, one at a time.' },
        { icon: '✋', text: 'Stop when water comes on, or it tips.' },
        { icon: '👆', text: 'Count the coins with the counter.' },
        { icon: '👉', text: 'Test 2: put coins on one edge only.' },
        { icon: '👆', text: 'Stop and count again.' }
      ],
      samples: [
        { id: 'middle', label: 'Coins in the middle', icon: '🎯' },
        { id: 'edge', label: 'Coins on one edge', icon: '👉' }
      ],
      fields: [coinsField, endField, drawField],
      wordBank: ['middle', 'edge', 'side', 'tipped', 'balanced', 'wobbly', 'heavy', 'coins'],
      judge(obs) {
        return compareCounts(obs, {
          field: 'coins', a: this.samples[0], b: this.samples[1], tolerance: 1,
          results: { a: 'middle', b: 'side', same: 'same' },
          text: (m, e) => `In the middle it carried ${m} coins. On one edge it carried ${e} coins.`
        });
      },
      scientists: 'Weight on one side pushes that side down, so the house tips. Weight in the middle is shared by all the floats. Real floating houses keep heavy things low and in the middle.',
      newWords: [{ word: 'Balance', meaning: 'When weight is spread out so nothing tips.' }]
    },

    {
      id: 'material',
      icon: '🧪',
      title: 'Best floating material',
      short: 'Bottles, foil or cardboard?',
      question: 'Which raft will carry the most coins?',
      guessPrompt: 'I think the best raft will be made of…',
      options: [
        { id: 'bottles', label: 'Plastic bottles', icon: '🧴' },
        { id: 'foil', label: 'A foil tray', icon: '🥧' },
        { id: 'card', label: 'Cardboard', icon: '📦' }
      ],
      guessSentence: (o) => `I think the ${o.label.toLowerCase()} raft will carry the most coins.`,
      needs: [
        { icon: '🧴', label: 'Your bottle raft' },
        { icon: '🥧', label: 'A foil tray about the same size' },
        { icon: '📦', label: 'A piece of cardboard the same size' },
        { icon: '🪙', label: 'A bag of coins, all the same size' },
        { icon: '🛁', label: 'The tub of water' }
      ],
      safety: TUB_SAFETY,
      steps: [
        { icon: '📏', text: 'Check all three rafts are about the same size.' },
        { icon: '🪙', text: 'Float one raft. Add coins in the middle.' },
        { icon: '✋', text: 'Stop when water comes on, or it sinks.' },
        { icon: '👆', text: 'Count the coins with the counter.' },
        { icon: '🔁', text: 'Test the other two rafts the same way.' }
      ],
      samples: [
        { id: 'bottles', label: 'Bottles', icon: '🧴' },
        { id: 'foil', label: 'Foil tray', icon: '🥧' },
        { id: 'card', label: 'Cardboard', icon: '📦' }
      ],
      fields: [
        coinsField,
        endField,
        {
          id: 'soggy', kind: 'choice', label: 'After the test, is it soggy?', level: 'explorer',
          options: [
            { id: 'dry', label: 'Still strong', icon: '💪' },
            { id: 'soggy', label: 'Soggy and soft', icon: '🫠' }
          ]
        },
        drawField
      ],
      wordBank: ['plastic', 'foil', 'cardboard', 'soggy', 'strong', 'leaked', 'floats', 'sank'],
      judge(obs) {
        return mostCount(obs, this.samples, 'coins', 'Coins carried');
      },
      scientists: 'Sealed bottles are full of air and do not soak up water. Cardboard soaks up water and goes soft. That is why real floating homes sit on sealed floats.',
      newWords: [{ word: 'Material', meaning: 'What something is made of.' }]
    }
  ]
};
