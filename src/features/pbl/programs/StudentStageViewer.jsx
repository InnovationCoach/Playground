import { useState } from 'react';
import {
  Eye, Video, Presentation, HelpCircle, Wrench, CheckSquare, ChevronLeft, ChevronRight,
  Info, ExternalLink, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2, XCircle
} from 'lucide-react';

export function StudentStageViewer({
  stage,
  program,
  isPreview = false,
  progress = null,
  apply = null,
  onExitPreview = null,
  onOpenEditor = null
}) {
  if (!stage) {
    return (
      <div className="gh-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No stage selected.</p>
      </div>
    );
  }

  // Active sub-view or tab within the stage viewer
  const [activeTab, setActiveTab] = useState('overview');

  // Video playback state
  const videos = Array.isArray(stage.videos) ? stage.videos : [];
  const [selectedVideoIdx, setSelectedVideoIdx] = useState(0);
  const activeVideo = videos[selectedVideoIdx] || videos[0];

  // Slides carousel state
  const slides = Array.isArray(stage.slides) ? stage.slides : [];
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const activeSlide = slides[currentSlideIdx] || slides[0];

  // Quiz state (interactive simulation in preview, local state)
  const quizItems = Array.isArray(stage.quiz) ? stage.quiz : [];
  const [quizAnswers, setQuizAnswers] = useState({}); // { [qId]: optionIndex }
  const [quizSubmitted, setQuizSubmitted] = useState({}); // { [qId]: boolean }

  // Checklist state (preview simulation vs progress apply)
  const checklist = Array.isArray(stage.checklist) ? stage.checklist : [];
  const [simulatedChecks, setSimulatedChecks] = useState({});

  const isChecked = (itemId) => {
    if (isPreview) return Boolean(simulatedChecks[itemId]);
    return Boolean(progress?.stages?.[stage.id || stage.phaseId]?.checkedItems?.[itemId]);
  };

  const toggleCheck = (itemId) => {
    if (isPreview) {
      setSimulatedChecks((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    } else if (apply) {
      apply((prevProg) => {
        const stageKey = stage.id || stage.phaseId;
        const curStage = prevProg.stages?.[stageKey] || {};
        const curChecks = curStage.checkedItems || {};
        return {
          ...prevProg,
          stages: {
            ...prevProg.stages,
            [stageKey]: {
              ...curStage,
              checkedItems: {
                ...curChecks,
                [itemId]: !curChecks[itemId]
              }
            }
          }
        };
      });
    }
  };

  const handleSelectQuizOption = (qId, optionIdx) => {
    if (quizSubmitted[qId]) return; // lock until retry
    setQuizAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
    setQuizSubmitted((prev) => ({ ...prev, [qId]: true }));
  };

  const handleRetryQuiz = (qId) => {
    setQuizAnswers((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    setQuizSubmitted((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const weekStr = Array.isArray(stage.weeks) && stage.weeks.length >= 2
    ? (stage.weeks[0] === stage.weeks[1] ? `Week ${stage.weeks[0]}` : `Weeks ${stage.weeks[0]}–${stage.weeks[1]}`)
    : 'Week 1';

  return (
    <div className="pb-stage-viewer">
      {/* Preview Mode Banner */}
      {isPreview && (
        <aside className="pb-preview-banner" role="status" aria-label="Student preview mode">
          <div className="pb-preview-banner-text">
            <span className="pb-preview-pill"><Eye size={14} aria-hidden="true" /> Coach Student Preview</span>
            <p>
              Interactive student experience simulation. Progress, quiz scores, and submissions are read-only and will <strong>not</strong> write to student records or award XP.
            </p>
          </div>
          <div className="pb-preview-banner-actions">
            {onOpenEditor && (
              <button type="button" className="gh-btn gh-btn-sm gh-btn-secondary" onClick={onOpenEditor}>
                Edit this stage
              </button>
            )}
            {onExitPreview && (
              <button type="button" className="gh-btn gh-btn-sm gh-btn-primary" onClick={onExitPreview}>
                Exit preview
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Stage Header */}
      <section className="pb-stage-header">
        <div className="pb-stage-header-top">
          <span className="pb-stage-week-badge">{weekStr}</span>
          {program?.title && <span className="pb-stage-program-tag">{program.title}</span>}
          {stage.status === 'draft' && <span className="pb-draft-pill">Draft (Unpublished)</span>}
        </div>
        <h2 className="pb-stage-title">{stage.title || 'Untitled Stage'}</h2>
        <p className="pb-stage-goal">{stage.learningGoal || stage.goal || 'Investigate core questions and build prototypes'}</p>
      </section>

      {/* Stage Content Sub-navigation */}
      <nav className="pb-stage-nav" aria-label="Stage learning materials">
        <button
          type="button"
          className={`pb-stage-nav-btn ${activeTab === 'overview' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <CheckSquare size={16} aria-hidden="true" />
          <span>Tasks & Instructions</span>
          {checklist.length > 0 && <span className="pb-badge-count">{checklist.length}</span>}
        </button>

        {videos.length > 0 && (
          <button
            type="button"
            className={`pb-stage-nav-btn ${activeTab === 'videos' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <Video size={16} aria-hidden="true" />
            <span>Videos ({videos.length})</span>
          </button>
        )}

        {slides.length > 0 && (
          <button
            type="button"
            className={`pb-stage-nav-btn ${activeTab === 'slides' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('slides')}
          >
            <Presentation size={16} aria-hidden="true" />
            <span>Interactive Slides ({slides.length})</span>
          </button>
        )}

        {quizItems.length > 0 && (
          <button
            type="button"
            className={`pb-stage-nav-btn ${activeTab === 'quiz' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <HelpCircle size={16} aria-hidden="true" />
            <span>Concept Quiz ({quizItems.length})</span>
          </button>
        )}

        {stage.activity && (
          <button
            type="button"
            className={`pb-stage-nav-btn ${activeTab === 'activity' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Wrench size={16} aria-hidden="true" />
            <span>Practical Lab</span>
          </button>
        )}
      </nav>

      {/* Tab: Overview (Instructions & Checklist) */}
      {activeTab === 'overview' && (
        <div className="pb-stage-grid">
          <div className="pb-stage-main-col">
            <div className="gh-card pb-instruction-card">
              <h3 className="pb-h3">Stage Instructions & Guidance</h3>
              <div className="pb-instruction-body">
                {stage.instructions ? (
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{stage.instructions}</p>
                ) : (
                  <p className="pb-text-muted">No specific instructions have been added for this stage yet.</p>
                )}
              </div>
            </div>

            {/* Stage Resources */}
            {Array.isArray(stage.resources) && stage.resources.length > 0 && (
              <div className="gh-card" style={{ marginTop: '1rem' }}>
                <h3 className="pb-h3">Learning Resources & Links</h3>
                <ul className="pb-resource-list">
                  {stage.resources.map((res, i) => (
                    <li key={i} className="pb-resource-item">
                      <span className="pb-resource-kind">{res.kind || 'Resource'}</span>
                      <a href={res.url} target="_blank" rel="noopener noreferrer" className="pb-resource-link">
                        {res.title || res.url} <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="pb-stage-side-col">
            <div className="gh-card pb-checklist-card">
              <h3 className="pb-h3">
                <CheckSquare size={17} aria-hidden="true" />
                <span>Stage Checklist</span>
              </h3>
              <p className="pb-sub">Tick off tasks as you complete them in the lab:</p>
              {checklist.length === 0 ? (
                <p className="pb-text-muted">No checklist tasks defined.</p>
              ) : (
                <ul className="pb-checklist-items">
                  {checklist.map((item, idx) => {
                    const itemId = item.id || `task-${idx}`;
                    const label = typeof item === 'string' ? item : item.label;
                    const done = isChecked(itemId);
                    return (
                      <li key={itemId} className={`pb-checklist-row ${done ? 'is-done' : ''}`}>
                        <label className="pb-check-label">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => toggleCheck(itemId)}
                            className="pb-check-input"
                          />
                          <span className="pb-check-text">{label}</span>
                          {item.required && <span className="pb-required-pill">Required</span>}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Videos */}
      {activeTab === 'videos' && (
        <div className="gh-card pb-video-viewer-card">
          {videos.length > 1 && (
            <div className="pb-video-selector-bar" role="tablist" aria-label="Stage videos">
              {videos.map((v, i) => (
                <button
                  key={v.id || i}
                  type="button"
                  className={`pb-video-chip ${selectedVideoIdx === i ? 'is-selected' : ''}`}
                  onClick={() => setSelectedVideoIdx(i)}
                >
                  <Video size={14} aria-hidden="true" />
                  <span>{v.title || `Video ${i + 1}`}</span>
                </button>
              ))}
            </div>
          )}

          {activeVideo && (
            <div className="pb-video-display">
              <div className="pb-video-frame-wrap">
                {activeVideo.embedUrl ? (
                  <iframe
                    src={activeVideo.embedUrl}
                    title={activeVideo.title || 'Stage Video'}
                    className="pb-video-iframe"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="pb-video-fallback">
                    <AlertTriangle size={24} aria-hidden="true" />
                    <p>This video does not have a direct embed address.</p>
                    {activeVideo.url && (
                      <a href={activeVideo.url} target="_blank" rel="noopener noreferrer" className="gh-btn gh-btn-sm">
                        Open in new tab <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="pb-video-info">
                <h3 className="pb-video-title">{activeVideo.title || 'Stage Video'}</h3>
                {activeVideo.description && (
                  <p className="pb-video-desc">{activeVideo.description}</p>
                )}
                <span className="pb-video-privacy-note">
                  <ShieldCheck size={13} aria-hidden="true" />
                  Privacy-preserving playback via youtube-nocookie.com
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Interactive Slides */}
      {activeTab === 'slides' && activeSlide && (
        <div className="gh-card pb-slides-viewer-card">
          <div className="pb-slides-controls-top">
            <span className="pb-slide-counter">
              Slide {currentSlideIdx + 1} of {slides.length}
            </span>
            <div className="pb-slide-nav-arrows">
              <button
                type="button"
                className="gh-btn gh-btn-sm"
                disabled={currentSlideIdx === 0}
                onClick={() => setCurrentSlideIdx((c) => Math.max(0, c - 1))}
                aria-label="Previous slide"
              >
                <ChevronLeft size={16} aria-hidden="true" /> Prev
              </button>
              <button
                type="button"
                className="gh-btn gh-btn-sm"
                disabled={currentSlideIdx === slides.length - 1}
                onClick={() => setCurrentSlideIdx((c) => Math.min(slides.length - 1, c + 1))}
                aria-label="Next slide"
              >
                Next <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="pb-slide-canvas">
            <span className="pb-slide-badge">Slide {activeSlide.slideNumber || currentSlideIdx + 1}</span>
            <h3 className="pb-slide-heading">{activeSlide.heading}</h3>
            {activeSlide.subheading && <h4 className="pb-slide-subheading">{activeSlide.subheading}</h4>}

            <ul className="pb-slide-bullets">
              {(activeSlide.bullets || []).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>

          {activeSlide.speakerNotes && (
            <div className="pb-speaker-notes-drawer">
              <button
                type="button"
                className="pb-speaker-notes-toggle"
                onClick={() => setShowSpeakerNotes((v) => !v)}
              >
                <Info size={14} aria-hidden="true" />
                <span>{showSpeakerNotes ? 'Hide speaker notes & discussion prompt' : 'Show speaker notes & discussion prompt'}</span>
              </button>
              {showSpeakerNotes && (
                <div className="pb-speaker-notes-content">
                  <p>{activeSlide.speakerNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Formative Concept Quiz */}
      {activeTab === 'quiz' && (
        <div className="pb-quiz-viewer">
          <div className="pb-quiz-header-card gh-card">
            <h3 className="pb-h3">
              <HelpCircle size={17} aria-hidden="true" />
              <span>Concept Check & Formative Questions</span>
            </h3>
            <p className="pb-sub">
              Check your understanding. Completing formative quiz questions provides diagnostic feedback and does not automatically certify competency.
            </p>
          </div>

          <div className="pb-quiz-list">
            {quizItems.map((q, qIdx) => {
              const qId = q.id || `quiz-${qIdx}`;
              const selectedOpt = quizAnswers[qId];
              const isSubmitted = quizSubmitted[qId];
              const isCorrect = selectedOpt === q.correctIndex;

              return (
                <div key={qId} className={`gh-card pb-quiz-card ${isSubmitted ? (isCorrect ? 'is-correct' : 'is-incorrect') : ''}`}>
                  <div className="pb-quiz-card-head">
                    <span className="pb-quiz-num">Q{qIdx + 1}</span>
                    <h4 className="pb-quiz-prompt">{q.prompt}</h4>
                  </div>

                  <div className="pb-quiz-options" role="radiogroup" aria-label={`Question ${qIdx + 1}`}>
                    {(q.options || []).map((opt, optIdx) => {
                      const isPicked = selectedOpt === optIdx;
                      let statusClass = '';
                      if (isSubmitted) {
                        if (optIdx === q.correctIndex) statusClass = 'opt-correct';
                        else if (isPicked) statusClass = 'opt-wrong';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          className={`pb-quiz-option-btn ${isPicked ? 'is-selected' : ''} ${statusClass}`}
                          onClick={() => handleSelectQuizOption(qId, optIdx)}
                          disabled={isSubmitted}
                        >
                          <span className="pb-option-letter">{String.fromCharCode(65 + optIdx)}</span>
                          <span className="pb-option-text">{opt}</span>
                          {isSubmitted && optIdx === q.correctIndex && (
                            <CheckCircle2 size={16} className="pb-opt-icon is-correct" aria-hidden="true" />
                          )}
                          {isSubmitted && isPicked && !isCorrect && (
                            <XCircle size={16} className="pb-opt-icon is-incorrect" aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isSubmitted && (
                    <div className={`pb-quiz-feedback ${isCorrect ? 'is-feedback-correct' : 'is-feedback-wrong'}`}>
                      <div className="pb-feedback-message">
                        <strong>{isCorrect ? '🎉 Correct!' : '🤔 Not quite.'}</strong>
                        <p>{q.explanation || 'Review the stage materials and try again.'}</p>
                      </div>
                      {!isCorrect && (
                        <button
                          type="button"
                          className="gh-btn gh-btn-sm gh-btn-secondary"
                          onClick={() => handleRetryQuiz(qId)}
                        >
                          <RotateCcw size={14} aria-hidden="true" /> Try again
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Practical Activity */}
      {activeTab === 'activity' && stage.activity && (
        <div className="gh-card pb-activity-viewer-card">
          <div className="pb-activity-head">
            <h3 className="pb-activity-title">{stage.activity.title || 'Hands-on Lab'}</h3>
            <span className="pb-activity-duration">⏱️ {stage.activity.durationMinutes || 45} minutes</span>
          </div>

          {Array.isArray(stage.activity.materials) && stage.activity.materials.length > 0 && (
            <div className="pb-activity-section">
              <h4 className="pb-activity-subheading">Required Prototyping Materials</h4>
              <ul className="pb-bullets">
                {stage.activity.materials.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(stage.activity.steps) && stage.activity.steps.length > 0 && (
            <div className="pb-activity-section">
              <h4 className="pb-activity-subheading">Step-by-Step Build Steps</h4>
              <ol className="pb-activity-steps-list">
                {stage.activity.steps.map((st, i) => (
                  <li key={i} className="pb-activity-step-row">
                    <strong>Step {st.stepNumber || i + 1}: {st.title}</strong>
                    <p>{st.instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {Array.isArray(stage.activity.safetyNotes) && stage.activity.safetyNotes.length > 0 && (
            <div className="pb-activity-safety-box">
              <h4 className="pb-safety-title"><ShieldCheck size={16} aria-hidden="true" /> Lab Safety Protocols</h4>
              <ul className="pb-bullets">
                {stage.activity.safetyNotes.map((sn, i) => (
                  <li key={i}>{sn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
