import { useState } from 'react';
import {
  Users, CheckCircle2, Clock, AlertTriangle, ArrowRight, Sparkles,
  Award, Shield, ExternalLink, Activity, BookOpen, Wrench, Eye
} from 'lucide-react';
import { STUDENT_2E_PROFILES } from '../studio/learnerProfiles.js';
import { hrefFor } from '../../../app/routes.js';

const WELEARN_8_STAGES = [
  'Curiosity', 'Research', 'Ideation', 'Prototype',
  'Testing', 'Iteration', 'Polish', 'Showcase'
];

export function LearnerSupervisionView({ onSelectLearnerForStudio, onGoToEvaluation }) {
  const [selectedCohort, setSelectedCohort] = useState('all');

  // Hardcoded cohort metrics representative of SPARK Innovation Lab
  const learners = STUDENT_2E_PROFILES;
  const activeCount = learners.length;
  const pendingEvals = 2; // Liam & Maya

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
            <span className="cp-metric-lbl">Active 2e Learners</span>
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
            <span className="cp-metric-val">88%</span>
            <span className="cp-metric-lbl">PBL Milestone On-Track</span>
          </div>
        </div>

        <div className="cp-metric-card">
          <div className="cp-metric-icon icon-purple">
            <Sparkles size={20} />
          </div>
          <div className="cp-metric-info">
            <span className="cp-metric-val">100%</span>
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

        <div className="cp-learner-grid">
          {learners.map((learner, idx) => {
            // Representative mock stage positions for the 4 learners
            const currentStageIndex = idx === 0 ? 3 : idx === 1 ? 2 : idx === 2 ? 4 : 1;
            const currentStage = WELEARN_8_STAGES[currentStageIndex];
            const pct = Math.round(((currentStageIndex + 1) / 8) * 100);

            return (
              <div key={learner.id} className="cp-learner-card">
                <div className="cp-learner-head">
                  <div className="cp-avatar-badge">{learner.avatar}</div>
                  <div className="cp-learner-name-block">
                    <h3 className="cp-learner-name">{learner.name}</h3>
                    <span className="cp-learner-grade">{learner.grade} • {learner.diagnosisTraits.split('(')[0]}</span>
                  </div>
                  <span className={`cp-status-pill ${idx < 2 ? 'status-pending' : 'status-active'}`}>
                    {idx < 2 ? 'Submission Pending' : 'Prototyping'}
                  </span>
                </div>

                {/* Consuming Passion & Hurdle Highlights */}
                <div className="cp-learner-tags">
                  <div className="cp-tag-row">
                    <span className="cp-tag-label">Consuming Passion:</span>
                    <span className="cp-tag-value">{learner.consumingPassions}</span>
                  </div>
                  <div className="cp-tag-row">
                    <span className="cp-tag-label">EF Accommodation:</span>
                    <span className="cp-tag-hurdle">{learner.hurdleBadges[0]} (Applied)</span>
                  </div>
                </div>

                {/* 8-Stage PBL Progress Visualizer */}
                <div className="cp-progress-section">
                  <div className="cp-progress-header">
                    <span className="cp-progress-title">
                      Stage {currentStageIndex + 1}/8: <strong>{currentStage}</strong>
                    </span>
                    <span className="cp-progress-pct">{pct}% Complete</span>
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
                    onClick={() => onSelectLearnerForStudio?.(learner.id)}
                  >
                    <Sparkles size={14} /> Open in Studio
                  </button>

                  <button
                    className="cp-btn-primary"
                    onClick={() => onGoToEvaluation?.(learner.id)}
                  >
                    <CheckCircle2 size={14} /> Evaluate Work
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
