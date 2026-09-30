/**
 * Hands-on STEAM guides for the eight Junior Explorers activities.
 *
 * The investigations (kit, steps, samples, fields) live in each activity file
 * and are shared with the app. This file adds what the classroom needs around
 * them: the big question, "I can" goals, the STEAM map, teacher preparation, a
 * timed running order, discussion prompts, an Art corner and a Maths corner
 * for the worksheet, and what to look for.
 *
 * No invented figures: maths prompts use the children's own measurements, and
 * real-world links are general, not statistics.
 */

export const HANDS_ON_GUIDES = {
  'hot-spots': {
    time: '60–90 minutes (mostly outdoors)',
    groups: 'Groups of 3',
    bigQuestion: 'Where is the hottest place at our school, and how could we cool it down?',
    goals: [
      'I can measure temperature with a micro:bit.',
      'I can do a fair test by waiting and not holding the thermometer.',
      'I can suggest a way to make a hot place cooler.'
    ],
    steam: {
      S: 'Sunlight warms surfaces; shade and light colours keep things cooler.',
      T: 'A micro:bit becomes a digital thermometer.',
      E: 'Plan a shade or cool roof for the hottest spot.',
      A: 'Draw a colour-coded "Cool School" map.',
      M: 'Read, compare and order temperatures in °C.'
    },
    prep: [
      'Load the thermometer program (Activity 3) onto every micro:bit and test it.',
      'Choose a sunny day. Walk the route and pick sunny, shady, grass, hard and sandy spots.',
      'Cut black and white paper, one sheet of each per group.',
      'Plan drinking water, hats and shade breaks.'
    ],
    runOrder: [
      { min: 10, what: 'Story and big question. Show the micro:bit thermometer.' },
      { min: 10, what: 'Get ready: classroom reading, practise waiting 2 minutes.' },
      { min: 15, what: 'Test 1: sun or shade.' },
      { min: 20, what: 'Test 2: which ground is hottest.' },
      { min: 15, what: 'Test 3: black or white paper.' },
      { min: 10, what: 'Share results. Where would you plant a tree?' }
    ],
    discussion: [
      'Which place was hottest? Why do you think so?',
      'Why did we wait 2 minutes and not hold the micro:bit?',
      'Where at school would a tree or a white roof help most?'
    ],
    art: {
      title: 'Cool School map',
      prompt: 'Draw a map of the playground. Colour hot places red and cool places blue. Draw one thing that would cool a hot place.'
    },
    maths: {
      title: 'How much hotter?',
      starter: 'Which number is bigger: sun or shade? Circle it.',
      explorer: 'Sun minus shade = ___ degrees. Put all your readings in order, smallest first.'
    },
    realWorld: 'City planners measure hot spots too. They plant trees and use light-coloured roofs to make streets cooler.',
    lookFors: {
      starter: 'Reads a number from the micro:bit and says which place was hotter.',
      explorer: 'Explains why waiting and not holding the micro:bit makes the test fair.'
    },
    extension: 'Build a shade from card or cloth over the hottest spot. Measure again. Did it work?'
  },

  'storm-shelter': {
    time: '60 minutes',
    groups: 'Groups of 3–4',
    bigQuestion: 'How do we build a shelter that stays standing and dry in a storm?',
    goals: [
      'I can build a shelter that stands up by itself.',
      'I can test my shelter with wind and rain, fairly.',
      'I can improve my design after testing it.'
    ],
    steam: {
      S: 'Wind pushes on buildings; rain runs off slopes.',
      T: 'A fan and spray bottle model a storm safely.',
      E: 'Design, test, improve: the engineering cycle.',
      A: 'Design and colour a storm-proof dream house.',
      M: 'Count bricks and put fan speeds in order.'
    },
    prep: [
      'Put the same number of LEGO bricks in a bag for each group.',
      'Set up the wind station and the rain station apart, so water stays away from the fan.',
      'Cut card for roofs and small tissue squares.',
      'Check the fan has three speeds and a safe guard.'
    ],
    runOrder: [
      { min: 10, what: 'Story: what happens to buildings in storms?' },
      { min: 15, what: 'Build: shelter with a roof and tissue inside.' },
      { min: 15, what: 'Test 1: tall or wide against the fan.' },
      { min: 15, what: 'Test 2: flat or sloped roof in the "rain".' },
      { min: 5, what: 'Share: what made the strongest, driest shelter?' }
    ],
    discussion: [
      'What made your shelter strong?',
      'What would you change if you built it again?',
      'Why do many houses in rainy places have sloped roofs?'
    ],
    art: {
      title: 'My storm-proof house',
      prompt: 'Draw and colour your dream storm-proof house. Label the strong walls and the roof.'
    },
    maths: {
      title: 'Brick count',
      starter: 'Count the bricks in one wall. How many walls? Draw them.',
      explorer: 'Bricks in one wall × number of walls = ___. Which design used fewer bricks?'
    },
    realWorld: 'Engineers test model buildings with strong wind before the real building is made.',
    lookFors: {
      starter: 'Builds a shelter that stands and says what knocked it over.',
      explorer: 'Uses results to explain one change that would make the shelter stronger or drier.'
    },
    extension: 'Add a triangle brace to the tall shelter and test it again with the fan.'
  },

  'microbit-blocks': {
    time: '60 minutes',
    groups: 'Pairs (driver and navigator, swap halfway)',
    bigQuestion: 'How do we give a tiny computer instructions?',
    goals: [
      'I can put blocks in order to make a program.',
      'I can find and fix a bug.',
      'I can use a sensor to measure something.'
    ],
    steam: {
      S: 'A temperature sensor notices heat.',
      T: 'micro:bit and MakeCode block coding.',
      E: 'Debugging: test, find the mistake, fix it.',
      A: 'Design your own 5×5 light picture.',
      M: 'Counting, variables and a 5×5 grid.'
    },
    prep: [
      'Open MakeCode on each tablet or laptop and try one download before class.',
      'Charge or check batteries. One micro:bit, cable and battery pack per pair.',
      'Print the pixel grids on this worksheet.',
      'Warm up "unplugged": a child is the robot and follows spoken instructions exactly.'
    ],
    runOrder: [
      { min: 10, what: 'Unplugged warm-up: program a classmate robot.' },
      { min: 15, what: 'Build: smiley face program.' },
      { min: 15, what: 'Test 1: button counter. Guess, press 10 times, record.' },
      { min: 15, what: 'Test 2: thermometer on the desk and in hands.' },
      { min: 5, what: 'Share: who found a bug? How did you fix it?' }
    ],
    discussion: [
      'What is a bug? How did you find yours?',
      'Why does the order of the blocks matter?',
      'What else could a micro:bit sense?'
    ],
    art: {
      title: 'Pixel picture',
      prompt: 'Colour squares in the 5×5 grid to design your own picture. Then build it with the "show leds" block.',
      grid: true
    },
    maths: {
      title: 'Counting code',
      starter: 'Press A 3 times. What number should it show? Draw it.',
      explorer: 'Change the block to "change count by 2". Guess the number after 10 presses: ___.'
    },
    realWorld: 'Programmers test and fix bugs every day. Phones and cars are full of sensors like this one.',
    lookFors: {
      starter: 'Drags blocks into the right place and downloads a working program.',
      explorer: 'Predicts what a program will do and explains how they fixed a bug.'
    },
    extension: 'Make the micro:bit show a sad face when the temperature is above 30 °C.'
  },

  mangroves: {
    time: '50–60 minutes',
    groups: 'Groups of 3–4',
    bigQuestion: 'How can nature protect our coast from waves?',
    goals: [
      'I can make a model beach and make waves the same way each time.',
      'I can see how roots change what waves do to sand.',
      'I can explain why mangroves are important.'
    ],
    steam: {
      S: 'Waves wash sand away: erosion.',
      T: 'A tray model shows a coast in miniature.',
      E: 'Compare ways to protect a beach.',
      A: 'Draw a mangrove forest above and below the water.',
      M: 'Count sticks and compare 3 with 15.'
    },
    prep: [
      'Deep trays with sides, damp sand, jugs of water and rulers.',
      'Lolly sticks or twigs: 15 per group.',
      'Cover the floor or work outside. Towels ready.',
      'Practise gentle waves so every group pushes the same way.'
    ],
    runOrder: [
      { min: 10, what: 'Story: mangroves along the coast near Bangkok.' },
      { min: 10, what: 'Build: sand beach and sea in the tray.' },
      { min: 15, what: 'Test 1: no roots or roots.' },
      { min: 15, what: 'Test 2: thin or thick forest.' },
      { min: 10, what: 'Share and wash hands.' }
    ],
    discussion: [
      'What happened to the sand when there were no roots?',
      'Why did we rebuild the beach the same way each time?',
      'What else could protect a beach? Is it better than trees?'
    ],
    art: {
      title: 'Mangrove home',
      prompt: 'Draw a mangrove forest. Show the roots under the water, and the crabs, fish and birds that live there.'
    },
    maths: {
      title: 'Stick maths',
      starter: 'Draw 3 sticks and 15 sticks. Which is more?',
      explorer: '15 − 3 = ___ more sticks. Measure how far the waterline moved, in cm: ___.'
    },
    realWorld: 'In Thailand, people plant young mangrove trees along the coast to help protect the land from waves.',
    lookFors: {
      starter: 'Makes waves and says whether more or less sand washed away.',
      explorer: 'Explains that roots hold sand and slow waves, using their own results.'
    },
    extension: 'Build a small wall of stones instead of sticks. Which protects the beach better?'
  },

  'sun-power': {
    time: '45–60 minutes (outdoors)',
    groups: 'Groups of 3',
    bigQuestion: 'How can sunlight make things move?',
    goals: [
      'I can join a solar panel to a motor.',
      'I can compare how fast it spins in sun, cloud and shade.',
      'I can say how light turns into movement.'
    ],
    steam: {
      S: 'Light energy becomes electricity, then movement.',
      T: 'Solar panel, wires and a motor.',
      E: 'Point the panel to get the most power.',
      A: 'Design a colour spinner that mixes colours as it turns.',
      M: 'Put speeds in order; Explorers time in seconds.'
    },
    prep: [
      'Choose a sunny day. Test each panel and motor outside first.',
      'Cut paper flags and baking paper "clouds".',
      'Have books ready to lean panels on.',
      'Remind: never look at the sun.'
    ],
    runOrder: [
      { min: 10, what: 'Story: can sunlight make things move?' },
      { min: 10, what: 'Build: sun spinner.' },
      { min: 15, what: 'Test 1: sun, cloud or shade.' },
      { min: 15, what: 'Test 2: flat or facing the sun.' },
      { min: 10, what: 'Share: where should the school put solar panels?' }
    ],
    discussion: [
      'Where did the flag spin fastest? Why?',
      'What happened under the "cloud"?',
      'Where could our school put solar panels?'
    ],
    art: {
      title: 'Colour spinner',
      prompt: 'Colour a circle in sections of two colours. Put it on the motor. What colour do you see when it spins?',
      circle: true
    },
    maths: {
      title: 'Fastest to slowest',
      starter: 'Number the places 1, 2, 3 from fastest to slowest.',
      explorer: 'Flat time − facing time = ___ seconds. Which was faster?'
    },
    realWorld: 'Many homes, schools and farms in Thailand use solar panels to make electricity from sunlight.',
    lookFors: {
      starter: 'Makes the flag spin and says where it spun fastest.',
      explorer: 'Explains that more light on the panel makes more electricity.'
    },
    extension: 'Join two panels. Does the flag spin faster?'
  },

  'acid-rain': {
    time: '60 minutes',
    groups: 'Groups of 3, with an adult nearby',
    bigQuestion: 'How can we detect acid, and what does acid rain do to stone?',
    goals: [
      'I can use a colour tester to find an acid.',
      'I can sort liquids by the colour they make.',
      'I can explain how acid rain damages stone.'
    ],
    steam: {
      S: 'Acids and bases; a reaction makes gas bubbles.',
      T: 'An indicator is a detection tool.',
      E: 'Think of ways to protect a stone statue.',
      A: 'Paint with cabbage water and make colours change.',
      M: 'Sort results into a table; Explorers count bubbles.'
    },
    prep: [
      'Make the cabbage water the day before (adult). Keep it cool.',
      'Test your limestone chips or eggshell in vinegar. Classroom chalk often does not fizz.',
      'Safety glasses, labelled clear cups, spoons and paper towels.',
      'Water, vinegar and baking soda water ready in jugs.'
    ],
    runOrder: [
      { min: 10, what: 'Story: where does acid rain come from?' },
      { min: 10, what: 'Build: show how the tester was made (or make it).' },
      { min: 15, what: 'Test 1: colour detectives.' },
      { min: 15, what: 'Test 2: stone in water and in vinegar.' },
      { min: 10, what: 'Share, clear up and wash hands.' }
    ],
    discussion: [
      'How do we know vinegar is an acid?',
      'What made the bubbles on the stone?',
      'How could we protect statues from acid rain?'
    ],
    art: {
      title: 'Magic colour painting',
      prompt: 'Paint a picture with cabbage water. Dab on vinegar for pink and baking soda water for green. Stick or draw it here.'
    },
    maths: {
      title: 'Colour table',
      starter: 'Colour in the cup for each liquid, the colour it turned.',
      explorer: 'Count the bubbles you see in 10 seconds in each cup: water ___, vinegar ___.'
    },
    realWorld: 'Old stone statues and buildings in cities slowly wear away in acid rain. Cleaner air helps protect them.',
    lookFors: {
      starter: 'Matches pink to acid and circles the right colours.',
      explorer: 'Explains that acid reacts with stone and makes a gas.'
    },
    extension: 'Test more liquids: lemon juice, soapy water, milk. Acid or not?'
  },

  'plant-lab': {
    time: '60 minutes',
    groups: 'Pairs at each microscope',
    bigQuestion: 'What are plants made of?',
    goals: [
      'I can use a microscope carefully, starting with the smallest lens.',
      'I can look closely and draw what I see.',
      'I can compare cells from different plant parts.'
    ],
    steam: {
      S: 'Plants are made of tiny cells.',
      T: 'A microscope makes small things look bigger.',
      E: 'Prepare a slide so light can pass through.',
      A: 'Scientific drawing, and a cell-pattern artwork.',
      M: 'Magnification: 4×, 10×, 40× bigger.'
    },
    prep: [
      'Check microscope lights and clean the lenses.',
      'Prepare leaf, stem, root and petal pieces. An adult cuts thin slices.',
      'Onion skin and (optional, adult only) iodine for the stain test.',
      'Glass slides and cover slips; tissues for wiping.'
    ],
    runOrder: [
      { min: 10, what: 'Story: what is a cell? Show the microscope parts.' },
      { min: 20, what: 'Plant parts tour.' },
      { min: 20, what: 'Onion and iodine tests.' },
      { min: 10, what: 'Share drawings and clear up the slides.' }
    ],
    discussion: [
      'What shapes did you see?',
      'Did every plant part look the same?',
      'Why does a stain help us see?'
    ],
    art: {
      title: 'Cell pattern art',
      prompt: 'Use the cell shapes you saw to make a colourful pattern, like a mosaic.'
    },
    maths: {
      title: 'Bigger and bigger',
      starter: 'Circle the lens that makes things look biggest: 4× 10× 40×.',
      explorer: 'Count the cells you can see across the view with the 10× lens: ___. With the 40× lens: ___. Why is it fewer?'
    },
    realWorld: 'Scientists and doctors use microscopes every day, to study plants, germs and medicines.',
    lookFors: {
      starter: 'Focuses with the smallest lens first and draws what they see.',
      explorer: 'Compares two plant parts and describes a difference in the cells.'
    },
    extension: 'Look at a leaf from a different plant, like grass or spinach. Are the cells the same?'
  },

  'floating-house': {
    time: '60–75 minutes',
    groups: 'Groups of 3–4',
    bigQuestion: 'How can we build a house that floats safely in a flood?',
    goals: [
      'I can build a raft that floats.',
      'I can test size, balance and materials fairly.',
      'I can use my results to design a better floating house.'
    ],
    steam: {
      S: 'Buoyancy: water pushes up on things that float.',
      T: 'Choosing materials that do not soak up water.',
      E: 'Build, test and improve a floating raft.',
      A: 'Design a floating village.',
      M: 'Count coins; Explorers find the middle of 3 tries.'
    },
    prep: [
      'Collect 6 plastic bottles with lids per group.',
      'Coins all the same size, about 30 per group.',
      'Tubs of water on the floor, towels, tape, card, foil trays.',
      'LEGO bricks for the house.'
    ],
    runOrder: [
      { min: 10, what: 'Story: floods and floating homes.' },
      { min: 20, what: 'Build: bottle raft and LEGO house.' },
      { min: 30, what: 'Tests: size, balance and materials (10 minutes each).' },
      { min: 10, what: 'Share: design the best floating house.' }
    ],
    discussion: [
      'Which raft carried the most coins? Why?',
      'Where should heavy things go in a floating house?',
      'Why did the cardboard raft fail?'
    ],
    art: {
      title: 'Floating village',
      prompt: 'Draw a whole floating village: houses, gardens and bridges on the water.'
    },
    maths: {
      title: 'Coin count',
      starter: 'Which raft carried more coins? Draw that many coins.',
      explorer: 'Write your 3 tries in order: ___ ___ ___. The middle one is ___.'
    },
    realWorld: 'Floating homes are real, in the Netherlands and on rivers in Thailand. They rise when floods come.',
    lookFors: {
      starter: 'Counts coins carefully and says which raft carried more.',
      explorer: 'Uses the middle of three tries and explains buoyancy or balance.'
    },
    extension: 'Add a roof garden to your house. How does the extra weight change the coins it can carry?'
  }
};
