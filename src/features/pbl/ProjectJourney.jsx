import { useState } from 'react';
import { Circle, ArrowRight, Lightbulb, ListChecks, Presentation, Rocket } from 'lucide-react';
import { PHASES, IMPACT, phaseById } from './content/pblModel.js';
import { competencyById } from './content/competencies.js';
import { STEAM_NGSS } from './content/steamNgss.js';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { parseActivityLabel } from '../shell/activityIcons.jsx';
import { phaseProgress, toggleTask, updateProject, readiness, LIMITS } from './engine/pblProject.js';
import { EvidenceForm, EvidenceList } from './Evidence.jsx';
import { Copilot } from './Copilot.jsx';
import { CompetencyIcon } from './CompetencyIcon.jsx';
import { JourneyPath, NextStepCard, PhaseCelebration, TaskList, InterestPicker } from './PhaseGuide.jsx';
import { matchActivities } from '../dashboard/dashboardModel.js';

/**
 * The Design Thinking journey: one path through the phases and the open phase.
 * For a learner, each phase leads with one next step; the rest is a tap away.
 * `readOnly` is the coach view - the same content, no project behind it.
 */
export function ProjectJourney({ project, apply: applyProject, onOpenActivity, readOnly = false }) {
  const [open, setOpen] = useState(project?.currentPhase || PHASES[0].id);
  const phase = phaseById(open) || PHASES[0];
  const [draft, setDraft] = useState(null);
  const [celebrating, setCelebrating] = useState(null);
  const [prefill, setPrefill] = useState(null);

  // Only a learner's own action celebrates: a project arriving from the cloud never does.
  function apply(change) {
    const next = change(project);
    const finished = PHASES.find((p) => !phaseProgress(project, p.id).complete && phaseProgress(next, p.id).complete);
    if (finished) setCelebrating(finished.id);
    applyProject(change);
  }

  function selectPhase(id) {
    setOpen(id);
    setDraft(null);
    setCelebrating(null);
    if (!readOnly) applyProject((p) => (p.currentPhase === id ? p : updateProject(p, { currentPhase: id })));
  }

  return (
    <div className="pb-journey">
      <JourneyPath project={project} open={open} onSelect={selectPhase} readOnly={readOnly} />

      <section className="pb-phase" aria-labelledby="pb-phase-title">
        <div className="pb-phase-head">
          <div>
            <span className="pb-kicker">{readOnly && `Weeks ${phase.weeks[0]}–${phase.weeks[1]} · `}{phase.strap}</span>
            <h2 id="pb-phase-title">{phase.title}</h2>
            <p>{phase.goal}</p>
          </div>
        </div>

        {!readOnly && celebrating && <PhaseCelebration phaseId={celebrating} onClose={() => setCelebrating(null)} />}
        {!readOnly && <NextStepCard project={project} phase={phase} apply={apply} onNextPhase={selectPhase}
          onAskAi={(text) => setPrefill({ text, seq: Date.now() })} />}

        <div className="pb-phase-grid">
          <div className="pb-col">
            {!readOnly && phase.id === 'explore' && <InterestPicker project={project} apply={apply} />}

            {readOnly ? (
              <div className="gh-card">
                <h3 className="pb-h3"><ListChecks size={17} aria-hidden="true" />Tasks</h3>
                <ul className="pb-tasks">
                  {phase.tasks.map((task, i) => <li key={i}><span className="pb-task"><Circle size={16} aria-hidden="true" />{task}</span></li>)}
                </ul>
              </div>
            ) : (
              <TaskList project={project} phase={phase} apply={apply} onToggle={(i) => apply((p) => toggleTask(p, phase.id, i))} />
            )}

            {!readOnly && phase.id === 'explore' && <ExploreStart project={project} apply={apply} onOpenActivity={onOpenActivity} />}
            {!readOnly && phase.id === 'define' && <ProblemFields project={project} apply={apply} />}
            {!readOnly && phase.id === 'share' && <ShareStart project={project} apply={apply} />}

            <div className="gh-card">
              <h3 className="pb-h3"><Lightbulb size={17} aria-hidden="true" />Evidence to collect</h3>
              <ul className="pb-bullets">{phase.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
              <p className="pb-sub">{readOnly ? 'Competencies your coach looks for in this phase:' : 'What you can show in this phase:'}</p>
              <CompetencyChips ids={phase.competencies} showCodes={readOnly} />
              {phase.stretch.length > 0 && <>
                <p className="pb-sub">{readOnly ? 'Stretch (advanced):' : 'A stretch, if you want one:'}</p>
                <CompetencyChips ids={phase.stretch} advanced showCodes={readOnly} />
              </>}
            </div>

            {!readOnly && (
              <div className="gh-card">
                {draft ? (
                  <EvidenceForm key={draft._seq} project={project} phase={phase} initial={draft} apply={apply} onDone={() => setDraft(null)} />
                ) : (
                  <button type="button" className="gh-btn gh-btn-primary" onClick={() => setDraft({ kind: 'note', _seq: Date.now() })}>Add evidence to this phase</button>
                )}
                <EvidenceList project={project} apply={apply} phaseId={phase.id} empty="No evidence in this phase yet." />
              </div>
            )}
          </div>

          <div className="pb-col">
            {readOnly ? (
              <div className="gh-card">
                <h3 className="pb-h3"><Rocket size={17} aria-hidden="true" />How learners use AI in this phase</h3>
                <ul className="pb-bullets">{phase.ai.map((a) => <li key={a}>{a}</li>)}</ul>
              </div>
            ) : (
              <Copilot phase={phase} project={project} apply={apply} prefill={prefill}
                       onLog={(log) => setDraft({ kind: 'ai', title: `AI: ${log.asked.slice(0, 60)}`, ai: log, _seq: Date.now() })}
                       onSaveCode={({ code, asked }) => setDraft({
                         kind: 'code', title: `Code (AI co-pilot): ${asked.slice(0, 50)}`, body: code,
                         competencies: ['ctps-05', 'ct-05'], _seq: Date.now()
                       })} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/** Learners read the "I can" statement. Coaches also get the framework's title and code. */
export function CompetencyChips({ ids, advanced = false, showCodes = false }) {
  return (
    <ul className="pb-chips">
      {ids.map((id) => {
        const c = competencyById(id);
        if (!c) return null;
        return (
          <li key={id} className={`pb-chip pb-can${advanced ? ' pb-chip-adv' : ''}`} title={showCodes ? c.statement : undefined}>
            {showCodes ? <><span className="pb-code">{c.code}</span>{c.title}</> : <><CompetencyIcon domain={c.domain} size={15} />{c.statement}</>}
          </li>
        );
      })}
    </ul>
  );
}

const STEAM_IDS = Object.keys(STEAM_NGSS);

/** Explore activities, the ones matching the learner's interests first. Pure, unit-tested. */
export function rankedActivities(interests = []) {
  const matches = new Map(matchActivities(interests).map((match) => [match.id, match.because[0]]));
  const items = STEAM_IDS.map((id) => ACTIVITY_NAV.find((a) => a.id === id)).filter(Boolean)
    .map((nav) => ({ id: nav.id, title: parseActivityLabel(nav.label).title, because: matches.get(nav.id) || null }));
  return [...items.filter((item) => item.because), ...items.filter((item) => !item.because)];
}

function ExploreStart({ project, apply, onOpenActivity }) {
  return (
    <div className="gh-card">
      <label className="gh-label" htmlFor="pb-sparks">My sparks - things that surprised me or I want to know more about</label>
      <textarea id="pb-sparks" className="gh-input pb-textarea" rows={4} maxLength={LIMITS.sparks} value={project.sparks}
                onChange={(e) => apply((p) => updateProject(p, { sparks: e.target.value }))} />
      <p className="pb-sub" style={{ marginTop: '1rem' }}>Explore activities:</p>
      <ul className="pb-mini-list">
        {rankedActivities(project.interests).map(({ id, title, because }) => (
          <li key={id}>
            <button type="button" className="pb-link" onClick={() => onOpenActivity(id)}>
              {title}<ArrowRight size={14} aria-hidden="true" />
            </button>
            {because && <small className="pb-because">Because you like {because === 'My community' ? 'your community' : because.toLowerCase()}</small>}
          </li>
        ))}
      </ul>
    </div>
  );
}

const PROBLEM_FIELDS = [
  { key: 'hmw', label: 'How might we…', placeholder: 'How might we help … to … so that …?' },
  { key: 'who', label: 'Who is it for?', placeholder: 'The people who have this problem' },
  { key: 'why', label: 'Why does it matter to them?', placeholder: 'What you heard when you listened to them' },
  { key: 'criteria', label: 'Success criteria (measurable)', placeholder: 'e.g. keeps the plant soil moist for 5 days without watering' },
  { key: 'impactMeasure', label: 'How will you measure the difference it makes?', placeholder: 'e.g. litres of water saved per week, fewer plants dying, people who used it' },
  { key: 'constraints', label: 'Constraints', placeholder: 'Time, materials, budget, safety' }
];

function ProblemFields({ project, apply }) {
  return (
    <div className="gh-card">
      <h3 className="pb-h3">My problem statement</h3>
      <fieldset className="pb-fieldset">
        <legend className="gh-label">Who will this help?</legend>
        <div className="pb-impact">
          {IMPACT.map((i) => (
            <label key={i.id}>
              <input type="radio" name="pb-impact" value={i.id} checked={project.impact === i.id}
                     onChange={() => apply((p) => updateProject(p, { impact: i.id }))} />
              <strong>{i.label}</strong>
              <small>{i.hint}</small>
            </label>
          ))}
        </div>
      </fieldset>
      {PROBLEM_FIELDS.map((f) => (
        <div key={f.key} className="pb-field">
          <label className="gh-label" htmlFor={`pb-${f.key}`}>{f.label}</label>
          <textarea id={`pb-${f.key}`} className="gh-input pb-textarea" rows={f.key === 'hmw' ? 3 : 2} maxLength={LIMITS.field}
                    placeholder={f.placeholder} value={project.problem[f.key]}
                    onChange={(e) => apply((p) => updateProject(p, { problem: { [f.key]: e.target.value } }))} />
        </div>
      ))}
    </div>
  );
}

function ShareStart({ project, apply }) {
  const r = readiness(project);
  const choose = (finalFormat) => apply((p) => updateProject(p, { finalFormat }));
  return (
    <div className="gh-card">
      <h3 className="pb-h3"><Presentation size={17} aria-hidden="true" />How will you share it?</h3>
      <div className="gh-segmented" role="radiogroup" aria-label="Final format">
        {[['showcase', 'Showcase (live demo)'], ['presentation', 'Presentation (talk + slides)']].map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={project.finalFormat === id} onClick={() => choose(id)}>{label}</button>
        ))}
      </div>
      <p className="pb-sub" style={{ marginTop: '1rem' }}>Ready for the end of term? {r.done} of {r.total}</p>
      <div className="pb-meter" aria-hidden="true"><span style={{ width: `${(r.done / r.total) * 100}%` }} /></div>
      <ul className="pb-checks">
        {r.checks.map((c) => (
          <li key={c.id} data-ok={c.ok || undefined}>
            {c.ok ? <CircleCheck size={16} aria-label="done" /> : <Circle size={16} aria-label="not yet" />}{c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
