import { useCallback, useEffect, useState } from 'react';
import { Compass, Check, RotateCcw, Clock, RefreshCw, MessageSquare } from 'lucide-react';
import { getCoachSubmissions, reviewSubmission } from '../../universe/universeApi.js';
import './coachUniverse.css';

export function CoachUniverseSubmissions({ coachUser }) {
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await getCoachSubmissions({ status: statusFilter });
      setSubmissions(res.submissions || []);
    } catch (err) {
      console.error('[CoachUniverse] Failed to load submissions:', err);
      setActionError('Could not load universe submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleReview = async (id, decision) => {
    setSubmittingId(id);
    setActionError(null);
    const note = notes[id] || '';
    try {
      await reviewSubmission({
        submissionId: id,
        decision,
        note: note.trim() || undefined
      });
      // Remove from list if viewing pending, or reload
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error('[CoachUniverse] Review failed:', err);
      setActionError(err.message || 'Failed to record review.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleNoteChange = (id, text) => {
    setNotes((prev) => ({ ...prev, [id]: text }));
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = ts._seconds ? new Date(ts._seconds * 1000) : (ts.toDate ? ts.toDate() : new Date(ts));
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <section className="coach-universe-card" aria-labelledby="coach-universe-heading">
      <header className="coach-universe-header">
        <div className="coach-universe-title">
          <Compass size={22} className="coach-universe-icon" aria-hidden="true" />
          <div>
            <h2 id="coach-universe-heading">My Universe · Mission Reviews</h2>
            <p className="coach-universe-subtitle">
              Review learner mission reflections to authoritatively verify learning and unlock gated planets.
            </p>
          </div>
        </div>
        <div className="coach-universe-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'submitted'}
            className={`coach-tab ${statusFilter === 'submitted' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('submitted')}
          >
            Pending Review
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'approved'}
            className={`coach-tab ${statusFilter === 'approved' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('approved')}
          >
            Approved
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'returned'}
            className={`coach-tab ${statusFilter === 'returned' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('returned')}
          >
            Returned
          </button>
          <button
            type="button"
            className="coach-refresh-btn"
            onClick={loadSubmissions}
            title="Refresh submissions"
            aria-label="Refresh submissions"
          >
            <RefreshCw size={15} aria-hidden="true" className={loading ? 'is-spinning' : ''} />
          </button>
        </div>
      </header>

      {actionError && (
        <div className="coach-universe-alert is-error" role="alert">
          {actionError}
        </div>
      )}

      <div className="coach-universe-body">
        {loading && <p className="coach-universe-empty">Loading mission submissions…</p>}

        {!loading && submissions.length === 0 && (
          <p className="coach-universe-empty">
            {statusFilter === 'submitted'
              ? 'No mission submissions awaiting review in your classes.'
              : `No ${statusFilter} mission submissions.`}
          </p>
        )}

        {!loading && submissions.length > 0 && (
          <ul className="coach-submissions-list" aria-label="Mission submissions list">
            {submissions.map((sub) => {
              const isProcessing = submittingId === sub.id;
              const noteValue = notes[sub.id] ?? (sub.coachNote || '');
              return (
                <li key={sub.id} className="coach-submission-item">
                  <div className="coach-sub-meta">
                    <div className="coach-sub-badges">
                      <span className="coach-badge is-mission">{sub.missionId}</span>
                      <span className="coach-badge is-route">{sub.routeId} route</span>
                      {sub.classIds?.map((cid) => (
                        <span key={cid} className="coach-badge is-class">
                          {cid}
                        </span>
                      ))}
                    </div>
                    <div className="coach-sub-time">
                      <Clock size={13} aria-hidden="true" />
                      <span>{formatTime(sub.createdAt)}</span>
                    </div>
                  </div>

                  <div className="coach-sub-learner">
                    <strong>Learner UID:</strong> {sub.learnerUid}
                  </div>

                  <div className="coach-sub-reflection">
                    <span className="coach-sub-label">Recommendation & Trade-off Reflection:</span>
                    <blockquote>“{sub.reflection}”</blockquote>
                  </div>

                  {statusFilter === 'submitted' ? (
                    <div className="coach-sub-actions">
                      <div className="coach-note-input">
                        <label htmlFor={`coach-note-${sub.id}`}>
                          <MessageSquare size={14} aria-hidden="true" />
                          Coach feedback note (optional, up to 1,000 characters):
                        </label>
                        <input
                          id={`coach-note-${sub.id}`}
                          type="text"
                          maxLength={1000}
                          placeholder="e.g., Clear trade-off analysis between food payload and transit duration!"
                          value={noteValue}
                          disabled={isProcessing}
                          onChange={(e) => handleNoteChange(sub.id, e.target.value)}
                        />
                      </div>
                      <div className="coach-btn-group">
                        <button
                          type="button"
                          className="coach-btn is-approve"
                          disabled={isProcessing}
                          onClick={() => handleReview(sub.id, 'approved')}
                        >
                          <Check size={16} aria-hidden="true" />
                          {isProcessing ? 'Saving…' : 'Approve & Unlock Planet'}
                        </button>
                        <button
                          type="button"
                          className="coach-btn is-return"
                          disabled={isProcessing}
                          onClick={() => handleReview(sub.id, 'returned')}
                        >
                          <RotateCcw size={16} aria-hidden="true" />
                          {isProcessing ? 'Saving…' : 'Return for Revision'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="coach-sub-reviewed-note">
                      <strong>Coach Note:</strong> {sub.coachNote ? `“${sub.coachNote}”` : 'None'} · Reviewed on{' '}
                      {formatTime(sub.reviewedAt)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
