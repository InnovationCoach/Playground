import { useEffect, useMemo, useState } from 'react';
import { Paintbrush, RotateCcw, X, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { TERM, INTERESTS } from '../pbl/content/pblModel.js';
import { readiness } from '../pbl/engine/pblProject.js';
import { initials } from '../shell/Avatar.jsx';
import { hrefFor } from '../../app/routes.js';
import { Alert } from '../admin/ui/bits.jsx';
import { JoinClassPanel } from '../enrolment/JoinClassPanel.jsx';
import '../enrolment/joinPanel.css';
import { useGoalPlan } from '../goals/useGoalPlan.js';
import { todayItems, checkedToday, toggleToday } from '../goals/goalPlan.js';
import { NotesWidget } from './NotesWidget.jsx';
import { FocusWidget } from '../focus/FocusWidget.jsx';
import '../admin/admin.css';
import '../pbl/pbl.css';
import './myDashboard.css';
import {
  WIDGETS, ACCENTS, COVERS, DEFAULT_PREFS, MAX_INTERESTS, MAX_TAGLINE,
  loadSignals, dayKey, streakDays, academicProgress, projectProgress, xpSummary, badgeStatus, nextStep,
  toggleHidden, moveWidget, toggleInterest, goalSummary, skillOfTheWeek
} from './dashboardModel.js';
import { useDashboardPrefs, useCloudProject, logVisit, saveMood, deviceStorage } from './dashboardStore.js';
import {
  ProgressWidget, NextStepWidget, JourneyWidget, GoalsWidget, CheckinWidget,
  PickedWidget, BadgesWidget, ReadinessWidget, StreakChip, Meter, TodayWidget, SkillWidget
} from './DashboardWidgets.jsx';

/**
 * My Dashboard: the learner's personal home for the term.
 *
 * Shows academic study and PBL progress, today's checklist, the next step,
 * goals, the project journey, a daily check-in, a Future Skill of the week,
 * notes and badges. Every widget can be hidden or moved, and the look (accent,
 * cover, tagline, interests) is the learner's own choice. Goals are read live
 * from the Goals page (useGoalPlan), so ticking a step here or there is one save.
 */
const WIDGET_TITLE = Object.fromEntries(WIDGETS.map((w) => [w.id, w]));
const SYNC_TEXT = {
  idle: 'Saved on this device',
  saving: 'Saving...',
  saved: 'Saved to your account',
  'local-only': 'Saved on this device. We will try to save to your account again.'
};

export function MyDashboard({ uid, profile, classIds = [], onJoined, onOpenActivity }) {
  const { prefs, update, syncState } = useDashboardPrefs(uid);
  const { plan, update: updatePlan } = useGoalPlan(uid);
  const cloudProject = useCloudProject(uid);
  const [signals, setSignals] = useState(() => loadSignals(uid, deviceStorage()));
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const visits = logVisit(uid, dayKey(new Date()));
    setSignals((s) => ({ ...s, visits }));
  }, [uid]);

  // The account copy of the project wins when it was saved after this device's copy.
  const project = cloudProject && (cloudProject.updatedAt || 0) > (signals.project.updatedAt || 0)
    ? cloudProject
    : signals.project;

  const model = useMemo(() => {
    const streak = streakDays(signals.visits, signals.today);
    const ready = readiness(project);
    const goals = goalSummary(plan);
    return {
      streak,
      goals,
      academic: academicProgress(signals),
      pbl: projectProgress(project, goals, signals.started),
      xp: xpSummary({ started: signals.started, goals, project, readyDone: ready.done }),
      badges: badgeStatus({ started: signals.started, goals, project, streak }),
      next: nextStep({ started: signals.started, goals, project }),
      checks: ready.checks,
      today: todayItems(plan, signals.today),
      ticked: checkedToday(plan, signals.today),
      skill: skillOfTheWeek()
    };
  }, [signals, project, plan]);

  const cover = COVERS.find((c) => c.id === prefs.cover) || COVERS[0];
  const accent = (ACCENTS.find((a) => a.id === prefs.accent) || ACCENTS[0]).value;
  const firstName = String(profile?.displayName || '').split(' ')[0];
  const name = profile?.displayName || 'Learner';
  const visible = prefs.order.filter((id) => !prefs.hidden.includes(id));

  function openTarget(target) {
    if (target.type === 'goals') window.location.hash = hrefFor.goals();
    else if (target.type === 'activity') onOpenActivity?.(target.id);
    else window.location.hash = hrefFor.pbl(target.tab);
  }

  function onMood(id) {
    saveMood(uid, id, signals.today);
    setSignals((s) => ({ ...s, mood: id }));
  }

  function renderWidget(id) {
    switch (id) {
      case 'progress':
        return <ProgressWidget academic={model.academic} pbl={model.pbl} onOpenProject={() => openTarget({ type: 'pbl', tab: 'project' })} />;
      case 'nextStep':
        return <NextStepWidget next={model.next} onAction={openTarget} />;
      case 'journey':
        return <JourneyWidget project={project} onOpenProject={() => openTarget({ type: 'pbl', tab: 'project' })} />;
      case 'goals':
        return <GoalsWidget goals={model.goals} onOpenGoals={() => openTarget({ type: 'goals' })} />;
      case 'today':
        return (
          <TodayWidget items={model.today} checked={model.ticked} onOpenGoals={() => openTarget({ type: 'goals' })}
                       onToggle={(item) => updatePlan((p) => toggleToday(p, item, signals.today))} />
        );
      case 'focus':
        return <FocusWidget focusOn={model.today.find((i) => !model.ticked.has(i.id))?.text} />;
      case 'skill':
        return <SkillWidget skill={model.skill} onOpenSkills={() => { window.location.hash = hrefFor.futureSkills(); }} />;
      case 'notes':
        return <NotesWidget />;
      case 'checkin':
        return (
          <CheckinWidget
            today={signals.today}
            mood={signals.mood}
            onMood={onMood}
            onOpenPortfolio={() => openTarget({ type: 'pbl', tab: 'portfolio' })}
          />
        );
      case 'picked':
        return (
          <PickedWidget
            interests={prefs.interests}
            onOpenActivity={(activityId) => openTarget({ type: 'activity', id: activityId })}
            onOpenPanel={() => setPanelOpen(true)}
          />
        );
      case 'badges':
        return <BadgesWidget badges={model.badges} />;
      case 'readiness':
        return <ReadinessWidget checks={model.checks} evidence={model.pbl.evidence} onOpenPortfolio={() => openTarget({ type: 'pbl', tab: 'portfolio' })} />;
      default:
        return null;
    }
  }

  return (
    <div className={`gh-app md-root${prefs.calm ? ' md-calm' : ''}`} style={{ '--md-accent': accent }}>
      <div className="gh-page md-page">
        <header className="md-hero" style={{ background: cover.css }}>
          <div className="md-hero-top">
            <span className="md-kicker">My Dashboard · {TERM.label}</span>
            <button type="button" className="md-btn md-btn-light" onClick={() => setPanelOpen(true)} aria-expanded={panelOpen}>
              <Paintbrush size={16} aria-hidden="true" /> Personalise
            </button>
          </div>

          <div className="md-hero-body">
            <span className="md-avatar" aria-hidden="true">{initials(name)}</span>
            <div className="md-hero-text">
              <h1>{firstName ? `Hi, ${firstName}` : 'Hi there'}</h1>
              <p className="md-tagline">{prefs.tagline || 'My learning space: ideas, discoveries and next steps.'}</p>
              <div className="md-chips">
                <span className="md-chip md-chip-level">Level {model.xp.level}</span>
                <span className="md-chip">{model.xp.xp} XP</span>
                <StreakChip days={model.streak} />
              </div>
              <div className="md-xp" role="group" aria-label="Experience to next level">
                <Meter label={`Progress to level ${model.xp.level + 1}`} percent={model.xp.intoLevel} detail={`${100 - model.xp.intoLevel} XP to go`} />
              </div>
            </div>
          </div>
        </header>

        {uid && classIds.length === 0 && (
          <JoinClassPanel uid={uid} classIds={classIds} onJoined={onJoined} />
        )}

        {visible.length === 0 ? (
          <div className="md-empty">
            <p>Every widget is hidden. Bring some back to see your dashboard.</p>
            <button type="button" className="md-btn md-btn-primary" onClick={() => setPanelOpen(true)}>Personalise</button>
          </div>
        ) : (
          <div className="md-grid">
            {visible.map((id) => (
              <section
                key={id}
                className={`md-card${WIDGET_TITLE[id].wide ? ' md-card-wide' : ''}`}
                aria-labelledby={`md-w-${id}`}
              >
                <div className="md-card-head">
                  <div>
                    <h2 id={`md-w-${id}`}>{WIDGET_TITLE[id].title}</h2>
                    <p className="md-muted">{WIDGET_TITLE[id].hint}</p>
                  </div>
                </div>
                {renderWidget(id)}
              </section>
            ))}
          </div>
        )}
        <p className="md-foot">{SYNC_TEXT[syncState] || SYNC_TEXT.idle}</p>
      </div>

      {panelOpen && (
        <CustomisePanel
          prefs={prefs}
          update={update}
          syncState={syncState}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  );
}

function CustomisePanel({ prefs, update, syncState, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const order = prefs.order;

  return (
    <div className="md-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="md-panel" role="dialog" aria-modal="true" aria-labelledby="md-panel-title">
        <div className="md-panel-head">
          <h2 id="md-panel-title"><Sparkles size={18} aria-hidden="true" /> Personalise your dashboard</h2>
          <button type="button" className="md-icon-btn" onClick={onClose} aria-label="Close personalise panel">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <fieldset className="md-fieldset">
          <legend>Your tagline</legend>
          <input
            className="md-input"
            type="text"
            maxLength={MAX_TAGLINE}
            value={prefs.tagline}
            placeholder="A line about what you are working on"
            onChange={(e) => update((p) => ({ ...p, tagline: e.target.value.slice(0, MAX_TAGLINE) }))}
          />
          <span className="md-muted">{prefs.tagline.length}/{MAX_TAGLINE}</span>
        </fieldset>

        <fieldset className="md-fieldset">
          <legend>Accent colour</legend>
          <div className="md-swatches">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                className="md-swatch"
                style={{ background: a.value }}
                aria-pressed={prefs.accent === a.id}
                aria-label={a.label}
                onClick={() => update((p) => ({ ...p, accent: a.id }))}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="md-fieldset">
          <legend>Cover</legend>
          <div className="md-covers">
            {COVERS.map((c) => (
              <button
                key={c.id}
                type="button"
                className="md-cover-opt"
                style={{ background: c.css }}
                aria-pressed={prefs.cover === c.id}
                onClick={() => update((p) => ({ ...p, cover: c.id }))}
              >
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="md-fieldset">
          <legend>Your interests <span className="md-muted">({prefs.interests.length} of {MAX_INTERESTS})</span></legend>
          <div className="md-chips">
            {INTERESTS.map((label) => {
              const on = prefs.interests.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  className="md-chip md-chip-toggle"
                  aria-pressed={on}
                  disabled={!on && prefs.interests.length >= MAX_INTERESTS}
                  onClick={() => update((p) => toggleInterest(p, label))}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="md-fieldset">
          <legend>Widgets</legend>
          <ul className="md-widget-list">
            {order.map((id, i) => {
              const widget = WIDGET_TITLE[id];
              const shown = !prefs.hidden.includes(id);
              return (
                <li key={id} className="md-widget-row">
                  <label className="md-widget-toggle">
                    <input type="checkbox" checked={shown} onChange={() => update((p) => toggleHidden(p, id))} />
                    <span>{widget.title}</span>
                  </label>
                  <span className="md-widget-move">
                    <button
                      type="button"
                      className="md-icon-btn"
                      disabled={i === 0}
                      onClick={() => update((p) => moveWidget(p, id, -1))}
                      aria-label={`Move ${widget.title} up`}
                    >
                      <ArrowUp size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="md-icon-btn"
                      disabled={i === order.length - 1}
                      onClick={() => update((p) => moveWidget(p, id, 1))}
                      aria-label={`Move ${widget.title} down`}
                    >
                      <ArrowDown size={16} aria-hidden="true" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <fieldset className="md-fieldset">
          <legend>Motion</legend>
          <label className="md-widget-toggle">
            <input type="checkbox" role="switch" checked={prefs.calm} onChange={() => update((p) => ({ ...p, calm: !p.calm }))} />
            <span>Calm view (no animations)</span>
          </label>
        </fieldset>

        <div className="md-panel-foot">
          <button type="button" className="md-btn" onClick={() => update(() => ({ ...DEFAULT_PREFS }))}>
            <RotateCcw size={15} aria-hidden="true" /> Reset to default
          </button>
          <span className="md-muted">{SYNC_TEXT[syncState] || SYNC_TEXT.idle}</span>
        </div>
        {syncState === 'local-only' && <Alert type="info">Your changes are kept on this device.</Alert>}
      </aside>
    </div>
  );
}
