/**
 * Junior Explorers - Activity 3: Micro:bit Blocks.
 *
 * The primary version of Micro:bit Coding (MicroPython). Children use MakeCode
 * blocks instead, and still follow guess → test → record: they predict what
 * their program will do, run it, and record what the micro:bit shows. The last
 * test builds the thermometer that Activity 1 uses.
 *
 * Block names match the MakeCode editor (makecode.microbit.org) so a child can
 * find them. An adult opens the editor and downloads the program.
 */
import { compareCounts } from '../engine/investigationModel.js';

const MICROBIT_SAFETY = [
  'Hold the micro:bit by its edges.',
  'Keep the micro:bit and battery pack dry.',
  'An adult plugs in the cable.'
];

export const MICROBIT_BLOCKS = {
  id: 'microbit-blocks',
  number: 3,
  icon: '🤖',
  colour: '#f59e0b',
  title: 'Micro:bit Blocks',
  short: 'Code a micro:bit with blocks: faces, buttons and a thermometer.',
  kit: 'micro:bit, USB cable, battery pack, MakeCode on a tablet or laptop',
  story: 'A micro:bit is a tiny computer. It does exactly what your code tells it. Let\'s give it instructions with blocks!',
  standards: ['CSTA 1A-AP-10 (proposed)', 'CSTA 1A-AP-11 (proposed)'],
  investigations: [
    {
      id: 'smiley',
      kind: 'build',
      icon: '🙂',
      title: 'Make a smiley face',
      short: 'Your first program: show a face.',
      needs: [
        { icon: '🤖', label: 'A micro:bit and a USB cable' },
        { icon: '💻', label: 'MakeCode open on a tablet or laptop' }
      ],
      safety: MICROBIT_SAFETY,
      steps: [
        { icon: '🟦', text: 'Find the "on start" block.' },
        { icon: '🙂', text: 'Drag "show icon" inside "on start".' },
        { icon: '👆', text: 'Pick the smiley face.' },
        { icon: '🔌', text: 'Ask an adult to download it to the micro:bit.' },
        { icon: '👀', text: 'Look at the lights on the micro:bit.' }
      ],
      samples: [{ id: 'microbit', label: 'My micro:bit', icon: '🤖' }],
      fields: [
        {
          id: 'shows', kind: 'choice', label: 'What does the micro:bit show?',
          options: [
            { id: 'smiley', label: 'A smiley face', icon: '🙂' },
            { id: 'other', label: 'Something else', icon: '❓' },
            { id: 'nothing', label: 'Nothing', icon: '⬛' }
          ]
        },
        { id: 'drawing', kind: 'draw', label: 'Draw what the lights show' }
      ],
      wordBank: ['code', 'block', 'program', 'lights', 'smiley', 'download'],
      scientists: 'A program is a list of instructions. The computer follows them in order, exactly as written.',
      newWords: [
        { word: 'Program', meaning: 'Instructions that tell a computer what to do.' },
        { word: 'Code', meaning: 'The instructions we write for a computer.' }
      ]
    },

    {
      id: 'counter',
      icon: '🔢',
      title: 'Button counter',
      short: 'Make a counter. Does it count right?',
      question: 'If you press A 10 times, what number will it show?',
      guessPrompt: 'I think it will show…',
      options: [
        { id: 'ten', label: 'Exactly 10', icon: '🔟' },
        { id: 'more', label: 'More than 10', icon: '⬆️' },
        { id: 'less', label: 'Less than 10', icon: '⬇️' }
      ],
      guessSentence: (o) => `I think it will show ${o.label.toLowerCase()}.`,
      needs: [
        { icon: '🤖', label: 'Your micro:bit' },
        { icon: '💻', label: 'MakeCode' }
      ],
      safety: MICROBIT_SAFETY,
      steps: [
        { icon: '📦', text: 'Make a variable called "count".' },
        { icon: '🅰️', text: 'Use "on button A pressed".' },
        { icon: '➕', text: 'Inside it, put "change count by 1".' },
        { icon: '🔢', text: 'Then put "show number count".' },
        { icon: '🔌', text: 'Download it. Press A slowly, 10 times.' }
      ],
      samples: [{ id: 'microbit', label: 'After 10 presses', icon: '🅰️' }],
      fields: [
        { id: 'shown', kind: 'number', label: 'What number does it show?', icon: '🔢', start: 10, min: 0, max: 99 },
        { id: 'drawing', kind: 'draw', label: 'Draw your code blocks', level: 'explorer' }
      ],
      wordBank: ['button', 'variable', 'count', 'press', 'number', 'correct', 'bug'],
      judge(obs) {
        const n = obs.microbit?.shown;
        if (!Number.isFinite(n)) return null;
        const result = n === 10 ? 'ten' : n > 10 ? 'more' : 'less';
        return {
          result,
          text: `After 10 presses it showed ${n}.`,
          warning: n === 10 ? null : 'If it is not 10, check your blocks. A mistake in code is called a bug.'
        };
      },
      scientists: 'A variable is a box that remembers a number. Each press adds 1 to the box. If the number is wrong, programmers look for the bug and fix it.',
      newWords: [
        { word: 'Variable', meaning: 'A box in a program that remembers something.' },
        { word: 'Bug', meaning: 'A mistake in code.' }
      ]
    },

    {
      id: 'thermometer',
      icon: '🌡️',
      title: 'Make a thermometer',
      short: 'Is your hand warmer than your desk?',
      question: 'Will the micro:bit be warmer on your desk or in your hands?',
      guessPrompt: 'I think it will be warmer…',
      options: [
        { id: 'desk', label: 'On the desk', icon: '🪑' },
        { id: 'hands', label: 'In my hands', icon: '🤲' },
        { id: 'same', label: 'Both the same', icon: '⚖️' }
      ],
      guessSentence: (o) => (o.id === 'same'
        ? 'I think the desk and my hands will be the same.'
        : `I think it will be warmer ${o.label.toLowerCase()}.`),
      needs: [
        { icon: '🤖', label: 'Your micro:bit and battery pack' },
        { icon: '💻', label: 'MakeCode' }
      ],
      safety: MICROBIT_SAFETY,
      steps: [
        { icon: '🅱️', text: 'Use "on button B pressed".' },
        { icon: '🌡️', text: 'Inside it, put "show number temperature".' },
        { icon: '🔌', text: 'Download it. Put the micro:bit on your desk.' },
        { icon: '⏳', text: 'Wait 2 minutes. Press B and read it.' },
        { icon: '🤲', text: 'Hold it gently in your hands for 2 minutes.' },
        { icon: '🅱️', text: 'Press B and read it again.' }
      ],
      samples: [
        { id: 'desk', label: 'On the desk', icon: '🪑' },
        { id: 'hands', label: 'In my hands', icon: '🤲' }
      ],
      fields: [
        { id: 'temp', kind: 'number', label: 'What does it show?', icon: '🌡️', unit: '°C', unitSpoken: 'degrees', start: 28, min: 0, max: 50 }
      ],
      wordBank: ['temperature', 'sensor', 'warm', 'cool', 'hands', 'degrees'],
      judge(obs) {
        return compareCounts(obs, {
          field: 'temp', a: this.samples[0], b: this.samples[1], tolerance: 0,
          results: { a: 'desk', b: 'hands', same: 'same' },
          text: (d, h) => `On the desk it showed ${d} °C. In your hands it showed ${h} °C.`
        });
      },
      scientists: 'The micro:bit has a sensor that feels how warm it is. Your body is warm, so holding it warms it up. You will use this thermometer in Hot Spots.',
      newWords: [{ word: 'Sensor', meaning: 'A part that notices something, like heat or light.' }]
    }
  ]
};
