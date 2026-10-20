/**
 * Program Registry for WeLearn PBL Studio
 * Location: prototypes/DonPBL/programRegistry.ts
 * 
 * Complete 6-program catalog (all fitting a 12-week, 120-hour term):
 * - Program 1: Entrepreneurship: Product Creation (12 Weeks / 120h • 18 Sessions)
 * - Program 2: Project Genesis Engine: Storytelling IP (12 Weeks / 120h • 24 Sessions)
 * - Program 3: The Passion Project Blueprint (12 Weeks / 120h • 24 Sessions)
 * - Program 4: Quantitative Biomechanics & Bio-Inspired Robotics (12 Weeks / 120h • 24 Sessions)
 * - Program 5: Hex-City Thailand: Modular Resilient Floating City (12 Weeks / 120h • 24 Sessions)
 * - Program 6: EcoCool: Smart Urban Heat & Community Garden Monitor (12 Weeks / 120h • 24 Sessions)
 * 
 * Stub Program (excluded from PROGRAM_REGISTRY and PROGRAM_LIST until phases are authored):
 * - CleanStream: Smart Urban Stormwater & Micro-Filter Sentinel (status: 'stub')
 */

import { 
  SAMPLE_PROGRAM, 
  SCHOOL_SCHEDULE_CONFIG, 
  LEARNER_AGE_CONFIG,
  HARDWARE_INVENTORY_CONFIG,
  COPILOT_DEPLOYMENT_CONFIG
} from './programData';
import type {
  PblProgram,
  ConfirmationRecord,
  SchoolScheduleConfig,
  LearnerAgeConfig,
  AgeTierTrack,
  HardwareInventoryConfig,
  CopilotDeploymentConfig
} from './programData';
import { HEX_CITY_PROGRAM, HEX_CITY_ROLES, CRISIS_SCENARIOS } from './hexCityProgram';
import type { HexCityRole, CrisisScenario } from './hexCityProgram';
import { BIOMECHANICS_PROGRAM, BIOMIMETIC_TRACKS } from './biomechanicsProgram';
import type { BiomimeticTrack } from './biomechanicsProgram';
import { PASSION_BLUEPRINT_PROGRAM, FRICTION_STRATEGIES } from './passionBlueprintProgram';
import type { FrictionStrategy } from './passionBlueprintProgram';
import { 
  STORYTELLING_PROGRAM, 
  GENESIS_CHARACTERS_FIXTURE, 
  GENESIS_WORLD_RULES_FIXTURE
} from './storytellingProgram';
import type { CharacterProfile, WorldRule } from './storytellingProgram';
import {
  ENTREPRENEURSHIP_PROGRAM,
  ENTREPRENEURSHIP_BADGES,
  ENTREPRENEURSHIP_LEVELS,
  ENTREPRENEURSHIP_SIMULATION_PRESETS
} from './entrepreneurshipProgram';
import type {
  StartupBadge,
  MarketSimulationState,
  GamificationLevel,
  SimulationPreset
} from './entrepreneurshipProgram';

export { 
  SCHOOL_SCHEDULE_CONFIG, 
  LEARNER_AGE_CONFIG, 
  HARDWARE_INVENTORY_CONFIG, 
  COPILOT_DEPLOYMENT_CONFIG 
};
export type { 
  ConfirmationRecord,
  SchoolScheduleConfig, 
  LearnerAgeConfig, 
  AgeTierTrack, 
  HardwareInventoryConfig, 
  CopilotDeploymentConfig 
};

export { HEX_CITY_PROGRAM, HEX_CITY_ROLES, CRISIS_SCENARIOS };
export type { HexCityRole, CrisisScenario };

export { BIOMECHANICS_PROGRAM, BIOMIMETIC_TRACKS };
export type { BiomimeticTrack };

export { PASSION_BLUEPRINT_PROGRAM, FRICTION_STRATEGIES };
export type { FrictionStrategy };

export { STORYTELLING_PROGRAM, GENESIS_CHARACTERS_FIXTURE, GENESIS_WORLD_RULES_FIXTURE };
export type { CharacterProfile, WorldRule };

export {
  ENTREPRENEURSHIP_PROGRAM,
  ENTREPRENEURSHIP_BADGES,
  ENTREPRENEURSHIP_LEVELS,
  ENTREPRENEURSHIP_SIMULATION_PRESETS
};
export type {
  StartupBadge,
  MarketSimulationState,
  GamificationLevel,
  SimulationPreset
};

/**
 * Stub program kept outside PROGRAM_REGISTRY and PROGRAM_LIST until dedicated
 * stormwater sessions are authored.
 */
export const CLEAN_STREAM_PROGRAM: PblProgram = {
  id: 'cleanstream-stormwater-2026',
  title: 'CleanStream: Smart Urban Stormwater & Micro-Filter Sentinel',
  subtitle: 'Diverting toxic first-flush urban runoff into bio-retention swales using turbidity sensors and automated flow gates.',
  status: 'stub',
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
  totalSessions: 0,
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
      ownerVerificationNeeded: 'Confirm optical sensor procurement with WeLearn lab manager.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    }
  ],
  phases: []
};

export const PROGRAM_REGISTRY: Record<string, PblProgram> = {
  'entrepreneurship-product-creation-2026': ENTREPRENEURSHIP_PROGRAM,
  'storytelling-genesis-2026': STORYTELLING_PROGRAM,
  'passion-project-blueprint-2026': PASSION_BLUEPRINT_PROGRAM,
  'biomechanics-robotics-2026': BIOMECHANICS_PROGRAM,
  'hex-city-thailand-2026': HEX_CITY_PROGRAM,
  'ecocool-smart-garden-2026': SAMPLE_PROGRAM
};

export const PROGRAM_LIST = Object.values(PROGRAM_REGISTRY).map((program) => {
  const contactHours = program.durationWeeks * SCHOOL_SCHEDULE_CONFIG.weeklyHours;
  return {
    id: program.id,
    title: program.title,
    theme: `${program.theme} (${program.durationWeeks} Wks / ${contactHours}h • ${program.totalSessions} Sessions)`
  };
});
