import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, CircleCheck, Circle, ChevronDown, Target, Users, Leaf, HeartHandshake,
  Cpu, Wrench, Package, Laptop, ShieldAlert, GraduationCap, Bot, Printer, TriangleAlert, Clock,
  Lightbulb, MessageSquareQuote, ListChecks, Compass, CalendarDays
} from 'lucide-react';
import { programById, PLATFORM_NOTES, AGE_TRACKS, programCompetencies, sessionsInWeek, shortAges, isSourcedConfirmation } from './catalog.js';
import { programProgress, startProgram, toggleSession, chooseOption, setReflection, LIMITS } from './progress.js';
import { useProgramProgress } from './useProgramProgress.js';
import { ProgramIcon } from './ProgramIcon.jsx';
import { CompetencyChips } from '../ProjectJourney.jsx';
import { COMPETENCY_DOMAINS, competencyById } from '../content/competencies.js';
import { hrefFor } from '../../../app/routes.js';

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: Compass },
  { id: 'plan', label: 'Term plan', icon: CalendarDays },
  { id: 'kit', label: 'Kit & safety', icon: Package },
  { id: 'guide', label: 'Teaching guide', icon: GraduationCap, coach: true },
  { id: 'checks', label: 'Checks', icon: TriangleAlert, coach: true }
];

/** [5, 5] -> "wk 5", [3, 4] -> "wk 3–4". */
const weekLabel = ([a, b], word = 'wk') => (a === b ? `${word} ${a}` : `${word}${word === 'Week' ? 's' : ''} ${a}–${b}`);

const EVIDENCE_LABEL = { note: 'Note', media: 'Photo or video', code: 'Code', data: 'Data', feedback: 'Feedback', ai: 'AI log', reflection: 'Reflection' };

/**
 * One program, opened from the library. Learners get their own progress
 * (sessions done, choices, reflections - saved); coaches get the same plan
 * read-only plus the teaching guide and the content checks.
 */
export function ProgramDetail({ programId, section, uid, isCoach }) {
  const program = programById(programId);
  if (!program) {
    return (
      <div className="gh-card">
        <p>That program could not be found.</p>
        <a className="pb-link" href={hrefFor.pbl('programs')}><ArrowLeft size={15} aria-hidden="true" />All programs</a>
      </div>
    );
  }
  return isCoach
    ? <DetailView program={program} section={section} isCoach />
    : <LearnerDetail program={program} section={section} uid={uid} />;
}

function LearnerDetail({ program, section, uid }) {
  const { progress, apply, syncState } = useProgramProgress(uid, program);
  return <DetailView program={program} section={section} progress={progress} apply={apply} syncState={syncState} />;
}

function DetailView({ program: p, section, isCoach = false, progress = null, apply = null, syncState }) {
  const sections = SECTIONS.filter((s) => !s.coach || isCoach);
  const active = sections.some((s) => s.id === section) ? section : 'overview';
  const summary = progress ? programProgress(progress, p) : null;

  return (
    <div className="pg-detail">
      <a className="pb-link pg-back" href={hrefFor.pbl('programs')}><ArrowLeft size={15} aria-hidden="true" />All programs</a>

      <header className="pg-hero" data-tone={p.identity.tone}>
        <div className="pg-hero-top">
          <span className="pg-hero-icon"><ProgramIcon name={p.identity.icon} size={26} /></span>
          <div className="pb-grow">
            <span className="pb-kicker">
              PBL program · {p.theme}
              <span className="pb-draft" title="Written for school review; not yet approved">draft for school review</span>
            </span>
            <h1>{p.title}</h1>
            <p className="pg-hero-sub">{p.subtitle}</p>
          </div>
        </div>
        <p className="pb-dq pg-hero-dq"><MessageSquareQuote size={18} aria-hidden="true" /><span>{p.drivingQuestion}</span></p>
        <ol className="pb-term-strip" aria-label={`Program plan, ${p.durationWeeks} weeks`}>
          {p.phases.map((ph) => (
            <li key={ph.id} style={{ flexGrow: ph.weeks[1] - ph.weeks[0] + 1 }}
                data-done={summary?.byPhase[ph.id]?.complete || undefined}>
              <span title={ph.title}>{ph.title}</span>
              <small>{weekLabel(ph.weeks)}</small>
            </li>
          ))}
        </ol>
        {summary && <LearnerBar program={p} progress={progress} summary={summary} apply={apply} />}
      </header>

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

      {active === 'overview' && <Overview program={p} />}
      {active === 'plan' && <TermPlan program={p} isCoach={isCoach} progress={progress} apply={apply} />}
      {active === 'kit' && <KitAndSafety program={p} />}
      {active === 'guide' && <TeachingGuide program={p} />}
      {active === 'checks' && <Checks program={p} />}
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

function TermPlan({ program: p, isCoach, progress, apply }) {
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
              <SessionCard key={s.sessionNumber} session={s} isCoach={isCoach} progress={progress} apply={apply}
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

function SessionCard({ session: s, isCoach, progress, apply, defaultOpen }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const entry = progress?.sessions[s.sessionNumber];
  const done = !!entry?.done;
  const bodyId = `pg-session-${s.sessionNumber}`;

  return (
    <article className="gh-card pg-session" data-done={done || undefined}>
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
          <span className="pg-session-meta">Session {s.sessionNumber} · Week {s.week} · <Clock size={12} aria-hidden="true" /> {s.durationMin} min</span>
          <strong>{s.title}</strong>
          <ChevronDown size={18} aria-hidden="true" className="pg-chev" />
        </button>
      </div>

      {expanded && (
        <div className="pg-session-body" id={bodyId}>
          <p className="pg-goal"><Target size={15} aria-hidden="true" />{s.learningGoal}</p>

          <h4 className="pg-h4">What happens</h4>
          <ol className="pg-activities">{s.activities.map((a) => <li key={a}>{a}</li>)}</ol>

          {s.learnerChoices?.options?.length > 0 && (
            <>
              <h4 className="pg-h4">{s.learnerChoices.question}</h4>
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
            </>
          )}

          <div className="pg-evidence">
            <span className={`pb-kind pb-kind-${s.evidenceToCollect.kind}`}>{EVIDENCE_LABEL[s.evidenceToCollect.kind] || 'Evidence'}</span>
            <p>{s.evidenceToCollect.prompt}</p>
            <CompetencyChips ids={s.evidenceToCollect.targetCompetencies} />
          </div>

          <h4 className="pg-h4">Reflect</h4>
          <p className="pg-reflect-prompt">{s.reflectionPrompt}</p>
          {progress && (
            <textarea className="gh-input pb-textarea" rows={3} maxLength={LIMITS.reflection}
                      aria-label={`Your reflection for session ${s.sessionNumber}`} placeholder="Write a few sentences…"
                      value={entry?.reflection || ''} onChange={(e) => apply((x) => setReflection(x, s.sessionNumber, e.target.value))} />
          )}

          {isCoach && s.teacherTips && (
            <p className="pg-tip"><GraduationCap size={15} aria-hidden="true" /><span><strong>Teacher tip:</strong> {s.teacherTips}</span></p>
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

function Checks({ program: p }) {
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
