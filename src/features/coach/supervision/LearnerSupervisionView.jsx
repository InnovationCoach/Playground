import { useState } from 'react';
import {
  Users, CheckCircle2, Clock, AlertTriangle, ArrowRight, Sparkles,
  Award, Shield, ExternalLink, Activity, BookOpen, Wrench, Eye
} from 'lucide-react';
import { hrefFor } from '../../../app/routes.js';
import '../studio/coachStudio.css';

const WELEARN_8_STAGES = [
  'Curiosity', 'Research', 'Ideation', 'Prototype',
  'Testing', 'Iteration', 'Polish', 'Showcase'
];

export function LearnerSupervisionView({
  learners: providedLearners,
  submissions = [],
  onSelectLearnerForStudio,
  onGoToEvaluation
}) {
  const [selectedCohort, setSelectedCohort] = useState('all');

  const learners = Array.isArray(providedLearners) ? providedLearners : [];
  const activeCount = learners.filter(l => !l.isTest).length;
  const pendingEvals = (submissions || []).filter(e => e.status === 'pending').length;

  const accomCount = learners.filter(l => Array.isArray(l.appliedAccommodations) && l.appliedAccommodations.length > 0).length;
  const accomPercent = learners.length > 0 ? Math.round((accomCount / learners.length) * 100) : 0;

  return (
    <div className="cp-supervision-view">
      {/* Executive Overview Row */}
      <section className="cp-metrics-bar" aria-label="Cohort Progress Overview">
        <div className="cp-metric-card">
          <div className="cp-metric-icon icon-blue">
            <Users size={20} />
          </div>
          <div className="cp-metric-info">
            <span className="cp-metric-val">{activeCount}</span>
            <span className="cp-metric-lbl">Active learners</span>
          </div>
        </div>

        <div className="cp-metric-card">
          <div className="cp-metric-icon icon-amber">
            <Clock size={20} />
          </div>
          <div className="cp-metric-info">
            <span className="cp-metric-val">{pendingEvals}</span>
            <span className="cp-metric-lbl">Submissions Awaiting Review</span>
          </div>
          {pendingEvals > 0 && (
            <button className="cp-metric-btn" onClick={() => onGoToEvaluation?.()}>
              Grade Now <ArrowRight size={13} />
            </button>
          )}
        </div>

        <div className="cp-metric-card">
          <div className="cp-metric-icon icon-green">
            <CheckCircle2 size={20} />
          </div>
          <div className="cp-metric-info">
            {/* No milestone data feeds this yet; a dash, not a made-up 100%. */}
            <span className="cp-metric-val">—</span>
            <span className="cp-metric-lbl">PBL milestone tracking not connected yet</span>
          </div>
        </div>

        <div className="cp-metric-card">
          <div className="cp-metric-icon icon-purple">
            <Sparkles size={20} />
          </div>
          <div className="cp-metric-info">
            <span className="cp-metric-val">{accomPercent}%</span>
            <span className="cp-metric-lbl">2e Grounded Accommodations</span>
          </div>
        </div>
      </section>

      {/* Roster & Supervision Cards */}
      <div className="cp-supervision-main">
        <div className="cp-section-header">
          <div>
            <h2 className="cp-section-title">Learner Progress & 8-Stage PBL Cycle</h2>
            <p className="cp-section-desc">
              Supervise real-time milestone execution, executive function accommodations, and MakerSpace tool readiness.
            </p>
          </div>
        </div>

        {learners.length === 0 ? (
          <div className="cp-eval-empty">
            <Users size={32} />
            <p>No active students enrolled in this class.</p>
          </div>
        ) : (
          <div className="cp-learner-grid">
            {learners.map((learner) => {
              const learnerId = learner.id || learner.uid;
              const hasStage = typeof learner.currentStageIndex === 'number';
              const currentStageIndex = hasStage ? Math.max(0, Math.min(7, learner.currentStageIndex)) : -1;
              const currentStage = WELEARN_8_STAGES[currentStageIndex];
              const pct = Math.round(((currentStageIndex + 1) / 8) * 100);

              const diagnosisSummary = Array.isArray(learner.diagnosisTraits)
                ? learner.diagnosisTraits.join(', ')
                : learner.diagnosisTraits;

              const hurdleBadge = (learner.hurdleBadges && learner.hurdleBadges[0])
                || (Array.isArray(learner.executiveFunctionHurdles) ? learner.executiveFunctionHurdles[0] : learner.executiveFunctionHurdles)
                || (learner.appliedAccommodations && learner.appliedAccommodations[0])
                || 'None recorded';

              const passions = Array.isArray(learner.consumingPassions) && learner.consumingPassions.length > 0
                ? learner.consumingPassions.join(', ')
                : (learner.consumingPassions || learner.interests || 'None recorded');

              const hasPending = (submissions || []).some(s => s.studentId === learnerId && s.status === 'pending');

              return (
                <div key={learnerId} className="cp-learner-card">
                  <div className="cp-learner-head">
                    <div className="cp-avatar-badge">{learner.avatar || '👤'}</div>
                    <div className="cp-learner-name-block">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 className="cp-learner-name">{learner.name || learner.displayName}</h3>
                        {learner.isTest && (
                          <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                            TEST
                          </span>
                        )}
                      </div>
                      <span className="cp-learner-grade">{[learner.grade || learner.yearLevel, diagnosisSummary].filter(Boolean).join(' • ')}</span>
                    </div>
                    <span className={`cp-status-pill ${hasPending ? 'status-pending' : 'status-active'}`}>
                      {hasPending ? 'Submission Pending' : 'Active'}
                    </span>
                  </div>

                  {/* Consuming Passion & Hurdle Highlights */}
                  <div className="cp-learner-tags">
                    <div className="cp-tag-row">
                      <span className="cp-tag-label">Consuming Passion:</span>
                      <span className="cp-tag-value">{passions}</span>
                    </div>
                    <div className="cp-tag-row">
                      <span className="cp-tag-label">EF Accommodation:</span>
                      <span className="cp-tag-hurdle">{hurdleBadge}</span>
                    </div>
                  </div>

                  {/* 8-Stage PBL Progress Visualizer */}
                  <div className="cp-progress-section">
                    <div className="cp-progress-header">
                      {hasStage ? (
                        <>
                          <span className="cp-progress-title">
                            Stage {currentStageIndex + 1}/8: <strong>{currentStage}</strong>
                          </span>
                          <span className="cp-progress-pct">{pct}% Complete</span>
                        </>
                      ) : (
                        <span className="cp-progress-title">No stage recorded yet</span>
                      )}
                    </div>

                    <div className="cp-stage-track">
                      {WELEARN_8_STAGES.map((stg, i) => {
                        const isDone = i < currentStageIndex;
                        const isCurrent = i === currentStageIndex;
                        return (
                          <div
                            key={stg}
                            className={`cp-stage-bar ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                            title={`Stage ${i + 1}: ${stg}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="cp-card-footer">
                    <button
                      className="cp-btn-secondary"
                      onClick={() => onSelectLearnerForStudio?.(learnerId)}
                    >
                      <Sparkles size={14} /> Open in Studio
                    </button>

                    <button
                      className="cp-btn-primary"
                      onClick={() => onGoToEvaluation?.(learnerId)}
                    >
                      <CheckCircle2 size={14} /> Evaluate Work
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
