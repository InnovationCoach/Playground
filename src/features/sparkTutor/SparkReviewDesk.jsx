import { useEffect, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { getSparkCoachSummaries } from './sparkTutorApi.js';
import { classifySparkError, levelLabel, topicLabel } from './sparkTutorModel.js';
import './sparkTutor.css';

const MODE_LABEL = { pbl_mentor: 'PBL Mentor', academic_tutor: 'Academic Tutor' };
const when = (iso) => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
};

/**
 * Spark Review Desk: how the companion has been helping learners in the
 * coach's classes. Rows come only from /api/spark-tutor/coach/summaries, which
 * the server scopes to the coach's assigned classes.
 *
 * AI observations are provisional. Nothing here counts toward mastery, grades
 * or XP, and the desk never invents a status the server did not return.
 */
export function SparkReviewDesk({ classes = [], scope = 'all' }) {
  const [data, setData] = useState({ state: 'loading', items: [] });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData({ state: 'loading', items: [] });
    getSparkCoachSummaries()
      .then((res) => { if (!cancelled) setData({ state: 'ready', items: Array.isArray(res?.items) ? res.items : [] }); })
      .catch((err) => { if (!cancelled) setData({ state: classifySparkError(err).state === 'disabled' ? 'disabled' : 'error', items: [], error: err }); });
    return () => { cancelled = true; };
  }, [reload]);

  const className = (id) => classes.find((c) => c.id === id)?.name || id || '—';
  const items = scope === 'all' || scope.startsWith('cohort:') ? data.items : data.items.filter((s) => s.classId === scope);

  return (
    <section className="sk-desk" aria-labelledby="sk-desk-title">
      <div className="sk-desk-head">
        <div>
          <span className="cw-eyebrow">AI COMPANION INSIGHTS</span>
          <h2 id="sk-desk-title"><Sparkles size={18} aria-hidden="true" /> Spark Review Desk</h2>
          <p>How Spark has been helping your learners, and how much help each one needed.</p>
        </div>
        <button type="button" className="gh-btn gh-btn-ghost" disabled={data.state === 'loading'} onClick={() => setReload((n) => n + 1)}><RefreshCw size={16} /> Refresh</button>
      </div>
      <p className="sk-provisional"><strong>Provisional · Unofficial.</strong> Spark's notes are AI observations. They do not count toward official mastery, grades or XP until you review them.</p>

      {data.state === 'loading' && <p className="cw-muted" role="status">Loading Spark sessions…</p>}
      {data.state === 'disabled' && <p className="cw-muted" role="status">Spark is switched off for this school right now, so there are no sessions to review.</p>}
      {data.state === 'error' && <p className="cw-warning" role="alert">{data.error?.status === 403 ? 'Your account is not allowed to view Spark sessions for these classes.' : 'Spark sessions could not be loaded. Use Refresh to try again.'}</p>}
      {data.state === 'ready' && !items.length && <p className="cw-muted" role="status">No learner in this view has talked with Spark yet.</p>}

      {data.state === 'ready' && items.length > 0 && (
        <div className="cw-table-scroll">
          <table className="sk-table">
            <caption className="sk-sr">Spark sessions in your classes</caption>
            <thead><tr><th>Learner</th><th>Working on</th><th>Help now</th><th>Most help used</th><th>Last active</th></tr></thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.sessionId}>
                  <td><strong>{s.displayName || 'Learner'}</strong><small>{className(s.classId)}</small></td>
                  <td>{s.activeDetour ? <><span className="sk-pill sk-pill-detour">Detour</span> {topicLabel(s.activeDetour)}</> : MODE_LABEL[s.mode] || '—'}</td>
                  <td>{levelLabel(s.assistanceLevel, 'coach') || '—'}</td>
                  <td>{levelLabel(s.highestAssistanceUsed, 'coach') || '—'}</td>
                  <td>{when(s.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="cw-footnote">Help levels run from Elicit (Spark asked questions) to Guided (Spark walked through the method). Practice checks and "Ask my coach" requests are not shown here yet.</p>
    </section>
  );
}
