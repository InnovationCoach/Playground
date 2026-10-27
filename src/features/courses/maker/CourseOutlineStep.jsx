import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, CheckCircle2, AlertTriangle, RefreshCw, Layers, ArrowUp, ArrowDown } from 'lucide-react';
import { WELEARN_DT_FRAMEWORK } from '../../pbl/programs/libraryProgramsData.js';
import { draftCourseOutline } from './courseMakerAiService.js';

export function CourseOutlineStep({ course, onChange }) {
  const [generating, setGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState({ state: 'idle', message: '' });

  const hasMilestones = Array.isArray(course.milestones) && course.milestones.length > 0;
  const milestones = hasMilestones ? course.milestones : defaultMilestones();

  // The default outline was shown but never saved, so step 4 found no milestones. Save what is shown.
  useEffect(() => {
    if (!hasMilestones) onChange({ milestones });
  }, [hasMilestones]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateMilestone = (idx, patch) => {
    const next = [...milestones];
    next[idx] = { ...next[idx], ...patch };
    onChange({ milestones: next });
  };

  const handleAddMilestone = () => {
    const nextIdx = milestones.length;
    const phaseInfo = WELEARN_DT_FRAMEWORK.phases[nextIdx % 8];
    const newM = {
      id: `ms-${Date.now()}-${nextIdx}`,
      phaseId: phaseInfo.id,
      stageNumber: nextIdx + 1,
      title: `${phaseInfo.label}: New Stage`,
      week: Math.min(12, nextIdx + 1),
      durationMin: 90,
      learningGoal: '',
      activities: [],
      makerSpaceTools: [],
      deliverables: [],
      evidencePrompt: '',
      coachCue: '',
      targetCompetencies: ['sdl-01', 'ctps-01'],
      isAiGenerated: false,
      approvedByCoach: true
    };
    onChange({ milestones: [...milestones, newM] });
  };

  const handleRemoveMilestone = (idx) => {
    const next = milestones.filter((_, i) => i !== idx);
    onChange({ milestones: next });
  };

  const handleMoveMilestone = (idx, dir) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= milestones.length) return;
    const next = [...milestones];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    onChange({ milestones: next });
  };

  // AI-assisted outline generation
  const handleGenerateAiOutline = async () => {
    setGenerating(true);
    setAiStatus({ state: 'working', message: 'Synthesizing 8-stage outline from your basics and sources…' });
    try {
      const result = await draftCourseOutline({
        courseBasics: course,
        sources: course.sources || [],
        onProgress: (msg) => setAiStatus({ state: 'working', message: msg })
      });

      if (result.success && Array.isArray(result.milestones)) {
        onChange({ milestones: result.milestones });
        setAiStatus({
          state: 'success',
          message: `Outline ready (${result.source}). Review each stage and approve before detailed lesson generation.`
        });
      } else {
        setAiStatus({
          state: 'error',
          message: 'AI outline drafting was interrupted. You can retry or continue editing manually.'
        });
      }
    } catch (err) {
      setAiStatus({
        state: 'error',
        message: `AI drafting failed: ${err.message}. Your existing outline was preserved. You can continue manually.`
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveAll = () => {
    const next = milestones.map((m) => ({ ...m, approvedByCoach: true }));
    onChange({ milestones: next });
  };

  return (
    <div className="cm-step cm-step-outline">
      <div className="cm-section-head cm-flex-between">
        <div>
          <h2 className="cm-section-title">Step 3 — Course Outline & Milestones</h2>
          <p className="cm-section-desc">
            Organize modules and project milestones across the 8-stage Design Thinking framework.
          </p>
        </div>
        <div className="cm-actions-group">
          <button
            type="button"
            className="cm-btn cm-btn-ai"
            onClick={handleGenerateAiOutline}
            disabled={generating}
          >
            {generating ? <RefreshCw size={15} className="cm-spin" /> : <Sparkles size={15} />}
            {generating ? 'Drafting…' : 'AI-Assisted Outline Draft'}
          </button>
        </div>
      </div>

      {/* AI Status / Notification banner */}
      {aiStatus.state === 'working' && (
        <div className="cm-banner cm-banner-working" role="status">
          <RefreshCw size={16} className="cm-spin" />
          <span>{aiStatus.message}</span>
        </div>
      )}
      {aiStatus.state === 'error' && (
        <div className="cm-banner cm-banner-error" role="alert">
          <AlertTriangle size={16} />
          <div>
            <strong>AI Notice:</strong> {aiStatus.message}
          </div>
          <button
            type="button"
            className="cm-btn cm-btn-xs cm-btn-secondary"
            onClick={handleGenerateAiOutline}
          >
            Retry AI Draft
          </button>
        </div>
      )}
      {aiStatus.state === 'success' && (
        <div className="cm-banner cm-banner-success" role="status">
          <CheckCircle2 size={16} />
          <span>{aiStatus.message}</span>
          <button type="button" className="cm-link-btn" onClick={handleApproveAll}>
            Approve All Stages
          </button>
        </div>
      )}

      {/* Milestones list */}
      <div className="cm-milestones-container">
        {milestones.map((m, idx) => {
          const isAi = m.isAiGenerated && !m.approvedByCoach;
          return (
            <div key={m.id || idx} className={`cm-milestone-card ${isAi ? 'cm-ai-unapproved' : ''}`}>
              <div className="cm-ms-header">
                <div className="cm-ms-badge-group">
                  <span className="cm-stage-chip">{m.phaseId || `Stage ${idx + 1}`}</span>
                  <span className="cm-week-tag">Week {m.week || idx + 1}</span>
                  {isAi && (
                    <span className="cm-ai-tag">
                      <Sparkles size={12} /> AI Suggestion
                    </span>
                  )}
                  {m.approvedByCoach && (
                    <span className="cm-approved-tag">
                      <CheckCircle2 size={12} /> Approved
                    </span>
                  )}
                </div>

                <div className="cm-ms-actions">
                  <button
                    type="button"
                    className="cm-icon-btn"
                    onClick={() => handleMoveMilestone(idx, -1)}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="cm-icon-btn"
                    onClick={() => handleMoveMilestone(idx, 1)}
                    disabled={idx === milestones.length - 1}
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    className="cm-icon-btn cm-btn-danger"
                    onClick={() => handleRemoveMilestone(idx)}
                    title="Remove stage"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="cm-ms-body">
                <div className="cm-field">
                  <label htmlFor={`ms-title-${idx}`} className="cm-label">Milestone Title</label>
                  <input
                    id={`ms-title-${idx}`}
                    type="text"
                    className="cm-input"
                    value={m.title || ''}
                    onChange={(e) => handleUpdateMilestone(idx, { title: e.target.value })}
                  />
                </div>

                <div className="cm-field">
                  <label htmlFor={`ms-goal-${idx}`} className="cm-label">Learning Goal / Focus</label>
                  <input
                    id={`ms-goal-${idx}`}
                    type="text"
                    className="cm-input"
                    placeholder="What will learners understand or investigate during this stage?"
                    value={m.learningGoal || ''}
                    onChange={(e) => handleUpdateMilestone(idx, { learningGoal: e.target.value })}
                  />
                </div>

                {isAi && (
                  <div className="cm-ms-approval-bar">
                    <span className="cm-hint">Review this AI suggestion before generating detailed lesson plans.</span>
                    <button
                      type="button"
                      className="cm-btn cm-btn-xs cm-btn-secondary"
                      onClick={() => handleUpdateMilestone(idx, { approvedByCoach: true })}
                    >
                      <CheckCircle2 size={13} /> Approve Stage
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="cm-add-ms-bar">
        <button type="button" className="cm-btn cm-btn-secondary" onClick={handleAddMilestone}>
          <Plus size={15} /> Add Stage / Milestone
        </button>
      </div>
    </div>
  );
}

function defaultMilestones() {
  return WELEARN_DT_FRAMEWORK.phases.map((p, idx) => ({
    id: `stage-${p.id}`,
    phaseId: p.id,
    stageNumber: idx + 1,
    title: `${p.label} Milestone`,
    week: Math.min(12, idx + 1),
    durationMin: 90,
    learningGoal: '',
    activities: [],
    makerSpaceTools: [],
    deliverables: [],
    evidencePrompt: '',
    coachCue: '',
    targetCompetencies: ['sdl-01', 'ctps-01'],
    isAiGenerated: false,
    approvedByCoach: true
  }));
}
