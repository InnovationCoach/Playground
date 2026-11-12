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
  const [rating, setRating] = useState(0);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [ratingStatus, setRatingStatus] = useState('');
  // Keep the same document ID on retry after an uncertain network response.
  const pendingId = useRef(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setEntries([]); setText(''); setError(''); setStatus('');
    setRating(0); setRatingError(''); setRatingStatus(''); pendingId.current = null;
    getDocs(collection(db, 'users', learnerUid, 'feedback')).then(snap => {
      if (active) {
        const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        setEntries(docs.filter(f => f.feedbackText && (!f.workId || f.workId === workId)).sort((a,b) => b.timestamp - a.timestamp));
        const ratingDoc = docs.find(f => f.coachId === auth.currentUser?.uid && f.type === 'work_rating' && Number.isInteger(f.rating) && f.rating >= 1 && f.rating <= 5);
        if (ratingDoc) setRating(ratingDoc.rating);
      }
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
  async function saveRating(nextRating) {
    if (ratingBusy || !auth.currentUser) return;
    const user = auth.currentUser;
    setRatingBusy(true); setRatingError(''); setRatingStatus('Saving rating…');
    const record = {
      coachId: user.uid,
      coachName: (user.displayName || 'Coach').slice(0, 160),
      rating: nextRating,
      timestamp: Date.now(),
      type: 'work_rating',
      ...(workId ? { workId } : {})
    };
    try {
      await setDoc(doc(db, 'users', learnerUid, 'feedback', `rating_${user.uid}`), record);
      setRating(nextRating);
      setRatingStatus(`Rating saved (${nextRating} of 5).`);
    } catch {
      setRatingStatus('');
      setRatingError('Rating was not saved. Try again.');
    } finally {
      setRatingBusy(false);
    }
  }
  return <section className="cw-feedback" aria-label="Coach feedback">
    <h3>Coach feedback</h3><p className="cw-muted">Written guidance and rating for this work. Feedback does not mark the work approved.</p>
    <div className="cw-rating-section">
      <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--gh-heading)' }}>
        Work rating
      </label>
      <div className="cw-rating-buttons">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            className={`cw-star-btn gh-btn ${rating >= n ? 'gh-btn-primary' : 'gh-btn-ghost'}`}
            disabled={ratingBusy}
            onClick={() => saveRating(n)}
            aria-label={`Rate ${n} of 5 stars`}
            aria-pressed={rating === n}
          >
            ★ {n}
          </button>
        ))}
        {rating > 0 && <span style={{ fontSize: 12, color: 'var(--gh-muted)', marginLeft: 6 }}>({rating}/5 stars)</span>}
      </div>
      {ratingStatus && <small role="status" style={{ display: 'block', marginTop: 4, color: 'var(--gh-purple)' }}>{ratingStatus}</small>}
      {ratingError && <small role="alert" style={{ display: 'block', marginTop: 4, color: '#ef4444' }}>{ratingError}</small>}
    </div>
    {loading && <p role="status">Loading feedback history…</p>}
    {entries.map(f => <article key={f.id} className="cw-evidence"><strong>{f.coachName || 'Coach'}</strong><small>{dateLabel(f.timestamp)}{!f.workId ? ' · General learner feedback' : ''}</small><p className="cw-evidence-body">{f.feedbackText}</p></article>)}
    {!loading && !entries.length && !error && <p>No written feedback yet.</p>}
    <form onSubmit={save}><label>Feedback for this work<textarea required maxLength={4000} value={text} disabled={busy} onChange={e => setText(e.target.value)} /></label><button className="gh-btn gh-btn-primary" disabled={busy || !text.trim()}>{busy ? 'Saving…' : 'Save feedback'}</button></form>
    {status && <p role="status">{status}</p>}{error && <p role="alert">{error}</p>}
  </section>;
}
