import { useState } from 'react';
import { normalizeLesson, STEP_TYPES } from './lessonModel.js';
import { LearningMedia as LessonMedia } from '../media/LearningMedia.jsx';
import { CheckCircle2, Circle, Clock, ArrowRight, BookOpen, Award, Check, HelpCircle } from 'lucide-react';

export function LearnerLessonView({ lesson: rawLesson, template, onClose, onComplete }) {
  const lesson = normalizeLesson(rawLesson);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(() => new Set());

  if (!lesson) return null;

  const steps = lesson.steps || [];
  const currentStep = steps[activeStepIndex] || steps[0];
  const stepTypeInfo = STEP_TYPES.find(t => t.id === currentStep?.type) || STEP_TYPES[1];

  const milestoneTitle = template?.milestones?.find(m => m.id === lesson.milestoneId)?.title || 'Milestone';

  function toggleStepComplete(idx) {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
        if (idx < steps.length - 1) {
          setActiveStepIndex(idx + 1);
        }
      }
      return next;
    });
  }

  const isAllComplete = steps.length > 0 && steps.every((_, i) => completedSteps.has(i));

  return (
    <div className="sw-learner-lesson" aria-label={`Lesson: ${lesson.title}`}>
      <header className="sw-learner-header">
        <div className="sw-learner-meta">
          <span className="sw-badge">{milestoneTitle}</span>
          <span className="sw-time-badge"><Clock size={14} aria-hidden="true" /> {lesson.estimatedMinutes} min</span>
          <span className="sw-status-badge">{lesson.status === 'published' ? 'Published' : 'Draft'}</span>
        </div>
        <h2 className="sw-learner-title">{lesson.title}</h2>
        {lesson.outcome && (
          <div className="sw-outcome-callout">
            <strong>🎯 What am I learning?</strong>
            <p>{lesson.outcome}</p>
          </div>
        )}

        {lesson.competencies?.length > 0 && (
          <div className="sw-competency-row">
            <span className="sw-competency-label"><Award size={14} aria-hidden="true" /> Competencies:</span>
            <div className="sw-competency-chips">
              {lesson.competencies.map(c => (
                <span key={c.id} className="sw-comp-chip" title={`${c.title}: ${c.statement}`}>
                  <strong>{c.code || c.id}</strong> {c.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Step Progress Tracker */}
      <nav className="sw-step-tracker" aria-label="Lesson steps">
        <div className="sw-step-progress-bar">
          <div
            className="sw-step-progress-fill"
            style={{ width: `${(completedSteps.size / Math.max(1, steps.length)) * 100}%` }}
          />
        </div>
        <ol className="sw-step-nav-list">
          {steps.map((s, idx) => {
            const isCompleted = completedSteps.has(idx);
            const isActive = idx === activeStepIndex;
            return (
              <li key={s.id || idx}>
                <button
                  type="button"
                  className={`sw-step-nav-btn ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => setActiveStepIndex(idx)}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="sw-step-nav-icon">
                    {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </span>
                  <span className="sw-step-nav-text">
                    <strong>Step {idx + 1}</strong>
                    <span>{s.title}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Active Step Workspace */}
      {currentStep && (
        <section className="sw-step-active-card" aria-labelledby="active-step-heading">
          <div className="sw-step-card-header">
            <div className="sw-step-badge-group">
              <span className="sw-step-type-pill" title={stepTypeInfo.hint}>
                {stepTypeInfo.icon} {stepTypeInfo.label}
              </span>
              <span className="sw-step-duration">
                <Clock size={13} aria-hidden="true" /> {currentStep.durationMinutes || 15} min
              </span>
            </div>
            <h3 id="active-step-heading">
              Step {activeStepIndex + 1}: {currentStep.title}
            </h3>
          </div>

          <div className="sw-step-body sw-preserve">
            {currentStep.instructions || 'Follow the coach instructions provided in class.'}
          </div>

          {/* Role Cards Breakdown if present in text */}
          <RoleCards text={currentStep.instructions} />

          {/* Attachments if any */}
          {lesson.attachments?.length > 0 && (
            <div className="sw-step-media-box">
              <h4>Lesson resources & media</h4>
              <LessonMedia attachments={lesson.attachments} />
            </div>
          )}

          <div className="sw-step-actions">
            <button
              type="button"
              className={`gh-btn ${completedSteps.has(activeStepIndex) ? 'gh-btn-ghost' : 'gh-btn-primary'}`}
              onClick={() => toggleStepComplete(activeStepIndex)}
            >
              {completedSteps.has(activeStepIndex) ? (
                <>✓ Step completed (click to undo)</>
              ) : (
                <>Complete step {activeStepIndex + 1} & continue <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </section>
      )}

      {/* Success Criteria Section */}
      {lesson.successCriteria?.length > 0 && (
        <section className="sw-criteria-card">
          <h4>✅ How will I know I have mastered it?</h4>
          <ul>
            {lesson.successCriteria.map((criterion, idx) => (
              <li key={idx}>{criterion}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Evidence & Submission Info */}
      {lesson.evidenceSpec && (
        <section className="sw-evidence-spec-card">
          <h4>📦 Evidence and submission</h4>
          <p>
            <strong>Mode:</strong> {lesson.evidenceSpec.type === 'team' ? 'Team Project' : 'Individual Submission'} ·{' '}
            <strong>Reviewer:</strong> {lesson.evidenceSpec.reviewer || 'Coach'}
          </p>
        </section>
      )}

      {/* Persistent Help & Bottom Bar */}
      <footer className="sw-learner-footer">
        <p className="sw-help-hint">
          <HelpCircle size={15} aria-hidden="true" /> Need help? Ask your assigned coach in class or send a message.
        </p>
        {onClose && (
          <button type="button" className="gh-btn gh-btn-ghost" onClick={onClose}>
            Back to lesson list
          </button>
        )}
      </footer>
    </div>
  );
}

/**
 * Extracts and displays structured role cards if the instructions mention
 * role-based specialization (e.g., Architecture, Energy, Agriculture, Water/Waste).
 */
function RoleCards({ text }) {
  if (!text) return null;

  // Look for role headers or bullet points like "Architecture:", "Energy:", etc.
  const roleKeywords = ['Architecture', 'Energy', 'Agriculture', 'Waste', 'Water', 'Structure', 'Drivetrain', 'Electronics'];
  const found = roleKeywords.filter(keyword => new RegExp(`\\b${keyword}\\b:?`, 'i').test(text));

  if (found.length < 2) return null;

  return (
    <div className="sw-roles-accordion">
      <h4>Specialist roles for this activity</h4>
      <p className="sw-muted">Choose your team role and review your specific responsibilities:</p>
      <div className="sw-roles-grid">
        {found.map(role => (
          <details key={role} className="sw-role-card">
            <summary><strong>{role} Specialist</strong></summary>
            <p>Focus on {role.toLowerCase()} requirements, calculations, and constraints for your team design.</p>
          </details>
        ))}
      </div>
    </div>
  );
}
