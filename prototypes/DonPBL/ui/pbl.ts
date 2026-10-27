/**
 * Explicit Named Barrel for Don's PBL Prototype UI
 * Location: prototypes/DonPBL/ui/pbl.ts
 *
 * Uses explicit named re-exports (`export { ... }` and `export type { ... }`)
 * rather than `export *` so symbol collisions are caught at build time and
 * files can run cleanly under type-stripping, Vite/Rolldown, or esbuild.
 */

export {
  SAMPLE_PROGRAM,
  SCHOOL_SCHEDULE_CONFIG,
  LEARNER_AGE_CONFIG,
  HARDWARE_INVENTORY_CONFIG,
  COPILOT_DEPLOYMENT_CONFIG
} from '../programData';

export type {
  ConfirmationStatus,
  ConfirmationRecord,
  PblProgram,
  ProgramPhase,
  PhaseSession,
  LearnerChoiceOption,
  MeasurableImpactCriterion,
  AssumptionNote,
  SchoolScheduleConfig,
  AgeTierTrack,
  LearnerAgeConfig,
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
  ENTREPRENEURSHIP_SIMULATION_PRESETS,
  INTERSTELLAR_ARK_PROGRAM,
  EXOPLANET_CANDIDATES,
  ARK_PROPULSION_OPTIONS,
  ARK_CRISIS_SCENARIOS,
  ARK_WELEARN_MTC_RUBRIC,
  ARK_GAMIFICATION_LEVELS,
  ARK_GAMIFICATION_BADGES
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
  SimulationPreset,
  ExoplanetCandidate,
  ArkPropulsionOption,
  ArkCrisisScenario,
  ArkMtcRubricItem,
  ArkGamificationBadge,
  ArkGamificationLevel
} from '../programRegistry';

export {
  SYNTHETIC_FIXTURE_NOTICE,
  COMPETENCY_DOMAINS,
  CORE_COMPETENCIES,
  NGSS_DIMENSIONS,
  NGSS_RUBRIC_LEVELS,
  NGSS_ALIGNMENT_ITEMS,
  SAMPLE_STUDENT_PROJECT,
  MOCK_COHORT,
  INITIAL_COACH_FEEDBACK,
  MOCK_TEACHER
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
  evaluateReadiness,
  getCompetencyCoverage,
  validateAndAddEvidence,
  generateMockCopilotReply,
  calculateUnitEconomics,
  simulateMarketStep,
  simulateArkBiosphere
} from '../engine';

export type {
  PhaseId,
  EvidenceKind,
  ReadinessCheckResult
} from '../engine';

export {
  projectDocId,
  createLocalStore,
  createMemoryStore
} from '../store';

export type {
  PblStore
} from '../store';
