import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft, ArrowRight, Save, CheckCircle2, AlertTriangle, BookOpen, Layers,
  FileText, ShieldCheck, Rocket, Trash2, Plus, Clock, ExternalLink
} from 'lucide-react';
import { CourseBasicsStep } from './CourseBasicsStep.jsx';
import { CourseResourcesStep } from './CourseResourcesStep.jsx';
import { CourseOutlineStep } from './CourseOutlineStep.jsx';
import { CourseLessonsStep } from './CourseLessonsStep.jsx';
import { CourseAlignmentStep } from './CourseAlignmentStep.jsx';
import { getDraft, saveDraft, deleteDraft, createNewDraft, listDrafts } from './courseDraftStore.js';
import { publishProgramToCatalog } from '../../coach/studio/pblTransferService.js';
import { validateCourseBasics } from './courseAlignmentValidator.js';
import './courseMaker.css';

const STEPS = [
  { id: 1, title: 'Basics', icon: BookOpen },
  { id: 2, title: 'Resources & Import', icon: FileText },
  { id: 3, title: 'Outline', icon: Layers },
  { id: 4, title: 'Lessons & Assessments', icon: Rocket },
  { id: 5, title: 'Alignment & Publish', icon: ShieldCheck }
];

export function CourseMaker({ coachUser, initialDraftId = null, initialStep = 1, onExit, initialMode = 'create' }) {
  const [draftId, setDraftId] = useState(initialDraftId);
  const [step, setStep] = useState(initialStep);
  const [course, setCourse] = useState(() => {
    if (initialDraftId) {
      const existing = getDraft(initialDraftId);
      if (existing) return existing;
    }
    return createNewDraft();
  });

  const [saveStatus, setSaveStatus] = useState({ state: 'idle', message: '' });
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [publishError, setPublishError] = useState(null);
  const basicsValid = useMemo(() => validateCourseBasics(course).isValid, [course]);
  const bannerRef = useRef(null);
  const stepperRef = useRef(null);
  const topRef = useRef(null);

  // A failed "Continue" must be seen: the message sits above the form, so bring it into view and focus it.
  useEffect(() => {
    if (saveStatus.state === 'error' && bannerRef.current) {
      bannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      bannerRef.current.focus({ preventScroll: true });
    }
  }, [saveStatus]);

  // Each new step starts at the top, with its tab visible in the (scrollable) stepper.
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' });
    stepperRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [step]);

  // If initialMode is import, jump directly to Step 2
  useEffect(() => {
    if (initialMode === 'import' && step === 1) {
      setStep(2);
    }
  }, [initialMode]);

  // Load existing draft if draftId changes
  useEffect(() => {
    if (draftId && draftId !== course.id) {
      const found = getDraft(draftId);
      if (found) {
        setCourse(found);
        if (typeof found.step === 'number') {
          setStep(found.step);
        }
      }
    }
  }, [draftId]);

  // Update course state
  const handleCourseChange = useCallback((patch) => {
    setCourse((prev) => ({
      ...prev,
      ...patch,
      updatedAt: Date.now()
    }));
  }, []);

  // Save draft
  const handleSaveDraft = useCallback(() => {
    setSaveStatus({ state: 'saving', message: 'Saving draft…' });
    try {
      const saved = saveDraft({
        ...course,
        step,
        authorId: coachUser?.uid || course.authorId
      });
      setCourse(saved);
      setDraftId(saved.id);
      setSaveStatus({ state: 'saved', message: 'Draft saved. You can close or navigate away safely.' });
      setTimeout(() => setSaveStatus({ state: 'idle', message: '' }), 4000);
    } catch (err) {
      setSaveStatus({ state: 'error', message: `Could not save draft: ${err.message}` });
    }
  }, [course, step, coachUser?.uid]);

  // Handle import mapping confirmation
  const handleImportedCourse = useCallback((importedCourse) => {
    setCourse((prev) => ({
      ...prev,
      ...importedCourse,
      sources: [...(prev.sources || []), ...(importedCourse.sources || [])],
      updatedAt: Date.now()
    }));
    setSaveStatus({
      state: 'saved',
      message: `Successfully mapped imported course: "${importedCourse.title}". Proceed to outline review.`
    });
    // Move to step 3 so coach can review the imported outline
    setStep(3);
  }, []);

  // Step navigation
  const handleNext = () => {
    if (step === 1) {
      const val = validateCourseBasics(course);
      if (!val.isValid) {
        setSaveStatus({
          state: 'error',
          message: val.errors.map((e) => e.message).join(' ')
        });
        return;
      }
    }
    // Auto-save on step progress
    saveDraft({ ...course, step: step + 1, authorId: coachUser?.uid });
    setStep((s) => Math.min(STEPS.length, s + 1));
    setSaveStatus({ state: 'idle', message: '' });
  };

  const handleBack = () => {
    saveDraft({ ...course, step: step - 1, authorId: coachUser?.uid });
    setStep((s) => Math.max(1, s - 1));
    setSaveStatus({ state: 'idle', message: '' });
  };

  // Publish flow
  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    setPublishResult(null);

    try {
      // Structure as PblUnit for catalog publication
      const unit = {
        id: course.id.startsWith('pbl-') ? course.id : `pbl-custom-${course.id.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
        unitTitle: course.title,
        theme: course.theme || course.title,
        drivingQuestion: course.drivingQuestion || course.title,
        realProblem: {
          summary: course.drivingQuestion || course.title,
          peopleImpact: 'Engages learners in real-world problem-solving.',
          environmentalImpact: 'Addresses authentic community challenges.'
        },
        targetLearner: {
          id: 'universal-all',
          name: 'All Learners',
          isUniversal: true,
          appliedAccommodations: []
        },
        makerSpaceSpecs: course.makerSpaceSpecs || [],
        coachCues: course.coachCues || {
          leadCoach: coachUser?.displayName || 'Coach',
          initiationCue: 'Guide learners during initial kickoff.',
          frustrationDeescalationCue: 'Break down complex tasks into bite-sized milestones.',
          midCheckCue: 'Formative assessment and midpoint review.',
          showcaseCue: 'Celebrate completed deliverables.'
        },
        milestones: course.milestones || [],
        status: 'published',
        publishedAt: Date.now()
      };

      const res = await publishProgramToCatalog(unit, coachUser?.uid);
      setPublishResult(res);

      // Archive / clean up draft once published
      deleteDraft(course.id);
    } catch (err) {
      console.error('[CourseMaker] Publishing failed:', err);
      setPublishError(err?.message || 'Failed to publish course. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="cm-wizard-container" ref={topRef}>
      {/* Top Header */}
      {/* Not <header>/<footer>: index.html's legacy stylesheet paints every bare header navy. */}
      <div className="cm-header">
        <div className="cm-header-left">
          {onExit && (
            <button type="button" className="cm-btn cm-btn-ghost" onClick={onExit}>
              <ArrowLeft size={16} /> Exit to Courses
            </button>
          )}
          <div>
            <h1 className="cm-title">Course Maker</h1>
            <p className="cm-subtitle">
              {course.title ? course.title : 'New Curriculum-Aligned Course'}
            </p>
          </div>
        </div>

        <div className="cm-header-right">
          <button
            type="button"
            className="cm-btn cm-btn-outline cm-btn-save-draft"
            onClick={handleSaveDraft}
          >
            <Save size={15} /> Save Draft
          </button>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <p className="cm-step-count" aria-live="polite">Step {step} of {STEPS.length}: {STEPS[step - 1].title}</p>
      <nav className="cm-stepper" aria-label="Course creation steps" ref={stepperRef}>
        {STEPS.map((s) => {
          const isCurrent = s.id === step;
          // Jumping ahead in the stepper skips validation, so Basics only shows as done when it is valid.
          const isComplete = s.id < step && (s.id !== 1 || basicsValid);
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              className={`cm-step-node ${isCurrent ? 'current' : ''} ${isComplete ? 'complete' : ''}`}
              onClick={() => {
                saveDraft({ ...course, step: s.id, authorId: coachUser?.uid });
                setStep(s.id);
                setSaveStatus({ state: 'idle', message: '' });
              }}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Step ${s.id}: ${s.title}${isComplete ? ' (done)' : ''}`}
            >
              <span className="cm-step-circle">
                {isComplete ? <CheckCircle2 size={16} /> : s.id}
              </span>
              <span className="cm-step-label">{s.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Save status notification bar */}
      {saveStatus.state !== 'idle' && (
        <div ref={bannerRef} tabIndex={-1} className={`cm-save-banner cm-save-${saveStatus.state}`}
             role={saveStatus.state === 'error' ? 'alert' : 'status'}>
          {saveStatus.state === 'saved' && <CheckCircle2 size={15} />}
          {saveStatus.state === 'error' && <AlertTriangle size={15} />}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Active Step Content */}
      <main className="cm-step-viewport">
        {step === 1 && (
          <CourseBasicsStep course={course} onChange={handleCourseChange} />
        )}
        {step === 2 && (
          <CourseResourcesStep
            course={course}
            onChange={handleCourseChange}
            onImportCourse={handleImportedCourse}
          />
        )}
        {step === 3 && (
          <CourseOutlineStep course={course} onChange={handleCourseChange} />
        )}
        {step === 4 && (
          <CourseLessonsStep course={course} onChange={handleCourseChange} />
        )}
        {step === 5 && (
          <CourseAlignmentStep
            course={course}
            onPublish={handlePublish}
            publishing={publishing}
            publishError={publishError}
            publishResult={publishResult}
          />
        )}
      </main>

      {/* Footer Controls */}
      <div className="cm-footer">
        <div className="cm-footer-left">
          {step > 1 && (
            <button type="button" className="cm-btn cm-btn-secondary" onClick={handleBack}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>

        <div className="cm-footer-right">
          {/* Save Draft lives in the header only; one primary action here. */}
          {step < STEPS.length && (
            <button type="button" className="cm-btn cm-btn-primary" onClick={handleNext}>
              Continue <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
