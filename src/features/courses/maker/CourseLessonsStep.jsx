import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, CheckCircle2, AlertTriangle, RefreshCw, Wrench, FileCheck, Check, Info } from 'lucide-react';
import { draftSingleLesson } from './courseMakerAiService.js';
import { competencyById } from '../../pbl/content/competencies.js';

export function CourseLessonsStep({ course, onChange }) {
  const milestones = Array.isArray(course.milestones) ? course.milestones : [];
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);

  const activeMilestone = milestones[selectedIdx] || milestones[0] || null;

  const updateActiveMilestone = (patch) => {
    if (!activeMilestone) return;
    const next = [...milestones];
    next[selectedIdx] = { ...activeMilestone, ...patch };
    onChange({ milestones: next });
  };

  // Activity list management
  const activities = Array.isArray(activeMilestone?.activities) && activeMilestone.activities.length > 0
    ? activeMilestone.activities
    : [''];

  const handleUpdateActivity = (i, val) => {
    const next = [...activities];
    next[i] = val;
    updateActiveMilestone({ activities: next });
  };

  const handleAddActivity = () => {
    updateActiveMilestone({ activities: [...activities, ''] });
  };

  const handleRemoveActivity = (i) => {
    const next = activities.filter((_, idx) => idx !== i);
    updateActiveMilestone({ activities: next.length > 0 ? next : [''] });
  };

  // MakerSpace tools management
  const tools = Array.isArray(activeMilestone?.makerSpaceTools) ? activeMilestone.makerSpaceTools : [];
  const [newTool, setNewTool] = useState('');

  const handleAddTool = (e) => {
    e.preventDefault();
    if (!newTool.trim()) return;
    updateActiveMilestone({ makerSpaceTools: [...tools, newTool.trim()] });
    setNewTool('');
  };

  const handleRemoveTool = (toolName) => {
    updateActiveMilestone({ makerSpaceTools: tools.filter((t) => t !== toolName) });
  };

  // AI draft single lesson without overwriting approved work
  const handleDraftLessonWithAi = async () => {
    if (!activeMilestone) return;
    if (activeMilestone.approvedByCoach && activeMilestone.activities?.length > 1) {
      const confirm = window.confirm(
        'This lesson is already approved by you. Drafting with AI will update unapproved fields. Do you want to proceed?'
      );
      if (!confirm) return;
    }

    setGenerating(true);
    setAiNotice(null);
    try {
      const res = await draftSingleLesson({
        stageIndex: selectedIdx,
        courseBasics: course,
        sources: course.sources || [],
        existingMilestone: activeMilestone
      });

      if (res.success && res.milestone) {
        // Merge without overwriting coach's custom title or approved notes
        const merged = {
          ...activeMilestone,
          learningGoal: activeMilestone.learningGoal || res.milestone.learningGoal,
          activities: res.milestone.activities,
          makerSpaceTools: Array.from(new Set([...tools, ...(res.milestone.makerSpaceTools || [])])),
          evidencePrompt: res.milestone.evidencePrompt,
          deliverables: res.milestone.deliverables,
          coachCue: res.milestone.coachCue,
          targetCompetencies: Array.from(new Set([
            ...(activeMilestone.targetCompetencies || []),
            ...(res.milestone.targetCompetencies || [])
          ])),
          isAiGenerated: true,
          approvedByCoach: false
        };
        updateActiveMilestone(merged);
        setAiNotice({
          kind: 'success',
          message: `AI suggestions generated for "${activeMilestone.title}". Review and approve each activity and evidence prompt below.`
        });
      }
    } catch (err) {
      setAiNotice({
        kind: 'error',
        message: `Failed to generate lesson: ${err.message}. Your existing lesson content is preserved.`
      });
    } finally {
      setGenerating(false);
    }
  };

  const courseCompetencies = course.competencies || [];

  return (
    <div className="cm-step cm-step-lessons">
      <div className="cm-section-head">
        <h2 className="cm-section-title">Step 4 — Lessons, Activities & Assessments</h2>
        <p className="cm-section-desc">
          Configure activities, tools, evidence deliverables, and assessments for each stage.
        </p>
      </div>

      <div className="cm-lessons-layout">
        {/* Stages Sidebar */}
        <aside className="cm-lessons-nav" aria-label="Stages List">
          <h4 className="cm-nav-heading">Course Milestones</h4>
          <div className="cm-nav-list" role="tablist">
            {milestones.map((m, idx) => {
              const isSelected = idx === selectedIdx;
              const isApproved = m.approvedByCoach;
              const hasContent = (m.activities?.filter(Boolean).length || 0) > 0 && Boolean(m.evidencePrompt);
              return (
                <button
                  key={m.id || idx}
                  type="button"
                  className={`cm-nav-item ${isSelected ? 'active' : ''}`}
                  onClick={() => { setSelectedIdx(idx); setAiNotice(null); }}
                  role="tab"
                  aria-selected={isSelected}
                >
                  <div className="cm-nav-item-top">
                    <span className="cm-stage-num">{idx + 1}</span>
                    <span className="cm-nav-title">{m.title || `Stage ${idx + 1}`}</span>
                  </div>
                  <div className="cm-nav-item-meta">
                    {isApproved ? (
                      <span className="cm-badge-tag approved"><Check size={11} /> Approved</span>
                    ) : m.isAiGenerated ? (
                      <span className="cm-badge-tag ai"><Sparkles size={11} /> AI Draft</span>
                    ) : hasContent ? (
                      <span className="cm-badge-tag complete">Ready</span>
                    ) : (
                      <span className="cm-badge-tag pending">Needs detail</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Detailed Lesson Editor */}
        <main className="cm-lesson-detail">
          {activeMilestone ? (
            <div>
              {/* Header */}
              <div className="cm-detail-head">
                <div>
                  <span className="cm-stage-chip">{activeMilestone.phaseId || `Stage ${selectedIdx + 1}`}</span>
                  <h3 className="cm-detail-title">{activeMilestone.title}</h3>
                </div>
                <div className="cm-detail-actions">
                  <button
                    type="button"
                    className="cm-btn cm-btn-ai"
                    onClick={handleDraftLessonWithAi}
                    disabled={generating}
                  >
                    {generating ? <RefreshCw size={14} className="cm-spin" /> : <Sparkles size={14} />}
                    {generating ? 'Drafting…' : 'AI Draft This Lesson'}
                  </button>
                  {!activeMilestone.approvedByCoach ? (
                    <button
                      type="button"
                      className="cm-btn cm-btn-secondary"
                      onClick={() => updateActiveMilestone({ approvedByCoach: true })}
                    >
                      <CheckCircle2 size={15} /> Approve Lesson
                    </button>
                  ) : (
                    <span className="cm-approved-badge">
                      <CheckCircle2 size={14} /> Coach Approved
                    </span>
                  )}
                </div>
              </div>

              {aiNotice && (
                <div className={`cm-banner cm-banner-${aiNotice.kind}`}>
                  {aiNotice.kind === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{aiNotice.message}</span>
                </div>
              )}

              {/* Learning Goal */}
              <div className="cm-field">
                <label htmlFor="detail-goal" className="cm-label">Lesson Learning Goal</label>
                <textarea
                  id="detail-goal"
                  className="cm-textarea"
                  rows={2}
                  value={activeMilestone.learningGoal || ''}
                  onChange={(e) => updateActiveMilestone({ learningGoal: e.target.value })}
                />
              </div>

              {/* Activities */}
              <div className="cm-section-block">
                <div className="cm-block-head">
                  <h4 className="cm-block-title">Hands-on Activities & Experiments</h4>
                  <span className="cm-hint">{activities.filter(Boolean).length} tasks</span>
                </div>
                <div className="cm-activities-list">
                  {activities.map((act, i) => (
                    <div key={i} className="cm-act-row">
                      <span className="cm-act-num">•</span>
                      <input
                        type="text"
                        className="cm-input"
                        placeholder="e.g. Deploy soil capacitive moisture probes across three test beds."
                        value={act}
                        onChange={(e) => handleUpdateActivity(i, e.target.value)}
                      />
                      <button
                        type="button"
                        className="cm-icon-btn cm-btn-danger"
                        onClick={() => handleRemoveActivity(i)}
                        title="Remove activity"
                        disabled={activities.length <= 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className="cm-btn cm-btn-secondary cm-btn-sm" onClick={handleAddActivity}>
                  <Plus size={13} /> Add Activity
                </button>
              </div>

              {/* MakerSpace Tools & Equipment */}
              <div className="cm-section-block">
                <h4 className="cm-block-title"><Wrench size={16} /> MakerSpace Tools & Apparatus</h4>
                <div className="cm-tools-list">
                  {tools.map((t) => (
                    <span key={t} className="cm-tool-pill">
                      {t}
                      <button type="button" onClick={() => handleRemoveTool(t)}>×</button>
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddTool} className="cm-add-tool-form">
                  <input
                    type="text"
                    className="cm-input cm-input-sm"
                    placeholder="Add tool (e.g. 3D Printer, Multimeter, ESP32, Python IDE)…"
                    value={newTool}
                    onChange={(e) => setNewTool(e.target.value)}
                  />
                  <button type="submit" className="cm-btn cm-btn-outline cm-btn-sm" disabled={!newTool.trim()}>
                    Add Tool
                  </button>
                </form>
              </div>

              {/* Evidence & Assessment */}
              <div className="cm-section-block cm-assessment-block">
                <h4 className="cm-block-title"><FileCheck size={16} /> Evidence Requirements & Assessment</h4>
                <div className="cm-field">
                  <label htmlFor="detail-evidence" className="cm-label">
                    Evidence Prompt (What must the learner submit?)
                  </label>
                  <textarea
                    id="detail-evidence"
                    className="cm-textarea"
                    rows={3}
                    placeholder="e.g. Upload a 60-second video explaining thermal decay curves or submit sensor telemetry CSV with calibration notes."
                    value={activeMilestone.evidencePrompt || ''}
                    onChange={(e) => updateActiveMilestone({ evidencePrompt: e.target.value, deliverables: [e.target.value] })}
                  />
                </div>

                <div className="cm-field">
                  <label htmlFor="detail-coach-cue" className="cm-label">Coach Intervention Cue</label>
                  <input
                    id="detail-coach-cue"
                    type="text"
                    className="cm-input"
                    placeholder="e.g. Prompt learners to explain why their sensor drifted before giving the answer."
                    value={activeMilestone.coachCue || ''}
                    onChange={(e) => updateActiveMilestone({ coachCue: e.target.value })}
                  />
                </div>

                {/* Target Competencies for this milestone */}
                <div className="cm-field">
                  <label className="cm-label">Target Competencies for this Stage</label>
                  <div className="cm-comp-chips">
                    {courseCompetencies.map((cId) => {
                      const comp = competencyById(cId);
                      const isAssessed = (activeMilestone.targetCompetencies || []).includes(cId);
                      return (
                        <button
                          key={cId}
                          type="button"
                          className={`cm-comp-chip ${isAssessed ? 'selected' : ''}`}
                          onClick={() => {
                            const cur = activeMilestone.targetCompetencies || [];
                            const next = isAssessed ? cur.filter((x) => x !== cId) : [...cur, cId];
                            updateActiveMilestone({ targetCompetencies: next });
                          }}
                        >
                          <strong>{comp?.code || cId}</strong>: {comp?.title || cId}
                          {isAssessed && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="cm-muted">No milestone selected.</p>
          )}
        </main>
      </div>
    </div>
  );
}
