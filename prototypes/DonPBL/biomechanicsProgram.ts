/**
 * Don's PBL Program: Quantitative Biomechanics & Bio-Inspired Robotics
 * Branch: DonPBL
 * Location: prototypes/DonPBL/biomechanicsProgram.ts
 * 
 * Sourced from WeLearn Academy / InnovationCoach Biomechanics Curriculum (140 Hours).
 * Formatted to match standard WeLearn PblProgram architecture:
 * - 7 Design Thinking Phases (Explore -> Empathise -> Define -> Ideate -> Prototype -> Test -> Share)
 * - 24 High-Intensity Sessions covering Morphology, Linkages, Arduino Nano, and FMEA
 * - 3 Real-World Engineering Briefs (Search & Rescue, Marine Microplastics, Soft Harvester)
 * - Kinematic Simulation Engine & Gamification Mechanics
 */

import { PblProgram } from './programData';

export interface BiomimeticTrack {
  id: string;
  title: string;
  biologicalModel: string;
  engineeringBrief: string;
  kinematicMechanism: string;
  sensorsAndActuators: string;
  impactDomain: 'people' | 'environment' | 'both';
}

export const BIOMIMETIC_TRACKS: BiomimeticTrack[] = [
  {
    id: 'track-rescue',
    title: 'Track A: Subterranean Search & Rescue Rover',
    biologicalModel: 'Serpentine locomotion & Hexapod arthropod tripod gaits',
    engineeringBrief: 'Navigate collapsed disaster rubble and subterranean pipes to locate trapped earthquake survivors without getting jammed.',
    kinematicMechanism: 'Multi-vertebra continuum spine, 4-bar Klann/Theo Jansen walking linkages, self-locking worm gearbox',
    sensorsAndActuators: 'Arduino Nano, L298N H-Bridge, MPU-6050 6-DOF IMU tilt sensor, HC-SR04 ultrasonic sensor, DC gearmotors',
    impactDomain: 'people'
  },
  {
    id: 'track-marine',
    title: 'Track B: Microplastic & Debris Interceptor',
    biologicalModel: 'Basking shark gill rakers & whale baleen cross-flow filtration',
    engineeringBrief: 'Filter suspended microplastics (1–5 mm) from turbulent harbor channels without clogging or trapping aquatic marine organisms.',
    kinematicMechanism: 'Hydrodynamic passive vortex flume, offset dual-crank reciprocating filter brush, cam-follower backwash scraper',
    sensorsAndActuators: 'Arduino Nano, analog optical turbidity sensor, water flow meter, continuous rotation servo, 5V bilge pump',
    impactDomain: 'environment'
  },
  {
    id: 'track-harvester',
    title: 'Track C: Adaptive Soft-Grip Crop Harvester',
    biologicalModel: 'Chameleon tongue ballistics & gecko dry fibrillar micro-adhesion',
    engineeringBrief: 'Harvest soft, delicate agricultural produce (strawberries, ripe tomatoes) without bruising fruit skins or tearing plant stems.',
    kinematicMechanism: 'Antagonistic braided tendon continuum fingers, bistable snap-action spring latches, silicone compliant pads',
    sensorsAndActuators: 'Arduino Nano, TB6612FNG dual driver, load-cell force sensors (0–500g), Sharp IR proximity sensors, mini linear servos',
    impactDomain: 'both'
  }
];

export const BIOMECHANICS_PROGRAM: PblProgram = {
  id: 'biomechanics-robotics-2026',
  title: 'Quantitative Biomechanics & Bio-Inspired Robotics',
  subtitle: 'Translating evolutionary adaptations into high-performance electromechanical systems using LEGO Technic, Arduino Nano C/C++, and closed-loop control.',
  status: 'provisional_prototype',
  theme: 'Biomimicry & Advanced Mechanical Engineering',
  drivingQuestion: 'How can we reverse-engineer animal locomotion, adhesion, and feeding mechanisms to design autonomous robots that solve urgent humanitarian and ecological crises?',
  realProblem: {
    type: 'both',
    summary: 'Conventional wheeled robots fail in irregular earthquake rubble, traditional agricultural harvesters bruise 25% of delicate food crops, and rigid municipal filters clog when collecting microplastics. Nature has optimized compliance, adhesion, and locomotion over 500 million years of evolutionary pressure.',
    peopleImpact: 'Saves lives through rapid disaster search-and-rescue rovers in collapsed structures and preserves high-value agricultural food yields.',
    environmentalImpact: 'Captures microplastics and marine debris from tidal estuaries using non-clogging baleen cross-flow filtration without fossil fuel vessel waste.'
  },
  targetAgeRange: 'Ages 9–17 (Primary through Upper Secondary: 9–11, 12–14, 15–17)',
  durationWeeks: 14,
  totalSessions: 24, // Structured into 24 core intensive milestone workshops
  materialsAndKit: {
    microcontrollers: [
      'Arduino Nano (ATmega328P 16MHz, 5V logic, mini USB)',
      'Dual H-Bridge Motor Drivers (L298N / TB6612FNG with flyback protection)',
      'Digital Kinematic Simulation Engine (Linkage solver, torque calculator, IMU tracker)'
    ],
    sensorsAndActuators: [
      'MPU-6050 6-DOF Inertial Measurement Unit (I2C Accelerometer/Gyroscope)',
      'HC-SR04 Ultrasonic Distance Sensor + Sharp GP2Y0A21YK IR Analog Sensor',
      'Strain-gauge load cells with HX711 24-bit ADC amplifier',
      'High-torque metal gear DC motors (6V/12V, 100–300 RPM) + continuous rotation servos',
      'Miniature micro-switches and optical slotted disc encoders'
    ],
    fabricationMaterials: [
      'LEGO Technic beams, liftarms, axles, spur/crown/worm gears, and differentials',
      'Torsion springs, high-tensile braided Dyneema/Kevlar tension cables, and rubber compliance bands',
      'Custom 3D printed end-effectors and aluminum structural standoff brackets',
      'Solderless breadboards, jumper wires, 2S LiPo / 4xAA battery packs, and buck converters'
    ],
    softwareAndTools: [
      'Arduino IDE (C/C++ embedded firmware with non-blocking millis() state machines)',
      'Fusion 360 / FreeCAD (3D kinematic modeling & mechanical orthographic drawings)',
      'PBL Studio Kinematic Simulator & Serial Plotter Diagnostic Console',
      'High-frame-rate video camera for 2D kinematic motion tracking'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Pinch Point Hazard: High-torque gear trains and spring-loaded bistable latches exert significant mechanical force. Keep fingers clear of meshing gears.',
      'Battery Safety: When using multi-cell LiPo/Li-Ion packs, ensure separate motor and logic grounds with common reference. Never short motor rails.',
      'High-Speed Testing: Deploy physical scatter shields during high-speed wing flapping and projectile launching trials.'
    ],
    pedagogicalScaffolding: [
      'Mathematical Rigor: Insist that students calculate Grashof criteria for linkages and mechanical power P = tau * omega before assembling physical gears.',
      'Text-Based Embedded C/C++: Guide students away from drag-and-drop blocks into structured C++ classes, timer interrupts, and moving average filters.',
      'FMEA Discipline: Enforce Failure Mode and Effects Analysis (FMEA) — require teams to log why an axle sheared or a motor browned out.'
    ],
    aiEthicsRules: [
      'AI assists with C++ syntax, register bitmasks, and linkage formulas, but students must calculate gear ratios and measure torque on the bench.',
      'Document AI provenance: Record every algorithm consultation in the Engineering Notebook.'
    ],
    differentiationNotes: [
      'Primary Track (Ages 9–11 / Grades 4–6): Biomimetic animal locomotion imitation, cardboard compliant grabbers, drinking straw tendon linkages, and syringe hydraulic/pneumatic claws without complex circuits.',
      'Junior Secondary Track (Ages 12–14 / Grades 7–9): LEGO Technic 4-bar linkage walking legs or continuum tentacles with proportional joystick or ultrasonic trigger, basic MicroPython motor control loops.',
      'Upper Secondary Track (Ages 15–17 / Grades 10–12): Theo Jansen / Klann multi-bar linkages, custom embedded Arduino C++ firmware with non-blocking millis() state machines, MPU-6050 IMU balance telemetry, and full Failure Modes & Effects Analysis (FMEA).'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-locomotion',
      metric: 'Obstacle Traverse & Locomotion Velocity',
      target: 'Traverse 100 mm irregular rock rubble course at velocity ≥ 0.15 m/s without high-centering or tipping',
      verificationMethod: 'Timed obstacle course benchmark trials logged via IMU roll/pitch telemetry'
    },
    {
      id: 'metric-transmission',
      metric: 'Mechanical Power & Transmission Efficiency',
      target: 'Gearbox output torque amplification ≥ 12:1 with mechanical efficiency ≥ 78% (verified via dynamometer load test)',
      verificationMethod: 'P_mech = tau * omega mechanical power vs electrical power input measurement'
    },
    {
      id: 'metric-filtration-grip',
      metric: 'End-Effector Task Success Rate',
      target: '≥ 90% capture rate for target debris (Track B) or zero-damage soft grip on delicate produce (Track C)',
      verificationMethod: '10 consecutive standardized operational pick-and-place or particulate filtration trials'
    },
    {
      id: 'metric-fmea',
      metric: 'Mean Time Between Failures (MTBF)',
      target: 'Continuous autonomous closed-loop operation ≥ 30 minutes without mechanical gear stripping or firmware hang',
      verificationMethod: 'Continuous stress-testing trial with watchdog timer and serial telemetry logging'
    }
  ],
  assumptions: [
    {
      id: 'asmp-technic-stock',
      domain: 'Hardware Kits',
      assumption: 'Classroom possesses LEGO Technic mechanical sets, Arduino Nano boards, and discrete sensor components.',
      ownerVerificationNeeded: 'Confirm kit inventory of Technic spur/worm gears and Arduino Nano shields.'
    },
    {
      id: 'asmp-cpp-readiness',
      domain: 'Programming Prerequisite',
      assumption: 'Learners have introductory familiarity with variables and loops in C/C++ or Arduino.',
      ownerVerificationNeeded: 'Verify whether a 1-week C++ syntax refresher is needed prior to Week 6.'
    }
  ],
  phases: [
    {
      id: 'explore',
      title: 'Explore',
      strap: 'Quantitative Biomechanics & Biological Metrology (Weeks 1–3)',
      weeks: [1, 3],
      goal: 'Investigate biological scaling laws, surface friction/adhesion, spine kinematics, and arthropod exoskeletons through hands-on laboratory metrology.',
      tasks: [
        'Quantify square-cube law scaling trade-offs and document field specimens under digital microscopy.',
        'Measure static and dynamic friction coefficients of gecko vs tree frog adhesion on inclined planes using load cells.',
        'Construct multi-segment flexible spines using Technic structural beams, torsion springs, and tensioned cables.',
        'Build a planar two-link jumping leg with calibrated elastic elements and calculate coefficients of restitution.',
        'Build a non-motorized 4-bar linkage quadruped leg test-bench and calculate mechanical degrees of freedom (Grübler\'s criterion).',
        'Model ant mandibles using Technic liftarms; calculate Class 1, 2, and 3 mechanical advantage and moment arms.',
        'Build an offset dual-crank mechanism providing 90-degree phase-shifted dragonfly wing articulation.'
      ],
      evidence: [
        'Digital microscopy specimen log with functional morphology annotations',
        'Friction and load-cell metrology data sheet comparing varied roughness profiles',
        'Kinematic linkage schematic with Grübler degrees of freedom calculation',
        'High-speed video analysis tracking angular velocity and joint backlash'
      ],
      aiPromptStarters: [
        'How does the square-cube law explain why ants can carry 50 times their body weight while elephants cannot jump?',
        'Calculate mechanical degrees of freedom for a closed planar four-bar mechanism using Grübler\'s formula.',
        'Explain the fluid dynamics of leading-edge vortices that allow dragonflies to hover with asynchronous wing sweeps.'
      ],
      competencies: ['ctps-01', 'ctps-02', 'ctps-05', 'ct-03', 'sdl-05'],
      stretchCompetencies: ['ct-11'],
      sessions: [
        {
          sessionNumber: 1,
          week: 1,
          title: 'Principles of Biomimicry & Functional Morphology',
          durationMin: 50,
          learningGoal: 'Apply mathematical scaling laws (square-cube law) and analyze bio-inspired robotics case studies (Spot, RHex).',
          activities: [
            'Examine biological specimens under digital microscopes (insect legs, gecko tape, plant burrs).',
            'Derive the square-cube law: surface area scales as L^2, volume/mass scales as L^3.',
            'Document evolutionary trade-offs in engineering notebooks.'
          ],
          learnerChoices: {
            question: 'Which biological locomotion specimen will your team benchmark?',
            options: [
              { id: 'spec-gecko', label: 'Gecko Setae Micro-Adhesion', description: 'Dry van der Waals adhesion on vertical glass and polished metal.' },
              { id: 'spec-cheetah', label: 'Cheetah Flexible Spine Kinematics', description: 'Elastic vertebral flexion storing kinetic energy during high-speed gallop.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload microscopic specimen observations and your mathematical square-cube scaling calculation curve.',
            targetCompetencies: ['ctps-01', 'sdl-05']
          },
          reflectionPrompt: 'Why can a small insect survive a fall from 100 times its height while a large mammal breaks bones?',
          teacherTips: 'Provide digital USB microscopes and calibrated grid paper for real scale measurements.'
        },
        {
          sessionNumber: 2,
          week: 1,
          title: 'Spine Kinematics & Elastic Energy Storage',
          durationMin: 50,
          learningGoal: 'Construct multi-segment flexible spines using Technic structural beams, torsion springs, and tensioned cables.',
          activities: [
            'Explore spring-damper dynamics and elastic restitution.',
            'Assemble 5-vertebra flexible spine with antagonistic cable tensioners.',
            'Measure deflection angle versus applied bending moment (N*cm).'
          ],
          learnerChoices: {
            question: 'What elastic element will your spine use for energy return?',
            options: [
              { id: 'spine-torsion', label: 'Central Torsion Springs', description: 'Discrete rotational stiffness between each vertebral beam segment.' },
              { id: 'spine-cable', label: 'Continuous Braided Cable Tension', description: 'Continuum cable routing allowing progressive stiffness adjustment.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload video showing spine flexing and snapping back under dynamic impact.',
            targetCompetencies: ['ct-03', 'ctps-02']
          },
          reflectionPrompt: 'How does an elastic spine increase stride length and ground reaction force in quadruped locomotion?',
          teacherTips: 'Use tension scales to measure cable pre-load before running flex tests.'
        },
        {
          sessionNumber: 3,
          week: 2,
          title: 'Mandibular Mechanics & Bio-Lever Torque Amplification',
          durationMin: 50,
          learningGoal: 'Model trap-jaw ant mandibles using Technic liftarms; calculate input/output force ratios and moment arms.',
          activities: [
            'Analyze Class 1, 2, and 3 mechanical levers in biological systems.',
            'Assemble high-speed snap mechanism using bistable latching Technic geometry.',
            'Calculate mechanical advantage MA = F_out / F_in and measure peak clamping force.'
          ],
          learnerChoices: {
            question: 'Which bio-lever configuration will you model?',
            options: [
              { id: 'lever-snap', label: 'Trap-Jaw Ant Elastic Catapult', description: 'Stores elastic strain energy and releases in microseconds with massive peak force.' },
              { id: 'lever-crab', label: 'Crustacean High-Torque Crusher Claw', description: 'Massive mechanical advantage (Class 3 lever) for continuous high-pressure grip.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Log your moment arm calculations, lever ratio table, and measured clamping force in Newtons.',
            targetCompetencies: ['ctps-05', 'ct-03']
          },
          reflectionPrompt: 'Why does nature use high-speed elastic snap-action rather than giant muscles when extreme speed is required?',
          teacherTips: 'Wear safety goggles when triggering spring-loaded latch mechanisms!'
        },
        {
          sessionNumber: 4,
          week: 3,
          title: 'Continuum Mechanics & Soft Tendon Manipulators',
          durationMin: 50,
          learningGoal: 'Assemble a multi-vertebra continuum manipulator driven by antagonistic braided cables inspired by cephalopod tentacles.',
          activities: [
            'Explore muscular hydrostats: constant-volume deformation in octopuses and elephant trunks.',
            'Assemble 3D printed or Technic disk vertebrae with flexible silicone core.',
            'Route braided Dyneema cable pairs to servos and test smooth 2-axis curve bending.'
          ],
          learnerChoices: {
            question: 'What end-effector will your continuum arm carry?',
            options: [
              { id: 'end-soft-cup', label: 'Adaptive Silicone Suction Cup', description: 'Conforms to irregular curved surfaces for vacuum pick-and-place.' },
              { id: 'end-fin-ray', label: 'Compliant Fin-Ray Gripper Fingers', description: 'Bends toward applied pressure to gently cradle fragile objects.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload video showing continuum manipulator smoothly coiling around an object.',
            targetCompetencies: ['ct-03', 'ct-05']
          },
          reflectionPrompt: 'Why can a soft continuum tentacle grasp an unknown object without complex force sensor calculations?',
          teacherTips: 'Demonstrate passive compliance: show how soft structures wrap around shapes automatically.'
        }
      ]
    },
    {
      id: 'empathise',
      title: 'Empathise',
      strap: 'Real-World Human & Environmental Problem Formulation (Weeks 4–5)',
      weeks: [4, 5],
      goal: 'Analyze real-world mission challenges in disaster rescue, marine conservation, and food security to formulate biomimetic engineering requirements.',
      tasks: [
        'Review the 3 Engineering Briefs: (1) Subterranean Search & Rescue, (2) Marine Microplastic Interceptor, (3) Soft-Grip Harvester.',
        'Conduct stakeholder empathy interviews with search-and-rescue technicians or agricultural growers.',
        'Form multidisciplinary engineering cells (Systems Lead, Firmware/Controls Engineer, Hardware/Mechanical Engineer).',
        'Draft Engineering Requirement Documents (ERD) defining mass, speed, payload, runtime, and thermal limits.'
      ],
      evidence: [
        'Engineering Brief selection statement and stakeholder interview notes',
        'Signed Engineering Cell Role Matrix (Systems, Firmware, Hardware)',
        'Quantified Engineering Requirement Document (ERD) benchmark table'
      ],
      aiPromptStarters: [
        'What are the primary operational failure modes of search-and-rescue rovers in collapsed concrete earthquake debris?',
        'How can a passive fluid interceptor filter microplastics between 1mm and 5mm without clogging from macro-algae?',
        'What grip pressure in kPa causes bruising in ripe strawberries, and how can soft grippers stay below this threshold?'
      ],
      competencies: ['ec-05', 'sea-01', 'ctps-01', 'lc-01'],
      stretchCompetencies: ['ent-01'],
      sessions: [
        {
          sessionNumber: 5,
          week: 4,
          title: 'Release of Engineering Briefs & Stakeholder Interviews',
          durationMin: 50,
          learningGoal: 'Select a real-world humanitarian/ecological engineering challenge and map stakeholder constraints.',
          activities: [
            'Analyze Brief 1 (Disaster Rescue), Brief 2 (Microplastics), and Brief 3 (Soft Agriculture).',
            'Conduct empathy interviews with field professionals or review disaster incident transcripts.',
            'Select team challenge track and document core human/environmental impact.'
          ],
          learnerChoices: {
            question: 'Which engineering track does your cell commit to?',
            options: [
              { id: 'sel-rescue', label: 'Track A: Search & Rescue Probe', description: 'Navigate rubble to locate trapped survivors with MPU-6050 and ultrasonic sensors.' },
              { id: 'sel-marine', label: 'Track B: Marine Microplastic Interceptor', description: 'Filter toxic microplastics using basking shark gill cross-flow mechanics.' },
              { id: 'sel-harvester', label: 'Track C: Adaptive Soft Crop Harvester', description: 'Harvest fragile strawberries using chameleon tongue and soft compliance.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Log your chosen challenge track, user persona, and primary environmental/human problem.',
            targetCompetencies: ['ctps-01', 'ec-05']
          },
          reflectionPrompt: 'Why must roboticists understand the messy real-world environment before choosing gears and motors?',
          teacherTips: 'Encourage teams to focus on the end-user pain points (e.g. farmer losing 25% of crop value to bruising).'
        },
        {
          sessionNumber: 6,
          week: 5,
          title: 'Engineering Requirement Documents (ERD) & PUGH Matrix',
          durationMin: 50,
          learningGoal: 'Draft quantified ERD engineering specs and evaluate 3 divergent concepts using a PUGH decision matrix.',
          activities: [
            'Establish hard engineering specs: Maximum mass (g), velocity (m/s), battery runtime (min), and payload (g).',
            'Brainstorm 3 divergent mechanical concepts per cell.',
            'Evaluate concepts across criteria using a mathematical PUGH scoring matrix.'
          ],
          learnerChoices: {
            question: 'What is your top engineering constraint priority in the ERD?',
            options: [
              { id: 'erd-runtime', label: 'Battery Endurance (≥ 45 min autonomous runtime)', description: 'Optimize gear friction and power distribution for maximum operational life.' },
              { id: 'erd-agility', label: 'Obstacle Agility (Climb over 1.5x wheel diameter)', description: 'Prioritize multi-link leg geometry and high-torque gearing over top speed.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your finalized Engineering Requirement Document (ERD) and scored PUGH Matrix.',
            targetCompetencies: ['ctps-02', 'sdl-01']
          },
          reflectionPrompt: 'How does a PUGH matrix prevent a team from falling in love with a bad idea just because it looks cool?',
          teacherTips: 'Check that every metric in the ERD has a verifiable number and test method.'
        }
      ]
    },
    {
      id: 'define',
      title: 'Define',
      strap: 'Powertrains, Gear Geometry & Power Budgeting (Weeks 6–7)',
      weeks: [6, 7],
      goal: 'Calculate involute gear ratios, motor torque-speed power conversion (P = tau * omega), and design Arduino Nano circuit schematics.',
      tasks: [
        'Calculate involute gear pitch circles and velocity ratios for multi-stage Technic spur gear transmissions.',
        'Calculate mechanical output power: P_mech = tau * omega and determine motor stall torque limits.',
        'Assemble high-reduction planetary epicyclic or self-locking worm gearboxes.',
        'Draw complete electrical schematics in Fritzing/KiCad format showing Arduino Nano, H-bridges, sensors, and power rails.',
        'Perform power budgeting calculations (mAh battery sizing and regulator thermal limits).'
      ],
      evidence: [
        'Gear train calculation sheet with velocity ratios and pitch circle drawings',
        'Dynamometer bench test data graph comparing torque vs RPM',
        'Fritzing/KiCad electrical schematic diagram with pin maps and power rails'
      ],
      aiPromptStarters: [
        'Calculate the output torque and RPM of a 6V DC motor (12000 RPM, 15 g*cm) through a 120:1 compound gear train at 80% efficiency.',
        'How do I calculate battery runtime for an Arduino Nano drawing 40mA logic and two DC motors drawing 450mA average on a 2200mAh pack?',
        'Explain how a worm gear provides self-locking holding torque without drawing electrical current from the battery.'
      ],
      competencies: ['ctps-05', 'ctps-02', 'ct-03', 'sdl-02'],
      stretchCompetencies: ['ct-10'],
      sessions: [
        {
          sessionNumber: 7,
          week: 6,
          title: 'Precision Drive Trains & Torque-Speed Power Conversion',
          durationMin: 50,
          learningGoal: 'Calculate mechanical output power P = tau * omega and assemble multi-stage gear reductions.',
          activities: [
            'Explore gear geometry: pitch circles, diametral pitch, and backlash reduction.',
            'Assemble 3-stage compound spur gear transmission with Technic gears.',
            'Measure input motor current vs output torque on a test dynamometer.'
          ],
          learnerChoices: {
            question: 'What gear reduction architecture will your drivetrain use?',
            options: [
              { id: 'gear-epicyclic', label: 'Compact Epicyclic Planetary Gearbox', description: 'Coaxial high-torque reduction with zero shaft offset in a compact cylindrical envelope.' },
              { id: 'gear-worm', label: 'Self-Locking Worm & Wheel Drive', description: 'High 24:1 single-stage reduction with irreversible mechanical back-drive protection.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your torque-speed calculation sheet and motor efficiency curve.',
            targetCompetencies: ['ctps-05', 'ctps-02']
          },
          reflectionPrompt: 'Why does doubling gear reduction halve the output speed while doubling output torque?',
          teacherTips: 'Provide digital tachometers and torque scales for empirical motor benchmarking.'
        },
        {
          sessionNumber: 8,
          week: 7,
          title: 'Electrical Schematics, H-Bridges & Power Isolation',
          durationMin: 50,
          learningGoal: 'Design the full Arduino Nano electrical schematic with isolated motor and logic power rails.',
          activities: [
            'Map ATmega328P pinouts: digital PWM pins, I2C A4/A5, analog ADC pins.',
            'Interface L298N / TB6612FNG H-bridge motor driver with flywheel diode protection.',
            'Draw complete Fritzing/KiCad wiring schematic showing common-ground topology.'
          ],
          learnerChoices: {
            question: 'How will you protect logic circuits from motor electrical noise?',
            options: [
              { id: 'pwr-optocoupler', label: 'Optocoupler Isolated Motor Driver', description: 'Complete optical isolation between micro-controller logic and high-current motor drivers.' },
              { id: 'pwr-decoupling', label: 'LC Filter & 100uF Decoupling Capacitors', description: 'Capacitor bank across motor terminals with dedicated low-drop buck regulator for Nano.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your finalized electrical schematic diagram and power budgeting spreadsheet.',
            targetCompetencies: ['ctps-05', 'sdl-02']
          },
          reflectionPrompt: 'Why does failing to use a common ground wire between battery packs cause motor drivers to fail?',
          teacherTips: 'Emphasize that DC motors pull 3x to 5x their normal current during stall spikes!'
        }
      ]
    },
    {
      id: 'ideate',
      title: 'Ideate and Plan',
      strap: 'Kinematic Synthesis & Non-Blocking State Machines (Weeks 7–8)',
      weeks: [7, 8],
      goal: 'Synthesize four-bar walking linkages (Theo Jansen / Klann) and architect non-blocking C++ state machines using millis() and sensor filters.',
      tasks: [
        'Synthesize four-bar linkages using Grashof criteria and plot precision coupler curves.',
        'Build a mechanical walking leg module driven by a single motor (Theo Jansen or Klann linkage).',
        'Architect non-blocking C++ Finite State Machine (FSM) without delay() calls.',
        'Implement moving average filter and hysteresis on analog sensor inputs.',
        'Deliver formal Preliminary Design Review (PDR) defending kinematics and power budgets.'
      ],
      evidence: [
        'Coupler curve foot path plot comparing ground contact vs recovery phase',
        'Working single-leg linkage test-bench video driven by motor input',
        'Finite State Machine (FSM) state transition diagram with C++ code skeleton',
        'Preliminary Design Review (PDR) slide deck and panel critique notes'
      ],
      aiPromptStarters: [
        'Generate an Arduino C++ non-blocking state machine template using enum State and millis() for a search rover.',
        'How do I calculate link lengths for a Theo Jansen walking mechanism so the foot moves in an elliptical path?',
        'Write an Arduino function implementing a 5-sample moving average filter on an analog Sharp IR sensor stream.'
      ],
      competencies: ['ct-02', 'ct-03', 'ctps-05', 'lc-02'],
      stretchCompetencies: ['ctps-07'],
      sessions: [
        {
          sessionNumber: 9,
          week: 7,
          title: 'Kinematic Linkage Synthesis (Theo Jansen & Klann)',
          durationMin: 50,
          learningGoal: 'Plot coupler curve paths and construct an 8-bar or 6-bar single-motor mechanical walking leg.',
          activities: [
            'Analyze Grashof criteria: crank-rocker vs double-crank linkages.',
            'Attach tracing pens to Technic joints and plot foot trajectory on paper.',
            'Optimize link lengths to achieve flat ground contact phase and high obstacle clearance.'
          ],
          learnerChoices: {
            question: 'Which walking linkage geometry will your team synthesize?',
            options: [
              { id: 'link-jansen', label: 'Theo Jansen 11-Bar Kinetic Linkage', description: 'Smooth, organic walking motion with high efficiency on flat terrain.' },
              { id: 'link-klann', label: 'Klann 6-Bar Mechanical Walking Spider', description: 'Higher vertical foot lift for stepping over irregular rubble and rocks.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your plotted coupler curve drawing showing foot trajectory and stance/swing phase ratios.',
            targetCompetencies: ['ct-02', 'ctps-05']
          },
          reflectionPrompt: 'Why is a linkage that produces a flat horizontal foot path better for walking robots than a circular wheel motion?',
          teacherTips: 'Check pivot friction: loose pins cause linkages to wobble and bind under load.'
        },
        {
          sessionNumber: 10,
          week: 8,
          title: 'Embedded C++ State Machines & Sensor Filtering',
          durationMin: 50,
          learningGoal: 'Write non-blocking C++ state machine architectures in Arduino IDE using millis() and signal filters.',
          activities: [
            'Eliminate blocking delay() calls that cause sensor blindness during motor movement.',
            'Code an enum-based state machine: STATE_FORWARD, STATE_OBSTACLE_DETECTED, STATE_REVERSE_TURN.',
            'Implement software moving average filter and hysteresis threshold on sensor inputs.'
          ],
          learnerChoices: {
            question: 'What sensor fusion filter will you write for your rover?',
            options: [
              { id: 'filter-avg', label: 'Moving Average Window Filter', description: 'Smooths noisy analog IR distance sensor readings over 5 consecutive samples.' },
              { id: 'filter-comp', label: 'Complementary Angle Filter (IMU)', description: 'Combines accelerometer tilt with gyroscope angular velocity for stable posture estimation.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Save your non-blocking C++ state machine skeleton and sensor filtering functions to your portfolio.',
            targetCompetencies: ['ctps-05', 'sdl-03']
          },
          reflectionPrompt: 'Why does calling delay(1000) in Arduino code make a robot crash into walls during autonomous runs?',
          teacherTips: 'Have students view raw analog signals on the Arduino Serial Plotter to see electrical noise.'
        }
      ]
    },
    {
      id: 'prototype',
      title: 'Prototype',
      strap: 'Structural Fabrication & Closed-Loop Control (Weeks 9–11)',
      weeks: [9, 11],
      goal: 'Construct reinforced Technic truss chassis, assemble multi-leg powertrains, wire sensors, and program proportional closed-loop controllers.',
      tasks: [
        'Construct reinforced Technic ladder chassis designed to resist torsional loads.',
        'Secure DC gearmotors or servos with rigid brackets and align thrust bearings.',
        'Assemble walking leg linkages, serpentine vertebrae segments, or articulating compliant grippers.',
        'Mount breadboards, Arduino Nano shields, buck converters, and sensor arrays.',
        'Write modular C++ driver classes for motor control and implement proportional feedback (P/PD controllers).',
        'Establish 115200 baud serial telemetry for real-time sensor plotting and diagnostics.'
      ],
      evidence: [
        'Rigid structural chassis photo under torsional deflection test load',
        'Complete assembled electromechanical robot with wired sensors and motors',
        'Commented C++ closed-loop controller firmware with serial telemetry stream',
        'Serial plotter graph showing proportional sensor tracking in real time'
      ],
      aiPromptStarters: [
        'Write a C++ class for TB6612FNG motor driver with setSpeed(int pwm) and softBrake() methods.',
        'Implement a Proportional-Derivative (PD) wall-following algorithm in Arduino for my robot.',
        'How do I configure hardware pin change interrupts (attachInterrupt) on Arduino Nano for an emergency bumper switch?'
      ],
      competencies: ['ct-03', 'ct-05', 'ctps-05', 'ctps-12', 'sdl-03', 'lc-04'],
      stretchCompetencies: ['ct-10'],
      sessions: [
        {
          sessionNumber: 11,
          week: 9,
          title: 'Rigid Chassis Fabrication & Powertrain Integration',
          durationMin: 50,
          learningGoal: 'Construct cross-braced Technic truss frames and mount gearmotors with aligned thrust bearings.',
          activities: [
            'Assemble structural ladder chassis with diagonal cross-bracing to resist motor torque twist.',
            'Install DC gearmotors with rigid brackets and connect input gear reductions.',
            'Perform static load deflection test: measure chassis flex under 1.5 kg downward load.'
          ],
          learnerChoices: {
            question: 'How will your team reinforce chassis torsional stiffness?',
            options: [
              { id: 'chassis-truss', label: 'Box-Truss Geometric Spaceframe', description: 'Triangulated Technic beams forming a rigid 3D box frame around drivetrain.' },
              { id: 'chassis-carbon', label: 'Composite Reinforcement Plates', description: 'G10 fiberglass or aluminum stiffener plates bolted across Technic beam junctions.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your reinforced chassis and motor mounting assembly.',
            targetCompetencies: ['ct-03', 'ct-05']
          },
          reflectionPrompt: 'What mechanical failure occurs if motor mounting brackets flex when driving high-torque walking linkages?',
          teacherTips: 'Check gear mesh: gears should spin freely without binding before motor power is applied.'
        },
        {
          sessionNumber: 12,
          week: 9,
          title: 'Biomimetic Locomotion & Appendage Assembly',
          durationMin: 50,
          learningGoal: 'Assemble the multi-legged walking drivetrain or articulating soft-grip end-effector.',
          activities: [
            'Assemble left and right walking linkage assemblies with 180-degree phase shift.',
            'Mount high-friction rubber/silicone foot pads to ensure traction.',
            'Connect drivetrain to DC gearmotors and perform first tethered bench test.'
          ],
          learnerChoices: {
            question: 'What foot contact material will you test for ground adhesion?',
            options: [
              { id: 'foot-silicone', label: 'Cast Textured Silicone Treads', description: 'High static friction coefficient on smooth polished floors and dusty concrete.' },
              { id: 'foot-cleat', label: 'Articulated Mechanical Cleats', description: 'Angled gripping claws that latch onto irregular rock rubble and carpet fibers.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload video of your robot walking on the bench under motorized power.',
            targetCompetencies: ['ct-05', 'ctps-05']
          },
          reflectionPrompt: 'Why must opposing leg pairs be phase-shifted by 180 degrees during walking?',
          teacherTips: 'Ensure axles are fully seated into bearings; use metal axles for primary drive shafts.'
        },
        {
          sessionNumber: 13,
          week: 10,
          title: 'Closed-Loop Proportional Feedback Control',
          durationMin: 50,
          learningGoal: 'Program a proportional (P/PD) feedback loop adjusting motor PWM speeds based on live sensor streams.',
          activities: [
            'Interface MPU-6050 IMU or HC-SR04 ultrasonic sensor with Arduino Nano.',
            'Code error calculation: error = target_distance - current_distance.',
            'Apply proportional correction: correction = Kp * error to adjust left and right motor speeds.'
          ],
          learnerChoices: {
            question: 'What closed-loop task will your robot execute?',
            options: [
              { id: 'task-wall', label: 'Proportional Wall-Following Distance Hold', description: 'Maintain precise 15 cm distance from obstacle wall while moving forward.' },
              { id: 'task-tilt', label: 'Active IMU Pitch/Roll Balance Maintenance', description: 'Modulate gait speed to maintain horizontal deck posture on uneven terrain.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Save your closed-loop proportional controller C++ code with telemetry print statements.',
            targetCompetencies: ['ctps-05', 'sdl-03']
          },
          reflectionPrompt: 'What happens if your proportional gain Kp is tuned too high (oscillations) vs too low (sluggish)?',
          teacherTips: 'Have students tune Kp incrementally in small steps while watching Serial Plotter curves.'
        },
        {
          sessionNumber: 14,
          week: 11,
          title: 'Firmware Interrupts & Operational Alpha Run',
          durationMin: 50,
          learningGoal: 'Implement hardware interrupts for emergency bumpers and execute the Alpha baseline autonomous run.',
          activities: [
            'Attach micro-switch bumper to Arduino interrupt pin 2 (attachInterrupt).',
            'Write Interrupt Service Routine (ISR) that cuts motor power within microseconds of impact.',
            'Execute first complete autonomous operational test run on lab course witnessed by instructor.'
          ],
          learnerChoices: {
            question: 'What emergency recovery maneuver will your ISR trigger?',
            options: [
              { id: 'isr-reverse', label: 'Autonomous Reverse-and-Pivot Maneuver', description: 'Back away 20 cm, execute 60-degree pivot turn, and re-arm sensor tracking.' },
              { id: 'isr-stop', label: 'Immediate Soft-Brake Lockout with LED Alert', description: 'Brake motors instantly, sound piezo alarm, and wait for human operator clearance.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload video of your successful Alpha autonomous run navigating obstacles.',
            targetCompetencies: ['ctps-12', 'lc-04']
          },
          reflectionPrompt: 'Why are hardware interrupts faster and safer for collision detection than polling a sensor in void loop()?',
          teacherTips: 'Check that ISR code is kept extremely fast: never use delay() or Serial.print inside an ISR!'
        }
      ]
    },
    {
      id: 'test',
      title: 'Test and improve',
      strap: 'Empirical Validation, FMEA & System Hardening (Weeks 12–13)',
      weeks: [12, 13],
      goal: 'Execute 10 empirical data collection trials, perform Failure Mode and Effects Analysis (FMEA), replace failing components, and optimize firmware.',
      tasks: [
        'Assemble realistic challenge track (irregular rock beds, fluid sediment tanks, or variable-friction inclines).',
        'Run 10 repeated operational trials measuring velocity (m/s), payload success, and current draw.',
        'Formally catalog failures in a Failure Mode and Effects Analysis (FMEA) matrix.',
        'Perform mechanical hardening: replace failing plastic axles with steel, reinforce pivot points.',
        'Implement firmware watchdog timers and autonomous unstuck recovery routines.',
        'Quantify post-modification performance improvement against Phase 3 ERD benchmarks.'
      ],
      evidence: [
        '10-Trial empirical data table recording speed, current draw, and success rate',
        'Formal Failure Mode and Effects Analysis (FMEA) risk priority matrix',
        'Before-and-after documentation of verified mechanical and firmware hardening'
      ],
      aiPromptStarters: [
        'Help me structure an engineering FMEA table with Severity, Occurrence, Detection, and Risk Priority Number (RPN).',
        'My robot leg linkage binds and stalls when stepping on irregular rocks. Suggest 3 mechanical hardening improvements.',
        'How do I implement the AVR watchdog timer (wdt_enable) on an Arduino Nano to auto-restart if firmware freezes?'
      ],
      competencies: ['ctps-03', 'ctps-02', 'ctps-12', 'ct-12', 'sea-04'],
      stretchCompetencies: ['ctps-07', 'sdl-09'],
      sessions: [
        {
          sessionNumber: 15,
          week: 12,
          title: 'Empirical Multi-Trial Data Collection (Runs 1–5)',
          durationMin: 50,
          learningGoal: 'Execute standardized operational testing over 5 consecutive trials and record telemetry metrics.',
          activities: [
            'Set up standardized 3-meter obstacle course with calibrated rubble/obstacles.',
            'Run 5 consecutive test trials: log elapsed time, battery voltage drop, and motor current draw.',
            'Log all physical failures (slipping gears, track departure, sensor dropouts).'
          ],
          learnerChoices: {
            question: 'Which performance metric will your cell measure with greatest precision?',
            options: [
              { id: 'met-speed', label: 'Average Velocity over 3m Rubble (m/s)', description: 'Laser timing gate measurement over irregular obstacle terrain.' },
              { id: 'met-efficiency', label: 'Joules Consumed per Meter (Energy Economy)', description: 'Current draw integral multiplied by voltage divided by distance traveled.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Log your 5-trial data table with speed, current draw, and observed failure modes.',
            targetCompetencies: ['ctps-03', 'ctps-02']
          },
          reflectionPrompt: 'Why do robots that work perfectly on flat tabletops consistently fail when placed on irregular terrain?',
          teacherTips: 'Check battery voltage before each run: low voltage skews motor speed data!'
        },
        {
          sessionNumber: 16,
          week: 12,
          title: 'Root Cause Failure Mode Analysis (FMEA)',
          durationMin: 50,
          learningGoal: 'Catalog mechanical and electrical breakdowns in a formal Failure Mode & Effects Analysis (FMEA) matrix.',
          activities: [
            'Calculate Risk Priority Number: RPN = Severity x Occurrence x Detection (scale 1–10).',
            'Rank failure modes: gear stripping, axle twist, brownout resets, cable entanglement.',
            'Formulate concrete engineering corrective actions for top 3 highest RPN items.'
          ],
          learnerChoices: {
            question: 'What primary failure mode will your cell engineer out of the system?',
            options: [
              { id: 'fail-gear-strip', label: 'Gearbox Tooth Stripping under Stall', description: 'Add torque-limiting slipper clutch or upgrade to metal drive gears.' },
              { id: 'fail-brownout', label: 'Microcontroller Brownout Reset during Motor Spikes', description: 'Add separate motor battery pack and optocoupler signal isolation.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your completed FMEA Matrix with calculated RPN scores and planned engineering redesigns.',
            targetCompetencies: ['ctps-12', 'ct-12']
          },
          reflectionPrompt: 'How does calculating an RPN score prevent an engineering team from arguing over subjective opinions?',
          teacherTips: 'Guide students to celebrate discovering failures—every identified bug makes the final robot bulletproof.'
        },
        {
          sessionNumber: 17,
          week: 13,
          title: 'Mechanical Hardening & Steel Axle Upgrades',
          durationMin: 50,
          learningGoal: 'Implement physical mechanical upgrades addressing top FMEA failure modes and re-test.',
          activities: [
            'Replace failing plastic Technic drive axles with steel shafts.',
            'Install aluminum beam bracing across high-stress linkage pivot points.',
            'Add physical mechanical travel stops to prevent over-rotation of continuum joints.'
          ],
          learnerChoices: {
            question: 'What mechanical reinforcement will you install?',
            options: [
              { id: 'hard-axle', label: 'High-Tensile Precision Ground Steel Axles', description: 'Eliminates axle torsional twist under high motor torque loads.' },
              { id: 'hard-clutch', label: 'Mechanical Ball-Detent Slip Clutch', description: 'Slipped safely when linkage jams on rock, protecting motor gears from stripping.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos showing before-and-after mechanical hardening modifications.',
            targetCompetencies: ['ct-05', 'ctps-12']
          },
          reflectionPrompt: 'How did this mechanical hardening upgrade prevent catastrophic failure during stress testing?',
          teacherTips: 'Check that upgraded metal axles still turn smoothly inside Technic beam holes without excessive friction.'
        },
        {
          sessionNumber: 18,
          week: 13,
          title: 'Firmware Fault-Tolerance & Verification Trials (Runs 6–10)',
          durationMin: 50,
          learningGoal: 'Add watchdog timers, autonomous unstuck recovery routines, and execute validation Trials 6–10.',
          activities: [
            'Enable AVR hardware watchdog timer to reboot MCU automatically if code hangs.',
            'Code autonomous "unstuck" routine: if IMU detects zero forward progress for 3 seconds, reverse and wiggle.',
            'Execute verification Trials 6–10 and quantify percentage improvement over baseline.'
          ],
          learnerChoices: {
            question: 'How will your robot detect that it is physically stuck?',
            options: [
              { id: 'stuck-imu', label: 'IMU Vibration & Accelerometer Stagnation', description: 'If motors are commanded forward but accelerometer reads near-zero G forward delta, trigger unstuck.' },
              { id: 'stuck-optical', label: 'Optical Ground Speed Encoder Feedback', description: 'Measure wheel/leg rotation vs chassis forward motion to detect track slip.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your comparative 10-Trial benchmark graph showing performance improvements post-hardening.',
            targetCompetencies: ['ctps-03', 'ct-12']
          },
          reflectionPrompt: 'How does an autonomous unstuck recovery routine turn an operational mission failure into a success?',
          teacherTips: 'Test the unstuck routine by deliberately holding the robot back with your hand on the course.'
        }
      ]
    },
    {
      id: 'share',
      title: 'Showcase or present',
      strap: 'Engineering Capstone Exhibition & Defense (Week 14)',
      weeks: [14, 14],
      goal: 'Communicate the biological inspiration, kinematic analysis, electrical architecture, and test data in an IEEE-style capstone defense.',
      tasks: [
        'Create standard IEEE-style capstone academic poster (Abstract, Biomimicry, Kinematics, Circuits, FMEA, Graphs).',
        'Prepare 5-minute technical pitch and 3-minute cross-examination defense.',
        'Conduct simulated dry-run live demonstrations with peer interrogation.',
        'Host public Bio-Robotics Capstone Exhibition for visiting engineers, parents, and faculty.',
        'Complete formal individual engineering post-mortem and portfolio audit against WeLearn competencies.'
      ],
      evidence: [
        'IEEE-style academic engineering capstone poster PDF/image',
        'Rehearsal critique notes and defense preparation cheat sheet',
        'Public Exhibition live demonstration photos and guest evaluation scores',
        'Final individual engineering post-mortem reflection'
      ],
      aiPromptStarters: [
        'Review our IEEE capstone poster layout and ensure our kinematic coupler curve and FMEA tables are readable.',
        'Act as an aerospace robotics judge and ask us 4 hard questions about our motor power budget and gear fatigue.',
        'Help structure our 5-minute technical pitch: Hook, Biological Inspiration, Kinematics, Firmware, FMEA Results.'
      ],
      competencies: ['ec-11', 'ec-02', 'ec-03', 'ec-12', 'sdl-04', 'ctps-04'],
      stretchCompetencies: ['ec-07', 'ec-09', 'ent-07'],
      sessions: [
        {
          sessionNumber: 19,
          week: 14,
          title: 'IEEE Capstone Poster Architecture',
          durationMin: 50,
          learningGoal: 'Synthesize 14 weeks of engineering data into a professional IEEE-style academic capstone poster.',
          activities: [
            'Organize poster quadrants: (1) Abstract & Biological Model, (2) Kinematic Analysis & CAD, (3) Embedded Firmware & Circuits, (4) FMEA & Empirical Test Data.',
            'Export high-resolution plots of coupler curves, torque efficiency, and 10-trial performance improvements.',
            'Draft clear captions connecting biological morphology to engineering mechanisms.'
          ],
          learnerChoices: {
            question: 'What visual centerpiece will lead your poster design?',
            options: [
              { id: 'post-cad', label: 'Exploded 3D CAD Assembly View', description: 'Shows inner gearbox gear mesh, bearing alignments, and sensor placements.' },
              { id: 'post-data', label: 'Empirical 10-Trial Velocity & Current Curves', description: 'Demonstrates quantitative performance improvement post-FMEA hardening.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload digital image of your completed IEEE-style capstone engineering poster.',
            targetCompetencies: ['ec-03', 'ec-11']
          },
          reflectionPrompt: 'Why do professional engineers communicate with structured data graphs and CAD schematics rather than marketing buzzwords?',
          teacherTips: 'Provide standard 36" x 48" or A1 poster templates in Google Slides or PowerPoint.'
        },
        {
          sessionNumber: 20,
          week: 14,
          title: 'Technical Presentation Coaching & Timed Pitch',
          durationMin: 50,
          learningGoal: 'Structure and rehearse a timed 5-minute technical pitch followed by 3-minute technical defense.',
          activities: [
            'Assign speaking roles across the 3 engineering cell members (Systems, Firmware, Hardware).',
            'Time delivery: Min 0-1 (Challenge & Biomimicry), Min 1-2.5 (Mechanics & Linkages), Min 2.5-4 (Firmware & FMEA), Min 4-5 (Empirical Data & Video).',
            'Practice smooth handoffs and live robot handling during speaking.'
          ],
          learnerChoices: {
            question: 'What live operational demonstration will lead your pitch?',
            options: [
              { id: 'demo-walk', label: 'Live Rubble Course Autonomous Traverse', description: 'Place robot on irregular rocks; demonstrate closed-loop obstacle avoidance live.' },
              { id: 'demo-telemetry', label: 'Live Serial Telemetry Stream Display', description: 'Show real-time IMU tilt angles and motor current draw on projection screen.' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Log rehearsal timing breakdown and written feedback received from peers.',
            targetCompetencies: ['ec-02', 'sdl-04']
          },
          reflectionPrompt: 'How does practicing answering tough questions about design trade-offs build confidence for the real defense?',
          teacherTips: 'Enforce strict 5-minute cutoff with a timer bell to develop concise technical delivery.'
        },
        {
          sessionNumber: 21,
          week: 14,
          title: 'Dry-Run Live Demonstrations & Peer Interrogation',
          durationMin: 50,
          learningGoal: 'Simulate high-stress defense conditions with cross-team peer interrogation regarding design trade-offs.',
          activities: [
            'Teams take turns acting as skeptical engineering judges, challenging component choices and failure modes.',
            'Defend design compromises: why DC gearmotors instead of continuous servos? Why 4-bar linkage instead of tracks?',
            'Incorporate feedback into final slide deck and poster labels.'
          ],
          learnerChoices: {
            question: 'Which judge challenge question will your team prepare for most thoroughly?',
            options: [
              { id: 'def-power', label: 'Power Budgeting & Thermal Dissipation', description: 'Defend battery sizing, stall currents, and motor driver heat-sink choices.' },
              { id: 'def-kinematics', label: 'Kinematic Linkage Degrees of Freedom', description: 'Defend Grübler calculation, joint backlash mitigation, and foot trajectory.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Log the 4 hardest peer critique questions asked and your team\'s revised technical defense answers.',
            targetCompetencies: ['ctps-04', 'ec-02']
          },
          reflectionPrompt: 'Which peer question exposed a blind spot in your project, and how did you address it?',
          teacherTips: 'Encourage students to push on actual data: "Show me the trial where this stripped—how do you know the steel axle won\'t bend?"'
        },
        {
          sessionNumber: 22,
          week: 14,
          title: 'The Bio-Robotics Capstone Exhibition & Defense',
          durationMin: 50,
          learningGoal: 'Deliver formal technical defense to visiting industry engineers, university faculty, and parents.',
          activities: [
            'Present 5-minute pitch to visiting evaluation panel at dedicated team testing arena.',
            'Execute continuous live operational mission runs over obstacle track.',
            'Answer technical cross-examination questions directly referencing calculations, code, and poster data.'
          ],
          learnerChoices: {
            question: 'Which visitor interaction station will your booth feature?',
            options: [
              { id: 'booth-drive', label: 'Guest Operator Rubble Driving Station', description: 'Visitors control robot with serial interface or watch autonomous mode navigate.' },
              { id: 'booth-parts', label: 'Hands-On Kinematic Mechanism Disassembly', description: 'Display sample linkage joints, epicyclic gears, and sheared axles for guests to inspect.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload wide-angle photos of your cell presenting your robot and poster at the Capstone Exhibition.',
            targetCompetencies: ['ec-12', 'ec-11']
          },
          reflectionPrompt: 'What was the most exciting moment of demonstrating your working bio-robot to outside professional engineers?',
          teacherTips: 'Invite local university robotics professors or mechanical engineers to serve as external evaluators.'
        },
        {
          sessionNumber: 23,
          week: 14,
          title: 'Field Maintenance Toolkit & Code Archival',
          durationMin: 50,
          learningGoal: 'Clean, refactor, and document C++ codebase with Doxygen comments and assemble a field repair kit.',
          activities: [
            'Clean code repository: add inline Doxygen comments, structured pin maps, and constant definitions.',
            'Assemble field maintenance station: spare gears, backup pre-flashed Nano boards, multi-meter diagnostic probes.',
            'Seal mechanical fixings, verify terminal screw tightness, and create production firmware hex file.'
          ],
          learnerChoices: {
            question: 'What spare critical parts will your field maintenance kit stock?',
            options: [
              { id: 'kit-drive', label: 'Pre-Assembled Drivetrain Gearbox Modules', description: 'Complete drop-in replacement gearboxes for rapid 2-minute field swaps.' },
              { id: 'kit-sensors', label: 'Pre-Calibrated Sensor Harnesses', description: 'Color-coded wiring harnesses with quick-disconnect Molex/JST connectors.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Submit link or clean text of your fully documented, Doxygen-commented production C++ codebase.',
            targetCompetencies: ['sdl-03', 'ctps-05']
          },
          reflectionPrompt: 'Why is clear code commenting and structured modular design essential when another engineer has to fix your robot in the field?',
          teacherTips: 'Require students to explain how another person could build their code from scratch without oral guidance.'
        },
        {
          sessionNumber: 24,
          week: 14,
          title: 'Engineering Post-Mortem & Competency Retrospective',
          durationMin: 50,
          learningGoal: 'Reflect deeply on individual engineering growth across WeLearn competencies and complete post-mortem audit.',
          activities: [
            'Audit complete evidence portfolio against WeLearn 85 competencies and Future Skills matrix.',
            'Write formal engineering post-mortem: What worked, what failed, and what would be designed differently in Version 2.0.',
            'Deconstruct test rigs, catalog reusable inventory, and archive technical documentation.'
          ],
          learnerChoices: {
            question: 'Which engineering discipline did you grow the most in over this 14-week program?',
            options: [
              { id: 'post-mech', label: 'Mechanical Kinematics & Transmission Design', description: 'Mastering gear ratios, four-bar coupler curves, and torsional structural rigidity.' },
              { id: 'post-firmware', label: 'Embedded C++ & Closed-Loop Control', description: 'Mastering non-blocking state machines, sensor filtering, and proportional feedback.' },
              { id: 'post-systems', label: 'Systems Engineering & Failure Mode Analysis (FMEA)', description: 'Mastering root-cause debugging, multi-trial empirical testing, and team leadership.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Submit your comprehensive Engineering Post-Mortem and Competency Reflection citing 3 specific breakthrough moments.',
            targetCompetencies: ['sdl-04', 'ctps-04', 'sea-04']
          },
          reflectionPrompt: 'Looking back at Day 1, how has your definition of "engineering" changed from building with toy bricks to rigorous mathematical design?',
          teacherTips: 'Celebrate the journey: remind students that the failures they solved are what made them genuine engineers!'
        }
      ]
    }
  ]
};
