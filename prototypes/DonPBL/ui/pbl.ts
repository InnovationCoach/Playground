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
  ConfirmationRecord,
  PblProgram,
  ProgramPhase,
  PhaseSession,
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
  BIOMECHANICS_60_DAY_SCHEDULE,
  BIOMECHANICS_OLDER_STUDENT_PILLARS,
  BIOMECHANICS_GAMIFICATION_BADGES,
  PASSION_BLUEPRINT_PROGRAM,
  FRICTION_STRATEGIES,
  STORYTELLING_PROGRAM,
  GENESIS_CHARACTERS_FIXTURE,
  GENESIS_WORLD_RULES_FIXTURE,
  GENESIS_DELIVERABLES,
  GENESIS_12_WEEK_ROADMAP,
  GENESIS_SUCCESS_CHECKLIST,
  GENESIS_GAMIFICATION_BADGES,
  ENTREPRENEURSHIP_PROGRAM,
  ENTREPRENEURSHIP_BADGES,
  ENTREPRENEURSHIP_LEVELS,
  ENTREPRENEURSHIP_SIMULATION_PRESETS,
  ENTREPRENEURSHIP_PDF_ACTIVITIES,
  INTERSTELLAR_ARK_PROGRAM,
  EXOPLANET_CANDIDATES,
  ARK_PROPULSION_OPTIONS,
  ARK_CRISIS_SCENARIOS,
  ARK_WELEARN_MTC_RUBRIC,
  ARK_GAMIFICATION_LEVELS,
  ARK_GAMIFICATION_BADGES,
  KINETIC_ENERGY_PROGRAM,
  KINETIC_TRANSDUCER_OPTIONS,
  KINETIC_SITE_BOTTLENECKS,
  KINETIC_DELIVERABLES,
  KINETIC_WELEARN_SKILLS_TABLE,
  KINETIC_GAMIFICATION_BADGES,
  VITAL_FLOW_PROGRAM,
  VITAL_FLOW_PUMP_OPTIONS,
  VITAL_FLOW_VALVE_OPTIONS,
  VITAL_FLOW_VASCULAR_PATHWAYS,
  VITAL_FLOW_DELIVERABLES,
  VITAL_FLOW_WELEARN_SKILLS_TABLE,
  VITAL_FLOW_GAMIFICATION_BADGES,
  VOYAGER_PROGRAM,
  VOYAGER_TEAM_ROLES,
  VOYAGER_12_WEEK_SCHEDULE,
  VOYAGER_ACTIVITY_GUIDES,
  VOYAGER_WELEARN_MTC_RUBRIC,
  VOYAGER_MTC_REFLECTION_QUESTIONS,
  VOYAGER_GAMIFICATION_BADGES
} from '../programRegistry';

export type {
  HexCityRole,
  CrisisScenario,
  BiomimeticTrack,
  BiomechanicsWeekSchedule,
  BiomechanicsSpecialPillar,
  BiomechanicsBadge,
  FrictionStrategy,
  CharacterProfile,
  WorldRule,
  StoryBeat,
  GenesisDeliverableSpec,
  GenesisWeekSchedule,
  GenesisSuccessCriterion,
  GenesisGamificationBadge,
  StartupBadge,
  MarketSimulationState,
  GamificationLevel,
  SimulationPreset,
  EntrepreneurshipPhaseActivity,
  ExoplanetCandidate,
  ArkPropulsionOption,
  ArkCrisisScenario,
  ArkMtcRubricItem,
  ArkGamificationBadge,
  ArkGamificationLevel,
  KineticTransducerOption,
  KineticSiteBottleneck,
  KineticSkillPracticeItem,
  KineticDeliverableSpec,
  KineticGamificationBadge,
  VitalFlowPumpOption,
  VitalFlowValveOption,
  VitalFlowVascularZone,
  VitalFlowDeliverableSpec,
  VitalFlowSkillPracticeItem,
  VitalFlowGamificationBadge,
  VoyagerTeamRole,
  VoyagerWeekDeliverable,
  VoyagerActivityGuideStep,
  VoyagerWeLearnCompetencyRubric,
  VoyagerMtcReflectionQuestion,
  VoyagerGamificationBadge
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
  simulateArkBiosphere,
  simulateKineticHarvesting,
  simulateVitalFlowCirculation,
  simulateVoyagerRcSolar
} from '../engine';

export type {
  PhaseId,
  EvidenceKind,
  ReadinessResult
} from '../engine';

export {
  projectDocId,
  createLocalStore,
  createMemoryStore
} from '../store';

export type {
  PblStore
} from '../store';
