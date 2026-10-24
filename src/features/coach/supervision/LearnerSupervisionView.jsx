import { CheckCircle2, Sparkles, Users, ArrowRight } from 'lucide-react';

/** The eight stages of the PBL cycle, in order. Learners show the stage they are in. */
const STAGES = ['Curiosity', 'Empathise', 'Define', 'Ideate', 'Prototype', 'Test', 'Reflect', 'Showcase'];

/**
 * Learners from the coach's own classes. Nothing is invented: a learner with no
 * stage yet says so, and an empty list shows an empty state, not sample people.
 */
export function LearnerSupervisionView({ learners = [], pendingEvals = 0, onSelectLearnerForStudio, onGoToEvaluation }) {
  return (
    <div className="cp-supervision-view">
      <section className="cp-metrics-bar" aria-label="Overview">
        <div className="cp-metric-card">
          <div className="cp-metric-icon icon-blue"><Users size={20} aria-hidden="true" /></div>
          <div className="cp-metric-info">
            <span className="cp-metric-label">Learners</span>
            <span className="cp-metric-val">{learners.length}</span>
          </div>
        </div>

        <div className="cp-metric-card">
          <div className="cp-metric-info">
            <span className="cp-metric-label">Awaiting review</span>
            <span className="cp-metric-val">{pendingEvals}</span>
          </div>
          {pendingEvals > 0 && (
            <button type="button" className="cp-metric-btn" onClick={() => onGoToEvaluation?.()}>
              Review now <ArrowRight size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {learners.length === 0 ? (
        <section className="cp-card" aria-label="No learners yet">
          <p className="cp-empty-title">No learners in your classes yet.</p>
          <p className="cp-muted">When learners join with your class code, they appear here.</p>
        </section>
      ) : (
        <div className="cp-learner-grid">
          {learners.map((learner) => (
            <article key={learner.id} className="cp-learner-card">
              <header className="cp-learner-head">
                <div className="cp-avatar-badge" aria-hidden="true">{initials(learner.name)}</div>
                <div className="cp-learner-name-block">
                  <h3 className="cp-learner-name">{learner.name}</h3>
                  {learner.yearLevel && <span className="cp-learner-grade">{learner.yearLevel}</span>}
                </div>
              </header>

              {learner.consumingPassions && (
                <p className="cp-learner-line"><span className="cp-tag-label">Passion</span> {learner.consumingPassions}</p>
              )}
              {learner.appliedAccommodations?.length > 0 && (
                <p className="cp-learner-line"><span className="cp-tag-label">Accommodations</span> {learner.appliedAccommodations.join('; ')}</p>
              )}

              <StageLine stageIndex={learner.stageIndex} />

              <footer className="cp-card-footer">
                <button type="button" className="cp-btn-secondary" onClick={() => onSelectLearnerForStudio?.(learner.id)}>
                  <Sparkles size={14} aria-hidden="true" /> Open in course studio
                </button>
                <button type="button" className="cp-btn-primary" onClick={() => onGoToEvaluation?.(learner.id)}>
                  <CheckCircle2 size={14} aria-hidden="true" /> Review work
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function StageLine({ stageIndex }) {
  if (!Number.isInteger(stageIndex) || stageIndex < 0 || stageIndex > 7) {
    return <p className="cp-muted">Not started yet.</p>;
  }
  return (
    <div className="cp-progress-section">
      <p className="cp-progress-title">Stage {stageIndex + 1} of 8: <strong>{STAGES[stageIndex]}</strong></p>
      <div className="cp-stage-track" aria-hidden="true">
        {STAGES.map((name, i) => (
          <span key={name} className={`cp-stage-bar${i < stageIndex ? ' done' : ''}${i === stageIndex ? ' current' : ''}`} />
        ))}
      </div>
    </div>
  );
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase() || '?';
}
