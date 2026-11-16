/**
 * Don's PBL Program: Project Exodus: Building Our New Home in Space
 * Branch: DonPBL
 * Location: prototypes/DonPBL/interstellarArkProgram.ts
 *
 * Sourced from "Project Title: Project Exodus: Building Our New Home in Space"
 * Total Time: 12 Weeks (10 Hours a Week, 120 Hours Total)
 * Design Framework: Design Thinking (Empathize, Define, Ideate, Prototype, Test, Showcase — mapped across the 7 prototype phases: explore, empathise, define, ideate, prototype, test, share)
 * Skills We Are Practicing: WeLearn Future Skills
 *
 * Includes:
 * - All 12 Weeks (10 Hours/Week, 120 Hours Total, 24 structured 5-hour sessions)
 * - Part 1: The Space Emergency Game Cards (All 6 Week 9 Testing Activity Cards)
 * - Part 2: The New Planet Rulebook Worksheet (All 7 Fill-in-the-Blank Sections)
 * - What You Need to Hand In (1. Hands-On Models, 2. Drawings, Plans, and Rules)
 * - How You Will Grow: WeLearn Future Skills Guide (Getting Started, Doing Great, Going Above and Beyond across all 7 skills)
 * - Interactive Simulation & Gamification options (Goldilocks Planet Finder, Spaceship & Recycling Loop Simulator, Space Emergency Game Card Arena, Interactive New Planet Rulebook Builder, Levels & Badges)
 */

import type { PblProgram, ProgramPhase } from './programData';

export interface ExoplanetCandidate {
  id: string;
  name: string;
  constellation: string;
  distanceLightYears: number;
  starType: string;
  orbitalPeriodDays: number;
  surfaceGravityG: number;
  stellarFluxEarthRatio: number;
  equilibriumTempC: number;
  radiationHazardIndex: number; // 1 (Low) to 10 (Severe)
  tidalLockingStatus: 'Tidally Locked' | 'Resonant Spin-Orbit' | 'Near-Earth Rotation';
  terrainAndAtmosphere: string;
  colonizationAdvantage: string;
  primaryEngineeringChallenge: string;
}

export interface ArkPropulsionOption {
  id: string;
  name: string;
  propulsionType: string;
  gravityMechanism: string;
  ringRadiusMeters: number;
  rotationRpm: number;
  simulatedGravityG: number;
  cruiseVelocityPercentC: number;
  estimatedTransitYears: number;
  hullShieldingSpec: string;
  powerOutputGW: number;
  maintenanceComplexity: 'Moderate' | 'High' | 'Extreme';
}

export interface ArkCrisisScenario {
  id: string;
  cardNumber: number;
  title: string;
  category: 'Biosphere & ECLSS' | 'Structural & Mechanical' | 'Societal & Constitutional';
  emergencyTypeLabel: string;
  weekTrigger: number;
  severity: 'High' | 'Critical' | 'Catastrophic';
  summary: string;
  caloricShockPct: number;
  waterLoopPenaltyPct: number;
  oxygenPenaltyPct: number;
  moraleShockPts: number;
  engineeringPrompt: string;
  constitutionalPrompt: string;
  recommendedProtocol: string;
}

export interface ArkMtcRubricItem {
  skillNumber: number;
  domainId: 'ct' | 'ctps' | 'ec' | 'lc' | 'sdl' | 'ent' | 'sea';
  skillTitle: string;
  emerging: string; // Getting Started
  proficient: string; // Doing Great
  advanced: string; // Going Above and Beyond
  evidenceRequired: string;
}

export interface ArkGamificationBadge {
  id: string;
  name: string;
  icon: string;
  xpAward: number;
  unlockedAtPhase: string;
  condition: string;
  description: string;
}

export interface ArkGamificationLevel {
  level: number;
  title: string;
  minXp: number;
  privilegeUnlocked: string;
}

export const EXOPLANET_CANDIDATES: ExoplanetCandidate[] = [
  {
    id: 'exo-trappist-1e',
    name: 'TRAPPIST-1e',
    constellation: 'Aquarius',
    distanceLightYears: 39.6,
    starType: 'Cool Red Dwarf Star (Goldilocks Zone)',
    orbitalPeriodDays: 6.1,
    surfaceGravityG: 0.93,
    stellarFluxEarthRatio: 0.66,
    equilibriumTempC: -22,
    radiationHazardIndex: 6,
    tidalLockingStatus: 'Tidally Locked',
    terrainAndAtmosphere: 'Rocky world in the Goldilocks Zone with liquid water oceans along a permanent sunset/sunrise twilight band and icy mountains on the dark side.',
    colonizationAdvantage: 'Comfortable 0.93g gravity (very close to Earth) keeps bones and muscles strong; plenty of ocean water for farming and drinking.',
    primaryEngineeringChallenge: 'Strong windstorms blowing between the sunny side and dark side, plus occasional bursts of star radiation.'
  },
  {
    id: 'exo-kepler-186f',
    name: 'Kepler-186f',
    constellation: 'Cygnus',
    distanceLightYears: 582,
    starType: 'Calm Orange-Red Dwarf Star (Goldilocks Zone)',
    orbitalPeriodDays: 129.9,
    surfaceGravityG: 1.17,
    stellarFluxEarthRatio: 0.32,
    equilibriumTempC: -40,
    radiationHazardIndex: 3,
    tidalLockingStatus: 'Near-Earth Rotation',
    terrainAndAtmosphere: 'Cool rocky continent world with wide valleys, frozen lakes, red-leaved plant light, and gentle day-and-night cycles.',
    colonizationAdvantage: 'Calm star with low radiation danger and normal day/night sunrises so people can sleep on a regular schedule.',
    primaryEngineeringChallenge: 'Chilly weather and softer, muddy valley soil when ice melts—requires warm greenhouse domes and strong landing pads.'
  },
  {
    id: 'exo-proxima-b',
    name: 'Proxima Centauri b',
    constellation: 'Centaurus',
    distanceLightYears: 4.24,
    starType: 'Active Red Dwarf Star (Closest Neighbor)',
    orbitalPeriodDays: 11.2,
    surfaceGravityG: 1.10,
    stellarFluxEarthRatio: 0.65,
    equilibriumTempC: -39,
    radiationHazardIndex: 9,
    tidalLockingStatus: 'Tidally Locked',
    terrainAndAtmosphere: 'Deep rocky canyons and underground water springs; exposed to bright solar flares on the surface.',
    colonizationAdvantage: 'Closest Goldilocks planet to Earth (only 4.24 light-years away), meaning the shortest space trip for our 500 travelers.',
    primaryEngineeringChallenge: 'Strong space radiation on the surface—homes and farms need underground lava-tube shelters or thick protective roofs.'
  },
  {
    id: 'exo-kepler-442b',
    name: 'Kepler-442b',
    constellation: 'Lyra',
    distanceLightYears: 1206,
    starType: 'Steady Orange K-Type Star (Goldilocks Zone)',
    orbitalPeriodDays: 112.3,
    surfaceGravityG: 1.30,
    stellarFluxEarthRatio: 0.70,
    equilibriumTempC: -18,
    radiationHazardIndex: 2,
    tidalLockingStatus: 'Near-Earth Rotation',
    terrainAndAtmosphere: 'Lush super-Earth in the middle of the Goldilocks Zone with shallow seas, muddy river deltas, and thick air.',
    colonizationAdvantage: 'Warm sunlight and calm space weather make it great for growing crops and protecting alien nature.',
    primaryEngineeringChallenge: 'Heavier 1.30g gravity (everything feels 30% heavier) and soft muddy landing ground that needs wide floating pads.'
  }
];

export const ARK_PROPULSION_OPTIONS: ArkPropulsionOption[] = [
  {
    id: 'prop-fusion-oneill',
    name: 'Twin Spinning Gravity Rings + Fusion Engines',
    propulsionType: 'Clean Fusion Rocket Engines',
    gravityMechanism: 'Two Giant Counter-Spinning Habitat Rings (Fake Gravity)',
    ringRadiusMeters: 320,
    rotationRpm: 1.67,
    simulatedGravityG: 1.0,
    cruiseVelocityPercentC: 8.5,
    estimatedTransitYears: 52,
    hullShieldingSpec: 'Thick Water-Tank Walls + Double Space-Pebble Shield',
    powerOutputGW: 14.5,
    maintenanceComplexity: 'High'
  },
  {
    id: 'prop-lightsail-torus',
    name: 'Giant Solar Light Sail + Single Spinning Town Ring',
    propulsionType: 'Giant Mirror Light Sail + Landing Rockets',
    gravityMechanism: 'Wide Spinning Neighborhood Wheel (0.9g Fake Gravity)',
    ringRadiusMeters: 180,
    rotationRpm: 2.15,
    simulatedGravityG: 0.92,
    cruiseVelocityPercentC: 12.0,
    estimatedTransitYears: 38,
    hullShieldingSpec: 'Foam-and-Metal Pebble Bumper + Emergency Safety Doors',
    powerOutputGW: 9.2,
    maintenanceComplexity: 'Moderate'
  },
  {
    id: 'prop-antimatter-tether',
    name: 'Deep-Space Star Cruiser + Connected Habitat Pods',
    propulsionType: 'High-Speed Plasma Drive',
    gravityMechanism: 'Spinning Connected Pod Arms (Modular Rooms)',
    ringRadiusMeters: 450,
    rotationRpm: 1.38,
    simulatedGravityG: 0.95,
    cruiseVelocityPercentC: 15.0,
    estimatedTransitYears: 31,
    hullShieldingSpec: 'Multi-Layer Armor + Automatic Air-Leak Shutoff Doors',
    powerOutputGW: 22.0,
    maintenanceComplexity: 'Extreme'
  }
];

/**
 * Part 1: The Space Emergency Game Cards (Week 9 Testing Activity)
 * All 6 official cards from "Project Exodus: Building Our New Home in Space"
 */
export const ARK_CRISIS_SCENARIOS: ArkCrisisScenario[] = [
  {
    id: 'card-1-space-plant-sickness',
    cardNumber: 1,
    title: 'Card 1: The Space Plant Sickness (Food and Water Emergency)',
    category: 'Biosphere & ECLSS',
    emergencyTypeLabel: 'Food and Water Emergency',
    weekTrigger: 9,
    severity: 'Critical',
    summary: 'Oh no! A weird space mold got into your main hydroponic farm room. Half of your fruit and vegetable plants have turned brown and cannot be eaten.',
    caloricShockPct: 50,
    waterLoopPenaltyPct: 10,
    oxygenPenaltyPct: 18,
    moraleShockPts: 20,
    engineeringPrompt: '1. Point to your physical model and drawings: How will you stop the mold from spreading to the rest of the plants on the ship?',
    constitutionalPrompt: '2. What backup food will your 500 travelers eat while you clean the farm room and grow new seeds?',
    recommendedProtocol: '3. Fix Your Design: Add a special clean-up door, a backup seed vault, or a second smaller farm room to your drawings and model.'
  },
  {
    id: 'card-2-space-pebble-shower',
    cardNumber: 2,
    title: 'Card 2: The Space Pebble Shower (Ship Repair Emergency)',
    category: 'Structural & Mechanical',
    emergencyTypeLabel: 'Ship Repair Emergency',
    weekTrigger: 9,
    severity: 'Critical',
    summary: 'Your spaceship just flew through a cloud of tiny, super-fast space pebbles! Three pebbles poked small holes in the outside wall near the bedrooms, and air is starting to leak out.',
    caloricShockPct: 10,
    waterLoopPenaltyPct: 10,
    oxygenPenaltyPct: 25,
    moraleShockPts: 24,
    engineeringPrompt: '1. Point to your model: Where do the people in those bedrooms go right now to stay safe while the air is leaking?',
    constitutionalPrompt: '2. How do your repair robots or human engineers reach the outside wall to patch the holes without getting hurt?',
    recommendedProtocol: '3. Fix Your Design: Draw or build emergency safety doors between rooms and show where the repair tools and robot stations are kept.'
  },
  {
    id: 'card-3-dirty-water-jam',
    cardNumber: 3,
    title: 'Card 3: The Dirty Water Jam (Recycling Emergency)',
    category: 'Biosphere & ECLSS',
    emergencyTypeLabel: 'Recycling Emergency',
    weekTrigger: 9,
    severity: 'High',
    summary: 'The main machine that cleans dirty sink and shower water just got clogged and stopped working! Your clean drinking water tank only has enough water left for three days.',
    caloricShockPct: 15,
    waterLoopPenaltyPct: 35,
    oxygenPenaltyPct: 10,
    moraleShockPts: 22,
    engineeringPrompt: '1. Look at your Recycling Loop Map: How do your engineers open up and fix the water machine? Do you have spare parts or a 3D printer to make new pipes?',
    constitutionalPrompt: '2. What temporary rule will you announce so people use less water for the next three days without getting upset?',
    recommendedProtocol: '3. Fix Your Design: Add a backup water tank or a repair workshop right next to the water pipes on your ship map.'
  },
  {
    id: 'card-4-gravity-spinner-glitch',
    cardNumber: 4,
    title: 'Card 4: The Gravity Spinner Glitch (Engineering and Health Emergency)',
    category: 'Structural & Mechanical',
    emergencyTypeLabel: 'Engineering and Health Emergency',
    weekTrigger: 9,
    severity: 'Catastrophic',
    summary: 'The giant spinning ring on your spaceship that makes fake gravity started squeaking loudly! Engineers have to turn it off for two whole weeks to grease the gears and fix the motor. Everyone on the ship is now floating in zero gravity!',
    caloricShockPct: 15,
    waterLoopPenaltyPct: 15,
    oxygenPenaltyPct: 8,
    moraleShockPts: 26,
    engineeringPrompt: '1. Point to your ship rooms: What happens to the kitchens, bathrooms, and farms when water and tools start floating in the air?',
    constitutionalPrompt: '2. How will you keep people\'s muscles and bones strong during the two weeks without gravity?',
    recommendedProtocol: '3. Fix Your Design: Show where the exercise machines are located and how Engineers can safely reach the spinning motor to fix it.'
  },
  {
    id: 'card-5-long-trip-grumpies',
    cardNumber: 5,
    title: 'Card 5: The Long Trip Grumpies (Feelings and Friendship Emergency)',
    category: 'Societal & Constitutional',
    emergencyTypeLabel: 'Feelings and Friendship Emergency',
    weekTrigger: 9,
    severity: 'High',
    summary: 'Your spaceship has been flying through dark space for five years. People are tired of seeing the same walls every day. Some travelers are feeling sad, and two groups of workers are arguing over who gets to use the park area.',
    caloricShockPct: 5,
    waterLoopPenaltyPct: 5,
    oxygenPenaltyPct: 5,
    moraleShockPts: 35,
    engineeringPrompt: '1. Point to your living areas: Where can someone go on your ship if they need quiet time alone, or if they want to play games and laugh with friends?',
    constitutionalPrompt: '2. How does your team\'s Rulebook help solve the argument over the park space peacefully?',
    recommendedProtocol: '3. Fix Your Design: Upgrade your model or drawings to include a cozy relaxation room, an art or music space, or a fairer schedule for shared rooms.'
  },
  {
    id: 'card-6-muddy-landing-surprise',
    cardNumber: 6,
    title: 'Card 6: The Muddy Landing Surprise (New Planet Emergency)',
    category: 'Structural & Mechanical',
    emergencyTypeLabel: 'New Planet Emergency',
    weekTrigger: 9,
    severity: 'Critical',
    summary: 'You finally arrived at your Goldilocks planet! But when your landing pods touched down, you discovered the ground is much softer and muddier than your space telescope showed. Heavy buildings might sink, and a big windstorm is blowing in tonight!',
    caloricShockPct: 20,
    waterLoopPenaltyPct: 15,
    oxygenPenaltyPct: 10,
    moraleShockPts: 25,
    engineeringPrompt: '1. Look at your planet terrain model: How will you keep your landing pod and first homes from sinking into the mud?',
    constitutionalPrompt: '2. How will you protect your solar panels or power generators from the strong windstorm?',
    recommendedProtocol: '3. Fix Your Design: Change your planet model to show strong legs, floating pads, or underground shelters that match the tricky land.'
  }
];

/**
 * How You Will Grow: WeLearn Future Skills Guide
 * Verbatim progression descriptors from "Project Exodus: Building Our New Home in Space"
 */
export const ARK_WELEARN_MTC_RUBRIC: ArkMtcRubricItem[] = [
  {
    skillNumber: 1,
    domainId: 'ct',
    skillTitle: '1. Creative Thinking and Innovation',
    emerging: 'Getting Started: You copy ideas from movies or games without changing much, and your model is very basic.',
    proficient: 'Doing Great: You come up with your own cool ideas for the spaceship rooms, farms, and laws, and you build a neat physical model and clear drawings that show how everything works.',
    advanced: 'Going Above and Beyond: You invent super smart, original designs that solve tricky space problems, blending nature, technology, and fair rules in ways nobody else thought of.',
    evidenceRequired: 'Hands-On Physical Spaceship & Planet Terrain Model (with cutaway windows/color coding) + 3D Computer Models or Paper Blueprints.'
  },
  {
    skillNumber: 2,
    domainId: 'ctps',
    skillTitle: '2. Critical Thinking and Problem Solving',
    emerging: 'Getting Started: You pick a planet or design a ship without checking the science facts, and you get stuck when asked how the farms or repairs actually work.',
    proficient: 'Doing Great: You use real science facts to pick your planet, figure out how much food and water people need, and explain how to fix the ship when emergencies happen.',
    advanced: 'Going Above and Beyond: You think ahead to stop problems before they even start, testing your ship and your laws against tough emergencies and using math and science to prove your ideas work.',
    evidenceRequired: 'Goldilocks Planet Fact File, 500-Person Food & Recycling Loop Map, Ship Repair Guide, and Space Emergency Game Card upgrades.'
  },
  {
    skillNumber: 3,
    domainId: 'ec',
    skillTitle: '3. Effective Communication',
    emerging: 'Getting Started: Your drawings are missing labels, and during the final pitch it is hard for the audience to understand how your ship, planet, and laws fit together.',
    proficient: 'Doing Great: Your drawings and model are clearly labeled, and during the showcase pitch you explain your planet, your spaceship, and your new laws clearly and confidently.',
    advanced: 'Going Above and Beyond: You tell an amazing, exciting story during your pitch, using your physical model and drawings to make big science and government ideas super easy for anyone to understand.',
    evidenceRequired: 'Labeled Ship & Planet Drawings, 4-Part Slide Presentation or Poster Board, and Live Space Launch Showcase Pitch.'
  },
  {
    skillNumber: 4,
    domainId: 'lc',
    skillTitle: '4. Leadership and Collaboration',
    emerging: 'Getting Started: You wait for others to tell you what to do, or you argue with teammates instead of finding ways to combine your ideas.',
    proficient: 'Doing Great: You take charge of your part of the project, help your teammates when they need a hand, and make sure the builders, artists, and law-makers all work together smoothly.',
    advanced: 'Going Above and Beyond: You help lead the team with kindness, solve group disagreements calmly, and encourage everyone so the whole team does their very best work.',
    evidenceRequired: 'Official Colony Signatures on the New Planet Rulebook (Builder/Engineer, Planet Scientist, Farm & Life-Support, Law & Community Leader) and Peer Feedback Notes.'
  },
  {
    skillNumber: 5,
    domainId: 'sdl',
    skillTitle: '5. Self-Directed Learning and Agency',
    emerging: 'Getting Started: You need the coach or teacher to remind you often to finish your research or start building your model.',
    proficient: 'Doing Great: You keep track of your weekly goals, look up answers when you are curious about space or farming, and finish your drawings and models on time.',
    advanced: 'Going Above and Beyond: You teach yourself new drawing or computer skills, hunt for extra space facts on your own, and improve your model without waiting to be asked.',
    evidenceRequired: 'Digital Learning Folder containing photos of the physical model, drawings, planet research, and completed New Planet Rulebook.'
  },
  {
    skillNumber: 6,
    domainId: 'ent',
    skillTitle: '6. Entrepreneurship and Financial Literacy',
    emerging: 'Getting Started: You use up classroom building supplies carelessly or design a spaceship that would be way too heavy and wasteful to ever fly.',
    proficient: 'Doing Great: You stick to your classroom material budget (in Thai Baht), make smart choices about space supplies, and show that your colony can survive without wasting resources.',
    advanced: 'Going Above and Beyond: You design a smart system for how people on the new planet will share work, trade goods, and reuse every single drop of water and scrap of metal.',
    evidenceRequired: 'Classroom Supply Budget in Thai Baht (THB), Spaceship Supply Weight Plan, and Rulebook Section 3 (Sharing Jobs and Resources).'
  },
  {
    skillNumber: 7,
    domainId: 'sea',
    skillTitle: '7. Social and Emotional Aptitude',
    emerging: 'Getting Started: You get upset when people suggest changes to your model, or you design a spaceship and laws that forget about people\'s feelings.',
    proficient: 'Doing Great: You stay calm when building gets tough, design cozy and welcoming spaces on the ship so travelers stay happy, and write fair laws that protect everyone.',
    advanced: 'Going Above and Beyond: You show great care for others during team tests, designing special spaces on the ship for mental health and creating kind, peaceful ways to solve problems on the new planet.',
    evidenceRequired: 'Human Needs Chart (bodies, feelings, friendships), Cozy Relaxation/Park Spaces on Ship Map, and Rulebook Section 6 (Solving Arguments Peacefully).'
  }
];

export const ARK_GAMIFICATION_LEVELS: ArkGamificationLevel[] = [
  { level: 1, title: 'Space Health & Feelings Explorer', minXp: 0, privilegeUnlocked: 'Unlocked Human Needs Chart (Bodies, Feelings & Friendships)' },
  { level: 2, title: 'Goldilocks Planet Hunter', minXp: 500, privilegeUnlocked: 'Unlocked Goldilocks Zone Telescope & Planet Fact File Builder' },
  { level: 3, title: 'Space Farmer & Rulebook Writer', minXp: 1200, privilegeUnlocked: 'Unlocked 500-Person Recycling Loop Map & New Planet Rulebook Worksheet' },
  { level: 4, title: 'Spaceship Neighborhood & Robot Designer', minXp: 2100, privilegeUnlocked: 'Unlocked Fake-Gravity Spinner, Ship Town Layout & Ship Repair Guide' },
  { level: 5, title: 'Blueprint & Physical Model Builder', minXp: 3100, privilegeUnlocked: 'Unlocked 3D/Paper Blueprints & Cutaway Physical Model Workshop (THB Budget)' },
  { level: 6, title: 'Space Emergency Game Champion', minXp: 4300, privilegeUnlocked: 'Unlocked All 6 Space Emergency Game Cards & Rulebook Role-Play Test' },
  { level: 7, title: 'Space Launch Showcase Commander', minXp: 5500, privilegeUnlocked: 'Unlocked 4-Part Big Pitch Stage & Digital Learning Folder Badge' }
];

export const ARK_GAMIFICATION_BADGES: ArkGamificationBadge[] = [
  {
    id: 'badge-human-factor-empath',
    name: 'Human Needs Caretaker',
    icon: '💛',
    xpAward: 400,
    unlockedAtPhase: 'explore',
    condition: 'Complete the Week 1 Human Needs Chart showing everything travelers need for their bodies, their feelings, and their friendships.',
    description: 'Kept space travelers healthy and happy with gravity exercise, radiation protection, sleep schedules, and anti-loneliness spaces.'
  },
  {
    id: 'badge-goldilocks-scout',
    name: 'Goldilocks Planet Scout',
    icon: '🪐',
    xpAward: 450,
    unlockedAtPhase: 'empathise',
    condition: 'Study real exoplanets in the Goldilocks Zone and finish your team’s Week 2 Planet Fact File.',
    description: 'Checked liquid water temperatures, land, air, weather, and gravity to pick humanity’s safest new home.'
  },
  {
    id: 'badge-eclss-charter-architect',
    name: 'Zero-Waste Farmer & Lawmaker',
    icon: '🌱',
    xpAward: 550,
    unlockedAtPhase: 'define',
    condition: 'Draw the Week 3 Recycling Loop Map & Thai Baht Budget for 500 people and complete the Week 4 New Planet Rulebook Worksheet.',
    description: 'Designed hydroponic/aeroponic space farms, water/oxygen recycling loops, and fair colony laws.'
  },
  {
    id: 'badge-centrifuge-zoning-master',
    name: 'Spaceship Town & Repair Inventor',
    icon: '🛸',
    xpAward: 600,
    unlockedAtPhase: 'ideate',
    condition: 'Draw top-and-side Spaceship Neighborhood Maps in Week 5 and finish the Week 6 Ship Repair Guide.',
    description: 'Planned spinning fake-gravity rings, welcoming ship neighborhoods, repair robots, 3D spare-part printers, and safety airlocks.'
  },
  {
    id: 'badge-dual-fidelity-builder',
    name: 'Master Blueprint & Cutaway Model Maker',
    icon: '🏗️',
    xpAward: 650,
    unlockedAtPhase: 'prototype',
    condition: 'Create labeled Week 7 paper/3D drawings (Tinkercad/FreeCAD/Blender) and build the Week 8 physical spaceship & planet terrain model with cutaway windows.',
    description: 'Built a real hands-on model using classroom supplies within the team Thai Baht budget.'
  },
  {
    id: 'badge-red-team-survivor',
    name: 'Space Emergency Game Hero',
    icon: '🛡️',
    xpAward: 750,
    unlockedAtPhase: 'test',
    condition: 'Solve the Week 9 Space Emergency Game Cards on your physical model and pass the Week 10 Rulebook argument role-play.',
    description: 'Upgraded the spaceship model and New Planet Rulebook so everyone stays safe, fed, and included.'
  },
  {
    id: 'badge-exodus-council-laureate',
    name: 'Space Launch Showcase Star',
    icon: '🚀',
    xpAward: 900,
    unlockedAtPhase: 'share',
    condition: 'Deliver your 4-part Big Pitch in Week 12, present your physical model and rulebook to guests, and save photos into your Digital Learning Folder.',
    description: 'Celebrated Launch Week and demonstrated growth across all 7 WeLearn Future Skills.'
  }
];

export const INTERSTELLAR_ARK_PHASES: ProgramPhase[] = [
  {
    id: 'explore',
    title: 'Phase 1 (Part A): Empathize — Keeping Humans Healthy and Happy in Space',
    strap: 'Phase Question: What do humans need to stay healthy and happy in deep space, and which new planet is the safest place for us to build a new home? (Week 1 • 10 Hours)',
    weeks: [1, 1],
    goal: 'Learn what happens to the human body in space without gravity or sunrise/sunset, step into the shoes of space travelers in tight spaces, and make a Human Needs Chart for bodies, feelings, and friendships.',
    tasks: [
      'Learn what happens to the human body in space (3 hours): bone and muscle weakness without gravity, space radiation protection, and sleeping normally when there is no sunrise or sunset.',
      'Step into the shoes of future space travelers (4 hours): talk to classmates and look at how people live in tight spaces like submarines or icy science stations to stop people from feeling lonely or bored.',
      'Make a Human Needs Chart (3 hours): list everything people need for their bodies, their feelings, and their friendships.'
    ],
    evidence: [
      'Space Body & Sleep Protection Notes (Gravity, Radiation & Sunrise/Sunset Sleep Plan)',
      'Human Needs Chart (Needs for Bodies, Feelings, and Friendships)'
    ],
    aiPromptStarters: [
      'How do astronauts and people in submarines or icy science stations stop feeling lonely or bored in tight spaces?',
      'What happens to human bones, muscles, and sleep in deep space, and how can our spaceship help?',
      'Help our team check if our Human Needs Chart covers everything for bodies, feelings, and friendships.'
    ],
    competencies: ['ctps-01', 'sea-01', 'sdl-01'],
    stretchCompetencies: ['ctps-03', 'sea-04'],
    sessions: [
      {
        sessionNumber: 1,
        week: 1,
        title: 'Week 1 (Part 1): What Happens to the Human Body in Space & Tight Spaces',
        durationMin: 300,
        learningGoal: 'Understand how zero gravity, space radiation, and no sunrise/sunset affect the human body, and explore how people live in submarines and icy science stations.',
        activities: [
          'First, learn what happens to the human body in space (3 hours): investigate why bones and muscles get weak without gravity, how to protect people from space radiation, and how to help travelers sleep normally when there is no sunrise or sunset.',
          'Begin stepping into the shoes of future space travelers (2 hours): talk to classmates and look at real examples of how people live in tight spaces like submarines or icy Antarctic science stations.'
        ],
        learnerChoices: {
          question: 'Which space health challenge will your team investigate first?',
          options: [
            { id: 'opt-gravity-gym', label: 'Keeping Bones & Muscles Strong', description: 'Explore spinning fake-gravity rooms and fun daily space exercise games.' },
            { id: 'opt-radiation-sleep', label: 'Radiation Shields & Sunrise/Sunset Lights', description: 'Explore thick protective walls and smart room lights that copy morning and night.' },
            { id: 'opt-submarine-empathy', label: 'Happy Life in Tight Spaces', description: 'Study how submarine and polar station crews stay cheerful and connected.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your team notes on keeping bones/muscles strong, blocking radiation, helping people sleep, and lessons from submarines/icy science stations.',
          targetCompetencies: ['ctps-01', 'sdl-01']
        },
        reflectionPrompt: 'What would you miss most about Earth if you lived on a spaceship, and how could we bring that feeling onto the ship?',
        teacherTips: 'Use relatable visuals of ISS exercise machines, submarine bunks, and Antarctic research stations to spark empathy.'
      },
      {
        sessionNumber: 2,
        week: 1,
        title: 'Week 1 (Part 2): Stopping Loneliness & Making Our Human Needs Chart',
        durationMin: 300,
        learningGoal: 'Understand how to stop people from feeling lonely or bored on a long space trip and create a complete Human Needs Chart.',
        activities: [
          'Finish stepping into the shoes of future space travelers (2 hours): interview classmates and brainstorm ways to stop people from feeling lonely or bored during a long trip through deep space.',
          'Make a Human Needs Chart (3 hours): build a clear team chart showing everything people need for their bodies, their feelings, and their friendships.'
        ],
        learnerChoices: {
          question: 'How will your team organize your Human Needs Chart?',
          options: [
            { id: 'opt-three-column-chart', label: '3-Column Poster (Bodies, Feelings, Friendships)', description: 'Color-coded chart showing health needs, emotional needs, and community activities.' },
            { id: 'opt-day-in-the-life', label: '24-Hour Space Traveler Storyboard', description: 'Map a full healthy and happy day on the ship from wake-up to bedtime.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Upload your completed Human Needs Chart showing everything people need for their bodies, their feelings, and their friendships.',
          targetCompetencies: ['sea-01', 'ec-01', 'lc-01']
        },
        reflectionPrompt: 'Why are feelings and friendships just as important as food and air on a long trip through deep space?',
        teacherTips: 'Child Safeguarding: For primary learners (ages 9–11), use written sticky notes, drawings, or teacher scribing—never use speech-to-text or audio/video recording.'
      }
    ]
  },
  {
    id: 'empathise',
    title: 'Phase 1 (Part B): Empathize — Hunting for a Goldilocks Planet',
    strap: 'Phase Question: What do humans need to stay healthy and happy in deep space, and which new planet is the safest place for us to build a new home? (Week 2 • 10 Hours)',
    weeks: [2, 2],
    goal: 'Look at real planets outside our solar system in the Goldilocks Zone, study their land, air, weather, and gravity, and create a Planet Fact File for humanity’s new home.',
    tasks: [
      'Look at real planets outside our solar system that are in the "Goldilocks Zone"—places that are not too hot and not too cold for liquid water (4 hours).',
      'Study the land, air, weather, and gravity on these planets to see what dangers might be waiting for us (3 hours).',
      'Pick one planet to be humanity\'s new home and create a Planet Fact File that explains why your planet is the best choice and what the land looks like (3 hours).'
    ],
    evidence: [
      'Goldilocks Zone Planet Comparison Notes (Land, Air, Weather & Gravity)',
      'Team Planet Fact File (Why Our Planet Is the Best Choice & What the Land Looks Like)'
    ],
    aiPromptStarters: [
      'What makes a planet in the "Goldilocks Zone" not too hot and not too cold for liquid water?',
      'Compare TRAPPIST-1e, Kepler-186f, and Kepler-442b: what are the land, weather, and gravity dangers on each one?',
      'Help us check our Planet Fact File to make sure we explained the land, air, weather, and gravity clearly.'
    ],
    competencies: ['ctps-02', 'ctps-03', 'ec-01'],
    stretchCompetencies: ['sdl-05', 'ct-01'],
    sessions: [
      {
        sessionNumber: 3,
        week: 2,
        title: 'Week 2 (Part 1): Exploring Real Planets in the Goldilocks Zone',
        durationMin: 300,
        learningGoal: 'Explore real exoplanets in the Goldilocks Zone where temperatures are not too hot and not too cold for liquid water.',
        activities: [
          'Look at real planets outside our solar system in the "Goldilocks Zone"—places that are not too hot and not too cold for liquid water (4 hours).',
          'Begin studying the land, air, weather, and gravity on candidate planets to compare how humans would walk, breathe, and build homes there (1 hour).'
        ],
        learnerChoices: {
          question: 'Which Goldilocks planet candidate looks most promising to your team?',
          options: [
            { id: 'opt-planet-trappist1e', label: 'TRAPPIST-1e (Ocean Twilight World)', description: '0.93g Earth-like gravity with liquid water oceans along a permanent sunset band.' },
            { id: 'opt-planet-kepler186f', label: 'Kepler-186f (Cool Red-Sun Continents)', description: 'Calm star, normal day/night cycle, and wide rocky valleys with frozen lakes.' },
            { id: 'opt-planet-kepler442b', label: 'Kepler-442b (Warm Super-Earth Delta)', description: 'Steady sunlight, shallow seas, and soft muddy river deltas.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Goldilocks Planet Comparison Table comparing temperature, water, gravity, and star weather.',
          targetCompetencies: ['ctps-02', 'sdl-05']
        },
        reflectionPrompt: 'Why is the "Goldilocks Zone" so important when hunting for a new planet for humanity?',
        teacherTips: 'Use the Goldilocks Planet tab in the Project Exodus Simulator so learners can compare gravity, temperatures, and weather dangers side-by-side.'
      },
      {
        sessionNumber: 4,
        week: 2,
        title: 'Week 2 (Part 2): Planet Dangers & Creating Our Planet Fact File',
        durationMin: 300,
        learningGoal: 'Analyze the land, air, weather, and gravity dangers on candidate planets, choose humanity’s new home, and create a Planet Fact File.',
        activities: [
          'Finish studying the land, air, weather, and gravity on the planets to see what dangers might be waiting for us—such as strong winds, cold nights, heavy gravity, or soft muddy landing ground (2 hours).',
          'Pick one planet to be humanity\'s new home and create a Planet Fact File that explains why your planet is the best choice and what the land looks like (3 hours).'
        ],
        learnerChoices: {
          question: 'What special feature will you highlight in your Planet Fact File?',
          options: [
            { id: 'opt-factfile-map', label: 'Illustrated Landing Site & Terrain Map', description: 'Show mountains, water sources, wind shelter, and where the ship will land.' },
            { id: 'opt-factfile-survival', label: 'Danger & Survival Guide', description: 'Explain every weather, air, and gravity danger and how your colony will stay safe.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your completed Planet Fact File explaining why your chosen Goldilocks planet is the best choice and what its land looks like.',
          targetCompetencies: ['ctps-03', 'ec-01']
        },
        reflectionPrompt: 'What is the biggest danger waiting on your chosen planet, and how will your team prepare for it?',
        teacherTips: 'Have teams share their Planet Fact Files with a partner team to check that every choice is backed by real science facts.'
      }
    ]
  },
  {
    id: 'define',
    title: 'Phase 2: Define — Growing Food, Recycling Everything & Making Fair Rules',
    strap: 'Phase Question: How will we grow enough food, recycle our water and air, and make fair rules so everyone gets along on the ship and on the new planet? (Weeks 3–4 • 20 Hours)',
    weeks: [3, 4],
    goal: 'Calculate daily food and water for 500 people using hydroponics/aeroponics, draw a Recycling Loop Map, plan the Thai Baht classroom supply budget and spaceship weight limit, and write a New Planet Rulebook.',
    tasks: [
      'Week 3 (4 hours): Figure out how much food and water a community of 500 people needs every day, and explore ways to farm without dirt like hydroponics (growing plants in water) or aeroponics (spraying roots with mist).',
      'Week 3 (3 hours): Draw a Recycling Loop Map showing how dirty water gets cleaned, how plants make fresh oxygen for us to breathe, and how food scraps turn into plant food.',
      'Week 3 (3 hours): Make a project budget planning how to spend classroom money (in Thai Baht) for model-building supplies, and plan the weight limit for supplies on our real spaceship.',
      'Week 4 (4 hours): Look at how explorers and communities in history made rules, and talk about how to share food, jobs, and space fairly.',
      'Week 4 (3 hours): Decide how the rules might change once the spaceship lands on the new planet—who is in charge during an emergency in space, and how people vote for leaders once they land.',
      'Week 4 (3 hours): Write a New Planet Rulebook explaining the laws for sharing the land, protecting nature, solving arguments peacefully, and choosing leaders.'
    ],
    evidence: [
      '500-Person Food & Water Plan + Recycling Loop Map + Classroom Budget (in Thai Baht) & Spaceship Weight Plan',
      'Completed New Planet Rulebook (Sharing Land, Protecting Nature, Solving Arguments Peacefully & Choosing Leaders)'
    ],
    aiPromptStarters: [
      'How much food, water, and oxygen does a community of 500 people need every day, and how do hydroponics and aeroponics work?',
      'Help us trace a complete Recycling Loop Map where dirty water, plant oxygen, and food scraps are 100% recycled with zero waste.',
      'What are fair ways for our New Planet Rulebook to share hard or messy jobs (like cleaning the compost or fixing pipes) and choose leaders?'
    ],
    competencies: ['ctps-03', 'ent-01', 'sea-02', 'lc-02'],
    stretchCompetencies: ['ent-02', 'sea-04'],
    sessions: [
      {
        sessionNumber: 5,
        week: 3,
        title: 'Week 3 (Part 1): Feeding 500 People with Hydroponics & Aeroponics',
        durationMin: 300,
        learningGoal: 'Calculate how much food and water a community of 500 people needs every day and explore farming without dirt using hydroponics and aeroponics.',
        activities: [
          'Figure out how much food and water a community of 500 people needs every day in deep space where there are no grocery stores and nothing can go to waste (4 hours).',
          'Explore cool ways to farm without dirt, like growing plants in water (hydroponics) or spraying their roots with mist (aeroponics), and begin sketching your Recycling Loop Map (1 hour).'
        ],
        learnerChoices: {
          question: 'Which soil-free space farming method will be the main farm on your ship?',
          options: [
            { id: 'opt-hydroponics', label: 'Hydroponic Water-Channel Gardens', description: 'Grow leafy greens, beans, and fruit in flowing nutrient water channels.' },
            { id: 'opt-aeroponics', label: 'Aeroponic Mist Towers', description: 'Hang plant roots in air and spray them with nutrient mist to save water and weight.' },
            { id: 'opt-combo-farm', label: 'Combined Hydroponic & Mist Farm Rooms', description: 'Use two separate farm rooms so a plant sickness in one room never ruins all food.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your 500-Person Daily Food & Water Math Sheet and soil-free farming plan.',
          targetCompetencies: ['ctps-03', 'sdl-02']
        },
        reflectionPrompt: 'Why is growing plants in water or mist better for a spaceship than carrying heavy bags of dirt from Earth?',
        teacherTips: 'Use the Biosphere & Recycling Loop tab in the Simulator so students can test how much farm space feeds 500 people.'
      },
      {
        sessionNumber: 6,
        week: 3,
        title: 'Week 3 (Part 2): Drawing Our Recycling Loop Map & Thai Baht Project Budget',
        durationMin: 300,
        learningGoal: 'Draw a complete Recycling Loop Map for water, oxygen, and food scraps, and create a project budget in Thai Baht alongside a spaceship weight plan.',
        activities: [
          'Finish drawing your Recycling Loop Map showing how dirty water gets cleaned, how plants make fresh oxygen for us to breathe, and how food scraps turn into plant food (2 hours).',
          'Make a project budget (3 hours): plan how to spend your classroom money (in Thai Baht) for model-building supplies, and also plan the weight limit for supplies on your real spaceship.'
        ],
        learnerChoices: {
          question: 'How will your team keep your classroom model supplies within your Thai Baht budget?',
          options: [
            { id: 'opt-upcycled-craft', label: 'Upcycled Bottles, Cardboard & Foam Saver Plan', description: 'Reuse clean plastic bottles and cardboard boxes to save Thai Baht for paint, clay, and wire.' },
            { id: 'opt-modular-budget', label: 'Room-by-Room THB Supply Budget', description: 'Divide the Thai Baht budget evenly between the spaceship model and the planet terrain model.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your illustrated Recycling Loop Map (water, oxygen, food scraps) and your Project Budget (in Thai Baht + spaceship weight limit).',
          targetCompetencies: ['ent-01', 'ctps-03']
        },
        reflectionPrompt: 'How does recycling every drop of water and every food scrap on a spaceship teach us to care for Earth better?',
        teacherTips: 'Remind teams to check both parts of their budget: classroom model-building money in Thai Baht AND weight limits on the real spaceship.'
      },
      {
        sessionNumber: 7,
        week: 4,
        title: 'Week 4 (Part 1): Fair Rules in History & Sharing Food, Jobs, and Space',
        durationMin: 300,
        learningGoal: 'Examine how explorers and communities in history made rules, and discuss how to share food, jobs, and space fairly.',
        activities: [
          'Look at how explorers and communities in history made rules, and talk about how to share food, jobs (including hard or messy jobs like cleaning the compost or fixing pipes), and space fairly (4 hours).',
          'Begin deciding how the rules might change once the spaceship lands on the new planet (1 hour).'
        ],
        learnerChoices: {
          question: 'How will your colony handle hard or messy jobs (like cleaning the compost or fixing pipes) so it is fair?',
          options: [
            { id: 'opt-job-rotation', label: 'Everyone Takes Turns (Fair Rotation)', description: 'Every team member rotates through messy jobs so nobody is stuck doing them alone.' },
            { id: 'opt-bonus-rest-credits', label: 'Extra Rest & Fun Credits', description: 'Volunteers who do hard repair or compost jobs earn extra recreation and park time.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your notes on fair job sharing, resource sharing, and basic rights for every person (body, mind/feelings, and how we treat each other).',
          targetCompetencies: ['sea-02', 'lc-02']
        },
        reflectionPrompt: 'What makes a rule feel fair to everyone in a community, even when supplies are limited?',
        teacherTips: 'Walk teams through Sections 1, 2, and 3 of Part 2: The New Planet Rulebook Worksheet.'
      },
      {
        sessionNumber: 8,
        week: 4,
        title: 'Week 4 (Part 2): Emergency Leaders, Voting & Writing Our New Planet Rulebook',
        durationMin: 300,
        learningGoal: 'Decide who leads during a space emergency vs. how people vote on the planet, and complete the 7-part New Planet Rulebook.',
        activities: [
          'Decide how the rules might change once the spaceship lands on the new planet: who is in charge during an emergency in space, and how do people vote for leaders once they land? (2 hours).',
          'Write your team\'s New Planet Rulebook (3 hours) using the 7-part Rulebook Worksheet explaining the laws for sharing the land, protecting nature, solving arguments peacefully, and choosing leaders, signed by all 4 team roles.'
        ],
        learnerChoices: {
          question: 'How will your community choose leaders once the spaceship lands on the new planet?',
          options: [
            { id: 'opt-community-vote', label: 'Every Colonist Votes', description: 'All citizens vote for leaders who serve for a set term and can be replaced if unfair.' },
            { id: 'opt-team-council', label: '4-Role Community Council', description: 'Builders, Scientists, Farmers, and Peacekeepers elect a shared council together.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your completed 7-Part New Planet Rulebook Worksheet signed by your Builder/Engineer, Planet Scientist, Farm & Life-Support Lead, and Law & Community Leader.',
          targetCompetencies: ['lc-02', 'sea-04', 'ec-02']
        },
        reflectionPrompt: 'Why do we want to fix problems and help people do better instead of using mean punishments in our Justice System?',
        teacherTips: 'Ensure every team completes all 7 sections of the New Planet Rulebook Worksheet, including Section 5 (Protecting Our New Planet\'s Nature) and Section 6 (Solving Arguments Peacefully).'
      }
    ]
  },
  {
    id: 'ideate',
    title: 'Phase 3: Ideate — Designing the Spaceship Rooms, Layout & Repair Guide',
    strap: 'Phase Question: How should we design the inside of our spaceship so people have places to live, work, and play, and how will we fix the ship if something breaks? (Weeks 5–6 • 20 Hours)',
    weeks: [5, 6],
    goal: 'Explore how the ship moves forward and creates fake gravity by spinning, plan welcoming ship neighborhoods, draw rough top and side maps, and finish a Ship Repair Guide with repair robots, 3D printers, and safety doors.',
    tasks: [
      'Week 5 (4 hours): Explore how the ship moves forward and how spinning parts of the ship can create fake gravity so people can walk normally.',
      'Week 5 (3 hours): Plan the neighborhoods inside the ship—decide where to put bedrooms, kitchens, hospitals, schools, parks, space farms, and engine rooms so the ship feels like a welcoming town.',
      'Week 5 (3 hours): Draw first rough maps of the ship from the top and the side, either on paper or on a computer.',
      'Week 6 (4 hours): Brainstorm all the dangers in deep space, like tiny space rocks hitting the outside wall or machines wearing out over time.',
      'Week 6 (3 hours): Invent smart ways to fix the ship while it is flying—design repair robots, 3D printers that make spare parts, and rooms that can be closed off safely if there is an air leak.',
      'Week 6 (3 hours): Finish your Ship Repair Guide, showing how crews and robots will keep the spaceship safe and clean.'
    ],
    evidence: [
      'Rough Top-View & Side-View Spaceship Neighborhood Maps (Spinning Gravity Ring, Bedrooms, Kitchens, Hospitals, Schools, Parks, Farms & Engines)',
      'Completed Ship Repair Guide (Repair Robots, 3D Spare-Part Printers & Air-Leak Safety Doors)'
    ],
    aiPromptStarters: [
      'How do spinning parts of a spaceship create fake gravity so people can walk normally without floating?',
      'Where should we place bedrooms, schools, parks, space farms, and engine rooms so our ship feels like a safe, welcoming town?',
      'What should we include in our Ship Repair Guide so repair robots, 3D printers, and safety doors can fix space pebble holes or broken pipes?'
    ],
    competencies: ['ct-01', 'ct-02', 'ctps-04', 'sdl-02'],
    stretchCompetencies: ['ct-05', 'ctps-05'],
    sessions: [
      {
        sessionNumber: 9,
        week: 5,
        title: 'Week 5 (Part 1): How the Ship Moves Forward & Spinning Fake Gravity',
        durationMin: 300,
        learningGoal: 'Explore how a giant spaceship moves forward and how spinning rings create fake gravity so people can walk normally.',
        activities: [
          'Explore how the ship moves forward and how spinning parts of the ship can create fake gravity so people can walk normally (4 hours).',
          'Start planning the neighborhoods inside the ship so noisy engines are kept safely away from bedrooms, schools, and hospitals (1 hour).'
        ],
        learnerChoices: {
          question: 'What shape will your spinning fake-gravity spaceship use?',
          options: [
            { id: 'opt-twin-wheel', label: 'Twin Spinning Gravity Wheels', description: 'Two big spinning rings connected to a central spine for homes, parks, and farms.' },
            { id: 'opt-cylinder-town', label: 'Spinning Cylinder Town', description: 'A wide spinning drum with parks and farms in the middle and bedrooms around the rim.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your diagram explaining how your spaceship moves forward and how its spinning parts create fake gravity.',
          targetCompetencies: ['ct-01', 'ctps-04']
        },
        reflectionPrompt: 'What would happen inside the kitchens, bathrooms, and farms if the gravity spinner ever had to stop for repairs?',
        teacherTips: 'Connect this session directly to Card 4 (The Gravity Spinner Glitch) so students think ahead about where exercise machines and motor access go!'
      },
      {
        sessionNumber: 10,
        week: 5,
        title: 'Week 5 (Part 2): Planning Ship Neighborhoods & Drawing Top/Side Maps',
        durationMin: 300,
        learningGoal: 'Plan welcoming ship neighborhoods and draw rough maps of the spaceship from the top and the side.',
        activities: [
          'Plan the neighborhoods inside the ship (2 hours): decide where to put the bedrooms, kitchens, hospitals, schools, parks, space farms, and engine rooms so the ship feels like a welcoming town.',
          'Draw your first rough maps of the ship from the top and the side, either on paper or on a computer (3 hours).'
        ],
        learnerChoices: {
          question: 'How will you make sure travelers don’t get the "Long Trip Grumpies" after five years in space?',
          options: [
            { id: 'opt-green-park-hub', label: 'Central Nature Park & Cozy Quiet Rooms', description: 'Put a sunny green park, art/music room, and quiet reading nooks near the living quarters.' },
            { id: 'opt-village-clusters', label: 'Welcoming Neighborhood Villages', description: 'Group bedrooms around small community kitchens, game rooms, and gardens.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload your first rough maps of the spaceship from the top view and the side view showing all neighborhoods.',
          targetCompetencies: ['ct-02', 'sea-02']
        },
        reflectionPrompt: 'How did your team arrange the bedrooms, kitchens, hospitals, schools, parks, space farms, and engine rooms so the ship feels like a welcoming town?',
        teacherTips: 'Check that students draw BOTH a top view and a side view, and include quiet/fun spaces for mental health.'
      },
      {
        sessionNumber: 11,
        week: 6,
        title: 'Week 6 (Part 1): Deep-Space Dangers & Smart Mid-Flight Repairs',
        durationMin: 300,
        learningGoal: 'Brainstorm deep-space dangers like tiny space rocks and worn-out machines, and start inventing smart ways to fix the ship while flying.',
        activities: [
          'Brainstorm all the dangers in deep space, like tiny space rocks hitting the outside wall or machines wearing out over time during a long voyage (4 hours).',
          'Begin inventing smart ways to fix the ship while it is flying—such as repair robots, 3D printers that make spare parts, and rooms that close off safely if there is an air leak (1 hour).'
        ],
        learnerChoices: {
          question: 'What kind of repair helper will your team invent for your spaceship?',
          options: [
            { id: 'opt-hull-robots', label: 'Outside Wall Spider-Repair Robots', description: 'Robots that crawl along the outside wall to patch space pebble holes safely.' },
            { id: 'opt-3d-print-shop', label: '3D Spare-Part Printer Workshop', description: 'Workshops next to the water pipes and engines that print new pipes and gears on demand.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your Deep-Space Dangers List and sketches of your repair robots, 3D printers, and emergency safety doors.',
          targetCompetencies: ['ctps-04', 'ct-02']
        },
        reflectionPrompt: 'Why can’t a spaceship wait for help from Earth when a water pipe clogs or a space pebble pokes a hole in the wall?',
        teacherTips: 'Encourage students to trace where repair tunnels and emergency safety doors sit between bedrooms and the outside hull.'
      },
      {
        sessionNumber: 12,
        week: 6,
        title: 'Week 6 (Part 2): Finishing Our Ship Repair Guide',
        durationMin: 300,
        learningGoal: 'Complete the Ship Repair Guide showing how crews and robots keep the spaceship safe, clean, and working.',
        activities: [
          'Continue inventing smart ways to fix the ship while it is flying—designing repair robots, 3D printers that make spare parts, and rooms that can be closed off safely if there is an air leak (2 hours).',
          'Finish your Ship Repair Guide, showing step-by-step how human crews and robots will keep the spaceship safe and clean (3 hours).'
        ],
        learnerChoices: {
          question: 'How will your Ship Repair Guide show where emergency tools and robots are kept?',
          options: [
            { id: 'opt-color-repair-map', label: 'Color-Coded Repair Station Map', description: 'Mark every robot dock, 3D printer workshop, and airlock safety door with bright symbols.' },
            { id: 'opt-emergency-checklist', label: 'Step-by-Step Crew & Robot Action Manual', description: 'Clear playbook for air leaks, water pump clogs, and gravity spinner tune-ups.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your completed Ship Repair Guide showing how crews, repair robots, 3D printers, and safety doors keep the ship working.',
          targetCompetencies: ['ctps-04', 'ec-01', 'sdl-02']
        },
        reflectionPrompt: 'How do human engineers and repair robots work together as a team in your Ship Repair Guide?',
        teacherTips: 'Have teams verify that their Ship Repair Guide covers hull punctures, water machine clogs, and gravity spinner maintenance.'
      }
    ]
  },
  {
    id: 'prototype',
    title: 'Phase 4: Prototype — Final Drawings, Digital Designs & Building the Physical Model',
    strap: 'Phase Question: How can we turn our ideas into clear drawings and build a real, hands-on model of our spaceship and planet? (Weeks 7–8 • 20 Hours)',
    weeks: [7, 8],
    goal: 'Create neat, clearly labeled big paper blueprints or computer 3D models (Tinkercad, FreeCAD, or Blender), and build a physical model of the spaceship and planet terrain with color coding or cutaway windows using the team budget.',
    tasks: [
      'Week 7 (5 hours): Choose to either draw big, detailed blueprints on paper or build a 3D model on the computer using programs like Tinkercad, FreeCAD, or Blender.',
      'Week 7 (5 hours): Label all the important parts on your drawings so anyone looking at your plan can easily spot the farms, living quarters, bedrooms, repair tunnels, and engines.',
      'Week 8 (2 hours): Gather simple craft and building materials like cardboard, foam, plastic bottles, wood sticks, clay, and wire using your team budget.',
      'Week 8 (5 hours): Build a small physical model of your spaceship and a piece of your new planet\'s land showing where the ship lands.',
      'Week 8 (3 hours): Add color coding or open "cutaway" windows on the model so people can peek inside to see the farms, bedrooms, and repair areas.'
    ],
    evidence: [
      'Labeled Paper Blueprints or Computer 3D Models (Farms, Living Quarters, Bedrooms, Repair Tunnels & Engines)',
      'Physical Model of Spaceship & New Planet Land with Color Coding or Open Cutaway Windows'
    ],
    aiPromptStarters: [
      'What labels and callouts should we include on our paper blueprints or Tinkercad/FreeCAD/Blender 3D model so visitors can spot every room easily?',
      'How can we use simple craft materials like cardboard, plastic bottles, wood sticks, foam, clay, and wire to build cutaway windows on our spaceship model?',
      'How should we show where our spaceship lands on our new planet terrain model?'
    ],
    competencies: ['ct-04', 'ct-05', 'ent-03', 'sdl-03'],
    stretchCompetencies: ['ec-05', 'lc-04'],
    sessions: [
      {
        sessionNumber: 13,
        week: 7,
        title: 'Week 7 (Part 1): Final Paper Blueprints or Computer 3D Models',
        durationMin: 300,
        learningGoal: 'Create big, detailed blueprints on paper or build a 3D digital model of the spaceship using Tinkercad, FreeCAD, or Blender.',
        activities: [
          'Choose your team\'s design path and build neat, detailed plans (5 hours): either draw big, detailed blueprints on paper OR build a 3D model on the computer using programs like Tinkercad, FreeCAD, or Blender (or the built-in Spaceship Digital Twin).'
        ],
        learnerChoices: {
          question: 'Which tool will your team use for your Week 7 final drawings and designs?',
          options: [
            { id: 'opt-paper-blueprints', label: 'Big Detailed Paper Blueprints', description: 'Hand-drafted top, side, and cross-section poster blueprints with ruler measurements.' },
            { id: 'opt-computer-3d', label: 'Computer 3D Model (Tinkercad / FreeCAD / Blender)', description: '3D digital model showing spinning rings, farm domes, and landing pods.' }
          ]
        },
        evidenceToCollect: {
          kind: 'code',
          prompt: 'Submit a photo of your big paper blueprints or screenshots/files from your Tinkercad, FreeCAD, or Blender 3D model.',
          targetCompetencies: ['ct-04', 'sdl-03']
        },
        reflectionPrompt: 'Why is it helpful to make neat, clear drawings before you start cutting cardboard and gluing your physical model?',
        teacherTips: 'Support both paper blueprint drafters and Tinkercad/FreeCAD/Blender builders equally; neatness and clarity matter most.'
      },
      {
        sessionNumber: 14,
        week: 7,
        title: 'Week 7 (Part 2): Labeling All Important Spaceship Parts Clearly',
        durationMin: 300,
        learningGoal: 'Label every important room and system on the drawings so anyone looking at the plan can easily spot farms, living quarters, bedrooms, repair tunnels, and engines.',
        activities: [
          'Label all the important parts on your drawings (5 hours): add clear titles, arrows, and color keys so anyone looking at your plan can easily spot the farms, living quarters, bedrooms, repair tunnels, and engines.'
        ],
        learnerChoices: {
          question: 'How will your team make your labels super easy for visitors to read?',
          options: [
            { id: 'opt-color-key-labels', label: 'Color-Coded Room Legend & Numbered Pins', description: 'Green for space farms, blue for water recycling, yellow for bedrooms/parks, red for engines/repairs.' },
            { id: 'opt-callout-boxes', label: 'Zoom-In Callout Boxes', description: 'Draw close-up boxes explaining how the hydroponic farm, airlocks, and repair tunnels work.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Submit your fully labeled drawings showing the farms, living quarters, bedrooms, repair tunnels, and engines.',
          targetCompetencies: ['ec-05', 'ct-04']
        },
        reflectionPrompt: 'Can a classmate from another team find your farms, bedrooms, repair tunnels, and engines in under 10 seconds using your labels?',
        teacherTips: 'Do a quick 5-minute label check across teams before Week 8 physical building begins.'
      },
      {
        sessionNumber: 15,
        week: 8,
        title: 'Week 8 (Part 1): Gathering Craft Supplies & Building Our Physical Model',
        durationMin: 300,
        learningGoal: 'Gather simple craft materials within the team Thai Baht budget and build a physical model of the spaceship and a piece of the new planet’s land.',
        activities: [
          'Gather simple craft and building materials like cardboard, foam, plastic bottles, wood sticks, clay, and wire using your team budget (2 hours).',
          'Begin building a small physical model of your spaceship and a piece of your new planet\'s land showing where the ship lands (3 hours). Remember: the model does not need to look like a fancy store-bought toy; what matters is showing how the spaces work together!'
        ],
        learnerChoices: {
          question: 'How will your team divide the physical model building work?',
          options: [
            { id: 'opt-split-ship-planet', label: 'Spaceship Hull Crew + Planet Terrain Crew', description: 'Half the team builds the spinning ship while half sculpts the Goldilocks planet landing site.' },
            { id: 'opt-modular-rooms', label: 'Modular Room Builders', description: 'Each teammate builds one key section (farms, bedrooms/park, engines/repairs, landing pod) and connects them.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Submit a photo of your team’s craft materials, Thai Baht budget sheet, and work-in-progress spaceship and planet terrain model.',
          targetCompetencies: ['ct-05', 'ent-03', 'lc-04']
        },
        reflectionPrompt: 'How did your team make smart choices with cardboard, plastic bottles, foam, wood sticks, clay, and wire to stay within your classroom budget?',
        teacherTips: 'Workshop safety: supervise scissors, craft knives, wire cutters, and glue guns at all times.'
      },
      {
        sessionNumber: 16,
        week: 8,
        title: 'Week 8 (Part 2): Adding Color Coding & Open Cutaway Windows',
        durationMin: 300,
        learningGoal: 'Complete the physical model of the spaceship and planet land and add color coding or open cutaway windows so people can peek inside.',
        activities: [
          'Finish building your physical model of the spaceship and the piece of your new planet\'s land showing where the ship lands (2 hours).',
          'Add color coding or open "cutaway" windows on the model so people can peek inside to see the farms, bedrooms, and repair areas (3 hours).'
        ],
        learnerChoices: {
          question: 'How will visitors peek inside your physical spaceship model?',
          options: [
            { id: 'opt-clear-bottle-cutaway', label: 'Clear Plastic Bottle Cutaway Windows', description: 'Use clear recycled plastic bottles or open hinged flaps to show the hydroponic farms and bedrooms inside.' },
            { id: 'opt-open-roof-color', label: 'Lift-Off Roof & Color-Coded Rooms', description: 'Build a removable top section with color-coded rooms and mini labels.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Submit photos of your completed physical spaceship model and planet terrain model showing your color coding and cutaway windows.',
          targetCompetencies: ['ct-05', 'ec-05']
        },
        reflectionPrompt: 'When someone peeks through your cutaway windows, what is the coolest part of your ship they can see inside?',
        teacherTips: 'Make sure every team’s model clearly shows the farms, bedrooms, repair areas, and where the ship lands on the planet terrain.'
      }
    ]
  },
  {
    id: 'test',
    title: 'Phase 5: Test — The Space Emergency Game & Testing Our Rules and Laws',
    strap: 'Phase Question: What happens to our spaceship design and our new laws when surprise problems happen, and how can we make our plans even stronger? (Weeks 9–10 • 20 Hours)',
    weeks: [9, 10],
    goal: 'Swap models and drawings for friendly feedback, play the 6-card Space Emergency Game to upgrade the physical model and drawings, and act out a planet argument to test and improve the New Planet Rulebook.',
    tasks: [
      'Week 9 (4 hours): Swap models and drawings with another team to give friendly, helpful feedback, looking for things that might have been forgotten, like missing repair doors or crowded rooms.',
      'Week 9 (3 hours): Play The Space Emergency Game (Part 1 Cards 1–6: 1. The Space Plant Sickness, 2. The Space Pebble Shower, 3. The Dirty Water Jam, 4. The Gravity Spinner Glitch, 5. The Long Trip Grumpies, 6. The Muddy Landing Surprise). Teams have 15 minutes per card to look at their physical model, drawings, and rulebook to figure out how to solve the problem.',
      'Week 9 (3 hours): Fix and upgrade your physical model and drawings based on what you learned—change or add one thing for each emergency to prove your ship is now safe.',
      'Week 10 (4 hours): Act out a problem on the new planet—for example, what if the builders and farmers argue over who gets the best land, or people refuse to follow the recycling rules?',
      'Week 10 (3 hours): Check if your team\'s laws help solve the argument fairly and peacefully without anyone being treated badly.',
      'Week 10 (3 hours): Rewrite and improve your New Planet Rulebook and adjust your colony spaces so everyone feels safe and included.'
    ],
    evidence: [
      'Space Emergency Game Card Solutions & Upgraded Physical Model / Drawings Photos',
      'New Planet Rulebook Role-Play Test Notes & Rewritten/Improved New Planet Rulebook'
    ],
    aiPromptStarters: [
      'Quiz our team with one of the 6 Space Emergency Game Cards (like The Space Plant Sickness or The Dirty Water Jam) and check our solution!',
      'What should we add to our physical model and drawings to survive Card 4 (The Gravity Spinner Glitch) and Card 6 (The Muddy Landing Surprise)?',
      'What if the builders and farmers argue over who gets the best land on our new planet—how can our Rulebook solve it peacefully without mean punishments?'
    ],
    competencies: ['ctps-05', 'sea-03', 'lc-03', 'sdl-04'],
    stretchCompetencies: ['ctps-06', 'sea-04'],
    sessions: [
      {
        sessionNumber: 17,
        week: 9,
        title: 'Week 9 (Part 1): Friendly Model Swap & Starting The Space Emergency Game',
        durationMin: 300,
        learningGoal: 'Swap physical models and drawings with classmates to give friendly, helpful feedback and begin playing The Space Emergency Game.',
        activities: [
          'Swap models and drawings between teams to give friendly, helpful feedback, looking for things that might have been forgotten, like missing repair doors or crowded rooms (4 hours).',
          'Learn how to play Part 1: The Space Emergency Game Cards and draw your first surprise emergency cards (1 hour).'
        ],
        learnerChoices: {
          question: 'Which Space Emergency Game Card will your team test first?',
          options: [
            { id: 'opt-card1-plant-sickness', label: 'Card 1: The Space Plant Sickness', description: 'Weird space mold turns half your hydroponic fruits and vegetables brown!' },
            { id: 'opt-card2-pebble-shower', label: 'Card 2: The Space Pebble Shower', description: 'Three super-fast space pebbles poke small air-leak holes near the bedrooms!' },
            { id: 'opt-card3-water-jam', label: 'Card 3: The Dirty Water Jam', description: 'The sink/shower water cleaner clogs and only 3 days of clean drinking water remain!' }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Submit the friendly feedback notes you received from swapping models/drawings and your team’s first Space Emergency Game Card answers.',
          targetCompetencies: ['lc-03', 'ctps-05']
        },
        reflectionPrompt: 'What helpful idea did another team spot when they looked at your physical model and drawings?',
        teacherTips: 'Read one Space Emergency Game Card at a time and set a 15-minute timer for teams to inspect their physical model, drawings, and rulebook.'
      },
      {
        sessionNumber: 18,
        week: 9,
        title: 'Week 9 (Part 2): Playing The Space Emergency Game & Upgrading Our Model',
        durationMin: 300,
        learningGoal: 'Solve the remaining Space Emergency Game Cards (Cards 4, 5, and 6) and upgrade the physical model and drawings to prove the ship is safe.',
        activities: [
          'Play the Space Emergency Game across Cards 1–6 (including Card 4: The Gravity Spinner Glitch, Card 5: The Long Trip Grumpies, and Card 6: The Muddy Landing Surprise) (2 hours).',
          'Fix and upgrade your physical model and drawings based on what you learned (3 hours): add a clean-up door/seed vault, emergency safety doors, a backup water tank/workshop, exercise machines, a cozy relaxation/art/music room, or strong landing legs/floating pads/underground shelters.'
        ],
        learnerChoices: {
          question: 'Which upgrade did your team add to your physical model and drawings after playing the Space Emergency Game?',
          options: [
            { id: 'opt-upgrade-farm-water', label: 'Backup Seed Vault, Second Farm Room & Water Tank', description: 'Protects against Card 1 (Space Plant Sickness) and Card 3 (Dirty Water Jam).' },
            { id: 'opt-upgrade-doors-gym', label: 'Emergency Safety Doors, Robot Stations & Zero-G Gym', description: 'Protects against Card 2 (Space Pebble Shower) and Card 4 (Gravity Spinner Glitch).' },
            { id: 'opt-upgrade-cozy-landing', label: 'Cozy Relaxation Room & Mud-Proof Landing Pads', description: 'Protects against Card 5 (Long Trip Grumpies) and Card 6 (Muddy Landing Surprise).' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Submit photos of the upgrades you added to your physical model and drawings to solve the Space Emergency Game Cards.',
          targetCompetencies: ['ctps-05', 'sdl-04', 'ct-05']
        },
        reflectionPrompt: 'How did playing the Space Emergency Game make your spaceship and planet landing design much stronger?',
        teacherTips: 'Verify that every team visibly changed or added at least one feature on their drawings or physical model for each emergency card played.'
      },
      {
        sessionNumber: 19,
        week: 10,
        title: 'Week 10 (Part 1): Acting Out Problems on Our New Planet',
        durationMin: 300,
        learningGoal: 'Act out realistic community arguments on the new planet and check whether the New Planet Rulebook solves them fairly and peacefully.',
        activities: [
          'Act out a problem on the new planet (4 hours): for example, what if the builders and farmers argue over who gets the best land, or people refuse to follow the recycling rules?',
          'Begin checking if your team\'s laws in the New Planet Rulebook help solve the argument fairly and peacefully without anyone being treated badly (1 hour).'
        ],
        learnerChoices: {
          question: 'Which new planet problem will your team act out and test against your Rulebook?',
          options: [
            { id: 'opt-land-argument', label: 'Builders vs. Farmers Best-Land Argument', description: 'Both groups want the sunny, flat river valley—how do your laws share land fairly?' },
            { id: 'opt-recycling-refusal', label: 'Refusing to Follow the Recycling & Compost Rules', description: 'Someone wastes clean water or skips messy compost duty—how do we help them fix the mistake kindly?' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your notes from acting out the new planet problem and how your Rulebook handled the argument.',
          targetCompetencies: ['sea-03', 'lc-03']
        },
        reflectionPrompt: 'When you acted out the argument, did anyone feel left out or treated unfairly by your old rules?',
        teacherTips: 'Remind students of Section 6 of the Rulebook Worksheet: "We do not want mean punishments; we want to fix the problem and help people do better."'
      },
      {
        sessionNumber: 20,
        week: 10,
        title: 'Week 10 (Part 2): Rewriting & Improving Our New Planet Rulebook',
        durationMin: 300,
        learningGoal: 'Evaluate the fairness of the colony’s laws and rewrite and improve the New Planet Rulebook and colony spaces so everyone feels safe and included.',
        activities: [
          'Check if your team\'s laws help solve the argument fairly and peacefully without anyone being treated badly (2 hours).',
          'Rewrite and improve your New Planet Rulebook and adjust your colony spaces so everyone feels safe and included (3 hours).'
        ],
        learnerChoices: {
          question: 'What improvement did your team add to your New Planet Rulebook?',
          options: [
            { id: 'opt-peace-circle', label: 'Peaceful Mediation & Calm-Down Space Rule', description: 'Added a favorite way to help angry teammates calm down, listen, and share land fairly.' },
            { id: 'opt-repair-restitution', label: 'Fix-the-Mistake Kindness Rule', description: 'Instead of mean punishment, anyone who breaks a rule helps the farm or recycling crew fix it.' }
          ]
        },
        evidenceToCollect: {
          kind: 'reflection',
          prompt: 'Submit your rewritten, improved New Planet Rulebook and notes on how you adjusted your colony spaces so everyone feels safe and included.',
          targetCompetencies: ['sea-03', 'sdl-04', 'lc-03']
        },
        reflectionPrompt: 'How did rewriting your Rulebook after testing make your new planet a kinder, fairer place to live?',
        teacherTips: 'Confirm all four team members sign off on Section 7 (Official Colony Signatures) of the improved Rulebook.'
      }
    ]
  },
  {
    id: 'share',
    title: 'Phase 6: Showcase and Pitch — Preparing the Big Pitch & The Space Launch Showcase',
    strap: 'Phase Question: How can we share an exciting presentation that proves our planet, our spaceship, and our laws are ready for launch? (Weeks 11–12 • 20 Hours)',
    weeks: [11, 12],
    goal: 'Build a 4-part slide presentation or poster board, set up the physical models and drawings for visitors, practice speaking confidently, deliver the live pitch at the Space Launch Showcase, save photos into the digital learning folder, and celebrate together.',
    tasks: [
      'Week 11 (4 hours): Build a slide presentation or poster board that tells your full story in four parts: 1) Why we chose our Goldilocks planet and how we will live on its land, 2) How our spaceship is built, kept safe, and repaired, 3) How we grow food and recycle water, and 4) How our new laws and government will work on the planet.',
      'Week 11 (3 hours): Set up your physical models and drawings so they are easy for visitors to see and understand.',
      'Week 11 (3 hours): Practice speaking out loud in front of classmates, timing your talks, and helping each other feel confident.',
      'Week 12 (5 hours): Give your live pitch to an audience of teachers, coaches, and guests—show off your physical model, explain your drawings, present your planet and laws, and answer questions from the judges.',
      'Week 12 (3 hours): Put photos of your model, your drawings, your planet research, and your rulebook into your digital learning folder so you have a record of everything you built.',
      'Week 12 (2 hours): Celebrate our hard work, share what we learned, and thank our teammates.'
    ],
    evidence: [
      '4-Part Slide Presentation or Poster Board + Showcase Display Setup (Hands-On Models + Drawings, Plans, and Rules)',
      'Digital Learning Folder (Photos of Physical Model, Drawings, Planet Research & Written New Planet Rulebook) + Team Celebration Reflection'
    ],
    aiPromptStarters: [
      'Help our team organize our 4-part Big Pitch so we cover: 1) Our Goldilocks planet, 2) Our spaceship & repairs, 3) Our food & water recycling, and 4) Our new laws!',
      'What questions might the teachers, coaches, and judges ask us during the Space Launch Showcase, and how can we practice answering confidently?',
      'Help us check that our Digital Learning Folder has all items from "What You Need to Hand In" and shows our growth across the 7 WeLearn Future Skills.'
    ],
    competencies: ['ec-03', 'ec-06', 'lc-05', 'sdl-07'],
    stretchCompetencies: ['ec-05', 'sea-03'],
    sessions: [
      {
        sessionNumber: 21,
        week: 11,
        title: 'Week 11 (Part 1): Building Our 4-Part Big Pitch Presentation or Poster Board',
        durationMin: 300,
        learningGoal: 'Build a slide presentation or poster board that tells the team’s full story across all four required parts.',
        activities: [
          'Build a slide presentation or poster board that tells your full story in four parts (4 hours): 1) Why we chose our Goldilocks planet and how we will live on its land, 2) How our spaceship is built, kept safe, and repaired, 3) How we grow food and recycle water, and 4) How our new laws and government will work on the planet.',
          'Begin planning how to arrange your physical models and drawings on your showcase table (1 hour).'
        ],
        learnerChoices: {
          question: 'Which format will your team use to tell your 4-part story?',
          options: [
            { id: 'opt-slide-deck', label: '4-Part Slide Presentation', description: 'Visual slides shown alongside your physical spaceship and planet model.' },
            { id: 'opt-tri-fold-poster', label: 'Illustrated Exhibition Poster Board', description: 'Big tri-fold science and story board framing your physical model display.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your 4-part slide presentation or poster board draft covering Planet, Spaceship/Repairs, Food/Water Recycling, and Laws/Government.',
          targetCompetencies: ['ec-03', 'ec-06']
        },
        reflectionPrompt: 'How do the four parts of your presentation fit together to tell one exciting story?',
        teacherTips: 'Check that every team clearly includes all 4 parts listed in Week 11 of the Project Exodus guide.'
      },
      {
        sessionNumber: 22,
        week: 11,
        title: 'Week 11 (Part 2): Setting Up Our Models & Practicing Speaking Out Loud',
        durationMin: 300,
        learningGoal: 'Set up the physical models and drawings so visitors can easily understand them, and practice speaking out loud with classmates.',
        activities: [
          'Set up your physical models and drawings so they are easy for visitors to see and understand (2 hours).',
          'Practice speaking out loud in front of classmates, timing your talks, and helping each other feel confident (3 hours).'
        ],
        learnerChoices: {
          question: 'How will each teammate share the speaking parts during your Big Pitch?',
          options: [
            { id: 'opt-four-speakers', label: 'One Teammate per Story Part (Parts 1–4)', description: 'Planet Scientist, Builder/Engineer, Farm & Life-Support Lead, and Law & Community Leader each present their part.' },
            { id: 'opt-guided-tour', label: 'Interactive Model & Rulebook Tour', description: 'Teammates guide the judges through the cutaway windows, Recycling Loop Map, and Rulebook together.' }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Submit your practice pitch rehearsal notes and classmate encouragement feedback.',
          targetCompetencies: ['ec-06', 'lc-05', 'sea-03']
        },
        reflectionPrompt: 'How did practicing in front of classmates help you and your teammates feel more confident for Launch Week?',
        teacherTips: 'Encourage warm, supportive peer rehearsals so every student feels proud and ready for visitors.'
      },
      {
        sessionNumber: 23,
        week: 12,
        title: 'Week 12 (Part 1): The Space Launch Showcase — Live Pitch to Judges & Guests',
        durationMin: 300,
        learningGoal: 'Give a live pitch to an audience of teachers, coaches, and guests, showing off the physical model, drawings, planet, and laws, and answering questions from judges.',
        activities: [
          'Welcome to Launch Week! Give your live pitch to an audience of teachers, coaches, and guests (5 hours): show off your physical model, explain your drawings, present your planet and laws, and answer questions from the judges.'
        ],
        learnerChoices: {
          question: 'What part of your project are you most excited to show the judges and guests first?',
          options: [
            { id: 'opt-show-cutaway', label: 'Our Spaceship Cutaway Windows & Planet Terrain Model', description: 'Point inside the physical model to show where people live, where food grows, and how repairs work.' },
            { id: 'opt-show-rulebook-loop', label: 'Our Recycling Loop Map & New Planet Rulebook', description: 'Show how 500 people recycle every drop of water and live by fair, kind laws.' }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Submit your Space Launch Showcase Judge Questions & Feedback Notes (Note: any audio/video recording requires prior school consent and is never stored by the platform).',
          targetCompetencies: ['ec-03', 'ec-06', 'ctps-05']
        },
        reflectionPrompt: 'What was your favorite question from the teachers, coaches, or guests during the Space Launch Showcase?',
        teacherTips: 'Safeguarding reminder: any recording of student pitches requires prior school consent and must never be stored on the platform.'
      },
      {
        sessionNumber: 24,
        week: 12,
        title: 'Week 12 (Part 2): Digital Learning Folder Hand-In & Team Celebration',
        durationMin: 300,
        learningGoal: 'Put photos of the model, drawings, planet research, and rulebook into the digital learning folder, self-assess across the 7 WeLearn Future Skills, and celebrate together.',
        activities: [
          'Put photos of your model, your drawings, your planet research, and your rulebook into your digital learning folder so you have a record of everything you built (3 hours): verifying both groups of work in "What You Need to Hand In" (1. Hands-On Models and 2. Drawings, Plans, and Rules).',
          'In our final hours together, celebrate our hard work, review how we grew across the 7 WeLearn Future Skills (Getting Started, Doing Great, Going Above and Beyond), share what we learned, and thank our teammates (2 hours).'
        ],
        learnerChoices: {
          question: 'Which of the 7 WeLearn Future Skills did you grow the most in during Project Exodus?',
          options: [
            { id: 'opt-skill-creative-critical', label: 'Creative Thinking & Critical Problem Solving', description: 'Inventing cool spaceship rooms, picking a planet with real science facts, and solving Space Emergency Cards.' },
            { id: 'opt-skill-comm-collab', label: 'Effective Communication & Kind Leadership', description: 'Labeling drawings clearly, pitching our story, and helping builders, artists, and law-makers work together.' },
            { id: 'opt-skill-sdl-ent-sea', label: 'Self-Direction, THB Budgeting & Caring for Feelings', description: 'Meeting weekly goals, sticking to our Thai Baht budget, and designing cozy spaces and peaceful laws.' }
          ]
        },
        evidenceToCollect: {
          kind: 'reflection',
          prompt: 'Submit your Digital Learning Folder checklist (1. Hands-On Models + 2. Drawings, Plans, and Rules) and your WeLearn Future Skills reflection.',
          targetCompetencies: ['sdl-07', 'lc-05', 'sea-03']
        },
        reflectionPrompt: 'What is one thing you want to thank your teammates for as we celebrate finishing Project Exodus?',
        teacherTips: 'Celebrate every team’s creativity and kindness, and ensure each learner’s Digital Learning Folder has photos of their physical model, drawings, planet research, and New Planet Rulebook.'
      }
    ]
  }
];

export const INTERSTELLAR_ARK_PROGRAM: PblProgram = {
  id: 'interstellar-ark-horizon-2026',
  title: 'Project Exodus: Building Our New Home in Space',
  subtitle: 'Designing a giant spaceship that keeps 500 people healthy and happy through deep space, building a hands-on model and recycling loop map, and creating a fair New Planet Rulebook across a 12-week, 120-hour Design Thinking journey.',
  status: 'provisional_prototype',
  theme: 'Space Habitat Design, Closed-Loop Farming & New Planet Rulebook',
  drivingQuestion: 'How can we design a giant spaceship that keeps people healthy and happy on a long trip through deep space, and create fair rules for our new home on a distant planet?',
  realProblem: {
    type: 'both',
    summary: 'In deep space, there are no grocery stores, no sunrise or sunset, and no outside rescue if something breaks. Traveling to a distant Goldilocks planet requires keeping 500 people healthy and happy in tight spaces, growing food without dirt, recycling every drop of water and breath of air, repairing the ship mid-flight, and writing fair, peaceful laws for humanity’s new home.',
    peopleImpact: 'Helps learners step into the shoes of space travelers to design welcoming neighborhoods, cozy mental-health spaces, and a kind, fair New Planet Rulebook where everyone’s body, mind, and feelings are protected.',
    environmentalImpact: 'Teaches zero-waste closed-loop living through hydroponics, aeroponics, water/oxygen/compost recycling loops, responsible Thai Baht supply budgeting, and laws that protect our new planet’s nature.'
  },
  targetAgeRange: 'Ages 9–17 (Primary through Upper Secondary: 9–11, 12–14, 15–17)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'Project Exodus Interactive Spaceship, Recycling Loop & Space Emergency Game Simulator (built-in web simulation)',
      'Optional computer 3D modeling tools: Tinkercad, FreeCAD, or Blender (or big paper blueprint supplies)'
    ],
    sensorsAndActuators: [
      'Digital Simulation Tools: Goldilocks Planet Finder, 500-Person Food & Water Recycling Calculator, 6 Space Emergency Game Cards, and Interactive New Planet Rulebook Worksheet',
      'Optional small LED lights or simple craft spinners to show day/night lighting and spinning fake-gravity rings'
    ],
    fabricationMaterials: [
      'Simple classroom craft and building materials bought within the team Thai Baht (THB) budget: cardboard, foam, plastic bottles, wood sticks, clay, and wire',
      'Color-coding markers, labels, and clear plastic or hinged flaps for open "cutaway" windows showing farms, bedrooms, and repair areas'
    ],
    softwareAndTools: [
      'Tinkercad, FreeCAD, or Blender for 3D computer models OR big paper blueprint poster sheets and rulers',
      'Part 1: The Space Emergency Game Cards (Cards 1–6) & Part 2: The New Planet Rulebook Worksheet (7-Section Fill-in-the-Blank Template)',
      'How You Will Grow: WeLearn Future Skills Guide (Getting Started, Doing Great, Going Above and Beyond across all 7 skills)'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Craft & Model Building Safety: Supervise scissors, craft cutters, wire bending, and low-temperature glue guns when building with cardboard, foam, plastic bottles, wood sticks, clay, and wire.',
      'Classroom Budget Care: Help teams plan and stick to their classroom money budget (in Thai Baht) and avoid wasting supplies.',
      'Child Safeguarding & Privacy: Under-13 learners (ages 9–11) never use speech-to-text or audio/video recording; use tap-to-choose, drawing, or teacher scribing instead. Any showcase recording for older learners requires prior school consent and is never stored on the platform.'
    ],
    pedagogicalScaffolding: [
      'What You Need to Hand In (Two Groups of Work): Ensure every team shares (1) Hands-On Models (physical spaceship and planet terrain model showing where people live, where food grows, and how engineers fix broken parts) and (2) Drawings, Plans, and Rules (computer 3D models or paper blueprints, Food and Recycling Loop Map, and written New Planet Rulebook).',
      'How to Play The Space Emergency Game (Week 9): Cut out or read one card at a time to each team. Give teams 15 minutes to look at their physical spaceship model, drawings, and rulebook to solve the problem, then have them change or add one thing to their drawings or model.'
    ],
    aiEthicsRules: [
      'Learners may use the AI Co-Pilot to check real science facts about Goldilocks planets, test 500-person food/water math, and practice Space Emergency Game questions.',
      'Every AI interaction must log what the team asked, what the AI suggested, and how the team used their own ideas.'
    ],
    differentiationNotes: [
      'Primary Track (Ages 9–11): Focus on big labeled paper blueprints, hands-on cardboard/bottle cutaway models, the fill-in-the-blank New Planet Rulebook Worksheet, and playing the 6 Space Emergency Game Cards (no speech-to-text or voice recording for under-13s).',
      'Middle & Upper Secondary Track (Ages 12–17): Combine 3D CAD models (Tinkercad, FreeCAD, or Blender) with quantitative 500-person hydroponic/water-recycling math, Thai Baht + spaceship mass budgets, and full community role-play trials.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-exodus-models',
      metric: 'Group 1 Hand-In: Hands-On Physical Spaceship & Planet Terrain Model',
      target: 'Physical spaceship and planet terrain model built within the team Thai Baht budget, with color coding or open cutaway windows showing where people live, where food grows, and how engineers fix broken parts',
      verificationMethod: 'Week 8 physical cutaway inspection + Week 9 Space Emergency Game Card upgrades on the physical model'
    },
    {
      id: 'metric-exodus-drawings-rules',
      metric: 'Group 2 Hand-In: Labeled Drawings, Recycling Loop Map & New Planet Rulebook',
      target: 'Clearly labeled computer 3D models (Tinkercad/FreeCAD/Blender) or paper blueprints + 500-person Food and Recycling Loop Map + completed 7-section New Planet Rulebook signed by all 4 team roles',
      verificationMethod: 'Week 7 label check + Week 3 Recycling Loop Map review + Week 10 Rulebook argument role-play test'
    },
    {
      id: 'metric-exodus-showcase-skills',
      metric: '4-Part Space Launch Showcase Pitch & WeLearn Future Skills Growth',
      target: 'Confident 4-part live pitch to teachers, coaches, and guests + complete Digital Learning Folder demonstrating "Doing Great" or "Going Above and Beyond" across all 7 WeLearn Future Skills',
      verificationMethod: 'Week 12 Space Launch Showcase presentation + WeLearn Future Skills Guide portfolio review'
    }
  ],
  assumptions: [
    {
      id: 'asmp-ark-schedule',
      domain: '12-Week / 120-Hour Schedule (10 Hours a Week)',
      assumption: 'Project Exodus runs for 12 weeks at 10 hours a week (120 hours total) across 6 two-week phases (Empathize, Define, Ideate, Prototype, Test, Showcase).',
      ownerVerificationNeeded: 'Confirm 10 hours/week studio schedule and guest invitations for the Week 12 Space Launch Showcase.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    },
    {
      id: 'asmp-ark-budget',
      domain: 'Classroom Craft Budget (in Thai Baht) & 3D Software Access',
      assumption: 'Teams receive a classroom supply budget in Thai Baht (up to 1,500 THB) for cardboard, foam, plastic bottles, wood sticks, clay, and wire, and have access to either paper blueprint supplies or Tinkercad, FreeCAD, or Blender.',
      ownerVerificationNeeded: 'Confirm classroom Thai Baht material budget per team and computer lab availability for Tinkercad/FreeCAD/Blender.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    }
  ],
  phases: INTERSTELLAR_ARK_PHASES
};
