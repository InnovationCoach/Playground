import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, CheckCircle2, ChevronDown, Circle, Compass, Cpu, Eye,
  Flame, HeartHandshake, Layers, Lightbulb, MessageSquareHeart,
  Rocket, Sparkles, Target, Wrench
} from 'lucide-react';
import { db, doc, setDoc } from '../../firebase.js';
import { PHASES, TERM } from '../pbl/content/pblModel.js';
import { LIBRARY_PROGRAMS, WELEARN_DT_FRAMEWORK } from '../pbl/programs/libraryProgramsData.js';
import { normaliseProgram } from '../pbl/programs/catalog.js';
import { usePblProject } from '../pbl/engine/usePblProject.js';
import { toggleTask, updateProject } from '../pbl/engine/pblProject.js';
import { useProgramProgress } from '../pbl/programs/useProgramProgress.js';
import {
  chooseOption, isSessionDone, progressDocId, programProgress, setConfidence,
  setReflection, startProgram, toggleSession, toggleStep, LIMITS
} from '../pbl/programs/progress.js';
import { addToMyCourse } from '../../services/pblService.js';
import { taskText } from './lowerSecondaryModel.js';

/**
 * The 8-stage WeLearn Design Thinking structure adapted for Lower-Secondary (ages 11–14).
 * Combines the 7 core PHASES from pblModel.js with Stage 8 (Reflect and iterate) from
 * WELEARN_DT_FRAMEWORK so every project and course shares the same 8-stage mental model.
 */
export const EIGHT_STAGES = Object.freeze([
  {
    number: 1,
    id: 'explore',
    title: 'Explore',
    strap: 'Try STEAM activities & spot sparks',
    weeks: 'Weeks 1–3',
    tone: 'mint',
    Icon: Compass,
    goal: 'Try hands-on science, design and tech activities, and write down what surprises you.',
    tasks: PHASES.find((p) => p.id === 'explore')?.tasks || [
      'Complete at least two hands-on STEAM activities.',
      'Write down three "sparks": things that surprised you or made you curious.',
      'Spot one sensor, tool or test method you could use in your own project.'
    ],
    evidence: ['A list of your 3 sparks', 'A screenshot or photo from an activity', 'One test result and what it means']
  },
  {
    number: 2,
    id: 'empathise',
    title: 'Empathise',
    strap: 'Listen & find a real problem',
    weeks: 'Weeks 3–4',
    tone: 'amber',
    Icon: HeartHandshake,
    goal: 'Find the people or environment your topic affects. Listen to their real experience before designing.',
    tasks: PHASES.find((p) => p.id === 'empathise')?.tasks || [
      'Pick one or two topics you care about and connect them to the term theme.',
      'Talk to at least two people affected by the problem.',
      'Write down what they said, what they do, and what frustrates them.'
    ],
    evidence: ['Interview notes or quotes', 'An observation photo or sketch', 'A simple empathy map (says, thinks, does, feels)']
  },
  {
    number: 3,
    id: 'define',
    title: 'Define',
    strap: 'Say clearly what you will solve',
    weeks: 'Weeks 4–5',
    tone: 'lavender',
    Icon: Target,
    goal: 'Turn what you learned into one clear "How might we…" mission and decide how you will measure success.',
    tasks: PHASES.find((p) => p.id === 'define')?.tasks || [
      'Write your "How might we…" problem statement.',
      'Name who it helps and why it matters to them.',
      'Say whether it helps people, the environment, or both.',
      'List 2–3 measurable success criteria and your constraints (time, kit, safety).'
    ],
    evidence: ['Your "How might we…" statement', 'Measurable success criteria', 'Your project goal and constraints']
  },
  {
    number: 4,
    id: 'ideate',
    title: 'Ideate & Plan',
    strap: 'Many ideas, one clear plan',
    weeks: 'Weeks 5–6',
    tone: 'sky',
    Icon: Lightbulb,
    goal: 'Sketch lots of wild and practical ideas first, then pick your strongest idea and plan the build.',
    tasks: PHASES.find((p) => p.id === 'ideate')?.tasks || [
      'Sketch or list at least 8 ideas before judging any of them.',
      'Pick your strongest idea using your success criteria and explain why.',
      'Break your build into weekly steps: materials, sensors, and code needed.'
    ],
    evidence: ['8 idea sketches or notes', 'Why you chose your winning idea', 'Your step-by-step build & kit plan']
  },
  {
    number: 5,
    id: 'prototype',
    title: 'Prototype',
    strap: 'Build and program it',
    weeks: 'Weeks 6–9',
    tone: 'purple',
    Icon: Cpu,
    goal: 'Build a rough working model and code it step by step. Test each part and understand how it works.',
    tasks: PHASES.find((p) => p.id === 'prototype')?.tasks || [
      'Build a simple first version quickly using cardboard, LEGO, or maker kit.',
      'Write and test your code on the device, and explain what each part does.',
      'Save photos or notes of each version showing what changed and why.'
    ],
    evidence: ['Photo or video of Prototype v1 & v2', 'Your commented code', 'One debugging story: the bug and how you fixed it']
  },
  {
    number: 6,
    id: 'test',
    title: 'Test & Improve',
    strap: 'Prove it works with real data',
    weeks: 'Weeks 9–11',
    tone: 'mint',
    Icon: Wrench,
    goal: 'Test your prototype against your success criteria, record real measurements, and make it better.',
    tasks: PHASES.find((p) => p.id === 'test')?.tasks || [
      'Run at least 3 test trials and record the numbers in a table.',
      'Ask real users or classmates to try your prototype and note their feedback.',
      'Make at least one improvement based on your test results and test again.'
    ],
    evidence: ['Test data table or chart', 'User feedback notes', 'Before-and-after photo of your improvement']
  },
  {
    number: 7,
    id: 'share',
    title: 'Showcase',
    strap: 'Share your story & demo',
    weeks: 'Weeks 11–12',
    tone: 'amber',
    Icon: Rocket,
    goal: 'Show what you built, the problem it solves, and the evidence you collected along the way.',
    tasks: PHASES.find((p) => p.id === 'share')?.tasks || [
      'Choose your format: a live showcase stand or a short presentation with slides.',
      'Tell your full story: problem, people, prototype versions, test data, and impact.',
      'Practise your demo with a partner and time your explanation.'
    ],
    evidence: ['Showcase slides, poster or demo board', 'Rehearsal feedback from a peer or coach']
  },
  {
    number: 8,
    id: 'reflect',
    title: 'Reflect & Iterate',
    strap: 'Look back & level up',
    weeks: 'Week 12',
    tone: 'lavender',
    Icon: MessageSquareHeart,
    goal: 'Celebrate what worked, honest mistakes you learned from, and what you would build next.',
    tasks: [
      'Write what you are most proud of making or solving in this project.',
      'Name one mistake or tough moment and what it taught you.',
      'Write one improvement you would make if you had two more weeks.'
    ],
    evidence: ['Final reflection in your portfolio', 'Next-iteration idea sketch']
  }
]);

const ADD_COURSE_TIMEOUT_MS = 12000;

const CONFIDENCE_OPTIONS = [
  { n: 1, emoji: '😵', label: 'Stuck' },
  { n: 2, emoji: '🤔', label: 'Trying' },
  { n: 3, emoji: '🙂', label: 'Okay' },
  { n: 4, emoji: '😎', label: 'Confident' },
  { n: 5, emoji: '🌟', label: 'Can teach it' }
];

const SENTENCE_STARTERS = [
  'Today I figured out that ',
  'One tricky part was ',
  'Next session I want to test '
];

/**
 * The shared progress hooks cancel their pending cloud save on unmount. Leaving this
 * page within seconds of a tick must not leave it on one device, so finish that save.
 */
function useSaveOnLeave(uid, activityId, value, syncState) {
  const unsaved = useRef(false), latest = useRef(value);
  latest.current = value;
  useEffect(() => { if (syncState === 'saved') unsaved.current = false; }, [syncState]);
  useEffect(() => () => {
    if (!unsaved.current || !uid) return;
    setDoc(doc(db, 'users', `${uid}/activityProgress/${activityId}`), { ...latest.current, activityId }).catch((err) => console.warn('[PBL] Save on leaving failed, keeping local copy:', err?.message));
  }, [uid, activityId]);
  return () => { unsaved.current = true; };
}

function reflectStorageKey(uid) {
  return `hearisland.ls.stage8.v1:${uid || 'signed-out'}`;
}

function readStage8Tasks(uid) {
  try {
    const raw = localStorage.getItem(reflectStorageKey(uid));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

function writeStage8Tasks(uid, list) {
  try {
    localStorage.setItem(reflectStorageKey(uid), JSON.stringify(list));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Interactive 8-Stage Design Thinking Structure & Checklist tailored for Lower-Secondary.
 * Persists stages 1–7 to the learner's real PBL project (`usePblProject`) and stage 8
 * (`Reflect & Iterate`, from WELEARN_DT_FRAMEWORK) to this device, per account: the
 * term project has no field for it, and the checklist says so.
 */
export function EightStageStructureCard({ uid }) {
  const { project, apply: applyProject, syncState } = usePblProject(uid, TERM.id);
  const markUnsaved = useSaveOnLeave(uid, `pbl-${TERM.id}`, project, syncState);
  const apply = (fn) => { markUnsaved(); applyProject(fn); };
  const [stage8Done, setStage8Done] = useState(() => readStage8Tasks(uid));
  const [activeStageId, setActiveStageId] = useState(() => project?.currentPhase || 'explore');

  useEffect(() => {
    setStage8Done(readStage8Tasks(uid));
  }, [uid]);

  const getDoneIndices = (stageId) => {
    if (stageId === 'reflect') return stage8Done;
    return project?.tasksDone?.[stageId] || [];
  };

  const toggleStageTask = (stageId, index) => {
    if (stageId === 'reflect') {
      setStage8Done((prev) => {
        const next = prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b);
        writeStage8Tasks(uid, next);
        return next;
      });
      return;
    }
    apply((p) => toggleTask(p, stageId, index));
  };

  const selectStage = (stageId) => {
    setActiveStageId(stageId);
    if (stageId !== 'reflect') {
      apply((p) => (p.currentPhase === stageId ? p : updateProject(p, { currentPhase: stageId })));
    }
  };

  const totalTasks = EIGHT_STAGES.reduce((acc, s) => acc + s.tasks.length, 0);
  const completedTasks = EIGHT_STAGES.reduce((acc, s) => acc + getDoneIndices(s.id).length, 0);
  const completedStages = EIGHT_STAGES.filter((s) => getDoneIndices(s.id).length === s.tasks.length && s.tasks.length > 0).length;
  const activeStage = EIGHT_STAGES.find((s) => s.id === activeStageId) || EIGHT_STAGES[0];
  const activeDone = getDoneIndices(activeStage.id);
  const ActiveIcon = activeStage.Icon;

  return (
    <section className="ls-card ls-eight-stages" aria-labelledby="ls-eight-stages-title">
      <div className="ls-card-head">
        <div>
          <span className="ls-kicker"><Layers size={15} aria-hidden="true" /> 8-Stage Design Thinking Journey</span>
          <h2 id="ls-eight-stages-title">The 8 stages &amp; project checklist</h2>
        </div>
        <span className="ls-stage-counter" aria-label={`${completedTasks} of ${totalTasks} checklist steps completed`}>
          <strong>{completedTasks} / {totalTasks}</strong> steps done · {completedStages}/8 stages
        </span>
      </div>
      <p className="ls-muted">
        Every project follows {WELEARN_DT_FRAMEWORK.phases.length} clear stages from first spark to final showcase. Pick any stage below to check off your steps.
      </p>

      {/* 8-Stage Visual Stepper Grid */}
      <ol className="ls-stage-grid" aria-label="8 project stages">
        {EIGHT_STAGES.map((stage) => {
          const doneList = getDoneIndices(stage.id);
          const isComplete = stage.tasks.length > 0 && doneList.length === stage.tasks.length;
          const isStarted = doneList.length > 0;
          const isCurrent = stage.id === activeStage.id;
          const StageIcon = stage.Icon;
          return (
            <li key={stage.id} className={`ls-stage-tile is-tone-${stage.tone}${isCurrent ? ' is-selected' : ''}${isComplete ? ' is-complete' : isStarted ? ' is-started' : ''}`}>
              <button
                type="button"
                className="ls-stage-tile-btn"
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => selectStage(stage.id)}
              >
                <span className="ls-stage-tile-top">
                  <span className="ls-stage-num">
                    {isComplete ? <CheckCircle2 size={16} aria-hidden="true" /> : `Stage ${stage.number}`}
                  </span>
                  <span className="ls-stage-icon" aria-hidden="true"><StageIcon size={16} /></span>
                </span>
                <strong className="ls-stage-name">{stage.title}</strong>
                <small className="ls-stage-progress">{doneList.length}/{stage.tasks.length} steps</small>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Active Stage Detail & Interactive Checklist */}
      <div className={`ls-stage-detail is-tone-${activeStage.tone}`} role="region" aria-labelledby={`ls-stage-panel-${activeStage.id}`}>
        <div className="ls-stage-detail-head">
          <div className="ls-stage-detail-title">
            <span className="ls-stage-badge">
              <ActiveIcon size={18} aria-hidden="true" />
              Stage {activeStage.number} of 8 · {activeStage.weeks}
            </span>
            <h3 id={`ls-stage-panel-${activeStage.id}`}>{activeStage.title}: {activeStage.strap}</h3>
            <p>{activeStage.goal}</p>
          </div>
          <span className="ls-stage-pill-status">
            {activeDone.length === activeStage.tasks.length ? 'Stage complete! 🎉' : `${activeDone.length} of ${activeStage.tasks.length} ticked`}
          </span>
        </div>

        <div className="ls-stage-columns">
          <div className="ls-stage-checklist-col">
            <h4 className="ls-subhead">Stage {activeStage.number} checklist</h4>
            <ul className="ls-checks ls-stage-checks">
              {activeStage.tasks.map((task, idx) => {
                const checked = activeDone.includes(idx);
                return (
                  <li key={task}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggleStageTask(activeStage.id, idx)}
                    >
                      {checked ? <CheckCircle2 size={22} aria-hidden="true" /> : <Circle size={22} aria-hidden="true" />}
                      <span>
                        <span className={checked ? 'ls-done' : ''}>{task}</span>
                        <small>Stage {activeStage.number} · Step {idx + 1}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="ls-stage-evidence-col">
            <h4 className="ls-subhead">Evidence to collect in this stage</h4>
            <ul className="ls-evidence-tags">
              {activeStage.evidence.map((item) => (
                <li key={item}>
                  <Sparkles size={15} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="ls-stage-nav-row">
              {activeStage.number > 1 && (
                <button
                  type="button"
                  className="ls-secondary"
                  onClick={() => selectStage(EIGHT_STAGES[activeStage.number - 2].id)}
                >
                  ← Stage {activeStage.number - 1}: {EIGHT_STAGES[activeStage.number - 2].title}
                </button>
              )}
              {activeStage.number < EIGHT_STAGES.length && (
                <button
                  type="button"
                  className="ls-secondary"
                  onClick={() => selectStage(EIGHT_STAGES[activeStage.number].id)}
                >
                  Next: Stage {activeStage.number + 1} ({EIGHT_STAGES[activeStage.number].title}) →
                </button>
              )}
            </div>
          </div>
        </div>
        {activeStage.id === 'reflect' && <p className="ls-note">Stage 8 ticks are saved on this device only.</p>}
        {syncState === 'local-only' && (
          <p className="ls-note" role="status">Saved on this device · account sync unavailable</p>
        )}
      </div>
    </section>
  );
}

/**
 * Interactive 8-Stage Course Mission & Session Checklist embedded inside each Lower-Secondary course card.
 * Uses native <details> disclosure so all mission text remains searchable via Find-in-Page.
 */
export function CourseEightStageDrawer({ uid, program, summary: courseSummary = null, defaultOpen = false, onSummary, onChanged }) {
  // Only the course's own sessions and tasks: a gap stays a gap rather than being filled with template text.
  const normalised = useMemo(() => {
    const base = program?.sessions ? program : normaliseProgram(program) || program;
    const phases = (Array.isArray(base?.phases) ? base.phases : []).map((ph, pIdx) => {
      const phId = ph.id || ph.phaseId || `phase-${pIdx + 1}`;
      const sessions = (Array.isArray(ph.sessions) ? ph.sessions : []).map((s, sIdx) => ({
        ...s, sessionNumber: s.sessionNumber || sIdx + 1, phaseId: phId, activities: Array.isArray(s.activities) ? s.activities : []
      }));
      return { ...ph, id: phId, phaseId: phId, learningGoal: ph.learningGoal || ph.goal, deliverables: (ph.deliverables || ph.evidence || []).map(taskText).filter(Boolean), sessions };
    });
    return { ...base, phases, sessions: phases.flatMap((ph) => ph.sessions) };
  }, [program]);

  const phases = normalised.phases || [];
  const { progress, apply: applyProgress, syncState } = useProgramProgress(uid, normalised);
  const markUnsaved = useSaveOnLeave(uid, progressDocId(normalised.id), progress, syncState);
  const apply = (fn) => { markUnsaved(); onChanged?.(); applyProgress(fn); };
  // The course read already found saved sessions, but this copy hasn't loaded them yet:
  // a tick now would save over them.
  const stillLoading = !progress.updatedAt && (courseSummary?.done || 0) > 0;
  const liveSummary = normalised.sessions?.length ? programProgress(progress, normalised) : null;
  // Keep the card's count on the same record as this checklist.
  useEffect(() => { if (progress.updatedAt && liveSummary) onSummary?.(liveSummary); }, [progress]); // eslint-disable-line react-hooks/exhaustive-deps
  const effectiveSummary = liveSummary?.done > 0 || progress?.updatedAt ? liveSummary : (courseSummary || liveSummary);

  const initialPhaseId = effectiveSummary?.next?.phaseId || phases[0]?.id || phases[0]?.phaseId || 'explore';
  const [selectedPhaseId, setSelectedPhaseId] = useState(initialPhaseId);

  if (!phases.length) return null;

  const activePhase = phases.find((ph) => (ph.id || ph.phaseId) === selectedPhaseId) || phases[0];
  const activePhaseIdx = Math.max(0, phases.indexOf(activePhase));
  const sessions = Array.isArray(activePhase?.sessions) ? activePhase.sessions : [];

  return (
    <details className="ls-course-drawer" open={defaultOpen || undefined}>
      <summary className="ls-course-drawer-summary">
        <span className="ls-course-drawer-label">
          <BookOpen size={18} aria-hidden="true" />
          <span>Course stages &amp; mission checklist ({phases.length} stages)</span>
        </span>
        <ChevronDown className="ls-chev" size={18} aria-hidden="true" />
      </summary>

      <div className="ls-course-drawer-body">
        {normalised.drivingQuestion && (
          <p className="ls-course-dq">
            <strong>Driving question:</strong> {normalised.drivingQuestion}
          </p>
        )}

        {/* Course Stage Stepper */}
        <ol className="ls-course-stage-tabs" aria-label={`${normalised.title} stages`}>
          {phases.map((ph, idx) => {
            const phId = ph.id || ph.phaseId || `phase-${idx + 1}`;
            const phSummary = effectiveSummary?.byPhase?.[phId];
            const isCurrent = phId === (activePhase.id || activePhase.phaseId);
            const shortTitle = (ph.title || `Stage ${idx + 1}`).split(':')[0].trim();
            return (
              <li key={phId}>
                <button
                  type="button"
                  className={`ls-course-stage-tab${isCurrent ? ' is-active' : ''}${phSummary?.complete ? ' is-done' : ''}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  onClick={() => setSelectedPhaseId(phId)}
                >
                  <span className="ls-course-stage-num">
                    {phSummary?.complete ? <CheckCircle2 size={15} aria-hidden="true" /> : idx + 1}
                  </span>
                  <span>{shortTitle}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Selected Stage Header */}
        <div className="ls-course-phase-panel">
          <div className="ls-course-phase-head">
            <span className="ls-kicker">Stage {activePhaseIdx + 1} of {phases.length}</span>
            <h4>{activePhase.title}</h4>
            {(activePhase.learningGoal || activePhase.goal) && (
              <p className="ls-muted">{activePhase.learningGoal || activePhase.goal}</p>
            )}
          </div>

          {/* Sessions & Step Checklists */}
          <div className="ls-course-sessions" inert={stillLoading ? '' : undefined} aria-busy={stillLoading}>
            {sessions.map((session, sIdx) => {
              const sNum = session.sessionNumber || sIdx + 1;
              const entry = progress?.sessions?.[sNum];
              const done = isSessionDone(entry, session);
              const steps = entry?.steps || [];
              const activities = Array.isArray(session.activities) ? session.activities : [];

              return (
                <div key={sNum} className={`ls-mission-card${done ? ' is-done' : ''}`}>
                  <div className="ls-mission-head">
                    <div>
                      <span className="ls-mission-kicker">
                        Mission {sNum} {session.durationMin || session.minutes ? `· ${session.durationMin || session.minutes} min` : ''}
                      </span>
                      <h5>{session.title || `Session ${sNum}`}</h5>
                    </div>
                    <button
                      type="button"
                      className={`ls-mission-done-btn${done ? ' is-done' : ''}`}
                      aria-pressed={done}
                      onClick={() => apply((prev) => toggleSession(startProgram(prev), session))}
                    >
                      {done ? <CheckCircle2 size={18} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}
                      <span>{done ? 'Mission complete' : 'Mark complete'}</span>
                    </button>
                  </div>

                  {session.learningGoal && <p className="ls-muted">{session.learningGoal}</p>}

                  {activities.length > 0 && (
                    <ul className="ls-checks ls-mission-checks" aria-label={`Mission ${sNum} checklist`}>
                      {activities.map((act, aIdx) => {
                        const stepDone = steps.includes(aIdx);
                        return (
                          <li key={`${aIdx}-${taskText(act)}`}>
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={stepDone}
                              onClick={() => apply((prev) => toggleStep(startProgram(prev), session, aIdx))}
                            >
                              {stepDone ? <CheckCircle2 size={20} aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}
                              <span className={stepDone ? 'ls-done' : ''}>{taskText(act)}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {session.learnerChoices?.options?.length > 0 && (
                    <div className="ls-mission-choices" role="group" aria-label={session.learnerChoices.question || 'Choose your path'}>
                      <p className="ls-subhead">{session.learnerChoices.question || 'Choose your focus:'}</p>
                      <div className="ls-choice-row">
                        {session.learnerChoices.options.map((opt) => {
                          const picked = entry?.choice === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              className={`ls-choice-btn${picked ? ' is-picked' : ''}`}
                              aria-pressed={picked}
                              onClick={() => apply((prev) => chooseOption(startProgram(prev), session, opt.id))}
                            >
                              <strong>{opt.label}</strong>
                              {opt.description && <small>{opt.description}</small>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Reflection & Confidence Check */}
                  <details className="ls-mission-reflect">
                    <summary>
                      <span>💭 Quick reflection &amp; confidence check</span>
                      {entry?.confidence && <span className="ls-conf-pill">{CONFIDENCE_OPTIONS.find((c) => c.n === entry.confidence)?.emoji} {CONFIDENCE_OPTIONS.find((c) => c.n === entry.confidence)?.label}</span>}
                    </summary>
                    <div className="ls-mission-reflect-body">
                      {session.reflectionPrompt && <p className="ls-muted">{session.reflectionPrompt}</p>}
                      <div className="ls-starter-row" role="group" aria-label="Reflection starters">
                        {SENTENCE_STARTERS.map((starter) => (
                          <button
                            key={starter}
                            type="button"
                            className="ls-starter-btn"
                            onClick={() => {
                              const cur = entry?.reflection || '';
                              const next = `${cur}${cur ? '\n' : ''}${starter}`.slice(0, LIMITS.reflection);
                              apply((prev) => setReflection(startProgram(prev), sNum, next));
                            }}
                          >
                            + “{starter.trim()}…”
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        maxLength={LIMITS.reflection}
                        placeholder="Write what you noticed, built, or tested…"
                        aria-label={`Reflection for Mission ${sNum}`}
                        value={entry?.reflection || ''}
                        onChange={(e) => apply((prev) => setReflection(startProgram(prev), sNum, e.target.value))}
                      />
                      <div className="ls-conf-row" role="group" aria-label={`Confidence for Mission ${sNum}`}>
                        {CONFIDENCE_OPTIONS.map((c) => (
                          <button
                            key={c.n}
                            type="button"
                            className={`ls-conf-btn${entry?.confidence === c.n ? ' is-picked' : ''}`}
                            aria-pressed={entry?.confidence === c.n}
                            onClick={() => apply((prev) => setConfidence(startProgram(prev), sNum, c.n))}
                          >
                            <span aria-hidden="true">{c.emoji}</span>
                            <span>{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>

          {Array.isArray(activePhase.deliverables) && activePhase.deliverables.length > 0 && (
            <div className="ls-phase-deliverables">
              <span className="ls-subhead">Stage deliverables:</span>
              <ul className="ls-evidence-tags">
                {activePhase.deliverables.map((d) => (
                  <li key={d}><Sparkles size={14} aria-hidden="true" /><span>{d}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

/**
 * Lower-Secondary Course Catalog inside My Learning.
 * Lets learners explore the official WeLearn PBL programs, preview their stages,
 * and add/start a course directly within the Lower-Secondary layout.
 */
export function LowerSecondaryCourseCatalog({ uid, enrolledIds = [], onCourseAdded }) {
  const [addingId, setAddingId] = useState(null);
  const [addError, setAddError] = useState('');
  const enrolledSet = new Set(enrolledIds);

  const handleStartCourse = async (program) => {
    setAddingId(program.id);
    setAddError('');
    try {
      // Firestore queues writes while offline and never rejects, so a stuck save needs its own limit.
      await Promise.race([addToMyCourse(program.id, uid), new Promise((_, reject) => { setTimeout(() => reject(new Error('Timed out')), ADD_COURSE_TIMEOUT_MS); })]);
      onCourseAdded?.(program.id);
    } catch {
      // Nothing is shown as added until it's confirmed. Trying again is safe: enrolling is idempotent.
      setAddError(`${program.title} couldn’t be added. Check your connection and try again.`);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <details className="ls-catalog-drawer">
      <summary className="ls-catalog-summary">
        <span className="ls-course-drawer-label">
          <Flame size={18} aria-hidden="true" />
          <span>Explore project courses ({LIBRARY_PROGRAMS.length} ready to start)</span>
        </span>
        <ChevronDown className="ls-chev" size={18} aria-hidden="true" />
      </summary>

      {addError && <p className="ls-note ls-note-warn" role="alert">{addError}</p>}
      <div className="ls-catalog-grid">
        {LIBRARY_PROGRAMS.map((prog) => {
          const isAdded = enrolledSet.has(prog.id);
          const stageNames = (prog.phases || []).map((p) => (p.title || '').split(':')[0].trim()).filter(Boolean);
          return (
            <article key={prog.id} className="ls-catalog-card">
              <div className="ls-catalog-card-top">
                <span className="ls-tag">{prog.theme}</span>
                <span className="ls-tag ls-tag-stages">{(prog.phases || []).length} stages · {prog.durationWeeks || 12} wks</span>
              </div>
              <h3>{prog.title}</h3>
              <p className="ls-muted">{prog.drivingQuestion}</p>
              <ol className="ls-stages" aria-label={`${prog.title} stages`}>
                {stageNames.map((name, idx) => (
                  <li key={`${prog.id}-${idx}`} className="is-planned">{idx + 1}. {name}</li>
                ))}
              </ol>
              <div className="ls-catalog-actions">
                {isAdded ? (
                  <span className="ls-tag ls-tag-added"><CheckCircle2 size={15} aria-hidden="true" /> In My Courses</span>
                ) : (
                  <button
                    type="button"
                    className="ls-primary-button"
                    disabled={addingId === prog.id}
                    onClick={() => handleStartCourse(prog)}
                  >
                    <Rocket size={16} aria-hidden="true" />
                    <span>{addingId === prog.id ? 'Adding course…' : 'Add to My Courses'}</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </details>
  );
}
