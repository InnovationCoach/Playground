import { useState } from 'react';
import {
  X, Save, Sparkles, Video, Presentation, HelpCircle, Wrench, CheckSquare, Plus,
  Trash2, MoveUp, MoveDown, Eye, CheckCircle2, AlertCircle, RefreshCw, BookOpen
} from 'lucide-react';
import { generateStageMaterials, parseYouTubeVideoUrl } from './stageMaterialsAi.js';
import { saveProgramCustomization } from '../../../services/pblService.js';

export function StageEditorModal({
  isOpen,
  onClose,
  program,
  stageIndex = 0,
  cohorts = [],
  onSaved = null,
  onOpenPreview = null
}) {
  if (!isOpen || !program) return null;

  const phases = Array.isArray(program.phases) && program.phases.length > 0 ? program.phases : [];
  const [currentIdx, setCurrentIdx] = useState(Math.min(stageIndex, Math.max(0, phases.length - 1)));
  const initialStage = phases[currentIdx] || {
    id: `phase-${currentIdx + 1}`,
    phaseId: `phase-${currentIdx + 1}`,
    title: `Stage ${currentIdx + 1}`,
    weeks: [currentIdx + 1, currentIdx + 1],
    learningGoal: '',
    instructions: '',
    checklist: [],
    videos: [],
    slides: [],
    quiz: [],
    resources: [],
    status: 'published'
  };

  // Scope: 'template' (shared) vs 'cohort' (specific class)
  const [scope, setScope] = useState('template');
  const [selectedCohort, setSelectedCohort] = useState('WLS');

  // Active tab in modal
  const [activeTab, setActiveTab] = useState('details');

  // Working state for the current stage being edited
  const [stageData, setStageData] = useState(() => JSON.parse(JSON.stringify(initialStage)));

  // AI Generation State
  const [aiNotes, setAiNotes] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState(null);

  // New video input state
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [videoValidation, setVideoValidation] = useState(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // When stage dropdown changes
  const handleSelectStage = (idx) => {
    setCurrentIdx(idx);
    const target = phases[idx];
    if (target) {
      setStageData(JSON.parse(JSON.stringify(target)));
    }
  };

  // Video URL validation on change
  const handleVideoUrlChange = (val) => {
    setNewVideoUrl(val);
    if (!val.trim()) {
      setVideoValidation(null);
      return;
    }
    const res = parseYouTubeVideoUrl(val);
    setVideoValidation(res);
  };

  const handleAddVideo = () => {
    if (!videoValidation || !videoValidation.valid) return;
    const newEntry = {
      id: `v-${Date.now()}`,
      title: newVideoTitle.trim() || 'Stage Learning Video',
      url: videoValidation.originalUrl,
      embedUrl: videoValidation.embedUrl,
      type: videoValidation.type,
      description: newVideoDesc.trim(),
      createdAt: Date.now()
    };
    setStageData((prev) => ({
      ...prev,
      videos: [...(Array.isArray(prev.videos) ? prev.videos : []), newEntry]
    }));
    setNewVideoUrl('');
    setNewVideoTitle('');
    setNewVideoDesc('');
    setVideoValidation(null);
  };

  const handleRemoveVideo = (vIdx) => {
    setStageData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== vIdx)
    }));
  };

  const handleMoveVideo = (fromIdx, toIdx) => {
    setStageData((prev) => {
      const vids = [...prev.videos];
      const [moved] = vids.splice(fromIdx, 1);
      vids.splice(toIdx, 0, moved);
      return { ...prev, videos: vids };
    });
  };

  // Checklist management
  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const handleAddChecklistItem = () => {
    const trimmed = newChecklistLabel.trim();
    if (!trimmed) return;
    setStageData((prev) => ({
      ...prev,
      checklist: [
        ...(Array.isArray(prev.checklist) ? prev.checklist : []),
        { id: `task-${Date.now()}`, label: trimmed, required: true }
      ]
    }));
    setNewChecklistLabel('');
  };

  const handleRemoveChecklistItem = (cIdx) => {
    setStageData((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== cIdx)
    }));
  };

  // AI Generation trigger
  const handleGenerate = async (type, refinement = null) => {
    setAiLoading(true);
    setAiError(null);
    setAiSuccessMessage(null);
    try {
      const generated = await generateStageMaterials({
        type,
        stage: stageData,
        program,
        notes: aiNotes,
        refinement
      });

      setStageData((prev) => {
        const next = { ...prev };
        if (generated.slides) next.slides = generated.slides;
        if (generated.quiz) next.quiz = generated.quiz;
        if (generated.activity) next.activity = generated.activity;
        return next;
      });

      setAiSuccessMessage(
        refinement
          ? `Refined with "${refinement}" successfully!`
          : `Generated ${type === 'all' ? 'materials' : type} successfully!`
      );
      setTimeout(() => setAiSuccessMessage(null), 3500);
    } catch (err) {
      setAiError(err.message || 'Generation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveProgramCustomization(program.id, (prog) => {
        const phasesCopy = [...(prog.phases || [])];
        phasesCopy[currentIdx] = {
          ...phasesCopy[currentIdx],
          ...stageData,
          id: stageData.id || `phase-${currentIdx + 1}`,
          phaseId: stageData.phaseId || `phase-${currentIdx + 1}`
        };
        return {
          ...prog,
          phases: phasesCopy
        };
      }, { cohortId: scope === 'cohort' ? selectedCohort : null });

      setSaveSuccess(true);
      onSaved?.();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(`Could not save stage: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="stage-editor-title">
      <div className="pb-modal-container">
        {/* Modal Header */}
        <div className="pb-modal-header">
          <div>
            <span className="pb-modal-kicker">Stage Studio & Curriculum Editor</span>
            <h2 id="stage-editor-title" className="pb-modal-title">
              {stageData.title || `Stage ${currentIdx + 1}`}
            </h2>
          </div>
          <button type="button" className="pb-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Stage & Scope Selectors */}
        <div className="pb-editor-toolbar">
          <div className="pb-toolbar-group">
            <label className="pb-toolbar-label" htmlFor="stage-selector">Stage:</label>
            <select
              id="stage-selector"
              className="gh-select pb-toolbar-select"
              value={currentIdx}
              onChange={(e) => handleSelectStage(Number(e.target.value))}
            >
              {phases.map((ph, i) => (
                <option key={ph.id || i} value={i}>
                  Stage {i + 1}: {ph.title || `Phase ${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div className="pb-toolbar-group">
            <label className="pb-toolbar-label" htmlFor="scope-selector">Scope:</label>
            <select
              id="scope-selector"
              className="gh-select pb-toolbar-select"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="template">Shared Program Template (All cohorts)</option>
              <option value="cohort">Cohort Specific Override</option>
            </select>
          </div>

          {scope === 'cohort' && (
            <div className="pb-toolbar-group">
              <label className="pb-toolbar-label" htmlFor="cohort-selector">Cohort:</label>
              <select
                id="cohort-selector"
                className="gh-select pb-toolbar-select"
                value={selectedCohort}
                onChange={(e) => setSelectedCohort(e.target.value)}
              >
                <optgroup label="WeLearn Cohorts">
                  <option value="WLS">Lower Secondary &ldquo;WLS&rdquo; · Ages 11–14</option>
                  <option value="WHS">Higher Secondary &ldquo;WHS&rdquo; · Ages 15–18</option>
                </optgroup>
                {cohorts.length > 0 && (
                  <optgroup label="Specific Classes">
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name || c.id}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="pb-modal-tabs" role="tablist">
          <button
            type="button"
            className={`pb-modal-tab ${activeTab === 'details' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <CheckSquare size={15} aria-hidden="true" /> Details & Checklist
          </button>
          <button
            type="button"
            className={`pb-modal-tab ${activeTab === 'videos' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <Video size={15} aria-hidden="true" /> Videos & Playlists ({stageData.videos?.length || 0})
          </button>
          <button
            type="button"
            className={`pb-modal-tab ${activeTab === 'ai' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles size={15} aria-hidden="true" /> AI Materials (Slides & Quiz)
          </button>
          <button
            type="button"
            className={`pb-modal-tab ${activeTab === 'publish' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('publish')}
          >
            <Save size={15} aria-hidden="true" /> Review & Publish
          </button>
        </div>

        {/* Modal Body */}
        <div className="pb-modal-body">
          {/* TAB 1: Details & Checklist */}
          {activeTab === 'details' && (
            <div className="pb-tab-pane">
              <div className="pb-form-grid">
                <div className="pb-field">
                  <label className="gh-label" htmlFor="stage-title-input">Stage Title</label>
                  <input
                    id="stage-title-input"
                    className="gh-input"
                    value={stageData.title || ''}
                    onChange={(e) => setStageData({ ...stageData, title: e.target.value })}
                  />
                </div>
                <div className="pb-field">
                  <label className="gh-label" htmlFor="stage-weeks-input">Duration (Weeks)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span>Week</span>
                    <input
                      id="stage-weeks-input"
                      type="number"
                      className="gh-input"
                      style={{ width: '70px' }}
                      value={stageData.weeks?.[0] || 1}
                      onChange={(e) => {
                        const start = Number(e.target.value);
                        setStageData({
                          ...stageData,
                          weeks: [start, Math.max(start, stageData.weeks?.[1] || start)]
                        });
                      }}
                    />
                    <span>to</span>
                    <input
                      type="number"
                      className="gh-input"
                      style={{ width: '70px' }}
                      value={stageData.weeks?.[1] || 1}
                      onChange={(e) => {
                        const end = Number(e.target.value);
                        setStageData({
                          ...stageData,
                          weeks: [stageData.weeks?.[0] || 1, end]
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pb-field" style={{ marginTop: '0.8rem' }}>
                <label className="gh-label" htmlFor="stage-goal-input">Learning Goal / Big Idea</label>
                <input
                  id="stage-goal-input"
                  className="gh-input"
                  value={stageData.learningGoal || stageData.goal || ''}
                  onChange={(e) => setStageData({ ...stageData, learningGoal: e.target.value, goal: e.target.value })}
                />
              </div>

              <div className="pb-field" style={{ marginTop: '0.8rem' }}>
                <label className="gh-label" htmlFor="stage-instructions-input">Detailed Stage Instructions</label>
                <textarea
                  id="stage-instructions-input"
                  className="gh-input pb-textarea"
                  rows={4}
                  value={stageData.instructions || ''}
                  onChange={(e) => setStageData({ ...stageData, instructions: e.target.value })}
                  placeholder="Provide guiding prompts, safety alerts, or workshop steps for learners..."
                />
              </div>

              {/* Checklist Manager */}
              <div className="pb-sub-card" style={{ marginTop: '1.2rem' }}>
                <h4 className="pb-sub-card-title">
                  <CheckSquare size={16} aria-hidden="true" />
                  <span>Task Checklist Manager</span>
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <input
                    type="text"
                    className="gh-input pb-grow"
                    placeholder="Add a new checklist task..."
                    value={newChecklistLabel}
                    onChange={(e) => setNewChecklistLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItem())}
                  />
                  <button type="button" className="gh-btn gh-btn-primary" onClick={handleAddChecklistItem}>
                    <Plus size={15} aria-hidden="true" /> Add Task
                  </button>
                </div>

                <ul className="pb-modal-list">
                  {(stageData.checklist || []).map((task, idx) => {
                    const label = typeof task === 'string' ? task : task.label;
                    return (
                      <li key={idx} className="pb-modal-list-item">
                        <span className="pb-grow">{label}</span>
                        <button
                          type="button"
                          className="gh-btn gh-btn-ghost gh-btn-sm"
                          onClick={() => handleRemoveChecklistItem(idx)}
                          aria-label={`Remove task ${label}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: Videos & Playlists */}
          {activeTab === 'videos' && (
            <div className="pb-tab-pane">
              <div className="pb-sub-card">
                <h4 className="pb-sub-card-title">
                  <Video size={16} aria-hidden="true" />
                  <span>Attach Video or Playlist</span>
                </h4>
                <p className="pb-sub">
                  Add YouTube video or playlist links. Videos are embedded with privacy protection via <code>youtube-nocookie.com</code>.
                </p>

                <div className="pb-field" style={{ marginTop: '0.6rem' }}>
                  <label className="gh-label" htmlFor="video-url-input">YouTube Link (Video or Playlist)</label>
                  <input
                    id="video-url-input"
                    type="url"
                    className="gh-input"
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={newVideoUrl}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                  />
                  {videoValidation && (
                    <p className={`pb-hint ${videoValidation.valid ? 'is-valid' : 'is-error'}`}>
                      {videoValidation.valid ? (
                        <>✓ Valid YouTube {videoValidation.type} link detected.</>
                      ) : (
                        videoValidation.error
                      )}
                    </p>
                  )}
                </div>

                <div className="pb-form-grid" style={{ marginTop: '0.6rem' }}>
                  <div className="pb-field">
                    <label className="gh-label" htmlFor="video-title-input">Video Title</label>
                    <input
                      id="video-title-input"
                      className="gh-input"
                      placeholder="e.g. Biomimicry Sharkskin Aerodynamics"
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                    />
                  </div>
                  <div className="pb-field">
                    <label className="gh-label" htmlFor="video-desc-input">Description / Prompt</label>
                    <input
                      id="video-desc-input"
                      className="gh-input"
                      placeholder="Prompt students to notice key mechanisms..."
                      value={newVideoDesc}
                      onChange={(e) => setNewVideoDesc(e.target.value)}
                    />
                  </div>
                </div>

                {videoValidation?.valid && videoValidation.embedUrl && (
                  <div style={{ marginTop: '0.8rem', maxWidth: '360px' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--gh-text-3)', marginBottom: '0.2rem' }}>Preview:</p>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
                      <iframe
                        src={videoValidation.embedUrl}
                        title="Embed preview"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '0.8rem' }}>
                  <button
                    type="button"
                    className="gh-btn gh-btn-primary"
                    disabled={!videoValidation?.valid}
                    onClick={handleAddVideo}
                  >
                    <Plus size={15} aria-hidden="true" /> Add Video to Stage
                  </button>
                </div>
              </div>

              {/* Current Videos List */}
              <div style={{ marginTop: '1.2rem' }}>
                <h4 style={{ fontSize: '0.92rem', marginBottom: '0.6rem' }}>Stage Videos ({(stageData.videos || []).length})</h4>
                {(stageData.videos || []).length === 0 ? (
                  <p className="pb-text-muted">No videos attached to this stage yet.</p>
                ) : (
                  <ul className="pb-modal-list">
                    {stageData.videos.map((vid, idx) => (
                      <li key={vid.id || idx} className="pb-modal-list-item">
                        <div className="pb-grow">
                          <strong>{vid.title || `Video ${idx + 1}`}</strong>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--gh-text-3)' }}>
                            {vid.url}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button
                            type="button"
                            className="gh-btn gh-btn-ghost gh-btn-sm"
                            disabled={idx === 0}
                            onClick={() => handleMoveVideo(idx, idx - 1)}
                            aria-label="Move up"
                          >
                            <MoveUp size={14} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="gh-btn gh-btn-ghost gh-btn-sm"
                            disabled={idx === stageData.videos.length - 1}
                            onClick={() => handleMoveVideo(idx, idx + 1)}
                            aria-label="Move down"
                          >
                            <MoveDown size={14} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="gh-btn gh-btn-ghost gh-btn-sm"
                            onClick={() => handleRemoveVideo(idx)}
                            aria-label="Remove video"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AI Learning Materials */}
          {activeTab === 'ai' && (
            <div className="pb-tab-pane">
              <div className="pb-sub-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 className="pb-sub-card-title">
                    <Sparkles size={16} aria-hidden="true" />
                    <span>AI Material Co-Pilot</span>
                  </h4>
                  <span className="pb-badge-pill">Grounded in Stage {currentIdx + 1}</span>
                </div>
                <p className="pb-sub">
                  Provide notes, source text, or custom instructions. Gemini crafts visual slides, a formative concept quiz with explanations, and a practical activity.
                </p>

                <div className="pb-field" style={{ marginTop: '0.6rem' }}>
                  <label className="gh-label" htmlFor="ai-notes-input">Coach Notes / Source Text / Custom Prompt</label>
                  <textarea
                    id="ai-notes-input"
                    className="gh-input pb-textarea"
                    rows={3}
                    placeholder="e.g. Focus on rapid low-fidelity prototyping, emphasize safety with cutting mats, and frame questions around sharkskin drag reduction..."
                    value={aiNotes}
                    onChange={(e) => setAiNotes(e.target.value)}
                  />
                </div>

                <div className="pb-ai-btn-row">
                  <button
                    type="button"
                    className="gh-btn gh-btn-primary"
                    disabled={aiLoading}
                    onClick={() => handleGenerate('all')}
                  >
                    <Sparkles size={15} aria-hidden="true" />
                    {aiLoading ? 'Generating…' : 'Generate All Materials'}
                  </button>
                  <button
                    type="button"
                    className="gh-btn gh-btn-secondary"
                    disabled={aiLoading}
                    onClick={() => handleGenerate('slides')}
                  >
                    <Presentation size={15} aria-hidden="true" /> Slides Only
                  </button>
                  <button
                    type="button"
                    className="gh-btn gh-btn-secondary"
                    disabled={aiLoading}
                    onClick={() => handleGenerate('quiz')}
                  >
                    <HelpCircle size={15} aria-hidden="true" /> Concept Quiz Only
                  </button>
                </div>

                {/* Quick Refinements */}
                {((stageData.slides?.length > 0) || (stageData.quiz?.length > 0)) && (
                  <div className="pb-refinements-bar">
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gh-text-2)' }}>Refine with 1-click:</span>
                    <button
                      type="button"
                      className="pb-refine-pill"
                      disabled={aiLoading}
                      onClick={() => handleGenerate('all', 'simpler')}
                    >
                      🌱 Simpler language (Ages 11–13)
                    </button>
                    <button
                      type="button"
                      className="pb-refine-pill"
                      disabled={aiLoading}
                      onClick={() => handleGenerate('all', 'less-text')}
                    >
                      ✂️ Less text (Punchy bullets)
                    </button>
                    <button
                      type="button"
                      className="pb-refine-pill"
                      disabled={aiLoading}
                      onClick={() => handleGenerate('all', 'add-challenge')}
                    >
                      🚀 Add a challenge
                    </button>
                  </div>
                )}

                {aiError && (
                  <div className="pb-ai-alert is-error">
                    <AlertCircle size={15} aria-hidden="true" /> {aiError}
                  </div>
                )}
                {aiSuccessMessage && (
                  <div className="pb-ai-alert is-success">
                    <CheckCircle2 size={15} aria-hidden="true" /> {aiSuccessMessage}
                  </div>
                )}
              </div>

              {/* Editable Slides Section */}
              {Array.isArray(stageData.slides) && stageData.slides.length > 0 && (
                <div style={{ marginTop: '1.2rem' }}>
                  <h4 style={{ fontSize: '0.92rem', marginBottom: '0.6rem' }}>
                    Generated Slides ({stageData.slides.length})
                  </h4>
                  <div className="pb-slides-editor-list">
                    {stageData.slides.map((slide, sIdx) => (
                      <div key={slide.id || sIdx} className="gh-card pb-slide-edit-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span className="pb-badge-pill">Slide {slide.slideNumber || sIdx + 1}</span>
                          <button
                            type="button"
                            className="gh-btn gh-btn-ghost gh-btn-sm"
                            onClick={() => {
                              setStageData({
                                ...stageData,
                                slides: stageData.slides.filter((_, i) => i !== sIdx)
                              });
                            }}
                          >
                            <Trash2 size={13} aria-hidden="true" /> Remove
                          </button>
                        </div>
                        <input
                          className="gh-input"
                          style={{ fontWeight: 700, marginBottom: '0.4rem' }}
                          value={slide.heading || ''}
                          onChange={(e) => {
                            const copy = [...stageData.slides];
                            copy[sIdx] = { ...copy[sIdx], heading: e.target.value };
                            setStageData({ ...stageData, slides: copy });
                          }}
                          placeholder="Slide heading"
                        />
                        <textarea
                          className="gh-input pb-textarea"
                          rows={3}
                          value={(slide.bullets || []).join('\n')}
                          onChange={(e) => {
                            const copy = [...stageData.slides];
                            copy[sIdx] = { ...copy[sIdx], bullets: e.target.value.split('\n') };
                            setStageData({ ...stageData, slides: copy });
                          }}
                          placeholder="One bullet point per line"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editable Quiz Section */}
              {Array.isArray(stageData.quiz) && stageData.quiz.length > 0 && (
                <div style={{ marginTop: '1.2rem' }}>
                  <h4 style={{ fontSize: '0.92rem', marginBottom: '0.6rem' }}>
                    Concept Quiz Questions ({stageData.quiz.length})
                  </h4>
                  <div className="pb-quiz-editor-list">
                    {stageData.quiz.map((q, qIdx) => (
                      <div key={q.id || qIdx} className="gh-card pb-quiz-edit-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <strong>Question {qIdx + 1}</strong>
                          <button
                            type="button"
                            className="gh-btn gh-btn-ghost gh-btn-sm"
                            onClick={() => {
                              setStageData({
                                ...stageData,
                                quiz: stageData.quiz.filter((_, i) => i !== qIdx)
                              });
                            }}
                          >
                            <Trash2 size={13} aria-hidden="true" /> Remove
                          </button>
                        </div>
                        <input
                          className="gh-input"
                          value={q.prompt || ''}
                          onChange={(e) => {
                            const copy = [...stageData.quiz];
                            copy[qIdx] = { ...copy[qIdx], prompt: e.target.value };
                            setStageData({ ...stageData, quiz: copy });
                          }}
                          placeholder="Question prompt"
                        />
                        <div style={{ display: 'grid', gap: '0.35rem', marginTop: '0.5rem' }}>
                          {(q.options || []).map((opt, oIdx) => (
                            <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <input
                                type="radio"
                                name={`correct-${q.id || qIdx}`}
                                checked={q.correctIndex === oIdx}
                                onChange={() => {
                                  const copy = [...stageData.quiz];
                                  copy[qIdx] = { ...copy[qIdx], correctIndex: oIdx };
                                  setStageData({ ...stageData, quiz: copy });
                                }}
                                title="Mark as correct answer"
                              />
                              <input
                                className="gh-input"
                                value={opt}
                                onChange={(e) => {
                                  const copy = [...stageData.quiz];
                                  const opts = [...copy[qIdx].options];
                                  opts[oIdx] = e.target.value;
                                  copy[qIdx] = { ...copy[qIdx], options: opts };
                                  setStageData({ ...stageData, quiz: copy });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: '0.4rem' }}>
                          <label style={{ fontSize: '0.78rem', color: 'var(--gh-text-3)' }}>Explanation (Formative Feedback):</label>
                          <input
                            className="gh-input"
                            value={q.explanation || ''}
                            onChange={(e) => {
                              const copy = [...stageData.quiz];
                              copy[qIdx] = { ...copy[qIdx], explanation: e.target.value };
                              setStageData({ ...stageData, quiz: copy });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Review & Publish */}
          {activeTab === 'publish' && (
            <div className="pb-tab-pane">
              <div className="pb-sub-card">
                <h4 className="pb-sub-card-title">
                  <Save size={16} aria-hidden="true" />
                  <span>Review Stage Snapshot</span>
                </h4>
                <p className="pb-sub">
                  Verify your changes before publishing. Students only see published stages.
                </p>

                <div className="pb-stage-summary-box">
                  <div className="pb-summary-stat">
                    <strong>{stageData.title}</strong>
                    <span>Stage Title</span>
                  </div>
                  <div className="pb-summary-stat">
                    <strong>{stageData.videos?.length || 0}</strong>
                    <span>Attached Videos</span>
                  </div>
                  <div className="pb-summary-stat">
                    <strong>{stageData.slides?.length || 0}</strong>
                    <span>Visual Slides</span>
                  </div>
                  <div className="pb-summary-stat">
                    <strong>{stageData.quiz?.length || 0}</strong>
                    <span>Quiz Questions</span>
                  </div>
                  <div className="pb-summary-stat">
                    <strong>{stageData.checklist?.length || 0}</strong>
                    <span>Checklist Tasks</span>
                  </div>
                </div>

                <div className="pb-field" style={{ marginTop: '1rem' }}>
                  <label className="gh-label" htmlFor="stage-status-select">Publishing Status</label>
                  <select
                    id="stage-status-select"
                    className="gh-select"
                    value={stageData.status || 'published'}
                    onChange={(e) => setStageData({ ...stageData, status: e.target.value })}
                  >
                    <option value="published">Published (Visible to students & coaches)</option>
                    <option value="draft">Draft (Visible to coaches only in preview mode)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pb-modal-footer">
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {onOpenPreview && (
              <button
                type="button"
                className="gh-btn gh-btn-secondary"
                onClick={() => {
                  onClose();
                  onOpenPreview(currentIdx);
                }}
              >
                <Eye size={15} aria-hidden="true" /> Student Preview
              </button>
            )}
            {saveSuccess && (
              <span style={{ fontSize: '0.85rem', color: 'var(--gh-green-text)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={15} /> Saved successfully!
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" className="gh-btn gh-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="gh-btn gh-btn-primary"
              disabled={isSaving}
              onClick={handleSave}
            >
              <Save size={15} aria-hidden="true" />
              {isSaving ? 'Saving…' : 'Save Stage'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
