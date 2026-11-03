import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Check, RotateCcw, RefreshCw, MessageSquare, AlertTriangle } from 'lucide-react';
import * as firebase from '../../../firebase.js';
import { API_BASE } from '../../../services/apiBase.js';
import { PUBLISHED_RELEASES } from '../../../../shared/universe/index.js';
import { createDefaultUniverseClient, describeFailure, newIdempotencyKey, scopeKey } from '../../universe/pilot/universeClient.js';
import { findPilotMission } from '../../universe/pilot/missionSession.js';
import { EvidenceView } from '../../universe/pilot/NotebookParts.jsx';
import { formatTime, outcomeText, isScopeFailure } from '../../universe/pilot/PilotMissionSheet.jsx';
import './coachUniverse.css';

let productionClient = null;
const defaultClient = () => (productionClient ||= createDefaultUniverseClient({ auth: firebase.auth, baseUrl: API_BASE }));
const TABS = [['submitted', 'Waiting for review'], ['returned', 'Returned for revision'], ['approved', 'Reviewed']];
const AVAIL = { open: 'Mission open', 'in-review': 'Mission in review', withdrawn: 'Mission paused for a correction', retired: 'Mission retired', unknown: 'Mission status unknown' };

/**
 * Coach queue for My Universe mission work (contract 0.1.1). The list shows exactly
 * what the service returns for this coach's organization and classes; a failure is
 * never shown as an empty queue. A review records feedback. It does not grade
 * mastery or open planets: the server returns the outcome and the screen shows it.
 */
export function CoachUniverseSubmissions({ coachUser, orgId = null, client: given, registry = PUBLISHED_RELEASES }) {
  // One coach in one verified organization. The queue is keyed by that scope, so changing account
  // or organization unmounts the old queue (items, notes, pending replies) in the same render.
  const key = scopeKey({ uid: coachUser?.uid, orgId });
  const base = given || defaultClient();
  const client = useMemo(() => (key ? base.withScope({ uid: coachUser.uid, orgId }) : null), [base, key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!client) return <Frame><p className="coach-universe-empty" role="status">Mission reviews open once your school account is confirmed. Nothing has been loaded.</p></Frame>;
  return <Queue key={key} coachUid={coachUser.uid} client={client} registry={registry} />;
}

function Queue({ coachUid, client, registry }) {
  const [tab, setTab] = useState('submitted');
  const [list, setList] = useState({ state: 'loading', items: [], nextCursor: null });
  const alive = useRef(true), generation = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = useCallback(async (cursor) => {
    // Each first-page load (tab change, refresh, conflict) starts a new generation; replies from older ones are ignored.
    const gen = cursor ? generation.current : ++generation.current;
    setList((l) => ({ ...l, state: cursor ? 'more' : 'loading', ...(cursor ? {} : { items: [], nextCursor: null }) }));
    const res = await client.coachQueue({ status: tab, limit: 20, cursor });
    if (!alive.current || gen !== generation.current) return;
    if (res.state === 'loaded') setList((l) => ({ state: 'loaded', items: cursor ? [...l.items, ...res.data.submissions] : res.data.submissions, nextCursor: res.data.nextCursor || null }));
    else setList((l) => (isScopeFailure(res) ? { state: 'error', result: res, items: [], nextCursor: null } : { ...l, state: 'error', result: res }));
  }, [client, tab]);
  useEffect(() => { load(); }, [load]);

  const replace = (submissionId, next) => setList((l) => ({ ...l, items: l.items.map((s) => (s.submissionId === submissionId ? next : s)) }));
  // A review answer that says this coach may no longer act here clears everything this screen holds.
  const lostScope = (res) => { generation.current += 1; setList({ state: 'error', result: res, items: [], nextCursor: null }); };
  const empty = list.state === 'loaded' && !list.items.length;
  const header = <div className="coach-universe-controls">
    <div className="coach-universe-tabs" role="group" aria-label="Show submissions">
      {TABS.map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} className={`coach-tab ${tab === id ? 'is-active' : ''}`} onClick={() => setTab(id)}>{label}</button>)}
    </div>
    <button type="button" className="coach-refresh-btn" onClick={() => load()} disabled={list.state === 'loading'} aria-label="Refresh submissions">
      <RefreshCw size={15} aria-hidden="true" className={list.state === 'loading' ? 'is-spinning' : ''} />
    </button>
  </div>;

  return <Frame controls={header}>
      {list.state === 'loading' && <p className="coach-universe-empty" role="status">Loading mission submissions…</p>}
      {list.state === 'error' && <div className="coach-universe-alert is-error" role="alert"><AlertTriangle size={16} aria-hidden="true" />
        <span>The submissions couldn’t be loaded, so this isn’t an empty queue. {describeFailure(list.result)}</span>
        <button type="button" className="coach-btn" onClick={() => load()}>Try again</button></div>}
      {empty && !list.nextCursor && <p className="coach-universe-empty">
        {tab === 'submitted' ? 'No mission work is waiting for your review.' : tab === 'returned' ? 'No submissions are currently returned for revision.' : 'No reviewed submissions yet.'}</p>}
      {list.items.length === 0 && list.nextCursor && list.state !== 'error' && list.state !== 'loading' && <p className="coach-universe-empty" role="status">Nothing for your current classes so far. The list isn’t finished: load more to keep checking.</p>}
      {list.items.length > 0 && <ul className="coach-universe-list">
        {list.items.map((s) => <SubmissionCard key={s.submissionId} s={s} client={client} registry={registry} onReviewed={(next) => replace(s.submissionId, next)} onConflict={() => load()} onLostScope={lostScope} coachUid={coachUid} />)}
      </ul>}
      {list.nextCursor && list.state !== 'error' && <button type="button" className="coach-btn" disabled={list.state === 'more'} onClick={() => load(list.nextCursor)}>{list.state === 'more' ? 'Loading…' : 'Load more'}</button>}
  </Frame>;
}

function Frame({ controls = null, children }) {
  return <section className="coach-universe-card" aria-labelledby="coach-universe-heading">
    <header className="coach-universe-header">
      <div className="coach-universe-title">
        <Compass size={22} className="coach-universe-icon" aria-hidden="true" />
        <div>
          <h2 id="coach-universe-heading">My Universe · Mission Reviews</h2>
          <p className="coach-universe-subtitle">Read each learner’s mission evidence and give feedback. Approving records your review; it doesn’t grade mastery or open new planets.</p>
        </div>
      </div>
      {controls}
    </header>
    <div className="coach-universe-content">{children}</div>
  </section>;
}

function SubmissionCard({ s, client, registry, onReviewed, onConflict, onLostScope, coachUid }) {
  const [decision, setDecision] = useState('returned');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const idem = useRef({ body: null, key: null }), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const entry = findPilotMission(registry, s.missionId);
  const route = entry && entry.mission.version === s.missionVersion ? entry.mission.routes.find((r) => r.id === s.routeId) : null;
  const noteId = `coach-note-${s.submissionId}`;
  const ownWork = coachUid && s.learnerUid === coachUid;
  const noteOk = decision === 'approved' ? Array.from(note).length <= 1000 : note.trim().length >= 1 && Array.from(note).length <= 1000;

  async function review() {
    if (s.legacyFormat || s.status !== 'submitted') return; // historical records stay read-only under the pilot contract
    const body = { decision, note: note.trim(), expectedSubmissionRevision: s.submissionRevision };
    const text = JSON.stringify(body);
    if (idem.current.body !== text) idem.current = { body: text, key: newIdempotencyKey() };
    setBusy(true); setResult(null);
    const res = await client.review(s.submissionId, body, idem.current.key);
    if (!alive.current) return;
    setBusy(false);
    if (isScopeFailure(res)) { onLostScope(res); return; }
    if (res.state === 'loaded') {
      const d = res.data;
      onReviewed({ ...s, status: d.status, submissionRevision: d.submissionRevision ?? s.submissionRevision, coachNote: body.note || null, reviewedAt: d.reviewedAt ?? s.reviewedAt, outcome: d.outcome ?? null, auditEventId: d.auditEventId });
      return;
    }
    setResult(res);
    if (res.state === 'error' && res.code === 'REVIEW_CONFLICT') onConflict();
  }

  return <li className={`coach-universe-item is-${s.status}`}>
    <div className="coach-universe-item-header">
      <div className="coach-universe-item-meta">
        <span className="coach-universe-learner">{s.learnerDisplayName || 'Learner'}</span>
        <span className="coach-universe-mission">{s.missionTitle || s.missionId} · attempt {s.attemptNumber ?? '?'}</span>
      </div>
      <div className="coach-universe-item-status">
        <span className={`coach-badge is-${s.status}`}>{s.status === 'submitted' ? 'Waiting for review' : s.status === 'returned' ? 'Returned' : 'Reviewed'}</span>
      </div>
    </div>
    <p className="coach-universe-identity">Version {s.missionVersion} · {route?.name || s.routeId} ({s.taskId}) · {s.supportMode === 'independent' ? 'Independent' : 'Guided'} help · sent {formatTime(s.createdAt)}
      {s.availability?.status && <> · {AVAIL[s.availability.status] || s.availability.status}</>}{s.legacyFormat ? ' · earlier reflection-only format' : ''}</p>
    {s.previousCoachNote && <p className="coach-universe-prev"><MessageSquare size={14} aria-hidden="true" /> Your earlier feedback: “{s.previousCoachNote}”</p>}
    <div className="coach-universe-reflection"><h4>Reflection</h4><p>{s.reflection}</p></div>
    {!s.legacyFormat && <div className="coach-universe-evidence"><h4>Notebook evidence</h4><EvidenceView evidence={s.evidence} route={route} /></div>}
    {s.status !== 'submitted' && <div className="coach-universe-reviewed">
      {s.coachNote && <p><strong>Feedback:</strong> “{s.coachNote}”</p>}
      {outcomeText(s) && <p>{outcomeText(s)}</p>}
      {s.reviewedAt && <p className="coach-universe-fine">Reviewed {formatTime(s.reviewedAt)}{s.auditEventId ? ` · record ${s.auditEventId}` : ''}</p>}
    </div>}
    {s.status === 'submitted' && s.legacyFormat && <p className="coach-universe-fine coach-universe-legacy" role="note">Earlier reflection-only format: kept for reading only. It can’t be approved or returned in this pilot.</p>}
    {s.status === 'submitted' && !s.legacyFormat && (ownWork ? <p className="coach-universe-fine">You can’t review your own work.</p> : <form className="coach-universe-review-form" onSubmit={(e) => { e.preventDefault(); review(); }}>
      <fieldset className="coach-universe-decision"><legend>Decision</legend>
        <label><input type="radio" name={`d-${s.submissionId}`} checked={decision === 'returned'} onChange={() => setDecision('returned')} /><RotateCcw size={14} aria-hidden="true" /> Return for revision</label>
        <label><input type="radio" name={`d-${s.submissionId}`} checked={decision === 'approved'} onChange={() => setDecision('approved')} /><Check size={14} aria-hidden="true" /> Approve (reviewed)</label>
      </fieldset>
      <label htmlFor={noteId} className="coach-universe-note-label">{decision === 'returned' ? 'What should the learner change? (required)' : 'Feedback for the learner (optional)'}</label>
      <textarea id={noteId} className="coach-universe-note-input" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="coach-universe-actions">
        <button type="submit" className={`coach-btn ${decision === 'approved' ? 'is-approve' : 'is-return'}`} disabled={busy || !noteOk}>{busy ? 'Saving…' : decision === 'approved' ? 'Record approval' : 'Return to learner'}</button>
      </div>
      {result && <p className="coach-universe-alert is-error" role="alert">{result.state === 'error' && result.code === 'REVIEW_CONFLICT' ? 'Someone else already reviewed this attempt. The list has been refreshed.' : `Not saved. ${describeFailure(result)}`}</p>}
    </form>)}
  </li>;
}
