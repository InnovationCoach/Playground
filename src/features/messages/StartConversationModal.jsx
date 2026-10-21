import { useEffect, useState } from 'react';
import { Users, User, X, ShieldCheck } from 'lucide-react';
import { startConversation, sendChatMessage, getConversation, loadMyClasses, loadClassStudents, openClassChat } from './messagesAPI.js';
import { db, collection, getDocs, query, where } from '../../firebase.js';

/**
 * "New chat" for coaches: open a class's group chat, or start a one-to-one
 * chat with a student in one of their classes. Class and student lists come
 * from the coach's signed classIds claim, the same thing the rules check, so
 * the picker never offers a chat the coach cannot actually start.
 */
export function StartConversationModal({ isOpen, onClose, coachId, coachName = '' }) {
  const [mode, setMode] = useState('class');
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const list = await loadMyClasses();
        if (cancelled) return;
        if (!list.length) { setError('Your account is not assigned to a class yet, so there is no one to message.'); return; }
        setClasses(list);
        setClassId((cur) => cur || list[0].id);
        const all = new Map();
        for (const c of list) for (const s of await loadClassStudents(c.id)) all.set(s.id, { ...s, className: c.name });
        if (!cancelled) setStudents([...all.values()].filter((s) => s.id !== coachId).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.warn('[Messages] Could not load classes:', err);
        if (!cancelled) setError(`Could not load your classes: ${err.message}`);
      }
    })();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { cancelled = true; document.removeEventListener('keydown', onKey); };
  }, [isOpen, coachId, onClose]);

  async function findDirect(sid) {
    const snap = await getDocs(query(collection(db, 'conversations'), where('participantIds', 'array-contains', coachId)));
    const hit = snap.docs.find((d) => (d.data().type || 'direct') === 'direct' && d.data().studentId === sid);
    return hit?.id || null;
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let convId;
      if (mode === 'class') {
        const c = classes.find((x) => x.id === classId);
        convId = await openClassChat({ coachId, coachName, classId, className: c?.name });
      } else {
        const s = students.find((x) => x.id === studentId);
        convId = await findDirect(studentId) || await startConversation(coachId, studentId, { coachName, studentName: s?.name || '' });
      }
      if (firstMessage.trim()) {
        const conv = await getConversation(convId);
        await sendChatMessage(conv, { uid: coachId, name: coachName }, { text: firstMessage.trim() });
      }
      setFirstMessage('');
      onClose();
      window.location.hash = `#/messages/${convId}`;
    } catch (err) {
      setError(err.message || 'Could not start the chat.');
    } finally {
      setBusy(false);
    }
  }

  if (!isOpen) return null;
  const ready = mode === 'class' ? !!classId : !!studentId;

  return (
    <div className="ms-modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ms-modal" role="dialog" aria-modal="true" aria-labelledby="ms-new-title">
        <div className="ms-modal-head">
          <h2 id="ms-new-title">New chat</h2>
          <button type="button" className="ms-icon-btn" onClick={onClose} aria-label="Close"><X size={18} aria-hidden="true" /></button>
        </div>
        <form onSubmit={submit} className="ms-modal-body">
          <div className="ms-choice" role="radiogroup" aria-label="Kind of chat">
            <button type="button" role="radio" aria-checked={mode === 'class'} onClick={() => setMode('class')}>
              <Users size={18} aria-hidden="true" /><span><strong>Class group chat</strong>Everyone enrolled in one of your classes</span>
            </button>
            <button type="button" role="radio" aria-checked={mode === 'direct'} onClick={() => setMode('direct')}>
              <User size={18} aria-hidden="true" /><span><strong>One student</strong>A private chat between you and a student</span>
            </button>
          </div>

          {mode === 'class' ? (
            <label className="ms-field"><span>Class</span>
              <select className="gh-select" value={classId} onChange={(e) => setClassId(e.target.value)} required>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <small>Opening it again refreshes the members from the class list.</small>
            </label>
          ) : (
            <label className="ms-field"><span>Student</span>
              <select className="gh-select" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="">Choose a student…</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}{classes.length > 1 ? ` (${s.className})` : ''}</option>)}
              </select>
            </label>
          )}

          <label className="ms-field"><span>First message <em>(optional)</em></span>
            <textarea className="gh-input" rows={3} value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} placeholder="Say hello…" />
          </label>

          {error && <div className="gh-alert gh-alert-error">{error}</div>}
          <p className="ms-modal-note"><ShieldCheck size={14} aria-hidden="true" />Messages can be reviewed by WeLearn staff for safeguarding.</p>
          <div className="ms-modal-actions">
            <button type="button" className="gh-btn gh-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="gh-btn gh-btn-accent" disabled={busy || !ready}>{busy ? 'Opening…' : mode === 'class' ? 'Open class chat' : 'Start chat'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
