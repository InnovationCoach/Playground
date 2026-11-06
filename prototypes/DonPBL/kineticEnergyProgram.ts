/**
 * Don's PBL Program: Smart Cities & Adaptive Infrastructure — Kinetic and Smart Energy Harvesting
 * Branch: DonPBL
 * Location: prototypes/DonPBL/kineticEnergyProgram.ts
 *
 * Sourced from "Smart Cities & Adaptive Infrastructure — Kinetic and Smart Energy Harvesting"
 * Schedule: 12 Weeks | Monday–Friday | 2 Hours/Day (10 Hours/Week | 120 Total Hours | 24 Sessions)
 * Design Framework: Design Thinking (Empathize, Define, Ideate, Prototype, Test & Pitch — mapped across the 7 prototype phases: explore, empathise, define, ideate, prototype, test, share)
 * Assessment Standard: WeLearn 7 Essential Future Skills
 */

import type { PblProgram, ProgramPhase } from './programData';

export interface KineticTransducerOption {
  id: string;
  name: string;
  mechanism: 'Piezoelectric Ceramic Array' | 'Electromagnetic Spring-Gear Generator' | 'Thermoelectric Peltier (Seebeck) Surface' | 'Hybrid Piezo + Micro-Generator Tile';
  openCircuitPeakV: number;
  shortCircuitCurrentMa: number;
  joulesPerFootstepOrCycle: number;
  verticalDeflectionMm: number;
  adaTripFreeCompliant: boolean;
  weatherproofIpRating: string;
  unitPrototypeBomUSD: number;
  bulk100UnitCostUSD: number;
  bulk10000UnitCostUSD: number;
  bestUseCase: string;
  engineeringTradeoff: string;
}

export interface KineticSiteBottleneck {
  id: string;
  name: string;
  locationType: 'School Staircase' | 'Cafeteria Queue' | 'Main Hallway Bottleneck' | 'Public Park Plaza & Bench Zone';
  dailyFootstepsPerTile: number;
  surfaceTempDeltaC: number;
  recommendedTileCount: number;
  targetLoadProfile: string;
  accessibilityNotes: string;
}

export interface KineticSkillPracticeItem {
  skillNumber: number;
  domainId: 'sdl' | 'ctps' | 'lc' | 'ec' | 'ent' | 'sea' | 'ct';
  skillTitle: string;
  howStudentsPractice: string;
  deliverableAnchor: string;
}

export interface KineticDeliverableSpec {
  number: number;
  title: string;
  keyTechnicalCriteria: string[];
  primarySkillsAssessed: string[];
}

export interface KineticGamificationBadge {
  id: string;
  name: string;
  icon: string;
  xpAward: number;
  unlockedAtPhase: string;
  condition: string;
  description: string;
}

export const KINETIC_TRANSDUCER_OPTIONS: KineticTransducerOption[] = [
  {
    id: 'transducer-piezo-array',
    name: '24-Disc 35mm Piezoelectric Series-Parallel Array',
    mechanism: 'Piezoelectric Ceramic Array',
    openCircuitPeakV: 28.5,
    shortCircuitCurrentMa: 14.0,
    joulesPerFootstepOrCycle: 0.45,
    verticalDeflectionMm: 2.8,
    adaTripFreeCompliant: true,
    weatherproofIpRating: 'IP67 Silicone-Encased Shock Mount',
    unitPrototypeBomUSD: 38,
    bulk100UnitCostUSD: 22,
    bulk10000UnitCostUSD: 9.5,
    bestUseCase: 'Batteryless IoT foot-traffic counters, e-ink displays, and low-draw LED stair edge markers.',
    engineeringTradeoff: 'High voltage spikes with low current; requires 1N5819 Schottky bridge rectification and neoprene shock mounts to prevent ceramic cracking.'
  },
  {
    id: 'transducer-em-spring',
    name: 'Rack-and-Pinion Electromagnetic Micro-Generator Tile',
    mechanism: 'Electromagnetic Spring-Gear Generator',
    openCircuitPeakV: 12.4,
    shortCircuitCurrentMa: 380.0,
    joulesPerFootstepOrCycle: 3.2,
    verticalDeflectionMm: 4.5,
    adaTripFreeCompliant: true,
    weatherproofIpRating: 'IP66 Elastomeric Gasket Housing',
    unitPrototypeBomUSD: 68,
    bulk100UnitCostUSD: 41,
    bulk10000UnitCostUSD: 19.0,
    bestUseCase: 'High-density school stairs, station turnstiles, pathway safety LEDs, and USB trickle-charging kiosks.',
    engineeringTradeoff: 'Highest Joules per footstep (3.2 J/step) while staying under the 5.0mm ADA trip-free deflection limit; moving gears require mechanical fatigue testing.'
  },
  {
    id: 'transducer-peltier-seebeck',
    name: 'TEC1-12706 Thermoelectric Seebeck Asphalt/Bench Harvester',
    mechanism: 'Thermoelectric Peltier (Seebeck) Surface',
    openCircuitPeakV: 4.8,
    shortCircuitCurrentMa: 190.0,
    joulesPerFootstepOrCycle: 1.6,
    verticalDeflectionMm: 0.0,
    adaTripFreeCompliant: true,
    weatherproofIpRating: 'IP68 Sealed Aluminum Heat-Pipe Block',
    unitPrototypeBomUSD: 44,
    bulk100UnitCostUSD: 26,
    bulk10000UnitCostUSD: 11.5,
    bestUseCase: 'Sun-baked park benches, asphalt plazas, and outdoor air-quality/temperature telemetry nodes.',
    engineeringTradeoff: 'Zero moving parts (0mm deflection), but continuous output depends on maintaining a strong ΔT between sun-baked surfaces and shaded heat sinks.'
  },
  {
    id: 'transducer-hybrid-tile',
    name: 'Hybrid Piezo + Electromagnetic Compliant Flexure Tile',
    mechanism: 'Hybrid Piezo + Micro-Generator Tile',
    openCircuitPeakV: 18.2,
    shortCircuitCurrentMa: 420.0,
    joulesPerFootstepOrCycle: 4.1,
    verticalDeflectionMm: 4.2,
    adaTripFreeCompliant: true,
    weatherproofIpRating: 'IP67 Dual-Stage Neoprene & HDPE Chassis',
    unitPrototypeBomUSD: 82,
    bulk100UnitCostUSD: 49,
    bulk10000UnitCostUSD: 23.0,
    bestUseCase: 'Flagship Smart City Expo walkways powering INA219 + OLED live watt-meter telemetry and pathway lighting.',
    engineeringTradeoff: 'Captures both initial heel-strike spike (piezo) and downward stroke (micro-generator), requiring dual-bus Schottky rectification.'
  }
];

export const KINETIC_SITE_BOTTLENECKS: KineticSiteBottleneck[] = [
  {
    id: 'site-main-staircase',
    name: 'Central School Staircase Landing (Bottleneck A)',
    locationType: 'School Staircase',
    dailyFootstepsPerTile: 3400,
    surfaceTempDeltaC: 4,
    recommendedTileCount: 16,
    targetLoadProfile: 'Illuminated LED Anti-Slip Stair Nosings + INA219/OLED Live Joule Counter',
    accessibilityNotes: 'Strict < 3.5mm vertical deflection with high-traction textured top plate and tactile stair-edge warning strips.'
  },
  {
    id: 'site-cafeteria-queue',
    name: 'Cafeteria Lunch Queue & Turnstile Corridor (Bottleneck B)',
    locationType: 'Cafeteria Queue',
    dailyFootstepsPerTile: 4800,
    surfaceTempDeltaC: 5,
    recommendedTileCount: 24,
    targetLoadProfile: 'E-Ink Daily Menu/Energy Dashboard + Batteryless ESP32 Queue Wait-Time Sensor',
    accessibilityNotes: 'Flush ramp bevels (<= 4.5mm deflection) tested for wheelchairs, crutches, and food service carts.'
  },
  {
    id: 'site-park-plaza',
    name: 'Public Park Sunlit Walkway & Smart Bench Zone (Bottleneck C)',
    locationType: 'Public Park Plaza & Bench Zone',
    dailyFootstepsPerTile: 2600,
    surfaceTempDeltaC: 18,
    recommendedTileCount: 20,
    targetLoadProfile: 'Off-Grid Pathway Safety Bollard LEDs + Park Air-Quality Sensor & USB Trickle Bank',
    accessibilityNotes: 'ADA-compliant stroller/wheelchair surface ergonomics + IP67 rainwater drainage channels.'
  }
];

export const KINETIC_DELIVERABLES: KineticDeliverableSpec[] = [
  {
    number: 1,
    title: '1. Working Mechanical/Electronic Prototype',
    keyTechnicalCriteria: [
      'Generates measurable electrical power from footsteps, vibration, or ΔT.',
      'Includes AC/DC bridge rectification (1N5819 Schottky diodes), energy storage (supercapacitor/rechargeable cell), and visible load/telemetry (INA219 + OLED).',
      'Mechanically durable, safe, and trip-free (vertical deflection under 5mm).'
    ],
    primarySkillsAssessed: [
      'Self-Directed Learning',
      'Collaboration & Leadership',
      'Social & Emotional Aptitude'
    ]
  },
  {
    number: 2,
    title: '2. Architectural Blueprint (3-Panel A1/Arch D Package)',
    keyTechnicalCriteria: [
      'Includes scaled Site Plan, Cross-Sectional Installation Detail, Exploded Mechanical Assembly, and Electrical Schematic (KiCad/Fritzing).',
      'Accounts for accessibility (ADA/universal design for wheelchairs, canes, and strollers), drainage/weatherproofing, and maintenance access.'
    ],
    primarySkillsAssessed: [
      'Digital & AI Fluency',
      'Communication in All Forms'
    ]
  },
  {
    number: 3,
    title: '3. Cost-Benefit Energy Analysis Report',
    keyTechnicalCriteria: [
      'Anchored in empirical lab measurements (Joules per step or Watts per m²).',
      'Complete Bill of Materials (BOM: single unit vs. 100 and 10,000 unit scaled deployment) and Levelized Cost of Energy (LCOE).',
      'Critical evaluation of payback timeline, comparison against solar PV, and co-benefits (e.g., batteryless foot-traffic sensing).'
    ],
    primarySkillsAssessed: [
      'Critical Thinking',
      'Entrepreneurship'
    ]
  }
];

export const KINETIC_WELEARN_SKILLS_TABLE: KineticSkillPracticeItem[] = [
  {
    skillNumber: 1,
    domainId: 'sdl',
    skillTitle: '1. Self-Directed Learning',
    howStudentsPractice: 'Students manage multi-week engineering sprints, maintain individual/team lab logs, and independently research transducer physics and micro-circuitry.',
    deliverableAnchor: 'Deliverable #1: Working Mechanical/Electronic Prototype & Sprint Lab Logs'
  },
  {
    skillNumber: 2,
    domainId: 'ctps',
    skillTitle: '2. Critical Thinking',
    howStudentsPractice: 'Calculating energy conversion efficiencies, diagnosing voltage drop across diodes, and evaluating realistic ROI vs. hype in kinetic harvesting.',
    deliverableAnchor: 'Deliverable #3: Cost-Benefit Energy Analysis Report & "Lossless" Rectifier Lab'
  },
  {
    skillNumber: 3,
    domainId: 'lc',
    skillTitle: '3. Collaboration & Leadership',
    howStudentsPractice: 'Operating in cross-functional studio pods (Hardware/Electrical Lead, Architectural/CAD Lead, Data & Finance Analyst, Project Manager).',
    deliverableAnchor: 'Deliverable #1: Pod Role Contracts, Mid-Program Pin-Up & 1,000-Footstep Stress Test'
  },
  {
    skillNumber: 4,
    domainId: 'ec',
    skillTitle: '4. Communication in All Forms',
    howStudentsPractice: 'Producing technical CAD blueprints, data dashboards, stakeholder interviews, and a TED-style public exhibition pitch.',
    deliverableAnchor: 'Deliverable #2: 3-Panel A1 Architectural Blueprint & Week 12 Interactive Civic Pitch'
  },
  {
    skillNumber: 5,
    domainId: 'ent',
    skillTitle: '5. Entrepreneurship',
    howStudentsPractice: 'Building a real-world business case, sourcing components within budget, calculating unit economics, and pitching to facilities/municipal decision-makers.',
    deliverableAnchor: 'Deliverable #3: BOM Scaling (1 vs. 100 vs. 10,000 units), LCOE & Honest ROI Simulator'
  },
  {
    skillNumber: 6,
    domainId: 'sea',
    skillTitle: '6. Social & Emotional Aptitude',
    howStudentsPractice: 'Designing inclusive, accessible urban infrastructure (ensuring tiles are safe for wheelchairs and strollers) and navigating prototype failure with resilience.',
    deliverableAnchor: 'Deliverable #1 & #2: Universal Design Audit (<5mm trip-free deflection) & V2.0 Iteration'
  },
  {
    skillNumber: 7,
    domainId: 'ct',
    skillTitle: '7. Digital & AI Fluency',
    howStudentsPractice: 'Using microcontrollers (Arduino/ESP32) for automated data logging, CAD tools (Fusion 360/SketchUp), and AI tools to simulate foot-traffic patterns and optimize structural loads.',
    deliverableAnchor: 'Deliverable #1 & #2: ESP32 48-Hr Logger, INA219/OLED Telemetry & CAD Site Blueprint'
  }
];

export const KINETIC_GAMIFICATION_BADGES: KineticGamificationBadge[] = [
  {
    id: 'badge-human-watt',
    name: 'Human Watt & Seebeck Physicist',
    icon: '⚡',
    xpAward: 400,
    unlockedAtPhase: 'explore',
    condition: 'Complete Activity 1.1 (The "Human Watt" Challenge) and Activity 1.2 (TEC1-12706 Thermal Gradient Harvesting) with multimeter/oscilloscope logs.',
    description: 'Measured peak open-circuit voltage and short-circuit current across 35mm piezo discs, micro-generators, and Peltier modules.'
  },
  {
    id: 'badge-heatmap-ethnographer',
    name: 'Universal Design & Heatmap Scout',
    icon: '🗺️',
    xpAward: 450,
    unlockedAtPhase: 'empathise',
    condition: 'Complete the wheelchair/cane/stroller accessibility audit and Activity 1.3 (Kinetic & Thermal Heatmap Safari).',
    description: 'Mapped high-density wasted energy zones across school stairs, cafeteria queues, and park benches without creating physical barriers.'
  },
  {
    id: 'badge-lossless-rectifier',
    name: 'ESP32 Logger & Schottky Rectifier Engineer',
    icon: '🔌',
    xpAward: 550,
    unlockedAtPhase: 'define',
    condition: 'Deploy the 48-hour ESP32 footstep/ΔT logger (Activity 2.1) and prove Schottky diode energy savings on a 1000µF capacitor (Activity 2.2).',
    description: 'Conditioned erratic AC piezoelectric spikes into low-loss DC storage while enforcing the <5mm trip-free deflection spec.'
  },
  {
    id: 'badge-cardboard-kinematics',
    name: 'Compliant Linkage & Digital Twin Architect',
    icon: '📐',
    xpAward: 600,
    unlockedAtPhase: 'ideate',
    condition: 'Build 3 force-amplification linkages in Activity 3.1, select a winner via Pugh Matrix, and draft the CAD site plan in Activity 3.2.',
    description: 'Amplified micro-deflections without cracking ceramic discs and integrated underground conduit routing into a scaled site plan.'
  },
  {
    id: 'badge-smart-tile-fabricator',
    name: 'Smart Tile & A1 Blueprint Master',
    icon: '🛠️',
    xpAward: 700,
    unlockedAtPhase: 'prototype',
    condition: 'Complete Activity 4.1 (Piezo/Hybrid Matrix Soldering), Activity 4.2 (INA219 + OLED Telemetry Build), and Activity 4.3 (3-Panel A1 Blueprint).',
    description: 'Delivered Prototype V1.0 with weather-sealed housing, live Voltage/Joule OLED telemetry, and a plotted 3-panel engineering blueprint.'
  },
  {
    id: 'badge-honest-roi-analyst',
    name: '1,000-Step Stress Tester & Honest ROI Analyst',
    icon: '📊',
    xpAward: 750,
    unlockedAtPhase: 'test',
    condition: 'Complete Activity 5.1 (1,000-Footstep Stress Test -> Prototype V2.0) and Activity 5.2 (The "Honest ROI" Financial Simulator vs. Solar PV).',
    description: 'Quantified real mechanical-to-electrical efficiency, BOM scaling (1 to 10,000 units), LCOE, and smart-sensor co-benefits.'
  },
  {
    id: 'badge-smart-city-expo',
    name: 'Smart City Expo & Live Watt-Meter Laureate',
    icon: '🏙️',
    xpAward: 900,
    unlockedAtPhase: 'share',
    condition: 'Deliver Activity 5.3 (Interactive Civic Pitch & Live Watt-Meter Demo) to school leadership, urban planners, and community judges.',
    description: 'Demonstrated live footstep power generation, architectural blueprints, and rigorous cost-benefit economics.'
  }
];

export const KINETIC_ENERGY_PHASES: ProgramPhase[] = [
  {
    id: 'explore',
    title: 'Phase 1 (Part A): EMPATHIZE — Physics of Ambient Energy (Week 1)',
    strap: 'Phase Driving Question: Where is kinetic, vibrational, and thermal energy invisibly escaping in our daily school and park environments, and how can we capture it without creating physical barriers for diverse users? (Week 1 • 10 Hours)',
    weeks: [1, 1],
    goal: 'Analyze smart-city kinetic case studies (Pavegen, station turnstiles), compare piezoelectricity, electromagnetic induction, and thermoelectric Seebeck harvesting in hands-on physics labs, master multimeters/oscilloscopes, and form cross-functional studio pods.',
    tasks: [
      'Mon (2 hrs — Concept & Physics Lab): Launch the Driving Question; teardown and case study analysis of existing kinetic infrastructure like Pavegen pathways and station turnstiles.',
      'Tue (2 hrs — Fieldwork & Digital Modeling): Compare piezoelectricity with electromagnetic induction physics through hands-on experimentation contrasting raw piezo output against magnetic induction.',
      'Wed (2 hrs — Maker Studio & Fabrication): Activity 1.2 (Thermal Gradient Harvesting) — place TEC1-12706 Peltier modules between sun-baked asphalt/metal surfaces and shaded heat sinks to measure ambient heat differential millivolts.',
      'Thu (2 hrs — Testing, Data & Iteration): Activity 1.1 (The "Human Watt" Challenge) — multimeter & oscilloscope bootcamp wiring raw 35mm piezoelectric discs and miniature DC motors to LEDs and multimeters to measure peak open-circuit voltage vs. short-circuit current from finger taps, heel strikes, and door slams.',
      'Fri (2 hrs — Design Critique & Skill Reflection): Establish cross-functional studio pods (Hardware/Electrical Lead, Architectural/CAD Lead, Data & Finance Analyst, Project Manager), draft role contracts, and set personal learning goals.'
    ],
    evidence: [
      'Activity 1.1 ("Human Watt" Challenge) & Activity 1.2 (TEC1-12706 Thermal Gradient) Multimeter/Oscilloscope Lab Logs',
      'Cross-Functional Studio Pod Role Contract (Hardware/Electrical, Architectural/CAD, Data & Finance, Project Manager)'
    ],
    aiPromptStarters: [
      'Compare the open-circuit voltage and short-circuit current characteristics of a 35mm piezoelectric disc vs. a miniature DC electromagnetic generator under a 70kg footstep.',
      'How does the Seebeck effect work in a TEC1-12706 Peltier module, and what ΔT is needed between sun-baked asphalt and a shaded heat sink to produce usable millivolts?',
      'Help our 4-person studio pod draft clear weekly responsibilities for our Hardware Lead, Architectural/CAD Lead, Data & Finance Analyst, and Project Manager.'
    ],
    competencies: ['ctps-01', 'sdl-01', 'lc-01'],
    stretchCompetencies: ['ctps-02', 'sea-01'],
    sessions: [
      {
        sessionNumber: 1,
        week: 1,
        title: 'Week 1 (Mon–Wed): Smart-City Case Teardowns, Piezo vs. Induction & Activity 1.2 Peltier Lab',
        durationMin: 300,
        learningGoal: 'Analyze Pavegen and turnstile energy harvesters, contrast piezoelectricity with electromagnetic induction, and measure Seebeck millivolts with TEC1-12706 Peltier modules.',
        activities: [
          'Monday (2 hrs): Launch the Driving Question ("How can we retrofit our school or public parks to harvest clean energy from footsteps, vibration, or ambient heat?") and analyze Pavegen pathways and station turnstiles.',
          'Tuesday (2 hrs): Conduct the Piezoelectricity vs. Electromagnetic Induction Lab contrasting high-voltage/low-current piezo ceramic flexing against magnetic coil induction.',
          'Wednesday (2 hrs): Complete Activity 1.2 (Thermal Gradient Harvesting) by placing TEC1-12706 Peltier modules between sun-baked asphalt/metal surfaces and shaded heat sinks to record millivolt output from ambient ΔT.'
        ],
        learnerChoices: {
          question: 'Which ambient energy source shows the highest potential in your initial campus observations?',
          options: [
            { id: 'opt-kinetic-footsteps', label: 'High-Density Footsteps (Stairs & Queues)', description: 'Capture heel strikes and downward mechanical deflection using piezo or electromagnetic spring tiles.' },
            { id: 'opt-thermal-seebeck', label: 'Solar-Heated Surfaces (Asphalt & Metal Benches)', description: 'Capture temperature differentials (ΔT) between sun-baked surfaces and shaded heat sinks via TEC1-12706 modules.' },
            { id: 'opt-hybrid-door-turnstile', label: 'Mechanical Vibrations & Door/Gate Motion', description: 'Capture rotational or vibrational energy from heavy hallway doors and playground equipment.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your comparison table of Piezoelectric, Electromagnetic, and Thermoelectric (TEC1-12706) voltage/current measurements.',
          targetCompetencies: ['ctps-01', 'sdl-01']
        },
        reflectionPrompt: 'Why does a piezoelectric disc flash an LED brightly on a sharp tap, whereas a DC micro-generator sustains current longer during a slow press?',
        teacherTips: 'Remind students not to flex raw 35mm brass-ceramic piezo discs past their brittle limit without a foam backing pad.'
      },
      {
        sessionNumber: 2,
        week: 1,
        title: 'Week 1 (Thu–Fri): Activity 1.1 "Human Watt" Oscilloscope Bootcamp & Studio Pod Contracts',
        durationMin: 300,
        learningGoal: 'Capture transient open-circuit voltage spikes vs. short-circuit current in Activity 1.1 and establish cross-functional studio pod roles.',
        activities: [
          'Thursday (2 hrs): Complete Activity 1.1 (The "Human Watt" Challenge) — wire raw 35mm piezoelectric discs and miniature DC motors (as generators) to LEDs, multimeters, and oscilloscopes to measure peak open-circuit voltage vs. short-circuit current from finger taps, heel strikes, and door slams.',
          'Friday (2 hrs): Form 4-person studio pods (Hardware/Electrical Lead, Architectural/CAD Lead, Data & Finance Analyst, Project Manager), sign role contracts, and log Week 1 personal learning goals.'
        ],
        learnerChoices: {
          question: 'Which studio pod role will you lead across the 12-week engineering cycle?',
          options: [
            { id: 'role-hardware-lead', label: 'Hardware / Electrical Lead', description: 'Leads transducer arrays, Schottky rectification, supercapacitor storage, and INA219/OLED telemetry.' },
            { id: 'role-cad-architect', label: 'Architectural / CAD Lead', description: 'Leads site ergonomics, 2D/3D Fusion 360/SketchUp modeling, and the 3-panel A1 Architectural Blueprint.' },
            { id: 'role-data-finance', label: 'Data & Finance Analyst', description: 'Leads ESP32 field logging, 1,000-footstep curves, BOM scaling, LCOE, and the Honest ROI Report.' },
            { id: 'role-project-manager', label: 'Project Manager & Systems Integrator', description: 'Coordinates weekly sprint milestones, universal design safety audits, and the Smart City Expo pitch.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Upload your Activity 1.1 "Human Watt" oscilloscope/multimeter waveform notes and signed Studio Pod Role Contract.',
          targetCompetencies: ['lc-01', 'sdl-01', 'ctps-01']
        },
        reflectionPrompt: 'What is the difference between open-circuit peak voltage and actual usable electrical power (Watts = Volts × Amps)?',
        teacherTips: 'Emphasize early honesty in engineering: a 30V open-circuit piezo spike at micro-amps is only milliwatts of power unless conditioned and stored properly.'
      }
    ]
  },
  {
    id: 'empathise',
    title: 'Phase 1 (Part B): EMPATHIZE — Site Ethnography & Traffic Mapping (Week 2)',
    strap: 'Phase Driving Question: Where is kinetic, vibrational, and thermal energy invisibly escaping in our daily school and park environments, and how can we capture it without creating physical barriers for diverse users? (Week 2 • 10 Hours)',
    weeks: [2, 2],
    goal: 'Evaluate walkability and ADA/universal design ergonomics for wheelchairs, canes, and strollers, conduct stakeholder interviews, and execute Activity 1.3 (Kinetic & Thermal Heatmap Safari) to map wasted energy zones.',
    tasks: [
      'Mon (2 hrs — Concept & Physics Lab): Walkability & universal design audit testing surface ergonomics for wheelchairs, canes, and strollers on compliant surfaces.',
      'Tue (2 hrs — Fieldwork & Digital Modeling): Conduct a school and park site survey using infrared thermometers, decibel/vibration apps, and tally counters.',
      'Wed (2 hrs — Maker Studio & Fabrication): Conduct stakeholder interviews with facilities managers, park maintenance staff, and students.',
      'Thu (2 hrs — Testing, Data & Iteration): Synthesize spatial data into visual performance heatmaps of foot traffic density and surface temperature differentials.',
      'Fri (2 hrs — Design Critique & Skill Reflection): Activity 1.3 (Kinetic & Thermal Heatmap Safari) — Empathy Map pin-up and critique across school stairs, cafeteria queues, playground equipment, and park benches + WeLearn 7 Future Skills reflection on Social & Emotional Aptitude and Self-Directed Learning.'
    ],
    evidence: [
      'Universal Design & Accessibility Ergonomics Audit (Wheelchair, Cane & Stroller Surface Safety)',
      'Activity 1.3 Kinetic & Thermal Heatmap Safari Map + Stakeholder Interview Synthesis'
    ],
    aiPromptStarters: [
      'What ADA / universal design slope, slip-resistance, and maximum vertical deflection standards apply so energy-harvesting tiles never trip cane users or impede wheelchairs and strollers?',
      'Help us structure interview questions for our school facilities manager and park maintenance staff regarding drainage, cleaning, and cable trenching.',
      'How can we overlay our foot-traffic tally counts and IR surface temperature readings into a clear spatial heatmap?'
    ],
    competencies: ['sea-01', 'sea-02', 'ctps-02', 'ec-01'],
    stretchCompetencies: ['sdl-04', 'lc-02'],
    sessions: [
      {
        sessionNumber: 3,
        week: 2,
        title: 'Week 2 (Mon–Wed): Universal Design Audit, IR/Vibration Site Survey & Stakeholder Interviews',
        durationMin: 300,
        learningGoal: 'Audit walkability and universal design constraints for wheelchairs, canes, and strollers, survey candidate sites with IR thermometers and vibration apps, and interview facilities stakeholders.',
        activities: [
          'Monday (2 hrs): Conduct a walkability & universal design audit testing surface ergonomics for wheelchairs, canes, and strollers so tiles never create physical barriers.',
          'Tuesday (2 hrs): Survey school hallways, stairs, cafeteria queues, and local park paths using infrared thermometers, decibel/vibration apps, and manual tally counters.',
          'Wednesday (2 hrs): Interview facilities managers, park maintenance staff, and students regarding maintenance access, rainwater drainage, and pedestrian comfort.'
        ],
        learnerChoices: {
          question: 'Which stakeholder insight will most strongly shape your tile housing design?',
          options: [
            { id: 'opt-accessibility-first', label: 'Wheelchair, Stroller & Cane Users', description: 'Keep vertical deflection strictly under 5mm with beveled flush edges and high-grip top surfaces.' },
            { id: 'opt-facilities-maintenance', label: 'School Facilities & Park Maintenance Staff', description: 'Design quick-release waterproof top plates and recessed conduit channels that survive mop/hose cleaning.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your Universal Design Accessibility Audit and written notes from your Facilities/Student Stakeholder Interviews (no voice/audio recording for under-13 learners).',
          targetCompetencies: ['sea-01', 'sea-02', 'ec-01']
        },
        reflectionPrompt: 'Why would an energy-harvesting tile be a failure if it generated high power but felt unstable or unsafe for a wheelchair user or someone using a cane?',
        teacherTips: 'Child Safeguarding: For any learners under 13, use written interview checklists, drawings, or teacher scribing—never use speech-to-text or audio recording.'
      },
      {
        sessionNumber: 4,
        week: 2,
        title: 'Week 2 (Thu–Fri): Activity 1.3 Kinetic & Thermal Heatmap Safari & Empathy Pin-Up',
        durationMin: 300,
        learningGoal: 'Deploy chalk grids, IR thermometers, and accelerometers in Activity 1.3 to synthesize spatial heatmaps of wasted kinetic and thermal energy.',
        activities: [
          'Thursday (2 hrs): Aggregate spatial foot-traffic tally data and IR surface temperature differentials (ΔT) across school stairs, cafeteria queues, playground equipment, and park benches.',
          'Friday (2 hrs): Execute Activity 1.3 (Kinetic & Thermal Heatmap Safari), host the Empathy Map pin-up & critique, and complete the Weekly Reflection focusing on Social & Emotional Aptitude and Self-Directed Learning.'
        ],
        learnerChoices: {
          question: 'Which high-density wasted energy zone will your pod nominate for Phase 2 data logging?',
          options: [
            { id: 'opt-zone-stairs', label: 'School Staircase Landing', description: 'High impact force per footstep during class transitions.' },
            { id: 'opt-zone-cafeteria', label: 'Cafeteria Queue Bottleneck', description: 'concentrated, predictable daily footfalls in a single-file path.' },
            { id: 'opt-zone-park-plaza', label: 'Sunlit Park Bench & Walkway', description: 'Combines pedestrian traffic with high asphalt/metal ΔT thermal gradients.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload your Activity 1.3 Kinetic & Thermal Heatmap Safari map and Week 2 WeLearn Future Skills reflection.',
          targetCompetencies: ['ctps-02', 'sdl-04', 'sea-02']
        },
        reflectionPrompt: 'Where did your Heatmap Safari reveal the biggest gap between perceived foot traffic and actual measured footfalls or thermal gradients?',
        teacherTips: 'Have pods pin their heatmaps side by side so the cohort can compare stair landings, cafeteria queues, and sunlit park benches.'
      }
    ]
  },
  {
    id: 'define',
    title: 'Phase 2: DEFINE — Site Selection, System Specs & Feasibility Framing (Weeks 3–4)',
    strap: 'Phase Driving Question: How much usable electrical power can our chosen site realistically yield per day, and how do we condition erratic spikes of energy into stable DC storage? (Weeks 3–4 • 20 Hours)',
    weeks: [3, 4],
    goal: 'Build and deploy an Arduino/ESP32 48-hour footstep and thermal logger (Activity 2.1), compare 1N4007 silicon vs. 1N5819 Schottky bridge rectifiers charging a 1000µF capacitor (Activity 2.2), define <5mm deflection and IP ratings, and pass Phase Gate 1.',
    tasks: [
      'Week 3 Mon (2 hrs): Quantify human traffic counts into raw energetic units (Joules and Watt-hours).',
      'Week 3 Tue–Wed (4 hrs): Activity 2.1 (DIY IoT Footstep & Thermal Counter) — wire Force-Sensitive Resistors (FSRs), ultrasonic tripwires, or temperature probes to an ESP32 and deploy for 48 hours at the candidate bottleneck.',
      'Week 3 Thu–Fri (4 hrs): Analyze 48-hour CSV datasets using spreadsheets and AI data assistants, and write the formal Engineering Design Brief & Problem Statement.',
      'Week 4 Mon–Tue (4 hrs): Understand AC-to-DC conversion physics and complete Activity 2.2 (The "Lossless" Rectifier Lab) — breadboard full-wave bridge rectifiers comparing standard silicon diodes (1N4007) against low-forward-voltage Schottky diodes (1N5819) charging a 1000µF capacitor from 50 footsteps.',
      'Week 4 Wed–Fri (6 hrs): Define mechanical constraints (max vertical deflection < 5mm for trip-free safety, waterproofing IP ratings), specify target electrical load (air-quality sensor, pathway LEDs, or USB trickle bank), and pass Phase Gate 1 Review.'
    ],
    evidence: [
      'Activity 2.1: 48-Hour ESP32 Footstep & Surface ΔT CSV Dataset + Formal Engineering Design Brief',
      'Activity 2.2: "Lossless" Rectifier Lab Data (1N4007 vs. 1N5819 Schottky on 1000µF Capacitor) & Phase Gate 1 Sign-Off'
    ],
    aiPromptStarters: [
      'Help us calculate how much energy in Joules and Watt-hours is lost across four 1N4007 silicon diodes (0.7V drop each) vs. four 1N5819 Schottky diodes (0.25V drop each) in a full-wave bridge rectifier.',
      'Write an Arduino/ESP32 sketch to log Force-Sensitive Resistor (FSR) step counts and DS18B20/NTC temperature readings to CSV timestamps.',
      'Critique our Phase Gate 1 Engineering Design Brief to verify our target electrical load matches our 48-hour empirical energy budget.'
    ],
    competencies: ['ctps-03', 'ctps-04', 'ec-02', 'sdl-02'],
    stretchCompetencies: ['ctps-05', 'ent-01'],
    sessions: [
      {
        sessionNumber: 5,
        week: 3,
        title: 'Week 3 (Mon–Wed): Traffic-to-Joule Math & Activity 2.1 DIY IoT Footstep/Thermal Logger',
        durationMin: 300,
        learningGoal: 'Translate footstep counts into Joules/Watt-hours and deploy an Arduino/ESP32 automated data logger for 48 hours.',
        activities: [
          'Monday (2 hrs): Perform mathematical translation exercises converting daily foot traffic numbers and ΔT gradients into estimated Joules (J) and Watt-hours (Wh).',
          'Tuesday (2 hrs): Complete Activity 2.1 (DIY IoT Footstep & Thermal Counter) — wire Force-Sensitive Resistors (FSRs), ultrasonic tripwires, or temperature probes to an Arduino/ESP32.',
          'Wednesday (2 hrs): Deploy the automated data loggers in protective enclosures for a 48-hour continuous field count at your chosen school or park bottleneck.'
        ],
        learnerChoices: {
          question: 'Which sensor trigger will your pod wire to the ESP32 for Activity 2.1?',
          options: [
            { id: 'opt-fsr-pad', label: 'Force-Sensitive Resistor (FSR) Step Mat', description: 'Directly logs footstep pressure events and step duration.' },
            { id: 'opt-ultrasonic-gate', label: 'Ultrasonic Beam Tripwire + Dual Temp Probes', description: 'Counts pedestrian passages while logging sunlit vs. shaded ΔT.' }
          ]
        },
        evidenceToCollect: {
          kind: 'code',
          prompt: 'Submit your ESP32 logger wiring diagram/code and initial field deployment checklist for Activity 2.1.',
          targetCompetencies: ['ctps-03', 'sdl-02']
        },
        reflectionPrompt: 'Why is a 48-hour automated sensor log much more reliable for engineering sizing than a 15-minute manual tally?',
        teacherTips: 'Ensure field-deployed ESP32 logger boxes are taped flush against walls or under stair risers so they never pose a trip hazard.'
      },
      {
        sessionNumber: 6,
        week: 3,
        title: 'Week 3 (Thu–Fri): 48-Hour CSV Data Analysis & Formal Engineering Design Brief',
        durationMin: 300,
        learningGoal: 'Analyze the 48-hour CSV sensor dataset and author the formal Engineering Design Brief & Problem Statement.',
        activities: [
          'Thursday (2 hrs): Retrieve the 48-hour CSV logs and analyze peak vs. off-peak traffic and thermal curves using spreadsheets and AI data assistants.',
          'Friday (2 hrs): Write and submit the formal Engineering Design Brief & Problem Statement specifying site location, daily footstep/ΔT baseline, and target daily Joule yield.'
        ],
        learnerChoices: {
          question: 'How will your Engineering Design Brief frame the primary value of your installation?',
          options: [
            { id: 'opt-brief-lighting', label: 'Self-Powered Safety & Wayfinding Lighting', description: 'Store daytime footstep energy to illuminate stairs or park paths at dusk.' },
            { id: 'opt-brief-telemetry', label: 'Batteryless Smart-City Environmental & Traffic Node', description: 'Power an off-grid air-quality sensor, step counter, and e-ink community display.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your 48-Hour CSV Traffic/Thermal Analysis Chart and formal Engineering Design Brief.',
          targetCompetencies: ['ctps-03', 'ec-02']
        },
        reflectionPrompt: 'What peak hours showed the highest energy-harvesting potential in your 48-hour dataset?',
        teacherTips: 'Verify that every pod logs AI prompt provenance if they use AI data assistants to summarize their CSV logs.'
      },
      {
        sessionNumber: 7,
        week: 4,
        title: 'Week 4 (Mon–Tue): AC-to-DC Conversion Physics & Activity 2.2 "Lossless" Rectifier Lab',
        durationMin: 300,
        learningGoal: 'Understand full-wave bridge rectification physics and measure energy savings between 1N4007 silicon and 1N5819 Schottky diodes when charging a 1000µF capacitor.',
        activities: [
          'Monday (2 hrs): Study AC-to-DC conversion physics and why alternating positive/negative piezoelectric and induction voltage spikes require full-wave bridge rectification.',
          'Tuesday (2 hrs): Complete Activity 2.2 (The "Lossless" Rectifier Lab) — breadboard full-wave bridge rectifiers comparing standard silicon diodes (1N4007) against low-forward-voltage Schottky diodes (1N5819), measuring capacitor voltage and stored Joules (E = ½CV²) across a 1000µF electrolytic capacitor after 50 footsteps.'
        ],
        learnerChoices: {
          question: 'Which rectification & capacitor storage topology will your pod adopt?',
          options: [
            { id: 'opt-schottky-bridge', label: '1N5819 Schottky Full-Wave Bridge + 1000µF–10000µF Capacitor Bank', description: 'Minimizes forward voltage drop (~0.25V per diode) to capture micro-energy spikes.' },
            { id: 'opt-dual-bus-supercap', label: 'Multi-Stage Parallel Schottky Bridges + Supercapacitor Buffer', description: 'Isolates each piezo/generator bank with its own Schottky bridge before feeding a 1F–5F supercapacitor.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Activity 2.2 "Lossless" Rectifier Lab table comparing 1N4007 vs. 1N5819 capacitor voltage and stored Joules (E = ½CV²) after 50 footsteps.',
          targetCompetencies: ['ctps-04', 'ctps-03']
        },
        reflectionPrompt: 'How many extra millijoules of energy did the 1N5819 Schottky diodes save compared to standard 1N4007 silicon diodes over 50 footsteps?',
        teacherTips: 'Use the Transducer & Schottky Rectifier tab in the Kinetic Energy Simulator to cross-check students’ E = ½CV² calculations.'
      },
      {
        sessionNumber: 8,
        week: 4,
        title: 'Week 4 (Wed–Fri): <5mm Deflection Specs, Target Load Profile & Phase Gate 1 Review',
        durationMin: 300,
        learningGoal: 'Define strict mechanical (<5mm deflection, IP rating) and electrical load specifications and pass the Phase Gate 1 Design Brief sign-off.',
        activities: [
          'Wednesday (2 hrs): Define strict mechanical and environmental engineering constraints: maximum vertical deflection under 5mm for trip-free ADA safety and IP65–IP67 waterproofing ratings.',
          'Thursday (2 hrs): Specify the target downstream electrical load profile (e.g., air-quality sensor, pathway LEDs, or USB trickle bank) matched to daily Joule capacity.',
          'Friday (2 hrs): Present at Phase Gate 1 Review for formal sign-off on the Design Brief and system specifications, and complete the Week 4 WeLearn Future Skills reflection on Critical Thinking and Digital & AI Fluency.'
        ],
        learnerChoices: {
          question: 'Which downstream "Proof-of-Work" electrical load will your prototype drive?',
          options: [
            { id: 'opt-load-leds-oled', label: 'High-Efficiency Pathway LED Strip + INA219/OLED Joule Meter', description: 'Provides immediate visual feedback on every step plus cumulative energy telemetry.' },
            { id: 'opt-load-eink-sensor', label: 'Ultra-Low-Power E-Ink Display + Environmental Sensor Node', description: 'Retains displayed campus data even when zero footsteps are occurring.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your signed Phase Gate 1 System Specification Sheet (<5mm deflection, IP rating, rectifier schematic, and load power budget).',
          targetCompetencies: ['ctps-04', 'ec-02', 'sdl-04']
        },
        reflectionPrompt: 'Why is limiting vertical tile deflection to under 5mm essential for both pedestrian safety and long-term mechanical durability?',
        teacherTips: 'Do not sign off on Phase Gate 1 until the pod demonstrates that their chosen load’s milliwatt draw matches their realistic daily Joule harvest.'
      }
    ]
  },
  {
    id: 'ideate',
    title: 'Phase 3: IDEATE — Mechanical Concepts & Architectural Integration (Weeks 5–6)',
    strap: 'Phase Driving Question: How can we mechanically amplify tiny deflections into maximum transducer output while blending seamlessly and safely into existing architecture? (Weeks 5–6 • 20 Hours)',
    weeks: [5, 6],
    goal: 'Explore compliant mechanisms and force amplification, build 3 low-fidelity linkages in Activity 3.1 (60-Minute Cardboard Kinematics), select a winning architecture via Pugh Matrix, and model the scaled architectural site plan in Activity 3.2 (Digital Twin Retrofit Studio).',
    tasks: [
      'Week 5 Mon–Tue (4 hrs): SCAMPER & biomimicry ideation session + force amplification mechanics (compliant mechanisms, cantilevers, rack-and-pinion gears, elastomer springs).',
      'Week 5 Wed (2 hrs): Activity 3.1 (60-Minute Cardboard Kinematics) — build 3 distinct low-fidelity mechanical linkages (diamond flexure, spring-loaded plunger, cantilevered beam) out of cardboard, EVA foam, and dowels to see which geometry best compresses piezo arrays without cracking ceramic discs.',
      'Week 5 Thu–Fri (4 hrs): Parallel vs. series transducer array experiments + Pugh Decision Matrix to select the winning prototype architecture.',
      'Week 6 Mon–Wed (6 hrs): Master architectural drafting standards (scale, plan view, section view, elevation), model 2D/3D site in CAD (SketchUp, AutoCAD, or Fusion 360), and run AI-assisted generative visualization and structural load checking.',
      'Week 6 Thu–Fri (4 hrs): Integrate power routing, underground conduit paths, and maintenance access into the site plan, and host the Activity 3.2 (Digital Twin Retrofit Studio) Mid-Program Pin-Up with a guest architect or civil engineer.'
    ],
    evidence: [
      'Activity 3.1: 3 Cardboard/Foam Kinematic Linkage Prototypes + Pugh Decision Matrix',
      'Activity 3.2: Draft 1 Scaled Architectural Site Plan (Tile Array Geometry, Cable Trenching, Battery Housing & Pin-Up Feedback)'
    ],
    aiPromptStarters: [
      'Compare a diamond compliant flexure, a cantilevered beam, and a rack-and-pinion plunger for amplifying a <5mm vertical footstep into uniform transducer compression.',
      'Help us set up a weighted Pugh Decision Matrix scoring our 3 mechanical linkage concepts across energy yield, <5mm trip-free safety, durability, and BOM cost.',
      'What architectural symbols and callouts should we include on our scaled site plan for underground conduit paths, drainage channels, and battery service hatches?'
    ],
    competencies: ['ct-01', 'ct-02', 'lc-03', 'ec-04'],
    stretchCompetencies: ['ct-04', 'sea-03'],
    sessions: [
      {
        sessionNumber: 9,
        week: 5,
        title: 'Week 5 (Mon–Wed): Force Amplification Mechanics & Activity 3.1 Cardboard Kinematics',
        durationMin: 300,
        learningGoal: 'Apply SCAMPER and force-amplification mechanics to build 3 low-fidelity kinematic linkages out of cardboard, EVA foam, and dowels.',
        activities: [
          'Monday (2 hrs): Run SCAMPER and biomimicry ideation sessions focused on capturing urban footstep and thermal energy.',
          'Tuesday (2 hrs): Study mechanical force amplification mechanics: compliant mechanisms, cantilevers, rack-and-pinion gears, and elastomer spring systems.',
          'Wednesday (2 hrs): Complete Activity 3.1 (60-Minute Cardboard Kinematics) — build 3 distinct low-fidelity linkages (diamond flexure, spring-loaded plunger, cantilevered beam) out of cardboard, EVA foam, and dowels to test how to compress piezo arrays without cracking the ceramic discs.'
        ],
        learnerChoices: {
          question: 'Which mechanical force-amplification linkage performed best in your Activity 3.1 bench test?',
          options: [
            { id: 'opt-diamond-flexure', label: 'Diamond Compliant Flexure Frame', description: 'Converts a 3mm downward step into wide lateral compression across multiple piezo discs.' },
            { id: 'opt-cantilever-beam', label: 'Tuned Cantilever Resonant Beam', description: 'Allows each footstep strike to ring at natural frequency for multiple voltage oscillations.' },
            { id: 'opt-spring-plunger', label: 'Elastomer Spring-Return Gear Plunger', description: 'Drives a compact rotary micro-generator on both the down-stroke and rebound stroke.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Submit photos of your 3 Activity 3.1 Cardboard & EVA Foam kinematic linkages and compression test notes.',
          targetCompetencies: ['ct-01', 'ct-02']
        },
        reflectionPrompt: 'How did building rapid cardboard and EVA foam linkages reveal mechanical binding or ceramic cracking risks that weren’t obvious on paper?',
        teacherTips: 'Keep Activity 3.1 strictly time-boxed and hands-on so pods test 3 genuinely different mechanisms before choosing one.'
      },
      {
        sessionNumber: 10,
        week: 5,
        title: 'Week 5 (Thu–Fri): Series vs. Parallel Array Bench Tests & Pugh Decision Matrix',
        durationMin: 300,
        learningGoal: 'Empirically test series vs. parallel transducer wiring and select the winning prototype architecture using a Pugh Decision Matrix.',
        activities: [
          'Thursday (2 hrs): Conduct empirical bench testing of series (voltage boost) vs. parallel (current boost) vs. series-parallel transducer array configurations.',
          'Friday (2 hrs): Evaluate all 3 mechanical/electrical architectures through a weighted Pugh Decision Matrix to select the winning prototype design.'
        ],
        learnerChoices: {
          question: 'Which transducer array wiring topology won your bench experiment?',
          options: [
            { id: 'opt-series-parallel-bank', label: '4×6 Series-Parallel Hybrid Matrix', description: 'Balances voltage threshold to overcome diode drop while multiplying charging current.' },
            { id: 'opt-parallel-current', label: 'Rectified Parallel Current Bus', description: 'Each transducer element is rectified into a shared low-impedance current bus.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Series vs. Parallel Bench Test Data and completed Pugh Decision Matrix.',
          targetCompetencies: ['ctps-04', 'lc-03']
        },
        reflectionPrompt: 'Why does wiring piezoelectric discs purely in series increase open-circuit voltage without proportionally increasing total harvested energy?',
        teacherTips: 'Verify that every pod’s Pugh Decision Matrix includes universal design (<5mm deflection) and weatherproofing as mandatory criteria.'
      },
      {
        sessionNumber: 11,
        week: 6,
        title: 'Week 6 (Mon–Wed): Architectural Drafting Standards, 2D/3D CAD & Load Simulation',
        durationMin: 300,
        learningGoal: 'Model the target school or park retrofit site in 2D/3D CAD (SketchUp, AutoCAD, or Fusion 360) and verify structural loads.',
        activities: [
          'Monday (2 hrs): Master architectural drafting standards and conventions: scale rules, plan views, section cuts, and elevation drawings.',
          'Tuesday (2 hrs): Laser-measure the target school staircase, corridor, or park plaza and create a scaled 2D/3D digital site model in SketchUp, AutoCAD, or Fusion 360.',
          'Wednesday (2 hrs): Use AI-assisted generative visualization and structural load-checking simulations to verify tile placement and aesthetic integration.'
        ],
        learnerChoices: {
          question: 'Which CAD and drafting workflow will your Architectural Lead use for Deliverable #2?',
          options: [
            { id: 'opt-fusion-360', label: 'Fusion 360 / AutoCAD Parametric Package', description: 'Combines mechanical tile assembly views with scaled architectural site plans.' },
            { id: 'opt-sketchup-arch', label: 'SketchUp 3D Urban Plaza + Scaled Section Cutaways', description: 'Models pedestrian flow, drainage trenches, and street furniture integration.' }
          ]
        },
        evidenceToCollect: {
          kind: 'code',
          prompt: 'Submit your Draft 1 2D/3D CAD site model screenshots showing scale bars, plan view, and section cut.',
          targetCompetencies: ['ec-04', 'ct-04']
        },
        reflectionPrompt: 'How does viewing your tile array in a scaled architectural section cut change how you think about sub-surface drainage and concrete depth?',
        teacherTips: 'Remind students to log AI prompt provenance if they use generative visualization tools during Wednesday’s studio.'
      },
      {
        sessionNumber: 12,
        week: 6,
        title: 'Week 6 (Thu–Fri): Conduit Routing & Activity 3.2 Digital Twin Retrofit Mid-Program Pin-Up',
        durationMin: 300,
        learningGoal: 'Integrate power routing, underground conduit paths, and maintenance access into the site plan and defend Draft 1 at the Mid-Program Pin-Up.',
        activities: [
          'Thursday (2 hrs): Integrate infrastructure services into the site plan: power routing, underground conduit pathways, weatherproof junction boxes, and maintenance access points.',
          'Friday (2 hrs): Present Activity 3.2 (Digital Twin Retrofit Studio) at the Mid-Program Pin-Up with a guest architect or civil engineer, and complete the Week 6 WeLearn Future Skills reflection on Collaboration & Leadership and Digital & AI Fluency.'
        ],
        learnerChoices: {
          question: 'Where will your site plan house the energy storage bank and telemetry controller?',
          options: [
            { id: 'opt-adjacent-bollard', label: 'Above-Ground Smart Bollard / Totem Kiosk', description: 'Keeps supercapacitors, ESP32, and OLED display at eye level and safe from ground flooding.' },
            { id: 'opt-recessed-vault', label: 'IP67 Recessed Sidewalk Service Vault', description: 'Flush utility hatch with transparent polycarbonate telemetry window.' }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Submit your Activity 3.2 Digital Twin Retrofit Site Plan and guest architect/engineer Mid-Program Pin-Up critique notes.',
          targetCompetencies: ['ec-04', 'lc-03', 'sea-03']
        },
        reflectionPrompt: 'What infrastructure detail (drainage, cable trenching, or wheelchair bevels) did the Mid-Program Pin-Up help your pod improve?',
        teacherTips: 'Have pods record every red-line suggestion from the Mid-Program Pin-Up so it can be incorporated into the final Week 9 A1 blueprint.'
      }
    ]
  },
  {
    id: 'prototype',
    title: 'Phase 4: PROTOTYPE — Electro-Mechanical Fabrication & Blueprinting (Weeks 7–9)',
    strap: 'Phase Driving Question: How do we engineer a weather-resistant, full-scale working prototype and a construction-grade architectural blueprint? (Weeks 7–9 • 30 Hours)',
    weeks: [7, 9],
    goal: 'Fabricate the sub-surface chassis, complete Activity 4.1 (Piezo/Hybrid Array Matrix Soldering in silicone shock mounts), build the real-time INA219 + OLED telemetry dashboard in Activity 4.2, freeze Prototype V1.0, and plot the 3-panel A1 Architectural Blueprint in Activity 4.3.',
    tasks: [
      'Week 7 Mon–Tue (4 hrs): CAD modeling of internal tile mounts, spring retainers, and transducer beds + 3D printing internal brackets and laser-cutting/CNC-routing structural plates (plywood, acrylic, or recycled HDPE).',
      'Week 7 Wed–Fri (6 hrs): Activity 4.1 (Piezo/Hybrid Array Matrix Soldering) — solder 12–24 piezoelectric elements (or hybrid piezo + micro-generator modules) into optimized series-parallel banks encased in silicone/neoprene shock mounts, solder perfboard/PCB rectifier and supercapacitor banks, and run sub-assembly checks.',
      'Week 8 Mon–Tue (4 hrs): Structural top-plate assembly & elastomeric weather sealing + integrating the "Proof-of-Work" output load (low-power LED strip, e-ink display, or microcontroller step-counter).',
      'Week 8 Wed–Fri (6 hrs): Activity 4.2 (Smart Tile Telemetry Build) — wire INA219 current sensors and OLED screens displaying Instantaneous Voltage (V), Cumulative Joules Harvested (J), and Total Footsteps/Thermal Watt-Hours + mechanical rebound/trip-hazard audit + Prototype V1.0 freeze.',
      'Week 9 Mon–Fri (10 hrs): Activity 4.3 (Full-Sheet Engineering Blueprint Production) — generate exploded isometric CAD views, draft KiCad/Fritzing electrical schematics, lay out the 3-panel A1/Arch D Architectural Blueprint (Site Plan + Cross-Section + Exploded Mechanical Detail + Wiring Schematic), perform peer red-lining, and plot final blueprints.'
    ],
    evidence: [
      'Deliverable #1 (Prototype V1.0): Working Weather-Sealed Kinetic/Thermal Tile with Silicone Shock Mounts, Schottky Rectifier, Supercapacitor & Live INA219/OLED Telemetry',
      'Deliverable #2 (Final Plotted Blueprint): 3-Panel A1/Arch D Architectural & Engineering Blueprint Package (Site Plan, Cross-Section, Exploded Isometric Assembly & KiCad/Fritzing Schematic)'
    ],
    aiPromptStarters: [
      'Help us write the Arduino/ESP32 code for an INA219 sensor and SSD1306 OLED screen to integrate instantaneous power over time into Cumulative Joules (J) and Watt-hours (Wh).',
      'What silicone or neoprene durometer shore hardness best cushions 35mm piezoelectric discs against heavy jumps while transferring footstep force efficiently?',
      'Review our 3-panel A1 Architectural Blueprint checklist to make sure our dimension callouts, tolerance notes, scale bars, and KiCad wiring labels are complete.'
    ],
    competencies: ['ct-05', 'sdl-03', 'lc-04', 'ec-05'],
    stretchCompetencies: ['ctps-05', 'sea-03'],
    sessions: [
      {
        sessionNumber: 13,
        week: 7,
        title: 'Week 7 (Mon–Wed): Sub-Surface Chassis CNC/3D Fabrication & Transducer Array Mounting',
        durationMin: 300,
        learningGoal: 'Fabricate structural plates and internal brackets using 3D printing and laser/CNC routing, and mount the primary transducer array.',
        activities: [
          'Monday (2 hrs): Finalize precise CAD models for internal tile mounts, spring retainers, deflection stops (<5mm), and transducer beds.',
          'Tuesday (2 hrs): 3D print internal brackets and laser-cut or CNC-route structural plates from plywood, acrylic, or recycled HDPE.',
          'Wednesday (2 hrs): Mount and wire primary transducer element arrays (12–24 piezo discs in series-parallel banks, electromagnetic spring generators, or Peltier heat-pipe blocks).'
        ],
        learnerChoices: {
          question: 'Which structural plate material will form the load-bearing top and base of your tile?',
          options: [
            { id: 'opt-hdpe-plywood', label: 'Recycled HDPE & Marine Plywood Sandwich', description: 'High impact toughness, weather resistance, and controlled flexural rebound.' },
            { id: 'opt-acrylic-aluminum', label: 'Textured Polycarbonate/Acrylic + Aluminum Rib Frame', description: 'Allows visitors to see internal LEDs and transducer arrays through a clear viewing window.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Submit photos of your CNC/laser-cut chassis plates, 3D-printed retainers, and mounted transducer array.',
          targetCompetencies: ['ct-05', 'sdl-03']
        },
        reflectionPrompt: 'How do your internal mechanical hard-stops prevent a heavy jump from deflecting the tile past 5mm or crushing the transducers?',
        teacherTips: 'Enforce eye protection, fume extraction, and machine guards during all laser-cutting, CNC-routing, and soldering sessions.'
      },
      {
        sessionNumber: 14,
        week: 7,
        title: 'Week 7 (Thu–Fri): Activity 4.1 Piezo/Hybrid Matrix Soldering & Sub-Assembly Check',
        durationMin: 300,
        learningGoal: 'Solder permanent Schottky bridge rectifier and supercapacitor circuits on perfboard/PCB in silicone shock mounts and verify sub-assembly continuity.',
        activities: [
          'Thursday (2 hrs): Complete Activity 4.1 (Piezo/Hybrid Array Matrix Soldering) — solder 12–24 piezoelectric elements (or hybrid piezo + micro-generator modules) into optimized series-parallel banks encased in silicone/neoprene shock mounts, connected to a soldered perfboard/PCB Schottky rectifier and supercapacitor bank.',
          'Friday (2 hrs): Conduct initial sub-assembly integration checks, bench-testing mechanical movement and electrical continuity before sealing the enclosure.'
        ],
        learnerChoices: {
          question: 'How will your pod protect soldered leads from mechanical fatigue under repeated footsteps?',
          options: [
            { id: 'opt-silicone-strain-relief', label: 'Silicone Shock Mounts + Stranded Wire Strain Relief Loops', description: 'Absorbs shear vibration and prevents brittle solder joint cracking.' },
            { id: 'opt-spring-pogo-contacts', label: 'Gold Pogo-Pin / Terminal Block Busbars', description: 'Allows modular replacement of individual transducer banks during maintenance.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Submit close-up photos of your soldered perfboard/PCB rectifier, supercapacitor bank, and silicone/neoprene shock mounts (Activity 4.1).',
          targetCompetencies: ['ct-05', 'ctps-04']
        },
        reflectionPrompt: 'Why is strain relief and silicone shock mounting critical when soldering wires to vibrating piezoelectric or electromagnetic harvesters?',
        teacherTips: 'Inspect every pod’s supercapacitor polarity and diode orientation with a multimeter before applying heavy footstep loads.'
      },
      {
        sessionNumber: 15,
        week: 8,
        title: 'Week 8 (Mon–Wed): Weatherproofing, Proof-of-Work Load & Activity 4.2 Smart Tile Telemetry Build',
        durationMin: 300,
        learningGoal: 'Assemble weather-sealed top plates, connect the Proof-of-Work output load, and wire the INA219 + OLED real-time telemetry dashboard (Activity 4.2).',
        activities: [
          'Monday (2 hrs): Execute structural top-plate assembly and elastomeric weather-sealing gasket installation.',
          'Tuesday (2 hrs): Integrate the active "Proof-of-Work" output load (low-power LED strip, e-ink display, or microcontroller step-counter).',
          'Wednesday (2 hrs): Complete Activity 4.2 (Smart Tile Telemetry Build) — wire an INA219 current sensor and OLED screen (or live serial plotter) displaying Instantaneous Voltage (V), Cumulative Joules Harvested (J), and Total Footsteps/Thermal Watt-Hours in real time.'
        ],
        learnerChoices: {
          question: 'How will your Activity 4.2 telemetry display communicate harvested energy to passersby?',
          options: [
            { id: 'opt-oled-dashboard', label: 'Embedded OLED Screen + LED Pulse Bar', description: 'Displays live Volts (V), Cumulative Joules (J), and Step Count right on the tile.' },
            { id: 'opt-serial-kiosk', label: 'ESP32 Live Serial/Web Dashboard + E-Ink Counter', description: 'Streams real-time waveform graphs to a display easel while updating a zero-standby e-ink screen.' }
          ]
        },
        evidenceToCollect: {
          kind: 'code',
          prompt: 'Submit your Activity 4.2 telemetry code and a photo/screenshot of your OLED or serial dashboard displaying live V, J, and footsteps.',
          targetCompetencies: ['ct-05', 'ec-05']
        },
        reflectionPrompt: 'How does making invisible micro-energy visible in real time (Volts and Joules per step) change how people interact with your tile?',
        teacherTips: 'Ensure the telemetry microcontroller is powered separately or factored transparently into the net energy balance so students never confuse sensor draw with harvested output.'
      },
      {
        sessionNumber: 16,
        week: 8,
        title: 'Week 8 (Thu–Fri): Rebound & Trip-Hazard Safety Audit + Prototype V1.0 Freeze',
        durationMin: 300,
        learningGoal: 'Stress-test mechanical rebound elasticity, slip resistance, and <5mm trip-hazard compliance, and complete the Prototype V1.0 freeze.',
        activities: [
          'Thursday (2 hrs): Perform mechanical stress and safety compliance tests: verify <5mm vertical deflection, rapid spring/elastomer rebound, non-slip surface friction, and bevel edge safety.',
          'Friday (2 hrs): Complete official Prototype V1.0 freeze and comprehensive safety audit sign-off prior to public hallway testing.'
        ],
        learnerChoices: {
          question: 'Which safety enhancement did your pod add to pass the Week 8 trip-hazard and slip audit?',
          options: [
            { id: 'opt-anti-slip-bevel', label: 'High-Grip Abrasive Tread Tape + 1:12 Beveled Transition Ramp', description: 'Eliminates edge catch for shoes, canes, wheelchairs, and strollers.' },
            { id: 'opt-recessed-tray', label: 'Flush Mat Carrier Frame', description: 'Surrounds the active tile with a level transition mat so the surface is completely flush.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your signed Prototype V1.0 Safety & Deflection Audit Sheet confirming <5mm vertical deflection and slip resistance.',
          targetCompetencies: ['sea-02', 'lc-04', 'sdl-03']
        },
        reflectionPrompt: 'What mechanical adjustment was needed so your tile rebounds crisp and level after every single footstep?',
        teacherTips: 'No prototype may be placed in a school hallway in Week 10 unless it passes Friday’s <5mm deflection and non-slip safety audit.'
      },
      {
        sessionNumber: 17,
        week: 9,
        title: 'Week 9 (Mon–Wed): Exploded Isometric CAD Views, KiCad Schematics & Multi-Sheet Layout',
        durationMin: 300,
        learningGoal: 'Generate exploded isometric CAD views and KiCad/Fritzing electrical schematics, and lay out the multi-sheet Architectural Blueprint.',
        activities: [
          'Monday (2 hrs): Generate exploded isometric assembly views of the prototype in CAD showing every internal layer from top plate to transducer bed.',
          'Tuesday (2 hrs): Draft clean electrical schematic documentation using KiCad or Fritzing (transducer bank, 1N5819 Schottky bridge rectifier, supercapacitor, INA219, and load).',
          'Wednesday (2 hrs): Lay out the multi-sheet Architectural Blueprint combining the Site Plan, Cross-Sectional Installation Detail, Exploded Mechanical Detail, and Wiring Schematic.'
        ],
        learnerChoices: {
          question: 'How will your 3-panel A1/Arch D blueprint visually connect the macro site plan to the micro tile electronics?',
          options: [
            { id: 'opt-zoom-callouts', label: 'Macro-to-Micro Zoom Callout Panels (1:100 Site -> 1:5 Section -> 1:1 Exploded Tile)', description: 'Guides the viewer from the campus walkway down into the sub-surface pavement cutaway.' },
            { id: 'opt-layered-isometric', label: 'Stacked Architectural & Electrical Isometric Sheets', description: 'Aligns the surface paving plan directly above the conduit trenching and wiring schematic.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Submit your Exploded Isometric CAD View and KiCad/Fritzing Electrical Schematic draft.',
          targetCompetencies: ['ec-04', 'ec-05']
        },
        reflectionPrompt: 'Why does a construction-grade blueprint require both a macro architectural site plan and a micro cross-sectional pavement cutaway?',
        teacherTips: 'Check that students include standard title blocks, scale bars, millimeter dimensions, and diode/capacitor part values.'
      },
      {
        sessionNumber: 18,
        week: 9,
        title: 'Week 9 (Thu–Fri): Peer Blueprint Red-Lining & Activity 4.3 Full-Sheet A1 Blueprint Production',
        durationMin: 300,
        learningGoal: 'Conduct peer technical red-line reviews and plot the final 3-panel A1/Arch D Architectural & Engineering Blueprint package (Deliverable #2).',
        activities: [
          'Thursday (2 hrs): Perform peer red-line technical reviews, cross-checking blueprints for dimensioning errors, tolerance gaps, accessibility bevels, drainage slopes, and scale bar accuracy.',
          'Friday (2 hrs): Complete Activity 4.3 (Full-Sheet Engineering Blueprint Production) — final plotting/printing of the 3-panel A1/Arch D blueprint package + Weekly Reflection on Self-Directed Learning and Communication in All Forms.'
        ],
        learnerChoices: {
          question: 'Which technical detail did your pod refine during Thursday’s peer red-line review?',
          options: [
            { id: 'opt-redline-drainage', label: 'Sub-Surface Water Drainage & IP Gasket Tolerances', description: 'Added weep-hole drainage channels and watertight cable glands to the cross-section.' },
            { id: 'opt-redline-dimensions', label: 'Millimeter Deflection & Fastener Callouts', description: 'Clarified exact spring travel limits, screw clearances, and ADA bevel angles.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload your final Deliverable #2: 3-Panel A1/Arch D Architectural & Engineering Blueprint Package and Week 9 reflection.',
          targetCompetencies: ['ec-04', 'ec-05', 'sdl-04']
        },
        reflectionPrompt: 'How did peer red-lining help catch dimensioning or installation issues before final plotting?',
        teacherTips: 'Have pods mount their plotted A1 blueprints on display boards ready for the Week 12 Smart City Expo.'
      }
    ]
  },
  {
    id: 'test',
    title: 'Phase 5 (Part A): TEST & ANALYZE — 1,000-Footstep Stress Test & Cost-Benefit Report (Weeks 10–11)',
    strap: 'Phase Driving Question: Under real-world conditions, what is the true financial, environmental, and social Return on Investment of our system? (Weeks 10–11 • 20 Hours)',
    weeks: [10, 11],
    goal: 'Calibrate mechanical-to-electrical conversion efficiency, subject the prototype to Activity 5.1 (The 1,000-Footstep Stress Test), iterate to Prototype V2.0, and author Deliverable #3 (Cost-Benefit Energy Analysis Report) using Activity 5.2 (The "Honest ROI" Financial Simulator).',
    tasks: [
      'Week 10 Mon (2 hrs): Execute controlled laboratory calibration tests (drop-weight testing from known heights to calculate exact mechanical-to-electrical efficiency % = E_electrical / mgh).',
      'Week 10 Tue–Wed (4 hrs): Activity 5.1 (The 1,000-Footstep Stress Test) — install prototypes in a supervised school hallway or park path for live user testing across 1,000 continuous footsteps, recording capacitor charge curves, mechanical wear, and user slip/comfort ratings.',
      'Week 10 Thu–Fri (4 hrs): Repair mechanical fatigue, loose solder joints, or rebound lag to produce Prototype V2.0, and lock in final empirical datasets.',
      'Week 11 Mon–Tue (4 hrs): Calculate Bill of Materials (BOM) cost scaling (single-unit prototype vs. 100 vs. 10,000 units), annual kWh output at scale, grid electricity offset ($/kWh), and carbon abatement.',
      'Week 11 Wed–Fri (6 hrs): Activity 5.2 (The "Honest ROI" Financial Simulator) — model Payback Period, Net Present Value (NPV), and Levelized Cost of Energy (LCOE) comparing tile cost per Watt against solar PV, and write/polish Deliverable #3 (Cost-Benefit Energy Analysis Report).'
    ],
    evidence: [
      'Activity 5.1: Drop-Weight Efficiency Calibration + 1,000-Footstep Stress Test Dataset & Prototype V2.0 Upgrade Log',
      'Deliverable #3: Cost-Benefit Energy Analysis Report & Activity 5.2 "Honest ROI" Financial Simulator Spreadsheet (BOM 1/100/10,000 Units, LCOE & Solar PV Comparison)'
    ],
    aiPromptStarters: [
      'If a 5kg weight dropped from 0.05m (E_potential = mgh = 2.45 Joules) charges our 1000µF capacitor from 0V to 18V (E_elec = ½CV² = 0.162 Joules), what is our mechanical-to-electrical conversion efficiency?',
      'Help us model our Levelized Cost of Energy (LCOE) and compare our kinetic tile’s $/Watt against rooftop solar PV—where does kinetic/thermal harvesting genuinely make economic sense?',
      'Review our Deliverable #3 Cost-Benefit Energy Analysis Report to ensure we transparently evaluate both direct kWh value and smart-sensor/educational co-benefits.'
    ],
    competencies: ['ctps-05', 'ent-01', 'ent-02', 'sdl-04'],
    stretchCompetencies: ['ent-03', 'sea-03'],
    sessions: [
      {
        sessionNumber: 19,
        week: 10,
        title: 'Week 10 (Mon–Wed): Drop-Weight Efficiency Calibration & Activity 5.1 (1,000-Footstep Stress Test)',
        durationMin: 300,
        learningGoal: 'Calculate exact mechanical-to-electrical efficiency via drop-weight calibration and subject the prototype to 1,000 continuous footsteps in Activity 5.1.',
        activities: [
          'Monday (2 hrs): Execute controlled lab calibration using drop-weight testing from known heights (E_in = mgh) vs. capacitor energy captured (E_out = ½CV²) to calculate exact mechanical-to-electrical efficiency %.',
          'Tuesday (2 hrs): Install prototypes in a supervised school hallway or park pathway with flush transition ramps for live pedestrian testing.',
          'Wednesday (2 hrs): Complete Activity 5.1 (The 1,000-Footstep Stress Test) — record capacitor charge curves, peak/average Joules per step, mechanical wear, and qualitative user slip/comfort ratings across 1,000 footsteps.'
        ],
        learnerChoices: {
          question: 'What primary metric will your Data & Finance Analyst track during the 1,000-Footstep Stress Test?',
          options: [
            { id: 'opt-charge-curve', label: 'Capacitor Voltage & Cumulative Joule Curve (Steps 1 to 1,000)', description: 'Measures energy harvested per 100-step interval and checks for output degradation.' },
            { id: 'opt-ergonomic-rating', label: 'Pedestrian Comfort, Rebound Speed & Accessibility Survey', description: 'Logs user feedback on underfoot feel, noise level, and trip-free stability.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Drop-Weight Efficiency Calculation (%) and Activity 5.1 (1,000-Footstep Stress Test) capacitor charge curve dataset.',
          targetCompetencies: ['ctps-05', 'sdl-03']
        },
        reflectionPrompt: 'What happened to your tile’s mechanical rebound and electrical output between footstep #1 and footstep #1,000?',
        teacherTips: 'Supervise hallway installations closely and keep a clear bypass lane open for pedestrians at all times.'
      },
      {
        sessionNumber: 20,
        week: 10,
        title: 'Week 10 (Thu–Fri): Fixing Mechanical Fatigue (Prototype V2.0) & Empirical Data Lock',
        durationMin: 300,
        learningGoal: 'Repair mechanical fatigue, loose solder joints, or rebound lag discovered during the 1,000-step test to freeze Prototype V2.0 and lock empirical data.',
        activities: [
          'Thursday (2 hrs): Diagnose and repair mechanical fatigue, loose solder joints, cracked piezo mounts, or spring rebound lag to upgrade the hardware to Prototype V2.0.',
          'Friday (2 hrs): Re-verify output stability and lock in the final empirical performance dataset (Joules/step, Watts/m², and daily Wh projection) for Week 11 financial modeling.'
        ],
        learnerChoices: {
          question: 'Which Prototype V2.0 durability upgrade made the biggest difference after your 1,000-step stress test?',
          options: [
            { id: 'opt-v2-elastomer', label: 'Upgraded High-Rebound Elastomer/Spring Return & Locknuts', description: 'Eliminated rebound lag and prevented fastener loosening under rapid footsteps.' },
            { id: 'opt-v2-potting', label: 'Epoxy/Silicone Strain-Relief Potting on Solder Busbars', description: 'Prevented wire fatigue at transducer solder pads.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your Prototype V1.0 -> V2.0 Engineering Iteration Log and locked Empirical Performance Summary.',
          targetCompetencies: ['ctps-05', 'sea-03', 'sdl-04']
        },
        reflectionPrompt: 'How did navigating hardware fatigue or solder failures during the 1,000-footstep test build your team’s engineering resilience?',
        teacherTips: 'Celebrate honest failure analysis: finding and fixing a mechanical weak spot at step #600 is real engineering.'
      },
      {
        sessionNumber: 21,
        week: 11,
        title: 'Week 11 (Mon–Wed): BOM Scaling (1/100/10,000 Units) & Activity 5.2 "Honest ROI" Simulator',
        durationMin: 300,
        learningGoal: 'Model Bill of Materials (BOM) scaling, annual kWh, carbon abatement, LCOE, and Payback Period vs. solar PV in Activity 5.2.',
        activities: [
          'Monday (2 hrs): Calculate comprehensive Bill of Materials (BOM) cost scaling: compare single-unit prototype cost against bulk manufacturing estimates at 100 units and 10,000 units.',
          'Tuesday (2 hrs): Calculate annual kWh generation at scale, grid electricity cost offsets ($/kWh), and annual carbon abatement (kg CO2).',
          'Wednesday (2 hrs): Complete Activity 5.2 (The "Honest ROI" Financial Simulator) — build an interactive spreadsheet model comparing your tile’s cost per Watt and Levelized Cost of Energy (LCOE) against solar PV, identifying where kinetic/thermal harvesting genuinely makes economic sense (batteryless IoT sensors, off-grid safety lighting, high-density transit gates).'
        ],
        learnerChoices: {
          question: 'Where does your "Honest ROI" analysis show kinetic/thermal harvesting provides the strongest real-world value?',
          options: [
            { id: 'opt-roi-iot-sensing', label: 'Batteryless IoT Foot-Traffic Sensing & Off-Grid Safety Lighting', description: 'Eliminates costly battery replacements and trenching mains AC wires in retrofits.' },
            { id: 'opt-roi-civic-engagement', label: 'High-Density Transit Bottlenecks + Public Energy Literacy', description: 'Combines continuous micro-power in shaded indoor corridors with interactive public engagement.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Activity 5.2 "Honest ROI" Financial Simulator table (BOM at 1 / 100 / 10,000 units, annual kWh, LCOE, Payback Period, and Solar PV comparison).',
          targetCompetencies: ['ent-01', 'ent-02', 'ctps-05']
        },
        reflectionPrompt: 'Why is an "Honest ROI" analysis that admits solar PV is cheaper for bulk grid power—while showing where kinetic tiles win for batteryless indoor/shaded IoT sensing—much more persuasive to city planners than hype?',
        teacherTips: 'Use Tab 3 of the Kinetic Energy Simulator so students can test BOM scaling (1 vs. 100 vs. 10,000 units) and LCOE side by side with solar PV.'
      },
      {
        sessionNumber: 22,
        week: 11,
        title: 'Week 11 (Thu–Fri): Authoring & Peer-Reviewing Deliverable #3 (Cost-Benefit Energy Analysis Report)',
        durationMin: 300,
        learningGoal: 'Write, format, and polish the formal Deliverable #3 Cost-Benefit Energy Analysis Report.',
        activities: [
          'Thursday (2 hrs): Author and format Deliverable #3 (Cost-Benefit Energy Analysis Report) anchored in your 1,000-footstep empirical data, BOM scaling table, LCOE, NPV/Payback analysis, and co-benefit evaluation.',
          'Friday (2 hrs): Conduct peer review sessions on report drafts and polish the executive summary for municipal and school facilities decision-makers.'
        ],
        learnerChoices: {
          question: 'What executive recommendation will conclude your Cost-Benefit Energy Analysis Report?',
          options: [
            { id: 'opt-rec-pilot', label: 'Targeted 20-Tile Bottleneck Pilot + Batteryless Telemetry Node', description: 'Recommends a high-traffic stair/queue installation with high sensor and safety ROI.' },
            { id: 'opt-rec-hybrid', label: 'Hybrid Solar + Kinetic/Thermal Micro-Grid', description: 'Pairs rooftop/canopy solar PV with kinetic step-pads for 24/7 interactive pathway lighting.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Upload your completed Deliverable #3: Cost-Benefit Energy Analysis Report including Executive Summary, BOM, LCOE, and Honest ROI trade-offs.',
          targetCompetencies: ['ent-02', 'ec-02', 'ctps-05']
        },
        reflectionPrompt: 'If you were the school facilities director with a limited sustainability budget, what part of your Cost-Benefit Report would convince you to approve a pilot?',
        teacherTips: 'Ensure every pod’s report cites their actual Week 10 measured Joules/step rather than theoretical manufacturer maximums.'
      }
    ]
  },
  {
    id: 'share',
    title: 'Phase 5 (Part B): PITCH & SHOWCASE — Smart City Expo & Civic Pitch (Week 12)',
    strap: 'Phase Driving Question: Under real-world conditions, what is the true financial, environmental, and social Return on Investment of our system? (Week 12 • 10 Hours)',
    weeks: [12, 12],
    goal: 'Choreograph the live demo, fabricate the exhibition booth with interactive step-pads and live telemetry screens, rehearse Municipal Review Board Q&A, host Activity 5.3 (Interactive Civic Pitch & Live Watt-Meter Demo), and defend the WeLearn 7 Future Skills mastery portfolio.',
    tasks: [
      'Week 12 Mon–Tue (4 hrs): Storytelling, TED-style pitch deck design, and live demo choreography + exhibition booth fabrication (setting up interactive step-pads, 3-panel A1 blueprint easels, and live INA219/OLED telemetry screens).',
      'Week 12 Wed (2 hrs): Dress rehearsal & tough Q&A prep ("Shark Tank" / Municipal Review Board style).',
      'Week 12 Thu (2 hrs): Activity 5.3 (Interactive Civic Pitch & Live Watt-Meter Demo) — Public Smart Cities Innovation Showcase where school leadership, local urban planners, and parents step directly onto each team’s prototype to trigger real-time visual feedback while students present their Architectural Blueprint and defend their Cost-Benefit Analysis.',
      'Week 12 Fri (2 hrs): Post-project retrospective & WeLearn 7 Future Skills mastery portfolio defense focusing on Entrepreneurship, Critical Thinking, and Communication in All Forms.'
    ],
    evidence: [
      'Activity 5.3: Smart City Expo Exhibition Booth Setup, TED-Style Civic Pitch Deck & Municipal Review Board Q&A Defense Notes',
      'Final WeLearn 7 Essential Future Skills Mastery Portfolio Defense (Deliverables #1, #2, and #3)'
    ],
    aiPromptStarters: [
      'Simulate a tough "Shark Tank" / Municipal Review Board Q&A panel asking us about our tile’s <5mm ADA trip safety, waterproof maintenance, and LCOE vs. solar PV.',
      'Help us structure a crisp 5-minute TED-style civic pitch that integrates a live visitor footstep demo on our prototype with our A1 Blueprint and Honest ROI Report.',
      'Help us organize our final WeLearn 7 Future Skills reflection linking our lab logs, prototype V2.0, A1 blueprint, and Cost-Benefit Report.'
    ],
    competencies: ['ec-03', 'ec-06', 'ent-03', 'lc-05', 'sdl-07'],
    stretchCompetencies: ['ctps-05', 'sea-03'],
    sessions: [
      {
        sessionNumber: 23,
        week: 12,
        title: 'Week 12 (Mon–Wed): Pitch Deck Choreography, Booth Fabrication & Municipal Q&A Dress Rehearsal',
        durationMin: 300,
        learningGoal: 'Design the civic pitch narrative, set up the interactive exhibition booth (step-pad, A1 blueprint easel, live telemetry), and complete "Shark Tank" / Municipal Review Board dress rehearsals.',
        activities: [
          'Monday (2 hrs): Design persuasive TED-style pitch narratives, slide decks, and live footstep demonstration choreography.',
          'Tuesday (2 hrs): Fabricate exhibition booth displays: set up interactive step-pads with flush bevel ramps, 3-panel A1 Architectural Blueprint easels, and eye-level live telemetry screens.',
          'Wednesday (2 hrs): Conduct rigorous dress rehearsals and "Shark Tank" / Municipal Review Board Q&A prep with peer and coach panels.'
        ],
        learnerChoices: {
          question: 'How will your pod choreograph the live visitor step-test during your pitch?',
          options: [
            { id: 'opt-demo-judge-steps', label: 'Invite a Community Judge to Step on the Tile Live', description: 'Triggers the OLED Joule counter and LED pathway strip in real time during the opening hook.' },
            { id: 'opt-demo-comparative', label: 'Live Side-by-Side Schottky vs. Silicon / Piezo vs. EM Demo', description: 'Shows the audience the live waveform and stored capacitor voltage jump on screen.' }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Submit your Civic Pitch Deck outline, Exhibition Booth layout photo, and Dress Rehearsal Q&A feedback notes.',
          targetCompetencies: ['ec-03', 'ec-06', 'lc-05']
        },
        reflectionPrompt: 'Which tough question during the Municipal Review Board dress rehearsal pushed your pod to sharpen your technical or financial explanation?',
        teacherTips: 'Test all live OLED/serial telemetry screens and backup power packs during Wednesday’s dress rehearsal.'
      },
      {
        sessionNumber: 24,
        week: 12,
        title: 'Week 12 (Thu–Fri): Activity 5.3 Interactive Civic Pitch & WeLearn 7 Future Skills Portfolio Defense',
        durationMin: 300,
        learningGoal: 'Deliver the public Interactive Civic Pitch & Live Watt-Meter Demo (Activity 5.3) and complete the post-project retrospective and WeLearn 7 Future Skills mastery portfolio defense.',
        activities: [
          'Thursday (2 hrs): Host the Public Smart Cities Innovation Showcase — execute Activity 5.3 (Interactive Civic Pitch & Live Watt-Meter Demo) where visitors step directly onto your prototype while you present Deliverable #1 (Working Prototype), Deliverable #2 (Architectural Blueprint), and Deliverable #3 (Cost-Benefit Analysis) to school leadership, urban planners, and parents.',
          'Friday (2 hrs): Complete the post-project team retrospective and WeLearn 7 Future Skills mastery portfolio defense focusing on Entrepreneurship, Critical Thinking, and Communication in All Forms.'
        ],
        learnerChoices: {
          question: 'Which of the 3 Core Deliverables are you proudest of defending in your WeLearn 7 Future Skills portfolio?',
          options: [
            { id: 'opt-proud-prototype', label: 'Deliverable #1: Working Mechanical/Electronic Prototype V2.0', description: 'Survived 1,000 footsteps with <5mm trip-free deflection, Schottky rectification, and live OLED telemetry.' },
            { id: 'opt-proud-blueprint', label: 'Deliverable #2: 3-Panel A1 Architectural & Engineering Blueprint', description: 'Combined scaled urban CAD plans, ADA accessibility, exploded views, and KiCad schematics.' },
            { id: 'opt-proud-roi', label: 'Deliverable #3: Empirical Cost-Benefit & Honest ROI Report', description: 'Proved realistic unit economics, BOM scaling, LCOE, and smart-sensor co-benefits.' }
          ]
        },
        evidenceToCollect: {
          kind: 'reflection',
          prompt: 'Submit your Final WeLearn 7 Essential Future Skills Mastery Portfolio Index (Deliverables #1, #2, #3) and Week 12 Retrospective (Note: any audio/video recording requires prior school consent and is never stored by the platform).',
          targetCompetencies: ['ent-03', 'ctps-05', 'ec-06', 'sdl-07']
        },
        reflectionPrompt: 'How has building, stress-testing, and pricing a real energy-harvesting system changed how you evaluate sustainability claims and smart-city infrastructure?',
        teacherTips: 'Safeguarding reminder: any photo/video capture of the public showcase requires prior school consent and must never be stored on the platform.'
      }
    ]
  }
];

export const KINETIC_ENERGY_PROGRAM: PblProgram = {
  id: 'kinetic-smart-energy-2026',
  title: 'Smart Cities & Adaptive Infrastructure: Kinetic and Smart Energy Harvesting',
  subtitle: 'Engineering piezoelectric footstep tiles, electromagnetic spring harvesters, and thermoelectric Peltier surfaces with full-wave Schottky rectification, supercapacitor storage, architectural CAD blueprints, and Honest ROI analysis across a 12-week, 120-hour Design Thinking cycle.',
  status: 'provisional_prototype',
  theme: 'Smart Cities & Adaptive Infrastructure — Kinetic and Smart Energy Harvesting',
  drivingQuestion: 'How can we retrofit our school or public parks to harvest clean energy from footsteps, vibration, or ambient heat?',
  realProblem: {
    type: 'both',
    summary: 'Every day, thousands of footsteps on school stairs and cafeteria queues—and intense solar heat on park benches and asphalt plazas—dissipate unused mechanical and thermal energy. Capturing this micro-energy requires rugged transducers, low-loss Schottky bridge rectification, supercapacitor storage, trip-free (<5mm deflection) universal design, and honest cost-benefit economics.',
    peopleImpact: 'Empowers students to design ADA-compliant, wheelchair- and stroller-safe adaptive urban infrastructure that powers pathway safety lighting, batteryless pedestrian sensors, and interactive public telemetry.',
    environmentalImpact: 'Demonstrates clean micro-energy harvesting for off-grid IoT nodes and low-draw urban lighting while teaching rigorous Levelized Cost of Energy (LCOE) and lifecycle BOM trade-offs alongside solar PV.'
  },
  targetAgeRange: 'Ages 12–17 (Middle & Upper Secondary; adaptable scaffolds for Ages 9–11)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'Arduino UNO / ESP32 microcontroller for 48-hour automated footstep & ΔT data logging (Activity 2.1)',
      'INA219 DC current/power sensor + 0.96" I2C OLED display for real-time Voltage, Joule, and Footstep telemetry (Activity 4.2)'
    ],
    sensorsAndActuators: [
      '35mm brass-ceramic piezoelectric discs (12–24 per tile), miniature geared DC motors / electromagnetic spring generators, and TEC1-12706 thermoelectric Peltier modules',
      '1N5819 low-forward-voltage Schottky diodes vs. 1N4007 silicon diodes, 1000µF electrolytic capacitors, and 1F–5F 5.5V supercapacitor storage banks',
      'Force-Sensitive Resistors (FSRs), ultrasonic tripwires, DS18B20 temperature probes, and low-power LED strips or e-ink displays'
    ],
    fabricationMaterials: [
      'Plywood, acrylic, or recycled HDPE structural plates (CNC-routed or laser-cut) and 3D-printed internal spring retainers/brackets',
      'Silicone/neoprene shock mounts, elastomeric weather-stripping gaskets, non-slip tread tape, and cardboard/EVA foam/dowels for Activity 3.1 kinematics'
    ],
    softwareAndTools: [
      'CAD & Schematic Suite: Fusion 360, SketchUp, or AutoCAD (for 3-panel A1/Arch D blueprints) + KiCad or Fritzing (for electrical schematics)',
      'Digital multimeters, oscilloscope, infrared thermometers, and the built-in Kinetic & Smart Energy Simulator ("Lossless" Rectifier Lab + "Honest ROI" Financial Simulator)'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Trip-Free Universal Design Mandate: Every prototype installed in a hallway or park path must maintain a maximum vertical deflection under 5.0mm, flush beveled edges, and high-traction non-slip surfacing safe for wheelchairs, canes, and strollers.',
      'Electronics & Maker Lab Safety: Enforce safety eyewear, fume extraction during soldering (Activity 4.1), and capacitor polarity/voltage rating checks before footstep testing.',
      'Child Safeguarding & Privacy: Under-13 learners never use speech-to-text or audio/video recording during stakeholder interviews; any showcase recording for older learners requires prior school consent and is never stored on the platform.'
    ],
    pedagogicalScaffolding: [
      'Consistent 10-Hour Weekly Studio Rhythm (2 Hours/Weekday): Monday (Concept & Physics Lab), Tuesday (Fieldwork & Digital Modeling), Wednesday (Maker Studio & Fabrication), Thursday (Testing, Data & Iteration), Friday (Design Critique & WeLearn 7 Future Skills Reflection).',
      'Three Mandatory Core Deliverables: Ensure every pod delivers (1) Working Mechanical/Electronic Prototype V2.0, (2) 3-Panel A1/Arch D Architectural Blueprint, and (3) Empirical Cost-Benefit Energy Analysis Report.'
    ],
    aiEthicsRules: [
      'AI tools may be used to process 48-hour CSV foot-traffic logs, assist with structural load checks, and stress-test financial ROI spreadsheet formulas.',
      'Prompt Provenance Mandatory: Students must log what prompt they asked, what the AI generated, and how they verified it against empirical multimeter/lab measurements.'
    ],
    differentiationNotes: [
      'Foundational Track (Ages 9–11 / Introductory): Use pre-soldered piezo/micro-generator modules, plug-and-play breadboard Schottky bridges, cardboard/foam linkages, and guided site plan templates (no speech-to-text or voice recording for under-13s).',
      'Advanced Track (Ages 12–17): Design custom series-parallel hybrid piezo + electromagnetic arrays, program INA219 Riemann-sum Joule integration on ESP32, produce full 3-panel A1 CAD/KiCad blueprints, and model LCOE/NPV across 1 to 10,000 units.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-kinetic-prototype',
      metric: 'Deliverable #1: Working Mechanical/Electronic Prototype & <5mm Trip-Free Safety',
      target: 'Generates measurable electrical power across 1,000 continuous footsteps with 1N5819 Schottky bridge rectification, supercapacitor storage, live INA219/OLED telemetry, and vertical deflection strictly < 5.0mm',
      verificationMethod: 'Week 8 Safety & Deflection Audit + Week 10 Activity 5.1 (1,000-Footstep Stress Test & Drop-Weight Efficiency Calibration)'
    },
    {
      id: 'metric-kinetic-blueprint',
      metric: 'Deliverable #2: 3-Panel A1/Arch D Architectural & Engineering Blueprint',
      target: 'Complete plotted package containing Scaled Site Plan, Cross-Sectional Pavement Installation Detail, Exploded Mechanical Assembly, and KiCad/Fritzing Electrical Schematic with ADA accessibility & drainage',
      verificationMethod: 'Week 6 Mid-Program Architect Pin-Up + Week 9 Peer Red-Line Review & Activity 4.3 Blueprint Inspection'
    },
    {
      id: 'metric-kinetic-roi-report',
      metric: 'Deliverable #3: Empirical Cost-Benefit Energy Analysis Report & Civic Pitch',
      target: 'Anchored in empirical Joules/step lab measurements with complete BOM scaling (1 vs. 100 vs. 10,000 units), LCOE, Honest ROI comparison against solar PV, and live Watt-Meter demo at the Smart City Expo',
      verificationMethod: 'Week 11 Activity 5.2 Honest ROI Spreadsheet Audit + Week 12 Municipal Review Board Showcase Evaluation'
    }
  ],
  assumptions: [
    {
      id: 'asmp-kinetic-schedule',
      domain: '12-Week / 120-Hour Weekday Studio Rhythm',
      assumption: 'Program runs 2 hours per weekday (Monday–Friday = 10 hours/week, 120 hours total) across 12 weeks, culminating in the Week 12 Smart City Expo.',
      ownerVerificationNeeded: 'Confirm 2h/day studio lab schedule and supervised hallway/park bottleneck access for Week 3 ESP32 logging and Week 10 1,000-footstep testing.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    },
    {
      id: 'asmp-kinetic-hardware',
      domain: 'Transducer, Schottky & INA219/OLED Kit Availability',
      assumption: 'Each 4-student studio pod has access to 35mm piezo discs, miniature DC generators, TEC1-12706 Peltier modules, 1N5819 Schottky diodes, supercapacitors, ESP32, INA219 current sensors, and 0.96" OLED screens.',
      ownerVerificationNeeded: 'Confirm electronics BOM stock and A1/Arch D blueprint plotting access with the WeLearn Maker Studio manager.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    }
  ],
  phases: KINETIC_ENERGY_PHASES
};
