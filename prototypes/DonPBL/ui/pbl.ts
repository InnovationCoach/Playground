/**
 * Explicit Named Barrel for DonPBL UI Components
 * Location: prototypes/DonPBL/ui/pbl.ts
 * 
 * Uses explicit named re-exports (`export { ... }` and `export type { ... }`)
 * rather than `export *` to prevent silent symbol collisions across modules.
 */

export {
  SAMPLE_PROGRAM,
  SCHOOL_SCHEDULE_CONFIG,
  LEARNER_AGE_CONFIG,
  HARDWARE_INVENTORY_CONFIG,
  COPILOT_DEPLOYMENT_CONFIG
} from '../programData';

export type {
  PblProgram,
  ProgramPhase,
  PhaseSession,
  ConfirmationRecord,
  SchoolScheduleConfig,
  LearnerAgeConfig,
  AgeTierTrack,
  HardwareInventoryConfig,
  CopilotDeploymentConfig
} from '../programData';

export {
  PROGRAM_REGISTRY,
  PROGRAM_LIST,
  CLEAN_STREAM_PROGRAM,
  HEX_CITY_PROGRAM,
  HEX_CITY_ROLES,
  CRISIS_SCENARIOS,
  BIOMECHANICS_PROGRAM,
  BIOMIMETIC_TRACKS,
  PASSION_BLUEPRINT_PROGRAM,
  FRICTION_STRATEGIES,
  STORYTELLING_PROGRAM,
  GENESIS_CHARACTERS_FIXTURE,
  GENESIS_WORLD_RULES_FIXTURE,
  ENTREPRENEURSHIP_PROGRAM,
  ENTREPRENEURSHIP_BADGES,
  ENTREPRENEURSHIP_LEVELS,
  ENTREPRENEURSHIP_SIMULATION_PRESETS
} from '../programRegistry';

export type {
  HexCityRole,
  CrisisScenario,
  BiomimeticTrack,
  FrictionStrategy,
  CharacterProfile,
  WorldRule,
  StartupBadge,
  MarketSimulationState,
  GamificationLevel,
  SimulationPreset
} from '../programRegistry';

export {
  COMPETENCY_DOMAINS,
  CORE_COMPETENCIES,
  NGSS_RUBRIC_LEVELS,
  NGSS_ALIGNMENT_ITEMS,
  SAMPLE_STUDENT_PROJECT,
  MOCK_COHORT,
  MOCK_TEACHER,
  INITIAL_COACH_FEEDBACK,
  SYNTHETIC_FIXTURE_NOTICE
} from '../mockFixtures';

export type {
  CompetencyDomain,
  Competency,
  EvidenceItem,
  StudentProject,
  CoachFeedback
} from '../mockFixtures';

export {
  LIMITS,
  PHASES,
  KINDS,
  safeLink,
  getPhaseProgress,
  getCompetencyCoverage,
  evaluateReadiness,
  validateAndAddEvidence,
  generateMockCopilotReply,
  calculateUnitEconomics,
  simulateMarketStep
} from '../engine';

export type {
  PhaseId,
  EvidenceKind,
  ReadinessCheck,
  ReadinessResult
} from '../engine';

export {
  createLocalStore,
  createMemoryStore,
  projectDocId
} from '../store';

export type {
  PblStore
} from '../store';
