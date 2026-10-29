import { useEffect, useState } from 'react';
import { GraduationCap, MessageSquare, Award, Target } from 'lucide-react';
import { getStudentProfile, ProfileError } from './studentProfileService.js';
import './studentProfile.css';

const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/**
 * Parent and student view of a learner's school profile. Read-only. Hides the
 * progress bar until a coach has set it, rather than showing 0%.
 */
export function StudentProfileCard({ learnerUid, viewer, childName }) {
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null, error: '' });
    getStudentProfile(learnerUid, { viewerUid: viewer?.uid, role: viewer?.role, linkedParentUids: viewer?.linkedParentUids || [] })
      .then((data) => { if (!cancelled) setState({ status: 'ready', data, error: '' }); })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof ProfileError && err.status === 404
          ? 'This profile is not available yet.'
          : 'The profile could not be loaded. Try again later.';
        setState({ status: 'error', data: null, error: message });
      });
    return () => { cancelled = true; };
    // viewer is a small object rebuilt each render; the uid and role are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerUid, viewer?.uid, viewer?.role]);

  if (state.status === 'loading') return <section className="sp-card gh-card"><p>Loading profile…</p></section>;
  if (state.status === 'error') return <section className="sp-card gh-card" role="status"><p>{state.error}</p></section>;

  const p = state.data;
  const progress = p.academicProgress;

  return (
    <section className="sp-card gh-card" aria-labelledby="sp-title">
      {/* A <div>, not <header>: index.html styles every bare `header` with a dark navy background and purple border. */}
      <div className="sp-head">
        <div>
          <h2 id="sp-title" className="sp-title"><GraduationCap size={18} aria-hidden="true" /> {childName ? `${childName}’s school profile` : 'School profile'}</h2>
          <p className="sp-muted">{p.cohort}{p.age !== null ? ` · Age ${p.age}` : ''} · School ID {p.schoolStudentId}</p>
        </div>
        <div className="sp-mentor">
          <span className="sp-muted">Mentor: {p.mentor.name}</span>
          {p.mentor.teamsUrl && (
            <a className="gh-btn gh-btn-ghost sp-teams" href={p.mentor.teamsUrl} target="_blank" rel="noopener noreferrer">
              <MessageSquare size={15} aria-hidden="true" /> Message the coach on Teams
            </a>
          )}
        </div>
      </div>

      {progress ? (
        <div className="sp-progress">
          <div className="sp-progress-top">
            <strong>Academic progress</strong>
            <span>{progress.percent}%</span>
          </div>
          <div
            className="sp-bar"
            role="progressbar"
            aria-label="Academic progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
          >
            <span style={{ width: `${progress.percent}%` }} />
          </div>
          {progress.note && <p className="sp-note">{progress.note}</p>}
          <p className="sp-muted">Set by {p.mentor.name} on {fmtDate(progress.setAt)}</p>
        </div>
      ) : (
        <p className="sp-muted">Your coach has not set academic progress yet.</p>
      )}

      <div className="sp-grid">
        <div>
          <h3 className="sp-h3"><Target size={15} aria-hidden="true" /> Grades</h3>
          {p.grades.length === 0 && <p className="sp-muted">No grades recorded yet.</p>}
          {p.grades.length > 0 && (
            <table className="sp-table">
              <thead><tr><th scope="col">Subject</th><th scope="col">Term</th><th scope="col">Grade</th></tr></thead>
              <tbody>
                {p.grades.map((g) => (
                  <tr key={`${g.subject}-${g.term}`}>
                    <td>{g.subject}{g.comment && <span className="sp-muted"> · {g.comment}</span>}</td>
                    <td>{g.term}</td>
                    <td><strong>{g.grade}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {p.gpa && (
            <p className="sp-gpa">GPA <strong>{p.gpa.value.toFixed(2)}</strong> / {p.gpa.scale.toFixed(1)} <span className="sp-muted">({p.gpa.term})</span></p>
          )}
        </div>

        <div>
          <h3 className="sp-h3"><Award size={15} aria-hidden="true" /> Badges</h3>
          {p.badges.length === 0 && <p className="sp-muted">No badges yet.</p>}
          <ul className="sp-badges">
            {p.badges.map((b) => <li key={b.id}>{b.title} <span className="sp-muted">{fmtDate(b.earnedAt)}</span></li>)}
          </ul>
        </div>
      </div>

      {p.schoolSummary && (
        <div className="sp-summary">
          <h3 className="sp-h3">How they are doing at school</h3>
          <p>{p.schoolSummary.text}</p>
          <p className="sp-muted">Updated {fmtDate(p.schoolSummary.updatedAt)}</p>
        </div>
      )}
    </section>
  );
}
