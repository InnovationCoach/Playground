import { TERM, APPROACH, AI_PRINCIPLES, PHASES } from './content/pblModel.js';
import { competencyById } from './content/competencies.js';

/** The educational philosophy behind the PBL programme, for learners, coaches and families. */
export function Approach() {
  return (
    <div className="pb-approach">
      <section className="gh-card pb-approach-intro">
        <h2>Our PBL programme</h2>
        <p>{TERM.intro}</p>
      </section>

      <ul className="pb-principle-grid">
        {APPROACH.map((a, i) => (
          <li key={a.title} className="gh-card">
            <span className="pb-num">{i + 1}</span>
            <h3>{a.title}</h3>
            <p>{a.body}</p>
          </li>
        ))}
      </ul>

      <section className="gh-card">
        <h2 className="pb-h2">The term at a glance</h2>
        <div className="gh-table-wrap">
          <table className="pb-rubric pb-glance">
            <thead>
              <tr><th scope="col">Weeks</th><th scope="col">Phase</th><th scope="col">What learners do</th><th scope="col">Assessed against</th></tr>
            </thead>
            <tbody>
              {PHASES.map((p) => (
                <tr key={p.id}>
                  <td className="gh-nowrap">{p.weeks[0]}–{p.weeks[1]}</td>
                  <th scope="row">{p.title}<span className="pb-look">{p.strap}</span></th>
                  <td>{p.goal}</td>
                  <td>{p.id === 'explore'
                    ? 'NGSS three-dimensional rubrics (per activity)'
                    : p.competencies.map((id) => competencyById(id)?.title).filter(Boolean).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="gh-card">
        <h2 className="pb-h2">Learning with AI</h2>
        <ul className="pb-principle-list">
          {AI_PRINCIPLES.map((p) => <li key={p.title}><strong>{p.title}.</strong> {p.body}</li>)}
        </ul>
      </section>
    </div>
  );
}
