import { useEffect, useState } from 'react';
import { createNote, fetchNotes, deleteNote } from '../../auth.js';
import { JoinClassPanel } from '../enrolment/JoinClassPanel.jsx';
import '../enrolment/joinPanel.css';

/**
 * Student landing view: welcome, notes, and the goals panel.
 *
 * The five activities are not rendered here - they remain legacy containers in
 * index.html, shown by the activity host. See activityHost.js.
 */
export function StudentDashboard({ profile, uid, onProfileChanged }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const classIds = Array.isArray(profile?.classIds) ? profile.classIds : [];

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setNotes(await fetchNotes());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function onAdd(e) {
    e.preventDefault();
    if (!draft.title.trim()) return;
    setSaving(true);
    try {
      await createNote(draft.title.trim(), draft.content.trim());
      setDraft({ title: '', content: '' });
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    try {
      await deleteNote(id);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container">
      <div className="dashboard-welcome-hero">
        <h2>Welcome back, {profile?.displayName || 'Student'}</h2>
        <p>
          {classIds.length ? (profile?.groupName || 'Your class') : 'Not in a class yet'}
          {' · '}Ages {profile?.ageBand || '13-15'}
        </p>
      </div>

      {uid && (
        <JoinClassPanel uid={uid} classIds={classIds} onJoined={onProfileChanged} />
      )}

      <div id="goals-dashboard-container" style={{ marginBottom: '2rem' }} />

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>📝 Your Notes</h3>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={onAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Note title"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            style={inputStyle}
          />
          <textarea
            placeholder="What did you learn?"
            value={draft.content}
            rows={3}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <button className="btn" type="submit" disabled={saving || !draft.title.trim()}>
            {saving ? 'Saving...' : 'Add Note'}
          </button>
        </form>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Loading notes...</p>
        ) : notes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No notes yet. Add your first note above.</p>
        ) : (
          notes.map((note) => (
            <div className="note-item" key={note.id}>
              <div>
                {/* Rendered as text, not innerHTML - the old loadNotes() built
                    this markup as a template string and hand-escaped it. */}
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{note.title}</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{note.content}</p>
              </div>
              <button
                className="btn-danger"
                onClick={() => onDelete(note.id)}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.5rem', border: '1px solid var(--card-border)',
  borderRadius: 6, background: '#0b1329', color: '#f8fafc'
};
