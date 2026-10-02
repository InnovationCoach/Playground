import { useState } from 'react';
import { useAuth } from '../../app/AuthProvider.jsx';
import { submitReport } from './communityAPI.js';
import '../admin/admin.css';

export function ReportModal({ isOpen, onClose, targetPath, targetType }) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;

    setLoading(true);
    try {
      // The rules reject a report whose reporterId is not the signed-in uid.
      await submitReport(targetType, targetPath, user.uid, reason, details);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
        setDetails('');
      }, 1500);
    } catch (err) {
      alert('Report failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="gh-card" style={{ maxWidth: 400, width: '90%' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Report Content</h3>

        {success ? (
          <div className="gh-alert gh-alert-success">Thank you. Our team will review this.</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Reason</label>
              <select
                className="gh-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">Select a reason</option>
                <option value="spam">Spam or advertising</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="abuse">Harassment or abuse</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Details (optional)</label>
              <textarea
                className="gh-input"
                placeholder="Tell us more…"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                style={{ minHeight: 80 }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="gh-btn gh-btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="gh-btn gh-btn-accent" disabled={loading || !reason}>
                {loading ? 'Reporting…' : 'Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
