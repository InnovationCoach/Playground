import { useState, useEffect } from 'react';
import { Printer, LayoutGrid, List, MessageSquareQuote } from 'lucide-react';
import { PHASES, EVIDENCE_KINDS, TERM } from './content/pblModel.js';
import { readiness } from './engine/pblProject.js';
import { EvidenceList } from './Evidence.jsx';
import { Showcase } from './Showcase.jsx';
import { db, collection, getDocs } from '../../firebase.js';

/** Everything the learner has collected this term: a filterable list to manage, or a showcase to present. */
export function Portfolio({ project, apply, displayName, uid }) {
  const [view, setView] = useState('list');
  const [phase, setPhase] = useState('');
  const [kind, setKind] = useState('');
  const [coachFeedback, setCoachFeedback] = useState([]);
  const r = readiness(project);

  useEffect(() => {
    if (!uid) return;
    let active = true;
    getDocs(collection(db, 'users', uid, 'feedback'))
      .then(snap => {
        if (!active) return;
        const items = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(f => f.feedbackText && (!f.workId || f.workId === `pbl-${TERM.id}`))
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setCoachFeedback(items);
      })
      .catch(err => console.warn('Could not load coach feedback:', err));
    return () => { active = false; };
  }, [uid]);

  return (
    <div className="pb-portfolio">
      <div className="pb-portfolio-head">
        <div>
          <h2>Evidence portfolio</h2>
          <p className="pb-sub">{project.evidence.length} entries · end-of-term readiness {r.done}/{r.total}</p>
          {project.problem.hmw && <p className="pb-hmw">{project.problem.hmw}</p>}
        </div>
        <div className="pb-portfolio-actions">
          <div className="pb-view-toggle" role="group" aria-label="Portfolio view">
            <button type="button" className="gh-btn gh-btn-sm" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={15} aria-hidden="true" />List</button>
            <button type="button" className="gh-btn gh-btn-sm" aria-pressed={view === 'showcase'} onClick={() => setView('showcase')}><LayoutGrid size={15} aria-hidden="true" />Showcase</button>
          </div>
          <button type="button" className="gh-btn gh-btn-sm" onClick={() => window.print()}><Printer size={16} aria-hidden="true" />Print</button>
        </div>
      </div>
      {coachFeedback.length > 0 && (
        <aside className="pb-coach-feedback" aria-label="Coach feedback" style={{
          margin: '0 0 1.5rem',
          padding: '1rem 1.25rem',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#38bdf8', fontWeight: 600 }}>
            <MessageSquareQuote size={18} />
            <span>Coach Feedback</span>
          </div>
          {coachFeedback.map(item => (
            <div key={item.id} style={{ marginTop: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#94a3b8' }}>
                <strong>{item.coachName || 'Coach'}</strong>
                <span>{item.timestamp ? new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.92rem', color: '#f1f5f9', whiteSpace: 'pre-wrap' }}>
                {item.feedbackText}
              </p>
            </div>
          ))}
        </aside>
      )}
      {view === 'showcase' ? <Showcase project={project} displayName={displayName} /> : (<>
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
      </>)}
    </div>
  );
}
