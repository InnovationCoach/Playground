/**
 * Extra Materials Generator
 * Produces 1-click curriculum collateral from the synthesized unit and grounding sources:
 * 1. Slides Deck (presentation deck with headings, bullet points, speaker notes)
 * 2. Formative Quiz (interactive concept check with feedback)
 * 3. Narration Script (audio/video instructional script with timestamps)
 * 4. MakerSpace Job Sheet (bench workstation tool requirements and build steps)
 * 5. Parent Summary (approachable family update and home connection questions)
 */

export function generateExtraMaterials(unit, sources = []) {
  if (!unit) return null;

  const title = unit.unitTitle || 'PBL Unit';
  const dq = unit.drivingQuestion || '';
  const milestones = Array.isArray(unit.milestones) ? unit.milestones : [];
  const makerSpecs = Array.isArray(unit.makerSpaceSpecs) ? unit.makerSpaceSpecs : [];
  const coachName = unit.coachCues?.leadCoach || 'Coach';

  // 1. Slides
  const slides = [
    {
      slideNumber: 1,
      heading: title,
      subheading: `Driving Question: "${dq}"`,
      bullets: [
        `Target Cohort: ${unit.programme || 'WeLearn Secondary'}`,
        `Real-World Problem: ${unit.realProblem?.peopleImpact || 'Authentic community challenge'}`,
        `Final Exhibition: Multi-modal prototype showcase & pitch`
      ],
      speakerNotes: `Welcome everyone! Today we launch "${title}". Notice our driving question on the board. Over the next 8 stages, you will work from initial curiosity all the way to a public expo.`
    },
    {
      slideNumber: 2,
      heading: 'The Challenge & Real-World Impact',
      subheading: 'Why This Matters Beyond the Classroom',
      bullets: [
        `Impact for People: ${unit.realProblem?.peopleImpact || 'Empowering communities through human-centred design'}`,
        `Impact for Environment: ${unit.realProblem?.environmentalImpact || 'Sustainable resource conservation & climate resilience'}`,
        `Design Constraints: Grounded in peer review and authentic engineering standards`
      ],
      speakerNotes: `Frame the real problem clearly. Ask learners: 'Who is most affected by this problem, and what makes current solutions fall short?'`
    },
    {
      slideNumber: 3,
      heading: 'The 8-Stage PBL Journey',
      subheading: 'From Curiosity to Showcase',
      bullets: milestones.slice(0, 4).map((m) => `Stage ${m.stageNumber} (${m.stageName}): ${m.title}`),
      speakerNotes: `Highlight that stage 1 through 4 are about deep empathy, research, and divergence before touching heavy tools.`
    },
    {
      slideNumber: 4,
      heading: 'MakerSpace Fabrication & Testing',
      subheading: 'Tools, Sensors & Iteration Protocols',
      bullets: [
        ...milestones.slice(4, 7).map((m) => `Stage ${m.stageNumber} (${m.stageName}): ${m.title}`),
        `Assigned Gear: ${makerSpecs.map((s) => s.toolType).join(', ') || 'Rapid prototyping equipment'}`
      ],
      speakerNotes: `Safety first. Emphasize that failure in early prototypes is vital telemetry. Every design change must be logged in your lab journal.`
    },
    {
      slideNumber: 5,
      heading: 'Public Showcase & Pitch',
      subheading: 'Demonstrating Evidence to Real Audiences',
      bullets: [
        `Stage 8: ${milestones[7]?.title || 'Showcase & Public Expo'}`,
        '60-second video elevator pitch or live mechanical demonstration',
        'Physical prototype exhibited on the Fab Lab test bench',
        'Reflective Q&A with visiting mentors and peers'
      ],
      speakerNotes: `Prepare your pitch decks and test benches. Remind learners to explain not just what worked, but what broke and how they iterated.`
    }
  ];

  // 2. Formative Quiz
  const quizItems = [
    {
      id: 'quiz-1',
      prompt: `What is the core driving question for our unit "${title}"?`,
      options: [
        dq,
        'How can we memorize all engineering formulas for an exam?',
        'How can we purchase a commercial solution online?',
        'How do we complete homework assignments without asking questions?'
      ],
      correctIndex: 0,
      explanation: 'Our driving question focuses our hands-on investigation and MakerSpace fabrication.'
    },
    {
      id: 'quiz-2',
      prompt: `In Stage 1 (${milestones[0]?.stageName || 'Curiosity'}), what is the student\'s primary goal?`,
      options: [
        'Fabricate the final production-ready model immediately.',
        milestones[0]?.learningGoal || 'Explore core phenomena and formulate investigative questions.',
        'Deliver a public pitch to external investors.',
        'Clean up the workshop benches.'
      ],
      correctIndex: 1,
      explanation: 'Early stages focus on curiosity, questioning, and understanding constraints.'
    },
    {
      id: 'quiz-3',
      prompt: 'When using MakerSpace equipment for rapid prototyping, what is the primary safety rule?',
      options: [
        'Work as quickly as possible without eye protection.',
        makerSpecs[0]?.safetyGuidelines || 'Wear required safety equipment and review tool operations with the coach before powering on.',
        'Only use tools after hours without supervision.',
        'Ignore material tolerances during 3D printing and cutting.'
      ],
      correctIndex: 1,
      explanation: 'Safety protocols ensure high-iteration experimentation without risk of injury.'
    },
    {
      id: 'quiz-4',
      prompt: 'What constitutes valid evidence of milestone completion for Stage 8 Showcase?',
      options: [
        'A single copied textbook paragraph.',
        'A multi-modal artifact (working prototype demo, video pitch, or telemetry log) reviewed against criteria.',
        'A verbal promise with no physical or digital artifacts.',
        'An empty repository with no commits.'
      ],
      correctIndex: 1,
      explanation: 'WeLearn PBL emphasizes authentic, multi-modal evidence that can be demonstrated to real stakeholders.'
    }
  ];

  // 3. Narration Script
  const narrationScript = [
    {
      id: 'narr-1',
      title: 'Introduction & Project Hook',
      durationSec: 45,
      text: `Hello and welcome to "${title}". Today we are taking on a pressing real-world challenge: ${unit.realProblem?.peopleImpact || dq}. Over the coming weeks, you won\'t just be studying this in theory—you will be designing, building, and testing an authentic solution.`
    },
    {
      id: 'narr-2',
      title: 'Navigating the 8 Milestones',
      durationSec: 60,
      text: `Our journey has 8 stages. We start in Curiosity and Empathy, figuring out what makes this problem tick. As we move into Ideation and Prototyping, you will jump onto the MakerSpace bench. Remember: your first prototype is meant to test an assumption, not be perfect.`
    },
    {
      id: 'narr-3',
      title: 'MakerSpace Bench Protocol',
      durationSec: 40,
      text: `When you step into the MakerSpace, keep your safety checklist top of mind. Log your measurements, calibrate your sensors, and don't hesitate to ask ${coachName} if you encounter unexpected mechanical resistance.`
    },
    {
      id: 'narr-4',
      title: 'Showcase Preparation',
      durationSec: 45,
      text: `At the end of this sprint, you will present your working prototype and 60-second pitch at our public expo. Be proud of your iterations, your telemetry, and the real impact your design offers.`
    }
  ];

  // 4. MakerSpace Job Sheet
  const jobSheet = {
    unitTitle: title,
    date: new Date().toLocaleDateString('en-GB'),
    leadCoach: coachName,
    requiredTools: makerSpecs.map((s) => s.toolType),
    safetyChecklist: [
      'Safety glasses and protective footwear worn at all times near fabrication benches.',
      'Emergency power shut-off switches verified before machinery activation.',
      'Material data sheets (SDS) and temperature tolerances checked for filaments/resins/adhesives.',
      'Workspace cleaned and tools returned to shadow boards upon session completion.'
    ],
    fabricationSteps: milestones.slice(3, 7).map((m, idx) => ({
      stepNumber: idx + 1,
      stage: m.stageName,
      task: m.title,
      goal: m.learningGoal,
      benchTools: m.makerSpaceTools || ['General fabrication tools'],
      coachSignOffRequired: idx === 1 || idx === 3 // Sign off required on prototype and testing
    }))
  };

  // 5. Parent Summary
  const parentSummary = {
    unitTitle: title,
    cohort: unit.programme === 'WLS' ? 'WeLearn Lower Secondary (Ages 11–14)' : (unit.programme === 'WHS' ? 'WeLearn Higher Secondary (Ages 15–18)' : 'Primary'),
    summaryText: `Your learner is embarking on an exciting 8-stage Project-Based Learning unit titled "${title}". Grounded in real-world challenges, this project challenges students to answer: "${dq}".`,
    skillsDeveloped: [
      'Authentic STEM engineering design and physical MakerSpace prototyping',
      'Critical thinking, iterative problem-solving, and resilience through design failures',
      'Effective public communication and technical demonstration'
    ],
    milestoneOverview: `Students will progress from initial scientific research and empathy interviews through hands-on fabrication, ending with a live showcase demonstrating their prototype.`,
    homeConversationStarters: [
      `"What surprised you most when you were researching ${title} this week?"`,
      `"How did your first prototype perform, and what did you have to redesign?"`,
      `"How does your project help real people or the environment in our community?"`
    ]
  };

  return {
    slides,
    quizItems,
    narrationScript,
    jobSheet,
    parentSummary
  };
}
