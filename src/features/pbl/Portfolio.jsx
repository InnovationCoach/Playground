import { useState } from 'react';
import { Printer } from 'lucide-react';
import { PHASES, EVIDENCE_KINDS, TERM } from './content/pblModel.js';
import { readiness } from './engine/pblProject.js';
import { EvidenceList } from './Evidence.jsx';

/** Everything the learner has collected this term, filterable and printable. */
export function Portfolio({ project, apply }) {
  const [phase, setPhase] = useState('');
  const [kind, setKind] = useState('');
  const r = readiness(project);

  return (
    <div className="pb-portfolio">
      <div className="pb-portfolio-head">
        <div>
          <h2>Evidence portfolio</h2>
          <p className="pb-sub">{project.evidence.length} entries · end-of-term readiness {r.done}/{r.total}</p>
          {project.problem.hmw && <p className="pb-hmw">{project.problem.hmw}</p>}
        </div>
        <button type="button" className="gh-btn" onClick={() => window.print()}><Printer size={16} aria-hidden="true" />Print</button>
      </div>
      <div className="pb-filters">
        <label className="gh-label" htmlFor="pf-phase">Phase
          <select id="pf-phase" className="gh-select" value={phase} onChange={(e) => setPhase(e.target.value)}>
            <option value="">All phases</option>
            {PHASES.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </label>
        <label className="gh-label" htmlFor="pf-kind">Type
          <select id="pf-kind" className="gh-select" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All types</option>
            {EVIDENCE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </label>
      </div>
      <p className="pb-print-only">{TERM.label} · {TERM.theme}</p>
      <EvidenceList project={project} apply={apply} phaseId={phase || undefined} kind={kind || undefined}
                    empty={project.evidence.length ? 'Nothing matches these filters.' : 'No evidence yet. Add it from each phase in My project.'} />
    </div>
  );
}
