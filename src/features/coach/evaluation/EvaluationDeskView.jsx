import { useState, useEffect } from 'react';
import {
  Video, GitBranch, Box, FileText, CheckCircle2, Clock, Sparkles,
  ExternalLink, Award, AlertCircle, MessageSquare, Send, Check, Play
} from 'lucide-react';
import { getEvaluations, approveSubmission, requestRevisionSubmission } from './evaluationsStore.js';
import { confettiFrom, buzz } from '../../goals/celebrate.js';

export function EvaluationDeskView({ coachUser, onOpenStudioWithLearner }) {
  const [evaluations, setEvaluations] = useState(() => getEvaluations());
  const [filterType, setFilterType] = useState('all'); // 'all' | 'pending' | 'approved' | 'video' | 'github' | 'prototype' | 'reflection'
  const [feedbackTexts, setFeedbackTexts] = useState({});
  const [previewItem, setPreviewItem] = useState(null);

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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPreviewItem({
                            type: 'video',
                            title: subs.video.title,
                            duration: subs.video.duration,
                            author: item.studentName,
                            project: item.projectTitle
                          });
                        }}
                        className="cp-evidence-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Watch Video Demo <ExternalLink size={12} />
                      </button>
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPreviewItem({
                            type: 'github',
                            repo: subs.github.repo,
                            branch: subs.github.branch,
                            commit: subs.github.commit,
                            author: item.studentName,
                            project: item.projectTitle
                          });
                        }}
                        className="cp-evidence-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Inspect Commit Diff <ExternalLink size={12} />
                      </button>
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

      {/* In-App Multi-Modal Deliverable Preview Modal (Prevents Dead Mock URLs) */}
      {previewItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 16, maxWidth: 640, width: '100%', padding: '1.5rem', color: '#f8fafc', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {previewItem.type === 'video' ? <Video size={20} color="#38bdf8" /> : <GitBranch size={20} color="#a78bfa" />}
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                  {previewItem.type === 'video' ? 'Bench Walkthrough Video Demo' : 'Student Code Repository & Commit Diff'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              Learner: <strong style={{ color: '#fff' }}>{previewItem.author}</strong> • Project: <strong style={{ color: '#38bdf8' }}>{previewItem.project}</strong>
            </p>

            {previewItem.type === 'video' ? (
              <div style={{ background: '#0f172a', borderRadius: 12, border: '1px solid #334155', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#38bdf8' }}>
                  <Play size={28} />
                </div>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', color: '#fff' }}>{previewItem.title}</h4>
                <span style={{ fontSize: '0.8rem', background: '#334155', padding: '2px 8px', borderRadius: 6, color: '#94a3b8' }}>Recorded Duration: {previewItem.duration}</span>
                <div style={{ marginTop: '1rem', background: '#1e293b', padding: '1rem', borderRadius: 8, textAlign: 'left', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <strong>Bench Telemetry Transcript:</strong>
                  <p style={{ margin: '0.5rem 0 0', fontStyle: 'italic', color: '#94a3b8' }}>
                    "Testing ultrasonic sensor obstacle feedback at 20Hz. Motor PWM cleanly throttles down when distance drops below 15cm without micro:bit power brownouts."
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ background: '#0f172a', borderRadius: 12, border: '1px solid #334155', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                  <span>Repo: <strong style={{ color: '#a78bfa' }}>{previewItem.repo}</strong> ({previewItem.branch})</span>
                </div>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{previewItem.commit}</p>
                <pre style={{ margin: 0, background: '#000', padding: '1rem', borderRadius: 8, fontSize: '0.82rem', overflowX: 'auto', color: '#34d399', fontFamily: 'monospace' }}>
{`@@ -14,6 +14,12 @@ def loop():
+    # Ultrasonic throttle dampener
+    dist = sensor.distance_cm()
+    if dist < 15:
+        motor.throttle(0.0)
+    else:
+        motor.throttle(min(1.0, dist / 50.0))`}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                style={{ background: '#334155', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
