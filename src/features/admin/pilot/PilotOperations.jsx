import { useEffect, useState } from 'react';
import { schoolRequest } from '../../../services/api/apiClient.js';
import './pilot.css';

const request = (method, path, options) => schoolRequest(method, `/api/pilot${path}`, options);
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

function useRecords(path, version) {
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  useEffect(() => {
    let active = true;
    setState({ items: [], loading: true, error: '' });
    const refresh = () => request('GET', path).then(data => {
      if (active) setState({ items: data.items, loading: false, error: '' });
    }).catch(e => {
      if (active) setState({ items: [], loading: false, error: e.message });
    });
    refresh();
    const timer = path === '/leave' ? setInterval(refresh, 30000) : null;
    return () => { active = false; if (timer) clearInterval(timer); };
  }, [path, version]);
  return state;
}

function Notice({ data }) {
  if (data.loading) {
    return <div role="status" className="gh-table-state"><p>Loading records…</p></div>;
  }
  if (data.error) {
    return <p role="alert" className="gh-alert gh-alert-error" style={{ margin: '1rem 0' }}>{data.error}</p>;
  }
  if (!data.items.length) {
    return <div className="gh-table-state"><p>No records yet.</p></div>;
  }
  return null;
}

function History({ path, onClose }) {
  const data = useRecords(path, 0);
  return (
    <div className="pilot-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="pilot-modal" aria-label="Change history">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Change history</h3>
          <button className="gh-btn gh-btn-sm" onClick={onClose}>Close history</button>
        </div>
        <Notice data={data} />
        <div className="pilot-history-list">
          {data.items.map(r => (
            <div className="pilot-history-item" key={r.id}>
              <strong>{r.after?.status || `Stock adjustment: ${r.change > 0 ? '+' : ''}${r.change}`}</strong>
              <div style={{ margin: '0.25rem 0' }}>{r.reason}</div>
              <div className="pilot-history-meta">{r.updatedBy?.name} · {new Date(r.updatedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const STATUSES = ['present', 'late', 'excused', 'absent', 'unmarked'];
const STATUS_LABEL = { present: 'Present', late: 'Late', excused: 'Excused', absent: 'Absent', unmarked: 'Unmarked' };
const REASON_SUGGESTIONS = ['Register taken', 'Arrived late', 'Called in sick', 'Approved leave', 'Corrected after class'];

const initials = name => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');

function lastSignIn(iso) {
  if (!iso) return 'Never signed in';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'Last sign-in today';
  if (days === 1) return 'Last sign-in yesterday';
  if (days < 30) return `Last sign-in ${days} days ago`;
  return `Last sign-in ${new Date(iso).toLocaleDateString()}`;
}

/** Plain rules over today's counts. These are suggestions, not an AI model. */
function attendanceInsights(items, counts) {
  if (!items.length) return [];
  const out = [];
  if (counts.unmarked) {
    out.push({ tone: 'warn', text: `${counts.unmarked} of ${items.length} still unmarked. Mark the register to complete the day.` });
  }
  if (counts.absent) {
    const withoutNote = items.filter(r => r.status === 'absent' && !r.note).length;
    out.push({ tone: 'alert', text: `${counts.absent} absent${withoutNote ? `, ${withoutNote} without a note` : ''}. A short note helps follow-up with families and staff.` });
  }
  const marked = items.length - counts.unmarked;
  if (marked && !counts.unmarked && !counts.absent) {
    out.push({ tone: 'good', text: 'Everyone is marked and nobody is absent. Nothing needs attention today.' });
  }
  return out;
}

export function AttendancePanel({ kind, canEdit }) {
  const [date, setDate] = useState(today);
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editor, setEditor] = useState(null);
  const [history, setHistory] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const data = useRecords(`/attendance?kind=${kind}&date=${date}`, version);
  const isStaff = kind === 'staff';

  async function save(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      await request('PUT', `/attendance/${encodeURIComponent(editor.uid)}`, {
        body: { date, status: editor.status, note: editor.note, reason: editor.reason }
      });
      setEditor(null);
      setVersion(n => n + 1);
      setMessage(`Saved ${editor.name}: ${STATUS_LABEL[editor.status].toLowerCase()}.`);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  const counts = Object.fromEntries(STATUSES.map(s => [s, data.items.filter(r => r.status === s).length]));
  const total = data.items.length;
  const marked = total - counts.unmarked;
  const rate = marked ? Math.round(((counts.present + counts.late + counts.excused) / marked) * 100) : null;
  const query = search.trim().toLowerCase();
  const filtered = data.items.filter(r =>
    (filter === 'all' || r.status === filter) &&
    `${r.name} ${r.email || ''} ${r.publicId || ''}`.toLowerCase().includes(query)
  );
  const insights = attendanceInsights(data.items, counts);
  const isToday = date === today();

  return (
    <div className="pilot">
      <header className="pilot-header">
        <div>
          <p className="pilot-eyebrow">Operations · Attendance</p>
          <h1>{isStaff ? 'Staff' : 'Student'} attendance</h1>
          <p className="gh-sub">
            {isToday ? 'Today' : new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            {' '}· school time, Bangkok
          </p>
        </div>
        <div className="pilot-header-actions">
          <label className="pilot-date">
            <span className="sr-only">Attendance date</span>
            <input className="gh-input" type="date" required value={date} onChange={e => {
              if (e.target.value) { setDate(e.target.value); setEditor(null); setHistory(null); setFilter('all'); }
            }} />
          </label>
          {!isToday && <button className="gh-btn" onClick={() => setDate(today())}>Today</button>}
          <button className="gh-btn" onClick={() => setVersion(n => n + 1)}>Refresh</button>
        </div>
      </header>

      <section className="pilot-att-hero" aria-label="Attendance overview">
        <div className="pilot-rate">
          <span className={`pilot-rate-value ${rate === null ? 'is-empty' : ''}`}>{rate === null ? 'Not started' : `${rate}%`}</span>
          <span className="pilot-rate-label">attendance rate</span>
          <span className="pilot-rate-note">{marked ? `${marked} of ${total} marked` : 'Nobody marked yet'}</span>
        </div>
        <div className="pilot-kpis" role="group" aria-label="Filter by status">
          <button type="button" className={`pilot-kpi all ${filter === 'all' ? 'is-active' : ''}`} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            <span className="pilot-kpi-num">{total}</span>
            <span className="pilot-kpi-label">Everyone</span>
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              type="button"
              className={`pilot-kpi ${s} ${filter === s ? 'is-active' : ''}`}
              aria-pressed={filter === s}
              onClick={() => setFilter(filter === s ? 'all' : s)}
            >
              <span className="pilot-kpi-num">{counts[s]}</span>
              <span className="pilot-kpi-label">{STATUS_LABEL[s]}</span>
              <span className="pilot-kpi-bar" aria-hidden="true"><span style={{ width: total ? `${(counts[s] / total) * 100}%` : '0%' }} /></span>
            </button>
          ))}
        </div>
      </section>

      {insights.length > 0 && (
        <section className="pilot-insights" aria-label="Suggested next steps">
          <h2 className="pilot-insights-title">Suggested next steps</h2>
          <ul>
            {insights.map(i => <li key={i.text} className={`pilot-insight ${i.tone}`}>{i.text}</li>)}
          </ul>
        </section>
      )}

      {message && <p role="status" className="gh-alert gh-alert-info">{message}</p>}
      <Notice data={data} />

      {editor && (
        <div className="pilot-modal-overlay" onKeyDown={e => { if (e.key === 'Escape' && !busy) setEditor(null); }}>
          <form className="pilot-modal pilot-edit" role="dialog" aria-modal="true" aria-labelledby="pilot-edit-title" onSubmit={save}>
            <div className="pilot-edit-head">
              <span className="pilot-avatar" aria-hidden="true">{initials(editor.name)}</span>
              <div>
                <h2 id="pilot-edit-title">{editor.name}</h2>
                <p className="gh-muted">{new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
            <fieldset className="pilot-seg-field">
              <legend>Status</legend>
              <div className="pilot-seg" role="radiogroup">
                {STATUSES.map(s => (
                  <label key={s} className={`pilot-seg-option ${s} ${editor.status === s ? 'is-selected' : ''}`}>
                    <input type="radio" name="status" value={s} checked={editor.status === s} onChange={() => setEditor({ ...editor, status: s })} />
                    {STATUS_LABEL[s]}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="gh-label">
              Note <span className="gh-muted">(optional)</span>
              <input className="gh-input" maxLength={500} value={editor.note || ''} onChange={e => setEditor({ ...editor, note: e.target.value })} />
            </label>
            <label className="gh-label">
              Reason for this change
              <input className="gh-input" required maxLength={500} value={editor.reason || ''} onChange={e => setEditor({ ...editor, reason: e.target.value })} />
            </label>
            <div className="pilot-chips" aria-label="Suggested reasons">
              {REASON_SUGGESTIONS.map(s => (
                <button key={s} type="button" className="pilot-chip" onClick={() => setEditor({ ...editor, reason: s })}>{s}</button>
              ))}
            </div>
            <div className="pilot-modal-foot">
              <button type="button" className="gh-btn" disabled={busy} onClick={() => setEditor(null)}>Cancel</button>
              <button className="gh-btn gh-btn-primary" disabled={busy || !editor.reason?.trim()}>Save attendance</button>
            </div>
          </form>
        </div>
      )}

      {history && <History key={history} path={history} onClose={() => setHistory(null)} />}

      <div className="gh-table-card pilot-att-card">
        <div className="gh-toolbar">
          <div className="gh-grow gh-input-icon">
            <input className="gh-input" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search names, emails or IDs" aria-label="Search people" />
          </div>
          <span className="gh-muted pilot-count">{filtered.length} shown</span>
        </div>
        {!data.loading && !data.error && data.items.length > 0 && filtered.length === 0 && (
          <div className="gh-table-state"><p>No one matches this filter.</p></div>
        )}
        <div className="gh-table-wrap">
          <table className="gh-table pilot-att-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Login</th>
                <th>Status</th>
                <th>Note</th>
                <th>Last updated</th>
                <th className="gh-cell-end"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.uid} className="gh-row">
                  <td data-label="Person">
                    <div className="pilot-person">
                      <span className="pilot-avatar" aria-hidden="true">{initials(r.name)}</span>
                      <div>
                        <strong>{r.name}</strong>
                        {r.publicId && <div className="gh-muted gh-mono">{r.publicId}</div>}
                      </div>
                    </div>
                  </td>
                  <td data-label="Login">
                    <div className="pilot-email">{r.email || '—'}</div>
                    <div className={`gh-muted ${r.accountDisabled ? 'pilot-suspended' : ''}`}
                         title={r.lastSignInAt ? new Date(r.lastSignInAt).toLocaleString() : undefined}>
                      {r.accountDisabled ? 'Account suspended' : lastSignIn(r.lastSignInAt)}
                    </div>
                  </td>
                  <td data-label="Status"><span className={`pilot-status ${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span></td>
                  <td data-label="Note" className="gh-muted">{r.note || '—'}</td>
                  <td data-label="Last updated" className="gh-muted">
                    {r.updatedAt ? <>{new Date(r.updatedAt).toLocaleString()}<div>{r.updatedBy?.name || ''}</div></> : '—'}
                  </td>
                  <td className="gh-cell-end pilot-row-actions">
                    <div className="gh-btn-row" style={{ justifyContent: 'flex-end' }}>
                      {canEdit && (
                        <button className="gh-btn gh-btn-sm" disabled={busy} aria-label={`Edit attendance for ${r.name}`} onClick={() => { setEditor({ ...r, reason: '' }); setMessage(''); }}>Edit</button>
                      )}
                      <button className="gh-btn gh-btn-sm" aria-label={`Change history for ${r.name}`} onClick={() => setHistory(`/attendance/${encodeURIComponent(r.uid)}/history?date=${date}`)}>History</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function LeavePanel({ admin = false, canEdit = false }) {
  const [version, setVersion] = useState(0);
  const data = useRecords('/leave', version);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ startDate: today(), endDate: today(), reason: '' });
  const [decision, setDecision] = useState(null);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      if (admin) await request('PATCH', `/leave/${decision.id}`, { body: { status: decision.status, response: decision.response } });
      else await request('POST', '/leave', { body: form });
      setMessage(admin ? 'Decision saved. The coach can see it on their dashboard.' : 'Day-off request sent to the admin dashboard.');
      setDecision(null); setForm({ startDate: today(), endDate: today(), reason: '' }); setVersion(n => n + 1);
    } catch(err) { setMessage(err.message); } finally { setBusy(false); }
  }

  const pendingCount = data.items.filter(r => r.status === 'pending').length;

  return (
    <section className="pilot">
      <div className="pilot-header">
        <div>
          <h1>{admin ? 'Coach day-off requests' : 'Request a day off'}</h1>
          <p className="gh-sub">{admin ? 'Review incoming requests. Approval does not automatically change attendance.' : 'Send your request to the admin team and track their response here.'}</p>
        </div>
        <div className="gh-actions">
          <button className="gh-btn" onClick={() => setVersion(n => n + 1)}>Refresh requests</button>
        </div>
      </div>

      {message && <p role="status" className="gh-alert gh-alert-info">{message}</p>}

      {!admin && (
        <form className="gh-card" style={{ maxWidth: 680, marginBottom: '1.5rem' }} onSubmit={submit}>
          <div className="gh-card-head">
            <h3>New Day-off Request</h3>
          </div>
          <div className="gh-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="gh-label">
              First day
              <input className="gh-input" required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </label>
            <label className="gh-label">
              Last day
              <input className="gh-input" required type="date" min={form.startDate} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </label>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="gh-label">
                Reason
                <textarea className="gh-input" required maxLength={1000} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for request..." />
              </label>
            </div>
          </div>
          <div className="gh-form-foot" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="gh-btn gh-btn-primary" disabled={busy}>Send request</button>
          </div>
        </form>
      )}

      {decision && (
        <div className="pilot-modal-overlay">
          <form className="pilot-modal" onSubmit={submit}>
            <h2>{decision.status === 'approved' ? 'Approve' : 'Reject'} request from {decision.name}</h2>
            <label className="gh-label">
              Response (optional)
              <textarea className="gh-input" maxLength={500} value={decision.response || ''} onChange={e => setDecision({ ...decision, response: e.target.value })} placeholder="Optional response note..." />
            </label>
            <div className="pilot-modal-foot">
              <button type="button" className="gh-btn" disabled={busy} onClick={() => setDecision(null)}>Cancel</button>
              <button className="gh-btn gh-btn-primary" disabled={busy}>Confirm decision</button>
            </div>
          </form>
        </div>
      )}

      <Notice data={data} />
      {admin && (
        <div className="pilot-summary-strip" style={{ marginBottom: '1rem' }}>
          <strong>{pendingCount} pending requests</strong>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {data.items.map(r => (
          <article className="gh-card" key={r.id}>
            <div className="gh-card-head" style={{ marginBottom: '0.5rem' }}>
              <div>
                <h3>{admin ? r.name : 'Your request'} · {r.startDate} → {r.endDate}</h3>
                <span className={`pilot-status ${r.status}`} style={{ marginTop: 4 }}>{r.status}</span>
              </div>
              {admin && canEdit && r.status === 'pending' && (
                <div className="gh-btn-row">
                  <button className="gh-btn gh-btn-sm gh-btn-primary" disabled={busy} onClick={() => setDecision({ ...r, status: 'approved', response: '' })}>Approve</button>
                  <button className="gh-btn gh-btn-sm gh-btn-danger" disabled={busy} onClick={() => setDecision({ ...r, status: 'rejected', response: '' })}>Reject</button>
                </div>
              )}
            </div>
            <p style={{ margin: '0.4rem 0', color: 'var(--gh-text)' }}>{r.reason}</p>
            {r.response && <p style={{ margin: '0.4rem 0', color: 'var(--gh-text-2)', fontSize: '0.88rem' }}>Admin response: {r.response}</p>}
            {r.status !== 'pending' && (
              <small className="gh-muted">Reviewed by {r.updatedBy?.name} · {new Date(r.updatedAt).toLocaleString()}</small>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function InventoryPanel({ canEdit }) {
  const [version, setVersion] = useState(0);
  const data = useRecords('/inventory', version);
  const [form, setForm] = useState(null);
  const [history, setHistory] = useState(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      await request(form.id ? 'PATCH' : 'POST', form.id ? `/inventory/${form.id}` : '/inventory', {
        body: form.id
          ? { change: Number(form.change), reason: form.reason }
          : { name: form.name, location: form.location, quantity: Number(form.quantity), minimum: Number(form.minimum) }
      });
      setForm(null); setVersion(n => n + 1); setHistory(null); setMessage('Inventory saved.');
    } catch(err) { setMessage(err.message); } finally { setBusy(false); }
  }

  const filtered = data.items.filter(r => `${r.name} ${r.location}`.toLowerCase().includes(search.toLowerCase()));
  const lowCount = data.items.filter(r => r.quantity <= r.minimum).length;

  return (
    <section className="pilot">
      <div className="pilot-header">
        <div>
          <h1>Inventory management</h1>
          <p className="gh-sub">Track available stock, storage locations, and stock movements.</p>
        </div>
        <div className="gh-actions">
          {canEdit && (
            <button className="gh-btn gh-btn-primary" disabled={busy} onClick={() => setForm({ name: '', location: '', quantity: 0, minimum: 0 })}>Add item</button>
          )}
          <button className="gh-btn" onClick={() => setVersion(n => n + 1)}>Refresh</button>
        </div>
      </div>

      <div className="pilot-summary-strip">
        <span>{data.items.length} items</span> · <span>{lowCount} at or below minimum stock</span>
      </div>

      {message && <p role="status" className="gh-alert gh-alert-info">{message}</p>}
      <Notice data={data} />

      {form && (
        <div className="pilot-modal-overlay">
          <form className="pilot-modal" onSubmit={save}>
            <h2>{form.id ? `Adjust stock: ${form.name}` : 'Add inventory item'}</h2>
            {form.id ? (
              <>
                <label className="gh-label">
                  Stock change (use a negative number to remove)
                  <input className="gh-input" type="number" required step="1" value={form.change || ''} onChange={e => setForm({ ...form, change: e.target.value })} />
                </label>
                <label className="gh-label">
                  Reason
                  <input className="gh-input" required maxLength={500} value={form.reason || ''} onChange={e => setForm({ ...form, reason: e.target.value })} />
                </label>
              </>
            ) : (
              <>
                <label className="gh-label">
                  Item name
                  <input className="gh-input" required maxLength={120} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                </label>
                <label className="gh-label">
                  Location
                  <input className="gh-input" maxLength={120} value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label className="gh-label">
                    Opening stock
                    <input className="gh-input" type="number" min="0" step="1" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                  </label>
                  <label className="gh-label">
                    Minimum stock
                    <input className="gh-input" type="number" min="0" step="1" required value={form.minimum} onChange={e => setForm({ ...form, minimum: e.target.value })} />
                  </label>
                </div>
              </>
            )}
            <div className="pilot-modal-foot">
              <button type="button" className="gh-btn" disabled={busy} onClick={() => setForm(null)}>Cancel</button>
              <button className="gh-btn gh-btn-primary" disabled={busy}>Save inventory</button>
            </div>
          </form>
        </div>
      )}

      {history && <History key={history} path={history} onClose={() => setHistory(null)} />}

      <div className="gh-table-card">
        <div className="gh-toolbar">
          <div className="gh-grow gh-input-icon">
            <input className="gh-input" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory" />
          </div>
        </div>
        <div className="gh-table-wrap">
          <table className="gh-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Location</th>
                <th>Stock</th>
                <th>Minimum</th>
                <th className="gh-cell-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="gh-row">
                  <td><strong>{r.name}</strong></td>
                  <td className="gh-muted">{r.location || '—'}</td>
                  <td>
                    {r.quantity}
                    {r.quantity <= r.minimum && <span className="pilot-status late" style={{ marginLeft: 8 }}>Low stock</span>}
                  </td>
                  <td>{r.minimum}</td>
                  <td className="gh-cell-end">
                    <div className="gh-btn-row" style={{ justifyContent: 'flex-end' }}>
                      {canEdit && (
                        <button className="gh-btn gh-btn-sm" disabled={busy} onClick={() => setForm({ ...r, change: '', reason: '' })}>Adjust stock</button>
                      )}
                      <button className="gh-btn gh-btn-sm" onClick={() => setHistory(`/inventory/${r.id}/history`)}>History</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function PilotHome() {
  const [version, setVersion] = useState(0);
  const staff = useRecords(`/attendance?kind=staff&date=${today()}`, version);
  const students = useRecords(`/attendance?kind=students&date=${today()}`, version);
  const leave = useRecords('/leave', version);
  const stock = useRecords('/inventory', version);

  const attendanceSummary = data => `${data.items.filter(r => r.status === 'present').length} present · ${data.items.filter(r => r.status === 'unmarked').length} unmarked`;

  return (
    <section className="pilot">
      <div className="pilot-header">
        <div>
          <div className="pilot-eyebrow">Operations Overview · {today()}</div>
          <h1>Admin dashboard</h1>
          <p className="gh-sub">Daily attendance, coach requests, and inventory in one place.</p>
        </div>
        <div className="gh-actions">
          <button className="gh-btn" onClick={() => setVersion(n => n + 1)}>Refresh dashboard</button>
        </div>
      </div>

      <div className="pilot-cards">
        {[
          ['staff-attendance', 'Staff attendance', staff, attendanceSummary(staff)],
          ['student-attendance', 'Student attendance', students, attendanceSummary(students)],
          ['leave', 'Day-off requests', leave, `${leave.items.filter(r => r.status === 'pending').length} awaiting review`],
          ['inventory', 'Inventory management', stock, `${stock.items.length} items · ${stock.items.filter(r => r.quantity <= r.minimum).length} low stock`]
        ].map(([page, title, data, summary]) => (
          <a className="pilot-card" key={page} href={`#/admin/${page}`}>
            <div>
              <h2>{title}</h2>
              {data.loading ? (
                <p>Loading…</p>
              ) : data.error ? (
                <p role="alert" style={{ color: 'var(--gh-red)' }}>{data.error}</p>
              ) : (
                <p>{summary}</p>
              )}
            </div>
            <div className="pilot-card-cta">
              Open <span>→</span>
            </div>
          </a>
        ))}
      </div>
      <p className="gh-muted" style={{ fontSize: '0.85rem' }}>Day-off requests refresh every 30 seconds while this dashboard is open.</p>
    </section>
  );
}
