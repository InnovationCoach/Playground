import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  CheckCircle2,
  Clock,
  FolderGit2,
  Award,
  Users,
  ArrowRight,
  ArrowLeft,
  X,
  Target,
  BookOpen,
  Check
} from 'lucide-react';
import './onboarding.css';

const STORAGE_PREFIX = 'spark_tour_completed_';

export function StudentOnboardingModal({ user, profile, onDismiss }) {
  const uid = user?.uid || profile?.uid || 'guest';
  const firstName = profile?.givenNames || profile?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Learner';

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('welcome'); // 'welcome' | 'tour'
  const [tourStep, setTourStep] = useState(1);

  // Interactive demo state for Step 1
  const [demoChecked, setDemoChecked] = useState(false);

  // Interactive demo state for Step 2
  const [selectedPhase, setSelectedPhase] = useState('ideate');

  // Interactive demo state for Step 3
  const [activeSkill, setActiveSkill] = useState('Critical Thinking');

  useEffect(() => {
    // Check if tour has been completed for this specific user
    let hasCompleted = false;
    try { hasCompleted = localStorage.getItem(STORAGE_PREFIX + uid) === 'true'; } catch { /* storage unavailable: show the tour */ }
    if (!hasCompleted) {
      setIsOpen(true);
    }

    // Global listener so the user can re-trigger the tour at any time
    const handleReopen = () => {
      setMode('tour');
      setTourStep(1);
      setIsOpen(true);
    };

    window.addEventListener('spark:open-tour', handleReopen);
    return () => window.removeEventListener('spark:open-tour', handleReopen);
  }, [uid]);

  const handleFinish = () => {
    try { localStorage.setItem(STORAGE_PREFIX + uid, 'true'); } catch { /* storage unavailable */ }
    setIsOpen(false);
    onDismiss?.();
  };

  const handleStartTour = () => {
    setMode('tour');
    setTourStep(1);
  };

  if (!isOpen) return null;

  return (
    <div className="spark-onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="spark-modal-title">
      <div className="spark-onboarding-card">
        <button
          type="button"
          className="spark-onboarding-close-btn"
          aria-label="Close onboarding"
          onClick={handleFinish}
        >
          <X size={18} />
        </button>

        {/* Header Banner */}
        <div className="spark-onboarding-banner">
          <div className="spark-onboarding-tag">
            <Sparkles size={13} />
            <span>Welcome to WeLearn SPARK</span>
          </div>
          <h2 id="spark-modal-title" className="spark-onboarding-title">
            {mode === 'welcome' ? `Welcome, ${firstName}! 🎉` : 'Guided Platform Tour'}
          </h2>
          <p className="spark-onboarding-subtitle">
            {mode === 'welcome'
              ? 'Your personalized learning journey starts here. Discover projects, track your mastery, and set daily goals.'
              : `Step ${tourStep} of 4 — Discover key features of your Spark learning hub`}
          </p>
        </div>

        {/* Content Body */}
        <div className="spark-onboarding-body">
          {mode === 'welcome' ? (
            <div className="spark-welcome-content">
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.94rem', color: '#334155', lineHeight: 1.5 }}>
                We're excited to have you in <strong>Cohort {profile?.cohortId === 'cohort-whs' ? 'WHS' : profile?.cohort || 'WHS'}</strong>! 
                Spark is built around real-world projects, daily focus, and continuous growth with your mentors.
              </p>

              <div className="spark-welcome-grid">
                <div className="spark-welcome-card">
                  <div className="spark-welcome-card-icon">
                    <Target size={20} />
                  </div>
                  <h4>Daily Hub & Focus</h4>
                  <p>Set top priorities each morning and use the built-in focus timer to work distraction-free.</p>
                </div>

                <div className="spark-welcome-card">
                  <div className="spark-welcome-card-icon">
                    <FolderGit2 size={20} />
                  </div>
                  <h4>PBL Project Studio</h4>
                  <p>Hands-on term projects where you define, build, and showcase verified evidence of your work.</p>
                </div>

                <div className="spark-welcome-card">
                  <div className="spark-welcome-card-icon">
                    <Award size={20} />
                  </div>
                  <h4>Mastery & Skills</h4>
                  <p>Develop 7 future-ready competencies, collect skill badges, and track genuine mastery.</p>
                </div>

                <div className="spark-welcome-card">
                  <div className="spark-welcome-card-icon">
                    <Users size={20} />
                  </div>
                  <h4>Coach Feedback</h4>
                  <p>Get personalized guidance, timely rubric reviews, and mentorship from your teachers.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="spark-tour-step">
              {/* Step 1: Daily Hub & Focus Timer */}
              {tourStep === 1 && (
                <>
                  <div className="spark-tour-intro">
                    <div className="spark-tour-step-icon-box">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h3 className="spark-tour-step-heading">1. Daily Flow & Priorities</h3>
                      <p className="spark-tour-step-desc">
                        Every day on Spark starts at your Dashboard. Pick your 2–3 key intentions for the day and check them off as you make progress.
                      </p>
                    </div>
                  </div>

                  <div className="spark-interactive-widget">
                    <div className="spark-widget-label">
                      <Sparkles size={12} />
                      <span>Interactive Demo: Try checking off a daily goal</span>
                    </div>

                    <div
                      className={`spark-demo-task-row ${demoChecked ? 'is-done' : ''}`}
                      onClick={() => setDemoChecked((prev) => !prev)}
                    >
                      <div className="spark-demo-task-left">
                        <div className="spark-demo-checkbox">
                          {demoChecked && <Check size={14} />}
                        </div>
                        <span style={{ textDecoration: demoChecked ? 'line-through' : 'none', color: demoChecked ? '#16a34a' : '#1e293b' }}>
                          Review Term Project brief with Coach Sam
                        </span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: demoChecked ? '#16a34a' : '#64748b', fontWeight: 600 }}>
                        {demoChecked ? 'Completed! 🎉' : 'Click to complete'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.82rem', color: '#64748b' }}>
                      <span>⏱️ 25m Pomodoro Focus Timer available on your deck</span>
                      <span style={{ color: '#4338ca', fontWeight: 600 }}>Ready to track</span>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: PBL Studio & Projects */}
              {tourStep === 2 && (
                <>
                  <div className="spark-tour-intro">
                    <div className="spark-tour-step-icon-box">
                      <FolderGit2 size={24} />
                    </div>
                    <div>
                      <h3 className="spark-tour-step-heading">2. Hands-On PBL Studio</h3>
                      <p className="spark-tour-step-desc">
                        Project-Based Learning is at the core of Spark. Instead of traditional exams, you progress through 4 dynamic project phases.
                      </p>
                    </div>
                  </div>

                  <div className="spark-interactive-widget">
                    <div className="spark-widget-label">
                      <Compass size={12} />
                      <span>Explore the 4 Project Phases:</span>
                    </div>

                    <div className="spark-demo-phases-grid">
                      {[
                        { id: 'define', label: '1. Define', desc: 'Identify real-world challenges, user needs, and project scope.' },
                        { id: 'ideate', label: '2. Ideate', desc: 'Brainstorm solutions, sketch wireframes, and design prototypes.' },
                        { id: 'build', label: '3. Build', desc: 'Develop physical models, code, or write content while collecting evidence.' },
                        { id: 'showcase', label: '4. Showcase', desc: 'Present your completed solution to coaches, peers, and industry mentors.' }
                      ].map((phase) => (
                        <button
                          key={phase.id}
                          type="button"
                          className={`spark-demo-phase-btn ${selectedPhase === phase.id ? 'active' : ''}`}
                          onClick={() => setSelectedPhase(phase.id)}
                        >
                          {phase.label}
                        </button>
                      ))}
                    </div>

                    <div className="spark-demo-phase-desc">
                      {selectedPhase === 'define' && 'Phase 1 Focus: Ask big questions, research context, and write your project problem statement.'}
                      {selectedPhase === 'ideate' && 'Phase 2 Focus: Collaborate on concepts, create mood boards, and gather initial mentor feedback.'}
                      {selectedPhase === 'build' && 'Phase 3 Focus: Execute your ideas, iterate on prototypes, and upload photos, code, and reflection logs.'}
                      {selectedPhase === 'showcase' && 'Phase 4 Focus: Pitch your findings, reflect on lessons learned, and earn competency badges.'}
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Mastery & Competencies Framework */}
              {tourStep === 3 && (
                <>
                  <div className="spark-tour-intro">
                    <div className="spark-tour-step-icon-box">
                      <Award size={24} />
                    </div>
                    <div>
                      <h3 className="spark-tour-step-heading">3. Future Skills & Mastery</h3>
                      <p className="spark-tour-step-desc">
                        Spark tracks your growth across 7 key future-ready competencies. Every piece of project evidence powers your Mastery Wheel.
                      </p>
                    </div>
                  </div>

                  <div className="spark-interactive-widget">
                    <div className="spark-widget-label">
                      <Sparkles size={12} />
                      <span>Select a Competency to learn more:</span>
                    </div>

                    <div className="spark-demo-competencies">
                      {[
                        { name: 'Critical Thinking', level: 'Level 2 · Advancing', tip: 'Evaluating data, spotting logical fallacies, and hypothesis testing.' },
                        { name: 'Collaboration', level: 'Level 3 · Proficient', tip: 'Effective peer communication, dividing work, and resolving conflict.' },
                        { name: 'Creative Problem Solving', level: 'Level 2 · Advancing', tip: 'Inventive approaches to real constraints and design iteration.' },
                        { name: 'Digital Fluency', level: 'Level 3 · Proficient', tip: 'Leveraging AI tools, digital fabrication, and software responsibly.' },
                        { name: 'Resilience & Reflection', level: 'Level 2 · Advancing', tip: 'Learning from failed prototypes and adapting with a growth mindset.' }
                      ].map((skill) => (
                        <button
                          key={skill.name}
                          type="button"
                          className={`spark-demo-comp-chip ${activeSkill === skill.name ? 'active' : ''}`}
                          onClick={() => setActiveSkill(skill.name)}
                        >
                          <span>{skill.name}</span>
                        </button>
                      ))}
                    </div>

                    <div style={{ marginTop: '0.85rem', background: '#ffffff', borderRadius: 8, padding: '0.75rem 1rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#1e293b' }}>
                        {activeSkill}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 600, marginTop: '0.15rem' }}>
                        Cohort WHS Baseline Track
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.35rem', lineHeight: 1.4 }}>
                        {activeSkill === 'Critical Thinking' && 'You will exercise this skill in lab experiments, code reviews, and project data analysis.'}
                        {activeSkill === 'Collaboration' && 'Demonstrated through team standups, peer critiques, and joint deliverables.'}
                        {activeSkill === 'Creative Problem Solving' && 'Demonstrated when prototyping innovative designs under time or resource limits.'}
                        {activeSkill === 'Digital Fluency' && 'Demonstrated in your use of development workflows, simulations, and AI prompts.'}
                        {activeSkill === 'Resilience & Reflection' && 'Demonstrated in your weekly learning logs and iteration logs.'}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Coaches & Community */}
              {tourStep === 4 && (
                <>
                  <div className="spark-tour-intro">
                    <div className="spark-tour-step-icon-box">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="spark-tour-step-heading">4. Coaches & Community Support</h3>
                      <p className="spark-tour-step-desc">
                        You have dedicated mentors guiding you every step of the way. Connect with Coach Sam and Coach Alex whenever you need feedback.
                      </p>
                    </div>
                  </div>

                  <div className="spark-interactive-widget">
                    <div className="spark-widget-label">
                      <Users size={12} />
                      <span>Message from your Coach:</span>
                    </div>

                    <div className="spark-demo-coach-card">
                      <div className="spark-demo-coach-avatar">
                        CS
                      </div>
                      <div>
                        <div className="spark-demo-coach-name">Coach Sam · High School PBL Lead</div>
                        <div className="spark-demo-coach-msg">
                          "Welcome to WeLearn SPARK, {firstName}! We're thrilled to have you in Cohort WHS Grade 10. Check out the project library to get your first project underway, and feel free to reach out anytime!"
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="spark-onboarding-footer">
          {mode === 'welcome' ? (
            <>
              <button
                type="button"
                className="spark-btn-secondary"
                onClick={handleFinish}
              >
                I'll explore on my own
              </button>

              <button
                type="button"
                className="spark-btn-primary"
                onClick={handleStartTour}
              >
                <span>Start Guided Tour</span>
                <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              {/* Step indicators */}
              <div className="spark-tour-progress-bar">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`spark-tour-dot ${step === tourStep ? 'active' : step < tourStep ? 'passed' : ''}`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="spark-btn-group">
                <button
                  type="button"
                  className="spark-btn-secondary"
                  disabled={tourStep === 1}
                  onClick={() => setTourStep((s) => Math.max(1, s - 1))}
                  style={{ opacity: tourStep === 1 ? 0.5 : 1, cursor: tourStep === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ArrowLeft size={15} style={{ marginRight: 4 }} />
                  Back
                </button>

                {tourStep < 4 ? (
                  <button
                    type="button"
                    className="spark-btn-primary"
                    onClick={() => setTourStep((s) => s + 1)}
                  >
                    <span>Next</span>
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="spark-btn-primary"
                    onClick={handleFinish}
                    style={{ background: '#16a34a', borderColor: '#15803d' }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Get Started in Spark!</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Quick Tour button component to place in Header / Navigation
 */
export function QuickTourButton() {
  return (
    <button
      type="button"
      className="spark-quick-tour-pill"
      title="Reopen Guided Tour"
      onClick={() => window.dispatchEvent(new CustomEvent('spark:open-tour'))}
    >
      <Compass size={14} />
      <span>Quick Tour</span>
    </button>
  );
}
