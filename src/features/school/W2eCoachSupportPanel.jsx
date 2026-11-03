import { useState } from 'react';
import { MessageSquare, CheckCircle, Clock, UserCheck, AlertTriangle, FileText, Filter, Info } from 'lucide-react';
import { useSchoolResource, schoolPath, mutateSchool, serviceMessage } from './useSchoolWorkspace.js';

export function W2eCoachSupportPanel({ school, classes }) {
  const requests = useSchoolResource(schoolPath(school.id, 'support-requests'), true);
  const learners = useSchoolResource(schoolPath(school.id, 'learners'), true);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [selectedLearnerUid, setSelectedLearnerUid] = useState('all');

  const handleUpdateStatus = async (item, newStatus) => {
    setUpdatingId(item.id);
    setActionError('');
    try {
      await mutateSchool(
        'PATCH',
        `${schoolPath(school.id, 'support-requests')}/${item.id}`,
        { status: newStatus, revision: item.revision }
      );
      requests.reload();
    } catch (err) {
      setActionError(serviceMessage(err) || 'Failed to update request status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const categoryLabels = {
    first_step: 'Help find the first step',
    explain_different: 'Explain a different way',
    need_break: 'Would like a break',
    private_talk: 'Would like to talk privately'
  };

  const list = requests.data?.items || [];
  const openRequests = list.filter(r => r.status !== 'resolved');
  const filteredRequests = selectedLearnerUid === 'all'
    ? openRequests
    : openRequests.filter(r => r.learnerUid === selectedLearnerUid);

  const learnerList = learners.data?.items || [];

  return (
    <div className="w2e-coach-panel">
      <div className="sw-heading" style={{ marginBottom: '16px' }}>
        <div>
          <span className="sw-kicker">W2E COACH CONNECTION</span>
          <h3>Support learner steps</h3>
          <p className="sw-muted">
            Learner-submitted requests, preferences, and feedback in separate views. No psychological conclusions or monitoring scores.
          </p>
        </div>
        {learnerList.length > 0 && (
          <div className="sw-field" style={{ minWidth: '220px' }}>
            <span><Filter size={14} /> Filter by learner</span>
            <select value={selectedLearnerUid} onChange={e => setSelectedLearnerUid(e.target.value)}>
              <option value="all">Show all assigned learners ({learnerList.length})</option>
              {learnerList.map(l => (
                <option key={l.id} value={l.id}>{l.displayName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {actionError && <p className="sw-error" role="alert">{actionError}</p>}

      {/* 4 Summary Tiles */}
      <div className="w2e-two-col" style={{ marginBottom: '20px' }}>
        <div className="sw-card" style={{ borderLeft: '4px solid var(--wl-purple, #8250A0)' }}>
          <span className="sw-kicker">OPEN REQUESTS</span>
          <h2 style={{ fontSize: '28px', margin: '4px 0' }}>{requests.loading ? 'Loading…' : requests.error ? 'Could not load' : openRequests.length}</h2>
          <small className="sw-muted">Learner-submitted support notes</small>
        </div>
        <div className="sw-card" style={{ borderLeft: '4px solid var(--wl-sky, #9BD2FF)' }}>
          <span className="sw-kicker">AWAITING REVIEW</span>
          <h2 style={{ fontSize: '20px', margin: '8px 0 4px', color: 'var(--gh-muted, #5d6b7a)' }}>Not tracked yet</h2>
          <small className="sw-muted">Project evidence submitted for feedback. For now, see PBL Programs › Lesson evidence.</small>
        </div>
        <div className="sw-card" style={{ borderLeft: '4px solid var(--wl-red, #AE3435)' }}>
          <span className="sw-kicker">OVERDUE GOALS</span>
          <h2 style={{ fontSize: '20px', margin: '8px 0 4px', color: 'var(--gh-muted, #5d6b7a)' }}>Not tracked yet</h2>
          <small className="sw-muted">PBL & STEAM learning milestones. For now, see Learning Goals.</small>
        </div>
        <div className="sw-card" style={{ borderLeft: '4px solid var(--wl-stone, #D9DAD3)' }}>
          <span className="sw-kicker">MISSING DATA</span>
          <h2 style={{ fontSize: '20px', margin: '8px 0 4px', color: 'var(--gh-muted, #5d6b7a)' }}>Not tracked yet</h2>
          <small className="sw-muted">Provider sync is pending. Coach observations are in Academic Progress.</small>
        </div>
      </div>

      <div className="w2e-layout-grid">
        <div className="w2e-main-col">
          {/* Support Requests Inbox */}
          <section className="sw-card">
            <h4>Check in with learners ({filteredRequests.length} open)</h4>
            <p className="sw-muted">Support requests contain learner-selected language and an optional note.</p>

            {requests.error && <p role="alert">{serviceMessage(requests.error)}</p>}
            {requests.loading && <p role="status">Loading support requests...</p>}
            {!requests.loading && !requests.error && !filteredRequests.length && (
              <div className="sw-notice">No open support requests for the selected learner filter right now.</div>
            )}

            <div className="w2e-request-list" style={{ marginTop: '14px' }}>
              {filteredRequests.map(r => (
                <div key={r.id} className="w2e-request-item sw-card" style={{ borderLeft: '4px solid var(--wl-purple, #8250A0)' }}>
                  <div className="w2e-request-header">
                    <strong>Learner Request · {categoryLabels[r.category] || r.category}</strong>
                    <span className="sw-pill">{r.status}</span>
                  </div>
                  {r.note && <p className="w2e-request-note">"{r.note}"</p>}
                  <div className="sw-muted" style={{ fontSize: '12px', marginTop: '6px' }}>
                    Submitted {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="sw-actions" style={{ marginTop: '12px' }}>
                    {r.status === 'submitted' && (
                      <button
                        type="button"
                        className="gh-btn gh-btn-outline"
                        disabled={updatingId === r.id}
                        onClick={() => handleUpdateStatus(r, 'acknowledged')}
                      >
                        <Clock size={14} /> Acknowledge
                      </button>
                    )}
                    {['submitted', 'acknowledged'].includes(r.status) && (
                      <button
                        type="button"
                        className="gh-btn gh-btn-outline"
                        disabled={updatingId === r.id}
                        onClick={() => handleUpdateStatus(r, 'checked_in')}
                      >
                        <UserCheck size={14} /> Mark checked-in
                      </button>
                    )}
                    <button
                      type="button"
                      className="gh-btn gh-btn-primary"
                      disabled={updatingId === r.id}
                      onClick={() => handleUpdateStatus(r, 'resolved')}
                    >
                      <CheckCircle size={14} /> Mark resolved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar for Learner Preferences & Safeguarding Policy */}
        <aside className="w2e-sidebar-col">
          <section className="sw-card" style={{ background: 'var(--wl-purple-100, #F0E8F7)', borderLeft: '4px solid var(--wl-purple, #8250A0)' }}>
            <span className="sw-kicker">LEARNER-SELECTED</span>
            <h4>Learning preferences</h4>
            <p className="sw-muted">Explicit learner-selected preferences, separate from achievement data.</p>
            <div className="w2e-tag-group" style={{ margin: '10px 0' }}>
              <span className="sw-pill">Explain aloud</span>
              <span className="sw-pill">One step at a time</span>
              <span className="sw-pill">Quiet work area</span>
            </div>
            <h5>Interests to build on</h5>
            <p className="sw-muted">Game design · Energy systems</p>

            <h5 style={{ marginTop: '14px' }}>Possible coaching prompt</h5>
            <div className="sw-notice">
              "Would it help to talk through one example together?"
            </div>
          </section>

          <section className="sw-card">
            <h4><Info size={16} /> Safeguarding & Ethics</h4>
            <ul style={{ paddingLeft: '20px', margin: '8px 0', fontSize: '13px', lineHeight: '1.6' }} className="sw-muted">
              <li>No inferred emotion scores or engagement telemetry.</li>
              <li>No clinical diagnoses or psychological conclusions.</li>
              <li>Learner preferences are unlinked from grades or rankings.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
