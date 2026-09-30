import { useMemo } from 'react';
import { TriangleAlert } from 'lucide-react';
import { COMPETENCY_DOMAINS, COMPETENCIES, COMPETENCY_DATA_ISSUES, competencyById } from './content/competencies.js';
import { PHASES } from './content/pblModel.js';
import { competencyCoverage } from './engine/pblProject.js';

/**
 * The school's competency framework, by domain. With a `project`, each
 * competency shows how much of the learner's evidence is tagged to it.
 * `showIssues` lists the spreadsheet problems for coaches to fix at source.
 */
export function CompetencyFramework({ project, showIssues = false }) {
  const coverage = useMemo(() => (project ? competencyCoverage(project) : null), [project]);
  const phasesFor = useMemo(() => {
    const m = {};
    for (const p of PHASES) for (const id of [...p.competencies, ...p.stretch]) (m[id] ||= []).push(p.title);
    return m;
  }, []);

  return (
    <div>
      <p className="pb-lead">
        The project phases are assessed against the school's competencies. <strong>Foundational</strong> competencies are
        what every learner works on; <strong>advanced</strong> ones are stretch goals.
        {project && ' Tag your evidence to a competency to build your record for it.'}
      </p>

      {showIssues && COMPETENCY_DATA_ISSUES.length > 0 && (
        <details className="gh-card pb-issues">
          <summary><TriangleAlert size={16} aria-hidden="true" />{COMPETENCY_DATA_ISSUES.length} problems in the source spreadsheet to fix</summary>
          <p className="pb-sub">Shown as supplied - nothing has been corrected in the platform. Duplicate numbers matter once competencies appear on transcripts.</p>
          <ul>
            {COMPETENCY_DATA_ISSUES.map((issue, i) => (
              <li key={i}>{issue.note} <span className="pb-muted">({issue.ids.map((id) => competencyById(id)?.title).join(', ')})</span></li>
            ))}
          </ul>
        </details>
      )}

      {COMPETENCY_DOMAINS.map((d) => {
        const list = COMPETENCIES.filter((c) => c.domain === d.id);
        const evidenced = coverage ? list.filter((c) => coverage[c.id]).length : 0;
        return (
          <section key={d.id} className="gh-card pb-domain" aria-labelledby={`dom-${d.id}`}>
            <div className="pb-domain-head">
              <h3 id={`dom-${d.id}`}>{d.title}</h3>
              {coverage && <span className="gh-count">{evidenced}/{list.length} with evidence</span>}
            </div>
            <p className="pb-sub">{d.description}</p>
            <ul className="pb-comp-list">
              {list.map((c) => (
                <li key={c.id} className="pb-comp">
                  <span className="pb-code">{c.code}</span>
                  <div className="pb-grow">
                    <strong>{c.title}</strong>
                    {c.level === 'advanced' && <span className="pb-adv">Advanced</span>}
                    <p>{c.statement}</p>
                    {phasesFor[c.id] && <p className="pb-muted">Looked for in: {phasesFor[c.id].join(', ')}</p>}
                  </div>
                  {coverage && (
                    <span className={`pb-ev-count${coverage[c.id] ? ' pb-ev-count-on' : ''}`} title="Evidence entries tagged to this competency">
                      {coverage[c.id] || 0}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
