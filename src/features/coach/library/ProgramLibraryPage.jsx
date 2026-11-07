import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, Sparkles, UserRound } from 'lucide-react';
import { hrefFor } from '../../../app/routes.js';
import { ProgramPoster } from '../../pbl/programs/ProgramPoster.jsx';
import { explainLibraryError, filterPrograms, programFromUnit } from './programLibraryModel.js';
import { subscribeProgramLibrary } from './programLibraryService.js';
import '../../pbl/programs/programs.css';
import './programLibrary.css';

const TABS = [
  { id: 'in-progress', label: 'In Progress' },
  { id: 'published', label: 'Published' }
];

const formatDate = (ms) => (ms ? new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown');

export function statusLabel(record) {
  return record.status === 'published' ? 'Published' : 'In review';
}

function ProgramCard({ record, uid }) {
  const program = useMemo(() => {
    try {
      return programFromUnit(record.unit, record.creatorUid).view;
    } catch {
      return null;
    }
  }, [record.unit, record.creatorUid]);
  return (
    <li>
      <a className="pl-card" href={hrefFor.programPreview(record.programId, 'draft')}>
        {program && <ProgramPoster program={program} />}
        <span className="pl-card-body">
          <span className="pl-card-badges">
            <span className="pl-status" data-status={record.status}>{statusLabel(record)}</span>
            {record.hasUnpublishedChanges && <span className="pl-pending">Unpublished changes</span>}
          </span>
          <span className="pl-card-title">{record.title}</span>
          <span className="pl-card-desc">{record.description}</span>
          <span className="pl-card-meta">
            <span><UserRound size={13} aria-hidden="true" />{record.creatorUid === uid ? 'You' : (record.creatorName || 'A coach')}</span>
            <span><CalendarDays size={13} aria-hidden="true" />Updated {formatDate(record.updatedAt)}</span>
          </span>
        </span>
      </a>
    </li>
  );
}

/** Every authorized coach in the organization sees the same list. */
export function ProgramLibraryPage({ uid, orgId }) {
  const [state, setState] = useState({ status: 'loading', records: [], error: null });
  const [tab, setTab] = useState('in-progress');
  const [createdByMe, setCreatedByMe] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    return subscribeProgramLibrary(orgId,
      (records) => setState({ status: 'ready', records, error: null }),
      (err) => setState({ status: 'error', records: [], error: explainLibraryError(err, 'The library could not be loaded.') }));
  }, [orgId, attempt]);

  const counts = useMemo(() => ({
    'in-progress': filterPrograms(state.records, { tab: 'in-progress', createdByMe, uid }).length,
    published: filterPrograms(state.records, { tab: 'published', createdByMe, uid }).length
  }), [state.records, createdByMe, uid]);
  const shown = useMemo(() => filterPrograms(state.records, { tab, createdByMe, uid }), [state.records, tab, createdByMe, uid]);

  return (
    <div className="pl-page">
      <div className="pl-head">
        <div>
          <h1>Programs</h1>
          <p>Every course your organization&rsquo;s coaches are working on. Drafts are never visible to students.</p>
        </div>
        <a className="gh-btn gh-btn-primary" href={hrefFor.spark()}><Sparkles size={15} aria-hidden="true" />Create a course</a>
      </div>

      <div className="pl-toolbar">
        <div className="gh-tabs pl-tabs" role="tablist" aria-label="Program status">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" className="gh-tab" aria-selected={tab === t.id}
                    aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              {t.label}<span className="pg-count">{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <label className="pl-filter">
          <input type="checkbox" checked={createdByMe} onChange={(e) => setCreatedByMe(e.target.checked)} />
          Created by Me
        </label>
      </div>

      {state.status === 'loading' && <p className="pl-note" role="status">Loading programs…</p>}
      {state.status === 'error' && (
        <div className="pl-alert" role="alert">
          <AlertTriangle size={16} aria-hidden="true" /><span>{state.error}</span>
          <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
        </div>
      )}
      {state.status === 'ready' && shown.length === 0 && (
        <p className="pl-note">
          {tab === 'published' ? 'No published programs' : 'No programs in progress'}{createdByMe ? ' created by you' : ''} yet.
        </p>
      )}
      {shown.length > 0 && (
        <ul className="pl-grid">
          {shown.map((record) => <ProgramCard key={record.programId} record={record} uid={uid} />)}
        </ul>
      )}
    </div>
  );
}
