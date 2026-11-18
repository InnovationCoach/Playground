import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, Sparkles, Eye, Rocket,
  BookOpen, Award, Check, ExternalLink, HelpCircle
} from 'lucide-react';
import { checkCurriculumAlignment } from './courseAlignmentValidator.js';
import { competencyById } from '../../pbl/content/competencies.js';

export function CourseAlignmentStep({ course, onPublish, publishing, publishError, publishResult }) {
  const [showLearnerPreview, setShowLearnerPreview] = useState(false);
  const [coachConsent, setCoachConsent] = useState(false);

  const alignment = useMemo(() => checkCurriculumAlignment(course), [course]);

  const canPublish = alignment.isValid && coachConsent && !publishing;

  return (
    <div className="cm-step cm-step-alignment">
      <div className="cm-section-head">
        <h2 className="cm-section-title">Step 5 — Curriculum Alignment & Publication</h2>
        <p className="cm-section-desc">
          Review the full alignment matrix for <strong>{course.title || 'Course'}</strong> connecting learning objectives to activities, evidence deliverables, and framework competencies.
        </p>
      </div>

      {/* Alignment Stats Overview */}
      <div className="cm-alignment-stats">
        <div className="cm-stat-card">
          <span className="cm-stat-value">{alignment.stats.alignmentPercentage}%</span>
          <span className="cm-stat-label">Objective Coverage</span>
        </div>
        <div className="cm-stat-card">
          <span className="cm-stat-value">
            {alignment.stats.coveredObjectives} / {alignment.stats.totalObjectives}
          </span>
          <span className="cm-stat-label">Objectives Mapped</span>
        </div>
        <div className="cm-stat-card">
          <span className="cm-stat-value">
            {alignment.stats.assessedCompetencies} / {alignment.stats.totalCompetencies}
          </span>
          <span className="cm-stat-label">Competencies Assessed</span>
        </div>
        <div className="cm-stat-card">
          <span className="cm-stat-value">
            {alignment.stats.aiDraftMilestones === 0 ? '100%' : `${alignment.stats.totalMilestones - alignment.stats.aiDraftMilestones}/${alignment.stats.totalMilestones}`}
          </span>
          <span className="cm-stat-label">Coach Reviewed</span>
        </div>
      </div>

      {/* Warnings & Errors */}
      {alignment.errors.length > 0 && (
        <div className="cm-alert cm-alert-error" role="alert">
          <AlertCircle size={20} />
          <div>
            <strong>Validation Errors (Publication Blocked):</strong>
            <ul>
              {alignment.errors.map((e, i) => (
                <li key={i}>{e.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {alignment.warnings.length > 0 && (
        <div className="cm-alert cm-alert-warning" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Alignment Recommendations:</strong>
            <ul>
              {alignment.warnings.map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Alignment Matrix Table */}
      <div className="cm-section-block">
        <div className="cm-block-head">
          <h3 className="cm-block-title">
            <ShieldCheck size={18} className="cm-accent-icon" /> Curriculum Alignment Matrix
          </h3>
          <span className="cm-hint">Objective ➔ Activities ➔ Evidence ➔ Competencies</span>
        </div>

        <div className="cm-table-responsive">
          <table className="cm-matrix-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Learning Objective</th>
                <th style={{ width: '20%' }}>Aligned Stage / Milestone</th>
                <th style={{ width: '26%' }}>Evidence & Deliverables</th>
                <th style={{ width: '20%' }}>Assessed Competencies</th>
                <th style={{ width: '12%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {alignment.matrix.map((row, i) => {
                const milestone = row.matchedMilestones[0];
                return (
                  <tr key={i} className={!row.hasCoverage ? 'cm-row-uncovered' : ''}>
                    <td className="cm-td-obj">
                      <strong>{i + 1}.</strong> {row.objectiveText}
                      {!row.hasCoverage && (
                        <span className="cm-inline-warning">No aligned stage found</span>
                      )}
                    </td>
                    <td>
                      {milestone ? (
                        <div>
                          <strong>{milestone.title}</strong>
                          <span className="cm-sub-text">({milestone.phaseId})</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      {milestone?.evidence ? (
                        <span className="cm-evidence-text">{milestone.evidence}</span>
                      ) : '—'}
                    </td>
                    <td>
                      {milestone?.competencies?.length > 0 ? (
                        <div className="cm-matrix-comps">
                          {milestone.competencies.map((cName, idx) => (
                            <span key={idx} className="cm-matrix-comp-chip">{cName}</span>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      {milestone?.approved ? (
                        <span className="cm-approved-pill"><Check size={11} /> Approved</span>
                      ) : milestone ? (
                        <span className="cm-ai-pill"><Sparkles size={11} /> AI Suggestion</span>
                      ) : (
                        <span className="cm-missing-pill">Missing</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Learner Preview Action */}
      <div className="cm-preview-action-card">
        <div>
          <h4><Eye size={18} /> Learner Experience Preview</h4>
          <p>Inspect how this course, its weekly timeline, and deliverables appear to students in the WeLearn platform.</p>
        </div>
        <button
          type="button"
          className="cm-btn cm-btn-outline"
          onClick={() => setShowLearnerPreview(true)}
        >
          <Eye size={15} /> Open Learner Preview
        </button>
      </div>

      {/* Publication Form */}
      <div className="cm-publish-box">
        <h3 className="cm-publish-title"><Rocket size={18} /> Course Publication</h3>
        <p className="cm-hint">
          Publishing makes this course available in the student catalog (`#/search` and `#/courses`) and allows direct assignment to student rosters.
        </p>

        <label className="cm-consent-checkbox">
          <input
            type="checkbox"
            checked={coachConsent}
            onChange={(e) => setCoachConsent(e.target.checked)}
          />
          <span>
            I have reviewed the learning objectives, activities, and evidence requirements. I approve this course curriculum and its educational alignment.
          </span>
        </label>

        {publishError && (
          <div className="cm-alert cm-alert-error" role="alert">
            <AlertCircle size={16} />
            <span>Publish failed: {publishError}</span>
          </div>
        )}

        {publishResult?.success && (
          <div className="cm-alert cm-alert-success" role="status">
            <CheckCircle2 size={18} />
            <div>
              <strong>Course Published Successfully!</strong>
              <p>The course is now live in the student catalog.</p>
              <div className="cm-publish-links">
                <a href={publishResult.studentUrl} className="cm-link-btn" target="_blank" rel="noreferrer">
                  Open Course Page <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="cm-publish-actions">
          <button
            type="button"
            className="cm-btn cm-btn-primary cm-btn-lg"
            onClick={onPublish}
            disabled={!canPublish}
          >
            {publishing ? 'Publishing Course…' : 'Publish Course to Catalog'}
          </button>
        </div>
      </div>

      {/* Learner Preview Modal */}
      {showLearnerPreview && (
        <div className="cm-modal-overlay" onClick={() => setShowLearnerPreview(false)}>
          <div className="cm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-head">
              <h3><Eye size={18} /> Learner Preview: {course.title}</h3>
              <button
                type="button"
                className="cm-icon-btn"
                onClick={() => setShowLearnerPreview(false)}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div className="cm-modal-body">
              <div className="cm-learner-hero">
                <span className="cm-badge-tag approved">{course.cohort || 'Secondary PBL'}</span>
                <h2>{course.title}</h2>
                <p className="cm-learner-lead">{course.drivingQuestion || course.theme}</p>
                <div className="cm-learner-meta">
                  <span>⏱ Duration: {course.durationWeeks} Weeks</span>
                  <span>🏆 {(course.competencies || []).length} Competencies Targeted</span>
                </div>
              </div>

              <h4>Milestone Journey ({course.milestones?.length || 0} Stages)</h4>
              <div className="cm-preview-timeline">
                {(course.milestones || []).map((m, idx) => (
                  <div key={idx} className="cm-preview-stage-card">
                    <div className="cm-stage-pill">{m.phaseId || `Stage ${idx + 1}`}</div>
                    <div className="cm-stage-content">
                      <h5>Week {m.week || idx + 1}: {m.title}</h5>
                      <p><strong>Goal:</strong> {m.learningGoal}</p>
                      {m.activities?.length > 0 && (
                        <ul>
                          {m.activities.map((a, aIdx) => <li key={aIdx}>{a}</li>)}
                        </ul>
                      )}
                      <div className="cm-preview-evidence">
                        <strong>Evidence required:</strong> {m.evidencePrompt || 'Artifact submission'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="cm-modal-foot">
              <button type="button" className="cm-btn cm-btn-secondary" onClick={() => setShowLearnerPreview(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
