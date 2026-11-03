import { useEffect, useRef, useState } from 'react';
import { auth, db, collection, doc, getDocs, setDoc } from '../../firebase.js';
import { dateLabel } from './progressModel.js';

export function LearnerFeedback({ learnerUid, workId }) {
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  // Keep the same document ID on retry after an uncertain network response.
  const pendingId = useRef(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setEntries([]); setText(''); setError(''); setStatus(''); pendingId.current = null;
    getDocs(collection(db, 'users', learnerUid, 'feedback')).then(snap => {
      if (active) setEntries(snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(f => f.feedbackText && (!f.workId || f.workId === workId)).sort((a,b) => b.timestamp - a.timestamp));
    }).catch(() => { if (active) setError('Feedback history could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [learnerUid, workId]);
  async function save(e) {
    e.preventDefault();
    if (busy || !text.trim() || !auth.currentUser) return;
    setBusy(true); setError(''); setStatus('Saving feedback…');
    const user = auth.currentUser;
    pendingId.current ||= `written_${crypto.randomUUID()}`;
    const id = pendingId.current;
    const record = { coachId: user.uid, coachName: (user.displayName || 'Coach').slice(0,160), feedbackText: text.trim(), timestamp: Date.now(), type: 'written_feedback', workId };
    try {
      await setDoc(doc(db, 'users', learnerUid, 'feedback', id), record);
      setEntries(previous => [{ ...record, id }, ...previous.filter(f => f.id !== id)]);
      pendingId.current = null; setText(''); setStatus('Feedback saved.');
    } catch { setStatus(''); setError('Feedback was not saved. Your draft is kept here; try again.'); }
    finally { setBusy(false); }
  }
  return <section className="cw-feedback" aria-label="Coach feedback">
    <h3>Coach feedback</h3><p className="cw-muted">Written guidance for this work. Feedback does not mark the work approved.</p>
    {loading && <p role="status">Loading feedback history…</p>}
    {entries.map(f => <article key={f.id} className="cw-evidence"><strong>{f.coachName || 'Coach'}</strong><small>{dateLabel(f.timestamp)}{!f.workId ? ' · General learner feedback' : ''}</small><p className="cw-evidence-body">{f.feedbackText}</p></article>)}
    {!loading && !entries.length && !error && <p>No written feedback yet.</p>}
    <form onSubmit={save}><label>Feedback for this work<textarea required maxLength={4000} value={text} disabled={busy} onChange={e => setText(e.target.value)} /></label><button className="gh-btn gh-btn-primary" disabled={busy || !text.trim()}>{busy ? 'Saving…' : 'Save feedback'}</button></form>
    {status && <p role="status">{status}</p>}{error && <p role="alert">{error}</p>}
  </section>;
}
