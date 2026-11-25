import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronRight, CircleDashed, Clock, GraduationCap, Plus, Target, Users, X } from 'lucide-react';
import { schoolRequest } from '../../../services/api/apiClient.js';
import { schoolPath, serviceMessage, useSchoolResource } from '../useSchoolWorkspace.js';
import { academicRow, summarizeAcademic, summarizeGoals } from './coachBoardModel.js';
import './coachBoards.css';

const isSelectable = l => !['suspended', 'archived'].includes(l.status);

// Learners in the coach's scope, from the school API (not the Today roster, which reads classIds only).
export function useScopedLearners(school, classes) {
  const learners = useSchoolResource(schoolPath(school.id, 'learners'));
  const list = useMemo(() => (learners.data?.items || []).filter(l => isSelectable(l) && l.classIds.some(id => classes.some(c => c.id === id))), [learners.data, classes]);
  return { ...learners, list };
}

export function BoardStat({ icon: Icon, label, value, tone = '', hint }) {
  return <div className={`cb-stat ${tone ? `cb-stat-${tone}` : ''}`}><span className="cb-stat-label"><Icon size={16} aria-hidden="true" />{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</div>;
}

export function BoardEmpty({ icon: Icon = Users, title, children, action }) {
  return <div className="cb-empty" role="status"><span className="cb-empty-icon"><Icon size={26} aria-hidden="true" /></span><h3>{title}</h3><div className="cb-empty-text">{children}</div>{action}</div>;
}

// Shown when the school API returns no learners: explains why, since Today may still list them.
export function NoSchoolLearners({ subject }) {
  return <BoardEmpty title="No learners are linked to this school yet" icon={Users}>
    <p>{subject} reads learners who are enrolled in the school and in your classes. Learners who joined only with a class code appear on Today, but are not linked to the school until an administrator enrols them.</p>
    <p className="cb-muted">Ask your administrator to link your class learners to the school. Nothing here changes permissions.</p>
  </BoardEmpty>;
}

const GOAL_FILTERS = [['all', 'All learners'], ['attention', 'Needs attention'], ['none', 'No goal yet'], ['achieved', 'Achieved']];
const STATUS_LABEL = { overdue: 'Overdue', 'due-soon': 'Due this week', active: 'On track', none: 'No goal yet', achieved: 'All achieved' };

export function CoachGoalsBoard({ school, classes, today, renderDetail }) {
  const learners = useScopedLearners(school, classes);
  const goals = useSchoolResource(schoolPath(school.id, 'learner-goals'), true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const summary = useMemo(() => summarizeGoals(learners.list, goals.data?.items || [], today), [learners.list, goals.data, today]);
  const rows = summary.rows.filter(r => filter === 'all' || (filter === 'attention' ? ['overdue', 'due-soon'].includes(r.status) || r.unacknowledged > 0 : r.status === filter));
  const loading = learners.loading || goals.loading && !goals.data;
  const error = learners.error || goals.error;

  if (selected) return <div className="cb-detail"><button type="button" className="gh-btn gh-btn-ghost cb-back" onClick={() => setSelected(null)}><X size={16} />Back to all goals</button>{renderDetail(selected, () => { setSelected(null); goals.reload(); })}</div>;
  return <div className="cb-board">
    <p className="cb-lede">Agreed goals for every learner in your classes. Start with anyone overdue or without a goal.</p>
    <div className="cb-stats" aria-label="Goal summary">
      <BoardStat icon={Target} label="Open goals" value={summary.totals.open} />
      <BoardStat icon={AlertTriangle} label="Overdue" value={summary.totals.overdue} tone={summary.totals.overdue ? 'alert' : ''} />
      <BoardStat icon={CalendarClock} label="Due within 7 days" value={summary.totals.dueSoon} tone={summary.totals.dueSoon ? 'warn' : ''} />
      <BoardStat icon={CircleDashed} label="Learners without a goal" value={summary.totals.withoutGoal} tone={summary.totals.withoutGoal ? 'warn' : ''} />
      <BoardStat icon={CheckCircle2} label="Achieved" value={summary.totals.achieved} tone="good" />
    </div>
    {error && <p className="sw-error" role="alert">{serviceMessage(error)}</p>}
    {loading && <p role="status" className="cb-muted">Loading learners and goals…</p>}
    {!loading && !error && !learners.list.length && <NoSchoolLearners subject="Learning Goals" />}
    {learners.list.length > 0 && <>
      <div className="cb-filters" role="group" aria-label="Filter learners">{GOAL_FILTERS.map(([id, label]) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
      {!rows.length ? <BoardEmpty icon={CheckCircle2} title="No learners match this filter"><p>Choose another filter to see the rest of your class.</p></BoardEmpty> :
        <ul className="cb-rows">{rows.map(r => <li key={r.learner.id}>
          <button type="button" className="cb-row" onClick={() => setSelected(r.learner.id)} aria-label={`Open goals for ${r.learner.displayName}`}>
            <span className="cb-avatar" aria-hidden="true">{r.learner.displayName.charAt(0)}</span>
            <span className="cb-row-main"><strong>{r.learner.displayName}</strong><small>{classes.filter(c => r.learner.classIds.includes(c.id)).map(c => c.name).join(', ')}</small></span>
            <span className="cb-row-goal">{r.next ? <><span className="cb-goal-text">{r.next.target}</span><small>Due {r.next.dueDate}</small></> : r.open ? <span className="cb-goal-text">{r.goals.find(g => g.status !== 'achieved')?.target}</span> : <span className="cb-muted">{r.achieved ? `${r.achieved} achieved, nothing open` : 'Set a first goal'}</span>}</span>
            <span className="cb-row-meta">{r.open > 0 && <small>{r.open} open</small>}{r.unacknowledged > 0 && <small>{r.unacknowledged} awaiting learner</small>}</span>
            <span className={`cb-badge cb-badge-${r.status}`}>{STATUS_LABEL[r.status]}</span>
            <span className="cb-row-action">{r.open ? 'Open' : <><Plus size={14} />Set goal</>}<ChevronRight size={16} aria-hidden="true" /></span>
          </button>
        </li>)}</ul>}
    </>}
  </div>;
}

const ACADEMIC_FILTERS = [['all', 'All learners'], ['none', 'No observation'], ['stale', 'Older than 30 days'], ['current', 'Up to date']];
const ACADEMIC_LABEL = { current: 'Up to date', stale: 'Needs update', none: 'No observation', loading: 'Loading', error: 'Unavailable' };

// Observations are read per learner (the API has no class-wide list), a few at a time.
function useAcademicResults(school, learners, version) {
  const [results, setResults] = useState({});
  const key = learners.map(l => l.id).join(',');
  useEffect(() => {
    let active = true;
    const queue = [...learners];
    setResults({});
    const worker = async () => {
      while (active && queue.length) {
        const learner = queue.shift();
        const classId = learner.scopedClassId;
        try {
          const data = await schoolRequest('GET', schoolPath(school.id, `academic-progress?learnerUid=${encodeURIComponent(learner.id)}&classId=${encodeURIComponent(classId || '')}`));
          if (active) setResults(r => ({ ...r, [learner.id]: { items: data.items || [] } }));
        } catch (error) {
          if (active) setResults(r => ({ ...r, [learner.id]: { error } }));
        }
      }
    };
    Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school.id, key, version]);
  return results;
}

export function CoachAcademicBoard({ school, classes, today, renderDetail }) {
  const learners = useScopedLearners(school, classes);
  const scoped = useMemo(() => learners.list.map(l => ({ ...l, scopedClassId: l.classIds.find(id => classes.some(c => c.id === id)) })), [learners.list, classes]);
  const [version, setVersion] = useState(0);
  const results = useAcademicResults(school, scoped, version);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const rows = scoped.map(l => academicRow(l, results[l.id], today));
  const totals = summarizeAcademic(rows);
  const order = { none: 0, stale: 1, error: 2, loading: 3, current: 4 };
  const shown = rows.filter(r => filter === 'all' || r.state === filter).sort((a, b) => order[a.state] - order[b.state] || a.learner.displayName.localeCompare(b.learner.displayName));

  if (selected) return <div className="cb-detail"><button type="button" className="gh-btn gh-btn-ghost cb-back" onClick={() => setSelected(null)}><X size={16} />Back to all learners</button>{renderDetail(selected, () => { setSelected(null); setVersion(v => v + 1); })}</div>;
  return <div className="cb-board">
    <div className="cb-source"><GraduationCap size={18} aria-hidden="true" /><div><strong>Coach-recorded observations</strong><p>CambriLearn and Edmentum are not connected yet, so every figure here is a dated observation a coach entered. Missing data is not zero progress.</p></div></div>
    <div className="cb-stats" aria-label="Academic observation summary">
      <BoardStat icon={Users} label="Learners" value={scoped.length} />
      <BoardStat icon={CheckCircle2} label="Observed in last 30 days" value={totals.current} tone="good" />
      <BoardStat icon={Clock} label="Older than 30 days" value={totals.stale} tone={totals.stale ? 'warn' : ''} />
      <BoardStat icon={CircleDashed} label="No observation yet" value={totals.none} tone={totals.none ? 'warn' : ''} hint={totals.loading ? `Checking ${totals.loading} more…` : undefined} />
    </div>
    {learners.error && <p className="sw-error" role="alert">{serviceMessage(learners.error)}</p>}
    {learners.loading && <p role="status" className="cb-muted">Loading learners…</p>}
    {!learners.loading && !learners.error && !scoped.length && <NoSchoolLearners subject="Academic Progress" />}
    {scoped.length > 0 && <>
      <div className="cb-filters" role="group" aria-label="Filter learners">{ACADEMIC_FILTERS.map(([id, label]) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
      {!shown.length ? <BoardEmpty icon={CheckCircle2} title="No learners match this filter"><p>Choose another filter to see the rest of your class.</p></BoardEmpty> :
        <ul className="cb-rows">{shown.map(r => <li key={r.learner.id}>
          <button type="button" className="cb-row" onClick={() => setSelected(r.learner.id)} aria-label={`Open academic observations for ${r.learner.displayName}`}>
            <span className="cb-avatar" aria-hidden="true">{r.learner.displayName.charAt(0)}</span>
            <span className="cb-row-main"><strong>{r.learner.displayName}</strong><small>{classes.filter(c => r.learner.classIds.includes(c.id)).map(c => c.name).join(', ')}</small></span>
            <span className="cb-row-goal">{r.courses.length ? <span className="cb-courses">{r.courses.slice(0, 3).map(c => <span key={c.id} className="cb-course"><span>{c.course}</span><span className="cb-meter" aria-label={`${c.completed} of ${c.total} units`}><span style={{ width: `${Math.min(100, Math.round(c.completed / c.total * 100))}%` }} /></span><small>{c.completed}/{c.total}</small></span>)}{r.courses.length > 3 && <small>+{r.courses.length - 3} more</small>}</span> : <span className="cb-muted">{r.state === 'error' ? serviceMessage(r.error) : r.state === 'loading' ? 'Checking…' : 'Record a first observation'}</span>}</span>
            <span className="cb-row-meta">{r.lastObserved && <small>Observed {r.lastObserved}</small>}</span>
            <span className={`cb-badge cb-badge-${r.state}`}>{ACADEMIC_LABEL[r.state]}</span>
            <span className="cb-row-action">{r.courses.length ? 'Open' : <><Plus size={14} />Record</>}<ChevronRight size={16} aria-hidden="true" /></span>
          </button>
        </li>)}</ul>}
    </>}
  </div>;
}
