import { useState, useEffect } from 'react';
import {
  Video, GitBranch, Box, FileText, CheckCircle2, Clock, Sparkles,
  ExternalLink, Award, AlertCircle, MessageSquare, Send, Check
} from 'lucide-react';
import { getEvaluations, approveSubmission, requestRevisionSubmission } from './evaluationsStore.js';
import { confettiFrom, buzz } from '../../goals/celebrate.js';

export function EvaluationDeskView({ coachUser, onOpenStudioWithLearner }) {
  const [evaluations, setEvaluations] = useState(() => getEvaluations());
  const [filterType, setFilterType] = useState('all'); // 'all' | 'pending' | 'approved' | 'video' | 'github' | 'prototype' | 'reflection'
  const [feedbackTexts, setFeedbackTexts] = useState({});

  useEffect(() => {
    const handleUpdate = () => {
      setEvaluations(getEvaluations());
    };
    window.addEventListener('hearisland-evaluations-updated', handleUpdate);
    return () => window.removeEventListener('hearisland-evaluations-updated', handleUpdate);
  }, []);

  const handleFeedbackChange = (id, text) => {
    setFeedbackTexts((prev) => ({ ...prev, [id]: text }));
  };

  const handleApprove = (item, e) => {
    const triggerEl = e.currentTarget;
    const text = feedbackTexts[item.id] || item.coachCue || '';
    approveSubmission(item.id, {
      feedback: text,
      xp: 100,
      coachName: coachUser?.displayName || 'Coach'
    });
    confettiFrom(triggerEl, { big: true });
    buzz([25, 50, 25]);
  };

  const handleRequestRevision = (item) => {
    const text = feedbackTexts[item.id] || 'Please refine telemetry or add brief notes.';
    requestRevisionSubmission(item.id, { guidance: text });
    buzz(30);
  };

  const filtered = evaluations.filter((item) => {
    if (filterType === 'pending') return item.status === 'pending';
    if (filterType === 'approved') return item.status === 'approved';
    if (filterType === 'video') return Boolean(item.submissions?.video);
    if (filterType === 'github') return Boolean(item.submissions?.github);
    if (filterType === 'prototype') return Boolean(item.submissions?.prototype);
    if (filterType === 'reflection') return Boolean(item.submissions?.reflection);
    return true;
  });

  const pendingCount = evaluations.filter((e) => e.status === 'pending').length;

  return (
    <div className="cp-eval-desk">
      {/* Desk Subheader / Filter Bar */}
      <div className="cp-eval-header">
        <div>
          <h2 className="cp-section-title">Evaluation Desk</h2>
          <p className="cp-section-desc">
            Review multi-modal deliverables, verify MakerSpace hardware tests, and award milestone XP.
          </p>
        </div>

        <div className="cp-filter-tabs">
          <button
            className={`cp-filter-tab ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Submissions ({evaluations.length})
          </button>
          <button
            className={`cp-filter-tab ${filterType === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterType('pending')}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            className={`cp-filter-tab ${filterType === 'video' ? 'active' : ''}`}
            onClick={() => setFilterType('video')}
          >
            <Video size={13} /> Video Demos
          </button>
          <button
            className={`cp-filter-tab ${filterType === 'github' ? 'active' : ''}`}
            onClick={() => setFilterType('github')}
          >
            <GitBranch size={13} /> GitHub Code
          </button>
          <button
            className={`cp-filter-tab ${filterType === 'prototype' ? 'active' : ''}`}
            onClick={() => setFilterType('prototype')}
          >
            <Box size={13} /> MakerSpace Bench
          </button>
          <button
            className={`cp-filter-tab ${filterType === 'reflection' ? 'active' : ''}`}
            onClick={() => setFilterType('reflection')}
          >
            <FileText size={13} /> Reflections
          </button>
        </div>
      </div>

      {/* Submissions Feed */}
      <div className="cp-eval-feed">
        {filtered.length === 0 ? (
          <div className="cp-eval-empty">
            <CheckCircle2 size={32} />
            <p>No submissions found for the selected filter.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isApproved = item.status === 'approved';
            const subs = item.submissions || {};

            return (
              <article key={item.id} className={`cp-eval-card ${isApproved ? 'approved' : 'pending'}`}>
                {/* Header: Student Profile & Milestone Context */}
                <div className="cp-eval-card-header">
                  <div className="cp-eval-student-info">
                    <span className="cp-avatar-badge">{item.avatar}</span>
                    <div>
                      <div className="cp-eval-name-line">
                        <span className="cp-eval-student-name">{item.studentName}</span>
                        <span className="cp-eval-trait-pill">{item.traits}</span>
                        <span className="cp-eval-stage-pill">
                          Milestone {item.sessionNumber}: {item.milestoneStage}
                        </span>
                      </div>
                      <h3 className="cp-eval-project-title">
                        {item.projectTitle} — <span className="cp-eval-milestone-title">{item.milestoneTitle}</span>
                      </h3>
                    </div>
                  </div>

                  <div className="cp-eval-status-group">
                    {isApproved ? (
                      <span className="cp-eval-approved-badge">
                        <CheckCircle2 size={14} /> Approved (+{item.xpAwarded} XP)
                      </span>
                    ) : (
                      <span className="cp-eval-pending-badge">
                        <Clock size={14} /> Awaiting Review
                      </span>
                    )}
                  </div>
                </div>

                {/* Multi-Modal Evidence Body */}
                <div className="cp-eval-evidence-grid">
                  {/* 1. Video Evidence */}
                  {subs.video && (
                    <div className="cp-evidence-box video-box">
                      <div className="cp-evidence-head">
                        <Video size={15} /> <strong>Video Walkthrough</strong>
                        <span className="cp-evidence-meta">{subs.video.duration}</span>
                      </div>
                      <p className="cp-evidence-title">{subs.video.title}</p>
                      <a
                        href={subs.video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="cp-evidence-link"
                      >
                        Watch Video Demo <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {/* 2. GitHub / Code Evidence */}
                  {subs.github && (
                    <div className="cp-evidence-box github-box">
                      <div className="cp-evidence-head">
                        <GitBranch size={15} /> <strong>GitHub Repository</strong>
                        <span className="cp-evidence-meta">{subs.github.branch}</span>
                      </div>
                      <p className="cp-evidence-title">{subs.github.commit}</p>
                      <a
                        href={subs.github.url}
                        target="_blank"
                        rel="noreferrer"
                        className="cp-evidence-link"
                      >
                        Inspect Commit Diff <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {/* 3. Physical MakerSpace Prototype Evidence */}
                  {subs.prototype && (
                    <div className="cp-evidence-box bench-box">
                      <div className="cp-evidence-head">
                        <Box size={15} /> <strong>MakerSpace Bench Register</strong>
                        <span className="cp-evidence-meta">{subs.prototype.assetTag}</span>
                      </div>
                      <p className="cp-evidence-title">{subs.prototype.station}</p>
                      <p className="cp-evidence-desc">{subs.prototype.spec}</p>
                      {subs.prototype.verifiedSafety && (
                        <span className="cp-safety-badge">
                          <Check size={11} /> Lab Safety Checklist Verified
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Student Reflection Journal */}
                {subs.reflection && (
                  <div className="cp-reflection-quote">
                    <div className="cp-reflection-label">
                      <FileText size={13} /> <strong>Learner Reflection Journal:</strong>
                    </div>
                    <blockquote className="cp-reflection-text">"{subs.reflection}"</blockquote>
                  </div>
                )}

                {/* Targeted Competencies */}
                <div className="cp-competencies-row">
                  <span className="cp-comp-label">Target Competencies:</span>
                  {item.competencies?.map((c) => (
                    <span key={c} className="cp-comp-pill">{c}</span>
                  ))}
                </div>

                {/* Formative Assessment & Grading Desk */}
                <div className="cp-grading-action-bar">
                  <div className="cp-coach-cue-box">
                    <div className="cp-cue-header">
                      <Sparkles size={13} /> <strong>AI Grounded Coach Cue:</strong>
                    </div>
                    <p className="cp-cue-text">{item.coachCue}</p>
                  </div>

                  {!isApproved && (
                    <div className="cp-eval-feedback-input-wrap">
                      <textarea
                        className="cp-eval-feedback-input"
                        placeholder="Leave formative feedback or technical guidance for the student..."
                        value={feedbackTexts[item.id] !== undefined ? feedbackTexts[item.id] : item.coachFeedback}
                        onChange={(e) => handleFeedbackChange(item.id, e.target.value)}
                        rows={2}
                      />
                      <div className="cp-eval-buttons">
                        <button
                          type="button"
                          className="cp-btn-revision"
                          onClick={() => handleRequestRevision(item)}
                        >
                          Request Re-draft
                        </button>
                        <button
                          type="button"
                          className="cp-btn-approve"
                          onClick={(e) => handleApprove(item, e)}
                        >
                          <CheckCircle2 size={16} /> Approve & Award +100 XP
                        </button>
                      </div>
                    </div>
                  )}

                  {isApproved && item.coachFeedback && (
                    <div className="cp-approved-feedback">
                      <strong>Coach Feedback:</strong> {item.coachFeedback}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
