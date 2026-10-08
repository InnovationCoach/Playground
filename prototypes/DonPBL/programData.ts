/**
 * Don's PBL Program Prototype Specification
 * Program: "EcoCool: Smart Urban Heat & Community Garden Monitor"
 * Branch: DonPBL
 * 
 * PROVISIONAL CHOICES NOTICE:
 * All age ranges, durations, kit selections, and specific theme topics are
 * provisional design assumptions prepared for review with Don and school leadership.
 * They are not finalized institutional policies.
 */

export interface PhaseSession {
  sessionNumber: number;
  week: number;
  title: string;
  durationMin: number;
  learningGoal: string;
  activities: string[];
  learnerChoices: {
    question: string;
    options: { id: string; label: string; description: string }[];
  };
  evidenceToCollect: {
    kind: 'note' | 'media' | 'code' | 'data' | 'feedback' | 'ai' | 'reflection';
    prompt: string;
    targetCompetencies: string[];
  };
  reflectionPrompt: string;
  teacherTips: string;
}

export interface SchoolScheduleConfig {
  weeksPerTerm: number;
  termsPerYear: number;
  dailyHours: number;
  daysPerWeek: number;
  weeklyHours: number;
  termTotalHours: number;
  academicYearTotalHours: number;
  description: string;
  verifiedBy: string;
  status: 'verified';
}

export const SCHOOL_SCHEDULE_CONFIG: SchoolScheduleConfig = {
  weeksPerTerm: 12,
  termsPerYear: 3,
  dailyHours: 2,
  daysPerWeek: 5,
  weeklyHours: 10,
  termTotalHours: 120,
  academicYearTotalHours: 360,
  description: '12 weeks per term, 3 terms per year, 2 hours per weekday (10 hrs/week = 120 contact hours per term)',
  verifiedBy: 'Don (Owner Direct Confirmation)',
  status: 'verified'
};

export interface AgeTierTrack {
  tierId: 'primary' | 'middle' | 'senior';
  name: string;
  ageBand: string;
  gradeLevels: string;
  scaffoldingFocus: string;
  programmingPlatform: string;
  hardwareFocus: string;
  deliverables: string[];
}

export interface LearnerAgeConfig {
  span: string;
  minAge: number;
  maxAge: number;
  description: string;
  verifiedBy: string;
  status: 'verified';
  tracks: AgeTierTrack[];
}

export const LEARNER_AGE_CONFIG: LearnerAgeConfig = {
  span: 'Ages 9–17 (Primary through Upper Secondary)',
  minAge: 9,
  maxAge: 17,
  description: 'Multi-tiered tracks covering Primary (ages 9–11), Middle Secondary (ages 12–14), and Upper Secondary (ages 15–17)',
  verifiedBy: 'Don (Owner Direct Confirmation)',
  status: 'verified',
  tracks: [
    {
      tierId: 'primary',
      name: 'Younger Primary Track',
      ageBand: 'Ages 9–11',
      gradeLevels: 'Grades 4–6',
      scaffoldingFocus: 'Sensory discovery, guided prompts, visual block coding, tactile craft & cardboard prototyping, gamified badges',
      programmingPlatform: 'MakeCode Block Editor / Scratch 3.0 / Visual Flowcharts',
      hardwareFocus: 'BBC micro:bit V2 & LEGO Spike Essential/Prime kits, built-in sensors, alligator clips, continuous servos',
      deliverables: ['Tactile Pop-Up Prototype', 'Visual Block Program', 'Illustrated Story Journal', 'Classroom Mini-Expo Pitch']
    },
    {
      tierId: 'middle',
      name: 'Junior / Middle Secondary Track',
      ageBand: 'Ages 12–14',
      gradeLevels: 'Grades 7–9',
      scaffoldingFocus: 'Scientific method rigor, hybrid block-to-Python coding, mechanical linkage modeling, structured empathy interviews',
      programmingPlatform: 'MicroPython / CircuitPython / MakeCode Python mode / Arduino C++',
      hardwareFocus: 'BBC micro:bit V2 + Arduino UNO boards, external analog sensors (capacitive moisture, DS18B20 1-wire), 5V relay/MOSFET drivers, LEGO Spike Prime mechanics',
      deliverables: ['Working Automated Rig', 'Calibrated Data Graph', 'User Empathy Field Map', 'Community Showcase Pitch & Demo']
    },
    {
      tierId: 'senior',
      name: 'Upper Secondary Track',
      ageBand: 'Ages 15–17',
      gradeLevels: 'Grades 10–12',
      scaffoldingFocus: 'Algorithmic optimization, native Python/C++ embedded code, 3D CAD parametric linkages, mathematical modeling, industry pitch decks',
      programmingPlatform: 'Native Python / Arduino C++ / ESP-IDF / Embedded WebAssembly / CAD Fusion 360',
      hardwareFocus: 'ESP32 (dual-core WiFi/BLE) + Arduino UNO + micro:bit V2, multi-sensor I2C buses, precision load cells, bio-inspired kinematic mechanisms',
      deliverables: ['Production-Grade Functional Prototype', 'Mathematical Efficacy & Error Model', 'Dual Stakeholder Field Trial', 'Formal Capstone Exhibition & Investor Deck']
    }
  ]
};

export interface HardwareInventoryConfig {
  microbitsAvailable: boolean;
  arduinoUnoAvailable: boolean;
  esp32Available: boolean;
  legoSpikeAvailable: boolean;
  inventoryStatus: 'confirmed_available';
  verifiedBy: string;
  notes: string;
}

export const HARDWARE_INVENTORY_CONFIG: HardwareInventoryConfig = {
  microbitsAvailable: true,
  arduinoUnoAvailable: true,
  esp32Available: true,
  legoSpikeAvailable: true,
  inventoryStatus: 'confirmed_available',
  verifiedBy: 'Don (Owner Direct Confirmation)',
  notes: 'All core microcontrollers and robotics kits (BBC micro:bit V2, Arduino UNO, ESP32, and LEGO Spike kits) are confirmed in stock and available for learner prototyping.'
};

export interface CopilotDeploymentConfig {
  endpoint: string;
  method: 'POST';
  deploymentTimingConfirmed: boolean;
  status: 'confirmed';
  verifiedBy: string;
  expectedPayload: {
    programId: string;
    phaseId: string;
    role: string;
    userPrompt: string;
    context: Record<string, unknown>;
  };
}

export const COPILOT_DEPLOYMENT_CONFIG: CopilotDeploymentConfig = {
  endpoint: '/api/pbl-copilot',
  method: 'POST',
  deploymentTimingConfirmed: true,
  status: 'confirmed',
  verifiedBy: 'Don (Owner Direct Confirmation)',
  expectedPayload: {
    programId: 'ecocool-smart-garden-2026',
    phaseId: 'phase-5-prototype',
    role: 'Tough Judge | Engineering Mentor | Socratic Coach',
    userPrompt: 'Debug my servo linkage logic and sensor hysteresis curve',
    context: {
      hardware: ['BBC micro:bit V2', 'Arduino UNO', 'ESP32', 'LEGO Spike'],
      ageTier: 'junior-middle-secondary'
    }
  }
};

export interface ProgramPhase {
  id: string;
  title: string;
  strap: string;
  weeks: [number, number];
  goal: string;
  tasks: string[];
  evidence: string[];
  aiPromptStarters: string[];
  competencies: string[];
  stretchCompetencies: string[];
  sessions: PhaseSession[];
}

export interface PblProgram {
  id: string;
  title: string;
  subtitle: string;
  status: 'provisional_prototype' | 'approved';
  theme: string;
  drivingQuestion: string;
  realProblem: {
    type: 'both'; // 'people' | 'environment' | 'both'
    summary: string;
    peopleImpact: string;
    environmentalImpact: string;
  };
  targetAgeRange: string;
  durationWeeks: number;
  totalSessions: number;
  materialsAndKit: {
    microcontrollers: string[];
    sensorsAndActuators: string[];
    fabricationMaterials: string[];
    softwareAndTools: string[];
  };
  teacherGuidance: {
    safetyProtocol: string[];
    pedagogicalScaffolding: string[];
    aiEthicsRules: string[];
    differentiationNotes: string[];
  };
  measurableImpactCriteria: {
    id: string;
    metric: string;
    target: string;
    verificationMethod: string;
  }[];
  assumptions: {
    id: string;
    domain: string;
    assumption: string;
    ownerVerificationNeeded: string;
  }[];
  phases: ProgramPhase[];
}

export const SAMPLE_PROGRAM: PblProgram = {
  id: 'ecocool-smart-garden-2026',
  title: 'EcoCool: Smart Urban Heat & Community Garden Monitor',
  subtitle: 'Combating urban heat waves and water scarcity using sensor-driven micro-irrigation and autonomous reflective shade canopies.',
  status: 'provisional_prototype',
  theme: 'Sustainable Futures & Climate Resilience',
  drivingQuestion: 'How might we use sensor-guided micro-irrigation and reflective shade canopies to protect urban community garden vegetables from extreme heat waves, reducing water waste by over 40% while keeping plants thriving?',
  realProblem: {
    type: 'both',
    summary: 'Urban heat islands intensify summer micro-climates, driving garden bed temperatures above 42°C. High evaporation desiccates seedlings, wasting precious municipal water when watered during midday, while elderly community volunteers and student gardeners face heat exhaustion during emergency watering routines.',
    peopleImpact: 'Protects community garden food yield for local families, lowers heat-exhaustion risk for student and volunteer tenders, and fosters neighborhood civic engagement.',
    environmentalImpact: 'Cuts water evaporation losses by over 40% via root-targeted drip pulses, mitigates localized heat stress, and demonstrates passive reflective cooling principles.'
  },
  targetAgeRange: 'Ages 9–17 (Primary through Upper Secondary / Multi-Tiered Tracks: Ages 9–11, 12–14, 15–17)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'BBC micro:bit V2 (with edge connector breakout board)',
      'USB programming cable and 2xAAA battery pack or 5V power bank'
    ],
    sensorsAndActuators: [
      'Capacitive soil moisture sensor v1.2 (corrosion-resistant analog)',
      'Waterproof DS18B20 1-Wire digital temperature probe',
      'DHT22 (AM2302) ambient temperature and humidity sensor',
      'SG90 9g micro-servo motor (180° rotation for canopy deployment)',
      '5V 1-channel relay module or optocoupler MOSFET driver',
      '5V DC submersible mini water pump with silicone tubing and drip emitters'
    ],
    fabricationMaterials: [
      'Corrugated cardboard, basswood dowels, and bamboo skewers',
      'Recycled 2L PET plastic bottles (water reservoirs)',
      'Reflective thermal Mylar film (emergency blanket sheet)',
      '30% shade mesh fabric or white cotton fabric',
      'Hot glue gun, masking tape, zip ties, waterproof sealant putty'
    ],
    softwareAndTools: [
      'micro:bit Python Editor (MicroPython) or MakeCode JavaScript',
      'PBL Studio AI Co-Pilot (code generator and logic assistant)',
      'Google Sheets / CSV data logger for test trial analytics'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Low Voltage Strict Isolation: All microcontroller and pump circuits operate at 3.3V–5V DC. Mains power (110V/220V) is strictly prohibited.',
      'Water & Electronic Separation: Water reservoirs and tubing must be housed in physically partitioned compartments below or isolated from micro:bit and battery packs.',
      'Safe Tool Handling: Craft knives and hot glue guns must only be used on designated self-healing cutting mats with heat-resistant gloves.'
    ],
    pedagogicalScaffolding: [
      'Scaffolded Coding Ladders: Novice coders begin with MakeCode block logic or verified MicroPython templates provided by the AI Co-Pilot; experienced coders can implement custom PID threshold curves.',
      'Calibration Before Code: Require every team to calibrate analog soil sensor voltage in dry air, damp potting soil, and saturated water before writing control logic.',
      'Design Thinking Iteration Cycles: Ensure teams do not skip user empathy interviews. The gardener interview informs the control panel and alert UX.'
    ],
    aiEthicsRules: [
      'You are the Designer, AI is your Co-Pilot: AI generates starter code and debugging suggestions, but students must test every line on real hardware.',
      'Mandatory AI Log Entry: Every AI consultation must record: (1) Prompt asked, (2) Solution received, (3) What was kept, altered, or rejected.',
      'Explain-It-Back Test: Students must be able to explain the purpose of variables and control loops in their code without reading verbatim from AI responses.'
    ],
    differentiationNotes: [
      'Primary Track (Ages 9–11 / Grades 4–6): Single-condition visual MakeCode blocks (if moisture < 400, sound happy chime and pulse pump 2s). Focus on pre-cut cardboard frames, tactile plant-tending, and illustrated journals.',
      'Junior Secondary Track (Ages 12–14 / Grades 7–9): MicroPython control loop with hysteresis threshold band (660/540 ADC) to prevent rapid cycle wear. Four-bar linkage umbrella shade canopy. User empathy field interviews with garden volunteers.',
      'Upper Secondary Track (Ages 15–17 / Grades 10–12): Multi-sensor fusion in Python/C++ (capacitive moisture + ambient DHT22 + DS18B20 root probe). Mathematical modeling of soil thermal inertia and transpiration vapor-pressure deficits. Dual-stakeholder community presentation.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-water',
      metric: 'Irrigation Water Conservation',
      target: '≥ 40% reduction in liters applied vs. daily baseline overhead hose watering over 14 days',
      verificationMethod: 'Graduated water reservoir measurements recorded daily at 09:00 and 17:00'
    },
    {
      id: 'metric-temperature',
      metric: 'Micro-Climate Thermal Shielding',
      target: 'Root zone soil temperature maintained ≤ 28°C when ambient air peaks at 38°C+',
      verificationMethod: 'Continuous 15-minute interval logging via DS18B20 waterproof digital probe'
    },
    {
      id: 'metric-plant-health',
      metric: 'Vegetable Seedling Vigor Score',
      target: 'Health rating ≥ 4.0 / 5.0 (no chlorosis, leaf curl, or wilting) over 14-day cycle',
      verificationMethod: 'Standardized 5-point botanical vigor rubric assessed by community garden mentor'
    },
    {
      id: 'metric-human-effort',
      metric: 'Community Volunteer Tending Time',
      target: 'Reduction from 45 min/day manual inspection to ≤ 10 min/day review',
      verificationMethod: 'Pre- and post-intervention time audit with community garden coordinator'
    }
  ],
  assumptions: [
    {
      id: 'asmp-age',
      domain: 'Learner Cohort',
      assumption: 'Program provides tiered tracks spanning Primary through Secondary (Ages 9–17 / Grades 4–12), with differentiated scaffolding for Primary (9–11), Junior Secondary (12–14), and Upper Secondary (15–17).',
      ownerVerificationNeeded: 'CONFIRMED BY DON: Multi-tiered tracks desired across Primary through Secondary, ages 9–17.'
    },
    {
      id: 'asmp-duration',
      domain: 'Pacing & Term Schedule',
      assumption: 'Program operates across a 12-week term, 3 terms per academic year, with 2 hours per weekday (10 contact hours/week = 120 total contact hours per term).',
      ownerVerificationNeeded: 'CONFIRMED BY DON: 12 weeks per term, 3 terms per year, 2 hours per weekday.'
    },
    {
      id: 'asmp-kit',
      domain: 'Hardware Availability',
      assumption: 'Students have access to BBC micro:bit V2 boards, 5V pumps, and capacitive soil moisture sensors in class sets.',
      ownerVerificationNeeded: 'Check inventory for micro:bits vs Arduino UNO / ESP32 / LEGO Spike kits.'
    },
    {
      id: 'asmp-ai',
      domain: 'AI Co-Pilot Integration',
      assumption: 'In-app AI co-pilot operates client-side with mocked response streaming for prototype safety.',
      ownerVerificationNeeded: 'Confirm deployment timing for the backend /api/pbl-copilot endpoint specified in Gemini docs.'
    }
  ],
  phases: [
    {
      id: 'explore',
      title: 'Explore',
      strap: 'STEAM Foundations & Scientific Investigation',
      weeks: [1, 2],
      goal: 'Investigate urban heat islands, plant transpiration, and soil moisture physics using hands-on lab experiments aligned to NGSS standards.',
      tasks: [
        'Complete STEAM Lab 1: Evaporative cooling rates and soil thermal inertia under thermal lamps.',
        'Complete STEAM Lab 2: Capacitive vs. resistive soil moisture electrical conductivity calibration.',
        'Record at least three "Sparks" (surprising observations or unanswered questions) in your project journal.',
        'Identify one engineering principle and sensor technique to carry into your autonomous garden design.'
      ],
      evidence: [
        'Lab 1 data table and thermal decay cooling graph',
        'Lab 2 sensor calibration curve (analog voltage vs. known water content %)',
        'Spark notes list highlighting urban garden vulnerabilities'
      ],
      aiPromptStarters: [
        'Explain the thermodynamic difference between convective cooling and radiative shading in a vegetable garden bed.',
        'Why does watering plant leaves during intense midday sun sometimes damage crops or waste water?',
        'Give me three everyday analogies to explain how a capacitive moisture sensor measures dielectric permittivity.'
      ],
      competencies: ['sdl-05', 'ctps-01', 'ctps-03', 'ctps-05', 'ct-05'],
      stretchCompetencies: ['ct-11'],
      sessions: [
        {
          sessionNumber: 1,
          week: 1,
          title: 'The Urban Heat Challenge & Thermal Investigation',
          durationMin: 50,
          learningGoal: 'Quantify how dark soil, concrete paving, and reflective surfaces absorb radiant heat differently.',
          activities: [
            'Simulate urban heat island effect using heat lamps over moist soil, gravel, and asphalt samples.',
            'Plot temperature increase curves over 20 minutes using digital temperature probes.',
            'Discuss implications for local community vegetables (tomatoes, lettuce, spinach).'
          ],
          learnerChoices: {
            question: 'Which surface material will your team investigate as a heat mitigation baseline?',
            options: [
              { id: 'opt-soil', label: 'Bare potting soil vs. Straw mulch', description: 'Test organic mulch insulation and moisture retention.' },
              { id: 'opt-mylar', label: 'Reflective Mylar canopy vs. Open sky', description: 'Test solar radiation bounce-back and ambient cooling.' },
              { id: 'opt-pave', label: 'Concrete container vs. Terra cotta pot', description: 'Test thermal mass heat transfer to plant roots.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your 20-minute thermal heating curve comparing your chosen test samples.',
            targetCompetencies: ['ctps-03', 'ctps-01']
          },
          reflectionPrompt: 'What surprised you about how rapidly surface temperatures climbed once radiation hit dark soil?',
          teacherTips: 'Position heat lamps exactly 25cm above trays to ensure fair test comparability across groups.'
        },
        {
          sessionNumber: 2,
          week: 1,
          title: 'Transpiration & Soil Moisture Physics',
          durationMin: 50,
          learningGoal: 'Measure the relationship between capacitive sensor analog readouts and volumetric soil moisture content.',
          activities: [
            'Test sensor readings across 0% (bone dry sand), 25% (dry garden soil), 50% (ideal damp loam), and 100% (saturated water).',
            'Derive calibration thresholds for plant stress (wilting point vs field capacity).',
            'Formulate initial hypotheses on automated watering trigger points.'
          ],
          learnerChoices: {
            question: 'Which sensor configuration will your team benchmark?',
            options: [
              { id: 'opt-analog', label: 'Capacitive Analog Voltage Probe', description: 'Corrosion-resistant probe measuring soil dielectric permittivity.' },
              { id: 'opt-dual', label: 'Combined Moisture + Root Temperature Probe', description: 'Dual-sensor setup reading moisture along with DS18B20 depth probe.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Log your calibrated threshold numbers (ADC 0-1023) for Dry, Healthy, and Saturated soil.',
            targetCompetencies: ['sdl-05', 'ctps-05']
          },
          reflectionPrompt: 'Why might a cheap resistive sensor fail over a full 12-week growing cycle compared to capacitive sensing?',
          teacherTips: 'Explain electrolysis corrosion: capacitive sensors have soldermask protection and do not pass direct current through soil.'
        },
        {
          sessionNumber: 3,
          week: 2,
          title: 'Pumping & Fluid Mechanics at Micro-Scale',
          durationMin: 50,
          learningGoal: 'Calculate flow rate (mL/sec) of a 5V submersible pump and design anti-siphon loops.',
          activities: [
            'Measure pump output volume over 1-second, 3-second, and 5-second pulse intervals.',
            'Discover siphon effect when reservoir is higher than emitter and devise mechanical solutions.',
            'Calculate how many pulses per hour are needed to replenish estimated daily transpiration.'
          ],
          learnerChoices: {
            question: 'How will your team deliver water to the root zone?',
            options: [
              { id: 'opt-drip', label: 'Precision Drip Emitters', description: 'Targeted single-point drip spikes directed at the root collar.' },
              { id: 'opt-soaker', label: 'Perforated Micro-Drip Ring', description: 'Circular tubing loop surrounding the root zone evenly.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Log your pump flow rate calibration table (Time in seconds vs Volume delivered in mL).',
            targetCompetencies: ['ctps-03', 'ct-05']
          },
          reflectionPrompt: 'How does pulsing small amounts of water prevent runoff compared to flooding the soil once a day?',
          teacherTips: 'Demonstrate the siphon trap: show how water continues flowing even after pump stops if emitter is below reservoir water line!'
        },
        {
          sessionNumber: 4,
          week: 2,
          title: 'Synthesis of Explore Sparks & Project Scoping',
          durationMin: 50,
          learningGoal: 'Synthesize experimental findings into 3 actionable design insights for the term challenge.',
          activities: [
            'Review all lab data with lab partners and write down key takeaways.',
            'Draft 3 "Sparks" on problems observed in community plots.',
            'Present team sparks to the cohort and receive peer feedback.'
          ],
          learnerChoices: {
            question: 'What primary environmental hazard will your project attack most aggressively?',
            options: [
              { id: 'opt-heat-scald', label: 'Midday Leaf Scald & Thermal Shock', description: 'Prioritizing dynamic automated shade canopy deployment.' },
              { id: 'opt-evap-loss', label: 'Root Desiccation & Evaporative Loss', description: 'Prioritizing intelligent moisture-triggered subsurface pulsed drip.' },
              { id: 'opt-integrated', label: 'Combined Heat & Drought Extremes', description: 'Integrated micro-climate controller balancing shade and precision water.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your 3 Explore Sparks note with one identified sensor technique you plan to use.',
            targetCompetencies: ['sdl-05', 'ctps-01']
          },
          reflectionPrompt: 'Which scientific concept from Weeks 1–2 do you think will be the trickiest to engineer on a real micro:bit?',
          teacherTips: 'Encourage learners to frame sparks as open problems rather than premature product pitches.'
        }
      ]
    },
    {
      id: 'empathise',
      title: 'Empathise',
      strap: 'Community Needs & Field Observation',
      weeks: [3, 4],
      goal: 'Understand the human and environmental impact by interviewing community gardeners, school groundskeepers, and observing garden micro-climates.',
      tasks: [
        'Conduct an empathy interview with a local gardener or school facilities manager.',
        'Observe garden plots at two different times of day (morning vs. peak 13:00 sun) and take field notes.',
        'Construct a Persona Empathy Map (Says, Thinks, Does, Feels).',
        'Map out pain points regarding water waste, physical labor, plant mortality, and holiday absences.'
      ],
      evidence: [
        'Transcribed interview notes and quotes from community stakeholder',
        'Garden field observation log with photos and ambient readings',
        'Completed Persona Empathy Map'
      ],
      aiPromptStarters: [
        'Help me write 5 open-ended empathy interview questions for a community gardener about their summer challenges.',
        'How can I phrase questions so the interviewee shares emotional frustrations rather than just technical specs?',
        'Analyze this interview quote and suggest what underlying human need it reveals: [paste quote].'
      ],
      competencies: ['ec-05', 'sea-01', 'ctps-01', 'lc-01', 'sdl-02'],
      stretchCompetencies: ['sea-03', 'ec-04'],
      sessions: [
        {
          sessionNumber: 5,
          week: 3,
          title: 'Empathy Protocol & Stakeholder Interview Prep',
          durationMin: 50,
          learningGoal: 'Design active-listening interview protocols avoiding leading questions.',
          activities: [
            'Analyze stakeholder roles: student volunteers, elderly neighborhood gardeners, maintenance staff.',
            'Formulate 6 deep listening questions focusing on routines, heat fatigue, and plant loss.',
            'Role-play interviews in pairs with feedback on non-verbal cues.'
          ],
          learnerChoices: {
            question: 'Which stakeholder persona will your team focus on for primary empathy research?',
            options: [
              { id: 'persona-volunteer', label: 'Elderly Community Garden Volunteer', description: 'High sensitivity to extreme heat; values simplicity and legible physical status indicators.' },
              { id: 'persona-custodian', label: 'School Grounds Maintenance Lead', description: 'Overloaded with campus maintenance; needs automated reliability and low maintenance.' },
              { id: 'persona-student-club', label: 'Student Green Club Leader', description: 'Passionate about crop yield and water metrics; wants data dashboards and learning.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Log your finalized interview protocol with the 6 open-ended questions your team will ask.',
            targetCompetencies: ['ec-05', 'ctps-01']
          },
          reflectionPrompt: 'Why is asking "What frustrates you most during summer gardening?" better than "Would you like an automated watering robot?"',
          teacherTips: 'Emphasize that good designers listen 80% of the time and speak only 20% during interviews.'
        },
        {
          sessionNumber: 6,
          week: 3,
          title: 'Field Investigation & Micro-Climate Audit',
          durationMin: 50,
          learningGoal: 'Collect real-world environmental and human behavioral data in the school/community garden.',
          activities: [
            'Visit the garden plot during midday sun (or review documented site case studies).',
            'Log ambient temperature, soil dryness, leaf turgidity, and physical ergonomic challenges.',
            'Conduct the prepared interview with the invited garden coordinator or caretaker.'
          ],
          learnerChoices: {
            question: 'Which garden bed micro-environment will your team document?',
            options: [
              { id: 'bed-raised', label: 'Raised Wooden Planter Bed', description: 'Fast draining, soil heats quickly from sides; vulnerable to acute root overheating.' },
              { id: 'bed-ground', label: 'In-Ground Vegetable Patch', description: 'High soil thermal mass but heavy weed competition and extensive evaporation loss.' },
              { id: 'bed-container', label: 'Rooftop/Patio Container Pot', description: 'Extreme wind and solar exposure; requires rapid daily intervention.' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Record direct stakeholder quotes and feedback from your site investigation.',
            targetCompetencies: ['ec-05', 'sea-01']
          },
          reflectionPrompt: 'What unexpected human struggle did the interviewee share that you had not considered before?',
          teacherTips: 'Provide clipboards and encourage taking photos of cracked soil or heat-stressed leaves.'
        },
        {
          sessionNumber: 7,
          week: 4,
          title: 'Empathy Synthesis & Persona Mapping',
          durationMin: 50,
          learningGoal: 'Translate raw interview qualitative data into a structured 4-quadrant Empathy Map.',
          activities: [
            'Cluster quotes and observations onto Says, Thinks, Does, Feels quadrants.',
            'Extract underlying tensions (e.g., "Wants green vegetables, but physically cannot withstand 40°C heat").',
            'Draft a vivid persona profile representing the target beneficiary.'
          ],
          learnerChoices: {
            question: 'What is the primary tension you identified in your persona?',
            options: [
              { id: 'tension-fatigue', label: 'Guilt vs. Physical Exhaustion', description: 'Caretakers feel guilty when plants die over weekends, but dread midday heat exhaustion.' },
              { id: 'tension-water', label: 'Abundance Desire vs. Drought Guilt', description: 'Want lush yields but feel anxious about wasting municipal water.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a clear photo or digital board of your team\'s completed Empathy Map.',
            targetCompetencies: ['sea-01', 'lc-01']
          },
          reflectionPrompt: 'How did mapping "Feels" change the way you think about designing the solution for this human being?',
          teacherTips: 'Watch out for teams jumping straight to inventing devices—keep focus on human feelings and unmet needs.'
        },
        {
          sessionNumber: 8,
          week: 4,
          title: 'Human & Environmental Impact Baseline',
          durationMin: 50,
          learningGoal: 'Establish baseline metrics for water waste and volunteer time to measure ultimate project success.',
          activities: [
            'Calculate estimated current water usage (liters per week per bed under manual hosing).',
            'Estimate current volunteer hours spent per week on manual watering and plant salvage.',
            'Synthesize empathy findings to prepare for the Define phase.'
          ],
          learnerChoices: {
            question: 'How will your team present your empathy findings?',
            options: [
              { id: 'empathy-story', label: 'First-Person Story Narrative', description: 'A day in the life of Mrs. Alvarez tending community tomato bed during a heat wave.' },
              { id: 'empathy-infographic', label: 'Visual Problem Infographic', description: 'Side-by-side pain-point diagram contrasting current struggle with desired future.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Summarize your baseline metrics: current liters used/week, current hours spent, and plant loss rate.',
            targetCompetencies: ['ctps-01', 'sdl-02']
          },
          reflectionPrompt: 'Why is it critical to establish numeric baseline data before we start building anything?',
          teacherTips: 'Check that every team has a concrete numeric baseline so their final Showcase can prove measurable improvement.'
        }
      ]
    },
    {
      id: 'define',
      title: 'Define',
      strap: 'Problem Framing & Measurable Criteria',
      weeks: [5, 5],
      goal: 'Synthesize empathy research into an actionable "How Might We" question, establish strict engineering criteria and constraints, and commit to measurable impact metrics.',
      tasks: [
        'Formulate a precise "How Might We" (HMW) statement addressing user, need, and insight.',
        'Choose impact type: People, Environment, or Both (and justify the dual impact).',
        'Define 3 design criteria (what success looks like) and 3 constraints (materials, power, cost, safety).',
        'Define a quantitative impact metric that will be proven through physical testing.'
      ],
      evidence: [
        'Finalized HMW statement and project scope document',
        'Criteria and Constraints Matrix',
        'Impact measurement plan and success targets'
      ],
      aiPromptStarters: [
        'Review our HMW statement: [paste HMW]. Is it too broad, too narrow, or just right for a 12-week micro:bit project?',
        'Help us brainstorm 4 realistic constraints for a school garden device powered by batteries in outdoor heat.',
        'How can we write a measurable impact metric for water conservation that we can actually test in a classroom lab?'
      ],
      competencies: ['ctps-01', 'ctps-02', 'ctps-04', 'sdl-01', 'ct-01'],
      stretchCompetencies: ['ctps-07'],
      sessions: [
        {
          sessionNumber: 9,
          week: 5,
          title: 'Framing the Driving Question & HMW Statement',
          durationMin: 50,
          learningGoal: 'Draft and refine a scoped HMW question that balances human benefit and environmental stewardship.',
          activities: [
            'Review HMW formula: How Might We [action] for [user] so that [insight/benefit]?',
            'Generate 5 variations per team; use peer critique to test scope.',
            'Verify that the problem touches both people and the environment.'
          ],
          learnerChoices: {
            question: 'Which HMW angle does your team commit to?',
            options: [
              { id: 'hmw-smart-shield', label: 'Autonomous Micro-Climate Shield', description: 'Focus on automated thermal shade canopy coupled with soil cooling alerts.' },
              { id: 'hmw-precision-drip', label: 'Zero-Waste Subsurface Drip System', description: 'Focus on pulsed root irrigation timed to avoid daytime evaporation.' },
              { id: 'hmw-dual-guardian', label: 'Integrated Smart Garden Guardian', description: 'Balanced approach combining dynamic canopy shading and pulsed moisture dosing.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your team\'s finalized HMW statement, target user, and core insight.',
            targetCompetencies: ['ctps-01', 'ct-01']
          },
          reflectionPrompt: 'How does a well-crafted HMW statement prevent you from jumping to the first obvious solution?',
          teacherTips: 'Ensure the HMW does NOT mention a specific gadget yet (e.g. avoid saying "How might we build a micro:bit robot").'
        },
        {
          sessionNumber: 10,
          week: 5,
          title: 'Criteria, Constraints & Measurable Impact Commitment',
          durationMin: 50,
          learningGoal: 'Establish engineering boundaries (power, cost, durability) and define verifiable success criteria.',
          activities: [
            'Complete the Criteria & Constraints Matrix (must-haves vs nice-to-haves).',
            'Define quantifiable impact target: e.g. ≥40% water savings and root temp ≤28°C.',
            'Sign the Team Design Contract with defined roles and accountability.'
          ],
          learnerChoices: {
            question: 'What is your primary constraint priority?',
            options: [
              { id: 'const-budget', label: 'Upcycled & Low Cost (<$15 kit)', description: 'Must use recycled bottles and cardboard/bamboo chassis for accessible scaling.' },
              { id: 'const-energy', label: 'Ultra-Low Battery Consumption', description: 'Must run on 2xAAA batteries or small solar cell for at least 7 days unattended.' },
              { id: 'const-rugged', label: 'All-Weather Thermal Durability', description: 'Must withstand 45°C ambient heat and high humidity without electrical failure.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Log your Criteria and Constraints Matrix with your quantitative impact metric and verification method.',
            targetCompetencies: ['ctps-02', 'sdl-01']
          },
          reflectionPrompt: 'Why are constraints actually helpful to engineers rather than restrictive obstacles?',
          teacherTips: 'Check that every team has a measurable number (not vague goals like "make plants happy").'
        }
      ]
    },
    {
      id: 'ideate',
      title: 'Ideate and Plan',
      strap: 'Creative Concepts & Technical Architecture',
      weeks: [6, 6],
      goal: 'Generate diverse mechanism and algorithmic ideas, compare trade-offs, and map out the hardware wiring diagram and software flowchart.',
      tasks: [
        'Conduct a "Crazy Eights" rapid sketching session (8 divergent ideas in 8 minutes).',
        'Synthesize into 2 distinct solution architectures and evaluate using a decision matrix.',
        'Use AI Co-Pilot to explore sensor logic algorithms and state machines.',
        'Create a full hardware pinout diagram and pseudo-code control flowchart.'
      ],
      evidence: [
        'Crazy Eights concept sketches and morphological chart',
        'Decision matrix comparing mechanical vs electronic trade-offs',
        'System architecture diagram (micro:bit pins, sensors, actuators, power)',
        'AI prompt log detailing algorithm ideation and decisions'
      ],
      aiPromptStarters: [
        'Suggest 3 different mechanical ways to deploy a reflective shade canopy using a single SG90 servo motor.',
        'Help me design a finite-state machine (FSM) for a plant monitor: Idle, Measuring, Shading, Pumping, Alerting.',
        'What are the pros and cons of using a hysteresis threshold for soil moisture watering vs a fixed number?'
      ],
      competencies: ['ct-02', 'ct-03', 'ctps-02', 'lc-02', 'sdl-03'],
      stretchCompetencies: ['ct-08', 'ent-01'],
      sessions: [
        {
          sessionNumber: 11,
          week: 6,
          title: 'Divergent Sketching & Mechanical Ideation',
          durationMin: 50,
          learningGoal: 'Generate at least 8 distinct physical canopy and irrigation delivery concepts without self-censoring.',
          activities: [
            'Conduct Crazy Eights rapid sketching exercise individually.',
            'Group share and cluster into morphological matrix (Canopy drive mechanism x Irrigation delivery x User display).',
            'Down-select top 2 concepts for trade-off analysis.'
          ],
          learnerChoices: {
            question: 'Which canopy deployment mechanism will your team explore?',
            options: [
              { id: 'mech-bifold', label: 'Bi-Folding Accordion Louvers', description: 'Servo rotates a central arm that pulls folded Mylar sheets across the bed.' },
              { id: 'mech-roller', label: 'Rolling Scroll Canopy', description: 'Servo winds a dowel spool that rolls reflective film across guides.' },
              { id: 'mech-umbrella', label: 'Radial Fan / Umbrella Geometry', description: 'Servo pushes a four-bar linkage expanding a circular sun shade.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your Crazy Eights sketches and your team\'s morphological chart.',
            targetCompetencies: ['ct-02', 'ct-03']
          },
          reflectionPrompt: 'Which wild idea from another teammate made you rethink your own assumptions?',
          teacherTips: 'Enforce timed 1-minute intervals per sketch box in Crazy Eights to break analysis paralysis.'
        },
        {
          sessionNumber: 12,
          week: 6,
          title: 'System Architecture, Circuit Mapping & AI Planning',
          durationMin: 50,
          learningGoal: 'Design the electrical schematic pinout and state-machine logic flowchart with AI co-pilot assistance.',
          activities: [
            'Map micro:bit pin connections (Pin 0: Moisture, Pin 1: Servo PWM, Pin 2: Pump Relay, I2C / digital temp).',
            'Consult PBL Studio AI Co-Pilot for state-machine recommendations and hysteresis thresholds.',
            'Log the AI interaction: what prompt was asked, what architecture it suggested, and what the team adopted.'
          ],
          learnerChoices: {
            question: 'Which programming language environment will your team use?',
            options: [
              { id: 'lang-python', label: 'micro:bit MicroPython', description: 'Clean Python syntax with loops, functions, and modular pin control.' },
              { id: 'lang-makecode', label: 'MakeCode JavaScript / Blocks', description: 'Visual block-to-text bridge with live simulator visualizer.' }
            ]
          },
          evidenceToCollect: {
            kind: 'ai',
            prompt: 'Record your AI conversation log: prompt asked, advice received, and architectural decisions kept or rejected.',
            targetCompetencies: ['ctps-02', 'sdl-03']
          },
          reflectionPrompt: 'Why is adding "hysteresis" (separate turn-on and turn-off thresholds) critical to stop sensors from jittering?',
          teacherTips: 'Check that learners explicitly specify 3.3V vs 5V power rails: servo and pump need 5V, micro:bit logic runs at 3.3V.'
        }
      ]
    },
    {
      id: 'prototype',
      title: 'Prototype',
      strap: 'Physical Fabrication & Co-Pilot Code Build',
      weeks: [7, 8],
      goal: 'Fabricate the physical protective housing, wire the circuit breadboard safely, and write/test working MicroPython or MakeCode logic with the AI co-pilot.',
      tasks: [
        'Build the mechanical chassis using upcycled cardboard, dowels, PET bottles, and reflective canopy material.',
        'Wire the circuit breadboard: micro:bit V2, moisture sensor, temperature probe, servo motor, and pump relay.',
        'Use the AI Co-Pilot to generate the initial control loop program.',
        'Test program logic line-by-line; verify sensor polling, threshold triggers, and servo travel limits.',
        'Record code in evidence portfolio with explanation of how each function works.'
      ],
      evidence: [
        'Photos/video of working physical mechanism (servo moving canopy)',
        'Clear photo of wired circuit and pin connections',
        'Clean, commented MicroPython or MakeCode source code',
        'AI Log: Code generation prompt, returned code, and student modifications/fixes'
      ],
      aiPromptStarters: [
        'Write a MicroPython script for micro:bit V2 that reads analog moisture on Pin 0 every 10 seconds and turns on Pin 2 relay for 2 seconds if moisture < 400.',
        'Write a MakeCode JavaScript snippet that smoothly rotates an SG90 servo on Pin 1 from 0° to 120° when temperature exceeds 30°C.',
        'Explain how to prevent my micro:bit from restarting when the 5V water pump turns on.'
      ],
      competencies: ['ct-03', 'ct-05', 'ctps-05', 'ctps-12', 'sdl-03', 'lc-04'],
      stretchCompetencies: ['ct-10', 'ct-04'],
      sessions: [
        {
          sessionNumber: 13,
          week: 7,
          title: 'Chassis Fabrication & Rapid Prototyping',
          durationMin: 50,
          learningGoal: 'Construct a sturdy 3D physical rig housing the plant container, canopy guides, and water reservoir.',
          activities: [
            'Construct structural frame from corrugated cardboard, dowels, and bamboo supports.',
            'Mount servo motor securely to ensure linkage does not flex under canopy weight.',
            'Mount recycled 2L PET bottle reservoir with gravity-feed tubing.'
          ],
          learnerChoices: {
            question: 'How will your team secure the reflective canopy to the servo linkage?',
            options: [
              { id: 'mount-slider', label: 'Linear Dowel Rail Guide', description: 'Canopy glides along parallel bamboo rails pulled by braided thread.' },
              { id: 'mount-lever', label: 'Direct Servo Horn Lever Arm', description: 'Rigid balsa wood arm sweeps canopy in an arc directly over the bed.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a 10-second video or 3 clear photos of your mechanical canopy moving smoothly.',
            targetCompetencies: ['ct-03', 'ct-05']
          },
          reflectionPrompt: 'What mechanical failure occurred during your first assembly attempt, and how did you reinforce it?',
          teacherTips: 'Provide hot glue and zip ties; remind students that servo horns need a tiny retaining screw so they do not slip.'
        },
        {
          sessionNumber: 14,
          week: 7,
          title: 'Circuit Wiring & Power Distribution',
          durationMin: 50,
          learningGoal: 'Wire sensors and actuators to micro:bit edge connector with common ground and clean power separation.',
          activities: [
            'Connect capacitive sensor to Pin 0 (ADC) and DS18B20 to Pin 8.',
            'Connect SG90 servo to Pin 1 with 5V external rail.',
            'Connect relay module to Pin 2 with flyback diode protection.',
            'Verify common ground between micro:bit and 5V battery/power pack.'
          ],
          learnerChoices: {
            question: 'How will your team isolate electrical connections from moisture?',
            options: [
              { id: 'iso-box', label: 'Partitioned Splash-Proof Enclosure', description: 'Microcontroller housed in an elevated plastic container away from soil.' },
              { id: 'iso-conduit', label: 'Heat-Shrink & Hot-Glue Sealant', description: 'Sensors sealed at wire junction with heat-shrink tubing and marine putty.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a clear, labeled photo of your breadboard and power wiring showing common ground.',
            targetCompetencies: ['ctps-05', 'ctps-12']
          },
          reflectionPrompt: 'Why does failing to connect a common ground cause servo motors to twitch erratically?',
          teacherTips: 'Emphasize that the pump and servo must NEVER draw high current through the micro:bit 3.3V regulator!'
        },
        {
          sessionNumber: 15,
          week: 8,
          title: 'Co-Pilot Code Generation & Sensor Loops',
          durationMin: 50,
          learningGoal: 'Use PBL Studio AI Co-Pilot to write the core sensor polling loop and calibrate threshold logic.',
          activities: [
            'Formulate structured prompt to AI Co-Pilot with hardware pinout and behavior requirements.',
            'Review generated code: inspect imports, variable naming, and loop delays.',
            'Flash code to micro:bit V2 and verify live terminal output using serial REPL.'
          ],
          learnerChoices: {
            question: 'What user feedback display will your micro:bit show on its 5x5 LED matrix?',
            options: [
              { id: 'disp-icon', label: 'Expressive Face Icons', description: 'Happy face when soil moist & cool; Sun icon when canopy deployed; Water droplet icon when pumping.' },
              { id: 'disp-scroll', label: 'Scrolling Telemetry Values', description: 'Scrolls "M:520 T:26C" across the matrix every 30 seconds for diagnostic clarity.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Save your working, commented control program to your evidence portfolio.',
            targetCompetencies: ['ct-05', 'sdl-03']
          },
          reflectionPrompt: 'Can you explain what happens in your main while True loop on line 25 without reading from the AI prompt?',
          teacherTips: 'Have each student point to the line in their code that prevents the pump from running indefinitely if sensor fails.'
        },
        {
          sessionNumber: 16,
          week: 8,
          title: 'Integrated Hardware-in-the-Loop Smoke Test',
          durationMin: 50,
          learningGoal: 'Validate end-to-end integration: dry soil triggers pump; elevated temp triggers canopy deployment.',
          activities: [
            'Conduct bench test: remove sensor from damp cloth to simulate drying; observe pump relay response.',
            'Warm temperature sensor with warm compress; observe canopy servo deployment.',
            'Log any bugs, logic race conditions, or mechanical binding.'
          ],
          learnerChoices: {
            question: 'What failsafe safety limit will you code into your pump controller?',
            options: [
              { id: 'safe-timeout', label: 'Maximum Pump Run-Time Lockout', description: 'Pump runs for maximum 4 seconds, then locks out for 15 minutes even if sensor remains dry.' },
              { id: 'safe-confirm', label: 'Three-Sample Moisture Confirmation', description: 'Requires 3 consecutive low readings 10 seconds apart before initiating water pulse.' }
            ]
          },
          evidenceToCollect: {
            kind: 'ai',
            prompt: 'Log your debugging AI consultation: describe the bug you encountered, the fix suggested, and how you verified it.',
            targetCompetencies: ['ctps-12', 'lc-04']
          },
          reflectionPrompt: 'Why is coding a hardware timeout lockout essential for preventing catastrophic water flooding?',
          teacherTips: 'Do not use water during the very first run—listen for relay click and inspect LED first!'
        }
      ]
    },
    {
      id: 'test',
      title: 'Test and improve',
      strap: 'Data Trials, User Testing & Iterative Refinement',
      weeks: [9, 10],
      goal: 'Run controlled multi-day trial experiments, compare against baseline criteria, conduct stakeholder usability tests, and engineer at least one verified improvement.',
      tasks: [
        'Conduct a 7-day or accelerated thermal chamber stress test (at least 3 trials for every metric).',
        'Record water consumption (mL) and temperature differentials (°C) in structured test tables.',
        'Invite community gardener stakeholder to test the device usability and control interface.',
        'Implement at least one hardware or software improvement based on test failure data.',
        'Re-test and calculate percentage improvement against original baseline.'
      ],
      evidence: [
        'Experimental data table with at least 3 trials per condition',
        'Graph comparing protected micro-climate vs unshaded control bed',
        'Stakeholder user-testing feedback interview notes',
        'Before-and-After documentation of verified design improvement'
      ],
      aiPromptStarters: [
        'Here are my test results: [paste data]. Help me calculate the mean temperature drop and percent water saved.',
        'My servo motor is jittering and getting hot when holding the canopy open. What hardware or software change can fix this?',
        'Based on this gardener feedback: "I could not tell if the water reservoir was empty until it beeped", suggest 3 intuitive visual alert ideas.'
      ],
      competencies: ['ctps-03', 'ctps-02', 'lc-02', 'ct-12', 'sea-04'],
      stretchCompetencies: ['ctps-07', 'sdl-09'],
      sessions: [
        {
          sessionNumber: 17,
          week: 9,
          title: 'Controlled Test Protocol & Multi-Trial Benchmarking',
          durationMin: 50,
          learningGoal: 'Execute rigorous scientific testing with independent, dependent, and controlled variables across 3 trials.',
          activities: [
            'Set up dual test rig: Bed A (EcoCool autonomous prototype) vs Bed B (Unshaded control bed).',
            'Subject both beds to identical 60-minute heat lamp simulation.',
            'Log soil temperature at 5-minute intervals and measure total water dispensed.'
          ],
          learnerChoices: {
            question: 'Which test scenario will your team stress-test first?',
            options: [
              { id: 'stress-peak-heat', label: 'Peak Midday Solar Flare (42°C simulation)', description: 'Maximum radiant heat lamp intensity for 45 minutes to test canopy thermal drop.' },
              { id: 'stress-drought', label: 'Extended Dry Spell (48-hour moisture decay)', description: 'Monitoring moisture depletion curve and automated drip recovery pulses.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Log your multi-trial test data table (Trial 1, 2, 3) comparing protected bed vs control bed.',
            targetCompetencies: ['ctps-03', 'ctps-02']
          },
          reflectionPrompt: 'Why are single-trial results unreliable in engineering design?',
          teacherTips: 'Check that learners measure soil temperature at the root depth (3-5 cm), not just ambient air above the leaves.'
        },
        {
          sessionNumber: 18,
          week: 9,
          title: 'Data Analytics & Pattern Recognition',
          durationMin: 50,
          learningGoal: 'Analyze experimental data tables to calculate mean temperature reductions and water efficiency percentages.',
          activities: [
            'Compute average soil temperature difference: $\\Delta T = T_{control} - T_{ecocool}$.',
            'Compute water savings percentage: $\\% \\text{ saved} = \\frac{W_{manual} - W_{ecocool}}{W_{manual}} \\times 100$.',
            'Identify anomalies (e.g., uneven canopy coverage or localized dry spots in soil).'
          ],
          learnerChoices: {
            question: 'How will your team visualize your trial comparison data?',
            options: [
              { id: 'viz-dual-line', label: 'Time-Series Thermal Line Graph', description: 'Dual lines showing temperature curves over 60 minutes for protected vs control.' },
              { id: 'viz-bar-water', label: 'Water Consumption Comparison Bar Chart', description: 'Side-by-side volume comparisons showing liters saved per week.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your finalized comparative data graph and summary analysis.',
            targetCompetencies: ['ctps-03', 'ct-12']
          },
          reflectionPrompt: 'Did your prototype meet your original defined success criteria (e.g. 40% water reduction)? What is the actual gap?',
          teacherTips: 'Guide students to celebrate data gaps—finding where the build falls short is where genuine engineering happens.'
        },
        {
          sessionNumber: 19,
          week: 10,
          title: 'Stakeholder Usability Testing & Ergonomics',
          durationMin: 50,
          learningGoal: 'Gather actionable feedback from target users interacting with the working prototype.',
          activities: [
            'Demonstrate the working physical rig to community garden volunteers or peer evaluators.',
            'Observe user behavior: do they understand when the system is armed? Can they refill the reservoir easily?',
            'Transcribe user suggestions and friction points.'
          ],
          learnerChoices: {
            question: 'Which usability aspect will you probe most deeply with your tester?',
            options: [
              { id: 'eval-interface', label: 'Status Legibility & Alert Clarity', description: 'Can the gardener tell if water is low or battery is weak from 2 meters away?' },
              { id: 'eval-maintenance', label: 'Ease of Reservoir Refill & Cleaning', description: 'Can an elderly volunteer refill the reservoir without spilling onto electronics?' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Log the direct feedback notes, quotes, and usability scores from your user evaluation session.',
            targetCompetencies: ['lc-02', 'sea-04']
          },
          reflectionPrompt: 'What feedback did the user give that surprised your team and made you want to change your design?',
          teacherTips: 'Remind learners not to defend their prototype defensively when users encounter confusion.'
        },
        {
          sessionNumber: 20,
          week: 10,
          title: 'Engineering Improvement & Verification Re-Test',
          durationMin: 50,
          learningGoal: 'Design, implement, and quantitatively verify at least one major hardware or software iteration.',
          activities: [
            'Brainstorm iterations addressing test data flaws (e.g., adding an anti-siphon valve, adding servo sleep to stop jitter, or adjusting canopy overhang).',
            'Implement modification and execute verification trial test.',
            'Document before-and-after comparison in evidence portfolio.'
          ],
          learnerChoices: {
            question: 'What verified improvement will your team implement?',
            options: [
              { id: 'iter-servo-sleep', label: 'Software Servo Power-Down', description: 'Shut off PWM signal to servo after canopy deploys to prevent motor hum and reduce battery drain by 65%.' },
              { id: 'iter-reflector-skirt', label: 'Reflective Mylar Side-Flaps', description: 'Add 5cm angled flaps to canopy edges, reducing soil root zone temperature by an additional 2.8°C.' },
              { id: 'iter-water-level', label: 'Low-Water LED Beacon & Buzzer', description: 'Add float sensor alert warning gardener before pump runs dry and overheats.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Document your Before-and-After improvement with numeric evidence proving the upgrade worked.',
            targetCompetencies: ['ctps-02', 'ct-12']
          },
          reflectionPrompt: 'How did this iterative improvement turn a previous prototype weakness into an engineering strength?',
          teacherTips: 'Require before-and-after photos and quantitative numbers before signing off on this evidence.'
        }
      ]
    },
    {
      id: 'share',
      title: 'Showcase or present',
      strap: 'Public Storytelling & Competency Reflection',
      weeks: [11, 12],
      goal: 'Communicate the project journey, working hardware, validated impact, and ethical AI partnership to an authentic audience of community members and coaches.',
      tasks: [
        'Choose presentation format: Interactive Showcase Expo Booth OR Formal Slide Pitch.',
        'Synthesize evidence portfolio into a cohesive narrative (Problem, Empathy, Engineering, Data, Impact, AI Partnership).',
        'Conduct a rehearsal and collect peer and coach critique.',
        'Deliver final showcase presentation to community visitors and stakeholders.',
        'Complete end-of-term competency growth reflection.'
      ],
      evidence: [
        'Showcase booth plan or pitch slide deck',
        'Rehearsal feedback notes and adjustments made',
        'Final comprehensive project reflection connecting evidence to WeLearn competencies'
      ],
      aiPromptStarters: [
        'Help our team structure a compelling 5-minute pitch about our smart garden project using the hook-problem-solution-data-future framework.',
        'Act as a tough engineering judge and ask us 4 challenging questions about our micro:bit circuit and sensor accuracy.',
        'Review our presentation slide outline and check if our claims about water reduction are backed up by our data.'
      ],
      competencies: ['ec-11', 'ec-03', 'ec-02', 'ec-12', 'sdl-04', 'ctps-04'],
      stretchCompetencies: ['ec-07', 'ec-09', 'ct-08', 'ctps-08', 'ent-07'],
      sessions: [
        {
          sessionNumber: 21,
          week: 11,
          title: 'Story Arc & Showcase Strategy',
          durationMin: 50,
          learningGoal: 'Structure an engaging engineering story arc highlighting failures overcome and measured impact.',
          activities: [
            'Select final format: Live Interactive Expo Stand vs Formal 5-Minute Slide Pitch.',
            'Draft narrative storyboard: The Hook (Community Garden in Crisis) -> Empathy -> Prototypes That Broke -> The Breakthrough -> Tested Impact Data -> Ethical AI Co-Pilot Role.',
            'Assign team speaking and demonstration roles.'
          ],
          learnerChoices: {
            question: 'Which showcase format does your team select for the final expo?',
            options: [
              { id: 'format-booth', label: 'Interactive Expo Stand', description: 'Live physical demo stand where guests trigger sensors and observe canopy/pump action.' },
              { id: 'format-pitch', label: 'Formal Stage Pitch with Slides', description: '5-minute slide presentation followed by 3-minute Q&A with community panel judges.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your presentation storyboard outline and team member speaking assignments.',
            targetCompetencies: ['ec-11', 'ec-02']
          },
          reflectionPrompt: 'Why is talking honestly about what broke during testing often more impressive to judges than claiming everything worked on day one?',
          teacherTips: 'Provide the showcase rubric and encourage teams to make live physical hardware the centerpiece.'
        },
        {
          sessionNumber: 22,
          week: 11,
          title: 'Rehearsal, Peer Critique & AI Defense Prep',
          durationMin: 50,
          learningGoal: 'Practice pitch under timed conditions and defend technical decisions against challenging audience questions.',
          activities: [
            'Conduct timed 5-minute dry runs with another team acting as skeptical reviewers.',
            'Consult PBL Studio AI Co-Pilot in "Tough Judge" mode for mock technical defense.',
            'Incorporate feedback to streamline slide transitions and live hardware handling.'
          ],
          learnerChoices: {
            question: 'What judge challenge question will your team prepare for most thoroughly?',
            options: [
              { id: 'defense-cost', label: 'Economic Feasibility & Scaling', description: 'Defending total unit bill of materials and viability for real neighborhood deployment.' },
              { id: 'defense-ai', label: 'AI Provenance & Code Authorship', description: 'Explaining exactly how the team authored, validated, and modified AI-generated code.' },
              { id: 'defense-data', label: 'Statistical Validity of Test Data', description: 'Defending sensor accuracy, calibration error margins, and trial consistency.' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Log the rehearsal feedback received from peers and the adjustments your team made.',
            targetCompetencies: ['ec-03', 'sdl-04']
          },
          reflectionPrompt: 'Which question caught your team off guard during rehearsal, and how did you refine your response?',
          teacherTips: 'Time each group strictly with a stopwatch to build stage pacing discipline.'
        },
        {
          sessionNumber: 23,
          week: 12,
          title: 'The Public Showcase & Community Demonstration',
          durationMin: 50,
          learningGoal: 'Present working prototype and portfolio evidence to community guests, family, and coaches.',
          activities: [
            'Set up demonstration tables with live working rigs, poster visuals, and telemetry data tables.',
            'Demonstrate automated shading and drip pulse live to visiting community garden stakeholders.',
            'Answer audience questions and collect written guest impressions.'
          ],
          learnerChoices: {
            question: 'How will your team engage visitors at your stand?',
            options: [
              { id: 'engage-interactive', label: 'Live Guest Sensor Interaction', description: 'Guests place warm hand on sensor to trigger canopy deployment and observe pump response.' },
              { id: 'engage-telemetry', label: 'Live Data Dashboard Display', description: 'Display live serial graph of soil readings alongside taste tests of garden produce.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos/video of your team presenting your working project at the Showcase.',
            targetCompetencies: ['ec-12', 'ctps-04']
          },
          reflectionPrompt: 'What was the proudest moment of today\'s public showcase?',
          teacherTips: 'Invite local community garden coordinators, parents, and school administrators as guest evaluators.'
        },
        {
          sessionNumber: 24,
          week: 12,
          title: 'Final Competency Reflection & Future Scaling',
          durationMin: 50,
          learningGoal: 'Reflect deeply on personal competency growth across the 7 WeLearn domains and synthesize term takeaways.',
          activities: [
            'Audit individual evidence portfolio against WeLearn 85 competencies.',
            'Write final personal reflection focusing on: Self-Directed Learning, Engineering Persistence, and Human-AI Partnership.',
            'Propose Phase 2 enhancements (e.g. LoRa long-range wireless telemetry, solar charging).'
          ],
          learnerChoices: {
            question: 'Which WeLearn competency domain did you personally grow the most in this term?',
            options: [
              { id: 'growth-sdl', label: 'Self-Directed Learning (SDL)', description: 'Taking ownership of technical debugging, time management, and learning new tools.' },
              { id: 'growth-ctps', label: 'Critical Thinking & Problem Solving (CTPS)', description: 'Analyzing empirical sensor data and breaking complex problems into sub-systems.' },
              { id: 'growth-lc', label: 'Leadership & Collaboration (LC)', description: 'Navigating team disagreements, dividing tasks fairly, and supporting teammates.' },
              { id: 'growth-ec', label: 'Effective Communication (EC)', description: 'Translating technical schematics into clear stories for real people.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Submit your comprehensive Final Term Reflection citing at least 3 portfolio evidence artifacts.',
            targetCompetencies: ['sdl-04', 'ctps-04', 'sea-04']
          },
          reflectionPrompt: 'Looking back at Day 1, how has your view of what engineers do changed? How will you use AI differently in future projects?',
          teacherTips: 'Celebrate every learner\'s persistence; emphasize that failure and debugging are the core of engineering.'
        }
      ]
    }
  ]
};
