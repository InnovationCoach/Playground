/**
 * Don's PBL Program: Entrepreneurship: Creating a Product
 * Branch: DonPBL
 * Location: prototypes/DonPBL/entrepreneurshipProgram.ts
 *
 * Sourced directly from the attached "Entrepreneurship: Creating a Product" PDF:
 * - Phase 1: Finding a Problem and Checking if People Care
 *   - Activity 1: The Problem Diary (Friction Log)
 *   - Activity 2: Talking to Real Users (Customer Interviews)
 *   - Activity 3: Writing the Problem Statement (Who / What / Why)
 * - Phase 2: Brainstorming Ideas and Choosing a Path
 *   - Activity 1: "Crazy 8s" Fast Brainstorming (Boxes 1–2, 3–4, 5–6, 7–8)
 *   - Activity 2: Choosing Your Best Idea (Physical vs. Digital + 1–5 Feasibility, Desirability, Durability)
 * - Phase 3: Building a Test Model (Prototyping)
 *   - Activity 1: Building a Quick, Cheap Model (Option A: Physical Product 1:1 Scale | Option B: Digital Solution 4-Screen Paper Cards <= 3 taps)
 *   - Activity 2: Testing with Users and Making Improvements (3 Classmates, The Silent Rule, Build Version 1.1)
 * - Phase 4: Calculating Costs and Prices
 *   - Activity 1: Cost to Make One Item (COGS / Unit Floor Cost in THB)
 *   - Activity 2: Setting the Price and Break-Even Point (SellingPrice = UnitCost / (1 - DesiredProfitMargin), Break-EvenUnits = One-TimeStartupCosts / (SellingPrice - UnitCost))
 * - Phase 5: Selling and Presenting Your Product
 *   - Activity 1: Finding Customers and Launching (First 25 paying customers/active users + 1-sentence Catchphrase)
 *   - Activity 2: The 3-Minute Sales Pitch (4 Timed Parts: 0:00–0:45, 0:45–1:45, 1:45–2:30, 2:30–3:00 + 20-second Q&A)
 */

import type { PblProgram, ProgramPhase } from './programData';

export interface StartupBadge {
  id: string;
  name: string;
  icon: string;
  xpAward: number;
  unlockedAtPhase: string;
  condition: string;
  description: string;
}

export interface MarketSimulationState {
  cashReserveTHB: number;
  unitFloorCostTHB: number;
  retailPriceTHB: number;
  grossMarginPct: number;
  targetBreakEvenUnits: number;
  unitsProduced: number;
  unitsSold: number;
  adoptersReached: number;
  burnRateWeeklyTHB: number;
  marketReputationScore: number; // 0 - 100
  productTrack: 'physical' | 'digital';
  frictionPointsResolved: number;
}

export interface GamificationLevel {
  level: number;
  title: string;
  minXp: number;
  privilegeUnlocked: string;
}

export interface SimulationPreset {
  id: string;
  name: string;
  track: 'physical' | 'digital';
  category: string;
  description: string;
  starterCashTHB: number;
  fixedStartupExpenseTHB: number;
  unitFloorCostTHB: number;
  suggestedRetailPriceTHB: number;
  targetGrossMarginPct: number;
  simulatedMarketDemandWeekly: number;
  commonFrictions: string[];
}

export interface EntrepreneurshipPhaseActivity {
  id: string;
  phaseTitle: string;
  activityTitle: string;
  goal: string;
  timeAllocation: string;
  materials: string;
  steps: string[];
}

export const ENTREPRENEURSHIP_PDF_ACTIVITIES: EntrepreneurshipPhaseActivity[] = [
  {
    id: 'p1-act1',
    phaseTitle: 'Phase 1: Finding a Problem and Checking if People Care',
    activityTitle: 'Activity 1: The Problem Diary (Friction Log)',
    goal: 'Find everyday problems that waste time, feel uncomfortable, or make people frustrated.',
    timeAllocation: '2 days to collect notes, 45 minutes to review them.',
    materials: 'A small notebook or a notes app on your phone.',
    steps: [
      'Carry your notebook with you at school, at home, and while traveling.',
      'Write down every time you see or feel a problem, delay, or annoyance (for example: messy headphone wires, lost locker keys, heavy bags, or messy study notes).',
      'For each problem, write down three things: Situation (Context), Temporary Fix (Workaround), and Result (Emotional Impact).',
      'Write down at least 5 different problems. At the end of Day 2, choose the top 2 problems that happen the most or cause the biggest trouble.'
    ]
  },
  {
    id: 'p1-act2',
    phaseTitle: 'Phase 1: Finding a Problem and Checking if People Care',
    activityTitle: 'Activity 2: Talking to Real Users (Customer Interviews)',
    goal: 'Prove that other people also have this problem. Do not talk about your own product ideas yet.',
    timeAllocation: '60 minutes total (10–12 minutes for each interview).',
    materials: 'A list of questions and a notebook (under-13s use written notes or teacher-run scribing; no audio recording is stored by the platform).',
    steps: [
      'Find 5 people who have the problem you chose in Activity 1 (such as classmates, parents, teachers, or local shop owners).',
      'Write questions about their past experiences. Do not ask "future" questions like, "Would you buy something that does X?"',
      'Ask these three main questions: (1) "Can you tell me about the last time you had [the problem]?" (2) "What tools, apps, or habits did you use to fix it, and what do you dislike about those fixes?" (3) "How much time or effort did you lose because of this problem?"',
      'Write down the exact words they say. Look for words about frustration, money, or wasted time. If at least 3 out of 5 people say the problem is not a big deal, drop this problem and test a different one from your diary.'
    ]
  },
  {
    id: 'p1-act3',
    phaseTitle: 'Phase 1: Finding a Problem and Checking if People Care',
    activityTitle: 'Activity 3: Writing the Problem Statement',
    goal: 'Clearly define the exact problem you are going to solve.',
    timeAllocation: '30 minutes.',
    materials: 'Paper cards or a whiteboard.',
    steps: [
      'Read your interview notes to find: the specific group of people, their exact problem, and why current tools do not work.',
      'Fill in these three blanks: Who [A specific group of people], What [The clear problem], and Why [The main cause].',
      'Put them together into one clear sentence: "Middle school brass musicians struggle to store maintenance tools safely because standard cases only fit the instrument body, leading to dented parts and lost accessories."',
      'Check your sentence: Did you mention your product idea? If yes, delete the product name. Focus only on the problem first.'
    ]
  },
  {
    id: 'p2-act1',
    phaseTitle: 'Phase 2: Brainstorming Ideas and Choosing a Path',
    activityTitle: 'Activity 1: "Crazy 8s" Fast Brainstorming',
    goal: 'Think past easy, boring ideas and come up with 8 different ways to solve the problem.',
    timeAllocation: '20 minutes.',
    materials: 'Blank A4 paper, a black marker, and a timer.',
    steps: [
      'Fold a piece of A4 paper until you have 8 equal boxes.',
      'Set a timer for 8 minutes (1 minute for each box).',
      'Draw a different solution in each box. You can write short labels, but you must draw how the product or app screen looks.',
      'Follow these rules for each box: Boxes 1–2 (Simple, normal solutions), Boxes 3–4 (Free solutions or ideas made from trash/recycled materials), Boxes 5–6 (Solutions with removable parts or multiple uses), Boxes 7–8 (Wild, creative, or completely different ideas).',
      'Stop drawing immediately when the timer rings.'
    ]
  },
  {
    id: 'p2-act2',
    phaseTitle: 'Phase 2: Brainstorming Ideas and Choosing a Path',
    activityTitle: 'Activity 2: Choosing Your Best Idea',
    goal: 'Check which of the 8 ideas is actually possible for you to build.',
    timeAllocation: '30 minutes.',
    materials: 'A scoring chart.',
    steps: [
      'Pick your top 2 favorite ideas from the Crazy 8s drawing.',
      'Decide if you are making a Physical Product (holding, carrying, organizing, or protecting physical things) or a Digital Solution (App/Website: slow communication, tracking information, slow work steps, or connecting people).',
      'Score your top 2 ideas from 1 to 5 (5 is best) in three areas: Can we build it? (Feasibility: 1–2 weeks), Do people want it? (Desirability: fixes main interview problem), Will it last? (Durability: survives >2 minutes of real use).',
      'Pick the idea with the highest total score to build next.'
    ]
  },
  {
    id: 'p3-act1',
    phaseTitle: 'Phase 3: Building a Test Model (Prototyping)',
    activityTitle: 'Activity 1: Building a Quick, Cheap Model',
    goal: 'Build a rough, cheap model to test the size, shape, and how easy it is to use before spending a lot of time and money.',
    timeAllocation: '90–120 minutes.',
    materials: 'Option A (Physical): cardboard, plastic board, foam, strong tape, hot glue, clay, red marker. Option B (Digital): paper cards and marker.',
    steps: [
      'Option A (Physical Product): Collect cheap materials, build a real-size (1:1 scale) model focusing on size/feel/weight, test it with real items, and use a red marker to circle weak spots, crooked parts, or areas too tight/loose directly on the model.',
      'Option B (Digital Solution — App/Website): Draw a paper map of every screen (Home Screen, Action Screen, Confirmation Screen, Summary Screen), draw each screen on a separate paper card with buttons/text boxes, and test by finger-tapping—if it takes more than 3 taps to reach the main goal, remove extra steps.'
    ]
  },
  {
    id: 'p3-act2',
    phaseTitle: 'Phase 3: Building a Test Model (Prototyping)',
    activityTitle: 'Activity 2: Testing with Users and Making Improvements',
    goal: 'Let real people try your rough model so you can see what is confusing or broken.',
    timeAllocation: '60 minutes.',
    materials: 'Your rough model and a sheet of paper to take notes.',
    steps: [
      'Give your model to 3 classmates who have never seen your project before.',
      'Give them one simple task (for example: "Show me how you would clip this to your bag," or "Find the practice log and save today’s notes").',
      'The Silent Rule: You must stay completely quiet during the test. Do not explain how it works, do not help them, and do not say sorry.',
      'Write down any problems you see: Where did the tester stop and think for more than 5 seconds? Where did the physical model bend, slip, or get stuck? Which app button did they press by mistake?',
      'Build Version 1.1: Change and fix at least two things on your model based on the mistakes you saw during the test.'
    ]
  },
  {
    id: 'p4-act1',
    phaseTitle: 'Phase 4: Calculating Costs and Prices',
    activityTitle: 'Activity 1: Cost to Make One Item (COGS)',
    goal: 'Calculate the exact cost to build or run one single unit of your product.',
    timeAllocation: '45 minutes.',
    materials: 'A spreadsheet or notebook, and a list of local material prices.',
    steps: [
      'List every material, part, or online service needed to make 1 unit.',
      'If you buy materials in large packs, divide the price to find the cost for 1 unit (Physical Example: 100 THB roll of strap makes 5 bags = 20 THB per bag; Digital Example: 350 THB monthly website fee shared by 50 users = 7 THB per user).',
      'Add extra small costs: bags, labels, payment fees, or stickers.',
      'Add everything together. This total is your Unit Cost (Unit Floor Cost).'
    ]
  },
  {
    id: 'p4-act2',
    phaseTitle: 'Phase 4: Calculating Costs and Prices',
    activityTitle: 'Activity 2: Setting the Price and Break-Even Point',
    goal: 'Decide on a good selling price and find out how many items you need to sell to pay back your starting tool costs.',
    timeAllocation: '45 minutes.',
    materials: 'Calculator and financial worksheet.',
    steps: [
      'Set your Selling Price (Retail Price) using a profit goal (margin): Physical products aim for 50% to 65% profit margin; Digital services aim for 70% to 85% profit margin. Formula: SellingPrice = UnitCost / (1 - DesiredProfitMargin).',
      'List your One-Time Startup Costs (tools you only buy once, like scissors, glue guns, website domain names, or software).',
      'Calculate your Break-Even Number: Break-EvenUnits = One-TimeStartupCosts / (SellingPrice - UnitCost).',
      'Write down your final 4 numbers clearly: Unit Cost, Selling Price, Profit per Unit (Margin), and Break-Even Units.'
    ]
  },
  {
    id: 'p5-act1',
    phaseTitle: 'Phase 5: Selling and Presenting Your Product',
    activityTitle: 'Activity 1: Finding Customers and Launching',
    goal: 'Make a clear plan to get your first 25 paying customers or active users.',
    timeAllocation: '45 minutes.',
    materials: 'Poster board or marketing plan sheet.',
    steps: [
      'Write down the exact places where your target users spend time together (school notice boards, lunch clubs, online chat groups, after-school events).',
      'Choose one main place to sell and one way to catch their attention (Physical: pre-order table at a school event with printed cards; Digital: short video showing how the app works posted in a group chat with a 1-click link).',
      'Write a 1-sentence Catchphrase (Value Proposition) that explains why your product is better: "Unlike [Old Way of Doing Things], [Your Product Name] gives you [Main Benefit] without [Main Problem]."'
    ]
  },
  {
    id: 'p5-act2',
    phaseTitle: 'Phase 5: Selling and Presenting Your Product',
    activityTitle: 'Activity 2: The 3-Minute Sales Pitch',
    goal: 'Give a clear, professional 3-minute presentation showing your working model.',
    timeAllocation: '60 minutes (writing, timing, and practicing with a friend).',
    materials: 'Stopwatch, slides or poster board, and your model (prototype).',
    steps: [
      'Write your presentation in 4 timed parts: Part 1 (0:00–0:45) The Problem (diary problem + real Phase 1 interview quote), Part 2 (0:45–1:45) The Solution (working model + Version 1.1 improvements), Part 3 (1:45–2:30) The Money (Unit Cost, Selling Price, Profit, and Break-Even Units in THB), Part 4 (2:30–3:00) The Next Step (e.g., "We need 1,500 THB for materials" or "We need 10 testers to try the app").',
      'Practice with a timer. If you do not reach Part 2 by 45 seconds, cut out extra stories from Part 1.',
      'Practice Questions (Q&A): Have a friend ask two hard questions about how strong your product is or why it costs that much. Practice answering each question in under 20 seconds using facts from your user tests and cost sheet.'
    ]
  }
];

export const ENTREPRENEURSHIP_LEVELS: GamificationLevel[] = [
  { level: 1, title: 'Problem Diary Scout', minXp: 0, privilegeUnlocked: 'Unlocked Phase 1 Problem Diary (Friction Log) & Interview Guide' },
  { level: 2, title: 'Customer Interview Validator', minXp: 500, privilegeUnlocked: 'Unlocked 3-out-of-5 User Validation & Who-What-Why Statement Builder' },
  { level: 3, title: 'Crazy 8s Idea Sprinter', minXp: 1200, privilegeUnlocked: 'Unlocked 8-Minute Crazy 8s Box Timer & 1–5 Scoring Chart' },
  { level: 4, title: 'Silent Rule Prototyper', minXp: 2000, privilegeUnlocked: 'Unlocked 1:1 Physical / 3-Tap Paper Card Lab & Version 1.1 Builder' },
  { level: 5, title: 'Thai Baht Financial Architect', minXp: 3000, privilegeUnlocked: 'Unlocked COGS Unit Cost, Selling Price & Break-Even Calculator' },
  { level: 6, title: 'First-25 Launch Strategist', minXp: 4200, privilegeUnlocked: 'Unlocked First-25 Customer Map & 1-Sentence Catchphrase Builder' },
  { level: 7, title: '3-Minute Sales Pitch Champion', minXp: 5500, privilegeUnlocked: 'Unlocked 4-Part 3-Minute Pitch Timer & 20-Second Q&A Arena' }
];

export const ENTREPRENEURSHIP_BADGES: StartupBadge[] = [
  {
    id: 'badge-friction-hunter',
    name: 'Problem Diary Detective',
    icon: '📓',
    xpAward: 350,
    unlockedAtPhase: 'explore',
    condition: 'Complete Phase 1 Activity 1: Log at least 5 everyday problems over 2 days with Situation (Context), Temporary Fix (Workaround), and Result (Emotional Impact), then pick the top 2.',
    description: 'Spotted real everyday delays, discomforts, and annoyances across school, home, and travel.'
  },
  {
    id: 'badge-unbiased-listener',
    name: 'Real User Interviewer',
    icon: '🗣️',
    xpAward: 400,
    unlockedAtPhase: 'empathise',
    condition: 'Complete Phase 1 Activity 2 & 3: Interview 5 real users about past experiences (no "Would you buy X?" questions), verify >= 3/5 care, and write a solution-free Who-What-Why Problem Statement.',
    description: 'Proved real people care about the problem and wrote a clear sentence without mentioning a product name.'
  },
  {
    id: 'badge-crazy-8-sprinter',
    name: 'Crazy 8s Fast Brainstormer',
    icon: '⚡',
    xpAward: 450,
    unlockedAtPhase: 'ideate',
    condition: 'Complete Phase 2 Activity 1 & 2: Sketch 8 boxes in 8 minutes (Boxes 1–2 normal, 3–4 trash/recycled, 5–6 removable/multi-use, 7–8 wild) and score top 2 on Feasibility, Desirability, and Durability.',
    description: 'Pushed past easy, boring ideas and picked the highest-scoring Physical or Digital path.'
  },
  {
    id: 'badge-digital-twin-architect',
    name: '1:1 Scale & 3-Tap Model Builder',
    icon: '🛠️',
    xpAward: 500,
    unlockedAtPhase: 'prototype',
    condition: 'Complete Phase 3 Activity 1: Build a 1:1 scale physical model (circling weak spots in red marker) or a 4-screen paper app card deck reaching the main goal in <= 3 taps.',
    description: 'Built a quick, cheap test model to check size, shape, and ease of use before spending big money.'
  },
  {
    id: 'badge-silent-observer',
    name: 'The Silent Rule Master (v1.1)',
    icon: '🤫',
    xpAward: 500,
    unlockedAtPhase: 'prototype',
    condition: 'Complete Phase 3 Activity 2: Test with 3 classmates following The Silent Rule (no explaining, helping, or saying sorry), log >5s hesitations/slips/wrong taps, and build Version 1.1 with >= 2 fixes.',
    description: 'Stayed 100% quiet during user testing and improved Version 1.1 based on real mistakes observed.'
  },
  {
    id: 'badge-unit-economics-master',
    name: 'THB Cost & Break-Even Whiz',
    icon: '฿',
    xpAward: 600,
    unlockedAtPhase: 'test',
    condition: 'Complete Phase 4 Activity 1 & 2: Calculate Unit Cost (COGS), Selling Price (50–65% physical or 70–85% digital margin), Profit per Unit, and Break-Even Units in Thai Baht (THB).',
    description: 'Mastered pack-division COGS math, profit margin pricing, and startup tool break-even volume.'
  },
  {
    id: 'badge-pitch-gladiator',
    name: '3-Minute Sales Pitch Gladiator',
    icon: '🏆',
    xpAward: 800,
    unlockedAtPhase: 'share',
    condition: 'Complete Phase 5 Activity 1 & 2: Plan how to get your first 25 customers, write your "Unlike..." Catchphrase, deliver the 4-part 3-minute pitch, and answer 2 hard Q&A questions in under 20 seconds.',
    description: 'Reached Part 2 by 0:45, proved the THB business model, and defended product strength and cost with facts.'
  }
];

export const ENTREPRENEURSHIP_SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'preset-brass-pocket',
    name: 'Brass Musician Soft Utility Pocket (Option A: Physical Product)',
    track: 'physical',
    category: 'Phase 1 & 4 PDF Example (Physical)',
    description: 'Soft clip-on accessory pocket so middle school brass musicians can carry music sheets and cleaning oil without denting instruments (100 THB roll of strap / 5 bags = 20 THB strap cost per unit).',
    starterCashTHB: 2500,
    fixedStartupExpenseTHB: 1200,
    unitFloorCostTHB: 45,
    suggestedRetailPriceTHB: 120,
    targetGrossMarginPct: 62.5,
    simulatedMarketDemandWeekly: 18,
    commonFrictions: [
      'Normal instrument cases do not have small, soft pockets for extra items',
      'Cleaning oil bottles and music sheets get crushed or dent the brass body',
      'Tester stopped >5 seconds trying to find the clip orientation on Version 1.0'
    ]
  },
  {
    id: 'preset-practice-tracker',
    name: '3-Tap Musician Practice Log App (Option B: Digital Solution)',
    track: 'digital',
    category: 'Phase 3 & 4 PDF Example (Digital)',
    description: '4-screen mobile web app (Home, Action, Confirmation, Summary) that lets students log daily practice notes in <= 3 taps (350 THB monthly website fee / 50 users = 7 THB per user).',
    starterCashTHB: 2000,
    fixedStartupExpenseTHB: 840,
    unitFloorCostTHB: 7,
    suggestedRetailPriceTHB: 35,
    targetGrossMarginPct: 80,
    simulatedMarketDemandWeekly: 45,
    commonFrictions: [
      'Existing apps take more than 3 taps to reach the practice log screen',
      'Tester pressed the wrong confirmation button by mistake on paper card #2',
      'Messy study and practice notes get lost across group chats'
    ]
  },
  {
    id: 'preset-headphone-wrap',
    name: 'Recycled Snap-Wrap for Headphone Wires & Locker Keys (Option A: Physical)',
    track: 'physical',
    category: 'Phase 1 Diary Example (Physical)',
    description: 'Built from recycled plastic board and strong webbing (Crazy 8s Boxes 3–6) to stop messy headphone wires and lost locker keys during school travel.',
    starterCashTHB: 2000,
    fixedStartupExpenseTHB: 900,
    unitFloorCostTHB: 30,
    suggestedRetailPriceTHB: 75,
    targetGrossMarginPct: 60,
    simulatedMarketDemandWeekly: 25,
    commonFrictions: [
      'Messy headphone wires tangle inside heavy school bags',
      'Lost locker keys delay students between classes',
      'Cardboard v1.0 clasp bent under real backpack pull test'
    ]
  },
  {
    id: 'preset-study-swap',
    name: 'Clean Study Notes Finder (Option B: Digital Solution)',
    track: 'digital',
    category: 'Phase 1 Diary Example (Digital)',
    description: 'Fast 3-tap web tool that organizes messy study notes by class topic so classmates never waste 20 minutes searching before a quiz.',
    starterCashTHB: 2500,
    fixedStartupExpenseTHB: 920,
    unitFloorCostTHB: 8,
    suggestedRetailPriceTHB: 40,
    targetGrossMarginPct: 80,
    simulatedMarketDemandWeekly: 50,
    commonFrictions: [
      'Messy study notes cause confusion and wasted study time at home',
      'Group chat photos of notes are impossible to search by subject',
      'Version 1.0 took 5 taps to save today’s notes (trimmed to 3 taps in v1.1)'
    ]
  }
];

export const ENTREPRENEURSHIP_PROGRAM_PHASES: ProgramPhase[] = [
  {
    id: 'explore',
    title: 'Explore',
    strap: 'Phase 1, Activity 1: The Problem Diary (Friction Log) — Finding a Problem (Weeks 1–2)',
    weeks: [1, 2],
    goal: 'Find everyday problems that waste time, feel uncomfortable, or make people frustrated by carrying a Problem Diary (Friction Log) at school, at home, and while traveling for 2 days, logging at least 5 problems, and choosing the top 2.',
    tasks: [
      'Step 1: Carry your small notebook or phone notes app with you at school, at home, and while traveling for 2 days.',
      'Step 2: Write down every time you see or feel a problem, delay, or annoyance (for example: messy headphone wires, lost locker keys, heavy bags, or messy study notes).',
      'Step 3: For each problem, write down three things: Situation (Context: where it happened & what the person was trying to do), Temporary Fix (Workaround: how they tried to fix or work around it), and Result (Emotional Impact: wasted time, physical hurt, confusion, or wasted money).',
      'Step 4: Write down at least 5 different problems, spend 45 minutes reviewing them at the end of Day 2, and choose the top 2 problems that happen the most or cause the biggest trouble.'
    ],
    evidence: [
      'The Problem Diary (Friction Log) with at least 5 everyday problems recording Situation (Context), Temporary Fix (Workaround), and Result (Emotional Impact)',
      '45-Minute End-of-Day-2 Review selecting the Top 2 problems that happen the most or cause the biggest trouble'
    ],
    aiPromptStarters: [
      'Help me check my 5 Problem Diary entries to make sure each one clearly lists Situation (Context), Temporary Fix (Workaround), and Result (Emotional Impact).',
      'How do we compare our 5 logged problems to pick the top 2 that happen the most or cause the biggest trouble?',
      'What are examples of temporary fixes (workarounds) people use for messy headphone wires, lost locker keys, heavy bags, or messy study notes?'
    ],
    competencies: ['sdl-01', 'ctps-01', 'ent-01'],
    stretchCompetencies: ['ctps-02', 'ent-02'],
    sessions: [
      {
        sessionNumber: 1,
        week: 1,
        title: 'Phase 1, Activity 1 (Days 1–2): Carrying the Problem Diary (Friction Log)',
        durationMin: 120,
        learningGoal: 'Carry a small notebook or phone notes app across school, home, and travel to spot everyday problems, delays, and annoyances using the 3-part Problem Diary format.',
        activities: [
          'Set up your Problem Diary (Friction Log) with 3 columns: Situation (Context), Temporary Fix (Workaround), and Result (Emotional Impact).',
          'Observe real everyday annoyances at school, at home, and while traveling (e.g., messy headphone wires, lost locker keys, heavy bags, messy study notes).',
          'Record at least 5 different problems over 2 days with exact details on how people currently work around them.'
        ],
        learnerChoices: {
          question: 'Where will you start observing everyday problems for your Problem Diary?',
          options: [
            { id: 'diary-school', label: 'At School (Classrooms, Lockers & Clubs)', description: 'Watch for lost locker keys, music case issues, heavy bags, or messy study notes.' },
            { id: 'diary-travel-home', label: 'At Home & While Traveling', description: 'Watch for messy headphone wires, commute delays, and home study annoyances.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your Problem Diary (Friction Log) with at least 5 different everyday problems showing Situation (Context), Temporary Fix (Workaround), and Result (Emotional Impact).',
          targetCompetencies: ['sdl-01', 'ctps-01']
        },
        reflectionPrompt: 'Why is looking at how someone tries to work around a problem (their Temporary Fix) such a big clue for an entrepreneur?',
        teacherTips: 'Remind students not to invent imaginary sci-fi problems—every entry in the Problem Diary must be something they actually saw or felt.'
      },
      {
        sessionNumber: 2,
        week: 2,
        title: 'Phase 1, Activity 1 (Review): 45-Minute Problem Diary Review & Picking Your Top 2 Problems',
        durationMin: 45,
        learningGoal: 'Review all 5+ Problem Diary notes and select the top 2 problems that happen the most or cause the biggest trouble to test in customer interviews.',
        activities: [
          'Review every problem logged over the 2-day Problem Diary collection period.',
          'Compare how often each problem happens and whether it wastes time, hurts physically, causes confusion, or wastes money.',
          'Choose the top 2 problems that happen the most or cause the biggest trouble.'
        ],
        learnerChoices: {
          question: 'What kind of impact made your #1 chosen problem stand out from the rest of your diary?',
          options: [
            { id: 'impact-time-money', label: 'Wasted Time or Wasted Money', description: 'Causes repeated delays or damages items people have to replace.' },
            { id: 'impact-hurt-confusion', label: 'Physical Discomfort or Frustrating Confusion', description: 'Feels uncomfortable to carry/use or makes daily tasks confusing.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Upload your Top 2 Chosen Problems from your 45-minute Problem Diary review and explain why they cause the biggest trouble.',
          targetCompetencies: ['ctps-01', 'ent-01']
        },
        reflectionPrompt: 'Why do we pick 2 problems at the end of Activity 1 instead of locking into only 1 problem before talking to other people?',
        teacherTips: 'Keeping a backup problem from the diary is essential in case Activity 2 interviews show that fewer than 3 out of 5 people care about the first problem!'
      }
    ]
  },
  {
    id: 'empathise',
    title: 'Empathise',
    strap: 'Phase 1, Activity 2: Talking to Real Users (Customer Interviews) — Checking if People Care (Weeks 3–4)',
    weeks: [3, 4],
    goal: 'Prove that other people also have the problem from Activity 1 by interviewing 5 real users (10–12 minutes each, 60 minutes total) about their past experiences without talking about your own product ideas.',
    tasks: [
      'Step 1: Find 5 people who have the problem you chose in Activity 1 (such as classmates, parents, teachers, or local shop owners).',
      'Step 2: Write questions about their past experiences. Do not ask "future" questions like, "Would you buy something that does X?" and do not talk about your own product ideas yet.',
      'Step 3: Ask these three main questions: (1) "Can you tell me about the last time you had [the problem]?" (2) "What tools, apps, or habits did you use to fix it, and what do you dislike about those fixes?" (3) "How much time or effort did you lose because of this problem?"',
      'Step 4: Write down the exact words they say. Look for words about frustration, money, or wasted time. If at least 3 out of 5 people say the problem is not a big deal, drop this problem and test a different one from your diary.'
    ],
    evidence: [
      'Written Past-Experience Interview Question List (free of "Would you buy X?" future questions)',
      '5 Real User Interview Notes (10–12 minutes each) with exact quotes and the 3-out-of-5 Validation Check'
    ],
    aiPromptStarters: [
      'Check my interview questions: Did I accidentally ask a "future" question like "Would you buy something that does X?" instead of asking about past experiences?',
      'Help me practice asking the 3 main Customer Interview questions without talking about my product idea.',
      'Here are the exact words from my 5 interviews—do at least 3 out of 5 people show frustration, wasted money, or wasted time?'
    ],
    competencies: ['ec-01', 'lc-01', 'ctps-01'],
    stretchCompetencies: ['ec-02', 'ent-01'],
    sessions: [
      {
        sessionNumber: 3,
        week: 3,
        title: 'Phase 1, Activity 2 (Part 1): Preparing Past-Experience Questions & Selecting 5 Real Users',
        durationMin: 60,
        learningGoal: 'Identify 5 real users who have the problem from Activity 1 and prepare the 3 main past-experience interview questions without mentioning any product ideas.',
        activities: [
          'List 5 real people who experience your chosen problem (classmates, parents, teachers, or local shop owners).',
          'Practice the rule: Do not talk about your own product ideas yet, and never ask future questions like "Would you buy something that does X?"',
          'Prepare your notebook with the 3 required questions: (1) Last time you had the problem, (2) Tools/apps/habits used to fix it & what you dislike about them, (3) Time or effort lost.'
        ],
        learnerChoices: {
          question: 'Which group of 5 real users will you interview for Activity 2?',
          options: [
            { id: 'users-school', label: 'Classmates & Teachers at School', description: 'Interview 5 students or teachers who deal with the problem during the school week.' },
            { id: 'users-community', label: 'Parents & Local Shop Owners', description: 'Interview 5 family members or local neighborhood shopkeepers.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your list of 5 interviewees and your written 3-question interview sheet focusing strictly on past experiences.',
          targetCompetencies: ['ec-01', 'ctps-01']
        },
        reflectionPrompt: 'Why do people often say "Yes, I would buy that!" just to be polite when you ask future questions, and why is asking about the last time they had the problem much more honest?',
        teacherTips: 'Safeguarding note: Under-13 students use a notebook or teacher-run scribing to write down exact quotes (no voice recording for under-13s). Older students must have prior consent and never upload audio recordings to the platform.'
      },
      {
        sessionNumber: 4,
        week: 4,
        title: 'Phase 1, Activity 2 (Part 2): Conducting 5 Customer Interviews (60 Min) & The 3-out-of-5 Rule',
        durationMin: 60,
        learningGoal: 'Conduct 5 customer interviews (10–12 minutes each), write down the exact words users say about frustration, money, or wasted time, and apply the 3-out-of-5 drop/keep rule.',
        activities: [
          'Run 5 interviews (10–12 minutes each, 60 minutes total) asking the 3 main questions.',
          'Write down the exact words interviewees say—looking for words about frustration, money, or wasted time.',
          'Apply Step 4: If at least 3 out of 5 people say the problem is not a big deal, drop this problem and test the second problem from your Problem Diary.'
        ],
        learnerChoices: {
          question: 'What did your 5 Customer Interviews prove when you checked the 3-out-of-5 rule?',
          options: [
            { id: 'rule-keep', label: 'Validated! (3+ of 5 People Care Strongly)', description: 'At least 3 out of 5 interviewees shared real frustration, wasted time, or disliked fixes.' },
            { id: 'rule-pivot', label: 'Dropped & Switched to Diary Problem #2', description: 'At least 3 out of 5 said Problem #1 was not a big deal, so we tested Problem #2 from our diary.' }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Log the exact quotes from all 5 interviewees and your 3-out-of-5 validation result.',
          targetCompetencies: ['ec-01', 'lc-01']
        },
        reflectionPrompt: 'What was the strongest exact quote one of your 5 interviewees said that proved this problem wastes time, effort, or money?',
        teacherTips: 'Celebrate teams that honestly drop a weak problem when 3 out of 5 people say it is not a big deal—that saves them weeks of building the wrong thing!'
      }
    ]
  },
  {
    id: 'define',
    title: 'Define',
    strap: 'Phase 1, Activity 3: Writing the Problem Statement — Who, What & Why (Week 5)',
    weeks: [5, 5],
    goal: 'Clearly define the exact problem you are going to solve in 30 minutes using paper cards or a whiteboard by filling in Who, What, and Why and combining them into one clear sentence without mentioning your product idea.',
    tasks: [
      'Step 1: Read your interview notes to find: the specific group of people, their exact problem, and why current tools do not work.',
      'Step 2: Fill in these three blanks: Who [A specific group of people, e.g., Middle school students who play music], What [The clear problem, e.g., find it hard to carry music sheets and cleaning oil without crushing them], and Why [The main cause, e.g., normal instrument cases do not have small, soft pockets for extra items].',
      'Step 3: Put them together into one clear sentence (for example: "Middle school brass musicians struggle to store maintenance tools safely because standard cases only fit the instrument body, leading to dented parts and lost accessories.").',
      'Step 4: Check your sentence: Did you mention your product idea? If yes, delete the product name. Focus only on the problem first.'
    ],
    evidence: [
      'Completed Who / What / Why Problem Cards or Whiteboard Breakdown',
      'One-Sentence Problem Statement verified to contain zero product names'
    ],
    aiPromptStarters: [
      'Check our Problem Statement sentence: Did we accidentally mention our product idea or product name anywhere in it?',
      'Help us turn our Who, What, and Why blanks into one clear sentence like the middle school brass musicians example.',
      'Is our "Why" blank explaining the main cause of why current tools do not work?'
    ],
    competencies: ['ctps-01', 'ec-01', 'ent-01'],
    stretchCompetencies: ['ctps-02', 'ent-02'],
    sessions: [
      {
        sessionNumber: 5,
        week: 5,
        title: 'Phase 1, Activity 3 (Part 1): Filling in the Who, What, and Why Blanks',
        durationMin: 30,
        learningGoal: 'Read your customer interview notes and fill in the Who, What, and Why blanks on paper cards or a whiteboard.',
        activities: [
          'Review your 5 customer interview notes to identify the specific group of people, their exact problem, and why current tools fail.',
          'Fill in Blank 1 — Who: [A specific group of people, e.g., Middle school students who play music].',
          'Fill in Blank 2 — What: [The clear problem, e.g., find it hard to carry music sheets and cleaning oil without crushing them].',
          'Fill in Blank 3 — Why: [The main cause, e.g., normal instrument cases do not have small, soft pockets for extra items].'
        ],
        learnerChoices: {
          question: 'How specific is the "Who" blank in your Problem Statement?',
          options: [
            { id: 'who-specific-group', label: 'Specific Group with Shared Activity (e.g., Middle school brass musicians)', description: 'Names the exact group of people and what they are doing when the problem hits.' },
            { id: 'who-campus-users', label: 'Specific School or Local User Group', description: 'Names the exact students, teachers, or shop owners interviewed in Activity 2.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your filled-in Who, What, and Why blanks based on your Activity 2 interview notes.',
          targetCompetencies: ['ctps-01', 'ec-01']
        },
        reflectionPrompt: 'How did reading your real user interview notes change what you wrote in the "Why" blank?',
        teacherTips: 'Compare students’ drafts against the PDF example so they see how concrete "Middle school students who play music" is compared to just writing "Everybody".'
      },
      {
        sessionNumber: 6,
        week: 5,
        title: 'Phase 1, Activity 3 (Part 2): Combining into One Clear Sentence & The "No Product Name" Check',
        durationMin: 30,
        learningGoal: 'Put Who, What, and Why together into one clear Problem Statement sentence and verify that it does not mention any product idea or product name.',
        activities: [
          'Combine your Who, What, and Why blanks into one clear sentence (like: "Middle school brass musicians struggle to store maintenance tools safely because standard cases only fit the instrument body, leading to dented parts and lost accessories.").',
          'Run Step 4 Check: Did you mention your product idea? If yes, delete the product name so you focus only on the problem first.'
        ],
        learnerChoices: {
          question: 'Did your Problem Statement pass the Step 4 "No Product Idea Mentioned" check?',
          options: [
            { id: 'stmt-clean', label: 'Passed First Try (Zero Product Names)', description: 'Our sentence describes only Who, What, and Why without naming our product.' },
            { id: 'stmt-edited', label: 'Edited to Delete Product Name', description: 'We spotted a product idea in our first draft and deleted it to focus only on the problem.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your final one-sentence Problem Statement after passing the Step 4 check.',
          targetCompetencies: ['ctps-01', 'ent-01']
        },
        reflectionPrompt: 'Why is it so important to delete your product name from the Problem Statement before you start Phase 2 brainstorming?',
        teacherTips: 'If a team’s Problem Statement mentions their product idea, have them cross it out on the whiteboard right away so Phase 2 Crazy 8s stays wide open.'
      }
    ]
  },
  {
    id: 'ideate',
    title: 'Ideate and Plan',
    strap: 'Phase 2: Brainstorming Ideas and Choosing a Path — "Crazy 8s" & 1–5 Scoring Chart (Week 6)',
    weeks: [6, 6],
    goal: 'Think past easy, boring ideas using the 8-minute "Crazy 8s" Fast Brainstorming method (Boxes 1–2, 3–4, 5–6, 7–8), choose between a Physical Product or a Digital Solution (App/Website), and score your top 2 ideas from 1 to 5 in Feasibility, Desirability, and Durability.',
    tasks: [
      'Activity 1, Steps 1–3: Fold a piece of blank A4 paper until you have 8 equal boxes, set a timer for 8 minutes (1 minute for each box), and draw a different solution in each box with a black marker showing how the product or app screen looks.',
      'Activity 1, Steps 4–5: Follow the box rules—Boxes 1–2: Simple, normal solutions; Boxes 3–4: Free solutions or ideas made from trash/recycled materials; Boxes 5–6: Solutions with removable parts or multiple uses; Boxes 7–8: Wild, creative, or completely different ideas—and stop drawing immediately when the timer rings.',
      'Activity 2, Steps 1–2: Pick your top 2 favorite ideas from the Crazy 8s drawing and decide if you are making a Physical Product (holding, carrying, organizing, or protecting physical things) or a Digital Solution (App/Website: slow communication, tracking information, slow work steps, or connecting people).',
      'Activity 2, Steps 3–4: Score your top 2 ideas from 1 to 5 (5 is best) in three areas—Can we build it? (Feasibility: working test version in 1–2 weeks), Do people want it? (Desirability: directly fixes the main interview problem), Will it last? (Durability: survives >2 minutes of real use without breaking)—and pick the idea with the highest total score to build next.'
    ],
    evidence: [
      'Completed 8-Box A4 "Crazy 8s" Fast Brainstorming Sheet (Boxes 1–2 Normal, 3–4 Trash/Recycled, 5–6 Removable/Multi-Use, 7–8 Wild/Creative)',
      'Physical Product vs. Digital Solution (App/Website) Path Decision',
      'Top-2 Idea Scoring Chart (1 to 5 scores in Feasibility, Desirability, and Durability) with highest total score selected'
    ],
    aiPromptStarters: [
      'We are stuck on Boxes 3–4 (trash/recycled materials) and Boxes 5–6 (removable parts/multiple uses) for our Crazy 8s sheet—give us prompts to spark our drawings!',
      'Should our problem be solved with a Physical Product or a Digital Solution (App/Website) based on the Phase 2 Activity 2 rules?',
      'Help us reality-check our 1 to 5 scores for Feasibility (build in 1–2 weeks), Desirability (fixes interview problem), and Durability (survives >2 minutes of real use).'
    ],
    competencies: ['ctps-01', 'ent-01', 'sdl-01'],
    stretchCompetencies: ['ctps-02', 'ent-02'],
    sessions: [
      {
        sessionNumber: 7,
        week: 6,
        title: 'Phase 2, Activity 1 (20 Min): "Crazy 8s" Fast Brainstorming (Boxes 1–8)',
        durationMin: 45,
        learningGoal: 'Fold an A4 sheet into 8 equal boxes and draw 8 different solutions in 8 minutes (1 minute per box) following the rules for Boxes 1–2, 3–4, 5–6, and 7–8.',
        activities: [
          'Fold a blank A4 paper into 8 equal boxes and grab a black marker.',
          'Start the 8-minute timer (1 minute per box) and draw how the product or app screen looks with short labels:',
          'Boxes 1–2: Simple, normal solutions | Boxes 3–4: Free solutions or ideas made from trash/recycled materials | Boxes 5–6: Solutions with removable parts or multiple uses | Boxes 7–8: Wild, creative, or completely different ideas.',
          'Stop drawing immediately when the timer rings.'
        ],
        learnerChoices: {
          question: 'Which pair of Crazy 8s boxes sparked your favorite drawing?',
          options: [
            { id: 'c8-boxes-3-4', label: 'Boxes 3–4: Free / Trash & Recycled Materials', description: 'Clever zero-cost solutions built from recycled or everyday materials.' },
            { id: 'c8-boxes-5-6', label: 'Boxes 5–6: Removable Parts or Multiple Uses', description: 'Modular designs that detach, clip on, or serve more than one purpose.' },
            { id: 'c8-boxes-7-8', label: 'Boxes 7–8: Wild, Creative, Completely Different Ideas', description: 'Bold ideas we only thought of after pushing past the easy normal boxes.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload a photo of your 8-box Crazy 8s A4 drawing sheet showing all 8 boxes.',
          targetCompetencies: ['ctps-01', 'ent-01']
        },
        reflectionPrompt: 'How did the rules for Boxes 3–4 (trash/recycled) and Boxes 5–6 (removable parts/multiple uses) push you past easy, boring ideas?',
        teacherTips: 'Call out each 1-minute mark loudly and make sure everyone puts their black markers down the second the 8-minute timer rings!'
      },
      {
        sessionNumber: 8,
        week: 6,
        title: 'Phase 2, Activity 2 (30 Min): Choosing Your Best Idea (Physical vs. Digital & 1–5 Scoring Chart)',
        durationMin: 45,
        learningGoal: 'Pick your top 2 favorite ideas from Crazy 8s, decide between a Physical Product or a Digital Solution (App/Website), and score both ideas from 1 to 5 in Feasibility, Desirability, and Durability.',
        activities: [
          'Pick your top 2 favorite ideas from your Crazy 8s drawing.',
          'Decide your path: Choose Physical Product (if the problem is about holding, carrying, organizing, or protecting physical things) OR Digital Solution — App/Website (if the problem is about slow communication, tracking information, slow work steps, or connecting people).',
          'Score your top 2 ideas from 1 to 5 (5 is best) in: (1) Can we build it? (Feasibility: working test version in 1–2 weeks), (2) Do people want it? (Desirability: directly fixes main interview problem), (3) Will it last? (Durability: survives >2 minutes of real use without breaking).',
          'Pick the idea with the highest total score (out of 15) to build next.'
        ],
        learnerChoices: {
          question: 'Which path did you choose in Phase 2, Activity 2?',
          options: [
            { id: 'path-physical', label: 'Option A: Physical Product', description: 'Holding, carrying, organizing, or protecting physical things.' },
            { id: 'path-digital', label: 'Option B: Digital Solution (App/Website)', description: 'Slow communication, tracking information, slow work steps, or connecting people.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your completed 1–5 Scoring Chart (Feasibility, Desirability, Durability) for your top 2 ideas and state your winning idea.',
          targetCompetencies: ['ctps-01', 'sdl-01']
        },
        reflectionPrompt: 'Why is checking "Will it survive more than 2 minutes of real use without breaking?" (Durability) so important before you start building?',
        teacherTips: 'Check that students honestly score Feasibility (can they really build a working test version in 1–2 weeks?).'
      }
    ]
  },
  {
    id: 'prototype',
    title: 'Prototype',
    strap: 'Phase 3: Building a Test Model (Prototyping) — Quick, Cheap Model, The Silent Rule & Version 1.1 (Weeks 7–8)',
    weeks: [7, 8],
    goal: 'Build a rough, cheap test model (90–120 minutes: Option A 1:1 scale physical model with red-marker weak spots OR Option B 4-screen paper card app map in <= 3 taps), test it with 3 classmates under The Silent Rule (60 minutes), and build Version 1.1 fixing at least two things.',
    tasks: [
      'Activity 1, Option A (Physical Product): Collect cheap materials (cardboard, plastic board, foam, strong tape, hot glue, or clay), build a real-size (1:1 scale) model focusing on real size, how it feels to hold, and how heavy it is, test it with the real items it is supposed to hold, and use a red marker to circle weak spots, crooked parts, or areas that are too tight or too loose directly on the model.',
      'Activity 1, Option B (Digital Solution — App/Website): Draw a map on paper showing every screen the user needs to see (Home Screen, Action Screen, Confirmation Screen, Summary Screen), draw each screen on a separate paper card with every button and text box, and test it on a table as a user "taps" with their finger—if it takes more than 3 taps to reach the main goal, remove extra steps.',
      'Activity 2, Steps 1–4 (Testing with Users — The Silent Rule): Give your model to 3 classmates who have never seen your project before, give them one simple task (e.g., "Show me how you would clip this to your bag" or "Find the practice log and save today’s notes"), obey The Silent Rule (stay completely quiet—do not explain, do not help, do not say sorry), and write down: (1) Where did the tester stop and think for more than 5 seconds? (2) Where did the physical model bend, slip, or get stuck? (3) Which app button did they press by mistake?',
      'Activity 2, Step 5 (Build Version 1.1): Change and fix at least two things on your model based on the mistakes you saw during the test.'
    ],
    evidence: [
      'Version 1.0 Quick, Cheap Model Photo (Option A: 1:1 scale model with red-marker circles around weak/tight/loose spots OR Option B: 4 paper screen cards verified to take <= 3 taps)',
      'Silent Rule User Test Notes from 3 Classmates (>5s hesitations, bends/slips/stuck parts, wrong app buttons tapped)',
      'Version 1.1 Improved Model Photo/Map showing at least 2 concrete fixes'
    ],
    aiPromptStarters: [
      'We circled 3 weak spots with a red marker on our 1:1 cardboard/foam model—what is the simplest way to reinforce them for Version 1.1?',
      'Our paper card app takes 5 finger taps to go from Home Screen to Summary Screen—help us simplify it to 3 taps or fewer!',
      'During our Silent Rule test with 3 classmates, testers paused for more than 5 seconds at the clip/button—how can we make Version 1.1 self-explanatory without speaking?'
    ],
    competencies: ['ctps-01', 'ent-01', 'sdl-01', 'ec-01'],
    stretchCompetencies: ['ctps-02', 'ent-02'],
    sessions: [
      {
        sessionNumber: 9,
        week: 7,
        title: 'Phase 3, Activity 1 (Part 1): Building a Quick, Cheap 1:1 Physical Model or 4-Screen Paper App Map',
        durationMin: 90,
        learningGoal: 'Construct a rough, cheap Version 1.0 test model (Option A: 1:1 scale cardboard/foam/tape/clay physical model OR Option B: Home, Action, Confirmation, and Summary Screen paper cards).',
        activities: [
          'Option A (Physical Product): Gather cardboard, plastic board, foam, strong tape, hot glue, or clay and build a real-size (1:1 scale) model—focus on real size, how it feels to hold, and weight rather than making it look pretty.',
          'Option B (Digital Solution — App/Website): Draw a paper map of the Home Screen, Action Screen, Confirmation Screen, and Summary Screen, then draw each screen on its own paper card with buttons and text boxes.'
        ],
        learnerChoices: {
          question: 'Which Activity 1 prototype are you building today?',
          options: [
            { id: 'build-opt-a', label: 'Option A: 1:1 Scale Physical Model (Cardboard/Foam/Tape/Clay)', description: 'Focus on real size, how it feels to hold, and packing it with real items.' },
            { id: 'build-opt-b', label: 'Option B: 4-Screen Paper Card App Prototype', description: 'Home, Action, Confirmation, and Summary Screen cards with finger-tap flow.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload a photo of your Version 1.0 1:1 physical model or your 4 paper screen cards.',
          targetCompetencies: ['ctps-01', 'sdl-01']
        },
        reflectionPrompt: 'What did you notice immediately once you built your model at real 1:1 size or laid out your paper screen cards on the table?',
        teacherTips: 'Remind students: do not spend time coloring or decorating Version 1.0! Focus on size, shape, and how easy it is to use.'
      },
      {
        sessionNumber: 10,
        week: 7,
        title: 'Phase 3, Activity 1 (Part 2): Red-Marker Weak-Spot Audit (Physical) & The 3-Tap Rule Check (Digital)',
        durationMin: 45,
        learningGoal: 'Test your Version 1.0 model yourself with real items or finger taps—circling weak/tight/loose spots with a red marker (Option A) or cutting extra steps so the main goal takes <= 3 taps (Option B).',
        activities: [
          'Option A (Physical): Hold it, wear it, open it, or pack it with the real items it is supposed to hold; use a red marker to circle weak spots, crooked parts, or areas that are too tight or too loose directly on the model.',
          'Option B (Digital): Place the paper cards on a table as a user "taps" them with their finger; if it takes more than 3 taps to reach the main goal, remove extra steps to make it faster.'
        ],
        learnerChoices: {
          question: 'What did your self-test reveal on your Version 1.0 model?',
          options: [
            { id: 'self-red-marker', label: 'Red-Marker Circles on Physical Weak/Tight/Loose Spots', description: 'Marked exact areas on the 1:1 model that bent, felt crooked, or were too tight.' },
            { id: 'self-3-tap-trim', label: 'Trimmed Paper App Flow to <= 3 Taps', description: 'Removed extra buttons/screens so users reach the main goal in 3 taps or fewer.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload a photo of your physical model showing the red-marker circles OR your paper screen cards showing the <= 3-tap path.',
          targetCompetencies: ['ctps-01', 'ent-01']
        },
        reflectionPrompt: 'Why does circling weak spots directly on your model with a bright red marker help you improve faster than trying to hide flaws?',
        teacherTips: 'Hand every physical-track team a red marker and require at least 3 honest red circles directly on their cardboard/foam model.'
      },
      {
        sessionNumber: 11,
        week: 8,
        title: 'Phase 3, Activity 2 (Part 1): Testing with 3 Classmates Under "The Silent Rule"',
        durationMin: 60,
        learningGoal: 'Give your rough model to 3 classmates who have never seen it, give them one simple task, obey The Silent Rule (stay completely quiet), and write down every hesitation, slip, or wrong tap.',
        activities: [
          'Give your model to 3 classmates who have never seen your project before.',
          'Give them one simple task (e.g., "Show me how you would clip this to your bag," or "Find the practice log and save today’s notes").',
          'Follow The Silent Rule: Stay completely quiet during the test—do not explain how it works, do not help them, and do not say sorry.',
          'Write down: (1) Where did the tester stop and think for more than 5 seconds? (2) Where did the physical model bend, slip, or get stuck? (3) Which app button did they press by mistake?'
        ],
        learnerChoices: {
          question: 'Which problem showed up most clearly when you stayed completely quiet under The Silent Rule?',
          options: [
            { id: 'silent-5sec', label: 'Tester Stopped & Thought for > 5 Seconds', description: 'The tester was unsure where to start or how to open/tap the model without hints.' },
            { id: 'silent-slip-button', label: 'Physical Part Bent/Slipped OR Wrong App Button Tapped', description: 'A strap/flap got stuck or a tester tapped the wrong paper card button by mistake.' }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Submit your Silent Rule observation sheet from all 3 classmates listing >5-second pauses, bends/slips/stuck parts, and mistaken button taps.',
          targetCompetencies: ['ctps-01', 'ec-01']
        },
        reflectionPrompt: 'How hard was it to stay completely quiet, not help, and not say sorry while watching a classmate test your model?',
        teacherTips: 'Enforce The Silent Rule strictly! If a builder speaks or points during the test, have them restart with a fresh classmate.'
      },
      {
        sessionNumber: 12,
        week: 8,
        title: 'Phase 3, Activity 2 (Part 2): Building Version 1.1 (Fixing at Least Two Things)',
        durationMin: 60,
        learningGoal: 'Build Version 1.1 by changing and fixing at least two things on your model based on the mistakes you saw during the 3-classmate Silent Rule test.',
        activities: [
          'Pick the top 2+ mistakes you saw during the Activity 2 Silent Rule user test.',
          'Build Version 1.1: Change and fix at least two things on your physical model or paper app cards.',
          'Re-test Version 1.1 to confirm the >5-second hesitation, bend/slip, or wrong button tap is fixed.'
        ],
        learnerChoices: {
          question: 'What two changes did you build into Version 1.1?',
          options: [
            { id: 'v11-physical-fixes', label: 'Stronger Joints/Straps & Clearer Physical Opening', description: 'Reinforced weak red-marker spots and made the clip/pocket intuitive to use.' },
            { id: 'v11-digital-fixes', label: 'Clearer Button Labels & Faster 3-Tap Screen Flow', description: 'Fixed confusing buttons and removed extra steps on the paper app cards.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload before-and-after photos showing Version 1.0 vs. Version 1.1 and label the at least 2 things you fixed.',
          targetCompetencies: ['ctps-01', 'ent-01']
        },
        reflectionPrompt: 'How much easier was Version 1.1 for a classmate to use after you fixed those two mistakes?',
        teacherTips: 'Make sure students keep Version 1.0 notes/photos so they can explain the Version 1.1 improvements in Part 2 (0:45–1:45) of their 3-Minute Sales Pitch!'
      }
    ]
  },
  {
    id: 'test',
    title: 'Test and improve',
    strap: 'Phase 4: Calculating Costs and Prices — Unit Cost (COGS), Selling Price & Break-Even Point in THB (Weeks 9–10)',
    weeks: [9, 10],
    goal: 'Calculate the exact Unit Cost (Unit Floor Cost / COGS) for 1 unit in Thai Baht (THB), set your Selling Price using a profit margin goal (50%–65% physical, 70%–85% digital), list One-Time Startup Costs, and calculate your Break-Even Units.',
    tasks: [
      'Activity 1, Steps 1–4 (Cost to Make One Item — COGS): List every material, part, or online service needed to make 1 unit; divide large-pack prices to find the cost for 1 unit (Physical Example: 100 THB roll of strap makes 5 bags = 20 THB per bag; Digital Example: 350 THB monthly website fee shared by 50 users = 7 THB per user); add extra small costs (bags, labels, payment fees, or stickers); add everything together to get your Unit Cost (Unit Floor Cost).',
      'Activity 2, Step 1 (Setting the Selling Price): Set your Selling Price (Retail Price) using a profit goal (margin)—Physical products aim for 50% to 65% profit margin; Digital services aim for 70% to 85% profit margin—using SellingPrice = UnitCost / (1 - DesiredProfitMargin), writing the margin as a decimal like 0.50 for 50%.',
      'Activity 2, Steps 2–4 (One-Time Startup Costs & Break-Even Number): List your One-Time Startup Costs (tools you only buy once, like scissors, glue guns, website domain names, or software) and calculate Break-EvenUnits = One-TimeStartupCosts / (SellingPrice - UnitCost).',
      'Activity 2, Step 5: Write down your final 4 numbers clearly in Thai Baht (THB): Unit Cost, Selling Price, Profit per Unit (Margin), and Break-Even Units.'
    ],
    evidence: [
      'Activity 1 Unit Cost (COGS / Unit Floor Cost) Worksheet in Thai Baht (THB) showing pack-division math and extra small costs (bags, labels, payment fees, stickers)',
      'Activity 2 Financial Worksheet showing Selling Price formula, One-Time Startup Costs, Break-Even Units formula, and the Final 4 Numbers clearly written down'
    ],
    aiPromptStarters: [
      'Check my pack-division math for Activity 1: If a 100 THB roll of strap makes 5 bags and labels/stickers cost 5 THB per bag, what is my total Unit Cost?',
      'Walk me through the Selling Price formula SellingPrice = UnitCost / (1 - DesiredProfitMargin) if my Unit Cost is 45 THB and my desired profit margin is 60% (0.60).',
      'If my One-Time Startup Costs (scissors, glue gun, tools) are 1,200 THB, my Selling Price is 120 THB, and my Unit Cost is 45 THB, how many Break-Even Units must I sell?'
    ],
    competencies: ['ctps-01', 'ctps-02', 'ent-01', 'sdl-02'],
    stretchCompetencies: ['ent-02'],
    sessions: [
      {
        sessionNumber: 13,
        week: 9,
        title: 'Phase 4, Activity 1 (45 Min): Cost to Make One Item (COGS / Unit Floor Cost in THB)',
        durationMin: 45,
        learningGoal: 'Calculate the exact cost in Thai Baht (THB) to build or run one single unit of your product by dividing large-pack prices and adding small costs (bags, labels, payment fees, stickers).',
        activities: [
          'Step 1: List every material, part, or online service needed to make 1 unit.',
          'Step 2: Divide large-pack prices to find the cost for 1 unit (Physical Example: A 100 THB roll of strap makes 5 bags = 20 THB per bag; Digital Example: A 350 THB monthly website fee shared by 50 users = 7 THB per user).',
          'Step 3: Add extra small costs: bags, labels, payment fees, or stickers.',
          'Step 4: Add everything together to find your Unit Cost (Unit Floor Cost).'
        ],
        learnerChoices: {
          question: 'Which Activity 1 COGS calculation method applies to your product?',
          options: [
            { id: 'cogs-physical', label: 'Physical Pack Division (e.g., 100 THB roll / 5 bags = 20 THB)', description: 'Divide bulk material packs by units made, then add bags, labels, and stickers.' },
            { id: 'cogs-digital', label: 'Digital Shared Monthly Fee (e.g., 350 THB fee / 50 users = 7 THB)', description: 'Divide monthly website/app fee by active users, then add payment fees.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your itemized Activity 1 COGS table in Thai Baht (THB) showing pack division, extra small costs, and total Unit Cost (Unit Floor Cost).',
          targetCompetencies: ['ctps-01', 'ent-01']
        },
        reflectionPrompt: 'Why do many new entrepreneurs lose money when they forget to include extra small costs like bags, labels, payment fees, or stickers in their Unit Cost?',
        teacherTips: 'Check that every student divides bulk pack prices by the number of units the pack makes instead of putting the whole pack price as the cost of 1 unit.'
      },
      {
        sessionNumber: 14,
        week: 9,
        title: 'Phase 4, Activity 2 (Part 1 — 45 Min): Setting the Selling Price Using Profit Margin Formulas',
        durationMin: 45,
        learningGoal: 'Set your Selling Price (Retail Price) in THB using SellingPrice = UnitCost / (1 - DesiredProfitMargin), aiming for 50%–65% on physical products or 70%–85% on digital services.',
        activities: [
          'Choose your target profit margin: Physical products aim for 50% to 65% profit margin (0.50 to 0.65); Digital services aim for 70% to 85% profit margin (0.70 to 0.85, because building apps takes a lot of unpaid design time at the start).',
          'Use the formula: SellingPrice = UnitCost / (1 - DesiredProfitMargin).',
          'Calculate Profit per Unit (Margin in THB) = SellingPrice - UnitCost.'
        ],
        learnerChoices: {
          question: 'Which target profit margin range did you use to set your Selling Price?',
          options: [
            { id: 'margin-phys-50-65', label: 'Physical Product Margin: 50% to 65% (0.50–0.65)', description: 'Covers material costs and leaves healthy profit per unit to pay back tools.' },
            { id: 'margin-dig-70-85', label: 'Digital Service Margin: 70% to 85% (0.70–0.85)', description: 'Rewards the unpaid upfront app design time and covers monthly hosting.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Upload your Selling Price calculation showing UnitCost, DesiredProfitMargin as a decimal, SellingPrice in THB, and Profit per Unit.',
          targetCompetencies: ['ctps-02', 'ent-01']
        },
        reflectionPrompt: 'Why does SellingPrice = UnitCost / (1 - 0.50) double your Unit Cost for a 50% profit margin?',
        teacherTips: 'Remind students to write the margin as a decimal (like 0.50 for 50% or 0.60 for 60%) before subtracting from 1!'
      },
      {
        sessionNumber: 15,
        week: 10,
        title: 'Phase 4, Activity 2 (Part 2): One-Time Startup Costs, Break-Even Units & Your Final 4 Numbers',
        durationMin: 45,
        learningGoal: 'List your One-Time Startup Costs, calculate Break-EvenUnits = One-TimeStartupCosts / (SellingPrice - UnitCost), and write down your Final 4 Numbers clearly.',
        activities: [
          'Step 2: List your One-Time Startup Costs (tools you only buy once, like scissors, glue guns, website domain names, or software).',
          'Step 3 & 4: Calculate your Break-Even Number (how many units you must sell to pay back your startup tools): Break-EvenUnits = One-TimeStartupCosts / (SellingPrice - UnitCost).',
          'Step 5: Write down your final 4 numbers clearly in Thai Baht (THB): (1) Unit Cost, (2) Selling Price, (3) Profit per Unit (Margin), and (4) Break-Even Units.'
        ],
        learnerChoices: {
          question: 'How many Break-Even Units does your team need to sell to pay back your One-Time Startup Costs?',
          options: [
            { id: 'be-fast', label: '1 to 20 Units (Fast Tool Payback)', description: 'Low one-time tool costs and strong profit per unit allow break-even within our first 25 customers.' },
            { id: 'be-scale', label: '21+ Units (Higher Volume Payback)', description: 'Higher upfront tool/domain costs require selling steady volume to break even.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Final 4 Numbers clearly written in THB: Unit Cost, Selling Price, Profit per Unit (Margin), and Break-Even Units.',
          targetCompetencies: ['ctps-02', 'sdl-02']
        },
        reflectionPrompt: 'Can your team reach your Break-Even Number within your first 25 paying customers, or do you need to lower your One-Time Startup Costs?',
        teacherTips: 'Verify that every team has their Final 4 Numbers written in bold on a card—they will need these exact 4 numbers for Part 3 (1:45–2:30) of the 3-Minute Sales Pitch!'
      }
    ]
  },
  {
    id: 'share',
    title: 'Showcase or present',
    strap: 'Phase 5: Selling and Presenting Your Product — First 25 Customers, Catchphrase & The 3-Minute Sales Pitch (Weeks 11–12)',
    weeks: [11, 12],
    goal: 'Make a clear plan to get your first 25 paying customers or active users, write your 1-sentence Catchphrase (Value Proposition), and deliver a timed 4-part 3-Minute Sales Pitch followed by 20-second Q&A answers.',
    tasks: [
      'Activity 1, Steps 1–2 (Finding Customers and Launching — 45 Min): Write down the exact places where your target users spend time together (school notice boards, lunch clubs, online chat groups, after-school events) and choose one main place to sell and one way to catch their attention (Physical: pre-order table at a school event with printed cards; Digital: short video showing how the app works posted in a group chat with a 1-click link).',
      'Activity 1, Step 3 (Catchphrase / Value Proposition): Write a 1-sentence Catchphrase that explains why your product is better: "Unlike [Old Way of Doing Things], [Your Product Name] gives you [Main Benefit] without [Main Problem]."',
      'Activity 2, Step 1 (The 3-Minute Sales Pitch — 4 Timed Parts): Write your presentation in 4 timed parts: Part 1 (0:00–0:45) The Problem (main problem from your diary + a real quote from someone interviewed in Phase 1); Part 2 (0:45–1:45) The Solution (show your model/screens + explain improvements made in Version 1.1 after user testing); Part 3 (1:45–2:30) The Money / Business Model (show your numbers in Thai Baht: Unit Cost, Selling Price, Profit, and Break-Even Units); Part 4 (2:30–3:00) The Next Step (say exactly what you need to start making the real product, e.g. "We need 1,500 THB for materials" or "We need 10 testers to try the app").',
      'Activity 2, Steps 2–3 (Timer Practice & 20-Second Q&A): Practice with a timer—if you do not reach Part 2 by 45 seconds, cut out extra stories from Part 1; have a friend ask two hard questions about how strong your product is or why it costs that much, and practice answering each question in under 20 seconds using facts from your user tests and cost sheet.'
    ],
    evidence: [
      'Activity 1 First-25 Customers Marketing Plan Sheet & 1-Sentence "Unlike..." Catchphrase (Value Proposition)',
      'Activity 2 4-Part Timed 3-Minute Sales Pitch Script (0:00–0:45, 0:45–1:45, 1:45–2:30, 2:30–3:00)',
      'Stopwatch Rehearsal & Under-20-Second Q&A Fact Defense Log'
    ],
    aiPromptStarters: [
      'Check our 1-sentence Catchphrase: Does it follow the exact template "Unlike [Old Way of Doing Things], [Your Product Name] gives you [Main Benefit] without [Main Problem]"?',
      'Time our Part 1 (0:00–0:45) script: Help us trim extra stories so we reach Part 2 (The Solution) before 45 seconds!',
      'Ask us two hard questions about how strong our product is or why it costs that much so we can practice answering in under 20 seconds using facts from our user tests and THB cost sheet.'
    ],
    competencies: ['ec-01', 'ec-02', 'ent-01', 'lc-01', 'ctps-01'],
    stretchCompetencies: ['ent-02'],
    sessions: [
      {
        sessionNumber: 16,
        week: 11,
        title: 'Phase 5, Activity 1 (45 Min): Finding Your First 25 Customers & Writing Your 1-Sentence Catchphrase',
        durationMin: 45,
        learningGoal: 'Make a clear plan to get your first 25 paying customers or active users and write your 1-sentence Catchphrase (Value Proposition).',
        activities: [
          'Step 1: Write down the exact places where your target users spend time together (school notice boards, lunch clubs, online chat groups, after-school events).',
          'Step 2: Choose one main place to sell and one way to catch their attention (Physical: pre-order table at a school event with printed cards showing how the product works; Digital: short video showing how the app works posted in a group chat with a 1-click link to try it).',
          'Step 3: Write a 1-sentence Catchphrase (Value Proposition): "Unlike [Old Way of Doing Things], [Your Product Name] gives you [Main Benefit] without [Main Problem]."'
        ],
        learnerChoices: {
          question: 'Which launch method will you use to get your first 25 paying customers or active users?',
          options: [
            { id: 'launch-physical-table', label: 'Physical: Pre-Order Table at a School Event + Printed Cards', description: 'Show the working 1:1 model live with printed cards explaining how it works.' },
            { id: 'launch-digital-video', label: 'Digital: Short Demo Video in Group Chat + 1-Click Link', description: 'Post a short video showing the app screens in a group chat with a 1-click try link.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your First-25 Customers plan (exact places, 1 main place to sell, 1 attention-catcher) and your 1-sentence "Unlike..." Catchphrase.',
          targetCompetencies: ['ec-01', 'ent-01']
        },
        reflectionPrompt: 'Why is picking ONE main place where your users already spend time together more effective for getting your first 25 customers than trying to advertise everywhere?',
        teacherTips: 'Check that every team’s Catchphrase uses the exact "Unlike [Old Way], [Product Name] gives you [Main Benefit] without [Main Problem]" structure.'
      },
      {
        sessionNumber: 17,
        week: 11,
        title: 'Phase 5, Activity 2 (Part 1 — 60 Min): Writing & Timing the 4-Part 3-Minute Sales Pitch',
        durationMin: 60,
        learningGoal: 'Write and time your 3-Minute Sales Pitch across the 4 timed parts (0:00–0:45 Problem, 0:45–1:45 Solution v1.1, 1:45–2:30 Money in THB, 2:30–3:00 Next Step) and cut extra stories if Part 1 runs past 45 seconds.',
        activities: [
          'Part 1 (0:00–0:45) The Problem: Explain the main problem from your diary and read a real quote from someone you interviewed in Phase 1.',
          'Part 2 (0:45–1:45) The Solution: Show your model working in real life or click through your app screens, and explain the improvements made in Version 1.1 after user testing.',
          'Part 3 (1:45–2:30) The Money (Business Model): Show your numbers in Thai Baht (THB): Unit Cost, Selling Price, Profit, and how many you need to sell to break even.',
          'Part 4 (2:30–3:00) The Next Step: Say exactly what you need to start making the real product (e.g., "We need 1,500 THB for materials" or "We need 10 testers to try the app").',
          'Practice with a stopwatch: If you do not reach Part 2 by 45 seconds, cut out extra stories from Part 1.'
        ],
        learnerChoices: {
          question: 'What is your specific "Part 4 (2:30–3:00) The Next Step" ask at the end of your pitch?',
          options: [
            { id: 'ask-materials-thb', label: 'Materials Seed Ask (e.g., "We need 1,500 THB for materials")', description: 'Request exact THB startup capital to buy materials and build the first real batch.' },
            { id: 'ask-testers-app', label: 'Active Testers Ask (e.g., "We need 10 testers to try the app")', description: 'Recruit a committed group of classmates or users to test the live product.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your 4-part timed 3-Minute Sales Pitch script showing exact stopwatch checkpoints at 0:45, 1:45, 2:30, and 3:00.',
          targetCompetencies: ['ec-01', 'ec-02', 'ent-01']
        },
        reflectionPrompt: 'When you practiced with a stopwatch, did you reach Part 2 by 45 seconds, or what extra stories did you have to cut from Part 1?',
        teacherTips: 'Use a real stopwatch in class—ring a bell at 0:45, 1:45, 2:30, and 3:00 so students feel the exact rhythm of the 4 parts.'
      },
      {
        sessionNumber: 18,
        week: 12,
        title: 'Phase 5, Activity 2 (Part 2): The 3-Minute Sales Pitch Showcase & Under-20-Second Q&A Defense',
        durationMin: 60,
        learningGoal: 'Deliver your 3-Minute Sales Pitch showing your working Version 1.1 model and answer two hard questions about product strength or cost in under 20 seconds each using facts from your user tests and THB cost sheet.',
        activities: [
          'Practice Questions (Q&A) with a friend: Have a friend ask two hard questions about how strong your product is or why it costs that much.',
          'Practice answering each question in under 20 seconds using facts from your Phase 3 user tests and Phase 4 THB cost sheet.',
          'Deliver your final 3-Minute Sales Pitch and live Q&A defense!'
        ],
        learnerChoices: {
          question: 'Which hard Q&A question is your team ready to answer in under 20 seconds with hard facts?',
          options: [
            { id: 'qa-strength', label: '"How strong is your product and how do you know it won’t break?"', description: 'Answer in <20s citing Version 1.1 fixes and Silent Rule classmate tests.' },
            { id: 'qa-cost-price', label: '"Why does your product cost that much in Thai Baht?"', description: 'Answer in <20s citing exact COGS Unit Cost, margin %, and Break-Even Units.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Submit your final 3-Minute Sales Pitch presentation slides/poster and your written under-20-second answers to the two hard Q&A questions.',
          targetCompetencies: ['ec-01', 'ec-02', 'ent-01', 'lc-01']
        },
        reflectionPrompt: 'How did having real facts from your Phase 1 interviews, Phase 3 Silent Rule tests, and Phase 4 THB cost sheet make answering hard Q&A questions in under 20 seconds easy?',
        teacherTips: 'Time every Q&A answer with a 20-second countdown so students give crisp, fact-backed answers instead of long guesses.'
      }
    ]
  }
];

export const ENTREPRENEURSHIP_PROGRAM: PblProgram = {
  id: 'entrepreneurship-product-creation-2026',
  title: 'Entrepreneurship: Creating a Product',
  subtitle: 'A 5-Phase Venture Studio: Problem Diary (Friction Log), Customer Interviews, Crazy 8s Brainstorming, 1:1 & 3-Tap Prototyping under The Silent Rule, Thai Baht Unit Economics, and the 3-Minute Sales Pitch.',
  status: 'provisional_prototype',
  theme: 'Entrepreneurship, Product Creation & Thai Baht Unit Economics',
  drivingQuestion: 'How can we find a real everyday problem that people care about, build and test a quick Version 1.1 physical or digital model using The Silent Rule, calculate exact Thai Baht costs and break-even units, and pitch our product to get our first 25 customers?',
  realProblem: {
    type: 'both',
    summary: 'Students and everyday users deal with frustrating problems—messy headphone wires, lost locker keys, heavy bags, crushed music sheets, or messy study notes—while aspiring young creators often build products nobody wants because they skip real user interviews, explain their prototype during testing instead of staying silent, or guess their prices without calculating unit costs and break-even numbers.',
    peopleImpact: 'Solves real everyday annoyances verified by 5 customer interviews (where at least 3 out of 5 people confirm the problem matters) and tested with 3 classmates under The Silent Rule.',
    environmentalImpact: 'Encourages free solutions or ideas made from trash and recycled materials (Crazy 8s Boxes 3–4) and cheap 1:1 test models before spending money on full production.'
  },
  targetAgeRange: 'Ages 9–17 (Primary through Upper Secondary: 9–11, 12–14, 15–17)',
  durationWeeks: 12,
  totalSessions: 18,
  materialsAndKit: {
    microcontrollers: [
      'Small notebook or phone notes app (for Phase 1 Activity 1 Problem Diary)',
      'Calculator and spreadsheet / financial worksheet (for Phase 4 THB Unit Cost, Selling Price & Break-Even math)'
    ],
    sensorsAndActuators: [
      'Timer / Stopwatch (for 8-minute Crazy 8s brainstorming, 4-part 3-Minute Sales Pitch, and <20s Q&A)',
      'Red marker (for circling weak spots, crooked parts, or tight/loose areas on the 1:1 physical model)'
    ],
    fabricationMaterials: [
      'Option A (Physical Product): Cardboard, plastic board, foam, strong tape, hot glue, clay, and recycled/trash materials',
      'Option B (Digital Solution — App/Website): Blank A4 paper, black markers, and separate paper cards for Home, Action, Confirmation, and Summary screens',
      'Poster board, marketing plan sheets, and printed pre-order cards for the Phase 5 launch'
    ],
    softwareAndTools: [
      'PBL Studio Venture Simulator (Problem Diary, Crazy 8s Scorer, THB Unit Cost & Break-Even Calculator, and 3-Minute Pitch Timer)',
      'Spreadsheet or notebook with local Thai Baht (THB) material prices',
      'Slides or poster board for the 4-part 3-Minute Sales Pitch'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Hot Glue & Cutting Safety: Supervise hot glue guns and scissors/cutters when teams build Option A 1:1 physical models in Phase 3.',
      'Safeguarding & Privacy (Activity 2 Interviews): Under-13 learners must use written notebooks, tap-to-choose cards, or teacher-run scribing (never voice recording or speech-to-text). Any audio recording by older learners requires prior school consent and must never be uploaded or stored on the platform.',
      'Low-Cost Prototyping First: Ensure teams build Phase 3 Activity 1 models with cheap materials (cardboard, foam, paper cards) before spending any money.'
    ],
    pedagogicalScaffolding: [
      'No Future Questions in Activity 2: Stop students from asking "Would you buy something that does X?"—insist on the 3 past-experience questions and the 3-out-of-5 validation rule.',
      'No Product Name in Activity 3: Check every team’s Who-What-Why sentence and make them delete the product name if they mentioned their product idea.',
      'Strict Silent Rule in Phase 3 Activity 2: Builders must stay completely quiet—no explaining, no helping, and no saying sorry—while 3 classmates test the model and before building Version 1.1.'
    ],
    aiEthicsRules: [
      'Students may use AI to practice interview questions, check THB break-even math, or rehearse 20-second Q&A questions, but all 5 customer interviews and 3 classmate Silent Rule tests must be done with real people.',
      'Log every AI consultation in the project portfolio with what was asked and what was kept.'
    ],
    differentiationNotes: [
      'Ages 9–11 (Foundation Track): Guided 5-problem diary, 5 classmate interviews with notebook notes, cardboard 1:1 model with red-marker circles, simple THB pack division, and 3-minute team pitch.',
      'Ages 12–14 (Middle School Track — e.g., Brass Musicians Example): Full Problem Diary, verbatim customer quotes, Who-What-Why sentence, 8-minute Crazy 8s, 1–5 Scoring Chart, Silent Rule v1.1 iteration, and full THB Break-Even math.',
      'Ages 15–17 (Upper Secondary Track): Full physical or <=3-tap digital prototype, complete THB unit economics and digital twin market simulation, first-25 customer launch campaign, and rapid <20s Q&A defense.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-diary-interviews',
      metric: 'Phase 1 Problem Diary & 3-out-of-5 User Validation',
      target: 'At least 5 problems logged in the Problem Diary; 5 real users interviewed about past experiences with >= 3/5 confirming the problem matters; 1-sentence Who-What-Why Problem Statement free of product names',
      verificationMethod: 'Problem Diary review, 5 interview quote sheets, and Step 4 Problem Statement check'
    },
    {
      id: 'metric-crazy8-scoring',
      metric: 'Phase 2 Crazy 8s & 1–5 Scoring Chart',
      target: 'All 8 boxes drawn in 8 minutes following Box 1–8 rules; top 2 ideas scored 1–5 on Feasibility, Desirability, and Durability',
      verificationMethod: '8-box A4 sheet inspection and completed 1–5 Scoring Chart'
    },
    {
      id: 'metric-silent-v11',
      metric: 'Phase 3 Quick Model, Silent Rule & Version 1.1',
      target: '1:1 physical model with red-marker circles OR 4-screen paper app (<= 3 taps) tested silently with 3 classmates; Version 1.1 fixes >= 2 observed mistakes',
      verificationMethod: 'Red-marker / 3-tap audit, Silent Rule observation notes, and Version 1.1 before/after check'
    },
    {
      id: 'metric-thb-pitch',
      metric: 'Phase 4 THB Final 4 Numbers & Phase 5 3-Minute Sales Pitch',
      target: 'Verified Unit Cost, Selling Price, Profit per Unit, and Break-Even Units in THB + First-25 customer plan, "Unlike..." Catchphrase, 4-part 3-minute pitch (Part 2 reached by 0:45), and <20s Q&A answers',
      verificationMethod: 'Phase 4 financial worksheet and timed 3-minute pitch + 20-second Q&A rubric'
    }
  ],
  assumptions: [
    {
      id: 'asmp-cheap-materials',
      domain: 'Phase 3 Cheap Prototyping Materials',
      assumption: 'Classroom provides cardboard, plastic board, foam, strong tape, hot glue, clay, A4 paper, paper cards, black markers, and red markers.',
      ownerVerificationNeeded: 'Confirm classroom supply of cardboard, foam, hot glue, and paper cards with Don.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    },
    {
      id: 'asmp-thb-pricing',
      domain: 'Phase 4 Local Thai Baht (THB) Price List',
      assumption: 'Unit Cost (COGS), Selling Price, and One-Time Startup Costs are calculated in Thai Baht (THB) using local material and online service prices.',
      ownerVerificationNeeded: 'Confirm local THB reference price sheet for classroom student teams.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    }
  ],
  phases: ENTREPRENEURSHIP_PROGRAM_PHASES
};
