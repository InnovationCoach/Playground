import { useEffect, useState } from 'react';
import { Trash } from 'lucide-react';
import { createNote, fetchNotes, deleteNote } from '../../auth.js';

/**
 * "My notes" on My Dashboard: the same notes as the original student
 * dashboard's "Your Notes" (users/{uid}/notes via auth.js), so nothing a
 * learner wrote there is lost. Newest first, the five most recent shown.
 */
const SHOWN = 5;

export function NotesWidget() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(null);

  async function reload() {
    setError(null);
    try {
      const list = await fetchNotes();
      const at = (n) => n.createdAt?.toMillis?.() ?? (Date.parse(n.createdAt) || 0);
      setNotes([...list].sort((x, y) => at(y) - at(x)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function onAdd(e) {
    e.preventDefault();
    if (!draft.title.trim() || saving) return;
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
    setConfirming(null);
    try {
      await deleteNote(id);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="md-notes">
      <form className="md-notes-form" onSubmit={onAdd}>
        <label className="md-sr" htmlFor="md-note-title">Note title</label>
        <input id="md-note-title" className="md-input" placeholder="What did you learn?" maxLength={120}
               value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
        <label className="md-sr" htmlFor="md-note-body">Details</label>
        <textarea id="md-note-body" className="md-input" rows={2} placeholder="Details (optional)" maxLength={2000}
                  value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))} />
        <button type="submit" className="md-btn md-btn-primary" disabled={saving || !draft.title.trim()}>
          {saving ? 'Saving…' : 'Add note'}
        </button>
      </form>
      {error && <p className="md-error" role="alert">Could not load or save notes: {error}</p>}
      {loading ? (
        <p className="md-muted">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="md-muted">No notes yet. Write down one thing you learned today.</p>
      ) : (
        <ul className="md-note-list">
          {notes.slice(0, SHOWN).map((n) => (
            <li key={n.id}>
              <div className="md-note-text">
                <strong>{n.title}</strong>
                {n.content && <p>{n.content}</p>}
              </div>
              {confirming === n.id ? (
                <span className="md-confirm">Delete?
                  <button type="button" onClick={() => onDelete(n.id)}>Yes</button>
                  <button type="button" onClick={() => setConfirming(null)}>No</button>
                </span>
              ) : (
                <button type="button" className="md-icon-btn" aria-label={`Delete note: ${n.title}`} onClick={() => setConfirming(n.id)}>
                  <Trash size={15} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
          {notes.length > SHOWN && <li className="md-muted md-small">and {notes.length - SHOWN} older notes</li>}
        </ul>
      )}
    </div>
  );
}
