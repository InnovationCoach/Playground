import React, { useState } from 'react';
import { 
  Rocket, 
  FlaskConical, 
  NotebookPen, 
  Award, 
  CheckCircle2, 
  Circle, 
  Bot, 
  Cpu, 
  FileCode, 
  FileText, 
  ExternalLink, 
  Tag, 
  Plus, 
  ChevronRight, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Layers,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  StudentProject, 
  SAMPLE_PROGRAM, 
  PROGRAM_REGISTRY,
  getPhaseProgress, 
  evaluateReadiness, 
  EvidenceItem, 
  CORE_COMPETENCIES,
  safeLink
} from '../pbl';

interface StudentViewProps {
  project: StudentProject;
  activeProgramId?: string;
  onUpdateProject: (updated: StudentProject) => void;
  onOpenCopilot: (promptStarter?: string) => void;
  onOpenHardware: () => void;
  onOpenAddEvidence: (phase: string) => void;
}

export const StudentView: React.FC<StudentViewProps> = ({
  project,
  activeProgramId = 'ecocool-smart-garden-2026',
  onUpdateProject,
  onOpenCopilot,
  onOpenHardware,
  onOpenAddEvidence
}) => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'portfolio' | 'project-def' | 'readiness'>('roadmap');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(project.currentPhase || 'explore');
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [portfolioKindFilter, setPortfolioKindFilter] = useState<string>('all');

  const currentProgram = PROGRAM_REGISTRY[activeProgramId] || SAMPLE_PROGRAM;
  const readiness = evaluateReadiness(project);
  const activePhaseDef = currentProgram.phases.find((p) => p.id === selectedPhaseId) || currentProgram.phases[0];
  const activePhaseProgress = getPhaseProgress(project, selectedPhaseId);

  // Toggle task checkbox
  const handleToggleTask = (taskIndex: number) => {
    const currentTasks = project.tasksDone[selectedPhaseId] || [];
    const isDone = currentTasks.includes(taskIndex);
    const updatedTasks = isDone
      ? currentTasks.filter((i) => i !== taskIndex)
      : [...currentTasks, taskIndex];

    const updated = {
      ...project,
      tasksDone: {
        ...project.tasksDone,
        [selectedPhaseId]: updatedTasks
      }
    };
    onUpdateProject(updated);
  };

  // Filter evidence
  const filteredEvidence = project.evidence.filter((e) => {
    if (portfolioKindFilter === 'all') return true;
    return e.kind === portfolioKindFilter;
  });

  return (
    <div className="space-y-6">
      {/* Student Banner Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
              <span>Team: <strong className="text-stone-800">{project.teamName}</strong></span>
              <span aria-hidden="true">·</span>
              <span>{project.members.join(', ')}</span>
              <span aria-hidden="true">·</span>
              <span>{project.gradeLevel}</span>
            </div>
            <h2 className="text-base font-bold text-stone-900">
              Driving Question: {project.drivingQuestion}
            </h2>
          </div>

          {/* Readiness gauge */}
          <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
            <div>
              <div className="text-[11px] text-stone-500 font-medium">Showcase Readiness</div>
              <div className="text-sm font-bold text-stone-900 font-mono">
                {readiness.score} / {readiness.total} checks ({readiness.percent}%)
              </div>
            </div>
            <div className="w-12 h-12 relative flex items-center justify-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                readiness.isReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {readiness.percent}%
              </div>
            </div>
          </div>
        </div>

        {/* 7-Phase Linear Roadmap Strip */}
        <div className="mt-5 pt-4 border-t border-stone-100">
          <div className="flex justify-between items-center text-xs text-stone-500 mb-2">
            <span className="font-semibold text-stone-700">Design Thinking Journey (12 Weeks)</span>
            <span>Current Focus: <strong className="text-emerald-700 uppercase font-mono">{project.currentPhase}</strong></span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {SAMPLE_PROGRAM.phases.map((ph, idx) => {
              const prog = getPhaseProgress(project, ph.id);
              const isSelected = selectedPhaseId === ph.id;
              const isCurrent = project.currentPhase === ph.id;

              return (
                <button
                  key={ph.id}
                  onClick={() => setSelectedPhaseId(ph.id)}
                  className={`p-2.5 rounded-lg text-left transition-all border ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-stone-400 font-medium">0{idx + 1}</span>
                    {prog.isPhaseReady ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <span className="text-[10px] text-stone-400 font-mono">wk {ph.weeks[0]}-{ph.weeks[1]}</span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-stone-900 truncate">{ph.title}</div>
                  <div className="text-[10px] text-stone-500 truncate mt-0.5">
                    {prog.doneTasks}/{prog.totalTasks} tasks · {prog.evidenceCount} ev
                  </div>
                  <div className="w-full bg-stone-200 h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${prog.isPhaseReady ? 'bg-emerald-600' : 'bg-emerald-500'}`}
                      style={{ width: `${prog.percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Student Sub-Tabs (Clean Segmented Tabs) */}
      <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'roadmap' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Rocket className="w-3.5 h-3.5 text-emerald-700" />
          Phase Plan & 24 Sessions
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'portfolio' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <NotebookPen className="w-3.5 h-3.5 text-emerald-700" />
          Evidence Portfolio ({project.evidence.length})
        </button>
        <button
          onClick={() => setActiveTab('project-def')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'project-def' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
          Problem & Impact Scope
        </button>
        <button
          onClick={() => setActiveTab('readiness')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'readiness' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-emerald-700" />
          Showcase Readiness Audit
        </button>
      </div>

      {/* TAB CONTENT 1: ROADMAP & SESSIONS */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {/* Active Phase Banner */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                  <span>Phase {activePhaseDef.id.toUpperCase()}</span>
                  <span aria-hidden="true">·</span>
                  <span>Weeks {activePhaseDef.weeks[0]}–{activePhaseDef.weeks[1]}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-emerald-800">{activePhaseDef.strap}</span>
                </div>
                <h3 className="text-xl font-bold text-stone-900">{activePhaseDef.title}</h3>
                <p className="text-xs text-stone-600 mt-1 max-w-3xl leading-relaxed">
                  {activePhaseDef.goal}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAddEvidence(activePhaseDef.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-md text-xs font-medium hover:bg-emerald-800 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Evidence for {activePhaseDef.title}
                </button>
              </div>
            </div>

            {/* Task Checklist */}
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
              <div className="text-xs font-semibold text-stone-800 mb-2.5 flex items-center justify-between">
                <span>Phase Deliverable Tasks</span>
                <span className="text-stone-500 font-normal">
                  Click to check off completed tasks
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activePhaseDef.tasks.map((taskText, idx) => {
                  const isDone = (project.tasksDone[activePhaseDef.id] || []).includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleTask(idx)}
                      className={`text-left p-2.5 rounded border text-xs flex items-start gap-2.5 transition-colors ${
                        isDone
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
                      )}
                      <span className="leading-snug">{taskText}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Prompt Starters for this Phase */}
            <div>
              <div className="text-xs font-semibold text-stone-800 mb-2 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-emerald-700" />
                AI Co-Pilot Starters for {activePhaseDef.title}:
              </div>
              <div className="flex flex-wrap gap-2">
                {activePhaseDef.aiPromptStarters.map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => onOpenCopilot(promptText)}
                    className="text-left text-xs bg-stone-50 hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border border-stone-200 hover:border-emerald-300 px-3 py-1.5 rounded-md transition-colors"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 24-Session Curriculum Breakdown for this Phase */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-stone-600" />
                  Session-by-Session Curriculum Plan ({activePhaseDef.sessions.length} Sessions)
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Step-by-step 50-minute workshop activities with learner choice branching and reflection prompts.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {activePhaseDef.sessions.map((session) => {
                const isExpanded = expandedSession === session.sessionNumber;

                return (
                  <div
                    key={session.sessionNumber}
                    className="border border-stone-200 rounded-lg overflow-hidden bg-stone-50/50"
                  >
                    <button
                      onClick={() => setExpandedSession(isExpanded ? null : session.sessionNumber)}
                      className="w-full text-left p-3.5 bg-white hover:bg-stone-50 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          Session {session.sessionNumber}
                        </span>
                        <div>
                          <span className="font-semibold text-stone-900 text-sm">{session.title}</span>
                          <span className="text-stone-400 ml-2 text-xs">
                            Week {session.week} · {session.durationMin} mins
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-700 font-medium">
                        {isExpanded ? 'Collapse' : 'Explore Session →'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="p-4 border-t border-stone-200 bg-stone-50 text-xs space-y-4">
                        {/* Learning Goal */}
                        <div className="bg-white p-3 rounded border border-stone-200">
                          <span className="font-semibold text-stone-900 block mb-1">
                            🎯 Session Learning Goal:
                          </span>
                          <p className="text-stone-700 leading-relaxed">{session.learningGoal}</p>
                        </div>

                        {/* Activities */}
                        <div>
                          <span className="font-semibold text-stone-900 block mb-1.5">
                            📋 Step-by-Step Activities:
                          </span>
                          <ul className="list-disc list-inside space-y-1 text-stone-700">
                            {session.activities.map((act, idx) => (
                              <li key={idx}>{act}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Learner Choice */}
                        <div className="bg-emerald-50/80 p-3 rounded border border-emerald-200">
                          <span className="font-semibold text-emerald-950 block mb-1">
                            💡 Learner Choice Pathway:
                          </span>
                          <p className="text-stone-800 font-medium mb-2">{session.learnerChoices.question}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {session.learnerChoices.options.map((opt) => (
                              <div
                                key={opt.id}
                                className="bg-white p-2 rounded border border-emerald-200 text-stone-700"
                              >
                                <span className="font-semibold text-stone-900 block">{opt.label}</span>
                                <span className="text-[11px] text-stone-500">{opt.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Evidence to Collect & Reflection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded border border-stone-200">
                            <span className="font-semibold text-stone-900 block mb-1">
                              📸 Evidence to Collect:
                            </span>
                            <p className="text-stone-700 mb-2">{session.evidenceToCollect.prompt}</p>
                            <button
                              onClick={() => onOpenAddEvidence(activePhaseDef.id)}
                              className="text-xs text-emerald-700 font-semibold underline underline-offset-2 flex items-center gap-1"
                            >
                              Log {session.evidenceToCollect.kind} evidence now →
                            </button>
                          </div>

                          <div className="bg-white p-3 rounded border border-stone-200">
                            <span className="font-semibold text-stone-900 block mb-1">
                              💭 Reflection Prompt:
                            </span>
                            <p className="text-stone-700 italic">"{session.reflectionPrompt}"</p>
                            <span className="text-[11px] text-stone-400 mt-2 block">
                              Teacher Tip: {session.teacherTips}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: EVIDENCE PORTFOLIO */}
      {activeTab === 'portfolio' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Evidence Portfolio ({filteredEvidence.length} Artifacts)
              </h3>
              <p className="text-xs text-stone-500">
                All evidence tagged to WeLearn competencies and verifiable in the final showcase.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAddEvidence(selectedPhaseId)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-md text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Evidence
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {['all', 'note', 'data', 'code', 'ai', 'media', 'feedback', 'reflection'].map((k) => (
              <button
                key={k}
                onClick={() => setPortfolioKindFilter(k)}
                className={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${
                  portfolioKindFilter === k
                    ? 'bg-stone-900 text-white font-medium shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {k} {k !== 'all' && `(${project.evidence.filter((e) => e.kind === k).length})`}
              </button>
            ))}
          </div>

          {/* Evidence Cards Grid */}
          {filteredEvidence.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
              <NotebookPen className="w-8 h-8 text-stone-300 mx-auto" />
              <div className="text-sm font-semibold text-stone-800">No evidence found in this filter</div>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Log notes, data curves, code snippets, or AI logs to prove your competencies.
              </p>
              <button
                onClick={() => onOpenAddEvidence(selectedPhaseId)}
                className="px-4 py-2 bg-emerald-700 text-white rounded-md text-xs font-medium hover:bg-emerald-800 transition-colors"
              >
                Add First Evidence Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvidence.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span className="font-mono text-[11px] font-semibold uppercase text-emerald-800">
                        {item.phase}
                      </span>
                      <span className="capitalize text-stone-400 font-mono text-[11px]">
                        {item.kind}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-stone-900 leading-snug">{item.title}</h4>

                    {/* AI Log Provenance view */}
                    {item.kind === 'ai' && item.ai ? (
                      <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs space-y-2">
                        <div>
                          <span className="font-semibold text-amber-950 block text-[11px]">Prompt Asked:</span>
                          <p className="text-stone-700 italic">"{item.ai.asked}"</p>
                        </div>
                        <div>
                          <span className="font-semibold text-amber-950 block text-[11px]">What Team Kept / Rejected:</span>
                          <p className="text-stone-800 font-medium">{item.ai.kept}</p>
                        </div>
                      </div>
                    ) : item.kind === 'code' ? (
                      <div className="bg-stone-950 text-emerald-400 p-3 rounded-lg font-mono text-[11px] max-h-48 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{item.body}</pre>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
                        {item.body}
                      </p>
                    )}

                    {/* Metrics preview */}
                    {item.metrics && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.metrics.map((m, idx) => (
                          <div
                            key={idx}
                            className="bg-stone-100 px-2 py-1 rounded text-[11px] font-mono text-stone-800"
                          >
                            <span className="text-stone-500 mr-1">{m.label}:</span>
                            <span className="font-bold text-emerald-800">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Competency tags & link */}
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {item.competencies.map((cid) => (
                        <span
                          key={cid}
                          className="font-mono text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded"
                          title={CORE_COMPETENCIES.find((c) => c.id === cid)?.statement}
                        >
                          {cid}
                        </span>
                      ))}
                    </div>

                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 text-[11px]"
                      >
                        Source Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: PROJECT DEF & IMPACT */}
      {activeTab === 'project-def' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6 shadow-xs max-w-4xl">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Project Definition & Measurable Criteria
            </h3>
            <p className="text-xs text-stone-500">
              In PBL Studio, projects must solve a real problem for people, the environment, or both.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-900 block">How Might We (HMW) Question</span>
              <p className="text-stone-700 leading-relaxed font-medium">
                {project.problem.hmw || 'Not yet defined.'}
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-900 block">Who Benefits (Human Stakeholder)</span>
              <p className="text-stone-700 leading-relaxed">
                {project.problem.who || 'Not yet defined.'}
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-2">
              <span className="font-bold text-stone-900 block">Engineering Criteria & Constraints</span>
              <div className="text-stone-700 space-y-1">
                <div><strong>Criteria:</strong> {project.problem.criteria || 'None set.'}</div>
                <div><strong>Constraints:</strong> {project.problem.constraints || 'None set.'}</div>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-lg border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-950 block">Measurable Impact Metric</span>
              <p className="text-emerald-900 font-medium leading-relaxed">
                {project.problem.impactMeasure || 'None specified.'}
              </p>
              <div className="text-[11px] text-stone-500">
                Target Impact: <strong className="capitalize text-emerald-800">{project.impact || 'Unassigned'}</strong>
              </div>
            </div>

            <div className="md:col-span-2 bg-blue-50/60 p-4 rounded-lg border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 block">Learner Cohort & Age Track Scaffolding</span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                  {project.gradeLevel}
                </span>
              </div>
              <p className="text-stone-700 leading-relaxed">
                <strong>Program Age Span:</strong> {currentProgram.targetAgeRange}
              </p>
              <div className="text-[11px] text-stone-600 flex flex-wrap gap-4 pt-1">
                <span>Code Environment: <strong className="font-mono text-stone-800">{project.codeLanguage}</strong></span>
                <span>Term Duration: <strong className="text-stone-800">{currentProgram.durationWeeks} Weeks (120 Contact Hours)</strong></span>
                <span>Milestones: <strong className="text-stone-800">{currentProgram.totalSessions} Sessions</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: READINESS AUDIT */}
      {activeTab === 'readiness' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6 shadow-xs max-w-4xl">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                End-of-Term Showcase Readiness Audit
              </h3>
              <p className="text-xs text-stone-500">
                8 qualification criteria required before presenting at the Public Showcase.
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-emerald-800 font-mono">
                {readiness.score} / {readiness.total}
              </span>
              <div className="text-[11px] text-stone-400">Requirements Passed</div>
            </div>
          </div>

          <div className="space-y-3">
            {readiness.checks.map((check) => (
              <div
                key={check.id}
                className={`p-3.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                  check.ok
                    ? 'bg-emerald-50/50 border-emerald-200 text-stone-800'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  {check.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-stone-900 block">{check.label}</span>
                    <p className="text-stone-600 text-[11px] mt-0.5">{check.description}</p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className={`font-mono text-[11px] font-semibold ${
                    check.ok ? 'text-emerald-700' : 'text-stone-400'
                  }`}>
                    {check.ok ? 'VERIFIED' : 'PENDING'}
                  </span>
                  {check.requiredPhase && (
                    <span className="block text-[10px] text-stone-400 uppercase font-mono">
                      Phase: {check.requiredPhase}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
