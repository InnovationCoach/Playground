/**
 * Activity 7 - Plant Microscope Lab: content and pure logic.
 *
 * Written for learners who find long writing hard. Nothing in this activity asks
 * for a sentence: a guess is a tap on a picture, an observation is a set of
 * chips, a count is a big button pressed once per thing seen, and a drawing
 * replaces a description. The app turns those taps back into sentences so the
 * learner's lab book still reads like a scientist's.
 *
 * The same no-unearned-numbers rule as Solar Car and SO₂ applies: "Your data
 * says" is built only from what the learner recorded. "What scientists often
 * see" is kept separate, shown only after recording, and never overwrites her
 * result - a different result is still a real result.
 */

export const LENSES = [
  { id: '4x', label: '4×', hint: 'Smallest lens - start here' },
  { id: '10x', label: '10×', hint: 'Middle lens' },
  { id: '40x', label: '40×', hint: 'Biggest lens - focus slowly' }
];

export const COLOURS = [
  { id: 'green', label: 'Green', swatch: '#22c55e' },
  { id: 'yellow', label: 'Yellow', swatch: '#facc15' },
  { id: 'brown', label: 'Brown', swatch: '#a16207' },
  { id: 'purple', label: 'Purple', swatch: '#a855f7' },
  { id: 'red', label: 'Red / pink', swatch: '#f43f5e' },
  { id: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { id: 'clear', label: 'No colour', swatch: 'transparent' }
];

// Shapes are drawn as small SVGs in the UI (see ShapeIcon), so a learner picks
// the picture that matches what she sees rather than having to name it.
export const SHAPES = [
  { id: 'bricks', label: 'Bricks' },
  { id: 'round', label: 'Round' },
  { id: 'jigsaw', label: 'Jigsaw' },
  { id: 'tubes', label: 'Long tubes' },
  { id: 'dots', label: 'Tiny dots' },
  { id: 'blobs', label: 'Messy blobs' }
];

export const CLARITY = [
  { id: 1, label: 'Hard to see', icon: '🌫️' },
  { id: 2, label: 'OK', icon: '🙂' },
  { id: 3, label: 'Very clear', icon: '🤩' }
];

export const SURE = [
  { id: 1, label: 'Not sure', icon: '🤔' },
  { id: 2, label: 'A bit sure', icon: '🙂' },
  { id: 3, label: 'Very sure', icon: '😎' }
];

export const VERDICTS = [
  { id: 'yes', label: 'My guess was right', icon: '✅' },
  { id: 'partly', label: 'Partly right', icon: '🌗' },
  { id: 'no', label: 'Something different happened', icon: '🔄' },
  { id: 'unsure', label: 'Not sure yet', icon: '🤔' }
];

/**
 * Two counts closer than this are "about the same".
 *
 * Counting stomata by eye in one field of view easily misses one or two, so an
 * exact-equality rule would tell a learner who counted 11 and 12 that the sides
 * differ. Two is a judgement for this age, not a statistical test.
 */
export const SAME_COUNT_TOLERANCE = 2;

export const STAGES = [
  { id: 'ready', label: 'Get ready', icon: '🧺' },
  { id: 'guess', label: 'My guess', icon: '💭' },
  { id: 'do', label: 'Do it', icon: '🧪' },
  { id: 'look', label: 'Look & record', icon: '🔬' },
  { id: 'result', label: 'What happened', icon: '⭐' }
];

/*
 * Field kinds used in an experiment's `fields` list:
 *   lens    - which objective lens (LENSES)
 *   colours - one or more COLOURS
 *   shape   - one of SHAPES
 *   count   - tap counter; null until touched, because 0 is a real count
 *   choice  - one of the field's own `options`
 *   clarity - 1-3 (CLARITY)
 *   draw    - a drawing in a round "microscope view"
 * Every sample also gets a short `words` box with a tap-to-add word bank.
 */

export const EXPERIMENTS = [
  {
    id: 'parts',
    icon: '🌱',
    title: 'Plant Parts Tour',
    short: 'Look at a leaf, a stem, a root and a petal.',
    question: 'Which plant part will look the most green?',
    guessPrompt: 'I think the most green part will be the…',
    options: [
      { id: 'leaf', label: 'Leaf', icon: '🍃' },
      { id: 'stem', label: 'Stem', icon: '🌿' },
      { id: 'root', label: 'Root', icon: '🥕' },
      { id: 'petal', label: 'Petal', icon: '🌸' }
    ],
    guessSentence: (o) => `I think the ${o.label.toLowerCase()} will look the most green.`,
    needs: [
      { icon: '🔬', label: 'Microscope' },
      { icon: '🪟', label: 'Slides and cover slips' },
      { icon: '💧', label: 'Dropper with water' },
      { icon: '🥢', label: 'Tweezers' },
      { icon: '🍃', label: 'A small leaf' },
      { icon: '🌿', label: 'A very thin slice of stem' },
      { icon: '🌱', label: 'A root (cress or bean sprout is best)' },
      { icon: '🌸', label: 'A petal' }
    ],
    safety: ['Ask an adult to cut the thin stem slice.', 'Slides are glass. Hold them by the edges.'],
    steps: [
      { text: 'Put one drop of water in the middle of a slide.', icon: '💧' },
      { text: 'Use tweezers to put a tiny piece of leaf on the water.', icon: '🥢' },
      { text: 'Lower a cover slip on top, slowly, from one side.', icon: '🪟' },
      { text: 'Start with the smallest lens (4×). Turn the focus knob slowly.', icon: '🔬' },
      { text: 'Look! Then record what you see on the next page.', icon: '👀' },
      { text: 'Now do the stem, root and petal. Use a new slide each time.', icon: '🔁' }
    ],
    samples: [
      { id: 'leaf', label: 'Leaf', icon: '🍃' },
      { id: 'stem', label: 'Stem', icon: '🌿' },
      { id: 'root', label: 'Root', icon: '🥕' },
      { id: 'petal', label: 'Petal', icon: '🌸' }
    ],
    fields: [
      { id: 'lens', kind: 'lens', label: 'Which lens?' },
      { id: 'colours', kind: 'colours', label: 'What colours can you see?' },
      { id: 'shape', kind: 'shape', label: 'What shape are the cells?' },
      { id: 'drawing', kind: 'draw', label: 'Draw what you see' }
    ],
    wordBank: ['green', 'cells', 'tiny', 'dots', 'lines', 'veins', 'hairs', 'clear', 'bumpy', 'pretty'],
    // Every part she marked green, from her own chips.
    judge(obs) {
      const green = this.samples.filter((s) => (obs[s.id]?.colours || []).includes('green'));
      const recorded = this.samples.filter((s) => (obs[s.id]?.colours || []).length > 0);
      if (recorded.length < 2) return null;
      if (!green.length) {
        return { result: [], text: 'You did not see green in any part you looked at.' };
      }
      return {
        result: green.map((s) => s.id),
        text: `You saw green in: ${listJoin(green.map((s) => s.label.toLowerCase()))}.`
      };
    },
    scientists:
      'Leaves are usually the greenest part. The green comes from tiny green blobs called chloroplasts. They use sunlight to make food for the plant. Roots grow in the dark, so they are usually not green.',
    newWords: [
      { word: 'Cell', meaning: 'A tiny building block. Every plant is made of cells.' },
      { word: 'Chloroplast', meaning: 'A tiny green blob in a cell. It makes food from sunlight.' }
    ]
  },

  {
    id: 'onion',
    icon: '🧅',
    title: 'Onion Skin Cells',
    short: 'Does a stain help you see the cells?',
    question: 'Will iodine stain make the onion cells easier to see?',
    guessPrompt: 'I think with iodine the cells will be…',
    options: [
      { id: 'easier', label: 'Easier to see', icon: '🔍' },
      { id: 'same', label: 'No different', icon: '⚖️' },
      { id: 'harder', label: 'Harder to see', icon: '🌫️' }
    ],
    guessSentence: (o) => `I think iodine will make the cells ${o.id === 'same' ? 'look no different' : o.label.toLowerCase()}.`,
    needs: [
      { icon: '🔬', label: 'Microscope' },
      { icon: '🪟', label: 'Two slides and cover slips' },
      { icon: '🧅', label: 'A piece of onion' },
      { icon: '🥢', label: 'Tweezers' },
      { icon: '💧', label: 'Dropper with water' },
      { icon: '🟤', label: 'Iodine solution (adult)' },
      { icon: '🧤', label: 'Gloves' }
    ],
    safety: [
      'An adult looks after the iodine. It stains skin and clothes.',
      'Wear gloves. Keep iodine away from your eyes and mouth.'
    ],
    steps: [
      { text: 'Peel the very thin see-through skin from inside a piece of onion.', icon: '🧅' },
      { text: 'Slide 1: put the skin flat on a drop of WATER. Add a cover slip.', icon: '💧' },
      { text: 'Slide 2: put another piece of skin on a drop of IODINE. Add a cover slip.', icon: '🟤', adult: true },
      { text: 'Use the SAME lens for both slides. That makes it a fair test.', icon: '⚖️' },
      { text: 'Look at slide 1, then slide 2. Record each one.', icon: '👀' }
    ],
    samples: [
      { id: 'water', label: 'Slide 1: Water', icon: '💧' },
      { id: 'iodine', label: 'Slide 2: Iodine', icon: '🟤' }
    ],
    fields: [
      { id: 'lens', kind: 'lens', label: 'Which lens?' },
      { id: 'clarity', kind: 'clarity', label: 'How clear are the cells?' },
      { id: 'shape', kind: 'shape', label: 'What shape are the cells?' },
      {
        id: 'nucleus', kind: 'choice', label: 'Can you see a dark dot inside each cell?',
        options: [
          { id: 'yes', label: 'Yes', icon: '⚫' },
          { id: 'no', label: 'No', icon: '⭕' },
          { id: 'unsure', label: 'Not sure', icon: '🤔' }
        ]
      },
      { id: 'colours', kind: 'colours', label: 'What colours can you see?' },
      { id: 'drawing', kind: 'draw', label: 'Draw what you see' }
    ],
    wordBank: ['bricks', 'wall', 'dot', 'lines', 'yellow', 'brown', 'clear', 'see-through', 'bubbles'],
    judge(obs) {
      const a = obs.water?.clarity;
      const b = obs.iodine?.clarity;
      if (!a || !b) return null;
      const result = b > a ? 'easier' : b < a ? 'harder' : 'same';
      const word = (v) => CLARITY.find((c) => c.id === v)?.label.toLowerCase();
      return {
        result,
        text: `Water slide: ${word(a)}. Iodine slide: ${word(b)}.`,
        warning: lensWarning(obs, ['water', 'iodine'])
      };
    },
    scientists:
      'Onion cells look like bricks in a wall. Iodine often turns them yellow-brown and makes a dark dot in each cell easier to see. That dot is the nucleus - the cell\'s control centre.',
    newWords: [
      { word: 'Stain', meaning: 'A colour we add so parts are easier to see.' },
      { word: 'Nucleus', meaning: 'The control centre of a cell. It looks like a dot.' },
      { word: 'Fair test', meaning: 'Change only one thing. Keep everything else the same.' }
    ]
  },

  {
    id: 'stomata',
    icon: '🍃',
    title: 'Leaf Mouths',
    short: 'Count the tiny mouths on each side of a leaf.',
    question: 'Which side of a leaf has more tiny mouths (stomata)?',
    guessPrompt: 'I think more tiny mouths will be on the…',
    options: [
      { id: 'top', label: 'Top side', icon: '⬆️' },
      { id: 'bottom', label: 'Bottom side', icon: '⬇️' },
      { id: 'same', label: 'About the same', icon: '⚖️' }
    ],
    guessSentence: (o) => (o.id === 'same'
      ? 'I think both sides will have about the same number of tiny mouths.'
      : `I think the ${o.label.toLowerCase()} will have more tiny mouths.`),
    needs: [
      { icon: '🔬', label: 'Microscope' },
      { icon: '🍃', label: 'A fresh leaf (not hairy)' },
      { icon: '💅', label: 'Clear nail varnish (adult)' },
      { icon: '🩹', label: 'Clear sticky tape' },
      { icon: '🪟', label: 'Two slides' }
    ],
    safety: [
      'An adult helps with the nail varnish. Open a window - it has a strong smell.',
      'Wash your hands after.'
    ],
    steps: [
      { text: 'Paint a small patch of clear nail varnish on the TOP of the leaf.', icon: '💅', adult: true },
      { text: 'Paint a small patch on the BOTTOM of the leaf too.', icon: '💅', adult: true },
      { text: 'Wait until it is dry. About 10 minutes.', icon: '⏳' },
      { text: 'Press sticky tape on the patch. Peel it off slowly. Stick it on a slide.', icon: '🩹' },
      { text: 'Use the same lens for both slides (10× or 40×).', icon: '⚖️' },
      { text: 'Tap the counter once for each tiny mouth you see.', icon: '👆' }
    ],
    samples: [
      { id: 'top', label: 'Top side', icon: '⬆️' },
      { id: 'bottom', label: 'Bottom side', icon: '⬇️' }
    ],
    fields: [
      { id: 'lens', kind: 'lens', label: 'Which lens?' },
      { id: 'count', kind: 'count', label: 'Tap once for each tiny mouth', icon: '👄' },
      { id: 'drawing', kind: 'draw', label: 'Draw what you see' }
    ],
    wordBank: ['mouths', 'holes', 'pairs', 'lips', 'jigsaw', 'many', 'few', 'none'],
    judge(obs) {
      const top = obs.top?.count;
      const bottom = obs.bottom?.count;
      if (!Number.isFinite(top) || !Number.isFinite(bottom)) return null;
      const result = Math.abs(top - bottom) <= SAME_COUNT_TOLERANCE ? 'same' : top > bottom ? 'top' : 'bottom';
      return {
        result,
        text: `You counted ${top} on the top and ${bottom} on the bottom.`,
        warning: lensWarning(obs, ['top', 'bottom'])
      };
    },
    scientists:
      'Many leaves have more stomata on the bottom side. It is shady and cool there, so the leaf loses less water. Some plants are different - water lilies have theirs on top!',
    newWords: [
      { word: 'Stomata', meaning: 'Tiny mouths on a leaf. They let air in and water out.' },
      { word: 'Fair test', meaning: 'Change only one thing. Keep everything else the same.' }
    ]
  },

  {
    id: 'salt',
    icon: '🧂',
    title: 'Salty Water Test',
    short: 'What does salt water do to cells?',
    question: 'What will salty water do to red onion cells?',
    guessPrompt: 'I think in salty water the cells will…',
    options: [
      { id: 'bigger', label: 'Get bigger', icon: '🎈' },
      { id: 'shrunk', label: 'Shrink', icon: '🤏' },
      { id: 'same', label: 'Stay the same', icon: '⚖️' }
    ],
    guessSentence: (o) => `I think salty water will make the cells ${o.id === 'same' ? 'stay the same' : o.label.toLowerCase()}.`,
    needs: [
      { icon: '🔬', label: 'Microscope' },
      { icon: '🧅', label: 'A red onion' },
      { icon: '🪟', label: 'Two slides and cover slips' },
      { icon: '💧', label: 'Plain water' },
      { icon: '🧂', label: 'Very salty water' },
      { icon: '🥢', label: 'Tweezers' }
    ],
    safety: ['An adult cuts the onion.', 'Onions can make your eyes sting. Do not rub them.'],
    steps: [
      { text: 'Peel a thin purple skin from the red onion.', icon: '🧅', adult: true },
      { text: 'Slide 1: put a piece on PLAIN water. Add a cover slip.', icon: '💧' },
      { text: 'Slide 2: put a piece on SALTY water. Add a cover slip.', icon: '🧂' },
      { text: 'Wait 5 minutes.', icon: '⏳' },
      { text: 'Use the same lens. Look at the purple part of the cells on each slide.', icon: '👀' }
    ],
    samples: [
      { id: 'plain', label: 'Slide 1: Plain water', icon: '💧' },
      { id: 'salty', label: 'Slide 2: Salty water', icon: '🧂' }
    ],
    fields: [
      { id: 'lens', kind: 'lens', label: 'Which lens?' },
      {
        id: 'size', kind: 'choice', label: 'The purple part of the cells…',
        options: [
          { id: 'full', label: 'Fills the cell', icon: '🟪' },
          { id: 'shrunk', label: 'Has shrunk', icon: '🤏' },
          { id: 'bigger', label: 'Looks bigger', icon: '🎈' }
        ]
      },
      { id: 'colours', kind: 'colours', label: 'What colours can you see?' },
      { id: 'drawing', kind: 'draw', label: 'Draw what you see' }
    ],
    wordBank: ['purple', 'shrink', 'small', 'full', 'wall', 'gap', 'squashed', 'bricks'],
    // Only the salty slide answers the question; the plain slide is the control
    // she compares against.
    judge(obs) {
      const plain = obs.plain?.size;
      const salty = obs.salty?.size;
      if (!salty) return null;
      let result;
      if (salty === 'shrunk') result = 'shrunk';
      else if (salty === 'bigger') result = 'bigger';
      else result = 'same';
      const label = (v) => this.fields.find((f) => f.id === 'size').options.find((o) => o.id === v)?.label.toLowerCase();
      return {
        result,
        text: plain
          ? `Plain water: the purple part ${label(plain)}. Salty water: the purple part ${label(salty)}.`
          : `Salty water: the purple part ${label(salty)}.`,
        warning: lensWarning(obs, ['plain', 'salty'])
      };
    },
    scientists:
      'In salty water, water moves OUT of the cells. The purple part shrinks and pulls away from the cell wall. Put the slide back in plain water and the cells can fill up again!',
    newWords: [
      { word: 'Cell wall', meaning: 'The strong outside edge of a plant cell.' },
      { word: 'Control', meaning: 'The slide we do not change, so we can compare.' }
    ]
  },

  {
    id: 'celery',
    icon: '🥬',
    title: 'Celery Drinking Test',
    short: 'Follow coloured water up a stem.',
    question: 'Where will coloured water go inside a celery stem?',
    guessPrompt: 'I think the coloured water will be…',
    options: [
      { id: 'everywhere', label: 'Everywhere in the stem', icon: '🌊' },
      { id: 'tubes', label: 'Only in little tubes', icon: '🔴' },
      { id: 'nowhere', label: 'Nowhere - it stays in the glass', icon: '🥛' }
    ],
    guessSentence: (o) => ({
      everywhere: 'I think the coloured water will go everywhere in the stem.',
      tubes: 'I think the coloured water will go up in little tubes.',
      nowhere: 'I think the coloured water will stay in the glass.'
    })[o.id],
    needs: [
      { icon: '🥬', label: 'A celery stick with leaves' },
      { icon: '🥛', label: 'A glass of water' },
      { icon: '🎨', label: 'Food colouring (red or blue)' },
      { icon: '🔪', label: 'Knife (adult)' },
      { icon: '🔬', label: 'Microscope and a slide' }
    ],
    safety: ['An adult does all the cutting.', 'Food colouring stains. Wear an apron.'],
    steps: [
      { text: 'Add lots of food colouring to the glass of water.', icon: '🎨' },
      { text: 'Stand the celery in the glass.', icon: '🥬' },
      { text: 'Wait! At least 2 hours, or leave it overnight. Your work is saved.', icon: '⏳' },
      { text: 'Look at the leaves. Have they changed colour?', icon: '🍃' },
      { text: 'An adult cuts a very thin slice across the stem.', icon: '🔪', adult: true },
      { text: 'Put the slice on a slide. Look with the 4× lens first.', icon: '🔬' }
    ],
    samples: [
      { id: 'slice', label: 'Stem slice', icon: '🥬' },
      { id: 'leaf', label: 'Leaf', icon: '🍃' }
    ],
    fields: [
      { id: 'lens', kind: 'lens', label: 'Which lens?' },
      {
        id: 'pattern', kind: 'choice', label: 'Where is the colour?',
        options: [
          { id: 'dots', label: 'In little dots', icon: '🔴' },
          { id: 'all', label: 'All over', icon: '🌊' },
          { id: 'none', label: 'No colour', icon: '⚪' }
        ]
      },
      { id: 'colours', kind: 'colours', label: 'What colours can you see?' },
      { id: 'drawing', kind: 'draw', label: 'Draw what you see' }
    ],
    wordBank: ['dots', 'tubes', 'ring', 'red', 'blue', 'lines', 'strings', 'water', 'up'],
    judge(obs) {
      const p = obs.slice?.pattern;
      if (!p) return null;
      const result = { dots: 'tubes', all: 'everywhere', none: 'nowhere' }[p];
      const text = {
        dots: 'In the stem slice, the colour was in little dots.',
        all: 'In the stem slice, the colour was all over.',
        none: 'In the stem slice, you saw no colour.'
      }[p];
      return { result, text };
    },
    scientists:
      'The colour usually shows as little dots in a ring. Each dot is the end of a tube called xylem. Xylem tubes carry water from the roots all the way up to the leaves - like drinking straws.',
    newWords: [
      { word: 'Xylem', meaning: 'Tiny tubes that carry water up a plant. Like straws.' }
    ]
  }
];

export const EXPERIMENT_BY_ID = new Map(EXPERIMENTS.map((e) => [e.id, e]));

// ---------------------------------------------------------------------------

function listJoin(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * A comparison is only fair at the same magnification. Returned as a gentle
 * prompt rather than a block: noticing it is the lesson.
 */
export function lensWarning(obs, sampleIds) {
  const lenses = sampleIds.map((id) => obs[id]?.lens).filter(Boolean);
  if (lenses.length < 2) return null;
  return new Set(lenses).size > 1
    ? 'You used different lenses. For a fair test, use the same lens for every slide.'
    : null;
}

export function newRecord(experimentId, records = [], now = Date.now()) {
  const trial = records.filter((r) => r.experimentId === experimentId).length + 1;
  return {
    id: `${experimentId}-${now}`,
    experimentId,
    trial,
    stage: 'ready',
    checklist: [],
    hypothesis: { choice: null, sure: null },
    stepsDone: [],
    observations: {},
    outcome: { verdict: null, words: '' },
    createdAt: now,
    updatedAt: now,
    finishedAt: null
  };
}

export function hypothesisSentence(exp, hypothesis) {
  const option = exp.options.find((o) => o.id === hypothesis?.choice);
  return option ? exp.guessSentence(option) : null;
}

/**
 * What her own data says, and whether it matches her guess.
 *
 * `suggested` is only a suggestion: the learner still picks her verdict, since
 * she may have seen something the chips could not capture.
 */
export function analyseRecord(exp, record) {
  const found = exp.judge(record.observations || {});
  if (!found) return { dataSays: null, suggested: null, warning: null };

  const guess = record.hypothesis?.choice;
  let suggested = null;
  if (guess) {
    if (Array.isArray(found.result)) {
      if (!found.result.includes(guess)) suggested = 'no';
      else suggested = found.result.length === 1 ? 'yes' : 'partly';
    } else {
      suggested = found.result === guess ? 'yes' : 'no';
    }
  }
  return { dataSays: found.text, suggested, warning: found.warning || null };
}

/** True when a sample has at least one thing recorded. */
export function sampleStarted(exp, obs) {
  if (!obs) return false;
  return exp.fields.some((f) => {
    const v = obs[f.id];
    if (f.kind === 'count') return Number.isFinite(v);
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== '';
  }) || Boolean(obs.words);
}

export function stageDone(exp, record, stageId) {
  switch (stageId) {
    case 'ready': return record.checklist.length >= exp.needs.length;
    case 'guess': return Boolean(record.hypothesis?.choice);
    case 'do': return record.stepsDone.length >= exp.steps.length;
    case 'look': return exp.samples.every((s) => sampleStarted(exp, record.observations[s.id]));
    case 'result': return Boolean(record.outcome?.verdict);
    default: return false;
  }
}

/** Stars earned: one per finished stage. Five stars = experiment complete. */
export function starsFor(exp, record) {
  return STAGES.filter((s) => stageDone(exp, record, s.id)).length;
}

/** One short line per sample for the lab book table. */
export function sampleSummary(exp, obs) {
  if (!obs) return '';
  const parts = [];
  for (const f of exp.fields) {
    const v = obs[f.id];
    if (v === undefined || v === null || v === '') continue;
    if (f.kind === 'lens') parts.push(LENSES.find((l) => l.id === v)?.label);
    else if (f.kind === 'colours' && v.length) {
      parts.push(v.map((c) => COLOURS.find((x) => x.id === c)?.label.toLowerCase()).join(', '));
    } else if (f.kind === 'shape') parts.push(SHAPES.find((s) => s.id === v)?.label.toLowerCase());
    else if (f.kind === 'count') parts.push(`${v} counted`);
    else if (f.kind === 'clarity') parts.push(CLARITY.find((c) => c.id === v)?.label.toLowerCase());
    else if (f.kind === 'choice') parts.push(f.options.find((o) => o.id === v)?.label.toLowerCase());
  }
  if (obs.words) parts.push(`"${obs.words}"`);
  return parts.filter(Boolean).join(' · ');
}

/** Everything a sentence reader needs for one step, as plain text. */
export function stageSpeech(exp, stageId) {
  switch (stageId) {
    case 'ready': return `${exp.title}. Let's get ready. Tap each thing when you have it.`;
    case 'guess': return `${exp.question} ${exp.guessPrompt}`;
    case 'do': return 'Do each step. Tap done when you finish it.';
    case 'look': return 'Look in the microscope. Tap what you see.';
    case 'result': return 'What happened? Let\'s look at your results.';
    default: return '';
  }
}
