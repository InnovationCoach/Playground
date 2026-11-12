import { useState, useEffect } from 'react';
import { ShieldCheck, Clock, XCircle, LogOut } from 'lucide-react';
import { logoutUser } from '../../auth.js';

export function RequestAccessModal({ user, onClose }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    givenNames: user?.displayName ? user.displayName.split(' ')[0] : '',
    surname: user?.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
    requestedRole: 'student',
    reason: ''
  });

  useEffect(() => {
    async function checkExisting() {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/auth/access-request/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.hasRequest && data.request) {
          setExistingRequest(data.request);
        }
      } catch (err) {
        console.error('Failed to check request status:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) checkExisting();
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/auth/access-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to submit request');
      }
      setExistingRequest(data.request);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await logoutUser();
    if (onClose) onClose();
  }

  if (loading) {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Clock size={32} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--gh-purple, #8250a0)' }} />
            <p style={{ marginTop: '1rem', color: '#64748b' }}>Checking access status...</p>
          </div>
        </div>
      </div>
    );
  }

  // 1. Pending Approval State
  if (existingRequest && existingRequest.status === 'pending') {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#fef3c7',
              color: '#d97706',
              marginBottom: '1rem'
            }}>
              <Clock size={30} />
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#1e293b' }}>
              Access Pending Approval
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Your access request has been received and is waiting for review by <strong>Mani</strong> (Platform Lead).
            </p>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.84rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: '#64748b' }}>Account</span>
              <strong style={{ color: '#1e293b' }}>{existingRequest.email}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: '#64748b' }}>Requested Role</span>
              <strong style={{ textTransform: 'capitalize', color: '#1e293b' }}>{existingRequest.requestedRole}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Submitted</span>
              <span style={{ color: '#64748b' }}>{new Date(existingRequest.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', margin: '0 0 1.25rem' }}>
            You will be notified at <strong>{existingRequest.email}</strong> once your access is approved.
          </p>

          <button
            type="button"
            className="gh-btn gh-btn-block"
            onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 2. Rejected State
  if (existingRequest && existingRequest.status === 'rejected') {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              marginBottom: '1rem'
            }}>
              <XCircle size={30} />
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#1e293b' }}>
              Access Request Declined
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Your access request could not be approved at this time.
            </p>
          </div>

          <div style={{
            background: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.84rem'
          }}>
            <strong style={{ color: '#c53030', display: 'block', marginBottom: '0.25rem' }}>Reason</strong>
            <p style={{ margin: 0, color: '#742a2a' }}>{existingRequest.rejectionReason || 'Declined by administration.'}</p>
          </div>

          <button
            type="button"
            className="gh-btn gh-btn-block"
            onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 3. New Request Submission Form
  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gh-purple, #8250a0)', marginBottom: '0.4rem' }}>
            <ShieldCheck size={20} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              WeLearn Identity Verification
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.4rem', color: '#1e293b' }}>
            Request Access
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
            You signed in with <strong>{user?.email}</strong>. Please complete this one-time request to activate your Spark workspace.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={labelStyle}>Given Name</label>
              <input
                type="text"
                required
                className="gh-input"
                value={form.givenNames}
                onChange={(e) => setForm({ ...form, givenNames: e.target.value })}
                placeholder="Given name"
              />
            </div>
            <div>
              <label style={labelStyle}>Surname</label>
              <input
                type="text"
                required
                className="gh-input"
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                placeholder="Surname"
              />
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={labelStyle}>I am a:</label>
            <select
              className="gh-select"
              value={form.requestedRole}
              onChange={(e) => setForm({ ...form, requestedRole: e.target.value })}
            >
              <option value="student">Student / Learner</option>
              <option value="staff">Staff Member / Coach</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Program, Class, or Reason (Optional)</label>
            <textarea
              className="gh-input"
              rows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Year 9 Science, Climate Champions, Coach Sam's class..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="gh-btn"
              onClick={handleSignOut}
              style={{ flex: 1 }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="gh-btn gh-btn-primary"
              style={{ flex: 2 }}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '1rem'
};

const cardStyle = {
  background: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  width: '100%',
  maxWidth: '460px',
  padding: '1.75rem',
  boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#475569',
  marginBottom: '0.35rem'
};
