import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CircleCheck, Circle, ChevronDown, Target, Users, Leaf, HeartHandshake,
  Cpu, Wrench, Package, Laptop, ShieldAlert, GraduationCap, Bot, Printer, TriangleAlert, Clock,
  Lightbulb, MessageSquareQuote, ListChecks, Compass, CalendarDays, Wrench as ToolIcon, NotebookPen, Rocket, Undo2,
  Video, GitBranch, Box, Edit3, Eye, Presentation, HelpCircle, Sparkles
} from 'lucide-react';
import { programById, COACH_PLATFORM_NOTES, AGE_TRACKS, programCompetencies, sessionsInWeek, shortAges, isSourcedConfirmation } from './catalog.js';
import { getProgram, addToMyCourse, getVideoLibrary } from '../../../services/pblService.js';
import { StudentStageViewer } from './StudentStageViewer.jsx';
import { StageEditorModal } from '../../coach/programs/StageEditorModal.jsx';
import {
  programProgress, startProgram, toggleSession, chooseOption, setReflection, toggleStep, setConfidence, setTool, setSubmission, removeSubmission, isSessionDone, unlockBadge, LIMITS,
  needsRecheck, confirmRecheck
} from './progress.js';
import { addEvidence, hydrateProject } from '../engine/pblProject.js';
import { TERM } from '../content/pblModel.js';
import { db, doc, setDoc } from '../../../firebase.js';
import { subscribeToPblTransfers } from '../../coach/studio/pblTransferService.js';
import { toolkitFor } from './tools/index.js';
import { ToolFor, FounderPanel } from './tools/EntrepreneurshipTools.jsx';
import { confettiFrom, buzz } from '../../goals/celebrate.js';
import { useProgramProgress } from './useProgramProgress.js';
import { schoolRequest } from '../../../services/api/apiClient.js';
import { ProgramIcon } from './ProgramIcon.jsx';
import { CompetencyChips } from '../ProjectJourney.jsx';
import { COMPETENCY_DOMAINS, competencyById } from '../content/competencies.js';
import { hrefFor } from '../../../app/routes.js';
import { useClassPrograms } from './useClassPrograms.js';
import { coverFor } from './programMedia.js';
import { ProgramPoster } from './ProgramPoster.jsx';
import { ProgramMediaProvider, MediaGallery, MediaManager, SessionMedia } from './ProgramMediaPanel.jsx';

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: Compass },
  { id: 'plan', label: 'Term plan', icon: CalendarDays },
  { id: 'videos', label: 'Video library', icon: Video },
  { id: 'tools', label: 'Toolkit', icon: ToolIcon, kit: true },
  { id: 'kit', label: 'Kit & safety', icon: Package },
  { id: 'guide', label: 'Teaching guide', icon: GraduationCap, coach: true },
  { id: 'checks', label: 'Checks', icon: TriangleAlert, coach: true }
];

/** [5, 5] -> "wk 5", [3, 4] -> "wk 3–4". */
const weekLabel = (w, word = 'wk') => (!Array.isArray(w) || w.length < 2 || w[0] == null || w[1] == null ? '' : w[0] === w[1] ? `${word} ${w[0]}` : `${word}${word === 'Week' ? 's' : ''} ${w[0]}–${w[1]}`);

/** "Phase 1A: Problem Discovery" -> "1A", so 1-week phases stay legible; other titles unchanged. */
const stripLabel = (t) => (!t ? '' : /^Phase\s+[\w.&\s]{1,8}?:/i.test(t) ? t.split(':')[0].replace(/^Phase\s+/i, '') : t);

const EVIDENCE_LABEL = { note: 'Note', media: 'Photo or video', code: 'Code', data: 'Data', feedback: 'Feedback', ai: 'AI log', reflection: 'Reflection' };

/**
 * One program, opened from the library. Learners get their own progress
 * (sessions done, choices, reflections - saved); coaches get the same plan
 * read-only plus the teaching guide and the content checks.
 */
export function ProgramDetail({ programId, section, uid, isCoach, classIds = [] }) {
  const [reloadTick, setReloadTick] = useState(0);
  const [asyncProg, setAsyncProg] = useState(() => programById(programId));
  const [loading, setLoading] = useState(!asyncProg);

  useEffect(() => {
    return subscribeToPblTransfers((data) => {
      if (data.programId === programId) {
        setReloadTick((t) => t + 1);
      }
    });
  }, [programId]);

  useEffect(() => {
    let cancelled = false;
    getProgram(programId).then((res) => {
      if (!cancelled) {
        if (res.status === 'found') {
          setAsyncProg(res.program);
        } else {
          setAsyncProg(programById(programId));
        }
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setAsyncProg(programById(programId));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [programId, reloadTick]);

  const program = asyncProg || programById(programId);
  const { classes, classCovers, reload } = useClassPrograms(classIds);

  if (loading && !program) {
    return (
      <div className="gh-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading program…</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="gh-card">
        <p>That program could not be found.</p>
        <a className="pb-link" href={hrefFor.pbl('programs')}><ArrowLeft size={15} aria-hidden="true" />All programs</a>
      </div>
    );
  }
  // Media and covers come from the viewer's classes that run this program.
  const running = classes.filter((c) => c.programId === program.id && !c.missing && !c.error);
  const cover = coverFor(program, running.map((c) => c.programCovers));
  return (
    <ProgramMediaProvider value={{ classes: running, isCoach, uid, reload }}>
      {isCoach
        ? <DetailView program={program} section={section} cover={cover} isCoach classes={running} />
        : <LearnerDetail program={program} section={section} uid={uid} cover={cover} />}
    </ProgramMediaProvider>
  );
}

function LearnerDetail({ program, section, uid, cover }) {
  const { progress, apply, syncState } = useProgramProgress(uid, program);
  return <DetailView program={program} section={section} cover={cover} progress={progress} apply={apply} syncState={syncState} uid={uid} />;
}

const SECTION_ALIASES = {
  toolkit: 'tools',
  safety: 'kit',
  curriculum: 'plan',
  syllabus: 'plan'
};

function saveToPortfolio(uid, evidenceItem) {
  try {
    const termId = TERM.id;
    const key = `hearisland.pbl.v1:${uid || 'signed-out'}:${termId}`;
    const raw = localStorage.getItem(key);
    const proj = raw ? hydrateProject(JSON.parse(raw), termId) : hydrateProject(null, termId);
    const res = addEvidence(proj, evidenceItem);
    if (!res.error && res.project) {
      localStorage.setItem(key, JSON.stringify(res.project));
      if (uid) {
        setDoc(doc(db, 'users', `${uid}/activityProgress/pbl-${termId}`), res.project).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[PBL] Portfolio save failed:', err);
  }
}

function DetailView({ program: p, section, cover, isCoach = false, progress = null, apply = null, syncState, uid = null, classes = [] }) {
  const kit = toolkitFor(p.id);
  const sections = SECTIONS.filter((s) => (!s.coach || isCoach) && (!s.kit || kit));
  const resolvedSection = SECTION_ALIASES[section] || section;
  const isKnown = sections.some((s) => s.id === resolvedSection);
  const active = isKnown ? resolvedSection : 'overview';
  const unknownSection = Boolean(section && !isKnown);

  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedSessionNum, setSelectedSessionNum] = useState(null);

  const [isEditingStage, setIsEditingStage] = useState(false);
  const [editingStageIdx, setEditingStageIdx] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const summary = progress ? programProgress(progress, p) : null;
  const [toast, say] = useToast();
  // Coaches can try the tools; their changes stay in memory and are never saved.
  const [demo, setDemo] = useState({});
  const tools = {
    data: (id) => (progress ? progress.tools?.[id] : demo[id]),
    save: (id, data) => {
      if (apply) {
        apply((prevProg) => {
          let next = setTool(prevProg, id, data);
          if (kit) {
            const newlyEarned = kit.earnedBadges(next);
            const curBadges = new Set(Array.isArray(next.badges) ? next.badges : []);
            for (const bId of newlyEarned) {
              curBadges.add(bId);
            }
            next = { ...next, badges: [...curBadges] };
          }
          return next;
        });
      } else {
        setDemo((d) => ({ ...d, [id]: data }));
      }
    },
    readOnly: !apply
  };
  useBadgeCheer(kit, progress, say);

  const handleSelectSession = (session) => {
    setSelectedPhase(session.phaseId);
    setSelectedSessionNum(session.sessionNumber);
    if (active !== 'plan') {
      window.location.hash = hrefFor.program(p.id, 'plan');
    }
    setTimeout(() => {
      const el = document.getElementById(`pg-session-${session.sessionNumber}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };

  const handleSelectPhase = (phaseId) => {
    setSelectedPhase(phaseId);
    if (active !== 'plan') {
      window.location.hash = hrefFor.program(p.id, 'plan');
    }
  };

  // Preview Mode: isolated student simulation view
  if (isPreviewMode) {
    const previewStage = p.phases?.[editingStageIdx] || p.phases?.[0];
    return (
      <div className="pg-detail">
        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            className="pb-link pg-back"
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}
            onClick={() => setIsPreviewMode(false)}
          >
            <ArrowLeft size={15} aria-hidden="true" /> Exit Preview & Back to Program Detail
          </button>
        </div>
        <StudentStageViewer
          stage={previewStage}
          program={p}
          isPreview={true}
          onExitPreview={() => setIsPreviewMode(false)}
          onOpenEditor={() => {
            setIsPreviewMode(false);
            setIsEditingStage(true);
          }}
        />
        <StageEditorModal
          isOpen={isEditingStage}
          onClose={() => setIsEditingStage(false)}
          program={p}
          stageIndex={editingStageIdx}
          cohorts={classes}
          onSaved={() => say('Stage updated successfully!')}
          onOpenPreview={(idx) => {
            setEditingStageIdx(idx);
            setIsPreviewMode(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="pg-detail">
      <a className="pb-link pg-back" href={hrefFor.pbl('programs')}><ArrowLeft size={15} aria-hidden="true" />All programs</a>

      {/* A <section>, not <header>: index.html still styles every bare `header` for the legacy app. */}
      <section className="pg-hero pg-hero-poster" data-tone={p.identity?.tone || 'amber'} aria-labelledby="pg-hero-title">
        <div className="pg-hero-main">
        <div className="pg-hero-top">
          <span className="pg-hero-icon"><ProgramIcon name={p.identity?.icon || 'Compass'} size={26} /></span>
          <div className="pb-grow">
            <span className="pb-kicker">
              PBL program · {p.theme}
              <span className="pb-draft" title="Written for school review; not yet approved">draft for school review</span>
            </span>
            <h1 id="pg-hero-title">{p.title}</h1>
            <p className="pg-hero-sub">{p.subtitle}</p>
          </div>
        </div>
        <p className="pb-dq pg-hero-dq"><MessageSquareQuote size={18} aria-hidden="true" /><span>{p.drivingQuestion}</span></p>

        {/* Coach Workspace Actions */}
        {isCoach && (
          <div className="pg-coach-actions-bar">
            <span className="pg-coach-badge">
              <GraduationCap size={16} aria-hidden="true" /> Coach Workspace
            </span>
            <button
              type="button"
              className="gh-btn gh-btn-sm gh-btn-primary"
              onClick={() => {
                setEditingStageIdx(0);
                setIsEditingStage(true);
              }}
            >
              <Edit3 size={14} aria-hidden="true" /> Edit Program & Stages
            </button>
            <button
              type="button"
              className="gh-btn gh-btn-sm gh-btn-secondary"
              onClick={() => {
                setEditingStageIdx(0);
                setIsPreviewMode(true);
              }}
            >
              <Eye size={14} aria-hidden="true" /> Student Preview
            </button>
          </div>
        )}

        {/* Horizontal Stage Progression Timeline */}
        <div className="pg-stages-timeline" role="region" aria-label="Program stage progression">
          {(p.phases || []).map((ph, idx) => {
            const phId = ph.id || ph.phaseId || `phase-${idx + 1}`;
            const isSelected = selectedPhase ? selectedPhase === phId : idx === 0;
            const vCount = ph.videos?.length || 0;
            const sCount = ph.slides?.length || 0;
            const qCount = ph.quiz?.length || 0;
            const tCount = ph.checklist?.length || (ph.tasks?.length || 0);

            return (
              <div
                key={phId}
                className={`pg-stage-timeline-card ${isSelected ? 'is-active' : ''}`}
                onClick={() => handleSelectPhase(phId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectPhase(phId)}
              >
                <div className="pg-stage-card-top">
                  <span>Stage {idx + 1}</span>
                  <span className="pg-stage-card-week">{weekLabel(ph.weeks)}</span>
                </div>
                <h4 className="pg-stage-card-title">{ph.title}</h4>
                <p className="pg-stage-card-goal">{ph.learningGoal || ph.goal || ''}</p>
                <div className="pg-stage-card-badges">
                  {vCount > 0 && <span className="pg-stage-badge-item"><Video size={11} aria-hidden="true" /> {vCount} vids</span>}
                  {sCount > 0 && <span className="pg-stage-badge-item"><Presentation size={11} aria-hidden="true" /> {sCount} slides</span>}
                  {qCount > 0 && <span className="pg-stage-badge-item"><HelpCircle size={11} aria-hidden="true" /> {qCount} quiz</span>}
                  {tCount > 0 && <span className="pg-stage-badge-item"><ListChecks size={11} aria-hidden="true" /> {tCount} tasks</span>}
                  {isCoach && (
                    <button
                      type="button"
                      className="gh-btn gh-btn-ghost gh-btn-sm"
                      style={{ marginLeft: 'auto', padding: '0.1rem 0.4rem', fontSize: '0.72rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStageIdx(idx);
                        setIsEditingStage(true);
                      }}
                      title="Edit this stage"
                    >
                      <Edit3 size={11} aria-hidden="true" /> Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {summary && <LearnerBar program={p} progress={progress} summary={summary} apply={apply} uid={uid} onSelectSession={handleSelectSession} />}
        {kit && progress?.startedAt && <FounderPanel program={p} progress={progress} />}
        </div>
        <div className="pg-hero-aside"><ProgramPoster program={p} cover={cover} size="hero" /></div>
      </section>

      {syncState && <SyncNote state={syncState} />}
      {unknownSection && (
        <div className="pb-sync pb-sync-warn" role="alert" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TriangleAlert size={16} aria-hidden="true" />
          <span>Section &ldquo;<strong>{section}</strong>&rdquo; was not found in this program. Showing Overview.</span>
        </div>
      )}
      {apply && needsRecheck(progress) && <div className="pb-sync pb-sync-warn pb-recheck" role="status">
        <TriangleAlert size={16} aria-hidden="true" /> This course’s session numbers were corrected after you saved progress, so some ticks may now sit on the wrong session. Please re-check which sessions you’ve completed, then confirm.
        <button type="button" className="gh-btn gh-btn-secondary" onClick={() => apply((p) => confirmRecheck(p))}>I’ve re-checked my sessions</button>
      </div>}

      <nav className="gh-tabs pb-tabs" aria-label="Program sections">
        {sections.map(({ id, label, icon: Icon }) => (
          <a key={id} className="gh-tab" aria-current={active === id ? 'page' : undefined} aria-selected={active === id}
             href={hrefFor.program(p.id, id === 'overview' ? null : id)}>
            <Icon size={16} aria-hidden="true" />{label}
            {id === 'checks' && (p.issues?.length || 0) > 0 && <span className="pg-count">{p.issues.length}</span>}
          </a>
        ))}
      </nav>

      {active === 'overview' && (
        <>
          <MediaGallery program={p} />
          <MediaManager program={p} />
          <Overview program={p} />
        </>
      )}
      {active === 'videos' && <ProgramVideoLibrary program={p} />}
      {active === 'plan' && (
        <TermPlan
          program={p}
          isCoach={isCoach}
          progress={progress}
          apply={apply}
          kit={kit}
          tools={tools}
          say={say}
          selectedPhase={selectedPhase}
          selectedSessionNum={selectedSessionNum}
          uid={uid}
          onEditStage={(idx) => {
            setEditingStageIdx(idx);
            setIsEditingStage(true);
          }}
        />
      )}
      {active === 'tools' && kit && <Toolkit program={p} kit={kit} tools={tools} />}
      {active === 'kit' && <KitAndSafety program={p} />}
      {active === 'guide' && <TeachingGuide program={p} />}
      {active === 'checks' && <Checks program={p} kit={kit} />}

      <StageEditorModal
        isOpen={isEditingStage}
        onClose={() => setIsEditingStage(false)}
        program={p}
        stageIndex={editingStageIdx}
        cohorts={classes}
        onSaved={() => say('Stage updated successfully!')}
        onOpenPreview={(idx) => {
          setEditingStageIdx(idx);
          setIsPreviewMode(true);
        }}
      />

      <div className="pg-toast-host" aria-live="polite">{toast && <span className="pg-toast" key={toast.at}>{toast.text}</span>}</div>
    </div>
  );
}

function ProgramVideoLibrary({ program }) {
  const library = getVideoLibrary(program);
  const [activeVideo, setActiveVideo] = useState(library[0] || null);

  if (library.length === 0) {
    return (
      <div className="gh-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <Video size={36} style={{ opacity: 0.4, margin: '0 auto 0.8rem' }} />
        <h3 className="pb-h3" style={{ margin: '0 0 0.4rem' }}>No Stage Videos Added Yet</h3>
        <p className="pb-sub" style={{ maxWidth: '48ch', margin: '0 auto' }}>
          Coaches can add YouTube videos or playlists directly inside each stage editor. They will appear here organized by stage.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-video-library-section">
      {activeVideo && (
        <div className="gh-card pb-video-viewer-card" style={{ marginBottom: '1.5rem' }}>
          <div className="pb-video-frame-wrap">
            <iframe
              src={activeVideo.embedUrl}
              title={activeVideo.title}
              className="pb-video-iframe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="pb-video-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="pb-stage-week-badge">Stage {activeVideo.stageNumber}</span>
              <h3 className="pb-video-title">{activeVideo.title}</h3>
            </div>
            {activeVideo.description && <p className="pb-video-desc">{activeVideo.description}</p>}
          </div>
        </div>
      )}

      <div className="gh-card-head" style={{ marginBottom: '0.8rem' }}>
        <div>
          <h3 className="pb-h3" style={{ margin: 0 }}>Program Video Library ({library.length})</h3>
          <p className="pb-sub" style={{ margin: '0.2rem 0 0' }}>All instructional videos and playlists across stages.</p>
        </div>
      </div>

      <div className="pg-grid">
        {library.map((v) => {
          const isSelected = activeVideo?.id === v.id;
          return (
            <div
              key={v.id}
              className={`pg-card ${isSelected ? 'is-active' : ''}`}
              style={{
                cursor: 'pointer',
                padding: '1rem',
                border: isSelected ? '2px solid var(--gh-purple)' : '1px solid var(--gh-border)',
                background: isSelected ? 'var(--gh-surface-2)' : 'var(--gh-surface)'
              }}
              onClick={() => setActiveVideo(v)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span className="pg-stage-badge-item">Stage {v.stageNumber}</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--gh-text-3)' }}>{weekLabel(v.stageWeek)}</span>
              </div>
              <strong style={{ fontSize: '0.94rem', color: 'var(--gh-heading)', marginBottom: '0.3rem' }}>{v.title}</strong>
              {v.description && <p style={{ fontSize: '0.82rem', color: 'var(--gh-text-2)', margin: 0 }}>{v.description}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const say = (text) => {
    clearTimeout(timer.current);
    setToast({ text, at: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2800);
  };
  return [toast, say];
}

/** Celebrate a badge the moment a tool unlocks it (not the ones already earned on load). */
function useBadgeCheer(kit, progress, say) {
  const seen = useRef(null);
  const earned = kit && progress ? kit.earnedBadges(progress) : [];
  const key = earned.join(',');
  useEffect(() => {
    if (!kit || (!progress?.updatedAt && seen.current == null)) return;
    if (seen.current == null) { seen.current = new Set(earned); return; }
    const fresh = earned.filter((id) => !seen.current.has(id));
    seen.current = new Set(earned);
    if (!fresh.length) return;
    const b = kit.badges.find((x) => x.id === fresh[0]);
    confettiFrom(null, { big: true });
    buzz([20, 40, 20]);
    say(`${b.icon} Badge unlocked: ${b.name} (+${b.xpAward} XP)`);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}

function Toolkit({ program: p, kit, tools }) {
  return (
    <div className="pt-kit">
      <p className="pb-lead">
        Hands-on tools for this program. Each one also opens inside its session in the term plan.
        {tools.readOnly && ' You are viewing as a coach: try anything, nothing you change here is saved.'}
      </p>
      {kit.tools.map((t) => (
        <section key={t.id} className="gh-card pt-card" aria-labelledby={`pt-${t.id}`}>
          <div className="pt-card-head">
            <span className="pt-card-emoji" aria-hidden="true">{t.emoji}</span>
            <div className="pb-grow">
              <h3 id={`pt-${t.id}`} className="pb-h3">{t.title}</h3>
              <p className="pb-sub">{t.blurb} Used in session{t.sessions.length > 1 ? 's' : ''} {t.sessions.join(' and ')}.</p>
            </div>
          </div>
          <ToolFor id={t.id} data={tools.data(t.id)} save={(d) => tools.save(t.id, d)} />
        </section>
      ))}
    </div>
  );
}

function LearnerBar({ program: p, progress, summary, apply, uid = null, onSelectSession = null }) {
  if (!progress.startedAt) {
    return (
      <div className="pg-learner-bar">
        <span>Ready when you are: {(p.sessions || []).length} sessions over {p.durationWeeks || 12} weeks.</span>
        <a className="gh-btn gh-btn-primary" href={hrefFor.program(p.id, 'plan')} onClick={() => {
          apply((x) => startProgram(x));
          if (uid) addToMyCourse(p.id, uid).catch(() => {});
        }}>
          Start this program<ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    );
  }
  return (
    <div className="pg-learner-bar">
      <div className="pg-learner-meter">
        <span className="pb-meter" aria-hidden="true"><span style={{ width: `${summary.pct}%` }} /></span>
        <span>{summary.done} of {summary.total} sessions done</span>
      </div>
      {summary.next ? (
        <button
          type="button"
          className="gh-btn gh-btn-primary"
          onClick={() => {
            if (onSelectSession) {
              onSelectSession(summary.next);
            } else {
              window.location.hash = hrefFor.program(p.id, 'plan');
            }
          }}
        >
          Next: session {summary.next.sessionNumber}<ArrowRight size={16} aria-hidden="true" />
        </button>
      ) : (
        <span className="gh-badge gh-badge-active">Program complete</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Overview */

function Overview({ program: p }) {
  const compIds = programCompetencies(p);
  const byDomain = COMPETENCY_DOMAINS.map((d) => ({ d, n: compIds.filter((id) => competencyById(id)?.domain === d.id).length }))
    .filter((x) => x.n > 0);
  const realProblem = p.realProblem || {
    summary: p.drivingQuestion || '',
    peopleImpact: p.impact?.people || 'Community impact',
    environmentalImpact: p.impact?.environment || 'Sustainable design'
  };
  const measurableImpact = Array.isArray(p.measurableImpactCriteria) ? p.measurableImpactCriteria : [];

  return (
    <div className="pg-overview">
      <section className="gh-card">
        <h3 className="pb-h3"><Target size={17} aria-hidden="true" />The real problem</h3>
        <p className="pg-problem">{realProblem.summary}</p>
        <div className="pg-impact-pair">
          <div className="pg-impact" data-kind="people">
            <span className="pg-impact-label"><HeartHandshake size={15} aria-hidden="true" />For people</span>
            <p>{realProblem.peopleImpact}</p>
          </div>
          <div className="pg-impact" data-kind="environment">
            <span className="pg-impact-label"><Leaf size={15} aria-hidden="true" />For the environment</span>
            <p>{realProblem.environmentalImpact}</p>
          </div>
        </div>
      </section>

      {measurableImpact.length > 0 && (
        <section className="gh-card">
          <h3 className="pb-h3"><ListChecks size={17} aria-hidden="true" />How success is measured</h3>
          <ul className="pg-metrics">
            {measurableImpact.map((m) => (
              <li key={m.id || m.metric} className="pg-metric">
                <strong>{m.metric}</strong>
                <span className="pg-metric-target">{m.target}</span>
                <small>Checked by: {m.verificationMethod}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="gh-card">
        <h3 className="pb-h3"><Users size={17} aria-hidden="true" />Who it is for · {shortAges(p.targetAgeRange || p.ageBand)}</h3>
        <p className="pb-sub">The same program runs at three levels. Your coach places you on a track.</p>
        <ul className="pg-tracks">
          {AGE_TRACKS.map((t) => (
            <li key={t.tierId} className="pg-track" data-tier={t.tierId}>
              <span className="pg-track-age">{t.ageBand}</span>
              <strong>{t.name}</strong>
              <small>{t.gradeLevels}</small>
              <p>{t.scaffoldingFocus}</p>
              <p className="pb-muted"><Cpu size={13} aria-hidden="true" /> {t.programmingPlatform}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="gh-card">
        <h3 className="pb-h3"><GraduationCap size={17} aria-hidden="true" />Competencies you build</h3>
        <p className="pb-sub">{compIds.length} of the school's competencies are assessed across this program.</p>
        <ul className="pg-domains">
          {byDomain.map(({ d, n }) => (
            <li key={d.id}><span className="pg-domain-n">{n}</span>{d.title}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- Term plan */

function TermPlan({ program: p, isCoach, progress, apply, kit, tools, say, selectedPhase, selectedSessionNum, uid, onEditStage }) {
  const summary = progress ? programProgress(progress, p) : null;
  const phases = Array.isArray(p.phases) && p.phases.length > 0
    ? p.phases
    : [{ id: 'phase-1', phaseId: 'phase-1', title: 'Phase 1', weeks: [1, 1], sessions: [], tasks: [], evidence: [], competencies: [], stretchCompetencies: [] }];
  const startPhase = summary?.next?.phaseId || phases[0]?.id || phases[0]?.phaseId || 'phase-1';
  const [open, setOpen] = useState(selectedPhase || startPhase);

  useEffect(() => {
    if (selectedPhase) setOpen(selectedPhase);
  }, [selectedPhase]);

  const phase = phases.find((ph) => (ph.id || ph.phaseId) === open) || phases[0] || {
    id: 'phase-1',
    phaseId: 'phase-1',
    title: 'Phase 1',
    weeks: [1, 1],
    sessions: [],
    tasks: [],
    evidence: [],
    competencies: [],
    stretchCompetencies: [],
    aiPromptStarters: []
  };

  return (
    <div className="pb-journey">
      <ol className="pb-steps" aria-label="Program phases">
        {phases.map((ph, i) => {
          const phId = ph.id || ph.phaseId || `phase-${i + 1}`;
          const pp = summary?.byPhase?.[phId];
          const sessionCount = Array.isArray(ph.sessions) ? ph.sessions.length : 0;
          return (
            <li key={phId}>
              <button type="button" className="pb-step" aria-current={phId === open ? 'step' : undefined} onClick={() => setOpen(phId)}>
                <span className="pb-step-num" data-done={pp?.complete || undefined}>
                  {pp?.complete ? <CircleCheck size={18} aria-label="complete" /> : i + 1}
                </span>
                <span className="pb-step-text">
                  <strong>{ph.title}</strong>
                  <small>{pp ? `${pp.done}/${pp.total} sessions` : `${weekLabel(ph.weeks)} · ${sessionCount} sessions`}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <section className="pb-phase" aria-labelledby="pg-phase-title">
        <div className="pb-phase-head">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.6rem' }}>
            <div>
              <span className="pb-kicker">{weekLabel(phase.weeks, 'Week')}{phase.strap ? ` · ${phase.strap}` : ''}</span>
              <h2 id="pg-phase-title">{phase.title || 'Phase'}</h2>
            </div>
            {isCoach && onEditStage && (
              <button
                type="button"
                className="gh-btn gh-btn-sm gh-btn-secondary"
                onClick={() => {
                  const idx = phases.findIndex((ph) => (ph.id || ph.phaseId) === (phase.id || phase.phaseId));
                  onEditStage(idx >= 0 ? idx : 0);
                }}
              >
                <Edit3 size={14} aria-hidden="true" /> Edit Stage Details, Videos & AI Materials
              </button>
            )}
          </div>
          <p>{phase.goal || phase.learningGoal}</p>
        </div>

        <div className="pb-phase-grid">
          <div className="pb-col">
            {(phase.sessions || []).length === 0 && <p className="pb-empty">No sessions are written for this phase yet.</p>}
            {(phase.sessions || []).map((s) => (
              <SessionCard key={s.sessionNumber || s.title} program={p} session={s} isCoach={isCoach} progress={progress} apply={apply}
                           kit={kit} tools={tools} say={say} uid={uid}
                           defaultOpen={selectedSessionNum ? selectedSessionNum === s.sessionNumber : (summary ? summary.next?.sessionNumber === s.sessionNumber : false)} />
            ))}
          </div>
          <div className="pb-col">
            <div className="gh-card">
              <h3 className="pb-h3"><ListChecks size={17} aria-hidden="true" />Phase tasks</h3>
              <ul className="pb-bullets">{(phase.tasks || phase.deliverables || []).map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div className="gh-card">
              <h3 className="pb-h3"><Lightbulb size={17} aria-hidden="true" />Evidence for this phase</h3>
              <ul className="pb-bullets">{(phase.evidence || phase.deliverables || []).map((e) => <li key={e}>{e}</li>)}</ul>
              <p className="pb-sub">Competencies {isCoach ? 'to look for' : 'your coach looks for'}:</p>
              <CompetencyChips ids={phase.competencies || []} />
              {(phase.stretchCompetencies || []).length > 0 && <>
                <p className="pb-sub">Stretch (advanced):</p>
                <CompetencyChips ids={phase.stretchCompetencies} advanced />
              </>}
            </div>
            {(phase.aiPromptStarters || []).length > 0 && (
              <div className="gh-card">
                <h3 className="pb-h3"><Bot size={17} aria-hidden="true" />Ask the AI co-pilot</h3>
                <p className="pb-sub">Starting points. Log what you asked, and what you kept or changed.</p>
                <ul className="pb-starters">
                  {phase.aiPromptStarters.map((s) => <li key={s} className="pb-starter pg-starter">{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const STARTERS = ['I noticed that ', 'I was surprised that ', 'This was hard because ', 'Next time I will ', 'I am still wondering '];
const CONFIDENCE = [
  { n: 1, face: '😵', label: 'Lost' }, { n: 2, face: '🤔', label: 'Getting there' }, { n: 3, face: '🙂', label: 'Okay' },
  { n: 4, face: '😎', label: 'Confident' }, { n: 5, face: '🧑‍🏫', label: 'I could teach it' }
];
const TOOL_EMOJI = { 'friction-log': '🔍', 'unbiased-listener': '🎙️', 'crazy-8s': '⚡', 'unit-economics': '📊', 'pitch-timer': '🎤' };

function MultiModalSubmissions({ session: s, progress, apply, say }) {
  const submissions = progress?.sessions[s.sessionNumber]?.submissions || {};
  const [activeType, setActiveType] = useState('video');
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');

  const submit = (type, inputVal) => {
    const trimmed = (inputVal || '').trim();
    if (!trimmed) {
      setErr('Please enter a submission URL or ID.');
      return;
    }
    if (type === 'github') {
      const isGh = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/i.test(trimmed);
      if (!isGh) {
        setErr('Please enter a valid GitHub repository URL (e.g. https://github.com/org/repo).');
        return;
      }
    } else if (type === 'video') {
      const isUrl = /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed);
      if (!isUrl) {
        setErr('Please enter a valid video URL (e.g. YouTube, Loom, or Drive link).');
        return;
      }
    }
    setErr('');
    apply((p) => setSubmission(p, s.sessionNumber, type, trimmed));
    buzz([20, 40]);
    say?.(`${type === 'video' ? '📹 Video demo' : type === 'github' ? '💻 GitHub repo' : '🛠️ Prototype'} submitted!`);
    setVal('');
  };

  const remove = (type) => {
    apply((p) => removeSubmission(p, s.sessionNumber, type, Date.now(), s));
    say?.(`Removed ${type === 'video' ? 'video demo' : type === 'github' ? 'GitHub repo' : 'prototype tag'}.`);
  };

  return (
    <div className="pg-submissions-box" style={{ marginTop: '0.85rem', padding: '0.85rem', background: 'var(--gh-surface, #fff)', border: '1px solid var(--gh-border, #30363d)', borderRadius: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f0f6fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Multi-Modal Submissions
        </span>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button type="button" className={`gh-btn gh-btn-sm ${activeType === 'video' ? 'gh-btn-primary' : 'gh-btn-ghost'}`} onClick={() => { setActiveType('video'); setVal(''); setErr(''); }}>
            <Video size={13} style={{ marginRight: '0.25rem' }} /> Video Link
          </button>
          <button type="button" className={`gh-btn gh-btn-sm ${activeType === 'github' ? 'gh-btn-primary' : 'gh-btn-ghost'}`} onClick={() => { setActiveType('github'); setVal(''); setErr(''); }}>
            <GitBranch size={13} style={{ marginRight: '0.25rem' }} /> GitHub Repo
          </button>
          <button type="button" className={`gh-btn gh-btn-sm ${activeType === 'prototype' ? 'gh-btn-primary' : 'gh-btn-ghost'}`} onClick={() => { setActiveType('prototype'); setVal(''); setErr(''); }}>
            <Box size={13} style={{ marginRight: '0.25rem' }} /> Prototype
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="text"
          className="gh-input"
          style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
          placeholder={activeType === 'video' ? 'Paste YouTube, Loom, or Drive video URL...' : activeType === 'github' ? 'Paste GitHub repo URL (e.g. https://github.com/org/repo)...' : 'MakerSpace Bench #, Box Tag, or Photo Link...'}
          value={val}
          onChange={(e) => { setVal(e.target.value); setErr(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(activeType, val); } }}
        />
        <button type="button" className="gh-btn gh-btn-primary gh-btn-sm" onClick={() => submit(activeType, val)}>
          {activeType === 'video' ? 'Submit Video' : activeType === 'github' ? 'Link Repo' : 'Register Tag'}
        </button>
      </div>

      {err && (
        <p className="pt-warn" role="alert" style={{ margin: '0.35rem 0 0', fontSize: '0.8rem' }}>
          {err}
        </p>
      )}

      {Object.keys(submissions).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.65rem' }}>
          {submissions.video && (
            <span className="gh-badge gh-badge-active" style={{ fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Video size={12} />
              <span>Video Demo: {submissions.video.url.slice(0, 32)}{submissions.video.url.length > 32 ? '…' : ''} ✓</span>
              <button
                type="button"
                onClick={() => remove('video')}
                aria-label="Remove video demo submission"
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 2px', lineHeight: 1, fontWeight: 'bold' }}
              >
                ×
              </button>
            </span>
          )}
          {submissions.github && (
            <span className="gh-badge gh-badge-active" style={{ fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <GitBranch size={12} />
              <span>GitHub: {submissions.github.url.slice(0, 32)}{submissions.github.url.length > 32 ? '…' : ''} ✓</span>
              <button
                type="button"
                onClick={() => remove('github')}
                aria-label="Remove GitHub repo submission"
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 2px', lineHeight: 1, fontWeight: 'bold' }}
              >
                ×
              </button>
            </span>
          )}
          {submissions.prototype && (
            <span className="gh-badge gh-badge-active" style={{ fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Box size={12} />
              <span>Prototype Tag: {submissions.prototype.url.slice(0, 32)}{submissions.prototype.url.length > 32 ? '…' : ''} ✓</span>
              <button
                type="button"
                onClick={() => remove('prototype')}
                aria-label="Remove prototype tag submission"
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 2px', lineHeight: 1, fontWeight: 'bold' }}
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Stage({ icon, title, children }) {
  return (
    <section className="pg-stage">
      <span className="pg-stage-n" aria-hidden="true">{icon}</span>
      <div className="pg-stage-body"><h4 className="pg-h4">{title}</h4>{children}</div>
    </section>
  );
}

/**
 * One session as a mission: brief, steps to tick, a choice, the session's tool
 * (if the program has one), evidence and a reflection with sentence starters
 * and a confidence check. Coaches see the same mission read-only.
 */
function SessionCard({ program, session: s, isCoach, progress, apply, defaultOpen, kit, tools, say, uid }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const entry = progress?.sessions[s.sessionNumber];
  const done = isSessionDone(entry, s);
  const steps = entry?.steps || [];
  const toolId = kit?.sessionTools[s.sessionNumber];
  const bodyId = `pg-session-${s.sessionNumber}`;
  const reflectRef = useRef(null);
  const xp = kit?.sessionXp;

  const isBrainDump = /brain[\s-]*dump/i.test([
    s.title, ...(s.activities || []), s.evidenceToCollect?.prompt,
    s.learnerChoices?.question,
  ].filter(Boolean).join(' '));

  // Brain dumps start blank so the instructions cannot be mistaken for learner work.
  const [showPortfolioForm, setShowPortfolioForm] = useState(isBrainDump);
  const [portTitle, setPortTitle] = useState(() => `Mission ${s.sessionNumber}: ${s.title}`);
  const [portKind, setPortKind] = useState(() => s.evidenceToCollect?.kind || 'note');
  const [portBody, setPortBody] = useState(() => isBrainDump ? '' : s.evidenceToCollect?.prompt || '');
  const [portLink, setPortLink] = useState('');
  const [portComps, setPortComps] = useState(() => s.evidenceToCollect?.targetCompetencies || []);

  function complete(e) {
    const el = e.currentTarget;
    apply((x) => toggleSession(x, s));
    if (!done) {
      confettiFrom(el, { big: true });
      buzz([20, 40, 20]);
      say?.(`Mission ${s.sessionNumber} complete!${xp ? ` +${xp} XP` : ''}`);
      if (entry?.reflection && entry.reflection.trim().length >= 40) {
        schoolRequest('POST', '/api/quest/events', { type: 'reflection', text: entry.reflection.trim() }).catch(() => {});
      }
    }
  }
  function addStarter(text) {
    const cur = entry?.reflection || '';
    const next = `${cur}${cur ? (cur.endsWith('\n') ? '' : '\n') : ''}${text}`.slice(0, LIMITS.reflection);
    apply((x) => setReflection(x, s.sessionNumber, next));
    if (next.trim().length >= 40) {
      schoolRequest('POST', '/api/quest/events', { type: 'reflection', text: next.trim() }).catch(() => {});
    }
    requestAnimationFrame(() => { const t = reflectRef.current; if (t) { t.focus(); t.setSelectionRange(next.length, next.length); } });
  }

  const submitPortfolioEvidence = (e) => {
    e.preventDefault();
    const evItem = {
      title: portTitle,
      kind: portKind,
      body: portBody,
      link: portLink,
      competencies: portComps,
      phase: s.phaseId
    };
    saveToPortfolio(uid, evItem);
    apply((p) => setSubmission(p, s.sessionNumber, 'evidence', portLink || portTitle));
    buzz([20, 40]);
    say?.(`Evidence saved to your portfolio! 🎉`);
    setShowPortfolioForm(false);
  };

  return (
    <article className="gh-card pg-session pg-mission" id={`pg-session-${s.sessionNumber}`} data-done={done || undefined}>
      <div className="pg-session-head">
        {progress ? (
          <button type="button" className="pg-done" aria-pressed={done} onClick={() => apply((x) => toggleSession(x, s))}
                  aria-label={done ? `Mark session ${s.sessionNumber} not done` : `Mark session ${s.sessionNumber} done`}>
            {done ? <CircleCheck size={22} aria-hidden="true" /> : <Circle size={22} aria-hidden="true" />}
          </button>
        ) : (
          <span className="pg-session-num">{s.sessionNumber}</span>
        )}
        <button type="button" className="pg-session-toggle" aria-expanded={expanded} aria-controls={bodyId} onClick={() => setExpanded((v) => !v)}>
          <span className="pg-session-meta">Mission {s.sessionNumber} · Week {s.week} · <Clock size={12} aria-hidden="true" /> {s.durationMin} min</span>
          <strong>{s.title}</strong>
          <span className="pg-mission-tags">
            {toolId && <span className="pg-tag pg-tag-tool">{TOOL_EMOJI[toolId]} Hands-on tool</span>}
            {progress && s.activities.length > 0 && <span className="pg-tag">{steps.length}/{s.activities.length} steps</span>}
            {xp && <span className="pg-tag pg-tag-xp">+{xp} XP</span>}
          </span>
          <ChevronDown size={18} aria-hidden="true" className="pg-chev" />
        </button>
      </div>

      {expanded && (
        <div className="pg-session-body pg-stages" id={bodyId}>
          <Stage icon="🎯" title="Your mission">
            <p className="pg-goal">{s.learningGoal}</p>
            <SessionMedia program={program} sessionNumber={s.sessionNumber} />
          </Stage>

          <Stage icon="✅" title="Session plan">
            <p className="pg-sub">Read through the plan first. Your coach will introduce the session before you begin.
              {progress ? ' Tick each step after you finish it; the checklist does not start an activity.' : ' This is an overview of the session activities.'}
            </p>
            {progress ? (
              <ul className="pg-todo">
                {s.activities.map((a, i) => (
                  <li key={a}>
                    <button type="button" className="pg-todo-btn" aria-pressed={steps.includes(i)} onClick={() => {
                      apply((x) => toggleStep(x, s, i));
                      if (!steps.includes(i)) buzz(8);
                    }}>
                      {steps.includes(i) ? <CircleCheck size={18} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}
                      <span>{a}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <ol className="pg-activities">{s.activities.map((a) => <li key={a}>{a}</li>)}</ol>}
          </Stage>

          {s.learnerChoices?.options?.length > 0 && (
            <Stage icon="🔀" title={s.learnerChoices.question}>
              <div className="pg-choices" role={progress ? 'group' : undefined} aria-label={s.learnerChoices.question}>
                {s.learnerChoices.options.map((o) => {
                  const picked = entry?.choice === o.id;
                  return progress ? (
                    <button key={o.id} type="button" className="pg-choice" aria-pressed={picked}
                            onClick={() => apply((x) => chooseOption(x, s, o.id))}>
                      <strong>{o.label}</strong><small>{o.description}</small>
                    </button>
                  ) : (
                    <div key={o.id} className="pg-choice"><strong>{o.label}</strong><small>{o.description}</small></div>
                  );
                })}
              </div>
            </Stage>
          )}

          {toolId && (
            <Stage icon={TOOL_EMOJI[toolId]} title="Use the tool">
              <ToolFor id={toolId} data={tools.data(toolId)} save={(d) => tools.save(toolId, d)} />
            </Stage>
          )}

          <Stage icon="📸" title={isBrainDump ? 'Your brain dump' : 'Capture your evidence'}>
            {isBrainDump && <p className="pg-sub">Capture your first ideas here: rough bullet points are welcome. You can also add a link to a sketch or teacher-scribed notes. Save your brain dump to your portfolio when you are ready.</p>}
            <div className="pg-evidence">
              <span className={`pb-kind pb-kind-${s.evidenceToCollect?.kind || 'note'}`}>{EVIDENCE_LABEL[s.evidenceToCollect?.kind] || 'Evidence'}</span>
              <p>{s.evidenceToCollect?.prompt || ''}</p>
              <CompetencyChips ids={s.evidenceToCollect?.targetCompetencies || []} />
              {progress && (
                <div style={{ marginTop: '0.6rem' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="gh-btn gh-btn-sm pg-evidence-go"
                      onClick={() => setShowPortfolioForm((v) => !v)}
                    >
                      <NotebookPen size={15} aria-hidden="true" />
                      {showPortfolioForm ? 'Close evidence form' : isBrainDump ? 'Add my brain dump' : 'Add it to my portfolio'}
                    </button>
                    <a className="pb-link" href={hrefFor.pbl('portfolio')} style={{ fontSize: '0.8rem' }}>
                      View portfolio <ArrowRight size={13} aria-hidden="true" />
                    </a>
                  </div>

                  {showPortfolioForm && (
                    <form onSubmit={submitPortfolioEvidence} className="pb-form" style={{ marginTop: '0.75rem', padding: '0.85rem', background: 'var(--gh-surface, #fff)', borderRadius: '8px', border: '1px solid var(--gh-border)' }}>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', color: 'var(--gh-heading)' }}>
                        {isBrainDump ? 'Save your brain dump' : 'Add Evidence to Portfolio'} · Mission {s.sessionNumber}
                      </h4>
                      <div className="pb-form-row">
                        <div className="pb-field">
                          <label className="gh-label" htmlFor={`ev-kind-${s.sessionNumber}`}>Type</label>
                          <select id={`ev-kind-${s.sessionNumber}`} className="gh-select" value={portKind} onChange={(e) => setPortKind(e.target.value)}>
                            {['note', 'media', 'code', 'data', 'feedback', 'ai', 'reflection'].map((k) => (
                              <option key={k} value={k}>{EVIDENCE_LABEL[k] || k}</option>
                            ))}
                          </select>
                        </div>
                        <div className="pb-field pb-grow">
                          <label className="gh-label" htmlFor={`ev-title-${s.sessionNumber}`}>Title</label>
                          <input id={`ev-title-${s.sessionNumber}`} className="gh-input" value={portTitle} onChange={(e) => setPortTitle(e.target.value)} required />
                        </div>
                      </div>
                      <div className="pb-field" style={{ marginTop: '0.4rem' }}>
                        <label className="gh-label" htmlFor={`ev-body-${s.sessionNumber}`}>{isBrainDump ? 'Your ideas / brain dump' : 'Notes / Reflection'}</label>
                        <textarea id={`ev-body-${s.sessionNumber}`} className="gh-input pb-textarea" rows={isBrainDump ? 6 : 2} placeholder={isBrainDump ? 'What interests you? What would you like to explore? Write your ideas in any order…' : undefined} value={portBody} onChange={(e) => setPortBody(e.target.value)} />
                      </div>
                      <div className="pb-field" style={{ marginTop: '0.4rem' }}>
                        <label className="gh-label" htmlFor={`ev-link-${s.sessionNumber}`}>Link (Google Drive, photo, repo, demo URL)</label>
                        <input id={`ev-link-${s.sessionNumber}`} type="url" className="gh-input" placeholder="https://" value={portLink} onChange={(e) => setPortLink(e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button type="submit" className="gh-btn gh-btn-primary gh-btn-sm">{isBrainDump ? 'Save brain dump to portfolio' : 'Save to Portfolio'}</button>
                        <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm" onClick={() => setShowPortfolioForm(false)}>Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
            {progress && (
              <MultiModalSubmissions session={s} progress={progress} apply={apply} say={say} />
            )}
          </Stage>

          <Stage icon="💭" title="Reflect">
            <p className="pg-reflect-prompt">{s.reflectionPrompt}</p>
            {progress && (
              <>
                <div className="pg-starters" role="group" aria-label="Sentence starters">
                  {STARTERS.map((t) => <button key={t} type="button" className="pg-starter-chip" onClick={() => addStarter(t)}>{t.trim()}…</button>)}
                </div>
                <textarea ref={reflectRef} className="gh-input pb-textarea" rows={3} maxLength={LIMITS.reflection}
                          aria-label={`Your reflection for session ${s.sessionNumber}`} placeholder="Tap a starter above, or write your own…"
                          value={entry?.reflection || ''}
                          onChange={(e) => apply((x) => setReflection(x, s.sessionNumber, e.target.value))}
                          onBlur={() => {
                            if (entry?.reflection?.trim()?.length >= 40) {
                              schoolRequest('POST', '/api/quest/events', { type: 'reflection', text: entry.reflection.trim() }).catch(() => {});
                            }
                          }} />
                <div className="pg-confidence" role="group" aria-label="How confident do you feel about this mission?">
                  <span>How confident do you feel?</span>
                  <div className="pg-confidence-row">
                    {CONFIDENCE.map((c) => (
                      <button key={c.n} type="button" className="pg-conf" aria-pressed={entry?.confidence === c.n}
                              onClick={() => apply((x) => setConfidence(x, s.sessionNumber, c.n))}>
                        <span aria-hidden="true">{c.face}</span><small>{c.label}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Stage>

          {isCoach && s.teacherTips && (
            <p className="pg-tip"><GraduationCap size={15} aria-hidden="true" /><span><strong>Teacher tip:</strong> {s.teacherTips}</span></p>
          )}

          {progress && (
            <div className="pg-mission-foot">
              {done ? (
                <>
                  <span className="pg-mission-done"><CircleCheck size={18} aria-hidden="true" />Mission complete</span>
                  <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm" onClick={() => apply((x) => toggleSession(x, s))}>
                    <Undo2 size={14} aria-hidden="true" />Not finished yet
                  </button>
                </>
              ) : (
                <button type="button" className="gh-btn gh-btn-primary" onClick={complete}>
                  <Rocket size={16} aria-hidden="true" />Complete mission{xp ? ` · +${xp} XP` : ''}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* --------------------------------------------------------------- Kit & safety */

function KitAndSafety({ program: p }) {
  const groups = [
    { key: 'microcontrollers', label: 'Microcontrollers', icon: Cpu },
    { key: 'sensorsAndActuators', label: 'Sensors & actuators', icon: Wrench },
    { key: 'fabricationMaterials', label: 'Building materials', icon: Package },
    { key: 'softwareAndTools', label: 'Software & tools', icon: Laptop }
  ];
  const materials = p.materialsAndKit || {};
  const safety = p.teacherGuidance?.safetyProtocol || [];
  return (
    <div className="pg-kit">
      <div className="pg-kit-grid">
        {groups.map(({ key, label, icon: Icon }) => (
          <section key={key} className="gh-card">
            <h3 className="pb-h3"><Icon size={17} aria-hidden="true" />{label}</h3>
            <ul className="pb-bullets">{(materials[key] || []).map((i) => <li key={i}>{i}</li>)}</ul>
          </section>
        ))}
      </div>
      <section className="gh-card pg-safety">
        <h3 className="pb-h3"><ShieldAlert size={17} aria-hidden="true" />Safety rules</h3>
        <ul className="pb-bullets">{safety.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------ Teaching guide */

function TeachingGuide({ program: p }) {
  const allSessions = Array.isArray(p.sessions) ? p.sessions : [];
  const weeks = [...new Set(allSessions.map((s) => s.week).filter((w) => w != null))].sort((a, b) => a - b);
  const [week, setWeek] = useState(weeks[0] || 1);
  const sessions = sessionsInWeek(p, week);
  const g = p.teacherGuidance || {};

  return (
    <div className="pg-guide">
      <section className="gh-card pg-week">
        <div className="gh-card-head">
          <div>
            <h3 className="pb-h3"><CalendarDays size={17} aria-hidden="true" />Week planner</h3>
            <p className="pb-sub">Pick a week to see its sessions, timings and tips. Print it as a lesson plan.</p>
          </div>
          <button type="button" className="gh-btn gh-btn-sm" onClick={() => window.print()}>
            <Printer size={15} aria-hidden="true" />Print week {week}
          </button>
        </div>
        <div className="pb-pills pg-weeks" role="group" aria-label="Week">
          {weeks.map((w) => (
            <button key={w} type="button" className="pb-pill" aria-pressed={w === week} onClick={() => setWeek(w)}>Wk {w}</button>
          ))}
        </div>
        <p className="pb-print-only">{p.title} · Week {week}</p>
        <ol className="pg-week-list">
          {sessions.map((s) => (
            <li key={s.sessionNumber || s.title}>
              <span className="pg-session-meta">Session {s.sessionNumber} · {(p.phases || []).find((ph) => (ph.id || ph.phaseId) === s.phaseId)?.title || ''} · {s.durationMin || 90} min</span>
              <strong>{s.title}</strong>
              <p className="pg-goal"><Target size={15} aria-hidden="true" />{s.learningGoal}</p>
              <ol className="pg-activities">{(s.activities || []).map((a) => <li key={a}>{a}</li>)}</ol>
              <p className="pg-tip"><GraduationCap size={15} aria-hidden="true" /><span>{s.teacherTips}</span></p>
            </li>
          ))}
        </ol>
      </section>

      <div className="pg-kit-grid">
        <GuideList title="Scaffolding" icon={Lightbulb} items={g.pedagogicalScaffolding} />
        <GuideList title="AI rules for learners" icon={Bot} items={g.aiEthicsRules} />
        <GuideList title="Differentiation" icon={Users} items={g.differentiationNotes} />
        <GuideList title="Safety" icon={ShieldAlert} items={g.safetyProtocol} />
      </div>
    </div>
  );
}

function GuideList({ title, icon: Icon, items }) {
  if (!items?.length) return null;
  return (
    <section className="gh-card">
      <h3 className="pb-h3"><Icon size={17} aria-hidden="true" />{title}</h3>
      <ul className="pb-bullets">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </section>
  );
}

/* -------------------------------------------------------------------- Checks */

function Checks({ program: p, kit }) {
  return (
    <div className="pg-checks">
      <p className="pb-lead">
        Read these before running the program with a class. They come from checking the program's content
        against the school calendar, the competency framework and the platform's safeguarding rules. Nothing here
        has been changed automatically; raise them with Don.
      </p>
      <section className="gh-card">
        <h3 className="pb-h3"><TriangleAlert size={17} aria-hidden="true" />This program</h3>
        {(p.issues || []).length === 0 ? <p className="pb-empty">No problems found.</p> : <IssueList issues={p.issues || []} />}
      </section>
      {kit && (
        <section className="gh-card">
          <h3 className="pb-h3"><Lightbulb size={17} aria-hidden="true" />Game layer: platform choices to confirm</h3>
          <ul className="pg-issues">
            <li data-level="warn"><TriangleAlert size={16} aria-hidden="true" /><span>
              Each finished session gives {kit.sessionXp} XP. The program's badges add up to {kit.badges.reduce((n, b) => n + b.xpAward, 0).toLocaleString()} XP
              and its top level needs more, so sessions carry the rest. This number is the platform's, not Don's: confirm it with him.
            </span></li>
            <li data-level="warn"><TriangleAlert size={16} aria-hidden="true" /><span>
              Only badges a tool can check unlock on their own. The others (interviews, the silent usability lab, the live pitch) need
              a coach to award them, and there is no coach award button yet.
            </span></li>
          </ul>
        </section>
      )}
      <section className="gh-card">
        <h3 className="pb-h3"><ShieldAlert size={17} aria-hidden="true" />All programs</h3>
        <IssueList issues={COACH_PLATFORM_NOTES} />
      </section>
      {p.assumptions?.length > 0 && (
        <section className="gh-card">
          <h3 className="pb-h3"><Lightbulb size={17} aria-hidden="true" />Assumptions to confirm</h3>
          <ul className="pg-assumptions">
            {p.assumptions.map((a) => (
              <li key={a.id}>
                <strong>{a.domain}</strong>
                <p>{a.assumption}</p>
                <small>{confirmationLine(a)}</small>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** What a coach should know about one assumption's confirmation. */
function confirmationLine(a) {
  const c = a.confirmation;
  if (isSourcedConfirmation(c)) return `Confirmed by ${c.confirmedBy} on ${c.confirmedOn} (${c.source}).`;
  if (c?.status === 'confirmed' || /confirmed by don/i.test(a.ownerVerificationNeeded || '')) return 'Marked as confirmed, but no source is recorded.';
  return `Needs confirmation: ${a.ownerVerificationNeeded || 'ask Don.'}`;
}

function IssueList({ issues }) {
  return (
    <ul className="pg-issues">
      {issues.map((i) => (
        <li key={i.text} data-level={i.level}>
          {i.level === 'block' ? <ShieldAlert size={16} aria-hidden="true" /> : <TriangleAlert size={16} aria-hidden="true" />}
          <span>{i.text}</span>
        </li>
      ))}
    </ul>
  );
}

function SyncNote({ state }) {
  if (!state || state === 'idle') return null;
  const isWarn = state === 'local-only';
  const text = {
    saving: 'Saving…',
    saved: 'Saved ✓',
    'local-only': 'Saved on this device only — syncs when back online'
  }[state];
  if (!text) return null;
  return (
    <div className={`pb-sync-pill ${isWarn ? 'is-warn' : ''}`} role="status" aria-live="polite">
      <span>{text}</span>
    </div>
  );
}

