/**
 * Surgery: Interactive 3D Anatomy & Precision Extraction Simulation
 * Created by Ana Isa Palazuelos
 *
 * Pure game state, organ definitions, scoring rules, and redemption question deck.
 */

export const CREATOR_NAME = 'Ana Isa Palazuelos';

export const STL_MODELS = {
  brain: 'https://res.cloudinary.com/dkplz6vbx/raw/upload/v1794811003/Brain_ziynpj.stl',
  heart: 'https://res.cloudinary.com/dkplz6vbx/raw/upload/v1794811208/heart_1_lr1glk.stl',
  digestive: 'https://res.cloudinary.com/dkplz6vbx/raw/upload/v1794811000/Digestive_system_wyikfh.stl'
};

export const GAME_RULES = {
  defaultTargetScore: 30,
  targetScoreOptions: [15, 30, 45],
  buzzPenalty: -5,
  redemptionReward: 3,
  redemptionWrongPenalty: -2,
  maxPlayers: 4
};

/**
 * 7 removable organs from Ana Isa Palazuelos's Game Manual.
 * cavityPos: [x, y, z] inside the 3D human body model.
 * corridorWidth: normalized half-width of the safe extraction channel (smaller = harder).
 */
export const ORGANS = [
  {
    id: 'brain',
    name: 'Brain',
    points: 4,
    location: 'Inside the skull.',
    function: 'Controls thought, memory, movement, sensation, and many automatic body functions.',
    funFact: 'Your brain contains roughly 86 billion neurons and uses about 20% of your body’s oxygen and energy.',
    color: '#f4a7b9',
    cavityPos: [0, 1.85, 0.05],
    cavityRadius: 0.42,
    corridorWidth: 0.15,
    stlUrl: STL_MODELS.brain
  },
  {
    id: 'heart',
    name: 'Heart',
    points: 3,
    location: 'In the chest, between the lungs, slightly left of the body’s midline.',
    function: 'Pumps blood throughout the body.',
    funFact: 'An average heart beats around 100,000 times a day, pumping about 7,500 liters of blood.',
    color: '#e11d48',
    cavityPos: [0.1, 0.72, 0.16],
    cavityRadius: 0.28,
    corridorWidth: 0.17,
    stlUrl: STL_MODELS.heart
  },
  {
    id: 'lungs',
    name: 'Lungs',
    points: 5,
    location: 'In the chest, on either side of the heart.',
    function: 'Exchange oxygen and carbon dioxide during breathing.',
    funFact: 'If unfolded flat, the tiny alveoli inside your lungs would cover roughly the area of a tennis court.',
    color: '#fb7185',
    cavityPos: [0, 0.76, 0.04],
    cavityRadius: 0.52,
    corridorWidth: 0.13,
    stlUrl: null
  },
  {
    id: 'liver',
    name: 'Liver',
    points: 2,
    location: 'In the upper right abdomen, beneath the diaphragm.',
    function: 'Processes nutrients, produces bile, and helps break down harmful substances.',
    funFact: 'The liver is the only internal human organ capable of regenerating lost tissue.',
    color: '#9f1239',
    cavityPos: [-0.24, 0.26, 0.12],
    cavityRadius: 0.3,
    corridorWidth: 0.21,
    stlUrl: null
  },
  {
    id: 'stomach',
    name: 'Stomach',
    points: 2,
    location: 'In the upper abdomen, mostly toward the left side.',
    function: 'Stores and mixes food with acid and digestive enzymes.',
    funFact: 'Stomach acid is strong enough to dissolve many metals, yet a protective mucus lining keeps the stomach safe.',
    color: '#f97316',
    cavityPos: [0.22, 0.22, 0.12],
    cavityRadius: 0.26,
    corridorWidth: 0.21,
    stlUrl: null
  },
  {
    id: 'small_intestine',
    name: 'Small Intestine',
    points: 2,
    location: 'Coiled in the central and lower abdomen, inside the frame of the large intestine.',
    function: 'Completes much of digestion and absorbs most nutrients.',
    funFact: 'Even though it is called "small" for its diameter, it is about 6 meters (20 feet) long!',
    color: '#fbbf24',
    cavityPos: [0, -0.22, 0.14],
    cavityRadius: 0.34,
    corridorWidth: 0.2,
    stlUrl: null
  },
  {
    id: 'large_intestine',
    name: 'Large Intestine',
    points: 5,
    location: 'Surrounds much of the small intestine and extends around the abdominal cavity.',
    function: 'Absorbs water and electrolytes and helps form stool.',
    funFact: 'Trillions of helpful gut bacteria live in the large intestine and produce essential vitamins like vitamin K.',
    color: '#d97706',
    cavityPos: [0, -0.22, 0.04],
    cavityRadius: 0.5,
    corridorWidth: 0.13,
    stlUrl: null
  }
];

export const ORGAN_BY_ID = Object.fromEntries(ORGANS.map((o) => [o.id, o]));

/**
 * Anatomical Redemption Cards (front = question, back = answer & explanation).
 */
export const REDEMPTION_CARDS = [
  {
    id: 'red-brain-1',
    organId: 'brain',
    question: 'Where is the brain located in the human body?',
    options: ['Inside the chest cavity', 'Inside the skull', 'Behind the stomach', 'Inside the spinal column only'],
    correctIndex: 1,
    answer: 'Inside the skull.',
    explanation: 'The skull (cranium) forms a protective bony case around the brain.'
  },
  {
    id: 'red-brain-2',
    organId: 'brain',
    question: 'Which of the following is a primary function of the brain?',
    options: [
      'Pumping blood through arteries',
      'Producing bile for digestion',
      'Controlling thought, memory, movement, and sensation',
      'Absorbing water from digested food'
    ],
    correctIndex: 2,
    answer: 'Controlling thought, memory, movement, and sensation.',
    explanation: 'The brain is the control center of the nervous system, coordinating both conscious and automatic functions.'
  },
  {
    id: 'red-heart-1',
    organId: 'heart',
    question: 'Where is the heart positioned in the chest?',
    options: [
      'Between the lungs, slightly left of the midline',
      'Beneath the diaphragm on the right side',
      'Inside the skull',
      'Below the small intestine'
    ],
    correctIndex: 0,
    answer: 'Between the lungs, slightly left of the body’s midline.',
    explanation: 'The heart sits in the mediastinum between the left and right lungs, tilted slightly to the left.'
  },
  {
    id: 'red-heart-2',
    organId: 'heart',
    question: 'What is the main job of the heart?',
    options: [
      'Exchanging oxygen and carbon dioxide',
      'Pumping blood throughout the body',
      'Mixing food with acid',
      'Filtering toxins and making bile'
    ],
    correctIndex: 1,
    answer: 'Pumping blood throughout the body.',
    explanation: 'The heart’s muscular chambers pump oxygen-rich blood to tissues and oxygen-poor blood to the lungs.'
  },
  {
    id: 'red-lungs-1',
    organId: 'lungs',
    question: 'What gases are exchanged in the lungs during breathing?',
    options: [
      'Nitrogen and hydrogen',
      'Oxygen and carbon dioxide',
      'Methane and helium',
      'Water vapor and bile'
    ],
    correctIndex: 1,
    answer: 'Oxygen and carbon dioxide.',
    explanation: 'The lungs bring oxygen into the bloodstream and remove carbon dioxide waste.'
  },
  {
    id: 'red-lungs-2',
    organId: 'lungs',
    question: 'Where are the lungs located?',
    options: [
      'In the lower abdomen',
      'In the chest, on either side of the heart',
      'Inside the skull',
      'Behind the large intestine'
    ],
    correctIndex: 1,
    answer: 'In the chest, on either side of the heart.',
    explanation: 'Protected by the rib cage, the left and right lungs flank the heart.'
  },
  {
    id: 'red-liver-1',
    organId: 'liver',
    question: 'Where is the liver located?',
    options: [
      'Upper right abdomen, beneath the diaphragm',
      'Upper left chest, above the heart',
      'Lower central abdomen, inside the colon',
      'Inside the skull'
    ],
    correctIndex: 0,
    answer: 'In the upper right abdomen, beneath the diaphragm.',
    explanation: 'The liver is the largest internal organ and sits primarily in the upper right quadrant.'
  },
  {
    id: 'red-liver-2',
    organId: 'liver',
    question: 'Which digestive fluid does the liver produce?',
    options: ['Saliva', 'Bile', 'Hydrochloric acid', 'Insulin'],
    correctIndex: 1,
    answer: 'Bile.',
    explanation: 'The liver produces bile to help break down fats, while also processing nutrients and detoxifying substances.'
  },
  {
    id: 'red-stomach-1',
    organId: 'stomach',
    question: 'What does the stomach use to break down and mix food?',
    options: [
      'Acid and digestive enzymes',
      'Oxygen and red blood cells',
      'Bile and electrical impulses',
      'Water and electrolytes only'
    ],
    correctIndex: 0,
    answer: 'Acid and digestive enzymes.',
    explanation: 'The stomach churns food with gastric acid and enzymes to begin protein digestion and kill microbes.'
  },
  {
    id: 'red-stomach-2',
    organId: 'stomach',
    question: 'Where is the stomach mostly located?',
    options: [
      'Upper abdomen, mostly toward the left side',
      'Lower right abdomen',
      'Between the lungs',
      'Inside the skull'
    ],
    correctIndex: 0,
    answer: 'In the upper abdomen, mostly toward the left side.',
    explanation: 'The stomach lies just below the diaphragm on the left side of the upper abdomen.'
  },
  {
    id: 'red-small-1',
    organId: 'small_intestine',
    question: 'What is the primary role of the small intestine?',
    options: [
      'Pumping blood to the brain',
      'Completing much of digestion and absorbing most nutrients',
      'Exchanging oxygen during breathing',
      'Producing bile'
    ],
    correctIndex: 1,
    answer: 'Completing much of digestion and absorbing most nutrients.',
    explanation: 'Tiny finger-like villi lining the small intestine absorb nutrients into the bloodstream.'
  },
  {
    id: 'red-small-2',
    organId: 'small_intestine',
    question: 'Where is the small intestine positioned?',
    options: [
      'Coiled in the central and lower abdomen, inside the frame of the large intestine',
      'Above the diaphragm in the chest',
      'Surrounding the outside of the liver',
      'Inside the skull'
    ],
    correctIndex: 0,
    answer: 'Coiled in the central and lower abdomen, inside the frame of the large intestine.',
    explanation: 'The large intestine frames the coiled loops of the small intestine.'
  },
  {
    id: 'red-large-1',
    organId: 'large_intestine',
    question: 'What does the large intestine mainly absorb?',
    options: [
      'Oxygen and nitrogen',
      'Water and electrolytes',
      'Stomach acid',
      'Red blood cells'
    ],
    correctIndex: 1,
    answer: 'Water and electrolytes.',
    explanation: 'The large intestine reabsorbs water and electrolytes from remaining indigestible matter and helps form stool.'
  },
  {
    id: 'red-large-2',
    organId: 'large_intestine',
    question: 'How is the large intestine arranged relative to the small intestine?',
    options: [
      'It sits above the lungs',
      'It surrounds much of the small intestine around the abdominal cavity',
      'It is coiled inside the stomach',
      'It connects directly to the brain'
    ],
    correctIndex: 1,
    answer: 'It surrounds much of the small intestine and extends around the abdominal cavity.',
    explanation: 'The colon ascends on the right, crosses transversely, and descends on the left around the small intestine.'
  }
];

export function shuffleDeck(items, rng = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createInitialGameState({ playerNames = ['Surgeon 1'], targetScore = GAME_RULES.defaultTargetScore } = {}) {
  const cleanNames = playerNames
    .map((n, idx) => (n && n.trim() ? n.trim() : `Surgeon ${idx + 1}`))
    .slice(0, GAME_RULES.maxPlayers);

  if (cleanNames.length === 0) cleanNames.push('Surgeon 1');

  return {
    phase: 'draw', // 'draw' | 'identify' | 'extract' | 'redemption' | 'turn_result' | 'finished'
    targetScore,
    players: cleanNames.map((name, idx) => ({
      id: `p-${idx + 1}`,
      name,
      score: 0,
      extractions: 0,
      buzzes: 0,
      redemptionsWon: 0
    })),
    currentPlayerIndex: 0,
    organDeck: shuffleDeck(ORGANS.map((o) => o.id)),
    redemptionDeck: shuffleDeck(REDEMPTION_CARDS.map((c) => c.id)),
    activeOrganId: null,
    activeRedemptionId: null,
    lastResult: null,
    warningActive: false,
    winnerId: null,
    turnNumber: 1,
    history: []
  };
}

export function drawOrganCard(state, rng = Math.random) {
  if (state.phase !== 'draw' && state.phase !== 'turn_result') return state;
  let deck = state.organDeck.length > 0 ? [...state.organDeck] : shuffleDeck(ORGANS.map((o) => o.id), rng);
  const nextOrganId = deck.shift();
  return {
    ...state,
    phase: 'identify',
    organDeck: deck,
    activeOrganId: nextOrganId,
    activeRedemptionId: null,
    lastResult: null,
    warningActive: false
  };
}

export function beginExtraction(state) {
  if (state.phase !== 'identify' || !state.activeOrganId) return state;
  return {
    ...state,
    phase: 'extract',
    warningActive: false
  };
}

function advanceTurn(players, currentIndex) {
  return (currentIndex + 1) % players.length;
}

export function recordExtractionSuccess(state) {
  if (state.phase !== 'extract' || !state.activeOrganId) return state;
  const organ = ORGAN_BY_ID[state.activeOrganId];
  const currentPlayer = state.players[state.currentPlayerIndex];
  const newScore = currentPlayer.score + organ.points;

  const players = state.players.map((p, idx) =>
    idx === state.currentPlayerIndex
      ? { ...p, score: newScore, extractions: p.extractions + 1 }
      : p
  );

  const won = newScore >= state.targetScore;
  const entry = {
    turn: state.turnNumber,
    playerName: currentPlayer.name,
    organName: organ.name,
    outcome: 'success',
    delta: organ.points,
    scoreAfter: newScore
  };

  return {
    ...state,
    phase: won ? 'finished' : 'turn_result',
    players,
    winnerId: won ? currentPlayer.id : null,
    warningActive: false,
    lastResult: {
      type: 'success',
      organId: organ.id,
      delta: organ.points,
      message: `${currentPlayer.name} extracted the ${organ.name} cleanly (+${organ.points} pts)!`
    },
    currentPlayerIndex: won ? state.currentPlayerIndex : advanceTurn(players, state.currentPlayerIndex),
    turnNumber: won ? state.turnNumber : state.turnNumber + 1,
    history: [entry, ...state.history].slice(0, 20)
  };
}

export function recordEdgeTouch(state, rng = Math.random) {
  if (state.phase !== 'extract' || !state.activeOrganId) return state;
  const organ = ORGAN_BY_ID[state.activeOrganId];
  const currentPlayer = state.players[state.currentPlayerIndex];
  const newScore = currentPlayer.score + GAME_RULES.buzzPenalty;

  const players = state.players.map((p, idx) =>
    idx === state.currentPlayerIndex
      ? { ...p, score: newScore, buzzes: p.buzzes + 1 }
      : p
  );

  let rDeck = state.redemptionDeck.length > 0
    ? [...state.redemptionDeck]
    : shuffleDeck(REDEMPTION_CARDS.map((c) => c.id), rng);
  const nextRedemptionId = rDeck.shift();

  return {
    ...state,
    phase: 'redemption',
    players,
    redemptionDeck: rDeck,
    activeRedemptionId: nextRedemptionId,
    warningActive: true,
    lastResult: {
      type: 'buzz',
      organId: organ.id,
      delta: GAME_RULES.buzzPenalty,
      message: `Conductive edge touched! ${currentPlayer.name} loses ${Math.abs(GAME_RULES.buzzPenalty)} pts.`
    }
  };
}

export function answerRedemptionCard(state, selectedIndex) {
  if (state.phase !== 'redemption' || !state.activeRedemptionId) return state;
  const card = REDEMPTION_CARDS.find((c) => c.id === state.activeRedemptionId);
  if (!card) return state;

  const currentPlayer = state.players[state.currentPlayerIndex];
  const organ = ORGAN_BY_ID[state.activeOrganId];
  const isCorrect = selectedIndex === card.correctIndex;
  const delta = isCorrect ? GAME_RULES.redemptionReward : GAME_RULES.redemptionWrongPenalty;
  const newScore = currentPlayer.score + delta;

  const players = state.players.map((p, idx) =>
    idx === state.currentPlayerIndex
      ? {
          ...p,
          score: newScore,
          redemptionsWon: isCorrect ? p.redemptionsWon + 1 : p.redemptionsWon
        }
      : p
  );

  const won = newScore >= state.targetScore;
  const netDelta = GAME_RULES.buzzPenalty + delta;
  const entry = {
    turn: state.turnNumber,
    playerName: currentPlayer.name,
    organName: organ?.name || 'Organ',
    outcome: isCorrect ? 'redeemed' : 'buzz_missed',
    delta: netDelta,
    scoreAfter: newScore
  };

  return {
    ...state,
    phase: won ? 'finished' : 'turn_result',
    players,
    winnerId: won ? currentPlayer.id : null,
    warningActive: false,
    lastResult: {
      type: isCorrect ? 'redeemed' : 'buzz_missed',
      organId: state.activeOrganId,
      delta: netDelta,
      redemptionDelta: delta,
      correct: isCorrect,
      message: isCorrect
        ? `Correct! ${currentPlayer.name} regains +${GAME_RULES.redemptionReward} pts (net ${netDelta} pts).`
        : `Incorrect! ${currentPlayer.name} loses ${Math.abs(GAME_RULES.redemptionWrongPenalty)} extra pts (total ${netDelta} pts).`
    },
    currentPlayerIndex: won ? state.currentPlayerIndex : advanceTurn(players, state.currentPlayerIndex),
    turnNumber: won ? state.turnNumber : state.turnNumber + 1,
    history: [entry, ...state.history].slice(0, 20)
  };
}

export function skipRedemption(state) {
  if (state.phase !== 'redemption') return state;
  const currentPlayer = state.players[state.currentPlayerIndex];
  const organ = ORGAN_BY_ID[state.activeOrganId];

  const entry = {
    turn: state.turnNumber,
    playerName: currentPlayer.name,
    organName: organ?.name || 'Organ',
    outcome: 'buzz',
    delta: GAME_RULES.buzzPenalty,
    scoreAfter: currentPlayer.score
  };

  return {
    ...state,
    phase: 'turn_result',
    warningActive: false,
    activeRedemptionId: null,
    lastResult: {
      type: 'buzz',
      organId: state.activeOrganId,
      delta: GAME_RULES.buzzPenalty,
      message: `${currentPlayer.name} skipped the Redemption Card (${GAME_RULES.buzzPenalty} pts).`
    },
    currentPlayerIndex: advanceTurn(state.players, state.currentPlayerIndex),
    turnNumber: state.turnNumber + 1,
    history: [entry, ...state.history].slice(0, 20)
  };
}
