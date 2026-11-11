import React, { useState } from 'react';
import {
  Users,
  Award,
  BookOpen,
  FlaskConical,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import {
  MOCK_TEACHER,
  SAMPLE_PROGRAM,
  PROGRAM_REGISTRY,
  COMPETENCY_DOMAINS,
  CORE_COMPETENCIES,
  NGSS_ALIGNMENT_ITEMS,
  evaluateReadiness,
  LEARNER_AGE_CONFIG
} from '../pbl';
import type {
  StudentProject,
  CoachFeedback
} from '../pbl';

interface TeacherViewProps {
  cohort?: StudentProject[];
  currentProject: StudentProject;
  activeProgramId?: string;
  coachFeedback?: CoachFeedback[];
  onSelectProject: (teamId: string) => void;
  onUpdateFeedback: (feedbackNote: string, scores: Record<string, number>) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  cohort = [],
  currentProject,
  activeProgramId = 'ecocool-smart-garden-2026',
  coachFeedback = [],
  onSelectProject,
  onUpdateFeedback
}) => {
  const [activeTab, setActiveTab] = useState<'cohort' | 'competencies' | 'guide' | 'ngss'>('cohort');
  const [selectedDomain, setSelectedDomain] = useState<string>('ctps');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [savedBanner, setSavedBanner] = useState<boolean>(false);
  const [savedScores, setSavedScores] = useState<Record<string, number>>({
    'sdl-04': 4,
    'ctps-01': 4,
    'ctps-05': 4,
    'ctps-12': 4,
    'ct-05': 4
  });

  const currentProgram = PROGRAM_REGISTRY[activeProgramId] || SAMPLE_PROGRAM;
  const ageConfirmed = LEARNER_AGE_CONFIG.confirmation.status === 'confirmed';

  const handleScoreChange = (competencyId: string, score: number) => {
    setSavedScores((prev) => ({
      ...prev,
      [competencyId]: score
    }));
  };

  const handleSaveAssessment = () => {
    const note = feedbackText.trim() || 'Recorded formative competency rubric evaluation.';
    onUpdateFeedback(note, savedScores);
    setFeedbackText('');
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Teacher Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <span>{MOCK_TEACHER.name}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-800 font-medium">{MOCK_TEACHER.role}</span>
            <span aria-hidden="true">·</span>
            <span>{MOCK_TEACHER.school}</span>
          </div>
          <h2 className="text-lg font-bold text-stone-900">
            PBL Facilitator & Assessment Dashboard ({currentProgram.title})
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-stone-50 px-3 py-2 rounded-lg border border-stone-200">
            <span className="text-stone-500 block">Active Cohort</span>
            <span className="font-bold text-stone-900 font-mono text-sm">
              {cohort.length} Teams ({MOCK_TEACHER.cohortSize} Learners)
            </span>
          </div>
          <div className="bg-stone-50 px-3 py-2 rounded-lg border border-stone-200">
            <span className="text-stone-500 block">Selected Project</span>
            <span className="font-bold text-emerald-800 text-sm">
              {currentProject.teamName}
            </span>
          </div>
        </div>
      </div>

      {/* Teacher Navigation Tabs */}
      <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('cohort')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'cohort' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-700" />
          Cohort Progress & Evidence Review
        </button>
        <button
          onClick={() => setActiveTab('competencies')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'competencies' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-emerald-700" />
          Competency Assessment Matrix ({CORE_COMPETENCIES.length} Competencies)
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'guide' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
          Curriculum & Pedagogical Guide
        </button>
        <button
          onClick={() => setActiveTab('ngss')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'ngss' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
          Explore NGSS 3D Rubrics
        </button>
      </div>

      {/* TAB 1: COHORT OVERVIEW & EVIDENCE INSPECTOR */}
      {activeTab === 'cohort' && (
        <div className="space-y-6">
          {/* Cohort Table */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Term 3 Cohort Teams (Synthetic Fixtures)</h3>
                <p className="text-xs text-stone-500">
                  Select a team to inspect evidence portfolio artifacts and AI prompt provenance.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                  <tr>
                    <th className="p-3">Team Name & Members</th>
                    <th className="p-3">Grade Level</th>
                    <th className="p-3">Current Phase</th>
                    <th className="p-3">Evidence Logged</th>
                    <th className="p-3">Showcase Readiness</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {cohort.map((team) => {
                    const ready = evaluateReadiness(team);
                    const isSelected = team.id === currentProject.id;

                    return (
                      <tr
                        key={team.id}
                        className={`hover:bg-stone-50/80 transition-colors ${
                          isSelected ? 'bg-emerald-50/60 font-medium' : ''
                        }`}
                      >
                        <td className="p-3">
                          <span className="font-bold text-stone-900 block">{team.teamName}</span>
                          <span className="text-[11px] text-stone-500">{team.members.join(', ')}</span>
                        </td>
                        <td className="p-3 text-stone-600">{team.gradeLevel}</td>
                        <td className="p-3">
                          <span className="font-mono uppercase font-semibold text-emerald-800 text-[11px]">
                            {team.currentPhase}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          {team.evidence.length} artifacts
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-stone-900">
                              {ready.percent}%
                            </span>
                            <span className="text-[11px] text-stone-400">
                              ({ready.score}/8)
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onSelectProject(team.id)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                              isSelected
                                ? 'bg-emerald-700 text-white'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            }`}
                          >
                            {isSelected ? 'Reviewing' : 'Inspect Portfolio'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inspect Selected Team Evidence */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-stone-900">
                  Evidence Inspector: {currentProject.teamName}
                </h4>
                <p className="text-xs text-stone-500">
                  Review student evidence with emphasis on AI logs and student explanations.
                </p>
              </div>
              <span className="text-xs text-stone-500">
                Total Artifacts: <strong className="text-stone-900">{currentProject.evidence.length}</strong>
              </span>
            </div>

            {currentProject.evidence.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                This team has not logged any evidence yet (Empty State).
              </div>
            ) : (
              <div className="space-y-3">
                {currentProject.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-lg border border-stone-200 bg-stone-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-800 font-semibold uppercase text-[11px]">
                          [{ev.phase}]
                        </span>
                        <span className="font-bold text-stone-900">{ev.title}</span>
                      </div>
                      <span className="font-mono capitalize text-stone-400 text-[11px]">
                        {ev.kind}
                      </span>
                    </div>

                    {ev.kind === 'ai' && ev.ai ? (
                      <div className="bg-amber-50 p-3 rounded border border-amber-200 text-xs space-y-1.5">
                        <div className="flex items-center gap-1 font-semibold text-amber-950">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                          AI Log Audit:
                        </div>
                        <div>
                          <strong className="text-stone-800">Prompt Asked:</strong>{' '}
                          <span className="text-stone-700 italic">&ldquo;{ev.ai.asked}&rdquo;</span>
                        </div>
                        <div>
                          <strong className="text-stone-800">What Team Kept / Rejected:</strong>{' '}
                          <span className="text-emerald-900 font-medium">{ev.ai.kept}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                        {ev.body.slice(0, 300)}{ev.body.length > 300 ? '...' : ''}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                      <div className="flex items-center gap-1">
                        <span>Tagged Competencies:</span>
                        {ev.competencies.map((c) => (
                          <span key={c} className="font-mono bg-stone-200 px-1 rounded text-stone-800">
                            {c}
                          </span>
                        ))}
                      </div>
                      {ev.link && (
                        <a
                          href={ev.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1"
                        >
                          View Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPETENCY ASSESSMENT MATRIX */}
      {activeTab === 'competencies' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                School Competency Assessment Framework (WeLearn Academy — {CORE_COMPETENCIES.length} Competencies)
              </h3>
              <p className="text-xs text-stone-500">
                Score learner evidence across 7 domains on a 4-level rubric: Emerging (1), Developing (2), Proficient (3), Extending (4). Coach feedback is stored separately from the student&apos;s project document.
              </p>
            </div>

            {/* Domain Selector */}
            <div className="flex flex-wrap gap-1.5 border-b border-stone-100 pb-3">
              {COMPETENCY_DOMAINS.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    selectedDomain === domain.id
                      ? 'bg-stone-900 text-white font-medium shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {domain.title}
                </button>
              ))}
            </div>

            {/* Competency Scoring Rows */}
            <div className="space-y-3">
              {CORE_COMPETENCIES.filter((c) => c.domain === selectedDomain).map((comp) => {
                const currentScore = savedScores[comp.id] || 0;

                return (
                  <div
                    key={comp.id}
                    className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-bold text-emerald-800">[{comp.id}]</span>
                        <span className="font-semibold text-stone-900">{comp.title}</span>
                        <span className="capitalize text-stone-400 font-mono text-[10px]">({comp.level})</span>
                      </div>
                      <p className="text-stone-600 leading-snug">{comp.statement}</p>
                    </div>

                    {/* 1..4 score buttons */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map((scoreVal) => (
                        <button
                          key={scoreVal}
                          onClick={() => handleScoreChange(comp.id, scoreVal)}
                          className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                            currentScore === scoreVal
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                          }`}
                          title={`Score ${scoreVal}`}
                        >
                          {scoreVal}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formative Feedback Textarea */}
            <div className="pt-4 border-t border-stone-200 space-y-3">
              <label className="block text-xs font-semibold text-stone-800">
                Formative Feedback for {currentProject.teamName}:
              </label>
              <textarea
                rows={3}
                placeholder="Write coach observations, commendations on persistence, or suggestions for showcase defense..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAssessment}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-md text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-2xs"
                >
                  Save Competency Scores & Feedback
                </button>
                {savedBanner && (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Saved to separate coach feedback store!
                  </span>
                )}
              </div>
            </div>

            {/* Saved Coach Feedback History */}
            <div className="pt-4 border-t border-stone-200 space-y-2">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                Saved Coach Feedback Log ({coachFeedback.length})
              </h4>
              {coachFeedback.length === 0 ? (
                <p className="text-xs text-stone-400">No coach feedback recorded for this team yet.</p>
              ) : (
                <div className="space-y-2">
                  {coachFeedback.map((fb, idx) => (
                    <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-stone-500">
                        <span className="font-semibold text-stone-900">{fb.coachName}</span>
                        <span className="font-mono text-[11px]">{fb.date}</span>
                      </div>
                      <p className="text-stone-700">{fb.note}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(fb.competencyScores).map(([cid, score]) => (
                          <span
                            key={cid}
                            className="font-mono text-[10px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-1.5 py-0.5 rounded"
                          >
                            {cid}: {score}/4
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CURRICULUM & PEDAGOGICAL GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs text-xs">
            <h3 className="text-sm font-bold text-stone-900">
              Facilitator Guidance & Laboratory Safety Protocols ({currentProgram.title})
            </h3>

            {/* Safety Protocol */}
            <div className="bg-rose-50/70 p-4 rounded-lg border border-rose-200 space-y-2">
              <div className="font-semibold text-rose-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-700" />
                Laboratory & Safeguarding Protocols (Strict Classroom Mandate)
              </div>
              <ul className="list-disc list-inside space-y-1 text-stone-700">
                {currentProgram.teacherGuidance.safetyProtocol.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Pedagogical Scaffolding */}
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-2">
              <span className="font-semibold text-stone-900 block">
                Pedagogical Scaffolding & Calibration Instructions:
              </span>
              <ul className="list-disc list-inside space-y-1 text-stone-700">
                {currentProgram.teacherGuidance.pedagogicalScaffolding.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Multi-Tiered Age Tracks (Ages 9-17) */}
            <div className="bg-blue-50/70 p-4 rounded-lg border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-950 flex items-center gap-1.5 text-xs">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  Multi-Tiered Age Tracks: {LEARNER_AGE_CONFIG.span}
                </span>
                <span className="text-[10px] uppercase font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  {ageConfirmed ? 'Confirmed' : 'Needs Owner Confirmation'}
                </span>
              </div>
              <p className="text-stone-600 text-xs leading-relaxed">
                Curriculum, hardware complexity, and code environments are differentiated across three provisional age cohorts:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                {LEARNER_AGE_CONFIG.tracks.map((track) => (
                  <div key={track.tierId} className="bg-white p-3 rounded-md border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-xs">{track.name}</span>
                      <span className="text-[10px] font-mono bg-blue-50 text-blue-800 font-semibold px-1.5 py-0.5 rounded">
                        {track.ageBand}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium">{track.gradeLevels}</div>

                    <div className="space-y-1 text-[11px]">
                      <div>
                        <strong className="text-stone-800">Scaffolding:</strong>{' '}
                        <span className="text-stone-600">{track.scaffoldingFocus}</span>
                      </div>
                      <div>
                        <strong className="text-stone-800">Code Tool:</strong>{' '}
                        <span className="text-blue-800 font-mono text-[10px]">{track.programmingPlatform}</span>
                      </div>
                      <div>
                        <strong className="text-stone-800">Hardware:</strong>{' '}
                        <span className="text-stone-600">{track.hardwareFocus}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100">
                      <strong className="text-[10px] text-stone-500 uppercase block mb-1">Key Deliverables:</strong>
                      <div className="flex flex-wrap gap-1">
                        {track.deliverables.map((d, di) => (
                          <span key={di} className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Program Specific Differentiation Notes */}
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-2">
              <span className="font-semibold text-stone-900 block">
                Cohort Differentiation Notes:
              </span>
              <ul className="list-disc list-inside space-y-1.5 text-stone-700 text-xs">
                {currentProgram.teacherGuidance.differentiationNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>

            {/* AI Ethics Rules */}
            <div className="bg-emerald-50/70 p-4 rounded-lg border border-emerald-200 space-y-2">
              <span className="font-semibold text-emerald-950 block">
                WeLearn AI Ethics Principles:
              </span>
              <ul className="list-disc list-inside space-y-1 text-stone-700">
                {currentProgram.teacherGuidance.aiEthicsRules.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NGSS 3D RUBRICS */}
      {activeTab === 'ngss' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs text-xs">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Next Generation Science Standards (NGSS) 3D Rubric Alignment
              </h3>
              <p className="text-stone-500 mt-0.5">
                The Explore phase labs are aligned to NGSS Performance Expectations with 3-dimensional assessment (SEP, DCI, CCC, ETS).
              </p>
            </div>

            <div className="space-y-4">
              {NGSS_ALIGNMENT_ITEMS.map((item) => (
                <div key={item.peCode} className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-emerald-800 text-xs">
                        {item.peCode}
                      </span>
                      <span className="font-semibold text-stone-900 ml-2">
                        {item.peTitle}
                      </span>
                    </div>
                  </div>
                  <p className="text-stone-600 italic">{item.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-stone-200">
                    <div className="p-2 bg-white rounded border border-stone-200">
                      <strong className="text-stone-900 block font-mono text-[11px]">SEP (Science Practice):</strong>
                      <span className="text-stone-600">{item.lookFors.sep}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-stone-200">
                      <strong className="text-stone-900 block font-mono text-[11px]">DCI (Core Idea):</strong>
                      <span className="text-stone-600">{item.lookFors.dci}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-stone-200">
                      <strong className="text-stone-900 block font-mono text-[11px]">CCC (Crosscutting Concept):</strong>
                      <span className="text-stone-600">{item.lookFors.ccc}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-stone-200">
                      <strong className="text-stone-900 block font-mono text-[11px]">ETS (Engineering Design):</strong>
                      <span className="text-stone-600">{item.lookFors.ets}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
