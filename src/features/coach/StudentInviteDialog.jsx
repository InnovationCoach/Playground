import { useEffect, useRef, useState } from 'react';
import { schoolRequest } from '../../services/api/apiClient.js';

export function StudentInviteDialog({ onClose, onCreated, initialClassId = 'all' }) {
  const dialog = useRef(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', classId: initialClassId === 'all' ? '' : initialClassId, ageBand: '' });
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    return () => { previous?.focus?.(); };
  }, []);
  useEffect(() => {
    let active = true;
    schoolRequest('GET', '/api/coach/students/classes').then(data => {
      if (!active) return;
      setClasses(data.items);
      setForm(f => ({ ...f, classId: data.items.some(c => c.id === f.classId) ? f.classId : data.items[0]?.id || '' }));
    }).catch(err => { if (active) setError(err.message || 'Classes could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    if (busy || result) return;
    setBusy(true); setError('');
    try {
      const created = await schoolRequest('POST', '/api/coach/students', { body: form });
      setResult(created);
      onCreated?.(created.student);
    } catch (err) { setError(err.message || 'Student setup failed. Check the roster before retrying.'); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="cw-invite-dialog gh-app" aria-labelledby="cw-invite-title" onCancel={e => { if (busy) e.preventDefault(); else onClose(); }}>
    <h2 id="cw-invite-title">{result ? 'Student account created' : 'Add a student'}</h2>
    {result ? <>
      <p>{result.student.displayName} is assigned to {result.student.groupName}. They choose their own password using this private setup link.</p>
      <p role="status">No email has been sent. Share this link privately with the intended student or their parent.</p>
      <label>Private setup link<input readOnly value={result.setupLink} onFocus={e => e.target.select()} /></label>
      <button className="gh-btn gh-btn-primary" onClick={async () => {
        try { await navigator.clipboard.writeText(result.setupLink); setCopied(true); }
        catch { setError('Copy is unavailable. Select the link above and copy it manually.'); }
      }}>{copied ? 'Link copied' : 'Copy setup link'}</button>
      <button className="gh-btn gh-btn-ghost" onClick={onClose}>Done</button>
    </> : <form onSubmit={submit}>
      <p>Create an account in one of your verified classes. The student chooses their own password.</p>
      {loading && <p role="status">Loading your assigned classes…</p>}
      {!loading && !classes.length && <p role="status">No classes are available. Ask an administrator to check your assignments.</p>}
      <fieldset disabled={busy || loading || !classes.length}>
        <label>Student full name<input autoComplete="off" name="displayName" required maxLength={160} value={form.displayName} onChange={change} /></label>
        <label>Student email<input type="email" autoComplete="off" name="email" required maxLength={254} value={form.email} onChange={change} /></label>
        <label>Class<select name="classId" required value={form.classId} onChange={change}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Learning age band<select name="ageBand" required value={form.ageBand} onChange={change}><option value="">Choose an age band</option><option value="primary">Primary</option><option value="13-15">13–15</option><option value="16-18">16–18</option></select></label>
        <button className="gh-btn gh-btn-primary" type="submit">{busy ? 'Creating student…' : 'Create student account'}</button>
      </fieldset>
      <button className="gh-btn gh-btn-ghost" type="button" disabled={busy} onClick={onClose}>Cancel</button>
    </form>}
    {error && <p role="alert">{error}</p>}
  </dialog>;
}

export function StudentSetupLink({ learnerUid }) {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  return <section className="cw-feedback">
    <h3>Student setup</h3>
    <p className="cw-muted">For an account whose password has not been set yet. Share the setup link privately with the student or their parent.</p>
    <button className="gh-btn gh-btn-ghost" disabled={busy} onClick={async () => {
      setBusy(true); setError(''); setLink('');
      try {
        const result = await schoolRequest('POST', `/api/coach/students/${encodeURIComponent(learnerUid)}/setup-link`, { body:{} });
        setLink(result.setupLink);
      } catch (err) { setError(err.message || 'A setup link could not be generated.'); }
      finally { setBusy(false); }
    }}>{busy ? 'Preparing link…' : 'Get private setup link'}</button>
    {link && <><p role="status">No email has been sent.</p><label>Private setup link<input className="gh-input" readOnly value={link} onFocus={e => e.target.select()} /></label></>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
