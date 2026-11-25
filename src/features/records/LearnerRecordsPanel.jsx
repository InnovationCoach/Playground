import { useEffect, useMemo, useState } from 'react';
import { Download, Upload, Check, Undo2, Users, Trash2 } from 'lucide-react';
import {
  RECORD_TYPES, TYPE_LABEL, STATUS_LABEL, ACCEPT_ATTR, validateUpload, formatBytes, filterRecords,
  listRecords, listLearners, uploadRecord, reviewRecord, markShared, withdrawRecord, downloadRecord
} from './learnerRecords.js';
import '../admin/pilot/pilot.css';
import './learnerRecords.css';

const STATUS_CLASS = { submitted: 'pending', approved: 'approved', returned: 'rejected' };
const EMPTY_FORM = { learnerUid: '', type: 'portfolio', title: '', term: '', note: '', file: null };
const when = (iso) => (iso ? new Date(iso).toLocaleString() : '');

/**
 * Portfolios & transcripts.
 *   coach (default): upload a file for one of their learners and follow its review.
 *   admin:           review every upload, download it and mark it shared with parents.
 * Supervisors see the admin view read-only (canEdit false).
 */
export function LearnerRecordsPanel({ admin = false, canEdit = false }) {
  const [version, setVersion] = useState(0);
  const [data, setData] = useState({ items: [], loading: true, error: '' });
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setData((d) => ({ ...d, loading: true, error: '' }));
    listRecords()
      .then((items) => { if (active) setData({ items, loading: false, error: '' }); })
      .catch((e) => { if (active) setData({ items: [], loading: false, error: e.message || 'Files could not be loaded.' }); });
    return () => { active = false; };
  }, [version]);

  const refresh = () => setVersion((n) => n + 1);

  async function run(action, success, { reload = true } = {}) {
    setBusy(true); setMessage(null);
    try {
      await action();
      if (success) setMessage({ kind: 'info', text: success });
      if (reload) refresh();
      return true;
    } catch (e) {
      setMessage({ kind: 'error', text: e.message || 'Something went wrong. Please try again.' });
      return false;
    } finally { setBusy(false); }
  }

  return (
    <section className="pilot lr">
      <div className="pilot-header">
        <div>
          <h1>{admin ? 'Portfolios & transcripts' : 'Upload portfolios & transcripts'}</h1>
          <p className="gh-sub">
            {admin
              ? 'Files coaches upload for their learners. Review each one, download it and share it with the family.'
              : 'Upload a learner’s portfolio, transcript or report. The admin team reviews it and shares it with the family.'}
          </p>
        </div>
        <div className="gh-actions">
          <button className="gh-btn" onClick={refresh} disabled={data.loading}>Refresh</button>
        </div>
      </div>

      {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={`gh-alert gh-alert-${message.kind === 'error' ? 'error' : 'info'}`}>{message.text}</p>}

      {!admin && <UploadForm busy={busy} onUpload={(form) => run(() => uploadRecord(form), 'File sent to the admin team for review.')} />}

      {data.loading && !data.items.length && <div role="status" className="gh-table-state"><p>Loading files…</p></div>}
      {!data.loading && data.error && <p role="alert" className="gh-alert gh-alert-error">{data.error}</p>}
      {!data.error && (data.items.length || !data.loading) && (admin
        ? <AdminList items={data.items} busy={busy} canEdit={canEdit} run={run} />
        : <CoachList items={data.items} busy={busy} run={run} />)}
    </section>
  );
}

function UploadForm({ busy, onUpload }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [learners, setLearners] = useState({ items: [], loading: true, error: '' });
  const [error, setError] = useState('');
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    let active = true;
    listLearners()
      .then((items) => { if (active) setLearners({ items: [...items].sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '')), loading: false, error: '' }); })
      .catch((e) => { if (active) setLearners({ items: [], loading: false, error: e.message || 'Your learners could not be loaded.' }); });
    return () => { active = false; };
  }, []);

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setError(''); };

  async function submit(e) {
    e.preventDefault();
    const problem = validateUpload(form);
    if (problem) { setError(problem); return; }
    if (await onUpload(form)) { setForm(EMPTY_FORM); setInputKey((k) => k + 1); }
  }

  return (
    <form className="gh-card lr-form" onSubmit={submit} noValidate>
      <div className="gh-card-head"><h3>New file</h3></div>
      {learners.error && <p role="alert" className="gh-alert gh-alert-error">{learners.error}</p>}
      <div className="lr-grid">
        <label className="gh-label">
          Learner
          <select className="gh-input" value={form.learnerUid} onChange={(e) => set({ learnerUid: e.target.value })} disabled={learners.loading}>
            <option value="">{learners.loading ? 'Loading learners…' : learners.items.length ? 'Choose a learner' : 'No learners in your classes'}</option>
            {learners.items.map((l) => <option key={l.id} value={l.id}>{l.displayName || l.email || l.id}</option>)}
          </select>
        </label>
        <label className="gh-label">
          Kind of file
          <select className="gh-input" value={form.type} onChange={(e) => set({ type: e.target.value })}>
            {RECORD_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </label>
        <label className="gh-label">
          Title
          <input className="gh-input" maxLength={120} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Term 1 project portfolio" />
        </label>
        <label className="gh-label">
          Term (optional)
          <input className="gh-input" maxLength={40} value={form.term} onChange={(e) => set({ term: e.target.value })} placeholder="e.g. Term 1 2026–27" />
        </label>
        <label className="gh-label lr-span">
          Note for the admin team (optional)
          <textarea className="gh-input" maxLength={500} value={form.note} onChange={(e) => set({ note: e.target.value })} />
        </label>
        <label className="gh-label lr-span">
          File (PDF, Word, PNG or JPG, up to 5 MB)
          <input key={inputKey} className="gh-input" type="file" accept={ACCEPT_ATTR} onChange={(e) => set({ file: e.target.files?.[0] || null })} />
        </label>
      </div>
      {error && <p role="alert" className="gh-alert gh-alert-error">{error}</p>}
      <div className="lr-foot">
        <button className="gh-btn gh-btn-primary" disabled={busy}><Upload size={16} aria-hidden="true" /> {busy ? 'Uploading…' : 'Upload for review'}</button>
      </div>
    </form>
  );
}

function RecordMeta({ r }) {
  return (
    <p className="lr-meta">
      {TYPE_LABEL[r.type] || r.type}{r.term ? ` · ${r.term}` : ''} · {r.fileName} {r.size ? `(${formatBytes(r.size)})` : ''}
    </p>
  );
}

function CoachList({ items, busy, run }) {
  if (!items.length) return <div className="gh-table-state"><p>You have not uploaded any files yet.</p></div>;
  return (
    <div className="lr-list">
      <h2 className="lr-h2">Your uploads</h2>
      {items.map((r) => (
        <article className="gh-card lr-item" key={r.id}>
          <div className="lr-item-head">
            <div>
              <h3>{r.learnerName} · {r.title}</h3>
              <RecordMeta r={r} />
            </div>
            <span className={`pilot-status ${STATUS_CLASS[r.status] || ''}`}>{STATUS_LABEL[r.status] || r.status}</span>
          </div>
          {r.response && <p className="lr-response">Admin: {r.response}</p>}
          <div className="lr-item-foot">
            <small className="gh-muted">Uploaded {when(r.createdAt)}{r.sharedWithParents ? ' · Shared with parents' : ''}</small>
            {r.status === 'submitted' && (
              <button className="gh-btn gh-btn-sm" disabled={busy} onClick={() => window.confirm(`Withdraw “${r.title}”? The file is removed.`) && run(() => withdrawRecord(r.id), 'Upload withdrawn.')}>
                <Trash2 size={14} aria-hidden="true" /> Withdraw
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function AdminList({ items, busy, canEdit, run }) {
  const [filters, setFilters] = useState({ status: 'all', type: 'all', q: '' });
  const [decision, setDecision] = useState(null);
  const shown = useMemo(() => filterRecords(items, filters), [items, filters]);
  const counts = useMemo(() => Object.fromEntries(Object.keys(STATUS_LABEL).map((s) => [s, items.filter((r) => r.status === s).length])), [items]);

  async function download(r) {
    await run(() => downloadRecord(r.id), null, { reload: false });
  }

  return (
    <>
      <div className="pilot-summary-strip lr-strip">
        <strong>{counts.submitted} awaiting review</strong>
        <span>{counts.approved} approved</span>
        <span>{items.filter((r) => r.sharedWithParents).length} shared with parents</span>
      </div>

      <div className="lr-filters">
        <label className="gh-label">Status
          <select className="gh-input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="all">All</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="gh-label">Kind
          <select className="gh-input" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="all">All</option>
            {RECORD_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </label>
        <label className="gh-label lr-search">Search
          <input className="gh-input" type="search" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Learner, coach or title" />
        </label>
      </div>

      {!shown.length && <div className="gh-table-state"><p>{items.length ? 'No files match these filters.' : 'No files uploaded yet.'}</p></div>}

      <div className="lr-list">
        {shown.map((r) => (
          <article className="gh-card lr-item" key={r.id}>
            <div className="lr-item-head">
              <div>
                <h3>{r.learnerName} · {r.title}</h3>
                <RecordMeta r={r} />
                <p className="lr-meta">Uploaded by {r.coachName || 'a coach'} · {when(r.createdAt)}</p>
              </div>
              <span className={`pilot-status ${STATUS_CLASS[r.status] || ''}`}>{STATUS_LABEL[r.status] || r.status}</span>
            </div>
            {r.note && <p className="lr-note">Coach’s note: {r.note}</p>}
            {r.response && <p className="lr-response">Your response: {r.response}</p>}
            <div className="lr-item-foot">
              <small className="gh-muted">
                {r.sharedWithParents ? <><Users size={13} aria-hidden="true" /> Shared with parents {when(r.sharedAt)}</> : r.updatedBy ? `Reviewed by ${r.updatedBy.name} · ${when(r.updatedAt)}` : ''}
              </small>
              <div className="gh-btn-row">
                <button className="gh-btn gh-btn-sm" disabled={busy} onClick={() => download(r)} aria-label={`Download ${r.title} for ${r.learnerName}`}>
                  <Download size={14} aria-hidden="true" /> Download
                </button>
                {canEdit && r.status === 'submitted' && (
                  <>
                    <button className="gh-btn gh-btn-sm gh-btn-primary" disabled={busy} onClick={() => setDecision({ ...r, status: 'approved', response: '' })}><Check size={14} aria-hidden="true" /> Approve</button>
                    <button className="gh-btn gh-btn-sm" disabled={busy} onClick={() => setDecision({ ...r, status: 'returned', response: '' })}><Undo2 size={14} aria-hidden="true" /> Return to coach</button>
                  </>
                )}
                {canEdit && r.status === 'approved' && (
                  <button className="gh-btn gh-btn-sm" disabled={busy} onClick={() => run(() => markShared(r.id, !r.sharedWithParents), r.sharedWithParents ? 'Marked as not shared.' : 'Marked as shared with parents.')}>
                    <Users size={14} aria-hidden="true" /> {r.sharedWithParents ? 'Undo shared' : 'Mark shared with parents'}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {decision && (
        <div className="pilot-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDecision(null); }}>
          <form className="pilot-modal" onSubmit={async (e) => {
            e.preventDefault();
            if (decision.status === 'returned' && !decision.response.trim()) return;
            if (await run(() => reviewRecord(decision.id, decision), decision.status === 'approved' ? 'Approved. Download it to share with the family.' : 'Returned to the coach with your note.')) setDecision(null);
          }}>
            <h2>{decision.status === 'approved' ? 'Approve' : 'Return'} “{decision.title}” for {decision.learnerName}</h2>
            <label className="gh-label">
              {decision.status === 'returned' ? 'What should the coach change?' : 'Note for the coach (optional)'}
              <textarea className="gh-input" maxLength={500} required={decision.status === 'returned'} value={decision.response} onChange={(e) => setDecision({ ...decision, response: e.target.value })} />
            </label>
            <div className="pilot-modal-foot">
              <button type="button" className="gh-btn" disabled={busy} onClick={() => setDecision(null)}>Cancel</button>
              <button className="gh-btn gh-btn-primary" disabled={busy || (decision.status === 'returned' && !decision.response.trim())}>{decision.status === 'approved' ? 'Approve' : 'Return to coach'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
