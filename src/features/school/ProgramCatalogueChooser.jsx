import { useState } from 'react';
import { Leaf, Zap, Bot, CheckCircle2, KeyRound, ChevronRight } from 'lucide-react';
import { PROGRAM_CATALOGUE } from '../pbl/content/programCatalogue.js';
import { useSchoolResource, schoolPath, mutateSchool, serviceMessage } from './useSchoolWorkspace.js';

/**
 * Learner-facing catalogue of every PBL program, shown on the student home.
 *
 * The catalogue is the curriculum definition; enrollment stays school-controlled.
 * A learner sees all three programs, which ones they are enrolled in (from the
 * offerings the API returns for them), and can join another with a class code
 * through the existing rate-limited, server-validated join endpoint. Nothing
 * here invents progress or offerings.
 */
const VISUALS = {
  'sustainable-futures': { Icon: Leaf, tone: 'sf', short: 'Sustainable Futures', blurb: 'Eco-audits, renewables and community action.' },
  'net-zero-microgrid': { Icon: Zap, tone: 'mg', short: 'Net Zero Microgrid', blurb: 'Campus energy hotspots, solar and storage.' },
  'project-arachne': { Icon: Bot, tone: 'ar', short: 'Project Arachne', blurb: 'Build and tune a quadruped robot for rough terrain.' }
};

export function ProgramCatalogueChooser({ school, onChooseProgram, onJoined }) {
  const offerings = useSchoolResource(schoolPath(school.id, 'program-offerings'));
  const custom=[...new Map((offerings.data?.items||[]).filter(o=>o.programDefinition).map(o=>[o.programDefinition.id,o.programDefinition])).values()];
  const catalogue=[...PROGRAM_CATALOGUE,...custom];
  const enrolled = new Set((offerings.data?.items || []).map(o => o.programId));
  const [joining, setJoining] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function join(e, programId) {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const result = await mutateSchool('POST', '/api/program-enrollments/join', { code });
      setFeedback({ kind: 'success', programId, text: result?.alreadyEnrolled ? 'You are already enrolled in this program.' : `Joined ${result?.title || 'the program'}. Your enrollment has been saved.` });
      setCode('');
      setJoining(null);
      offerings.reload();
      onJoined?.();
    } catch (error) {
      setFeedback({ kind: 'error', programId, text: serviceMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sw-card w2e-catalogue" aria-labelledby="w2e-catalogue-heading">
      <div className="sw-heading">
        <div>
          <span className="sw-kicker">PBL PROGRAMS</span>
          <h4 id="w2e-catalogue-heading">Choose a program</h4>
          <p className="sw-muted">All three semesters are listed. Your school decides which ones are open; join an open one with the class code your coach shares.</p>
        </div>
      </div>
      {offerings.error && <p className="sw-error" role="alert">{serviceMessage(offerings.error)}</p>}
      {offerings.loading && <p role="status">Checking your enrollments…</p>}
      <ul className="w2e-catalogue-list">
        {catalogue.map(program => {
          const v = VISUALS[program.id] || { Icon: Leaf, tone: 'sf', short: program.title, blurb: '' };
          const isEnrolled = enrolled.has(program.id);
          const isJoining = joining === program.id;
          const note = feedback?.programId === program.id ? feedback : null;
          return (
            <li key={program.id} className={`w2e-program w2e-program-${v.tone}${isEnrolled ? ' w2e-program-enrolled' : ''}`}>
              <div className="w2e-program-art" aria-hidden="true"><span className="w2e-program-icon"><v.Icon size={22} /></span></div>
              <div className="w2e-program-body">
                <div className="w2e-program-top">
                  <span className="sw-kicker">Semester {program.semester} · {program.gradeBand}</span>
                  {isEnrolled
                    ? <span className="w2e-pill w2e-pill-done"><CheckCircle2 size={14} aria-hidden="true" />Enrolled</span>
                    : <span className="w2e-pill w2e-pill-code"><KeyRound size={14} aria-hidden="true" />Class code needed</span>}
                </div>
                <strong>{v.short}</strong>
                <small>{v.blurb}</small>
                <p className="w2e-program-question">{program.drivingQuestion}</p>
                <small className="sw-muted">{program.milestones.length} milestones · {program.steamActivityIds?.length || 0} STEAM activities attached</small>
                <div className="sw-actions">
                  <button type="button" className={isEnrolled ? 'gh-btn gh-btn-primary' : 'gh-btn gh-btn-outline'} onClick={() => onChooseProgram?.(program.id)}>
                    {isEnrolled ? 'Open program' : 'See details'} <ChevronRight size={16} aria-hidden="true" />
                  </button>
                  {!isEnrolled && !isJoining && (
                    <button type="button" className="gh-btn gh-btn-ghost" onClick={() => { setJoining(program.id); setFeedback(null); }} aria-expanded={false}>
                      Join with class code
                    </button>
                  )}
                </div>
                {isJoining && (
                  <form className="sw-inline-form w2e-join-form" onSubmit={e => join(e, program.id)}>
                    <label className="sw-field">Class code for {v.short}
                      <input required maxLength={30} value={code} onChange={e => setCode(e.target.value)} autoComplete="off" autoFocus />
                    </label>
                    <button type="submit" disabled={busy} className="gh-btn gh-btn-primary">{busy ? 'Joining…' : 'Join program'}</button>
                    <button type="button" className="gh-btn gh-btn-ghost" onClick={() => { setJoining(null); setCode(''); }}>Cancel</button>
                  </form>
                )}
                {note && <p className={note.kind === 'error' ? 'sw-error' : 'sw-success'} role={note.kind === 'error' ? 'alert' : 'status'}>{note.text}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
