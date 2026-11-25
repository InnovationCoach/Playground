import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Calendar, BookOpen, Rocket,
  Target, Plus, Trash, RefreshCw, GraduationCap, Award
} from 'lucide-react';
import {
  GOAL_CATEGORIES, STEP_FREQUENCIES, SHOW_HOW, SUPPORTS, LIMITS,
  newId, firstStepOptions, categoryMeta, subtypeLabel, goalSentence
} from './goalPlan.js';
import { MANUAL_SUBJECT_OPTIONS, GRADE_LEVEL_OPTIONS } from './adventumGoalIntegration.js';
import { suggestGoalMilestones } from './goalAiService.js';

const QUESTIONS = ['explore', 'show', 'help', 'first'];
const MAX_SUPPORTS = 3;
const IDEAS = ['How robots sense things', 'Making a game', 'Solar energy', 'Drawing comics'];

const CATEGORY_IDEAS = {
  academic: [
    'Master quadratic equations and graphing in Mathematics',
    'Complete 4 biology lab units with 90%+ mastery',
    'Achieve my Year-level academic graduation target',
    'Prepare for my upcoming Science examination'
  ],
  pbl: [
    'Design and test a solar-powered water sensor prototype',
    'Complete user interviews and research synthesis for my team project',
    'Build the interactive CAD model for our showcase exhibition',
    'Deliver our team engineering pitch deck on schedule'
  ],
  skills: [
    'Build an interactive Python simulation from scratch',
    'Learn 3D CAD modelling for rapid prototyping',
    'Present my ideas clearly in a 3-minute showcase talk'
  ],
  personal: [
    'Use a 20-minute focus timer before switching tasks',
    'Organise my project notes and deadlines every Monday',
    'Ask my coach for feedback early when I hit a roadblock'
  ]
};

/**
 * Default target date: 14 days from today (`YYYY-MM-DD`).
 */
function defaultTargetDate(daysAhead = 14) {
  const d = new Date(Date.now() + daysAhead * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Setting or editing a goal:
 * - Supports the classic 4-question guided flow (Explore -> Show -> Help -> First Step)
 * - Also includes category selection (Academic, PBL, Skills, Personal), Adventum subject
 *   or PBL project selection, target date, measurable outcome, Gemini AI milestone/step
 *   suggestions, and a full Review & Confirm step.
 */
export function GoalFlow({
  supportsFirst = [],
  academicContext = null,
  initialGoal = null,
  initialCategory = null,
  initialRecommendation = null,
  onAdd,
  onSaveEdit,
  onCancel
}) {
  const isEditing = Boolean(initialGoal?.id);
  const [at, setAt] = useState(0);

  // Category & Subtype
  const [category, setCategory] = useState(
    initialGoal?.category || initialRecommendation?.category || initialCategory || 'academic'
  );
  const activeCatMeta = useMemo(() => categoryMeta(category), [category]);
  const [goalType, setGoalType] = useState(
    initialGoal?.goalType || initialRecommendation?.goalType || activeCatMeta.subtypes[0]?.id || 'subject-goal'
  );

  // Core Goal fields
  const [explore, setExplore] = useState(initialGoal?.explore || initialRecommendation?.explore || '');
  const [subject, setSubject] = useState(initialGoal?.subject || initialRecommendation?.subject || '');
  const [customSubject, setCustomSubject] = useState('');
  const [projectId, setProjectId] = useState(initialGoal?.projectId || initialRecommendation?.projectId || '');
  const [projectTitle, setProjectTitle] = useState(initialGoal?.projectTitle || initialRecommendation?.projectTitle || '');
  const [gradeLevel, setGradeLevel] = useState(
    initialGoal?.gradeLevel || initialRecommendation?.gradeLevel || academicContext?.gradeLevel || ''
  );
  const [graduationTarget, setGraduationTarget] = useState(initialGoal?.graduationTarget || '');
  const [targetDate, setTargetDate] = useState(
    initialGoal?.targetDate || initialRecommendation?.targetDate || (isEditing ? '' : '')
  );
  const [measurableOutcome, setMeasurableOutcome] = useState(
    initialGoal?.measurableOutcome || initialRecommendation?.measurableOutcome || ''
  );

  // ShowHow & Supports
  const [showHow, setShowHow] = useState(initialGoal?.showHow || null);
  const [ownSupports, setSupports] = useState(initialGoal?.supports || null);
  const supports = ownSupports ?? supportsFirst.slice(0, MAX_SUPPORTS);

  // Steps (supports both single radio first-step for classic flow AND multi-step AI/custom list)
  const [step, setStep] = useState(null);
  const [ownStep, setOwnStep] = useState('');
  const [multiSteps, setMultiSteps] = useState(() => {
    if (Array.isArray(initialGoal?.steps) && initialGoal.steps.length) {
      return initialGoal.steps.map((s) => ({
        id: s.id || newId('s'),
        text: s.text,
        done: Boolean(s.done),
        frequency: s.frequency || 'daily',
        aiSuggested: Boolean(s.aiSuggested)
      }));
    }
    if (Array.isArray(initialRecommendation?.steps) && initialRecommendation.steps.length) {
      return initialRecommendation.steps.map((s) => ({
        id: newId('s'),
        text: s.text,
        done: false,
        frequency: s.frequency || 'daily',
        aiSuggested: true
      }));
    }
    return [];
  });
  const [newStepDraft, setNewStepDraft] = useState('');
  const [newStepFreq, setNewStepFreq] = useState('daily');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [showReview, setShowReview] = useState(false);

  const heading = useRef(null);
  const moved = useRef(false);
  useEffect(() => { if (moved.current) heading.current?.focus(); }, [at, showReview]);

  // Keep gradeLevel synced if academicContext finishes loading
  useEffect(() => {
    if (!gradeLevel && academicContext?.gradeLevel) {
      setGradeLevel(academicContext.gradeLevel);
    }
  }, [academicContext?.gradeLevel, gradeLevel]);

  const ordered = useMemo(
    () => [...SUPPORTS].sort((a, b) => supportsFirst.includes(b.id) - supportsFirst.includes(a.id)),
    [supportsFirst]
  );

  const resolvedSubject = subject === '__custom__' ? customSubject.trim() : subject;
  const options = useMemo(
    () => firstStepOptions(explore, showHow),
    [explore, showHow]
  );

  const subjectChoices = useMemo(() => {
    const fromCtx = academicContext?.subjectOptions || MANUAL_SUBJECT_OPTIONS;
    return [...new Set(fromCtx)];
  }, [academicContext]);

  const pblChoices = useMemo(() => {
    return academicContext?.pblProjects || [];
  }, [academicContext]);

  const question = QUESTIONS[at];
  const firstStep = step === 'own' ? ownStep.trim() : step;
  const hasStepsReady = Boolean(firstStep) || multiSteps.length > 0;

  const go = (to) => {
    moved.current = true;
    setShowReview(false);
    setAt(to);
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const meta = categoryMeta(newCat);
    if (meta.subtypes?.[0]) setGoalType(meta.subtypes[0].id);
  };

  const handleRequestAiSuggestions = async () => {
    if (!explore.trim()) return;
    setAiLoading(true);
    setAiNote('');
    try {
      const suggestion = await suggestGoalMilestones({
        category,
        goalType,
        explore: explore.trim(),
        subject: category === 'academic' ? resolvedSubject : '',
        projectTitle: category === 'pbl' ? projectTitle : '',
        gradeLevel,
        measurableOutcome,
        targetDate
      });
      if (suggestion.measurableOutcome && !measurableOutcome.trim()) {
        setMeasurableOutcome(suggestion.measurableOutcome);
      }
      if (Array.isArray(suggestion.steps) && suggestion.steps.length > 0) {
        setMultiSteps((prev) => {
          const existingTexts = new Set(prev.map((p) => p.text.toLowerCase()));
          const added = suggestion.steps
            .filter((s) => !existingTexts.has(s.text.toLowerCase()))
            .map((s) => ({
              id: newId('s'),
              text: s.text.slice(0, LIMITS.text),
              done: false,
              frequency: s.frequency || 'daily',
              aiSuggested: true
            }));
          return [...prev, ...added].slice(0, LIMITS.steps);
        });
        if (!step && suggestion.steps[0]) {
          setStep(suggestion.steps[0].text);
        }
        setAiNote(
          suggestion.aiGenerated
            ? 'Gemini AI suggested actionable steps below. You can edit, remove, or add your own.'
            : 'Smart milestones suggested below. You can edit, remove, or add your own.'
        );
      }
    } finally {
      setAiLoading(false);
    }
  };

  const addCustomMultiStep = () => {
    const trimmed = newStepDraft.trim().slice(0, LIMITS.text);
    if (!trimmed || multiSteps.length >= LIMITS.steps) return;
    const item = {
      id: newId('s'),
      text: trimmed,
      done: false,
      frequency: newStepFreq
    };
    setMultiSteps((prev) => [...prev, item]);
    if (!step) setStep(trimmed);
    setNewStepDraft('');
  };

  const updateMultiStepText = (id, text) => {
    setMultiSteps((prev) => prev.map((s) => (s.id === id ? { ...s, text: text.slice(0, LIMITS.text) } : s)));
  };

  const updateMultiStepFreq = (id, frequency) => {
    setMultiSteps((prev) => prev.map((s) => (s.id === id ? { ...s, frequency } : s)));
  };

  const removeMultiStep = (id) => {
    setMultiSteps((prev) => prev.filter((s) => s.id !== id));
  };

  function buildGoalPayload() {
    let finalSteps = [];
    if (multiSteps.length > 0) {
      finalSteps = multiSteps
        .filter((s) => s.text && s.text.trim())
        .map((s) => ({
          id: s.id || newId('s'),
          text: s.text.trim().slice(0, LIMITS.text),
          done: Boolean(s.done),
          ...(s.frequency ? { frequency: s.frequency } : {}),
          ...(s.aiSuggested ? { aiSuggested: true } : {})
        }));
      if (firstStep && !finalSteps.some((s) => s.text === firstStep)) {
        finalSteps.unshift({
          id: newId('s'),
          text: firstStep.slice(0, LIMITS.text),
          done: false
        });
      }
    } else if (firstStep) {
      finalSteps = [{ id: newId('s'), text: firstStep.slice(0, LIMITS.text), done: false }];
    }

    const baseGoal = {
      id: initialGoal?.id || newId('g'),
      explore: explore.trim().slice(0, LIMITS.text),
      showHow,
      supports,
      done: initialGoal?.done || false,
      createdAt: initialGoal?.createdAt || Date.now(),
      steps: finalSteps.slice(0, LIMITS.steps)
    };

    // Attach rich metadata when provided or when academicContext/intelligent builder is active
    if (academicContext || initialGoal || initialCategory || initialRecommendation || targetDate || measurableOutcome || resolvedSubject || projectTitle) {
      baseGoal.category = category;
      baseGoal.goalType = goalType;
      if (category === 'academic' && resolvedSubject) baseGoal.subject = resolvedSubject;
      if (category === 'academic' && gradeLevel) baseGoal.gradeLevel = gradeLevel;
      if (category === 'academic' && graduationTarget.trim()) baseGoal.graduationTarget = graduationTarget.trim();
      if (category === 'pbl' && projectId) baseGoal.projectId = projectId;
      if (category === 'pbl' && projectTitle) baseGoal.projectTitle = projectTitle;
      if (targetDate) baseGoal.targetDate = targetDate;
      if (measurableOutcome.trim()) baseGoal.measurableOutcome = measurableOutcome.trim().slice(0, LIMITS.outcome);
      baseGoal.updatedAt = Date.now();
    }

    return baseGoal;
  }

  function save() {
    const payload = buildGoalPayload();
    if (isEditing && onSaveEdit) {
      onSaveEdit(payload);
    } else if (onAdd) {
      onAdd(payload);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (showReview) {
      save();
      return;
    }
    if (question === 'explore' && !explore.trim()) return;
    if (question === 'first') {
      if (hasStepsReady) save();
      return;
    }
    go(at + 1);
  }

  return (
    <form className="gl-card gl-flow" onSubmit={submit} aria-labelledby="gl-flow-question">
      <div className="gl-flow-top-bar">
        <p className="gl-flow-count">
          {showReview ? 'Review & Confirm' : `Question ${at + 1} of ${QUESTIONS.length}`}
        </p>
        {isEditing && <span className="gl-badge-pill gl-badge-edit">Editing goal</span>}
      </div>

      {/* Category Selector Pills */}
      <div className="gl-flow-categories" role="group" aria-label="Goal category">
        {GOAL_CATEGORIES.map((cat) => {
          const Icon = cat.id === 'academic' ? GraduationCap : cat.id === 'pbl' ? Rocket : cat.id === 'skills' ? Award : Target;
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`gl-cat-chip ${active ? 'is-active' : ''}`}
              aria-pressed={active}
              onClick={() => handleCategoryChange(cat.id)}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{cat.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {!showReview && question === 'explore' && (
        <>
          <h2 id="gl-flow-question" ref={heading} tabIndex={-1}>
            <label htmlFor="gl-flow-explore">What do you want to learn about or make?</label>
          </h2>

          {/* Goal Type Sub-selector */}
          <div className="gl-flow-subtypes">
            <span id="gl-flow-goaltype-label" className="gl-field-label">Goal focus</span>
            <div className="gl-chip-group" role="group" aria-labelledby="gl-flow-goaltype-label">
              {activeCatMeta.subtypes.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  className={`gl-pill gl-pill-subtle ${goalType === st.id ? 'is-selected' : ''}`}
                  aria-pressed={goalType === st.id}
                  onClick={() => setGoalType(st.id)}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Academic Subject or PBL Project Context Selector */}
          {category === 'academic' && (
            <div className="gl-flow-context-grid">
              <div className="gl-field">
                <label htmlFor="gl-flow-subject" className="gl-field-label">
                  Subject {academicContext?.subjects?.length ? '(Synced with Academic Profile)' : ''}
                </label>
                <select
                  id="gl-flow-subject"
                  className="gh-input gl-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="">All subjects / General academic</option>
                  {subject && subject !== '__custom__' && !subjectChoices.includes(subject) && !(academicContext?.subjects || []).some((s) => s.subject === subject) && (
                    <option value={subject}>{subject}</option>
                  )}
                  {academicContext?.subjects?.length > 0 && (
                    <optgroup label="Your Enrolled / Observed Subjects">
                      {academicContext.subjects.map((s) => (
                        <option key={`enrolled_${s.subject}`} value={s.subject}>
                          {s.subject} {s.progressPct !== null ? `(${s.progressPct}% complete)` : s.grade ? `(Grade: ${s.grade})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Standard Subjects">
                    {subjectChoices.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <option value="__custom__">+ Enter another subject…</option>
                </select>
                {subject === '__custom__' && (
                  <input
                    className="gh-input"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Type subject name (e.g. Environmental Science)"
                    maxLength={80}
                    aria-label="Custom subject"
                  />
                )}
              </div>

              <div className="gl-field">
                <label htmlFor="gl-flow-grade" className="gl-field-label">Current Grade / Year Level</label>
                <select
                  id="gl-flow-grade"
                  className="gh-input gl-select"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                >
                  <option value="">Select grade / year level</option>
                  {gradeLevel && !GRADE_LEVEL_OPTIONS.includes(gradeLevel) && (
                    <option value={gradeLevel}>{gradeLevel} (From profile)</option>
                  )}
                  {GRADE_LEVEL_OPTIONS.map((gl) => (
                    <option key={gl} value={gl}>{gl}</option>
                  ))}
                </select>
              </div>

              {goalType === 'graduation-target' && (
                <div className="gl-field gl-field-full">
                  <label htmlFor="gl-flow-grad" className="gl-field-label">Graduation Target / Ambition</label>
                  <input
                    id="gl-flow-grad"
                    className="gh-input"
                    value={graduationTarget}
                    onChange={(e) => setGraduationTarget(e.target.value)}
                    placeholder="e.g. Class of 2028 · STEM Honours & Engineering Portfolio"
                    maxLength={100}
                  />
                </div>
              )}
            </div>
          )}

          {category === 'pbl' && (
            <div className="gl-flow-context-grid">
              <div className="gl-field gl-field-full">
                <label htmlFor="gl-flow-project" className="gl-field-label">Linked PBL Project</label>
                <select
                  id="gl-flow-project"
                  className="gh-input gl-select"
                  value={projectId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setProjectId(pid);
                    const found = pblChoices.find((p) => p.id === pid);
                    setProjectTitle(found ? found.title : '');
                  }}
                >
                  <option value="">General PBL / Custom Project</option>
                  {pblChoices.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} {p.enrolled ? '(Enrolled)' : `(${p.gradeBand})`}
                    </option>
                  ))}
                </select>
                {!projectId && (
                  <input
                    className="gh-input"
                    style={{ marginTop: '0.4rem' }}
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Or enter your custom project or team name…"
                    maxLength={100}
                    aria-label="Custom project title"
                  />
                )}
              </div>
            </div>
          )}

          <input
            id="gl-flow-explore"
            className="gh-input gl-flow-input"
            value={explore}
            maxLength={LIMITS.text}
            autoFocus
            onChange={(e) => setExplore(e.target.value)}
            placeholder="For example: how to build a game"
          />

          {/* Starter ideas — includes original IDEAS for compatibility plus category-specific ideas */}
          <div className="gl-chip-group" role="group" aria-label="Ideas to get you started">
            {IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                className="gl-pill"
                aria-pressed={explore === idea}
                onClick={() => setExplore(idea)}
              >
                {idea}
              </button>
            ))}
            {(CATEGORY_IDEAS[category] || []).slice(0, 2).map((idea) => (
              <button
                key={idea}
                type="button"
                className="gl-pill gl-pill-subtle"
                aria-pressed={explore === idea}
                onClick={() => setExplore(idea)}
              >
                {idea}
              </button>
            ))}
          </div>

          {/* Target Date & Measurable Outcome */}
          <div className="gl-flow-context-grid" style={{ marginTop: '0.4rem' }}>
            <div className="gl-field">
              <label htmlFor="gl-flow-date" className="gl-field-label">
                <Calendar size={13} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 4 }} />
                Target Date (Optional)
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  id="gl-flow-date"
                  type="date"
                  className="gh-input"
                  style={{ flex: 1, minWidth: 140 }}
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
                <button
                  type="button"
                  className="gl-pill gl-pill-subtle"
                  onClick={() => setTargetDate(defaultTargetDate(7))}
                >
                  +1 wk
                </button>
                <button
                  type="button"
                  className="gl-pill gl-pill-subtle"
                  onClick={() => setTargetDate(defaultTargetDate(14))}
                >
                  +2 wks
                </button>
                <button
                  type="button"
                  className="gl-pill gl-pill-subtle"
                  onClick={() => setTargetDate(defaultTargetDate(30))}
                >
                  +1 mo
                </button>
              </div>
            </div>

            <div className="gl-field">
              <label htmlFor="gl-flow-outcome" className="gl-field-label">
                Measurable Outcome (What does success look like?)
              </label>
              <input
                id="gl-flow-outcome"
                className="gh-input"
                value={measurableOutcome}
                maxLength={LIMITS.outcome}
                onChange={(e) => setMeasurableOutcome(e.target.value)}
                placeholder={
                  category === 'academic'
                    ? 'e.g. Score 85%+ on the unit assessment & finish all practice sets'
                    : 'e.g. Working prototype tested with 3 users and logged in portfolio'
                }
              />
            </div>
          </div>
        </>
      )}

      {!showReview && question === 'show' && (
        <>
          <h2 id="gl-flow-question" ref={heading} tabIndex={-1}>How do you want to show what you learned?</h2>
          <p className="gl-subtitle">You can skip this if you’re not sure yet.</p>
          <div className="gl-chip-group" role="group" aria-labelledby="gl-flow-question">
            {SHOW_HOW.map((it) => (
              <button
                key={it.id}
                type="button"
                className="gl-pill"
                aria-pressed={showHow === it.id}
                onClick={() => setShowHow((cur) => (cur === it.id ? null : it.id))}
              >
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}

      {!showReview && question === 'help' && (
        <>
          <h2 id="gl-flow-question" ref={heading} tabIndex={-1}>What helps you do your best work?</h2>
          <p className="gl-subtitle">Pick up to {MAX_SUPPORTS}, or skip this. Your coach can see these so they know what helps.</p>
          <div className="gl-chip-group" role="group" aria-labelledby="gl-flow-question">
            {ordered.map((it) => {
              const selected = supports.includes(it.id);
              return (
                <button
                  key={it.id}
                  type="button"
                  className="gl-pill"
                  aria-pressed={selected}
                  disabled={!selected && supports.length >= MAX_SUPPORTS}
                  onClick={() => setSupports(selected ? supports.filter((x) => x !== it.id) : [...supports, it.id])}
                >
                  {it.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {!showReview && question === 'first' && (
        <>
          <div className="gl-flow-step-head">
            <div>
              <h2 id="gl-flow-question" ref={heading} tabIndex={-1}>Choose your first small step</h2>
              <p className="gl-subtitle">Pick something you could do today, or break your goal into daily &amp; weekly milestones.</p>
            </div>
            <button
              type="button"
              className="gh-btn gh-btn-sm gh-btn-accent gl-ai-suggest-btn"
              disabled={aiLoading || !explore.trim()}
              onClick={handleRequestAiSuggestions}
            >
              {aiLoading ? <RefreshCw size={14} className="spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
              <span>{aiLoading ? 'Generating steps…' : 'Suggest steps with Gemini AI'}</span>
            </button>
          </div>

          {aiNote && (
            <p className="gl-ai-note" role="status">
              <Sparkles size={14} aria-hidden="true" /> {aiNote}
            </p>
          )}

          {/* Classic radio options (preserves exact compatibility with student-clarity-ui tests) */}
          <div className="gl-flow-steps" role="radiogroup" aria-labelledby="gl-flow-question">
            {options.map((text) => (
              <label key={text} className="gl-flow-step" data-on={step === text || undefined}>
                <input
                  type="radio"
                  name="gl-first-step"
                  checked={step === text}
                  onChange={() => setStep(text)}
                />
                <span>{text}</span>
              </label>
            ))}
            <label className="gl-flow-step" data-on={step === 'own' || undefined}>
              <input
                type="radio"
                name="gl-first-step"
                checked={step === 'own'}
                onChange={() => setStep('own')}
              />
              <span>Write my own</span>
            </label>
            {step === 'own' && (
              <input
                className="gh-input gl-flow-input"
                value={ownStep}
                maxLength={LIMITS.text}
                autoFocus
                aria-label="My first small step"
                onChange={(e) => setOwnStep(e.target.value)}
                placeholder="What’s one small thing you could do?"
              />
            )}
          </div>

          {/* Multi-step daily/weekly breakdown editor */}
          <div className="gl-multi-steps-box">
            <div className="gl-multi-steps-header">
              <strong>Actionable Milestones &amp; Daily/Weekly Steps ({multiSteps.length}/{LIMITS.steps})</strong>
              <span className="gl-subtitle">Edit, reorder, or add smaller daily/weekly actions</span>
            </div>

            {multiSteps.length > 0 && (
              <ul className="gl-multi-steps-list" aria-label="Planned steps">
                {multiSteps.map((ms, idx) => (
                  <li key={ms.id} className="gl-multi-step-row">
                    <span className="gl-multi-step-num">{idx + 1}</span>
                    <input
                      className="gh-input gl-multi-step-input"
                      value={ms.text}
                      maxLength={LIMITS.text}
                      aria-label={`Step ${idx + 1}`}
                      onChange={(e) => updateMultiStepText(ms.id, e.target.value)}
                    />
                    <select
                      className="gh-input gl-multi-step-freq"
                      value={ms.frequency || 'daily'}
                      aria-label={`Step ${idx + 1} frequency`}
                      onChange={(e) => updateMultiStepFreq(ms.id, e.target.value)}
                    >
                      {STEP_FREQUENCIES.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="gl-icon-btn gl-step-delete"
                      aria-label={`Remove step ${idx + 1}`}
                      onClick={() => removeMultiStep(ms.id)}
                    >
                      <Trash size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {multiSteps.length < LIMITS.steps && (
              <div className="gl-multi-step-add">
                <input
                  className="gh-input"
                  style={{ flex: 1 }}
                  value={newStepDraft}
                  maxLength={LIMITS.text}
                  onChange={(e) => setNewStepDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomMultiStep();
                    }
                  }}
                  placeholder="Add another daily or weekly action step…"
                  aria-label="Additional action step"
                />
                <select
                  className="gh-input gl-multi-step-freq"
                  value={newStepFreq}
                  aria-label="Step frequency"
                  onChange={(e) => setNewStepFreq(e.target.value)}
                >
                  {STEP_FREQUENCIES.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="gh-btn gh-btn-sm"
                  disabled={!newStepDraft.trim()}
                  onClick={addCustomMultiStep}
                >
                  <Plus size={14} aria-hidden="true" /> Add step
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Review & Confirm View */}
      {showReview && (
        <div className="gl-review-box" aria-live="polite">
          <h2 id="gl-flow-question" ref={heading} tabIndex={-1}>Review &amp; Confirm Your Goal</h2>
          <p className="gl-subtitle">Check everything below before saving to your learning plan.</p>
          <div className="gl-review-summary">
            <div className="gl-review-badges">
              <span className={`gl-cat-badge gl-cat-${category}`}>{activeCatMeta.label}</span>
              {goalType && <span className="gl-subtype-badge">{subtypeLabel(goalType)}</span>}
              {category === 'academic' && resolvedSubject && (
                <span className="gl-context-badge"><BookOpen size={12} /> {resolvedSubject}</span>
              )}
              {category === 'pbl' && projectTitle && (
                <span className="gl-context-badge"><Rocket size={12} /> {projectTitle}</span>
              )}
              {targetDate && (
                <span className="gl-context-badge"><Calendar size={12} /> Due {targetDate}</span>
              )}
            </div>
            <h3 className="gl-review-title">{goalSentence({ explore, showHow, supports })}</h3>
            {measurableOutcome && (
              <p className="gl-review-outcome">
                <strong>Measurable outcome:</strong> {measurableOutcome}
              </p>
            )}
            <div className="gl-review-steps">
              <strong>Action plan ({buildGoalPayload().steps.length} steps):</strong>
              <ol>
                {buildGoalPayload().steps.map((s) => (
                  <li key={s.id}>
                    <span>{s.text}</span>
                    {s.frequency && <small className="gl-freq-tag">{s.frequency}</small>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className="gl-flow-actions">
        {showReview ? (
          <button type="button" className="gh-btn gh-btn-ghost" onClick={() => setShowReview(false)}>
            <ArrowLeft size={15} aria-hidden="true" /> Back to edit
          </button>
        ) : at > 0 ? (
          <button type="button" className="gh-btn gh-btn-ghost" onClick={() => go(at - 1)}>
            <ArrowLeft size={15} aria-hidden="true" /> Back
          </button>
        ) : onCancel ? (
          <button type="button" className="gh-btn gh-btn-ghost" onClick={onCancel}>Not now</button>
        ) : (
          <span />
        )}

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {question === 'first' && !showReview && hasStepsReady && (
            <button
              type="button"
              className="gh-btn gh-btn-ghost"
              onClick={() => { moved.current = true; setShowReview(true); }}
            >
              Review goal
            </button>
          )}
          {question === 'first' || showReview ? (
            <button type="submit" className="gh-btn gh-btn-accent" disabled={!hasStepsReady}>
              <Check size={15} aria-hidden="true" /> {isEditing ? 'Save changes' : 'Save my goal'}
            </button>
          ) : (
            <button type="submit" className="gh-btn gh-btn-accent" disabled={question === 'explore' && !explore.trim()}>
              {(question === 'show' && !showHow) || (question === 'help' && !supports.length) ? 'Skip' : 'Next'}<ArrowRight size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
