/**
 * Don's PBL Program: Quantitative Biomechanics & Bio-Inspired Robotics (60-Day / 12-Week / 120-Hour Edition)
 * Branch: DonPBL
 * Location: prototypes/DonPBL/biomechanicsProgram.ts
 *
 * Sourced from the attached Biomechanics curriculum PDF (Weeks 1–12 | Days 1–60 | Hours 1–120):
 * - Phase 1: Studying Nature & Body Movement (Weeks 1–2 | Hours 1–20 | Days 1–10)
 * - Phase 2: Motors, Gears & Electronics (Weeks 3–5 | Hours 21–50 | Days 11–25)
 * - Phase 3: Planning & Designing Your Robot (Weeks 6–7 | Hours 51–70 | Days 26–35)
 * - Phase 4: Building & Coding the Robot (Weeks 8–9 | Hours 71–90 | Days 36–45)
 * - Phase 5: Testing, Fixing & Making It Tough (Weeks 10–11 | Hours 91–110 | Days 46–55)
 * - Phase 6: Final Presentation & Robot Show (Week 12 | Hours 111–120 | Days 56–60)
 *
 * Mapped onto the 7 standard Design Thinking phases (Explore, Empathise, Define, Ideate, Prototype, Test, Share)
 * with non-overlapping weeks [1,2], [3,4], [5,5], [6,7], [8,9], [10,11], [12,12] and 24 sessions.
 */

import type { PblProgram } from './programData';

export interface BiomimeticTrack {
  id: string;
  title: string;
  biologicalModel: string;
  engineeringBrief: string;
  kinematicMechanism: string;
  sensorsAndActuators: string;
  impactDomain: 'people' | 'environment' | 'both';
}

export interface BiomechanicsWeekSchedule {
  week: number;
  phaseLabel: string;
  hoursRange: string;
  title: string;
  days: {
    day: number;
    title: string;
    summary: string;
  }[];
}

export interface BiomechanicsSpecialPillar {
  id: string;
  title: string;
  description: string;
  keyToolsAndMath: string;
}

export interface BiomechanicsBadge {
  id: string;
  title: string;
  phaseId: string;
  xp: number;
  criteria: string;
}

export const BIOMIMETIC_TRACKS: BiomimeticTrack[] = [
  {
    id: 'track-rescue',
    title: '1. Underground / Rough-Ground Rescue Robot',
    biologicalModel: 'Inspired by snakes (serpentine locomotion) or six-legged insects (hexapod tripod gaits)',
    engineeringBrief: 'Navigate underground pipes, rocky ground, and rough disaster rubble to locate survivors without getting stuck or tipping over.',
    kinematicMechanism: 'Flexible LEGO Technic cable spine, four-bar Theo Jansen / Klann walking linkages, and self-locking worm gearboxes',
    sensorsAndActuators: 'Arduino Nano (ATmega328P), H-bridge motor controllers, MPU-6050 6-axis tilt sensor, ultrasonic & IR distance sensors, DC motors',
    impactDomain: 'people'
  },
  {
    id: 'track-marine',
    title: '2. Ocean Plastic Cleaner',
    biologicalModel: 'Inspired by how basking sharks or whales filter water smoothly without clogging',
    engineeringBrief: 'Glide through water tanks and harbor channels to filter ocean plastic and floating debris while minimizing water drag.',
    kinematicMechanism: 'Streamlined whale/shark low-drag hull, double-crank sweeping mechanism, and toothed timing belt intake drive',
    sensorsAndActuators: 'Arduino Nano (ATmega328P), H-bridge motor controllers, optical/IR debris sensors, MPU-6050 pitch stabilizer, waterproofed DC drive',
    impactDomain: 'environment'
  },
  {
    id: 'track-harvester',
    title: '3. Gentle Fruit-Picking Gripper',
    biologicalModel: 'Inspired by chameleon tongues, Venus flytraps, or gecko feet to pick soft crops without bruising them',
    engineeringBrief: 'Grasp and harvest delicate soft fruit and crops rapidly and securely without bruising skins or crushing stems.',
    kinematicMechanism: 'Soft octopus-style braided cable arm, fast-snapping Venus flytrap linkage, and gecko-inspired micro-hook pads',
    sensorsAndActuators: 'Arduino Nano (ATmega328P), H-bridge motor controllers, weight/load-cell force sensors, infrared proximity sensors, continuous servos',
    impactDomain: 'both'
  }
];

export const BIOMECHANICS_OLDER_STUDENT_PILLARS: BiomechanicsSpecialPillar[] = [
  {
    id: 'pillar-mechanics',
    title: 'Advanced Mechanics',
    description: 'Instead of simple LEGO building, students learn how weight and force spread through a frame, build complex gearboxes (planetary and worm gears), design four-bar walking linkages, and calculate mechanical power.',
    keyToolsAndMath: 'P_mech = τ · ω, Grübler’s Criterion (DOF), Grashof Linkage Rules, Square-Cube Law, Planetary & Self-Locking Worm Gears'
  },
  {
    id: 'pillar-electronics',
    title: 'Real Electronics',
    description: 'Instead of using simple plug-and-play toy hubs, students build real circuits on breadboards using the Arduino Nano, motor controller chips (H-bridges), distance and balance sensors, and safe dual-battery wiring.',
    keyToolsAndMath: 'Arduino Nano (ATmega328P), H-Bridge Motor Drivers, Ultrasonic & IR Distance Sensors, 6-Axis MPU-6050 IMU, Twisted-Pair & Capacitor Filtering'
  },
  {
    id: 'pillar-coding',
    title: 'Text Coding in C/C++',
    description: 'Instead of drag-and-drop block coding, students write real C/C++ code using multitasking state machines, instant hardware interrupts, data filters, and automatic sensor feedback loops.',
    keyToolsAndMath: 'Non-blocking millis() state machines, attachInterrupt() bumper ISRs, P/PD feedback loops, sensor spike filters, watchdog timers'
  },
  {
    id: 'pillar-habits',
    title: 'Professional Engineering Habits',
    description: 'Students follow real-world engineering steps, including formal design reviews (PDR), failure analysis (FMEA), repeated 10-run empirical data testing, GitHub code archival, and professional poster documentation.',
    keyToolsAndMath: 'Engineering Requirement Documents (ERD), Pugh Matrix, Fusion 360 / FreeCAD, Fritzing / KiCad, FMEA, 10-Trial Benchmarking'
  }
];

export const BIOMECHANICS_60_DAY_SCHEDULE: BiomechanicsWeekSchedule[] = [
  {
    week: 1,
    phaseLabel: 'Phase 1: Studying Nature & Body Movement',
    hoursRange: 'Hours 1–10',
    title: 'Week 1: How Land Animals & Insects Move',
    days: [
      { day: 1, title: 'Learning from Nature (Biomimicry) & Grip', summary: 'Learn how an animal’s size changes its strength (square-cube law), see robots like Boston Dynamics Spot, and compare how geckos and tree frogs stick to surfaces. Test sliding friction on ramps using weight sensors and Arduino boards.' },
      { day: 2, title: 'Flexible Spines & Jumping Legs', summary: 'Learn how backbones bend and how tendons store energy like springs. Build a flexible LEGO Technic spine with cables, plus a two-part jumping leg using rubber bands.' },
      { day: 3, title: 'Basic Walking Legs', summary: 'Build a four-bar walking leg model without a motor. Use a math formula (Grübler’s criterion) in your notebook to count how many ways the leg can move.' },
      { day: 4, title: 'Insect Shells & Jaws', summary: 'Compare hollow insect shells (exoskeletons) to solid bones by testing how much weight tubes can hold. Build a model of ant jaws using LEGO levers and calculate their pinching force.' },
      { day: 5, title: 'Insect Wings & Folding Parts', summary: 'Build a double-crank machine that flaps wings like a dragonfly, and a folding beetle wing cover with two hinges that lock into place.' }
    ]
  },
  {
    week: 2,
    phaseLabel: 'Phase 1: Studying Nature & Body Movement',
    hoursRange: 'Hours 11–20',
    title: 'Week 2: Motion Tracking, Plants & Water Movement',
    days: [
      { day: 6, title: 'Slow-Motion Video Tracking', summary: 'Record your Week 1 machines using high-speed video. Use motion-tracking software to measure their speed, repeat rate, and loose joints.' },
      { day: 7, title: 'Fast-Moving Plants & Tiny Hooks', summary: 'Learn how Venus flytraps snap shut and how plant burrs and gecko feet hook onto things. Build a fast-snapping LEGO trap and test how much force it takes to pull custom hooks off a surface.' },
      { day: 8, title: 'Moving Through Water', summary: 'Learn how whales and sharks glide smoothly through water. Test smooth shapes versus blocky shapes in a water tank to measure water resistance (drag).' },
      { day: 9, title: 'Soft Robots & Octopus Arms', summary: 'Learn how muscles move without bones. Build a flexible robot arm controlled by pulling braided cables in opposite directions.' },
      { day: 10, title: 'Phase 1 Presentation', summary: 'Present your nature-inspired models, force graphs, and movement drawings to the class.' }
    ]
  },
  {
    week: 3,
    phaseLabel: 'Phase 2: Motors, Gears & Electronics',
    hoursRange: 'Hours 21–30',
    title: 'Week 3: Gears, Motors & Power',
    days: [
      { day: 11, title: 'How Gears Work', summary: 'Learn about gear shapes, sizes, and stopping gears from slipping. Build multi-step LEGO gear systems and calculate their speed ratios.' },
      { day: 12, title: 'Turning Force (Torque), Speed & Power', summary: 'Calculate electrical power going in versus mechanical power coming out using τω = P_mech. Test strong gear systems using different weights.' },
      { day: 13, title: 'High-Force Gearboxes', summary: 'Learn how planetary gears work. Build small, strong gearboxes to move robot joints.' },
      { day: 14, title: 'Changing Power Direction', summary: 'Use angled gears (crown and bevel gears). Build a steering gear system that mimics how a four-legged animal’s hip moves in two directions.' },
      { day: 15, title: 'Self-Locking Worm Gears', summary: 'Learn how worm gears lock in place and hold heavy weights even when the motor is turned off. Build a self-locking lifting crane.' }
    ]
  },
  {
    week: 4,
    phaseLabel: 'Phase 2: Motors, Gears & Electronics',
    hoursRange: 'Hours 31–40',
    title: 'Week 4: Advanced Moving Parts & Cams',
    days: [
      { day: 16, title: 'Belts & Pulleys', summary: 'Learn how toothed timing belts stay tight and grip without slipping. Build fast back-and-forth belt machines.' },
      { day: 17, title: 'Flexible Shaft Connectors', summary: 'Learn how universal joints and flexible connectors keep spinning even when shafts are not lined up straight.' },
      { day: 18, title: 'Four-Bar Linkages', summary: 'Learn the rules for how four connected bars can rotate or rock back and forth (Grashof rules). Attach pens to LEGO joints to trace their movement paths.' },
      { day: 19, title: 'Cams & Repeating Motion', summary: 'Study different cam shapes (off-center, snail, and pause cams). Measure how they push parts up and down to copy animal walking patterns.' },
      { day: 20, title: 'Walking Leg Challenge', summary: 'Build a complete mechanical walking leg powered by just one motor (such as a Theo Jansen or Klann leg design).' }
    ]
  },
  {
    week: 5,
    phaseLabel: 'Phase 2: Motors, Gears & Electronics',
    hoursRange: 'Hours 41–50',
    title: 'Week 5: Arduino Nano & Coding in C/C++',
    days: [
      { day: 21, title: 'Arduino Parts & Basic C++ Code', summary: 'Learn the parts of the Arduino Nano board (ATmega328P), how to control pins, use resistors, and build circuits on a breadboard.' },
      { day: 22, title: 'Motor Controllers & Battery Power', summary: 'Connect the Arduino Nano to motor controller chips (H-bridges). Learn how to safely wire separate batteries for the computer brain and the motors.' },
      { day: 23, title: 'Distance Sensors', summary: 'Connect sound-wave (ultrasonic) and light-based (infrared) distance sensors. Write code to filter out bad data and measure exact distances.' },
      { day: 24, title: 'Balance & Tilt Sensors', summary: 'Connect a 6-axis motion sensor (MPU-6050). Read movement data and use a code filter to measure what angle the robot is tilting.' },
      { day: 25, title: 'Smart Robot Control', summary: 'Write code that can multitask without freezing (millis() instead of delay()). Program a small wheeled robot to find and avoid obstacles on its own.' }
    ]
  },
  {
    week: 6,
    phaseLabel: 'Phase 3: Planning & Designing Your Robot',
    hoursRange: 'Hours 51–60',
    title: 'Week 6: Real-World Problems & Robot Ideas',
    days: [
      { day: 26, title: 'Choose Your Engineering Project', summary: 'Select from (1) Underground / Rough-Ground Rescue Robot, (2) Ocean Plastic Cleaner, or (3) Gentle Fruit-Picking Gripper.' },
      { day: 27, title: 'Team Roles', summary: 'Form teams of 3 students: Systems Leader, Coding/Controls Engineer, and Mechanical/Building Engineer.' },
      { day: 28, title: 'Matching Nature to Robot Parts', summary: 'Make a chart matching animal features to robot needs (sensors, motors, frame, and battery power).' },
      { day: 29, title: 'Project Rules & Goals (ERD)', summary: 'Write down exact goals for your robot: maximum weight, battery life, how much weight it can carry, speed, and heat limits.' },
      { day: 30, title: 'Brainstorming & Scoring Ideas', summary: 'Create 3 different robot designs per team. Use a scoring chart (Pugh Matrix) to pick the best idea based on project rules.' }
    ]
  },
  {
    week: 7,
    phaseLabel: 'Phase 3: Planning & Designing Your Robot',
    hoursRange: 'Hours 61–70',
    title: 'Week 7: 3D Computer Models, Wiring Plans & Review',
    days: [
      { day: 31, title: 'Finalizing the Best Design', summary: 'Choose your final robot design based on what parts you have, how strong the motors are, and how hard the code will be.' },
      { day: 32, title: '3D Computer Design (CAD)', summary: 'Draw measured plans or 3D models (using Fusion 360 or FreeCAD) showing where the motors, frame, and balance point (center of gravity) will go.' },
      { day: 33, title: 'Wiring Maps & Code Flowcharts', summary: 'Draw complete wiring diagrams (using Fritzing or KiCad) and flowcharts showing how the robot’s code will make decisions.' },
      { day: 34, title: 'Parts List & Battery Math', summary: 'List every part you need, calculate how much electricity the motors use, choose the right battery size (mAh), and check gear strength.' },
      { day: 35, title: 'Design Review Presentation (PDR)', summary: 'Present a slideshow to the teachers explaining your robot’s movement, battery math, and code plan.' }
    ]
  },
  {
    week: 8,
    phaseLabel: 'Phase 4: Building & Coding the Robot',
    hoursRange: 'Hours 71–80',
    title: 'Week 8: Building the Robot & Mounting Electronics',
    days: [
      { day: 36, title: 'Building a Strong Frame', summary: 'Build a tough LEGO Technic frame with cross-bracing so it does not twist or bend under heavy loads.' },
      { day: 37, title: 'Adding Gearboxes & Motors', summary: 'Attach DC motors or continuous servos tightly to the frame. Line up the gears and bearings smoothly.' },
      { day: 38, title: 'Building Legs, Grippers & Helper Parts', summary: 'Build and attach the walking legs, snake-like body sections, or soft grippers, plus extra helper parts like a balancing tail or shock-absorbing joints.' },
      { day: 39, title: 'Strength Testing & Balance', summary: 'Put heavy weights on axles to see if they bend, add metal bars or extra bracing, and adjust gear ratios and counterweights to stop shaking.' },
      { day: 40, title: 'Mounting Electronics & Neat Wiring', summary: 'Attach the breadboard, Arduino Nano, power converters, and sensors. Twist motor wires together, keep sensor wires away from power wires, add capacitors, and tie cables down neatly.' }
    ]
  },
  {
    week: 9,
    phaseLabel: 'Phase 4: Building & Coding the Robot',
    hoursRange: 'Hours 81–90',
    title: 'Week 9: Writing Control Code & First Full Tests',
    days: [
      { day: 41, title: 'Writing Motor Code', summary: 'Write organized C++ code files to make the motors go forward, backward, brake smoothly, and change speed.' },
      { day: 42, title: 'Cleaning Up Sensor Data', summary: 'Write code to smooth out sensor readings and ignore random electrical spikes.' },
      { day: 43, title: 'Automatic Adjustments (Feedback Loops)', summary: 'Write code (P/PD control) that uses sensor readings to automatically keep the robot balanced or following a wall.' },
      { day: 44, title: 'Faster Code with Interrupts & Live Data', summary: 'Use hardware interrupts (attachInterrupt()) so the robot reacts instantly to bumps, and send live sensor graphs to the computer screen (Arduino Serial Plotter) to catch errors.' },
      { day: 45, title: 'First Full Robot Test & Teacher Check-Off (Alpha Sign-Off)', summary: 'Run the robot on its own for the first time, write down any sensor or motor problems, and show the teacher that your robot works in the lab.' }
    ]
  },
  {
    week: 10,
    phaseLabel: 'Phase 5: Testing, Fixing & Making It Tough',
    hoursRange: 'Hours 91–100',
    title: 'Week 10: Real-World Testing & Finding Problems',
    days: [
      { day: 46, title: 'Building the Test Course', summary: 'Build realistic obstacle courses (rocky ground, water tanks with sand, or slippery ramps).' },
      { day: 47, title: 'Test Runs 1–5', summary: 'Run the robot 5 times. Measure its speed, how well it carries loads, if parts get too hot, and how much battery power it uses.' },
      { day: 48, title: 'Finding Why Things Break (FMEA)', summary: 'Make an organized list of every problem: broken axles, stripped gears, power drops, or sensors confused by bright room lights.' },
      { day: 49, title: 'Making the Robot Stronger', summary: 'Replace bending plastic axles with strong steel rods, strengthen joints, and add physical stops so parts cannot bend too far.' },
      { day: 50, title: 'Crash-Proof Coding', summary: 'Add safety timers (watchdog timers) and automatic recovery moves so the robot can unstick itself and never freezes.' }
    ]
  },
  {
    week: 11,
    phaseLabel: 'Phase 5: Testing, Fixing & Making It Tough',
    hoursRange: 'Hours 101–110',
    title: 'Week 11: Final Improvements & Preparation',
    days: [
      { day: 51, title: 'Test Runs 6–10', summary: 'Test the upgraded robot 5 more times and compare the new scores to your original Phase 3 goals.' },
      { day: 52, title: 'Protective Shells & Looks', summary: 'Add smooth outer covers, protective shells, or nature-inspired colors that help protect the robot’s inner parts.' },
      { day: 53, title: 'Cleaning Up Code & Saving Online', summary: 'Organize your final code, add clear explanation notes (comments) on how it works, and upload it to GitHub.' },
      { day: 54, title: 'Building a Repair Kit', summary: 'Pack a repair box with extra gears, backup pre-programmed Arduino boards, and a multimeter for testing wires.' },
      { day: 55, title: 'Final Lock-Down (Beta Release)', summary: 'Tighten all screws, lock mechanical parts in place, and upload the final code to the robot.' }
    ]
  },
  {
    week: 12,
    phaseLabel: 'Phase 6: Final Presentation & Robot Show',
    hoursRange: 'Hours 111–120',
    title: 'Week 12: Presenting Your Work',
    days: [
      { day: 56, title: 'Making a Science Poster', summary: 'Create a professional engineering poster showing: Project Summary, Nature Inspiration, How It Moves, Wiring Diagram, Test Graphs, and How the Design Changed.' },
      { day: 57, title: 'Practicing Your Speech', summary: 'Prepare a 5-minute presentation and practice answering 3 minutes of tough questions about how you solved engineering problems.' },
      { day: 58, title: 'Practice Run & Class Questions', summary: 'Test the robot under pressure in front of other student teams and answer their questions about your design choices.' },
      { day: 59, title: 'Final Robot Exhibition', summary: 'Show your working robot on the test course to visiting engineers, parents, and teachers.' },
      { day: 60, title: 'Taking Apart & Looking Back', summary: 'Write a final reflection on what you learned, sort and put away all Arduino and LEGO parts, and save all project files.' }
    ]
  }
];

export const BIOMECHANICS_GAMIFICATION_BADGES: BiomechanicsBadge[] = [
  {
    id: 'badge-nature-scout',
    title: '🦎 Nature & Square-Cube Scout',
    phaseId: 'explore',
    xp: 250,
    criteria: 'Complete Phase 1 (Days 1–10): Ramp friction test, Grübler leg DOF math, ant-jaw lever model, high-speed motion tracking, and braided-cable octopus arm.'
  },
  {
    id: 'badge-powertrain-architect',
    title: '⚙️ Planetary & Klann Powertrain Architect',
    phaseId: 'empathise',
    xp: 300,
    criteria: 'Complete Weeks 3–4 (Days 11–20): Verify τω = P_mech, build planetary & self-locking worm gearboxes, trace Grashof 4-bar coupler paths, and run a 1-motor walking leg.'
  },
  {
    id: 'badge-nano-firmware',
    title: '🔌 Arduino Nano C++ Multitasker',
    phaseId: 'define',
    xp: 300,
    criteria: 'Complete Week 5 (Days 21–25): Wire dual batteries with H-bridges, filter ultrasonic/IR & MPU-6050 tilt data, and run autonomous obstacle avoidance using millis().'
  },
  {
    id: 'badge-pdr-strategist',
    title: '📐 Pugh Matrix & CAD Review Strategist',
    phaseId: 'ideate',
    xp: 350,
    criteria: 'Complete Phase 3 (Days 26–35): Lock ERD rules, score 3 concepts in a Pugh Matrix, model CoG in Fusion 360/FreeCAD, map Fritzing/KiCad wiring, and pass PDR.'
  },
  {
    id: 'badge-alpha-builder',
    title: '🤖 Closed-Loop Alpha Sign-Off',
    phaseId: 'prototype',
    xp: 400,
    criteria: 'Complete Phase 4 (Days 36–45): Build cross-braced Technic frame, twist motor wires with capacitors, code P/PD feedback + attachInterrupt(), and earn Teacher Alpha Sign-Off.'
  },
  {
    id: 'badge-fmea-hardened',
    title: '🛡️ FMEA Steel-Axle & Watchdog Survivor',
    phaseId: 'test',
    xp: 450,
    criteria: 'Complete Phase 5 (Days 46–55): Run Test Runs 1–10 on the obstacle course, log FMEA, upgrade to steel rods, enable watchdog timers, push to GitHub, and pack the Repair Kit.'
  },
  {
    id: 'badge-exhibition-laureate',
    title: '🏆 Bio-Robotics Exhibition Laureate',
    phaseId: 'share',
    xp: 500,
    criteria: 'Complete Phase 6 (Days 56–60): Present the 6-part Science Poster, defend the 5-minute speech + 3-minute Q&A, and demonstrate live at the Final Robot Exhibition.'
  }
];

export const BIOMECHANICS_PROGRAM: PblProgram = {
  id: 'biomechanics-robotics-2026',
  title: 'Quantitative Biomechanics & Bio-Inspired Robotics',
  subtitle: 'A 12-Week (120-Hour / 60-Day) engineering studio translating animal & plant movement into LEGO Technic linkages, planetary/worm gearboxes, and Arduino Nano C/C++ robots.',
  status: 'provisional_prototype',
  theme: 'Biomimicry, Advanced Mechanics, Real Electronics & Embedded C/C++',
  drivingQuestion: 'How can we study how land animals, insects, plants, and sea creatures move to design, build, and code tough, nature-inspired robots that solve real-world rescue, ocean-cleaning, and farming challenges?',
  realProblem: {
    type: 'both',
    summary: 'Wheeled robots get stuck in underground earthquake rubble, conventional ocean skimmers clog when collecting floating plastic, and rigid farm machines bruise soft fruit. Across 60 hands-on studio days (120 hours), student engineering teams reverse-engineer biological spines, exoskeletons, four-bar walking legs, baleen filters, and soft octopus arms using real mechanical math (P_mech = τ·ω, Grübler’s criterion), breadboard Arduino Nano circuits, and non-blocking C/C++ code.',
    peopleImpact: 'Equips search-and-rescue responders with snake- and insect-inspired robots that traverse collapsed rubble and helps farmers harvest delicate crops without bruising.',
    environmentalImpact: 'Cleans plastic debris from waterways using low-drag basking shark and whale filtration mechanics without trapping marine life.'
  },
  targetAgeRange: 'Ages 9–17 (Primary through Upper Secondary: 9–11, 12–14, 15–17)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'Arduino Nano boards (ATmega328P) with breadboards, resistors, and decoupling capacitors',
      'Motor controller chips (H-bridges: L298N / TB6612FNG) with separate logic and motor battery packs',
      'Backup pre-programmed Arduino Nano boards for the Week 11 Repair Kit'
    ],
    sensorsAndActuators: [
      'Weight / load-cell force sensors (for Day 1 ramp friction & Day 7 hook pull-off force tests)',
      'Sound-wave (ultrasonic) and light-based (infrared) distance sensors (Day 23)',
      '6-axis motion & tilt sensor (MPU-6050 accelerometer/gyroscope, Day 24)',
      'DC motors and continuous rotation servos with hardware interrupt bump switches (Day 44)'
    ],
    fabricationMaterials: [
      'LEGO Technic beams, cross-bracing frames, levers, spur gears, planetary gears, crown/bevel gears, and self-locking worm gears',
      'Toothed timing belts, pulleys, universal joints, flexible shaft connectors, and cams (off-center, snail, pause)',
      'Braided cables, rubber bands, hollow tubes (exoskeleton tests), and strong steel rods (Day 49 axle upgrade)',
      'Water tank with sand, rocky obstacle course materials, slippery ramps, and multimeter for the Repair Kit'
    ],
    softwareAndTools: [
      'Arduino IDE (real C/C++ coding with millis(), attachInterrupt(), P/PD loops, watchdog timers, and Serial Plotter)',
      'High-speed slow-motion video camera & motion-tracking software (Day 6)',
      'Fusion 360 or FreeCAD for 3D Computer Design & Center of Gravity plans (Day 32)',
      'Fritzing or KiCad for complete wiring maps & GitHub for saving organized code online (Days 33 & 53)'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Pinch & Snap Hazards: High-force planetary/worm gearboxes, lifting cranes (Day 15), and fast-snapping Venus flytrap LEGO traps (Day 7) store significant mechanical energy. Keep fingers clear of meshing gears and latches.',
      'Dual-Battery & Wiring Safety: In Day 22 & Day 40, verify separate battery rails for the Arduino Nano brain and H-bridge motors with a shared common ground, twisted motor wires, and decoupling capacitors.',
      'Water Tank Testing: Keep breadboard electronics away from splash zones during Day 8 drag tests and Day 46 water-tank obstacle courses.'
    ],
    pedagogicalScaffolding: [
      'Advanced Mechanics over Simple Brick Building: Require students to calculate Grübler’s criterion (Day 3), mechanical power τω = P_mech (Day 12), and Grashof four-bar linkage rules (Day 18) in their notebooks.',
      'Real C/C++ Text Coding: Enforce non-blocking millis() multitasking (Day 25), sensor spike filtering (Day 42), P/PD feedback loops (Day 43), attachInterrupt() (Day 44), and watchdog timers (Day 50).',
      'Professional Engineering Habits: Guide teams through formal ERD & Pugh Matrix scoring (Days 29–30), Preliminary Design Review (Day 35), Alpha Sign-Off (Day 45), FMEA failure analysis (Day 48), and Beta Release Lock-Down (Day 55).'
    ],
    aiEthicsRules: [
      'Students may consult AI for C++ syntax, Grübler/Grashof equations, and FMEA table templates, but all force graphs, coupler curves, and 10-trial obstacle runs must be physically measured in the lab.',
      'Every AI consultation must be logged with what was asked, what the AI suggested, and what the student team verified and kept.'
    ],
    differentiationNotes: [
      'Ages 9–11 (Foundation Track): Focus on hands-on biomimetic models (flexible spines, ant jaws, dragonfly wings, octopus cable arms), gear ratio counting, and guided sensor/motor templates.',
      'Ages 12–14 (Intermediate Track): Full four-bar Theo Jansen / Klann walking legs, planetary/worm gearboxes, Fritzing wiring maps, and millis() obstacle avoidance.',
      'Ages 15–17 (Special Older-Student Track): Full mathematical rigor (P_mech = τ·ω, Grübler DOF, Grashof rules, mAh battery math), breadboard Arduino Nano + H-bridge + MPU-6050 circuits, custom C/C++ P/PD control with hardware interrupts and watchdog timers, CAD CoG modeling, and formal FMEA.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-mechanics-power',
      metric: 'Mechanical Power & Linkage Verification (Days 3, 12, 18, 20)',
      target: 'Verified Grübler DOF calculation, P_mech = τ·ω power efficiency curve, and working single-motor Theo Jansen or Klann walking leg',
      verificationMethod: 'Notebook equations, pen-traced Grashof coupler curves, and weight-lifting gearbox bench tests'
    },
    {
      id: 'metric-electronics-coding',
      metric: 'Breadboard Electronics & Non-Blocking C/C++ Control (Days 21–25, 41–45)',
      target: 'Zero blocking delay() calls; working H-bridge dual-battery wiring, filtered ultrasonic/IR & MPU-6050 streams, P/PD loop, and attachInterrupt() bumper response',
      verificationMethod: 'Arduino Serial Plotter live graphs, code inspection, and Day 45 Teacher Alpha Sign-Off'
    },
    {
      id: 'metric-fmea-trials',
      metric: '10-Run Obstacle Course Benchmark & FMEA Hardening (Days 46–55)',
      target: 'Complete Test Runs 1–5 (baseline) and Test Runs 6–10 (after FMEA steel-rod & watchdog upgrades) meeting Phase 3 ERD speed, load, and battery goals',
      verificationMethod: '10-run empirical test log, FMEA chart, GitHub repository commit, and packed Repair Kit inspection'
    },
    {
      id: 'metric-exhibition-defense',
      metric: 'Science Poster & Final Robot Exhibition Defense (Days 56–60)',
      target: 'Complete 6-part Engineering Poster, 5-minute presentation + 3-minute tough Q&A defense, and live obstacle course run at the Final Robot Exhibition',
      verificationMethod: 'Visiting engineer, teacher, and peer evaluation rubric at the Week 12 Robot Show'
    }
  ],
  assumptions: [
    {
      id: 'asmp-60day-cadence',
      domain: '60-Day / 120-Hour Studio Cadence',
      assumption: 'Program runs across 12 weeks at 10 hours per week (5 days/week × 2 hours/day = 60 days / 120 total hours), grouped into 24 studio sessions.',
      ownerVerificationNeeded: 'Confirm whether school timetable runs 5 daily 2-hour blocks per week or 2 consolidated studio sessions per week.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    },
    {
      id: 'asmp-hardware-kits',
      domain: 'LEGO Technic, Steel Axles & Arduino Nano Inventory',
      assumption: 'Lab stocks LEGO Technic gear/linkage sets, steel rod axle replacements (Day 49), Arduino Nano (ATmega328P) boards, H-bridge chips, ultrasonic/IR sensors, MPU-6050 IMUs, and multimeters.',
      ownerVerificationNeeded: 'Confirm classroom inventory of steel replacement axles, MPU-6050 sensors, and dual battery packs.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    }
  ],
  phases: [
    {
      id: 'explore',
      title: 'Explore',
      strap: 'Phase 1: Studying Nature & Body Movement (Weeks 1–2 | Hours 1–20 | Days 1–10)',
      weeks: [1, 2],
      goal: 'Investigate how land animals, insects, fast-moving plants, and sea creatures move and grip—testing the square-cube law, flexible spines, Grübler four-bar legs, insect exoskeletons, slow-motion tracking, water drag, and braided-cable octopus arms.',
      tasks: [
        'Day 1: Learn how animal size changes strength (square-cube law), inspect Boston Dynamics Spot, compare gecko & tree frog grip, and test sliding friction on ramps with weight sensors and Arduino boards.',
        'Day 2 & Day 3: Build a flexible LEGO Technic spine with cables, a two-part rubber-band jumping leg, and a motorless four-bar walking leg; use Grübler’s criterion in your notebook to count degrees of freedom.',
        'Day 4 & Day 5: Compare hollow insect exoskeleton tubes to solid bones under weight; build LEGO lever ant jaws (pinching force), a double-crank dragonfly wing flapper, and a two-hinge locking beetle wing cover.',
        'Day 6 & Day 7: Record Week 1 machines in slow-motion video to measure speed, repeat rate, and loose joints; build a fast-snapping Venus flytrap LEGO trap and measure hook pull-off force.',
        'Day 8, Day 9 & Day 10: Test smooth whale/shark shapes vs blocky shapes in a water tank for drag; build a braided-cable soft octopus robot arm; deliver the Day 10 Phase 1 Presentation with force graphs and movement drawings.'
      ],
      evidence: [
        'Day 1–3 Ramp friction sensor log, flexible spine + jumping leg build, and notebook Grübler’s criterion calculation',
        'Day 4–5 Hollow tube vs solid bone weight chart, ant jaw lever force calculation, and dragonfly/beetle wing mechanism photos',
        'Day 6–8 Slow-motion video tracking sheet, Venus flytrap & hook pull-off force graph, and water-tank drag comparison',
        'Day 9–10 Braided-cable soft octopus arm demo and Phase 1 Presentation slide/drawing packet'
      ],
      aiPromptStarters: [
        'Explain how the square-cube law affects why an ant can lift many times its body weight while large animals need thick bones.',
        'Show me step-by-step how to use Grübler’s criterion in my notebook to count how many ways a planar four-bar walking leg can move.',
        'How do antagonistic braided cables mimic muscles moving without bones in an octopus arm?'
      ],
      competencies: ['ctps-01', 'ctps-02', 'ctps-05', 'ct-03', 'sdl-05'],
      stretchCompetencies: ['ct-11'],
      sessions: [
        {
          sessionNumber: 1,
          week: 1,
          title: 'Days 1–3: Biomimicry & Grip, Flexible Spines, Jumping Legs & Basic Walking Legs',
          durationMin: 300,
          learningGoal: 'Test the square-cube law and ramp sliding friction with Arduino weight sensors (Day 1), build a cabled LEGO Technic spine and rubber-band jumping leg (Day 2), and build a non-motorized four-bar walking leg verified with Grübler’s criterion (Day 3).',
          activities: [
            'Day 1 (Learning from Nature & Grip): Compare how animal size changes strength (square-cube law), examine Boston Dynamics Spot, compare gecko and tree frog adhesion, and test sliding friction on ramps using weight sensors and Arduino boards.',
            'Day 2 (Flexible Spines & Jumping Legs): Study how backbones bend and tendons store spring energy; build a flexible LEGO Technic spine with cables plus a two-part jumping leg using rubber bands.',
            'Day 3 (Basic Walking Legs): Build a four-bar walking leg model without a motor and use Grübler’s criterion in your notebook to count how many ways the leg can move.'
          ],
          learnerChoices: {
            question: 'Which Week 1 biological mechanism will your team focus on first for force testing?',
            options: [
              { id: 'w1-friction', label: 'Gecko & Tree Frog Ramp Friction Pad (Day 1)', description: 'Test surface grip angles and sliding friction forces using weight sensors and Arduino.' },
              { id: 'w1-spine-leg', label: 'Cabled Spine & 4-Bar Walking Leg (Days 2–3)', description: 'Combine elastic rubber-band tendon storage with a Grübler-verified 4-bar leg.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your Day 1 ramp friction force measurements, photos of your Day 2 spine/jumping leg, and your Day 3 notebook Grübler’s criterion calculation.',
            targetCompetencies: ['ctps-01', 'ctps-05']
          },
          reflectionPrompt: 'How did Grübler’s criterion help you predict whether your four-bar walking leg would lock up or move smoothly?',
          teacherTips: 'Make sure every student writes out the Grübler formula in their notebook and counts links and joints on their physical LEGO model.'
        },
        {
          sessionNumber: 2,
          week: 1,
          title: 'Days 4–5: Insect Shells & Jaws, Dragonfly Wings & Folding Beetle Parts',
          durationMin: 200,
          learningGoal: 'Compare hollow exoskeleton tubes vs solid bars under weight and calculate LEGO ant-jaw pinching force (Day 4); build a double-crank dragonfly wing machine and locking two-hinge beetle wing cover (Day 5).',
          activities: [
            'Day 4 (Insect Shells & Jaws): Test how much weight hollow tubes (exoskeletons) hold compared to solid bones; build a model of ant jaws using LEGO levers and calculate their pinching force.',
            'Day 5 (Insect Wings & Folding Parts): Build a double-crank machine that flaps wings like a dragonfly, and a folding beetle wing cover with two hinges that lock into place.'
          ],
          learnerChoices: {
            question: 'Which insect mechanism will your team optimize for high force or compact folding?',
            options: [
              { id: 'w1-ant-jaw', label: 'LEGO Lever Ant Jaws & Exoskeleton Tube (Day 4)', description: 'Maximize pinching force ratio and strength-to-weight tube load capacity.' },
              { id: 'w1-wings', label: 'Double-Crank Dragonfly & Bistable Beetle Wing (Day 5)', description: 'Synchronize dual-crank wing flapping and two-hinge locking wing covers.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Log your hollow-tube vs solid-bone weight test table, ant-jaw pinching force math, and photos of your dragonfly/beetle wing builds.',
            targetCompetencies: ['ct-03', 'ctps-02']
          },
          reflectionPrompt: 'Why are hollow tube exoskeletons stronger pound-for-pound against bending than solid rods of the same mass?',
          teacherTips: 'Have teams measure the exact lever input and output arm lengths in millimeters on their LEGO ant jaws.'
        },
        {
          sessionNumber: 3,
          week: 2,
          title: 'Days 6–8: Slow-Motion Video Tracking, Fast-Moving Plants & Moving Through Water',
          durationMin: 300,
          learningGoal: 'Track Week 1 mechanisms with high-speed video (Day 6), build a fast-snapping Venus flytrap LEGO trap and measure hook pull-off forces (Day 7), and test smooth whale/shark shapes vs blocky shapes in a water tank for drag (Day 8).',
          activities: [
            'Day 6 (Slow-Motion Video Tracking): Record your Week 1 machines using high-speed video and use motion-tracking software to measure their speed, repeat rate, and loose joints.',
            'Day 7 (Fast-Moving Plants & Tiny Hooks): Learn how Venus flytraps snap shut and how plant burrs and gecko feet hook onto things; build a fast-snapping LEGO trap and test how much force it takes to pull custom hooks off a surface.',
            'Day 8 (Moving Through Water): Learn how whales and sharks glide smoothly through water; test smooth shapes versus blocky shapes in a water tank to measure water resistance (drag).'
          ],
          learnerChoices: {
            question: 'Which Week 2 metrology experiment will lead your Phase 1 data report?',
            options: [
              { id: 'w2-snap-hooks', label: 'Venus Flytrap Snap Trap & Micro-Hook Pull Test (Day 7)', description: 'Measure snap closure speed in slow-motion and hook detachment force in Newtons.' },
              { id: 'w2-water-drag', label: 'Whale/Shark Hydrodynamic Water-Tank Drag Test (Day 8)', description: 'Compare drag resistance forces of streamlined vs blocky hulls in the water tank.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Submit your slow-motion tracking measurements (speed, repeat rate, joint play), hook pull-off force chart, and water-tank drag data.',
            targetCompetencies: ['ctps-02', 'sdl-05']
          },
          reflectionPrompt: 'What hidden loose joints or wobbles did slow-motion video reveal that you could not see at normal speed?',
          teacherTips: 'Smartphone 120fps or 240fps slow-motion mode with a ruler taped in the background works great for Day 6 motion tracking.'
        },
        {
          sessionNumber: 4,
          week: 2,
          title: 'Days 9–10: Soft Robots & Octopus Arms + Phase 1 Presentation',
          durationMin: 200,
          learningGoal: 'Build a flexible octopus robot arm controlled by pulling braided cables in opposite directions (Day 9) and present Phase 1 nature-inspired models, force graphs, and movement drawings to the class (Day 10).',
          activities: [
            'Day 9 (Soft Robots & Octopus Arms): Learn how muscles move without bones; build a flexible robot arm controlled by pulling braided cables in opposite directions.',
            'Day 10 (Phase 1 Presentation): Present your nature-inspired models, force graphs, and movement drawings to the class.'
          ],
          learnerChoices: {
            question: 'Which Phase 1 prototype will your team highlight in the Day 10 presentation?',
            options: [
              { id: 'p1-octopus', label: 'Braided-Cable Soft Octopus Arm (Day 9)', description: 'Demonstrate multi-directional curling and gentle object wrapping.' },
              { id: 'p1-walking-wing', label: '4-Bar Walking Leg & Double-Crank Flapper (Days 3 & 5)', description: 'Demonstrate Grübler mobility math alongside high-speed motion graphs.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload video of your braided-cable soft robot arm and your Day 10 Phase 1 Presentation slides, force graphs, and movement drawings.',
            targetCompetencies: ['ct-03', 'ec-02']
          },
          reflectionPrompt: 'How do braided cables pulling in opposite directions let an octopus arm bend smoothly without rigid joints?',
          teacherTips: 'During Day 10 presentations, require every team to show at least one force graph and one movement drawing.'
        }
      ]
    },
    {
      id: 'empathise',
      title: 'Empathise',
      strap: 'Phase 2A: Gears, Motors, Power & Advanced Moving Parts (Weeks 3–4 | Hours 21–40 | Days 11–20)',
      weeks: [3, 4],
      goal: 'Master mechanical power transmission—multi-step gear ratios, torque and power math (τω = P_mech), planetary gearboxes, crown/bevel hip steering, self-locking worm cranes, timing belts, universal joints, Grashof four-bar linkages, cams, and a single-motor walking leg.',
      tasks: [
        'Day 11 & Day 12: Build multi-step LEGO gear systems that do not slip, calculate speed ratios, and measure electrical power in vs mechanical power out using τω = P_mech with test weights.',
        'Day 13, Day 14 & Day 15: Build high-force planetary gearboxes, an angled crown/bevel 2-axis animal hip steering gear system, and a self-locking worm-gear lifting crane that holds heavy weights when powered off.',
        'Day 16, Day 17 & Day 18: Build toothed timing belt machines, misaligned shafts with universal joints, and Grashof four-bar linkages with pens attached to LEGO joints to trace movement paths.',
        'Day 19 & Day 20: Test off-center, snail, and pause cams to copy animal walking patterns, then build a complete mechanical walking leg powered by just one motor (Theo Jansen or Klann leg design).'
      ],
      evidence: [
        'Day 11–12 Gear speed ratio table and τω = P_mech electrical vs mechanical power weight-lifting log',
        'Day 13–15 Photos/videos of planetary joint gearbox, bevel-gear animal hip, and self-locking worm-gear crane holding load with motor off',
        'Day 16–19 Timing belt & universal joint build notes, pen-traced Grashof four-bar coupler paths, and cam lift profiles',
        'Day 20 Working single-motor Theo Jansen or Klann walking leg challenge video'
      ],
      aiPromptStarters: [
        'Explain how to calculate mechanical power out using τω = P_mech and compare it to electrical power (Volts × Amps) going into a DC motor.',
        'Why does a worm gear lock in place and hold a heavy crane weight even when the motor is turned off, while spur gears spin backward?',
        'How do Grashof rules tell us whether a four-bar linkage will rotate continuously like a crank or rock back and forth?'
      ],
      competencies: ['ctps-05', 'ctps-02', 'ct-03', 'sdl-01'],
      stretchCompetencies: ['ct-10'],
      sessions: [
        {
          sessionNumber: 5,
          week: 3,
          title: 'Days 11–13: How Gears Work, Torque/Power (τω = P_mech) & High-Force Planetary Gearboxes',
          durationMin: 300,
          learningGoal: 'Build slip-free multi-step LEGO gear trains and calculate speed ratios (Day 11), measure electrical vs mechanical power using τω = P_mech (Day 12), and build compact planetary gearboxes for robot joints (Day 13).',
          activities: [
            'Day 11 (How Gears Work): Learn about gear shapes, sizes, and bracing gears so they never slip; build multi-step LEGO gear systems and calculate their speed ratios.',
            'Day 12 (Turning Force, Speed & Power): Calculate electrical power going in versus mechanical power coming out using τω = P_mech; test strong gear systems lifting different weights.',
            'Day 13 (High-Force Gearboxes): Learn how planetary gears work and build small, strong planetary gearboxes to move robot joints.'
          ],
          learnerChoices: {
            question: 'Which gearbox benchmark will your team run for the Day 12–13 power test?',
            options: [
              { id: 'w3-compound', label: 'Multi-Step Compound Spur Gear Train (Days 11–12)', description: 'Test 3-stage speed reduction and measure weight-lifting power output.' },
              { id: 'w3-planetary', label: 'Compact Coaxial Planetary Gearbox (Day 13)', description: 'Deliver high joint torque without shaft offset or gear tooth slipping.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Submit your gear ratio calculations, τω = P_mech power efficiency table across test weights, and planetary gearbox photo.',
            targetCompetencies: ['ctps-05', 'ctps-02']
          },
          reflectionPrompt: 'When you geared your motor down for higher torque (τ), what happened to rotational speed (ω) and total mechanical power (P_mech = τω)?',
          teacherTips: 'Remind students to convert RPM to radians per second (ω = 2π × RPM / 60) when computing P_mech = τω in Watts.'
        },
        {
          sessionNumber: 6,
          week: 3,
          title: 'Days 14–15: Angled Crown/Bevel Hip Steering & Self-Locking Worm Gear Cranes',
          durationMin: 200,
          learningGoal: 'Use angled crown and bevel gears to mimic a four-legged animal’s 2-direction hip joint (Day 14) and build a self-locking worm-gear lifting crane that holds heavy weights with the motor off (Day 15).',
          activities: [
            'Day 14 (Changing Power Direction): Use angled gears (crown and bevel gears) to build a steering gear system that mimics how a four-legged animal’s hip moves in two directions.',
            'Day 15 (Self-Locking Worm Gears): Learn how worm gears lock in place and hold heavy weights even when the motor is turned off; build a self-locking lifting crane.'
          ],
          learnerChoices: {
            question: 'Which directional or locking transmission will your team test under load?',
            options: [
              { id: 'w3-hip', label: 'Bevel-Gear 2-Axis Quadruped Hip Joint (Day 14)', description: 'Turn power 90 degrees to swing and lift a robotic leg.' },
              { id: 'w3-worm', label: 'Self-Locking Worm Gear Lifting Crane (Day 15)', description: 'Hold suspended test weights with zero battery drain when motor stops.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload video of your 2-axis bevel hip steering mechanism and your worm-gear crane holding a heavy weight with the motor switched off.',
            targetCompetencies: ['ct-03', 'ctps-05']
          },
          reflectionPrompt: 'Why is a self-locking worm gear critical for a rescue or gripper robot that needs to hold a heavy object without burning out its motor?',
          teacherTips: 'Have students try to back-drive the worm gear crane by hand to feel why it is mechanically irreversible.'
        },
        {
          sessionNumber: 7,
          week: 4,
          title: 'Days 16–18: Belts & Pulleys, Universal Shaft Connectors & Grashof Four-Bar Linkages',
          durationMin: 300,
          learningGoal: 'Build fast back-and-forth toothed timing belt machines (Day 16), transmit spin through angled universal joints (Day 17), and trace Grashof four-bar linkage movement paths with pens attached to LEGO joints (Day 18).',
          activities: [
            'Day 16 (Belts & Pulleys): Learn how toothed timing belts stay tight and grip without slipping; build fast back-and-forth belt machines.',
            'Day 17 (Flexible Shaft Connectors): Learn how universal joints and flexible connectors keep spinning even when shafts are not lined up straight.',
            'Day 18 (Four-Bar Linkages): Learn the Grashof rules for how four connected bars rotate or rock back and forth; attach pens to LEGO joints to trace their movement paths.'
          ],
          learnerChoices: {
            question: 'Which Week 4 kinematic transmission will your team trace and benchmark?',
            options: [
              { id: 'w4-belt-ujoint', label: 'Toothed Timing Belt & Universal Joint Drive (Days 16–17)', description: 'Transmit high-speed linear motion and angled shaft rotation.' },
              { id: 'w4-grashof', label: 'Pen-Traced Grashof Four-Bar Linkage (Day 18)', description: 'Verify Grashof crank-rocker law (s + l ≤ p + q) and trace coupler curves.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload photos of your pen-traced four-bar linkage movement paths, Grashof bar-length measurements, and belt/universal-joint builds.',
            targetCompetencies: ['ctps-05', 'ct-03']
          },
          reflectionPrompt: 'How did changing the length of just one bar in your Day 18 four-bar linkage change the pen-traced path from a smooth loop to a rocking arc?',
          teacherTips: 'Tape a sheet of grid paper underneath the LEGO linkage so the pen traces an exact millimeter-scale curve.'
        },
        {
          sessionNumber: 8,
          week: 4,
          title: 'Days 19–20: Off-Center, Snail & Pause Cams + Single-Motor Walking Leg Challenge',
          durationMin: 200,
          learningGoal: 'Measure how off-center, snail, and pause cams push followers to copy animal walking patterns (Day 19) and build a complete mechanical walking leg powered by just one motor such as a Theo Jansen or Klann leg (Day 20).',
          activities: [
            'Day 19 (Cams & Repeating Motion): Study off-center, snail, and pause cam shapes; measure how they push parts up and down to copy animal walking patterns.',
            'Day 20 (Walking Leg Challenge): Build a complete mechanical walking leg powered by just one motor (such as a Theo Jansen or Klann leg design).'
          ],
          learnerChoices: {
            question: 'Which single-motor walking leg design will your team build for the Day 20 Challenge?',
            options: [
              { id: 'w4-jansen', label: 'Theo Jansen Strider Walking Leg (Day 20)', description: 'Smooth, flat-bottomed stride curve ideal for steady multi-legged walking.' },
              { id: 'w4-klann', label: 'Klann 6-Bar High-Step Spider Leg (Day 20)', description: 'High vertical foot clearance for stepping over rough rocks and obstacles.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your Day 19 cam displacement table and video of your Day 20 single-motor Theo Jansen or Klann walking leg in action.',
            targetCompetencies: ['ct-03', 'sdl-01']
          },
          reflectionPrompt: 'Why is powering an entire walking leg with a single rotating motor more reliable than putting a separate servo at every knee and ankle joint?',
          teacherTips: 'Check that all LEGO pins in the Theo Jansen or Klann linkage are parallel and free of binding before connecting the DC motor.'
        }
      ]
    },
    {
      id: 'define',
      title: 'Define',
      strap: 'Phase 2B: Arduino Nano & Coding in C/C++ (Week 5 | Hours 41–50 | Days 21–25)',
      weeks: [5, 5],
      goal: 'Build real breadboard circuits around the Arduino Nano (ATmega328P), wire H-bridge motor controllers with dual batteries, filter ultrasonic/IR distance sensors and 6-axis MPU-6050 tilt sensors, and write non-blocking C/C++ code using millis() instead of delay().',
      tasks: [
        'Day 21 & Day 22: Learn the parts of the Arduino Nano (ATmega328P), build breadboard circuits with resistors, connect H-bridge motor controller chips, and safely wire separate batteries for the computer brain and the motors.',
        'Day 23 & Day 24: Connect sound-wave (ultrasonic) and light-based (infrared) distance sensors plus a 6-axis motion sensor (MPU-6050); write C/C++ code filters to reject bad data and measure exact distance and tilt angles.',
        'Day 25: Write multitasking C/C++ code that never freezes (using millis() instead of delay()) and program a small wheeled robot to find and avoid obstacles on its own.'
      ],
      evidence: [
        'Day 21–22 Breadboard wiring photo showing Arduino Nano, H-bridge chip, and dual-battery common-ground setup',
        'Day 23–24 C/C++ sensor filtering code and Serial Plotter comparison of raw vs filtered ultrasonic/IR distance and MPU-6050 tilt angle',
        'Day 25 Non-blocking millis() state-machine C/C++ code and video of autonomous obstacle-avoiding robot'
      ],
      aiPromptStarters: [
        'Why do we need separate batteries for the Arduino Nano brain and the H-bridge motors, and why must their ground (GND) wires still be connected together?',
        'Show me a simple C/C++ filter for an ultrasonic or infrared distance sensor that ignores sudden bad spikes.',
        'Explain how to replace delay(1000) with millis() in Arduino C++ so my robot can check its distance sensors while spinning its motors.'
      ],
      competencies: ['ctps-05', 'ctps-02', 'sdl-02', 'sdl-03'],
      stretchCompetencies: ['ct-10'],
      sessions: [
        {
          sessionNumber: 9,
          week: 5,
          title: 'Days 21–22: Arduino Nano (ATmega328P) Breadboard Circuits, H-Bridges & Dual-Battery Power',
          durationMin: 200,
          learningGoal: 'Master the Arduino Nano (ATmega328P) pinout, resistors, and breadboard prototyping (Day 21), and connect H-bridge motor controller chips with safe dual-battery wiring for logic and motors (Day 22).',
          activities: [
            'Day 21 (Arduino Parts & Basic C++ Code): Learn the parts of the Arduino Nano board (ATmega328P), how to control digital/PWM/analog pins, use resistors, and build circuits on a breadboard.',
            'Day 22 (Motor Controllers & Battery Power): Connect the Arduino Nano to motor controller chips (H-bridges) and safely wire separate batteries for the computer brain and the motors.'
          ],
          learnerChoices: {
            question: 'How will your team configure your Day 22 H-bridge motor test bench?',
            options: [
              { id: 'w5-dual-dc', label: 'Dual Bi-Directional DC Gearmotor Drive (Day 22)', description: 'Control speed (PWM) and forward/reverse direction of two motors via H-bridge.' },
              { id: 'w5-isolated-pwr', label: 'Dual-Battery Brownout-Proof Power Rail (Day 22)', description: 'Test motor stall loads while monitoring stable 5V Arduino Nano logic voltage.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload your Day 21–22 C++ motor control sketch and a photo of your breadboard showing the Arduino Nano, H-bridge, and separate battery wiring.',
            targetCompetencies: ['ctps-05', 'sdl-02']
          },
          reflectionPrompt: 'What happens to the Arduino Nano computer brain if it shares a single weak battery with high-current motors when the motors suddenly stall?',
          teacherTips: 'Inspect every breadboard with a multimeter before students plug in batteries to confirm V_motor and 5V logic are never shorted.'
        },
        {
          sessionNumber: 10,
          week: 5,
          title: 'Days 23–25: Ultrasonic/IR Distance Sensors, MPU-6050 Tilt Filter & millis() Smart Robot Control',
          durationMin: 300,
          learningGoal: 'Connect and filter ultrasonic and infrared distance sensors (Day 23), read and filter tilt angles from a 6-axis MPU-6050 sensor (Day 24), and program an autonomous obstacle-avoiding robot using multitasking millis() code instead of delay() (Day 25).',
          activities: [
            'Day 23 (Distance Sensors): Connect sound-wave (ultrasonic) and light-based (infrared) distance sensors; write C/C++ code to filter out bad data and measure exact distances.',
            'Day 24 (Balance & Tilt Sensors): Connect a 6-axis motion sensor (MPU-6050); read movement data and use a code filter to measure what angle the robot is tilting.',
            'Day 25 (Smart Robot Control): Write C/C++ code that can multitask without freezing (millis() instead of delay()) and program a small wheeled robot to find and avoid obstacles on its own.'
          ],
          learnerChoices: {
            question: 'Which sensor + non-blocking control combination will your Day 25 robot showcase?',
            options: [
              { id: 'w5-ultrasonic-ir', label: 'Filtered Ultrasonic + IR Obstacle Avoidance (Days 23 & 25)', description: 'Combine long-range ultrasonic and short-range IR with millis() state transitions.' },
              { id: 'w5-imu-tilt', label: 'MPU-6050 Tilt-Aware Ramp Navigator (Days 24 & 25)', description: 'Detect ramp tilt angle in real time while multitasking motor speed and obstacle checks.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Submit your C/C++ code showing your sensor data filter, MPU-6050 tilt reader, and millis() multitasking obstacle-avoidance loop.',
            targetCompetencies: ['ctps-05', 'sdl-03']
          },
          reflectionPrompt: 'Why does using delay() freeze the robot’s brain, and how does checking elapsed time with millis() let the robot sense and move at the same time?',
          teacherTips: 'Have teams test what happens when they wave a hand in front of the sensor during a 2-second delay(2000) versus a millis() loop.'
        }
      ]
    },
    {
      id: 'ideate',
      title: 'Ideate and Plan',
      strap: 'Phase 3: Planning & Designing Your Robot (Weeks 6–7 | Hours 51–70 | Days 26–35)',
      weeks: [6, 7],
      goal: 'Choose one of the 3 real-world biomimetic engineering projects, form 3-student specialist teams, match animal features to robot parts, write an Engineering Requirement Document (ERD), score 3 designs in a Pugh Matrix, model 3D CAD & Center of Gravity, draw Fritzing/KiCad wiring maps, calculate mAh battery math, and pass the Preliminary Design Review (PDR).',
      tasks: [
        'Day 26 & Day 27: Choose your project—(1) Underground / Rough-Ground Rescue Robot, (2) Ocean Plastic Cleaner, or (3) Gentle Fruit-Picking Gripper—and assign the 3 team roles: Systems Leader, Coding/Controls Engineer, and Mechanical/Building Engineer.',
        'Day 28, Day 29 & Day 30: Make a chart matching animal features to robot parts (sensors, motors, frame, battery); write exact ERD goals (max weight, battery life, payload, speed, heat limits); brainstorm 3 designs and score them in a Pugh Matrix.',
        'Day 31, Day 32 & Day 33: Finalize the best design, draw measured plans or 3D CAD models in Fusion 360 / FreeCAD showing motors, frame, and Center of Gravity, and draw Fritzing / KiCad wiring diagrams plus code decision flowcharts.',
        'Day 34 & Day 35: Complete the full parts list, motor electricity draw & battery size (mAh) math, and gear strength checks; deliver the Day 35 Design Review Presentation (PDR) slideshow to teachers.'
      ],
      evidence: [
        'Day 26–28 Project track choice, 3-role team charter, and Animal-Features-to-Robot-Parts matching chart',
        'Day 29–30 Engineering Requirement Document (ERD) target table and 3-concept Pugh Matrix scoring chart',
        'Day 31–33 Fusion 360 / FreeCAD 3D model with Center of Gravity marker, Fritzing / KiCad wiring map, and code flowchart',
        'Day 34–35 Parts list, mAh battery math sheet, and Day 35 Preliminary Design Review (PDR) presentation deck'
      ],
      aiPromptStarters: [
        'Help our 3-person team build a chart matching snake/insect, whale/shark, or chameleon/gecko features to Arduino sensors, gearboxes, and frames.',
        'How do we set up a Pugh Matrix to score our 3 robot concepts fairly against our ERD weight, battery life, payload, and speed rules?',
        'Show us how to calculate the right battery size in mAh if our two drive motors draw 600 mA each and our Arduino Nano + sensors draw 80 mA for a 45-minute target run.'
      ],
      competencies: ['ec-05', 'sea-01', 'ct-02', 'ctps-02', 'lc-01', 'lc-02'],
      stretchCompetencies: ['ent-01', 'ctps-07'],
      sessions: [
        {
          sessionNumber: 11,
          week: 6,
          title: 'Days 26–28: Choose Your Engineering Project, Team Roles & Matching Nature to Robot Parts',
          durationMin: 300,
          learningGoal: 'Select one of the 3 real-world biomimetic robot projects (Day 26), form a 3-student team with defined engineering roles (Day 27), and build a chart matching animal features to robot sensors, motors, frame, and battery power (Day 28).',
          activities: [
            'Day 26 (Choose Your Engineering Project): Choose (1) Underground / Rough-Ground Rescue Robot (snakes or 6-legged insects), (2) Ocean Plastic Cleaner (basking sharks or whales), or (3) Gentle Fruit-Picking Gripper (chameleon tongues or gecko feet).',
            'Day 27 (Team Roles): Form teams of 3 students: Systems Leader, Coding/Controls Engineer, and Mechanical/Building Engineer.',
            'Day 28 (Matching Nature to Robot Parts): Make a chart matching animal features to robot needs (sensors, motors, frame, and battery power).'
          ],
          learnerChoices: {
            question: 'Which Day 26 Engineering Project does your 3-person team commit to building?',
            options: [
              { id: 'proj-rescue', label: '1. Underground / Rough-Ground Rescue Robot', description: 'Inspired by snakes or six-legged insects to cross rocky rubble and pipes.' },
              { id: 'proj-ocean', label: '2. Ocean Plastic Cleaner', description: 'Inspired by how basking sharks or whales filter water without clogging.' },
              { id: 'proj-gripper', label: '3. Gentle Fruit-Picking Gripper', description: 'Inspired by chameleon tongues or gecko feet to pick soft crops without bruising.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your chosen Engineering Project brief, signed 3-role team charter (Systems, Coding/Controls, Mechanical/Building), and your Day 28 Nature-to-Robot-Parts chart.',
            targetCompetencies: ['ec-05', 'lc-01', 'sea-01']
          },
          reflectionPrompt: 'Which specific biological feature from your chosen animal gives your robot its biggest advantage over a standard wheeled machine?',
          teacherTips: 'Ensure every team has all three roles clearly assigned so CAD, wiring, and mechanical testing happen in parallel.'
        },
        {
          sessionNumber: 12,
          week: 6,
          title: 'Days 29–30: Project Rules & Goals (ERD) + Brainstorming & Pugh Matrix Scoring',
          durationMin: 200,
          learningGoal: 'Write down exact numerical goals in an Engineering Requirement Document (ERD: max weight, battery life, payload weight, speed, heat limits, Day 29) and score 3 brainstormed robot designs using a Pugh Matrix (Day 30).',
          activities: [
            'Day 29 (Project Rules & Goals — ERD): Write down exact goals for your robot: maximum weight, battery life, how much weight it can carry, speed, and heat limits.',
            'Day 30 (Brainstorming & Scoring Ideas): Create 3 different robot designs per team and use a scoring chart (Pugh Matrix) to pick the best idea based on project rules.'
          ],
          learnerChoices: {
            question: 'Which ERD target metric is the most critical pass/fail rule for your mission?',
            options: [
              { id: 'erd-payload-speed', label: 'Payload Weight & Obstacle Speed Target (Day 29)', description: 'Prioritize high-torque gearboxes and linkage stride speed under load.' },
              { id: 'erd-battery-heat', label: 'Battery Life (mAh) & Motor Thermal Limit (Day 29)', description: 'Prioritize low-friction drivetrains and safe current draw without overheating.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your quantified ERD table (weight, battery life, payload, speed, heat limits) and your 3-design Pugh Matrix scoring chart.',
            targetCompetencies: ['ctps-02', 'ct-02']
          },
          reflectionPrompt: 'Did the Pugh Matrix score match your team’s first hunch, or did it reveal a stronger design choice?',
          teacherTips: 'Verify that every ERD goal has a number and a unit (grams, minutes, cm/s, °C) so Phase 5 testing can measure against it.'
        },
        {
          sessionNumber: 13,
          week: 7,
          title: 'Days 31–33: Finalizing the Best Design, 3D CAD (Fusion 360 / FreeCAD) & Wiring Maps (Fritzing / KiCad)',
          durationMin: 300,
          learningGoal: 'Lock the final robot design (Day 31), create measured plans or 3D CAD models in Fusion 360 or FreeCAD showing motors, frame, and Center of Gravity (Day 32), and draw complete Fritzing/KiCad wiring diagrams and code decision flowcharts (Day 33).',
          activities: [
            'Day 31 (Finalizing the Best Design): Choose your final robot design based on what parts you have, how strong the motors are, and how hard the code will be.',
            'Day 32 (3D Computer Design — CAD): Draw measured plans or 3D models (using Fusion 360 or FreeCAD) showing where the motors, frame, and balance point (center of gravity) will go.',
            'Day 33 (Wiring Maps & Code Flowcharts): Draw complete wiring diagrams (using Fritzing or KiCad) and flowcharts showing how the robot’s code will make decisions.'
          ],
          learnerChoices: {
            question: 'Which digital engineering artifact will your team complete first in Week 7?',
            options: [
              { id: 'w7-cad-cog', label: 'Fusion 360 / FreeCAD 3D Model & Center of Gravity (Day 32)', description: 'Position heavy motors and battery packs low and centered to prevent tipping.' },
              { id: 'w7-wiring-flow', label: 'Fritzing / KiCad Wiring Map & Code Flowchart (Day 33)', description: 'Map every Arduino Nano pin, H-bridge wire, sensor rail, and decision branch.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit screenshots/exports of your Day 32 3D CAD plan (with Center of Gravity marked), your Day 33 Fritzing/KiCad wiring map, and your code decision flowchart.',
            targetCompetencies: ['ctps-05', 'ct-03']
          },
          reflectionPrompt: 'Where was your robot’s Center of Gravity in your first CAD layout, and how did you move heavy parts like batteries so it will not tip on ramps?',
          teacherTips: 'Check that students label every pin number on their Fritzing/KiCad diagram before they touch the physical breadboard in Week 8.'
        },
        {
          sessionNumber: 14,
          week: 7,
          title: 'Days 34–35: Parts List, Battery Math (mAh) & Design Review Presentation (PDR)',
          durationMin: 200,
          learningGoal: 'Compile the complete parts list, calculate motor electricity draw, select battery capacity (mAh), and check gear strength (Day 34), then deliver the Design Review Presentation (PDR) slideshow to teachers (Day 35).',
          activities: [
            'Day 34 (Parts List & Battery Math): List every part you need, calculate how much electricity the motors use, choose the right battery size (mAh), and check gear strength.',
            'Day 35 (Design Review Presentation — PDR): Present a slideshow to the teachers explaining your robot’s movement, battery math, and code plan.'
          ],
          learnerChoices: {
            question: 'Which engineering calculation will anchor your Day 35 PDR presentation?',
            options: [
              { id: 'pdr-battery', label: 'Motor Current & Battery Capacity (mAh) Budget (Day 34)', description: 'Prove battery runtime meets ERD goals with a 30% safety margin.' },
              { id: 'pdr-gears', label: 'Gear Ratio & Axle Torque Stress Check (Day 34)', description: 'Prove planetary/worm gearboxes will move the full robot mass without stalling.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your Day 34 Parts List & Battery Math worksheet and your Day 35 PDR slideshow with teacher review notes.',
            targetCompetencies: ['ec-02', 'lc-02']
          },
          reflectionPrompt: 'What question from the teachers during your Day 35 PDR caught a design issue before you started building in Week 8?',
          teacherTips: 'Treat Day 35 as a real engineering gate: sign off on each team’s wiring map and battery math before issuing Week 8 build hardware.'
        }
      ]
    },
    {
      id: 'prototype',
      title: 'Prototype',
      strap: 'Phase 4: Building & Coding the Robot (Weeks 8–9 | Hours 71–90 | Days 36–45)',
      weeks: [8, 9],
      goal: 'Build a cross-braced LEGO Technic frame, align gearboxes and motors, attach biomimetic legs/grippers/tails, test axle strength and balance, mount electronics with twisted motor wires and capacitors, write organized C++ motor/sensor/P-PD/interrupt code, and earn Teacher Alpha Sign-Off.',
      tasks: [
        'Day 36, Day 37 & Day 38: Build a tough LEGO Technic frame with cross-bracing; attach DC motors or continuous servos with smooth gear/bearing alignment; build and attach walking legs, snake-like sections, or soft grippers plus balancing tails or shock-absorbing joints.',
        'Day 39 & Day 40: Put heavy weights on axles to test for bending, add metal bars/bracing and counterweights to stop shaking; mount the breadboard, Arduino Nano, power converters, and sensors with twisted motor wires, separated sensor wires, capacitors, and neat cable ties.',
        'Day 41, Day 42 & Day 43: Write organized C++ motor code (forward, backward, smooth brake, speed), sensor smoothing code to ignore electrical spikes, and automatic feedback loops (P/PD control) for balance or wall-following.',
        'Day 44 & Day 45: Add hardware interrupts (attachInterrupt()) for instant bump reactions and live Arduino Serial Plotter graphs; run the Day 45 First Full Robot Test & Teacher Check-Off (Alpha Sign-Off).'
      ],
      evidence: [
        'Day 36–39 Photos of cross-braced Technic frame, aligned gearboxes, biomimetic legs/grippers/tail, and weighted axle deflection test',
        'Day 40 Close-up photo of neat electronics wiring (twisted motor leads, separated sensor wires, capacitors, tied cables)',
        'Day 41–44 Modular C++ motor/filter/P-PD/attachInterrupt() code and Arduino Serial Plotter live graph screenshot',
        'Day 45 Alpha Sign-Off video of first autonomous lab run and logged sensor/motor punch-list'
      ],
      aiPromptStarters: [
        'Why does twisting motor wires together and keeping sensor wires away from power wires stop random sensor glitches on our robot?',
        'Write a clean Arduino C++ Proportional-Derivative (PD) feedback loop that keeps our robot balanced or following a wall at a steady distance.',
        'How do we use attachInterrupt() on an Arduino Nano bumper pin so the robot stops immediately when it hits an obstacle?'
      ],
      competencies: ['ct-03', 'ct-05', 'ctps-05', 'ctps-12', 'sdl-03', 'lc-04'],
      stretchCompetencies: ['ct-10'],
      sessions: [
        {
          sessionNumber: 15,
          week: 8,
          title: 'Days 36–38: Strong Cross-Braced Frame, Gearboxes & Motors, and Legs, Grippers & Helper Parts',
          durationMin: 300,
          learningGoal: 'Build a cross-braced LEGO Technic frame that resists twisting (Day 36), mount DC motors or continuous servos with smooth gear/bearing alignment (Day 37), and attach walking legs, snake sections, or soft grippers with helper parts like balancing tails or shock-absorbing joints (Day 38).',
          activities: [
            'Day 36 (Building a Strong Frame): Build a tough LEGO Technic frame with cross-bracing so it does not twist or bend under heavy loads.',
            'Day 37 (Adding Gearboxes & Motors): Attach DC motors or continuous servos tightly to the frame and line up gears and bearings smoothly.',
            'Day 38 (Building Legs, Grippers & Helper Parts): Build and attach the walking legs, snake-like body sections, or soft grippers, plus extra helper parts like a balancing tail or shock-absorbing joints.'
          ],
          learnerChoices: {
            question: 'Which biomimetic helper part will your team add on Day 38 to improve stability?',
            options: [
              { id: 'w8-tail', label: 'Counter-Balanced Cheetah / Kangaroo Tail (Day 38)', description: 'Keeps the center of gravity stable when walking legs lift or climb ramps.' },
              { id: 'w8-shock', label: 'Compliant Tendon Shock-Absorbing Joints (Day 38)', description: 'Absorbs ground impact forces and prevents gear teeth from shock-stripping.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your Day 36 cross-braced frame, Day 37 aligned motor/gearbox mounts, and Day 38 attached legs, grippers, or helper parts.',
            targetCompetencies: ['ct-03', 'ct-05']
          },
          reflectionPrompt: 'How much less did your LEGO Technic frame twist once you added diagonal cross-bracing beams across the corners?',
          teacherTips: 'Have students spin the main drive gear by hand before attaching the motor to verify zero friction or binding in the bearings.'
        },
        {
          sessionNumber: 16,
          week: 8,
          title: 'Days 39–40: Strength Testing & Balance + Mounting Electronics & Neat EMI-Safe Wiring',
          durationMin: 200,
          learningGoal: 'Load axles with heavy weights to test bending, add metal bracing and counterweights to stop shaking (Day 39), and mount the breadboard, Arduino Nano, power converters, and sensors with twisted motor wires, separated sensor leads, capacitors, and cable ties (Day 40).',
          activities: [
            'Day 39 (Strength Testing & Balance): Put heavy weights on axles to see if they bend, add metal bars or extra bracing, and adjust gear ratios and counterweights to stop shaking.',
            'Day 40 (Mounting Electronics & Neat Wiring): Attach the breadboard, Arduino Nano, power converters, and sensors; twist motor wires together, keep sensor wires away from power wires, add capacitors, and tie cables down neatly.'
          ],
          learnerChoices: {
            question: 'Which Day 39–40 reliability upgrade made the biggest difference on your robot?',
            options: [
              { id: 'w8-counterweight', label: 'Metal Bracing & Dynamic Counterweights (Day 39)', description: 'Eliminates frame shaking and axle sag during rapid leg/gripper motion.' },
              { id: 'w8-emi-wiring', label: 'Twisted Motor Pairs & Decoupling Capacitors (Day 40)', description: 'Prevents motor electrical noise from corrupting ultrasonic and IMU sensor wires.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit photos of your Day 39 weighted axle test and a close-up of your Day 40 neat wiring showing twisted motor wires, capacitors, and separated sensor harnesses.',
            targetCompetencies: ['ct-05', 'ctps-12']
          },
          reflectionPrompt: 'Why do untied, messy wires cause robots to fail during obstacle runs even when the code is written correctly?',
          teacherTips: 'Check that no loose jumper wire can get caught in a spinning gear or walking linkage.'
        },
        {
          sessionNumber: 17,
          week: 9,
          title: 'Days 41–43: Organized C++ Motor Code, Sensor Spike Filtering & P/PD Feedback Loops',
          durationMin: 300,
          learningGoal: 'Write organized C++ motor control files (forward, backward, smooth brake, speed change, Day 41), smooth out noisy sensor data and ignore electrical spikes (Day 42), and implement automatic P/PD feedback loops for balance or wall-following (Day 43).',
          activities: [
            'Day 41 (Writing Motor Code): Write organized C++ code files to make the motors go forward, backward, brake smoothly, and change speed.',
            'Day 42 (Cleaning Up Sensor Data): Write code to smooth out sensor readings and ignore random electrical spikes.',
            'Day 43 (Automatic Adjustments — Feedback Loops): Write code (P/PD control) that uses sensor readings to automatically keep the robot balanced or following a wall.'
          ],
          learnerChoices: {
            question: 'Which Day 43 automatic feedback loop will your robot run?',
            options: [
              { id: 'w9-pd-balance', label: 'MPU-6050 P/PD Pitch & Balance Stabilizer (Day 43)', description: 'Automatically adjusts motor speed or tail angle when climbing tilted ground.' },
              { id: 'w9-pd-wall', label: 'Ultrasonic/IR Proportional Wall & Target Tracker (Day 43)', description: 'Smoothly steers or positions gripper proportional to measured target distance.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload your organized C++ motor driver files, sensor spike-rejection filter, and Day 43 P/PD feedback loop code.',
            targetCompetencies: ['ctps-05', 'sdl-03']
          },
          reflectionPrompt: 'What happened when your proportional gain (Kp) was set too high versus when you added derivative (Kd) damping?',
          teacherTips: 'Have teams test their sensor spike filter by turning motors on and off rapidly while watching sensor values.'
        },
        {
          sessionNumber: 18,
          week: 9,
          title: 'Days 44–45: Hardware Interrupts (attachInterrupt), Serial Plotter & Teacher Alpha Sign-Off',
          durationMin: 200,
          learningGoal: 'Use hardware interrupts (attachInterrupt()) for instant bump response and stream live graphs to the Arduino Serial Plotter (Day 44), then run the robot autonomously for the First Full Robot Test & Teacher Check-Off (Alpha Sign-Off, Day 45).',
          activities: [
            'Day 44 (Faster Code with Interrupts & Live Data): Use hardware interrupts (attachInterrupt()) so the robot reacts instantly to bumps, and send live sensor graphs to the computer screen (Arduino Serial Plotter) to catch errors.',
            'Day 45 (First Full Robot Test & Teacher Check-Off — Alpha Sign-Off): Run the robot on its own for the first time, write down any sensor or motor problems, and show the teacher that your robot works in the lab.'
          ],
          learnerChoices: {
            question: 'What live telemetry signals will your team stream to the Arduino Serial Plotter on Day 44?',
            options: [
              { id: 'w9-plot-imu', label: 'Raw vs Filtered Tilt Angle & Motor PWM (Day 44)', description: 'Verify P/PD balance correction in real time on the computer screen.' },
              { id: 'w9-plot-dist', label: 'Filtered Distance & Interrupt Bump Flags (Day 44)', description: 'Verify instant hardware interrupt reaction when a bump switch triggers.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit a screenshot of your Day 44 Arduino Serial Plotter graph, your attachInterrupt() code, and video of your Day 45 Alpha Sign-Off run with logged issues.',
            targetCompetencies: ['ctps-12', 'lc-04']
          },
          reflectionPrompt: 'What sensor or motor bugs showed up during your Day 45 Alpha Sign-Off run when the robot had to operate completely on its own?',
          teacherTips: 'Sign off each team’s Alpha checklist on Day 45 and make sure they record an honest list of bugs to fix in Phase 5.'
        }
      ]
    },
    {
      id: 'test',
      title: 'Test and improve',
      strap: 'Phase 5: Testing, Fixing & Making It Tough (Weeks 10–11 | Hours 91–110 | Days 46–55)',
      weeks: [10, 11],
      goal: 'Build realistic obstacle courses (rocky ground, water tanks with sand, slippery ramps), run Test Runs 1–5, conduct a Failure Mode and Effects Analysis (FMEA), upgrade plastic axles to strong steel rods, add watchdog timers and unstuck recovery code, complete Test Runs 6–10, add protective shells, push commented code to GitHub, pack a Repair Kit, and lock down the Beta Release.',
      tasks: [
        'Day 46, Day 47 & Day 48: Build the realistic test course (rocky ground, water tanks with sand, or slippery ramps); run Test Runs 1–5 measuring speed, load carrying, overheating, and battery usage; create an organized FMEA list of every problem (broken axles, stripped gears, power drops, room-light sensor confusion).',
        'Day 49 & Day 50: Replace bending plastic axles with strong steel rods, strengthen joints, and add physical stops; add crash-proof watchdog timers and automatic recovery moves so the robot can unstick itself and never freezes.',
        'Day 51, Day 52 & Day 53: Run Test Runs 6–10 on the upgraded robot and compare scores to Phase 3 ERD goals; add smooth outer covers, protective shells, or nature-inspired colors; clean up C/C++ code with clear comments and upload to GitHub.',
        'Day 54 & Day 55: Pack a field Repair Kit (extra gears, backup pre-programmed Arduino boards, multimeter for testing wires) and complete Final Lock-Down (Beta Release: tighten screws, lock parts, upload final code).'
      ],
      evidence: [
        'Day 46–48 Obstacle course photo, Test Runs 1–5 data table (speed, load, heat, battery), and FMEA failure analysis chart',
        'Day 49–50 Before/after photos of steel rod axle upgrades & physical stops, plus C++ watchdog timer and unstuck recovery code',
        'Day 51–53 Test Runs 6–10 comparison chart vs Phase 3 ERD goals, protective shell photos, and GitHub repository link',
        'Day 54–55 Photo of stocked Repair Kit (gears, backup Arduino Nano, multimeter) and signed Beta Release Lock-Down checklist'
      ],
      aiPromptStarters: [
        'Help us organize our Day 48 FMEA table for broken plastic axles, stripped gears, battery power drops, and infrared sensors confused by bright room lights.',
        'How do we enable a watchdog timer and write an automatic "unstick yourself" recovery move in Arduino C++ so our robot never freezes on rocky ground?',
        'What comments and README structure should we include when uploading our final Arduino C/C++ robot code to GitHub on Day 53?'
      ],
      competencies: ['ctps-03', 'ctps-02', 'ctps-12', 'ct-12', 'sea-04'],
      stretchCompetencies: ['ctps-07', 'sdl-09'],
      sessions: [
        {
          sessionNumber: 19,
          week: 10,
          title: 'Days 46–48: Building the Test Course, Test Runs 1–5 & Finding Why Things Break (FMEA)',
          durationMin: 300,
          learningGoal: 'Build realistic obstacle courses (rocky ground, water tanks with sand, or slippery ramps, Day 46), execute Test Runs 1–5 measuring speed, load, heat, and battery use (Day 47), and catalog every failure in an FMEA chart (Day 48).',
          activities: [
            'Day 46 (Building the Test Course): Build realistic obstacle courses (rocky ground, water tanks with sand, or slippery ramps).',
            'Day 47 (Test Runs 1–5): Run the robot 5 times and measure its speed, how well it carries loads, if parts get too hot, and how much battery power it uses.',
            'Day 48 (Finding Why Things Break — FMEA): Make an organized list of every problem: broken axles, stripped gears, power drops, or sensors confused by bright room lights.'
          ],
          learnerChoices: {
            question: 'Which realistic obstacle course environment matches your team’s project track on Day 46?',
            options: [
              { id: 'w10-rocks-ramps', label: 'Rocky Rubble Bed & Slippery Ramps (Track 1 & 3)', description: 'Test walking leg traction, axle bending, and soft-gripper stability under load.' },
              { id: 'w10-water-sand', label: 'Water Tank with Suspended Sand & Plastic (Track 2)', description: 'Test low-drag hull stability, filter intake flow, and waterproofed wiring.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your Day 47 Test Runs 1–5 data table (speed, load, temperature, battery) and your Day 48 FMEA breakdown list.',
            targetCompetencies: ['ctps-03', 'ctps-02']
          },
          reflectionPrompt: 'What was the #1 failure mode in your FMEA chart after Test Runs 1–5, and what caused it?',
          teacherTips: 'Remind teams that finding broken axles, stripped gears, or sensor glare in Runs 1–5 is a success—that is the whole point of FMEA!'
        },
        {
          sessionNumber: 20,
          week: 10,
          title: 'Days 49–50: Making the Robot Stronger (Steel Rods & Stops) + Crash-Proof Coding (Watchdog & Unstick)',
          durationMin: 200,
          learningGoal: 'Replace bending plastic axles with strong steel rods, strengthen joints, and add physical stops (Day 49), and add C/C++ watchdog timers and automatic unstuck recovery moves so the robot never freezes (Day 50).',
          activities: [
            'Day 49 (Making the Robot Stronger): Replace bending plastic axles with strong steel rods, strengthen joints, and add physical stops so parts cannot bend too far.',
            'Day 50 (Crash-Proof Coding): Add safety timers (watchdog timers) and automatic recovery moves so the robot can unstick itself and never freezes.'
          ],
          learnerChoices: {
            question: 'Which hardening upgrade will your team test first before Week 11?',
            options: [
              { id: 'w10-steel-stops', label: 'Steel Drive Rods & Physical Joint Stops (Day 49)', description: 'Eliminate plastic axle twist and prevent linkages from over-extending.' },
              { id: 'w10-watchdog', label: 'Watchdog Timer & Autonomous Unstick Routine (Day 50)', description: 'Automatically back up, pivot, or reset if the robot stalls on an obstacle.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit before-and-after photos of your Day 49 steel axle/joint upgrades and your Day 50 watchdog timer + automatic recovery C++ code.',
            targetCompetencies: ['ctps-12', 'ct-12']
          },
          reflectionPrompt: 'How did replacing bending plastic axles with steel rods and adding physical stops change how smoothly your gears meshed under load?',
          teacherTips: 'Test each team’s Day 50 unstuck code by holding the robot still on the course for 3 seconds to verify it triggers its recovery move automatically.'
        },
        {
          sessionNumber: 21,
          week: 11,
          title: 'Days 51–53: Test Runs 6–10, Protective Shells & Looks + Cleaning Up Code & Saving to GitHub',
          durationMin: 300,
          learningGoal: 'Run Test Runs 6–10 on the upgraded robot and compare scores to Phase 3 goals (Day 51), add smooth outer covers, protective shells, or nature-inspired colors (Day 52), and organize, comment, and upload final C/C++ code to GitHub (Day 53).',
          activities: [
            'Day 51 (Test Runs 6–10): Test the upgraded robot 5 more times and compare the new scores to your original Phase 3 goals.',
            'Day 52 (Protective Shells & Looks): Add smooth outer covers, protective shells, or nature-inspired colors that help protect the robot’s inner parts.',
            'Day 53 (Cleaning Up Code & Saving Online): Organize your final code, add clear explanation notes (comments) on how it works, and upload it to GitHub.'
          ],
          learnerChoices: {
            question: 'What protective shell design will your team add on Day 52?',
            options: [
              { id: 'w11-exoshell', label: 'Segmented Arthropod Exoskeleton Cover (Day 52)', description: 'Shields breadboard and gears from falling rubble and dust while allowing airflow.' },
              { id: 'w11-hydro-shell', label: 'Streamlined Whale/Gecko Fairing & Color Camouflage (Day 52)', description: 'Reduces drag and protects sensors from ambient room light interference.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your Test Runs 6–10 comparison graph (Runs 1–5 vs Runs 6–10 vs Phase 3 ERD goals), photos of your protective shell, and your GitHub code link.',
            targetCompetencies: ['ctps-03', 'sdl-03']
          },
          reflectionPrompt: 'By how much did your robot’s speed, load capacity, and reliability improve in Test Runs 6–10 compared to Test Runs 1–5?',
          teacherTips: 'Make sure students check that their Day 52 protective shell does not block ultrasonic sensors or trap excessive motor heat.'
        },
        {
          sessionNumber: 22,
          week: 11,
          title: 'Days 54–55: Building a Field Repair Kit & Final Lock-Down (Beta Release)',
          durationMin: 200,
          learningGoal: 'Pack a complete field Repair Kit with extra gears, backup pre-programmed Arduino boards, and a multimeter (Day 54), and complete the Final Lock-Down Beta Release (tighten all screws, lock mechanical parts, upload final code, Day 55).',
          activities: [
            'Day 54 (Building a Repair Kit): Pack a repair box with extra gears, backup pre-programmed Arduino boards, and a multimeter for testing wires.',
            'Day 55 (Final Lock-Down — Beta Release): Tighten all screws, lock mechanical parts in place, and upload the final code to the robot.'
          ],
          learnerChoices: {
            question: 'What rapid-swap spare assembly will your team pre-pack in your Day 54 Repair Kit?',
            options: [
              { id: 'w11-spare-nano', label: 'Pre-Flashed Backup Arduino Nano & Sensor Leads (Day 54)', description: 'Allows a 60-second brain swap if a wire or pin is damaged before the show.' },
              { id: 'w11-spare-gear', label: 'Spare Planetary/Worm Gear Set & Multimeter Probes (Day 54)', description: 'Instant mechanical tooth replacement and battery voltage check at the exhibition.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit a photo of your stocked Day 54 Repair Kit and your signed Day 55 Beta Release Lock-Down inspection sheet.',
            targetCompetencies: ['sea-04', 'ctps-12']
          },
          reflectionPrompt: 'Why do professional robotics teams freeze their hardware and code at Beta Lock-Down instead of making risky changes five minutes before a demonstration?',
          teacherTips: 'Have teams practice using their multimeter to check battery voltage and wire continuity as part of the Day 54 Repair Kit drill.'
        }
      ]
    },
    {
      id: 'share',
      title: 'Showcase or present',
      strap: 'Phase 6: Final Presentation & Robot Show (Week 12 | Hours 111–120 | Days 56–60)',
      weeks: [12, 12],
      goal: 'Create a 6-part professional engineering poster, rehearse a 5-minute presentation with 3 minutes of tough engineering Q&A, test under pressure in front of classmates, demonstrate the working robot on the test course at the Final Robot Exhibition, and complete final reflections and part archival.',
      tasks: [
        'Day 56 & Day 57: Make a professional engineering Science Poster showing Project Summary, Nature Inspiration, How It Moves, Wiring Diagram, Test Graphs, and How the Design Changed; prepare a 5-minute speech and practice answering 3 minutes of tough engineering questions.',
        'Day 58: Run the Practice Run & Class Questions—test the robot under pressure in front of other student teams and defend your design choices.',
        'Day 59 & Day 60: Showcase your working robot on the test course to visiting engineers, parents, and teachers at the Final Robot Exhibition; write a final reflection on what you learned, sort and put away all Arduino and LEGO parts, and save all project files.'
      ],
      evidence: [
        'Day 56 6-Part Engineering Science Poster (Summary, Nature Inspiration, How It Moves, Wiring Diagram, Test Graphs, How Design Changed)',
        'Day 57–58 5-minute speech script, 3-minute Q&A defense notes, and peer Practice Run scorecard',
        'Day 59 Final Robot Exhibition live test-course demonstration photos and visiting engineer/teacher feedback',
        'Day 60 Final individual engineering reflection, sorted hardware inventory check-off, and archived project files'
      ],
      aiPromptStarters: [
        'Review our Day 56 Science Poster text to make sure all 6 required sections (Summary, Nature Inspiration, How It Moves, Wiring Diagram, Test Graphs, How the Design Changed) are clear and concise.',
        'Act as a visiting robotics engineer and ask our team 5 tough 3-minute Q&A questions about our τω = P_mech power math, FMEA steel axle upgrade, and millis() C++ code.',
        'Help me structure my Day 60 Looking Back reflection comparing what I knew on Day 1 versus what I built and coded by Day 59.'
      ],
      competencies: ['ec-11', 'ec-02', 'ec-03', 'ec-12', 'sdl-04', 'ctps-04'],
      stretchCompetencies: ['ec-07', 'ec-09', 'ent-07'],
      sessions: [
        {
          sessionNumber: 23,
          week: 12,
          title: 'Days 56–58: Making a 6-Part Science Poster, Practicing Your Speech & Practice Run under Pressure',
          durationMin: 300,
          learningGoal: 'Create the 6-part professional engineering poster (Day 56), rehearse the 5-minute speech + 3-minute tough Q&A (Day 57), and test the robot under pressure in front of other student teams (Day 58).',
          activities: [
            'Day 56 (Making a Science Poster): Create a professional engineering poster showing: Project Summary, Nature Inspiration, How It Moves, Wiring Diagram, Test Graphs, and How the Design Changed.',
            'Day 57 (Practicing Your Speech): Prepare a 5-minute presentation and practice answering 3 minutes of tough questions about how you solved engineering problems.',
            'Day 58 (Practice Run & Class Questions): Test the robot under pressure in front of other student teams and answer their questions about your design choices.'
          ],
          learnerChoices: {
            question: 'Which section of your Day 56 Science Poster will feature your strongest before-and-after evidence?',
            options: [
              { id: 'w12-poster-graphs', label: 'Test Graphs: Runs 1–5 vs Runs 6–10 Performance Jump', description: 'Show exact speed, load, and reliability gains after Day 48–50 FMEA upgrades.' },
              { id: 'w12-poster-design', label: 'How the Design Changed: Plastic-to-Steel & Wiring Evolution', description: 'Show CAD, Fritzing wiring diagrams, and physical hardening milestones.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload an image of your completed Day 56 6-part Science Poster and your Day 57–58 Practice Run & peer Q&A notes.',
            targetCompetencies: ['ec-03', 'ec-02', 'ctps-04']
          },
          reflectionPrompt: 'What was the toughest question another student team asked during the Day 58 Practice Run, and how did you improve your answer for Exhibition Day?',
          teacherTips: 'Use a stopwatch on Day 57 and Day 58: 5 minutes for the team presentation and 3 minutes of rapid-fire engineering questions.'
        },
        {
          sessionNumber: 24,
          week: 12,
          title: 'Days 59–60: Final Robot Exhibition + Taking Apart, Sorting Parts & Looking Back',
          durationMin: 200,
          learningGoal: 'Demonstrate the working robot on the test course to visiting engineers, parents, and teachers (Day 59), and write a final reflection, sort and put away all Arduino and LEGO parts, and archive all project files (Day 60).',
          activities: [
            'Day 59 (Final Robot Exhibition): Show your working robot on the test course to visiting engineers, parents, and teachers.',
            'Day 60 (Taking Apart & Looking Back): Write a final reflection on what you learned, sort and put away all Arduino and LEGO parts, and save all project files.'
          ],
          learnerChoices: {
            question: 'Which special older-student engineering skill are you proudest of mastering across the 60 days?',
            options: [
              { id: 'w12-skill-mech', label: 'Advanced Mechanics (τω = P_mech, Planetary/Worm Gears, 4-Bar Linkages)', description: 'Designing tough frames, Grashof walking legs, and high-force gearboxes.' },
              { id: 'w12-skill-elec', label: 'Real Breadboard Electronics (Arduino Nano, H-Bridges, MPU-6050)', description: 'Wiring dual-battery motor drivers, distance sensors, and 6-axis tilt sensors.' },
              { id: 'w12-skill-code', label: 'Text Coding in C/C++ & Professional FMEA Habits', description: 'Writing millis() state machines, attachInterrupt(), P/PD loops, and 10-run FMEA tests.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Submit photos/feedback from your Day 59 Final Robot Exhibition and your Day 60 Looking Back reflection and archived project checklist.',
            targetCompetencies: ['ec-11', 'ec-12', 'sdl-04']
          },
          reflectionPrompt: 'Looking back from Day 1 to Day 60, how did combining nature’s designs with real math, breadboard electronics, and C/C++ coding change the way you solve problems?',
          teacherTips: 'Have every team complete a clean kit sort on Day 60 so all Arduino Nano boards, sensors, steel rods, and LEGO Technic gears are ready for the next cohort.'
        }
      ]
    }
  ]
};
