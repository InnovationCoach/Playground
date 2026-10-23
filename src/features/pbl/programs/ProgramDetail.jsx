import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CircleCheck, Circle, ChevronDown, Target, Users, Leaf, HeartHandshake,
  Cpu, Wrench, Package, Laptop, ShieldAlert, GraduationCap, Bot, Printer, TriangleAlert, Clock,
  Lightbulb, MessageSquareQuote, ListChecks, Compass, CalendarDays, Wrench as ToolIcon, NotebookPen, Rocket, Undo2
} from 'lucide-react';
import { programById, PLATFORM_NOTES, AGE_TRACKS, programCompetencies, sessionsInWeek, shortAges, isSourcedConfirmation } from './catalog.js';
import {
  programProgress, startProgram, toggleSession, chooseOption, setReflection, toggleStep, setConfidence, setTool, LIMITS
} from './progress.js';
import { toolkitFor } from './tools/index.js';
import { ToolFor, FounderPanel } from './tools/EntrepreneurshipTools.jsx';
import { confettiFrom, buzz } from '../../goals/celebrate.js';
import { useProgramProgress } from './useProgramProgress.js';
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
  { id: 'tools', label: 'Toolkit', icon: ToolIcon, kit: true },
  { id: 'kit', label: 'Kit & safety', icon: Package },
  { id: 'guide', label: 'Teaching guide', icon: GraduationCap, coach: true },
  { id: 'checks', label: 'Checks', icon: TriangleAlert, coach: true }
];

/** [5, 5] -> "wk 5", [3, 4] -> "wk 3–4". */
const weekLabel = ([a, b], word = 'wk') => (a === b ? `${word} ${a}` : `${word}${word === 'Week' ? 's' : ''} ${a}–${b}`);

/** "Phase 1A: Problem Discovery" -> "1A", so 1-week phases stay legible; other titles unchanged. */
const stripLabel = (t) => /^Phase\s+[\w.&\s]{1,8}?:/i.test(t) ? t.split(':')[0].replace(/^Phase\s+/i, '') : t;

const EVIDENCE_LABEL = { note: 'Note', media: 'Photo or video', code: 'Code', data: 'Data', feedback: 'Feedback', ai: 'AI log', reflection: 'Reflection' };

/**
 * One program, opened from the library. Learners get their own progress
 * (sessions done, choices, reflections - saved); coaches get the same plan
 * read-only plus the teaching guide and the content checks.
 */
export function ProgramDetail({ programId, section, uid, isCoach, classIds = [] }) {
  const program = programById(programId);
  const { classes, classCovers, reload } = useClassPrograms(classIds);
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
        ? <DetailView program={program} section={section} cover={cover} isCoach />
        : <LearnerDetail program={program} section={section} uid={uid} cover={cover} />}
    </ProgramMediaProvider>
  );
}

function LearnerDetail({ program, section, uid, cover }) {
  const { progress, apply, syncState } = useProgramProgress(uid, program);
  return <DetailView program={program} section={section} cover={cover} progress={progress} apply={apply} syncState={syncState} />;
}

function DetailView({ program: p, section, cover, isCoach = false, progress = null, apply = null, syncState }) {
  const kit = toolkitFor(p.id);
  const sections = SECTIONS.filter((s) => (!s.coach || isCoach) && (!s.kit || kit));
  const active = sections.some((s) => s.id === section) ? section : 'overview';
  const summary = progress ? programProgress(progress, p) : null;
  const [toast, say] = useToast();
  // Coaches can try the tools; their changes stay in memory and are never saved.
  const [demo, setDemo] = useState({});
  const tools = {
    data: (id) => (progress ? progress.tools?.[id] : demo[id]),
    save: (id, data) => (apply ? apply((x) => setTool(x, id, data)) : setDemo((d) => ({ ...d, [id]: data }))),
    readOnly: !apply
  };
  useBadgeCheer(kit, progress, say);

  return (
    <div className="pg-detail">
      <a className="pb-link pg-back" href={hrefFor.pbl('programs')}><ArrowLeft size={15} aria-hidden="true" />All programs</a>

      {/* A <section>, not <header>: index.html still styles every bare `header` for the legacy app. */}
      <section className="pg-hero pg-hero-poster" data-tone={p.identity.tone} aria-labelledby="pg-hero-title">
        <div className="pg-hero-main">
        <div className="pg-hero-top">
          <span className="pg-hero-icon"><ProgramIcon name={p.identity.icon} size={26} /></span>
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
        <ol className="pb-term-strip" aria-label={`Program plan, ${p.durationWeeks} weeks`}>
          {p.phases.map((ph) => (
            <li key={ph.id} style={{ flexGrow: ph.weeks[1] - ph.weeks[0] + 1 }}
                data-done={summary?.byPhase[ph.id]?.complete || undefined}>
              <span title={ph.title}>{stripLabel(ph.title)}</span>
              <small>{weekLabel(ph.weeks)}</small>
            </li>
          ))}
        </ol>
        {summary && <LearnerBar program={p} progress={progress} summary={summary} apply={apply} />}
        {kit && progress?.startedAt && <FounderPanel program={p} progress={progress} />}
        </div>
        <div className="pg-hero-aside"><ProgramPoster program={p} cover={cover} size="hero" /></div>
      </section>

      {syncState && <SyncNote state={syncState} />}

      <nav className="gh-tabs pb-tabs" aria-label="Program sections">
        {sections.map(({ id, label, icon: Icon }) => (
          <a key={id} className="gh-tab" aria-current={active === id ? 'page' : undefined} aria-selected={active === id}
             href={hrefFor.program(p.id, id === 'overview' ? null : id)}>
            <Icon size={16} aria-hidden="true" />{label}
            {id === 'checks' && p.issues.length > 0 && <span className="pg-count">{p.issues.length}</span>}
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
      {active === 'plan' && <TermPlan program={p} isCoach={isCoach} progress={progress} apply={apply} kit={kit} tools={tools} say={say} />}
      {active === 'tools' && kit && <Toolkit program={p} kit={kit} tools={tools} />}
      {active === 'kit' && <KitAndSafety program={p} />}
      {active === 'guide' && <TeachingGuide program={p} />}
      {active === 'checks' && <Checks program={p} kit={kit} />}
      <div className="pg-toast-host" aria-live="polite">{toast && <span className="pg-toast" key={toast.at}>{toast.text}</span>}</div>
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

function LearnerBar({ program: p, progress, summary, apply }) {
  if (!progress.startedAt) {
    return (
      <div className="pg-learner-bar">
        <span>Ready when you are: {p.sessions.length} sessions over {p.durationWeeks} weeks.</span>
        <a className="gh-btn gh-btn-primary" href={hrefFor.program(p.id, 'plan')} onClick={() => apply((x) => startProgram(x))}>
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
        <a className="gh-btn gh-btn-primary" href={`${hrefFor.program(p.id, 'plan')}`}>
          Next: session {summary.next.sessionNumber}<ArrowRight size={16} aria-hidden="true" />
        </a>
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

  return (
    <div className="pg-overview">
      <section className="gh-card">
        <h3 className="pb-h3"><Target size={17} aria-hidden="true" />The real problem</h3>
        <p className="pg-problem">{p.realProblem.summary}</p>
        <div className="pg-impact-pair">
          <div className="pg-impact" data-kind="people">
            <span className="pg-impact-label"><HeartHandshake size={15} aria-hidden="true" />For people</span>
            <p>{p.realProblem.peopleImpact}</p>
          </div>
          <div className="pg-impact" data-kind="environment">
            <span className="pg-impact-label"><Leaf size={15} aria-hidden="true" />For the environment</span>
            <p>{p.realProblem.environmentalImpact}</p>
          </div>
        </div>
      </section>

      <section className="gh-card">
        <h3 className="pb-h3"><ListChecks size={17} aria-hidden="true" />How success is measured</h3>
        <ul className="pg-metrics">
          {p.measurableImpactCriteria.map((m) => (
            <li key={m.id} className="pg-metric">
              <strong>{m.metric}</strong>
              <span className="pg-metric-target">{m.target}</span>
              <small>Checked by: {m.verificationMethod}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="gh-card">
        <h3 className="pb-h3"><Users size={17} aria-hidden="true" />Who it is for · {shortAges(p.targetAgeRange)}</h3>
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

function TermPlan({ program: p, isCoach, progress, apply, kit, tools, say }) {
  const summary = progress ? programProgress(progress, p) : null;
  const startPhase = summary?.next?.phaseId || p.phases[0].id;
  const [open, setOpen] = useState(startPhase);
  const phase = p.phases.find((ph) => ph.id === open) || p.phases[0];

  return (
    <div className="pb-journey">
      <ol className="pb-steps" aria-label="Program phases">
        {p.phases.map((ph, i) => {
          const pp = summary?.byPhase[ph.id];
          return (
            <li key={ph.id}>
              <button type="button" className="pb-step" aria-current={ph.id === open ? 'step' : undefined} onClick={() => setOpen(ph.id)}>
                <span className="pb-step-num" data-done={pp?.complete || undefined}>
                  {pp?.complete ? <CircleCheck size={18} aria-label="complete" /> : i + 1}
                </span>
                <span className="pb-step-text">
                  <strong>{ph.title}</strong>
                  <small>{pp ? `${pp.done}/${pp.total} sessions` : `${weekLabel(ph.weeks)} · ${ph.sessions.length} sessions`}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <section className="pb-phase" aria-labelledby="pg-phase-title">
        <div className="pb-phase-head">
          <span className="pb-kicker">{weekLabel(phase.weeks, 'Week')} · {phase.strap}</span>
          <h2 id="pg-phase-title">{phase.title}</h2>
          <p>{phase.goal}</p>
        </div>

        <div className="pb-phase-grid">
          <div className="pb-col">
            {phase.sessions.length === 0 && <p className="pb-empty">No sessions are written for this phase yet.</p>}
            {phase.sessions.map((s) => (
              <SessionCard key={s.sessionNumber} program={p} session={s} isCoach={isCoach} progress={progress} apply={apply}
                           kit={kit} tools={tools} say={say}
                           defaultOpen={summary ? summary.next?.sessionNumber === s.sessionNumber : false} />
            ))}
          </div>
          <div className="pb-col">
            <div className="gh-card">
              <h3 className="pb-h3"><ListChecks size={17} aria-hidden="true" />Phase tasks</h3>
              <ul className="pb-bullets">{phase.tasks.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div className="gh-card">
              <h3 className="pb-h3"><Lightbulb size={17} aria-hidden="true" />Evidence for this phase</h3>
              <ul className="pb-bullets">{phase.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
              <p className="pb-sub">Competencies {isCoach ? 'to look for' : 'your coach looks for'}:</p>
              <CompetencyChips ids={phase.competencies} />
              {phase.stretchCompetencies.length > 0 && <>
                <p className="pb-sub">Stretch (advanced):</p>
                <CompetencyChips ids={phase.stretchCompetencies} advanced />
              </>}
            </div>
            {phase.aiPromptStarters?.length > 0 && (
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
const TOOL_EMOJI = { 'friction-log': '🔍', 'crazy-8s': '⚡', 'unit-economics': '📊', 'pitch-timer': '🎤' };

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
function SessionCard({ program, session: s, isCoach, progress, apply, defaultOpen, kit, tools, say }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const entry = progress?.sessions[s.sessionNumber];
  const done = !!entry?.done;
  const steps = entry?.steps || [];
  const toolId = kit?.sessionTools[s.sessionNumber];
  const bodyId = `pg-session-${s.sessionNumber}`;
  const reflectRef = useRef(null);
  const xp = kit?.sessionXp;

  function complete(e) {
    const el = e.currentTarget;
    apply((x) => toggleSession(x, s.sessionNumber));
    if (!done) { confettiFrom(el, { big: true }); buzz([20, 40, 20]); say?.(`Mission ${s.sessionNumber} complete!${xp ? ` +${xp} XP` : ''}`); }
  }
  function addStarter(text) {
    const cur = entry?.reflection || '';
    const next = `${cur}${cur && !/\s$/.test(cur) ? ' ' : ''}${text}`.slice(0, LIMITS.reflection);
    apply((x) => setReflection(x, s.sessionNumber, next));
    requestAnimationFrame(() => { const t = reflectRef.current; if (t) { t.focus(); t.setSelectionRange(next.length, next.length); } });
  }

  return (
    <article className="gh-card pg-session pg-mission" data-done={done || undefined}>
      <div className="pg-session-head">
        {progress ? (
          <button type="button" className="pg-done" aria-pressed={done} onClick={() => apply((x) => toggleSession(x, s.sessionNumber))}
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

          <Stage icon="✅" title="Do it">
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

          <Stage icon="📸" title="Capture your evidence">
            <div className="pg-evidence">
              <span className={`pb-kind pb-kind-${s.evidenceToCollect.kind}`}>{EVIDENCE_LABEL[s.evidenceToCollect.kind] || 'Evidence'}</span>
              <p>{s.evidenceToCollect.prompt}</p>
              <CompetencyChips ids={s.evidenceToCollect.targetCompetencies} />
              {progress && (
                <a className="gh-btn gh-btn-sm pg-evidence-go" href={hrefFor.pbl('portfolio')}>
                  <NotebookPen size={15} aria-hidden="true" />Add it to my portfolio
                </a>
              )}
            </div>
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
                          value={entry?.reflection || ''} onChange={(e) => apply((x) => setReflection(x, s.sessionNumber, e.target.value))} />
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
                  <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm" onClick={() => apply((x) => toggleSession(x, s.sessionNumber))}>
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
  return (
    <div className="pg-kit">
      <div className="pg-kit-grid">
        {groups.map(({ key, label, icon: Icon }) => (
          <section key={key} className="gh-card">
            <h3 className="pb-h3"><Icon size={17} aria-hidden="true" />{label}</h3>
            <ul className="pb-bullets">{(p.materialsAndKit[key] || []).map((i) => <li key={i}>{i}</li>)}</ul>
          </section>
        ))}
      </div>
      <section className="gh-card pg-safety">
        <h3 className="pb-h3"><ShieldAlert size={17} aria-hidden="true" />Safety rules</h3>
        <ul className="pb-bullets">{p.teacherGuidance.safetyProtocol.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------ Teaching guide */

function TeachingGuide({ program: p }) {
  const weeks = [...new Set(p.sessions.map((s) => s.week))].sort((a, b) => a - b);
  const [week, setWeek] = useState(weeks[0]);
  const sessions = sessionsInWeek(p, week);
  const g = p.teacherGuidance;

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
            <li key={s.sessionNumber}>
              <span className="pg-session-meta">Session {s.sessionNumber} · {p.phases.find((ph) => ph.id === s.phaseId)?.title} · {s.durationMin} min</span>
              <strong>{s.title}</strong>
              <p className="pg-goal"><Target size={15} aria-hidden="true" />{s.learningGoal}</p>
              <ol className="pg-activities">{s.activities.map((a) => <li key={a}>{a}</li>)}</ol>
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
        {p.issues.length === 0 ? <p className="pb-empty">No problems found.</p> : <IssueList issues={p.issues} />}
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
        <IssueList issues={PLATFORM_NOTES} />
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
  const text = { saving: 'Saving…', saved: 'Saved', 'local-only': 'Saved on this device only - it will sync when you are back online' }[state];
  if (!text) return null;
  return <p className={`pb-sync${state === 'local-only' ? ' pb-sync-warn' : ''}`} role="status">{text}</p>;
}
