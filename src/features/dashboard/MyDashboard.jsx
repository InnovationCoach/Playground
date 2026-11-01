import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowRight, Sparkles, X } from 'lucide-react';
import { INTERESTS } from '../pbl/content/pblModel.js';
import { readiness } from '../pbl/engine/pblProject.js';
import { hrefFor } from '../../app/routes.js';
import { JoinClassPanel } from '../enrolment/JoinClassPanel.jsx';
import { useGoalPlan } from '../goals/useGoalPlan.js';
import { todayItems, checkedToday, toggleToday, toggleStep, setStepQuest } from '../goals/goalPlan.js';
import { NotesWidget } from './NotesWidget.jsx';
import { FocusWidget } from '../focus/FocusWidget.jsx';
import { useFocus } from '../focus/focusStore.js';
import { remainingMs, fmt } from '../focus/focusModel.js';
import { dockStats } from './learningGuidance.js';
import { PersonalSpace, WorkspaceTools } from './PersonalSpace.jsx';
import { FONTS, DISPLAY_FONTS, BACKGROUNDS, THEMES } from './workspaceModel.js';
const FONT_LABELS = { brand: 'WeLearn (brand)', system: 'System', rounded: 'Rounded', serif: 'Serif' };
import { SparkUniverse } from './SparkUniverse.jsx';
import { DIAL_FINISHES } from './instrumentModel.js';
import { SLIDES, moveSlide } from './slideModel.js';
import { DashboardDeck } from './DashboardDeck.jsx';
import { QuestsSlide, useLearningCourses } from './LearningHub.jsx';
import { FindQuestSlide } from './FindQuestSlide.jsx';
import { PortfolioSlide } from '../portfolio/PortfolioSlide.jsx';
import { ACCENTS, COVERS, MAX_INTERESTS, MAX_TAGLINE, loadSignals, academicProgress, badgeStatus, goalSummary, skillOfTheWeek, dayKey, streakDays } from './dashboardModel.js';
import { useDashboardPrefs, useCloudProject, saveMood, deviceStorage, logVisit } from './dashboardStore.js';
import { CheckinWidget, PickedWidget, BadgesWidget, ReadinessWidget, SkillWidget } from './DashboardWidgets.jsx';
import '../admin/admin.css';
import '../pbl/pbl.css';
import '../enrolment/joinPanel.css';
import './myDashboard.css';
import './dashboardStudio.css';
import './instrumentStudio.css';
import './sparkBrand.css';

export function MyDashboard(props) { return <StudentDashboard key={props.uid || 'signed-out'} {...props} />; }

function StudentDashboard({ uid, profile, classIds = [], onJoined, onOpenActivity }) {
  const { prefs, update, syncState } = useDashboardPrefs(uid);
  const { plan, update: updatePlan, syncState: goalSync, loaded: goalsLoaded } = useGoalPlan(uid);
  const cloudProject = useCloudProject(uid);
  const [signals, setSignals] = useState(() => loadSignals(uid, deviceStorage()));
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState('daily');
  const data = useLearningCourses(uid, classIds, profile?.activeProgramId);
  useEffect(() => {
    const visits = logVisit(uid, dayKey(new Date()));
    setSignals((state) => ({ ...state, visits }));
  }, [uid]);
  const project = cloudProject && (cloudProject.updatedAt || 0) > (signals.project.updatedAt || 0) ? cloudProject : signals.project;
  const model = useMemo(() => {
    const ready = readiness(project), goals = goalSummary(plan);
    return {
      goals, academic: academicProgress(signals),
      badges: badgeStatus({ started: signals.started, goals, project, streak: streakDays(signals.visits, signals.today) }),
      pbl: { evidence: project.evidence.length }, checks: ready.checks,
      today: todayItems(plan, signals.today), ticked: checkedToday(plan, signals.today), skill: skillOfTheWeek()
    };
  }, [signals, project, plan]);
  const focusState = useFocus();
  const focusText = focusState.timer.phase !== 'idle' ? fmt(remainingMs(focusState.timer, focusState.now)) : null;
  const stats = dockStats({ data, today: model.today, ticked: model.ticked, plan, goalsLoaded, focus: focusText, playing: focusState.playing });
  const cover = COVERS.find((c) => c.id === prefs.cover) || COVERS[0];
  const accent = (ACCENTS.find((a) => a.id === prefs.accent) || ACCENTS[0]).value;
  function openTarget(target) {
    if (target.type === 'goals') window.location.hash = hrefFor.goals();
    else if (target.type === 'activity') onOpenActivity?.(target.id);
    else window.location.hash = hrefFor.pbl(target.tab);
  }
  function onMood(id) {
    saveMood(uid, id, signals.today);
    setSignals((state) => ({ ...state, mood: id }));
  }
  function renderWidget(id) {
    switch (id) {
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

  function renderSlide(id) {
    if (id === 'daily') return <>
      {uid && classIds.length === 0 && <JoinClassPanel uid={uid} classIds={classIds} onJoined={onJoined} />}
      <QuestsSlide data={data} model={model} plan={plan} project={project} firstName={profile?.displayName?.split(' ')[0]} goalsLoaded={goalsLoaded} goalSync={goalSync}
        onToggleTask={(item) => updatePlan((state) => item.kind === 'task' ? toggleStep(state, item.goalId, item.stepId) : toggleToday(state, item, signals.today))}
        onSetQuest={(goalId, stepId, quest) => updatePlan((state) => setStepQuest(state, goalId, stepId, quest))}
        onOpenActivity={onOpenActivity} onFindQuest={() => setActiveSlide('find')}
        renderReadiness={() => <WorkspaceTools prefs={prefs} slide="daily" renderWidget={renderWidget} />} />
    </>;
    if (id === 'portfolio') return <PortfolioSlide uid={uid} data={data} firstName={profile?.displayName?.split(' ')[0]} />;
    if (id === 'find') return <FindQuestSlide uid={uid} data={data} plan={plan} onOpenActivity={onOpenActivity} />;
    if (id === 'creative') return <PersonalSpace prefs={prefs} update={update} renderWidget={renderWidget} />;
    return <>
      <SparkUniverse prefs={prefs} plan={plan} onPersonalise={() => setPanelOpen(true)} />
      <div className="sd-section-line"><h3>Personal milestones & inspiration</h3><button type="button" className="sd-text-button" onClick={() => setActiveSlide('creative')}>Arrange optional tools <ArrowRight size={16} /></button></div>
      <p className="sd-caption">These existing milestones reflect self-reported actions. They are not verified mastery, XP or unlock evidence.</p>
      <WorkspaceTools prefs={prefs} slide="universe" renderWidget={renderWidget} />
      <a className="sd-link" href={hrefFor.homeSearch()}>Discover a future course <ArrowRight size={16} /></a>
    </>;
  }
  return <div className={`gh-app md-root sd-root${prefs.calm ? ' md-calm' : ''}`}
    data-theme={prefs.theme === 'inherit' ? undefined : prefs.theme} data-dial={prefs.dialFinish}
    style={{ '--md-accent': accent, '--sd-cover': cover.css, '--gh-font': FONTS[prefs.font], '--gh-font-display': DISPLAY_FONTS[prefs.font], fontFamily: FONTS[prefs.font], background: BACKGROUNDS[prefs.background] }}>
    <DashboardDeck prefs={prefs} update={update} syncState={syncState} name={profile?.displayName?.split(' ')[0]} stats={stats}
      onPersonalise={() => setPanelOpen(true)} renderSlide={renderSlide} active={activeSlide} onActive={setActiveSlide} />
    {panelOpen && <CustomisePanel prefs={prefs} update={update} syncState={syncState} onClose={() => setPanelOpen(false)} />}
  </div>;
}

function CustomisePanel({ prefs, update, syncState, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    return () => previous?.focus?.();
  }, []);
  return <dialog ref={dialog} className="sd-personalise" data-theme={prefs.theme === 'inherit' ? undefined : prefs.theme} aria-labelledby="sd-settings-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="sd-dialog-content"><div className="sd-section-line"><h2 id="sd-settings-title">Make it your space</h2><button type="button" className="sd-button" aria-label="Close personalisation" onClick={onClose}><X size={20} /></button></div>
      <p className="sd-caption">Changes save to your existing dashboard preferences. Every dashboard slide stays available.</p>
      <fieldset><legend>Slides</legend><ol className="sd-slide-arrangement">{prefs.slideOrder.map((id, index) => <li key={id}>
        <label><span>{SLIDES.find((slide) => slide.id === id).title}</span><input aria-label={`Rename ${SLIDES.find((slide) => slide.id === id).title}`} maxLength={40} value={prefs.slideTitles[id]} onChange={(event) => update((state) => ({ ...state, slideTitles: { ...state.slideTitles, [id]: event.target.value } }))} /></label>
        <div><button type="button" className="sd-button" disabled={index === 0} aria-label={`Move ${SLIDES.find((s) => s.id === id).title} earlier`} onClick={() => update((state) => moveSlide(state, id, -1))}><ArrowUp size={16} /></button><button type="button" className="sd-button" disabled={index === prefs.slideOrder.length - 1} aria-label={`Move ${SLIDES.find((s) => s.id === id).title} later`} onClick={() => update((state) => moveSlide(state, id, 1))}><ArrowDown size={16} /></button></div>
      </li>)}</ol></fieldset>
      <fieldset><legend>Appearance</legend><div className="sd-style-controls">
        <label>Font<select value={prefs.font} onChange={(event) => update((state) => ({ ...state, font: event.target.value }))}>{Object.keys(FONTS).map((font) => <option value={font} key={font}>{FONT_LABELS[font] || font}</option>)}</select></label>
        <label>Background<select value={prefs.background} onChange={(event) => update((state) => ({ ...state, background: event.target.value }))}>{Object.keys(BACKGROUNDS).map((background) => <option key={background}>{background}</option>)}</select></label>
        <label>Theme<select value={prefs.theme} onChange={(event) => update((state) => ({ ...state, theme: event.target.value }))}>{THEMES.map((theme) => <option value={theme.id} key={theme.id}>{theme.label}</option>)}</select></label>
        <label>Accent colour<select value={prefs.accent} onChange={(event) => update((state) => ({ ...state, accent: event.target.value }))}>{ACCENTS.map((colour) => <option value={colour.id} key={colour.id}>{colour.label}</option>)}</select></label>
        <label>Instrument finish<select value={prefs.dialFinish} onChange={(event) => update((state) => ({ ...state, dialFinish: event.target.value }))}>{DIAL_FINISHES.map((finish) => <option value={finish.id} key={finish.id}>{finish.label}</option>)}</select></label>
        <label>Slide atmosphere<select value={prefs.cover} onChange={(event) => update((state) => ({ ...state, cover: event.target.value }))}>{COVERS.map((cover) => <option value={cover.id} key={cover.id}>{cover.label}</option>)}</select></label>
      </div><label className="sd-check"><input type="checkbox" checked={prefs.calm} onChange={(event) => update((state) => ({ ...state, calm: event.target.checked }))} /> Calm view · no needle movement, animated transitions or decorative effects</label></fieldset>
      <fieldset><legend>Your words & interests</legend><label className="sd-tagline">Personal tagline<input maxLength={MAX_TAGLINE} value={prefs.tagline} onChange={(event) => update((state) => ({ ...state, tagline: event.target.value }))} /></label>
        <p className="sd-caption">Choose up to {MAX_INTERESTS} interests for existing activity suggestions.</p><div className="md-chips">{INTERESTS.map((interest) => <button type="button" key={interest} className="sd-button" aria-pressed={prefs.interests.includes(interest)} disabled={!prefs.interests.includes(interest) && prefs.interests.length >= MAX_INTERESTS} onClick={() => update((state) => ({ ...state, interests: state.interests.includes(interest) ? state.interests.filter((item) => item !== interest) : [...state.interests, interest] }))}>{interest}</button>)}</div>
      </fieldset>
      <p className="sd-caption">Arrange optional tools and your saved personal spaces inside Creative Space. No existing space is removed by changing slide order.</p>
      <div className="sd-section-line"><span role="status" className="sd-caption">{syncState === 'saved' ? 'Appearance saved to your account' : syncState === 'local-only' ? 'Saved on this device · account sync unavailable' : syncState === 'saving' ? 'Saving…' : 'Changes save automatically'}</span><button className="sd-primary" type="button" onClick={onClose}>Done</button></div>
    </div>
  </dialog>;
}
