import { useState, useEffect, useCallback } from 'react';
import {
  Video, GitBranch, Box, FileText, CheckCircle2, Clock, Sparkles,
  ExternalLink, Award, AlertCircle, MessageSquare, Send, Check, Play
} from 'lucide-react';
import { fetchSubmissions, approveSubmission, requestRevisionSubmission, STUDENT_SUBMISSIONS_CONNECTED } from './evaluationsStore.js';
import { confettiFrom, buzz } from '../../goals/celebrate.js';

export function EvaluationDeskView({ coachUser, onOpenStudioWithLearner }) {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'pending' | 'approved' | 'video' | 'github' | 'prototype' | 'reflection'
  const [feedbackTexts, setFeedbackTexts] = useState({});
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loadLiveSubmissions = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const classIds = Array.isArray(coachUser?.classIds) ? coachUser.classIds : [];
      const list = await fetchSubmissions({ classIds });
      setEvaluations(list);
    } catch (err) {
      console.warn('[EvaluationDeskView] Error loading submissions:', err);
      setEvaluations([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [coachUser?.classIds]);

  useEffect(() => {
    loadLiveSubmissions();
    const handleUpdate = () => {
      loadLiveSubmissions();
    };
    window.addEventListener('hearisland-evaluations-updated', handleUpdate);
    return () => window.removeEventListener('hearisland-evaluations-updated', handleUpdate);
  }, [loadLiveSubmissions]);

  const handleFeedbackChange = (id, text) => {
    setFeedbackTexts((prev) => ({ ...prev, [id]: text }));
  };

  const handleApprove = async (item, e) => {
    const triggerEl = e.currentTarget;
    const text = feedbackTexts[item.id] || item.coachCue || '';
    setActionError(null);
    try {
      await approveSubmission(item.id, {
        feedback: text,
        xp: 100,
        coachUid: coachUser?.uid || '',
        coachName: coachUser?.displayName || 'Coach'
      });
      confettiFrom(triggerEl, { big: true });
      buzz([25, 50, 25]);
      loadLiveSubmissions();
    } catch (err) {
      console.warn('[EvaluationDeskView] Approve failed:', err);
      setActionError(`${item.studentName}'s work was not approved. Check your connection and try again.`);
    }
  };

  const handleRequestRevision = async (item) => {
    const text = feedbackTexts[item.id] || 'Please refine telemetry or add brief notes.';
    setActionError(null);
    try {
      await requestRevisionSubmission(item.id, {
        guidance: text,
        coachUid: coachUser?.uid || '',
        coachName: coachUser?.displayName || 'Coach'
      });
      buzz(30);
      loadLiveSubmissions();
    } catch (err) {
      console.warn('[EvaluationDeskView] Revision request failed:', err);
      setActionError(`The revision request for ${item.studentName} was not sent. Check your connection and try again.`);
    }
  };

  const filtered = evaluations.filter((item) => {
    if (filterType === 'pending') return item.status === 'pending';
    if (filterType === 'approved') return item.status === 'approved';
    if (filterType === 'video') return Boolean(item.submissions?.video?.url);
    if (filterType === 'github') return Boolean(item.submissions?.github?.url);
    if (filterType === 'prototype') return Boolean(item.submissions?.prototype?.assetTag || item.submissions?.prototype?.station);
    if (filterType === 'reflection') return Boolean(item.submissions?.reflection);
    return true;
  });

  const pendingCount = evaluations.filter((e) => e.status === 'pending').length;

  return (
    <div className="cp-eval-desk">
      {/* Desk Subheader / Filter Bar */}
      <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--gh-text-1, #e0f2fe)', fontSize: '0.85rem' }}>
        <strong>Pipeline Notice:</strong> Student submission flow is not connected yet (Contract 9). Once learners submit deliverables through their daily tasks, reviews will appear here.
      </div>
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

      {!STUDENT_SUBMISSIONS_CONNECTED && (
        <p className="cp-eval-notice" role="status">
          <strong>Not yet connected.</strong> Students can't send milestone work to this desk yet, so it stays empty.
          Submissions will appear here once milestone submission is switched on.
        </p>
      )}

      {/* Submissions Feed */}
      {actionError && <p className="cw-warning" role="alert">{actionError}</p>}
      <div className="cp-eval-feed">
        {loading ? (
          <div className="cp-eval-empty">
            <Clock size={32} />
            <p>Loading real student submissions...</p>
          </div>
        ) : loadError ? (
          <div className="cp-eval-empty" role="alert">
            <AlertCircle size={32} />
            <p>Submissions couldn't be loaded, so this isn't an empty queue.</p>
            <button type="button" className="cp-btn-secondary" onClick={loadLiveSubmissions}>Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="cp-eval-empty">
            <CheckCircle2 size={32} />
            <p>{evaluations.length === 0 ? 'No submissions yet.' : 'No submissions found for the selected filter.'}</p>
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
                        {item.traits && <span className="cp-eval-trait-pill">{item.traits}</span>}
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
                  {subs.video?.url && (
                    <div className="cp-evidence-box video-box">
                      <div className="cp-evidence-head">
                        <Video size={15} /> <strong>Video Walkthrough</strong>
                        {subs.video.duration && <span className="cp-evidence-meta">{subs.video.duration}</span>}
                      </div>
                      <p className="cp-evidence-title">{subs.video.title || 'Video Demo'}</p>
                      <a
                        href={subs.video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cp-evidence-link"
                      >
                        Watch Video Demo <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {/* 2. GitHub / Code Evidence */}
                  {subs.github?.url && (
                    <div className="cp-evidence-box github-box">
                      <div className="cp-evidence-head">
                        <GitBranch size={15} /> <strong>GitHub Repository</strong>
                        {subs.github.branch && <span className="cp-evidence-meta">{subs.github.branch}</span>}
                      </div>
                      <p className="cp-evidence-title">{subs.github.commit || subs.github.repo || 'Code Repository'}</p>
                      <a
                        href={subs.github.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cp-evidence-link"
                      >
                        Inspect Code Repository <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {/* 3. Physical MakerSpace Prototype Evidence */}
                  {(subs.prototype?.assetTag || subs.prototype?.station) && (
                    <div className="cp-evidence-box bench-box">
                      <div className="cp-evidence-head">
                        <Box size={15} /> <strong>MakerSpace Bench Register</strong>
                        {subs.prototype.assetTag && <span className="cp-evidence-meta">{subs.prototype.assetTag}</span>}
                      </div>
                      <p className="cp-evidence-title">{subs.prototype.station || 'MakerSpace'}</p>
                      {subs.prototype.spec && <p className="cp-evidence-desc">{subs.prototype.spec}</p>}
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
                {item.competencies && item.competencies.length > 0 && (
                  <div className="cp-competencies-row">
                    <span className="cp-comp-label">Target Competencies:</span>
                    {item.competencies.map((c) => (
                      <span key={c} className="cp-comp-pill">{c}</span>
                    ))}
                  </div>
                )}

                {/* Formative Assessment & Grading Desk */}
                <div className="cp-grading-action-bar">
                  {item.coachCue && (
                    <div className="cp-coach-cue-box">
                      <div className="cp-cue-header">
                        <Sparkles size={13} /> <strong>AI Grounded Coach Cue:</strong>
                      </div>
                      <p className="cp-cue-text">{item.coachCue}</p>
                    </div>
                  )}

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
