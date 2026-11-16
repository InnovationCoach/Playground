/**
 * Robo-Buddy Companion — 12-Week / 120-Hour Project-Based Learning Program
 * Location: prototypes/DonPBL/roboBuddyProgram.ts
 *
 * Adapted from the WeLearn 12-Week PBL Curriculum:
 * - Project Title: Robo-Buddy Companion: Build, Code & Care for a 3D-Printed Walking Desk Pet
 * - Duration: 12 Weeks | 5 Days/Week | 2 Hours/Day = 120 Hours Total (24 Milestone Sessions)
 * - Target Learners: Lower & Upper Secondary (Ages 11–17; ESL-scaffolded & neuro-inclusive)
 * - Hardware Tracks:
 *   • Version A: BBC micro:bit V2 + INEX PROJECT:BIT Expansion Board (MakeCode / MicroPython)
 *   • Version B: Arduino Nano + Nano I/O Expansion Shield (Arduino IDE C/C++ / Otto DIY Library)
 * - 3 Core Deliverables:
 *   1. A Working Walking Desk Robot (4x SG90 180° servos: Left Hip, Right Hip, Left Foot, Right Foot)
 *   2. Virtual Pet & Smart Alarm Code (Tamagotchi stats: Hunger, Happiness, Energy + Smart Alarm dismiss rule)
 *   3. A Complete MTC Digital Portfolio (Photos, CAD screenshots, wiring diagrams, 40-test log, reflection)
 */

import type { PblProgram } from './programData';

export interface RoboBuddyDeliverableSpec {
  id: string;
  number: number;
  title: string;
  summary: string;
  requirements: string[];
  mtcEvidence: string;
}

export interface RoboBuddyHardwareComparisonRow {
  componentCategory: string;
  versionAMicrobit: string;
  versionBArduinoNano: string;
  classroomNotes: string;
}

export interface RoboBuddyWeeklyRhythmDay {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  focusTitle: string;
  durationHours: number;
  routineBreakdown: string[];
  deliverableCheck: string;
}

export interface RoboBuddyTeamRole {
  id: string;
  roleTitle: string;
  subtitle: string;
  coreResponsibilities: string[];
  weeklyPortfolioArtifact: string;
  primaryCompetencies: string[];
}

export interface RoboBuddyWeekPlan {
  week: number;
  phaseName: string;
  designThinkingPhaseId: 'explore' | 'empathise' | 'define' | 'ideate' | 'prototype' | 'test' | 'share';
  title: string;
  drivingQuestion: string;
  mondayPlan: string;
  tuesdayPlan: string;
  wednesdayPlan: string;
  thursdayPlan: string;
  fridayMilestone: string;
  portfolioArtifact: string;
}

export interface RoboBuddyPinoutVersion {
  versionId: 'microbit' | 'arduino-nano';
  versionTitle: string;
  boardName: string;
  powerRuleWarning: string;
  pins: {
    component: string;
    pinAssignment: string;
    wireColorOrNote: string;
  }[];
}

export interface RoboBuddyMtcRubricRow {
  skillNumber: number;
  weLearnFutureSkill: string;
  mtcCompetencyCode: string;
  emerging: string;
  foundationalCredit: string;
  advancedCredit: string;
  portfolioEvidenceRequired: string;
}

export interface RoboBuddyBadge {
  id: string;
  title: string;
  phase: string;
  iconName: string;
  criteria: string;
  xpReward: number;
}

export const ROBO_BUDDY_DELIVERABLES: RoboBuddyDeliverableSpec[] = [
  {
    id: 'rb-deliv-1',
    number: 1,
    title: 'A Working Walking Desk Robot (3D-Printed 4-Servo Otto Bipedal Chassis)',
    summary:
      'A custom 3D-printed 2-legged desk companion robot powered by 4 SG90 180° micro-servos (Left Hip, Right Hip, Left Foot, Right Foot) that walks forward, turns, dances, and expresses emotions without tipping over.',
    requirements: [
      'Custom 3D-printed head and body shell modeled in Tinkercad or Fusion 360 with 2.5mm–3.0mm wall thickness and clean wire routing channels.',
      'All 4 SG90 servos electronically centered to 90° BEFORE screwing on servo horns, plus software trim calibrated within ±5°.',
      'Powered safely by an external 4xAA (6V) battery pack connected to the expansion board power input (never drawing 4-servo stall current from computer USB alone).',
      'Upgraded to Prototype V2.0 with rubber/hot-glue foot grip pads and zip-tied internal wiring.'
    ],
    mtcEvidence:
      'CAD orthographic screenshot, 90° servo calibration photo, Bench Test 1 video (5 steps without tipping), and Prototype V2.0 upgrade photo.'
  },
  {
    id: 'rb-deliv-2',
    number: 2,
    title: 'Virtual Pet & Smart Alarm Code (Tamagotchi Brain + Interactive Sensors)',
    summary:
      'Embedded software (MakeCode/MicroPython on Version A micro:bit or C/C++ on Version B Arduino Nano) implementing a live Tamagotchi state machine (Hunger, Happiness, Energy) and a Smart Study/Wake-Up Alarm that requires physical interaction to dismiss.',
    requirements: [
      '5-State Mood Machine: Happy, Hungry, Sleepy, Bored, and Alarm Ringing displayed on the 5x5 LED matrix or I2C OLED eyes.',
      'Interactive Care Sensors: Capacitive touch sensor (petting head boosts Happiness) and LDR/light sensor ("feeding" with a flashlight reduces Hunger).',
      'Smart Alarm Dismiss Rule: When the alarm rings and the robot dances, the user must pet the head touch sensor 3 times OR wave a hand within 15cm of the HC-SR04 ultrasonic sensor to dismiss it.',
      'Benchmarked across 40 trials in Week 10 (20 walking tests, 10 alarm trigger/dismiss tests, 10 sensor care tests).'
    ],
    mtcEvidence:
      'State diagram flowchart, commented source code (.hex or .ino), Bench Test 2 video, and completed 40-trial Week 10 Reliability Table.'
  },
  {
    id: 'rb-deliv-3',
    number: 3,
    title: 'A Complete MTC Digital Portfolio & Pet Adoption Fair Showcase',
    summary:
      'A curated Mastery Transcript Consortium (MTC) portfolio and a live 5-minute team pitch at the Week 12 Pet Adoption Fair & Robotics Showcase.',
    requirements: [
      'Printed Quick-Start User Manual (1-page illustrated care card showing how to feed, pet, set the alarm, and change batteries).',
      'Complete engineering evidence trail from Week 1 empathy interviews through Week 10 failure logs and V2.0 fixes.',
      'Live 5-minute demonstration where every team member speaks and visitors interact with the Robo-Buddy on the desk.'
    ],
    mtcEvidence:
      '1-Page User Manual PDF, 6-slide showcase deck, and final individual MTC reflection across all 7 WeLearn Future Skills.'
  }
];

export const ROBO_BUDDY_HARDWARE_TABLE: RoboBuddyHardwareComparisonRow[] = [
  {
    componentCategory: '1. Main Microcontroller ("The Brain")',
    versionAMicrobit: 'BBC micro:bit V2 (built-in 5x5 LED matrix, speaker, accelerometer, buttons A/B, touch logo)',
    versionBArduinoNano: 'Arduino Nano ATmega328P (compact breadboard-friendly C/C++ microcontroller)',
    classroomNotes: 'Version A is ideal for block/MicroPython learners; Version B is ideal for C/C++ & Otto DIY library learners.'
  },
  {
    componentCategory: '2. Servo & Sensor Expansion Shield',
    versionAMicrobit: 'INEX PROJECT:BIT Expansion Board (dedicated 3-pin servo headers S1–S4 + external battery terminal)',
    versionBArduinoNano: 'Arduino Nano I/O Expansion Shield (3-pin G-V-S rows on Digital Pins D2–D13 + DC barrel jack)',
    classroomNotes: 'Both shields provide plug-and-play 3-pin (GND / VCC / Signal) headers so students do not need loose breadboard servo power rails.'
  },
  {
    componentCategory: '3. Walking Motors (4x Bipedal Joints)',
    versionAMicrobit: '4x SG90 180° Micro Servos (Left Hip, Right Hip, Left Foot, Right Foot) — NOT 360° continuous rotation!',
    versionBArduinoNano: '4x SG90 or MG90S 180° Micro Servos (Left Hip D2, Right Hip D3, Left Foot D4, Right Foot D5)',
    classroomNotes: 'CRITICAL: Verify all 4 servos are 180° positional servos. Center all 4 servos to 90° in code before attaching plastic horns.'
  },
  {
    componentCategory: '4. Face & Expression Display',
    versionAMicrobit: 'Built-in 5x5 Red LED Matrix (visible through a front window in the 3D-printed head) or I2C 0.96" OLED',
    versionBArduinoNano: '0.96" I2C OLED Display (SDA -> A4, SCL -> A5) or 8x8 MAX7219 LED Matrix Mouth + HC-SR04 Eyes',
    classroomNotes: 'Displays the 5 Tamagotchi moods: Happy (^_^), Hungry (O_O), Sleepy (-_-), Bored (._.), and Alarm (!O!).'
  },
  {
    componentCategory: '5. Distance & Presence Sensor ("Eyes")',
    versionAMicrobit: 'HC-SR04 Ultrasonic Distance Sensor (3.3V/5V compatible via PROJECT:BIT I/O header)',
    versionBArduinoNano: 'HC-SR04 Ultrasonic Distance Sensor (Trig -> D8, Echo -> D9)',
    classroomNotes: 'Detects when the student sits at the desk or waves a hand within <= 15cm to snooze/dismiss the Smart Alarm.'
  },
  {
    componentCategory: '6. Petting & Care Sensors ("Touch & Feeding")',
    versionAMicrobit: 'TTP223 Capacitive Touch Sensor (P0) + LDR Photoresistor Light Sensor (P1 / built-in LED light level)',
    versionBArduinoNano: 'TTP223 Capacitive Touch Sensor (D6) + LDR Photoresistor Light Sensor Module (A0)',
    classroomNotes: 'Petting the head (Touch) increases Happiness; shining a flashlight ("feeding light snacks") reduces Hunger.'
  },
  {
    componentCategory: '7. Sound & Alarm Output ("Voice")',
    versionAMicrobit: 'Built-in micro:bit V2 Speaker + Piezo Buzzer on PROJECT:BIT',
    versionBArduinoNano: '5V Passive Piezo Buzzer Module (Pin D13 or D12)',
    classroomNotes: 'Plays R2-D2 style emotional chirps (happy melody, hungry grumble, sleepy yawn, urgent wake-up alarm).'
  },
  {
    componentCategory: '8. External Servo Power Supply',
    versionAMicrobit: '4xAA (6V) Battery Holder with ON/OFF switch wired to PROJECT:BIT VIN/GND terminal',
    versionBArduinoNano: '4xAA (6V) Battery Holder with DC plug or VIN/GND screw terminal on Nano Shield',
    classroomNotes: 'SAFETY RULE: Never run 4 walking servos from computer USB power alone—voltage drop will brown out the board!'
  }
];

export const ROBO_BUDDY_WEEKLY_RHYTHM: RoboBuddyWeeklyRhythmDay[] = [
  {
    day: 'Monday',
    focusTitle: 'Concept Mini-Lesson, Unplugged Logic & Role Sprint Planning',
    durationHours: 2,
    routineBreakdown: [
      '0:00–0:20 — Weekly Driving Question & Coach Demo (inspecting physical mechanism or code pattern)',
      '0:20–0:50 — Unplugged Activity / Engineering Notebook Sketch (kinematics, state diagrams, or wiring plans)',
      '0:50–1:45 — Role-Based Studio Sprint Setup (Builder, Coder, 3D Designer, Project Manager)',
      '1:45–2:00 — Daily Stand-Down & KanBan Card Update'
    ],
    deliverableCheck: 'Updated Team KanBan Board + Monday Design Sketch in Notebook.'
  },
  {
    day: 'Tuesday',
    focusTitle: 'Deep Hardware, CAD & Code Prototyping Lab I',
    durationHours: 2,
    routineBreakdown: [
      '0:00–0:15 — 15-Minute Team Stand-Up & Safety Check (servo power & tool check)',
      '0:15–1:40 — Hands-On Build & Code Lab (3D modeling, breadboarding, or gait coding)',
      '1:40–2:00 — Hardware Safe-Store & Progress Photo Log'
    ],
    deliverableCheck: 'Working sub-assembly or code module committed to team folder.'
  },
  {
    day: 'Wednesday',
    focusTitle: 'Deep Hardware, CAD & Code Prototyping Lab II',
    durationHours: 2,
    routineBreakdown: [
      '0:00–0:15 — Mid-Week Blocker Triage (debugging hardware/software integration)',
      '0:15–1:40 — Cross-Role Integration (fitting electronics inside 3D-printed or cardboard shells)',
      '1:40–2:00 — Peer Desk Check & Measurement Verification'
    ],
    deliverableCheck: 'Integrated hardware + software checkpoint verified by Project Manager.'
  },
  {
    day: 'Thursday',
    focusTitle: 'Bench Testing, Calibration & Bug Fixing',
    durationHours: 2,
    routineBreakdown: [
      '0:00–0:20 — Test Protocol Briefing (defining pass/fail thresholds)',
      '0:20–1:35 — Structured Bench Testing & Iteration (logging trials, trimming servo angles, fixing bugs)',
      '1:35–2:00 — Prep Friday Demo & Capture Before/After Evidence'
    ],
    deliverableCheck: 'Completed Thursday Test Table & Bug Fix Log.'
  },
  {
    day: 'Friday',
    focusTitle: 'Weekly Milestone Demo, Peer Critique & MTC Portfolio Upload',
    durationHours: 2,
    routineBreakdown: [
      '0:00–0:45 — Final Polish & Bench Test Sign-Off',
      '0:45–1:30 — Friday "Show, Tell & Test" Circle (live 2-minute desk demo per team)',
      '1:30–2:00 — MTC Digital Portfolio Upload & Weekly Reflection Log'
    ],
    deliverableCheck: 'Friday Milestone Artifact uploaded and tagged with WeLearn MTC competencies.'
  }
];

export const ROBO_BUDDY_TEAM_ROLES: RoboBuddyTeamRole[] = [
  {
    id: 'role-lead-builder',
    roleTitle: '1. Lead Builder (Mechanical & Hardware Engineer)',
    subtitle: 'Owns 4-servo assembly, 90° mechanical centering, wiring harness, and battery safety',
    coreResponsibilities: [
      'Verify all 4 SG90 servos are centered to 90° before attaching servo horns and screwing into the hips and feet.',
      'Wire servos, ultrasonic eyes, touch sensor, LDR light sensor, and piezo buzzer neatly to the expansion shield.',
      'Manage the 4xAA (6V) external battery pack, zip-tie loose wires, and add high-friction rubber foot grips in Week 10.'
    ],
    weeklyPortfolioArtifact: 'Annotated pinout wiring photos, 90° calibration check sheet, and mechanical stress-test log.',
    primaryCompetencies: ['ctps-05', 'sdl-03', 'lc-03']
  },
  {
    id: 'role-lead-coder',
    roleTitle: '2. Lead Coder (Embedded Software & State Machine Engineer)',
    subtitle: 'Owns walking gait subroutines, Tamagotchi mood variables, and Smart Alarm logic',
    coreResponsibilities: [
      'Program smooth 4-servo walking, turning, and dancing sequences with software angle trim offsets (±5°).',
      'Code the Tamagotchi Virtual Pet Brain (`Hunger`, `Happiness`, `Energy` timers and 5-mood state machine).',
      'Implement the Smart Alarm trigger and interactive dismiss rule (`Head Touch >= 3` or `Ultrasonic Wave <= 15cm`).'
    ],
    weeklyPortfolioArtifact: 'Commented MakeCode/MicroPython or Arduino C/C++ source code and state transition flowchart.',
    primaryCompetencies: ['ct-02', 'ctps-05', 'sdl-04']
  },
  {
    id: 'role-cad-designer',
    roleTitle: '3. 3D & Visual Designer (CAD Enclosure & UI Expression Lead)',
    subtitle: 'Owns 3D-printed head/body shell in Tinkercad/Fusion 360, LED/OLED faces, and User Manual',
    coreResponsibilities: [
      'Measure microcontroller, expansion shield, battery pack, and servos with digital calipers (+1.0mm clearance tolerance).',
      'Model the 3D head and body shell (`2.5mm–3.0mm` wall thickness, snap/screw mounts, ultrasonic eye sockets, and top touch pad slot).',
      'Design the 5 LED/OLED facial expressions and illustrate the 1-page Quick-Start User Manual.'
    ],
    weeklyPortfolioArtifact: 'Orthographic CAD screenshots, `.STL` slicer preview (`20%` infill, `3` wall loops), and User Manual PDF.',
    primaryCompetencies: ['ct-02', 'ec-05', 'ent-04']
  },
  {
    id: 'role-project-manager',
    roleTitle: '4. Project Manager (QA Testing, User Empathy & MTC Portfolio Lead)',
    subtitle: 'Owns empathy interviews, KanBan board, Week 10 40-trial benchmark, and Showcase pitch',
    coreResponsibilities: [
      'Lead Week 2 student desk-habit interviews and define the team Persona & Problem Statement in Week 3.',
      'Track daily tasks on the team KanBan board and enforce safety rules during hardware lab sessions.',
      'Run the Week 10 40-Point Reliability Benchmark (20 walk + 10 alarm + 10 sensor care trials) and coordinate the Week 12 Pet Adoption Fair pitch.'
    ],
    weeklyPortfolioArtifact: 'Empathy interview notes, 40-trial QA scorecard, failure/fix log, and 5-minute showcase script.',
    primaryCompetencies: ['lc-03', 'sea-01', 'ec-05', 'sdl-04']
  }
];

export const ROBO_BUDDY_12_WEEK_CURRICULUM: RoboBuddyWeekPlan[] = [
  {
    week: 1,
    phaseName: 'Phase 1: Explore & Empathize (Weeks 1–2)',
    designThinkingPhaseId: 'explore',
    title: 'Week 1: Meet the Bipedal Robot & Centering Our First Servos',
    drivingQuestion: 'How do 4 simple 180° servo motors work together to make a 2-legged robot shift its center of gravity and walk?',
    mondayPlan: 'Launch the Robo-Buddy challenge! Inspect an Otto DIY walking robot and play the unplugged "Human Bipedal Balance" game (try lifting your left foot without shifting your hips over your right foot first—you fall!).',
    tuesdayPlan: 'Unbox Version A (BBC micro:bit V2 + INEX PROJECT:BIT) or Version B (Arduino Nano + I/O Shield). Learn the Golden Power Rule: why 4 servos need an external 4xAA (6V) battery pack.',
    wednesdayPlan: 'Write your first servo test script: command a single SG90 servo to move to 0°, 90°, and 180°. Learn why every servo MUST be set to 90° before attaching a servo horn.',
    thursdayPlan: 'Sound & Face Lab: program the 5x5 LED matrix or OLED display to show a Happy face and play a 3-note greeting chirp on the piezo buzzer when powered on.',
    fridayMilestone: 'Friday Milestone 1: Demonstrate 1 centered 90° servo, 1 LED/OLED facial expression, and 1 sound effect; assign the 4 Team Roles.',
    portfolioArtifact: 'Photo of 90° servo test setup + short video of LED face and greeting chirp.'
  },
  {
    week: 2,
    phaseName: 'Phase 1: Explore & Empathize (Weeks 1–2)',
    designThinkingPhaseId: 'empathise',
    title: 'Week 2: Desk Companion Empathy Interviews & Sensor Discovery',
    drivingQuestion: 'What daily struggles do students face at their study desks (waking up late, losing focus, feeling lonely), and how can sensors detect human care?',
    mondayPlan: 'Design a 5-question Student Desk & Study Routine Interview Guide (focusing on morning alarms, Pomodoro study breaks, and what makes a desk pet lovable rather than annoying).',
    tuesdayPlan: 'Conduct Empathy Interviews with at least 4 classmates or family members; record quotes and pain points on an Empathy Map (Says, Thinks, Does, Feels).',
    wednesdayPlan: 'Sensor Discovery Lab I: Wire the HC-SR04 Ultrasonic Distance Sensor ("Eyes") and log live distance readings in centimeters (`2cm–200cm`).',
    thursdayPlan: 'Sensor Discovery Lab II: Wire the TTP223 Capacitive Touch Sensor ("Head Pet") and LDR Light Sensor ("Flashlight Feeding") and trigger instant LED/buzzer feedback.',
    fridayMilestone: 'Friday Milestone 2: Present your User Persona Card and demonstrate live readings from the Ultrasonic, Touch, and Light sensors.',
    portfolioArtifact: 'Completed Empathy Map, User Persona Card, and 3-Sensor Calibration Table.'
  },
  {
    week: 3,
    phaseName: 'Phase 2: Define & Ideate (Weeks 3–4)',
    designThinkingPhaseId: 'define',
    title: 'Week 3: Defining the Problem & Designing the Virtual Pet Brain (Tamagotchi Logic)',
    drivingQuestion: 'How might we translate our user’s study and companionship needs into a deterministic Virtual Pet State Machine?',
    mondayPlan: 'Synthesize Week 2 interview findings into a crisp Problem Statement (`[User] needs a way to [Action] because [Insight]`) and a testable "How Might We" question.',
    tuesdayPlan: 'Introduce the Tamagotchi Virtual Pet Brain: define the 3 core variables (`Hunger` 0–100, `Happiness` 0–100, `Energy` 0–100) and how time and sensor inputs change them.',
    wednesdayPlan: 'Map the 5-State Mood Diagram (`Happy`, `Hungry`, `Sleepy`, `Bored`, `Alarm Ringing`) showing exact transition rules (e.g., IF `Hunger >= 65` -> switch to `Hungry` state and grumble).',
    thursdayPlan: 'Design the Smart Alarm & Study Timer specification: how the alarm triggers, how the robot dances/chirps, and the mandatory physical Dismiss Rule (`3 head touches` OR `hand wave <= 15cm`).',
    fridayMilestone: 'Friday Milestone 3: Peer review of the Team Problem Statement and full-page Tamagotchi 5-Mood State Diagram.',
    portfolioArtifact: 'Signed Problem Statement + Tamagotchi 5-State Flowchart Diagram.'
  },
  {
    week: 4,
    phaseName: 'Phase 2: Define & Ideate (Weeks 3–4)',
    designThinkingPhaseId: 'ideate',
    title: 'Week 4: Character Sketching, Caliper Measurement & 1:1 Cardboard Mockup',
    drivingQuestion: 'How do we design a custom 3D robot character shell that fits all 4 servos, the battery pack, and the expansion shield without pinching a single wire?',
    mondayPlan: 'Crazy 8s Character Concept Sketching: sketch 8 distinct Robo-Buddy personalities (e.g., Sleepy Owl, Cyber Shiba, Astro-Frog, Desk Samurai) and vote on the team’s top concept using a Decision Matrix.',
    tuesdayPlan: 'Precision Caliper Lab: measure the exact millimeter dimensions of the SG90 servos (`22.5 × 11.8 × 22.7mm`), HC-SR04 eyes (`45 × 20mm`, `16mm` cylinders), expansion board, and 4xAA battery box.',
    wednesdayPlan: 'Draw a 1:1 Orthographic Blueprint (Front, Side, Top views) on grid paper with `+1.0mm` printer tolerance and dedicated wire pass-through slots.',
    thursdayPlan: 'Build a 1:1 Cardboard & Foamcore Fit-Check Mockup of the body and head; test-fit the real battery pack, expansion board, and sensors inside.',
    fridayMilestone: 'Friday Milestone 4: Pass the Cardboard Box-Fit Gate Review (all real components fit inside with room for fingers to plug in the USB cable and power switch).',
    portfolioArtifact: 'Orthographic Dimensioned Drawing + Photos of 1:1 Cardboard Fit-Check Mockup.'
  },
  {
    week: 5,
    phaseName: 'Phase 3: Prototype — 3D CAD, Printing, Mechanics & Code (Weeks 5–9)',
    designThinkingPhaseId: 'prototype',
    title: 'Week 5: 3D CAD Modeling of Custom Body, Head, Legs & Feet',
    drivingQuestion: 'How do we model a printable 3D robot chassis with `2.5mm–3.0mm` walls, accurate servo cutouts, and snap/screw mounting bosses?',
    mondayPlan: 'Import or build the base bipedal leg/foot geometry in Tinkercad or Fusion 360; verify hip servo horn axle alignment and foot tilt clearance.',
    tuesdayPlan: 'Model the Lower Body Torso: hollow out the interior leaving `2.5mm–3.0mm` wall thickness, create rectangular cutouts for Left & Right Hip servos, and add leg wire entry holes.',
    wednesdayPlan: 'Model the Custom Character Head: cut `16.5mm` dual eye sockets for the HC-SR04 ultrasonic sensor, a display window for the micro:bit 5x5 matrix / OLED, and a top mount for the TTP223 touch sensor.',
    thursdayPlan: 'Add aesthetic character details (ears, visor, backpack battery bay, name embossing) and run a Digital Interference & Wall-Thickness Audit with the Coach.',
    fridayMilestone: 'Friday Milestone 5: Export validated `.STL` files for Body, Head, Left/Right Legs, and Left/Right Feet.',
    portfolioArtifact: '3D CAD Screenshots (shaded + wireframe) and exported `.STL` file manifest.'
  },
  {
    week: 6,
    phaseName: 'Phase 3: Prototype — 3D CAD, Printing, Mechanics & Code (Weeks 5–9)',
    designThinkingPhaseId: 'prototype',
    title: 'Week 6: 3D Slicing, Print Production, Post-Processing & Breadboard Dry-Run',
    drivingQuestion: 'How do slicer settings (`20%` infill, `3` wall loops, support placement) affect print strength, and how do we test all electronics on the bench before final assembly?',
    mondayPlan: 'Slicer Workshop (Bambu Studio / UltiMaker Cura / PrusaSlicer): orient parts flat to minimize supports, set `0.20mm` layer height, `3` wall loops, and `15%–20%` gyroid/grid infill, and start print queue.',
    tuesdayPlan: 'While 3D printers run, Lead Coder and Lead Builder wire the complete "Flat-Bench Robot" (all 4 servos + ultrasonic + touch + light sensor + buzzer connected on the desk).',
    wednesdayPlan: 'Post-Processing Lab: safely remove 3D print supports using flush cutters, deburr elephant-foot edges, and test-fit SG90 servos and HC-SR04 eyes into the printed sockets.',
    thursdayPlan: 'Dry-Fit Tolerance Audit: measure printed cutouts against CAD dimensions; sand tight joints or re-slice/re-print any bracket that is off by more than `1.0mm`.',
    fridayMilestone: 'Friday Milestone 6: All 6 3D-printed parts cleaned and dry-fitted + Flat-Bench Electronics verified on 4xAA external battery power.',
    portfolioArtifact: 'Slicer preview screenshot + photo of finished 3D-printed parts alongside Flat-Bench wiring.'
  },
  {
    week: 7,
    phaseName: 'Phase 3: Prototype — 3D CAD, Printing, Mechanics & Code (Weeks 5–9)',
    designThinkingPhaseId: 'prototype',
    title: 'Week 7: Mechanical Assembly, 90° Servo Centering & Walking Gait Calibration (Bench Test 1)',
    drivingQuestion: 'Why must servos be centered to 90° before assembly, and how do we program a smooth 4-phase bipedal walking cycle?',
    mondayPlan: 'Mandatory 90° Pre-Centering Lab: upload the 90° Centering Code to set Left Hip, Right Hip, Left Foot, and Right Foot to exactly `90°` BEFORE attaching any servo horns.',
    tuesdayPlan: 'Mechanical Chassis Assembly: press-fit and screw the legs to the hip servos and the feet to the ankle servos; route foot servo cables cleanly up through the leg channels into the torso.',
    wednesdayPlan: 'Software Trim Calibration: write the neutral standing posture array and adjust software trim offsets (`±5°`, e.g., `leftHip = 88°`, `rightFoot = 92°`) until the robot stands perfectly flat and level.',
    thursdayPlan: 'Program the 4-Phase Bipedal Walking Cycle: (1) Tilt Right Foot to shift weight right, (2) Swing Left Hip forward, (3) Level feet & Tilt Left Foot to shift weight left, (4) Swing Right Hip forward.',
    fridayMilestone: 'Friday Milestone 7 — BENCH TEST 1: Robo-Buddy stands level and walks at least 5 steps forward across the desk without tipping over!',
    portfolioArtifact: 'Video of Bench Test 1 (5 steps forward + turn) and recorded 4-Servo Trim Offset Table.'
  },
  {
    week: 8,
    phaseName: 'Phase 3: Prototype — 3D CAD, Printing, Mechanics & Code (Weeks 5–9)',
    designThinkingPhaseId: 'prototype',
    title: 'Week 8: Coding the Virtual Pet Brain & Sensor Care Interactions (Bench Test 2)',
    drivingQuestion: 'How do we combine non-blocking timers, sensor inputs, and servo dance routines so our Robo-Buddy feels alive?',
    mondayPlan: 'Code the Tamagotchi Stat Timers (`Hunger` increases over time; `Happiness` and `Energy` decay over time) and display live mood icons on the 5x5 LED matrix or OLED screen.',
    tuesdayPlan: 'Code the Touch Petting Routine: when the TTP223 head sensor is touched, boost `Happiness +15`, display heart eyes, chirp happily, and perform a 2-servo foot wiggle.',
    wednesdayPlan: 'Code the Flashlight Feeding Routine: when the LDR light sensor detects a bright flashlight beam above threshold, reduce `Hunger -20`, show a chewing animation, and play a munching sound.',
    thursdayPlan: 'Code the Neglected / Hungry / Bored behaviors: when `Hunger >= 65`, tilt feet side-to-side and play a grumpy buzz until fed; when `Energy <= 35`, enter Sleepy mode.',
    fridayMilestone: 'Friday Milestone 8 — BENCH TEST 2: Live demonstration of all Tamagotchi mood transitions triggered by real Touch and Light sensor inputs.',
    portfolioArtifact: 'Bench Test 2 video + code snippet showing non-blocking state machine logic.'
  },
  {
    week: 9,
    phaseName: 'Phase 3: Prototype — 3D CAD, Printing, Mechanics & Code (Weeks 5–9)',
    designThinkingPhaseId: 'prototype',
    title: 'Week 9: Smart Alarm Integration, Enclosure Closure & Prototype V1.0 Lock',
    drivingQuestion: 'How do we integrate the Smart Alarm & Study Timer with physical dismiss rules and close the 3D-printed head and body into a complete Prototype V1.0?',
    mondayPlan: 'Program the Smart Study / Wake-Up Alarm: countdown timer triggers `Alarm Ringing` state—robot flashes alert eyes, plays urgent melody, and dances in place.',
    tuesdayPlan: 'Implement the Interactive Dismiss Rule: alarm only stops when the user pets the head touch sensor 3 times (`dismissHeadTouches >= 3`) OR waves a hand within `15cm` of the ultrasonic eyes (`distanceCm <= 15`).',
    wednesdayPlan: 'Internal Cable Management & Head Closure: mount the 4xAA battery pack, expansion board, and sensors inside the 3D-printed torso and head; verify no wires rub against moving hip servos.',
    thursdayPlan: 'Full System Integration Test (Prototype V1.0): run walking, Tamagotchi care, and Smart Alarm modes back-to-back on battery power.',
    fridayMilestone: 'Friday Milestone 9: Complete Prototype V1.0 Locked and demonstrated on battery power without USB tether.',
    portfolioArtifact: 'Photos of completed Prototype V1.0 (front, side, open-chassis internal wiring) + full system demo clip.'
  },
  {
    week: 10,
    phaseName: 'Phase 4: Test & Iterate (Weeks 10–11)',
    designThinkingPhaseId: 'test',
    title: 'Week 10: The 40-Point Stress-Test Benchmark, Failure Log & V2.0 Hardware Upgrades',
    drivingQuestion: 'How reliable is our Robo-Buddy across 40 structured trials, and what engineering fixes turn failures into a rock-solid Prototype V2.0?',
    mondayPlan: 'Run Part A of the 40-Point Benchmark: **20 Walking Trials** across the desk surface (logging straight-line drift, foot slippage, or balance stumbles).',
    tuesdayPlan: 'Run Part B & C of the 40-Point Benchmark: **10 Smart Alarm Trigger & Dismiss Trials** + **10 Sensor Care (Touch & Flashlight Feeding) Trials**; calculate overall pass rate out of 40.',
    wednesdayPlan: 'Root-Cause Failure Analysis & V2.0 Upgrades: add high-friction rubber pads or textured hot-glue dots to the soles of the feet, zip-tie internal cables, and tune LDR/Ultrasonic thresholds for classroom lighting.',
    thursdayPlan: 'Peer User Testing: swap Robo-Buddies with another team for 30 minutes of "Blind Adoption Testing" (other students interact with your pet using only your draft instructions).',
    fridayMilestone: 'Friday Milestone 10: Completed 40-Trial Benchmark Table (`>= 32/40` target passed) and upgraded **Prototype V2.0** verified.',
    portfolioArtifact: '40-Point Reliability Scorecard, Failure & Fix Log, and Before/After V1.0 vs. V2.0 comparison photos.'
  },
  {
    week: 11,
    phaseName: 'Phase 4: Test & Iterate (Weeks 10–11)',
    designThinkingPhaseId: 'test',
    title: 'Week 11: Quick-Start User Manual, Aesthetic Customization & Portfolio Curation',
    drivingQuestion: 'How do we package our Robo-Buddy with a clear User Manual, expressive character finish, and complete MTC portfolio evidence?',
    mondayPlan: 'Design the 1-Page Illustrated **Quick-Start User Manual & Adoption Certificate** (showing battery switch location, how to pet/feed, mood icon legend, and Smart Alarm dismiss instructions).',
    tuesdayPlan: 'Aesthetic Character Detailing: paint or add vinyl/3D-printed accessories to the shell without adding excessive top-heavy weight that compromises the center of gravity.',
    wednesdayPlan: 'MTC Digital Portfolio Curation: organize all photos, CAD screenshots, wiring diagrams, commented code, and Week 10 test data into the team portfolio.',
    thursdayPlan: 'Build the 6-Slide Showcase Pitch Deck (1. User Problem, 2. Character & CAD Design, 3. 4-Servo Mechanics, 4. Tamagotchi & Smart Alarm Code, 5. 40-Trial Benchmark & V2.0 Fixes, 6. Live Demo).',
    fridayMilestone: 'Friday Milestone 11: Dress Rehearsal Pitch (timed 5-minute presentation + live robot demo in front of peer critics).',
    portfolioArtifact: '1-Page Quick-Start User Manual PDF + Complete 6-Slide Showcase Deck.'
  },
  {
    week: 12,
    phaseName: 'Phase 5: Showcase & Reflect (Week 12)',
    designThinkingPhaseId: 'share',
    title: 'Week 12: The Robo-Buddy Pet Adoption Fair, Live Showcase & MTC Reflection',
    drivingQuestion: 'How do we present our engineering journey to the school community and reflect on our growth across all 7 WeLearn Future Skills?',
    mondayPlan: 'Final Hardware & Battery Check: install fresh AA batteries, verify servo trim angles, and set up the team’s "Pet Adoption Booth" display board.',
    tuesdayPlan: 'Final Pitch Polish & Q&A Prep: practice answering technical judge questions (e.g., "Why did you center servos to 90° first?" and "How does your state machine prevent sensor false positives?").',
    wednesdayPlan: 'HOST THE ROBO-BUDDY PET ADOPTION FAIR & ROBOTICS SHOWCASE! Deliver your 5-minute pitch and let visiting students, teachers, and parents feed, pet, and test your Robo-Buddy.',
    thursdayPlan: 'Post-Showcase Debrief & Individual MTC Competency Self-Assessment across all 7 WeLearn Future Skills.',
    fridayMilestone: 'Friday Milestone 12: Final MTC Digital Portfolio Submission & Celebration Circle!',
    portfolioArtifact: 'Showcase Pitch Video/Photos + Final Signed MTC Competency Reflection.'
  }
];

export const ROBO_BUDDY_PINOUT_GUIDE: RoboBuddyPinoutVersion[] = [
  {
    versionId: 'microbit',
    versionTitle: 'Version A: BBC micro:bit V2 + INEX PROJECT:BIT Expansion Board',
    boardName: 'BBC micro:bit V2 + INEX PROJECT:BIT',
    powerRuleWarning:
      'MANDATORY POWER RULE: Connect a 4xAA (6V) battery holder to the PROJECT:BIT external power terminal and flip the board power switch ON when moving servos. Never run 4 servos from the micro:bit micro-USB cable alone!',
    pins: [
      {
        component: 'Left Hip Servo (SG90 180°)',
        pinAssignment: 'Servo Port S1 (90° = neutral straight forward)',
        wireColorOrNote: 'Brown = GND, Red = +V, Orange = Signal'
      },
      {
        component: 'Right Hip Servo (SG90 180°)',
        pinAssignment: 'Servo Port S2 (90° = neutral straight forward)',
        wireColorOrNote: 'Brown = GND, Red = +V, Orange = Signal'
      },
      {
        component: 'Left Foot Servo (SG90 180°)',
        pinAssignment: 'Servo Port S3 (90° = flat sole on desk)',
        wireColorOrNote: 'Brown = GND, Red = +V, Orange = Signal'
      },
      {
        component: 'Right Foot Servo (SG90 180°)',
        pinAssignment: 'Servo Port S4 (90° = flat sole on desk)',
        wireColorOrNote: 'Brown = GND, Red = +V, Orange = Signal'
      },
      {
        component: 'TTP223 Capacitive Touch Sensor ("Head Pet")',
        pinAssignment: 'Digital Pin P0 (3-pin header: GND, VCC, SIG)',
        wireColorOrNote: 'HIGH (1) when student pets the robot head'
      },
      {
        component: 'LDR Light Sensor ("Flashlight Feeding")',
        pinAssignment: 'Analog Pin P1 (or built-in micro:bit LED light sensor)',
        wireColorOrNote: 'Analog 0–1023; bright flashlight beam triggers feeding'
      },
      {
        component: 'HC-SR04 Ultrasonic Sensor ("Eyes")',
        pinAssignment: 'Trig -> P2, Echo -> P8 (or I2C OLED on P19/P20)',
        wireColorOrNote: 'Detects hand wave <= 15cm to dismiss Smart Alarm'
      },
      {
        component: 'Speaker / Piezo Buzzer ("Voice")',
        pinAssignment: 'Built-in micro:bit V2 Speaker (Music blocks)',
        wireColorOrNote: 'Plays emotional chirps and wake-up alarm melody'
      }
    ]
  },
  {
    versionId: 'arduino-nano',
    versionTitle: 'Version B: Arduino Nano + Nano I/O Expansion Shield (Otto DIY Standard)',
    boardName: 'Arduino Nano ATmega328P + I/O Shield',
    powerRuleWarning:
      'MANDATORY POWER RULE: Plug a 4xAA (6V) battery pack into the Nano I/O Expansion Shield barrel jack / VIN terminal so the 5V regulator feeds the servo V+ rail. Do not drive 4 servos from laptop USB alone!',
    pins: [
      {
        component: 'Left Hip Servo (YL — SG90 180°)',
        pinAssignment: 'Digital Pin D2 (G-V-S 3-pin header)',
        wireColorOrNote: 'Standard Otto DIY Left Leg/Hip pin (center = 90°)'
      },
      {
        component: 'Right Hip Servo (YR — SG90 180°)',
        pinAssignment: 'Digital Pin D3 (G-V-S 3-pin header)',
        wireColorOrNote: 'Standard Otto DIY Right Leg/Hip pin (center = 90°)'
      },
      {
        component: 'Left Foot Servo (RL — SG90 180°)',
        pinAssignment: 'Digital Pin D4 (G-V-S 3-pin header)',
        wireColorOrNote: 'Standard Otto DIY Left Foot/Ankle pin (center = 90°)'
      },
      {
        component: 'Right Foot Servo (RR — SG90 180°)',
        pinAssignment: 'Digital Pin D5 (G-V-S 3-pin header)',
        wireColorOrNote: 'Standard Otto DIY Right Foot/Ankle pin (center = 90°)'
      },
      {
        component: 'TTP223 Capacitive Touch Sensor ("Head Pet")',
        pinAssignment: 'Digital Pin D6',
        wireColorOrNote: 'Reads HIGH when head pad is petted (3x dismisses alarm)'
      },
      {
        component: 'HC-SR04 Ultrasonic Sensor ("Eyes")',
        pinAssignment: 'Trig -> Digital Pin D8, Echo -> Digital Pin D9',
        wireColorOrNote: 'Measures distance in cm; wave <= 15cm dismisses alarm'
      },
      {
        component: 'LDR Photoresistor Light Sensor ("Feeding")',
        pinAssignment: 'Analog Pin A0',
        wireColorOrNote: 'Reads 0–1023; flashlight beam feeds the Virtual Pet'
      },
      {
        component: '0.96" I2C OLED Display ("Face") & Piezo Buzzer ("Voice")',
        pinAssignment: 'OLED: SDA -> A4, SCL -> A5 | Buzzer -> Digital Pin D13',
        wireColorOrNote: 'Renders 5 Tamagotchi mood faces & plays R2-D2 tones'
      }
    ]
  }
];

export const ROBO_BUDDY_MTC_RUBRIC: RoboBuddyMtcRubricRow[] = [
  {
    skillNumber: 1,
    weLearnFutureSkill: 'Critical Thinking & Problem Solving',
    mtcCompetencyCode: 'ctps-05',
    emerging:
      'Copies sample servo code or wiring without diagnosing why the robot tips over, jitters, or resets.',
    foundationalCredit:
      'Centers all 4 servos to 90° before assembly, uses software trim offsets (±5°) to level the feet, and logs 40 structured benchmark tests in Week 10.',
    advancedCredit:
      'Systematically isolates mechanical center-of-gravity issues vs. electrical brownout issues, using data from the 40-test log to engineer a stable Prototype V2.0 (>85% pass rate).',
    portfolioEvidenceRequired:
      'Week 7 Servo Trim Table + Week 10 40-Point Reliability Scorecard & Failure/Fix Log.'
  },
  {
    skillNumber: 2,
    weLearnFutureSkill: 'Creativity & Innovation',
    mtcCompetencyCode: 'ct-02',
    emerging:
      'Uses an unmodified generic box shell and a single static LED icon with no custom personality.',
    foundationalCredit:
      'Models a custom 3D character head/body in CAD with `2.5mm–3.0mm` walls and programs 5 expressive mood states (`Happy`, `Hungry`, `Sleepy`, `Bored`, `Alarm Ringing`) with matching sounds and dances.',
    advancedCredit:
      'Creates a cohesive character identity where physical 3D features, custom choreographed servo dances, OLED/LED animations, and multi-tone audio chirps feel like a living desk creature.',
    portfolioEvidenceRequired:
      'Crazy 8s sketches, CAD orthographic screenshots, and video of all 5 mood expressions.'
  },
  {
    skillNumber: 3,
    weLearnFutureSkill: 'Entrepreneurship & User-Centered Design',
    mtcCompetencyCode: 'ent-04',
    emerging:
      'Builds features without interviewing users or considering whether the alarm/pet is practical on a real student desk.',
    foundationalCredit:
      'Conducts Week 2 student interviews, defines a clear User Persona, and incorporates peer usability feedback from Week 10 into Prototype V2.0 and the Quick-Start User Manual.',
    advancedCredit:
      'Validates that the Robo-Buddy genuinely improves a user’s study/wake-up routine during blind peer testing and pitches a compelling adoption value proposition in Week 12.',
    portfolioEvidenceRequired:
      'Week 2 Empathy Map & Persona Card + Week 10 Peer Tester Feedback Notes.'
  },
  {
    skillNumber: 4,
    weLearnFutureSkill: 'Leadership & Collaboration',
    mtcCompetencyCode: 'lc-03',
    emerging:
      'Works in isolation or waits for teammates to solve integration blockers between CAD, wiring, and code.',
    foundationalCredit:
      'Fulfills assigned team role (Lead Builder, Lead Coder, 3D Designer, or Project Manager), updates the weekly KanBan board, and coordinates hardware-software fit checks.',
    advancedCredit:
      'Proactively facilitates cross-role debugging (e.g., Coder and CAD Designer co-adjusting sensor socket tolerances) and ensures equitable speaking roles at the Pet Adoption Fair.',
    portfolioEvidenceRequired:
      'Weekly KanBan snapshots + peer collaboration reflection.'
  },
  {
    skillNumber: 5,
    weLearnFutureSkill: 'Effective Communication',
    mtcCompetencyCode: 'ec-05',
    emerging:
      'Presents an incomplete manual or reads directly from slides without explaining how the robot works.',
    foundationalCredit:
      'Produces a clear 1-Page Illustrated Quick-Start User Manual and delivers a structured 5-minute Pet Adoption Fair pitch with a live robot demonstration.',
    advancedCredit:
      'Communicates complex mechatronics concepts (center of gravity, state machines, non-blocking timers) clearly to non-technical visitors and answers judge Q&A with evidence.',
    portfolioEvidenceRequired:
      '1-Page Quick-Start User Manual PDF + 6-Slide Showcase Deck & Pitch Video.'
  },
  {
    skillNumber: 6,
    weLearnFutureSkill: 'Social & Emotional Awareness',
    mtcCompetencyCode: 'sea-01',
    emerging:
      'Designs an annoying or stressful alarm without considering user well-being or emotional connection.',
    foundationalCredit:
      'Designs empathetic care interactions (petting to comfort, gentle study break reminders) and reflects honestly on team frustration during hardware debugging.',
    advancedCredit:
      'Translates human emotional cues into supportive robotic behaviors and models calm, encouraging teamwork during high-pressure Week 7 and Week 10 testing.',
    portfolioEvidenceRequired:
      'User Empathy Map + Week 12 Social-Emotional Growth Reflection.'
  },
  {
    skillNumber: 7,
    weLearnFutureSkill: 'Self-Directed Learning',
    mtcCompetencyCode: 'sdl-04',
    emerging:
      'Stops working when a 3D print warps, a wire comes loose, or a code loop freezes.',
    foundationalCredit:
      'Uses caliper measurements, pinout guides, and serial/LED debugging to independently troubleshoot hardware and software bugs across the 12-week build.',
    advancedCredit:
      'Independently researches and implements stretch enhancements (e.g., smooth sinusoidal servo easing, custom OLED eye bitmaps, or Pomodoro study break choreography).',
    portfolioEvidenceRequired:
      'Complete 12-Week MTC Digital Portfolio with documented iterations from V1.0 to V2.0.'
  }
];

export const ROBO_BUDDY_GAMIFICATION_BADGES: RoboBuddyBadge[] = [
  {
    id: 'badge-rb-90deg-whisperer',
    title: '90° Servo Whisperer',
    phase: 'prototype',
    iconName: 'Sliders',
    criteria: 'Electronically center all 4 SG90 servos to 90° BEFORE screwing on servo horns and calibrate posture trim within ±5°.',
    xpReward: 150
  },
  {
    id: 'badge-rb-bipedal-walker',
    title: 'Bench Test 1: Bipedal Walker',
    phase: 'prototype',
    iconName: 'Footprints',
    criteria: 'Pass Week 7 Bench Test 1: Robo-Buddy walks 5 continuous steps forward on external 4xAA battery power without tipping over.',
    xpReward: 200
  },
  {
    id: 'badge-rb-tamagotchi-architect',
    title: 'Tamagotchi State Architect',
    phase: 'define',
    iconName: 'Heart',
    criteria: 'Design and code the 5-Mood State Machine (Happy, Hungry, Sleepy, Bored, Alarm Ringing) driven by Touch and Light sensors.',
    xpReward: 200
  },
  {
    id: 'badge-rb-cad-shellsmith',
    title: 'Precision CAD Shellsmith',
    phase: 'prototype',
    iconName: 'Box',
    criteria: 'Model and 3D-print a custom character head & body with 2.5mm–3.0mm walls, +1.0mm clearance, and clean wire routing channels.',
    xpReward: 200
  },
  {
    id: 'badge-rb-alarm-guardian',
    title: 'Smart Alarm Guardian',
    phase: 'prototype',
    iconName: 'Bell',
    criteria: 'Implement the Week 9 Smart Alarm that dances/chirps and requires 3 Head Touches or an Ultrasonic Hand Wave (<= 15cm) to dismiss.',
    xpReward: 200
  },
  {
    id: 'badge-rb-40test-survivor',
    title: '40-Trial Stress-Test Survivor',
    phase: 'test',
    iconName: 'CheckCircle2',
    criteria: 'Complete all 40 Week 10 reliability trials (20 walk + 10 alarm + 10 sensor care) with >= 80% pass rate and rubber foot grips.',
    xpReward: 250
  },
  {
    id: 'badge-rb-adoption-champion',
    title: 'Pet Adoption Fair Champion',
    phase: 'share',
    iconName: 'Award',
    criteria: 'Deliver your 5-minute live showcase pitch, publish the 1-Page Quick-Start User Manual, and complete the 7-skill MTC portfolio.',
    xpReward: 300
  }
];

export const ROBO_BUDDY_PROGRAM: PblProgram = {
  id: 'robo-buddy-companion-2026',
  title: 'Robo-Buddy Companion: Build, Code & Care for a 3D-Printed Walking Desk Pet',
  subtitle:
    'A 12-week, 120-hour mechatronics, 3D CAD, and embedded coding studio where student teams design, 3D-print, wire, and program a 4-servo bipedal walking desk companion with a Tamagotchi virtual pet brain and interactive Smart Alarm.',
  status: 'provisional_prototype',
  theme: 'Mechatronics, Bipedal Robotics, 3D CAD & Embedded State Machines',
  drivingQuestion:
    'How might we design, 3D-print, wire, and code a 4-servo walking desk companion robot that expresses emotions like a virtual pet, responds to human touch and light care, and helps students manage their study and wake-up routines?',
  realProblem: {
    type: 'both',
    summary:
      'Students studying at home often struggle with screen fatigue, missed study breaks, and passive phone alarms that are too easy to snooze without waking up—while standard robotics kits often feel like cold mechanical exercises rather than lovable companions.',
    peopleImpact:
      'Equips students with an engaging, screen-free physical desk companion that encourages healthy study habits, active wake-up routines, and hands-on mastery of CAD, electronics, and state-machine programming.',
    environmentalImpact:
      'Uses rechargeable 4xAA NiMH cells, modular 3D-printed PLA components designed with 1:1 cardboard fit-checks first to prevent wasted filament, and repairable screw-mounted SG90 servos.'
  },
  targetAgeRange: 'Ages 11–17 (Lower & Upper Secondary: Version A micro:bit V2 or Version B Arduino Nano)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'Version A: BBC micro:bit V2 + INEX PROJECT:BIT Expansion Board',
      'Version B: Arduino Nano ATmega328P + Nano I/O Expansion Shield',
      '4xAA (6V) External Battery Holder with ON/OFF switch (mandatory for 4-servo power)'
    ],
    sensorsAndActuators: [
      '4x SG90 180° Positional Micro Servos (Left Hip, Right Hip, Left Foot, Right Foot — NOT 360° continuous!)',
      'HC-SR04 Ultrasonic Distance Sensor ("Eyes" — hand-wave detection <= 15cm)',
      'TTP223 Capacitive Touch Sensor Module ("Head Pet" input)',
      'LDR Photoresistor Light Sensor Module ("Flashlight Feeding" input)',
      'Piezo Buzzer / Built-in Speaker ("Voice" chirps & Smart Alarm) + 0.96" I2C OLED or 5x5 LED Matrix'
    ],
    fabricationMaterials: [
      'PLA 3D Printer Filament (1.75mm) for custom Head, Body, Left/Right Legs, and Left/Right Feet',
      'Digital calipers, cardboard/foamcore for Week 4 1:1 fit-check mockups, and small Phillips screwdriver',
      'Self-adhesive rubber grip pads or hot-glue traction dots (for Week 10 foot sole upgrade) and mini zip-ties'
    ],
    softwareAndTools: [
      'Tinkercad or Autodesk Fusion 360 (3D CAD) + Bambu Studio / Cura / PrusaSlicer',
      'MakeCode / MicroPython (Version A micro:bit) or Arduino IDE C/C++ with Servo/OttoDIY libraries (Version B)',
      'WeLearn PBL Studio Robo-Buddy Gait, Tamagotchi & Smart Alarm Simulator'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'External 4xAA Battery Rule: NEVER power 4 SG90 walking servos from a computer USB port alone. Current spikes will brown out the microcontroller or trip the laptop USB fuse. Always use the 4xAA (6V) external battery pack connected to the expansion shield.',
      '180° Positional Servo Check: Verify before Week 1 and Week 7 that all SG90 servos are 180° positional servos (not 360° continuous rotation servos).',
      'Mandatory 90° Pre-Centering: Students must run the 90° centering script BEFORE screwing plastic horns onto the servo splines so the robot does not jam or strip gears on first power-up.',
      '3D Printer & Tool Safety: Allow print beds to cool before part removal; wear eye protection when clipping plastic support material with flush cutters.'
    ],
    pedagogicalScaffolding: [
      'Cardboard Before Plastic (Week 4): Require every team to pass a 1:1 cardboard fit-check with their real battery pack and expansion board before queuing any 3D print in Week 5–6.',
      'Two Structured Bench Gates: Enforce Bench Test 1 in Week 7 (5 steps forward without tipping) before adding complex Tamagotchi timers in Week 8 (Bench Test 2).',
      'Dual Hardware Track Flexibility: Lower Secondary or ESL-developing teams can use Version A (BBC micro:bit + MakeCode blocks), while Upper Secondary or coding-experienced teams can use Version B (Arduino Nano C/C++).'
    ],
    aiEthicsRules: [
      'Students may use the AI Co-Pilot to debug state-machine transitions or servo trim arrays, but must log what they asked, what code was suggested, and how they verified it on physical hardware.',
      'Child Safeguarding & Privacy: Under-13 learners never use voice recording or speech-to-text; any showcase photos or videos of older learners require prior school consent and are never stored on external AI servers.'
    ],
    differentiationNotes: [
      'Foundational Track (Version A — micro:bit V2): Uses MakeCode blocks, built-in 5x5 LED faces, and 4-step array gait control on Ports S1–S4.',
      'Advanced Track (Version B — Arduino Nano): Uses C/C++ non-blocking `millis()` timers, I2C OLED animated bitmaps, sinusoidal servo easing, and custom melodies.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-rb-bench1-gait',
      metric: 'Week 7 Bench Test 1: 90° Pre-Centering & 5-Step Bipedal Walk',
      target: 'All 4 servos centered to 90° (±5° trim) and robot walks >= 5 continuous steps without tipping over',
      verificationMethod: 'Coach sign-off on Week 7 Servo Trim Table and live desk walk test'
    },
    {
      id: 'metric-rb-bench2-tamagotchi',
      metric: 'Week 8 & 9 Bench Test 2: 5-Mood Tamagotchi Brain & Smart Alarm Dismiss Rule',
      target: 'All 5 moods (Happy, Hungry, Sleepy, Bored, Alarm Ringing) transition accurately via Touch, Light, and Ultrasonic (<= 15cm) sensors',
      verificationMethod: 'Live demonstration of petting, flashlight feeding, and 3-touch / 15cm wave alarm dismissal'
    },
    {
      id: 'metric-rb-40test-benchmark',
      metric: 'Week 10 40-Point Reliability Benchmark (Prototype V2.0)',
      target: '>= 32 / 40 trials passed (>= 80% reliability across 20 walking + 10 alarm + 10 sensor care trials)',
      verificationMethod: 'Completed Week 10 40-Trial Scorecard and V2.0 hardware upgrade inspection'
    }
  ],
  assumptions: [
    {
      id: 'asmp-rb-hardware-track',
      domain: 'Hardware Track Selection (Version A vs. Version B)',
      assumption:
        'Classrooms may run either Version A (BBC micro:bit V2 + INEX PROJECT:BIT) or Version B (Arduino Nano + I/O Expansion Shield) depending on grade level and inventory.',
      ownerVerificationNeeded:
        'Confirm with lab manager how many teams will run Version A (micro:bit) vs. Version B (Arduino Nano) this term.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    },
    {
      id: 'asmp-rb-180-servos',
      domain: 'SG90 180° Positional Servos & 4xAA Battery Packs',
      assumption:
        'Each 4-student team has 4x SG90 180° positional micro-servos (with screws and horns) and a 4xAA (6V) battery pack.',
      ownerVerificationNeeded:
        'Verify lab stock contains 180° positional SG90 servos (and not 360° continuous rotation servos).',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    }
  ],
  phases: [
    {
      id: 'explore',
      title: '1. Explore — Week 1: Bipedal Balance & First 90° Servo Calibration',
      strap: 'PHASE 1: EXPLORE (Week 1) • Bipedal Center of Gravity, 4xAA Power Safety & First 90° Servo Test',
      weeks: [1, 1],
      goal:
        'Unpack bipedal center-of-gravity mechanics, compare Version A (micro:bit) vs. Version B (Arduino Nano), learn the external 4xAA battery rule, center a single SG90 servo to 90°, and program a greeting face and chirp.',
      tasks: [
        'Play the unplugged Human Bipedal Balance game and sketch how shifting hip weight over the standing foot enables a 2-legged step.',
        'Unbox Version A (BBC micro:bit V2 + INEX PROJECT:BIT) or Version B (Arduino Nano + I/O Shield) and assign the 4 Team Roles.',
        'Command a single SG90 180° servo to 0°, 90°, and 180° on external 4xAA battery power and program a Happy face + greeting chirp.'
      ],
      evidence: [
        'Team Role Charter & Center-of-Gravity Balance Sketch',
        'Week 1 90° Servo Centering Photo & Greeting Face/Chirp Code'
      ],
      aiPromptStarters: [
        'Explain in simple terms why a 2-legged robot must tilt its ankle to shift its center of gravity before lifting its other foot.',
        'Why does powering 4 SG90 servo motors from a laptop USB port cause a microcontroller brownout, and how does a 4xAA (6V) battery pack solve this?'
      ],
      competencies: ['ctps-05', 'sdl-03', 'lc-03'],
      stretchCompetencies: ['ct-02'],
      sessions: [
        {
          sessionNumber: 1,
          week: 1,
          title: 'Bipedal Balance Mechanics, Hardware Unbox & The External Battery Rule',
          durationMin: 300,
          learningGoal:
            'Explain why a 2-legged walker must tilt its ankle to shift its center of gravity over the standing foot and why 4 servos require an external 4xAA (6V) battery pack.',
          activities: [
            'Play the unplugged Human Bipedal Balance game and sketch where the center of mass moves during a step.',
            'Unbox the team hardware kit, verify all 4 servos are 180° positional SG90s, and assign the 4 Team Roles (Lead Builder, Lead Coder, 3D Designer, Project Manager).',
            'Wire the 4xAA battery pack to the expansion shield and verify safe power switching.'
          ],
          learnerChoices: {
            question: 'Which microcontroller hardware track will your team use for your Robo-Buddy?',
            options: [
              { id: 'ver-a-microbit', label: 'Version A: BBC micro:bit V2 + PROJECT:BIT', description: 'MakeCode blocks or MicroPython with built-in 5x5 LED matrix and speaker.' },
              { id: 'ver-b-nano', label: 'Version B: Arduino Nano + I/O Shield', description: 'Arduino C/C++ with Otto DIY servo library, I2C OLED display, and D13 buzzer.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Upload your Center-of-Gravity sketch and explain why 4 servos cannot be powered by computer USB alone.',
            targetCompetencies: ['ctps-05', 'lc-03']
          },
          reflectionPrompt: 'What happened when you tried to lift one foot while standing with your other shoulder and foot pressed flat against a wall?',
          teacherTips: 'Check every team’s SG90 bag to confirm 180° positional servos (not 360° continuous rotation) and verify external battery polarity.'
        },
        {
          sessionNumber: 2,
          week: 1,
          title: 'First 90° Servo Calibration, LED/OLED Face & Buzzer Greeting',
          durationMin: 300,
          learningGoal:
            'Command an SG90 servo to 0°, 90°, and 180°, explain why 90° pre-centering is required before attaching horns, and display a greeting face with sound.',
          activities: [
            'Write and flash the 90° Servo Centering script on Port S1 / Pin D2 and attach a temporary horn marker.',
            'Program a Happy face (`^_^`) on the 5x5 LED matrix or OLED display and a 3-note R2-D2 greeting chirp on startup.',
            'Friday Milestone 1: Demonstrate 1 centered 90° servo, 1 facial expression, and 1 sound effect.'
          ],
          learnerChoices: {
            question: 'What personality greeting will your Robo-Buddy perform on startup?',
            options: [
              { id: 'cheerful-chirp', label: 'Cheerful R2-D2 Rising Arpeggio', description: 'Bright 3-note ascending melody with blinking happy eyes.' },
              { id: 'sleepy-yawn', label: 'Sleepy Wake-Up Stretch', description: 'Slow wake-up tone transitioning from closed eyes (-_-) to wide eyes (^_^).' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Log your Week 1 servo centering and greeting code along with a photo of your 90° test setup.',
            targetCompetencies: ['sdl-03', 'ct-02']
          },
          reflectionPrompt: 'Why would screwing a leg onto a servo at 0° when the code expects 90° cause the robot chassis to jam?',
          teacherTips: 'Demonstrate with a spare servo how attaching a horn before centering to 90° causes mechanical binding.'
        }
      ]
    },
    {
      id: 'empathise',
      title: '2. Empathise — Week 2: Desk Companion Interviews & 3-Sensor Discovery',
      strap: 'PHASE 1: EMPATHIZE (Week 2) • Student Study Routine Interviews, Persona Card & Ultrasonic/Touch/Light Lab',
      weeks: [2, 2],
      goal:
        'Interview classmates/family about study routines and wake-up alarms, build an Empathy Map & User Persona, and test the Ultrasonic, Capacitive Touch, and LDR Light sensors.',
      tasks: [
        'Interview at least 4 students or family members about morning wake-up struggles, study distractions, and desk companions.',
        'Synthesize quotes into a 4-quadrant Empathy Map and a concrete User Persona Card.',
        'Wire and calibrate the HC-SR04 Ultrasonic Sensor ("Eyes"), TTP223 Touch Sensor ("Head Pet"), and LDR Light Sensor ("Flashlight Feeding").'
      ],
      evidence: [
        'Completed Empathy Map & Target User Persona Card',
        '3-Sensor Calibration Table (Ambient vs. Triggered Readings)'
      ],
      aiPromptStarters: [
        'Help our team write 5 open-ended interview questions to discover why students snooze their morning alarms or lose focus at their study desks.',
        'How do we choose a reliable threshold value for an LDR light sensor so classroom ceiling lights do not accidentally trigger "feeding" mode?'
      ],
      competencies: ['sea-01', 'ent-04', 'ctps-05'],
      stretchCompetencies: ['ec-05'],
      sessions: [
        {
          sessionNumber: 3,
          week: 2,
          title: 'Student Desk Habit Interviews, Empathy Map & User Persona',
          durationMin: 300,
          learningGoal:
            'Conduct structured empathy interviews about morning wake-up struggles, study focus, and desk companions and synthesize findings into a User Persona.',
          activities: [
            'Design a 5-question interview guide and interview at least 4 peers or family members.',
            'Complete the 4-quadrant Empathy Map (Says, Thinks, Does, Feels) and create your target User Persona Card.'
          ],
          learnerChoices: {
            question: 'Which primary user struggle will your Robo-Buddy focus on solving?',
            options: [
              { id: 'heavy-sleeper', label: 'The Serial Alarm Snoozer', description: 'Needs an active dancing alarm that requires 3 head pets or a close hand wave to stop.' },
              { id: 'pomodoro-studier', label: 'The Tired Solo Studier', description: 'Needs a friendly desk companion that reminds them to take study breaks and rewards care.' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Record 3 direct quotes from your interviews and summarize your target User Persona.',
            targetCompetencies: ['sea-01', 'ent-04']
          },
          reflectionPrompt: 'What surprised you most about why your interviewees ignore phone alarms or study timers?',
          teacherTips: 'Coach students to ask "Tell me about the last time you..." rather than yes/no questions.'
        },
        {
          sessionNumber: 4,
          week: 2,
          title: '3-Sensor Discovery Lab: Ultrasonic Eyes, Touch Petting & Flashlight Feeding',
          durationMin: 300,
          learningGoal:
            'Wire and read live values from the HC-SR04 Ultrasonic Sensor (`cm`), TTP223 Touch Sensor (`0/1`), and LDR Light Sensor (`0–1023`).',
          activities: [
            'Connect all 3 sensors to the expansion board and record baseline vs. triggered readings in a Calibration Table.',
            'Write a quick test rule: Touch -> Happy beep; Flashlight -> Eating animation; Hand wave `<= 15cm` -> Surprise eyes.',
            'Friday Milestone 2: Present User Persona Card and live readings from all 3 sensors.'
          ],
          learnerChoices: {
            question: 'How will your user "feed" and "comfort" your Robo-Buddy?',
            options: [
              { id: 'light-and-touch', label: 'Flashlight Snack + Head Petting', description: 'Shining a phone flashlight into the LDR sensor feeds the pet; touching the head boosts happiness.' },
              { id: 'wave-and-touch', label: 'Ultrasonic High-Five + Head Petting', description: 'Holding a hand within 10cm gives a high-five; petting the head calms the pet.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your 3-Sensor Calibration Table (ambient vs. triggered readings for Ultrasonic, Touch, and Light).',
            targetCompetencies: ['ctps-05', 'sdl-03']
          },
          reflectionPrompt: 'Why is it important to measure ambient classroom light before picking a fixed number for your flashlight threshold?',
          teacherTips: 'Have teams log both sunny-window and shaded-desk light readings in their Calibration Table.'
        }
      ]
    },
    {
      id: 'define',
      title: '3. Define — Weeks 3–4: Tamagotchi State Machine & 1:1 Cardboard Mockup',
      strap: 'PHASE 2: DEFINE & IDEATE (Weeks 3–4) • 5-Mood Tamagotchi Flowchart, Caliper Measurements & Cardboard Box-Fit',
      weeks: [3, 4],
      goal:
        'Define the User Problem Statement, architect the 5-Mood Tamagotchi Virtual Pet State Machine (`Happy`, `Hungry`, `Sleepy`, `Bored`, `Alarm Ringing`) and Smart Alarm rules, measure components with calipers, and build a 1:1 cardboard fit-check mockup.',
      tasks: [
        'Write the team Problem Statement and define the 3 Tamagotchi variables (`Hunger`, `Happiness`, `Energy`).',
        'Draw the 5-Mood State Machine Flowchart (`Happy`, `Hungry`, `Sleepy`, `Bored`, `Alarm Ringing`) and Smart Alarm Dismiss Rule (`3 Head Touches` or `Wave <= 15cm`).',
        'Sketch 8 character concepts (Crazy 8s), measure components with digital calipers (`+1.0mm` tolerance), and build a 1:1 cardboard fit-check mockup.'
      ],
      evidence: [
        'Signed Problem Statement & 5-Mood Tamagotchi State Machine Flowchart',
        'Caliper Measurement Sheet, Orthographic Blueprint & 1:1 Cardboard Box-Fit Photos'
      ],
      aiPromptStarters: [
        'Check our 5-Mood Tamagotchi State Machine (`Happy`, `Hungry`, `Sleepy`, `Bored`, `Alarm Ringing`) for any missing transitions or dead-end states.',
        'We measured our SG90 servo at 22.5mm x 11.8mm. How much extra clearance should we add in Tinkercad so the 3D-printed PLA hole is neither too tight nor too loose?'
      ],
      competencies: ['ctps-05', 'ct-02', 'ent-04'],
      stretchCompetencies: ['sdl-04'],
      sessions: [
        {
          sessionNumber: 5,
          week: 3,
          title: 'Problem Statement & Tamagotchi Virtual Pet Variables (Hunger, Happiness, Energy)',
          durationMin: 300,
          learningGoal:
            'Write a clear Problem Statement and define the 3 Tamagotchi numerical state variables (`Hunger`, `Happiness`, `Energy`) and their decay/care rates.',
          activities: [
            'Synthesize Week 2 interview data into a `[User] needs a way to [Action] because [Insight]` Problem Statement.',
            'Create a variable specification table showing how `Hunger` (0–100), `Happiness` (0–100), and `Energy` (0–100) change over time and when cared for.'
          ],
          learnerChoices: {
            question: 'How fast should your Virtual Pet stats change during classroom demo mode vs. normal desk mode?',
            options: [
              { id: 'fast-demo-mode', label: 'Dual-Speed Timer (10s Demo / 30m Desk)', description: 'Includes a button toggle to speed up stat decay during 5-minute classroom demonstrations.' },
              { id: 'event-driven-mode', label: 'Accelerated Studio Timer (60s Tick)', description: 'Updates Hunger and Happiness every 60 seconds for continuous classroom interaction.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your Problem Statement and the exact math rules for Hunger, Happiness, and Energy.',
            targetCompetencies: ['ent-04', 'ctps-05']
          },
          reflectionPrompt: 'How does having a Demo Speed toggle help you test and showcase a virtual pet without waiting 4 hours for it to get hungry?',
          teacherTips: 'Encourage every team to code a "Fast Demo Mode" constant so they can demonstrate all 5 moods in under 2 minutes.'
        },
        {
          sessionNumber: 6,
          week: 3,
          title: '5-Mood State Machine Flowchart & Smart Alarm Dismiss Logic',
          durationMin: 300,
          learningGoal:
            'Draw a complete 5-State Mood Diagram (`Happy`, `Hungry`, `Sleepy`, `Bored`, `Alarm Ringing`) and specify the Smart Alarm Dismiss Rule.',
          activities: [
            'Draw the 5-Mood State Diagram showing every arrow, sensor trigger, LED face, sound, and servo motion.',
            'Specify the Smart Alarm Dismiss Rule (`dismissHeadTouches >= 3` OR `ultrasonicCm <= 15`).',
            'Friday Milestone 3: Peer review of Problem Statement and 5-Mood State Diagram.'
          ],
          learnerChoices: {
            question: 'What physical interaction will your Smart Alarm require before it stops ringing?',
            options: [
              { id: 'dual-dismiss', label: '3 Head Touches OR Hand Wave <= 15cm', description: 'Requires deliberate repeated petting (3x) or a close hand wave in front of the ultrasonic eyes.' },
              { id: 'combo-dismiss', label: '3 Head Touches AND Flashlight Beam', description: 'Requires turning on the room/phone light AND petting the robot 3 times to prove you are awake.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a clear photo or diagram of your 5-Mood Tamagotchi State Machine and Smart Alarm rules.',
            targetCompetencies: ['ctps-05', 'ct-02']
          },
          reflectionPrompt: 'What happens if two conditions are true at the same time (e.g., the alarm is ringing AND Hunger is over 70)? Which state should win?',
          teacherTips: 'Verify every state diagram clearly prioritizes `Alarm Ringing` at the top of the `if / else if` chain.'
        },
        {
          sessionNumber: 7,
          week: 4,
          title: 'Crazy 8s Character Ideation & Digital Caliper Component Measurement',
          durationMin: 300,
          learningGoal:
            'Generate 8 robot character concepts and measure servos, ultrasonic eyes, expansion shield, and 4xAA battery pack to `0.1mm` accuracy using digital calipers.',
          activities: [
            'Complete the Crazy 8s character sketching sprint and score the top 3 designs on Printability, Center-of-Gravity Balance, and Character Appeal.',
            'Measure the SG90 servos (`22.5 × 11.8 × 22.7mm`), HC-SR04 eyes (`45 × 20mm`, `16mm` cylinders), expansion board, and 4xAA battery box with digital calipers.'
          ],
          learnerChoices: {
            question: 'Which character silhouette will your team model for your 3D-printed Robo-Buddy?',
            options: [
              { id: 'cyber-pet', label: 'Cyber Pet (Ears & Visor)', description: 'Compact low-center-of-gravity head with cat/shiba ears and front LED/OLED visor.' },
              { id: 'astro-bot', label: 'Astro-Bot (Rounded Helmet & Backpack)', description: 'Rounded helmet housing ultrasonic eyes with a balanced torso battery bay.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Record your caliper measurements (in mm) for the SG90 servo, HC-SR04 eyes, expansion board, and battery pack.',
            targetCompetencies: ['ct-02', 'ctps-05']
          },
          reflectionPrompt: 'Why must we add `+0.5mm` to `+1.0mm` of clearance tolerance to our caliper measurements when modeling holes in 3D CAD?',
          teacherTips: 'Remind designers that melted PLA expands slightly during printing, so a zero-clearance hole will be too tight.'
        },
        {
          sessionNumber: 8,
          week: 4,
          title: 'Orthographic Blueprint & 1:1 Cardboard Box-Fit Mockup',
          durationMin: 300,
          learningGoal:
            'Draw a 1:1 scale Front, Side, and Top orthographic blueprint and construct a 1:1 cardboard mockup to verify component fit.',
          activities: [
            'Draft the 1:1 orthographic views on millimeter grid paper with `2.5mm–3.0mm` wall thickness.',
            'Cut and tape the 1:1 cardboard torso and head mockup; test-fit the real 4xAA battery pack, expansion shield, and servos inside.',
            'Friday Milestone 4: Pass the Cardboard Box-Fit Gate Review.'
          ],
          learnerChoices: {
            question: 'How will your 3D-printed head attach to the lower body torso so batteries remain easy to swap?',
            options: [
              { id: 'sliding-lip', label: 'Friction Lip + Side Screw Tabs', description: 'Recessed inner lip that aligns the head and secures with two M2/M3 side screws.' },
              { id: 'hinged-hood', label: 'Snap-Fit Top Lid', description: 'Body houses servos and battery; top character shell lifts off for instant battery access.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your 1:1 cardboard mockup holding the real battery pack and expansion board.',
            targetCompetencies: ['ct-02', 'sdl-04']
          },
          reflectionPrompt: 'What clearance or wire-routing issue did you discover in your cardboard mockup that saved you from a failed 6-hour 3D print?',
          teacherTips: 'Do not approve 3D printing in Week 5 until the real battery pack and USB plug fit inside the Week 4 cardboard mockup.'
        }
      ]
    },
    {
      id: 'ideate',
      title: '4. Ideate — Weeks 5–6: 3D CAD Shell Modeling, Slicing & Flat-Bench Dry Run',
      strap: 'PHASE 3: PROTOTYPE PREP (Weeks 5–6) • Tinkercad/Fusion 360 CAD (`2.5–3.0mm` Walls), Slicing & Bench Wiring',
      weeks: [5, 6],
      goal:
        'Model the custom 3D head, body, legs, and feet in Tinkercad/Fusion 360 (`2.5mm–3.0mm` wall thickness), slice with `20%` infill and `3` wall loops, 3D-print and post-process all parts, and run a complete flat-bench electronics dry run.',
      tasks: [
        'Model the bipedal legs, wide flat feet, lower torso (`2.5mm–3.0mm` walls), and custom character head in Tinkercad or Fusion 360.',
        'Slice all 6 `.STL` parts (`0.20mm` layer height, `3` wall loops, `15%–20%` infill), 3D-print, and clean support material.',
        'Wire and test all 4 servos, 3 sensors, and buzzer on the flat bench using the 4xAA external battery pack.'
      ],
      evidence: [
        'Orthographic 3D CAD Screenshots & Exported `.STL` File Manifest',
        'Slicer Preview Screenshot, Cleaned 3D-Printed Parts Photo & Flat-Bench Wiring Log'
      ],
      aiPromptStarters: [
        'Review our 3D CAD checklist for an Otto-style bipedal robot: what cutouts and wire pass-through holes are most commonly forgotten?',
        'Why do 3 wall loops (perimeters) add more strength to 3D-printed servo mounting brackets than simply increasing infill from 20% to 50%?'
      ],
      competencies: ['ct-02', 'ctps-05', 'sdl-03'],
      stretchCompetencies: ['lc-03'],
      sessions: [
        {
          sessionNumber: 9,
          week: 5,
          title: '3D CAD Studio I: Bipedal Legs, Feet & Lower Torso Servo Mounts',
          durationMin: 300,
          learningGoal:
            'Model or customize the bipedal legs, wide flat feet, and lower body shell with `2.5mm–3.0mm` wall thickness and accurate servo cutouts.',
          activities: [
            'Model the Left/Right Legs and Left/Right Feet in Tinkercad or Fusion 360, ensuring flat soles and ankle horn clearances.',
            'Hollow the lower body shell to `2.5mm–3.0mm` walls and cut the two hip servo bays + `8mm` leg wire pass-through holes.'
          ],
          learnerChoices: {
            question: 'Which CAD modeling environment will your 3D Designer use?',
            options: [
              { id: 'tinkercad', label: 'Tinkercad (Boolean Solid & Hole Grouping)', description: 'Fast, visual block-based CSG modeling ideal for remixing Otto bipedal shells.' },
              { id: 'fusion360', label: 'Autodesk Fusion 360 (Parametric Sketches)', description: 'Parametric timeline modeling with exact millimeter constraints and fillets.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload orthographic screenshots of your CAD legs, feet, and lower torso showing wall thickness and servo cutouts.',
            targetCompetencies: ['ct-02', 'ctps-05']
          },
          reflectionPrompt: 'How did you ensure the foot servo cables can pass smoothly from the ankles up into the body without catching on the leg joints?',
          teacherTips: 'Verify every torso model has bottom wire pass-through slots at least `8mm` wide so the 3-pin DuPont servo connector can fit through.'
        },
        {
          sessionNumber: 10,
          week: 5,
          title: '3D CAD Studio II: Custom Character Head, Sensor Sockets & STL Export',
          durationMin: 300,
          learningGoal:
            'Model the custom character head with `16.5mm` ultrasonic eye cutouts, LED/OLED face window, and top touch-sensor pad, and export validated `.STL` files.',
          activities: [
            'Complete the custom 3D head shell with ultrasonic eyes, display window, touch sensor slot, and character ears/visor.',
            'Run the Coach CAD Pre-Flight Checklist and export `.STL` files for Head, Body, 2 Legs, and 2 Feet.',
            'Friday Milestone 5: Validated `.STL` Package Ready for 3D Printing.'
          ],
          learnerChoices: {
            question: 'How will your Robo-Buddy display its 5 Tamagotchi facial expressions through the 3D-printed head?',
            options: [
              { id: 'microbit-window', label: 'Front Cutout Window for micro:bit 5x5 LED Matrix', description: 'Frames the micro:bit V2 board at the front of the head so the 5x5 LEDs and touch logo are accessible.' },
              { id: 'oled-bezel', label: 'Recessed Bezel for 0.96" I2C OLED Mouth/Face', description: 'Mounts the 4-pin I2C OLED display below the HC-SR04 ultrasonic eyes.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit screenshots of your final 6 CAD components and confirm wall thickness (`2.5mm–3.0mm`).',
            targetCompetencies: ['ct-02', 'sdl-03']
          },
          reflectionPrompt: 'How did you keep your character head lightweight and centered over the hips so the robot does not become top-heavy?',
          teacherTips: 'Check that the head can be opened easily so AA batteries can be replaced in under 60 seconds.'
        },
        {
          sessionNumber: 11,
          week: 6,
          title: '3D Slicing (`20%` Infill, `3` Wall Loops) & Flat-Bench Electronics Integration',
          durationMin: 300,
          learningGoal:
            'Configure 3D slicer parameters (`0.20mm` layer height, `3` wall loops, `15%–20%` infill) and wire all 4 servos, 3 sensors, and buzzer on the flat bench.',
          activities: [
            'Slice the team’s `.STL` files, record estimated print time and filament grams, and start the 3D print job.',
            'Assemble the complete "Flat-Bench Robot" wiring harness on the desk and label each servo plug (`LH`, `RH`, `LF`, `RF`) with masking tape.'
          ],
          learnerChoices: {
            question: 'How will you orient your robot head and torso on the 3D printer build plate?',
            options: [
              { id: 'flat-opening-down', label: 'Flat Opening Facing Print Bed', description: 'Minimizes internal support material inside the electronics cavity.' },
              { id: 'base-down-tree-supports', label: 'Base Down with Tree Supports on Eye Socket Overhangs', description: 'Keeps bottom servo mounts ultra-flat while supporting the 16.5mm eye sockets.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Record your slicer settings (layer height, wall loops, infill %, print time, grams of PLA) and upload a photo of your labeled flat-bench wiring.',
            targetCompetencies: ['sdl-03', 'lc-03']
          },
          reflectionPrompt: 'Why is labeling all 4 servo plugs (`LH`, `RH`, `LF`, `RF`) before threading them through the legs essential for debugging?',
          teacherTips: 'Have teams test all 4 servos on the flat bench before mounting them into the 3D-printed plastic.'
        },
        {
          sessionNumber: 12,
          week: 6,
          title: '3D Print Post-Processing & Mechanical Dry-Fit Tolerance Audit',
          durationMin: 300,
          learningGoal:
            'Safely remove support structures and dry-fit servos and sensors into the 3D-printed chassis.',
          activities: [
            'Remove supports with flush cutters, deburr edges, and test-fit the 4 SG90 servos, HC-SR04 eyes, and expansion board into the printed parts.',
            'Verify the head snaps or screws cleanly onto the torso without pinching wires.',
            'Friday Milestone 6: Cleaned 3D-Printed Chassis + Dry-Fit Tolerance Sign-Off.'
          ],
          learnerChoices: {
            question: 'If a 3D-printed servo slot is 0.4mm too tight during dry-fitting, how will your team fix it?',
            options: [
              { id: 'needle-file', label: 'Precision Needle File & Caliper Re-Check', description: 'Carefully file the inner PLA edges by 0.2mm per side without cracking the wall.' },
              { id: 'cad-reprint', label: 'Adjust CAD Tolerance & Re-Print Bracket', description: 'Update the parametric cutout dimension in CAD and re-print the affected sub-part.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a photo of all cleaned 3D-printed parts dry-fitted with servos and sensors.',
            targetCompetencies: ['ctps-05', 'sdl-03']
          },
          reflectionPrompt: 'How closely did your physical 3D print match your caliper measurements from Week 4?',
          teacherTips: 'Remind students to wear safety glasses when clipping PLA support material with flush cutters.'
        }
      ]
    },
    {
      id: 'prototype',
      title: '5. Prototype — Weeks 7–9: 90° Assembly, Walking Gait, Tamagotchi Code & Smart Alarm',
      strap: 'PHASE 3: PROTOTYPE BUILD (Weeks 7–9) • Bench Test 1 (5-Step Walk), Bench Test 2 (Tamagotchi) & Prototype V1.0 Lock',
      weeks: [7, 9],
      goal:
        'Center all 4 servos to 90° before mechanical assembly, calibrate software posture trim (`±5°`), pass **Bench Test 1** (5-step walk), code the Tamagotchi Virtual Pet Brain (**Bench Test 2**), integrate the Smart Alarm & Dismiss Rule, and lock **Prototype V1.0**.',
      tasks: [
        'Week 7: Electronically center all 4 servos to 90° before tightening horn screws, calibrate `±5°` posture trim, and pass **Bench Test 1** (5 walking steps forward without tipping).',
        'Week 8: Code the 5-Mood Tamagotchi Virtual Pet Brain (`Hunger`, `Happiness`, `Energy`) with Touch Petting and Flashlight Feeding to pass **Bench Test 2**.',
        'Week 9: Integrate the Smart Alarm & physical Dismiss Rule (`3 Head Touches` or `Ultrasonic Wave <= 15cm`), close the 3D shell, and lock **Prototype V1.0**.'
      ],
      evidence: [
        'Bench Test 1 Video (5 Steps Forward) & 4-Servo Trim Offset Table',
        'Bench Test 2 Video (Tamagotchi Mood Transitions) & Commented State-Machine Code',
        'Completed Untethered Prototype V1.0 Photos & Smart Alarm Dismiss Log'
      ],
      aiPromptStarters: [
        'Our Robo-Buddy leans slightly to the left when standing at 90°. How do we use software trim offsets (`leftFootTrim`, `rightFootTrim`) so its feet sit flat on the desk?',
        'Show us how to write a non-blocking timer loop so our robot can check the Touch and Ultrasonic sensors continuously while waiting for the next Tamagotchi hunger tick.'
      ],
      competencies: ['ctps-05', 'ct-02', 'sdl-04', 'lc-03'],
      stretchCompetencies: ['ent-04'],
      sessions: [
        {
          sessionNumber: 13,
          week: 7,
          title: 'Mandatory 90° Servo Pre-Centering & Bipedal Chassis Assembly',
          durationMin: 300,
          learningGoal:
            'Electronically command all 4 SG90 servos to 90° prior to fastening servo horns and assemble the hips, legs, ankles, and feet.',
          activities: [
            'Power the 4 servos from the 4xAA battery pack, run the 90° Centering script, and align legs and feet dead-straight before tightening horn screws.',
            'Route the Left and Right Foot servo wires up through the leg slots into the torso.'
          ],
          learnerChoices: {
            question: 'How will your Lead Builder verify that all 4 servos are truly at 90° before screwing on the plastic horns?',
            options: [
              { id: 'live-powered-align', label: 'Press-Fit Horns While Powered at 90°', description: 'Keep the 90° centering sketch running on 4xAA power while aligning the legs perpendicular to the torso.' },
              { id: 'sweep-then-park', label: '0°–180°–90° Sweep Verification', description: 'Run a script that sweeps 45° -> 135° -> parks at 90° so you can hear and see each servo settle at center.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a photo of your assembled legs and feet standing at the 90° neutral position.',
            targetCompetencies: ['ctps-05', 'sdl-03']
          },
          reflectionPrompt: 'Why do servo horns have small gear splines that sometimes sit 3°–4° off-center even when you align them carefully by hand?',
          teacherTips: 'Inspect every robot before horn screws are tightened to confirm 90° electrical centering.'
        },
        {
          sessionNumber: 14,
          week: 7,
          title: 'Software Posture Trim (±5°) & 4-Phase Walking Gait (Bench Test 1)',
          durationMin: 300,
          learningGoal:
            'Calibrate individual servo trim offsets (`±5°`) and program the 4-phase weight-shift walking gait to pass **Bench Test 1**.',
          activities: [
            'Determine exact neutral angles (e.g., `LH=89°`, `RH=91°`, `LF=90°`, `RF=88°`) and save them as constants.',
            'Code the 4-phase bipedal walk cycle (`Tilt Right Foot -> Swing Left Hip -> Tilt Left Foot -> Swing Right Hip`) and run **Bench Test 1** (5 steps without tipping).'
          ],
          learnerChoices: {
            question: 'How will your team tune your walking gait if the robot wobbles during step transitions?',
            options: [
              { id: 'smaller-stride', label: 'Compact 20° Hip Stride + Smooth Step Delay', description: 'Uses a conservative ±20° hip swing and 25° foot tilt for maximum stability.' },
              { id: 'micro-step-interpolation', label: 'Incremental 2° Loop Easing', description: 'Moves servos in 2° increments every 15ms instead of jumping instantly between angles.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Submit your 4-Servo Trim Offset Table, walking gait code, and Bench Test 1 observation log.',
            targetCompetencies: ['ctps-05', 'sdl-04']
          },
          reflectionPrompt: 'How did adjusting your foot tilt angle affect whether the opposite foot cleared the desk surface cleanly?',
          teacherTips: 'If a robot tips forward during a step, check that the 4xAA battery pack is centered over the hips rather than pushed against the front wall.'
        },
        {
          sessionNumber: 15,
          week: 8,
          title: 'Coding the Tamagotchi Virtual Pet Timers & 5 Mood Displays',
          durationMin: 300,
          learningGoal:
            'Implement non-blocking stat timers for `Hunger`, `Happiness`, and `Energy` and render distinct expressions for all 5 moods.',
          activities: [
            'Code the background stat loop and mood selector (`IF Alarm -> Alarm Ringing`, `ELSE IF Hunger >= 65 -> Hungry`, `ELSE IF Energy <= 35 -> Sleepy`, `ELSE IF Happiness <= 45 -> Bored`, `ELSE -> Happy`).',
            'Create custom facial animations and sound cues for each mood state.'
          ],
          learnerChoices: {
            question: 'How will your Robo-Buddy express each of its 5 moods physically as well as visually?',
            options: [
              { id: 'foot-tap-dances', label: 'Mood-Specific Ankle & Hip Micro-Dances', description: 'Happy does a joyful wiggle; Hungry stomps one foot; Sleepy droops slightly; Bored sways slowly.' },
              { id: 'audio-melody-pack', label: '5 Distinct R2-D2 Emotion Melodies', description: 'Pairs each LED/OLED face with a recognizable multi-note pitch contour.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload your Tamagotchi mood state-machine code and describe how each mood looks and sounds.',
            targetCompetencies: ['ct-02', 'sdl-04']
          },
          reflectionPrompt: 'Why does using a 10-second `delay(10000)` freeze the robot so it ignores your hand when you try to pet it?',
          teacherTips: 'Show students how to use `input.runningTime()` (MakeCode) or `millis()` (Arduino) for non-blocking timers.'
        },
        {
          sessionNumber: 16,
          week: 8,
          title: 'Interactive Care Loops: Touch Petting & Flashlight Feeding (Bench Test 2)',
          durationMin: 300,
          learningGoal:
            'Connect the Touch Sensor and LDR Light Sensor to update live Tamagotchi stats and pass **Bench Test 2**.',
          activities: [
            'Code the Touch Petting handler (`Happiness +15`, heart face, foot wiggle) and Flashlight Feeding handler (`Hunger -20`, chomp animation).',
            'Friday Milestone 8 — Run **Bench Test 2**: demonstrate real-time mood recovery from `Hungry` and `Bored` to `Happy`.'
          ],
          learnerChoices: {
            question: 'What happens if a user over-feeds or continuously pets the Robo-Buddy?',
            options: [
              { id: 'clamp-at-100', label: 'Stat Clamping (0–100) + Joyful Spin Dance', description: 'Clamps Hunger at 0 and Happiness at 100 and triggers a special celebration dance.' },
              { id: 'cooldown-timer', label: '3-Second Sensor Debounce Cooldown', description: 'Prevents a single long touch or flashlight shine from counting as 50 separate events.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Log your Bench Test 2 results showing stat values before and after Flashlight Feeding and Head Petting.',
            targetCompetencies: ['ctps-05', 'ct-02']
          },
          reflectionPrompt: 'How did you prevent holding your finger on the touch sensor for 2 seconds from instantly maxing out Happiness?',
          teacherTips: 'Verify that every team clamps `Hunger`, `Happiness`, and `Energy` cleanly between `0` and `100`.'
        },
        {
          sessionNumber: 17,
          week: 9,
          title: 'Smart Study/Wake-Up Alarm & Physical Dismiss Rule Implementation',
          durationMin: 300,
          learningGoal:
            'Program the Smart Alarm trigger state and enforce the physical Dismiss Rule (`3 Head Touches` OR `Ultrasonic Wave <= 15cm`).',
          activities: [
            'Code the `Alarm Ringing` state that overrides normal moods when the study/wake-up timer expires.',
            'Implement and test the dual dismiss condition (`dismissHeadTouches >= 3 || ultrasonicCm <= 15`) so the user must physically interact with the robot.'
          ],
          learnerChoices: {
            question: 'How will a student set or trigger the Smart Study/Wake-Up Alarm on your Robo-Buddy?',
            options: [
              { id: 'pomodoro-button', label: 'Pomodoro Study Timer + Demo Trigger Button', description: 'Starts a 25-minute study timer (or 15-second demo countdown) via button/touch combo.' },
              { id: 'light-dawn-alarm', label: 'Morning Dawn Light + Countdown Alarm', description: 'Triggers when countdown expires or morning light hits the LDR sensor.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Submit your Smart Alarm trigger and dismiss code snippet and test log.',
            targetCompetencies: ['ctps-05', 'ent-04']
          },
          reflectionPrompt: 'Why is requiring 3 separate head touches or a close `<= 15cm` hand wave much more effective at waking a student up than a single tap?',
          teacherTips: 'Have teams test that walking past the desk 1 meter away does NOT accidentally dismiss the ultrasonic alarm.'
        },
        {
          sessionNumber: 18,
          week: 9,
          title: 'Full Enclosure Assembly, Wire Harness Management & Prototype V1.0 Lock',
          durationMin: 300,
          learningGoal:
            'Mount the battery pack, expansion board, and all sensors inside the 3D-printed torso and head and demonstrate untethered **Prototype V1.0**.',
          activities: [
            'Close the 3D-printed head and body shell, secure the battery pack near the center of mass, and check that hip servos rotate freely.',
            'Friday Milestone 9: Run a full 10-minute untethered desk test of Prototype V1.0 on 4xAA battery power.'
          ],
          learnerChoices: {
            question: 'How will you route and secure the internal jumper wires inside the torso?',
            options: [
              { id: 'braided-harness', label: 'Braided / Twisted Servo Wire Bundles', description: 'Twists each 3-wire servo lead and routes it along the back wall away from the hip horns.' },
              { id: 'zip-tie-anchors', label: 'Internal Zip-Tie Loops & Tape Channels', description: 'Bundles excess wire length neatly above the battery pack.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload front, side, and internal wiring photos of your completed Prototype V1.0.',
            targetCompetencies: ['lc-03', 'sdl-04']
          },
          reflectionPrompt: 'How did closing the head shell change the robot’s center of gravity compared to when the electronics were open on the bench?',
          teacherTips: 'Have teams re-check their 4 servo trim angles once the full weight of the head and battery pack is mounted.'
        }
      ]
    },
    {
      id: 'test',
      title: '6. Test — Weeks 10–11: 40-Point Reliability Benchmark, V2.0 Upgrades & User Manual',
      strap: 'PHASE 4: TEST & ITERATE (Weeks 10–11) • 40-Trial Stress Test (20 Walk + 10 Alarm + 10 Care), Rubber Foot Grips & Manual',
      weeks: [10, 11],
      goal:
        'Execute the 40-Point Reliability Benchmark (`20` walking + `10` alarm + `10` sensor care trials), add rubber foot grips and cable zip-ties for **Prototype V2.0**, publish the 1-Page Quick-Start User Manual, and rehearse the 6-slide showcase pitch.',
      tasks: [
        'Run the 40-Point Reliability Benchmark (20 Walking Trials + 10 Smart Alarm Trials + 10 Sensor Care Trials) and log every pass/fail.',
        'Upgrade to **Prototype V2.0**: add rubber grip pads or hot-glue traction dots to the feet, zip-tie loose wires, and conduct blind peer usability testing.',
        'Create the 1-Page Illustrated Quick-Start User Manual, curate the MTC Digital Portfolio, and rehearse the 5-minute 6-slide pitch.'
      ],
      evidence: [
        'Completed 40-Point Reliability Scorecard & Failure/Fix Log',
        'Before/After Prototype V1.0 vs. V2.0 Upgrade Photos & Peer Tester Notes',
        '1-Page Illustrated Quick-Start User Manual PDF & 6-Slide Showcase Deck'
      ],
      aiPromptStarters: [
        'During our 20 walking trials, our Robo-Buddy slipped on smooth varnished desks in 6 trials. What mechanical and gait adjustments will improve traction and balance for Prototype V2.0?',
        'Help us structure a clear, kid-friendly 1-Page Quick-Start User Manual so a visitor at the Pet Adoption Fair can feed, pet, and test our Robo-Buddy in 30 seconds.'
      ],
      competencies: ['ctps-05', 'sdl-04', 'ec-05', 'ent-04'],
      stretchCompetencies: ['sea-01'],
      sessions: [
        {
          sessionNumber: 19,
          week: 10,
          title: 'The 40-Point Reliability Benchmark (20 Walk + 10 Alarm + 10 Sensor Care Trials)',
          durationMin: 300,
          learningGoal:
            'Execute 40 quantitative reliability trials and identify mechanical and software failure modes from empirical test data.',
          activities: [
            'Run 20 walking trials (5 steps per trial on a smooth desk), 10 Smart Alarm trigger/dismiss trials, and 10 Touch/Light care trials.',
            'Record every pass/fail in the 40-Point Scorecard and diagnose the top 3 failure causes.'
          ],
          learnerChoices: {
            question: 'How will your Project Manager organize the 40-trial stress test so the data is accurate and unbiased?',
            options: [
              { id: 'two-surface-test', label: 'Standardized Desk Track + Stopwatch Log', description: 'Marks a 30cm start/finish line on the desk and logs every stumble, drift, or false trigger.' },
              { id: 'cross-team-audit', label: 'Partner Team QA Auditor', description: 'Has a neighbouring team witness and sign off on each block of 10 trials.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Submit your 40-Point Benchmark Table (Pass/Fail counts for 20 Walk, 10 Alarm, 10 Sensor Care tests) and top 3 failure causes.',
            targetCompetencies: ['ctps-05', 'sdl-04']
          },
          reflectionPrompt: 'Which of the 3 benchmark categories (Walking, Smart Alarm, or Sensor Care) had the lowest pass rate on V1.0, and why?',
          teacherTips: 'Remind teams that documenting real failures honestly and fixing them in V2.0 is the core of engineering mastery.'
        },
        {
          sessionNumber: 20,
          week: 10,
          title: 'Prototype V2.0 Upgrades (Rubber Foot Grips, Zip-Tied Cables & Threshold Tuning)',
          durationMin: 300,
          learningGoal:
            'Implement mechanical and software upgrades to resolve Week 10 benchmark failures and reach `>= 32/40` (`>= 80%`) reliability on **Prototype V2.0**.',
          activities: [
            'Apply rubber grip pads or textured hot-glue traction dots to both feet, zip-tie internal servo cables away from hip gears, and tune sensor thresholds.',
            'Swap Robo-Buddies with a partner team for blind usability testing and re-run failed benchmark trials on Prototype V2.0.'
          ],
          learnerChoices: {
            question: 'Which traction upgrade will your team apply to the soles of your 3D-printed feet?',
            options: [
              { id: 'rubber-pads', label: 'Self-Adhesive Neoprene / Silicone Grip Strips', description: 'Provides uniform high friction and dampens foot impact vibration.' },
              { id: 'hot-glue-tread', label: 'Textured Hot-Glue Grip Dots (Cooled Before Use)', description: 'Creates custom non-slip tread bars across the front and heel of each foot.' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Upload Before/After V1.0 vs. V2.0 upgrade photos, updated benchmark score, and peer tester feedback.',
            targetCompetencies: ['ctps-05', 'ent-04']
          },
          reflectionPrompt: 'By how many percentage points did your 40-trial pass rate improve after adding foot grip pads and tuning your code for V2.0?',
          teacherTips: 'Ensure hot-glue tread dots are 100% cool and flat before placing the robot on classroom desks.'
        },
        {
          sessionNumber: 21,
          week: 11,
          title: '1-Page Quick-Start User Manual & Aesthetic Character Finishing',
          durationMin: 300,
          learningGoal:
            'Create a clear, illustrated 1-Page Quick-Start User Manual & Pet Adoption Guide and apply final character detailing.',
          activities: [
            'Design the 1-Page User Manual covering: (1) Meet Your Robo-Buddy, (2) 5 Mood Icons Legend, (3) How to Feed & Pet, (4) Smart Alarm Dismiss Rules, and (5) 4xAA Battery Care.',
            'Add final paint, decals, or lightweight 3D details and re-verify balance.'
          ],
          learnerChoices: {
            question: 'What visual format will your team use for your 1-Page Quick-Start User Manual?',
            options: [
              { id: 'illustrated-care-card', label: 'Illustrated "Pet Adoption & Care Card"', description: 'Combines an adoption certificate with visual icons for feeding, petting, and alarm rules.' },
              { id: 'technical-quick-start', label: 'Annotated Diagram + Pinout Quick-Start Sheet', description: 'Shows a labeled diagram of the robot alongside step-by-step operating instructions.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your 1-Page Quick-Start User Manual text/layout and photo of your finished Robo-Buddy.',
            targetCompetencies: ['ec-05', 'ct-02']
          },
          reflectionPrompt: 'Could a classmate from another team operate your Robo-Buddy using ONLY your 1-Page User Manual without you explaining anything out loud?',
          teacherTips: 'Run a 5-minute "Silent Manual Test" where a peer tests the robot using only the printed sheet.'
        },
        {
          sessionNumber: 22,
          week: 11,
          title: 'MTC Digital Portfolio Curation & 6-Slide Showcase Pitch Rehearsal',
          durationMin: 300,
          learningGoal:
            'Assemble a complete 12-week engineering evidence trail in the MTC Digital Portfolio and rehearse a timed 5-minute pitch.',
          activities: [
            'Verify all 3 Core Deliverables are uploaded and tagged in the MTC portfolio.',
            'Build the 6-slide pitch deck and run a timed 5-minute Dress Rehearsal with live robot demo.'
          ],
          learnerChoices: {
            question: 'How will your 4 team members divide the 5-minute Showcase Pitch?',
            options: [
              { id: 'role-based-handoff', label: '4-Role Specialist Handoff (75 Seconds Each)', description: 'Project Manager (Problem & QA), 3D Designer (CAD Shell), Lead Builder (4-Servo Mechanics), Lead Coder (Tamagotchi & Live Demo).' },
              { id: 'story-and-live-demo', label: '2-Minute Story + 3-Minute Interactive Live Demo', description: 'Brief slide overview followed by a guided live demonstration of walking, feeding, and alarm dismissal.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your 6-Slide Showcase Deck summary and dress rehearsal feedback notes.',
            targetCompetencies: ['ec-05', 'lc-03']
          },
          reflectionPrompt: 'What backup plan does your team have if a battery runs low during the live showcase demo?',
          teacherTips: 'Have every team prepare both fresh AA batteries and a 30-second backup video clip of their V2.0 robot in action.'
        }
      ]
    },
    {
      id: 'share',
      title: '7. Share — Week 12: The Robo-Buddy Pet Adoption Fair & MTC Reflection',
      strap: 'PHASE 5: SHOWCASE & REFLECT (Week 12) • Live Pet Adoption Fair Booth, 5-Minute Pitch & 7-Skill MTC Portfolio Lock',
      weeks: [12, 12],
      goal:
        'Host the **Robo-Buddy Pet Adoption Fair & Robotics Showcase**, deliver the 5-minute live pitch and interactive desk demo, and complete the final 7-Skill WeLearn MTC Reflection.',
      tasks: [
        'Set up the team’s Pet Adoption Booth with Prototype V2.0, fresh 4xAA batteries, printed 1-Page User Manual, and flashlight for visitors.',
        'Deliver the 5-minute live showcase pitch and guide visiting students, teachers, and parents as they pet, feed, and test the Robo-Buddy.',
        'Complete the final individual 7-Skill WeLearn MTC Competency Reflection and lock the Digital Portfolio.'
      ],
      evidence: [
        'Live Pet Adoption Fair Showcase Pitch & Booth Photos',
        'Final Locked MTC Digital Portfolio & Signed 7-Skill Reflection'
      ],
      aiPromptStarters: [
        'Quiz our team with 5 tough technical judge questions about our 4-servo walking gait, 90° calibration, and Tamagotchi state machine so we can practice crisp answers.',
        'Help me review my final 7-Skill MTC Reflection to make sure I cited specific evidence from Weeks 1–12 for each WeLearn Future Skill.'
      ],
      competencies: ['ec-05', 'lc-03', 'sea-01', 'sdl-04'],
      stretchCompetencies: ['ent-04'],
      sessions: [
        {
          sessionNumber: 23,
          week: 12,
          title: 'The Robo-Buddy Pet Adoption Fair & Live Robotics Showcase!',
          durationMin: 300,
          learningGoal:
            'Deliver a persuasive 5-minute engineering pitch and live demonstration of walking, virtual pet care, and Smart Alarm dismissal.',
          activities: [
            'Set up the team’s Pet Adoption Booth with Prototype V2.0, printed Quick-Start User Manual, CAD/wiring poster, and flashlight for visitors.',
            'Present the 5-minute live showcase pitch and guide visitors as they pet, feed, and test the Robo-Buddy.'
          ],
          learnerChoices: {
            question: 'How will visitors interact with your Robo-Buddy at your Pet Adoption Booth?',
            options: [
              { id: 'care-challenge', label: '"Cure the Grumpy Pet" Visitor Challenge', description: 'Visitors use the flashlight and head touch sensor to turn a Hungry/Bored Robo-Buddy back to Happy.' },
              { id: 'alarm-race', label: '"Beat the Morning Alarm" Live Demo', description: 'Visitors trigger the dancing alarm and race to dismiss it via 3 head touches or a <= 15cm wave.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Document your Pet Adoption Fair booth, live robot demo, and visitor feedback.',
            targetCompetencies: ['ec-05', 'lc-03', 'ent-04']
          },
          reflectionPrompt: 'How did visitors react when your Robo-Buddy responded to their touch or flashlight beam in real time?',
          teacherTips: 'Evaluate each team across the 7-Skill WeLearn Future Skills & MTC Rubric during live booth visits.'
        },
        {
          sessionNumber: 24,
          week: 12,
          title: 'Final MTC Digital Portfolio Lock & 7-Skill Growth Reflection',
          durationMin: 300,
          learningGoal:
            'Reflect with evidence on personal growth across all 7 WeLearn Future Skills and lock the final MTC Digital Portfolio.',
          activities: [
            'Complete the individual 7-Skill MTC Reflection citing specific artifacts (90° calibration, CAD shell, Tamagotchi state machine, and Week 10 V2.0 fixes).',
            'Friday Milestone 12: Lock final MTC Digital Portfolio and celebrate in the closing circle!'
          ],
          learnerChoices: {
            question: 'Which engineering artifact are you most proud to feature at the top of your MTC Digital Portfolio?',
            options: [
              { id: 'v2-mechatronics', label: 'Prototype V2.0 4-Servo Walker & CAD Shell', description: 'Highlights mechanical design, 90° calibration, and the 40-trial reliability upgrade.' },
              { id: 'tamagotchi-code', label: '5-Mood Tamagotchi State Machine & Smart Alarm Code', description: 'Highlights embedded software architecture, sensor thresholds, and non-blocking timers.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Submit your final 7-Skill WeLearn MTC Reflection highlighting your proudest engineering iteration.',
            targetCompetencies: ['sdl-04', 'sea-01']
          },
          reflectionPrompt: 'Looking back from Week 1 to Week 12, what was the single hardest bug your team solved, and what did it teach you as an engineer?',
          teacherTips: 'Conduct final portfolio sign-offs and award Robo-Buddy Studio Badges.'
        }
      ]
    }
  ]
};

