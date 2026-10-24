import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles, BookOpen, Award, Wrench, Leaf, Upload, FileText, CheckCircle2,
  AlertTriangle, Users, Bot, ArrowRight, ExternalLink, Send, ChevronDown, ChevronRight,
  Layers, Video, GitBranch, Box, RefreshCw, Eye, Check, Clock, ShieldCheck, Link2
} from 'lucide-react';
import { STUDENT_2E_PROFILES, getLearnerById } from './learnerProfiles.js';
import { DEFAULT_GROUNDING_SOURCES, calculateTotalTokens } from './groundingSources.js';
import { synthesizeGroundedUnit } from './pblSynthesizer.js';
import { publishAndTransferToStudent } from './pblTransferService.js';
import { LearnerSupervisionView } from '../supervision/LearnerSupervisionView.jsx';
import { EvaluationDeskView } from '../evaluation/EvaluationDeskView.jsx';
import { CourseStudioPanel } from './CourseStudioPanel.jsx';
import { getEvaluations } from '../evaluation/evaluationsStore.js';
import { EdmentumIntegrationConsole } from '../../edmentum/EdmentumIntegrationConsole.jsx';
import { hrefFor } from '../../../app/routes.js';
import { confettiFrom, buzz } from '../../goals/celebrate.js';
import './coachStudio.css';

export function CoachPblStudio({ coachUser, navigate, initialTab = 'supervision' }) {
  // Top-level Navigation Workspace Tab: 'supervision' | 'evaluation' | 'studio'
  const [workspaceTab, setWorkspaceTab] = useState(initialTab);
  const [evalList, setEvalList] = useState(() => getEvaluations());
  const pendingCount = useMemo(() => evalList.filter((e) => e.status === 'pending').length, [evalList]);

  useEffect(() => {
    const onEvalsUpdated = () => setEvalList(getEvaluations());
    window.addEventListener('hearisland-evaluations-updated', onEvalsUpdated);
    return () => window.removeEventListener('hearisland-evaluations-updated', onEvalsUpdated);
  }, []);

  // Column 1 State
  const [sources, setSources] = useState(DEFAULT_GROUNDING_SOURCES);
  const [selectedLearnerId, setSelectedLearnerId] = useState('student-liam-chen');
  const [customFocus, setCustomFocus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const learner = useMemo(() => getLearnerById(selectedLearnerId), [selectedLearnerId]);
  const totalTokens = useMemo(() => calculateTotalTokens(sources), [sources]);
  const activeSourcesCount = useMemo(() => sources.filter((s) => s.active).length, [sources]);

  // Column 2 State (Synthesized Unit & In-line Editor)
  const [unit, setUnit] = useState(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [openMilestoneIndex, setOpenMilestoneIndex] = useState(0);

  // Column 3 State (Transfer Pipeline)
  const [transferring, setTransferring] = useState(false);
  const [transferredInfo, setTransferredInfo] = useState(null);

  // Auto-synthesize initial grounded unit on mount for selected learner
  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      setSynthesizing(true);
      try {
        const initialUnit = await synthesizeGroundedUnit({
          learner,
          sources,
          customFocus: ''
        });
        if (!cancelled) setUnit(initialUnit);
      } catch (err) {
        console.error('Failed synthesizing initial unit:', err);
      } finally {
        if (!cancelled) setSynthesizing(false);
      }
    }
    loadInitial();
    return () => { cancelled = true; };
  }, [selectedLearnerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Source toggle
  const toggleSource = (sourceId) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, active: !s.active } : s))
    );
  };

  // Custom document upload handler
  const handleFileUpload = (files) => {
    if (!files || !files.length) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const estimatedTokens = Math.max(120, Math.round(text.length / 4));
      const newSource = {
        id: `src-custom-${Date.now()}`,
        title: file.name,
        category: 'Custom Upload',
        icon: 'FileText',
        tokenCount: estimatedTokens,
        active: true,
        summary: `Uploaded document (${file.name}, ${(file.size / 1024).toFixed(1)} KB). Grounded for synthesis.`,
        excerpt: text.slice(0, 1500)
      };
      setSources((prev) => [newSource, ...prev]);
    };
    reader.readAsText(file);
  };

  // Synthesize / Re-synthesize unit
  const handleSynthesize = async () => {
    setSynthesizing(true);
    setTransferredInfo(null);
    try {
      const result = await synthesizeGroundedUnit({
        learner,
        sources,
        customFocus
      });
      setUnit(result);
      buzz(15);
    } catch (err) {
      console.error('Synthesis failed:', err);
    } finally {
      setSynthesizing(false);
    }
  };

  // 1-Click Publish & Transfer to Student
  const handleTransfer = async (e) => {
    if (!unit) return;
    setTransferring(true);
    const triggerEl = e.currentTarget;
    try {
      const res = await publishAndTransferToStudent(unit, learner.id, coachUser?.uid);
      setTransferredInfo(res);
      confettiFrom(triggerEl, { big: true });
      buzz([30, 60, 30]);
    } catch (err) {
      console.error('Transfer failed:', err);
    } finally {
      setTransferring(false);
    }
  };

  // In-line edits
  const updateUnitField = (field, value) => {
    setUnit((prev) => ({ ...prev, [field]: value }));
  };

  const updateMilestone = (index, patch) => {
    setUnit((prev) => {
      const milestones = [...prev.milestones];
      milestones[index] = { ...milestones[index], ...patch };
      return { ...prev, milestones };
    });
  };

  return (
    <div className="cp-studio">
      {/* Top Studio Bar */}
      <header className="cp-header">
        <div className="cp-header-left">
          <span className="cp-brand-badge">
            <Sparkles size={14} /> SPARK Studio
          </span>
          <div>
            <h1 className="cp-title">AI PBL Authoring & Mentorship Studio</h1>
            <p className="cp-subtitle">
              NotebookLM-grounded 2e curriculum synthesizer • Instant 1-click student dashboard transfer
            </p>
          </div>
        </div>

        <div className="cp-header-actions">
          <a href="#/coach/dashboard" className="cp-btn-switch">
            <Users size={15} /> Learner Roster
          </a>
          <a href={hrefFor.pbl('programs')} className="cp-btn-switch">
            <Eye size={15} /> Program Library
          </a>
        </div>
      </header>

      {/* Top Navigation Tabs */}
      <nav className="cp-top-nav-bar" aria-label="Coach Workspace Modes">
        <div className="cp-nav-tabs">
          <button
            type="button"
            className={`cp-nav-tab ${workspaceTab === 'supervision' ? 'active' : ''}`}
            onClick={() => setWorkspaceTab('supervision')}
          >
            <Users size={16} /> Learner Supervision
            <span className="cp-tab-pill">4 Active</span>
          </button>

          <button
            type="button"
            className={`cp-nav-tab ${workspaceTab === 'evaluation' ? 'active' : ''}`}
            onClick={() => setWorkspaceTab('evaluation')}
          >
            <CheckCircle2 size={16} /> Evaluation Desk
            <span className="cp-tab-pill pill-amber">
              {pendingCount > 0 && <span className="cp-tab-pulse-dot" />}
              {pendingCount} Pending
            </span>
          </button>

          <button
            type="button"
            className={`cp-nav-tab ${workspaceTab === 'studio' ? 'active' : ''}`}
            onClick={() => setWorkspaceTab('studio')}
          >
            <Sparkles size={16} /> Curriculum Studio (NotebookLM)
            <span className="cp-tab-pill">AI Authoring</span>
          </button>

          <button
            type="button"
            className={`cp-nav-tab ${workspaceTab === 'edmentum' ? 'active' : ''}`}
            onClick={() => setWorkspaceTab('edmentum')}
          >
            <Link2 size={16} /> Edmentum LTI 1.3
            <span className="cp-tab-pill" style={{ color: '#7ee787', background: 'rgba(46, 160, 67, 0.15)' }}>
              LTI 1.3 Ready
            </span>
          </button>
        </div>
      </nav>

      {/* Tab 1: Learner Supervision */}
      {workspaceTab === 'supervision' && (
        <LearnerSupervisionView
          onSelectLearnerForStudio={(learnerId) => {
            setSelectedLearnerId(learnerId);
            setWorkspaceTab('studio');
          }}
          onGoToEvaluation={() => {
            setWorkspaceTab('evaluation');
          }}
        />
      )}

      {/* Tab 2: Evaluation Desk */}
      {workspaceTab === 'evaluation' && (
        <EvaluationDeskView
          coachUser={coachUser}
          onOpenStudioWithLearner={(learnerId) => {
            setSelectedLearnerId(learnerId);
            setWorkspaceTab('studio');
          }}
        />
      )}

      {/* Tab 3: Curriculum Studio (NotebookLM 3-Column Studio Grid) */}
      {workspaceTab === 'studio' && (
        <div className="cp-grid">
        {/* =========================================================
            COLUMN 1: Knowledge Grounding Vault (NotebookLM Source Panel)
           ========================================================= */}
        <section className="cp-col cp-col-vault" aria-label="Knowledge Grounding Vault">
          {/* Grounding Vault Status */}
          <div className="cp-card">
            <div className="cp-card-header">
              <h2 className="cp-card-title">
                <BookOpen size={16} /> Grounding Vault
              </h2>
              <span className="cp-badge-pill">NotebookLM Mode</span>
            </div>

            <div className="cp-vault-status">
              <span className="cp-vault-indicator">
                <span className="cp-pulse-dot" /> {activeSourcesCount} Sources Grounded
              </span>
              <span>{totalTokens.toLocaleString()} tokens indexed</span>
      {workspaceTab === 'studio' && <CourseStudioPanel />}
            </div>

            {/* Document Dropzone */}
            <div
              className={`cp-dropzone ${dragOver ? 'dragover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={22} />
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.csv"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <p className="cp-dropzone-text">Drop reference docs or click to upload</p>
              <p className="cp-dropzone-sub">Standards (Cambridge/NGSS), MakerSpace sheets, briefs</p>
            </div>

            {/* Active Grounding Sources List */}
            <ul className="cp-source-list" aria-label="Grounding reference sources">
              {sources.map((s) => (
                <li key={s.id} className={`cp-source-item ${s.active ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    className="cp-source-check"
                    checked={s.active}
                    onChange={() => toggleSource(s.id)}
                    id={`source-${s.id}`}
                  />
                  <div className="cp-source-info">
                    <label htmlFor={`source-${s.id}`} className="cp-source-title">
                      <span>{s.title}</span>
                      <span className="cp-source-tokens">{s.tokenCount.toLocaleString()} tkn</span>
                    </label>
                    <p className="cp-source-desc">{s.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Student 2e Profile Selector */}
          <div className="cp-card">
            <div className="cp-card-header">
              <h2 className="cp-card-title">
                <Users size={16} /> Student 2e Profile
              </h2>
              <span className="cp-badge-pill">Adaptive Scaffolding</span>
            </div>

            <label htmlFor="learner-picker" className="cp-label">Select Twice-Exceptional Learner</label>
            <select
              id="learner-picker"
              className="cp-learner-select"
              value={selectedLearnerId}
              onChange={(e) => setSelectedLearnerId(e.target.value)}
            >
              {STUDENT_2E_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.avatar} {p.name} ({p.grade}) — {p.traitBadges[0]}
                </option>
              ))}
            </select>

            {/* Selected Profile Detail Box */}
            <div className="cp-profile-box">
              <div className="cp-profile-header">
                <span className="cp-profile-avatar">{learner.avatar}</span>
                <div>
                  <h3 className="cp-profile-name">{learner.name}</h3>
                  <p className="cp-profile-grade">{learner.grade} • {learner.cohort}</p>
                </div>
              </div>

              {/* Diagnosis / Traits */}
              <div className="cp-tag-group">
                <span className="cp-tag-label">Cognitive Profile & Diagnosis:</span>
                <div className="cp-tag-chips">
                  {learner.traitBadges.map((badge) => (
                    <span key={badge} className="cp-chip cp-chip-trait">{badge}</span>
                  ))}
                </div>
              </div>

              {/* Consuming Passions */}
              <div className="cp-tag-group">
                <span className="cp-tag-label">Consuming Passions:</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#f0f6fc', fontWeight: 600 }}>
                  {learner.consumingPassions}
                </p>
              </div>

              {/* Executive Function Hurdles */}
              <div className="cp-tag-group">
                <span className="cp-tag-label">Executive Function Hurdles:</span>
                <div className="cp-tag-chips">
                  {learner.hurdleBadges.map((badge) => (
                    <span key={badge} className="cp-chip cp-chip-hurdle">{badge}</span>
                  ))}
                </div>
              </div>

              {/* Applied Accommodations */}
              <div className="cp-tag-group">
                <span className="cp-tag-label">Applied Accommodations:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {learner.appliedAccommodations.map((accom, idx) => (
                    <span key={idx} className="cp-chip cp-chip-accom">
                      <ShieldCheck size={13} /> {accom}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            COLUMN 2: Grounded AI Generator & In-line Editor
           ========================================================= */}
        <section className="cp-col cp-col-editor" aria-label="Grounded AI Generator and In-line Editor">
          {/* Synthesizer Control Strip */}
          <div className="cp-synthesize-strip">
            <div className="cp-synthesize-text">
              <h3>Gemini 2e PBL Unit Synthesizer</h3>
              <p>Generates structured Driving Question, 8-stage milestones, MakerSpace specs & Coach cues.</p>
            </div>
            <button
              type="button"
              className="cp-btn-synthesize"
              onClick={handleSynthesize}
              disabled={synthesizing}
            >
              {synthesizing ? (
                <>
                  <RefreshCw size={16} className="spin" /> Grounding Curriculum...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Synthesize for {learner.name.split(' ')[0]}
                </>
              )}
            </button>
          </div>

          {unit && (
            <>
              {/* Driving Question In-line Editor Banner */}
              <div className="cp-dq-banner">
                <span className="cp-dq-kicker">
                  <Sparkles size={13} /> Grounded Driving Question (Editable)
                </span>
                <textarea
                  className="cp-dq-input"
                  rows={2}
                  value={unit.drivingQuestion}
                  onChange={(e) => updateUnitField('drivingQuestion', e.target.value)}
                  placeholder="Enter driving question..."
                  aria-label="Driving Question"
                />
              </div>

              {/* Unit Title and Theme In-line Editor */}
              <div className="cp-card">
                <div className="cp-meta-row">
                  <div className="cp-input-group">
                    <label className="cp-label">Unit Title</label>
                    <input
                      type="text"
                      className="cp-input"
                      value={unit.unitTitle}
                      onChange={(e) => updateUnitField('unitTitle', e.target.value)}
                    />
                  </div>
                  <div className="cp-input-group">
                    <label className="cp-label">Theme / Domain</label>
                    <input
                      type="text"
                      className="cp-input"
                      value={unit.theme}
                      onChange={(e) => updateUnitField('theme', e.target.value)}
                    />
                  </div>
                </div>

                {/* Real Problem Impact Framing */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <div className="cp-input-group">
                    <label className="cp-label" style={{ color: '#e3b341' }}>For People (Impact)</label>
                    <textarea
                      className="cp-input"
                      rows={2}
                      value={unit.realProblem.peopleImpact}
                      onChange={(e) =>
                        updateUnitField('realProblem', { ...unit.realProblem, peopleImpact: e.target.value })
                      }
                    />
                  </div>
                  <div className="cp-input-group">
                    <label className="cp-label" style={{ color: '#3fb950' }}>For Environment (Impact)</label>
                    <textarea
                      className="cp-input"
                      rows={2}
                      value={unit.realProblem.environmentalImpact}
                      onChange={(e) =>
                        updateUnitField('realProblem', { ...unit.realProblem, environmentalImpact: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 8-Stage PBL Cycle Milestones In-line Editor */}
              <div className="cp-card">
                <div className="cp-card-header">
                  <h3 className="cp-card-title">
                    <Layers size={16} /> WeLearn 8-Stage PBL Cycle (Curiosity ➔ Showcase)
                  </h3>
                  <span className="cp-badge-pill">8 Milestones</span>
                </div>

                <div className="cp-milestone-list">
                  {unit.milestones.map((m, idx) => {
                    const isOpen = openMilestoneIndex === idx;
                    return (
                      <div key={m.id} className={`cp-milestone-card ${isOpen ? 'open' : ''}`}>
                        <div
                          className="cp-milestone-head"
                          onClick={() => setOpenMilestoneIndex(isOpen ? -1 : idx)}
                        >
                          <div className="cp-milestone-head-left">
                            <span className="cp-stage-num">{m.stageNumber}</span>
                            <div>
                              <span className="cp-stage-title-text">{m.title}</span>
                              <span className="cp-stage-meta">Week {m.week} • {m.durationMin}m • {m.stageName}</span>
                            </div>
                          </div>
                          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>

                        {isOpen && (
                          <div className="cp-milestone-body">
                            {/* Milestone Title & Goal */}
                            <div className="cp-input-group">
                              <label className="cp-label">Milestone Title</label>
                              <input
                                type="text"
                                className="cp-input"
                                value={m.title}
                                onChange={(e) => updateMilestone(idx, { title: e.target.value })}
                              />
                            </div>

                            <div className="cp-input-group">
                              <label className="cp-label">Learning Goal</label>
                              <textarea
                                className="cp-input"
                                rows={2}
                                value={m.learningGoal}
                                onChange={(e) => updateMilestone(idx, { learningGoal: e.target.value })}
                              />
                            </div>

                            {/* Checklist Activities */}
                            <div className="cp-input-group">
                              <label className="cp-label">Milestone Checklist Activities</label>
                              <ul className="cp-activities-list">
                                {m.activities.map((act, actIdx) => (
                                  <li key={actIdx} className="cp-activity-item">
                                    <CheckCircle2 size={15} style={{ color: '#3fb950', flexShrink: 0 }} />
                                    <input
                                      type="text"
                                      className="cp-input"
                                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                                      value={act}
                                      onChange={(e) => {
                                        const newActs = [...m.activities];
                                        newActs[actIdx] = e.target.value;
                                        updateMilestone(idx, { activities: newActs });
                                      }}
                                    />
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* MakerSpace Tools Assigned */}
                            <div className="cp-input-group">
                              <label className="cp-label">MakerSpace Tools Assigned</label>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {m.makerSpaceTools.map((tool, tIdx) => (
                                  <span key={tIdx} className="cp-chip cp-chip-trait" style={{ fontSize: '0.75rem' }}>
                                    <Wrench size={11} style={{ marginRight: '0.25rem' }} /> {tool}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Coach Daily Intervention Cue */}
                            <div className="cp-cue-box">
                              <span className="cp-cue-title">
                                <Bot size={13} /> {unit.coachCues.leadCoach} Intervention Cue
                              </span>
                              <textarea
                                className="cp-input"
                                rows={2}
                                style={{ background: 'transparent', borderColor: 'rgba(163,113,247,0.4)', fontSize: '0.8rem' }}
                                value={m.coachCue}
                                onChange={(e) => updateMilestone(idx, { coachCue: e.target.value })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MakerSpace Lab Specs */}
              <div className="cp-card">
                <div className="cp-card-header">
                  <h3 className="cp-card-title">
                    <Wrench size={16} /> MakerSpace Tool Specifications
                  </h3>
                  <span className="cp-badge-pill">Fab Lab Protocol</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {unit.makerSpaceSpecs.map((spec, sIdx) => (
                    <div key={sIdx} className="cp-makerspace-spec-item">
                      <span className="cp-spec-type">{spec.toolType}</span>
                      <p className="cp-spec-details"><strong>Specs:</strong> {spec.specs}</p>
                      <p className="cp-spec-details" style={{ color: '#d29922' }}>
                        <strong>Safety:</strong> {spec.safetyGuidelines}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* =========================================================
            COLUMN 3: Preview & Transfer Pipeline
           ========================================================= */}
        <section className="cp-col cp-col-preview" aria-label="Preview and Transfer Pipeline">
          <div className="cp-card" style={{ height: '100%' }}>
            <div className="cp-card-header">
              <h2 className="cp-card-title">
                <Eye size={16} /> Live Student Dashboard Preview
              </h2>
              <span className="cp-badge-pill" style={{ background: 'rgba(63, 185, 80, 0.15)', color: '#3fb950', borderColor: 'rgba(63, 185, 80, 0.4)' }}>
                Target: {learner.name}
              </span>
            </div>

            {unit && (
              <div className="cp-preview-box">
                {/* Simulated Student Hero */}
                <div className="cp-preview-hero">
                  <span className="cp-preview-kicker">Active PBL Program</span>
                  <h3 className="cp-preview-title">{unit.unitTitle}</h3>
                  <p className="cp-preview-dq">"{unit.drivingQuestion}"</p>
                </div>

                {/* 8-Stage Cycle Progress Strip */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#8b949e', marginBottom: '0.35rem' }}>
                    <span>8-Stage Cycle</span>
                    <span>Stage 1 of 8: Curiosity</span>
                  </div>
                  <ul className="cp-cycle-strip">
                    {unit.milestones.map((m, i) => (
                      <li key={m.id} className={`cp-cycle-step ${i === 0 ? 'current' : ''}`} title={m.stageName} />
                    ))}
                  </ul>
                </div>

                {/* Active Milestone Simulation Card */}
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#58a6ff', textTransform: 'uppercase' }}>
                      Next Up: Stage 1
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#8b949e' }}>Week 1 • 90 min</span>
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                    {unit.milestones[0].title}
                  </h4>
                  <p style={{ margin: '0 0 0.65rem', fontSize: '0.78rem', color: '#8b949e', lineHeight: 1.35 }}>
                    {unit.milestones[0].learningGoal}
                  </p>

                  {/* Multi-Modal Submissions Preview */}
                  <div className="cp-submission-triggers">
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c9d1d9', textTransform: 'uppercase' }}>
                      Multi-Modal Submission Options:
                    </span>
                    <div className="cp-trigger-pill">
                      <Video size={14} /> 60-Second Video Pitch / Demo
                    </div>
                    <div className="cp-trigger-pill">
                      <GitBranch size={14} /> GitHub Firmware Repository Link
                    </div>
                    <div className="cp-trigger-pill">
                      <Box size={14} /> Physical Prototype MakerSpace Bench Register
                    </div>
                  </div>
                </div>

                {/* MakerSpace Assigned Quick Specs */}
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '0.75rem', fontSize: '0.75rem', color: '#8b949e' }}>
                  <div style={{ fontWeight: 700, color: '#c9d1d9', marginBottom: '0.25rem' }}>
                    🛠️ MakerSpace Gear:
                  </div>
                  {unit.makerSpaceSpecs.slice(0, 2).map((s, idx) => (
                    <div key={idx}>• {s.toolType}: {s.specs.slice(0, 50)}...</div>
                  ))}
                </div>
              </div>
            )}

            {/* 1-Click Transfer Section */}
            <div className="cp-transfer-section">
              {transferredInfo && (
                <div className="cp-transferred-toast">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> Transferred Successfully!
                  </div>
                  <span>
                    Active in <strong>{learner.name}'s</strong> dashboard. Real-time updates emitted to <code>#/pbl/programs/{transferredInfo.programId}</code>.
                  </span>
                  <a
                    href={transferredInfo.studentUrl}
                    className="cp-btn-student-view"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Student View <ExternalLink size={14} />
                  </a>
                </div>
              )}

              <button
                type="button"
                className={`cp-btn-transfer ${transferredInfo ? 'success' : ''}`}
                onClick={handleTransfer}
                disabled={transferring || !unit}
              >
                {transferring ? (
                  <>
                    <RefreshCw size={18} className="spin" /> Publishing to Database...
                  </>
                ) : (
                  <>
                    <Send size={18} /> Publish & Transfer to {learner.name.split(' ')[0]}
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
        </div>
      )}

      {/* Tab 4: Edmentum LTI 1.3 Advantage & Rostering Hub */}
      {workspaceTab === 'edmentum' && (
        <EdmentumIntegrationConsole coachUser={coachUser} />
      )}
    </div>
  );
}
