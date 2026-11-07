import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Eye, Globe, MessageSquare, Pencil, Send } from 'lucide-react';
import { hrefFor } from '../../../app/routes.js';
import { CatalogCard } from '../../courses/CatalogCard.jsx';
import { buildCatalog } from '../../courses/catalog.js';
import { StudentProgramPreview } from '../../pbl/programs/ProgramDetail.jsx';
import { canManageProgram, COMMENT_MAX, explainLibraryError, programFromUnit } from './programLibraryModel.js';
import {
  addProgramComment, getPublishedProgram, publishProgramVersion, subscribeProgramComments, subscribeProgramRecord
} from './programLibraryService.js';
import { statusLabel } from './ProgramLibraryPage.jsx';
import '../../pbl/programs/programs.css';
import './programLibrary.css';

const formatDateTime = (ms) => (ms ? new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');
const noop = () => {};

function Feedback({ record, actor, view, version }) {
  const [comments, setComments] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const sendingRef = useRef(false);

  useEffect(() => subscribeProgramComments(record.programId, setComments,
    (err) => setLoadError(explainLibraryError(err, 'Feedback could not be loaded.'))), [record.programId]);

  const submit = async (e) => {
    e.preventDefault();
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setSendError(null);
    try {
      await addProgramComment({ programId: record.programId, orgId: record.orgId, actor, body, view, version });
      setBody('');
    } catch (err) {
      setSendError(explainLibraryError(err, 'Your feedback was not saved.'));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <section className="gh-card pl-feedback" aria-labelledby="pl-feedback-title">
      <h2 id="pl-feedback-title" className="pb-h3"><MessageSquare size={17} aria-hidden="true" />Coach feedback</h2>
      <p className="pb-sub">Only coaches and administrators can see this. Students never do.</p>
      {loadError && <p className="pl-alert" role="alert"><AlertTriangle size={16} aria-hidden="true" /><span>{loadError}</span></p>}
      {comments.length === 0 && !loadError && <p className="pl-note">No feedback yet.</p>}
      <ul className="pl-comments">
        {comments.map((c) => (
          <li key={c.id}>
            <div className="pl-comment-head">
              <strong>{c.authorName || 'A coach'}</strong>
              <span>{c.view === 'published' ? 'Published' : 'Draft'} v{c.version} · {formatDateTime(c.createdAt)}</span>
            </div>
            <p>{c.body}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="pl-comment-form">
        <label htmlFor="pl-comment-body">Add feedback on this version (v{version})</label>
        <textarea id="pl-comment-body" rows={3} maxLength={COMMENT_MAX} value={body} onChange={(e) => setBody(e.target.value)} />
        {sendError && <p className="pl-alert" role="alert"><AlertTriangle size={16} aria-hidden="true" /><span>{sendError}</span></p>}
        <button type="submit" className="gh-btn gh-btn-secondary" disabled={sending || !body.trim()}>
          <Send size={14} aria-hidden="true" />{sending ? 'Sending…' : 'Send feedback'}
        </button>
      </form>
    </section>
  );
}

function PublishControl({ record, actor }) {
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const publishingRef = useRef(false);
  const upToDate = record.publishedVersion === record.draftVersion;

  useEffect(() => { setConfirming(false); }, [record.draftVersion]);

  const publish = async () => {
    if (publishingRef.current) return;
    publishingRef.current = true;
    setPublishing(true);
    setError(null);
    setDone(null);
    try {
      const res = await publishProgramVersion({ programId: record.programId, reviewedVersion: record.draftVersion, actor });
      setDone(res.version);
      setConfirming(false);
    } catch (err) {
      setError(explainLibraryError(err, 'The program was not published.'));
    } finally {
      publishingRef.current = false;
      setPublishing(false);
    }
  };

  return (
    <div className="pl-publish">
      {upToDate ? (
        <span className="pl-status" data-status="published"><CheckCircle2 size={14} aria-hidden="true" />Latest version is published</span>
      ) : confirming ? (
        <>
          <span>Students will be able to find version {record.draftVersion}.</span>
          <button type="button" className="gh-btn gh-btn-primary" onClick={publish} disabled={publishing}>
            {publishing ? 'Publishing…' : 'Confirm publish'}
          </button>
          <button type="button" className="gh-btn gh-btn-ghost" onClick={() => setConfirming(false)} disabled={publishing}>Cancel</button>
        </>
      ) : (
        <button type="button" className="gh-btn gh-btn-primary" onClick={() => setConfirming(true)}>
          <Globe size={15} aria-hidden="true" />Publish
        </button>
      )}
      {done != null && upToDate && <span role="status" className="pl-note">Version {done} is now available to students.</span>}
      {error && <p className="pl-alert" role="alert"><AlertTriangle size={16} aria-hidden="true" /><span>{error}</span></p>}
    </div>
  );
}

/**
 * The coach's view of a program as a learner would get it. It renders the real
 * student card and course player, against in-memory progress: nothing here
 * enrols the coach, awards XP, or writes any learner record.
 */
export function ProgramPreviewPage({ programId, version: requestedView, section, uid, role, displayName }) {
  const [state, setState] = useState({ status: 'loading', record: null, error: null });
  const [published, setPublished] = useState({ status: 'idle', program: null });
  const view = requestedView === 'published' ? 'published' : 'draft';
  const actor = useMemo(() => ({ uid, displayName }), [uid, displayName]);
  const record = state.record;

  useEffect(() => {
    setState({ status: 'loading', record: null, error: null });
    return subscribeProgramRecord(programId,
      (next) => setState({ status: next ? 'ready' : 'missing', record: next, error: null }),
      (err) => setState({ status: 'error', record: null, error: explainLibraryError(err, 'This program could not be loaded.') }));
  }, [programId]);

  const publishedVersion = record?.publishedVersion ?? null;
  useEffect(() => {
    if (publishedVersion == null) {
      setPublished({ status: 'idle', program: null });
      return undefined;
    }
    let cancelled = false;
    setPublished((p) => ({ ...p, status: 'loading' }));
    getPublishedProgram(programId)
      .then((program) => { if (!cancelled) setPublished({ status: 'ready', program }); })
      .catch(() => { if (!cancelled) setPublished({ status: 'error', program: null }); });
    return () => { cancelled = true; };
  }, [programId, publishedVersion]);

  const draftResult = useMemo(() => {
    if (!record) return { program: null, error: null };
    try {
      return { program: programFromUnit(record.unit, record.creatorUid).view, error: null };
    } catch (err) {
      return { program: null, error: err.message };
    }
  }, [record]);

  if (state.status === 'loading') return <div className="pl-page"><p className="pl-note" role="status">Loading preview…</p></div>;
  if (state.status !== 'ready') {
    return (
      <div className="pl-page">
        <a className="pb-link" href={hrefFor.programLibrary()}><ArrowLeft size={15} aria-hidden="true" />All programs</a>
        <p className="pl-alert" role="alert"><AlertTriangle size={16} aria-hidden="true" />
          <span>{state.error || 'This program could not be found.'}</span></p>
      </div>
    );
  }

  const program = view === 'published' ? published.program : draftResult.program;
  const version = view === 'published' ? record.publishedVersion : record.draftVersion;
  const stageCount = program?.phases?.length || 0;
  const cardItem = program ? buildCatalog({ activities: [], programs: [program], includePartners: false })[0] : null;
  const manage = canManageProgram(record, { uid, role });

  return (
    <div className="pl-page pl-preview">
      <div className="pl-preview-banner" role="status">
        <Eye size={18} aria-hidden="true" />
        <div>
          <strong>Coach preview{view === 'draft' ? ' · draft' : ' · published version'}</strong>
          <span>This is what a student sees. You are not enrolled, and nothing you do here earns XP or saves progress.</span>
        </div>
      </div>

      <div className="pl-preview-bar">
        <div className="pl-preview-title">
          <span className="pl-card-badges">
            <span className="pl-status" data-status={record.status}>{statusLabel(record)}</span>
            {record.hasUnpublishedChanges && <span className="pl-pending">Unpublished changes</span>}
          </span>
          <h1>{view === 'published' ? (program?.title || record.title) : record.title}</h1>
          <p>By {record.creatorUid === uid ? 'you' : (record.creatorName || 'a coach')} · {stageCount} stages</p>
        </div>
        <div className="pl-preview-actions">
          {manage && (
            <a className="gh-btn gh-btn-secondary" href={hrefFor.programEdit(record.programId)}><Pencil size={15} aria-hidden="true" />Edit</a>
          )}
          {manage && <PublishControl record={record} actor={actor} />}
          {!manage && <span className="pl-note">Only the creator or an administrator can edit or publish.</span>}
        </div>
      </div>

      {record.publishedVersion != null && (
        <div className="gh-tabs pl-tabs" aria-label="Version to preview">
          <a className="gh-tab" aria-current={view === 'draft' ? 'page' : undefined} href={hrefFor.programPreview(record.programId, 'draft')}>
            Current draft (v{record.draftVersion})
          </a>
          <a className="gh-tab" aria-current={view === 'published' ? 'page' : undefined} href={hrefFor.programPreview(record.programId, 'published')}>
            Published (v{record.publishedVersion})
          </a>
        </div>
      )}

      {view === 'published' && record.publishedVersion == null && <p className="pl-note">This program has not been published yet.</p>}
      {view === 'published' && published.status === 'error' && <p className="pl-alert" role="alert"><AlertTriangle size={16} aria-hidden="true" /><span>The published version could not be loaded.</span></p>}
      {view === 'draft' && draftResult.error && <p className="pl-alert" role="alert"><AlertTriangle size={16} aria-hidden="true" /><span>{draftResult.error}</span></p>}

      {cardItem && (
        <section className="pl-card-preview" aria-label="How this looks in course search">
          <h2 className="pb-h3">In course search</h2>
          {/* The real card; inert, because its links lead to the student route and its add control enrols. */}
          <ul className="gh-course-grid pl-inert" inert="">
            <CatalogCard item={cardItem} onOpenActivity={noop} addedKeys={[]} onToggleAdd={noop} variant="button" />
          </ul>
        </section>
      )}

      {program && (
        <StudentProgramPreview
          key={`${record.programId}:${view}:${version}`}
          program={program}
          section={section}
          linkFor={(_id, sec) => hrefFor.programPreview(record.programId, view, sec)}
          backHref={hrefFor.programLibrary()}
        />
      )}

      {version != null && <Feedback record={record} actor={actor} view={view} version={version} />}
    </div>
  );
}
