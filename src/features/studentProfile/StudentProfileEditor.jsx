import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, AlertTriangle, Save } from 'lucide-react';
import { getProfileForEditing, updateProfile, PROFILE_LIMITS, ProfileError } from './studentProfileService.js';
import './studentProfile.css';

const errorText = (err) => (err instanceof ProfileError ? err.message : 'Something went wrong. Try again.');
const blankGrade = () => ({ id: '', subject: '', term: '', grade: '', comment: '' });

/**
 * Coach editor for a learner's school profile. Academic progress is set by the
 * coach, never calculated. Parents are notified after a successful save.
 */
export function StudentProfileEditor({ learnerUid, coach, learnerName }) {
  const [loaded, setLoaded] = useState(null);
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ kind: 'idle', message: '' });

  useEffect(() => {
    let cancelled = false;
    getProfileForEditing(learnerUid, coach)
      .then((p) => {
        if (cancelled) return;
        setLoaded(p);
        setForm({
          percent: p.academicProgress?.percent ?? '',
          progressNote: p.academicProgress?.note ?? '',
          grades: p.grades.map((g) => ({ ...g, comment: g.comment ?? '' })),
          gpaValue: p.gpa?.value ?? '',
          gpaTerm: p.gpa?.term ?? '',
          summary: p.schoolSummary?.text ?? '',
          teamsUrl: p.mentor.teamsUrl ?? ''
        });
      })
      .catch((err) => { if (!cancelled) setStatus({ kind: 'error', message: errorText(err) }); });
    return () => { cancelled = true; };
  }, [learnerUid, coach?.uid, coach?.role]);

  if (status.kind === 'error' && !form) return <section className="sp-card gh-card" role="status"><p>{status.message}</p></section>;
  if (!form) return <section className="sp-card gh-card"><p>Loading profile…</p></section>;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setGrade = (i, patch) => set({ grades: form.grades.map((g, idx) => (idx === i ? { ...g, ...patch } : g)) });

  const save = async (e) => {
    e.preventDefault();
    setStatus({ kind: 'working', message: 'Saving…' });
    const hasProgress = str(form.percent) !== '';
    const patch = {
      academicProgress: hasProgress ? { percent: Number(form.percent), note: form.progressNote } : undefined,
      grades: form.grades.map((g) => ({ ...g })),
      gpa: str(form.gpaValue) === '' ? null : { value: Number(form.gpaValue), term: form.gpaTerm },
      schoolSummary: form.summary,
      teamsUrl: form.teamsUrl
    };
    try {
      const saved = await updateProfile(learnerUid, patch, { actorUid: coach.uid, role: coach.role });
      setLoaded(saved);
      setStatus({ kind: 'success', message: 'Saved. Parents have been told that the profile was updated.' });
    } catch (err) {
      setStatus({ kind: 'error', message: errorText(err) });
    }
  };

  const working = status.kind === 'working';

  return (
    <form className="sp-card gh-card sp-editor" onSubmit={save} aria-labelledby="sp-edit-title">
      <h2 id="sp-edit-title" className="sp-title">School profile{learnerName ? `: ${learnerName}` : ''}</h2>
      <p className="sp-muted">Admin-only fields (school ID, date of birth, cohort, mentor) are set by the school office.</p>

      <fieldset className="sp-fieldset">
        <legend>Academic progress (set by you, not calculated)</legend>
        <div className="sp-row">
          <label className="sp-field">
            <span>Progress (0–100)</span>
            <input type="number" min={0} max={100} step={1} value={form.percent} onChange={(e) => set({ percent: e.target.value })} />
          </label>
          <label className="sp-field sp-grow">
            <span>Note (optional, {PROFILE_LIMITS.progressNote} characters)</span>
            <input maxLength={PROFILE_LIMITS.progressNote} value={form.progressNote} onChange={(e) => set({ progressNote: e.target.value })} />
          </label>
        </div>
        <p className="sp-muted">Leave progress blank to hide the bar from parents.</p>
      </fieldset>

      <fieldset className="sp-fieldset">
        <legend>Grades ({form.grades.length})</legend>
        {form.grades.map((g, i) => (
          <div className="sp-row sp-grade-row" key={g.id || `new-${i}`}>
            <label className="sp-field"><span>Subject</span><input maxLength={PROFILE_LIMITS.gradeSubject} value={g.subject} onChange={(e) => setGrade(i, { subject: e.target.value })} /></label>
            <label className="sp-field"><span>Term</span><input maxLength={40} value={g.term} onChange={(e) => setGrade(i, { term: e.target.value })} /></label>
            <label className="sp-field"><span>Grade</span><input maxLength={PROFILE_LIMITS.gradeText} value={g.grade} onChange={(e) => setGrade(i, { grade: e.target.value })} /></label>
            <label className="sp-field sp-grow"><span>Comment</span><input maxLength={PROFILE_LIMITS.gradeComment} value={g.comment} onChange={(e) => setGrade(i, { comment: e.target.value })} /></label>
            <button type="button" className="gh-btn gh-btn-ghost" aria-label={`Remove grade ${i + 1}`} onClick={() => set({ grades: form.grades.filter((_, idx) => idx !== i) })}>
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        ))}
        <button type="button" className="gh-btn gh-btn-ghost" onClick={() => set({ grades: [...form.grades, blankGrade()] })}>
          <Plus size={15} aria-hidden="true" /> Add grade
        </button>
      </fieldset>

      <fieldset className="sp-fieldset">
        <legend>GPA (4.0 scale)</legend>
        <div className="sp-row">
          <label className="sp-field"><span>GPA (0.0–4.0)</span><input type="number" min={0} max={4} step={0.01} value={form.gpaValue} onChange={(e) => set({ gpaValue: e.target.value })} /></label>
          <label className="sp-field sp-grow"><span>Term</span><input maxLength={40} value={form.gpaTerm} onChange={(e) => set({ gpaTerm: e.target.value })} /></label>
        </div>
      </fieldset>

      <fieldset className="sp-fieldset">
        <legend>How they are doing at school ({PROFILE_LIMITS.schoolSummary} characters)</legend>
        <textarea rows={3} maxLength={PROFILE_LIMITS.schoolSummary} value={form.summary} onChange={(e) => set({ summary: e.target.value })} />
      </fieldset>

      <fieldset className="sp-fieldset">
        <legend>Your Teams link (for parents)</legend>
        <label className="sp-field">
          <span>Link to a chat with you on Microsoft Teams</span>
          <input type="url" placeholder="https://teams.microsoft.com/…" value={form.teamsUrl} onChange={(e) => set({ teamsUrl: e.target.value })} />
        </label>
      </fieldset>

      <div className="sp-actions">
        <button type="submit" className="gh-btn gh-btn-primary" disabled={working}>
          <Save size={15} aria-hidden="true" /> {working ? 'Saving…' : 'Save profile'}
        </button>
      </div>
      <div role="status" aria-live="polite" className={`sp-status sp-status-${status.kind}`}>
        {status.kind === 'error' && <AlertTriangle size={14} aria-hidden="true" />}
        {status.kind === 'success' && <Check size={14} aria-hidden="true" />}
        {status.message}
      </div>
      {loaded && <p className="sp-muted">Last saved {loaded.updatedAt ? new Date(loaded.updatedAt).toLocaleString() : 'never'}.</p>}
    </form>
  );
}

function str(v) { return String(v ?? '').trim(); }
