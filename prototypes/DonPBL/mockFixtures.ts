/**
 * Don's PBL Prototype Mock Fixtures
 * Location: prototypes/DonPBL/mockFixtures.ts
 * 
 * Synthetic, isolated fixtures for testing and running the PBL Program prototype
 * without connecting to live Firebase, authentication, or deployed APIs.
 * All learner names, project data, quotes, and metrics are fictional.
 */

export interface CompetencyDomain {
  id: string;
  title: string;
  description: string;
}

export interface Competency {
  id: string;
  domain: string;
  code: string;
  title: string;
  statement: string;
  level: 'foundational' | 'advanced';
}

export interface EvidenceItem {
  id: string;
  phase: 'explore' | 'empathise' | 'define' | 'ideate' | 'prototype' | 'test' | 'share';
  kind: 'note' | 'media' | 'code' | 'data' | 'feedback' | 'ai' | 'reflection';
  title: string;
  body: string;
  link?: string;
  competencies: string[];
  createdAt: number;
  ai?: {
    asked: string;
    gave: string;
    kept: string;
  };
  metrics?: {
    label: string;
    value: string;
  }[];
}

export interface StudentProject {
  id: string;
  teamName: string;
  members: string[];
  gradeLevel: string;
  termId: string;
  currentPhase: 'explore' | 'empathise' | 'define' | 'ideate' | 'prototype' | 'test' | 'share';
  progressPercent: number;
  drivingQuestion: string;
  problem: {
    hmw: string;
    who: string;
    why: string;
    criteria: string;
    constraints: string;
    impactMeasure: string;
  };
  impact: 'people' | 'environment' | 'both' | null;
  codeLanguage: 'micropython' | 'makecode' | 'python' | 'arduino' | 'lego';
  finalFormat: 'showcase' | 'presentation' | 'interactive-stand' | 'stage-pitch' | null;
  tasksDone: Record<string, number[]>; // phase -> array of completed task indices
  evidence: EvidenceItem[];
  sensorState: {
    ambientTemp: number; // in deg C
    soilMoisturePct: number; // 0 - 100%
    canopyDeployed: boolean;
    pumpActive: boolean;
    waterLevelPct: number;
  };
  coachFeedback: {
    coachName: string;
    date: string;
    note: string;
    competencyScores: Record<string, number>; // competencyId -> 1..4 score
  }[];
}

export const COMPETENCY_DOMAINS: CompetencyDomain[] = [
  {
    id: 'sdl',
    title: 'Self-directed Learning',
    description: 'Self-directed learning is the ability to take full responsibility for one’s academic and personal development. This includes setting meaningful goals, strategically planning learning pathways, independently managing time and resources, continuously reflecting on progress, and adapting to feedback and setbacks.'
  },
  {
    id: 'ctps',
    title: 'Critical Thinking and Problem Solving',
    description: 'Critical Thinkers always ask "why" and are not satisfied with the answer to a question until they fully understand not only what the answer is but why it\'s the answer.'
  },
  {
    id: 'lc',
    title: 'Leadership and Collaboration',
    description: 'Learners are able to successfully work both independently and as part of a team and make informed decisions as to when to lead or follow, using influence where appropriate, with understanding and empathy.'
  },
  {
    id: 'ec',
    title: 'Effective Communication',
    description: 'Both written and oral communication allow you to tell your story and invite other people to share with you, conveying ideas clearly and with empathy.'
  },
  {
    id: 'ct',
    title: 'Creative Thinking',
    description: 'Learners can create, imagine and innovate in order to address complex problems, and aid human flourishing in the sciences, humanities and arts.'
  },
  {
    id: 'sea',
    title: 'Social and Emotional Aptitude',
    description: 'Learners can understand and manage emotions, build and maintain positive relationships, feel and show empathy for others, overcome challenges, and make responsible decisions.'
  },
  {
    id: 'ent',
    title: 'Entrepreneurship',
    description: 'Entrepreneurship is the ability to identify opportunities, develop innovative solutions, and strategically build and manage ventures that create value and adapt to dynamic markets.'
  }
];

export const CORE_COMPETENCIES: Competency[] = [
  { id: 'sdl-01', domain: 'sdl', code: '1.1.1', title: 'Goal Setting', statement: 'I can set short-term learning goals with clear steps and deadlines.', level: 'foundational' },
  { id: 'sdl-02', domain: 'sdl', code: '1.1.2', title: 'Planning and organization', statement: 'I can organize my learning process by breaking tasks into steps, using tools to stay on schedule, and managing resources effectively.', level: 'foundational' },
  { id: 'sdl-03', domain: 'sdl', code: '1.1.3', title: 'Self Management', statement: 'I can manage my time, focus, and emotions to complete tasks independently, even when faced with distractions or challenges.', level: 'foundational' },
  { id: 'sdl-04', domain: 'sdl', code: '1.1.4', title: 'Reflection and Self-assessment', statement: 'I can regularly evaluate my strengths, challenges, and learning strategies to improve my performance and outcomes.', level: 'foundational' },
  { id: 'sdl-05', domain: 'sdl', code: '1.1.5', title: 'Learning Curiosity', statement: 'I show curiosity by asking questions, exploring new ideas independently, and seeking to understand unfamiliar concepts.', level: 'foundational' },
  { id: 'sdl-09', domain: 'sdl', code: '1.2.4', title: 'Adaptive Learning', statement: 'I adapt my strategies and mindset in response to feedback and challenges to continuously improve my performance.', level: 'advanced' },

  { id: 'ctps-01', domain: 'ctps', code: '2.1.1', title: 'Problem Identification', statement: 'I can identify and clearly state a problem, recognizing its basic causes and effects.', level: 'foundational' },
  { id: 'ctps-02', domain: 'ctps', code: '2.1.2', title: 'Analysis and Reasoning', statement: 'I can break down a problem into parts, examine evidence, and use logical reasoning to explain why it happens.', level: 'foundational' },
  { id: 'ctps-03', domain: 'ctps', code: '2.1.3', title: 'Evaluation of Information', statement: 'I can evaluate the credibility and relevance of information and sources before making decisions.', level: 'foundational' },
  { id: 'ctps-04', domain: 'ctps', code: '2.1.4', title: 'Solution Generation', statement: 'I can generate practical solutions based on evidence and logical thinking, considering possible outcomes.', level: 'foundational' },
  { id: 'ctps-05', domain: 'ctps', code: '2.1.5', title: 'Computational and Algorithmic Thinking', statement: 'I can break down complex processes into simple, logical steps and apply algorithms to solve problems.', level: 'foundational' },
  { id: 'ctps-07', domain: 'ctps', code: '2.2.2', title: 'Complex Problem Solving', statement: 'I can solve complex, unstructured problems by applying creative, systematic, and data-driven methods.', level: 'advanced' },
  { id: 'ctps-12', domain: 'ctps', code: '2.2.7', title: 'Debugging and Error Analysis', statement: 'I can systematically identify bugs in code or mechanical flaws, trace root causes, and verify repairs.', level: 'foundational' },

  { id: 'lc-01', domain: 'lc', code: '3.1.1', title: 'Active Listening', statement: 'I listen actively to others, showing understanding and considering their perspectives.', level: 'foundational' },
  { id: 'lc-02', domain: 'lc', code: '3.1.2', title: 'Constructive Feedback', statement: 'I give and receive constructive feedback respectfully to improve teamwork and individual work.', level: 'foundational' },
  { id: 'lc-04', domain: 'lc', code: '3.1.4', title: 'Shared Responsibility', statement: 'I take responsibility for my role in group tasks and support teammates to achieve shared goals.', level: 'foundational' },

  { id: 'ec-02', domain: 'ec', code: '4.1.2', title: 'Oral Presentation', statement: 'I can present ideas clearly, audibly, and logically to an audience, adapting my tone as appropriate.', level: 'foundational' },
  { id: 'ec-03', domain: 'ec', code: '4.1.3', title: 'Visual Communication', statement: 'I use visual aids, graphs, and models effectively to enhance understanding of complex ideas.', level: 'foundational' },
  { id: 'ec-05', domain: 'ec', code: '4.1.5', title: 'Empathy in Communication', statement: 'I communicate with empathy, acknowledging the feelings, needs, and contexts of others.', level: 'foundational' },
  { id: 'ec-11', domain: 'ec', code: '4.2.3', title: 'Storytelling and Narrative', statement: 'I structure compelling narratives that engage diverse audiences around real human and scientific issues.', level: 'foundational' },
  { id: 'ec-12', domain: 'ec', code: '4.2.4', title: 'Technical Demonstration', statement: 'I can demonstrate working physical computing artifacts and explain technical functions accurately.', level: 'foundational' },

  { id: 'ct-01', domain: 'ct', code: '5.1.1', title: 'Curiosity and Questioning', statement: 'I ask probing, imaginative questions that challenge assumptions and open new possibilities.', level: 'foundational' },
  { id: 'ct-02', domain: 'ct', code: '5.1.2', title: 'Divergent Thinking', statement: 'I can brainstorm multiple, varied ideas without early self-censoring.', level: 'foundational' },
  { id: 'ct-03', domain: 'ct', code: '5.1.3', title: 'Prototyping and Experimentation', statement: 'I can build early physical or digital models to test ideas quickly and learn from iteration.', level: 'foundational' },
  { id: 'ct-05', domain: 'ct', code: '5.1.5', title: 'Applied Making and Craft', statement: 'I can use physical tools, electronics, and materials skillfully and safely to construct artifacts.', level: 'foundational' },
  { id: 'ct-10', domain: 'ct', code: '5.2.4', title: 'Design Synthesis', statement: 'I can integrate mechanical, electrical, and aesthetic elements into an elegant, coherent system.', level: 'advanced' },
  { id: 'ct-11', domain: 'ct', code: '5.2.5', title: 'STEAM Cross-Disciplinary Connection', statement: 'I can connect principles across science, technology, engineering, arts, and mathematics.', level: 'advanced' },
  { id: 'ct-12', domain: 'ct', code: '5.2.6', title: 'Empirical Iteration', statement: 'I iteratively improve designs by directly testing against quantitative physical criteria.', level: 'foundational' },

  { id: 'sea-01', domain: 'sea', code: '6.1.1', title: 'Social Awareness and Empathy', statement: 'I recognize and understand the feelings, perspectives, and needs of individuals in my community.', level: 'foundational' },
  { id: 'sea-04', domain: 'sea', code: '6.1.4', title: 'Resilience and Persistence', statement: 'I persist through engineering obstacles, bugs, and failed trials without giving up.', level: 'foundational' },

  { id: 'ent-01', domain: 'ent', code: '7.1.1', title: 'Opportunity Recognition', statement: 'I identify unmet community and environmental needs that can be addressed through design.', level: 'foundational' }
];

export const NGSS_DIMENSIONS = {
  sep: { label: 'Science & Engineering Practice', short: 'SEP' },
  dci: { label: 'Disciplinary Core Idea', short: 'DCI' },
  ccc: { label: 'Crosscutting Concept', short: 'CCC' },
  ets: { label: 'Engineering Design', short: 'ETS' }
};

export const NGSS_RUBRIC_LEVELS = [
  { score: 1, label: 'Emerging', description: 'Requires direct guidance; major conceptual or experimental gaps.' },
  { score: 2, label: 'Developing', description: 'Applies independently with minor gaps; partial data or justification.' },
  { score: 3, label: 'Proficient', description: 'Accurate, independent execution; clear evidence and justification.' },
  { score: 4, label: 'Extending', description: 'Exemplary insight; connects to cross-cutting principles and improves methods.' }
];

export const NGSS_ALIGNMENT_ITEMS = [
  {
    peCode: 'MS-ESS3-3',
    peTitle: 'Human Impacts on Earth Systems',
    description: 'Apply scientific principles to design a method for monitoring and minimizing a human impact on the environment.',
    lookFors: {
      sep: 'Designs and executes controlled investigation measuring water evaporation and soil desiccation.',
      dci: 'Explains how urban heat retention and excessive water withdrawal stress local plant ecosystems.',
      ccc: 'Models cause-and-effect relationships between radiant solar energy, soil moisture, and plant transpiration.',
      ets: 'Evaluates competing physical canopy materials and drip delivery mechanisms using multi-trial data.'
    }
  },
  {
    peCode: 'MS-PS3-3',
    peTitle: 'Thermal Energy Transfer & Insulation',
    description: 'Apply scientific principles to design, construct, and test a device that either minimizes or maximizes thermal energy transfer.',
    lookFors: {
      sep: 'Constructs an empirical cooling curve comparing shaded vs. unshaded soil under calibrated heat radiation.',
      dci: 'Applies laws of radiation, convection, and conduction to explain Mylar reflective cooling.',
      ccc: 'Tracks energy flow through the soil-canopy system over a 60-minute solar cycle.',
      ets: 'Iterates servo-driven canopy geometry to maximize shade coverage during peak incident solar angles.'
    }
  },
  {
    peCode: 'MS-ETS1-2',
    peTitle: 'Evaluating Competing Design Solutions',
    description: 'Evaluate competing design solutions using a systematic process to determine how well they meet the criteria and constraints of the problem.',
    lookFors: {
      sep: 'Collects quantitative test metrics across 3 trials and calculates percentage water savings.',
      dci: 'Balances engineering trade-offs between mechanical servo torque, battery life, and canopy span.',
      ccc: 'Identifies system boundary interactions between electrical, mechanical, and ecological components.',
      ets: 'Redesigns fail-safe pump timeouts to prevent accidental reservoir flooding.'
    }
  }
];

// Sample Student Project: Maya Chen & Leo Rossi - Team EcoCool (Fully Populated Sample)
export const SAMPLE_STUDENT_PROJECT: StudentProject = {
  id: 'proj-ecocool-01',
  teamName: 'Team EcoCool',
  members: ['Maya Chen (Grade 8)', 'Leo Rossi (Grade 8)'],
  gradeLevel: 'Grade 8 (Age 13-14)',
  termId: 'term-2026-t3',
  currentPhase: 'share',
  progressPercent: 94,
  drivingQuestion: 'How might we use sensor-guided micro-irrigation and reflective shade canopies to protect urban community garden vegetables from extreme heat waves, reducing water waste by over 40% while keeping plants thriving?',
  problem: {
    hmw: 'How might we automatically protect community tomato beds from 40°C heat scalding while delivering targeted root moisture so that local volunteers save water and preserve crop yield?',
    who: 'Mrs. Alvarez and the 14 volunteer gardeners at the Oakwood Community Garden, especially during summer heatwaves.',
    why: 'Peak afternoon sun causes soil surface evaporation of up to 48%, dries root zones in raised beds within 3 hours, and forces elderly volunteers to haul heavy hoses in dangerous heat-index conditions.',
    criteria: '1. Reduce water use by ≥40% vs manual hosing.\n2. Keep root soil temp ≤28°C under 38°C ambient heat.\n3. Reliable battery operation for at least 7 days.\n4. Clear physical status display for gardeners.',
    constraints: '1. Upcycled chassis materials (< $20 BOM budget).\n2. 5V DC low-voltage limit for child and garden safety.\n3. Must fit within 60cm x 40cm raised bed parcel.',
    impactMeasure: 'Water consumed (liters/week) measured via reservoir graduated scale; root soil temperature (°C) continuously logged via DS18B20 digital probe over 14-day cycle.'
  },
  impact: 'both',
  codeLanguage: 'micropython',
  finalFormat: 'showcase',
  tasksDone: {
    explore: [0, 1, 2, 3],
    empathise: [0, 1, 2, 3],
    define: [0, 1, 2, 3],
    ideate: [0, 1, 2, 3],
    prototype: [0, 1, 2, 3],
    test: [0, 1, 2, 3],
    share: [0, 1, 2]
  },
  sensorState: {
    ambientTemp: 34.2,
    soilMoisturePct: 62,
    canopyDeployed: true,
    pumpActive: false,
    waterLevelPct: 84
  },
  evidence: [
    {
      id: 'ev-exp-01',
      phase: 'explore',
      kind: 'note',
      title: 'STEAM Lab 1: Evaporation Rates & Thermal Decay of Soil',
      body: 'We tested 3 soil pans under 100W heat lamps for 45 minutes: (1) Bare dark loam, (2) Soil with straw mulch, (3) Soil with reflective Mylar canopy. The bare soil lost 28 mL of moisture in 45 min and reached 41.5°C. The Mylar canopy reflected radiation away, keeping the surface at 26.8°C with only 4 mL moisture loss! This proved reflective shading is 6x more effective than passive mulch alone.',
      competencies: ['ctps-01', 'ctps-03', 'sdl-05'],
      createdAt: 1775800000000,
      metrics: [
        { label: 'Bare Soil Temp Peak', value: '41.5°C' },
        { label: 'Reflective Canopy Temp', value: '26.8°C' },
        { label: 'Thermal Delta', value: '-14.7°C' }
      ]
    },
    {
      id: 'ev-exp-02',
      phase: 'explore',
      kind: 'data',
      title: 'Capacitive Moisture Sensor Calibration Curve',
      body: 'Calibrated our capacitive soil sensor on micro:bit Pin 0 (ADC range 0-1023). Unlike cheap resistive probes with exposed metal pins that corrode through electrolysis, this capacitive probe is insulated by solder resist.\n\nCalibration points:\n- Air (0% water): 810 ADC\n- Dry garden soil (wilting point): 670 ADC\n- Optimal damp soil: 460 - 520 ADC\n- Water saturation (100%): 340 ADC\n\nWe set our target watering trigger at 650 ADC (lower reading = more moist).',
      link: 'https://github.com/InnovationCoach/Playground/tree/DonPBL',
      competencies: ['ctps-05', 'ct-05'],
      createdAt: 1775900000000
    },
    {
      id: 'ev-emp-01',
      phase: 'empathise',
      kind: 'feedback',
      title: 'Interview with Community Garden Lead (Mrs. Alvarez)',
      body: '"During the July heatwave, I lost 60% of our cherry tomato plants because I could only visit before 8 AM and after 6 PM. Midday heat was over 39°C and my doctor told me not to be out in the sun. When I arrived in the evening, the soil was baked hard like concrete. If something could just shade them and give a quick drink at noon, it would save our harvest."',
      competencies: ['ec-05', 'sea-01'],
      createdAt: 1776400000000
    },
    {
      id: 'ev-emp-02',
      phase: 'empathise',
      kind: 'media',
      title: 'Persona Empathy Map & Midday Site Audit Photos',
      body: 'Observed the community plot at 13:00 on Wednesday. Recorded ambient air at 37.4°C and soil surface at 44.1°C. Tomato leaves showed severe midday epinasty (downward leaf curling). We mapped Mrs. Alvarez\'s emotional journey: high pride during spring planting transitioning into anxiety and physical exhaustion during summer.',
      link: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22513?w=800',
      competencies: ['sea-01', 'lc-01'],
      createdAt: 1776500000000
    },
    {
      id: 'ev-def-01',
      phase: 'define',
      kind: 'note',
      title: 'Criteria and Constraints Matrix with Quantitative Targets',
      body: 'Finalized our engineering contract:\n- Criteria 1: Water reduction ≥ 40% (measured in mL applied per week vs 2500 mL baseline).\n- Criteria 2: Root zone temp ≤ 28°C under peak ambient sun.\n- Criteria 3: Visual indicator visible from 3 meters.\n- Constraint 1: Powered by 5V rechargeable USB bank or 2xAA + boost.\n- Constraint 2: Safe low-voltage isolation (no pumps inside the electrical enclosure).\n- Constraint 3: Upcycled structural parts under $15.',
      competencies: ['ctps-01', 'ctps-02', 'sdl-01'],
      createdAt: 1777100000000
    },
    {
      id: 'ev-ide-01',
      phase: 'ideate',
      kind: 'ai',
      title: 'AI Co-Pilot Planning: State Machine & Hysteresis Logic',
      body: 'Consulted the PBL Studio AI Co-Pilot to plan how to prevent the servo and pump from constantly toggling on/off when readings fluctuate around the threshold.',
      competencies: ['ctps-02', 'ct-03', 'sdl-03'],
      createdAt: 1777700000000,
      ai: {
        asked: 'How do I write a finite state machine in MicroPython for micro:bit that reads soil moisture on pin0 and temperature on a digital pin, without turning the pump and servo on and off every 2 seconds if the reading hovers around the threshold?',
        gave: 'Recommended implementing a 2-point hysteresis threshold: activate pump when ADC > 660, and only turn off when ADC drops below 540. For the canopy servo, added a 5-minute debounce cooldown timer so cloud shadows do not cause rapid flapping. Suggested an explicit State Machine: STATE_IDLE, STATE_SHADING, STATE_WATERING, STATE_COOLDOWN.',
        kept: 'We adopted the 2-point hysteresis band (660/540 ADC) and the 5-minute debounce timer for the servo. We rejected having separate independent threads because micro:bit MicroPython is single-threaded; instead we implemented a non-blocking millis() timer loop.'
      }
    },
    {
      id: 'ev-ide-02',
      phase: 'ideate',
      kind: 'media',
      title: 'Crazy Eights Concept Sketches & Morphological Decision Matrix',
      body: 'Sketched 8 divergent canopy designs. Down-selected between a rolling scroll, an umbrella linkage, and a dual-lever accordion swing arm. Selected the dual-lever swing arm because it uses only one SG90 servo motor (saving 200mA of power) and has zero sliding track friction that could jam with outdoor dirt.',
      link: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
      competencies: ['ct-02', 'ct-03', 'lc-02'],
      createdAt: 1777800000000
    },
    {
      id: 'ev-pro-01',
      phase: 'prototype',
      kind: 'code',
      title: 'EcoCool Control Loop v2.4 (micro:bit MicroPython)',
      body: `# EcoCool Autonomous Garden Guardian v2.4
# Team EcoCool: Maya Chen & Leo Rossi
# Hardware: BBC micro:bit V2 + Capacitive Moisture (Pin0) + Servo (Pin1) + Relay (Pin2)

from microbit import *

# Calibration thresholds (ADC 0-1023)
DRY_THRESHOLD = 650     # Trigger pump if ADC > 650 (soil dry)
WET_THRESHOLD = 520     # Shut off pump once ADC < 520 (soil damp)
TEMP_HEAT_LIMIT = 31    # Deploy shade canopy if temp >= 31 deg C

# State flags
canopy_deployed = False
pump_running = False
last_water_time = 0
WATER_TIMEOUT_MS = 3500 # Max 3.5 seconds pump pulse to prevent flooding

def set_servo_angle(pin, angle):
    # SG90 50Hz PWM: 0 deg = ~25, 180 deg = ~125 duty
    duty = int(25 + (angle / 180.0) * 100)
    pin.set_analog_period(20)
    pin.write_analog(duty)
    sleep(400)
    pin.write_analog(0) # Sleep servo to save power and stop buzzing!

display.show(Image.HAPPY)
pin2.write_digital(0) # Ensure pump is off initially
set_servo_angle(pin1, 0) # Retract canopy initially

while True:
    # 1. Read sensors
    moisture_raw = pin0.read_analog()
    current_temp = temperature() # Built-in thermistor proxy
    
    # 2. Canopy Shading Logic
    if current_temp >= TEMP_HEAT_LIMIT and not canopy_deployed:
        display.show(Image.CONFUSED)
        set_servo_angle(pin1, 115) # Deploy Mylar shade arm
        canopy_deployed = True
    elif current_temp < (TEMP_HEAT_LIMIT - 3) and canopy_deployed:
        display.show(Image.HAPPY)
        set_servo_angle(pin1, 0) # Retract shade
        canopy_deployed = False
        
    # 3. Precision Drip Pulsing Logic
    if moisture_raw > DRY_THRESHOLD and not pump_running:
        display.show(Image.ARROW_S)
        pin2.write_digital(1) # Turn on 5V relay pump
        sleep(WATER_TIMEOUT_MS)
        pin2.write_digital(0) # Shut off pump
        sleep(2000) # Allow moisture to diffuse through soil
        display.show(Image.HAPPY)
        
    # Diagnostic blink
    display.set_pixel(4, 4, 9)
    sleep(100)
    display.set_pixel(4, 4, 0)
    sleep(900)`,
      competencies: ['ct-05', 'ctps-05', 'sdl-03'],
      createdAt: 1778300000000
    },
    {
      id: 'ev-pro-02',
      phase: 'prototype',
      kind: 'ai',
      title: 'AI Debugging Log: Resolving Servo Motor Buzz & Voltage Brownouts',
      body: 'When our servo motor deployed the canopy, the micro:bit would occasionally freeze or restart, and the motor would emit a high-pitched buzzing sound.',
      competencies: ['ctps-12', 'ct-05'],
      createdAt: 1778400000000,
      ai: {
        asked: 'Why does my micro:bit V2 restart when my SG90 servo motor reaches 120 degrees, and why does the servo buzz continuously when holding the canopy open?',
        gave: 'Identified two distinct issues: (1) Brownout restart occurs because the servo stall current (~500mA) exceeds what the micro:bit 3.3V pin can supply, causing the internal regulator to drop voltage and trigger a reset. Connect servo VCC to an external 5V rail with shared common ground. (2) Buzzing occurs because continuous 50Hz PWM signal fights the gear backlash under mechanical load. Fix in code by writing 0 duty cycle after the sweep completes (pin.write_analog(0)), relaxing the motor while the gear friction holds the canopy.',
        kept: 'We separated the servo power to a 5V rechargeable power bank while keeping GND tied to micro:bit GND. In our code we added sleep(400) followed by pin.write_analog(0). This completely eliminated both the restarts and the motor buzzing!'
      }
    },
    {
      id: 'ev-pro-03',
      phase: 'prototype',
      kind: 'media',
      title: 'Physical Chassis Build & Electronics Isolation Enclosure',
      body: 'Assembled the 45cm chassis using recycled basswood dowels and corrugated plastic. Mounted the 2L reservoir bottle with silicone drip tube and anti-siphon siphon-break hole. The micro:bit is elevated 15cm above soil in a clear upcycled plastic enclosure to protect from splashes.',
      link: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
      competencies: ['ct-03', 'ct-05', 'lc-04'],
      createdAt: 1778500000000
    },
    {
      id: 'ev-test-01',
      phase: 'test',
      kind: 'data',
      title: 'Controlled 14-Day Experimental Test Trial Data',
      body: 'Conducted a 14-day controlled stress test comparing Bed A (EcoCool Autonomous System) vs Bed B (Standard Daily Manual Hose Watering).\n\nResults Summary:\n- Baseline Manual Water Applied: 22.4 Liters over 14 days\n- EcoCool System Water Applied: 13.2 Liters over 14 days\n- Total Water Saved: 9.2 Liters (41.1% Reduction! Exceeded 40% target!)\n- Peak Midday Root Soil Temp (Control): 37.8°C\n- Peak Midday Root Soil Temp (EcoCool): 26.4°C (11.4°C cooler!)\n- Tomato Seedling Vigor Score: EcoCool 4.8 / 5.0 vs Control 2.9 / 5.0.',
      competencies: ['ctps-03', 'ctps-02', 'ct-12'],
      createdAt: 1779200000000,
      metrics: [
        { label: 'Water Savings', value: '41.1%' },
        { label: 'Root Temp Shielding', value: '26.4°C max' },
        { label: 'Seedling Vigor Score', value: '4.8 / 5.0' },
        { label: 'Testing Trials', value: '3 full trials' }
      ]
    },
    {
      id: 'ev-test-02',
      phase: 'test',
      kind: 'feedback',
      title: 'Stakeholder Usability Evaluation with Garden Volunteers',
      body: 'Invited 3 community gardeners to test the system interface. Feedback was overwhelmingly positive on the automatic shading. However, gardener Ken pointed out: "If the 2L bottle runs dry while I am away for the weekend, the micro:bit will keep trying to pump and could burn out the motor." Based on this, we added a software run-time limiter that locks out the pump if 3 consecutive pulses fail to lower the moisture ADC.',
      competencies: ['lc-02', 'sea-04'],
      createdAt: 1779300000000
    },
    {
      id: 'ev-test-03',
      phase: 'test',
      kind: 'note',
      title: 'Before & After Engineering Improvement: Anti-Siphon Valve & Run-Time Lockout',
      body: 'Verified two major improvements:\n1. Hardware: Added a pinhole siphon break 2cm above the reservoir water line. Before this, water slowly dripped out through siphon effect even after pump stopped, wasting 400mL. After adding the siphon break: 0mL leakage.\n2. Software: Added failsafe counter. If moisture does not improve after 3 pulses in 1 hour, pump locks out and LED displays an emergency cross icon.',
      competencies: ['ctps-02', 'ct-12'],
      createdAt: 1779400000000
    },
    {
      id: 'ev-sha-01',
      phase: 'share',
      kind: 'media',
      title: 'Showcase Expo Booth Layout & Working Hardware Rig',
      body: 'Finalized our interactive demonstration table for the school STEAM Showcase Expo! Includes a live heat lamp visitors can switch on to watch the servo canopy sweep into place, a live moisture sensor demo in potting soil, and our water savings telemetry charts.',
      link: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800',
      competencies: ['ec-11', 'ec-03', 'ec-12'],
      createdAt: 1779900000000
    },
    {
      id: 'ev-sha-02',
      phase: 'share',
      kind: 'reflection',
      title: 'Final Term Reflection: Growth, Engineering Resilience & Ethical AI',
      body: 'Looking back on the past 12 weeks, our biggest growth was in Self-Directed Learning (sdl-04) and Computational Debugging (ctps-12). When our servo brownout kept crashing the micro:bit in Week 8, we were frustrated and almost gave up on automated shading. Using the AI Co-Pilot to understand electrical brownouts taught us how real engineers work—we did not just copy code, we had to understand PWM duty cycles and power rails. Our system saved 41.1% of water in our trials and kept tomato roots 11°C cooler. Most importantly, Mrs. Alvarez told us she wants to install 4 of these in the community garden this summer!',
      competencies: ['sdl-04', 'ctps-04', 'sea-04'],
      createdAt: 1780000000000
    }
  ],
  coachFeedback: [
    {
      coachName: 'Coach Eleanor Vance',
      date: '2026-09-22',
      note: 'Exceptional evidence documentation. The calibration data curve and the thoughtful AI log in the Prototype phase demonstrate true mastery. You clearly understand why the servo power separation was required. Ready for final Showcase!',
      competencyScores: {
        'sdl-04': 4,
        'ctps-01': 4,
        'ctps-05': 4,
        'ctps-12': 4,
        'ct-05': 4,
        'ec-11': 3,
        'sea-01': 4
      }
    }
  ]
};

// Additional Mock Student Teams for the Teacher View
export const MOCK_COHORT: StudentProject[] = [
  SAMPLE_STUDENT_PROJECT,
  {
    id: 'proj-hydroshade-02',
    teamName: 'Team HydroShade',
    members: ['Sofia Patel (Grade 8)', 'Liam O\'Connor (Grade 7)'],
    gradeLevel: 'Grade 8 (Age 13)',
    termId: 'term-2026-t3',
    currentPhase: 'prototype',
    progressPercent: 68,
    drivingQuestion: 'How might we use evaporative cooling misting nozzles triggered by soil and humidity sensors to protect fragile herb beds from heat shock?',
    problem: {
      hmw: 'How might we pulse high-pressure mist over delicate basil seedlings so that leaves do not scorch in midday sun?',
      who: 'School rooftop herb garden maintenance team.',
      why: 'Basil and coriander wilt and flower prematurely when temperatures stay above 32°C for more than 2 hours.',
      criteria: '1. Maintain humidity >50% around herbs.\n2. Use less than 500mL water/day.\n3. Automatic sensor shut-off during rain.',
      constraints: '1. Ultrasonic piezo mist disc (<$8).\n2. Battery operation for 5 days.',
      impactMeasure: 'Ambient humidity % and leaf turgor score measured daily.'
    },
    impact: 'environment',
    codeLanguage: 'micropython',
    finalFormat: 'showcase',
    tasksDone: {
      explore: [0, 1, 2, 3],
      empathise: [0, 1, 2],
      define: [0, 1, 2],
      ideate: [0, 1, 2],
      prototype: [0, 1]
    },
    sensorState: {
      ambientTemp: 32.5,
      soilMoisturePct: 54,
      canopyDeployed: false,
      pumpActive: true,
      waterLevelPct: 62
    },
    evidence: [
      {
        id: 'ev-hs-01',
        phase: 'explore',
        kind: 'note',
        title: 'Misting Evaporative Cooling Lab',
        body: 'Investigated latent heat of vaporization with piezo atomizing discs. Ambient temp dropped 4.2°C within 30 seconds of mist burst.',
        competencies: ['ctps-01', 'sdl-05'],
        createdAt: 1775850000000
      },
      {
        id: 'ev-hs-02',
        phase: 'prototype',
        kind: 'code',
        title: 'Piezo Ultrasonic Driver Pulse Code',
        body: '# Ultrasonic mist disc pulsed on micro:bit Pin 8\nfrom microbit import *\npin8.write_digital(1)\nsleep(1500)\npin8.write_digital(0)',
        competencies: ['ct-05', 'ctps-05'],
        createdAt: 1778350000000
      }
    ],
    coachFeedback: [
      {
        coachName: 'Coach Eleanor Vance',
        date: '2026-09-18',
        note: 'Solid progress on the ultrasonic misting module. Make sure to complete your multi-trial test table in the next phase.',
        competencyScores: {
          'ctps-01': 3,
          'ct-05': 3,
          'sdl-02': 3
        }
      }
    ]
  },
  {
    id: 'proj-bioshield-03',
    teamName: 'Team BioShield',
    members: ['Marcus Vance (Grade 9)', 'Chloe Zhang (Grade 9)'],
    gradeLevel: 'Grade 9 (Age 14-15)',
    termId: 'term-2026-t3',
    currentPhase: 'define',
    progressPercent: 38,
    drivingQuestion: 'How might we use recycled thermal curtains and soil temperature telemetry to protect community spinach patches from premature bolting?',
    problem: {
      hmw: 'How might we keep cool-season spinach root zones below 24°C during unexpected spring heatwaves so that crops do not bolt?',
      who: 'Community food bank vegetable growers.',
      why: 'Spinach turns bitter and goes to seed within 48 hours of root temperatures exceeding 25°C.',
      criteria: '1. Root zone temp maintained below 24°C.\n2. Audio alert when thermal threshold exceeded.',
      constraints: '1. Recycled thermal curtain fabric only.\n2. Micro:bit V2 buzzer for alerts.',
      impactMeasure: 'Days of edible spinach harvest extended.'
    },
    impact: 'both',
    codeLanguage: 'makecode',
    finalFormat: null,
    tasksDone: {
      explore: [0, 1, 2],
      empathise: [0, 1],
      define: [0, 1]
    },
    sensorState: {
      ambientTemp: 27.1,
      soilMoisturePct: 70,
      canopyDeployed: false,
      pumpActive: false,
      waterLevelPct: 90
    },
    evidence: [
      {
        id: 'ev-bs-01',
        phase: 'explore',
        kind: 'note',
        title: 'Spinach Bolting Temperature Thresholds',
        body: 'Researched botanical thermal limits for spinach varieties. Found that soil temperature is 2x more predictive of bolting than air temperature.',
        competencies: ['sdl-05', 'ctps-03'],
        createdAt: 1775820000000
      }
    ],
    coachFeedback: []
  },
  {
    id: 'proj-solguard-04',
    teamName: 'Team SolGuard (New Student Empty State)',
    members: ['Aiden Tanaka (Grade 7)', 'Emma Dubois (Grade 8)'],
    gradeLevel: 'Grade 7-8 (Age 12-13)',
    termId: 'term-2026-t3',
    currentPhase: 'explore',
    progressPercent: 4,
    drivingQuestion: 'How might we use sensor-guided micro-irrigation to protect community garden beds?',
    problem: {
      hmw: '',
      who: '',
      why: '',
      criteria: '',
      constraints: '',
      impactMeasure: ''
    },
    impact: null,
    codeLanguage: 'micropython',
    finalFormat: null,
    tasksDone: {},
    sensorState: {
      ambientTemp: 24.0,
      soilMoisturePct: 45,
      canopyDeployed: false,
      pumpActive: false,
      waterLevelPct: 100
    },
    evidence: [],
    coachFeedback: []
  },
  {
    id: 'proj-sproutguard-05',
    teamName: 'Team SproutGuard (Primary Track / Ages 9–11)',
    members: ['Liam Chen (Grade 5)', 'Sofia Al-Mansoor (Grade 5)'],
    gradeLevel: 'Primary Track (Grade 5 / Age 10-11)',
    termId: 'term-2026-t3',
    currentPhase: 'prototype',
    progressPercent: 65,
    drivingQuestion: 'How can we build a singing cardboard garden sentinel with micro:bit that tells our school gardener when strawberry plants need water?',
    problem: {
      hmw: 'How might we use happy musical tunes and LED emojis to remind younger students to water strawberry garden beds?',
      who: 'Primary school gardening club and cafeteria compost team.',
      why: 'Strawberries dry out quickly in small raised beds when students forget to check moisture during recess.',
      criteria: '1. Play cheerful chime when soil is moist.\n2. Sad icon and flashing LED when soil is dry.\n3. Water-resistant decorated cardboard house.',
      constraints: '1. Visual MakeCode blocks only.\n2. Recycled craft materials and alligator clips.',
      impactMeasure: 'Zero dried strawberry plants over a 3-week test window.'
    },
    impact: 'both',
    codeLanguage: 'makecode',
    finalFormat: 'interactive-stand',
    tasksDone: {
      explore: [0, 1, 2],
      empathise: [0, 1],
      define: [0, 1],
      ideate: [0, 1],
      prototype: [0, 1]
    },
    sensorState: {
      ambientTemp: 28.4,
      soilMoisturePct: 68,
      canopyDeployed: true,
      pumpActive: false,
      waterLevelPct: 85
    },
    evidence: [
      {
        id: 'ev-sg-01',
        phase: 'explore',
        kind: 'note',
        title: 'Primary STEAM Discovery: Sponge Moisture vs. Garden Soil',
        body: 'Tested our capacitive probe in dry kitchen sponge vs. damp sponge vs. water cup. We drew color-coded dial meters in our project journals.',
        competencies: ['ctps-01', 'ct-01'],
        createdAt: 1775830000000
      },
      {
        id: 'ev-sg-02',
        phase: 'prototype',
        kind: 'code',
        title: 'MakeCode Block Chime Logic (Exported JS)',
        body: '// MakeCode Visual Blocks exported code\nbasic.forever(function () {\n    let reading = pins.analogReadPin(AnalogPin.P0)\n    if (reading < 400) {\n        basic.showIcon(IconNames.Sad)\n        music.playTone(262, music.beat(BeatFraction.Whole))\n    } else {\n        basic.showIcon(IconNames.Happy)\n    }\n})',
        competencies: ['ct-05', 'lc-02'],
        createdAt: 1778320000000
      }
    ],
    coachFeedback: [
      {
        coachName: 'Coach Eleanor Vance',
        date: '2026-09-22',
        note: 'Inspiring visual storytelling and clean MakeCode blocks! The primary gardening club will love your chime alerts.',
        competencyScores: {
          'ctps-01': 4,
          'lc-02': 4,
          'ct-05': 3
        }
      }
    ]
  },
  {
    id: 'proj-aeropulse-06',
    teamName: 'Team AeroPulse (Upper Secondary Track / Ages 15–17)',
    members: ['Kai Takahashi (Grade 11)', 'Elena Rostova (Grade 11)'],
    gradeLevel: 'Upper Secondary Track (Grade 11 / Age 16-17)',
    termId: 'term-2026-t3',
    currentPhase: 'test',
    progressPercent: 88,
    drivingQuestion: 'How might we engineer parametric multi-axis solar tracking canopies and predictive transpiration models to protect urban community greenhouses?',
    problem: {
      hmw: 'How might we minimize vapor-pressure deficits (VPD) in high-density urban poly-tunnels using automated dual-axis Mylar louvers and predictive micro-climate telemetry?',
      who: 'Commercial urban hydroponic farmers and community food resilience networks.',
      why: 'Extreme noon VPD spikes exceed 3.5 kPa, causing stomatal closure, thermal leaf scorch, and severe nutrient lockup.',
      criteria: '1. Maintain leaf temperature within +/- 1.5°C of optimal 24°C.\n2. Continuous logging via I2C bus.\n3. Parametric 3D CAD linkage with low parasitic power.',
      constraints: '1. Less than 15W total system power drawn from solar buffer.\n2. Real-time serial telemetry.',
      impactMeasure: 'Reduction in crop stress index and 42% lower peak afternoon canopy temps.'
    },
    impact: 'both',
    codeLanguage: 'micropython',
    finalFormat: 'stage-pitch',
    tasksDone: {
      explore: [0, 1, 2],
      empathise: [0, 1],
      define: [0, 1],
      ideate: [0, 1],
      prototype: [0, 1, 2],
      test: [0, 1]
    },
    sensorState: {
      ambientTemp: 31.8,
      soilMoisturePct: 74,
      canopyDeployed: true,
      pumpActive: false,
      waterLevelPct: 92
    },
    evidence: [
      {
        id: 'ev-ap-01',
        phase: 'explore',
        kind: 'data',
        title: 'Vapor-Pressure Deficit (VPD) Mathematical Model',
        body: 'Derived mathematical approximation of saturation vapor pressure: $VPD = VP_{sat} \\times (1 - RH/100)$. Calibrated with psychrometric data from DHT22 ambient probe.',
        competencies: ['ctps-05', 'ctps-12'],
        createdAt: 1775800000000,
        metrics: [
          { label: 'Baseline Peak VPD', value: '3.62 kPa' },
          { label: 'Shielded Peak VPD', value: '1.41 kPa' }
        ]
      },
      {
        id: 'ev-ap-02',
        phase: 'test',
        kind: 'code',
        title: 'Embedded MicroPython PID Control Loop',
        body: '# MicroPython Non-Blocking State Machine with PID Temperature Tuning\nfrom microbit import *\n# Full PID loop regulating servo PWM duty cycles against thermal lag',
        competencies: ['ct-05', 'ctps-02'],
        createdAt: 1779200000000
      }
    ],
    coachFeedback: [
      {
        coachName: 'Coach Eleanor Vance',
        date: '2026-09-24',
        note: 'Exemplary mathematical rigor and embedded code architecture. Ready for submission to regional engineering fairs.',
        competencyScores: {
          'ctps-05': 4,
          'ctps-12': 4,
          'ct-05': 4
        }
      }
    ]
  }
];

export const MOCK_TEACHER = {
  id: 'coach-vance',
  name: 'Coach Eleanor Vance',
  role: 'STEAM & PBL Lead Facilitator',
  school: 'WeLearn Academy',
  cohortSize: 28,
  activeProjects: 14
};
