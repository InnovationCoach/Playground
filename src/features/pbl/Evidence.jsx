import { useState } from 'react';
import { Trash2, ExternalLink } from 'lucide-react';
import { EVIDENCE_KINDS, phaseById } from './content/pblModel.js';
import { COMPETENCY_DOMAINS, COMPETENCIES, competencyById } from './content/competencies.js';
import { addEvidence, removeEvidence, LIMITS } from './engine/pblProject.js';
import { Alert } from '../admin/ui/bits.jsx';

const kindLabel = (id) => EVIDENCE_KINDS.find((k) => k.id === id)?.label || id;

/**
 * Add one piece of evidence to a phase. Competency tags default to the ones
 * the phase is assessed on; any other school competency can be added.
 */
export function EvidenceForm({ project, phase, initial = {}, apply, onDone }) {
  const [d, setD] = useState(() => ({
    kind: 'note', title: '', body: '', link: '', competencies: [],
    ...initial,
    ai: { asked: '', gave: '', kept: '', ...(initial.ai || {}) }
  }));
  const [error, setError] = useState(null);
  const set = (patch) => setD((x) => ({ ...x, ...patch }));
  const setAi = (patch) => setD((x) => ({ ...x, ai: { ...x.ai, ...patch } }));
  const toggleComp = (id) => set({ competencies: d.competencies.includes(id) ? d.competencies.filter((c) => c !== id) : [...d.competencies, id] });
  const suggested = [...phase.competencies, ...phase.stretch];
  const extra = d.competencies.filter((id) => !suggested.includes(id));

  function submit(e) {
    e.preventDefault();
    const entry = { ...d, phase: phase.id };
    const result = addEvidence(project, entry);
    if (result.error) { setError(result.error); return; }
    // If the project changed underneath (a cloud load landed), re-apply to the newer copy.
    apply((p) => (p === project ? result.project : addEvidence(p, entry).project || p));
    onDone();
  }

  const isCode = d.kind === 'code';
  return (
    <form className="pb-form" onSubmit={submit} aria-label={`New evidence for ${phase.title}`}>
      <h3 className="pb-h3">New evidence · {phase.title}</h3>
      {error && <Alert type="error">{error}</Alert>}
      <div className="pb-form-row">
        <div className="pb-field">
          <label className="gh-label" htmlFor="ev-kind">Type</label>
          <select id="ev-kind" className="gh-select" value={d.kind} onChange={(e) => set({ kind: e.target.value })}>
            {EVIDENCE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </div>
        <div className="pb-field pb-grow">
          <label className="gh-label" htmlFor="ev-title">Title</label>
          <input id="ev-title" className="gh-input" maxLength={LIMITS.title} value={d.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
      </div>

      {d.kind === 'ai' ? (
        <>
          <div className="pb-field">
            <label className="gh-label" htmlFor="ev-asked">What I asked the AI</label>
            <textarea id="ev-asked" className="gh-input pb-textarea" rows={2} maxLength={LIMITS.field} value={d.ai.asked} onChange={(e) => setAi({ asked: e.target.value })} />
          </div>
          <div className="pb-field">
            <label className="gh-label" htmlFor="ev-gave">What it gave me <span className="gh-opt">(summary or paste)</span></label>
            <textarea id="ev-gave" className="gh-input pb-textarea pb-mono" rows={4} maxLength={LIMITS.body} value={d.ai.gave} onChange={(e) => setAi({ gave: e.target.value })} />
          </div>
          <div className="pb-field">
            <label className="gh-label" htmlFor="ev-kept">What I kept, changed or rejected - and why</label>
            <textarea id="ev-kept" className="gh-input pb-textarea" rows={3} maxLength={LIMITS.field} value={d.ai.kept} onChange={(e) => setAi({ kept: e.target.value })} />
          </div>
        </>
      ) : (
        <div className="pb-field">
          <label className="gh-label" htmlFor="ev-body">{isCode ? 'Code (add your own comments)' : 'Details'}</label>
          <textarea id="ev-body" className={`gh-input pb-textarea${isCode ? ' pb-mono' : ''}`} rows={isCode ? 10 : 4}
                    maxLength={isCode ? LIMITS.code : LIMITS.body} value={d.body} spellCheck={!isCode}
                    onChange={(e) => set({ body: e.target.value })} />
        </div>
      )}

      <div className="pb-field">
        <label className="gh-label" htmlFor="ev-link">Link <span className="gh-opt">(optional - photo, video, slides, MakeCode project)</span></label>
        <input id="ev-link" className="gh-input" type="url" inputMode="url" placeholder="https://" maxLength={LIMITS.link}
               value={d.link} onChange={(e) => set({ link: e.target.value })} />
      </div>

      <fieldset className="pb-fieldset">
        <legend className="gh-label">Which competencies does this show?</legend>
        <div className="pb-pills">
          {[...suggested, ...extra].map((id) => {
            const c = competencyById(id);
            return c && (
              <button key={id} type="button" className="pb-pill" aria-pressed={d.competencies.includes(id)} title={c.statement} onClick={() => toggleComp(id)}>
                {c.title}
              </button>
            );
          })}
        </div>
        <label className="gh-label" htmlFor="ev-more" style={{ marginTop: '0.6rem', fontWeight: 500 }}>Add another competency</label>
        <select id="ev-more" className="gh-select" value="" onChange={(e) => e.target.value && toggleComp(e.target.value)}>
          <option value="">Choose…</option>
          {COMPETENCY_DOMAINS.map((dom) => (
            <optgroup key={dom.id} label={dom.title}>
              {COMPETENCIES.filter((c) => c.domain === dom.id && !suggested.includes(c.id) && !extra.includes(c.id)).map((c) => (
                <option key={c.id} value={c.id}>{c.code} {c.title}{c.level === 'advanced' ? ' (advanced)' : ''}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </fieldset>

      <div className="gh-btn-row pb-form-foot">
        <button type="button" className="gh-btn gh-btn-ghost" onClick={onDone}>Cancel</button>
        <button type="submit" className="gh-btn gh-btn-primary">Save evidence</button>
      </div>
    </form>
  );
}

/** Evidence entries, newest first. `phaseId` narrows to one phase. */
export function EvidenceList({ project, apply, phaseId, kind, empty }) {
  const items = project.evidence.filter((e) => (!phaseId || e.phase === phaseId) && (!kind || e.kind === kind));
  if (!items.length) return <p className="pb-empty">{empty}</p>;
  return (
    <ul className="pb-evidence">
      {items.map((e) => (
        <li key={e.id} className="pb-ev">
          <div className="pb-ev-head">
            <span className={`pb-kind pb-kind-${e.kind}`}>{kindLabel(e.kind)}</span>
            {!phaseId && <span className="pb-ev-phase">{phaseById(e.phase)?.title}</span>}
            <strong>{e.title}</strong>
            <time dateTime={new Date(e.createdAt).toISOString()}>{new Date(e.createdAt).toLocaleDateString()}</time>
            {apply && (
              <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm pb-del" aria-label={`Delete ${e.title}`}
                      onClick={() => { if (window.confirm('Delete this evidence?')) apply((p) => removeEvidence(p, e.id)); }}>
                <Trash2 size={15} aria-hidden="true" />
              </button>
            )}
          </div>
          {e.kind === 'ai' && e.ai ? (
            <dl className="pb-ai-log">
              <dt>Asked</dt><dd>{e.ai.asked}</dd>
              {e.ai.gave && <><dt>AI gave</dt><dd className="pb-pre">{e.ai.gave}</dd></>}
              <dt>Kept / changed</dt><dd>{e.ai.kept}</dd>
            </dl>
          ) : e.body && (
            e.kind === 'code' ? <pre className="pb-code-block"><code>{e.body}</code></pre> : <p className="pb-pre">{e.body}</p>
          )}
          {e.link && (
            <a className="pb-ev-link" href={e.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} aria-hidden="true" />{e.link.replace(/^https?:\/\//, '').slice(0, 60)}
            </a>
          )}
          {e.competencies.length > 0 && (
            <ul className="pb-chips pb-chips-sm">
              {e.competencies.map((id) => {
                const c = competencyById(id);
                return c && <li key={id} className="pb-chip" title={c.statement}><span className="pb-code">{c.code}</span>{c.title}</li>;
              })}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
