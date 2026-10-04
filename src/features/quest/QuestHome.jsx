/**
 * Teen Quest student home (design: Growth Hub Teen Quest Redesign canvas).
 *
 * QuestArea decides what a secondary learner sees on their home tab:
 * - the school has not switched quest mode on → the existing W2e Studio Home
 * - the learner chose Calm view → Studio Home with a way back
 * - otherwise → Quest Home, Quest Map and Badges
 *
 * XP, levels, badges and streaks come only from /api/quest/me; this file
 * displays them and reports learner actions, it never awards anything itself.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Zap, Trophy, Map as MapIcon, House, Award, Check, Lock, MessageCircle, PenLine, FlaskConical, ArrowRight, X, Search, FileText, Layers, RefreshCw, Target, Leaf, Bot } from 'lucide-react';
import { auth, db, doc, setDoc } from '../../firebase.js';
import { TERM, PHASES } from '../pbl/content/pblModel.js';
import { usePblProject } from '../pbl/engine/usePblProject.js';
import { toggleTask } from '../pbl/engine/pblProject.js';
import { W2eLearnerStudio } from '../school/W2eLearnerStudio.jsx';
import { mutateSchool, schoolPath, serviceMessage } from '../school/useSchoolWorkspace.js';
import { useQuest } from './useQuest.js';
import { todaysQuest, weekStrip, localDate, badgeById, REFLECTION_MIN_LENGTH, XP_RULES } from './questModel.js';
import './quest.css';

const BADGE_ICONS = { file: FileText, layers: Layers, refresh: RefreshCw, search: Search, pen: PenLine, check: Check, target: Target, trophy: Trophy, flame: Flame };
const BADGE_COLORS = ['#96d700', '#6e3f8b', '#ff9a4d', '#5cc8ff', '#ff6fb1'];
const BADGE_INK = ['#1c2b00', '#ffffff', '#3d1600', '#06263f', '#3d0a22'];
const SUPPORT = [
  ['first_step', 'Help me take the first step'],
  ['explain_different', 'Explain it a different way'],
  ['need_break', 'I need a short break'],
  ['private_talk', 'I would like to talk privately']
];
const WIN_LABELS = {
  task_step: 'Project step done',
  reflection: 'Reflection written',
  goal_acknowledged: 'Goal accepted',
  evidence_submitted: 'Evidence submitted',
  evidence_reviewed: 'Coach feedback received',
  goal_achieved: 'Goal achieved'
};
// Quest Map positions (percent of the map canvas), one per PBL phase.
const MAP_SPOTS = [[8, 78], [22, 46], [37, 70], [51, 36], [65, 62], [79, 32], [91, 64]];

export function QuestArea({ school, classes, learnerName, onNavigate, onJoined, onChooseProgram }) {
  const enabled = school?.features?.questMode === true;
  const quest = useQuest(enabled);
  const studio = <W2eLearnerStudio school={school} classes={classes} learnerName={learnerName} onNavigate={onNavigate} onJoined={onJoined} onChooseProgram={onChooseProgram} />;
  if (!enabled) return studio;
  if (quest.loading && !quest.data) return <div className="qx"><p role="status" className="qx-muted">Loading your quest…</p></div>;
  if (quest.error && !quest.data) {
    return <>
      <div className="qx-calm-banner" role="status"><span>Your quest progress could not load: {serviceMessage(quest.error)}</span><button type="button" className="qx-link" onClick={quest.reload}>Try again</button></div>
      {studio}
    </>;
  }
  if (quest.data?.preferences?.calmView) {
    return <>
      <div className="qx-calm-banner"><span><Leaf size={16} aria-hidden="true" style={{ verticalAlign: '-3px', marginRight: 6 }} />Calm view is on. Your XP and badges are still saved.</span>
        <button type="button" className="qx-link" disabled={quest.busy} onClick={() => quest.setPreferences({ calmView: false })}>Switch to Quest Home</button></div>
      {studio}
    </>;
  }
  return <QuestHome quest={quest} school={school} classes={classes} learnerName={learnerName} onNavigate={onNavigate} />;
}

export function QuestHome({ quest, school, classes, learnerName }) {
  const [view, setView] = useState('home');
  const [dialog, setDialog] = useState(null); // 'reflect' | 'support'
  const [status, setStatus] = useState(null);
  const uid = auth?.currentUser?.uid || null;
  const { project, apply } = usePblProject(uid, TERM.id);
  const data = quest.data;
  const today = data.today;
  const holidays = useMemo(() => new Set(data.holidays || []), [data.holidays]);
  const current = useMemo(() => todaysQuest(project, PHASES) || data.todaysQuest, [project, data.todaysQuest]);
  const name = (learnerName || '').split(' ')[0] || 'there';

  async function completeStep(phaseId, index) {
    setStatus(null);
    const next = toggleTask(project, phaseId, index);
    apply(() => next);
    try {
      // Save the tick now (not after the usual debounce) so the server can verify it.
      if (uid) await setDoc(doc(db, 'users', `${uid}/activityProgress/pbl-${TERM.id}`), { ...next, activityId: `pbl-${TERM.id}` });
      const result = await quest.recordStep(phaseId, index);
      if (result?.duplicate) setStatus({ text: 'Step saved. You already earned XP for this one.' });
      else if (result?.capped && !result.awarded) setStatus({ text: 'Step saved. You reached today\'s XP limit for self-checked steps. Evidence and coach reviews still earn XP.' });
      else setStatus({ text: `Step done. +${result?.awarded ?? XP_RULES.task_step.xp} XP` });
    } catch (e) {
      setStatus({ tone: 'error', text: `Your step is saved, but XP could not be added yet: ${serviceMessage(e)}` });
    }
  }

  async function reflect(text) {
    try {
      const result = await quest.reflect(text);
      setDialog(null);
      setStatus({ text: result?.duplicate ? 'Reflection saved. Today\'s reflection XP was already added.' : `Reflection saved. +${result?.awarded ?? 0} XP` });
    } catch (e) {
      return serviceMessage(e);
    }
    return null;
  }

  const tabs = [['home', 'Quest Home', House], ['map', 'Quest Map', MapIcon], ['badges', 'Badges', Award]];
  return <div className="qx">
    <div className="qx-bar">
      <nav className="qx-tabs" aria-label="Quest sections">
        {tabs.map(([id, label, Icon]) => <button key={id} type="button" aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}><Icon aria-hidden="true" />{label}</button>)}
      </nav>
      <div className="qx-chips">
        <span className="qx-chip qx-chip-flame"><Flame aria-hidden="true" />{data.streak.count}-day streak</span>
        <span className="qx-chip qx-chip-xp"><Zap aria-hidden="true" />{data.level.xp.toLocaleString('en-US')} XP</span>
        <button type="button" className="qx-btn qx-btn-ghost" style={{ minHeight: 40 }} disabled={quest.busy} onClick={() => quest.setPreferences({ calmView: true })} title="Hide game elements. Your XP and badges stay saved."><Leaf aria-hidden="true" />Calm view</button>
      </div>
    </div>
    {status && <p className="qx-status" role="status" data-tone={status.tone}>{status.text}</p>}

    {view === 'home' && <>
      <div className="qx-grid">
        <PlayerCard data={data} name={learnerName} today={today} holidays={holidays} />
        <TodayQuest current={current} project={project} busy={quest.busy} onComplete={completeStep} onAsk={() => setDialog('support')} name={name} />
      </div>
      <Boosts data={data} today={today} onReflect={() => setDialog('reflect')} onAsk={() => setDialog('support')} />
      <div className="qx-grid">
        <StagePath project={project} onOpenMap={() => setView('map')} current={current} />
        <BadgeShelf data={data} onOpen={() => setView('badges')} />
      </div>
      {data.squad && <Squad squad={data.squad} />}
    </>}
    {view === 'map' && <QuestMap project={project} current={current} onBack={() => setView('home')} />}
    {view === 'badges' && <BadgeCabinet data={data} />}

    {dialog === 'reflect' && <ReflectDialog onClose={() => setDialog(null)} onSave={reflect} busy={quest.busy} />}
    {dialog === 'support' && <SupportDialog onClose={() => setDialog(null)} school={school} classes={classes} onSent={() => { setDialog(null); setStatus({ text: 'Your coach has been asked. They will check in with you.' }); }} />}
    {data.celebrations?.length > 0 && !dialog && <Celebration items={data.celebrations} busy={quest.busy} onClose={quest.acknowledge} />}
  </div>;
}

function PlayerCard({ data, name, today, holidays }) {
  const pct = Math.round(Math.max(0, Math.min(1, data.level.progress)) * 100);
  const initials = (name || 'Me').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const strip = weekStrip(data.streak, today, holidays);
  return <section className="qx-player" aria-labelledby="qx-player-title">
    <div className="qx-id">
      <div className="qx-ring" style={{ background: `conic-gradient(#96d700 0 ${pct}%, rgba(255,255,255,.18) ${pct}% 100%)` }}><span aria-hidden="true">{initials}</span></div>
      <div>
        <div className="qx-level">Level {data.level.level}</div>
        <h2 id="qx-player-title" className="qx-num qx-title">{data.level.title}</h2>
      </div>
    </div>
    <div className="qx-meter">
      <div className="qx-meter-row"><span><b className="qx-num">{data.level.xp.toLocaleString('en-US')}</b> / {data.level.next.toLocaleString('en-US')} XP</span><span>{data.level.toNext.toLocaleString('en-US')} XP to Level {data.level.level + 1}</span></div>
      <div className="qx-bar-track" role="progressbar" aria-label={`Progress to level ${data.level.level + 1}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div className="qx-bar-fill" style={{ width: `${pct}%` }} /></div>
    </div>
    <div className="qx-meter">
      <div className="qx-streak-head">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Flame aria-hidden="true" />{data.streak.count > 0 ? `${data.streak.count}-day learning streak` : 'Start a streak today'}</span>
        <span className="qx-note">{data.streak.freezes ? `${data.streak.freezes} streak freeze${data.streak.freezes > 1 ? 's' : ''} ready` : 'Earn a streak freeze every 5 days'}</span>
      </div>
      <ol className="qx-week" aria-label="This week">
        {strip.map(d => <li key={d.date} data-state={d.state}><i aria-hidden="true" />{d.state === 'today' ? 'Today' : d.label}<span className="qx-sr">{d.state === 'done' ? 'learned' : d.state === 'off' ? 'school holiday' : d.state === 'today' ? 'not yet today' : ''}</span></li>)}
      </ol>
      <span className="qx-note">Weekends and school holidays never break a streak.</span>
    </div>
    <div className="qx-wins">
      <h3>Recent wins</h3>
      {data.recent?.length ? <ul>{data.recent.slice(0, 4).map((e, i) => <li key={i}><span>{WIN_LABELS[e.type] || 'Learning activity'}</span><b>+{e.xp} XP</b></li>)}</ul>
        : <p className="qx-note">Finish a step or write a reflection to start earning XP.</p>}
    </div>
  </section>;
}

function TodayQuest({ current, project, busy, onComplete, onAsk, name }) {
  if (!current) {
    return <section className="qx-card qx-quest" aria-labelledby="qx-today">
      <span className="qx-eyebrow">Today's quest</span>
      <h2 id="qx-today" className="qx-num">Every project task is done, {name}.</h2>
      <p className="qx-muted">Ask your coach what to do next, or add evidence to your portfolio.</p>
      <div className="qx-actions"><button type="button" className="qx-btn qx-btn-ghost" onClick={onAsk}><MessageCircle aria-hidden="true" />Ask my coach</button></div>
    </section>;
  }
  const phase = PHASES.find(p => p.id === current.phaseId);
  const done = new Set(project?.tasksDone?.[phase.id] || []);
  return <section className="qx-card qx-quest" aria-labelledby="qx-today">
    <div className="qx-card-head">
      <span className="qx-eyebrow">Today's quest · {phase.title}</span>
      <span className="qx-chip qx-chip-reward"><Zap aria-hidden="true" />+{XP_RULES.task_step.xp} XP per step</span>
    </div>
    <h2 id="qx-today" className="qx-num">{current.task}</h2>
    <p className="qx-muted">{phase.goal}</p>
    <div className="qx-chips"><span className="qx-chip qx-chip-soft">Weeks {phase.weeks[0]}–{phase.weeks[1]}</span><span className="qx-chip qx-chip-soft">{done.size} of {phase.tasks.length} steps done</span></div>
    <ol className="qx-steps">
      {phase.tasks.map((task, i) => {
        const state = done.has(i) ? 'done' : i === current.index ? 'next' : 'todo';
        return <li key={i} data-state={state}><span className="qx-box" aria-hidden="true">{state === 'done' && <Check />}</span><span>{task}</span><span className="qx-sr">{state === 'done' ? '(done)' : state === 'next' ? '(next step)' : ''}</span></li>;
      })}
    </ol>
    <div className="qx-actions">
      <button type="button" className="qx-btn qx-btn-go" disabled={busy} onClick={() => onComplete(current.phaseId, current.index)}>Mark this step done<ArrowRight aria-hidden="true" /></button>
      <button type="button" className="qx-btn qx-btn-ghost" onClick={onAsk}><MessageCircle aria-hidden="true" />Ask my coach</button>
    </div>
  </section>;
}

function Boosts({ data, today, onReflect, onAsk }) {
  const reflectedToday = (data.recent || []).some(e => e.type === 'reflection' && localDate(new Date(e.createdAt), data.timezone) === today);
  return <section aria-labelledby="qx-boosts" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div className="qx-card-head"><h2 id="qx-boosts" style={{ fontSize: 20, fontWeight: 800 }}>Quick boosts</h2><span className="qx-muted" style={{ fontSize: 13 }}>Pick any. Each takes under 5 minutes.</span></div>
    <div className="qx-boosts">
      <button type="button" className="qx-boost" onClick={onReflect} disabled={reflectedToday}>
        <span className="qx-boost-icon" style={{ background: 'var(--q-plum-100)', color: 'var(--q-plum)' }}><PenLine aria-hidden="true" /></span>
        <strong>{reflectedToday ? 'Reflection done for today' : 'Write a 2-minute reflection'}</strong>
        <small>What surprised you today? Only you can read it.</small>
        <span className="qx-chip qx-chip-reward" style={{ alignSelf: 'flex-start' }}>{reflectedToday ? 'Earned' : `+${XP_RULES.reflection.xp} XP`}</span>
      </button>
      <a className="qx-boost" href="#/courses" style={{ textDecoration: 'none' }}>
        <span className="qx-boost-icon" style={{ background: 'var(--q-sky-100)', color: 'var(--q-sky)' }}><FlaskConical aria-hidden="true" /></span>
        <strong>Side quest: try a STEAM lab</strong>
        <small>Explore needs at least two STEAM activities.</small>
        <span className="qx-chip qx-chip-soft" style={{ alignSelf: 'flex-start' }}>Counts toward Explore</span>
      </a>
      <button type="button" className="qx-boost" onClick={onAsk}>
        <span className="qx-boost-icon" style={{ background: 'var(--q-flame-100)', color: 'var(--q-flame-text)' }}><MessageCircle aria-hidden="true" /></span>
        <strong>Stuck? Ask your coach</strong>
        <small>Get a first step, a new explanation or a break.</small>
        <span className="qx-chip qx-chip-soft" style={{ alignSelf: 'flex-start' }}>Private</span>
      </button>
    </div>
  </section>;
}

function stageStates(project, current) {
  return PHASES.map((p, i) => {
    const done = (project?.tasksDone?.[p.id] || []).length;
    const complete = done >= p.tasks.length;
    const state = complete ? 'done' : current?.phaseId === p.id ? 'current' : i === PHASES.length - 1 ? 'final' : 'todo';
    return { ...p, done, state, index: i };
  });
}

function StagePath({ project, current, onOpenMap }) {
  const stages = stageStates(project, current);
  const cur = stages.find(s => s.state === 'current');
  return <section className="qx-card" aria-labelledby="qx-path">
    <div className="qx-card-head"><h2 id="qx-path">{TERM.theme}</h2><button type="button" className="qx-link" onClick={onOpenMap}>Open Quest Map</button></div>
    <ol className="qx-path">
      {stages.map(s => <li key={s.id} data-state={s.state}><span className="qx-node" aria-hidden="true">{s.state === 'done' ? <Check /> : s.state === 'final' ? <Trophy /> : s.index + 1}</span>{s.title}<span className="qx-sr">{s.state === 'done' ? '(complete)' : s.state === 'current' ? '(current stage)' : ''}</span></li>)}
    </ol>
    {cur && <div className="qx-callout"><span className="qx-num">{cur.done}/{cur.tasks.length}</span><span>{cur.title} steps done. {cur.tasks.length - cur.done} more to finish this stage.</span></div>}
  </section>;
}

function BadgeTile({ badge, index }) {
  const Icon = BADGE_ICONS[badge.icon] || Award;
  const c = index % BADGE_COLORS.length;
  return <div className="qx-badge" data-earned={String(badge.earned)}>
    <span className="qx-badge-tile" style={badge.earned ? { background: BADGE_COLORS[c], color: BADGE_INK[c], transform: `rotate(${index % 2 ? 3 : -4}deg)` } : undefined} aria-hidden="true">{badge.earned ? <Icon /> : <Lock />}</span>
    {badge.name}<span className="qx-sr">{badge.earned ? '(earned)' : '(locked)'}</span>
  </div>;
}

function BadgeShelf({ data, onOpen }) {
  const earned = data.badges.filter(b => b.earned);
  const shelf = [...earned.slice(-3), ...(data.nextBadge ? [data.badges.find(b => b.id === data.nextBadge.id)] : [])].slice(-4);
  return <section className="qx-card" aria-labelledby="qx-badges">
    <div className="qx-card-head"><h2 id="qx-badges">Badges</h2><button type="button" className="qx-link" onClick={onOpen}>See all {data.badges.length}</button></div>
    {shelf.length ? <div className="qx-badges">{shelf.map((b, i) => <BadgeTile key={b.id} badge={b} index={data.badges.indexOf(b) >= 0 ? data.badges.indexOf(b) : i} />)}</div> : <p className="qx-muted">Your first badge is one piece of evidence away.</p>}
    {data.nextBadge && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="qx-card-head" style={{ fontSize: 13 }}><strong>Next: {data.nextBadge.name}</strong><span className="qx-muted">{data.nextBadge.value} of {data.nextBadge.target}</span></div>
      <div className="qx-small-track" role="progressbar" aria-label={`Progress to ${data.nextBadge.name}`} aria-valuemin={0} aria-valuemax={data.nextBadge.target} aria-valuenow={data.nextBadge.value}><div style={{ width: `${Math.round(data.nextBadge.progress * 100)}%` }} /></div>
    </div>}
  </section>;
}

function Squad({ squad }) {
  const pct = Math.min(100, Math.round((squad.count / Math.max(1, squad.goal)) * 100));
  return <section className="qx-squad" aria-labelledby="qx-squad">
    <div>
      <span className="qx-eyebrow">Squad goal · {squad.className}</span>
      <h2 id="qx-squad">{squad.goal} pieces of evidence this term</h2>
      <p>Everyone's evidence counts toward one shared goal.</p>
    </div>
    <div>
      <div className="qx-card-head" style={{ color: 'var(--q-lime-text)', fontWeight: 800 }}><span className="qx-num">{squad.count} / {squad.goal}</span><span>{pct}%</span></div>
      <div className="qx-squad-track" role="progressbar" aria-label="Squad goal progress" aria-valuemin={0} aria-valuemax={squad.goal} aria-valuenow={squad.count}><div style={{ width: `${pct}%` }} /></div>
    </div>
  </section>;
}

function QuestMap({ project, current, onBack }) {
  const stages = stageStates(project, current);
  const [selected, setSelected] = useState((stages.find(s => s.state === 'current') || stages[0]).id);
  const stage = stages.find(s => s.id === selected);
  const done = new Set(project?.tasksDone?.[stage.id] || []);
  const path = MAP_SPOTS.map(([x, y], i) => `${i ? 'L' : 'M'}${x * 10} ${y * 5.6}`).join(' ');
  return <div className="qx-map-wrap">
    <div className="qx-map">
      <div className="qx-map-canvas">
        <svg className="qx-trail" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true"><path d={path} fill="none" stroke="#4d2f6b" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {stages.map((s, i) => {
          const [x, y] = MAP_SPOTS[i];
          return <button key={s.id} type="button" className="qx-stage" data-state={s.state} aria-pressed={selected === s.id} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => setSelected(s.id)}>
            <span className="qx-stage-dot" aria-hidden="true">{s.state === 'done' ? <Check /> : s.state === 'final' ? <Trophy /> : i + 1}</span>
            <span className="qx-stage-label">{s.title}{s.state === 'current' ? ' · you are here' : ''}</span>
            <span className="qx-stage-weeks">Weeks {s.weeks[0]}–{s.weeks[1]} · {s.done}/{s.tasks.length}</span>
          </button>;
        })}
      </div>
    </div>
    <aside className="qx-card qx-stage-panel" aria-labelledby="qx-stage-title">
      <div className="qx-card-head"><span className="qx-eyebrow">Stage {stage.index + 1} · Weeks {stage.weeks[0]}–{stage.weeks[1]}</span><span className="qx-chip qx-chip-reward">{stage.state === 'done' ? 'Complete' : stage.state === 'current' ? 'In progress' : 'Coming up'}</span></div>
      <h2 id="qx-stage-title" className="qx-num" style={{ fontSize: 26 }}>{stage.title}</h2>
      <p className="qx-muted">{stage.goal}</p>
      <ol className="qx-steps">
        {stage.tasks.map((task, i) => <li key={i} data-state={done.has(i) ? 'done' : 'todo'}><span className="qx-box" aria-hidden="true">{done.has(i) && <Check />}</span><span>{task}</span></li>)}
      </ol>
      <p className="qx-muted" style={{ fontSize: 13 }}>Each step: +{XP_RULES.task_step.xp} XP. Evidence: +{XP_RULES.evidence_submitted.xp} XP, and +{XP_RULES.evidence_reviewed.xp} XP when your coach gives feedback.</p>
      <div className="qx-actions">
        <button type="button" className="qx-btn qx-btn-go" onClick={onBack}>Back to today's quest</button>
        <a className="qx-btn qx-btn-ghost" href="#/pbl"><Bot aria-hidden="true" />Open PBL Studio</a>
      </div>
    </aside>
  </div>;
}

function BadgeCabinet({ data }) {
  const groups = [['Earned', data.badges.filter(b => b.earned)], ['Still to earn', data.badges.filter(b => !b.earned)]];
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {groups.map(([title, list]) => list.length > 0 && <section key={title} className="qx-card" aria-label={title}>
      <h2 style={{ fontSize: 20, fontWeight: 800 }}>{title} <span className="qx-muted" style={{ fontSize: 14 }}>({list.length})</span></h2>
      <div className="qx-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
        {list.map(b => <article key={b.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <BadgeTile badge={b} index={data.badges.indexOf(b)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
            <span className="qx-eyebrow" style={{ fontSize: 11 }}>{b.competency}</span>
            <span style={{ fontSize: 14 }}>{b.description}</span>
            {b.earned ? <span className="qx-muted" style={{ fontSize: 12 }}>Earned {b.earnedAt?.slice(0, 10)}</span>
              : <><div className="qx-small-track" role="progressbar" aria-label={`Progress to ${b.name}`} aria-valuemin={0} aria-valuemax={b.target} aria-valuenow={b.value}><div style={{ width: `${Math.round(b.progress * 100)}%` }} /></div><span className="qx-muted" style={{ fontSize: 12 }}>{b.value} of {b.target}</span></>}
          </div>
        </article>)}
      </div>
    </section>)}
  </div>;
}

function Modal({ labelId, onClose, children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector('button, textarea, input')?.focus();
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, [onClose]);
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(18,8,32,.6)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelId} className={`qx-dialog ${className}`}>{children}</div>
  </div>;
}

function ReflectDialog({ onClose, onSave, busy }) {
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const short = text.trim().length < REFLECTION_MIN_LENGTH;
  return <Modal labelId="qx-reflect-title" onClose={onClose}>
    <form className="qx-dialog-body" onSubmit={async e => { e.preventDefault(); setError(await onSave(text.trim())); }}>
      <div className="qx-card-head"><h2 id="qx-reflect-title" style={{ fontSize: 22 }}>2-minute reflection</h2><button type="button" className="qx-link" aria-label="Close" onClick={onClose}><X size={20} /></button></div>
      <label htmlFor="qx-reflection">What surprised you today, or what would you like to find out next?</label>
      <textarea id="qx-reflection" value={text} maxLength={2000} onChange={e => setText(e.target.value)} />
      <span className="qx-muted" style={{ fontSize: 13 }}>{short ? `${REFLECTION_MIN_LENGTH - text.trim().length} more characters to go.` : 'Ready to save.'} Only you can read your reflections.</span>
      {error && <p className="qx-status" data-tone="error" role="alert">{error}</p>}
      <div className="qx-actions"><button type="submit" className="qx-btn qx-btn-go" disabled={short || busy}>Save reflection · +{XP_RULES.reflection.xp} XP</button></div>
    </form>
  </Modal>;
}

function SupportDialog({ onClose, onSent, school, classes }) {
  const [category, setCategory] = useState('first_step');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const classId = classes?.[0]?.id;
  return <Modal labelId="qx-support-title" onClose={onClose}>
    <form className="qx-dialog-body" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setError(null);
      try { await mutateSchool('POST', schoolPath(school.id, 'support-requests'), { classId, category, note }); onSent(); }
      catch (err) { setError(serviceMessage(err)); }
      finally { setBusy(false); }
    }}>
      <div className="qx-card-head"><h2 id="qx-support-title" style={{ fontSize: 22 }}>Ask my coach</h2><button type="button" className="qx-link" aria-label="Close" onClick={onClose}><X size={20} /></button></div>
      {!classId && <p className="qx-status" data-tone="error">Join a class first so your coach can see your request.</p>}
      <fieldset className="qx-options" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ marginBottom: 8, fontWeight: 700 }}>What would help?</legend>
        {SUPPORT.map(([id, label]) => <label key={id}><input type="radio" name="qx-support" value={id} checked={category === id} onChange={() => setCategory(id)} />{label}</label>)}
      </fieldset>
      <label htmlFor="qx-support-note">Anything else? (optional)</label>
      <textarea id="qx-support-note" value={note} maxLength={500} onChange={e => setNote(e.target.value)} style={{ minHeight: 80 }} />
      {error && <p className="qx-status" data-tone="error" role="alert">{error}</p>}
      <div className="qx-actions"><button type="submit" className="qx-btn qx-btn-go" disabled={busy || !classId}>Send to my coach</button></div>
    </form>
  </Modal>;
}

function Celebration({ items, onClose, busy }) {
  const level = [...items].reverse().find(c => c.kind === 'level');
  const badges = items.filter(c => c.kind === 'badge');
  const lead = !level && badges[0] ? badgeById(badges[0].badgeId) : null;
  const rest = level ? badges : badges.slice(1);
  const LeadIcon = lead ? BADGE_ICONS[lead.icon] || Award : null;
  return <Modal labelId="qx-celebrate-title" onClose={onClose} className="qx-celebrate">
    <div className="qx-dialog-body qx-celebrate">
      <span className="qx-eyebrow" style={{ color: '#cfe98a' }}>{level ? 'Level up' : 'New badge'}</span>
      {level && <div className="qx-big-ring"><div><span style={{ fontSize: 12, letterSpacing: '.16em', color: '#cfe98a', fontWeight: 800 }}>LEVEL</span><span className="qx-num">{level.level}</span></div></div>}
      {lead && <span className="qx-badge-tile qx-big-badge" aria-hidden="true"><LeadIcon /></span>}
      <h2 id="qx-celebrate-title" className="qx-num" style={{ fontSize: 26 }}>{level ? level.title : lead?.name || badges[0]?.name}</h2>
      {lead && <p style={{ color: '#d9c9e8' }}>{lead.description}<br /><span style={{ fontSize: 13 }}>Skill: {lead.competency}</span></p>}
      {rest.map(b => <div key={b.badgeId} className="qx-earned"><span className="qx-badge-tile" style={{ background: '#ff9a4d', color: '#3d1600', flex: 'none' }} aria-hidden="true"><Award /></span><div><div className="qx-eyebrow" style={{ color: '#cfe98a', fontSize: 11 }}>Badge earned</div><strong>{b.name}</strong></div></div>)}
      <button type="button" className="qx-btn qx-btn-go" style={{ width: '100%' }} disabled={busy} onClick={onClose}>Keep going</button>
    </div>
  </Modal>;
}
