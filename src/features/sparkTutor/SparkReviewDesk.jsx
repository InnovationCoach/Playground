import { useState } from 'react';
import { AlertTriangle, LifeBuoy, RefreshCw, Sparkles } from 'lucide-react';
import { useSparkSummaries } from './useSparkSummaries.js';
import { isUrgentSupport, levelLabel, openSupportItems, topicLabel } from './sparkTutorModel.js';
import './sparkTutor.css';

const MODE_LABEL = { pbl_mentor: 'PBL Mentor', academic_tutor: 'Academic Tutor' };
const when = (iso) => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
};
const inScope = (items, scope) => (scope === 'all' || scope.startsWith('cohort:') ? items : items.filter((s) => s.classId === scope));

/**
 * Spark Review Desk: how the companion has been helping learners in the
 * coach's classes. Rows come only from /api/spark-tutor/coach/summaries, which
 * the server scopes to the coach's assigned classes.
 *
 * Open support requests sit above the table, safeguarding concerns first.
 * AI observations are provisional. Nothing here counts toward mastery, grades
 * or XP, and the desk never invents a status the server did not return.
 *
 * Pass `summaries` from useSparkSummaries to share one load with the rest of
 * the workspace; without it the desk loads its own.
 */
export function SparkReviewDesk({ summaries, ...props }) {
  return summaries ? <DeskView summaries={summaries} {...props} /> : <SelfLoadingDesk {...props} />;
}

function SelfLoadingDesk(props) {
  return <DeskView summaries={useSparkSummaries(true)} {...props} />;
}

function DeskView({ summaries: data, classes = [], scope = 'all' }) {
  const className = (id) => classes.find((c) => c.id === id)?.name || id || '—';
  const items = inScope(data.items, scope);
  const open = openSupportItems(items);

  return (
    <section className="sk-desk" aria-labelledby="sk-desk-title">
      <div className="sk-desk-head">
        <div>
          <span className="cw-eyebrow">AI COMPANION INSIGHTS</span>
          <h2 id="sk-desk-title"><Sparkles size={18} aria-hidden="true" /> Spark Review Desk</h2>
          <p>How Spark has been helping your learners, and how much help each one needed.</p>
        </div>
        <button type="button" className="gh-btn gh-btn-ghost" disabled={data.state === 'loading'} onClick={data.reload}><RefreshCw size={16} /> Refresh</button>
      </div>

      {open.length > 0 && (
        <div className="sk-requests" aria-label="Open support requests">
          {open.map((s) => <SupportRequest key={s.supportDetails.id || s.sessionId} item={s} className={className(s.classId)} onAcknowledge={data.acknowledge} />)}
        </div>
      )}

      <p className="sk-provisional"><strong>Provisional · Unofficial.</strong> Spark's notes are AI observations. They do not count toward official mastery, grades or XP until you review them.</p>

      {data.state === 'loading' && !data.items.length && <p className="cw-muted" role="status">Loading Spark sessions…</p>}
      {data.state === 'disabled' && <p className="cw-muted" role="status">Spark is switched off for this school right now, so there are no sessions to review.</p>}
      {data.state === 'error' && <p className="cw-warning" role="alert">{data.error?.status === 403 ? 'Your account is not allowed to view Spark sessions for these classes.' : 'Spark sessions could not be loaded. Use Refresh to try again.'}</p>}
      {data.state === 'ready' && !items.length && <p className="cw-muted" role="status">No learner in this view has talked with Spark yet.</p>}

      {items.length > 0 && (
        <div className="cw-table-scroll">
          <table className="sk-table">
            <caption className="sk-sr">Spark sessions in your classes</caption>
            <thead><tr><th>Learner</th><th>Working on</th><th>Help now</th><th>Most help used</th><th>Practice checks</th><th>Last active</th></tr></thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.sessionId}>
                  <td>
                    <strong>{s.displayName || 'Learner'}</strong>
                    {s.supportDetails && s.supportDetails.status !== 'acknowledged' && (isUrgentSupport(s.supportDetails)
                      ? <span className="sk-pill sk-pill-urgent">Safeguarding</span>
                      : <span className="sk-pill sk-pill-help">Asked for help</span>)}
                    <small>{className(s.classId)}</small>
                  </td>
                  <td>{s.activeDetour ? <><span className="sk-pill sk-pill-detour">Detour</span> {topicLabel(s.activeDetour)}</> : MODE_LABEL[s.mode] || '—'}</td>
                  <td>{levelLabel(s.assistanceLevel, 'coach') || '—'}</td>
                  <td>{levelLabel(s.highestAssistanceUsed, 'coach') || '—'}</td>
                  <td>{s.practiceStats?.totalAttempts ? `${s.practiceStats.correctCount} of ${s.practiceStats.totalAttempts} correct` : '—'}</td>
                  <td>{when(s.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="cw-footnote">Help levels run from Elicit (Spark asked questions) to Guided (Spark walked through the method). Practice checks are marked automatically by Spark, not by you.</p>
    </section>
  );
}

function SupportRequest({ item, className, onAcknowledge }) {
  const d = item.supportDetails;
  const urgent = isUrgentSupport(d);
  const [state, setState] = useState('idle'); // idle | saving | failed
  async function acknowledge() {
    setState('saving');
    try { await onAcknowledge(d.id); } catch { setState('failed'); }
  }
  return (
    <article className={`sk-request${urgent ? ' sk-request-urgent' : ''}`} role={urgent ? 'alert' : undefined}>
      <header>
        {urgent ? <AlertTriangle size={18} aria-hidden="true" /> : <LifeBuoy size={18} aria-hidden="true" />}
        <strong>{urgent ? 'Safeguarding concern' : 'Asked for help'}: {item.displayName || 'Learner'}</strong>
        <small>{className} · {when(d.requestedAt)}</small>
      </header>
      {d.question && <p className="sk-request-text">{d.question}</p>}
      {urgent && <p className="sk-request-note">Spark matched words that may mean this learner is at risk. Check on them now and follow your school's safeguarding procedure. Spark can be wrong, so talk to the learner before acting on its words alone.</p>}
      <div className="sk-row">
        <button type="button" className="gh-btn gh-btn-primary" disabled={state === 'saving'} onClick={acknowledge}>
          {state === 'saving' ? 'Saving…' : urgent ? "I've seen this" : 'Acknowledge'}
        </button>
        <small className="cw-muted">This records that you have seen it. It does not close a safeguarding concern.</small>
      </div>
      {state === 'failed' && <p className="cw-warning" role="alert">This could not be saved. Try again, and if it keeps failing, tell your safeguarding lead directly.</p>}
    </article>
  );
}

/**
 * Banner shown on every coach tab while a safeguarding request in the coach's
 * classes is unacknowledged, so it is not missed by staying off the desk.
 */
export function SparkSafeguardingBanner({ summaries, onOpen }) {
  const urgent = openSupportItems(summaries?.items).filter((s) => isUrgentSupport(s.supportDetails));
  if (!urgent.length) return null;
  const names = [...new Set(urgent.map((s) => s.displayName || 'A learner'))].join(', ');
  return (
    <div className="sk-banner" role="alert">
      <AlertTriangle size={18} aria-hidden="true" />
      <p><strong>{urgent.length === 1 ? 'Safeguarding concern' : `${urgent.length} safeguarding concerns`}</strong> from Spark: {names}.</p>
      <button type="button" className="gh-btn gh-btn-primary" onClick={onOpen}>Review now</button>
    </div>
  );
}
