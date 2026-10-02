import { useState, useEffect } from 'react';
import { startConversation, sendMessage } from './messagesAPI.js';
import { db, collection, getDocs, query, where, getAuthClaims } from '../../firebase.js';
import '../admin/admin.css';

/**
 * Modal for coaches to start a new conversation with a student in one of
 * their own classes. The class list comes from the coach's signed classIds
 * claim, the same thing the rules check, so the picker never offers a
 * student the coach cannot actually message.
 */
export function StartConversationModal({ isOpen, onClose, coachId, coachName = '' }) {
  const [studentId, setStudentId] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentOptions, setStudentOptions] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setError(null);

    (async () => {
      try {
        const claims = await getAuthClaims();
        const classIds = Array.isArray(claims.classIds) ? claims.classIds.filter(Boolean).slice(0, 30) : [];
        if (classIds.length === 0) {
          if (!cancelled) setError('Your account is not assigned to a class yet, so there are no students to message.');
          return;
        }
        const snap = await getDocs(query(collection(db, 'users'), where('classIds', 'array-contains-any', classIds)));
        if (cancelled) return;
        const list = [];
        snap.forEach(d => {
          const data = d.data();
          if (d.id !== coachId && (data.role || 'student') === 'student') {
            list.push({ id: d.id, displayName: data.displayName || data.email?.split('@')[0] || 'Student' });
          }
        });
        list.sort((a, b) => a.displayName.localeCompare(b.displayName));
        setStudentOptions(list);
      } catch (err) {
        console.warn('[Messages] Could not load class students:', err);
        if (!cancelled) setError('Could not load your students: ' + err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, coachId]);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const studentName = studentOptions.find(s => s.id === studentId)?.displayName || '';
      const convId = await startConversation(coachId, studentId, { coachName, studentName });
      if (initialMessage.trim()) await sendMessage(convId, coachId, initialMessage.trim());
      setStudentId('');
      setInitialMessage('');
      onClose();
      window.location.hash = `#/messages/${convId}`;
    } catch (err) {
      setError(err.message || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="gh-card" style={{ maxWidth: 400, width: '90%' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Start a Conversation</h3>

        <form onSubmit={handleStart}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Select Student</label>
            <select
              className="gh-select"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            >
              <option value="">Choose a student…</option>
              {studentOptions.map(s => (
                <option key={s.id} value={s.id}>{s.displayName || s.id}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Message (optional)</label>
            <textarea
              className="gh-input"
              placeholder="Say hello…"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              style={{ minHeight: 80 }}
            />
          </div>

          {error && <div className="gh-alert gh-alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="gh-btn gh-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="gh-btn gh-btn-primary" disabled={loading || !studentId}>
              {loading ? 'Starting…' : 'Start'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--gh-subtle)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--gh-text-2)' }}>
          📌 Messages are monitored by WeLearn for safeguarding.
        </div>
      </div>
    </div>
  );
}
