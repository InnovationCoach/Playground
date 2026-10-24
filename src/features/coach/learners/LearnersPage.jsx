import { useEffect, useMemo, useRef, useState } from 'react';
import { StudentProfileEditor } from '../../studentProfile/StudentProfileEditor.jsx';
import { auth } from '../../../firebase.js';
import {
  Users, BellRing, CheckCircle2, Rocket, RefreshCw, Search, X, Target, Clock, MessageSquareQuote, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { classSummary, filterRows, lastActiveText, lastDays, CHART_DAYS } from './learnersModel.js';
import { useClassLearners } from './useClassLearners.js';
import { initials } from '../../shell/Avatar.jsx';
import '../../admin/admin.css';
import './learners.css';

/**
 * Learners (coach): one page for "how is my class doing, and who needs me?".
 * Replaces the old CoachDashboard's roster and analytics with real records
 * only (see learnersModel.js). Assignments and material requests are still
 * on the old page until they are rebuilt; a link points there.
 */
const FACES = ['', '😵', '🤔', '🙂', '😎', '🧑‍🏫'];
const SORT_LABEL = { attention: 'Needs me first', name: 'Name', recent: 'Most recent', minutes: 'Most minutes this week' };

export function LearnersPage({ coachName }) {
  const { status, classes, rows, error, loadedAt, reload } = useClassLearners();
  const [classId, setClassId] = useState('all');
  const [query, setQuery] = useState('');
  const [onlyCheckIn, setOnlyCheckIn] = useState(false);
  const [sort, setSort] = useState('attention');
  const [open, setOpen] = useState(null);

  const inClass = useMemo(() => (classId === 'all' ? rows : rows.filter((r) => r.classIds.includes(classId))), [rows, classId]);
  const summary = useMemo(() => classSummary(inClass), [inClass]);
  const list = useMemo(() => filterRows(rows, { classId, query, onlyCheckIn, sort }), [rows, classId, query, onlyCheckIn, sort]);
  const className = (id) => classes.find((c) => c.id === id)?.name || id;
  const first = String(coachName || '').split(' ')[0];

  return (
    <div className="gh-page cl-page">
      <section className="cl-hero" aria-labelledby="cl-title">
        <div>
          <span className="cl-kicker"><Users size={15} aria-hidden="true" />Coach · Learners</span>
          <h1 id="cl-title">{first ? `${first}, here is your class` : 'Your learners'}</h1>
          <p>Who is moving, who is stuck, and what they are working on. Everything here comes from what learners saved; nothing is estimated.</p>
        </div>
        <div className="cl-hero-side">
          <button type="button" className="gh-btn gh-btn-sm cl-refresh" onClick={reload} disabled={status === 'loading' || status === 'refreshing'}>
            <RefreshCw size={15} aria-hidden="true" className={status === 'refreshing' ? 'cl-spin' : ''} />Refresh
          </button>
          {loadedAt && <small>Updated {new Date(loadedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</small>}
        </div>
      </section>

      {status === 'loading' && <Skeleton />}
      {status === 'no-classes' && (
        <Empty title="No classes on your account yet"
               body="Ask an admin to assign you to a class. Once you have one, your learners appear here. You will never see learners from other classes." />
      )}
      {status === 'error' && (
        <Empty title="Could not load your class" body={`Check your connection and press Refresh. (${error})`} action={<button type="button" className="gh-btn" onClick={reload}>Try again</button>} />
      )}

      {(status === 'ready' || status === 'refreshing') && (
        <>
          {classes.length > 1 && (
            <div className="cl-classes" role="group" aria-label="Class">
              <button type="button" aria-pressed={classId === 'all'} onClick={() => setClassId('all')}>All classes</button>
              {classes.map((c) => (
                <button key={c.id} type="button" aria-pressed={classId === c.id} onClick={() => setClassId(c.id)}>{c.name || c.id}</button>
              ))}
            </div>
          )}

          <div className="cl-tiles">
            <Tile icon={Users} label="Learners" value={summary.learners} note={`${summary.active7} active in the last 7 days`} />
            <Tile icon={BellRing} label="Need a check-in" value={summary.needsCheckIn} tone="amber"
                  note={summary.needsCheckIn ? 'Show only them' : 'Everyone is on track'} pressed={onlyCheckIn}
                  onClick={summary.needsCheckIn ? () => setOnlyCheckIn((v) => !v) : undefined} />
            <Tile icon={CheckCircle2} label="Goal steps today" tone="green"
                  value={summary.stepsToday.total ? `${summary.stepsToday.done}/${summary.stepsToday.total}` : '–'}
                  note={summary.stepsToday.total ? 'ticked off across the class' : 'No goal steps set for today'} />
            <Tile icon={Rocket} label="PBL missions done" value={summary.missionsDone} tone="purple" note="across every program" />
          </div>

          <MinutesChart summary={summary} />

          <div className="cl-controls">
            <label className="cl-search"><Search size={16} aria-hidden="true" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a learner" aria-label="Find a learner" />
            </label>
            <label className="cl-toggle"><input type="checkbox" checked={onlyCheckIn} onChange={(e) => setOnlyCheckIn(e.target.checked)} />Needs a check-in</label>
            <label className="cl-sort"><span>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          </div>

          {rows.length === 0 ? (
            <Empty title="No learners in your classes yet" body="Share your class join code from the coach dashboard. Learners appear here as soon as they join." />
          ) : list.length === 0 ? (
            <p className="cl-none">No learners match. <button type="button" className="cl-link" onClick={() => { setQuery(''); setOnlyCheckIn(false); }}>Clear filters</button></p>
          ) : (
            <ul className="cl-list" aria-label="Learners">
              {list.map((r) => <LearnerCard key={r.uid} row={r} className={className} onOpen={() => setOpen(r.uid)} />)}
            </ul>
          )}

          <p className="cl-foot">
            Assignments, material requests and registering learners are still on the
            <a href="#/coach/dashboard"> old coach dashboard <ArrowUpRight size={13} aria-hidden="true" /></a> until they move here.
          </p>
        </>
      )}

      {open && <LearnerDrawer row={rows.find((r) => r.uid === open)} className={className} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Tile({ icon: Icon, label, value, note, tone = 'navy', onClick, pressed }) {
  const body = (
    <>
      <span className="cl-tile-icon" aria-hidden="true"><Icon size={18} /></span>
      <span className="cl-tile-val">{value}</span>
      <span className="cl-tile-label">{label}</span>
      {note && <small>{note}</small>}
    </>
  );
  return onClick
    ? <button type="button" className="cl-tile is-button" data-tone={tone} aria-pressed={!!pressed} onClick={onClick}>{body}</button>
    : <div className="cl-tile" data-tone={tone}>{body}</div>;
}

/** Class minutes per day: one series, one hue, a tooltip on each bar. */
function MinutesChart({ summary }) {
  const [hover, setHover] = useState(null);
  const data = summary.minutesPerDay;
  const max = Math.max(...data.map((d) => d.minutes), 1);
  const total = data.reduce((s, d) => s + d.minutes, 0);
  return (
    <section className="gh-card cl-chart" aria-labelledby="cl-chart-title">
      <div className="cl-chart-head">
        <h2 id="cl-chart-title">Minutes on SPARK, last {CHART_DAYS} days</h2>
        <span>{summary.hasMinutes ? `${total.toLocaleString()} minutes in total` : ''}</span>
      </div>
      {!summary.hasMinutes ? (
        <p className="cl-chart-empty">No minutes recorded yet. Minutes are counted while learners are signed in and using SPARK, so this fills in as the class works.</p>
      ) : (
        <div className="cl-bars" role="img" aria-label={`Bar chart of class minutes per day. ${data.map((d) => `${shortDay(d.day)}: ${d.minutes}`).join(', ')}.`}
             onMouseLeave={() => setHover(null)}>
          {data.map((d, i) => (
            <div key={d.day} className="cl-bar-slot" onMouseEnter={() => setHover(i)}>
              <span className={d.minutes ? 'cl-bar' : 'cl-bar is-zero'} style={{ height: d.minutes ? `${Math.max(4, (d.minutes / max) * 100)}%` : '2px' }} />
              <small className={i % 2 === (data.length - 1) % 2 ? '' : 'cl-hide-sm'}>{shortDay(d.day, true)}</small>
              {hover === i && (
                <span className="cl-tip" role="tooltip"><strong>{d.minutes} min</strong>{shortDay(d.day)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const shortDay = (key, narrow = false) => new Date(`${key}T12:00`).toLocaleDateString(undefined, narrow ? { day: 'numeric' } : { weekday: 'short', day: 'numeric', month: 'short' });

function Sparkline({ values }) {
  const max = Math.max(...values, 1);
  const w = 84; const h = 24;
  if (!values.some((v) => v > 0)) return <span className="cl-spark-empty">no minutes yet</span>;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`).join(' ');
  return (
    <svg className="cl-spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <polyline points={pts} />
    </svg>
  );
}

function LearnerCard({ row: r, className, onOpen }) {
  const mission = r.programs.reduce((s, p) => s + p.done, 0);
  return (
    <li>
      <button type="button" className={r.needsCheckIn ? 'cl-card is-flagged' : 'cl-card'} onClick={onOpen} aria-label={`${r.name}: open details`}>
        <span className="cl-who">
          <span className="cl-avatar" aria-hidden="true">{initials(r.name)}</span>
          <span className="cl-name">
            <strong>{r.name}</strong>
            <small>{[r.classIds.map(className).join(', '), r.yearLevel, r.primary ? 'Junior Explorer' : ''].filter(Boolean).join(' · ')}</small>
          </span>
        </span>
        <span className="cl-flags">
          {r.flags.map((f) => <span key={f.id} className={`cl-flag cl-flag-${f.id}`}>{f.label}</span>)}
        </span>
        <span className="cl-metric" style={{ gridArea: 'today' }}><small>Today</small>
          {r.today.total ? <><b>{r.today.done}/{r.today.total}</b><Meter pct={(r.today.done / r.today.total) * 100} /></> : <em>no steps set</em>}
        </span>
        <span className="cl-metric" style={{ gridArea: 'goals' }}><small>Goals</small>{r.goals.length ? <b>{r.goals.filter((g) => !g.done).length} open</b> : <em>none</em>}</span>
        <span className="cl-metric" style={{ gridArea: 'missions' }}><small>Missions</small>{r.programs.length ? <b>{mission}</b> : <em>none</em>}</span>
        <span className="cl-metric" style={{ gridArea: 'conf' }}><small>Confidence</small>
          {r.confidence != null ? <b title={`Average ${r.confidence} of 5`}>{FACES[Math.round(r.confidence)]} {r.confidence}</b> : <em>not rated</em>}
        </span>
        <span className="cl-metric" style={{ gridArea: 'week' }}><small>This week</small>
          <span className="cl-week">{r.hasMinutes ? <b>{r.minutesWeek} min</b> : null}<Sparkline values={r.minutesByDay} /></span>
        </span>
        <span className="cl-metric" style={{ gridArea: 'last' }}><small>Last active</small><b className={r.quietDays >= 7 ? 'cl-warn' : ''}>{lastActiveText(r)}</b></span>
      </button>
    </li>
  );
}

function Meter({ pct }) {
  return <span className="cl-meter" aria-hidden="true"><i style={{ width: `${Math.round(pct)}%` }} /></span>;
}

const SUGGEST = {
  quiet: 'Send a short message or check in at the start of the next session.',
  confidence: 'Their last missions felt hard. A quick 1:1 on the next step may unblock them.',
  'no-goal': 'Help them pick one big goal on Goal setting; it builds their daily list.',
  new: 'They have not saved anything yet. Make sure they can sign in and know where to start.',
  consent: 'The school is waiting for a parent to give consent.',
  suspended: 'This account is suspended by the school.'
};

function LearnerDrawer({ row: r, className, onClose }) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current?.showModal?.(); }, []);
  if (!r) return null;
  const days = lastDays(CHART_DAYS);
  return (
    <dialog ref={dialog} className="cl-drawer" aria-labelledby="cl-drawer-title" onClose={onClose}
            onClick={(e) => { if (e.target === dialog.current) onClose(); }}>
      <div className="cl-drawer-inner">
        <div className="cl-drawer-head">
          <span className="cl-avatar cl-avatar-lg" aria-hidden="true">{initials(r.name)}</span>
          <div className="cl-grow">
            <h2 id="cl-drawer-title">{r.name}</h2>
            <small>{[r.classIds.map(className).join(', '), r.yearLevel, `Last active: ${lastActiveText(r)}`].filter(Boolean).join(' · ')}</small>
          </div>
          <button type="button" className="cl-x" onClick={onClose} aria-label="Close"><X size={18} aria-hidden="true" /></button>
        </div>

        {r.flags.length > 0 && (
          <section className="cl-section">
            <h3><AlertTriangle size={16} aria-hidden="true" />Worth a look</h3>
            <ul className="cl-suggest">{r.flags.map((f) => <li key={f.id}><strong>{f.label}.</strong> {SUGGEST[f.id]}</li>)}</ul>
          </section>
        )}

        <section className="cl-section">
          <StudentProfileEditor learnerUid={r.uid} coach={{ uid: auth.currentUser?.uid, role: 'coach' }} learnerName={r.name} />
        </section>

        <section className="cl-section">
          <h3><Target size={16} aria-hidden="true" />Goals</h3>
          {r.goals.length ? (
            <ul className="cl-goals">
              {r.goals.map((g) => (
                <li key={g.id} className={g.done ? 'is-done' : ''}>
                  <span>{g.done ? '🏆 ' : ''}{g.text}</span>
                  {g.stepsTotal > 0 && <><small>{g.stepsDone}/{g.stepsTotal} steps</small><Meter pct={(g.stepsDone / g.stepsTotal) * 100} /></>}
                </li>
              ))}
            </ul>
          ) : <p className="cl-muted">No goals yet.</p>}
          {r.focusSkill && <p className="cl-muted">Daily habit: {r.focusSkill}</p>}
          <p className="cl-muted">Today: {r.today.total ? `${r.today.done} of ${r.today.total} steps ticked` : 'nothing on the list'}</p>
        </section>

        <section className="cl-section">
          <h3><Rocket size={16} aria-hidden="true" />PBL programs</h3>
          {r.programs.length ? r.programs.map((p) => (
            <div key={p.id} className="cl-program">
              <div className="cl-program-head"><strong>{p.title}</strong><small>{p.done} of {p.total} missions</small></div>
              <Meter pct={p.pct} />
              {p.next && <p className="cl-muted">Next: mission {p.next.number}, {p.next.title}</p>}
              {p.ratings.length > 0 && <p className="cl-muted">Confidence by mission: {p.ratings.map((n) => FACES[n]).join(' ')}</p>}
              {p.reflections.slice(-3).reverse().map((x) => (
                <blockquote key={x.session} className="cl-quote">
                  <MessageSquareQuote size={14} aria-hidden="true" />
                  <span><small>Mission {x.session}: {x.title}</small>{x.text}</span>
                </blockquote>
              ))}
            </div>
          )) : <p className="cl-muted">Not started a program yet.</p>}
        </section>

        <section className="cl-section">
          <h3><Clock size={16} aria-hidden="true" />Minutes, last {CHART_DAYS} days</h3>
          {r.hasMinutes ? (
            <div className="cl-mini-bars" role="img" aria-label={days.map((d, i) => `${shortDay(d)}: ${r.minutesByDay[i]} minutes`).join(', ')}>
              {r.minutesByDay.map((m, i) => {
                const max = Math.max(...r.minutesByDay, 1);
                return <span key={days[i]} title={`${shortDay(days[i])}: ${m} min`} style={{ height: m ? `${Math.max(6, (m / max) * 100)}%` : '2px' }} className={m ? '' : 'is-zero'} />;
              })}
            </div>
          ) : <p className="cl-muted">No minutes recorded yet.</p>}
        </section>
      </div>
    </dialog>
  );
}

function Skeleton() {
  return (
    <div className="cl-skeleton" aria-busy="true" aria-label="Loading your class">
      <div className="cl-tiles">{[0, 1, 2, 3].map((i) => <div key={i} className="cl-tile cl-shimmer" />)}</div>
      {[0, 1, 2].map((i) => <div key={i} className="cl-card cl-shimmer" style={{ height: 76 }} />)}
    </div>
  );
}

function Empty({ title, body, action }) {
  return (
    <div className="gh-card cl-empty">
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );
}
