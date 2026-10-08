/**
 * Don's PBL Program: The Passion Project Blueprint
 * Branch: DonPBL
 * Location: prototypes/DonPBL/passionBlueprintProgram.ts
 * 
 * Sourced from the official "The Passion Project Blueprint: Discovering Your Next Big Idea" curriculum.
 * Specifically architected for neurodivergent & twice-exceptional (2e) learners:
 * - Lowers Executive Functioning Barriers (scaffolds friction points, speech-to-text, micro-checklists)
 * - Validates Hyperfocus (transforms obsessions & rabbit holes into rigorous cross-curricular inquiries)
 * - Honors Autonomy (customizable vibe, creation toolkit, pace, and social modality)
 * 
 * Formatted into standard WeLearn PblProgram architecture:
 * - 7 Design Thinking Phases (Explore -> Empathise -> Define -> Ideate -> Prototype -> Test -> Share)
 * - 24 Structured 50-Minute Sessions with learner choices and reflection prompts
 * - Measurable impact metrics & 2e neuro-scaffolding rubrics
 */

import { PblProgram } from './programData';

export interface VibeChoice {
  creationMode: 'physical' | 'digital' | 'theoretical';
  pace: 'fast_experimental' | 'slow_precise';
  socialMode: 'solo_wolf' | 'crew_collab';
}

export interface FrictionStrategy {
  id: string;
  frictionPoint: string;
  studentQuote: string;
  scaffoldingMechanism: string;
  aiCopilotPrompt: string;
  dopamineBooster: string;
}

export const FRICTION_STRATEGIES: FrictionStrategy[] = [
  {
    id: 'fric-perfectionism',
    frictionPoint: 'Perfectionism Paralysis',
    studentQuote: 'I get stuck trying to make it perfect before I even start.',
    scaffoldingMechanism: '15-Minute "Ugly First Draft" Challenge: mandate a deliberately imperfect prototype using recycled scraps or rough wireframes.',
    aiCopilotPrompt: 'Give me 3 rough, low-stakes concepts for my project that can be built in under 15 minutes without worrying about polish.',
    dopamineBooster: 'Earn "Wabi-Sabi Badge" (+300 XP) for publishing something noticeably imperfect.'
  },
  {
    id: 'fric-boredom',
    frictionPoint: 'Mid-Project ADHD Boredom Drop',
    studentQuote: 'I get bored halfway through once the initial novelty wears off.',
    scaffoldingMechanism: 'The "Mashup Twist" Pivot: inject an unexpected secondary interest (e.g. adding music/sound effects to a robot, or storytelling to a data dashboard).',
    aiCopilotPrompt: 'Suggest a creative mashup combining my current project with my secondary passion to reignite novelty.',
    dopamineBooster: 'Earn "Pivot Pioneer Badge" (+350 XP) for an innovative feature mashup.'
  },
  {
    id: 'fric-text-dread',
    frictionPoint: 'Writing Paragraph Dread (Dysgraphia / Overwhelm)',
    studentQuote: 'I hate writing long paragraphs and typing out long reports.',
    scaffoldingMechanism: 'Voice Memo / Speech-to-Text & Visual Evidence: accept 60-second audio voice notes, photo galleries, and annotated sketches.',
    aiCopilotPrompt: 'Convert my spoken voice notes into clean bullet points for my evidence log.',
    dopamineBooster: 'Earn "Audio Chronicler Badge" (+250 XP) for logging 3 voice-recorded reflections.'
  },
  {
    id: 'fric-time-blindness',
    frictionPoint: 'Time Blindness & Scope Creep',
    studentQuote: 'Organizing my time is hard and I lose track of hours or weeks.',
    scaffoldingMechanism: 'Micro-Sprint Kanban: break deliverables down into granular 20-minute tasks on visual cards with clear "done" criteria.',
    aiCopilotPrompt: 'Break down my next milestone into four 20-minute concrete action steps.',
    dopamineBooster: 'Earn "Sprint Master Badge" (+400 XP) for clearing 5 consecutive micro-sprint cards.'
  },
  {
    id: 'fric-stuck-wall',
    frictionPoint: 'Brain Freeze / Staring at Blank Wall',
    studentQuote: 'I stare at a blank screen and my brain completely locks up.',
    scaffoldingMechanism: 'Sensory Reset & Example Bank: 5-minute walk/sensory break, followed by reviewing 3 mentor examples of finished prototypes.',
    aiCopilotPrompt: 'Show me 3 concrete examples of how other students solved a similar design challenge.',
    dopamineBooster: 'Earn "Reset & Recharge Badge" (+200 XP) for returning to build mode after a mindful break.'
  }
];

export const PASSION_BLUEPRINT_PROGRAM: PblProgram = {
  id: 'passion-project-blueprint-2026',
  title: 'The Passion Project Blueprint: Discovering Your Next Big Idea',
  subtitle: 'A self-directed, neurodivergent-affirming (2e) PBL framework transforming hyperfocus obsessions and personal curiosity into rigorous, real-world public showcases.',
  status: 'provisional_prototype',
  theme: 'Self-Directed Learning, 2e Neurodiversity & Autonomous Innovation',
  drivingQuestion: 'How can we transform our deepest personal obsessions, rabbit holes, and creative toolkits into authentic, real-world projects that solve meaningful problems, while engineering custom scaffolds for our unique brain wiring?',
  realProblem: {
    type: 'both',
    summary: 'Traditional school assignments enforce rigid, linear compliance that alienates twice-exceptional (2e) and neurodivergent learners through executive functioning barriers, perfectionism paralysis, and disconnected topics. When learners lack agency over their rabbit holes and pacing, extraordinary creative genius is lost to burnout or disengagement.',
    peopleImpact: 'Empowers diverse learners with personalized executive functioning tools, self-advocacy, and emotional regulation to launch projects they care about for authentic audiences (experts, community, peers).',
    environmentalImpact: 'Channels personal passions into local community, ecological stewardship, sustainable physical fabrication, and ethical digital artifacts.'
  },
  targetAgeRange: '10–18 years (Grades 5–12 / Upper Primary through High School & 2e Learners)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'BBC micro:bit V2 / Raspberry Pi Pico / Arduino (Optional for Physical Tech builders)',
      'USB programming leads and battery packs'
    ],
    sensorsAndActuators: [
      'Sensory & Physical Kits: motors, LEDs, ultrasonic sensors, analog sliders',
      'Audio & Visual Capture: USB microphones, webcams, drawing tablets'
    ],
    fabricationMaterials: [
      'LEGO Technic, cardboard, craft wire, polymer clay, cosplay foam, fabric',
      'Rapid prototype materials: sticky notes, visual cards, sketchbook journals',
      'Recycled materials for low-fidelity "ugly first draft" prototypes'
    ],
    softwareAndTools: [
      'PBL Studio AI Co-Pilot (simulated scaffolding & prompt coaching)',
      'Visual Kanban boards (Trello, Notion, or physical card walls)',
      'Speech-to-Text dictation tools and audio recorders',
      'Tinkercad / Blender (3D), Scratch / Godot (Games), Canva / Figma (Design)'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Emotional Safety & Psychological Bravery: Maintain a strict anti-shaming environment around hyperfocus topics, non-traditional learning styles, and untidy initial drafts.',
      'Physical Workshop Protocols: Standard eye protection and adult supervision during hot glue, utility knife, or soldering tasks.'
    ],
    pedagogicalScaffolding: [
      'Lower Executive Functioning Barriers: Offer visual Kanban boards, speech-to-text dictation, and bite-sized checklists for learners who find long writing blocks exhausting.',
      'Validate Hyperfocus: Celebrate deep rabbit holes (anime lore, video game mechanics, vintage synthesizers, insect biology) as valid launching pads for rigorous interdisciplinary inquiry.',
      'Honor Autonomy & Vibe: Respect the learner’s chosen vibe (Physical vs Digital vs Theoretical; Fast & Experimental vs Slow & Precise; Solo vs Crew).',
      'Address Friction Points Proactively: Normalize getting stuck and pair learners with targeted scaffolding strategies (e.g. 15-minute ugly drafts, mashup twists).'
    ],
    aiEthicsRules: [
      'AI as Scaffolding Co-Pilot, Not Ghostwriter: AI generates idea starters, debugging tips, and outlines; students create the artifact.',
      'Transparent AI Provenance: Log what prompt was asked, what the AI provided, and what the student modified or kept.'
    ],
    differentiationNotes: [
      'Tier 1 (Scaffolded Discovery): Guided prompts for students needing support to define their rabbit hole and select a single bite-sized deliverable.',
      'Tier 2 (Autonomous Accelerator): Independent sprint planning for students with strong self-direction to pursue advanced technical or creative briefs.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-autonomy-completion',
      metric: 'Self-Directed Milestone Execution',
      target: '≥ 85% of self-selected micro-sprint tasks completed on schedule using personalized scaffolds',
      verificationMethod: 'Weekly Kanban sprint check-ins and evidence log audit'
    },
    {
      id: 'metric-friction-resolution',
      metric: 'Friction Point Self-Regulation',
      target: 'Documented resolution of at least 2 major friction points using deliberate coping scaffolds (e.g. ugly draft, audio note)',
      verificationMethod: 'Student reflection logs and mentor coaching records'
    },
    {
      id: 'metric-audience-showcase',
      metric: 'Authentic Public Showcase Delivery',
      target: '100% of learners present their completed prototype or creative artifact to their self-selected dream audience',
      verificationMethod: 'Showcase exhibition rubric and audience feedback survey'
    }
  ],
  assumptions: [
    {
      id: 'asmp-hyperfocus-validity',
      domain: 'Curriculum Policy',
      assumption: 'School leadership permits non-traditional student-chosen topics (e.g. gaming, cosplay, fanfiction, mechanics) as rigorous PBL vehicles.',
      ownerVerificationNeeded: 'Confirm school rubric acceptance of student-led passion domains.'
    },
    {
      id: 'asmp-multi-modal-evidence',
      domain: 'Assessment Format',
      assumption: 'Evaluation accepts audio voice notes, photo diaries, and code/hardware demos in place of standard written essays.',
      ownerVerificationNeeded: 'Confirm competency assessment team accepts non-text multimodal artifacts.'
    }
  ],
  phases: [
    {
      id: 'explore',
      title: 'The Deep Dives (Interests & Obsessions)',
      strap: 'Diving Down the Rabbit Hole & Cultural Resonance',
      weeks: [1, 2],
      goal: 'Explore personal obsessions, rabbit holes, and cultural favorites to uncover the core spark for an authentic passion project.',
      tasks: [
        'Complete Part 1 of the Blueprint: Map your deepest rabbit holes, YouTube/Reddit deep-dives, and favorite media.',
        'Conduct a "Culture Check": Analyze what specifically resonates in your favorite games, anime, books, or music.',
        'Dream up your "Current Vibe": Describe an ideal Saturday with zero obligations and infinite resources.',
        'Identify 3 candidate passion project sparks.'
      ],
      evidence: [
        'Rabbit Hole Mind Map or audio brainstorm dump',
        'Culture Check inspiration mood board',
        'Initial 3 Project Spark pitch cards'
      ],
      aiPromptStarters: [
        'I am deeply obsessed with [Topic]. Help me brainstorm 5 unique project ideas that combine this with real-world problem solving.',
        'Help me analyze why I love [Game/Anime/Book] and identify core design mechanics I could use in a hands-on project.'
      ],
      competencies: ['sdl-01', 'ct-01', 'sea-01'],
      stretchCompetencies: ['ent-01'],
      sessions: [
        {
          sessionNumber: 1,
          week: 1,
          title: 'The Rabbit Hole & What Makes Your Brain Light Up',
          durationMin: 50,
          learningGoal: 'Identify personal hyperfocus areas and asynchronous interests without school-subject censorship.',
          activities: [
            'Welcome & Psychological Safety: Celebrate non-traditional interests (gaming, modding, botany, music synthesis).',
            'Individual Brain Dump: Complete Prompt 1 (The Rabbit Hole) using bullets, voice memos, or sketches.',
            'Peer Lightning Share: 2-minute show-and-tell on one fascinating fact from your favorite rabbit hole.'
          ],
          learnerChoices: {
            question: 'How do you want to record your initial brain dump?',
            options: [
              { id: 'opt-visual', label: 'Visual Sketch / Collage', description: 'Draw or clip images onto a digital or paper canvas.' },
              { id: 'opt-voice', label: 'Voice Memo Dump', description: 'Record an audio file detailing your obsession thoughts.' },
              { id: 'opt-bullet', label: 'Fast Bullet Points', description: 'Rapidly type or write raw bullet points without editing.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Log your top 2 rabbit holes and explain why your brain lights up when exploring them.',
            targetCompetencies: ['sdl-01', 'ct-01']
          },
          reflectionPrompt: 'What was it like to share an obsession without worrying if it sounded like a school subject?',
          teacherTips: 'Validate weird and hyper-specific topics; never suggest students pick something more academic.'
        },
        {
          sessionNumber: 2,
          week: 1,
          title: 'The Culture Check & Current Vibe',
          durationMin: 50,
          learningGoal: 'Deconstruct favorite media, games, and music to identify aesthetic and mechanical preferences.',
          activities: [
            'Culture Check Audit: Complete Prompt 3 on favorite games, tabletop rules, movies, and music artists.',
            'Mechanics Deconstruction: Identify what you love: is it the storytelling, the mechanics, the art, or the challenge?',
            'The Infinite Saturday Fantasy: Write or draw your dream Saturday with infinite resources.'
          ],
          learnerChoices: {
            question: 'What media lens do you want to analyze first?',
            options: [
              { id: 'opt-game', label: 'Interactive Game / Mechanics', description: 'Analyze game loops, level design, or balance.' },
              { id: 'opt-narrative', label: 'Story / Worldbuilding', description: 'Analyze character arcs, lore, and visual aesthetics.' },
              { id: 'opt-system', label: 'System / Sound / Technical', description: 'Analyze audio synthesis, physical builds, or strategy.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Record 3 specific mechanics or creative elements from your favorite media that you want to borrow for your own project.',
            targetCompetencies: ['ct-02', 'ctps-01']
          },
          reflectionPrompt: 'If your dream project had a soundtrack or visual style, what would it look like?',
          teacherTips: 'Help students look beyond surface fandom to the underlying engineering or storytelling craft.'
        },
        {
          sessionNumber: 3,
          week: 2,
          title: 'The Fixer-Upper: Spotting Real-World Friction',
          durationMin: 50,
          learningGoal: 'Connect personal interests to real problems in the local community, environment, or daily routine.',
          activities: [
            'Prompt 2 Deep Dive: Identify one thing in your community, world, or personal daily life that needs fixing.',
            'Intersection Brainstorm: Cross-pollinate your Rabbit Hole with your Fixer-Upper problem.',
            'Case Studies: Review examples of student projects born from quirky hobbies solving real problems.'
          ],
          learnerChoices: {
            question: 'What scale of problem do you want to tackle?',
            options: [
              { id: 'opt-personal', label: 'Personal / Daily Life', description: 'A tool or system to fix a friction point in your own day.' },
              { id: 'opt-community', label: 'Local Community / School', description: 'A project benefiting peers, teachers, or neighborhood.' },
              { id: 'opt-global', label: 'Global / Ecological', description: 'A challenge addressing broader environmental or social issues.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Draft an intersection statement: "I can use my interest in [X] to help fix [Y] for [Z]."',
            targetCompetencies: ['ctps-02', 'sea-02']
          },
          reflectionPrompt: 'Why does solving this particular problem feel personally urgent or meaningful to you?',
          teacherTips: 'Encourage students that fixing small personal friction points is just as rigorous as tackling climate change.'
        },
        {
          sessionNumber: 4,
          week: 2,
          title: 'Project Spark Synthesis & Exploration Review',
          durationMin: 50,
          learningGoal: 'Synthesize initial discoveries into 3 candidate project sparks for mentor feedback.',
          activities: [
            'Spark Formulation: Synthesize 3 distinct project ideas with clear titles and one-sentence elevator pitches.',
            'Mentor Speed Dating: 3-minute check-ins with coach to assess excitement and feasibility.',
            'Phase 1 Exploration Reflection: Document self-directed learning insights.'
          ],
          learnerChoices: {
            question: 'Which spark format do you want to pitch first?',
            options: [
              { id: 'opt-spark-wild', label: 'The Wild Moonshot', description: 'Huge, ambitious, high-creativity idea.' },
              { id: 'opt-spark-practical', label: 'The Practical Builder', description: 'Concrete, hands-on, highly achievable build.' },
              { id: 'opt-spark-deep', label: 'The Deep Lore / Theory', description: 'Rich, analytical, research-heavy project.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your 3 Candidate Project Spark cards with rationale.',
            targetCompetencies: ['sdl-02', 'ec-01']
          },
          reflectionPrompt: 'Which of the three ideas makes your heart race with excitement the most?',
          teacherTips: 'Do not shoot down moonshots; help students identify the core seed of the moonshot that can be prototyped.'
        }
      ]
    },
    {
      id: 'empathise',
      title: 'Audience & Stakeholder Connection',
      strap: 'Connecting with the Dream Audience & User Empathy',
      weeks: [3, 4],
      goal: 'Identify the dream audience (Prompt 10) and understand their needs, context, and feedback criteria.',
      tasks: [
        'Complete Blueprint Prompt 10: Envision your dream audience (experts, friends, younger kids, online community, or private).',
        'Conduct 1 user interview or empathy observation with someone representing that audience.',
        'Develop an Empathy Persona & Journey Map for the user experiencing your project.',
        'Define key emotional and practical needs your project must fulfill.'
      ],
      evidence: [
        'Dream Audience Persona card',
        'User/Expert interview notes or audio recording',
        'Empathy map with "Says, Thinks, Does, Feels"'
      ],
      aiPromptStarters: [
        'I am designing a project for [Audience]. What are 5 interview questions I can ask to understand their struggles?',
        'How might an expert in [Domain] evaluate a high school student’s prototype? What key standards do they look for?'
      ],
      competencies: ['sea-03', 'ec-02', 'ctps-03'],
      stretchCompetencies: ['lc-01'],
      sessions: [
        {
          sessionNumber: 5,
          week: 3,
          title: 'The Dream Audience: Who Are You Building For?',
          durationMin: 50,
          learningGoal: 'Clarify target audience expectations and choose between public exhibition, community launch, or private mastery.',
          activities: [
            'Prompt 10 Exploration: Who is the dream audience for your project?',
            'Audience Taxonomy: Compare expert critiques vs peer playtests vs younger student workshops.',
            'Safe Boundary Setting: Clarify if parts of the project will remain private or shared selectively.'
          ],
          learnerChoices: {
            question: 'Who is your primary dream audience?',
            options: [
              { id: 'opt-aud-peers', label: 'Peers & Friends', description: 'Collaborative fun, gaming, creative expression.' },
              { id: 'opt-aud-experts', label: 'Domain Experts / Makers', description: 'Industry professionals, engineers, published artists.' },
              { id: 'opt-aud-younger', label: 'Younger Kids / Community', description: 'Teaching, mentoring, community workshops.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Describe your dream audience and what you want them to feel or learn when they interact with your work.',
            targetCompetencies: ['ec-02', 'sea-03']
          },
          reflectionPrompt: 'Why does showing this to your dream audience feel more motivating than showing it for a grade?',
          teacherTips: 'Honor requests for private or semi-private showcases; forced public exposure causes 2e panic.'
        },
        {
          sessionNumber: 6,
          week: 3,
          title: 'Empathy Discovery: Listening to Real Needs',
          durationMin: 50,
          learningGoal: 'Formulate empathetic interview questions and listen actively to user feedback.',
          activities: [
            'Interview Guide Drafting: Create 3 open-ended questions using AI Co-Pilot scaffolding.',
            'Roleplay Interview Practice: Pair up with a peer to test your interview questions.',
            'Field Observation: Plan how you will gather insights from your audience.'
          ],
          learnerChoices: {
            question: 'How will you gather empathy insights?',
            options: [
              { id: 'opt-int-live', label: 'Live Conversation', description: 'In-person or video chat 10-minute dialogue.' },
              { id: 'opt-int-async', label: 'Digital Survey / Form', description: 'Send a quick 3-question Google form or Discord poll.' },
              { id: 'opt-int-observe', label: 'Direct Observation', description: 'Watch someone interact with an existing solution and take notes.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Log raw empathy quotes and observations gathered from your target audience.',
            targetCompetencies: ['ctps-03', 'lc-02']
          },
          reflectionPrompt: 'What was the most surprising thing your audience said that changed your assumptions?',
          teacherTips: 'Ensure neurodivergent students have scripting support if live interviewing triggers social anxiety.'
        },
        {
          sessionNumber: 7,
          week: 4,
          title: 'Empathy Persona & Journey Mapping',
          durationMin: 50,
          learningGoal: 'Map the emotional arc and functional friction of the user interacting with your project.',
          activities: [
            'Synthesize raw feedback into a visual Empathy Persona card.',
            'Map the User Journey: Beginning (curiosity/problem) -> Middle (interaction) -> End (satisfaction/resolution).',
            'Pinpoint the "Aha! Moment" where your project delivers delight or relief.'
          ],
          learnerChoices: {
            question: 'Which persona format fits your workflow?',
            options: [
              { id: 'opt-per-card', label: 'Visual Character Card', description: 'Illustrated profile with stats and goals.' },
              { id: 'opt-per-comic', label: 'Storyboard / Comic Strip', description: '3-panel comic showing user problem and discovery.' },
              { id: 'opt-per-narrative', label: 'Short First-Person Monologue', description: 'A monologue written from the user’s perspective.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your completed Empathy Persona or User Journey diagram.',
            targetCompetencies: ['ct-03', 'sea-04']
          },
          reflectionPrompt: 'How does stepping into another person’s shoes change how you view your project idea?',
          teacherTips: 'Encourage students to include sensory details (sounds, frustrations, lighting) in their journey maps.'
        },
        {
          sessionNumber: 8,
          week: 4,
          title: 'Empathy Gate: Refined Driving Need',
          durationMin: 50,
          learningGoal: 'Translate empathy findings into a clear stakeholder design requirement.',
          activities: [
            'Review empathy data with teacher or mentor.',
            'Refine your project scope based on real audience needs.',
            'Prepare for Phase 3 (Define) by documenting the core problem statement.'
          ],
          learnerChoices: {
            question: 'What is the biggest design pivot you need to make?',
            options: [
              { id: 'opt-piv-simplify', label: 'Simplify Scope', description: 'Cut features to focus on one crucial user need.' },
              { id: 'opt-piv-expand', label: 'Deepen Accessibility', description: 'Add accommodations for sensory or physical needs.' },
              { id: 'opt-piv-story', label: 'Enhance Story/Aesthetic', description: 'Make the experience more engaging and immersive.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Write your Refined Stakeholder Design Requirement.',
            targetCompetencies: ['ctps-04', 'ec-03']
          },
          reflectionPrompt: 'Are you building what YOU want, what the AUDIENCE needs, or the sweet spot where both meet?',
          teacherTips: 'Help students embrace the "sweet spot" where personal passion directly serves an audience.'
        }
      ]
    },
    {
      id: 'define',
      title: 'Toolkit, Vibe & Problem Framing',
      strap: 'Selecting Creative Outlets & Calibrating Project Vibe',
      weeks: [5, 6],
      goal: 'Audit personal creative tools (Part 2), pick project vibe (Quick-Fire), and define the formal How Might We (HMW) statement.',
      tasks: [
        'Complete Blueprint Part 2: Audit creative toolkit (Writing, Coding, Art, Building, Performance, Organizing).',
        'Identify Comfort Zone vs Stretch Zone skills (Prompts 6 & 7).',
        'Lock in your Quick-Fire Vibe: Physical vs Digital vs Theoretical; Fast vs Slow; Solo vs Crew.',
        'Craft your formal How Might We (HMW) question with measurable success criteria.'
      ],
      evidence: [
        'Toolkit & Vibe Alignment Matrix',
        'Comfort vs Stretch Zone declaration',
        'Finalized HMW Question & Scope Contract'
      ],
      aiPromptStarters: [
        'Here is my creative toolkit: [Tools]. Help me refine my project scope so 80% is in my comfort zone and 20% in my stretch zone.',
        'Turn my rough project idea into 3 clear "How Might We" questions that balance creativity with feasibility.'
      ],
      competencies: ['sdl-03', 'ct-04', 'ctps-05'],
      stretchCompetencies: ['lc-03'],
      sessions: [
        {
          sessionNumber: 9,
          week: 5,
          title: 'Creative Toolkit Audit: How Do You Like to Create?',
          durationMin: 50,
          learningGoal: 'Audit personal creative modalities (Prompt 5) and identify preferred maker tools.',
          activities: [
            'Prompt 5 Checklist: Select all creative modes that apply (Writing, Tech, Art, Hands-on, Performance, Data).',
            'Toolbox Inventory: List hardware, software, physical tools, and materials you already know how to use.',
            'Toolkit Pairing Exercise: Connect your chosen rabbit hole to 2 specific creation tools.'
          ],
          learnerChoices: {
            question: 'Which creative modality is your primary anchor?',
            options: [
              { id: 'opt-mod-physical', label: 'Hands-On Physical Making', description: 'LEGO, cardboard, wood, electronics, sewing.' },
              { id: 'opt-mod-digital', label: 'Digital Creation / Code', description: 'Game design, 3D modeling, coding, digital art.' },
              { id: 'opt-mod-narrative', label: 'Narrative & Media', description: 'Writing, audio, video, comics, podcasts.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'List your core creative toolkit tools and rate your confidence from 1 to 5 for each.',
            targetCompetencies: ['sdl-03', 'ct-04']
          },
          reflectionPrompt: 'Which tool makes time fly by so fast that you forget to check the clock?',
          teacherTips: 'Celebrate non-digital toolkits equally; woodworking and crochet require immense computational thinking.'
        },
        {
          sessionNumber: 10,
          week: 5,
          title: 'Comfort Zone vs Stretch Zone: The 80/20 Rule',
          durationMin: 50,
          learningGoal: 'Balance familiar strengths with one targeted stretch skill to avoid overwhelm and boredom.',
          activities: [
            'Prompt 6 & 7 Deep Dive: Pinpoint what feels easiest (Comfort) and what new skill you want to learn (Stretch).',
            'Apply the 80/20 Rule: 80% of project built on familiar tools; 20% dedicated to the stretch challenge.',
            'Scaffolding the Stretch: Identify where to get tutorials, mentor advice, or AI coaching for the 20%.'
          ],
          learnerChoices: {
            question: 'What is your designated 20% stretch skill?',
            options: [
              { id: 'opt-str-tech', label: 'Technical / Code / Wiring', description: 'Learning Arduino, physics engine, or API scripting.' },
              { id: 'opt-str-craft', label: 'Craft / Physical Fabrication', description: 'Learning 3D printing, joinery, or intricate sculpting.' },
              { id: 'opt-str-comm', label: 'Storytelling / Voice / Pitch', description: 'Recording voiceover, interviewing experts, or public speaking.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Declare your 80% Comfort Zone foundation and your 20% Stretch Goal.',
            targetCompetencies: ['sdl-04', 'ctps-05']
          },
          reflectionPrompt: 'Why is taking on only ONE stretch skill smarter than trying to learn five new things at once?',
          teacherTips: 'Watch out for overambitious 2e learners who want 100% of the project to be stretch skills; rein in scope gently.'
        },
        {
          sessionNumber: 11,
          week: 6,
          title: 'Quick-Fire: Pick Your Vibe & Cadence',
          durationMin: 50,
          learningGoal: 'Explicitly configure pace, social mode, and artifact medium to align with neurodivergent needs.',
          activities: [
            'Complete Quick-Fire Vibe Matrix: (1) Output medium, (2) Pacing style, (3) Social configuration.',
            'Vibe Discussion: Contrast "Fast & Experimental (trial and error)" vs "Slow, deep, and precise".',
            'Solo Wolf vs Crew: Establish collaboration agreements or solo ownership boundaries.'
          ],
          learnerChoices: {
            question: 'What is your chosen pacing style?',
            options: [
              { id: 'opt-pace-fast', label: 'Fast & Experimental (Trial & Error)', description: 'Rapid builds, frequent fails, quick adjustments.' },
              { id: 'opt-pace-deep', label: 'Slow, Deep & Precise', description: 'Detailed blueprints, meticulous planning, high craft.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Record your 3 Quick-Fire Vibe selections and explain why they suit your brain wiring.',
            targetCompetencies: ['sdl-05', 'sea-05']
          },
          reflectionPrompt: 'How does choosing your own pace change how stressful this project feels?',
          teacherTips: 'Fast-and-experimental students need permission to build rough junk; slow-and-deep students need protected quiet time.'
        },
        {
          sessionNumber: 12,
          week: 6,
          title: 'The Driving Question & Scope Contract',
          durationMin: 50,
          learningGoal: 'Draft the formal How Might We (HMW) driving question and sign the project scope contract.',
          activities: [
            'HMW Formulation Workshop: "How might we [action] for [audience] so that [impact]?"',
            'Scope Boundaries: Define what is strictly IN scope and what is explicitly OUT of scope.',
            'Sign the Project Scope Contract with your mentor.'
          ],
          learnerChoices: {
            question: 'Which HMW variation best captures your vision?',
            options: [
              { id: 'opt-hmw-empower', label: 'Empowerment / Help', description: 'Focused on making life easier or more joyful for someone.' },
              { id: 'opt-hmw-curiosity', label: 'Curiosity / Inquiry', description: 'Focused on testing a theoretical hypothesis or system.' },
              { id: 'opt-hmw-creative', label: 'Creative / Experience', description: 'Focused on evoking deep emotion, immersion, or fun.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Upload your finalized How Might We Driving Question and signed Scope Contract.',
            targetCompetencies: ['ctps-06', 'ec-04']
          },
          reflectionPrompt: 'When this project is completed, how will you know it actually worked?',
          teacherTips: 'The scope contract is a living document; remind learners they can renegotiate scope if friction occurs.'
        }
      ]
    },
    {
      id: 'ideate',
      title: 'Neuro-Scaffolding & Solution Planning',
      strap: 'De-risking Friction Points & Architecting Micro-Sprints',
      weeks: [7, 8],
      goal: 'Identify brain friction points (Part 3), map custom scaffolds, and break the build down into bite-sized Kanban micro-sprints.',
      tasks: [
        'Complete Blueprint Part 3: Brain Speed (Prompt 8) and Friction Points (Prompt 9).',
        'Select 2 Friction Strategies from the WeLearn Toolkit (e.g. 15-Min Ugly Draft, Mashup Twist, Voice Dictation).',
        'Conduct Crazy Eights rapid sketching for solution architecture.',
        'Build a visual Kanban board with 8 to 12 micro-sprint cards (under 30 minutes each).'
      ],
      evidence: [
        'Friction Point Scaffolding Plan',
        'Crazy Eights solution sketches',
        'Visual Kanban Sprint Board with granular task cards'
      ],
      aiPromptStarters: [
        'I suffer from [Friction Point, e.g. perfectionism paralysis]. Give me a low-stakes exercise to kick off my build phase.',
        'Break down my project [Project Name] into 10 granular tasks that take no longer than 25 minutes each.'
      ],
      competencies: ['sdl-06', 'ct-05', 'ctps-07'],
      stretchCompetencies: ['ent-02'],
      sessions: [
        {
          sessionNumber: 13,
          week: 7,
          title: 'Brain Speed & The Friction Audit',
          durationMin: 50,
          learningGoal: 'Diagnose what gets you moving when stuck (Prompt 8) and identify personal project roadblocks (Prompt 9).',
          activities: [
            'Prompt 8 Brain Speed Audit: Talking it out, staring at wall / walk, looking at examples, micro-checklists.',
            'Prompt 9 Friction Point Audit: Boredom halfway, hating long text, perfectionism trap, time organization.',
            'Friction Normalization: Teacher shares famous engineers and artists who struggled with the exact same friction.'
          ],
          learnerChoices: {
            question: 'What is your primary friction point to plan for?',
            options: [
              { id: 'opt-fric-perf', label: 'Perfectionism Paralysis', description: 'Afraid to make something flawed, so delaying the start.' },
              { id: 'opt-fric-bore', label: 'Mid-Project ADHD Drop', description: 'Novelty wears off after 2 weeks, leading to abandonment.' },
              { id: 'opt-fric-time', label: 'Time Blindness / Scope', description: 'Underestimating time required and getting overwhelmed.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Identify your #1 friction point and your #1 recovery tool when stuck.',
            targetCompetencies: ['sea-06', 'sdl-06']
          },
          reflectionPrompt: 'How does it feel to name your friction point out loud instead of pretending it doesn’t exist?',
          teacherTips: 'Praise vulnerability; naming friction is the highest form of self-directed metacognition.'
        },
        {
          sessionNumber: 14,
          week: 7,
          title: 'Friction Scaffolding: Engineering Custom Defenses',
          durationMin: 50,
          learningGoal: 'Design personalized counter-measures for anticipated friction points using WeLearn scaffolds.',
          activities: [
            'Scaffolding Selection: Match your friction point to a proven scaffold (Ugly Draft, Mashup Twist, Voice Notes).',
            'Emergency Protocol: Write a 3-step "If I get stuck..." emergency action plan card.',
            'Setup Scaffolding Tools: Configure speech-to-text, timer app, or physical cue cards.'
          ],
          learnerChoices: {
            question: 'Which scaffolding tool will you set up today?',
            options: [
              { id: 'opt-scaf-timer', label: 'Flow & Sprint Timer', description: '20-minute focus sprints with mandatory breaks.' },
              { id: 'opt-scaf-audio', label: 'Speech-to-Text / Audio Log', description: 'Dictation setup for voice-first evidence logging.' },
              { id: 'opt-scaf-buddy', label: 'Accountability / Body Double', description: 'Partnering with a peer for co-working sessions.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Upload your 3-Step Emergency Friction Action Plan card.',
            targetCompetencies: ['sdl-07', 'sea-07']
          },
          reflectionPrompt: 'Who can you turn to in the room when you need a 2-minute body-double or sounding board?',
          teacherTips: 'Body-doubling (working quietly side-by-side) does wonders for 2e executive functioning.'
        },
        {
          sessionNumber: 15,
          week: 8,
          title: 'Crazy Eights: Rapid Solution Generation',
          durationMin: 50,
          learningGoal: 'Generate 8 distinct visual concept variations in 8 minutes to silence the inner critic.',
          activities: [
            'Crazy Eights Exercise: Fold a paper into 8 boxes; sketch 1 rapid variation every 60 seconds.',
            'Zero Polish Mandate: Stick figures and rough boxes encouraged; high artistic polish forbidden.',
            'Peer Gallery Walk: Place sheets on tables, use sticky dots to vote on the most exciting elements.'
          ],
          learnerChoices: {
            question: 'What aspect of your project will you sketch variations for?',
            options: [
              { id: 'opt-ce-ui', label: 'Interface / Physical Form', description: 'Layout, buttons, chassis, visual presentation.' },
              { id: 'opt-ce-loop', label: 'User Experience Loop', description: 'Step-by-step how someone experiences your project.' },
              { id: 'opt-ce-mech', label: 'Mechanism / Core System', description: 'Internal gears, code structure, or storytelling arc.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a photo of your Crazy Eights 8-box sketch sheet.',
            targetCompetencies: ['ct-05', 'ctps-07']
          },
          reflectionPrompt: 'Which of the 8 boxes surprised you the most, and why did it only appear under time pressure?',
          teacherTips: 'Enforce the 60-second timer strictly; time pressure forces the inner perfectionist to stand down.'
        },
        {
          sessionNumber: 16,
          week: 8,
          title: 'Kanban Sprint Architecture & Task Atomization',
          durationMin: 50,
          learningGoal: 'Deconstruct the project prototype into granular 20-minute action cards on a Kanban board.',
          activities: [
            'Task Atomization: Break big tasks ("Build robot") into atomic cards ("Solder battery lead", "Test motor forward").',
            'WIP Limit Setup: Limit "In Progress" column to a maximum of 2 cards at any time to prevent overwhelm.',
            'Initial Sprint Backlog Prioritization: Order cards for Week 9 kickoff.'
          ],
          learnerChoices: {
            question: 'What type of Kanban board do you prefer?',
            options: [
              { id: 'opt-kan-physical', label: 'Physical Card Wall / Sticky Notes', description: 'Hands-on tactile satisfaction of moving physical cards.' },
              { id: 'opt-kan-digital', label: 'Digital Board (Notion / Trello)', description: 'Searchable, accessible anywhere with checklists.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Share your Kanban sprint board containing at least 8 atomized task cards.',
            targetCompetencies: ['sdl-08', 'ctps-08']
          },
          reflectionPrompt: 'Why does seeing 10 tiny cards feel less scary than seeing 1 huge looming deadline?',
          teacherTips: 'Check card sizes; if a card says "Write whole code", make the student break it into 3 smaller cards.'
        }
      ]
    },
    {
      id: 'prototype',
      title: 'Hands-On Build & Iterative Making',
      strap: 'Rapid Prototyping, Ugly Drafts & Physical/Digital Making',
      weeks: [9, 10],
      goal: 'Build, code, or craft the core functioning prototype through iterative micro-sprints and low-stakes ugly drafts.',
      tasks: [
        'Execute the 15-Minute "Ugly First Draft" prototype challenge to break build inertia.',
        'Work through Kanban micro-sprint cards with enforced 20-minute focus intervals.',
        'Use the PBL Studio AI Co-Pilot for targeted debugging, circuit checks, or phrasing advice.',
        'Log multi-modal evidence (code snippets, photo build logs, voice notes) with prompt provenance.'
      ],
      evidence: [
        'Photos/video of "Ugly First Draft" prototype',
        'Iterative build log entries across 4 sessions',
        'AI Co-Pilot interaction log with prompt provenance',
        'Working prototype artifact demo'
      ],
      aiPromptStarters: [
        'Here is the error I am seeing in my code/circuit: [Details]. Guide me through debugging it step by step.',
        'How can I assemble [Material A] and [Material B] cleanly without expensive specialized tools?'
      ],
      competencies: ['ctps-09', 'ct-06', 'sdl-09'],
      stretchCompetencies: ['lc-04'],
      sessions: [
        {
          sessionNumber: 17,
          week: 9,
          title: 'The 15-Minute Ugly First Draft Sprint',
          durationMin: 50,
          learningGoal: 'Create an intentionally rough, low-fidelity prototype in 15 minutes to eliminate blank-page paralysis.',
          activities: [
            'Sprint Rules: 15 minutes on the clock. Use cardboard, tape, crude shapes, or pseudo-code.',
            'Show and Laugh: 5-minute lightning gallery to celebrate the gloriously imperfect builds.',
            'Extract Core Value: Identify what the ugly draft proved about scale, function, or narrative flow.'
          ],
          learnerChoices: {
            question: 'What medium will you use for your ugly draft?',
            options: [
              { id: 'opt-ug-cardboard', label: 'Cardboard & Masking Tape', description: '3D rapid spatial form in minutes.' },
              { id: 'opt-ug-wireframe', label: 'Rough Digital Wireframe', description: 'Crude digital shapes with zero styling.' },
              { id: 'opt-ug-script', label: 'Bullet Point Skeleton', description: 'Raw outline or scratch audio recording.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a photo or screenshot of your 15-Minute Ugly First Draft.',
            targetCompetencies: ['ct-06', 'sdl-09']
          },
          reflectionPrompt: 'Now that the ugly draft exists in physical reality, what fears disappeared?',
          teacherTips: 'Award the "Wabi-Sabi Badge" to the most delightfully crude prototype; ban perfectionism!'
        },
        {
          sessionNumber: 18,
          week: 9,
          title: 'Micro-Sprint Execution: Building the Core Mechanism',
          durationMin: 50,
          learningGoal: 'Advance from rough draft to functional sub-assembly via focused Kanban tasks.',
          activities: [
            'Daily Standup: Move first Kanban card to "In Progress".',
            'Focus Block 1 (25 mins): Focused making/coding with zero distraction.',
            'Mid-Session Check-in: Move completed cards to "Done", assess blockers.'
          ],
          learnerChoices: {
            question: 'What sub-system are you tackling first?',
            options: [
              { id: 'opt-sub-core', label: 'Core Mechanism / Engine', description: 'The primary functional loop or build component.' },
              { id: 'opt-sub-ui', label: 'User Touchpoint / Exterior', description: 'The physical enclosure or interface.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Log your primary code snippet, wiring diagram, or construction assembly photo.',
            targetCompetencies: ['ctps-09', 'sdl-10']
          },
          reflectionPrompt: 'Did you respect your WIP limit, or did you try to multitask?',
          teacherTips: 'Circulate quietly; offer body-doubling presence for students working through technical snags.'
        },
        {
          sessionNumber: 19,
          week: 10,
          title: 'The Mashup Twist & Reigniting Novelty',
          durationMin: 50,
          learningGoal: 'Combat mid-project boredom by introducing an innovative creative twist or mashup element.',
          activities: [
            'The Boredom Check: Assess energy levels and interest engagement.',
            'Mashup Brainstorm: Brainstorm adding sound, lighting, unexpected lore, or Easter eggs.',
            'Prototype Integration: Build the mashup element into the existing sub-assembly.'
          ],
          learnerChoices: {
            question: 'What secondary passion will you mash up today?',
            options: [
              { id: 'opt-mash-audio', label: 'Sound / Music Element', description: 'Add custom chimes, ambient soundtrack, or voice lines.' },
              { id: 'opt-mash-visual', label: 'Visual Glow / Aesthetic', description: 'Add RGB illumination, weathered paint, or pixel art.' },
              { id: 'opt-mash-lore', label: 'Secret Lore / Easter Egg', description: 'Hide a secret message, puzzle, or story tidbit.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Describe your Mashup Twist and how it re-energized your excitement for the project.',
            targetCompetencies: ['ct-07', 'sea-08']
          },
          reflectionPrompt: 'How does adding playfulness prevent a big project from feeling like a chore?',
          teacherTips: 'The mashup twist is a proven ADHD retention hack; novelty releases dopamine needed to finish.'
        },
        {
          sessionNumber: 20,
          week: 10,
          title: 'Alpha Prototype Feature Freeze & Integration',
          durationMin: 50,
          learningGoal: 'Integrate sub-assemblies into a cohesive Alpha Prototype and implement a feature freeze.',
          activities: [
            'System Assembly: Connect all components into an end-to-end demonstrable unit.',
            'Feature Freeze Declaration: Agree to stop adding new features and focus on stability and polish.',
            'Self-Assessment against Scope Contract: Verify criteria met.'
          ],
          learnerChoices: {
            question: 'What is your primary focus for the freeze?',
            options: [
              { id: 'opt-frz-stable', label: 'Stability & Bug Squashing', description: 'Ensuring it doesn’t break during demonstration.' },
              { id: 'opt-frz-clarity', label: 'Usability & Instructions', description: 'Making it obvious how someone interacts with it.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a 30-second video demo of your Alpha Prototype in action.',
            targetCompetencies: ['ctps-10', 'ec-05']
          },
          reflectionPrompt: 'How proud do you feel seeing your idea working in front of you?',
          teacherTips: 'Celebrate the Alpha milestone! High-fives and photos for every functioning build.'
        }
      ]
    },
    {
      id: 'test',
      title: 'Friction Testing & Dream Audience Feedback',
      strap: 'Testing with Authentic Users & Iterative Refinement',
      weeks: [11, 11],
      goal: 'Test the prototype with representatives of the dream audience, debug real-world friction, and polish.',
      tasks: [
        'Conduct a structured Playtest / Demonstration with 2 to 3 target audience members.',
        'Observe user friction: Where do they get confused, stuck, or delighted?',
        'Execute 2 rapid fixes based on real user feedback.',
        'Run the 8-Point Showcase Readiness Audit to verify exhibition qualification.'
      ],
      evidence: [
        'User Playtest observation notes & quote log',
        'Before-and-after fix photo or code comparison',
        'Completed 8-Point Readiness Audit checklist'
      ],
      aiPromptStarters: [
        'Users are getting confused when they interact with [Feature]. What are 3 ways to make the affordance clearer?',
        'Help me design a simple 3-question survey card for people trying my prototype at the showcase.'
      ],
      competencies: ['ctps-11', 'ec-06', 'sea-09'],
      stretchCompetencies: ['lc-05'],
      sessions: [
        {
          sessionNumber: 21,
          week: 11,
          title: 'Dream Audience Playtest & Friction Observation',
          durationMin: 50,
          learningGoal: 'Observe target audience interaction without defensive explaining or intervening.',
          activities: [
            'Playtest Setup: Invite peers or guest testers to interact with the prototype.',
            'Silent Observation Protocol: Watch where users hesitate, smile, or get confused without intervening.',
            'Post-Test Debrief: Ask 2 targeted questions: "What felt magical?" and "Where did you get stuck?"'
          ],
          learnerChoices: {
            question: 'How do you want to capture playtest feedback?',
            options: [
              { id: 'opt-pt-notes', label: 'Live Observation Notes', description: 'Record timestamps and user facial reactions.' },
              { id: 'opt-pt-audio', label: 'Audio Recorded Feedback', description: 'Record the user thinking aloud as they test.' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Document feedback from at least 2 playtesters with specific quotes.',
            targetCompetencies: ['ec-06', 'ctps-11']
          },
          reflectionPrompt: 'What was hard about staying quiet while someone else used your creation?',
          teacherTips: 'Model constructive feedback; remind testers to critique the artifact, not the creator.'
        },
        {
          sessionNumber: 22,
          week: 11,
          title: 'Feedback Triage & The Final Polish Sprint',
          durationMin: 50,
          learningGoal: 'Triage user feedback into actionable fixes and complete final showcase adjustments.',
          activities: [
            'Feedback Triage: Categorize feedback into "Must Fix for Showcase", "Nice to Have", and "Future Version".',
            'Final Polish Sprint (30 mins): Implement the top 2 "Must Fix" adjustments.',
            'Run the 8-Point Showcase Readiness Audit.'
          ],
          learnerChoices: {
            question: 'Which feedback adjustment takes priority?',
            options: [
              { id: 'opt-adj-clarity', label: 'Clarity / Signage Fix', description: 'Add labels, onboarding guide, or clear affordances.' },
              { id: 'opt-adj-durability', label: 'Durability / Ruggedness', description: 'Reinforce joints, secure wires, or handle edge cases.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Log your Before-and-After fix and confirm readiness audit pass.',
            targetCompetencies: ['ctps-12', 'sdl-11']
          },
          reflectionPrompt: 'How does user feedback elevate a project from a private hobby to a public contribution?',
          teacherTips: 'Ensure students pass the 8-point audit before exhibition day.'
        }
      ]
    },
    {
      id: 'share',
      title: 'Public Showcase & Passion Launchpad',
      strap: 'Exhibiting to Dream Audience & Self-Advocacy Mastery',
      weeks: [12, 12],
      goal: 'Exhibit the passion project to the dream audience, celebrate neurodivergent strengths, and chart future directions.',
      tasks: [
        'Curate the Passion Project Portfolio with artifacts from all 7 phases.',
        'Deliver a 3-minute Passion Pitch to the dream audience (live or pre-recorded video).',
        'Facilitate hands-on interaction and answer visitor questions.',
        'Complete the Final Blueprint Metacognitive Reflection: "How My Brain Works Best".'
      ],
      evidence: [
        'Curated Portfolio link or display artifact',
        'Showcase presentation video or exhibition photo',
        'Final Metacognitive Reflection: "My Neuro-Scaffolding Manual"'
      ],
      aiPromptStarters: [
        'Help me structure a 3-minute presentation that highlights my rabbit hole inspiration, friction challenges, and final artifact.',
        'Draft an artist statement / maker statement explaining the passion and personal growth behind this project.'
      ],
      competencies: ['ec-07', 'sdl-12', 'sea-10'],
      stretchCompetencies: ['ent-03'],
      sessions: [
        {
          sessionNumber: 23,
          week: 12,
          title: 'Showcase Setup & The 3-Minute Passion Pitch',
          durationMin: 50,
          learningGoal: 'Curate a compelling exhibition space and rehearse a concise 3-minute passion pitch.',
          activities: [
            'Exhibition Booth Setup: Arrange prototype, ugly drafts, sketches, and audience prompt card.',
            'Pitch Rehearsal: Structure: (1) The Spark & Rabbit Hole, (2) The Friction & Pivot, (3) The Demo & Impact.',
            'Anxiety Regulation Check: Practice grounding techniques and peer support.'
          ],
          learnerChoices: {
            question: 'How do you want to deliver your showcase presentation?',
            options: [
              { id: 'opt-pres-live', label: 'Live Interactive Pitch', description: 'Talk directly to visitors standing at your booth.' },
              { id: 'opt-pres-video', label: 'Pre-Recorded Video / Demo', description: 'Screen a 2-minute produced video with voiceover.' },
              { id: 'opt-pres-tour', label: 'Guided Interactive Walkthrough', description: 'Hand visitors the controller/tool and coach them through it.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a photo of your finished exhibition booth and rehearsed pitch outline.',
            targetCompetencies: ['ec-07', 'sea-10']
          },
          reflectionPrompt: 'What part of your presentation makes you feel the most proud and authentic?',
          teacherTips: 'Provide a quiet sensory retreat room for students who get overstimulated during public exhibitions.'
        },
        {
          sessionNumber: 24,
          week: 12,
          title: 'The Dream Audience Showcase & Metacognitive Celebration',
          durationMin: 50,
          learningGoal: 'Exhibit projects to the dream audience, gather praise and feedback, and celebrate self-directed growth.',
          activities: [
            'The Public Exhibition: Open doors to the dream audience (mentors, experts, peers, community).',
            'Interactive Demos & Q&A: Visitors test prototypes and discuss creative decisions.',
            'Final Metacognitive Debrief: Fill out "My Neuro-Scaffolding Manual: How My Brain Works Best" for future years.'
          ],
          learnerChoices: {
            question: 'What will be the next evolution of this project?',
            options: [
              { id: 'opt-nxt-scale', label: 'Keep Building & Scale Up', description: 'Enter a competition, open-source the build, or sell to users.' },
              { id: 'opt-nxt-new', label: 'Archive & Dive Down New Hole', description: 'Celebrate completion and explore the next obsession.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Complete your final blueprint reflection: "What did this project teach me about my brain, my passions, and my power as a creator?"',
            targetCompetencies: ['sdl-12', 'sea-10']
          },
          reflectionPrompt: 'If you could go back to Week 1, what advice would you give your past self sitting at the blank page?',
          teacherTips: 'Every student receives their personalized Passion Launchpad certification; celebrate all pathways!'
        }
      ]
    }
  ]
};
