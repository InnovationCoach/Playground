/**
 * Don's PBL Program: Project "Genesis Engine": Build Your Own Movie Universe!
 * Branch: DonPBL
 * Location: prototypes/DonPBL/storytellingProgram.ts
 *
 * Sourced from the attached Project Overview Storytelling PDF:
 * - Title: Project "Genesis Engine": Build Your Own Movie Universe!
 * - Time: 12 Weeks (5 days a week, 2 hours a day = 120 Hours of Creation)
 * - What You Will Create (Final Deliverables):
 *   1. Your Universe Guide (Story Bible): The ultimate handbook for your world! It holds your character designs, world rules, and art files.
 *   2. A 3-Scene Movie Script: Written and formatted just like a real Hollywood screenplay.
 *   3. A Mini-Movie / Pitch Trailer: An exciting video preview that brings your story to life with your own art, voice acting, sound effects, and music!
 * - 4 Production Phases across 12 Weeks mapped into the 7 WeLearn Design Thinking Phases:
 *   - Phase 1: Building Your World (Weeks 1–3) -> Explore (Weeks 1–2) & Empathise (Week 3, Phase 1 Checkpoint)
 *   - Phase 2: Writing the Movie Script (Weeks 4–6) -> Define (Week 4) & Ideate (Weeks 5–6, Phase 2 Checkpoint)
 *   - Phase 3: Pre-Production, Art & Sound Prep (Weeks 7–9) -> Prototype (Weeks 7–9, Phase 3 Checkpoint)
 *   - Phase 4: Final Production, Polish & Launch! (Weeks 10–12) -> Test (Weeks 10–11) & Share (Week 12, THE GRAND SHOWCASE!)
 * - How Your Project is Scored (Success Checklist):
 *   1. Strong World Rules
 *   2. Pro Script Formatting
 *   3. Smart Organization & Planning
 *   4. Smooth Sight & Sound
 */

import type { PblProgram } from './programData';

export interface CharacterProfile {
  name: string;
  role: 'protagonist' | 'foil_rival' | 'mentor' | 'antagonist';
  externalWant: string; // What do they Want (their outside goal)?
  internalNeed: string; // What do they Need (how they must grow inside)?
  fatalFlaw: string; // A "Flaw" (a weakness)
  ghostWound: string; // A "Ghost" (a painful past memory)
  verbalFootprint: string; // Unique voice and rhythm so they never sound the same
}

export interface WorldRule {
  systemName: string;
  operationalLaw: string; // How magic or future tech works
  costOrLimitation: string; // What is the limit?
  conflictEngine: string; // How the rules create an exciting problem that forces the hero into action
}

export interface StoryBeat {
  beatNumber: number;
  label: string;
  causalityType: 'therefore' | 'but'; // Connect every beat using "Therefore..." or "But..." instead of "And then..."
  summary: string;
  powerShift: string;
}

export interface GenesisDeliverableSpec {
  number: number;
  title: string;
  description: string;
  milestoneWeek: number;
}

export interface GenesisWeekSchedule {
  week: number;
  phaseNumber: 1 | 2 | 3 | 4;
  phaseTitle: string;
  phaseGoal: string;
  weekTitle: string;
  bigQuestion: string;
  days1To2: string;
  days3To4: string;
  day5Milestone: string;
  isPhaseCheckpoint: boolean;
  checkpointLabel?: string;
}

export interface GenesisSuccessCriterion {
  number: 1 | 2 | 3 | 4;
  title: string;
  question: string;
  evidenceExample: string;
}

export interface GenesisGamificationBadge {
  id: string;
  title: string;
  phase: string;
  xpReward: number;
  unlockCriteria: string;
}

export const GENESIS_DELIVERABLES: GenesisDeliverableSpec[] = [
  {
    number: 1,
    title: 'Your Universe Guide (Story Bible)',
    description:
      'The ultimate handbook for your world! It holds your character designs, world rules, maps, 15-step Story Map, and art files.',
    milestoneWeek: 3
  },
  {
    number: 2,
    title: 'A 3-Scene Movie Script',
    description:
      'Written and formatted just like a real Hollywood screenplay (8–10 pages across Scene 1, Scene 2, and Scene 3 with Scene Headings, Action Lines, Character Lines, and subtext).',
    milestoneWeek: 6
  },
  {
    number: 3,
    title: 'A Mini-Movie / Pitch Trailer',
    description:
      'An exciting video preview that brings your story to life with your own art, voice acting (or live table-read / captioned stems for under-13 safeguarding), sound effects (Foley), and music!',
    milestoneWeek: 12
  }
];

export const GENESIS_12_WEEK_ROADMAP: GenesisWeekSchedule[] = [
  {
    week: 1,
    phaseNumber: 1,
    phaseTitle: 'Phase 1: Building Your World (Weeks 1–3)',
    phaseGoal: 'Create unforgettable characters, invent the rules of your world, and map out your full story!',
    weekTitle: 'Week 1: Inside Your Character’s Mind',
    bigQuestion: 'How do a character’s flaws and secret wishes change the choices they make when they are in trouble?',
    days1To2:
      'Days 1–2 (10 Hours Total): Turn your character drawings into real personalities! Go deeper than how they look. What do they Want (their outside goal) vs. what do they Need (how they must grow inside)?',
    days3To4:
      'Days 3–4: Give your hero a "Flaw" (a weakness) and a "Ghost" (a painful past memory). Then, create a Rival whose beliefs are the exact opposite of your hero’s to create instant drama!',
    day5Milestone:
      'Day 5 Milestone: Write a 500-word argument between your hero and their rival about something small (like a broken tool). Show their deeper clash of beliefs without having them say it directly!',
    isPhaseCheckpoint: false
  },
  {
    week: 2,
    phaseNumber: 1,
    phaseTitle: 'Phase 1: Building Your World (Weeks 1–3)',
    phaseGoal: 'Create unforgettable characters, invent the rules of your world, and map out your full story!',
    weekTitle: 'Week 2: World Rules & The Big Problem',
    bigQuestion: 'How can the rules of your world create an exciting problem that forces your hero into action?',
    days1To2:
      'Days 1–2 (10 Hours Total): Set the rules and design the look of your world! If there is magic or future tech, how does it work, and what is the limit? Map out the main locations and local culture.',
    days3To4:
      'Days 3–4: Create the "Inciting Incident"—the spark that starts the story! Design a sudden danger that hits your hero right in their biggest weakness and forces them out of their normal life.',
    day5Milestone:
      'Day 5 Milestone: Finish your "World Rules Guide" (with a rough map of your main location) and write three different ways your story could start. Pick the most exciting one!',
    isPhaseCheckpoint: false
  },
  {
    week: 3,
    phaseNumber: 1,
    phaseTitle: 'Phase 1: Building Your World (Weeks 1–3)',
    phaseGoal: 'Create unforgettable characters, invent the rules of your world, and map out your full story!',
    weekTitle: 'Week 3: Mapping the Story & Locking Your Story Bible',
    bigQuestion: 'How do we pace our story like a rollercoaster so every scene pushes the action forward?',
    days1To2:
      'Days 1–2 (10 Hours Total): Learn how great movies are built! Map out the big moments: Plot Point 1 (the adventure begins), the Midpoint (your hero starts fighting back), the Lowest Point (all hope seems lost), and the Climax (the final showdown). Connect every beat using "Therefore..." or "But..." instead of "And then..."',
    days3To4:
      'Days 3–4: Put all your character sheets, world rules, maps, and your 15-step Story Map into one clean, awesome digital Story Bible.',
    day5Milestone:
      'Day 5 Milestone (Phase 1 Checkpoint): Review your world with peers and mentors to fix any plot holes—and lock in your final Story Bible!',
    isPhaseCheckpoint: true,
    checkpointLabel: 'Phase 1 Checkpoint: Lock Your Final Story Bible'
  },
  {
    week: 4,
    phaseNumber: 2,
    phaseTitle: 'Phase 2: Writing the Movie Script (Weeks 4–6)',
    phaseGoal: 'Learn pro scriptwriting, write hidden meanings into dialogue, and finish your 3-scene screenplay.',
    weekTitle: 'Week 4: Pro Script Formatting & Hidden Meaning (Subtext)',
    bigQuestion: 'How do we show action visually and make characters say what they want without saying it out loud?',
    days1To2:
      'Days 1–2 (10 Hours Total): Learn the building blocks of a pro script: Scene Headings (where and when), Action Lines (writing only what the audience can see and hear), and Character Lines. Practice writing action with zero dialogue.',
    days3To4:
      'Days 3–4: Fix "too obvious" dialogue! Learn subtext (hiding the real meaning beneath the words) and give every character a unique voice and rhythm so they never sound the same.',
    day5Milestone:
      'Day 5 Milestone: Write a 1-page silent action scene, plus a 1-page dialogue scene packed with hidden meaning and tension!',
    isPhaseCheckpoint: false
  },
  {
    week: 5,
    phaseNumber: 2,
    phaseTitle: 'Phase 2: Writing the Movie Script (Weeks 4–6)',
    phaseGoal: 'Learn pro scriptwriting, write hidden meanings into dialogue, and finish your 3-scene screenplay.',
    weekTitle: 'Week 5: Writing the First Draft (Scenes 1, 2 & 3)',
    bigQuestion: 'How do we keep the energy high when turning our outline into real script pages?',
    days1To2:
      'Days 1–2 (10 Hours Total): Write Scene 1 (set the mood, introduce your hero, and show their world) and Scene 2 (raise the stakes and bring in the main conflict).',
    days3To4:
      'Days 3–4: Write Scene 3 (the big confrontation, high-stakes action, or a shocking plot twist!) and the ending that leaves the audience wanting more.',
    day5Milestone:
      'Day 5 Milestone: Finish the full First Draft of your 3-Scene Script (Goal: 8–10 pages)!',
    isPhaseCheckpoint: false
  },
  {
    week: 6,
    phaseNumber: 2,
    phaseTitle: 'Phase 2: Writing the Movie Script (Weeks 4–6)',
    phaseGoal: 'Learn pro scriptwriting, write hidden meanings into dialogue, and finish your 3-scene screenplay.',
    weekTitle: 'Week 6: Polishing & Perfecting the Script',
    bigQuestion: 'How do pro writers edit their work to make every word powerful and clear?',
    days1To2:
      'Days 1–2 (10 Hours Total): Supercharge your action lines! Cut extra words and replace weak verbs with strong, exciting action words so the script reads just like a fast-paced movie.',
    days3To4:
      'Days 3–4: Table Read! Read your script out loud with classmates to test how the dialogue flows and fix any awkward lines.',
    day5Milestone:
      'Day 5 Milestone (Phase 2 Checkpoint): Lock the Final Script! Export a clean, ready-to-produce screenplay package.',
    isPhaseCheckpoint: true,
    checkpointLabel: 'Phase 2 Checkpoint: Lock the Final Script'
  },
  {
    week: 7,
    phaseNumber: 3,
    phaseTitle: 'Phase 3: Pre-Production, Art & Sound Prep (Weeks 7–9)',
    phaseGoal: 'Draw the storyboards, create the final art, record the voices, and build your rough movie cut!',
    weekTitle: 'Week 7: Storyboarding & Camera Angles',
    bigQuestion: 'How do camera angles and shot choices show how a character feels without using words?',
    days1To2:
      'Days 1–2 (10 Hours Total): Think like a movie director! Learn camera shots (Wide Shots for scale, Medium Shots for conversations, Close-Ups for big emotions) and camera moves (Pans, Tilts, Tracking).',
    days3To4:
      'Days 3–4: Turn your script into rough Storyboard drawings. Make sure the action is easy to follow and characters look in the right direction from shot to shot.',
    day5Milestone:
      'Day 5 Milestone: Complete at least 30 Storyboard frames for your movie scenes!',
    isPhaseCheckpoint: false
  },
  {
    week: 8,
    phaseNumber: 3,
    phaseTitle: 'Phase 3: Pre-Production, Art & Sound Prep (Weeks 7–9)',
    phaseGoal: 'Draw the storyboards, create the final art, record the voices, and build your rough movie cut!',
    weekTitle: 'Week 8: Creating the Final Art Assets',
    bigQuestion: 'How do we turn our character sketches into polished art ready for animation and video?',
    days1To2:
      'Days 1–2 (10 Hours Total): Choose your art style (2D digital art, mixed media, or 3D setups). Make a checklist (Asset Manifest) of everything you need: characters, facial expressions, backgrounds, and props.',
    days3To4:
      'Days 3–4: Draw and paint the final backgrounds and character poses to match the camera angles in your Week 7 storyboards.',
    day5Milestone:
      'Day 5 Milestone: Finish your Production Art Pack (Characters with transparent backgrounds and fully painted environments).',
    isPhaseCheckpoint: false
  },
  {
    week: 9,
    phaseNumber: 3,
    phaseTitle: 'Phase 3: Pre-Production, Art & Sound Prep (Weeks 7–9)',
    phaseGoal: 'Draw the storyboards, create the final art, record the voices, and build your rough movie cut!',
    weekTitle: 'Week 9: Voice Acting, Sound Prep & The Animatic',
    bigQuestion: 'How do voices and a rough test video help us fix timing before final production?',
    days1To2:
      'Days 1–2 (10 Hours Total): Make a Sound List (Voices, Atmosphere, Sound Effects, Music). Step up to the mic to record and clean up clear, emotional Voice Tracks for your characters! (Safeguarding note: for under-13s, use live classroom table reads, text dialogue cards, or teacher-operated audio stems—never under-13 voice capture; any recording of older learners requires school consent and is never stored by the platform.)',
    days3To4:
      'Days 3–4: Put your storyboard drawings and voice recordings together on a video timeline to build your Animatic (rough movie cut). Test and fix the timing of every shot.',
    day5Milestone:
      'Day 5 Milestone (Phase 3 Checkpoint): Export a locked, perfectly timed Production Animatic!',
    isPhaseCheckpoint: true,
    checkpointLabel: 'Phase 3 Checkpoint: Export Locked Production Animatic'
  },
  {
    week: 10,
    phaseNumber: 4,
    phaseTitle: 'Phase 4: Final Production, Polish & Launch! (Weeks 10–12)',
    phaseGoal: 'Bring the visuals to life, mix the sound, polish the film, and pitch your universe to the world!',
    weekTitle: 'Week 10: Final Art Assembly & Multi-Layer Sound Mixing',
    bigQuestion: 'How do camera motion and layered sound effects make 2D art feel like a living, breathing movie?',
    days1To2:
      'Days 1–2 (10 Hours Total): Swap out your rough storyboard drawings in the video timeline with your finished character art and backgrounds! Add digital camera moves (zooms, pans, screen shakes, and background blur).',
    days3To4:
      'Days 3–4: Layer in background atmosphere, custom sound effects (Foley like footsteps or sci-fi beeps), and music! Adjust volume levels (ducking) so the music never drowns out the voices.',
    day5Milestone:
      'Day 5 Milestone: Picture & Sound Lock! All final visuals, camera moves, sound effects, and music are in place.',
    isPhaseCheckpoint: false
  },
  {
    week: 11,
    phaseNumber: 4,
    phaseTitle: 'Phase 4: Final Production, Polish & Launch! (Weeks 10–12)',
    phaseGoal: 'Bring the visuals to life, mix the sound, polish the film, and pitch your universe to the world!',
    weekTitle: 'Week 11: Final Mastering, Color Grading & Pro Portfolio',
    bigQuestion: 'How do final color tweaks and a behind-the-scenes portfolio show off our skills like a pro?',
    days1To2:
      'Days 1–2 (10 Hours Total): Balance the final audio mix and add Color Grading (color filters to unify the mood), movie titles, credits, and clean subtitles. Export your Final Master Video!',
    days3To4:
      'Days 3–4: Build your Pro Portfolio! Pick your best sketches, script pages, and storyboard-to-final-shot comparisons, and write a short "Behind-the-Scenes" story of how you built your world.',
    day5Milestone:
      'Day 5 Milestone: Final Master Video rendered + Online Portfolio / Showcase Document ready to share!',
    isPhaseCheckpoint: false
  },
  {
    week: 12,
    phaseNumber: 4,
    phaseTitle: 'Phase 4: Final Production, Polish & Launch! (Weeks 10–12)',
    phaseGoal: 'Bring the visuals to life, mix the sound, polish the film, and pitch your universe to the world!',
    weekTitle: 'Week 12: The Big Pitch & Grand Showcase!',
    bigQuestion: 'How do we pitch our original movie universe to an audience and celebrate how much we’ve grown?',
    days1To2:
      'Days 1–2 (10 Hours Total): Build a punchy 5-Minute Pitch Presentation covering your core story idea, characters, world rules, and your final video trailer.',
    days3To4:
      'Days 3–4: Practice your pitch out loud! Reflect on the challenges you beat, the software you mastered, and the pro habits you learned over the 12 weeks.',
    day5Milestone:
      'Day 5 Milestone: THE GRAND SHOWCASE! Present your Story Bible, Script, and Animated Trailer to mentors, friends, and family!',
    isPhaseCheckpoint: true,
    checkpointLabel: 'Grand Showcase: Present Story Bible, Script & Animated Trailer'
  }
];

export const GENESIS_SUCCESS_CHECKLIST: GenesisSuccessCriterion[] = [
  {
    number: 1,
    title: 'Strong World Rules',
    question: 'Do the rules of your universe make sense? Do they naturally create exciting problems for your characters?',
    evidenceExample: 'World Rules Guide with clear magic/tech limits, main location map, and 3 Inciting Incident starts.'
  },
  {
    number: 2,
    title: 'Pro Script Formatting',
    question: 'Does your script look like a real industry screenplay with clear action and clever, subtextual dialogue?',
    evidenceExample: '8–10 page 3-Scene Movie Script using Scene Headings, visual/audible Action Lines, and subtext.'
  },
  {
    number: 3,
    title: 'Smart Organization & Planning',
    question: 'Did you keep your files organized, hit your weekly milestones, and follow the step-by-step production process?',
    evidenceExample: 'Complete digital Story Bible, 15-step Story Map ("Therefore/But"), Asset Manifest, and Pro Portfolio.'
  },
  {
    number: 4,
    title: 'Smooth Sight & Sound',
    question: 'Do the camera shots make sense together? Are the voices clear, well-paced, and backed up by immersive sound design?',
    evidenceExample: '30+ Storyboard frames, timed Animatic, and Final Master Video with camera moves, Foley, audio ducking, and color grading.'
  }
];

export const GENESIS_GAMIFICATION_BADGES: GenesisGamificationBadge[] = [
  {
    id: 'badge-genesis-mind',
    title: 'Inside the Character’s Mind',
    phase: 'Week 1 (Explore)',
    xpReward: 250,
    unlockCriteria: 'Define Hero Want vs. Need, Flaw, Ghost, Rival, and write the 500-word broken-tool subtext argument.'
  },
  {
    id: 'badge-genesis-world-rules',
    title: 'World Rules Architect',
    phase: 'Week 2 (Explore)',
    xpReward: 300,
    unlockCriteria: 'Finish the World Rules Guide with tech/magic limits, location map, and 3 Inciting Incident starts.'
  },
  {
    id: 'badge-genesis-story-bible',
    title: 'Phase 1 Checkpoint: Story Bible Locked',
    phase: 'Week 3 (Empathise)',
    xpReward: 400,
    unlockCriteria: 'Connect all 15 story beats with "Therefore..." or "But..." and lock the final digital Story Bible.'
  },
  {
    id: 'badge-genesis-subtext',
    title: 'Subtext & Silent Action Pro',
    phase: 'Week 4 (Define)',
    xpReward: 350,
    unlockCriteria: 'Write a 1-page silent action scene and a 1-page dialogue scene packed with hidden meaning and tension.'
  },
  {
    id: 'badge-genesis-script-lock',
    title: 'Phase 2 Checkpoint: Final Script Locked',
    phase: 'Weeks 5–6 (Ideate)',
    xpReward: 450,
    unlockCriteria: 'Draft Scenes 1, 2 & 3 (8–10 pages), supercharge action verbs, run a classroom Table Read, and lock the script.'
  },
  {
    id: 'badge-genesis-animatic',
    title: 'Phase 3 Checkpoint: Production Animatic',
    phase: 'Weeks 7–9 (Prototype)',
    xpReward: 500,
    unlockCriteria: 'Complete 30+ Storyboard frames, finish the Production Art Pack (transparent PNGs), and export a timed Animatic.'
  },
  {
    id: 'badge-genesis-showcase',
    title: 'Grand Showcase Universe Creator',
    phase: 'Weeks 10–12 (Test & Share)',
    xpReward: 600,
    unlockCriteria: 'Complete Picture & Sound Lock with Foley ducking, Color Grading, Pro Portfolio, and the 5-Minute Grand Showcase Pitch!'
  }
];

export const GENESIS_CHARACTERS_FIXTURE: CharacterProfile[] = [
  {
    name: 'Kaelen Vance',
    role: 'protagonist',
    externalWant: 'Extract the blackbox memory core from the sunken orbital relay to clear their mother’s treason conviction.',
    internalNeed: 'Acknowledge that systemic corruption cannot be solved by lone-wolf isolation; learn to trust allies.',
    fatalFlaw: 'Hyper-vigilant mistrust; assumes any shared information will be used against them.',
    ghostWound: 'Watched their mentor sign an untraceable guild clause that erased their family’s research.',
    verbalFootprint: 'Abrupt, clipped technical jargon; uses repair diagnostics to hide vulnerability.'
  },
  {
    name: 'Mira Solis',
    role: 'foil_rival',
    externalWant: 'Secure salvager guild jurisdiction over the orbital relay salvage zone for local district workers.',
    internalNeed: 'Accept that rigid rules cannot protect everyone when the system itself is broken.',
    fatalFlaw: 'Strict rulebook dogmatism; believes following procedure always equals doing the right thing.',
    ghostWound: 'Survived a hull breach by following protocol while teammates who improvised were stranded.',
    verbalFootprint: 'Polite rule citations and calm pauses designed to make the other person speak first.'
  }
];

export const GENESIS_WORLD_RULES_FIXTURE: WorldRule[] = [
  {
    systemName: 'Atmospheric Scintillation Shields',
    operationalLaw: 'Kinetic barriers absorb high-speed debris using superconducting plasma fields.',
    costOrLimitation: 'Shield emitters drain battery cells rapidly underwater or in heavy mist and require a 45-second cooldown.',
    conflictEngine: 'Heroes must drop their defensive shields to fire sonar beacons or swim through flooded corridors.'
  },
  {
    systemName: 'Neural Echo Core',
    operationalLaw: 'Memory cores record the last 120 seconds of a ship’s bridge telemetry before power failure.',
    costOrLimitation: 'Data degrades by 20% every time it is played back.',
    conflictEngine: 'Every replay destroys part of the evidence, forcing high-stakes choices on when to inspect the clue.'
  }
];

export const STORYTELLING_PROGRAM: PblProgram = {
  id: 'storytelling-genesis-2026',
  title: 'Project "Genesis Engine": Build Your Own Movie Universe!',
  subtitle:
    '12 Weeks (5 days a week, 2 hours a day = 120 Hours of Creation) to build Your Universe Guide (Story Bible), a 3-Scene Movie Script, and a Mini-Movie / Pitch Trailer!',
  status: 'provisional_prototype',
  theme: 'Movie Universe Creation, Hollywood Screenwriting, Storyboarding & Animated Trailer Production',
  drivingQuestion:
    'How can we build an original movie universe from scratch—complete with a Story Bible, a formatted 3-Scene Movie Script, and a Mini-Movie / Pitch Trailer—where character flaws, world rules, camera angles, and layered sound bring our story to life?',
  realProblem: {
    type: 'both',
    summary:
      'Young creators have vivid ideas for characters and worlds, but often get stuck turning sketches and daydreams into a complete, well-paced story. Project "Genesis Engine" guides students step by step over 12 weeks (120 hours) like a real studio creative team—from character psychology and world rules to a formatted 3-scene screenplay, 30+ storyboards, an animatic, multi-layer Foley sound mixing, and a Grand Showcase pitch!',
    peopleImpact:
      'Builds deep empathy ("Want vs. Need", "Flaw", and "Ghost"), clear communication, subtextual writing, visual directing, and disciplined project organization.',
    environmentalImpact:
      'Challenges creators to design believable world rules, resource limits, local cultures, and maps that naturally generate meaningful conflicts for their characters.'
  },
  targetAgeRange: 'Ages 9–17 (Primary through Upper Secondary: 9–11, 12–14, 15–17)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'Digital Audio Workstation (DAW): Audacity / GarageBand / Reaper for multi-layer sound mixing and audio ducking',
      'USB Microphone for older learners with prior school consent (teacher-operated; never stored on platform; under-13s use live unrecorded table reads, caption cards, or teacher-recorded stems)',
      'Studio headphones for balancing Voices, Atmosphere, Foley Sound Effects, and Music'
    ],
    sensorsAndActuators: [
      'Digital drawing tablet, stylus, or paper sketchbooks for Character Sheets, World Maps, and 30+ Storyboard frames',
      'Everyday Foley Sound Props (footsteps, metal tools, cloth, sci-fi beeps) for custom sound effects'
    ],
    fabricationMaterials: [
      'Your Universe Guide (Story Bible) binder or digital template (Character Designs, World Rules Guide, Location Map, 15-Step Story Map)',
      'Index cards or corkboard for the 15-Step Story Map connected by "Therefore..." and "But..."',
      '16:9 Storyboard frame sheets (30+ frames across Wide Shots, Medium Shots, and Close-Ups)'
    ],
    softwareAndTools: [
      'Hollywood Screenplay Editor: WriterDuet / Highland 2 / Fountain / Google Docs screenplay template',
      '2D / 3D Art & Asset Creation: Krita / Procreate / Canva / Blender (characters with transparent backgrounds & painted environments)',
      'Video Timeline & Mastering: CapCut / DaVinci Resolve / iMovie / Premiere (Animatic, camera zooms/pans/shakes, color grading, titles, and subtitles)'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Constructive Story Studio Culture: Creating a character’s "Flaw" and "Ghost" (painful past memory) requires kindness and respect—critique the story rules and script pacing, never personal taste.',
      'Safe Headphone Volume: Keep audio mixing headphone levels comfortable (<80 dB) when layering Foley sound effects and music.',
      'Under-13 Safeguarding & Consent Rule: Never use voice recording or speech-to-text for under-13 learners (use live classroom table reads, speech-bubble caption tracks, or teacher-operated Foley stems). Any audio/video recording of older learners requires prior school consent and must never be stored by the platform.'
    ],
    pedagogicalScaffolding: [
      '"Therefore..." or "But..." Rule (Week 3): Never connect story beats with "And then...". Every beat in the 15-Step Story Map must push the rollercoaster forward using "Therefore..." or "But...".',
      'Show, Don’t Tell & Subtext (Weeks 1 & 4): Action Lines may only include what the audience can see and hear. In dialogue, hide the real meaning beneath the words (like arguing over a broken tool).',
      'Three Phase Checkpoints before Launch: Enforce the Week 3 Checkpoint (Lock Story Bible), Week 6 Checkpoint (Lock Final 3-Scene Script), and Week 9 Checkpoint (Export Locked Production Animatic) so nobody rushes into final video editing without a solid plan.',
      'Reward Process Over Personal Taste: Grade students using the 4-part Success Checklist (Strong World Rules, Pro Script Formatting, Smart Organization & Planning, Smooth Sight & Sound).'
    ],
    aiEthicsRules: [
      'Student-Created Universe & Script: Learners invent their own characters, world rules, 3-scene script, and artwork. AI may only be used as a brainstorming partner to test plot holes or practice table-read timing.',
      'Log AI Provenance: Whenever AI is consulted, students record what they asked, what AI suggested, and how they rewrote it in their own words.'
    ],
    differentiationNotes: [
      'Ages 9–11 (Primary): Illustrated character cards, illustrated World Rules map, 6-to-15 step story map, 3-scene comic/script hybrid, live unrecorded classroom table read with prop Foley, and picture-book animatic.',
      'Ages 12–14 (Middle Secondary): Full Character Want/Need/Flaw/Ghost profiles, 15-step Story Bible, 8–10 page 3-Scene Movie Script, 30 storyboard frames, and multi-layer animatic trailer.',
      'Ages 15–17 (Upper Secondary): Industry Fountain screenplay formatting, subtextual dialogue polish, transparent multi-plane 2D/3D Production Art Pack, 4-track audio mix with sidechain ducking, color grading, and Behind-the-Scenes Pro Portfolio.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-genesis-world-rules',
      metric: '1. Strong World Rules & Story Bible (Phase 1 Checkpoint)',
      target: 'Completed Universe Guide (Story Bible) with Hero/Rival sheets (Want, Need, Flaw, Ghost), 500-word subtext argument, World Rules Guide + Map, 3 Inciting Incident starts, and 15-Step Story Map using "Therefore/But"',
      verificationMethod: 'Week 3 Day 5 Milestone peer & mentor Story Bible checkpoint review'
    },
    {
      id: 'metric-genesis-script-format',
      metric: '2. Pro Script Formatting & Subtext (Phase 2 Checkpoint)',
      target: '1-page silent action scene + 1-page subtext dialogue scene + locked 8–10 page 3-Scene Movie Script after classroom Table Read',
      verificationMethod: 'Week 6 Day 5 Milestone Final Script screenplay package audit'
    },
    {
      id: 'metric-genesis-planning-assets',
      metric: '3. Smart Organization & Pre-Production Assets (Phase 3 Checkpoint)',
      target: 'At least 30 Storyboard frames + Asset Manifest + Production Art Pack (transparent character PNGs & painted backgrounds) + locked Production Animatic',
      verificationMethod: 'Week 9 Day 5 Milestone Production Animatic timeline review'
    },
    {
      id: 'metric-genesis-sight-sound',
      metric: '4. Smooth Sight, Sound & Grand Showcase Pitch (Phase 4 Launch)',
      target: 'Final Master Video (camera moves, Foley, audio ducking, color grading, titles, subtitles) + Behind-the-Scenes Pro Portfolio + 5-Minute Grand Showcase Pitch',
      verificationMethod: 'Week 12 Day 5 Milestone Grand Showcase presentation and 4-point Success Checklist rubric'
    }
  ],
  assumptions: [
    {
      id: 'asmp-genesis-schedule',
      domain: '12-Week / 120-Hour Studio Schedule',
      assumption: 'Program runs for 12 weeks at 5 days a week, 2 hours a day (10 hours/week = 120 hours total creation time).',
      ownerVerificationNeeded: 'Confirm 5-day x 2-hour studio block allocation with school timetable coordinator.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    },
    {
      id: 'asmp-genesis-media-tools',
      domain: 'Art, Audio & Video Editing Tools',
      assumption: 'Students have access to digital drawing/storyboard tools and timeline video/audio editors (e.g., CapCut, DaVinci Resolve, Krita, Audacity).',
      ownerVerificationNeeded: 'Confirm media lab tablet/computer software installation and safeguarding consent procedures.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    }
  ],
  phases: [
    {
      id: 'explore',
      title: 'Phase 1A: Building Your World — Characters & World Rules (Weeks 1–2)',
      strap: 'Inside Your Character’s Mind (Want, Need, Flaw, Ghost, Rival) & World Rules Guide',
      weeks: [1, 2],
      goal: 'Create unforgettable characters with deep personalities (Want vs. Need, Flaw, Ghost, and a Rival), write a 500-word subtextual argument, invent the rules and limits of your world, and test three ways your story could start!',
      tasks: [
        'Week 1 Days 1–2 (10h Total): Turn character drawings into real personalities—define what they Want (outside goal) vs. what they Need (how they must grow inside).',
        'Week 1 Days 3–4: Give your hero a "Flaw" (weakness) and a "Ghost" (painful past memory), and create a Rival whose beliefs are the exact opposite of your hero’s.',
        'Week 1 Day 5 Milestone: Write a 500-word argument between your hero and their rival about something small (like a broken tool) showing their deeper clash of beliefs without saying it directly!',
        'Week 2 Days 1–2 (10h Total): Set the rules and design the look of your world (how magic or future tech works, what the limit is, main locations, and local culture).',
        'Week 2 Days 3–4: Create the "Inciting Incident"—a sudden danger that hits your hero right in their biggest weakness and forces them out of normal life.',
        'Week 2 Day 5 Milestone: Finish your "World Rules Guide" (with a rough map of your main location) and write three different ways your story could start. Pick the most exciting one!'
      ],
      evidence: [
        'Hero & Rival Character Sheets (Want, Need, Flaw, Ghost & Opposite Beliefs)',
        'Week 1 Day 5 Milestone: 500-Word Broken-Tool Argument (Subtext Clash)',
        'Week 2 Day 5 Milestone: "World Rules Guide" + Rough Map of Main Location',
        'Three Different Story Starts (Inciting Incidents) with Top Choice Selected'
      ],
      aiPromptStarters: [
        'Here is my hero’s Want, Need, Flaw, and Ghost: [paste notes]. Help me brainstorm a Rival whose opposite beliefs will create instant drama!',
        'Here is the magic/future tech rule in my world: [paste rule]. What is a fair limit or cost that prevents my hero from solving every problem too easily?'
      ],
      competencies: ['ct-01', 'ctps-01', 'sea-01'],
      stretchCompetencies: ['ec-01'],
      sessions: [
        {
          sessionNumber: 1,
          week: 1,
          title: 'Week 1 (Days 1–2): Inside Your Character’s Mind — Want vs. Need',
          durationMin: 300,
          learningGoal: 'Turn character drawings into real personalities by defining what they Want (outside goal) vs. what they Need (inside growth).',
          activities: [
            'Big Question Inquiry: How do a character’s flaws and secret wishes change the choices they make when they are in trouble?',
            'Go deeper than how your hero looks: map their Outside Goal (Want) vs. their Inside Growth (Need).',
            'Sketch and annotate your hero’s personality traits, habits, and secret wishes.'
          ],
          learnerChoices: {
            question: 'What kind of conflict exists between your hero’s Want and their Need?',
            options: [
              { id: 'opt-wn-glory', label: 'Wants Fame/Victory vs. Needs Teamwork', description: 'Chases solo glory but must learn to trust others.' },
              { id: 'opt-wn-safety', label: 'Wants Total Control vs. Needs Courage', description: 'Hides behind strict rules/tech but must take a leap of faith.' },
              { id: 'opt-wn-revenge', label: 'Wants Payback vs. Needs Forgiveness/Truth', description: 'Blinded by a past wrong until they uncover the bigger picture.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your Hero Character Sheet showing their drawing, Outside Want, and Inside Need.',
            targetCompetencies: ['ct-01', 'sea-01']
          },
          reflectionPrompt: 'How do a character’s flaws and secret wishes change the choices they make when they are in trouble?',
          teacherTips: 'Remind students that a great hero is not perfect—what they Want on the outside should clash with what they Need to learn on the inside.'
        },
        {
          sessionNumber: 2,
          week: 1,
          title: 'Week 1 (Days 3–5): Flaw, Ghost, Rival & The 500-Word Argument Milestone',
          durationMin: 300,
          learningGoal: 'Give your hero a Flaw and a Ghost, create an opposite Rival, and write a 500-word argument about something small.',
          activities: [
            'Days 3–4: Give your hero a "Flaw" (a weakness) and a "Ghost" (a painful past memory).',
            'Create a Rival whose beliefs are the exact opposite of your hero’s to create instant drama!',
            'Day 5 Milestone: Write a 500-word argument between your hero and their rival about something small (like a broken tool). Show their deeper clash of beliefs without having them say it directly!'
          ],
          learnerChoices: {
            question: 'What small everyday item will your hero and rival argue about in your 500-word milestone?',
            options: [
              { id: 'opt-arg-tool', label: 'A Broken Tool or Gadget', description: 'Shows who values careful repair vs. reckless speed.' },
              { id: 'opt-arg-map', label: 'A Torn Map or Locked Door', description: 'Shows who trusts rules vs. who takes risky shortcuts.' },
              { id: 'opt-arg-supply', label: 'The Last Ration or Spare Battery', description: 'Shows who puts the mission first vs. protecting a friend.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload your Hero Flaw/Ghost profile, Rival sheet, and your 500-word argument about something small.',
            targetCompetencies: ['ec-01', 'ctps-01']
          },
          reflectionPrompt: 'How did arguing about something small (like a broken tool) reveal your hero and rival’s deeper beliefs without stating them directly?',
          teacherTips: 'If a character says "I am mad because our beliefs are opposite," have the student rewrite it so the frustration stays focused on the broken object!'
        },
        {
          sessionNumber: 3,
          week: 2,
          title: 'Week 2 (Days 1–2): World Rules, Tech/Magic Limits & Local Culture',
          durationMin: 300,
          learningGoal: 'Set the rules and design the look of your world, including how magic or future tech works and what its limit is.',
          activities: [
            'Big Question Inquiry: How can the rules of your world create an exciting problem that forces your hero into action?',
            'Days 1–2 (10 Hours Total): Set the rules and design the look of your world! If there is magic or future tech, how does it work, and what is the limit?',
            'Map out the main locations and local culture of your movie universe.'
          ],
          learnerChoices: {
            question: 'What kind of rule and limit powers your movie universe?',
            options: [
              { id: 'opt-rule-tech', label: 'Future Tech with Battery/Heat Limits', description: 'High-tech gear that overheats or drains scarce energy.' },
              { id: 'opt-rule-magic', label: 'Elemental/Ancient Magic with a Price', description: 'Every spell or ability costs stamina, memory, or rare materials.' },
              { id: 'opt-rule-society', label: 'Natural/Social World Law', description: 'Extreme weather, floating islands, or strict city guild rules.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your World Rules notes (how it works + the limit) and location/culture concepts.',
            targetCompetencies: ['ct-02', 'ctps-02']
          },
          reflectionPrompt: 'Why is the LIMIT of magic or future tech even more exciting for a movie than what the power can do?',
          teacherTips: 'Ensure every superpower or future gadget has a clear limit so the hero cannot solve the story in 10 seconds.'
        },
        {
          sessionNumber: 4,
          week: 2,
          title: 'Week 2 (Days 3–5): The Inciting Incident & World Rules Guide Milestone',
          durationMin: 300,
          learningGoal: 'Design the Inciting Incident and finish the World Rules Guide with a location map and three story starts.',
          activities: [
            'Days 3–4: Create the "Inciting Incident"—the spark that starts the story! Design a sudden danger that hits your hero right in their biggest weakness and forces them out of their normal life.',
            'Day 5 Milestone: Finish your "World Rules Guide" (with a rough map of your main location).',
            'Write three different ways your story could start and pick the most exciting one!'
          ],
          learnerChoices: {
            question: 'Which of your three story starts hits your hero right in their biggest weakness?',
            options: [
              { id: 'opt-start-1', label: 'Start 1: Sudden System Failure / Crisis', description: 'An immediate physical danger in the main location.' },
              { id: 'opt-start-2', label: 'Start 2: A Stolen or Broken Discovery', description: 'Something precious vanishes or reveals a hidden secret.' },
              { id: 'opt-start-3', label: 'Start 3: Arrival of the Rival', description: 'The Rival challenges the hero’s normal life in front of everyone.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your finished "World Rules Guide", rough map of your main location, and your 3 story starts.',
            targetCompetencies: ['ctps-03', 'ec-02']
          },
          reflectionPrompt: 'Why did the story start you picked force your hero out of their normal life better than the other two?',
          teacherTips: 'Check that the Inciting Incident targets the hero’s specific Flaw from Week 1.'
        }
      ]
    },
    {
      id: 'empathise',
      title: 'Phase 1B: Mapping the Story & Locking Your Story Bible (Week 3)',
      strap: 'Plot Point 1, Midpoint, Lowest Point, Climax & The 15-Step Story Map ("Therefore / But")',
      weeks: [3, 3],
      goal: 'Pace your story like a rollercoaster using "Therefore..." or "But...", assemble your 15-step Story Map and character/world files into a digital Story Bible, and pass the Phase 1 Checkpoint!',
      tasks: [
        'Week 3 Days 1–2 (10h Total): Map out the big moments: Plot Point 1 (the adventure begins), the Midpoint (your hero starts fighting back), the Lowest Point (all hope seems lost), and the Climax (the final showdown).',
        'Connect every beat using "Therefore..." or "But..." instead of "And then...".',
        'Week 3 Days 3–4: Put all your character sheets, world rules, maps, and your 15-step Story Map into one clean, awesome digital Story Bible.',
        'Week 3 Day 5 Milestone (Phase 1 Checkpoint): Review your world with peers and mentors to fix any plot holes—and lock in your final Story Bible!'
      ],
      evidence: [
        '15-Step Story Map connected with "Therefore..." and "But..."',
        'Assembled Digital Story Bible (Character Sheets, World Rules, Maps, 15-Step Story Map)',
        'Week 3 Day 5 Milestone (Phase 1 Checkpoint): Peer & Mentor Plot-Hole Review + Locked Story Bible'
      ],
      aiPromptStarters: [
        'Here is my 15-step Story Map: [paste beats]. Spot any places where I accidentally used "And then..." and help me connect them with "Therefore..." or "But..."!',
        'Act as a movie mentor reviewing my Story Bible: what plot holes should I fix before I lock Phase 1?'
      ],
      competencies: ['ct-03', 'ctps-04', 'sdl-01'],
      stretchCompetencies: ['lc-01'],
      sessions: [
        {
          sessionNumber: 5,
          week: 3,
          title: 'Week 3 (Days 1–2): Rollercoaster Pacing & "Therefore / But" Story Mapping',
          durationMin: 300,
          learningGoal: 'Map Plot Point 1, the Midpoint, the Lowest Point, and the Climax using "Therefore..." or "But...".',
          activities: [
            'Big Question Inquiry: How do we pace our story like a rollercoaster so every scene pushes the action forward?',
            'Days 1–2 (10 Hours Total): Map out Plot Point 1 (the adventure begins), the Midpoint (your hero starts fighting back), the Lowest Point (all hope seems lost), and the Climax (the final showdown).',
            'Test every link in your 15-step Story Map: replace every "And then..." with "Therefore..." or "But...".'
          ],
          learnerChoices: {
            question: 'What happens at your story’s Midpoint when your hero starts fighting back?',
            options: [
              { id: 'opt-mid-plan', label: 'Hero Launches a Bold New Plan', description: 'Stops running away and takes charge of the mission.' },
              { id: 'opt-mid-secret', label: 'Hero Uncovers the True Rule/Secret', description: 'Discovers how the world rule really works and uses it.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your 15-Step Story Map showing Plot Point 1, Midpoint, Lowest Point, Climax, and "Therefore/But" connectors.',
            targetCompetencies: ['ct-03', 'ctps-04']
          },
          reflectionPrompt: 'How does connecting every beat with "Therefore..." or "But..." make your story feel like a rollercoaster instead of a list of random events?',
          teacherTips: 'Have students read their 15 beats aloud—if they say "and then", the class rings a bell and helps them find a "but" or "therefore"!'
        },
        {
          sessionNumber: 6,
          week: 3,
          title: 'Week 3 (Days 3–5): Digital Story Bible Assembly & Phase 1 Checkpoint',
          durationMin: 300,
          learningGoal: 'Compile your digital Story Bible, fix plot holes with peers and mentors, and lock Phase 1.',
          activities: [
            'Days 3–4: Put all your character sheets, world rules, maps, and your 15-step Story Map into one clean, awesome digital Story Bible.',
            'Day 5 Milestone (Phase 1 Checkpoint): Review your world with peers and mentors to fix any plot holes.',
            'Lock in your final Story Bible (Deliverable #1)!'
          ],
          learnerChoices: {
            question: 'What plot hole or improvement did you fix during your Phase 1 Checkpoint review?',
            options: [
              { id: 'opt-p1-rules', label: 'Tightened a World Rule Limit', description: 'Made sure the hero couldn’t escape the Lowest Point too easily.' },
              { id: 'opt-p1-motive', label: 'Sharpened the Rival’s Motivation', description: 'Made the Rival’s choices make complete sense from their point of view.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your locked Digital Story Bible (Deliverable #1) and peer/mentor review notes.',
            targetCompetencies: ['ec-03', 'sdl-01']
          },
          reflectionPrompt: 'What plot hole did a classmate or mentor help you spot before you started writing your movie script?',
          teacherTips: 'Celebrate the Phase 1 Checkpoint! Every student now holds their own Universe Guide (Story Bible).'
        }
      ]
    },
    {
      id: 'define',
      title: 'Phase 2A: Pro Script Formatting & Hidden Meaning / Subtext (Week 4)',
      strap: 'Scene Headings, Visual Action Lines, Character Lines & Subtextual Dialogue',
      weeks: [4, 4],
      goal: 'Learn the building blocks of a pro Hollywood screenplay (Scene Headings, Action Lines that only show what the audience can see and hear, and Character Lines), master subtext, and write a 1-page silent action scene plus a 1-page dialogue scene!',
      tasks: [
        'Week 4 Days 1–2 (10h Total): Learn Scene Headings (where and when), Action Lines (writing only what the audience can see and hear), and Character Lines. Practice writing action with zero dialogue.',
        'Week 4 Days 3–4: Fix "too obvious" dialogue! Learn subtext (hiding the real meaning beneath the words) and give every character a unique voice and rhythm so they never sound the same.',
        'Week 4 Day 5 Milestone: Write a 1-page silent action scene, plus a 1-page dialogue scene packed with hidden meaning and tension!'
      ],
      evidence: [
        'Pro Script Formatting Practice (Scene Headings, Action Lines, Character Lines)',
        'Week 4 Day 5 Milestone Part A: 1-Page Silent Action Scene (Zero Dialogue)',
        'Week 4 Day 5 Milestone Part B: 1-Page Dialogue Scene Packed with Hidden Meaning & Tension'
      ],
      aiPromptStarters: [
        'Check my 1-page silent action scene: did I accidentally write what the character is thinking instead of what the audience can SEE and HEAR?',
        'Here is a line of "too obvious" dialogue: [paste line]. Give me 3 ways my character could hide the real meaning using subtext!'
      ],
      competencies: ['ec-04', 'ct-04', 'ctps-07'],
      stretchCompetencies: ['lc-02'],
      sessions: [
        {
          sessionNumber: 7,
          week: 4,
          title: 'Week 4 (Days 1–2): Pro Script Formatting — Scene Headings & Visual Action Lines',
          durationMin: 300,
          learningGoal: 'Format Scene Headings, Action Lines (only what the audience can see and hear), and Character Lines, and write action with zero dialogue.',
          activities: [
            'Big Question Inquiry: How do we show action visually and make characters say what they want without saying it out loud?',
            'Days 1–2 (10 Hours Total): Learn the building blocks of a pro script: Scene Headings (INT./EXT. LOCATION - DAY/NIGHT), Action Lines (writing only what the audience can see and hear), and Character Lines.',
            'Practice writing an exciting action sequence with zero dialogue.'
          ],
          learnerChoices: {
            question: 'How will your character show fear or determination in your silent action scene without speaking?',
            options: [
              { id: 'opt-act-hands', label: 'Small Physical Details', description: 'Shaking hands, tightening grip on a tool, or holding breath.' },
              { id: 'opt-act-env', label: 'Interacting with the Environment', description: 'Racing against a closing door, flickering lights, or rising water.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Submit your formatted 1-Page Silent Action Scene (zero dialogue, only what the audience can see and hear).',
            targetCompetencies: ['ec-04', 'ctps-07']
          },
          reflectionPrompt: 'Why does writing a scene with zero dialogue make you think like a movie camera instead of a novelist?',
          teacherTips: 'Remind students: a movie camera cannot film "She remembers her past"—instead write what she looks at or does!'
        },
        {
          sessionNumber: 8,
          week: 4,
          title: 'Week 4 (Days 3–5): Fixing "Too Obvious" Dialogue, Subtext & Unique Voices',
          durationMin: 300,
          learningGoal: 'Replace "too obvious" dialogue with subtext, give every character a unique voice and rhythm, and finish the Week 4 Milestone.',
          activities: [
            'Days 3–4: Fix "too obvious" dialogue! Learn subtext (hiding the real meaning beneath the words).',
            'Give every character a unique voice and rhythm so they never sound the same (cover the character names—can you still tell who is speaking?).',
            'Day 5 Milestone: Finish your 1-page silent action scene, plus a 1-page dialogue scene packed with hidden meaning and tension!'
          ],
          learnerChoices: {
            question: 'How will you make your Hero and Rival sound completely different in your 1-page dialogue scene?',
            options: [
              { id: 'opt-voice-rhythm', label: 'Fast/Short vs. Calm/Polite Sentences', description: 'One speaks in quick bursts; the other speaks in calm, measured rules.' },
              { id: 'opt-voice-slang', label: 'Street/Tech Slang vs. Formal Vocabulary', description: 'Contrasting word choices that reflect where each character grew up.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload your Week 4 Day 5 Milestone: 1-Page Silent Action Scene + 1-Page Subtext Dialogue Scene.',
            targetCompetencies: ['ec-05', 'ct-04']
          },
          reflectionPrompt: 'How do we show action visually and make characters say what they want without saying it out loud?',
          teacherTips: 'Try the "Cover the Name Test": cover the character cues on the script page and see if classmates can guess who is speaking just from the rhythm!'
        }
      ]
    },
    {
      id: 'ideate',
      title: 'Phase 2B: Writing, Polishing & Locking Your 3-Scene Movie Script (Weeks 5–6)',
      strap: 'First Draft (Scenes 1, 2 & 3 — 8–10 Pages), Strong Action Verbs, Table Read & Phase 2 Checkpoint',
      weeks: [5, 6],
      goal: 'Write the full 8–10 page First Draft of your 3-Scene Movie Script (Scenes 1, 2 & 3), supercharge your action lines with strong verbs, run a Table Read with classmates, and lock the Final Script at the Phase 2 Checkpoint!',
      tasks: [
        'Week 5 Days 1–2 (10h Total): Write Scene 1 (set the mood, introduce your hero, and show their world) and Scene 2 (raise the stakes and bring in the main conflict).',
        'Week 5 Days 3–4: Write Scene 3 (the big confrontation, high-stakes action, or a shocking plot twist!) and the ending that leaves the audience wanting more.',
        'Week 5 Day 5 Milestone: Finish the full First Draft of your 3-Scene Script (Goal: 8–10 pages)!',
        'Week 6 Days 1–2 (10h Total): Supercharge your action lines! Cut extra words and replace weak verbs with strong, exciting action words so the script reads just like a fast-paced movie.',
        'Week 6 Days 3–4: Table Read! Read your script out loud with classmates to test how the dialogue flows and fix any awkward lines.',
        'Week 6 Day 5 Milestone (Phase 2 Checkpoint): Lock the Final Script! Export a clean, ready-to-produce screenplay package.'
      ],
      evidence: [
        'Scene 1 & Scene 2 Script Pages (Setting the Mood & Raising the Stakes)',
        'Week 5 Day 5 Milestone: Full First Draft of 3-Scene Movie Script (8–10 Pages)',
        'Supercharged Action Lines Edit (Weak Verbs Replaced with Strong Action Words)',
        'Week 6 Day 5 Milestone (Phase 2 Checkpoint): Table Read Notes & Locked Final 3-Scene Screenplay Package'
      ],
      aiPromptStarters: [
        'Here is an action paragraph from my Scene 2 draft: [paste lines]. Help me cut extra words and suggest 5 stronger, faster action verbs!',
        'We just finished our classroom Table Read and this line felt awkward to say out loud: [paste line]. Suggest 3 punchier ways to phrase it.'
      ],
      competencies: ['ec-06', 'ctps-10', 'sdl-05'],
      stretchCompetencies: ['lc-03'],
      sessions: [
        {
          sessionNumber: 9,
          week: 5,
          title: 'Week 5 (Days 1–2): Writing Scene 1 (Mood & Hero) and Scene 2 (Raising the Stakes)',
          durationMin: 300,
          learningGoal: 'Write Scene 1 and Scene 2 of your 3-Scene Movie Script while keeping the energy high.',
          activities: [
            'Big Question Inquiry: How do we keep the energy high when turning our outline into real script pages?',
            'Days 1–2 (10 Hours Total): Write Scene 1 (set the mood, introduce your hero, and show their world).',
            'Write Scene 2 (raise the stakes and bring in the main conflict with your Rival or World Rule).'
          ],
          learnerChoices: {
            question: 'How does Scene 2 raise the stakes from Scene 1?',
            options: [
              { id: 'opt-s2-timer', label: 'A Ticking Clock / Countdown', description: 'Time or power is running out fast.' },
              { id: 'opt-s2-trap', label: 'The Rival Blocks the Easy Exit', description: 'The hero’s first plan fails, forcing a harder choice.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Submit your draft pages for Scene 1 and Scene 2.',
            targetCompetencies: ['ec-06', 'sdl-05']
          },
          reflectionPrompt: 'How did you hook the audience in the first page of Scene 1 and raise the stakes in Scene 2?',
          teacherTips: 'Keep students moving forward—don’t let them spend 4 hours polishing line 1 before Scene 2 is written!'
        },
        {
          sessionNumber: 10,
          week: 5,
          title: 'Week 5 (Days 3–5): Writing Scene 3 & Finishing the 8–10 Page First Draft Milestone',
          durationMin: 300,
          learningGoal: 'Write Scene 3 (big confrontation or plot twist) and finish the full 8–10 page First Draft of the 3-Scene Script.',
          activities: [
            'Days 3–4: Write Scene 3 (the big confrontation, high-stakes action, or a shocking plot twist!) and the ending that leaves the audience wanting more.',
            'Day 5 Milestone: Finish the full First Draft of your 3-Scene Script (Goal: 8–10 pages)!'
          ],
          learnerChoices: {
            question: 'How does your Scene 3 climax leave the audience wanting more?',
            options: [
              { id: 'opt-s3-twist', label: 'A Shocking Plot Twist', description: 'Reveals a bigger mystery in your movie universe.' },
              { id: 'opt-s3-showdown', label: 'High-Stakes Showdown & Sacrifice', description: 'The hero overcomes their Flaw in a dramatic confrontation.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload your completed Week 5 Day 5 Milestone: Full First Draft of your 3-Scene Script (8–10 pages).',
            targetCompetencies: ['ctps-10', 'ec-06']
          },
          reflectionPrompt: 'What moment in Scene 3 are you most excited to turn into storyboards and video?',
          teacherTips: 'Finishing an 8–10 page screenplay draft is a huge milestone—celebrate every student reaching page 8–10!'
        },
        {
          sessionNumber: 11,
          week: 6,
          title: 'Week 6 (Days 1–2): Supercharging Action Lines & Strong Verbs',
          durationMin: 300,
          learningGoal: 'Edit your script like a pro by cutting extra words and replacing weak verbs with strong, exciting action words.',
          activities: [
            'Big Question Inquiry: How do pro writers edit their work to make every word powerful and clear?',
            'Days 1–2 (10 Hours Total): Supercharge your action lines! Cut extra words and replace weak verbs ("is walking", "looks at") with strong, exciting action words ("sprints", "glare", "wrenches") so the script reads just like a fast-paced movie.'
          ],
          learnerChoices: {
            question: 'Which editing pass made the biggest difference to your script’s speed?',
            options: [
              { id: 'opt-edit-verbs', label: 'Swapping Weak Verbs for Action Verbs', description: 'Turned slow descriptions into vivid movie shots.' },
              { id: 'opt-edit-trim', label: 'Trimming Long Paragraphs & Extra Words', description: 'Kept action blocks to 1–3 punchy lines.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Submit a Before & After comparison of your supercharged action lines.',
            targetCompetencies: ['ec-06', 'ct-05']
          },
          reflectionPrompt: 'How do pro writers edit their work to make every word powerful and clear?',
          teacherTips: 'Challenge students to cut 15–20% of extra words while making every action line twice as vivid.'
        },
        {
          sessionNumber: 12,
          week: 6,
          title: 'Week 6 (Days 3–5): Classroom Table Read & Phase 2 Checkpoint (Lock Final Script!)',
          durationMin: 300,
          learningGoal: 'Run a live Table Read with classmates to test dialogue flow, fix awkward lines, and lock the Final Script.',
          activities: [
            'Days 3–4: Table Read! Read your script out loud with classmates to test how the dialogue flows and fix any awkward lines.',
            'Day 5 Milestone (Phase 2 Checkpoint): Lock the Final Script! Export a clean, ready-to-produce screenplay package (Deliverable #2).'
          ],
          learnerChoices: {
            question: 'What did you discover when classmates read your dialogue out loud during the Table Read?',
            options: [
              { id: 'opt-tr-breath', label: 'Shortened Tongue-Twister Lines', description: 'Made sentences easier and more natural for voice actors to perform.' },
              { id: 'opt-tr-subtext', label: 'Cut a Line Where a Look Worked Better', description: 'Replaced spoken explanation with a silent reaction beat.' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Upload your Locked Final 3-Scene Screenplay Package (Deliverable #2) and Table Read revision notes.',
            targetCompetencies: ['ec-06', 'sdl-06']
          },
          reflectionPrompt: 'Why is hearing classmates read your script out loud the fastest way to catch awkward lines?',
          teacherTips: 'Once the Phase 2 Checkpoint is passed, the script is officially LOCKED so pre-production storyboarding can begin!'
        }
      ]
    },
    {
      id: 'prototype',
      title: 'Phase 3: Pre-Production, Art & Sound Prep (Weeks 7–9)',
      strap: '30+ Storyboard Frames, Production Art Pack, Voice Tracks & Locked Production Animatic',
      weeks: [7, 9],
      goal: 'Draw at least 30 storyboard frames using pro camera angles, create your Production Art Pack (characters with transparent backgrounds and painted environments), prepare your Sound List and Voice Tracks, and export a locked Production Animatic at the Phase 3 Checkpoint!',
      tasks: [
        'Week 7 Days 1–2 (10h Total): Learn camera shots (Wide Shots for scale, Medium Shots for conversations, Close-Ups for big emotions) and camera moves (Pans, Tilts, Tracking).',
        'Week 7 Days 3–4: Turn your script into rough Storyboard drawings, making sure action is easy to follow and characters look in the right direction from shot to shot.',
        'Week 7 Day 5 Milestone: Complete at least 30 Storyboard frames for your movie scenes!',
        'Week 8 Days 1–2 (10h Total): Choose your art style (2D digital art, mixed media, or 3D setups) and make an Asset Manifest checklist (characters, facial expressions, backgrounds, props).',
        'Week 8 Days 3–5 Milestone: Draw and paint final backgrounds and character poses to finish your Production Art Pack (Characters with transparent backgrounds and fully painted environments).',
        'Week 9 Days 1–5 Milestone (Phase 3 Checkpoint): Make a Sound List (Voices, Atmosphere, Sound Effects, Music), record/prepare clean Voice Tracks (following school safeguarding rules), and combine storyboards + audio on a video timeline to export a locked Production Animatic!'
      ],
      evidence: [
        'Week 7 Day 5 Milestone: At least 30 Storyboard Frames (Wide, Medium, Close-Up & Camera Moves)',
        'Asset Manifest Checklist (Characters, Facial Expressions, Backgrounds, Props)',
        'Week 8 Day 5 Milestone: Production Art Pack (Transparent Character PNGs & Painted Environments)',
        'Week 9 Day 5 Milestone (Phase 3 Checkpoint): Sound List + Locked, Perfectly Timed Production Animatic'
      ],
      aiPromptStarters: [
        'Here is a moment from my script: [paste beat]. Should I use a Wide Shot, Medium Shot, or Close-Up to show how the character feels without words?',
        'Help me organize my Asset Manifest checklist so I don’t forget any character expressions, props, or backgrounds for my 30 storyboard frames!'
      ],
      competencies: ['ctps-11', 'ec-07', 'sdl-07'],
      stretchCompetencies: ['lc-04'],
      sessions: [
        {
          sessionNumber: 13,
          week: 7,
          title: 'Week 7 (Days 1–2): Thinking Like a Director — Camera Shots & Camera Moves',
          durationMin: 300,
          learningGoal: 'Learn Wide Shots, Medium Shots, Close-Ups, and camera moves (Pans, Tilts, Tracking) to show emotion visually.',
          activities: [
            'Big Question Inquiry: How do camera angles and shot choices show how a character feels without using words?',
            'Days 1–2 (10 Hours Total): Think like a movie director! Practice Wide Shots (for scale), Medium Shots (for conversations), and Close-Ups (for big emotions).',
            'Plan camera moves (Pans, Tilts, Tracking) and check screen direction so characters look the right way from shot to shot.'
          ],
          learnerChoices: {
            question: 'Which camera shot will you use for the most emotional moment in Scene 3?',
            options: [
              { id: 'opt-shot-cu', label: 'Extreme Close-Up on Eyes/Hands', description: 'Shows intense emotion or a split-second decision.' },
              { id: 'opt-shot-wide', label: 'Dramatic Wide Shot', description: 'Shows the hero standing small against a massive world obstacle.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit your camera shot plan showing Wide, Medium, Close-Up, and Pan/Tilt/Tracking choices.',
            targetCompetencies: ['ct-06', 'ctps-11']
          },
          reflectionPrompt: 'How do camera angles and shot choices show how a character feels without using words?',
          teacherTips: 'Show how keeping characters looking in consistent directions across cuts (the 180-degree rule) keeps the audience oriented.'
        },
        {
          sessionNumber: 14,
          week: 7,
          title: 'Week 7 (Days 3–5): Drawing Storyboards & The 30-Frame Milestone',
          durationMin: 300,
          learningGoal: 'Turn your locked script into at least 30 rough Storyboard frames with clear action and shot flow.',
          activities: [
            'Days 3–4: Turn your script into rough Storyboard drawings. Make sure the action is easy to follow and characters look in the right direction from shot to shot.',
            'Day 5 Milestone: Complete at least 30 Storyboard frames for your movie scenes!'
          ],
          learnerChoices: {
            question: 'How are you organizing your 30+ Storyboard frames?',
            options: [
              { id: 'opt-sb-digital', label: 'Digital 16:9 Storyboard Grid', description: 'Drawn on tablet/canvas ready to drop straight into the video timeline.' },
              { id: 'opt-sb-cards', label: 'Paper Thumbnail Cards Scanned to Timeline', description: 'Fast pencil thumbnails photographed in sequence.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your Week 7 Day 5 Milestone: At least 30 completed Storyboard frames.',
            targetCompetencies: ['ec-07', 'ctps-11']
          },
          reflectionPrompt: 'What action beat became much clearer once you drew it across 30 storyboard frames?',
          teacherTips: 'Remind students that storyboards are rough blueprints for timing and framing—stick figures with clear camera arrows beat slow perfectionism!'
        },
        {
          sessionNumber: 15,
          week: 8,
          title: 'Week 8 (Days 1–2): Choosing Your Art Style & Building the Asset Manifest',
          durationMin: 300,
          learningGoal: 'Choose your art style (2D digital art, mixed media, or 3D setups) and create a complete Asset Manifest checklist.',
          activities: [
            'Big Question Inquiry: How do we turn our character sketches into polished art ready for animation and video?',
            'Days 1–2 (10 Hours Total): Choose your art style (2D digital art, mixed media, or 3D setups).',
            'Make a checklist (Asset Manifest) of everything you need: characters, facial expressions, backgrounds, and props.'
          ],
          learnerChoices: {
            question: 'Which art style did you choose for your movie universe?',
            options: [
              { id: 'opt-art-2d', label: '2D Digital Art & Layered Illustration', description: 'Characters with transparent backgrounds over painted environments.' },
              { id: 'opt-art-mixed', label: 'Mixed Media / Collage & Stylized Art', description: 'Hand-crafted textures combined with bold digital character poses.' },
              { id: 'opt-art-3d', label: '3D Setups / Blockout Environments', description: '3D camera staging paired with stylized character renders.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Submit your Asset Manifest checklist (characters, expressions, backgrounds, and props).',
            targetCompetencies: ['sdl-07', 'ctps-11']
          },
          reflectionPrompt: 'How does making an Asset Manifest checklist save you from drawing things you don’t actually need in your trailer?',
          teacherTips: 'Help students group shots that share the same background so they can reuse environments smartly like real animation studios.'
        },
        {
          sessionNumber: 16,
          week: 8,
          title: 'Week 8 (Days 3–5): Painting Backgrounds & Finishing the Production Art Pack Milestone',
          durationMin: 300,
          learningGoal: 'Draw and paint the final backgrounds and character poses to finish your Production Art Pack.',
          activities: [
            'Days 3–4: Draw and paint the final backgrounds and character poses to match the camera angles in your Week 7 storyboards.',
            'Day 5 Milestone: Finish your Production Art Pack (Characters with transparent backgrounds and fully painted environments).'
          ],
          learnerChoices: {
            question: 'How did you prepare your character art so it can move inside the video editor?',
            options: [
              { id: 'opt-png-poses', label: 'Transparent PNG Poses & Expressions', description: 'Separate character layers ready to pan and zoom over backgrounds.' },
              { id: 'opt-png-layers', label: 'Multi-Plane Foreground / Midground / Background', description: 'Separated environment layers for 3D parallax camera depth.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your Week 8 Day 5 Milestone: Production Art Pack (transparent character PNGs + painted environments).',
            targetCompetencies: ['ec-07', 'sdl-08']
          },
          reflectionPrompt: 'Why is exporting characters with transparent backgrounds essential before Week 10 video assembly?',
          teacherTips: 'Verify that every student exports characters as transparent PNGs rather than flattened white rectangles!'
        },
        {
          sessionNumber: 17,
          week: 9,
          title: 'Week 9 (Days 1–2): Sound List (Voices, Atmosphere, Sound Effects, Music) & Voice Prep',
          durationMin: 300,
          learningGoal: 'Create a 4-part Sound List and prepare clear, emotional Voice Tracks (with full under-13 safeguarding compliance).',
          activities: [
            'Big Question Inquiry: How do voices and a rough test video help us fix timing before final production?',
            'Days 1–2 (10 Hours Total): Make a Sound List covering all 4 audio layers: Voices, Atmosphere, Sound Effects (Foley), and Music.',
            'Prepare emotional Voice Tracks or dialogue stems (Safeguarding rule: under-13 learners use live classroom table reads, speech-bubble captions, or teacher-operated audio stems; any recording of older learners requires school consent and is never stored on the platform).'
          ],
          learnerChoices: {
            question: 'How are you handling character dialogue tracks for your animatic?',
            options: [
              { id: 'opt-vox-captions', label: 'Cinematic Subtitle Cards + Live Table Read (Under-13 Safe)', description: 'Zero student voice capture stored; timed dialogue cards + Foley/music.' },
              { id: 'opt-vox-consented', label: 'Teacher-Supervised Studio Mic Stems (Older Learners w/ Consent)', description: 'Local DAW audio tracks recorded offline with school consent.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your 4-part Sound List (Voices, Atmosphere, Sound Effects, Music).',
            targetCompetencies: ['ctps-11', 'sdl-09']
          },
          reflectionPrompt: 'Why do sound designers plan Atmosphere and Sound Effects on a Sound List before editing begins?',
          teacherTips: 'Enforce the safeguarding policy strictly: under-13s never record voice or use speech-to-text; older students only record offline with school consent.'
        },
        {
          sessionNumber: 18,
          week: 9,
          title: 'Week 9 (Days 3–5): Building the Animatic & Phase 3 Checkpoint',
          durationMin: 300,
          learningGoal: 'Combine your storyboard drawings and audio on a video timeline to test shot timing and export a locked Production Animatic.',
          activities: [
            'Days 3–4: Put your storyboard drawings and voice/dialogue tracks together on a video timeline to build your Animatic (rough movie cut). Test and fix the timing of every shot.',
            'Day 5 Milestone (Phase 3 Checkpoint): Export a locked, perfectly timed Production Animatic!'
          ],
          learnerChoices: {
            question: 'What timing fix did you make after watching your rough Animatic on the video timeline?',
            options: [
              { id: 'opt-anim-faster', label: 'Trimmed Slow Shots During Action', description: 'Made cuts faster in Scene 3 to boost excitement.' },
              { id: 'opt-anim-pause', label: 'Added a Dramatic Pause Before the Twist', description: 'Let an emotional close-up breathe for 2 extra seconds.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your Week 9 Day 5 Milestone (Phase 3 Checkpoint): Locked Production Animatic.',
            targetCompetencies: ['ec-07', 'ctps-12']
          },
          reflectionPrompt: 'How do voices and a rough test video help us fix timing before final production?',
          teacherTips: 'Fixing shot timing in the Animatic takes seconds; fixing it after final animation takes hours. Celebrate locking Phase 3!'
        }
      ]
    },
    {
      id: 'test',
      title: 'Phase 4A: Final Art Assembly, Multi-Layer Sound Mixing, Mastering & Pro Portfolio (Weeks 10–11)',
      strap: 'Digital Camera Moves, Foley & Audio Ducking, Picture & Sound Lock, Color Grading & Pro Portfolio',
      weeks: [10, 11],
      goal: 'Swap rough storyboards for finished art, add digital camera moves, mix atmosphere/Foley/music with audio ducking for Picture & Sound Lock, apply Color Grading and subtitles to export your Final Master Video, and build your Behind-the-Scenes Pro Portfolio!',
      tasks: [
        'Week 10 Days 1–2 (10h Total): Swap out your rough storyboard drawings in the video timeline with your finished character art and backgrounds! Add digital camera moves (zooms, pans, screen shakes, and background blur).',
        'Week 10 Days 3–4: Layer in background atmosphere, custom sound effects (Foley like footsteps or sci-fi beeps), and music! Adjust volume levels (ducking) so the music never drowns out the voices.',
        'Week 10 Day 5 Milestone: Picture & Sound Lock! All final visuals, camera moves, sound effects, and music are in place.',
        'Week 11 Days 1–2 (10h Total): Balance the final audio mix and add Color Grading (color filters to unify the mood), movie titles, credits, and clean subtitles. Export your Final Master Video!',
        'Week 11 Days 3–4: Build your Pro Portfolio! Pick your best sketches, script pages, and storyboard-to-final-shot comparisons, and write a short "Behind-the-Scenes" story of how you built your world.',
        'Week 11 Day 5 Milestone: Final Master Video rendered + Online Portfolio / Showcase Document ready to share!'
      ],
      evidence: [
        'Week 10 Day 5 Milestone: Picture & Sound Lock Timeline (Final Art + Camera Moves + Foley + Audio Ducking)',
        'Week 11 Days 1–2: Exported Final Master Video (with Color Grading, Movie Titles, Credits & Clean Subtitles)',
        'Week 11 Day 5 Milestone: Behind-the-Scenes Pro Portfolio (Sketches, Script Pages & Storyboard-to-Final-Shot Comparisons)'
      ],
      aiPromptStarters: [
        'How do I set up audio ducking in my timeline so my background music automatically lowers by 6–8 dB whenever a character speaks?',
        'Help me outline my short "Behind-the-Scenes" story showing how my rough Week 7 storyboard evolved into my Week 11 Final Master Video shot!'
      ],
      competencies: ['ec-08', 'ctps-12', 'sdl-10'],
      stretchCompetencies: ['lc-05'],
      sessions: [
        {
          sessionNumber: 19,
          week: 10,
          title: 'Week 10 (Days 1–2): Final Art Assembly & Digital Camera Moves',
          durationMin: 300,
          learningGoal: 'Swap rough storyboards on the timeline with finished character art and backgrounds, and add digital camera moves.',
          activities: [
            'Big Question Inquiry: How do camera motion and layered sound effects make 2D art feel like a living, breathing movie?',
            'Days 1–2 (10 Hours Total): Swap out your rough storyboard drawings in the video timeline with your finished character art and backgrounds!',
            'Add digital camera moves: zooms, pans, screen shakes, and background blur.'
          ],
          learnerChoices: {
            question: 'Which digital camera move brought your favorite shot to life?',
            options: [
              { id: 'opt-cam-zoom', label: 'Slow Push-In Zoom + Background Blur', description: 'Focuses attention on the hero’s face during a big choice.' },
              { id: 'opt-cam-pan', label: 'Wide Pan + Action Screen Shake', description: 'Reveals the scale of the world and adds impact to action beats.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit a timeline preview showing your finished art swapped in with digital camera moves.',
            targetCompetencies: ['ec-08', 'ct-07']
          },
          reflectionPrompt: 'How did adding zooms, pans, screen shakes, and background blur transform your flat art into a movie shot?',
          teacherTips: 'Encourage subtle, purposeful camera movement that serves the emotion of the shot.'
        },
        {
          sessionNumber: 20,
          week: 10,
          title: 'Week 10 (Days 3–5): Multi-Layer Sound Mixing, Foley, Ducking & Picture/Sound Lock',
          durationMin: 300,
          learningGoal: 'Layer atmosphere, custom Foley sound effects, and music with audio ducking to achieve Picture & Sound Lock.',
          activities: [
            'Days 3–4: Layer in background atmosphere, custom sound effects (Foley like footsteps or sci-fi beeps), and music!',
            'Adjust volume levels (ducking) so the music never drowns out the voices.',
            'Day 5 Milestone: Picture & Sound Lock! All final visuals, camera moves, sound effects, and music are in place.'
          ],
          learnerChoices: {
            question: 'How did you make sure your music never drowns out the character dialogue?',
            options: [
              { id: 'opt-mix-duck', label: 'Volume Keyframe Ducking (-8 dB)', description: 'Lowered music volume automatically under every spoken/captioned line.' },
              { id: 'opt-mix-foley', label: 'Clean Foley Placement in Pauses', description: 'Placed loud footsteps and sci-fi sound effects between dialogue lines.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your Week 10 Day 5 Milestone: Picture & Sound Lock multi-track timeline screenshot and audio mix.',
            targetCompetencies: ['ctps-12', 'ec-08']
          },
          reflectionPrompt: 'How do camera motion and layered sound effects make 2D art feel like a living, breathing movie?',
          teacherTips: 'Have partners listen to each other’s mixes with eyes closed—can they follow the action and hear every line clearly?'
        },
        {
          sessionNumber: 21,
          week: 11,
          title: 'Week 11 (Days 1–2): Final Mastering, Color Grading, Titles & Subtitles',
          durationMin: 300,
          learningGoal: 'Balance the final audio mix, apply Color Grading, add movie titles, credits, and clean subtitles, and export the Final Master Video.',
          activities: [
            'Big Question Inquiry: How do final color tweaks and a behind-the-scenes portfolio show off our skills like a pro?',
            'Days 1–2 (10 Hours Total): Balance the final audio mix and add Color Grading (color filters to unify the mood).',
            'Add movie titles, credits, and clean subtitles, then export your Final Master Video (Deliverable #3)!'
          ],
          learnerChoices: {
            question: 'What Color Grading mood filter unified your Final Master Video?',
            options: [
              { id: 'opt-grade-warm', label: 'Warm Golden / Adventure Glow', description: 'Unifies shots with rich amber highlights and cinematic warmth.' },
              { id: 'opt-grade-cool', label: 'Cool Sci-Fi / Neon Contrast', description: 'Deep teal shadows and crisp futuristic highlights.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your exported Final Master Video (with Color Grading, titles, credits, and clean subtitles).',
            targetCompetencies: ['ec-08', 'sdl-10']
          },
          reflectionPrompt: 'How did adding Color Grading, titles, and clean subtitles make your project look like a real movie trailer?',
          teacherTips: 'Double-check subtitle spelling and contrast so audiences in a noisy showcase room can read every word effortlessly.'
        },
        {
          sessionNumber: 22,
          week: 11,
          title: 'Week 11 (Days 3–5): Building Your Behind-the-Scenes Pro Portfolio Milestone',
          durationMin: 300,
          learningGoal: 'Build your Pro Portfolio featuring best sketches, script pages, storyboard-to-final-shot comparisons, and a Behind-the-Scenes story.',
          activities: [
            'Days 3–4: Build your Pro Portfolio! Pick your best sketches, script pages, and storyboard-to-final-shot comparisons, and write a short "Behind-the-Scenes" story of how you built your world.',
            'Day 5 Milestone: Final Master Video rendered + Online Portfolio / Showcase Document ready to share!'
          ],
          learnerChoices: {
            question: 'What comparison will be the centerpiece of your Pro Portfolio?',
            options: [
              { id: 'opt-port-sb', label: 'Storyboard-to-Final-Shot Side-by-Side', description: 'Shows how a rough Week 7 sketch became a polished Week 11 movie frame.' },
              { id: 'opt-port-script', label: 'Script Page-to-Screen Comparison', description: 'Shows how formatted Scene Headings and subtext turned into sight and sound.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Upload your Week 11 Day 5 Milestone: Online Pro Portfolio / Showcase Document with Behind-the-Scenes story.',
            targetCompetencies: ['sdl-10', 'ec-09']
          },
          reflectionPrompt: 'How do final color tweaks and a behind-the-scenes portfolio show off our skills like a pro?',
          teacherTips: 'Remind students that studios love seeing the "Before and After" journey from rough sketch to final shot.'
        }
      ]
    },
    {
      id: 'share',
      title: 'Phase 4B: The Big Pitch & Grand Showcase! (Week 12)',
      strap: '5-Minute Pitch Presentation, Rehearsal & THE GRAND SHOWCASE!',
      weeks: [12, 12],
      goal: 'Build and practice a punchy 5-Minute Pitch Presentation covering your core story idea, characters, world rules, and final video trailer, and present your Story Bible, Script, and Animated Trailer at THE GRAND SHOWCASE!',
      tasks: [
        'Week 12 Days 1–2 (10h Total): Build a punchy 5-Minute Pitch Presentation covering your core story idea, characters, world rules, and your final video trailer.',
        'Week 12 Days 3–4: Practice your pitch out loud! Reflect on the challenges you beat, the software you mastered, and the pro habits you learned over the 12 weeks.',
        'Week 12 Day 5 Milestone: THE GRAND SHOWCASE! Present your Story Bible, Script, and Animated Trailer to mentors, friends, and family!',
        'Self-audit your project against the 4-part Success Checklist: (1) Strong World Rules, (2) Pro Script Formatting, (3) Smart Organization & Planning, and (4) Smooth Sight & Sound.'
      ],
      evidence: [
        '5-Minute Pitch Presentation Deck (Core Story Idea, Characters, World Rules & Final Video Trailer)',
        '12-Week Reflection on Challenges Beat, Software Mastered & Pro Habits Learned',
        'Week 12 Day 5 Milestone: THE GRAND SHOWCASE Presentation (Story Bible + 3-Scene Script + Mini-Movie / Pitch Trailer)',
        '4-Point Success Checklist Self & Mentor Evaluation'
      ],
      aiPromptStarters: [
        'Help me structure my 5-Minute Pitch Presentation so I cover my core story idea, characters, world rules, and trailer smoothly!',
        'Ask me 3 fun audience questions from mentors and family at THE GRAND SHOWCASE so I can practice answering with confidence!'
      ],
      competencies: ['ec-09', 'sdl-11', 'sea-03'],
      stretchCompetencies: ['ent-01'],
      sessions: [
        {
          sessionNumber: 23,
          week: 12,
          title: 'Week 12 (Days 1–4): Building & Practicing Your 5-Minute Pitch Presentation',
          durationMin: 300,
          learningGoal: 'Build a punchy 5-Minute Pitch Presentation and practice it out loud while reflecting on 12 weeks of growth.',
          activities: [
            'Big Question Inquiry: How do we pitch our original movie universe to an audience and celebrate how much we’ve grown?',
            'Days 1–2 (10 Hours Total): Build a punchy 5-Minute Pitch Presentation covering your core story idea, characters, world rules, and your final video trailer.',
            'Days 3–4: Practice your pitch out loud! Reflect on the challenges you beat, the software you mastered, and the pro habits you learned over the 12 weeks.'
          ],
          learnerChoices: {
            question: 'How will you open your 5-Minute Pitch Presentation to hook the audience immediately?',
            options: [
              { id: 'opt-pitch-question', label: 'Open with the World’s Big "What If?" Rule', description: 'Invite the audience straight into the danger of your universe.' },
              { id: 'opt-pitch-hero', label: 'Open with Your Hero’s Secret Flaw & Goal', description: 'Introduce your hero’s personal struggle before screening the trailer.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your 5-Minute Pitch Presentation outline and 12-week reflection notes.',
            targetCompetencies: ['sdl-11', 'ec-09']
          },
          reflectionPrompt: 'What challenge did you beat and what pro habit are you proudest of learning over the 12 weeks?',
          teacherTips: 'Time each student’s practice pitch so they leave plenty of room inside the 5 minutes to play their Mini-Movie / Pitch Trailer!'
        },
        {
          sessionNumber: 24,
          week: 12,
          title: 'Week 12 (Day 5 Milestone): THE GRAND SHOWCASE! Presenting Your Movie Universe',
          durationMin: 300,
          learningGoal: 'Present your Story Bible, 3-Scene Movie Script, and Mini-Movie / Pitch Trailer to mentors, friends, and family at THE GRAND SHOWCASE!',
          activities: [
            'Day 5 Milestone: THE GRAND SHOWCASE! Present your Story Bible (Deliverable #1), 3-Scene Movie Script (Deliverable #2), and Mini-Movie / Pitch Trailer (Deliverable #3) to mentors, friends, and family!',
            'Complete the 4-part Success Checklist review: (1) Strong World Rules, (2) Pro Script Formatting, (3) Smart Organization & Planning, (4) Smooth Sight & Sound.'
          ],
          learnerChoices: {
            question: 'Which of the 4 Success Checklist areas shows your biggest growth as a creative professional?',
            options: [
              { id: 'opt-sc-rules', label: '1. Strong World Rules', description: 'My universe rules make sense and naturally create exciting problems.' },
              { id: 'opt-sc-script', label: '2. Pro Script Formatting', description: 'My 3-scene script looks like a real Hollywood screenplay with subtext.' },
              { id: 'opt-sc-org', label: '3. Smart Organization & Planning', description: 'I kept files organized and hit all weekly milestones and checkpoints.' },
              { id: 'opt-sc-sound', label: '4. Smooth Sight & Sound', description: 'My camera shots, voices, and Foley sound design work seamlessly together.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your final Grand Showcase presentation package (Story Bible, 3-Scene Script, Mini-Movie / Pitch Trailer, and 4-Part Success Checklist).',
            targetCompetencies: ['ec-09', 'sea-03']
          },
          reflectionPrompt: 'How do we pitch our original movie universe to an audience and celebrate how much we’ve grown?',
          teacherTips: 'Remind every student: you aren’t graded on personal artistic taste—you are rewarded for thinking, planning, and building like a true creative professional!'
        }
      ]
    }
  ]
};
