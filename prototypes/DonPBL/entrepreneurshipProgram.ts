/**
 * Don's PBL Program: Entrepreneurship: Product Creation
 * Branch: DonPBL
 * Location: prototypes/DonPBL/entrepreneurshipProgram.ts
 * 
 * Sourced from the official "Entrepreneurship: Product Creation" Curriculum.
 * Fully structured to match the standard WeLearn PblProgram format:
 * - 7 Design Thinking Phases (Explore -> Empathise -> Define -> Ideate -> Prototype -> Test -> Share)
 * - 24 Structured 50-Minute Sessions across a 12-Week Term (120 contact hours)
 * - Option for Building in a Simulation (Digital Twin Market Simulator / Virtual E-Commerce Sandbox)
 * - Gamification Framework (Startup XP, Level Progression, Badges, Angel Pitch Simulator)
 * - Measurable Impact Criteria, Bill of Materials, Unit Economics (COGS & Retail Price formulas)
 */

import { PblProgram, ProgramPhase } from './programData';

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

export const ENTREPRENEURSHIP_LEVELS: GamificationLevel[] = [
  { level: 1, title: 'Friction Scout', minXp: 0, privilegeUnlocked: 'Unlocked Friction Logger & Empathy Interview Canvas' },
  { level: 2, title: 'Idea Catalyst', minXp: 500, privilegeUnlocked: 'Unlocked Crazy 8s Rapid Brainstorm & Track Selection Matrix' },
  { level: 3, title: 'Rapid Prototyper', minXp: 1200, privilegeUnlocked: 'Unlocked Virtual Sandbox / Physical Rapid Build Lab' },
  { level: 4, title: 'Silent Lab Auditor', minXp: 2000, privilegeUnlocked: 'Unlocked Silent Usability Lab & Friction Diagnostics' },
  { level: 5, title: 'Chief Financial Architect', minXp: 3000, privilegeUnlocked: 'Unlocked COGS Ledger, Margin Calculator & Break-Even Simulator' },
  { level: 6, title: 'Go-to-Market Strategist', minXp: 4200, privilegeUnlocked: 'Unlocked 25-Adopter Channel Funnel & Pitch Deck Builder' },
  { level: 7, title: 'Venture Ready Founder', minXp: 5500, privilegeUnlocked: 'Unlocked 3-Minute Angel Pitch Arena & Real-world Seed Deployment' }
];

export const ENTREPRENEURSHIP_BADGES: StartupBadge[] = [
  {
    id: 'badge-friction-hunter',
    name: 'Friction Hunter',
    icon: '🔍',
    xpAward: 350,
    unlockedAtPhase: 'explore',
    condition: 'Log at least 5 distinct everyday annoyances with Context, Workaround, and Emotional Impact.',
    description: 'Mastered the art of noticing friction where others see normal life.'
  },
  {
    id: 'badge-unbiased-listener',
    name: 'Unbiased Listener',
    icon: '🎙️',
    xpAward: 400,
    unlockedAtPhase: 'empathise',
    condition: 'Conduct 5 customer empathy interviews using the past-behavior framework without leading questions.',
    description: 'Refrained from pitching; captured raw quotes and honest user pain points.'
  },
  {
    id: 'badge-crazy-8-sprinter',
    name: 'Crazy 8s Speed Sprinter',
    icon: '⚡',
    xpAward: 450,
    unlockedAtPhase: 'ideate',
    condition: 'Sketch 8 diverse variations in exactly 8 minutes across conventional, scrap, modular, and radical constraints.',
    description: 'Pushed through mental resistance to discover unorthodox solution mechanisms.'
  },
  {
    id: 'badge-digital-twin-architect',
    name: 'Digital Twin Architect',
    icon: '💻',
    xpAward: 500,
    unlockedAtPhase: 'prototype',
    condition: 'Run a 3D CAD or interactive web simulation tracking 50+ virtual transactions under stress.',
    description: 'Validated market dynamics and UI workflows before spending real capital.'
  },
  {
    id: 'badge-silent-observer',
    name: 'The Silent Auditor',
    icon: '🤫',
    xpAward: 500,
    unlockedAtPhase: 'test',
    condition: 'Complete 3 peer usability trials following the Silent Rule: zero hints, zero apologies, observing all hesitations.',
    description: 'Resisted the urge to defend the prototype, isolating raw product friction.'
  },
  {
    id: 'badge-unit-economics-master',
    name: 'Unit Economics Prodigy',
    icon: '📊',
    xpAward: 600,
    unlockedAtPhase: 'test',
    condition: 'Calculate exact Unit Floor Cost, Retail Price (50-85% gross margin), and Break-Even Unit Volume in Thai Baht.',
    description: 'Understands every satang in COGS and knows exact volume to reach profitability.'
  },
  {
    id: 'badge-pitch-gladiator',
    name: '3-Minute Pitch Gladiator',
    icon: '🏆',
    xpAward: 800,
    unlockedAtPhase: 'share',
    condition: 'Deliver a strict 4-block 3-minute pitch under a live timer and answer tough mock Q&A in under 20 seconds.',
    description: 'Secured customer validation or simulated seed funding with unwavering clarity.'
  }
];

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

export const ENTREPRENEURSHIP_SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'preset-brass-pocket',
    name: 'Brass Instrument Utility Pocket (Physical Build)',
    track: 'physical',
    category: 'Music & Ergonomics',
    description: 'Modular padded utility strap pocket protecting valve oils and sheet music without denting brass instruments.',
    starterCashTHB: 2500,
    fixedStartupExpenseTHB: 1200, // cutting tools, heavy duty eyelets, specialized fabric punch
    unitFloorCostTHB: 45, // heavy strap webbing, foam liner, zipper, snap buckle
    suggestedRetailPriceTHB: 120, // 62.5% gross margin
    targetGrossMarginPct: 62.5,
    simulatedMarketDemandWeekly: 18,
    commonFrictions: [
      'Standard instrument cases lack padded accessory slots',
      'Valve oil bottles puncture or leak onto expensive sheet music',
      'Cases swing awkwardly on public transport'
    ]
  },
  {
    id: 'preset-practice-tracker',
    name: 'Solo Musician Practice Logger (Digital Web App)',
    track: 'digital',
    category: 'Productivity & Audio Tech',
    description: '3-tap micro-web log that captures practice tempo, metronome bpm, and audio snippet without tedious menus.',
    starterCashTHB: 2000,
    fixedStartupExpenseTHB: 850, // domain registration, SSL, icon assets
    unitFloorCostTHB: 7, // 350 THB monthly cloud db tier / 50 active users
    suggestedRetailPriceTHB: 35, // 80% gross margin (subscription/pass)
    targetGrossMarginPct: 80,
    simulatedMarketDemandWeekly: 45,
    commonFrictions: [
      'Complex practice apps require 8+ taps to start recording',
      'Forgetting which measure in the etude had intonation errors',
      'Battery drain during long orchestra rehearsal sessions'
    ]
  },
  {
    id: 'preset-eco-tote',
    name: 'Modular Zero-Waste Lunch Carrier (Physical Build)',
    track: 'physical',
    category: 'Campus Sustainability',
    description: 'Thermal-insulated water-resistant collapsible tote built from upcycled banner tarpaulins.',
    starterCashTHB: 3000,
    fixedStartupExpenseTHB: 1500,
    unitFloorCostTHB: 65,
    suggestedRetailPriceTHB: 160,
    targetGrossMarginPct: 59.4,
    simulatedMarketDemandWeekly: 25,
    commonFrictions: [
      'Messy sauce leaks from school canteen food trays',
      'Heavy stainless steel lunch boxes clattering in school backpacks',
      'Disposable plastic bag ban leaves students juggling lunch boxes'
    ]
  },
  {
    id: 'preset-study-swap',
    name: 'Peer Notes Micro-Exchange (Digital Solution)',
    track: 'digital',
    category: 'EdTech & Peer Learning',
    description: 'A 1-click verified summary exchange for secondary school STEM subjects with peer micro-bounties.',
    starterCashTHB: 2500,
    fixedStartupExpenseTHB: 950,
    unitFloorCostTHB: 6,
    suggestedRetailPriceTHB: 30,
    targetGrossMarginPct: 80,
    simulatedMarketDemandWeekly: 60,
    commonFrictions: [
      'Messy handwriting shared over messy chat apps gets buried',
      'No way to verify if notes cover the upcoming mock exam syllabus',
      'Wasting 30 minutes searching for a single chemical reaction diagram'
    ]
  }
];

export const ENTREPRENEURSHIP_PROGRAM_PHASES: ProgramPhase[] = [
  {
    id: 'explore',
    title: 'Phase 1A: Problem Discovery & Friction Logging',
    strap: 'Detecting everyday inefficiencies and tracking emotional friction in school, home, and transit routines.',
    weeks: [1, 2],
    goal: 'Maintain a 2-day Friction Log tracking context, current workarounds, and emotional impact to pinpoint high-pain disruptions.',
    tasks: [
      'Carry a dedicated pocket notebook or digital notes app across daily school, transit, and home routines.',
      'Record at least 5 distinct friction events detailing Context, Current Workaround, and Emotional Impact.',
      'Analyze frequency and severity at the end of Day 2 to isolate the top 2 highest-friction nuisance points.',
      'Audit existing workarounds: evaluate why current makeshift fixes fail or cause cumulative waste.'
    ],
    evidence: [
      'Friction Log Raw Journal (5+ documented entries with context, workarounds, and impact ratings)',
      'Top-2 Friction Analysis Matrix highlighting the recurring points of inefficiency'
    ],
    aiPromptStarters: [
      'Help me categorize these 5 daily annoyances into physical ergonomic issues vs digital workflow bottlenecks.',
      'What are some non-obvious workarounds people use when dealing with [friction point]?',
      'Help me reframe this daily complaint into an actionable engineering problem.'
    ],
    competencies: ['sdl-1', 'ctps-1', 'ent-1'],
    stretchCompetencies: ['ctps-2', 'ent-2'],
    sessions: [
      {
        sessionNumber: 1,
        week: 1,
        title: 'The Friction Radar: Spotting Hidden Inefficiencies',
        durationMin: 50,
        learningGoal: 'Train observational acuity to identify recurring points of physical discomfort or emotional frustration in routines.',
        activities: [
          'Examine real-world examples: tangled headphone wires, losing locker keys, cumbersome instrument cases, unorganized study notes.',
          'Set up the 3-column Friction Log format: Context | Current Workaround | Emotional Impact.',
          'Begin 48-hour live logging challenge across campus and commute.'
        ],
        learnerChoices: {
          question: 'Which daily environment will you observe most rigorously during your 48-hour data gathering sprint?',
          options: [
            { id: 'opt-campus', label: 'School Campus & Lockers', description: 'Class transitions, lunch queues, sports gear storage, and desk ergonomics.' },
            { id: 'opt-transit', label: 'Commute & Public Transit', description: 'Crowded buses, rain commutes, bag weights, and payment gates.' },
            { id: 'opt-home', label: 'Home Study & Workflow', description: 'Homework desks, device chargers, paper clutter, and hobby practice.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Log your first 3 observed friction events noting context, current workarounds, and emotional impact.',
          targetCompetencies: ['sdl-1', 'ctps-1']
        },
        reflectionPrompt: 'Why do most people silently tolerate annoying daily problems instead of fixing them?',
        teacherTips: 'Encourage students not to invent fake problems. The friction must be witnessed or experienced firsthand.'
      },
      {
        sessionNumber: 2,
        week: 1,
        title: 'Friction Analysis & Filtering Matrix',
        durationMin: 50,
        learningGoal: 'Synthesize raw observations into the top 2 candidate friction points that cause the greatest measurable disruption.',
        activities: [
          'Tabulate collected logs: tally frequency, time wasted, and emotional frustration.',
          'Score candidate frictions on disruption scale (1 to 5).',
          'Select the top 2 friction points to advance into Customer Empathy Interviews.'
        ],
        learnerChoices: {
          question: 'What type of friction will be your primary focus?',
          options: [
            { id: 'opt-phys-friction', label: 'Physical / Ergonomic Friction', description: 'Clumsy storage, damaged gear, physical strain, awkward transport.' },
            { id: 'opt-digital-friction', label: 'Digital / Process Friction', description: 'Communication lag, lost files, redundant clicks, coordination chaos.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your filtered Top 2 Friction Matrix with severity and frequency ratings.',
          targetCompetencies: ['ctps-1', 'ent-1']
        },
        reflectionPrompt: 'Which of your top 2 frictions causes the deepest emotional annoyance or wasted time?',
        teacherTips: 'Check that students have tangible evidence of workarounds rather than just vague complaints.'
      }
    ]
  },
  {
    id: 'empathise',
    title: 'Phase 1B: Customer Empathy Interviews',
    strap: 'Validating real-world pain using past-behavior interviewing techniques without leading the witness.',
    weeks: [2, 3],
    goal: 'Interview 5 target users affected by the logged friction using the 3-question past behavior core; collect exact quotes.',
    tasks: [
      'Identify 5 target users affected by the observed friction (classmates, parents, teachers, local shopkeepers).',
      'Write a question guide following the "past behavior" framework—strictly avoiding speculative questions like "Would you buy X?".',
      'Run 10–12 minute interviews using the 3-question core: past experience, current workarounds/annoyances, and lost time/effort.',
      'Record exact verbatim quotes and quantify irritation, cost, or time lost; discard ideas if < 3 of 5 consider it a nuisance.'
    ],
    evidence: [
      '5 Customer Empathy Interview Transcripts (with exact user quotes and lost time figures)',
      'Validation Scorecard (Confirming whether ≥ 3/5 users experience genuine nuisance)'
    ],
    aiPromptStarters: [
      'Review my interview script: Are any of these questions leading the witness or asking for future speculation?',
      'How can I phrase a follow-up question to find out how much time someone lost without sounding interrogative?',
      'Summarize the emotional themes from these 5 interview transcripts.'
    ],
    competencies: ['ec-1', 'lc-1', 'ctps-1'],
    stretchCompetencies: ['ec-2', 'ent-1'],
    sessions: [
      {
        sessionNumber: 3,
        week: 2,
        title: 'The Past-Behavior Interview Protocol',
        durationMin: 50,
        learningGoal: 'Master interview techniques that extract honest historical facts rather than polite speculative promises.',
        activities: [
          'Deconstruct why "Would you buy this?" leads to false positives in entrepreneurship.',
          'Practice the 3 core questions: 1. Walk me through the last time you ran into this; 2. What tools/habits did you use?; 3. How much time/effort did you lose?',
          'Roleplay in pairs: one student conducts the interview while coach monitors for leading questions.'
        ],
        learnerChoices: {
          question: 'Who is your primary customer interview cohort?',
          options: [
            { id: 'opt-peers', label: 'School Peers & Teammates', description: 'Students managing heavy bags, band gear, sports gear, or study notes.' },
            { id: 'opt-staff', label: 'Teachers & Campus Staff', description: 'Educators managing classroom materials, attendance, or lunch schedules.' },
            { id: 'opt-family', label: 'Family & Neighborhood Contacts', description: 'Parents, local shopkeepers, or transit commuters.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Upload your finalized Past-Behavior Interview Question Guide.',
          targetCompetencies: ['ec-1', 'ctps-1']
        },
        reflectionPrompt: 'Why is past behavior a 10x more reliable indicator of value than future promises?',
        teacherTips: 'Disqualify questions like "If I built an app for this, would you download it?". Enforce questions about real past occurrences.'
      },
      {
        sessionNumber: 4,
        week: 2,
        title: 'Interview Fieldwork & Quote Synthesis',
        durationMin: 50,
        learningGoal: 'Synthesize verbatim customer quotes to isolate measurable pain points.',
        activities: [
          'Review notes from 5 customer interviews.',
          'Extract direct quotes mentioning annoyance, cost, or time lost.',
          'Apply the 3-out-of-5 validation rule: if fewer than 3 users validate the pain, pivot or test alternate friction.'
        ],
        learnerChoices: {
          question: 'Did your interview findings confirm the problem or reveal an unexpected angle?',
          options: [
            { id: 'opt-confirmed', label: 'Confirmed Core Friction', description: 'Strong validation; users expressed genuine annoyance and shared concrete workarounds.' },
            { id: 'opt-pivot', label: 'Discovered Adjacent Friction', description: 'Users revealed an even bigger related pain point that shifted our project focus.' }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Log 5 key verbatim quotes from your interviews highlighting specific irritations or lost time.',
          targetCompetencies: ['ec-1', 'lc-1']
        },
        reflectionPrompt: 'What was the most surprising or unexpected quote a user shared during your interview?',
        teacherTips: 'Look for emotional words like "frustrating", "dented", "hated", or "lost 20 minutes".'
      }
    ]
  },
  {
    id: 'define',
    title: 'Phase 2A: Problem Statement Definition & Scope Anchoring',
    strap: 'Anchoring product scope into a clear, unbending target statement without pre-committing to solutions.',
    weeks: [3, 4],
    goal: 'Complete the standardized Who / What / Why validation framework and combine into one declarative problem sentence free of product names.',
    tasks: [
      'Review interview notes to isolate target group, specific measurable obstacle, and root cause of existing tool failure.',
      'Fill in standardized validation framework: Who (specific group with shared context) + What (measurable obstacle) + Why (root cause).',
      'Synthesize variables into one declarative sentence: e.g., "Middle school brass musicians struggle to store maintenance tools safely because standard cases only fit the instrument body, leading to dented parts and lost accessories."',
      'Run the "No Solution Name" test: ensure the problem statement mentions ZERO product features or end products.'
    ],
    evidence: [
      'Standardized Who / What / Why Validation Canvas',
      'Declarative Problem Statement (Verified free of product names)'
    ],
    aiPromptStarters: [
      'Check my problem statement: Does it accidentally name a solution or product feature?',
      'How can I make the "What" metric in my problem statement more measurable?',
      'Help me clarify the root cause (the "Why") behind this user difficulty.'
    ],
    competencies: ['ctps-1', 'ec-1', 'ent-1'],
    stretchCompetencies: ['ctps-2', 'ent-2'],
    sessions: [
      {
        sessionNumber: 5,
        week: 3,
        title: 'The Who-What-Why Framework',
        durationMin: 50,
        learningGoal: 'Deconstruct user pain into precise demographic context, measurable obstacle, and underlying root cause.',
        activities: [
          'Deconstruct exemplar problem statements from successful hardware and digital startups.',
          'Define the "Who": narrow down the user group (e.g. middle school brass players carrying trumpets).',
          'Define the "What": measure the exact physical or cognitive obstacle.',
          'Define the "Why": expose why standard off-the-shelf equipment fails.'
        ],
        learnerChoices: {
          question: 'How specific is your target demographic definition?',
          options: [
            { id: 'opt-micro', label: 'Hyper-Specific Niche', description: 'School band trumpet players walking 1km daily with heavy instrument cases.' },
            { id: 'opt-broad', label: 'Broad Campus Segment', description: 'Secondary school students juggling three textbooks and lunch containers.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Fill in your Who / What / Why breakdown table with exact metrics.',
          targetCompetencies: ['ctps-1', 'ec-1']
        },
        reflectionPrompt: 'Why does narrowing your target audience make solving the problem significantly easier?',
        teacherTips: 'Check that the "What" includes a concrete obstacle rather than a generic statement like "finds it hard".'
      },
      {
        sessionNumber: 6,
        week: 3,
        title: 'The Declarative Statement & Solution-Free Audit',
        durationMin: 50,
        learningGoal: 'Combine validation variables into a single declarative sentence and purge all premature solution bias.',
        activities: [
          'Draft the single declarative sentence combining Who, What, and Why.',
          'Perform peer audit: Check if any sentence mentions an app, bag, strap, website, or product.',
          'Lock the problem definition as the permanent benchmark for testing all future ideas.'
        ],
        learnerChoices: {
          question: 'Does your problem statement pass the solution-free test on the first try?',
          options: [
            { id: 'opt-clean', label: '100% Solution-Free', description: 'Focuses entirely on the user struggle and root cause without hinting at an invention.' },
            { id: 'opt-revised', label: 'Revised After Peer Audit', description: 'Removed product references like "need an app" or "need a specialized bag".' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your finalized single declarative problem statement.',
          targetCompetencies: ['ctps-1', 'ent-1']
        },
        reflectionPrompt: 'How does keeping solutions out of your problem statement prevent premature design lock-in?',
        teacherTips: 'Be rigorous: if they wrote "they need an organized bag", reject it and make them write about the unorganized items.'
      }
    ]
  },
  {
    id: 'ideate',
    title: 'Phase 2B: Rapid Ideation & Track Feasibility Filtering',
    strap: 'Uncovering diverse mechanisms through Crazy 8s brainstorming and committing to Physical vs Digital build tracks.',
    weeks: [4, 5],
    goal: 'Execute Crazy 8s across strict design constraints; score top concepts on Feasibility, Desirability, and Durability/Scalability.',
    tasks: [
      'Fold an A4 sheet into 8 equal panels; set an 8-minute timer (60 seconds per panel).',
      'Enforce design constraints: Panels 1–2 (conventional), 3–4 (zero-cost/scrap), 5–6 (modular/multi-purpose), 7–8 (radical alternative).',
      'Commit to either the Physical Build Track (ergonomics, storage, wear-and-tear) or Digital Solution Track (communication, workflow, data).',
      'Score top 2 concepts on 1–5 scale across Feasibility (1–2 wk build), Desirability (solves core quote), and Durability/Scalability (real usage).'
    ],
    evidence: [
      'Crazy 8s Brainstorming Sheet (8 distinct sketched panels with constraint labels)',
      'Feasibility Scoring Matrix (1–5 ratings across Feasibility, Desirability, and Durability/Scalability)'
    ],
    aiPromptStarters: [
      'Give me 2 radical mechanism ideas for solving [problem] that do not use traditional electronics or standard bags.',
      'Help me evaluate if this physical prototype can be built in under 2 weeks using classroom scrap materials.',
      'What are common durability failure points for [mechanism] in daily student usage?'
    ],
    competencies: ['ctps-1', 'ent-1', 'sdl-1'],
    stretchCompetencies: ['ctps-2', 'ent-2'],
    sessions: [
      {
        sessionNumber: 7,
        week: 4,
        title: 'Crazy 8s Rapid Brainstorming Sprint',
        durationMin: 50,
        learningGoal: 'Push past superficial, generic concepts to uncover diverse functional mechanisms under time pressure.',
        activities: [
          'Fold blank A4 sheets into 8 panels; set the live 8-minute timer.',
          'Draw panel by panel under enforced constraints: Panels 1–2 (direct), 3–4 (zero-cost/scrap), 5–6 (modular), 7–8 (radical).',
          'Share sketches in 60-second lightning rounds with peers.'
        ],
        learnerChoices: {
          question: 'Which panel constraint produced your most innovative idea?',
          options: [
            { id: 'opt-scrap', label: 'Panels 3–4: Zero-Cost / Scrap Materials', description: 'Forced reliance on everyday items and upcycled materials.' },
            { id: 'opt-modular', label: 'Panels 5–6: Modular / Multi-Purpose', description: 'Created detachable attachments and adaptive interfaces.' },
            { id: 'opt-radical', label: 'Panels 7–8: Radical Alternative', description: 'Invented an unorthodox mechanical lever or voice/gesture trigger.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload a clear photo of your completed 8-panel Crazy 8s brainstorming sheet.',
          targetCompetencies: ['ctps-1', 'ent-1']
        },
        reflectionPrompt: 'Which panels felt hardest to draw, and what mechanism surprised you most?',
        teacherTips: 'Insist that sketches show form or UI elements with brief labels rather than essays.'
      },
      {
        sessionNumber: 8,
        week: 4,
        title: 'Track Selection & Feasibility Filtering',
        durationMin: 50,
        learningGoal: 'Select the optimal development track (Physical Build vs Digital Solution) and score concepts objectively.',
        activities: [
          'Filter top 2 concepts against team technical capabilities and project timeline.',
          'Select Track A: Physical Build (ergonomics, hardware, transport) OR Track B: Digital Solution (data, workflow, community).',
          'Populate the Feasibility Scoring Matrix (1–5 scale across Feasibility, Desirability, Durability/Scalability).'
        ],
        learnerChoices: {
          question: 'Which development track will your team commit to for prototyping?',
          options: [
            { id: 'opt-track-physical', label: 'Track A: Physical Build', description: 'Fabrication with cardboard, foam, upcycled textiles, straps, and fasteners.' },
            { id: 'opt-track-digital', label: 'Track B: Digital Solution', description: 'Paper wireframes, 3-tap mobile web UI, clickable prototype, or automation script.' },
            { id: 'opt-track-simulated', label: 'Track C: Interactive Simulation Sandbox', description: 'Build and validate in the digital twin market simulator before physical fabrication.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Feasibility Scoring Matrix with chosen winner and rationale.',
          targetCompetencies: ['ctps-1', 'sdl-1']
        },
        reflectionPrompt: 'Why is picking a simpler, highly feasible concept often more successful than an over-complicated idea?',
        teacherTips: 'Prevent teams from attempting projects that require 6 months of coding or industrial injection molding.'
      }
    ]
  },
  {
    id: 'prototype',
    title: 'Phase 3A: Low-Fidelity Rapid Build & Simulation Sandbox',
    strap: 'Constructing rough, inexpensive 1:1 scale models or wireframe maps to evaluate form, sizing, and usability before fabrication.',
    weeks: [5, 7],
    goal: 'Build rough low-fidelity prototype (Track A: 1:1 cardboard/foam physical model; Track B: index-card wireframe map; Option: Simulation Sandbox).',
    tasks: [
      'Track A (Physical): Gather scrap materials (cardboard, foam board, duct tape, hot glue, clay); construct 1:1 scale model focused on volume and contact points.',
      'Track A (Ergonomics): Test ergonomics by wearing, packing, or opening prototype with actual gear; mark weak points with red marker.',
      'Track B (Digital): Create paper wireframe map showing Home, Action, Confirmation, and Summary; map taps and enforce the ≤ 3-interaction rule.',
      'Simulation Sandbox Option: Test virtual transaction loop, COGS variables, and market demand in the Digital Twin Simulator.'
    ],
    evidence: [
      'Low-Fidelity Prototype (Photo of 1:1 physical model with red-marker annotations OR paper wireframe index card deck)',
      'Simulation Sandbox Run Log (Market stress test metrics, floor costs, and user flow audit)'
    ],
    aiPromptStarters: [
      'How can I reinforce a cardboard hinge so it withstands 50 opening and closing cycles without tearing?',
      'Review my 4-screen wireframe flow: How can I eliminate 1 tap to reach the core value faster?',
      'What are realistic unit costs for basic strapping, Velcro, or cloud hosting tiers in Southeast Asia?'
    ],
    competencies: ['ctps-1', 'ent-1', 'sdl-1'],
    stretchCompetencies: ['ctps-2', 'ent-2'],
    sessions: [
      {
        sessionNumber: 9,
        week: 5,
        title: 'Rapid Low-Fi Prototyping Workshop',
        durationMin: 50,
        learningGoal: 'Construct a rough 1:1 scale prototype focusing strictly on physical volume, weight distribution, or digital screen states.',
        activities: [
          'Assemble raw materials: cardboard, tape, foam, or index cards.',
          'Build rapid version 1.0 (do not focus on color or beauty; focus on function and sizing).',
          'Conduct initial fit-check against the real items or user actions.'
        ],
        learnerChoices: {
          question: 'What is your primary prototyping medium for today\'s build?',
          options: [
            { id: 'opt-medium-cardboard', label: 'Cardboard & Foam Board (Physical)', description: 'Quick cutting, hot glue assembly, 1:1 volume mockups.' },
            { id: 'opt-medium-cards', label: 'Index Cards & Screen Wireframes (Digital)', description: 'Interactive paper prototype mapped to user taps.' },
            { id: 'opt-medium-sim', label: 'Digital Twin Simulation Sandbox', description: 'Browser-based market dynamics, unit economics, and transaction testing.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload a photo or screengrab of your rough Version 1.0 prototype in progress.',
          targetCompetencies: ['ctps-1', 'sdl-1']
        },
        reflectionPrompt: 'What was the fastest assumption you were able to test using scrap materials?',
        teacherTips: 'Stop students who spend 30 minutes coloring. The goal is structural volume and tactile interaction.'
      },
      {
        sessionNumber: 10,
        week: 6,
        title: 'Ergonomic Testing & Friction Annotation',
        durationMin: 50,
        learningGoal: 'Identify mechanical weak points, clearance issues, or interface bottlenecks on the rough prototype.',
        activities: [
          'Wear, open, or cycle the physical prototype with actual equipment (e.g. trumpets, notebooks, cables).',
          'If digital, walk through the paper cards tap-by-tap; eliminate any step requiring > 3 clicks.',
          'Annotate all weak points directly onto the prototype with bright red marker.'
        ],
        learnerChoices: {
          question: 'Where did your prototype experience the most noticeable strain or confusion?',
          options: [
            { id: 'opt-strain-joint', label: 'Physical Attachment / Joint Stress', description: 'Straps slipping, seams tearing, or clasps opening under weight.' },
            { id: 'opt-strain-clearance', label: 'Dimension / Sizing Clearance', description: 'Compartment too tight or bulky to fit alongside existing bags.' },
            { id: 'opt-strain-ux', label: 'Digital Tap Flow Redundancy', description: 'Too many steps required before reaching the core value screen.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'List 3 red-marker flaw annotations discovered during ergonomic trials.',
          targetCompetencies: ['ctps-1', 'ent-1']
        },
        reflectionPrompt: 'Why is marking flaws in red marker on an early prototype celebrated rather than penalized?',
        teacherTips: 'Praise students who find big flaws early. It saves days of work later.'
      }
    ]
  },
  {
    id: 'test',
    title: 'Phase 3B: Usability Testing, Iteration & Financial Modeling',
    strap: 'Testing under active conditions using the Silent Rule, iterating to v1.1, and calculating unit economics in Thai Baht.',
    weeks: [7, 9],
    goal: 'Run usability trials with 3 naive peers under the Silent Rule, build v1.1, and tabulate COGS, retail price, and break-even volume.',
    tasks: [
      'Hand prototype to 3 peers who have not seen it; provide one simple scenario prompt (e.g., "Attach this to your bag").',
      'Enforce The Silent Rule: the designer must remain completely silent—no explaining, no assisting, no apologizing.',
      'Document friction points: 5-second hesitations, physical bends/slips/jams, and incorrect taps; build Version 1.1 fixing ≥ 2 flaws.',
      'COGS & Margin: Calculate Unit Floor Cost; set retail price using margin benchmarks (50–65% physical, 70–85% digital); calculate Break-Even Units.'
    ],
    evidence: [
      'Silent Usability Observation Log (Documenting hesitations, slips, and taps across 3 testers)',
      'Version 1.1 Photo / Spec showing 2 functional iterations',
      'Unit Economics Ledger (COGS breakdown, Retail Price, Gross Margin %, and Break-Even Unit Volume in THB)'
    ],
    aiPromptStarters: [
      'Help me calculate the Break-Even Volume for startup capital of 1,200 THB with a 45 THB unit cost and 120 THB retail price.',
      'How can I convert bulk purchasing rates (e.g. 100 THB roll for 5 units) into unit floor costs?',
      'Suggest 2 structural redesigns to prevent this strap from slipping under 2kg of weight.'
    ],
    competencies: ['ctps-1', 'ent-1', 'ec-1'],
    stretchCompetencies: ['ctps-2', 'ent-2'],
    sessions: [
      {
        sessionNumber: 11,
        week: 7,
        title: 'The Silent Usability Lab',
        durationMin: 50,
        learningGoal: 'Observe peer testers without intervention to isolate authentic product flaws.',
        activities: [
          'Brief 3 peer testers with a single scenario prompt.',
          'Execute testing under the Silent Rule: zero speaking, zero guiding.',
          'Log 5-second hesitations, structural slips, or erroneous button clicks on the observation sheet.'
        ],
        learnerChoices: {
          question: 'What behavior was hardest to observe in silence without helping the tester?',
          options: [
            { id: 'opt-hesitation', label: 'Tester Hesitating Over 5 Seconds', description: 'Watching them wonder which way to clip or tap without intervening.' },
            { id: 'opt-wrong-way', label: 'Tester Using the Mechanism Backwards', description: 'Seeing them attempt to insert items upside down or into the wrong pouch.' }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Log observation notes from 3 silent usability testing sessions.',
          targetCompetencies: ['ctps-1', 'ec-1']
        },
        reflectionPrompt: 'What did the tester do that you never anticipated when designing the prototype?',
        teacherTips: 'Physically stand behind the designer during the test to ensure they do not whisper advice to the tester.'
      },
      {
        sessionNumber: 12,
        week: 8,
        title: 'Iterating to Version 1.1',
        durationMin: 50,
        learningGoal: 'Implement at least two concrete functional adjustments directly addressing usability test failures.',
        activities: [
          'Prioritize top 2 flaws observed during silent testing.',
          'Modify physical geometry, fastener type, or UI wireframe layout.',
          'Document before-and-after comparison between Version 1.0 and Version 1.1.'
        ],
        learnerChoices: {
          question: 'Which functional adjustment did you prioritize for Version 1.1?',
          options: [
            { id: 'opt-fix-mechanical', label: 'Mechanical Strengthening & Clearances', description: 'Added double stitching/tape reinforcements and widened entry slots.' },
            { id: 'opt-fix-affordance', label: 'Visual Affordance & Intuitive Guides', description: 'Added tactile pull tabs, color cues, or simplified label prompts.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload photo comparison highlighting 2 functional improvements in Version 1.1.',
          targetCompetencies: ['ctps-1', 'ent-1']
        },
        reflectionPrompt: 'How did peer testing prevent your team from making an expensive mistake in production?',
        teacherTips: 'Ensure the changes are functional rather than purely cosmetic.'
      },
      {
        sessionNumber: 13,
        week: 9,
        title: 'Unit Economics & COGS Breakdown (Thai Baht)',
        durationMin: 50,
        learningGoal: 'Calculate the exact expense required to produce or run one standalone unit of the product.',
        activities: [
          'Itemize all raw materials, sub-assemblies, and consumables needed for 1 unit.',
          'Convert bulk purchasing rates into unit-level consumption (e.g. 100 THB roll for 5 harnesses = 20 THB/unit).',
          'Add secondary consumables: protective bags, labels, packaging stickers, payment cuts.',
          'Sum all figures to calculate Unit Floor Cost.'
        ],
        learnerChoices: {
          question: 'What is your primary cost driver in your Unit Floor Cost calculation?',
          options: [
            { id: 'opt-raw-mats', label: 'Primary Structural Raw Materials', description: 'Heavy webbing, fabrics, foam boards, or microcontroller boards.' },
            { id: 'opt-fasteners', label: 'Fasteners & Hardware Consumables', description: 'Zippers, buckles, eyelets, specialized glues, or cloud hosting databases.' },
            { id: 'opt-packaging', label: 'Packaging & Fulfillment', description: 'Protective sleeves, printed demo cards, sticker labels.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your completed COGS Spreadsheet with itemized costs in Thai Baht.',
          targetCompetencies: ['ctps-1', 'ent-1']
        },
        reflectionPrompt: 'Why does calculating unit-level costs change how you choose raw materials?',
        teacherTips: 'Check that students convert bulk rates properly (e.g. dividing total cost by pieces produced).'
      },
      {
        sessionNumber: 14,
        week: 9,
        title: 'Pricing Strategy & Break-Even Analysis',
        durationMin: 50,
        learningGoal: 'Set sustainable retail prices using margin benchmarking and calculate break-even sales volume.',
        activities: [
          'Apply benchmark margins: 50–65% for physical products; 70–85% for digital services.',
          'Calculate RetailPrice = UnitFloorCost / (1 - DesiredMargin).',
          'Tabulate one-time startup capital expenses (cutting tools, specialized glue guns, domain registration).',
          'Calculate Break-Even Units = OneTimeStartupCapital / (RetailPrice - UnitFloorCost).'
        ],
        learnerChoices: {
          question: 'What margin tier does your product target?',
          options: [
            { id: 'opt-margin-standard-phys', label: 'Physical Standard (55–60% Gross Margin)', description: 'Balanced between affordability for classmates and healthy unit profit.' },
            { id: 'opt-margin-premium-phys', label: 'Physical Premium (65% Gross Margin)', description: 'High durability with specialized upcycled materials.' },
            { id: 'opt-margin-digital', label: 'Digital Service (75–80% Gross Margin)', description: 'Offsets upfront software design time and recurring database costs.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Financial Summary: Unit Floor Cost, Retail Price, Profit Margin, and Break-Even Unit Volume.',
          targetCompetencies: ['ctps-1', 'ent-1']
        },
        reflectionPrompt: 'How many units do you realistically need to sell to pay off your initial startup tools?',
        teacherTips: 'Verify mathematical accuracy: check that margin is calculated on retail price, not markup on cost.'
      }
    ]
  },
  {
    id: 'share',
    title: 'Phase 4 & 5: Go-to-Market Strategy, 3-Minute Pitch & Angel Showcase',
    strap: 'Mapping distribution channels, crafting launch hooks, rehearsing timed 3-minute pitches, and facing mock investor Q&A.',
    weeks: [10, 12],
    goal: 'Map launch route to first 25 adopters, craft 1-sentence launch hook, and deliver timed 3-minute pitch across 4 strict blocks with Q&A.',
    tasks: [
      'Identify high-density congregation areas for target users (school notice boards, lunchtime clubs, forums, events).',
      'Select 1 primary distribution channel and 1 promotional trigger (Physical: pop-up demo table; Digital: 1-click video demo & beta link).',
      'Draft 1-sentence value hook: "Unlike [Current Workaround], [Product Name] provides [Direct Benefit] without [Major Friction Point]."',
      'Rehearse 3-minute pitch in 4 blocks: 0:00–0:45 (Problem), 0:45–1:45 (Solution v1.1), 1:45–2:30 (Business Model & THB Economics), 2:30–3:00 (Next Step / Capital Ask).',
      'Conduct mock Q&A: answer critical durability and pricing questions in under 20 seconds using financial and test data.'
    ],
    evidence: [
      'Go-to-Market Launch Map (Distribution channel, promo trigger, and 25-adopter plan)',
      '1-Sentence Value Proposition Hook',
      '3-Minute Pitch Video / Live Audio Recording with timed block transitions',
      'Investor & Customer Q&A Defense Log'
    ],
    aiPromptStarters: [
      'Review my 1-sentence value hook: Is it concise, punchy, and clear about the difference from the current workaround?',
      'Time my pitch script: Does Block 1 end by 45 seconds and Block 2 by 1 minute 45 seconds?',
      'Act as a tough angel investor: Ask me 2 hard questions about my unit cost, gross margin, or product durability.'
    ],
    competencies: ['ec-1', 'ent-1', 'lc-1', 'ctps-1'],
    stretchCompetencies: ['ec-2', 'ent-2'],
    sessions: [
      {
        sessionNumber: 15,
        week: 10,
        title: 'Channel Mapping & Launch Hook Architecture',
        durationMin: 50,
        learningGoal: 'Design a direct route to reaching the first 25 paying users or verified beta adopters.',
        activities: [
          'Identify where target users naturally congregate (cafeterias, locker bays, music rooms, extracurricular clubs).',
          'Select distribution channels and promotional triggers.',
          'Draft the standardized 1-sentence launch hook: "Unlike [Current Workaround], [Product Name] provides [Direct Benefit] without [Major Friction Point]."'
        ],
        learnerChoices: {
          question: 'What is your primary promotional trigger for your first 25 adopters?',
          options: [
            { id: 'opt-channel-popup', label: 'Lunchtime Pop-up Demo Table', description: 'Live physical booth with interactive test models and printed pre-order cards.' },
            { id: 'opt-channel-video', label: '15-Second Short Utility Video', description: 'Shared in student club chat channels with 1-click beta signup.' },
            { id: 'opt-channel-ambassador', label: 'Peer Ambassador Trial', description: 'Equip 3 respected club members with free prototypes to demonstrate in practice.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your 1-Sentence Value Hook and First-25-Adopter Channel Plan.',
          targetCompetencies: ['ec-1', 'ent-1']
        },
        reflectionPrompt: 'Why is getting your first 25 real users harder—and more important—than getting 1,000 passive likes?',
        teacherTips: 'Insist on specific locations and numbers rather than vague claims like "we will post on social media".'
      },
      {
        sessionNumber: 16,
        week: 11,
        title: 'The 3-Minute Pitch Scripting & Block Allotment',
        durationMin: 50,
        learningGoal: 'Draft a structured, professional pitch constrained to a strict 4-block 180-second timetable.',
        activities: [
          'Deconstruct the 4-block timing structure: Block 1 (Problem & Quote, 45s), Block 2 (Solution & v1.1 Demo, 60s), Block 3 (Economics & Margin, 45s), Block 4 (Next Step & Seed Ask, 30s).',
          'Draft script line-by-line; eliminate unnecessary backstory.',
          'Test with a stopwatch; ensure Block 2 starts no later than 45 seconds.'
        ],
        learnerChoices: {
          question: 'What is your concrete Next Step / Seed Ask in Block 4?',
          options: [
            { id: 'opt-ask-materials', label: 'Raw Material Capital Ask (e.g. 1,500 THB)', description: 'Funds to purchase bulk materials for the first production run of 15 units.' },
            { id: 'opt-ask-testers', label: 'Confirmed Beta Cohort Ask (e.g. 10 Beta Users)', description: 'Recruiting 10 active musicians or students for a 2-week longitudinal field trial.' },
            { id: 'opt-ask-tools', label: 'Equipment & Tooling Grant', description: 'Request for specialized fabrication tools (eyelet punch, hot glue stations, domain registration).' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Upload your finalized 4-block pitch script with target timestamps.',
          targetCompetencies: ['ec-1', 'ent-1']
        },
        reflectionPrompt: 'What happens to audience attention when a presenter spends 2 minutes talking about backstory before showing the product?',
        teacherTips: 'Time students strictly with a timer. Cut them off if they exceed 45 seconds in Block 1.'
      },
      {
        sessionNumber: 17,
        week: 11,
        title: 'Pitch Rehearsal & The 20-Second Rapid Q&A Drill',
        durationMin: 50,
        learningGoal: 'Master pitch delivery with live physical or digital proof and defend decisions under rapid fire Q&A.',
        activities: [
          'Run full rehearsal with prototype demonstrations.',
          'Peer Q&A drill: peers ask 2 critical questions about durability, competition, or pricing.',
          'Practice answering within 20 seconds using financial data and test evidence.'
        ],
        learnerChoices: {
          question: 'Which anticipated objection is your team best prepared to defend?',
          options: [
            { id: 'opt-defend-durability', label: 'Durability & Wear Resistance', description: 'Backed by v1.1 reinforcement data and stress test cycles.' },
            { id: 'opt-defend-price', label: 'Pricing & Margin Justification', description: 'Backed by unit floor cost ledger and break-even sales volume math.' },
            { id: 'opt-defend-demand', label: 'Real Customer Demand', description: 'Backed by 5 past-behavior interviews and quotes from real users.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Record and submit a 3-minute mock pitch rehearsal video or audio with peer feedback.',
          targetCompetencies: ['ec-1', 'lc-1']
        },
        reflectionPrompt: 'How did practicing under the 20-second Q&A rule improve your confidence?',
        teacherTips: 'Encourage peers to ask tough questions: "Why won\'t this break in my backpack?" or "Why wouldn\'t I just buy a pencil case?".'
      },
      {
        sessionNumber: 18,
        week: 12,
        title: 'Showcase Pitch Arena & Startup Deployment',
        durationMin: 50,
        learningGoal: 'Deliver the final 3-minute pitch before guest judges, teachers, and student customers to launch the product.',
        activities: [
          'Deliver 3-minute live pitch with physical prototype v1.1 demonstration or live app loop.',
          'Display Go-to-Market poster and Unit Economics breakdown board.',
          'Log pre-orders, beta tester signups, and collect judge evaluations.'
        ],
        learnerChoices: {
          question: 'What is your team\'s immediate milestone following today\'s showcase?',
          options: [
            { id: 'opt-post-production', label: 'Execute Batch 1 Production Run', description: 'Fabricate 10–15 units and fulfill initial pre-orders.' },
            { id: 'opt-post-beta', label: 'Launch 2-Week Live Field Trial', description: 'Distribute prototypes to 10 confirmed beta testers and log daily wear logs.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload final showcase pitch photo/video and judge evaluation scorecard.',
          targetCompetencies: ['ec-1', 'ent-1', 'lc-1']
        },
        reflectionPrompt: 'Looking back from Friction Log Day 1 to Showcase Day, what was the most valuable lesson you learned about creating something real?',
        teacherTips: 'Celebrate all teams. Invite local entrepreneurs or parents to act as friendly angel reviewers.'
      }
    ]
  }
];

export const ENTREPRENEURSHIP_PROGRAM: PblProgram = {
  id: 'entrepreneurship-product-creation-2026',
  title: 'PBL: Entrepreneurship — Product Creation',
  subtitle: 'From Everyday Friction to Validated Market Prototype: Discovering, designing, building, and pitching viable physical and digital products with real unit economics.',
  status: 'provisional_prototype',
  theme: 'Venture Creation, Product Design & Market Economics',
  drivingQuestion: 'How might we identify overlooked everyday friction points, validate genuine human need through past-behavior research, and engineer a durable physical or digital product with sustainable unit economics and a verified go-to-market plan?',
  realProblem: {
    type: 'both',
    summary: 'Consumers and students endure recurring daily annoyances, physical discomforts, and workflow bottlenecks (damaged gear, clumsy transit, fragmented study notes), while most aspiring teen inventors fail because they build unwanted gadgets with unviable economics and leading questions.',
    peopleImpact: 'Directly resolves recurring physical strain, lost time, and daily frustration for students, educators, and community members with purpose-built ergonomic and digital solutions.',
    environmentalImpact: 'Prioritizes upcycled scrap materials, zero-cost manufacturing scraps, modular repairability, and eliminates throwaway single-use plastics.'
  },
  targetAgeRange: 'Ages 9–17 (Primary through Upper Secondary: 9–11, 12–14, 15–17)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'Digital Twin Market Simulator Sandbox (Browser-based transaction, margin & demand testing)',
      'Optional BBC micro:bit V2 / Arduino UNO / ESP32 (for smart physical products with telemetry or timers)'
    ],
    sensorsAndActuators: [
      'Stopwatches and live pitch rehearsal timers',
      'Digital scales (for prototype weight and material measurement)',
      'Optional micro servo / push buttons / LED indicators for active smart prototypes'
    ],
    fabricationMaterials: [
      'Cardboard, corrugated plastic, dense foam board, scrap tarpaulin/fabrics',
      'Duct tape, hot glue guns, eyelets, Velcro strips, snap buckles, heavy webbing straps',
      'Index cards, black markers, A4 drawing sheets for Crazy 8s, red audit markers',
      'Presentation poster boards, pop-up table display cloths'
    ],
    softwareAndTools: [
      'PBL Studio Entrepreneurship Digital Twin Simulator & Margin Calculator',
      'PBL Studio AI Co-Pilot (Past-behavior interview coach, Socratic pricing auditor & pitch timer)',
      'Google Sheets / Excel for Unit Economics, COGS and Break-Even Modeling',
      'Figma / Canva / Web browser for wireframing and slide pitch visuals'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Cutting Tool Protocol: Hot glue guns and precision utility knives must be operated on self-healing cutting mats with safety guards.',
      'Silent Rule Discipline: Ensure designers stay quiet during peer testing; intervene gently if a student tries to guide a tester.',
      'Low-Risk Seed Capital: Keep all startup capital budgets low (max 1,500 THB) to focus learning on scrappiness and unit economics.'
    ],
    pedagogicalScaffolding: [
      'The Mom Test Framework: Strictly enforce past-behavior interviewing; fail any script that asks "Would you buy this?".',
      'Crazy 8s Constraint Enforcement: Ensure students stick to the 60-second limit per panel to prevent overthinking.',
      'COGS Conversion Coaching: Guide students step-by-step through dividing bulk material costs (e.g. 100 THB roll) by units produced.'
    ],
    aiEthicsRules: [
      'AI acts as a critical angel investor and interview coach; students must conduct real human interviews and physical builds.',
      'AI prompt provenance must be logged for all financial models and script revisions.'
    ],
    differentiationNotes: [
      'Primary Track (Ages 9–11): Focus on physical upcycled desk organizers or pencil cases, simple 3-item COGS ledgers, and 90-second show-and-tell pitches with classroom play money.',
      'Middle Secondary Track (Ages 12–14): Full 1:1 scale cardboard/fabric build or 4-screen paper wireframe, 5 customer interviews, exact Unit Floor Cost and Break-Even calculations, and 3-minute pitch rehearsals.',
      'Upper Secondary Track (Ages 15–17): Functional electromechanical or web app prototype, Digital Twin Simulation stress tests with 50+ virtual transactions, formal Bill of Materials in Thai Baht, and presentation to real community reviewers.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-validation-rate',
      metric: 'Problem Validation Rigor',
      target: '≥ 3 out of 5 target customer interviewees confirm genuine pain through past behavior and quotes',
      verificationMethod: 'Interview transcript audit and recorded quotes submitted in Evidence Log'
    },
    {
      id: 'metric-iteration-fixes',
      metric: 'Usability Usability Improvement',
      target: 'Version 1.1 demonstrably fixes ≥ 2 functional failure points observed during Silent Usability Testing',
      verificationMethod: 'Before-and-after photo comparison and usability re-test audit'
    },
    {
      id: 'metric-margin-viability',
      metric: 'Fiscal Feasibility & Unit Economics',
      target: 'Gross margin ≥ 50% (physical) or ≥ 70% (digital) with verified break-even unit volume in Thai Baht',
      verificationMethod: 'Itemized COGS spreadsheet and Break-Even formula calculation sheet'
    },
    {
      id: 'metric-pitch-timing',
      metric: 'Pitch Timing Precision',
      target: '3-minute pitch delivered with Block 2 starting before 0:45 and total duration within 170–185 seconds',
      verificationMethod: 'Live video timestamp audit and teacher evaluation scorecard'
    }
  ],
  assumptions: [
    {
      id: 'asmp-scrap-supplies',
      domain: 'Prototyping Materials',
      assumption: 'School provides basic scrap fabrication materials (cardboard, hot glue, Velcro, webbing) without personal expense.',
      ownerVerificationNeeded: 'Confirm maker lab consumables with InnovationCoach / WeLearn lab team.'
    },
    {
      id: 'asmp-market-sim',
      domain: 'Simulation Engine',
      assumption: 'Learners can optionally run experiments in the browser-based market simulation sandbox if materials are limited.',
      ownerVerificationNeeded: 'Verify simulation presets against local Thai retail market conditions.'
    }
  ],
  phases: ENTREPRENEURSHIP_PROGRAM_PHASES
};
