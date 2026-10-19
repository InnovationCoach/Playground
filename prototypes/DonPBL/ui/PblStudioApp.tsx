/**
 * Don's PBL Prototype - Main Interactive Application
 * Branch: DonPBL
 * Directory: prototypes/DonPBL/
 */

import React, { useState } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  AssumptionsBanner 
} from './components/AssumptionsBanner';
import { 
  StudentView 
} from './components/StudentView';
import { 
  TeacherView 
} from './components/TeacherView';
import { 
  HardwareSimulator 
} from './components/HardwareSimulator';
import { 
  HexCitySimulator 
} from './components/HexCitySimulator';
import { 
  BiomechanicsSimulator 
} from './components/BiomechanicsSimulator';
import { 
  PassionBlueprintSimulator 
} from './components/PassionBlueprintSimulator';
import { 
  StorytellingSimulator 
} from './components/StorytellingSimulator';
import {
  EntrepreneurshipSimulator
} from './components/EntrepreneurshipSimulator';
import { 
  AiCopilotModal 
} from './components/AiCopilotModal';
import { 
  EvidenceModal 
} from './components/EvidenceModal';
import { 
  IntegrationDrawer 
} from './components/IntegrationDrawer';
import { 
  MOCK_COHORT, 
  SAMPLE_STUDENT_PROJECT, 
  PROGRAM_LIST,
  PROGRAM_REGISTRY,
  StudentProject,
  validateAndAddEvidence
} from './pbl';
import { 
  AlertTriangle, 
  RefreshCw, 
  Loader2 
} from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<'student' | 'teacher'>('student');
  const [activeProgramId, setActiveProgramId] = useState<string>(PROGRAM_LIST[0].id);
  const [cohortProjects, setCohortProjects] = useState<StudentProject[]>(MOCK_COHORT);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(SAMPLE_STUDENT_PROJECT.id);
  const [simulationState, setSimulationState] = useState<'normal' | 'loading' | 'error'>('normal');

  // Modals state
  const [isHardwareOpen, setIsHardwareOpen] = useState(false);
  const [isHexSimulatorOpen, setIsHexSimulatorOpen] = useState(false);
  const [isBiomechanicsOpen, setIsBiomechanicsOpen] = useState(false);
  const [isPassionSimulatorOpen, setIsPassionSimulatorOpen] = useState(false);
  const [isStorySimulatorOpen, setIsStorySimulatorOpen] = useState(false);
  const [isEntrepreneurshipSimulatorOpen, setIsEntrepreneurshipSimulatorOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotStarterPrompt, setCopilotStarterPrompt] = useState<string | undefined>(undefined);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceModalPhase, setEvidenceModalPhase] = useState<string>('prototype');
  const [isIntegrationDrawerOpen, setIsIntegrationDrawerOpen] = useState(false);
  const [isAssumptionsModalOpen, setIsAssumptionsModalOpen] = useState(false);

  // Active student project lookup
  const activeProject = cohortProjects.find((p) => p.id === selectedTeamId) || cohortProjects[0];

  const handleUpdateProject = (updated: StudentProject) => {
    setCohortProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleOpenCopilot = (starter?: string) => {
    setCopilotStarterPrompt(starter);
    setIsCopilotOpen(true);
  };

  const handleOpenAddEvidence = (phase: string) => {
    setEvidenceModalPhase(phase);
    setIsEvidenceModalOpen(true);
  };

  const handleSaveCopilotEvidence = (
    title: string,
    body: string,
    asked: string,
    kept: string
  ) => {
    const res = validateAndAddEvidence(activeProject, {
      title,
      phase: (activeProject.currentPhase as any) || 'prototype',
      kind: 'ai',
      body,
      competencies: ['ctps-05', 'ct-05'],
      ai: { asked, gave: body, kept }
    });

    if (res.success && res.updatedProject) {
      handleUpdateProject(res.updatedProject);
    }
  };

  const handleUpdateFeedback = (
    feedbackNote: string,
    competencyScores: Record<string, number>
  ) => {
    const updated = {
      ...activeProject,
      coachFeedback: [
        {
          coachName: 'Coach Eleanor Vance',
          date: new Date().toISOString().slice(0, 10),
          note: feedbackNote,
          competencyScores
        },
        ...activeProject.coachFeedback
      ]
    };
    handleUpdateProject(updated);
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col antialiased">
      {/* Top Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        selectedTeamId={selectedTeamId}
        onSelectTeam={setSelectedTeamId}
        cohort={cohortProjects.map((c) => ({
          id: c.id,
          teamName: c.teamName,
          gradeLevel: c.gradeLevel
        }))}
        activeProgramId={activeProgramId}
        onSelectProgram={setActiveProgramId}
        programList={PROGRAM_LIST}
        simulationState={simulationState}
        onSimulationStateChange={setSimulationState}
        onOpenHardware={() => setIsHardwareOpen(true)}
        onOpenHexSimulator={() => setIsHexSimulatorOpen(true)}
        onOpenBiomechanicsSimulator={() => setIsBiomechanicsOpen(true)}
        onOpenPassionSimulator={() => setIsPassionSimulatorOpen(true)}
        onOpenStorySimulator={() => setIsStorySimulatorOpen(true)}
        onOpenEntrepreneurshipSimulator={() => setIsEntrepreneurshipSimulatorOpen(true)}
        onOpenCopilot={() => handleOpenCopilot()}
        onOpenIntegration={() => setIsIntegrationDrawerOpen(true)}
        onOpenAssumptions={() => setIsIntegrationDrawerOpen(true)}
      />

      {/* Provisional Choices Banner */}
      <AssumptionsBanner />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {simulationState === 'loading' ? (
          <div className="bg-white rounded-xl border border-stone-200 p-16 text-center space-y-4 shadow-xs">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-stone-900">
              Simulating Network Sync with Local Store...
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Simulating isolated fixture hydration from <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">prototypes/DonPBL/mockFixtures.ts</code>.
            </p>
          </div>
        ) : simulationState === 'error' ? (
          <div className="bg-white rounded-xl border border-rose-200 p-12 text-center space-y-4 shadow-xs">
            <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-stone-900">
              Simulated Network Error (Offline Demonstration)
            </h3>
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
              This demonstrates how PBL Studio gracefully isolates errors without crashing when external services are unreachable.
            </p>
            <button
              onClick={() => setSimulationState('normal')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset to Normal State
            </button>
          </div>
        ) : currentRole === 'student' ? (
          <StudentView
            project={activeProject}
            activeProgramId={activeProgramId}
            onUpdateProject={handleUpdateProject}
            onOpenCopilot={handleOpenCopilot}
            onOpenHardware={() => setIsHardwareOpen(true)}
            onOpenAddEvidence={handleOpenAddEvidence}
          />
        ) : (
          <TeacherView
            currentProject={activeProject}
            onSelectProject={setSelectedTeamId}
            onUpdateFeedback={handleUpdateFeedback}
          />
        )}
      </main>

      {/* Modals & Slide-overs */}
      <HardwareSimulator
        isOpen={isHardwareOpen}
        onClose={() => setIsHardwareOpen(false)}
      />

      <HexCitySimulator
        isOpen={isHexSimulatorOpen}
        onClose={() => setIsHexSimulatorOpen(false)}
      />

      <BiomechanicsSimulator
        isOpen={isBiomechanicsOpen}
        onClose={() => setIsBiomechanicsOpen(false)}
      />

      <PassionBlueprintSimulator
        isOpen={isPassionSimulatorOpen}
        onClose={() => setIsPassionSimulatorOpen(false)}
        onSaveToPortfolio={(title, summary) => {
          const res = validateAndAddEvidence(activeProject, {
            title: `Passion Blueprint: ${title}`,
            phase: 'explore',
            kind: 'note',
            body: summary,
            competencies: ['sdl-01', 'ct-01']
          });
          if (res.success && res.updatedProject) {
            handleUpdateProject(res.updatedProject);
          }
          setIsPassionSimulatorOpen(false);
        }}
      />

      <StorytellingSimulator
        isOpen={isStorySimulatorOpen}
        onClose={() => setIsStorySimulatorOpen(false)}
        onSaveToPortfolio={(title, summary) => {
          const res = validateAndAddEvidence(activeProject, {
            title: `Story IP: ${title}`,
            phase: 'prototype',
            kind: 'code',
            body: summary,
            competencies: ['ec-06', 'ct-04']
          });
          if (res.success && res.updatedProject) {
            handleUpdateProject(res.updatedProject);
          }
          setIsStorySimulatorOpen(false);
        }}
      />

      <EntrepreneurshipSimulator
        isOpen={isEntrepreneurshipSimulatorOpen}
        onClose={() => setIsEntrepreneurshipSimulatorOpen(false)}
        onSaveToPortfolio={(title, summary) => {
          const res = validateAndAddEvidence(activeProject, {
            title: `Venture Lab: ${title}`,
            phase: 'test',
            kind: 'metric',
            body: summary,
            competencies: ['ctps-05', 'sdl-03', 'ec-06']
          });
          if (res.success && res.updatedProject) {
            handleUpdateProject(res.updatedProject);
          }
          setIsEntrepreneurshipSimulatorOpen(false);
        }}
      />

      <AiCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentPhase={activeProject.currentPhase}
        codeLanguage={activeProject.codeLanguage}
        onSaveAsEvidence={handleSaveCopilotEvidence}
      />

      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        project={activeProject}
        onSaveEvidence={handleUpdateProject}
        defaultPhase={evidenceModalPhase}
      />

      <IntegrationDrawer
        isOpen={isIntegrationDrawerOpen}
        onClose={() => setIsIntegrationDrawerOpen(false)}
      />
    </div>
  );
}
