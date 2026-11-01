/**
 * Synthesizes and publishes a NotebookLM-grounded 2e curriculum course for Tom Becker,
 * and transfers it to Tom's dashboard via Firestore and enrolments.
 */

import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8088';

admin.initializeApp({ projectId: 'demo-hearisland-local' });
const db = getFirestore();

const TOM_UID = '2GGQ0YZ0aMH1fowyVoBcfq3Fg6hR';
const COACH_UID = 'kpBa3UGtOIPnmIrxzVLuhv9oPwXr';
const CLASS_ID = 'class_yr12_eng';
const PROGRAM_ID = 'autonomous-rover-tom-becker-2026';

const now = Date.now();

const programData = {
  id: PROGRAM_ID,
  slug: PROGRAM_ID,
  title: 'Autonomous Rover & Microclimate Telemetry',
  subtitle: 'Urban Heat & Robotics · 2e Customized for Tom Becker',
  theme: 'Autonomous Robotics & Urban Microclimate Mapping',
  drivingQuestion: 'How might we design a solar-powered autonomous rover with microclimate telemetry to detect urban heat islands without risking human volunteers?',
  impact: {
    people: 'Protects vulnerable elderly and outdoor workers by pinpointing hyper-local thermal stress zones in Bangkok.',
    environment: 'Maps urban canopy temperature gradients and particulate pollution with zero tailpipe emissions.'
  },
  frameworkId: 'welearn-dt',
  frameworkVersion: 1,
  ageBand: 'higher-secondary',
  targetAgeRange: 'Ages 16–18 (Year 12 Engineering)',
  durationWeeks: 12,
  totalSessions: 8,
  authorId: COACH_UID,
  source: 'studio',
  status: 'published',
  visibility: 'centre',
  searchTokens: [
    'autonomous', 'rover', 'microclimate', 'telemetry', 'robotics', 'urban',
    'heat', 'engineering', 'sensors', 'tom', 'becker', 'micropython'
  ],
  tags: ['robotics', 'iot', 'urban-heat', '2e-curriculum', 'year-12-engineering'],
  createdAt: now,
  updatedAt: now,
  publishedAt: now,
  realProblem: {
    summary: 'Urban heat islands and dense traffic corridors in Bangkok create acute microclimate pockets exceeding safe thermal thresholds.',
    peopleImpact: 'Prevents heat stroke among outdoor workers and transit commuters through automated sensor alerts.',
    environmentalImpact: 'Gathers continuous soil moisture and ambient temperature data to inform green corridor urban planning.'
  },
  materialsAndKit: {
    microcontrollers: ['Raspberry Pi Pico W', 'BBC micro:bit V2', 'Dual H-Bridge Motor Driver (L298N)'],
    sensorsAndActuators: ['SHT31 High-Precision Temp & Humidity', 'BME680 VOC Air Quality', 'HC-SR04 Ultrasonic Distance', 'TT Geared Motors (1:48)'],
    fabricationMaterials: ['Bambu Lab PETG Filament', '3mm Cast Clear Acrylic', 'M3 Standoff Hardware Kit', 'Silicone Wiring Harness'],
    softwareAndTools: ['Bambu Studio Slicer', 'Autodesk Fusion 360 / Blender', 'Thonny MicroPython IDE', 'Git & GitHub']
  },
  teacherGuidance: {
    safetyProtocol: [
      'Ensure soldering iron stands are tethered and exhaust fan is active.',
      'Allow heated 3D print bed to cool below 35°C before removing parts.',
      'Check LiPo battery voltage with multimeter before bench charging.'
    ],
    pedagogicalScaffolding: [
      'Micro-deadlines with visible 15-minute countdown timers to prevent task initiation paralysis.',
      'GitHub commit logs and 60-second video demo pitches in place of written reports.',
      'Pre-cut acrylic baseplate provided for initial milestone momentum.'
    ],
    aiEthicsRules: [
      'AI Co-Pilot used for state machine logic brainstorming and MicroPython debugging.',
      'Learner explains every design and telemetry decision in the engineering log.'
    ]
  },
  coachCues: {
    leadCoach: 'Coach Ada Okafor',
    initiationCue: 'Tom initiates best when given a tangible breadboard wiring prompt with a 15-minute focus timer. High kinetic momentum breaks open-ended paralysis.',
    frustrationDeescalationCue: 'If I2C telemetry fails or packets drop, use an oscilloscope screen to visually inspect signal rise times rather than discussing theoretical bugs.',
    midCheckCue: 'Week 6 Scope Guard: Validate autonomous obstacle avoidance before adding cloud dashboard visualization.',
    showcaseCue: 'Coach Ada: Arrange an authentic outdoor obstacle course on the campus terrace for Tom\'s live autonomous trial run.'
  },
  identity: {
    icon: 'Compass',
    tone: 'purple',
    short: 'Autonomous Rover'
  },
  targetLearner: {
    id: TOM_UID,
    name: 'Tom Becker',
    grade: 'Year 12 (Higher Secondary)',
    cohort: 'cohort-w2e',
    diagnosisTraits: 'Gifted + Kinesthetic Prototyper (High Technical Focus, Writing Fatigue)',
    consumingPassions: 'Mechatronics, Autonomous Ground Vehicles, Telemetry Arrays',
    executiveFunctionHurdles: 'Task initiation on unstructured prompts, writing fatigue on long narrative documentation',
    appliedAccommodations: [
      'Micro-deadlines with visible 15-minute countdown timers',
      'Multi-modal deliverables: GitHub commits and 60s demo videos instead of essays',
      'Direct bench access to Bambu Lab 3D printers and CNC/Laser tools'
    ]
  },
  phases: [
    {
      id: 'phase-1',
      phaseId: 'phase-1',
      title: 'Stage 1: Curiosity & Exploration',
      strap: 'Week 1 · Sensor Telemetry & Incline Physics',
      weeks: [1, 1],
      goal: 'Explore temperature gradients and tire traction mechanics using tactile MakerSpace rigs.',
      tasks: [
        'Connect SHT31 sensor to Raspberry Pi Pico and log ambient thermal variance',
        'Test 3 tire tread patterns on 15° and 25° incline ramps',
        'Record initial inquiry sparks on heat retention in concrete vs green ground surfaces'
      ],
      evidence: ['Upload a 30s video showing tire traction testing and sensor telemetry readings.'],
      tools: ['Raspberry Pi Pico W', 'SHT31 Sensor', 'Incline Ramp Rig', 'Digital Calipers'],
      deliverables: ['30s Video Demo', 'Traction Friction Readings'],
      competencies: ['sdl-01', 'ctps-01'],
      stretchCompetencies: ['ct-10'],
      coachCue: 'Start directly with the physical ramp and live serial monitor—zero paperwork first.',
      sessions: [
        {
          sessionNumber: 1,
          title: 'Sensor Calibration & Incline Traction Testing',
          durationMin: 90,
          week: 1,
          learningGoal: 'Establish baseline telemetry logging and traction coefficient data.',
          activities: [
            'Flash MicroPython onto Pico W and verify I2C sensor communication',
            'Record friction measurements on slick acrylic vs rubber treads',
            'Log 3 inquiry sparks regarding thermal hotspot detection'
          ],
          teacherTips: 'Support learner initiation and celebrate iterations.'
        }
      ]
    },
    {
      id: 'phase-2',
      phaseId: 'phase-2',
      title: 'Stage 2: Empathise & Discovery',
      strap: 'Week 2 · First Responder & Urban Heat Needs',
      weeks: [2, 2],
      goal: 'Analyze urban microclimate vulnerabilities and synthesize stakeholder empathy constraints.',
      tasks: [
        'Review Bangkok metropolitan heat map data and interview school facility team',
        'Extract 4 core field constraints (clearance, runtime, heat endurance, weight)',
        'Synthesize visual user empathy quadrant: Say, Think, Do, Feel'
      ],
      evidence: ['Bulleted field constraint card and 45s audio reflection memo.'],
      tools: ['Empathy Canvas', 'Bangkok Climate Data Archive', 'Audio Recorder'],
      deliverables: ['Field Constraints Brief', 'Audio Voice Memo'],
      competencies: ['sdl-01', 'ctps-01'],
      stretchCompetencies: ['ct-10'],
      coachCue: 'Allow Tom to record voice notes to alleviate writing fatigue.',
      sessions: [
        {
          sessionNumber: 2,
          title: 'Urban Heat Vulnerability Analysis',
          durationMin: 90,
          week: 2,
          learningGoal: 'Define concrete human constraints for extreme heat environments.',
          activities: [
            'Analyze Bangkok urban heat corridor charts',
            'Map human vulnerability zones',
            'Draft field specification checklist'
          ]
        }
      ]
    },
    {
      id: 'phase-3',
      phaseId: 'phase-3',
      title: 'Stage 3: Define & Success Criteria',
      strap: 'Week 3 · Measurable Engineering Criteria & HMW',
      weeks: [3, 3],
      goal: 'Define strict quantitative success metrics (clear 40mm obstacles, 20m telemetry range, <750g total weight).',
      tasks: [
        'Formulate quantitative How Might We engineering statement',
        'Define 3 gating criteria: climb angle >= 20°, battery life >= 45 min, packet loss < 2%',
        'Draft electrical block diagram with pinout allocations'
      ],
      evidence: ['Schematic pinout diagram with the 3 measurable test gates annotated.'],
      tools: ['Digital Weigh Scale', 'Electrical Diagram Canvas', 'Multimeter'],
      deliverables: ['Schematic Diagram', 'Criteria Card'],
      competencies: ['sdl-01', 'ctps-01'],
      stretchCompetencies: ['ct-10'],
      coachCue: 'Pin the 3 test gates on the workstation monitor as a visual anchor.',
      sessions: [
        {
          sessionNumber: 3,
          title: 'System Architecture & Engineering Metrics',
          durationMin: 90,
          week: 3,
          learningGoal: 'Establish unambiguous quantitative test criteria.',
          activities: ['Draft circuit diagram', 'Compute power budget', 'Set test gates']
        }
      ]
    },
    {
      id: 'phase-4',
      phaseId: 'phase-4',
      title: 'Stage 4: Ideate & Co-Pilot Architecture',
      strap: 'Week 5 · MicroPython State Machine & 3D CAD',
      weeks: [5, 5],
      goal: 'Architect rover suspension linkages and co-develop MicroPython state machine with AI Co-Pilot.',
      tasks: [
        'Evaluate rocker-bogie vs 4-wheel independent spring suspension in CAD',
        'Prompt AI Co-Pilot for autonomous obstacle avoidance state machine',
        'Review AI code line-by-line and annotate ultrasonic debounce logic'
      ],
      evidence: ['Commit MicroPython state machine to GitHub repo with inline comments.'],
      tools: ['Fusion 360 / Blender', 'Thonny MicroPython IDE', 'AI Co-Pilot'],
      deliverables: ['GitHub Repository Commit', 'CAD 3D Linkage Model'],
      competencies: ['sdl-01', 'ctps-01'],
      stretchCompetencies: ['ct-10'],
      coachCue: 'Verify code logic on breadboard with indicator LEDs before motor mounting.',
      sessions: [
        {
          sessionNumber: 4,
          title: 'Firmware Logic & Suspension Modeling',
          durationMin: 90,
          week: 5,
          learningGoal: 'Complete CAD models and test firmware state transitions.',
          activities: ['Draft state machine', 'CAD suspension links', 'Verify ultrasonic logic']
        }
      ]
    },
    {
      id: 'phase-5',
      phaseId: 'phase-5',
      title: 'Stage 5: Prototype & MakerSpace Build',
      strap: 'Week 7 · 3D Printing & Chassis Assembly',
      weeks: [7, 7],
      goal: 'Fabricate PETG suspension parts on Bambu Lab X1-C, laser-cut acrylic chassis deck, and wire power electronics.',
      tasks: [
        'Slice and print suspension arms with 4 perimeters and 25% gyroid infill',
        'Laser-cut 3mm acrylic chassis deck with motor mounting slots',
        'Solder noise suppression capacitors onto gearmotors and route power harness',
        'Conduct first bench power-up test and verify telemetry over WiFi'
      ],
      evidence: ['Register physical prototype at MakerSpace Bench #2 and upload 45s bench test video.'],
      tools: ['Bambu Lab X1-C 3D Printer', 'Epilog Laser Cutter', 'Soldering Station', 'Wire Strippers'],
      deliverables: ['Physical Rover Prototype', '45s Bench Test Video'],
      competencies: ['sdl-01', 'ctps-01'],
      stretchCompetencies: ['ct-10'],
      coachCue: 'Conduct safety inspection on LiPo battery connectors prior to first power up.',
      sessions: [
        {
          sessionNumber: 5,
          title: 'Chassis Fabrication & Electromechanical Assembly',
          durationMin: 120,
          week: 7,
          learningGoal: 'Assemble mechanical chassis and test motor drivetrain.',
          activities: ['Print parts', 'Laser cut chassis', 'Solder motors', 'Run first drive test']
        }
      ]
    },
    {
      id: 'phase-6',
      phaseId: 'phase-6',
      title: 'Stage 6: Test, Telemetry & Iterate',
      strap: 'Week 9 · Continuous Outdoor Obstacle Run',
      weeks: [9, 9],
      goal: 'Conduct 48-hour continuous stress testing, record thermal telemetry, and tune motor PID parameters.',
      tasks: [
        'Deploy rover on campus terrace obstacle course under peak midday sun',
        'Stream continuous temperature, humidity, and battery voltage telemetry to dashboard',
        'Iterate tire tread infill and suspension dampening based on terrain test results'
      ],
      evidence: ['Telemetry graph log and GitHub commit of tuned motor control firmware.'],
      tools: ['Campus Terrace Test Course', 'Serial Telemetry Monitor', 'Infrared Thermometer'],
      deliverables: ['Telemetry Log Data', 'Updated GitHub Release'],
      competencies: ['sdl-01', 'ctps-01'],
      stretchCompetencies: ['ct-10'],
      coachCue: 'Treat unexpected terrain stalls as high-value telemetry discovery moments.',
      sessions: [
        {
          sessionNumber: 6,
          title: 'Midday Field Trial & Sensor Calibration',
          durationMin: 90,
          week: 9,
          learningGoal: 'Validate rover performance under real outdoor thermal conditions.',
          activities: ['Run obstacle trials', 'Capture live telemetry', 'Tune firmware calibration']
        }
      ]
    },
    {
      id: 'phase-7',
      phaseId: 'phase-7',
      title: 'Stage 7: Reflect & Refine',
      strap: 'Week 11 · Engineering Retrospective & Competency Map',
      weeks: [11, 11],
      goal: 'Reflect on mechanical failure modes, design tradeoffs, and self-directed engineering competencies.',
      tasks: [
        'Analyze prototype failure points against initial week 3 assumptions',
        'Map earned evidence against Cambridge Design & Technology and NGSS standards',
        'Record a 2-minute technical retrospective video walking through key iterations'
      ],
      evidence: ['2-minute video retrospective or interactive technical walkthrough.'],
      tools: ['Audio/Video Studio', 'Competency Map Matrix'],
      deliverables: ['2-Min Video Retrospective', 'Completed Competency Rubric'],
      competencies: ['sdl-01', 'ctps-01'],
      stretchCompetencies: ['ct-10'],
      coachCue: 'Conduct retrospective as a casual dialogue interview at the MakerSpace bench.',
      sessions: [
        {
          sessionNumber: 7,
          title: 'Technical Retrospective & Evidence Review',
          durationMin: 90,
          week: 11,
          learningGoal: 'Synthesize engineering takeaways and articulate design decisions.',
          activities: ['Review iteration logs', 'Map competencies', 'Record retrospective video']
        }
      ]
    },
    {
      id: 'phase-8',
      phaseId: 'phase-8',
      title: 'Stage 8: Showcase & Public Expo',
      strap: 'Week 12 · Live Autonomous Demonstration & Exhibition',
      weeks: [12, 12],
      goal: 'Demonstrate live autonomous obstacle navigation and microclimate heat mapping to school community.',
      tasks: [
        'Set up live terrain obstacle course in the innovation atrium',
        'Run live autonomous heat mapping demo with real-time telemetry broadcast to audience monitor',
        'Answer technical inquiries from coaches, peers, and industry guests',
        'Earn WeLearn MakerSpace Autonomous Robotics Distinction Badge (+500 XP)'
      ],
      evidence: ['Final exhibition video demonstration and public GitHub release link.'],
      tools: ['Atrium Obstacle Track', 'Telemetry Display Screen', 'Exhibition Table'],
      deliverables: ['Live Demonstration', 'Public GitHub Release v1.0'],
      competencies: ['sdl-01', 'ctps-01'],
      stretchCompetencies: ['ct-10'],
      coachCue: 'Coach Ada: Support Tom with quiet encouragement and high five upon obstacle clearance.',
      sessions: [
        {
          sessionNumber: 8,
          title: 'Exhibition Demonstration & Public Defence',
          durationMin: 120,
          week: 12,
          learningGoal: 'Showcase functional mechatronic solution to external community.',
          activities: ['Live rover run', 'Display real-time telemetry', 'Exhibition presentation']
        }
      ]
    }
  ]
};

programData.sessions = programData.phases.flatMap((p) => p.sessions);

async function run() {
  console.log('Publishing program to Firestore pbl_programs/' + PROGRAM_ID + '...');

  const batch = db.batch();

  // 1. Write program document
  const progRef = db.collection('pbl_programs').doc(PROGRAM_ID);
  batch.set(progRef, programData, { merge: true });

  // 2. Enrolment for Tom Becker
  const enrolmentId = `${TOM_UID}_${PROGRAM_ID}`;
  const enrolRef = db.collection('enrolments').doc(enrolmentId);
  batch.set(enrolRef, {
    learnerId: TOM_UID,
    programId: PROGRAM_ID,
    classId: CLASS_ID,
    source: 'coach-assigned',
    currentPhaseId: 'phase-1',
    status: 'active',
    startedAt: now,
    updatedAt: now
  }, { merge: true });

  // 3. Phase Progress for phase-1
  const phaseRef = enrolRef.collection('phaseProgress').doc('phase-1');
  batch.set(phaseRef, {
    status: 'in_progress',
    evidence: [],
    updatedAt: now
  }, { merge: true });

  // 4. Update class assignment for Year 12 Engineering
  const classRef = db.collection('classes').doc(CLASS_ID);
  batch.update(classRef, {
    programId: PROGRAM_ID,
    updatedAt: FieldValue.serverTimestamp()
  });

  // 5. Update Tom's user document
  const userRef = db.collection('users').doc(TOM_UID);
  batch.set(userRef, {
    activeProgramId: PROGRAM_ID,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  await batch.commit();

  console.log('✅ Successfully published & transferred program!');
  console.log(' - Program:', PROGRAM_ID, programData.title);
  console.log(' - Enrolment:', enrolmentId);
  console.log(' - Assigned to Class:', CLASS_ID);
  console.log(' - Recipient:', TOM_UID, '(Tom Becker)');
}

run().catch((err) => {
  console.error('❌ Failed publishing program:', err);
  process.exit(1);
});
