/**
 * Program Registry for WeLearn PBL Studio
 * Location: prototypes/DonPBL/programRegistry.ts
 * 
 * Multi-program catalog:
 * - Program 1: Hex-City Thailand (12-Week Modular Resilient Floating City PBL)
 * - Program 2: Biomechanics & Bio-Inspired Robotics (14-Week Quantitative Electromechanics)
 * - Program 3: EcoCool (Smart Urban Heat & Community Garden Monitor)
 * - Program 4: CleanStream (Smart Urban Stormwater Runoff Sentinel)
 */

import { 
  PblProgram, 
  SAMPLE_PROGRAM, 
  SCHOOL_SCHEDULE_CONFIG, 
  SchoolScheduleConfig,
  LEARNER_AGE_CONFIG,
  LearnerAgeConfig,
  AgeTierTrack
} from './programData';
import { HEX_CITY_PROGRAM, HEX_CITY_ROLES, CRISIS_SCENARIOS, HexCityRole, CrisisScenario } from './hexCityProgram';
import { BIOMECHANICS_PROGRAM, BIOMIMETIC_TRACKS, BiomimeticTrack } from './biomechanicsProgram';
import { PASSION_BLUEPRINT_PROGRAM, FRICTION_STRATEGIES, FrictionStrategy } from './passionBlueprintProgram';
import { 
  STORYTELLING_PROGRAM, 
  GENESIS_CHARACTERS_FIXTURE, 
  GENESIS_WORLD_RULES_FIXTURE, 
  CharacterProfile, 
  WorldRule 
} from './storytellingProgram';

export { SCHOOL_SCHEDULE_CONFIG, LEARNER_AGE_CONFIG };
export type { SchoolScheduleConfig, LearnerAgeConfig, AgeTierTrack };

export { HEX_CITY_PROGRAM, HEX_CITY_ROLES, CRISIS_SCENARIOS };
export type { HexCityRole, CrisisScenario };

export { BIOMECHANICS_PROGRAM, BIOMIMETIC_TRACKS };
export type { BiomimeticTrack };

export { PASSION_BLUEPRINT_PROGRAM, FRICTION_STRATEGIES };
export type { FrictionStrategy };

export { STORYTELLING_PROGRAM, GENESIS_CHARACTERS_FIXTURE, GENESIS_WORLD_RULES_FIXTURE };
export type { CharacterProfile, WorldRule };

export const CLEAN_STREAM_PROGRAM: PblProgram = {
  id: 'cleanstream-stormwater-2026',
  title: 'CleanStream: Smart Urban Stormwater & Micro-Filter Sentinel',
  subtitle: 'Diverting toxic first-flush urban runoff into bio-retention swales using turbidity sensors and automated flow gates.',
  status: 'provisional_prototype',
  theme: 'Water Security & Urban Watershed Ecology',
  drivingQuestion: 'How might we use turbidity and flow sensors to divert toxic first-flush urban street runoff away from natural waterways into bio-retention filtration swales, reducing particulate runoff by over 50%?',
  realProblem: {
    type: 'both',
    summary: 'The first 15 minutes of heavy rain wash heavy metals, microplastics, and motor oils directly from city streets into local streams. Street wildlife dies from chemical shock, and downstream communities suffer polluted municipal waterways.',
    peopleImpact: 'Protects neighborhood recreational streams and drinking water intake basins from acute toxic contamination.',
    environmentalImpact: 'Captures over 50% of toxic suspended sediment via automated first-flush diversion into natural bio-char sand swales.'
  },
  targetAgeRange: 'Ages 9–17 (Primary through Upper Secondary: 9–11, 12–14, 15–17)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'BBC micro:bit V2 with breakout shield',
      '5V power bank and USB programming lead'
    ],
    sensorsAndActuators: [
      'Analog optical turbidity sensor (0–4.5V output, 0–3000 NTU)',
      'Hall-effect water flow rate sensor (YF-S201)',
      'High-torque metal gear servo motor (MG996R or SG90 with counterweight)',
      '5V 1-channel relay module for auxiliary backwash pump'
    ],
    fabricationMaterials: [
      'PVC split-pipe flume gutter (50cm length)',
      'Recycled 2L PET bottle filtration column with gravel, sand, and activated biochar',
      'Waterproof silicone sealant and 3D printed/acrylic diverter gate flap'
    ],
    softwareAndTools: [
      'micro:bit MicroPython / MakeCode JavaScript',
      'PBL Studio AI Co-Pilot',
      'Graduated cylinder and NTU turbidity color comparison card'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Spill-Proof Drainage: All water testing must be conducted over a designated catchment tub with non-slip floor matting.',
      'Low-Voltage DC: Strictly 5V DC power for sensors and servo; never connect mains power near water rigs.'
    ],
    pedagogicalScaffolding: [
      'Calibrate with Murky Water: Have students calibrate the turbidity sensor using clean tap water (0 NTU) vs dilute tea/mud water (500–1500 NTU) before writing code.',
      'Diverter Gate Friction: Remind learners that water rushing down a flume exerts dynamic pressure against the servo flap.'
    ],
    aiEthicsRules: [
      'AI writes logic scaffolding, students test on the physical flume.',
      'Log prompt provenance: Record prompt asked, code given, and what was kept.'
    ],
    differentiationNotes: [
      'Level 1: Binary gate flap triggered when turbidity exceeds 800 NTU.',
      'Level 2: Dual-variable control: measure flow velocity AND turbidity to calculate cumulative toxic load before shutting gate.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-turbidity',
      metric: 'Turbidity Sediment Interception',
      target: '≥ 50% reduction in NTU discharged into simulated stream flume',
      verificationMethod: 'Pre- and post-filtration optical turbidity sensor logs across 5 rain simulator trials'
    },
    {
      id: 'metric-response-time',
      metric: 'First-Flush Gate Activation Latency',
      target: 'Servo diverter fully seals within ≤ 2.5 seconds of turbidity spike',
      verificationMethod: 'High-speed camera or millisecond serial timestamp audit'
    }
  ],
  assumptions: [
    {
      id: 'asmp-turbidity-kit',
      domain: 'Sensor Availability',
      assumption: 'School provides analog turbidity optical sensors for student lab groups.',
      ownerVerificationNeeded: 'Confirm optical sensor procurement with WeLearn lab manager.'
    }
  ],
  phases: SAMPLE_PROGRAM.phases
};

export const PROGRAM_REGISTRY: Record<string, PblProgram> = {
  'storytelling-genesis-2026': STORYTELLING_PROGRAM,
  'passion-project-blueprint-2026': PASSION_BLUEPRINT_PROGRAM,
  'biomechanics-robotics-2026': BIOMECHANICS_PROGRAM,
  'hex-city-thailand-2026': HEX_CITY_PROGRAM,
  'ecocool-smart-garden-2026': SAMPLE_PROGRAM,
  'cleanstream-stormwater-2026': CLEAN_STREAM_PROGRAM
};

export const PROGRAM_LIST = [
  { id: 'storytelling-genesis-2026', title: 'Project Genesis Engine: Storytelling IP', theme: 'Cinematic Narrative & Screenplay Pipeline (12 Wks / 120h Core Term)' },
  { id: 'passion-project-blueprint-2026', title: 'PBL: Passion Project Blueprint', theme: '2e Neurodiversity & Autonomous Sprints (12 Wks / 120h)' },
  { id: 'biomechanics-robotics-2026', title: 'PBL: Biomechanics & Bio-Robotics', theme: 'Biomimicry, Kinematics & Arduino C++ (12 Wks / 120h)' },
  { id: 'hex-city-thailand-2026', title: 'Hex-City Thailand: Resilient Floating City', theme: 'Climate Adaptation & Marine Urbanism (12 Wks / 120h)' },
  { id: 'ecocool-smart-garden-2026', title: 'EcoCool: Smart Urban Heat & Garden Monitor', theme: 'Sustainable Agriculture & Heat Resilience (12 Wks / 120h)' },
  { id: 'cleanstream-stormwater-2026', title: 'CleanStream: Stormwater & Runoff Sentinel', theme: 'Water Security & Watershed Ecology (12 Wks / 120h)' }
];
