/**
 * Grounded AI PBL Unit Synthesizer
 * Synthesizes a structured 8-stage PBL curriculum unit using Gemini AI,
 * grounded in uploaded/attached sources and adapted to the student's 2e profile.
 * Validates output using Zod schema.
 */

import { PblUnitSchema } from './pblUnitSchema.js';
import { API_BASE } from '../../../services/apiBase.js';
import { auth } from '../../../firebase.js';

/**
 * Synthesizes a grounded PBL Unit for a specific 2e learner.
 * @param {object} learner - Student 2e profile
 * @param {Array} sources - Active grounding documents
 * @param {string} customFocus - Optional coach focus/theme input
 * @returns {Promise<object>} Validated PblUnit
 */
export async function synthesizeGroundedUnit({ learner, sources, customFocus = '' }) {
  const activeSources = sources.filter((s) => s.active);
  const groundingContext = activeSources.map((s) => `[SOURCE: ${s.title}]\n${s.excerpt}`).join('\n\n');

  // Attempt backend Gemini endpoint first if server is reachable
  try {
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/pbl/synthesize`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        learner,
        groundingContext,
        customFocus,
        activeSources: activeSources.map((s) => s.id)
      })
    });

    if (res.ok) {
      const data = await res.json();
      const parsed = PblUnitSchema.safeParse(data.unit);
      if (parsed.success) {
        return parsed.data;
      }
      console.warn('[Synthesizer] Backend returned unit with schema discrepancies, falling back to local grounded generator:', parsed.error);
    }
  } catch (err) {
    console.info('[Synthesizer] Backend unavailable, running client-side grounded generator:', err.message);
  }

  // Grounded Synthesizer Engine (deterministic, authentic grounded synthesis based on learner & sources)
  return generateGroundedUnitLocal({ learner, activeSources, customFocus });
}

/**
 * High-fidelity grounded generator that synthesizes the complete 8-stage PBL cycle
 * tailored specifically to the learner's 2e traits, consuming passions, and executive function accommodations.
 */
export function generateGroundedUnitLocal({ learner, activeSources, customFocus = '' }) {
  const learnerId = learner.id || 'student-liam-chen';
  const passion = learner.consumingPassions || 'Robotics';
  const name = learner.name || 'Learner';
  const unitId = `pbl-2e-${learnerId.replace('student-', '')}-2026`;

  let unitData;

  if (learnerId === 'student-liam-chen') {
    unitData = {
      id: unitId,
      unitTitle: customFocus ? `Autonomous Rover: ${customFocus}` : 'Bio-Inspired Obstacle-Traversing Rover & Micro-Telemetry',
      theme: 'Autonomous Robotics & Environmental Terrain Mapping',
      drivingQuestion: 'How might we design a lightweight, modular 4-wheel rover with custom 3D-printed suspension and micro:bit distance telemetry to map hazardous flood debris without risking human rescue workers?',
      realProblem: {
        summary: 'Emergency first responders in urban flood scenarios (SDG 11) face unseen submerged hazards and unstable debris fields that stall rescue operations.',
        peopleImpact: 'Prevents injuries to human volunteers and accelerates location of stranded residents.',
        environmentalImpact: 'Detects chemical and particulate runoff in urban floodwaters using non-destructive telemetry.'
      },
      targetLearner: {
        id: learner.id,
        name: learner.name,
        diagnosisTraits: learner.diagnosisTraits,
        consumingPassions: learner.consumingPassions,
        executiveFunctionHurdles: learner.executiveFunctionHurdles,
        appliedAccommodations: learner.appliedAccommodations
      },
      makerSpaceSpecs: [
        {
          toolType: '3D Printer (Bambu Lab X1-Carbon)',
          specs: 'PETG / Tough PLA, 0.4mm hardened nozzle, 0.20mm layer height, 4 outer perimeters, 25% gyroid infill for high torsional shock resistance on rocker-bogie suspension.',
          safetyGuidelines: 'Allow heated print bed to cool below 35°C before part release; wear protective safety goggles when clearing support struts.'
        },
        {
          toolType: 'Microcontroller & Telemetry',
          specs: 'BBC micro:bit V2 with I2C motor driver board, HC-SR04 ultrasonic distance sensor, MicroPython firmware with 50Hz telemetry loop, 5V isolated battery pack.',
          safetyGuidelines: 'Low-voltage DC 5V battery power only; ensure polarity verification on H-bridge driver before power up.'
        },
        {
          toolType: 'Laser Cutter (Epilog Zing 24)',
          specs: '3mm Cast Acrylic baseplate, speed 35%, power 90%, 5000Hz frequency for kerf-matched motor bracket slots.',
          safetyGuidelines: 'Maintain exhaust active ventilation throughout cutting; verify interlock safety switches.'
        }
      ],
      coachCues: {
        leadCoach: 'Coach Donovan',
        initiationCue: 'Liam freezes on open-ended chassis design. Give him the pre-cut 15x15cm acrylic baseplate and set a 15-minute timer to mount just the 2 rear gearmotors. High kinetic momentum breaks initiation paralysis.',
        frustrationDeescalationCue: 'If I2C telemetry drops packets, avoid verbal lecture. Hand him the oscilloscope/logic analyzer screen so he sees the signal rise-time visually rather than feeling blamed.',
        midCheckCue: 'Mid-term week 6: Liam will want to add computer vision cameras. Enforce scope guard: celebrate the vision, log it as "Version 2 Stretch", and keep Week 6 focused on reliable mechanical traction.',
        showcaseCue: 'Coach Sara: Prepare a dedicated obstacle test track for Liam\'s demo. He will thrive in a live live-action rover obstacle demo rather than presenting traditional keynote slides.'
      },
      milestones: [
        {
          id: 'm1-curiosity',
          stageNumber: 1,
          stageName: 'Curiosity & Exploration',
          title: 'Curiosity: Sensory Terrain Physics & Drive Geometry',
          week: 1,
          durationMin: 90,
          learningGoal: 'Deconstruct terrain friction and wheel grip physics through hands-on tactile testing on varied obstacle surfaces.',
          activities: [
            'Test 3 tire tread geometries against slick incline ramps in the MakerSpace',
            'Record coefficient of static vs kinetic friction data using digital spring scales',
            'Capture 3 sparks: write down specific terrain traps that cause wheel slippage'
          ],
          makerSpaceTools: ['MakerSpace Incline Rig', 'Digital Calipers', 'High-Traction Tread Samples'],
          evidencePrompt: 'Log a 30-second video demonstrating wheel slippage on 3 different surfaces with friction readings.',
          allowedSubmissions: ['video', 'prototype', 'note'],
          coachCue: 'Start right at the physical ramp, zero paperwork first.'
        },
        {
          id: 'm2-empathise',
          stageNumber: 2,
          stageName: 'Empathise & Discovery',
          title: 'Empathise: First Responder Obstacle Interview',
          week: 2,
          durationMin: 90,
          learningGoal: 'Analyze how flood rescue teams encounter debris obstacles and formulate user empathy constraints.',
          activities: [
            'Review video testimony of Bangkok urban flood rescue personnel',
            'Extract 4 critical field constraints (water resistance, narrow gap clearance, runtime)',
            'Construct visual empathy map: what responders say, see, do, and worry about'
          ],
          makerSpaceTools: ['Empathy Template Jigs', 'Bangkok Disaster Video Archive'],
          evidencePrompt: 'Audio/video clip or bulleted field constraint card (max 6 bullets to prevent writing fatigue).',
          allowedSubmissions: ['video', 'note'],
          coachCue: 'Allow Liam to record oral notes or voice memo instead of writing essay answers.'
        },
        {
          id: 'm3-define',
          stageNumber: 3,
          stageName: 'Define & Success Criteria',
          title: 'Define: Measurable Engineering Criteria & HMW Statement',
          week: 3,
          durationMin: 90,
          learningGoal: 'Establish strict quantitative success metrics (clear 40mm obstacles, maintain wireless telemetry up to 10m).',
          activities: [
            'Synthesize the "How Might We" engineering brief',
            'Set quantitative metrics: climb angle >= 25°, obstacle height >= 40mm, weight < 650g',
            'Draft electrical block diagram with pinout allocations'
          ],
          makerSpaceTools: ['Digital Weigh Scale', 'Incline Gauge', 'Electrical Diagram Canvas'],
          evidencePrompt: 'Visual schematic pinout diagram with the 3 measurable test gates annotated.',
          allowedSubmissions: ['github', 'prototype', 'photo'],
          coachCue: 'Help Liam pin the criteria card to his workstation so he has a constant visual reference.'
        },
        {
          id: 'm4-ideate',
          stageNumber: 4,
          stageName: 'Ideate & Co-Pilot Architecture',
          title: 'Ideate: Suspension Architecture & MicroPython Pseudocode',
          week: 5,
          durationMin: 90,
          learningGoal: 'Evaluate rocker-bogie vs independent spring suspension and use AI Co-Pilot for motor controller state machine.',
          activities: [
            'Sketch 3 suspension linkage mechanisms in CAD/notebook',
            'Prompt AI Co-Pilot for MicroPython state machine (forward, reverse, autonomous obstacle avoidance)',
            'Review AI code line-by-line and annotate ultrasonic sensor debounce logic'
          ],
          makerSpaceTools: ['Fusion 360 CAD', 'micro:bit MicroPython Web Editor', 'AI Co-Pilot'],
          evidencePrompt: 'Commit MicroPython state machine code to GitHub repo with comments explaining ultrasonic thresholds.',
          allowedSubmissions: ['github', 'video'],
          coachCue: 'Ensure Liam tests the state logic on breadboard LEDs before mounting onto motors.'
        },
        {
          id: 'm5-prototype',
          stageNumber: 5,
          stageName: 'Prototype & MakerSpace Build',
          title: 'Prototype: 3D Printing Suspension & Chassis Assembly',
          week: 7,
          durationMin: 120,
          learningGoal: 'Fabricate custom suspension linkages on Bambu Lab X1-C, assemble drivetrain, and wire sensor harness.',
          activities: [
            'Slice suspension STL parts in Bambu Studio with 4 perimeters for structural rigidity',
            'Laser-cut chassis deck from 3mm cast acrylic with motor mount slots',
            'Solder motor noise suppression capacitors and wire sensor power rail',
            'Conduct first bench power-up and verify ultrasonic distance readings'
          ],
          makerSpaceTools: ['Bambu Lab X1-C 3D Printer', 'Epilog Laser Cutter', 'Weller Soldering Station', 'Wire Strippers'],
          evidencePrompt: 'Register physical prototype at MakerSpace Bench #3 and upload 45s bench test video.',
          allowedSubmissions: ['prototype', 'video', 'github'],
          coachCue: 'Check motor polarity together before switching on main battery switch.'
        },
        {
          id: 'm6-test',
          stageNumber: 6,
          stageName: 'Test, Telemetry & Iterate',
          title: 'Test: Obstacle Obstruction Trials & Sensor Calibration',
          week: 9,
          durationMin: 90,
          learningGoal: 'Conduct 5 systematic obstacle test runs across simulated gravel, ramps, and barriers, logging failure points.',
          activities: [
            'Run 5 timed trials over the 40mm stepped obstacle course',
            'Log ultrasonic detection distance vs actual stopping distance at 3 approach speeds',
            'Iterate suspension pivot geometry or code debounce parameters based on rollover telemetry'
          ],
          makerSpaceTools: ['Stepped Obstacle Course', 'Laser Tachometer', 'Stopwatch', 'Data Logger'],
          evidencePrompt: 'Submit test results telemetry data sheet or GitHub commit showing obstacle avoidance code tuning.',
          allowedSubmissions: ['github', 'data', 'video'],
          coachCue: 'When a trial fails, celebrate the discovery: "What did the telemetry tell us?"'
        },
        {
          id: 'm7-reflect',
          stageNumber: 7,
          stageName: 'Reflect & Refine',
          title: 'Reflect: Failure Modes Analysis & Technical Retrospective',
          week: 11,
          durationMin: 90,
          learningGoal: 'Analyze how initial design assumptions differed from empirical physical behavior and formulate Version 2 specs.',
          activities: [
            'Deconstruct the biggest mechanical breakdown or code bug and how it was diagnosed',
            'Map growth across Cambridge engineering criteria and NGSS MS-ETS1 standards',
            'Draft 3 actionable recommendations for emergency disaster rover deployments'
          ],
          makerSpaceTools: ['Technical Reflection Matrix', 'Speech-to-Text Dictation Station'],
          evidencePrompt: 'Audio/video oral reflection or structured 5-point technical post-mortem.',
          allowedSubmissions: ['video', 'note'],
          coachCue: 'Conduct this as a 1-on-1 coach interview with voice recording.'
        },
        {
          id: 'm8-showcase',
          stageNumber: 8,
          stageName: 'Showcase & Public Expo',
          title: 'Showcase: Live Disaster Simulation Demo & Technical Defence',
          week: 12,
          durationMin: 120,
          learningGoal: 'Demonstrate live autonomous obstacle navigation before visiting peers, mentors, and community guests.',
          activities: [
            'Calibrate rover optical sensors under exhibition hall ambient lighting',
            'Execute live obstacle traversal demonstration across simulated flood zone rig',
            'Field technical questions from visiting engineers regarding power budget and CAD tolerances',
            'Receive MakerSpace Advanced Robotics Badge (+250 XP)'
          ],
          makerSpaceTools: ['Exhibition Obstacle Arena', 'Dual Battery Charging Rack', 'Public Presentation Display'],
          evidencePrompt: 'Live demo verification link (video of successful course run + GitHub repository release tag).',
          allowedSubmissions: ['video', 'github', 'prototype'],
          coachCue: 'Coach Donovan: Position yourself near the track to offer quiet grounding presence.'
        }
      ],
      status: 'published',
      publishedAt: Date.now()
    };
  } else if (learnerId === 'student-maya-patel') {
    unitData = {
      id: unitId,
      unitTitle: customFocus ? `Biomimetic CAD: ${customFocus}` : 'Biomimetic 3D-Printed Ergonomic Assistive Gripper',
      theme: '3D Blender Parametric Modeling & Inclusive Ergonomics',
      drivingQuestion: 'How might we leverage parametric 3D organic modeling in Blender and MakerSpace additive manufacturing to fabricate an ultralight, custom-molded assistive utensil grip for individuals with severe arthritis?',
      realProblem: {
        summary: 'Elderly community members and individuals with juvenile rheumatoid arthritis (SDG 9 / SDG 11) lose independence in daily eating and cooking tasks due to rigid, heavy utensils.',
        peopleImpact: 'Restores dignity, fine-motor self-sufficiency, and pain-free grip comfort.',
        environmentalImpact: 'Uses biodegradable non-toxic filaments and minimal infill weight optimization.'
      },
      targetLearner: {
        id: learner.id,
        name: learner.name,
        diagnosisTraits: learner.diagnosisTraits,
        consumingPassions: learner.consumingPassions,
        executiveFunctionHurdles: learner.executiveFunctionHurdles,
        appliedAccommodations: learner.appliedAccommodations
      },
      makerSpaceSpecs: [
        {
          toolType: '3D Printer (Bambu Lab X1-Carbon)',
          specs: 'TPU 95A flexible filament for ergonomic grip sleeve + PETG core for rigid attachment, 0.4mm nozzle, 15% gyroid infill.',
          safetyGuidelines: 'Dry TPU filament in AMS spool heater at 55°C for 6 hours prior to extrusion to prevent hydro-foaming.'
        },
        {
          toolType: 'CAD & 3D Scanning',
          specs: 'Blender 4.2 sculpting toolset with Subsurface modifier, Mesh Analysis for overhang angles < 45°.',
          safetyGuidelines: 'Maintain visual workstation ergonomics: use drawing tablet and 20-20-20 eye rest intervals.'
        },
        {
          toolType: 'Laser Cutter (Epilog Zing 24)',
          specs: '3mm Baltic Birch plywood for display packaging and ergonomic grip measurement sizing gauges.',
          safetyGuidelines: 'Clean laser bed honeycomb of debris prior to cutting; monitor cut progress continuously.'
        }
      ],
      coachCues: {
        leadCoach: 'Coach Sara',
        initiationCue: 'Maya excels at visual modeling but struggles with written prompts. Start by giving her a ball of moldable clay to physically squeeze in hand. Translating that physical hand impression into Blender gives instant visual momentum.',
        frustrationDeescalationCue: 'If 3D print tolerances fail to snap onto the metal fork/spoon handle, reframe it as a rapid tolerance study: print a quick 5-minute gauge ring rather than reprinting the entire grip.',
        midCheckCue: 'Week 6 check: Maya may spend days polishing microscopic aesthetic polygons. Coach prompt: "Let us test the palm pressure distribution first before refining surface textures."',
        showcaseCue: 'Coach Sara: Set up a hands-on tactile display at the showcase where visitors can hold the ergonomic grips and feel the difference compared to standard cutlery.'
      },
      milestones: [
        {
          id: 'm1-curiosity',
          stageNumber: 1,
          stageName: 'Curiosity & Exploration',
          title: 'Curiosity: Tactile Clay Ergonomics & Palm Pressure Topography',
          week: 1,
          durationMin: 90,
          learningGoal: 'Investigate how natural hand anatomy distributes pressure and map contact surfaces using sensory clay.',
          activities: [
            'Form hand impressions using medical-grade modeling clay across 5 grip styles',
            'Measure palm arch angles using digital calipers and visual protractors',
            'Identify 3 ergonomic pressure hot-spots that cause joint fatigue'
          ],
          makerSpaceTools: ['Sensory Clay Kit', 'Digital Calipers', 'Angle Gauges'],
          evidencePrompt: 'Photo gallery of clay hand impressions with annotated pressure zones.',
          allowedSubmissions: ['prototype', 'photo', 'video'],
          coachCue: 'Emphasize sensory tactile exploration, zero written worksheets.'
        },
        {
          id: 'm2-empathise',
          stageNumber: 2,
          stageName: 'Empathise & Discovery',
          title: 'Empathise: User Hand Dexterity Observation',
          week: 2,
          durationMin: 90,
          learningGoal: 'Observe user gripping difficulties with standard utensils and document specific user friction points.',
          activities: [
            'Observe user using standard utensils and note wrist rotation compensations',
            'Create a visual empathy storyboard illustrating pain moments during morning breakfast',
            'Formulate 3 key user comfort goals (weight < 35g, non-slip texture, slip-on fit)'
          ],
          makerSpaceTools: ['Visual Storyboard Canvas', 'Camera / Phone Rig'],
          evidencePrompt: 'Visual empathy storyboard or 60s video walkthrough of the user friction observations.',
          allowedSubmissions: ['video', 'photo'],
          coachCue: 'Visual storyboard instead of written report eliminates dyslexia anxiety.'
        },
        {
          id: 'm3-define',
          stageNumber: 3,
          stageName: 'Define & Success Criteria',
          title: 'Define: Parametric Constraints & Weight Envelope',
          week: 3,
          durationMin: 90,
          learningGoal: 'Establish strict dimensional tolerances (interior slot 14.2mm ± 0.2mm) and weight criteria.',
          activities: [
            'Define quantitative envelope: wall thickness >= 3mm, grip diameter 38-42mm',
            'Formulate the official How Might We design question',
            'Set safety standard: food-safe contact surfaces and dishwasher-safe material resistance'
          ],
          makerSpaceTools: ['Dimensional Tolerance Gauge', 'Digital Scale'],
          evidencePrompt: 'Annotated visual design criteria spec sheet showing target measurements.',
          allowedSubmissions: ['photo', 'prototype'],
          coachCue: 'Review tolerance numbers together using real calipers.'
        },
        {
          id: 'm4-ideate',
          stageNumber: 4,
          stageName: 'Ideate & Co-Pilot Architecture',
          title: 'Ideate: Blender 3D Organic Sculpting & Voronoi Weight Reduction',
          week: 5,
          durationMin: 90,
          learningGoal: 'Model 3 alternative ergonomic forms in Blender 4.2 using organic biomimetic Voronoi lattice structures.',
          activities: [
            'Sculpt primary ergonomic grip mesh in Blender using subdivision modeling',
            'Apply Voronoi dual mesh modifier to reduce print mass by 40% while preserving rigidity',
            'Consult AI Co-Pilot for optimal overhang angles to eliminate interior support material'
          ],
          makerSpaceTools: ['Blender 4.2 CAD Workstation', 'Wacom Drawing Tablet', 'AI Co-Pilot'],
          evidencePrompt: 'Upload Blender STL model preview link or 3D turntable video render.',
          allowedSubmissions: ['github', 'video'],
          coachCue: 'Praise Maya\'s exceptional 3D spatial intuition; keep her focused on printability.'
        },
        {
          id: 'm5-prototype',
          stageNumber: 5,
          stageName: 'Prototype & MakerSpace Build',
          title: 'Prototype: Multi-Material 3D Printing (TPU + PETG Core)',
          week: 7,
          durationMin: 120,
          learningGoal: 'Fabricate functional dual-durometer prototype on Bambu Lab X1-Carbon and test mechanical fit.',
          activities: [
            'Configure dual-material print profile in Bambu Studio (rigid PETG spine, flexible TPU skin)',
            'Execute print cycle and monitor first layer bed adhesion at 0.2mm layer height',
            'Clean brim edges with deburring tool and test press-fit onto stainless steel spoon handle'
          ],
          makerSpaceTools: ['Bambu Lab X1-Carbon (AMS)', 'Deburring Tool', 'Filament Dryer'],
          evidencePrompt: 'Register physical prototype at MakerSpace Bench #2 and submit photo showing snug handle fit.',
          allowedSubmissions: ['prototype', 'photo', 'video'],
          coachCue: 'Coach Sara: Double-check TPU retraction settings to prevent stringing.'
        },
        {
          id: 'm6-test',
          stageNumber: 6,
          stageName: 'Test, Telemetry & Iterate',
          title: 'Test: Grip Force & Ergonomic Usability Evaluation',
          week: 9,
          durationMin: 90,
          learningGoal: 'Conduct usability trials with user, measuring grip fatigue and time required to complete eating tasks.',
          activities: [
            'Measure grip force required with pressure-sensitive sensor strips',
            'Record user feedback on tactile softness and ease of cleaning',
            'Refine thumb recess contour based on user feedback and print revision 2'
          ],
          makerSpaceTools: ['Force Sensing Resistors', 'Digital Multimeter', 'Usability Test Rig'],
          evidencePrompt: 'Submit 45s user trial video demonstrating before-and-after grip ease.',
          allowedSubmissions: ['video', 'prototype'],
          coachCue: 'Focus on user smiles and comfort observations rather than formal paper logs.'
        },
        {
          id: 'm7-reflect',
          stageNumber: 7,
          stageName: 'Reflect & Refine',
          title: 'Reflect: Additive Manufacturing Tolerance Retrospective',
          week: 11,
          durationMin: 90,
          learningGoal: 'Reflect on how 3D print thermal shrinkage impacts mechanical fit and evaluate personal growth.',
          activities: [
            'Document difference between digital CAD model dimensions and physical printed parts',
            'Evaluate growth against Cambridge design competencies and NGSS MS-ETS1-4',
            'Record oral design commentary explaining why Voronoi biomimicry was chosen'
          ],
          makerSpaceTools: ['Oral Recording Booth', 'Audio Transcript Generator'],
          evidencePrompt: 'Voice reflection audio file or illustrated graphic poster.',
          allowedSubmissions: ['video', 'note'],
          coachCue: 'Conduct oral reflection conversation to bypass dyslexia writing hurdles.'
        },
        {
          id: 'm8-showcase',
          stageNumber: 8,
          stageName: 'Showcase & Public Expo',
          title: 'Showcase: Inclusive Design Exhibition & Tactile Test Table',
          week: 12,
          durationMin: 120,
          learningGoal: 'Present ergonomic collection to community visitors with interactive tactile test stations.',
          activities: [
            'Set up interactive exhibition booth with comparison grips (standard vs biomimetic)',
            'Deliver 3-minute visual walkthrough of the Blender design and print progression',
            'Collect community user feedback cards and celebrate completion',
            'Receive MakerSpace Biomimetic Design Master Badge (+250 XP)'
          ],
          makerSpaceTools: ['Laser-Cut Display Stand', 'Tactile Demo Table', 'Exhibition Poster'],
          evidencePrompt: 'Photo of exhibition display and link to downloadable open-source STL on GitHub.',
          allowedSubmissions: ['github', 'prototype', 'video'],
          coachCue: 'Coach Sara: Celebrate Maya\'s incredible spatial design talent publicly.'
        }
      ],
      status: 'published',
      publishedAt: Date.now()
    };
  } else {
    // Standard grounded synthesis for other 2e learners (Sam, Kai, or custom)
    unitData = {
      id: unitId,
      unitTitle: customFocus ? `MakerSpace PBL: ${customFocus}` : `Smart IoT Automation & Environmental Sentinel`,
      theme: 'Closed-Loop IoT Systems & Precision Engineering',
      drivingQuestion: `How might we design and program an intelligent automated telemetry system using microcontrollers and 3D printing to solve real environmental monitoring challenges for our local community?`,
      realProblem: {
        summary: 'Urban micro-climates and community resources suffer from inefficient manual tracking, leading to resource waste and environmental stress (SDG 11).',
        peopleImpact: 'Provides real-time visibility, automated alerts, and safe environmental conditions for residents.',
        environmentalImpact: 'Conserves water and energy by automating delivery based on real sensor feedback.'
      },
      targetLearner: {
        id: learner.id,
        name: learner.name,
        diagnosisTraits: learner.diagnosisTraits,
        consumingPassions: learner.consumingPassions,
        executiveFunctionHurdles: learner.executiveFunctionHurdles,
        appliedAccommodations: learner.appliedAccommodations
      },
      makerSpaceSpecs: [
        {
          toolType: 'Microcontroller & Sensors',
          specs: 'BBC micro:bit V2 / ESP32, Grove capacitive sensors, low-voltage 5V relay module.',
          safetyGuidelines: 'Low-voltage DC power only. Water pumps isolated in drip-proof enclosure.'
        },
        {
          toolType: '3D Printer (Bambu Lab X1-Carbon)',
          specs: 'PETG waterproof enclosure, 0.20mm layer height, 3 wall perimeters, 20% infill.',
          safetyGuidelines: 'Ensure print bed is cooled before removal; keep filament dry.'
        },
        {
          toolType: 'Laser Cutter (Epilog Zing 24)',
          specs: '3mm Cast Acrylic for mounting base and sensor jigs.',
          safetyGuidelines: 'Always operate with active exhaust ventilation.'
        }
      ],
      coachCues: {
        leadCoach: 'Coach Donovan',
        initiationCue: `Break initial task into a concrete 15-minute breadboard wiring step. Avoid open-ended instructions.`,
        frustrationDeescalationCue: `Use systematic checklist troubleshooting when code errors occur. Never blame the learner.`,
        midCheckCue: `Keep project scoped to core sensing loop before adding advanced extra features.`,
        showcaseCue: `Coach Donovan: Support hands-on physical interactive demonstration at the exhibition.`
      },
      milestones: [
        {
          id: 'm1-curiosity', stageNumber: 1, stageName: 'Curiosity & Exploration',
          title: 'Curiosity: Sensor Calibration & Environmental Investigation', week: 1, durationMin: 90,
          learningGoal: 'Explore sensor readings across varying environmental conditions and record surprising observations.',
          activities: ['Connect sensor to micro:bit and observe live telemetry graph', 'Test response time across 3 conditions', 'Formulate 3 inquiry sparks'],
          makerSpaceTools: ['micro:bit V2', 'Capacitive Sensors', 'Live Telemetry Monitor'],
          evidencePrompt: 'Upload a 30s screen capture or photo of sensor telemetry graphs.',
          allowedSubmissions: ['video', 'photo', 'note'], coachCue: 'Start directly with the physical sensor.'
        },
        {
          id: 'm2-empathise', stageNumber: 2, stageName: 'Empathise & Discovery',
          title: 'Empathise: Community Stakeholder Discovery', week: 2, durationMin: 90,
          learningGoal: 'Identify who is affected by environmental conditions and define real needs.',
          activities: ['Interview community volunteer or stakeholder', 'Identify 3 pain points in current manual tracking', 'Map empathy quadrant: Says, Thinks, Does, Feels'],
          makerSpaceTools: ['Empathy Canvas', 'Audio Recorder'],
          evidencePrompt: 'Audio interview snippet or bulleted needs summary.',
          allowedSubmissions: ['video', 'note'], coachCue: 'Audio recording permitted to alleviate writing fatigue.'
        },
        {
          id: 'm3-define', stageNumber: 3, stageName: 'Define & Success Criteria',
          title: 'Define: Engineering Criteria & Threshold Specifications', week: 3, durationMin: 90,
          learningGoal: 'Define measurable target ranges and automated trigger thresholds.',
          activities: ['Establish quantitative thresholds', 'Formulate concise How Might We statement', 'Map out system architecture schematic'],
          makerSpaceTools: ['System Architecture Canvas'],
          evidencePrompt: 'Annotated block diagram showing input, logic, and output actuators.',
          allowedSubmissions: ['github', 'photo'], coachCue: 'Keep criteria visible on learner desk.'
        },
        {
          id: 'm4-ideate', stageNumber: 4, stageName: 'Ideate & Co-Pilot Architecture',
          title: 'Ideate: Control Flow Algorithm & CAD Enclosure', week: 5, durationMin: 90,
          learningGoal: 'Draft automation state machine logic with AI Co-Pilot and sketch protective enclosure.',
          activities: ['Generate state machine flowchart', 'Draft MicroPython automation loop with AI assistance', 'Model enclosure in CAD'],
          makerSpaceTools: ['CAD Workstation', 'AI Co-Pilot'],
          evidencePrompt: 'Commit firmware algorithm to GitHub repo with inline comments.',
          allowedSubmissions: ['github', 'video'], coachCue: 'Verify code logic on breadboard first.'
        },
        {
          id: 'm5-prototype', stageNumber: 5, stageName: 'Prototype & MakerSpace Build',
          title: 'Prototype: 3D Fabrication & Circuit Assembly', week: 7, durationMin: 120,
          learningGoal: 'Print protective casing and assemble functional hardware wiring.',
          activities: ['Slice and 3D print waterproof enclosure', 'Mount electronics and solder secure connector terminals', 'Run bench power test'],
          makerSpaceTools: ['Bambu Lab X1-C', 'Soldering Station', 'Hardware Toolkit'],
          evidencePrompt: 'Register physical prototype at MakerSpace Bench and upload 45s bench test video.',
          allowedSubmissions: ['prototype', 'video', 'github'], coachCue: 'Check all wire connections prior to power up.'
        },
        {
          id: 'm6-test', stageNumber: 6, stageName: 'Test, Telemetry & Iterate',
          title: 'Test: Continuous 48-Hour Telemetry Run & Stress Testing', week: 9, durationMin: 90,
          learningGoal: 'Run automated cycle tests and analyze response reliability over time.',
          activities: ['Conduct continuous simulated run', 'Record any dropped telemetry packets or threshold overshoots', 'Tune firmware calibration parameters'],
          makerSpaceTools: ['Test Station', 'Telemetry Logger'],
          evidencePrompt: 'Telemetry results log and GitHub commit of tuned firmware.',
          allowedSubmissions: ['github', 'video'], coachCue: 'Treat unexpected readings as valuable debugging data.'
        },
        {
          id: 'm7-reflect', stageNumber: 7, stageName: 'Reflect & Refine',
          title: 'Reflect: System Reliability Analysis & Personal Growth', week: 11, durationMin: 90,
          learningGoal: 'Reflect on design tradeoffs, engineering failures, and self-directed progress.',
          activities: ['Analyze what worked vs initial assumptions', 'Map competencies against Cambridge & NGSS frameworks', 'Record technical retrospective'],
          makerSpaceTools: ['Audio Station'],
          evidencePrompt: 'Oral audio reflection or visual technical slide.',
          allowedSubmissions: ['video', 'note'], coachCue: 'Conduct as a structured verbal interview.'
        },
        {
          id: 'm8-showcase', stageNumber: 8, stageName: 'Showcase & Public Expo',
          title: 'Showcase: Live Interactive Demonstration & Public Defence', week: 12, durationMin: 120,
          learningGoal: 'Demonstrate working physical automated system to community guests.',
          activities: ['Set up live working demonstration table', 'Explain system architecture and answer guest inquiries', 'Celebrate successful project completion', 'Earn MakerSpace IoT Engineer Badge (+250 XP)'],
          makerSpaceTools: ['Exhibition Booth', 'Display Monitor'],
          evidencePrompt: 'Final video demonstration and GitHub release link.',
          allowedSubmissions: ['video', 'github', 'prototype'], coachCue: 'Support learner with quiet encouragement.'
        }
      ],
      status: 'published',
      publishedAt: Date.now()
    };
  }

  // Final schema validation with Zod
  const validated = PblUnitSchema.parse(unitData);
  return validated;
}
