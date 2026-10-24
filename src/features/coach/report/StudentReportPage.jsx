import { useEffect, useState } from 'react';
import { Printer, FileDown } from 'lucide-react';
import { getStudentProfile, ProfileError } from '../../studentProfile/studentProfileService.js';
import './studentReport.css';

const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/**
 * Printable student report for a coach. "Save as PDF" uses the browser's print
 * dialog, so no PDF library is needed. Only the coach's own learners are offered.
 */
export function StudentReportPage({ learners = [], coach }) {
  const [learnerId, setLearnerId] = useState(learners[0]?.id || '');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  const learner = learners.find((l) => l.id === learnerId) || null;

  useEffect(() => {
    if (!learnerId) { setProfile(null); return undefined; }
    let cancelled = false;
    setError('');
    getStudentProfile(learnerId, { viewerUid: coach?.uid, role: coach?.role })
      .then((p) => { if (!cancelled) setProfile(p); })
      .catch((err) => {
        if (cancelled) return;
        setProfile(null);
        setError(err instanceof ProfileError ? 'This learner has no profile yet.' : 'The report could not be loaded.');
      });
    return () => { cancelled = true; };
  }, [learnerId, coach?.uid, coach?.role]);

  if (learners.length === 0) {
    return (
      <div className="gh-page sr-page">
        <h1 className="sr-title">Student report</h1>
        <section className="gh-card sr-empty" aria-label="No learners yet">
          <p>No learners in your classes yet.</p>
          <p className="sr-muted">Reports are available once learners join one of your classes.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="gh-page sr-page">
      <div className="sr-toolbar sr-noprint">
        <div>
          <h1 className="sr-title">Student report</h1>
          <p className="sr-muted">Choose a learner, then press Save as PDF and pick “Save as PDF” as the printer.</p>
        </div>
        <div className="sr-actions">
          <label className="sr-field">
            <span>Learner</span>
            <select value={learnerId} onChange={(e) => setLearnerId(e.target.value)}>
              {learners.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <button type="button" className="gh-btn gh-btn-primary" onClick={() => window.print()} disabled={!profile}>
            <FileDown size={16} aria-hidden="true" /> Save as PDF
          </button>
          <button type="button" className="gh-btn gh-btn-ghost" onClick={() => window.print()} disabled={!profile} aria-label="Print report">
            <Printer size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && <p className="sr-noprint sr-error" role="status">{error}</p>}

      {profile && learner && (
        <article className="sr-report" aria-label={`Report for ${learner.name}`}>
          <header className="sr-head">
            <div>
              <p className="sr-brand">WeLearn SPARK · Student report</p>
              <h2>{learner.name}</h2>
              <p className="sr-muted">{profile.cohort}{profile.age !== null ? ` · Age ${profile.age}` : ''} · School ID {profile.schoolStudentId}</p>
            </div>
            <dl className="sr-meta">
              <dt>Mentor</dt><dd>{profile.mentor.name}</dd>
              <dt>Prepared</dt><dd>{fmtDate(Date.now())}</dd>
            </dl>
          </header>

          <section className="sr-section">
            <h3>Academic progress</h3>
            {profile.academicProgress ? (
              <>
                <p><strong>{profile.academicProgress.percent}%</strong>{profile.academicProgress.note ? ` — ${profile.academicProgress.note}` : ''}</p>
                <p className="sr-muted">Set by {profile.mentor.name} on {fmtDate(profile.academicProgress.setAt)}</p>
              </>
            ) : <p className="sr-muted">No academic progress set yet.</p>}
          </section>

          <section className="sr-section">
            <h3>Grades{profile.gpa ? ` · GPA ${profile.gpa.value.toFixed(2)} / ${profile.gpa.scale.toFixed(1)} (${profile.gpa.term})` : ''}</h3>
            {profile.grades.length === 0 ? <p className="sr-muted">No grades recorded yet.</p> : (
              <table className="sr-table">
                <thead><tr><th scope="col">Subject</th><th scope="col">Term</th><th scope="col">Grade</th><th scope="col">Comment</th></tr></thead>
                <tbody>
                  {profile.grades.map((g) => (
                    <tr key={`${g.subject}-${g.term}`}><td>{g.subject}</td><td>{g.term}</td><td>{g.grade}</td><td>{g.comment || ''}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="sr-section">
            <h3>Badges</h3>
            {profile.badges.length === 0 ? <p className="sr-muted">No badges yet.</p> : (
              <ul className="sr-list">{profile.badges.map((b) => <li key={b.id}>{b.title} <span className="sr-muted">{fmtDate(b.earnedAt)}</span></li>)}</ul>
            )}
          </section>

          {profile.schoolSummary && (
            <section className="sr-section">
              <h3>How they are doing at school</h3>
              <p>{profile.schoolSummary.text}</p>
            </section>
          )}

          <footer className="sr-foot">Generated from WeLearn SPARK records. Confidential: for the learner, their family and their coaches.</footer>
        </article>
      )}
    </div>
  );
}
