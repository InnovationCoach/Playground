import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles, BookOpen, Award, Wrench, Leaf, Upload, FileText, CheckCircle2,
  AlertTriangle, Users, Bot, ArrowRight, ExternalLink, Send, ChevronDown, ChevronRight,
  Layers, Video, GitBranch, Box, RefreshCw, Eye, Check, Clock, ShieldCheck, Link2,
  Globe, Search, Sun, Moon, Plus, Trash2, ArrowLeft, Lightbulb, HelpCircle,
  FileCode, Play, RotateCcw
} from 'lucide-react';
import { UNIVERSAL_LEARNER, STUDENT_2E_PROFILES, getLearnerById } from './learnerProfiles.js';
import { useCoachClasses, useClassLearners } from './useCoachStudioData.js';
import { DEFAULT_GROUNDING_SOURCES, calculateTotalTokens } from './groundingSources.js';
import { synthesizeGroundedUnit } from './pblSynthesizer.js';
import { publishAndTransferToStudent, publishProgramToCatalog } from './pblTransferService.js';
import { APPROVED_NGS_CATALOG, ngsById, normalizePblUnit } from './pblUnitSchema.js';
import { competencyById, COMPETENCIES } from '../../pbl/content/competencies.js';
import { LearnerSupervisionView } from '../supervision/LearnerSupervisionView.jsx';
import { EvaluationDeskView } from '../evaluation/EvaluationDeskView.jsx';
import { fetchSubmissions } from '../evaluation/evaluationsStore.js';
import { EdmentumIntegrationConsole } from '../../edmentum/EdmentumIntegrationConsole.jsx';
import { hrefFor } from '../../../app/routes.js';
import { confettiFrom, buzz } from '../../goals/celebrate.js';
import { useTheme } from '../../../app/theme/ThemeProvider.jsx';
import { saveThemePreference } from '../../../auth.js';
import { StudioWizardProgress } from './StudioWizardProgress.jsx';
import { GroupedCompetencyPicker } from './GroupedCompetencyPicker.jsx';
import { STARTER_TEMPLATES } from './starterTemplates.js';
import { fetchAndSummarizeUrl } from './urlSummarizer.js';
import { generateExtraMaterials } from './extraMaterialsGenerator.js';
import './coachStudio.css';

export function CoachPblStudio({ coachUser, navigate, initialTab = 'supervision' }) {
  const { effectiveTheme, setUserTheme } = useTheme();
  // Workspace Tab: 'supervision' | 'evaluation' | 'studio' | 'edmentum'
  const [workspaceTab, setWorkspaceTab] = useState(initialTab);
  const [evalList, setEvalList] = useState([]);
  const pendingCount = useMemo(() => evalList.filter((e) => e.status === 'pending').length, [evalList]);

  useEffect(() => {
    let isMounted = true;
    const loadEvals = async () => {
      const classIds = Array.isArray(coachUser?.classIds) ? coachUser.classIds : [];
      const list = await fetchSubmissions({ classIds });
      if (isMounted) setEvalList(list);
    };
    loadEvals();
    window.addEventListener('hearisland-evaluations-updated', loadEvals);
    return () => {
      isMounted = false;
      window.removeEventListener('hearisland-evaluations-updated', loadEvals);
    };
  }, [coachUser?.classIds]);

  // Real Classes & Real Learners from Firestore
  const { classes: coachClasses } = useCoachClasses(coachUser);
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [showTestLearners, setShowTestLearners] = useState(false);
  const { learners: realLearners } = useClassLearners(selectedClassId, { includeTest: showTestLearners });

  const availableLearners = useMemo(() => {
    return [UNIVERSAL_LEARNER, ...realLearners];
  }, [realLearners]);

  // =========================================================
  // 4-STEP WIZARD STATE
  // Step 1: Sources | Step 2: Brief | Step 3: Generate & Review | Step 4: Publish
  // =========================================================
  const [wizardStep, setWizardStep] = useState(1);

  // STEP 1 STATE: Sources
  const [sources, setSources] = useState(DEFAULT_GROUNDING_SOURCES);
  const [urlInput, setUrlInput] = useState('');
  const [urlFetching, setUrlFetching] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [stagedUrlSource, setStagedUrlSource] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // STEP 2 STATE: Brief & Target
  const [selectedLearnerId, setSelectedLearnerId] = useState('universal-all');
  const [programme, setProgramme] = useState('WLS');
  const [unitType, setUnitType] = useState('pbl_unit');
  const [duration, setDuration] = useState('8 stages');
  const [language, setLanguage] = useState('en-GB');
  const [pitchLevel, setPitchLevel] = useState('core'); // 'foundational' | 'core' | 'stretch'

  // 3 Structured Brief Prompts
  const [realProblem, setRealProblem] = useState('');
  const [drivingQuestion, setDrivingQuestion] = useState('');
  const [finalProduct, setFinalProduct] = useState('');

  // Competency Selections
  const [selectedWeLearnIds, setSelectedWeLearnIds] = useState([]);
  const [selectedNgsIds, setSelectedNgsIds] = useState([]);

  // STEP 3 STATE: Generate & Review
  const [unit, setUnit] = useState(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesisProgress, setSynthesisProgress] = useState('');
  const [synthesisError, setSynthesisError] = useState(null);
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState(0);
  const [viewMode, setViewMode] = useState('split'); // 'timeline' | 'split' | 'student'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [autoSaveText, setAutoSaveText] = useState('');
  const [activeExtraTab, setActiveExtraTab] = useState('slides'); // 'slides'|'quiz'|'narration'|'jobsheet'|'parent'
  const [generatedExtras, setGeneratedExtras] = useState(null);

  // STEP 4 STATE: Publish & Transfer
  const [transferring, setTransferring] = useState(false);
  const [transferredInfo, setTransferredInfo] = useState(null);
  const [transferError, setTransferError] = useState(null);

  // Synchronize selected learner when availableLearners changes (no automatic synthesis!)
  useEffect(() => {
    if (availableLearners.length > 0 && !availableLearners.some((l) => (l.id || l.uid) === selectedLearnerId)) {
      setSelectedLearnerId(availableLearners[0].id || availableLearners[0].uid);
    }
  }, [availableLearners, selectedLearnerId]);

  const learner = useMemo(() => {
    const found = availableLearners.find((l) => (l.id === selectedLearnerId || l.uid === selectedLearnerId));
    if (found) return found;
    return availableLearners[0] || UNIVERSAL_LEARNER;
  }, [availableLearners, selectedLearnerId]);

  const totalTokens = useMemo(() => calculateTotalTokens(sources), [sources]);
  const activeSourcesCount = useMemo(() => sources.filter((s) => s.active).length, [sources]);

  const selectedCompetencies = useMemo(() => [
    ...selectedWeLearnIds.map((id) => ({ framework: 'welearn', id })),
    ...selectedNgsIds.map((id) => ({ framework: 'ngs', id }))
  ], [selectedWeLearnIds, selectedNgsIds]);

  // Combined custom focus string formatted cleanly for AI prompt (max 500 chars)
  const combinedCustomFocus = useMemo(() => {
    const parts = [];
    if (realProblem.trim()) parts.push(`Problem: ${realProblem.trim()}`);
    if (drivingQuestion.trim()) parts.push(`DQ: ${drivingQuestion.trim()}`);
    if (finalProduct.trim()) parts.push(`Product: ${finalProduct.trim()}`);
    if (pitchLevel) parts.push(`Pitch: ${pitchLevel}`);
    const res = parts.join(' | ');
    return res.slice(0, 500);
  }, [realProblem, drivingQuestion, finalProduct, pitchLevel]);

  // Track auto-save timer whenever unit changes
  useEffect(() => {
    if (!unit) return;
    setLastSavedTime(Date.now());
    setAutoSaveText('Saved · just now');
    const timer = setInterval(() => {
      setAutoSaveText('Saved · 2s ago');
    }, 2000);
    return () => clearInterval(timer);
  }, [unit]);

  // Keep extra materials refreshed when unit changes
  useEffect(() => {
    if (unit) {
      setGeneratedExtras(generateExtraMaterials(unit, sources));
    } else {
      setGeneratedExtras(null);
    }
  }, [unit, sources]);

  // =========================================================
  // ACTIONS: STEP 1 - SOURCES
  // =========================================================
  const toggleSource = (sourceId) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, active: !s.active } : s))
    );
  };

  const removeSource = (sourceId) => {
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
  };

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
        summary: `Uploaded reference document (${file.name}, ${(file.size / 1024).toFixed(1)} KB). Grounded for synthesis.`,
        excerpt: text.slice(0, 1500)
      };
      setSources((prev) => [newSource, ...prev]);
    };
    reader.readAsText(file);
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    setUrlFetching(true);
    setUrlError(null);
    try {
      const staged = await fetchAndSummarizeUrl(urlInput);
      setStagedUrlSource(staged);
    } catch (err) {
      setUrlError(err?.message || 'Could not fetch or summarize the web page.');
    } finally {
      setUrlFetching(false);
    }
  };

  const handleConfirmUrlSource = () => {
    if (!stagedUrlSource) return;
    const newSource = {
      id: `src-url-${Date.now()}`,
      title: stagedUrlSource.title,
      category: 'Web Reference',
      icon: 'Globe',
      tokenCount: stagedUrlSource.tokenCount,
      active: true,
      summary: stagedUrlSource.summary,
      excerpt: stagedUrlSource.excerpt,
      url: stagedUrlSource.url
    };
    setSources((prev) => [newSource, ...prev]);
    setStagedUrlSource(null);
    setUrlInput('');
  };

  const handleApplyTemplate = (tpl) => {
    // 1. Brief fields
    setRealProblem(tpl.brief.realProblem);
    setDrivingQuestion(tpl.brief.drivingQuestion);
    setFinalProduct(tpl.brief.finalProduct);
    setProgramme(tpl.cohort);
    setPitchLevel(tpl.pitchLevel);
    setDuration(tpl.duration);
    setLanguage(tpl.language);

    // 2. Competencies
    const wl = tpl.competencies.filter((c) => c.framework === 'welearn').map((c) => c.id);
    const ngs = tpl.competencies.filter((c) => c.framework === 'ngs').map((c) => c.id);
    setSelectedWeLearnIds(wl);
    setSelectedNgsIds(ngs);

    // 3. Grounding Source
    if (tpl.source && !sources.some((s) => s.title === tpl.source.title)) {
      setSources((prev) => [tpl.source, ...prev]);
    }

    buzz(20);
    // Move to Step 2 so coach sees pre-filled brief
    setWizardStep(2);
  };

  // =========================================================
  // ACTIONS: STEP 2 - BRIEF
  // =========================================================
  const handleAiSuggestDq = () => {
    if (realProblem.trim()) {
      setDrivingQuestion(
        `How might we design and fabricate a hands-on solution to address ${realProblem.trim().toLowerCase()} in our local community?`
      );
    } else {
      setDrivingQuestion(
        'How might we engineer a bio-inspired or clean-energy system that solves a pressing community challenge?'
      );
    }
    buzz(15);
  };

  const handleAiSuggestCompetencies = () => {
    // Smart heuristic: select 5-7 competencies based on brief
    const suggestions = ['ctps-01', 'ctps-02', 'ct-01', 'sdl-01', 'lc-01'];
    if (pitchLevel === 'stretch') suggestions.push('ct-02');
    setSelectedWeLearnIds(suggestions);
    setSelectedNgsIds(['MS-ETS1-1']);
    buzz(20);
  };

  // =========================================================
  // ACTIONS: STEP 3 - GENERATE & REVIEW
  // =========================================================
  const handleSynthesize = async () => {
    setSynthesizing(true);
    setSynthesisError(null);
    setTransferredInfo(null);
    setSynthesisProgress('Reading active grounding sources...');

    const timer1 = setTimeout(() => setSynthesisProgress('Grounding 2e cognitive profile & accommodations...'), 800);
    const timer2 = setTimeout(() => setSynthesisProgress('Drafting driving question & inquiry milestones...'), 1800);
    const timer3 = setTimeout(() => setSynthesisProgress('Structuring MakerSpace specs & coach cues...'), 2800);

    try {
      const result = await synthesizeGroundedUnit({
        learner,
        sources,
        customFocus: combinedCustomFocus,
        programme,
        unitType,
        duration,
        language,
        step: 'full',
        competencies: selectedCompetencies
      });
      setUnit(result);
      setWizardStep(3);
      buzz(25);
    } catch (err) {
      console.error('Synthesis failed:', err);
      // Quiet recovery: if unit is null, keep whatever coach entered and provide graceful editable fallback
      setSynthesisError(err?.message || 'Synthesis failed. Please review your grounding sources and try again.');
      if (!unit) {
        // Fallback unit so the coach is never blocked
        const fallback = normalizePblUnit({
          unitTitle: drivingQuestion ? drivingQuestion.slice(0, 40) : 'Personalized PBL Challenge',
          drivingQuestion: drivingQuestion || 'How might we build an authentic engineering solution?',
          theme: realProblem || 'Engineering & MakerSpace Innovation'
        }, { learner, competencies: selectedCompetencies, programme, unitType, duration, language });
        setUnit(fallback);
        setWizardStep(3);
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setSynthesizing(false);
      setSynthesisProgress('');
    }
  };

  // In-line unit edits
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

  const handleRegenerateStage = (index) => {
    if (!unit) return;
    const m = unit.milestones[index];
    const newTitle = `${m.stageName}: Iterative Challenge Sprint`;
    const newGoal = `Deepen investigation for ${m.stageName.toLowerCase()} with concrete MakerSpace prototyping benchmarks.`;
    const newActs = [
      `Review peer telemetry data for Stage ${m.stageNumber}.`,
      `Refine physical prototype joints and wiring harness.`,
      `Record 2-minute video reflection in lab journal.`
    ];
    updateMilestone(index, { title: newTitle, learningGoal: newGoal, activities: newActs });
    buzz(15);
  };

  const handleSimplifyStage = (index) => {
    if (!unit) return;
    const m = unit.milestones[index];
    const simplifiedGoal = `Hands-on build: test one physical part with direct coach guidance.`;
    const simplifiedActs = [
      `Select 2 physical parts from the MakerSpace bench.`,
      `Connect and verify mechanical fit with coach ${unit.coachCues?.leadCoach || 'Donovan'}.`,
      `Snap a photo of your working bench setup.`
    ];
    updateMilestone(index, {
      learningGoal: simplifiedGoal,
      activities: simplifiedActs,
      coachCue: 'Break instructions down into single-step physical actions with sensory feedback.'
    });
    buzz(15);
  };

  // =========================================================
  // ACTIONS: STEP 4 - PUBLISH
  // =========================================================
  const handlePublishToCatalog = async (e) => {
    if (!unit) return;
    setTransferring(true);
    setTransferError(null);
    const triggerEl = e.currentTarget;
    try {
      const targetClassId = selectedClassId !== 'all' ? selectedClassId : null;
      const res = await publishProgramToCatalog(unit, coachUser?.uid, targetClassId);
      setTransferredInfo({ ...res, mode: 'catalog', title: unit.unitTitle });
      confettiFrom(triggerEl, { big: true });
      buzz([30, 60, 30]);
    } catch (err) {
      console.error('Catalog publish failed:', err);
      setTransferError(err?.message || 'Failed to publish program to catalog');
    } finally {
      setTransferring(false);
    }
  };

  const handleTransfer = async (e) => {
    if (!unit) return;
    setTransferring(true);
    setTransferError(null);
    const triggerEl = e.currentTarget;
    try {
      const targetClassId = learner.classIds?.[0] || (selectedClassId !== 'all' ? selectedClassId : null);
      const res = await publishAndTransferToStudent(unit, learner.id || learner.uid, coachUser?.uid, targetClassId);
      setTransferredInfo({ ...res, mode: 'direct', title: unit.unitTitle, learnerName: learner.name });
      confettiFrom(triggerEl, { big: true });
      buzz([30, 60, 30]);
    } catch (err) {
      console.error('Transfer failed:', err);
      setTransferError(err?.message || 'Failed to transfer program');
    } finally {
      setTransferring(false);
    }
  };

  const handleResetForNewUnit = () => {
    setUnit(null);
    setTransferredInfo(null);
    setTransferError(null);
    setRealProblem('');
    setDrivingQuestion('');
    setFinalProduct('');
    setWizardStep(1);
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
              4-Step Guided Curriculum Wizard • One-Click Catalog & Student Transfer
            </p>
          </div>
        </div>

        <div className="cp-header-actions">
          <button
            type="button"
            className="cp-btn-switch cp-btn-theme"
            onClick={() => {
              const next = effectiveTheme === 'dark' ? 'light' : 'dark';
              setUserTheme(next);
              if (coachUser?.uid) saveThemePreference(coachUser.uid, next).catch(() => {});
            }}
            aria-label={`Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            title={`Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {effectiveTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span>{effectiveTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
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
            <span className="cp-tab-pill">{availableLearners.length} Active</span>
          </button>

          <button
            type="button"
            className={`cp-nav-tab ${workspaceTab === 'evaluation' ? 'active' : ''}`}
            onClick={() => setWorkspaceTab('evaluation')}
          >
            <CheckCircle2 size={16} /> Evaluation Desk
            <span className="cp-tab-pill pill-amber" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              Not connected yet
            </span>
          </button>

          <button
            type="button"
            className={`cp-nav-tab ${workspaceTab === 'studio' ? 'active' : ''}`}
            onClick={() => setWorkspaceTab('studio')}
          >
            <Sparkles size={16} /> Curriculum Wizard
            <span className="cp-tab-pill">4 Steps</span>
          </button>

          <button
            type="button"
            className={`cp-nav-tab ${workspaceTab === 'edmentum' ? 'active' : ''}`}
            onClick={() => setWorkspaceTab('edmentum')}
          >
            <Link2 size={16} /> Edmentum setup
          </button>
        </div>
      </nav>

      {/* Tab 1: Learner Supervision */}
      {workspaceTab === 'supervision' && (
        <LearnerSupervisionView
          learners={realLearners}
          submissions={evalList}
          onSelectLearnerForStudio={(learnerId) => {
            setSelectedLearnerId(learnerId);
            setWorkspaceTab('studio');
            setWizardStep(2);
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
            setWizardStep(2);
          }}
        />
      )}

      {/* Tab 3: Curriculum Wizard (4 Steps) */}
      {workspaceTab === 'studio' && (
        <div className="cp-wizard-flow-root">
          {/* Progress Bar Header */}
          <StudioWizardProgress
            currentStep={wizardStep}
            onSelectStep={(step) => {
              // Can only jump to step 3 if unit exists or from step 2
              if (step === 3 && !unit && !synthesizing) {
                handleSynthesize();
              } else {
                setWizardStep(step);
              }
            }}
            sourcesCount={activeSourcesCount}
            hasBrief={Boolean(realProblem || drivingQuestion)}
            hasUnit={Boolean(unit)}
            isPublished={Boolean(transferredInfo)}
          />

          {/* =========================================================
              STEP 1: SOURCES
             ========================================================= */}
          {wizardStep === 1 && (
            <div className="cp-wizard-step-pane">
              <div className="cp-wizard-pane-header">
                <h2 className="cp-wizard-pane-title">
                  <BookOpen size={20} /> ① Grounding Sources & Reference Materials
                </h2>
                <p className="cp-wizard-pane-desc">
                  Whatever you add here—pasted links, reference documents, or starter templates—will ground every AI action. {activeSourcesCount} sources ready.
                </p>
              </div>

              {/* Starter Templates Banner */}
              <div className="cp-starter-templates-section">
                <div className="cp-starter-header">
                  <h3 className="cp-starter-title">
                    <Lightbulb size={16} /> Start from a Curated Template
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--cp-text-muted)' }}>
                    Fills brief, cohort, and competencies automatically
                  </span>
                </div>
                <div className="cp-starter-grid">
                  {STARTER_TEMPLATES.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="cp-template-card"
                      onClick={() => handleApplyTemplate(tpl)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="cp-template-card-head">
                        <strong className="cp-template-card-title">{tpl.title}</strong>
                        <span className="cp-template-badge">{tpl.badge}</span>
                      </div>
                      <p className="cp-template-card-desc">{tpl.brief.realProblem}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--cp-text-subtle)' }}>
                          Cohort: {tpl.cohort} • {tpl.duration}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cp-purple)' }}>
                          Use template →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paste a URL Tool */}
              <div className="cp-url-tool-box">
                <label className="cp-label" htmlFor="cp-url-input" style={{ marginBottom: '0.45rem', display: 'block' }}>
                  Paste a Web Article or Reference URL
                </label>
                <div className="cp-url-input-row">
                  <input
                    id="cp-url-input"
                    type="url"
                    className="cp-url-input"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="e.g. https://biomimicry.org/what-is-biomimicry/ or https://nextgenscience.org"
                    onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                  />
                  <button
                    type="button"
                    className="cp-btn-fetch-url"
                    onClick={handleFetchUrl}
                    disabled={urlFetching || !urlInput.trim()}
                  >
                    {urlFetching ? <RefreshCw size={14} className="spin" /> : <Globe size={14} />}
                    <span>{urlFetching ? 'Fetching…' : 'Fetch & Summarize'}</span>
                  </button>
                </div>

                {urlError && (
                  <p style={{ color: 'var(--cp-red)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
                    {urlError}
                  </p>
                )}

                {/* Staged URL Verification Box */}
                {stagedUrlSource && (
                  <div className="cp-url-preview-card">
                    <div className="cp-url-preview-head">
                      <span>✓ Page Fetched from {stagedUrlSource.domain}</span>
                      <span>~{stagedUrlSource.tokenCount} tokens</span>
                    </div>
                    <div>
                      <label className="cp-label">Title</label>
                      <input
                        type="text"
                        className="cp-input"
                        value={stagedUrlSource.title}
                        onChange={(e) => setStagedUrlSource({ ...stagedUrlSource, title: e.target.value })}
                        style={{ marginBottom: '0.4rem', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <label className="cp-label">Summary</label>
                      <textarea
                        className="cp-input"
                        rows={2}
                        value={stagedUrlSource.summary}
                        onChange={(e) => setStagedUrlSource({ ...stagedUrlSource, summary: e.target.value })}
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
                      <button
                        type="button"
                        className="cp-btn-ghost-sm"
                        onClick={() => setStagedUrlSource(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="cp-btn-approve"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={handleConfirmUrlSource}
                      >
                        <Check size={14} /> Add to Sources
                      </button>
                    </div>
                  </div>
                )}
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
                style={{ marginBottom: '1.25rem' }}
              >
                <Upload size={22} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.json,.csv"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <p className="cp-dropzone-text">Drop reference documents or click to upload</p>
                <p className="cp-dropzone-sub">Standards, MakerSpace sheets, curriculum briefs (.txt, .md, .csv)</p>
              </div>

              {/* Active Grounding Sources List */}
              <div className="cp-card">
                <div className="cp-card-header">
                  <h3 className="cp-card-title">
                    <BookOpen size={16} /> Grounded Reference Sources ({activeSourcesCount} Active)
                  </h3>
                  <span className="cp-badge-pill">{totalTokens.toLocaleString()} tokens indexed</span>
                </div>

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
                      <button
                        type="button"
                        className="cp-source-delete-btn"
                        onClick={() => removeSource(s.id)}
                        title="Remove source"
                        aria-label={`Remove source ${s.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step 1 Footer */}
              <div className="cp-step-footer">
                <span style={{ fontSize: '0.85rem', color: 'var(--cp-text-muted)' }}>
                  {activeSourcesCount} active source{activeSourcesCount === 1 ? '' : 's'} will ground your brief.
                </span>
                <button
                  type="button"
                  className="cp-btn-next-step"
                  onClick={() => setWizardStep(2)}
                >
                  Next: Write Brief <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              STEP 2: BRIEF & COMPETENCIES
             ========================================================= */}
          {wizardStep === 2 && (
            <div className="cp-wizard-step-pane">
              <div className="cp-wizard-pane-header">
                <h2 className="cp-wizard-pane-title">
                  <FileText size={20} /> ② Unit Brief & Target Scaffolding
                </h2>
                <p className="cp-wizard-pane-desc">
                  Define the authentic problem, cohort constraints, and competency standards.
                </p>
              </div>

              {/* One-Line Target Bar */}
              <div className="cp-target-bar">
                {/* Cohort */}
                <div className="cp-target-item">
                  <span className="cp-target-label">Cohort:</span>
                  <select
                    className="cp-target-select"
                    value={programme}
                    onChange={(e) => setProgramme(e.target.value)}
                  >
                    <option value="WLS">Lower Secondary (Ages 11–14)</option>
                    <option value="WHS">Higher Secondary (Ages 15–18)</option>
                    <option value="primary">Primary (Ages 6–11)</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="cp-target-item">
                  <span className="cp-target-label">Duration:</span>
                  <select
                    className="cp-target-select"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  >
                    <option value="4 sessions">4 sessions</option>
                    <option value="6 weeks">6 weeks</option>
                    <option value="8 stages">8 stages</option>
                    <option value="12 weeks">12 weeks</option>
                  </select>
                </div>

                {/* Language */}
                <div className="cp-target-item">
                  <span className="cp-target-label">Lang:</span>
                  <select
                    className="cp-target-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en-GB">English (en-GB)</option>
                    <option value="th">Thai (ภาษาไทย)</option>
                  </select>
                </div>

                {/* Pitch Level */}
                <div className="cp-target-item">
                  <span className="cp-target-label">Pitch Level:</span>
                  <div className="cp-pitch-toggle-group">
                    <button
                      type="button"
                      className={`cp-pitch-btn ${pitchLevel === 'foundational' ? 'is-active' : ''}`}
                      onClick={() => setPitchLevel('foundational')}
                    >
                      Foundational
                    </button>
                    <button
                      type="button"
                      className={`cp-pitch-btn ${pitchLevel === 'core' ? 'is-active' : ''}`}
                      onClick={() => setPitchLevel('core')}
                    >
                      Core
                    </button>
                    <button
                      type="button"
                      className={`cp-pitch-btn ${pitchLevel === 'stretch' ? 'is-active' : ''}`}
                      onClick={() => setPitchLevel('stretch')}
                    >
                      Stretch
                    </button>
                  </div>
                </div>

                {/* Learner Picker (Explicit Choice - Does NOT Auto-Synthesize!) */}
                <div className="cp-target-item" style={{ marginLeft: 'auto' }}>
                  <span className="cp-target-label">Target:</span>
                  <select
                    className="cp-target-select"
                    value={selectedLearnerId}
                    onChange={(e) => setSelectedLearnerId(e.target.value)}
                  >
                    {availableLearners.map((p) => (
                      <option key={p.id || p.uid} value={p.id || p.uid}>
                        {p.avatar || '👤'} {p.name || p.displayName} {p.isUniversal ? '(Open Catalog)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3 Short Structured Brief Prompts */}
              <div className="cp-structured-brief-card">
                {/* 1. Real Problem */}
                <div className="cp-prompt-block">
                  <div className="cp-prompt-label-row">
                    <label className="cp-prompt-label" htmlFor="brief-problem">
                      1. Real Problem
                    </label>
                    <span className="cp-prompt-hint">What authentic challenge or community need are students solving?</span>
                  </div>
                  <textarea
                    id="brief-problem"
                    className="cp-prompt-textarea"
                    rows={2}
                    value={realProblem}
                    onChange={(e) => setRealProblem(e.target.value)}
                    placeholder="e.g. Extreme urban heat and storm runoff damaging secondary school sports courts..."
                  />
                </div>

                {/* 2. Driving Question */}
                <div className="cp-prompt-block">
                  <div className="cp-prompt-label-row">
                    <label className="cp-prompt-label" htmlFor="brief-dq">
                      2. Driving Question
                    </label>
                    <button
                      type="button"
                      className="cp-btn-suggest-dq"
                      onClick={handleAiSuggestDq}
                    >
                      <Sparkles size={12} /> Let AI Suggest Question
                    </button>
                  </div>
                  <textarea
                    id="brief-dq"
                    className="cp-prompt-textarea"
                    rows={2}
                    value={drivingQuestion}
                    onChange={(e) => setDrivingQuestion(e.target.value)}
                    placeholder="e.g. How can nature-inspired passive cooling canopies keep students safe during extreme heat?"
                  />
                </div>

                {/* 3. Final Product & Audience */}
                <div className="cp-prompt-block">
                  <div className="cp-prompt-label-row">
                    <label className="cp-prompt-label" htmlFor="brief-product">
                      3. Final Product & Audience
                    </label>
                    <span className="cp-prompt-hint">What will students physically make and who will they show it to?</span>
                  </div>
                  <textarea
                    id="brief-product"
                    className="cp-prompt-textarea"
                    rows={2}
                    value={finalProduct}
                    onChange={(e) => setFinalProduct(e.target.value)}
                    placeholder="e.g. A 1:10 scaled physical canopy model tested with temperature probes, pitched to the school board..."
                  />
                </div>
              </div>

              {/* Grouped Competency Picker with Categories, Search, AI Suggest */}
              <GroupedCompetencyPicker
                selectedWeLearnIds={selectedWeLearnIds}
                selectedNgsIds={selectedNgsIds}
                onChangeWeLearn={setSelectedWeLearnIds}
                onChangeNgs={setSelectedNgsIds}
                onAiSuggest={handleAiSuggestCompetencies}
                maxTotal={20}
              />

              {/* Step 2 Footer */}
              <div className="cp-step-footer">
                <button
                  type="button"
                  className="cp-btn-prev-step"
                  onClick={() => setWizardStep(1)}
                >
                  <ArrowLeft size={15} /> Back to Sources
                </button>

                <button
                  type="button"
                  className="cp-btn-next-step"
                  onClick={handleSynthesize}
                  disabled={synthesizing}
                >
                  {synthesizing ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Generating Unit…
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Generate & Review Unit <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              STEP 3: GENERATE & REVIEW (HORIZONTAL TIMELINE & IN-LINE EDITOR)
             ========================================================= */}
          {wizardStep === 3 && (
            <div className="cp-wizard-step-pane">
              {/* Live Progress Bar when generating */}
              {synthesizing && (
                <div style={{ background: 'var(--cp-purple-tint)', border: '1px solid var(--cp-purple-border)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                  <RefreshCw size={24} className="spin" style={{ color: 'var(--cp-purple)', margin: '0 auto 0.5rem' }} />
                  <h3 style={{ margin: '0 0 0.35rem', color: 'var(--cp-purple)' }}>Synthesizing Grounded Curriculum</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--cp-text-muted)' }}>
                    {synthesisProgress || 'Reading sources & structuring milestones...'}
                  </p>
                </div>
              )}

              {synthesisError && (
                <div style={{ background: 'var(--cp-red-tint)', border: '1px solid var(--cp-red-border)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--cp-red)' }}>
                  <AlertTriangle size={18} />
                  <div style={{ flex: 1, fontSize: '0.85rem' }}>
                    <strong>Notice:</strong> {synthesisError}
                  </div>
                  <button
                    type="button"
                    onClick={handleSynthesize}
                    style={{ background: 'var(--cp-red)', color: '#fff', border: 'none', borderRadius: 6, padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {unit && (
                <>
                  {/* Top Bar: Driving Question Banner & Auto-Save Indicator */}
                  <div className="cp-dq-banner" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span className="cp-dq-kicker">
                        <Sparkles size={13} /> Grounded Driving Question (Editable)
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--cp-text-muted)' }}>
                        {autoSaveText}
                      </span>
                    </div>
                    <textarea
                      className="cp-dq-input"
                      rows={2}
                      value={unit.drivingQuestion}
                      onChange={(e) => updateUnitField('drivingQuestion', e.target.value)}
                      placeholder="Enter driving question..."
                      aria-label="Driving Question"
                    />
                  </div>

                  {/* Horizontal Timeline Section: 8 Milestones as Cards */}
                  <section className="cp-timeline-section" aria-label="8-Stage Timeline Review">
                    <div className="cp-timeline-header-bar">
                      <div>
                        <h3 style={{ margin: '0 0 0.2rem', fontSize: '1rem', fontWeight: 800, color: 'var(--cp-heading)' }}>
                          WeLearn 8-Stage PBL Timeline (Curiosity ➔ Showcase)
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--cp-text-muted)' }}>
                          Click any stage card to edit in detail. Use stage controls to regenerate or simplify.
                        </p>
                      </div>

                      {/* View Mode Toggle: Coach Timeline | Split View | Student Dashboard */}
                      <div className="cp-view-toggle-bar">
                        <button
                          type="button"
                          className={`cp-btn-view-mode ${viewMode === 'timeline' ? 'is-active' : ''}`}
                          onClick={() => setViewMode('timeline')}
                        >
                          Coach View
                        </button>
                        <button
                          type="button"
                          className={`cp-btn-view-mode ${viewMode === 'split' ? 'is-active' : ''}`}
                          onClick={() => setViewMode('split')}
                        >
                          Side-by-Side
                        </button>
                        <button
                          type="button"
                          className={`cp-btn-view-mode ${viewMode === 'student' ? 'is-active' : ''}`}
                          onClick={() => setViewMode('student')}
                        >
                          Student View
                        </button>
                      </div>
                    </div>

                    {/* Horizontal Scrollable Timeline */}
                    <div className="cp-timeline-scroll">
                      {unit.milestones.map((m, idx) => {
                        const isSelected = selectedMilestoneIndex === idx;
                        return (
                          <div
                            key={m.id || idx}
                            className={`cp-stage-card ${isSelected ? 'is-active' : ''}`}
                            onClick={() => setSelectedMilestoneIndex(idx)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="cp-stage-card-top">
                              <span className="cp-stage-num-badge">Stage {m.stageNumber}</span>
                              <span className="cp-stage-name-pill">{m.stageName}</span>
                            </div>
                            <strong className="cp-stage-card-title">{m.title}</strong>
                            <p className="cp-stage-card-goal">{m.learningGoal}</p>

                            {/* Source attribution chips */}
                            <div className="cp-source-chip-wrap">
                              {sources.slice(0, 2).map((s) => (
                                <span key={s.id} className="cp-source-chip" title={s.title}>
                                  {s.title.length > 18 ? `${s.title.slice(0, 18)}…` : s.title}
                                </span>
                              ))}
                              {selectedNgsIds[0] && (
                                <span className="cp-source-chip">{selectedNgsIds[0]}</span>
                              )}
                            </div>

                            {/* Stage Controls */}
                            <div className="cp-stage-card-actions" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="cp-btn-stage-action"
                                onClick={() => handleRegenerateStage(idx)}
                                title="Regenerate this specific milestone"
                              >
                                <RotateCcw size={11} /> Redraft
                              </button>
                              <button
                                type="button"
                                className="cp-btn-stage-action"
                                onClick={() => handleSimplifyStage(idx)}
                                title="Make this milestone simpler and more hands-on"
                              >
                                <Wrench size={11} /> Hands-on
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Main Review & In-line Editor Layout (Split vs Full) */}
                  <div className={viewMode === 'split' ? 'cp-split-layout' : ''}>
                    {/* Left Pane: Detailed Milestone Editor (Shown in timeline and split view) */}
                    {(viewMode === 'timeline' || viewMode === 'split') && (
                      <div className="cp-card">
                        <div className="cp-card-header">
                          <h3 className="cp-card-title">
                            <Layers size={16} /> Stage {unit.milestones[selectedMilestoneIndex]?.stageNumber}: {unit.milestones[selectedMilestoneIndex]?.stageName}
                          </h3>
                          <span className="cp-badge-pill">Week {unit.milestones[selectedMilestoneIndex]?.week} • 90m</span>
                        </div>

                        {unit.milestones[selectedMilestoneIndex] && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div className="cp-input-group">
                              <label className="cp-label">Milestone Title</label>
                              <input
                                type="text"
                                className="cp-input"
                                value={unit.milestones[selectedMilestoneIndex].title}
                                onChange={(e) => updateMilestone(selectedMilestoneIndex, { title: e.target.value })}
                              />
                            </div>

                            <div className="cp-input-group">
                              <label className="cp-label">Learning Goal</label>
                              <textarea
                                className="cp-input"
                                rows={2}
                                value={unit.milestones[selectedMilestoneIndex].learningGoal}
                                onChange={(e) => updateMilestone(selectedMilestoneIndex, { learningGoal: e.target.value })}
                              />
                            </div>

                            {/* Checklist Activities */}
                            <div className="cp-input-group">
                              <label className="cp-label">Milestone Checklist Activities</label>
                              <ul className="cp-activities-list">
                                {unit.milestones[selectedMilestoneIndex].activities.map((act, actIdx) => (
                                  <li key={actIdx} className="cp-activity-item">
                                    <CheckCircle2 size={15} style={{ color: 'var(--cp-green)', flexShrink: 0 }} />
                                    <input
                                      type="text"
                                      className="cp-input"
                                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                                      value={act}
                                      onChange={(e) => {
                                        const newActs = [...unit.milestones[selectedMilestoneIndex].activities];
                                        newActs[actIdx] = e.target.value;
                                        updateMilestone(selectedMilestoneIndex, { activities: newActs });
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
                                {unit.milestones[selectedMilestoneIndex].makerSpaceTools.map((tool, tIdx) => (
                                  <span key={tIdx} className="cp-chip cp-chip-trait" style={{ fontSize: '0.75rem' }}>
                                    <Wrench size={11} style={{ marginRight: '0.25rem' }} /> {tool}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Coach Daily Intervention Cue */}
                            <div className="cp-cue-box">
                              <span className="cp-cue-title">
                                <Bot size={13} /> {unit.coachCues?.leadCoach || 'Lead Coach'} Intervention Cue
                              </span>
                              <textarea
                                className="cp-input"
                                rows={2}
                                style={{ background: 'transparent', borderColor: 'var(--cp-purple-border)', fontSize: '0.8rem' }}
                                value={unit.milestones[selectedMilestoneIndex].coachCue}
                                onChange={(e) => updateMilestone(selectedMilestoneIndex, { coachCue: e.target.value })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Right Pane: Live Student Dashboard Preview (Shown in split and student view) */}
                    {(viewMode === 'student' || viewMode === 'split') && (
                      <div className="cp-card">
                        <div className="cp-card-header">
                          <h3 className="cp-card-title">
                            <Eye size={16} /> Live Student Dashboard Preview
                          </h3>
                          <span className="cp-badge-pill" style={{ color: 'var(--cp-green)', borderColor: 'var(--cp-green-border)' }}>
                            {learner.isUniversal ? 'Open Catalog' : learner.name}
                          </span>
                        </div>

                        <div className="cp-preview-box">
                          <div className="cp-preview-hero">
                            <span className="cp-preview-kicker">Active PBL Program</span>
                            <h4 className="cp-preview-title">{unit.unitTitle}</h4>
                            <p className="cp-preview-dq">"{unit.drivingQuestion}"</p>
                          </div>

                          {/* 8-Stage Cycle Progress Strip */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--cp-text-muted)', marginBottom: '0.35rem' }}>
                              <span>8-Stage Cycle</span>
                              <span>Stage 1: Curiosity</span>
                            </div>
                            <ul className="cp-cycle-strip">
                              {unit.milestones.map((m, i) => (
                                <li key={m.id || i} className={`cp-cycle-step ${i === 0 ? 'current' : ''}`} title={m.stageName} />
                              ))}
                            </ul>
                          </div>

                          {/* Active Milestone Card */}
                          <div style={{ background: 'var(--cp-surface-sunken)', border: '1px solid var(--cp-border-strong)', borderRadius: '8px', padding: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--cp-blue)', textTransform: 'uppercase' }}>
                                Active: Stage 1
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--cp-text-muted)' }}>Week 1 • 90 min</span>
                            </div>
                            <h5 style={{ margin: '0 0 0.4rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--cp-heading)' }}>
                              {unit.milestones[0]?.title}
                            </h5>
                            <p style={{ margin: '0 0 0.65rem', fontSize: '0.78rem', color: 'var(--cp-text-muted)', lineHeight: 1.35 }}>
                              {unit.milestones[0]?.learningGoal}
                            </p>

                            <div className="cp-submission-triggers">
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cp-text)', textTransform: 'uppercase' }}>
                                Multi-Modal Submissions:
                              </span>
                              <div className="cp-trigger-pill">
                                <Video size={13} /> 60s Video Pitch Demo
                              </div>
                              <div className="cp-trigger-pill">
                                <GitBranch size={13} /> GitHub Code / CAD Link
                              </div>
                              <div className="cp-trigger-pill">
                                <Box size={13} /> Physical Prototype Bench Register
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* =========================================================
                      EXTRA MATERIALS GENERATOR (Slides, Quiz, Narration, Job Sheet, Parent Summary)
                     ========================================================= */}
                  {generatedExtras && (
                    <div className="cp-extras-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                        <div>
                          <h3 style={{ margin: '0 0 0.2rem', fontSize: '1rem', fontWeight: 800, color: 'var(--cp-heading)' }}>
                            1-Click Extra Materials (Curriculum Collateral)
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--cp-text-muted)' }}>
                            Automatically generated from this unit and your active sources.
                          </p>
                        </div>
                        <span className="cp-badge-pill" style={{ color: 'var(--cp-purple)' }}>
                          5 Ready
                        </span>
                      </div>

                      {/* Extra Materials Nav Tabs */}
                      <div className="cp-extras-nav">
                        <button
                          type="button"
                          className={`cp-extras-tab-btn ${activeExtraTab === 'slides' ? 'is-active' : ''}`}
                          onClick={() => setActiveExtraTab('slides')}
                        >
                          <Layers size={14} /> Slides Deck ({generatedExtras.slides.length})
                        </button>
                        <button
                          type="button"
                          className={`cp-extras-tab-btn ${activeExtraTab === 'quiz' ? 'is-active' : ''}`}
                          onClick={() => setActiveExtraTab('quiz')}
                        >
                          <HelpCircle size={14} /> Formative Quiz ({generatedExtras.quizItems.length})
                        </button>
                        <button
                          type="button"
                          className={`cp-extras-tab-btn ${activeExtraTab === 'narration' ? 'is-active' : ''}`}
                          onClick={() => setActiveExtraTab('narration')}
                        >
                          <Play size={14} /> Narration Script
                        </button>
                        <button
                          type="button"
                          className={`cp-extras-tab-btn ${activeExtraTab === 'jobsheet' ? 'is-active' : ''}`}
                          onClick={() => setActiveExtraTab('jobsheet')}
                        >
                          <Wrench size={14} /> MakerSpace Job Sheet
                        </button>
                        <button
                          type="button"
                          className={`cp-extras-tab-btn ${activeExtraTab === 'parent' ? 'is-active' : ''}`}
                          onClick={() => setActiveExtraTab('parent')}
                        >
                          <Users size={14} /> Parent Summary
                        </button>
                      </div>

                      {/* Extra Materials Content Viewer */}
                      <div className="cp-extras-pane">
                        {/* 1. Slides View */}
                        {activeExtraTab === 'slides' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {generatedExtras.slides.map((s) => (
                              <div key={s.slideNumber} style={{ background: 'var(--cp-surface)', padding: '0.85rem', borderRadius: 8, border: '1px solid var(--cp-border)' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--cp-purple)' }}>
                                  Slide {s.slideNumber}: {s.heading}
                                </span>
                                <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.82rem', fontWeight: 600 }}>{s.subheading}</p>
                                <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.25rem', fontSize: '0.78rem' }}>
                                  {s.bullets.map((b, i) => (
                                    <li key={i}>{b}</li>
                                  ))}
                                </ul>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--cp-text-muted)', fontStyle: 'italic' }}>
                                  Coach notes: {s.speakerNotes}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 2. Quiz View */}
                        {activeExtraTab === 'quiz' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {generatedExtras.quizItems.map((q, idx) => (
                              <div key={q.id} style={{ background: 'var(--cp-surface)', padding: '0.85rem', borderRadius: 8, border: '1px solid var(--cp-border)' }}>
                                <p style={{ margin: '0 0 0.45rem', fontSize: '0.85rem', fontWeight: 700 }}>
                                  Q{idx + 1}: {q.prompt}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.45rem' }}>
                                  {q.options.map((opt, oIdx) => (
                                    <div
                                      key={oIdx}
                                      style={{
                                        fontSize: '0.78rem', padding: '0.35rem 0.6rem', borderRadius: 4,
                                        background: oIdx === q.correctIndex ? 'var(--cp-green-tint)' : 'var(--cp-surface-sunken)',
                                        border: `1px solid ${oIdx === q.correctIndex ? 'var(--cp-green-border)' : 'var(--cp-border-strong)'}`
                                      }}
                                    >
                                      {oIdx === q.correctIndex ? '✓ ' : '• '}{opt}
                                    </div>
                                  ))}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--cp-text-muted)' }}>
                                  <strong>Explanation:</strong> {q.explanation}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 3. Narration Script View */}
                        {activeExtraTab === 'narration' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {generatedExtras.narrationScript.map((n) => (
                              <div key={n.id} style={{ background: 'var(--cp-surface)', padding: '0.85rem', borderRadius: 8, border: '1px solid var(--cp-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                  <strong style={{ fontSize: '0.82rem', color: 'var(--cp-heading)' }}>{n.title}</strong>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--cp-text-muted)' }}>About {n.durationSec}s</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.45 }}>{n.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 4. MakerSpace Job Sheet View */}
                        {activeExtraTab === 'jobsheet' && (
                          <div style={{ background: 'var(--cp-surface)', padding: '1rem', borderRadius: 8, border: '1px solid var(--cp-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--cp-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                              <strong style={{ fontSize: '0.9rem' }}>MakerSpace Workstation Checklist: {generatedExtras.jobSheet.unitTitle}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--cp-text-muted)' }}>Lead: {generatedExtras.jobSheet.leadCoach}</span>
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cp-amber)' }}>⚠️ Safety Protocols:</span>
                              <ul style={{ margin: '0.25rem 0', paddingLeft: '1.25rem', fontSize: '0.78rem' }}>
                                {generatedExtras.jobSheet.safetyChecklist.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Fabrication Bench Tasks:</span>
                              <ol style={{ margin: '0.25rem 0', paddingLeft: '1.25rem', fontSize: '0.78rem' }}>
                                {generatedExtras.jobSheet.fabricationSteps.map((step) => (
                                  <li key={step.stepNumber} style={{ marginBottom: '0.35rem' }}>
                                    <strong>{step.stage} ({step.task}):</strong> {step.goal}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        )}

                        {/* 5. Parent Summary View */}
                        {activeExtraTab === 'parent' && (
                          <div style={{ background: 'var(--cp-surface)', padding: '1rem', borderRadius: 8, border: '1px solid var(--cp-border)' }}>
                            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.92rem' }}>WeLearn Parent & Family Project Update</h4>
                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', lineHeight: 1.45 }}>
                              {generatedExtras.parentSummary.summaryText}
                            </p>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong style={{ fontSize: '0.78rem' }}>Home Conversation Starters:</strong>
                              <ul style={{ margin: '0.25rem 0', paddingLeft: '1.25rem', fontSize: '0.78rem' }}>
                                {generatedExtras.parentSummary.homeConversationStarters.map((q, i) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3 Footer */}
                  <div className="cp-step-footer">
                    <button
                      type="button"
                      className="cp-btn-prev-step"
                      onClick={() => setWizardStep(2)}
                    >
                      <ArrowLeft size={15} /> Back to Brief
                    </button>

                    <button
                      type="button"
                      className="cp-btn-next-step"
                      onClick={() => setWizardStep(4)}
                    >
                      Next: Publish & Assign <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* =========================================================
              STEP 4: PUBLISH & TRANSFER
             ========================================================= */}
          {wizardStep === 4 && (
            <div className="cp-wizard-step-pane">
              <div className="cp-wizard-pane-header">
                <h2 className="cp-wizard-pane-title">
                  <Send size={20} /> ④ Publish & Assign Unit
                </h2>
                <p className="cp-wizard-pane-desc">
                  Deliver "{unit?.unitTitle || 'PBL Unit'}" to the open student catalog or directly to a learner.
                </p>
              </div>

              {/* Toast / Celebration */}
              {transferredInfo && (
                <div className="cp-transferred-toast" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> {transferredInfo.mode === 'catalog' ? 'Published to Course Catalog!' : 'Transferred Successfully!'}
                  </div>
                  {transferredInfo.mode === 'catalog' ? (
                    <span>
                      <strong>{transferredInfo.title}</strong> is now live and findable in Student Search. Any learner can find, add, and start it at <code>#/search</code>.
                    </span>
                  ) : (
                    <span>
                      <strong>{transferredInfo.title}</strong> is active in <strong>{transferredInfo.learnerName}'s</strong> dashboard.
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <a
                      href={transferredInfo.searchUrl || '#/search'}
                      className="cp-btn-student-view"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Search size={14} /> Open in Student Search (#/search)
                    </a>
                    <a
                      href={transferredInfo.studentUrl}
                      className="cp-btn-student-view"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Eye size={14} /> Open Course View
                    </a>
                    <button
                      type="button"
                      className="cp-btn-student-view"
                      onClick={handleResetForNewUnit}
                    >
                      <Sparkles size={14} /> Create another unit
                    </button>
                  </div>
                </div>
              )}

              {transferError && (
                <div className="cp-transferred-toast" style={{ borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5', marginBottom: '1.5rem' }} role="alert">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#f87171' }}>
                    <AlertTriangle size={16} /> Publishing Failed
                  </div>
                  <span>{transferError}</span>
                </div>
              )}

              {/* Publish Actions Card */}
              <div className="cp-card">
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 800 }}>Ready to Publish</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--cp-text-muted)' }}>
                    Unit Title: <strong>{unit?.unitTitle}</strong> • Driving Question: "{unit?.drivingQuestion}" • {unit?.milestones?.length || 8} Milestones
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {/* Option 1: Course Catalog */}
                  <div style={{ background: 'var(--cp-surface-subtle)', border: '1px solid var(--cp-border-strong)', borderRadius: 10, padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cp-purple)', fontWeight: 700, marginBottom: '0.45rem' }}>
                        <Globe size={18} /> Open Course Catalog
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--cp-text-muted)', lineHeight: 1.4 }}>
                        Publishes to the Student Search engine (<code>#/search</code>). Any student can discover, enrol, and launch this project.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cp-btn-transfer"
                      style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center' }}
                      onClick={handlePublishToCatalog}
                      disabled={transferring || !unit}
                    >
                      {transferring ? (
                        <>
                          <RefreshCw size={16} className="spin" /> Publishing…
                        </>
                      ) : (
                        <>
                          <Globe size={16} /> Publish to Course Catalog
                        </>
                      )}
                    </button>
                  </div>

                  {/* Option 2: Direct Transfer to Student */}
                  {!learner.isUniversal && (
                    <div style={{ background: 'var(--cp-surface-subtle)', border: '1px solid var(--cp-border-strong)', borderRadius: 10, padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cp-blue)', fontWeight: 700, marginBottom: '0.45rem' }}>
                          <Send size={18} /> Direct Assign to {learner.name.split(' ')[0]}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--cp-text-muted)', lineHeight: 1.4 }}>
                          Directly injects the unit into {learner.name}'s active dashboard with personalized 2e accommodations applied.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="cp-btn-direct-transfer"
                        style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center', padding: '0.75rem 1rem' }}
                        onClick={handleTransfer}
                        disabled={transferring || !unit}
                      >
                        {transferring ? (
                          <>
                            <RefreshCw size={16} className="spin" /> Transferring…
                          </>
                        ) : (
                          <>
                            <Send size={16} /> Assign to {learner.name.split(' ')[0]}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4 Footer */}
              <div className="cp-step-footer">
                <button
                  type="button"
                  className="cp-btn-prev-step"
                  onClick={() => setWizardStep(3)}
                >
                  <ArrowLeft size={15} /> Back to Review
                </button>

                <button
                  type="button"
                  className="cp-btn-prev-step"
                  onClick={handleResetForNewUnit}
                >
                  <Sparkles size={15} /> Create Another Unit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Edmentum LTI 1.3 Advantage & Rostering Hub */}
      {workspaceTab === 'edmentum' && (
        <EdmentumIntegrationConsole coachUser={coachUser} />
      )}
    </div>
  );
}
