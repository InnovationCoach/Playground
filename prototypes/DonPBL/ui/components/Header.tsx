import React from 'react';
import {
  Cpu,
  Bot,
  GitBranch,
  UserCheck,
  GraduationCap,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { SAMPLE_PROGRAM, PROGRAM_REGISTRY, SCHOOL_SCHEDULE_CONFIG, LEARNER_AGE_CONFIG } from '../pbl';

interface HeaderProps {
  currentRole: 'student' | 'teacher';
  onRoleChange: (role: 'student' | 'teacher') => void;
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
  cohort: { id: string; teamName: string; gradeLevel: string }[];
  activeProgramId: string;
  onSelectProgram: (programId: string) => void;
  programList: { id: string; title: string; theme: string }[];
  simulationState: 'normal' | 'loading' | 'error';
  onSimulationStateChange: (state: 'normal' | 'loading' | 'error') => void;
  onOpenHardware: () => void;
  onOpenHexSimulator: () => void;
  onOpenBiomechanicsSimulator: () => void;
  onOpenPassionSimulator?: () => void;
  onOpenStorySimulator?: () => void;
  onOpenEntrepreneurshipSimulator?: () => void;
  onOpenArkSimulator?: () => void;
  onOpenCopilot: () => void;
  onOpenIntegration: () => void;
  onOpenAssumptions: () => void;
  onResetDemoData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  selectedTeamId,
  onSelectTeam,
  cohort,
  activeProgramId,
  onSelectProgram,
  programList,
  simulationState,
  onSimulationStateChange,
  onOpenHardware,
  onOpenHexSimulator,
  onOpenBiomechanicsSimulator,
  onOpenPassionSimulator,
  onOpenStorySimulator,
  onOpenEntrepreneurshipSimulator,
  onOpenArkSimulator,
  onOpenCopilot,
  onOpenIntegration,
  onOpenAssumptions,
  onResetDemoData
}) => {
  const currentProg = programList.find((p) => p.id === activeProgramId) || programList[0];
  const fullProgram = PROGRAM_REGISTRY[activeProgramId] || SAMPLE_PROGRAM;

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-30">
      {/* Top utility bar */}
      <div className="border-b border-stone-100 bg-stone-50/80 px-4 py-1.5 text-xs text-stone-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-800">WeLearn PBL Studio</span>
            <span className="text-stone-300">/</span>
            <span className="flex items-center gap-1 font-mono text-stone-700">
              <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
              branch: DonPBL
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-stone-500">prototypes/DonPBL/</span>
            <span className="text-stone-300">·</span>
            <span className="text-amber-700 font-medium">Provisional Prototype</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 font-medium">Program:</span>
              <select
                aria-label="Select PBL Program"
                value={activeProgramId}
                onChange={(e) => onSelectProgram(e.target.value)}
                className="bg-white border border-stone-300 rounded px-2 py-0.5 text-xs font-semibold text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {programList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-stone-300">|</span>
            <button
              onClick={onOpenAssumptions}
              className="text-stone-600 hover:text-stone-900 underline underline-offset-2 transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              {fullProgram.assumptions.length} Design Assumptions
            </button>
            {onResetDemoData && (
              <>
                <span className="text-stone-300">|</span>
                <button
                  onClick={onResetDemoData}
                  className="text-rose-700 hover:text-rose-900 font-medium transition-colors flex items-center gap-1"
                  title="Clear saved local demo data and restore initial synthetic fixtures"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Demo Data
                </button>
              </>
            )}
            <span className="text-stone-300">|</span>
            <button
              onClick={onOpenIntegration}
              className="text-emerald-700 hover:text-emerald-900 font-medium transition-colors"
            >
              Integration Architecture →
            </button>
          </div>
        </div>
      </div>

      {/* Main hero & controls */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-0.5">
            <span>Term Schedule: {fullProgram.durationWeeks} Weeks</span>
            <span aria-hidden="true">·</span>
            <span className="bg-amber-50 text-amber-900 font-semibold px-1.5 py-0.5 rounded border border-amber-200">
              {SCHOOL_SCHEDULE_CONFIG.dailyHours} hrs / weekday ({SCHOOL_SCHEDULE_CONFIG.weeklyHours}h/wk • {fullProgram.durationWeeks * SCHOOL_SCHEDULE_CONFIG.weeklyHours}h/term — Provisional)
            </span>
            <span aria-hidden="true">·</span>
            <span className="bg-blue-50 text-blue-800 font-semibold px-1.5 py-0.5 rounded border border-blue-200">
              {LEARNER_AGE_CONFIG.span}
            </span>
            <span aria-hidden="true">·</span>
            <span>{fullProgram.totalSessions} Milestone Workshops</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">{currentProg.theme}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">
            {currentProg.title}
          </h1>
        </div>

        {/* Action Controls & Role Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick interactive tools */}
          {activeProgramId === 'interstellar-ark-horizon-2026' ? (
            <button
              onClick={onOpenArkSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors shadow-2xs"
              title="Open Interstellar Ark & Exoplanet Civilization Digital Twin Simulator"
            >
              <Cpu className="w-3.5 h-3.5" />
              Interstellar Ark Digital Twin &amp; Crisis Hub
            </button>
          ) : activeProgramId === 'entrepreneurship-product-creation-2026' ? (
            <button
              onClick={onOpenEntrepreneurshipSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors shadow-2xs"
              title="Open Venture Lab: Market Sandbox, Unit Economics & Startup Gamification"
            >
              <Cpu className="w-3.5 h-3.5" />
              Venture Simulator & Gamification Hub
            </button>
          ) : activeProgramId === 'storytelling-genesis-2026' ? (
            <button
              onClick={onOpenStorySimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-md transition-colors shadow-2xs"
              title="Open Genesis Engine: Cinematic Narrative & Story Bible Simulator"
            >
              <Cpu className="w-3.5 h-3.5" />
              Story Bible & Screenplay Studio
            </button>
          ) : activeProgramId === 'passion-project-blueprint-2026' ? (
            <button
              onClick={onOpenPassionSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-md transition-colors shadow-2xs"
              title="Open Passion Project Blueprint & Neuro-Scaffold Simulator"
            >
              <Cpu className="w-3.5 h-3.5" />
              Passion Blueprint & 2e Simulator
            </button>
          ) : activeProgramId === 'biomechanics-robotics-2026' ? (
            <button
              onClick={onOpenBiomechanicsSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-md transition-colors shadow-2xs"
              title="Open Kinematics & Linkage Gait Simulator"
            >
              <Cpu className="w-3.5 h-3.5" />
              Kinematics & Linkage Simulator
            </button>
          ) : activeProgramId === 'hex-city-thailand-2026' ? (
            <button
              onClick={onOpenHexSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-md transition-colors shadow-2xs"
              title="Open Hex-City Floating City Digital Twin & Crisis Simulator"
            >
              <Cpu className="w-3.5 h-3.5" />
              Hex-City Digital Twin & Crisis Simulator
            </button>
          ) : (
            <button
              onClick={onOpenHardware}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
              title="Open interactive micro:bit sensor & smart garden simulation"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-700" />
              Sensor & Canopy Rig
            </button>
          )}

          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
            title="Open simulated PBL Studio AI Co-Pilot"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-600" />
            AI Co-Pilot (Local Mock)
          </button>

          {/* Fixture Team Selector */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-stone-200">
            <label htmlFor="team-select" className="text-xs text-stone-500">
              Cohort:
            </label>
            <select
              id="team-select"
              value={selectedTeamId}
              onChange={(e) => onSelectTeam(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 text-stone-800 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {cohort.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.teamName}
                </option>
              ))}
            </select>
          </div>

          {/* State Simulator (Normal / Loading / Error) */}
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-md">
            <button
              onClick={() => onSimulationStateChange('normal')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                simulationState === 'normal'
                  ? 'bg-white text-stone-900 font-medium shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Standard loaded view"
            >
              Normal
            </button>
            <button
              onClick={() => onSimulationStateChange('loading')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                simulationState === 'loading'
                  ? 'bg-white text-stone-900 font-medium shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Simulate network loading spinner"
            >
              Loading
            </button>
            <button
              onClick={() => onSimulationStateChange('error')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                simulationState === 'error'
                  ? 'bg-rose-50 text-rose-700 font-medium shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Simulate error boundary state"
            >
              Error
            </button>
          </div>

          {/* Role switcher segmented tab */}
          <div className="flex items-center gap-1 bg-stone-900 text-white p-0.5 rounded-lg">
            <button
              onClick={() => onRoleChange('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentRole === 'student'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student View
            </button>
            <button
              onClick={() => onRoleChange('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentRole === 'teacher'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Coach View
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
