/**
 * Student 2e Profiles for WeLearn SPARK PBL Authoring Studio
 *
 * Each profile represents an authentic Twice-Exceptional (2e) learner,
 * pairing extraordinary cognitive strengths / consuming passions with
 * specific executive function hurdles and sensory/learning accommodations.
 */

export const UNIVERSAL_LEARNER = {
  id: 'universal-all',
  name: 'All Learners (Open Course Catalog)',
  displayName: 'All Learners (Open Course Catalog)',
  avatar: '🌐',
  grade: 'Universal Design (Ages 12–18)',
  cohort: 'Open Centre-Wide',
  diagnosisTraits: 'Universal Design for Learning (UDL) · Multi-Modal MakerSpace',
  traitBadges: ['Open Catalog', 'Universal Design (UDL)', 'Multi-Modal'],
  consumingPassions: 'Autonomous Robotics, Computer Vision, Environmental Telemetry',
  executiveFunctionHurdles: 'Step-by-step milestone checklists & visual scaffolding',
  hurdleBadges: ['Step-by-Step Pacing', 'Visual Checklists'],
  appliedAccommodations: [
    'Universal milestone pacing with multi-modal choices',
    'Self-paced inquiry with MakerSpace tool bench guidance',
    'Open submission formats (Video pitch, GitHub firmware, or Physical prototype)'
  ],
  recommendedTools: ['Bambu Lab X1-C 3D Printer', 'micro:bit V2 / Raspberry Pi Pico', 'Digital Calipers', 'Electronics Bench'],
  isUniversal: true
};

export const STUDENT_2E_PROFILES = [
  UNIVERSAL_LEARNER,
  {
    id: 'student-liam-chen',
    name: 'Liam Chen',
    avatar: '🤖',
    grade: 'Grade 8 (Age 14)',
    cohort: 'cohort-w2e',
    diagnosisTraits: 'Gifted + ADHD (High Novelty-Seeking, Hyperfocus on Hardware)',
    traitBadges: ['Gifted + ADHD', 'Rapid Prototyper', 'Sensory Kinesthetic'],
    consumingPassions: 'Autonomous Robotics, Computer Vision, ROS 2, Micro-quadcopters',
    executiveFunctionHurdles: 'Task initiation (freezes on ambiguous open prompts), severe writing fatigue (abhors essay deliverables), time blindness / anxiety (severely underestimates fabrication timelines)',
    hurdleBadges: ['Task Initiation Freeze', 'Writing Fatigue', 'Time Blindness'],
    appliedAccommodations: [
      'Micro-deadlines with visible 15-minute countdown timers',
      'Multi-modal deliverables: GitHub commit logs & 60s demo videos instead of written reports',
      'Pre-cut MakerSpace acrylic chassis kit to eliminate initial blank-canvas paralysis',
      'Daily 2-minute Standup with Coach Donovan to unblock milestone start'
    ],
    recommendedTools: ['Bambu Lab X1-C 3D Printer', 'micro:bit V2 / Raspberry Pi Pico', 'Digital Calipers', 'Soldering Station']
  },
  {
    id: 'student-maya-patel',
    name: 'Maya Patel',
    avatar: '🎨',
    grade: 'Grade 7 (Age 13)',
    cohort: 'cohort-w2e',
    diagnosisTraits: 'Gifted + Dyslexia (Spatial Reasoning top 0.1%, Phonetic Processing Delay)',
    traitBadges: ['Gifted + Dyslexia', 'Top 0.1% Spatial IQ', 'Visual-Spatial Thinker'],
    consumingPassions: '3D Blender Modeling, Parametric CAD, Biomimetic Architecture, Organic Ergonomics',
    executiveFunctionHurdles: 'Reading dense text documentation fatigue, spelling and report anxiety, multi-step sequential instruction loss without visual flowcharts',
    hurdleBadges: ['Dense Text Fatigue', 'Spelling Anxiety', 'Working Memory Load'],
    appliedAccommodations: [
      'Visual graphic-organizer briefs and annotated diagrams instead of multi-page manuals',
      'Oral / video presentation defence to showcase design decisions',
      'Speech-to-text enabled prompts for reflection stages',
      'Color-coded milestone pipeline with 3D model asset checklists'
    ],
    recommendedTools: ['Blender 4.2 / Fusion 360', 'Bambu Lab X1-C 3D Printer (PETG/PLA)', 'Formlabs SLA Resin', 'Silicone Casting']
  },
  {
    id: 'student-sam-wongsakul',
    name: 'Sam Wongsakul',
    avatar: '🌱',
    grade: 'Grade 9 (Age 15)',
    cohort: 'cohort-w2e',
    diagnosisTraits: 'Autism Spectrum / Sensory Sensitive + Gifted Mathematical Intuition',
    traitBadges: ['Autism / Sensory Sensitive', 'Gifted Math Intuition', 'Algorithmic Thinker'],
    consumingPassions: 'Hydroponics, IoT Sensor Telemetry, Closed-Loop Environmental Automation, Data Science',
    executiveFunctionHurdles: 'Acoustic sensory overload in busy MakerSpace, emotional dysregulation when code/hardware fails unexpectedly, resistance to sudden schedule changes',
    hurdleBadges: ['Sensory Acoustic Overload', 'Failure Frustration', 'Routine Sensitivity'],
    appliedAccommodations: [
      'Dedicated quiet MakerSpace access hours with noise-cancelling ear protection',
      'Structured step-by-step diagnostic checklists for hardware troubleshooting',
      'Predictable daily routine with advance notice of tool queue delays',
      'Coach Sara intervention cue for systematic failure de-escalation'
    ],
    recommendedTools: ['Capacitive Soil Moisture Sensors', 'ESP32 IoT Controller', 'Peristaltic 5V Pumps', 'Laser Cutter Acrylic Enclosure']
  },
  {
    id: 'student-kai-srisuk',
    name: 'Kai Srisuk',
    avatar: '🎮',
    grade: 'Grade 6 (Age 12)',
    cohort: 'cohort-w2e',
    diagnosisTraits: '2e Gifted + Dysgraphia & Executive Dysfunction',
    traitBadges: ['Gifted + Dysgraphia', 'Tactile Game Architect', 'Rapid Ideator'],
    consumingPassions: 'Interactive Microcontroller Game Hardware, Tactile Wearables, Retro Arcade Emulation',
    executiveFunctionHurdles: 'Fine motor handwriting fatigue, losing track of intermediate CAD/code files, working memory overload when juggling multi-stage builds',
    hurdleBadges: ['Dysgraphic Fatigue', 'Asset Disorganization', 'Executive Friction'],
    appliedAccommodations: [
      'Zero handwritten logs: voice dictation, GitHub repos, and direct photo uploads',
      'Standardized folder templates for MakerSpace STL and firmware files',
      'Tactile button jigs and solder-free breadboard prototyping first',
      'Coach Donovan daily check-in to tag physical bins with student QR codes'
    ],
    recommendedTools: ['Epilog Laser Cutter (3mm Birch Plywood)', 'Arcade Tactile Switches', 'micro:bit V2', 'Hot Glue & Cardboard Jigs']
  }
];

export const getLearnerById = (id) => STUDENT_2E_PROFILES.find((p) => p.id === id) || STUDENT_2E_PROFILES[0];
