import { Rocket, Compass, NotebookPen, Award, BookOpen, FlaskConical } from 'lucide-react';
import { TERM, PHASES } from './content/pblModel.js';
import { usePblProject } from './engine/usePblProject.js';
import { ProjectJourney } from './ProjectJourney.jsx';
import { ExploreSteam } from './ExploreSteam.jsx';
import { Portfolio } from './Portfolio.jsx';
import { CompetencyFramework } from './CompetencyFramework.jsx';
import { Approach } from './Approach.jsx';
import { hrefFor } from '../../app/routes.js';
import '../admin/admin.css';
import './pbl.css';

/**
 * PBL Studio: the term project section.
 *
 * Students run their own Design Thinking project here, with the STEAM
 * activities as its Explore phase. Coaches get the same framework read-only
 * (approach, phases, NGSS rubrics, competencies) - reading a learner's
 * portfolio belongs on the coach dashboard, which is not built yet.
 */
const STUDENT_TABS = [
  { id: 'project', label: 'My project', icon: Rocket },
  { id: 'explore', label: 'Explore: STEAM', icon: FlaskConical },
  { id: 'portfolio', label: 'Evidence portfolio', icon: NotebookPen },
  { id: 'competencies', label: 'Competencies', icon: Award },
  { id: 'approach', label: 'Our approach', icon: BookOpen }
];
const COACH_TABS = [
  { id: 'approach', label: 'Our approach', icon: BookOpen },
  { id: 'project', label: 'Project phases', icon: Compass },
  { id: 'explore', label: 'Explore: NGSS rubrics', icon: FlaskConical },
  { id: 'competencies', label: 'Competencies', icon: Award }
];

export function PblStudio({ uid, role, tab, onOpenActivity }) {
  const isStudent = role === 'student';
  const tabs = isStudent ? STUDENT_TABS : COACH_TABS;
  const active = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;

  return (
    <div className="gh-page pb-page">
      <div className="pb-hero">
        <div className="pb-hero-text">
          <span className="pb-kicker">
            PBL Studio · {TERM.label}
            {TERM.draft && <span className="pb-draft" title="Placeholder until the school confirms this term's theme">theme to be confirmed</span>}
          </span>
          <h1>{TERM.theme}</h1>
          <p className="pb-dq">{TERM.drivingQuestion}</p>
        </div>
        <ol className="pb-term-strip" aria-label={`Term plan, ${TERM.weeks} weeks`}>
          {PHASES.map((p) => (
            <li key={p.id} style={{ flexGrow: p.weeks[1] - p.weeks[0] + 1 }}>
              <span>{p.title}</span>
              <small>wk {p.weeks[0]}–{p.weeks[1]}</small>
            </li>
          ))}
        </ol>
      </div>

      <div className="gh-tabs pb-tabs" role="tablist" aria-label="PBL Studio">
        {tabs.map(({ id, label, icon: Icon }) => (
          <a key={id} role="tab" className="gh-tab" aria-selected={active === id} href={hrefFor.pbl(id)}>
            <Icon size={16} aria-hidden="true" />{label}
          </a>
        ))}
      </div>

      {isStudent ? (
        <StudentTabs uid={uid} active={active} onOpenActivity={onOpenActivity} />
      ) : (
        <>
          {active === 'approach' && <Approach />}
          {active === 'project' && <ProjectJourney readOnly />}
          {active === 'explore' && <ExploreSteam />}
          {active === 'competencies' && <CompetencyFramework showIssues />}
        </>
      )}
    </div>
  );
}

/** Split out so the project document is only loaded for a learner. */
function StudentTabs({ uid, active, onOpenActivity }) {
  const { project, apply, syncState } = usePblProject(uid, TERM.id);
  return (
    <>
      <SyncNote state={syncState} />
      {active === 'project' && <ProjectJourney project={project} apply={apply} onOpenActivity={onOpenActivity} />}
      {active === 'explore' && <ExploreSteam onOpenActivity={onOpenActivity} />}
      {active === 'portfolio' && <Portfolio project={project} apply={apply} />}
      {active === 'competencies' && <CompetencyFramework project={project} />}
      {active === 'approach' && <Approach />}
    </>
  );
}

function SyncNote({ state }) {
  const text = { saving: 'Saving…', saved: 'Saved', 'local-only': 'Saved on this device only - it will sync when you are back online' }[state];
  if (!text) return null;
  return <p className={`pb-sync${state === 'local-only' ? ' pb-sync-warn' : ''}`} role="status">{text}</p>;
}
