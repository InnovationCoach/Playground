/**
 * Junior Explorers - Activity 5: Sun Power Race.
 *
 * The primary version of the Solar Car. A small solar panel drives a motor
 * with a paper flag on it; how fast the flag spins shows how much power the
 * panel makes. Children compare sun, shade and "cloud" (baking paper), and a
 * flat panel against one turned to face the sun.
 *
 * Spin speed is a ranked picture answer, not a number, because a 6-year-old
 * cannot count a motor's turns. Explorers can also time a solar car over one
 * metre with the stopwatch.
 */
import { rankChoice, leastCount } from '../engine/investigationModel.js';

const SUN_SAFETY = ['Never look straight at the sun.', 'Wear a hat outside.'];

const SPIN_ORDER = ['still', 'slow', 'fast'];
const spinField = {
  id: 'spin', kind: 'choice', label: 'How fast does the flag spin?',
  options: [
    { id: 'still', label: 'Not at all', icon: '⏸️' },
    { id: 'slow', label: 'Slowly', icon: '🐢' },
    { id: 'fast', label: 'Fast', icon: '🐇' }
  ]
};
const label = (id) => spinField.options.find((o) => o.id === id)?.label || id;

export const SUN_POWER = {
  id: 'sun-power',
  number: 5,
  icon: '☀️',
  colour: '#eab308',
  title: 'Sun Power Race',
  short: 'Race a solar model in sun, shade and cloud.',
  kit: 'small solar panel, small motor, paper flag, baking paper',
  story: 'Sunlight can make electricity! A solar panel turns light into power that can spin a motor. What makes it spin faster?',
  standards: ['NGSS 4-PS3-2 (proposed)', 'NGSS 4-PS3-4 (proposed)'],
  investigations: [
    {
      id: 'connect',
      kind: 'build',
      icon: '🔌',
      title: 'Build your sun spinner',
      short: 'Join a solar panel to a motor with a flag.',
      needs: [
        { icon: '🔲', label: 'A small solar panel with two wires' },
        { icon: '⚙️', label: 'A small motor' },
        { icon: '🚩', label: 'A paper flag and tape' }
      ],
      safety: [...SUN_SAFETY, 'Ask an adult to help join the wires.'],
      steps: [
        { icon: '🚩', text: 'Tape the paper flag onto the motor spindle.' },
        { icon: '🔌', text: 'Join the red wire to the red wire.' },
        { icon: '🔌', text: 'Join the black wire to the black wire.' },
        { icon: '☀️', text: 'Take the panel into the sun.' },
        { icon: '👀', text: 'Watch the flag.' }
      ],
      samples: [{ id: 'spinner', label: 'My sun spinner', icon: '🚩' }],
      fields: [spinField, { id: 'drawing', kind: 'draw', label: 'Draw your sun spinner' }],
      wordBank: ['solar', 'panel', 'motor', 'wire', 'spin', 'electricity', 'sun'],
      scientists: 'A solar panel turns light into electricity. The electricity flows through the wires and makes the motor turn.',
      newWords: [
        { word: 'Solar', meaning: 'To do with the sun.' },
        { word: 'Electricity', meaning: 'A kind of energy that makes things work.' }
      ]
    },

    {
      id: 'light',
      icon: '🌤️',
      title: 'Sun, shade or cloud?',
      short: 'Where does the flag spin fastest?',
      question: 'Where will the flag spin fastest?',
      guessPrompt: 'I think it will spin fastest…',
      options: [
        { id: 'sun', label: 'In full sun', icon: '☀️' },
        { id: 'cloud', label: 'Under a "cloud"', icon: '☁️' },
        { id: 'shade', label: 'In the shade', icon: '🌳' }
      ],
      guessSentence: (o) => `I think it will spin fastest ${o.label.toLowerCase().replace(/"/g, '')}.`,
      needs: [
        { icon: '🚩', label: 'Your sun spinner' },
        { icon: '📄', label: 'A sheet of baking paper for the cloud' }
      ],
      safety: SUN_SAFETY,
      steps: [
        { icon: '☀️', text: 'Put the panel in full sun. Watch the flag.' },
        { icon: '☁️', text: 'Hold baking paper over the panel. Watch again.' },
        { icon: '🌳', text: 'Move the panel into the shade. Watch again.' },
        { icon: '👆', text: 'Tap how fast it spun each time.' }
      ],
      samples: [
        { id: 'sun', label: 'Full sun', icon: '☀️' },
        { id: 'cloud', label: 'Cloud', icon: '☁️' },
        { id: 'shade', label: 'Shade', icon: '🌳' }
      ],
      fields: [spinField, { id: 'drawing', kind: 'draw', label: 'Draw where the panel was', level: 'explorer' }],
      wordBank: ['sun', 'shade', 'cloud', 'light', 'fast', 'slow', 'power'],
      judge(obs) {
        return rankChoice(obs, this.samples, 'spin', {
          order: SPIN_ORDER, want: 'most', optionLabel: label, noun: 'The flag spun -'
        });
      },
      scientists: 'The more light reaches the panel, the more electricity it makes. Clouds and shade block some of the light, so the motor slows down.',
      newWords: [{ word: 'Energy', meaning: 'What makes things move, light up or get warm.' }]
    },

    {
      id: 'angle',
      icon: '📐',
      title: 'Flat or facing the sun?',
      short: 'Does turning the panel to the sun help?',
      question: 'Will the flag spin faster with the panel flat, or facing the sun?',
      guessPrompt: 'I think it will spin faster…',
      options: [
        { id: 'flat', label: 'Flat on the ground', icon: '▬' },
        { id: 'facing', label: 'Facing the sun', icon: '📐' },
        { id: 'same', label: 'Both the same', icon: '⚖️' }
      ],
      guessSentence: (o) => (o.id === 'same'
        ? 'I think flat and facing the sun will be the same.'
        : `I think it will spin faster ${o.label.toLowerCase()}.`),
      needs: [
        { icon: '🚩', label: 'Your sun spinner' },
        { icon: '📚', label: 'A book to lean the panel on' }
      ],
      safety: SUN_SAFETY,
      steps: [
        { icon: '▬', text: 'Lay the panel flat on the ground in the sun.' },
        { icon: '👀', text: 'Watch the flag. Tap how fast it spins.' },
        { icon: '📐', text: 'Lean it on a book so it faces the sun.' },
        { icon: '🌞', text: 'Its shadow behind it should be as short as possible.' },
        { icon: '👀', text: 'Watch the flag again and tap.' }
      ],
      samples: [
        { id: 'flat', label: 'Flat', icon: '▬' },
        { id: 'facing', label: 'Facing the sun', icon: '📐' }
      ],
      fields: [
        spinField,
        { id: 'time', kind: 'stopwatch', label: 'Solar car: seconds to go 1 metre', unit: 's', level: 'explorer' }
      ],
      wordBank: ['angle', 'flat', 'facing', 'tilt', 'shadow', 'faster'],
      judge(obs) {
        // Explorers who timed a solar car get the stopwatch comparison; the
        // spin picture answers work for everyone.
        const timed = leastCount(obs, this.samples, 'time', 'Seconds to go 1 metre', ' s');
        if (timed) {
          const [only] = timed.result;
          return { result: timed.result.length === 2 ? ['same'] : [only], text: timed.text.replace('Lowest', 'Fastest') };
        }
        return rankChoice(obs, this.samples, 'spin', {
          order: SPIN_ORDER, want: 'most', optionLabel: label, noun: 'The flag spun -'
        });
      },
      scientists: 'A panel makes the most electricity when it faces the sun straight on. Near the middle of the day in Thailand the sun is high, so flat can be almost as good.',
      newWords: [{ word: 'Angle', meaning: 'How much something is tilted.' }]
    }
  ]
};
